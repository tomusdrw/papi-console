import { unsafeApi$ } from "@/chain.state"
import { ActionButton } from "@/components/ActionButton"
import { onNexTx } from "@/pages/Transactions"
import { useStateObservable } from "@react-rxjs/core"
import { Binary } from "polkadot-api"
import { FC } from "react"
import { noop } from "rxjs"
import { AccountProvider, selectedAccount$ } from "./AccountProvider"
import { ExtensionProvider } from "./ExtensionProvider"

const SignAndSubmit: FC<{ callData: string; onClose: () => void }> = ({
  callData,
  onClose,
}) => {
  const account = useStateObservable(selectedAccount$)

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
                  onClose()
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
