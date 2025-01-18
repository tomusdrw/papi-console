import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "./components/Tooltip.tsx"
import "./index.css"
import { ThemeProvider } from "./ThemeProvider.tsx"
import JamApp from "./JaamApp.tsx"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <TooltipProvider>
          <JamApp />
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
