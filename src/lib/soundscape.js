// Soundscape generator using Web Audio API
// Each story type gets a unique procedurally-generated ambient sound

class Soundscape {
  constructor() {
    this.ctx = null
    this.nodes = []
    this.gainNode = null
    this.playing = false
  }

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 0
    this.gainNode.connect(this.ctx.destination)
  }

  // Set volume (0-1)
  setVolume(v) {
    if (!this.gainNode) return
    this.gainNode.gain.setTargetAtTime(v * 0.15, this.ctx.currentTime, 0.3) // max 15% volume
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.() } catch {} })
    this.nodes = []
    this.playing = false
  }

  // --- Sound generators ---

  // Low rumble (fire, storm)
  _noise(duration = 999) {
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    return source
  }

  // Filtered noise (wind, rain, water)
  _filteredNoise(frequency, Q = 1) {
    const noise = this._noise()
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = Q
    noise.connect(filter)
    return { source: noise, output: filter }
  }

  // Tone (sirens, beeps)
  _oscillator(freq, type = 'sine') {
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    return osc
  }

  // LFO for modulation
  _lfo(rate, amount, target) {
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = rate
    lfoGain.gain.value = amount
    lfo.connect(lfoGain)
    lfoGain.connect(target)
    return lfo
  }

  // --- Story-specific soundscapes ---

  playFire() {
    this.init(); this.stop()
    // Crackling fire: filtered noise + random pops
    const { source, output } = this._filteredNoise(3000, 5)
    const crackleGain = this.ctx.createGain()
    crackleGain.gain.value = 0.4
    output.connect(crackleGain)
    crackleGain.connect(this.gainNode)
    source.start()
    this.nodes.push(source)
    // Low rumble
    const { source: rumble, output: rumbleOut } = this._filteredNoise(80, 2)
    const rumbleGain = this.ctx.createGain()
    rumbleGain.gain.value = 0.3
    rumbleOut.connect(rumbleGain)
    rumbleGain.connect(this.gainNode)
    rumble.start()
    this.nodes.push(rumble)
    this.playing = true
  }

  playStorm() {
    this.init(); this.stop()
    // Rain: high filtered noise
    const { source: rain, output: rainOut } = this._filteredNoise(6000, 0.5)
    const rainGain = this.ctx.createGain()
    rainGain.gain.value = 0.5
    rainOut.connect(rainGain)
    rainGain.connect(this.gainNode)
    rain.start()
    this.nodes.push(rain)
    // Thunder rumble: very low noise with slow LFO
    const { source: thunder, output: thunderOut } = this._filteredNoise(40, 3)
    const thunderGain = this.ctx.createGain()
    thunderGain.gain.value = 0.6
    const lfo = this._lfo(0.1, 0.5, thunderGain.gain)
    thunderOut.connect(thunderGain)
    thunderGain.connect(this.gainNode)
    thunder.start()
    lfo.start()
    this.nodes.push(thunder, lfo)
    this.playing = true
  }

  playWater() {
    this.init(); this.stop()
    // Flowing water: mid-frequency noise with gentle modulation
    const { source, output } = this._filteredNoise(1200, 1)
    const waterGain = this.ctx.createGain()
    waterGain.gain.value = 0.5
    const lfo = this._lfo(0.3, 0.15, waterGain.gain)
    output.connect(waterGain)
    waterGain.connect(this.gainNode)
    source.start()
    lfo.start()
    this.nodes.push(source, lfo)
    this.playing = true
  }

  playCrowd() {
    this.init(); this.stop()
    // Crowd murmur: multiple filtered noise bands
    const bands = [200, 400, 800, 1600]
    bands.forEach(freq => {
      const { source, output } = this._filteredNoise(freq, 0.8)
      const g = this.ctx.createGain()
      g.gain.value = 0.15
      output.connect(g)
      g.connect(this.gainNode)
      source.start()
      this.nodes.push(source)
    })
    this.playing = true
  }

  playNature() {
    this.init(); this.stop()
    // Wind through trees: slow-modulated filtered noise
    const { source, output } = this._filteredNoise(800, 0.3)
    const windGain = this.ctx.createGain()
    windGain.gain.value = 0.4
    const lfo = this._lfo(0.15, 0.2, windGain.gain)
    output.connect(windGain)
    windGain.connect(this.gainNode)
    source.start()
    lfo.start()
    this.nodes.push(source, lfo)
    // High gentle hiss (leaves)
    const { source: leaves, output: leavesOut } = this._filteredNoise(4000, 0.5)
    const leavesGain = this.ctx.createGain()
    leavesGain.gain.value = 0.15
    leavesOut.connect(leavesGain)
    leavesGain.connect(this.gainNode)
    leaves.start()
    this.nodes.push(leaves)
    this.playing = true
  }

  playTraffic() {
    this.init(); this.stop()
    // Road noise: low-mid filtered noise
    const { source, output } = this._filteredNoise(300, 0.5)
    const g = this.ctx.createGain()
    g.gain.value = 0.5
    const lfo = this._lfo(0.08, 0.15, g.gain)
    output.connect(g)
    g.connect(this.gainNode)
    source.start()
    lfo.start()
    this.nodes.push(source, lfo)
    this.playing = true
  }

  playTension() {
    this.init(); this.stop()
    // Low drone: sine oscillator with slow pitch wobble
    const osc = this._oscillator(55, 'sine')
    const oscGain = this.ctx.createGain()
    oscGain.gain.value = 0.4
    const lfo = this._lfo(0.05, 3, osc.frequency)
    osc.connect(oscGain)
    oscGain.connect(this.gainNode)
    osc.start()
    lfo.start()
    this.nodes.push(osc, lfo)
    // Subtle high shimmer
    const { source, output } = this._filteredNoise(8000, 5)
    const shimmerGain = this.ctx.createGain()
    shimmerGain.gain.value = 0.08
    output.connect(shimmerGain)
    shimmerGain.connect(this.gainNode)
    source.start()
    this.nodes.push(source)
    this.playing = true
  }

  playUrban() {
    this.init(); this.stop()
    // City ambience: layered noise bands
    const { source: low, output: lowOut } = this._filteredNoise(150, 1)
    const lowGain = this.ctx.createGain()
    lowGain.gain.value = 0.3
    lowOut.connect(lowGain)
    lowGain.connect(this.gainNode)
    low.start()
    this.nodes.push(low)
    // Mid hum
    const { source: mid, output: midOut } = this._filteredNoise(500, 0.5)
    const midGain = this.ctx.createGain()
    midGain.gain.value = 0.15
    midOut.connect(midGain)
    midGain.connect(this.gainNode)
    mid.start()
    this.nodes.push(mid)
    this.playing = true
  }

  destroy() {
    this.stop()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
    this.gainNode = null
  }
}

// Story-to-soundscape mapping
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
