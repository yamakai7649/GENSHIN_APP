CREATE TABLE users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sessions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE genshin_accounts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  game_uid varchar(20) NOT NULL,
  region varchar(50) NOT NULL,
  region_name varchar(100),
  nickname varchar(100) NOT NULL,
  adventure_rank smallint NOT NULL,
  game_head_icon text,

  stats jsonb NOT NULL DEFAULT '{}',
  world_explorations jsonb NOT NULL DEFAULT '[]',
  homes jsonb NOT NULL DEFAULT '[]',

  is_default_account boolean NOT NULL DEFAULT false,

  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT genshin_accounts_user_id_game_uid_key
    UNIQUE (user_id, game_uid),

  CONSTRAINT genshin_accounts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX genshin_accounts_one_default_per_user
  ON genshin_accounts (user_id)
  WHERE is_default_account = true;

CREATE TABLE character_masters (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,

  element text NOT NULL,
  rarity smallint NOT NULL,
  weapon_type text NOT NULL,
  region text,
  ascension_stat text,

  icon text,
  image text,

  talent_data jsonb NOT NULL DEFAULT '[]',
  constellation_data jsonb NOT NULL DEFAULT '[]',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE weapon_masters (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  icon text,

  weapon_type text NOT NULL,
  rarity smallint NOT NULL,
  sub_stat_type text,

  acquisition_method text,
  passive_name text,
  passive_effect text,

  ascension_data jsonb NOT NULL DEFAULT '[]',
  release_version text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE account_characters (
  id serial PRIMARY KEY,

  account_id integer NOT NULL,
  character_master_id integer NOT NULL,

  level smallint NOT NULL,
  promote_level smallint NOT NULL DEFAULT 0,
  friendship_level smallint NOT NULL,
  constellation_level smallint NOT NULL,

  displayed_stats jsonb NOT NULL DEFAULT '[]',
  base_stats jsonb NOT NULL DEFAULT '[]',
  extra_stats jsonb NOT NULL DEFAULT '[]',
  elemental_stats jsonb NOT NULL DEFAULT '[]',

  skill_levels jsonb NOT NULL DEFAULT '[]',
  artifacts jsonb NOT NULL DEFAULT '[]',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT account_characters_account_id_character_master_id_key
    UNIQUE (account_id, character_master_id),

  CONSTRAINT account_characters_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES genshin_accounts(id)
    ON DELETE CASCADE,

  CONSTRAINT account_characters_character_master_id_fkey
    FOREIGN KEY (character_master_id)
    REFERENCES character_masters(id)
);

CREATE TABLE account_weapons (
  id serial PRIMARY KEY,

  account_id integer NOT NULL,
  weapon_master_id integer NOT NULL,

  level smallint NOT NULL,
  promote_level smallint NOT NULL DEFAULT 0,
  refinement smallint NOT NULL DEFAULT 1,

  base_attack integer,
  sub_stat_value text,

  equipped_character_id integer UNIQUE,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT account_weapons_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES genshin_accounts(id)
    ON DELETE CASCADE,

  CONSTRAINT account_weapons_weapon_master_id_fkey
    FOREIGN KEY (weapon_master_id)
    REFERENCES weapon_masters(id),

  CONSTRAINT account_weapons_equipped_character_id_fkey
    FOREIGN KEY (equipped_character_id)
    REFERENCES account_characters(id)
    ON DELETE SET NULL
);
