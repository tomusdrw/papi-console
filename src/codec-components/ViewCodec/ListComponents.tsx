import { ViewArray, ViewSequence, ViewTuple } from "@codec-components"
import { useStateObservable } from "@react-rxjs/core"
import { FC, PropsWithChildren, ReactNode } from "react"
import { ListItem } from "../common/ListItem"
import { isActive$ } from "../common/paths.state"
import { useSubtreeFocus } from "../common/SubtreeFocus"
import { CopyChildBinary } from "./CopyBinary"
import { ChildProvider } from "./TitleContext"

const ListItemComponent: FC<
  PropsWithChildren<{
    idx: number
    path: string[]
  }>
> = ({ idx, path, children }) => {
  const pathStr = path.join(".")
  const isActive = useStateObservable(isActive$(pathStr))

  return (
    <ChildProvider titleElement={null}>
      <ListItem
        idx={idx}
        path={path}
        actions={
          <div className="flex-1 text-right">
            <CopyChildBinary visible={isActive} />
          </div>
        }
      >
        {children}
      </ListItem>
    </ChildProvider>
  )
}

const ListComponent: FC<{
  innerComponents: ReactNode[]
  path: string[]
}> = ({ innerComponents, path }) => {
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return innerComponents[Number(sub)]
  }

  return (
    <ul className="w-full">
      {innerComponents.map((jsx, idx) => (
        <ListItemComponent key={idx} idx={idx} path={[...path, String(idx)]}>
          {jsx}
        </ListItemComponent>
      ))}
    </ul>
  )
}

export const CArray: ViewArray = ListComponent
export const CSequence: ViewSequence = ListComponent
export const CTuple: ViewTuple = ListComponent
