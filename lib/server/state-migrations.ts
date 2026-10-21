import type { PortalState } from "./seed";
import { ensure } from "./errors";

const knownSkus: Record<string, string> = {
  "demo-fertiliser": "FA-FERT-50KG", "demo-urea": "FA-UREA-50KG", "demo-maize": "FA-MAIZE-10KG",
  "demo-groundnut": "FA-GROUNDNUT-20KG", "demo-crop-care": "FA-CROP-5L", "demo-sprayer": "FA-SPRAYER-16L",
};
export function defaultSku(productId: string) {
  return knownSkus[productId] ?? `FA-${productId.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "PRODUCT"}`.slice(0, 32);
}

/** Additive migration only. Existing financial, stock, account and location values are never reseeded. */
export function normalizeState(input: PortalState): PortalState {
  const state = structuredClone(input);
  for (const key of ["stockAdjustments", "stockTransfers", "receiptCaptures"] as const) {
    if (state[key] === undefined) state[key] = [];
    ensure(Array.isArray(state[key]), "Stored inventory records require a reviewed recovery.", 503, "STORAGE_INVALID");
  }
  const owners = new Map<string, string>();
  for (const product of state.products) {
    for (const value of [product.id, product.sku, product.barcode]) if (typeof value === "string" && value) {
      const normalized = value.toUpperCase();
      ensure(!owners.has(normalized) || owners.get(normalized) === product.id, "Stored product identifiers need a uniqueness review.", 503, "STORAGE_INVALID");
      owners.set(normalized, product.id);
    }
  }
  for (const product of state.products) {
    if (product.sku === undefined) {
      const base = defaultSku(product.id);
      let candidate = base, suffix = 2;
      while (owners.has(candidate) && owners.get(candidate) !== product.id) {
        const ending = `-${suffix++}`;
        candidate = `${base.slice(0, 32 - ending.length)}${ending}`;
      }
      product.sku = candidate;
      owners.set(candidate, product.id);
    }
    ensure(typeof product.sku === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/.test(product.sku), "Stored product identifiers require a reviewed recovery.", 503, "STORAGE_INVALID");
    if (product.barcode === undefined) {
      product.barcode = product.sku;
      owners.set(product.barcode.toUpperCase(), product.id);
    }
    if (product.barcodeKind === undefined) product.barcodeKind = "Internal Code 128";
    ensure(typeof product.barcode === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,47}$/.test(product.barcode)
      && product.barcodeKind === "Internal Code 128", "Stored product identifiers require a reviewed recovery.", 503, "STORAGE_INVALID");
  }
  for (const unit of state.units) {
    if (unit.id === "HQ" || unit.id === "BR-DEMO-01") {
      if (unit.address === undefined) unit.address = "Kanengo";
      if (unit.town === undefined) unit.town = "Lilongwe";
      if (unit.country === undefined) unit.country = "Malawi";
      if (unit.locationNote === undefined) unit.locationNote = "Kanengo, Lilongwe operating area; exact premises and coordinates require confirmation.";
    }
  }
  return state;
}
