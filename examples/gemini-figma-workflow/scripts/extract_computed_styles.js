const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Usage: node extract_computed_styles.js <componentPath> <outputFile>
// componentPath: e.g., "http://localhost:5173/CampaignPage"
// outputFile: e.g., "styles/CampaignPage.json"

(async () => {
  const componentUrl = process.argv[2] || 'http://localhost:5173/';
  const outputFile = process.argv[3] || 'computed_styles.json';

  console.log(`Extracting styles from ${componentUrl}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(componentUrl, { waitUntil: 'networkidle' });

    const styles = await page.evaluate(() => {
        // Function to filter only relevant styles (mimicking Tailwind logic simplified)
        // In a real scenario, you might want to cross-reference with a known list of CSS properties
        // or just dump everything and filter later.
        const relevantProperties = [
            'display', 'position', 'top', 'right', 'bottom', 'left',
            'width', 'height', 'margin', 'padding',
            'font-family', 'font-size', 'font-weight', 'line-height',
            'color', 'background-color', 'border', 'border-radius',
            'flex', 'grid-template-columns', 'gap', 'z-index'
        ];

        return Array.from(document.querySelectorAll('[data-node-id]')).map(el => {
            const computed = getComputedStyle(el);
            const css = {};
            
            // Extract all properties or filtered ones
            for (const prop of relevantProperties) {
                const val = computed.getPropertyValue(prop);
                if (val && val !== 'none' && val !== 'auto' && val !== '0px') {
                     css[prop] = val;
                }
            }

            // Also capture explicit classes if needed
            return {
                nodeId: el.dataset.nodeId,
                className: el.className,
                css: css
            };
        });
    });

    const output = {
        componentUrl: componentUrl,
        timestamp: new Date().toISOString(),
        elements: styles
    };

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`Styles saved to ${outputFile}`);

  } catch (e) {
      console.error("Error extracting styles:", e);
  } finally {
      await browser.close();
  }
})();
