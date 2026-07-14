---
id: cm-0011
title: Security Review — Decompose Oversized Frontend Components
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Decompose Oversized Frontend Components

## Summary

This is a second-pass security review of cm-0011, covering changes applied after the first approved review. The diff remains a pure frontend structural refactor with no backend changes, no new API surface, and no new dependencies. The four changes introduced since the first review (`toQuestionDraft` helper adoption in `openEdit`, `setView` added to `useEffect` deps, `setAssignments` removed from hook public API, `index` prop made optional in question editors) are all correctness or ergonomic fixes with no security implications. The overall security posture is unchanged.

## Scope

- Branch: `refactor/code_cleanup`
- Base: `develop`
- Files changed (second-pass delta): 6
- Spec: cm-0011

## Changes Reviewed in This Pass

The following files changed since the first approved review (commits `fa3a474` and merge `990fa7d`):

| File | Change |
|---|---|
| `client/src/features/assessments/AssessmentSection.tsx` | `openEdit` now calls `toQuestionDraft` helper; `setView` added to `useEffect` dep array |
| `client/src/features/assignments/question-editors/MultipleChoiceEditor.tsx` | `index` prop defaulted to `0` via `idx = index ?? 0` |
| `client/src/features/assignments/question-editors/TrueFalseEditor.tsx` | `index` prop defaulted to `0` via `idx = index ?? 0` |
| `client/src/features/assignments/question-editors/index.ts` | `index` typed as `number | undefined` (optional) |
| `client/src/features/lessons/hooks/useAssignments.ts` | `setAssignments` removed from public return type |
| `client/CLAUDE.MD` | Documentation update only |

## Issues

No new issues at any severity level introduced by this pass.

The prior LOW-severity finding from the first review (missing `canEdit` prop on lesson quiz `AssessmentSection` in `ActiveItemContent`) remains documented and unresolved but does not block merge. It is unaffected by the changes in this pass.

## Analysis of Each Change

### `toQuestionDraft` helper in `AssessmentSection.openEdit`

The helper (`AssessmentForm.tsx:26-38`) is a pure data transformation from a server-returned `AssessmentQuestion` object to a local `QuestionDraft` shape. It reads typed, already-persisted data and performs no queries, no string interpolation into queries, and no output to the DOM directly. The content field access (`q.content.options as string[]`, `q.content.correctIndex as number`) mirrors the pre-existing manual mapping it replaces — no new trust boundary is crossed. No security impact.

### `setView` added to `useEffect` dependency array

`setView` is a React `useState` dispatcher (stable identity). Adding it to the dependency array is a correctness fix per the React rules-of-hooks lint rule. No security impact.

### `setAssignments` removed from `useAssignments` public API

Removing a direct state mutation setter from the public hook API reduces the attack surface for uncontrolled state updates by callers. This is a positive change — callers can no longer bypass the hook's validation logic by directly overwriting the `assignments` array. No security regression.

### `QuestionTypeEditorProps.index` made optional; `idx = index ?? 0` fallback

The `index` value is used exclusively as a suffix for the HTML `name` attribute on radio inputs (`name="mc-correct-${idx}"`, `name="tf-correct-${idx}"`). This value is never sent to the server, never interpolated into queries, and never reflected in a DOM sink that would enable XSS. Defaulting to `0` when `index` is absent means multiple question editors rendered without explicit indices would share the same radio group name, which is a UI grouping behavior issue, not a security issue. No security impact.

## Checklist Coverage

| Category | Result |
|---|---|
| Input Validation | pass — no new input surfaces introduced in this pass |
| Injection | pass — `toQuestionDraft` is a pure type-safe data transformation; no string interpolation into queries |
| Authentication | pass — no auth middleware changes; `useAuth` patterns unchanged |
| Authorization | pass — no new authorization gates added or removed; prior LOW finding unchanged |
| Sensitive Data Exposure | pass — no secrets, tokens, passwords, or PII in changed code; no new `console.log` statements |
| Rate Limiting & Abuse Prevention | n/a — frontend refactor; no new endpoints |
| Dependency Vulnerabilities | pass — no new dependencies introduced |
| Data Layer | n/a — no schema or migration changes |
| API Security | n/a — no new API endpoints or CORS changes |
| XSS | pass — no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`; `idx` used only as a `name` attribute, not rendered as HTML |

## Verdict

APPROVED — Zero issues at medium severity or above in this second pass; all four post-review changes are correctness fixes with no security implications.
