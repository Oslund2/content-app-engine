import { motion } from 'framer-motion'

export default function IntroSection({ narrative }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="pt-12 sm:pt-16"
    >
      <p className="text-2xl sm:text-3xl font-serif leading-snug text-ink mb-6">
        {narrative.lead}
      </p>
      <p className="text-lg text-ink-light leading-relaxed">
        {narrative.body}
      </p>
    </motion.section>
  )
}
