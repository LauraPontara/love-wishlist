-- O mesmo link pode aparecer em mais de um item do mesmo dono: há lojas em que o
-- link não indica a variação (ex.: paletas de sombra), então a pessoa cadastra
-- uma opção por item, mudando só a foto e a descrição.
alter table public.items drop constraint if exists items_owner_url_unico;
