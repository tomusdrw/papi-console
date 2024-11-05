import { getDynamicBuilder, getLookupFn } from "@polkadot-api/metadata-builders"
import { getObservableClient } from "@polkadot-api/observable-client"
import {
  Binary,
  CodecType,
  decAnyMetadata,
  metadata as metadataCodec,
  V14,
  V15,
} from "@polkadot-api/substrate-bindings"
import { createClient as createSubstrateClient } from "@polkadot-api/substrate-client"
import { toHex } from "@polkadot-api/utils"
import { state } from "@react-rxjs/core"
import { createClient, PolkadotClient } from "polkadot-api"
import { chainSpec } from "polkadot-api/chains/westend2"
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

export const chainClient$ = state(
  selectedSource$.pipe(
    map((src) => [src.id, getProvider(src)] as const),
    switchMap(([id, provider]) => {
      const substrateClient = createSubstrateClient(provider)
      const observableClient = getObservableClient(substrateClient)
      const chainHead = observableClient.chainHead$(2)
      const client = createClient(provider)
      return concat(
        of({ id, client, substrateClient, observableClient, chainHead }),
        NEVER,
      ).pipe(
        finalize(() => {
          chainHead.unfollow()
          client.destroy()
          observableClient.destroy()
        }),
      )
    }),
  ),
)
export const chainHead$ = state(
  chainClient$.pipe(map(({ chainHead }) => chainHead)),
)

export const unsafeApi$ = chainClient$.pipeState(
  map(({ client }) => client.getUnsafeApi()),
)

export const metadata$ = chainClient$.pipeState(
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
)
export const lookup$ = metadata$.pipeState(map(getLookupFn))

export const dynamicBuilder$ = lookup$.pipeState(
  map((lookup) => ({ lookup, ...getDynamicBuilder(lookup) })),
)

async function getMetadata(client: PolkadotClient): Promise<AnyMetadata> {
  const unsafeApi = client.getUnsafeApi()
  const versions: number[] = await unsafeApi.apis.Metadata.metadata_versions()
  const metadataResponse: Binary = await (versions.includes(15)
    ? unsafeApi.apis.Metadata.metadata_at_version(15)
    : unsafeApi.apis.Metadata.metadata())
  return decAnyMetadata(metadataResponse.asBytes())
}

let smoldot: Client | null = null
export function getProvider(source: ChainSource) {
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
