import { FieldGrid, Field, FieldLabel, EditInput, CheckboxLabel } from '../FormFields'

export function MagazineFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Publication Name</FieldLabel>
        <EditInput type="text" value={form.publication_name} placeholder="e.g. Sports Illustrated"
          onChange={e => setField('publication_name', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Issue Date</FieldLabel>
        <EditInput type="date" value={form.issue_date}
          onChange={e => setField('issue_date', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Volume</FieldLabel>
        <EditInput type="text" value={form.volume} placeholder="e.g. Vol. 5"
          onChange={e => setField('volume', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Issue Number</FieldLabel>
        <EditInput type="text" value={form.issue_number} placeholder="e.g. #23"
          onChange={e => setField('issue_number', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Publisher</FieldLabel>
        <EditInput type="text" value={form.publisher} placeholder="e.g. Time Inc."
          onChange={e => setField('publisher', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Cover Subject</FieldLabel>
        <EditInput type="text" value={form.cover_subject} placeholder="e.g. Mickey Mantle"
          onChange={e => setField('cover_subject', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Cover Signed</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_cover_signed}
            onChange={e => setField('is_cover_signed', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
    </FieldGrid>
  )
}
