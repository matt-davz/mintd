import { DetailGrid, DetailRow, DetailLabel, DetailValue } from './styles'

export function MiscellaneousDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      {detail.category && (
        <DetailRow>
          <DetailLabel>Category</DetailLabel>
          <DetailValue>{detail.category}</DetailValue>
        </DetailRow>
      )}

      {detail.description && (
        <DetailRow>
          <DetailLabel>Description</DetailLabel>
          <DetailValue>{detail.description}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
