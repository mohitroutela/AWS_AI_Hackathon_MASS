import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardView } from './common/DashboardView';

export function MarketTrends() {
  const { id } = useParams<{ id: string }>();

  return (
    <DashboardView
      defaultDashboardId={id || ''}
    />
  );
}
