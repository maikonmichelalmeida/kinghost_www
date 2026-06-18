# 01 SystemVerilog for RTL Design — parte A

## Controle do bloco

- **Bloco:** 027
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx`
- **Faixa processada conforme roteiro:** parte A — somente os primeiros 25 prints/slides do arquivo combinado
- **Ponto de parada aplicado:** `SystemVerilog Enumerated Variables`
- **Conteúdo não processado neste bloco:** a partir de `Binary Encoded FSM Example`, que pertence à próxima parte do mesmo DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_A.md`
- **Próximo bloco recomendado:** 028 — `01 SystemVerilog for RTL Design - parte B`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das imagens.  
> Observação adicional: o arquivo contém alguns prints duplicados de self-check no início. Eles foram considerados, mas não repetidos desnecessariamente na explicação.

---

## Resumo executivo

Esta parte inicia a seção **06 SystemVerilog for RTL Design** com foco em diferenças práticas entre Verilog e SystemVerilog para escrita de RTL sintetizável.

O bloco começa com self-checks sobre:

```text
logic unsigned
atribuição de -1
declaração ANSI e non-ANSI de portas
output logic versus output sem tipo
uso de always blocks para dirigir saídas
```

Depois entra em temas centrais de RTL:

```text
full e parallel
priority case
unique case
unique if
latch inference
always_comb
always_ff
síntese de registradores
reset assíncrono
set/reset síncrono
atribuições bloqueantes e não bloqueantes
variáveis enumeradas
```

A ideia geral é mostrar que SystemVerilog não é apenas uma versão “mais moderna” do Verilog. Ele introduz palavras-chave que permitem declarar intenção de hardware com mais clareza:

```text
always_comb  → intenção de lógica combinacional
always_ff    → intenção de lógica sequencial/registradores
priority     → intenção de prioridade
unique       → intenção de exclusividade
enum         → estados e valores nomeados
logic        → tipo mais conveniente para RTL
```

O ponto mais importante é:

```text
SystemVerilog ajuda o designer a declarar intenção.
Mas, quando a intenção declarada não corresponde à realidade do código, podem surgir warnings, latches, diferenças entre simulação e síntese, ou resultados indeterminados.
```

---

## Texto extraído e organizado por tema

### 1. Self-check — `logic unsigned` recebendo `-1`

O primeiro self-check pergunta se o código é legal:

```systemverilog
logic [7:0] unsigned data;
data = -1;
```

A resposta marcada como **No** foi considerada incorreta pelo curso.

A explicação do slide:

```text
Values are always stored as 2's complement value.
2's complement value for -1 is all bits are one.
The stored value for data is 8'b1111_1111.
```

Tradução:

```text
Os valores são sempre armazenados em complemento de 2.
O valor em complemento de 2 para -1 tem todos os bits em 1.
O valor armazenado em data é 8'b1111_1111.
```

### Interpretação

Mesmo que a variável seja declarada como `unsigned`, o padrão de bits de `-1` ainda pode ser armazenado.

Em 8 bits:

```text
-1 em complemento de 2 = 1111_1111
```

Então a atribuição é legal do ponto de vista de armazenamento de bits.

O ponto didático é:

```text
signed/unsigned muda a interpretação aritmética e comparações,
mas o armazenamento físico continua sendo bits.
```

Se você atribui `-1` a um vetor de 8 bits sem sinal, o padrão armazenado será:

```systemverilog
8'b1111_1111
```

que, quando interpretado como unsigned, vale:

```text
255
```

---

### 2. Self-check — mistura de estilo ANSI e non-ANSI na lista de portas

O self-check pergunta se o código compila:

```systemverilog
module my_module (clk, reset, logic din, output logic d1, d2);
```

A resposta marcada como **Yes** foi considerada incorreta.

A explicação do slide:

```text
If you do not declare direction in the first argument of the port list,
you must define your port list in non-ANSI style which forbids directions in the port list.
```

Tradução:

```text
Se você não declara a direção no primeiro argumento da lista de portas,
deve definir sua lista de portas no estilo non-ANSI, que proíbe direções na lista de portas.
```

### Interpretação

O problema é misturar estilos.

#### Estilo non-ANSI

A lista de portas contém apenas nomes:

```systemverilog
module my_module (clk, reset, din, d1, d2);
  input clk, reset, din;
  output logic d1, d2;
endmodule
```

#### Estilo ANSI

A lista de portas já contém direção e tipo:

```systemverilog
module my_module (
  input  logic clk,
  input  logic reset,
  input  logic din,
  output logic d1,
  output logic d2
);
endmodule
```

O código do self-check começa como non-ANSI:

```systemverilog
clk, reset
```

mas depois tenta declarar:

```systemverilog
logic din, output logic d1, d2
```

Esse tipo de mistura é inválido.

---

### 3. Self-check — `output` sem tipo dirigido em `always`

O self-check mostra um registrador com reset, mas as portas de saída são declaradas sem `logic`:

```systemverilog
module my_module (input clk, reset, din, output d1, d2);
  always @(posedge clk or negedge reset) begin
    if (reset) begin
      d1 <= '0;
      d2 <= '0;
    end else begin
      d1 <= din;
      d2 <= d1;
    end
  end
endmodule
```

A resposta correta do curso é que esse código **não compila**.

A explicação do slide:

```text
When port direction is declared to be output and data type is not declared,
the default data type is wire logic resulting in creation of net data object.
net data objects cannot be driven in always blocks.
```

Tradução:

```text
Quando a direção da porta é declarada como output e o tipo de dado não é declarado,
o tipo padrão é wire logic, resultando na criação de um objeto de dado do tipo net.
Objetos net não podem ser dirigidos dentro de blocos always.
```

### Interpretação

Em SystemVerilog, se você escreve apenas:

```systemverilog
output d1, d2
```

essas saídas são tratadas como nets, parecidas com `wire`.

Mas dentro de um bloco procedural:

```systemverilog
always @(posedge clk) begin
  d1 <= din;
end
```

você precisa dirigir uma variável procedural, como `logic`.

Correção:

```systemverilog
module my_module (
  input  logic clk,
  input  logic reset,
  input  logic din,
  output logic d1,
  output logic d2
);
  always_ff @(posedge clk or negedge reset) begin
    if (!reset) begin
      d1 <= '0;
      d2 <= '0;
    end else begin
      d1 <= din;
      d2 <= d1;
    end
  end
endmodule
```

---

### 4. Self-check — `output logic` dirigido em `always`

O próximo self-check mostra a versão corrigida:

```systemverilog
module my_module (input logic clk, rst, logic din, output logic d1, d2);
  always @(posedge clk or negedge rst) begin
    if (reset) begin
      d1 <= '0;
      d2 <= '0;
    end else begin
      d1 <= din;
      d2 <= d1;
    end
  end
endmodule
```

A resposta correta é **Yes**, ou seja, compila.

### Interpretação

A diferença decisiva é:

```systemverilog
output logic d1, d2
```

Agora `d1` e `d2` são variáveis do tipo `logic`, podendo receber atribuições dentro de blocos procedurais.

Observação técnica:

O código do print mistura `rst` na porta e `reset` dentro do bloco. O foco do slide parece ser o tipo da porta `output logic`, não esse detalhe de nome. Para a ideia central da pergunta, a resposta esperada é que a forma com `output logic` é aceitável.

---

## 5. Latch warning em `always_comb`

O self-check pergunta se o código gera warning de latch:

```systemverilog
module my_module(input logic a, b, c, logic[2:0] sel, output d);
always_comb begin
  if (sel[0] == 1'b1)
    d = a;
  else if (sel[1] == 1'b1)
    d = b;
  else if (sel[2] == 1'b1)
    d = c;
end
endmodule
```

O slide indica que há múltiplos problemas:

```text
There are multiple problems with this code — one for synthesis and one for simulation.
```

Para síntese, o comentário visível indica que pode não haver warning mesmo que um latch resulte, porque o compilador não necessariamente sabe se os casos cobrem todas as possibilidades.

### Interpretação

O problema é que `d` não recebe valor em todos os caminhos.

Se:

```systemverilog
sel = 3'b000
```

nenhum `if` é verdadeiro, então `d` não é atribuído.

Em lógica combinacional, se uma saída não é atribuída em todos os caminhos, a ferramenta precisa preservar o valor anterior. Preservar valor anterior implica memória, isto é, latch.

Uma forma melhor é atribuir valor default:

```systemverilog
always_comb begin
  d = '0;
  if (sel[0])
    d = a;
  else if (sel[1])
    d = b;
  else if (sel[2])
    d = c;
end
```

Ou, se a intenção for prioridade, declarar isso explicitamente:

```systemverilog
always_comb begin
  d = '0;
  priority if (sel[0])
    d = a;
  else if (sel[1])
    d = b;
  else if (sel[2])
    d = c;
end
```

---

## 6. Meaning of `full` and `parallel`

O slide define:

```text
full: All possible case branches are coded
parallel: Branches are mutually exclusive — priority logic not needed
```

Tradução:

```text
full: todos os ramos possíveis do case estão codificados
parallel: os ramos são mutuamente exclusivos — lógica de prioridade não é necessária
```

A tabela do slide compara três formas:

```text
auto
no
user
```

### `full`

- `auto`: a ferramenta detectou que todos os branches possíveis foram codificados. Pode prevenir latch.
- `no`: a ferramenta detectou que nem todos os branches foram codificados. Pode gerar latch.
- `user`: o usuário especificou que todos os branches possíveis foram codificados. Pode prevenir latch.

### `parallel`

- `auto`: a ferramenta detectou que os branches são mutuamente exclusivos. Permite otimização por compartilhamento de lógica.
- `no`: a ferramenta não detectou exclusividade. Pode gerar lógica de prioridade.
- `user`: o usuário especificou que os branches são mutuamente exclusivos. Permite otimização.

### Interpretação

Esses termos aparecem em relatórios de síntese para indicar como a ferramenta entendeu um `case`.

Um `case` pode ser:

```text
full, mas não parallel
parallel, mas não full
nem full nem parallel
full e parallel
```

#### Exemplo de não-full

```systemverilog
case (sel)
  2'b00: y = a;
  2'b01: y = b;
endcase
```

Faltam:

```systemverilog
2'b10
2'b11
```

Logo, pode inferir latch se `y` não tiver valor default.

#### Exemplo de não-parallel

Em alguns estilos, a ferramenta não consegue provar que só um branch será verdadeiro, então preserva lógica de prioridade.

---

## 7. Effects of Full and Parallel — solução com valor default

O slide mostra uma solução para evitar latch:

```systemverilog
always_comb begin
  dout = '1;
  case (1'b1)
    sel[0] : dout = A && B;
    sel[1] : dout = A || B;
    sel[2] : dout = ~(A + B);
  endcase
end
```

A ideia principal do slide:

```text
If all outputs are driven in all cases
But, not all possible cases are specified, latches are generated

A possible solution:
Drive all outputs before case statements
```

Tradução:

```text
Se todas as saídas são dirigidas em todos os casos,
mas nem todos os casos possíveis são especificados, latches são gerados.

Uma solução possível:
dirigir todas as saídas antes do case.
```

### Interpretação

Atribuir um valor default antes do `case` impede latch porque `dout` sempre tem algum valor, mesmo se nenhum branch do `case` for executado.

O padrão é:

```systemverilog
always_comb begin
  dout = default_value;

  case (...)
    ...
  endcase
end
```

Isso é bom para síntese e simulação porque evita memória implícita.

---

## 8. O aviso “DO NOT DO THIS!!!”

Um slide mostra em destaque:

```text
DO NOT DO THIS!!!
Can cause a lot of problems for simulation testbenches
```

A tela compara estilos como:

```text
Set default output
Use 'x as don't care
```

A mensagem prática é:

```text
não use 'x como valor default de saída apenas para tentar ajudar a síntese.
```

### Por que isso é perigoso?

Usar `X` como “don't care” pode parecer útil para síntese, mas em simulação `X` representa desconhecido.

Isso pode causar:

```text
propagação de X;
testbench vendo valores desconhecidos;
falsos erros;
mascaramento de bugs;
diferença de interpretação entre intenção do designer e simulação;
debug difícil.
```

Exemplo perigoso:

```systemverilog
always_comb begin
  dout = 'x;
  case (1'b1)
    sel[0] : dout = A && B;
    sel[1] : dout = A || B;
    sel[2] : dout = ~(A + B);
  endcase
end
```

Se nenhuma condição ocorrer, `dout` fica `X` em simulação.

O curso reforça: não fazer isso como prática comum.

---

## 9. Melhor solução — `priority case`

O slide mostra a solução usando `priority`:

```systemverilog
always_comb begin
  // dout = 'x;
  priority case (1'b1)
    sel[0] : dout = A && B;
    sel[1] : dout = A || B;
    sel[2] : dout = ~(A + B);
  endcase
end
```

A ideia:

```text
A better solution:
Set SystemVerilog priority on the case statement
```

Tradução:

```text
Uma solução melhor:
usar a palavra-chave priority no case statement.
```

### Interpretação

`priority case` informa que existe uma intenção de prioridade entre os branches.

Isso é adequado quando:

```text
mais de uma condição pode ser verdadeira;
a primeira condição verdadeira deve vencer;
há prioridade intencional.
```

A vantagem é que o designer declara a intenção de prioridade diretamente, em vez de depender de truques como `dout = 'x`.

### Efeito no relatório

O slide mostra que, com `priority`, o relatório muda a classificação de `full` para `user`.

Ou seja, o usuário está explicitamente informando à ferramenta uma propriedade de intenção.

---

## 10. Outra solução — `unique case`

O slide mostra uma solução quando os casos são mutuamente exclusivos:

```systemverilog
always_comb begin
  // dout = 'x;
  unique case (1'b1)
    sel[0] : dout = A && B;
    sel[1] : dout = A || B;
    sel[2] : dout = ~(A + B);
  endcase
end
```

A ideia do slide:

```text
Another possible solution:
If each case statement is mutually exclusive with each other
Specify case as unique
```

Tradução:

```text
Outra solução possível:
se cada branch do case é mutuamente exclusivo em relação aos outros,
especifique o case como unique.
```

O slide também mostra a checagem:

```systemverilog
$countones(sel) != 1
```

será reportada como warning em simulação.

### Interpretação

`unique case` declara duas intenções:

```text
os casos devem ser exclusivos;
normalmente espera-se que uma opção válida seja tomada.
```

Se a simulação encontra uma situação em que:

```text
nenhum branch é válido
ou mais de um branch é válido
```

a ferramenta pode emitir warning.

Isso ajuda a detectar inconsistências entre a intenção do designer e os estímulos reais.

### Diferença entre `priority` e `unique`

#### `priority`

Use quando existe prioridade intencional:

```text
se duas condições forem verdadeiras, a primeira vence.
```

#### `unique`

Use quando as condições deveriam ser exclusivas:

```text
no máximo uma condição deve ser verdadeira.
```

---

## 11. Self-check — `unique if` e latch warning

O self-check mostra:

```systemverilog
module my_module(input logic a, b, c, logic[2:0] sel, output d);
always_comb begin
  unique if (sel[0] == 1'b1)
    d = a;
  else if (sel[1] == 1'b1)
    d = b;
  else if (sel[2] == 1'b1)
    d = c;
end
endmodule
```

A resposta marcada foi considerada incorreta.

A explicação visível indica:

```text
For synthesis, no latch is generated because you told the synthesizer sel==0 is impossible with the unique keyword.
For simulation, this code is NOT a zero cycle infinite loop because no always event is used.
Also, if in simulation, the sel==0 condition is detected, a simulation warning will be generated.
Always use the SystemVerilog always_comb to create combinatorial logic.
```

### Interpretação

Com `unique`, o designer está dizendo que os caminhos cobrem as condições válidas esperadas.

Se `sel == 3'b000`, nenhum branch executa, mas isso viola a intenção declarada pelo `unique`.

Em simulação, essa condição pode gerar warning.

O ponto didático:

```text
unique não é um substituto para raciocínio correto.
Ele é uma promessa do designer para a ferramenta.
Se a promessa for falsa, a simulação pode alertar, e a síntese pode otimizar assumindo algo incorreto.
```

---

## 12. Register Synthesis

O slide define quando registradores são sintetizados:

```text
Registers are synthesized when:
ALL signals in the always event list have an associated edge:
posedge clk, negedge reset_n
```

Tradução:

```text
Registradores são sintetizados quando todos os sinais na lista de eventos do always
têm uma borda associada, como posedge clk e negedge reset_n.
```

### Recomendações de codificação

O slide recomenda:

```text
Use always_ff construct to synthesize register
Use Verilog non-blocking assignment (<=) for variable assignments inside the always_ff block
```

Tradução:

```text
Use always_ff para sintetizar registrador.
Use atribuição não bloqueante (<=) para atribuições de variáveis dentro do bloco always_ff.
```

Se não usar atribuição não bloqueante:

```text
simulation race condition may occur
simulation mismatch between pre-synthesis and post-synthesis can happen
```

Tradução:

```text
pode ocorrer condição de corrida na simulação;
pode acontecer diferença entre simulação pré-síntese e pós-síntese.
```

### Interpretação

O padrão recomendado para registradores é:

```systemverilog
always_ff @(posedge clk or negedge reset_n) begin
  if (!reset_n)
    q <= '0;
  else
    q <= d;
end
```

Principais ideias:

```text
always_ff declara intenção sequencial;
posedge/negedge indicam eventos de clock/reset;
<= modela atualização simultânea de registradores;
= dentro de always_ff pode causar simulação ambígua ou incorreta.
```

---

## 13. Register Example #1 — Verilog e SystemVerilog

O slide pergunta:

```text
Where is the flip flop?
```

Código Verilog:

```verilog
always @(clk) begin
  d <= (a & b) | c;
end
```

Depois mostra a versão SystemVerilog:

```systemverilog
always_ff @(clk) begin
  d <= (a & b) | c;
end
```

### Interpretação

A intenção parece ser discutir que apenas listar `clk` sem borda não descreve corretamente um registrador.

Para flip-flop, a lista de sensibilidade precisa ter borda:

```systemverilog
always_ff @(posedge clk) begin
  d <= (a & b) | c;
end
```

Se o código usa apenas:

```systemverilog
@(clk)
```

isso não especifica `posedge` nem `negedge`.

O slide conecta com a regra anterior:

```text
registradores são sintetizados quando todos os sinais da event list têm edge.
```

Portanto, a forma correta para um flip-flop é:

```systemverilog
always_ff @(posedge clk) begin
  d <= (a & b) | c;
end
```

---

## 14. Register Example #2 — reset assíncrono com borda ausente

O slide apresenta a intenção:

```text
Intent: asynchronous reset register
```

Código com problema:

```systemverilog
always @(posedge clk, rstN) begin
  if (!rstN)
    d <= 0;
  else
    d <= (a & b) | c;
end
```

e também:

```systemverilog
always_ff @(posedge clk, rstN) begin
  if (!rstN)
    d <= 0;
  else
    d <= (a & b) | c;
end
```

O slide destaca:

```text
Missing edge
```

Erro reportado:

```text
The event depends on both edge and nonedge expressions, which synthesis does not support.
```

### Interpretação

Se a intenção é reset assíncrono ativo em nível baixo, o correto é:

```systemverilog
always_ff @(posedge clk or negedge rstN) begin
  if (!rstN)
    d <= '0;
  else
    d <= (a & b) | c;
end
```

O problema do código do slide é que `rstN` aparece na event list sem `posedge` ou `negedge`.

Misturar evento com borda e evento sem borda não representa corretamente um flip-flop sintetizável para esse caso.

---

## 15. Register Example #3 — set síncrono interpretado como assíncrono

O slide apresenta a intenção:

```text
Intent: synchronous set register
```

Código mostrado:

```systemverilog
always_ff @(posedge clk, negedge setN) begin
  if (!setN)
    d <= '1;  // 1 implies set
  else
    d <= (a & b) | c;
end
```

O slide diz:

```text
Not recognized as synchronous event

A signal listed as an edge event, when used in the first if statement,
is interpreted as an asynchronous event
```

Tradução:

```text
Não é reconhecido como evento síncrono.

Um sinal listado como evento de borda, quando usado no primeiro if,
é interpretado como evento assíncrono.
```

### Interpretação

Se `setN` está na lista de sensibilidade com borda:

```systemverilog
negedge setN
```

então a ferramenta interpreta `setN` como evento assíncrono.

Mas a intenção do slide é set síncrono. Para set síncrono, `setN` não deve estar na event list.

Forma comum:

```systemverilog
always_ff @(posedge clk) begin
  if (!setN)
    d <= 1'b1;
  else
    d <= (a & b) | c;
end
```

---

## 16. Register Solution for Example #3 — diretiva Synopsys

O slide mostra uma solução com diretiva:

```systemverilog
// synopsys sync_set_reset "setN"
always_ff @(posedge clk) begin
  if (!setN)
    d <= '1;  // 1 implies set
  else
    d <= (a & b) | c;
end
```

O balão diz:

```text
Synopsys directive to use sync set/reset cells
```

Tradução:

```text
Diretiva Synopsys para usar células de set/reset síncronos.
```

### Interpretação

A solução remove `setN` da lista de sensibilidade, preservando apenas:

```systemverilog
posedge clk
```

Assim, `setN` é avaliado sincronamente na borda de clock.

A diretiva Synopsys informa à ferramenta que aquele sinal deve ser tratado como set/reset síncrono para fins de mapeamento em células apropriadas.

O ponto principal:

```text
se set/reset é síncrono, ele pertence ao if dentro do always_ff,
não à lista de eventos.
```

---

## 17. Self-check — `always_ff` sem event control

O self-check pergunta:

```text
What does the following code synthesize to?
```

Código:

```systemverilog
always_ff begin
  c = a + b;
end

always_ff begin
  d = c;
end
```

A opção marcada foi:

```text
Two flip-flop
```

Mas a resposta correta indicada pelo curso é:

```text
No flip-flop
```

Explicação visível:

```text
The correct answer is: no flip-flop.
There are problems with this code for both synthesis and simulation.
For synthesis and simulation, a signal with an edge is required to be in the argument of the always_ff.
```

### Interpretação

`always_ff` precisa de evento de clock/borda.

O correto seria algo como:

```systemverilog
always_ff @(posedge clk) begin
  c <= a + b;
end

always_ff @(posedge clk) begin
  d <= c;
end
```

Sem:

```systemverilog
@(posedge clk)
```

não há evento que defina quando o registrador atualiza.

Portanto, a ferramenta não tem como sintetizar flip-flops corretamente.

---

## 18. Self-check — atribuição bloqueante em `always_ff`

O próximo self-check pergunta como síntese e simulação interpretam:

```systemverilog
always_ff @(posedge clk) begin
  c = a + b;
end

always_ff @(posedge clk) begin
  d = c;
end
```

A opção marcada foi:

```text
One flip-flop
```

Mas o curso indica que a resposta correta é:

```text
Indeterminable
```

A explicação visível diz:

```text
Flip-flops have delays from the edge of the clock to the output of flip-flop.
To emulate this delay, one ...
```

O texto completo não aparece, mas o sentido é que atribuições bloqueantes em blocos sequenciais podem gerar comportamento dependente da ordem de simulação.

### Interpretação

O problema é usar `=` em lógica sequencial.

Em blocos separados:

```systemverilog
always_ff @(posedge clk) begin
  c = a + b;
end

always_ff @(posedge clk) begin
  d = c;
end
```

a ordem de execução dos blocos no mesmo timestep pode afetar se `d` vê o valor antigo ou novo de `c`.

Por isso o resultado é indeterminável na simulação.

O padrão correto é usar atribuição não bloqueante:

```systemverilog
always_ff @(posedge clk) begin
  c <= a + b;
end

always_ff @(posedge clk) begin
  d <= c;
end
```

Com `<=`, todos os registradores amostram valores antigos e atualizam juntos ao final do timestep, modelando melhor flip-flops reais.

---

## 19. SystemVerilog Enumerated Variables

O slide apresenta variáveis enumeradas.

### Criar tipos enumerados

Sintaxe do slide:

```systemverilog
typedef enum [val_type] {named_representation} type_e;
```

Observação:

```text
val_type defaults to int
```

Tradução:

```text
val_type tem int como padrão.
```

### Criar variáveis enum

Sintaxe:

```systemverilog
type_e var_name [=initial_value];
```

Observação:

```text
enum variables can be displayed as ASCII with %p radix
```

Tradução:

```text
variáveis enum podem ser exibidas como ASCII usando o formato %p.
```

### Exemplo do slide

```systemverilog
typedef enum {IDLE, INIT, START} state_enum;
// typedef enum logic[2:0] {IDLE=3'b010, INIT=3'b010, START=3'b100} state_enum;
// typedef enum logic[2:0] {state[3]} state_enum;

state_enum st, nxt;
$display("Current State = %p", st); // displays ASCII
```

### Interpretação

Enums são muito úteis para FSMs porque deixam o código mais legível.

Em vez de escrever:

```systemverilog
localparam IDLE  = 2'b00;
localparam INIT  = 2'b01;
localparam START = 2'b10;

logic [1:0] state, next_state;
```

podemos escrever:

```systemverilog
typedef enum logic [1:0] {
  IDLE,
  INIT,
  START
} state_enum;

state_enum state, next_state;
```

Vantagens:

```text
nomes de estado ficam explícitos;
debug fica mais legível;
waveform pode mostrar nomes;
evita números mágicos espalhados;
melhora manutenção do código.
```

Ponto importante do slide:

```text
se o tipo base não for especificado, enum usa int por padrão.
```

Isso pode ter impacto de largura em síntese. Para RTL, geralmente é melhor declarar a largura:

```systemverilog
typedef enum logic [1:0] {
  IDLE,
  INIT,
  START
} state_enum;
```

---

## Aula didática desenvolvida

### 1. `logic` não significa automaticamente registrador

Um erro comum é pensar:

```text
logic = registrador
wire = fio
```

Em SystemVerilog, `logic` é um tipo de dado que pode ser usado para sinais dirigidos proceduralmente.

Mas o que define se vira registrador é o contexto.

Exemplo combinacional:

```systemverilog
logic y;

always_comb begin
  y = a & b;
end
```

Aqui `y` não é flip-flop. É lógica combinacional.

Exemplo sequencial:

```systemverilog
logic q;

always_ff @(posedge clk) begin
  q <= d;
end
```

Aqui `q` vira flip-flop.

Regra:

```text
tipo do sinal ajuda a declarar uso;
estrutura do always define hardware inferido.
```

---

### 2. `output` sem tipo pode virar net

Quando você escreve:

```systemverilog
output d;
```

a saída tende a ser uma net, como `wire`.

Isso é adequado para atribuição contínua:

```systemverilog
assign d = a & b;
```

Mas não é adequado para:

```systemverilog
always_ff @(posedge clk)
  d <= a;
```

Para isso, declare:

```systemverilog
output logic d
```

---

### 3. `always_comb` é melhor que `always @(*)`

SystemVerilog introduz:

```systemverilog
always_comb
```

para declarar intenção combinacional.

Vantagens:

```text
lista de sensibilidade automática;
checagens melhores;
intenção mais clara;
ajuda a detectar problemas de atribuição;
melhor disciplina de RTL.
```

Mas `always_comb` não impede sozinho todo erro lógico. Se você não atribui uma saída em todos os caminhos, ainda pode haver problema de latch ou warning.

---

### 4. Como evitar latch em combinacional

Em combinacional, toda saída deve receber valor em todos os caminhos.

Padrão seguro:

```systemverilog
always_comb begin
  y = default_value;

  if (cond1)
    y = a;
  else if (cond2)
    y = b;
end
```

ou:

```systemverilog
always_comb begin
  y = default_value;

  case (sel)
    2'b00: y = a;
    2'b01: y = b;
    2'b10: y = c;
    2'b11: y = d;
  endcase
end
```

Se faltar default e faltar branch, a ferramenta pode precisar manter valor anterior:

```text
manter valor anterior = memória = latch
```

---

### 5. `priority` e `unique` são promessas ao compilador

Essas palavras-chave não são decoração.

Elas dizem à ferramenta:

```text
priority → existe uma ordem de prioridade intencional
unique   → os casos são mutuamente exclusivos
```

Se você usa `unique` quando as condições não são realmente exclusivas, pode causar diferença entre a intenção e a implementação otimizada.

Portanto:

```text
use priority quando há prioridade real;
use unique quando há exclusividade real;
não use para “forçar” a ferramenta sem garantir a condição.
```

---

### 6. Por que `X` não deve ser usado como default comum

Em síntese, `X` às vezes é tratado como don't care para otimização.

Em simulação, `X` significa desconhecido.

Isso gera tensão entre:

```text
otimização de síntese
fidelidade de simulação
debug do testbench
```

Por isso o slide alerta:

```text
DO NOT DO THIS
```

Prefira:

```systemverilog
priority case
unique case
default seguro
assertions
warnings de simulação
```

em vez de usar `X` como default para “ajudar” a síntese.

---

### 7. `always_ff` e bordas

Para registradores, use:

```systemverilog
always_ff @(posedge clk)
```

ou, com reset assíncrono:

```systemverilog
always_ff @(posedge clk or negedge rst_n)
```

Não use:

```systemverilog
always_ff @(clk)
```

para flip-flop, porque falta borda.

Não use:

```systemverilog
always_ff begin
```

porque falta event control.

---

### 8. Reset assíncrono versus síncrono

#### Reset assíncrono

O reset aparece na lista de sensibilidade:

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    q <= '0;
  else
    q <= d;
end
```

#### Reset ou set síncrono

O sinal aparece apenas dentro do bloco:

```systemverilog
always_ff @(posedge clk) begin
  if (!set_n)
    q <= 1'b1;
  else
    q <= d;
end
```

Regra:

```text
se está na event list com edge, é evento assíncrono;
se é testado dentro de posedge clk, é síncrono.
```

---

### 9. Atribuição não bloqueante em sequencial

Dentro de `always_ff`, use:

```systemverilog
<=
```

Exemplo correto:

```systemverilog
always_ff @(posedge clk) begin
  c <= a + b;
  d <= c;
end
```

Isso modela o comportamento de registradores reais:

```text
todos amostram ao mesmo tempo;
todos atualizam depois da borda.
```

Evite `=` em `always_ff` para registradores porque pode criar dependência de ordem de simulação e comportamento indeterminado.

---

### 10. Enums para FSM

Enums tornam FSMs mais seguras e legíveis.

Padrão recomendado:

```systemverilog
typedef enum logic [1:0] {
  IDLE,
  INIT,
  START
} state_enum;

state_enum state, next_state;
```

Exemplo de uso:

```systemverilog
always_comb begin
  next_state = state;

  case (state)
    IDLE:  next_state = INIT;
    INIT:  next_state = START;
    START: next_state = IDLE;
  endcase
end
```

O benefício é que o código passa a falar na linguagem do projeto:

```text
IDLE, INIT, START
```

em vez de números binários soltos.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **A atribuição `logic [7:0] unsigned data; data = -1;` é legal?**  
   Sim. O valor armazenado é o padrão de bits de `-1` em complemento de 2: `8'b1111_1111`.

2. **O que acontece se uma porta `output` não declara tipo e é dirigida em `always`?**  
   Ela pode ser tratada como net/wire, e nets não podem ser dirigidas por blocos procedurais.

3. **Como corrigir uma saída dirigida em `always_ff`?**  
   Declarar como `output logic`.

4. **Pode misturar estilo ANSI e non-ANSI na lista de portas?**  
   Não. Se a primeira porta não declara direção, a lista deve seguir estilo non-ANSI.

5. **O que significa `full` em case?**  
   Todos os possíveis branches do case foram codificados.

6. **O que significa `parallel` em case?**  
   Os branches são mutuamente exclusivos; lógica de prioridade não é necessária.

7. **Como evitar latch em `case` combinacional incompleto?**  
   Atribuir valores default antes do `case` ou cobrir todos os branches.

8. **Por que o slide alerta contra usar `'x` como default?**  
   Porque pode causar problemas em simulação e testbenches, embora pareça útil para síntese.

9. **Quando usar `priority case`?**  
   Quando há intenção real de prioridade entre os branches.

10. **Quando usar `unique case`?**  
    Quando os branches deveriam ser mutuamente exclusivos.

11. **O que `unique` pode gerar em simulação se a condição prometida não for satisfeita?**  
    Warning.

12. **Quando registradores são sintetizados segundo o slide?**  
    Quando todos os sinais na event list do `always` têm borda associada, como `posedge clk` e `negedge reset_n`.

13. **Qual construct é recomendado para registradores?**  
    `always_ff`.

14. **Qual atribuição é recomendada dentro de `always_ff`?**  
    Atribuição não bloqueante: `<=`.

15. **O que pode ocorrer se usar `=` em `always_ff`?**  
    Race condition de simulação ou mismatch entre pré-síntese e pós-síntese.

16. **Como codificar reset assíncrono ativo baixo?**  
    `always_ff @(posedge clk or negedge rst_n)` com `if (!rst_n)`.

17. **Como codificar set/reset síncrono?**  
    Apenas `@(posedge clk)` e o teste do set/reset dentro do bloco.

18. **O que acontece se um sinal aparece com edge na event list e é usado no primeiro `if`?**  
    Ele é interpretado como evento assíncrono.

19. **O que significa enum sem tipo base explícito?**  
    O tipo base padrão é `int`.

20. **Como exibir enum como nome/ASCII?**  
    Usando `%p`.

### Pegadinhas

- `unsigned` não impede armazenar o padrão de bits de `-1`.
- `logic` não significa automaticamente flip-flop.
- `output` sem tipo pode virar net.
- Net não pode ser atribuída dentro de `always`.
- `always_ff` precisa de event control com borda.
- `@(clk)` não é o mesmo que `@(posedge clk)`.
- Reset/set síncrono não deve estar na event list.
- `priority` e `unique` declaram intenção; não devem ser usados como truque.
- `unique` pode permitir otimização assumindo exclusividade; se a exclusividade for falsa, o problema é do código.
- Usar `'x` como default pode causar problemas sérios no testbench.
- `=` em bloco sequencial pode tornar resultado dependente de ordem de simulação.
- Enum sem largura explícita pode usar `int`, afetando largura.

### Frases para memorizar

```text
SystemVerilog permite declarar intenção de hardware.
always_comb declara lógica combinacional.
always_ff declara lógica sequencial.
priority declara prioridade.
unique declara exclusividade.
full significa que todos os branches possíveis estão codificados.
parallel significa que os branches são mutuamente exclusivos.
Em combinacional, toda saída deve ser dirigida em todos os caminhos.
Em sequencial, use always_ff com borda e atribuição <=.
Reset assíncrono aparece na event list; reset síncrono não.
Enum melhora legibilidade de FSMs.
```

---

## Relação com projeto/laboratório

Este bloco é diretamente aplicável ao código RTL.

### Checklist para portas

- [ ] Usar estilo ANSI de forma consistente.
- [ ] Declarar entradas e saídas com direção.
- [ ] Declarar saídas procedurais como `output logic`.
- [ ] Evitar misturar non-ANSI com ANSI.

### Checklist para combinacional

- [ ] Usar `always_comb`.
- [ ] Atribuir valor default às saídas.
- [ ] Cobrir todos os caminhos.
- [ ] Usar `priority` somente com prioridade real.
- [ ] Usar `unique` somente com exclusividade real.
- [ ] Evitar default `'x` para “ajudar” síntese.

### Checklist para registradores

- [ ] Usar `always_ff`.
- [ ] Usar `@(posedge clk)` ou `@(posedge clk or negedge rst_n)`.
- [ ] Usar `<=`.
- [ ] Não usar `=` para registradores.
- [ ] Reset assíncrono na event list.
- [ ] Reset/set síncrono dentro do bloco, não na event list.

### Checklist para FSM

- [ ] Usar `typedef enum logic [N:0]`.
- [ ] Declarar `state` e `next_state` com o tipo enum.
- [ ] Usar nomes de estado legíveis.
- [ ] Evitar enum sem largura quando estiver pensando em síntese.
- [ ] Usar `%p` para facilitar debug.

---

## Necessidade de áudio

**Médio.**

Os prints trazem a maior parte dos conceitos, mas a fala do professor poderia ajudar em:

- detalhes completos dos textos cortados nos self-checks;
- diferença exata esperada pelo curso entre `priority`, `unique` e relatórios `full/parallel`;
- comandos/diretivas Synopsys adicionais para set/reset síncrono;
- interpretação de alguns exemplos onde a imagem mostra apenas parte da explicação;
- sequência completa dos slides seguintes, que ficou fora desta parte por causa do roteiro.

Mesmo sem áudio, a parte A foi reconstruída com segurança pelos prints visíveis.

---

## Checklist de qualidade

- [x] Processado apenas até a parte combinada pelo roteiro: primeiros 25 prints/slides.
- [x] Ponto de parada respeitado: `SystemVerilog Enumerated Variables`.
- [x] Conteúdo posterior, a partir de FSM binária, não foi incluído neste bloco.
- [x] Duplicidades iniciais do DOCX foram evitadas na explicação.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Self-checks importantes foram incorporados com resposta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 028 — 01 SystemVerilog for RTL Design - parte B**

Usar o mesmo arquivo DOCX:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx
```

Começar a partir do conteúdo seguinte ao ponto de parada deste bloco:

```text
Binary Encoded FSM Example
```

Salvar como:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_B.md
```
