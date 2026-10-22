import React, { useState } from 'react';
import { X, Plus, Trash2, FolderPlus, RotateCcw, Check } from 'lucide-react';
import { CategoryItem, TransactionType } from '../types/finance';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { CATEGORY_PALETTE } from '../constants/categories';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onAddCategory: (cat: Omit<CategoryItem, 'id'>) => Promise<void>;
  onDeleteCategory: (id: string, name: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const CategoryManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  onResetDefaults,
}) => {
  const [activeType, setActiveType] = useState<TransactionType>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<CategoryItem | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeType);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === activeType)) {
      setError('มีหมวดหมู่นี้ในระบบแล้ว');
      return;
    }

    setLoading(true);
    try {
      await onAddCategory({
        name: trimmed,
        type: activeType,
        color: selectedColor,
        icon: selectedIcon,
        isCustom: true,
      });
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error adding category:', err);
      setError('ไม่สามารถเพิ่มหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    setLoading(true);
    try {
      await onDeleteCategory(cat.id, cat.name);
      setDeleteConfirmCat(null);
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">จัดการหมวดหมู่รายรับ-รายจ่าย</h2>
            <p className="text-xs text-slate-500">
              เพิ่มหรือลบหมวดหมู่สำหรับจัดหมวดหมู่รายการธุรกรรม (สิทธิ์เฉพาะ Admin)
            </p>
          </div>
        </div>

        {/* Type Switcher Tabs */}
        <div className="flex items-center justify-between gap-3 mt-5 mb-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => {
                setActiveType('expense');
                setIsAdding(false);
              }}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeType === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              หมวดหมู่รายจ่าย ({categories.filter((c) => c.type === 'expense').length})
            </button>
            <button
              onClick={() => {
                setActiveType('income');
                setIsAdding(false);
              }}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeType === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              หมวดหมู่รายรับ ({categories.filter((c) => c.type === 'income').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหมวดหมู่</span>
            </button>
            <button
              onClick={onResetDefaults}
              title="คืนค่าเริ่มต้นของระบบ"
              className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold px-2.5 py-2 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* New Category Form Collapsible */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="mb-5 p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-950">
                เพิ่มหมวดหมู่{activeType === 'expense' ? 'รายจ่าย' : 'รายรับ'}ใหม่
              </h4>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ปิด
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อหมวดหมู่ *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="เช่น ค่าบำรุงรักษาสวน, ค่าภาษีที่ดิน"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                autoFocus
              />
            </div>

            {/* Color Palette Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เลือกสีหมวดหมู่
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เลือกไอคอน
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                {AVAILABLE_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                      selectedIcon === iconName
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CategoryIcon iconName={iconName} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่ใหม่'}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-[420px] overflow-y-auto">
          {filteredCategories.map((cat, idx) => (
            <div
              key={cat.id || idx}
              className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <span className="text-xs font-bold text-slate-300 w-5">#{idx + 1}</span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <CategoryIcon iconName={cat.icon} className="w-4 h-4" color={cat.color} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cat.isCustom ? 'หมวดหมู่ที่สร้างขึ้นเอง' : 'หมวดหมู่มาตรฐาน'}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => setDeleteConfirmCat(cat)}
                title="ลบหมวดหมู่นี้"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmCat && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">ยืนยันการลบหมวดหมู่</h4>
              <p className="text-xs text-slate-600 mt-2">
                คุณต้องการลบหมวดหมู่ <strong className="text-rose-600">"{deleteConfirmCat.name}"</strong> ใช่หรือไม่?
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCat(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDelete(deleteConfirmCat)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {loading ? 'กำลังลบ...' : 'ลบหมวดหมู่'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
