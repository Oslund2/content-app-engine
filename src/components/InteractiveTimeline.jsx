import { motion } from 'framer-motion'
import { Calendar, ChevronRight } from 'lucide-react'

export default function InteractiveTimeline({ events = [], onOpenStory }) {
  if (events.length === 0) return null

  return (
    <section className="my-12">
      <div className="flex items-center gap-3 mb-8">
        <Calendar size={14} className="text-wcpo-red" />
        <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Timeline</h2>
        <div className="flex-1 h-px bg-rule" />
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-rule sm:-translate-x-px" />

        <div className="space-y-8">
          {events.map((event, i) => {
            const isLeft = i % 2 === 0

            return (
              <motion.div
                key={event.date + '-' + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`relative flex items-start gap-4 sm:gap-0 ${
                  isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}
              >
                {/* Dot on timeline */}
                <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full bg-wcpo-red border-2 border-white shadow-sm -translate-x-1.5 sm:-translate-x-1.5 mt-1.5 z-10" />

                {/* Spacer for mobile (left of dot) */}
                <div className="w-8 sm:hidden shrink-0" />

                {/* Content card */}
                <div className={`flex-1 sm:w-[calc(50%-2rem)] ${isLeft ? 'sm:pr-8' : 'sm:pl-8'}`}>
                  <div
                    className={`bg-white border border-rule rounded-xl p-4 hover:shadow-sm transition-shadow ${
                      event.relatedStoryId ? 'cursor-pointer group' : ''
                    }`}
                    onClick={event.relatedStoryId ? () => onOpenStory?.(event.relatedStoryId) : undefined}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-wcpo-red">
                        {event.date}
                      </span>
                      {event.category && (
                        <span className="text-[10px] text-ink-muted">&middot; {event.category}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-ink leading-snug mb-1 group-hover:text-wcpo-red transition-colors">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    {event.relatedStoryId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-wcpo-red mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore <ChevronRight size={10} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Spacer for the other side (desktop only) */}
                <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
