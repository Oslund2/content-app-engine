import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

function AnimatedValue({ value, inView }) {
  const [display, setDisplay] = useState('0')
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0

  useEffect(() => {
    if (!inView || numericVal === 0) { setDisplay(String(value)); return }
    const start = performance.now()
    function tick(now) {
      const progress = Math.min((now - start) / 1500, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = numericVal * eased
      // Preserve original formatting
      if (typeof value === 'string' && value.includes('.')) {
        const dec = value.split('.')[1]?.replace(/[^0-9]/g, '').length || 0
        setDisplay(current.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }))
      } else {
        setDisplay(Math.round(current).toLocaleString())
      }
      if (progress < 1) requestAnimationFrame(tick)
      else setDisplay(String(value))
    }
    requestAnimationFrame(tick)
  }, [inView, numericVal, value])

  return <>{inView ? display : '0'}</>
}

export default function NumberGrid({ title, metrics = [] }) {
  if (!metrics.length) return null
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const cols = metrics.length <= 2 ? 'grid-cols-2' : metrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {title && (
        <h3 className="font-serif text-lg font-bold text-ink mb-4">{title}</h3>
      )}
      <div className={`grid ${cols} gap-px bg-rule rounded-xl overflow-hidden border border-rule`}>
        {metrics.map((m, i) => {
          const isUp = m.changeDirection === 'up'
          const isDown = m.changeDirection === 'down'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
              className="bg-white px-4 py-4 text-center"
            >
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-ink">
                {m.prefix || ''}<AnimatedValue value={m.value} inView={inView} />{m.suffix || ''}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mt-1">{m.label}</p>
              {m.change && (
                <div className={`flex items-center justify-center gap-1 mt-1 text-xs font-semibold ${isUp ? 'text-red-600' : isDown ? 'text-green-600' : 'text-ink-muted'}`}>
                  {isUp && <TrendingUp size={12} />}
                  {isDown && <TrendingDown size={12} />}
                  <span>{m.change}</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
