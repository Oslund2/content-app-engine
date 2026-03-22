import { useState, useEffect, useRef, useCallback } from 'react'

const audioCache = new Map()
let ttsAvailable = null // null = unchecked, true/false after check

export default function useNarration(storyId) {
  const [status, setStatus] = useState('checking') // checking|unavailable|idle|loading|ready|playing|paused|error
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const intervalRef = useRef(null)

  // Check availability on first use
  useEffect(() => {
    if (ttsAvailable === true) { setStatus('idle'); return }
    if (ttsAvailable === false) { setStatus('unavailable'); return }

    fetch('/.netlify/functions/tts')
      .then(r => r.json())
      .then(data => {
        ttsAvailable = data.available
        setStatus(data.available ? 'idle' : 'unavailable')
      })
      .catch(() => {
        ttsAvailable = false
        setStatus('unavailable')
      })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
        setDuration(audioRef.current.duration || 0)
      }
    }, 250)
  }, [])

  const play = useCallback(async () => {
    // If already have audio, just resume
    if (audioRef.current && status === 'paused') {
      audioRef.current.play()
      setStatus('playing')
      startTimeTracking()
      return
    }

    // If cached, use cached blob
    if (audioCache.has(storyId)) {
      const audio = new Audio(audioCache.get(storyId))
      audioRef.current = audio
      audio.onended = () => { setStatus('ready'); clearInterval(intervalRef.current) }
      await audio.play()
      setStatus('playing')
      startTimeTracking()
      return
    }

    // Fetch from API
    setStatus('loading')
    try {
      const res = await fetch('/.netlify/functions/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      })

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('audio')) {
        setStatus('error')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioCache.set(storyId, url)

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setStatus('ready'); clearInterval(intervalRef.current) }
      await audio.play()
      setStatus('playing')
      startTimeTracking()
    } catch {
      setStatus('error')
    }
  }, [storyId, status, startTimeTracking])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setStatus('paused')
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const toggle = useCallback(() => {
    if (status === 'playing') pause()
    else play()
  }, [status, play, pause])

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    setStatus('idle')
    setCurrentTime(0)
  }, [])

  return {
    status,
    isAvailable: status !== 'unavailable' && status !== 'checking',
    isPlaying: status === 'playing',
    currentTime,
    duration,
    play, pause, toggle, seek, stop,
  }
}
