import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedSchema1763329769561 implements MigrationInterface {
    name = 'UpdatedSchema1763329769561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "timestamp"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "reservationId" integer`);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD "totalSpots" integer`);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD "availableSpots" integer`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "parkingLotId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN "pricePerHour"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD "pricePerHour" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_b046318e0b341a7f72110b75857" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_6bb61cbede7c869adde5587f345" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_529dceb01ef681127fef04d755d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_19f3bfece09cc10abf559b77193" FOREIGN KEY ("parkingLotId") REFERENCES "parking_lot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_19f3bfece09cc10abf559b77193"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_529dceb01ef681127fef04d755d"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_6bb61cbede7c869adde5587f345"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_b046318e0b341a7f72110b75857"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN "pricePerHour"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" ADD "pricePerHour" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "parkingLotId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "amount" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN "availableSpots"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN "totalSpots"`);
        await queryRunner.query(`ALTER TABLE "parking_lot" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "reservationId"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "timestamp" TIMESTAMP NOT NULL`);
    }

}
