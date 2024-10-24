import { useStateObservable } from "@react-rxjs/core"
import { FC } from "react"
import {
  removeStorageSubscription,
  storageSubscription$,
  storageSubscriptionKeys$,
} from "./storage.state"
import { JsonDisplay } from "@/components/JsonDisplay"
import { Trash2 } from "lucide-react"

export const StorageSubscriptions: FC = () => {
  const keys = useStateObservable(storageSubscriptionKeys$)

  if (!keys.length) return null

  return (
    <div className="p-2 w-full border-t border-slate-400">
      <h2 className="text-lg text-polkadot-200 mb-2">Results</h2>
      <ul className="flex flex-col gap-2">
        {keys.map((key) => (
          <StorageSubscriptionBox key={key} subscription={key} />
        ))}
      </ul>
    </div>
  )
}

const StorageSubscriptionBox: FC<{ subscription: string }> = ({
  subscription,
}) => {
  const storageSubscription = useStateObservable(
    storageSubscription$(subscription),
  )

  if (!storageSubscription) return null

  return (
    <li className="border rounded border-polkadot-200 p-2">
      <div className="flex justify-between items-center pb-1 overflow-hidden">
        <h3 className="text-polkadot-200 overflow-hidden text-ellipsis whitespace-nowrap">
          {storageSubscription.name}
        </h3>
        <button>
          <Trash2
            size={20}
            className="text-polkadot-400 cursor-pointer hover:text-polkadot-500"
            onClick={() => removeStorageSubscription(subscription)}
          />
        </button>
      </div>
      {"result" in storageSubscription ? (
        <JsonDisplay src={storageSubscription.result} />
      ) : (
        <div className="text-sm text-slate-400">Loading…</div>
      )}
    </li>
  )
}
