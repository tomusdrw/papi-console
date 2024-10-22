import { FC, useEffect, useRef, useState } from "react"
import { metadata, Binary, HexString } from "@polkadot-api/substrate-bindings"
import { EditCodec } from "./EditCodec"
import { TreeCodec } from "./EditCodec/Tree/index"
import {
  CodecComponentValue,
  CodecComponentType,
  CodecComponentUpdate,
  MetadataType,
} from "@codec-components"
import { SubtreeFocus } from "./common/SubtreeFocus"
import { Circle } from "lucide-react"
import { synchronizeScroll } from "./common/scroll"
import { MarkersContextProvider, VisibleWindow } from "./common/Markers"
import { CopyText } from "@/components/Copy"
import { FocusPath } from "./FocusPath"

export const EditMode: React.FC<{
  codecType: number
  metadata: MetadataType
  initialValue?: HexString
}> = ({ codecType, initialValue, metadata: metadataDecoded }) => {
  const treeRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!listRef.current || !treeRef.current) return
    return synchronizeScroll(listRef.current, treeRef.current)
  }, [])

  // interior X1 AccountId doesn't mark as valid??

  const [innerValue, setInnerValue] = useState<CodecComponentValue>({
    type: CodecComponentType.Initial,
    value: initialValue,
  })
  const [focusingSubtree, setFocusingSubtree] = useState<string[] | null>(null)

  const props = {
    metadata: metadataDecoded as any,
    codecType: codecType,
    value: innerValue,
    onUpdate: (value: CodecComponentUpdate) => {
      setInnerValue({ type: CodecComponentType.Updated, value })
    },
  }

  useEffect(() => {
    setInnerValue({
      type: CodecComponentType.Initial,
      value: initialValue,
    })
  }, [metadata, codecType])

  return (
    <div className="flex flex-col items-start w-full max-w-screen-lg text-polkadot-100 overflow-hidden bg-polkadot-900">
      <BinaryDisplay
        value={
          (innerValue.type === CodecComponentType.Initial
            ? innerValue.value
            : innerValue.value.empty
              ? null
              : innerValue.value.encoded) ?? null
        }
      />
      <FocusPath
        metadata={metadataDecoded as any}
        typeId={codecType}
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
                {!innerValue.value ? (
                  <div className="h-14 ml-5 text-sm flex flex-col justify-center">
                    {"Start by choosing a value -->"}
                  </div>
                ) : (
                  <TreeCodec {...props} />
                )}
                <VisibleWindow />
              </div>
            </div>
            <div className="flex-1">
              <div className="p-2 rounded bg-[#041424]">
                <EditCodec {...props} />
              </div>
            </div>
          </div>
        </MarkersContextProvider>
      </SubtreeFocus>
    </div>
  )
}

const DISPLAY_MAX_LEN = 1024
const COPY_MAX_LEN = 5 * 1024 * 1024
const BinaryDisplay: FC<{ value: Uint8Array | HexString | null }> = ({
  value,
}) => {
  const displayLength = DISPLAY_MAX_LEN * 2 + 2

  const copyLength = COPY_MAX_LEN * 2 + 2
  const hex = value
    ? typeof value === "string"
      ? value.slice(0, copyLength)
      : Binary.fromBytes(value.slice(0, COPY_MAX_LEN)).asHex()
    : null
  const exceedsDisplayLength = hex && hex.length > displayLength
  const exceedsCopyLength = !!hex && hex.length >= COPY_MAX_LEN * 2 + 2

  const copyDisabled = hex === null || exceedsCopyLength

  return (
    <div className="p-2 w-full">
      <div className="px-3 py-2 gap-2 rounded flex flex-row items-center bg-polkadot-800">
        <CopyText text={hex ?? ""} disabled={copyDisabled} />
        <div className="text-sm tabular-nums max-h-12 overflow-hidden whitespace-nowrap text-ellipsis">
          {hex ? (
            hex.slice(0, displayLength) + (exceedsDisplayLength ? "…" : "")
          ) : (
            <div className="flex flex-row items-center gap-1">
              <span>Cannot display hex. Complete required values shown by</span>{" "}
              <Circle size={8} strokeWidth={4} className="text-red-600" />
              (incomplete), or
              <Circle size={8} strokeWidth={4} className="text-orange-600" />
              (partially incomplete)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
