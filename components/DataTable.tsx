'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { SALES_DATA, SaleItem, CATEGORIES, REGIONS } from '@/lib/data';

type GroupByField = 'category' | 'region' | 'none';
type AggregateMode = 'sum' | 'avg' | 'both';
type SortField = 'date' | 'category' | 'region' | 'amount' | 'quantity';
type SortOrder = 'asc' | 'desc';

interface GroupAggregate {
  key: string;
  rows: SaleItem[];
  totalAmount: number;
  avgAmount: number;
  totalQuantity: number;
  count: number;
}

export default function DataTable() {
  // Kontrol ve Süzgəc State-ləri
  const [groupBy, setGroupBy] = useState<GroupByField>('category');
  const [aggregateMode, setAggregateMode] = useState<AggregateMode>('both');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Çeşidləmə State-i
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // İnteraktivlik State-ləri
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Electronics', 'Apparel', 'Furniture', 'North', 'South', 'East', 'West']));
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showAggregateRows, setShowAggregateRows] = useState<boolean>(true);

  // 1. Süzgəcdən keçirilmiş məlumat (Filtering)
  const filteredSales = useMemo(() => {
    return SALES_DATA.filter((item) => {
      const matchesSearch =
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesReg = selectedRegion === 'All' || item.region === selectedRegion;
      return matchesSearch && matchesCat && matchesReg;
    });
  }, [searchTerm, selectedCategory, selectedRegion]);

  // 2. Alt sətirlərin çeşidlənməsi (Sorting rows)
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let comp = 0;
      if (sortField === 'amount' || sortField === 'quantity') {
        comp = a[sortField] - b[sortField];
      } else {
        comp = String(a[sortField]).localeCompare(String(b[sortField]));
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredSales, sortField, sortOrder]);

  // Yardımçı aqreqasiya funksiyası (Birbaşa əsas sətirlərdən hesablayır)
  const calculateAggregate = useCallback((rows: SaleItem[]) => {
    const count = rows.length;
    const totalAmount = rows.reduce((acc, r) => acc + r.amount, 0);
    const totalQuantity = rows.reduce((acc, r) => acc + r.quantity, 0);
    const avgAmount = count > 0 ? totalAmount / count : 0;
    return { count, totalAmount, totalQuantity, avgAmount };
  }, []);

  // 3. Map vasitəsilə Qruplaşdırma və Aqreqasiya (Memoized Group Tree)
  const groups = useMemo<GroupAggregate[]>(() => {
    if (groupBy === 'none') {
      return [
        {
          key: 'All Records',
          rows: sortedSales,
          ...calculateAggregate(sortedSales),
        },
      ];
    }

    // Map sətirlərin ardıcıllığını qoruyur
    const groupMap = new Map<string, SaleItem[]>();
    for (const row of sortedSales) {
      const groupKey = String(row[groupBy] ?? 'Unknown');
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(row);
    }

    const result: GroupAggregate[] = [];
    groupMap.forEach((rows, key) => {
      result.push({
        key,
        rows,
        ...calculateAggregate(rows),
      });
    });

    // Qrupların özləri üzrə çeşidlənməsi
    result.sort((a, b) => {
      let comp = 0;
      if (sortField === 'amount') {
        comp = a.totalAmount - b.totalAmount;
      } else if (sortField === 'quantity') {
        comp = a.totalQuantity - b.totalQuantity;
      } else {
        comp = a.key.localeCompare(b.key);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [sortedSales, groupBy, calculateAggregate, sortField, sortOrder]);

  // 4. Yekun Cəm (Grand Total) - Qrup ortalamalarından DEYİL, birbaşa alt sətirlərdən hesablanır
  const grandTotal = useMemo(() => {
    return calculateAggregate(filteredSales);
  }, [filteredSales, calculateAggregate]);

  // Group Expand / Collapse İdarəçiliyi
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(groups.map((g) => g.key)));
  const collapseAll = () => setExpandedGroups(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-800">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Interactive Grouped Data Table</h2>
        <p className="text-xs text-slate-500">
          Advanced multi-group table with custom aggregation, keyboard accessibility, and state persistence.
        </p>
      </div>

      {/* Kontrol Paneli */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Group By</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByField)}
            className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:outline-none"
          >
            <option value="category">Category</option>
            <option value="region">Region</option>
            <option value="none">None (Flat)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Metrics Display</label>
          <select
            value={aggregateMode}
            onChange={(e) => setAggregateMode(e.target.value as AggregateMode)}
            className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:outline-none"
          >
            <option value="both">Sum & Average</option>
            <option value="sum">Sum Only</option>
            <option value="avg">Average Only</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Category Filter</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Search</label>
          <input
            type="text"
            placeholder="Search category, region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Idareetme Düymələri */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex gap-2">
          {groupBy !== 'none' && (
            <>
              <button
                onClick={expandAll}
                className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 font-medium hover:bg-slate-200"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 font-medium hover:bg-slate-200"
              >
                Collapse All
              </button>
            </>
          )}
          <button
            onClick={() => setShowAggregateRows(!showAggregateRows)}
            className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 font-medium hover:bg-slate-200"
          >
            {showAggregateRows ? 'Hide Group Summary' : 'Show Group Summary'}
          </button>
        </div>

        <div className="text-slate-500 font-medium">
          Showing {filteredSales.length} items across {groups.length} group(s)
        </div>
      </div>

      {/* Semantic Flat Table */}
      <div className="max-h-[500px] overflow-auto rounded-lg border border-slate-200 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold shadow-sm">
            <tr>
              <th className="p-3">
                <button onClick={() => handleSort('category')} className="font-semibold hover:underline">
                  Group / Category {sortField === 'category' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort('region')} className="font-semibold hover:underline">
                  Region {sortField === 'region' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort('date')} className="font-semibold hover:underline">
                  Date {sortField === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 text-right">
                <button onClick={() => handleSort('quantity')} className="font-semibold hover:underline">
                  Qty {sortField === 'quantity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 text-right">
                <button onClick={() => handleSort('amount')} className="font-semibold hover:underline">
                  Amount {sortField === 'amount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
            </tr>
          </thead>

          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.key) || groupBy === 'none';

            return (
              /* Hər qrup öz semantic <tbody> daxilindədir */
              <tbody key={group.key} className="divide-y divide-slate-100 border-b border-slate-200">
                {/* Qrup Başlıq Sətri */}
                {groupBy !== 'none' && (
                  <tr className="bg-slate-100/80 font-bold text-slate-800">
                    <td colSpan={3} className="p-3">
                      <button
                        onClick={() => toggleGroup(group.key)}
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-2 text-left focus:outline-none hover:text-blue-600"
                      >
                        <span className="text-base font-mono w-4">{isExpanded ? '▼' : '►'}</span>
                        <span>{group.key}</span>
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-normal text-slate-600">
                          {group.count} {group.count === 1 ? 'item' : 'items'}
                        </span>
                      </button>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {aggregateMode !== 'avg' && `Qty: ${group.totalQuantity}`}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900">
                      {aggregateMode !== 'avg' && <div>Total: ${group.totalAmount}</div>}
                      {aggregateMode !== 'sum' && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          Avg: ${group.avgAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                  </tr>
                )}

                {/* Alt Sətirlər (Expanded olduqda) */}
                {isExpanded &&
                  group.rows.map((row) => {
                    const isSelected = selectedRowId === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id)}
                        className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${
                          isSelected ? 'bg-blue-100/70 font-medium' : 'bg-white'
                        }`}
                      >
                        <td className="p-3 pl-8">{row.category}</td>
                        <td className="p-3">{row.region}</td>
                        <td className="p-3 text-slate-500">{row.date}</td>
                        <td className="p-3 text-right font-mono">{row.quantity}</td>
                        <td className="p-3 text-right font-mono font-medium">${row.amount}</td>
                      </tr>
                    );
                  })}

                {/* Qrup Yekun Xülasə Sətri (Group Aggregate Row) */}
                {groupBy !== 'none' && isExpanded && showAggregateRows && (
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 italic">
                    <td colSpan={3} className="p-2 pl-8">
                      Subtotal for {group.key} ({group.count} rows)
                    </td>
                    <td className="p-2 text-right font-mono">{group.totalQuantity} pcs</td>
                    <td className="p-2 text-right font-mono">
                      {aggregateMode !== 'avg' && <span>Sum: ${group.totalAmount}</span>}
                      {aggregateMode === 'both' && <span className="mx-1">|</span>}
                      {aggregateMode !== 'sum' && <span>Avg: ${group.avgAmount.toFixed(2)}</span>}
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}

          {/* Yekun Cəm (Grand Total Footer) */}
          <tfoot className="sticky bottom-0 z-10 bg-slate-900 font-bold text-white shadow-md">
            <tr>
              <td colSpan={3} className="p-3 text-sm">
                Grand Total ({grandTotal.count} items)
              </td>
              <td className="p-3 text-right font-mono">{grandTotal.totalQuantity}</td>
              <td className="p-3 text-right font-mono">
                {aggregateMode !== 'avg' && <div>${grandTotal.totalAmount}</div>}
                {aggregateMode !== 'sum' && (
                  <div className="text-[10px] text-slate-300 font-normal">
                    Overall Avg: ${grandTotal.avgAmount.toFixed(2)}
                  </div>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}