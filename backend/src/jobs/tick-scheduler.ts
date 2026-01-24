import cron from 'node-cron';
import { runSimulationTick, TICK_CONFIG } from '../simulation/tick';

let isRunning = false;

export function startTickScheduler(): void {
  console.log(`Starting tick scheduler (every ${TICK_CONFIG.intervalMinutes} minutes)`);

  // Run every TICK_CONFIG.intervalMinutes minutes
  // Cron format: minute hour day month weekday
  cron.schedule(`*/${TICK_CONFIG.intervalMinutes} * * * *`, async () => {
    if (isRunning) {
      console.log('Tick already running, skipping...');
      return;
    }

    isRunning = true;
    console.log(`[${new Date().toISOString()}] Running simulation tick...`);

    try {
      const result = await runSimulationTick();
      console.log(`Tick ${result.tickNumber} complete: ${result.explorersProcessed} explorers processed`);
      if (result.events.length > 0) {
        console.log('Events:', result.events.join(', '));
      }
    } catch (error) {
      console.error('Error running tick:', error);
    } finally {
      isRunning = false;
    }
  });

  console.log('Tick scheduler started');
}

// Manual tick function for testing
export async function runManualTick(): Promise<{
  tickNumber: number;
  explorersProcessed: number;
  events: string[];
}> {
  if (isRunning) {
    throw new Error('Tick already running');
  }

  isRunning = true;
  try {
    const result = await runSimulationTick();
    return result;
  } finally {
    isRunning = false;
  }
}
