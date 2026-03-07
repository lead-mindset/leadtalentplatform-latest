export const SKILL_OPTIONS = [
  // Technical - Programming
  { value: 'javascript', category: 'Technical' },
  { value: 'python', category: 'Technical' },
  { value: 'typescript', category: 'Technical' },
  { value: 'java', category: 'Technical' },
  { value: 'cpp', category: 'Technical' },
  { value: 'sql', category: 'Technical' },
  { value: 'react', category: 'Technical' },
  { value: 'nodejs', category: 'Technical' },

  // Technical - Data & AI
  { value: 'dataAnalysis', category: 'Technical' },
  { value: 'aiml', category: 'Technical' },
  { value: 'machineLearning', category: 'Technical' },
  { value: 'dataVisualization', category: 'Technical' },
  { value: 'powerbi', category: 'Technical' },
  { value: 'excel', category: 'Technical' },

  // Technical - Cloud & DevOps
  { value: 'azure', category: 'Technical' },
  { value: 'aws', category: 'Technical' },
  { value: 'git', category: 'Technical' },
  { value: 'agile', category: 'Technical' },

  // Design
  { value: 'uxui', category: 'Design' },
  { value: 'figma', category: 'Design' },

  // Soft Skills
  { value: 'leadership', category: 'Soft Skills' },
  { value: 'publicSpeaking', category: 'Soft Skills' },
  { value: 'projectManagement', category: 'Soft Skills' },
  { value: 'teamwork', category: 'Soft Skills' },
  { value: 'criticalThinking', category: 'Soft Skills' },
  { value: 'communication', category: 'Soft Skills' },
  { value: 'networking', category: 'Soft Skills' },
  { value: 'mentoring', category: 'Soft Skills' },
  { value: 'eventPlanning', category: 'Soft Skills' },
  { value: 'fundraising', category: 'Soft Skills' },
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
  "leadupntrujillo",
  "leadtecsup",
  "leadutp",
  "leaducsur",
  "leadusil",
  "leadunsa",
  "other",
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
