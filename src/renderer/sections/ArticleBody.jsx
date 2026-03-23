import { motion } from 'framer-motion'

/**
 * Renders the editorial story content between the hero and the interactive inputs.
 * This is the journalism — the context readers need before they engage with the tool.
 */
export default function ArticleBody({ config }) {
  // Gather all story text from various config locations
  const paragraphs = []

  // Lead paragraphs from hero
  if (config.hero?.leadParagraphs) {
    paragraphs.push(...config.hero.leadParagraphs)
  }

  // Article body (dedicated field)
  if (config.articleBody) {
    if (Array.isArray(config.articleBody)) {
      paragraphs.push(...config.articleBody)
    } else if (typeof config.articleBody === 'string') {
      paragraphs.push(config.articleBody)
    }
  }

  // Story sections (some configs use this format)
  if (config.storySections) {
    config.storySections.forEach(section => {
      if (section.heading) paragraphs.push(`**${section.heading}**`)
      if (section.text) paragraphs.push(section.text)
      if (section.paragraphs) paragraphs.push(...section.paragraphs)
    })
  }

  if (paragraphs.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-10 border-b border-rule pb-8"
    >
      <div className="prose prose-sm max-w-none">
        {paragraphs.map((para, i) => {
          // Handle bold headers (markdown-style)
          if (typeof para === 'string' && para.startsWith('**') && para.endsWith('**')) {
            return (
              <h3 key={i} className="text-lg font-bold text-ink mt-6 mb-2">
                {para.replace(/\*\*/g, '')}
              </h3>
            )
          }
          return (
            <p key={i} className="text-base text-ink leading-relaxed mb-4">
              {para}
            </p>
          )
        })}
      </div>
    </motion.section>
  )
}
