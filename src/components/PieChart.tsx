import React, { useState } from 'react';
import { CategorySummary, TransactionType } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { getCategoryMeta } from '../constants/categories';
import { formatCurrency } from '../utils/format';

interface Props {
  summaries: CategorySummary[];
  totalAmount: number;
  type: TransactionType;
  onTypeChange?: (type: TransactionType) => void;
  title?: string;
  size?: number;
}

export const PieChart: React.FC<Props> = ({
  summaries,
  totalAmount,
  type,
  onTypeChange,
  title,
  size = 200,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayTitle =
    title ||
    (type === 'expense'
      ? 'แผนภูมิวงกลมแสดงสัดส่วนรายจ่าย'
      : 'แผนภูมิวงกลมแสดงสัดส่วนรายรับ');

  // SVG parameters
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDasharray and offsets
  let accumulatedAngle = 0;
  const slices = summaries.map((item, index) => {
    const fraction = totalAmount > 0 ? item.total / totalAmount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeItem = hoveredIndex !== null ? summaries[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      {/* Header with Title and Type Badge/Selector */}
      <div>
        <div className="flex items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">{displayTitle}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {type === 'expense' ? 'วิเคราะห์สัดส่วนการใช้จ่ายแต่ละหมวดหมู่' : 'วิเคราะห์สัดส่วนที่มาของรายรับ'}
            </p>
          </div>

          {onTypeChange ? (
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-medium shrink-0">
              <button
                onClick={() => onTypeChange('expense')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายจ่าย
              </button>
              <button
                onClick={() => onTypeChange('income')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายรับ
              </button>
            </div>
          ) : (
            <span
              className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                type === 'income'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {type === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)'}
            </span>
          )}
        </div>

        {summaries.length === 0 || totalAmount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-3 text-slate-300 text-xl">
              {type === 'expense' ? '💸' : '💰'}
            </div>
            <p className="text-xs font-bold text-slate-600">
              ยังไม่มีข้อมูล{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ข้อมูลจะแสดงทันทีเมื่อมีการบันทึก{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-4">
            {/* Donut Chart Visual */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 filter drop-shadow-xs"
              >
                {/* Background Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#f8fafc"
                  strokeWidth={strokeWidth}
                />

                {/* Slices */}
                {slices.map((slice) => {
                  const isHovered = hoveredIndex === slice.index;
                  return (
                    <circle
                      key={slice.category}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(slice.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Inner Center Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3">
                {activeItem ? (
                  <>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5 max-w-[130px] truncate"
                      style={{ backgroundColor: `${activeItem.color}20`, color: activeItem.color }}
                    >
                      {activeItem.category}
                    </span>
                    <span className="text-sm font-black text-slate-900 leading-tight">
                      {formatCurrency(activeItem.total)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                      {activeItem.percentage.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-400 font-medium leading-none mb-1">
                      {type === 'expense' ? 'รายจ่ายรวม' : 'รายรับรวม'}
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      {formatCurrency(totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {summaries.length} หมวดหมู่
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Category Legend & Breakdown List */}
            <div className="w-full max-h-48 overflow-y-auto space-y-1 pr-1 border-t border-slate-100 pt-3">
              {summaries.map((item, idx) => {
                const meta = getCategoryMeta(item.category, item.type);
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isHovered ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}18` }}
                      >
                        <CategoryIcon iconName={meta.icon} className="w-3 h-3" color={item.color} />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="font-semibold text-slate-800 truncate text-[11px]">{item.category}</p>
                        <p className="text-[10px] text-slate-400">{item.count} รายการ</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-[11px]">{formatCurrency(item.total)}</p>
                      <p className="text-[10px] font-bold" style={{ color: item.color }}>
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
