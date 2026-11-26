import { useState } from 'react'
import styled from 'styled-components'
import { useItemPrivateNotes } from '../../hooks/useItemPrivateNotes'
import { EditTextarea, SaveBtn, CancelBtn, ErrorBanner } from './FormFields'

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
`

const Label = styled.p`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const Badge = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary);
`

const Hint = styled.p`
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--color-outline);
  margin-bottom: var(--space-3);
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
  flex-wrap: wrap;
`

const Status = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.05em;
  color: var(--color-outline);
`

const Textarea = styled(EditTextarea)`
  min-height: 7rem;
`

const SmallSave = styled(SaveBtn)`
  padding: var(--space-2) var(--space-4);
  font-size: 0.6875rem;
`

const SmallCancel = styled(CancelBtn)`
  padding: var(--space-2) var(--space-4);
  font-size: 0.6875rem;
`

function formatSaved(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Admin-only private notes for an item (table `item_private_notes`).
 * Saved independently of the main item form via the Clerk-authenticated
 * client. Render with `key={itemId}` so switching items resets the draft.
 */
export function PrivateNotesSection({ itemId }) {
  const { note, loading, loadError, reload, save } = useItemPrivateNotes(itemId)
  const [draft, setDraft] = useState(null) // null = untouched, show saved body
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const savedBody = note?.body ?? ''
  const value = draft ?? savedBody
  const dirty = draft !== null && draft !== savedBody
  const canEdit = !loading && !loadError

  async function handleSave() {
    if (!dirty || saving) return
    if (savedBody.trim() && !draft.trim() &&
        !window.confirm('Clear this item\'s private notes?')) return
    setSaving(true)
    setSaveError(null)
    try {
      await save(draft)
      setDraft(null)
    } catch (e) {
      // Keep the draft so nothing typed is lost.
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header>
        <Label>Private notes</Label>
        <Badge>Admin only · not public</Badge>
      </Header>
      <Hint>
        Stored separately from the item record and never shown on the public site or API.
        Saved independently of the item Save button.
      </Hint>

      {loadError ? (
        <>
          <ErrorBanner>Couldn&apos;t load private notes: {loadError}</ErrorBanner>
          <Row><SmallCancel type="button" onClick={reload}>Retry</SmallCancel></Row>
        </>
      ) : (
        <>
          <Textarea
            value={value}
            disabled={!canEdit || saving}
            placeholder={loading ? 'Loading…' : 'Comps, pricing notes, sourcing contacts…'}
            onChange={e => setDraft(e.target.value)}
            aria-label="Private notes"
          />
          {saveError && <ErrorBanner style={{ marginTop: 'var(--space-3)' }}>{saveError}</ErrorBanner>}
          <Row>
            <SmallSave type="button" onClick={handleSave} disabled={!canEdit || !dirty || saving}>
              {saving ? 'Saving…' : 'Save private notes'}
            </SmallSave>
            {dirty && !saving && (
              <SmallCancel type="button" onClick={() => { setDraft(null); setSaveError(null) }}>
                Discard
              </SmallCancel>
            )}
            {saveError && !saving && (
              <SmallCancel type="button" onClick={() => { setSaveError(null); reload() }}>Reload saved</SmallCancel>
            )}
            <Status>
              {dirty ? 'Unsaved changes' : note?.updated_at ? `Saved ${formatSaved(note.updated_at)}` : !loading ? 'No private notes yet' : ''}
            </Status>
          </Row>
        </>
      )}
    </>
  )
}
