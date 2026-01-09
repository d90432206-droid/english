-- Vocatube English Database Re-initialization
-- Run this in your Supabase SQL Editor

-- 1. Create en_videos table
CREATE TABLE IF NOT EXISTS en_videos (
    video_id TEXT PRIMARY KEY,
    url TEXT,
    title TEXT,
    thumbnail TEXT,
    category TEXT[],
    vocabulary JSONB,
    sentence_patterns JSONB,
    status TEXT DEFAULT 'pending',
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create en_study_progress table
CREATE TABLE IF NOT EXISTS en_study_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  word TEXT NOT NULL,
  
  -- SRS Fields
  status TEXT DEFAULT 'new',                -- 'new', 'learning', 'review', 'mastered'
  next_review_date TIMESTAMPTZ DEFAULT now(),
  interval INT DEFAULT 0,                   -- in days
  easiness_factor FLOAT DEFAULT 2.5,        -- SM-2 algorithm start value
  streak INT DEFAULT 0,
  
  last_reviewed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicates
  UNIQUE(video_id, word)
);

-- Enable RLS
ALTER TABLE en_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE en_study_progress ENABLE ROW LEVEL SECURITY;

-- Simple Policies for Anonymous Access
CREATE POLICY "Allow public read-write on en_videos" ON en_videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on en_study_progress" ON en_study_progress FOR ALL USING (true) WITH CHECK (true);
