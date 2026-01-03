# Repository Guidelines

This guide helps contributors work effectively in the Bob resource management app (Next.js + TypeScript + Prisma).

## Project Structure & Module Organization

- `src/app`: Next.js App Router routes (`page.tsx`, `layout.tsx`).
- `src/components`: Reusable UI components (PascalCase names).
- `src/lib`: Shared utilities, data access helpers, and context.
- `prisma`: Database schema, migrations, and seed script.
- `public`: Static assets (icons, images).

## Build, Test, and Development Commands

- `npm install`: Install dependencies.
- `npm run dev` or `make dev`: Start the local dev server.
- `npm run build` or `make build`: Production build.
- `npm run start` or `make start`: Run the production server locally.
- `npm run lint` or `make lint`: Run ESLint checks.
- `npx prisma migrate dev` or `make db-setup`: Create/update the SQLite schema.
- `npx prisma studio` or `make db-studio`: Explore data in Prisma Studio.
- `npx prisma db seed` or `make feed`: Seed the database.

## Coding Style & Naming Conventions

- Language: TypeScript with React (Next.js App Router).
- Linting: ESLint with `eslint-config-next`; keep code consistent with existing style.
- Components: PascalCase component names and exports (e.g., `TeamCard`).
- Routes: Follow Next.js conventions (`page.tsx`, `layout.tsx`, `loading.tsx`).

## Testing Guidelines

- No test framework is configured yet. If you add tests, keep them close to the feature and document the runner in this file.
- Always run `npm run lint` before opening a PR.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (used by `standard-version`), e.g. `feat: add capacity view`, `fix: handle empty skills`.
- PRs should include: a concise summary, testing steps, and screenshots for UI changes.
- If schema changes are made, include the migration name and any data-reset notes.

## Configuration & Data

- Local config lives in `.env`; do not commit secrets.
- Prisma uses a local SQLite database (`dev.db`) created via migrations.
