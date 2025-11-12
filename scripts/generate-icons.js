import sharp from 'sharp'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const publicDir = join(rootDir, 'public')

const inputImagePath = process.argv[2] 
  ? join(rootDir, process.argv[2])
  : join(publicDir, 'icon-source.png')

const sizes = [192, 512]

async function generateIcons() {

  if (!existsSync(inputImagePath)) {
    console.error(`Файл не найден: ${inputImagePath}`)
    console.log('\nИспользование:')
    console.log('  node scripts/generate-icons.js [путь_к_изображению]')
    console.log('\nПримеры:')
    console.log('  node scripts/generate-icons.js public/art/common/game-cover.webp')
    console.log('  node scripts/generate-icons.js public/art/collections/base-cover.webp')
    process.exit(1)
  }

  console.log(`Обработка изображения: ${inputImagePath}`)

  try {
    const image = sharp(inputImagePath)
    const metadata = await image.metadata()
    
    console.log(`   Размер оригинала: ${metadata.width}x${metadata.height}`)
    console.log(`   Формат: ${metadata.format}`)

    const outputPrefix = process.argv[3] || 'icon'

    for (const size of sizes) {
      await image
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .png()
        .toFile(join(publicDir, `${outputPrefix}-${size}x${size}.png`))
      console.log(`Создана иконка: ${outputPrefix}-${size}x${size}.png`)
    }

    console.log('Все иконки успешно созданы!')
    console.log(`   Расположение: ${publicDir}/`)
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error.message)
    process.exit(1)
  }
}

generateIcons()

