import { FieldGrid, Field, FieldLabel, EditInput } from '../FormFields'

export function StadiumGiveawayFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Event Name</FieldLabel>
        <EditInput type="text" value={form.event_name} placeholder="e.g. Bobblehead Night"
          onChange={e => setField('event_name', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Event Date</FieldLabel>
        <EditInput type="date" value={form.event_date}
          onChange={e => setField('event_date', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Giveaway Item Type</FieldLabel>
        <EditInput type="text" value={form.giveaway_item_type} placeholder="e.g. Bobblehead"
          onChange={e => setField('giveaway_item_type', e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Manufacturer</FieldLabel>
        <EditInput type="text" value={form.manufacturer} placeholder="e.g. FOCO"
          onChange={e => setField('manufacturer', e.target.value)} />
      </Field>
    </FieldGrid>
  )
}
