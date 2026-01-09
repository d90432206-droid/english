-- Add status column to english_videos table to support queue processing
ALTER TABLE en_videos
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Add processing_error column for error logging
ALTER TABLE en_videos
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Create an index on status for faster worker polling
CREATE INDEX IF NOT EXISTS idx_en_videos_status ON en_videos(status);

-- Comments
COMMENT ON COLUMN en_videos.status IS 'Status of AI processing: pending, processing, completed, error';

-- Add thumbnail and title columns to avoid schema cache issues and support early metadata display
ALTER TABLE en_videos
ADD COLUMN IF NOT EXISTS thumbnail TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;
