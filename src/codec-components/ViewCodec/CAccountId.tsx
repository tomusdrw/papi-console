import { PolkadotIdenticon } from "@/components/PolkadotIdenticon"
import { ViewAccountId } from "@codec-components"
import { useStateObservable } from "@react-rxjs/core"
import { accountDetail$, getPublicKey } from "../common/accounts.state"

export const CAccountId: ViewAccountId = ({ value }) => {
  const details = useStateObservable(accountDetail$(value))

  return (
    <div>
      <PolkadotIdenticon
        className="flex-shrink-0"
        publicKey={getPublicKey(value)}
        size={32}
      />
      <div className="flex flex-col justify-center text-white leading-tight overflow-hidden">
        {details?.name && <span>{details.name}</span>}
        <span className="text-slate-400 text-ellipsis overflow-hidden">
          {value}
        </span>
      </div>
    </div>
  )
}
