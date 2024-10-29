import { lookup$ } from "@/chain.state"
import { SearchableSelect } from "@/components/Select"
import { withSubscribe } from "@/components/withSuspense"
import { state, useStateObservable } from "@react-rxjs/core"
import { FC, useEffect, useState } from "react"
import { map } from "rxjs"
import { DocsRenderer } from "@/components/DocsRenderer"
import { HexString } from "polkadot-api"
import { ButtonGroup } from "@/components/ButtonGroup"
import { ValueDisplay } from "./Storage/StorageSubscriptions"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { getTypeComplexity } from "@/utils/shape"
import { ViewCodec } from "@/codec-components/ViewCodec"
import { CodecComponentType } from "@/lib/codecComponents"

const metadataConstants$ = state(
  lookup$.pipe(
    map((lookup) => ({
      lookup,
      entries: Object.fromEntries(
        lookup.metadata.pallets
          .filter((p) => p.constants.length > 0)
          .map((p) => [
            p.name,
            Object.fromEntries(p.constants.map((ct) => [ct.name, ct])),
          ]),
      ),
    })),
  ),
)

export const Constants = withSubscribe(() => {
  const { lookup, entries } = useStateObservable(metadataConstants$)
  const [pallet, setPallet] = useState<string | null>("System")
  const [constant, setConstant] = useState<string | null>("Version")

  const selectedPallet =
    (pallet && lookup.metadata.pallets.find((p) => p.name === pallet)) || null

  useEffect(
    () =>
      setConstant((prev) => {
        if (!selectedPallet?.constants[0]) return null
        return selectedPallet.constants.some((v) => v.name === prev)
          ? prev
          : selectedPallet.constants[0].name
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPallet?.name],
  )

  const selectedConstant =
    (constant &&
      selectedPallet?.constants.find((it) => it.name === constant)) ||
    null

  return (
    <div className="p-2 flex flex-col gap-2 items-start overflow-hidden">
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
            Constant
            <SearchableSelect
              value={constant}
              setValue={(v) => setConstant(v)}
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
      {selectedConstant?.docs.length && (
        <div className="w-full">
          Docs
          <DocsRenderer docs={selectedConstant.docs} className="max-h-none" />
        </div>
      )}
      {selectedConstant && (
        <ConstantValue
          title={`${pallet}.${constant}`}
          type={selectedConstant.type}
          value={selectedConstant.value}
        />
      )}
    </div>
  )
})

const constantValueProps$ = state(
  lookup$.pipe(
    map((lookup) => ({ lookup, builder: getDynamicBuilder(lookup) })),
  ),
  null,
)

const ConstantValue: FC<{ title: string; type: number; value: HexString }> = ({
  title,
  type,
  value,
}) => {
  const props = useStateObservable(constantValueProps$)
  const [mode, setMode] = useState<"json" | "decoded">("decoded")

  if (!props) return null

  const decoded = props.builder.buildDefinition(type).dec(value)
  const complexity = getTypeComplexity(props.lookup(type), true)

  if (complexity === "inline") {
    return (
      <div className="flex items-center gap-2">
        Value:
        <ViewCodec
          codecType={type}
          value={{
            type: CodecComponentType.Initial,
            value: value,
          }}
          metadata={props.lookup.metadata}
        />
      </div>
    )
  }

  return (
    <div className="px-2 flex flex-col gap-2 items-start overflow-hidden w-full">
      <ButtonGroup
        value={mode}
        onValueChange={setMode as any}
        items={[
          {
            value: "decoded",
            content: "Decoded",
          },
          {
            value: "json",
            content: "JSON",
          },
        ]}
      />
      <div className="overflow-auto w-full">
        <ValueDisplay mode={mode} type={type} value={decoded} title={title} />
      </div>
    </div>
  )
}
