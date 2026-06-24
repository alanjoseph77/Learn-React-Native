const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // --- Desktop viewport ---
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error") errors.push("[desktop] " + msg.text()); });
  page.on("pageerror", (err) => errors.push("[desktop pageerror] " + err.message));

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Start Learning");
  await page.screenshot({ path: "shot_01_welcome.png" });

  await page.click("#startBtn");
  await page.waitForSelector("#lessonTitle:not(:empty)");
  await page.waitForTimeout(300);   // let Prism finish highlighting
  await page.screenshot({ path: "shot_02_lesson00.png", fullPage: false });

  // Check sidebar section grouping text
  const sectionLabels = await page.$$eval(".stage-group-label", (els) => els.map((e) => e.textContent.trim()));
  console.log("Sidebar sections found:", JSON.stringify(sectionLabels));

  // Check Prism actually tokenized the code (not just plain text)
  const tokenCount = await page.$$eval(".code-block code .token", (els) => els.length);
  console.log("Prism token count on lesson 00:", tokenCount);

  // Search for a Native Features lesson and open it
  await page.fill("#searchBox", "Bluetooth");
  await page.waitForTimeout(200);
  await page.click(".lesson-item");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "shot_03_ble_lesson.png" });
  const bleTitle = await page.textContent("#lessonTitle");
  console.log("Opened lesson title (expect BLE):", bleTitle);

  // Clear search, open a project lesson
  await page.fill("#searchBox", "Weather Notes");
  await page.waitForTimeout(200);
  await page.click(".lesson-item");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "shot_04_project_lesson.png" });
  const projTitle = await page.textContent("#lessonTitle");
  console.log("Opened lesson title (expect Weather Notes project):", projTitle);

  // Test mark complete + progress bar
  await page.click("#doneBtn");
  const progressText = await page.textContent("#progressText");
  console.log("Progress after marking 1 complete:", progressText);

  // Test notes autosave
  await page.fill("#notesArea", "test note for verification");
  await page.waitForTimeout(600);

  await page.close();

  // --- Mobile viewport ---
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobilePage.on("console", (msg) => { if (msg.type() === "error") errors.push("[mobile] " + msg.text()); });
  mobilePage.on("pageerror", (err) => errors.push("[mobile pageerror] " + err.message));

  await mobilePage.goto("http://localhost:8765/index.html", { waitUntil: "networkidle" });
  await mobilePage.waitForSelector("text=Start Learning");
  await mobilePage.screenshot({ path: "shot_05_mobile_welcome.png" });

  await mobilePage.click("#startBtn");
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: "shot_06_mobile_lesson.png" });

  // Hamburger should open the sidebar as an overlay on mobile
  await mobilePage.click("#hamburger");
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: "shot_07_mobile_sidebar.png" });
  const sidebarOpen = await mobilePage.evaluate(() => document.getElementById("sidebar").classList.contains("open"));
  console.log("Mobile sidebar opened via hamburger:", sidebarOpen);

  await mobilePage.close();
  await browser.close();

  console.log("\nConsole/page errors captured:", errors.length);
  errors.forEach((e) => console.log("  " + e));
})();
