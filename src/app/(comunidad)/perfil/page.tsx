import { Award, Briefcase, CalendarClock, Languages, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ProfileStatusBadge } from "@/components/profile-status-badge";
import { ProfileStrength } from "@/components/profile-strength";
import { CvCard } from "@/components/cv-card";
import { ResourcesCard } from "@/components/resources-card";
import { SocialsCard } from "@/components/socials-card";
import { profile } from "@/lib/data/profile";

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <section className="rounded-xl card-surface ring-1 ring-foreground/10 shadow-sm">
        <div className="p-(--card-spacing)">
          <div className="flex flex-wrap items-center gap-6">
            <InitialsAvatar
              initials={profile.initials}
              color={profile.avatarColor}
              className="size-24 rounded-2xl text-display"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-h1 font-bold tracking-tight">{profile.name}</h1>
              <p className="mt-0.5 text-body-lg text-muted-foreground">{profile.headline}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-small font-medium text-brand-purple-light">
                <Award className="size-3.5" />
                {profile.leadRole} · {profile.leadChapter}
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-small text-muted-foreground">
                <MapPin className="size-3.5" />
                {profile.school} · {profile.major} · {profile.classYear} · {profile.location} ·{" "}
                {profile.gender}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <ProfileStatusBadge status={profile.validationStatus} />
              <Button variant="secondary">Editar perfil</Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-small text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand-purple-light" />
              {profile.workAuth}
            </p>
            <p className="flex items-center gap-1.5">
              <CalendarClock className="size-4 text-brand-purple-light" />
              {profile.availability}
            </p>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brand-purple-light hover:underline"
            >
              <Briefcase className="size-4" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-8">
        <main className="min-w-0 flex-1 space-y-5">
          <ProfileStrength />

          <CvCard />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h3 font-semibold">
                <Languages className="size-4 text-brand-purple-light" /> Idiomas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.languages.map((lang) => (
                <Badge key={lang.name} variant="secondary" className="rounded-full">
                  {lang.name}
                  <span className="ml-1.5 font-normal text-muted-foreground">· {lang.level}</span>
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h3 font-semibold">
                <Sparkles className="size-4 text-brand-purple-light" /> Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill.name} variant="secondary" className="rounded-full">
                  {skill.name}
                  {skill.level && (
                    <span className="ml-1.5 font-normal text-muted-foreground">· {skill.level}</span>
                  )}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </main>

        <aside className="hidden w-80 shrink-0 space-y-5 lg:block">
          <ResourcesCard />
          <SocialsCard />
        </aside>
      </div>
    </div>
  );
}