import { bytesToString } from "@/components/BinaryInput"
import { ViewBytes } from "@codec-components"
import { useReportBinary } from "./CopyBinary"

export const CBytes: ViewBytes = ({ value, encodedValue }) => {
  useReportBinary(encodedValue)

  return (
    <div className="min-w-80 border-none p-0 outline-none bg-transparent flex-1">
      {bytesToString(value)}
    </div>
  )
}
