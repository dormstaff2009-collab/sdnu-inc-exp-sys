import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction } from '../types/finance';

interface Props {
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
  title?: string;
  isCompact?: boolean;
}

export const IncomeExpenseAnalysisChart: React.FC<Props> = ({
  totalIncome,
  totalExpense,
  transactions,
  title = 'กราฟวิเคราะห์แสดงรายรับและรายจ่าย',
  isCompact = false,
}) => {
  const netBalance = totalIncome - totalExpense;
  const maxTotal = Math.max(totalIncome, totalExpense, 1);
  const totalFlow = totalIncome + totalExpense;

  const incomePctOfFlow = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;
  const expensePctOfFlow = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 50;
  const expenseToIncomeRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group transactions by building for comparison
  const buildingMap = new Map<string, { income: number; expense: number }>();
  transactions.forEach((tx) => {
    const bld = tx.building || 'ไม่ระบุอาคาร';
    const curr = buildingMap.get(bld) || { income: 0, expense: 0 };
    if (tx.type === 'income') {
      curr.income += Number(tx.amount || 0);
    } else {
      curr.expense += Number(tx.amount || 0);
    }
    buildingMap.set(bld, curr);
  });

  const buildingList = Array.from(buildingMap.entries())
    .map(([building, data]) => ({
      building,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เปรียบเทียบสัดส่วนและดุลการเงิน
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
              netBalance >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {netBalance >= 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>ดุลเกิน (Surplus)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>ดุลขาด (Deficit)</span>
              </>
            )}
          </span>
        </div>

        {/* Comparative Visual Bars */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-3 font-semibold text-slate-600">
            <span>เปรียบเทียบยอดรวม</span>
            <span className="text-[11px] text-slate-400">
              ค่าใช้จ่ายคิดเป็น {expenseToIncomeRatio.toFixed(1)}% ของรายรับ
            </span>
          </div>

          {/* Dual Bar Graphic */}
          <div className="grid grid-cols-2 gap-3 items-end h-32 pt-2 px-3 pb-1 border-b border-slate-200/80">
            {/* Income Bar */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-[11px] font-bold text-emerald-700 mb-1 group-hover:scale-105 transition-transform text-center">
                {formatCurrency(totalIncome)}
              </span>
              <div
                className="w-full max-w-[64px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-500 shadow-sm shadow-emerald-200 flex items-start justify-center pt-1"
                style={{
                  height: `${Math.max(12, (totalIncome / maxTotal) * 100)}%`,
                }}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-white/90" />
              </div>
              <span className="text-xs font-bold text-slate-700 mt-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                รายรับ
              </span>
            </div>

            {/* Expense Bar */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-[11px] font-bold text-rose-700 mb-1 group-hover:scale-105 transition-transform text-center">
                {formatCurrency(totalExpense)}
              </span>
              <div
                className="w-full max-w-[64px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl transition-all duration-500 shadow-sm shadow-rose-200 flex items-start justify-center pt-1"
                style={{
                  height: `${Math.max(12, (totalExpense / maxTotal) * 100)}%`,
                }}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-white/90" />
              </div>
              <span className="text-xs font-bold text-slate-700 mt-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                รายจ่าย
              </span>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span className="text-emerald-700">รายรับ: {incomePctOfFlow.toFixed(1)}%</span>
              <span className="text-rose-700">รายจ่าย: {expensePctOfFlow.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${incomePctOfFlow}%` }}
                title={`รายรับ ${incomePctOfFlow.toFixed(1)}%`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${expensePctOfFlow}%` }}
                title={`รายจ่าย ${expensePctOfFlow.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>

        {/* Net Flow Summary Pill */}
        <div className="mt-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-900 font-semibold">ผลต่างดุลคงเหลือสุทธิ</p>
              <p className="text-[10px] text-indigo-600">
                {netBalance >= 0 ? 'รายรับสูงกว่ารายจ่าย' : 'รายจ่ายเกินกว่ารายรับ'}
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-black ${
              netBalance >= 0 ? 'text-indigo-950' : 'text-rose-700'
            }`}
          >
            {formatCurrency(netBalance)}
          </span>
        </div>

        {/* Breakdown by Building (Mini table) */}
        {buildingList.length > 0 && !isCompact && (
          <div className="mt-3">
            <h4 className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>ภาพรวมรายรับ-รายจ่ายรายอาคาร ({buildingList.length})</span>
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {buildingList.map((item) => (
                <div
                  key={item.building}
                  className="p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 transition-colors border border-slate-100 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 truncate text-[11px]">
                      {item.building.replace('อาคาร มน.นิเวศ ', 'มน.')}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        item.net >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {item.net >= 0 ? '+' : ''}
                      {formatCurrency(item.net)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-emerald-600">รับ: {formatCurrency(item.income)}</span>
                    <span className="text-rose-600">จ่าย: {formatCurrency(item.expense)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
