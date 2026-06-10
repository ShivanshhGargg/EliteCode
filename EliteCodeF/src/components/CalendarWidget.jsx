import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { attemptService } from '../api/attemptService'

export default function CalendarWidget({ solvedDates: propSolvedDates, streak: propStreak }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [solvedDates, setSolvedDates] = useState(propSolvedDates || [])
    const [streak, setStreak] = useState(propStreak || 0)

    // If props not provided, fetch from API
    useEffect(() => {
        if (!propSolvedDates) {
            attemptService.getSolvedDates().then(dates => setSolvedDates(dates)).catch(() => {})
        }
        if (!propStreak) {
            // Compute streak from solvedDates
            if (solvedDates.length) {
                const today = new Date().toDateString()
                const datesSorted = [...solvedDates].sort((a,b) => new Date(b) - new Date(a))
                let streakCount = 0
                let current = new Date()
                while (datesSorted.includes(current.toDateString())) {
                    streakCount++
                    current.setDate(current.getDate() - 1)
                }
                setStreak(streakCount)
            }
        }
    }, [propSolvedDates, propStreak, solvedDates])

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    const { daysInMonth, firstDayOfWeek } = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const days = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay()
        return { daysInMonth: days, firstDayOfWeek: firstDay }
    }, [currentMonth])

    const isSolvedDate = (day) => {
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString()
        return solvedDates.includes(dateStr)
    }

    const isToday = (day) => {
        const today = new Date()
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const days = []
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return (
        <div className="leetcode-panel p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-txt-primary">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
                    {streak > 0 && (
                        <div className="flex items-center gap-1 text-neon-orange">
                            <Flame size={14} />
                            <span className="text-xs font-medium">{streak}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1 rounded-md hover:bg-white/10 text-txt-muted hover:text-txt-primary">
                        <ChevronLeft size={14} />
                    </button>
                    <button onClick={nextMonth} className="p-1 rounded-md hover:bg-white/10 text-txt-muted hover:text-txt-primary">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-[10px] font-medium text-txt-muted uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />
                    const solved = isSolvedDate(day)
                    const today = isToday(day)
                    return (
                        <div
                            key={day}
                            className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-medium transition-all
                ${today ? 'bg-cyan/20 text-cyan border border-cyan/30' :
                                solved ? 'bg-neon-green/15 text-neon-green border border-neon-green/25' :
                                    'text-txt-secondary hover:bg-white/[0.03]'}`}
                            title={solved ? 'Problem completed' : today ? 'Today' : ''}
                        >
                            {day}
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-neon-green/15 border border-neon-green/25" />
                    <span className="text-[10px] text-txt-muted">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-cyan/20 border border-cyan/30" />
                    <span className="text-[10px] text-txt-muted">Today</span>
                </div>
            </div>
        </div>
    )
}