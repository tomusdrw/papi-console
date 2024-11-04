import {
  availableExtensions$,
  onToggleExtension,
  selectedExtensions$,
} from "@/accounts.state"
import { Label } from "@/components/ui/label"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStateObservable } from "@react-rxjs/core"

export const ExtensionProvider: React.FC = () => {
  const availableExtensions = useStateObservable(availableExtensions$)
  const selectedExtensions = useStateObservable(selectedExtensions$)

  if (availableExtensions.length === 0)
    return <div>No extension provider detected</div>

  return (
    <>
      <Label>Click on the extension name to toggle it:</Label>
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
      </TabsList>
    </>
  )
}
