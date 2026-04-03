import raw from './zeta_glossary.csv?raw'

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

export function parseZetaGlossaryCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const terms = []

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = parseCsvLine(line)
    if (parts.length < 4) continue

    const [english, korean, category, notes] = parts
    terms.push({
      id: `zeta-${terms.length + 1}`,
      english,
      korean,
      category,
      notes,
    })
  }

  return terms
}

export const ZETA_GLOSSARY_TERMS = parseZetaGlossaryCsv(raw)
