import { getLookupFn } from "@polkadot-api/metadata-builders"
import {
  Binary,
  CodecType,
  decAnyMetadata,
  metadata as metadataCodec,
  V14,
  V15,
} from "@polkadot-api/substrate-bindings"
import { toHex } from "@polkadot-api/utils"
import { shareLatest } from "@react-rxjs/core"
import { createClient, PolkadotClient } from "polkadot-api"
import { chainSpec } from "polkadot-api/chains/polkadot"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getSmProvider } from "polkadot-api/sm-provider"
import { Client } from "polkadot-api/smoldot"
import { startFromWorker } from "polkadot-api/smoldot/from-worker"
import SmWorker from "polkadot-api/smoldot/worker?worker"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import {
  concat,
  finalize,
  from,
  map,
  NEVER,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from "rxjs"

export type ChainSource = { id: string } & (
  | {
      type: "chainSpec"
      value: {
        chainSpec: string
        relayChain?: string
      }
    }
  | {
      type: "websocket"
      value: string
    }
)

const selectedSource$ = of<ChainSource>({
  id: "polkadot",
  type: "chainSpec",
  value: { chainSpec },
})

type AnyMetadata = CodecType<typeof metadataCodec>

export const chainClient$ = selectedSource$.pipe(
  map((src) => [src.id, getProvider(src)] as const),
  switchMap(([id, provider]) => {
    const client = createClient(provider)
    return concat(of({ id, client }), NEVER).pipe(
      finalize(() => client.destroy()),
    )
  }),
  shareLatest(),
)
export const unsafeApi$ = chainClient$.pipe(
  map(({ client }) => client.getUnsafeApi()),
  shareLatest(),
)

export const metadata$ = chainClient$.pipe(
  switchMap(({ id, client }) => {
    const metadata = from(getMetadata(client)).pipe(
      tap((v) => {
        localStorage.setItem(`metadata-${id}`, toHex(metadataCodec.enc(v)))
      }),
    )
    const cached = localStorage.getItem(`metadata-${id}`)
    if (cached) {
      return from(metadata).pipe(startWith(decAnyMetadata(cached)))
    }
    return from(metadata)
  }),
  map((v): V14 | V15 => {
    const metadata = v.metadata
    if (metadata.tag === "v14" || metadata.tag === "v15") {
      return metadata.value
    }
    throw new Error("Incompatible metadata")
  }),
  shareReplay(1),
)
export const lookup$ = metadata$.pipe(map(getLookupFn), shareLatest())

async function getMetadata(client: PolkadotClient): Promise<AnyMetadata> {
  const unsafeApi = client.getUnsafeApi()
  const versions: number[] = await unsafeApi.apis.Metadata.metadata_versions()
  const metadataResponse: Binary = await (versions.includes(15)
    ? unsafeApi.apis.Metadata.metadata_at_version(15)
    : unsafeApi.apis.Metadata.metadata())
  return decAnyMetadata(metadataResponse.asBytes())
}

let smoldot: Client | null = null
function getProvider(source: ChainSource) {
  if (source.type === "websocket") {
    return withPolkadotSdkCompat(getWsProvider(source.value))
  }

  if (!smoldot) {
    smoldot = startFromWorker(new SmWorker(), {
      logCallback: (level, target, message) => {
        console.debug("[%s(%s)] %s", target, level, message)
      },
    })
  }
  const chain = source.value.relayChain
    ? smoldot
        .addChain({
          chainSpec: source.value.relayChain,
        })
        .then((chain) =>
          smoldot!.addChain({
            chainSpec: source.value.chainSpec,
            potentialRelayChains: [chain],
          }),
        )
    : smoldot.addChain({
        chainSpec: source.value.chainSpec,
      })

  return withLogsRecorder(console.debug, getSmProvider(chain))
}
