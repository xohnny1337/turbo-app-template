#!/usr/bin/env node
/**
 * Increments ios.buildNumber or android.versionCode in app.json.
 * Usage: node scripts/increment-build.js <ios|android>
 */
const fs = require("fs");
const path = require("path");

const platform = process.argv[2];
if (!["ios", "android"].includes(platform)) {
  console.error("Usage: node scripts/increment-build.js <ios|android>");
  process.exit(1);
}

const appJsonPath = path.join(__dirname, "..", "app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

if (platform === "ios") {
  const current = parseInt(appJson.expo.ios.buildNumber ?? "0", 10);
  appJson.expo.ios.buildNumber = String(current + 1);
  console.log(`iOS buildNumber: ${current} -> ${appJson.expo.ios.buildNumber}`);
} else {
  const current = appJson.expo.android.versionCode ?? 0;
  appJson.expo.android.versionCode = current + 1;
  console.log(
    `Android versionCode: ${current} -> ${appJson.expo.android.versionCode}`
  );
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");
