import { EditSequence, NOTIN } from "@codec-components"
import { CirclePlus } from "lucide-react"
import { twMerge as clsx } from "tailwind-merge"
import { useSubtreeFocus } from "../common/SubtreeFocus"
import { ListItem } from "./ListItem"

export const CSequence: EditSequence = ({
  innerComponents,
  value,
  onValueChanged,
  path,
}) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return innerComponents[Number(sub)]
  }

  const addItem = () => {
    const curr = value !== NOTIN ? value.slice() : []

    curr.push(NOTIN)
    onValueChanged([...curr])
  }

  const removeItem = (idx: number) => {
    const curr = value !== NOTIN ? value.slice() : []
    curr.splice(idx, 1)
    onValueChanged([...curr])
  }

  return (
    <div>
      <ul>
        {innerComponents.map((item, idx) => (
          <ListItem
            key={idx}
            idx={idx}
            onDelete={() => {
              removeItem(idx)
            }}
            path={[...path, String(idx)]}
          >
            {item}
          </ListItem>
        ))}
      </ul>
      <button
        className={clsx(
          "flex flex-row gap-2 border rounded-2xl py-1 px-3 mt-3",
          "hover:border-polkadot-400 hover:text-polkadot-400 hover:cursor-pointer",
        )}
        onClick={addItem}
      >
        add item <CirclePlus strokeWidth="1" />
      </button>
    </div>
  )
}
