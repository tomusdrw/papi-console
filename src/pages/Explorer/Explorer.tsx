import { withSubscribe } from "@/components/withSuspense"
import { blocksByHeight$ } from "./block.state"
import { BlockTable } from "./BlockTable"
import { Summary } from "./Summary"
import { Events } from "./Events"

const explorer$ = blocksByHeight$

export const Explorer = withSubscribe(
  () => (
    <div className="overflow-auto">
      <Summary />
      <div className="flex gap-2 items-start flex-wrap lg:flex-nowrap">
        <BlockTable />
        <Events />
      </div>
    </div>
  ),
  {
    source$: explorer$,
  },
)
