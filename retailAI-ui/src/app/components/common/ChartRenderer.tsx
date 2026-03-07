import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChartRendererProps {
  charts: any[];
}

export function ChartRenderer({ charts }: ChartRendererProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {charts.map((chartConfig, index) => (
        <div 
          key={index} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <HighchartsReact
            highcharts={Highcharts}
            options={chartConfig}
          />
        </div>
      ))}
    </div>
  );
}
