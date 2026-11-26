import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { recommendGear, searchCatalog } from "../services/aiGateway.js";

const router = Router();

const searchSchema = z.object({
  query: z.string().max(300).default(""),
});

const recommendSchema = z.object({
  item_ids: z.array(z.string().min(1)).max(50).default([]),
  limit: z.coerce.number().int().min(1).max(12).optional().default(4),
});

router.post("/search", validate(searchSchema), async (req, res) => {
  const result = await searchCatalog(req.body.query);
  res.json(result);
});

router.post("/recommend", validate(recommendSchema), async (req, res) => {
  const result = await recommendGear(req.body.item_ids, req.body.limit);
  res.json(result);
});

export default router;
