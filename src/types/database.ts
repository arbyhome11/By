/**
 * Me & You: Supabase Database and Application TypeScript Types
 */

export type Gender = 'Female' | 'Male' | 'Other';

export interface Profile {
  id: string; // auth.users id
  display_name: string;
  gender: Gender;
  is_adult_confirmed: boolean;
  city: string;
  timezone: string;
  avatar_url: string;
  created_at: string;
}

export interface Couple {
  id: string;
  name: string;
  username: string;
  tagline: string;
  invite_code: string;
  anniversary_date: string | null;
  last_met_date: string | null;
  reunion_date: string | null;
  reunion_title: string;
  reunion_location: string;
  city_a: string;
  city_b: string;
  hide_exact_location: boolean;
  created_at: string;
}

export interface CoupleMember {
  id: string;
  couple_id: string;
  user_id: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  couple_id: string;
  author_id: string;
  entry_date: string;
  title: string;
  note: string;
  mood: 'loved' | 'grateful' | 'missing you' | 'joyful' | 'peaceful' | 'excited' | string;
  is_public: boolean;
  created_at: string;
  photos?: EntryPhoto[];
}

export interface EntryPhoto {
  id: string;
  entry_id: string;
  storage_path: string;
  position: number;
  created_at?: string;
  url?: string;
}

export type PlanCategory = 'Food' | 'Travel' | 'Movies' | 'Other';

export interface Plan {
  id: string;
  couple_id: string;
  title: string;
  category: PlanCategory;
  done: boolean;
  created_at: string;
}

export interface ImportantDate {
  id: string;
  couple_id: string;
  title: string;
  date: string;
  repeats_yearly: boolean;
  created_at: string;
}

export type PostType = 'photo' | 'video' | 'text';
export type ReactionType = 'hug' | 'strength' | 'heart';

export interface Post {
  id: string;
  couple_id: string;
  author_id: string;
  type: PostType;
  body: string;
  media_path: string | null;
  moment_tag: string;
  is_public: boolean;
  expires_at: string | null; // For 24h stories
  created_at: string;
  // Joined or derived fields:
  couple?: {
    name: string;
    username: string;
    city_a: string;
    city_b: string;
    hide_exact_location: boolean;
  };
  author?: {
    display_name: string;
    avatar_url: string;
  };
  reactions_count?: {
    hug: number;
    strength: number;
    heart: number;
  };
  my_reaction?: ReactionType | null;
  comments_count?: number;
}

export interface Reaction {
  id: string;
  post_id: string;
  couple_id: string;
  type: ReactionType;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  couple_id: string;
  body: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface Follow {
  follower_couple_id: string;
  followed_couple_id: string;
  created_at: string;
}

export interface Block {
  blocker_couple_id: string;
  blocked_couple_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_couple_id: string;
  post_id?: string | null;
  couple_id?: string | null;
  reason: string;
  created_at: string;
}

export interface NotificationSettings {
  enabled: boolean;
  partnerJournal: boolean;
  partnerReunionEdit: boolean;
  countdownMilestones: boolean; // 30, 7, 1 days & day itself
  communityInteractions: boolean; // reactions & comments on public post
  dailyEncouragement: boolean;
  encouragementTime: string; // e.g. "09:00"
}

export type ConversationType = 'partner' | 'direct';
export type ConversationStatus = 'active' | 'pending' | 'accepted' | 'declined';

export interface Conversation {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  requester_id?: string;
  created_at: string;
  updated_at: string;
  // Derived/joined fields
  other_user?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_pending_sync?: boolean;
}

export interface UserBlock {
  blocker_user_id: string;
  blocked_user_id: string;
  created_at: string;
}

export interface UserReport {
  id: string;
  reporter_user_id: string;
  reported_user_id: string;
  reason: string;
  created_at: string;
}

