import { ExpandBtn } from "@/components/Expand"
import { useStateObservable } from "@react-rxjs/core"
import { Trash2 } from "lucide-react"
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
}> = ({ idx, onDelete, children, path, actions }) => {
  const pathStr = path.join(".")
  const isActive = useStateObservable(isActive$(pathStr))
  const isCollapsed = useStateObservable(isCollapsed$(pathStr))

  return (
    <li
      className={twMerge(
        "flex flex-col mb-1",
        isActive && "backdrop-brightness-150",
      )}
      onMouseEnter={() => setHovered({ id: pathStr, hover: true })}
      onMouseLeave={() => setHovered({ id: pathStr, hover: false })}
    >
      <div className="flex items-stretch">
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
      <div
        className={clsx(
          "flex-row p-2 items-center border border-polkadot-700 rounded ",
          isCollapsed ? "hidden" : "",
        )}
      >
        {children}
      </div>
    </li>
  )
}
