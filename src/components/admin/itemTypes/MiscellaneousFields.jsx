import { FieldGrid, Field, FullField, FieldLabel, EditInput, EditTextarea } from '../FormFields'

export function MiscellaneousFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Category</FieldLabel>
        <EditInput type="text" value={form.category} placeholder="e.g. Memorabilia"
          onChange={e => setField('category', e.target.value)} />
      </Field>
      <FullField>
        <FieldLabel>Description</FieldLabel>
        <EditTextarea value={form.description} placeholder="Additional details..."
          onChange={e => setField('description', e.target.value)} />
      </FullField>
    </FieldGrid>
  )
}
