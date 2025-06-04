import React from 'react';
import { BarChart3, RefreshCw, Activity, Calendar, Package, Target } from 'lucide-react';

/**
 * Header component with navigation tabs
 */
const Header = ({ 
  fileName, 
  dataMonth, 
  fileInputRef, 
  selectedMetric, 
  setSelectedMetric 
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
              <BarChart3 className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DropMetrics</h1>
              <p className="text-sm text-gray-500">{fileName || `${dataMonth} 2025 Report`}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Upload New</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'daily', label: 'Daily Analytics', icon: Calendar },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'insights', label: 'Insights', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedMetric(tab.id)}
              className={`flex items-center space-x-2 px-4 lg:px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                selectedMetric === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;