import puppeteer from "puppeteer-extra";
import { Browser, Page } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Use the stealth plugin
puppeteer.use(StealthPlugin());
/**
 *
 * @param proxy
 * @param cookies
 * @param userId
 * @returns
 */
export const newBrowser = async () => {
  try {
    const { HEADLESS } = process.env as any;
    const parts = process.cwd().split("/"); // USE IT IF NEED TO PERSIST BROWSER
    const browser = await puppeteer.launch({
      headless: HEADLESS,
      args: [
        "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36",
      ],
    });

    return browser;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 *
 * @param browser
 * @param url
 * @param cookies
 * @returns
 */

export const newPage = async (browser: Browser, url: string): Promise<Page> => {
  if (!browser) throw new Error("Browser is not initialized!");

  // Create a new page inside context.
  const page = await browser.newPage();

  await page.setDefaultTimeout(60000);

  await page.goto(url, { waitUntil: "networkidle0" });

  return page;
};

/**
 *
 * @param browser
 */
export const closeSession = async (browser: Browser) => {
  try {
    if (!browser) throw new Error("Browser is required!");
    await browser.close();
  } catch (error) {
    return Promise.reject(error);
  }
};
 
