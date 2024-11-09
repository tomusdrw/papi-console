import { cn } from "@/utils/cn"
import { Check, ChevronsUpDown } from "lucide-react"
import React, { useState } from "react"
import { Button } from "./ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

export const SearchableSelect = <T,>({
  value,
  setValue,
  options,
}: {
  value: T | null
  setValue: (val: T | null) => void
  options: { value: T; text: string }[]
}) => {
  const [open, setOpen] = useState(false)

  const onTriggerKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key.length === 1) {
      setOpen(true)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onKeyDown={onTriggerKeyDown}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex w-52 justify-between overflow-hidden bg-input border border-border"
        >
          {value ? (
            <span className="text-ellipsis overflow-hidden">
              {options.find((option) => option.value === value)?.text}
            </span>
          ) : (
            <span className="opacity-80">Select…</span>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Filter…" />
          <CommandList>
            <CommandGroup>
              {options.map((option, i) => (
                <CommandItem
                  key={i}
                  value={option.text}
                  onSelect={() => {
                    setValue(option.value)
                    setOpen(false)
                  }}
                >
                  {option.text}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
