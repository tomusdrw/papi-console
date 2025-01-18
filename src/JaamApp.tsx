import { Navigate, Route, Routes } from "react-router-dom"
import { Header } from "./pages/Header"
import {Jam } from "./pages/Jam"

export default function JamApp() {
  return (
    <div className="w-full max-w-screen-lg h-screen bg-background flex flex-col">
      <Header />
      <Routes>
        <Route path="jam/*" element={<Jam />} />
        <Route path="*" element={<Navigate to="/jam" replace />} />
      </Routes>
    </div>
  )
}
