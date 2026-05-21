import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext.js';

function ThemeDisplay() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to dark theme when no localStorage value', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('toggles from dark to light', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('toggles from light to dark', () => {
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('updates localStorage and html class on toggle', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    // Default is dark, so html should have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('provides default context values when used without provider', () => {
    // useTheme with default context returns 'dark' and noop
    function StandaloneDisplay() {
      const { theme } = useTheme();
      return <span data-testid="theme">{theme}</span>;
    }
    render(<StandaloneDisplay />);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });
});
