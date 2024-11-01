import { withSubscribe } from "@/components/withSuspense"
import { blocksByHeight$ } from "./block.state"
import { BlockTable } from "./BlockTable"
import { Summary } from "./Summary"
import { Events } from "./Events"
import { Route, Routes } from "react-router-dom"
import { BlockDetail } from "./Detail"

const explorer$ = blocksByHeight$

export const Explorer = withSubscribe(
  () => (
    <Routes>
      <Route path=":hash" element={<BlockDetail />} />
      <Route
        path="*"
        element={
          <div className="overflow-auto">
            <Summary />
            <div className="flex gap-2 items-start flex-wrap lg:flex-nowrap">
              <BlockTable />
              <Events />
            </div>
          </div>
        }
      />
    </Routes>
  ),
  {
    source$: explorer$,
  },
)
