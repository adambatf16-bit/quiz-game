'use client'

import { Check, X } from 'lucide-react'
import { OPTION_LETTERS } from '@/lib/questions'
import type { PublicQuestion, RevealInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

type QuestionViewProps = {
  question: PublicQuestion
  reveal: RevealInfo | null
  selected?: number | null
  onSelect?: (choice: number) => void
  disabled?: boolean
  showCounts?: boolean
  large?: boolean
}

export function QuestionView({
  question,
  reveal,
  selected = null,
  onSelect,
  disabled,
  showCounts,
  large,
}: QuestionViewProps) {
  const totalVotes = reveal ? reveal.counts.reduce((a, b) => a + b, 0) : 0

  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className={cn('text-balance text-center font-bold leading-snug', large ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl')}>
        {question.prompt}
      </h2>

      {question.table && (
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border bg-card">
          <table className={cn('w-full text-center', large ? 'text-lg md:text-xl' : 'text-sm md:text-base')}>
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-semibold">الاسم</th>
                <th scope="col" className="px-3 py-1.5 font-semibold">القسم</th>
                <th scope="col" className="px-3 py-1.5 font-semibold">الدرجة</th>
              </tr>
            </thead>
            <tbody>
              {question.table.map((row) => (
                <tr key={row.join('-')} className="border-t">
                  {row.map((cell, i) => (
                    <td key={i} className="px-3 py-1.5 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrect = reveal?.correct === i
          const isSelected = selected === i
          const isWrongPick = reveal && isSelected && !isCorrect
          const interactive = !!onSelect && !disabled && !reveal

          return (
            <li key={i}>
              <button
                type="button"
                onClick={interactive ? () => onSelect?.(i) : undefined}
                disabled={!interactive}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start transition-colors duration-150',
                  large ? 'min-h-20 md:p-4' : 'min-h-16',
                  'bg-card disabled:cursor-default',
                  interactive && 'hover:border-primary/60 active:scale-[0.99]',
                  isSelected && !reveal && 'border-primary bg-primary/15',
                  !isSelected && !reveal && 'border-transparent',
                  reveal && isCorrect && 'border-success bg-success/20',
                  isWrongPick && 'border-destructive bg-destructive/20',
                  reveal && !isCorrect && !isWrongPick && 'border-transparent opacity-50',
                  !reveal && disabled && !isSelected && 'opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-black',
                    reveal && isCorrect
                      ? 'bg-success text-success-foreground'
                      : isWrongPick
                        ? 'bg-destructive text-foreground'
                        : isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground',
                  )}
                  aria-hidden="true"
                >
                  {reveal && isCorrect ? <Check className="size-5" /> : isWrongPick ? <X className="size-5" /> : OPTION_LETTERS[i]}
                </span>
                <span className={cn('flex-1 font-semibold leading-snug', large ? 'text-lg md:text-2xl' : 'text-base md:text-lg')}>
                  <span className="sr-only">{`الخيار ${OPTION_LETTERS[i]}: `}</span>
                  {option}
                </span>
                {reveal && showCounts && (
                  <span className="shrink-0 rounded-lg bg-secondary px-2 py-1 text-sm font-bold tabular-nums">
                    {reveal.counts[i]}
                    <span className="sr-only"> إجابات</span>
                    {totalVotes > 0 && (
                      <span className="ms-1 text-muted-foreground">
                        {`(${Math.round((reveal.counts[i] / totalVotes) * 100)}%)`}
                      </span>
                    )}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {reveal && (
        <p
          className={cn(
            'rounded-2xl border border-success/40 bg-success/10 p-3 text-center font-medium text-pretty animate-in fade-in duration-300',
            large ? 'text-lg md:text-2xl' : 'text-base',
          )}
          role="status"
        >
          {reveal.explanation}
        </p>
      )}
    </div>
  )
}
