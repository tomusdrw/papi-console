import { ButtonHTMLAttributes, forwardRef } from "react"
import { twMerge } from "tailwind-merge"

export const ActionButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    className={twMerge(
      "text-primary-foreground bg-primary/90 px-3 py-1",
      "cursor-pointer select-none hover:bg-primary/100",
      props.disabled && "opacity-50 pointer-events-none",
      props.className,
    )}
  />
))
