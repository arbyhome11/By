import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Utensils, Plane, Film, Sparkles, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Plan, PlanCategory } from '../types/database';

const CATEGORIES: Array<{ id: PlanCategory; label: string; icon: any; color: string }> = [
  { id: 'Food', label: 'Food & Cafes', icon: Utensils, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'Travel', label: 'Travel & Trips', icon: Plane, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { id: 'Movies', label: 'Movies & Cozy', icon: Film, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
  { id: 'Other', label: 'Other Dreams', icon: Sparkles, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
];

export const PlansTab: React.FC = () => {
  const { plans, addPlan, togglePlan, deletePlan } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PlanCategory>('Travel');

  const filteredPlans = selectedCategory === 'All'
    ? plans
    : plans.filter((p) => p.category === selectedCategory);

  const doneCount = plans.filter((p) => p.done).length;
  const progressPercent = plans.length > 0 ? Math.round((doneCount / plans.length) * 100) : 0;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addPlan(newTitle.trim(), newCategory);
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
            <CheckSquare size={20} className="text-[#C85A32]" />
            <span>Reunion Bucket List</span>
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
            {doneCount} of {plans.length} dreams accomplished together
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white py-2 px-3.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer active:scale-95"
        >
          <Plus size={15} />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Progress Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] mb-1.5">
          <span>Bucket List Progress</span>
          <span className="text-[#C85A32] font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#EAE2D8] dark:bg-[#2E2824] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C85A32] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Tabs */}
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
        {CATEGORIES.map((cat) => {
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
          <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">No plans in this category</h3>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
            Add a restaurant you want to try, a museum visit, or a cozy movie to watch together.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPlans.map((plan) => {
            const catInfo = CATEGORIES.find((c) => c.id === plan.category) || CATEGORIES[3];
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
                  {/* Interactive Checkbox */}
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

      {/* Add Plan Modal */}
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
              Add Bucket List Item
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Add something exciting for your next reunion together.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Try matcha soft serve in Asakusa"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        newCategory === cat.id
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
    </div>
  );
};
