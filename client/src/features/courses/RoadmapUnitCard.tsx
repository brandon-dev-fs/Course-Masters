import { Link } from 'react-router-dom';

import { Check, Circle, BookOpen, ClipboardCheck, Pencil, Play } from 'lucide-react';

import type { Unit, CourseProgress } from '../../api/types.js';

import type { UnitState } from './UnitRoadmap.js';

interface RoadmapUnitCardProps {
  courseId: string;
  unit: Unit;
  unitProgress: CourseProgress['units'][number] | undefined;
  state: UnitState;
  canEdit: boolean;
  onEditUnit: () => void;
}

function getContinueLessonUrl(
  courseId: string,
  unit: Unit,
  unitProgress: CourseProgress['units'][number] | undefined,
): string {
  const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);

  if (!unitProgress || sortedLessons.length === 0) {
    const first = sortedLessons[0];
    return first
      ? `/courses/${courseId}/units/${unit.id}/lessons/${first.id}`
      : `/courses/${courseId}`;
  }

  // Find first lesson where quizPassed is false (or not attempted)
  for (const lesson of sortedLessons) {
    const lessonProg = unitProgress.lessons.find((l) => l.lessonId === lesson.id);
    if (!lessonProg?.quizPassed) {
      return `/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`;
    }
  }

  // All lessons passed — go to last lesson
  const last = sortedLessons[sortedLessons.length - 1];
  return last
    ? `/courses/${courseId}/units/${unit.id}/lessons/${last.id}`
    : `/courses/${courseId}`;
}

function cardClasses(state: UnitState): string {
  if (state === 'completed') {
    return 'bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm';
  }
  if (state === 'in-progress') {
    return 'bg-surface border-2 border-blue-accent rounded-xl p-4 shadow-warm-md';
  }
  // locked — opacity/pointer-events applied by parent <li> in UnitRoadmap
  return 'bg-surface border border-border-subtle rounded-xl p-4';
}

function StateBadge({ state }: { state: UnitState }) {
  if (state === 'completed') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-surface text-green-surface-text">
        Complete
      </span>
    );
  }
  if (state === 'in-progress') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-surface text-blue-surface-text">
        In progress
      </span>
    );
  }
  return <></>;
}

export default function RoadmapUnitCard({
  courseId,
  unit,
  unitProgress,
  state,
  canEdit,
  onEditUnit,
}: RoadmapUnitCardProps) {
  const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);
  const lessonCount = sortedLessons.length;

  // A lesson counts as complete when its quiz is passed (or it has no quiz and was attempted).
  // LessonProgress uses `quizPassed` for quiz-gated completion; `!hasQuiz && attempted` covers
  // quiz-less lessons that have been visited/marked.
  function isLessonComplete(lessonId: string): boolean {
    const lp = unitProgress?.lessons.find((l) => l.lessonId === lessonId);
    if (!lp) return false;
    return lp.quizPassed || (!lp.hasQuiz && lp.attempted);
  }

  // Find index of first incomplete lesson (used for "Up next" badge)
  const firstIncompleteIndex = sortedLessons.findIndex(
    (lesson) => !isLessonComplete(lesson.id),
  );

  const isUnitComplete = state === 'completed';

  return (
    <div className={cardClasses(state)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-text-primary text-base leading-tight">
          {unit.title}
          {state === 'locked' && <span className="sr-only"> (locked)</span>}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <button
              onClick={onEditUnit}
              aria-label="Edit unit"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <StateBadge state={state} />
        </div>
      </div>

      {/* Lesson list */}
      {lessonCount === 0 ? (
        <p className="text-xs text-text-secondary italic">No lessons yet</p>
      ) : (
        <ul className="flex flex-col gap-1.5 mb-3">
          {sortedLessons.map((lesson, index) => {
            const lessonUrl = `/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`;
            const isComplete = isLessonComplete(lesson.id);
            const isUpNext =
              state === 'in-progress' && index === firstIncompleteIndex && !isComplete;

            return (
              <li key={lesson.id} className="flex items-center gap-2">
                {state === 'locked' ? (
                  <>
                    <Circle
                      className="w-4 h-4 text-text-secondary shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-text-secondary">{lesson.title}</span>
                  </>
                ) : (
                  <>
                    {isComplete ? (
                      <Check
                        className="w-4 h-4 text-green-primary shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="w-4 h-4 text-text-secondary shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <Link
                      to={lessonUrl}
                      className="text-sm text-text-primary hover:text-green-primary transition-colors"
                    >
                      {lesson.title}
                    </Link>
                    {isUpNext && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-orange-surface text-orange-surface-text ml-1">
                        Up next
                      </span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Tool counts row */}
      {lessonCount > 0 && (
        <div className="flex items-center gap-4 text-xs text-text-secondary mt-2">
          {/* TODO: flash card and practice problem counts require tool data on lesson —
              showing lesson count as proxy until API includes tool data */}
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {lessonCount} lessons
          </span>
        </div>
      )}

      {/* Unit test row */}
      <div className="mt-2">
        {isUnitComplete ? (
          <span className="flex items-center gap-1 text-xs text-green-surface-text font-medium">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Unit test passed
          </span>
        ) : (
          <span className="text-xs text-text-secondary italic">
            Complete all lessons to unlock the unit test
          </span>
        )}
      </div>

      {/* Continue lesson CTA — in-progress units only */}
      {state === 'in-progress' && (
        <div className="mt-3">
          <Link
            to={getContinueLessonUrl(courseId, unit, unitProgress)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-button text-green-button-text rounded-lg text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            Continue lesson
          </Link>
        </div>
      )}
    </div>
  );
}
