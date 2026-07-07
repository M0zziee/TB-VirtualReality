let bgm = null

export function initBGM() {
  if (bgm) return
  bgm = document.createElement('audio')
  bgm.src = 'assets/audio/bgm.mp3'
  bgm.loop = true
  bgm.volume = 0.5
}

export function playBGM() {
  if (bgm && bgm.paused) bgm.play()
}

export function pauseBGM() {
  if (bgm && !bgm.paused) bgm.pause()
}

export function toggleBGM() {
  if (bgm) {
    if (bgm.paused) bgm.play()
    else bgm.pause()
  }
}

export function isBGMPlaying() {
  return bgm ? !bgm.paused : false
}

export function setBGMVolume(v) {
  if (bgm) bgm.volume = v
}

export function getBGMVolume() {
  return bgm ? bgm.volume : 0.5
}
