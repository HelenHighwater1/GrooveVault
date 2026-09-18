CREATE TABLE "public"."collections" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"   text                     NOT NULL,
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "collections_owner_id_key" UNIQUE (owner_id),
  CONSTRAINT "collections_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."collections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."records" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "collection_id"      uuid                     NOT NULL,
  "artist"             text                     NOT NULL,
  "title"              text                     NOT NULL,
  "year"               integer,
  "format"             text,
  "genres"             text[]                   NOT NULL DEFAULT '{}'::text[],
  "styles"             text[]                   NOT NULL DEFAULT '{}'::text[],
  "country"            text,
  "label"              text,
  "catno"              text,
  "cover_image_url"    text,
  "discogs_release_id" bigint,
  "discogs_master_id"  bigint,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "records_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."records"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."records"
  ADD CONSTRAINT "records_collection_id_fkey" FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;

CREATE INDEX records_collection_id_idx ON public.records USING btree (collection_id);

CREATE INDEX records_master_id_idx ON public.records USING btree (collection_id, discogs_master_id)
  WHERE (discogs_master_id IS NOT NULL);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."collections" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."records" TO "anon", "authenticated", "postgres", "service_role";

