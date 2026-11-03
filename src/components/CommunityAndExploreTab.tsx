import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Heart,
  MessageCircle,
  Plus,
  Clock,
  Send,
  MoreVertical,
  ShieldAlert,
  Search,
  UserPlus,
  UserCheck,
  CheckCircle,
  Image as ImageIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Post, ReactionType, Comment } from '../types/database';
import { compressImage } from '../lib/imageCompression';

const MOMENT_TAGS = [
  'Gap Closed',
  'Airport Tears',
  'Daily Ritual',
  'Care Package',
  'LDR Advice',
  'Couple Milestone',
];

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

export const CommunityAndExploreTab: React.FC = () => {
  const {
    communityPosts,
    couple,
    currentUser,
    followingCouples,
    toggleFollow,
    blockCouple,
    reportContent,
    toggleReaction,
    addComment,
    createCommunityPost,
  } = useApp();

  // Active sub-tab: 'feed' or 'explore'
  const [subTab, setSubTab] = useState<'feed' | 'explore'>('feed');

  // Feed State
  const [activeStory, setActiveStory] = useState<Post | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<{ postId?: string; coupleId?: string } | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate content');
  const [expandedPostComments, setExpandedPostComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>({
    post_001: [
      {
        id: 'c1',
        post_id: 'post_001',
        author_id: 'usr_her_002',
        couple_id: 'cpl_me_and_you_main',
        body: 'Huge congratulations to you two!! This gives us so much hope for our upcoming reunion.',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        author_name: 'Her',
        author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60',
      },
    ],
  });

  // Create Post state
  const [postBody, setPostBody] = useState('');
  const [momentTag, setMomentTag] = useState('Daily Ritual');
  const [isStory, setIsStory] = useState(false);
  const [postPhoto, setPostPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Explore State
  const [ranking, setRanking] = useState<'distance' | 'reunion' | 'recently_met'>('reunion');
  const [searchQuery, setSearchQuery] = useState('');

  // 24-hour stories
  const nowTime = Date.now();
  const storyPosts = communityPosts.filter((p) => {
    if (!p.expires_at) return false;
    const expires = new Date(p.expires_at).getTime();
    return expires > nowTime;
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 1600, 1600, 0.85);
      setPostPhoto(compressed.dataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postBody.trim()) return;
    setRateError(null);

    const res = await createCommunityPost({
      body: postBody.trim(),
      momentTag,
      mediaPath: postPhoto || undefined,
      isStory,
    });

    if (res.error) {
      setRateError(res.error);
      return;
    }

    setPostBody('');
    setPostPhoto(null);
    setIsStory(false);
    setIsCreateModalOpen(false);
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const res = await addComment(postId, text);
    if (res.error) {
      alert(res.error);
      return;
    }

    if (res.comment) {
      setLocalComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment!],
      }));
    }

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleOpenReport = (postId?: string, targetCoupleId?: string) => {
    setReportingItem({ postId, coupleId: targetCoupleId });
    setIsReportModalOpen(true);
  };

  const handleConfirmReport = async () => {
    if (reportingItem) {
      await reportContent(reportReason, reportingItem.postId, reportingItem.coupleId);
      setIsReportModalOpen(false);
      setReportingItem(null);
      alert('Thank you for keeping our community safe. Report submitted.');
    }
  };

  // Filter explore couples
  const filteredExploreCouples = EXPLORE_COUPLES.filter((c) => {
    if (ranking === 'recently_met') {
      const daysSinceMet = Math.abs(
        Math.floor((nowTime - new Date(c.lastMetDate).getTime()) / (1000 * 60 * 60 * 24))
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
    if (ranking === 'distance') return b.distanceKm - a.distanceKm;
    if (ranking === 'reunion') return new Date(a.reunionDate).getTime() - new Date(b.reunionDate).getTime();
    return new Date(b.lastMetDate).getTime() - new Date(a.lastMetDate).getTime();
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-2">
            <Sparkles size={20} className="text-[#C85A32]" />
            <span>Community</span>
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5">
            {subTab === 'feed'
              ? 'Public stories, advice and encouragement from couples'
              : 'Discover other long-distance couples across the world'}
          </p>
        </div>

        {subTab === 'feed' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white py-2 px-3.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Share Moment</span>
          </button>
        )}
      </div>

      {/* Segmented Switcher between Feed and Explore */}
      <div className="p-1 rounded-2xl bg-[#EFE9DF] dark:bg-[#25201C] flex items-center border border-[#E0D7CC] dark:border-[#38312B]">
        <button
          onClick={() => setSubTab('feed')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px] cursor-pointer ${
            subTab === 'feed'
              ? 'bg-white dark:bg-[#322A24] text-[#C85A32] shadow-xs'
              : 'text-[#6E645B] dark:text-[#A89F95] hover:text-[#2D2825] dark:hover:text-[#F3EFEA]'
          }`}
        >
          <Sparkles size={15} />
          <span>Feed & Stories</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F2] dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
            {communityPosts.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('explore')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px] cursor-pointer ${
            subTab === 'explore'
              ? 'bg-white dark:bg-[#322A24] text-[#C85A32] shadow-xs'
              : 'text-[#6E645B] dark:text-[#A89F95] hover:text-[#2D2825] dark:hover:text-[#F3EFEA]'
          }`}
        >
          <Compass size={15} />
          <span>Explore Couples</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F2] dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A]">
            {EXPLORE_COUPLES.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          SUB-VIEW 1: FEED & STORIES
         ======================================================== */}
      {subTab === 'feed' && (
        <div className="space-y-4">
          {/* 24-Hour Stories Carousel */}
          {storyPosts.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] px-1">
                <Clock size={13} className="text-[#C85A32]" />
                <span>24h Distance Stories</span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 no-scrollbar">
                {storyPosts.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => setActiveStory(story)}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#C85A32] via-[#FB7185] to-[#F59E0B] shadow-xs group-hover:scale-105 transition-transform">
                      <img
                        src={
                          story.media_path ||
                          story.author?.avatar_url ||
                          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100'
                        }
                        alt={story.couple?.name || 'Couple'}
                        className="w-full h-full rounded-full object-cover border-2 border-[#FAF7F2] dark:border-[#1E1B18]"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#524A43] dark:text-[#D5CCC1] truncate max-w-[68px]">
                      {story.couple?.name || 'Couple'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {communityPosts.map((post) => {
              const isMyCouple = post.couple_id === couple.id;
              const isFollowing = followingCouples.includes(post.couple_id);
              const comments = localComments[post.id] || [];
              const isCommentsExpanded = expandedPostComments === post.id;

              return (
                <article
                  key={post.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] shadow-xs space-y-3.5 transition-all hover:border-[#C85A32]/40"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          post.author?.avatar_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'
                        }
                        alt={post.couple?.name || 'Couple'}
                        className="w-10 h-10 rounded-full object-cover border border-[#C85A32]/30"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA] leading-none">
                            {post.couple?.name || 'Couple'}
                          </h3>
                          {!isMyCouple && (
                            <button
                              onClick={() => toggleFollow(post.couple_id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                                isFollowing
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-[#C85A32]/10 text-[#C85A32] hover:bg-[#C85A32]/20'
                              }`}
                            >
                              {isFollowing ? 'Following' : '+ Follow'}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8C827A] mt-1 font-medium">
                          {post.couple?.city_a || 'City A'} ⇄ {post.couple?.city_b || 'City B'} •{' '}
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] text-[#C85A32]">
                        {post.moment_tag}
                      </span>
                      {!isMyCouple && (
                        <button
                          onClick={() => handleOpenReport(post.id, post.couple_id)}
                          title="Report or Block"
                          className="p-1 text-[#8C827A] hover:text-[#C85A32] rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        >
                          <MoreVertical size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs sm:text-sm text-[#3E3833] dark:text-[#DDD5CC] leading-relaxed whitespace-pre-line">
                    {post.body}
                  </p>

                  {/* Media */}
                  {post.media_path && (
                    <div className="relative rounded-2xl overflow-hidden max-h-[380px] bg-[#E8DFD5] dark:bg-[#2E2824] border border-[#E8DFD5] dark:border-[#38302A]">
                      <img
                        src={post.media_path}
                        alt="Community post media"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Reactions: Hug, Strength, Heart */}
                  <div className="pt-2 border-t border-[#E8DFD5] dark:border-[#38302A] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => toggleReaction(post.id, 'heart')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                          post.my_reaction === 'heart'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 scale-105'
                            : 'bg-[#F2EDE4]/70 dark:bg-[#28231F] text-[#524A43] dark:text-[#D5CCC1] hover:bg-rose-50'
                        }`}
                      >
                        <Heart
                          size={14}
                          className={post.my_reaction === 'heart' ? 'fill-rose-600' : ''}
                        />
                        <span>{post.reactions_count?.heart || 0}</span>
                      </button>

                      <button
                        onClick={() => toggleReaction(post.id, 'hug')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                          post.my_reaction === 'hug'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 scale-105'
                            : 'bg-[#F2EDE4]/70 dark:bg-[#28231F] text-[#524A43] dark:text-[#D5CCC1] hover:bg-amber-50'
                        }`}
                      >
                        <span>🤗</span>
                        <span>{post.reactions_count?.hug || 0}</span>
                      </button>

                      <button
                        onClick={() => toggleReaction(post.id, 'strength')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                          post.my_reaction === 'strength'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 scale-105'
                            : 'bg-[#F2EDE4]/70 dark:bg-[#28231F] text-[#524A43] dark:text-[#D5CCC1] hover:bg-blue-50'
                        }`}
                      >
                        <span>💪</span>
                        <span>{post.reactions_count?.strength || 0}</span>
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedPostComments(
                          expandedPostComments === post.id ? null : post.id
                        )
                      }
                      className="flex items-center gap-1.5 text-xs font-medium text-[#7A6F66] dark:text-[#A89F95] hover:text-[#C85A32] p-1.5 rounded-xl min-h-[36px] cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>
                        {(post.comments_count || 0) +
                          (comments.length > 0 ? comments.length : 0)}{' '}
                        Comments
                      </span>
                    </button>
                  </div>

                  {/* Comments Accordion */}
                  {isCommentsExpanded && (
                    <div className="pt-3 border-t border-[#E8DFD5] dark:border-[#38302A] space-y-3">
                      {comments.map((comm) => (
                        <div key={comm.id} className="flex items-start gap-2 text-xs">
                          <img
                            src={
                              comm.author_avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'
                            }
                            alt={comm.author_name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="bg-[#FAF7F2] dark:bg-[#28231F] p-2.5 rounded-2xl flex-1 border border-[#E8DFD5] dark:border-[#38302A]">
                            <span className="font-bold text-[#2D2825] dark:text-[#F3EFEA] block text-[11px]">
                              {comm.author_name}
                            </span>
                            <p className="text-[#524A43] dark:text-[#DDD5CC] mt-0.5">
                              {comm.body}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Write an encouraging comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          className="flex-1 bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="p-2.5 bg-[#C85A32] text-white rounded-2xl hover:bg-[#B34E29] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-VIEW 2: EXPLORE COUPLES
         ======================================================== */}
      {subTab === 'explore' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
            <input
              type="text"
              placeholder="Search couples by city, country or names (e.g. Tokyo, Canada)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#211D1A] border border-[#E8DFD5] dark:border-[#38302A] rounded-2xl py-2.5 pl-10 pr-4 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] shadow-xs min-h-[44px]"
            />
          </div>

          {/* Ranking Chips */}
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
              Recently Met (&lt;14d)
            </button>
          </div>

          {/* Couples List */}
          <div className="space-y-3">
            {filteredExploreCouples.map((c) => {
              const isFollowing = followingCouples.includes(c.id);
              const daysToReunion = Math.max(
                0,
                Math.ceil(
                  (new Date(c.reunionDate).getTime() - nowTime) / (1000 * 60 * 60 * 24)
                )
              );
              const daysSinceMet = Math.abs(
                Math.floor(
                  (nowTime - new Date(c.lastMetDate).getTime()) / (1000 * 60 * 60 * 24)
                )
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

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E8DFD5] dark:border-[#38302A] text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C85A32]/10 text-[#C85A32] font-semibold">
                      Reunion in {daysToReunion} days
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
      )}

      {/* 24-Hour Story Fullscreen Modal */}
      {activeStory && (
        <div
          onClick={() => setActiveStory(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        >
          <div
            className="relative max-w-sm w-full bg-[#1C1917] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-4 right-4 z-20 text-white bg-black/50 p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="p-4 flex items-center gap-2.5 text-white bg-gradient-to-b from-black/80 to-transparent">
              <img
                src={
                  activeStory.author?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'
                }
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-white/50"
              />
              <div>
                <h4 className="text-xs font-bold">{activeStory.couple?.name}</h4>
                <p className="text-[10px] text-white/70">
                  {activeStory.couple?.city_a} ⇄ {activeStory.couple?.city_b} • 24h Story
                </p>
              </div>
            </div>

            {activeStory.media_path && (
              <img
                src={activeStory.media_path}
                alt="Story media"
                className="w-full max-h-[60vh] object-cover"
              />
            )}

            <div className="p-4 text-white text-xs leading-relaxed bg-[#1C1917]">
              <span className="text-[10px] font-bold text-[#FB7185] uppercase tracking-wider block mb-1">
                {activeStory.moment_tag}
              </span>
              <p>{activeStory.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Moment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              Share Distance Moment
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Inspire other couples. Only couple name & cities are displayed; emails and exact locations remain private.
            </p>

            {rateError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{rateError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Moment Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOMENT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMomentTag(tag)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                        momentTag === tag
                          ? 'bg-[#C85A32] text-white'
                          : 'bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38302A] text-[#524A43] dark:text-[#DDD5CC]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  What's on your heart?
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share a milestone, tips for video dates, or celebrating closing the distance..."
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl p-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Attach Photo (optional, auto-compressed to 1600px)
                </label>
                {postPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden max-h-40 border border-[#C85A32]">
                    <img src={postPhoto} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPostPhoto(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="p-4 rounded-2xl border-2 border-dashed border-[#D9D0C5] dark:border-[#403833] hover:border-[#C85A32] flex items-center justify-center gap-2 text-xs text-[#8C827A] cursor-pointer min-h-[44px]">
                    <ImageIcon size={18} />
                    <span>Upload Picture (stores in public-media)</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
                {isCompressing && (
                  <p className="text-[10px] text-[#C85A32] animate-pulse mt-1">Compressing image...</p>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#2D2825] dark:text-[#F3EFEA] block">
                    Post as 24-Hour Story
                  </span>
                  <span className="text-[10px] text-[#8C827A]">
                    Appears in stories bar and expires automatically after 24 hours
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isStory}
                  onChange={(e) => setIsStory(e.target.checked)}
                  className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer min-h-[20px] min-w-[20px]"
                />
              </div>

              <button
                type="submit"
                disabled={isCompressing}
                className="w-full bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                <span>Publish to Community</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Safety: Report / Block Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] text-center mb-1">
              Safety & Moderation
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] text-center mb-4">
              Help us keep the Me & You community respectful and safe.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Reason for reporting:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] min-h-[44px]"
                >
                  <option value="Inappropriate content">Inappropriate or offensive content</option>
                  <option value="Harassment or spam">Harassment or spam</option>
                  <option value="Privacy violation">Privacy violation</option>
                  <option value="Fake couple profile">Misleading or fake couple profile</option>
                </select>
              </div>

              <button
                onClick={handleConfirmReport}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer"
              >
                Submit Report to Admins
              </button>

              {reportingItem?.coupleId && (
                <button
                  onClick={() => {
                    blockCouple(reportingItem.coupleId!);
                    setIsReportModalOpen(false);
                    alert('Couple blocked. Their posts will no longer be visible to you.');
                  }}
                  className="w-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 py-2.5 rounded-2xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
                >
                  Block This Couple
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
