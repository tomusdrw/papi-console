import { getDynamicBuilder, getLookupFn } from "@polkadot-api/metadata-builders"
import { getObservableClient } from "@polkadot-api/observable-client"
import { decAnyMetadata, HexString } from "@polkadot-api/substrate-bindings"
import {
  createClient as createSubstrateClient,
  JsonRpcProvider,
} from "@polkadot-api/substrate-client"
import { toHex } from "@polkadot-api/utils"
import { sinkSuspense, state, SUSPENSE } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { createClient } from "polkadot-api"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getSmProvider } from "polkadot-api/sm-provider"
import { Chain } from "polkadot-api/smoldot"
import { startFromWorker } from "polkadot-api/smoldot/from-worker"
import SmWorker from "polkadot-api/smoldot/worker?worker"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import {
  concat,
  EMPTY,
  filter,
  finalize,
  map,
  NEVER,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from "rxjs"
import ksmRawNetworks from "./networks/kusama.json"
import paseoRawNetworks from "./networks/paseo.json"
import polkadotRawNetworks from "./networks/polkadot.json"
import westendRawNetworks from "./networks/westend.json"

const [dotChainSpec, ksmChainSpec, paseoChainSpec, westendChainSpec] = [
  import("polkadot-api/chains/polkadot"),
  import("polkadot-api/chains/ksmcc3"),
  import("polkadot-api/chains/paseo"),
  import("polkadot-api/chains/westend2"),
].map((x) => x.then((y) => y.chainSpec))
const smoldot = startFromWorker(new SmWorker(), {
  logCallback: (level, target, message) => {
    console.debug("smoldot[%s(%s)] %s", target, level, message)
  },
})
const relayChains: Record<
  string,
  { chainSpec: Promise<string>; chain: Promise<Chain> | null }
> = {
  polkadot: { chainSpec: dotChainSpec, chain: null },
  kusama: { chainSpec: ksmChainSpec, chain: null },
  paseo: { chainSpec: paseoChainSpec, chain: null },
  westend: { chainSpec: westendChainSpec, chain: null },
}
const getRelayChain = async (name: string) => {
  if (!relayChains[name].chain) {
    relayChains[name].chain = smoldot.addChain({
      chainSpec: await relayChains[name].chainSpec,
    })
  }
  return relayChains[name].chain
}

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

export type Network = {
  id: string
  display: string
  endpoints: Record<string, string>
  lightclient: boolean
  relayChain?: string
}

export type NetworkCategory = {
  name: string
  networks: Network[]
}
export type SelectedChain = {
  network: Network
  endpoint: string
}

const [Polkadot, Kusama, Paseo, Westend] = (
  [
    polkadotRawNetworks,
    ksmRawNetworks,
    paseoRawNetworks,
    westendRawNetworks,
  ] as const
).map((n): Network[] =>
  n.map((x) => ({
    endpoints: x.rpcs as any,
    lightclient: x.hasChainSpecs,
    id: x.id,
    display: x.display,
    relayChain: x.relayChainInfo?.id,
  })),
)

const networks = {
  Polkadot,
  Kusama,
  Paseo,
  Westend,
  Development: [
    {
      id: "localhost",
      display: "Localhost",
      lightclient: false,
      endpoints: {
        "Local (ws://127.0.0.1:9944)": "ws://127.0.0.1:9944",
      },
    } as Network,
  ],
}

export const networkCategories: NetworkCategory[] = Object.entries(
  networks,
).map(([name, networks]) => ({ name, networks }))

export const [selectedChainChanged$, onChangeChain] =
  createSignal<SelectedChain>()
export const selectedChain$ = state<SelectedChain>(selectedChainChanged$, {
  network: Polkadot[0],
  endpoint: "light-client",
})
selectedChain$.subscribe()

const selectedSource$ = selectedChain$.pipe(
  switchMap(
    ({ endpoint, network }): Observable<ChainSource> | Promise<ChainSource> => {
      const { id } = network
      if (endpoint !== "light-client")
        return of({
          id,
          type: "websocket",
          value: endpoint,
        })
      if (id in relayChains) {
        return relayChains[id].chainSpec.then((chainSpec) => ({
          id,
          type: "chainSpec",
          value: { chainSpec },
        }))
      }
      return import(`./chainspecs/${id}.ts`).then(({ chainSpec }) => {
        const parsed = JSON.parse(chainSpec)
        return {
          id,
          type: "chainSpec",
          value: {
            chainSpec,
            relayChain:
              network.relayChain || parsed.relayChain || parsed.relay_chain,
          },
        }
      })
    },
  ),
)

export const chainClient$ = state(
  selectedSource$.pipe(
    map((src) => [src.id, getProvider(src)] as const),
    switchMap(([id, provider], i) => {
      const substrateClient = createSubstrateClient(provider)
      const observableClient = getObservableClient(substrateClient)
      const chainHead = observableClient.chainHead$(2)
      const client = createClient(provider)
      return concat(
        i === 0 ? EMPTY : of(SUSPENSE),
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
    sinkSuspense(),
  ),
)
export const chainHead$ = state(
  chainClient$.pipe(map(({ chainHead }) => chainHead)),
)

export const unsafeApi$ = chainClient$.pipeState(
  map(({ client }) => client.getUnsafeApi()),
)

const uncachedRuntimeCtx$ = chainClient$.pipeState(
  switchMap(({ chainHead }) => chainHead.runtime$),
  filter((v) => !!v),
)

const getMetadataCache = () => {
  const cached = localStorage.getItem(`metadata-cache`)
  return new Map<string, { time: number; data: HexString }>(
    cached ? JSON.parse(cached) : [],
  )
}
const getCachedMetadata = (id: string) =>
  getMetadataCache().get(id)?.data ?? null
const setCachedMetadata = (id: string, data: HexString) => {
  const cached = getMetadataCache()
  cached.set(id, { time: Date.now(), data })
  if (cached.size > 3) {
    const oldest = [...cached.entries()].reduce((a, b) =>
      a[1].time < b[1].time ? a : b,
    )[0]
    cached.delete(oldest)
  }
  localStorage.setItem("metadata-cache", JSON.stringify([...cached.entries()]))
}
export const runtimeCtx$ = chainClient$.pipeState(
  switchMap(({ id }) => {
    const cached = getCachedMetadata(id)

    const realCtx$ = uncachedRuntimeCtx$.pipe(
      tap((v) => {
        setCachedMetadata(id, toHex(v.metadataRaw))
      }),
    )

    if (cached) {
      const metadata = decAnyMetadata(cached)
      const lookup = getLookupFn(metadata.metadata.value as any)
      const dynamicBuilder = getDynamicBuilder(lookup)

      return realCtx$.pipe(
        startWith({
          lookup,
          dynamicBuilder,
        }),
      )
    }
    return realCtx$
  }),
)

export const lookup$ = runtimeCtx$.pipeState(map((ctx) => ctx.lookup))
export const metadata$ = lookup$.pipeState(map((lookup) => lookup.metadata))
export const dynamicBuilder$ = runtimeCtx$.pipeState(
  map((ctx) => ctx.dynamicBuilder),
)

export function getProvider(source: ChainSource): JsonRpcProvider {
  if (source.type === "websocket") {
    return withPolkadotSdkCompat(getWsProvider(source.value))
  }

  const chain = source.value.relayChain
    ? getRelayChain(source.value.relayChain).then((chain) =>
        smoldot.addChain({
          chainSpec: source.value.chainSpec,
          potentialRelayChains: [chain],
        }),
      )
    : smoldot.addChain({
        chainSpec: source.value.chainSpec,
      })

  return withLogsRecorder(
    (v) => v.includes("initialized") && console.debug(v),
    getSmProvider(chain),
  )
}
