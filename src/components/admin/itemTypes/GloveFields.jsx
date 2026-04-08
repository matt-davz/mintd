import { FieldGrid, Field, FieldLabel, EditInput, EditSelect, CheckboxLabel } from '../FormFields'

export function GloveFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. Rawlings"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Model</FieldLabel>
        <EditInput type="text" value={form.model} placeholder="e.g. Heart of the Hide"
          onChange={e => setField('model', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Player Position</FieldLabel>
        <EditSelect value={form.player_position} onChange={e => setField('player_position', e.target.value)}>
          <option value="">—</option>
          <option value="pitcher">Pitcher</option>
          <option value="catcher">Catcher</option>
          <option value="first_base">First Base</option>
          <option value="second_base">Second Base</option>
          <option value="third_base">Third Base</option>
          <option value="shortstop">Shortstop</option>
          <option value="outfield">Outfield</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Handedness</FieldLabel>
        <EditSelect value={form.handedness} onChange={e => setField('handedness', e.target.value)}>
          <option value="">—</option>
          <option value="left_hand_throw">Left Hand Throw</option>
          <option value="right_hand_throw">Right Hand Throw</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Year Used</FieldLabel>
        <EditInput type="number" value={form.year_used} placeholder="e.g. 1965"
          onChange={e => setField('year_used', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Game Used</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_game_used}
            onChange={e => setField('is_game_used', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
    </FieldGrid>
  )
}
