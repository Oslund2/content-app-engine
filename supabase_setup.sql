-- Stories table: stores each interactive story
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  category_color TEXT NOT NULL,
  headline TEXT NOT NULL,
  subhead TEXT NOT NULL,
  image TEXT,
  read_time TEXT,
  featured BOOLEAN DEFAULT FALSE,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved profiles: user-saved results from story interactions
CREATE TABLE saved_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES stories(id),
  session_id TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_profiles ENABLE ROW LEVEL SECURITY;

-- Stories are public read
CREATE POLICY stories_public_read ON stories FOR SELECT USING (true);

-- Saved profiles: anyone can insert, read by session
CREATE POLICY profiles_insert ON saved_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY profiles_select ON saved_profiles FOR SELECT USING (true);

-- Seed the 5 current stories
INSERT INTO stories (id, category, category_color, headline, subhead, image, read_time, featured, publish_date) VALUES
('opening-day', 'SPORTS', '#c41230', 'Reds Opening Day Is Thursday. Plan Your Perfect Day.', 'Road closures, parade routes, and 80,000 fans converge on the Banks. Use this planner to navigate it all.', 'baseball', 'Interactive Planner', TRUE, '2026-03-21'),
('safety-survey', 'INVESTIGATION', '#0d7377', 'Only 32% of Residents Feel Safe in Cincinnati', 'A new city survey reveals a sharp drop in public confidence. Explore how your neighborhood compares.', 'shield', 'Interactive Explorer', FALSE, '2026-03-20'),
('bridge-impact', 'TRANSPORTATION', '#b8860b', 'The Bridge That Vanished: Life After Fourth Street', '11,600 daily drivers and 700 pedestrians lost their route. Calculate what the 2.5-year closure costs you.', 'bridge', 'Impact Calculator', FALSE, '2026-03-19'),
('sidewalk-repair', 'YOUR NEIGHBORHOOD', '#6b21a8', 'The City Fixed 55 Sidewalks for Free. Is Yours Next?', 'A $100K pilot helped homeowners who could not afford repairs. Check if your neighborhood qualifies for expansion.', 'construction', 'Eligibility Checker', FALSE, '2026-03-20'),
('sharon-lake', 'OUTDOORS', '#0e7490', 'Sharon Lake Is Back. $17 Million Later, It Is Stunning.', 'New boardwalks, doubled wetlands, kayak launches. Plan your first visit to the reimagined park.', 'trees', 'Visit Planner', FALSE, '2026-03-19');
