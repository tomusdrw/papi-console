import { ActionButton } from "@/components/ActionButton"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Binary, HexString } from "polkadot-api"
import React, { createContext, useContext, useState } from "react"
import { ExtensionProvider } from "./ExtensionProvider"
import { AccountProvider } from "./AccountProvider"
import { useSelectedAccount } from "./accountCtx"
import { unsafeApi$ } from "@/chain.state"
import { noop } from "rxjs"
import { toHex } from "@polkadot-api/utils"
import { onNexTx } from "@/pages/Transactions"

const CallDataCtx = createContext("")
const OnCloseCtx = createContext(noop)

const SignAndSubmit = () => {
  const account = useSelectedAccount()
  const callData = useContext(CallDataCtx)
  const close = useContext(OnCloseCtx)
  return (
    <ActionButton
      onClick={() => {
        let nClients = 0
        const subscription = unsafeApi$.subscribe((client) => {
          nClients++
          if (nClients > 1) return subscription.unsubscribe()
          client
            .txFromCallData(Binary.fromHex(callData))
            .then((x) => {
              if (nClients === 1)
                return x.sign(account.polkadotSigner).then((s) => {
                  close()
                  if (nClients === 1) onNexTx(s)
                })
            }, noop)
            .finally(() => {
              subscription.unsubscribe()
            })
        })
      }}
    >
      Sign and Submit
    </ActionButton>
  )
}

const SelectAccountFromExtension = () => {
  return (
    <ExtensionProvider>
      <AccountProvider>
        <SignAndSubmit />
      </AccountProvider>
    </ExtensionProvider>
  )
}

export const ExtrinsicModal: React.FC<{
  callData: Uint8Array | HexString | undefined
}> = ({ callData }) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton disabled={callData == null}>
          Submit extrinsic
        </ActionButton>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create TX</DialogTitle>
        <CallDataCtx.Provider
          value={callData instanceof Uint8Array ? toHex(callData) : callData!}
        >
          <OnCloseCtx.Provider value={() => setOpen(false)}>
            <SelectAccountFromExtension />
          </OnCloseCtx.Provider>
        </CallDataCtx.Provider>
      </DialogContent>
    </Dialog>
  )
}
