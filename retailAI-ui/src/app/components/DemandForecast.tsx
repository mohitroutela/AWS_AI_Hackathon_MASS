import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardView } from './common/DashboardView';
import { DASHBOARD_IDS } from '../services/dashboard.service';

export function DemandForecast() {
  const { id } = useParams<{ id: string }>();
  const dashboardId = id || DASHBOARD_IDS.FORECAST;

  return (
    <DashboardView
      defaultDashboardId={dashboardId}
      defaultTitle="Demand Forecast"
      defaultDescription="AI-powered demand prediction and sales forecasting."
    />
  );
}
