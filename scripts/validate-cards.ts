import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { cardSchema } from '../src/content/schema'

const dir = join(process.cwd(), 'src/content/cards')
const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))

let failed = 0
const ids = new Set<string>()

for (const file of files) {
  const id = file.replace(/\.ya?ml$/, '')
  if (ids.has(id)) {
    console.error(`✗ ${file}  id 重复: ${id}`)
    failed++
    continue
  }
  ids.add(id)

  const raw = yaml.load(readFileSync(join(dir, file), 'utf8'))
  const result = cardSchema.safeParse(raw)
  if (!result.success) {
    console.error(`✗ ${file}`)
    for (const issue of result.error.issues) {
      console.error(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    }
    failed++
  }
}

if (failed > 0) {
  console.error(`\n内容校验失败：${failed} 个文件有问题\n`)
  process.exit(1)
}

console.log(`✓ 内容校验通过：${files.length} 张卡`)
