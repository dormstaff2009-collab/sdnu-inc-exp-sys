import React from 'react';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogIn,
  LogOut,
  Calendar,
  ShieldCheck,
  UserCheck,
  FolderCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onOpenAddModal: () => void;
  onOpenLoginModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenFiscalYearModal: () => void;
}

export const Navbar: React.FC<Props> = ({
  onOpenAddModal,
  onOpenLoginModal,
  onOpenCategoryModal,
  onOpenFiscalYearModal,
}) => {
  const { authSession, isAdmin, logout, currentMonth, setCurrentMonth, loading } = useAuth();

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [yStr, mStr] = currentMonth.split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    setCurrentMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = currentMonth.split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setCurrentMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const formatMonthThai = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-');
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
      ];
      const mIdx = parseInt(month, 10) - 1;
      const buddhistYear = parseInt(year, 10) + 543;
      return `${monthNames[mIdx]} ${buddhistYear}`;
    } catch {
      return monthKey;
    }
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-none">
                  SDNU Expense
                </h1>
                {authSession && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                    {isAdmin ? 'Admin (สิทธิ์เต็ม)' : 'ทั่วไป (Gmail)'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                ระบบจัดการรายรับ-รายจ่าย หอพักและอาคาร SDNU
              </p>
            </div>
          </div>

          {/* Month Selector in Center */}
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl px-1.5 py-1">
            <button
              onClick={handlePrevMonth}
              title="เดือนก่อนหน้า"
              className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2 sm:px-3 flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 hidden xs:inline" />
              <span>{formatMonthThai(currentMonth)}</span>
            </div>

            <button
              onClick={handleNextMonth}
              title="เดือนถัดไป"
              className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Actions & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Fiscal Year Management Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={onOpenFiscalYearModal}
                title="จัดการปีงบประมาณ (ปีงปม.)"
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>จัดการปีงปม.</span>
              </button>
            )}

            {/* Category Management Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={onOpenCategoryModal}
                title="จัดการหมวดหมู่รายรับ-รายจ่าย"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FolderCog className="w-3.5 h-3.5 text-indigo-600" />
                <span>จัดการหมวดหมู่</span>
              </button>
            )}

            {/* Add Transaction Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-xl transition-all shadow-sm shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">บันทึกรายการ</span>
              </button>
            )}

            {/* Auth Button / Profile Menu */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : authSession ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors">
                  {authSession.photoURL ? (
                    <img
                      src={authSession.photoURL}
                      alt={authSession.displayName || 'User'}
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center text-white ${
                        isAdmin ? 'bg-indigo-600' : 'bg-blue-600'
                      }`}
                    >
                      {isAdmin ? 'A' : (authSession.displayName || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <span className="text-xs font-bold text-slate-800 block max-w-[120px] truncate leading-tight">
                      {authSession.displayName || authSession.username || 'ผู้ใช้'}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-none">
                      {isAdmin ? 'Admin' : 'Viewer (Gmail)'}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 hidden group-hover:block hover:block z-50">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {authSession.displayName || authSession.username}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {isAdmin ? 'ผู้ดูแลระบบสูงสุด (Admin SDNU)' : authSession.email || 'ผู้ใช้งานทั่วไป'}
                    </p>
                  </div>
                  {isAdmin && (
                    <>
                      <button
                        onClick={onOpenFiscalYearModal}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors lg:hidden"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        จัดการปีงปม.
                      </button>
                      <button
                        onClick={onOpenCategoryModal}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors md:hidden"
                      >
                        <FolderCog className="w-3.5 h-3.5 text-indigo-600" />
                        จัดการหมวดหมู่
                      </button>
                    </>
                  )}
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
