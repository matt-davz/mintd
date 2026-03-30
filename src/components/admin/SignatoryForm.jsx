import styled from 'styled-components'

// ─── Layout ───────────────────────────────────────────────────────────────────

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
`

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(140, 144, 159, 0.2);
  color: var(--color-on-surface);
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: var(--space-1) 0;
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-bottom-color: rgba(173, 198, 255, 0.5);
  }
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-outline);
  cursor: pointer;
  white-space: nowrap;

  input[type='checkbox'] {
    width: 0.875rem;
    height: 0.875rem;
    accent-color: var(--color-primary);
    cursor: pointer;
  }
`

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  color: var(--color-outline);
  transition: color var(--transition-base), background-color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }

  &:hover:not(:disabled) {
    color: var(--color-on-surface);
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:disabled {
    opacity: 0.2;
    cursor: default;
  }

  &.delete:hover:not(:disabled) {
    color: var(--color-error);
    background-color: rgba(147, 0, 10, 0.1);
  }
`

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px dashed rgba(173, 198, 255, 0.3);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  transition: border-color var(--transition-base), background-color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }

  &:hover {
    border-color: rgba(173, 198, 255, 0.6);
    background-color: rgba(173, 198, 255, 0.05);
  }
`

const Empty = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
  letter-spacing: 0.05em;
  padding: var(--space-2) 0;
`

// ─── Component ────────────────────────────────────────────────────────────────

export function SignatoryForm({ draftSigs, setDraftSigs }) {
  const sorted = [...draftSigs].sort((a, b) => a.display_order - b.display_order)

  function updateSig(key, field, value) {
    setDraftSigs(prev => prev.map(s => s._key === key ? { ...s, [field]: value } : s))
  }

  function removeSig(key) {
    setDraftSigs(prev => prev.filter(s => s._key !== key))
  }

  function moveUp(index) {
    if (index === 0) return
    const a = sorted[index]
    const b = sorted[index - 1]
    setDraftSigs(prev => prev.map(s => {
      if (s._key === a._key) return { ...s, display_order: b.display_order }
      if (s._key === b._key) return { ...s, display_order: a.display_order }
      return s
    }))
  }

  function moveDown(index) {
    if (index === sorted.length - 1) return
    const a = sorted[index]
    const b = sorted[index + 1]
    setDraftSigs(prev => prev.map(s => {
      if (s._key === a._key) return { ...s, display_order: b.display_order }
      if (s._key === b._key) return { ...s, display_order: a.display_order }
      return s
    }))
  }

  function addSig() {
    const maxOrder = draftSigs.length > 0
      ? Math.max(...draftSigs.map(s => s.display_order))
      : -1
    setDraftSigs(prev => [...prev, {
      id: null,
      _key: crypto.randomUUID(),
      name: '',
      is_featured: false,
      display_order: maxOrder + 1,
    }])
  }

  return (
    <List>
      {sorted.length === 0 && <Empty>No signatories — add one below.</Empty>}

      {sorted.map((sig, index) => (
        <Row key={sig._key}>
          <NameInput
            type="text"
            value={sig.name}
            placeholder="Signatory name"
            onChange={e => updateSig(sig._key, 'name', e.target.value)}
          />

          <CheckboxLabel>
            <input
              type="checkbox"
              checked={sig.is_featured ?? false}
              onChange={e => updateSig(sig._key, 'is_featured', e.target.checked)}
            />
            Featured
          </CheckboxLabel>

          <IconBtn onClick={() => moveUp(index)} disabled={index === 0} title="Move up">
            <span className="material-symbols-outlined">arrow_upward</span>
          </IconBtn>

          <IconBtn onClick={() => moveDown(index)} disabled={index === sorted.length - 1} title="Move down">
            <span className="material-symbols-outlined">arrow_downward</span>
          </IconBtn>

          <IconBtn className="delete" onClick={() => removeSig(sig._key)} title="Remove">
            <span className="material-symbols-outlined">delete</span>
          </IconBtn>
        </Row>
      ))}

      <AddBtn onClick={addSig}>
        <span className="material-symbols-outlined">add</span>
        Add Signatory
      </AddBtn>
    </List>
  )
}
