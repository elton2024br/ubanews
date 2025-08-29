-- Create images bucket configuration and tracking table
-- This migration sets up image tracking without modifying storage.objects directly

-- Create a table to track uploaded images metadata
CREATE TABLE IF NOT EXISTS uploaded_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  news_id UUID REFERENCES admin_news(id) ON DELETE CASCADE,
  alt_text TEXT,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on uploaded_images
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view images
CREATE POLICY "Allow authenticated users to view images" ON uploaded_images
FOR SELECT TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert image records
CREATE POLICY "Allow authenticated users to insert image records" ON uploaded_images
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- Policy: Allow users to update their own image records
CREATE POLICY "Allow users to update own image records" ON uploaded_images
FOR UPDATE TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

-- Policy: Allow users to delete their own image records
CREATE POLICY "Allow users to delete own image records" ON uploaded_images
FOR DELETE TO authenticated
USING (auth.uid() = uploaded_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_images_news_id ON uploaded_images(news_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_uploaded_by ON uploaded_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_created_at ON uploaded_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_is_featured ON uploaded_images(is_featured) WHERE is_featured = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_uploaded_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_uploaded_images_updated_at
  BEFORE UPDATE ON uploaded_images
  FOR EACH ROW
  EXECUTE FUNCTION update_uploaded_images_updated_at();

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  image_record RECORD;
BEGIN
  -- Find images older than 24 hours that are not associated with any news
  FOR image_record IN
    SELECT id, file_path
    FROM uploaded_images
    WHERE news_id IS NULL
      AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Delete record (storage cleanup should be handled by application)
    DELETE FROM uploaded_images WHERE id = image_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get image statistics
CREATE OR REPLACE FUNCTION get_image_statistics()
RETURNS TABLE (
  total_images BIGINT,
  total_size BIGINT,
  images_this_month BIGINT,
  orphaned_images BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_images,
    COALESCE(SUM(file_size), 0) as total_size,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as images_this_month,
    COUNT(*) FILTER (WHERE news_id IS NULL AND created_at < NOW() - INTERVAL '24 hours') as orphaned_images
  FROM uploaded_images;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON uploaded_images TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_images() TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_statistics() TO authenticated;

-- Grant permissions to anon role for public access
GRANT SELECT ON uploaded_images TO anon;

-- Add comments
COMMENT ON TABLE uploaded_images IS 'Tracks metadata for images uploaded through the news editor';
COMMENT ON COLUMN uploaded_images.filename IS 'Generated unique filename in storage';
COMMENT ON COLUMN uploaded_images.original_name IS 'Original filename from user upload';
COMMENT ON COLUMN uploaded_images.file_path IS 'Full path in storage bucket';
COMMENT ON COLUMN uploaded_images.news_id IS 'Associated news article (NULL for unassigned images)';
COMMENT ON COLUMN uploaded_images.is_featured IS 'Whether this image is the featured image for the news';
COMMENT ON COLUMN uploaded_images.metadata IS 'Additional metadata like dimensions, EXIF data, etc.';
COMMENT ON FUNCTION cleanup_orphaned_images() IS 'Removes orphaned images that are not associated with any news after 24 hours';
COMMENT ON FUNCTION get_image_statistics() IS 'Returns statistics about uploaded images';