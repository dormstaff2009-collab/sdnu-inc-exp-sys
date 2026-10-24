import React from 'react';
import { CategorySummary, TransactionType } from '../types/finance';
import { getCategoryMeta } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/format';

interface Props {
  summaries: CategorySummary[];
  totalAmount: number;
  type: TransactionType;
}

export const CategoryBreakdown: React.FC<Props> = ({ summaries, totalAmount, type }) => {

  if (summaries.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            สรุปภาพรวมแยกตามหมวดหมู่ ({type === 'expense' ? 'รายจ่าย' : 'รายรับ'})
          </h3>
          <p className="text-xs text-slate-500">เรียงตามยอดรวมจากมากไปน้อย</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {summaries.length} หมวดหมู่
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((item, index) => {
          const meta = getCategoryMeta(item.category, item.type);

          return (
            <div
              key={item.category}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-xs font-bold text-slate-400">#{index + 1}</span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <CategoryIcon iconName={meta.icon} className="w-3.5 h-3.5" color={item.color} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.category}</h4>
                    <p className="text-[10px] text-slate-400">{item.count} รายการ</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{formatCurrency(item.total)}</p>
                  <p className="text-[10px] font-bold" style={{ color: item.color }}>
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
