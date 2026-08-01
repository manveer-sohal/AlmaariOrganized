import type { ReactNode } from "react";

type BuilderSectionHeaderProps = {
  step?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function BuilderSectionHeader({
  step,
  title,
  description,
  action,
}: BuilderSectionHeaderProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {step ? (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 px-1.5 text-[11px] font-semibold tabular-nums text-indigo-700">
              {step}
            </span>
          ) : null}
          <h3 className="truncate text-base font-semibold text-indigo-900 sm:text-lg">
            {title}
          </h3>
        </div>
        {description ? (
          <p className="mt-1 text-xs text-indigo-700/75 sm:text-[13px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
