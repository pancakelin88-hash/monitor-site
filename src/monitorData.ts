export type MonitorStatus = 'operational' | 'degraded' | 'down'

export type Monitor = {
  id: number
  name: string
  endpoint: string
  kind: string
  region: string
  status: MonitorStatus
  uptime_percent: number
  latency_ms: number
  checks_24h: number
}

export type MonitorCheck = {
  id: number
  monitor_id: number
  checked_at: string
  latency_ms: number
  status_code: number
  ok: boolean
}

export type Incident = {
  id: number
  title: string
  monitor_name: string
  severity: 'minor' | 'major' | 'critical'
  status: 'investigating' | 'monitoring' | 'resolved'
  started_at: string
  resolved_at: string | null
}

const baseMonitors: Omit<Monitor, 'status' | 'uptime_percent' | 'latency_ms' | 'checks_24h'>[] = [
  { id: 1, name: '主站', endpoint: 'app.monitor.site', kind: 'Web', region: 'Seoul' },
  { id: 2, name: '数据 API', endpoint: 'api.monitor.site/v1', kind: 'API', region: 'Singapore' },
  { id: 3, name: '身份认证', endpoint: 'auth.monitor.site', kind: 'Auth', region: 'Tokyo' },
  { id: 4, name: '文件存储', endpoint: 'cdn.monitor.site', kind: 'Storage', region: 'Global' },
]

function noise(seed: number) {
  const value = Math.sin(seed * 91.119 + 17.31) * 43758.5453
  return value - Math.floor(value)
}

export function createDemoMonitorData() {
  const now = new Date()
  const checks: MonitorCheck[] = []

  baseMonitors.forEach((monitor, monitorIndex) => {
    for (let point = 0; point < 288; point += 1) {
      const checkedAt = new Date(now.getTime() - (287 - point) * 5 * 60 * 1000)
      const wave = Math.sin(point / 17 + monitorIndex * 1.6) * 22
      const jitter = noise(point * 5 + monitorIndex) * 34
      const anomaly = point > 205 && point < 211 && monitorIndex === 1
      checks.push({
        id: monitorIndex * 1000 + point,
        monitor_id: monitor.id,
        checked_at: checkedAt.toISOString(),
        latency_ms: Math.round(72 + monitorIndex * 27 + wave + jitter + (anomaly ? 310 : 0)),
        status_code: anomaly ? 503 : 200,
        ok: !anomaly,
      })
    }
  })

  const monitors: Monitor[] = baseMonitors.map((monitor) => {
    const ownChecks = checks.filter((check) => check.monitor_id === monitor.id)
    const okChecks = ownChecks.filter((check) => check.ok)
    return {
      ...monitor,
      status: 'operational',
      uptime_percent: (okChecks.length / ownChecks.length) * 100,
      latency_ms: ownChecks.at(-1)?.latency_ms ?? 0,
      checks_24h: ownChecks.length,
    }
  })

  const incidents: Incident[] = [
    {
      id: 1,
      title: 'API 延迟短时升高',
      monitor_name: '数据 API',
      severity: 'minor',
      status: 'resolved',
      started_at: new Date(now.getTime() - 7.1 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now.getTime() - 6.55 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: '文件存储例行维护',
      monitor_name: '文件存储',
      severity: 'minor',
      status: 'resolved',
      started_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 38 * 60 * 1000).toISOString(),
    },
  ]

  return { monitors, checks, incidents }
}
