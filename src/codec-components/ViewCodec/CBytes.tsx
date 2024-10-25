import { bytesToString } from "@/components/BinaryInput"
import { ViewBytes } from "@codec-components"

export const CBytes: ViewBytes = ({ value }) => (
  <div className="min-w-80 border-none p-0 outline-none bg-transparent flex-1">
    {bytesToString(value)}
  </div>
)
