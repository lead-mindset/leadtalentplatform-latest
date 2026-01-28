'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WelcomeCardProps {
  recruiterEmail: string
  onCompleteProfile: () => void
}

export default function WelcomeCard({ recruiterEmail, onCompleteProfile }: WelcomeCardProps) {
  return (
    <Card className="max-w-md w-full mx-auto mt-20">
      <CardHeader>
        <CardTitle>Welcome, {recruiterEmail}!</CardTitle>
        <CardDescription>
          You have successfully joined the company. Complete your profile to start recruiting.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={onCompleteProfile}>Complete Profile</Button>
      </CardContent>
    </Card>
  )
}
