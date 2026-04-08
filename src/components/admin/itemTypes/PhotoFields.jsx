import { FieldGrid, Field, FieldLabel, EditInput, EditSelect } from '../FormFields'

export function PhotoFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Photo Type</FieldLabel>
        <EditSelect value={form.photo_type} onChange={e => setField('photo_type', e.target.value)}>
          <option value="">—</option>
          <option value="type_1">Type 1 (Original)</option>
          <option value="type_2">Type 2 (Reissue)</option>
          <option value="type_3">Type 3 (Modern Reprint)</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Format</FieldLabel>
        <EditSelect value={form.photo_format} onChange={e => setField('photo_format', e.target.value)}>
          <option value="">—</option>
          <option value="original_print">Original Print</option>
          <option value="wire_photo">Wire Photo</option>
          <option value="news_service">News Service</option>
          <option value="cabinet_card">Cabinet Card</option>
          <option value="cdv">CDV</option>
          <option value="reprint">Reprint</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Era</FieldLabel>
        <EditSelect value={form.photo_era} onChange={e => setField('photo_era', e.target.value)}>
          <option value="">—</option>
          <option value="sepia">Sepia</option>
          <option value="black_and_white">Black & White</option>
          <option value="color">Color</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Size</FieldLabel>
        <EditInput type="text" value={form.photo_size} placeholder='e.g. 8" x 10"'
          onChange={e => setField('photo_size', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Photographer</FieldLabel>
        <EditInput type="text" value={form.photographer} placeholder="e.g. Charles Conlon"
          onChange={e => setField('photographer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Agency / Source</FieldLabel>
        <EditInput type="text" value={form.agency_source} placeholder="e.g. AP, UPI"
          onChange={e => setField('agency_source', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Event / Subject</FieldLabel>
        <EditInput type="text" value={form.event_subject}
          placeholder="e.g. 1927 World Series celebration"
          onChange={e => setField('event_subject', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Photo Date</FieldLabel>
        <EditInput type="date" value={form.photo_date}
          onChange={e => setField('photo_date', e.target.value)} />
      </Field>
    </FieldGrid>
  )
}
