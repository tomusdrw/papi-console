import { lookup$, metadata$ } from "@/chain.state"
import { LookupTypeEdit } from "@/codec-components/LookupTypeEdit"
import { ButtonGroup } from "@/components/ButtonGroup"
import { JsonDisplay } from "@/components/JsonDisplay"
import { LoadingMetadata } from "@/components/Loading"
import { withSubscribe } from "@/components/withSuspense"
import { getTypeComplexity } from "@/utils/shape"
import { V14, V15 } from "@polkadot-api/substrate-bindings"
import { useStateObservable } from "@react-rxjs/core"
import { FC, useState } from "react"
import { Route, Routes, useParams } from "react-router-dom"
import { Extrinsic } from "./Extrinsic"
import { Lookup, LookupContext } from "./Lookup"
import { Pallets } from "./Pallets"
import { RuntimeApis } from "./RuntimeApis"
import { V15Fields } from "./V15Fields"

export const Metadata = withSubscribe(
  () => (
    <Routes>
      <Route path="editor/:id" element={<Editor />} />
      <Route path="*" element={<MetadataExplorer />} />
    </Routes>
  ),
  {
    fallback: <LoadingMetadata />,
  },
)

const MetadataExplorer = () => {
  const [mode, setMode] = useState<"json" | "explorer">("explorer")
  const metadata = useStateObservable(metadata$)

  return (
    <div className="p-4 pb-0 flex flex-col overflow-auto items-start gap-2">
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
        <DecodedExplorer value={metadata} />
      )}
    </div>
  )
}

const DecodedExplorer: FC<{ value: V14 | V15 }> = ({ value }) => {
  return (
    <div className="w-full flex flex-col gap-6">
      <LookupContext.Provider value={value.lookup}>
        <Lookup />
        <Pallets pallets={value.pallets} />
        <RuntimeApis apis={value.apis} />
        <Extrinsic extrinsic={value.extrinsic} />
        {"outerEnums" in value && <V15Fields metadata={value} />}
      </LookupContext.Provider>
    </div>
  )
}

const Editor = () => {
  const { id } = useParams()
  const lookup = useStateObservable(lookup$)
  const [value, setValue] = useState<Uint8Array | "partial" | null>(null)
  if (!lookup) return null
  const shape = lookup(Number(id))
  const complexity = getTypeComplexity(shape)

  return (
    <LookupTypeEdit
      type={Number(id)}
      value={value}
      onValueChange={setValue}
      tree={complexity === "tree"}
    />
  )
}
