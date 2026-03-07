import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Database,
  History,
  Download,
  Server,
  Link2,
  Table2,
  Globe,
  Key,
  Info,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../services/upload.service';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  date: string;
  status: 'Processing' | 'Completed' | 'Failed';
  size: string;
}

const federatedConnections = [
  { id: 1, name: 'Warehouse DB', type: 'PostgreSQL', tables: 12, status: 'Connected' },
  { id: 2, name: 'CRM API', type: 'REST', tables: 3, status: 'Connected' },
];

interface DataUploadProps {
  initialMode?: 'managed' | 'federated';
}

export function DataUpload({ initialMode = 'managed' }: DataUploadProps) {
  const [mode, setMode] = useState<'managed' | 'federated'>(initialMode);
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);
  const [managedSource, setManagedSource] = useState<'file' | 'api' | 'database'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [recentUploads, setRecentUploads] = useState<UploadedFile[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('sales');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'sales', label: 'Sales Data' },
    { value: 'inventory', label: 'Inventory Levels' },
    { value: 'competitor', label: 'Competitor Info' },
    { value: 'customer', label: 'Customer Data' },
    { value: 'product', label: 'Product Data' },
    { value: 'all', label: 'All Categories' },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'sales': 'Sales',
      'inventory': 'Inventory',
      'competitor': 'Competitor',
      'customer': 'Customer',
      'product': 'Product',
      'all': 'All'
    };
    return labels[category] || category;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setShowCategoryModal(true);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setShowCategoryModal(true);
    }
  };

  const handleCategoryConfirm = async () => {
    if (selectedFile) {
      setShowCategoryModal(false);
      await handleFileUpload(selectedFile, selectedCategory);
      setSelectedFile(null);
    }
  };

  const handleCategoryCancel = () => {
    setShowCategoryModal(false);
    setSelectedFile(null);
    setSelectedCategory('sales');
  };

  const handleFileUpload = async (file: File, category: string) => {
    try {
      setIsUploading(true);
      setUploadStatus('idle');
      setUploadMessage('');
      setUploadProgress(0);

      // Add to recent uploads immediately with Processing status
      const newUpload: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: getCategoryLabel(category),
        date: 'Just now',
        status: 'Processing',
        size: formatFileSize(file.size)
      };
      setRecentUploads(prev => [newUpload, ...prev]);

      const result = await uploadFile(file, category, (progress) => {
        setUploadProgress(progress);
      });

      // Update the upload status in recent uploads
      setRecentUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, status: result.success ? 'Completed' : 'Failed' }
          : upload
      ));

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage(result.message || 'File uploaded successfully!');
      } else {
        setUploadStatus('error');
        setUploadMessage(result.message || 'Upload failed');
      }
    } catch (error) {
      // Update the upload status to Failed
      setRecentUploads(prev => prev.map((upload, index) => 
        index === 0 ? { ...upload, status: 'Failed' as const } : upload
      ));
      
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset status message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
        setUploadProgress(0);
      }, 5000);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  function StatusIcon({ status }: { status: string }) {
    if (status === 'Completed') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
    if (status === 'Failed') {
      return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
    }
    if (status === 'Processing') {
      return (
        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {mode === 'managed' && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Managed Data</h1>
            <p className="text-slate-500 text-sm mt-1">Upload from files, API, or database. Data is stored in our database.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Download Templates
          </button>
        </div>
      )}

      {mode === 'federated' && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Federated</h1>
          <p className="text-slate-500 text-sm mt-1">Query directly into your tables. We use schema only—no data is copied or stored.</p>
        </div>
      )}

      <div className={`grid gap-6 ${mode === 'managed' && recentUploads.length > 0 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={mode === 'managed' && recentUploads.length > 0 ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
          <AnimatePresence mode="wait">
            {mode === 'managed' ? (
              <motion.div
                key="managed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="px-6 pt-6 pb-2">
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    Data from API, database, or file upload is ingested and stored in our database.
                  </p>
                </div>
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => setManagedSource('file')}
                    className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                      ${managedSource === 'file'
                        ? 'border-[#5B5FEF] text-[#5B5FEF] bg-[#5B5FEF]/5'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    File Upload
                  </button>
                  <button
                    onClick={() => setManagedSource('api')}
                    className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                      ${managedSource === 'api'
                        ? 'border-[#5B5FEF] text-[#5B5FEF] bg-[#5B5FEF]/5'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <Link2 className="w-4 h-4" />
                    API
                  </button>
                  <button
                    onClick={() => setManagedSource('database')}
                    className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                      ${managedSource === 'database'
                        ? 'border-[#5B5FEF] text-[#5B5FEF] bg-[#5B5FEF]/5'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <Server className="w-4 h-4" />
                    Database
                  </button>
                </div>

                <div className="p-8">
                  {managedSource === 'file' && (
                    <>
                      {/* Upload Status Messages */}
                      {uploadStatus === 'success' && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-sm text-emerald-800">{uploadMessage}</p>
                        </div>
                      )}
                      {uploadStatus === 'error' && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                          <p className="text-sm text-red-800">{uploadMessage}</p>
                        </div>
                      )}

                      <div
                        className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all duration-200
                          ${isDragging
                            ? 'border-[#5B5FEF] bg-[#5B5FEF]/5'
                            : 'border-slate-200 hover:border-[#5B5FEF]/50 hover:bg-slate-50'
                          }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls,.json"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="w-16 h-16 bg-indigo-50 text-[#5B5FEF] rounded-full flex items-center justify-center mb-4">
                          {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                          ) : (
                            <UploadCloud className="w-8 h-8" />
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {isUploading ? 'Uploading...' : 'Drag & Drop your files here'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
                          Support for CSV, Excel (.xlsx), and JSON. Data is stored in our database. Max 50MB.
                        </p>
                        {isUploading && (
                          <div className="w-full max-w-xs mb-4">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#5B5FEF] h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">{uploadProgress}%</p>
                          </div>
                        )}
                        <button 
                          onClick={handleBrowseClick}
                          disabled={isUploading}
                          className="px-6 py-3 bg-[#5B5FEF] text-white rounded-xl font-bold hover:bg-[#4a4ecf] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? 'Uploading...' : 'Browse Files'}
                        </button>
                      </div>
                    </>
                  )}

                  {managedSource === 'api' && (
                    <div className="space-y-6">
                      <p className="text-sm text-slate-500">
                        Configure an API source. Data will be fetched and stored in our database on a schedule.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">API Endpoint URL</label>
                          <input
                            type="url"
                            placeholder="https://api.example.com/v1/data"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                              <Key className="w-3.5 h-3.5" /> Auth (optional)
                            </label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]">
                              <option>None</option>
                              <option>API Key</option>
                              <option>Bearer Token</option>
                              <option>Basic Auth</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sync frequency</label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]">
                              <option>Every 15 min</option>
                              <option>Hourly</option>
                              <option>Daily</option>
                              <option>Weekly</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button className="px-5 py-2.5 bg-[#5B5FEF] text-white rounded-lg text-sm font-medium hover:bg-[#4a4ecf]">
                            Save & Sync to Our Database
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {managedSource === 'database' && (
                    <div className="space-y-6">
                      <p className="text-sm text-slate-500">
                        Connect your database. Data will be synced and stored in our database.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Database type</label>
                          <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]">
                            <option>PostgreSQL</option>
                            <option>MySQL</option>
                            <option>SQL Server</option>
                            <option>MongoDB</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Host</label>
                            <input
                              type="text"
                              placeholder="db.example.com"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Port</label>
                            <input
                              type="number"
                              placeholder="5432"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Database name</label>
                            <input
                              type="text"
                              placeholder="retail_db"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tables to sync</label>
                            <input
                              type="text"
                              placeholder="sales, inventory, products"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <Key className="w-3.5 h-3.5" /> Credentials
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Username"
                              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                            />
                            <input
                              type="password"
                              placeholder="Password"
                              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
                            />
                          </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button className="px-5 py-2.5 bg-[#5B5FEF] text-white rounded-lg text-sm font-medium hover:bg-[#4a4ecf]">
                            Connect & Sync to Our Database
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="federated"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Connections — separate card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Server className="w-5 h-5 text-[#5B5FEF]" />
                      Connections
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Register data sources. We connect and read schema only—no data is copied.</p>
                  </div>
                  <div className="p-6 space-y-3">
                    {federatedConnections.map((conn) => (
                      <div
                        key={conn.id}
                        className="p-4 rounded-xl border border-slate-100 hover:border-[#5B5FEF]/30 bg-slate-50/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#5B5FEF]/10 flex items-center justify-center">
                            <Server className="w-5 h-5 text-[#5B5FEF]" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{conn.name}</p>
                            <p className="text-xs text-slate-500">
                              {conn.type} • {conn.tables} tables (query at source)
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          {conn.status}
                        </span>
                      </div>
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-[#5B5FEF]/50 hover:text-[#5B5FEF] hover:bg-[#5B5FEF]/5 transition-colors flex items-center justify-center gap-2">
                      <Server className="w-4 h-4" />
                      Add federated connection
                    </button>
                  </div>
                </div>

                {/* Schema — separate card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Table2 className="w-5 h-5 text-[#5B5FEF]" />
                      Schema
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Tables we query directly. Queries run on your infrastructure; no data is stored here.</p>
                  </div>
                  <div className="p-6">
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Connection</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Table / View</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Columns</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Access</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-800">Warehouse DB</td>
                            <td className="py-3 px-4 text-slate-600">sales_transactions</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">id, product_id, qty, amount, date</td>
                            <td className="py-3 px-4"><span className="text-emerald-600 text-xs font-medium">Read</span></td>
                          </tr>
                          <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-800">Warehouse DB</td>
                            <td className="py-3 px-4 text-slate-600">inventory_levels</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">sku, warehouse_id, quantity, updated_at</td>
                            <td className="py-3 px-4"><span className="text-emerald-600 text-xs font-medium">Read</span></td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-800">CRM API</td>
                            <td className="py-3 px-4 text-slate-600">customers</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">customer_id, segment, ltv, region</td>
                            <td className="py-3 px-4"><span className="text-emerald-600 text-xs font-medium">Read</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: history (managed) or federated summary */}
        <div className="space-y-6">
          {mode === 'managed' && recentUploads.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Recent Uploads
              </h3>
              <div className="space-y-4">
                {recentUploads.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3"
                    >
                      <div className="p-2 bg-white rounded-lg border border-slate-100 shrink-0">
                        {file.name.endsWith('.csv') ? (
                          <FileText className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.date}</span>
                        </div>
                      </div>
                      <StatusIcon status={file.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          {mode === 'federated' && (
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                Federated at a glance
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                You have 2 connections. We query 15 tables directly—schema only, no data copy.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Queries run on your infrastructure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  We only store schema metadata
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  No data stored in our database
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">Select Category</h3>
            
            <div className="mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    {selectedFile.name.endsWith('.csv') ? (
                      <FileText className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Choose data category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#5B5FEF]"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCategoryCancel}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCategoryConfirm}
                className="flex-1 px-4 py-2.5 bg-[#5B5FEF] text-white rounded-lg font-medium hover:bg-[#4a4ecf] transition-colors"
              >
                Upload
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
