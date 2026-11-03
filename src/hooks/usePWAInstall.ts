import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const VISIT_COUNT_KEY = 'me_you_visit_count';
const DISMISSED_KEY = 'me_you_install_dismissed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    // 1. Standalone / installed detection
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // 2. iOS Safari detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Track visit count (show after second visit)
    let visitCount = 1;
    try {
      const prev = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
      visitCount = prev + 1;
      localStorage.setItem(VISIT_COUNT_KEY, visitCount.toString());
    } catch (e) {
      // ignore
    }

    const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true';

    // Show banner after 2nd visit if not dismissed and not already installed
    if (visitCount >= 2 && !dismissed && !isStandalone) {
      setShouldShowBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShouldShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShouldShowBanner(false);
        return true;
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
    }
    return false;
  };

  const dismissBanner = () => {
    setShouldShowBanner(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    shouldShowBanner,
    install,
    dismissBanner,
  };
}
