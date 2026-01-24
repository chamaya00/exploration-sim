'use client';

import { JournalEntry as JournalEntryType } from '@/lib/types';

interface JournalEntryProps {
  entry: JournalEntryType;
}

const eventTypeStyles: Record<string, string> = {
  quiet: 'border-l-gray-300',
  discovery: 'border-l-yellow-400 bg-yellow-50',
  danger: 'border-l-red-400 bg-red-50',
  injury: 'border-l-orange-400 bg-orange-50',
  item_found: 'border-l-green-400 bg-green-50',
  movement: 'border-l-blue-300',
  returning: 'border-l-purple-400 bg-purple-50',
  death: 'border-l-black bg-gray-100',
  secret: 'border-l-amber-500 bg-amber-50',
};

export function JournalEntryCard({ entry }: JournalEntryProps) {
  const style = eventTypeStyles[entry.eventType] || eventTypeStyles.quiet;

  return (
    <div
      className={`p-4 border-l-4 rounded-r-lg ${style} ${
        entry.isSignificant ? 'shadow-sm' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-gray-500">
          Day {entry.day}
        </span>
        {entry.isSignificant && (
          <span className="text-xs font-semibold text-amber-600">
            Significant
          </span>
        )}
      </div>
      <p className="text-gray-800 whitespace-pre-line">{entry.entryText}</p>
    </div>
  );
}

interface JournalListProps {
  entries: JournalEntryType[];
  maxEntries?: number;
}

export function JournalList({ entries, maxEntries }: JournalListProps) {
  const displayedEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

  return (
    <div className="space-y-3">
      {displayedEntries.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No journal entries yet.</p>
      ) : (
        displayedEntries.map((entry) => (
          <JournalEntryCard key={entry.id} entry={entry} />
        ))
      )}
    </div>
  );
}
