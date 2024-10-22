import { metadata$ } from "@/chain.state"
import { state, useStateObservable } from "@react-rxjs/core"
import { map } from "rxjs"
import { EditMode } from "./EditMode"

const extrinsicProps$ = state(
  metadata$.pipe(
    map((metadata) => ({
      metadata,
      codecType:
        "call" in metadata.extrinsic
          ? metadata.extrinsic.call
          : // TODO v14 is this one?
            metadata.extrinsic.type,
    })),
  ),
  null,
)

export const Extrinsics = () => {
  const extrinsicProps = useStateObservable(extrinsicProps$)

  if (!extrinsicProps) {
    return <div>Loading metadata...</div>
  }

  return (
    <div className="flex flex-col">
      <div>Extrinsics</div>
      <EditMode
        {...extrinsicProps}
        initialValue="0x630b040101010031323334353637383934353631363531363531363531363531363531353631350100000108000100002c00000000080000000000"
      />
    </div>
  )
}
