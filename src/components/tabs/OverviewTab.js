import React from 'react';
import _ from 'lodash';
import RevenueChart from '../charts/RevenueChart';
import RoiDistributionChart from '../charts/RoiDistributionChart';
import PriceRangeChart from '../charts/PriceRangeChart';

/**
 * Overview tab content component
 */
const OverviewTab = ({ dailyData, priceRangeData, roiDistribution, metrics }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
      {/* Revenue Trend */}
      <RevenueChart dailyData={dailyData} />

      {/* ROI Distribution Radial */}
      <RoiDistributionChart roiDistribution={roiDistribution} />

      {/* Price Range Performance */}
      <PriceRangeChart priceRangeData={priceRangeData} />

      {/* Quick Stats */}
      <div className="xl:col-span-1 2xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Highlights</h3>
        <div className="space-y-4">
          <HighlightCard 
            bgColor="bg-green-50" 
            borderColor="border-green-100" 
            textColor="text-green-600"
            title="Best Day"
            value={`$${_.maxBy(dailyData, 'profit')?.profit.toFixed(2)}`}
            subtitle={_.maxBy(dailyData, 'profit')?.date}
          />
          
          <HighlightCard 
            bgColor="bg-blue-50" 
            borderColor="border-blue-100" 
            textColor="text-blue-600"
            title="Top Price Range"
            value={_.maxBy(priceRangeData, 'profit')?.range}
            subtitle={`$${_.maxBy(priceRangeData, 'profit')?.profit.toFixed(2)} profit`}
          />

          <HighlightCard 
            bgColor="bg-purple-50" 
            borderColor="border-purple-100" 
            textColor="text-purple-600"
            title="Success Rate"
            value={`${metrics.totalOrders ? ((1 - metrics.lossCount / metrics.totalOrders) * 100).toFixed(1) : '100'}%`}
            subtitle={`Only ${metrics.lossCount} losses`}
          />

          <div className="hidden 2xl:block">
            <HighlightCard 
              bgColor="bg-orange-50" 
              borderColor="border-orange-100" 
              textColor="text-orange-600"
              title="Avg Daily Profit"
              value={`$${dailyData.length > 0 ? (metrics.totalProfit / dailyData.length).toFixed(2) : '0.00'}`}
              subtitle="Consistent performance"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Highlight card component for the overview tab
 */
const HighlightCard = ({ 
  bgColor, 
  borderColor, 
  textColor, 
  title, 
  value, 
  subtitle 
}) => {
  return (
    <div className={`p-4 ${bgColor} rounded-xl border ${borderColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className={`font-semibold ${textColor}`}>
          {value}
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
    </div>
  );
};

export default OverviewTab;