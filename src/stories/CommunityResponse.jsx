import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Phone, Users, MessageCircle, ChevronDown, ChevronUp,
  ExternalLink, Shield, Loader2, HandHeart, UserCheck, Handshake
} from 'lucide-react'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import { submitReflection, fetchReflections } from '../lib/supabase'

// --- Guidance data ---

const guidancePanels = [
  {
    id: 'under-10',
    label: 'If your child is under 10',
    items: [
      'Keep the TV and radio off around them. They don\'t need the details.',
      'Reassure them that they are safe. Use simple, honest language: "Something very sad happened in our city."',
      'Watch for changes in behavior — clinginess, trouble sleeping, not wanting to go to school.',
      'Keep routines normal. Predictability is the most comforting thing you can offer right now.',
    ],
  },
  {
    id: '10-14',
    label: 'If your child is 10 to 14',
    items: [
      'They may have already heard about it at school or on social media. Ask what they\'ve heard before explaining.',
      'Acknowledge their feelings are valid — fear, confusion, anger, sadness. All of it.',
      'Watch for withdrawal, irritability, or sudden changes in friend groups.',
      'If they want to talk, listen more than you speak. If they don\'t, let them know you\'re there when they\'re ready.',
    ],
  },
  {
    id: 'teenager',
    label: 'If your child is a teenager',
    items: [
      'They may know Nazir, or know someone who does. Don\'t assume — ask.',
      'They may be processing fear, grief, or rage. Don\'t minimize any of it. Don\'t lecture about safety.',
      'Ask if their school is offering counseling or support. If not, the resources below are available to them directly.',
      'If they want to do something — attend a vigil, write something, talk to someone — support that impulse.',
    ],
  },
]

// --- Commitment options ---

const commitmentOptions = [
  { key: 'thoughts', label: "I'm holding Nazir's family in my thoughts.", icon: Heart },
  { key: 'check-in', label: "I'm going to check on a young person in my life today.", icon: UserCheck },
  { key: 'neighbor', label: "I'm reaching out to a neighbor.", icon: Handshake },
  { key: 'prevention', label: 'I want to support violence prevention in Cincinnati.', icon: Shield },
  { key: 'here', label: "I'm just here. I don't have words.", icon: HandHeart },
]

// --- Action cards ---

const actionCards = [
  {
    icon: Phone,
    title: 'Report Information',
    body: 'If you saw or heard anything near the 800 block of Glenwood Avenue early Sunday morning, call the Cincinnati Police Homicide Unit.',
    emphasis: '513-352-3542',
    footnote: 'You can remain anonymous. You do not need to give your name.',
    link: null,
  },
  {
    icon: Heart,
    title: 'Support the Family',
    body: 'We will update this section when verified support channels are available for Nazir\'s family.',
    emphasis: null,
    footnote: 'Be cautious of unverified fundraisers on social media.',
    link: null,
  },
  {
    icon: Users,
    title: 'Community Vigil or Memorial',
    body: 'No vigil has been announced yet. When one is, we\'ll update this space with details.',
    emphasis: null,
    footnote: null,
    link: null,
  },
  {
    icon: Shield,
    title: 'Violence Intervention Programs',
    body: 'Cincinnati has active programs working to interrupt cycles of violence and support affected communities.',
    emphasis: null,
    footnote: null,
    links: [
      { label: 'CIRV — Cincinnati Initiative to Reduce Violence', url: 'https://www.cincinnati-oh.gov/police/cirv/' },
      { label: 'Cure Violence Cincinnati', url: 'https://www.cincinnati-oh.gov/health/cure-violence/' },
      { label: 'Cincinnati Urban League', url: 'https://www.cincinnatiurbanleague.org/' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Counseling & Crisis Support',
    body: 'If you or someone you know is struggling — whether from this event or anything else — help is available now.',
    emphasis: null,
    footnote: null,
    links: [
      { label: '988 Suicide & Crisis Lifeline — call or text 988', url: 'tel:988' },
      { label: 'Cincinnati Children\'s Behavioral Health — 513-636-4124', url: 'tel:5136364124' },
      { label: 'Talbert House Crisis Line — 513-281-CARE (2273)', url: 'tel:5132812273' },
    ],
  },
]

// --- Community Narrative (local, not shared DynamicNarrative) ---

function CommunityNarrative({ storyId, profileData }) {
  const [narrative, setNarrative] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!storyId || !profileData) return
    let cancelled = false
    setLoading(true)

    async function fetchNarrative() {
      try {
        const res = await fetch('/.netlify/functions/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId, profileData }),
        })
        const data = await res.json()
        if (!cancelled) {
          if (data.narrative) setNarrative(data.narrative)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNarrative()
    return () => { cancelled = true }
  }, [storyId, profileData])

  if (!loading && !narrative) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-8 bg-paper-warm border border-rule rounded-xl p-5"
    >
      {loading ? (
        <div className="flex items-center gap-2 text-ink-muted text-sm py-2">
          <Loader2 size={14} className="animate-spin" />
          <span className="italic">A moment...</span>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          {narrative.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-ink-light leading-relaxed mb-3 last:mb-0 italic">
              {para}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// --- Animated counter ---

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!value) return
    const duration = 1200
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(progress * value))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])

  return <span className="font-mono font-bold text-2xl text-ink">{display.toLocaleString()}</span>
}

// ==========================================================
// Main Component
// ==========================================================

export default function CommunityResponse({ onBack, onOpenStory }) {
  const [expandedPanel, setExpandedPanel] = useState(null)
  const [commitment, setCommitment] = useState(null)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState(null)
  const [narrativeProfile, setNarrativeProfile] = useState(null)

  // Check if already submitted this session
  useEffect(() => {
    if (localStorage.getItem('reflection_submitted_community-response')) {
      setSubmitted(true)
      fetchReflections('community-response').then(setStats)
    }
  }, [])

  const handleSubmit = async () => {
    if (!commitment) return
    setSubmitting(true)
    await submitReflection('community-response', commitment, message, null)
    localStorage.setItem('reflection_submitted_community-response', '1')
    setSubmitted(true)
    setSubmitting(false)

    const profile = { commitment, message: message || null }
    setNarrativeProfile(profile)

    const data = await fetchReflections('community-response')
    setStats(data)
  }

  const togglePanel = (id) => {
    setExpandedPanel(prev => prev === id ? null : id)
  }

  return (
    <StoryShell
      onBack={onBack}
      category="COMMUNITY"
      categoryColor="#1e293b"
      timestamp="March 22, 2026"
      readTime="Community Response"
      storyId="community-response"
    >
      {/* ============ OPENING ============ */}
      <section className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight mb-6">
          Nazir Owens Was 15.
          <br />
          <span className="text-ink-light">Here's How Cincinnati Can Respond.</span>
        </h1>

        <div className="space-y-4 text-base text-ink-light leading-relaxed">
          <p>
            At approximately 12:02 a.m. Sunday, Cincinnati police responded to the 800 block of
            Glenwood Avenue near Reading Road in Avondale for reports of a shooting. They found
            15-year-old Nazir Owens with a gunshot wound. He was pronounced dead at the scene.
            No suspects have been identified. The Homicide Unit is investigating.
          </p>

          <p className="font-serif text-xl text-ink font-medium">
            He was fifteen.
          </p>

          <p>
            This page isn't about the shooting. It's about what comes after &mdash; what a
            community does when one of its children is killed.
          </p>
        </div>
      </section>

      <hr className="border-rule my-10" />

      {/* ============ IF YOU KNEW NAZIR ============ */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-ink mb-4">If You Knew Nazir</h2>
        <p className="text-base text-ink-light leading-relaxed">
          The police report tells us where and when. It doesn't tell us who Nazir was &mdash;
          what he liked, what he was good at, who will miss him most. If you knew him, or if
          your child knew him, the resources below may help.
        </p>
      </section>

      {/* ============ TALKING TO YOUNG PEOPLE ============ */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-ink mb-2">Talking to Young People</h2>
        <p className="text-sm text-ink-muted mb-4">
          Guidance adapted from Cincinnati Children's Hospital behavioral health recommendations.
        </p>

        <div className="space-y-2">
          {guidancePanels.map(panel => (
            <div key={panel.id} className="border border-rule rounded-lg overflow-hidden">
              <button
                onClick={() => togglePanel(panel.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-medium text-ink">{panel.label}</span>
                {expandedPanel === panel.id
                  ? <ChevronUp size={16} className="text-ink-muted" />
                  : <ChevronDown size={16} className="text-ink-muted" />
                }
              </button>

              <AnimatePresence>
                {expandedPanel === panel.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <ul className="px-4 py-3 space-y-2.5 border-t border-rule">
                      {panel.items.map((item, i) => (
                        <li key={i} className="text-sm text-ink-light leading-relaxed pl-4 relative">
                          <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-rule my-10" />

      {/* ============ WHAT YOU CAN DO ============ */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-ink mb-5">What You Can Do</h2>

        <div className="space-y-3">
          {actionCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="border border-rule rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-slate-200/60">
                    <Icon size={18} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ink text-sm mb-1">{card.title}</h3>
                    <p className="text-sm text-ink-light leading-relaxed">{card.body}</p>

                    {card.emphasis && (
                      <p className="mt-2 font-mono text-base font-bold text-ink">
                        {card.emphasis}
                      </p>
                    )}

                    {card.footnote && (
                      <p className="mt-1.5 text-xs text-ink-muted italic">{card.footnote}</p>
                    )}

                    {card.links && (
                      <div className="mt-2 space-y-1.5">
                        {card.links.map((link, j) => (
                          <a
                            key={j}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-ink transition-colors"
                          >
                            <ExternalLink size={12} className="shrink-0" />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <hr className="border-rule my-10" />

      {/* ============ COMMUNITY REFLECTIONS ============ */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-ink mb-2">Community Reflections</h2>
        <p className="text-sm text-ink-muted mb-5">
          You don't have to say the right thing. You just have to show up.
        </p>

        {!submitted ? (
          <div className="space-y-3">
            {commitmentOptions.map(opt => {
              const Icon = opt.icon
              const selected = commitment === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setCommitment(opt.key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3
                    ${selected
                      ? 'border-slate-400 bg-slate-100 shadow-sm'
                      : 'border-rule bg-white hover:bg-slate-50'
                    }`}
                >
                  <Icon size={18} className={selected ? 'text-slate-700' : 'text-slate-400'} />
                  <span className={`text-sm ${selected ? 'text-ink font-medium' : 'text-ink-light'}`}>
                    {opt.label}
                  </span>
                </button>
              )
            })}

            {commitment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 200))}
                  placeholder="Add a short message (optional)"
                  rows={2}
                  className="w-full mt-2 px-3 py-2.5 border border-rule rounded-lg text-sm text-ink
                    placeholder:text-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-slate-300
                    resize-none bg-white"
                />
                <div className="flex items-center justify-between mt-1 mb-3">
                  <span className="text-xs text-ink-muted">{message.length}/200</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-medium text-sm bg-slate-800 text-white
                    hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2
                    disabled:opacity-50"
                >
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    : <><Heart size={16} /> Share Your Response</>
                  }
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Confirmation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Community Responses
                </span>
              </div>

              {stats && (
                <>
                  <AnimatedCount value={stats.total} />
                  <p className="text-sm text-ink-muted mt-1">people have responded</p>

                  <div className="mt-4 space-y-1.5 text-left">
                    {commitmentOptions.map(opt => {
                      const count = stats.commitments[opt.key] || 0
                      if (count === 0) return null
                      return (
                        <div key={opt.key} className="flex items-center gap-2 text-sm text-ink-light">
                          <span className="font-mono text-xs text-ink-muted w-8 text-right">{count}</span>
                          <span>{opt.label.replace("I'm ", "are ").replace("I want", "want").replace("I don't", "don't")}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Recent messages */}
            {stats?.messages?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Messages from the community
                </p>
                {stats.messages.map((msg, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-slate-200 pl-3 py-1"
                  >
                    <p className="text-sm text-ink-light italic">"{msg.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* ============ COMMUNITY NARRATIVE (after submission) ============ */}
      {narrativeProfile && (
        <CommunityNarrative storyId="community-response" profileData={narrativeProfile} />
      )}

      <hr className="border-rule my-10" />

      {/* ============ SAVE & CONNECTIONS ============ */}
      <div className="mb-8">
        <SaveButton
          label="Save These Resources"
          storyId="community-response"
          profileData={{ commitment, message: message || null, resources: true }}
        />
      </div>

      <StoryConnections
        storyId="community-response"
        profileData={{ neighborhood: null }}
        onOpenStory={onOpenStory}
      />
    </StoryShell>
  )
}
