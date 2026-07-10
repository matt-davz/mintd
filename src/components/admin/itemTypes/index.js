import { TicketFields }   from './TicketFields'
import { CardFields }     from './CardFields'
import { BaseballFields } from './BaseballFields'
import { BatFields }      from './BatFields'
import { JerseyFields }   from './JerseyFields'
import { PhotoFields }    from './PhotoFields'
import { MagazineFields } from './MagazineFields'
import { ProgramFields }  from './ProgramFields'
import { BookFields }     from './BookFields'
import { BaseFields }     from './BaseFields'
import { GloveFields }    from './GloveFields'
import { MiscellaneousFields }   from './MiscellaneousFields'
import { StadiumGiveawayFields } from './StadiumGiveawayFields'

export {
  TicketFields, CardFields, BaseballFields, BatFields, JerseyFields,
  PhotoFields, MagazineFields, ProgramFields, BookFields, BaseFields, GloveFields,
  MiscellaneousFields, StadiumGiveawayFields,
}

export const TYPE_FIELDS_MAP = {
  ticket:   TicketFields,
  card:     CardFields,
  baseball: BaseballFields,
  bat:      BatFields,
  jersey:   JerseyFields,
  photo:    PhotoFields,
  magazine: MagazineFields,
  program:  ProgramFields,
  book:     BookFields,
  base:     BaseFields,
  glove:    GloveFields,
  miscellaneous:    MiscellaneousFields,
  stadium_giveaway: StadiumGiveawayFields,
}
