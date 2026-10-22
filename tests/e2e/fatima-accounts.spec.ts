import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
type Account = { username: string; password: string; role: string; path: string; accountId: string };
const accounts: Account[] = JSON.parse(readFileSync("work/native-auth-qa.json", "utf8")).accounts;
const account = (role: string) => accounts.find(row => row.role === role)!;
async function login(request: APIRequestContext, baseURL: string, row: Account, returnTo?: string) {
  const response = await request.post("/api/session", { headers: { Origin: new URL(baseURL).origin }, data: { action: "login", username: row.username, password: row.password, returnTo } });
  expect(response.status()).toBe(200); const result = await response.json(); expect(result.user.role).toBe(row.role); expect(result.redirectTo).toBe(returnTo ?? row.path); return response;
}
test("issued CEO credentials sign in through the real API, refresh and sign out", async ({ page, baseURL }) => {
  await page.goto("/hq/executive"); await expect(page).toHaveURL(/\/account\?returnTo=/);
  const form = page.getByRole("form", { name: "Fatima account sign-in" }); await expect(form).toBeVisible();
  await expect(page.getByRole("link", { name: /ChatGPT|Google|create an account|recover/i })).toHaveCount(0);
  await form.getByLabel("Username", { exact: true }).fill(account("ceo").username);
  await form.getByLabel("Password", { exact: true }).fill(account("ceo").password);
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/hq\/executive$/);
  await expect(page.getByRole("heading", { name: "Executive overview", exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "Executive overview", exact: true })).toBeVisible();
  const cookie = (await page.context().cookies()).find(row => row.name === "fatima_session")!;
  expect(cookie.httpOnly).toBe(true); expect(cookie.sameSite).toBe("Strict"); expect(cookie.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const hr = await page.context().request.get("/api/portal?module=hr"); expect(hr.status()).toBe(403);
  mkdirSync("work/native-auth-evidence", { recursive: true }); await page.screenshot({ path: "work/native-auth-evidence/fatima-ceo-dashboard.png" });
  await page.getByRole("button", { name: "Sign out", exact: true }).click(); await expect(page).toHaveURL(/\/account$/);
  const denied = await page.context().request.get("/api/portal?module=executive"); expect(denied.status()).toBe(401);
});
test("all thirteen issued roles enter only their authorised portals without registration", async ({ page, baseURL }) => {
  for (const row of accounts) {
    await login(page.context().request, baseURL!, row);
    const module = row.role === "customer" ? "customer" : row.path.split("/")[2];
    const view = await page.context().request.get(`/api/portal?module=${module}`); expect(view.status(), row.role).toBe(200);
    const payload = await view.json(); expect(payload.capabilities).not.toContain("admin.applyRole"); expect(payload.capabilities).not.toContain("customer.register");
    expect(JSON.stringify(payload)).not.toMatch(/PBKDF2|FATIMA_PASSWORD_PEPPER|tokenHash|credentialVersion|"digest"/);
    if (row.role !== "ceo") expect((await page.context().request.get("/api/portal?module=executive")).status(), row.role).toBe(403);
    if (row.role === "customer") expect(payload.profile.id).toBe(row.accountId);
    for (const action of ["admin.roleRequest", "admin.roleDecision", "admin.applyRole", "customer.register"]) {
      const change = await page.context().request.post("/api/portal", { headers: { Origin: new URL(baseURL!).origin }, data: { action, data: {} } }); expect(change.status(), `${row.role} ${action}`).toBe(403);
    }
  }
});
test("wrong and unknown credentials fail alike and persistent attempt limits apply", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const results = [];
  for (const username of [account("hr").username, `unknown.${Date.now()}`]) {
    const response = await page.context().request.post("/api/session", { headers: { Origin: origin }, data: { action: "login", username, password: crypto.randomUUID() } });
    expect(response.status()).toBe(401); results.push((await response.json()).error);
  }
  expect(results[0]).toBe(results[1]);
  const username = `limit.${Date.now()}`;
  for (let i = 0; i < 11; i++) {
    const response = await page.context().request.post("/api/session", { headers: { Origin: origin }, data: { action: "login", username, password: crypto.randomUUID() } });
    expect(response.status()).toBe(i < 10 ? 401 : 429);
  }
});
test("provider headers, cross-site login and browser provisioning cannot grant access", async ({ page, baseURL }) => {
  const request = page.context().request;
  const spoofed = await request.get("/api/session", { headers: { "oai-authenticated-user-id": "spoofed", "oai-authenticated-user-email": "fagrodealers@gmail.com" } });
  expect((await spoofed.json()).user).toBeNull();
  const crossSite = await request.post("/api/session", { headers: { Origin: "https://unrelated.invalid" }, data: { action: "login", username: account("ceo").username, password: account("ceo").password } }); expect(crossSite.status()).toBe(403);
  for (const action of ["register", "reset", "provision", "rotate", "assign"]) {
    const response = await request.post("/api/session", { headers: { Origin: new URL(baseURL!).origin }, data: { action, role: "ceo" } }); expect(response.status()).toBe(403);
  }
  expect((await request.get("/api/portal?module=admin")).status()).toBe(401);
});
test("a replacement login and logout revoke copied session cookies on the server", async ({ browser, baseURL }) => {
  const first = await browser.newContext({ baseURL }), second = await browser.newContext({ baseURL });
  try {
    await login(first.request, baseURL!, account("sales"));
    expect((await first.request.get("/api/portal?module=procurement")).status()).toBe(200);
    await login(second.request, baseURL!, account("sales"));
    expect((await first.request.get("/api/portal?module=procurement")).status()).toBe(401);
    const cookie = (await second.cookies()).find(row => row.name === "fatima_session")!;
    const response = await second.request.post("/api/session", { headers: { Origin: new URL(baseURL!).origin }, data: { action: "logout" } }); expect(response.status()).toBe(200);
    const replay = await second.request.get("/api/portal?module=procurement", { headers: { Cookie: `fatima_session=${cookie.value}` } }); expect(replay.status()).toBe(401);
  } finally { await first.close(); await second.close(); }
});
test("login fits desktop and phone viewports and supports a provisioned customer account", async ({ page, baseURL }) => {
  mkdirSync("work/native-auth-evidence", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 }); await page.goto("/account");
    await expect(page.getByRole("form", { name: "Fatima account sign-in" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `work/native-auth-evidence/fatima-login-${width}.png`, fullPage: true });
  }
  await login(page.context().request, baseURL!, account("customer")); await page.reload();
  await expect(page.getByRole("tab", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /create.*profile/i })).toHaveCount(0);
});
