import { metadata$ } from "@/chain.state"
import { ButtonGroup } from "@/components/ButtonGroup"
import { JsonDisplay } from "@/components/JsonDisplay"
import { LoadingMetadata } from "@/components/Loading"
import { withSubscribe } from "@/components/withSuspense"
import { V14, V15 } from "@polkadot-api/substrate-bindings"
import { useStateObservable } from "@react-rxjs/core"
import { FC, useState } from "react"
import { Lookup } from "./Lookup"

export const Metadata = withSubscribe(
  () => {
    const [mode, setMode] = useState<"json" | "explorer">("explorer")
    const metadata = useStateObservable(metadata$)

    return (
      <div className="flex flex-col overflow-auto items-start gap-2 p-2">
        <ButtonGroup
          value={mode}
          onValueChange={setMode as any}
          items={[
            {
              value: "explorer",
              content: "Explorer",
            },
            {
              value: "json",
              content: "JSON",
            },
          ]}
        />
        {mode === "json" ? (
          <JsonDisplay src={metadata} />
        ) : (
          <MetadataExplorer value={metadata} />
        )}
      </div>
    )
  },
  {
    fallback: <LoadingMetadata />,
  },
)

const MetadataExplorer: FC<{ value: V14 | V15 }> = ({ value }) => {
  return (
    <div className="w-full">
      <Lookup lookup={value.lookup} />
    </div>
  )
}
