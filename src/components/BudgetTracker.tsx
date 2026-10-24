import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2, TrendingDown, Edit3, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

interface Props {
  totalExpense: number;
}

export const BudgetTracker: React.FC<Props> = ({ totalExpense }) => {
  const { monthlyBudget, saveMonthlyBudget, currentMonth, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(monthlyBudget.toString());
  const [saving, setSaving] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const budget = monthlyBudget || 0;
  const remaining = budget - totalExpense;
  const percentUsed = budget > 0 ? (totalExpense / budget) * 100 : 0;
  const isOverBudget = remaining < 0 && budget > 0;

  // Calculate days remaining in current month for daily allowance recommendation
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isSelectedCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentDay = isSelectedCurrentMonth ? today.getDate() : 1;
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);
  const dailyAllowance = remaining > 0 ? Math.floor(remaining / daysLeft) : 0;

  const handleOpenModal = () => {
    setInputValue(budget > 0 ? budget.toString() : '20000');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < 0) return;

    setSaving(true);
    try {
      await saveMonthlyBudget(num, currentMonth);
      setIsModalOpen(false);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Save budget error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Color progress based on percentage
  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-100 text-emerald-800';
  let statusText = 'อยู่ในงบประมาณ';

  if (isOverBudget) {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-100 text-rose-800';
    statusText = 'เกินงบประมาณ!';
  } else if (percentUsed >= 85) {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-800';
    statusText = 'ใกล้เต็มวงเงิน';
  } else if (percentUsed >= 70) {
    progressColor = 'bg-yellow-500';
    badgeColor = 'bg-yellow-100 text-yellow-800';
    statusText = 'ใช้ไปกว่า 70%';
  }

  const presets = [15000, 20000, 25000, 30000, 40000, 50000];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div>
        {/* Title & Edit Button */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">งบประมาณรายเดือน</h3>
              <p className="text-[11px] text-slate-500">เป้าหมายการควบคุมค่าใช้จ่าย</p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{budget > 0 ? 'ปรับงบ' : 'ตั้งงบ'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              เฉพาะ Admin ปรับงบได้
            </span>
          )}
        </div>

        {budget === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-500 mb-3">ยังไม่ได้กำหนดงบประมาณสำหรับเดือนนี้</p>
            {isAdmin ? (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                กำหนดงบประมาณตอนนี้
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                (รอผู้ดูแลระบบกำหนดวงเงินงบประมาณ)
              </span>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {/* Main Stats */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">ใช้จ่ายไปแล้ว</span>
                <p className="text-xl font-extrabold text-slate-900 leading-tight">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">งบประมาณทั้งหมด</span>
                <p className="text-sm font-bold text-slate-700">{formatCurrency(budget)}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}>
                  {statusText} ({percentUsed.toFixed(0)}%)
                </span>
                <span className="font-semibold text-slate-600">
                  {isOverBudget ? (
                    <span className="text-rose-600 font-bold">
                      เกินงบ {formatCurrency(Math.abs(remaining))}
                    </span>
                  ) : (
                    <span>เหลือ {formatCurrency(remaining)}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Recommendation pill */}
            {!isOverBudget && remaining > 0 && isSelectedCurrentMonth && (
              <div className="mt-3 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <span>เหลืออีก {daysLeft} วัน แนะนำใช้วันละไม่เกิน</span>
                </div>
                <span className="font-bold text-emerald-700">{formatCurrency(dailyAllowance)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for setting budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ตั้งงบประมาณรายเดือน</h3>
                <p className="text-xs text-slate-500">สำหรับเดือน {currentMonth}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  จำนวนเงินงบประมาณ (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ฿
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="เช่น 25000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-2">
                  ตัวเลือกยอดเงินยอดนิยม
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInputValue(val.toString())}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        inputValue === val.toString()
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {formatCurrency(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
