import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Tag,
  AlertTriangle,
  LineChart,
  Bot,
  FileText,
  Settings,
  Search,
  Database,
  UploadCloud,
  Globe,
  ShieldCheck,
  Menu,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DASHBOARD_IDS } from '../services/dashboard.service';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCopilot?: () => void;
  isCopilotOpen?: boolean;
}

const dataManagementSubItems = [
  { groupLabel: 'Data Upload', items: [
    { id: 'data-upload-managed', label: 'Managed Data', icon: UploadCloud, route: '/data-upload-managed' },
    { id: 'data-upload-federated', label: 'Federated', icon: Globe, route: '/data-upload-federated' },
  ]},
  { id: 'data-quality', label: 'Data Quality', icon: ShieldCheck, route: '/data-quality' },
];

export function Layout({ children, currentPath, onNavigate, onOpenCopilot, isCopilotOpen = false }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Format date as "MMM DD, YYYY"
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Determine if floating button should be shown
  const shouldShowFloatingButton = !isCopilotOpen && !currentPath.startsWith('/copilot') && !currentPath.startsWith('/data-');
  
  const menuItemsBeforeData = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: `/dashboard/${DASHBOARD_IDS.SALES}` },
    { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp, route: `/forecast/7bae30f7-28a0-4324-a740-e61ddd5d60b3` },
    { id: 'pricing', label: 'Pricing Intelligence', icon: Tag, route: `/pricing/46237590-f030-4bd9-a99f-cc8a56eeaf92` },
    { id: 'inventory', label: 'Inventory Risk', icon: AlertTriangle, route: `/inventory/808d6eb3-c247-46ae-a7cf-784ac4c08517` },
    { id: 'market', label: 'Market Trends', icon: LineChart, route: `/market/${DASHBOARD_IDS.MARKET}` },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, route: '/copilot' },
    { id: 'reports', label: 'Customer Insights', icon: FileText, route: `/reports/${DASHBOARD_IDS.CUSTOMER}` },
  ];

  const menuItemsAfterData = [
    { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
  ];

  // All searchable menu items
  const allMenuItems = [
    ...menuItemsBeforeData,
    ...dataManagementSubItems.flatMap(section => 
      'items' in section ? section.items : [section]
    ).filter((item): item is typeof menuItemsBeforeData[0] => item !== undefined),
    ...menuItemsAfterData
  ];

  // Filter menu items based on search query
  const filteredMenuItems = searchQuery.trim()
    ? allMenuItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  // Handle search result click
  const handleSearchResultClick = (route: string) => {
    onNavigate(route);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if current path matches a route
  const isActiveRoute = (route: string, id: string) => {
    if (id === 'dashboard' && currentPath.startsWith('/dashboard/')) return true;
    if (id === 'forecast' && currentPath.startsWith('/forecast/')) return true;
    if (id === 'pricing' && currentPath.startsWith('/pricing/')) return true;
    if (id === 'inventory' && currentPath.startsWith('/inventory/')) return true;
    if (id === 'market' && currentPath.startsWith('/market/')) return true;
    if (id === 'reports' && currentPath.startsWith('/reports/')) return true;
    if (currentPath.startsWith('/data-')) {
      return currentPath === route;
    }
    return currentPath === route;
  };

  const navButtonClass = (active: boolean) =>
    `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
      ${active ? 'bg-[#5B5FEF]/10 text-[#5B5FEF] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`;

  const iconClass = (active: boolean) => `w-5 h-5 shrink-0 ${active ? 'text-[#5B5FEF]' : 'text-slate-400'}`;

  return (
    <div className="flex h-screen bg-[#F7F8FC] font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-100 flex flex-col shadow-sm z-10 transition-all duration-300`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#5B5FEF] rounded-lg flex items-center justify-center">
              <Bot className="text-white w-5 h-5" />
            </div>
            {!isCollapsed && <span className="font-bold text-xl tracking-tight text-slate-900">RetailAI</span>}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItemsBeforeData.map((item) => {
            const isActive = isActiveRoute(item.route, item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={navButtonClass(isActive)}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={iconClass(isActive)} />
                {!isCollapsed && item.label}
              </button>
            );
          })}

          {/* Data Management — section label with sub-items */}
          {!isCollapsed && (
            <div className="pt-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <Database className="w-5 h-5 shrink-0 text-slate-400" />
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Data Management</span>
              </div>
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                {dataManagementSubItems.map((section) => {
                  if ('groupLabel' in section) {
                    return (
                      <div key={section.groupLabel} className="pt-2 first:pt-1">
                        <p className="px-2 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {section.groupLabel}
                        </p>
                        {section.items?.map((sub) => {
                          const isActiveSub = isActiveRoute(sub.route, sub.id);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => onNavigate(sub.route)}
                              className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all duration-200 text-left
                                ${isActiveSub ? 'bg-[#5B5FEF]/10 text-[#5B5FEF] font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                            >
                              <sub.icon className={`w-4 h-4 shrink-0 ${isActiveSub ? 'text-[#5B5FEF]' : 'text-slate-400'}`} />
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  const isActiveSub = isActiveRoute(section.route, section.id);
                  return (
                    <button
                      key={section.id}
                      onClick={() => onNavigate(section.route)}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all duration-200 mt-1 text-left
                        ${isActiveSub ? 'bg-[#5B5FEF]/10 text-[#5B5FEF] font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                      <section.icon className={`w-4 h-4 shrink-0 ${isActiveSub ? 'text-[#5B5FEF]' : 'text-slate-400'}`} />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsed Data Management - show as single icon */}
          {isCollapsed && (
            <button
              onClick={() => onNavigate('/data-upload-managed')}
              className={navButtonClass(currentPath.startsWith('/data-'))}
              title="Data Management"
            >
              <Database className={iconClass(currentPath.startsWith('/data-'))} />
            </button>
          )}

          {menuItemsAfterData.map((item) => {
            const isActive = isActiveRoute(item.route, item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={navButtonClass(isActive)}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={iconClass(isActive)} />
                {!isCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle Button - Removed from here */}

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
              JD
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">Jane Doe</p>
                <p className="text-xs text-slate-500 truncate">Store Manager</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4 w-96 search-container relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search for pages, insights..." 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && filteredMenuItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                      Pages
                    </div>
                    {filteredMenuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.route)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No Results Message */}
              {showSearchResults && searchQuery.trim() && filteredMenuItems.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
                  <p className="text-sm text-slate-500 text-center">No pages found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>{formattedDate}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           {children}
           
           {/* Floating AI Copilot Button */}
           <AnimatePresence>
             {shouldShowFloatingButton && (
               <motion.button
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0, opacity: 0 }}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={onOpenCopilot}
                 className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 flex items-center gap-3 group z-50"
               >
                 <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                 <span className="font-semibold">Ask AI Copilot</span>
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
               </motion.button>
             )}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
