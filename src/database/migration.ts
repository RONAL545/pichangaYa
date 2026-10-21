import { MigrationInterface, QueryRunner } from 'typeorm';
export class Core1792530000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS btree_gist;
      CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, email varchar(254) NOT NULL UNIQUE);
      CREATE TABLE venues (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, address varchar(300) NOT NULL, location geography(Point,4326) NOT NULL);
      CREATE INDEX venues_location_gist ON venues USING gist(location);
      CREATE TABLE courts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, venue_id uuid NOT NULL REFERENCES venues(id));
      CREATE INDEX courts_venue_idx ON courts(venue_id);
      CREATE TABLE bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), court_id uuid NOT NULL REFERENCES courts(id), user_id uuid NOT NULL REFERENCES users(id), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
        CONSTRAINT booking_positive_duration CHECK (ends_at > starts_at),
        CONSTRAINT booking_no_overlap EXCLUDE USING gist (court_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&));
      CREATE INDEX bookings_user_idx ON bookings(user_id);`);
  }
  async down(q: QueryRunner): Promise<void> { await q.query('DROP TABLE bookings; DROP TABLE courts; DROP TABLE venues; DROP TABLE users;'); }
}
