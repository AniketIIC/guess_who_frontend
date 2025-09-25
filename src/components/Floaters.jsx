import { useMemo } from 'react'

const EMOJIS = ['🍕','🦄','🎈','🍩','🪩','🐸','🌈','🤹','🧃','🍌','🥳','🦖']

export default function Floaters({ count = 10 }) {
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      left: Math.round((i + 1) * (100 / (count + 1))),
      delay: `${(i % 5) * 0.8}s`,
      size: `${20 + ((i * 7) % 20)}px`,
      dur: `${10 + (i % 6) * 2}s`,
    }))
  }, [count])

  return (
    <div className="floaters">
      {items.map(it => (
        <span
          key={it.id}
          className="floater"
          style={{ left: `${it.left}%`, bottom: '-10vh', fontSize: it.size, animationDelay: it.delay, ['--dur']: it.dur }}
        >{it.emoji}</span>
      ))}
    </div>
  )
}

