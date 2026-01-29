CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"job_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"message" text,
	"proposed_terms" jsonb,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"participant_ids" uuid[] NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_message_preview" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cocoa_price_metrics" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"city" varchar(100) NOT NULL,
	"date" timestamp NOT NULL,
	"avg_price" numeric(10, 2) NOT NULL,
	"min_price" numeric(10, 2) NOT NULL,
	"max_price" numeric(10, 2) NOT NULL,
	"submission_count" integer DEFAULT 0,
	"data_source" varchar(50) DEFAULT 'mixed',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cocoa_price_submissions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"buyer_name" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"region" varchar(100) DEFAULT 'Para',
	"price_per_kg" numeric(10, 2) NOT NULL,
	"conditions" text,
	"proof_photo_uri" text,
	"source" varchar(50) DEFAULT 'lidacacau',
	"submitted_by" uuid,
	"submitter_name" varchar(255),
	"submitter_phone" varchar(50),
	"status" varchar(20) DEFAULT 'pending',
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscalization_alerts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"vicinal_id" uuid,
	"user_id" uuid NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"descricao" text,
	"direcao" varchar(100),
	"veiculos" varchar(255),
	"status" varchar(20) DEFAULT 'active',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"expires_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friend_connections" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"requester_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"producer_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"location_text" varchar(255) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"start_date" timestamp,
	"end_date" timestamp,
	"offer" numeric(10, 2) NOT NULL,
	"notes" text,
	"photos" text[],
	"status" varchar(20) DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "occurrence_comments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "occurrences" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'open',
	"vicinal_id" uuid,
	"user_id" uuid NOT NULL,
	"road_id" uuid,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"fotos" text[],
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "petitions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text NOT NULL,
	"occurrence_id" uuid,
	"vicinal_id" uuid,
	"user_id" uuid NOT NULL,
	"fotos" text[],
	"target_signatures" integer DEFAULT 50,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(255) DEFAULT 'Uruara',
	"state" varchar(50) DEFAULT 'PA',
	"area_hectares" numeric(10, 2),
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"polygon_boundary" jsonb,
	"verification_status" varchar(20) DEFAULT 'pending',
	"verified_at" timestamp with time zone,
	"cover_photo_uri" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"reviewer_role" varchar(20) NOT NULL,
	"quality" integer NOT NULL,
	"safety" integer NOT NULL,
	"punctuality" integer NOT NULL,
	"communication" integer NOT NULL,
	"fairness" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roads" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"classification" varchar(20) DEFAULT 'ramal' NOT NULL,
	"coordinates" jsonb NOT NULL,
	"color" varchar(20) DEFAULT '#2563eb',
	"vicinal_id" uuid,
	"trafegabilidade" varchar(20) DEFAULT 'regular',
	"trafegabilidade_detalhe" text,
	"agricultura_principal" varchar(100),
	"comprimento_metros" numeric(12, 2),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"min_level" integer DEFAULT 1,
	"icon" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"petition_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "talhoes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"property_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"area_hectares" numeric(10, 2) NOT NULL,
	"crop_type" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_presence" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_online" boolean DEFAULT false,
	"last_seen_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_presence_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_type" varchar(20) NOT NULL,
	"bio" text,
	"skills" text[],
	"equipment" text[],
	"certifications" text[],
	"availability" varchar(255),
	"preferred_radius" integer DEFAULT 50,
	"total_jobs" integer DEFAULT 0,
	"total_earnings" numeric(12, 2) DEFAULT '0',
	"total_spent" numeric(12, 2) DEFAULT '0',
	"pix_key" varchar(255),
	"pix_key_type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "user_verification" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'none' NOT NULL,
	"document_type" varchar(20),
	"document_photo_uri" text,
	"selfie_photo_uri" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	CONSTRAINT "user_verification_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"location" varchar(255),
	"role" varchar(20) DEFAULT 'worker' NOT NULL,
	"roles" text[] DEFAULT ARRAY['worker'],
	"active_role" varchar(20) DEFAULT 'worker' NOT NULL,
	"avatar" text,
	"cover_photo" text,
	"level" integer DEFAULT 1,
	"producer_level" integer DEFAULT 1,
	"total_reviews" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"producer_reviews" integer DEFAULT 0,
	"producer_rating" numeric(3, 2) DEFAULT '0',
	"tutorial_completed" boolean DEFAULT false,
	"search_radius" integer DEFAULT 50,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vicinais" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"whatsapp_link" text,
	"facebook_link" text,
	"instagram_link" text,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"cidade" varchar(100) DEFAULT 'Uruara',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"job_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"producer_id" uuid NOT NULL,
	"final_price" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'assigned',
	"payment_terms" jsonb,
	"check_in_time" timestamp with time zone,
	"check_in_latitude" numeric(10, 7),
	"check_in_longitude" numeric(10, 7),
	"check_out_time" timestamp with time zone,
	"check_out_latitude" numeric(10, 7),
	"check_out_longitude" numeric(10, 7),
	"photo_before" text,
	"photo_after" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cocoa_price_submissions" ADD CONSTRAINT "cocoa_price_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cocoa_price_submissions" ADD CONSTRAINT "cocoa_price_submissions_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscalization_alerts" ADD CONSTRAINT "fiscalization_alerts_vicinal_id_vicinais_id_fk" FOREIGN KEY ("vicinal_id") REFERENCES "public"."vicinais"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscalization_alerts" ADD CONSTRAINT "fiscalization_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscalization_alerts" ADD CONSTRAINT "fiscalization_alerts_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_connections" ADD CONSTRAINT "friend_connections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_connections" ADD CONSTRAINT "friend_connections_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_producer_id_users_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_comments" ADD CONSTRAINT "occurrence_comments_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_comments" ADD CONSTRAINT "occurrence_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_vicinal_id_vicinais_id_fk" FOREIGN KEY ("vicinal_id") REFERENCES "public"."vicinais"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_road_id_roads_id_fk" FOREIGN KEY ("road_id") REFERENCES "public"."roads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_vicinal_id_vicinais_id_fk" FOREIGN KEY ("vicinal_id") REFERENCES "public"."vicinais"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_users_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roads" ADD CONSTRAINT "roads_vicinal_id_vicinais_id_fk" FOREIGN KEY ("vicinal_id") REFERENCES "public"."vicinais"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roads" ADD CONSTRAINT "roads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_petition_id_petitions_id_fk" FOREIGN KEY ("petition_id") REFERENCES "public"."petitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talhoes" ADD CONSTRAINT "talhoes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_verification" ADD CONSTRAINT "user_verification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_producer_id_users_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;