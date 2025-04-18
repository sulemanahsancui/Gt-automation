import { BROWSER_ARGS, newBrowser } from './lib'
import { BotSubmitApplication, BotUtilities } from './services'

async function run() {
  console.info('Starting Bot...')
  const browser = await newBrowser({
    // headless: config('NODE_ENV') == 'development' ? false : true,
    headless: false,
    args: BROWSER_ARGS,
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  const botUtility_instance = new BotUtilities(false, page, null, browser, null)

  await page.setViewportSize(botUtility_instance.getRandomScreenSize())

  page.on('dialog', async (dialog) => await dialog.accept())

  const botApp = new BotSubmitApplication(page, null)

  console.log({ botApp })

  console.log('FINISHED...')
}

run()
