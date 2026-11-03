-- ====================================================================
-- Me & You: Supabase Schema, Row Level Security (RLS) & Storage Setup
-- Run this migration in your Supabase SQL Editor.
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table (tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Partner',
  city TEXT DEFAULT '',
  timezone TEXT DEFAULT 'UTC',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically insert a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create COUPLES Table
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Me & You',
  username TEXT UNIQUE NOT NULL,
  tagline TEXT DEFAULT 'Miles apart, together in heart',
  invite_code TEXT UNIQUE NOT NULL,
  anniversary_date DATE,
  last_met_date DATE,
  reunion_date DATE,
  reunion_title TEXT DEFAULT 'Next Reunion',
  reunion_location TEXT DEFAULT 'Airport',
  city_a TEXT DEFAULT '',
  city_b TEXT DEFAULT '',
  hide_exact_location BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON public.couples(invite_code);

-- 4. Create COUPLE_MEMBERS Table (max 2 members per couple)
CREATE TABLE IF NOT EXISTS public.couple_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_couple_user UNIQUE(couple_id, user_id)
);

-- Function to enforce max 2 members per couple
CREATE OR REPLACE FUNCTION check_couple_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INT;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id;

  IF member_count >= 2 THEN
    RAISE EXCEPTION 'This couple space already has the maximum of 2 partners.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_couple_limit ON public.couple_members;
CREATE TRIGGER enforce_couple_limit
  BEFORE INSERT ON public.couple_members
  FOR EACH ROW EXECUTE FUNCTION check_couple_member_limit();

-- Helper function: Get couple_id for current authenticated user
CREATE OR REPLACE FUNCTION public.get_my_couple_id()
RETURNS UUID AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Create JOURNAL_ENTRIES Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  note TEXT NOT NULL,
  mood TEXT DEFAULT 'loved',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create ENTRY_PHOTOS Table (max 5 per entry)
CREATE TABLE IF NOT EXISTS public.entry_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create PLANS Table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Food', 'Travel', 'Movies', 'Other')),
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create IMPORTANT_DATES Table
CREATE TABLE IF NOT EXISTS public.important_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  repeats_yearly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create POSTS Table (Community feed & stories)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'text')),
  body TEXT NOT NULL,
  media_path TEXT,
  moment_tag TEXT DEFAULT 'General',
  is_public BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ, -- for 24h stories
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Create REACTIONS Table
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hug', 'strength', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_reaction_per_couple UNIQUE(post_id, couple_id)
);

-- 11. Create COMMENTS Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Create FOLLOWS Table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  followed_couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_couple_id, followed_couple_id),
  CONSTRAINT no_self_follow CHECK (follower_couple_id <> followed_couple_id)
);

-- 13. Create BLOCKS Table
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  blocked_couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_couple_id, blocked_couple_id)
);

-- 14. Create REPORTS Table (Insert-only for users)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- COUPLES
CREATE POLICY "Couples readable by members or public search"
  ON public.couples FOR SELECT
  TO authenticated
  USING (
    id = public.get_my_couple_id()
    OR id NOT IN (
      SELECT blocker_couple_id FROM public.blocks WHERE blocked_couple_id = public.get_my_couple_id()
    )
  );

CREATE POLICY "Couples insertable by authenticated users"
  ON public.couples FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Couples editable by their own members"
  ON public.couples FOR UPDATE
  TO authenticated
  USING (id = public.get_my_couple_id())
  WITH CHECK (id = public.get_my_couple_id());

CREATE POLICY "Couples deletable by their own members"
  ON public.couples FOR DELETE
  TO authenticated
  USING (id = public.get_my_couple_id());

-- COUPLE_MEMBERS
CREATE POLICY "Members readable by authenticated users"
  ON public.couple_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join a couple"
  ON public.couple_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave their couple"
  ON public.couple_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- JOURNAL_ENTRIES
CREATE POLICY "Journal entries readable by couple members or if public"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (
    couple_id = public.get_my_couple_id()
    OR (is_public = true AND couple_id NOT IN (
      SELECT blocker_couple_id FROM public.blocks WHERE blocked_couple_id = public.get_my_couple_id()
    ))
  );

CREATE POLICY "Journal entries insertable by couple members"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id() AND author_id = auth.uid());

CREATE POLICY "Journal entries updatable by couple members"
  ON public.journal_entries FOR UPDATE
  TO authenticated
  USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Journal entries deletable by couple members"
  ON public.journal_entries FOR DELETE
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- ENTRY_PHOTOS
CREATE POLICY "Entry photos readable by couple members"
  ON public.entry_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = entry_photos.entry_id
      AND (je.couple_id = public.get_my_couple_id() OR je.is_public = true)
    )
  );

CREATE POLICY "Entry photos insertable by entry couple"
  ON public.entry_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = entry_photos.entry_id
      AND je.couple_id = public.get_my_couple_id()
    )
  );

CREATE POLICY "Entry photos deletable by entry couple"
  ON public.entry_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = entry_photos.entry_id
      AND je.couple_id = public.get_my_couple_id()
    )
  );

-- PLANS
CREATE POLICY "Plans readable by couple members"
  ON public.plans FOR SELECT
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

CREATE POLICY "Plans insertable by couple members"
  ON public.plans FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Plans updatable by couple members"
  ON public.plans FOR UPDATE
  TO authenticated
  USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Plans deletable by couple members"
  ON public.plans FOR DELETE
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- IMPORTANT_DATES
CREATE POLICY "Important dates readable by couple members"
  ON public.important_dates FOR SELECT
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

CREATE POLICY "Important dates insertable by couple members"
  ON public.important_dates FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Important dates updatable by couple members"
  ON public.important_dates FOR UPDATE
  TO authenticated
  USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Important dates deletable by couple members"
  ON public.important_dates FOR DELETE
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- POSTS (Community feed and stories)
CREATE POLICY "Posts readable by author couple or if public"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    couple_id = public.get_my_couple_id()
    OR (
      is_public = true
      AND couple_id NOT IN (
        SELECT blocker_couple_id FROM public.blocks WHERE blocked_couple_id = public.get_my_couple_id()
      )
    )
  );

CREATE POLICY "Posts insertable by couple members"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id() AND author_id = auth.uid());

CREATE POLICY "Posts updatable by author couple"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Posts deletable by author couple"
  ON public.posts FOR DELETE
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- REACTIONS
CREATE POLICY "Reactions readable by authenticated users"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reactions insertable by current user's couple"
  ON public.reactions FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Reactions deletable by reacting couple"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- COMMENTS
CREATE POLICY "Comments readable by authenticated users"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Comments insertable by authenticated users"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id() AND author_id = auth.uid());

CREATE POLICY "Comments deletable by author or author couple"
  ON public.comments FOR DELETE
  TO authenticated
  USING (couple_id = public.get_my_couple_id() OR author_id = auth.uid());

-- FOLLOWS
CREATE POLICY "Follows readable by authenticated users"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Follows insertable by follower couple"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_couple_id = public.get_my_couple_id());

CREATE POLICY "Follows deletable by follower couple"
  ON public.follows FOR DELETE
  TO authenticated
  USING (follower_couple_id = public.get_my_couple_id());

-- BLOCKS
CREATE POLICY "Blocks readable by blocker couple"
  ON public.blocks FOR SELECT
  TO authenticated
  USING (blocker_couple_id = public.get_my_couple_id());

CREATE POLICY "Blocks insertable by blocker couple"
  ON public.blocks FOR INSERT
  TO authenticated
  WITH CHECK (blocker_couple_id = public.get_my_couple_id());

CREATE POLICY "Blocks deletable by blocker couple"
  ON public.blocks FOR DELETE
  TO authenticated
  USING (blocker_couple_id = public.get_my_couple_id());

-- REPORTS (Insert-only for users)
CREATE POLICY "Reports insertable by reporter couple"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_couple_id = public.get_my_couple_id());

-- ====================================================================
-- STORAGE BUCKETS & STORAGE POLICIES
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('couple-media', 'couple-media', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('public-media', 'public-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: couple-media (private bucket: path {couple_id}/{filename})
-- Only members of that couple can read and write
CREATE POLICY "Couple members can upload to couple-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'couple-media'
    AND (storage.foldername(name))[1] = (public.get_my_couple_id())::text
  );

CREATE POLICY "Couple members can read from couple-media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'couple-media'
    AND (storage.foldername(name))[1] = (public.get_my_couple_id())::text
  );

CREATE POLICY "Couple members can delete from couple-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'couple-media'
    AND (storage.foldername(name))[1] = (public.get_my_couple_id())::text
  );

-- Storage Policy: public-media (public-read bucket)
CREATE POLICY "Public media is readable by everyone"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'public-media');

CREATE POLICY "Authenticated users can upload to public-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-media'
    AND (storage.foldername(name))[1] = (public.get_my_couple_id())::text
  );

-- ====================================================================
-- REALTIME PUBLICATIONS
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.important_dates;

-- ====================================================================
-- MESSAGING & SAME-GENDER DIRECT CONVERSATIONS (MESSAGES FEATURE)
-- ====================================================================
-- 15. Add Gender and Adult Confirmation to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Female', 'Male', 'Other')) DEFAULT 'Female';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_adult_confirmed BOOLEAN NOT NULL DEFAULT false;

-- 16. CONVERSATIONS table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('partner', 'direct')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'accepted', 'declined')),
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CONVERSATION_MEMBERS table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

-- Database Trigger Function: Enforce SAME-GENDER RULE in database for direct messages
CREATE OR REPLACE FUNCTION public.check_direct_message_same_gender()
RETURNS TRIGGER AS $$
DECLARE
  conv_type TEXT;
  first_member_gender TEXT;
  new_member_gender TEXT;
BEGIN
  SELECT type INTO conv_type FROM public.conversations WHERE id = NEW.conversation_id;

  IF conv_type = 'direct' THEN
    SELECT gender INTO new_member_gender FROM public.profiles WHERE id = NEW.user_id;

    SELECT p.gender INTO first_member_gender
    FROM public.conversation_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.conversation_id = NEW.conversation_id
    LIMIT 1;

    IF first_member_gender IS NOT NULL AND new_member_gender IS NOT NULL THEN
      IF first_member_gender <> new_member_gender THEN
        RAISE EXCEPTION 'Direct messages across couples are only permitted between members of the same gender.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_same_gender_direct_messages ON public.conversation_members;
CREATE TRIGGER enforce_same_gender_direct_messages
  BEFORE INSERT ON public.conversation_members
  FOR EACH ROW EXECUTE FUNCTION public.check_direct_message_same_gender();

-- 18. MESSAGES table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- RLS on Messaging tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations readable by their members"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversations insertable by authenticated users"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Conversations updatable by members"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members readable by fellow members"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members insertable by authenticated users"
  ON public.conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Messages readable by conversation members"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Messages insertable by conversation members"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.type = 'partner' OR c.status = 'accepted')
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

