import { useState, useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { ItemViewerModal } from '../../components/admin/ItemViewerModal'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { gradeColors, gradeToNumber, gradeBucket } from '../../utils/gradeColors'

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageHeading = styled.div`
  margin-bottom: var(--space-8);
`

const PageTitle = styled.h1`
  font-family: var(--font-headline);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-2);
`

const PageSub = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(229, 226, 225, 0.4);
`

// ─── Controls ─────────────────────────────────────────────────────────────────

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
`


const ResultsMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-left: auto;
`

const ExportBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.4rem 0.875rem;
  background: transparent;
  border: 1px solid rgba(173, 198, 255, 0.2);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background var(--transition-base), border-color var(--transition-base);

  &:hover { background: rgba(173, 198, 255, 0.06); border-color: rgba(173, 198, 255, 0.4); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }

  .material-symbols-outlined { font-size: 0.875rem; }
`

const FullscreenBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  color: rgba(229, 226, 225, 0.4);
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base);

  &:hover { color: var(--color-on-surface); border-color: rgba(140, 144, 159, 0.3); }

  .material-symbols-outlined { font-size: 1rem; }
`

// ─── Table section (fullscreen target) ────────────────────────────────────────

const TableSection = styled.div`
  &:fullscreen {
    background-color: var(--color-background, #0d0d12);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`

// ─── Table ────────────────────────────────────────────────────────────────────

const STICKY_HEADER_BG = '#202020'
const STICKY_BODY_BG = '#1c1b1b'

const TableWrap = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  overflow: auto;

  :fullscreen & {
    flex: 1;
    border-radius: var(--radius-md);
    overflow: auto;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  min-width: 3200px;
`

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.35);
  background-color: ${STICKY_HEADER_BG};
  text-align: left;
  cursor: ${({ $sortable }) => $sortable ? 'pointer' : 'default'};
  user-select: none;
  white-space: nowrap;

  &:hover {
    color: ${({ $sortable }) => $sortable ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.35)'};
  }
`

const SortIcon = styled.span`
  margin-left: var(--space-1);
  opacity: ${({ $active }) => $active ? 1 : 0.3};
  color: ${({ $active }) => $active ? 'var(--color-primary)' : 'inherit'};
`

const Td = styled.td`
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: ${({ $dim }) => $dim ? 'var(--color-outline)' : 'var(--color-on-surface-variant)'};
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CertLink = styled.a`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity var(--transition-base);
  &:hover { opacity: 0.7; }
`

// ─── Sticky columns ───────────────────────────────────────────────────────────

const NUM_COL_WIDTH = '3rem'
const TITLE_COL_LEFT = NUM_COL_WIDTH

const StickyNumTh = styled(Th)`
  position: sticky;
  left: 0;
  top: 0;
  z-index: 4;
  width: ${NUM_COL_WIDTH};
  min-width: ${NUM_COL_WIDTH};
  text-align: center;
  background-color: ${STICKY_HEADER_BG};
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.06);
`

const StickyTitleTh = styled(Th)`
  position: sticky;
  left: ${TITLE_COL_LEFT};
  top: 0;
  z-index: 4;
  min-width: 16rem;
  max-width: 26rem;
  white-space: normal;
  background-color: ${STICKY_HEADER_BG};
  box-shadow: 2px 0 0 rgba(140, 144, 159, 0.2);
`

const StickyNumTd = styled(Td)`
  position: sticky;
  left: 0;
  z-index: 2;
  width: ${NUM_COL_WIDTH};
  min-width: ${NUM_COL_WIDTH};
  text-align: center;
  background-color: ${STICKY_BODY_BG};
  color: var(--color-outline);
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.06);
  font-size: 0.625rem;
`

const StickyTitleTd = styled(Td)`
  position: sticky;
  left: ${TITLE_COL_LEFT};
  z-index: 2;
  min-width: 16rem;
  max-width: 26rem;
  white-space: normal;
  word-break: break-word;
  background-color: ${STICKY_BODY_BG};
  overflow: visible;
  text-overflow: unset;
  box-shadow: 2px 0 0 rgba(140, 144, 159, 0.2);
`

// ─── Row (defined after sticky cells so hover can target them) ────────────────

const Tr = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background-color var(--transition-base);

  &:last-child { border-bottom: none; }
  &:hover { background-color: rgba(255, 255, 255, 0.025); }
  &:hover ${StickyNumTd}, &:hover ${StickyTitleTd} {
    background-color: #222222;
  }
`

// ─── Title cell button ────────────────────────────────────────────────────────

const TitleCell = styled.button`
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface);
  display: block;
  white-space: normal;
  word-break: break-word;
  text-align: left;
  transition: color var(--transition-base);

  &:hover { color: var(--color-primary); }
`

const GradeBadge = styled.span`
  display: inline-block;
  background-color: ${p => p.$bg ?? 'var(--color-secondary-container)'};
  color: ${p => p.$fg ?? 'var(--color-secondary-fixed)'};
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
`

const BoolBadge = styled.span`
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
  background-color: ${({ $on }) => $on ? 'rgba(173, 198, 255, 0.1)' : 'transparent'};
  color: ${({ $on }) => $on ? 'var(--color-primary)' : 'var(--color-outline)'};
  border: 1px solid ${({ $on }) => $on ? 'rgba(173, 198, 255, 0.2)' : 'rgba(140, 144, 159, 0.1)'};
`

const EditBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.4);
  transition: color var(--transition-base);

  .material-symbols-outlined { font-size: 0.875rem; }
  &:hover { color: var(--color-primary); }
`

const StatusRow = styled.tr`
  td {
    padding: var(--space-12);
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-outline);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: '_num',              label: '#',            sortable: false },
  { key: 'title',             label: 'Title',        sortable: true  },
  { key: 'item_type',         label: 'Type',         sortable: true  },
  // Cert
  { key: 'cert_service',      label: 'Cert Service', sortable: true  },
  { key: 'cert_grade',        label: 'Grade',        sortable: true  },
  { key: 'auto_grade',        label: 'Auto Grade',   sortable: true  },
  { key: 'cert_id',           label: 'Cert ID',      sortable: false },
  { key: 'cert_link',         label: 'Cert Link',    sortable: false },
  { key: 'is_autograph_cert', label: 'Auto Cert',    sortable: true  },
  // Financials
  { key: 'price',             label: 'Item Cost',    sortable: true  },
  { key: 'auto_total',        label: 'Auto Cost',    sortable: true  },
  { key: 'price',             label: 'Ask Price',    sortable: true  },
  { key: 'for_sale',          label: 'For Sale',     sortable: true  },
  { key: 'acquisition_type',  label: 'Acq. Type',    sortable: true  },
  // Attributes
  { key: 'is_autographed',       label: 'Signed',       sortable: true },
  { key: 'is_part_of_set',       label: 'In Set',       sortable: true },
  // Dates
  { key: 'purchase_date',     label: 'Purchase Date',sortable: true  },
  // Visibility
  { key: 'is_visible',        label: 'Visible',      sortable: true  },
  { key: 'is_baseball',       label: 'Baseball',     sortable: true  },
  // Media
  { key: 'reference_link',    label: 'Ref Link',     sortable: false },
  // Text
  { key: 'description',       label: 'Description',  sortable: false },
  { key: 'notes',             label: 'Notes',        sortable: false },
  // Population
  { key: 'pop_total',         label: 'Pop Total',    sortable: true  },
  { key: 'pop_higher',        label: 'Pop Higher',   sortable: true  },
  { key: 'pop_lower',         label: 'Pop Lower',    sortable: true  },
  // Meta
  { key: 'created_at',        label: 'Added',        sortable: true  },
  { key: 'updated_at',        label: 'Updated',      sortable: true  },
  { key: '_edit',             label: '',             sortable: false },
]

function formatCurrency(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString()}`
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvEscape(val) {
  if (val == null) return ''
  const str = String(val)
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map(h => csvEscape(h.label)).join(','),
    ...rows.map(row => headers.map(h => csvEscape(h.value(row))).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toHeaderLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTypes, setActiveTypes] = useState([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [exportingCatalog, setExportingCatalog] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const tableSectionRef = useRef(null)

  useEffect(() => {
    function onFSChange() { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      tableSectionRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [itemsRes, certsRes, imagesRes, teamsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('certifications').select('*').order('created_at'),
        supabase.from('images').select('item_id, cloudinary_url, cloudinary_public_id').eq('is_primary', true),
        supabase.from('item_teams').select('item_id, teams(slug)'),
      ])

      if (cancelled) return

      const certsByItem = {}
      for (const c of certsRes.data ?? []) {
        if (!certsByItem[c.item_id]) certsByItem[c.item_id] = c
      }

      const imagesByItem = {}
      for (const img of imagesRes.data ?? []) {
        imagesByItem[img.item_id] = img
      }

      const teamsByItem = {}
      for (const row of teamsRes.data ?? []) {
        if (!teamsByItem[row.item_id]) teamsByItem[row.item_id] = []
        if (row.teams?.slug) teamsByItem[row.item_id].push(row.teams.slug)
      }

      const psaCertIds = (certsRes.data ?? [])
        .filter(c => ['PSA', 'PSA/DNA'].includes(c.cert_service) && c.id)
        .map(c => c.id)

      const popByItem = {}
      if (psaCertIds.length > 0) {
        const { data: popData } = await supabase
          .from('latest_population')
          .select('cert_id, total, higher, lower, recorded_at')
          .in('cert_id', psaCertIds)

        const certItemMap = {}
        for (const c of certsRes.data ?? []) {
          certItemMap[c.id] = c.item_id
        }
        for (const p of popData ?? []) {
          const itemId = certItemMap[p.cert_id]
          if (itemId) popByItem[itemId] = p
        }
      }

      if (cancelled) return

      const merged = (itemsRes.data ?? []).map(item => ({
        ...item,
        cert_service:      certsByItem[item.id]?.cert_service ?? null,
        cert_id:           certsByItem[item.id]?.cert_id ?? null,
        cert_link:         certsByItem[item.id]?.cert_link ?? null,
        cert_grade:        certsByItem[item.id]?.item_grade ?? null,
        auto_grade:        certsByItem[item.id]?.auto_grade ?? null,
        is_autograph_cert: certsByItem[item.id]?.is_autograph_cert ?? null,
        primary_image_url: imagesByItem[item.id]?.cloudinary_url ?? null,
        cloudinary_id:     imagesByItem[item.id]?.cloudinary_public_id ?? null,
        pop_total:         popByItem[item.id]?.total ?? null,
        pop_higher:        popByItem[item.id]?.higher ?? null,
        pop_lower:         popByItem[item.id]?.lower ?? null,
        pop_synced_at:     popByItem[item.id]?.recorded_at ?? null,
        team_slugs:        teamsByItem[item.id] ?? [],
      }))

      setRows(merged)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const [activeTeams, setActiveTeams] = useState([])
  const [activeCertServices, setActiveCertServices] = useState([])
  const [activeGrades, setActiveGrades] = useState([])
  const [showDupesOnly, setShowDupesOnly] = useState(false)
  const [sortBy, setSortBy] = useState('')

  const availableTypes = useMemo(() => {
    const seen = new Set(rows.map(r => r.item_type).filter(Boolean))
    return [...seen].sort()
  }, [rows])

  const availableTeams = useMemo(() => {
    const seen = new Set(rows.flatMap(r => r.team_slugs ?? []))
    const sorted = [...seen].sort()
    return ['yankees', ...sorted.filter(t => t !== 'yankees')]
  }, [rows])

  const availableCertServices = useMemo(() => {
    const seen = new Set(rows.map(r => r.cert_service).filter(Boolean))
    return [...seen].sort()
  }, [rows])

  const availableGrades = useMemo(() => {
    const seen = new Set(rows.filter(r => r.cert_grade).map(r => gradeBucket(r.cert_grade)))
    const numeric = [...seen].filter(g => g !== 'authentic').sort((a, b) => parseFloat(a) - parseFloat(b))
    return seen.has('authentic') ? [...numeric, 'authentic'] : numeric
  }, [rows])

  function handleTypeToggle(type) {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function handleTeamToggle(team) {
    setActiveTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    )
  }

  function handleCertServiceToggle(cs) {
    setActiveCertServices(prev =>
      prev.includes(cs) ? prev.filter(c => c !== cs) : [...prev, cs]
    )
  }

  function handleGradeToggle(grade) {
    setActiveGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      const matchesType = activeTypes.length === 0 || activeTypes.includes(r.item_type)
      const matchesTeam = activeTeams.length === 0 || (r.team_slugs ?? []).some(s => activeTeams.includes(s))
      const matchesCertService = activeCertServices.length === 0 || (r.cert_service && activeCertServices.includes(r.cert_service))
      const matchesGrade = activeGrades.length === 0 || activeGrades.includes(gradeBucket(r.cert_grade))
      const matchesDupes = !showDupesOnly || r.is_duplicate === true
      const matchesSearch = !q ||
        r.title.toLowerCase().includes(q) ||
        (r.cert_id ?? '').toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q)
      return matchesType && matchesTeam && matchesCertService && matchesGrade && matchesDupes && matchesSearch
    })
  }, [rows, activeTypes, activeTeams, activeCertServices, activeGrades, showDupesOnly, search])

  const DATE_KEYS = new Set(['created_at', 'updated_at', 'purchase_date'])

  const sorted = useMemo(() => {
    if (sortBy) {
      return [...filtered].sort((a, b) => {
        if (sortBy === 'year_desc') return (b.season_year ?? 0) - (a.season_year ?? 0)
        if (sortBy === 'year_asc')  return (a.season_year ?? 0) - (b.season_year ?? 0)
        if (sortBy === 'grade_desc') return gradeToNumber(b.cert_grade) - gradeToNumber(a.cert_grade)
        if (sortBy === 'grade_asc')  return gradeToNumber(a.cert_grade) - gradeToNumber(b.cert_grade)
        return 0
      })
    }
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? ''
      let bv = b[sortKey] ?? ''
      if (typeof av === 'boolean') av = av ? 1 : 0
      if (typeof bv === 'boolean') bv = bv ? 1 : 0
      if (DATE_KEYS.has(sortKey)) {
        av = av ? new Date(av).getTime() : 0
        bv = bv ? new Date(bv).getTime() : 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortBy, sortKey, sortDir])

  function sortIcon(key) {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  function handleRawExport() {
    if (!sorted.length) return
    const headers = Object.keys(sorted[0]).map(key => ({
      label: toHeaderLabel(key),
      value: r => r[key] ?? '',
    }))
    const ts = new Date().toISOString().slice(0, 10)
    downloadCsv(`mintd-raw-${ts}.csv`, headers, sorted)
  }

  async function handleCatalogExport() {
    setExportingCatalog(true)
    const ids = sorted.map(r => r.id)

    const [sigRes, tagRes] = await Promise.all([
      supabase.from('signatories').select('item_id, name, is_featured').in('item_id', ids),
      supabase.from('item_tags').select('item_id, tags(slug)').in('item_id', ids),
    ])

    const sigsByItem = {}
    for (const s of sigRes.data ?? []) {
      if (!sigsByItem[s.item_id]) sigsByItem[s.item_id] = []
      sigsByItem[s.item_id].push(s)
    }

    const tagsByItem = {}
    for (const t of tagRes.data ?? []) {
      if (!tagsByItem[t.item_id]) tagsByItem[t.item_id] = []
      if (t.tags?.slug) tagsByItem[t.item_id].push(t.tags.slug)
    }

    const catalogHeaders = [
      { label: 'Title',            value: r => r.title },
      { label: 'Cert Service',     value: r => r.cert_service ?? '' },
      { label: 'Grade',            value: r => r.cert_grade ?? '' },
      { label: 'Cert ID',          value: r => r.cert_id ?? '' },
      { label: 'For Sale',         value: r => r.for_sale ? 'Yes' : 'No' },
      { label: 'Acquisition Cost', value: r => r.item_total ?? '' },
      { label: 'Pop Total',        value: r => r.pop_total ?? '' },
      { label: 'Pop Higher',       value: r => r.pop_higher ?? '' },
      { label: 'Pop Lower',        value: r => r.pop_lower ?? '' },
      { label: 'Signatories',      value: r => {
        const sigs = sigsByItem[r.id] ?? []
        const featured = sigs.find(s => s.is_featured)
        const others = sigs.filter(s => !s.is_featured)
        return [featured, ...others].filter(Boolean).map(s => s.name).join('; ')
      }},
      { label: 'Tags', value: r => (tagsByItem[r.id] ?? []).join('; ') },
    ]

    const ts = new Date().toISOString().slice(0, 10)
    downloadCsv(`mintd-catalog-${ts}.csv`, catalogHeaders, sorted)
    setExportingCatalog(false)
  }

  return (
    <>
      {selectedItemId && (
        <ItemViewerModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onOpenItem={setSelectedItemId}
        />
      )}

      <PageHeading>
        <PageTitle>Table View</PageTitle>
        <PageSub>All fields, raw data — click any column header to sort.</PageSub>
      </PageHeading>

      <AdminFilterBar
        availableTypes={availableTypes}
        activeTypes={activeTypes}
        onTypeToggle={handleTypeToggle}
        onTypeClear={() => setActiveTypes([])}
        availableTeams={availableTeams}
        activeTeams={activeTeams}
        onTeamToggle={handleTeamToggle}
        onTeamClear={() => setActiveTeams([])}
        availableCertServices={availableCertServices}
        activeCertServices={activeCertServices}
        onCertServiceToggle={handleCertServiceToggle}
        onCertServiceClear={() => setActiveCertServices([])}
        availableGrades={availableGrades}
        activeGrades={activeGrades}
        onGradeToggle={handleGradeToggle}
        onGradeClear={() => setActiveGrades([])}
        showDupesOnly={showDupesOnly}
        onDupesToggle={() => setShowDupesOnly(v => !v)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        search={search}
        onSearchChange={setSearch}
      />

      <TableSection ref={tableSectionRef}>
        <Controls>
          {!loading && (
            <>
              <ExportBtn onClick={handleRawExport} title="Export all columns as CSV">
                <span className="material-symbols-outlined">download</span>
                Raw Export
              </ExportBtn>
              <ExportBtn onClick={handleCatalogExport} disabled={exportingCatalog} title="Export shareable fields only">
                <span className="material-symbols-outlined">share</span>
                {exportingCatalog ? 'Exporting...' : 'Catalog Export'}
              </ExportBtn>
              <ResultsMeta>
                {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
                {sorted.length !== rows.length && ` of ${rows.length}`}
              </ResultsMeta>
            </>
          )}
          <FullscreenBtn onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <span className="material-symbols-outlined">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </FullscreenBtn>
        </Controls>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                {COLUMNS.map(col => {
                  if (col.key === '_num') return (
                    <StickyNumTh key="_num">#</StickyNumTh>
                  )
                  if (col.key === 'title') return (
                    <StickyTitleTh
                      key="title"
                      $sortable
                      onClick={() => handleSort('title')}
                    >
                      Title
                      <SortIcon $active={sortKey === 'title'}>{sortIcon('title')}</SortIcon>
                    </StickyTitleTh>
                  )
                  return (
                    <Th
                      key={col.key + col.label}
                      $sortable={col.sortable}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      {col.label}
                      {col.sortable && (
                        <SortIcon $active={sortKey === col.key}>
                          {sortIcon(col.key)}
                        </SortIcon>
                      )}
                    </Th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <StatusRow><td colSpan={COLUMNS.length}>Loading...</td></StatusRow>
              ) : sorted.length === 0 ? (
                <StatusRow><td colSpan={COLUMNS.length}>No items found.</td></StatusRow>
              ) : sorted.map((item, idx) => (
                <Tr key={item.id}>
                  <StickyNumTd>{idx + 1}</StickyNumTd>
                  <StickyTitleTd>
                    <TitleCell onClick={() => setSelectedItemId(item.id)}>{item.title}</TitleCell>
                  </StickyTitleTd>
                  <Td $dim={!item.item_type}>{item.item_type ? item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1) : '—'}</Td>
                  {/* Cert */}
                  <Td $dim={!item.cert_service}>{item.cert_service ?? '—'}</Td>
                  <Td>
                    {item.cert_grade
                      ? <GradeBadge {...gradeColors(item.cert_grade)}>{item.cert_grade}</GradeBadge>
                      : <span style={{ color: 'var(--color-outline)' }}>—</span>}
                  </Td>
                  <Td $dim={!item.auto_grade}>{item.auto_grade ?? '—'}</Td>
                  <Td $dim={!item.cert_id}>
                    {item.cert_id
                      ? ['PSA', 'PSA/DNA'].includes(item.cert_service)
                        ? <CertLink href={`https://www.psacard.com/cert/${item.cert_id}/psa`} target="_blank" rel="noreferrer">#{item.cert_id}</CertLink>
                        : <span>{item.cert_id}</span>
                      : '—'}
                  </Td>
                  <Td $dim={!item.cert_link}>
                    {item.cert_link
                      ? <a href={item.cert_link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.6875rem' }}>Link ↗</a>
                      : '—'}
                  </Td>
                  <Td>
                    {item.is_autograph_cert != null
                      ? <BoolBadge $on={item.is_autograph_cert}>{item.is_autograph_cert ? 'Yes' : 'No'}</BoolBadge>
                      : <span style={{ color: 'var(--color-outline)' }}>—</span>}
                  </Td>
                  {/* Financials */}
                  <Td $dim={!item.price}>{formatCurrency(item.price)}</Td>
                  <Td $dim={!item.auto_total}>{formatCurrency(item.auto_total)}</Td>
                  <Td $dim={!item.price}>{item.for_sale ? formatCurrency(item.price) : '—'}</Td>
                  <Td><BoolBadge $on={item.for_sale}>{item.for_sale ? 'Yes' : 'No'}</BoolBadge></Td>
                  <Td $dim>{item.acquisition_type ?? '—'}</Td>
                  {/* Attributes */}
                  <Td><BoolBadge $on={item.is_autographed}>{item.is_autographed ? 'Yes' : 'No'}</BoolBadge></Td>
                  <Td><BoolBadge $on={item.is_part_of_set}>{item.is_part_of_set ? 'Yes' : 'No'}</BoolBadge></Td>
                  {/* Dates */}
                  <Td $dim={!item.purchase_date}>{formatDate(item.purchase_date)}</Td>
                  {/* Visibility */}
                  <Td><BoolBadge $on={item.is_visible}>{item.is_visible ? 'Yes' : 'No'}</BoolBadge></Td>
                  <Td><BoolBadge $on={item.is_baseball}>{item.is_baseball ? 'Yes' : 'No'}</BoolBadge></Td>
                  {/* Media */}
                  <Td $dim={!item.reference_link}>
                    {item.reference_link
                      ? <a href={item.reference_link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.6875rem' }}>Link ↗</a>
                      : '—'}
                  </Td>
                  {/* Text */}
                  <Td $dim={!item.description} style={{ maxWidth: '16rem' }}>{item.description ?? '—'}</Td>
                  <Td $dim={!item.notes} style={{ maxWidth: '14rem' }}>{item.notes ?? '—'}</Td>
                  {/* Population */}
                  <Td $dim={item.pop_total == null}>{item.pop_total ?? '—'}</Td>
                  <Td $dim={item.pop_higher == null}>{item.pop_higher ?? '—'}</Td>
                  <Td $dim={item.pop_lower == null}>{item.pop_lower ?? '—'}</Td>
                  {/* Meta */}
                  <Td $dim>{formatDate(item.created_at)}</Td>
                  <Td $dim>{formatDate(item.updated_at)}</Td>
                  <Td>
                    <EditBtn onClick={() => setSelectedItemId(item.id)}>
                      <span className="material-symbols-outlined">open_in_new</span>
                    </EditBtn>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </TableSection>
    </>
  )
}
