import { useState, useEffect, useRef } from 'react';
import { FileUp, Download, AlertTriangle } from 'lucide-react';

import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

import { getFileDownloadUrl } from '../../api/assignments.js';

import type { FileAssignmentData } from '../../api/types.js';

export interface FileAssignmentViewProps {
  assignmentId: string;
  fileAssignment: FileAssignmentData;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────

interface PdfViewerProps {
  assignmentId: string;
  filename: string;
}

function PdfViewer({ assignmentId, filename }: PdfViewerProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadUrl = getFileDownloadUrl(assignmentId);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setStatus('failed');
    }, 10000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleLoad() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('loaded');
  }

  function handleError() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('failed');
  }

  if (status === 'failed') {
    return (
      <div className="bg-orange-surface rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-accent shrink-0 mt-0.5" />
          <p className="text-sm text-orange-surface-text font-medium">
            PDF preview is not available. Please download the file to view it.
          </p>
        </div>
        <a href={downloadUrl} download={filename} className="self-start">
          <Button variant="secondary" size="sm">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PDF
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="PDF preview"
      aria-busy={status === 'loading'}
      className="relative w-full rounded-lg overflow-hidden border border-border bg-surface min-h-[500px]"
    >
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <LoadingSpinner />
        </div>
      )}
      <iframe
        src={downloadUrl}
        title={`PDF: ${filename}`}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full border-0 min-h-[500px] ${status === 'loading' ? 'hidden' : 'block'}`}
      />
    </div>
  );
}

// ─── TXT Viewer ───────────────────────────────────────────────────────────────

interface TxtViewerProps {
  assignmentId: string;
  filename: string;
}

function TxtViewer({ assignmentId, filename }: TxtViewerProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchText() {
      try {
        // Fetch raw text directly — not via apiClient because response is plain text, not JSON
        const res = await fetch(`/api/assignments/${assignmentId}/file`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            return;
          }
          setError('Could not load file content. Please try downloading instead.');
          return;
        }

        const content = await res.text();
        if (!cancelled) {
          setText(content);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load file content. Please check your network connection.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchText();
    return () => { cancelled = true; };
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div
      role="region"
      aria-label={`Text file: ${filename}`}
      className="rounded-lg border border-border bg-surface overflow-auto max-h-[500px]"
    >
      <pre className="p-4 text-sm text-text-primary font-mono whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  );
}

// ─── Download Card (DOCX / PPTX / PPT) ───────────────────────────────────────

interface DownloadCardProps {
  assignmentId: string;
  filename: string;
}

function DownloadCard({ assignmentId, filename }: DownloadCardProps) {
  const downloadUrl = getFileDownloadUrl(assignmentId);

  return (
    <div className="flex flex-col items-center gap-4 py-8 rounded-lg border border-border bg-surface">
      <Download className="w-10 h-10 text-text-secondary" aria-hidden="true" />
      <p className="text-sm text-text-secondary text-center max-w-xs">
        This file type cannot be previewed in the browser. Download it to open it in your
        preferred application.
      </p>
      <a
        href={downloadUrl}
        download={filename}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-button text-green-button-text text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Download {filename}
      </a>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FileAssignmentView({ assignmentId, fileAssignment }: FileAssignmentViewProps) {
  const { filename, mimeType, sizeBytes } = fileAssignment;
  const downloadUrl = getFileDownloadUrl(assignmentId);

  let viewer: React.ReactNode;
  if (mimeType === 'application/pdf') {
    viewer = <PdfViewer assignmentId={assignmentId} filename={filename} />;
  } else if (mimeType === 'text/plain') {
    viewer = <TxtViewer assignmentId={assignmentId} filename={filename} />;
  } else {
    viewer = <DownloadCard assignmentId={assignmentId} filename={filename} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Type-specific viewer */}
      {viewer}

      {/* File info footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <FileUp className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-text-primary truncate">{filename}</span>
        <span className="text-xs text-text-secondary">{formatFileSize(sizeBytes)}</span>
        <div className="flex-1" />
        <a
          href={downloadUrl}
          download={filename}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
        >
          <Download className="w-3 h-3" />
          Download
          <span className="sr-only"> {filename}</span>
        </a>
      </div>
    </div>
  );
}
