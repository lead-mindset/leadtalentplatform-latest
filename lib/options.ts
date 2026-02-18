export const SKILL_OPTIONS = [
  { value: 'javascript', icon: '⚡', category: 'Technical', key: 'javascript' },
  { value: 'python', icon: '🐍', category: 'Technical', key: 'python' },
  { value: 'dataanalysis', icon: '📊', category: 'Technical', key: 'dataAnalysis' },
  { value: 'uxui', icon: '🎨', category: 'Design', key: 'uxui' },
  { value: 'aiml', icon: '🤖', category: 'Technical', key: 'aiml' },
  { value: 'leadership', icon: '👥', category: 'Soft Skills', key: 'leadership' },
  { value: 'publicspeaking', icon: '🎤', category: 'Soft Skills', key: 'publicSpeaking' },
  { value: 'projectmanagement', icon: '📋', category: 'Soft Skills', key: 'projectManagement' },
] as const

export const GENDER_VALUES = [
  "man",
  "woman", 
  "non_binary",
  "prefer_not_to_say",
] as const

export const LEAD_ROLE_VALUES = [
  "president",
  "vicepresident",
  "treasurer",
  "leadership_director",
  "academic_excellence_director",
  "female_empowerment_director",
  "professional_development_director",
  "community_impact_director",
  "chapter_development_director",
  "lead_academy_director",
  "participant",
  "other",
] as const

export const LEAD_CHAPTER_VALUES = [
  "leadpucp",
  "leadunmsm",
  "leadutec",
  "leadpacifico",
  "leadvillareal",
  "leaduni",
  "leadupc",
  "leadupn",
  "leadtecsup",
  "leadutp",
] as const

export const AVAILABILITY_VALUES = [
  "not_available",
  "full_time",
  "part_time",
  "internship",
] as const

export const CAREER_VALUES = [
  "biology",
  "biotechnology",
  "biochemistry",
  "environmental_science",
  "computer_science",
  "physical_sciences",
  "mathematical_sciences",
  "statistics",
  "genetics",
  "microbiology",
  "chemistry",
  "geology",
  "geophysics",
  "systems_engineering",
  "software_engineering",
  "computer_engineering",
  "data_science",
  "cybersecurity",
  "artificial_intelligence",
  "civil_engineering",
  "industrial_engineering",
  "mechanical_engineering",
  "electronic_engineering",
  "electrical_engineering",
  "chemical_engineering",
  "telecommunications_engineering",
  "mining_engineering",
  "environmental_engineering",
  "biomedical_engineering",
  "mathematics",
  "physics",
  "bioinformatics",
  "nanotechnology",
  "architecture",
  "medical_technology",
  "other",
] as const


export function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-chart-3 text-primary-foreground'
    case 'editor':
      return 'bg-chart-2 text-primary-foreground'
    case 'recruiter':
      return 'bg-chart-1 text-primary-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
