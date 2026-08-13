# Leonessa Platform

Foundation for the Leonessa Cup platform. The `ProjectPlan` directory is the
product source of truth; this repository contains infrastructure only.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- CSS Modules-ready styling and Framer Motion
- Next.js Route Handlers as the API boundary
- Prisma 6 and PostgreSQL
- Auth.js (`next-auth`) with JWT sessions
- Capacitor 7 for Android and iOS
- Firebase Cloud Messaging through the Capacitor push plugin
- Vercel deployment with a managed PostgreSQL database

## Structure

```text
src/
├── app/                  # Next.js routes, layouts and Route Handlers
│   └── api/auth/         # Auth.js infrastructure route only
├── actions/              # Server Actions, introduced per feature
├── features/             # Vertical slices: auth, profile, schools, teams,
│   │                     # competitions, matches, staff, community, rewards,
│   └── notifications/    # and notifications
├── hooks/                # Shared React hooks
├── lib/                  # Infrastructure adapters and cross-cutting services
├── providers/            # React context providers
├── services/             # External service boundaries
├── store/                # Small client-only Zustand state
├── styles/               # Shared style entry points
├── types/                # Shared API and domain contracts
└── utils/                # Pure, framework-independent helpers
prisma/
└── schema.prisma         # Database foundation; domain models arrive by migration
android/                  # Generated Capacitor Android project
ios/                      # Generated Capacitor iOS project
```

Each feature owns its UI, application use cases, validation and data access.
Cross-feature imports must use public feature exports; infrastructure code must
not import UI code.

## Conventions

- TypeScript files and folders use `kebab-case`; React components use
  `PascalCase`; hooks use `useX`; types use `PascalCase`.
- Use named exports, explicit return types for public functions, and `@/*`
  imports for `src/*`.
- Keep server-only modules under `src/lib/server` or feature server modules;
  never expose secrets through `NEXT_PUBLIC_*`.
- Validate external input at the server boundary with Zod.
- Use UTC `Date` values and UUID primary keys in Prisma.
- Keep domain status and role values as Prisma enums once their feature schema
  is introduced.

## Architectural strategies

- **State:** server state belongs to TanStack Query; transient client state
  belongs to Zustand. URL state stays in route/search parameters.
- **Errors:** throw typed `AppError` instances in application code; Route
  Handlers will later translate them to stable `{ code, message, requestId }`
  responses. Never hide failures with fallback success responses.
- **Logging:** use the structured Pino logger. Never log credentials, cookies,
  authorization headers or tokens. Audit role changes, check-ins, result
  changes and other sensitive operations.
- **Security:** authentication is not authorization. Every protected use case
  must verify the session, role and resource scope on the server. Rate limiting
  is required for authentication, registration and public API surfaces.
- **API:** resource-oriented Route Handlers are the public contract for web and
  mobile. Server Actions are reserved for same-origin mutations that do not
  need to be consumed by Capacitor clients.
- **Mobile shell:** Capacitor loads the deployed Next.js origin through
  `CAPACITOR_SERVER_URL`; this avoids pretending a server-rendered,
  authenticated Next.js app is a static export.
- **Database:** Prisma migrations are the only schema change mechanism. The
  complete MVP schema is intentionally deferred until the corresponding
  feature is implemented; audit fields and soft-delete policies must be
  decided per critical entity before migration.

## Environment and commands

Copy `.env.example` to `.env.local` and fill values before running the
application. Never commit environment files.

```bash
npm run dev
npm run lint
npm run typecheck
npm run prisma:validate
npm run build
```

## Delivery

GitHub Actions runs lint, type checking, Prisma validation and the production
build on pushes and pull requests. Vercel deploys approved changes from
`main`; `develop` is the integration branch. Use short-lived branches named
`feature/<scope>`, `fix/<scope>`, or `chore/<scope>` and merge through pull
requests with CI passing.
