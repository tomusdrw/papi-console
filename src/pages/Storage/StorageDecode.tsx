import { ActionButton } from "@/components/ActionButton"
import { NOTIN } from "@codec-components"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { FC } from "react"
import { combineLatest, firstValueFrom, map, of } from "rxjs"
import { addStorageSubscription, selectedEntry$ } from "./storage.state"
import { lookup$ } from "@/chain.state"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"

const [valueChange, setValue] = createSignal<string>()
const value$ = state(valueChange, "")

const valueDecoder$ = combineLatest([selectedEntry$, lookup$]).pipe(
  map(([selectedEntry, lookup]) =>
    selectedEntry
      ? getDynamicBuilder(lookup).buildDefinition(selectedEntry.value).dec
      : null,
  ),
)
const decodedValue$ = state(
  combineLatest([value$, valueDecoder$]).pipe(
    map(([value, decoder]) => {
      if (!decoder) return NOTIN
      try {
        return decoder(value)
      } catch (_) {
        return NOTIN
      }
    }),
  ),
  NOTIN,
)

export const StorageDecode: FC = () => {
  const value = useStateObservable(value$)
  const decoded = useStateObservable(decodedValue$)

  const submit = async () => {
    const entry = await firstValueFrom(selectedEntry$)
    const stream = of(decoded)

    addStorageSubscription({
      name: `${entry!.pallet}.${entry!.entry}(…)`,
      single: true,
      stream,
      type: entry!.value,
    })
  }

  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-polkadot-100 p-2 rounded tabular-nums text-polkadot-800"
        placeholder="Enter hex …"
      />
      <ActionButton disabled={decoded === NOTIN} onClick={submit}>
        Decode
      </ActionButton>
    </div>
  )
}
