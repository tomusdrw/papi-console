import { withSubscribe } from "@/components/withSuspense"
import { blocksByHeight$ } from "./block.state"
import { BlockTable } from "./BlockTable"
import { Summary } from "./Summary"

const explorer$ = blocksByHeight$

export const Explorer = withSubscribe(
  () => (
    <div className="overflow-auto">
      <Summary />
      <BlockTable />
    </div>
  ),
  {
    source$: explorer$,
  },
)
