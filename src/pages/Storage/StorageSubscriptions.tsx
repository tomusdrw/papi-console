import { lookup$, metadata$ } from "@/chain.state"
import { ViewCodec } from "@/codec-components/ViewCodec"
import { CopyBinary } from "@/codec-components/ViewCodec/CopyBinary"
import { ButtonGroup } from "@/components/ButtonGroup"
import { JsonDisplay } from "@/components/JsonDisplay"
import { CodecComponentType, NOTIN } from "@codec-components"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { state, useStateObservable } from "@react-rxjs/core"
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react"
import { FC, useMemo, useState } from "react"
import { Virtuoso } from "react-virtuoso"
import { map } from "rxjs"
import {
  removeStorageSubscription,
  StorageSubscription,
  storageSubscription$,
  storageSubscriptionKeys$,
  stringifyArg,
  toggleSubscriptionPause,
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
  const [mode, setMode] = useState<"json" | "decoded">("decoded")
  const storageSubscription = useStateObservable(
    storageSubscription$(subscription),
  )
  if (!storageSubscription) return null

  const iconButtonProps = {
    size: 20,
    className: "text-polkadot-400 cursor-pointer hover:text-polkadot-500",
  }

  return (
    <li className="border rounded border-polkadot-200 p-2">
      <div className="flex justify-between items-center pb-1 overflow-hidden">
        <h3 className="text-polkadot-200 overflow-hidden text-ellipsis whitespace-nowrap">
          {storageSubscription.name}
        </h3>
        <div className="flex items-center flex-shrink-0 gap-2">
          <ButtonGroup
            value={mode}
            onValueChange={setMode as any}
            items={[
              {
                value: "decoded",
                content: "Decoded",
              },
              {
                value: "json",
                content: "JSON",
              },
            ]}
          />
          <button onClick={() => toggleSubscriptionPause(subscription)}>
            {storageSubscription.paused ? (
              <PlayCircle {...iconButtonProps} />
            ) : (
              <PauseCircle {...iconButtonProps} />
            )}
          </button>
          <button onClick={() => removeStorageSubscription(subscription)}>
            <Trash2 {...iconButtonProps} />
          </button>
        </div>
      </div>
      <ResultDisplay storageSubscription={storageSubscription} mode={mode} />
    </li>
  )
}

const ResultDisplay: FC<{
  storageSubscription: StorageSubscription
  mode: "json" | "decoded"
}> = ({ storageSubscription, mode }) => {
  if (!("result" in storageSubscription)) {
    return <div className="text-sm text-slate-400">Loading…</div>
  }

  if (storageSubscription.single) {
    return (
      <div className="max-h-[60svh] overflow-auto">
        <ValueDisplay
          mode={mode}
          storageSubscription={storageSubscription}
          value={storageSubscription.result}
          title={"Result"}
        />
      </div>
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
          mode={mode}
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
  mode: string
}> = ({ storageSubscription, title, value, mode }) => {
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
      <div className="flex flex-1 gap-2 overflow-hidden">
        <CopyBinary value={encodedValue} />
        <h3 className="overflow-hidden text-ellipsis">{title}</h3>
      </div>
      {mode === "decoded" ? (
        <div className="leading-tight">
          <ViewCodec
            codecType={storageSubscription.type}
            value={{
              type: CodecComponentType.Initial,
              value: codec.enc(value),
            }}
            metadata={metadata}
          />
        </div>
      ) : (
        <JsonDisplay src={value} />
      )}
    </div>
  )
}
