'use client';

import { TrialScenario as TrialScenarioType } from '@/lib/types';

interface TrialScenarioProps {
  scenario: TrialScenarioType;
  selectedOptionIndex?: number;
  onSelect: (index: number) => void;
}

export function TrialScenarioCard({
  scenario,
  selectedOptionIndex,
  onSelect,
}: TrialScenarioProps) {
  return (
    <div className="bg-parchment-100 rounded-lg p-6 border border-parchment-300">
      <p className="text-lg text-gray-800 mb-6 italic leading-relaxed">
        {scenario.scene}
      </p>

      <div className="space-y-3">
        {scenario.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`
              w-full p-4 text-left rounded-lg border-2 transition-all
              ${
                selectedOptionIndex === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <p className="text-gray-800">{option.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface TrialProgressProps {
  current: number;
  total: number;
}

export function TrialProgress({ current, total }: TrialProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`
            w-3 h-3 rounded-full transition-all
            ${i < current ? 'bg-blue-500' : i === current ? 'bg-blue-300' : 'bg-gray-300'}
          `}
        />
      ))}
    </div>
  );
}
