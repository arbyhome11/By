import React, { useState } from 'react';
import { Compass, MapPin, Calendar, Heart, Search, Filter, Sparkles, UserPlus, UserCheck, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ExploreCouple {
  id: string;
  name: string;
  username: string;
  cityA: string;
  cityB: string;
  countryA: string;
  countryB: string;
  distanceKm: number;
  reunionDate: string;
  lastMetDate: string;
  tagline: string;
  avatar: string;
}

const EXPLORE_COUPLES: ExploreCouple[] = [
  {
    id: 'cpl_elena_sam',
    name: 'Elena & Sam',
    username: 'elena_sam_ldr',
    cityA: 'Berlin',
    cityB: 'New York',
    countryA: 'Germany',
    countryB: 'United States',
    distanceKm: 6385,
    reunionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString().split('T')[0],
    lastMetDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString().split('T')[0],
    tagline: 'Closing the transatlantic gap in 6 days! 🗽✈️🇩🇪',
    avatar: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&q=80',
  },
  {
    id: 'cpl_leo_chloe',
    name: 'Chloe & Leo',
    username: 'chloe_leo',
    cityA: 'Sydney',
    cityB: 'Vancouver',
    countryA: 'Australia',
    countryB: 'Canada',
    distanceKm: 12500,
    reunionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22).toISOString().split('T')[0],
    lastMetDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString().split('T')[0],
    tagline: '14 hours time difference can’t stop our morning coffee calls ☕',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&q=80',
  },
  {
    id: 'cpl_marcus_yuki',
    name: 'Marcus & Yuki',
    username: 'marcus_yuki',
    cityA: 'Toronto',
    cityB: 'Seoul',
    countryA: 'Canada',
    countryB: 'South Korea',
    distanceKm: 10600,
    reunionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0],
    lastMetDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    tagline: 'Reunited in Incheon Airport last week! Memories of a lifetime.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
  {
    id: 'cpl_lucas_sofia',
    name: 'Sofia & Lucas',
    username: 'sofia_lucas_ldr',
    cityA: 'Madrid',
    cityB: 'Buenos Aires',
    countryA: 'Spain',
    countryB: 'Argentina',
    distanceKm: 10050,
    reunionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().split('T')[0],
    lastMetDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
    tagline: 'Counting down until our Spanish summer reunion.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  },
  {
    id: 'cpl_liam_zoe',
    name: 'Zoe & Liam',
    username: 'zoe_liam',
    cityA: 'Paris',
    cityB: 'Singapore',
    countryA: 'France',
    countryB: 'Singapore',
    distanceKm: 10730,
    reunionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    lastMetDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString().split('T')[0],
    tagline: 'Two years strong across continents. Love always wins.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  },
];

export const ExploreTab: React.FC = () => {
  const { followingCouples, toggleFollow } = useApp();
  const [ranking, setRanking] = useState<'distance' | 'reunion' | 'recently_met'>('reunion');
  const [searchQuery, setSearchQuery] = useState('');

  const now = Date.now();

  const filteredCouples = EXPLORE_COUPLES.filter((c) => {
    // Recently met filter: last_met_date within 14 days
    if (ranking === 'recently_met') {
      const daysSinceMet = Math.abs(
        Math.floor((now - new Date(c.lastMetDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      if (daysSinceMet > 14) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.cityA.toLowerCase().includes(q) ||
      c.cityB.toLowerCase().includes(q) ||
      c.countryA.toLowerCase().includes(q) ||
      c.countryB.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (ranking === 'distance') {
      return b.distanceKm - a.distanceKm;
    }
    if (ranking === 'reunion') {
      return new Date(a.reunionDate).getTime() - new Date(b.reunionDate).getTime();
    }
    return new Date(b.lastMetDate).getTime() - new Date(a.lastMetDate).getTime();
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
          <Compass size={20} className="text-[#C85A32]" />
          <span>Explore Couples</span>
        </h2>
        <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
          Connect with long-distance couples sharing your journey
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
        <input
          type="text"
          placeholder="Filter by city, country, or names (e.g. Tokyo, Berlin, Canada)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] rounded-2xl py-2.5 pl-10 pr-4 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] shadow-xs min-h-[44px]"
        />
      </div>

      {/* Ranking Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setRanking('reunion')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors min-h-[36px] cursor-pointer ${
            ranking === 'reunion'
              ? 'bg-[#C85A32] text-white'
              : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
          }`}
        >
          Upcoming Reunion
        </button>
        <button
          onClick={() => setRanking('distance')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors min-h-[36px] cursor-pointer ${
            ranking === 'distance'
              ? 'bg-[#C85A32] text-white'
              : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
          }`}
        >
          Greatest Distance
        </button>
        <button
          onClick={() => setRanking('recently_met')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors min-h-[36px] cursor-pointer ${
            ranking === 'recently_met'
              ? 'bg-[#C85A32] text-white'
              : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
          }`}
        >
          Recently Met (within 14d)
        </button>
      </div>

      {/* Couples List */}
      <div className="space-y-3">
        {filteredCouples.map((c) => {
          const isFollowing = followingCouples.includes(c.id);
          const daysToReunion = Math.max(
            0,
            Math.ceil((new Date(c.reunionDate).getTime() - now) / (1000 * 60 * 60 * 24))
          );
          const daysSinceMet = Math.abs(
            Math.floor((now - new Date(c.lastMetDate).getTime()) / (1000 * 60 * 60 * 24))
          );

          return (
            <div
              key={c.id}
              className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3 transition-all hover:border-[#C85A32]/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-[#C85A32]/30"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA] leading-none">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-[#8C827A] mt-1 font-medium">
                      {c.cityA} ⇄ {c.cityB} ({c.distanceKm.toLocaleString()} km apart)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollow(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                    isFollowing
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-[#C85A32] text-white hover:bg-[#B34E29]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={13} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-[#524A43] dark:text-[#DDD5CC] italic">
                "{c.tagline}"
              </p>

              {/* Badges: Countdown, Met date */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E8DFD5] dark:border-[#38302A] text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C85A32]/10 text-[#C85A32] font-semibold">
                  <Calendar size={11} /> Reunion in {daysToReunion} days
                </span>
                {daysSinceMet <= 14 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <CheckCircle size={11} /> Met {daysSinceMet} days ago
                  </span>
                )}
                <span className="text-[#8C827A] text-[10px] ml-auto">
                  @{c.username}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
