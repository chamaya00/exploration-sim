'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Explorer, JournalEntry } from '@/lib/types';
import { getExplorer, recallExplorer } from '@/lib/api';
import { StatBar, HealthBar } from '@/components/StatBar';
import { JournalList } from '@/components/JournalEntry';

const regionNames: Record<string, string> = {
  the_gate: 'The Gate',
  mistwood: 'The Mistwood',
  crystal_caves: 'Crystal Caves',
  the_depths: 'The Depths',
  the_summit: 'The Summit',
};

const statusInfo: Record<string, { color: string; label: string; description: string }> = {
  active: {
    color: 'bg-green-100 text-green-800',
    label: 'Active',
    description: 'Exploring The Beyond',
  },
  returning: {
    color: 'bg-purple-100 text-purple-800',
    label: 'Returning',
    description: 'On their way home',
  },
  returned: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Returned',
    description: 'Successfully returned from The Beyond',
  },
  dead: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Lost',
    description: 'Lost to The Beyond',
  },
};

export default function ExplorerPage() {
  const params = useParams();
  const router = useRouter();
  const [explorer, setExplorer] = useState<Explorer | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalling, setRecalling] = useState(false);
  const [recallInfo, setRecallInfo] = useState<{ estimatedDays: number; survivalChance: number } | null>(null);

  const explorerId = params.id as string;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getExplorer(explorerId);
        setExplorer(data.explorer);
        setJournal(data.journal);
      } catch (err) {
        setError('Failed to load explorer');
      } finally {
        setLoading(false);
      }
    };

    if (explorerId) {
      load();
    }
  }, [explorerId]);

  // Refresh data periodically for active explorers
  useEffect(() => {
    if (!explorer || (explorer.status !== 'active' && explorer.status !== 'returning')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const data = await getExplorer(explorerId);
        setExplorer(data.explorer);
        setJournal(data.journal);
      } catch (err) {
        console.error('Failed to refresh explorer data');
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [explorer, explorerId]);

  const handleRecall = async () => {
    if (!explorer) return;

    setRecalling(true);
    try {
      const result = await recallExplorer(explorer.id);
      setRecallInfo({
        estimatedDays: result.estimatedDays,
        survivalChance: result.survivalChance,
      });

      // Refresh explorer data
      const data = await getExplorer(explorerId);
      setExplorer(data.explorer);
      setJournal(data.journal);
    } catch (err) {
      setError('Failed to initiate recall');
    } finally {
      setRecalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !explorer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Explorer not found'}
      </div>
    );
  }

  const status = statusInfo[explorer.status];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{explorer.name}</h1>
            <p className="text-gray-600">{regionNames[explorer.currentRegion]}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <p className="text-gray-500 mb-6">{status.description}</p>

        {/* Health (for active/returning) */}
        {(explorer.status === 'active' || explorer.status === 'returning') && (
          <div className="mb-6">
            <HealthBar health={explorer.health} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatBar label="Vigor" value={explorer.stats.vigor} color="bg-red-500" />
          <StatBar label="Cunning" value={explorer.stats.cunning} color="bg-yellow-500" />
          <StatBar label="Resolve" value={explorer.stats.resolve} color="bg-blue-500" />
          <StatBar label="Fortune" value={explorer.stats.fortune} color="bg-purple-500" />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-500">Days Alive</span>
            <p className="font-semibold text-gray-900">{explorer.daysAlive.toFixed(1)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Items Found</span>
            <p className="font-semibold text-gray-900">{explorer.foundItems.length}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Specialty</span>
            <p className="font-semibold text-gray-900 capitalize">{explorer.specialtyId.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Personality</span>
            <p className="font-semibold text-gray-900 capitalize">{explorer.personalityId}</p>
          </div>
        </div>

        {/* Returning info */}
        {explorer.status === 'returning' && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800">
              <span className="font-semibold">{explorer.recallDaysRemaining.toFixed(1)} days</span> until return
            </p>
            {recallInfo && (
              <p className="text-sm text-purple-600 mt-1">
                Estimated survival chance: {Math.round(recallInfo.survivalChance * 100)}%
              </p>
            )}
          </div>
        )}

        {/* Death info */}
        {explorer.status === 'dead' && explorer.causeOfDeath && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-800 italic">{explorer.causeOfDeath}</p>
          </div>
        )}

        {/* Recall button */}
        {explorer.status === 'active' && !explorer.isRecalling && (
          <div className="mt-6">
            <button
              onClick={handleRecall}
              disabled={recalling}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {recalling ? 'Initiating Recall...' : 'Recall Explorer'}
            </button>
            <p className="text-sm text-gray-500 text-center mt-2">
              The journey home is dangerous. Your explorer may not survive.
            </p>
          </div>
        )}

        {/* Create new explorer button (for returned/dead) */}
        {(explorer.status === 'returned' || explorer.status === 'dead') && (
          <div className="mt-6">
            <Link
              href="/create"
              className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center"
            >
              Send Another Explorer
            </Link>
          </div>
        )}
      </div>

      {/* Found Items */}
      {explorer.foundItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Found Items</h2>
          <div className="space-y-3">
            {explorer.foundItems.map((item, index) => (
              <div
                key={index}
                className="bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <p className="font-medium text-gray-900 capitalize">
                  {item.itemId.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-gray-500">
                  Found in {regionNames[item.foundInRegion]} on day {item.foundOnDay}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Journal</h2>
        <JournalList entries={journal} />
      </div>
    </div>
  );
}
