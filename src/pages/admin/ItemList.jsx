import { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { ItemViewerModal } from '../../components/admin/ItemViewerModal'

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

const SearchInput = styled.input`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-4);
  width: 18rem;
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.4);
  }
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

// ─── Table ────────────────────────────────────────────────────────────────────

const TableWrap = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  overflow: auto; /* horizontal scroll for wide table */
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  min-width: 3200px;
`

const Th = styled.th`
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.35);
  background-color: rgba(255, 255, 255, 0.02);
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

const Tr = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background-color var(--transition-base);

  &:last-child { border-bottom: none; }
  &:hover { background-color: rgba(255, 255, 255, 0.025); }
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

const TitleCell = styled.button`
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface);
  display: block;
  max-width: 22rem;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-base);
  text-align: left;

  &:hover { color: var(--color-primary); }
`

const GradeBadge = styled.span`
  display: inline-block;
  background-color: var(--color-secondary-container);
  color: var(--color-secondary-fixed);
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
  { key: 'title',             label: 'Title',            sortable: true  },
  // Cert
  { key: 'cert_service',      label: 'Cert Service',     sortable: true  },
  { key: 'cert_grade',        label: 'Grade',            sortable: true  },
  { key: 'auto_grade',        label: 'Auto Grade',       sortable: true  },
  { key: 'cert_id',           label: 'Cert ID',          sortable: false },
  { key: 'cert_link',         label: 'Cert Link',        sortable: false },
  { key: 'is_autograph_cert', label: 'Auto Cert',        sortable: true  },
  // Financials
  { key: 'price',             label: 'Item Cost',        sortable: true  },
  { key: 'auto_total',        label: 'Auto Cost',        sortable: true  },
  { key: 'price',             label: 'Ask Price',        sortable: true  },
  { key: 'for_sale',          label: 'For Sale',         sortable: true  },
  { key: 'acquisition_type',  label: 'Acq. Type',        sortable: true  },
  // Attributes
  { key: 'is_autographed',    label: 'Signed',           sortable: true  },
  { key: 'is_world_series_game', label: 'World Series',  sortable: true  },
  { key: 'ws_game_number',    label: 'WS Game #',        sortable: true  },
  { key: 'is_clinch_game',    label: 'Clinch Game',      sortable: true  },
  { key: 'clinch_number',     label: 'Clinch #',         sortable: true  },
  { key: 'is_part_of_set',    label: 'In Set',           sortable: true  },
  // Dates & location
  { key: 'game_date',         label: 'Game Date',        sortable: true  },
  { key: 'purchase_date',     label: 'Purchase Date',    sortable: true  },
  { key: 'location',          label: 'Location',         sortable: true  },
  // Visibility
  { key: 'is_visible',        label: 'Visible',          sortable: true  },
  { key: 'is_baseball',       label: 'Baseball',         sortable: true  },
  // Media
  { key: 'primary_image_url', label: 'Image URL',        sortable: false },
  { key: 'cloudinary_id',     label: 'Cloudinary ID',    sortable: false },
  { key: 'reference_link',    label: 'Reference Link',   sortable: false },
  // Text
  { key: 'description',       label: 'Description',      sortable: false },
  { key: 'notes',             label: 'Notes',            sortable: false },
  // Population
  { key: 'pop_total',         label: 'Pop Total',        sortable: true  },
  { key: 'pop_higher',        label: 'Pop Higher',       sortable: true  },
  { key: 'pop_lower',         label: 'Pop Lower',        sortable: true  },
  // Meta
  { key: 'created_at',        label: 'Added',            sortable: true  },
  { key: 'updated_at',        label: 'Updated',          sortable: true  },
  { key: '_edit',             label: '',                 sortable: false },
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
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [exportingCatalog, setExportingCatalog] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [itemsRes, certsRes, imagesRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('certifications').select('*').order('created_at'),
        supabase.from('images').select('item_id, cloudinary_url, cloudinary_public_id').eq('is_primary', true),
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

      // Fetch latest population for all PSA/PSA-DNA certs
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r =>
      !q ||
      r.title.toLowerCase().includes(q) ||
      (r.cert_id ?? '').toLowerCase().includes(q) ||
      (r.notes ?? '').toLowerCase().includes(q) ||
      (r.location ?? '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const DATE_KEYS = new Set(['created_at', 'updated_at', 'game_date', 'purchase_date'])

  const sorted = useMemo(() => {
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
  }, [filtered, sortKey, sortDir])

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
      { label: 'Title',              value: r => r.title },
      { label: 'Cert Service',       value: r => r.cert_service ?? '' },
      { label: 'Grade',              value: r => r.cert_grade ?? '' },
      { label: 'Cert ID',            value: r => r.cert_id ?? '' },
      { label: 'For Sale',           value: r => r.for_sale ? 'Yes' : 'No' },
      { label: 'Acquisition Cost',   value: r => r.item_total ?? '' },
      { label: 'Game Date',          value: r => r.game_date ?? '' },
      { label: 'Pop Total',          value: r => r.pop_total ?? '' },
      { label: 'Pop Higher',         value: r => r.pop_higher ?? '' },
      { label: 'Pop Lower',          value: r => r.pop_lower ?? '' },
      { label: 'Signatories',        value: r => {
        const sigs = sigsByItem[r.id] ?? []
        const featured = sigs.find(s => s.is_featured)
        const others = sigs.filter(s => !s.is_featured)
        return [featured, ...others].filter(Boolean).map(s => s.name).join('; ')
      }},
      { label: 'Tags',               value: r => (tagsByItem[r.id] ?? []).join('; ') },
    ]

    const ts = new Date().toISOString().slice(0, 10)
    downloadCsv(`mintd-catalog-${ts}.csv`, catalogHeaders, sorted)
    setExportingCatalog(false)
  }

  return (
    <>
      {selectedItemId && (
        <ItemViewerModal itemId={selectedItemId} onClose={() => setSelectedItemId(null)} />
      )}

      <PageHeading>
        <PageTitle>Table View</PageTitle>
        <PageSub>All fields, raw data — click any column header to sort.</PageSub>
      </PageHeading>

      <Controls>
        <SearchInput
          type="text"
          placeholder="Search title, cert ID, location, notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
      </Controls>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <Th
                  key={col.key}
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
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <StatusRow><td colSpan={COLUMNS.length}>Loading...</td></StatusRow>
            ) : sorted.length === 0 ? (
              <StatusRow><td colSpan={COLUMNS.length}>No items found.</td></StatusRow>
            ) : sorted.map(item => (
              <Tr key={item.id}>
                <Td><TitleCell onClick={() => setSelectedItemId(item.id)}>{item.title}</TitleCell></Td>
                {/* Cert */}
                <Td $dim={!item.cert_service}>{item.cert_service ?? '—'}</Td>
                <Td>
                  {item.cert_grade
                    ? <GradeBadge>{item.cert_grade}</GradeBadge>
                    : <span style={{ color: 'var(--color-outline)' }}>—</span>}
                </Td>
                <Td $dim={!item.auto_grade}>{item.auto_grade ?? '—'}</Td>
                <Td $dim={!item.cert_id}>{item.cert_id ?? '—'}</Td>
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
                <Td><BoolBadge $on={item.is_world_series_game}>{item.is_world_series_game ? 'Yes' : 'No'}</BoolBadge></Td>
                <Td $dim={!item.ws_game_number}>{item.ws_game_number ?? '—'}</Td>
                <Td><BoolBadge $on={item.is_clinch_game}>{item.is_clinch_game ? 'Yes' : 'No'}</BoolBadge></Td>
                <Td $dim={!item.clinch_number}>{item.clinch_number ?? '—'}</Td>
                <Td><BoolBadge $on={item.is_part_of_set}>{item.is_part_of_set ? 'Yes' : 'No'}</BoolBadge></Td>
                {/* Dates & location */}
                <Td $dim={!item.game_date}>{formatDate(item.game_date)}</Td>
                <Td $dim={!item.purchase_date}>{formatDate(item.purchase_date)}</Td>
                <Td $dim={!item.location}>{item.location ?? '—'}</Td>
                {/* Visibility */}
                <Td><BoolBadge $on={item.is_visible}>{item.is_visible ? 'Yes' : 'No'}</BoolBadge></Td>
                <Td><BoolBadge $on={item.is_baseball}>{item.is_baseball ? 'Yes' : 'No'}</BoolBadge></Td>
                {/* Media */}
                <Td $dim={!item.primary_image_url}>
                  {item.primary_image_url
                    ? <a href={item.primary_image_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.6875rem' }}>Link ↗</a>
                    : '—'}
                </Td>
                <Td $dim={!item.cloudinary_id} style={{ maxWidth: '14rem' }}>{item.cloudinary_id ?? '—'}</Td>
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
    </>
  )
}
