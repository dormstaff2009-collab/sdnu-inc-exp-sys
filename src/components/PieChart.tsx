import React, { useState } from 'react';
import { CategorySummary, TransactionType } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { getCategoryMeta } from '../constants/categories';

interface Props {
  summaries: CategorySummary[];
  totalAmount: number;
  type: TransactionType;
  onTypeChange?: (type: TransactionType) => void;
  title?: string;
}

export const PieChart: React.FC<Props> = ({
  summaries,
  totalAmount,
  type,
  onTypeChange,
  title = 'สัดส่วนตามหมวดหมู่',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // SVG parameters
  const size = 260;
  const strokeWidth = 36;
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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      {/* Header with Type Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {type === 'expense' ? 'วิเคราะห์การใช้จ่ายแต่ละหมวดหมู่' : 'วิเคราะห์ที่มาของรายรับ'}
          </p>
        </div>

        {onTypeChange && (
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => onTypeChange('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายจ่าย
            </button>
            <button
              onClick={() => onTypeChange('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายรับ
            </button>
          </div>
        )}
      </div>

      {summaries.length === 0 || totalAmount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 my-auto">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-3 text-slate-300">
            📊
          </div>
          <p className="text-sm font-medium text-slate-600">ยังไม่มีข้อมูล{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}ในเดือนนี้</p>
          <p className="text-xs text-slate-400 mt-1">กดปุ่ม "บันทึกรายการ" เพื่อเริ่มต้นบันทึกข้อมูล</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6 pt-5 my-auto">
          {/* Donut Chart Visual */}
          <div className="relative flex items-center justify-center flex-shrink-0">
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
                stroke="#f1f5f9"
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
                    strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              {activeItem ? (
                <>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full mb-1 max-w-[120px] truncate"
                    style={{ backgroundColor: `${activeItem.color}20`, color: activeItem.color }}
                  >
                    {activeItem.category}
                  </span>
                  <span className="text-lg font-bold text-slate-900 leading-tight">
                    {formatCurrency(activeItem.total)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 mt-0.5">
                    {activeItem.percentage.toFixed(1)}% ของทั้งหมด
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-500 font-medium">
                    {type === 'expense' ? 'รายจ่ายรวม' : 'รายรับรวม'}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 leading-tight">
                    {formatCurrency(totalAmount)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {summaries.length} หมวดหมู่
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Category Legend & Breakdown List */}
          <div className="w-full flex-1 max-h-64 overflow-y-auto pr-1 space-y-2">
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
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.color}18` }}
                    >
                      <CategoryIcon iconName={meta.icon} className="w-3.5 h-3.5" color={item.color} />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-semibold text-slate-800 truncate">{item.category}</p>
                      <p className="text-[11px] text-slate-400">{item.count} รายการ</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-800">{formatCurrency(item.total)}</p>
                    <p className="text-[11px] font-semibold text-slate-500">
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
  );
};
