import { chainHead$ } from "@/chain.state"
import { FC, PropsWithChildren } from "react"
import { map, switchMap } from "rxjs"
import { twMerge } from "tailwind-merge"
import { BlockTime } from "./BlockTime"

const finalized$ = chainHead$.pipeState(
  switchMap((chainHead) => chainHead.finalized$),
  map((v) => v.number.toLocaleString()),
)
const best$ = chainHead$.pipeState(
  switchMap((chainHead) => chainHead.best$),
  map((v) => v.number.toLocaleString()),
)

export const Summary: FC = () => {
  return (
    <div className="flex gap-4 items-center py-2">
      <SummaryItem title="Block Time" className="bg-card/0 border-none">
        <BlockTime />
      </SummaryItem>
      <div className="flex-1" />
      <SummaryItem title="Finalized">{finalized$}</SummaryItem>
      <SummaryItem title="Best">{best$}</SummaryItem>
    </div>
  )
}

const SummaryItem: FC<
  PropsWithChildren<{ title: string; className?: string }>
> = ({ title, className, children }) => {
  return (
    <div
      className={twMerge(
        "flex flex-col items-center border rounded bg-card text-card-foreground px-3 py-2",
        className,
      )}
    >
      <h3>{title}</h3>
      <div className="tabular-nums text-sm text-card-foreground/80">
        {children}
      </div>
    </div>
  )
}
