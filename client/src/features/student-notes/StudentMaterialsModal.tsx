import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, GripHorizontal } from 'lucide-react';
import type { StudentToolType } from './StudentToolsBar.js';
import { TOOL_META } from './StudentToolsBar.js';
import StudentNotePanel from './StudentNotePanel.js';
import FlashCardList from '../flashcards/FlashCardList.js';
import PracticeProblemList from '../practice-problems/PracticeProblemList.js';
import VocabList from '../vocab/VocabList.js';

interface StudentMaterialsModalProps {
  lessonId: string;
  isOpen: boolean;
  activeTool: StudentToolType | null;
  availableTools: StudentToolType[];
  onSwitchTool: (tool: StudentToolType) => void;
  onClose: () => void;
}

type Position = { x: number; y: number };
type Size = { width: number; height: number };

const MIN_W = 320;
const MIN_H = 280;
const DEFAULT_W = 460;
const DEFAULT_H = 520;

function defaultPosition(): Position {
  if (typeof window === 'undefined') return { x: 100, y: 80 };
  return { x: Math.max(0, window.innerWidth - DEFAULT_W - 16), y: 80 };
}

export default function StudentMaterialsModal({
  lessonId, isOpen, activeTool, availableTools, onSwitchTool, onClose,
}: StudentMaterialsModalProps) {
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [size, setSize] = useState<Size>({ width: DEFAULT_W, height: DEFAULT_H });
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; w: number; h: number } | null>(null);

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    dragOffset.current = { dx: e.clientX - position.x, dy: e.clientY - position.y };
    document.body.style.userSelect = 'none';

    function onMove(ev: MouseEvent) {
      if (!dragOffset.current) return;
      setPosition({
        x: Math.min(Math.max(0, ev.clientX - dragOffset.current.dx), window.innerWidth - size.width),
        y: Math.min(Math.max(0, ev.clientY - dragOffset.current.dy), window.innerHeight - 80),
      });
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      dragOffset.current = null;
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: size.width, h: size.height };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';

    function onMove(ev: MouseEvent) {
      if (!resizeStart.current) return;
      const newW = Math.max(MIN_W, resizeStart.current.w + (ev.clientX - resizeStart.current.mouseX));
      const newH = Math.max(MIN_H, resizeStart.current.h + (ev.clientY - resizeStart.current.mouseY));
      // Clamp to viewport
      const maxW = window.innerWidth - position.x - 8;
      const maxH = window.innerHeight - position.y - 8;
      setSize({ width: Math.min(newW, maxW), height: Math.min(newH, maxH) });
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      resizeStart.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  }

  if (!isOpen || !activeTool) return null;

  const modal = (
    <div
      className="fixed z-50 rounded-xl border border-border bg-surface shadow-warm-lg flex flex-col overflow-hidden"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      {/* Drag handle + header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-raised cursor-grab active:cursor-grabbing select-none shrink-0"
      >
        <GripHorizontal className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Student Materials</span>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tool switcher */}
      {availableTools.length > 1 && (
        <div className="flex gap-1 px-2 py-1.5 border-b border-border bg-surface shrink-0 overflow-x-auto">
          {availableTools.map(tool => {
            const { longLabel, Icon } = TOOL_META[tool];
            return (
              <button
                key={tool}
                onClick={() => onSwitchTool(tool)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium shrink-0 transition-colors ${
                  activeTool === tool
                    ? 'bg-primary-subtle text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {longLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTool === 'notes' && <StudentNotePanel lessonId={lessonId} />}
        {activeTool === 'flashcards' && <div className="p-3"><FlashCardList lessonId={lessonId} /></div>}
        {activeTool === 'practice' && <div className="p-3"><PracticeProblemList lessonId={lessonId} /></div>}
        {activeTool === 'vocab' && <div className="p-3"><VocabList lessonId={lessonId} /></div>}
      </div>

      {/* Resize handle — bottom-right corner */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-muted-foreground/50">
          <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="7" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="12" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
