import { useEffect, useMemo, useState } from 'react'
import { socket } from '../socket'
import Floaters from '../components/Floaters'
import { emojiAvatar } from '../lib/avatar'
import { resizeImageFile } from '../lib/image'

export default function Player() {
  const [registeredName, setRegisteredName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [sentence, setSentence] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState([])
  const [imageData, setImageData] = useState('')
  const [imageName, setImageName] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('gw_name')
    if (saved) setNameInput(saved)
  }, [])

  const canSubmitSentence = useMemo(() => {
    const hasText = sentence.trim().length > 0
    const hasImg = !!(imageData && imageData.startsWith('data:'))
    return !!registeredName && !submitted && (hasText || hasImg)
  }, [registeredName, submitted, sentence, imageData])

  useEffect(() => {
    function onState(payload) {
      setParticipants(payload.participants || [])
    }
    socket.on('state', onState)
    return () => socket.off('state', onState)
  }, [])

  // Auto-register using saved name on (re)connect
  useEffect(() => {
    const saved = localStorage.getItem('gw_name')
    function tryRegister() {
      if (!registeredName && saved) {
        socket.emit('register', saved, (res) => {
          if (res?.ok) {
            setRegisteredName(res.name)
            setNameInput(res.name)
            localStorage.setItem('gw_name', res.name)
          }
        })
      }
    }
    if (socket.connected) tryRegister()
    socket.on('connect', tryRegister)
    return () => socket.off('connect', tryRegister)
  }, [registeredName])

  function handleRegister(e) {
    e?.preventDefault()
    const proposed = nameInput.trim()
    if (!proposed) return
    socket.emit('register', proposed, (res) => {
      if (res?.ok) {
        setRegisteredName(res.name)
        localStorage.setItem('gw_name', res.name)
      } else {
        setError(res?.error || 'Failed to register')
      }
    })
  }

  function handleSubmit(e) {
    e?.preventDefault()
    setError('')
    const payload = { text: sentence, image: imageData || undefined }
    socket.emit('submit_sentence', payload, (res) => {
      if (res?.ok) {
        setSubmitted(true)
      } else {
        setError(res?.error || 'Failed to submit')
      }
    })
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image exceeds 10MB; pick a smaller one')
        return
      }
      const resized = await resizeImageFile(file, 900, 900, 0.85)
      setImageData(resized)
      setImageName(file.name)
    } catch {
      setError('Could not read image')
    }
  }

  function clearImage() {
    setImageData('')
    setImageName('')
  }

  const showModal = !registeredName

  return (
    <div className="page-wrap">
      <Floaters count={12} />
      <header className="title">
        <span className="wiggle"><span className="sticker wobble">🤪</span> Guess Who Wrote This?</span>
      </header>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal goofy-card">
            <h2>Enter your name</h2>
            <form onSubmit={handleRegister}>
              <input
                className="input"
                placeholder="e.g. Taco Wizard"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
              />
              <button className="btn" type="submit">Let me in!</button>
            </form>
            <div className="tiny" style={{marginTop: 6}}>Your avatar: <span className="avatar" aria-hidden>{emojiAvatar(nameInput || 'Guest')}</span></div>
            {error && <div className="error">{error}</div>}
          </div>
        </div>
      )}

      <main className="content">
        <div className="goofy-card">
          {!submitted ? (
            <>
              <div className="row" style={{marginBottom: 8}}>
                <h3 style={{margin: 0}}>Write one silly entry</h3>
                <span className="space" />
                <span className="tiny">Players online: {participants.length}</span>
              </div>
              <form onSubmit={handleSubmit}>
                <textarea
                  className="textarea"
                  placeholder="Once upon a taco... (optional if you add an image)"
                  rows={3}
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  maxLength={200}
                  disabled={!registeredName}
                />
                <div className="row" style={{marginTop: 8, alignItems: 'center'}}>
                  <input type="file" accept="image/*" onChange={onPickImage} disabled={!registeredName || submitted} />
                  {imageData && (
                    <>
                      <span className="tiny">{imageName}</span>
                      <button type="button" className="btn secondary" onClick={clearImage}>Remove image</button>
                    </>
                  )}
                </div>
                {imageData && (
                  <div className="preview" style={{marginTop: 8}}>
                    <img src={imageData} alt="preview" className="entry-media" />
                  </div>
                )}
                <div className="row" style={{alignItems:'center'}}>
                  <span className="tiny">{sentence.trim().length}/200 chars</span>
                  <span className="space" />
                  <button className="btn big" type="submit" disabled={!canSubmitSentence}>
                    Submit entry
                  </button>
                </div>
              </form>
              {error && <div className="error">{error}</div>}
            </>
          ) : (
            <div className="success">🥳 Entry received! Hang tight for the guessing game.</div>
          )}
        </div>
      </main>
    </div>
  )
}

