import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trees, Camera, Waves, Footprints, Bird, Users, Dog, Sun,
  Clock, MapPin, CheckCircle2, Download, Star, Calendar, ChevronRight, Binoculars
} from 'lucide-react'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const interests = [
  { id: 'hiking', label: 'Hiking & Trails', icon: Footprints, color: 'emerald' },
  { id: 'kayaking', label: 'Kayaking & Water', icon: Waves, color: 'blue' },
  { id: 'birding', label: 'Birding & Wildlife', icon: Bird, color: 'amber' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'purple' },
  { id: 'family', label: 'Family Outing', icon: Users, color: 'pink' },
  { id: 'dogs', label: 'Dog Walking', icon: Dog, color: 'orange' },
]

const visitData = {
  hiking: {
    title: 'Trail Guide',
    highlights: [
      { name: 'Sharon Lake Loop Trail', distance: '2.1 miles', difficulty: 'Easy', desc: 'The signature trail. Now fully resurfaced with new boardwalk sections extending into the northern wetland area. Best views of the lake are at the northwest bend.', new: true },
      { name: 'Sharon Woods Gorge Trail', distance: '3.4 miles', difficulty: 'Moderate', desc: 'A gorge cut through limestone — one of the best geological features in the county park system. The southern section connects to the lake loop.', new: false },
      { name: 'Lakeside Boardwalk', distance: '0.4 miles', difficulty: 'Easy/Accessible', desc: 'Brand new. ADA-accessible boardwalk extending over the expanded wetlands. Interpretive signs cover the ecology of the restored habitat.', new: true },
    ],
    tip: 'Go early on weekday mornings for the first few weeks — the reopening will draw crowds on weekends.',
  },
  kayaking: {
    title: 'On the Water',
    highlights: [
      { name: 'New Kayak Launch', desc: 'ADA-accessible launch on the east shore. Paved path from the parking area. Designed for easy solo launching.', new: true },
      { name: 'Paddle Route', desc: 'The lake is roughly 35 acres — plan 45–90 minutes for a leisurely paddle. The northern wetland edge is the scenic highlight; stay quiet for wildlife sightings.', new: false },
      { name: 'Rentals', desc: 'Kayak, canoe, and paddleboat rentals open this summer at the temporary boathouse at Sharon Woods Lakeside Lodge. Pricing TBD — historically $8–12/hour.', new: true },
    ],
    tip: 'Bring your own kayak until summer — the rental boathouse isn\'t open yet. The new launch is ready now.',
  },
  birding: {
    title: 'Birding Guide',
    highlights: [
      { name: 'Doubled Wetland Habitat', desc: 'The $17M project doubled the wetland area, creating new nesting habitat for herons, egrets, and migratory waterfowl. The northern boardwalk puts you within 30 feet of active habitat.', new: true },
      { name: 'Spring Migration Window', desc: 'Late March through May is peak — expect warblers, thrushes, and waterfowl. The restored shoreline is attracting species that haven\'t been regularly observed here in years.', new: false },
      { name: 'Observation Points', desc: 'Three new covered observation alcoves along the boardwalk, designed to minimize disturbance. The northwest alcove overlooks the deepest wetland pocket.', new: true },
    ],
    tip: 'Dawn is everything. 6:30–8:00 AM in April will be the magic window as migrants start arriving.',
  },
  photography: {
    title: 'Photo Guide',
    highlights: [
      { name: 'Golden Hour from the Boardwalk', desc: 'The northwest boardwalk faces east — morning golden hour reflects off the lake surface directly into your lens. Best spot in the park for sunrise shots.', new: true },
      { name: 'Wetland Macro Opportunities', desc: 'The expanded wetlands are already showing early spring wildflower growth. The boardwalk railings are at a good height for tripod work.', new: true },
      { name: 'Gorge Trail Limestone', desc: 'The Sharon Woods Gorge has some of the most photogenic exposed limestone in the county. Late afternoon light cuts through the canopy April–May.', new: false },
    ],
    tip: 'The first week after reopening will have the cleanest boardwalks and the fewest visitors at dawn. Get your shots now.',
  },
  family: {
    title: 'Family Day Planner',
    highlights: [
      { name: 'Lakeside Picnic Areas', desc: 'Renovated picnic shelters near the east parking lot. Reservable through Great Parks. The new accessible playground is a 5-minute walk from the lake.', new: true },
      { name: 'Boardwalk Nature Walk', desc: 'The 0.4-mile boardwalk is stroller-friendly and has interpretive signs at kid height (smart design). Count the turtles from the observation alcoves.', new: true },
      { name: 'Seasonal Programs', desc: 'Great Parks is launching new naturalist-led programs at Sharon Lake this spring. Check greatparks.org for the schedule — expect evening campfire programs and guided wetland walks.', new: true },
    ],
    tip: 'Pack a lunch and hit the east-side picnic area. The playground → boardwalk → picnic loop is about 2 hours with kids.',
  },
  dogs: {
    title: 'Dog-Friendly Guide',
    highlights: [
      { name: 'Trail Access', desc: 'Dogs on leash (6 ft max) are welcome on all trails including the new boardwalk. Waste stations have been installed at both trailheads and along the loop.', new: false },
      { name: 'Water Access', desc: 'Dogs are not permitted in the lake or the kayak launch area, but there are several informal shoreline access points on the south side where pups can wade safely.', new: false },
      { name: 'Nearby Dog Park', desc: 'The Sharon Woods off-leash dog park is a 3-minute drive from the lake. Combine the two for a full morning out — trail walk first, then off-leash play.', new: false },
    ],
    tip: 'The Gorge Trail is the best bet for dogs — fewer crowds, more sniff opportunities, and creek crossings they\'ll love.',
  },
}

const fundingSources = [
  { name: 'Great Parks Capital Budget', amount: '$11.2M' },
  { name: 'Greater Cincinnati Foundation', amount: '$2.8M' },
  { name: 'Land & Water Conservation Fund', amount: '$1.5M' },
  { name: 'Duke Energy Foundation', amount: '$0.8M' },
  { name: 'State Capital Improvement Fund', amount: '$0.7M' },
]

export default function SharonLakeExplorer({ onBack, onOpenStory }) {
  const [selectedInterests, setSelectedInterests] = useState([])
  const [visitDay, setVisitDay] = useState('weekday')
  const [showPlan, setShowPlan] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const plan = useMemo(() => {
    if (selectedInterests.length === 0) return null
    return selectedInterests.map(id => ({
      interest: interests.find(i => i.id === id),
      data: visitData[id],
    }))
  }, [selectedInterests])

  return (
    <StoryShell
      onBack={onBack}
      category="OUTDOORS"
      categoryColor="#0e7490"
      timestamp="March 19, 2026"
      readTime="Visit Planner"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        Sharon Lake Is Back
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        Two years of construction. $17 million invested. The largest improvement project in Great Parks' history
        is finished, and Sharon Lake officially reopened on March 19.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        The lake that generations of Cincinnati families grew up visiting is, by most accounts, transformed:
        doubled wetland habitat, new boardwalks extending into areas that were previously inaccessible,
        an ADA-compliant kayak launch, and a trail system that finally connects the lake to the Sharon Woods gorge.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        The boathouse won't open until summer. The harbor redesign starts this fall and finishes in 2028.
        But what's here now is more than enough to warrant your first visit. Tell us what you're into, and
        we'll build your guide.
      </p>

      <Divider />

      {/* Investment breakdown */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">$17 Million, Unpacked</h2>
      <p className="text-sm text-ink-muted mb-4">Where the money came from</p>
      <div className="bg-white border border-rule rounded-xl p-5 mb-4">
        {fundingSources.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-rule last:border-0">
            <span className="text-sm text-ink-light">{s.name}</span>
            <span className="text-sm font-mono font-bold text-ink">{s.amount}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink-muted mb-10 italic">
        What's new: expanded wetlands (2x), boardwalk system, trail resurfacing, ADA kayak launch, new parking areas, interpretive signage.
        Still coming: redesigned harbor (fall 2026 – spring 2028), permanent boathouse, kayak rentals (summer 2026).
      </p>

      <AdSlot.Insight storyId="sharon-lake" />

      <Divider />

      {/* Interest selector */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Plan Your Visit</h2>
      <p className="text-ink-light text-sm mb-4">What brings you to the park? Select all that apply.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {interests.map(({ id, label, icon: Icon, color }) => {
          const selected = selectedInterests.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggleInterest(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all
                ${selected ? 'border-cyan-600 bg-cyan-50 shadow-sm' : 'border-rule bg-white hover:border-cyan-300'}`}
            >
              <Icon size={18} className={selected ? 'text-cyan-700' : 'text-ink-muted'} />
              <span className={`text-sm font-medium ${selected ? 'text-cyan-800' : 'text-ink'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Visit timing */}
      {selectedInterests.length > 0 && (
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">When are you going?</label>
          <div className="flex gap-2">
            {[
              { id: 'weekday', label: 'Weekday', sub: 'Fewer crowds' },
              { id: 'weekend', label: 'Weekend', sub: 'Programs available' },
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setVisitDay(d.id)}
                className={`flex-1 py-3 rounded-lg border-2 text-center transition-all
                  ${visitDay === d.id ? 'border-cyan-600 bg-cyan-50' : 'border-rule bg-white'}`}
              >
                <p className="text-sm font-medium text-ink">{d.label}</p>
                <p className="text-xs text-ink-muted">{d.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedInterests.length > 0 && (
        <button
          onClick={() => setShowInterstitial(true)}
          className="flex items-center gap-2 text-cyan-700 font-medium hover:gap-3 transition-all duration-200 mb-6"
        >
          Build my visit plan <ChevronRight size={16} />
        </button>
      )}

      {showInterstitial && !showPlan && (
        <AdSlot.Interstitial storyId="sharon-lake" onComplete={() => setShowPlan(true)} />
      )}

      <AnimatePresence>
        {showPlan && plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <h2 className="font-serif text-3xl font-bold text-ink mb-2">Your Sharon Lake Guide</h2>
            <p className="text-ink-light leading-relaxed mb-6">
              {visitDay === 'weekday'
                ? 'Good call on the weekday — the first few weeks will be packed on Saturdays. You\'ll have the boardwalk practically to yourself before 9 AM.'
                : 'Weekends will be busy right after reopening, but the naturalist programs are worth the crowds. Arrive early to beat the parking crunch.'}
            </p>

            {plan.map(({ interest, data }, pi) => (
              <motion.div
                key={interest.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.15 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <interest.icon size={18} className="text-cyan-700" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-ink">{data.title}</h3>
                </div>

                <div className="space-y-3 mb-4">
                  {data.highlights.map((h, i) => (
                    <div key={i} className={`rounded-lg p-4 border ${h.new ? 'bg-cyan-50 border-cyan-200' : 'bg-white border-rule'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-ink">{h.name}</h4>
                        {h.new && <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">New</span>}
                        {h.distance && <span className="text-xs text-ink-muted">&middot; {h.distance}</span>}
                        {h.difficulty && <span className="text-xs text-ink-muted">&middot; {h.difficulty}</span>}
                      </div>
                      <p className="text-sm text-ink-light">{h.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Pro tip */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <Star size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{data.tip}</p>
                </div>
              </motion.div>
            ))}

            <DynamicNarrative storyId="sharon-lake" profileData={{ selectedInterests, visitDay }} />

            <LivePoll
              storyId="sharon-lake"
              neighborhood={null}
              pollData={{ interests: selectedInterests, visitDay }}
            />

            {/* Quick logistics */}
            <div className="bg-white border border-rule rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Need to Know</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink-muted mb-0.5">Address</p>
                  <p className="text-sm font-medium text-ink">Sharon Woods, 11450 Lebanon Rd</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted mb-0.5">Hours</p>
                  <p className="text-sm font-medium text-ink">6 AM – 10 PM daily</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted mb-0.5">Parking</p>
                  <p className="text-sm font-medium text-ink">Free (Motor Vehicle Permit req'd)</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted mb-0.5">Permit Cost</p>
                  <p className="text-sm font-medium text-ink">$12/year or $3/day</p>
                </div>
              </div>
            </div>

            <p className="text-lg text-ink-light leading-relaxed mb-8">
              Sharon Lake was always one of Cincinnati's quiet landmarks — the kind of place locals mention with affection
              but hadn't visited in years. The $17 million bet by Great Parks is that a reimagined version can change that.
              Based on what's already open, it's a bet that's paying off.
            </p>

            <AdSlot.ResultCard storyId="sharon-lake" />

            <SaveButton
              label="Save Your Visit Plan"
              storyId="sharon-lake"
              profileData={{ selectedInterests, visitDay, plan }}
            />
            <StoryConnections
              storyId="sharon-lake"
              profileData={{ selectedInterests, visitDay, plan }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-cyan-600 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}

