# Leonessa Platform

Foundation for the Leonessa Cup platform. The `ProjectPlan` directory is the
product source of truth; this repository contains infrastructure only.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- CSS Modules-ready styling and Framer Motion
- Next.js Route Handlers as the API boundary
- Prisma 6 and PostgreSQL
- Auth.js (`next-auth`) with Prisma Adapter and JWT sessions
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
└── schema.prisma         # Complete MVP domain schema and Auth.js persistence
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
- **Authentication:** Google OAuth and email/password credentials use Auth.js.
  Passwords are stored only as bcrypt hashes, while the Prisma Adapter
  persists users and OAuth accounts. JWT callbacks carry a minimal session
  projection; role guards always re-check active roles in Prisma.
- **Onboarding:** new users receive the `USER` role, then complete profile,
  school and primary-role selection through a server-validated transaction.
  Additional roles remain supported through `UserRole`; `isPrimary` marks only
  the onboarding-selected role.
- **API:** resource-oriented Route Handlers are the public contract for web and
  mobile. Server Actions are reserved for same-origin mutations that do not
  need to be consumed by Capacitor clients.
- **Mobile shell:** Capacitor loads the deployed Next.js origin through
  `CAPACITOR_SERVER_URL`; this avoids pretending a server-rendered,
  authenticated Next.js app is a static export.
- **Database:** Prisma migrations are the only schema change mechanism. The
  MVP schema uses UUID primary keys, camelCase Prisma fields, explicit
  foreign keys, UTC timestamps and Prisma enums for finite states. Critical
  aggregates expose `deletedAt`; immutable points, role assignments and audit
  records preserve operational history.
- **Database normalization:** Application roles and operational staff roles are
  finite enums, while `UserRole`, `TeamMember`, `ShiftAssignment`,
  `UserMission`, `UserBadge` and `EventAttendance` model contextual
  assignments. `CheckIn` references only `ShiftAssignment` to avoid duplicating
  `shiftId` and `userId`.
- **MVP coverage:** The schema includes Auth.js persistence, competitions,
  teams, matches and events, staff scheduling/check-in, missions, badges,
  LP/SP transactions, in-app notifications, FCM device tokens and news
  articles. PostgreSQL `CHECK` constraints for score, minute, reward and
  interval validation belong in the generated migration because Prisma schema
  does not express them portably.

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
