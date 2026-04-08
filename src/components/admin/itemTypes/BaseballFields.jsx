import { FieldGrid, Field, FullField, FieldLabel, EditInput, EditSelect, CheckboxLabel } from '../FormFields'

export function BaseballFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Game Used</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_game_used}
            onChange={e => setField('is_game_used', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Game Used Type</FieldLabel>
        <EditSelect value={form.game_used_type}
          disabled={!form.is_game_used}
          onChange={e => setField('game_used_type', e.target.value)}>
          <option value="">—</option>
          <option value="game">Game</option>
          <option value="batting_practice">Batting Practice</option>
          <option value="home_run">Home Run</option>
          <option value="ceremonial_first_pitch">Ceremonial First Pitch</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Team Signed</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_team_signed}
            onChange={e => setField('is_team_signed', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. Rawlings"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>League Stamp</FieldLabel>
        <EditInput type="text" value={form.league_stamp} placeholder="e.g. OAL, ONL"
          onChange={e => setField('league_stamp', e.target.value)} />
      </Field>
      <FullField>
        <FieldLabel>Inscription</FieldLabel>
        <EditInput type="text" value={form.inscription} placeholder="e.g. HOF 1999"
          onChange={e => setField('inscription', e.target.value)} />
      </FullField>
    </FieldGrid>
  )
}
