-- Create a table to track Spaced Repetition (SRS) progress
-- Run this in your Supabase SQL Editor

create table if not exists en_study_progress (
  id uuid default gen_random_uuid() primary key,
  video_id text not null,
  word text not null,
  
  -- SRS Fields
  status text default 'new',                -- 'new', 'learning', 'review', 'mastered'
  next_review_date timestamptz default now(),
  interval int default 0,                   -- in days
  easiness_factor float default 2.5,        -- SM-2 algorithm start value
  streak int default 0,
  
  last_reviewed_at timestamptz default now(),
  created_at timestamptz default now(),
  
  -- Prevent duplicates
  unique(video_id, word)
);

-- Enable RLS (Optional, depending on your setup)
alter table en_study_progress enable row level security;

-- Policy: Allow all access for now (since we use anon key for simple prototype)
create policy "Allow generic access" on en_study_progress for all using (true) with check (true);
