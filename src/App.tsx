import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  CircleDot,
  Cloud,
  Database,
  Gauge,
  GitFork,
  Globe2,
  HardDrive,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
  Triangle,
} from 'lucide-react'
import { createDemoData, type StorageSnapshot } from './data'
import {
  createDemoMonitorData,
  type Incident,
  type Monitor,
  type MonitorCheck,
} from './monitorData'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Page = 'overview' | 'storage' | 'incidents'
type Range = '1h' | '24h' | '7d'

const ranges: { value: Range; label: string; hours: number; bucketMinutes: number }[] = [
  { value: '1h', label: '1 小时', hours: 1, bucketMinutes: 5 },
  { value: '24h', label: '24 小时', hours: 24, bucketMinutes: 60 },
  { value: '7d', label: '7 天', hours: 168, bucketMinutes: 360 },
]

const storagePalette = ['#6df0b8', '#a9f178', '#7ab8ff', '#ffc36c', '#bb9cff']
const demo = createDemoMonitorData()

const compactNumber = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatBytes(bytes: number, digits = 1) {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(exponent > 2 ? digits : 0)} ${units[exponent]}`
}

function formatClock(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0
  const ordered = [...values].sort((a, b) => a - b)
  return ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * ratio))]
}

function App() {
  const [page, setPage] = useState<Page>('overview')
  const [range, setRange] = useState<Range>('24h')
  const [selectedMonitor, setSelectedMonitor] = useState<number | 'all'>('all')
  const [monitors, setMonitors] = useState<Monitor[]>(demo.monitors)
  const [checks, setChecks] = useState<MonitorCheck[]>(demo.checks)
  const [incidents, setIncidents] = useState<Incident[]>(demo.incidents)
  const [storage, setStorage] = useState<StorageSnapshot[]>(() => createDemoData())
  const [dataMode, setDataMode] = useState<'live' | 'demo' | 'error'>(
    isSupabaseConfigured ? 'live' : 'demo',
  )
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function loadAll() {
    if (!supabase) return
    setIsLoading(true)
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [monitorResult, checkResult, incidentResult, storageResult] = await Promise.all([
      supabase.from('monitors').select('id,name,endpoint,kind,region,enabled').eq('enabled', true).order('id'),
      supabase.from('monitor_checks').select('id,monitor_id,checked_at,latency_ms,status_code,ok').gte('checked_at', from).order('checked_at'),
      supabase.from('incidents').select('id,title,monitor_name,severity,status,started_at,resolved_at').order('started_at', { ascending: false }).limit(20),
      supabase.from('storage_snapshots').select('id,captured_at,category,bytes_used,object_count,source').gte('captured_at', from).order('captured_at'),
    ])

    const failed = monitorResult.error || checkResult.error || incidentResult.error
    if (failed || !monitorResult.data?.length || !checkResult.data?.length) {
      setMonitors(demo.monitors)
      setChecks(demo.checks)
      setIncidents(demo.incidents)
      setDataMode(failed ? 'error' : 'demo')
    } else {
      const loadedChecks = checkResult.data as MonitorCheck[]
      const enriched = monitorResult.data.map((row) => {
        const own = loadedChecks.filter((check) => check.monitor_id === row.id)
        const successful = own.filter((check) => check.ok)
        const latest = own.at(-1)
        return {
          ...row,
          status: latest?.ok ? (latest.latency_ms > 500 ? 'degraded' : 'operational') : 'down',
          uptime_percent: own.length ? (successful.length / own.length) * 100 : 0,
          latency_ms: latest?.latency_ms ?? 0,
          checks_24h: own.filter((check) => Date.now() - new Date(check.checked_at).getTime() <= 86_400_000).length,
        } as Monitor
      })
      setMonitors(enriched)
      setChecks(loadedChecks)
      setIncidents((incidentResult.data ?? []) as Incident[])
      setDataMode('live')
    }

    if (storageResult.data?.length) setStorage(storageResult.data as StorageSnapshot[])
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return
    const channel = client
      .channel('monitor-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monitor_checks' }, () => void loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => void loadAll())
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [])

  const rangeConfig = ranges.find((item) => item.value === range) ?? ranges[1]
  const visibleChecks = useMemo(() => {
    const cutoff = Date.now() - rangeConfig.hours * 60 * 60 * 1000
    return checks.filter(
      (check) =>
        new Date(check.checked_at).getTime() >= cutoff &&
        (selectedMonitor === 'all' || check.monitor_id === selectedMonitor),
    )
  }, [checks, rangeConfig.hours, selectedMonitor])

  const latencySeries = useMemo(() => {
    const bucketMs = rangeConfig.bucketMinutes * 60 * 1000
    const groups = new Map<number, number[]>()
    visibleChecks.forEach((check) => {
      const bucket = Math.floor(new Date(check.checked_at).getTime() / bucketMs) * bucketMs
      const values = groups.get(bucket) ?? []
      values.push(Number(check.latency_ms))
      groups.set(bucket, values)
    })
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([timestamp, values]) => ({
        timestamp,
        label: range === '7d'
          ? new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(timestamp)
          : new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(timestamp),
        p50: percentile(values, 0.5),
        p95: percentile(values, 0.95),
      }))
  }, [range, rangeConfig.bucketMinutes, visibleChecks])

  const globalUptime = monitors.length
    ? monitors.reduce((sum, monitor) => sum + monitor.uptime_percent, 0) / monitors.length
    : 0
  const currentLatency = monitors.length
    ? Math.round(monitors.reduce((sum, monitor) => sum + monitor.latency_ms, 0) / monitors.length)
    : 0
  const activeIncidents = incidents.filter((incident) => incident.status !== 'resolved')
  const overallHealthy = monitors.every((monitor) => monitor.status === 'operational') && !activeIncidents.length

  const storageDaily = useMemo(() => {
    const byDay = new Map<string, { day: string; label: string; bytes: number; objects: number }>()
    storage.forEach((snapshot) => {
      const day = snapshot.captured_at.slice(0, 10)
      const current = byDay.get(day) ?? {
        day,
        label: new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(day)),
        bytes: 0,
        objects: 0,
      }
      current.bytes += Number(snapshot.bytes_used)
      current.objects += Number(snapshot.object_count)
      byDay.set(day, current)
    })
    return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
  }, [storage])

  const latestStorageDay = storageDaily.at(-1)?.day
  const latestStorage = useMemo(
    () => storage
      .filter((item) => item.captured_at.slice(0, 10) === latestStorageDay)
      .sort((a, b) => Number(b.bytes_used) - Number(a.bytes_used)),
    [latestStorageDay, storage],
  )
  const totalStorage = latestStorage.reduce((sum, item) => sum + Number(item.bytes_used), 0)
  const totalObjects = latestStorage.reduce((sum, item) => sum + Number(item.object_count), 0)
  const storageStart = storageDaily.at(-30)?.bytes ?? storageDaily[0]?.bytes ?? totalStorage
  const storageChange = storageStart ? ((totalStorage - storageStart) / storageStart) * 100 : 0

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setPage('overview')}>
          <span className="brand-mark"><Activity size={18} /></span>
          <span>MONITOR<span className="brand-dot">.SITE</span></span>
        </button>
        <nav className="main-nav" aria-label="主导航">
          <button className={page === 'overview' ? 'active' : ''} onClick={() => setPage('overview')}>总览</button>
          <button className={page === 'storage' ? 'active' : ''} onClick={() => setPage('storage')}>存储</button>
          <button className={page === 'incidents' ? 'active' : ''} onClick={() => setPage('incidents')}>事件</button>
        </nav>
        <div className="status-cluster">
          <span className={`live-badge ${dataMode}`}>
            <span className="status-dot" />
            {dataMode === 'live' ? 'LIVE' : dataMode === 'error' ? 'FALLBACK' : 'DEMO'}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="刷新实时数据"
            onClick={() => void loadAll()}
            disabled={!supabase || isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {page === 'overview' && (
        <main>
          <section className="hero-monitor">
            <div className={`health-orb ${overallHealthy ? 'healthy' : 'warning'}`} aria-hidden="true">
              <span /><i /><b />
            </div>
            <div className="hero-status">
              <p className="eyebrow"><Radio size={13} /> LIVE INFRASTRUCTURE</p>
              <h1>{overallHealthy ? '所有系统运行正常' : '部分服务需要关注'}</h1>
              <p>实时观测可用性、响应延迟、异常事件与存储增长。</p>
            </div>
            <div className="hero-time">
              <span>最近更新</span>
              <strong>{lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            </div>
          </section>

          <section className="metric-grid four" aria-label="监控关键指标">
            <Metric icon={<ShieldCheck size={18} />} label="全局可用性" value={`${globalUptime.toFixed(3)}%`} context="最近 24 小时" />
            <Metric icon={<Timer size={18} />} label="平均响应" value={`${currentLatency} ms`} context="所有端点" />
            <Metric icon={<Server size={18} />} label="在线服务" value={`${monitors.filter((item) => item.status === 'operational').length}/${monitors.length}`} context="多区域探测" />
            <Metric icon={<AlertTriangle size={18} />} label="活跃事件" value={String(activeIncidents.length)} context={activeIncidents.length ? '需要处理' : '暂无异常'} accent={activeIncidents.length > 0} />
          </section>

          <section className="observability-grid">
            <article className="panel latency-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">响应时间</p>
                  <h2>{selectedMonitor === 'all' ? '全服务延迟' : monitors.find((item) => item.id === selectedMonitor)?.name}</h2>
                </div>
                <div className="range-control" aria-label="响应时间范围">
                  {ranges.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={range === item.value ? 'active' : ''}
                      aria-pressed={range === item.value}
                      onClick={() => setRange(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chart-legend"><span><i className="p50" />P50</span><span><i className="p95" />P95</span></div>
              <div className="latency-chart" role="img" aria-label={`${rangeConfig.label}响应时间 P50 与 P95 趋势`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencySeries} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="p50Fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6df0b8" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6df0b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: '#6f7e77', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} width={44} tickFormatter={(value) => `${value}ms`} tick={{ fill: '#6f7e77', fontSize: 11 }} />
                    <Tooltip content={<LatencyTooltip />} cursor={{ stroke: 'rgba(109,240,184,.3)' }} />
                    <Area type="monotone" dataKey="p50" stroke="#6df0b8" strokeWidth={2.2} fill="url(#p50Fill)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#09100d' }} />
                    <Line type="monotone" dataKey="p95" stroke="#7ab8ff" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel region-panel">
              <div className="panel-heading compact">
                <div><p className="panel-kicker">全球节点</p><h2>区域脉冲</h2></div>
                <Globe2 size={18} />
              </div>
              <div className="region-radar" aria-label="四个监控区域均在线">
                <div className="radar-ring r1" /><div className="radar-ring r2" /><div className="radar-ring r3" />
                <span className="node n1"><i />SEL</span>
                <span className="node n2"><i />SIN</span>
                <span className="node n3"><i />TYO</span>
                <span className="node n4"><i />EDGE</span>
                <div className="radar-core"><Activity size={18} /></div>
              </div>
              <div className="region-list">
                {[
                  ['Seoul', 42], ['Singapore', 68], ['Tokyo', 51], ['Global Edge', 87],
                ].map(([name, latency]) => (
                  <div key={name} className="region-row"><span><i />{name}</span><strong>{latency} ms</strong></div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel monitors-panel">
            <div className="panel-heading compact">
              <div><p className="panel-kicker">端点监控</p><h2>服务健康</h2></div>
              <button className={`quiet-filter ${selectedMonitor === 'all' ? 'active' : ''}`} type="button" onClick={() => setSelectedMonitor('all')}>查看全部</button>
            </div>
            <div className="monitor-list">
              {monitors.map((monitor) => {
                const history = checks.filter((check) => check.monitor_id === monitor.id).slice(-48)
                return (
                  <button
                    className={`monitor-row ${selectedMonitor === monitor.id ? 'selected' : ''}`}
                    type="button"
                    key={monitor.id}
                    onClick={() => setSelectedMonitor(monitor.id)}
                    aria-pressed={selectedMonitor === monitor.id}
                  >
                    <span className="monitor-identity"><span className={`service-icon ${monitor.status}`}><CircleDot size={16} /></span><span><strong>{monitor.name}</strong><small>{monitor.endpoint}</small></span></span>
                    <span className="uptime-bars" aria-label={`${monitor.name}最近检查记录`}>
                      {history.map((check) => <i key={check.id} className={!check.ok ? 'down' : check.latency_ms > 250 ? 'slow' : ''} />)}
                    </span>
                    <span className="monitor-number"><small>可用性</small><strong>{monitor.uptime_percent.toFixed(2)}%</strong></span>
                    <span className="monitor-number"><small>响应</small><strong>{monitor.latency_ms} ms</strong></span>
                    <ChevronRight size={16} className="row-chevron" />
                  </button>
                )
              })}
            </div>
          </section>

          <section className="incident-strip">
            <div className="incident-heading"><span className="resolved-mark"><Check size={15} /></span><div><strong>最近事件</strong><small>自动记录并同步状态变化</small></div></div>
            {incidents[0] ? <div className="incident-latest"><span>{incidents[0].title}</span><small>{incidents[0].monitor_name} · {formatClock(incidents[0].started_at)} · 已解决</small></div> : <span className="empty-state">最近 7 天没有事件</span>}
            <button type="button" onClick={() => setPage('incidents')}>全部事件 <ChevronRight size={15} /></button>
          </section>
        </main>
      )}

      {page === 'storage' && (
        <main>
          <section className="page-title">
            <div><p className="eyebrow"><Cloud size={13} /> STORAGE OBSERVABILITY</p><h1>存储增长与分布</h1><p>追踪容量、对象数量和类别变化，提前发现异常增长。</p></div>
          </section>
          <section className="metric-grid three">
            <Metric icon={<HardDrive size={18} />} label="当前存储" value={formatBytes(totalStorage, 2)} context="最近一次快照" />
            <Metric icon={<Boxes size={18} />} label="对象数量" value={compactNumber.format(totalObjects)} context="全部类别" />
            <Metric icon={storageChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />} label="30 天变化" value={`${storageChange >= 0 ? '+' : ''}${storageChange.toFixed(2)}%`} context="容量增长" />
          </section>
          <section className="storage-grid">
            <article className="panel storage-trend">
              <div className="panel-heading"><div><p className="panel-kicker">容量曲线</p><h2>{formatBytes(totalStorage, 2)}</h2></div><span className="panel-badge">90 天</span></div>
              <div className="storage-chart" role="img" aria-label="最近 90 天存储容量变化">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={storageDaily} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6df0b8" stopOpacity={0.25} /><stop offset="100%" stopColor="#6df0b8" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={30} tick={{ fill: '#6f7e77', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} width={50} tickFormatter={(value) => formatBytes(value, 0)} tick={{ fill: '#6f7e77', fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatBytes(Number(value), 2), '已用空间']} contentStyle={{ background: '#111a16', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="bytes" stroke="#6df0b8" strokeWidth={2.2} fill="url(#storageFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="panel distribution-panel">
              <div className="panel-heading compact"><div><p className="panel-kicker">空间分布</p><h2>按类型</h2></div><Database size={18} /></div>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={latestStorage} dataKey="bytes_used" nameKey="category" innerRadius="68%" outerRadius="93%" paddingAngle={3} stroke="none">{latestStorage.map((item, index) => <Cell key={item.category} fill={storagePalette[index % storagePalette.length]} />)}</Pie><Tooltip formatter={(value) => [formatBytes(Number(value), 1), '空间']} contentStyle={{ background: '#111a16', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }} /></PieChart></ResponsiveContainer>
                <div className="donut-center"><strong>{latestStorage.length}</strong><span>类型</span></div>
              </div>
              <div className="legend-list">{latestStorage.map((item, index) => <div className="legend-row" key={item.category}><span><i style={{ background: storagePalette[index % storagePalette.length] }} />{item.category}</span><strong>{formatBytes(Number(item.bytes_used), 1)}</strong></div>)}</div>
            </article>
          </section>
        </main>
      )}

      {page === 'incidents' && (
        <main>
          <section className="page-title">
            <div><p className="eyebrow"><AlertTriangle size={13} /> INCIDENT HISTORY</p><h1>事件与恢复记录</h1><p>保存每次异常的状态、持续时间与影响服务。</p></div>
          </section>
          <section className="metric-grid three">
            <Metric icon={<AlertTriangle size={18} />} label="活跃事件" value={String(activeIncidents.length)} context="当前需要处理" accent={activeIncidents.length > 0} />
            <Metric icon={<Gauge size={18} />} label="过去 7 天" value={String(incidents.length)} context="全部事件" />
            <Metric icon={<ShieldCheck size={18} />} label="已解决" value={String(incidents.filter((item) => item.status === 'resolved').length)} context="自动归档" />
          </section>
          <section className="panel incident-history">
            <div className="panel-heading compact"><div><p className="panel-kicker">时间线</p><h2>事件历史</h2></div><span className="panel-badge">最近 30 天</span></div>
            <div className="timeline">
              {incidents.map((incident) => (
                <article key={incident.id} className="timeline-row">
                  <span className={`timeline-mark ${incident.status}`}><Check size={14} /></span>
                  <div><strong>{incident.title}</strong><p>{incident.monitor_name} · {incident.severity === 'minor' ? '轻微影响' : incident.severity === 'major' ? '较大影响' : '严重影响'}</p></div>
                  <div className="timeline-time"><strong>{new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(incident.started_at))}</strong><span>{formatClock(incident.started_at)}{incident.resolved_at ? ` → ${formatClock(incident.resolved_at)}` : ''}</span></div>
                  <span className={`incident-status ${incident.status}`}>{incident.status === 'resolved' ? '已解决' : incident.status === 'monitoring' ? '观察中' : '调查中'}</span>
                </article>
              ))}
              {!incidents.length && <div className="empty-state large"><Check size={24} /> 暂无事件，系统运行正常</div>}
            </div>
          </section>
        </main>
      )}

      <footer>
        <span>MONITOR.SITE · Realtime observability</span>
        <span className="stack"><GitFork size={14} /> GitHub <Database size={14} /> Supabase <Triangle size={13} /> Vercel</span>
      </footer>
    </div>
  )
}

function Metric({ icon, label, value, context, accent = false }: { icon: React.ReactNode; label: string; value: string; context: string; accent?: boolean }) {
  return <article className={`metric-card ${accent ? 'alert' : ''}`}><div className="metric-icon">{icon}</div><p>{label}</p><strong>{value}</strong><span>{context}</span></article>
}

function LatencyTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number; dataKey?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span>{label}</span>{payload.map((item) => <strong key={item.dataKey}>{String(item.dataKey).toUpperCase()} · {Number(item.value).toFixed(0)} ms</strong>)}</div>
}

export default App
