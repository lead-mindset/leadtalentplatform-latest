"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { Segmented } from "@/components/ui/segmented";
import { Field } from "@/components/form";
import { PhotoUpload } from "@/components/photo-upload";
import { combine, email, required, url } from "@/lib/validators";

const SKILL_POOL = [
  "Python", "JavaScript", "TypeScript", "SQL", "React", "Node.js", "HTML/CSS", "Git",
  "C++", "Java", "Go", "Data Analysis", "Machine Learning", "Figma", "UI/UX", "AWS",
  "Docker", "Excel", "Marketing Digital", "R", "Linux",
];

const ROLE_POOL = [
  "Software Engineer", "Data Science", "Product Manager", "UI/UX", "DevOps",
  "Research", "Marketing", "Community",
];

const YEARS = ["2027", "2028", "2029", "2030"];

const CHAPTERS = ["LEAD Perú", "LEAD UTEC", "LEAD México", "LEAD Colombia"];

const STEPS = ["Tú", "Formación", "Skills", "Objetivos", "Listo"];

export function ProfileWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("2028");
  const [english, setEnglish] = useState("intermedio");
  const [chapter, setChapter] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [availability, setAvailability] = useState("internship");
  const [workAuth, setWorkAuth] = useState("si");
  const [errors, setErrors] = useState<{ name?: string; linkedin?: string; university?: string; skills?: string }>({});
  const [triedNext, setTriedNext] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const addCustomSkill = () => {
    const value = customSkill.trim();
    if (value && !skills.includes(value)) setSkills([...skills, value]);
    setCustomSkill("");
  };

  const validateStep = (): boolean => {
    const next: typeof errors = {};
    if (step === 0) {
      next.name = required()(name);
      next.linkedin = linkedin.trim() ? combine(url())(linkedin) : undefined;
    } else if (step === 1) {
      next.university = required()(university);
    } else if (step === 2) {
      next.skills = skills.length === 0 ? "Elige al menos una skill" : undefined;
    }
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const next = () => {
    if (validateStep()) {
      setTriedNext(false);
      setStep(Math.min(4, step + 1));
    } else {
      setTriedNext(true);
    }
  };

  const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "LE";

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <div className="text-center">
        <h1 className="text-h1 font-bold tracking-tight">Tu espacio en LEAD</h1>
        <p className="mx-auto mt-1 max-w-md text-small text-muted-foreground">
          Cuéntanos quién eres en menos de 2 minutos.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex flex-1 items-center gap-1.5">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-1">
              <div className={`h-1 rounded-full ${index <= step ? "brand-gradient" : "bg-muted"}`} />
              <p className={`text-center text-caption ${index === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface mt-5 rounded-xl border border-border/60 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <PhotoUpload value={photo} onChange={setPhoto} initials={initials} label="Tu foto (opcional)" />
            <Field label="¿Cómo te llamas?" htmlFor="w-name" required error={errors.name}>
              <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" autoFocus />
            </Field>
            <Field label="¿Dónde estás?" htmlFor="w-loc" hint="Ciudad, país">
              <Input id="w-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lima, Perú" />
            </Field>
            <Field label="LinkedIn" htmlFor="w-li" hint="Opcional" error={errors.linkedin}>
              <Input id="w-li" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/tu-usuario" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="¿A qué universidad vas?" htmlFor="w-uni" required error={errors.university}>
              <Input id="w-uni" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Tu universidad" autoFocus />
            </Field>
            <Field label="¿Qué estudias?" htmlFor="w-major">
              <Input id="w-major" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Carrera" />
            </Field>
            <div>
              <p className="text-small font-medium">¿Cuándo te gradúas?</p>
              <Segmented options={YEARS.map((value) => ({ value, label: value }))} value={year} onChange={setYear} className="mt-1.5 w-full" />
            </div>
            <div>
              <p className="text-small font-medium">¿Tu inglés?</p>
              <Segmented
                options={[{ value: "basico", label: "Básico" }, { value: "intermedio", label: "Intermedio" }, { value: "avanzado", label: "Avanzado" }, { value: "fluido", label: "Fluido" }]}
                value={english}
                onChange={setEnglish}
                className="mt-1.5 w-full"
              />
            </div>
            <div>
              <p className="text-small font-medium">¿De qué capítulo eres? <span className="text-muted-foreground">(opcional)</span></p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CHAPTERS.map((item) => (
                  <FilterChip key={item} active={chapter === item} onClick={() => setChapter(chapter === item ? "" : item)}>
                    {item}
                  </FilterChip>
                ))}
                <FilterChip active={chapter === ""} onClick={() => setChapter("")}>No estoy en un capítulo</FilterChip>
              </div>
              <p className="mt-1.5 text-caption text-muted-foreground">
                Sin capítulo aún, tu perfil lo revisa el equipo global de LEAD.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-small font-medium">¿Qué sabes hacer? Toca todo lo que aplique.</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_POOL.map((skill) => (
                <FilterChip key={skill} active={skills.includes(skill)} onClick={() => toggle(skills, setSkills, skill)}>
                  {skill}
                </FilterChip>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} placeholder="Agrega una skill" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }} />
              <Button type="button" variant="outline" onClick={addCustomSkill} aria-label="Agregar skill"><Plus className="size-4" /></Button>
            </div>
            {triedNext && errors.skills && (
              <p className="text-caption text-destructive-light" role="alert">{errors.skills}</p>
            )}
            {skills.length > 0 && (
              <div>
                <p className="text-small font-medium">Tu top {Math.min(3, skills.length)} más fuerte</p>
                <p className="text-caption text-muted-foreground">Toca para marcar las 3 que más dominas.</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <FilterChip key={skill} active={topSkills.includes(skill)} onClick={() => toggle(topSkills, setTopSkills, skill)}>
                      {topSkills.includes(skill) ? `★ ${skill}` : skill}
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-small font-medium">¿Qué te interesa? (opcional)</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ROLE_POOL.map((role) => (
                  <FilterChip key={role} active={roles.includes(role)} onClick={() => toggle(roles, setRoles, role)}>
                    {role}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-small font-medium">¿Qué disponibilidad buscas?</p>
              <Segmented
                options={[{ value: "internship", label: "Prácticas" }, { value: "part-time", label: "Part-time" }, { value: "full-time", label: "Full-time" }]}
                value={availability}
                onChange={setAvailability}
                className="mt-1.5 w-full"
              />
            </div>
            <div>
              <p className="text-small font-medium">¿Autorización de trabajo?</p>
              <Segmented options={[{ value: "si", label: "Sí" }, { value: "no", label: "Aún no" }]} value={workAuth} onChange={setWorkAuth} className="mt-1.5 w-full" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <p className="bg-gradient-to-r from-brand-purple-light to-brand-rose bg-clip-text text-h1 font-bold tracking-tight text-transparent">
              Tu futuro en LEAD empieza aquí
            </p>
            <p className="mx-auto mt-1 max-w-sm text-small text-muted-foreground">
              {name.split(" ")[0] || "Amiga"}, las empresas te encontrarán pronto.
            </p>
            <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-small text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-brand-purple-light" />
              {chapter
                ? `En revisión. El e-board de ${chapter} validará tu perfil antes de que sea visible.`
                : "En revisión. El equipo global de LEAD validará tu perfil antes de que sea visible."}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => router.push("/perfil")}>
                Ver mi perfil <ArrowRight className="size-3.5" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/inicio")}>Explorar la comunidad</Button>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="size-3.5" /> Atrás
            </Button>
            <p className="text-caption text-muted-foreground">Paso {step + 1} de 5</p>
            <Button type="button" onClick={next}>
              {step === 3 ? "Terminar" : "Continuar"} <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {step === 2 && (
        <p className="mt-3 flex items-center justify-center gap-1 text-caption text-muted-foreground">
          <Check className="size-3.5 text-success" /> Cuantas más skills, más apareces en las búsquedas de empresas.
        </p>
      )}
    </div>
  );
}