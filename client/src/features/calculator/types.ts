export type Operator = '+' | '-' | '×' | '÷';

export type InputMode = 'accumulating' | 'operator-selected' | 'result';

export interface CalculatorState {
  displayValue: string;
  expression: string;
  previousValue: string | null;
  operator: Operator | null;
  inputMode: InputMode;
  isError: boolean;
}

export type CalculatorAction =
  | { type: 'INPUT_DIGIT'; digit: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'SELECT_OPERATOR'; op: Operator }
  | { type: 'CALCULATE' }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'APPLY_PERCENT' }
  | { type: 'BACKSPACE' };
