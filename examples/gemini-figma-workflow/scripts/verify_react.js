const { chromium } = require('playwright');

// Usage: node verify_react.js <url>
// url: e.g., "http://localhost:5173/CampaignPage"

(async () => {
  const url = process.argv[2] || 'http://localhost:5173/';
  console.log(`Verifying React page at ${url}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
      if (msg.type() === 'error') {
          console.error(`CONSOLE ERROR: ${msg.text()}`);
          errors.push(msg.text());
      }
  });
  page.on('pageerror', err => {
      console.error(`PAGE ERROR: ${err.message}`);
      errors.push(err.message);
  });

  try {
    await page.goto(url);
    
    // 1. Wait for loading text to disappear (if applicable)
    // await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 5000 }).catch(() => console.log('No "Loading..." text found or it did not disappear.'));

    // 2. Wait for network idle to ensure assets are loaded
    await page.waitForLoadState('networkidle');

    // 3. Check for broken images
    const imageStatus = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            loaded: img.complete && img.naturalWidth > 0
        }));
    });

    imageStatus.forEach(img => {
        if (!img.loaded) {
            console.error(`IMAGE LOAD FAILED: ${img.src}`);
            errors.push(`Image failed to load: ${img.src}`);
        }
    });

    // 4. Take a debugging screenshot
    await page.screenshot({ path: 'verify_react_screenshot.png', fullPage: true });
    console.log('Screenshot saved to verify_react_screenshot.png');

    if (errors.length > 0) {
        console.error(`\nVerification FAILED with ${errors.length} errors.`);
        process.exit(1);
    } else {
        console.log('\nVerification PASSED: No console errors or broken images detected.');
    }

  } catch (e) {
      console.error("Critical error during verification:", e);
      process.exit(1);
  } finally {
      await browser.close();
  }
})();
