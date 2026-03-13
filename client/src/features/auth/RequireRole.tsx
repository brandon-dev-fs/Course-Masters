import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Link to="/" className="text-primary font-semibold hover:underline">
          Go Home
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
