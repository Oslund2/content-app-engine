import { useState } from 'react'
import { motion } from 'framer-motion'

export default function InlineImage({ image, caption, alt }) {
  const [errored, setErrored] = useState(false)
  if (!image || errored) return null

  return (
    <motion.figure
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
        <img
          src={image}
          alt={alt || caption || 'Story image'}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-ink-muted text-center italic px-2">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  )
}
