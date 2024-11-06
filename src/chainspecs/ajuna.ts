export const chainSpec = JSON.stringify({
  name: "Ajuna Polkadot",
  id: "ajuna_polkadot",
  chainType: "Live",
  bootNodes: [
    "/dns4/boot-node.helikon.io/tcp/8510/p2p/12D3KooWA1zjoSfN1CWRMY4nRxD94sSnNAj8UkhD7tsh4K6rwYSX",
    "/dns4/boot-node.helikon.io/tcp/8512/wss/p2p/12D3KooWA1zjoSfN1CWRMY4nRxD94sSnNAj8UkhD7tsh4K6rwYSX",
    "/dns4/node-7135141363928633344-0.p2p.onfinality.io/tcp/20256/ws/p2p/12D3KooWS8wVu6hmDwZvqDXJWnBX5sKb9edR1HWv5hYKD1Ysc2ud",
    "/dns4/node-7163299142418038784-0.p2p.onfinality.io/tcp/20806/ws/p2p/12D3KooWKNTJ5zQr3SK2DphVxEzbBWW9wSqd64ruad1uiiZd6E1Y",
    "/dns/ajuna.boot.stake.plus/tcp/30332/wss/p2p/12D3KooWRyAHbMPNL7CuQtm987a6iLKftME3eQpVqBC6fUsjWuof",
    "/dns/ajuna.boot.stake.plus/tcp/31332/wss/p2p/12D3KooWLXSQdRNS5EXuhpFYiRKHufRsQtb64t4CYj2ah7zx86jA",
    "/dns/rpc-para.ajuna.network/tcp/30332/p2p/12D3KooWLFfa4J2T3JGZft74q3Wu6kSYHPJHNzLsVhdLPGbAZ9Wf",
    "/dns/rpc-para.ajuna.network/tcp/30333/ws/p2p/12D3KooWLFfa4J2T3JGZft74q3Wu6kSYHPJHNzLsVhdLPGbAZ9Wf",
    "/dns/ajuna-polkadot-boot-ng.dwellir.com/tcp/443/wss/p2p/12D3KooWAPXggzmvxX8pefwGMNXDzUwigHEKCmrwZzMpySJbYwUK",
    "/dns/ajuna-polkadot-boot-ng.dwellir.com/tcp/30363/p2p/12D3KooWAPXggzmvxX8pefwGMNXDzUwigHEKCmrwZzMpySJbYwUK",
    "/dns/ajuna-polkadot-boot-ng.dwellir.com/tcp/443/wss/p2p/12D3KooWAPXggzmvxX8pefwGMNXDzUwigHEKCmrwZzMpySJbYwUK",
    "/dns/ajuna-bootnode.radiumblock.com/tcp/30333/p2p/12D3KooWCfjWNEmYcGJwF8S1xizhSHyFHwwDLmQxQCr2Wu9JUTYw",
    "/dns/ajuna-bootnode.radiumblock.com/tcp/30336/wss/p2p/12D3KooWCfjWNEmYcGJwF8S1xizhSHyFHwwDLmQxQCr2Wu9JUTYw",
  ],
  properties: { ss58Format: 1328, tokenDecimals: 12, tokenSymbol: "AJUN" },
  relay_chain: "polkadot",
  para_id: 2051,
  codeSubstitutes: {},
  genesis: {
    stateRootHash:
      "0x6e666a1df855628a99876f9f876b94d6d20a397fb1b5d92a3747df75e29c61b1",
  },
})
