import { CircleDot, Eye, MessageSquareWarning } from "lucide-react"
import type { OperationalStatus } from "../data/expedients"
import { Badge } from "./system"

export function StatusBadge({ status }: { status: OperationalStatus }) {
  if (status === "En revisión") {
    return (
      <Badge tone="blue">
        <Eye aria-hidden="true" size={13} />
        {status}
      </Badge>
    )
  }

  if (status === "Con observaciones") {
    return (
      <Badge tone="amber">
        <MessageSquareWarning aria-hidden="true" size={13} />
        {status}
      </Badge>
    )
  }

  return (
    <Badge tone="neutral">
      <CircleDot aria-hidden="true" size={13} />
      {status}
    </Badge>
  )
}
