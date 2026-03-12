import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import Layout from './components/Layout.js';
import CourseListPage from './features/courses/CourseListPage.js';
import CourseDetailPage from './features/courses/CourseDetailPage.js';
import LessonDetailPage from './features/lessons/LessonDetailPage.js';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<CourseListPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/courses/:courseId/units/:unitId/lessons/:lessonId" element={<LessonDetailPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
