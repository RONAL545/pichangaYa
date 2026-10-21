import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, Court } from '../entities';
import { CreateBookingDto, IntervalDto } from '../dto';
import { databaseError } from '../database/errors';
export function parseInterval(dto: IntervalDto): [Date, Date] {
  // Reject ambiguous local dates: every timestamp must include an offset or Z.
  const zone = /(?:Z|[+-]\d{2}:\d{2})$/i;
  const start = new Date(dto.startsAt), end = new Date(dto.endsAt);
  if (!zone.test(dto.startsAt) || !zone.test(dto.endsAt) || !Number.isFinite(+start) || !Number.isFinite(+end) || +start >= +end) {
    throw new BadRequestException('Usa fechas con zona horaria y endsAt mayor que startsAt');
  }
  return [start, end];
}
@Injectable()
export class BookingsService {
  constructor(@InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(Court) private readonly courts: Repository<Court>) {}
  async create(dto: CreateBookingDto) {
    const [startsAt, endsAt] = parseInterval(dto);
    try {
      // The exclusion constraint arbitrates concurrent inserts atomically.
      return await this.bookings.save(this.bookings.create({ courtId: dto.courtId, userId: dto.userId, startsAt, endsAt }));
    } catch (e) { databaseError(e); }
  }
  async availability(courtId: string, dto: IntervalDto) {
    const [start, end] = parseInterval(dto);
    if (!await this.courts.existsBy({ id: courtId })) throw new NotFoundException('Cancha no encontrada');
    const conflicts = await this.bookings.createQueryBuilder('b').where('b.court_id = :courtId', { courtId })
      .andWhere('b.starts_at < :end AND b.ends_at > :start', { start, end }).orderBy('b.starts_at', 'ASC').getMany();
    let cursor = start;
    const freeIntervals: { startsAt: Date; endsAt: Date }[] = [];
    for (const b of conflicts) {
      if (+b.startsAt > +cursor) freeIntervals.push({ startsAt: cursor, endsAt: b.startsAt });
      if (+b.endsAt > +cursor) cursor = b.endsAt;
    }
    if (+cursor < +end) freeIntervals.push({ startsAt: cursor, endsAt: end });
    return { courtId, available: conflicts.length === 0, freeIntervals };
  }
}
