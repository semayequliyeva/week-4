'use client';

import React, { useReducer, useMemo, useState, useEffect } from 'react';
import { SALES_DATA, SaleItem, ALL_CATEGORIES, ALL_REGIONS } from '@/lib/data';

// 1. Reducer State və Action Tərifləri
interface FilterState {
  search: string;
  categories: string[];
  regions: string[];
  minAmount: number;
  maxAmount: number;
  inStockOnly: boolean;
}

type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'TOGGLE_REGION'; payload: string }
  | { type: 'SET_MIN_AMOUNT'; payload: number }
  | { type: 'SET_MAX_AMOUNT'; payload: number }
  | { type: 'SET_IN_STOCK'; payload: boolean }
  | { type: 'REMOVE_CATEGORY'; payload: string }
  | { type: 'REMOVE_REGION'; payload: string }
  | { type: 'RESET_ALL' };

const initialFilters: FilterState = {
  search: '',
  categories: [],
  regions: [],
  minAmount: 0,
  maxAmount: 3000,
  inStockOnly: false,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'TOGGLE_CATEGORY': {
      const exists = state.categories.includes(action.payload);
      const categories = exists
        ? state.categories.filter((c) => c !== action.payload)
        : [...state.categories, action.payload];
      return { ...state, categories };
    }
    case 'TOGGLE_REGION': {
      const exists = state.regions.includes(action.payload);
      const regions = exists
        ? state.regions.filter((r) => r !== action.payload)
        : [...state.regions, action.payload];
      return { ...state, regions };
    }
    case 'SET_MIN_AMOUNT':
      return { ...state, minAmount: action.payload };
    case 'SET_MAX_AMOUNT':
      return { ...state, maxAmount: action.payload };
    case 'SET_IN_STOCK':
      return { ...state, inStockOnly: action.payload };
    case 'REMOVE_CATEGORY':
      return { ...state, categories: state.categories.filter((c) => c !== action.payload) };
    case 'REMOVE_REGION':
      return { ...state, regions: state.regions.filter((r) => r !== action.payload) };
    case 'RESET_ALL':
      return initialFilters;
    default:
      return state;
  }
}

export default function FilterDashboard() {
  // LocalStorage ilə sinxronlaşdırılan Reducer state-i
  const [filters, dispatch] = useReducer(filterReducer, initialFilters, (initial) => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = localStorage.getItem('dashboard_filters_v1');
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });

  // LocalStorage-ə yazmaq
  useEffect(() => {
    try {
      localStorage.setItem('dashboard_filters_v1', JSON.stringify(filters));
    } catch (err) {
      console.error('Failed to save filters to localStorage', err);
    }
  }, [filters]);

  // Axtarış üçün Debounce Mexanizmi (Yalnız mətni debounce edirik)
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch({ type: 'SET_SEARCH', payload: searchInput });
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Birbaşa məlumat üzərində filtrləmə (AND across fields, OR inside multi-select)
  const filteredRows = useMemo(() => {
    return SALES_DATA.filter((item) => {
      // Mətn axtarışı
      const matchSearch =
        filters.search === '' ||
        item.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.region.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.id.toLowerCase().includes(filters.search.toLowerCase());

      // Kateqoriyalar (OR məntiqi)
      const matchCategory =
        filters.categories.length === 0 || filters.categories.includes(item.category);

      // Regionlar (OR məntiqi)
      const matchRegion =
        filters.regions.length === 0 || filters.regions.includes(item.region);

      // Məbləğ aralığı
      const matchAmount = item.amount >= filters.minAmount && item.amount <= filters.maxAmount;

      // Stok vəziyyəti
      const matchStock = !filters.inStockOnly || item.inStock;

      // Qruplar arası AND məntiqi
      return matchSearch && matchCategory && matchRegion && matchAmount && matchStock;
    });
  }, [filters]);

  // 3. Yalnız filterlənmiş məlumat üzərindən Canlı Xülasə (Live Summary Panel)
  const summaryMetrics = useMemo(() => {
    const totalCount = filteredRows.length;
    if (totalCount === 0) {
      return { totalCount: 0, sumAmount: 0, avgAmount: 0, minAmount: 0, maxAmount: 0, totalQty: 0 };
    }

    const sumAmount = filteredRows.reduce((acc, row) => acc + row.amount, 0);
    const totalQty = filteredRows.reduce((acc, row) => acc + row.quantity, 0);
    const amounts = filteredRows.map((r) => r.amount);

    return {
      totalCount,
      sumAmount,
      avgAmount: sumAmount / totalCount,
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
      totalQty,
    };
  }, [filteredRows]);

  // Aktiv filter çiplərinin olub-olmadığını yoxlamaq
  const hasActiveFilters =
    filters.search !== '' ||
    filters.categories.length > 0 ||
    filters.regions.length > 0 ||
    filters.minAmount > 0 ||
    filters.maxAmount < 3000 ||
    filters.inStockOnly;

  return (
    <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-800">
      {/* Əlçatanlıq üçün Gizli Ekran Oxuyucu Bildirişi */}
      <div className="sr-only" aria-live="polite">
        {`Filtered metrics updated. ${summaryMetrics.totalCount} items matching active filters.`}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Multi-Filter Live Dashboard</h2>
          <p className="text-xs text-slate-500">
            Real-time client-side aggregation with debounced text input and strict state isolation.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchInput('');
              dispatch({ type: 'RESET_ALL' });
            }}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* 1. CANLI XÜLASƏ PANALİ (Live Summary Panel) */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Total Items
          </span>
          <span className="text-xl font-bold text-slate-900">{summaryMetrics.totalCount}</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Total Sales
          </span>
          <span className="text-xl font-bold text-emerald-600">${summaryMetrics.sumAmount}</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Avg Price
          </span>
          <span className="text-xl font-bold text-blue-600">
            ${summaryMetrics.avgAmount.toFixed(1)}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Min / Max
          </span>
          <span className="text-sm font-bold text-slate-700">
            ${summaryMetrics.minAmount} -${summaryMetrics.maxAmount}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Total Units
          </span>
          <span className="text-xl font-bold text-purple-600">{summaryMetrics.totalQty}</span>
        </div>
      </div>

      {/* 2. AKTİV FİLTER ÇİPLƏRİ (Active Filter Chips) */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs">
          <span className="font-semibold text-slate-500">Active Filters:</span>

          {filters.search && (
            <button
              onClick={() => {
                setSearchInput('');
                dispatch({ type: 'SET_SEARCH', payload: '' });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800 hover:bg-blue-200"
              aria-label={`Remove search filter: ${filters.search}`}
            >
              Search: "{filters.search}" ✕
            </button>
          )}

          {filters.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => dispatch({ type: 'REMOVE_CATEGORY', payload: cat })}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-800 hover:bg-emerald-200"
              aria-label={`Remove category filter ${cat}`}
            >
              Category: {cat} ✕
            </button>
          ))}

          {filters.regions.map((reg) => (
            <button
              key={reg}
              onClick={() => dispatch({ type: 'REMOVE_REGION', payload: reg })}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 font-medium text-purple-800 hover:bg-purple-200"
              aria-label={`Remove region filter ${reg}`}
            >
              Region: {reg} ✕
            </button>
          ))}

          {(filters.minAmount > 0 || filters.maxAmount < 3000) && (
            <button
              onClick={() => {
                dispatch({ type: 'SET_MIN_AMOUNT', payload: 0 });
                dispatch({ type: 'SET_MAX_AMOUNT', payload: 3000 });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800 hover:bg-amber-200"
            >
              Amount: ${filters.minAmount} -${filters.maxAmount} ✕
            </button>
          )}

          {filters.inStockOnly && (
            <button
              onClick={() => dispatch({ type: 'SET_IN_STOCK', payload: false })}
              className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-800 hover:bg-slate-300"
            >
              In-Stock Only ✕
            </button>
          )}
        </div>
      )}

      {/* 3. MULTİ-FİLTER İDARƏETMƏ PANALİ (Multi-Filter Controls) */}
      <div className="mb-6 grid grid-cols-1 gap-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-4">
        {/* Debounced Search Input */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Search</label>
          <input
            type="text"
            placeholder="Type category or region..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:outline-none"
          />
        </div>

        {/* Multi-Select Category Checkboxes (OR logic) */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Categories (OR)</label>
          <div className="space-y-1">
            {ALL_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat)}
                  onChange={() => dispatch({ type: 'TOGGLE_CATEGORY', payload: cat })}
                  className="rounded border-slate-300 accent-blue-600"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Multi-Select Region Checkboxes (OR logic) */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Regions (OR)</label>
          <div className="space-y-1">
            {ALL_REGIONS.map((reg) => (
              <label key={reg} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.regions.includes(reg)}
                  onChange={() => dispatch({ type: 'TOGGLE_REGION', payload: reg })}
                  className="rounded border-slate-300 accent-blue-600"
                />
                {reg}
              </label>
            ))}
          </div>
        </div>

        {/* Sliders & Stock Toggle */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Max Amount: ${filters.maxAmount}
            </label>
            <input
              type="range"
              min={500}
              max={3000}
              step={100}
              value={filters.maxAmount}
              onChange={(e) => dispatch({ type: 'SET_MAX_AMOUNT', payload: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => dispatch({ type: 'SET_IN_STOCK', payload: e.target.checked })}
              className="rounded border-slate-300 accent-blue-600"
            />
            In Stock Only
          </label>
        </div>
      </div>

      {/* 4. VERİLƏNLƏRİN SİYAHI/CƏDVƏL GÖRÜNÜŞÜ (Data Set Table) */}
      <div className="overflow-hidden rounded-lg border border-slate-200">
        {SALES_DATA.length === 0 ? (
          // Boş vəziyyət 1: Bazada ümumiyyətlə məlumat yoxdur
          <div className="p-8 text-center text-xs text-slate-400">
            No sales data available in database.
          </div>
        ) : filteredRows.length === 0 ? (
          // Boş vəziyyət 2: Filterlərə uyğun nəticə tapılmadı
          <div className="p-8 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-2">No records match your active filters.</p>
            <button
              onClick={() => {
                setSearchInput('');
                dispatch({ type: 'RESET_ALL' });
              }}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Clear Filters to See All Data
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">Region</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono text-slate-400">{item.id}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.category}</td>
                  <td className="p-3">{item.region}</td>
                  <td className="p-3 text-slate-500">{item.date}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">{item.quantity}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}