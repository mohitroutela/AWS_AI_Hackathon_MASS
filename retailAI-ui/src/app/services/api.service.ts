import { DASHBOARD_IDS } from './dashboard.service';

// Dashboard ID mapping for pages
const PAGE_TO_DASHBOARD_ID: Record<string, string> = {
  'dashboard': DASHBOARD_IDS.SALES,
  'inventory': DASHBOARD_IDS.INVENTORY,
  'pricing': DASHBOARD_IDS.PRICING,
  'forecast': DASHBOARD_IDS.FORECAST,
  'market': DASHBOARD_IDS.MARKET,
  'reports': DASHBOARD_IDS.CUSTOMER,
};

// Widget type mapping from copilot format to API format
function mapWidgetType(copilotType: string): string {
  const typeMap: Record<string, string> = {
    'summaryCard': 'summaryCard',
    'chart': 'chart',
    'grid': 'grid',
  };
  return typeMap[copilotType] || 'chart';
}

// Chart type mapping
function mapChartType(chartConfig: any): string | null {
  if (!chartConfig || !chartConfig.chart) return null;
  
  const highchartsType = chartConfig.chart.type;
  const chartTypeMap: Record<string, string> = {
    'line': 'line',
    'area': 'area',
    'column': 'column',
    'bar': 'bar',
    'pie': 'pie',
    'scatter': 'scatter',
  };
  
  return chartTypeMap[highchartsType] || 'line';
}

// Get next available position for a dashboard
async function getNextPosition(dashboardId: string): Promise<number> {
  try {
    const apiUrl = `https://we6jph4kv1.execute-api.us-east-1.amazonaws.com/Prod/api/dashboards/${dashboardId}`;
    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Could not fetch dashboard, using default position');
      return 999;
    }
    
    const result = await response.json();
    if (result.success && result.data && result.data.widgets) {
      // Find the highest position and add 1
      const maxPosition = result.data.widgets.reduce((max: number, widget: any) => {
        return Math.max(max, widget.position || 0);
      }, 0);
      return maxPosition + 1;
    }
    
    return 0; // First widget
  } catch (error) {
    console.warn('Error fetching dashboard position:', error);
    return 999; // Fallback position
  }
}

// Pin Widget API
export async function pinWidgetToPage(
  widget: any,
  targetPage: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get dashboard ID for the target page
    const dashboardId = PAGE_TO_DASHBOARD_ID[targetPage];
    
    if (!dashboardId) {
      throw new Error(`No dashboard found for page: ${targetPage}`);
    }
    
    // Check if it's a placeholder dashboard
    if (dashboardId.startsWith('PLACEHOLDER-')) {
      console.warn(`Dashboard for ${targetPage} is not yet configured`);
      return {
        success: false,
        message: `Dashboard for ${targetPage} is not yet available`
      };
    }
    
    // Determine widget type and chart type
    const widgetType = mapWidgetType(widget.type);
    let widgetChartType = null;
    let title = widget.title || 'Pinned Widget';
    
    // Extract title from summary card
    if (widget.type === 'summaryCard' || widget.type === 'summary_card') {
      if (widget.title) {
        title = widget.title;
      } else if (widget.data && widget.data.length > 0 && widget.data[0].title) {
        title = widget.data[0].title;
      }
    }
    
    // Extract chart type and title from chart data
    if (widget.type === 'chart' && widget.data && widget.data.length > 0) {
      const chartConfig = widget.data[0];
      widgetChartType = mapChartType(chartConfig);
      if (chartConfig.title && chartConfig.title.text) {
        title = chartConfig.title.text;
      } else if (chartConfig.title && typeof chartConfig.title === 'string') {
        title = chartConfig.title;
      } else if (widget.title) {
        title = widget.title;
      }
    }
    
    // Extract title from grid data
    if (widget.type === 'grid' && widget.data && widget.data.length > 0) {
      const gridConfig = widget.data[0];
      if (gridConfig.title) {
        title = gridConfig.title;
      } else if (widget.title) {
        title = widget.title;
      }
    }
    
    // Get the next available position
    const position = await getNextPosition(dashboardId);
    
    // Prepare widget data for API
    const widgetData = {
      widgetType,
      widgetChartType,
      title,
      position,
      refreshInterval: 300, // 5 minutes default
    };
    
    console.log('Pinning widget to dashboard:', dashboardId, widgetData);
    
    // Call the AddWidget API endpoint - Direct AWS call
    const apiUrl = `https://we6jph4kv1.execute-api.us-east-1.amazonaws.com/Prod/api/dashboards/${dashboardId}/widgets`;
    
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
    
    if (result.success) {
      return {
        success: true,
        message: `Widget "${title}" pinned successfully`
      };
    } else {
      throw new Error(result.message || 'Failed to pin widget');
    }
  } catch (error) {
    console.error('Error pinning widget:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to pin widget'
    };
  }
}
