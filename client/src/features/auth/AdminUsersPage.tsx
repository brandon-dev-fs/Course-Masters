import { useState, useEffect } from 'react';
import { authClient } from '../../api/auth.js';
import type { AuthUser } from '../../api/types.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

const ROLES = ['student', 'teacher', 'admin'] as const;
type Role = (typeof ROLES)[number];

const roleBadge: Record<Role, string> = {
  admin: 'bg-green-100 text-green-800 border border-green-200',
  teacher: 'bg-blue-100 text-blue-800 border border-blue-200',
  student: 'bg-surface-raised text-muted-foreground border border-border',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    authClient.admin
      .listUsers({ query: { limit: 100 } })
      .then(({ data, error: err }) => {
        if (err) throw new Error(err.message);
        setUsers((data?.users ?? []) as AuthUser[]);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load users'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, role: Role) {
    setChangingRole(userId);
    setRoleError(null);
    try {
      const { error: err } = await authClient.admin.setRole({ userId, role: role as "admin" });
      if (err) throw new Error(err.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u)),
      );
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setChangingRole(null);
    }
  }

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-foreground">User Management</h1>

      {error && <ErrorMessage message={error} />}
      {roleError && <ErrorMessage message={roleError} />}

      <section className="bg-surface rounded-2xl shadow-warm-sm border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadge[user.role as Role] ?? roleBadge.student}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    disabled={changingRole === user.id}
                    onChange={(e) => void handleRoleChange(user.id, e.target.value as Role)}
                    className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    aria-label={`Change role for ${user.name}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
