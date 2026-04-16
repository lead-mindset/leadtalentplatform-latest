import * as React from "react"
import { ChevronDown, ChevronRight, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  icon?: React.ReactNode
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
  icon
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn("border rounded-lg", className)}>
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto font-semibold"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        {isOpen ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
      </Button>
      {isOpen && (
        <div className="p-4 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  )
}

interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
}

export function ExpandableText({ text, maxLength = 200, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>
  }

  return (
    <div className={className}>
      {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      <Button
        variant="link"
        size="sm"
        className="p-0 h-auto ml-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </Button>
    </div>
  )
}

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                index <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            <span className="text-xs mt-1 text-center max-w-20">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

interface AdvancedToggleProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function AdvancedToggle({ title, children, className }: AdvancedToggleProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icons.Settings className="mr-1" />
        {title}
        {isOpen ? <Icons.ChevronUp className="ml-1" /> : <Icons.ChevronDown className="ml-1" />}
      </Button>
      {isOpen && (
        <div className="p-4 border rounded-md bg-muted/50">
          {children}
        </div>
      )}
    </div>
  )
}

interface TabbedContentProps {
  tabs: Array<{
    id: string
    label: string
    content: React.ReactNode
    icon?: React.ReactNode
  }>
  defaultTab?: string
  className?: string
}

export function TabbedContent({ tabs, defaultTab, className }: TabbedContentProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </Button>
        ))}
      </div>
      <div>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
