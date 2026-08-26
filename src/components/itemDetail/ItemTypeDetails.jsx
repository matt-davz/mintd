import { SectionHeading, Divider, DetailGrid, DetailRow, DetailLabel, DetailValue, formatEnum } from './styles'
import { GameContextDisplay } from './GameContextDisplay'
import { TicketDisplay } from './TicketDisplay'
import { CardDisplay } from './CardDisplay'
import { BaseballDisplay } from './BaseballDisplay'
import { BatDisplay } from './BatDisplay'
import { JerseyDisplay } from './JerseyDisplay'
import { PhotoDisplay } from './PhotoDisplay'
import { MagazineDisplay } from './MagazineDisplay'
import { ProgramDisplay } from './ProgramDisplay'
import { BookDisplay } from './BookDisplay'
import { BaseDisplay } from './BaseDisplay'
import { GloveDisplay } from './GloveDisplay'
import { MiscellaneousDisplay } from './MiscellaneousDisplay'
import { StadiumGiveawayDisplay } from './StadiumGiveawayDisplay'
import { TicketSheetDisplay } from './TicketSheetDisplay'

const TYPE_COMPONENTS = {
  ticket: TicketDisplay,
  ticket_sheet: TicketSheetDisplay,
  card: CardDisplay,
  baseball: BaseballDisplay,
  bat: BatDisplay,
  jersey: JerseyDisplay,
  photo: PhotoDisplay,
  magazine: MagazineDisplay,
  program: ProgramDisplay,
  book: BookDisplay,
  base: BaseDisplay,
  glove: GloveDisplay,
  miscellaneous: MiscellaneousDisplay,
  stadium_giveaway: StadiumGiveawayDisplay,
}

export function ItemTypeDetails({ itemType, detail, gameContext, item }) {
  const TypeComponent = TYPE_COMPONENTS[itemType]
  if (!TypeComponent || !detail) return null

  return (
    <>
      <Divider />
      <section>
        <SectionHeading>{formatEnum(itemType)} Details</SectionHeading>
        <TypeComponent detail={detail} item={item} />
        {item?.is_duplicate && (
          <DetailGrid style={{ marginTop: 'var(--space-4)' }}>
            <DetailRow>
              <DetailLabel>Duplicate</DetailLabel>
              <DetailValue>Yes</DetailValue>
            </DetailRow>
          </DetailGrid>
        )}
      </section>
      {/* ticket_sheet renders its own multi-game accordion inside TicketSheetDisplay */}
      {itemType !== 'ticket_sheet' && <GameContextDisplay gameContext={gameContext} />}
    </>
  )
}
