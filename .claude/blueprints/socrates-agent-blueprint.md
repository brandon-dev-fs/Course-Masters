# Socrates Agent — Blueprint

An AI agent for Course Masters that builds structured, pedagogically-sound courses through guided conversation, backed exclusively by vetted web resources.

---

## 1. What is Socrates

Socrates is an agentic system that turns "I want to learn X" into a fully-built course inside Course Masters. It conducts a structured interview, generates a course plan, curates real web resources, and writes records to the database — all with human checkpoints at critical decision points.

### Core constraints

1. **No hallucinated content.** Every resource URL comes from a pre-approved source registry. Every quiz question is derived from curated material. If the agent can't find adequate material, it stops and says so.
2. **Pedagogically structured.** Lessons follow evidence-based planning frameworks (CRLT 6-step model, Rosenshine's Principles of Instruction). The agent builds courses the way a trained teacher would plan them.
3. **Human-in-the-loop at decision boundaries.** The agent gathers information and proposes plans. Humans approve before anything is committed to the database.

---

## 2. Agent architecture

### 2.1 Agentic pattern

Socrates is a **stateful, tool-calling agent** running a loop:

```
receive message → load state → build LLM prompt → call LLM →
  LLM returns: text response | tool call | phase transition →
    if text: return to user, save state
    if tool call: execute tool, feed result back to LLM, loop
    if phase transition: update phase, notify user
```

This is not a single prompt-in/response-out system. The LLM reasons about what to do next, calls tools when it needs external data (search, DB queries, URL validation), and loops until it has a complete response for the user.

### 2.2 Model strategy

**Primary model: Claude Sonnet** — handles all conversational reasoning, outline generation, quiz question creation, and tool-call orchestration. Sonnet balances quality with speed and cost for an interactive agent.

**Escalation to Claude Opus** — for complex pedagogical decisions: structuring a course outline for an advanced topic, generating assessment questions that properly test higher-order Bloom's levels, or recovering from failed curation (not enough resources found). The agent can self-escalate or be configured to always use Opus for specific phases.

**No vision/multimodal required at launch.** The agent works with text — URLs, metadata, structured data. If future iterations need to analyze video thumbnails or PDF content from resources, multimodal can be added per-tool.

### 2.3 Library / framework

**Vercel AI SDK (`ai` package)** — provides the tool-calling interface, streaming, and model-provider abstraction. TypeScript-native, works with the Anthropic provider (`@ai-sdk/anthropic`), and handles the call-tool-loop-respond cycle.

The AI SDK is deliberately low-level — it gives us LLM primitives without imposing opinions about state, memory, or workflows. That's the right fit here because Socrates's state management (AgentSession, ConversationLog, phase transitions) is custom-designed around the existing Prisma/Postgres stack. A higher-level framework would duplicate or fight that design.

**Alternatives considered:**
- **Mastra** — built on top of Vercel AI SDK, adds workflows, memory, HITL, and durable execution out of the box. Strong choice for TypeScript agents, but its built-in memory and workflow primitives overlap with what we've already designed. Adds framework opinions and a learning curve without proportional benefit since we're managing state ourselves.
- **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) — Anthropic's official SDK, powers Claude Code. Designed for code agents (file editing, terminal commands). Wraps the Claude Code CLI binary. Overkill for a conversational agent that doesn't need filesystem access.
- **LangChain/LangGraph TS** — Python-first ecosystem; TypeScript port lags behind and inherits Python idioms that don't fit naturally in an Express codebase.
- **Raw Anthropic API** — No framework at all. Viable, but too much boilerplate for tool-calling loops, streaming, and retries.

**What the AI SDK handles for us:**
- Model abstraction (swap Sonnet/Opus without code changes)
- Tool-calling loop (LLM calls tool → execute → feed result back → loop)
- Streaming responses to the client
- Zod-based tool parameter schemas (already in the project)

**What we build ourselves (on top of the AI SDK):**
- Agent state machine (phase transitions, step tracking)
- Conversation persistence (AgentSession in Postgres)
- Memory strategy (rolling window + summarization)
- HITL gates (approval endpoints)
- Workflow orchestration (elicitation → outline → curation → build)

Key dependencies:
```
ai                    # Vercel AI SDK core
@ai-sdk/anthropic     # Claude provider
zod                   # Tool parameter schemas (already in the project)
```

### 2.4 Tool system

The LLM doesn't write to the database directly. It calls **tools** — functions the agent exposes that do specific, bounded things. The LLM decides _which_ tool to call and _with what arguments_; the tool executes and returns structured results.

Tools are grouped by phase:

**Elicitation tools:**
- `getUserProfile` — reads LearnerProfile + course history + assessment scores
- `checkSourceCoverage` — queries TrustedSource registry for a topic/category, returns coverage report

**Curation tools:**
- `searchResources` — web search scoped to TrustedSource domains, returns candidate URLs with metadata
- `validateUrl` — HTTP HEAD check, confirms URL is live and returns content type
- `getYoutubeTitle` — calls existing `/api/youtube/title` endpoint for video metadata

**Build tools:**
- `createCourse` — writes Course record via existing service
- `createUnit` — writes Unit record via existing service
- `createLesson` — writes Lesson record (including objective + planContent)
- `createAssignment` — writes Assignment + child record via existing service
- `createResource` — writes LessonResource via existing service
- `createTool` — writes LessonTool via existing service
- `createAssessment` — writes Assessment + questions via existing service

**State tools:**
- `updateElicitationState` — persists collected fields to AgentSession
- `transitionPhase` — moves to next phase, triggers summary generation

The LLM never sees raw SQL or Prisma calls. It sees tool names, parameter schemas, and return types. The tools are thin wrappers around existing services, adding provenance tracking and validation.

### 2.5 State management

Agent state lives in Postgres (AgentSession + CourseSpec), not in-memory. This means:
- Sessions survive server restarts
- Users can close their browser and resume later
- Multiple server instances can serve the same session (no sticky sessions needed)
- State transitions are transactional (no half-updated sessions)

The LLM is stateless. Every turn, the agent reconstructs context from: system prompt + conversation summary + last ~20 messages + current elicitation state. The LLM doesn't "remember" — it's told what happened.

---

## 3. Operational flow

### 3.1 The full pipeline

```
User: "I want to learn Python for data science"
                    │
                    ▼
    ┌───────────────────────────────┐
    │  PHASE 1: PRE-LOAD           │  No user interaction
    │  Read profile + history       │  Tool calls: getUserProfile
    │  Infer what we already know   │
    └───────────────┬───────────────┘
                    ▼
    ┌───────────────────────────────┐
    │  PHASE 2: ELICITATION         │  HITL: Full conversation
    │  Narrow scope, assess level   │  Multiple turns
    │  Gather preferences + goals   │  Tool calls: checkSourceCoverage
    │  Output: CourseSpec (draft)    │
    └───────────────┬───────────────┘
                    ▼
    ┌───────────────────────────────┐
    │  PHASE 3: OUTLINE GENERATION  │  Agent generates, then pauses
    │  Produce unit/lesson plan     │  ► HITL GATE: user approves/revises
    │  Apply pedagogical framework  │
    │  Output: outline in CourseSpec │
    └───────────────┬───────────────┘
                    ▼
    ┌───────────────────────────────┐
    │  PHASE 4: RESOURCE CURATION   │  Agent searches + validates
    │  Search trusted sources       │  Tool calls: searchResources,
    │  Validate URLs                │    validateUrl, getYoutubeTitle
    │  Match to pedagogical roles   │  ► HITL GATE: user reviews resource list
    │  Output: populated CourseSpec  │
    └───────────────┬───────────────┘
                    ▼
    ┌───────────────────────────────┐
    │  PHASE 5: BUILD               │  Automated (no HITL)
    │  Create records via tools     │  Tool calls: createCourse, createUnit,
    │  Log each step for resume     │    createLesson, createAssignment, etc.
    │  Output: live course          │
    └───────────────┬───────────────┘
                    ▼
    ┌───────────────────────────────┐
    │  PHASE 6: SUMMARY             │  Agent presents result
    │  Show course link             │  ► HITL: user navigates to course
    │  Offer to adjust              │
    └───────────────────────────────┘
```

### 3.2 Decision flow: How the agent decides what to do

At every turn, the LLM receives the current phase and state, and decides from a finite set of actions. This is not open-ended — the system prompt constrains behavior per phase.

**Phase 2 (Elicitation) decision tree:**
```
Has topic been identified?
  No  → Ask about topic
  Yes → Has scope been narrowed?
    No  → Ask clarifying questions about scope
    Yes → Do trusted sources cover this scope?
      No  → Tell user, suggest scope adjustment
      Yes → Has prior knowledge been assessed?
        No  → Is it inferable from course history?
          Yes → Infer, confirm with user
          No  → Ask
        Yes → Have learning preferences been set?
          No  → Are they in LearnerProfile?
            Yes → Confirm with user
            No  → Ask
          Yes → Have goals been set?
            No  → Ask
            Yes → Summarize spec, ask for approval
```

The LLM doesn't execute this tree as code — it's encoded in the system prompt as behavioral instructions. The `elicitationState.stagesCompleted` array tells the LLM which branches are resolved.

**Phase 3 (Outline) decision tree:**
```
Does outline exist in CourseSpec?
  No  → Generate outline using pedagogical framework
  Yes → Has user seen it?
    No  → Present outline for review
    Yes → Did user request changes?
      Yes → Revise outline based on feedback
      No  → Did user approve?
        Yes → Transition to Phase 4
        No  → Wait for user input
```

**Phase 4 (Curation) decision tree:**
```
For each lesson in outline:
  Does lesson have all required assignments populated?
    No  → What type of content is needed next?
      Introduction content → searchResources(topic, "intro explainer")
      Activity content → searchResources(topic, "tutorial walkthrough")
      Comprehension check → derive from activity content (no search needed)
    Yes → Move to next lesson
  All lessons populated?
    Yes → Present resource summary for user review
```

**Phase 5 (Build) — no decisions, pure execution:**
```
For each entity in order (Course → Units → Lessons → Assignments → Resources → Tools → Assessments):
  Has this entity been created? (check buildLog)
    No  → Call create tool → log result
    Yes → Skip (resume support)
  Did creation fail?
    Yes → Log error, halt, report to user
```

### 3.3 Human-in-the-loop gates

There are exactly three HITL points where the agent pauses and waits for human input:

| Gate | What the agent presents | What the human decides | What happens on rejection |
|---|---|---|---|
| **Elicitation confirmation** | "Here's what I understand you want..." (full spec summary) | Approve, revise, or restart | Agent returns to relevant elicitation stage |
| **Outline approval** | Unit/lesson structure with objectives, estimated time, Bloom's levels | Approve, request changes, or reject | Agent revises outline and re-presents |
| **Resource review** | List of curated resources per lesson with source attribution | Approve, flag specific items, or request more options | Agent re-searches for flagged items |

The build phase (Phase 5) has **no HITL gate** — once resources are approved, the agent writes to the database without further confirmation. This is intentional: the user has already approved the structure and content. If something goes wrong, the course can be soft-deleted and the spec re-built.

### 3.4 Error handling and recovery

**Curation failures:** If the agent can't find enough trusted resources for a lesson, it does not proceed. It reports which lessons are under-resourced and suggests: (a) broadening the scope, (b) accepting fewer resources for those lessons, or (c) flagging them for manual curation later.

**Build failures:** The buildLog tracks every create call. If the build fails mid-way (e.g., database error on lesson 7 of 12), the agent can resume from the last successful point. The CourseSpec transitions to `failed` status with the error recorded.

**LLM failures:** If the Claude API returns an error or times out, the agent retries with exponential backoff (up to 3 attempts). The conversation state is safe in Postgres — the user can simply send another message to retry.

**Validation failures:** Before calling any create tool, the agent validates the payload against the existing Zod schemas. If validation fails, the LLM is told what went wrong and asked to fix the payload — this happens inside the tool-call loop, invisible to the user.

---

## 4. Pedagogical framework

Socrates builds lessons the way a trained teacher would — following researched lesson planning practices, not just dumping resources into a container.

### 4.1 Design philosophy: layered frameworks

No single instructional design model covers everything. Socrates uses different research-backed frameworks at different levels of the course hierarchy, each addressing a distinct design question:

| Level | Design question | Framework | Source |
|---|---|---|---|
| Course | What should the student achieve? How do we know they achieved it? | Backward Design (UbD) | Wiggins & McTighe, 1998 |
| Unit | How do topics build on each other? How is difficulty scaffolded? | Bloom's Taxonomy + Gradual Release of Responsibility | Anderson & Krathwohl, 2001; Fisher & Frey, 2013 |
| Lesson | What is the internal structure of a single lesson? | Gagné's 9 Events of Instruction | Gagné, Briggs & Wager, 1992 |
| Lesson (supporting) | What practical steps does the teacher/agent follow when planning? | CRLT 6-Step Lesson Plan | Milkova, U-Michigan |
| Cross-cutting | What instructional principles apply everywhere? | Rosenshine's Principles of Instruction | Rosenshine, 2012 |
| Retention | How is knowledge retained and transferred long-term? | Retrieval Practice + Spaced Repetition | Carpenter, 2020; Dunlosky et al., 2013 |

### 4.2 Course-level: Backward Design (Understanding by Design)

Source: Wiggins, G. & McTighe, J. (1998, 2005). *Understanding by Design.* ASCD.

Traditional course design starts with activities ("what content will I cover?"). Backward Design inverts this: start with the end, then work backward. The agent follows UbD's three stages when generating a course outline:

**Stage 1 — Identify desired results.** What should the student know, understand, and be able to do by the end of the course? The agent uses the elicitation data (topic, goal, depth) to define enduring understandings and essential questions. These become the Course.syllabus learning goals.

**Stage 2 — Determine acceptable evidence.** How will we know the student learned it? Before planning any lessons, the agent defines the course exam and unit quiz strategies. What does passing look like? This maps directly to the existing Assessment model and PASS_THRESHOLD = 0.8.

**Stage 3 — Plan learning experiences.** Only after outcomes and assessments are defined does the agent plan units, lessons, and assignments. Every activity traces back to a desired result from Stage 1.

This means the agent generates assessments *before* it generates lesson content — the assessments define what matters, and the lessons are designed to prepare the student for them.

### 4.3 Unit-level: Bloom's Taxonomy + Gradual Release of Responsibility

**Bloom's Revised Taxonomy** (Anderson & Krathwohl, 2001) classifies cognitive demand into six levels: remember → understand → apply → analyze → evaluate → create.

The agent uses Bloom's to sequence lessons within a unit, progressing from lower to higher cognitive levels. Early lessons in a unit focus on remembering and understanding; later lessons push toward applying and analyzing.

**Gradual Release of Responsibility** (Pearson & Gallagher, 1983; Fisher & Frey, 2013) structures instruction as: "I do → We do → You do." In the context of Socrates:

- **"I do" (modeling)** — early lessons in a unit are content-heavy: video tutorials, worked examples, demonstrations. The student watches and reads.
- **"We do" (guided practice)** — mid-unit lessons include practice problems with hints, scaffolded exercises, and flashcards alongside content. The student practices with support.
- **"You do" (independent practice)** — late-unit lessons reduce scaffolding and increase independent practice problems and open-ended assignments. The student applies knowledge alone.

This maps to how the agent distributes Assignment types across a unit: more video/reading early, more practice_problem/vocab late.

### 4.4 Lesson-level: Gagné's 9 Events of Instruction

Source: Gagné, R. M., Briggs, L. J., & Wager, W. W. (1992). *Principles of Instructional Design* (4th ed.).

Gagné's framework is the most granular — it defines the internal structure of a single lesson as a sequence of nine instructional events, each corresponding to a cognitive process:

| Event | Cognitive process | How Socrates implements it |
|---|---|---|
| 1. Gain attention | Reception | Lesson introduction hook — surprising fact, question, real-world scenario |
| 2. Inform learner of objectives | Expectancy | Lesson.objective field — displayed before content |
| 3. Stimulate recall of prior learning | Retrieval | Introduction references previous lesson's key concepts |
| 4. Present the content | Selective perception | Core assignments: video, reading, note |
| 5. Provide learning guidance | Semantic encoding | Worked examples, step-by-step tutorials, annotations |
| 6. Elicit performance | Responding | Practice problems, vocab exercises mid-lesson |
| 7. Provide feedback | Reinforcement | Practice problem explanations, not just correct/incorrect |
| 8. Assess performance | Retrieval | End-of-lesson quiz (lesson_quiz Assessment) |
| 9. Enhance retention and transfer | Generalization | Lesson conclusion: summary, connections to next lesson, real-world applications |

The lesson's planContent (stored in Lesson.planContent Json) maps directly to this 9-event structure. The agent populates each event with specific content when building the lesson.

### 4.5 Lesson planning support: CRLT 6-Step Model

Source: Milkova, S. "Strategies for Effective Lesson Planning." CRLT, University of Michigan. https://crlt.umich.edu/gsis/p2_5

While Gagné defines *what* a lesson contains, the CRLT model guides *how the agent plans* it — the practical steps for constructing a lesson:

1. Outline learning objectives (concrete, measurable, 2-3 per lesson)
2. Develop the introduction (hook + prior knowledge activation)
3. Plan specific learning activities (assignments matched to objectives)
4. Plan comprehension checks (mid-lesson, not just end-of-lesson)
5. Develop a conclusion (summary + preview of next lesson)
6. Create a realistic timeline (estimated minutes per section)

The CRLT model and Gagné's events overlap significantly — the CRLT steps are the planning actions, Gagné's events are the resulting lesson structure.

### 4.6 Cross-cutting: Rosenshine's Principles of Instruction

Source: Rosenshine, B. (2012). "Principles of Instruction." *American Educator*, 36(1). https://ies.ed.gov/sites/default/files/migrated/rel/infographics/pdf/REL_SE_Evidence-based_teaching_practices.pdf

These 10 principles apply across all levels of the course, not to any single lesson or unit:

| Principle | Where the agent applies it |
|---|---|
| Begin with review of previous learning | Gagné Event 3: each lesson stimulates recall of prior lesson |
| Present material in small amounts | 2-3 objectives per lesson, tight scoping |
| Ask questions to check understanding | Mid-lesson comprehension checks (Gagné Event 6) |
| Provide models and demonstrations | Curation prioritizes tutorials and walkthroughs over passive lectures |
| Guide practice with feedback | Practice problems include hints and explanations (Gagné Event 7) |
| Check for understanding frequently | Not just end-of-lesson quizzes — flashcards and practice throughout |
| Obtain high success rate (~80%) | Aligns with existing PASS_THRESHOLD = 0.8 |
| Scaffold difficult tasks | Gradual Release within units; bridge lessons between units |
| Require and monitor independent practice | Practice density increases in later lessons per unit |
| Weekly and monthly review | Unit quizzes review all unit lessons; course exam reviews all units |

### 4.7 Retention: Retrieval Practice + Spaced Repetition

Sources: Carpenter, S. K. (2020). "The effects of retrieval practice form on memory retention: A meta-analysis." *Psychological Bulletin*, 146(12). Dunlosky, J. et al. (2013). "Improving students' learning with effective learning techniques." *Psychological Science in the Public Interest*, 14(1).

Two cognitive science principles with strong research support:

**Retrieval practice** — actively recalling information from memory strengthens learning more than re-reading or passive review. The "testing effect" demonstrates that practice quizzes improve retention even without feedback. This directly justifies the agent's heavy use of flashcards, practice problems, and frequent lesson quizzes — these aren't just assessments, they're learning tools.

**Spaced repetition** — distributing practice over time produces stronger long-term retention than massing practice together. A meta-analysis by Hattie & Donoghue (2021) based on 242 studies confirmed that distributed practice and practice testing are the most effective learning techniques.

How Socrates applies these:
- **Flashcards and vocab tools** are retrieval practice — the student must recall, not just re-read
- **Lesson quizzes** serve as retrieval events, not just assessments
- **Unit quizzes** force spaced retrieval of earlier lessons (the student hasn't seen Lesson 1 material since completing it)
- **The course exam** is the longest-interval spaced retrieval event
- **Review lessons** — when the agent detects a difficulty jump between units, it inserts a bridge lesson that includes retrieval questions from the prior unit (spaced review)

### 4.8 How the agent uses the framework

The pedagogical framework is not a separate system — it's embedded in the LLM's system prompts. Each phase has specific pedagogical instructions:

**During outline generation (Phase 3)**, the system prompt instructs the LLM to apply Backward Design:
- Define course-level outcomes and essential questions first
- Design assessment strategy before lesson content
- Sequence lessons from lower to higher Bloom's levels within each unit
- Apply Gradual Release: more modeling early in units, more independent practice late
- Insert bridge/review lessons at difficulty jumps (spaced retrieval)
- Limit each lesson to 2-3 objectives

**During resource curation (Phase 4)**, the system prompt instructs the LLM to match Gagné's events:
- Events 1-3 (attention, objectives, prior recall) → short introductory content, hooks
- Events 4-5 (present content, provide guidance) → full tutorials, walkthroughs, worked examples
- Events 6-7 (elicit performance, feedback) → practice problems, vocab with explanations
- Events 8-9 (assess, transfer) → quiz questions tied to objectives, summary/connection content

**During quiz/assessment generation**, the system prompt instructs the LLM:
- Questions must target stated lesson objectives (Backward Design alignment)
- Questions should require retrieval, not recognition where possible
- Unit quizzes include questions from all unit lessons (spaced retrieval)
- Course exam spans all units (longest-interval spaced retrieval)

The framework lives in the prompts, not in code. This means it can be iterated without code changes — improving the prompts improves the pedagogy.

---

## 5. Provenance and anti-hallucination

### 5.1 Trusted source registry

A database table of approved domains maintained by product owners/admins. The agent can only pull resources from entries in this registry.

Example entries:
- Khan Academy (khanacademy.org) — video, reading — math, science, computing
- freeCodeCamp (freecodecamp.org) — video, reading — programming
- MDN Web Docs (developer.mozilla.org) — reading — web development
- 3Blue1Brown YouTube channel — video — math
- Official language/framework docs (python.org, react.dev, etc.) — reading

The registry stores: name, domain, content types it provides, categories it covers, and an active flag.

### 5.2 How provenance flows through the system

```
TrustedSource registry
        │
        ▼
Agent searches web, scoped to approved domains
        │
        ▼
Agent validates URLs are live (HTTP HEAD)
        │
        ▼
Agent records provenance in CourseSpec outline:
  { sourceUrl, sourceName, trustedSourceId, retrievedAt }
        │
        ▼
During build, provenance is encoded in human-readable fields:
  Assignment.title, Assignment.objective, ReadingAssignment.description,
  VideoAssignment.title
        │
        ▼
CourseSpec retained as permanent audit trail
  (any content record can be traced back to its source)
```

### 5.3 What the agent cannot do

- Generate resource content from its own knowledge (no LLM-authored "notes" pretending to be source material)
- Use URLs from domains not in the TrustedSource registry
- Proceed with a lesson that has no valid resources from approved sources
- Create quiz questions that aren't derivable from the curated resources

Quiz questions and practice problems are the one area where the LLM generates content directly — but they must be answerable from the curated resources. The system prompt requires the LLM to cite which resource each question relates to.

---

## 6. Data model additions

Four new Prisma models. See the existing codebase for conventions (@@map snake_case, String IDs matching better-auth User.id, onDelete: Cascade, @@index on foreign keys).

### 6.1 LearnerProfile
User's persistent preferences (mediaPrefs, toolPrefs, pace, experienceContext). One per user. Read by the agent at session start to skip redundant questions.

### 6.2 TrustedSource
Admin-managed registry of approved content sources (name, domain, categories, contentTypes, active flag). The agent reads this; only admins write.

### 6.3 CourseSpec
The draft artifact produced by the agent. Holds elicitation data (topic, scope, preferences) and the generated outline (Json). Tracks status through the pipeline (drafting → reviewing → approved → building → completed | failed). Retains provenance data as a permanent audit trail. Links to the created Course once built.

### 6.4 AgentSession
Tracks conversation state (phase, currentStep, elicitationState, conversationLog). One active session per user. The conversationLog uses a rolling window of ~20 recent messages plus a running summary updated at phase transitions and window overflow.

---

## 7. Existing system integration

### 7.1 What Socrates reads

| Existing model | What the agent reads | Why |
|---|---|---|
| User | id, role | Identity, authorization |
| Course + enrollments | Courses the user has taken | Infer prior knowledge |
| LessonCompletion, UnitCompletion | Progress data | Determine what they've already learned |
| AssessmentAttempt | Scores + pass/fail | Assess knowledge level |

### 7.2 What Socrates writes

The agent writes through existing services (never raw Prisma in the agent layer), creating:
- Course (with syllabus Json)
- Units (with order)
- Lessons (with objective, planContent, order)
- Assignments + child records (following existing assignmentService.$transaction pattern)
- LessonResources (supplementary material)
- LessonTools (supplementary tools)
- Assessments + AssessmentQuestions (lesson_quiz, unit_quiz, course_exam)

All content shapes match existing Zod validation schemas exactly.

### 7.3 Patterns preserved

- Route → controller → service architecture
- asyncHandler() on all async handlers
- authenticate() + authorize() middleware
- Response envelope ({ data } / { error })
- Soft deletes (deletedAt) on Course/Unit/Lesson/Assessment
- Order fields on all ordered content
- .js extensions on imports
- @@map snake_case table names

---

## 8. API surface

### Agent routes (all require authenticate())

```
POST   /api/agent/sessions                        Start new session
GET    /api/agent/sessions                         List user's sessions
GET    /api/agent/sessions/:sessionId              Get session state
POST   /api/agent/sessions/:sessionId/message      Send message (streaming response)
DELETE /api/agent/sessions/:sessionId               Abandon session
POST   /api/agent/sessions/:sessionId/approve      Approve current phase
POST   /api/agent/sessions/:sessionId/build         Trigger build from approved spec
```

### Profile routes (all require authenticate())

```
GET    /api/profile/learner                         Get learner profile
PUT    /api/profile/learner                         Create or update profile
```

### Admin routes (require authenticate() + authorize("admin"))

```
GET    /api/admin/trusted-sources                   List sources
POST   /api/admin/trusted-sources                   Add source
PUT    /api/admin/trusted-sources/:sourceId          Update source
DELETE /api/admin/trusted-sources/:sourceId          Deactivate source
```

---

## 9. Implementation chunks

Ordered by dependency. Each chunk is a self-contained piece of work.

### Chunk 1: Data layer
Add LearnerProfile, TrustedSource, CourseSpec, AgentSession to Prisma schema. Create migration. Seed TrustedSource with initial approved sources. Add User relation fields.

### Chunk 2: Learner profile (standalone, no agent dependency)
Profile CRUD endpoints + Zod schema. Settings UI for preferences. Useful immediately without the agent.

### Chunk 3: Trusted source admin (standalone, no agent dependency)
Admin CRUD endpoints + Zod schema. Admin UI page. Seed script with initial sources. Useful immediately without the agent.

### Chunk 4: Agent session management
Session CRUD endpoints. One-active-session constraint. Expiry logic (30 days). Follows existing route → controller → service pattern.

### Chunk 5: Agent core — LLM integration
Vercel AI SDK setup. Anthropic provider configuration. Tool definitions (parameter schemas via Zod). Agent loop: receive message → load state → prompt → tool calls → respond. Streaming response support for the message endpoint.

### Chunk 6: Elicitation engine
Phase 2 system prompts. Decision tree for stage progression. Pre-load logic (profile + course history). Conversation log with rolling window + summarization. Source coverage check tool.

### Chunk 7: Outline generation
Phase 3 system prompts with pedagogical framework. CourseSpec outline population. Outline review/approval flow. Bloom's taxonomy progression, scaffolding rules embedded in prompts.

### Chunk 8: Resource curation
Phase 4 system prompts with intent-based search instructions. Web search tool scoped to trusted domains. URL validation tool. Resource-to-assignment mapping. Provenance tracking in CourseSpec.

### Chunk 9: Course builder
Phase 5 execution. Tool calls to existing services in dependency order. BuildLog tracking for resume on failure. Status transitions. Provenance encoding in human-readable fields.

### Chunk 10: Client integration
Agent chat UI (streaming conversation). Outline review/approval UI. Resource review UI. Learner profile settings. Source attribution rendering on lesson content.

---

## 10. Open questions

Decisions that don't need to be made now but will need resolution during implementation:

1. **Streaming UX** — Should the agent stream text responses word-by-word (better UX during long responses), or return complete messages? Vercel AI SDK supports both.
2. **Concurrent sessions** — One active session per user, but what about admins building courses for others?
3. **Rate limiting** — Agent message endpoint is expensive (LLM calls + web searches). Separate rate limit from the standard API limiter?
4. **Curation depth** — How many resources per lesson? Minimum 1 activity resource? Maximum 5? Configurable per topic?
5. **Quiz generation quality** — Should generated questions go through a validation pass (LLM self-review) before being committed?
6. **Course editing post-build** — After Socrates builds a course, the teacher edits it manually using existing UI. Should there be a "regenerate this lesson" option that re-invokes the agent for a single lesson?
7. **Cost tracking** — Should the agent log LLM token usage per session for cost visibility?
8. **Tiptap content generation** — NoteAssignment and LessonResource (note/lecture) require Tiptap JSON. Should the agent generate this structured format, or is plain text acceptable for agent-created notes?

---

## 11. References

### Pedagogical frameworks

- **Wiggins, G. & McTighe, J. (1998, 2005).** *Understanding by Design.* ASCD. — Backward Design: three-stage framework (desired results → evidence → learning plan) for course and unit-level design.
- **Gagné, R. M., Briggs, L. J., & Wager, W. W. (1992).** *Principles of Instructional Design* (4th ed.). — 9 Events of Instruction: the internal structure of a lesson mapped to cognitive processes.
- **Milkova, S. "Strategies for Effective Lesson Planning."** CRLT, University of Michigan. https://crlt.umich.edu/gsis/p2_5 — 6-step practical lesson planning process.
- **Rosenshine, B. (2012).** "Principles of Instruction: Research-Based Strategies That All Teachers Should Know." *American Educator*, 36(1). Via IES: https://ies.ed.gov/sites/default/files/migrated/rel/infographics/pdf/REL_SE_Evidence-based_teaching_practices.pdf — 10 instructional principles from process-outcome research.
- **Anderson, L. W. & Krathwohl, D. R. (Eds.) (2001).** *A Taxonomy for Learning, Teaching, and Assessing* (Bloom's Revised Taxonomy). — Cognitive levels: remember, understand, apply, analyze, evaluate, create.
- **Fisher, D. & Frey, N. (2013).** *Better Learning Through Structured Teaching: A Framework for the Gradual Release of Responsibility* (2nd ed.). ASCD. — "I do, We do, You do" scaffolding model.
- **Carpenter, S. K. (2020).** "The effects of retrieval practice form on memory retention: A meta-analysis." *Psychological Bulletin*, 146(12). — Retrieval practice strengthens memory more than passive review.
- **Dunlosky, J. et al. (2013).** "Improving students' learning with effective learning techniques." *Psychological Science in the Public Interest*, 14(1). — Comprehensive review ranking learning strategies; distributed practice and practice testing rated most effective.
- **Hattie, J. & Donoghue, G. (2021).** "A Meta-Analysis of Ten Learning Techniques." Based on 242 studies, 169,179 participants. Confirmed distributed practice and practice testing as the most effective techniques.

### Technical

- **Vercel AI SDK** — https://sdk.vercel.ai/docs
