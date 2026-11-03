import React, { useState, useEffect } from 'react';
import {
  Heart,
  Clock,
  Calendar,
  MapPin,
  Edit3,
  Sun,
  Moon,
  Plane,
  Sparkles,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HomeTab: React.FC = () => {
  const { couple, currentUser, partnerUser, updateCouple } = useApp();
  const [now, setNow] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editReunionDate, setEditReunionDate] = useState(couple.reunion_date || '');
  const [editTitle, setEditTitle] = useState(couple.reunion_title || 'Next Reunion');
  const [editLocation, setEditLocation] = useState(couple.reunion_location || 'Airport');
  const [editAnniversary, setEditAnniversary] = useState(couple.anniversary_date || '');
  const [editLastMet, setEditLastMet] = useState(couple.last_met_date || '');

  // Keep live second ticks for countdown & clocks
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update edit fields when couple state changes
  useEffect(() => {
    if (couple.reunion_date) setEditReunionDate(couple.reunion_date);
    if (couple.reunion_title) setEditTitle(couple.reunion_title);
    if (couple.reunion_location) setEditLocation(couple.reunion_location);
    if (couple.anniversary_date) setEditAnniversary(couple.anniversary_date);
    if (couple.last_met_date) setEditLastMet(couple.last_met_date);
  }, [couple]);

  // Reunion Countdown calculation
  let days = 0, hours = 0, minutes = 0, seconds = 0;
  let progressPercent = 0;
  let isPast = false;

  if (couple.reunion_date) {
    const target = new Date(couple.reunion_date + 'T00:00:00');
    const diff = target.getTime() - now.getTime();

    if (diff > 0) {
      days = Math.floor(diff / (1000 * 60 * 60 * 24));
      hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      minutes = Math.floor((diff / 1000 / 60) % 60);
      seconds = Math.floor((diff / 1000) % 60);

      // Progress bar relative to last met date
      if (couple.last_met_date) {
        const start = new Date(couple.last_met_date + 'T00:00:00').getTime();
        const totalDuration = target.getTime() - start;
        const elapsed = now.getTime() - start;
        if (totalDuration > 0) {
          progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
        }
      } else {
        progressPercent = Math.max(10, Math.min(95, 100 - days * 2));
      }
    } else {
      isPast = true;
      progressPercent = 100;
    }
  }

  // "Together for" calculation (from anniversary_date)
  const calculateElapsedString = (dateStr: string | null) => {
    if (!dateStr) return 'Not set yet';
    const start = new Date(dateStr + 'T00:00:00');
    const diff = now.getTime() - start.getTime();
    if (diff < 0) return 'Starts soon';

    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const remDays = totalDays % 365;

    if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}, ${remDays} days`;
    }
    return `${totalDays} days`;
  };

  // Timezone clocks helper
  const getTimeInTz = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
    } catch {
      return now.toLocaleTimeString();
    }
  };

  const getHourInTz = (tz: string) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz || 'UTC',
        hour: 'numeric',
        hour12: false,
      }).formatToParts(now);
      const h = parts.find((p) => p.type === 'hour')?.value;
      return h ? parseInt(h, 10) : 12;
    } catch {
      return 12;
    }
  };

  const handleSaveReunion = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCouple({
      reunion_date: editReunionDate,
      reunion_title: editTitle,
      reunion_location: editLocation,
      anniversary_date: editAnniversary,
      last_met_date: editLastMet,
    });
    setIsEditModalOpen(false);
  };

  const userHour = getHourInTz(currentUser.timezone);
  const partnerHour = getHourInTz(partnerUser.timezone);
  const timeDiffHours = partnerHour - userHour;
  const timeDiffString =
    timeDiffHours === 0
      ? 'Same time zone'
      : timeDiffHours > 0
      ? `${partnerUser.display_name.split(' ')[0]} is +${timeDiffHours} hrs ahead`
      : `${partnerUser.display_name.split(' ')[0]} is ${Math.abs(timeDiffHours)} hrs behind`;

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Countdown Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-white to-[#F6EDE4] dark:from-[#211D1A] dark:via-[#1B1715] dark:to-[#28211D] border border-[#E8DFD5] dark:border-[#38302A] p-6 shadow-sm">
        {/* Subtle decorative heart watermark */}
        <div className="absolute -right-8 -bottom-8 text-[#C85A32]/5 dark:text-[#C85A32]/10 pointer-events-none">
          <Heart size={210} fill="currentColor" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32] animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C85A32]">
                {isPast ? 'Reunited!' : 'Countdown to Reunion'}
              </span>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-[#7A6F66] dark:text-[#A89F95] hover:text-[#C85A32] transition-colors p-1.5 rounded-xl hover:bg-[#F2EDE4] dark:hover:bg-[#2C2622] min-h-[44px] cursor-pointer"
            >
              <Edit3 size={13} />
              <span className="font-medium">Edit Details</span>
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#2D2825] dark:text-[#F3EFEA] tracking-tight">
            {couple.reunion_title || 'Next Reunion'}
          </h2>

          <div className="flex items-center gap-2 text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 mb-5">
            <MapPin size={13} className="text-[#C85A32] shrink-0" />
            <span className="truncate">{couple.reunion_location || 'Airport'}</span>
            <span>•</span>
            <Calendar size={13} className="text-[#C85A32] shrink-0" />
            <span>
              {couple.reunion_date
                ? new Date(couple.reunion_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Date not set'}
            </span>
          </div>

          {/* Countdown Numbers Grid */}
          {!isPast ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 my-4">
              <div className="bg-white/80 dark:bg-[#28231F]/80 backdrop-blur-xs border border-[#E8DFD5] dark:border-[#38302A] rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-2xl sm:text-3xl font-black text-[#C85A32] font-mono leading-none">
                  {days}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#8C827A] mt-1 block tracking-wider">
                  Days
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#28231F]/80 backdrop-blur-xs border border-[#E8DFD5] dark:border-[#38302A] rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-2xl sm:text-3xl font-black text-[#2D2825] dark:text-[#F3EFEA] font-mono leading-none">
                  {String(hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#8C827A] mt-1 block tracking-wider">
                  Hours
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#28231F]/80 backdrop-blur-xs border border-[#E8DFD5] dark:border-[#38302A] rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-2xl sm:text-3xl font-black text-[#2D2825] dark:text-[#F3EFEA] font-mono leading-none">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#8C827A] mt-1 block tracking-wider">
                  Mins
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#28231F]/80 backdrop-blur-xs border border-[#E8DFD5] dark:border-[#38302A] rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-2xl sm:text-3xl font-black text-[#FB7185] font-mono leading-none">
                  {String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#8C827A] mt-1 block tracking-wider">
                  Secs
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center my-4">
              <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-1" />
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                You're in each other's arms!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Enjoy every single second of your reunion.
              </p>
            </div>
          )}

          {/* Journey Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#7A6F66] dark:text-[#A89F95] mb-1.5">
              <span>Journey to Reunion</span>
              <span className="font-bold text-[#C85A32]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#EAE2D8] dark:bg-[#2E2824] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C85A32] via-[#E11D48] to-[#FB7185] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dual Clocks & Distance Section */}
      <section className="grid grid-cols-2 gap-3">
        {/* Member 1 Clock (Current User) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] truncate">
              {currentUser.display_name.split(' ')[0]}
            </span>
            {userHour >= 6 && userHour < 18 ? (
              <Sun size={15} className="text-amber-500" />
            ) : (
              <Moon size={15} className="text-indigo-400" />
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#2D2825] dark:text-[#F3EFEA] tracking-tight">
            {getTimeInTz(currentUser.timezone)}
          </div>
          <p className="text-[11px] text-[#8C827A] dark:text-[#9E948C] mt-1 truncate">
            {currentUser.city || couple.city_a || 'London'}
          </p>
        </div>

        {/* Member 2 Clock (Partner) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] truncate">
              {partnerUser.display_name.split(' ')[0]}
            </span>
            {partnerHour >= 6 && partnerHour < 18 ? (
              <Sun size={15} className="text-amber-500" />
            ) : (
              <Moon size={15} className="text-indigo-400" />
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#C85A32] tracking-tight">
            {getTimeInTz(partnerUser.timezone)}
          </div>
          <p className="text-[11px] text-[#8C827A] dark:text-[#9E948C] mt-1 truncate">
            {partnerUser.city || couple.city_b || 'Tokyo'}
          </p>
        </div>
      </section>

      {/* Timezone difference summary banner */}
      <div className="p-2.5 rounded-2xl bg-[#F2EDE4]/80 dark:bg-[#26211D] border border-[#E0D7CC] dark:border-[#3A332E] text-center text-xs text-[#524A43] dark:text-[#D5CCC1] font-medium flex items-center justify-center gap-2">
        <Clock size={13} className="text-[#C85A32]" />
        <span>{timeDiffString}</span>
      </div>

      {/* Relationship Counters: "Together for" & "Since you last met" */}
      <section className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs">
          <div className="flex items-center gap-2 text-[#C85A32] mb-1.5">
            <Heart size={15} fill="#C85A32" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Together for</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-[#2D2825] dark:text-[#F3EFEA]">
            {calculateElapsedString(couple.anniversary_date)}
          </div>
          <p className="text-[10px] text-[#8C827A] mt-0.5">
            Anniversary: {couple.anniversary_date || 'Set in edit'}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs">
          <div className="flex items-center gap-2 text-[#C85A32] mb-1.5">
            <Plane size={15} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Since last met</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-[#2D2825] dark:text-[#F3EFEA]">
            {calculateElapsedString(couple.last_met_date)}
          </div>
          <p className="text-[10px] text-[#8C827A] mt-0.5">
            Last hug: {couple.last_met_date || 'Set in edit'}
          </p>
        </div>
      </section>

      {/* Couple Tagline & Love Note */}
      <section className="p-4 rounded-3xl bg-gradient-to-r from-[#C85A32]/10 to-[#FB7185]/10 border border-[#C85A32]/20 text-center">
        <Sparkles size={18} className="text-[#C85A32] mx-auto mb-1.5" />
        <p className="text-xs font-semibold italic text-[#2D2825] dark:text-[#F3EFEA]">
          "{couple.tagline || 'Miles apart, together in heart'}"
        </p>
        <p className="text-[11px] text-[#8C827A] mt-1 font-medium">
          Connected through Supabase Realtime • Edits sync instantly
        </p>
      </section>

      {/* Instant Edit Reunion & Dates Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              Edit Reunion & Couple Dates
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Saving updates both partners' countdowns and triggers instant sync.
            </p>

            <form onSubmit={handleSaveReunion} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Reunion Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Reunion Location / Airport
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Reunion Target Date
                </label>
                <input
                  type="date"
                  value={editReunionDate}
                  onChange={(e) => setEditReunionDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Anniversary Date
                  </label>
                  <input
                    type="date"
                    value={editAnniversary}
                    onChange={(e) => setEditAnniversary(e.target.value)}
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-2 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Last Met Date
                  </label>
                  <input
                    type="date"
                    value={editLastMet}
                    onChange={(e) => setEditLastMet(e.target.value)}
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-2 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all min-h-[44px] cursor-pointer"
              >
                Save & Sync for Both Partners
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
