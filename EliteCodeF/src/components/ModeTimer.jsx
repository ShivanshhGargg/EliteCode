import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import useInterviewStore from '../store/interviewStore'

export function ModeTimer({ mode, sessionId }) {
    const { getSession, updateTimer, deductPoints, endSession } = useInterviewStore()
    const sessionData = getSession(sessionId)
    const [remaining, setRemaining] = useState(null)
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!sessionData?.started || sessionData?.paused) return

        const interval = setInterval(() => {
            const now = Date.now()
            const elapsedSec = Math.floor((now - sessionData.startTime) / 1000)
            setElapsed(elapsedSec)

            if (mode === 'INTERVIEW' && sessionData.timeLimit) {
                const rem = Math.max(0, sessionData.timeLimit - elapsedSec)
                setRemaining(rem)
                updateTimer(sessionId, elapsedSec, rem)
                if (rem === 0) {
                    window.dispatchEvent(new CustomEvent('elitecode-time-up', {
                        detail: { sessionId, finalScore: sessionData.score }
                    }))
                    endSession(sessionId)
                    clearInterval(interval)
                }
            } else if (mode === 'LEARNING' && sessionData.timeLimit) {
                const rem = Math.max(0, sessionData.timeLimit - elapsedSec)
                setRemaining(rem)
                updateTimer(sessionId, elapsedSec, rem)
                if (rem === 0) {
                    window.dispatchEvent(new CustomEvent('elitecode-time-up', {
                        detail: { sessionId, finalScore: null }
                    }))
                    clearInterval(interval)
                }
            } else {
                // Unlimited session – just update elapsed
                updateTimer(sessionId, elapsedSec, null)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [sessionData?.started, sessionData?.paused, sessionId, mode, sessionData?.timeLimit, sessionData?.score, updateTimer, endSession])

    // Subscribe to point deductions for interview
    useEffect(() => {
        const handler = (e) => {
            if (mode === 'INTERVIEW' && sessionData?.started) {
                deductPoints(sessionId, e.detail || 10)
            }
        }
        window.addEventListener('elitecode-deduct-points', handler)
        return () => window.removeEventListener('elitecode-deduct-points', handler)
    }, [mode, sessionId, sessionData?.started, deductPoints])

    const formatTime = (sec) => {
        if (sec === null || sec === undefined) return '--:--'
        const hours = Math.floor(sec / 3600)
        const minutes = Math.floor((sec % 3600) / 60)
        const seconds = sec % 60
        if (hours > 0) {
            return `${hours}h ${minutes.toString().padStart(2, '0')}m`
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    if (!sessionData?.started) return null

    let displayText = ''
    if (mode === 'INTERVIEW') {
        displayText = formatTime(remaining !== null ? remaining : sessionData.remaining)
        return (
            <div className="flex items-center gap-2 text-sm font-mono">
                <div className="flex items-center gap-1.5 text-neon-red">
                    <Clock size={14} />
                    <span>{displayText}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan">
                    <span>Score: {sessionData.score}</span>
                </div>
            </div>
        )
    } else if (mode === 'LEARNING') {
        if (sessionData.timeLimit) {
            displayText = formatTime(remaining !== null ? remaining : sessionData.remaining)
        } else {
            displayText = formatTime(elapsed)
        }
        return (
            <div className="flex items-center gap-1.5 text-sm font-mono text-cyan">
                <Clock size={14} />
                <span>{displayText}</span>
            </div>
        )
    }

    return null
}
