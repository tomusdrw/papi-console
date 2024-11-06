import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStateObservable } from "@react-rxjs/core"
import {
  Network,
  networkCategories,
  onChangeChain,
  selectedChain$,
} from "@/chain.state"

export function NetworkSwitcher() {
  const [open, setOpen] = useState(false)
  const selectedChain = useStateObservable(selectedChain$)
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(
    selectedChain.network,
  )
  const [selectedRpc, setSelecteRpc] = useState<string>(
    selectedChain.endpoint ?? "light-client",
  )

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network)
    setSelecteRpc(
      network.lightclient
        ? "light-client"
        : Object.values(network.endpoints)[0],
    )
  }

  const handleConfirm = () => {
    setOpen(false)
    onChangeChain({
      network: selectedNetwork,
      endpoint: selectedRpc,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {selectedNetwork.display}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch Network</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search networks..." />
          <CommandList>
            <CommandEmpty>No networks found.</CommandEmpty>
            <ScrollArea className="h-[260px]">
              {networkCategories.map((category) => (
                <CommandGroup key={category.name} heading={category.name}>
                  {category.networks.map((network) => (
                    <CommandItem
                      key={network.id}
                      onSelect={() => handleNetworkSelect(network)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedNetwork.id === network.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {network.display}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </ScrollArea>
          </CommandList>
        </Command>
        {selectedNetwork && (
          <Accordion type="single" collapsible className="w-full -mt-3">
            <AccordionItem value="connection-options">
              <AccordionTrigger>Connection Options</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[155px] rounded-lg border p-2">
                  <RadioGroup>
                    {selectedNetwork.lightclient ? (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="light-client"
                          id="light-client"
                          checked={selectedRpc === "light-client"}
                          onClick={() => setSelecteRpc("light-client")}
                        />
                        <Label htmlFor="light-client">
                          Light Client (smoldot)
                        </Label>
                      </div>
                    ) : null}
                    {Object.entries(selectedNetwork.endpoints).map(
                      ([rpcName, url]) => (
                        <div key={url} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={url}
                            id={url}
                            checked={selectedRpc === url}
                            onClick={() => setSelecteRpc(url)}
                          />
                          <Label htmlFor={url}>{rpcName}</Label>
                        </div>
                      ),
                    )}
                  </RadioGroup>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <Button
          onClick={handleConfirm}
          disabled={!selectedNetwork || selectedRpc == null}
        >
          Confirm Selection
        </Button>
      </DialogContent>
    </Dialog>
  )
}
