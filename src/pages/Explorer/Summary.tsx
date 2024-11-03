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
    <div className="flex gap-2 items-center p-2">
      <SummaryItem title="Block Time">
        <BlockTime />
      </SummaryItem>
      <div className="flex-1" />
      <SummaryItem
        className="border border-slate-500 rounded p-2"
        title="Finalized"
      >
        {finalized$}
      </SummaryItem>
      <SummaryItem className="border border-slate-500 rounded p-2" title="Best">
        {best$}
      </SummaryItem>
    </div>
  )
}

const SummaryItem: FC<
  PropsWithChildren<{ title: string; className?: string }>
> = ({ title, className, children }) => {
  return (
    <div className={twMerge("flex flex-col items-center", className)}>
      <h3>{title}</h3>
      <div className="tabular-nums text-polkadot-200 text-sm">{children}</div>
    </div>
  )
}
