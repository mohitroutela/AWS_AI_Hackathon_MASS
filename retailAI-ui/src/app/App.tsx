import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DemandForecast } from './components/DemandForecast';
import { PricingIntelligence } from './components/PricingIntelligence';
import { InventoryRisk } from './components/InventoryRisk';
import { AICopilot } from './components/AICopilot';
import { MarketTrends } from './components/MarketTrends';
import { DataUpload } from './components/DataUpload';
import { DataQuality } from './components/DataQuality';
import { CustomerInsights } from './components/CustomerInsights';
import { Construction, X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DASHBOARD_IDS } from './services/dashboard.service';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-600 mb-2">{title}</h2>
      <p className="max-w-md text-center">This module is currently under development. Check back later for updates.</p>
    </div>
  );
}

function AppContent() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleOpenCopilot = () => {
    setIsCopilotOpen(true);
  };

  const handleCloseCopilot = () => {
    setIsCopilotOpen(false);
    setIsFullWidth(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    // Close copilot when changing routes
    if (isCopilotOpen) {
      handleCloseCopilot();
    }
  };

  // Extract current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/')) return 'dashboard';
    if (path === '/') return 'dashboard';
    return path.substring(1).split('/')[0];
  };

  // Get dashboard type based on current page
  const getDashboardType = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/')) return 'sales-intelligence-dashboard';
    if (path.startsWith('/forecast/')) return 'forecasting-dashboard';
    if (path.startsWith('/pricing/')) return 'pricing-intelligence-dashboard';
    if (path.startsWith('/inventory/')) return 'inventory-risk-dashboard';
    if (path.startsWith('/market/')) return 'market-trends-dashboard';
    if (path.startsWith('/reports/')) return 'customer-insights-dashboard';
    return undefined;
  };

  const currentPage = getCurrentPage();
  const dashboardType = getDashboardType();

  return (
    <Layout 
      currentPath={location.pathname}
      onNavigate={handleNavigate} 
      onOpenCopilot={handleOpenCopilot} 
      isCopilotOpen={isCopilotOpen}
    >
      <div className="flex h-full gap-6 overflow-hidden">
        {/* Main Content */}
        <div className={`transition-all duration-300 overflow-y-auto ${
          isCopilotOpen ? (isFullWidth ? 'w-0 opacity-0' : 'w-1/2') : 'w-full'
        }`}>
          <Routes>
            <Route path="/" element={<Navigate to={`/dashboard/${DASHBOARD_IDS.SALES}`} replace />} />
            <Route path="/dashboard/:id" element={<Dashboard />} />
            <Route path="/forecast/:id" element={<DemandForecast />} />
            <Route path="/pricing/:id" element={<PricingIntelligence />} />
            <Route path="/inventory/:id" element={<InventoryRisk />} />
            <Route path="/copilot" element={<AICopilot currentPage={currentPage} dashboardType={dashboardType} />} />
            <Route path="/market/:id" element={<MarketTrends />} />
            <Route path="/reports/:id" element={<CustomerInsights />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="/data-upload-managed" element={<DataUpload initialMode="managed" />} />
            <Route path="/data-upload-federated" element={<DataUpload initialMode="federated" />} />
            <Route path="/data-quality" element={<DataQuality />} />
          </Routes>
        </div>

        {/* Floating AI Copilot Panel */}
        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isFullWidth ? '100%' : '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative border-l border-slate-200 bg-slate-50"
            >
              {/* Copilot Header */}
              <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">AI Copilot</h2>
                    <p className="text-xs text-slate-500">Your intelligent retail assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullWidth(!isFullWidth)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title={isFullWidth ? "Split View" : "Full Width"}
                  >
                    {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCloseCopilot}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Copilot Content */}
              <div className="h-full pt-16 pb-4 px-4">
                <AICopilot currentPage={currentPage} dashboardType={dashboardType} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
