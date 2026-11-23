import { cn } from "@/lib/utils";

export function OrbitLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600 shadow-sm shadow-indigo-500/30 ring-1 ring-white/15",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 text-white"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeOpacity="0.45"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="8.5"
          ry="3.6"
          transform="rotate(-32 12 12)"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        <circle cx="17.6" cy="8.4" r="1.4" fill="currentColor" />
      </svg>
    </div>
  );
}
