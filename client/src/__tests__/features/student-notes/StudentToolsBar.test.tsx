import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentToolsBar from '../../../features/student-notes/StudentToolsBar.js';
import type { StudentToolType } from '../../../features/student-notes/StudentToolsBar.js';

const allTools: StudentToolType[] = ['notes', 'flashcards', 'checklist', 'vocab'];

describe('StudentToolsBar', () => {
  it('returns null when quiz is active', () => {
    const { container } = render(
      <StudentToolsBar
        availableTools={allTools}
        activeTool={null}
        onOpenTool={vi.fn()}
        isQuizActive={true}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when no tools available', () => {
    const { container } = render(
      <StudentToolsBar
        availableTools={[]}
        activeTool={null}
        onOpenTool={vi.fn()}
        isQuizActive={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders tool buttons for each available tool', () => {
    render(
      <StudentToolsBar
        availableTools={allTools}
        activeTool={null}
        onOpenTool={vi.fn()}
        isQuizActive={false}
        mode="mobile"
      />,
    );
    // Mobile mode shows short labels
    expect(screen.getAllByText('Notes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cards').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onOpenTool with the correct tool when clicked', () => {
    const onOpenTool = vi.fn();
    render(
      <StudentToolsBar
        availableTools={['notes', 'flashcards']}
        activeTool={null}
        onOpenTool={onOpenTool}
        isQuizActive={false}
        mode="mobile"
      />,
    );
    // Mobile tab shows short label 'Cards'; aria-label is 'Flash Cards'
    fireEvent.click(screen.getAllByText('Cards')[0]);
    expect(onOpenTool).toHaveBeenCalledWith('flashcards');
  });

  it('renders in desktop mode only', () => {
    const { container } = render(
      <StudentToolsBar
        availableTools={['notes']}
        activeTool={null}
        onOpenTool={vi.fn()}
        isQuizActive={false}
        mode="desktop"
      />,
    );
    // desktop renders aside, not a div row
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
  });

  it('renders in mobile mode only', () => {
    const { container } = render(
      <StudentToolsBar
        availableTools={['notes']}
        activeTool={null}
        onOpenTool={vi.fn()}
        isQuizActive={false}
        mode="mobile"
      />,
    );
    const aside = container.querySelector('aside');
    expect(aside).toBeNull();
  });

  it('renders both desktop and mobile when mode is both', () => {
    const { container } = render(
      <StudentToolsBar
        availableTools={['notes']}
        activeTool={null}
        onOpenTool={vi.fn()}
        isQuizActive={false}
        mode="both"
      />,
    );
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
  });
});
