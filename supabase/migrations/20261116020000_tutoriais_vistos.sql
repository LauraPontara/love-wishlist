-- Tutoriais já vistos ficam na conta (não só no aparelho): cada tela mostra o tutorial uma vez por pessoa.
alter table public.profiles add column if not exists tours_seen text[] not null default '{}';
