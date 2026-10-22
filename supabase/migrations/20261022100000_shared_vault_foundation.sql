-- Shared-vault foundation: collections gain members (not just an owner),
-- invite links, a per-user active-vault pointer, and record attribution.
-- App-level authorization only — all access goes through the service role,
-- so RLS stays enabled-but-unenforced like the existing tables.

CREATE TABLE "public"."collection_members" (
  "collection_id" uuid                     NOT NULL,
  "user_id"       text                     NOT NULL,
  "role"          text                     NOT NULL DEFAULT 'member',
  "joined_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "collection_members_pkey" PRIMARY KEY (collection_id, user_id),
  CONSTRAINT "collection_members_collection_id_fkey"
    FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE,
  CONSTRAINT "collection_members_role_check"
    CHECK (role IN ('owner', 'member', 'viewer'))
);

ALTER TABLE "public"."collection_members"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX collection_members_user_id_idx
  ON public.collection_members USING btree (user_id);

-- Every existing collection's owner becomes its owner-member.
INSERT INTO public.collection_members (collection_id, user_id, role)
SELECT id, owner_id, 'owner' FROM public.collections;

CREATE TABLE "public"."collection_invites" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "collection_id" uuid                     NOT NULL,
  "inviter_id"    text                     NOT NULL,
  "token"         text                     NOT NULL,
  "status"        text                     NOT NULL DEFAULT 'active',
  "expires_at"    timestamp with time zone NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "collection_invites_pkey" PRIMARY KEY (id),
  CONSTRAINT "collection_invites_token_key" UNIQUE (token),
  CONSTRAINT "collection_invites_collection_id_fkey"
    FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE,
  CONSTRAINT "collection_invites_status_check"
    CHECK (status IN ('active', 'revoked'))
);

ALTER TABLE "public"."collection_invites"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_settings" (
  "user_id"              text NOT NULL,
  "active_collection_id" uuid,
  CONSTRAINT "user_settings_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "user_settings_active_collection_id_fkey"
    FOREIGN KEY (active_collection_id) REFERENCES public.collections(id)
    ON DELETE SET NULL
);

ALTER TABLE "public"."user_settings"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."records" ADD COLUMN "added_by" text;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."collection_members" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."collection_invites" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."user_settings" TO "anon", "authenticated", "postgres", "service_role";
