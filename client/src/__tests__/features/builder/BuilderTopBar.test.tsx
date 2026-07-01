import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BuilderTopBar from '../../../features/builder/BuilderTopBar.js';

function renderTopBar(props?: Partial<Parameters<typeof BuilderTopBar>[0]>) {
  return render(
    <MemoryRouter>
      <BuilderTopBar
        courseId="c1"
        courseTitle="My Course"
        sidebarContent={<div>Sidebar Content</div>}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('BuilderTopBar', () => {
  it('renders the course title in the breadcrumb', () => {
    renderTopBar();
    expect(screen.getByText('My Course')).toBeInTheDocument();
  });

  it('renders "My courses" breadcrumb link', () => {
    renderTopBar();
    expect(screen.getByRole('link', { name: 'My courses' })).toBeInTheDocument();
  });

  it('renders a breadcrumb nav', () => {
    renderTopBar();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders the Builder badge', () => {
    renderTopBar();
    expect(screen.getByText('Builder')).toBeInTheDocument();
  });

  it('renders "Preview as student" link with correct href', () => {
    renderTopBar();
    const previewLink = screen.getByRole('link', { name: /Preview course as student/i });
    expect(previewLink).toBeInTheDocument();
    expect(previewLink).toHaveAttribute('href', '/courses/c1');
  });

  it('renders "More options" button', () => {
    renderTopBar();
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('mobile overflow panel is not visible initially', () => {
    renderTopBar();
    expect(screen.queryByRole('dialog', { name: 'Course details' })).not.toBeInTheDocument();
  });

  it('opens mobile overflow panel when "More options" is clicked', () => {
    renderTopBar();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('dialog', { name: 'Course details' })).toBeInTheDocument();
  });

  it('renders sidebarContent in the overflow panel when open', () => {
    renderTopBar();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });

  it('closes the overflow panel when close button is clicked', () => {
    renderTopBar();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('dialog', { name: 'Course details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Course details' })).not.toBeInTheDocument();
  });

  it('closes the overflow panel when backdrop is clicked', () => {
    renderTopBar();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('dialog', { name: 'Course details' })).toBeInTheDocument();
    // Find the backdrop (aria-hidden fixed div)
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(screen.queryByRole('dialog', { name: 'Course details' })).not.toBeInTheDocument();
  });

  it('aria-expanded is false when panel is closed', () => {
    renderTopBar();
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('aria-expanded is true when panel is open', () => {
    renderTopBar();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('marks the current page in breadcrumb', () => {
    renderTopBar();
    const currentItem = screen.getByText('My Course').closest('[aria-current="page"]');
    expect(currentItem).toBeInTheDocument();
  });
});
