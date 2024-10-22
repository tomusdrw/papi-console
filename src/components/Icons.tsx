import { ReactSVG, Props } from "react-svg"
import focusSvg from "./icons/focus.svg"
import enumSvg from "./icons/enum.svg"
import binarySvg from "./icons/binary.svg"
import { useEffect, useRef } from "react"
import { Ban, Binary, Braces, CircleHelp, Hash, List, User } from "lucide-react"
import { LookupEntry } from "@polkadot-api/metadata-builders"

const customIcon =
  (url: string) =>
  ({ size = 16, ...props }: Omit<Props, "ref" | "src"> & { size?: number }) => {
    const ref = useRef<SVGSVGElement | null>(null)

    useEffect(() => {
      if (!ref.current) return
      ref.current.setAttribute("width", String(size))
      ref.current.setAttribute("height", String(size))
    }, [size])

    return (
      <ReactSVG
        {...props}
        src={url}
        beforeInjection={(svg) => {
          ref.current = svg
          svg.setAttribute("width", String(size))
          svg.setAttribute("height", String(size))
        }}
      />
    )
  }

export const Focus = customIcon(focusSvg)
export const Enum = customIcon(enumSvg)
export const BinaryEdit = customIcon(binarySvg)

export const TypeIcons = {
  list: List,
  enum: Enum,
  primitive: Hash,
  binary: Binary,
  account: User,
  object: Braces,
  maybe: CircleHelp,
  void: Ban,
}
export type TypeIcon = keyof typeof TypeIcons

export const lookupToType: Record<LookupEntry["type"], TypeIcon> = {
  primitive: "primitive",
  void: "void",
  compact: "primitive",
  bitSequence: "binary",
  AccountId32: "account",
  AccountId20: "account",
  tuple: "list",
  struct: "object",
  sequence: "list",
  array: "list",
  option: "maybe",
  result: "maybe",
  enum: "enum",
}
