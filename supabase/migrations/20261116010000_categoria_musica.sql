-- Nova categoria "Música" (discos, vinis, instrumentos...).
alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check check (category in (
  'Beleza', 'Cuidados pessoais', 'Comida & doces', 'Roupas',
  'Acessórios', 'Tecnologia', 'Casa', 'Livros & papelaria',
  'Música', 'Experiências', 'Outros'));
