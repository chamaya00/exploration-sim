'use client';

import { useEffect, useState } from 'react';
import { WorldState } from '@/lib/types';
import { getWorldState } from '@/lib/api';

const regions = [
  { id: 'the_gate', name: 'The Gate', description: 'Where all journeys begin', danger: 1 },
  { id: 'mistwood', name: 'The Mistwood', description: 'Dense forest shrouded in fog', danger: 3 },
  { id: 'crystal_caves', name: 'Crystal Caves', description: 'Glittering underground passages', danger: 5 },
  { id: 'the_depths', name: 'The Depths', description: 'Ancient ruins descending into darkness', danger: 7 },
  { id: 'the_summit', name: 'The Summit', description: 'The highest point', danger: 9 },
];

export default function WorldPage() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getWorldState();
        setWorldState(data);
      } catch (err) {
        setError('Failed to load world state');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">The Beyond</h1>
        <p className="text-gray-600">A mysterious world awaiting exploration</p>
      </div>

      {/* World Stats */}
      {worldState && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{worldState.currentTick}</p>
            <p className="text-sm text-gray-500">World Tick</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{worldState.totalExplorersEver}</p>
            <p className="text-sm text-gray-500">Total Explorers</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{worldState.totalReturnsEver}</p>
            <p className="text-sm text-gray-500">Successful Returns</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{worldState.totalDeathsEver}</p>
            <p className="text-sm text-gray-500">Lost Forever</p>
          </div>
        </div>
      )}

      {/* Regions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Regions</h2>
        <div className="space-y-4">
          {regions.map((region, index) => {
            const explorerCount = worldState?.regionStats?.find(r => r.regionId === region.id)?.currentExplorers || 0;
            const dangerWidth = (region.danger / 10) * 100;

            return (
              <div
                key={region.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{region.name}</h3>
                    <p className="text-sm text-gray-600">{region.description}</p>
                  </div>
                  {explorerCount > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      {explorerCount} exploring
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Danger Level</span>
                    <span>{region.danger}/10</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600"
                      style={{ width: `${dangerWidth}%` }}
                    />
                  </div>
                </div>
                {index < regions.length - 1 && (
                  <div className="flex justify-center mt-3">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Discoveries */}
      {worldState?.discoveries && worldState.discoveries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Discoveries</h2>
          <div className="space-y-3">
            {worldState.discoveries.slice(0, 10).map((discovery) => (
              <div
                key={discovery.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-3"
              >
                <p className="text-amber-800">
                  <span className="font-semibold">{discovery.discoveredByExplorer}</span>
                  {' discovered a secret in '}
                  <span className="font-semibold capitalize">
                    {discovery.region?.replace(/_/g, ' ')}
                  </span>
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Tick {discovery.discoveredOnTick}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
