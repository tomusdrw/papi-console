import { lookup$ } from "@/chain.state"
import { ExpandBtn } from "@/components/Expand"
import { JsonDisplay } from "@/components/JsonDisplay"
import { groupBy } from "@/lib/groupBy"
import {
  getDynamicBuilder,
  MetadataLookup,
} from "@polkadot-api/metadata-builders"
import { SystemEvent } from "@polkadot-api/observable-client"
import {
  _void,
  AccountId,
  Bytes,
  compact,
  enhanceDecoder,
  Enum,
  SS58String,
  Struct,
  u8,
  Variant,
} from "@polkadot-api/substrate-bindings"
import { state, useStateObservable } from "@react-rxjs/core"
import { combineKeys } from "@react-rxjs/utils"
import { Codec, HexString } from "polkadot-api"
import { FC, useEffect, useRef, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { map, startWith, switchMap, take } from "rxjs"
import { twMerge } from "tailwind-merge"
import {
  blockInfo$,
  blockInfoState$,
  blocksByHeight$,
  BlockState,
} from "../block.state"
import { BlockStatusIcon, statusText } from "./BlockState"

type ApplyExtrinsicEvent = SystemEvent & { phase: { type: "ApplyExtrinsic" } }
export const BlockDetail = () => {
  const { hash } = useParams()
  const block = useStateObservable(blockInfoState$(hash ?? ""))
  const location = useLocation()
  const hashParams = new URLSearchParams(location.hash.slice(1))
  const eventParam = hashParams.get("event")
  const defaultEventOpen =
    eventParam && block?.events
      ? (block.events[Number(eventParam)] as ApplyExtrinsicEvent)
      : null
  const eventsByExtrinsic = block?.events
    ? groupBy(
        block.events.filter(
          (evt): evt is ApplyExtrinsicEvent =>
            evt.phase.type === "ApplyExtrinsic",
        ),
        (evt) => evt.phase.value,
      )
    : null

  if (!block) return null

  return (
    <div className="overflow-auto">
      <div className="p-2">
        <div className="flex flex-wrap justify-between">
          <h2 className="font-bold text-xl whitespace-nowrap overflow-hidden text-ellipsis">
            Block {block.hash}
          </h2>
          <p className="text-xl">{block.number.toLocaleString()}</p>
        </div>
        <p className="flex gap-1 items-center py-1">
          Status:
          <BlockStatusIcon state={block.status} />
          {statusText[block.status]}
        </p>
        <div className="flex flex-wrap justify-between">
          <div className="flex flex-col">
            <div>Parent</div>
            <BlockLink hash={block.parent} />
          </div>
          <div className="flex flex-col items-end">
            <div>Children</div>
            <BlockChildren hash={block.hash} />
          </div>
        </div>
        <div className="text-slate-200 py-2">
          <p>State root: {block.header?.stateRoot}</p>
          <p>Extrinsic root: {block.header?.extrinsicRoot}</p>
        </div>
      </div>
      <div className="p-2">
        <h3>Extrinsics TODO separate unsigned</h3>
        <ol>
          {block.body?.map((extrinsic, i) => (
            <Extrinsic
              key={i}
              data={extrinsic}
              highlightedEvent={defaultEventOpen}
              events={eventsByExtrinsic?.[i] ?? []}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}

const childBlocks$ = state(
  (hash: string) =>
    blockInfo$(hash).pipe(
      take(1),
      switchMap(({ hash, number }) =>
        combineKeys(
          blocksByHeight$.pipe(
            map((v) => v[number + 1]),
            map((v) =>
              v
                ? [...v.values()]
                    .filter((block) => block.parent === hash)
                    .map((block) => block.hash)
                : [],
            ),
          ),
          (hash) => blockInfo$(hash).pipe(startWith({ hash })),
        ),
      ),
      map((children) =>
        [...children.values()]
          .sort((a, b) => {
            const valueOf = (v: typeof a) =>
              "status" in v ? statusValue[v.status] : 0
            return valueOf(a) - valueOf(b)
          })
          .map((v) => v.hash),
      ),
    ),
  [],
)
const statusValue: Record<BlockState, number> = {
  [BlockState.Finalized]: 3,
  [BlockState.Best]: 2,
  [BlockState.Fork]: 1,
  [BlockState.Pruned]: 0,
}

const BlockChildren: FC<{ hash: string }> = ({ hash }) => {
  const childBlocks = useStateObservable(childBlocks$(hash))

  return childBlocks.length ? (
    <span className="inline-flex gap-2 align-middle">
      {childBlocks.map((hash) => (
        <BlockLink key={hash} hash={hash} />
      ))}
    </span>
  ) : (
    <span className="text-slate-400">N/A</span>
  )
}

const BlockLink: FC<{ hash: string }> = ({ hash }) => {
  const block = useStateObservable(blockInfoState$(hash))

  if (!block) {
    return <span className="align-middle">{hash.slice(0, 12)}…</span>
  }

  return (
    <Link
      className="text-polkadot-200 hover:text-polkadot-300 align-middle inline-flex items-center gap-1"
      to={`../${hash}`}
    >
      {<BlockStatusIcon state={block.status} size={20} />}
      {hash.slice(0, 12)}…
    </Link>
  )
}

const extrinsicDecoder$ = state(
  lookup$.pipe(map((lookup) => createExtrinsicCodec(lookup))),
  null,
)

const Extrinsic: FC<{
  data: HexString
  highlightedEvent: ApplyExtrinsicEvent | null
  events: ApplyExtrinsicEvent[]
}> = ({ data, events, highlightedEvent }) => {
  const decode = useStateObservable(extrinsicDecoder$)
  const [expanded, setExpanded] = useState(
    (highlightedEvent && events.includes(highlightedEvent)) ?? false,
  )

  if (!decode) return null
  const decoded = decode(data)

  return (
    <li className="p-2 border rounded border-polkadot-700 mb-2">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex gap-1 items-center"
      >
        <ExpandBtn expanded={expanded} />
        {decoded.call.type}.{decoded.call.value.type}
      </button>
      {expanded ? (
        <div className="overflow-hidden">
          <div className="overflow-auto max-h-[80vh] p-2">
            <JsonDisplay src={decoded.call.value.value} />
          </div>
          <div className="p-2 overflow-auto max-h-[80vh] border-t">
            <ol className="flex flex-col gap-1">
              {events.map((evt, i) => (
                <ExtrinsicEvent
                  key={i}
                  index={i}
                  evt={evt}
                  defaultOpen={highlightedEvent === evt}
                />
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </li>
  )
}

const ExtrinsicEvent: FC<{
  evt: ApplyExtrinsicEvent
  index: number
  defaultOpen: boolean
}> = ({ evt, index, defaultOpen }) => {
  const [expanded, setExpanded] = useState(defaultOpen)
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (defaultOpen) {
      ref.current?.scrollIntoView()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <li
      className={twMerge(
        "px-2 py-1",
        expanded && "py-2 bg-white bg-opacity-10 rounded overflow-auto",
      )}
      ref={ref}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex gap-1 items-center"
      >
        <span>{index}.</span>
        <ExpandBtn expanded={expanded} />
        <span>{`${evt.event.type}.${evt.event.value.type}`}</span>
      </button>
      {expanded && <JsonDisplay src={evt.event.value.value} />}
    </li>
  )
}

const createExtrinsicCodec = (lookup: MetadataLookup) => {
  const dynamicBuilder = getDynamicBuilder(lookup)

  // https://spec.polkadot.network/id-extrinsics#id-extrinsics-body
  const extrinsicHeader = enhanceDecoder(u8.dec, (value) => ({
    signed: (value & 0x80) > 0,
    version: value & 0x7f,
  }))
  const sender =
    "address" in lookup.metadata.extrinsic
      ? (dynamicBuilder.buildDefinition(
          lookup.metadata.extrinsic.address,
        ) as Codec<
          // TODO Assume MultiAddress, but can be anything really :/
          Enum<{
            Id: SS58String
          }>
        >)
      : AccountId()
  const v14Signature = Variant({
    Ed25519: Bytes(64),
    Sr25519: Bytes(64),
    Ecdsa: Bytes(65),
  })
  const signature =
    "signature" in lookup.metadata.extrinsic
      ? (dynamicBuilder.buildDefinition(
          lookup.metadata.extrinsic.signature,
        ) as typeof v14Signature)
      : v14Signature
  const extra =
    "extra" in lookup.metadata.extrinsic
      ? (dynamicBuilder.buildDefinition(
          lookup.metadata.extrinsic.extra,
        ) as Codec<unknown[]>)
      : Struct({
          mortality: Variant({
            Immortal: _void,
            ...Object.fromEntries(
              new Array(255).fill(0).map((_, i) => [`Mortal${i}`, u8]),
            ),
          }),
          nonce: compact,
          tip: compact,
        })
  const call = dynamicBuilder.buildDefinition(
    "call" in lookup.metadata.extrinsic
      ? lookup.metadata.extrinsic.call
      : lookup.metadata.extrinsic.type,
  ) as Codec<{ type: string; value: { type: string; value: unknown } }>
  const signedExtrinsicV4 = Struct({
    sender,
    signature,
    extra,
    call,
  })

  // Externally, it's an opaque
  return enhanceDecoder(Bytes().dec, (bytes: Uint8Array) => {
    const header = extrinsicHeader(bytes)

    return header.signed
      ? {
          version: header.version,
          signed: true as const,
          ...signedExtrinsicV4.dec(bytes.slice(1)),
        }
      : {
          version: header.version,
          signed: false as const,
          call: call.dec(bytes.slice(1)),
        }
  })
}
type DecodedExtrinsic = ReturnType<ReturnType<typeof createExtrinsicCodec>>
