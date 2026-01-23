'use client';

import Link from 'next/link';
import { Explorer } from '@/lib/types';
import { HealthBar } from './StatBar';

interface ExplorerCardProps {
  explorer: Explorer;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  returning: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Returning' },
  returned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Returned' },
  dead: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Lost' },
};

const regionNames: Record<string, string> = {
  the_gate: 'The Gate',
  mistwood: 'The Mistwood',
  crystal_caves: 'Crystal Caves',
  the_depths: 'The Depths',
  the_summit: 'The Summit',
};

export function ExplorerCard({ explorer }: ExplorerCardProps) {
  const status = statusStyles[explorer.status] || statusStyles.active;

  return (
    <Link href={`/explorer/${explorer.id}`}>
      <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{explorer.name}</h3>
            <p className="text-sm text-gray-500">
              {regionNames[explorer.currentRegion] || explorer.currentRegion}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="text-xs text-gray-500">Days Alive</span>
            <p className="font-semibold text-gray-900">
              {explorer.daysAlive.toFixed(1)}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Items Found</span>
            <p className="font-semibold text-gray-900">
              {explorer.foundItems.length}
            </p>
          </div>
        </div>

        {(explorer.status === 'active' || explorer.status === 'returning') && (
          <HealthBar health={explorer.health} />
        )}

        {explorer.status === 'returning' && (
          <p className="text-sm text-purple-600 mt-2">
            {explorer.recallDaysRemaining.toFixed(1)} days until return
          </p>
        )}

        {explorer.status === 'dead' && explorer.causeOfDeath && (
          <p className="text-sm text-gray-500 mt-2 italic">
            {explorer.causeOfDeath}
          </p>
        )}
      </div>
    </Link>
  );
}

interface ExplorerListProps {
  explorers: Explorer[];
  emptyMessage?: string;
}

export function ExplorerList({ explorers, emptyMessage = 'No explorers' }: ExplorerListProps) {
  if (explorers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {explorers.map((explorer) => (
        <ExplorerCard key={explorer.id} explorer={explorer} />
      ))}
    </div>
  );
}
