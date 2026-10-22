import { CategoryItem } from '../types/finance';

export const DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 'exp-1', name: 'ค่าจ้างแม่บ้านทำความสะอาด', type: 'expense', color: '#06B6D4', icon: 'Sparkles' },
  { id: 'exp-2', name: 'ค่าจ้างเหมาดูแลและรักษาความปลอดภัย', type: 'expense', color: '#3B82F6', icon: 'ShieldCheck' },
  { id: 'exp-3', name: 'ค่าจ้างเหมาดูแลและบำรุงรักษาลิฟท์', type: 'expense', color: '#6366F1', icon: 'Building' },
  { id: 'exp-4', name: 'ค่าจ้างเหมากำจัดปลวก', type: 'expense', color: '#EF4444', icon: 'Bug' },
  { id: 'exp-5', name: 'ค่าจ้างสูบสิ่งปฏิกูล', type: 'expense', color: '#84CC16', icon: 'Droplets' },
  { id: 'exp-6', name: 'ค่าจ้างซักชุดเครื่องนอนห้องรับรอง', type: 'expense', color: '#EC4899', icon: 'Bed' },
  { id: 'exp-7', name: 'ค่าจ้างซ่อมบำรุงรักษาครุภัณฑ์', type: 'expense', color: '#F97316', icon: 'Wrench' },
  { id: 'exp-8', name: 'ค่าจัดซื้อครุภัณฑ์', type: 'expense', color: '#8B5CF6', icon: 'Package' },
  { id: 'exp-9', name: 'ค่าจัดซื้อครุภัณฑ์ต่ำกว่าเกณฑ์', type: 'expense', color: '#A855F7', icon: 'Box' },
  { id: 'exp-10', name: 'ค่าจัดซื้อวัสดุสำนักงาน', type: 'expense', color: '#14B8A6', icon: 'FileText' },
  { id: 'exp-11', name: 'ค่าจัดซื้อวัสดุงานบ้านงานครัว', type: 'expense', color: '#F59E0B', icon: 'UtensilsCrossed' },
  { id: 'exp-12', name: 'ค่าจัดซื้อวัสดุก่อสร้าง', type: 'expense', color: '#78716C', icon: 'Hammer' },
  { id: 'exp-13', name: 'ค่าจัดซื้อวัสดุไฟฟ้าและวิทยุ', type: 'expense', color: '#EAB308', icon: 'Zap' },
  { id: 'exp-14', name: 'ค่าจัดซื้อวัสดุการเกษตร', type: 'expense', color: '#10B981', icon: 'Sprout' },
  { id: 'exp-15', name: 'วัสดุเชื้อเพลิงและหล่อลื่น', type: 'expense', color: '#DC2626', icon: 'Fuel' },
  { id: 'exp-16', name: 'วัสดุยานพาหนะและขนส่ง', type: 'expense', color: '#2563EB', icon: 'Truck' },
  { id: 'exp-17', name: 'อื่นๆ', type: 'expense', color: '#64748B', icon: 'MoreHorizontal' },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'inc-1', name: 'ค่าเช่าที่พัก (หักผ่านบัญชี)', type: 'income', color: '#10B981', icon: 'Building2' },
  { id: 'inc-2', name: 'ค่าเช่าที่พัก (ไม่สามารถหักผ่านบัญชี)', type: 'income', color: '#059669', icon: 'Receipt' },
  { id: 'inc-3', name: 'ค่าเช่าห้องพักรับรอง', type: 'income', color: '#0EA5E9', icon: 'Hotel' },
  { id: 'inc-4', name: 'ค่าบริการเครื่องซักผ้าหยอดเหรียญ', type: 'income', color: '#F59E0B', icon: 'Coins' },
  { id: 'inc-5', name: 'อื่นๆ', type: 'income', color: '#64748B', icon: 'PlusCircle' },
];

// Color palette options for adding custom categories
export const CATEGORY_PALETTE = [
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#14B8A6',
  '#64748B', '#0EA5E9', '#A855F7', '#D946EF', '#78716C',
];

export function getCategoryMeta(
  categoryName: string,
  type: 'income' | 'expense',
  customCategories?: CategoryItem[]
): { color: string; icon: string } {
  const allCustom = customCategories || [];
  const foundCustom = allCustom.find((c) => c.name === categoryName && c.type === type);
  if (foundCustom) return { color: foundCustom.color, icon: foundCustom.icon };

  const list = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
  const found = list.find((c) => c.name === categoryName);
  if (found) return { color: found.color, icon: found.icon };

  // Fallback
  return { color: type === 'expense' ? '#F97316' : '#10B981', icon: 'CircleDot' };
}
