import { FieldGrid, Field, FieldLabel, EditInput, CheckboxLabel } from '../FormFields'

export function CardFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Set Name</FieldLabel>
        <EditInput type="text" value={form.card_set_name} placeholder="e.g. 1952 Topps"
          onChange={e => setField('card_set_name', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Card Number</FieldLabel>
        <EditInput type="text" value={form.card_number} placeholder="e.g. #311"
          onChange={e => setField('card_number', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. Topps"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Year Issued</FieldLabel>
        <EditInput type="number" value={form.year_issued} placeholder="e.g. 1952"
          onChange={e => setField('year_issued', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Parallel / Variation</FieldLabel>
        <EditInput type="text" value={form.parallel_variation} placeholder="e.g. Gold Refractor"
          onChange={e => setField('parallel_variation', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Rookie Card</FieldLabel>
        <CheckboxLabel>
          <input type="checkbox" checked={form.is_rookie_card}
            onChange={e => setField('is_rookie_card', e.target.checked)} />
          Yes
        </CheckboxLabel>
      </Field>
      <Field>
        <FieldLabel>Serial Number</FieldLabel>
        <EditInput type="number" value={form.serial_number} placeholder="e.g. 25"
          onChange={e => setField('serial_number', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Print Run</FieldLabel>
        <EditInput type="number" value={form.print_run} placeholder="e.g. 500"
          onChange={e => setField('print_run', e.target.value)} />
      </Field>
    </FieldGrid>
  )
}
