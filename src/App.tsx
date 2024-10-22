import { Navigate, Route, Routes } from "react-router-dom"
import { Header } from "./pages/Header"
import { Extrinsics } from "./pages/Extrinsics"

export default function App() {
  return (
    <div className="w-full max-w-screen-lg h-screen bg-polkadot-950 flex flex-col">
      <Header />

      <Routes>
        <Route path="extrinsics/*" element={<Extrinsics />} />
        <Route path="*" element={<Navigate to="/extrinsics" replace />} />
      </Routes>
    </div>
  )
}
