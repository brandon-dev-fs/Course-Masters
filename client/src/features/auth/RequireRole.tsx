import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role))
    return (
      <Navigate
        to="/"
        replace
      />
    );
  return <>{children}</>;
}
