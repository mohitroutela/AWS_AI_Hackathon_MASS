import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Play,
  Database,
  FileWarning,
  ChevronRight,
} from 'lucide-react';

const predefinedQueries = [
  { id: 1, name: 'Missing required fields', rule: 'sales_transactions.amount IS NULL OR sales_transactions.product_id IS NULL', runsOn: 'Deviation detected', lastRun: '2 min ago', status: 'active' },
  { id: 2, name: 'Duplicate transaction IDs', rule: 'COUNT(transaction_id) > 1 GROUP BY transaction_id', runsOn: 'Daily 00:00', lastRun: 'Today 00:00', status: 'active' },
  { id: 3, name: 'Out-of-range dates', rule: 'sale_date > CURRENT_DATE OR sale_date < \'2020-01-01\'', runsOn: 'On ingest', lastRun: 'Just now', status: 'active' },
  { id: 4, name: 'Invalid category codes', rule: 'category_id NOT IN (SELECT id FROM categories)', runsOn: 'On ingest', lastRun: '5 min ago', status: 'active' },
];

const raisedQueries = [
  { id: 101, queryName: 'Missing required fields', source: 'sales_transactions', deviation: '127 rows with NULL amount or product_id', severity: 'high', raisedAt: '2 min ago', status: 'open' },
  { id: 102, queryName: 'Out-of-range dates', source: 'inventory_snapshots', deviation: '3 rows with future snapshot_date', severity: 'medium', raisedAt: '15 min ago', status: 'open' },
  { id: 103, queryName: 'Invalid category codes', source: 'products', deviation: '8 rows with orphan category_id', severity: 'medium', raisedAt: '1 hour ago', status: 'resolved' },
  { id: 104, queryName: 'Duplicate transaction IDs', source: 'sales_transactions', deviation: '2 duplicate transaction_id groups', severity: 'low', raisedAt: 'Yesterday', status: 'open' },
];

const severityStyles: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function DataQuality() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('open');

  const filteredRaised = filterStatus === 'all'
    ? raisedQueries
    : raisedQueries.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Quality</h1>
          <p className="text-slate-500 text-sm mt-1">
            When data has deviations, predefined queries run automatically. Resolve raised data queries here.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            Run All Checks
          </button>
          <button className="px-4 py-2 bg-[#5B5FEF] text-white rounded-lg text-sm font-medium shadow-md hover:bg-[#4a4ecf] transition-colors">
            Add Query Rule
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#5B5FEF]/10">
              <Database className="w-5 h-5 text-[#5B5FEF]" />
            </div>
            <span className="text-sm font-medium text-slate-500">Predefined queries</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">4</p>
          <p className="text-xs text-slate-400 mt-1">Run on deviation / schedule</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <FileWarning className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Raised (open)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">3</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting resolution</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">1</p>
          <p className="text-xs text-slate-400 mt-1">This period</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-slate-100">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Data health</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">94%</p>
          <p className="text-xs text-slate-400 mt-1">Score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predefined queries (run on deviation) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Play className="w-5 h-5 text-slate-400" />
              Predefined queries
            </h3>
            <span className="text-xs text-slate-500">Run when deviation is detected or on schedule</span>
          </div>
          <div className="divide-y divide-slate-50">
            {predefinedQueries.map((q) => (
              <div
                key={q.id}
                className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{q.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate max-w-full" title={q.rule}>
                    {q.rule}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>Runs: {q.runsOn}</span>
                    <span>•</span>
                    <span>Last run: {q.lastRun}</span>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {q.status}
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
            <button className="text-sm text-[#5B5FEF] font-medium hover:underline flex items-center gap-1">
              Manage rules
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Raised data queries to resolve */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Raised data queries
            </h3>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {(['open', 'resolved', 'all'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
                    ${filterStatus === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {filteredRaised.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 text-sm">
                No raised queries for this filter.
              </div>
            ) : (
              filteredRaised.map((r) => (
                <div
                  key={r.id}
                  className="px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{r.queryName}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{r.deviation}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-slate-400">{r.source}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{r.raisedAt}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full border ${severityStyles[r.severity]}`}
                      >
                        {r.severity}
                      </span>
                      {r.status === 'open' ? (
                        <button className="text-xs font-medium text-[#5B5FEF] hover:underline">
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Resolving a query marks the deviation as handled. You can fix data at source or accept the exception.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          How data quality works
        </h3>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center text-xs font-bold">1</span>
            <span><strong>Deviation detected</strong> — On ingest or schedule, data is checked against your predefined rules.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center text-xs font-bold">2</span>
            <span><strong>Predefined queries run</strong> — Matching rules execute and flag rows/sources that violate the rule.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center text-xs font-bold">3</span>
            <span><strong>Raised data queries</strong> — Each finding becomes a raised query for you to review and resolve (fix at source or accept).</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
