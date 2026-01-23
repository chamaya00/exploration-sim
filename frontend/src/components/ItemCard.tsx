'use client';

import { Item, PlayerItem } from '@/lib/types';

interface ItemCardProps {
  item: Item;
  playerItem?: PlayerItem;
  selected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

const rarityColors = {
  common: 'border-gray-300 bg-gray-50',
  uncommon: 'border-green-400 bg-green-50',
  rare: 'border-blue-400 bg-blue-50',
  legendary: 'border-purple-400 bg-purple-50',
};

const rarityTextColors = {
  common: 'text-gray-600',
  uncommon: 'text-green-600',
  rare: 'text-blue-600',
  legendary: 'text-purple-600',
};

export function ItemCard({
  item,
  playerItem,
  selected = false,
  onClick,
  showDetails = false,
}: ItemCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border-2 transition-all cursor-pointer
        ${rarityColors[item.rarity]}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${onClick ? 'hover:shadow-md' : ''}
      `}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-900">{item.name}</h4>
        <span className={`text-xs font-medium ${rarityTextColors[item.rarity]} capitalize`}>
          {item.rarity}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
      {showDetails && (
        <>
          <p className="text-xs text-gray-500 italic mt-2">{item.flavorText}</p>
          {playerItem?.foundBy && (
            <p className="text-xs text-gray-400 mt-2">
              Found by {playerItem.foundBy} in {playerItem.foundIn}
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface ItemListProps {
  items: Item[];
  playerItems?: PlayerItem[];
  selectedIds?: string[];
  onSelect?: (itemId: string) => void;
  maxSelectable?: number;
}

export function ItemList({
  items,
  playerItems,
  selectedIds = [],
  onSelect,
  maxSelectable = 2,
}: ItemListProps) {
  const handleSelect = (itemId: string) => {
    if (!onSelect) return;

    const isSelected = selectedIds.includes(itemId);
    if (!isSelected && selectedIds.length >= maxSelectable) {
      // Can't select more
      return;
    }

    onSelect(itemId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => {
        const playerItem = playerItems?.find((pi) => pi.itemId === item.id);
        return (
          <ItemCard
            key={playerItem?.id || item.id}
            item={item}
            playerItem={playerItem}
            selected={selectedIds.includes(playerItem?.id || item.id)}
            onClick={() => handleSelect(playerItem?.id || item.id)}
            showDetails
          />
        );
      })}
    </div>
  );
}
