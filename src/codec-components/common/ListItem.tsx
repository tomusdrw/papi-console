import { ExpandBtn } from "@/components/Expand"
import { useStateObservable } from "@react-rxjs/core"
import { Trash2 } from "lucide-react"
import { twMerge as clsx } from "tailwind-merge"
import { Marker } from "./Markers"
import { isCollapsed$, toggleCollapsed } from "./paths.state"

export const ListItem: React.FC<{
  idx: number
  children: React.ReactNode
  path: string[]
  onDelete?: () => void
}> = ({ idx, onDelete, children, path }) => {
  const pathStr = path.join(".")
  const isCollapsed = useStateObservable(isCollapsed$(pathStr))

  return (
    <li className="flex flex-col mb-1">
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
