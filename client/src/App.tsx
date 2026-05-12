import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import Layout from './components/Layout.js';
import HomePage from './features/home/HomePage.js';
import CourseDetailPage from './features/courses/CourseDetailPage.js';
import LessonDetailPage from './features/lessons/LessonDetailPage.js';
import LoginPage from './features/auth/LoginPage.js';
import RegisterPage from './features/auth/RegisterPage.js';
import ProfilePage from './features/auth/ProfilePage.js';
import RequireAuth from './features/auth/RequireAuth.js';
import RequireRole from './features/auth/RequireRole.js';
import AdminUsersPage from './features/auth/AdminUsersPage.js';
import ErrorBoundary from './components/ErrorBoundary.js';

export default function App() {
	return (
		<ErrorBoundary>
			<ThemeProvider>
				<AuthProvider>
				<Routes>
					<Route element={<Layout />}>
						<Route
							path="/"
							element={<HomePage />}
						/>
						<Route
							path="/courses/:courseId"
							element={
								<RequireAuth>
									<CourseDetailPage />
								</RequireAuth>
							}
						/>
						<Route
							path="/courses/:courseId/units/:unitId/lessons/:lessonId"
							element={
								<RequireAuth>
									<LessonDetailPage />
								</RequireAuth>
							}
						/>
						<Route
							path="/profile"
							element={
								<RequireAuth>
									<ProfilePage />
								</RequireAuth>
							}
						/>
						<Route
							path="/admin/users"
							element={
								<RequireAuth>
									<RequireRole roles={['admin']}>
										<AdminUsersPage />
									</RequireRole>
								</RequireAuth>
							}
						/>
					</Route>
					<Route
						path="/login"
						element={<LoginPage />}
					/>
					<Route
						path="/register"
						element={<RegisterPage />}
					/>
				</Routes>
				</AuthProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}
