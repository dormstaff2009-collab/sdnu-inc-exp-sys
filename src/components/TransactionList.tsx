import React, { useState } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  ArrowUpDown,
  Tag,
  Building2,
} from 'lucide-react';
import { Transaction, TransactionType, BUILDINGS, FiscalYearItem, DEFAULT_FISCAL_YEARS } from '../types/finance';
import { getCategoryMeta } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { useAuth } from '../context/AuthContext';

interface Props {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  fiscalYears?: FiscalYearItem[];
}

export const TransactionList: React.FC<Props> = ({
  transactions,
  onEdit,
  onDelete,
  onAddNew,
  fiscalYears = [],
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const availableFiscalYears = fiscalYears.length > 0
    ? fiscalYears.map((f) => f.year)
    : (DEFAULT_FISCAL_YEARS as unknown as string[]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDateThai = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const buddhistYear = parseInt(year, 10) + 543;
      const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
      ];
      const mIdx = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${monthNames[mIdx]} ${buddhistYear}`;
    } catch {
      return dateStr;
    }
  };

  // Distinct categories available in current transactions
  const availableCategories = Array.from(new Set(transactions.map((t) => t.category)));

  // Filter & Sort
  const filteredTransactions = transactions
    .filter((tx) => {
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesFiscalYear = fiscalYearFilter === 'all' || tx.fiscalYear === fiscalYearFilter;
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
      const matchesBuilding = buildingFilter === 'all' || tx.building === buildingFilter;
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        tx.category.toLowerCase().includes(query) ||
        (tx.fiscalYear && tx.fiscalYear.toLowerCase().includes(query)) ||
        (tx.building && tx.building.toLowerCase().includes(query)) ||
        (tx.note && tx.note.toLowerCase().includes(query));
      return matchesType && matchesFiscalYear && matchesCategory && matchesBuilding && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  // CSV Export utility (Compatible with Microsoft Excel and Google Sheets)
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['ลำดับ', 'ปีงปม.', 'อาคาร', 'วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'บันทึกช่วยจำ'];
    const rows = filteredTransactions.map((tx, idx) => [
      idx + 1,
      `"${(tx.fiscalYear || '').replace(/"/g, '""')}"`,
      `"${(tx.building || '').replace(/"/g, '""')}"`,
      tx.date,
      tx.type === 'expense' ? 'รายจ่าย' : 'รายรับ',
      `"${tx.category.replace(/"/g, '""')}"`,
      tx.amount,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ]);

    // UTF-8 BOM (\uFEFF) ensures Excel properly recognizes Thai character encoding
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sdnu-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800">รายการธุรกรรม</h3>
          <p className="text-xs text-slate-500">
            แสดง {filteredTransactions.length} จาก {transactions.length} รายการ
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาหมวดหมู่ หรือข้อความ..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            title="ส่งออกไฟล์ CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-50 text-xs">
        {/* Type Filter */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'expense' ? 'bg-rose-500 text-white shadow-xs font-bold' : 'text-slate-500'
            }`}
          >
            รายจ่าย
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-500'
            }`}
          >
            รายรับ
          </button>
        </div>

        {/* Fiscal Year Dropdown Filter */}
        <div className="relative">
          <select
            value={fiscalYearFilter}
            onChange={(e) => setFiscalYearFilter(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="all">ทุกปีงปม. ({availableFiscalYears.length})</option>
            {availableFiscalYears.map((fy) => (
              <option key={fy} value={fy}>
                {fy}
              </option>
            ))}
          </select>
        </div>

        {/* Building Dropdown Filter */}
        <div className="relative">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="all">ทุกอาคาร (8 อาคาร)</option>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown Filter */}
        {availableCategories.length > 0 && (
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">ทุกหมวดหมู่ ({availableCategories.length})</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Dropdown */}
        <div className="ml-auto flex items-center gap-1.5 text-slate-500">
          <ArrowUpDown className="w-3 h-3" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="date-desc">วันที่ล่าสุด</option>
            <option value="date-asc">วันที่เก่าสุด</option>
            <option value="amount-desc">ยอดเงินสูงสุด</option>
            <option value="amount-asc">ยอดเงินต่ำสุด</option>
          </select>
        </div>
      </div>

      {/* Transaction List Rows */}
      {filteredTransactions.length === 0 ? (
        <div className="py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
          {isAdmin && (
            <button
              onClick={onAddNew}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              + บันทึกรายการ
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] mt-1">
          {filteredTransactions.map((tx) => {
            const meta = getCategoryMeta(tx.category, tx.type);
            const isExpense = tx.type === 'expense';

            return (
              <div
                key={tx.id}
                className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors group"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <CategoryIcon iconName={meta.icon} className="w-5 h-5" color={meta.color} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                        {tx.category}
                      </span>
                      {tx.fiscalYear && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                          <Calendar className="w-2.5 h-2.5 text-amber-600" />
                          {tx.fiscalYear}
                        </span>
                      )}
                      {tx.building && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          <Building2 className="w-2.5 h-2.5 text-indigo-500" />
                          {tx.building}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateThai(tx.date)}
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px] sm:max-w-xs text-slate-500">
                            {tx.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-extrabold ${
                        isExpense ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  {/* Edit & Delete Action Buttons (Admin Only) */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(tx)}
                        title="แก้ไขรายการ"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(tx.id)}
                        title="ลบรายการ"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800">ยืนยันการลบรายการ</h4>
            <p className="text-xs text-slate-500 mt-2">
              คุณต้องการลบรายการนี้ใช่หรือไม่ ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
