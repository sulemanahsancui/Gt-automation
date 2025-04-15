import { Browser, Page } from "puppeteer";
import { logger, newBrowser, newPage } from "./lib";

async function run() {
  logger.info("Starting Bot...");
  const browser: Browser = await newBrowser();
  const page: Page = await newPage(browser);
}

run();
