# MyApp

Turborepo + pnpm (with `catalog:` versions in pnpm-workspace.yaml).

## Layout

- `apps/mobile` — Expo app. expo-router file routing in `app/`, styling via twrnc (`lib/tw.ts`, theme colors from `@repo/theme`), Firebase via `@react-native-firebase` (modular API only — no `firestore()` namespace calls). Firebase singletons in `config/firebase-config.ts`; Firestore access goes in `services/firebase/*`. Requires a dev client (EAS), not Expo Go.
- `apps/web` — Next.js App Router, Tailwind v4 (CSS-first config in `app/globals.css`), dev port 3333. Server-side Firebase only, via `lib/firebase-admin.ts` (lazy init; env vars AUTH_FIREBASE_PROJECT_ID, AUTH_FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).
- `packages/types` — shared zod schemas (`@repo/types`). Put cross-app types here.
- `packages/theme` — shared color tokens (`@repo/theme`). Mobile consumes via tailwind.config.js; web mirrors them in globals.css.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm check-types` (turbo, from root)
- Mobile builds: `pnpm --filter mobile ios` (dev), `ios:prod` / `android:prod` (bump build number + EAS production build)
- Firestore rules live in `firestore.rules` at root: `npx firebase-tools deploy --only firestore`

## Conventions

- Mobile ↔ web API calls go through `apps/mobile/lib/api-url.ts`; auth via Firebase ID token bearer headers, verified in web API routes with `verifyFirebaseToken`.
- New env vars used by turbo tasks must be added to `globalEnv` in turbo.json.
- Add shared deps to the pnpm catalog when both apps use them.
