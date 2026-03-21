import { motion } from 'framer-motion'

export default function SectionDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-12 sm:my-16 flex items-center gap-4 origin-left"
    >
      <div className="h-px flex-1 bg-rule" />
      <div className="w-1.5 h-1.5 bg-accent rotate-45" />
      <div className="h-px flex-1 bg-rule" />
    </motion.div>
  )
}
