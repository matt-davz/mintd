import styled from 'styled-components'

const CERT_SERVICES = ['PSA', 'PSA/DNA', 'BGS', 'JSA', 'SGC', 'Steiner', 'CGC', 'MLB Auth', 'Beckett', 'K&D']

// ─── Shared input primitives ───────────────────────────────────────────────────

const EditInput = styled.input`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
`

const EditSelect = styled.select`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-base);
  cursor: pointer;

  option { background-color: var(--color-surface-low); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
`

// ─── Layout ───────────────────────────────────────────────────────────────────

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const Card = styled.div`
  position: relative;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  padding-top: var(--space-6);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`

const FieldLabel = styled.label`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.4);
`

const FullRow = styled.div`
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`

const CheckRow = styled.div`
  margin-top: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-3);
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: var(--color-on-surface-variant);
  cursor: pointer;

  input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
    cursor: pointer;
  }
`

const DeleteBtn = styled.button`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-sm);
  color: var(--color-outline);
  transition: color var(--transition-base), background-color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }

  &:hover {
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

export function CertForm({ draftCerts, setDraftCerts }) {
  function updateCert(key, field, value) {
    setDraftCerts(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c))
  }

  function removeCert(key) {
    setDraftCerts(prev => prev.filter(c => c._key !== key))
  }

  function addCert() {
    setDraftCerts(prev => [...prev, {
      id: null,
      _key: crypto.randomUUID(),
      cert_service: 'PSA',
      cert_id: '',
      cert_link: '',
      item_grade: '',
      auto_grade: '',
      is_autograph_cert: false,
    }])
  }

  return (
    <List>
      {draftCerts.length === 0 && <Empty>No certifications — add one below.</Empty>}

      {draftCerts.map(cert => (
        <Card key={cert._key}>
          <DeleteBtn onClick={() => removeCert(cert._key)} title="Remove certification">
            <span className="material-symbols-outlined">delete</span>
          </DeleteBtn>

          <Grid>
            <FieldGroup>
              <FieldLabel>Service</FieldLabel>
              <EditSelect
                value={cert.cert_service}
                onChange={e => updateCert(cert._key, 'cert_service', e.target.value)}
              >
                {CERT_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </EditSelect>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Cert ID</FieldLabel>
              <EditInput
                type="text"
                value={cert.cert_id ?? ''}
                placeholder="e.g. 12345678"
                onChange={e => updateCert(cert._key, 'cert_id', e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Item Grade</FieldLabel>
              <EditInput
                type="text"
                value={cert.item_grade ?? ''}
                placeholder="e.g. 9"
                onChange={e => updateCert(cert._key, 'item_grade', e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Auto Grade</FieldLabel>
              <EditInput
                type="text"
                value={cert.auto_grade ?? ''}
                placeholder="e.g. 10"
                onChange={e => updateCert(cert._key, 'auto_grade', e.target.value)}
              />
            </FieldGroup>
          </Grid>

          <FullRow>
            <FieldLabel>Cert Link</FieldLabel>
            <EditInput
              type="url"
              value={cert.cert_link ?? ''}
              placeholder="https://..."
              onChange={e => updateCert(cert._key, 'cert_link', e.target.value)}
            />
          </FullRow>

          <CheckRow>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={cert.is_autograph_cert ?? false}
                onChange={e => updateCert(cert._key, 'is_autograph_cert', e.target.checked)}
              />
              Autograph Cert
            </CheckboxLabel>
          </CheckRow>
        </Card>
      ))}

      <AddBtn onClick={addCert}>
        <span className="material-symbols-outlined">add</span>
        Add Certification
      </AddBtn>
    </List>
  )
}
