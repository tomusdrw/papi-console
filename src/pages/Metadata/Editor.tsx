import { lookup$ } from "@/state/chains/chain.state"
import { LookupTypeEdit } from "@/codec-components/LookupTypeEdit"
import { getTypeComplexity } from "@/utils/shape"
import { state, useStateObservable } from "@react-rxjs/core"
import { FC, useState } from "react"

const lookupState$ = state(lookup$, null)
export const Editor: FC<{ id: number }> = ({ id }) => {
  const lookup = useStateObservable(lookupState$)
  const [value, setValue] = useState<Uint8Array | "partial" | null>(null)
  if (!lookup) return null
  const shape = lookup(id)
  const complexity = getTypeComplexity(shape)

  return (
    <LookupTypeEdit
      type={id}
      value={value}
      onValueChange={setValue}
      tree={complexity === "tree"}
    />
  )
}
