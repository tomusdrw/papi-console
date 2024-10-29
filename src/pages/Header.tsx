import { Link } from "react-router-dom"

export const Header = () => (
  <div className="flex bg-polkadot-900 p-2 items-center flex-shrink-0">
    <h1 className="text-xl flex-1">PAPI Console</h1>
    <div className="flex flex-row items-center justify-end gap-2">
      <Link
        to="/storage"
        className="text-polkadot-200 border-polkadot-200 cursor-pointer border-b hover:text-polkadot-500 hover:border-polkadot-500"
      >
        Storage
      </Link>
      <Link
        to="/constants"
        className="text-polkadot-200 border-polkadot-200 cursor-pointer border-b hover:text-polkadot-500 hover:border-polkadot-500"
      >
        Constants
      </Link>
      <Link
        to="/runtimeCalls"
        className="text-polkadot-200 border-polkadot-200 cursor-pointer border-b hover:text-polkadot-500 hover:border-polkadot-500"
      >
        Runtime Calls
      </Link>
      <Link
        to="/extrinsics"
        className="text-polkadot-200 border-polkadot-200 cursor-pointer border-b hover:text-polkadot-500 hover:border-polkadot-500"
      >
        Extrinsics
      </Link>
    </div>
  </div>
)
