'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Explorer, PlayerLegacy, WorldState } from '@/lib/types';
import { getUserExplorers, getUserLegacy, getWorldState, getOrCreateUser } from '@/lib/api';
import { ExplorerCard } from '@/components/ExplorerCard';

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeExplorer, setActiveExplorer] = useState<Explorer | null>(null);
  const [legacy, setLegacy] = useState<PlayerLegacy | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get or create user ID from localStorage
        let storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
          const { userId: newUserId } = await getOrCreateUser();
          localStorage.setItem('userId', newUserId);
          storedUserId = newUserId;
        }
        setUserId(storedUserId);

        // Fetch data in parallel
        const [explorersData, legacyData, worldData] = await Promise.all([
          getUserExplorers(storedUserId),
          getUserLegacy(storedUserId),
          getWorldState(),
        ]);

        // Find active explorer
        const active = explorersData.active.find(e => e.status === 'active' || e.status === 'returning');
        setActiveExplorer(active || null);
        setLegacy(legacyData.legacy);
        setWorldState(worldData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    init();
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">The Beyond</h1>
        <p className="text-gray-600">
          Send explorers into a mysterious world and watch their journey unfold
        </p>
      </div>

      {/* Active Explorer */}
      {activeExplorer ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Explorer</h2>
          <ExplorerCard explorer={activeExplorer} />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Explore?
          </h2>
          <p className="text-gray-600 mb-6">
            Create a new explorer and send them into The Beyond
          </p>
          <Link
            href="/create"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Explorer
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">Your Explorers</h3>
          <p className="text-3xl font-bold text-gray-900">
            {legacy?.totalExplorers || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">Returned Safely</h3>
          <p className="text-3xl font-bold text-green-600">
            {legacy?.totalReturns || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">Lost to The Beyond</h3>
          <p className="text-3xl font-bold text-red-600">
            {legacy?.totalDeaths || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">Discoveries</h3>
          <p className="text-3xl font-bold text-amber-600">
            {legacy?.totalDiscoveries || 0}
          </p>
        </div>
      </div>

      {/* World State */}
      {worldState && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">World Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Total Explorers Ever</span>
              <p className="text-2xl font-bold text-gray-900">
                {worldState.totalExplorersEver}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Returns</span>
              <p className="text-2xl font-bold text-green-600">
                {worldState.totalReturnsEver}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Deaths</span>
              <p className="text-2xl font-bold text-red-600">
                {worldState.totalDeathsEver}
              </p>
            </div>
          </div>

          {worldState.discoveries && worldState.discoveries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Recent Discoveries
              </h3>
              <div className="space-y-2">
                {worldState.discoveries.slice(0, 5).map((discovery) => (
                  <div
                    key={discovery.id}
                    className="bg-amber-50 rounded p-3 border border-amber-100"
                  >
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">
                        {discovery.discoveredByExplorer}
                      </span>{' '}
                      discovered something in{' '}
                      <span className="font-medium">{discovery.region}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
