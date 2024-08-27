CREATE TABLE public.users (
    id SERIAL NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by INTEGER,
    PRIMARY KEY(id)
);

INSERT INTO public.users ("name") VALUES
  ('user1'),
  ('user2');

CREATE TABLE public.article (
  id SERIAL NOT NULL,
  title text NOT NULL,
  user_id INTEGER NOT NULL,
  PRIMARY KEY(id)
);

ALTER TABLE public.article
    ADD CONSTRAINT article_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

CREATE TABLE public.todo (
  id SERIAL PRIMARY KEY,
  task text NOT NULL,
  completed boolean NOT NULL,
  user_id INTEGER NOT NULL
);

ALTER TABLE public.todo
    ADD CONSTRAINT todo_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

CREATE TABLE public.data_types (
  "bit" bit,
  "bool" bool,
  "bpchar" bpchar,
  "char" char,
  "date" date,
  "float4" float4,
  "float8" float8,
  "int2" int2,
  "int4" int4,
  "int8" int8,
  "numeric" numeric,
  "text" text,
  "time" time,
  "timestamp" timestamp,
  "timestamptz" timestamptz,
  "timetz" timetz,
  "uuid" uuid,
  "varchar" varchar
);