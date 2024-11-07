import { Link } from "react-router-dom"
import { NetworkSwitcher } from "./Network/Network"

export const Header = () => (
  <div className="flex p-4 pb-2 items-center flex-shrink-0 gap-2">
    <div className="flex flex-1 items-center flex-row gap-2">
      <img
        className="w-14 min-w-14"
        src="/papi_logo-dark.svg"
        alt="papi-logo"
      />
      <h1 className="hidden lg:block poppins-regular text-lg">
        papi <span className="poppins-extralight">console</span>
      </h1>
    </div>
    <NetworkSwitcher />
    <div className="flex flex-row items-center justify-end bg-polkadot-800 px-1 py-1 rounded-full text-nowrap">
      <Link
        to="/explorer"
        className="cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Explorer
      </Link>
      <Link
        to="/storage"
        className="cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Storage
      </Link>
      <Link
        to="/extrinsics"
        className="cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Extrinsics
      </Link>
      <Link
        to="/constants"
        className="cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Constants
      </Link>
      <Link
        to="/runtimeCalls"
        className="cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Runtime Calls
      </Link>
      <Link
        to="/metadata"
        className="cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Metadata
      </Link>
    </div>
  </div>
)
