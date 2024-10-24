import { ActionButton } from "@/components/ActionButton"
import { FC, useState } from "react"

export const StorageDecode: FC = () => {
  const [value, setValue] = useState("")

  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-polkadot-100 p-2 rounded tabular-nums text-polkadot-800"
        placeholder="Enter hex …"
      />
      <ActionButton>Decode</ActionButton>
    </div>
  )
}
