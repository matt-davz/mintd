import { useRef } from 'react'
import styled from 'styled-components'

// ─── Layout ───────────────────────────────────────────────────────────────────

const LoaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`

const LoaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-surface-high);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid rgba(140, 144, 159, 0.12);
`

const Preview = styled.div`
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const PdfIcon = styled.span`
  font-size: 1.5rem;
  color: var(--color-outline);

  .material-symbols-outlined { font-size: 1.5rem; }
`

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

const TypeChip = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
  background: rgba(173, 198, 255, 0.12);
  color: var(--color-primary);
  flex-shrink: 0;
`

const PendingChip = styled(TypeChip)`
  background: rgba(140, 144, 159, 0.12);
  color: var(--color-outline);
`

const Filename = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-outline);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LabelInput = styled.input`
  width: 100%;
  background: var(--color-surface);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--color-on-surface);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.4);
  }
`

const DeleteBtn = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  color: var(--color-outline);
  transition: color var(--transition-base);

  .material-symbols-outlined { font-size: 1.1rem; }
  &:hover { color: var(--color-error); }
`

const Empty = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
  letter-spacing: 0.05em;
  padding: var(--space-2) 0;
`

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  margin-top: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px dashed rgba(140, 144, 159, 0.3);
  color: rgba(229, 226, 225, 0.5);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: border-color var(--transition-base), color var(--transition-base);

  &:hover {
    border-color: rgba(173, 198, 255, 0.4);
    color: var(--color-primary);
  }

  .material-symbols-outlined { font-size: 1rem; }
`

// ─── Component ────────────────────────────────────────────────────────────────

export function LoaUploader({ draftLOAs, setDraftLOAs }) {
  const inputRef = useRef(null)

  function handleFiles(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setDraftLOAs(prev => [
      ...prev,
      ...files.map(file => ({
        _key: crypto.randomUUID(),
        file,
        localUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        resource_type: file.type === 'application/pdf' ? 'pdf' : 'image',
        label: '',
        filename: file.name,
      })),
    ])
    e.target.value = ''
  }

  function remove(key) {
    setDraftLOAs(prev => prev.filter(l => l._key !== key))
  }

  function setLabel(key, value) {
    setDraftLOAs(prev => prev.map(l => l._key === key ? { ...l, label: value } : l))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />

      {draftLOAs.length === 0 && <Empty>No LOAs added yet.</Empty>}

      <LoaList>
        {draftLOAs.map(loa => (
          <LoaRow key={loa._key}>
            <Preview>
              {loa.localUrl || (loa.id && loa.resource_type === 'image')
                ? <img src={loa.localUrl ?? loa.cloudinary_url} alt="" />
                : <PdfIcon><span className="material-symbols-outlined">description</span></PdfIcon>
              }
            </Preview>

            <Info>
              <TopRow>
                <TypeChip>{loa.resource_type === 'pdf' ? 'PDF' : 'Image'}</TypeChip>
                {!loa.id && <PendingChip>Pending</PendingChip>}
                {!loa.id && loa.filename && <Filename>{loa.filename}</Filename>}
              </TopRow>
              <LabelInput
                value={loa.label ?? ''}
                onChange={e => setLabel(loa._key, e.target.value)}
                placeholder="Label (e.g. JSA, PSA/DNA, Steiner)"
              />
            </Info>

            <DeleteBtn type="button" onClick={() => remove(loa._key)} title="Remove">
              <span className="material-symbols-outlined">delete</span>
            </DeleteBtn>
          </LoaRow>
        ))}
      </LoaList>

      <AddBtn type="button" onClick={() => inputRef.current?.click()}>
        <span className="material-symbols-outlined">upload_file</span>
        Add LOA
      </AddBtn>
    </div>
  )
}
