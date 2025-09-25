const EMOJI_SET = [
  '🦄','🐸','🐙','🐼','🦊','🐵','🐯','🐨','🐧','🦖','🐝','🦋','🐳','🐹','🐮','🦒','🦔','🐲','🐞','🦘','🦩','🦙','🦚','🦜'
]

export function emojiAvatar(name = '') {
  const str = String(name || 'Guest')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  const idx = Math.abs(hash) % EMOJI_SET.length
  return EMOJI_SET[idx]
}

