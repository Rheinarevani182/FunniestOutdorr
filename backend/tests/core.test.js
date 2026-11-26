import test from "node:test";
import assert from "node:assert/strict";
import { computePeakAllocated, parseDateRange } from "../src/services/availability.js";
import { calculateDays, normalizeLines, resolveTierFactor } from "../src/services/pricing.js";
import { computeLateMetrics, computePaymentStatus } from "../src/services/bookings.js";

test("computePeakAllocated: non-overlapping future booking returns 0 allocated", () => {
  const existing = [
    { start: Date.parse("2026-11-10T10:00:00+07:00"), end: Date.parse("2026-11-12T10:00:00+07:00"), qty: 3 },
  ];
  const peak = computePeakAllocated(
    existing,
    Date.parse("2026-11-17T10:00:00+07:00"),
    Date.parse("2026-11-19T10:00:00+07:00"),
  );
  assert.equal(peak, 0);
});

test("computePeakAllocated: overlapping booking detects exact conflict", () => {
  const existing = [
    { start: Date.parse("2026-11-10T10:00:00+07:00"), end: Date.parse("2026-11-12T10:00:00+07:00"), qty: 3 },
  ];
  const peak = computePeakAllocated(
    existing,
    Date.parse("2026-11-11T10:00:00+07:00"),
    Date.parse("2026-11-13T10:00:00+07:00"),
  );
  assert.equal(peak, 3);
});

test("computePeakAllocated: back-to-back bookings do not double count", () => {
  const existing = [
    { start: Date.parse("2026-11-10T10:00:00+07:00"), end: Date.parse("2026-11-12T10:00:00+07:00"), qty: 2 },
    { start: Date.parse("2026-11-12T10:00:00+07:00"), end: Date.parse("2026-11-14T10:00:00+07:00"), qty: 2 },
  ];
  const peak = computePeakAllocated(
    existing,
    Date.parse("2026-11-10T10:00:00+07:00"),
    Date.parse("2026-11-14T10:00:00+07:00"),
  );
  assert.equal(peak, 2);
});

test("parseDateRange rejects end <= start", () => {
  assert.throws(
    () => parseDateRange("2026-11-12T10:00:00+07:00", "2026-11-12T10:00:00+07:00"),
    /Tanggal kembali harus lebih lambat/,
  );
});

test("tiered pricing factor & days calculation", () => {
  const tiers = [
    { min_days: 1, factor: 1 },
    { min_days: 3, factor: 0.9 },
    { min_days: 5, factor: 0.85 },
  ];
  assert.equal(calculateDays("2026-11-10T10:00:00+07:00", "2026-11-12T10:00:00+07:00"), 2);
  assert.equal(resolveTierFactor(tiers, 2), 1);
  assert.equal(resolveTierFactor(tiers, 3), 0.9);
  assert.equal(resolveTierFactor(tiers, 6), 0.85);
});

test("normalizeLines merges duplicate variants cleanly (10+ item POS safety)", () => {
  const lines = normalizeLines([
    { variant_id: "v1", quantity: 2 },
    { variant_id: "v2", quantity: 1 },
    { variant_id: "v1", quantity: 3 },
  ]);
  assert.deepEqual(lines, [
    { variant_id: "v1", quantity: 5 },
    { variant_id: "v2", quantity: 1 },
  ]);
});

test("payment status & late fee computation", () => {
  assert.equal(computePaymentStatus({ total: 100000, rental: 100000, paid: 0 }), "unpaid");
  assert.equal(computePaymentStatus({ total: 100000, rental: 100000, paid: 50000 }), "dp_paid");
  assert.equal(computePaymentStatus({ total: 100000, rental: 100000, paid: 100000 }), "paid");

  const pastEnd = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
  const late = computeLateMetrics(
    { status: "rented", end_at: pastEnd },
    [{ unit_price: 45000, quantity: 1 }, { unit_price: 8000, quantity: 2 }],
    { late_daily: 0 },
  );
  assert.equal(late.late_days, 2);
  assert.equal(late.late_rate, 61000);
  assert.equal(late.late_fee, 122000);
});
