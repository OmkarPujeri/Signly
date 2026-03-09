import { classifyLandmarks, getTopCandidates } from '../utils/landmarkClassifier'
import { useRef } from 'react'

const useGestureClassifier = () => {
  const historyRef = useRef([])

  const classify = (landmarks) => {
    if (!landmarks || landmarks.length < 21)
      return { letter: null, confidence: 0 }

    const result = classifyLandmarks(landmarks)
    if (!result?.letter) return { letter: null, confidence: 0 }

    historyRef.current.push(result.letter)
    if (historyRef.current.length > 4)
      historyRef.current.shift()

    const counts = {}
    historyRef.current.forEach(l => counts[l] = (counts[l] || 0) + 1)
    
    // Require only 2 matching frames out of last 4 instead of 3/5
    const stable = Object.entries(counts).find(([, c]) => c >= 2)

    if (!stable) return { letter: null, confidence: isNaN(result.confidence) ? 0 : result.confidence }
    return { letter: stable[0], confidence: isNaN(result.confidence) ? 0 : result.confidence }
  }

  return { classify, getTopCandidates }
}

export { useGestureClassifier }
