import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Building2, Calendar } from 'lucide-react';
import { CategoryItem, Transaction, TransactionType, BUILDINGS, DEFAULT_FISCAL_YEARS, FiscalYearItem } from '../types/finance';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Transaction | null;
  categories?: CategoryItem[];
  fiscalYears?: FiscalYearItem[];
}

export const TransactionFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = [],
  fiscalYears = [],
}) => {
  const isEditing = Boolean(initialData && initialData.id);

  const availableFiscalYears = fiscalYears.length > 0
    ? fiscalYears.map((f) => f.year)
    : (DEFAULT_FISCAL_YEARS as unknown as string[]);

  const availableExpense = categories.filter((c) => c.type === 'expense').length > 0
    ? categories.filter((c) => c.type === 'expense')
    : DEFAULT_EXPENSE_CATEGORIES;

  const availableIncome = categories.filter((c) => c.type === 'income').length > 0
    ? categories.filter((c) => c.type === 'income')
    : DEFAULT_INCOME_CATEGORIES;

  // 1. Fiscal Year (1st order)
  const [fiscalYear, setFiscalYear] = useState<string>(
    initialData?.fiscalYear || availableFiscalYears[availableFiscalYears.length - 2] || 'ปี งปม.2569'
  );

  // 2. Building (2nd order)
  const [building, setBuilding] = useState<string>(
    initialData?.building || BUILDINGS[0]
  );

  // 3. Type
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');

  // 4. Amount
  const [amount, setAmount] = useState<string>(initialData?.amount ? initialData.amount.toString() : '');

  // 5. Category
  const [category, setCategory] = useState<string>(
    initialData?.category || (type === 'expense' ? availableExpense[0]?.name : availableIncome[0]?.name) || ''
  );

  // 6. Date
  const [date, setDate] = useState<string>(
    initialData?.date || new Date().toISOString().split('T')[0]
  );

  // 7. Note
  const [note, setNote] = useState<string>(initialData?.note || '');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize form whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFiscalYear(initialData.fiscalYear || availableFiscalYears[availableFiscalYears.length - 2] || 'ปี งปม.2569');
        setBuilding(initialData.building || BUILDINGS[0]);
        setType(initialData.type || 'expense');
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setCategory(initialData.category || '');
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setNote(initialData.note || '');
      } else {
        setFiscalYear(availableFiscalYears[availableFiscalYears.length - 2] || 'ปี งปม.2569');
        setBuilding(BUILDINGS[0]);
        setType('expense');
        setAmount('');
        setCategory(availableExpense[0]?.name || '');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setValidationError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const currentCategoryList = type === 'expense' ? availableExpense : availableIncome;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const list = newType === 'expense' ? availableExpense : availableIncome;
    setCategory(list[0]?.name || '');
  };

  const handleAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
  };

  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fiscalYear) {
      setValidationError('กรุณาเลือกปีงบประมาณ');
      return;
    }

    if (!building) {
      setValidationError('กรุณาเลือกอาคาร');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('กรุณาระบุจำนวนเงินที่มากกว่า 0');
      return;
    }

    if (!category) {
      setValidationError('กรุณาเลือกหมวดหมู่');
      return;
    }

    if (!date) {
      setValidationError('กรุณาเลือกวันที่');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        fiscalYear,
        building,
        type,
        amount: parsedAmount,
        category,
        date,
        note: note.trim() || '',
        updatedAt: new Date().toISOString(),
      });

      if (saveAndAddAnother && !isEditing) {
        // Clear amount and note for next quick entry, keep year, building, type, and date
        setAmount('');
        setNote('');
        setValidationError(null);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setValidationError(`บันทึกไม่สำเร็จ: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <h2 className="text-lg font-bold text-slate-900">
          {isEditing ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          {isEditing ? 'ปรับปรุงรายละเอียดรายการธุรกรรม' : 'ระบุปีงบประมาณ อาคาร หมวดหมู่ และยอดเงิน'}
        </p>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ลำดับที่ 1: ปีงปม. & ลำดับที่ 2: อาคาร */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. ปีงปม. (ปีงบประมาณ) *</span>
              </label>
              <select
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {availableFiscalYears.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. อาคารที่ต้องการบันทึก *</span>
              </label>
              <select
                required
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {BUILDINGS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. ประเภท: รายจ่าย vs รายรับ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. ประเภทรายการ *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายจ่าย (Expense)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายรับ (Income)
              </button>
            </div>
          </div>

          {/* 4. จำนวนเงิน (บาท) & ปุ่มลัด */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              4. จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                ฿
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border text-2xl font-black focus:outline-none focus:ring-2 transition-all ${
                  type === 'expense'
                    ? 'border-rose-200 focus:ring-rose-400 text-rose-600'
                    : 'border-emerald-200 focus:ring-emerald-400 text-emerald-600'
                }`}
                autoFocus
              />
            </div>
            {/* Quick add chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50, 100, 300, 500, 1000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleAddAmount(quick)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  +{quick}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 text-xs transition-colors"
              >
                ล้าง
              </button>
            </div>
          </div>

          {/* 5. หมวดหมู่ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              5. หมวดหมู่ ({type === 'expense' ? 'รายจ่าย' : 'รายรับ'}) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
              {currentCategoryList.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                        : 'border-slate-100 hover:border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" color={cat.color} />
                    </div>
                    <span className="truncate flex-1">{cat.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. วันที่ทำรายการ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              6. วันที่ทำรายการ *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 7. บันทึกช่วยจำ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              7. บันทึกช่วยจำ (ไม่จำเป็น)
            </label>
            <input
              type="text"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ซ่อมบำรุงเปลี่ยนก๊อกน้ำชั้น 2, ค่าจัดจ้างทำความสะอาดประจำงวด"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            {!isEditing && (
              <button
                type="submit"
                onClick={() => setSaveAndAddAnother(true)}
                disabled={loading}
                className="py-2.5 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>บันทึก & เพิ่มต่อทันที</span>
              </button>
            )}
            <button
              type="submit"
              onClick={() => setSaveAndAddAnother(false)}
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {loading ? (
                'กำลังบันทึก...'
              ) : isEditing ? (
                'บันทึกการแก้ไข'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  บันทึกและปิดหน้าต่าง
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
