import { useRef } from 'react'
import styled from 'styled-components'

// ─── Layout ───────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: var(--space-4);
`

const Card = styled.div`
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-high);
  border: 2px solid ${({ $primary }) => $primary ? 'var(--color-primary)' : 'rgba(140, 144, 159, 0.15)'};
  aspect-ratio: 3 / 4;
  transition: border-color var(--transition-base);
`

const Thumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: var(--space-2);
  opacity: 0;
  transition: opacity var(--transition-base), background var(--transition-base);

  ${Card}:hover & {
    opacity: 1;
    background: rgba(0, 0, 0, 0.5);
  }
`

const PrimaryBadge = styled.span`
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
`

const PendingBadge = styled.span`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background-color: rgba(0, 0, 0, 0.6);
  color: rgba(229, 226, 225, 0.5);
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
`

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  background-color: rgba(0, 0, 0, 0.5);
  color: rgba(229, 226, 225, 0.8);
  transition: color var(--transition-base), background-color var(--transition-base);
  flex-shrink: 0;

  .material-symbols-outlined { font-size: 1rem; }

  &:hover { color: #fff; background-color: rgba(0, 0, 0, 0.7); }
  &.delete:hover { color: var(--color-error); }
  &.primary:hover { color: var(--color-primary); }
`

const Empty = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
  letter-spacing: 0.05em;
  padding: var(--space-2) 0;
`

const UploadBtn = styled.button`
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

export function ImageUploader({ draftImages, setDraftImages }) {
  const inputRef = useRef(null)

  function setPrimary(key) {
    setDraftImages(prev => prev.map(img => ({
      ...img,
      is_primary: img._key === key,
    })))
  }

  function removeImage(key) {
    setDraftImages(prev => {
      const next = prev.filter(img => img._key !== key)
      // If we removed the primary and there are others left, promote the first
      if (prev.find(img => img._key === key)?.is_primary && next.length > 0) {
        next[0] = { ...next[0], is_primary: true }
      }
      return next
    })
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setDraftImages(prev => {
      const isFirst = prev.length === 0
      const newImages = files.map((file, i) => ({
        _key: crypto.randomUUID(),
        file,
        localUrl: URL.createObjectURL(file),
        is_primary: isFirst && i === 0,
      }))
      return [...prev, ...newImages]
    })

    // Reset so the same file can be re-added if needed
    e.target.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />

      {draftImages.length === 0 && <Empty>No images added yet.</Empty>}

      <Grid>
        {draftImages.map(img => {
          const src = img.localUrl ?? img.cloudinary_url
          return (
            <Card key={img._key} $primary={img.is_primary}>
              {img.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
              {img.localUrl && <PendingBadge>Pending</PendingBadge>}
              <Thumb src={src} alt="" />
              <CardOverlay>
                <IconBtn
                  className="primary"
                  onClick={() => setPrimary(img._key)}
                  title={img.is_primary ? 'Primary image' : 'Set as primary'}
                >
                  <span className="material-symbols-outlined">
                    {img.is_primary ? 'star' : 'star_border'}
                  </span>
                </IconBtn>
                <IconBtn
                  className="delete"
                  onClick={() => removeImage(img._key)}
                  title="Remove image"
                >
                  <span className="material-symbols-outlined">delete</span>
                </IconBtn>
              </CardOverlay>
            </Card>
          )
        })}
      </Grid>

      <UploadBtn type="button" onClick={() => inputRef.current?.click()}>
        <span className="material-symbols-outlined">cloud_upload</span>
        Add Images
      </UploadBtn>
    </div>
  )
}
