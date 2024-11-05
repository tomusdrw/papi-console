import * as ToggleGroup from "@radix-ui/react-toggle-group"
import { FC, ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export const ButtonGroup: FC<{
  items: Array<{
    value: string
    content: ReactNode
    disabled?: boolean
  }>
  value: string
  onValueChange: (value: string) => void
  btnWidth?: number
}> = ({ items, value, onValueChange, btnWidth }) => {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      className="inline-flex border border-polkadot-700"
    >
      {items.map(({ value, content, disabled }) => (
        <ToggleGroup.Item
          value={value}
          key={value}
          className={twMerge(
            "text-polkadot-600 px-3 py-1",
            "hover:text-polkadot-500",
            "data-[state=on]:bg-polkadot-700 data-[state=on]:text-white",
            disabled && "opacity-50 pointer-events-none",
          )}
          disabled={disabled}
          style={{
            minWidth: btnWidth,
          }}
        >
          {content}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
