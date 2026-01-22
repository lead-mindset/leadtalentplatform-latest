'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock data - replace with actual API call
const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Profile Approved',
    message: 'Your profile has been approved by your chapter editor',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'info',
    title: 'Resume Uploaded',
    message: 'Your resume has been successfully uploaded',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: 3,
    type: 'warning',
    title: 'Complete Your Profile',
    message: 'Add your skills and LinkedIn profile to improve visibility',
    timestamp: '3 days ago',
    read: true,
  },
]

export default function StudentNotificationsPage() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with your LEAD activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications yet
            </p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-4 border rounded-lg ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="default" className="ml-2">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}