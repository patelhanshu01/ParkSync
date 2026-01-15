import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedSchema1763329769561 implements MigrationInterface {
    name = 'UpdatedSchema1763329769561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN IF EXISTS "timestamp"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "userId" integer`);
        await queryRunner.query(`ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "reservationId" integer`);
        await queryRunner.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='parking_lot' AND column_name='name'
    ) THEN
        ALTER TABLE "parking_lot" ADD COLUMN "name" character varying;
    END IF;

    UPDATE "parking_lot" SET "name" = COALESCE("name", 'Unknown');

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='parking_lot' AND column_name='name' AND is_nullable='YES'
    ) THEN
        ALTER TABLE "parking_lot" ALTER COLUMN "name" SET NOT NULL;
    END IF;
END $$;
        `);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD COLUMN IF NOT EXISTS "totalSpots" integer`);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD COLUMN IF NOT EXISTS "availableSpots" integer`);
        await queryRunner.query(`
DO $$
DECLARE col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name='payment' AND column_name='amount';

    IF col_type IS NULL THEN
        ALTER TABLE "payment" ADD COLUMN "amount" numeric(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE "payment" ALTER COLUMN "amount" DROP DEFAULT;
    ELSIF col_type IN ('integer','bigint','smallint') THEN
        ALTER TABLE "payment" ALTER COLUMN "amount" TYPE numeric(10,2) USING "amount"::numeric(10,2);
    END IF;
END $$;
        `);
        await queryRunner.query(`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='reservation' AND column_name='userId' AND is_nullable='NO'
    ) THEN
        ALTER TABLE "reservation" ALTER COLUMN "userId" DROP NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='reservation' AND column_name='parkingLotId' AND is_nullable='NO'
    ) THEN
        ALTER TABLE "reservation" ALTER COLUMN "parkingLotId" DROP NOT NULL;
    END IF;
END $$;
        `);
        await queryRunner.query(`
DO $$
DECLARE col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name='parking_lot' AND column_name='pricePerHour';

    IF col_type IS NULL THEN
        ALTER TABLE "parking_lot" ADD COLUMN "pricePerHour" numeric(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE "parking_lot" ALTER COLUMN "pricePerHour" DROP DEFAULT;
    ELSIF col_type IN ('integer','bigint','smallint') THEN
        ALTER TABLE "parking_lot" ALTER COLUMN "pricePerHour" TYPE numeric(10,2) USING "pricePerHour"::numeric(10,2);
    END IF;
END $$;
        `);
        await queryRunner.query(`
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_b046318e0b341a7f72110b75857') THEN
        ALTER TABLE "payment" ADD CONSTRAINT "FK_b046318e0b341a7f72110b75857" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_6bb61cbede7c869adde5587f345') THEN
        ALTER TABLE "payment" ADD CONSTRAINT "FK_6bb61cbede7c869adde5587f345" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_529dceb01ef681127fef04d755d') THEN
        ALTER TABLE "reservation" ADD CONSTRAINT "FK_529dceb01ef681127fef04d755d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_19f3bfece09cc10abf559b77193') THEN
        ALTER TABLE "reservation" ADD CONSTRAINT "FK_19f3bfece09cc10abf559b77193" FOREIGN KEY ("parkingLotId") REFERENCES "parking_lot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "FK_19f3bfece09cc10abf559b77193"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "FK_529dceb01ef681127fef04d755d"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT IF EXISTS "FK_6bb61cbede7c869adde5587f345"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT IF EXISTS "FK_b046318e0b341a7f72110b75857"`);
        await queryRunner.query(`
DO $$
DECLARE col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name='parking_lot' AND column_name='pricePerHour';

    IF col_type IS NULL THEN
        ALTER TABLE "parking_lot" ADD COLUMN "pricePerHour" integer NOT NULL DEFAULT 0;
        ALTER TABLE "parking_lot" ALTER COLUMN "pricePerHour" DROP DEFAULT;
    ELSIF col_type IN ('numeric','double precision','real') THEN
        ALTER TABLE "parking_lot" ALTER COLUMN "pricePerHour" TYPE integer USING ROUND("pricePerHour")::integer;
    END IF;
END $$;
        `);
        await queryRunner.query(`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='reservation' AND column_name='parkingLotId' AND is_nullable='YES'
    )
    AND NOT EXISTS (SELECT 1 FROM "reservation" WHERE "parkingLotId" IS NULL) THEN
        ALTER TABLE "reservation" ALTER COLUMN "parkingLotId" SET NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='reservation' AND column_name='userId' AND is_nullable='YES'
    )
    AND NOT EXISTS (SELECT 1 FROM "reservation" WHERE "userId" IS NULL) THEN
        ALTER TABLE "reservation" ALTER COLUMN "userId" SET NOT NULL;
    END IF;
END $$;
        `);
        await queryRunner.query(`
DO $$
DECLARE col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name='payment' AND column_name='amount';

    IF col_type IS NULL THEN
        ALTER TABLE "payment" ADD COLUMN "amount" integer NOT NULL DEFAULT 0;
        ALTER TABLE "payment" ALTER COLUMN "amount" DROP DEFAULT;
    ELSIF col_type IN ('numeric','double precision','real') THEN
        ALTER TABLE "payment" ALTER COLUMN "amount" TYPE integer USING ROUND("amount")::integer;
    END IF;
END $$;
        `);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN IF EXISTS "availableSpots"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN IF EXISTS "totalSpots"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN IF EXISTS "name"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN IF EXISTS "reservationId"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN IF EXISTS "userId"`);
        await queryRunner.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='timestamp'
    ) THEN
        ALTER TABLE "payment" ADD COLUMN "timestamp" TIMESTAMP NOT NULL DEFAULT now();
        ALTER TABLE "payment" ALTER COLUMN "timestamp" DROP DEFAULT;
    END IF;
END $$;
        `);
    }

}
