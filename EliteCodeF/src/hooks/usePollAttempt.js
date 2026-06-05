import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attemptService } from '../api/attemptService'

const POLL_INTERVAL = parseInt(import.meta.env.VITE_POLL_INTERVAL || '2000')

export function usePollAttempt(attemptId, onComplete) {
  const completedRef = useRef(false)

  const { data: attempt, isLoading, error } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => attemptService.getAttemptById(attemptId),
    enabled: !!attemptId,
    refetchInterval: (query) => {
      const data = query?.state?.data
      if (data && (data.status === 'COMPLETED' || data.status === 'FAILED')) {
        if (!completedRef.current && onComplete) {
          completedRef.current = true
          onComplete(data)
        }
        return false
      }
      return POLL_INTERVAL
    },
  })

  useEffect(() => {
    return () => {
      completedRef.current = false
    }
  }, [attemptId])

  return { attempt, isLoading, error, isPolling: !!attemptId && (!attempt || (attempt.status !== 'COMPLETED' && attempt.status !== 'FAILED')) }
}