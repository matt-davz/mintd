import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from '../../lib/cloudinary'
import { CertForm } from '../../components/admin/CertForm'
import { SignatoryForm } from '../../components/admin/SignatoryForm'
import { ImageUploader } from '../../components/admin/ImageUploader'

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageHeading = styled.div`
  margin-bottom: var(--space-8);
`

const PageTitle = styled.h1`
  font-family: var(--font-headline);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-2);
`

const PageSub = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(229, 226, 225, 0.4);
`

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 64rem;
`

const Section = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.12);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
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

const FieldLabel = styled.label`
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-1);
`

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

  &:disabled { opacity: 0.3; }
`

const EditInputLarge = styled(EditInput)`
  font-family: var(--font-headline);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
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

const FullField = styled(Field)`
  grid-column: 1 / -1;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-2);
`

const SaveBtn = styled.button`
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: opacity var(--transition-base);

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const CancelBtn = styled.button`
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.6);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: color var(--transition-base), background-color var(--transition-base);

  &:hover { color: var(--color-on-surface); background-color: var(--color-surface-bright); }
`

const ErrorBanner = styled.div`
  padding: var(--space-3) var(--space-4);
  background-color: rgba(147, 0, 10, 0.15);
  border: 1px solid rgba(255, 180, 171, 0.15);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: #ffb4ab;
`

// ─── Initial form state ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  title:                '',
  description:          '',
  reference_link:       '',
  price:                '',
  auto_total:           '',
  acquisition_type:     'unknown',
  is_autographed:       false,
  is_world_series_game: false,
  ws_game_number:       '',
  is_clinch_game:       false,
  clinch_number:        '',
  for_sale:             false,
  is_visible:           false,
  is_baseball:          false,
  is_part_of_set:       false,
  game_date:            '',
  purchase_date:        '',
  location:             '',
  notes:                '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemEditor() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [draftCerts, setDraftCerts] = useState([])
  const [draftSigs, setDraftSigs] = useState([])
  const [draftImages, setDraftImages] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      setSaveError('Title is required.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveStatus('Saving item...')

    try {
      const { data: newItem, error: itemErr } = await supabase
        .from('items')
        .insert({
          title:                form.title.trim(),
          description:          form.description || null,
          reference_link:       form.reference_link || null,
          price:                form.price === '' ? null : Number(form.price),
          auto_total:           form.auto_total === '' ? null : Number(form.auto_total),
          acquisition_type:     form.acquisition_type,
          is_autographed:       form.is_autographed,
          is_world_series_game: form.is_world_series_game,
          ws_game_number:       form.ws_game_number === '' ? null : Number(form.ws_game_number),
          is_clinch_game:       form.is_clinch_game,
          clinch_number:        form.clinch_number === '' ? null : Number(form.clinch_number),
          for_sale:             form.for_sale,
          is_visible:           form.is_visible,
          is_baseball:          form.is_baseball,
          is_part_of_set:       form.is_part_of_set,
          game_date:            form.game_date || null,
          purchase_date:        form.purchase_date || null,
          location:             form.location || null,
          notes:                form.notes || null,
        })
        .select('id')
        .single()

      if (itemErr) throw new Error(itemErr.message)

      const itemId = newItem.id
      const ops = []

      if (draftCerts.length) {
        ops.push(
          supabase.from('certifications').insert(
            draftCerts.map(({ _key, id, ...c }) => ({ ...c, item_id: itemId }))
          )
        )
      }

      if (draftSigs.length) {
        ops.push(
          supabase.from('signatories').insert(
            draftSigs.map(({ _key, id, ...s }) => ({ ...s, item_id: itemId }))
          )
        )
      }

      if (ops.length) {
        const results = await Promise.all(ops)
        const firstErr = results.find(r => r.error)
        if (firstErr) throw new Error(firstErr.error.message)
      }

      // ── Upload images to Cloudinary then insert into images table ────────────
      if (draftImages.length > 0) {
        const imageRows = []
        for (let i = 0; i < draftImages.length; i++) {
          const img = draftImages[i]
          setSaveStatus(`Uploading image ${i + 1} of ${draftImages.length}...`)
          const publicId = `import/${itemId.slice(0, 8)}/image_${i}`
          const result = await uploadToCloudinary(img.file, publicId)
          imageRows.push({
            item_id:              itemId,
            cloudinary_public_id: result.public_id,
            cloudinary_url:       result.secure_url,
            is_primary:           img.is_primary,
            display_order:        i,
          })
        }

        // Guarantee exactly one primary
        if (!imageRows.some(r => r.is_primary)) imageRows[0].is_primary = true

        const { error: imgErr } = await supabase.from('images').insert(imageRows)
        if (imgErr) throw new Error(imgErr.message)
      }

      navigate(-1)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
      setSaveStatus('')
    }
  }

  return (
    <>
      <PageHeading>
        <PageTitle>New Asset</PageTitle>
        <PageSub>Fill in the details below and save to add to the vault.</PageSub>
      </PageHeading>

      <FormBody>

        {/* ── Core ── */}
        <Section>
          <SectionLabel>Core Info</SectionLabel>
          <FieldGrid>
            <FullField>
              <FieldLabel>Title *</FieldLabel>
              <EditInputLarge
                type="text"
                value={form.title}
                placeholder="Item title"
                onChange={e => setField('title', e.target.value)}
              />
            </FullField>
            <FullField>
              <FieldLabel>Description</FieldLabel>
              <EditTextarea
                value={form.description}
                placeholder="Item description..."
                onChange={e => setField('description', e.target.value)}
              />
            </FullField>
            <FullField>
              <FieldLabel>Reference Link</FieldLabel>
              <EditInput
                type="url"
                value={form.reference_link}
                placeholder="https://..."
                onChange={e => setField('reference_link', e.target.value)}
              />
            </FullField>
          </FieldGrid>
        </Section>

        {/* ── Certifications ── */}
        <Section>
          <SectionLabel>Certifications</SectionLabel>
          <CertForm draftCerts={draftCerts} setDraftCerts={setDraftCerts} />
        </Section>

        {/* ── Signatories ── */}
        <Section>
          <SectionLabel>Signatories</SectionLabel>
          <SignatoryForm draftSigs={draftSigs} setDraftSigs={setDraftSigs} />
        </Section>

        {/* ── Financials ── */}
        <Section>
          <SectionLabel>Financials</SectionLabel>
          <FieldGrid>
            <Field>
              <FieldLabel>Price</FieldLabel>
              <EditInput
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                placeholder="0.00"
                onChange={e => setField('price', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Auto Total</FieldLabel>
              <EditInput
                type="number"
                min="0"
                step="0.01"
                value={form.auto_total}
                placeholder="0.00"
                onChange={e => setField('auto_total', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Acquisition Type</FieldLabel>
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
            </Field>
            <Field>
              <FieldLabel>Purchase Date</FieldLabel>
              <EditInput
                type="date"
                value={form.purchase_date}
                onChange={e => setField('purchase_date', e.target.value)}
              />
            </Field>
          </FieldGrid>
        </Section>

        {/* ── Game Context ── */}
        <Section>
          <SectionLabel>Game Context</SectionLabel>
          <FieldGrid>
            <Field>
              <FieldLabel>Game Date</FieldLabel>
              <EditInput
                type="date"
                value={form.game_date}
                onChange={e => setField('game_date', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Location</FieldLabel>
              <EditInput
                type="text"
                value={form.location}
                placeholder="e.g. Yankee Stadium"
                onChange={e => setField('location', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>World Series</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_world_series_game}
                  onChange={e => setField('is_world_series_game', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
            <Field>
              <FieldLabel>WS Game #</FieldLabel>
              <EditInput
                type="number"
                min="1"
                max="7"
                value={form.ws_game_number}
                placeholder="—"
                disabled={!form.is_world_series_game}
                onChange={e => setField('ws_game_number', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Clinch Game</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_clinch_game}
                  onChange={e => setField('is_clinch_game', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
            <Field>
              <FieldLabel>Clinch #</FieldLabel>
              <EditInput
                type="number"
                min="1"
                value={form.clinch_number}
                placeholder="—"
                disabled={!form.is_clinch_game}
                onChange={e => setField('clinch_number', e.target.value)}
              />
            </Field>
          </FieldGrid>
        </Section>

        {/* ── Flags ── */}
        <Section>
          <SectionLabel>Flags</SectionLabel>
          <FieldGrid>
            <Field>
              <FieldLabel>Autographed</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_autographed}
                  onChange={e => setField('is_autographed', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
            <Field>
              <FieldLabel>Baseball</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_baseball}
                  onChange={e => setField('is_baseball', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
            <Field>
              <FieldLabel>Part of Set</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_part_of_set}
                  onChange={e => setField('is_part_of_set', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
            <Field>
              <FieldLabel>For Sale</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.for_sale}
                  onChange={e => setField('for_sale', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
            <Field>
              <FieldLabel>Visible (public)</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={e => setField('is_visible', e.target.checked)}
                />
                Yes
              </CheckboxLabel>
            </Field>
          </FieldGrid>
        </Section>

        {/* ── Notes ── */}
        <Section>
          <SectionLabel>Notes</SectionLabel>
          <EditTextarea
            value={form.notes}
            placeholder="Internal notes..."
            onChange={e => setField('notes', e.target.value)}
          />
        </Section>

        {/* ── Images ── */}
        <Section>
          <SectionLabel>Images</SectionLabel>
          <ImageUploader draftImages={draftImages} setDraftImages={setDraftImages} />
        </Section>

        {saveError && <ErrorBanner>Error: {saveError}</ErrorBanner>}

        <Actions>
          <SaveBtn onClick={handleCreate} disabled={isSaving}>
            {isSaving ? (saveStatus || 'Saving...') : 'Create Asset'}
          </SaveBtn>
          <CancelBtn onClick={() => navigate(-1)}>Cancel</CancelBtn>
        </Actions>

      </FormBody>
    </>
  )
}
