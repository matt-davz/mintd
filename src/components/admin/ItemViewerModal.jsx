import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import { useItem } from '../../hooks/useItem'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from '../../lib/cloudinary'
import {
  ITEM_TYPES, HAS_GAME_CONTEXT, DETAIL_TABLE,
  EMPTY_DETAIL, EMPTY_GAME_CONTEXT,
  isFormEmpty, serializeForm,
} from '../../lib/itemTypeConfig'
import { CertForm } from './CertForm'
import { SignatoryForm } from './SignatoryForm'
import { ImageUploader } from './ImageUploader'
import { LoaUploader } from './LoaUploader'
import { GameContextFields } from './GameContextFields'
import { BoxScoreDisplay } from '../BoxScoreDisplay'
import { TYPE_FIELDS_MAP } from './itemTypes'
import { ImageLightbox } from '../ImageLightbox'
import { SetMembersAccordion } from '../SetMembersAccordion'
import { DuplicatesSection } from './DuplicatesSection'

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
  const existing = draft.filter(c => c.id).map(c => ({ ...stripKey(c), item_id: itemId }))
  const fresh = draft.filter(c => !c.id).map(c => {
    const row = { ...stripKey(c), item_id: itemId }
    delete row.id
    return row
  })
  if (existing.length) {
    ops.push(supabase.from('certifications').upsert(existing, { onConflict: 'id' }))
  }
  if (fresh.length) {
    ops.push(supabase.from('certifications').insert(fresh))
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
  const existing = draft.filter(s => s.id).map(s => ({ ...stripKey(s), item_id: itemId }))
  const fresh = draft.filter(s => !s.id).map(s => {
    const row = { ...stripKey(s), item_id: itemId }
    delete row.id
    return row
  })
  if (existing.length) {
    ops.push(supabase.from('signatories').upsert(existing, { onConflict: 'id' }))
  }
  if (fresh.length) {
    ops.push(supabase.from('signatories').insert(fresh))
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

const DeleteBtn = styled(IconBtn)`
  color: #ffb4ab;
  &:hover { background-color: rgba(147, 0, 10, 0.25); color: #ffb4ab; }
`

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
`

const ConfirmBox = styled.div`
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  max-width: 24rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`

const ConfirmTitle = styled.h3`
  font-family: var(--font-headline);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
`

const ConfirmText = styled.p`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-on-surface-variant);
  margin: 0;
`

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
`

const ConfirmDeleteBtn = styled.button`
  padding: 0 var(--space-5);
  height: 2.25rem;
  border-radius: var(--radius-md);
  background-color: rgba(147, 0, 10, 0.6);
  color: #ffb4ab;
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: background-color var(--transition-base);

  &:hover { background-color: rgba(147, 0, 10, 0.85); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const ConfirmCancelBtn = styled(CancelBtn)``

const PanelBody = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
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

// ─── Inline population display ───────────────────────────────────────────────

const PopInline = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`

const PopInlineCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.2rem var(--space-2);
  border-radius: var(--radius-sm);
  background-color: ${({ $type }) =>
    $type === 'higher' ? 'rgba(147, 0, 10, 0.15)' :
    $type === 'same'   ? 'rgba(77, 142, 255, 0.15)' :
    'var(--color-surface-high)'};

  span {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-outline);
  }

  strong {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    color: ${({ $type }) =>
      $type === 'higher' ? 'var(--color-error)' :
      $type === 'same'   ? 'var(--color-primary)' :
      'var(--color-on-surface)'};
  }
`

const PopSyncBtn = styled(IconBtn)`
  width: 1.5rem;
  height: 1.5rem;

  .material-symbols-outlined {
    font-size: 0.875rem;
    ${({ $syncing }) => $syncing ? 'animation: pop-spin 1s linear infinite;' : ''}
  }

  @keyframes pop-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const PopSyncStatus = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.05em;
  color: ${({ $type }) =>
    $type === 'error' ? 'var(--color-error)' :
    $type === 'warn'  ? 'var(--color-secondary-fixed)' :
    'var(--color-primary)'};
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

const ThumbExpandBtn = styled.button`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(173, 198, 255, 0.2);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-base), background var(--transition-base);

  ${ImageThumb}:hover & { opacity: 1; }

  &:hover {
    background: rgba(77, 142, 255, 0.18);
    border-color: rgba(173, 198, 255, 0.45);
  }

  .material-symbols-outlined {
    font-size: 0.75rem;
    font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
  }
`

// ─── LOA view mode ────────────────────────────────────────────────────────────

const LoaViewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const LoaViewRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.12);
`

const LoaViewActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
`

const LoaActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  color: var(--color-outline);
  text-decoration: none;
  transition: color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }
  &:hover { color: var(--color-primary); }
`

const LoaViewIcon = styled.div`
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-outline);

  img { width: 100%; height: 100%; object-fit: cover; }
  .material-symbols-outlined { font-size: 1.25rem; }
`

const LoaViewInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const LoaViewLabel = styled.span`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-on-surface);
`

const LoaRenameInput = styled.input`
  background: var(--color-surface);
  border: 1px solid rgba(173, 198, 255, 0.4);
  border-radius: var(--radius-sm);
  padding: 0.125rem var(--space-2);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-on-surface);
  width: 100%;

  &:focus { outline: none; }
`

const LoaViewType = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-outline);
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

const EMPTY_FORM = {
  title: '', description: '', reference_link: '',
  price: '', auto_total: '', acquisition_type: 'unknown',
  item_type: '', is_autographed: false, for_sale: false,
  is_visible: false, is_baseball: false, is_part_of_set: false,
  is_duplicate: false, is_legendary: false, purchase_date: '', season_year: '', notes: '',
}

export function ItemViewerModal({ itemId, onClose, onOpenItem }) {
  const isCreateMode = !itemId
  const { item, signatories, certifications, population, images, loas, detail, gameContext, legendaryContext, legendaryImages, loading, error, refetch } = useItem(isCreateMode ? null : itemId)

  const [isEditing, setIsEditing] = useState(isCreateMode)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null) // { type: 'error'|'warn'|'ok', msg }
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [form, setForm] = useState(isCreateMode ? { ...EMPTY_FORM } : null)
  const [detailForm, setDetailForm] = useState(null)
  const [gcForm, setGcForm] = useState(null)
  const [draftCerts, setDraftCerts] = useState([])
  const [draftSigs, setDraftSigs] = useState([])
  const [draftImages, setDraftImages] = useState([])
  const [draftLOAs, setDraftLOAs] = useState([])
  const [editingLoaId, setEditingLoaId] = useState(null)
  const [loaLabelDraft, setLoaLabelDraft] = useState('')
  const [legendaryContextForm, setLegendaryContextForm] = useState({ event_title: '', event_description: '' })
  const [draftLegendaryImages, setDraftLegendaryImages] = useState([])
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [galleryPosition, setGalleryPosition] = useState(null)
  const originalRef = useRef(null)

  useEffect(() => {
    if (!itemId) return
    supabase
      .from('item_order')
      .select('display_order')
      .eq('item_id', itemId)
      .maybeSingle()
      .then(({ data }) => setGalleryPosition(data?.display_order ?? null))
  }, [itemId])

  function enterEditMode() {
    const f = {
      title:               item.title ?? '',
      description:         item.description ?? '',
      reference_link:      item.reference_link ?? '',
      price:               item.price ?? '',
      auto_total:          item.auto_total ?? '',
      acquisition_type:    item.acquisition_type ?? 'unknown',
      item_type:           item.item_type ?? '',
      is_autographed:      item.is_autographed ?? false,
      for_sale:            item.for_sale ?? false,
      is_visible:          item.is_visible ?? false,
      is_baseball:         item.is_baseball ?? false,
      is_part_of_set:      item.is_part_of_set ?? false,
      is_duplicate:        item.is_duplicate ?? false,
      is_legendary:        item.is_legendary ?? false,
      purchase_date:       item.purchase_date ?? '',
      season_year:         item.season_year ?? '',
      notes:               item.notes ?? '',
    }
    const dc = certifications.map(c => ({ ...c, _key: c.id }))
    const ds = signatories.map(s => ({ ...s, _key: s.id }))
    const di = images.map(i => ({ ...i, _key: i.id }))
    const initLc = { event_title: legendaryContext?.event_title ?? '', event_description: legendaryContext?.event_description ?? '' }
    const dli = (legendaryImages ?? []).map(i => ({ ...i, _key: i.id }))
    const dl = (loas ?? []).map(l => ({ ...l, _key: l.id }))
    setForm(f)
    setDraftCerts(dc)
    setDraftSigs(ds)
    setDraftImages(di)
    setDraftLOAs(dl)
    setLegendaryContextForm(initLc)
    setDraftLegendaryImages(dli)

    // Populate type detail form from existing data
    let initDetail = null
    let initGc = null
    if (item.item_type && EMPTY_DETAIL[item.item_type]) {
      const template = EMPTY_DETAIL[item.item_type]
      initDetail = { ...template }
      if (detail) {
        for (const key of Object.keys(template)) {
          if (detail[key] != null) initDetail[key] = detail[key]
        }
      }
      setDetailForm(initDetail)

      if (HAS_GAME_CONTEXT.has(item.item_type)) {
        initGc = { ...EMPTY_GAME_CONTEXT }
        if (gameContext) {
          for (const key of Object.keys(initGc)) {
            if (gameContext[key] != null) initGc[key] = gameContext[key]
          }
        }
        setGcForm(initGc)
      } else {
        setGcForm(null)
      }
    } else {
      setDetailForm(null)
      setGcForm(null)
    }

    originalRef.current = {
      f: JSON.parse(JSON.stringify(f)),
      dc: JSON.parse(JSON.stringify(dc)),
      ds: JSON.parse(JSON.stringify(ds)),
      di: JSON.parse(JSON.stringify(di)),
      df: initDetail ? JSON.parse(JSON.stringify(initDetail)) : null,
      gc: initGc ? JSON.parse(JSON.stringify(initGc)) : null,
      lc: JSON.parse(JSON.stringify(initLc)),
      dli: JSON.parse(JSON.stringify(dli)),
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

  function handleCancel() {
    if (isCreateMode) {
      const hasContent = form.title.trim() || draftCerts.length || draftSigs.length || draftImages.length
      if (hasContent && !window.confirm('Discard new asset?')) return
      onClose()
      return
    }
    const orig = originalRef.current
    const dirty = JSON.stringify(form) !== JSON.stringify(orig?.f)
      || JSON.stringify(draftCerts) !== JSON.stringify(orig?.dc)
      || JSON.stringify(draftSigs) !== JSON.stringify(orig?.ds)
      || JSON.stringify(draftImages) !== JSON.stringify(orig?.di)
      || JSON.stringify(legendaryContextForm) !== JSON.stringify(orig?.lc)
      || JSON.stringify(draftLegendaryImages) !== JSON.stringify(orig?.dli)
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setIsEditing(false)
    setForm(null)
    setDetailForm(null)
    setGcForm(null)
    setLegendaryContextForm({ event_title: '', event_description: '' })
    setDraftLegendaryImages([])
    setSaveError(null)
  }

  async function syncItemTeams(itemId, homeTeam, awayTeam) {
    const abbrevs = [homeTeam, awayTeam].filter(Boolean)
    await supabase.from('item_teams').delete().eq('item_id', itemId)
    if (!abbrevs.length) return
    const { data: matched } = await supabase
      .from('teams').select('id').in('abbreviation', abbrevs)
    if (matched?.length) {
      await supabase.from('item_teams').insert(
        matched.map(t => ({ item_id: itemId, team_id: t.id }))
      )
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setSaveError('Title is required.')
      return
    }

    // Skip save if nothing changed (edit mode only)
    if (!isCreateMode) {
      const orig = originalRef.current
      const isDirty = JSON.stringify(form) !== JSON.stringify(orig?.f)
        || JSON.stringify(draftCerts) !== JSON.stringify(orig?.dc)
        || JSON.stringify(draftSigs) !== JSON.stringify(orig?.ds)
        || JSON.stringify(draftImages) !== JSON.stringify(orig?.di)
        || JSON.stringify(detailForm) !== JSON.stringify(orig?.df)
        || JSON.stringify(gcForm) !== JSON.stringify(orig?.gc)
        || JSON.stringify(legendaryContextForm) !== JSON.stringify(orig?.lc)
        || JSON.stringify(draftLegendaryImages) !== JSON.stringify(orig?.dli)
      if (!isDirty) {
        setIsEditing(false)
        setForm(null)
        return
      }
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const itemPayload = {
        title:            form.title.trim(),
        description:      form.description || null,
        reference_link:   form.reference_link || null,
        price:            form.price === '' ? null : Number(form.price),
        auto_total:       form.auto_total === '' ? null : Number(form.auto_total),
        acquisition_type: form.acquisition_type,
        item_type:        form.item_type || null,
        is_autographed:   form.is_autographed,
        for_sale:         form.for_sale,
        is_visible:       form.is_visible,
        is_baseball:      form.is_baseball,
        is_part_of_set:   form.is_part_of_set,
        is_duplicate:     form.is_duplicate,
        is_legendary:     form.is_legendary,
        purchase_date:    form.purchase_date || null,
        season_year:      (() => {
          const fromGc = HAS_GAME_CONTEXT.has(form.item_type) && gcForm?.season_year
          const val = fromGc ? gcForm.season_year : form.season_year
          return val === '' || val == null ? null : Number(val)
        })(),
        notes:            form.notes || null,
      }

      let savedItemId
      if (isCreateMode) {
        // ── CREATE: insert new item ───────────────────────────────────────────
        const { data: newItem, error: itemErr } = await supabase
          .from('items').insert(itemPayload).select('id').single()
        if (itemErr) throw new Error(itemErr.message)
        savedItemId = newItem.id

        // Insert game_context if applicable
        let gameContextId = null
        if (gcForm && !isFormEmpty(gcForm)) {
          const gcPayload = serializeForm(gcForm)
          for (const k of ['season_year', 'series_game_number', 'home_score', 'away_score']) {
            if (gcPayload[k] !== null) gcPayload[k] = Number(gcPayload[k])
          }
          const { data: gc, error: gcErr } = await supabase
            .from('game_context').insert(gcPayload).select('id').single()
          if (gcErr) throw new Error(gcErr.message)
          gameContextId = gc.id
          await syncItemTeams(savedItemId, gcForm.home_team, gcForm.away_team)
        }

        // Insert type detail row
        if (form.item_type && detailForm) {
          const tableName = DETAIL_TABLE[form.item_type]
          const detailPayload = serializeForm(detailForm)
          detailPayload.item_id = savedItemId
          if (gameContextId && HAS_GAME_CONTEXT.has(form.item_type)) {
            detailPayload.game_context_id = gameContextId
          }
          const { error: detailErr } = await supabase.from(tableName).insert(detailPayload)
          if (detailErr) throw new Error(detailErr.message)
        }

        // Insert certs + sigs
        const ops = []
        if (draftCerts.length) {
          ops.push(supabase.from('certifications').insert(
            draftCerts.map(({ _key, id, ...c }) => ({ ...c, item_id: savedItemId }))
          ))
        }
        if (draftSigs.length) {
          ops.push(supabase.from('signatories').insert(
            draftSigs.map(({ _key, id, ...s }) => ({ ...s, item_id: savedItemId }))
          ))
        }
        if (ops.length) {
          const results = await Promise.all(ops)
          const firstErr = results.find(r => r.error)
          if (firstErr) throw new Error(firstErr.error.message)
        }
      } else {
        // ── UPDATE: update existing item ──────────────────────────────────────
        savedItemId = itemId
        const { error: itemErr } = await supabase
          .from('items').update(itemPayload).eq('id', itemId)
        if (itemErr) throw new Error(itemErr.message)

        // Upsert game_context if applicable
        let resolvedGcId = gameContext?.id ?? null
        if (form.item_type && HAS_GAME_CONTEXT.has(form.item_type) && gcForm && !isFormEmpty(gcForm)) {
          const gcPayload = serializeForm(gcForm)
          for (const k of ['season_year', 'series_game_number', 'home_score', 'away_score']) {
            if (gcPayload[k] !== null) gcPayload[k] = Number(gcPayload[k])
          }
          if (resolvedGcId) {
            const { error: gcErr } = await supabase
              .from('game_context').update(gcPayload).eq('id', resolvedGcId)
            if (gcErr) throw new Error(gcErr.message)
          } else {
            const { data: gc, error: gcErr } = await supabase
              .from('game_context').insert(gcPayload).select('id').single()
            if (gcErr) throw new Error(gcErr.message)
            resolvedGcId = gc.id
          }
          await syncItemTeams(savedItemId, gcForm.home_team, gcForm.away_team)
        }

        // Upsert type detail row
        if (form.item_type && detailForm) {
          const tableName = DETAIL_TABLE[form.item_type]
          const detailPayload = serializeForm(detailForm)
          detailPayload.item_id = itemId
          if (HAS_GAME_CONTEXT.has(form.item_type) && resolvedGcId) {
            detailPayload.game_context_id = resolvedGcId
          }
          if (detail?.id) {
            const { error: detailErr } = await supabase
              .from(tableName).update(detailPayload).eq('id', detail.id)
            if (detailErr) throw new Error(detailErr.message)
          } else {
            const { error: detailErr } = await supabase
              .from(tableName).insert(detailPayload)
            if (detailErr) throw new Error(detailErr.message)
          }
        }

        // Reconcile certs, sigs, existing images
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
      }

      // ── Upload new images (both modes) ──────────────────────────────────────
      const newImages = draftImages.filter(i => !i.id && i.file)
      if (newImages.length > 0) {
        const maxExistingOrder = (images ?? []).reduce((max, i) => Math.max(max, i.display_order ?? 0), -1)
        const imageRows = []
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i]
          const displayOrder = maxExistingOrder + 1 + i
          const publicId = `import/${savedItemId.slice(0, 8)}/image_${displayOrder}`
          const result = await uploadToCloudinary(img.file, publicId)
          imageRows.push({
            item_id:              savedItemId,
            cloudinary_public_id: result.public_id,
            cloudinary_url:       result.secure_url,
            is_primary:           img.is_primary,
            display_order:        displayOrder,
          })
        }
        const existingPrimary = draftImages.some(i => i.id && i.is_primary)
        if (!existingPrimary && imageRows.length && !imageRows.some(r => r.is_primary)) {
          imageRows[0].is_primary = true
        }
        const { error: imgErr } = await supabase.from('images').insert(imageRows)
        if (imgErr) throw new Error(imgErr.message)
      }

      // ── Save LOAs (Supabase Storage — not Cloudinary) ──────────────────────
      // Delete removed LOAs: remove from storage then DB
      const origLoaIds = new Set((loas ?? []).map(l => l.id))
      const keptLoaIds = new Set(draftLOAs.filter(l => l.id).map(l => l.id))
      const loasToDelete = [...origLoaIds].filter(id => !keptLoaIds.has(id))
      if (loasToDelete.length) {
        const storagePaths = (loas ?? [])
          .filter(l => loasToDelete.includes(l.id))
          .map(l => l.cloudinary_public_id) // stored as storage path
          .filter(Boolean)
        if (storagePaths.length) {
          await supabase.storage.from('loas').remove(storagePaths)
        }
        const { error: delLoaErr } = await supabase.from('item_loas').delete().in('id', loasToDelete)
        if (delLoaErr) throw new Error(delLoaErr.message)
      }
      // Update label for existing LOAs where it changed
      for (const loa of draftLOAs.filter(l => l.id)) {
        const orig = (loas ?? []).find(l => l.id === loa.id)
        if (orig && orig.label !== loa.label) {
          const { error: updLoaErr } = await supabase.from('item_loas').update({ label: loa.label ?? null }).eq('id', loa.id)
          if (updLoaErr) throw new Error(updLoaErr.message)
        }
      }
      // Upload new LOAs to Supabase Storage
      const newLOAs = draftLOAs.filter(l => !l.id && l.file)
      if (newLOAs.length) {
        const maxLoaOrder = (loas ?? []).reduce((max, l) => Math.max(max, l.display_order ?? 0), -1)
        const loaRows = []
        for (let idx = 0; idx < newLOAs.length; idx++) {
          const loa = newLOAs[idx]
          const displayOrder = maxLoaOrder + 1 + idx
          const safeName = loa.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const storagePath = `${savedItemId.slice(0, 8)}/${Date.now()}_${safeName}`
          const { error: uploadErr } = await supabase.storage
            .from('loas')
            .upload(storagePath, loa.file, { contentType: loa.file.type, upsert: false })
          if (uploadErr) throw new Error(uploadErr.message)
          const { data: { publicUrl } } = supabase.storage.from('loas').getPublicUrl(storagePath)
          loaRows.push({
            item_id:              savedItemId,
            cloudinary_public_id: storagePath,  // storage path (column repurposed)
            cloudinary_url:       publicUrl,      // supabase public URL
            label:                loa.label || null,
            resource_type:        loa.resource_type,
            display_order:        displayOrder,
          })
        }
        const { error: loaErr } = await supabase.from('item_loas').insert(loaRows)
        if (loaErr) throw new Error(loaErr.message)
      }

      // ── Save legendary context + images ────────────────────────────────────
      if (form.is_legendary) {
        const { data: lcRow, error: lcErr } = await supabase
          .from('legendary_context')
          .upsert(
            {
              item_id:           savedItemId,
              event_title:       legendaryContextForm.event_title || null,
              event_description: legendaryContextForm.event_description || null,
            },
            { onConflict: 'item_id' }
          )
          .select()
          .single()
        if (lcErr) throw new Error(lcErr.message)

        // Delete removed legendary images
        const origLiIds = new Set((legendaryImages ?? []).map(i => i.id))
        const keptIds = new Set(draftLegendaryImages.filter(i => i.id).map(i => i.id))
        const toDelete = [...origLiIds].filter(id => !keptIds.has(id))
        if (toDelete.length) {
          const { error: delErr } = await supabase.from('legendary_images').delete().in('id', toDelete)
          if (delErr) throw new Error(delErr.message)
        }

        // Upload and insert new legendary images
        const newLi = draftLegendaryImages.filter(i => !i.id && i.file)
        if (newLi.length) {
          const maxOrder = (legendaryImages ?? []).reduce((max, i) => Math.max(max, i.display_order ?? 0), -1)
          const liRows = []
          for (let idx = 0; idx < newLi.length; idx++) {
            const img = newLi[idx]
            const displayOrder = maxOrder + 1 + idx
            const publicId = `legendary/${savedItemId.slice(0, 8)}/image_${displayOrder}`
            const result = await uploadToCloudinary(img.file, publicId)
            liRows.push({
              legendary_context_id: lcRow.id,
              cloudinary_public_id:  result.public_id,
              cloudinary_url:        result.secure_url,
              display_order:         displayOrder,
            })
          }
          const { error: liErr } = await supabase.from('legendary_images').insert(liRows)
          if (liErr) throw new Error(liErr.message)
        }
      }

      if (isCreateMode) {
        onClose()
      } else {
        refetch()
        setIsEditing(false)
        setForm(null)
        setDetailForm(null)
        setGcForm(null)
        setLegendaryContextForm({ event_title: '', event_description: '' })
        setDraftLegendaryImages([])
        setDraftLOAs([])
      }
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId)
      if (error) throw error
      onClose()
    } catch (err) {
      setSaveError(`Delete failed: ${err.message}`)
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleOverlayClick() {
    if (isEditing) {
      if (isCreateMode) {
        handleCancel()
      } else if (window.confirm('Discard unsaved changes?')) {
        setIsEditing(false)
        setForm(null)
        setDetailForm(null)
        setGcForm(null)
        setSaveError(null)
        onClose()
      }
    } else {
      onClose()
    }
  }

  const primaryImage = (images ?? []).find(i => i.is_primary) ?? (images ?? [])[0]
  const TypeFields = form?.item_type ? TYPE_FIELDS_MAP[form.item_type] : null

  const psaCerts = (certifications ?? []).filter(c => ['PSA', 'PSA/DNA'].includes(c.cert_service))
  const pop = psaCerts.length > 0 ? (population ?? []).find(p => p.cert_id === psaCerts[0].id) : null

  const handlePopSync = async () => {
    const syncIds = psaCerts.filter(c => c.cert_id).map(c => c.id)
    if (!syncIds.length) return
    setSyncing(true)
    setSyncStatus(null)
    try {
      const { data, error } = await supabase.functions.invoke('psa-sync', {
        body: { cert_ids: syncIds },
      })
      if (error) {
        setSyncStatus({ type: 'error', msg: error.message || 'Sync failed' })
      } else if (data?.rate_limited) {
        setSyncStatus({ type: 'warn', msg: 'PSA daily rate limit reached — try again tomorrow' })
      } else if (data?.errors?.length) {
        setSyncStatus({ type: 'error', msg: data.errors[0].error })
      } else if (data?.synced > 0) {
        setSyncStatus({ type: 'ok', msg: 'Synced' })
      }
      await refetch()
    } catch (e) {
      setSyncStatus({ type: 'error', msg: 'Sync request failed' })
    } finally {
      setSyncing(false)
    }
  }

  function startLoaRename(loa) {
    setEditingLoaId(loa.id)
    setLoaLabelDraft(loa.label ?? '')
  }

  async function commitLoaRename(loa) {
    const newLabel = loaLabelDraft.trim() || null
    const { error: err } = await supabase.from('item_loas').update({ label: newLabel }).eq('id', loa.id)
    if (err) { setSaveError(err.message); return }
    setEditingLoaId(null)
    refetch()
  }

  function cancelLoaRename() {
    setEditingLoaId(null)
    setLoaLabelDraft('')
  }

  return (
    <Overlay onClick={handleOverlayClick}>
      <Panel onClick={e => e.stopPropagation()}>

        <PanelHeader>
          <PanelTitle $editing={isEditing}>
            {isCreateMode ? 'New Asset' : isEditing ? 'Editing Item' : 'Item Record'}
          </PanelTitle>
          <HeaderActions>
            {isEditing ? (
              <>
                <SaveBtn onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : isCreateMode ? 'Create' : 'Save'}
                </SaveBtn>
                <CancelBtn onClick={handleCancel}>Cancel</CancelBtn>
              </>
            ) : (
              <>
                <EditBtn onClick={enterEditMode} title="Edit item">
                  <span className="material-symbols-outlined">edit</span>
                </EditBtn>
                <DeleteBtn onClick={() => setConfirmDelete(true)} title="Delete item">
                  <span className="material-symbols-outlined">delete</span>
                </DeleteBtn>
              </>
            )}
            <IconBtn onClick={isEditing ? handleOverlayClick : onClose} title="Close">
              <span className="material-symbols-outlined">close</span>
            </IconBtn>
          </HeaderActions>
        </PanelHeader>

        {isEditing && <EditBanner>Changes are not saved until you click Save</EditBanner>}
        {isEditing && saveError && <SaveErrorBanner>Error: {saveError}</SaveErrorBanner>}

        <PanelBody>
          {!isCreateMode && loading && <StatusMsg>Loading...</StatusMsg>}
          {!isCreateMode && error && <StatusMsg>Error: {error}</StatusMsg>}

          {(isCreateMode || (!loading && !error && item)) && (
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

                  {!isCreateMode && (
                    <BadgeRow>
                      {certifications[0] && (
                        <GradeBadge>
                          {certifications[0].cert_service} {certifications[0].item_grade ?? certifications[0].auto_grade ?? ''}
                        </GradeBadge>
                      )}
                      {item.for_sale && <ForSaleTag>For Sale</ForSaleTag>}
                      {item.is_autographed && <Tag>Signed</Tag>}
                    </BadgeRow>
                  )}

                  {!isCreateMode && psaCerts.length > 0 && (
                    <PopInline>
                      {pop ? (
                        <>
                          <PopInlineCell $type="total">
                            <span>Pop</span> <strong>{pop.total}</strong>
                          </PopInlineCell>
                          <PopInlineCell $type="higher">
                            <span>Higher</span> <strong>{pop.higher}</strong>
                          </PopInlineCell>
                          <PopInlineCell $type="same">
                            <span>Same</span> <strong>{pop.same}</strong>
                          </PopInlineCell>
                          <PopInlineCell $type="lower">
                            <span>Lower</span> <strong>{pop.lower}</strong>
                          </PopInlineCell>
                        </>
                      ) : (
                        <PopInlineCell $type="lower">
                          <span>No pop data</span>
                        </PopInlineCell>
                      )}
                      <PopSyncBtn onClick={handlePopSync} disabled={syncing} $syncing={syncing} title="Sync PSA population">
                        <span className="material-symbols-outlined">sync</span>
                      </PopSyncBtn>
                      {syncStatus && <PopSyncStatus $type={syncStatus.type}>{syncStatus.msg}</PopSyncStatus>}
                    </PopInline>
                  )}

                  {!isEditing && item?.price && (
                    <FieldValue $accent="blue" style={{ fontSize: '1.25rem' }}>
                      ${Number(item.price).toLocaleString()}
                    </FieldValue>
                  )}

                  {isEditing && (
                    <div style={{ marginBottom: 'var(--space-2)' }}>
                      <FieldLabel>Item Type</FieldLabel>
                      <EditSelect value={form.item_type} onChange={e => handleTypeChange(e.target.value)}>
                        <option value="">— Select type —</option>
                        {ITEM_TYPES.map(t => (
                          <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </EditSelect>
                    </div>
                  )}
                  {!isEditing && item.item_type && (
                    <Tag>{item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}</Tag>
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

              {/* ── Type Details ── */}
              {isEditing && TypeFields && detailForm && (
                <Section>
                  <SectionLabel>Type Details — {form.item_type.charAt(0).toUpperCase() + form.item_type.slice(1)}</SectionLabel>
                  <TypeFields form={detailForm} setField={setDetailField} />
                </Section>
              )}
              {!isEditing && detail && item.item_type && (
                <Section>
                  <SectionLabel>Type Details — {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}</SectionLabel>
                  <FieldGrid>
                    {Object.entries(EMPTY_DETAIL[item.item_type] ?? {}).map(([key, defaultVal]) => {
                      const val = detail[key]
                      if (val == null && typeof defaultVal !== 'boolean') return null
                      const label = key.replace(/^is_|^has_/, '').replace(/_/g, ' ')
                      if (typeof defaultVal === 'boolean') {
                        return (
                          <Field key={key}>
                            <FieldLabel>{label}</FieldLabel>
                            <Bool value={!!val} />
                          </Field>
                        )
                      }
                      if (val == null || val === '') return null
                      const display = typeof val === 'string' && val.includes('_')
                        ? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                        : String(val)
                      return (
                        <Field key={key}>
                          <FieldLabel>{label}</FieldLabel>
                          <Val value={display} />
                        </Field>
                      )
                    })}
                    {item.item_type === 'ticket' && (
                      <Field>
                        <FieldLabel>Duplicate</FieldLabel>
                        <Bool value={!!item.is_duplicate} />
                      </Field>
                    )}
                  </FieldGrid>
                </Section>
              )}

              {/* ── Game Context ── */}
              {isEditing && gcForm && (
                <Section>
                  <SectionLabel>Game Context</SectionLabel>
                  <GameContextFields form={gcForm} setField={setGcField} />
                </Section>
              )}
              {!isEditing && gameContext && (
                <Section>
                  <SectionLabel>Game Context</SectionLabel>
                  <FieldGrid>
                    {Object.keys(EMPTY_GAME_CONTEXT).map(key => {
                      if (key === 'box_score') return null
                      const val = gameContext[key]
                      if (val == null || val === '') return null
                      const label = key.replace(/_/g, ' ')
                      const display = key.includes('date')
                        ? formatDate(val)
                        : typeof val === 'string' && val.includes('_')
                          ? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                          : String(val)
                      return (
                        <Field key={key}>
                          <FieldLabel>{label}</FieldLabel>
                          <Val value={display} />
                        </Field>
                      )
                    })}
                  </FieldGrid>
                  {gameContext.box_score && gameContext.box_score.innings?.length > 0 && (
                    <>
                      <FieldLabel style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-2)' }}>Box Score</FieldLabel>
                      <BoxScoreDisplay
                        boxScore={gameContext.box_score}
                        homeTeam={gameContext.home_team}
                        awayTeam={gameContext.away_team}
                      />
                    </>
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

              {/* ── Dates & Flags ── */}
              <Section>
                <SectionLabel>Dates & Flags</SectionLabel>
                <FieldGrid>
                  <Field>
                    <FieldLabel>Season Year</FieldLabel>
                    {isEditing ? (
                      <EditInput
                        type="number"
                        value={form.season_year}
                        placeholder="e.g. 1956"
                        onChange={e => setField('season_year', e.target.value)}
                      />
                    ) : (
                      <Val value={item.season_year ?? null} />
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
                    <FieldLabel>Legendary</FieldLabel>
                    {isEditing ? (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={form.is_legendary}
                          onChange={e => setField('is_legendary', e.target.checked)}
                        />
                        Yes
                      </CheckboxLabel>
                    ) : (
                      <Bool value={item.is_legendary} />
                    )}
                  </Field>
                  {!isCreateMode && (
                    <Field>
                      <FieldLabel>Added</FieldLabel>
                      <Val value={formatDate(item.created_at)} />
                    </Field>
                  )}
                  {!isCreateMode && (
                    <Field>
                      <FieldLabel>Updated</FieldLabel>
                      <Val value={formatDate(item.updated_at)} />
                    </Field>
                  )}
                  {!isCreateMode && (
                    <Field>
                      <FieldLabel>Gallery Position</FieldLabel>
                      <Val value={galleryPosition != null ? `#${galleryPosition}` : 'Not pinned'} />
                    </Field>
                  )}
                  {(isEditing || item?.reference_link) && (
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
                  ) : item?.notes ? (
                    <FieldValue style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {item.notes}
                    </FieldValue>
                  ) : (
                    <Muted>—</Muted>
                  )}
                </Field>
              </Section>

              {/* ── Set members ── */}
              {!isEditing && item?.set_id && (
                <Section>
                  <SectionLabel>Set Members</SectionLabel>
                  <SetMembersAccordion
                    setId={item.set_id}
                    currentItemId={itemId}
                    onItemClick={onOpenItem}
                  />
                </Section>
              )}

              {/* ── Duplicates ── */}
              {!isCreateMode && (isEditing || item?.is_duplicate) && (
                <Section>
                  <DuplicatesSection
                    itemId={itemId}
                    isEditing={isEditing}
                    isDuplicate={isEditing ? form?.is_duplicate : item?.is_duplicate}
                    onDuplicateChange={checked => setField('is_duplicate', checked)}
                    onItemClick={onOpenItem}
                  />
                </Section>
              )}

              {/* ── Legendary context ── */}
              {(form?.is_legendary || item?.is_legendary) && (
                <Section>
                  <SectionLabel>Legendary Context</SectionLabel>
                  {isEditing || isCreateMode ? (
                    <>
                      <FieldGrid>
                        <Field style={{ gridColumn: '1 / -1' }}>
                          <FieldLabel>Event Title</FieldLabel>
                          <EditInput
                            value={legendaryContextForm.event_title}
                            onChange={e => setLegendaryContextForm(f => ({ ...f, event_title: e.target.value }))}
                            placeholder="e.g. 1956 World Series Perfect Game"
                          />
                        </Field>
                        <Field style={{ gridColumn: '1 / -1' }}>
                          <FieldLabel>Event Description</FieldLabel>
                          <EditTextarea
                            value={legendaryContextForm.event_description}
                            onChange={e => setLegendaryContextForm(f => ({ ...f, event_description: e.target.value }))}
                            rows={5}
                          />
                        </Field>
                      </FieldGrid>
                      <FieldLabel style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>Context Images</FieldLabel>
                      <ImageUploader draftImages={draftLegendaryImages} setDraftImages={setDraftLegendaryImages} />
                    </>
                  ) : legendaryContext ? (
                    <>
                      {legendaryContext.event_title && (
                        <FieldValue style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', marginBottom: 'var(--space-2)' }}>
                          {legendaryContext.event_title}
                        </FieldValue>
                      )}
                      {legendaryContext.event_description && (
                        <FieldValue style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {legendaryContext.event_description}
                        </FieldValue>
                      )}
                      {legendaryImages.length > 0 && (
                        <ImageStrip style={{ marginTop: 'var(--space-4)' }}>
                          {legendaryImages.map(img => (
                            <ImageThumb key={img.id}>
                              <img src={img.cloudinary_url} alt={img.caption ?? ''} />
                            </ImageThumb>
                          ))}
                        </ImageStrip>
                      )}
                    </>
                  ) : (
                    <Muted>No legendary context added yet. Edit to add event description and images.</Muted>
                  )}
                </Section>
              )}

              {/* ── Images ── */}
              {(isEditing || images.length > 0) && (
                <Section>
                  <SectionLabel>Images {images.length > 0 ? `(${images.length})` : ''}</SectionLabel>
                  {isEditing ? (
                    <ImageUploader draftImages={draftImages} setDraftImages={setDraftImages} />
                  ) : (
                    <>
                      <ImageStrip>
                        {images.map((img, idx) => (
                          <ImageThumb key={img.id} $primary={img.is_primary}>
                            <img src={img.cloudinary_url} alt="" />
                            {img.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
                            <ThumbExpandBtn onClick={() => setLightbox({ open: true, index: idx })}>
                              <span className="material-symbols-outlined">open_in_full</span>
                            </ThumbExpandBtn>
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

              {/* ── LOAs ── */}
              {(isEditing || loas.length > 0) && (
                <Section>
                  <SectionLabel>Letters of Authenticity {loas.length > 0 ? `(${loas.length})` : ''}</SectionLabel>
                  {isEditing ? (
                    <LoaUploader draftLOAs={draftLOAs} setDraftLOAs={setDraftLOAs} />
                  ) : (
                    <LoaViewList>
                      {loas.map(loa => {
                        const viewUrl = loa.cloudinary_url
                        const downloadUrl = `${loa.cloudinary_url}?download=`
                        const isRenaming = editingLoaId === loa.id
                        return (
                          <LoaViewRow key={loa.id}>
                            <LoaViewIcon>
                              {loa.resource_type === 'image'
                                ? <img src={loa.cloudinary_url} alt="" />
                                : <span className="material-symbols-outlined">description</span>
                              }
                            </LoaViewIcon>
                            <LoaViewInfo>
                              {isRenaming ? (
                                <LoaRenameInput
                                  autoFocus
                                  value={loaLabelDraft}
                                  onChange={e => setLoaLabelDraft(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitLoaRename(loa)
                                    if (e.key === 'Escape') cancelLoaRename()
                                  }}
                                />
                              ) : (
                                <LoaViewLabel>{loa.label || 'LOA'}</LoaViewLabel>
                              )}
                              <LoaViewType>{loa.resource_type === 'pdf' ? 'PDF' : 'Image'}</LoaViewType>
                            </LoaViewInfo>
                            <LoaViewActions>
                              {isRenaming ? (
                                <>
                                  <LoaActionBtn type="button" onClick={() => commitLoaRename(loa)} title="Save">
                                    <span className="material-symbols-outlined">check</span>
                                  </LoaActionBtn>
                                  <LoaActionBtn type="button" onClick={cancelLoaRename} title="Cancel">
                                    <span className="material-symbols-outlined">close</span>
                                  </LoaActionBtn>
                                </>
                              ) : (
                                <>
                                  <LoaActionBtn type="button" onClick={() => startLoaRename(loa)} title="Rename">
                                    <span className="material-symbols-outlined">edit</span>
                                  </LoaActionBtn>
                                  <LoaActionBtn as="a" href={viewUrl} target="_blank" rel="noreferrer" title="View">
                                    <span className="material-symbols-outlined">open_in_new</span>
                                  </LoaActionBtn>
                                  <LoaActionBtn as="a" href={downloadUrl} download title="Download">
                                    <span className="material-symbols-outlined">download</span>
                                  </LoaActionBtn>
                                </>
                              )}
                            </LoaViewActions>
                          </LoaViewRow>
                        )
                      })}
                    </LoaViewList>
                  )}
                </Section>
              )}
            </>
          )}
        </PanelBody>
      </Panel>
      {lightbox.open && images.length > 0 && (
        <ImageLightbox
          images={images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(l => ({ ...l, open: false }))}
        />
      )}
      {confirmDelete && (
        <ConfirmOverlay onClick={() => setConfirmDelete(false)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <ConfirmTitle>Delete Item</ConfirmTitle>
            <ConfirmText>
              Are you sure you want to delete <strong>{item?.title}</strong>? This will permanently remove the item and all associated data. This action cannot be undone.
            </ConfirmText>
            <ConfirmActions>
              <ConfirmCancelBtn onClick={() => setConfirmDelete(false)}>Cancel</ConfirmCancelBtn>
              <ConfirmDeleteBtn onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </ConfirmDeleteBtn>
            </ConfirmActions>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Overlay>
  )
}
