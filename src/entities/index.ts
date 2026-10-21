import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ unique: true, length: 254 }) email!: string;
}
@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ length: 300 }) address!: string;
  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location!: { type: 'Point'; coordinates: [number, number] };
}
@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 120 }) name!: string;
  @Column('uuid', { name: 'venue_id' }) venueId!: string;
  @ManyToOne(() => Venue, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'venue_id' }) venue!: Venue;
}
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column('uuid', { name: 'court_id' }) courtId!: string;
  @ManyToOne(() => Court, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'court_id' }) court!: Court;
  @Column('uuid', { name: 'user_id' }) userId!: string;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @Column('timestamptz', { name: 'starts_at' }) startsAt!: Date;
  @Column('timestamptz', { name: 'ends_at' }) endsAt!: Date;
}
