# MyApp

<!-- template:start -->
> **This is a template repo.** Turborepo monorepo: Expo (React Native) app + Next.js web app + Firebase (Firestore) + RevenueCat subscriptions. Everything below the "Start a new app" section becomes the README of the app you generate.
>
> ## Start a new app
>
> ```sh
> # Option A — GitHub template (fresh history, recommended)
> gh repo create my-new-app --template xohnny1337/turbo-app-template --private --clone
> cd my-new-app
> node scripts/setup.mjs
>
> # Option B — plain clone
> git clone https://github.com/xohnny1337/turbo-app-template.git my-new-app
> cd my-new-app
> node scripts/setup.mjs      # offers to reset git history
> ```
>
> The setup script asks for **app name, slug, bundle id, Firebase project id**, renames everything, optionally resets git, runs `pnpm install`, then deletes itself. Non-interactive: `node scripts/setup.mjs --yes --name "Cool App" --bundle-id com.acme.coolapp`.
>
> Then follow **From zero to running** below — it's the same checklist the script prints.
<!-- template:end -->

**Stack:** Turborepo + pnpm · Expo SDK 57 (expo-router, twrnc, React Native Firebase) · Next.js 16 (Tailwind v4, firebase-admin) · Firestore · RevenueCat subscriptions · EAS builds.

- `apps/mobile` — the iOS/Android app
- `apps/web` — the web app + API backend for mobile (dev port **3333**)
- `packages/types` — shared zod schemas (`@repo/types`)
- `packages/theme` — shared colors (`@repo/theme`)

---

## From zero to running

Do these in order. After **step 3** the web app works; after **step 4** the mobile app works. Step 5 (payments) can wait.

### 0. Prerequisites (once per machine)

- **Node 22+** and **pnpm** (`corepack enable` is enough — the repo pins the pnpm version)
- **Xcode** (for iOS simulator) and/or **Android Studio**
- Accounts: [Firebase](https://console.firebase.google.com) (free) and [Expo](https://expo.dev) (free). Apple/Google developer accounts only needed when you ship to the stores.

### 1. Install

```sh
pnpm install
```

### 2. Firebase (~5 min — this powers auth + database)

1. Go to <https://console.firebase.google.com> → **Add project** → name it to match `.firebaserc`.
2. **Add the iOS app**: Project overview → iOS → bundle id from `apps/mobile/app.json` (`ios.bundleIdentifier`) → download **GoogleService-Info.plist** → drop it in `apps/mobile/` (overwrite the placeholder).
3. **Add the Android app**: same, package name from `android.package` → download **google-services.json** → drop it in `apps/mobile/` (overwrite the placeholder).
4. **Enable auth**: Build → Authentication → Get started → Sign-in method → enable **Anonymous**. (Skipping this is the #1 reason the app shows "Could not sign in to Firebase".)
5. **Create the database**: Build → Firestore Database → Create database (production mode), then deploy the rules from the repo root:
   ```sh
   npx firebase-tools login
   npx firebase-tools deploy --only firestore
   ```
6. **Server credentials for the web app**: ⚙️ Project settings → Service accounts → **Generate new private key**. Then:
   ```sh
   cp apps/web/.env.example apps/web/.env
   ```
   Fill in `AUTH_FIREBASE_PROJECT_ID`, `AUTH_FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` from the downloaded JSON (keep the quotes around the private key).

### 3. Run the web app

```sh
pnpm --filter web dev        # -> http://localhost:3333
```

You should see the landing page, and `http://localhost:3333/api/health` should return `{"status":"ok"}`. ✅ Web done.

### 4. Run the mobile app

The app uses native Firebase, so **Expo Go does not work** — you build a dev client once, then iterate with hot reload like normal.

```sh
npx eas-cli login            # once
cd apps/mobile
npx eas-cli init             # once — links the project to your Expo account
cd ../..
pnpm --filter mobile ios     # builds a dev client for the iOS simulator (~10-15 min on EAS)
pnpm --filter mobile android # same for Android
```

Install the finished build on the simulator/device (EAS gives you a link/QR), then day-to-day you only need:

```sh
pnpm --filter mobile dev     # start the dev server, open in the dev client
```

**Verify it works:** the Home tab tap-counter should count and persist (that's Firestore) — and with the web app running, Settings → *Ping web API* and *Fetch profile (authed /api/me)* should both succeed. ✅ Mobile done.

### 5. Subscriptions — RevenueCat (optional, skip until you need payments)

The app runs fine without this; the paywall button just logs a warning until keys exist.

1. <https://app.revenuecat.com> → create a project → add iOS + Android apps (same bundle id as step 2).
2. Create your products (App Store Connect / Play Console), an **entitlement** (e.g. `pro`), attach products to it, and build a **paywall** on the default offering.
3. Copy the **public SDK keys**: 
   ```sh
   cp apps/mobile/.env.example apps/mobile/.env
   ```
   Fill in `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `_ANDROID`. For EAS builds set the same values as EAS environment variables.
4. **Webhook (server sync)**: RevenueCat dashboard → Integrations → Webhooks → URL `https://<your-web-domain>/api/webhooks/revenuecat`, Authorization header value `Bearer <secret>` — put the same `<secret>` in `apps/web/.env` as `REVENUECAT_WEBHOOK_AUTH_KEY`. Subscription state then lands in Firestore at `users/{uid}.subscription` for server-side gating.

In the app: `useSubscription()` → `isPro`, `presentPaywall()`, `restorePurchases()` (demo UI on the Settings tab).

### 6. Ship it

```sh
# Web — deploy apps/web to Vercel (set the env vars from apps/web/.env there)
pnpm build

# Mobile — store builds (auto-bumps build numbers)
pnpm --filter mobile ios:prod
pnpm --filter mobile android:prod

# Production mobile builds need EXPO_PUBLIC_API_URL (your deployed web URL)
# set as an EAS environment variable.
```

OTA updates (optional): `cd apps/mobile && npx eas-cli update:configure` once, then `npx eas-cli update --channel production` to push JS-only changes without a store release.

---

## Daily commands

| Command | What |
| --- | --- |
| `pnpm dev` | everything via turbo |
| `pnpm --filter web dev` | web only → localhost:3333 |
| `pnpm --filter mobile dev` | mobile dev server (needs the dev client from step 4) |
| `pnpm check-types` / `pnpm lint` / `pnpm build` | checks across all workspaces |
| `pnpm --filter mobile ios` | new dev build (only needed after adding native deps) |

## How the pieces talk

- **Mobile ↔ Firebase**: signs in anonymously on first launch (`contexts/auth-context.tsx`), reads/writes Firestore directly (`services/firebase/*`). Swap in Apple/Google sign-in later without touching the rest.
- **Mobile ↔ Web**: mobile calls the web app's API routes via `lib/api-url.ts` (auto-resolves your dev machine in development). Authenticated calls send the Firebase ID token as a bearer header; `apps/web/app/api/me/route.ts` shows the server-side verification pattern with firebase-admin.
- **Subscriptions**: RevenueCat SDK is the client-side truth (`useSubscription()`); the webhook mirrors state to Firestore so API routes can gate features server-side.
- **Shared code**: types in `@repo/types` (zod), colors in `@repo/theme` (twrnc on mobile, CSS vars in `apps/web/app/globals.css`).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Could not sign in to Firebase" on mobile | Enable **Anonymous** sign-in (step 2.4), and make sure you replaced both placeholder Google services files (step 2.2/2.3) |
| Tap counter stuck / permission errors | Firestore rules not deployed — step 2.5 |
| "API unreachable" in Settings | Web app not running (`pnpm --filter web dev`), or on a physical device: phone and computer must be on the same network |
| `/api/me` returns 500 | `apps/web/.env` missing/wrong (step 2.6) — restart the dev server after editing |
| App won't open in Expo Go | Expected — native Firebase needs the dev client (step 4) |
| "RNFBAppModule not found" after adding the dev client | Uninstall the old app from the simulator/device and install the fresh EAS build |
| Paywall does nothing | RevenueCat keys not set (step 5.3) — check the console for `[RevenueCat]` warnings |
| pnpm complains about versions | Just use `corepack enable`; the repo's `packageManager` field handles the rest |
