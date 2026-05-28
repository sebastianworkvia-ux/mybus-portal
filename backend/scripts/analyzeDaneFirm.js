import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const content = fs.readFileSync(path.join(__dirname, '../dane-firm.csv'), 'utf8')
const lines = content.split('\n').filter(l => l.trim())
console.log('dane-firm.csv wierszy:', lines.length - 1)
const countries = {}
for (let i = 1; i < lines.length; i++) {
  const c = lines[i].split(';')[9]?.trim() || 'BRAK'
  countries[c] = (countries[c] || 0) + 1
}
Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(v, 'x', JSON.stringify(k)))
