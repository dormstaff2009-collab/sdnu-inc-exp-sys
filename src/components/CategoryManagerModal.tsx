import React, { useState } from 'react';
import { X, Plus, Trash2, FolderPlus, RotateCcw, Check, Pencil } from 'lucide-react';
import { CategoryItem, TransactionType } from '../types/finance';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { CATEGORY_PALETTE } from '../constants/categories';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onAddCategory: (cat: Omit<CategoryItem, 'id'>) => Promise<void>;
  onEditCategory: (id: string, updated: Omit<CategoryItem, 'id'>, oldName?: string) => Promise<void>;
  onDeleteCategory: (id: string, name: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const CategoryManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onEditCategory,
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

  // Edit category state
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(CATEGORY_PALETTE[0]);
  const [editIcon, setEditIcon] = useState(AVAILABLE_ICONS[0]);
  const [editError, setEditError] = useState<string | null>(null);

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

  const startEdit = (cat: CategoryItem) => {
    setIsAdding(false);
    setEditingCat(cat);
    setEditName(cat.name);
    setEditColor(cat.color || CATEGORY_PALETTE[0]);
    setEditIcon(cat.icon || AVAILABLE_ICONS[0]);
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setEditError(null);
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }

    if (
      categories.some(
        (c) =>
          c.id !== editingCat.id &&
          c.name.toLowerCase() === trimmed.toLowerCase() &&
          c.type === editingCat.type
      )
    ) {
      setEditError('มีหมวดหมู่นี้ในระบบแล้ว');
      return;
    }

    setLoading(true);
    try {
      await onEditCategory(
        editingCat.id,
        {
          name: trimmed,
          type: editingCat.type,
          color: editColor,
          icon: editIcon,
          isCustom: editingCat.isCustom ?? true,
        },
        editingCat.name
      );
      setEditingCat(null);
    } catch (err) {
      console.error('Error updating category:', err);
      setEditError('ไม่สามารถบันทึกการแก้ไขหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    setLoading(true);
    try {
      await onDeleteCategory(cat.id, cat.name);
      setDeleteConfirmCat(null);
      if (editingCat?.id === cat.id) {
        setEditingCat(null);
      }
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
              เพิ่ม ลบ หรือแก้ไขหมวดหมู่สำหรับจัดหมวดหมู่รายการธุรกรรม (สิทธิ์เฉพาะ Admin)
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
                setEditingCat(null);
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
                setEditingCat(null);
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
              onClick={() => {
                setIsAdding(!isAdding);
                setEditingCat(null);
              }}
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

        {/* Edit Category Form Collapsible */}
        {editingCat && (
          <form
            onSubmit={handleUpdate}
            className="mb-5 p-4 rounded-2xl border border-amber-300 bg-amber-50/60 space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h4 className="text-xs font-bold text-amber-950">
                  แก้ไขหมวดหมู่{editingCat.type === 'expense' ? 'รายจ่าย' : 'รายรับ'}:{' '}
                  <span className="text-indigo-700 font-extrabold">"{editingCat.name}"</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ปิด
              </button>
            </div>

            {editError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                {editError}
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="ระบุชื่อหมวดหมู่"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                autoFocus
              />
            </div>

            {/* Live Preview badge */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">ตัวอย่างการแสดงผล:</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${editColor}20` }}
              >
                <CategoryIcon iconName={editIcon} className="w-3.5 h-3.5" color={editColor} />
              </div>
              <span className="text-xs font-bold text-slate-800">{editName || 'ชื่อหมวดหมู่'}</span>
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
                    onClick={() => setEditColor(color)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: color }}
                  >
                    {editColor === color && <Check className="w-3.5 h-3.5 text-white" />}
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
                    onClick={() => setEditIcon(iconName)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                      editIcon === iconName
                        ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500'
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
                onClick={() => setEditingCat(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-[420px] overflow-y-auto">
          {filteredCategories.map((cat, idx) => (
            <div
              key={cat.id || idx}
              className={`p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors ${
                editingCat?.id === cat.id ? 'bg-amber-50/40 ring-1 ring-inset ring-amber-200' : ''
              }`}
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
                    {cat.isCustom ? 'หมวดหมู่ที่ปรับแต่ง/สร้างเอง' : 'หมวดหมู่มาตรฐาน'}
                  </span>
                </div>
              </div>

              {/* Actions button group */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => startEdit(cat)}
                  title="แก้ไขหมวดหมู่นี้"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmCat(cat)}
                  title="ลบหมวดหมู่นี้"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
