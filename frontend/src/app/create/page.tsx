'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExplorerStats,
  Specialty,
  TrialScenario,
  Keepsake,
  Item,
  PlayerItem,
} from '@/lib/types';
import {
  rollExplorer,
  getTrialScenarios,
  completeTrial,
  createExplorer,
  getKeepsakes,
  getGuildItems,
  getUserLegacy,
} from '@/lib/api';
import { StatBar } from '@/components/StatBar';
import { ItemList } from '@/components/ItemCard';
import { TrialScenarioCard, TrialProgress } from '@/components/TrialScenario';

type CreateStep = 'roll' | 'equip' | 'trial' | 'finalize';

export default function CreateExplorerPage() {
  const router = useRouter();
  const [step, setStep] = useState<CreateStep>('roll');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Roll step state
  const [stats, setStats] = useState<ExplorerStats | null>(null);
  const [specialty, setSpecialty] = useState<Specialty | null>(null);

  // Equip step state
  const [guildItems, setGuildItems] = useState<Item[]>([]);
  const [playerItems, setPlayerItems] = useState<PlayerItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Trial step state
  const [scenarios, setScenarios] = useState<TrialScenario[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [trialAnswers, setTrialAnswers] = useState<{ scenarioId: string; optionIndex: number }[]>([]);
  const [personalityId, setPersonalityId] = useState<string | null>(null);

  // Finalize step state
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [name, setName] = useState('');
  const [selectedKeepsake, setSelectedKeepsake] = useState<string | null>(null);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  // Initial roll
  useEffect(() => {
    if (userId && step === 'roll' && !stats) {
      handleRoll();
    }
  }, [userId, step]);

  const handleRoll = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rollExplorer(userId);
      setStats(result.stats);
      setSpecialty(result.specialty);
    } catch (err) {
      setError('Failed to roll stats');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRoll = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Load data for next steps
      const [guildData, legacyData, keepsakeData, scenarioData] = await Promise.all([
        getGuildItems(),
        getUserLegacy(userId),
        getKeepsakes(),
        getTrialScenarios(),
      ]);

      setGuildItems(guildData.items);
      setPlayerItems(legacyData.items);
      setKeepsakes(keepsakeData.keepsakes);
      setScenarios(scenarioData.scenarios);
      setStep('equip');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, itemId];
    });
  };

  const handleTrialAnswer = async (optionIndex: number) => {
    const scenario = scenarios[currentScenarioIndex];
    const newAnswers = [...trialAnswers, { scenarioId: scenario.id, optionIndex }];
    setTrialAnswers(newAnswers);

    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex((prev) => prev + 1);
    } else {
      // Complete trial
      setLoading(true);
      try {
        const result = await completeTrial(newAnswers);
        setPersonalityId(result.personalityId);

        // Apply stat bonuses
        if (stats && result.statBonuses) {
          setStats({
            vigor: Math.min(10, stats.vigor + (result.statBonuses.vigor || 0)),
            cunning: Math.min(10, stats.cunning + (result.statBonuses.cunning || 0)),
            resolve: Math.min(10, stats.resolve + (result.statBonuses.resolve || 0)),
            fortune: Math.min(10, stats.fortune + (result.statBonuses.fortune || 0)),
          });
        }

        setStep('finalize');
      } catch (err) {
        setError('Failed to complete trial');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreate = async () => {
    if (!userId || !stats || !specialty || !personalityId || !selectedKeepsake || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createExplorer({
        userId,
        name: name.trim(),
        stats,
        specialtyId: specialty.id,
        personalityId,
        keepsake: selectedKeepsake,
        equippedItems: selectedItems,
      });

      router.push(`/explorer/${result.explorer.id}`);
    } catch (err) {
      setError('Failed to create explorer');
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-8">
        {(['roll', 'equip', 'trial', 'finalize'] as CreateStep[]).map((s, i) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full ${
              step === s
                ? 'bg-blue-500'
                : ['roll', 'equip', 'trial', 'finalize'].indexOf(step) > i
                ? 'bg-blue-300'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Roll Step */}
      {step === 'roll' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Roll Your Explorer
          </h1>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Rolling...</div>
          ) : stats && specialty ? (
            <>
              <div className="space-y-4 mb-6">
                <StatBar label="Vigor" value={stats.vigor} color="bg-red-500" />
                <StatBar label="Cunning" value={stats.cunning} color="bg-yellow-500" />
                <StatBar label="Resolve" value={stats.resolve} color="bg-blue-500" />
                <StatBar label="Fortune" value={stats.fortune} color="bg-purple-500" />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
                    <p className="text-sm text-gray-600">{specialty.description}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 capitalize">
                    {specialty.rarity}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRoll}
                  disabled={loading}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Reroll
                </button>
                <button
                  onClick={handleAcceptRoll}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Accept
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Equip Step */}
      {step === 'equip' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Equip Items
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Select up to 2 items ({selectedItems.length}/2)
          </p>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Guild Supplies</h3>
            <ItemList
              items={guildItems}
              selectedIds={selectedItems}
              onSelect={handleItemSelect}
            />
          </div>

          {playerItems.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Collection</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-amber-800">
                  Warning: Items from your collection can be lost if your explorer dies!
                </p>
              </div>
              <ItemList
                items={playerItems.map((pi) => guildItems.find((i) => i.id === pi.itemId)!).filter(Boolean)}
                playerItems={playerItems}
                selectedIds={selectedItems}
                onSelect={handleItemSelect}
              />
            </div>
          )}

          <button
            onClick={() => setStep('trial')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Continue to Trial
          </button>
        </div>
      )}

      {/* Trial Step */}
      {step === 'trial' && scenarios.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            The Trial
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your choices reveal your character
          </p>

          <TrialProgress current={currentScenarioIndex} total={scenarios.length} />

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Determining personality...
            </div>
          ) : (
            <TrialScenarioCard
              scenario={scenarios[currentScenarioIndex]}
              onSelect={handleTrialAnswer}
            />
          )}
        </div>
      )}

      {/* Finalize Step */}
      {step === 'finalize' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Final Details
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explorer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keepsake
              </label>
              <div className="space-y-2">
                {keepsakes.map((keepsake) => (
                  <button
                    key={keepsake.id}
                    onClick={() => setSelectedKeepsake(keepsake.id)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedKeepsake === keepsake.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {keepsake.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
              {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>Vigor: {stats.vigor}</div>
                  <div>Cunning: {stats.cunning}</div>
                  <div>Resolve: {stats.resolve}</div>
                  <div>Fortune: {stats.fortune}</div>
                </div>
              )}
              {specialty && (
                <p className="text-sm text-gray-600">
                  Specialty: <span className="font-medium">{specialty.name}</span>
                </p>
              )}
              {personalityId && (
                <p className="text-sm text-gray-600 capitalize">
                  Personality: <span className="font-medium">{personalityId}</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Items: <span className="font-medium">{selectedItems.length}</span>
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !name.trim() || !selectedKeepsake}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Send Into The Beyond'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
