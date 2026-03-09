import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { signs } from '../data/signs';
import { wordList } from '../data/words.js';
import useMediaPipe from '../hooks/useMediaPipe';
import { useGestureClassifier } from '../hooks/useGestureClassifier';
import { CheckCircle2 } from 'lucide-react';

export default function WebcamPage() {
  const [mode, setMode] = useState('letter')
  const [letterIndex, setLetterIndex] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isMatch, setIsMatch] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [detectedLetter, setDetectedLetter] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [topCandidates, setTopCandidates] = useState([])

  // Refs to avoid stale closures in callbacks
  const modeRef = useRef(mode)
  const currentLetterRef = useRef('A')
  const currentLetterIndexRef = useRef(0)
  const matchLockRef = useRef(false)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { 
    currentLetterIndexRef.current = currentLetterIndex 
  }, [currentLetterIndex])

  // Derived values — defined AFTER all state
  const alphabetSigns = signs.filter(s => s.category === 'alphabet')
  const currentWord = wordList?.[currentWordIndex] ?? 'CAT'
  const currentLetters = currentWord.split('')
  const currentSign = mode === 'letter'
    ? alphabetSigns[letterIndex]
    : signs.find(s => s.word === currentLetters[currentLetterIndex])
  const currentLetter = mode === 'letter'
    ? alphabetSigns[letterIndex]?.word ?? 'A'
    : currentLetters[currentLetterIndex] ?? 'A'

  // Keep currentLetterRef in sync
  useEffect(() => {
    currentLetterRef.current = currentLetter
  }, [currentLetter])

  const { classify, getTopCandidates } = useGestureClassifier()

  const { videoRef, canvasRef, isLoading, error } = useMediaPipe({
    enabled: true,
    onResult: (landmarks) => {
      if (!landmarks) {
        setDetectedLetter(null)
        setConfidence(0)
        setIsMatch(false)
        setTopCandidates([])
        return
      }

      setTopCandidates(getTopCandidates(landmarks))

      const result = classify(landmarks)
      const safeLetter = result?.letter ?? null
      const safeConf = isNaN(result?.confidence) ? 0 : result.confidence

      setDetectedLetter(safeLetter)
      setConfidence(Math.round(safeConf * 100))

      const matched = safeLetter &&
        safeLetter.toUpperCase() === currentLetterRef.current?.toUpperCase() &&
        safeConf >= 0.55

      setIsMatch(!!matched)

      if (matched && !matchLockRef.current) {
        matchLockRef.current = true
        setScore(prev => prev + 1)
        setStreak(prev => prev + 1)
        setTimeout(() => {
          matchLockRef.current = false
          handleNext()
        }, 800)
      }
    },
    onReady: () => setCameraReady(true)
  })

  const handleModeChange = (newMode) => {
    if (newMode === mode) return
    setMode(newMode)
    setCurrentLetterIndex(0)
    setLetterIndex(0)
    matchLockRef.current = false
  }

  const handleLetterMatch = () => {
    setCurrentLetterIndex(prev => {
      if (prev < currentLetters.length - 1) {
        return prev + 1
      } else {
        setCurrentWordIndex(idx => (idx + 1) % wordList.length)
        return 0
      }
    })
  }

  const handleNewWord = () => {
    setCurrentWordIndex(idx => (idx + 1) % wordList.length)
    setCurrentLetterIndex(0)
  }

  const handleNext = () => {
    if (modeRef.current === 'letter') {
      setLetterIndex(i => (i + 1) % alphabetSigns.length)
    } else {
      handleLetterMatch()
    }
  }

  const handlePrev = () => {
    setLetterIndex(i => (i - 1 + alphabetSigns.length) % alphabetSigns.length)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-3 
                      border-b border-[#D4CFC4] bg-[#F5F0E8]">
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('letter')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'letter'
                ? 'bg-green-500 text-white'
                : 'bg-transparent border border-gray-400 text-gray-600'
            }`}
          >
            LETTER PRACTICE
          </button>
          <button
            onClick={() => handleModeChange('word')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'word'
                ? 'bg-green-500 text-white'
                : 'bg-transparent border border-gray-400 text-gray-600'
            }`}
          >
            WORD SPELLING
          </button>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 border border-gray-300 
                           rounded-full px-4 py-1 text-sm font-semibold">
            ⭐ {score}
          </span>
          <span className="flex items-center gap-1 border border-orange-300 
                           rounded-full px-4 py-1 text-sm font-semibold">
            🔥 {streak}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="grid grid-cols-2 gap-6 px-6 py-4"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        {/* LEFT PANEL */}
        {mode === 'letter' ? (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col p-6 h-full">
            <p className="text-xs tracking-widest text-gray-400 text-center mb-2">
              SIGN THIS
            </p>
            <p className="text-6xl font-black text-center mb-4">
              {currentLetter}
            </p>
            <div className="flex-1 flex items-center justify-center">
              <div className="border-4 border-gray-800 rounded-xl overflow-hidden"
                   style={{ width: '220px', height: '220px' }}>
                <img
                  src={`/assets/signs/${currentLetter.toLowerCase()}.gif`}
                  alt={currentLetter}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            </div>
            <p className="text-green-600 text-xs font-bold tracking-widest 
                          text-center mt-3">
              {currentSign?.handShape?.toUpperCase()}
            </p>
            {currentSign?.tip && (
              <div className="mt-3 bg-[#F5F0E8] rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-gray-500 mb-1">💡 PRO TIP</p>
                <p className="text-sm text-gray-700">{currentSign.tip}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 rounded-lg 
                           border border-gray-300 text-sm">
                ← Prev
              </button>
              <button onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-lg 
                           bg-gray-900 text-white text-sm">
                Next →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col p-6 h-full">
            <p className="text-xs tracking-widest text-gray-400 text-center mb-2">
              SPELL THIS WORD
            </p>
            <div className="flex justify-center gap-3 mb-4">
              {currentLetters.map((letter, index) => (
                <span
                  key={index}
                  className={`text-4xl font-black transition-all ${
                    index === currentLetterIndex
                      ? 'text-green-500 scale-125'
                      : index < currentLetterIndex
                      ? 'text-gray-300 line-through'
                      : 'text-gray-800'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mb-3">
              Sign the highlighted letter
            </p>
            <div className="flex-1 flex items-center justify-center">
              <div className="border-4 border-gray-800 rounded-xl overflow-hidden"
                   style={{ width: '200px', height: '200px' }}>
                <img
                  src={`/assets/signs/${currentLetter.toLowerCase()}.gif`}
                  alt={currentLetter}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            </div>
            <p className="text-green-600 text-xs font-bold tracking-widest 
                          text-center mt-3">
              {currentSign?.handShape?.toUpperCase()}
            </p>
            {currentSign?.tip && (
              <div className="mt-3 bg-[#F5F0E8] rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-gray-500 mb-1">💡 PRO TIP</p>
                <p className="text-sm text-gray-700">{currentSign.tip}</p>
              </div>
            )}
            <button
              onClick={handleNewWord}
              className="mt-4 mx-auto flex items-center gap-2 px-5 py-2 
                         rounded-lg border border-gray-300 text-sm"
            >
              ↻ New Word
            </button>
          </div>
        )}

        {/* RIGHT PANEL — always in DOM */}
        <div className="flex flex-col gap-4 h-full">
          <div className="relative rounded-2xl overflow-hidden flex-1 
                          border-2 border-gray-200"
               style={{ minHeight: 0 }}>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center 
                              justify-center bg-[#F5F0E8] rounded-2xl z-30">
                <div className="w-10 h-10 border-4 border-green-500 
                                border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500 tracking-widest">
                  LOADING AI MODEL...
                </p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center 
                              bg-[#F5F0E8] rounded-2xl z-30">
                <p className="text-red-500 text-sm text-center px-4">{error}</p>
              </div>
            )}
            <video
              ref={videoRef}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: 'block'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                transform: 'scaleX(-1)'
              }}
            />
            <AnimatePresence>
              {isMatch && (
                <div className="absolute inset-0 z-20 flex items-center 
                                justify-center bg-green-500/10">
                  <CheckCircle2 size={120} className="text-green-500 
                                                      drop-shadow-2xl" />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-gray-900 rounded-2xl px-5 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs tracking-widest">
                CONFIDENCE
              </span>
              <span className="text-white font-bold">
                {isNaN(confidence) ? 0 : confidence}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${isNaN(confidence) ? 0 : confidence}%` }}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-3xl font-black">
                {detectedLetter || '—'}
              </span>
              <span className="text-gray-400 text-sm">
                {isMatch ? '✓ MATCH!' : 'keep trying...'}
              </span>
            </div>
            {topCandidates.length > 0 && (
              <p className="text-gray-500 text-xs mt-1">
                Also seeing: {topCandidates.join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
