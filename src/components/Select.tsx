import { useState } from "react"
import { twMerge as clsx } from "tailwind-merge"
import { ChevronDown, CheckIcon } from "lucide-react"
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxButton,
} from "@headlessui/react"

export const SearchableSelect = <T,>({
  value,
  setValue,
  options,
}: {
  value: T
  setValue: (val: T | null) => void
  options: { value: T; text: string }[]
}) => {
  const [query, setQuery] = useState("")

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return option.text.toLowerCase().includes(query.toLowerCase())
        })

  return (
    <>
      <Combobox
        value={value}
        onChange={(value) => setValue(value)}
        onClose={() => setQuery("")}
      >
        <div className="flex flex-row p-2 rounded border border-polkadot-200 text-white bg-black">
          <ComboboxInput
            className="text-ellipsis overflow-hidden whitespace-nowrap focus:outline-none"
            displayValue={(option: T) =>
              options.find((_option) => _option.value === option)?.text ?? ""
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Select"
          />
          <ComboboxButton className="group">
            <ChevronDown className="size-4 " />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom start"
          transition
          className={clsx(
            "max-h-96 rounded bg-black p-1 empty:invisible mt-2 -ml-4",
            "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0",
          )}
        >
          {filteredOptions
            .sort((a, b) => a.text.localeCompare(b.text))
            .map((option, idx) => (
              <ComboboxOption
                key={idx}
                value={option.value}
                className="group flex cursor-default items-center gap-2 rounded py-1.5 px-3 select-none data-[focus]:bg-white/10"
              >
                <CheckIcon className="invisible size-4 group-data-[selected]:visible" />
                <div className="text-sm text-white">{option.text}</div>
              </ComboboxOption>
            ))}
        </ComboboxOptions>
      </Combobox>
    </>
  )
}
