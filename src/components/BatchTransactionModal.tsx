import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Sparkles, Building2, Calendar, ClipboardPaste } from 'lucide-react';
import { CategoryItem, Transaction, TransactionType, BUILDINGS, FiscalYearItem, DEFAULT_FISCAL_YEARS } from '../types/finance';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/categories';

interface BatchRow {
  id: string;
  category: string;
  amount: string;
  note: string;
  building?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (items: Array<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  categories?: CategoryItem[];
  fiscalYears?: FiscalYearItem[];
  defaultFiscalYear?: string;
  defaultBuilding?: string;
}

export const BatchTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveBatch,
  categories = [],
  fiscalYears = [],
  defaultFiscalYear,
  defaultBuilding,
}) => {
  const availableFiscalYears = fiscalYears.length > 0
    ? fiscalYears.map((f) => f.year)
    : (DEFAULT_FISCAL_YEARS as unknown as string[]);

  const availableExpense = categories.filter((c) => c.type === 'expense').length > 0
    ? categories.filter((c) => c.type === 'expense')
    : DEFAULT_EXPENSE_CATEGORIES;

  const availableIncome = categories.filter((c) => c.type === 'income').length > 0
    ? categories.filter((c) => c.type === 'income')
    : DEFAULT_INCOME_CATEGORIES;

  const [mode, setMode] = useState<'grid' | 'paste'>('grid');
  const [fiscalYear, setFiscalYear] = useState<string>(
    defaultFiscalYear && defaultFiscalYear !== 'all'
      ? defaultFiscalYear
      : availableFiscalYears[availableFiscalYears.length - 2] || 'ปี งปม.2569'
  );
  const [commonBuilding, setCommonBuilding] = useState<string>(
    defaultBuilding && defaultBuilding !== 'all' ? defaultBuilding : BUILDINGS[0]
  );
  const [type, setType] = useState<TransactionType>('income');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentCategoryList = type === 'expense' ? availableExpense : availableIncome;

  const createEmptyRow = (customCategory?: string): BatchRow => ({
    id: `row-${Math.random().toString(36).substring(2, 9)}`,
    category: customCategory || currentCategoryList[0]?.name || '',
    amount: '',
    note: '',
    building: commonBuilding,
  });

  const [rows, setRows] = useState<BatchRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof BatchRow, val: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const list = newType === 'expense' ? availableExpense : availableIncome;
    const defaultCat = list[0]?.name || '';
    setRows((prev) => prev.map((r) => ({ ...r, category: defaultCat })));
  };

  // Parse pasted table text (from Excel or Google Sheets)
  const handleParsePaste = () => {
    setErrorMsg(null);
    if (!pasteText.trim()) {
      setErrorMsg('กรุณาวางข้อมูลจาก Excel หรือ Google Sheets ก่อนกดแปลง');
      return;
    }

    const lines = pasteText.trim().split(/\r?\n/);
    const parsedRows: BatchRow[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      // Split by tab (Excel/Sheets default) or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 2) {
        // Formats supported:
        // A) Category, Amount, Note
        // B) Building, Category, Amount, Note
        let bld = commonBuilding;
        let cat = parts[0]?.trim();
        let amtStr = parts[1]?.trim();
        let nt = parts[2]?.trim() || '';

        // If part 0 is a building name
        if (BUILDINGS.some(b => b === parts[0]?.trim())) {
          bld = parts[0].trim();
          cat = parts[1]?.trim() || currentCategoryList[0]?.name || '';
          amtStr = parts[2]?.trim() || '0';
          nt = parts[3]?.trim() || '';
        }

        // Clean amount string (remove comma, currency symbols)
        const cleanAmt = amtStr.replace(/[^0-9.]/g, '');

        parsedRows.push({
          id: `row-${Math.random().toString(36).substring(2, 9)}`,
          category: cat || currentCategoryList[0]?.name || '',
          amount: cleanAmt,
          note: nt,
          building: bld,
        });
      }
    }

    if (parsedRows.length === 0) {
      setErrorMsg('ไม่สามารถอ่านข้อมูลได้ กรุณาตรวจสอบรูปแบบ (อย่างน้อย 2 คอลัมน์: หมวดหมู่ และ ยอดเงิน)');
      return;
    }

    setRows(parsedRows);
    setMode('grid');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validRows = rows.filter((r) => {
      const amt = parseFloat(r.amount);
      return !isNaN(amt) && amt > 0 && r.category.trim() !== '';
    });

    if (validRows.length === 0) {
      setErrorMsg('กรุณาระบุหมวดหมู่และจำนวนเงินอย่างน้อย 1 รายการที่ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      const payload: Array<Omit<Transaction, 'id' | 'createdAt'>> = validRows.map((r) => ({
        fiscalYear,
        building: r.building || commonBuilding,
        type,
        amount: parseFloat(r.amount),
        category: r.category.trim(),
        date,
        note: (r.note || '').trim(),
        updatedAt: new Date().toISOString(),
      }));

      await onSaveBatch(payload);
      onClose();
    } catch (err: any) {
      console.error('Batch save error:', err);
      setErrorMsg(`เกิดข้อผิดพลาดในการบันทึก: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">บันทึกข้อมูลหลายรายการพร้อมกัน (Bulk Entry)</h2>
            <p className="text-xs text-slate-500">
              เหมาะสำหรับการบันทึกรายรับหรือรายจ่ายหลายรายการในคราวเดียว (เช่น 16 รายการรายรับ หรือ 7 รายการรายจ่าย)
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex items-center justify-between mt-3 mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'grid' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              กรอกข้อมูลในตาราง ({rows.length} แถว)
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'paste' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
              <span>วางข้อมูลจาก Excel / Google Sheets</span>
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              รายรับ (Income)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                type === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              รายจ่าย (Expense)
            </button>
          </div>
        </div>

        {/* Common Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>ปีงปม.</span>
            </label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
            >
              {availableFiscalYears.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>อาคารหลัก</span>
            </label>
            <select
              value={commonBuilding}
              onChange={(e) => {
                setCommonBuilding(e.target.value);
                setRows((prev) => prev.map((r) => ({ ...r, building: e.target.value })));
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
            >
              {BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <span>วันที่ทำรายการ</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Mode 1: Paste Text */}
        {mode === 'paste' ? (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed">
              <strong>วิธีใช้งาน:</strong> คัดลอก (Copy) ข้อมูลจาก Excel หรือ Google Sheets แล้วนำมาวางในช่องด้านล่าง<br />
              รูปแบบคอลัมน์: <code>หมวดหมู่ [แท็บ] จำนวนเงิน [แท็บ] บันทึกช่วยจำ</code> หรือ <code>อาคาร [แท็บ] หมวดหมู่ [แท็บ] จำนวนเงิน</code>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="ตัวอย่างการวาง:&#10;ค่าห้องพัก&#9;15000&#9;ห้อง 101&#10;ค่าห้องพัก&#9;12000&#9;ห้อง 102&#10;ค่าบริการเครื่องซักผ้าหยอดเหรียญ&#9;4500&#9;รอบกลางเดือน"
              className="flex-1 w-full p-3 font-mono text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleParsePaste}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                แปลงเป็นรายการตาราง
              </button>
            </div>
          </div>
        ) : (
          /* Mode 2: Table Grid */
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded-xl">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">อาคาร</div>
              <div className="col-span-3">หมวดหมู่ ({type === 'income' ? 'รายรับ' : 'รายจ่าย'})</div>
              <div className="col-span-2">จำนวนเงิน (บาท) *</div>
              <div className="col-span-2">บันทึกช่วยจำ</div>
              <div className="col-span-1 text-center">ลบ</div>
            </div>

            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors"
              >
                <div className="col-span-1 text-center text-xs font-bold text-slate-400">
                  {idx + 1}
                </div>
                <div className="col-span-3">
                  <select
                    value={row.building || commonBuilding}
                    onChange={(e) => handleRowChange(row.id, 'building', e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {BUILDINGS.map((b) => (
                      <option key={b} value={b}>
                        {b.replace('อาคาร มน.นิเวศ ', 'มน.')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <select
                    value={row.category}
                    onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    {currentCategoryList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.amount}
                    onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 text-right font-bold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={row.note}
                    onChange={(e) => handleRowChange(row.id, 'note', e.target.value)}
                    placeholder="ไม่ระบุก็ได้"
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 text-slate-700"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length <= 1}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors disabled:opacity-20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:bg-indigo-50/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มแถวใหม่ (รายการที่ {rows.length + 1})</span>
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
          <div className="text-xs text-slate-500">
            รายการพร้อมบันทึก: <strong className="text-slate-800">{rows.filter(r => parseFloat(r.amount) > 0).length}</strong> รายการ
            {rows.filter(r => parseFloat(r.amount) > 0).length > 0 && (
              <span className="ml-2 font-bold text-indigo-600">
                (รวม {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(
                  rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
                )})
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || rows.filter(r => parseFloat(r.amount) > 0).length === 0}
              className={`py-2.5 px-5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'กำลังบันทึกลงฐานข้อมูล...' : `บันทึกข้อมูลทั้งหมดเข้าสู่ระบบ (${rows.filter(r => parseFloat(r.amount) > 0).length} รายการ)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
