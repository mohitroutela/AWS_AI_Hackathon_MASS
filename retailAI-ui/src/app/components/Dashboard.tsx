import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardView } from './common/DashboardView';
import { DASHBOARD_IDS } from '../services/dashboard.service';

export function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const dashboardId = id || DASHBOARD_IDS.SALES;

  return (
    <DashboardView
      defaultDashboardId={dashboardId}
      defaultTitle="Dashboard Overview"
      defaultDescription="Real-time insights for your retail performance."
    />
  );
}
