import {
  BinaryFileInput,
  checkEqualInputBinary,
} from "@/components/BinaryInput"
import { Modal } from "@/components/Modal"
import { useGenericSynchronizeInput } from "@/components/useSynchroniseInput"
import { NOTIN } from "@codec-components"
import { Binary } from "@polkadot-api/substrate-bindings"
import { Download, FileUp } from "lucide-react"
import { FC, useState } from "react"
import { twMerge } from "tailwind-merge"
import { BinaryStatus } from "@/codec-components/EditCodec/Tree/codec-components"
// @ts-expect-error save-as typings not available
import { saveAs } from "save-as"

// TODO refactor this out into a component not tied to `Extrinsics`
// if possible, make it the edit button itself, internally handling the `open/close` state of the modal.
export const BinaryEditModal: FC<{
  status: BinaryStatus
  open: boolean
  path: string
  onClose: () => void
}> = ({ status, path, open, onClose }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Edit Binary"
    className="gap-2 text-xs min-w-96 max-w-xl"
  >
    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
      {path}
    </span>
    <BinaryEditModalContent path={path} status={status} onClose={onClose} />
  </Modal>
)

const MAX_DISPLAY_SIZE = 5 * 1024 * 1024
const BinaryEditModalContent: FC<{
  path: string
  status: BinaryStatus
  onClose: () => void
}> = ({ path, status, onClose }) => {
  const [value, setValue] = useState(status.encodedValue ?? new Uint8Array())
  const [error, setError] = useState("")
  const [inputValue, setInputValue] = useGenericSynchronizeInput(
    value,
    setValue as any,
    (input) => parseInput(input).asBytes(),
    "" as string | Uint8Array,
    (value) => {
      if (value.length > MAX_DISPLAY_SIZE) return ""
      return Binary.fromBytes(value).asHex()
    },
    (input, value) =>
      checkEqualInputBinary(
        parseInput(input),
        value === NOTIN ? NOTIN : Binary.fromBytes(value),
      ),
  )

  const placeholder =
    value.length > MAX_DISPLAY_SIZE ? "(value is too long to display)" : ""
  const isValid = status.decode(value) !== NOTIN
  const textareaValue = inputValue instanceof Uint8Array ? "" : inputValue

  const submit = () => {
    if (status.decode(value) !== NOTIN) {
      status.onValueChanged(status.decode(value))
      onClose()
    } else {
      // Shouldn't happen, but it's better than just swallowing that it failed.
      setError("Couldn't set the binary data 😢")
    }
  }

  const validateFile = (file: File) => {
    if (file.size > 512 * 1024 * 1024) {
      setError("File size can't exceed 512MB")
      return false
    }
    return true
  }

  const downloadDisabled = value.length === 0
  const download = () => {
    saveAs(
      new Blob([value], {
        type: "application/octet-stream",
      }),
      `${path.replace(/\./g, "__") || "root"}.dat`,
    )
  }

  return (
    <>
      <div className="flex gap-4 text-white">
        <div className="flex-1 flex gap-2">
          <button
            disabled={downloadDisabled}
            className={twMerge(
              "flex items-center gap-1 hover:text-polkadot-300",
              downloadDisabled && "opacity-50 pointer-events-none",
            )}
            onClick={download}
          >
            <Download size={16} />
            Download
          </button>
        </div>
        <div>
          <label className="flex items-center gap-1 hover:text-polkadot-300 cursor-pointer">
            Load file
            <FileUp size={16} />
            <BinaryFileInput
              validate={validateFile}
              onError={() => setError("Error loading file")}
              onLoaded={(value) => setValue(value.asBytes())}
            />
          </label>
        </div>
      </div>
      <div>
        <div className="text-slate-400">Hex data</div>
        <textarea
          className={twMerge(
            "bg-white rounded w-full min-h-20 text-slate-950 p-1 tabular-nums border-2 border-transparent",
            !isValid && "border-red-600 outline-none",
          )}
          value={textareaValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      <button
        className={twMerge(
          "border rounded p-1 text-white",
          !isValid && "opacity-50",
        )}
        onClick={submit}
      >
        OK
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </>
  )
}

const parseInput = (value: string | Uint8Array) =>
  value instanceof Uint8Array
    ? Binary.fromBytes(value)
    : Binary.fromHex(value.startsWith("0x") ? value : `0x${value}`)
