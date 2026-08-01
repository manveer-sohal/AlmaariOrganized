"use client";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton-block rounded-almaari ${className}`}
      aria-hidden
    />
  );
}

export default function HomeHubSkeleton() {
  return (
    <div
      className="box-border w-full max-w-full min-w-0 overflow-x-hidden px-3 pt-3 pb-nav sm:mx-auto sm:max-w-3xl sm:px-4 sm:pt-4 md:pb-8"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:gap-5">
        <header className="flex w-full min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-52 max-w-full sm:h-8" />
          </div>
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
        </header>

        <SkeletonBlock className="h-11 w-full rounded-almaari-lg" />

        <SkeletonBlock className="h-52 w-full rounded-almaari-lg sm:h-56" />

        <section aria-hidden className="w-full min-w-0 space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-11 w-full rounded-almaari" />
        </section>

        <section aria-hidden className="w-full min-w-0">
          <div className="mb-1.5 flex w-full items-center justify-between gap-2">
            <SkeletonBlock className="h-3 w-14" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
          <div className="flex w-full gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock
                key={i}
                className="h-20 w-[4.5rem] shrink-0"
              />
            ))}
          </div>
        </section>

        <SkeletonBlock className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}
