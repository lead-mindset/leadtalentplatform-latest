import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "../sidebar"
import { LogoutButton } from "../../logout-button"
import { Badge } from "../badge"

interface BaseSidebarProps {
  userName: string
  userEmail?: string
  userRole?: string
  children: React.ReactNode
}

export default function BaseSidebar({ userName, userEmail, userRole, children }: BaseSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div>
          <p>{userName}</p>
          <p>{userEmail}</p>
          <Badge>{userRole}</Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>{children}</SidebarContent>

      <SidebarFooter>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
