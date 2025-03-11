"use client"

import { forwardRef, useRef, useEffect, useState } from "react"

interface DrawingCanvasProps {
  isDrawing: boolean
  onDrawingUpdate: (imageData: ImageData) => void
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(({ isDrawing, onDrawingUpdate }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawingOnCanvas, setIsDrawingOnCanvas] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [strokeHistory, setStrokeHistory] = useState<number[][]>([])
  const [predictionTimer, setPredictionTimer] = useState<NodeJS.Timeout | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions
    const parent = canvas.parentElement
    if (parent) {
      canvas.width = parent.clientWidth - 32 // Adjust for padding
      canvas.height = 400
    } else {
      canvas.width = 600
      canvas.height = 400
    }

    // Set canvas styles
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.lineWidth = 8
      ctx.strokeStyle = "#000000"
    }

    // Clear canvas
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const parent = canvas.parentElement
      if (parent) {
        const oldWidth = canvas.width
        const oldHeight = canvas.height
        const newWidth = parent.clientWidth - 32

        // Save current drawing
        const ctx = canvas.getContext("2d")
        let imageData = null
        if (ctx) {
          imageData = ctx.getImageData(0, 0, oldWidth, oldHeight)
        }

        // Resize canvas
        canvas.width = newWidth
        canvas.height = 400

        // Restore drawing
        if (ctx && imageData) {
          ctx.putImageData(imageData, 0, 0)
          ctx.lineJoin = "round"
          ctx.lineCap = "round"
          ctx.lineWidth = 8
          ctx.strokeStyle = "#000000"
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Prevent touch scrolling when drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Prevent touch scrolling when drawing
    const preventTouchScroll = (e: TouchEvent) => {
      if (isDrawing) e.preventDefault()
    }

    canvas.addEventListener("touchstart", preventTouchScroll, { passive: false })
    canvas.addEventListener("touchmove", preventTouchScroll, { passive: false })

    return () => {
      canvas.removeEventListener("touchstart", preventTouchScroll)
      canvas.removeEventListener("touchmove", preventTouchScroll)
    }
  }, [isDrawing])

  // Handle drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return

      setIsDrawingOnCanvas(true)

      let clientX, clientY
      if ("touches" in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      setLastX(x)
      setLastY(y)
      setStrokeHistory([[x, y]])
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing || !isDrawingOnCanvas) return

      e.preventDefault() // Prevent scrolling on touch devices

      let clientX, clientY
      if ("touches" in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()

      setLastX(x)
      setLastY(y)
      setStrokeHistory((prev) => [...prev, [x, y]])

      // Schedule prediction update
      if (predictionTimer) clearTimeout(predictionTimer)
      setPredictionTimer(
        setTimeout(() => {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          onDrawingUpdate(imageData)
        }, 500),
      )
    }

    const endDrawing = () => {
      if (isDrawingOnCanvas) {
        setIsDrawingOnCanvas(false)

        // Trigger prediction
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        onDrawingUpdate(imageData)
      }
    }

    canvas.addEventListener("mousedown", startDrawing)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", endDrawing)
    canvas.addEventListener("mouseout", endDrawing)

    canvas.addEventListener("touchstart", startDrawing)
    canvas.addEventListener("touchmove", draw)
    canvas.addEventListener("touchend", endDrawing)

    return () => {
      canvas.removeEventListener("mousedown", startDrawing)
      canvas.removeEventListener("mousemove", draw)
      canvas.removeEventListener("mouseup", endDrawing)
      canvas.removeEventListener("mouseout", endDrawing)

      canvas.removeEventListener("touchstart", startDrawing)
      canvas.removeEventListener("touchmove", draw)
      canvas.removeEventListener("touchend", endDrawing)

      if (predictionTimer) clearTimeout(predictionTimer)
    }
  }, [isDrawing, isDrawingOnCanvas, lastX, lastY, onDrawingUpdate, predictionTimer])

  // Forward ref
  useEffect(() => {
    if (typeof ref === "function") {
      ref(canvasRef.current)
    } else if (ref) {
      ref.current = canvasRef.current
    }
  }, [ref])

  return (
    <div className="relative bg-white rounded-lg border overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`w-full touch-none ${isDrawing ? "cursor-none" : "cursor-not-allowed"}`}
        style={{ backgroundColor: "white" }}
      />
      {!isDrawing && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="bg-white/90 p-4 rounded-lg text-center">
            <p className="font-medium">Waiting for next round...</p>
          </div>
        </div>
      )}
      {isDrawing && (
        <div
          className="absolute w-8 h-8 pointer-events-none"
          style={{
            left: `${lastX}px`,
            top: `${lastY}px`,
            transform: "translate(-50%, -50%)",
            display: isDrawingOnCanvas ? "block" : "none",
            zIndex: 10,
          }}
        >
          <div
            className="w-4 h-4 border-2 border-indigo-500 rounded-full"
            style={{ backgroundColor: "rgba(99, 102, 241, 0.2)" }}
          ></div>
        </div>
      )}
    </div>
  )
})

DrawingCanvas.displayName = "DrawingCanvas"

export default DrawingCanvas

