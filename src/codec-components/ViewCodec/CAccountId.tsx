import { AccountIdDisplay } from "@/components/AccountIdDisplay"
import { ViewAccountId } from "@polkadot-api/react-builder"
import { useReportBinary } from "./CopyBinary"

export const CAccountId: ViewAccountId = ({ value, encodedValue }) => {
  useReportBinary(encodedValue)

  return <AccountIdDisplay value={value} />
}
