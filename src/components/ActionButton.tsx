import { ButtonHTMLAttributes, FC } from "react"
import { twMerge } from "tailwind-merge"

export const ActionButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = (
  props,
) => (
  <button
    {...props}
    className={twMerge(
      "text-polkadot-500 border rounded border-polkadot-500 px-2 py-1",
      "cursor-pointer select-none hover:bg-polkadot-500 hover:text-polkadot-200",
      props.disabled && "opacity-50 pointer-events-none",
      props.className,
    )}
  />
)
