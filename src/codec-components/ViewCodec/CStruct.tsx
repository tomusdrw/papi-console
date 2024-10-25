import { ExpandBtn } from "@/components/Expand"
import { getFinalType } from "@/utils/shape"
import { ViewStruct } from "@codec-components"
import { useStateObservable } from "@react-rxjs/core"
import React from "react"
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

const StructItem: React.FC<{
  name: string
  children: React.ReactNode
  path: string[]
  type?: string
}> = ({ name, children, path, type }) => {
  const pathStr = path.join(".")
  const isActive = useStateObservable(isActive$(pathStr))
  const isExpanded = !useStateObservable(isCollapsed$(pathStr))

  return (
    <li
      className={twMerge(
        "flex flex-col transition-all duration-300",
        isActive && "backdrop-brightness-150",
      )}
      onMouseEnter={() => setHovered({ id: pathStr, hover: true })}
      onMouseLeave={() => setHovered({ id: pathStr, hover: false })}
    >
      <Marker id={path} />
      <span
        onClick={() => toggleCollapsed(pathStr)}
        className="cursor-pointer flex select-none items-center py-1 gap-1"
      >
        <ItemMarker />
        <ExpandBtn expanded={isExpanded} />
        {name}
        {type && (
          <div className="ml-1">
            <span className="text-slate-400 text-xs">({type})</span>
          </div>
        )}
      </span>
      <div
        className={clsx(
          "flex flex-row pl-4 pr-2 pb-2",
          isExpanded ? "" : "hidden",
        )}
      >
        {children}
      </div>
    </li>
  )
}

export const CStruct: ViewStruct = ({ innerComponents, path, shape }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    const field = Object.entries(innerComponents).find(([key]) => key === sub)
    return field?.[1]
  }

  return (
    <ul className="flex flex-col border-l border-polkadot-700">
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
