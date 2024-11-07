import { ExpandBtn } from "@/components/Expand"
import { getFinalType } from "@/utils/shape"
import { EditStruct } from "@codec-components"
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
        isActive && "bg-slate-900 bg-opacity-50",
      )}
      onMouseEnter={() => setHovered({ id: pathStr, hover: true })}
      onMouseLeave={() => setHovered({ id: pathStr, hover: false })}
    >
      <Marker id={path} />
      <span
        onClick={() => toggleCollapsed(pathStr)}
        className="cursor-pointer flex select-none items-center py-1 gap-1"
      >
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

export const CStruct: EditStruct = ({ innerComponents, path, shape }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    const field = Object.entries(innerComponents).find(([key]) => key === sub)
    return field?.[1]
  }

  return (
    <div className="flex flex-col text-left">
      <ul className="flex flex-col">
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
    </div>
  )
}
