# Prisma and Supabase migration instructions

The application database is Supabase Postgres accessed through Prisma.

These steps apply to the Prisma schema in `backend/prisma/schema.prisma`.

Prerequisites
- Set `DATABASE_URL` to the Supabase pooler connection string.
- Set `DIRECT_URL` to the Supabase direct database connection string before running migrations.
- Node + npm installed.
- From repository root run `cd backend`.

1) Generate Prisma client (optional when schema changed)

```bash
npm run prisma:generate
```

2) Create and apply a migration (development)

```bash
npm run prisma:migrate -- --name add_course_progress_models
```

This will create a migration and apply it to the database pointed to by `DATABASE_URL`.

3) Inspect the database with Prisma Studio

```bash
npm run prisma:studio
```

4) Notes & safety
- Back up your databases before running migrations in production.
- `prisma migrate dev` is intended for development; use `prisma migrate deploy` for CI/production workflows.
- If any model names or relations cause conflicts, inspect `backend/prisma/schema.prisma` and adapt the migration name accordingly.

If you want, I can run `npm run prisma:generate` and `npm run prisma:migrate` now — confirm that your SQL `DATABASE_URL` is set and available from this environment.

Testing uses Jest and Prisma-backed services.