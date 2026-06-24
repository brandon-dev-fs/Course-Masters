import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext.js';

function ThemeDisplay() {
  const { theme, themePreference, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="pref">{themePreference}</span>
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

  it('defaults to system preference when no localStorage value', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    // matchMedia mock returns false -> system resolves to light
    expect(screen.getByTestId('pref').textContent).toBe('system');
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('reads initial theme from localStorage themePreference key', () => {
    localStorage.setItem('themePreference', 'dark');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('pref').textContent).toBe('dark');
  });

  it('migrates legacy theme key to themePreference on load', () => {
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(localStorage.getItem('themePreference')).toBe('light');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('toggles from light to dark', () => {
    localStorage.setItem('themePreference', 'light');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('pref').textContent).toBe('dark');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('cycles dark -> system via toggle', () => {
    localStorage.setItem('themePreference', 'dark');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('pref').textContent).toBe('system');
  });

  it('cycles system -> light via toggle', () => {
    localStorage.setItem('themePreference', 'system');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('pref').textContent).toBe('light');
  });

  it('updates localStorage and html class when preference changes to dark', () => {
    localStorage.setItem('themePreference', 'light');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('themePreference')).toBe('dark');
  });

  it('provides default context values when used without provider', () => {
    // useTheme with default context returns 'light' (default resolved theme)
    function StandaloneDisplay() {
      const { theme } = useTheme();
      return <span data-testid="theme">{theme}</span>;
    }
    render(<StandaloneDisplay />);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });
});
