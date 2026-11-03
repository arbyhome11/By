import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckSquare,
  Calendar,
  Plus,
  Trash2,
  Utensils,
  Plane,
  Film,
  Sparkles,
  Check,
  Repeat,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Plan, PlanCategory } from '../types/database';

const PLAN_CATEGORIES: Array<{ id: PlanCategory; label: string; icon: any }> = [
  { id: 'Food', label: 'Food & Cafes', icon: Utensils },
  { id: 'Travel', label: 'Travel & Trips', icon: Plane },
  { id: 'Movies', label: 'Movies & Cozy', icon: Film },
  { id: 'Other', label: 'Other Dreams', icon: Sparkles },
];

export const PlansAndDatesTab: React.FC = () => {
  const {
    plans,
    addPlan,
    togglePlan,
    deletePlan,
    importantDates,
    addImportantDate,
    deleteImportantDate,
  } = useApp();

  // Active sub-view: 'plans' (bucket list) or 'dates' (important dates)
  const [subTab, setSubTab] = useState<'plans' | 'dates'>('plans');

  // Plan filtering & modal state
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | 'All'>('All');
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanCategory, setNewPlanCategory] = useState<PlanCategory>('Travel');

  // Date modal state
  const [isAddDateOpen, setIsAddDateOpen] = useState(false);
  const [newDateTitle, setNewDateTitle] = useState('');
  const [newDateValue, setNewDateValue] = useState('');
  const [newDateRepeats, setNewDateRepeats] = useState(true);

  // Plans calculations
  const filteredPlans =
    selectedCategory === 'All'
      ? plans
      : plans.filter((p) => p.category === selectedCategory);
  const doneCount = plans.filter((p) => p.done).length;
  const progressPercent =
    plans.length > 0 ? Math.round((doneCount / plans.length) * 100) : 0;

  // Dates calculations
  const getDaysUntil = (dateStr: string, yearly: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(dateStr + 'T00:00:00');
    if (!yearly) {
      const diff = d.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

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

  const handleAddPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;
    await addPlan(newPlanTitle.trim(), newPlanCategory);
    setNewPlanTitle('');
    setIsAddPlanOpen(false);
  };

  const handleAddDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateTitle.trim() || !newDateValue) return;
    await addImportantDate({
      title: newDateTitle.trim(),
      date: newDateValue,
      repeats_yearly: newDateRepeats,
    });
    setNewDateTitle('');
    setNewDateValue('');
    setNewDateRepeats(true);
    setIsAddDateOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header with Title and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
            <CalendarCheck size={20} className="text-[#C85A32]" />
            <span>Plans</span>
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
            {subTab === 'plans'
              ? `${doneCount} of ${plans.length} bucket list plans completed`
              : `${importantDates.length} milestone dates tracked`}
          </p>
        </div>

        <button
          onClick={() => (subTab === 'plans' ? setIsAddPlanOpen(true) : setIsAddDateOpen(true))}
          className="flex items-center gap-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white py-2 px-3.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer active:scale-95"
        >
          <Plus size={15} />
          <span>{subTab === 'plans' ? 'Add Plan' : 'Add Date'}</span>
        </button>
      </div>

      {/* Modern Segmented Switcher for Plans & Dates */}
      <div className="p-1 rounded-2xl bg-[#EFE9DF] dark:bg-[#25201C] flex items-center border border-[#E0D7CC] dark:border-[#38312B]">
        <button
          onClick={() => setSubTab('plans')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px] cursor-pointer ${
            subTab === 'plans'
              ? 'bg-white dark:bg-[#322A24] text-[#C85A32] shadow-xs'
              : 'text-[#6E645B] dark:text-[#A89F95] hover:text-[#2D2825] dark:hover:text-[#F3EFEA]'
          }`}
        >
          <CheckSquare size={15} />
          <span>Bucket List Plans</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F2] dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('dates')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px] cursor-pointer ${
            subTab === 'dates'
              ? 'bg-white dark:bg-[#322A24] text-[#C85A32] shadow-xs'
              : 'text-[#6E645B] dark:text-[#A89F95] hover:text-[#2D2825] dark:hover:text-[#F3EFEA]'
          }`}
        >
          <Calendar size={15} />
          <span>Milestone Dates</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F2] dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
            {importantDates.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          SUB-VIEW 1: PLANS (BUCKET LIST)
         ======================================================== */}
      {subTab === 'plans' && (
        <div className="space-y-4">
          {/* Progress Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] mb-1.5">
              <span>Bucket List Accomplished</span>
              <span className="text-[#C85A32] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EAE2D8] dark:bg-[#2E2824] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C85A32] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors min-h-[36px] cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#C85A32] text-white'
                  : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
              }`}
            >
              All ({plans.length})
            </button>
            {PLAN_CATEGORIES.map((cat) => {
              const count = plans.filter((p) => p.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors min-h-[36px] cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#C85A32] text-white'
                      : 'bg-[#F2EDE4] dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Plans List */}
          {filteredPlans.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
              <CheckSquare size={32} className="text-[#C85A32]/40 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                No plans in this category
              </h3>
              <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
                Add an activity or restaurant you want to experience together on your next reunion.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPlans.map((plan) => {
                const catInfo =
                  PLAN_CATEGORIES.find((c) => c.id === plan.category) || PLAN_CATEGORIES[3];
                const Icon = catInfo.icon;

                return (
                  <div
                    key={plan.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      plan.done
                        ? 'bg-[#FAF7F2]/60 dark:bg-[#1A1715]/60 border-[#E8DFD5] dark:border-[#38302A] opacity-75'
                        : 'bg-white dark:bg-[#211D1A] border-[#E8DFD5] dark:border-[#38302A] shadow-xs hover:border-[#C85A32]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => togglePlan(plan.id)}
                        aria-label={plan.done ? 'Mark incomplete' : 'Mark completed'}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all min-h-[36px] min-w-[36px] cursor-pointer ${
                          plan.done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-[#C85A32]/40 hover:border-[#C85A32] bg-white dark:bg-[#28231F]'
                        }`}
                      >
                        {plan.done && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-medium transition-all ${
                            plan.done
                              ? 'line-through text-[#8C827A] dark:text-[#7A7169]'
                              : 'text-[#2D2825] dark:text-[#F3EFEA]'
                          }`}
                        >
                          {plan.title}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#8C827A] mt-0.5">
                          <Icon size={10} className="text-[#C85A32]" />
                          <span>{plan.category}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deletePlan(plan.id)}
                      aria-label="Delete plan"
                      className="p-1.5 text-[#8C827A] hover:text-rose-600 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-VIEW 2: IMPORTANT DATES
         ======================================================== */}
      {subTab === 'dates' && (
        <div className="space-y-3">
          {sortedDates.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
              <Calendar size={32} className="text-[#C85A32]/40 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                No Important Dates Added
              </h3>
              <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
                Keep track of anniversaries, birthdays, and visa countdowns in one shared place.
              </p>
            </div>
          ) : (
            sortedDates.map((item) => {
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
                        {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                        })}
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
                      {isToday
                        ? 'Today! 🎉'
                        : daysLeft > 0
                        ? `In ${daysLeft}d`
                        : `${Math.abs(daysLeft)}d ago`}
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
            })
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: ADD PLAN
         ======================================================== */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
            <button
              onClick={() => setIsAddPlanOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              Add Bucket List Plan
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Add something memorable to do together on your next reunion.
            </p>

            <form onSubmit={handleAddPlanSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Try matcha soft serve in Asakusa"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewPlanCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        newPlanCategory === cat.id
                          ? 'border-[#C85A32] bg-[#C85A32]/10 text-[#C85A32]'
                          : 'border-[#E8DFD5] dark:border-[#38302A] bg-white dark:bg-[#28231F] text-[#524A43] dark:text-[#DDD5CC]'
                      }`}
                    >
                      <cat.icon size={14} />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                Add to Bucket List
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD DATE
         ======================================================== */}
      {isAddDateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
            <button
              onClick={() => setIsAddDateOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              Add Milestone Date
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Synced and visible to both partners in real-time.
            </p>

            <form onSubmit={handleAddDateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Event / Milestone Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight booking date, Her Birthday"
                  value={newDateTitle}
                  onChange={(e) => setNewDateTitle(e.target.value)}
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
                  value={newDateValue}
                  onChange={(e) => setNewDateValue(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] flex items-center justify-between">
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
                  checked={newDateRepeats}
                  onChange={(e) => setNewDateRepeats(e.target.checked)}
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
