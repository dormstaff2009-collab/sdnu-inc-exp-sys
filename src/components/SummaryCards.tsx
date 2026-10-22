import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

interface Props {
  totalIncome: number;
  totalExpense: number;
  monthlyBudget: number;
}

export const SummaryCards: React.FC<Props> = ({ totalIncome, totalExpense, monthlyBudget }) => {
  const netBalance = totalIncome - totalExpense;
  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalExpense : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-100">คงเหลือสุทธิ</span>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
            <Wallet className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-black tracking-tight">{formatCurrency(netBalance)}</p>
          <p className="text-[11px] text-indigo-200 mt-1 flex items-center gap-1">
            {netBalance >= 0 ? '✓ รายรับมากกว่ารายจ่าย' : '⚠️ รายจ่ายเกินรายรับในเดือนนี้'}
          </p>
        </div>
      </div>

      {/* Income Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">รายรับรวม</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            +{formatCurrency(totalIncome)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">เงินเข้าทั้งหมดในเดือน</p>
        </div>
      </div>

      {/* Expense Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">รายจ่ายรวม</span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-black text-rose-600 tracking-tight">
            -{formatCurrency(totalExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">เงินออกทั้งหมดในเดือน</p>
        </div>
      </div>

      {/* Budget & Savings Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {monthlyBudget > 0 ? 'งบประมาณคงเหลือ' : 'อัตราการออม'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className={`text-2xl font-black tracking-tight ${remainingBudget < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {monthlyBudget > 0 ? formatCurrency(remainingBudget) : `${savingsRate.toFixed(1)}%`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {monthlyBudget > 0
              ? remainingBudget < 0
                ? 'เกินเพดานงบที่ตั้งไว้'
                : 'คงเหลือใช้ได้ในเดือนนี้'
              : 'จากสัดส่วนรายรับทั้งหมด'}
          </p>
        </div>
      </div>
    </div>
  );
};
