import { useState, useEffect, useRef } from 'react';
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

    // Clean and process the data
    const processedData = parsedData.data
      .filter(row => row['SELL PRICE'] && row['BUY PRICE'])
      .map(row => {
        // Parse date - handle German format
        const dateMatch = row['DATE'].match(/(\d+)\. Mai 2025/);
        const day = dateMatch ? parseInt(dateMatch[1]) : 1;
        
        // Calculate margin percentage
        const marginPercent = ((row['PROFIT'] / row['SELL PRICE']) * 100) || 0;
        
        // Fix extreme ROI values (data quality issue)
        let roi = row['ROI'];
        if (roi > 1000) {
          roi = (row['PROFIT'] / row['BUY PRICE'] * 100) || 0;
        }
        
        return {
          ...row,
          day,
          date: `May ${day}`,
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
    profitMargin: (_.sumBy(data, 'PROFIT') / _.sumBy(data, 'SELL PRICE') * 100),
    lossCount: data.filter(d => d.PROFIT < 0).length,
    totalLoss: Math.abs(_.sumBy(data.filter(d => d.PROFIT < 0), 'PROFIT'))
  } : {};

  // Daily metrics
  const dailyData = _.chain(data)
    .groupBy('day')
    .map((items, day) => ({
      day: parseInt(day),
      date: `May ${day}`,
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
      percentage: (items.length / data.length * 100)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 mr-3">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DropMetrics</h1>
                <p className="text-sm text-gray-500">Professional eBay Analytics</p>
              </div>
            </div>
            
            {hasData && (
              <div className="flex items-center space-x-4">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="overview">Overview</option>
                  <option value="insights">AI Insights</option>
                </select>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Upload size={16} />
                  <span>Upload New Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasData ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                    isDragging ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {loading ? (
                      <RefreshCw className={`animate-spin ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} size={32} />
                    ) : (
                      <Upload className={isDragging ? 'text-blue-600' : 'text-gray-600'} size={32} />
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                    isDragging ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {loading ? 'Processing your data...' : 'Upload Your CSV Data'}
                  </h3>
                  
                  {loading && fileName && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Processing: {fileName}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-sm mb-6 transition-colors ${
                    isDragging ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {isDragging 
                      ? 'Drop your CSV file here to get started' 
                      : 'Drag and drop your CSV file here, or click to browse'
                    }
                  </p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      loading 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDragging
                          ? 'bg-blue-700 text-white hover:bg-blue-800'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <FileText size={20} />
                    <span>Choose File</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-8 text-left bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Info className="mr-2 text-blue-500" size={20} />
                  What You'll Get
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="mr-3 text-green-500 flex-shrink-0" size={16} />
                    Comprehensive profit & loss analysis
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="mr-3 text-green-500 flex-shrink-0" size={16} />
                    ROI tracking and performance insights
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="mr-3 text-green-500 flex-shrink-0" size={16} />
                    Daily trends and seasonal patterns
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="mr-3 text-green-500 flex-shrink-0" size={16} />
                    AI-powered recommendations
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <MetricCard
                icon={DollarSign}
                title="Total Revenue"
                value={`$${metrics.totalRevenue?.toFixed(2)}`}
                subtitle={`${metrics.totalOrders} orders`}
                color="green"
              />
              <MetricCard
                icon={TrendingUp}
                title="Total Profit"
                value={`$${metrics.totalProfit?.toFixed(2)}`}
                subtitle={`${metrics.profitMargin?.toFixed(1)}% margin`}
                color="blue"
              />
              <MetricCard
                icon={Target}
                title="Average ROI"
                value={`${metrics.avgROI?.toFixed(1)}%`}
                subtitle={`$${metrics.avgProfit?.toFixed(2)} avg profit`}
                color="purple"
              />
              <MetricCard
                icon={Package}
                title="Success Rate"
                value={`${((1 - metrics.lossCount / metrics.totalOrders) * 100).toFixed(1)}%`}
                subtitle={`${metrics.lossCount} losses`}
                color="orange"
              />
            </div>

            {/* Navigation Tabs for different views */}
            {selectedMetric === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                {/* Daily Performance Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Performance Trends</h3>
                  <ResponsiveContainer width="100%" height={320}>
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
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        name="Profit"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* ROI Distribution Radial Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI Distribution</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={roiDistribution}>
                      <RadialBar
                        minAngle={15}
                        label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                        background
                        clockWise
                        dataKey="value"
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Price Range Analysis */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Price Range Performance</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={priceRangeData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="range" className="text-xs" />
                      <YAxis yAxisId="left" orientation="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Order Count" />
                      <Line yAxisId="right" type="monotone" dataKey="avgROI" stroke="#10b981" strokeWidth={3} name="Avg ROI %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Performing Products */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performers</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {topProducts.slice(0, 8).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{product.ITEM || `Product ${index + 1}`}</p>
                            <p className="text-xs text-gray-500">${product['SELL PRICE']?.toFixed(2)} • ROI: {product.roi?.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 text-sm">${product.PROFIT?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                          {((1 - metrics.lossCount / metrics.totalOrders) * 100).toFixed(1)}%
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
                  <p className="text-blue-100 mb-6">Based on your May 2025 performance data</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                      <p className="text-3xl font-bold">{metrics.profitMargin?.toFixed(1)}%</p>
                      <p className="text-sm text-blue-100">Profit Margin</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                      <p className="text-3xl font-bold">${(metrics.totalProfit / dailyData.length).toFixed(0)}</p>
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
                      Your daily average of {(metrics.totalOrders / dailyData.length).toFixed(1)} orders 
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
                      With only {(metrics.lossCount / metrics.totalOrders * 100).toFixed(1)}% loss rate, 
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
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};

export default Dashboard;