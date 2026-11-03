import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Repeat, Clock, Sparkles, X, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ImportantDate } from '../types/database';

export const DatesTab: React.FC = () => {
  const { importantDates, addImportantDate, deleteImportantDate } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [repeatsYearly, setRepeatsYearly] = useState(true);

  // Calculate days until next occurrence
  const getDaysUntil = (dateStr: string, yearly: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(dateStr + 'T00:00:00');
    if (!yearly) {
      const diff = d.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Yearly repeating calculation:
    let nextDate = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (nextDate.getTime() < today.getTime()) {
      nextDate = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
    }
    const diff = nextDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const sortedDates = [...importantDates].sort((a, b) => {
    const daysA = getDaysUntil(a.date, a.repeats_yearly);
    const daysB = getDaysUntil(b.date, b.repeats_yearly);
    return daysA - daysB;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    await addImportantDate({
      title: title.trim(),
      date,
      repeats_yearly: repeatsYearly,
    });
    setTitle('');
    setDate('');
    setRepeatsYearly(true);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
            <Calendar size={20} className="text-[#C85A32]" />
            <span>Important Dates</span>
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
            Anniversaries, birthdays, flight dates & milestones
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white py-2 px-3.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer active:scale-95"
        >
          <Plus size={15} />
          <span>Add Date</span>
        </button>
      </div>

      {/* Dates List */}
      {sortedDates.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
          <Calendar size={32} className="text-[#C85A32]/40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">No Important Dates Added</h3>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
            Keep track of anniversaries, birthdays, and visa countdowns in one shared place.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((item) => {
            const daysLeft = getDaysUntil(item.date, item.repeats_yearly);
            const isToday = daysLeft === 0;

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs flex items-center justify-between gap-3 hover:border-[#C85A32]/40 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                      isToday
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm animate-pulse'
                        : 'bg-[#FAF7F2] dark:bg-[#28231F] border-[#E8DFD5] dark:border-[#38302A] text-[#C85A32]'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-black leading-none mt-0.5">
                      {new Date(item.date + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA] leading-snug truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#8C827A] mt-0.5">
                      <span>{item.date}</span>
                      {item.repeats_yearly && (
                        <span className="inline-flex items-center gap-0.5 text-[#C85A32]">
                          <Repeat size={10} /> Yearly
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : daysLeft > 0 && daysLeft <= 14
                        ? 'bg-[#C85A32]/10 text-[#C85A32]'
                        : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#7A6F66] dark:text-[#A89F95]'
                    }`}
                  >
                    {isToday ? 'Today! 🎉' : daysLeft > 0 ? `In ${daysLeft}d` : `${Math.abs(daysLeft)}d ago`}
                  </span>

                  <button
                    onClick={() => deleteImportantDate(item.id)}
                    aria-label="Delete date"
                    className="p-1.5 text-[#8C827A] hover:text-rose-600 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Date Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              Add Important Date
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Synced and visible to both partners in real-time.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Event / Milestone Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight to London, Visa Interview"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                    Repeats Yearly
                  </span>
                  <span className="text-[10px] text-[#8C827A]">
                    For birthdays, anniversaries, and annual milestones
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={repeatsYearly}
                  onChange={(e) => setRepeatsYearly(e.target.checked)}
                  className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                Save Milestone Date
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
