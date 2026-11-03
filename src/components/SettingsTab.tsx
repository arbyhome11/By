import React, { useState, useEffect } from 'react';
import {
  Settings,
  Share2,
  Copy,
  Check,
  Bell,
  Cloud,
  Database,
  Download,
  Upload,
  Trash2,
  Smartphone,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Clock,
  Send,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getStoredNotificationSettings,
  saveNotificationSettings,
  requestWebPushPermission,
  dispatchAppNotification,
} from '../lib/pushNotifications';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
} from '../lib/supabase';
import { getLastSyncTime } from '../lib/offlineQueue';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const SettingsTab: React.FC = () => {
  const {
    couple,
    currentUser,
    partnerUser,
    isOnline,
    isSynced,
    pendingOfflineCount,
    isSupabaseLive,
    updateCouple,
    updateProfile,
    exportCoupleData,
    importCoupleData,
    deleteAccountAndCouple,
    triggerManualSync,
  } = useApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState(getStoredNotificationSettings());
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showNotifPermissionModal, setShowNotifPermissionModal] = useState(false);

  // Invite code state
  const [copiedCode, setCopiedCode] = useState(false);

  // Supabase SQL & Manual guide modal
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Credentials config
  const creds = getSupabaseCredentials();
  const [customUrl, setCustomUrl] = useState(creds.url);
  const [customKey, setCustomKey] = useState(creds.anonKey);
  const [savedCredsNotice, setSavedCredsNotice] = useState(false);

  // Profile & Couple form fields
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>(currentUser.gender || 'Male');
  const [myCity, setMyCity] = useState(currentUser.city);
  const [myTimezone, setMyTimezone] = useState(currentUser.timezone);
  const [coupleName, setCoupleName] = useState(couple.name);
  const [tagline, setTagline] = useState(couple.tagline);
  const [hideLocation, setHideLocation] = useState(couple.hide_exact_location);

  // Account deletion safety confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const lastSyncTime = getLastSyncTime();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(couple.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareCode = async () => {
    const shareData = {
      title: 'Join our Me & You couple space',
      text: `Join our private space on Me & You! Use our 6-character invite code: ${couple.invite_code} (expires in 7 days).`,
      url: window.location.origin,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      handleCopyCode();
    }
  };

  const handleToggleMasterNotification = async () => {
    if (!notifSettings.enabled) {
      if (notifPermission !== 'granted') {
        setShowNotifPermissionModal(true);
        return;
      }
      const updated = { ...notifSettings, enabled: true };
      setNotifSettings(updated);
      saveNotificationSettings(updated);
    } else {
      const updated = { ...notifSettings, enabled: false };
      setNotifSettings(updated);
      saveNotificationSettings(updated);
    }
  };

  const handleConfirmNotificationPermission = async () => {
    const result = await requestWebPushPermission();
    setNotifPermission(result);
    setShowNotifPermissionModal(false);
    if (result === 'granted') {
      const updated = { ...notifSettings, enabled: true };
      setNotifSettings(updated);
      saveNotificationSettings(updated);
      dispatchAppNotification('Notifications Enabled ✨', 'You will now receive milestone and partner updates!');
    }
  };

  const handleUpdateNotifSubtype = (key: keyof typeof notifSettings, val: any) => {
    const updated = { ...notifSettings, [key]: val };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSaveProfileAndCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      display_name: displayName,
      gender,
      city: myCity,
      timezone: myTimezone,
    });
    await updateCouple({
      name: coupleName,
      tagline,
      hide_exact_location: hideLocation,
    });
    alert('Settings saved successfully!');
  };

  const handleSaveCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl && customKey) {
      saveCustomSupabaseCredentials(customUrl, customKey);
      setSavedCredsNotice(true);
      setTimeout(() => setSavedCredsNotice(false), 3000);
      window.location.reload();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importCoupleData(content);
      if (success) {
        alert('Couple data successfully imported!');
      } else {
        alert('Failed to parse backup JSON. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
          <Settings size={20} className="text-[#C85A32]" />
          <span>Space Settings & Sync</span>
        </h2>
        <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
          Manage your invite code, realtime sync, notifications, and Supabase database
        </p>
      </div>

      {/* Sync & Connection Status Card */}
      <section className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                !isOnline
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40'
                  : isSynced
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950/40'
              }`}
            >
              <Cloud size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                  {!isOnline
                    ? 'Offline Mode'
                    : isSynced
                    ? 'Synced with Supabase'
                    : 'Syncing in Progress...'}
                </h3>
                <span
                  className={`w-2 h-2 rounded-full ${
                    !isOnline ? 'bg-amber-500' : isSynced ? 'bg-emerald-500' : 'bg-blue-500 animate-ping'
                  }`}
                />
              </div>
              <p className="text-[11px] text-[#8C827A] mt-0.5">
                {!isOnline
                  ? `${pendingOfflineCount} mutations queued locally. Will sync automatically once reconnected.`
                  : isSupabaseLive
                  ? `Live Realtime active • Last sync: ${lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Just now'}`
                  : 'Local offline replica active with seed data. Connect Supabase below to enable cross-device sync.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => triggerManualSync()}
            className="px-3 py-1.5 rounded-xl border border-[#D9D0C5] dark:border-[#403833] text-xs font-semibold text-[#524A43] dark:text-[#D5CCC1] hover:border-[#C85A32] cursor-pointer min-h-[36px]"
          >
            Sync Now
          </button>
        </div>
      </section>

      {/* Invite Code Card */}
      <section className="p-5 rounded-3xl bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#211D1A] dark:to-[#1B1715] border-2 border-dashed border-[#C85A32]/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A32]">
              Space Invite Code
            </span>
            <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA] mt-0.5">
              Invite Your Partner (1 of 2 joined)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Expires in 7 days
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-[#28231F] rounded-2xl border border-[#E8DFD5] dark:border-[#38302A] flex items-center justify-between">
          <div className="font-mono text-2xl font-black text-[#C85A32] tracking-widest selection:bg-[#C85A32]/20">
            {couple.invite_code || '7K9M3P'}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs font-semibold text-[#524A43] dark:text-[#D5CCC1] border border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32] transition-colors min-h-[36px] cursor-pointer"
            >
              {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShareCode}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E29] transition-all min-h-[36px] cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#8C827A] leading-relaxed">
          Codes use only distinct characters without confusing 0/O/1/I. A couple space has exactly 2 members.
        </p>
      </section>

      {/* Push Notifications Configuration */}
      <section className="p-5 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                Push Notifications
              </h3>
              <p className="text-[11px] text-[#8C827A]">
                Instant web push alerts for partner actions and countdown milestones
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={notifSettings.enabled}
              onChange={handleToggleMasterNotification}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[14px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C85A32]"></div>
          </label>
        </div>

        {notifSettings.enabled && (
          <div className="space-y-3 pt-3 border-t border-[#E8DFD5] dark:border-[#38302A]">
            {/* Sub-toggle: Partner Journal */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                  Partner adds a journal entry
                </span>
                <span className="text-[10px] text-[#8C827A]">
                  Notifies you when your partner saves a memory
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.partnerJournal}
                onChange={(e) => handleUpdateNotifSubtype('partnerJournal', e.target.checked)}
                className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
              />
            </div>

            {/* Sub-toggle: Reunion Date Edit */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                  Partner edits reunion date
                </span>
                <span className="text-[10px] text-[#8C827A]">
                  Alerts you when the countdown date changes
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.partnerReunionEdit}
                onChange={(e) => handleUpdateNotifSubtype('partnerReunionEdit', e.target.checked)}
                className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
              />
            </div>

            {/* Sub-toggle: Countdown Milestones */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                  Countdown milestones (30, 7, 1 days & day itself)
                </span>
                <span className="text-[10px] text-[#8C827A]">
                  Celebrates every countdown milestone together
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.countdownMilestones}
                onChange={(e) => handleUpdateNotifSubtype('countdownMilestones', e.target.checked)}
                className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
              />
            </div>

            {/* Sub-toggle: Community Interactions */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                  Reactions & comments on public posts
                </span>
                <span className="text-[10px] text-[#8C827A]">
                  When other couples send hugs, strength, or hearts
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.communityInteractions}
                onChange={(e) => handleUpdateNotifSubtype('communityInteractions', e.target.checked)}
                className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
              />
            </div>

            {/* Sub-toggle: Daily Encouragement */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                  Daily encouragement quote
                </span>
                <span className="text-[10px] text-[#8C827A]">
                  Uplifting quote delivered to your lock screen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={notifSettings.encouragementTime || '09:00'}
                  onChange={(e) => handleUpdateNotifSubtype('encouragementTime', e.target.value)}
                  className="bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-lg px-2 py-1 text-xs"
                />
                <input
                  type="checkbox"
                  checked={notifSettings.dailyEncouragement}
                  onChange={(e) => handleUpdateNotifSubtype('dailyEncouragement', e.target.checked)}
                  className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
                />
              </div>
            </div>

            {/* Test Notification Button */}
            <button
              onClick={() =>
                dispatchAppNotification(
                  'Me & You Web Push Test 💌',
                  'Your notifications are working smoothly across your devices!'
                )
              }
              className="w-full mt-2 py-2 px-3 bg-[#FAF7F2] dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] rounded-xl text-xs font-semibold text-[#C85A32] hover:bg-[#F2EDE4] transition-colors cursor-pointer min-h-[44px]"
            >
              Send Test Notification
            </button>
          </div>
        )}
      </section>

      {/* Supabase SQL Migrations & Manual Setup Guide */}
      <section className="p-5 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                Supabase & SQL Migration
              </h3>
              <p className="text-[11px] text-[#8C827A]">
                Schema, RLS policies, storage buckets & configuration guide
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E29] transition-all min-h-[36px] cursor-pointer"
          >
            <FileCode size={14} />
            <span>View SQL & Checklist</span>
          </button>
        </div>

        {/* Live / Custom Supabase credentials form */}
        <form onSubmit={handleSaveCreds} className="pt-2 border-t border-[#E8DFD5] dark:border-[#38302A] space-y-2">
          <div className="text-[11px] font-bold text-[#6B6159] dark:text-[#A89F95]">
            Configure Supabase Connection (or use .env.example)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="VITE_SUPABASE_URL (e.g. https://xyz.supabase.co)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
            />
            <input
              type="password"
              placeholder="VITE_SUPABASE_ANON_KEY"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#C85A32] text-white text-xs font-semibold rounded-xl hover:bg-[#B34E29] min-h-[36px] cursor-pointer"
            >
              Save Credentials & Connect
            </button>
            <button
              type="button"
              onClick={() => {
                clearCustomSupabaseCredentials();
                window.location.reload();
              }}
              className="px-3 py-1.5 text-xs text-[#8C827A] hover:text-[#2D2825] min-h-[36px] cursor-pointer"
            >
              Reset to Defaults
            </button>
            {savedCredsNotice && (
              <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                Saved! Reloading...
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Edit Profile & Space Details */}
      <form
        onSubmit={handleSaveProfileAndCouple}
        className="p-5 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3.5"
      >
        <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
          Couple Profile & Privacy
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
              Couple Name
            </label>
            <input
              type="text"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              className="w-full bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
            Your Gender <span className="text-[10px] text-[#9C8F85] font-normal">(enforces safe same-gender community DMs)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Female', 'Male', 'Other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer min-h-[42px] ${
                  gender === g
                    ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                    : 'bg-[#FAF7F2] dark:bg-[#28231F] text-[#7A6F66] dark:text-[#D5CCC1] border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
              Your City
            </label>
            <input
              type="text"
              value={myCity}
              onChange={(e) => setMyCity(e.target.value)}
              className="w-full bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
              Your Timezone
            </label>
            <input
              type="text"
              value={myTimezone}
              onChange={(e) => setMyTimezone(e.target.value)}
              placeholder="e.g. Europe/London"
              className="w-full bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
            Couple Tagline
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
          />
        </div>

        {/* Hide exact location toggle */}
        <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA]">
              {hideLocation ? <EyeOff size={14} className="text-[#C85A32]" /> : <Eye size={14} className="text-[#C85A32]" />}
              <span>Hide Exact Location</span>
            </div>
            <p className="text-[10px] text-[#8C827A] mt-0.5">
              When enabled, other couples only see city names and never exact coordinates
            </p>
          </div>
          <input
            type="checkbox"
            checked={hideLocation}
            onChange={(e) => setHideLocation(e.target.checked)}
            className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#C85A32] hover:bg-[#B34E29] text-white py-2.5 rounded-2xl text-xs font-semibold shadow-xs min-h-[44px] cursor-pointer"
        >
          Save Profile & Privacy Changes
        </button>
      </form>

      {/* JSON Backup Export & Import */}
      <section className="p-5 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
          Backup & Export Data
        </h3>
        <p className="text-xs text-[#7A6F66] dark:text-[#A89F95]">
          Download a complete JSON file containing only your couple's private memories, dates, and plans.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportCoupleData}
            className="flex items-center justify-center gap-2 bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] py-2.5 px-3 rounded-2xl text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] hover:border-[#C85A32] min-h-[44px] cursor-pointer"
          >
            <Download size={14} className="text-[#C85A32]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] py-2.5 px-3 rounded-2xl text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] hover:border-[#C85A32] min-h-[44px] cursor-pointer"
          >
            <Upload size={14} className="text-[#C85A32]" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </section>

      {/* Danger Zone: Account Deletion */}
      <section className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle size={18} />
          <h3 className="text-sm font-bold">Safety & Account Deletion</h3>
        </div>
        <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] leading-relaxed">
          Account deletion removes you as a couple member and, if no members remain, permanently deletes all couple data and media.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-xs transition-all min-h-[44px] cursor-pointer"
        >
          Delete Account & Couple Space
        </button>
      </section>

      {/* Permission Explanation Modal */}
      {showNotifPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mb-3">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Enable Me & You Notifications
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1.5 mb-5 leading-relaxed">
              We only send meaningful long-distance alerts: when your partner writes in the journal, when your reunion date draws close (30, 7, 1 day), and optional daily encouragement.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleConfirmNotificationPermission}
                className="w-full bg-[#C85A32] hover:bg-[#B34E29] text-white py-2.5 rounded-2xl text-xs font-semibold min-h-[44px] cursor-pointer"
              >
                Allow Notifications
              </button>
              <button
                onClick={() => setShowNotifPermissionModal(false)}
                className="w-full py-2 text-xs text-[#8C827A] hover:text-[#2D2825] min-h-[44px] cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL & Manual Guide Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsSqlModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Database size={20} className="text-[#C85A32]" />
              <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                Supabase SQL Setup & Checklist
              </h3>
            </div>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              All 14 tables, triggers, RLS policies, storage buckets and realtime publications are pre-configured in <code>/supabase/migrations/20261103_init_schema.sql</code>.
            </p>

            {/* Checklist of what to do manually */}
            <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] space-y-2 text-xs">
              <h4 className="font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>What to do manually in Supabase Dashboard:</span>
              </h4>
              <ul className="space-y-1.5 pl-5 list-disc text-[#524A43] dark:text-[#DDD5CC]">
                <li>
                  <strong>1. SQL Editor:</strong> Paste and run the migration script below to create tables, RLS policies, and triggers.
                </li>
                <li>
                  <strong>2. Authentication &rarr; Providers:</strong> Enable <strong>Google Provider</strong> and paste your Google Cloud Client ID &amp; Secret.
                </li>
                <li>
                  <strong>3. Authentication &rarr; URL Configuration:</strong> Add your app URL (<code>{typeof window !== 'undefined' ? window.location.origin : ''}</code>) to <strong>Site URL</strong> and <strong>Redirect URLs</strong>.
                </li>
                <li>
                  <strong>4. Storage:</strong> Confirm <code>couple-media</code> (private) and <code>public-media</code> (public) buckets exist.
                </li>
                <li>
                  <strong>5. Environment Variables:</strong> Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA]">
                Complete Migration SQL (14 Tables + RLS + Buckets)
              </span>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/supabase/migrations/20261103_init_schema.sql');
                    const text = await res.text();
                    await navigator.clipboard.writeText(text);
                  } catch {
                    await navigator.clipboard.writeText('-- Run /supabase/migrations/20261103_init_schema.sql in Supabase SQL editor');
                  }
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C85A32] text-white rounded-xl text-xs font-semibold hover:bg-[#B34E29] transition-all min-h-[36px] cursor-pointer"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? 'Copied Full SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="p-3 bg-[#181615] rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-[#38302A]">
              <pre>{`-- 1. PROFILES & COUPLES
CREATE TABLE public.profiles (...);
CREATE TABLE public.couples (...);
CREATE TABLE public.couple_members (...);

-- 2. JOURNAL & PHOTOS (max 5)
CREATE TABLE public.journal_entries (...);
CREATE TABLE public.entry_photos (...);

-- 3. PLANS & DATES
CREATE TABLE public.plans (...);
CREATE TABLE public.important_dates (...);

-- 4. POSTS & STORIES (24h)
CREATE TABLE public.posts (...);
CREATE TABLE public.reactions (...);
CREATE TABLE public.comments (...);

-- 5. SOCIAL & SAFETY
CREATE TABLE public.follows (...);
CREATE TABLE public.blocks (...);
CREATE TABLE public.reports (...);

-- 6. RLS POLICIES & BUCKETS
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
INSERT INTO storage.buckets (id, name, public) VALUES ('couple-media', 'couple-media', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('public-media', 'public-media', true);`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-rose-300 dark:border-rose-900 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Delete Account & Space?
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1.5 mb-5 leading-relaxed">
              This action cannot be undone. You will be removed from this couple space, and if you are the last member, all journal entries, photos, plans, and dates will be permanently erased.
            </p>
            <div className="space-y-2">
              <button
                onClick={deleteAccountAndCouple}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-2xl text-xs font-semibold min-h-[44px] cursor-pointer"
              >
                Permanently Delete Everything
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-2 text-xs text-[#8C827A] hover:text-[#2D2825] min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
