import { isEnumComplex } from "@/utils/shape"
import { ViewEnum } from "@codec-components"
import { Marker } from "../common/Markers"
import { useSubtreeFocus } from "../common/SubtreeFocus"

export const CEnum: ViewEnum = ({ value, inner, shape, path }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return inner
  }

  const isComplexShape = isEnumComplex(shape, value.type)
  return (
    <div className="flex flex-col">
      <Marker id={[...path, value.type]} />
      <div className="flex flex-row flex-wrap text-sm items-center gap-2">
        <div>{value.type}</div>
        {!isComplexShape && inner}
      </div>
      {isComplexShape && <div className="flex flex-col pt-1 ">{inner}</div>}
    </div>
  )
}
