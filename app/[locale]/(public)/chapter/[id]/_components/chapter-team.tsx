'use client'

const ROLE_COLORS = [
  'text-primary',
  'text-accent',
  'text-success',
  'text-muted-foreground',
]

interface MemberData {
  user_id: string
  major: string
  member_id: string | null
  user: { name: string | null } | { name: string | null }[]
}

function getMemberName(member: MemberData): string {
  const u = Array.isArray(member.user) ? member.user[0] : member.user
  return u?.name || 'Member'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ChapterTeam({ members }: { members: MemberData[] }) {
  if (members.length === 0) return null

  const displayMembers = members.slice(0, 8)

  return (
    <div className="space-y-8">
      <h2 className="!text-2xl sm:!text-3xl font-extrabold tracking-tight">Our Team</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {displayMembers.map((member, i) => {
          const name = getMemberName(member)
          const colorClass = ROLE_COLORS[i % ROLE_COLORS.length]

          return (
            <div
              key={member.user_id}
              className="flex flex-col items-center text-center space-y-3 group"
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                  i === 0
                    ? 'gradient-luminescent'
                    : 'bg-card border border-border'
                }`}
              >
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center border-4 border-background">
                  <span className="text-lg sm:text-xl font-bold text-foreground">
                    {getInitials(name)}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{name}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
                  {member.major}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
