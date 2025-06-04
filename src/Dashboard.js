import React, { useState, useRef } from 'react';
import _ from 'lodash';
import { ShoppingCart, DollarSign, TrendingUp, Target, Activity } from 'lucide-react';

// Import components
import Header from './components/ui/Header';
import UploadSection from './components/ui/UploadSection';
import MetricCard from './components/ui/MetricCard';
import OverviewTab from './components/tabs/OverviewTab';
import DailyTab from './components/tabs/DailyTab';
import ProductsTab from './components/tabs/ProductsTab';
import InsightsTab from './components/tabs/InsightsTab';

// Import utility functions
import { 
  processCSVData, 
  calculateMetrics, 
  generateDailyData, 
  generatePriceRangeData, 
  generateRoiDistribution, 
  getTopProducts 
} from './utils/dataProcessing';

/**
 * Main Dashboard component
 */
const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handle file upload
   * @param {File} file - The uploaded CSV file
   */
  const handleFileUpload = (file) => {
    if (file && file.type === 'text/csv') {
      setLoading(true);
      setFileName(file.name);
      setUploadProgress(0);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadProgress(50);
        setTimeout(() => {
          const result = processCSVData(e.target.result);
          console.log("Processed data:", result);
          setData(result.processedData);
          setHasData(true);
          setLoading(false);
          setUploadProgress(100);
        }, 500);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  // Calculate data derivatives
  console.log("Data length for calculations:", data.length);
  const metrics = calculateMetrics(data);
  console.log("Calculated metrics:", metrics);
  
  const dataMonth = data.length > 0 ? data[0].month : 'May';
  console.log("Using month:", dataMonth);
  
  const dailyData = generateDailyData(data);
  console.log("Daily data:", dailyData);
  
  const priceRangeData = generatePriceRangeData(data);
  console.log("Price range data:", priceRangeData);
  
  const roiDistribution = generateRoiDistribution(data);
  console.log("ROI distribution:", roiDistribution);
  
  const topProducts = getTopProducts(data);
  console.log("Top products:", topProducts);

  // If no data yet, show upload section
  if (!hasData) {
    return (
      <UploadSection
        isDragging={isDragging}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        loading={loading}
        uploadProgress={uploadProgress}
        fileName={fileName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <Header
        fileName={fileName}
        dataMonth={dataMonth}
        fileInputRef={fileInputRef}
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* Main Content */}
      <div className="max-w-full 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <MetricCard
            icon={ShoppingCart}
            title="Total Orders"
            value={metrics.totalOrders}
            subtitle={`${dailyData.length > 0 ? (metrics.totalOrders / dailyData.length).toFixed(1) : '0'} orders/day`}
            color="blue"
          />
          <MetricCard
            icon={DollarSign}
            title="Revenue"
            value={metrics.totalRevenue && typeof metrics.totalRevenue === 'number' ? `${metrics.totalRevenue.toFixed(2)}` : '0.00'}
            subtitle={`AOV: ${metrics.avgOrderValue && typeof metrics.avgOrderValue === 'number' ? metrics.avgOrderValue.toFixed(2) : '0.00'}`}
            color="green"
          />
          <MetricCard
            icon={TrendingUp}
            title="Net Profit"
            value={metrics.totalProfit && typeof metrics.totalProfit === 'number' ? `${metrics.totalProfit.toFixed(2)}` : '0.00'}
            subtitle={`${metrics.profitMargin && typeof metrics.profitMargin === 'number' ? metrics.profitMargin.toFixed(1) : '0'}% margin`}
            trend={metrics.profitMargin}
            color="purple"
          />
          <MetricCard
            icon={Target}
            title="Average ROI"
            value={`${metrics.avgROI && typeof metrics.avgROI === 'number' ? metrics.avgROI.toFixed(1) : '0'}%`}
            subtitle={`${metrics.avgProfit && typeof metrics.avgProfit === 'number' ? metrics.avgProfit.toFixed(2) : '0.00'} per order`}
            color="orange"
          />
          <div className="hidden 2xl:block">
            <MetricCard
              icon={Activity}
              title="Success Rate"
              value={`${metrics.totalOrders ? ((1 - metrics.lossCount / metrics.totalOrders) * 100).toFixed(1) : '100'}%`}
              subtitle={`${metrics.lossCount} losses total`}
              color="green"
            />
          </div>
        </div>

        {/* Content based on selected tab */}
        {selectedMetric === 'overview' && (
          <OverviewTab 
            dailyData={dailyData}
            priceRangeData={priceRangeData}
            roiDistribution={roiDistribution}
            metrics={metrics}
          />
        )}

        {selectedMetric === 'daily' && (
          <DailyTab dailyData={dailyData} />
        )}

        {selectedMetric === 'products' && (
          <ProductsTab 
            data={data}
            topProducts={topProducts}
            priceRangeData={priceRangeData}
            metrics={metrics}
          />
        )}

        {selectedMetric === 'insights' && (
          <InsightsTab 
            dataMonth={dataMonth}
            metrics={metrics}
            data={data}
            dailyData={dailyData}
            priceRangeData={priceRangeData}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;