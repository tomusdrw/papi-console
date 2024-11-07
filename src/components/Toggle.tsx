import * as Toggle from "@radix-ui/react-toggle"

const SliderToggle: React.FC<{
  isToggled: boolean
  toggle: () => void
}> = ({ isToggled, toggle }) => {
  return (
    <Toggle.Root
      pressed={isToggled}
      onPressedChange={() => toggle()}
      className={`relative w-8 h-5 rounded-full p-0.5 transition-colors border
        ${isToggled ? "border-slate-500" : "border-slate-500"}`}
      aria-label="Toggle"
    >
      <span
        className={`block w-3 h-3 border rounded-full shadow-md transform transition-transform
          ${isToggled ? "translate-x-3 bg-white border-white" : "translate-x-0 border-slate-500"}`}
      />
    </Toggle.Root>
  )
}

export default SliderToggle
