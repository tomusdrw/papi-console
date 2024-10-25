import { ViewSequence } from "@codec-components"
import { useSubtreeFocus } from "../common/SubtreeFocus"
import { ListItem } from "../common/ListItem"

export const CSequence: ViewSequence = ({ innerComponents, path }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return innerComponents[Number(sub)]
  }

  return (
    <ul>
      {innerComponents.map((item, idx) => (
        <ListItem key={idx} idx={idx} path={[...path, String(idx)]}>
          {item}
        </ListItem>
      ))}
    </ul>
  )
}
