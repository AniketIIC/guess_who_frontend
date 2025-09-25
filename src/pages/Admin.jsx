import { useEffect, useMemo, useState } from 'react'
import { socket } from '../socket'
import Floaters from '../components/Floaters'
import { emojiAvatar } from '../lib/avatar'
import { playDrumroll, playFail, playSuccess } from '../lib/sfx'

export default function Admin() {
  const [sentences, setSentences] = useState([])
  const [participants, setParticipants] = useState([])
  const [active, setActive] = useState(null) // sentenceId
  const [result, setResult] = useState(null) // { sentenceId, correct, tryName }
  const [shakeName, setShakeName] = useState(null)
  const [confetti, setConfetti] = useState([])
  const [revealed, setRevealed] = useState(null) // { name }
  const [rolling, setRolling] = useState(false)
  const [selectedName, setSelectedName] = useState(null)

  useEffect(() => {
    function onState(payload) {
      const list = Array.isArray(payload.sentences) ? payload.sentences.slice() : []
      list.sort((a, b) => (b.id || 0) - (a.id || 0))
      setSentences(list)
      setParticipants(payload.participants || [])
    }
    socket.on('state', onState)
    return () => {
      socket.off('state', onState)
    }
  }, [])

  const activeSentence = useMemo(
    () => sentences.find((s) => s.id === active) || null,
    [active, sentences]
  )

  function pickSentence(id) {
    setActive(id)
    setResult(null)
    setShakeName(null)
    setRevealed(null)
    setSelectedName(null)
  }

  function guess(name) {
    if (!active) return
    setSelectedName(name)
    socket.emit('guess_author', { sentenceId: active, guessName: name }, (res) => {
      if (res?.ok) {
        const r = { sentenceId: active, correct: !!res.correct, tryName: name }
        setResult(r)
        if (r.correct) {
          // burst confetti
          const pieces = Array.from({ length: 30 }).map((_, i) => ({ id: i, left: Math.random() * 100, emoji: ['🎉','🎊','✨','🍬','🍭','⭐'][i % 6], delay: `${(i%10)*30}ms` }))
          setConfetti(pieces)
          setTimeout(() => setConfetti([]), 1400)
          playSuccess()
        } else {
          setShakeName(name)
          setTimeout(() => setShakeName(null), 600)
          playFail()
        }
      }
    })
  }

  // per-request: all options styled green; no per-name colorization

  function revealAuthor() {
    if (!active) return
    setRevealed(null)
    setRolling(true)
    playDrumroll(1200)
    setTimeout(() => {
      socket.emit('reveal_author', active, (res) => {
        setRolling(false)
        if (res?.ok) {
          setRevealed({ name: res.authorName })
          // sprinkle confetti for reveal
          const pieces = Array.from({ length: 36 }).map((_, i) => ({ id: `r${i}`, left: Math.random() * 100, emoji: ['🎉','🎊','✨'][i % 3], delay: `${(i%12)*25}ms` }))
          setConfetti(pieces)
          setTimeout(() => setConfetti([]), 1400)
          playSuccess()
        }
      })
    }, 900)
  }

  return (
    <div className="page-wrap admin">
      <Floaters count={10} />
      <header className="title">
        <span className="wiggle"><span className="sticker wobble">🧠</span> Admin Control</span>
      </header>
      <main className="content grid">
        <div className="goofy-card list">
          <h3>Submitted Entries</h3>
          <ul className="sentence-list">
            {sentences.map((s) => (
              <li key={s.id}>
                <button
                  className={`sentence-btn ${active === s.id ? 'active' : ''}`}
                  onClick={() => pickSentence(s.id)}
                  title={`Sentence #${s.id}`}
                >
                  <div className="row">
                    {s.image && <img src={s.image} alt="thumb" className="thumb" />}
                    <span>{s.text || (s.image ? 'Image only' : '(empty)')}</span>
                  </div>
                </button>
              </li>
            ))}
            {sentences.length === 0 && <div className="muted">No sentences yet…</div>}
          </ul>
        </div>
        <div className="goofy-card panel">
          <h3>Who wrote it?</h3>
          {!activeSentence && <div className="muted">Pick a sentence first</div>}
          {activeSentence && (
            <>
              {activeSentence.text && (
                <div className="active-sentence">“{activeSentence.text}”</div>
              )}
              {activeSentence.image && (
                <div className="preview" style={{marginBottom: 10}}>
                  <img src={activeSentence.image} alt="entry" className="entry-media" />
                </div>
              )}
              <div className="options">
                {participants.map((name) => (
                  <button
                    key={name + String(active)}
                    className={`option-btn green ${shakeName === name ? 'shake' : ''} ${selectedName === name ? 'selected' : ''}`}
                    onClick={() => guess(name)}
                  >
                    <span className="avatar" aria-hidden>{emojiAvatar(name)}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
              <div className="row" style={{marginTop: 12}}>
                <button className="btn secondary" onClick={revealAuthor}>Reveal Author 🥁</button>
              </div>
              {rolling && (
                <div className="overlay drumroll">
                  <div className="drum">🥁</div>
                  <div className="muted">Rolling...</div>
                </div>
              )}
              {result && result.sentenceId === active && (
                <div className={result.correct ? 'result correct' : 'result wrong'}>
                  {result.correct ? 'Correct! 🎉' : `Nope, not ${result.tryName}. Try again!`}
                </div>
              )}
              {revealed && (
                <div className="reveal-card">
                  It was <span className="avatar" aria-hidden>{emojiAvatar(revealed.name)}</span> <b>{revealed.name}</b>!
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {confetti.length > 0 && (
        <div className="confetti-layer">
          {confetti.map((p) => (
            <span key={p.id} className="confetti-piece" style={{ left: `${p.left}%`, animationDelay: p.delay }}>{p.emoji}</span>
          ))}
        </div>
      )}
    </div>
  )
}
