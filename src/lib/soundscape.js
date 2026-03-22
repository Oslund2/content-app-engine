// Soundscape generator using Web Audio API
// Each story gets a distinctly different procedural ambient sound

class Soundscape {
  constructor() {
    this.ctx = null
    this.nodes = []
    this.gainNode = null
    this.playing = false
    this.intervals = []
  }

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 0
    this.gainNode.connect(this.ctx.destination)
  }

  setVolume(v) {
    if (!this.gainNode) return
    this.gainNode.gain.setTargetAtTime(v * 0.25, this.ctx.currentTime, 0.3)
  }

  stop() {
    this.intervals.forEach(id => clearInterval(id))
    this.intervals = []
    this.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.() } catch {} })
    this.nodes = []
    this.playing = false
  }

  _noise() {
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    return source
  }

  _filteredNoise(freq, Q = 1, type = 'bandpass') {
    const noise = this._noise()
    const filter = this.ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = Q
    noise.connect(filter)
    return { source: noise, output: filter }
  }

  _osc(freq, type = 'sine') {
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    return osc
  }

  // === FIRE: crackling pops + deep roar ===
  playFire() {
    this.init(); this.stop()
    // Deep fire roar
    const { source: roar, output: roarOut } = this._filteredNoise(120, 3)
    const roarGain = this.ctx.createGain()
    roarGain.gain.value = 0.5
    roarOut.connect(roarGain)
    roarGain.connect(this.gainNode)
    roar.start()
    this.nodes.push(roar)
    // Crackling: rapid random clicks using short noise bursts
    const crackle = () => {
      if (!this.ctx || !this.playing) return
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.15))
      const s = this.ctx.createBufferSource()
      s.buffer = buf
      const g = this.ctx.createGain()
      g.gain.value = 0.3 + Math.random() * 0.5
      const f = this.ctx.createBiquadFilter()
      f.type = 'highpass'
      f.frequency.value = 2000 + Math.random() * 4000
      s.connect(f)
      f.connect(g)
      g.connect(this.gainNode)
      s.start()
    }
    this.intervals.push(setInterval(crackle, 80 + Math.random() * 120))
    this.playing = true
  }

  // === STORM: rain hiss + rhythmic thunder rumbles ===
  playStorm() {
    this.init(); this.stop()
    // Rain: bright high-frequency noise
    const { source: rain, output: rainOut } = this._filteredNoise(7000, 0.3, 'highpass')
    const rainGain = this.ctx.createGain()
    rainGain.gain.value = 0.35
    rainOut.connect(rainGain)
    rainGain.connect(this.gainNode)
    rain.start()
    this.nodes.push(rain)
    // Thunder: periodic low booms
    const thunder = () => {
      if (!this.ctx || !this.playing) return
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 30 + Math.random() * 20
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.7, this.ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5)
      osc.connect(g)
      g.connect(this.gainNode)
      osc.start()
      osc.stop(this.ctx.currentTime + 3)
    }
    thunder()
    this.intervals.push(setInterval(thunder, 4000 + Math.random() * 6000))
    this.playing = true
  }

  // === WATER: bubbling + gentle flow ===
  playWater() {
    this.init(); this.stop()
    // Flowing base
    const { source, output } = this._filteredNoise(600, 0.8)
    const flowGain = this.ctx.createGain()
    flowGain.gain.value = 0.3
    // Slow volume swell for wave effect
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = 0.2
    lfoGain.gain.value = 0.15
    lfo.connect(lfoGain)
    lfoGain.connect(flowGain.gain)
    output.connect(flowGain)
    flowGain.connect(this.gainNode)
    source.start()
    lfo.start()
    this.nodes.push(source, lfo)
    // Bubbles: short pitched blips
    const bubble = () => {
      if (!this.ctx || !this.playing) return
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 400 + Math.random() * 800
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.15, this.ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)
      osc.connect(g)
      g.connect(this.gainNode)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.2)
    }
    this.intervals.push(setInterval(bubble, 300 + Math.random() * 500))
    this.playing = true
  }

  // === CROWD: layered murmur + occasional cheers ===
  playCrowd() {
    this.init(); this.stop()
    // Warm murmur base (multiple bands for "voices")
    ;[180, 350, 700].forEach(freq => {
      const { source, output } = this._filteredNoise(freq, 2)
      const g = this.ctx.createGain()
      g.gain.value = 0.2
      output.connect(g)
      g.connect(this.gainNode)
      source.start()
      this.nodes.push(source)
    })
    // Periodic "crowd swell" — volume bump
    const cheer = () => {
      if (!this.ctx || !this.playing) return
      const { source, output } = this._filteredNoise(1200, 1)
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.01, this.ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.3)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2)
      output.connect(g)
      g.connect(this.gainNode)
      source.start()
      source.stop(this.ctx.currentTime + 2.5)
    }
    this.intervals.push(setInterval(cheer, 5000 + Math.random() * 5000))
    this.playing = true
  }

  // === NATURE: wind gusts + bird-like chirps ===
  playNature() {
    this.init(); this.stop()
    // Wind: slow-modulated low noise
    const { source: wind, output: windOut } = this._filteredNoise(400, 0.3)
    const windGain = this.ctx.createGain()
    windGain.gain.value = 0.25
    const windLfo = this.ctx.createOscillator()
    const windLfoGain = this.ctx.createGain()
    windLfo.frequency.value = 0.08
    windLfoGain.gain.value = 0.2
    windLfo.connect(windLfoGain)
    windLfoGain.connect(windGain.gain)
    windOut.connect(windGain)
    windGain.connect(this.gainNode)
    wind.start()
    windLfo.start()
    this.nodes.push(wind, windLfo)
    // Bird chirps: short descending tones
    const chirp = () => {
      if (!this.ctx || !this.playing) return
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      const baseFreq = 2000 + Math.random() * 2000
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, this.ctx.currentTime + 0.1)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, this.ctx.currentTime + 0.15)
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.12, this.ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
      osc.connect(g)
      g.connect(this.gainNode)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.25)
    }
    this.intervals.push(setInterval(chirp, 1500 + Math.random() * 3000))
    this.playing = true
  }

  // === TRAFFIC: engine drone + periodic horn honks ===
  playTraffic() {
    this.init(); this.stop()
    // Engine drone
    const { source, output } = this._filteredNoise(200, 1.5)
    const droneGain = this.ctx.createGain()
    droneGain.gain.value = 0.35
    output.connect(droneGain)
    droneGain.connect(this.gainNode)
    source.start()
    this.nodes.push(source)
    // Periodic car pass: whoosh sound (rising then falling pitch noise)
    const whoosh = () => {
      if (!this.ctx || !this.playing) return
      const noise = this._noise()
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 3
      filter.frequency.setValueAtTime(200, this.ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.4)
      filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.8)
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.01, this.ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.3)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1)
      noise.connect(filter)
      filter.connect(g)
      g.connect(this.gainNode)
      noise.start()
      noise.stop(this.ctx.currentTime + 1.2)
    }
    this.intervals.push(setInterval(whoosh, 2000 + Math.random() * 3000))
    this.playing = true
  }

  // === TENSION: deep pulsing drone + eerie high tone ===
  playTension() {
    this.init(); this.stop()
    // Deep pulse
    const sub = this._osc(45, 'sine')
    const subGain = this.ctx.createGain()
    subGain.gain.value = 0.5
    // Pulse the volume
    const pulseLfo = this.ctx.createOscillator()
    const pulseGain = this.ctx.createGain()
    pulseLfo.frequency.value = 0.5 // slow pulse
    pulseGain.gain.value = 0.3
    pulseLfo.connect(pulseGain)
    pulseGain.connect(subGain.gain)
    sub.connect(subGain)
    subGain.connect(this.gainNode)
    sub.start()
    pulseLfo.start()
    this.nodes.push(sub, pulseLfo)
    // Eerie high tone: detuned fifth
    const high1 = this._osc(660, 'sine')
    const high2 = this._osc(667, 'sine') // slight detune for beating
    const highGain = this.ctx.createGain()
    highGain.gain.value = 0.06
    high1.connect(highGain)
    high2.connect(highGain)
    highGain.connect(this.gainNode)
    high1.start()
    high2.start()
    this.nodes.push(high1, high2)
    this.playing = true
  }

  // === URBAN: distant hum + occasional siren wail ===
  playUrban() {
    this.init(); this.stop()
    // City hum: 60Hz electrical hum + harmonics
    const hum = this._osc(60, 'sawtooth')
    const humFilter = this.ctx.createBiquadFilter()
    humFilter.type = 'lowpass'
    humFilter.frequency.value = 200
    const humGain = this.ctx.createGain()
    humGain.gain.value = 0.2
    hum.connect(humFilter)
    humFilter.connect(humGain)
    humGain.connect(this.gainNode)
    hum.start()
    this.nodes.push(hum)
    // Ambient distant noise
    const { source, output } = this._filteredNoise(300, 0.5)
    const ambGain = this.ctx.createGain()
    ambGain.gain.value = 0.15
    output.connect(ambGain)
    ambGain.connect(this.gainNode)
    source.start()
    this.nodes.push(source)
    // Periodic distant siren
    const siren = () => {
      if (!this.ctx || !this.playing) return
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, this.ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.6)
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 1.2)
      osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 1.8)
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.03, this.ctx.currentTime) // very quiet/distant
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2)
      osc.connect(g)
      g.connect(this.gainNode)
      osc.start()
      osc.stop(this.ctx.currentTime + 2.5)
    }
    this.intervals.push(setInterval(siren, 8000 + Math.random() * 12000))
    this.playing = true
  }

  destroy() {
    this.stop()
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
    this.gainNode = null
  }
}

const storyScapes = {
  'fire-crisis': 'playFire',
  'opening-day': 'playCrowd',
  'safety-survey': 'playUrban',
  'bridge-impact': 'playTraffic',
  'sidewalk-repair': 'playUrban',
  'sharon-lake': 'playNature',
  'bengals-draft': 'playTension',
  'fc-cincinnati': 'playCrowd',
  'storm-ready': 'playStorm',
  'flood-risk': 'playWater',
  'car-seat': 'playTraffic',
  'neighborhood-pulse': 'playUrban',
}

export { Soundscape, storyScapes }
