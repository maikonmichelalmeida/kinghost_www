# Site Local - Conhecimento RTL

Entrada principal:

```text
C:\Users\maiko\OneDrive\Desktop\kinghost\aulas2\index.html
```

Este site funciona localmente, sem servidor.

## Regra de atualizacao

Para cada bloco processado:

1. Manter a base `.md` em `aulas2\assets\md_normalizado`.
2. Selecionar apenas as imagens mais importantes dos slides.
3. Copiar as imagens para `aulas2\assets\img`.
4. Criar ou atualizar a pagina HTML da aula.
5. Atualizar a pagina do curso.
6. Atualizar links de anterior/proxima quando houver continuidade.

## Estrutura

```text
aulas2
  index.html
  assets
    css
      style.css
    js
      app.js
    img
    md_normalizado
  cursos
    01_verilog_refresher
      index.html
      bloco_1_1_introducao_e_sintese.html
```

## Papel do site

O Markdown em `assets\md_normalizado` continua sendo a base completa de conhecimento.

O site é a versão estudável, com curadoria visual e navegação.
