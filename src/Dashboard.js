import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, AlertCircle, Target, Activity, Calendar, BarChart3, Upload, FileText, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Info, Download, RefreshCw, Zap, Award, Users, Clock } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

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

  const processCSVData = (fileContent) => {
    const lines = fileContent.split('\n');
    const dataWithoutFirstRow = lines.slice(1).join('\n');
    
    const parsedData = Papa.parse(dataWithoutFirstRow, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    // Determine month from data
    let month = 'Unknown';
    let monthAbbrev = 'Unk';
    
    // Try to extract month from the first valid date
    if (parsedData.data.length > 0) {
      const sampleDate = parsedData.data.find(row => row['DATE'])?.['DATE'] || '';
      
      // Match different date formats
      const mayMatch = sampleDate.match(/(\d+)\. Mai 2025/);
      const juneMatch = sampleDate.match(/(\d+)\. June 2025/) || sampleDate.match(/(\d+)\. Jun 2025/);
      const aprilMatch = sampleDate.match(/(\d+)\. Apr(il)? 2025/);
      
      if (mayMatch) {
        month = 'May';
        monthAbbrev = 'May';
      } else if (juneMatch) {
        month = 'June';
        monthAbbrev = 'Jun';
      } else if (aprilMatch) {
        month = 'April';
        monthAbbrev = 'Apr';
      }
    }

    // Clean and process the data
    const processedData = parsedData.data
      .filter(row => {
        // Make sure SELL PRICE and BUY PRICE exist and are valid
        let sellPrice = row['SELL PRICE'];
        let buyPrice = row['BUY PRICE'];
        
        // Handle comma-formatted numbers
        if (typeof sellPrice === 'string') {
          sellPrice = parseFloat(sellPrice.replace(/,/g, '').replace('"', ''));
          row['SELL PRICE'] = sellPrice;
        }
        
        if (typeof buyPrice === 'string') {
          buyPrice = parseFloat(buyPrice.replace(/,/g, '').replace('"', ''));
          row['BUY PRICE'] = buyPrice;
        }
        
        return sellPrice && !isNaN(sellPrice) && buyPrice && !isNaN(buyPrice);
      })
      .map(row => {
        // Parse date from various formats
        let day = 1;
        const dateStr = row['DATE'] || '';
        
        // Try to extract day from different date formats
        const dayMatch = dateStr.match(/(\d+)\./);
        if (dayMatch) {
          day = parseInt(dayMatch[1]);
        }
        
        // Calculate margin percentage
        const marginPercent = ((row['PROFIT'] / row['SELL PRICE']) * 100) || 0;
        
        // Handle PROFIT field
        let profit = row['PROFIT'];
        if (typeof profit === 'string') {
          profit = parseFloat(profit.replace(/,/g, '').replace('"', ''));
          row['PROFIT'] = profit;
        }
        
        // Fix extreme ROI values (data quality issue)
        let roi = row['ROI'];
        if (typeof roi === 'string') {
          roi = parseFloat(roi.replace(/,/g, '').replace('"', '').replace('%', ''));
        }
        
        if (!roi || isNaN(roi) || roi > 1000) {
          roi = (row['PROFIT'] / row['BUY PRICE'] * 100) || 0;
        }
        
        return {
          ...row,
          day,
          date: `${monthAbbrev} ${day}`,
          month,
          marginPercent,
          roi: roi || 0,
          priceRange: getPriceRange(row['SELL PRICE'])
        };
      });

    setData(processedData);
    setHasData(true);
    setLoading(false);
  };

  const handleFileUpload = (file) => {
    if (file && file.type === 'text/csv') {
      setLoading(true);
      setFileName(file.name);
      setUploadProgress(0);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadProgress(50);
        setTimeout(() => {
          processCSVData(e.target.result);
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

  const getPriceRange = (price) => {
    if (price < 10) return '$0-10';
    if (price < 20) return '$10-20';
    if (price < 30) return '$20-30';
    if (price < 50) return '$30-50';
    return '$50+';
  };

  // Calculate metrics
  const metrics = data.length > 0 ? {
    totalOrders: data.length,
    totalRevenue: _.sumBy(data, 'SELL PRICE'),
    totalCost: _.sumBy(data, 'BUY PRICE'),
    totalProfit: _.sumBy(data, 'PROFIT'),
    avgOrderValue: _.meanBy(data, 'SELL PRICE'),
    avgProfit: _.meanBy(data, 'PROFIT'),
    avgROI: _.meanBy(data.filter(d => d.roi < 1000), 'roi'),
    profitMargin: _.sumBy(data, 'SELL PRICE') > 0 ? (_.sumBy(data, 'PROFIT') / _.sumBy(data, 'SELL PRICE') * 100) : 0,
    lossCount: data.filter(d => d.PROFIT < 0).length,
    totalLoss: Math.abs(_.sumBy(data.filter(d => d.PROFIT < 0), 'PROFIT'))
  } : {};

  // Get month from first data point for display
  const dataMonth = data.length > 0 ? data[0].month : 'May';
  
  // Daily metrics
  const dailyData = _.chain(data)
    .groupBy('day')
    .map((items, day) => ({
      day: parseInt(day),
      date: items[0].date, // Use the already formatted date
      orders: items.length,
      revenue: _.sumBy(items, 'SELL PRICE'),
      profit: _.sumBy(items, 'PROFIT'),
      avgROI: _.meanBy(items.filter(d => d.roi < 1000), 'roi'),
      avgOrderValue: _.meanBy(items, 'SELL PRICE')
    }))
    .orderBy('day')
    .value();

  // Price range analysis
  const priceRangeData = _.chain(data)
    .groupBy('priceRange')
    .map((items, range) => ({
      range,
      count: items.length,
      profit: _.sumBy(items, 'PROFIT'),
      avgROI: _.meanBy(items.filter(d => d.roi < 1000), 'roi'),
      percentage: data.length > 0 ? (items.length / data.length * 100) : 0
    }))
    .value();

  // ROI distribution for radial chart
  const roiDistribution = [
    { name: 'Excellent', value: data.filter(d => d.roi >= 50 && d.roi < 1000).length, fill: '#10b981' },
    { name: 'Good', value: data.filter(d => d.roi >= 20 && d.roi < 50).length, fill: '#3b82f6' },
    { name: 'Fair', value: data.filter(d => d.roi >= 0 && d.roi < 20).length, fill: '#f59e0b' },
    { name: 'Loss', value: data.filter(d => d.roi < 0).length, fill: '#ef4444' }
  ];

  // Top products
  const topProducts = _.chain(data)
    .orderBy('PROFIT', 'desc')
    .take(10)
    .value();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      green: "bg-green-50 text-green-600 border-green-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      orange: "bg-orange-50 text-orange-600 border-orange-100"
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={24} />
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    );
  };

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <BarChart3 className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">DropMetrics</h1>
                  <p className="text-sm text-gray-500">Professional eBay Analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a href="https://github.com" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mt-20 px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to DropMetrics
            </h2>
            <p className="text-xl text-gray-600">
              Upload your eBay store CSV to get instant professional analytics
            </p>
          </div>

          <div
            className={`bg-white rounded-2xl shadow-xl p-12 border-2 border-dashed transition-all duration-300 ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Upload className="text-white" size={40} />
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-gray-600 mb-6">or click to browse</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Select CSV File
              </button>

              {loading && (
                <div className="mt-8">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Processing {fileName}...</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="text-blue-600" size={32} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-time Analytics</h4>
              <p className="text-gray-600 text-sm">Instant insights from your sales data</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="text-purple-600" size={32} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Professional Reports</h4>
              <p className="text-gray-600 text-sm">Startup-quality dashboards and metrics</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-green-600" size={32} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Growth Insights</h4>
              <p className="text-gray-600 text-sm">Actionable recommendations to scale</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
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
          <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Revenue Trend */}
            <div className="xl:col-span-2 2xl:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit Trend</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Profit</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ROI Distribution Radial */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={roiDistribution}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {roiDistribution.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range Performance */}
            <div className="xl:col-span-2 2xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance by Price Range</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="xl:col-span-1 2xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Highlights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Best Day</span>
                    <span className="font-semibold text-green-600">
                      ${_.maxBy(dailyData, 'profit')?.profit.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{_.maxBy(dailyData, 'profit')?.date}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Top Price Range</span>
                    <span className="font-semibold text-blue-600">
                      {_.maxBy(priceRangeData, 'profit')?.range}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">${_.maxBy(priceRangeData, 'profit')?.profit.toFixed(2)} profit</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Success Rate</span>
                    <span className="font-semibold text-purple-600">
                      {metrics.totalOrders ? ((1 - metrics.lossCount / metrics.totalOrders) * 100).toFixed(1) : '100'}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Only {metrics.lossCount} losses</p>
                </div>

                <div className="hidden 2xl:block p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Avg Daily Profit</span>
                    <span className="font-semibold text-orange-600">
                      ${dailyData.length > 0 ? (metrics.totalProfit / dailyData.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Consistent performance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'daily' && (
          <div className="space-y-6">
            {/* Daily Orders Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Order Volume & Performance</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Metrics Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Daily Performance Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg ROI</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">AOV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyData.map((day, index) => (
                      <tr key={day.day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{day.date}</td>
                        <td className="text-right py-4 px-6 text-sm text-gray-700">{day.orders}</td>
                        <td className="text-right py-4 px-6 text-sm text-gray-700">${day.revenue.toFixed(2)}</td>
                        <td className="text-right py-4 px-6 text-sm font-medium text-green-600">${day.profit.toFixed(2)}</td>
                        <td className="text-right py-4 px-6 text-sm text-gray-700">{day.avgROI.toFixed(1)}%</td>
                        <td className="text-right py-4 px-6 text-sm text-gray-700">${day.avgOrderValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'products' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="mr-2 text-green-500" size={20} />
                  Top 10 Profitable Products
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {topProducts.map((product, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">${product['SELL PRICE']}</p>
                            <p className="text-xs text-gray-500">{product['EBAY ORDER']}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${product.PROFIT.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{product.roi.toFixed(1)}% ROI</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price vs Profit Scatter */}
            <div className="xl:col-span-1 2xl:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Price vs Profit Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="SELL PRICE" stroke="#9ca3af" fontSize={12} />
                  <YAxis dataKey="PROFIT" stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={data} fill="#3b82f6" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Loss Analysis and Additional Stats */}
            <div className="xl:col-span-2 2xl:col-span-1 space-y-4 lg:space-y-6">
              {/* Loss Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="mr-2 text-red-500" size={20} />
                  Risk Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Products with Loss</span>
                    <span className="font-semibold text-red-600">{metrics.lossCount} items</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Loss Amount</span>
                    <span className="font-semibold text-orange-600">${metrics.totalLoss?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Success Rate</span>
                    <span className="font-semibold text-green-600">
                      {metrics.totalOrders ? ((1 - metrics.lossCount / metrics.totalOrders) * 100).toFixed(1) : '100'}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Range Summary on larger screens */}
              <div className="hidden 2xl:block bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range Summary</h3>
                <div className="space-y-2">
                  {priceRangeData.map((range, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <span className="text-sm text-gray-600">{range.range}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{range.count} items</span>
                        <span className="text-sm font-semibold text-green-600">${range.profit.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'insights' && (
          <div className="space-y-6">
            {/* AI-Powered Insights */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">AI-Powered Insights</h3>
              <p className="text-blue-100 mb-6">Based on your {dataMonth} 2025 performance data</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-3xl font-bold">{metrics.profitMargin?.toFixed(1)}%</p>
                  <p className="text-sm text-blue-100">Profit Margin</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-3xl font-bold">${dailyData.length > 0 ? (metrics.totalProfit / dailyData.length).toFixed(0) : '0'}</p>
                  <p className="text-sm text-blue-100">Daily Profit Avg</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-3xl font-bold">{data.filter(d => d.roi > 50 && d.roi < 1000).length}</p>
                  <p className="text-sm text-blue-100">High ROI Items</p>
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-xl mr-4">
                    <Target className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Optimize Price Range</h4>
                    <p className="text-sm text-gray-500">Focus Area</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Your $10-20 price range generates {priceRangeData.find(r => r.range === '$10-20')?.percentage.toFixed(1)}% 
                  of orders with excellent margins. Consider expanding your inventory in this sweet spot.
                </p>
                <div className="flex items-center text-sm text-green-600 font-medium">
                  <ArrowUpRight size={16} className="mr-1" />
                  Potential 20-30% revenue increase
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <Zap className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Scale High Performers</h4>
                    <p className="text-sm text-gray-500">Growth Opportunity</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  {data.filter(d => d.roi > 50 && d.roi < 1000).length} products achieved 50%+ ROI. 
                  Analyze these winners and source similar items to replicate success.
                </p>
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  <TrendingUp size={16} className="mr-1" />
                  High-margin expansion strategy
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl mr-4">
                    <Activity className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Consistency is Key</h4>
                    <p className="text-sm text-gray-500">Performance Insight</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Your daily average of {dailyData.length > 0 ? (metrics.totalOrders / dailyData.length).toFixed(1) : '0'} orders 
                  shows steady performance. Focus on maintaining this consistency while testing growth strategies.
                </p>
                <div className="flex items-center text-sm text-purple-600 font-medium">
                  <Clock size={16} className="mr-1" />
                  Stable foundation for scaling
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl mr-4">
                    <AlertCircle className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Risk Management</h4>
                    <p className="text-sm text-gray-500">Protection Strategy</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  With only {metrics.totalOrders ? (metrics.lossCount / metrics.totalOrders * 100).toFixed(1) : '0'}% loss rate, 
                  your risk management is excellent. Maintain strict pricing rules for items under $10.
                </p>
                <div className="flex items-center text-sm text-orange-600 font-medium">
                  <CheckCircle size={16} className="mr-1" />
                  Industry-leading loss prevention
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Recommended Next Steps</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">Inventory Optimization</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Increase stock levels for products in the $10-20 range with 30%+ ROI
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">Supplier Negotiation</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Target 10% cost reduction on your top 20 products to boost margins
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">Testing Framework</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Allocate 20% of budget to test new product categories with similar profiles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;