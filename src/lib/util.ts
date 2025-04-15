import CryptoJS from "crypto-js";
import moment from "moment";
import { Page } from "puppeteer";

export function encrypt(message: string, secretKey: string): string {
  return CryptoJS.AES.encrypt(message, secretKey).toString();
}

export function decrypt(ciphertext: string, secretKey: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * @param  {number} sec
 */
export const waitFor = (sec: number = 1) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, sec * 1000);
  });
};

/**
 *
 * @param text
 * @returns
 */
export const replaceRegex = (text: string): string =>
  text.replace(/\n\s*\n/g, " ").trim();

/**
 *
 * @param fn
 * @returns
 */
export const tryCatchWrapper = (fn: Function) => {
  try {
    return Promise.resolve(fn());
  } catch (error) {
    console.log("ERROR");
    throw error;
  }
};

/**
 *
 * @param time
 * @returns
 */
export const checkTimeIsValid = (time: any) => {
  const timeFormat = [
    "H:mm",
    "HH:mm",
    "h:mm",
    "h:mm a",
    "hh:mm",
    "hh.mm",
    "h.mm",
    "hh:mm a",
  ];
  for (let index = 0; index < timeFormat.length; index++) {
    const format = timeFormat[index];
    if (moment(time, format, true).isValid()) return format;
  }
  return false;
};

/**
 *
 * @param date
 * @param format
 * @returns
 */
export const checkDateIsValid = (date: any, format: string) => {
  return moment(date, format, true).isValid();
};

/**
 *
 * @param className
 * @param domElement
 * @returns
 */
export const getCSSClass = (className: string = "", domElement = "div") =>
  domElement + "." + replaceAll(className, " ", ".");

/**
 *
 * @param str
 * @param find
 * @param replace
 * @returns
 */
export const replaceAll = (str: string, find: string, replace: string) =>
  str.replace(new RegExp(find, "g"), replace);

/**
 *
 * @param obj
 * @returns
 */
export const getStringFromJSON = (obj: any) => {
  if (typeof obj === "string") return obj;
  if (typeof obj === "object") return JSON.stringify(obj);
};

/**
 *
 * mimic human behaviour auto scroll the page
 * @page
 */
export const autoScroll = async (page: Page) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
};

/**
 * Create a support ticket
 */

const createTicket = (reason: string | false) => {};

/**
 * Ends the execution with optional reason and updates logs/orders accordingly.
 * @param {string | false} reason
 */
const endExecution = async (
  reason: string | false = false,
  page: Page,
  pageCount: number
): Promise<void> => {
  await page.screenshot(); // Assuming screenshot() method exists

  const order_bot_failed_at = new Date().toISOString();
  const order_bot_fail = 1;

  let validationError = false;
  let fullReason: string;

  const currentUrl = await page.url();

  // Generate detailed reason message
  if (
    !validationError &&
    (reason === "Wrong URL" || reason?.startsWith("No node found for selector"))
  ) {
    fullReason = `${reason} | Page #: ${pageCount} | U: ${currentUrl}`;
  } else if (validationError) {
    fullReason = `${validationError} | Page #: ${pageCount}`;
  } else {
    fullReason = `${reason} | Page #: ${pageCount}`;
  }

  const order_bot_message = fullReason;

  const reasons: Record<string, number> = {
    "birthplace-mismatch": 4,
    "dob-mismatch": 4,
    "name-mismatch": 4,
    "incorrect-passport": 5,
    "wrong-passid": 3,
    "verify-address": 4,
  };

  // Create support ticket if applicable
  if (reason && reasons.hasOwnProperty(reason)) {
    const ticketCreated: any = await createTicket(reason);
    if (ticketCreated) {
      const order_status = 9;
      const order_reason = reasons[reason];
    }
  }

  // await this.order.save();

  // Update bot log if available
  if (this.bot_log) {
    let additionalBotMessage = "";

    if (this.captcha_min_score !== undefined) {
      additionalBotMessage += `Min captcha score: ${this.captcha_min_score} | `;
    }

    if (this.randomized_mouse_movements !== undefined) {
      additionalBotMessage += `RMM: ${this.randomized_mouse_movements} | `;
    }

    if (this.user_agent_id !== undefined) {
      additionalBotMessage += `UA: ${this.user_agent_id} | `;
    }

    this.bot_log.bot_message = `${additionalBotMessage} | ${fullReason}`;
    await this.bot_log.save();
  }

  // Cancel execution
  this.stop = true;
};

/**
 * Check if we're on the right page
 * @param {string} url - Target URL or substring to match
 * @param {boolean} exact - Whether to match exactly or check if URL includes substring
 * @param {boolean} noError - If true, won't trigger endExecution on mismatch
 * @returns {Promise<boolean>}
 */
export const rightPage = async (
  url: string,
  exact = true,
  noError = false,
  page: Page
): Promise<boolean> => {
  const currentUrl = page.url().split("?")[0];

  if (!exact) {
    return currentUrl.includes(url);
  }

  if (currentUrl !== url) {
    if (noError) return false;

    const urlParts = currentUrl.split("/");
    const page = urlParts[urlParts.length - 1];

    const pageErrors: Record<string, string> = {
      "drivers-license": "Problem on Driver's License page.",
      documents: "Problem on Passport page.",
      "vehicle-info": "Problem on Vehicle page.",
      "address-history": "Problem on Addresses page.",
      "employment-history": "Problem on Employment page.",
      "travel-history": "Problem on Travel History page.",
      "additional-info": "Problem on Additional Info page.",
      "final-review": "Problem on Final Review page.",
      "program-certification": "Problem on Certification/Agreement page.",
    };

    const urlErrors: Record<string, string> = {
      "https://ttp.cbp.dhs.gov/": "Problem on the Start page.",
      "https://ttp.cbp.dhs.gov/dashboard": "Problem on the Start page.",
      "https://secure.login.gov/login/two_factor/authenticator":
        "Problem on 2 Factor Auth page.",
      "https://ttp.cbp.dhs.gov/getstarted;stepDone=3":
        "Problem on Next Steps page.",
      "https://ttp.cbp.dhs.gov/program-selection/select-program":
        "Problem on Select Program page.",
      "https://ttp.cbp.dhs.gov/program-selection/acknowledge":
        "Problem on Program Selection Acknowledgement page.",
      "https://ttp.cbp.dhs.gov/purchase-summary":
        "Problem on Purchase Summary page.",
      "https://www.pay.gov/tcsonline/payment.do?execution=e1s1":
        "Problem on Payment Method page.",
      "https://www.pay.gov/tcsonline/payment.do?execution=e1s2":
        "Problem on Payment page.",
      "https://www.pay.gov/tcsonline/payment.do?execution=e1s3":
        "Problem on Payment Confirmation page.",
    };

    if (pageErrors[page]) {
      await this.endExecution(pageErrors[page]);
    } else if (urlErrors[currentUrl]) {
      await this.endExecution(urlErrors[currentUrl]);
    } else {
      await this.endExecution("Wrong URL");
    }

    return false;
  }

  return true;
};
