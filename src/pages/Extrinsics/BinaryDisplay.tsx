import { CopyText } from "@/components/Copy"
import { BinaryEdit } from "@/components/Icons"
import { NOTIN } from "@codec-components"
import { Binary, HexString } from "@polkadot-api/substrate-bindings"
import { FC, useState } from "react"
import { twMerge } from "tailwind-merge"
import { BinaryEditModal } from "./BinaryEditModal"

const DISPLAY_MAX_LEN = 1024
const COPY_MAX_LEN = 5 * 1024 * 1024
export const BinaryDisplay: FC<{
  value: Uint8Array | HexString | null
  isEmpty: boolean
  onValueChanged: (value: any | NOTIN) => boolean
  decode: (value: Uint8Array | HexString) => any | NOTIN
}> = ({ value, isEmpty, onValueChanged, decode }) => {
  const [binaryOpen, setBinaryOpen] = useState(false)

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
    <div className="px-2 w-full">
      <div className="px-3 py-2 gap-2 rounded flex flex-row items-center bg-polkadot-800">
        <CopyText text={hex ?? ""} disabled={copyDisabled} />
        <div className="text-sm tabular-nums max-h-12 overflow-hidden whitespace-nowrap text-ellipsis flex-1">
          {hex ? (
            hex.slice(0, displayLength) + (exceedsDisplayLength ? "…" : "")
          ) : (
            <div className="flex flex-row items-center gap-1 text-slate-400">
              {isEmpty
                ? "Start by filling out your extrinsic, or enter a binary using the edit binary button at the end of this line."
                : "Cannot display hex. Complete the required values."}
            </div>
          )}
        </div>
        <BinaryEdit
          size={24}
          className={twMerge("cursor-pointer hover:text-polkadot-300")}
          onClick={() => setBinaryOpen(true)}
        />
        <BinaryEditModal
          status={{
            encodedValue:
              typeof value === "string"
                ? Binary.fromHex(value).asBytes()
                : (value ?? undefined),
            onValueChanged,
            decode,
            type: "complete",
          }}
          open={binaryOpen}
          path=""
          onClose={() => setBinaryOpen(false)}
        />
      </div>
    </div>
  )
}
