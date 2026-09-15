# MyApp

<!-- template:start -->
> **This is a template repo** — Turborepo + Expo (React Native) + Next.js + Firebase (Firestore).
>
> ## Spin up a new app
>
> ```sh
> # Option A: GitHub template (fresh history)
> gh repo create my-new-app --template xohnny1337/turbo-app-template --private --clone
> cd my-new-app
> node scripts/setup.mjs
>
> # Option B: plain clone
> git clone https://github.com/xohnny1337/turbo-app-template.git my-new-app
> cd my-new-app
> node scripts/setup.mjs   # offers to reset git history
> ```
>
> The setup script asks for the app name, bundle id and Firebase project id,
> renames everything, optionally resets git history and runs `pnpm install`,
> then deletes itself. Non-interactive:
> `node scripts/setup.mjs --yes --name "Cool App" --bundle-id com.acme.coolapp`
>
> Everything below this banner becomes the new app's README.
<!-- template:end -->

Turborepo monorepo:

- **apps/mobile** — Expo (React Native) app: expo-router, twrnc, React Native Firebase (Auth + Firestore), EAS builds
- **apps/web** — Next.js app: App Router, Tailwind v4, firebase-admin (server-side Firestore + token verification), dev server on port **3333**
- **packages/types** — shared zod schemas/types (`@repo/types`)
- **packages/theme** — shared color tokens for twrnc + web (`@repo/theme`)
- **packages/typescript-config**, **packages/eslint-config** — shared tooling config

## Prerequisites

- Node >= 22, pnpm (repo pins the version via `packageManager`)
- EAS CLI account for mobile builds (`npx eas-cli login`)
- A Firebase project

## Firebase setup

1. Create a project at <https://console.firebase.google.com> (id should match `.firebaserc`).
2. **Mobile**: add an iOS app and an Android app (use the bundle id / package from
   `apps/mobile/app.json`), download the real `GoogleService-Info.plist` and
   `google-services.json` into `apps/mobile/` (they replace the committed placeholders —
   the app builds with the placeholders but can't reach Firebase until then).
3. **Auth**: enable *Anonymous* sign-in (Authentication → Sign-in method). Swap in
   Apple/Google sign-in later if needed.
4. **Firestore**: create the database, then deploy rules:
   ```sh
   npx firebase-tools deploy --only firestore
   ```
5. **Web**: Project settings → Service accounts → *Generate new private key*, then
   `cp apps/web/.env.example apps/web/.env` and fill in the values.

## Develop

```sh
pnpm install
pnpm dev                    # all dev tasks via turbo
pnpm --filter web dev       # web only -> http://localhost:3333
pnpm --filter mobile dev    # expo dev server (needs a development build)
```

Mobile uses React Native Firebase, so **Expo Go won't work** — build a dev client once:

```sh
cd apps/mobile
npx eas-cli init            # first time: links EAS project
pnpm ios                    # EAS development build (iOS simulator)
pnpm android                # EAS development build (Android)
```

In dev, the mobile app reaches the web app's API through the Expo debugger host
(see `apps/mobile/lib/api-url.ts`); in production builds set `EXPO_PUBLIC_API_URL`.

## Ship

```sh
pnpm --filter mobile ios:prod       # bumps buildNumber, EAS production build
pnpm --filter mobile android:prod   # bumps versionCode, EAS production build
pnpm build                          # next build (deploy apps/web to Vercel)
```

OTA updates (optional): `expo-updates` is installed and eas.json maps each build
profile to a channel — run `cd apps/mobile && npx eas-cli update:configure` once
to set `updates.url`, then `npx eas-cli update --channel production` to push.

## How the pieces talk

- Mobile signs in anonymously (`contexts/auth-context.tsx`) and reads/writes
  Firestore directly (`services/firebase/user.ts`, demo counter on the Home tab).
- Web never uses client Firebase — API routes use `firebase-admin`
  (`apps/web/lib/firebase-admin.ts`). `GET /api/me` shows the pattern:
  mobile sends its Firebase ID token as a bearer token, web verifies it and
  reads Firestore as admin.
- Shared shapes live in `@repo/types`; shared colors in `@repo/theme`.
