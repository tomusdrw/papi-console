import { ExpandBtn } from "@/components/Expand"
import { useStateObservable } from "@react-rxjs/core"
import { Dot, Trash2 } from "lucide-react"
import { twMerge as clsx, twMerge } from "tailwind-merge"
import { Marker } from "./Markers"
import {
  isActive$,
  isCollapsed$,
  setHovered,
  toggleCollapsed,
} from "./paths.state"
import { ReactNode } from "react"

export const ListItem: React.FC<{
  idx: number
  children: React.ReactNode
  path: string[]
  onDelete?: () => void
  actions?: ReactNode
  inline?: boolean
}> = ({ idx, onDelete, children, path, actions, inline }) => {
  const pathStr = path.join(".")
  const isActive = useStateObservable(isActive$(pathStr))
  const isCollapsed = useStateObservable(isCollapsed$(pathStr))

  const title = inline ? (
    <div className="flex items-center">
      <Marker id={path} />
      <span className="flex items-center py-1 gap-1 mr-2">
        <Dot size={16} />
        Item {idx + 1}.
      </span>
      <div className="flex-1">{children}</div>
      {onDelete ? (
        <button
          className="cursor-pointer text-gray-200 ml-2 hover:text-polkadot-400"
          onClick={() => onDelete()}
        >
          <Trash2 size={16} />
        </button>
      ) : null}
      {actions}
    </div>
  ) : (
    <div className="flex items-center">
      <Marker id={path} />
      <span
        className="cursor-pointer flex items-center py-1 gap-1"
        onClick={() => toggleCollapsed(pathStr)}
      >
        <ExpandBtn expanded={!isCollapsed} />
        Item {idx + 1}.
      </span>
      {onDelete ? (
        <button
          className="cursor-pointer text-gray-200 ml-2 hover:text-polkadot-400"
          onClick={() => onDelete()}
        >
          <Trash2 size={16} />
        </button>
      ) : null}
      {actions}
    </div>
  )

  return (
    <li
      className={twMerge(
        "flex flex-col mb-1",
        isActive && "bg-slate-900 bg-opacity-50",
      )}
      onMouseEnter={() => setHovered({ id: pathStr, hover: true })}
      onMouseLeave={() => setHovered({ id: pathStr, hover: false })}
    >
      {title}
      {inline ? null : (
        <div
          className={clsx(
            "flex-row p-2 items-center border border-slate-500",
            isCollapsed ? "hidden" : "",
          )}
        >
          {children}
        </div>
      )}
    </li>
  )
}
