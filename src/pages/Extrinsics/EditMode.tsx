import {
  Marker,
  MarkersContextProvider,
  VisibleWindow,
} from "@/codec-components/common/Markers"
import { synchronizeScroll } from "@/codec-components/common/scroll"
import { SubtreeFocus } from "@/codec-components/common/SubtreeFocus"
import { EditCodec } from "@/codec-components/EditCodec"
import { TreeCodec } from "@/codec-components/EditCodec/Tree/index"
import {
  CodecComponentUpdate,
  CodecComponentValue,
  MetadataType,
} from "@codec-components"
import { useEffect, useRef, useState } from "react"
import { FocusPath } from "./FocusPath"

export const EditMode: React.FC<{
  codecType: number
  metadata: MetadataType
  value: CodecComponentValue
  onUpdate: (value: CodecComponentUpdate) => void
}> = (props) => {
  const { metadata, codecType, value } = props
  const treeRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!listRef.current || !treeRef.current) return
    return synchronizeScroll(listRef.current, treeRef.current)
  }, [])

  const [focusingSubtree, setFocusingSubtree] = useState<string[] | null>(null)

  return (
    <div className="flex flex-col items-start overflow-hidden">
      <FocusPath
        metadata={metadata}
        typeId={codecType}
        value={focusingSubtree}
        onFocus={setFocusingSubtree}
      />
      <div className="px-2">
        {/* This element is presentational only: Adds a connecting border between the FocusPath and the tree below */}
        <div className="border-l border-polkadot-700 h-2 max-sm:border-none" />
      </div>
      <SubtreeFocus
        value={{ callback: setFocusingSubtree, path: focusingSubtree }}
      >
        <MarkersContextProvider>
          <div
            ref={listRef}
            className="flex flex-row overflow-auto w-full gap-2"
          >
            <div
              ref={treeRef}
              className="w-96 sticky top-0 pl-2 pb-16 leading-loose overflow-hidden max-sm:hidden"
            >
              <div className="relative">
                {!value.value ? (
                  <div className="text-sm text-slate-400">(Empty)</div>
                ) : (
                  <TreeCodec {...props} />
                )}
                <VisibleWindow />
              </div>
            </div>
            <div className="flex-1">
              <div className="p-2 rounded bg-polkadot-900">
                <Marker id={[]} />
                <EditCodec {...props} />
              </div>
            </div>
          </div>
        </MarkersContextProvider>
      </SubtreeFocus>
    </div>
  )
}
