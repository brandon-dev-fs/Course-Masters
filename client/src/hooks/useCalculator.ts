import { useReducer } from 'react';
import Decimal from 'decimal.js';

// ── Types ────────────────────────────────────────────────────────────────────

export type CalculatorKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | '+' | '-' | '*' | '/' | '^' | 'sqrt'
  | '=' | 'clear' | 'backspace';

export interface UseCalculatorReturn {
  expression: string;
  displayValue: string;
  isError: boolean;
  handleKey: (key: CalculatorKey) => void;
  reset: () => void;
}

// ── Operator display symbols ─────────────────────────────────────────────────

const OPERATOR_SYMBOL: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '^': 'xʸ',
};

// ── State ────────────────────────────────────────────────────────────────────

interface State {
  operand1: string | null;
  operator: string | null;
  currentInput: string;
  justEvaluated: boolean;
  isError: boolean;
  /** Set after sqrt so expression line can show e.g. "√(9) =" */
  sqrtExpression: string | null;
}

const INITIAL_STATE: State = {
  operand1: null,
  operator: null,
  currentInput: '0',
  justEvaluated: false,
  isError: false,
  sqrtExpression: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_INPUT_LENGTH = 12;

function formatResult(d: Decimal): string {
  const str = d.toSignificantDigits(12).toString();
  if (str.length > MAX_INPUT_LENGTH) {
    return d.toExponential(6);
  }
  return str;
}

function evaluate(a: string, op: string, b: string): Decimal | 'ERROR' {
  try {
    const da = new Decimal(a);
    const db = new Decimal(b);
    switch (op) {
      case '+': return da.plus(db);
      case '-': return da.minus(db);
      case '*': return da.times(db);
      case '/':
        if (db.isZero()) return 'ERROR';
        return da.dividedBy(db);
      case '^': return da.pow(db);
      default:  return 'ERROR';
    }
  } catch {
    return 'ERROR';
  }
}

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: State, key: CalculatorKey): State {
  const { operand1, operator, currentInput, justEvaluated, isError } = state;

  // ── Digit ────────────────────────────────────────────────────────────────
  if (/^[0-9]$/.test(key)) {
    if (justEvaluated || isError) {
      return { ...INITIAL_STATE, currentInput: key === '0' ? '0' : key };
    }
    if (currentInput === '0' && key !== '0') {
      return { ...state, currentInput: key, sqrtExpression: null };
    }
    if (currentInput.replace('-', '').replace('.', '').length >= MAX_INPUT_LENGTH) {
      return state; // max length reached
    }
    return { ...state, currentInput: currentInput + key, sqrtExpression: null };
  }

  // ── Decimal point ────────────────────────────────────────────────────────
  if (key === '.') {
    if (justEvaluated || isError) {
      return { ...INITIAL_STATE, currentInput: '0.' };
    }
    if (currentInput.includes('.')) return state;
    return { ...state, currentInput: currentInput + '.', sqrtExpression: null };
  }

  // ── Clear ────────────────────────────────────────────────────────────────
  if (key === 'clear') {
    return { ...INITIAL_STATE };
  }

  // ── Backspace ────────────────────────────────────────────────────────────
  if (key === 'backspace') {
    if (justEvaluated || isError) {
      return { ...INITIAL_STATE };
    }
    if (currentInput.length <= 1) {
      return { ...state, currentInput: '0', sqrtExpression: null };
    }
    return { ...state, currentInput: currentInput.slice(0, -1), sqrtExpression: null };
  }

  // ── Square root ──────────────────────────────────────────────────────────
  if (key === 'sqrt') {
    if (isError) return state;
    try {
      const val = new Decimal(currentInput);
      if (val.isNegative()) {
        return { ...INITIAL_STATE, currentInput: 'Error', isError: true, sqrtExpression: null };
      }
      const result = Decimal.sqrt(val);
      const formatted = formatResult(result);
      return {
        ...INITIAL_STATE,
        currentInput: formatted,
        justEvaluated: true,
        sqrtExpression: `√(${currentInput}) =`,
      };
    } catch {
      return { ...INITIAL_STATE, currentInput: 'Error', isError: true, sqrtExpression: null };
    }
  }

  // ── Binary operators (+ - * / ^) ─────────────────────────────────────────
  if (['+', '-', '*', '/', '^'].includes(key)) {
    if (isError) return state;

    if (operand1 === null) {
      // First operand set, await second
      return {
        ...state,
        operand1: currentInput,
        operator: key,
        justEvaluated: false,
        sqrtExpression: null,
      };
    }

    if (operator !== null && !justEvaluated) {
      // Chain: evaluate pending, set new operator
      const result = evaluate(operand1, operator, currentInput);
      if (result === 'ERROR') {
        return { ...INITIAL_STATE, currentInput: 'Error', isError: true, sqrtExpression: null };
      }
      const formatted = formatResult(result);
      return {
        ...state,
        operand1: formatted,
        operator: key,
        currentInput: formatted,
        justEvaluated: false,
        sqrtExpression: null,
      };
    }

    // Overwrite pending operator (operator pressed again without entering second operand)
    return { ...state, operator: key, justEvaluated: false, sqrtExpression: null };
  }

  // ── Equals ───────────────────────────────────────────────────────────────
  if (key === '=') {
    if (operator === null || operand1 === null) return state;
    if (justEvaluated) return state;

    const result = evaluate(operand1, operator, currentInput);
    if (result === 'ERROR') {
      return { ...INITIAL_STATE, currentInput: 'Error', isError: true, sqrtExpression: null };
    }
    const formatted = formatResult(result);
    return {
      ...state,
      currentInput: formatted,
      operand1: null,
      operator: null,
      justEvaluated: true,
      sqrtExpression: null,
    };
  }

  return state;
}

// ── Derived expression ───────────────────────────────────────────────────────

function deriveExpression(state: State): string {
  const { operand1, operator, currentInput, justEvaluated, sqrtExpression } = state;

  if (sqrtExpression) return sqrtExpression;
  if (operator === null) return '';

  const sym = OPERATOR_SYMBOL[operator] ?? operator;

  if (justEvaluated) {
    // Should not reach here for binary ops (operand1/operator are cleared), but guard
    return '';
  }

  if (operand1 !== null && operator !== null) {
    return `${operand1} ${sym} `;
  }

  // After = was pressed for binary op — operand1/operator are null but justEvaluated may be true
  if (justEvaluated && operand1 === null) {
    return `${currentInput} =`;
  }

  return '';
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCalculator(): UseCalculatorReturn {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const expression = deriveExpression(state);
  const displayValue = state.isError ? 'Error' : state.currentInput;

  function handleKey(key: CalculatorKey) {
    dispatch(key);
  }

  function reset() {
    dispatch('clear');
  }

  return { expression, displayValue, isError: state.isError, handleKey, reset };
}
