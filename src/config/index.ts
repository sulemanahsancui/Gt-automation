// config.ts
export const twoCaptchaApiKey: string = "YOUR_2CAPTCHA_API_KEY";

export const config = (key: string): string | undefined => process.env[key];
