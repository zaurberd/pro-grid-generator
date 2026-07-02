import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface CheckboxProps extends React.ComponentProps<"input"> {
  label?: string
}

function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <label
      htmlFor={checkboxId}
      className="flex items-center cursor-pointer"
    >
      <span className="relative inline-block h-5 w-5">
        <input
          type="checkbox"
          id={checkboxId}
          data-slot="checkbox"
          className={cn(
            "peer h-5 w-5 cursor-pointer transition-all appearance-none rounded",
            "bg-input/80 border border-input",
            "checked:bg-primary checked:border-primary",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <span className="absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </span>
      {label && (
        <span className="ml-2 text-sm font-medium text-foreground">
          {label}
        </span>
      )}
    </label>
  )
}

export { Checkbox }
