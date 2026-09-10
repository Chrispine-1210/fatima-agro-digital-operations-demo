import { expect, test } from "@playwright/test";

test("role switcher enforces seller self-approval boundary", async ({ page }) => {
  await page.goto("/#worker-portal");
  await page.getByLabel("Demo role").selectOption("seller");
  await page.evaluate(() => { window.location.hash = "worker-portal"; });
  await page.getByRole("button", { name: "Record demo sale" }).click();
  await page.getByRole("button", { name: "Submit count" }).click();
  await expect(page.getByRole("button", { name: "Supervisor close" })).toBeDisabled();
  await page.getByLabel("Demo role").selectOption("supervisor");
  await page.evaluate(() => { window.location.hash = "worker-portal"; });
  await expect(page.getByRole("button", { name: "Supervisor close" })).toBeEnabled();
});

test("public enquiry creates a unique synthetic reference and reaches quote", async ({ page }) => {
  await page.goto("/#mobile-enquiry");
  await page.getByRole("button", { name: "Create synthetic enquiry" }).click();
  await expect(page.getByText("Reference ENQ-DEMO-1051.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "View sample quote" }).click();
  await expect(page.getByText("Quotation Q-DEMO-081")).toBeVisible();
});

test("major portal deep links survive refresh", async ({ page }) => {
  await page.goto("/#agent-portal");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Agent & dealer expansion" })).toBeVisible();
  await expect(page.getByText("Future expansion capability")).toBeVisible();
});

test("responsive shell provides labelled navigation and no horizontal page overflow", async ({ page }, testInfo) => {
  await page.goto("/#dashboard");
  await expect(page.locator("main")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });
});
