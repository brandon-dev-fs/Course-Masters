import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { authClient } from '../../api/auth.js';
import { coursesApi } from '../../api/courses.js';
import type { Course } from '../../api/types.js';
import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

const roleBadge: Record<string, string> = {
  admin: 'bg-green-100 text-green-800 border border-green-200',
  teacher: 'bg-blue-100 text-blue-800 border border-blue-200',
  student: 'bg-surface-raised text-muted-foreground border border-border',
};

export default function ProfilePage() {
  const { user } = useAuth();

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  useEffect(() => {
    coursesApi
      .getAll()
      .then(setCourses)
      .catch((err: unknown) =>
        setCoursesError(err instanceof Error ? err.message : 'Failed to load courses'),
      )
      .finally(() => setCoursesLoading(false));
  }, []);

  async function handleSaveName() {
    if (!nameValue.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameError(null);
    setNameSaving(true);
    try {
      const { error } = await authClient.updateUser({ name: nameValue.trim() });
      if (error) throw new Error(error.message);
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (error) throw new Error(error.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!user) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>

      {/* Account info */}
      <section className="bg-surface rounded-2xl shadow-warm-sm border border-border p-6 flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-foreground">Account</h2>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">Display Name</span>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="rounded-xl border-2 border-primary bg-surface-raised px-3 py-2 text-foreground text-sm flex-1 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
              />
              <button
                onClick={() => void handleSaveName()}
                disabled={nameSaving}
                className="text-primary hover:brightness-110 disabled:opacity-50"
                aria-label="Save name"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setEditingName(false); setNameValue(user.name); setNameError(null); }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-foreground">{user.name}</span>
              <button
                onClick={() => { setEditingName(true); setNameValue(user.name); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Edit name"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {nameSuccess && (
                <span className="text-xs text-green-600 font-medium">Saved!</span>
              )}
            </div>
          )}
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">Email</span>
          <span className="text-muted-foreground">{user.email}</span>
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">Role</span>
          <span
            className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadge[user.role] ?? roleBadge.student}`}
          >
            {user.role}
          </span>
        </div>
      </section>

      {/* Change password */}
      <section className="bg-surface rounded-2xl shadow-warm-sm border border-border p-6 flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-foreground">Change Password</h2>

        {passwordError && <ErrorMessage message={passwordError} />}
        {passwordSuccess && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
            Password changed successfully.
          </div>
        )}

        <form onSubmit={(e) => void handlePasswordChange(e)} className="flex flex-col gap-4">
          <Input
            id="currentPassword"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <div>
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Saving…' : 'Change Password'}
            </Button>
          </div>
        </form>
      </section>

      {/* Courses */}
      <section className="bg-surface rounded-2xl shadow-warm-sm border border-border p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Courses</h2>

        {coursesLoading && <LoadingSpinner />}
        {coursesError && <ErrorMessage message={coursesError} />}

        {!coursesLoading && !coursesError && courses.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No courses yet.{' '}
            <Link to="/" className="text-primary font-semibold hover:underline">
              Browse courses
            </Link>
          </p>
        )}

        {!coursesLoading && courses.length > 0 && (
          <ul className="flex flex-col gap-2">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  to={`/courses/${course.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-raised hover:bg-border transition-colors"
                >
                  <span className="text-foreground font-medium">{course.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {course._count?.units ?? 0} {(course._count?.units ?? 0) === 1 ? 'unit' : 'units'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
