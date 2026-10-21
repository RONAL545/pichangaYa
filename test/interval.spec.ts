import { BadRequestException } from '@nestjs/common';
import { parseInterval } from '../src/bookings/bookings.service';
describe('interval validation', () => {
  it('normalizes explicit offsets', () => {
    expect(parseInterval({ startsAt: '2026-10-21T10:00:00-05:00', endsAt: '2026-10-21T16:00:00Z' })[0].toISOString()).toBe('2026-10-21T15:00:00.000Z');
  });
  it.each([
    ['2026-10-21T10:00:00', '2026-10-21T11:00:00'],
    ['2026-10-21T10:00:00Z', '2026-10-21T10:00:00Z'],
    ['2026-10-21T11:00:00Z', '2026-10-21T10:00:00Z'],
    ['invalid', '2026-10-21T11:00:00Z'],
  ])('rejects invalid interval %s / %s', (startsAt, endsAt) => {
    expect(() => parseInterval({ startsAt, endsAt })).toThrow(BadRequestException);
  });
});
