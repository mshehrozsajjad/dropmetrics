import React from 'react';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * ROI distribution radial chart component
 */
const RoiDistributionChart = ({ roiDistribution }) => {
  return (
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
  );
};

export default RoiDistributionChart;