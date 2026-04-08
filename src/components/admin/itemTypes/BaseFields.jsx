import { FieldGrid, Field, FieldLabel, EditInput, EditSelect, CheckboxLabel } from '../FormFields'

export function BaseFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Base Position</FieldLabel>
        <EditSelect value={form.base_position} onChange={e => setField('base_position', e.target.value)}>
          <option value="">—</option>
          <option value="first">First</option>
          <option value="second">Second</option>
          <option value="third">Third</option>
          <option value="home">Home</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Game Used</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_game_used}
            onChange={e => setField('is_game_used', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. Schutt"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>MLB Authentication</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.has_mlb_authentication}
            onChange={e => setField('has_mlb_authentication', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
    </FieldGrid>
  )
}
