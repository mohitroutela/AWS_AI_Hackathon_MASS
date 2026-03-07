import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SummaryCard } from '../../types/visualization.types';

interface SummaryCardGridProps {
  cards: SummaryCard[];
}

export function SummaryCardGrid({ cards }: SummaryCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            {card.change && (
              <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                card.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {card.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {card.change}
              </div>
            )}
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">{card.title}</h3>
          <p className="text-2xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
