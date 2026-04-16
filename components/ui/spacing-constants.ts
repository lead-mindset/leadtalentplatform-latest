export const SPACING = {
  // Padding scale
  px: {
    xs: 'px-2',
    sm: 'px-4', 
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12'
  },
  py: {
    xs: 'py-2',
    sm: 'py-4',
    md: 'py-6', 
    lg: 'py-8',
    xl: 'py-12'
  },
  p: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  },
  
  container: {
    sm: 'max-w-2xl',
    md: 'max-w-3xl', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  },
  
  // Gap spacing
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  }
} as const

export const RESPONSIVE_PADDING = {
  standard: 'px-4 sm:px-6 lg:px-8',
  narrow: 'px-4 sm:px-6',
  wide: 'px-6 lg:px-8',
  full: 'px-4 sm:px-6 lg:px-12'
} as const

export const SECTION_SPACING = {
  tight: 'py-8 sm:py-12',
  standard: 'py-12 sm:py-16',
  loose: 'py-16 sm:py-20',
  extra: 'py-20 sm:py-24'
} as const
