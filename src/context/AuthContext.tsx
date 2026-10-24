import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, signOut } from '../firebase';
import { AuthSession, UserRole, MonthlyBudget } from '../types/finance';

interface AuthContextType {
  user: User | null;
  authSession: AuthSession | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  currentMonth: string;
  monthlyBudget: number;
  setCurrentMonth: (month: string) => void;
  setRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signInAdmin: (username: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  saveMonthlyBudget: (amount: number, month?: string) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDefaultMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const ADMIN_EMAILS = [
  'dormstaff2009@gmail.com',
];

export function isUserAdmin(email?: string | null, username?: string | null): boolean {
  if (username && username.trim().toLowerCase() === 'adminsdnu') {
    return true;
  }
  if (email && ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
    return true;
  }
  return false;
}

const ADMIN_CREDENTIALS = {
  username: 'adminsdnu',
  password: 'nustaff2009',
};

const SESSION_STORAGE_KEY = 'sdnu_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthSession;
        const validAdmin = isUserAdmin(parsed.email, parsed.username);
        return {
          ...parsed,
          role: validAdmin ? 'admin' : 'viewer',
          displayName: validAdmin
            ? (parsed.displayName || 'ผู้ดูแลระบบ (Admin)')
            : (parsed.email || parsed.displayName || 'ผู้ใช้งานทั่วไป (Viewer)'),
        };
      } catch (e) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    return null; // Default to unauthenticated / Viewer
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>(getDefaultMonth());
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore session from localStorage or onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Authenticated with Google
        const email = (currentUser.email || '').toLowerCase().trim();
        const isAdminUser = isUserAdmin(email);
        const session: AuthSession = {
          role: isAdminUser ? 'admin' : 'viewer',
          email: currentUser.email || '',
          displayName: isAdminUser
            ? (currentUser.displayName || 'ผู้ดูแลระบบ (Admin) - ' + (currentUser.email || ''))
            : (currentUser.displayName || currentUser.email || 'ผู้ใช้งานทั่วไป (Viewer)'),
          photoURL: currentUser.photoURL || '',
        };
        setAuthSession(session);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        // Not authenticated with Firebase: check for manual admin password session
        const saved = localStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as AuthSession;
            if (parsed.username === 'adminsdnu' && parsed.role === 'admin') {
              setAuthSession(parsed);
            } else {
              setAuthSession(null);
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } catch {
            setAuthSession(null);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } else {
          setAuthSession(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch monthly budget from Firestore when month changes
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const budgetRef = doc(db, 'budgets', currentMonth);
        const snap = await getDoc(budgetRef);
        if (snap.exists()) {
          const data = snap.data() as MonthlyBudget;
          setMonthlyBudget(data.amount || 0);
        } else {
          setMonthlyBudget(25000); // Default organization monthly budget 25,000 THB
        }
      } catch (err) {
        console.warn('Could not fetch budget from Firestore:', err);
        setMonthlyBudget(25000);
      }
    };

    fetchBudget();
  }, [currentMonth]);

  const signInAdmin = async (username: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    if (username.trim() === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
      const session: AuthSession = {
        role: 'admin',
        username: 'adminsdnu',
        displayName: 'ผู้ดูแลระบบ (Admin)',
      };
      setAuthSession(session);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return true;
    } else {
      setAuthError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (กรุณาใช้ User: adminsdnu / pass: nustaff2009)');
      return false;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ';
      setAuthError(msg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    setAuthSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const saveMonthlyBudget = async (amount: number, targetMonth?: string) => {
    const monthKey = targetMonth || currentMonth;
    try {
      const budgetRef = doc(db, 'budgets', monthKey);
      await setDoc(budgetRef, {
        month: monthKey,
        amount: Number(amount),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMonthlyBudget(Number(amount));
    } catch (err) {
      console.error('Save budget error:', err);
      // Fallback local state
      setMonthlyBudget(Number(amount));
    }
  };

  const isAdmin = Boolean(authSession && authSession.role === 'admin' && isUserAdmin(authSession.email, authSession.username));
  const role: UserRole = isAdmin ? 'admin' : 'viewer';

  const setRole = (newRole: UserRole) => {
    if (newRole === 'admin' && !isUserAdmin(authSession?.email, authSession?.username)) {
      console.warn('Unauthorized attempt to elevate to admin role');
      return;
    }
    setAuthSession((prev) => {
      if (!prev) return null;
      const updated: AuthSession = {
        ...prev,
        role: newRole,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authSession,
        role,
        isAdmin,
        loading,
        currentMonth,
        monthlyBudget,
        setCurrentMonth,
        setRole,
        signInWithGoogle,
        signInAdmin,
        logout,
        saveMonthlyBudget,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
