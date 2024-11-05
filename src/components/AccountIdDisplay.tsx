import { PolkadotIdenticon } from "@/components/PolkadotIdenticon"
import { accountDetail$, getPublicKey } from "@/extension-accounts.state"
import { identity$, isVerified } from "@/identity.state"
import { useStateObservable } from "@react-rxjs/core"
import { CheckCircle } from "lucide-react"
import { SS58String } from "polkadot-api"
import { FC } from "react"
import { twMerge } from "tailwind-merge"

export const AccountIdDisplay: FC<{
  value: SS58String
  className?: string
}> = ({ value, className }) => {
  const details = useStateObservable(accountDetail$(value))
  const identity = useStateObservable(identity$(value))

  const name = identity?.displayName ?? details?.name

  return (
    <div className={twMerge("flex items-center gap-2", className)}>
      <PolkadotIdenticon
        className="flex-shrink-0"
        publicKey={getPublicKey(value)}
        size={32}
      />
      <div className="flex flex-col justify-center text-white leading-tight overflow-hidden">
        {name && (
          <span className="inline-flex items-center gap-1">
            {name}
            {isVerified(identity) && (
              <CheckCircle size={16} className="text-green-400" />
            )}
          </span>
        )}
        <span className="text-slate-300 text-ellipsis overflow-hidden">
          {value}
        </span>
      </div>
    </div>
  )
}
