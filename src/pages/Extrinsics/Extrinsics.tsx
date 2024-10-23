import { metadata$ } from "@/chain.state"
import { ActionButton } from "@/components/ActionButton"
import { ButtonGroup } from "@/components/ButtonGroup"
import { withSubscribe } from "@/components/withSuspense"
import {
  CodecComponentType,
  CodecComponentValue,
  NOTIN,
} from "@codec-components"
import { getDynamicBuilder, getLookupFn } from "@polkadot-api/metadata-builders"
import { Binary } from "@polkadot-api/substrate-bindings"
import { state, useStateObservable } from "@react-rxjs/core"
import { useState } from "react"
import { map } from "rxjs"
import { BinaryDisplay } from "./BinaryDisplay"
import { EditMode } from "./EditMode"
import { JsonMode } from "./JsonMode"

const extrinsicProps$ = state(
  metadata$.pipe(
    map((metadata) => ({
      metadata,
      codecType:
        "call" in metadata.extrinsic
          ? metadata.extrinsic.call
          : // TODO v14 is this one?
            metadata.extrinsic.type,
    })),
  ),
)
const extrinsicDecoder = extrinsicProps$.pipeState(
  map(
    ({ metadata, codecType }) =>
      getDynamicBuilder(getLookupFn(metadata)).buildDefinition(codecType).dec,
  ),
)

export const Extrinsics = withSubscribe(() => {
  const [viewMode, setViewMode] = useState<"edit" | "json">("edit")
  const extrinsicProps = useStateObservable(extrinsicProps$)
  const decoder = useStateObservable(extrinsicDecoder)

  const [componentValue, setComponentValue] = useState<CodecComponentValue>({
    type: CodecComponentType.Initial,
    value:
      "0x630b040101010031323334353637383934353631363531363531363531363531363531353631350100000108000100002c00000000080000000000",
  })
  const binaryValue =
    (componentValue.type === CodecComponentType.Initial
      ? componentValue.value
      : componentValue.value.empty
        ? null
        : componentValue.value.encoded) ?? null

  return (
    <div className="flex flex-col overflow-hidden gap-2">
      <div>Extrinsics</div>

      <BinaryDisplay
        value={binaryValue}
        isEmpty={
          componentValue.type === CodecComponentType.Initial &&
          componentValue.value == null
        }
        decode={(value) => {
          try {
            return decoder(value)
          } catch (_) {
            return NOTIN
          }
        }}
        onValueChanged={(decoded) => {
          setComponentValue({
            type: CodecComponentType.Updated,
            value: { empty: false, decoded },
          })
          return true
        }}
      />

      <div className="flex flex-row justify-between px-2">
        <ButtonGroup
          value={viewMode}
          onValueChange={setViewMode as any}
          items={[
            {
              value: "edit",
              content: "Edit",
            },
            {
              value: "json",
              content: "JSON",
              disabled: !binaryValue,
            },
          ]}
        />
        <ActionButton disabled>Submit extrinsic</ActionButton>
      </div>

      {viewMode === "edit" ? (
        <EditMode
          {...extrinsicProps}
          value={componentValue}
          onUpdate={(value) =>
            setComponentValue({ type: CodecComponentType.Updated, value })
          }
        />
      ) : (
        <JsonMode
          value={
            typeof binaryValue === "string"
              ? Binary.fromHex(binaryValue).asBytes()
              : binaryValue
          }
          decode={decoder}
        />
      )}
    </div>
  )
})
