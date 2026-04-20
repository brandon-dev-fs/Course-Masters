import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useCalculator, type CalculatorKey } from '../../hooks/useCalculator.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';

// ── Props ────────────────────────────────────────────────────────────────────

export interface CalculatorPanelProps {
  /** Called by the close button and Escape key handler. */
  onClose: () => void;
  /** Focus returns to this button when the panel closes. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

// ── Internal: key variants ───────────────────────────────────────────────────

type KeyVariant = 'digit' | 'operator' | 'equals' | 'utility';

interface CalculatorKeyProps {
  label: string;
  ariaLabel?: string;
  variant: KeyVariant;
  onPress: () => void;
  clearRef?: React.RefObject<HTMLButtonElement | null>;
}

const KEY_VARIANT_CLASSES: Record<KeyVariant, string> = {
  digit:    'bg-surface text-foreground hover:bg-surface-raised',
  operator: 'bg-surface text-primary hover:bg-surface-raised',
  equals:   'bg-primary text-primary-foreground hover:brightness-110',
  utility:  'bg-surface text-muted-foreground hover:bg-surface-raised',
};

function CalcKey({ label, ariaLabel, variant, onPress, clearRef }: CalculatorKeyProps) {
  return (
    <button
      ref={clearRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onPress}
      className={`
        rounded-xl text-sm font-medium py-3 transition-all
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        active:scale-95
        ${KEY_VARIANT_CLASSES[variant]}
      `}
    >
      {label}
    </button>
  );
}

// ── Key layout ───────────────────────────────────────────────────────────────

interface KeyDef {
  label: string;
  ariaLabel?: string;
  key: CalculatorKey;
  variant: KeyVariant;
  isClear?: boolean;
}

const KEY_LAYOUT: KeyDef[] = [
  { label: 'C',   ariaLabel: 'Clear',          key: 'clear',     variant: 'utility', isClear: true },
  { label: '⌫',   ariaLabel: 'Backspace',       key: 'backspace', variant: 'utility' },
  { label: '√x',  ariaLabel: 'Square root',     key: 'sqrt',      variant: 'utility' },
  { label: 'xʸ',  ariaLabel: 'Exponent',        key: '^',         variant: 'operator' },
  { label: '7',   key: '7',   variant: 'digit' },
  { label: '8',   key: '8',   variant: 'digit' },
  { label: '9',   key: '9',   variant: 'digit' },
  { label: '÷',   ariaLabel: 'Divide',          key: '/',         variant: 'operator' },
  { label: '4',   key: '4',   variant: 'digit' },
  { label: '5',   key: '5',   variant: 'digit' },
  { label: '6',   key: '6',   variant: 'digit' },
  { label: '×',   ariaLabel: 'Multiply',        key: '*',         variant: 'operator' },
  { label: '1',   key: '1',   variant: 'digit' },
  { label: '2',   key: '2',   variant: 'digit' },
  { label: '3',   key: '3',   variant: 'digit' },
  { label: '−',   ariaLabel: 'Subtract',        key: '-',         variant: 'operator' },
  { label: '0',   key: '0',   variant: 'digit' },
  { label: '.',   ariaLabel: 'Decimal point',   key: '.',         variant: 'digit' },
  { label: '=',   ariaLabel: 'Equals',          key: '=',         variant: 'equals' },
  { label: '+',   ariaLabel: 'Add',             key: '+',         variant: 'operator' },
];

// ── Panel content ────────────────────────────────────────────────────────────

interface PanelContentProps {
  className: string;
  style?: React.CSSProperties;
  isDesktop: boolean;
  expression: string;
  displayValue: string;
  isError: boolean;
  handleKey: (key: CalculatorKey) => void;
  onClose: () => void;
  clearRef: React.RefObject<HTMLButtonElement | null>;
  dragHandleProps?: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
  };
}

function PanelContent({
  className,
  style,
  isDesktop,
  expression,
  displayValue,
  isError,
  handleKey,
  onClose,
  clearRef,
  dragHandleProps,
}: PanelContentProps) {
  return (
    <div
      id="calculator-panel"
      role="region"
      aria-label="Calculator"
      style={style}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        {isDesktop ? (
          <div
            aria-hidden="true"
            className="flex-1 flex items-center cursor-grab active:cursor-grabbing select-none text-muted-foreground text-sm"
            {...dragHandleProps}
          >
            ≡
          </div>
        ) : (
          <span className="flex-1" />
        )}
        {isDesktop && (
          <button
            type="button"
            aria-label="Close calculator"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Display */}
      <div
        className="bg-surface rounded-xl px-3 py-2 mx-3 mb-2"
        aria-label="Calculator display"
      >
        <p className="text-sm text-muted-foreground text-right min-h-[1.25rem] truncate">
          {expression}
        </p>
        <p
          aria-live="polite"
          className={`text-2xl font-semibold text-right truncate ${isError ? 'text-destructive' : 'text-foreground'}`}
        >
          {displayValue}
        </p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
        {KEY_LAYOUT.map((k) => (
          <CalcKey
            key={k.key}
            label={k.label}
            ariaLabel={k.ariaLabel}
            variant={k.variant}
            onPress={() => handleKey(k.key)}
            clearRef={k.isClear ? clearRef : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── CalculatorPanel ──────────────────────────────────────────────────────────

export default function CalculatorPanel({ onClose, triggerRef }: CalculatorPanelProps) {
  const { expression, displayValue, isError, handleKey } = useCalculator();
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const clearRef = useRef<HTMLButtonElement | null>(null);

  // Drag state (desktop only)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  // Focus Clear button when panel mounts
  useEffect(() => {
    clearRef.current?.focus();
  }, []);

  // Escape key closes the panel and returns focus
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        triggerRef.current?.focus();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, triggerRef]);

  function handleClose() {
    triggerRef.current?.focus();
    onClose();
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDragOffset({
      x: dragStart.current.offsetX + dx,
      y: dragStart.current.offsetY + dy,
    });
  }

  function handlePointerUp() {
    dragStart.current = null;
  }

  const dragHandleProps = { onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerUp: handlePointerUp };

  if (isDesktop) {
    const panelContent = (
      <PanelContent
        className="fixed bottom-4 right-4 z-50 w-72 bg-surface-raised rounded-2xl border border-border shadow-warm-lg"
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
        isDesktop
        expression={expression}
        displayValue={displayValue}
        isError={isError}
        handleKey={handleKey}
        onClose={handleClose}
        clearRef={clearRef}
        dragHandleProps={dragHandleProps}
      />
    );
    return createPortal(panelContent, document.body);
  }

  // Mobile: inline, no portal
  return (
    <PanelContent
      className="w-full rounded-xl border border-border bg-surface-raised mt-3 mb-4"
      isDesktop={false}
      expression={expression}
      displayValue={displayValue}
      isError={isError}
      handleKey={handleKey}
      onClose={handleClose}
      clearRef={clearRef}
    />
  );
}
