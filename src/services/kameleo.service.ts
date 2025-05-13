import playwright, { Page } from 'playwright'

export async function launchProfile(
  profileId: string,
): Promise<{ page: Page; browser: playwright.Browser } | undefined> {
  try {
    // Start the existing profile
    const browserWSEndpoint = `ws://104.238.214.114:5050/playwright/${profileId}`

    if (!browserWSEndpoint) {
      throw new Error('No WebSocket debugger URL provided by Kameleo')
    }

    const browser = await playwright.chromium.connectOverCDP(browserWSEndpoint)

    // Store the browser connection for cleanup
    //browser.browserConnections.set(profileId, browser)

    const context = browser.contexts()[0]
    const page = await context.newPage()

    // const page = await browser.newPage()
    console.log(`Launched profile ${profileId} successfully`)
    // logger.info(Launched profile ${profileId} successfully);
    return { page, browser }
  } catch (error) {
    console.error(`Failed to launch profile ${profileId}:, error`, error)
    return undefined
  }
}
