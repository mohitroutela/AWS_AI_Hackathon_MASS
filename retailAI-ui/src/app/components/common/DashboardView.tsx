import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCw,
  Edit3,
  Save,
  X,
  Trash2,
  GripVertical,
  Pencil,
  Check
} from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { loadDashboard, DASHBOARD_IDS, removeWidgetFromDashboard, reorderDashboardWidgets } from '../../services/dashboard.service';
import type { Visualization } from '../../types/visualization.types';
import { toast } from 'sonner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Activity
};

export interface DashboardViewProps {
  defaultDashboardId: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

export function DashboardView({
  defaultDashboardId,
  defaultTitle = 'Dashboard Overview',
  defaultDescription = 'Real-time insights for your retail performance.'
}: DashboardViewProps) {
  const [dashboardRows, setDashboardRows] = useState<Visualization[][]>([]);
  const [dashboardName, setDashboardName] = useState<string>(defaultTitle);
  const [dashboardDescription, setDashboardDescription] = useState<string>(defaultDescription);
  const [activeDashboardId, setActiveDashboardId] = useState<string | undefined>(defaultDashboardId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardMetadata, setDashboardMetadata] = useState<any>(null);
  const [widgetOrder, setWidgetOrder] = useState<any[]>([]);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    loadDashboardData(activeDashboardId);
  }, [activeDashboardId]);

  const loadDashboardData = async (dashboardId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await loadDashboard(dashboardId);
      setDashboardRows(result.rows);
      setDashboardName(result.metadata.dashboardName);
      setDashboardDescription(result.metadata.description || defaultDescription);
      setDashboardMetadata(result.metadata);
      setWidgetOrder(result.metadata.widgets || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData(activeDashboardId);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleRemoveWidget = async (widgetId: string) => {
    if (!activeDashboardId) return;
    
    try {
      await removeWidgetFromDashboard(activeDashboardId, widgetId);
      toast.success('Widget removed successfully');
      await loadDashboardData(activeDashboardId);
    } catch (error) {
      console.error('Failed to remove widget:', error);
      toast.error('Failed to remove widget');
    }
  };

  const handleMoveWidgetUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...widgetOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setWidgetOrder(newOrder);
  };

  const handleMoveWidgetDown = (index: number) => {
    if (index === widgetOrder.length - 1) return;
    const newOrder = [...widgetOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setWidgetOrder(newOrder);
  };

  const handleSaveOrder = async () => {
    if (!activeDashboardId) return;
    
    try {
      // Update positions
      const updatedWidgets = widgetOrder.map((widget, index) => ({
        ...widget,
        position: index
      }));
      
      await reorderDashboardWidgets(activeDashboardId, updatedWidgets);
      
      // Check if any titles were changed
      const originalWidgets = dashboardMetadata?.widgets || [];
      const titlesChanged = updatedWidgets.some((widget, index) => {
        const original = originalWidgets.find((w: any) => w.widgetId === widget.widgetId);
        return original && original.title !== widget.title;
      });
      
      // Check if order was changed
      const orderChanged = updatedWidgets.some((widget, index) => {
        const original = originalWidgets.find((w: any) => w.widgetId === widget.widgetId);
        return original && original.position !== widget.position;
      });
      
      // Show appropriate message
      if (titlesChanged && orderChanged) {
        toast.success('Dashboard updated successfully');
      } else if (titlesChanged) {
        toast.success('Widget titles updated successfully');
      } else if (orderChanged) {
        toast.success('Widget order updated successfully');
      } else {
        toast.success('Dashboard saved successfully');
      }
      
      setIsEditMode(false);
      await loadDashboardData(activeDashboardId);
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingWidgetId(null);
    setEditingTitle('');
    // Reset to original order
    if (dashboardMetadata) {
      setWidgetOrder(dashboardMetadata.widgets || []);
    }
  };

  const handleStartEditTitle = (widgetId: string, currentTitle: string) => {
    setEditingWidgetId(widgetId);
    setEditingTitle(currentTitle || '');
  };

  const handleSaveTitle = (widgetId: string) => {
    const newOrder = widgetOrder.map(widget => 
      widget.widgetId === widgetId 
        ? { ...widget, title: editingTitle }
        : widget
    );
    setWidgetOrder(newOrder);
    setEditingWidgetId(null);
    setEditingTitle('');
  };

  const handleCancelEditTitle = () => {
    setEditingWidgetId(null);
    setEditingTitle('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData(activeDashboardId)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{dashboardName}</h1>
          <p className="text-slate-500 text-sm mt-1">{dashboardDescription}</p>
        </div>
        <div className="flex gap-3 items-center">
          {!isEditMode ? (
            <>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={handleToggleEditMode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Dashboard
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button 
                onClick={handleSaveOrder}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-1">Edit Mode Active</h3>
              <p className="text-sm text-indigo-700">
                Click the pencil icon to edit widget titles, use arrow buttons to reorder, or click the trash icon to remove widgets. Click "Save Changes" when done.
              </p>
            </div>
          </div>
        </div>
      )}

      {isEditMode ? (
        <div className="space-y-4">
          {widgetOrder.map((widget, index) => (
            <div 
              key={widget.widgetId}
              className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    {editingWidgetId === widget.widgetId ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                          placeholder="Enter widget title"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(widget.widgetId);
                            if (e.key === 'Escape') handleCancelEditTitle();
                          }}
                        />
                        <button
                          onClick={() => handleSaveTitle(widget.widgetId)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          title="Save title"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEditTitle}
                          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{widget.title || 'Untitled Widget'}</h4>
                          <p className="text-sm text-slate-500">
                            Type: {widget.widgetType} {widget.widgetChartType && `(${widget.widgetChartType})`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartEditTitle(widget.widgetId, widget.title)}
                          className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600"
                          title="Edit title"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMoveWidgetUp(index)}
                    disabled={index === 0}
                    className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleMoveWidgetDown(index)}
                    disabled={index === widgetOrder.length - 1}
                    className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleRemoveWidget(widget.widgetId)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                    title="Remove widget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {dashboardRows.map((rowVizs, rowIdx) => {
        const colCount = rowVizs.length;
        const gridStyle: React.CSSProperties = {
          gridTemplateColumns:
            colCount === 1 ? '1fr' : `repeat(${colCount}, minmax(0, 1fr))`,
        };
        return (
          <div key={rowIdx} className="grid gap-6" style={gridStyle}>
            {rowVizs.map((viz, vizIdx) => (
              <div key={vizIdx} className="min-w-0">
                {viz.type === 'summaryCard' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {viz.data.map((card, cardIdx) => {
                      const Icon = card.icon ? iconMap[card.icon] || Package : Package;
                      const colorMap: Record<string, string> = {
                        DollarSign: 'bg-[#5B5FEF]/10 text-[#5B5FEF]',
                        Package: 'bg-emerald-50 text-emerald-600',
                        Percent: 'bg-amber-50 text-amber-600',
                        ShoppingCart: 'bg-sky-50 text-sky-600'
                      };
                      const color = card.icon ? colorMap[card.icon] || 'bg-slate-50 text-slate-600' : 'bg-slate-50 text-slate-600';
                      return (
                        <KPICard
                          key={cardIdx}
                          title={card.title}
                          value={card.value}
                          change={card.change || ''}
                          isPositive={card.trend === 'up'}
                          icon={Icon}
                          color={color}
                        />
                      );
                    })}
                  </div>
                )}

                {viz.type === 'chart' && (
                  <div className="grid grid-cols-1 gap-6">
                    {viz.data.map((chartConfig, chartIdx) => (
                      <div
                        key={chartIdx}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <HighchartsReact highcharts={Highcharts} options={chartConfig} />
                      </div>
                    ))}
                  </div>
                )}

                {viz.type === 'grid' && (
                  <div className="grid grid-cols-1 gap-6">
                    {viz.data.map((gridConfig, gridIdx) => (
                      <div key={gridIdx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-slate-800">{gridConfig.title}</h3>
                          {gridConfig.title === 'Risk Alerts' && (
                            <button className="text-sm text-[#5B5FEF] font-medium hover:underline">View All</button>
                          )}
                          {gridConfig.title === 'Trending Products' && (
                            <div className="flex gap-2">
                              <button className="p-1 rounded hover:bg-slate-100"><ArrowUp className="w-4 h-4 text-slate-400" /></button>
                              <button className="p-1 rounded hover:bg-slate-100"><ArrowDown className="w-4 h-4 text-slate-400" /></button>
                            </div>
                          )}
                        </div>
                        {gridConfig.title === 'Risk Alerts' && (
                          <div className="space-y-4">
                            {gridConfig.rows.map((row, rowIdx) => (
                              <AlertItem
                                key={rowIdx}
                                title={row.title}
                                desc={row.desc}
                                severity={row.severity}
                                time={row.time}
                              />
                            ))}
                          </div>
                        )}
                        {gridConfig.title === 'Trending Products' && (
                          <div className="grid grid-cols-2 gap-4">
                            {gridConfig.rows.map((row, rowIdx) => (
                              <ProductCard
                                key={rowIdx}
                                name={row.name}
                                increase={row.increase}
                                sales={row.sales}
                                trend={row.trend}
                              />
                            ))}
                          </div>
                        )}
                        {!['Risk Alerts', 'Trending Products'].includes(gridConfig.title || '') && (
                          <GenericGridTable rows={gridConfig.rows} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
        </>
      )}
    </div>
  );
}

function KPICard({ title, value, change, isPositive, icon: Icon, color }: any) {
  const showChange = change !== undefined && change !== '';
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {showChange && (
          <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AlertItem({ title, desc, severity, time }: any) {
  const colors = {
    high: 'bg-red-50 border-l-4 border-red-500 text-red-700',
    medium: 'bg-amber-50 border-l-4 border-amber-500 text-amber-700',
    low: 'bg-blue-50 border-l-4 border-blue-500 text-blue-700',
  };
  const icons = {
    high: AlertTriangle,
    medium: Activity,
    low: TrendingUp,
  };
  const Icon = icons[severity as keyof typeof icons] || AlertTriangle;
  return (
    <div className={`p-4 rounded-r-lg ${colors[severity as keyof typeof colors]} flex gap-3`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-sm">{title}</h4>
          <span className="text-xs opacity-70">{time}</span>
        </div>
        <p className="text-xs mt-1 opacity-90">{desc}</p>
      </div>
    </div>
  );
}

function GenericGridTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows?.length) return null;
  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th key={col} className="text-left py-3 px-4 font-semibold text-slate-700 capitalize">
                {col.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col} className="py-3 px-4 text-slate-600">
                  {String(row[col] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductCard({ name, increase, sales, trend }: any) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:border-[#5B5FEF]/20 hover:bg-[#5B5FEF]/5 transition-colors group cursor-pointer">
      <div className="h-20 bg-slate-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
        <Package className="text-slate-300 w-8 h-8" />
      </div>
      <h4 className="font-bold text-sm text-slate-800 mb-1 truncate">{name}</h4>
      <div className="flex justify-between items-end">
        <p className="text-xs text-slate-500">{sales}</p>
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{increase}</span>
      </div>
    </div>
  );
}
