import { lookup$, metadata$ } from "@/chain.state"
import { ViewCodec } from "@/codec-components/ViewCodec"
import { CopyBinary } from "@/codec-components/ViewCodec/CopyBinary"
import { ButtonGroup } from "@/components/ButtonGroup"
import { JsonDisplay } from "@/components/JsonDisplay"
import { CodecComponentType, NOTIN } from "@codec-components"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { state, useStateObservable } from "@react-rxjs/core"
import { Trash2 } from "lucide-react"
import { FC, useMemo, useState } from "react"
import { Virtuoso } from "react-virtuoso"
import { map } from "rxjs"
import {
  removeStorageSubscription,
  StorageSubscription,
  storageSubscription$,
  storageSubscriptionKeys$,
  stringifyArg,
} from "./storage.state"

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
      <ResultDisplay storageSubscription={storageSubscription} />
    </li>
  )
}

const ResultDisplay: FC<{
  storageSubscription: StorageSubscription
}> = ({ storageSubscription }) => {
  if (!("result" in storageSubscription)) {
    return <div className="text-sm text-slate-400">Loading…</div>
  }

  if (storageSubscription.single) {
    return (
      <ValueDisplay
        storageSubscription={storageSubscription}
        value={storageSubscription.result}
        title={"Result"}
      />
    )
  }

  const values = storageSubscription.result as Array<{
    keyArgs: unknown[]
    value: unknown
  }>

  const renderItem = (keyArgs: unknown[], value: unknown) => {
    const title = keyArgs
      .slice(storageSubscription.args?.length ?? 0)
      .map(stringifyArg)
      .join(", ")
    return (
      <div key={title} className={itemClasses}>
        <ValueDisplay
          title={title}
          value={value}
          storageSubscription={storageSubscription}
        />
      </div>
    )
  }

  if (values.length > 10) {
    return (
      <Virtuoso
        style={{ height: "60svh" }}
        totalCount={values.length}
        itemContent={(i) =>
          values[i] && renderItem(values[i].keyArgs, values[i].value)
        }
        components={{ Item: VirtuosoItem }}
      />
    )
  }

  return (
    <div className="max-h-[60svh] overflow-auto">
      {values.map(({ keyArgs, value }) => renderItem(keyArgs, value))}
    </div>
  )
}
const itemClasses = "py-2 border-b first:pt-0 last:pb-0 last:border-b-0"
const VirtuosoItem: FC = (props) => <div {...props} className={itemClasses} />

const metadataState$ = state(metadata$, null)
const dynamicBuilder$ = state(
  lookup$.pipe(map((v) => getDynamicBuilder(v))),
  null,
)
const ValueDisplay: FC<{
  storageSubscription: StorageSubscription
  title: string
  value: unknown | NOTIN
}> = ({ storageSubscription, title, value }) => {
  const [mode, setMode] = useState<"json" | "decoded">("json")
  const metadata = useStateObservable(metadataState$)
  const builder = useStateObservable(dynamicBuilder$)

  const [codec, encodedValue] = useMemo(() => {
    if (!builder) return [null!, null!]
    const codec = builder.buildDefinition(storageSubscription.type)
    const encodedValue = (() => {
      try {
        return codec.enc(value)
      } catch (_) {
        return null
      }
    })()
    return [codec, encodedValue] as const
  }, [builder, value, storageSubscription.type])

  if (!metadata || !builder) return null
  if (!encodedValue) {
    return <div className="text-slate-400">Empty</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center overflow-hidden">
        <div className="flex flex-1 gap-2 overflow-hidden">
          <CopyBinary value={encodedValue} />
          <h3 className="overflow-hidden text-ellipsis">{title}</h3>
        </div>
        <ButtonGroup
          value={mode}
          onValueChange={setMode as any}
          items={[
            {
              value: "json",
              content: "JSON",
            },
            {
              value: "decoded",
              content: "Decoded",
            },
          ]}
        />
      </div>
      {mode === "decoded" ? (
        <ViewCodec
          codecType={storageSubscription.type}
          value={{
            type: CodecComponentType.Initial,
            value: codec.enc(value),
          }}
          metadata={metadata}
        />
      ) : (
        <JsonDisplay src={value} />
      )}
    </div>
  )
}
