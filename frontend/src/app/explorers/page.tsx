'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Explorer } from '@/lib/types';
import { getUserExplorers } from '@/lib/api';
import { ExplorerList } from '@/components/ExplorerCard';

type Tab = 'active' | 'returned' | 'dead';

export default function ExplorersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [explorers, setExplorers] = useState<{
    active: Explorer[];
    returned: Explorer[];
    dead: Explorer[];
  }>({ active: [], returned: [], dead: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserExplorers(userId);
        setExplorers(data);
      } catch (err) {
        setError('Failed to load explorers');
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

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'active', label: 'Active', count: explorers.active.length },
    { id: 'returned', label: 'Returned', count: explorers.returned.length },
    { id: 'dead', label: 'Lost', count: explorers.dead.length },
  ];

  const currentExplorers = explorers[activeTab];
  const emptyMessages: Record<Tab, string> = {
    active: 'No active explorers. Create one to begin!',
    returned: 'No explorers have returned yet.',
    dead: 'No explorers lost... yet.',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Explorers</h1>
        <Link
          href="/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create Explorer
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Explorer list */}
      <ExplorerList
        explorers={currentExplorers}
        emptyMessage={emptyMessages[activeTab]}
      />
    </div>
  );
}
