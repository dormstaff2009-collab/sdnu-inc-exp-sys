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

const ADMIN_CREDENTIALS = {
  username: 'adminsdnu',
  password: 'nustaff2009',
};

const SESSION_STORAGE_KEY = 'sdnu_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>(getDefaultMonth());
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore session from localStorage or onAuthStateChanged
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthSession;
        setAuthSession(parsed);
      } catch (e) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If logged in via Google:
        // Check if admin email or standard viewer
        const isEmailAdmin = currentUser.email === 'dormstaff2009@gmail.com';
        const session: AuthSession = {
          role: isEmailAdmin ? 'admin' : 'viewer',
          email: currentUser.email || '',
          displayName: currentUser.displayName || (isEmailAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งานทั่วไป (Gmail)'),
          photoURL: currentUser.photoURL || '',
        };
        setAuthSession(session);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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

  const isAdmin = authSession?.role === 'admin';
  const role = authSession?.role || null;

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
