import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflinePill: React.FC = () => {
  const { isOnline, pendingOfflineCount, triggerManualSync } = useApp();

  if (isOnline && pendingOfflineCount === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all animate-bounce duration-1000">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-lg text-xs font-semibold backdrop-blur-md border bg-amber-500/90 text-white border-amber-400">
        <WifiOff size={13} className="shrink-0" />
        <span>
          {!isOnline
            ? `Offline, changes will sync later${pendingOfflineCount > 0 ? ` (${pendingOfflineCount} queued)` : ''}`
            : `Syncing ${pendingOfflineCount} queued offline edits...`}
        </span>
        {isOnline && pendingOfflineCount > 0 && (
          <button
            onClick={() => triggerManualSync()}
            className="ml-1 p-0.5 hover:bg-amber-600 rounded-full transition-colors"
            title="Retry sync now"
          >
            <RefreshCw size={11} className="animate-spin" />
          </button>
        )}
      </div>
    </div>
  );
};
