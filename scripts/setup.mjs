#!/usr/bin/env node
/**
 * Interactive first-run setup for this template.
 *
 * Usage:
 *   node scripts/setup.mjs            interactive
 *   node scripts/setup.mjs --yes --name "Cool App" [--bundle-id com.acme.coolapp] [--firebase-project cool-app]
 *
 * Renames the placeholder identity (MyApp / my-app / myapp / com.example.myapp)
 * across the repo, optionally resets git history, then deletes itself.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PLACEHOLDER = {
  displayName: "MyApp",
  slug: "my-app",
  scheme: "myapp",
  bundleId: "com.example.myapp",
  firebaseProject: "my-app",
};

// ---------- helpers ----------

function kebab(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidSlug(slug) {
  return /^[a-z][a-z0-9-]*$/.test(slug);
}

function isValidBundleId(id) {
  // Intersection of Apple (no underscores) and Android (no dashes) rules.
  return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(id);
}

function safeSlugFallback(candidate) {
  if (isValidSlug(candidate)) return candidate;
  if (/^[0-9]/.test(candidate)) return `app-${candidate}`;
  return "my-new-app";
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content);
}

function replaceInFile(file, replacements) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, "utf8");
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(fullPath, content);
}

function parseArgs(argv) {
  const args = { yes: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--yes" || arg === "-y") args.yes = true;
    else if (arg === "--name") args.name = argv[++i];
    else if (arg === "--slug") args.slug = argv[++i];
    else if (arg === "--bundle-id") args.bundleId = argv[++i];
    else if (arg === "--firebase-project") args.firebaseProject = argv[++i];
    else if (arg === "--keep-git") args.keepGit = true;
    else if (arg === "--skip-install") args.skipInstall = true;
  }
  return args;
}

// ---------- gather answers ----------

const args = parseArgs(process.argv.slice(2));

if (!fs.existsSync(path.join(ROOT, "apps/mobile/app.json"))) {
  console.error("Run this from the repo root (apps/mobile/app.json not found).");
  process.exit(1);
}

let answers;

if (args.yes) {
  if (!args.name) {
    console.error("--yes requires --name");
    process.exit(1);
  }
  const slug = args.slug ?? kebab(args.name);
  if (!isValidSlug(slug)) {
    console.error(
      `Invalid slug "${slug}" (from ${args.slug ? "--slug" : "--name"}): must be lowercase letters, digits and dashes, starting with a letter. Pass a valid --slug.`
    );
    process.exit(1);
  }
  const bundleId = args.bundleId ?? `com.example.${slug.replace(/-/g, "")}`;
  if (!isValidBundleId(bundleId)) {
    console.error(
      `Invalid bundle id "${bundleId}": must be reverse-DNS, e.g. com.yourname.app (no dashes or underscores).`
    );
    process.exit(1);
  }
  const firebaseProject = args.firebaseProject ?? slug;
  if (!isValidSlug(firebaseProject)) {
    console.error(
      `Invalid Firebase project id "${firebaseProject}": must be lowercase letters, digits and dashes.`
    );
    process.exit(1);
  }
  answers = {
    displayName: args.name,
    slug,
    scheme: slug.replace(/-/g, ""),
    bundleId,
    firebaseProject,
    resetGit: !args.keepGit,
    install: !args.skipInstall,
  };
} else {
  if (!process.stdin.isTTY) {
    console.error(
      "No TTY detected. Use flags instead: node scripts/setup.mjs --yes --name \"Cool App\""
    );
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (question, fallback) => {
    const answer = (await rl.question(`${question} ${fallback ? `(${fallback}) ` : ""}`)).trim();
    return answer || fallback;
  };
  const confirm = async (question, fallback = true) => {
    const answer = (await ask(`${question} [y/n]`, fallback ? "y" : "n")).toLowerCase();
    return answer.startsWith("y");
  };

  console.log("\n🚀 New app setup\n");

  const displayName = await ask("App display name?", "MyApp");

  const slugFallback = safeSlugFallback(kebab(displayName));
  let slug = await ask("Slug (repo/package name)?", slugFallback);
  while (!isValidSlug(slug)) {
    console.log("   Slug must be lowercase letters, digits and dashes, starting with a letter.");
    slug = await ask("Slug (repo/package name)?", slugFallback);
  }

  const compact = slug.replace(/-/g, "");

  let bundleId = await ask("iOS bundle id / Android package?", `com.example.${compact}`);
  while (!isValidBundleId(bundleId)) {
    console.log("   Must be reverse-DNS, e.g. com.yourname.app (no dashes or underscores).");
    bundleId = await ask("iOS bundle id / Android package?", `com.example.${compact}`);
  }

  let firebaseProject = await ask("Firebase project id?", slug);
  while (!isValidSlug(firebaseProject)) {
    console.log("   Must be lowercase letters, digits and dashes.");
    firebaseProject = await ask("Firebase project id?", slug);
  }
  const resetGit = await confirm("Reset git history (fresh repo)?", true);
  const install = await confirm("Run pnpm install when done?", true);

  console.log(`
  Display name:      ${displayName}
  Slug:              ${slug}
  URL scheme:        ${compact}
  Bundle/package id: ${bundleId}
  Firebase project:  ${firebaseProject}
  Reset git:         ${resetGit ? "yes" : "no"}
  pnpm install:      ${install ? "yes" : "no"}
`);

  const proceed = await confirm("Apply?", true);
  rl.close();
  if (!proceed) {
    console.log("Aborted — nothing changed.");
    process.exit(0);
  }

  answers = { displayName, slug, scheme: compact, bundleId, firebaseProject, resetGit, install };
}

// ---------- apply ----------

const { displayName, slug, scheme, bundleId, firebaseProject, resetGit, install } = answers;

// Root package.json: rename + drop template-only scripts
const rootPkg = JSON.parse(read("package.json"));
rootPkg.name = slug;
delete rootPkg.scripts.configure;
delete rootPkg.scripts.postinstall;
write("package.json", JSON.stringify(rootPkg, null, 2) + "\n");

// Expo app.json
const appJson = JSON.parse(read("apps/mobile/app.json"));
appJson.expo.name = displayName;
appJson.expo.slug = slug;
appJson.expo.scheme = scheme;
appJson.expo.ios.bundleIdentifier = bundleId;
appJson.expo.android.package = bundleId;
write("apps/mobile/app.json", JSON.stringify(appJson, null, 2) + "\n");

// Placeholder Firebase config files (replaced for real via the Firebase console later)
const googleServices = JSON.parse(read("apps/mobile/google-services.json"));
googleServices.project_info.project_id = firebaseProject;
googleServices.project_info.storage_bucket = `${firebaseProject}.appspot.com`;
googleServices.client[0].client_info.android_client_info.package_name = bundleId;
write("apps/mobile/google-services.json", JSON.stringify(googleServices, null, 2) + "\n");

replaceInFile("apps/mobile/GoogleService-Info.plist", [
  [PLACEHOLDER.bundleId, bundleId],
  [PLACEHOLDER.firebaseProject, firebaseProject],
]);

// Firebase project references
replaceInFile(".firebaserc", [[PLACEHOLDER.firebaseProject, firebaseProject]]);
replaceInFile("apps/web/.env.example", [[PLACEHOLDER.firebaseProject, firebaseProject]]);

// Display name in source
replaceInFile("apps/mobile/app/(tabs)/index.tsx", [[PLACEHOLDER.displayName, displayName]]);
replaceInFile("apps/web/app/layout.tsx", [[PLACEHOLDER.displayName, displayName]]);
replaceInFile("apps/web/app/page.tsx", [[PLACEHOLDER.displayName, displayName]]);
// Slug before display name: a valid slug is all-lowercase so it can never
// contain "MyApp", while a display name may contain "my-app".
replaceInFile("CLAUDE.md", [
  [PLACEHOLDER.slug, slug],
  [PLACEHOLDER.displayName, displayName],
]);

// README: strip the template banner section, then rename
let readme = read("README.md");
readme = readme.replace(/<!-- template:start -->[\s\S]*?<!-- template:end -->\n?/g, "");
readme = readme.split(PLACEHOLDER.slug).join(slug);
readme = readme.split(PLACEHOLDER.displayName).join(displayName);
write("README.md", readme);

// Remove template-only files
fs.rmSync(path.join(ROOT, "scripts/setup.mjs"), { force: true });
fs.rmSync(path.join(ROOT, "scripts/setup-reminder.mjs"), { force: true });
if (fs.existsSync(path.join(ROOT, "scripts")) && fs.readdirSync(path.join(ROOT, "scripts")).length === 0) {
  fs.rmdirSync(path.join(ROOT, "scripts"));
}

console.log("✅ Renamed everything.");

if (bundleId.startsWith("com.example.")) {
  console.log(
    "⚠️  Bundle id still uses the com.example. placeholder domain — Google Play rejects com.example.* packages. Change ios.bundleIdentifier and android.package in apps/mobile/app.json before registering the app in Firebase."
  );
}

// Git
if (resetGit) {
  fs.rmSync(path.join(ROOT, ".git"), { recursive: true, force: true });
  try {
    execSync("git init", { cwd: ROOT, stdio: "pipe" });
    execSync("git add -A", { cwd: ROOT, stdio: "pipe" });
    execSync('git commit -m "Initial commit from turbo-app-template"', {
      cwd: ROOT,
      stdio: "pipe",
    });
    console.log("✅ Fresh git history created.");
  } catch (error) {
    const stderr = error?.stderr?.toString().trim();
    if (stderr) console.log(stderr);
    console.log(
      "⚠️  Initial commit failed. Fix the issue above (e.g. git config user.name/user.email), then run: git add -A && git commit"
    );
  }
}

// Install
if (install) {
  console.log("\n📦 Installing dependencies…\n");
  try {
    execSync("pnpm install", { cwd: ROOT, stdio: "inherit" });
  } catch {
    console.log("⚠️  pnpm install failed — run it manually.");
  }
}

console.log(`
🎉 ${displayName} is ready.

Next steps:
  1. Firebase: create project "${firebaseProject}" at https://console.firebase.google.com
     - Add an iOS app (${bundleId}) and download GoogleService-Info.plist -> apps/mobile/
     - Add an Android app (${bundleId}) and download google-services.json -> apps/mobile/
     - Enable Anonymous auth (Authentication -> Sign-in method)
     - Create a Firestore database, then: npx firebase-tools deploy --only firestore
     - Service account key (web): Project settings -> Service accounts -> Generate new private key,
       copy values into apps/web/.env (see apps/web/.env.example)
  2. EAS: cd apps/mobile && npx eas-cli init (links the project, sets extra.eas.projectId)
  3. Dev:
     - pnpm dev                      # everything via turbo
     - pnpm --filter web dev         # web on http://localhost:3333
     - pnpm --filter mobile ios      # EAS development build, then pnpm --filter mobile dev
`);
