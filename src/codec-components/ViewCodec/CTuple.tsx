import { ViewTuple } from "@codec-components"
import { useSubtreeFocus } from "../common/SubtreeFocus"

export const CTuple: ViewTuple = ({ innerComponents, path }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return innerComponents[Number(sub)]
  }

  return (
    <ul className="flex flex-col ml-5">
      {innerComponents.map((jsx, idx) => (
        <li key={idx}>{jsx}</li>
      ))}
    </ul>
  )
}
