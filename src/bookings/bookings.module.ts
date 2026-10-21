import { Body, Controller, Get, Module, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking, Court } from '../entities';
import { CreateBookingDto, IntervalDto } from '../dto';
import { BookingsService } from './bookings.service';
@Controller()
class BookingsController {
  constructor(private readonly service: BookingsService) {}
  @Post('bookings') create(@Body() dto: CreateBookingDto) { return this.service.create(dto); }
  @Get('courts/:id/availability') availability(@Param('id', ParseUUIDPipe) id: string, @Query() dto: IntervalDto) {
    return this.service.availability(id, dto);
  }
}
@Module({ imports: [TypeOrmModule.forFeature([Booking, Court])], providers: [BookingsService], controllers: [BookingsController] })
export class BookingsModule {}
