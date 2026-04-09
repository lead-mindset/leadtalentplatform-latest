'use client'
import { useEffect, useState } from 'react'

function LocalDate({ isoString }: { isoString: string }) {
  const [formatted, setFormatted] = useState('...')

  useEffect(() => {
    const date = new Date(isoString)
    setFormatted(
      date.toLocaleString('es-PE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Lima',
      })
    )
  }, [isoString])

  return <p className="text-sm text-muted-foreground">{formatted}</p>
}

export default LocalDate