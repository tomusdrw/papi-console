import { lookup$ } from "@/chain.state"
import { byteArraysAreEqual } from "@/utils/byteArray"
import { CodecComponentType, CodecComponentValue } from "@codec-components"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { state, useStateObservable } from "@react-rxjs/core"
import { ComponentProps, FC, useEffect, useRef, useState } from "react"
import { map } from "rxjs"
import {
  Marker,
  MarkersContextProvider,
  VisibleWindow,
} from "../common/Markers"
import { synchronizeScroll } from "../common/scroll"
import { SubtreeFocus } from "../common/SubtreeFocus"
import { EditCodec } from "../EditCodec"
import { TreeCodec } from "../EditCodec/Tree"
import { FocusPath } from "./FocusPath"
import { BinaryDisplay } from "./BinaryDisplay"

const editTypeMetadataProps$ = state(
  lookup$.pipe(
    map((lookup) => ({
      metadata: lookup.metadata,
      builder: getDynamicBuilder(lookup),
    })),
  ),
  null,
)

export const LookupTypeEdit: FC<{
  type: number
  value: Uint8Array | "partial" | null
  onValueChange: (value: Uint8Array | "partial" | null) => void
}> = ({ type, value, onValueChange }) => {
  const treeRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [componentValue, setComponentValue] = useState<CodecComponentValue>({
    type: CodecComponentType.Initial,
    value: value instanceof Uint8Array ? value : undefined,
  })
  const [focusingSubtree, setFocusingSubtree] = useState<string[] | null>(null)
  const metadataProps = useStateObservable(editTypeMetadataProps$)
  const codec = metadataProps?.builder.buildDefinition(type)

  useEffect(() => {
    if (!listRef.current || !treeRef.current) return
    return synchronizeScroll(listRef.current, treeRef.current)
  }, [])

  // Synchronize componentValue out to `props.value`
  useEffect(() => {
    if (componentValue.type === CodecComponentType.Initial) return
    if (componentValue.value.empty) {
      if (value) onValueChange(null)
      return
    }
    if (!codec) return
    const encodedValue = (() => {
      if (componentValue.value.encoded) return componentValue.value.encoded
      try {
        return codec.enc(componentValue.value.decoded)
      } catch (_) {
        return null
      }
    })()
    if (!encodedValue) {
      if (value !== "partial") onValueChange("partial")
      return
    }
    if (
      !(value instanceof Uint8Array) ||
      !byteArraysAreEqual(encodedValue, value)
    ) {
      onValueChange(encodedValue)
    }
    return
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentValue])

  // Synchronize `props.value` in to componentValue
  useEffect(() => {
    const currentValue =
      (componentValue.type === CodecComponentType.Initial
        ? componentValue.value
        : componentValue.value.empty
          ? null
          : (componentValue.value.encoded ?? componentValue.value.decoded)) ??
      null

    if (value === null) {
      if (currentValue !== null)
        setComponentValue({
          type: CodecComponentType.Updated,
          value: {
            empty: true,
          },
        })
      return
    }

    if (value === "partial" || !codec) return

    const encodedValue = (() => {
      if (!currentValue) return null
      if (currentValue instanceof Uint8Array) {
        return currentValue
      }
      try {
        return codec.enc(value)
      } catch (_) {
        return null
      }
    })()
    if (!encodedValue || byteArraysAreEqual(encodedValue, value)) {
      const decoded = codec.dec(value)
      setComponentValue({
        type: CodecComponentType.Updated,
        value: {
          empty: false,
          decoded,
          encoded: value,
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (!metadataProps || !codec) return null

  const codecProps: ComponentProps<typeof EditCodec> = {
    codecType: type,
    metadata: metadataProps.metadata,
    value: componentValue,
    onUpdate: (value) =>
      setComponentValue({
        type: CodecComponentType.Updated,
        value,
      }),
  }

  return (
    <div className="flex flex-col items-start overflow-hidden">
      <BinaryDisplay {...codecProps} codec={codec} className="pb-2" />
      <FocusPath
        metadata={metadataProps.metadata}
        typeId={type}
        value={focusingSubtree}
        onFocus={setFocusingSubtree}
      />
      <div className="px-2">
        {/* This element is presentational only: Adds a connecting border between the FocusPath and the tree below */}
        <div className="border-l border-polkadot-700 h-2 max-sm:border-none" />
      </div>
      <SubtreeFocus
        value={{ callback: setFocusingSubtree, path: focusingSubtree }}
      >
        <MarkersContextProvider>
          <div
            ref={listRef}
            className="flex flex-row overflow-auto w-full gap-2"
          >
            <div
              ref={treeRef}
              className="w-96 sticky top-0 pl-2 pb-16 leading-loose overflow-hidden max-sm:hidden"
            >
              <div className="relative">
                <TreeCodec {...codecProps} />
                <VisibleWindow />
              </div>
            </div>
            <div className="flex-1">
              <div className="p-2 rounded bg-polkadot-900">
                <Marker id={[]} />
                <EditCodec {...codecProps} />
              </div>
            </div>
          </div>
        </MarkersContextProvider>
      </SubtreeFocus>
    </div>
  )
}
