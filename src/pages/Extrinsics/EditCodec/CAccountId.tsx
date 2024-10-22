import {
  SS58String,
  getSs58AddressInfo,
} from "@polkadot-api/substrate-bindings"
import { EditAccountId, NOTIN } from "@codec-components"
import { TextInputField } from "./codec-components"
import { useSynchronizeInput } from "@/components/useSynchroniseInput"

export const CAccountId: EditAccountId = ({ value, onValueChanged }) => {
  const [localInput, setLocalInput] = useSynchronizeInput(
    value,
    onValueChanged,
    parseValue,
  )

  const invalid = getValidationError(localInput)
  return (
    <TextInputField
      value={localInput ?? ""}
      className="min-w-96"
      onChange={setLocalInput}
      placeholder="AccountId"
      warn={localInput === ""}
      softError={invalid}
    />
  )
}

const getValidationError = (value: string) => {
  if (value === "") return null
  const info = getSs58AddressInfo(value)
  return info.isValid &&
    (info.publicKey.length === 32 || info.publicKey.length === 32)
    ? null
    : "Invalid address"
}
const parseValue = (value: string): SS58String | NOTIN => {
  if (value.trim() === "") return NOTIN
  if (getValidationError(value)) return NOTIN
  return value
}
