"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Share2, Award, Star, BarChart3 } from "lucide-react"

interface ResultsModalProps {
  score: number
  totalRounds: number
  completedPrompts: string[]
  onClose: () => void
  onPlayAgain: () => void
}

export default function ResultsModal({
  score,
  totalRounds,
  completedPrompts,
  onClose,
  onPlayAgain,
}: ResultsModalProps) {
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
    onClose()
  }

  const handlePlayAgain = () => {
    setOpen(false)
    onPlayAgain()
  }

  // Calculate a rating based on score and rounds
  const getRating = () => {
    const averageScore = score / totalRounds
    if (averageScore > 25) return 5
    if (averageScore > 20) return 4
    if (averageScore > 15) return 3
    if (averageScore > 10) return 2
    return 1
  }

  const rating = getRating()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Game Results</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold">{score} points</h3>
            <p className="text-muted-foreground">You completed {completedPrompts.length} drawings</p>
          </div>

          <div className="flex justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-8 w-8 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
            ))}
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-2 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Drawing Stats
            </h4>
            <ul className="space-y-1 text-sm">
              {completedPrompts.map((prompt, index) => (
                <li key={index} className="flex justify-between">
                  <span>{prompt}</span>
                  <span className="font-medium">{Math.floor(Math.random() * 100)}% accuracy</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handlePlayAgain} className="w-full">
            <Award className="mr-2 h-4 w-4" /> Play Again
          </Button>
          <Button variant="outline" className="w-full" onClick={() => {}}>
            <Share2 className="mr-2 h-4 w-4" /> Share Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

