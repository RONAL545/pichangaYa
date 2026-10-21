import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Booking, Court, User, Venue } from '../entities';
import { Core1792530000000 } from './migration';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
export const dataSource = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL,
  entities: [User, Venue, Court, Booking], migrations: [Core1792530000000], synchronize: false });
