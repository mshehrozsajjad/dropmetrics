import React from 'react';
import DailyOrdersChart from '../charts/DailyOrdersChart';

/**
 * Daily analytics tab content component
 */
const DailyTab = ({ dailyData }) => {
  return (
    <div className="space-y-6">
      {/* Daily Orders Chart */}
      <DailyOrdersChart dailyData={dailyData} />

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
  );
};

export default DailyTab;