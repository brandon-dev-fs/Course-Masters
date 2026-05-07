---
id: cm-0006
title: Standardize API Response Envelope — Security Review
stage: review
status: approved
approver: agent
approved_at: 2026-05-06T00:00:00Z
---

# Security Review — cm-0006: Standardize API Response Envelope

## Summary

Zero issues at medium severity or above. Auth middleware ordering is correct, no data leakage, no injection risks. Auto-approved.

## Issues

### [LOW] Error bypass guard uses payload inspection
- **Location**: `server/src/middleware/envelope.ts`
- **Description**: Original implementation checked for `error` key in payload — a fragile implicit contract. Fixed post-review to use `res.statusCode >= 400` instead.
- **Suggested fix**: Already applied.
- **hand_back_to**: N/A (already fixed)

### [INFO] Client envelope.data unwrap has no undefined guard
- **Location**: `client/src/api/client.ts`
- **Description**: If a server regression returns a non-enveloped 200, `envelope.data` is `undefined` silently.
- **Suggested fix**: Add a guard or assertion in a future hardening pass.
- **hand_back_to**: N/A (info only)
