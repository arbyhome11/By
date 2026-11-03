import React from 'react';
import { CloudCheck, CloudOff, RefreshCw, Users, ShieldCheck, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TopBar: React.FC = () => {
  const {
    couple,
    currentUser,
    partnerUser,
    switchDemoPartner,
    isOnline,
    isSynced,
    pendingOfflineCount,
    isSupabaseLive,
    setActiveTab,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 dark:bg-[#181615]/90 backdrop-blur-md border-b border-[#E8DFD5] dark:border-[#2E2824] safe-top">
      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Couple Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C85A32] to-[#FB7185] flex items-center justify-center text-white shadow-sm shrink-0">
            <Heart size={16} fill="white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] truncate flex items-center gap-1.5 leading-tight">
              {couple.name || 'Me & You'}
            </h1>
            <p className="text-[11px] text-[#8C827A] dark:text-[#9E948C] truncate font-medium">
              {couple.city_a || 'London'} ⇄ {couple.city_b || 'Tokyo'}
            </p>
          </div>
        </div>

        {/* Status Indicators & Demo Partner Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sync / Offline Status Pill */}
          <button
            onClick={() => setActiveTab('settings')}
            title={isOnline ? (isSynced ? 'Synced with Supabase' : 'Syncing changes...') : 'Offline mode'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              !isOnline
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : isSynced
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
          >
            {!isOnline ? (
              <>
                <CloudOff size={12} className="text-amber-600" />
                <span>Offline {pendingOfflineCount > 0 ? `(${pendingOfflineCount})` : ''}</span>
              </>
            ) : isSynced ? (
              <>
                <CloudCheck size={12} className="text-emerald-600" />
                <span>Synced</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} className="animate-spin text-blue-600" />
                <span>Syncing</span>
              </>
            )}
          </button>

          {/* Quick Partner Switcher for previewing both perspectives */}
          <button
            onClick={switchDemoPartner}
            title={`Currently viewing as ${currentUser.display_name}. Click to switch to ${partnerUser.display_name}.`}
            className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-[#F2EDE4] dark:bg-[#25211E] hover:bg-[#E8E1D5] dark:hover:bg-[#322C28] text-[#524A43] dark:text-[#D5CCC1] rounded-full text-[11px] font-medium border border-[#E0D7CC] dark:border-[#3A332E] transition-all cursor-pointer active:scale-95 min-h-[36px]"
          >
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&q=80'}
              alt={currentUser.display_name}
              className="w-4 h-4 rounded-full object-cover border border-[#C85A32]"
            />
            <span className="font-bold text-[#C85A32]">{currentUser.display_name}</span>
            <span className="text-[10px] text-[#8C827A]">⇄ {partnerUser.display_name}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
