export function GameTitle({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  return (
    <h1
      className={
        size === 'lg'
          ? 'text-balance text-center text-5xl font-black tracking-tight md:text-7xl'
          : 'text-xl font-black md:text-2xl'
      }
    >
      <span className="text-primary">اكتشف</span> الخطأ
    </h1>
  )
}

export function QuestionCounter({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-lg font-black tabular-nums md:text-xl" aria-label={`السؤال ${index + 1} من ${total}`}>
        {`${index + 1}/${total}`}
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i <= index ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
      </div>
    </div>
  )
}
