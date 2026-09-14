# Course Offering & Progress Context

## Scope
End-to-end course creation, delivery, progression, assessments, certifications, and enrollment/payment flows.

## Domain Model
- Course: title, slug/visibility, modules[], finalAssessment?, publish state, pricing.
- Module: course ref, order, lessons[], optional assessment ref.
- Lesson: module ref, order, hasQuiz flag, content pointers.
- Quiz: per-lesson config (passingScore, attemptsAllowed, grading mode) + questions.
- QuizAttempt: enrollment+user scoped attempts with attemptNo, score, status.
- Enrollment: user↔course, status (ENROLLED/IN_PROGRESS/COMPLETED), payment state, revenue splits.
- CourseProgress: per-enrollment modules/lessons statuses, attempts, scores, completedAt, bestScore, assessmentPassed.
- Certificate: enrollment ref, serial, issuedAt, fileUrl, revoked.

## State Machine
- Lesson: NOT_STARTED→IN_PROGRESS on view; PASSED on no-quiz complete or quiz pass; FAILED when attempts exhausted; LOCKED until unlocked.
- Quiz: each submit creates QuizAttempt attemptNo=prev+1; auto-grade when grading=auto; pass if score ≥ passingScore; manual grading updates later.
- Module: PASSED when all lessons PASSED and assessment (if any) passed; unlock next module (status NOT_STARTED, first lesson unlocked).
- Course: final assessment unlock when all modules PASSED; pass sets Enrollment COMPLETED, records overallScore, triggers certificate.
- Navigation: Next enabled only when lesson status PASSED; locked lessons/modules blocked.

## API Surface (examples)
- POST /enrollments/:id/start → build CourseProgress, set enrollment IN_PROGRESS.
- POST /enrollments/:id/lessons/:lessonId/view → mark IN_PROGRESS, lastViewedAt; reject LOCKED.
- POST /enrollments/:id/lessons/:lessonId/complete → no-quiz pass, re-check module unlock.
- POST /enrollments/:id/quizzes/:quizId/submit → create attempt, grade, update lesson status/attempts/bestScore.
- POST /enrollments/:id/modules/:moduleId/assessment → record pass/score, update module, unlock next.
- POST /enrollments/:id/final-assessment → mark course complete, issue certificate.
- GET /enrollments/:id/progress → single source for UI (statuses, locks, attempts, scores, ticks).

## Frontend Gating
- Drive UI from progress API: green tick when lesson PASSED; show attempts remaining, scores, and locks.
- Disable Next until lesson PASSED; prevent opening LOCKED lessons/modules.
- After quiz submit, merge returned lessonProgress; optimistic update for no-quiz completion with rollback on error.
- Final assessment CTA only after all modules PASSED; show certificate when enrollment COMPLETED.

## Data & Indexes
- Unique indexes: Course.slug; Module {course, order}; Lesson {module, order}; Enrollment {user, course}; QuizAttempt {quiz, user}; CourseProgress {enrollment}.
- Store hasQuiz on Lesson; keep quizzes in their own collection; normalize progress in CourseProgress (avoid duplicated booleans elsewhere).

## Payments & Enrollment
- One enrollment per user+course; verify payments (Paystack/Stripe/Flutterwave) before activation; block instructor self-enrollment.
- Status transitions: ENROLLED → IN_PROGRESS (on startCourse) → COMPLETED (final pass or admin override).

## Operations & Reliability
- Use MongoDB transactions for multi-document writes; keep them short.
- Log structured events for progress mutations; add metrics (pass/fail rates, attempts, completion time, certificates).
- Rate-limit quiz submissions; sanitize quiz answers; validate lesson/quiz-course ownership on every mutation.
- Certificates via background job to object storage (URL in Certificate); support revocation.

## Testing Checklist
- Unit: startCourse, viewLesson, completeLessonNoQuiz, submitQuiz (pass/fail/exhausted/manual), completeModuleAssessment, final assessment.
- Integration: multi-module course with mixed quiz/no-quiz lessons and assessments; verify unlocks/ticks.
- Concurrency: double-submit quiz/lesson complete preserves attemptNo and bestScore.
- Frontend E2E: locks, ticks, Next gating, attempts left, final assessment unlock, certificate display.

## Experience & Business Enhancements (Roadmap)

### Smarter Learning Experience
- Adaptive paths: allow skips when assessments ≥90%; unlock next module at ≥80% completion of current; track weak topics and suggest remediation content.
- Progress intelligence: capture time per lesson, learning velocity (lessons/week), streak days; detect high-friction lessons (replays, pauses, note spikes).
- Personalized tools: bookmarks and timestamped notes; dashboard with pace vs cohort and recommended study schedule.

### Assessments & Evaluation
- Question bank with tagged questions (topic, difficulty) and random N-per-attempt draws to reduce memorization.
- Rich item types: MCQ, fill-in, essay, coding; manual grading queue + peer review option for subjective work.
- Retake logic: show missed items (optionally after cooldown), require review suggestions, enforce cooldown windows between attempts.

### Engagement & Community
- Gamification: badges (streaks, perfect scores, peer help), points, leaderboards (daily/weekly/all-time), milestone celebrations.
- Discussions: per-course and per-lesson threads; instructor/peer Q&A to deflect support.
- Social learning: public learner profiles, study groups by progress band, course reviews/ratings; live Q&A/cohort sessions with attendance credit.

### Flexible Business Models
- Pricing: one-time, subscription, installments, early-bird/volume discounts, bundles/learning paths.
- Teams/corporate: seat licensing, bulk enrollment, team admin dashboards, single invoice.
- Revenue: affiliates, dynamic pricing, lifetime vs time-limited access; refund policies with progress-based partials.

### Scalability & Performance
- Architecture: Redis caching (catalogs, leaderboards), CDN for media, archive cold data to object storage.
- Analytics precompute: daily materialized stats (enrollment, completion, revenue); real-time dashboards from precomputed stores.
- Offline/PWA: queued progress/quiz submissions, downloadable lessons (mobile), sync on reconnect.

### Analytics
- Instructors: drop-off heatmaps per lesson, question difficulty stats, revenue funnels, engagement scores.
- Students: strengths/weaknesses by module, peer percentile, reminders, estimated completion at current velocity.
- Admins: real-time enrollment/revenue, cohort comparisons, A/B tests for pricing/unlock/email strategies.

### Advanced (Long-term)
- AI assistant for Q&A and content retrieval.
- Recommendations: course and career-path suggestions from history/performance.
- Content versioning: allow updates without disrupting in-progress learners; opt-in to latest.

## Phased Implementation (90+ days)
- Phase 1: progress telemetry (time, streaks, velocity), question bank + randomization, notes/bookmarks, basic achievements.
- Phase 2: discussions, leaderboards/gamification, flexible pricing SKUs, instructor analytics v1.
- Phase 3: learning paths/bundles, team/corporate features, performance boosts (cache/CDN), advanced analytics.
- Phase 4: live sessions, AI assistant, offline/PWA, peer review and rich assignment types.

## Expected Impact
- Student: +40-60% completion (adaptive + engagement), faster time-to-complete, higher stickiness via community and streaks.
- Business: +30-50% enrollments (pricing/bundles/recs), +25% revenue per learner (upsells), lower support via forums/AI.
- Ops/Performance: faster pages (cache/CDN), less manual grading (banks/automation), real-time insights instead of ad-hoc reports.


What to alter in the current 
   implementation to reach the new context         
   goals

   Data model & persistence
   •  Normalize lessons/quizzes: Move from
      embedded lessons in Module to a Lesson       
       collection with hasQuiz, order,
      module ref; ensure Quiz.lesson points
      to that ref. Add
      Question/question-bank modeling with
      tags (topic, difficulty) and pools for       
       randomized selection.
   •  Progress source of truth: Retire/stop        
      writing duplicate progress in
      Enrollment.progress; keep all
      progression in CourseProgress
      (modules/lessons, attempts, scores,
      streaks, time spent, velocity).
   •  Indexes: Add missing unique/compound
      indexes: Course.slug,
      Module{course,order},
      Lesson{module,order},
      Enrollment{user,course},
      QuizAttempt{quiz,user},
      CourseProgress{enrollment}.
   •  Telemetry fields: Add per-lesson
      time-tracking, streak counters,
      velocity metrics, bookmarks/notes, and       
       engagement signals (replays, pauses)        
      to progress/analytics collections.

   State machine & services
   •  Adaptive unlocks: Extend unlock logic        
      to (a) allow skipping when score ≥90%        
      on assessments, (b) unlock next module       
       at ≥80% completion of current
      (configurable), while still enforcing        
      locks elsewhere.
   •  Retake/cooldown logic: Add cooldown
      timestamps and per-question feedback;        
      enforce attemptsAllowed + cooldown
      before retake; store missed-question
      references for review suggestions.
   •  Assessments: Add module/final
      assessment flows with pass/fail,
      scoring, and unlock/COMPLETED
      transitions; support manual grading
      queue and peer-review path for
      essays/open-ended items.
   •  Question bank randomization: Build
      “assemble quiz attempt” service that
      pulls N questions by difficulty/topic        
      distribution; persist the variant per        
      attempt.
   •  Manual grading updates: Add
      endpoint/process to update
      lesson/module status after manual
      grading; surface pending/manual
      statuses in progress.

   Frontend gating & UX
   •  Progress-driven UI: Drive
      ticks/locks/Next from GET 
      /enrollments/:id/progress instead of
      local lesson.completed flags; disable        
      Next unless lesson status = PASSED.
   •  Adaptive UI: Show skip/fast-track
      options when high scores are present;        
      gate module unlock at 80% policy; show       
       attempts remaining, cooldown timers,        
      and recommended review links.
   •  Study tools: Add bookmarks and
      timestamped notes to lessons/videos;
      show personalized dashboard (pace vs
      cohort, estimated completion,
      streaks).
   •  Assessments UI: Support question-bank        
      quizzes, essays/coding inputs, review        
      of incorrect questions
      (post-cooldown), and manual grading
      status.

   Payments & business logic
   •  Pricing models: Extend
      enrollment/payment layer to support
      subscriptions/installments/bundles;
      add product/plan SKUs; enforce one
      active enrollment per user+course.
   •  Refund policy: Implement
      progress-aware refunds (e.g., full if        
      <10%); store refund state and audit.
   •  Teams/corporate: Add bulk enrollment
      endpoints, seat management, and team
      admin progress views.

   Analytics, caching, and ops
   •  Metrics pipeline: Log structured
      events for views, attempts,
      passes/fails, time-on-lesson, streaks;       
       precompute daily stats (enrollment,
      completion, revenue, question
      difficulty).
   •  Caching/CDN: Add Redis caching for
      catalogs/leaderboards; move media to
      CDN; archive cold data to object
      storage.
   •  PWA/offline (later): Queue
      progress/quiz submits offline and sync       
       on reconnect.

   Transitional clean-up
   •  Backfill CourseProgress for existing
      enrollments; migrate lessons to
      dedicated collection; update quizzes
      to reference real lessons.
   •  Remove or stop writing
      Enrollment.progress booleans to avoid        
      divergence.
   •  Add migrations to create the required        
      indexes.                                  
