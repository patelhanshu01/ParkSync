import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSavedCards1768416647000 implements MigrationInterface {
  name = 'CreateSavedCards1768416647000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_card" (
        "id" SERIAL PRIMARY KEY,
        "brand" character varying NOT NULL,
        "last4" character varying(4) NOT NULL,
        "expMonth" integer NOT NULL,
        "expYear" integer NOT NULL,
        "cardholder" character varying,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" integer NOT NULL
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_saved_card_user" ON "saved_card" ("userId")');
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_saved_card_user'
        ) THEN
          ALTER TABLE "saved_card"
          ADD CONSTRAINT "FK_saved_card_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "saved_card" DROP CONSTRAINT IF EXISTS "FK_saved_card_user"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_saved_card_user"');
    await queryRunner.query('DROP TABLE IF EXISTS "saved_card"');
  }
}
