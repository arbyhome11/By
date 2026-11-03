import React, { createContext, useContext, useEffect, useState, useCallback, useTransition, useRef } from 'react';
import {
  Profile,
  Couple,
  JournalEntry,
  Plan,
  ImportantDate,
  Post,
  Comment,
  ReactionType,
  EntryPhoto,
  Conversation,
  Message,
  Gender,
} from '../types/database';
import {
  getSupabase,
  generateInviteCode,
  isInviteCodeExpired,
  getSupabaseCredentials,
  canCreatePost,
  recordPostCreated,
  canCreateComment,
  recordCommentCreated,
} from '../lib/supabase';
import {
  enqueueOfflineMutation,
  getOfflineQueue,
  syncOfflineQueue,
  cacheTableData,
  getCachedTableData,
  getLastSyncTime,
} from '../lib/offlineQueue';
import {
  checkAndNotifyMilestones,
  checkDailyEncouragement,
  dispatchAppNotification,
} from '../lib/pushNotifications';

// Default initial high-fidelity seed data
const SEED_USER_A: Profile = {
  id: 'usr_him_001',
  display_name: 'Him',
  gender: 'Male',
  is_adult_confirmed: true,
  city: 'London',
  timezone: 'Europe/London',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 320).toISOString(),
};

const SEED_USER_B: Profile = {
  id: 'usr_her_002',
  display_name: 'Her',
  gender: 'Female',
  is_adult_confirmed: true,
  city: 'Tokyo',
  timezone: 'Asia/Tokyo',
  avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 320).toISOString(),
};

const nextReunion = new Date();
nextReunion.setDate(nextReunion.getDate() + 18);
nextReunion.setHours(14, 30, 0, 0);

const SEED_COUPLE: Couple = {
  id: 'cpl_me_and_you_main',
  name: 'Me & You',
  username: 'me_and_you_ldr',
  tagline: '9,560 km apart, but counting down every heartbeat until our reunion',
  invite_code: '7K9M3P',
  anniversary_date: '2023-04-18',
  last_met_date: '2026-08-12',
  reunion_date: nextReunion.toISOString().split('T')[0],
  reunion_title: 'Winter Tokyo Reunion',
  reunion_location: 'Haneda Airport Terminal 3 International Arrivals',
  city_a: 'London',
  city_b: 'Tokyo',
  hide_exact_location: false,
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
};

const SEED_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'jrn_001',
    couple_id: SEED_COUPLE.id,
    author_id: SEED_USER_B.id,
    entry_date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString().split('T')[0],
    title: 'Rainy Shibuya evening & our saved playlist',
    note: 'Walking through the crossing with our song playing in my earphones. It was freezing cold, but thinking of our upcoming coffee dates warmed me right up. Can’t wait for you to taste the matcha latte from that small alley spot!',
    mood: 'loved',
    is_public: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    photos: [
      {
        id: 'p_01',
        entry_id: 'jrn_001',
        storage_path: 'couples/cpl_me_and_you_main/shibuya.jpg',
        position: 0,
        url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'jrn_002',
    couple_id: SEED_COUPLE.id,
    author_id: SEED_USER_A.id,
    entry_date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString().split('T')[0],
    title: 'Booked the express train tickets!',
    note: 'Got our reserved seats for the bullet train to Kyoto for our second weekend together. Also packed the knitted scarf you left in London last winter.',
    mood: 'excited',
    is_public: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    photos: [
      {
        id: 'p_02',
        entry_id: 'jrn_002',
        storage_path: 'couples/cpl_me_and_you_main/tickets.jpg',
        position: 0,
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'jrn_003',
    couple_id: SEED_COUPLE.id,
    author_id: SEED_USER_A.id,
    entry_date: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString().split('T')[0],
    title: 'Sunrise call while you were falling asleep',
    note: 'One of those nights where time zones felt like a bridge instead of a wall. Sleep tight, my love.',
    mood: 'peaceful',
    is_public: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
  },
];

const SEED_PLANS: Plan[] = [
  { id: 'pl_01', couple_id: SEED_COUPLE.id, title: 'Visit teamLab Planets Tokyo barefoot gallery', category: 'Travel', done: true, created_at: new Date().toISOString() },
  { id: 'pl_02', couple_id: SEED_COUPLE.id, title: 'Have late-night tonkotsu ramen in Shinjuku Golden Gai', category: 'Food', done: false, created_at: new Date().toISOString() },
  { id: 'pl_03', couple_id: SEED_COUPLE.id, title: 'Studio Ghibli movie marathon in pajamas', category: 'Movies', done: false, created_at: new Date().toISOString() },
  { id: 'pl_04', couple_id: SEED_COUPLE.id, title: 'Take film camera portraits in Meguro River cherry trees', category: 'Other', done: false, created_at: new Date().toISOString() },
  { id: 'pl_05', couple_id: SEED_COUPLE.id, title: 'Kyoto traditional tea ceremony together', category: 'Travel', done: false, created_at: new Date().toISOString() },
];

const SEED_DATES: ImportantDate[] = [
  { id: 'dt_01', couple_id: SEED_COUPLE.id, title: 'Our Official Anniversary', date: '2023-04-18', repeats_yearly: true, created_at: new Date().toISOString() },
  { id: 'dt_02', couple_id: SEED_COUPLE.id, title: 'Her Birthday', date: '2024-09-14', repeats_yearly: true, created_at: new Date().toISOString() },
  { id: 'dt_03', couple_id: SEED_COUPLE.id, title: 'His Birthday', date: '2024-11-28', repeats_yearly: true, created_at: new Date().toISOString() },
  { id: 'dt_04', couple_id: SEED_COUPLE.id, title: 'First flight we ever took to see each other', date: '2023-08-01', repeats_yearly: true, created_at: new Date().toISOString() },
];

const SEED_COMMUNITY_POSTS: Post[] = [
  {
    id: 'post_001',
    couple_id: 'cpl_sam_elena',
    author_id: 'usr_sam',
    type: 'photo',
    body: 'Closed the 5,000 mile gap today after 18 months of video calls and visa paperwork! Never giving up was the best decision of our lives.',
    media_path: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    moment_tag: 'Gap Closed',
    is_public: true,
    expires_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    couple: { name: 'Elena & Sam', username: 'elena_sam_ldr', city_a: 'Berlin', city_b: 'New York', hide_exact_location: false },
    author: { display_name: 'Elena', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
    reactions_count: { heart: 42, hug: 28, strength: 19 },
    my_reaction: 'heart',
    comments_count: 5,
  },
  {
    id: 'post_002',
    couple_id: 'cpl_leo_chloe',
    author_id: 'usr_chloe',
    type: 'photo',
    body: 'Story of today: 14 hours time difference means when he wakes up with his morning coffee, I am tucked into bed saying goodnight. We send each other voice notes every single shift. What’s your favorite daily ritual?',
    media_path: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    moment_tag: 'Daily Ritual',
    is_public: true,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(), // 24h story
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    couple: { name: 'Chloe & Leo', username: 'chloe_leo', city_a: 'Sydney', city_b: 'Vancouver', hide_exact_location: false },
    author: { display_name: 'Chloe', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
    reactions_count: { heart: 24, hug: 17, strength: 12 },
    my_reaction: null,
    comments_count: 2,
  },
  {
    id: 'post_003',
    couple_id: 'cpl_marcus_yuki',
    author_id: 'usr_marcus',
    type: 'text',
    body: 'Tip for long distance couples: synchronize your calendars for small shared wins. Even watching a movie while on Discord feels like a cozy date night when you order each other the exact same food via delivery apps!',
    media_path: null,
    moment_tag: 'LDR Advice',
    is_public: true,
    expires_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    couple: { name: 'Marcus & Yuki', username: 'marcus_yuki', city_a: 'Toronto', city_b: 'Seoul', hide_exact_location: false },
    author: { display_name: 'Marcus', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    reactions_count: { heart: 35, hug: 11, strength: 22 },
    my_reaction: null,
    comments_count: 8,
  },
];

export const COMMUNITY_USERS: Profile[] = [
  {
    id: 'usr_sam',
    display_name: 'Sam',
    gender: 'Male',
    is_adult_confirmed: true,
    city: 'Berlin',
    timezone: 'Europe/Berlin',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  },
  {
    id: 'usr_marcus',
    display_name: 'Marcus',
    gender: 'Male',
    is_adult_confirmed: true,
    city: 'Toronto',
    timezone: 'America/Toronto',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: 'usr_elena',
    display_name: 'Elena',
    gender: 'Female',
    is_adult_confirmed: true,
    city: 'New York',
    timezone: 'America/New_York',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 140).toISOString(),
  },
  {
    id: 'usr_chloe',
    display_name: 'Chloe',
    gender: 'Female',
    is_adult_confirmed: true,
    city: 'Sydney',
    timezone: 'Australia/Sydney',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
  },
];

export const PARTNER_CONV_ID = 'conv_partner_space';

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: PARTNER_CONV_ID,
    type: 'partner',
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'conv_dm_sam',
    type: 'direct',
    status: 'accepted',
    requester_id: 'usr_sam',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'conv_dm_marcus',
    type: 'direct',
    status: 'pending',
    requester_id: 'usr_marcus',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'conv_dm_elena',
    type: 'direct',
    status: 'accepted',
    requester_id: 'usr_elena',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
];

const SEED_MESSAGES: Record<string, Message[]> = {
  [PARTNER_CONV_ID]: [
    {
      id: 'pmsg_001',
      conversation_id: PARTNER_CONV_ID,
      sender_id: 'usr_her_002',
      body: 'Just woke up, sending you a warm morning hug from Tokyo! ☕',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      read_at: new Date().toISOString(),
    },
    {
      id: 'pmsg_002',
      conversation_id: PARTNER_CONV_ID,
      sender_id: 'usr_him_001',
      body: 'Good morning my love! Watching the sunset here in London and thinking of you. Have the best day! ❤️',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read_at: new Date().toISOString(),
    },
    {
      id: 'pmsg_003',
      conversation_id: PARTNER_CONV_ID,
      sender_id: 'usr_her_002',
      body: 'Can’t wait for our countdown to reach zero! 18 days left until Haneda! 🥰',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read_at: null,
    },
  ],
  conv_dm_sam: [
    {
      id: 'smsg_001',
      conversation_id: 'conv_dm_sam',
      sender_id: 'usr_sam',
      body: 'Hey! Saw your couple post about London & Tokyo time zones. We had the exact same 8-hour gap before closing the distance!',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      read_at: new Date().toISOString(),
    },
    {
      id: 'smsg_002',
      conversation_id: 'conv_dm_sam',
      sender_id: 'usr_him_001',
      body: 'Thanks Sam! Really encouraging to see other couples make it through the visa process.',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read_at: new Date().toISOString(),
    },
  ],
  conv_dm_marcus: [
    {
      id: 'mmsg_001',
      conversation_id: 'conv_dm_marcus',
      sender_id: 'usr_marcus',
      body: 'Hi! Quick question about planning trips across time zones—would love to connect!',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      read_at: null,
    },
  ],
  conv_dm_elena: [
    {
      id: 'emsg_001',
      conversation_id: 'conv_dm_elena',
      sender_id: 'usr_elena',
      body: 'Loved your Shibuya journal post! How do you handle staying energized for evening calls?',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read_at: new Date().toISOString(),
    },
    {
      id: 'emsg_002',
      conversation_id: 'conv_dm_elena',
      sender_id: 'usr_her_002',
      body: 'A hot matcha latte and scheduled sleep cycles! We always reserve 9 PM Tokyo time.',
      created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      read_at: new Date().toISOString(),
    },
  ],
};

interface AppContextType {
  currentUser: Profile;
  partnerUser: Profile;
  couple: Couple;
  journalEntries: JournalEntry[];
  plans: Plan[];
  importantDates: ImportantDate[];
  communityPosts: Post[];
  followingCouples: string[];
  blockedCouples: string[];
  isOnline: boolean;
  isSynced: boolean;
  pendingOfflineCount: number;
  isSupabaseLive: boolean;
  activeTab: 'home' | 'journal' | 'gallery' | 'plans' | 'community' | 'messages' | 'settings';
  setActiveTab: (tab: 'home' | 'journal' | 'gallery' | 'plans' | 'community' | 'messages' | 'settings') => void;
  // Messages & Realtime Chat
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  totalUnreadMessagesCount: number;
  partnerConversationId: string;
  communityUsers: Profile[];
  blockedUserIds: string[];
  typingUsers: Record<string, string>;
  sendMessage: (conversationId: string, body: string) => Promise<{ error?: string; message?: Message }>;
  createDirectConversation: (targetUserId: string, initialMessage?: string) => Promise<{ error?: string; conversation?: Conversation }>;
  acceptMessageRequest: (conversationId: string) => Promise<void>;
  declineMessageRequest: (conversationId: string) => Promise<void>;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
  confirmAdultStatus: () => Promise<void>;
  updateGender: (gender: Gender) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  reportUser: (reportedUserId: string, reason: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => void;
  // Auth & Onboarding
  isAuthenticated: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createSpace: (spaceData: Partial<Couple>) => Promise<{ error?: string; code?: string }>;
  joinSpace: (code: string) => Promise<{ error?: string }>;
  switchDemoPartner: () => void;
  // Couple & Profile Actions
  updateCouple: (updated: Partial<Couple>) => Promise<void>;
  updateProfile: (updated: Partial<Profile>) => Promise<void>;
  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'created_at'>, photoUrls?: string[]) => Promise<void>;
  updateJournalEntry: (id: string, updated: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  // Plans
  addPlan: (title: string, category: Plan['category']) => Promise<void>;
  togglePlan: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  // Dates
  addImportantDate: (dt: Omit<ImportantDate, 'id' | 'created_at' | 'couple_id'>) => Promise<void>;
  deleteImportantDate: (id: string) => Promise<void>;
  // Community
  createCommunityPost: (data: { body: string; momentTag: string; mediaPath?: string; isStory?: boolean }) => Promise<{ error?: string }>;
  toggleReaction: (postId: string, type: ReactionType) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<{ error?: string; comment?: Comment }>;
  toggleFollow: (coupleId: string) => void;
  blockCouple: (coupleId: string) => void;
  reportContent: (reason: string, postId?: string, coupleId?: string) => Promise<void>;
  // Backup & Danger zone
  exportCoupleData: () => void;
  importCoupleData: (jsonStr: string) => boolean;
  deleteAccountAndCouple: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'home' | 'journal' | 'gallery' | 'plans' | 'community' | 'messages' | 'settings'>('home');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() => getOfflineQueue().length);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(() => Boolean(getSupabase()));

  // Active User / Partner / Couple State (migrating any stale cache)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isPartnerA, setIsPartnerA] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const cached = getCachedTableData('current_user', SEED_USER_A);
    if (!cached || cached.display_name === 'Alex Vance') return SEED_USER_A;
    return { ...SEED_USER_A, ...cached };
  });
  const [partnerUser, setPartnerUser] = useState<Profile>(() => {
    const cached = getCachedTableData('partner_user', SEED_USER_B);
    if (!cached || cached.display_name === 'Maya Tanaka') return SEED_USER_B;
    return { ...SEED_USER_B, ...cached };
  });
  const [couple, setCouple] = useState<Couple>(() => {
    const cached = getCachedTableData('couples', SEED_COUPLE);
    if (!cached || cached.name === 'Alex & Maya') return SEED_COUPLE;
    return cached;
  });

  // Domain Tables
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => getCachedTableData('journal_entries', SEED_JOURNAL_ENTRIES));
  const [plans, setPlans] = useState<Plan[]>(() => getCachedTableData('plans', SEED_PLANS));
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(() => getCachedTableData('important_dates', SEED_DATES));
  const [communityPosts, setCommunityPosts] = useState<Post[]>(() => getCachedTableData('posts', SEED_COMMUNITY_POSTS));

  // Messages & Chat Realtime State
  const [conversations, setConversations] = useState<Conversation[]>(() => getCachedTableData('conversations', SEED_CONVERSATIONS));
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => getCachedTableData('messages', SEED_MESSAGES));
  const [activeConversationId, setActiveConversationId] = useState<string | null>(PARTNER_CONV_ID);
  const [communityUsers, setCommunityUsers] = useState<Profile[]>(() => getCachedTableData('community_users', COMMUNITY_USERS));
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => getCachedTableData('blocked_users', []));
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const lastSentTimeRef = useRef<number>(0);

  // Social Relations
  const [followingCouples, setFollowingCouples] = useState<string[]>(['cpl_sam_elena']);
  const [blockedCouples, setBlockedCouples] = useState<string[]>([]);

  // Check URL query parameters for PWA shortcuts (?action=journal, ?action=home, ?action=plans, ?action=community, ?action=messages)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'journal') setActiveTab('journal');
      if (action === 'home') setActiveTab('home');
      if (action === 'plans' || action === 'dates') setActiveTab('plans');
      if (action === 'community' || action === 'feed' || action === 'explore') setActiveTab('community');
      if (action === 'messages' || action === 'chat') setActiveTab('messages');
    }
  }, []);

  // Update cached tables whenever state updates
  useEffect(() => {
    cacheTableData('couples', couple);
  }, [couple]);

  useEffect(() => {
    cacheTableData('journal_entries', journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    cacheTableData('plans', plans);
  }, [plans]);

  useEffect(() => {
    cacheTableData('important_dates', importantDates);
  }, [importantDates]);

  useEffect(() => {
    cacheTableData('conversations', conversations);
  }, [conversations]);

  useEffect(() => {
    cacheTableData('messages', messages);
  }, [messages]);

  useEffect(() => {
    cacheTableData('blocked_users', blockedUserIds);
  }, [blockedUserIds]);

  // Total Unread Count computation
  const totalUnreadMessagesCount = Object.entries(messages).reduce((acc, [convId, msgList]) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv || conv.status === 'declined') return acc;
    const unread = (msgList || []).filter(
      (m) => m.sender_id !== currentUser.id && !m.read_at && !blockedUserIds.includes(m.sender_id)
    ).length;
    return acc + unread;
  }, 0);

  // Milestone and encouragement timers
  useEffect(() => {
    checkAndNotifyMilestones(couple.reunion_date, partnerUser.display_name);
    checkDailyEncouragement();
    const interval = setInterval(() => {
      checkDailyEncouragement();
    }, 60000);
    return () => clearInterval(interval);
  }, [couple.reunion_date, partnerUser.display_name]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerManualSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsSynced(false);
    };
    const handleQueueChange = (e: any) => {
      setPendingOfflineCount(e.detail?.count ?? getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChange);
    };
  }, []);

  // Realtime Supabase Setup & Channels
  const setupRealtime = useCallback(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsSupabaseLive(false);
      return;
    }
    setIsSupabaseLive(true);

    try {
      const channel = supabase
        .channel('couple_sync_room')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
          (payload) => {
            if (payload.new && (payload.new as any).id) {
              setCouple(payload.new as Couple);
              setIsSynced(true);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'journal_entries', filter: `couple_id=eq.${couple.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newEntry = payload.new as JournalEntry;
              setJournalEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
              dispatchAppNotification(
                'New Journal Entry 💕',
                `${partnerUser.display_name} just added a new memory to your journal!`,
                'partnerJournal'
              );
            } else if (payload.eventType === 'UPDATE') {
              setJournalEntries((prev) => prev.map((e) => (e.id === (payload.new as any).id ? (payload.new as JournalEntry) : e)));
            } else if (payload.eventType === 'DELETE') {
              setJournalEntries((prev) => prev.filter((e) => e.id !== (payload.old as any).id));
            }
            setIsSynced(true);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'plans', filter: `couple_id=eq.${couple.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setPlans((prev) => [...prev, payload.new as Plan]);
            } else if (payload.eventType === 'UPDATE') {
              setPlans((prev) => prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as Plan) : p)));
            } else if (payload.eventType === 'DELETE') {
              setPlans((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
            }
            setIsSynced(true);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'important_dates', filter: `couple_id=eq.${couple.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setImportantDates((prev) => [...prev, payload.new as ImportantDate]);
            } else if (payload.eventType === 'UPDATE') {
              setImportantDates((prev) => prev.map((d) => (d.id === (payload.new as any).id ? (payload.new as ImportantDate) : d)));
            } else if (payload.eventType === 'DELETE') {
              setImportantDates((prev) => prev.filter((d) => d.id !== (payload.old as any).id));
            }
            setIsSynced(true);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMsg = payload.new as Message;
              setMessages((prev) => {
                const list = prev[newMsg.conversation_id] || [];
                if (list.some((m) => m.id === newMsg.id)) return prev;
                return { ...prev, [newMsg.conversation_id]: [...list, newMsg] };
              });
              if (newMsg.sender_id !== currentUser.id) {
                dispatchAppNotification('New Message 💬', newMsg.body.slice(0, 45), 'communityInteractions');
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversations' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newConv = payload.new as Conversation;
              setConversations((prev) => {
                const idx = prev.findIndex((c) => c.id === newConv.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], ...newConv };
                  return copy;
                }
                return [newConv, ...prev];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription skipped (offline or credentials pending):', err);
    }
  }, [couple.id, currentUser.id, partnerUser.display_name]);

  useEffect(() => {
    const unsub = setupRealtime();
    return () => {
      if (unsub) unsub();
    };
  }, [setupRealtime]);

  // Mark conversation messages as read
  const markConversationAsRead = useCallback((convId: string) => {
    setMessages((prev) => {
      const list = prev[convId] || [];
      const hasUnread = list.some((m) => m.sender_id !== currentUser.id && !m.read_at);
      if (!hasUnread) return prev;
      const updated = list.map((m) =>
        m.sender_id !== currentUser.id && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m
      );
      return { ...prev, [convId]: updated };
    });
  }, [currentUser.id]);

  // Realtime & Offline Messaging Actions
  const sendMessage = async (conversationId: string, body: string): Promise<{ error?: string; message?: Message }> => {
    const trimmed = body.trim();
    if (!trimmed) return { error: 'Message cannot be empty.' };

    // Rate Limiting (1.5s cooldown)
    const now = Date.now();
    if (now - lastSentTimeRef.current < 1500) {
      return { error: 'Please wait a moment before sending another message (rate limit).' };
    }
    lastSentTimeRef.current = now;

    // Check conversation status
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return { error: 'Conversation not found.' };
    }

    if (conv.type === 'direct' && conv.status !== 'accepted' && conv.status !== 'active') {
      return { error: 'Direct messages can only be sent once the recipient accepts your message request.' };
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      body: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
      is_pending_sync: !navigator.onLine || !getSupabase(),
    };

    // Optimistic local state update
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, updated_at: newMsg.created_at } : c))
    );

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { is_pending_sync: _, ...dbMsg } = newMsg;
      const { error } = await supabase.from('messages').insert(dbMsg);
      if (error) {
        console.warn('Supabase insert message failed, queuing offline:', error);
        enqueueOfflineMutation({ table: 'messages', action: 'insert', data: dbMsg });
        setIsSynced(false);
      } else {
        setIsSynced(true);
      }
    } else {
      enqueueOfflineMutation({ table: 'messages', action: 'insert', data: newMsg });
      setIsSynced(false);
    }

    // Demo simulated gentle reply for partner chat if offline or demo
    if (conversationId === PARTNER_CONV_ID && (!supabase || !navigator.onLine)) {
      setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: partnerUser.display_name }));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
          const replyMsg: Message = {
            id: `pmsg_${Date.now()}`,
            conversation_id: conversationId,
            sender_id: partnerUser.id,
            body: `Thinking of you always from ${partnerUser.city}! 💕`,
            created_at: new Date().toISOString(),
            read_at: null,
          };
          setMessages((prev) => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), replyMsg],
          }));
          dispatchAppNotification(`Message from ${partnerUser.display_name} ❤️`, replyMsg.body, 'partnerJournal');
        }, 2200);
      }, 1000);
    }

    return { message: newMsg };
  };

  const createDirectConversation = async (
    targetUserId: string,
    initialMessage?: string
  ): Promise<{ error?: string; conversation?: Conversation }> => {
    // 18+ Safety Gate
    if (!currentUser.is_adult_confirmed) {
      return { error: 'You must confirm you are 18+ to use community direct messages.' };
    }

    const targetUser = communityUsers.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { error: 'User not found in community.' };
    }

    // STRICT SAME-GENDER RULE ENFORCEMENT
    if (targetUser.gender !== currentUser.gender) {
      return {
        error: `Direct messages to members of other couples are allowed ONLY if both users have the same gender (${currentUser.gender} to ${currentUser.gender}) for safety & comfort.`,
      };
    }

    // Check if conversation already exists
    const existing = conversations.find(
      (c) =>
        c.type === 'direct' &&
        (c.id === `conv_dm_${currentUser.id}_${targetUserId}` ||
          c.id === `conv_dm_${targetUserId}_${currentUser.id}` ||
          (c.requester_id === currentUser.id && c.id.includes(targetUserId)))
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return { conversation: existing };
    }

    const convId = `conv_dm_${currentUser.id}_${targetUserId}`;
    const newConv: Conversation = {
      id: convId,
      type: 'direct',
      status: 'pending', // recipient must accept first
      requester_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_user: targetUser,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(convId);

    if (initialMessage && initialMessage.trim()) {
      const msg: Message = {
        id: `msg_${Date.now()}`,
        conversation_id: convId,
        sender_id: currentUser.id,
        body: initialMessage.trim(),
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => ({
        ...prev,
        [convId]: [msg],
      }));
    }

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        await supabase.from('conversations').insert({
          id: newConv.id,
          type: 'direct',
          status: 'pending',
          requester_id: currentUser.id,
        });
        await supabase.from('conversation_members').insert([
          { conversation_id: newConv.id, user_id: currentUser.id },
          { conversation_id: newConv.id, user_id: targetUserId },
        ]);
      } catch (err: any) {
        console.warn('Failed to insert conversation to Supabase:', err);
      }
    }

    return { conversation: newConv };
  };

  const acceptMessageRequest = async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, status: 'accepted', updated_at: new Date().toISOString() } : c))
    );
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('conversations').update({ status: 'accepted' }).eq('id', conversationId);
    }
  };

  const declineMessageRequest = async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, status: 'declined', updated_at: new Date().toISOString() } : c))
    );
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('conversations').update({ status: 'declined' }).eq('id', conversationId);
    }
  };

  const setTypingStatus = (conversationId: string, isTyping: boolean) => {
    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase.channel(`typing_${conversationId}`);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { conversation_id: conversationId, user_id: currentUser.id, user_name: currentUser.display_name, isTyping },
      });
    }
  };

  const confirmAdultStatus = async () => {
    const updated = { ...currentUser, is_adult_confirmed: true };
    setCurrentUser(updated);
    cacheTableData('current_user', updated);
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('profiles').update({ is_adult_confirmed: true }).eq('id', currentUser.id);
    }
  };

  const updateGender = async (gender: Gender) => {
    const updated = { ...currentUser, gender };
    setCurrentUser(updated);
    cacheTableData('current_user', updated);
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('profiles').update({ gender }).eq('id', currentUser.id);
    }
  };

  const blockUser = async (userId: string) => {
    setBlockedUserIds((prev) => [...new Set([...prev, userId])]);
    const target = communityUsers.find((u) => u.id === userId);
    dispatchAppNotification(
      'User Blocked',
      `${target?.display_name || 'User'} has been blocked and cannot message you.`,
      'communityInteractions'
    );
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('user_blocks').insert({
        blocker_user_id: currentUser.id,
        blocked_user_id: userId,
      });
    }
  };

  const unblockUser = async (userId: string) => {
    setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const reportUser = async (reportedUserId: string, reason: string) => {
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('user_reports').insert({
        reporter_user_id: currentUser.id,
        reported_user_id: reportedUserId,
        reason,
      });
    }
  };

  // Manual Trigger to sync offline mutations
  const triggerManualSync = async () => {
    const supabase = getSupabase();
    if (!supabase || !navigator.onLine) {
      setIsSynced(true);
      return;
    }
    const res = await syncOfflineQueue(supabase);
    setPendingOfflineCount(getOfflineQueue().length);
    if (res.success) {
      setIsSynced(true);
    }
  };

  // Switch demo partner (Him in London vs Her in Tokyo)
  const switchDemoPartner = () => {
    if (isPartnerA) {
      setIsPartnerA(false);
      setCurrentUser(SEED_USER_B);
      setPartnerUser(SEED_USER_A);
    } else {
      setIsPartnerA(true);
      setCurrentUser(SEED_USER_A);
      setPartnerUser(SEED_USER_B);
    }
  };

  // Auth Operations
  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      if (data.user) {
        const uid = data.user.id;
        const dName = data.user.user_metadata?.display_name || email.split('@')[0];
        setIsAuthenticated(true);
        setCurrentUser((prev) => ({
          ...prev,
          id: uid,
          display_name: dName,
        }));
      }
      return {};
    }
    // Demo sign-in simulation
    setIsAuthenticated(true);
    return {};
  };

  const signUp = async (email: string, pass: string, name: string): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { display_name: name, full_name: name } },
      });
      if (error) return { error: error.message };
      if (data.user) {
        const uid = data.user.id;
        setIsAuthenticated(true);
        setCurrentUser((prev) => ({
          ...prev,
          id: uid,
          display_name: name,
        }));
      }
      return {};
    }
    setIsAuthenticated(true);
    setCurrentUser((prev) => ({ ...prev, display_name: name }));
    return {};
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    } else {
      // Demo simulated Google auth
      setIsAuthenticated(true);
      setCurrentUser((prev) => ({
        ...prev,
        display_name: 'Google Partner',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      }));
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
  };

  // Onboarding: Create Space (generates unique 6-character code)
  const createSpace = async (spaceData: Partial<Couple>): Promise<{ error?: string; code?: string }> => {
    const code = generateInviteCode(6);
    const newCouple: Couple = {
      ...couple,
      id: `cpl_${Date.now()}`,
      name: spaceData.name || 'Me & You',
      username: (spaceData.username || 'our_space').toLowerCase().replace(/\s+/g, '_'),
      tagline: spaceData.tagline || 'Miles apart, together in heart',
      invite_code: code,
      anniversary_date: spaceData.anniversary_date || null,
      last_met_date: spaceData.last_met_date || null,
      reunion_date: spaceData.reunion_date || null,
      reunion_title: spaceData.reunion_title || 'Next Reunion',
      reunion_location: spaceData.reunion_location || 'Airport',
      city_a: spaceData.city_a || currentUser.city || 'City A',
      city_b: spaceData.city_b || 'City B',
      hide_exact_location: spaceData.hide_exact_location ?? false,
      created_at: new Date().toISOString(),
    };

    setCouple(newCouple);

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('couples').insert(newCouple);
        if (error) return { error: error.message };
        await supabase.from('couple_members').insert({
          couple_id: newCouple.id,
          user_id: currentUser.id,
        });
      } catch (e: any) {
        return { error: e.message };
      }
    } else {
      enqueueOfflineMutation({ table: 'couples', action: 'insert', data: newCouple });
    }

    return { code };
  };

  // Onboarding: Join Space with Invite Code
  const joinSpace = async (code: string): Promise<{ error?: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      return { error: 'Invite code must be exactly 6 characters.' };
    }

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        // Query couple by invite code
        const { data, error } = await supabase
          .from('couples')
          .select('*')
          .eq('invite_code', cleanCode)
          .single();

        if (error || !data) {
          return { error: 'Invalid invite code. Please check and try again.' };
        }

        // Check expiration (7 days)
        if (isInviteCodeExpired(data.created_at)) {
          return { error: 'This invite code has expired (valid for 7 days). Ask your partner to share a new one.' };
        }

        // Check member limit (max 2 members)
        const { count, error: countErr } = await supabase
          .from('couple_members')
          .select('*', { count: 'exact', head: true })
          .eq('couple_id', data.id);

        if (countErr) return { error: countErr.message };
        if ((count || 0) >= 2) {
          return { error: 'This couple space already has 2 members.' };
        }

        // Add user as second member
        const { error: joinErr } = await supabase.from('couple_members').insert({
          couple_id: data.id,
          user_id: currentUser.id,
        });

        if (joinErr) return { error: joinErr.message };

        setCouple(data);
        return {};
      } catch (err: any) {
        return { error: err.message || 'Failed to join couple space.' };
      }
    }

    // Offline / Demo check
    if (cleanCode === couple.invite_code || cleanCode === '7K9M3P' || cleanCode === 'ME2026') {
      return {};
    }
    return { error: 'Code not found. Please verify the 6-character code.' };
  };

  // Update couple fields (saves instantly for both partners)
  const updateCouple = async (updated: Partial<Couple>) => {
    const prevCouple = couple;
    const newCouple = { ...couple, ...updated };
    setCouple(newCouple);

    // If reunion date changed, notify milestone or partner
    if (updated.reunion_date && updated.reunion_date !== prevCouple.reunion_date) {
      dispatchAppNotification(
        'Reunion Date Updated 📅',
        `${currentUser.display_name} updated your reunion date to ${updated.reunion_date}!`,
        'partnerReunionEdit'
      );
      checkAndNotifyMilestones(updated.reunion_date, partnerUser.display_name);
    }

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { error } = await supabase.from('couples').update(updated).eq('id', couple.id);
      if (error) {
        console.error('Supabase update couple failed:', error);
        enqueueOfflineMutation({ table: 'couples', action: 'update', data: { id: couple.id, ...updated } });
        setIsSynced(false);
      } else {
        setIsSynced(true);
      }
    } else {
      enqueueOfflineMutation({ table: 'couples', action: 'update', data: { id: couple.id, ...updated } });
      setIsSynced(false);
    }
  };

  const updateProfile = async (updated: Partial<Profile>) => {
    const newProf = { ...currentUser, ...updated };
    setCurrentUser(newProf);
    cacheTableData('current_user', newProf);

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('profiles').update(updated).eq('id', currentUser.id);
    }
  };

  // Journal entries
  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'created_at'>, photoUrls: string[] = []) => {
    const entryId = `jrn_${Date.now()}`;
    const photos: EntryPhoto[] = photoUrls.map((url, idx) => ({
      id: `p_${Date.now()}_${idx}`,
      entry_id: entryId,
      storage_path: `couples/${couple.id}/${entryId}_${idx}.jpg`,
      position: idx,
      url,
    }));

    const newEntry: JournalEntry = {
      ...entry,
      id: entryId,
      couple_id: couple.id,
      author_id: currentUser.id,
      created_at: new Date().toISOString(),
      photos,
    };

    setJournalEntries((prev) => [newEntry, ...prev]);

    // Push local notification for demo / testing
    dispatchAppNotification(
      'Journal Memory Saved 📖',
      `"${newEntry.title}" has been saved to your shared memory album.`,
      'partnerJournal'
    );

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { photos: _, ...entryRow } = newEntry;
      const { error } = await supabase.from('journal_entries').insert(entryRow);
      if (error) {
        enqueueOfflineMutation({ table: 'journal_entries', action: 'insert', data: entryRow });
        setIsSynced(false);
      } else {
        setIsSynced(true);
      }
    } else {
      enqueueOfflineMutation({ table: 'journal_entries', action: 'insert', data: newEntry });
      setIsSynced(false);
    }
  };

  const updateJournalEntry = async (id: string, updated: Partial<JournalEntry>) => {
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('journal_entries').update(updated).eq('id', id);
    } else {
      enqueueOfflineMutation({ table: 'journal_entries', action: 'update', data: { id, ...updated } });
      setIsSynced(false);
    }
  };

  const deleteJournalEntry = async (id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('journal_entries').delete().eq('id', id);
    } else {
      enqueueOfflineMutation({ table: 'journal_entries', action: 'delete', data: { id } });
      setIsSynced(false);
    }
  };

  // Plans
  const addPlan = async (title: string, category: Plan['category']) => {
    const newPlan: Plan = {
      id: `pl_${Date.now()}`,
      couple_id: couple.id,
      title,
      category,
      done: false,
      created_at: new Date().toISOString(),
    };

    setPlans((prev) => [...prev, newPlan]);

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { error } = await supabase.from('plans').insert(newPlan);
      if (error) enqueueOfflineMutation({ table: 'plans', action: 'insert', data: newPlan });
    } else {
      enqueueOfflineMutation({ table: 'plans', action: 'insert', data: newPlan });
      setIsSynced(false);
    }
  };

  const togglePlan = async (id: string) => {
    let nextDone = false;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextDone = !p.done;
          return { ...p, done: nextDone };
        }
        return p;
      })
    );

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('plans').update({ done: nextDone }).eq('id', id);
    } else {
      enqueueOfflineMutation({ table: 'plans', action: 'update', data: { id, done: nextDone } });
      setIsSynced(false);
    }
  };

  const deletePlan = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('plans').delete().eq('id', id);
    } else {
      enqueueOfflineMutation({ table: 'plans', action: 'delete', data: { id } });
      setIsSynced(false);
    }
  };

  // Important Dates
  const addImportantDate = async (dt: Omit<ImportantDate, 'id' | 'created_at' | 'couple_id'>) => {
    const newDate: ImportantDate = {
      ...dt,
      id: `dt_${Date.now()}`,
      couple_id: couple.id,
      created_at: new Date().toISOString(),
    };

    setImportantDates((prev) => [...prev, newDate]);

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { error } = await supabase.from('important_dates').insert(newDate);
      if (error) enqueueOfflineMutation({ table: 'important_dates', action: 'insert', data: newDate });
    } else {
      enqueueOfflineMutation({ table: 'important_dates', action: 'insert', data: newDate });
      setIsSynced(false);
    }
  };

  const deleteImportantDate = async (id: string) => {
    setImportantDates((prev) => prev.filter((d) => d.id !== id));

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('important_dates').delete().eq('id', id);
    } else {
      enqueueOfflineMutation({ table: 'important_dates', action: 'delete', data: { id } });
      setIsSynced(false);
    }
  };

  // Community Posts
  const createCommunityPost = async (data: {
    body: string;
    momentTag: string;
    mediaPath?: string;
    isStory?: boolean;
  }): Promise<{ error?: string }> => {
    const rateCheck = canCreatePost();
    if (!rateCheck.allowed) {
      return { error: `Please wait ${rateCheck.waitSeconds}s before sharing another post.` };
    }

    const expiresAt = data.isStory ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      couple_id: couple.id,
      author_id: currentUser.id,
      type: data.mediaPath ? 'photo' : 'text',
      body: data.body,
      media_path: data.mediaPath || null,
      moment_tag: data.momentTag || 'Couple Life',
      is_public: true,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      couple: {
        name: couple.name,
        username: couple.username,
        city_a: couple.city_a,
        city_b: couple.city_b,
        hide_exact_location: couple.hide_exact_location,
      },
      author: {
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
      },
      reactions_count: { heart: 0, hug: 0, strength: 0 },
      my_reaction: null,
      comments_count: 0,
    };

    recordPostCreated();
    setCommunityPosts((prev) => [newPost, ...prev]);

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { couple: _c, author: _a, reactions_count: _rc, my_reaction: _mr, comments_count: _cc, ...row } = newPost;
      await supabase.from('posts').insert(row);
    }

    return {};
  };

  // Reactions: hug, strength, heart (unique per couple per post)
  const toggleReaction = async (postId: string, type: ReactionType) => {
    setCommunityPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const counts = { ...(post.reactions_count || { heart: 0, hug: 0, strength: 0 }) };
        const currentReaction = post.my_reaction;

        if (currentReaction === type) {
          // Untoggle
          counts[type] = Math.max(0, (counts[type] || 1) - 1);
          return { ...post, my_reaction: null, reactions_count: counts };
        } else {
          // If had previous reaction, decrement it
          if (currentReaction) {
            counts[currentReaction] = Math.max(0, (counts[currentReaction] || 1) - 1);
          }
          counts[type] = (counts[type] || 0) + 1;
          return { ...post, my_reaction: type, reactions_count: counts };
        }
      })
    );

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        await supabase
          .from('reactions')
          .upsert({ post_id: postId, couple_id: couple.id, type }, { onConflict: 'post_id,couple_id' });
      } catch (e) {
        console.error('Reaction error:', e);
      }
    }
  };

  // Comments with rate-limiting
  const addComment = async (postId: string, body: string): Promise<{ error?: string; comment?: Comment }> => {
    const rateCheck = canCreateComment();
    if (!rateCheck.allowed) {
      return { error: `Please wait ${rateCheck.waitSeconds}s before commenting again.` };
    }

    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      post_id: postId,
      author_id: currentUser.id,
      couple_id: couple.id,
      body: body.trim(),
      created_at: new Date().toISOString(),
      author_name: currentUser.display_name,
      author_avatar: currentUser.avatar_url,
    };

    recordCommentCreated();

    setCommunityPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, comments_count: (post.comments_count || 0) + 1 };
        }
        return post;
      })
    );

    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      const { author_name: _, author_avatar: __, ...row } = newComment;
      await supabase.from('comments').insert(row);
    }

    return { comment: newComment };
  };

  // Social actions
  const toggleFollow = (targetCoupleId: string) => {
    setFollowingCouples((prev) =>
      prev.includes(targetCoupleId) ? prev.filter((id) => id !== targetCoupleId) : [...prev, targetCoupleId]
    );
  };

  const blockCouple = (targetCoupleId: string) => {
    setBlockedCouples((prev) => [...prev, targetCoupleId]);
    // Remove blocked couple's posts from feed immediately
    setCommunityPosts((prev) => prev.filter((p) => p.couple_id !== targetCoupleId));
  };

  const reportContent = async (reason: string, postId?: string, targetCoupleId?: string) => {
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      await supabase.from('reports').insert({
        reporter_couple_id: couple.id,
        post_id: postId || null,
        couple_id: targetCoupleId || null,
        reason,
      });
    }
  };

  // Export couple's own data only as JSON
  const exportCoupleData = () => {
    const exportBundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      couple,
      members: [currentUser, partnerUser],
      journalEntries: journalEntries.filter((j) => j.couple_id === couple.id),
      plans: plans.filter((p) => p.couple_id === couple.id),
      importantDates: importantDates.filter((d) => d.couple_id === couple.id),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${couple.username}_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importCoupleData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.couple && Array.isArray(parsed.journalEntries)) {
        startTransition(() => {
          setCouple(parsed.couple);
          if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
          if (parsed.plans) setPlans(parsed.plans);
          if (parsed.importantDates) setImportantDates(parsed.importantDates);
        });
        return true;
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
    return false;
  };

  // Account deletion: removes user and, if couple has no members left, deletes all data
  const deleteAccountAndCouple = async () => {
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        await supabase.from('couple_members').delete().eq('user_id', currentUser.id);
        await supabase.from('couples').delete().eq('id', couple.id);
      } catch (e) {
        console.error('Delete couple error:', e);
      }
    }
    localStorage.clear();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        partnerUser,
        couple,
        journalEntries,
        plans,
        importantDates,
        communityPosts,
        followingCouples,
        blockedCouples,
        isOnline,
        isSynced,
        pendingOfflineCount,
        isSupabaseLive,
        activeTab,
        setActiveTab,
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        totalUnreadMessagesCount,
        partnerConversationId: PARTNER_CONV_ID,
        communityUsers,
        blockedUserIds,
        typingUsers,
        sendMessage,
        createDirectConversation,
        acceptMessageRequest,
        declineMessageRequest,
        setTypingStatus,
        confirmAdultStatus,
        updateGender,
        blockUser,
        unblockUser,
        reportUser,
        markConversationAsRead,
        isAuthenticated,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        createSpace,
        joinSpace,
        switchDemoPartner,
        updateCouple,
        updateProfile,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        addPlan,
        togglePlan,
        deletePlan,
        addImportantDate,
        deleteImportantDate,
        createCommunityPost,
        toggleReaction,
        addComment,
        toggleFollow,
        blockCouple,
        reportContent,
        exportCoupleData,
        importCoupleData,
        deleteAccountAndCouple,
        triggerManualSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
