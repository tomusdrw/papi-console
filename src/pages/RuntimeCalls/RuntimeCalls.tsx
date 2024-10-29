import { lookup$ } from "@/chain.state"
import { SearchableSelect } from "@/components/Select"
import { withSubscribe } from "@/components/withSuspense"
import { state, useStateObservable } from "@react-rxjs/core"
import { useEffect, useState } from "react"
import { map } from "rxjs"
import { RuntimeCallQuery } from "./RuntimeCallQuery"
import { selectedEntry$, setSelectedMethod } from "./runtimeCalls.state"
import { RuntimeCallResults } from "./RuntimeCallResults"

const metadataRuntimeCalls$ = state(
  lookup$.pipe(
    map((lookup) => ({
      lookup,
      entries: Object.fromEntries(
        lookup.metadata.apis.map((p) => [
          p.name,
          Object.fromEntries(p.methods.map((method) => [method.name, method])),
        ]),
      ),
    })),
  ),
)

export const RuntimeCalls = withSubscribe(() => {
  const { lookup, entries } = useStateObservable(metadataRuntimeCalls$)
  const [api, setApi] = useState<string | null>("Core")
  const [method, setMethod] = useState<string | null>("Version")
  const entry = useStateObservable(selectedEntry$)

  const selectedApi =
    (api && lookup.metadata.apis.find((p) => p.name === api)) || null

  useEffect(
    () =>
      setMethod((prev) => {
        if (!selectedApi?.methods[0]) return null
        return selectedApi.methods.some((v) => v.name === prev)
          ? prev
          : selectedApi.methods[0].name
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedApi?.name],
  )

  useEffect(() => {
    const selectedMethod =
      (method && selectedApi?.methods.find((it) => it.name === method)) || null
    setSelectedMethod(
      selectedMethod ? { ...selectedMethod, api: selectedApi!.name } : null,
    )
  }, [selectedApi, method])

  return (
    <div className="p-2 flex flex-col gap-2 items-start">
      <div className="flex items-center gap-2">
        <label>
          API
          <SearchableSelect
            value={api}
            setValue={(v) => setApi(v)}
            options={Object.keys(entries).map((e) => ({
              text: e,
              value: e,
            }))}
          />
        </label>
        {selectedApi && api && (
          <label>
            Method
            <SearchableSelect
              value={method}
              setValue={(v) => setMethod(v)}
              options={
                Object.keys(entries[api]).map((s) => ({
                  text: s,
                  value: s,
                })) ?? []
              }
            />
          </label>
        )}
      </div>
      {entry?.docs.length && (
        <div className="w-full">
          Docs
          <div className="text-sm text-slate-400 max-h-20 overflow-auto">
            {entry.docs.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
          </div>
        </div>
      )}
      <RuntimeCallQuery />
      <RuntimeCallResults />
    </div>
  )
})
