import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BuilderSidebar from '../../../features/builder/BuilderSidebar.js';
import type { BuilderOutline } from '../../../api/types.js';

function makeOutline(overrides?: Partial<BuilderOutline>): BuilderOutline {
  return {
    course: { id: 'c1', title: 'Test Course', description: '' },
    units: [],
    courseAssessment: null,
    ...overrides,
  };
}

const outlineWithData: BuilderOutline = {
  course: { id: 'c1', title: 'Test Course', description: '' },
  units: [
    {
      id: 'u1',
      title: 'Unit 1',
      description: '',
      order: 1,
      assessment: { id: 'a1', type: 'unit_quiz', questionCount: 3 },
      lessons: [
        {
          id: 'l1',
          title: 'Lesson 1',
          order: 1,
          assignments: [
            { id: 'act1', title: 'Activity 1', type: 'note', order: 1 },
            { id: 'act2', title: 'Activity 2', type: 'video', order: 2 },
          ],
          assessment: null,
        },
        {
          id: 'l2',
          title: 'Lesson 2',
          order: 2,
          assignments: [],
          assessment: null,
        },
      ],
    },
    {
      id: 'u2',
      title: 'Unit 2',
      description: '',
      order: 2,
      assessment: null,
      lessons: [],
    },
  ],
  courseAssessment: { id: 'ca1', type: 'course_exam', questionCount: 10 },
};

describe('BuilderSidebar', () => {
  it('renders the Course Details heading', () => {
    render(<BuilderSidebar outline={makeOutline()} />);
    expect(screen.getByText('Course Details')).toBeInTheDocument();
  });

  it('shows 0 units when outline has no units', () => {
    render(<BuilderSidebar outline={makeOutline()} />);
    const dts = screen.getAllByRole('term');
    const unitsDt = dts.find((dt) => dt.textContent === 'Units');
    expect(unitsDt).toBeInTheDocument();
    // Multiple 0s appear (units, lessons, activities, unit tests all 0)
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('shows correct unit count', () => {
    render(<BuilderSidebar outline={outlineWithData} />);
    const terms = screen.getAllByRole('term');
    const unitsDt = terms.find((dt) => dt.textContent === 'Units');
    expect(unitsDt).toBeInTheDocument();
    // 2 units in outlineWithData
    const dds = screen.getAllByRole('definition');
    const unitsIdx = terms.indexOf(unitsDt!);
    expect(dds[unitsIdx].textContent).toBe('2');
  });

  it('shows correct lesson count', () => {
    render(<BuilderSidebar outline={outlineWithData} />);
    const terms = screen.getAllByRole('term');
    const lessonsDt = terms.find((dt) => dt.textContent === 'Lessons');
    const dds = screen.getAllByRole('definition');
    const lessonsIdx = terms.indexOf(lessonsDt!);
    expect(dds[lessonsIdx].textContent).toBe('2');
  });

  it('shows correct activity count', () => {
    render(<BuilderSidebar outline={outlineWithData} />);
    const terms = screen.getAllByRole('term');
    const activitiesDt = terms.find((dt) => dt.textContent === 'Activities');
    const dds = screen.getAllByRole('definition');
    const activitiesIdx = terms.indexOf(activitiesDt!);
    expect(dds[activitiesIdx].textContent).toBe('2');
  });

  it('shows correct unit test count (only units with assessment)', () => {
    render(<BuilderSidebar outline={outlineWithData} />);
    const terms = screen.getAllByRole('term');
    const unitTestsDt = terms.find((dt) => dt.textContent === 'Unit tests');
    const dds = screen.getAllByRole('definition');
    const unitTestsIdx = terms.indexOf(unitTestsDt!);
    expect(dds[unitTestsIdx].textContent).toBe('1');
  });

  it('shows "Yes" for course exam when courseAssessment is present', () => {
    render(<BuilderSidebar outline={outlineWithData} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('shows "Not set" when courseAssessment is null', () => {
    render(<BuilderSidebar outline={makeOutline()} />);
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('renders as an aside element', () => {
    const { container } = render(<BuilderSidebar outline={makeOutline()} />);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });
});
