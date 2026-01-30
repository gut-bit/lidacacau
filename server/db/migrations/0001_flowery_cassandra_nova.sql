ALTER TABLE "work_orders" ADD COLUMN "negotiation_history" jsonb;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "negotiation_status" varchar(20);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "signed_contract" jsonb;