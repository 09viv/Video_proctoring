"use client"

import { useEffect, useRef, useState } from "react"

interface DetectedObject {
  class: string
  confidence: number
  bbox: [number, number, number, number] // [x, y, width, height]
}

interface ObjectDetectionResult {
  objects: DetectedObject[]
  suspiciousObjects: DetectedObject[]
}

interface ObjectDetectionHookProps {
  videoElement: HTMLVideoElement | null
  isActive: boolean
  onObjectDetection: (result: ObjectDetectionResult) => void
}

// Suspicious object classes that should trigger alerts
const SUSPICIOUS_CLASSES = [
  "cell phone",
  "book",
  "laptop",
  "keyboard",
  "mouse",
  "remote",
  "scissors",
  "teddy bear", // Sometimes phones are misclassified
  "bottle", // Could be used to hide notes
  "cup", // Could be used to hide notes
]

export function useObjectDetection({ videoElement, isActive, onObjectDetection }: ObjectDetectionHookProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const modelRef = useRef<any>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadModel = async () => {
      if (typeof window === "undefined") return

      setIsLoading(true)
      try {
        // Dynamically import TensorFlow.js and COCO-SSD
        const tf = await import("@tensorflow/tfjs")
        const cocoSsd = await import("@tensorflow-models/coco-ssd")

        // Set backend to webgl for better performance
        await tf.setBackend("webgl")
        await tf.ready()

        console.log("[v0] Loading COCO-SSD model...")
        modelRef.current = await cocoSsd.load({
          base: "mobilenet_v2", // Faster but less accurate, good for real-time
        })

        console.log("[v0] COCO-SSD model loaded successfully")
        setIsModelLoaded(true)
      } catch (error) {
        console.error("[v0] Error loading object detection model:", error)
        // Fallback: set loaded to true to avoid blocking the UI
        setIsModelLoaded(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadModel()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive || !videoElement || !isModelLoaded || !modelRef.current) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      return
    }

    // Create canvas for object detection processing
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const detectObjects = async () => {
      if (!videoElement || videoElement.readyState !== 4 || !modelRef.current) return

      try {
        // Set canvas size to match video
        canvas.width = videoElement.videoWidth || 640
        canvas.height = videoElement.videoHeight || 480

        // Draw current video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

        // Run object detection
        const predictions = await modelRef.current.detect(canvas)

        // Process predictions
        const objects: DetectedObject[] = predictions.map((prediction: any) => ({
          class: prediction.class,
          confidence: prediction.score,
          bbox: prediction.bbox,
        }))

        // Filter for suspicious objects
        const suspiciousObjects = objects.filter(
          (obj) => SUSPICIOUS_CLASSES.includes(obj.class.toLowerCase()) && obj.confidence > 0.5,
        )

        onObjectDetection({
          objects,
          suspiciousObjects,
        })
      } catch (error) {
        console.error("[v0] Object detection error:", error)
      }
    }

    // Start detection interval (every 2 seconds to balance performance)
    detectionIntervalRef.current = setInterval(detectObjects, 2000)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [isActive, videoElement, isModelLoaded, onObjectDetection])

  return { isModelLoaded, isLoading }
}
