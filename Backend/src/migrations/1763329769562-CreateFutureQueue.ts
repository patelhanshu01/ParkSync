// NOTE: This migration created the historical "future_queue_entry" table for the deprecated queue feature.
// The queue feature has since been removed from the product; migration is retained only for audit/history.
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFutureQueue1763329769562 implements MigrationInterface {
    name = 'CreateFutureQueue1763329769562'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "future_queue_entry" ("id" SERIAL NOT NULL, "requested_start" TIMESTAMP NOT NULL, "requested_end" TIMESTAMP NOT NULL, "desired_action" character varying NOT NULL DEFAULT 'auto_book_when_free', "position" integer NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "reservationId" integer, "spotId" integer, "lotId" integer, CONSTRAINT "PK_3f7bc9d6d8b18f0a3c2b5d4f7a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" ADD CONSTRAINT "FK_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" ADD CONSTRAINT "FK_reservation" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" ADD CONSTRAINT "FK_spot" FOREIGN KEY ("spotId") REFERENCES "parking_spot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" ADD CONSTRAINT "FK_lot" FOREIGN KEY ("lotId") REFERENCES "parking_lot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "future_queue_entry" DROP CONSTRAINT "FK_lot"`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" DROP CONSTRAINT "FK_spot"`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" DROP CONSTRAINT "FK_reservation"`);
        await queryRunner.query(`ALTER TABLE "future_queue_entry" DROP CONSTRAINT "FK_user"`);
        await queryRunner.query(`DROP TABLE "future_queue_entry"`);
    }
}
