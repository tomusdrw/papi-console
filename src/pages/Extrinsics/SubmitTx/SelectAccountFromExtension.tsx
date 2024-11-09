import { unsafeApi$ } from "@/chain.state"
import { ActionButton } from "@/components/ActionButton"
import { onNexTx } from "@/pages/Transactions"
import { useStateObservable } from "@react-rxjs/core"
import { Binary } from "polkadot-api"
import { FC, useState } from "react"
import { noop } from "rxjs"
import { AccountProvider, selectedAccount$ } from "./AccountProvider"
import { ExtensionProvider } from "./ExtensionProvider"
import { Spinner } from "@/components/Icons"
import { twMerge } from "tailwind-merge"

const SignAndSubmit: FC<{ callData: string; onClose: () => void }> = ({
  callData,
  onClose,
}) => {
  const account = useStateObservable(selectedAccount$)
  const [isSigning, setIsSigning] = useState(false)

  if (!account) return null

  return (
    <ActionButton
      onClick={() => {
        let nClients = 0
        const subscription = unsafeApi$.subscribe((client) => {
          nClients++
          if (nClients > 1) return subscription.unsubscribe()
          setIsSigning(true)
          client
            .txFromCallData(Binary.fromHex(callData))
            .then((x) => {
              if (nClients === 1)
                return x.sign(account.polkadotSigner).then((s) => {
                  onClose()
                  if (nClients === 1) onNexTx(s)
                })
            }, noop)
            .finally(() => {
              subscription.unsubscribe()
              setIsSigning(false)
            })
        })
      }}
      className="flex gap-2 items-center justify-center"
    >
      <span className={twMerge("ml-4", isSigning ? "" : "mr-6")}>
        Sign and Submit
      </span>
      {isSigning && <Spinner size={16} />}
    </ActionButton>
  )
}

export default function SelectAccountFromExtension(props: {
  callData: string
  onClose: () => void
}) {
  return (
    <>
      <ExtensionProvider />
      <AccountProvider />
      <SignAndSubmit {...props} />
    </>
  )
}
