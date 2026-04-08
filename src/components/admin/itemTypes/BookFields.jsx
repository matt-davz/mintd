import { FieldGrid, Field, FieldLabel, EditInput, CheckboxLabel } from '../FormFields'

export function BookFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Author</FieldLabel>
        <EditInput type="text" value={form.author} placeholder="e.g. Jim Bouton"
          onChange={e => setField('author', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Publisher</FieldLabel>
        <EditInput type="text" value={form.publisher} placeholder="e.g. World Publishing"
          onChange={e => setField('publisher', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Year Published</FieldLabel>
        <EditInput type="number" value={form.year_published} placeholder="e.g. 1970"
          onChange={e => setField('year_published', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Edition</FieldLabel>
        <EditInput type="text" value={form.edition} placeholder="e.g. First Edition"
          onChange={e => setField('edition', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>ISBN</FieldLabel>
        <EditInput type="text" value={form.isbn} placeholder="e.g. 978-0-..."
          onChange={e => setField('isbn', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>First Edition</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_first_edition}
            onChange={e => setField('is_first_edition', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Signed by Author</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_signed_by_author}
            onChange={e => setField('is_signed_by_author', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
    </FieldGrid>
  )
}
