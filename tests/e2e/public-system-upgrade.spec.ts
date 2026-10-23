import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { ActionRequest, CatalogProduct, CustomerProfile, Order, PortalSnapshot, SessionResponse } from "../../lib/portal-types";

const customerId = "system-upgrade-fixture";
const createdAt = "2026-10-23T08:00:00.000Z";
const profile: CustomerProfile = { id: customerId, name: "Sample Customer", email: "sample@example.test", phone: "000-TEST", address: "", marketingConsent: false, unsubscribed: false, createdAt };
const product = (id: string, name: string, category: string, pack: string, price: number, stock: number): CatalogProduct => ({ id, name, category, pack, price, stock, description: `${name} for sample catalogue evaluation`, image: "/images/products/maize.jpg", imageAlt: "Illustrative maize bag", imageNote: "Category image", taxRate: 0 });
const products = [product("maize-large", "Maize seed large", "Seed", "50 kg", 40000, 20), product("maize-small", "Maize seed small", "Seed", "5 kg", 7000, 0), product("fertiliser", "Compound fertiliser", "Fertiliser", "50 kg", 80000, 5), product("sprayer", "Knapsack sprayer", "Equipment", "16 litre", 30000, 3)];
const order = (id: string, status: Order["status"], productName: string): Order => ({ id, customerId, unitId: "BR-DEMO-01", lines: [{ productId: "maize-large", name: productName, quantity: 2, unitPrice: 40000, subtotal: 80000, tax: 0, taxRate: 0, total: 80000 }], subtotal: 80000, tax: 0, deliveryFee: 0, total: 80000, fulfilment: "pickup", deliveryAddress: "", contact: "000-TEST", status, createdAt, events: [{ at: createdAt, status, note: "Synthetic status", actorId: "fixture" }], invoiceId: `INV-${id}` });

/** Every data request is intercepted. These scenarios never mutate the real rehearsal database. */
async function fixture(page: Page, options: { signedIn?: boolean; cart?: boolean; orders?: Order[] } = {}) {
  const actions: ActionRequest[] = [];
  let customer: PortalSnapshot = { module: "customer", revision: 1, mode: "captured demonstration", profile, cart: options.cart ? [{ productId: "maize-large", customerId, quantity: 2 }] : [], products, orders: options.orders ?? [], notifications: [], invoices: [] };
  await page.route("**/api/session?*", route => route.fulfill({ json: { user: options.signedIn ? { id: customerId, name: profile.name, email: "fatima.customer@accounts.fatima.invalid", role: "customer", unitId: "BR-DEMO-01", managedAccount: true } : null, localDemo: false, signInUrl: "/account", signOutUrl: "/api/session", mode: "captured demonstration", authMode: "fatima" } satisfies SessionResponse }));
  await page.route("**/api/portal?*", route => route.fulfill({ json: new URL(route.request().url()).searchParams.get("module") === "customer" ? customer : { module: "public", revision: 1, mode: "captured demonstration", products, reviews: [] } }));
  await page.route("**/api/portal", async route => {
    const action = route.request().postDataJSON() as ActionRequest;
    actions.push(action);
    if (action.action === "cart.set") {
      const quantity = Number(action.data?.quantity);
      customer = { ...customer, revision: customer.revision + 1, cart: quantity ? [{ customerId, productId: String(action.data?.productId), quantity }] : [] };
      await route.fulfill({ json: { message: "Cart saved.", result: customer.cart, revision: customer.revision } });
    } else if (action.action === "checkout") {
      customer = { ...customer, orders: [order("ORDER-NEW", "Awaiting confirmation", "Maize seed large")], cart: [] };
      await route.fulfill({ json: { message: "Request recorded.", result: { id: "ORDER-NEW" }, revision: 2 } });
    } else throw new Error(`Unexpected action ${action.action}`);
  });
  return actions;
}

test("catalogue search, category, stock and sort work together and survive refresh", async ({ page }) => {
  await fixture(page);
  await page.goto("/catalogue?q=maize%2050&sort=low&available=1");
  await expect(page.getByLabel("Search products")).toHaveValue("maize 50");
  await expect(page.locator(".sf-product-card")).toHaveCount(1);
  await expect(page.locator(".sf-product-card h3")).toHaveText("Maize seed large");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator(".sf-product-card h3")).toHaveText(["Knapsack sprayer", "Maize seed large", "Compound fertiliser"]);
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption("Seed");
  await expect(page.locator(".sf-product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Category", exact: true })).toHaveValue("Seed");
  await expect(page.getByRole("checkbox", { name: "Sample stock available", exact: true })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Sort", exact: true })).toHaveValue("low");
  await expect(page.locator(".sf-product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.locator(".sf-product-card")).toHaveCount(4);
  expect(new URL(page.url()).search).toBe("");
  await page.getByLabel("Search products").fill("missing product");
  await expect(page.getByRole("heading", { name: "No products match your search.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show all products", exact: true }).click();
  await expect(page.locator(".sf-product-card")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Add Maize seed small to cart", exact: true })).toBeDisabled();
});

test("cart edits save explicitly, enforce stock and block checkout with unsaved quantities", async ({ page }) => {
  const actions = await fixture(page, { signedIn: true, cart: true });
  await page.goto("/cart");
  const quantity = page.getByRole("spinbutton", { name: "Quantity for Maize seed large", exact: true });
  await quantity.fill("12");
  await quantity.blur();
  expect(actions).toHaveLength(0);
  await expect(page.getByRole("button", { name: "Submit order request", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Update quantity", exact: true }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0]).toMatchObject({ action: "cart.set", data: { productId: "maize-large", quantity: 12 } });
  await expect(page.getByRole("link", { name: "Cart, 12 items", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity for Maize seed large", exact: true }).click();
  await expect(quantity).toHaveValue("13");
  await quantity.fill("21");
  await expect(quantity).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Update quantity", exact: true })).toBeDisabled();
  expect(actions).toHaveLength(2);
  await quantity.fill("20");
  await page.getByRole("button", { name: "Update quantity", exact: true }).click();
  await expect(page.getByRole("button", { name: "Increase quantity for Maize seed large", exact: true })).toBeDisabled();
});

test("delivery selection requires the location before an order request is submitted", async ({ page }) => {
  const actions = await fixture(page, { signedIn: true, cart: true });
  await page.goto("/cart");
  await page.getByLabel("How would you like to receive your order?").selectOption("delivery-request");
  await expect(page.getByLabel("Town or area", { exact: true })).toHaveAttribute("required", "");
  await expect(page.getByLabel("Delivery address (required for delivery requests)", { exact: true })).toHaveAttribute("required", "");
  await page.getByRole("checkbox", { name: "I understand this is a demonstration request" }).check();
  await page.getByRole("button", { name: "Submit order request", exact: true }).click();
  expect(actions).toHaveLength(0);
  await page.getByLabel("Town or area", { exact: true }).fill("Lilongwe");
  await page.getByLabel("Delivery address (required for delivery requests)", { exact: true }).fill("Synthetic delivery location in Kanengo");
  await page.getByRole("button", { name: "Submit order request", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/orders\/ORDER-NEW$/);
  expect(actions[0]).toMatchObject({ action: "checkout", data: { area: "Lilongwe", address: "Synthetic delivery location in Kanengo", method: "delivery-request" } });
  await expect(page.getByRole("heading", { name: "Your next step", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask about this order", exact: true })).toHaveAttribute("href", "/account#support");
});

test("account orders are searchable and tabs support keyboard and direct support entry", async ({ page }) => {
  await fixture(page, { signedIn: true, orders: [order("ORDER-A", "Completed", "Maize seed large"), order("ORDER-B", "Awaiting confirmation", "Compound fertiliser")] });
  await page.goto("/account");
  await expect(page.locator(".sf-order-row")).toHaveCount(2);
  await page.getByLabel("Search your orders", { exact: true }).fill("fertiliser");
  await expect(page.locator(".sf-order-row")).toHaveCount(1);
  await expect(page.locator(".sf-order-row")).toContainText("ORDER-B");
  await page.getByRole("combobox", { name: "Order status", exact: true }).selectOption("Completed");
  await expect(page.getByRole("heading", { name: "No matching orders", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear order filters", exact: true }).click();
  await expect(page.locator(".sf-order-row")).toHaveCount(2);
  await page.getByRole("tab", { name: "Orders", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Support", exact: true })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Support", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "customer-tab-support");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ask about your account or order", exact: true })).toBeVisible();
  await page.goto("/account#notifications");
  await expect(page.getByRole("tab", { name: "Notifications", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("public navigation and upgraded screens remain usable at phone width", async ({ page }) => {
  await fixture(page, { signedIn: true, cart: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalogue");
  const toggle = page.getByRole("button", { name: "Toggle navigation", exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Contact", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await mkdir("work/system-upgrade-evidence", { recursive: true });
  for (const path of ["/catalogue", "/cart", "/account"]) {
    await page.goto(path);
    await expect(page.locator(".sf-loading")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `work/system-upgrade-evidence/public-${path.slice(1)}-390.png`, fullPage: true });
  }
});
