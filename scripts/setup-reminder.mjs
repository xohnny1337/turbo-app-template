#!/usr/bin/env node
/**
 * Post-install nudge: if the template hasn't been configured yet, say so.
 * Never fails the install.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

try {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const stillTemplate = fs.existsSync(path.join(root, "scripts/setup.mjs"));
  if (stillTemplate) {
    console.log(`
┌─────────────────────────────────────────────────┐
│  👋 This is still the unconfigured template.    │
│                                                 │
│  Set your app name, bundle id and Firebase      │
│  project with:                                  │
│                                                 │
│      pnpm configure                             │
│                                                 │
└─────────────────────────────────────────────────┘
`);
  }
} catch {
  // never block install
}
