# 01 SystemVerilog for RTL Design — parte B

## Controle do bloco

- **Bloco:** 028
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx`
- **Faixa processada conforme roteiro:** slides/prints **26-50**
- **Ponto de início aplicado:** `Binary Encoded FSM Example`
- **Ponto de parada aplicado:** `C-like mechanism` com exemplo inicial de `union`
- **Conteúdo não processado neste bloco:** a partir do slide/print 51, que pertence à **parte C**
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_B.md`
- **Próximo bloco recomendado:** 029 — `01 SystemVerilog for RTL Design - parte C`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das imagens do arquivo.  
> Observação adicional: esta parte continua diretamente a parte A. A parte A parou em `SystemVerilog Enumerated Variables`; a parte B começa aplicando `enum` em FSMs e depois avança para `x`, operadores wildcard, `case`, tri-state, arrays, `struct` e início de `union`.

---

## Resumo executivo

Esta parte aprofunda o uso de **SystemVerilog para RTL sintetizável**, com foco em:

```text
FSMs com enum
codificação binária de estados
codificação one-hot
unique case
unique0 case
efeitos de QoR
x como unknown, não como don't care
operadores ==? e !=?
case inside
casex e casez
tri-state
arrays packed e unpacked
struct packed e unpacked
início de union
```

O primeiro tema é o uso de `enum` em máquinas de estado. O curso mostra que, se o tipo base do enum não é especificado, ele assume `int`. Isso pode gerar problemas de síntese, porque a FSM passa a ter largura maior que a necessária. No exemplo, a ferramenta infere latches para `nxt` e `dout`, porque nem todos os valores possíveis do tipo foram cobertos.

Depois, o bloco compara estilos de codificação de FSM:

```text
binary
one-hot com case binário
one-hot com case (1'b1)
```

e mostra como `unique`, `unique0` e o estilo de codificação afetam QoR — Quality of Results — em:

```text
cell count
timing
area
nets
```

A aula também reforça um ponto muito importante:

```text
x em SystemVerilog representa unknown, não don't care.
```

Isso vale para simulação e, no enquadramento mostrado pelo slide, também para síntese em comparações comuns. Para expressar wildcard/don't-care em comparação, SystemVerilog introduz os operadores:

```systemverilog
==?
!=?
```

Esses operadores tratam `x`, `z` e `?` no **operando da direita** como wildcards, desde que o operando da direita seja constante.

A parte final trata de estruturas de dados:

```text
arrays packed e unpacked
dynamic arrays, queues e associative arrays
struct packed
struct unpacked
union
```

O ponto principal para RTL é distinguir o que é útil e sintetizável de forma comum:

```text
arrays fixos packed/unpacked
structs packed/unpacked
```

daquilo que aparece como recurso mais voltado à simulação:

```text
dynamic arrays
queues
associative arrays
```

---

## Texto extraído e organizado por slide

### Slide 26 — Binary Encoded FSM Example

O slide mostra uma máquina de estados usando `enum`.

Código reconstruído:

```systemverilog
// Binary encode three machine states
typedef enum {IDLE, INIT, START} state_enum;

state_enum st, nxt;

always_comb begin // state transition logic
  case (st)
    IDLE:  if (select) nxt = INIT;
    INIT:  begin dout = 1'b1; nxt = START; end
    START: dout = 1'b0;
  endcase
end

always_ff @(posedge clk, negedge rstN) begin
  if (!rstN) st <= IDLE;
  else       st <= nxt;
end
```

O slide destaca três partes:

```text
Enum variable creation
Binary state coding style
State register
```

### Interpretação

Esse é um exemplo clássico de FSM em SystemVerilog:

```text
state_enum st, nxt;
```

- `st` é o estado atual.
- `nxt` é o próximo estado.
- `always_comb` calcula transições e saídas.
- `always_ff` registra o estado na borda de clock.

A intenção é boa, mas o código tem armadilhas.

Primeira armadilha:

```systemverilog
typedef enum {IDLE, INIT, START} state_enum;
```

Quando a largura do enum não é especificada, o tipo base padrão é `int`.

Isso significa que, em vez de uma FSM pequena de 2 bits, o tipo pode ser tratado como um inteiro de 32 bits. O slide seguinte mostra as consequências.

Segunda armadilha: nem `nxt` nem `dout` recebem valor em todos os caminhos.

Exemplo:

```systemverilog
IDLE: if (select) nxt = INIT;
```

Se `st == IDLE` e `select == 0`, `nxt` não recebe valor.

Em lógica combinacional, isso pode inferir latch.

---

### Slide 27 — Binary Encoded FSM Example: por que latches?

O slide reforça:

```text
Unspecified value data type defaults to int
```

Tradução:

```text
Tipo de dado de valor não especificado assume int por padrão.
```

A tabela de síntese mostra:

```text
Inferred memory devices in process ...
nxt_reg   Latch   Width 32
dout_reg  Latch   Width 1
```

O balão pergunta:

```text
Why latches?
```

### Interpretação

A ferramenta inferiu latch por dois motivos principais.

#### 1. Enum sem largura virou `int`

O enum:

```systemverilog
typedef enum {IDLE, INIT, START} state_enum;
```

não tem tipo base explícito. O curso mostra que ele assume `int`.

Então `st` e `nxt` podem ter largura de 32 bits.

Mas o `case` cobre apenas:

```text
IDLE
INIT
START
```

O tipo possui muitos outros valores possíveis.

Logo, a ferramenta não consegue concluir que todos os valores foram cobertos.

#### 2. Saídas não são atribuídas em todos os caminhos

No `always_comb`, `nxt` e `dout` não têm valor default.

Forma mais segura:

```systemverilog
typedef enum logic [1:0] {IDLE, INIT, START} state_enum;

state_enum st, nxt;

always_comb begin
  nxt  = st;
  dout = 1'b0;

  case (st)
    IDLE:  if (select) nxt = INIT;
    INIT:  begin dout = 1'b1; nxt = START; end
    START: begin dout = 1'b0; nxt = IDLE; end
    default: begin nxt = IDLE; dout = 1'b0; end
  endcase
end
```

A regra prática é:

```text
em always_comb, atribua valores default antes do case.
em enum para FSM, declare largura explícita.
```

---

### Slide 28 — State Machine Coding Styles and Effects of Switches

O slide lista três formas comuns de codificação de FSM:

```text
Binary
One-hot (binary case)
One-hot
```

Também introduz:

```text
unique case and unique0 case effects on these coding styles
```

### Interpretação

A aula vai comparar estilos de FSM e como as palavras-chave `unique` e `unique0` afetam a síntese.

#### Binary

Cada estado é codificado com um número binário compacto.

Exemplo com 5 estados:

```text
IDLE  = 000
INIT  = 001
START = 010
WORK  = 011
END   = 100
```

Vantagem:

```text
menos flip-flops
```

Desvantagem:

```text
decodificação pode exigir mais lógica combinacional
```

#### One-hot

Cada estado usa um bit próprio. Só um bit deve estar em 1.

Exemplo com 5 estados:

```text
IDLE  = 00001
INIT  = 00010
START = 00100
WORK  = 01000
END   = 10000
```

Vantagem:

```text
decodificação simples
```

Desvantagem:

```text
mais flip-flops
```

#### One-hot com binary case

Os estados são codificados one-hot, mas o `case` compara o valor completo do estado.

#### One-hot com case em `1'b1`

O `case` verifica diretamente qual bit do estado está ativo:

```systemverilog
case (1'b1)
  st[0]: ...
  st[1]: ...
  st[2]: ...
endcase
```

Esse estilo conversa diretamente com a ideia de one-hot: cada bit representa um estado.

---

### Slide 29 — Binary Encoded FSM Example with `unique0 case` — QoR

O slide mostra uma FSM binária com cinco estados:

```systemverilog
typedef enum logic [2:0] {IDLE, INIT, START, WORK, END} state_enum;

state_enum st, nxt;

always_comb begin
  dout = c;
  nxt  = IDLE;

  unique0 case (st)
    IDLE:  if (en) nxt = INIT;
    INIT:  begin dout = ^a; nxt = START; end
    START: begin dout = ^(a+b); if (en) nxt = WORK; else nxt = END; end
    WORK:  if (en) begin dout = ^(a+b); nxt = WORK; end else nxt = END;
    END:   dout = ^b;
  endcase
end
```

O relatório mostra:

```text
full / parallel = no / auto
```

Tabela:

```text
Code Style   Cell Count   Timing (WNS)   Area     Net
Binary case      118        -4.33        329.88   140
```

### Interpretação

`unique0 case` indica que os branches devem ser mutuamente exclusivos, mas permite que nenhum branch seja selecionado.

Diferença conceitual:

```text
unique  → espera exatamente uma correspondência válida
unique0 → espera no máximo uma correspondência válida
```

Por isso, `unique0` é menos forte que `unique`.

No slide, o relatório ainda mostra:

```text
full = no
parallel = auto
```

Ou seja:

```text
a ferramenta não reconhece o case como full;
mas consegue detectar exclusividade/parallel automaticamente.
```

---

### Slide 30 — Binary Encoded FSM Example with `unique case` — QoR

O slide troca para:

```systemverilog
unique case (st)
```

O relatório mostra:

```text
full / parallel = user / user
```

O balão diz:

```text
Full recognition also changes to user
```

A tabela compara:

```text
Code Style          Cell Count   Timing (WNS)   Area     Net
Binary case             118        -4.33        329.88   140
with unique0 case       118        -4.33        329.88   140
with unique case        111        -4.38        315.91   133
```

Também há um aviso:

```text
Improvement in one QoR may comes at cost of another
```

### Interpretação

`unique case` dá mais informação à ferramenta:

```text
os casos são exclusivos;
a cobertura dos casos é assumida conforme a intenção do usuário.
```

A ferramenta classifica `full/parallel` como:

```text
user / user
```

porque o usuário declarou isso.

O resultado melhora em área e número de células:

```text
cell count: 118 → 111
area: 329.88 → 315.91
nets: 140 → 133
```

Mas o timing WNS fica ligeiramente pior:

```text
-4.33 → -4.38
```

Por isso o slide alerta:

```text
melhorar uma métrica de QoR pode piorar outra.
```

QoR significa **Quality of Results**. Neste contexto, é o conjunto de métricas como área, timing, número de células e nets.

---

### Slide 31 — One Hot usando binary case

O slide mostra uma alternativa:

```systemverilog
typedef enum logic [4:0] {
  IDLE  = 'b00001,
  INIT  = 'b00010,
  START = 'b00100,
  WORK  = 'b01000,
  END   = 'b10000
} state_enum;
```

O balão diz:

```text
Only one bit is high for all states
```

O `case` continua sendo:

```systemverilog
case (st)
  IDLE:  ...
  INIT:  ...
  START: ...
  WORK:  ...
  END:   ...
endcase
```

O relatório mostra:

```text
full / parallel = no / auto
```

Tabela:

```text
Code Style             Cell Count   Timing (WNS)   Area     Net
Binary case                118        -4.33        329.88   140
with unique case           111        -4.38        315.91   133
One Hot Binary case        107        -4.84        313.62   131
```

### Interpretação

Aqui os estados são one-hot, mas o `case` ainda compara o valor completo do estado.

Exemplo:

```systemverilog
case (st)
  IDLE: ...
  INIT: ...
endcase
```

Como cada estado tem exatamente um bit ativo, a decodificação pode ser mais simples.

A tabela mostra redução de área e células:

```text
111 → 107 células
315.91 → 313.62 área
133 → 131 nets
```

Mas o WNS ficou pior:

```text
-4.38 → -4.84
```

De novo, a aula reforça tradeoff:

```text
não existe otimização gratuita;
cada estilo altera área, timing e estrutura lógica.
```

---

### Slide 32 — One Hot com `case (1'b1)`

O slide mostra outro estilo one-hot:

```systemverilog
case (1'b1)
  st[0]: if (en) nxt = INIT;
  st[1]: begin dout = ^a; nxt = START; end
  st[2]: begin dout = ^(a+b); if (en) nxt = WORK; else nxt = END; end
  st[3]: if (en) begin dout = ^(a+b); nxt = WORK; end else nxt = END;
  st[4]: dout = ^b;
endcase
```

O balão diz:

```text
case on "true" state
```

O relatório visível indica:

```text
full / parallel = no / no
```

### Interpretação

Esse estilo é muito comum para FSM one-hot.

Em vez de comparar o vetor inteiro `st` com constantes como `IDLE` e `INIT`, o código pergunta:

```text
qual bit do estado está em 1?
```

Por isso o `case` é feito sobre:

```systemverilog
1'b1
```

e cada item é um bit do estado:

```systemverilog
st[0]
st[1]
st[2]
...
```

Mas, sem `unique`, a ferramenta pode não assumir que apenas um bit está ativo. Então ela pode não reconhecer paralelismo/exclusividade automaticamente.

Por isso o relatório mostra:

```text
full = no
parallel = no
```

---

### Slide 33 — One Hot com `unique case (1'b1)`

O slide aplica:

```systemverilog
unique case (1'b1)
```

O relatório muda para:

```text
full / parallel = user / user
```

O balão diz:

```text
Full and parallel both changes to user
```

Tabela completa do slide:

```text
Code Style                       Cell Count   Timing (WNS)   Area     Net
Binary case                          118        -4.33        329.88   140
with unique case                     111        -4.38        315.91   133
One Hot Binary case                  107        -4.84        313.62   131
One Hot Binary unique case           103        -4.56        303.96   124
One Hot case(1'b1)                   124        -4.33        354.79   146
One Hot unique case(1'b1)            103        -4.56        303.96   124
```

### Interpretação

O `unique` é essencial aqui porque o código está assumindo one-hot:

```text
exatamente um bit do estado deve estar ativo.
```

Quando essa intenção é declarada, a ferramenta pode otimizar melhor.

Comparando:

```text
One Hot case(1'b1)        → 124 células, área 354.79, 146 nets
One Hot unique case(1'b1) → 103 células, área 303.96, 124 nets
```

A diferença é grande.

O ponto central:

```text
em FSM one-hot com case (1'b1), usar unique pode ser fundamental para a ferramenta entender a intenção de exclusividade.
```

Mas isso só é seguro se a FSM realmente for one-hot.

---

### Slide 34 — Self-check: enum variável não é tipo de dado

O self-check pergunta se o código compila:

```systemverilog
enum logic [1:0] {IDLE, INIT, START} state_enum;

state_enum st, nxt;

always_comb begin
  nxt = IDLE;
  case (st)
    IDLE:  nxt = INIT;
    INIT:  nxt = START;
    START: nxt = IDLE;
  endcase
end
```

A resposta marcada como **Yes** foi considerada incorreta.

Explicação do slide:

```text
state_enum is a variable not a data type.
One cannot use a variable to create another variable.
One need to create a data type in order to create other variables of that data type.
The mechanism in SystemVerilog is typedef.
```

Tradução:

```text
state_enum é uma variável, não um tipo de dado.
Não se pode usar uma variável para criar outra variável.
É necessário criar um tipo de dado para criar outras variáveis daquele tipo.
O mecanismo em SystemVerilog é typedef.
```

### Correção

O correto é:

```systemverilog
typedef enum logic [1:0] {
  IDLE,
  INIT,
  START
} state_enum;

state_enum st, nxt;
```

### Interpretação

Sem `typedef`, isto:

```systemverilog
enum logic [1:0] {IDLE, INIT, START} state_enum;
```

cria uma variável chamada `state_enum`.

Com `typedef`, isto:

```systemverilog
typedef enum logic [1:0] {IDLE, INIT, START} state_enum;
```

cria um tipo chamado `state_enum`.

Esse detalhe é muito importante para FSMs.

---

## 35. Unknown `x` Caveat — simulação

O slide diz:

```text
For simulation
x is defined to be unknown NOT don't care!
```

Tradução:

```text
Para simulação, x é definido como desconhecido, não como don't care.
```

O quadro roxo afirma:

```text
Logical equality (==) comparison views x as an unknown and the result is unknown.
unknown is not true.
```

Tradução:

```text
A comparação de igualdade lógica (==) vê x como desconhecido e o resultado é desconhecido.
Desconhecido não é verdadeiro.
```

Exemplo:

```systemverilog
if (In_A[7:0] == 8'b00xx11xx) begin
  Data_Out = 1'b1;
end else begin
  Data_Out = 1'b0;
end
```

Resultado de simulação mostrado:

```text
Data_Out = 1'b0
```

### Interpretação

Em uma comparação comum com `==`, os `x` do literal não funcionam como “qualquer valor”.

Eles são desconhecidos.

Então:

```systemverilog
In_A == 8'b00xx11xx
```

não é uma comparação com máscara. É uma comparação contra um padrão que contém desconhecidos.

Se o resultado da comparação é `X`, o `if` não trata `X` como verdadeiro. Portanto, cai no `else`.

Regra:

```text
em if, somente 1 é verdadeiro;
0, x e z não entram no then.
```

---

## 36. Unknown `x` Caveat — síntese

O slide diz:

```text
For synthesis
x is also treated as unknown NOT don't care!
```

Tradução:

```text
Para síntese, x também é tratado como desconhecido, não como don't care.
```

O quadro roxo afirma:

```text
Synthesis also views any comparison with x as false.
Consequently, synthesized hardware agrees with simulation result.
```

Tradução:

```text
A síntese também vê qualquer comparação com x como falsa.
Consequentemente, o hardware sintetizado concorda com o resultado de simulação.
```

Resultado de síntese mostrado:

```text
Data_Out = 1'b0
```

### Interpretação

No enquadramento do curso, o designer não deve escrever `x` em comparações esperando comportamento de wildcard.

O código:

```systemverilog
if (In_A[7:0] == 8'b00xx11xx)
```

não deve ser usado para dizer:

```text
compare apenas os bits conhecidos e ignore os x.
```

Para isso, SystemVerilog fornece operadores específicos:

```systemverilog
==?
!=?
```

---

## 37-38. Operadores `==?` e `!=?`

O slide apresenta:

```text
SystemVerilog Equality (==?) & Inequality (!=?) Operators
```

Pontos principais:

```text
SystemVerilog comparison operators supports wildcard

==? and !=? (new in SystemVerilog)

Allows don't-care bits to be masked from the comparison

Treats x, z and ? in the right operand, as wildcards and are not compared to the left operand

Does not treat x and z on the left hand side as wildcards!

Right operand must be a constant
```

Tradução:

```text
Os operadores de comparação de SystemVerilog suportam wildcard.

==? e !=? permitem mascarar bits don't-care da comparação.

x, z e ? no operando da direita são tratados como wildcards e não são comparados com o operando da esquerda.

x e z no lado esquerdo não são tratados como wildcards.

O operando da direita deve ser uma constante.
```

Exemplo do slide:

```systemverilog
logic [3:0] din;

assign dout = (din ==? 4'b???0);
// assign dout = ~din[0] // only bit 0 is considered
```

### Interpretação

O operador `==?` faz comparação com máscara.

No exemplo:

```systemverilog
din ==? 4'b???0
```

os três bits mais altos do padrão da direita são `?`, então são ignorados.

A única parte comparada é:

```text
bit 0 precisa ser 0
```

Logo, isso equivale a:

```systemverilog
dout = ~din[0];
```

Regra essencial:

```text
wildcards só valem no operando da direita.
```

Se `din` tiver `x` ou `z`, eles não viram don't-care automaticamente.

---

## 39. `case inside` wildcard statement

O slide diz:

```text
case statement supports set membership through inside keyword
```

Tradução:

```text
O case statement suporta pertencimento a conjunto por meio da palavra-chave inside.
```

Exemplo estrutural do slide:

```systemverilog
logic [2:0] status;

always_comb begin
  case (status) inside

  endcase
end
```

### Interpretação

`inside` permite testar se um valor pertence a um conjunto de valores ou intervalos.

Exemplo didático:

```systemverilog
always_comb begin
  case (status) inside
    3'b000, 3'b001: action = A;
    [3'b010:3'b101]: action = B;
    default: action = C;
  endcase
end
```

A utilidade é expressar faixas e conjuntos de forma mais clara do que uma lista grande de comparações.

---

## 40. `casex` e `casez` em Verilog

O slide apresenta:

```text
Legacy Verilog case wildcard
```

Pontos:

```text
casex allows "x", "z", "?" to be treated as "don't care" in case items

casez allows "z", "?" to be treated as "don't care" in case items

Synthesis does not support wildcard in casex and casez expressions
```

Exemplos do slide:

```systemverilog
casex (status)
  3'b0?0 : task2(); // matches 'b000 'b010 'b0x0 'b0z0
endcase

casez (status)
  3'b0?0 : task2(); // matches 'b000 'b010 'b0z0
endcase

casex (3'b?0?) // Not supported by synthesis
casez (3'b?0?) // Not supported by synthesis
```

### Interpretação

`casex` e `casez` são recursos antigos de Verilog para wildcard.

#### `casex`

Trata como don't-care:

```text
x
z
?
```

#### `casez`

Trata como don't-care:

```text
z
?
```

O cuidado é enorme: `casex` pode mascarar `x` reais de simulação, escondendo bugs. Por isso, em RTL moderno, tende-se a preferir recursos mais explícitos de SystemVerilog, como:

```systemverilog
case inside
==?
unique case
priority case
```

O slide também destaca uma limitação:

```text
a síntese não suporta wildcard na expressão do casex/casez.
```

Ou seja, a expressão principal do `case` não deve ser wildcard para síntese.

---

## 41. Synthesis of a Tri-state Gate

O slide diz:

```text
Tri-state signal must be a net (wire) type

Tri-state signal must be driven in a continuous assignment statement

Conditional assignment of 'z implies the synthesis of a tri-state gate
```

Exemplo:

```systemverilog
wire D_Out;

assign D_Out = (Use_B) ? B : 'z;
```

### Interpretação

Tri-state é uma saída que pode dirigir:

```text
0
1
Z
```

`Z` significa alta impedância.

Para sintetizar tri-state, o sinal precisa ser net, como `wire`, e deve ser dirigido por atribuição contínua.

O padrão do slide é:

```systemverilog
assign D_Out = enable ? value : 'z;
```

Isso expressa:

```text
quando Use_B = 1, D_Out recebe B;
quando Use_B = 0, D_Out fica em alta impedância.
```

### Cuidado prático

Em muitos fluxos ASIC modernos, tri-state interno é evitado e substituído por muxes. Tri-state costuma ser mais comum em pinos de I/O ou barramentos específicos. Mas o slide foca na regra de síntese:

```text
tri-state sintetizável precisa de net e continuous assignment.
```

---

## 42. Self-check — `?` em `case` comum

O self-check pergunta:

```text
How will ? in the following code be treated by synthesizer and simulators?
```

Código:

```systemverilog
// assume sel, task1(), task2() and task3() are fully defined and correct
always_comb begin
  case (sel)
    3'b0?0 : task1();
    1, 3   : task2();
    default: task3();
  endcase
end
```

Resposta correta marcada:

```text
? is treated as unknown
```

Explicação do slide:

```text
x, z, and ? are treated as unknowns when used within case statements
```

Tradução:

```text
x, z e ? são tratados como desconhecidos quando usados dentro de case statements.
```

### Interpretação

Em um `case` comum, `?` não é wildcard.

Então:

```systemverilog
3'b0?0
```

não significa:

```text
000 ou 010
```

Significa um padrão contendo desconhecido.

Se o objetivo é wildcard, use:

```text
casez
casex
case inside
==?
```

com cuidado e conforme o contexto.

---

## 43. Self-check — qual task executa se `sel = 3'b000`?

O self-check usa o mesmo código:

```systemverilog
always_comb begin
  case (sel)
    3'b0?0 : task1();
    1, 3   : task2();
    default: task3();
  endcase
end
```

Pergunta:

```text
Which task will be executed if sel is 3'b000?
```

A resposta marcada como `task2()` foi considerada incorreta.

A explicação do slide:

```text
Because ? is treated as unknown, the sel == 3'b000 will never be true.
Therefore, the default case statement will be executed.
```

Resposta correta:

```text
task3()
```

### Interpretação

Como `?` é unknown em `case` comum:

```systemverilog
3'b0?0
```

não casa com:

```systemverilog
3'b000
```

Logo, `task1()` não executa.

`1, 3` também não corresponde a `3'b000`.

Então executa:

```systemverilog
default: task3();
```

Esse self-check é importante porque corrige uma intuição comum: muitos alunos acham que `?` sempre é don't-care, mas em `case` comum ele não é.

---

## 44. SystemVerilog Enhancement — Array

O slide compara arrays em Verilog e SystemVerilog.

### Verilog

```systemverilog
reg [7:0] d [0:127];
```

### SystemVerilog — RTL e simulação

```systemverilog
logic [7:0] d [128];

logic [7:0] d [0:127]; // same as logic [7:0] d [128]
```

O slide destaca:

```text
Packed array range
Unpacked array size
```

### SystemVerilog — simulation only

```systemverilog
bit [7:0] d [];          // dynamic
bit [7:0] d [$];         // queue
bit [7:0] d [data_type]; // associative
```

### Interpretação

SystemVerilog melhora muito a sintaxe e os tipos de arrays.

#### Packed range

Na declaração:

```systemverilog
logic [7:0] d [128];
```

a parte:

```systemverilog
[7:0]
```

é packed. Ela define a largura de cada elemento.

Aqui, cada elemento tem 8 bits.

#### Unpacked size

A parte:

```systemverilog
[128]
```

é unpacked. Ela define quantos elementos existem.

Então:

```systemverilog
logic [7:0] d [128];
```

significa:

```text
128 elementos, cada um com 8 bits.
```

Equivale a:

```systemverilog
logic [7:0] d [0:127];
```

#### Recursos apenas de simulação

O slide marca como simulation only:

```text
dynamic arrays
queues
associative arrays
```

Eles são muito úteis em testbench, mas não são RTL sintetizável comum.

---

## 45. Array Example — atribuição unpacked

O slide mostra:

```systemverilog
logic [3:0][7:0] Bytes [3]; // 3 entries of packed 4 bytes
```

E o exemplo:

```systemverilog
Bytes[2] = 32'hbeef_deed;
```

O balão diz:

```text
Unpacked assignment
```

### Interpretação

A declaração:

```systemverilog
logic [3:0][7:0] Bytes [3];
```

pode ser lida assim:

```text
Bytes possui 3 elementos unpacked.
Cada elemento é um vetor packed com 4 bytes.
Cada byte tem 8 bits.
```

Então cada `Bytes[i]` tem:

```text
4 × 8 = 32 bits
```

Por isso a atribuição abaixo é válida:

```systemverilog
Bytes[2] = 32'hbeef_deed;
```

Ela atribui os 32 bits completos ao elemento `Bytes[2]`.

---

## 46. Array Example — packed bit/bit slice assignment

O slide mostra:

```systemverilog
Bytes[2][2][5:4] = Bytes[1][3][4:3];
```

O balão diz:

```text
Packed bit/bit slice assignment
```

### Interpretação

A declaração continua:

```systemverilog
logic [3:0][7:0] Bytes [3];
```

Os índices são interpretados assim:

```text
Bytes[2]       → terceiro elemento unpacked
Bytes[2][2]    → byte de índice 2 dentro do elemento packed
Bytes[2][2][5:4] → bits 5 a 4 daquele byte
```

Do outro lado:

```text
Bytes[1][3][4:3]
```

significa:

```text
elemento 1;
byte 3;
bits 4 a 3.
```

Esse exemplo mostra que SystemVerilog permite acessar partes de arrays multidimensionais de forma muito precisa.

---

## 47. SystemVerilog `struct` Data type

O slide introduz `struct` como nova palavra-chave.

Código reconstruído:

```systemverilog
typedef enum logic [1:0] {OFF = 2'd0, ON = 2'd3} switch_val_enum;
typedef enum              {RED, GREEN, BLUE}       colors_enum;

typedef struct {
  switch_val_enum switch;   // 2 bits
  colors_enum     light;    // 32 bits
  logic           test_bit; // 1 bit
} sw_lgt_pair_unpacked_struct;
```

O slide destaca:

```text
New keyword
User defined struct data type
```

### Interpretação

`struct` permite agrupar campos relacionados em um tipo de dado.

Neste exemplo, a estrutura representa algo como:

```text
um par switch/light/test_bit
```

Ela contém:

```text
switch   → enum de 2 bits
light    → enum que, sem tipo base explícito, assume int/32 bits
test_bit → 1 bit
```

O nome final:

```systemverilog
sw_lgt_pair_unpacked_struct
```

é o tipo criado por `typedef`.

Depois, podem ser declaradas variáveis desse tipo:

```systemverilog
sw_lgt_pair_unpacked_struct slp;
```

---

## 48. Packed `struct` Example

O slide mostra:

```systemverilog
typedef enum logic [1:0] {OFF = 2'd0, ON = 2'd3} switch_val_enum;
typedef enum              {RED, GREEN, BLUE}       colors_enum;

typedef struct packed {
  switch_val_enum switch;   // 2 bits
  colors_enum     light;    // 32 bits
  logic           test_bit; // 1 bit
} sw_lgt_pair_packed_struct;

sw_lgt_pair_packed_struct slp;

slp.light = GREEN;
slp = '1;
```

O balão diz:

```text
Entire packed struct can be assigned with a single value
```

A figura mostra o layout packed:

```text
[34:33] switch
[32:1]  light
[0]     test_bit
```

### Interpretação

Em uma `struct packed`, os membros são compactados em um único vetor de bits.

Neste exemplo:

```text
switch   = 2 bits
light    = 32 bits
test_bit = 1 bit
```

Total:

```text
35 bits
```

Por isso a figura mostra índice de 34 até 0.

Como a estrutura é packed, ela pode receber uma atribuição como vetor:

```systemverilog
slp = '1;
```

Isso coloca todos os bits da struct em 1.

Também é possível atribuir campos individualmente:

```systemverilog
slp.light = GREEN;
```

### Uso em RTL

Packed structs são muito úteis para barramentos e interfaces agrupadas.

Exemplo:

```systemverilog
typedef struct packed {
  logic        valid;
  logic [7:0]  addr;
  logic [31:0] data;
} bus_req_t;
```

Isso permite passar vários sinais juntos com nome e organização.

---

## 49. Un-Packed `struct` Example

O slide mostra a versão sem `packed`:

```systemverilog
typedef enum logic [1:0] {OFF = 2'd0, ON = 2'd3} switch_val_enum;
typedef enum              {RED, GREEN, BLUE}       colors_enum;

typedef struct {
  switch_val_enum switch;   // 2 bits
  colors_enum     light;    // 32 bits
  logic           test_bit; // 1 bit
} sw_lgt_pair_unpacked_struct;

sw_lgt_pair_unpacked_struct slp;

slp.light = GREEN;
```

O balão diz:

```text
Each member of packed struct can be assigned with a value
```

Pelo título do slide, a intenção correta é:

```text
cada membro da unpacked struct pode ser atribuído individualmente.
```

### Interpretação

Em uma `struct unpacked`, os campos são membros separados. O foco é organização lógica de dados, não necessariamente um vetor contínuo de bits.

Você acessa cada campo com ponto:

```systemverilog
slp.switch
slp.light
slp.test_bit
```

A atribuição por campo é natural:

```systemverilog
slp.light = GREEN;
```

Diferença essencial:

```text
packed struct   → comporta-se como vetor de bits; pode receber atribuição total como vetor.
unpacked struct → campos separados; uso principal é organização por membros.
```

### Regra prática

Use `struct packed` quando a estrutura representa bits físicos agrupados em um barramento.

Use `struct` unpacked quando a organização por campos é mais importante que tratar tudo como vetor contínuo.

---

## 50. C-like mechanism — início de `union`

O slide mostra:

```systemverilog
typedef union {
  tcp_t          tcp_h;
  udp_t          udp_h;
  logic [63:0]   bits;
  logic [7:0][7:0] bytes;
} union_unpacked_t;
```

### Interpretação

`union` em SystemVerilog é semelhante ao mecanismo de `union` em C.

A ideia é permitir que o mesmo espaço de armazenamento seja visto por diferentes tipos ou formatos.

No exemplo, o mesmo conteúdo pode ser interpretado como:

```text
tcp_h
udp_h
bits de 64 bits
bytes organizados como 8 bytes de 8 bits
```

Isso é útil quando um dado pode ter múltiplas interpretações.

Exemplo conceitual:

```text
um pacote pode ser visto como cabeçalho TCP,
como cabeçalho UDP,
como vetor bruto de 64 bits,
ou como array de bytes.
```

Como este slide apenas inicia o tema de `union`, a continuação deve ser tratada na parte C.

---

## Explicação didática por tema

### 1. Enums em FSMs: por que usar e onde tomar cuidado

Enums tornam FSMs mais legíveis:

```systemverilog
IDLE
INIT
START
WORK
END
```

são muito melhores que:

```text
3'b000
3'b001
3'b010
```

Mas, para RTL sintetizável, é importante especificar a largura:

```systemverilog
typedef enum logic [2:0] {
  IDLE,
  INIT,
  START,
  WORK,
  END
} state_enum;
```

Se você não especifica a largura, o slide mostra que o enum pode assumir `int`.

Consequência:

```text
estado com largura maior que o necessário;
case não cobre todos os valores possíveis;
latch pode ser inferido;
área pode aumentar;
debug fica menos direto.
```

---

### 2. O padrão seguro de FSM

Um padrão robusto é separar:

```text
estado atual
próximo estado
lógica combinacional de transição
registrador de estado
```

Exemplo:

```systemverilog
typedef enum logic [2:0] {
  IDLE,
  INIT,
  START,
  WORK,
  END
} state_t;

state_t st, nxt;

always_comb begin
  nxt  = st;
  dout = 1'b0;

  unique case (st)
    IDLE:  if (en) nxt = INIT;
    INIT:  begin dout = ^a; nxt = START; end
    START: begin
      dout = ^(a+b);
      if (en) nxt = WORK;
      else    nxt = END;
    end
    WORK: begin
      dout = ^(a+b);
      if (en) nxt = WORK;
      else    nxt = END;
    end
    END: dout = ^b;
    default: begin
      nxt  = IDLE;
      dout = 1'b0;
    end
  endcase
end

always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    st <= IDLE;
  else
    st <= nxt;
end
```

Pontos importantes:

```text
valores default antes do case;
enum com largura explícita;
always_comb para transição;
always_ff para registrador;
<= no registrador;
unique apenas se a intenção for verdadeira.
```

---

### 3. Binary versus one-hot

#### Binary

Com 5 estados, precisa de 3 bits.

Vantagem:

```text
menos flip-flops
```

Desvantagem:

```text
mais lógica para decodificar estados
```

#### One-hot

Com 5 estados, precisa de 5 bits.

Vantagem:

```text
decodificação simples;
muitas vezes melhora lógica de controle;
pode reduzir área combinacional em alguns casos;
pode ajudar timing em FPGAs ou certos ASICs.
```

Desvantagem:

```text
mais flip-flops.
```

O slide mostra que one-hot pode melhorar algumas métricas, mas nem sempre todas.

---

### 4. `unique`, `unique0` e QoR

#### `unique`

Promete que exatamente uma alternativa deve ser válida.

Em `case`, ajuda a ferramenta a otimizar porque declara exclusividade e cobertura esperada.

#### `unique0`

Promete que no máximo uma alternativa será válida, mas permite nenhuma.

É útil quando exclusividade é verdadeira, mas talvez nenhum branch seja selecionado.

#### Efeito em QoR

O slide mostra que declarar corretamente `unique` pode reduzir:

```text
cell count
area
nets
```

Mas pode afetar timing.

Resumo:

```text
unique e unique0 são ferramentas de intenção.
Elas não devem ser usadas para maquiar código incompleto.
```

---

### 5. `x` não é don't-care em simulação

Essa é uma das lições mais importantes do bloco.

Em simulação:

```text
x = unknown
```

Não significa:

```text
qualquer valor serve.
```

Se você escreve:

```systemverilog
if (data == 8'b00xx11xx)
```

o simulador não interpreta os `x` como máscara.

Resultado da comparação pode ser `X`, e `X` não é verdadeiro para o `if`.

Para wildcard real em comparação, use:

```systemverilog
==?
```

Exemplo:

```systemverilog
if (data ==? 8'b00??11??)
```

---

### 6. `==?` e `!=?` são operadores de máscara

O operador:

```systemverilog
==?
```

trata `x`, `z` e `?` no operando da direita como wildcards.

Exemplo:

```systemverilog
din ==? 4'b???0
```

significa:

```text
compare apenas o bit 0;
os outros bits são ignorados.
```

Equivale a:

```systemverilog
~din[0]
```

Mas a regra crítica é:

```text
wildcard só vale no operando da direita.
```

---

### 7. `case`, `casez`, `casex` e `case inside`

#### `case` comum

`?`, `x` e `z` são valores desconhecidos, não wildcards.

#### `casez`

Trata `z` e `?` como don't-care nos itens do case.

#### `casex`

Trata `x`, `z` e `?` como don't-care nos itens do case.

É perigoso porque pode esconder `x` reais.

#### `case inside`

Permite pertencimento a conjuntos e faixas, sendo mais expressivo para certos padrões.

Uso conceitual:

```systemverilog
case (status) inside
  [3'b000:3'b011]: action = A;
  3'b100, 3'b101: action = B;
  default: action = C;
endcase
```

---

### 8. Tri-state em RTL

Para sintetizar tri-state conforme o slide:

```systemverilog
wire D_Out;
assign D_Out = Use_B ? B : 'z;
```

Regras:

```text
o sinal tri-state deve ser net/wire;
deve ser dirigido por continuous assignment;
'z no ramo condicional implica tri-state.
```

Mas em designs internos modernos, cuidado: tri-state interno pode não ser aceito ou pode ser convertido para muxes dependendo da tecnologia.

---

### 9. Arrays packed e unpacked

SystemVerilog separa duas ideias:

```text
packed   → bits agrupados como vetor
unpacked → coleção de elementos
```

Exemplo:

```systemverilog
logic [7:0] d [128];
```

- `[7:0]` é packed: cada elemento tem 8 bits.
- `[128]` é unpacked: existem 128 elementos.

Exemplo multidimensional:

```systemverilog
logic [3:0][7:0] Bytes [3];
```

- `Bytes` tem 3 elementos unpacked.
- Cada elemento tem 4 bytes packed.
- Cada byte tem 8 bits.

---

### 10. Struct packed versus unpacked

#### Packed struct

É como um vetor de bits com campos nomeados.

Pode receber atribuição total:

```systemverilog
slp = '1;
```

Pode ser usado em barramentos:

```systemverilog
typedef struct packed {
  logic        valid;
  logic [7:0]  addr;
  logic [31:0] data;
} req_t;
```

#### Unpacked struct

É mais como uma coleção de membros.

Você normalmente atribui campo por campo:

```systemverilog
slp.light = GREEN;
```

É útil para organizar dados, especialmente em testbench ou em RTL quando não se precisa tratar tudo como vetor contínuo.

---

### 11. Union

`union` permite múltiplas visões do mesmo armazenamento.

Exemplo do slide:

```systemverilog
typedef union {
  tcp_t          tcp_h;
  udp_t          udp_h;
  logic [63:0]   bits;
  logic [7:0][7:0] bytes;
} union_unpacked_t;
```

Interpretação:

```text
o mesmo dado pode ser visto como cabeçalho TCP,
como cabeçalho UDP,
como vetor de bits,
ou como array de bytes.
```

A continuação do tema fica para a parte C.

---

## Figuras/diagramas importantes e o que significam

### Slides 26-27 — FSM binária com enum

Mostram uma FSM com `typedef enum`, `state_enum st, nxt`, `always_comb` para transição e `always_ff` para registrador. O segundo slide mostra que enum sem largura explícita assume `int` e que a ferramenta inferiu latches para `nxt` e `dout`.

### Slide 28 — estilos de FSM

Lista os três estilos: binary, one-hot com binary case e one-hot. Também introduz a comparação de efeitos de `unique` e `unique0`.

### Slides 29-30 — binary FSM com `unique0` e `unique`

Mostram que `unique0` pode não alterar o QoR, enquanto `unique` muda `full/parallel` para `user/user` e reduz cell count, área e nets, com pequeno impacto em timing.

### Slides 31-33 — one-hot FSM

Comparam one-hot com binary case, case em `1'b1` e `unique case (1'b1)`. A conclusão visual é que `unique` faz grande diferença quando a estrutura é realmente one-hot.

### Slide 34 — self-check de enum sem typedef

Mostra que `enum logic [1:0] {...} state_enum;` cria uma variável, não um tipo. Para usar `state_enum st, nxt;`, é necessário `typedef enum`.

### Slides 35-36 — unknown `x`

Mostram que `x` é unknown, não don't-care, tanto na simulação quanto na síntese de comparações comuns no enquadramento do curso.

### Slides 37-38 — operadores `==?` e `!=?`

Mostram que wildcard correto em comparação é feito com `==?` e `!=?`, usando `x`, `z` e `?` no operando da direita como máscara.

### Slide 39 — `case inside`

Apresenta o uso de `inside` para pertencimento a conjunto dentro de `case`.

### Slide 40 — `casex` e `casez`

Compara os wildcards de Verilog legado e alerta sobre suporte de síntese em expressões wildcard.

### Slide 41 — tri-state

Mostra que tri-state sintetizável precisa ser net/wire e atribuição contínua com `'z`.

### Slides 42-43 — self-checks sobre `?` em `case`

Mostram que `?` em `case` comum é unknown. Se `sel = 3'b000`, o item `3'b0?0` não casa, e o `default` executa.

### Slides 44-46 — arrays

Mostram packed array range, unpacked array size, arrays dinâmicos/queues/associativos como simulation only, e exemplos de atribuição em array multidimensional.

### Slides 47-49 — struct

Mostram `struct`, `struct packed` e `struct unpacked`, destacando campos nomeados, atribuição total em packed struct e atribuição por membro.

### Slide 50 — union

Introduz `typedef union` como mecanismo semelhante a C para múltiplas interpretações do mesmo dado.

---

## Conceitos-chave

```text
enum sem tipo base explícito assume int.
FSM com enum deve declarar largura explícita para RTL.
always_comb precisa atribuir saídas em todos os caminhos.
Latches surgem quando lógica combinacional precisa preservar valor anterior.
Binary FSM usa menos bits de estado.
One-hot FSM usa um bit por estado.
unique declara exclusividade e cobertura esperada.
unique0 declara exclusividade permitindo nenhuma correspondência.
QoR envolve cell count, timing, area e nets.
Melhorar uma métrica de QoR pode piorar outra.
x é unknown, não don't-care.
==? e !=? fazem comparação wildcard.
Wildcards de ==? e !=? valem no operando da direita.
case comum não trata ? como wildcard.
casex e casez são legados e exigem cuidado.
Tri-state sintetizável usa wire e continuous assignment.
Packed array representa bits agrupados.
Unpacked array representa coleção de elementos.
Packed struct pode ser vista como vetor de bits.
Unpacked struct organiza membros separados.
Union permite múltiplas visões do mesmo armazenamento.
```

---

## Possíveis questões de prova

### Questão 1

**Pergunta:** Em SystemVerilog, qual é o tipo base padrão de um `enum` quando nenhum tipo é especificado?

**Resposta:** `int`.

**Justificativa:** O slide de FSM binária destaca que um enum sem tipo base explícito assume `int`, o que pode levar a largura maior e inferência de latches se o `case` não cobre todos os valores possíveis.

---

### Questão 2

**Pergunta:** Por que o exemplo de FSM binária inferiu latches para `nxt` e `dout`?

**Resposta:** Porque `nxt` e `dout` não foram atribuídos em todos os caminhos do `always_comb`, e o enum sem largura explícita assumiu `int`, deixando muitos valores possíveis não cobertos.

---

### Questão 3

**Pergunta:** Quais são os três estilos comuns de codificação de FSM citados?

**Resposta:** Binary, one-hot com binary case, e one-hot.

---

### Questão 4

**Pergunta:** Qual a diferença entre `unique` e `unique0`?

**Resposta:** `unique` espera uma correspondência única; `unique0` permite zero ou uma correspondência, mas não múltiplas correspondências.

---

### Questão 5

**Pergunta:** Em uma FSM one-hot com `case (1'b1)`, por que `unique case` pode melhorar a síntese?

**Resposta:** Porque informa à ferramenta que apenas um bit/branch deve estar ativo, permitindo otimização como lógica paralela/exclusiva, reduzindo área e número de células.

---

### Questão 6

**Pergunta:** A expressão `if (data == 8'b00xx11xx)` trata `x` como don't-care?

**Resposta:** Não. Em comparação comum, `x` é unknown, não don't-care.

---

### Questão 7

**Pergunta:** Quais operadores SystemVerilog permitem comparação com wildcard?

**Resposta:** `==?` e `!=?`.

---

### Questão 8

**Pergunta:** Em `din ==? 4'b???0`, quais bits são comparados?

**Resposta:** Apenas o bit 0, porque os `?` no operando da direita são wildcards.

---

### Questão 9

**Pergunta:** Em `case` comum, `?` é tratado como don't-care?

**Resposta:** Não. O slide mostra que `x`, `z` e `?` são tratados como unknown em `case` comum.

---

### Questão 10

**Pergunta:** Se `sel = 3'b000`, qual task executa neste código?

```systemverilog
case (sel)
  3'b0?0 : task1();
  1, 3   : task2();
  default: task3();
endcase
```

**Resposta:** `task3()`.

**Justificativa:** `?` é unknown, não wildcard; então `3'b0?0` não casa com `3'b000`.

---

### Questão 11

**Pergunta:** Quais valores `casex` trata como don't-care em itens do case?

**Resposta:** `x`, `z` e `?`.

---

### Questão 12

**Pergunta:** Quais valores `casez` trata como don't-care em itens do case?

**Resposta:** `z` e `?`.

---

### Questão 13

**Pergunta:** Quais são as condições para síntese de tri-state gate segundo o slide?

**Resposta:** O sinal tri-state deve ser net/wire e deve ser dirigido por atribuição contínua; uma atribuição condicional de `'z` implica tri-state.

---

### Questão 14

**Pergunta:** Em `logic [7:0] d [128];`, o que é packed e o que é unpacked?

**Resposta:** `[7:0]` é packed array range; `[128]` é unpacked array size.

---

### Questão 15

**Pergunta:** Quais arrays o slide marca como simulation only?

**Resposta:** Dynamic arrays, queues e associative arrays.

---

### Questão 16

**Pergunta:** O que significa `logic [3:0][7:0] Bytes [3];`?

**Resposta:** São 3 elementos unpacked; cada elemento é um conjunto packed de 4 bytes de 8 bits, totalizando 32 bits por elemento.

---

### Questão 17

**Pergunta:** Qual a diferença entre `struct packed` e `struct` unpacked?

**Resposta:** `struct packed` é compactada como vetor contínuo de bits e pode receber atribuição total; `struct` unpacked organiza membros separados e é normalmente atribuída por campo.

---

### Questão 18

**Pergunta:** Para que serve `union`?

**Resposta:** Para permitir múltiplas interpretações do mesmo armazenamento, como ver os mesmos 64 bits como cabeçalho TCP, cabeçalho UDP, vetor de bits ou array de bytes.

---

## Relação com laboratório/projeto

### Aplicação em RTL de FSM

Ao escrever FSMs, adote:

```systemverilog
typedef enum logic [N:0] {
  IDLE,
  ...
} state_t;

state_t st, nxt;
```

Use valores default:

```systemverilog
always_comb begin
  nxt = st;
  out = '0;

  unique case (st)
    ...
    default: ...
  endcase
end
```

E registre estado com:

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    st <= IDLE;
  else
    st <= nxt;
end
```

### Aplicação em debug

Enums ajudam waveforms, porque estados podem aparecer por nome.

Exemplo:

```systemverilog
$display("state = %p", st);
```

Isso mostra o estado como representação textual em vez de apenas bits.

### Aplicação em comparação de padrões

Não escreva:

```systemverilog
if (data == 8'b10xx_00zz)
```

esperando wildcard.

Use:

```systemverilog
if (data ==? 8'b10??_00??)
```

desde que a máscara esteja no operando da direita.

### Aplicação em arrays

Para memórias e bancos de registradores:

```systemverilog
logic [31:0] mem [1024];
```

Para vetores compactos/multidimensionais:

```systemverilog
logic [3:0][7:0] bytes;
```

### Aplicação em interfaces e barramentos

Use `struct packed` para agrupar sinais relacionados:

```systemverilog
typedef struct packed {
  logic        valid;
  logic [7:0]  addr;
  logic [31:0] data;
} bus_req_t;
```

Isso melhora legibilidade e reduz erro de conexão.

### Checklist prático

- [ ] FSM usa enum com largura explícita?
- [ ] `nxt` e saídas têm valor default?
- [ ] `unique` é usado apenas quando exclusividade é verdadeira?
- [ ] `unique0` é usado quando zero correspondências são permitidas?
- [ ] `x` não está sendo usado como don't-care em comparação comum?
- [ ] Wildcards usam `==?`, `!=?`, `case inside`, `casez` ou `casex` com intenção clara?
- [ ] Tri-state usa `wire` e `assign` contínuo?
- [ ] Arrays packed/unpacked estão na ordem correta?
- [ ] Recursos simulation only não foram usados em RTL sintetizável?
- [ ] Struct packed é usada quando o dado precisa virar vetor de bits?
- [ ] Union está sendo usada com consciência de múltiplas interpretações do mesmo dado?

---

## Necessidade de áudio

**Médio.**

Os prints permitem reconstruir bem o conteúdo, mas a fala do professor poderia ajudar em:

- detalhes completos da comparação de QoR entre estilos de FSM;
- interpretação exata de `unique0` versus `unique` no fluxo Synopsys;
- explicação oral dos relatórios `full / parallel`;
- recomendações do professor sobre quando preferir binary ou one-hot;
- exemplos adicionais de `case inside`;
- continuação do tema de `union`, que começa no slide 50 e deve seguir na parte C.

Mesmo sem áudio, os conceitos centrais da parte B ficaram claros pelos prints.

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides/prints 26-50.
- [x] Começou em `Binary Encoded FSM Example`, logo após o ponto de parada da parte A.
- [x] Parou em `C-like mechanism` com exemplo inicial de `union`.
- [x] Não avançou para os slides da parte C.
- [x] FSMs, `unique`, `unique0`, QoR e one-hot foram explicados.
- [x] `x`, `==?`, `case`, `casez`, `casex` e tri-state foram diferenciados.
- [x] Arrays, structs e início de union foram organizados.
- [x] Self-checks importantes foram incorporados com resposta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 029 — 01 SystemVerilog for RTL Design - parte C**

Usar o mesmo arquivo DOCX:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx
```

Processar somente:

```text
slides/prints 51-75
```

Salvar como:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_C.md
```
