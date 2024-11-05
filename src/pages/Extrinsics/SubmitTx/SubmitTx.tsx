import { unsafeApi$ } from "@/chain.state"
import { ActionButton } from "@/components/ActionButton"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { onNexTx } from "@/pages/Transactions"
import { toHex } from "@polkadot-api/utils"
import { useStateObservable } from "@react-rxjs/core"
import { Binary, HexString } from "polkadot-api"
import React, { createContext, useContext, useState } from "react"
import { noop } from "rxjs"
import { AccountProvider, selectedAccount$ } from "./AccountProvider"
import { ExtensionProvider } from "./ExtensionProvider"

const CallDataCtx = createContext("")
const OnCloseCtx = createContext(noop)

const SignAndSubmit = () => {
  const account = useStateObservable(selectedAccount$)
  const callData = useContext(CallDataCtx)
  const close = useContext(OnCloseCtx)

  if (!account) return null

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
    <>
      <ExtensionProvider />
      <AccountProvider />
      <SignAndSubmit />
    </>
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
      <DialogContent
        onInteractOutside={(evt) => {
          if (
            evt.target instanceof HTMLElement &&
            evt.target.tagName === "WCM-MODAL"
          )
            evt.preventDefault()
        }}
        className="flex flex-col overflow-hidden"
      >
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
