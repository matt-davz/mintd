import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from '../../lib/cloudinary'
import {
  ITEM_TYPES, HAS_GAME_CONTEXT, DETAIL_TABLE,
  EMPTY_DETAIL, EMPTY_GAME_CONTEXT,
  isFormEmpty, serializeForm,
} from '../../lib/itemTypeConfig'
import {
  PageHeading, PageTitle, PageSub,
  FormBody, Section, SectionLabel,
  FieldGrid, Field, FullField,
  FieldLabel, EditInput, EditInputLarge, EditTextarea, EditSelect,
  CheckboxLabel,
  Actions, SaveBtn, CancelBtn, ErrorBanner,
} from '../../components/admin/FormFields'
import { CertForm } from '../../components/admin/CertForm'
import { SignatoryForm } from '../../components/admin/SignatoryForm'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { GameContextFields } from '../../components/admin/GameContextFields'
import { TYPE_FIELDS_MAP } from '../../components/admin/itemTypes'

// ─── Initial form state ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  title:            '',
  description:      '',
  reference_link:   '',
  price:            '',
  auto_total:       '',
  acquisition_type: 'unknown',
  is_autographed:   false,
  for_sale:         false,
  is_visible:       false,
  is_baseball:      false,
  is_part_of_set:   false,
  purchase_date:    '',
  item_type:        '',
  notes:            '',
}

function typeLabel(type) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemEditor() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [detailForm, setDetailForm] = useState(null)
  const [gcForm, setGcForm] = useState(null)
  const [draftCerts, setDraftCerts] = useState([])
  const [draftSigs, setDraftSigs] = useState([])
  const [draftImages, setDraftImages] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setDetailField(key, value) {
    setDetailForm(prev => ({ ...prev, [key]: value }))
  }

  function setGcField(key, value) {
    setGcForm(prev => ({ ...prev, [key]: value }))
  }

  function handleTypeChange(newType) {
    setField('item_type', newType)
    if (newType) {
      setDetailForm({ ...EMPTY_DETAIL[newType] })
      setGcForm(HAS_GAME_CONTEXT.has(newType) ? { ...EMPTY_GAME_CONTEXT } : null)
    } else {
      setDetailForm(null)
      setGcForm(null)
    }
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
      // ── Step 1: Insert item ─────────────────────────────────────────────────
      const { data: newItem, error: itemErr } = await supabase
        .from('items')
        .insert({
          title:            form.title.trim(),
          description:      form.description || null,
          reference_link:   form.reference_link || null,
          price:            form.price === '' ? null : Number(form.price),
          auto_total:       form.auto_total === '' ? null : Number(form.auto_total),
          acquisition_type: form.acquisition_type,
          is_autographed:   form.is_autographed,
          for_sale:         form.for_sale,
          is_visible:       form.is_visible,
          is_baseball:      form.is_baseball,
          is_part_of_set:   form.is_part_of_set,
          purchase_date:    form.purchase_date || null,
          item_type:        form.item_type || null,
          notes:            form.notes || null,
        })
        .select('id')
        .single()

      if (itemErr) throw new Error(itemErr.message)
      const itemId = newItem.id

      // ── Step 2: Insert game_context if applicable ───────────────────────────
      let gameContextId = null
      if (gcForm && !isFormEmpty(gcForm)) {
        const gcPayload = serializeForm(gcForm)
        // serializeForm handles '' → null and numeric conversion,
        // but game_context has its own numeric fields not in NUMERIC_FIELDS
        for (const k of ['season_year', 'series_game_number', 'home_score', 'away_score']) {
          if (gcPayload[k] !== null) gcPayload[k] = Number(gcPayload[k])
        }
        const { data: gc, error: gcErr } = await supabase
          .from('game_context')
          .insert(gcPayload)
          .select('id')
          .single()
        if (gcErr) throw new Error(gcErr.message)
        gameContextId = gc.id
      }

      // ── Step 3: Insert detail table row if type selected ────────────────────
      if (form.item_type && detailForm) {
        const tableName = DETAIL_TABLE[form.item_type]
        const detailPayload = serializeForm(detailForm)
        detailPayload.item_id = itemId
        if (gameContextId && HAS_GAME_CONTEXT.has(form.item_type)) {
          detailPayload.game_context_id = gameContextId
        }
        const { error: detailErr } = await supabase.from(tableName).insert(detailPayload)
        if (detailErr) throw new Error(detailErr.message)
      }

      // ── Step 4: Certs + sigs (parallel) ─────────────────────────────────────
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

      // ── Step 5: Upload images ───────────────────────────────────────────────
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

  const TypeFields = form.item_type ? TYPE_FIELDS_MAP[form.item_type] : null

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
            <Field>
              <FieldLabel>Item Type</FieldLabel>
              <EditSelect value={form.item_type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="">— Select type —</option>
                {ITEM_TYPES.map(t => (
                  <option key={t} value={t}>{typeLabel(t)}</option>
                ))}
              </EditSelect>
            </Field>
            <Field>
              <FieldLabel>Baseball Item</FieldLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.is_baseball}
                  onChange={e => setField('is_baseball', e.target.checked)}
                />
                Yes (show on public gallery)
              </CheckboxLabel>
            </Field>
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

        {/* ── Type Details (conditional) ── */}
        {TypeFields && detailForm && (
          <Section>
            <SectionLabel>Type Details — {typeLabel(form.item_type)}</SectionLabel>
            <TypeFields form={detailForm} setField={setDetailField} />
          </Section>
        )}

        {/* ── Game Context (conditional) ── */}
        {gcForm && (
          <Section>
            <SectionLabel>Game Context</SectionLabel>
            <GameContextFields form={gcForm} setField={setGcField} />
          </Section>
        )}

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
