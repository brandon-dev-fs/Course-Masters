import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';

export default function useCanEdit(): boolean {
  const { user } = useAuth();
  return useMemo(
    () => user?.role === 'teacher' || user?.role === 'admin',
    [user?.role],
  );
}
