import { JamBinaryViewCodec } from "@/jam-codec-components/BinaryViewCodec"
import { CopyText } from "@/components/Copy"
import { ExpandBtn } from "@/components/Expand"
import { CodecComponentType, NOTIN } from "@polkadot-api/react-builder"
import { Binary, HexString } from "@polkadot-api/substrate-bindings"
import { toHex } from "@polkadot-api/utils"
import { ComponentProps, FC, useMemo, useState } from "react"
import { twMerge } from "tailwind-merge"
import { JamEditCodec } from "../EditCodec"
import "@/codec-components/LookupTypeEdit/binaryDisplay.css"

export const JamBinaryDisplay: FC<
  ComponentProps<typeof JamEditCodec> & {
    codec: {
      enc: (value: any | NOTIN) => Uint8Array
      dec: (value: Uint8Array | HexString) => any | NOTIN
    }
    className?: string
  }
  > = ({ entry, dynCodecs, value, className }) => {
  const [wrap, setWrap] = useState(false)
  const encoded = useMemo(() => {
    if (value.type === CodecComponentType.Initial) {
      if (!value.value) return null
      return typeof value.value === "string"
        ? Binary.fromHex(value.value).asBytes()
        : value.value
    }
    if (value.value.empty || !value.value.encoded) return null
    return value.value.encoded
  }, [value]);
  const hex = encoded ? toHex(encoded) : null
  const isEmpty =
    (value.type === CodecComponentType.Initial && !value.value) ||
    (value.type === CodecComponentType.Updated && value.value.empty)

  return (
    <div className={twMerge("px-2 w-full", className)}>
      <div className="px-3 py-2 gap-2 flex flex-row border-border border items-start">
        <CopyText text={hex ?? ""} disabled={!hex} className="h-5" />
        <div
          className={twMerge(
            "binary-display-codec",
            "text-sm tabular-nums overflow-hidden flex-1",
            wrap ? "break-words" : "break-words text-ellipsis overflow-auto h-20",
          )}
        >
          {isEmpty ? (
            <div className="flex flex-row items-center gap-1 text-slate-400">
              Start by filling out the value, or enter a binary using the edit
              binary button at the end of this line.
            </div>
          ) : (
            <>
              0x
              <JamBinaryViewCodec
                dynCodecs={dynCodecs}
                entry={entry}
                value={value}
                onUpdate={() => {}}
              />
            </>
          )}
        </div>
        <div className="flex gap-2 items-center h-5">
          <ExpandBtn
            expanded={wrap}
            direction="vertical"
            className={twMerge(
              "cursor-pointer",
              isEmpty && "opacity-50 pointer-events-none",
            )}
            onClick={() => setWrap((v) => !v)}
          />
        </div>
      </div>
    </div>
  )
}
