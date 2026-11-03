import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Image as ImageIcon,
  Share2,
  Trash2,
  Edit2,
  Heart,
  Globe,
  Lock,
  Smile,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JournalEntry } from '../types/database';
import { compressImage } from '../lib/imageCompression';

const MOODS = [
  { id: 'loved', label: 'Loved', emoji: '🥰' },
  { id: 'missing you', label: 'Missing You', emoji: '🥺' },
  { id: 'excited', label: 'Excited', emoji: '✨' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'joyful', label: 'Joyful', emoji: '😊' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿' },
];

export const JournalTab: React.FC = () => {
  const {
    journalEntries,
    currentUser,
    partnerUser,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    createCommunityPost,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('loved');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setNote('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setMood('loved');
    setIsPublic(false);
    setSelectedPhotos([]);
    setEditingEntry(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setNote(entry.note);
    setEntryDate(entry.entry_date);
    setMood(entry.mood);
    setIsPublic(entry.is_public);
    setSelectedPhotos(entry.photos?.map((p) => p.url || p.storage_path) || []);
    setIsAddModalOpen(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to max 5 photos per entry
    const remainingSlots = 5 - selectedPhotos.length;
    if (remainingSlots <= 0) return;

    setIsCompressing(true);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    try {
      const newUrls: string[] = [];
      for (const file of filesToProcess) {
        // Client-side image compression up to 1600px width
        const compressed = await compressImage(file, 1600, 1600, 0.85);
        newUrls.push(compressed.dataUrl);
      }
      setSelectedPhotos((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !note.trim()) return;

    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, {
        title,
        note,
        entry_date: entryDate,
        mood,
        is_public: isPublic,
      });
    } else {
      await addJournalEntry(
        {
          couple_id: '',
          author_id: currentUser.id,
          entry_date: entryDate,
          title,
          note,
          mood,
          is_public: isPublic,
        },
        selectedPhotos
      );

      // If shared to community, also create a public post in public-media
      if (isPublic) {
        await createCommunityPost({
          body: `Shared memory: "${title}" — ${note.substring(0, 180)}...`,
          momentTag: 'Journal Memory',
          mediaPath: selectedPhotos[0] || undefined,
        });
      }
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Tab Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
            <BookOpen size={20} className="text-[#C85A32]" />
            <span>Shared Journal</span>
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
            {journalEntries.length} memories recorded across time zones
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white py-2 px-3.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer active:scale-95"
        >
          <Plus size={15} />
          <span>Write Entry</span>
        </button>
      </div>

      {/* Entries List */}
      {journalEntries.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
          <Heart size={32} className="text-[#C85A32]/40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">Your Journal is Empty</h3>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
            Write your first distance memory, capture a feeling, or attach compressed photos.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 bg-[#C85A32] text-white py-2 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Plus size={14} />
            <span>Write First Memory</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {journalEntries.map((entry) => {
            const author = entry.author_id === currentUser.id ? currentUser : partnerUser;
            const currentMood = MOODS.find((m) => m.id === entry.mood);

            return (
              <article
                key={entry.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3 transition-all hover:border-[#C85A32]/40"
              >
                {/* Entry Meta: Author, Date, Mood, Privacy */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={author.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                      alt={author.display_name}
                      className="w-7 h-7 rounded-full object-cover border border-[#C85A32]/30"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                          {author.display_name}
                        </span>
                        {entry.is_public ? (
                          <span
                            title="Shared with Community"
                            className="inline-flex items-center text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-full"
                          >
                            <Globe size={10} className="mr-0.5" /> Public
                          </span>
                        ) : (
                          <span
                            title="Private to Couple"
                            className="inline-flex items-center text-[10px] text-[#8C827A] bg-[#F2EDE4] dark:bg-[#2E2824] px-1.5 py-0.5 rounded-full"
                          >
                            <Lock size={10} className="mr-0.5" /> Private
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8C827A] mt-0.5">
                        <Calendar size={10} />
                        <span>{entry.entry_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentMood && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF7F2] dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] text-[#2D2825] dark:text-[#F3EFEA]">
                        <span>{currentMood.emoji}</span>
                        <span>{currentMood.label}</span>
                      </span>
                    )}

                    {/* Actions Menu */}
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="p-1.5 text-[#8C827A] hover:text-[#C85A32] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteJournalEntry(entry.id)}
                      className="p-1.5 text-[#8C827A] hover:text-rose-600 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Entry Title & Body */}
                <div>
                  <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] leading-snug">
                    {entry.title}
                  </h3>
                  <p className="text-xs text-[#524A43] dark:text-[#DDD5CC] leading-relaxed mt-1.5 whitespace-pre-line font-normal">
                    {entry.note}
                  </p>
                </div>

                {/* Attached Compressed Photos (up to 5 per entry) */}
                {entry.photos && entry.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
                    {entry.photos.map((photo, i) => (
                      <button
                        key={photo.id || i}
                        onClick={() => setLightboxPhoto(photo.url || photo.storage_path)}
                        className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-[#E8DFD5] dark:border-[#38302A] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <img
                          src={photo.url || photo.storage_path}
                          alt="Journal memory"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Write / Edit Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              {editingEntry ? 'Edit Journal Memory' : 'New Distance Journal Entry'}
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Synced across both devices via Supabase. Private to your couple by default.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walking in the rain thinking of you..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Mood
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                  >
                    {MOODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.emoji} {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Your Note & Thoughts
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your note, feeling, or something sweet for your partner..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl p-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              {/* Photo Upload with Client Compression (Max 5 photos) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95]">
                    Photos (Max 5, compressed automatically)
                  </label>
                  <span className="text-[10px] text-[#8C827A]">{selectedPhotos.length}/5 photos</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedPhotos.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#C85A32]/40">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {selectedPhotos.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32] flex flex-col items-center justify-center text-[#8C827A] hover:text-[#C85A32] cursor-pointer transition-colors">
                      <ImageIcon size={18} />
                      <span className="text-[9px] mt-0.5 font-medium">+ Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {isCompressing && (
                  <p className="text-[10px] text-[#C85A32] animate-pulse">
                    Compressing images to 1600px...
                  </p>
                )}
              </div>

              {/* Share to Community Toggle */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA]">
                    <Globe size={13} className="text-blue-500" />
                    <span>Share to Community Feed</span>
                  </div>
                  <p className="text-[10px] text-[#8C827A] mt-0.5">
                    Sets is_public = true and publishes to public-media bucket
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
                />
              </div>

              <button
                type="submit"
                disabled={isCompressing}
                className="w-full bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                <span>{editingEntry ? 'Update Memory' : 'Save Memory'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
        >
          <img
            src={lightboxPhoto}
            alt="Fullscreen memory"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
