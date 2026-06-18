# 03 Simple Logic Cones and Failing Points — parte A

## Controle do bloco

- **Bloco:** 061
- **Curso:** 09 Formality Foundation
- **Aula:** 03 Simple Logic Cones and Failing Points — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\03 Simple Logic Cones and Failing Points.docx`
- **Faixa processada:** slides 1-15
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\03 Simple Logic Cones and Failing Points_parte_A.md
```

- **Próximo bloco recomendado:** Bloco 062 — `03 Simple Logic Cones and Failing Points - parte B`
- **Próxima faixa:** slides 16-29

---

## Resumo executivo

Esta parte da aula ensina uma forma correta de aprender e depurar o Formality: começar com um design RTL muito pequeno, entender exatamente quantos **compare points** existem, observar como o Formality faz o **match** entre referência e implementação, e depois criar uma diferença funcional simples para ver como a ferramenta separa duas etapas que muita gente confunde: **matching** e **verification**.

A ideia central é que **match não prova equivalência funcional**. O match apenas tenta alinhar pontos correspondentes entre o design de referência e o design de implementação. Já o `verify` é a etapa que tenta provar se os cones lógicos ligados a esses pontos são equivalentes. Por isso, no exemplo da aula, um registrador chamado `z1_reg` pode “casar” perfeitamente pelo nome nos dois designs, mas ainda assim falhar na verificação, porque a lógica que alimenta esse registrador é diferente.

O exemplo base usa um módulo RTL chamado `fred`, com entradas `a`, `b`, `c`, `clk` e saídas registradas `z1`, `z2`. Esse módulo é propositalmente pequeno para que seja possível ver tudo: os flops inferidos, os primary inputs, os primary outputs, os logic cones e os compare points. Depois aparece uma variação `fred2`, onde `z1` passa a depender também de `c`. Essa diferença pequena é suficiente para gerar uma falha de equivalência bem localizada.

---

## Texto extraído e organizado por slide

### Slide 1 — Two Approaches to Learning Formality

Texto extraído:

- **Approach 1: Super Hero**
  - Choose a very large design that is failing.
  - 1 day before tape-out.
  - Make sure you do not really understand Formality and its debug features.
  - Proceed in an ad-hoc but energetic fashion.
- **Approach 2: Recommended**
  - Choose a very small design — where it is obvious what the difference between 2 designs is.
    - i.e. only unknown is how Formality will treat it.
  - Have plenty of time to explore what information Formality can tell you.
  - Then progressively apply that understanding to more challenging situations and designs.

Interpretação:

O slide está contrastando duas posturas. A primeira é a postura “herói desesperado”: tentar aprender Formality em um design grande, falhando, perto do tape-out. Isso é péssimo porque a ferramenta pode estar mostrando muitos sintomas ao mesmo tempo: setup incompleto, black boxes, mismatches reais, problemas de biblioteca, SVF rejeitado, diferenças de nomes, scan não desabilitado etc.

A abordagem recomendada é didática: usar um design pequeno no qual você já sabe a diferença entre referência e implementação. Assim, o aprendizado não é descobrir o bug do design, mas descobrir **como o Formality representa, reporta e depura essa diferença**.

---

### Slide 2 — A simple RTL example

Texto extraído:

- Consider the example in a file `fred.v`.

Código do slide:

```verilog
module fred (a, b, c, clk, z1, z2);
input a, b, c, clk;
output reg z1, z2;

always @(posedge clk)
begin
  z1 <= a & b;
  z2 <= a | c;
end

endmodule
```

Interpretação:

Este é o design mínimo usado para estudar cones lógicos e compare points. Ele possui:

- quatro entradas primárias: `a`, `b`, `c`, `clk`;
- duas saídas registradas: `z1`, `z2`;
- dois registradores inferidos pela síntese/RTL elaboration: `z1_reg` e `z2_reg`;
- duas funções combinacionais:
  - `z1_next = a & b`;
  - `z2_next = a | c`.

Como `z1` e `z2` são declarados como `output reg` e atribuídos dentro de um bloco sensível a `posedge clk`, o Formality interpreta que existem flops/registradores correspondentes a essas saídas.

---

### Slide 3 — Viewing the design schematic

Texto extraído:

- 1) Read into Formality.
- 2) Pull up reference hierarchy browser.
- 3) Select design and view.

Comandos mostrados:

```tcl
read_verilog -r fred.v
set_top fred
```

Elementos visuais do slide:

- A interface mostra o design de referência carregado como `r:/WORK/fred`.
- O menu da hierarquia permite selecionar o design e visualizar o esquemático.

Interpretação:

O `read_verilog -r fred.v` lê o RTL dentro do container de referência, indicado por `-r`. O comando `set_top fred` elabora o design e define `fred` como o módulo de topo. Depois disso, o Formality consegue montar a representação interna do design, incluindo portas, registradores, lógica combinacional e pontos de comparação.

---

### Slide 4 — Viewing the design schematic: How many compare points?

Texto extraído:

- Pergunta do slide: **How many compare points?**

Figura:

O esquemático mostra:

- entradas `a`, `b`, `c`, `clk`;
- uma porta AND alimentando o registrador associado a `z1`;
- uma porta OR alimentando o registrador associado a `z2`;
- dois registradores internos/implícitos;
- saídas `z1` e `z2`.

Resposta conceitual:

Neste exemplo, há **4 compare points principais**:

1. `z1_reg` — registrador inferido para `z1`;
2. `z2_reg` — registrador inferido para `z2`;
3. `z1` — primary output;
4. `z2` — primary output.

As entradas `a`, `b`, `c` e `clk` não são compare points de saída; elas aparecem como **primary inputs** usados para alimentar os logic cones.

---

### Slide 5 — The match results summary

Texto extraído:

Comandos:

```tcl
read_verilog -i fred.v
set_top fred
match
```

Anotações do slide:

- `-i` for implementation.
- We can compare `fred` against itself.
  - Re-read the RTL into the implementation container.
- At the end of match you will get a matching result summary. In this example:
  - 4 compare points.
  - And 4 primary inputs.
- 4 compare points which will be 2 flip-flops and 2 primary outputs.
- 4 Primary inputs: `a`, `b`, `c`, `clk`.

Trecho do resumo mostrado:

```text
Matching Results
4 Compare points matched by name
0 Compare points matched by signature analysis
0 Compare points matched by topology
4 Matched primary inputs, black-box outputs
0(0) Unmatched reference(implementation) compare points
0(0) Unmatched reference(implementation) primary inputs, black-box outputs
```

Interpretação:

Aqui o design `fred.v` é carregado tanto como referência quanto como implementação. Isso é um caso de controle: o design está sendo comparado contra ele mesmo. Logo, espera-se que tudo case e passe.

O `match` encontra:

- 4 compare points casados por nome;
- 4 primary inputs casados;
- nenhum compare point sem match;
- nenhum primary input sem match.

A mensagem “matched by name” é importante: o Formality não precisou usar análise estrutural avançada nem signature analysis. Como os dois designs são o mesmo RTL, os nomes coincidem naturalmente.

---

### Slide 6 — The match results summary, reforço visual

O slide repete a mesma ideia do slide anterior, reforçando os dois números importantes:

- **4 compare points:** os dois registradores e as duas saídas primárias.
- **4 primary inputs:** `a`, `b`, `c`, `clk`.

Análise da figura:

A figura destaca que o match summary não é apenas uma mensagem de sucesso genérica. Ele informa a quantidade de objetos que foram alinhados. Em projetos reais, esse resumo é uma das primeiras coisas a verificar. Se o número de compare points não faz sentido, pode haver:

- design errado carregado;
- top errado;
- biblioteca faltando;
- black boxes inesperadas;
- SVF não aplicado corretamente;
- lógica de scan, clock-gating ou boundary scan ainda ativa;
- diferença estrutural não esperada entre referência e implementação.

---

### Slide 7 — Details of matching results

Texto extraído:

Comandos:

```tcl
report_matched_points
report_unmatched_points
```

Explicação do slide:

- The command `report_matched_points` will give the details of what has matched.
  - Many useful switches.
- Similarly, `report_unmatched_points` will give details of what remains unmatched.
- Typically for larger examples one redirects the reports to a file.

Exemplo:

```tcl
match
report_unmatched_points > unmatched.rpt
```

Interpretação:

O resumo do `match` diz quantos pontos casaram. Os comandos de relatório dizem **quais** pontos casaram ou não casaram.

Em projeto grande, não é prático ler tudo no terminal. Por isso o slide recomenda redirecionar para arquivo:

```tcl
report_unmatched_points > unmatched.rpt
```

Isso é especialmente útil quando há milhares de compare points. Em vez de tentar ler tudo no transcript, você gera um relatório e procura padrões de falha: todos os pontos de um bloco, todos os flops de scan, todos os nomes com prefixo alterado, todos os pontos de uma memória black box etc.

---

### Slide 8 — Example: The 4 compare points

Texto extraído:

Comando:

```tcl
report_matched_points -point_type DFF -point_type output
```

Notas:

- Registers have been given the name `<RTL_name>_reg`.
- Here everything has matched by name.

Trecho mostrado:

```text
4 Matched points:

Ref  DFF   Name(Last) r:/WORK/fred/z1_reg
Impl DFF   Name(Last) i:/WORK/fred/z1_reg

Ref  DFF   Name(Last) r:/WORK/fred/z2_reg
Impl DFF   Name(Last) i:/WORK/fred/z2_reg

Ref  Port  Name(Last) r:/WORK/fred/z1
Impl Port  Name(Last) i:/WORK/fred/z1

Ref  Port  Name(Last) r:/WORK/fred/z2
Impl Port  Name(Last) i:/WORK/fred/z2
```

Interpretação:

O comando filtra os compare points para mostrar apenas:

- DFFs;
- outputs.

O relatório confirma os quatro compare points esperados:

- `z1_reg`;
- `z2_reg`;
- `z1`;
- `z2`.

A convenção `<RTL_name>_reg` é importante. Como `z1` e `z2` são registradas em RTL, a ferramenta cria nomes internos como `z1_reg` e `z2_reg`. Em equivalence checking, entender esses nomes evita confundir a saída primária `z1` com o flop interno `z1_reg`.

---

### Slide 9 — Other examples on fred.v

Texto extraído e comandos:

```tcl
report_matched_points -point_type input
```

Anotação:

- All matched input ports.

Outro comando:

```tcl
report_matched_points r:/WORK/fred/z1_reg
```

Anotação:

- The matched objects in the logic cone of `r:/WORK/fred/z1_reg`.
- `c` not in logic cone of `z1_reg`.

Outro comando:

```tcl
report_matched_points r:/WORK/fred/z1
```

Anotação:

- The matched objects in the logic cone of `r:/WORK/fred/z1`.

Interpretação:

Este slide mostra que `report_matched_points` não serve apenas para listar compare points globais. Ele também pode ser usado para investigar o cone lógico de um ponto específico.

Para `z1_reg`, o cone lógico depende de:

```verilog
z1 <= a & b;
```

Logo, os inputs relevantes são `a`, `b` e `clk`. O sinal `c` não participa da lógica de `z1_reg`, por isso o slide destaca que `c` não está no cone lógico de `z1_reg`.

Essa distinção é essencial: o Formality analisa cada compare point pelo conjunto de sinais que realmente pode afetar aquele ponto. Um sinal pode existir no design, mas não fazer parte do cone de um compare point específico.

---

### Slide 10 — The verification results summary

Texto extraído:

Comando:

```tcl
verify
```

Explicação do slide:

- At the end of `verify` you will get a verification results summary.
- In this example:
  - Verification succeeds as one would expect.
- 2 passing primary output ports: `z1`, `z2`.
- 2 passing flip-flops: `z1_reg`, `z2_reg`.
- The `verify` command returns `1` when passes.

Resumo mostrado:

```text
Verification SUCCEEDED

Reference design:      r:/WORK/fred
Implementation design: i:/WORK/fred
4 Passing compare points

Matched Compare Points
Passing (equivalent):      Port 2, DFF 2, TOTAL 4
Failing (not equivalent):  Port 0, DFF 0, TOTAL 0
```

Interpretação:

O `verify` é a etapa que prova a equivalência funcional dos compare points casados. Como referência e implementação são o mesmo design, todos os pontos passam:

- os dois outputs `z1` e `z2`;
- os dois flops `z1_reg` e `z2_reg`.

O detalhe do retorno `1` é útil para scripts automatizados: um script Tcl pode usar esse retorno para decidir se o fluxo passou ou falhou.

---

### Slide 11 — Reforço do verification results summary

Este slide repete a leitura do resumo de verificação, reforçando a separação entre:

- **Port:** primary output compare points;
- **DFF:** register compare points;
- **TOTAL:** soma dos compare points verificados.

Ponto didático:

O relatório de verificação não deve ser lido apenas como “SUCCEEDED” ou “FAILED”. É importante olhar quantos pontos passaram, quantos falharam e quais tipos de pontos estão envolvidos. Um design pode ter muitos pontos passando e poucos falhando; esses poucos pontos guiam o debug.

---

### Slide 12 — Details of verification results

Texto extraído:

Comandos:

```tcl
report_passing_points
report_failing_points
```

Explicação:

- The command `report_passing_points` will give the details of what compare points have passed.
- Similarly, `report_failing_points` will give details of what compare points have failed.

Trecho mostrado:

```text
4 Passing compare points:

Ref  DFF   r:/WORK/fred/z1_reg
Impl DFF   i:/WORK/fred/z1_reg

Ref  DFF   r:/WORK/fred/z2_reg
Impl DFF   i:/WORK/fred/z2_reg

Ref  Port  r:/WORK/fred/z1
Impl Port  i:/WORK/fred/z1

Ref  Port  r:/WORK/fred/z2
Impl Port  i:/WORK/fred/z2
```

Interpretação:

Depois do `verify`, os comandos mais úteis são:

```tcl
report_passing_points
report_failing_points
```

Eles são o equivalente, para verificação, aos relatórios de match. Em debug real, `report_failing_points` é geralmente mais importante, pois mostra exatamente quais compare points não provaram equivalência.

---

### Slide 13 — A simple RTL example comparison: Expecting Failure

Texto extraído:

- Consider the example `fred` in `fred.v` and `fred2` in `fred2.v`.
- Note that `c` is driving `z1_reg` in `fred2` but not in `fred`.
- Would expect `z1_reg` to fail verification.
- Anotação: `z1 register functionally different`.

Código reconstruído do slide:

Referência `fred`:

```verilog
module fred (a, b, c, clk, z1, z2);
input a, b, c, clk;
output reg z1, z2;

always @(posedge clk)
begin
  z1 <= a & b;
  z2 <= a | c;
end

endmodule
```

Implementação `fred2`:

```verilog
module fred2 (a, b, c, clk, z1, z2);
input a, b, c, clk;
output reg z1, z2;

always @(posedge clk)
begin
  z1 <= a & b & c;
  z2 <= a | c;
end

endmodule
```

Interpretação:

Aqui a aula introduz uma falha proposital. O design `fred2` altera apenas a lógica de `z1`:

```verilog
// fred
z1 <= a & b;

// fred2
z1 <= a & b & c;
```

A lógica de `z2` permanece igual:

```verilog
z2 <= a | c;
```

Portanto, a expectativa é:

- `z1_reg` deve falhar;
- `z1` provavelmente também será afetado por depender de `z1_reg`;
- `z2_reg` deve passar;
- `z2` deve passar.

O ponto principal é que agora existe uma diferença funcional real, não apenas diferença de nome ou de estrutura.

---

### Slide 14 — The match results summary para `fred` versus `fred2`

Texto extraído:

Script mostrado:

```tcl
read_verilog -r fred.v
set_top fred
read_verilog -i fred2.v
set_top fred2
match
```

Anotação do slide:

- Matching looks clean.

Resumo mostrado:

```text
4 Compare points matched by name
0 Compare points matched by signature analysis
0 Compare points matched by topology
4 Matched primary inputs, black-box outputs
0(0) Unmatched reference(implementation) compare points
0(0) Unmatched reference(implementation) primary inputs, black-box outputs
```

Comentário destacado:

```text
z1_reg straightforwardly matches by name

z1_reg obviously functional different but matches: why?
It is not the purpose of match to verify functionality.
That is left to verify.
```

Interpretação:

Esse é um dos slides mais importantes da aula.

Mesmo que `z1_reg` tenha função diferente nos dois designs, ele ainda pode casar perfeitamente por nome:

```text
r:/WORK/fred/z1_reg
i:/WORK/fred2/z1_reg
```

O `match` não pergunta: “essas duas funções booleanas são iguais?”. Ele pergunta: “esses dois pontos parecem ser os pontos correspondentes entre referência e implementação?”. Como os nomes e a estrutura geral são compatíveis, o match fica limpo.

A prova funcional fica para a etapa seguinte:

```tcl
verify
```

Essa separação evita uma confusão muito comum:

- **Match limpo** não significa que o design passou.
- **Match limpo** significa apenas que o Formality conseguiu alinhar os pontos que serão comparados.
- A equivalência funcional só é decidida no `verify`.

---

### Slide 15 — Encerramento da parte A: o ponto casou, mas ainda pode falhar

A última ideia desta parte é a preparação para a parte B: depois de um match limpo entre `fred` e `fred2`, o próximo passo é verificar a equivalência.

A expectativa conceitual é:

- o match vai casar `z1_reg` por nome;
- o verify vai detectar que a função de `z1_reg` é diferente;
- a falha ocorrerá quando `a = 1`, `b = 1` e `c = 0`, porque:
  - em `fred`: `z1 = a & b = 1 & 1 = 1`;
  - em `fred2`: `z1 = a & b & c = 1 & 1 & 0 = 0`.

Essa análise será desenvolvida na parte B, onde entram a janela de padrões, `report_failing_points`, `analyze_points`, logic cones e probe points.

---

## Aula didática desenvolvida

### 1. Por que começar com um design pequeno

O Formality é uma ferramenta poderosa, mas pode ser difícil de interpretar quando o primeiro contato acontece em um projeto real grande. Em um SoC ou bloco industrial, uma falha de verificação pode ser causada por muitos fatores:

- diferença funcional verdadeira;
- setup incompleto;
- biblioteca errada;
- top incorreto;
- scan enable não fixado;
- black box não casada;
- clock-gating sem setup;
- diferenças de nomes;
- SVF ausente ou rejeitado;
- transformação de síntese difícil de provar.

Por isso o slide inicial recomenda começar com um exemplo microscópico. O módulo `fred` é pequeno o bastante para que o aluno saiba, antes de rodar a ferramenta, qual deveria ser o resultado correto. Isso transforma o Formality em objeto de estudo: você consegue observar como a ferramenta organiza o design, quais mensagens imprime, quais pontos cria e como reporta sucesso/falha.

---

### 2. O módulo `fred` e seus compare points

O código base é:

```verilog
module fred (a, b, c, clk, z1, z2);
input a, b, c, clk;
output reg z1, z2;

always @(posedge clk)
begin
  z1 <= a & b;
  z2 <= a | c;
end

endmodule
```

Como `z1` e `z2` são atribuídos em `posedge clk`, o Formality infere dois registradores:

```text
z1_reg
z2_reg
```

E como `z1` e `z2` são saídas do módulo, elas também aparecem como primary outputs.

Assim, no exemplo, os compare points principais são:

| Tipo | Compare point | Origem |
|---|---|---|
| DFF | `z1_reg` | registrador inferido de `z1` |
| DFF | `z2_reg` | registrador inferido de `z2` |
| Port | `z1` | saída primária |
| Port | `z2` | saída primária |

Já as entradas:

```text
a, b, c, clk
```

são primary inputs. Elas precisam ser casadas entre referência e implementação, mas não são o mesmo tipo de compare point final que `z1_reg`, `z2_reg`, `z1` e `z2`.

---

### 3. Logic cone: função lógica que alimenta um compare point

Um **logic cone** é a lógica combinacional que alimenta um compare point.

Para `z1_reg`, a função é:

```text
z1_next = a & b
```

Portanto, o cone de `z1_reg` inclui:

- `a`;
- `b`;
- lógica AND;
- clock como controle do registrador.

O sinal `c` existe no design, mas não faz parte do cone de `z1_reg`, porque não influencia `z1`.

Para `z2_reg`, a função é:

```text
z2_next = a | c
```

Logo, o cone de `z2_reg` inclui:

- `a`;
- `c`;
- lógica OR;
- clock como controle do registrador.

Essa separação por cone é o fundamento da verificação formal de equivalência. Em vez de provar o design inteiro como um bloco gigante, o Formality quebra a verificação por compare points e tenta provar a equivalência dos cones associados a cada par.

---

### 4. A diferença entre match e verify

Esta parte da aula constrói uma distinção essencial:

```text
match  ≠  verify
```

O `match` alinha pontos correspondentes:

```text
r:/WORK/fred/z1_reg  ↔  i:/WORK/fred/z1_reg
r:/WORK/fred/z2_reg  ↔  i:/WORK/fred/z2_reg
r:/WORK/fred/z1      ↔  i:/WORK/fred/z1
r:/WORK/fred/z2      ↔  i:/WORK/fred/z2
```

O `verify` prova se a função desses pares é igual.

Por isso, no primeiro teste, quando `fred` é comparado contra ele mesmo, o match é limpo e o verify passa.

No segundo teste, quando `fred` é comparado contra `fred2`, o match ainda é limpo, mas isso não prova nada sobre a função. O `z1_reg` casa pelo nome, mas a função é diferente:

```text
fred:  z1 = a & b
fred2: z1 = a & b & c
```

O match diz: “estes pontos correspondem”. O verify diz: “estes pontos são ou não funcionalmente equivalentes”.

---

### 5. Lendo o match summary

O match summary mostrado na aula é:

```text
4 Compare points matched by name
0 Compare points matched by signature analysis
0 Compare points matched by topology
4 Matched primary inputs, black-box outputs
0(0) Unmatched reference(implementation) compare points
0(0) Unmatched reference(implementation) primary inputs, black-box outputs
```

Interpretação linha por linha:

- **4 Compare points matched by name:** todos os compare points foram casados por nome. Esse é o caso mais simples.
- **0 matched by signature analysis:** não foi necessário usar uma análise mais sofisticada para casar pontos.
- **0 matched by topology:** não foi necessário usar topologia estrutural.
- **4 Matched primary inputs:** `a`, `b`, `c`, `clk` foram alinhados.
- **0 unmatched compare points:** nenhum ponto ficou sem par.
- **0 unmatched primary inputs:** nenhuma entrada ficou sem correspondência.

Esse é o resultado ideal para um exemplo pequeno.

---

### 6. Relatórios de match

Os comandos principais são:

```tcl
report_matched_points
report_unmatched_points
```

Para filtrar tipos específicos:

```tcl
report_matched_points -point_type DFF -point_type output
```

Para redirecionar relatório para arquivo:

```tcl
report_unmatched_points > unmatched.rpt
```

Em projeto grande, esse redirecionamento é praticamente obrigatório. Um relatório de unmatched points pode ser enorme, e geralmente o trabalho do engenheiro é procurar padrões: todos os pontos de certo bloco, todos com determinado prefixo, todos vindos de uma memória, todos relacionados a scan etc.

---

### 7. O primeiro verify: `fred` contra `fred`

Depois de carregar o mesmo RTL como referência e implementação, o comando:

```tcl
verify
```

deve produzir sucesso.

O resumo esperado é:

```text
Verification SUCCEEDED
4 Passing compare points
```

Com a divisão:

```text
2 Port
2 DFF
```

Ou seja:

- `z1` passa;
- `z2` passa;
- `z1_reg` passa;
- `z2_reg` passa.

Esse caso serve como baseline. Antes de criar uma falha, você verifica que o fluxo básico funciona.

---

### 8. A falha proposital: `fred` contra `fred2`

A segunda comparação troca a implementação:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred2.v
set_top fred2

match
```

A mudança no código é:

```verilog
// fred
z1 <= a & b;

// fred2
z1 <= a & b & c;
```

Essa diferença cria uma condição de falha:

| a | b | c | fred `z1` | fred2 `z1` |
|---|---|---|---|---|
| 1 | 1 | 0 | 1 | 0 |

Portanto, a equivalência de `z1_reg` deve falhar.

Mas o match continua limpo, porque o nome do registrador ainda casa. Isso mostra por que não se deve interpretar match limpo como aprovação funcional.

---

## Conceitos difíceis explicados em profundidade

### Compare point

Um compare point é um ponto de referência usado pelo Formality para comparar os dois designs. Em geral, compare points são:

- registradores;
- latches;
- primary outputs;
- entradas de black boxes.

No exemplo, os compare points são:

```text
z1_reg
z2_reg
z1
z2
```

O compare point é como o “pixel” da analogia com imagens: em vez de comparar o design inteiro de uma vez, a ferramenta divide em pontos e compara a função de cada ponto.

---

### Logic cone

Logic cone é o conjunto de lógica que determina o valor de um compare point.

Para `z1_reg` em `fred`:

```text
cone(z1_reg) = a & b
```

Para `z1_reg` em `fred2`:

```text
cone(z1_reg) = a & b & c
```

Esses cones são diferentes. O Formality vai detectar que existe pelo menos um estímulo em que os dois cones produzem valores diferentes.

---

### Match

O `match` tenta encontrar correspondência entre compare points da referência e da implementação.

Exemplo:

```text
r:/WORK/fred/z1_reg  ↔  i:/WORK/fred2/z1_reg
```

O match pode ser feito por:

- nome;
- signature analysis;
- topologia;
- regras manuais;
- SVF/guidance.

Nesta parte da aula, o match por nome é suficiente.

---

### Verify

O `verify` tenta provar a equivalência funcional dos compare points casados.

Se todos os pontos forem equivalentes:

```text
Verification SUCCEEDED
```

Se algum ponto não for equivalente:

```text
Verification FAILED
```

O `verify` é a etapa matemática. Ele não depende de vetores manuais de teste; ele procura contraexemplos automaticamente.

---

### Counterexample

Um counterexample é uma combinação de entradas que prova que dois pontos não são equivalentes.

No caso:

```text
fred:  z1 = a & b
fred2: z1 = a & b & c
```

Um contraexemplo é:

```text
a = 1
b = 1
c = 0
```

Porque:

```text
fred  = 1 & 1     = 1
fred2 = 1 & 1 & 0 = 0
```

A parte B entra mais diretamente nessa análise usando Pattern Window.

---

### Por que `c` não aparece no cone de `z1_reg` em `fred`

No design original:

```verilog
z1 <= a & b;
```

`c` não influencia `z1`. Logo, mesmo que `c` exista como primary input do módulo, ele não aparece no cone lógico de `z1_reg`.

Isso é importante porque, ao depurar uma falha, o Formality mostra quais sinais realmente participam do cone. Um sinal que não está no cone não pode ser causa direta daquele compare point.

---

## Figuras, diagramas e waveforms importantes

### Figura do esquemático de `fred`

A figura mostra os inputs `a`, `b`, `c`, `clk`, uma porta AND para `z1`, uma porta OR para `z2` e dois registradores. Ela deve ser estudada como mapa visual dos compare points.

A pergunta “How many compare points?” deve ser respondida olhando para os pontos observáveis/registrados:

- dois registradores;
- duas saídas.

Total: quatro compare points.

---

### Figura do match summary

A figura do match summary mostra que o Formality casou quatro compare points por nome. O destaque visual é importante porque mostra que o match pode parecer perfeito mesmo antes da verificação funcional.

---

### Figura do relatório `report_matched_points`

A figura mostra os pares:

```text
r:/WORK/fred/z1_reg ↔ i:/WORK/fred/z1_reg
r:/WORK/fred/z2_reg ↔ i:/WORK/fred/z2_reg
r:/WORK/fred/z1     ↔ i:/WORK/fred/z1
r:/WORK/fred/z2     ↔ i:/WORK/fred/z2
```

Ela ensina como ler os nomes completos dos objetos no Formality:

```text
container:/library/design/object
```

Exemplo:

```text
r:/WORK/fred/z1_reg
```

Significa:

- `r` = reference container;
- `WORK` = biblioteca padrão;
- `fred` = design;
- `z1_reg` = objeto.

---

### Figura de `fred` versus `fred2`

A figura compara os dois códigos e destaca que `c` foi adicionado à expressão de `z1` na implementação. Essa é a diferença funcional que será detectada pelo `verify`.

---

## Pontos de prova e revisão

1. **Compare point** é o ponto usado pelo Formality para comparar referência e implementação.
2. Compare points comuns incluem registradores, latches, primary outputs e entradas de black boxes.
3. No módulo `fred`, existem quatro compare points principais: `z1_reg`, `z2_reg`, `z1`, `z2`.
4. Inputs como `a`, `b`, `c` e `clk` são primary inputs, não os compare points finais principais do exemplo.
5. **Logic cone** é a lógica combinacional que alimenta um compare point.
6. `z1_reg` em `fred` depende de `a` e `b`, mas não de `c`.
7. O comando `match` alinha compare points; ele não prova equivalência funcional.
8. O comando `verify` prova equivalência funcional.
9. Um match limpo pode ocorrer mesmo quando há diferença funcional.
10. `report_matched_points` mostra os pontos que casaram.
11. `report_unmatched_points` mostra os pontos que não casaram.
12. `report_passing_points` mostra os pontos que passaram no verify.
13. `report_failing_points` mostra os pontos que falharam no verify.
14. Em `fred2`, `z1 <= a & b & c` deve causar falha em relação a `fred`, onde `z1 <= a & b`.
15. A condição `a=1`, `b=1`, `c=0` diferencia os dois designs para `z1`.

---

## Relação com projeto/laboratório

Esta aula prepara o uso prático do Formality em scripts e GUI. Em laboratório, o fluxo básico será:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred2.v
set_top fred2

match
verify
```

E, para investigação:

```tcl
report_matched_points
report_unmatched_points
report_passing_points
report_failing_points
```

O aprendizado principal para projeto real é: primeiro verifique se o match faz sentido; depois verifique se as falhas são funcionais ou se são sintomas de setup. Um erro comum é ir direto para o debug da lógica sem antes confirmar se os compare points estão corretamente casados.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código e comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

- **Bloco:** 062
- **Aula:** 03 Simple Logic Cones and Failing Points — parte B
- **Arquivo para anexar:** mesmo arquivo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\03 Simple Logic Cones and Failing Points.docx
```

- **Processar somente:** slides 16-29
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\03 Simple Logic Cones and Failing Points_parte_B.md
```
