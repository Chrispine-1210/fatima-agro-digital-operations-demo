import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { ActionRequest, CustomerProfile, Order, PortalSnapshot, Review, SessionResponse } from "../../lib/portal-types";

const customerId = "ux-fixture-customer";
const timestamp = "2026-10-19T08:00:00.000Z";
const profile: CustomerProfile = { id: customerId, name: "Sample Reviewer", email: "reviewer@example.test", phone: "TEST-ONLY", address: "Lilongwe test location", marketingConsent: false, unsubscribed: false, createdAt: timestamp };
const publicSnapshot: PortalSnapshot = { module: "public", mode: "captured demonstration", revision: 1, products: [], reviews: [] };
const order = (id: string): Order => ({ id, customerId, unitId: "hq", lines: [], subtotal: 1000, tax: 0, deliveryFee: 0, total: 1000, fulfilment: "pickup", deliveryAddress: "", contact: "TEST-ONLY", status: "Completed", createdAt: timestamp, events: [], invoiceId: `INV-${id}` });
const review = (orderId: string): Review => ({ id: `REV-${orderId}`, customerId, orderId, name: "Sample", rating: 4, text: "Synthetic review used only for the customer interface test.", publicationConsent: true, status: "Pending moderation", createdAt: timestamp });
const customerSnapshot = (overrides: Partial<PortalSnapshot> = {}): PortalSnapshot => ({ module: "customer", mode: "captured demonstration", revision: 1, profile, products: [], orders: [], reviews: [], cart: [], notifications: [], ...overrides });

type MockOptions = { customer?: PortalSnapshot; sessionGate?: Promise<void>; onAction?: (action: ActionRequest) => void };
async function mockCustomerData(page: Page, options: MockOptions = {}) {
  let account = options.customer;
  await page.route("**/api/session?*", async route => {
    await options.sessionGate;
    const returnTo = new URL(route.request().url()).searchParams.get("returnTo") ?? "/account";
    const session: SessionResponse = { user: account ? { id: customerId, name: profile.name, email: profile.email, role: "customer", unitId: "hq" } : null, localDemo: false, signInUrl: `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`, signOutUrl: "/signout-with-chatgpt?return_to=%2F", mode: "captured demonstration", registrationRequired: Boolean(account && !account.profile) };
    await route.fulfill({ json: session });
  });
  await page.route("**/api/portal?*", route => {
    const module = new URL(route.request().url()).searchParams.get("module");
    return route.fulfill({ json: module === "customer" ? account : publicSnapshot });
  });
  await page.route("**/api/portal", async route => {
    if (route.request().method() !== "POST") throw new Error("Unexpected unscoped portal request");
    const action = route.request().postDataJSON() as ActionRequest;
    options.onAction?.(action);
    if (action.action !== "review.create" || !account) throw new Error(`Unexpected mocked action: ${action.action}`);
    const data = action.data!;
    const submitted: Review = { ...review(String(data.orderId)), rating: Number(data.rating), text: String(data.text), name: String(data.name) };
    account = { ...account, revision: account.revision + 1, reviews: [...account.reviews ?? [], submitted] };
    await route.fulfill({ json: { message: "Feedback received for review.", result: submitted, revision: account.revision } });
  });
}

// These fixtures intercept every business request; these tests do not reset or write D1.
test("public help routes remain usable on desktop and mobile", async ({ page }) => {
  await mockCustomerData(page);
  await mkdir("work/public-ux-evidence", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const path of ["/", "/catalogue", "/news", "/contact", "/about", "/careers", "/reviews"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator(".sf-loading")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: `work/public-ux-evidence/${path==="/"?"home":path.slice(1)}-${width}.png`, fullPage: true });
      await page.reload();
      await expect(page.locator("main h1")).toBeVisible();
    }
  }
});

test("collection enquiry starts in the form and public service actions have useful destinations", async ({ page }) => {
  await mockCustomerData(page);
  await page.goto("/contact");
  await page.getByRole("button", { name: "Enquire about collection", exact: true }).click();
  await expect(page.getByLabel("Product or subject", { exact: true })).toHaveValue("Collection enquiry");
  await expect(page.getByLabel("Product or subject", { exact: true })).toBeFocused();
  await expect(page.locator("main")).toContainText("Kanengo, Lilongwe");
  await expect(page.locator("main")).not.toContainText("no delivery partner is connected", { ignoreCase: true });
  await page.goto("/about");
  const cards = page.locator(".sf-service-card");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    const action = card.getByRole("link");
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute("href", /^\/(contact|catalogue|account)(?:[?#].*)?$/);
  }
  await page.goto("/careers");
  await expect(page.getByText("No vacancies currently published", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View public updates", exact: true })).toHaveAttribute("href", "/news");
});

test("feedback waits for session lookup and keeps the sign-in return destination", async ({ page }) => {
  let releaseSession!: () => void;
  const sessionGate = new Promise<void>(resolve => { releaseSession = resolve; });
  await mockCustomerData(page, { sessionGate });
  try {
    await page.goto("/reviews");
    await expect(page.locator(".sf-loading").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to your account", exact: true })).toHaveCount(0);
  } finally {
    releaseSession();
  }
  const signIn = page.getByRole("link", { name: "Sign in to your account", exact: true });
  await expect(signIn).toBeVisible();
  const target = new URL((await signIn.getAttribute("href"))!, page.url());
  expect(target.pathname).toBe("/account");
  expect(target.searchParams.get("returnTo")).toBe("/reviews");
});

test("feedback sends customers without a profile to profile completion", async ({ page }) => {
  await mockCustomerData(page, { customer: customerSnapshot({ profile: null }) });
  await page.goto("/reviews");
  await expect(page.getByRole("link", { name: "Complete your profile", exact: true })).toHaveAttribute("href", "/account/register?returnTo=%2Freviews");
  await expect(page.locator('select[name="orderId"]')).toHaveCount(0);
});

test("customers with no orders receive a useful starting point", async ({ page }) => {
  await mockCustomerData(page, { customer: customerSnapshot() });
  await page.goto("/reviews");
  await expect(page.getByRole("heading", { name: "Your first review starts with an order.", exact: true })).toBeVisible();
  await expect(page.locator('select[name="orderId"]')).toHaveCount(0);
  await expect(page.locator("main").getByRole("link", { name: "Browse products", exact: true })).toHaveAttribute("href", "/catalogue");
});

test("customers see their pending feedback after all orders have been reviewed", async ({ page }) => {
  await mockCustomerData(page, { customer: customerSnapshot({ orders: [order("ORDER-A")], reviews: [review("ORDER-A")] }) });
  await page.goto("/reviews");
  await expect(page.getByRole("heading", { name: "Thank you for sharing your experience.", exact: true })).toBeVisible();
  await expect(page.getByText("Pending moderation", { exact: true })).toBeVisible();
  await expect(page.locator('select[name="orderId"]')).toHaveCount(0);
});

test("review form excludes reviewed orders, requires consent and reflects successful submission", async ({ page }) => {
  const actions: ActionRequest[] = [];
  await mockCustomerData(page, { customer: customerSnapshot({ orders: [order("ORDER-A"), order("ORDER-B")], reviews: [review("ORDER-A")] }), onAction: action => actions.push(action) });
  await page.goto("/reviews");
  const select = page.getByRole("combobox", { name: "Order reference", exact: true });
  await expect(select.locator("option")).toHaveCount(2);
  await expect(select.locator('option[value="ORDER-A"]')).toHaveCount(0);
  await select.selectOption("ORDER-B");
  await page.getByRole("combobox", { name: "Your rating", exact: true }).selectOption("4");
  await expect(page.getByRole("combobox", { name: "Your rating", exact: true }).locator("option:checked")).toHaveText("4 out of 5");
  await page.getByLabel("Your feedback", { exact: true }).fill("This synthetic interface test confirms the review submission flow.");
  const consent = page.locator('input[name="publicationConsent"]');
  await expect(consent).toHaveAttribute("required", "");
  await page.getByRole("button", { name: "Submit for review", exact: true }).click();
  await expect(consent).toBeFocused();
  expect(actions).toHaveLength(0);
  await consent.check();
  await page.getByRole("button", { name: "Submit for review", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thank you for sharing your experience.", exact: true })).toBeVisible();
  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({ action: "review.create", data: { orderId: "ORDER-B", rating: 4, publicationConsent: true } });
  await expect(page.getByText("Pending moderation", { exact: true })).toHaveCount(2);
});

test("session GET exposes only the Fatima sign-in entry for all requested destinations", async ({ request }) => {
  for (const [destination, expected] of [["/reviews", "/reviews"], ["//evil.example", "/account"], ["https://evil.example/reviews", "/account"], ["%2F%2Fevil.example", "/account"], ["/%2F%2Fevil.example", "/account"], ["/\\evil.example", "/account"]]) {
    const response = await request.get(`/api/session?returnTo=${encodeURIComponent(destination)}`);
    expect(response.status()).toBe(200);
    const session = await response.json() as SessionResponse;
    const signIn = new URL(session.signInUrl, "https://fatima.example");
    expect(signIn.origin).toBe("https://fatima.example");
    expect(signIn.pathname).toBe("/account");
    expect(session.authMode).toBe("fatima");
    expect(signIn.searchParams.get("return_to")).toBeNull();
  }
});

test("a submitted enquiry shows the reference needed for follow-up", async ({ page }) => {
  await mockCustomerData(page);
  let submitted: ActionRequest | undefined;
  await page.route("**/api/portal", async route => {
    submitted=route.request().postDataJSON() as ActionRequest;
    await route.fulfill({json:{message:"Enquiry recorded.",result:{id:"ENQ-UX-FIXTURE"},revision:2}});
  });
  await page.goto("/contact");
  await page.getByLabel("Your name",{exact:true}).fill("Sample enquiry customer");
  await page.getByLabel("Email",{exact:true}).fill("customer@example.test");
  await page.getByLabel("Product or subject",{exact:true}).fill("Collection enquiry");
  await page.getByLabel("What would you like to know?",{exact:true}).fill("Please confirm a collection time for this synthetic test.");
  await page.getByRole("checkbox",{name:"I have read the"}).check();
  await page.getByRole("button",{name:"Submit enquiry",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("ENQ-UX-FIXTURE");
  expect(submitted).toMatchObject({action:"enquiry.create",data:{subject:"Collection enquiry"}});
});
