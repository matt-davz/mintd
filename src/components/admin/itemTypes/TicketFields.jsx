import { FieldGrid, Field, FieldLabel, EditInput, EditSelect, CheckboxLabel } from '../FormFields'

export function TicketFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Full Ticket</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_full_ticket}
            onChange={e => setField('is_full_ticket', e.target.checked)} />
          Yes (not a stub)
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Section</FieldLabel>
        <EditInput type="text" value={form.section} placeholder="e.g. 203"
          onChange={e => setField('section', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Row</FieldLabel>
        <EditInput type="text" value={form.row} placeholder="e.g. A"
          onChange={e => setField('row', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Seat</FieldLabel>
        <EditInput type="text" value={form.seat} placeholder="e.g. 12"
          onChange={e => setField('seat', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Face Value</FieldLabel>
        <EditInput type="number" min="0" step="0.01" value={form.face_value}
          placeholder="0.00"
          onChange={e => setField('face_value', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Printer</FieldLabel>
        <EditInput type="text" value={form.printer} placeholder="e.g. Globe Ticket Co."
          onChange={e => setField('printer', e.target.value)} />
      </Field>
    </FieldGrid>
  )
}
