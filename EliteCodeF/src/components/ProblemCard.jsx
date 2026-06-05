import { memo } from 'react'
import { ArrowRight } from 'lucide-react'
import { getDifficultyBg, truncate } from '../utils/format'

export const ProblemCard = memo(function ProblemCard({ problem, onSelect }) {
  return (
    <div
      onClick={() => onSelect?.(problem)}
      className="group relative rounded-[24px] border border-white/5 bg-white/[0.03] p-5 cursor-pointer
        transition-all duration-300 hover:border-cyan/20 hover:bg-white/[0.045] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.22em] border ${getDifficultyBg(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
        <ArrowRight size={16} className="text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="font-semibold text-txt-primary mb-2 group-hover:text-cyan transition-colors line-clamp-2">
        {problem.title}
      </h3>
      <p className="text-xs text-txt-secondary line-clamp-2 leading-relaxed">
        {truncate(problem.originalText, 100)}
      </p>
      {problem.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {problem.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-1 bg-white/[0.04] rounded-lg text-[10px] text-txt-muted border border-white/5">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

export default ProblemCard
