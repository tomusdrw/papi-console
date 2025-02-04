import { Route, Routes } from "react-router-dom"
import { Jam } from "./pages/Jam"

export default function JamApp() {
  return (
    <div className="w-full max-w-screen-lg h-screen bg-background flex flex-col">
      <JamHeader />
      <Routes>
        <Route path="/*" element={<Jam />} />
      </Routes>
    </div>
  )
}

import { Link, useLocation } from "react-router-dom"
import type { FC, PropsWithChildren } from "react"
import { twMerge } from "tailwind-merge"

export const JamHeader = () => (
  <div className="flex p-4 pb-2 items-center flex-shrink-0 gap-2 border-b">
    <div className="flex flex-1 items-center flex-row gap-2 relative">
      <img
        className="w-14 min-w-14 hidden dark:inline-block"
        src="/papi_logo-dark.svg"
        alt="papi-logo"
      />
      <img
        className="w-14 min-w-14 dark:hidden"
        src="/papi_logo-light.svg"
        alt="papi-logo"
      />
      <h1 className="hidden lg:block poppins-regular text-lg">
        papi <span className="poppins-extralight">console</span> for JAM
      </h1>
      <div className="absolute -bottom-1 left-0 lg:bottom-0 lg:right-1 text-right text-sm">
        (alpha)
      </div>
    </div>
    <div className="flex flex-row items-center justify-end px-1 py-1 text-nowrap">
      <NavLink to="/jam">JAM codec</NavLink>
    </div>
  </div>
)

const NavLink: FC<PropsWithChildren<{ to: string }>> = ({ to, children }) => {
  const location = useLocation()
  const active = location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={twMerge(
        "transition-colors text-foreground/75 hover:text-foreground cursor-pointer px-3 py-1 rounded",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-foreground font-bold",
      )}
    >
      {children}
    </Link>
  )
}
