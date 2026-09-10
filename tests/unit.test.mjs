import assert from "node:assert/strict";
import test from "node:test";

import { advanceShift, canAdvanceShift, syntheticReference } from "../lib/demo-workflows.ts";

test("creates unique, explicitly synthetic references", () => {
  assert.equal(syntheticReference("ENQ", 51), "ENQ-DEMO-0051");
  assert.notEqual(syntheticReference("RCPT", 184), syntheticReference("RCPT", 185));
  assert.throws(() => syntheticReference("ORDER", 0), /positive integer/);
});

test("enforces seller and supervisor separation of duties", () => {
  assert.equal(canAdvanceShift("open", "record-sale", "seller"), true);
  assert.equal(advanceShift("open", "record-sale", "seller"), "sale");
  assert.equal(advanceShift("submitted", "approve-close", "seller"), "submitted");
  assert.equal(advanceShift("submitted", "approve-close", "supervisor"), "approved");
});

test("requires finance or management for deposit and reconciliation", () => {
  assert.equal(canAdvanceShift("approved", "create-deposit", "seller"), false);
  assert.equal(advanceShift("approved", "create-deposit", "finance"), "deposited");
  assert.equal(advanceShift("deposited", "reconcile", "finance"), "reconciled");
});
