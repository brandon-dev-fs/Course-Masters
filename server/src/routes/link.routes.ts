import { promises as dns } from 'node:dns';

import { Router, Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/index.js';

const linkRouter = Router();

/**
 * Checks whether a given URL can be embedded in an iframe by inspecting the
 * response headers of the target page. Guards against SSRF by resolving the
 * hostname and rejecting private / reserved IP ranges before making any request.
 */
linkRouter.get(
  '/check-embed',
  asyncHandler(async (req: Request, res: Response) => {
    const url = req.query['url'] as string | undefined;

    if (!url || !/^https?:\/\//i.test(url)) {
      throw new AppError('VALIDATION_ERROR', 'A valid http or https URL is required', 400);
    }

    // ── SSRF guard ─────────────────────────────────────────────────────────────
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Invalid URL', 400);
    }

    let resolvedAddress: string;
    try {
      const result = await dns.lookup(hostname);
      resolvedAddress = result.address;
    } catch {
      // DNS resolution failure — refuse rather than proceed blindly
      throw new AppError('VALIDATION_ERROR', 'Could not resolve hostname', 400);
    }

    if (isPrivateIp(resolvedAddress)) {
      throw new AppError('VALIDATION_ERROR', 'URL resolves to a private or reserved address', 400);
    }
    // ───────────────────────────────────────────────────────────────────────────

    let canEmbed = true;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      });

      const xfo = response.headers.get('x-frame-options')?.toUpperCase();
      if (xfo === 'DENY' || xfo === 'SAMEORIGIN') {
        canEmbed = false;
      }

      if (canEmbed) {
        const csp = response.headers.get('content-security-policy');
        if (csp) {
          const faMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
          if (faMatch) {
            const directives = faMatch[1].trim().toLowerCase();
            // 'none' or only 'self' (no wildcard or external origin) blocks embedding
            if (directives === "'none'" || directives === "'self'") {
              canEmbed = false;
            }
          }
        }
      }
    } catch {
      // Timeout or network error — optimistic default: assume can embed
      canEmbed = true;
    }

    res.json({ canEmbed });
  }),
);

/**
 * Returns true if the given IPv4 or IPv6 address falls in a private,
 * loopback, or reserved range that should not be reachable from the server.
 */
function isPrivateIp(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1') return true;

  // IPv6 private (fc00::/7)
  if (/^f[cd]/i.test(ip)) return true;

  // IPv4 parsing
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    // Not a valid IPv4 — treat as non-private (could be IPv6 handled above)
    return false;
  }

  const [a, b] = parts;

  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 10.0.0.0/8 — RFC 1918
  if (a === 10) return true;
  // 172.16.0.0/12 — RFC 1918
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — RFC 1918
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 — link-local / cloud metadata
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 — "this" network
  if (a === 0) return true;

  return false;
}

export default linkRouter;
