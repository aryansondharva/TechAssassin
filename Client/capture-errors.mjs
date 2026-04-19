import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching headless browser to debug white screen...");
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Attach error listeners
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR]: ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      console.log(`[PAGE UNCAUGHT EXCEPTION]: ${err.toString()}`);
    });

    console.log("Navigating to http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    
    console.log("Navigation complete. Checking for DOM content...");
    const content = await page.content();
    if (content.includes('id="root"></div>') && !content.includes('navbar')) {
        console.log("[DOM CHECK]: Page looks completely empty (white screen).");
    } else {
        console.log("[DOM CHECK]: DOM has content.");
    }

    await browser.close();
  } catch (err) {
    console.error("Puppeteer Script Error:", err);
  }
})();
