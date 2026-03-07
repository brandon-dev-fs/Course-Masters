import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonsApi } from '../../api/lessons.js';
import type { Lesson } from '../../api/types.js';
import { Tabs, TabList, Tab, TabPanel } from '../../components/Tabs.js';
import NoteList from '../notes/NoteList.js';
import FlashCardList from '../flashcards/FlashCardList.js';
import PracticeProblemList from '../practice-problems/PracticeProblemList.js';
import QuizSection from '../quizzes/QuizSection.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

export default function LessonDetailPage() {
  const { courseId, unitId, lessonId } = useParams<{ courseId: string; unitId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!unitId || !lessonId) return;
    lessonsApi.getOne(unitId, lessonId)
      .then(setLesson)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [unitId, lessonId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!lesson) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">Courses</Link>
        <span>/</span>
        <Link to={`/courses/${courseId}`} className="hover:text-foreground">Course</Link>
        <span>/</span>
        <Link to={`/courses/${courseId}/units/${unitId}`} className="hover:text-foreground">Unit</Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-6">{lesson.order}. {lesson.title}</h1>

      <Tabs defaultTab="notes">
        <TabList>
          <Tab id="notes">Notes</Tab>
          <Tab id="flashcards">Flash Cards</Tab>
          <Tab id="practice">Practice Problems</Tab>
          <Tab id="quiz">Quiz</Tab>
        </TabList>
        <TabPanel id="notes">
          <NoteList lessonId={lesson.id} />
        </TabPanel>
        <TabPanel id="flashcards">
          <FlashCardList lessonId={lesson.id} />
        </TabPanel>
        <TabPanel id="practice">
          <PracticeProblemList lessonId={lesson.id} />
        </TabPanel>
        <TabPanel id="quiz">
          <QuizSection lessonId={lesson.id} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
