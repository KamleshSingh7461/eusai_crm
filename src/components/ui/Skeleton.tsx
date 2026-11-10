import { cn } from "@/lib/utils"

/** Shimmering placeholder block while data loads. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-white/[0.04]",
                "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]  before:bg-transparent  ",
                className
            )}
            {...props}
        />
    )
}

export { Skeleton }
