import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Transaction, CategorySummary, TransactionType, CategoryItem, BUILDINGS, DEFAULT_FISCAL_YEARS, FiscalYearItem } from './types/finance';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  getCategoryMeta,
} from './constants/categories';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { PieChart } from './components/PieChart';
import { IncomeExpenseAnalysisChart } from './components/IncomeExpenseAnalysisChart';
import { TransactionList } from './components/TransactionList';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TransactionFormModal } from './components/TransactionFormModal';
import { BatchTransactionModal } from './components/BatchTransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { FiscalYearManagerModal } from './components/FiscalYearManagerModal';
import { LoginModal } from './components/LoginModal';
import {
  Plus,
  BarChart3,
  ListFilter,
  PieChart as PieIcon,
  ShieldCheck,
  UserCheck,
  FolderCog,
  LogIn,
  Info,
  Building2,
  Calendar,
  Eye,
} from 'lucide-react';

// Initial sample transactions using the user's specific institutional categories & buildings
const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-inc-1',
    type: 'income',
    amount: 145000,
    category: 'ค่าห้องพัก',
    building: 'อาคาร มน.นิเวศ 1-2',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-01',
    note: 'ค่าเช่าห้องพักบุคลากรประจำเดือนตุลาคม',
  },
  {
    id: 'demo-inc-2',
    type: 'income',
    amount: 28000,
    category: 'ค่าห้องพัก',
    building: 'อาคาร มน.นิเวศ 3-4',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-05',
    note: 'ชำระเงินสดและโอนเงินตรงเข้าบัญชี',
  },
  {
    id: 'demo-inc-3',
    type: 'income',
    amount: 15600,
    category: 'ค่าห้องพักรับรอง',
    building: 'อาคาร มน.นิเวศ 5',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-10',
    note: 'ผู้ทรงคุณวุฒิและแขกภายนอกเข้าพัก',
  },
  {
    id: 'demo-inc-4',
    type: 'income',
    amount: 8400,
    category: 'ค่าบริการเครื่องซักผ้าหยอดเหรียญ',
    building: 'อาคาร มน.นิเวศ 6',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-15',
    note: 'เก็บเหรียญรอบกลางเดือน หอพักชาย-หญิง',
  },
  {
    id: 'demo-exp-1',
    type: 'expense',
    amount: 32000,
    category: 'ค่าจ้างแม่บ้านทำความสะอาด',
    building: 'อาคาร มน.นิเวศ 1-2',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-02',
    note: 'ค่าจ้างทำความสะอาดพื้นที่ส่วนกลางและทางเดิน',
  },
  {
    id: 'demo-exp-2',
    type: 'expense',
    amount: 28500,
    category: 'ค่าจ้างเหมาดูแลและรักษาความปลอดภัย',
    building: 'อาคาร มน.นิเวศ 7-8',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-03',
    note: 'ค่าบริการ รปภ. ประจำจุดหอพักตลอด 24 ชม.',
  },
  {
    id: 'demo-exp-3',
    type: 'expense',
    amount: 12000,
    category: 'ค่าจ้างเหมาดูแลและบำรุงรักษาลิฟท์',
    building: 'อาคาร มน.นิเวศ 9-10',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-08',
    note: 'ตรวจเช็คความปลอดภัยลิฟท์โดยสารประจำเดือน',
  },
  {
    id: 'demo-exp-4',
    type: 'expense',
    amount: 6500,
    category: 'ค่าจ้างเหมากำจัดปลวก',
    building: 'อาคาร มน.นิเวศ 11-12',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-12',
    note: 'อัดฉีดน้ำยาป้องกันปลวกใต้ถุนอาคาร',
  },
  {
    id: 'demo-exp-5',
    type: 'expense',
    amount: 4200,
    category: 'ค่าจ้างซักชุดเครื่องนอนห้องรับรอง',
    building: 'อาคาร มน.นิเวศ 5',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-14',
    note: 'ซัก อบ รีด ปลอกหมอน ผ้าปูที่นอน ผ้าห่ม',
  },
  {
    id: 'demo-exp-6',
    type: 'expense',
    amount: 7800,
    category: 'ค่าจัดซื้อวัสดุงานบ้านงานครัว',
    building: 'อาคาร มน.นิเวศ 14-15',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-16',
    note: 'น้ำยาล้างห้องน้ำ ผงซักฟอก ถุงขยะดำ',
  },
  {
    id: 'demo-exp-7',
    type: 'expense',
    amount: 3500,
    category: 'ค่าจัดซื้อวัสดุไฟฟ้าและวิทยุ',
    building: 'อาคาร มน.นิเวศ 3-4',
    fiscalYear: 'ปี งปม.2569',
    date: '2026-10-18',
    note: 'หลอดไฟ LED เปลี่ยนตามโถงทางเดิน',
  },
];

function ExpenseTrackerDashboard() {
  const {
    authSession,
    role,
    isAdmin,
    setRole,
    clearAuthError,
  } = useAuth();

  // Dynamic Categories state (Default merged with Firestore categories)
  const defaultCategories: CategoryItem[] = useMemo(
    () => [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES],
    []
  );

  const defaultFiscalYears: FiscalYearItem[] = useMemo(
    () => DEFAULT_FISCAL_YEARS.map((y) => ({ id: y, year: y })),
    []
  );

  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [fiscalYears, setFiscalYears] = useState<FiscalYearItem[]>(defaultFiscalYears);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFiscalYearModalOpen, setIsFiscalYearModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [chartType, setChartType] = useState<TransactionType>('expense');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories'>('dashboard');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('all');
  const [chartDisplayView, setChartDisplayView] = useState<'all' | 'comparison' | 'income' | 'expense'>('all');

  // 1. Sync Categories with Firestore
  useEffect(() => {
    let isMounted = true;
    const colRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: CategoryItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CategoryItem, 'id'>) });
          });

          // Ensure the 4 default income categories exist cleanly if missing
          const incomeInList = list.filter((c) => c.type === 'income');
          if (incomeInList.length < 4) {
            for (const cat of DEFAULT_INCOME_CATEGORIES) {
              if (!list.some((c) => c.name === cat.name && c.type === 'income')) {
                setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
              }
            }
          }

          if (isMounted) setCategories(list);
        } else {
          // If Firestore collection is empty, retain defaults and seed to Firestore
          if (isMounted) setCategories(defaultCategories);
          try {
            for (const cat of defaultCategories) {
              await setDoc(doc(db, 'categories', cat.id), cat);
            }
          } catch (e) {
            console.warn('Seeding categories to Firestore:', e);
          }
        }
      },
      (err) => {
        console.warn('Categories sync info:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [defaultCategories]);

  // 2. Sync Fiscal Years with Firestore
  useEffect(() => {
    let isMounted = true;
    const colRef = collection(db, 'fiscalYears');
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: FiscalYearItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<FiscalYearItem, 'id'>) });
          });
          if (isMounted) setFiscalYears(list);
        } else {
          if (isMounted) setFiscalYears(defaultFiscalYears);
          try {
            for (const fy of defaultFiscalYears) {
              await setDoc(doc(db, 'fiscalYears', fy.id), fy);
            }
          } catch (e) {
            console.warn('Seeding fiscal years to Firestore:', e);
          }
        }
      },
      (err) => {
        console.warn('Fiscal years sync info:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [defaultFiscalYears]);

  // 3. Sync Transactions with Firestore
  useEffect(() => {
    let isMounted = true;
    const colRef = collection(db, 'transactions');
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Omit<Transaction, 'id'>;
            let catName = data.category;
            let needsUpdate = false;
            if (catName === 'ค่าเช่าที่พัก (หักผ่านบัญชี)' || catName === 'ค่าเช่าที่พัก (ไม่สามารถหักผ่านบัญชี)') {
              catName = 'ค่าห้องพัก';
              needsUpdate = true;
            } else if (catName === 'ค่าเช่าห้องพักรับรอง') {
              catName = 'ค่าห้องพักรับรอง';
              needsUpdate = true;
            }
            if (needsUpdate) {
              updateDoc(docSnap.ref, { category: catName }).catch(() => {});
            }
            list.push({ id: docSnap.id, ...data, category: catName });
          });
          if (isMounted) setTransactions(list);
        } else {
          // When snapshot is empty, keep it empty!
          // NEVER automatically write demo transactions back into Firestore.
          if (isMounted) setTransactions([]);
        }
      },
      (err) => {
        console.warn('Transactions sync info:', err);
        if (isMounted) setTransactions([]);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Filter transactions for Dashboard (filtered by building & fiscal year)
  const dashboardTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesBuilding = selectedBuilding === 'all' || t.building === selectedBuilding;
      const matchesFiscalYear = selectedFiscalYear === 'all' || t.fiscalYear === selectedFiscalYear;
      return matchesBuilding && matchesFiscalYear;
    });
  }, [transactions, selectedBuilding, selectedFiscalYear]);

  // Filter transactions for Transactions Tab
  const tabTransactions = useMemo(() => {
    return dashboardTransactions;
  }, [dashboardTransactions]);

  // Aggregate totals
  const totalIncome = useMemo(() => {
    return dashboardTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [dashboardTransactions]);

  const totalExpense = useMemo(() => {
    return dashboardTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [dashboardTransactions]);

  const incomeCount = useMemo(() => {
    return dashboardTransactions.filter((t) => t.type === 'income').length;
  }, [dashboardTransactions]);

  const expenseCount = useMemo(() => {
    return dashboardTransactions.filter((t) => t.type === 'expense').length;
  }, [dashboardTransactions]);

  // Category Summaries for Pie Chart & Breakdown
  const categorySummaries = useMemo(() => {
    const targetTransactions = dashboardTransactions.filter((t) => t.type === chartType);
    const targetTotal = chartType === 'expense' ? totalExpense : totalIncome;

    const map = new Map<string, { total: number; count: number }>();
    targetTransactions.forEach((tx) => {
      const existing = map.get(tx.category) || { total: 0, count: 0 };
      map.set(tx.category, {
        total: existing.total + Number(tx.amount || 0),
        count: existing.count + 1,
      });
    });

    const result: CategorySummary[] = [];
    map.forEach((data, categoryName) => {
      const meta = getCategoryMeta(categoryName, chartType, categories);
      result.push({
        category: categoryName,
        total: data.total,
        count: data.count,
        percentage: targetTotal > 0 ? (data.total / targetTotal) * 100 : 0,
        color: meta.color,
        type: chartType,
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [dashboardTransactions, chartType, totalExpense, totalIncome, categories]);

  // Dedicated Category Summaries for Income Pie Chart
  const incomeCategorySummaries = useMemo(() => {
    const targetTransactions = dashboardTransactions.filter((t) => t.type === 'income');
    const map = new Map<string, { total: number; count: number }>();
    targetTransactions.forEach((tx) => {
      const existing = map.get(tx.category) || { total: 0, count: 0 };
      map.set(tx.category, {
        total: existing.total + Number(tx.amount || 0),
        count: existing.count + 1,
      });
    });

    const result: CategorySummary[] = [];
    map.forEach((data, categoryName) => {
      const meta = getCategoryMeta(categoryName, 'income', categories);
      result.push({
        category: categoryName,
        total: data.total,
        count: data.count,
        percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0,
        color: meta.color,
        type: 'income',
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [dashboardTransactions, totalIncome, categories]);

  // Dedicated Category Summaries for Expense Pie Chart
  const expenseCategorySummaries = useMemo(() => {
    const targetTransactions = dashboardTransactions.filter((t) => t.type === 'expense');
    const map = new Map<string, { total: number; count: number }>();
    targetTransactions.forEach((tx) => {
      const existing = map.get(tx.category) || { total: 0, count: 0 };
      map.set(tx.category, {
        total: existing.total + Number(tx.amount || 0),
        count: existing.count + 1,
      });
    });

    const result: CategorySummary[] = [];
    map.forEach((data, categoryName) => {
      const meta = getCategoryMeta(categoryName, 'expense', categories);
      result.push({
        category: categoryName,
        total: data.total,
        count: data.count,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
        color: meta.color,
        type: 'expense',
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [dashboardTransactions, totalExpense, categories]);

  // Category CRUD (Admin only)
  const handleAddCategory = async (newCat: Omit<CategoryItem, 'id'>) => {
    if (!isAdmin) return;
    try {
      const colRef = collection(db, 'categories');
      const docRef = await addDoc(colRef, {
        ...newCat,
        createdAt: new Date().toISOString(),
      });
      setCategories((prev) => [...prev, { id: docRef.id, ...newCat }]);
    } catch (err) {
      console.warn('Saving category locally:', err);
      const fallbackCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        ...newCat,
      };
      setCategories((prev) => [...prev, fallbackCat]);
    }
  };

  const handleEditCategory = async (
    id: string,
    updated: Omit<CategoryItem, 'id'>,
    oldName?: string
  ) => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'categories', id);
      await setDoc(docRef, { ...updated }, { merge: true });

      // If category name was renamed, update all transactions using the old category name
      if (oldName && oldName !== updated.name) {
        const txColRef = collection(db, 'transactions');
        const snap = await getDocs(txColRef);
        for (const txDoc of snap.docs) {
          const txData = txDoc.data();
          if (txData.category === oldName && txData.type === updated.type) {
            await updateDoc(txDoc.ref, { category: updated.name }).catch(() => {});
          }
        }
        setTransactions((prev) =>
          prev.map((t) =>
            t.category === oldName && t.type === updated.type
              ? { ...t, category: updated.name }
              : t
          )
        );
      }
    } catch (err) {
      console.warn('Editing category in Firestore:', err);
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'categories', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Deleting category locally:', err);
    }
    setCategories((prev) => prev.filter((c) => c.id !== id && c.name !== name));
  };

  const handleResetCategories = async () => {
    if (!isAdmin) return;
    try {
      // Overwrite categories in Firestore with default categories
      const colRef = collection(db, 'categories');
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        if (!defaultCategories.some((dc) => dc.id === d.id)) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
      for (const cat of defaultCategories) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    } catch (err) {
      console.warn('Reset categories locally:', err);
    }
    setCategories(defaultCategories);
  };

  // Fiscal Year CRUD (Admin only)
  const handleAddFiscalYear = async (year: string) => {
    if (!isAdmin) return;
    try {
      const colRef = collection(db, 'fiscalYears');
      const docRef = await addDoc(colRef, {
        year,
        createdAt: new Date().toISOString(),
      });
      setFiscalYears((prev) => [...prev, { id: docRef.id, year }]);
    } catch (err) {
      console.warn('Saving fiscal year locally:', err);
      const fallbackYear: FiscalYearItem = {
        id: `fy-${Date.now()}`,
        year,
      };
      setFiscalYears((prev) => [...prev, fallbackYear]);
    }
  };

  const handleDeleteFiscalYear = async (id: string, year: string) => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'fiscalYears', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Deleting fiscal year locally:', err);
    }
    setFiscalYears((prev) => prev.filter((fy) => fy.id !== id && fy.year !== year));
  };

  const handleResetFiscalYears = async () => {
    if (!isAdmin) return;
    try {
      for (const fy of defaultFiscalYears) {
        await setDoc(doc(db, 'fiscalYears', fy.id), fy);
      }
    } catch (err) {
      console.warn('Reset fiscal years locally:', err);
    }
    setFiscalYears(defaultFiscalYears);
  };

  // Transaction CRUD
  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!isAdmin) {
      throw new Error('เฉพาะผู้ดูแลระบบ (Admin: dormstaff2009@gmail.com) เท่านั้นที่มีสิทธิ์บันทึกหรือแก้ไขข้อมูล');
    }

    // Sanitize data to guarantee valid values for Firestore
    const cleanData = {
      fiscalYear: data.fiscalYear || 'ปี งปม.2569',
      building: data.building || BUILDINGS[0],
      type: data.type || 'expense',
      amount: Number(data.amount) || 0,
      category: data.category || 'อื่นๆ',
      date: data.date || new Date().toISOString().split('T')[0],
      note: (data.note || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTransaction && editingTransaction.id) {
      const docId = editingTransaction.id;
      try {
        const docRef = doc(db, 'transactions', docId);
        await setDoc(docRef, cleanData, { merge: true });
        setTransactions((prev) =>
          prev.map((t) => (t.id === docId ? { ...t, ...cleanData } : t))
        );
      } catch (err: any) {
        console.error('Update Firestore transaction error:', err);
        throw err;
      }
    } else {
      try {
        const colRef = collection(db, 'transactions');
        const docRef = await addDoc(colRef, {
          ...cleanData,
          createdAt: new Date().toISOString(),
        });
        const saved: Transaction = { id: docRef.id, ...cleanData, createdAt: new Date().toISOString() };
        setTransactions((prev) => [saved, ...prev.filter((t) => t.id !== docRef.id)]);
      } catch (err: any) {
        console.error('Add Firestore transaction error:', err);
        throw err;
      }
    }
  };

  const handleBatchSaveTransactions = async (items: Array<Omit<Transaction, 'id' | 'createdAt'>>) => {
    if (!isAdmin) {
      throw new Error('เฉพาะผู้ดูแลระบบ (Admin: dormstaff2009@gmail.com) เท่านั้นที่มีสิทธิ์บันทึกข้อมูล');
    }

    try {
      const colRef = collection(db, 'transactions');
      const now = new Date().toISOString();
      const added: Transaction[] = [];

      for (const item of items) {
        const cleanData = {
          fiscalYear: item.fiscalYear || 'ปี งปม.2569',
          building: item.building || BUILDINGS[0],
          type: item.type || 'expense',
          amount: Number(item.amount) || 0,
          category: item.category || 'อื่นๆ',
          date: item.date || now.split('T')[0],
          note: (item.note || '').trim(),
          createdAt: now,
          updatedAt: now,
        };
        const docRef = await addDoc(colRef, cleanData);
        added.push({ id: docRef.id, ...cleanData });
      }

      setTransactions((prev) => [...added, ...prev]);
    } catch (err: any) {
      console.error('Batch save transactions error:', err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!isAdmin) {
      console.warn('Unauthorized delete attempt blocked.');
      return;
    }

    try {
      const docRef = doc(db, 'transactions', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Delete Firestore transaction:', err);
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAllTransactions = async () => {
    if (!isAdmin) {
      console.warn('Unauthorized clear all attempt blocked.');
      return;
    }

    try {
      const colRef = collection(db, 'transactions');
      const snap = await getDocs(colRef);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
      console.warn('Clear all transactions error:', err);
    }
    setTransactions([]);
  };

  const handleLoadDemoData = async () => {
    if (!isAdmin) {
      console.warn('Unauthorized load demo attempt blocked.');
      return;
    }

    const timestamp = Date.now();
    const adjusted = INITIAL_DEMO_TRANSACTIONS.map((t, idx) => ({
      ...t,
      id: `sample-${timestamp}-${idx}`,
      date: t.date,
    }));
    setTransactions(adjusted);
    try {
      for (const t of adjusted) {
        await setDoc(doc(db, 'transactions', t.id), t);
      }
    } catch (e) {
      console.warn('Loading sample data error:', e);
    }
  };

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    const defaultFy = selectedFiscalYear !== 'all' 
      ? selectedFiscalYear 
      : (fiscalYears.find((f) => f.year === 'ปี งปม.2569')?.year || fiscalYears[fiscalYears.length - 1]?.year || 'ปี งปม.2569');

    setEditingTransaction({
      id: '',
      type: 'expense',
      amount: '' as any,
      category: '',
      fiscalYear: defaultFy,
      building: selectedBuilding !== 'all' ? selectedBuilding : BUILDINGS[0],
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditingTransaction(tx);
    setIsFormModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAddModal={handleOpenAddModal}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenFiscalYearModal={() => setIsFiscalYearModalOpen(true)}
      />

      {/* Role Banner */}
      {isAdmin ? (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-4 py-2.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-700/80 text-purple-200 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span>
                <strong>โหมดผู้ดูแลระบบ (Admin - {authSession?.email || authSession?.username || 'dormstaff2009@gmail.com'}):</strong> สิทธิ์เต็มในการบันทึก แก้ไข ลบรายการ ตั้งงบประมาณ จัดการปีงบประมาณ และหมวดหมู่
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsFiscalYearModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 font-semibold transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                จัดการปีงปม. ({fiscalYears.length})
              </button>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/80 hover:bg-purple-600 font-semibold transition-colors cursor-pointer"
              >
                <FolderCog className="w-3.5 h-3.5" />
                จัดการหมวดหมู่ ({categories.length})
              </button>
            </div>
          </div>
        </div>
      ) : authSession ? (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white px-4 py-2.5 shadow-sm border-b border-blue-900/40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-700/80 text-blue-200 shrink-0">
                <Eye className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-blue-300">สิทธิ์ผู้ใช้งานทั่วไป (Viewer - Read-only):</span>{' '}
                <span className="text-slate-200">
                  บัญชี <strong>{authSession.email || authSession.displayName || 'Gmail'}</strong> ดูได้เฉพาะข้อมูลแดชบอร์ด แผนภูมิวงกลม สัดส่วนค่าใช้จ่าย และตารางสรุปผล (ระบบซ่อนปุ่มเพิ่ม/แก้ไข/ลบ)
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ Admin เพื่อจัดการข้อมูล</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white px-4 py-2.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-700 text-indigo-200 shrink-0">
                <Info className="w-4 h-4" />
              </span>
              <span>
                <strong>ระบบจัดการรายรับรายจ่าย SDNU:</strong> โหมดผู้เยี่ยมชม (Guest - Read-only) ดูภาพรวมแดชบอร์ดและรายงานสรุป
              </span>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ (Admin / Gmail)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Navigation Tabs & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-slate-200/60 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span>แดชบอร์ด & แผนภูมิ</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>รายการทั้งหมด ({transactions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>สรุปแยกหมวดหมู่</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsFiscalYearModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-2xs transition-all"
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>จัดการปีงปม.</span>
                </button>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-2xs transition-all"
                >
                  <FolderCog className="w-4 h-4 text-purple-600" />
                  <span>จัดการหมวดหมู่</span>
                </button>
              </>
            )}

            {isAdmin ? (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรายการใหม่</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-200">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>โหมดดูข้อมูลเท่านั้น (Read-only)</span>
                </span>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-3 py-2 rounded-xl border border-indigo-200 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters Bar: 1. ปีงปม. (Fiscal Year) & 2. อาคาร (Building) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-4">
          {/* Top Row: Fiscal Year Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  เลือกดูข้อมูลตามปีงบประมาณ (ปีงปม.)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedFiscalYear === 'all'
                    ? `กำลังแสดงข้อมูลภาพรวมทุกปีงปม. (${fiscalYears.length} ปีงบประมาณ)`
                    : `กำลังแสดงข้อมูลเฉพาะ: ${selectedFiscalYear}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
              >
                <option value="all">ทุกปีงบประมาณ (ทั้งหมด)</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.year}>
                    {fy.year}
                  </option>
                ))}
              </select>

              {isAdmin && (
                <button
                  onClick={() => setIsFiscalYearModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs text-purple-700 bg-white border border-purple-200 hover:bg-purple-50 rounded-xl font-medium whitespace-nowrap transition-colors"
                >
                  + เพิ่ม/ลบปีงปม.
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Building Filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  เลือกดูข้อมูลตามอาคาร
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedBuilding === 'all'
                    ? 'กำลังแสดงข้อมูลภาพรวมทุกอาคาร (8 อาคาร)'
                    : `กำลังแสดงข้อมูลเฉพาะ: ${selectedBuilding}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
              <button
                onClick={() => setSelectedBuilding('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedBuilding === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                ทุกอาคาร
              </button>
              {BUILDINGS.map((b) => {
                const isSelected = selectedBuilding === b;
                return (
                  <button
                    key={b}
                    onClick={() => setSelectedBuilding(b)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 font-medium'
                    }`}
                  >
                    {b.replace('อาคาร มน.นิเวศ ', 'มน.')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Status & Reset */}
          {(selectedFiscalYear !== 'all' || selectedBuilding !== 'all') && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="text-slate-500 font-medium">
                กำลังแสดงข้อมูล: {selectedFiscalYear !== 'all' ? selectedFiscalYear : 'ทุกปีงปม.'} {selectedBuilding !== 'all' ? `• ${selectedBuilding}` : '• ทุกอาคาร'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFiscalYear('all');
                  setSelectedBuilding('all');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                รีเซ็ตตัวกรองทั้งหมด (แสดงครบทั้ง {transactions.length} รายการ)
              </button>
            </div>
          )}
        </div>

        {/* 1. Summary Cards */}
        <SummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalTransactions={dashboardTransactions.length}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
        />

        {/* 2. Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 3-Chart Analytics Shelf / Row */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-200">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                      แถบการวิเคราะห์และแผนภูมิ (3 มุมมองในแถบเดียวกัน)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      1. กราฟวิเคราะห์รายรับและรายจ่าย &nbsp;•&nbsp; 2. แผนภูมิวงกลมสัดส่วนรายรับ &nbsp;•&nbsp; 3. แผนภูมิวงกลมสัดส่วนรายจ่าย
                    </p>
                  </div>
                </div>

                {/* View switcher tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-stretch sm:self-auto overflow-x-auto">
                  <button
                    onClick={() => setChartDisplayView('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      chartDisplayView === 'all'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    แสดงทั้ง 3 ข้อมูลในแถบเดียวกัน
                  </button>
                  <button
                    onClick={() => setChartDisplayView('comparison')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      chartDisplayView === 'comparison'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. วิเคราะห์รับ-จ่าย
                  </button>
                  <button
                    onClick={() => setChartDisplayView('income')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      chartDisplayView === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. วงกลมรายรับ
                  </button>
                  <button
                    onClick={() => setChartDisplayView('expense')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      chartDisplayView === 'expense'
                        ? 'bg-rose-500 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. วงกลมรายจ่าย
                  </button>
                </div>
              </div>

              {/* 3 Visualizations rendered in the same shelf / row */}
              {chartDisplayView === 'all' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                  {/* 1. กราฟวิเคราะห์แสดงรายรับและรายจ่าย */}
                  <div className="h-full">
                    <IncomeExpenseAnalysisChart
                      totalIncome={totalIncome}
                      totalExpense={totalExpense}
                      transactions={dashboardTransactions}
                      title="1. กราฟวิเคราะห์แสดงรายรับและรายจ่าย"
                    />
                  </div>

                  {/* 2. แผนภูมิวงกลมแสดงสัดส่วนรายรับ */}
                  <div className="h-full">
                    <PieChart
                      summaries={incomeCategorySummaries}
                      totalAmount={totalIncome}
                      type="income"
                      title="2. แผนภูมิวงกลมแสดงสัดส่วนรายรับ"
                      size={180}
                    />
                  </div>

                  {/* 3. แผนภูมิวงกลมแสดงสัดส่วนรายจ่าย */}
                  <div className="h-full">
                    <PieChart
                      summaries={expenseCategorySummaries}
                      totalAmount={totalExpense}
                      type="expense"
                      title="3. แผนภูมิวงกลมแสดงสัดส่วนรายจ่าย"
                      size={180}
                    />
                  </div>
                </div>
              ) : chartDisplayView === 'comparison' ? (
                <div className="grid grid-cols-1 gap-6">
                  <IncomeExpenseAnalysisChart
                    totalIncome={totalIncome}
                    totalExpense={totalExpense}
                    transactions={dashboardTransactions}
                    title="1. กราฟวิเคราะห์แสดงรายรับและรายจ่าย"
                  />
                </div>
              ) : chartDisplayView === 'income' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6">
                    <PieChart
                      summaries={incomeCategorySummaries}
                      totalAmount={totalIncome}
                      type="income"
                      title="2. แผนภูมิวงกลมแสดงสัดส่วนรายรับ"
                      size={220}
                    />
                  </div>
                  <div className="lg:col-span-6">
                    <CategoryBreakdown
                      summaries={incomeCategorySummaries}
                      totalAmount={totalIncome}
                      type="income"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6">
                    <PieChart
                      summaries={expenseCategorySummaries}
                      totalAmount={totalExpense}
                      type="expense"
                      title="3. แผนภูมิวงกลมแสดงสัดส่วนรายจ่าย"
                      size={220}
                    />
                  </div>
                  <div className="lg:col-span-6">
                    <CategoryBreakdown
                      summaries={expenseCategorySummaries}
                      totalAmount={totalExpense}
                      type="expense"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transaction List */}
            <TransactionList
              transactions={dashboardTransactions}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteTransaction}
              onAddNew={handleOpenAddModal}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onClearAll={handleClearAllTransactions}
              onLoadDemoData={handleLoadDemoData}
              fiscalYears={fiscalYears}
            />
          </div>
        )}

        {/* 3. Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={tabTransactions}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteTransaction}
            onAddNew={handleOpenAddModal}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onClearAll={handleClearAllTransactions}
            onLoadDemoData={handleLoadDemoData}
            fiscalYears={fiscalYears}
          />
        )}

        {/* 4. Category Breakdown Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-indigo-700 transition-colors shadow-2xs"
                  >
                    <FolderCog className="w-3.5 h-3.5" />
                    <span>จัดการ / เพิ่ม / ลบ หมวดหมู่ ({categories.length})</span>
                  </button>
                )}
              </div>

              <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setChartType('expense')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  หมวดหมู่รายจ่าย
                </button>
                <button
                  onClick={() => setChartType('income')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  หมวดหมู่รายรับ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <PieChart
                  summaries={categorySummaries}
                  totalAmount={chartType === 'expense' ? totalExpense : totalIncome}
                  type={chartType}
                  title={`แผนภูมิวงกลม${chartType === 'expense' ? 'รายจ่าย' : 'รายรับ'}`}
                />
              </div>
              <div className="lg:col-span-6">
                <CategoryBreakdown
                  summaries={categorySummaries}
                  totalAmount={chartType === 'expense' ? totalExpense : totalIncome}
                  type={chartType}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Transaction Add/Edit Modal (Admin only) */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        categories={categories}
        fiscalYears={fiscalYears}
      />

      {/* Batch / Multi-Item Transaction Modal */}
      <BatchTransactionModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveBatch={handleBatchSaveTransactions}
        categories={categories}
        fiscalYears={fiscalYears}
        defaultFiscalYear={selectedFiscalYear}
        defaultBuilding={selectedBuilding}
      />

      {/* Fiscal Year Manager Modal (Add / Delete fiscal years) */}
      <FiscalYearManagerModal
        isOpen={isFiscalYearModalOpen}
        onClose={() => setIsFiscalYearModalOpen(false)}
        fiscalYears={fiscalYears}
        onAddFiscalYear={handleAddFiscalYear}
        onDeleteFiscalYear={handleDeleteFiscalYear}
        onResetDefaults={handleResetFiscalYears}
      />

      {/* Category Manager Modal (Add / Delete categories) */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetDefaults={handleResetCategories}
      />

      {/* Login Modal (Admin credentials & Gmail login) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
        <p>
          ระบบจัดการรายรับรายจ่าย (SDNU Expense Tracker) • โครงการ Firebase:{' '}
          <span className="font-semibold text-slate-600">sdnu-inc-exp-sys</span>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ExpenseTrackerDashboard />
    </AuthProvider>
  );
}
