import {
  Arrow,
  Content,
  Portal,
  Provider,
  Root,
  Trigger,
} from "@radix-ui/react-tooltip"
import { ComponentProps, FC, PropsWithChildren, ReactNode } from "react"

export const TooltipProvider: FC<PropsWithChildren> = ({ children }) => (
  <Provider delayDuration={500}>{children}</Provider>
)

export const Tooltip: FC<
  PropsWithChildren & {
    content: ReactNode
  } & ComponentProps<typeof Root>
> = ({ children, content, ...props }) =>
  content ? (
    <Root {...props}>
      <Trigger asChild>{children}</Trigger>
      <Portal>
        <Content className="bg-white rounded py-1 px-2 shadow">
          {content}
          <Arrow className="fill-white stroke-white" />
        </Content>
      </Portal>
    </Root>
  ) : (
    children
  )
