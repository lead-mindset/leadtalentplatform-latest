import { Card, CardContent } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración administrativa</h1>
        <p className="text-muted-foreground mt-2">
          Define preferencias del sistema y opciones administrativas.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Configuración en preparación</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Las opciones de configuración administrativa estarán disponibles aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
