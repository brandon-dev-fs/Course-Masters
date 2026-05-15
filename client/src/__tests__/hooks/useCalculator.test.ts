import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCalculator } from '../../hooks/useCalculator.js';

describe('useCalculator', () => {
  describe('initial state', () => {
    it('displayValue shows "0" and isError is false', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.displayValue).toBe('0');
      expect(result.current.isError).toBe(false);
    });

    it('expression is empty string initially', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.expression).toBe('');
    });
  });

  describe('digit input', () => {
    it('appends digit to display', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => { result.current.handleKey('5'); });
      expect(result.current.displayValue).toBe('5');
    });

    it('replaces leading zero with non-zero digit', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => { result.current.handleKey('3'); });
      expect(result.current.displayValue).toBe('3');
    });

    it('appends multiple digits', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('1');
        result.current.handleKey('2');
        result.current.handleKey('3');
      });
      expect(result.current.displayValue).toBe('123');
    });
  });

  describe('decimal point', () => {
    it('adds decimal point to display', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('1');
        result.current.handleKey('.');
      });
      expect(result.current.displayValue).toBe('1.');
    });

    it('ignores second decimal point', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('1');
        result.current.handleKey('.');
        result.current.handleKey('5');
        result.current.handleKey('.');
      });
      expect(result.current.displayValue).toBe('1.5');
    });
  });

  describe('clear', () => {
    it('resets to initial state after entering digits', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('9');
        result.current.handleKey('9');
        result.current.handleKey('clear');
      });
      expect(result.current.displayValue).toBe('0');
      expect(result.current.expression).toBe('');
      expect(result.current.isError).toBe(false);
    });

    it('reset() clears state', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('7');
        result.current.reset();
      });
      expect(result.current.displayValue).toBe('0');
    });
  });

  describe('backspace', () => {
    it('removes last character', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('1');
        result.current.handleKey('2');
        result.current.handleKey('3');
        result.current.handleKey('backspace');
      });
      expect(result.current.displayValue).toBe('12');
    });

    it('reverts to "0" when single digit is deleted', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('5');
        result.current.handleKey('backspace');
      });
      expect(result.current.displayValue).toBe('0');
    });
  });

  describe('arithmetic operations', () => {
    it('computes addition correctly', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('3');
        result.current.handleKey('+');
        result.current.handleKey('5');
        result.current.handleKey('=');
      });
      expect(result.current.displayValue).toBe('8');
    });

    it('computes subtraction correctly', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('9');
        result.current.handleKey('-');
        result.current.handleKey('4');
        result.current.handleKey('=');
      });
      expect(result.current.displayValue).toBe('5');
    });

    it('computes multiplication correctly', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('6');
        result.current.handleKey('*');
        result.current.handleKey('7');
        result.current.handleKey('=');
      });
      expect(result.current.displayValue).toBe('42');
    });

    it('computes division correctly', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('8');
        result.current.handleKey('/');
        result.current.handleKey('2');
        result.current.handleKey('=');
      });
      expect(result.current.displayValue).toBe('4');
    });
  });

  describe('division by zero', () => {
    it('sets isError to true when dividing by zero', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('5');
        result.current.handleKey('/');
        result.current.handleKey('0');
        result.current.handleKey('=');
      });
      expect(result.current.isError).toBe(true);
      expect(result.current.displayValue).toBe('Error');
    });
  });

  describe('chained operations', () => {
    it('chains operations left-to-right: 3 + 5 then * 2', () => {
      const { result } = renderHook(() => useCalculator());
      // Press: 3 + 5 * 2 = (left-to-right, so (3+5)*2 = 16 because
      // pressing * after entering second operand causes the pending +
      // to evaluate first before setting the new operator)
      act(() => {
        result.current.handleKey('3');
        result.current.handleKey('+');
        result.current.handleKey('5');
        result.current.handleKey('*');
        result.current.handleKey('2');
        result.current.handleKey('=');
      });
      // Calculator uses left-to-right chain: (3+5)=8, then 8*2=16
      expect(result.current.displayValue).toBe('16');
    });
  });

  describe('sqrt', () => {
    it('computes square root correctly', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('9');
        result.current.handleKey('sqrt');
      });
      expect(result.current.displayValue).toBe('3');
    });

    it('sets isError for sqrt of negative number', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('9');
        result.current.handleKey('-');
        result.current.handleKey('1');
        result.current.handleKey('8');
        result.current.handleKey('=');
        // result is -9
        result.current.handleKey('sqrt');
      });
      expect(result.current.isError).toBe(true);
    });
  });

  describe('operator overwrite', () => {
    it('evaluates pending operation when second operator pressed before entering second operand', () => {
      // 5 + (no second operand) * 3 =
      // Pressing * chains: evaluates 5 + 5 = 10 (currentInput reused), then 10 * 3 = 30
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleKey('5');
        result.current.handleKey('+');
        result.current.handleKey('*'); // chains: evaluates 5 + 5 = 10, then sets operator to *
        result.current.handleKey('3');
        result.current.handleKey('=');
      });
      expect(result.current.displayValue).toBe('30');
    });
  });
});
