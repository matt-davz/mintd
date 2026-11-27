import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useAuctionPriceComps } from '../../../hooks/useAuctionPriceComps'
import { COMP_FILTERS, isVerified, sortComps } from '../../../lib/priceComps'
import { EditSelect } from '../FormFields'
import { GhostBtn, StateBox } from '../watchlist/styles'
import { AddCompForm } from './AddCompForm'
import { PriceCompCard } from './PriceCompCard'

const Wrap = styled.section`
  margin-top: var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
`

const HeadText = styled.div`
  flex: 1 1 20rem;
  min-width: 0;
`

const Title = styled.h2`
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-1);
`

const Sub = styled.p`
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(229, 226, 225, 0.45);
`

const Counts = styled.p`
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);

  strong { color: var(--color-on-surface-variant); font-weight: 700; }
`

const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  select { width: auto; }
`

const RetryRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--space-4);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: var(--space-4);
`

/**
 * Private price comps on the Want List page. Lots tracked only to learn
 * their verified closing price — deliberately separate from the purchase
 * Want List rows and counts above it.
 */
export function PriceCompsSection() {
  const { comps, loading, error, reload, addComp, updateComp, removeComp } = useAuctionPriceComps()
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const verifiedCount = useMemo(() => comps.filter(isVerified).length, [comps])
  const pendingCount = comps.length - verifiedCount

  const shown = useMemo(() => {
    const filtered = filter === 'all' ? comps : comps.filter(c => isVerified(c) === (filter === 'verified'))
    return sortComps(filtered)
  }, [comps, filter])

  let body
  if (loading) {
    body = <StateBox><span className="material-symbols-outlined">hourglass_empty</span>Loading price comps…</StateBox>
  } else if (error) {
    body = (
      <StateBox role="alert">
        <span className="material-symbols-outlined">error</span>
        {error}
        <RetryRow><GhostBtn type="button" onClick={reload}>Retry</GhostBtn></RetryRow>
      </StateBox>
    )
  } else if (shown.length === 0) {
    body = (
      <StateBox>
        <span className="material-symbols-outlined">price_check</span>
        {comps.length === 0 ? 'No price comps yet.' : `No ${filter} comps.`}
      </StateBox>
    )
  } else {
    body = (
      <Grid>
        {shown.map(c => <PriceCompCard key={c.id} comp={c} now={now} onUpdate={updateComp} onRemove={removeComp} />)}
      </Grid>
    )
  }

  return (
    <Wrap aria-labelledby="price-comps-title">
      <Header>
        <HeadText>
          <Title id="price-comps-title">Price Comps</Title>
          <Sub>
            Lots tracked only to learn verified closing prices for similar items already in the collection.
            Not purchase targets — not counted in the Want List above.
          </Sub>
          {!loading && !error && (
            <Counts><strong>{comps.length}</strong> comps · <strong>{pendingCount}</strong> pending · <strong>{verifiedCount}</strong> verified</Counts>
          )}
        </HeadText>
        <Tools>
          <EditSelect value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter price comps">
            {COMP_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </EditSelect>
          <GhostBtn type="button" onClick={() => setAdding(a => !a)} aria-expanded={adding}>
            <span className="material-symbols-outlined" aria-hidden="true">{adding ? 'close' : 'add'}</span>
            Add comp
          </GhostBtn>
        </Tools>
      </Header>
      {adding && <AddCompForm onAdd={addComp} onClose={() => setAdding(false)} />}
      {body}
    </Wrap>
  )
}
