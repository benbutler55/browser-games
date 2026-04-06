import { useCallback, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

type ToneType = 'click' | 'success' | 'fail' | 'move' | 'pop'

const toneConfig: Record<ToneType, { freq: number; duration: number; type: OscillatorType }> = {
  click: { freq: 600, duration: 0.06, type: 'square' },
  success: { freq: 880, duration: 0.18, type: 'sine' },
  fail: { freq: 220, duration: 0.25, type: 'sawtooth' },
  move: { freq: 440, duration: 0.05, type: 'sine' },
  pop: { freq: 520, duration: 0.08, type: 'triangle' },
}

export function useSound() {
  const [muted, setMuted] = useLocalStorage<boolean>('sound-muted', false)
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback(
    (tone: ToneType) => {
      if (muted) return
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext()
      }
      const ctx = ctxRef.current
      const config = toneConfig[tone]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = config.type
      osc.frequency.value = config.freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + config.duration)
    },
    [muted],
  )

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev)
  }, [setMuted])

  return { muted, toggleMute, play }
}
