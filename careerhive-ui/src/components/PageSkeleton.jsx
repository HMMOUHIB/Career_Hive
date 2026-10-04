import { Skeleton } from './ui'

/** What a page looks like while its code or data is on the way: the page head, then a block and two columns. */
export function PageSkeleton() {
  return (
    <div className="page page-skeleton" aria-busy="true" aria-label="Loading">
      <Skeleton height={14} className="w-20" />
      <Skeleton height={44} className="w-50" />
      <Skeleton height={220} radius="var(--radius-lg)" />
      <div className="grid-2">
        <Skeleton height={160} radius="var(--radius-lg)" />
        <Skeleton height={160} radius="var(--radius-lg)" />
      </div>
    </div>
  )
}
