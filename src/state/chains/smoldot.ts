import { JsonRpcProvider } from "@polkadot-api/substrate-client"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import { getSmProvider } from "polkadot-api/sm-provider"
import { Chain } from "polkadot-api/smoldot"
import { startFromWorker } from "polkadot-api/smoldot/from-worker"
import SmWorker from "polkadot-api/smoldot/worker?worker"
import { getCachedSmoldotDb } from "./smoldot.cache"

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

export const relayChains = ["polkadot", "kusama", "paseo", "westend"] as const
export type RelayChain = (typeof relayChains)[number]

const relaySmoldotChains: Record<
  RelayChain,
  { chainSpec: Promise<string>; chain: Promise<Chain> | null }
> = {
  polkadot: { chainSpec: dotChainSpec, chain: null },
  kusama: { chainSpec: ksmChainSpec, chain: null },
  paseo: { chainSpec: paseoChainSpec, chain: null },
  westend: { chainSpec: westendChainSpec, chain: null },
}
const createChain = async (
  id: string,
  chainSpec: string | Promise<string>,
  relayChain?: Promise<Chain>,
) => {
  const databaseContent =
    (id in relaySmoldotChains && (await getCachedSmoldotDb(id))) || undefined
  const solvedChain = relayChain ? await relayChain : undefined
  return smoldot.addChain({
    chainSpec: await chainSpec,
    databaseContent,
    potentialRelayChains: solvedChain ? [solvedChain] : undefined,
  })
}
const getRelayChain = async (name: RelayChain) => {
  if (!relaySmoldotChains[name].chain) {
    relaySmoldotChains[name].chain = createChain(
      name,
      relaySmoldotChains[name].chainSpec,
    )
  }
  return relaySmoldotChains[name].chain
}

// Pre-initialize all relay chains
relayChains.forEach(getRelayChain)

export interface SmoldotSource {
  type: "chainSpec"
  id: string
  value: {
    chainSpec: string
    relayChain?: RelayChain
  }
}

export function createSmoldotSource(
  id: string,
  relayChain?: string,
): Promise<SmoldotSource> {
  if (id in relaySmoldotChains) {
    return relaySmoldotChains[id as RelayChain].chainSpec.then((chainSpec) => ({
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
        relayChain: relayChain || parsed.relayChain || parsed.relay_chain,
      },
    }
  })
}

export function getSmoldotProvider(source: SmoldotSource): JsonRpcProvider {
  const chain = source.value.relayChain
    ? createChain(
        source.id,
        source.value.chainSpec,
        getRelayChain(source.value.relayChain),
      )
    : createChain(source.id, source.value.chainSpec)

  return withLogsRecorder((v) => console.debug(v), getSmProvider(chain))
}
