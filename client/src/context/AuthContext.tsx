import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authClient } from '../api/auth.js';
import type { AuthUser } from '../api/types.js';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user) {
          setUser(data.user as AuthUser);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message);
    setUser(data.user as AuthUser);
  }, []);

  const register = useCallback(
    async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error) throw new Error(error.message);
      setUser(data.user as AuthUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
