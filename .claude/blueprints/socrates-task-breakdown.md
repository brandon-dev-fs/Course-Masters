# Socrates Agent — Task Breakdown

A roadmap for implementing the Socrates agent described in `socrates-agent-blueprint.md`. Each task is a self-contained unit of work that goes through the full workflow: `/spec` → `/design` → `/implement`. Tasks are ordered by dependency — each builds on the ones before it.

---

## Codebase integration notes

These observations inform how the blueprint maps onto the existing system.

**No new LearnerProfile model.** The blueprint proposes a separate `LearnerProfile`. The existing `User` model plus course history (`Course`, `LessonCompletion`, `UnitCompletion`, `AssessmentAttempt`) already provide enough signal for the agent to infer learner context. Preferences the agent collects during elicitation (media prefs, pace, goals) are stored in `CourseSpec.elicitationData` — they're per-course-build, not per-user. If persistent user preferences become necessary later, that's a future task.

**Three new models needed.** `TrustedSource` (admin-managed source registry), `CourseSpec` (draft artifact the agent produces), `AgentSession` (conversation + phase state). All follow existing conventions: UUID IDs, `@@map` snake_case, `createdAt`/`updatedAt`, soft deletes where appropriate.

**No AI dependencies exist yet.** The server has no LLM packages. Tasks that introduce AI SDK dependencies (`ai`, `@ai-sdk/anthropic`) must justify and pin them per backend rules.

**Existing services are the write layer.** The blueprint's "build tools" (`createCourse`, `createUnit`, etc.) map directly to existing service functions in `course.service.ts`, `unit.service.ts`, `lesson.service.ts`, `assignment.service.ts`, `assessment.service.ts`. The agent calls these — it does not duplicate them.

**Assessment questions use existing formats.** The agent generates `AssessmentQuestion` records with `content` JSON matching the existing `QuestionType` discriminated union (`multiple_choice`, `true_false`, `matching`, `fill_in_blank`). No new question types.

**Web search API is TBD.** The resource curation phase needs a web search API scoped to trusted domains. The specific provider (Google Custom Search, Brave, Tavily, etc.) requires research during that task's spec phase.

---

## Task 1: Data layer — new models and migration

**What:** Add `TrustedSource`, `CourseSpec`, and `AgentSession` models to the Prisma schema. Create migration. Seed `TrustedSource` with an initial set of approved sources.

**Why first:** Every subsequent task depends on these models existing. No application code can be written without the data layer.

**Scope:**
- `TrustedSource` — name, domain, contentTypes (Json), categories (Json), active flag. Admin-managed, no soft delete (hard delete with active flag).
- `CourseSpec` — links to User (creator) and optionally to Course (once built). Holds `elicitationData` (Json), `outline` (Json), `buildLog` (Json). Status enum: `drafting`, `reviewing`, `approved`, `building`, `completed`, `failed`. Soft delete.
- `AgentSession` — links to User and CourseSpec. Holds `phase` (string enum), `currentStep`, `elicitationState` (Json), `conversationLog` (Json). One active session per user (enforced in application, not schema). Expiry field for cleanup.
- Seed script adds initial trusted sources (Khan Academy, freeCodeCamp, MDN, python.org, react.dev, etc.)
- Relations: User → AgentSession (1:many), User → CourseSpec (1:many), AgentSession → CourseSpec (1:1), CourseSpec → Course (optional 1:1)

**Builds on:** Nothing — this is the foundation.

---

## Task 2: Trusted source admin

**What:** Backend CRUD endpoints for managing the `TrustedSource` registry, plus a frontend admin page.

**Why second:** The source registry must be populated and manageable before the agent can curate resources. This is also standalone — usable without the agent.

**Scope:**
- Backend: routes, controller, service, Zod schemas for `TrustedSource` CRUD. All routes require `admin` role.
  - `GET /api/admin/trusted-sources` — list all (with optional `?active=true` filter)
  - `POST /api/admin/trusted-sources` — create
  - `PUT /api/admin/trusted-sources/:sourceId` — update
  - `DELETE /api/admin/trusted-sources/:sourceId` — deactivate (set `active: false`)
- Frontend: admin page at `/admin/trusted-sources` with table view, add/edit modal, deactivate toggle. Follows existing admin page patterns (`AdminUsersPage`).

**Builds on:** Task 1 (TrustedSource model).

---

## Task 3: Agent session management

**What:** Backend CRUD endpoints for `AgentSession` lifecycle. No LLM integration yet — just session creation, retrieval, and cleanup.

**Scope:**
- Backend: routes, controller, service, Zod schemas.
  - `POST /api/agent/sessions` — create new session (enforces one-active-per-user constraint, creates linked `CourseSpec` in `drafting` status)
  - `GET /api/agent/sessions` — list user's sessions
  - `GET /api/agent/sessions/:sessionId` — get session state
  - `DELETE /api/agent/sessions/:sessionId` — abandon session
- One-active constraint: creating a new session when one exists returns 409 or auto-closes the old one (decision for spec phase).
- Session expiry: `expiresAt` field, stale sessions cleaned up on access or via a utility.
- All routes require authentication. Users can only access their own sessions.

**Builds on:** Task 1 (AgentSession + CourseSpec models).

---

## Task 4: Agent core — LLM integration and tool framework

**What:** Set up the Vercel AI SDK with Anthropic provider. Build the agent loop infrastructure: receive message → load state → build prompt → call LLM → handle tool calls → respond. Implement the streaming message endpoint.

**Why here:** This is the engine. All subsequent agent behavior (elicitation, outline, curation, build) plugs into this loop as phase-specific prompts and tools.

**Scope:**
- Dependencies: `ai`, `@ai-sdk/anthropic`, configure Anthropic API key in env.
- Agent loop: stateless per-turn execution. Each turn loads session state from DB, constructs the system prompt (phase-aware), appends conversation history (rolling window), calls the LLM, processes tool calls in a loop, saves updated state, returns response.
- Streaming endpoint: `POST /api/agent/sessions/:sessionId/message` — accepts user message, streams LLM response via Server-Sent Events or Vercel AI SDK's streaming format.
- Tool framework: typed tool definitions using Zod schemas. Tools are registered per-phase — the LLM only sees tools relevant to its current phase.
- State tools: `updateElicitationState`, `transitionPhase` — the LLM calls these to persist progress and move between phases.
- Conversation memory: rolling window of last ~20 messages stored in `AgentSession.conversationLog`. Summary generation at phase transitions and window overflow (LLM summarizes older messages into a running summary).
- No phase-specific behavior yet — just the infrastructure that phases plug into.

**Builds on:** Task 3 (session endpoints to load/save state).

---

## Task 5: Elicitation engine (Phases 1–2)

**What:** Implement the pre-load and elicitation phases. The agent reads the user's course history and assessment scores, then conducts a structured interview to narrow topic, scope, prior knowledge, preferences, and goals.

**Scope:**
- Phase 1 (pre-load) tools:
  - `getUserProfile` — reads User + enrolled courses + completions + assessment attempts. No interaction with user.
- Phase 2 (elicitation) system prompts:
  - Behavioral instructions encoding the decision tree from blueprint section 3.2.
  - Stages: topic identification → scope narrowing → source coverage check → prior knowledge assessment → preference gathering → goal setting.
  - `elicitationState` tracks `stagesCompleted` array in `AgentSession`.
- Phase 2 tools:
  - `checkSourceCoverage` — queries `TrustedSource` for domain/category coverage on the proposed topic. Returns coverage report so the agent can tell the user if the topic is supportable.
- Elicitation confirmation gate: agent summarizes the collected spec, asks user to approve. On approval, transitions to Phase 3 and populates `CourseSpec.elicitationData`.
- Approval endpoint: `POST /api/agent/sessions/:sessionId/approve` — user confirms current phase output.

**Builds on:** Task 4 (agent loop + tool framework), Task 1 (TrustedSource for coverage check).

---

## Task 6: Chat UI

**What:** Frontend chat interface for interacting with the Socrates agent. Handles the conversational flow for all phases.

**Scope:**
- New route: `/agent` or `/agent/:sessionId` — the agent chat page.
- Session management UI: start new session, resume existing session, abandon session.
- Chat interface: message list (user + agent messages), text input with send button, streaming response display (agent messages appear incrementally).
- Phase indicator: visual display of current phase (pre-load → elicitation → outline → curation → build → summary) so the user knows where they are.
- Approval UI: when the agent presents a summary for confirmation (elicitation confirmation gate), render approve/revise buttons. Calls the approval endpoint.
- Loading/error states: spinner during LLM response, error display on failure, retry affordance.
- Navigation: accessible from the main nav for authenticated users.
- Mobile responsive.

**Builds on:** Task 4 (streaming message endpoint), Task 5 (elicitation produces actual conversation to display).

---

## Task 7: Outline generation and review (Phase 3)

**What:** The agent generates a pedagogically-structured course outline and presents it for user approval. Implements the Backward Design + Bloom's Taxonomy + Gradual Release frameworks from the blueprint.

**Scope:**
- Phase 3 system prompts encoding the pedagogical framework:
  - Backward Design: define outcomes → assessment strategy → learning experiences.
  - Bloom's progression: sequence lessons within units from remember/understand → apply/analyze.
  - Gradual Release: more modeling early in units, more independent practice late.
  - CRLT 6-step and Gagné's 9 Events inform lesson-level structure in `planContent`.
  - Constraints: 2–3 objectives per lesson, bridge lessons at difficulty jumps.
- Outline stored in `CourseSpec.outline` (Json) — structured representation of units, lessons, objectives, Bloom's levels, estimated time, assignment types per lesson.
- Outline review UI: structured display of the generated outline (not just chat text). Shows unit/lesson hierarchy, objectives, Bloom's level badges. Approve, request changes, or reject buttons.
- Revision loop: if user requests changes, agent revises and re-presents.
- On approval, transition to Phase 4.

**Builds on:** Task 5 (elicitation populates CourseSpec), Task 6 (chat UI for conversation, extended with outline review component).

---

## Task 8: Resource curation and review (Phase 4)

**What:** The agent searches for web resources from trusted sources, validates URLs, matches resources to lessons based on pedagogical roles (Gagné's events), and presents the resource plan for user review.

**Scope:**
- Web search API integration: research and select a provider. Implement `searchResources` tool that searches scoped to `TrustedSource` domains. Returns candidate URLs with metadata (title, description, content type).
- URL validation tool: `validateUrl` — HTTP HEAD request to confirm URL is live, returns status and content type.
- YouTube metadata tool: `getYoutubeTitle` — calls existing `/api/youtube/title` endpoint.
- Phase 4 system prompts:
  - Intent-based search: agent maps each lesson's assignments to Gagné's events and searches for appropriate content type (intro explainer, tutorial, worked example, practice material).
  - Resource-to-assignment mapping: agent assigns each found resource to a specific assignment slot in the outline.
- Provenance tracking: each resource in `CourseSpec.outline` records `{ sourceUrl, sourceName, trustedSourceId, retrievedAt }`.
- Resource review UI: structured display of resources per lesson. Source attribution visible. User can approve, flag specific items for re-search, or request alternatives.
- Anti-hallucination enforcement: agent can only use URLs from domains in the `TrustedSource` registry. Prompt instructions prohibit generating content from the LLM's own knowledge.

**Builds on:** Task 7 (outline defines what resources are needed), Task 2 (TrustedSource registry provides domain list).

---

## Task 9: Course builder (Phases 5–6)

**What:** The agent executes the approved `CourseSpec` by writing records to the database through existing services, then presents a summary with a link to the built course.

**Scope:**
- Phase 5 (build) — automated execution, no user interaction:
  - Creates records in dependency order: Course → Units → Lessons → Assignments (+ child records) → Assessments + Questions.
  - Each create call uses existing service functions (`courseService.create`, `unitService.create`, etc.).
  - `buildLog` in `CourseSpec` tracks each step: entity type, entity ID, status (success/failed), timestamp. Enables resume on failure.
  - Assessment generation: LLM generates quiz questions targeting stated lesson objectives, using existing `QuestionType` formats. Questions must be derivable from curated resources (prompt-enforced).
  - `CourseSpec.status` transitions: `approved` → `building` → `completed` or `failed`.
  - On failure: log error, halt, report to user with option to retry from last successful point.
  - On success: link `CourseSpec.courseId` to the created `Course`.
- Phase 6 (summary):
  - Agent presents: course link, unit/lesson count, resource count, assessment count.
  - Offer to adjust (links to manual editing via existing course builder UI).
- Build trigger: `POST /api/agent/sessions/:sessionId/build` — initiates Phase 5 from an approved spec.
- Build progress UI: display build steps as they complete (can be simple progress list, not necessarily real-time streaming).

**Builds on:** Task 8 (approved CourseSpec with resources), existing services (no new write logic needed).

---

## Task 10: Integration, error recovery, and polish

**What:** End-to-end flow hardening. Conversation memory refinement, error recovery paths, model escalation, and UX polish across all phases.

**Scope:**
- Conversation memory: refine rolling window + summarization. Ensure summaries at phase transitions capture key decisions. Tune window size based on token budget.
- Model escalation: implement Sonnet → Opus escalation for complex pedagogical decisions (outline generation for advanced topics, assessment question quality). Configurable per-phase or self-escalating.
- Error recovery:
  - LLM API failures: retry with exponential backoff (up to 3 attempts). Session state is safe — user can send another message to retry.
  - Curation failures: agent reports under-resourced lessons, suggests scope adjustment.
  - Build failures: resume from `buildLog` checkpoint.
  - Validation failures: LLM self-corrects inside tool-call loop (invisible to user).
- Session expiry: cleanup logic for abandoned sessions (30-day expiry from blueprint).
- Navigation polish: course link from summary phase, "back to course" flow, session history.
- Edge cases: empty search results, all URLs dead, user abandons mid-phase, user sends irrelevant messages during elicitation.
- Rate limiting: agent message endpoint gets its own rate limit bucket (LLM calls are expensive).

**Builds on:** All previous tasks. This is the hardening pass.

---

## Dependency graph

```
Task 1 (data layer)
├── Task 2 (trusted source admin)
│   └── Task 8 (resource curation) ──┐
├── Task 3 (session management)      │
│   └── Task 4 (agent core + LLM)   │
│       └── Task 5 (elicitation)     │
│           ├── Task 6 (chat UI)     │
│           └── Task 7 (outline) ────┤
│                                    │
│               Task 9 (builder) ◄───┘
│                                    
└── Task 10 (integration + polish) ◄── all tasks
```

**Parallelizable:** Tasks 2 and 3 can run in parallel (both depend only on Task 1). Task 6 can start as soon as Task 4 is done, in parallel with Task 5's backend work.

---

## Spec IDs

When each task enters the workflow via `/spec`, it will receive the next available ID starting from `cm-0035`. Tentative mapping:

| Task | Spec ID | Title |
|------|---------|-------|
| 1 | cm-0035 | Socrates data layer — TrustedSource, CourseSpec, AgentSession |
| 2 | cm-0036 | Trusted source admin CRUD + UI |
| 3 | cm-0037 | Agent session management endpoints |
| 4 | cm-0038 | Agent core — AI SDK integration and tool framework |
| 5 | cm-0039 | Elicitation engine (Phases 1–2) |
| 6 | cm-0040 | Agent chat UI |
| 7 | cm-0041 | Outline generation and review (Phase 3) |
| 8 | cm-0042 | Resource curation and review (Phase 4) |
| 9 | cm-0043 | Course builder (Phases 5–6) |
| 10 | cm-0044 | Agent integration, error recovery, and polish |
