// Common types for API-driven visualizations

export interface SummaryCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon?: string;
}

export interface SummaryCardVisualization {
  type: 'summaryCard';
  title?: string;
  data: SummaryCard[];
}

export interface ChartVisualization {
  type: 'chart';
  title?: string;
  data: any[]; // Highcharts configurations
}

export interface GridRow {
  [key: string]: any;
}

export interface GridConfig {
  title?: string;
  rows: GridRow[];
}

export interface GridVisualization {
  type: 'grid';
  title?: string;
  data: GridConfig[];
}

export type Visualization = SummaryCardVisualization | ChartVisualization | GridVisualization;

export interface APIResponse {
  message?: string;
  data?: Visualization[];
}
