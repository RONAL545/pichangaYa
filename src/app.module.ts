import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/data-source';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';
import { CourtsModule } from './courts/courts.module';
import { BookingsModule } from './bookings/bookings.module';
@Module({ imports: [TypeOrmModule.forRoot(dataSource.options), UsersModule, VenuesModule, CourtsModule, BookingsModule] })
export class AppModule {}
