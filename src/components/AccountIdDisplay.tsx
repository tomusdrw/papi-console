import {
  accountDetail$,
  getPublicKey,
} from "@/codec-components/common/accounts.state"
import { PolkadotIdenticon } from "@/components/PolkadotIdenticon"
import { useStateObservable } from "@react-rxjs/core"
import { SS58String } from "polkadot-api"
import { FC } from "react"
import { twMerge } from "tailwind-merge"

export const AccountIdDisplay: FC<{
  value: SS58String
  className?: string
}> = ({ value, className }) => {
  const details = useStateObservable(accountDetail$(value))

  return (
    <div className={twMerge("flex items-center gap-2", className)}>
      <PolkadotIdenticon
        className="flex-shrink-0"
        publicKey={getPublicKey(value)}
        size={32}
      />
      <div className="flex flex-col justify-center text-white leading-tight overflow-hidden">
        {details?.name && <span>{details.name}</span>}
        <span className="text-slate-300 text-ellipsis overflow-hidden">
          {value}
        </span>
      </div>
    </div>
  )
}
