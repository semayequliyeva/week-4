'use client';

import React, { useState } from 'react';
import BarChart from '@/components/BarChart';
import DataTable from '@/components/DataTable';
import FilterDashboard from '@/components/FilterDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'chart'>('dashboard');

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4">
      {/* Keçid Tab-ları */}
      <div className="mx-auto max-w-5xl mb-6 flex justify-center">
        <div className="inline-flex rounded-lg bg-slate-200 p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Multi-Filter Live Dashboard
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Table & Aggregates
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'chart'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SVG Bar Chart
          </button>
        </div>
      </div>

      {/* Seçilmiş Komponent */}
      {activeTab === 'dashboard' && <FilterDashboard />}
      {activeTab === 'table' && <DataTable />}
      {activeTab === 'chart' && <BarChart />}
    </main>
  );
}