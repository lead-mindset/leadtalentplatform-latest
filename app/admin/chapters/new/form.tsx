'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Building2, CheckCircle2, GraduationCap, MapPin } from 'lucide-react'
import { createChapter } from '../actions'

export function CreateChapterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    university: '',
    city: '',
    region: '',
  })

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await createChapter({
        id: formData.id.trim().toLowerCase().replace(/\s+/g, '-'),
        name: formData.name.trim(),
        university: formData.university.trim(),
        city: formData.city.trim() || undefined,
        region: formData.region.trim() || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/admin/chapters')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          Chapter created successfully! Redirecting...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="id">
          Chapter ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="id"
          type="text"
          placeholder="e.g., lima-2024"
          value={formData.id}
          onChange={(e) => handleChange('id', e.target.value)}
          required
          disabled={isLoading}
          minLength={2}
          maxLength={50}
          pattern="[a-z0-9-]+"
        />
        <p className="text-xs text-muted-foreground">
          Unique identifier (lowercase letters, numbers, and hyphens only)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Chapter Name <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="e.g., LEAD Lima"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            disabled={isLoading}
            className="pl-10"
            minLength={2}
            maxLength={100}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The display name for this chapter
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="university">
          University <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="university"
            type="text"
            placeholder="e.g., Universidad Nacional Mayor de San Marcos"
            value={formData.university}
            onChange={(e) => handleChange('university', e.target.value)}
            required
            disabled={isLoading}
            className="pl-10"
            minLength={2}
            maxLength={200}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The university associated with this chapter
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="city"
              type="text"
              placeholder="e.g., Lima"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={isLoading}
              className="pl-10"
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            type="text"
            placeholder="e.g., Lima"
            value={formData.region}
            onChange={(e) => handleChange('region', e.target.value)}
            disabled={isLoading}
            maxLength={100}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading || !formData.id || !formData.name || !formData.university}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Create Chapter
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}