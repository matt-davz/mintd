import { FieldGrid, Field, FullField, FieldLabel, EditInput, CheckboxLabel } from '../FormFields'

export function BatFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. Louisville Slugger"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Model Number</FieldLabel>
        <EditInput type="text" value={form.model_number} placeholder="e.g. P72"
          onChange={e => setField('model_number', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Length (in)</FieldLabel>
        <EditInput type="number" step="0.1" value={form.length_inches} placeholder="e.g. 34.5"
          onChange={e => setField('length_inches', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Weight (oz)</FieldLabel>
        <EditInput type="number" step="0.1" value={form.weight_oz} placeholder="e.g. 32.0"
          onChange={e => setField('weight_oz', e.target.value)} />
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
        <FieldLabel>Year Used</FieldLabel>
        <EditInput type="number" value={form.year_used} placeholder="e.g. 1961"
          onChange={e => setField('year_used', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Cracked</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_cracked}
            onChange={e => setField('is_cracked', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Pine Tar</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.has_pine_tar}
            onChange={e => setField('has_pine_tar', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <FullField>
        <FieldLabel>Inscription</FieldLabel>
        <EditInput type="text" value={form.inscription} placeholder="e.g. 500 HR Club"
          onChange={e => setField('inscription', e.target.value)} />
      </FullField>
    </FieldGrid>
  )
}
