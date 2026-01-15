import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndexesAndGeo1768257504025 implements MigrationInterface {
  name = 'AddSearchIndexesAndGeo1768257504025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await queryRunner.query('ALTER TABLE "parking_lot" ADD COLUMN IF NOT EXISTS "geo_location" geography(Point,4326)');
    await queryRunner.query(
      'UPDATE "parking_lot" SET "geo_location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography WHERE "geo_location" IS NULL AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL'
    );
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_parking_lot_geo" ON "parking_lot" USING GIST ("geo_location")');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_email" ON "user" ("email")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_reservation_parking_lot" ON "reservation" ("parkingLotId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_parking_lot_lat_lng" ON "parking_lot" ("latitude", "longitude")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parking_lot_geo"');
    await queryRunner.query('ALTER TABLE "parking_lot" DROP COLUMN IF EXISTS "geo_location"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_user_email"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_reservation_parking_lot"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parking_lot_lat_lng"');
  }
}
