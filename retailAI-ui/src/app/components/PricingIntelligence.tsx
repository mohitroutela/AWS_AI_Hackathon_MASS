import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardView } from './common/DashboardView';
import { DASHBOARD_IDS } from '../services/dashboard.service';

export function PricingIntelligence() {
  const { id } = useParams<{ id: string }>();
  const dashboardId = id || DASHBOARD_IDS.PRICING;

  return (
    <DashboardView
      defaultDashboardId={dashboardId}
      defaultTitle="Pricing Intelligence"
      defaultDescription="AI-driven pricing strategy and margin analysis."
    />
  );
}
