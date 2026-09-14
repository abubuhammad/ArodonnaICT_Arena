# Course Progress — Production Design

This document describes the production-ready CourseProgress data model and API surface.

Key resources
- Lesson: separate collection; fields: `_id`, `moduleId`, `order`, `hasQuiz`, `content`, `durationSeconds`.
- Quiz: separate collection referencing `lesson` with `questions`, `config` (passingScore, attemptsAllowed, grading).
- CourseProgress: per-enrollment single source of truth for progress.

CourseProgress schema (high level)
- `enrollment` (ObjectId, unique)
- `version` (number) — schema version for migrations
- `modules`: array of module progress:
  - `module` (ObjectId)
  - `status` (LOCKED|NOT_STARTED|IN_PROGRESS|PASSED)
  - `lessonProgress`: array of lesson entries:
    - `lesson` (ObjectId)
    - `status` (NOT_STARTED|IN_PROGRESS|PASSED|FAILED|LOCKED)
    - `attempts` (number)
    - `bestScore` (number)
    - `timeSpentSeconds` (number)
    - `lastViewedAt`, `completedAt`
  - `assessmentPassed`, `bestScore`, `completedAt`
- `overallScore`, telemetry (streaks, velocity)

Indexes
- Unique index: `{ enrollment: 1 }`
- Additional indexes: `{ modules.module: 1 }`, `{ 'modules.lessonProgress.lesson': 1 }` for queries

API surface (high level)
- POST `/enrollments/:id/start` — create CourseProgress skeleton (idempotent)
- POST `/enrollments/:id/lessons/:lessonId/view` — mark IN_PROGRESS + lastViewedAt
- POST `/enrollments/:id/lessons/:lessonId/complete` — complete lesson without quiz
- POST `/enrollments/:id/quizzes/:quizId/submit` — submit quiz attempt
- POST `/enrollments/:id/modules/:moduleId/assessment` — module assessment
- GET `/enrollments/:id/progress` — return single source for frontend gating (ETag-capable)

Notes
- All multi-record updates must use Prisma transactions.
- All endpoints validate ownership and return 4xx errors for domain checks (locked, not enrolled).
- Provide migration/backfill scripts with `--dry-run` and idempotent updates.
