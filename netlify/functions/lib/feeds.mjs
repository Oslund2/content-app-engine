// Centralized RSS feed configuration
// All feed consumers import from here to prevent drift

// WCPO local feeds (for RSS ingestion pipeline)
export var WCPO_FEEDS = [
  { name: 'news', url: 'https://www.wcpo.com/news.rss' },
  { name: 'local-news', url: 'https://www.wcpo.com/news/local-news.rss' },
  { name: 'sports', url: 'https://www.wcpo.com/sports.rss' },
  { name: 'entertainment', url: 'https://www.wcpo.com/entertainment.rss' },
  { name: 'lifestyle', url: 'https://www.wcpo.com/lifestyle.rss' },
]

// National feeds with direct article URLs (no JS redirects, no paywalls)
export var NATIONAL_FEEDS = [
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'PBS', url: 'https://www.pbs.org/newshour/feeds/rss/headlines' },
]

// Extended national feeds (includes wire services, may have slower response)
export var EXTENDED_NATIONAL_FEEDS = [
  ...NATIONAL_FEEDS,
  { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
]
