import { lookup$ } from "@/chain.state"
import { ButtonGroup } from "@/components/ButtonGroup"
import { SearchableSelect } from "@/components/Select"
import { withSubscribe } from "@/components/withSuspense"
import { state, useStateObservable } from "@react-rxjs/core"
import { FC, useEffect, useState } from "react"
import { map } from "rxjs"
import { selectedEntry$, setSelectedEntry } from "./storage.state"
import { StorageDecode } from "./StorageDecode"
import { StorageQuery } from "./StorageQuery"
import { StorageSubscriptions } from "./StorageSubscriptions"

const metadataStorage$ = state(
  lookup$.pipe(
    map((lookup) => ({
      lookup,
      entries: Object.fromEntries(
        lookup.metadata.pallets
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
  const { lookup, entries } = useStateObservable(metadataStorage$)
  const [pallet, setPallet] = useState<string | null>("Staking")
  const [entry, setEntry] = useState<string | null>("ErasStakersPaged")

  const selectedPallet =
    (pallet && lookup.metadata.pallets.find((p) => p.name === pallet)) || null

  useEffect(
    () =>
      setEntry((prev) => {
        if (!selectedPallet?.storage?.items[0]) return null
        return selectedPallet.storage.items.some((v) => v.name === prev)
          ? prev
          : selectedPallet.storage.items[0].name
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPallet?.name],
  )

  useEffect(() => {
    const storageEntry = (
      (entry &&
        selectedPallet?.storage?.items.find((it) => it.name === entry)) ||
      null
    )?.type
    if (!storageEntry) {
      return setSelectedEntry(null)
    }

    if (storageEntry.tag === "plain") {
      return setSelectedEntry({
        value: storageEntry.value,
        key: [],
        pallet: pallet!,
        entry: entry!,
      })
    }
    if (storageEntry.value.hashers.length === 1) {
      return setSelectedEntry({
        value: storageEntry.value.value,
        key: [storageEntry.value.key],
        pallet: pallet!,
        entry: entry!,
      })
    }

    const keyDef = lookup(storageEntry.value.key)
    const key = (() => {
      if (keyDef.type === "array") {
        return new Array(keyDef.len).fill(keyDef.value.id)
      }
      if (keyDef.type === "tuple") {
        return keyDef.value.map((e) => e.id)
      }
      throw new Error("Invalid key type " + keyDef.type)
    })()
    setSelectedEntry({
      key,
      value: storageEntry.value.value,
      pallet: pallet!,
      entry: entry!,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPallet, entry])

  return (
    <div className="p-2 flex flex-col gap-2 items-start">
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
      <StorageEntry />
      <StorageSubscriptions />
    </div>
  )
})

const StorageEntry: FC = () => {
  const selectedEntry = useStateObservable(selectedEntry$)
  const [mode, setMode] = useState<"query" | "decode">("query")

  if (!selectedEntry) return null

  return (
    <>
      <ButtonGroup
        value={mode}
        onValueChange={setMode as any}
        items={[
          {
            value: "query",
            content: "Query",
          },
          {
            value: "decode",
            content: "Decode",
          },
        ]}
      />
      {mode === "query" ? <StorageQuery /> : <StorageDecode />}
    </>
  )
}
