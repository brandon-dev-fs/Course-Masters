import { useReducer, useCallback } from 'react';
import type { CalculatorState, CalculatorAction, Operator } from '../types.js';

export const initialCalculatorState: CalculatorState = {
  displayValue: '0',
  expression: '',
  previousValue: null,
  operator: null,
  inputMode: 'accumulating',
  isError: false,
};

const MAX_DISPLAY_LENGTH = 15;

function evaluate(a: string, op: Operator, b: string): number | 'ERROR' {
  const nA = parseFloat(a);
  const nB = parseFloat(b);
  switch (op) {
    case '+': return nA + nB;
    case '-': return nA - nB;
    case '×': return nA * nB;
    case '÷': return nB === 0 ? 'ERROR' : nA / nB;
  }
}

function formatResult(n: number): string {
  if (!Number.isFinite(n) || Number.isNaN(n)) return 'Error';
  return parseFloat(n.toPrecision(10)).toString();
}

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'INPUT_DIGIT': {
      if (state.isError) return state;
      const { digit } = action;
      if (state.inputMode === 'result') {
        return { ...initialCalculatorState, displayValue: digit, inputMode: 'accumulating' };
      }
      if (state.inputMode === 'operator-selected') {
        return { ...state, displayValue: digit, inputMode: 'accumulating' };
      }
      // Accumulating
      const newDisplay =
        state.displayValue === '0' ? digit : state.displayValue + digit;
      if (newDisplay.length > MAX_DISPLAY_LENGTH) return state;
      return { ...state, displayValue: newDisplay };
    }

    case 'INPUT_DECIMAL': {
      if (state.isError) return state;
      if (state.inputMode === 'operator-selected') {
        return { ...state, displayValue: '0.', inputMode: 'accumulating' };
      }
      if (state.displayValue.includes('.')) return state;
      return { ...state, displayValue: state.displayValue + '.' };
    }

    case 'SELECT_OPERATOR': {
      if (state.isError) return state;
      const { op } = action;
      // Chain: if already accumulating with a prior operator, compute first
      if (state.operator !== null && state.inputMode === 'accumulating') {
        const result = evaluate(state.previousValue!, state.operator, state.displayValue);
        if (result === 'ERROR') {
          return { ...state, displayValue: 'Error', isError: true, expression: '' };
        }
        const formatted = formatResult(result);
        return {
          displayValue: formatted,
          expression: formatted + ' ' + op,
          previousValue: formatted,
          operator: op,
          inputMode: 'operator-selected',
          isError: false,
        };
      }
      return {
        ...state,
        previousValue: state.displayValue,
        operator: op,
        inputMode: 'operator-selected',
        expression: state.displayValue + ' ' + op,
      };
    }

    case 'CALCULATE': {
      if (state.operator === null || state.previousValue === null) return state;
      const result = evaluate(state.previousValue, state.operator, state.displayValue);
      if (result === 'ERROR') {
        return { ...state, displayValue: 'Error', isError: true, expression: '' };
      }
      const formatted = formatResult(result);
      return {
        displayValue: formatted,
        expression:
          state.previousValue + ' ' + state.operator + ' ' + state.displayValue + ' =',
        previousValue: null,
        operator: null,
        inputMode: 'result',
        isError: false,
      };
    }

    case 'CLEAR':
      return initialCalculatorState;

    case 'TOGGLE_SIGN': {
      if (state.isError || state.displayValue === '0') return state;
      const toggled = state.displayValue.startsWith('-')
        ? state.displayValue.slice(1)
        : '-' + state.displayValue;
      return { ...state, displayValue: toggled };
    }

    case 'APPLY_PERCENT': {
      if (state.isError) return state;
      const num = parseFloat(state.displayValue);
      // Per cm-0001 decision: always divide current value by 100
      const result = num / 100;
      return { ...state, displayValue: formatResult(result), inputMode: 'accumulating' };
    }

    case 'BACKSPACE': {
      if (state.isError) return initialCalculatorState;
      if (state.inputMode !== 'accumulating') return state;
      if (state.displayValue.length <= 1) {
        return { ...state, displayValue: '0' };
      }
      return { ...state, displayValue: state.displayValue.slice(0, -1) };
    }

    default:
      return state;
  }
}

export interface UseCalculatorReturn {
  state: CalculatorState;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  selectOperator: (op: Operator) => void;
  calculate: () => void;
  clear: () => void;
  toggleSign: () => void;
  applyPercent: () => void;
  backspace: () => void;
}

export default function useCalculator(): UseCalculatorReturn {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  const inputDigit = useCallback((digit: string) => {
    dispatch({ type: 'INPUT_DIGIT', digit });
  }, []);

  const inputDecimal = useCallback(() => {
    dispatch({ type: 'INPUT_DECIMAL' });
  }, []);

  const selectOperator = useCallback((op: Operator) => {
    dispatch({ type: 'SELECT_OPERATOR', op });
  }, []);

  const calculate = useCallback(() => {
    dispatch({ type: 'CALCULATE' });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const toggleSign = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIGN' });
  }, []);

  const applyPercent = useCallback(() => {
    dispatch({ type: 'APPLY_PERCENT' });
  }, []);

  const backspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, []);

  return {
    state,
    inputDigit,
    inputDecimal,
    selectOperator,
    calculate,
    clear,
    toggleSign,
    applyPercent,
    backspace,
  };
}
