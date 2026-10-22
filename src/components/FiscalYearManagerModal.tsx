import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, RotateCcw, AlertCircle } from 'lucide-react';
import { FiscalYearItem } from '../types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fiscalYears: FiscalYearItem[];
  onAddFiscalYear: (year: string) => Promise<void>;
  onDeleteFiscalYear: (id: string, year: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const FiscalYearManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  fiscalYears,
  onAddFiscalYear,
  onDeleteFiscalYear,
  onResetDefaults,
}) => {
  const [newYearInput, setNewYearInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmYear, setDeleteConfirmYear] = useState<FiscalYearItem | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let val = newYearInput.trim();
    if (!val) {
      setError('กรุณาระบุปีงบประมาณ');
      return;
    }

    // Auto format if user typed just digits like 2571 -> ปี งปม.2571
    if (!val.startsWith('ปี งปม.')) {
      val = `ปี งปม.${val.replace(/^ปี\s*งปม\.?/, '')}`;
    }

    if (fiscalYears.some((item) => item.year === val)) {
      setError('มีปีงบประมาณนี้ในระบบแล้ว');
      return;
    }

    setLoading(true);
    try {
      await onAddFiscalYear(val);
      setNewYearInput('');
    } catch (err) {
      console.error('Error adding fiscal year:', err);
      setError('ไม่สามารถเพิ่มปีงบประมาณได้');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickNextYear = async () => {
    // Find highest year number
    let maxNum = 2570;
    fiscalYears.forEach((item) => {
      const match = item.year.match(/\d{4}/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextYear = `ปี งปม.${maxNum + 1}`;
    setLoading(true);
    try {
      await onAddFiscalYear(nextYear);
    } catch (err) {
      console.error('Error adding next year:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: FiscalYearItem) => {
    setLoading(true);
    try {
      await onDeleteFiscalYear(item.id, item.year);
      setDeleteConfirmYear(null);
    } catch (err) {
      console.error('Error deleting fiscal year:', err);
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

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">จัดการ "ปีงปม." (ปีงบประมาณ)</h2>
            <p className="text-xs text-slate-500">
              เพิ่มหรือลบปีงบประมาณสำหรับบันทึกและจำแนกข้อมูล (สิทธิ์เฉพาะ Admin)
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Form */}
        <form onSubmit={handleAdd} className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
          <label className="block text-xs font-bold text-indigo-950">
            เพิ่มปีงบประมาณใหม่
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="เช่น ปี งปม.2571 หรือ 2571"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่ม</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span>ตัวอย่าง: ปี งปม.2571</span>
            <button
              type="button"
              onClick={handleQuickNextYear}
              disabled={loading}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors"
            >
              + เพิ่มปีถัดไปอัตโนมัติ
            </button>
          </div>
        </form>

        {/* Action Header & Reset Defaults */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <span className="text-xs font-bold text-slate-700">
            รายการปีงบประมาณทั้งหมด ({fiscalYears.length} ปี)
          </span>
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>คืนค่าเริ่มต้น (2556 - 2570)</span>
          </button>
        </div>

        {/* Fiscal Years List */}
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl max-h-[340px] overflow-y-auto">
          {fiscalYears.map((item, idx) => (
            <div
              key={item.id || item.year}
              className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 text-xs font-bold text-slate-300">#{idx + 1}</span>
                <span className="text-xs font-bold text-slate-800">{item.year}</span>
              </div>

              <button
                type="button"
                onClick={() => setDeleteConfirmYear(item)}
                title="ลบปีงบประมาณนี้"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmYear && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">ยืนยันการลบปีงบประมาณ</h4>
              <p className="text-xs text-slate-600 mt-2">
                คุณต้องการลบ <strong className="text-rose-600">"{deleteConfirmYear.year}"</strong> ออกจากระบบใช่หรือไม่?
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmYear(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDelete(deleteConfirmYear)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {loading ? 'กำลังลบ...' : 'ลบปีงบประมาณ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
