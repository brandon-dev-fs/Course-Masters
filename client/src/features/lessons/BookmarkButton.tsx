import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, BookmarkCheck, X } from 'lucide-react';

import { bookmarksApi } from '../../api/bookmarks.js';
import type { Bookmark as BookmarkType } from '../../api/types.js';
import { ApiClientError, classifyError } from '../../api/client.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

interface BookmarkButtonProps {
  assignmentId: string;
  bookmark: BookmarkType | null;
  onBookmarkChange: (bookmark: BookmarkType | null) => void;
}

interface PopoverPosition {
  top: number;
  left: number;
}

export default function BookmarkButton({
  assignmentId,
  bookmark,
  onBookmarkChange,
}: BookmarkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition>({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // One-time read on mount
  const [isMobile] = useState(() => !window.matchMedia('(min-width: 1024px)').matches);

  function open() {
    setNote(bookmark?.note ?? '');
    setError(null);
    setIsOpen(true);

    if (!isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + window.scrollY + 6,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 304),
      });
    }
  }

  function close() {
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  // Focus textarea when popover opens
  useEffect(() => {
    if (isOpen) {
      // Use a small delay to allow the portal to render before focusing
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      close();
    }
  }, [isOpen]);

  async function handleSave() {
    if (note.trim().length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await bookmarksApi.upsert(assignmentId, note.trim());
      onBookmarkChange(updated);
      close();
    } catch (err: unknown) {
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await bookmarksApi.delete(assignmentId);
      onBookmarkChange(null);
      close();
    } catch (err: unknown) {
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  }

  const isBusy = saving || deleting;
  const atLimit = note.length >= 500;

  const popoverContent = (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Popover panel */}
      <div
        role="dialog"
        aria-label={bookmark ? 'Edit bookmark' : 'Add bookmark'}
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className={isMobile
          ? 'fixed bottom-0 left-0 right-0 bg-surface-raised rounded-t-2xl p-4 z-50 flex flex-col gap-3'
          : 'absolute bg-surface-raised border border-border rounded-xl shadow-warm-lg p-3 w-72 z-50 flex flex-col gap-3'
        }
        style={isMobile ? undefined : {
          top: popoverPos.top,
          left: popoverPos.left,
          position: 'absolute',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close bookmark editor"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={e => { setNote(e.target.value); if (error) setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Add a note about this bookmark..."
            maxLength={500}
            rows={4}
            aria-label="Bookmark note"
            className="w-full text-sm bg-surface rounded-lg border border-border p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className={`text-xs text-right ${atLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {note.length}/500
          </p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex items-center gap-2 justify-end">
          {bookmark && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isBusy}
            >
              {deleting ? <LoadingSpinner /> : 'Delete'}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isBusy || note.trim().length === 0}
          >
            {saving ? <LoadingSpinner /> : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={open}
        aria-pressed={!!bookmark}
        aria-expanded={isOpen}
        aria-label={bookmark ? 'Edit bookmark' : 'Add bookmark'}
        className={`p-1.5 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          bookmark
            ? 'text-primary bg-primary-subtle hover:opacity-80'
            : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
        }`}
      >
        {bookmark ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>

      {isOpen && createPortal(popoverContent, document.body)}
    </>
  );
}
