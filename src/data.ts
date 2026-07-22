export type StorageSnapshot = {
  id: number
  captured_at: string
  category: string
  bytes_used: number
  object_count: number
  source: string
}

const categories = [
  { name: '视频', bytes: 812_000_000_000, objects: 2_160 },
  { name: '图片', bytes: 438_000_000_000, objects: 18_420 },
  { name: '备份', bytes: 326_000_000_000, objects: 184 },
  { name: '文档', bytes: 164_000_000_000, objects: 32_180 },
  { name: '日志', bytes: 98_000_000_000, objects: 894_000 },
]

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function createDemoData(days = 90): StorageSnapshot[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: days }, (_, reverseIndex) => {
    const dayOffset = days - reverseIndex - 1
    const date = new Date(today)
    date.setDate(today.getDate() - dayOffset)

    return categories.map((category, categoryIndex) => {
      const growth = 1 - dayOffset * (0.0023 + categoryIndex * 0.00012)
      const wave = 0.985 + seededNoise(dayOffset * 7 + categoryIndex) * 0.03
      return {
        id: reverseIndex * categories.length + categoryIndex,
        captured_at: date.toISOString(),
        category: category.name,
        bytes_used: Math.round(category.bytes * growth * wave),
        object_count: Math.round(category.objects * (1 - dayOffset * 0.0018) * wave),
        source: 'demo',
      }
    })
  }).flat()
}
