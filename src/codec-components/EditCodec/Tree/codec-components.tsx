import { BinaryEditModal } from "@/components/BinaryEditButton"
import { BinaryEdit, Focus, TypeIcon, TypeIcons } from "@/components/Icons"
import {
  EditAccountId,
  EditBigNumber,
  EditBool,
  EditBytes,
  EditEthAccount,
  EditNumber,
  EditOption,
  EditPrimitiveComponentProps,
  EditResult,
  EditStr,
  EditVoid,
  NOTIN,
} from "@codec-components"
import { HexString } from "@polkadot-api/substrate-bindings"
import { useStateObservable } from "@react-rxjs/core"
import { Circle } from "lucide-react"
import {
  createContext,
  FC,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { twMerge } from "tailwind-merge"
import { isActive$, setHovered } from "../../common/paths.state"

export const CVoid: EditVoid = () => null

const CPrimitive: FC<EditPrimitiveComponentProps<any>> = ({
  type,
  encodedValue,
  onValueChanged,
  decode,
}) => {
  useReportBinaryStatus(type, encodedValue, onValueChanged, decode)
  return null
}
export const CBool: EditBool = CPrimitive
export const CStr: EditStr = CPrimitive
export const CEthAccount: EditEthAccount = CPrimitive
export const CBigNumber: EditBigNumber = CPrimitive
export const CNumber: EditNumber = CPrimitive
export const CAccountId: EditAccountId = CPrimitive
export const CBytes: EditBytes = CPrimitive

export const COption: EditOption = ({
  value,
  inner,
  type,
  encodedValue,
  onValueChanged,
  decode,
}) => {
  useReportBinaryStatus(type, encodedValue, onValueChanged, decode)

  return value === undefined ? null : (
    <BinaryStatusContext.Provider value={() => {}}>
      {inner}
    </BinaryStatusContext.Provider>
  )
}

export const CResult: EditResult = ({ value, inner }) => (
  <>
    {value !== NOTIN && (value.success ? "ok" : "ko")}-{inner}
  </>
)

export const ItemMarker = () => (
  <span className="text-polkadot-700 translate-y-[-1.5px]">-</span>
)

export const TitleContext = createContext<HTMLElement | null>(null)

export type BinaryStatus = {
  type: "blank" | "partial" | "complete"
  encodedValue: Uint8Array | undefined
  onValueChanged: (value: any | NOTIN) => boolean
  decode: (value: Uint8Array | HexString) => any | NOTIN
}
export const BinaryStatusContext = createContext<
  (status: BinaryStatus) => void
>(() => {})

export const useReportBinaryStatus = (
  type: "blank" | "partial" | "complete",
  encodedValue: Uint8Array | undefined,
  onValueChanged: (value: any | NOTIN) => boolean,
  decode: (value: Uint8Array | HexString) => any | NOTIN,
) => {
  const onBinChange = useContext(BinaryStatusContext)
  useLayoutEffect(
    () => onBinChange({ type, encodedValue, onValueChanged, decode }),
    [type, encodedValue, onValueChanged, decode, onBinChange],
  )
}

export const ChildrenProviders: FC<
  PropsWithChildren<{
    onValueChange: (status: BinaryStatus) => void
    titleElement: HTMLElement | null
  }>
> = ({ onValueChange, titleElement, children }) => (
  <TitleContext.Provider value={titleElement}>
    <BinaryStatusContext.Provider value={onValueChange}>
      {children}
    </BinaryStatusContext.Provider>
  </TitleContext.Provider>
)

export const ItemTitle: FC<
  PropsWithChildren<{
    path: string
    icon: (typeof TypeIcons)[TypeIcon]
    binaryStatus?: BinaryStatus
    onNavigate?: () => void
    titleRef?: (element: HTMLDivElement) => void
    onZoom?: () => void
    actions?: ReactElement
    className?: string
  }>
> = ({
  children,
  path,
  icon: Icon,
  binaryStatus,
  titleRef,
  onNavigate,
  onZoom,
  actions,
  className,
}) => {
  const [binaryOpen, setBinaryOpen] = useState(false)
  const isActive = useStateObservable(isActive$(path))

  // react listeners don't work across portals, we need native listeners
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const element = ref.current
    const onMouseEnter = () => setHovered({ id: path, hover: true })
    const onMouseLeave = () => setHovered({ id: path, hover: false })

    element.addEventListener("mouseenter", onMouseEnter)
    element.addEventListener("mouseleave", onMouseLeave)
    return () => {
      element.removeEventListener("mouseenter", onMouseEnter)
      element.removeEventListener("mouseleave", onMouseLeave)
      onMouseLeave()
    }
  }, [path])

  return (
    <>
      <div
        ref={ref}
        className={twMerge(
          "flex items-center",
          isActive && "bg-polkadot-600 bg-opacity-20",
          className,
        )}
        data-marker={`marker-${path}`}
      >
        <span
          className={twMerge(
            "hover:text-polkadot-400 flex-shrink-0 flex items-center",
            onNavigate && "cursor-pointer",
          )}
          onClick={onNavigate}
        >
          <ItemMarker />
          <Circle
            size={8}
            strokeWidth={4}
            className={twMerge(
              "mr-1",
              binaryStatus?.type === "blank" && "text-red-600",
              binaryStatus?.type === "partial" && "text-orange-600",
              binaryStatus?.type === "complete" && "text-green-600",
              binaryStatus === undefined && "text-slate-600",
            )}
          />
          <Icon size={16} className="text-polkadot-600 mr-1" />
          {children}
        </span>
        <div
          ref={titleRef}
          className="flex flex-1 ml-1 flex-wrap leading-none"
        />
        <div className="visible_when_parent_hover px-1 flex gap-1 items-center">
          {onZoom && binaryStatus && (
            <BinaryEdit
              size={18}
              className={twMerge("cursor-pointer hover:text-polkadot-300")}
              onClick={() => setBinaryOpen(true)}
            />
          )}
          {onZoom && (
            <Focus
              className="cursor-pointer hover:text-polkadot-300"
              onClick={onZoom}
            />
          )}
          {actions}
        </div>
      </div>
      {binaryStatus && (
        <TreeBinaryEditModal
          status={binaryStatus}
          open={binaryOpen}
          path={path}
          onClose={() => setBinaryOpen(false)}
        />
      )}
    </>
  )
}

const TreeBinaryEditModal: FC<{
  status: BinaryStatus
  open: boolean
  path: string
  onClose: () => void
}> = ({ status, path, open, onClose }) => (
  <BinaryEditModal
    decode={status.decode}
    onClose={onClose}
    open={open}
    onValueChange={status.onValueChanged}
    fileName={path.replace(/\./g, "__") || "root"}
    initialValue={status.encodedValue}
    title={path}
  />
)
