import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardView } from './common/DashboardView';
import { DASHBOARD_IDS } from '../services/dashboard.service';

export function InventoryRisk() {
  const { id } = useParams<{ id: string }>();
  const dashboardId = id || DASHBOARD_IDS.INVENTORY;

  return (
    <DashboardView
      defaultDashboardId={dashboardId}
      defaultTitle="Inventory Risk"
      defaultDescription="Identify stockout and overstock risks."
    />
  );
}
