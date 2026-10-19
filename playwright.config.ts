import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe") ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
export default defineConfig({
 testDir:"./tests/e2e", outputDir:"test-results/playwright", workers:1, fullyParallel:false, timeout:180000,
 expect:{timeout:15000},
 reporter:[["list"],["html",{outputFolder:"playwright-report",open:"never"}]],
 use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||"http://127.0.0.1:5173",launchOptions:{executablePath},actionTimeout:15000,navigationTimeout:30000,trace:"retain-on-failure",screenshot:"only-on-failure",viewport:{width:1440,height:1000}},
 webServer:process.env.PLAYWRIGHT_BASE_URL?undefined:{command:`"${process.execPath}" scripts/start-demo.mjs`,url:"http://127.0.0.1:5173",reuseExistingServer:true,timeout:180000},
});
