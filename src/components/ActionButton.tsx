import { ButtonHTMLAttributes, FC } from "react"
import { twMerge } from "tailwind-merge"

export const ActionButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = (
  props,
) => (
  <button
    {...props}
    className={twMerge(
      "text-polkadot-0 bg-polkadot-700 px-3 py-1",
      "cursor-pointer select-none hover:bg-polkadot-500",
      props.disabled && "opacity-50 pointer-events-none",
      props.className,
    )}
  />
)
