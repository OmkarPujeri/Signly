import { useEffect, useRef, useState } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { HAND_CONNECTIONS } from '@mediapipe/hands'

const useMediaPipe = ({ onResult, onReady, enabled = true } = {}) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const onResultRef = useRef(onResult)
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onResultRef.current = onResult
    onReadyRef.current = onReady
  }, [onResult, onReady])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let stopped = false
    let cameraInstance = null
    let handsInstance = null

    const init = async () => {
      try {
        const hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
        })

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.75,
          minTrackingConfidence: 0.6,
        })

        hands.onResults((results) => {
          if (stopped) return

          if (canvasRef.current && videoRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
            
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            if (results.multiHandLandmarks?.length > 0) {
              drawConnectors(
                ctx,
                results.multiHandLandmarks[0],
                HAND_CONNECTIONS,
                { color: '#22c55e', lineWidth: 2 }
              )
              drawLandmarks(
                ctx,
                results.multiHandLandmarks[0],
                { color: '#ef4444', lineWidth: 1, radius: 3 }
              )
            }
          }

          if (results.multiHandLandmarks?.length > 0) {
            if (onResultRef.current)
              onResultRef.current(results.multiHandLandmarks[0])
          } else {
            if (onResultRef.current)
              onResultRef.current(null)
          }
        })

        handsInstance = hands

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })

        if (stopped) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await new Promise(resolve => {
            videoRef.current.onloadedmetadata = resolve
          })
          await videoRef.current.play()
        }

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!stopped && handsInstance && videoRef.current) {
              await handsInstance.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480,
        })

        await camera.start()
        cameraInstance = camera

        if (!stopped) {
          setIsLoading(false)
          if (onReadyRef.current) onReadyRef.current()
        }

      } catch (err) {
        if (!stopped) {
          setError('Camera failed: ' + err.message)
          setIsLoading(false)
        }
      }
    }

    const timer = setTimeout(init, 600)

    return () => {
      stopped = true
      clearTimeout(timer)
      if (cameraInstance) cameraInstance.stop()
      if (handsInstance) handsInstance.close()
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [enabled])

  return { videoRef, canvasRef, isLoading, error }
}

export default useMediaPipe
