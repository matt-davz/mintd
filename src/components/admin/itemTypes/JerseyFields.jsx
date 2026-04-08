import { FieldGrid, Field, FullField, FieldLabel, EditInput, EditSelect, CheckboxLabel } from '../FormFields'

export function JerseyFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Player Number</FieldLabel>
        <EditInput type="text" value={form.player_number} placeholder="e.g. 7"
          onChange={e => setField('player_number', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Team</FieldLabel>
        <EditInput type="text" value={form.team} placeholder="e.g. New York Yankees"
          onChange={e => setField('team', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Year Worn</FieldLabel>
        <EditInput type="number" value={form.year_worn} placeholder="e.g. 1961"
          onChange={e => setField('year_worn', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Game Worn</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_game_worn}
            onChange={e => setField('is_game_worn', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Size</FieldLabel>
        <EditInput type="text" value={form.size} placeholder="e.g. 44"
          onChange={e => setField('size', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. Mitchell & Ness"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Jersey Type</FieldLabel>
        <EditSelect value={form.jersey_type} onChange={e => setField('jersey_type', e.target.value)}>
          <option value="">—</option>
          <option value="home">Home</option>
          <option value="away">Away</option>
          <option value="alternate">Alternate</option>
          <option value="spring_training">Spring Training</option>
          <option value="all_star">All-Star</option>
          <option value="throwback">Throwback</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Special Patch</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.has_special_patch}
            onChange={e => setField('has_special_patch', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      {form.has_special_patch && (
        <FullField>
          <FieldLabel>Patch Description</FieldLabel>
          <EditInput type="text" value={form.patch_description}
            placeholder="e.g. 1961 World Series patch"
            onChange={e => setField('patch_description', e.target.value)} />
        </FullField>
      )}
    </FieldGrid>
  )
}
