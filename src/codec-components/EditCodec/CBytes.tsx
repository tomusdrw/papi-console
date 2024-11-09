import { EditBytes } from "@polkadot-api/react-builder"
import { BinaryInput } from "@/components/BinaryInput"

export const CBytes: EditBytes = ({ value, onValueChanged, len }) => (
  <BinaryInput encodedValue={value} onValueChanged={onValueChanged} len={len} />
)
