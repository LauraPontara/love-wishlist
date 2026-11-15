-- Itens manuais podem ser cadastrados sem link; links informados continuam validados.
alter table public.items
  alter column url drop not null,
  alter column url_normalized drop not null;

-- Os checks existentes aceitam NULL e continuam rejeitando links inválidos/vazios.
alter table public.items add constraint items_url_presenca_coerente
  check ((url is null) = (url_normalized is null));
