import { useSubtreeFocus } from "../common/SubtreeFocus"
import { EditTuple } from "@codec-components"

export const CTuple: EditTuple = ({ innerComponents, path }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return innerComponents[Number(sub)]
  }

  return (
    <>
      <span>Tuple</span>
      <ul className="flex flex-col ml-5">
        {innerComponents.map((jsx, idx) => (
          <li key={idx}>{jsx}</li>
        ))}
      </ul>
    </>
  )
}
