"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, RefreshCw, Award, Clock, Brain, Pencil, Trash2, Volume2, VolumeX } from "lucide-react"
import DrawingCanvas from "@/components/drawing-canvas"
import GameHeader from "@/components/game-header"
import ResultsModal from "@/components/results-modal"
import { categories } from "@/lib/categories"
import { cn } from "@/lib/utils"

export default function DrawingGame() {
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [timeLeft, setTimeLeft] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [totalRounds] = useState(6)
  const [predictions, setPredictions] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [completedPrompts, setCompletedPrompts] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState("medium")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const successSoundRef = useRef<HTMLAudioElement | null>(null)
  const tickSoundRef = useRef<HTMLAudioElement | null>(null)
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null)

  // Get a random prompt that hasn't been used yet
  const getRandomPrompt = () => {
    const unusedCategories = categories.filter((category) => !completedPrompts.includes(category))
    if (unusedCategories.length === 0) return "pencil" // Fallback

    const randomIndex = Math.floor(Math.random() * unusedCategories.length)
    return unusedCategories[randomIndex]
  }

  // Start a new round
  const startNewRound = () => {
    const newPrompt = getRandomPrompt()
    setCurrentPrompt(newPrompt)
    setTimeLeft(difficulty === "easy" ? 30 : difficulty === "medium" ? 20 : 15)
    setIsDrawing(true)
    setGameStarted(true)
    setPredictions([])

    // Clear the canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // Start the timer
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout)
          handleRoundEnd(false)
          return 0
        }
        // Play tick sound when time is running low
        if (prev <= 5 && soundEnabled && tickSoundRef.current) {
          tickSoundRef.current.currentTime = 0
          tickSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle the end of a round
  const handleRoundEnd = (success: boolean) => {
    setIsDrawing(false)
    if (timerRef.current) clearInterval(timerRef.current)

    if (success) {
      setScore((prev) => prev + Math.ceil(timeLeft * (difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2)))
      // Play success sound
      if (soundEnabled && successSoundRef.current) {
        successSoundRef.current.currentTime = 0
        successSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
      }
    }

    setCompletedPrompts((prev) => [...prev, currentPrompt])

    // Check if game is over
    if (round + 1 >= totalRounds) {
      setGameOver(true)
      setShowResults(true)
      // Play game over sound
      if (soundEnabled && gameOverSoundRef.current) {
        gameOverSoundRef.current.currentTime = 0
        gameOverSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
      }
    } else {
      setRound((prev) => prev + 1)
      setTimeout(() => startNewRound(), 1500)
    }
  }

  // Start the game
  const startGame = () => {
    setScore(0)
    setRound(0)
    setGameOver(false)
    setCompletedPrompts([])
    startNewRound()
  }

  // Reset the game
  const resetGame = () => {
    setGameStarted(false)
    setGameOver(false)
    setShowResults(false)
    setScore(0)
    setRound(0)
    setCompletedPrompts([])
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // Simulate AI predictions (in a real app, this would call a machine learning model)
  const simulatePredictions = (drawingData: ImageData) => {
    // Calculate drawing complexity by checking how many pixels are drawn
    const data = drawingData.data
    let pixelsDrawn = 0
    const totalPixels = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      // If pixel is not white (drawn)
      if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
        pixelsDrawn++
      }
    }

    // Calculate complexity percentage
    const complexity = (pixelsDrawn / totalPixels) * 100

    // Only make predictions if the drawing has enough detail
    if (complexity < 1.5) {
      // Drawing is too simple (like just a circle)
      setPredictions(["Need more detail", "Try drawing more", "Keep going"])
      return
    }

    // This is a simplified simulation - in a real app, you'd send the drawing to a model
    const randomCategories = [...categories]
      .filter((c) => c !== currentPrompt)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)

    // Add the correct answer with higher probability as rounds progress
    const correctAnswerProbability = 0.3 + (round / totalRounds) * 0.4

    if (Math.random() < correctAnswerProbability && complexity > 2) {
      // Add the correct answer at a random position
      randomCategories.splice(Math.floor(Math.random() * 2), 0, currentPrompt)
      setPredictions(randomCategories)

      // Delay the success to make it feel more realistic
      setTimeout(() => handleRoundEnd(true), 1000)
    } else {
      // Don't include the correct answer yet
      setPredictions(randomCategories.concat(categories[Math.floor(Math.random() * categories.length)]))
    }
  }

  // Clean up on unmount
  useEffect(() => {
    // Initialize audio elements
    successSoundRef.current = new Audio("/success.mp3")
    tickSoundRef.current = new Audio("/tick.mp3")
    gameOverSoundRef.current = new Audio("/gameover.mp3")

    // Set volume
    if (successSoundRef.current) successSoundRef.current.volume = 0.5
    if (tickSoundRef.current) tickSoundRef.current.volume = 0.3
    if (gameOverSoundRef.current) gameOverSoundRef.current.volume = 0.5

    return () => {
      // Clean up audio elements
      if (successSoundRef.current) successSoundRef.current.pause()
      if (tickSoundRef.current) tickSoundRef.current.pause()
      if (gameOverSoundRef.current) gameOverSoundRef.current.pause()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <GameHeader score={score} round={round} totalRounds={totalRounds} />

      <div className="mt-8">
        {!gameStarted ? (
          <Card className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Quick Sketch Challenge</h2>
            <p className="text-lg mb-8">
              Draw the prompted objects and let the AI guess what they are! You have limited time for each drawing.
            </p>

            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Select Difficulty:</h3>
              <Tabs
                defaultValue="medium"
                value={difficulty}
                onValueChange={setDifficulty}
                className="w-full max-w-md mx-auto"
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="easy">Easy</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="hard">Hard</TabsTrigger>
                </TabsList>
                <TabsContent value="easy" className="text-sm text-muted-foreground mt-2">
                  30 seconds per drawing, normal scoring
                </TabsContent>
                <TabsContent value="medium" className="text-sm text-muted-foreground mt-2">
                  20 seconds per drawing, 1.5x scoring
                </TabsContent>
                <TabsContent value="hard" className="text-sm text-muted-foreground mt-2">
                  15 seconds per drawing, 2x scoring
                </TabsContent>
              </Tabs>
            </div>

            <Button
              size="lg"
              onClick={startGame}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-lg"
            >
              <Pencil className="mr-2 h-5 w-5" /> Start Drawing!
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Draw: {currentPrompt}</h2>
                    <p className="text-muted-foreground">
                      Round {round + 1} of {totalRounds}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-xl font-mono">{timeLeft}s</span>
                  </div>
                </div>

                <Progress
                  value={(timeLeft / (difficulty === "easy" ? 30 : difficulty === "medium" ? 20 : 15)) * 100}
                  className={cn(
                    "h-2 mb-4",
                    timeLeft < 5 ? "bg-red-200" : timeLeft < 10 ? "bg-orange-200" : "bg-blue-200",
                  )}
                />

                <DrawingCanvas ref={canvasRef} isDrawing={isDrawing} onDrawingUpdate={simulatePredictions} />

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const canvas = canvasRef.current
                      if (canvas) {
                        const ctx = canvas.getContext("2d")
                        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
                      }
                    }}
                    disabled={!isDrawing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                  </Button>

                  <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-500" />
                  AI Predictions
                </h3>

                {predictions.length > 0 ? (
                  <div className="space-y-2">
                    {predictions.map((prediction, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-md flex items-center justify-between",
                          prediction === currentPrompt
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-gray-100 dark:bg-gray-800",
                        )}
                      >
                        <span className="font-medium">{prediction}</span>
                        {prediction === currentPrompt && (
                          <Badge variant="outline" className="bg-green-500 text-white">
                            <Sparkles className="h-3 w-3 mr-1" /> Match!
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Start drawing to see predictions</p>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Award className="mr-2 h-5 w-5 text-yellow-500" />
                  Score: {score}
                </h3>

                <Button variant="outline" className="w-full" onClick={resetGame}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Restart Game
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {showResults && (
        <ResultsModal
          score={score}
          totalRounds={totalRounds}
          completedPrompts={completedPrompts}
          onClose={() => setShowResults(false)}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  )
}

