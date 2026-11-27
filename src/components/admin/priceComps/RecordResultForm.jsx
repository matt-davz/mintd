import { useState } from 'react'
import styled from 'styled-components'
import { PRICE_BASES, PRICE_BASIS_KEYS, parseDollarAmount, validateHttpsUrl } from '../../../lib/priceComps'
import { CheckboxLabel, EditInput, EditSelect, EditTextarea, ErrorBanner, Field, FieldLabel } from '../FormFields'
import { GhostBtn, Hint } from '../watchlist/styles'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-lowest);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);

  @media (min-width: 520px) { grid-template-columns: 1fr 1fr; }
`

const Wide = styled(Field)` grid-column: 1 / -1; `

const Footer = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
`

/**
 * Record (or correct) the verified realized price of a comp. Only the final
 * price from the auction house's published results belongs here — never a
 * current bid. The caller blocks this form before the scheduled close.
 */
export function RecordResultForm({ comp, onSave, onCancel }) {
  const correcting = comp.final_price != null
  const [price, setPrice] = useState(correcting ? String(comp.final_price) : '')
  const [basis, setBasis] = useState(comp.price_basis ?? 'unknown')
  const [resultUrl, setResultUrl] = useState(comp.result_url ?? comp.source_url ?? '')
  const [notes, setNotes] = useState(comp.notes ?? '')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = parseDollarAmount(price)
    if (amount === null) { setError('Enter the final price in dollars, e.g. 1250'); return }
    const url = validateHttpsUrl(resultUrl, 'Result URL')
    if (url.error) { setError(url.error); return }
    if (!confirmed) { setError('Confirm this is the final realized price, not a current bid.'); return }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        final_price: amount,
        price_basis: basis,
        result_url: url.url,
        verified_at: new Date().toISOString(),
        notes: notes.trim().slice(0, 1000) || null,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Hint>
        Copy the realized price from the auction&apos;s published results after the lot has closed
        (including any extended bidding). Current bids are never recorded here.
      </Hint>
      <Grid>
        <Field>
          <FieldLabel htmlFor={`pc-price-${comp.id}`}>Final price (USD)</FieldLabel>
          <EditInput id={`pc-price-${comp.id}`} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor={`pc-basis-${comp.id}`}>Price basis</FieldLabel>
          <EditSelect id={`pc-basis-${comp.id}`} value={basis} onChange={e => setBasis(e.target.value)}>
            {PRICE_BASIS_KEYS.map(k => <option key={k} value={k}>{PRICE_BASES[k].long}</option>)}
          </EditSelect>
        </Field>
        <Wide>
          <FieldLabel htmlFor={`pc-result-${comp.id}`}>Result source URL</FieldLabel>
          <EditInput id={`pc-result-${comp.id}`} type="url" value={resultUrl} onChange={e => setResultUrl(e.target.value)} />
        </Wide>
        <Wide>
          <FieldLabel htmlFor={`pc-notes-${comp.id}`}>Notes (optional)</FieldLabel>
          <EditTextarea id={`pc-notes-${comp.id}`} rows={2} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} />
        </Wide>
      </Grid>
      <CheckboxLabel>
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
        This is the final realized price from the auction results
      </CheckboxLabel>
      {error && <ErrorBanner role="alert">{error}</ErrorBanner>}
      <Footer>
        <GhostBtn type="submit" disabled={saving}>{saving ? 'Saving…' : correcting ? 'Save correction' : 'Record result'}</GhostBtn>
        <GhostBtn type="button" onClick={onCancel} disabled={saving}>Cancel</GhostBtn>
      </Footer>
    </Form>
  )
}
