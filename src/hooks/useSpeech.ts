import { useState, useCallback, useRef } from 'react'

interface SpeechRecognitionOptions {
  onResult?: (result: string) => void
  onError?: (error: any) => void
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

// 语音识别 Hook
export const useSpeechRecognition = (options: SpeechRecognitionOptions = {}) => {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const {
    onResult,
    onError,
    continuous = false,
    interimResults = true,
    lang = 'zh-CN'
  } = options

  const listen = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const error = new Error('浏览器不支持语音识别')
      onError?.(error)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    recognitionRef.current = new SpeechRecognition()
    const recognition = recognitionRef.current

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript || interimTranscript
      setTranscript(fullTranscript)
      
      if (finalTranscript && onResult) {
        onResult(finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      setListening(false)
      onError?.(event.error)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
  }, [onResult, onError, continuous, interimResults, lang])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
    }
  }, [])

  return {
    listen,
    stop,
    listening,
    transcript,
    supported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }
}

// 语音合成 Hook
export const useSpeechSynthesis = () => {
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const speak = useCallback((options: { text: string } & SpeechSynthesisOptions) => {
    if (!('speechSynthesis' in window)) {
      console.error('浏览器不支持语音合成')
      return
    }

    // 停止当前播放
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(options.text)
    
    utterance.voice = options.voice || null
    utterance.rate = options.rate || 1
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1
    utterance.lang = options.lang || 'zh-CN'

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  // 获取可用的语音
  const getVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices()
    setVoices(availableVoices)
    return availableVoices
  }, [])

  return {
    speak,
    cancel,
    speaking,
    voices,
    getVoices,
    supported: 'speechSynthesis' in window
  }
}