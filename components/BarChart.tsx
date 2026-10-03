'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { SALES_DATA, CATEGORIES, REGIONS } from '@/lib/data';

interface ChartBarData {
  label: string;
  total: number;
  count: number;
}

export default function BarChart() {
  // Filter ve UI modlari ucun state-ler
  const [category, setCategory] = useState<string>('All');
  const [region, setRegion] = useState<string>('All');
  const [minAmount, setMinAmount] = useState<number>(0);

  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [tableView, setTableView] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // 1. Filterlenmis xam melumat
  const filteredSales = useMemo(() => {
    return SALES_DATA.filter((item) => {
      const matchCat = category === 'All' || item.category === category;
      const matchReg = region === 'All' || item.region === region;
      const matchMin = item.amount >= minAmount;
      return matchCat && matchReg && matchMin;
    });
  }, [category, region, minAmount]);

  // 2. Render-den qabaq agreqasiya (recomputing group totals on render)
  const chartData = useMemo<ChartBarData[]>(() => {
    const map: Record<string, { total: number; count: number }> = {};

    filteredSales.forEach((item) => {
      const groupKey = category === 'All' ? item.category : item.region;
      if (!map[groupKey]) {
        map[groupKey] = { total: 0, count: 0 };
      }
      map[groupKey].total += item.amount;
      map[groupKey].count += 1;
    });

    return Object.entries(map).map(([label, val]) => ({
      label,
      total: val.total,
      count: val.count,
    }));
  }, [filteredSales, category]);

  // 3. SVG olculeri ve scale riyaziyyati
  const width = 720;
  const height = 360;
  const padding = 55;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  // Massiv bos olarsa Infinity ve NaN olmasin deye guard
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map((d) => d.total));
    return max > 0 ? max : 100;
  }, [chartData]);

  // CSV faylini brauzerde Blob ile yaradib yuklemek
  const exportCSV = useCallback(() => {
    if (filteredSales.length === 0) return;

    const headers = ['ID', 'Date', 'Category', 'Region', 'Amount'];
    const rows = filteredSales.map((s) => [s.id, s.date, s.category, s.region, s.amount]);
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredSales]);

  return (
    <div
      className={`mx-auto max-w-4xl rounded-xl p-6 transition-colors shadow-sm ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800 border border-slate-200'
      }`}
    >
      {/* Ust header hisse */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/20 pb-4">
        <div>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Sales Analytics
          </h2>
          <p className="text-xs text-slate-500">Pure SVG dynamic chart with interactive controls</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold border transition ${
              darkMode
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            {darkMode ? 'Light Theme' : 'Dark Theme'}
          </button>

          <button
            onClick={exportCSV}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter idareetme paneli */}
      <div
        className={`mb-6 grid grid-cols-1 gap-4 rounded-lg border p-4 ${
          darkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50'
        } md:grid-cols-3`}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full rounded border p-2 text-xs focus:outline-none ${
              darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
            }`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={`w-full rounded border p-2 text-xs focus:outline-none ${
              darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
            }`}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Min Sales ($): {minAmount}
          </label>
          <input
            type="range"
            min={0}
            max={2000}
            step={100}
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
        </div>
      </div>

      {/* Rejim Deyisdirici (Chart vs Accessible Table) */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          Showing {chartData.length} groups ({filteredSales.length} items)
        </span>

        <button
          onClick={() => setTableView(!tableView)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {tableView ? 'Switch to Chart View' : 'Switch to Accessible Table'}
        </button>
      </div>

      {/* SVG Chart Render */}
      {!tableView ? (
        <div
          className={`relative rounded-lg border p-4 ${
            darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          {chartData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-xs text-slate-400">
              No sales match the active filters.
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto overflow-visible"
              role="img"
              aria-label="Sales Data Bar Chart"
            >
              <title>Sales Data Bar Chart</title>

              {/* Y-oxu grid xetleri (0 daxil olmaqla) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const val = Math.round(maxValue * ratio);
                // Inverted Y positioning: SVG Y oxu asagiya dogru artir
                const y = padding + innerH - ratio * innerH;

                return (
                  <g key={ratio}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={padding + innerW}
                      y2={y}
                      stroke={darkMode ? '#334155' : '#e2e8f0'}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding - 10}
                      y={y + 4}
                      textAnchor="end"
                      className={`text-[10px] font-mono ${
                        darkMode ? 'fill-slate-400' : 'fill-slate-500'
                      }`}
                    >
                      ${val}
                    </text>
                  </g>
                );
              })}

              {/* Bar-larin cekilmasi */}
              {chartData.map((bar, i) => {
                const slotWidth = innerW / chartData.length;
                const barW = Math.min(slotWidth * 0.5, 50);
                const x = padding + i * slotWidth + (slotWidth - barW) / 2;

                // Y oxunun hesablanmasi (y = innerH - (v / max) * innerH + padding)
                const barH = (bar.total / maxValue) * innerH;
                const y = padding + innerH - barH;

                const isHovered = activeBarIndex === i;

                return (
                  <g
                    key={bar.label}
                    tabIndex={0}
                    onMouseEnter={() => setActiveBarIndex(i)}
                    onMouseLeave={() => setActiveBarIndex(null)}
                    onFocus={() => setActiveBarIndex(i)}
                    onBlur={() => setActiveBarIndex(null)}
                    className="cursor-pointer focus:outline-none"
                    aria-label={`${bar.label}: $${bar.total} (${bar.count} sales)`}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={3}
                      className={`transition-all duration-200 ${
                        isHovered ? 'fill-blue-600' : darkMode ? 'fill-slate-200' : 'fill-slate-800'
                      }`}
                    />

                    {/* X-oxu etiketleri */}
                    <text
                      x={x + barW / 2}
                      y={padding + innerH + 20}
                      textAnchor="middle"
                      className={`text-[11px] font-medium ${
                        darkMode ? 'fill-slate-300' : 'fill-slate-700'
                      }`}
                    >
                      {bar.label}
                    </text>

                    {/* Keyboard ve Hover Tooltip-i */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x + barW / 2 - 50}
                          y={y - 42}
                          width={100}
                          height={34}
                          rx={4}
                          className="fill-slate-900 opacity-90"
                        />
                        <text
                          x={x + barW / 2}
                          y={y - 26}
                          textAnchor="middle"
                          className="fill-white text-[10px] font-bold"
                        >
                          ${bar.total}
                        </text>
                        <text
                          x={x + barW / 2}
                          y={y - 14}
                          textAnchor="middle"
                          className="fill-slate-300 text-[9px]"
                        >
                          {bar.count} orders
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      ) : (
        /* Accessible Data Table */
        <div
          className={`overflow-x-auto rounded-lg border ${
            darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b text-[10px] uppercase ${
                  darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                <th className="p-3">Label</th>
                <th className="p-3">Count</th>
                <th className="p-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {chartData.map((d) => (
                <tr key={d.label}>
                  <td className="p-3 font-semibold">{d.label}</td>
                  <td className="p-3">{d.count}</td>
                  <td className="p-3 text-right font-mono font-bold">${d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}