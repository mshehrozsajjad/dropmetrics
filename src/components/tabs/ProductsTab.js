import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import PriceVsProfitChart from '../charts/PriceVsProfitChart';

/**
 * Products tab content component
 */
const ProductsTab = ({ data, topProducts, priceRangeData, metrics }) => {
  return (
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
      <PriceVsProfitChart data={data} />

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
  );
};

export default ProductsTab;