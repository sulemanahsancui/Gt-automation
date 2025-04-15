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
