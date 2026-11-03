import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Filter, Calendar, Heart, ZoomIn, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../lib/imageCompression';

export const GalleryTab: React.FC = () => {
  const { journalEntries, currentUser, partnerUser, addJournalEntry } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'partner'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; date: string; author: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Collect all photos from journal entries
  const allPhotos: Array<{ url: string; title: string; date: string; authorId: string; entryId: string }> = [];
  journalEntries.forEach((entry) => {
    if (entry.photos) {
      entry.photos.forEach((photo) => {
        allPhotos.push({
          url: photo.url || photo.storage_path,
          title: entry.title,
          date: entry.entry_date,
          authorId: entry.author_id,
          entryId: entry.id,
        });
      });
    }
  });

  const filteredPhotos = allPhotos.filter((p) => {
    if (activeFilter === 'mine') return p.authorId === currentUser.id;
    if (activeFilter === 'partner') return p.authorId === partnerUser.id;
    return true;
  });

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 5)) {
        const compressed = await compressImage(file, 1600, 1600, 0.85);
        urls.push(compressed.dataUrl);
      }
      if (urls.length > 0) {
        await addJournalEntry(
          {
            couple_id: '',
            author_id: currentUser.id,
            entry_date: new Date().toISOString().split('T')[0],
            title: `Photo Moment (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
            note: 'Captured a sweet moment to share across the distance.',
            mood: 'loved',
            is_public: false,
          },
          urls
        );
      }
    } catch (err) {
      console.error('Gallery upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
            <ImageIcon size={20} className="text-[#C85A32]" />
            <span>Shared Gallery</span>
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
            {allPhotos.length} photos preserved in couple-media
          </p>
        </div>

        <label className="flex items-center gap-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white py-2 px-3.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer active:scale-95">
          <Plus size={15} />
          <span>{isUploading ? 'Compressing...' : 'Add Photos'}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={handleQuickUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[36px] cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#C85A32] text-white'
              : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
          }`}
        >
          All Photos ({allPhotos.length})
        </button>
        <button
          onClick={() => setActiveFilter('mine')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[36px] cursor-pointer ${
            activeFilter === 'mine'
              ? 'bg-[#C85A32] text-white'
              : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
          }`}
        >
          {currentUser.display_name.split(' ')[0]}’s Photos
        </button>
        <button
          onClick={() => setActiveFilter('partner')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[36px] cursor-pointer ${
            activeFilter === 'partner'
              ? 'bg-[#C85A32] text-white'
              : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
          }`}
        >
          {partnerUser.display_name.split(' ')[0]}’s Photos
        </button>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
          <ImageIcon size={32} className="text-[#C85A32]/40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">No Photos Yet</h3>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
            Upload photos from your daily walks, tickets, or coffee dates. They are compressed to 1600px automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredPhotos.map((photo, i) => {
            const author = photo.authorId === currentUser.id ? currentUser : partnerUser;
            return (
              <div
                key={i}
                onClick={() =>
                  setSelectedPhoto({
                    url: photo.url,
                    title: photo.title,
                    date: photo.date,
                    author: author.display_name,
                  })
                }
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#E8DFD5] dark:bg-[#2E2824] border border-[#E8DFD5] dark:border-[#38302A] cursor-pointer transition-all hover:scale-[1.02]"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white">
                  <p className="text-xs font-bold truncate">{photo.title}</p>
                  <span className="text-[10px] text-white/80">{photo.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xs p-4 cursor-zoom-out"
        >
          <div className="relative max-w-xl w-full text-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={22} />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-h-[75vh] mx-auto object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 text-left bg-black/60 backdrop-blur-md p-3 rounded-2xl text-white">
              <h4 className="text-sm font-bold">{selectedPhoto.title}</h4>
              <div className="flex items-center gap-2 text-xs text-white/70 mt-0.5">
                <span>By {selectedPhoto.author}</span>
                <span>•</span>
                <span>{selectedPhoto.date}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
