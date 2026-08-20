<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is the **Leonessa Platform**, a Next.js 16 (App Router, Turbopack) web app backed by
PostgreSQL via Prisma, with Auth.js (`next-auth`) authentication. Standard commands live in
`README.md` and `package.json` scripts; the notes below are the non-obvious bits for this VM.

### Database (required for every command)

- A local PostgreSQL 16 server is installed. `systemd` is unavailable, so start it with
  `sudo pg_ctlcluster 16 main start` (idempotent-ish; ignore "already running"). It is NOT
  auto-started on VM boot, so start it at the beginning of a session before running the app,
  builds, or Prisma commands.
- Dev database/role are both `leonessa` (password `leonessa`), created during setup.
- `.env.local` holds `DATABASE_URL`, `AUTH_SECRET`, etc. It is git-ignored and recreated during
  environment setup (there is no committed `.env.example`). `next dev`, `next build`, and Prisma
  all read it, so recreate it if missing:
  `DATABASE_URL="postgresql://leonessa:leonessa@localhost:5432/leonessa?schema=public"`.
- Apply schema with `npx prisma migrate deploy`; seed base data with `npm run prisma:seed`.
  The richer `npm run sandbox:seed` requires `APP_SANDBOX_MODE=true`.

### Running / verifying

- Dev server: `npm run dev` (http://localhost:3000). `/` redirects to `/login` when signed out.
- Lint/typecheck/build match CI in `.github/workflows/ci.yml`: `npm run lint`,
  `npm run typecheck`, `npm run prisma:validate`, `npm run build`.

### Optional integrations (degrade gracefully when unset)

- Email verification/password reset (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), Google OAuth
  (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`), Firebase FCM, Cloudinary, Sentry, and PostHog are all
  env-gated. With them unset, registration still creates the account and signs the user in, but the
  verification email step reports failure — this is expected locally, not a bug.
- The `android/` and `ios/` Capacitor projects are mobile shells that load the deployed web origin;
  building them needs Xcode/Android Studio and is out of scope on this Linux VM.

### Gotcha

- `next dev` rewrites the `nextjs-agent-rules` block at the top of this file. If it shows up as an
  uncommitted change, commit it with your work rather than reverting it.
