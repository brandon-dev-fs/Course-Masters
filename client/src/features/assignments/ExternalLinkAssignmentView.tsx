import { useState, useRef, useEffect } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';

import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

interface ExternalLinkAssignmentViewProps {
  url: string;
  description?: string | null;
  estimatedMinutes?: number | null;
}

type IframeStatus = 'loading' | 'loaded' | 'failed';

export default function ExternalLinkAssignmentView({
  url,
  description,
  estimatedMinutes,
}: ExternalLinkAssignmentViewProps) {
  const [iframeStatus, setIframeStatus] = useState<IframeStatus>('loading');
  const [showEmbed, setShowEmbed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One-time read on mount — no reactive listener needed (Vite SPA, no SSR)
  const [isMobile] = useState(() => !window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    if (isMobile) {
      setIframeStatus('failed');
      return;
    }
    // 5-second timeout — if iframe onLoad hasn't fired, assume it's blocked
    timeoutRef.current = setTimeout(() => {
      setIframeStatus('failed');
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isMobile]);

  function handleLoad() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIframeStatus('loaded');
  }

  function handleError() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIframeStatus('failed');
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <ExternalLink className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-semibold text-foreground">External Link</span>
        {estimatedMinutes != null && (
          <span className="text-xs text-muted-foreground">~ {estimatedMinutes} min</span>
        )}
        <div className="flex-1" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open in new tab
          <span className="sr-only">(opens in new tab)</span>
        </a>
      </div>

      {/* Iframe embed area */}
      {!isMobile && iframeStatus !== 'failed' ? (
        <div
          role="region"
          aria-label="External link content"
          aria-busy={iframeStatus === 'loading'}
          className="relative w-full rounded-lg overflow-hidden border border-border bg-surface"
          style={{ minHeight: '400px' }}
        >
          {iframeStatus === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface">
              <LoadingSpinner />
            </div>
          )}
          <iframe
            src={url}
            title="External link content"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className="w-full border-0"
            style={{ minHeight: '400px', display: iframeStatus === 'loading' ? 'none' : 'block' }}
          />
        </div>
      ) : (
        /* Fallback block — shown on mobile or when iframe fails */
        <div className="flex flex-col gap-3">
          <div className="bg-orange-surface rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-accent shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-sm text-orange-surface-text font-medium">
                  {isMobile ? 'Embedded view not available on mobile' : 'This page cannot be embedded'}
                </p>
                <p className="text-xs text-orange-surface-text truncate">{url}</p>
              </div>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in new tab
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </div>

          {/* Mobile "Try to embed" toggle */}
          {isMobile && (
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEmbed(prev => !prev)}
              >
                {showEmbed ? 'Hide embed' : 'Try to embed'}
              </Button>
              {showEmbed && (
                <div className="w-full rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={url}
                    title="External link content"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                    className="w-full border-0"
                    style={{ minHeight: '300px' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
