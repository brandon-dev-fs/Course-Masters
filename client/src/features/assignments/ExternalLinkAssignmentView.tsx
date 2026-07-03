import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';

import LoadingSpinner from '../../components/LoadingSpinner.js';
import { linkApi } from '../../api/link.js';

interface ExternalLinkAssignmentViewProps {
  url: string;
  estimatedMinutes?: number | null;
}

type EmbedCheckStatus = 'checking' | 'can' | 'cannot';

export default function ExternalLinkAssignmentView({
  url,
  estimatedMinutes,
}: ExternalLinkAssignmentViewProps) {
  const [embedStatus, setEmbedStatus] = useState<EmbedCheckStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    linkApi.checkEmbed(url)
      .then(({ canEmbed }) => {
        if (!cancelled) setEmbedStatus(canEmbed ? 'can' : 'cannot');
      })
      .catch(() => {
        if (!cancelled) setEmbedStatus('can'); // optimistic fallback
      });
    return () => { cancelled = true; };
  }, [url]);

  function handleIframeError() {
    setEmbedStatus('cannot');
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
        {embedStatus === 'can' && (
          <>
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
          </>
        )}
      </div>

      {/* Embed area */}
      {embedStatus === 'checking' && (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </div>
      )}

      {embedStatus === 'can' && (
        <div
          role="region"
          aria-label="External link content"
          className="relative w-full rounded-lg overflow-hidden border border-border bg-surface"
          style={{ minHeight: '400px' }}
        >
          <iframe
            src={url}
            title="External link content"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
            onError={handleIframeError}
            className="w-full border-0"
            style={{ minHeight: '400px' }}
          />
        </div>
      )}

      {embedStatus === 'cannot' && (
        <div className="bg-orange-surface rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-accent shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm text-orange-surface-text font-medium">
                This page cannot be embedded
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
      )}
    </div>
  );
}
