import { NotificationSettings } from '../types/database';

const SETTINGS_KEY = 'me_you_notification_settings';
const LAST_MILESTONE_NOTIFIED_KEY = 'me_you_last_milestone_notified';
const LAST_ENCOURAGEMENT_DATE_KEY = 'me_you_last_encouragement_date';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  partnerJournal: true,
  partnerReunionEdit: true,
  countdownMilestones: true,
  communityInteractions: true,
  dailyEncouragement: true,
  encouragementTime: '09:00',
};

export function getStoredNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save notification settings:', err);
  }
}

export async function requestWebPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const settings = getStoredNotificationSettings();
      saveNotificationSettings({ ...settings, enabled: true });
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export async function dispatchAppNotification(
  title: string,
  body: string,
  category: keyof NotificationSettings | 'test' = 'test'
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const settings = getStoredNotificationSettings();
  if (!settings.enabled && category !== 'test') return;

  // Check specific category toggle
  if (category !== 'test' && typeof settings[category] === 'boolean' && !settings[category]) {
    return;
  }

  const options: any = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/apple-touch-icon.png',
    tag: `me-you-${category}-${Date.now()}`,
    renotify: true,
    data: { url: '/' },
  };

  // Try service worker showNotification first (native mobile push behavior)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch (e) {
    // Fall back to standard Notification constructor
  }

  try {
    new Notification(title, options);
  } catch (err) {
    console.warn('Could not trigger Notification directly:', err);
  }
}

// Milestone calculations (30, 7, 1 days & day itself)
export function checkAndNotifyMilestones(reunionDateStr: string | null, partnerName = 'Your partner') {
  if (!reunionDateStr) return;

  const settings = getStoredNotificationSettings();
  if (!settings.enabled || !settings.countdownMilestones) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(reunionDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const notifiedKey = `${reunionDateStr}_${diffDays}`;
  const lastNotified = localStorage.getItem(LAST_MILESTONE_NOTIFIED_KEY);
  if (lastNotified === notifiedKey) return; // already notified today for this milestone

  if (diffDays === 30) {
    dispatchAppNotification(
      '🗓️ 30 Days Left!',
      `Exactly one month until you and ${partnerName} reunite! The countdown is getting closer.`,
      'countdownMilestones'
    );
    localStorage.setItem(LAST_MILESTONE_NOTIFIED_KEY, notifiedKey);
  } else if (diffDays === 7) {
    dispatchAppNotification(
      '✨ 1 Week To Go!',
      `Only 7 days until your reunion! Have you started packing yet?`,
      'countdownMilestones'
    );
    localStorage.setItem(LAST_MILESTONE_NOTIFIED_KEY, notifiedKey);
  } else if (diffDays === 1) {
    dispatchAppNotification(
      '✈️ Tomorrow is the Day!',
      `In just 24 hours, you and ${partnerName} will be in each other's arms!`,
      'countdownMilestones'
    );
    localStorage.setItem(LAST_MILESTONE_NOTIFIED_KEY, notifiedKey);
  } else if (diffDays === 0) {
    dispatchAppNotification(
      '💖 Happy Reunion Day!',
      `Today is the day! Enjoy every precious second together.`,
      'countdownMilestones'
    );
    localStorage.setItem(LAST_MILESTONE_NOTIFIED_KEY, notifiedKey);
  }
}

// Daily encouragement messages pool
const ENCOURAGEMENT_QUOTES = [
  "Distance means so little when someone means so much.",
  "Every second apart is just one second closer to being together again.",
  "You're both sleeping under the same moon and dreaming the same dream.",
  "No distance of place or lapse of time can lessen the love you share.",
  "Together forever, never apart. Sometimes in distance, but never in heart.",
  "The best things in life are worth waiting for, and you have each other.",
];

export function checkDailyEncouragement() {
  const settings = getStoredNotificationSettings();
  if (!settings.enabled || !settings.dailyEncouragement) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastSent = localStorage.getItem(LAST_ENCOURAGEMENT_DATE_KEY);
  if (lastSent === todayStr) return;

  const now = new Date();
  const [targetH, targetM] = (settings.encouragementTime || '09:00').split(':').map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  if (currentH >= targetH && (currentH > targetH || currentM >= targetM)) {
    const randomQuote = ENCOURAGEMENT_QUOTES[Math.floor(Math.random() * ENCOURAGEMENT_QUOTES.length)];
    dispatchAppNotification("Today's Love Encouragement 💌", randomQuote, 'dailyEncouragement');
    localStorage.setItem(LAST_ENCOURAGEMENT_DATE_KEY, todayStr);
  }
}
