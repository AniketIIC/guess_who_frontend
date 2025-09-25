let ctx
function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone({ freq = 440, time = 0, duration = 0.2, type = 'sine', gain = 0.06 }) {
  const ac = ensureCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime)
  g.gain.value = gain
  osc.connect(g).connect(ac.destination)
  const start = ac.currentTime + time
  const end = start + duration
  osc.start(start)
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0001, end)
  osc.stop(end)
}

export function playSuccess() {
  // little arpeggio up
  const base = 600
  ;[0, 0.08, 0.16].forEach((t, i) => tone({ freq: base + i * 160, time: t, duration: 0.15, type: 'triangle', gain: 0.05 }))
}

export function playFail() {
  // quick bonk: two falling tones
  tone({ freq: 300, duration: 0.1, type: 'square', gain: 0.04 })
  tone({ freq: 180, time: 0.08, duration: 0.14, type: 'square', gain: 0.04 })
}

export function playDrumroll(durationMs = 1200) {
  const ac = ensureCtx()
  const noiseBuffer = ac.createBuffer(1, ac.sampleRate * (durationMs / 1000), ac.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ac.createBufferSource()
  noise.buffer = noiseBuffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(120, ac.currentTime)
  filter.Q.value = 0.6
  const g = ac.createGain()
  g.gain.value = 0.02
  noise.connect(filter).connect(g).connect(ac.destination)
  noise.start()
  noise.stop(ac.currentTime + durationMs / 1000)
}

