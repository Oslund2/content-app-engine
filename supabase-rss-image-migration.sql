-- Add image_url to rss_items so the ingest parser can persist images
-- found in the feed (media:content, media:thumbnail, enclosure, or
-- the first <img> inside content:encoded / description).
--
-- These images are considered rights-cleared because the publisher
-- chose to include them in the feed.
--
-- Run once in the Supabase SQL editor.

ALTER TABLE rss_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: backfill image_url for existing rss_items by scraping the
-- first <img src="…"> out of content_encoded. This lets old, unprocessed
-- items pick up an image on their next pipeline run instead of falling
-- through to an Unsplash search.
UPDATE rss_items
SET image_url = (
  regexp_match(content_encoded, '<img[^>]+src="([^"]+)"', 'i')
)[1]
WHERE image_url IS NULL
  AND content_encoded IS NOT NULL
  AND content_encoded ~* '<img[^>]+src=';
