---
description: Install dependencies and start the dev server
---

# /install

Install project dependencies, set up database, and start development server.

## Steps

### 1. Install & Setup
`ash
# 1. Install dependencies
bun install

# 2. Push database schema
bun run db:push

# 3. Start dev server
bun run dev
`

### 2. Verify
- [ ] Dependencies installed without errors
- [ ] Database schema pushed
- [ ] Dev server started at expected URL
- [ ] Application loads in browser

### 3. Report
`markdown
## Installation Complete

### Status
- Dependencies: installed
- Database: schema pushed
- Dev server: http://localhost:3000

### Next Steps
1. Open browser at http://localhost:3000
2. Verify application loads
3. Run /prime skill to load codebase context
`
