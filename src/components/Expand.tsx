import { FC } from "react"
import { ChevronRight } from "lucide-react"
import { twMerge as clsx } from "tailwind-merge"

export const ExpandBtn: FC<{
  expanded: boolean
}> = ({ expanded }) => (
  <ChevronRight
    size={16}
    className={clsx("transition-transform mt-[1px]", expanded && "rotate-90")}
  />
)
