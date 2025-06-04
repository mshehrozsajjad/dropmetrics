import React from 'react';
import { 
  Target, Zap, Activity, AlertCircle, ArrowUpRight, 
  TrendingUp, Clock, CheckCircle 
} from 'lucide-react';

/**
 * Insights tab content component
 */
const InsightsTab = ({ dataMonth, metrics, data, dailyData, priceRangeData }) => {
  return (
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
        <InsightCard 
          icon={<Target size={24} />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          title="Optimize Price Range"
          subtitle="Focus Area"
          content={`Your $10-20 price range generates ${priceRangeData.find(r => r.range === '$10-20')?.percentage.toFixed(1)}% 
          of orders with excellent margins. Consider expanding your inventory in this sweet spot.`}
          actionIcon={<ArrowUpRight size={16} />}
          actionText="Potential 20-30% revenue increase"
          actionColor="text-green-600"
        />

        <InsightCard 
          icon={<Zap size={24} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Scale High Performers"
          subtitle="Growth Opportunity"
          content={`${data.filter(d => d.roi > 50 && d.roi < 1000).length} products achieved 50%+ ROI. 
          Analyze these winners and source similar items to replicate success.`}
          actionIcon={<TrendingUp size={16} />}
          actionText="High-margin expansion strategy"
          actionColor="text-blue-600"
        />

        <InsightCard 
          icon={<Activity size={24} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          title="Consistency is Key"
          subtitle="Performance Insight"
          content={`Your daily average of ${dailyData.length > 0 ? (metrics.totalOrders / dailyData.length).toFixed(1) : '0'} orders 
          shows steady performance. Focus on maintaining this consistency while testing growth strategies.`}
          actionIcon={<Clock size={16} />}
          actionText="Stable foundation for scaling"
          actionColor="text-purple-600"
        />

        <InsightCard 
          icon={<AlertCircle size={24} />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          title="Risk Management"
          subtitle="Protection Strategy"
          content={`With only ${metrics.totalOrders ? (metrics.lossCount / metrics.totalOrders * 100).toFixed(1) : '0'}% loss rate, 
          your risk management is excellent. Maintain strict pricing rules for items under $10.`}
          actionIcon={<CheckCircle size={16} />}
          actionText="Industry-leading loss prevention"
          actionColor="text-orange-600"
        />
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recommended Next Steps</h3>
        <div className="space-y-4">
          <NextStepItem 
            number={1}
            title="Inventory Optimization"
            description="Increase stock levels for products in the $10-20 range with 30%+ ROI"
          />
          <NextStepItem 
            number={2}
            title="Supplier Negotiation"
            description="Target 10% cost reduction on your top 20 products to boost margins"
          />
          <NextStepItem 
            number={3}
            title="Testing Framework"
            description="Allocate 20% of budget to test new product categories with similar profiles"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Insight card component for the insights tab
 */
const InsightCard = ({ 
  icon, 
  iconBg, 
  iconColor, 
  title, 
  subtitle, 
  content, 
  actionIcon, 
  actionText, 
  actionColor 
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center mb-4">
        <div className={`p-3 ${iconBg} rounded-xl mr-4`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <p className="text-gray-700 mb-4">
        {content}
      </p>
      <div className={`flex items-center text-sm font-medium ${actionColor}`}>
        <div className="mr-1">{actionIcon}</div>
        {actionText}
      </div>
    </div>
  );
};

/**
 * Next step item component for the insights tab
 */
const NextStepItem = ({ number, title, description }) => {
  return (
    <div className="flex items-start">
      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
        {number}
      </div>
      <div className="ml-4">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm mt-1">
          {description}
        </p>
      </div>
    </div>
  );
};

export default InsightsTab;