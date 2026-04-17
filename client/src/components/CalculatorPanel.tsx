import { useEffect, useRef, useCallback, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import { X } from 'lucide-react';
import useCalculator from '../features/calculator/index.js';
import type { Operator } from '../features/calculator/index.js';

// ─── CalculatorDisplay (internal) ────────────────────────────────────────────

interface CalculatorDisplayProps {
  expression: string;
  displayValue: string;
  isError: boolean;
}

function CalculatorDisplay({ expression, displayValue, isError }: CalculatorDisplayProps) {
  return (
    <div className="px-4 py-3 bg-background text-right">
      {/* Expression preview — screen readers skip this; the live result below is announced */}
      <p
        className="text-xs text-muted-foreground min-h-5 truncate"
        aria-hidden="true"
      >
        {expression}
      </p>
      {/* Live result — polite so screen readers announce changes without interrupting */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className={[
          'text-2xl font-semibold truncate',
          isError ? 'text-destructive text-base' : 'text-foreground',
        ].join(' ')}
      >
        {displayValue}
      </p>
    </div>
  );
}

// ─── CalculatorButtonGrid (internal) ─────────────────────────────────────────

interface ButtonDef {
  label: string;
  ariaLabel: string;
  colSpan?: boolean;
  variant: 'digit' | 'operator' | 'clear' | 'equals' | 'function';
  action: 'digit' | 'decimal' | 'operator' | 'equals' | 'clear' | 'toggleSign' | 'percent' | 'backspace';
  value?: string;
}

const BUTTONS: ButtonDef[][] = [
  [
    { label: 'C',  ariaLabel: 'clear',        variant: 'clear',    action: 'clear' },
    { label: '±',  ariaLabel: 'toggle sign',  variant: 'function', action: 'toggleSign' },
    { label: '%',  ariaLabel: 'percent',       variant: 'operator', action: 'percent' },
    { label: '÷',  ariaLabel: 'divide',        variant: 'operator', action: 'operator', value: '÷' },
  ],
  [
    { label: '7',  ariaLabel: '7',  variant: 'digit',    action: 'digit', value: '7' },
    { label: '8',  ariaLabel: '8',  variant: 'digit',    action: 'digit', value: '8' },
    { label: '9',  ariaLabel: '9',  variant: 'digit',    action: 'digit', value: '9' },
    { label: '×',  ariaLabel: 'multiply', variant: 'operator', action: 'operator', value: '×' },
  ],
  [
    { label: '4',  ariaLabel: '4',  variant: 'digit',    action: 'digit', value: '4' },
    { label: '5',  ariaLabel: '5',  variant: 'digit',    action: 'digit', value: '5' },
    { label: '6',  ariaLabel: '6',  variant: 'digit',    action: 'digit', value: '6' },
    { label: '-',  ariaLabel: 'subtract', variant: 'operator', action: 'operator', value: '-' },
  ],
  [
    { label: '1',  ariaLabel: '1',  variant: 'digit',    action: 'digit', value: '1' },
    { label: '2',  ariaLabel: '2',  variant: 'digit',    action: 'digit', value: '2' },
    { label: '3',  ariaLabel: '3',  variant: 'digit',    action: 'digit', value: '3' },
    { label: '+',  ariaLabel: 'add', variant: 'operator', action: 'operator', value: '+' },
  ],
  [
    { label: '0',  ariaLabel: '0',  variant: 'digit',    action: 'digit',   value: '0', colSpan: true },
    { label: '.',  ariaLabel: 'decimal point', variant: 'digit', action: 'decimal' },
    { label: '=',  ariaLabel: 'equals', variant: 'equals', action: 'equals' },
  ],
];

interface CalculatorButtonGridProps {
  onInput: (digit: string) => void;
  onDecimal: () => void;
  onOperator: (op: Operator) => void;
  onEquals: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onPercent: () => void;
  // Note: backspace is keyboard-only (Backspace key), handled in CalculatorPanel's keyboard useEffect
  activeOperator: Operator | null;
  clearButtonRef: RefObject<HTMLButtonElement | null>;
}

function CalculatorButtonGrid({
  onInput, onDecimal, onOperator, onEquals,
  onClear, onToggleSign, onPercent,
  activeOperator, clearButtonRef,
}: CalculatorButtonGridProps) {
  function handleClick(btn: ButtonDef) {
    switch (btn.action) {
      case 'digit':    onInput(btn.value!); break;
      case 'decimal':  onDecimal(); break;
      case 'operator': onOperator(btn.value as Operator); break;
      case 'equals':   onEquals(); break;
      case 'clear':    onClear(); break;
      case 'toggleSign': onToggleSign(); break;
      case 'percent':  onPercent(); break;
    }
  }

  function buttonClasses(btn: ButtonDef): string {
    const base = [
      'py-4 max-sm:py-5 w-full',
      'text-sm max-sm:text-base font-medium',
      'transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    ];

    const isActiveOp =
      btn.action === 'operator' && btn.value === activeOperator;

    switch (btn.variant) {
      case 'digit':
        base.push('bg-surface-raised text-foreground hover:bg-surface active:bg-muted');
        break;
      case 'operator':
      case 'function':
        if (isActiveOp) {
          base.push('bg-accent-subtle text-accent font-semibold');
        } else {
          base.push('bg-surface-raised text-accent font-semibold hover:bg-surface active:bg-muted');
        }
        break;
      case 'clear':
        base.push('bg-surface-raised text-destructive font-semibold hover:bg-surface active:bg-muted');
        break;
      case 'equals':
        base.push(
          'bg-primary text-primary-foreground font-semibold',
          'hover:bg-primary/90 active:bg-primary/80',
          'focus-visible:outline-white',
        );
        break;
    }

    return base.join(' ');
  }

  return (
    <div
      role="group"
      aria-label="Calculator buttons"
      className="grid grid-cols-4 gap-px bg-border p-px"
    >
      {BUTTONS.map((row, rowIdx) =>
        row.map((btn, colIdx) => (
          <button
            key={`${rowIdx}-${colIdx}`}
            type="button"
            ref={btn.action === 'clear' ? clearButtonRef : undefined}
            aria-label={btn.ariaLabel}
            onClick={() => handleClick(btn)}
            className={[
              buttonClasses(btn),
              btn.colSpan ? 'col-span-2' : '',
            ].join(' ')}
          >
            {/* Display text is aria-hidden when it's the same as aria-label */}
            <span aria-hidden="true">{btn.label}</span>
          </button>
        )),
      )}
    </div>
  );
}

// ─── CalculatorPanel (exported) ───────────────────────────────────────────────

export interface CalculatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tailwind z-index class — defaults to 'z-40'; pass 'z-60' in assessment context */
  zClass?: string;
  fabRef: RefObject<HTMLButtonElement | null>;
}

export default function CalculatorPanel({
  isOpen,
  onClose,
  zClass = 'z-40',
  fabRef,
}: CalculatorPanelProps) {
  const {
    state,
    inputDigit, inputDecimal, selectOperator, calculate,
    clear, toggleSign, applyPercent, backspace,
  } = useCalculator();

  const clearButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the C button when panel opens; reset state when it closes
  useEffect(() => {
    if (isOpen) {
      clearButtonRef.current?.focus();
    } else {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Drag-to-reposition state
  // Dynamic style.left/style.top values cannot be expressed as static Tailwind classes —
  // this is the permitted exception for dynamic values per design rules.
  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);

  const handleHeaderMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
    };

    function onMouseMove(ev: globalThis.MouseEvent) {
      if (!dragState.current || !panel) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      panel.style.left = dragState.current.origLeft + dx + 'px';
      panel.style.top = dragState.current.origTop + dy + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }

    function onMouseUp() {
      dragState.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  // Reset panel position when it closes so it re-docks on next open
  useEffect(() => {
    if (!isOpen && panelRef.current) {
      panelRef.current.style.left = '';
      panelRef.current.style.top = '';
      panelRef.current.style.right = '';
      panelRef.current.style.bottom = '';
    }
  }, [isOpen]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Do not intercept keys when focus is inside a text input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault(); inputDigit(e.key); break;
        case '.':
          e.preventDefault(); inputDecimal(); break;
        case '+':
          e.preventDefault(); selectOperator('+'); break;
        case '-':
          e.preventDefault(); selectOperator('-'); break;
        case '*':
          e.preventDefault(); selectOperator('×'); break;
        case '/':
          e.preventDefault(); selectOperator('÷'); break;
        case 'Enter':
        case '=':
          e.preventDefault(); calculate(); break;
        case 'Escape':
          e.preventDefault();
          onClose();
          fabRef.current?.focus();
          break;
        case 'Backspace':
          e.preventDefault(); backspace(); break;
        case 'c':
        case 'C':
          e.preventDefault(); clear(); break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputDigit, inputDecimal, selectOperator, calculate, onClose, backspace, clear, fabRef]);

  function handleClose() {
    onClose();
    fabRef.current?.focus();
  }

  return (
    <div
      ref={panelRef}
      id="calculator-panel"
      role="region"
      aria-label="Calculator"
      aria-hidden={!isOpen}
      className={[
        'fixed bottom-24 right-6',
        'w-72 max-sm:w-calc-panel-mobile max-sm:max-w-sm max-sm:right-4',
        'rounded-2xl bg-surface-raised border border-border shadow-warm-lg',
        'overflow-hidden',
        'transition-all duration-200 origin-bottom-right',
        isOpen
          ? 'max-h-128 opacity-100 scale-100'
          : 'max-h-0 opacity-0 scale-95 pointer-events-none',
        zClass,
      ].join(' ')}
    >
      {/* Draggable header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface cursor-grab active:cursor-grabbing select-none"
      >
        <span className="text-sm font-semibold text-foreground">Calculator</span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close calculator"
          className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <CalculatorDisplay
        expression={state.expression}
        displayValue={state.displayValue}
        isError={state.isError}
      />

      <CalculatorButtonGrid
        onInput={inputDigit}
        onDecimal={inputDecimal}
        onOperator={selectOperator}
        onEquals={calculate}
        onClear={clear}
        onToggleSign={toggleSign}
        onPercent={applyPercent}
        activeOperator={state.inputMode === 'operator-selected' ? state.operator : null}
        clearButtonRef={clearButtonRef}
      />
    </div>
  );
}
