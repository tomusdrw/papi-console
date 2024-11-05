import { Spinner, WalletConnect } from "@/components/Icons"
import { Label } from "@/components/ui/label"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  availableExtensions$,
  onToggleExtension,
  selectedExtensions$,
} from "@/extension-accounts.state"
import {
  toggleWalletConnect,
  walletConnectStatus$,
} from "@/walletconnect.state"
import { useStateObservable } from "@react-rxjs/core"

export const ExtensionProvider: React.FC = () => {
  const availableExtensions = useStateObservable(availableExtensions$)
  const selectedExtensions = useStateObservable(selectedExtensions$)
  const walletConnectStatus = useStateObservable(walletConnectStatus$)

  if (availableExtensions.length === 0)
    return <div>No extension provider detected</div>

  return (
    <>
      <Label>Click on the provider name to toggle it:</Label>
      <TabsList>
        {availableExtensions.map((extensionName) => (
          <TabsTrigger
            className="mx-1"
            onClick={() => onToggleExtension(extensionName)}
            active={selectedExtensions.has(extensionName)}
            key={extensionName}
          >
            {extensionName}
          </TabsTrigger>
        ))}
        <TabsTrigger
          className="mx-1 flex gap-1"
          onClick={() => toggleWalletConnect()}
          active={walletConnectStatus.type === "connected"}
        >
          {walletConnectStatus.type === "connecting" ? (
            <Spinner size={16} className="text-sky-500" />
          ) : (
            <WalletConnect />
          )}{" "}
          Wallet Connect
        </TabsTrigger>
      </TabsList>
    </>
  )
}
