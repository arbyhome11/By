import React, { useState } from 'react';
import { Heart, KeyRound, Copy, Check, Share2, Sparkles, AlertCircle, Calendar, MapPin, X, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Gender } from '../types/database';

export const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createSpace, joinSpace, couple, currentUser, updateProfile } = useApp();
  const [view, setView] = useState<'choose' | 'create' | 'join' | 'created_success'>('choose');

  // Profile onboarding state
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [gender, setGender] = useState<Gender>(currentUser.gender || 'Male');

  // Create form state
  const [coupleName, setCoupleName] = useState('Me & You');
  const [cityA, setCityA] = useState(currentUser.city || 'London');
  const [cityB, setCityB] = useState('Tokyo');
  const [reunionDate, setReunionDate] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Join form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile({
      display_name: displayName.trim() || currentUser.display_name,
      gender,
      city: cityA,
    });
    const res = await createSpace({
      name: coupleName,
      city_a: cityA,
      city_b: cityB,
      reunion_date: reunionDate || null,
    });
    setLoading(false);
    if (res.code) {
      setGeneratedCode(res.code);
      setView('created_success');
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setLoading(true);
    await updateProfile({
      display_name: displayName.trim() || currentUser.display_name,
      gender,
    });
    const res = await joinSpace(joinCodeInput);
    setLoading(false);
    if (res.error) {
      setJoinError(res.error);
    } else {
      onClose();
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode || couple.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareCode = async () => {
    const code = generatedCode || couple.invite_code;
    const shareData = {
      title: 'Join our Me & You couple space',
      text: `Join our private space on Me & You! Use our 6-character invite code: ${code} (expires in 7 days).`,
      url: window.location.origin,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X size={18} />
        </button>

        {view === 'choose' && (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-[#C85A32] to-[#FB7185] flex items-center justify-center text-white shadow-md mb-4">
              <Heart size={28} fill="white" />
            </div>
            <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Connect Your Worlds
            </h2>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1.5 mb-6 max-w-xs mx-auto leading-relaxed">
              Every couple has exactly two members. Create a new space or enter your partner's 6-character code.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setView('create')}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#28231F] border-2 border-[#C85A32]/30 hover:border-[#C85A32] transition-all text-left shadow-xs cursor-pointer group min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C85A32]/10 dark:bg-[#C85A32]/20 flex items-center justify-center text-[#C85A32] shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                    Create our space
                  </h3>
                  <p className="text-[11px] text-[#7A6F66] dark:text-[#A89F95]">
                    Generates a unique 6-character invite code to send to your partner
                  </p>
                </div>
              </button>

              <button
                onClick={() => setView('join')}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32] transition-all text-left shadow-xs cursor-pointer group min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F2EDE4] dark:bg-[#322C28] flex items-center justify-center text-[#7A6F66] dark:text-[#D5CCC1] shrink-0 group-hover:scale-105 transition-transform">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                    Join with invite code
                  </h3>
                  <p className="text-[11px] text-[#7A6F66] dark:text-[#A89F95]">
                    Enter your partner's code to be added as the second member
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setView('choose')}
                className="text-xs text-[#C85A32] font-semibold hover:underline"
              >
                ← Back
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Create Your Space
            </h2>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5 mb-4">
              Set up your shared distance countdown and cities.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Him / Her"
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Couple Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    placeholder="e.g. Me & You"
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Gender selector in onboarding */}
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Your Gender <span className="text-[10px] text-[#9C8F85] font-normal">(for same-gender DM protection)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Female', 'Male', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[42px] flex items-center justify-center ${
                        gender === g
                          ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                          : 'bg-white dark:bg-[#28231F] text-[#7A6F66] dark:text-[#D5CCC1] border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32]'
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
                    required
                    value={cityA}
                    onChange={(e) => setCityA(e.target.value)}
                    placeholder="e.g. London"
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Partner's City
                  </label>
                  <input
                    type="text"
                    required
                    value={cityB}
                    onChange={(e) => setCityB(e.target.value)}
                    placeholder="e.g. Tokyo"
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Next Planned Reunion Date (optional)
                </label>
                <input
                  type="date"
                  value={reunionDate}
                  onChange={(e) => setReunionDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                {loading ? 'Generating Space...' : 'Create Space & Generate Invite Code'}
              </button>
            </form>
          </div>
        )}

        {view === 'created_success' && (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Check size={28} />
            </div>
            <h2 className="text-lg font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Space Created!
            </h2>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 mb-5">
              Share this 6-character code with your partner. Codes can only be used once and expire in 7 days.
            </p>

            {/* Unique 6-character code display */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#28231F] border-2 border-dashed border-[#C85A32] mb-5">
              <span className="text-xs uppercase tracking-widest text-[#8C827A] font-semibold block mb-1">
                Your Unique Invite Code
              </span>
              <div className="text-3xl font-mono font-black text-[#C85A32] tracking-wider selection:bg-[#C85A32]/20">
                {generatedCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-2 bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] text-[#2D2825] dark:text-[#F3EFEA] py-2.5 px-3 rounded-2xl text-xs font-semibold shadow-xs hover:border-[#C85A32] min-h-[44px] cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleShareCode}
                className="flex items-center justify-center gap-2 bg-[#C85A32] text-white py-2.5 px-3 rounded-2xl text-xs font-semibold shadow-xs hover:bg-[#B34E29] min-h-[44px] cursor-pointer"
              >
                <Share2 size={14} />
                <span>Share Code</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-xs text-[#7A6F66] dark:text-[#A89F95] hover:text-[#2D2825] py-2 font-medium"
            >
              Enter Our Space Now
            </button>
          </div>
        )}

        {view === 'join' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setView('choose')}
                className="text-xs text-[#C85A32] font-semibold hover:underline"
              >
                ← Back
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Join with Invite Code
            </h2>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5 mb-4">
              Enter the 6-character code sent by your partner.
            </p>

            {joinError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Him / Her"
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Your Gender <span className="text-[10px] text-[#9C8F85] font-normal">(for same-gender DM protection)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Female', 'Male', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[42px] flex items-center justify-center ${
                        gender === g
                          ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                          : 'bg-white dark:bg-[#28231F] text-[#7A6F66] dark:text-[#D5CCC1] border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  6-Character Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 7K9M3P"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono text-2xl font-bold tracking-widest bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-3 px-3 text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] uppercase min-h-[44px]"
                />
                <span className="text-[11px] text-[#9C8F85] block mt-1.5 text-center">
                  Letters & numbers (no confusing characters like 0/O/1/I)
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || joinCodeInput.length !== 6}
                className="w-full bg-[#C85A32] disabled:opacity-50 hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                {loading ? 'Verifying Code...' : 'Join Partner’s Space'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
