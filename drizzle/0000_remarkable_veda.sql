CREATE TABLE "clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"qty" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
