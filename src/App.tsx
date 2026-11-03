/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { Navigation } from './components/Navigation';
import { OfflinePill } from './components/OfflinePill';
import { InstallBanner } from './components/InstallBanner';
import { HomeTab } from './components/HomeTab';
import { JournalTab } from './components/JournalTab';
import { GalleryTab } from './components/GalleryTab';
import { PlansAndDatesTab } from './components/PlansAndDatesTab';
import { CommunityAndExploreTab } from './components/CommunityAndExploreTab';
import { MessagesTab } from './components/MessagesTab';
import { SettingsTab } from './components/SettingsTab';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';

const MainApp: React.FC = () => {
  const { activeTab } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#181615] text-[#2D2825] dark:text-[#F3EFEA] flex flex-col transition-colors selection:bg-[#C85A32]/20 font-sans">
      {/* Top Header */}
      <TopBar />

      {/* Offline Status Warning Pill */}
      <OfflinePill />

      {/* PWA Install Promotion Banner (shown on 2nd visit) */}
      <div className="max-w-xl mx-auto w-full">
        <InstallBanner />
      </div>

      {/* Main Tab Screen Area */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-2">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'journal' && <JournalTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'plans' && <PlansAndDatesTab />}
        {activeTab === 'community' && <CommunityAndExploreTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Tab Navigation with safe-area support */}
      <Navigation />

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
