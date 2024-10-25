import { ExpandBtn } from "@/components/Expand"
import { getFinalType } from "@/utils/shape"
import { ViewStruct } from "@codec-components"
import { useStateObservable } from "@react-rxjs/core"
import React, { useContext, useState } from "react"
import { twMerge as clsx, twMerge } from "tailwind-merge"
import { Marker } from "../common/Markers"
import { useSubtreeFocus } from "../common/SubtreeFocus"
import {
  isActive$,
  isCollapsed$,
  setHovered,
  toggleCollapsed,
} from "../common/paths.state"
import { ItemMarker } from "../EditCodec/Tree/codec-components"
import { ChildProvider, TitleContext } from "./TitleContext"
import { CopyChildBinary, useReportBinary } from "./CopyBinary"

const StructItem: React.FC<{
  name: string
  children: React.ReactNode
  path: string[]
  type?: string
}> = ({ name, children, path }) => {
  const pathStr = path.join(".")
  const isActive = useStateObservable(isActive$(pathStr))
  const isExpanded = !useStateObservable(isCollapsed$(pathStr))
  const hasParentTitle = !!useContext(TitleContext)
  const [titleElement, setTitleElement] = useState<HTMLElement | null>(null)

  return (
    <li
      className={twMerge(
        "flex flex-col transition-all duration-300",
        isActive && "backdrop-brightness-150",
      )}
      onMouseEnter={() => setHovered({ id: pathStr, hover: true })}
      onMouseLeave={() => setHovered({ id: pathStr, hover: false })}
    >
      <ChildProvider titleElement={titleElement}>
        <Marker id={path} />
        <span
          onClick={() => toggleCollapsed(pathStr)}
          className="cursor-pointer flex select-none items-center py-1 gap-1"
        >
          {hasParentTitle && <ItemMarker />}
          <ExpandBtn expanded={isExpanded} />
          <span className="flex items-center gap-1" ref={setTitleElement}>
            <span className="opacity-75">{name}</span>
          </span>
          <div className="flex-1 text-right">
            <CopyChildBinary visible={isActive} />
          </div>
        </span>
        <div
          className={clsx(
            "flex flex-row pl-4 pb-2",
            isExpanded ? "" : "hidden",
          )}
        >
          {children}
        </div>
      </ChildProvider>
    </li>
  )
}

export const CStruct: ViewStruct = ({
  innerComponents,
  path,
  shape,
  encodedValue,
}) => {
  useReportBinary(encodedValue)
  const focus = useSubtreeFocus()
  const hasParentTitle = !!useContext(TitleContext)
  const sub = focus.getNextPath(path)
  if (sub) {
    const field = Object.entries(innerComponents).find(([key]) => key === sub)
    return field?.[1]
  }

  return (
    <ul
      className={twMerge(
        "flex flex-col w-full",
        hasParentTitle && "border-l border-polkadot-700",
      )}
    >
      {Object.entries(innerComponents).map(([name, jsx]) => (
        <StructItem
          name={name}
          key={name}
          path={[...path, name]}
          type={getFinalType(shape, name)}
        >
          {jsx}
        </StructItem>
      ))}
    </ul>
  )
}
