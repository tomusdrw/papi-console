import { getDynamicBuilder, getLookupFn } from "@polkadot-api/metadata-builders"
import { getObservableClient } from "@polkadot-api/observable-client"
import { decAnyMetadata } from "@polkadot-api/substrate-bindings"
import {
  createClient as createSubstrateClient,
  JsonRpcProvider,
} from "@polkadot-api/substrate-client"
import { toHex } from "@polkadot-api/utils"
import { sinkSuspense, state, SUSPENSE } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { createClient } from "polkadot-api"
import { chainSpec as ksmChainSpec } from "polkadot-api/chains/ksmcc3"
import { chainSpec as paseoChainSpec } from "polkadot-api/chains/paseo"
import { chainSpec } from "polkadot-api/chains/polkadot"
import { chainSpec as westendChainSpec } from "polkadot-api/chains/westend2"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getSmProvider } from "polkadot-api/sm-provider"
import { Chain, Client } from "polkadot-api/smoldot"
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
<<<<<<< Updated upstream
import polkadotRawNetworks from "./networks/polkadot.json"
=======
import paseoRawNetworks from "./networks/paseo.json"
import { createSignal } from "@react-rxjs/utils"
import { chainSpec } from "polkadot-api/chains/polkadot"
import { chainSpec as ksmChainSpec } from "polkadot-api/chains/ksmcc3"
import { chainSpec as westendChainSpec } from "polkadot-api/chains/westend2"
import { chainSpec as paseoChainSpec } from "polkadot-api/chains/paseo"
>>>>>>> Stashed changes

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

const polkadot = polkadotRawNetworks.map(
  (x): Network => ({
    endpoints: x.rpcs as any,
    lightclient: x.hasChainSpecs,
    id: x.id,
    display: x.display,
    relayChain: "polkadot",
  }),
)

const kusama = ksmRawNetworks.map(
  (x): Network => ({
    endpoints: x.rpcs as any,
    lightclient: x.hasChainSpecs,
    id: x.id,
    display: x.display,
    relayChain: "kusama",
  }),
)

const paseo = paseoRawNetworks.map(
  (x): Network => ({
    endpoints: x.rpcs as any,
    lightclient: x.hasChainSpecs,
    id: x.id,
    display: x.display,
    relayChain: "paseo",
  }),
)

export const networkCategories: NetworkCategory[] = [
  {
    name: "Polkadot",
    networks: polkadot,
  },
  {
    name: "Kusama",
    networks: kusama,
  },
  {
    name: "Paseo",
    networks: paseo,
  },
]

export const [selectedChainChanged$, onChangeChain] =
  createSignal<SelectedChain>()
export const selectedChain$ = state<SelectedChain>(selectedChainChanged$, {
  network: polkadot[0],
  endpoint: "light-client",
})
selectedChain$.subscribe()

const relayChains = new Set(["polkadot", "kusama", "westend", "paseo"])
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
      if (relayChains.has(id)) {
        return of({
          id,
          type: "chainSpec",
          value: { chainSpec: id },
        })
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
export const runtimeCtx$ = chainClient$.pipeState(
  switchMap(({ id }) => {
    const cached = localStorage.getItem(`metadata-${id}`)

    const realCtx$ = uncachedRuntimeCtx$.pipe(
      tap((v) => {
        localStorage.setItem(`metadata-${id}`, toHex(v.metadataRaw))
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
export const metadata$ = lookup$.pipe(map((lookup) => lookup.metadata))
export const dynamicBuilder$ = runtimeCtx$.pipeState(
  map((ctx) => ctx.dynamicBuilder),
)

let smoldot: {
  client: Client
  relayChains: Record<string, Promise<Chain>>
} | null = null
export function getProvider(source: ChainSource): JsonRpcProvider {
  if (source.type === "websocket") {
    return withPolkadotSdkCompat(getWsProvider(source.value))
  }

  if (!smoldot) {
    const client = startFromWorker(new SmWorker(), {
      logCallback: (level, target, message) => {
        console.debug("[%s(%s)] %s", target, level, message)
      },
    })
    smoldot = {
      client,
      relayChains: {
        polkadot: client.addChain({
          chainSpec: chainSpec,
        }),
        kusama: client.addChain({
          chainSpec: ksmChainSpec,
        }),
        westend: client.addChain({
          chainSpec: westendChainSpec,
        }),
        paseo: client.addChain({
          chainSpec: paseoChainSpec,
        }),
      },
    }
  }
  const chain = source.value.relayChain
    ? smoldot.relayChains[source.value.relayChain].then((chain) => {
        return smoldot!.client.addChain({
          chainSpec: source.value.chainSpec,
          potentialRelayChains: [chain],
        })
      })
    : smoldot.relayChains[source.value.chainSpec] ||
      smoldot.client.addChain({
        chainSpec: source.value.chainSpec,
      })

  return withLogsRecorder(console.debug, getSmProvider(chain))
}
