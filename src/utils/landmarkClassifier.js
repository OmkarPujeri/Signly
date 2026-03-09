export const classifyLandmarks = (landmarks) => {
  if (!landmarks || landmarks.length < 21)
    return { letter: null, confidence: 0 }

  // Mirror x coordinates for left hand
  // MediaPipe returns mirrored coords since video is flipped
  const mirrored = landmarks.map(lm => ({
    ...lm,
    x: 1 - lm.x  // flip x axis
  }))

  const lm = normalizeLandmarks(mirrored)  // use mirrored landmarks

  const scores = {
    A: scoreA(lm), B: scoreB(lm), C: scoreC(lm), D: scoreD(lm),
    E: scoreE(lm), F: scoreF(lm), G: scoreG(lm), H: scoreH(lm),
    I: scoreI(lm), K: scoreK(lm), L: scoreL(lm), M: scoreM(lm),
    N: scoreN(lm), O: scoreO(lm), P: scoreP(lm), Q: scoreQ(lm),
    R: scoreR(lm), S: scoreS(lm), T: scoreT(lm), U: scoreU(lm),
    V: scoreV(lm), W: scoreW(lm), X: scoreX(lm), Y: scoreY(lm),
  }

  const best = Object.entries(scores)
    .filter(([, v]) => typeof v === 'number' && !isNaN(v) && isFinite(v))
    .sort((a, b) => b[1] - a[1])[0]

  if (!best || best[1] < 0.40) return { letter: null, confidence: 0 }

  // A / T / S disambiguation — most confused trio
  if (['A', 'T', 'S'].includes(best[0])) {
    const thumbX = lm[4].x
    const thumbY = lm[4].y
    const indexTipY = lm[8].y
    const thumbBetweenFingers = 
      lm[4].x > Math.min(lm[5].x, lm[9].x) - 0.1 &&
      lm[4].x < Math.max(lm[5].x, lm[9].x) + 0.1

    // Force T if thumb is clearly between index and middle
    if (thumbBetweenFingers && thumbY < indexTipY + 0.1) {
      return { letter: 'T', confidence: parseFloat(best[1].toFixed(2)) }
    }
    // Force A if thumb is clearly to the right side
    if (thumbX > 0.35) {
      return { letter: 'A', confidence: parseFloat(best[1].toFixed(2)) }
    }
    // Otherwise S (thumb covering fingers from front)
    if (thumbX >= 0.1 && thumbX <= 0.3) {
      return { letter: 'S', confidence: parseFloat(best[1].toFixed(2)) }
    }
  }

  return { letter: best[0], confidence: parseFloat(best[1].toFixed(2)) }
}

export const getTopCandidates = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return []
  const mirrored = landmarks.map(lm => ({ ...lm, x: 1 - lm.x }))
  const lm = normalizeLandmarks(mirrored)
  const scores = {
    A: scoreA(lm), B: scoreB(lm), C: scoreC(lm), D: scoreD(lm),
    E: scoreE(lm), F: scoreF(lm), G: scoreG(lm), H: scoreH(lm),
    I: scoreI(lm), K: scoreK(lm), L: scoreL(lm), M: scoreM(lm),
    N: scoreN(lm), O: scoreO(lm), R: scoreR(lm), S: scoreS(lm),
    T: scoreT(lm), U: scoreU(lm), V: scoreV(lm), W: scoreW(lm),
    X: scoreX(lm), Y: scoreY(lm)
  }
  return Object.entries(scores)
    .filter(([, v]) => !isNaN(v) && v > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([letter, score]) => `${letter}:${Math.round(score * 100)}%`)
}

// Normalize landmarks relative to wrist and hand size
const normalizeLandmarks = (landmarks) => {
  const wrist = landmarks[0]
  const handSize = dist(wrist, landmarks[9])
  if (handSize === 0) return landmarks
  return landmarks.map(lm => ({
    x: (lm.x - wrist.x) / handSize,
    y: (lm.y - wrist.y) / handSize,
    z: (lm.z - wrist.z) / handSize,
  }))
}

const dist = (a, b) => Math.sqrt(
  Math.pow(a.x - b.x, 2) +
  Math.pow(a.y - b.y, 2)
)

const isExtended = (lm, tip, mcp) => lm[tip].y < lm[mcp].y - 0.15
const isCurled   = (lm, tip, mcp) => lm[tip].y > lm[mcp].y - 0.05
const isNear     = (a, b, t = 0.20) => dist(a, b) < t

// Individual letter scoring functions
const scoreA = (lm) => {
  let score = 0
  // All 4 fingers must be curled
  if (isCurled(lm, 8, 5))  score += 0.2
  if (isCurled(lm, 12, 9)) score += 0.2
  if (isCurled(lm, 16, 13))score += 0.2
  if (isCurled(lm, 20, 17))score += 0.2
  // KEY: thumb tip must be clearly to the SIDE
  // In normalized coords, thumb x should be positive (right side)
  if (lm[4].x > 0.3) score += 0.3
  // Thumb tip must NOT be above the index finger tip
  if (lm[4].y > lm[8].y - 0.1) score += 0.1
  // Thumb must NOT be between index and middle (that would be T)
  const thumbBetweenFingers = lm[4].x > lm[8].x - 0.1 && 
                              lm[4].x < lm[12].x + 0.1
  if (!thumbBetweenFingers) score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreB = (lm) => {
  let score = 0
  // All 4 fingers pointing up
  if (lm[8].y < lm[5].y)  score += 0.25  // index tip above mcp
  if (lm[12].y < lm[9].y) score += 0.25  // middle tip above mcp
  if (lm[16].y < lm[13].y)score += 0.25  // ring tip above mcp
  if (lm[20].y < lm[17].y)score += 0.25  // pinky tip above mcp
  // Fingers close together
  if (dist(lm[8], lm[12]) < 0.15) score += 0.1
  // Thumb tucked — not extending far to side
  if (lm[4].x < 0.4) score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreC = (lm) => {
  let score = 0
  // Thumb and index form open curve
  const thumbIndexDist = dist(lm[4], lm[8])
  if (thumbIndexDist > 0.15 && thumbIndexDist < 0.55) score += 0.4
  // Fingers curved but not fully extended or fully curled
  if (lm[8].y > lm[5].y - 0.35) score += 0.15  // index not fully up
  if (lm[12].y > lm[9].y - 0.35) score += 0.15 // middle not fully up
  if (lm[8].y < lm[5].y + 0.2)   score += 0.15 // index not fully down
  if (lm[12].y < lm[9].y + 0.2)  score += 0.15 // middle not fully down
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreD = (lm) => {
  let score = 0
  if (isExtended(lm, 8, 5))   score += 0.3
  if (isCurled(lm, 12, 9))    score += 0.2
  if (isCurled(lm, 16, 13))   score += 0.2
  if (isNear(lm[4], lm[12], 0.20)) score += 0.3
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreE = (lm) => {
  let score = 0
  if (isCurled(lm, 8, 5))  score += 0.25
  if (isCurled(lm, 12, 9)) score += 0.25
  if (isCurled(lm, 16, 13))score += 0.25
  if (isCurled(lm, 20, 17))score += 0.25
  if (lm[4].y > lm[5].y)   score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreF = (lm) => {
  let score = 0
  if (isNear(lm[4], lm[8], 0.1))  score += 0.4
  if (isExtended(lm, 12, 9))  score += 0.2
  if (isExtended(lm, 16, 13)) score += 0.2
  if (isExtended(lm, 20, 17)) score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreG = (lm) => {
  let score = 0
  const horizontalIndex = Math.abs(lm[8].y - lm[5].y) < 0.2
  if (horizontalIndex)         score += 0.4
  if (isCurled(lm, 12, 9))    score += 0.2
  if (isCurled(lm, 16, 13))   score += 0.2
  if (isCurled(lm, 20, 17))   score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreH = (lm) => {
  let score = 0
  const horizontalIndex = Math.abs(lm[8].y - lm[5].y) < 0.2
  const horizontalMiddle = Math.abs(lm[12].y - lm[9].y) < 0.2
  if (horizontalIndex && horizontalMiddle) score += 0.5
  if (dist(lm[8], lm[12]) < 0.1) score += 0.2
  if (isCurled(lm, 16, 13)) score += 0.15
  if (isCurled(lm, 20, 17)) score += 0.15
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreI = (lm) => {
  let score = 0
  // Only pinky up
  if (lm[20].y < lm[17].y - 0.1) score += 0.5
  // All other fingers down
  if (lm[8].y > lm[5].y - 0.1)  score += 0.2
  if (lm[12].y > lm[9].y - 0.1) score += 0.15
  if (lm[16].y > lm[13].y - 0.1)score += 0.15
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreK = (lm) => {
  let score = 0
  if (isExtended(lm, 8, 5))  score += 0.25
  if (isExtended(lm, 12, 9)) score += 0.25
  if (dist(lm[8], lm[12]) > 0.1) score += 0.2
  if (isNear(lm[4], lm[10], 0.20)) score += 0.3
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreL = (lm) => {
  let score = 0
  // Index finger extended upward
  if (lm[8].y < lm[5].y - 0.1) score += 0.4
  // Thumb extended sideways (large x value in normalized coords)
  if (lm[4].x > 0.25) score += 0.4
  // Other fingers curled
  if (lm[12].y > lm[9].y - 0.05)  score += 0.1
  if (lm[16].y > lm[13].y - 0.05) score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreM = (lm) => {
  let score = 0
  if (isCurled(lm, 8, 5))  score += 0.15
  if (isCurled(lm, 12, 9)) score += 0.15
  if (isCurled(lm, 16, 13))score += 0.15
  if (isCurled(lm, 20, 17))score += 0.1
  // M: thumb under THREE fingers (index, middle, ring)
  // Thumb tip is near ring finger area
  if (isNear(lm[4], lm[14], 0.3)) score += 0.25
  if (lm[4].y > lm[9].y)  score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreN = (lm) => {
  let score = 0
  if (isCurled(lm, 8, 5))  score += 0.2
  if (isCurled(lm, 12, 9)) score += 0.2
  if (isCurled(lm, 16, 13))score += 0.15
  if (isCurled(lm, 20, 17))score += 0.1
  // N: thumb under TWO fingers (index, middle)
  // Thumb tip is near middle finger area, NOT ring finger
  if (isNear(lm[4], lm[10], 0.25)) score += 0.25
  if (!isNear(lm[4], lm[14], 0.2)) score += 0.1
  if (lm[4].y > lm[5].y)  score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreO = (lm) => {
  let score = 0
  // All fingertips close to thumb — tighter than C
  const d1 = dist(lm[4], lm[8])
  const d2 = dist(lm[4], lm[12])
  const d3 = dist(lm[4], lm[16])
  const d4 = dist(lm[4], lm[20])
  const avgDist = (d1 + d2 + d3 + d4) / 4
  if (avgDist < 0.18) score += 0.7  // tight circle
  else if (avgDist < 0.25) score += 0.4
  if (d1 < 0.20) score += 0.15
  if (d2 < 0.22) score += 0.15
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreP = (lm) => {
  let score = 0
  if (lm[8].y > lm[5].y)   score += 0.3
  if (lm[12].y > lm[9].y)  score += 0.3
  if (isCurled(lm, 16, 13))score += 0.2
  if (isCurled(lm, 20, 17))score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreQ = (lm) => {
  let score = 0
  if (lm[8].y > lm[5].y)   score += 0.4
  if (lm[4].y > lm[2].y)   score += 0.3
  if (isCurled(lm, 12, 9)) score += 0.15
  if (isCurled(lm, 16, 13))score += 0.15
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreR = (lm) => {
  let score = 0
  if (isExtended(lm, 8, 5))  score += 0.3
  if (isExtended(lm, 12, 9)) score += 0.3
  if (dist(lm[8], lm[12]) < 0.05) score += 0.4
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreS = (lm) => {
  let score = 0
  // All 4 fingers curled
  if (isCurled(lm, 8, 5))  score += 0.15
  if (isCurled(lm, 12, 9)) score += 0.15
  if (isCurled(lm, 16, 13))score += 0.15
  if (isCurled(lm, 20, 17))score += 0.15
  // KEY: thumb crosses OVER the front of the fingers
  // Thumb tip x is between index tip and pinky tip (covering fingers)
  const thumbCoversFingers = lm[4].x > Math.min(lm[8].x, lm[20].x) - 0.05 &&
                             lm[4].x < Math.max(lm[8].x, lm[20].x) + 0.05
  if (thumbCoversFingers) score += 0.3
  // Thumb tip y is roughly at same level as fingertips
  const thumbAtFingertipLevel = Math.abs(lm[4].y - lm[8].y) < 0.25
  if (thumbAtFingertipLevel) score += 0.2
  // Thumb is NOT to the side like A (x should be closer to center)
  if (lm[4].x < 0.25) score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreT = (lm) => {
  let score = 0
  // All 4 fingers curled
  if (isCurled(lm, 8, 5))  score += 0.15
  if (isCurled(lm, 12, 9)) score += 0.15
  if (isCurled(lm, 16, 13))score += 0.15
  if (isCurled(lm, 20, 17))score += 0.15
  // KEY distinguisher: thumb tip is between index and middle finger
  // Thumb tip x is between index MCP and middle MCP
  const thumbBetweenXAxis = lm[4].x > Math.min(lm[5].x, lm[9].x) - 0.1 &&
                            lm[4].x < Math.max(lm[5].x, lm[9].x) + 0.1
  if (thumbBetweenXAxis) score += 0.3
  // Thumb tip y is HIGHER (more negative) than index finger tip
  // meaning thumb pokes up between fingers
  if (lm[4].y < lm[8].y + 0.1) score += 0.2
  // Thumb must be close to index PIP joint
  if (isNear(lm[4], lm[6], 0.20)) score += 0.2
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreU = (lm) => {
  let score = 0
  if (lm[8].y < lm[5].y)  score += 0.25
  if (lm[12].y < lm[9].y) score += 0.25
  // KEY: fingers close together
  if (dist(lm[8], lm[12]) < 0.08) score += 0.3
  if (lm[16].y > lm[13].y - 0.05) score += 0.1
  if (lm[20].y > lm[17].y - 0.05) score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreV = (lm) => {
  let score = 0
  if (lm[8].y < lm[5].y)  score += 0.25
  if (lm[12].y < lm[9].y) score += 0.25
  // KEY: fingers spread apart
  if (dist(lm[8], lm[12]) > 0.10) score += 0.3
  // Other fingers down
  if (lm[16].y > lm[13].y - 0.05) score += 0.1
  if (lm[20].y > lm[17].y - 0.05) score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreW = (lm) => {
  let score = 0
  if (lm[8].y < lm[5].y)   score += 0.25
  if (lm[12].y < lm[9].y)  score += 0.25
  if (lm[16].y < lm[13].y) score += 0.25
  // Three fingers spread
  if (dist(lm[8], lm[16]) > 0.15) score += 0.25
  // Pinky down
  if (lm[20].y > lm[17].y - 0.05) score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreX = (lm) => {
  let score = 0
  if (lm[8].y > lm[6].y && lm[8].y < lm[5].y) score += 0.5
  if (isCurled(lm, 12, 9))  score += 0.2
  if (isCurled(lm, 16, 13)) score += 0.15
  if (isCurled(lm, 20, 17)) score += 0.15
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}

const scoreY = (lm) => {
  let score = 0
  // Pinky extended
  if (lm[20].y < lm[17].y - 0.1) score += 0.35
  // Thumb extended to side
  if (lm[4].x > 0.20) score += 0.35
  // Middle 3 fingers curled
  if (lm[8].y > lm[5].y - 0.1)  score += 0.1
  if (lm[12].y > lm[9].y - 0.1) score += 0.1
  if (lm[16].y > lm[13].y - 0.1)score += 0.1
  return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)
}
