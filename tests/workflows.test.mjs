import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("exposes every required portal through named navigation", () => {
  const portals = [
    "Public website", "Customer portal", "Worker / seller portal", "Service & sales management",
    "Inventory overview", "Finance control", "Contracts & tasks", "Content administration",
    "Executive dashboard", "System administration", "Agent / dealer expansion",
  ];
  for (const portal of portals) assert.match(source, new RegExp(portal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("contains the eight connected demonstration journeys", () => {
  const journeyFragments = [
    "Visitor → enquiry → quote", "Seller → receipt → cash count", "Supplier delivery → stock update",
    "Manager task → worker evidence", "Contract → obligation", "Editor draft → approval",
    "Customer login demo → quote", "Dealer applicant → readiness",
  ];
  for (const fragment of journeyFragments) assert.ok(source.includes(fragment), `Missing journey: ${fragment}`);
});

test("marks public claims, values and expansion status safely", () => {
  assert.match(source, /synthetic data only/i);
  assert.match(source, /indicative/i);
  assert.match(source, /not production software/i);
  assert.match(source, /Future expansion capability/);
  assert.match(source, /does not represent a currently operating/i);
});
