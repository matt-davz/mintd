import { useState } from 'react'
import styled from 'styled-components'
import { EditInput } from '../FormFields'
import { GhostBtn, Hint } from './styles'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-lowest);
`

const Row = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: center;

  input { flex: 1; min-width: 0; }
`

const Err = styled.span`
  font-size: 0.6875rem;
  color: var(--color-error);
`

/**
 * Manual current-bid entry for sites we can't fetch (Grey Flannel, Heritage)
 * or to correct a reading. Saved with bid_source = 'manual' and shown as such.
 */
export function ManualPriceForm({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const cleaned = String(value).replace(/[$,\s]/g, '')
    if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) {
      setError('Enter a dollar amount, e.g. 1250')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(Number(cleaned))
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Hint>Copy the current bid from the lot page. It will be labeled Manual.</Hint>
      <Row>
        <EditInput
          inputMode="decimal"
          placeholder="Current bid (USD)"
          value={value}
          onChange={e => setValue(e.target.value)}
          aria-label="Manual current bid in USD"
          autoFocus
        />
        <GhostBtn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</GhostBtn>
        <GhostBtn type="button" onClick={onCancel} disabled={saving}>Cancel</GhostBtn>
      </Row>
      {error && <Err role="alert">{error}</Err>}
    </Form>
  )
}
