import { requireRecruiter } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Mail, User, Phone } from 'lucide-react';

export default async function CompanySettingsPage() {
  const { user } = await requireRecruiter();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Revisa los datos de tu cuenta y organización.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la organización</CardTitle>
          <CardDescription>Datos asociados a tu acceso de empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{user.company?.name}</p>
              <p className="text-sm text-muted-foreground">Nombre de la organización</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>Datos de la cuenta con acceso a talento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input id="name" value={user.name ?? ''} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={user.email} disabled />
            </div>
          </div>

          {user.phone && (
            <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input id="phone" value={user.phone} disabled />
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Para actualizar tu información, contacta a la persona administradora.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
