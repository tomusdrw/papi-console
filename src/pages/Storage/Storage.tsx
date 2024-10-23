import { metadata$ } from "@/chain.state"
import { SearchableSelect } from "@/components/Select"
import { withSubscribe } from "@/components/withSuspense"
import { state, useStateObservable } from "@react-rxjs/core"
import { useState } from "react"
import { map } from "rxjs"

const metadataStorage$ = state(
  metadata$.pipe(
    map((metadata) => ({
      metadata,
      entries: Object.fromEntries(
        metadata.pallets
          .filter((p) => p.storage)
          .map((p) => [
            p.name,
            Object.fromEntries(
              p.storage!.items.map((item) => [item.name, item.type]),
            ),
          ]),
      ),
    })),
  ),
)

export const Storage = withSubscribe(() => {
  const { metadata, entries } = useStateObservable(metadataStorage$)
  const [pallet, setPallet] = useState<string | null>(null)
  const [entry, setEntry] = useState<string | null>(null)

  const selectedPallet =
    (pallet && metadata.pallets.find((p) => p.name === pallet)) || null
  const selectedEntry =
    (
      (entry &&
        selectedPallet?.storage?.items.find((it) => it.name === entry)) ||
      null
    )?.type || null

  return (
    <div>
      <div className="flex items-center gap-2">
        <label>
          Pallet
          <SearchableSelect
            value={pallet}
            setValue={(v) => setPallet(v)}
            options={Object.keys(entries).map((e) => ({
              text: e,
              value: e,
            }))}
          />
        </label>
        {selectedPallet && pallet && (
          <label>
            Entry
            <SearchableSelect
              value={entry}
              setValue={(v) => setEntry(v)}
              options={
                Object.keys(entries[pallet]).map((s) => ({
                  text: s,
                  value: s,
                })) ?? []
              }
            />
          </label>
        )}
      </div>
      {selectedEntry ? <div>TODO</div> : null}
    </div>
  )
})
