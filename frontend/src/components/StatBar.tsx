'use client';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export function StatBar({ label, value, max = 10, color = 'bg-blue-500' }: StatBarProps) {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{value}/{max}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface HealthBarProps {
  health: number;
  maxHealth?: number;
}

export function HealthBar({ health, maxHealth = 100 }: HealthBarProps) {
  const percentage = (health / maxHealth) * 100;
  let color = 'bg-green-500';
  if (percentage < 30) color = 'bg-red-500';
  else if (percentage < 60) color = 'bg-yellow-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">Health</span>
        <span className="text-gray-500">{health}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
