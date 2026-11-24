# Pendências do Projeto

## Próximas Refatorações
- [x] Implementar formato de "acordeão" nos modais de conceitos e antes das identidades.
- [x] Revisar textos alternativos (alt) das imagens para melhorar acessibilidade.
- [x] Criar e configurar o favicon do site.
- [x] Adicionar legenda descritiva embaixo das imagens (agora vem do JSON).
- [ ] Remover o `!important` do CSS da `.legenda-imagem` e ajustar a especificidade corretamente (dívida técnica).
- [X] Criar página institucional com informações da disciplina, grupo, professora e período.

## Possibilidades Futuras
- [ ] Avaliar a implementação do acordeão nos cards da própria linha do tempo (quando o filtro "Todos" estiver ativo), para evitar rolagem excessiva.
- [ ] Adicionar suporte a imagens (campos `imagem`, `legenda`, `alt`) no `dados.json` (para eventos históricos, ex: Stonewall) e no `conceitos.json` (ex: guarda-chuva Bi+). O código do front-end já está preparado para exibir as imagens caso os campos existam.
