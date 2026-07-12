---
id: cm-0030
title: Add File Assignment Type with Object Storage
stage: review
status: approved
---

# Security Review — cm-0030

## Files Reviewed

<!-- Updated mechanically after each task -->

## Findings

<!-- Findings appended after each task commit -->

## Backend Track — cm-0030-backend

### Security Findings

| # | Severity | Category | Description | Status |
|---|---|---|---|---|
| 1 | high | input-validation | MIME type bypass — file.mimetype is client-controlled; no magic byte validation | FIXED in commit 47ef810 (validateMagicBytes function) |
| 2 | high | api-security | Header injection via unsanitized filename in Content-Disposition + S3 key | FIXED in commit 47ef810 (filename sanitization + RFC 5987 encoding) |
| 3 | medium | authorization | Download endpoint lacks enrollment/ownership check | DESIGN DECISION — per approved API contract; consistent with all other read endpoints in the project |
| 4 | low | input-validation | Path traversal chars in storage key via originalname | FIXED in commit 47ef810 (same filename sanitization) |
| 5 | low | sensitive-data | GARAGE_RPC_SECRET placeholder hardcoded in docker-compose.yml | ADVISORY — dev setup only; documented as placeholder |
| 6 | low | api-security | GarageHQ admin port 3902 exposed on all interfaces | ADVISORY — dev only; recommended: bind to 127.0.0.1:3902 |
| 7 | info | input-validation | text/plain in allowlist has no magic bytes | ADVISORY — null-byte heuristic applied; X-Content-Type-Options: nosniff recommended globally |
| 8 | info | sensitive-data | S3 credential names logged at startup when missing (not values) | CONFIRMED SAFE |
| 9 | info | rate-limiting | Upload endpoint inherits apiLimiter (300/15min); no stricter limit | ADVISORY |
| 10 | info | api-security | S3 SSRF via S3_ENDPOINT env var | CONFIRMED NOT APPLICABLE — env var not attacker-controlled |

#### Result: APPROVED (all high/medium blocking issues resolved or accepted as design decisions)

## Files Reviewed

- server/src/middleware/upload.ts
- server/src/lib/s3.ts
- server/src/controllers/assignment.controller.ts
- server/src/routes/assignment.routes.ts
- server/src/services/assignment.service.ts
- docker-compose.yml
- server/src/config.ts
