import React from 'react';
import {
  Heart,
  BookOpen,
  Image as ImageIcon,
  CalendarCheck,
  Sparkles,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, totalUnreadMessagesCount } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'plans', label: 'Plans', icon: CalendarCheck },
    { id: 'community', label: 'Community', icon: Sparkles },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: totalUnreadMessagesCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#181615]/95 backdrop-blur-md border-t border-[#E8DFD5] dark:border-[#2E2824] safe-bottom"
    >
      <div className="max-w-xl mx-auto px-1 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badgeCount = 'badge' in item ? (item as any).badge : 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center min-h-[50px] py-1 transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'text-[#C85A32] font-semibold scale-105'
                  : 'text-[#7D736A] dark:text-[#A89F95] hover:text-[#C85A32] dark:hover:text-[#E87A50]'
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 fill-[#C85A32]/10' : ''
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-3.5 text-[9px] font-bold bg-[#C85A32] text-white rounded-full flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-[#181615]">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
                )}
              </div>
              <span className="text-[9.5px] mt-0.5 tracking-tight font-medium truncate max-w-[54px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
