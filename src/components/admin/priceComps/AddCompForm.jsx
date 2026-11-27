import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { CLOSE_TIMEZONES, HOUSES, zonedLocalToUtcIso } from '../../../lib/auctionWatchlist'
import { validateHttpsUrl } from '../../../lib/priceComps'
import { useOwnedItemOptions } from '../../../hooks/useAuctionPriceComps'
import { EditInput, EditSelect, EditTextarea, ErrorBanner, Field, FieldLabel, SaveBtn } from '../FormFields'
import { GhostBtn, Hint } from '../watchlist/styles'

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

const Row = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;

  > :first-child { flex: 1 1 12rem; min-width: 0; }
  > :last-child { flex: 0 0 9rem; }
`

const ItemSelect = styled(EditSelect)` margin-top: var(--space-2); `

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`

const HOUSE_SUGGESTIONS = Object.values(HOUSES).map(h => h.label)
const EMPTY = { house: '', auctionName: '', lotNumber: '', title: '', url: '', closeLocal: '', closeTz: 'America/New_York', itemQuery: '', itemId: '', notes: '' }

/** Add a lot tracked only for its closing price. No price is entered here. */
export function AddCompForm({ onAdd, onClose }) {
  const [f, setF] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { items, error: itemsError } = useOwnedItemOptions(true)
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }))

  const itemOptions = useMemo(() => {
    const q = f.itemQuery.trim().toLowerCase()
    const list = items ?? []
    const matches = q ? list.filter(i => i.title?.toLowerCase().includes(q) || i.id === q) : list
    // Keep the current selection visible even when the query no longer matches it.
    const selected = list.find(i => i.id === f.itemId)
    return selected && !matches.includes(selected) ? [selected, ...matches] : matches
  }, [items, f.itemQuery, f.itemId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!f.house.trim()) { setError('Auction house is required.'); return }
    if (!f.title.trim()) { setError('Title is required.'); return }
    const url = validateHttpsUrl(f.url, 'Lot URL')
    if (url.error) { setError(url.error); return }
    if (!f.itemId) { setError('Choose the owned item this comp is for.'); return }
    let closeIso = null
    if (f.closeLocal) {
      closeIso = zonedLocalToUtcIso(f.closeLocal, f.closeTz)
      if (!closeIso) { setError('Invalid close time.'); return }
    }

    setSaving(true)
    setError(null)
    try {
      await onAdd({
        auction_house: f.house.trim().slice(0, 100),
        auction_name: f.auctionName.trim().slice(0, 200) || null,
        lot_number: f.lotNumber.trim().slice(0, 20) || null,
        title: f.title.trim().slice(0, 300),
        source_url: url.url,
        scheduled_close_at: closeIso,
        owned_item_id: f.itemId,
        notes: f.notes.trim().slice(0, 1000) || null,
      })
      setF(EMPTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Grid>
        <Field>
          <FieldLabel htmlFor="pc-house">Auction house</FieldLabel>
          <EditInput id="pc-house" list="pc-houses" value={f.house} onChange={set('house')} autoFocus />
          <datalist id="pc-houses">{HOUSE_SUGGESTIONS.map(h => <option key={h} value={h} />)}</datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="pc-auction">Auction (optional)</FieldLabel>
          <EditInput id="pc-auction" placeholder="e.g. 2026 Fall Classic" value={f.auctionName} onChange={set('auctionName')} />
        </Field>
        <Wide>
          <FieldLabel htmlFor="pc-url">Lot URL</FieldLabel>
          <EditInput id="pc-url" type="url" placeholder="https://…" value={f.url} onChange={set('url')} />
        </Wide>
        <Wide>
          <FieldLabel htmlFor="pc-title">Title</FieldLabel>
          <EditInput id="pc-title" value={f.title} onChange={set('title')} />
        </Wide>
        <Field>
          <FieldLabel htmlFor="pc-lotno">Lot number (optional)</FieldLabel>
          <EditInput id="pc-lotno" value={f.lotNumber} onChange={set('lotNumber')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="pc-close">Scheduled close (optional)</FieldLabel>
          <Row>
            <EditInput id="pc-close" type="datetime-local" value={f.closeLocal} onChange={set('closeLocal')} />
            <EditSelect value={f.closeTz} onChange={set('closeTz')} aria-label="Close time zone">
              {CLOSE_TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </EditSelect>
          </Row>
        </Field>
        <Wide>
          <FieldLabel htmlFor="pc-item">Comp for owned item</FieldLabel>
          <EditInput placeholder="Filter items…" value={f.itemQuery} onChange={set('itemQuery')} aria-label="Filter owned items" />
          <ItemSelect id="pc-item" value={f.itemId} onChange={set('itemId')} disabled={!items}>
            <option value="">{items ? `Select an item (${itemOptions.length})` : itemsError ?? 'Loading items…'}</option>
            {itemOptions.map(i => <option key={i.id} value={i.id}>{i.title || i.id}</option>)}
          </ItemSelect>
        </Wide>
        <Wide>
          <FieldLabel htmlFor="pc-notes">Notes (optional)</FieldLabel>
          <EditTextarea id="pc-notes" rows={2} maxLength={1000} placeholder="e.g. Scheduled initial close; extended bidding possible." value={f.notes} onChange={set('notes')} />
        </Wide>
      </Grid>
      {error && <ErrorBanner role="alert">{error}</ErrorBanner>}
      <Footer>
        <SaveBtn type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add price comp'}</SaveBtn>
        <GhostBtn type="button" onClick={onClose}>Close</GhostBtn>
        <Hint>The final price is recorded later, from the auction results — never a current bid.</Hint>
      </Footer>
    </Form>
  )
}
