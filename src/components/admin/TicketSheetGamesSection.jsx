import { useState } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { EMPTY_GAME_CONTEXT, serializeForm } from '../../lib/itemTypeConfig'
import {
  Field, FieldLabel, EditInput, CheckboxLabel, ErrorBanner,
} from './FormFields'
import { GameContextFields } from './GameContextFields'
import { BoxScoreDisplay } from '../BoxScoreDisplay'
import { useTicketSheetGames } from '../../hooks/useTicketSheetGames'

// ─── Styled ─────────────────────────────────────────────────────────────────

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const GameCardWrap = styled.div`
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--color-surface-high);
`

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
`

const CardTitle = styled.span`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--color-on-surface);
`

const PhantomBadge = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-tertiary, #cbbeff);
  background: rgba(203, 190, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
`

const RowBtns = styled.div`
  display: flex;
  gap: var(--space-2);
`

const SmallBtn = styled.button`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: opacity var(--transition-base), background-color var(--transition-base);

  ${({ $variant }) => $variant === 'danger' ? `
    background: rgba(147, 0, 10, 0.2);
    color: #ffb4ab;
    &:hover { background: rgba(147, 0, 10, 0.35); }
  ` : $variant === 'primary' ? `
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    color: var(--color-on-primary);
    &:hover:not(:disabled) { opacity: 0.85; }
  ` : `
    background: var(--color-surface-bright);
    color: var(--color-on-surface-variant);
    &:hover { color: var(--color-on-surface); }
  `}

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const AddBtn = styled(SmallBtn)`
  align-self: flex-start;
`

const JunctionRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-4);
  align-items: end;
  margin-bottom: var(--space-4);
`

const Hint = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.03em;
  color: var(--color-outline);
  line-height: 1.5;
`

const ReadRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  &:first-child { border-top: none; }
`

const ReadTitle = styled.span`
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-on-surface);
`

const ReadMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
`

// ─── Helpers ──────────────────────────────────────────────────────────────

function initGcForm(gc) {
  const f = { ...EMPTY_GAME_CONTEXT }
  if (gc) {
    for (const key of Object.keys(f)) {
      if (gc[key] != null) f[key] = gc[key]
    }
  }
  return f
}

function summaryLine(gc) {
  if (!gc) return ''
  const matchup = [gc.away_team, gc.home_team].filter(Boolean).join(' @ ')
  const score = gc.home_score != null && gc.away_score != null
    ? `${gc.away_score}–${gc.home_score}` : null
  return [gc.game_date, matchup, score].filter(Boolean).join('  ·  ')
}

// ─── Editable game card ─────────────────────────────────────────────────────

function GameCard({ game, onChanged }) {
  const [gcForm, setGcForm] = useState(() => initGcForm(game.game_context))
  const [label, setLabel] = useState(game.game_label ?? '')
  const [isPhantom, setIsPhantom] = useState(!!game.is_phantom)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  function setGcField(key, value) {
    setGcForm(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      if (game.game_context_id) {
        const payload = serializeForm(gcForm)
        for (const k of ['season_year', 'series_game_number', 'home_score', 'away_score']) {
          if (payload[k] !== null) payload[k] = Number(payload[k])
        }
        const { error } = await supabase
          .from('game_context').update(payload).eq('id', game.game_context_id)
        if (error) throw new Error(error.message)
      }
      const { error: linkErr } = await supabase
        .from('ticket_sheet_games')
        .update({ game_label: label || null, is_phantom: isPhantom })
        .eq('id', game.id)
      if (linkErr) throw new Error(linkErr.message)
      await onChanged()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove this game from the sheet? The underlying game record is kept.')) return
    setSaving(true)
    setErr(null)
    try {
      const { error } = await supabase.from('ticket_sheet_games').delete().eq('id', game.id)
      if (error) throw new Error(error.message)
      await onChanged()
    } catch (e) {
      setErr(e.message)
      setSaving(false)
    }
  }

  return (
    <GameCardWrap>
      <CardHead>
        <CardTitle>{label || 'Untitled game'}</CardTitle>
        <RowBtns>
          <SmallBtn $variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Game'}
          </SmallBtn>
          <SmallBtn $variant="danger" onClick={remove} disabled={saving}>Remove</SmallBtn>
        </RowBtns>
      </CardHead>

      <JunctionRow>
        <Field>
          <FieldLabel>Game Label</FieldLabel>
          <EditInput
            type="text"
            value={label}
            placeholder="e.g. Game 3"
            onChange={e => setLabel(e.target.value)}
          />
        </Field>
        <CheckboxLabel>
          <input type="checkbox" checked={isPhantom} onChange={e => setIsPhantom(e.target.checked)} />
          Phantom (never played)
        </CheckboxLabel>
      </JunctionRow>

      <GameContextFields form={gcForm} setField={setGcField} />

      {err && <ErrorBanner style={{ marginTop: 'var(--space-3)' }}>{err}</ErrorBanner>}
    </GameCardWrap>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

export function TicketSheetGamesSection({ itemId, isEditing }) {
  const { games, sheetId, loading, refetch } = useTicketSheetGames(itemId)
  const [adding, setAdding] = useState(false)
  const [addErr, setAddErr] = useState(null)

  async function addGame() {
    if (!sheetId) return
    setAdding(true)
    setAddErr(null)
    try {
      const { data: gc, error: gcErr } = await supabase
        .from('game_context').insert({}).select('id').single()
      if (gcErr) throw new Error(gcErr.message)

      const nextOrder = games.reduce((max, g) => Math.max(max, g.display_order ?? 0), 0) + 1
      const { error: linkErr } = await supabase.from('ticket_sheet_games').insert({
        ticket_sheet_id: sheetId,
        game_context_id: gc.id,
        display_order: nextOrder,
        is_phantom: false,
        game_label: `Game ${nextOrder}`,
      })
      if (linkErr) throw new Error(linkErr.message)
      await refetch()
    } catch (e) {
      setAddErr(e.message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <Hint>Loading games…</Hint>

  if (!sheetId) {
    return <Hint>Save the item first to link game contexts to this sheet.</Hint>
  }

  if (!isEditing) {
    if (games.length === 0) return <Hint>No games linked to this sheet yet.</Hint>
    return (
      <div>
        {games.map(game => {
          const gc = game.game_context
          return (
            <ReadRow key={game.id}>
              <ReadTitle>
                {game.game_label || `Game ${gc?.series_game_number ?? ''}`}
                {game.is_phantom && <PhantomBadge style={{ marginLeft: 'var(--space-2)' }}>Phantom</PhantomBadge>}
              </ReadTitle>
              {summaryLine(gc) && <ReadMeta>{summaryLine(gc)}</ReadMeta>}
              {!game.is_phantom && gc?.box_score && gc.box_score.innings?.length > 0 && (
                <BoxScoreDisplay boxScore={gc.box_score} homeTeam={gc.home_team} awayTeam={gc.away_team} />
              )}
            </ReadRow>
          )
        })}
      </div>
    )
  }

  return (
    <Stack>
      {games.map(game => (
        <GameCard key={game.id} game={game} onChanged={refetch} />
      ))}
      <AddBtn onClick={addGame} disabled={adding}>
        {adding ? 'Adding…' : '+ Add Game'}
      </AddBtn>
      {addErr && <ErrorBanner>{addErr}</ErrorBanner>}
    </Stack>
  )
}
