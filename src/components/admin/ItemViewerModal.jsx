import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import { useItem } from '../../hooks/useItem'
import { supabase } from '../../lib/supabase'
import { CertForm } from './CertForm'
import { SignatoryForm } from './SignatoryForm'
import { ImageUploader } from './ImageUploader'

// ─── Reconcile helpers ────────────────────────────────────────────────────────

function stripKey(obj) {
  const copy = { ...obj }
  delete copy._key
  return copy
}

function reconcileCerts(draft, original, itemId) {
  const ops = []
  const draftIds = new Set(draft.filter(c => c.id).map(c => c.id))
  const toDelete = original.filter(c => !draftIds.has(c.id)).map(c => c.id)
  if (toDelete.length) {
    ops.push(supabase.from('certifications').delete().in('id', toDelete))
  }
  const toUpsert = draft.map(c => {
    const row = { ...stripKey(c), item_id: itemId }
    if (!row.id) delete row.id
    return row
  })
  if (toUpsert.length) {
    ops.push(supabase.from('certifications').upsert(toUpsert, { onConflict: 'id' }))
  }
  return ops
}

function reconcileSigs(draft, original, itemId) {
  const ops = []
  const draftIds = new Set(draft.filter(s => s.id).map(s => s.id))
  const toDelete = original.filter(s => !draftIds.has(s.id)).map(s => s.id)
  if (toDelete.length) {
    ops.push(supabase.from('signatories').delete().in('id', toDelete))
  }
  const toUpsert = draft.map(s => {
    const row = { ...stripKey(s), item_id: itemId }
    if (!row.id) delete row.id
    return row
  })
  if (toUpsert.length) {
    ops.push(supabase.from('signatories').upsert(toUpsert, { onConflict: 'id' }))
  }
  return ops
}

function reconcileImages(draft, original) {
  const ops = []
  const draftIds = new Set(draft.filter(i => i.id).map(i => i.id))
  const toDelete = original.filter(i => !draftIds.has(i.id)).map(i => i.id)
  if (toDelete.length) {
    ops.push(supabase.from('images').delete().in('id', toDelete))
  }
  const toUpdate = draft.filter(i => i.id).map(i => stripKey(i))
  if (toUpdate.length) {
    ops.push(supabase.from('images').upsert(toUpdate, { onConflict: 'id' }))
  }
  return ops
}

// ─── Overlay & shell ──────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
`

const Panel = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 64rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  gap: var(--space-4);
`

const PanelTitle = styled.h2`
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ $editing }) => $editing ? 'var(--color-primary)' : 'var(--color-outline)'};
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
`

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.5);
  transition: color var(--transition-base), background-color var(--transition-base);

  .material-symbols-outlined { font-size: 1.125rem; }

  &:hover {
    color: var(--color-on-surface);
    background-color: var(--color-surface-bright);
  }
`

const EditBtn = styled(IconBtn)`
  background-color: rgba(173, 198, 255, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(173, 198, 255, 0.2);

  &:hover {
    background-color: rgba(173, 198, 255, 0.2);
    color: var(--color-primary);
  }
`

const SaveBtn = styled.button`
  padding: 0 var(--space-4);
  height: 2rem;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: opacity var(--transition-base);

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const CancelBtn = styled.button`
  padding: 0 var(--space-4);
  height: 2rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.6);
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: color var(--transition-base), background-color var(--transition-base);

  &:hover { color: var(--color-on-surface); background-color: var(--color-surface-bright); }
`

const EditBanner = styled.div`
  flex-shrink: 0;
  padding: var(--space-2) var(--space-6);
  background-color: rgba(173, 198, 255, 0.06);
  border-bottom: 1px solid rgba(173, 198, 255, 0.12);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: rgba(173, 198, 255, 0.6);
  text-transform: uppercase;
`

const SaveErrorBanner = styled.div`
  flex-shrink: 0;
  padding: var(--space-2) var(--space-6);
  background-color: rgba(147, 0, 10, 0.15);
  border-bottom: 1px solid rgba(255, 180, 171, 0.15);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: #ffb4ab;
`

const PanelBody = styled.div`
  overflow-y: auto;
  flex: 1;
`

// ─── Edit input primitives ─────────────────────────────────────────────────────

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

const EditInputLarge = styled(EditInput)`
  font-family: var(--font-headline);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  padding: var(--space-2) var(--space-3);
`

const EditTextarea = styled.textarea`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.6;
  padding: var(--space-2) var(--space-3);
  resize: vertical;
  min-height: 5rem;
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

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  padding: var(--space-1) 0;

  input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
    cursor: pointer;
    flex-shrink: 0;
  }
`

// ─── Top section: photo + key info ────────────────────────────────────────────

const TopSection = styled.div`
  display: flex;
  gap: var(--space-6);
  padding: var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 640px) { flex-direction: column; }
`

const PhotoWrap = styled.div`
  width: 10rem;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  aspect-ratio: 4/5;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .material-symbols-outlined {
    font-size: 2.5rem;
    color: var(--color-surface-bright);
  }

  @media (max-width: 640px) {
    width: 100%;
    aspect-ratio: 16/9;
  }
`

const KeyInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`

const ItemTitle = styled.h3`
  font-family: var(--font-headline);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--color-on-surface);
  line-height: 1.2;
`

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`

const GradeBadge = styled.span`
  display: inline-block;
  background-color: var(--color-secondary-container);
  color: var(--color-secondary-fixed);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.25rem var(--space-3);
  border-radius: var(--radius-sm);
`

const Tag = styled.span`
  display: inline-block;
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.6);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.25rem var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid rgba(140, 144, 159, 0.15);
`

const ForSaleTag = styled(Tag)`
  color: var(--color-primary);
  border-color: rgba(173, 198, 255, 0.25);
  background-color: rgba(173, 198, 255, 0.08);
`

// ─── Fields grid ──────────────────────────────────────────────────────────────

const Section = styled.div`
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child { border-bottom: none; }
`

const SectionLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-4);
`

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4) var(--space-6);

  @media (min-width: 640px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 900px) { grid-template-columns: repeat(4, 1fr); }
`

const Field = styled.div``

const FieldLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-1);
`

const FieldValue = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: ${({ $accent }) =>
    $accent === 'gold' ? 'var(--color-secondary-fixed)' :
    $accent === 'blue' ? 'var(--color-primary)' :
    'var(--color-on-surface-variant)'};
  word-break: break-all;
`

const FieldLink = styled.a`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;
  &:hover { opacity: 0.7; }
`

const BoolValue = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $on }) => $on ? 'var(--color-primary)' : 'var(--color-outline)'};
`

const Muted = styled.span`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
`

// ─── Cert row ─────────────────────────────────────────────────────────────────

const CertCard = styled.div`
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.12);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-6);

  @media (min-width: 640px) { grid-template-columns: repeat(4, 1fr); }
`

const CertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`

// ─── Signatory list ───────────────────────────────────────────────────────────

const SigList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const SigRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ $featured }) => $featured ? 'var(--color-secondary-fixed)' : 'var(--color-on-surface-variant)'};

  .material-symbols-outlined {
    font-size: 0.875rem;
    color: var(--color-secondary-fixed);
  }
`

// ─── Image strip ──────────────────────────────────────────────────────────────

const ImageStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
`

const ImageThumb = styled.div`
  position: relative;
  width: 5rem;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-high);
  border: 2px solid ${({ $primary }) => $primary ? 'var(--color-primary)' : 'rgba(140, 144, 159, 0.15)'};

  img { width: 100%; height: 100%; object-fit: cover; }
`

const PrimaryBadge = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(77, 142, 255, 0.85);
  font-family: var(--font-mono);
  font-size: 0.4375rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: white;
  text-align: center;
  padding: 2px 0;
`

// ─── Loading / error ──────────────────────────────────────────────────────────

const StatusMsg = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--space-16);
  text-align: center;
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(n) {
  if (n == null) return null
  return `$${Number(n).toLocaleString()}`
}

function Bool({ value }) {
  return <BoolValue $on={value}>{value ? 'Yes' : 'No'}</BoolValue>
}

function Val({ value, accent, href }) {
  if (!value && value !== 0 && value !== false) return <Muted>—</Muted>
  if (href) return <FieldLink href={href} target="_blank" rel="noreferrer">{value}</FieldLink>
  return <FieldValue $accent={accent}>{value}</FieldValue>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ItemViewerModal({ itemId, onClose }) {
  const { item, signatories, certifications, images, loading, error, refetch } = useItem(itemId)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [form, setForm] = useState(null)
  const [draftCerts, setDraftCerts] = useState([])
  const [draftSigs, setDraftSigs] = useState([])
  const [draftImages, setDraftImages] = useState([])
  const originalRef = useRef(null)

  function enterEditMode() {
    const f = {
      title:               item.title ?? '',
      description:         item.description ?? '',
      reference_link:      item.reference_link ?? '',
      price:               item.price ?? '',
      auto_total:          item.auto_total ?? '',
      acquisition_type:    item.acquisition_type ?? 'unknown',
      is_autographed:      item.is_autographed ?? false,
      is_world_series_game: item.is_world_series_game ?? false,
      is_clinch_game:      item.is_clinch_game ?? false,
      for_sale:            item.for_sale ?? false,
      is_visible:          item.is_visible ?? false,
      is_baseball:         item.is_baseball ?? false,
      is_part_of_set:      item.is_part_of_set ?? false,
      ws_game_number:      item.ws_game_number ?? '',
      clinch_number:       item.clinch_number ?? '',
      game_date:           item.game_date ?? '',
      purchase_date:       item.purchase_date ?? '',
      location:            item.location ?? '',
      notes:               item.notes ?? '',
    }
    const dc = certifications.map(c => ({ ...c, _key: c.id }))
    const ds = signatories.map(s => ({ ...s, _key: s.id }))
    const di = images.map(i => ({ ...i, _key: i.id }))
    setForm(f)
    setDraftCerts(dc)
    setDraftSigs(ds)
    setDraftImages(di)
    originalRef.current = {
      f: JSON.parse(JSON.stringify(f)),
      dc: JSON.parse(JSON.stringify(dc)),
      ds: JSON.parse(JSON.stringify(ds)),
      di: JSON.parse(JSON.stringify(di)),
    }
    setIsEditing(true)
  }

  // Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (isEditing) {
        if (window.confirm('Discard unsaved changes?')) {
          setIsEditing(false)
          setForm(null)
          setSaveError(null)
        }
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isEditing])

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleCancel() {
    const orig = originalRef.current
    const dirty = JSON.stringify(form) !== JSON.stringify(orig?.f)
      || JSON.stringify(draftCerts) !== JSON.stringify(orig?.dc)
      || JSON.stringify(draftSigs) !== JSON.stringify(orig?.ds)
      || JSON.stringify(draftImages) !== JSON.stringify(orig?.di)
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setIsEditing(false)
    setForm(null)
    setSaveError(null)
  }

  async function handleSave() {
    const orig = originalRef.current
    const isDirty = JSON.stringify(form) !== JSON.stringify(orig?.f)
      || JSON.stringify(draftCerts) !== JSON.stringify(orig?.dc)
      || JSON.stringify(draftSigs) !== JSON.stringify(orig?.ds)
      || JSON.stringify(draftImages) !== JSON.stringify(orig?.di)

    if (!isDirty) {
      setIsEditing(false)
      setForm(null)
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const { error: itemErr } = await supabase.from('items').update({
        title:               form.title,
        description:         form.description || null,
        reference_link:      form.reference_link || null,
        price:               form.price === '' ? null : Number(form.price),
        auto_total:          form.auto_total === '' ? null : Number(form.auto_total),
        acquisition_type:    form.acquisition_type,
        is_autographed:      form.is_autographed,
        is_world_series_game: form.is_world_series_game,
        ws_game_number:      form.ws_game_number === '' ? null : Number(form.ws_game_number),
        is_clinch_game:      form.is_clinch_game,
        clinch_number:       form.clinch_number === '' ? null : Number(form.clinch_number),
        for_sale:            form.for_sale,
        is_visible:          form.is_visible,
        is_baseball:         form.is_baseball,
        is_part_of_set:      form.is_part_of_set,
        game_date:           form.game_date || null,
        purchase_date:       form.purchase_date || null,
        location:            form.location || null,
        notes:               form.notes || null,
      }).eq('id', itemId)

      if (itemErr) throw new Error(itemErr.message)

      const ops = [
        ...reconcileCerts(draftCerts, certifications, itemId),
        ...reconcileSigs(draftSigs, signatories, itemId),
        ...reconcileImages(draftImages, images),
      ]

      if (ops.length) {
        const results = await Promise.all(ops)
        const firstErr = results.find(r => r.error)
        if (firstErr) throw new Error(firstErr.error.message)
      }

      refetch()
      setIsEditing(false)
      setForm(null)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleOverlayClick() {
    if (isEditing) {
      if (window.confirm('Discard unsaved changes?')) {
        setIsEditing(false)
        setForm(null)
        setSaveError(null)
        onClose()
      }
    } else {
      onClose()
    }
  }

  const primaryImage = images.find(i => i.is_primary) ?? images[0]

  return (
    <Overlay onClick={handleOverlayClick}>
      <Panel onClick={e => e.stopPropagation()}>

        <PanelHeader>
          <PanelTitle $editing={isEditing}>
            {isEditing ? 'Editing Item' : 'Item Record'}
          </PanelTitle>
          <HeaderActions>
            {isEditing ? (
              <>
                <SaveBtn onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </SaveBtn>
                <CancelBtn onClick={handleCancel}>Cancel</CancelBtn>
              </>
            ) : (
              <EditBtn onClick={enterEditMode} title="Edit item">
                <span className="material-symbols-outlined">edit</span>
              </EditBtn>
            )}
            <IconBtn onClick={isEditing ? handleOverlayClick : onClose} title="Close">
              <span className="material-symbols-outlined">close</span>
            </IconBtn>
          </HeaderActions>
        </PanelHeader>

        {isEditing && <EditBanner>Changes are not saved until you click Save</EditBanner>}
        {isEditing && saveError && <SaveErrorBanner>Error: {saveError}</SaveErrorBanner>}

        <PanelBody>
          {loading && <StatusMsg>Loading...</StatusMsg>}
          {error && <StatusMsg>Error: {error}</StatusMsg>}

          {!loading && !error && item && (
            <>
              {/* ── Top: photo + key info ── */}
              <TopSection>
                <PhotoWrap>
                  {primaryImage
                    ? <img src={primaryImage.cloudinary_url} alt={item.title} />
                    : <span className="material-symbols-outlined">image</span>}
                </PhotoWrap>

                <KeyInfo>
                  {isEditing ? (
                    <EditInputLarge
                      type="text"
                      value={form.title}
                      placeholder="Item title"
                      onChange={e => setField('title', e.target.value)}
                    />
                  ) : (
                    <ItemTitle>{item.title}</ItemTitle>
                  )}

                  <BadgeRow>
                    {certifications[0] && (
                      <GradeBadge>
                        {certifications[0].cert_service} {certifications[0].item_grade ?? certifications[0].auto_grade ?? ''}
                      </GradeBadge>
                    )}
                    {item.for_sale && <ForSaleTag>For Sale</ForSaleTag>}
                    {item.is_autographed && <Tag>Signed</Tag>}
                    {item.is_world_series_game && <Tag>World Series</Tag>}
                    {item.is_clinch_game && <Tag>Clinch Game</Tag>}
                  </BadgeRow>

                  {!isEditing && item.price && (
                    <FieldValue $accent="blue" style={{ fontSize: '1.25rem' }}>
                      ${Number(item.price).toLocaleString()}
                    </FieldValue>
                  )}

                  {isEditing ? (
                    <EditTextarea
                      value={form.description}
                      placeholder="Item description..."
                      onChange={e => setField('description', e.target.value)}
                    />
                  ) : item.description ? (
                    <FieldValue style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--color-on-surface-variant)' }}>
                      {item.description}
                    </FieldValue>
                  ) : null}
                </KeyInfo>
              </TopSection>

              {/* ── Certifications ── */}
              {(isEditing || certifications.length > 0) && (
                <Section>
                  <SectionLabel>Certifications</SectionLabel>
                  {isEditing ? (
                    <CertForm draftCerts={draftCerts} setDraftCerts={setDraftCerts} />
                  ) : (
                    <CertList>
                      {certifications.map(cert => (
                        <CertCard key={cert.id}>
                          <Field>
                            <FieldLabel>Service</FieldLabel>
                            <Val value={cert.cert_service} />
                          </Field>
                          <Field>
                            <FieldLabel>Item Grade</FieldLabel>
                            <Val value={cert.item_grade} accent="gold" />
                          </Field>
                          <Field>
                            <FieldLabel>Auto Grade</FieldLabel>
                            <Val value={cert.auto_grade} accent="gold" />
                          </Field>
                          <Field>
                            <FieldLabel>Cert ID</FieldLabel>
                            {cert.cert_id ? (
                              ['PSA', 'PSA/DNA'].includes(cert.cert_service) ? (
                                <Val
                                  value={`#${cert.cert_id}`}
                                  accent="blue"
                                  href={`https://www.psacard.com/cert/${cert.cert_id}/psa`}
                                />
                              ) : (
                                <Val value={`#${cert.cert_id}`} accent="blue" />
                              )
                            ) : <Muted>—</Muted>}
                          </Field>
                          {cert.cert_link && (
                            <Field style={{ gridColumn: '1 / -1' }}>
                              <FieldLabel>Cert Link</FieldLabel>
                              <Val value={cert.cert_link} href={cert.cert_link} />
                            </Field>
                          )}
                        </CertCard>
                      ))}
                    </CertList>
                  )}
                </Section>
              )}

              {/* ── Signatories ── */}
              {(isEditing || signatories.length > 0) && (
                <Section>
                  <SectionLabel>{signatories.length === 1 ? 'Signatory' : 'Signatories'}</SectionLabel>
                  {isEditing ? (
                    <SignatoryForm draftSigs={draftSigs} setDraftSigs={setDraftSigs} />
                  ) : (
                    <SigList>
                      {signatories.map(s => (
                        <SigRow key={s.id} $featured={s.is_featured}>
                          {s.is_featured && <span className="material-symbols-outlined">verified</span>}
                          {s.name}
                        </SigRow>
                      ))}
                    </SigList>
                  )}
                </Section>
              )}

              {/* ── Financials ── */}
              <Section>
                <SectionLabel>Financials</SectionLabel>
                <FieldGrid>
                  <Field>
                    <FieldLabel>Price</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        placeholder="0.00"
                        onChange={e => setField('price', e.target.value)}
                      />
                    ) : (
                      <Val value={formatCurrency(item.price)} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Auto Total</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.auto_total}
                        placeholder="0.00"
                        onChange={e => setField('auto_total', e.target.value)}
                      />
                    ) : (
                      <Val value={formatCurrency(item.auto_total)} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Acquisition Type</FieldLabel>
                    {isEditing ? (
                      <EditSelect
                        value={form.acquisition_type}
                        onChange={e => setField('acquisition_type', e.target.value)}
                      >
                        <option value="purchased">Purchased</option>
                        <option value="gifted">Gifted</option>
                        <option value="inherited">Inherited</option>
                        <option value="consignment">Consignment</option>
                        <option value="unknown">Unknown</option>
                      </EditSelect>
                    ) : (
                      <Val value={item.acquisition_type} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>For Sale</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.for_sale}
                          onChange={e => setField('for_sale', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.for_sale} />
                    )}
                  </Field>
                </FieldGrid>
              </Section>

              {/* ── Game context ── */}
              <Section>
                <SectionLabel>Game Context</SectionLabel>
                <FieldGrid>
                  <Field>
                    <FieldLabel>Game Date</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="date"
                        value={form.game_date}
                        onChange={e => setField('game_date', e.target.value)}
                      />
                    ) : (
                      <Val value={formatDate(item.game_date)} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Purchase Date</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="date"
                        value={form.purchase_date}
                        onChange={e => setField('purchase_date', e.target.value)}
                      />
                    ) : (
                      <Val value={formatDate(item.purchase_date)} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>World Series</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_world_series_game}
                          onChange={e => setField('is_world_series_game', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_world_series_game} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>WS Game #</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="number"
                        min="1"
                        max="7"
                        value={form.ws_game_number}
                        placeholder="—"
                        disabled={!form.is_world_series_game}
                        onChange={e => setField('ws_game_number', e.target.value)}
                        style={{ opacity: form.is_world_series_game ? 1 : 0.3 }}
                      />
                    ) : (
                      <Val value={item.ws_game_number} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Clinch Game</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_clinch_game}
                          onChange={e => setField('is_clinch_game', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_clinch_game} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Clinch #</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="number"
                        min="1"
                        value={form.clinch_number}
                        placeholder="—"
                        disabled={!form.is_clinch_game}
                        onChange={e => setField('clinch_number', e.target.value)}
                        style={{ opacity: form.is_clinch_game ? 1 : 0.3 }}
                      />
                    ) : (
                      <Val value={item.clinch_number} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Autographed</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_autographed}
                          onChange={e => setField('is_autographed', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_autographed} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Location</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="text"
                        value={form.location}
                        placeholder="Storage location"
                        onChange={e => setField('location', e.target.value)}
                      />
                    ) : (
                      <Val value={item.location} />
                    )}
                  </Field>
                </FieldGrid>
              </Section>

              {/* ── Visibility & meta ── */}
              <Section>
                <SectionLabel>Meta</SectionLabel>
                <FieldGrid>
                  <Field>
                    <FieldLabel>Visible</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_visible}
                          onChange={e => setField('is_visible', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_visible} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Baseball</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_baseball}
                          onChange={e => setField('is_baseball', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_baseball} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>In Set</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_part_of_set}
                          onChange={e => setField('is_part_of_set', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_part_of_set} />
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Added</FieldLabel>
                    <Val value={formatDate(item.created_at)} />
                  </Field>
                  <Field>
                    <FieldLabel>Updated</FieldLabel>
                    <Val value={formatDate(item.updated_at)} />
                  </Field>
                  {(isEditing || item.reference_link) && (
                    <Field>
                      <FieldLabel>Reference Link</FieldLabel>
                      {isEditing ? (
                        <EditInput
                          type="url"
                          value={form.reference_link}
                          placeholder="https://..."
                          onChange={e => setField('reference_link', e.target.value)}
                        />
                      ) : (
                        <Val value="View ↗" href={item.reference_link} />
                      )}
                    </Field>
                  )}
                </FieldGrid>

                <Field style={{ marginTop: 'var(--space-4)' }}>
                  <FieldLabel>Notes</FieldLabel>
                  {isEditing ? (
                    <EditTextarea
                      value={form.notes}
                      placeholder="Internal notes..."
                      onChange={e => setField('notes', e.target.value)}
                    />
                  ) : item.notes ? (
                    <FieldValue style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {item.notes}
                    </FieldValue>
                  ) : (
                    <Muted>—</Muted>
                  )}
                </Field>
              </Section>

              {/* ── Images ── */}
              {(isEditing || images.length > 0) && (
                <Section>
                  <SectionLabel>Images {images.length > 0 ? `(${images.length})` : ''}</SectionLabel>
                  {isEditing ? (
                    <ImageUploader draftImages={draftImages} setDraftImages={setDraftImages} />
                  ) : (
                    <>
                      <ImageStrip>
                        {images.map(img => (
                          <ImageThumb key={img.id} $primary={img.is_primary}>
                            <img src={img.cloudinary_url} alt="" />
                            {img.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
                          </ImageThumb>
                        ))}
                      </ImageStrip>
                      <FieldGrid style={{ marginTop: 'var(--space-4)' }}>
                        {images.map(img => (
                          <Field key={img.id}>
                            <FieldLabel>{img.is_primary ? 'Primary' : 'Image'} · Cloudinary ID</FieldLabel>
                            <FieldValue style={{ fontSize: '0.625rem' }}>{img.cloudinary_public_id}</FieldValue>
                          </Field>
                        ))}
                      </FieldGrid>
                    </>
                  )}
                </Section>
              )}
            </>
          )}
        </PanelBody>
      </Panel>
    </Overlay>
  )
}
