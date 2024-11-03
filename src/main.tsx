import { RemoveSubscribe, Subscribe } from "@react-rxjs/core"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { merge } from "rxjs"
import App from "./App.tsx"
import { dynamicBuilder$ } from "./chain.state.ts"
import { TooltipProvider } from "./components/Tooltip.tsx"
import "./index.css"
import { explorer$ } from "./pages/Explorer"

createRoot(document.getElementById("root")!).render(
  <Subscribe source$={merge(dynamicBuilder$, explorer$)}>
    <RemoveSubscribe>
      <StrictMode>
        <BrowserRouter>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </BrowserRouter>
      </StrictMode>
    </RemoveSubscribe>
  </Subscribe>,
)
