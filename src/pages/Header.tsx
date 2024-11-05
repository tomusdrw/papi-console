import { Link } from "react-router-dom"

export const Header = () => (
  <div className="flex p-4 pb-0 items-center flex-shrink-0">
    <div className="flex flex-1 items-center flex-row gap-2">
      <img className="w-14 min-w-14" src="/papi_logo-dark.svg" alt="papi-logo" />
      <h1 className="hidden lg:block poppins-regular text-xl">papi <span className="poppins-extralight">console</span></h1>
    </div>
    <div className="flex flex-row items-center justify-end bg-polkadot-800 px-1 py-1 rounded-full">
      <Link
        to="/explorer"
        className="text-polkadot-300 cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Explorer
      </Link>
      <Link
        to="/metadata"
        className="text-polkadot-300 cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Metadata
      </Link>
      <Link
        to="/storage"
        className="text-polkadot-300 cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Storage
      </Link>
      <Link
        to="/constants"
        className="text-polkadot-300 cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Constants
      </Link>
      <Link
        to="/runtimeCalls"
        className="text-polkadot-300 cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Runtime Calls
      </Link>
      <Link
        to="/extrinsics"
        className="text-polkadot-300 cursor-pointer hover:text-polkadot-0 px-3 py-1 hover:bg-polkadot-500 rounded-full"
      >
        Extrinsics
      </Link>
    </div>
  </div>
)
