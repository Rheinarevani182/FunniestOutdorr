import { env } from "../config/env.js";
import { query } from "../config/db.js";

async function callAiService(endpoint, payload) {
  if (!env.AI_SERVICE_URL) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.AI_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Semantic Search Gateway:
 * 1. Tries FastAPI Semantic Search (embedding + pgvector) within AI_TIMEOUT_MS (default 1000ms).
 * 2. Gracefully degrades to PostgreSQL pg_trgm fuzzy/typo search + ILIKE token matching.
 */
export async function searchCatalog(rawQuery) {
  const q = String(rawQuery || "").trim();
  if (!q) {
    return { ids: [], mode: "keyword-fallback", suggestions: [] };
  }

  const aiResp = await callAiService("/search", { query: q });
  if (aiResp && Array.isArray(aiResp.ids)) {
    return {
      ids: aiResp.ids,
      mode: aiResp.mode || "semantic",
      suggestions: Array.isArray(aiResp.suggestions) ? aiResp.suggestions : [],
    };
  }

  // Fallback 1: PostgreSQL pg_trgm (typo-tolerant) + ILIKE
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 8);

  try {
    const { rows } = await query(
      `SELECT
         id,
         name,
         GREATEST(
           similarity(LOWER(name), LOWER($1)),
           similarity(LOWER(tags), LOWER($1)),
           similarity(LOWER(category || ' ' || name || ' ' || tags), LOWER($1))
         ) AS sim,
         CASE
           WHEN LOWER(name) LIKE '%' || LOWER($1) || '%' THEN 2.0
           WHEN LOWER(tags || ' ' || description) LIKE '%' || LOWER($1) || '%' THEN 1.2
           ELSE 0.0
         END AS exact_boost
       FROM items
       WHERE active = TRUE
       ORDER BY (exact_boost + sim) DESC, name ASC`,
      [q],
    );

    const tokenMatches = await query(
      `SELECT id, name, category, tags, description FROM items WHERE active = TRUE`,
    );

    const scoreMap = new Map();
    for (const r of rows) {
      const score = Number(r.exact_boost) + Number(r.sim);
      if (score >= 0.14) {
        scoreMap.set(r.id, { id: r.id, name: r.name, score });
      }
    }

    for (const item of tokenMatches.rows) {
      const hay = `${item.name} ${item.category} ${item.tags} ${item.description}`.toLowerCase();
      let hits = 0;
      for (const tok of tokens) {
        if (hay.includes(tok)) hits += 1;
      }
      if (hits > 0) {
        const prev = scoreMap.get(item.id) || { id: item.id, name: item.name, score: 0 };
        prev.score += hits * 0.6;
        scoreMap.set(item.id, prev);
      }
    }

    const ranked = [...scoreMap.values()].sort((a, b) => b.score - a.score);
    const suggestions = ranked.length && ranked[0].score < 1.0
      ? ranked.slice(0, 3).map((r) => r.name)
      : [];

    return {
      ids: ranked.map((r) => r.id),
      mode: "keyword-fallback",
      suggestions,
    };
  } catch {
    // Fallback 2: Pure SQL ILIKE (when pg_trgm extension is not enabled)
    const { rows } = await query(
      `SELECT id, name, category, tags, description FROM items WHERE active = TRUE`,
    );
    const needle = q.toLowerCase();
    const scored = rows
      .map((item) => {
        const hay = `${item.name} ${item.category} ${item.tags} ${item.description}`.toLowerCase();
        let score = 0;
        if (item.name.toLowerCase().includes(needle)) score += 3;
        if (hay.includes(needle)) score += 1.5;
        for (const tok of tokens) {
          if (hay.includes(tok)) score += 0.6;
        }
        return { id: item.id, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return {
      ids: scored.map((x) => x.id),
      mode: "keyword-fallback",
      suggestions: [],
    };
  }
}

/**
 * Gear Bundling Recommendation Gateway:
 * 1. Tries FastAPI Recommender (Two-Tower / Co-occurrence ML model) within AI_TIMEOUT_MS.
 * 2. Gracefully degrades to PostgreSQL co-occurrence + complementary popular gear
 *    (filtering out items already in cart and same-category substitutes like another tent).
 */
export async function recommendGear(itemIds, limit = 4) {
  const uniqueIds = [...new Set((itemIds || []).filter(Boolean))];
  if (!uniqueIds.length) {
    return { ids: [], mode: "cooccurrence-fallback" };
  }

  const aiResp = await callAiService("/recommend", { item_ids: uniqueIds, top_k: limit });
  if (aiResp && Array.isArray(aiResp.ids)) {
    return {
      ids: aiResp.ids.filter((id) => !uniqueIds.includes(id)).slice(0, limit),
      mode: aiResp.mode || "ml-recommender",
    };
  }

  // Determine categories of items currently in cart to avoid recommending substitutes
  const cartCatRes = await query(
    "SELECT DISTINCT category FROM items WHERE id = ANY($1) AND category <> 'Perlengkapan'",
    [uniqueIds],
  );
  const blockedCategories = cartCatRes.rows.map((r) => r.category);

  // Co-occurrence from historical non-cancelled bookings
  const coocRes = await query(
    `SELECT
       bi2.item_id AS id,
       COUNT(DISTINCT bi2.booking_id)::int AS cooc_count
     FROM booking_items bi1
     JOIN booking_items bi2 ON bi1.booking_id = bi2.booking_id
     JOIN bookings b ON b.id = bi1.booking_id
     JOIN items i2 ON i2.id = bi2.item_id
     WHERE bi1.item_id = ANY($1)
       AND NOT (bi2.item_id = ANY($1))
       AND b.status <> 'cancelled'
       AND i2.active = TRUE
       AND (COALESCE(array_length($2::text[], 1), 0) = 0 OR NOT (i2.category = ANY($2::text[])))
     GROUP BY bi2.item_id
     ORDER BY cooc_count DESC
     LIMIT $3`,
    [uniqueIds, blockedCategories, limit],
  );

  const recommended = coocRes.rows.map((r) => r.id);

  // Fill remaining slots with popular complementary items (prioritizing Perlengkapan)
  if (recommended.length < limit) {
    const excludeIds = [...uniqueIds, ...recommended];
    const remaining = limit - recommended.length;
    const popRes = await query(
      `SELECT
         i.id,
         COALESCE(SUM(bi.quantity), 0)::int AS total_qty,
         CASE WHEN i.category = 'Perlengkapan' THEN 1 ELSE 0 END AS comp_priority
       FROM items i
       LEFT JOIN booking_items bi ON bi.item_id = i.id
       LEFT JOIN bookings b ON b.id = bi.booking_id AND b.status <> 'cancelled'
       WHERE i.active = TRUE
         AND NOT (i.id = ANY($1))
         AND (COALESCE(array_length($2::text[], 1), 0) = 0 OR NOT (i.category = ANY($2::text[])))
       GROUP BY i.id, i.category
       ORDER BY total_qty DESC, comp_priority DESC, i.price ASC
       LIMIT $3`,
      [excludeIds, blockedCategories, remaining],
    );
    for (const row of popRes.rows) {
      recommended.push(row.id);
    }
  }

  return {
    ids: recommended.slice(0, limit),
    mode: "cooccurrence-fallback",
  };
}
