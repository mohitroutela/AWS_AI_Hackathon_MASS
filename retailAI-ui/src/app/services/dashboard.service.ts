/**
 * Dashboard Service
 * Loads dashboard metadata from API and widget data from local files.
 */

import type { Visualization } from '../types/visualization.types';

export interface DashboardMetadata {
  dashboardId: string;
  dashboardName: string;
  description?: string;
  layout: string;
  dashboardType?: string;
  widgets: Array<{
    widgetId: string;
    title: string;
    widgetType: string;
    widgetChartType: string | null;
    position: number;
  }>;
}

export interface WidgetDataItem {
  widgetId: string;
  data: Record<string, unknown>;
}

export interface WidgetDataResponse {
  widgets: WidgetDataItem[];
}

export interface DashboardLoadResult {
  metadata: DashboardMetadata;
  /** Visualizations grouped by position - each row contains widgets with same position */
  rows: Visualization[][];
}

// API base URL for all dashboards
const DASHBOARD_API_BASE_URL = 'https://we6jph4kv1.execute-api.us-east-1.amazonaws.com/Prod/api/dashboards';

// Environment variable override (check if import.meta.env exists)
const DASHBOARD_API_BASE = (() => {
  try {
    return (import.meta as any).env?.VITE_DASHBOARD_API_URL || '';
  } catch {
    return '';
  }
})();

/** Available dashboard IDs for switching */
export const DASHBOARD_IDS = {
  SALES: 'a7a9d941-524b-481a-ae59-6b360fc05407', // API dashboard ID
  INVENTORY: '808d6eb3-c247-46ae-a7cf-784ac4c08517', // API dashboard ID
  PRICING: '46237590-f030-4bd9-a99f-cc8a56eeaf92', // API dashboard ID
  FORECAST: '7bae30f7-28a0-4324-a740-e61ddd5d60b3', // API dashboard ID
  MARKET: 'PLACEHOLDER-MARKET-TRENDS-ID', // TODO: Replace with actual API dashboard ID
  CUSTOMER: 'PLACEHOLDER-CUSTOMER-INSIGHTS-ID', // TODO: Replace with actual API dashboard ID
} as const;

/**
 * Fetch dashboard metadata from API.
 * All dashboards now use API - no local fallback for metadata.
 */
async function fetchDashboardMetadata(dashboardId?: string): Promise<DashboardMetadata> {
  if (!dashboardId) {
    throw new Error('Dashboard ID is required');
  }

  // Use environment variable API base if configured
  if (DASHBOARD_API_BASE) {
    const url = `${DASHBOARD_API_BASE}/dashboard/${dashboardId}/metadata`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Metadata fetch failed: ${res.status}`);
    return res.json();
  }

  // Fetch from API using the dashboard ID from the route
  const apiUrl = `${DASHBOARD_API_BASE_URL}/${dashboardId}`;
  
  const res = await fetch(apiUrl, {
    headers: {
      'accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`API fetch failed: ${res.status} for dashboard ${dashboardId}`);
  }
  
  const response = await res.json();
  
  // Check if API response is successful
  if (!response.success || !response.data) {
    throw new Error(response.message || 'API returned unsuccessful response');
  }
  
  const apiData = response.data;
  
  // Transform API response to match our DashboardMetadata interface
  return {
    dashboardId: dashboardId,
    dashboardName: apiData.dashboardName || 'Dashboard',
    description: apiData.description || '',
    layout: apiData.layout || 'grid',
    dashboardType: apiData.dashboardType || 'dashboard',
    widgets: apiData.widgets || [],
  };
}

/**
 * Fetch widget data from API or local files.
 * Currently, API does not provide widget data, so we always use local files.
 */
async function fetchWidgetData(dashboardId?: string): Promise<WidgetDataResponse> {
  // Note: API endpoints currently don't provide widget data
  // Widget data is always loaded from local JSON files
  
  if (DASHBOARD_API_BASE) {
    const url = dashboardId
      ? `${DASHBOARD_API_BASE}/dashboard/${dashboardId}/widgets`
      : `${DASHBOARD_API_BASE}/dashboard/widgets`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        return res.json();
      }
    } catch (error) {
      console.warn('Widget data API not available, using local files');
    }
  }

  // Load widget data from local JSON files
  if (dashboardId === DASHBOARD_IDS.INVENTORY) {
    const mod = await import('../../../inventory_widget.json');
    return mod.default as WidgetDataResponse;
  }
  if (dashboardId === DASHBOARD_IDS.PRICING) {
    const mod = await import('../../../pricing_intelligence_widget_data.json');
    return mod.default as WidgetDataResponse;
  }
  if (dashboardId === DASHBOARD_IDS.FORECAST) {
    const mod = await import('../../../demand_forecast_widget_data.json');
    return mod.default as WidgetDataResponse;
  }
  if (dashboardId === DASHBOARD_IDS.MARKET) {
    const mod = await import('../../../market_trends_widget_data.json');
    return mod.default as WidgetDataResponse;
  }
  if (dashboardId === DASHBOARD_IDS.CUSTOMER) {
    const mod = await import('../../../customer_insights_widget_data.json');
    return mod.default as WidgetDataResponse;
  }
  const mod = await import('../../../sales_intelligence_widget_data.json');
  return mod.default as WidgetDataResponse;
}

/**
 * Transform metadata + widget data into rows grouped by position.
 * Widgets with the same position appear in the same row.
 */
function transformToVisualizations(
  metadata: DashboardMetadata,
  widgetData: WidgetDataResponse
): Visualization[][] {
  const widgetMap = new Map(
    widgetData.widgets.map((w) => [w.widgetId, w.data])
  );

  const sorted = [...metadata.widgets].sort((a, b) => a.position - b.position);
  const byPosition = new Map<number, Visualization[]>();

  for (const w of sorted) {
    const viz = buildVisualization(w, widgetMap.get(w.widgetId) || {});
    if (!viz) continue;
    const list = byPosition.get(w.position) ?? [];
    list.push(viz);
    byPosition.set(w.position, list);
  }

  return [...byPosition.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, items]) => items);
}

function buildVisualization(
  widget: DashboardMetadata['widgets'][0],
  data: Record<string, unknown>
): Visualization | null {
  const title = widget.title;

  switch (widget.widgetType) {
    case 'summaryCard':
      return buildSummaryCard(title, data);
    case 'chart':
      return buildChart(title, widget.widgetChartType, data);
    case 'grid':
      return buildGrid(title, data);
    default:
      return null;
  }
}

function buildSummaryCard(
  title: string | undefined,
  data: Record<string, unknown>
): Visualization {
  // Support formats: { totalRevenue, totalProfit, ... } or array of { title, value, change, trend }
  const cards: Array<{ title: string; value: string | number; change?: string; trend?: 'up' | 'down'; icon?: string }> = [];

  if (data.totalRevenue !== undefined || data.totalProfit !== undefined) {
    const formatCurrency = (v: unknown) =>
      typeof v === 'number'
        ? '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 })
        : String(v);

    if (data.totalRevenue !== undefined)
      cards.push({
        title: 'Total Revenue',
        value: formatCurrency(data.totalRevenue),
        icon: 'DollarSign',
      });
    if (data.totalProfit !== undefined)
      cards.push({
        title: 'Total Profit',
        value: formatCurrency(data.totalProfit),
        icon: 'DollarSign',
      });
    if (data.profitMargin !== undefined)
      cards.push({
        title: 'Profit Margin',
        value: String(data.profitMargin),
        icon: 'Percent',
      });
    if (data.growthRateMoM !== undefined) {
      const val = String(data.growthRateMoM);
      const isPos = val.startsWith('+') || !val.startsWith('-');
      cards.push({
        title: 'Growth (MoM)',
        value: val,
        change: val,
        trend: isPos ? 'up' : 'down',
        icon: 'TrendingUp',
      });
    }
  }

  // Inventory / stock summary format
  if (cards.length === 0 && (data.lowStockItems !== undefined || data.overstockItems !== undefined)) {
    const num = (v: unknown): string | number =>
      typeof v === 'number' ? v : typeof v === 'string' ? v : String(v ?? '');
    if (data.lowStockItems !== undefined)
      cards.push({ title: 'Low Stock Items', value: num(data.lowStockItems), icon: 'Package' });
    if (data.overstockItems !== undefined)
      cards.push({ title: 'Overstock Items', value: num(data.overstockItems), icon: 'Package' });
    if (data.outOfStock !== undefined)
      cards.push({ title: 'Out of Stock', value: num(data.outOfStock), icon: 'AlertTriangle' });
    if (data.inventoryTurnoverRatio !== undefined)
      cards.push({ title: 'Inventory Turnover', value: String(data.inventoryTurnoverRatio), icon: 'Activity' });
  }

  if (cards.length === 0 && Array.isArray(data.data)) {
    data.data.forEach((item: any) => {
      cards.push({
        title: item.title || String(item.name ?? ''),
        value: item.value ?? item.amount ?? '-',
        change: item.change,
        trend: item.trend === 'up' ? 'up' : item.trend === 'down' ? 'down' : undefined,
        icon: item.icon,
      });
    });
  }

  if (cards.length === 0)
    cards.push({ title: title || 'Summary', value: '-', icon: 'Package' });

  return {
    type: 'summaryCard',
    title,
    data: cards,
  };
}

function buildChart(
  title: string | undefined,
  chartType: string | null,
  data: Record<string, unknown>
): Visualization {
  const type = (chartType || 'line').toLowerCase();

  if (type === 'pie') {
    const categories = (data.categories as string[]) || [];
    const values = (data.salesDistribution as number[]) || (data.values as number[]) || [];
    const chartData = categories.map((name, i) => ({
      name,
      y: values[i] ?? 0,
      color: ['#5B5FEF', '#10B981', '#FFC107', '#EF4444', '#94a3b8'][i % 5],
    }));

    return {
      type: 'chart',
      title,
      data: [
        {
          chart: { type: 'pie', height: 400 },
          title: { text: title || 'Distribution' },
          series: [
            {
              name: title || 'Share',
              data: chartData,
              innerSize: type === 'pie' ? '50%' : undefined,
            },
          ],
          credits: { enabled: false },
        },
      ],
    };
  }

  // Line, area, column, etc.
  const months = (data.months as string[]) || (data.categories as string[]) || [];
  const highchartsType = type === 'area' ? 'area' : type === 'column' ? 'column' : 'line';

  // Multi-series: demand + stock, or series array
  const demand = data.demand as number[] | undefined;
  const stock = data.stock as number[] | undefined;
  const seriesArray = data.series as Array<{ name: string; data: number[] }> | undefined;

  let series: Array<{ name: string; data: number[]; color?: string; fillOpacity?: number }>;
  if (seriesArray && seriesArray.length > 0) {
    const colors = ['#5B5FEF', '#10B981', '#FFC107', '#EF4444', '#94a3b8'];
    series = seriesArray.map((s, i) => ({
      name: s.name,
      data: s.data,
      color: colors[i % colors.length],
      fillOpacity: highchartsType === 'area' ? 0.3 : undefined,
    }));
  } else if (demand !== undefined && stock !== undefined) {
    series = [
      { name: 'Demand', data: demand, color: '#5B5FEF', fillOpacity: highchartsType === 'area' ? 0.3 : undefined },
      { name: 'Stock', data: stock, color: '#10B981', fillOpacity: highchartsType === 'area' ? 0.3 : undefined },
    ];
  } else {
    const seriesData = (data.revenue as number[]) || (data.values as number[]) || [];
    series = [
      { name: 'Revenue', data: seriesData, color: '#5B5FEF', fillOpacity: highchartsType === 'area' ? 0.3 : undefined },
    ];
  }

  return {
    type: 'chart',
    title,
    data: [
      {
        chart: { type: highchartsType, height: 400 },
        title: { text: title || 'Trend' },
        xAxis: { categories: months },
        yAxis: {
          title: { text: 'Value' },
          labels: {
            formatter: function (this: { value: number }) {
              const v = this.value;
              return v >= 1000000 ? v / 1000000 + 'M' : v >= 1000 ? v / 1000 + 'k' : String(v);
            },
          },
        },
        series,
        credits: { enabled: false },
      },
    ],
  };
}

function buildGrid(title: string | undefined, data: Record<string, unknown>): Visualization {
  let rows: any[] = [];

  if (Array.isArray(data.rows)) {
    rows = data.rows;
  } else if (Array.isArray(data.data)) {
    rows = data.data;
  } else if (data.items && Array.isArray(data.items)) {
    rows = data.items;
  }

  return {
    type: 'grid',
    title,
    data: [{ title, rows }],
  };
}

/**
 * Load full dashboard (metadata + widget data) and return transformed visualizations.
 * Call this from Dashboard.tsx.
 */
export async function loadDashboard(dashboardId?: string): Promise<DashboardLoadResult> {
  const metadata = await fetchDashboardMetadata(dashboardId);
  const widgetData = await fetchWidgetData(metadata.dashboardId || dashboardId);

  const rows = transformToVisualizations(metadata, widgetData);

  return { metadata, rows };
}

/**
 * Add a widget to a dashboard via API
 */
export async function addWidgetToDashboard(
  dashboardId: string,
  widgetData: {
    widgetType: string;
    widgetChartType?: string | null;
    title?: string;
    position: number;
    refreshInterval?: number;
  }
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const apiUrl = `/api/dashboards/${dashboardId}/widgets`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(widgetData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding widget to dashboard:', error);
    throw error;
  }
}

/**
 * Remove a widget from a dashboard via API
 */
export async function removeWidgetFromDashboard(
  dashboardId: string,
  widgetId: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const apiUrl = `/api/dashboards/${dashboardId}/widgets/${widgetId}`;
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing widget from dashboard:', error);
    throw error;
  }
}

/**
 * Reorder widgets in a dashboard via API
 */
export async function reorderDashboardWidgets(
  dashboardId: string,
  widgets: Array<{
    widgetId: string;
    widgetType: string;
    widgetChartType?: string | null;
    title?: string;
    position: number;
    refreshInterval?: number;
    createdAt?: string;
    updatedAt?: string;
  }>
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const apiUrl = `/api/dashboards/${dashboardId}/widgets/reorder`;
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(widgets),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error reordering widgets:', error);
    throw error;
  }
}
