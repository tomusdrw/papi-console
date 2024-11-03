import { dynamicBuilder$, lookup$ } from "@/chain.state"
import { ViewCodec } from "@/codec-components/ViewCodec"
import { ButtonGroup } from "@/components/ButtonGroup"
import { DocsRenderer } from "@/components/DocsRenderer"
import { ExpandBtn } from "@/components/Expand"
import { Tooltip } from "@/components/Tooltip"
import { withSubscribe } from "@/components/withSuspense"
import { CodecComponentType } from "@/lib/codecComponents"
import { getTypeComplexity } from "@/utils/shape"
import { state, useStateObservable } from "@react-rxjs/core"
import { Dot } from "lucide-react"
import { HexString } from "polkadot-api"
import { FC, useState } from "react"
import { map } from "rxjs"
import { twMerge } from "tailwind-merge"
import { ValueDisplay } from "./Storage/StorageSubscriptions"

const metadataConstants$ = state(
  lookup$.pipe(
    map((lookup) =>
      lookup.metadata.pallets
        .filter((p) => p.constants.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          name: p.name,
          constants: p.constants.sort((a, b) => a.name.localeCompare(b.name)),
        })),
    ),
  ),
)

export const Constants = withSubscribe(() => {
  const entries = useStateObservable(metadataConstants$)

  return (
    <div className="p-2 flex flex-col gap-2 items-start overflow-auto leading-relaxed">
      <ul>
        {entries.map(({ name, constants }) => (
          <PalletConstants key={name} name={name} entries={constants} />
        ))}
      </ul>
    </div>
  )
})

const PalletConstants: FC<{
  name: string
  entries: Array<{
    name: string
    type: number
    value: HexString
    docs: string[]
  }>
}> = ({ name, entries }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <li>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <ExpandBtn expanded={expanded} />
        <div>{name}</div>
      </div>
      {expanded && (
        <ul>
          {entries.map((props) => (
            <ConstantEntry key={props.name} {...props} />
          ))}
        </ul>
      )}
    </li>
  )
}

const constantValueProps$ = state(
  dynamicBuilder$.pipe(
    map((builder) => ({
      builder,
      lookup: builder.lookup,
    })),
  ),
  null,
)

const ConstantEntry: FC<{
  name: string
  type: number
  value: HexString
  docs: string[]
}> = ({ name, type, value, docs }) => {
  const props = useStateObservable(constantValueProps$)
  const [expanded, setExpanded] = useState(false)

  if (!props) return null

  const isInline = getTypeComplexity(props.lookup(type), true) === "inline"

  const titleElement = (
    <div
      className={twMerge(
        "flex items-center gap-2",
        !isInline && "cursor-pointer",
      )}
      onClick={() => setExpanded((e) => !e)}
    >
      {isInline ? <Dot size={16} /> : <ExpandBtn expanded={expanded} />}
      <Tooltip
        content={
          docs.length ? (
            <DocsRenderer docs={docs} className="text-slate-700 max-h-none" />
          ) : null
        }
        disableHoverableContent
      >
        <div className={isInline ? "text-slate-400" : ""}>
          {name + (isInline ? ":" : "")}
        </div>
      </Tooltip>
      {isInline ? (
        <ViewCodec
          codecType={type}
          value={{
            type: CodecComponentType.Initial,
            value: value,
          }}
          metadata={props.lookup.metadata}
        />
      ) : null}
    </div>
  )

  return (
    <li className="pl-4">
      {titleElement}
      {!isInline && expanded && (
        <ConstantValue
          type={type}
          decoded={props.builder.buildDefinition(type).dec(value)}
        />
      )}
    </li>
  )
}

const ConstantValue: FC<{ type: number; decoded: unknown }> = ({
  type,
  decoded,
}) => {
  const [mode, setMode] = useState<"json" | "decoded">("json")

  return (
    <div className="pl-6 py-2 flex flex-col gap-2 items-start overflow-hidden w-full">
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
      <div className="overflow-auto w-full">
        <ValueDisplay mode={mode} type={type} value={decoded} title="Value" />
      </div>
    </div>
  )
}
