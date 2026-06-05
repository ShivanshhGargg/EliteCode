import { useState } from 'react'
import { X } from 'lucide-react'
import { NeonButton } from './NeonButton'
import useInterviewStore from '../store/interviewStore'

export function LearningTimerModal({ isOpen, onClose, sessionId }) {
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const { getSession, startSession, updateTimer } = useInterviewStore()
    const totalSeconds = hours * 3600 + minutes * 60

    if (!isOpen) return null

    const handleSetTimer = () => {
        if (totalSeconds <= 0) {
            return
        }
        const session = getSession(sessionId)
        if (session?.started) {
            // If session already started, update its time limit and remaining
            updateTimer(sessionId, session.elapsed, totalSeconds)
        } else {
            // Start session with timer
            startSession(sessionId, { mode: 'LEARNING', timeLimit: totalSeconds })
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-txt-primary">Set Learning Timer</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-txt-muted">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-5">
                    <div className="flex gap-4 justify-center">
                        <div className="text-center">
                            <label className="block text-xs text-txt-muted mb-2">Hours</label>
                            <input
                                type="number"
                                min="0"
                                max="24"
                                value={hours}
                                onChange={(e) => setHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="input-neon w-24 text-center text-xl font-mono"
                            />
                        </div>
                        <div className="text-center">
                            <label className="block text-xs text-txt-muted mb-2">Minutes</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={minutes}
                                onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="input-neon w-24 text-center text-xl font-mono"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-txt-muted text-center">
                        The timer will count down. When it reaches zero, the session will end.
                    </p>
                    <NeonButton variant="solid" onClick={handleSetTimer} disabled={totalSeconds <= 0} className="w-full">
                        Start Timer
                    </NeonButton>
                </div>
            </div>
        </div>
    )
}
