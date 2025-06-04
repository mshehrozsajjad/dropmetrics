import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomTooltip from '../ui/CustomTooltip';

/**
 * Price vs profit scatter chart component
 */
const PriceVsProfitChart = ({ data }) => {
  return (
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
  );
};

export default PriceVsProfitChart;