import { FieldGrid, Field, FieldLabel, EditInput, EditSelect } from '../FormFields'

export function ProgramFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Game Type</FieldLabel>
        <EditSelect value={form.game_type} onChange={e => setField('game_type', e.target.value)}>
          <option value="">—</option>
          <option value="regular_season">Regular Season</option>
          <option value="alds">ALDS</option>
          <option value="alcs">ALCS</option>
          <option value="nlds">NLDS</option>
          <option value="nlcs">NLCS</option>
          <option value="world_series">World Series</option>
          <option value="all_star">All-Star</option>
          <option value="spring_training">Spring Training</option>
          <option value="exhibition">Exhibition</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Publisher</FieldLabel>
        <EditInput type="text" value={form.publisher} placeholder="e.g. Scorebook Publishers"
          onChange={e => setField('publisher', e.target.value)} />
      </Field>
    </FieldGrid>
  )
}
