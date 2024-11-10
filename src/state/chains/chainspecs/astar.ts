export const chainSpec = JSON.stringify({
  name: "Astar",
  id: "astar",
  chainType: "Live",
  bootNodes: [
    "/ip4/109.238.14.102/tcp/30333/ws/p2p/12D3KooWPH9bkXRkPcHGKd7DSgYfLLVE1Cw7QNr2M4kKwdVwGZXN",
    "/ip4/199.85.208.179/tcp/30333/ws/p2p/12D3KooWMwrAXhSuzCrtiwfVQuB4oLAZj3CLxVzMrqBJB4GKjnQa",
    "/ip4/131.153.79.50/tcp/30333/ws/p2p/12D3KooWB2XY9Uw1ZR8qtD5DQ4TKivJkQdqM5c6hyY9ixSDAASBa",
    "/dns/bootnode-01.astar.network/tcp/443/wss/p2p/12D3KooWPH9bkXRkPcHGKd7DSgYfLLVE1Cw7QNr2M4kKwdVwGZXN",
    "/dns/bootnode-02.astar.network/tcp/443/wss/p2p/12D3KooWMwrAXhSuzCrtiwfVQuB4oLAZj3CLxVzMrqBJB4GKjnQa",
    "/dns/bootnode-03.astar.network/tcp/443/wss/p2p/12D3KooWB2XY9Uw1ZR8qtD5DQ4TKivJkQdqM5c6hyY9ixSDAASBa",
    "/dns4/astar-bootnode-1-tls.p2p.onfinality.io/tcp/443/wss/p2p/12D3KooWERrQFE8ss7zYfcHp8ULVCc1N7gur7GqZ8ESuZB1Nmioh",
  ],
  properties: { ss58Format: 5, tokenDecimals: 18, tokenSymbol: "ASTR" },
  relayChain: "polkadot",
  paraId: 2006,
  consensusEngine: null,
  codeSubstitutes: {},
  badBlocks: [],
  genesis: {
    stateRootHash:
      "0xc9451593261d67c47e14c5cbefeeffff5b5a1707cf81800becfc79e6df354da9",
  },
})
