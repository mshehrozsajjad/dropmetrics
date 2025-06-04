import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomTooltip from '../ui/CustomTooltip';

/**
 * Price range performance chart component
 */
const PriceRangeChart = ({ priceRangeData }) => {
  return (
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
  );
};

export default PriceRangeChart;