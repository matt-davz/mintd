import { useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  CLOSE_TIMEZONES, HOUSES, defaultLotNumber, houseNames, parseLotUrl, zonedLocalToUtcIso,
} from '../../../lib/auctionWatchlist'
import { CheckboxLabel, EditInput, EditSelect, ErrorBanner, Field, FieldLabel, SaveBtn } from '../FormFields'
import { Badge, GhostBtn, Hint } from './styles'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-low);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3) var(--space-4);

  @media (min-width: 720px) { grid-template-columns: 1fr 1fr; }
`

const Wide = styled(Field)` grid-column: 1 / -1; `

const Detected = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  min-height: 1.25rem;
  font-size: 0.6875rem;
  color: ${({ $error }) => ($error ? 'var(--color-error)' : 'var(--color-on-surface-variant)')};
`

const Row = styled.div`
  display: flex;
  gap: var(--space-2);

  > :first-child { flex: 1; min-width: 0; }
  > :last-child { width: 9rem; flex-shrink: 0; }
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`

const EMPTY = { url: '', auctionName: '', title: '', lotNumber: '', closeLocal: '', closeTz: 'America/New_York', mustWin: false }

export function AddLotForm({ auctionsByHouse, onAdd, onClose }) {
  const [f, setF] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const parsed = useMemo(() => (f.url.trim() ? parseLotUrl(f.url) : null), [f.url])
  const house = parsed && !parsed.error ? HOUSES[parsed.house] : null
  const knownAuctions = parsed && !parsed.error ? auctionsByHouse[parsed.house] ?? [] : []
  const autoHint = !house?.liveRefresh ? ''
    : house.scraped ? ' (recommended — read from lot page only if server-side scraping is configured)'
    : ' (optional — read from lot page)'
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!parsed || parsed.error) { setError(parsed?.error ?? 'Paste a lot URL.'); return }
    const auctionName = f.auctionName.trim() || (knownAuctions.length === 1 ? knownAuctions[0] : '')
    if (!auctionName) { setError('Auction name is required.'); return }
    if (!house.liveRefresh && !f.title.trim()) { setError('Title is required for sites without live refresh.'); return }
    let closeIso = null
    if (f.closeLocal) {
      closeIso = zonedLocalToUtcIso(f.closeLocal, f.closeTz)
      if (!closeIso) { setError('Invalid close time.'); return }
    }

    setSaving(true)
    setError(null)
    try {
      const { refreshError } = await onAdd({
        house: parsed.house,
        lot_id: parsed.lotId,
        canonical_url: parsed.canonicalUrl,
        source_url: parsed.sourceUrl,
        auction_name: auctionName.slice(0, 200),
        title: f.title.trim().slice(0, 300) || null,
        lot_number: f.lotNumber.trim().slice(0, 20) || defaultLotNumber(parsed.house, parsed.lotId),
        scheduled_close_at: closeIso,
        priority: f.mustWin ? 'must_win' : 'normal',
      })
      setF(EMPTY)
      if (refreshError) setError(`Lot added, but live refresh failed: ${refreshError}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Grid>
        <Wide>
          <FieldLabel htmlFor="aw-url">Lot URL</FieldLabel>
          <EditInput id="aw-url" type="url" placeholder="https://bid.collectrea.com/lots/123456" value={f.url} onChange={set('url')} autoFocus />
          <Detected $error={!!parsed?.error}>
            {parsed?.error ?? (house && <>
              <Badge $tone="blue">{house.short}</Badge>
              {house.scraped
                ? `Price, close time and image refresh automatically (at most every ${house.refreshIntervalMin} min) when server-side scraping is configured; otherwise update the price manually.`
                : 'Price, close time and image refresh automatically.'}
            </>)}
          </Detected>
        </Wide>
        <Field>
          <FieldLabel htmlFor="aw-auction">Auction</FieldLabel>
          <EditInput id="aw-auction" list="aw-auctions" placeholder={knownAuctions[0] ?? 'e.g. Fall 2026'} value={f.auctionName} onChange={set('auctionName')} />
          <datalist id="aw-auctions">{knownAuctions.map(a => <option key={a} value={a} />)}</datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="aw-lotno">Lot number{house?.liveRefresh ? ' (optional)' : ''}</FieldLabel>
          <EditInput id="aw-lotno" value={f.lotNumber} onChange={set('lotNumber')} />
        </Field>
        <Wide>
          <FieldLabel htmlFor="aw-title">Title{autoHint}</FieldLabel>
          <EditInput id="aw-title" value={f.title} onChange={set('title')} />
        </Wide>
        <Wide>
          <FieldLabel htmlFor="aw-close">Scheduled close{autoHint}</FieldLabel>
          <Row>
            <EditInput id="aw-close" type="datetime-local" value={f.closeLocal} onChange={set('closeLocal')} />
            <EditSelect value={f.closeTz} onChange={set('closeTz')} aria-label="Close time zone">
              {CLOSE_TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </EditSelect>
          </Row>
        </Wide>
      </Grid>
      <CheckboxLabel><input type="checkbox" checked={f.mustWin} onChange={set('mustWin')} />Must win</CheckboxLabel>
      {error && <ErrorBanner role="alert">{error}</ErrorBanner>}
      <Footer>
        <SaveBtn type="submit" disabled={saving || !house}>{saving ? 'Adding…' : 'Add to watchlist'}</SaveBtn>
        <GhostBtn type="button" onClick={onClose}>Close</GhostBtn>
        <Hint>Supported: {houseNames(h => h.liveRefresh && !h.scraped)} (live), {houseNames(h => h.liveRefresh && h.scraped)} (live via server-side scrape, hourly; manual fallback).</Hint>
      </Footer>
    </Form>
  )
}
