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
import { Codec, HexString } from "polkadot-api"
import { FC, useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { map } from "rxjs"
import { twMerge } from "tailwind-merge"
import { blockInfoState$ } from "../block.state"

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
      <div>Summary</div>
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
