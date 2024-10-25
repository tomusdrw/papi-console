import { Enum } from "@/components/Icons"
import { isComplex } from "@/utils/shape"
import { EditEnum, NOTIN } from "@codec-components"
import { useContext, useLayoutEffect, useState } from "react"
import { Portal } from "react-portal"
import { scrollToMarker } from "../../common/scroll"
import { useSubtreeFocus } from "../../common/SubtreeFocus"
import {
  ChildrenProviders,
  ItemTitle,
  TitleContext,
  useReportBinaryStatus,
} from "./codec-components"

export const CEnum: EditEnum = ({
  value,
  inner,
  path,
  shape,
  type,
  encodedValue,
  onValueChanged,
  decode,
}) => {
  const className =
    "text-polkadot-200 hover:text-polkadot-400 cursor-pointer whitespace-nowrap [&:not(:first-child)]:ml-1"

  const titleContainer = useContext(TitleContext)
  const titleElement = useAppendTitle(titleContainer, className)
  useReportBinaryStatus(type, encodedValue, onValueChanged, decode)
  // We create a title element for the children below if we don't have a parent.
  const [newElement, setNewElement] = useState<HTMLElement | null>(null)
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return inner
  }

  if (value === NOTIN) return null

  const innerPath = [...path, value.type]
  if (titleContainer) {
    return (
      <>
        {titleElement ? (
          <Portal node={titleElement}>
            <span onClick={() => scrollToMarker(innerPath)}>
              / {value.type}
            </span>
          </Portal>
        ) : null}
        <ChildrenProviders
          titleElement={titleContainer ?? newElement}
          onValueChange={() => {}}
        >
          {inner}
        </ChildrenProviders>
      </>
    )
  }

  const innerShape = shape.value[value.type]
  const innerEntry =
    innerShape.type === "lookupEntry" ? innerShape.value : innerShape
  const innerIsComplex = isComplex(innerEntry.type)
  return (
    <div className="border-l border-polkadot-700">
      <ItemTitle
        icon={Enum}
        path={innerPath.join(".")}
        titleRef={setNewElement}
        onNavigate={() => scrollToMarker(innerPath)}
        onZoom={innerIsComplex ? () => focus.setFocus(innerPath) : undefined}
        binaryStatus={{
          encodedValue,
          onValueChanged,
          decode,
          type,
        }}
      >
        {value.type}
      </ItemTitle>
      <ChildrenProviders
        titleElement={titleContainer ?? newElement}
        onValueChange={() => {}}
      >
        <div className="pl-6">{inner}</div>
      </ChildrenProviders>
    </div>
  )
}

export const useAppendTitle = (
  container: HTMLElement | null,
  className: string,
) => {
  const [element, setElement] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!container) return

    const element = document.createElement("span")
    container.appendChild(element)
    setElement(element)

    return () => element.remove()
  }, [container])
  useLayoutEffect(() => {
    if (!element) return
    element.className = className ?? ""
  }, [element, className])

  return element
}
