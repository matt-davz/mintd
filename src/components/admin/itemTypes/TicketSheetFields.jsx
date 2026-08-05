import { FieldGrid, Field, FieldLabel, EditInput, CheckboxLabel } from '../FormFields'

export function TicketSheetFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Sheet Size</FieldLabel>
        <EditInput type="number" min="1" value={form.sheet_size} placeholder="e.g. 4"
          onChange={e => setField('sheet_size', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Printer</FieldLabel>
        <EditInput type="text" value={form.printer} placeholder="e.g. printer name"
          onChange={e => setField('printer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Section</FieldLabel>
        <EditInput type="text" value={form.section} placeholder="Sec"
          onChange={e => setField('section', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Row</FieldLabel>
        <EditInput type="text" value={form.row} placeholder="Row"
          onChange={e => setField('row', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Seat</FieldLabel>
        <EditInput type="text" value={form.seat} placeholder="Seat"
          onChange={e => setField('seat', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Face Value (per ticket)</FieldLabel>
        <EditInput type="number" min="0" step="0.01" value={form.face_value} placeholder="0.00"
          onChange={e => setField('face_value', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Phantom Game Label</FieldLabel>
        <EditInput type="text" value={form.phantom_game_label} placeholder="e.g. Game 6 (never played)"
          onChange={e => setField('phantom_game_label', e.target.value)} />
      </Field>
      <Field style={{ display: 'flex', alignItems: 'flex-end' }}>
        <CheckboxLabel>
          <input type="checkbox" checked={!!form.is_uncut}
            onChange={e => setField('is_uncut', e.target.checked)} />
          Uncut / Intact
        </CheckboxLabel>
      </Field>
      <Field style={{ display: 'flex', alignItems: 'flex-end' }}>
        <CheckboxLabel>
          <input type="checkbox" checked={!!form.includes_phantom_game}
            onChange={e => setField('includes_phantom_game', e.target.checked)} />
          Includes Phantom Game
        </CheckboxLabel>
      </Field>
    </FieldGrid>
  )
}
