import { SupabaseClient } from '@supabase/supabase-js';

export interface QueuedMutation {
  id: string;
  table: 'journal_entries' | 'plans' | 'important_dates' | 'couples' | 'entry_photos' | 'messages' | 'conversations' | 'user_reports' | 'user_blocks';
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = 'me_you_offline_mutations';
const LAST_SYNC_KEY = 'me_you_last_synced_at';
const SNAPSHOT_PREFIX = 'me_you_cache_';

export function getOfflineQueue(): QueuedMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse offline queue:', err);
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedMutation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: queue.length } }));
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
}

export function enqueueOfflineMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): QueuedMutation {
  const item: QueuedMutation = {
    ...mutation,
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  const queue = getOfflineQueue();
  // If there's an existing pending update for this exact row, keep latest edit
  const existingIdx = queue.findIndex(
    q => q.table === item.table && q.action === item.action && q.data?.id && q.data.id === item.data?.id
  );

  if (existingIdx >= 0) {
    // Conflict resolution: latest edit wins
    queue[existingIdx] = item;
  } else {
    queue.push(item);
  }

  saveOfflineQueue(queue);
  return item;
}

export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSyncTime(isoString: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, isoString);
}

// Cache snapshot for offline opening
export function cacheTableData<T>(tableName: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${SNAPSHOT_PREFIX}${tableName}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to cache table ${tableName}:`, err);
  }
}

export function getCachedTableData<T>(tableName: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${tableName}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Replay offline mutations when connectivity is restored
export async function syncOfflineQueue(supabase: SupabaseClient): Promise<{ success: boolean; syncedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: true, syncedCount: 0 };

  let syncedCount = 0;
  const remaining: QueuedMutation[] = [];

  for (const item of queue) {
    try {
      if (item.action === 'insert') {
        const { error } = await supabase.from(item.table).upsert(item.data);
        if (error) throw error;
        syncedCount++;
      } else if (item.action === 'update') {
        const { error } = await supabase.from(item.table).update(item.data).eq('id', item.data.id);
        if (error) throw error;
        syncedCount++;
      } else if (item.action === 'delete') {
        const { error } = await supabase.from(item.table).delete().eq('id', item.data.id);
        if (error) throw error;
        syncedCount++;
      }
    } catch (err) {
      console.warn(`Failed syncing mutation ${item.id} on table ${item.table}:`, err);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  if (syncedCount > 0) {
    setLastSyncTime(new Date().toISOString());
  }

  return { success: remaining.length === 0, syncedCount };
}
