import {
  FieldGrid, Field, FullField, FieldLabel,
  EditInput, EditSelect, EditTextarea,
} from './FormFields'

export function GameContextFields({ form, setField }) {
  return (
    <FieldGrid>
      <Field>
        <FieldLabel>Game Date</FieldLabel>
        <EditInput
          type="date"
          value={form.game_date}
          onChange={e => setField('game_date', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Home Team</FieldLabel>
        <EditInput
          type="text"
          value={form.home_team}
          placeholder="e.g. NYY"
          onChange={e => setField('home_team', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Away Team</FieldLabel>
        <EditInput
          type="text"
          value={form.away_team}
          placeholder="e.g. BOS"
          onChange={e => setField('away_team', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Venue</FieldLabel>
        <EditInput
          type="text"
          value={form.venue}
          placeholder="e.g. Yankee Stadium"
          onChange={e => setField('venue', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>City</FieldLabel>
        <EditInput
          type="text"
          value={form.city}
          placeholder="e.g. New York"
          onChange={e => setField('city', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Season Year</FieldLabel>
        <EditInput
          type="number"
          value={form.season_year}
          placeholder="e.g. 1956"
          onChange={e => setField('season_year', e.target.value)}
        />
      </Field>
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
        <FieldLabel>Series Game #</FieldLabel>
        <EditInput
          type="number"
          min="1"
          max="7"
          value={form.series_game_number}
          placeholder="—"
          onChange={e => setField('series_game_number', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Game Result</FieldLabel>
        <EditSelect value={form.game_result} onChange={e => setField('game_result', e.target.value)}>
          <option value="">—</option>
          <option value="home_win">Home Win</option>
          <option value="home_loss">Home Loss</option>
          <option value="tie">Tie</option>
          <option value="unknown">Unknown</option>
        </EditSelect>
      </Field>
      <Field>
        <FieldLabel>Home Score</FieldLabel>
        <EditInput
          type="number"
          min="0"
          value={form.home_score}
          placeholder="—"
          onChange={e => setField('home_score', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Away Score</FieldLabel>
        <EditInput
          type="number"
          min="0"
          value={form.away_score}
          placeholder="—"
          onChange={e => setField('away_score', e.target.value)}
        />
      </Field>
      <FullField>
        <FieldLabel>Game Notes</FieldLabel>
        <EditTextarea
          value={form.notes}
          placeholder="Additional game context..."
          onChange={e => setField('notes', e.target.value)}
        />
      </FullField>
    </FieldGrid>
  )
}
