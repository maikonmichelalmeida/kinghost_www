# 02 Verilog for Synthesis

## Controle do bloco

- **Bloco:** 002
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\02 Verilog for Synthesis.docx`
- **Faixa de slides:** 1-22
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\02 Verilog for Synthesis.md`
- **Próximo bloco recomendado:** 003 — `03 Verilog for Verification`

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula explica a diferença entre **compilar código** e **sintetizar hardware**. Em programação comum, a compilação transforma um programa em código executável para uma máquina. Em Verilog para design digital, a síntese pega uma descrição **behavioral/RTL** e gera uma **netlist estrutural**, isto é, um circuito feito de células, portas e interconexões.

O ponto mais importante é que **o circuito sintetizado depende fortemente do estilo de escrita do RTL**. O mesmo comportamento lógico pode ser descrito com `if`, `case`, atribuições constantes, don't cares, prioridades explícitas ou lógica paralela. Cada escolha pode alterar área, atraso, potência e até a presença indesejada de latches.

A aula também destaca constructs que causam erro ou são ignorados na síntese, mostra como escrever blocos `always` combinacionais e sequenciais, explica a diferença entre lógica de prioridade e lógica paralela, apresenta boas práticas para FSMs e fecha com guidelines gerais para escrever Verilog sintetizável.

---

## Texto extraído e organizado por slide

### Slide 1 — Compilation vs. Synthesizability

O slide compara **compilation** e **synthesis**.

#### Compilation

A compilação verifica módulos codificados para as descrições de entrada e checa erros sintáticos e semânticos para execução da função.

Ela:

- reconhece todos os constructs possíveis de uma linguagem formalmente definida;
- traduz esses constructs para uma representação em linguagem de máquina;
- não tem impacto no hardware onde o programa roda;
- é seguida pela execução em uma plataforma computacional ou baseada em processador;
- gera um executável correspondente ao programa escrito;
- é comum em linguagens de programação de alto nível.

Fluxo conceitual:

```text
Source code
   ↓
Compilation
   ↓
Machine code
   ↓
Execution / interpretation
```

#### Synthesis

A síntese pega descrições **behavioral** e **RTL** dos módulos lógicos e as mapeia para portas lógicas padrão ou elementos de design equivalentes da tecnologia-alvo.

Ela:

- reconhece um subconjunto dependente do alvo dentro da linguagem de descrição de hardware;
- mapeia para uma coleção de recursos concretos de hardware;
- é uma ferramenta iterativa no fluxo de design;
- gera descrição estrutural de hardware dependendo do comportamento descrito ou do RTL;
- compila os modelos antes de mapeá-los para elementos padrão;
- executa visando células padrão ou FPGAs;
- produz desempenho dependente do estilo de codificação da descrição behavioral/RTL.

Fluxo conceitual:

```text
HDL / RTL design models
   ↓
Synthesis
   ↓
Design netlist
```

---

### Slide 2 — Logic Synthesis

Síntese lógica é o processo de escrever ou gerar um circuito lógico a partir da função ou descrição do circuito.

Pontos do slide:

- Pode haver várias formas de gerar a netlist para uma descrição lógica pretendida.
- A netlist depende da descrição comportamental em RTL.
- A síntese também otimiza a netlist para desempenho.

Possíveis problemas:

- A netlist gerada pela etapa de síntese pode não operar exatamente como esperado se o RTL for ambíguo ou mal escrito.
- Delays de células mapeadas afetam a netlist.
- Elementos adicionais de design podem ser necessários para fazer a netlist funcionar como pretendido.

O slide também menciona que a síntese lógica pode mirar FPGAs em fluxos de design de sistemas com FPGA.

Figura importante: mostra uma descrição de circuito, uma biblioteca de células padrão, a ferramenta de síntese e um circuito resultante. A mensagem visual é que a ferramenta não “traduz linha por linha”; ela escolhe células e estruturas para implementar a função.

---

### Slide 3 — Logic Synthesis in Cell-Based ASIC Design Flow

A síntese lógica é uma etapa dependente da ferramenta de síntese dentro do fluxo automatizado de design **cell-based**.

Benefícios listados:

- reduz bugs na geração de netlist;
- melhora produtividade do design;
- abstrai os dados de design, como descrição HDL/RTL, de uma tecnologia de implementação específica;
- permite ressintetizar o design visando diferentes tecnologias de chip;
- exemplo: implementar primeiro em FPGA e depois em ASIC;
- pode produzir design mais otimizado do que por meios manuais, por exemplo em logic optimization.

O slide enfatiza que o design do circuito é um tradeoff entre:

- **timing**
- **power**
- **area**

#### Área

Objetivo: área pequena.

#### Timing

Objetivo: atrasos pequenos.

#### Potência

Objetivo: baixo consumo de potência.

Figura importante: a mesma função `y = ab + cd` pode ser implementada com células diferentes, cada uma com potência diferente. O exemplo compara células com potência 2, 2.5 e 3 e mostra duas implementações com potências totais diferentes, algo como total power ≈ 6 versus total power ≈ 5.

---

### Slide 4 — VHDL RTL Features and Equivalent Hardware

> O título visual do slide aparece como **VHDL RTL Features and Equivalent Hardware**, embora o contexto da aula seja Verilog. O conteúdo é aplicável ao raciocínio de RTL em HDL.

Pontos principais:

- Operadores lógicos são mapeados para portas lógicas primitivas.
- Operadores aritméticos são mapeados para somadores e subtratores.
- Aritmética unsigned em complemento de 2 é simples.
- Modelar carry requer um bit adicional além da largura dos operandos.
- `*`, `%` e `/` não são diretamente mapeáveis de forma simples para hardware.
- Operadores relacionais geram comparadores.
- Shifts por quantidade constante são apenas conexões de fios.
- Shifts variáveis exigem circuito adicional.
- Expressão condicional gera lógica ou MUX.

Figura do slide:

```verilog
Y[5:0] = ~X[3:0] << 2
```

A figura mostra que o deslocamento constante por 2 não exige lógica ativa para os dois bits menos significativos: eles podem ser conectados a zero. Os bits restantes são derivados de inversões dos bits de `X`.

---

### Slide 5 — RTL Model Structure for Synthesis

O slide apresenta a estrutura de um modelo RTL Verilog para síntese.

Pontos principais:

- Ferramentas de síntese processam templates de estrutura de modelo.
- A ordem dos statements concorrentes é irrelevante; todos são analisados concorrentemente.
- Statements entre `begin` e `end` dentro de um bloco `always` são executados sequencialmente pelo simulador.
- Se forem non-blocking assignments (`<=`), resultam tipicamente em lógica sequencial.
- Blocking assignments (`=`) são usados para modelar lógica combinacional.
- Como regra, blocking e non-blocking não devem ser misturados dentro de um mesmo bloco `always`.
- Uma variável não deve ser atribuída em múltiplos blocos `always`.
- Statements dentro de `fork-join` em um `always` são executados concorrentemente na simulação.
- Alguns elementos precisam ser explicitamente modelados para síntese:
  - I/O pads;
  - clock generator;
  - modelos de MOS switch;
  - elementos específicos exigidos pelo fluxo.

Estrutura conceitual de módulo:

```verilog
module module_name (...);

  // Port declarations
  // followed by wire, reg, integer,
  // task and function declarations

  // Describe hardware with one or more:
  // - continuous assignments
  // - always blocks
  // - module instantiations
  // - gate instantiations

  assign ...;

  always @(...)
  begin
    // procedural statements
    // if statements
    // case statements
    // loops
    // user task/function calls
  end

  // Module instantiations
  // Gate primitive instantiations

endmodule
```

Exemplo visível de tri-state:

```verilog
module top (data_in, enable, data_out, PAD);
  input  data_in;
  input  enable;
  output data_out;
  inout  PAD;

  assign PAD      = enable ? data_out : 1'bz;
  assign data_in  = PAD;
endmodule
```

A ideia é mostrar que certos elementos de interface, como alta impedância em pinos, podem precisar aparecer explicitamente no modelo.

---

### Slide 6 — Verilog Constructs Resulting in Synthesis Errors

Constructs que podem resultar em erros de síntese:

#### Net types

- `trireg`, `wor`, `trior`
- `wand`, `triand`
- `tri0`, `tri1`
- charge strength

#### Register type

- `real`

#### Switches

- built-in unidirectional and bidirectional switches

#### Pull-up / pull-down

- pull-up statements
- pull-down statements

#### Procedural statements

- `assign` procedural, diferente de continuous assignment
- `deassign`
- `wait`

#### Named events

- named events
- event triggers

#### Outros

- UDPs — user-defined primitives
- `specify` blocks
- `force`
- `release`
- hierarchical net names

---

### Slide 7 — Verilog Constructs Ignored During Synthesis

Constructs que podem ser ignorados durante a síntese:

- delay, delay control and drive strength;
- scalar, vectors;
- initial block;
- compiler directives, exceto:
  - `` `define ``
  - `` `ifdef ``
  - `` `else ``
  - `` `endif ``
  - `` `include ``
  - `` `undef ``
- calls to system tasks and system functions.

Observação didática: o item “scalar, vectors” aparece no slide, mas deve ser interpretado com cuidado. Escalares e vetores são parte normal do RTL. O que a síntese ignora são aspectos de declaração que não alteram diretamente a estrutura de hardware pretendida ou atributos que não têm significado físico no contexto da ferramenta. Em prova, siga o texto do slide; tecnicamente, sinais escalares e vetoriais são sintetizáveis quando usados em lógica válida.

---

### Slide 8 — Verilog Always Block for Combinational Logic

Pontos principais:

- Todos os sinais de entrada usados em um bloco `always` combinacional devem estar explicitamente na lista de sensibilidade, em Verilog clássico.
- Blocos `always` com condições indefinidas para sinais inferem **latches**.
- O exemplo mostra um `case` incompleto.
- `out` não é atualizado quando `sel = 2'd2`.
- Um latch é inferido para manter o último valor de `out`.
- A opção de `case` ausente deve ser adicionada para evitar latch.
- Outra solução é adicionar `default`.
- A diretiva de síntese `full_case` trata `x` como don't care e otimiza a lógica.
- A diretiva `full_case` evita o latch, mas pode causar diferença entre simulação e síntese.
- Se uma variável não é atribuída dentro de um `always`, um latch é inferido.
- Quando `if/else` não cobre todas as condições, ou quando alguma opção do `case` está ausente, um latch pode ser inferido.

Exemplo problemático:

```verilog
module mux4to1 (out, a, b, c, d, sel);
  output out;
  input a, b, c, d;
  input [1:0] sel;
  reg out;

  always @(sel or a or b or c or d) begin
    case (sel)
      2'd0: out = a;
      2'd1: out = b;
      // 2'd2 não definido
      2'd3: out = d;
    endcase
  end
endmodule
```

Correção com caso faltante:

```verilog
always @(sel or a or b or c or d) begin
  case (sel)
    2'd0: out = a;
    2'd1: out = b;
    2'd2: out = c;
    2'd3: out = d;
  endcase
end
```

Correção com `default`:

```verilog
always @(sel or a or b or c or d) begin
  case (sel)
    2'd0: out = a;
    2'd1: out = b;
    2'd3: out = d;
    default: out = 1'bx;
  endcase
end
```

---

### Slide 9 — Verilog Nested if-else

Pontos principais:

- Um `if-else` aninhado em Verilog resulta em lógica de prioridade durante a síntese.
- No exemplo, o bit menos significativo `x[0]` recebe prioridade maior que `x[1]`.
- `x[1]` tem prioridade maior que `x[2]`.
- `x[2]` tem prioridade maior que `x[3]`.
- O modelo mostrado é de um **4-to-1 priority encoder**.
- Os circuitos gerados por `if-else` aninhado podem ter menor desempenho, pois são sequenciados.
- É preciso verificar se a intenção real era construir lógica com prioridade.

Exemplo reconstruído:

```verilog
always @(x) begin : encode
  if (x == 4'b0001)
    y = 2'b00;
  else if (x == 4'b0010)
    y = 2'b01;
  else if (x == 4'b0100)
    y = 2'b10;
  else if (x == 4'b1000)
    y = 2'b11;
  else
    y = 2'bxx;
end
```

A estrutura de hardware associada tende a formar uma cadeia de decisões, semelhante a uma sequência de multiplexadores ou condições encadeadas.

---

### Slide 10 — Verilog Case Statements

Pontos principais:

- Se lógica de prioridade não é desejada, a mesma função pode ser codificada usando `case`.
- O exemplo é novamente de um encoder 4-to-1.
- As condições de `case` são tratadas como paralelas quando a ferramenta consegue provar ou assumir exclusividade.
- A diretiva `parallel_case` não é requerida no exemplo simples do slide.

Exemplo:

```verilog
always @(x) begin : encode
  case (x)
    4'b0001: y = 2'b00;
    4'b0010: y = 2'b01;
    4'b0100: y = 2'b10;
    4'b1000: y = 2'b11;
    default: y = 2'bxx;
  endcase
end
```

A ideia é que cada padrão de entrada define uma saída sem encadear prioridades explícitas como no `if-else`.

---

### Slide 11 — Verilog Case Statements with Synthesis Optimization

Pontos principais:

- O sintetizador otimiza a lógica considerando atribuições constantes e técnicas de otimização booleana.
- A otimização também é possível com constructs Verilog de `if-else` aninhado.
- O slide mostra o circuito sintetizado do encoder e depois uma versão otimizada.

Mensagem central: a primeira netlist gerada pode ainda ser simplificada. A ferramenta consegue remover redundâncias, propagar constantes e reduzir lógica.

---

### Slide 12 — Verilog Conditional Case Statements with Synthesis Optimization

Ponto principal:

- Se apenas um bit `1` é garantido em `x[3:0]`, o designer pode obter otimização de circuito usando `if-else` aninhado, como mostrado no slide.

Exemplo:

```verilog
always @(x) begin : encode
  if (x == 4'b0001)
    y = 2'b00;
  else if (x == 4'b0010)
    y = 2'b01;
  else if (x == 4'b0100)
    y = 2'b10;
  else if (x == 4'b1000)
    y = 2'b11;
  else
    y = 2'bxx;
end
```

A suposição “apenas um bit será 1” muda a otimização possível. Quando a ferramenta sabe que as entradas são one-hot, ela pode simplificar bastante a lógica.

---

### Slide 13 — Verilog Case Statements with Synthesis Optimization

Pontos principais:

- O sintetizador otimiza a lógica se apenas um `1` é garantido em `x[3:0]`.
- A simulação da netlist bate com a simulação RTL.
- A diretiva de síntese `parallel_case` é requerida nesse exemplo; caso contrário, o sintetizador adiciona lógica extra para transformar o circuito em um encoder com prioridade.
- O `case` é avaliado a partir de baixo, segundo o slide.
- Sem `parallel_case`, o sintetizador adiciona lógica para formar priority encoder.
- O circuito sem `parallel_case` é semelhante ao modelo com `if-else`.

Exemplo conceitual do slide com diretiva:

```verilog
always @(x) begin : encode
  case (x) // synthesis parallel_case
    4'b0001: y = 2'b00;
    4'b0010: y = 2'b01;
    4'b0100: y = 2'b10;
    4'b1000: y = 2'b11;
    default: y = 2'bxx;
  endcase
end
```

Observação didática: diretivas como `parallel_case` e `full_case` podem ajudar otimização, mas são perigosas se a suposição de exclusividade ou cobertura completa não for verdadeira.

---

### Slide 14 — Verilog Sequential Constructs and Synthesis

O slide mostra um D flip-flop com set/reset síncrono.

Pontos principais:

- `always @(posedge clk)` gera flip-flop com reset síncrono, como mostrado.
- Deve ser codificado para ter lógica de prioridade.
- Flip-flops diferentes no mesmo domínio de clock devem ter reset comum.

Exemplo reconstruído:

```verilog
module srff (q, d, clk, set, reset);
  input d, clk, set, reset;
  output q;
  reg q;

  always @(posedge clk) begin
    if (reset)
      q <= 0;
    else if (set)
      q <= 1;
    else
      q <= d;
  end
endmodule
```

Interpretação:

- O reset só é testado na borda de clock.
- Portanto, o reset é **síncrono**.
- `reset` tem prioridade sobre `set`.
- `set` tem prioridade sobre `d`.

---

### Slide 15 — Non-synthesizable Verilog Code Styles

O slide lista problemas comuns encontrados em modelos Verilog.

Problemas de síntese:

- sinais dirigidos em múltiplos blocos `always`;
- múltiplos clocks usados no mesmo bloco `always`;
- tasks não são chamadas em blocos sequenciais e combinacionais;
- múltiplos enable bits usados para controlar um bloco `always` combinacional.

Exemplo problemático com múltiplos clocks no mesmo bloco:

```verilog
module top (clk1, clk2, rst, data, out);
  input clk1, clk2, rst, data;
  output out;

  reg q;

  always @(clk1 or clk2 or rst or data) begin
    if (rst)
      q <= 1'b0;
    else if (clk1 == 1 || clk2 == 0)
      q <= data;
  end

  assign out = q;
endmodule
```

Problema: o bloco mistura clocks/condições de forma que não representa um template claro de flip-flop para síntese.

Exemplo com enable vetorial em lógica combinacional:

```verilog
module top (enable, data, out);
  input [3:0] enable;
  input data;
  output out;
  reg q;

  always @(enable or data)
    if (enable)
      q <= data;

  assign out = q;
endmodule
```

Problema: se `enable` for zero, `q` mantém valor anterior. Isso infere latch. Além disso, usar `<=` em lógica combinacional é estilo ruim; o ideal seria atribuir todos os caminhos com `=`.

---

### Slide 16 — Verilog FSM and Synthesis

O slide apresenta guidelines para FSMs.

Boas práticas:

- FSM deve ter reset.
- Use blocos `always` separados para:
  - parte sequencial;
  - parte combinacional.
- Represente estados com labels definidos ou tipos enumerados.
- Use `case` em um bloco `always` para implementar:
  - lógica de próximo estado;
  - lógica de saída.
- Sempre use `default case`.
- No `default`, atribua a variável de estado e a saída para `bx` quando adequado.
- Isso evita latches implícitos.
- Permite uso de don't cares, levando a lógica simplificada.
- A ferramenta de síntese pode recodificar os estados.

Exemplo reconstruído:

```verilog
module FSM (clk, rst, enable, data_in, data_out);
  input clk, rst, enable;
  input data_in;
  output data_out;

  // Defined state encoding; style preferred over `defines
  parameter default = 2'bxx;
  parameter idle    = 2'b00;
  parameter read    = 2'b01;
  parameter write   = 2'b10;

  reg data_out;
  reg [1:0] state, next_state;

  // Sequential logic
  always @(posedge clk) begin
    if (rst)
      state <= idle;
    else
      state <= next_state;
  end

  // Next-state and output logic
  always @(state or enable or data_in) begin
    case (state)
      idle: begin
        data_out = 1'b0;
        if (enable)
          next_state = read;
        else
          next_state = idle;
      end

      read: begin
        // ...
      end

      write: begin
        // ...
      end

      default: begin
        next_state = default;
        data_out   = 1'bx;
      end
    endcase
  end
endmodule
```

---

### Slide 17 — General Guidelines for Verilog Modeling for Synthesis

Diretrizes gerais:

- Não instancie componentes ou portas diretamente no modelo de design, a menos que seja necessário.
- Complete a lista de sensibilidade com todas as entradas dependentes em um bloco `always`.
- Não misture lógica de borda positiva e borda negativa em blocos procedurais.
- Use diretivas de compilador apropriadas para forçar lógica independente da tecnologia quando necessário.
- Use atribuições imediatas/blocking (`=`) dentro de blocos `always` combinacionais.
- Use atribuições delayed/nonblocking (`<=`) dentro de blocos `always` sequenciais.
- Defina todas as condições quando usar `if-else` e `case`; caso contrário, use `default` em `case`.
- Use `` `define `` para constantes globais.
- Mantenha constantes globais em arquivo separado.
- Use `parameter` para constantes locais.
- Evite expressões lógicas ao passar valores por portas durante instanciação de módulos.
- Garanta que o nome do sinal comunique seu significado ou o valor de uma variável sem ser excessivamente verboso.
- Use estilo consistente de nomes, capitalização e separação de palavras.

---

### Slide 18 — Questão 1

**Questão:** Synthesized logic circuit hardly depends on the Verilog RTL model.

**Tradução:** O circuito lógico sintetizado quase não depende do modelo RTL Verilog.

**Resposta correta:** False.

**Justificativa:** A aula mostra o contrário: a netlist sintetizada depende fortemente da descrição RTL, do estilo de codificação, das estruturas usadas (`if`, `case`, `default`, don't cares, constantes), das constraints e da biblioteca-alvo.

---

### Slide 19 — Questão 2

**Questão:** ______ statement in Verilog RTL results in priority logic.

Alternativas:

- A. Case
- B. Nested if-else
- C. Simple if-else

**Resposta correta:** B. Nested if-else.

**Tradução:** A instrução `nested if-else` em Verilog RTL resulta em lógica de prioridade.

**Justificativa:** `if-else` aninhado cria uma cadeia de decisões: a primeira condição tem prioridade sobre a segunda, a segunda sobre a terceira, e assim por diante.

---

### Slide 20 — Questão 3

**Questão:** ______ logic can be realized using both assign and always procedural statements.

Alternativas:

- A. Combinational
- B. Sequential
- C. State machine

**Resposta correta:** A. Combinational.

**Tradução:** Lógica combinacional pode ser realizada usando tanto `assign` quanto statements procedurais `always`.

**Justificativa:** Lógica combinacional simples pode ser escrita com `assign`, por exemplo `assign y = a & b;`, ou dentro de um `always @(*)`, desde que todas as saídas sejam atribuídas em todos os caminhos.

---

### Slide 21 — Questão 4

**Questão:** Reset signal is added in sensitivity list to realize a D flip-flop with ______.

Alternativas:

- A. Synchronous reset
- B. Active low reset
- C. Asynchronous reset

**Resposta correta:** C. Asynchronous reset.

**Tradução:** O sinal de reset é adicionado à lista de sensibilidade para realizar um flip-flop D com reset assíncrono.

**Justificativa:** Se o reset aparece na lista de sensibilidade junto com o clock, por exemplo:

```verilog
always @(posedge clk or posedge reset)
```

então o reset pode atuar independentemente da borda de clock. Isso caracteriza reset assíncrono.

---

### Slide 22 — Questão 5

**Questão:** Use of ______ in the design helps optimization during synthesis.

Alternativas:

- A. Don't cares
- B. Constant assignments
- C. Both a and b

**Resposta correta:** C. Both a and b.

**Tradução:** O uso de don't cares e atribuições constantes no design ajuda a otimização durante a síntese.

**Justificativa:** Don't cares permitem que o sintetizador escolha valores convenientes para reduzir lógica. Atribuições constantes permitem propagação de constantes, remoção de portas desnecessárias e simplificação booleana.

---

## Aula didática desenvolvida

### 1. Compilar não é sintetizar

A primeira grande distinção da aula é esta:

```text
Compilação → prepara código para execução em uma máquina.
Síntese → transforma descrição RTL em hardware.
```

Quando se compila um programa em C, Python interpretado, Java ou outra linguagem, o objetivo é fazer uma sequência de instruções rodar em uma plataforma existente. O hardware já está pronto: processador, memória, barramentos e periféricos. O compilador só transforma o programa em algo executável por essa máquina.

Na síntese digital, o cenário é diferente. O objetivo é criar uma estrutura de hardware que implemente o comportamento descrito. Quando escrevemos:

```verilog
assign y = a & b;
```

a ferramenta não gera uma instrução de máquina “faça AND”. Ela gera ou escolhe uma estrutura física: uma porta AND, uma célula equivalente da biblioteca, ou uma combinação lógica otimizada.

Por isso, a síntese é muito mais dependente da tecnologia-alvo e da forma como o RTL foi escrito.

---

### 2. A síntese reconhece templates, não “qualquer Verilog”

Um simulador tenta executar a semântica da linguagem Verilog. Uma ferramenta de síntese procura padrões que ela sabe transformar em hardware.

Exemplo claro de template sequencial:

```verilog
always @(posedge clk) begin
  q <= d;
end
```

A ferramenta reconhece isso como:

```text
flip-flop D acionado na borda de subida
```

Exemplo claro de template combinacional:

```verilog
always @(*) begin
  y = a & b;
end
```

A ferramenta reconhece como:

```text
porta AND combinacional
```

Mas um código como:

```verilog
initial begin
  #10 q = 1'b1;
end
```

não corresponde a um hardware ASIC comum. Ele descreve uma ação de simulação: depois de 10 unidades de tempo, atribuir valor. Sem clock, contador, máquina de estados ou circuito físico equivalente, a síntese não tem um template direto.

---

### 3. A mesma função pode virar circuitos diferentes

Considere a função:

```verilog
assign y = (a & b) | (c & d);
```

Ela pode virar:

- duas ANDs e uma OR;
- uma célula complexa AOI/OAI, dependendo da biblioteca;
- uma estrutura balanceada para timing;
- uma estrutura menor para área;
- uma estrutura com menor capacitância para potência.

Se a biblioteca tiver uma célula pronta que implementa a função, o sintetizador pode usá-la. Se a constraint de timing for agressiva, pode escolher células maiores e mais rápidas. Se a meta for potência, pode escolher células menores ou reestruturar a lógica.

Por isso, a síntese não é tradução textual. Ela é mapeamento + otimização.

---

### 4. PPA: power, performance/timing e area

O slide de cell-based ASIC design flow destaca que design digital é tradeoff entre:

```text
Power  → consumo
Timing → atraso/desempenho
Area   → tamanho físico
```

Uma implementação pequena pode ser lenta. Uma implementação rápida pode consumir mais potência. Uma implementação de baixa potência pode exigir mais ciclos ou ter menor desempenho.

Exemplo conceitual:

```text
Célula pequena:
- menor área
- menor potência
- maior atraso

Célula grande:
- maior área
- maior potência
- menor atraso
```

Durante a síntese, as constraints dizem à ferramenta o que priorizar. Se o clock for apertado, a ferramenta otimiza timing. Se houver limite de área, tenta reduzir células. Se houver análise de potência, tenta reduzir switching, capacitância e uso de células grandes.

---

### 5. Operadores RTL e hardware equivalente

Alguns operadores têm mapeamento simples.

#### AND, OR, XOR, NOT

```verilog
assign y = a & b;
assign z = a | b;
assign p = a ^ b;
assign n = ~a;
```

Virarão portas lógicas ou células equivalentes.

#### Soma e subtração

```verilog
assign sum = a + b;
assign diff = a - b;
```

Virarão somadores e subtratores.

#### Comparação

```verilog
assign gt = (a > b);
assign eq = (a == b);
```

Virarão comparadores.

#### Shift constante

```verilog
assign y = x << 2;
```

Se o deslocamento é constante, pode virar apenas reconexão de fios e preenchimento com zeros. Não precisa de barrel shifter.

#### Shift variável

```verilog
assign y = x << shamt;
```

Agora precisa de circuito para escolher quantas posições deslocar. Isso pode virar um barrel shifter, que é muito mais caro.

#### Multiplicação, divisão e módulo

```verilog
assign p = a * b;
assign q = a / b;
assign r = a % b;
```

Multiplicação pode ser sintetizada, mas pode gerar circuito grande. Divisão e módulo por variável são mais pesados e nem sempre mapeados diretamente como o iniciante imagina. Para prova, o slide enfatiza que `*`, `%` e `/` não são diretamente mapeáveis a hardware simples.

---

### 6. Bloco `always` combinacional e latch inferido

Um erro clássico em Verilog para síntese é escrever lógica combinacional incompleta.

Exemplo problemático:

```verilog
always @(*) begin
  if (sel)
    y = a;
end
```

Quando `sel = 1`, `y = a`. Mas quando `sel = 0`, o que acontece com `y`?

Se o código não diz, a ferramenta entende:

```text
mantenha o valor anterior de y
```

Para manter valor, precisa de memória. A memória combinacional mais comum inferida nesse caso é um latch.

Correção:

```verilog
always @(*) begin
  if (sel)
    y = a;
  else
    y = b;
end
```

Agora `y` recebe valor em todos os caminhos. Não precisa guardar valor anterior.

Outra forma:

```verilog
always @(*) begin
  y = b;      // valor padrão
  if (sel)
    y = a;
end
```

Esse estilo é muito usado para evitar latch: atribuir valor default no início do bloco.

---

### 7. `case` incompleto também infere latch

Exemplo problemático:

```verilog
always @(*) begin
  case (sel)
    2'd0: y = a;
    2'd1: y = b;
    2'd3: y = d;
  endcase
end
```

Falta `2'd2`. Quando `sel = 2'd2`, `y` não é atribuído.

Correção completa:

```verilog
always @(*) begin
  case (sel)
    2'd0: y = a;
    2'd1: y = b;
    2'd2: y = c;
    2'd3: y = d;
  endcase
end
```

Ou com `default`:

```verilog
always @(*) begin
  case (sel)
    2'd0: y = a;
    2'd1: y = b;
    2'd3: y = d;
    default: y = c;
  endcase
end
```

Para RTL de síntese, o princípio é:

```text
Toda saída combinacional deve receber valor em todo caminho possível.
```

---

### 8. `if-else` aninhado cria prioridade

Este código:

```verilog
always @(*) begin
  if (x[0])
    y = 2'b00;
  else if (x[1])
    y = 2'b01;
  else if (x[2])
    y = 2'b10;
  else if (x[3])
    y = 2'b11;
  else
    y = 2'bxx;
end
```

significa:

```text
x[0] tem prioridade sobre x[1]
x[1] tem prioridade sobre x[2]
x[2] tem prioridade sobre x[3]
```

Se `x[0]` e `x[3]` forem 1 ao mesmo tempo, vence `x[0]`.

Isso é ótimo quando você quer um priority encoder. Mas é ruim se você queria lógica paralela sem prioridade. A prioridade cria uma cadeia lógica que pode aumentar atraso.

---

### 9. `case` pode representar lógica paralela

Este código:

```verilog
always @(*) begin
  case (x)
    4'b0001: y = 2'b00;
    4'b0010: y = 2'b01;
    4'b0100: y = 2'b10;
    4'b1000: y = 2'b11;
    default: y = 2'bxx;
  endcase
end
```

descreve padrões específicos. Se a ferramenta sabe que `x` é one-hot, pode otimizar bastante.

Mas há uma sutileza: se houver possibilidade de mais de um padrão ser verdadeiro, ou se os padrões usarem wildcards, a ferramenta precisa decidir se a lógica é paralela ou prioritária. Diretivas como `parallel_case` indicam uma intenção, mas também podem ser perigosas.

---

### 10. `full_case` e `parallel_case`: úteis, mas perigosos

#### `full_case`

Diz à ferramenta que todos os casos relevantes foram cobertos. Se não foram, a síntese pode otimizar assumindo que os casos faltantes nunca ocorrem.

Risco: a simulação RTL pode se comportar diferente da netlist.

#### `parallel_case`

Diz à ferramenta que os casos são mutuamente exclusivos. Ou seja, não há sobreposição.

Risco: se houver sobreposição real, a síntese pode remover lógica necessária.

Resumo prático:

```text
Não use full_case/parallel_case para esconder RTL incompleto.
Use default, cubra os casos e deixe a intenção clara.
```

---

### 11. Reset síncrono versus assíncrono

#### Reset síncrono

```verilog
always @(posedge clk) begin
  if (reset)
    q <= 1'b0;
  else
    q <= d;
end
```

O reset só atua na borda de subida do clock. Por isso é síncrono.

#### Reset assíncrono

```verilog
always @(posedge clk or posedge reset) begin
  if (reset)
    q <= 1'b0;
  else
    q <= d;
end
```

Aqui o reset está na lista de sensibilidade. Se `reset` subir, o bloco executa mesmo sem borda de clock. Por isso é assíncrono.

Questão de prova:

```text
Reset signal is added in sensitivity list → asynchronous reset.
```

---

### 12. Múltiplos clocks no mesmo bloco são problema

Um template saudável:

```verilog
always @(posedge clk) begin
  q <= d;
end
```

Um template problemático:

```verilog
always @(clk1 or clk2 or rst or data) begin
  if (rst)
    q <= 1'b0;
  else if (clk1 == 1 || clk2 == 0)
    q <= data;
end
```

Isso mistura clocks como se fossem sinais combinacionais. A ferramenta pode não reconhecer um flip-flop válido ou pode inferir lógica indesejada. Em RTL de síntese, cada bloco sequencial deve ter um clock claro.

---

### 13. FSM bem escrita

Uma FSM robusta normalmente tem dois blocos ou três blocos.

#### Bloco sequencial de estado

```verilog
always @(posedge clk or posedge rst) begin
  if (rst)
    state <= IDLE;
  else
    state <= next_state;
end
```

#### Bloco combinacional de próximo estado e saída

```verilog
always @(*) begin
  next_state = state;
  out = 1'b0;

  case (state)
    IDLE: begin
      if (enable)
        next_state = READ;
    end

    READ: begin
      out = 1'b1;
      next_state = WRITE;
    end

    WRITE: begin
      next_state = IDLE;
    end

    default: begin
      next_state = IDLE;
      out = 1'b0;
    end
  endcase
end
```

Por que isso é bom?

- evita latch;
- separa memória de lógica combinacional;
- facilita debug;
- facilita síntese;
- facilita recodificação de estados pela ferramenta;
- facilita análise de timing.

---

## Conceitos difíceis explicados em profundidade

### 1. Synthesizability

**Synthesizability** é a capacidade de um trecho Verilog ser convertido em hardware real por uma ferramenta de síntese.

Exemplo sintetizável:

```verilog
assign y = (a & b) | c;
```

Exemplo não sintetizável para RTL ASIC comum:

```verilog
always begin
  #5 clk = ~clk;
end
```

O segundo exemplo cria clock em simulação. Um chip real precisa de fonte de clock física, PLL, oscilador ou entrada externa. A síntese não cria um oscilador simplesmente porque viu `#5`.

---

### 2. Constructs que dão erro versus constructs ignorados

Nem todo problema aparece da mesma forma.

#### Pode dar erro

Exemplo:

```verilog
real gain;
```

`real` não representa uma estrutura digital comum para síntese lógica.

#### Pode ser ignorado

Exemplo:

```verilog
#10 y = a;
```

O sintetizador pode ignorar o `#10`. Isso é perigoso porque o RTL simulado pode parecer ter uma temporização que não existirá no hardware.

#### Pode sintetizar algo indesejado

Exemplo:

```verilog
always @(*) begin
  if (enable)
    q = data;
end
```

A ferramenta pode inferir latch. Não é erro de sintaxe. É hardware real, mas talvez não era o que você queria.

---

### 3. Latch inferido

Um latch aparece quando uma saída combinacional precisa manter valor anterior.

O padrão mental é:

```text
Se em algum caminho a variável não recebe valor,
a ferramenta entende que ela deve lembrar o valor anterior.
Memória para lembrar → latch.
```

Exemplo:

```verilog
always @(*) begin
  if (a)
    y = b;
end
```

Caminho sem atribuição:

```text
a = 0 → y não recebe valor
```

Correção:

```verilog
always @(*) begin
  y = 1'b0;
  if (a)
    y = b;
end
```

---

### 4. One-hot e otimização

Um vetor one-hot tem exatamente um bit em 1 por vez.

Exemplos válidos para 4 bits:

```text
0001
0010
0100
1000
```

Exemplos inválidos:

```text
0000
0011
1110
```

Se a ferramenta sabe que a entrada é one-hot, pode simplificar um encoder. Por exemplo:

```verilog
case (x)
  4'b0001: y = 2'b00;
  4'b0010: y = 2'b01;
  4'b0100: y = 2'b10;
  4'b1000: y = 2'b11;
endcase
```

Com a suposição one-hot, não é necessário criar lógica para resolver o que acontece quando `x = 4'b0011`, porque isso nunca deveria ocorrer. Essa liberdade permite otimização.

---

### 5. Don't care

Don't care é uma situação em que o designer informa que determinado valor não importa.

Em Verilog, frequentemente aparece como:

```verilog
y = 2'bxx;
```

Em síntese, `x` pode ser usado como liberdade de otimização. A ferramenta escolhe 0 ou 1 conforme reduza área, atraso ou potência.

Exemplo:

```verilog
default: y = 2'bxx;
```

Isso pode ajudar síntese se o estado ou entrada default for realmente inalcançável. Mas se esse caso ocorrer na prática, o hardware terá um comportamento escolhido pela ferramenta, não necessariamente o que você esperava na simulação.

---

### 6. Atribuições constantes

Atribuições constantes ajudam a síntese porque permitem simplificação booleana.

Exemplo:

```verilog
assign y = a & 1'b0;
```

A ferramenta simplifica para:

```verilog
assign y = 1'b0;
```

Outro exemplo:

```verilog
assign y = a | 1'b1;
```

Simplifica para:

```verilog
assign y = 1'b1;
```

Esse processo é chamado de constant propagation ou constant folding, dependendo do contexto.

---

### 7. Blocking e non-blocking no contexto de síntese

A guideline do slide é:

```text
Combinacional → blocking =
Sequencial → non-blocking <=
```

#### Combinacional

```verilog
always @(*) begin
  temp = a & b;
  y = temp | c;
end
```

Aqui faz sentido usar `=`, porque `y` deve usar o valor recém-calculado de `temp`.

#### Sequencial

```verilog
always @(posedge clk) begin
  q1 <= d;
  q2 <= q1;
end
```

Aqui faz sentido usar `<=`, porque todos os flip-flops capturam valores antigos na mesma borda de clock.

Se usar `=` em lógica sequencial, você pode criar diferença entre simulação e intenção de hardware.

---

### 8. Sensitivity list

Em Verilog clássico, para lógica combinacional, a lista de sensibilidade deve conter todos os sinais lidos.

Ruim:

```verilog
always @(a or b) begin
  y = a & b & c;
end
```

Se `c` mudar, o bloco pode não reexecutar na simulação RTL, causando divergência.

Bom:

```verilog
always @(a or b or c) begin
  y = a & b & c;
end
```

Melhor em Verilog moderno:

```verilog
always @(*) begin
  y = a & b & c;
end
```

O `@(*)` deixa o simulador inferir todos os sinais lidos.

---

### 9. FSM e recodificação de estados

Quando você escreve:

```verilog
parameter IDLE  = 2'b00;
parameter READ  = 2'b01;
parameter WRITE = 2'b10;
```

a ferramenta pode preservar essa codificação ou recodificar, dependendo das configurações.

Ela pode escolher:

- binário;
- one-hot;
- gray;
- codificação otimizada para timing;
- codificação otimizada para área.

Isso significa que o importante no RTL é descrever corretamente a transição entre estados, não depender de bits físicos específicos de estado, a menos que o fluxo exija isso.

---

## Figuras, diagramas e waveforms importantes

### Comparação compilation versus synthesis

A figura coloca lado a lado código fonte virando machine code e RTL virando design netlist. Essa comparação é central: programação comum gera instruções; síntese gera circuito.

### Figura de logic synthesis

Mostra uma descrição de circuito, células padrão e a ferramenta gerando uma implementação. Ela reforça que a síntese usa uma biblioteca de elementos disponíveis.

### Figura de otimização de potência

Mostra que a mesma função pode consumir potências diferentes dependendo da escolha das células e da estrutura lógica. Isso antecipa conceitos de PPA.

### Figura do shift constante

A figura `Y[5:0] = ~X[3:0] << 2` mostra que shift constante pode virar conexão de fios e inversores, sem circuito complexo.

### Figura de latch inferido

O exemplo do `case` incompleto mostra que ausência de atribuição em uma combinação de entrada força armazenamento. Esse é um dos diagramas mais importantes da aula.

### Figura do nested if-else

Mostra uma cadeia de prioridade. Visualmente, a lógica é sequenciada: uma condição bloqueia ou precede a próxima.

### Figura do case paralelo

Mostra uma estrutura mais paralela, útil quando prioridade não é desejada. O contraste com `if-else` é essencial para prova.

### Figuras de `parallel_case`

Mostram que, com `parallel_case`, a ferramenta pode gerar uma estrutura mais simples; sem ele, pode gerar encoder de prioridade com lógica extra.

### Figura da FSM

Mostra a separação entre bloco sequencial de estado e bloco combinacional de próximo estado/saída. Essa estrutura é uma das bases de RTL limpo.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Synthesized logic circuit hardly depends on the Verilog RTL model. True or false?**  
   Resposta: **False**.

2. **Which statement in Verilog RTL results in priority logic?**  
   Resposta: **Nested if-else**.

3. **Which logic can be realized using both `assign` and `always` procedural statements?**  
   Resposta: **Combinational logic**.

4. **Reset signal added in sensitivity list realizes D flip-flop with what kind of reset?**  
   Resposta: **Asynchronous reset**.

5. **Use of what helps optimization during synthesis?**  
   Resposta: **Both don't cares and constant assignments**.

6. **What does logic synthesis generate from RTL?**  
   Resposta: **Design netlist / gate-level netlist**.

7. **What happens if an output is not assigned in every path of a combinational `always`?**  
   Resposta: **Latch inference**.

8. **What is the recommended assignment style?**  
   Resposta: `=` em combinacional e `<=` em sequencial.

9. **What does a nested `if-else` imply?**  
   Resposta: **Priority logic**.

10. **What is the purpose of `default` in a `case` statement?**  
    Resposta: cobrir casos não especificados e evitar latch.

### Pegadinhas

- Simular corretamente não garante sintetizar corretamente.
- `if-else` aninhado não é equivalente a `case` paralelo em termos de hardware.
- `case` incompleto pode inferir latch.
- `default: y = x` pode ajudar otimização, mas só é seguro quando o caso é realmente don't care.
- `parallel_case` pode melhorar otimização, mas pode mascarar erro de modelagem.
- `full_case` pode criar diferença entre simulação e síntese.
- Reset na lista de sensibilidade indica reset assíncrono.
- Reset apenas dentro de `posedge clk` indica reset síncrono.
- `#delay` pode ser aceito pelo simulador, mas não deve ser usado como temporização de hardware sintetizável.
- Misturar clocks no mesmo bloco procedural é mau estilo e pode ser não sintetizável.

### Frases para memorizar

```text
RTL sintetizável é escrito em templates reconhecíveis pela ferramenta.
A netlist depende do estilo RTL.
Lógica combinacional incompleta infere latch.
Nested if-else gera prioridade.
Case pode representar lógica paralela.
Don't cares e constantes ajudam otimização.
Reset na sensitivity list é assíncrono.
```

---

## Relação com projeto/laboratório

Esta aula é diretamente útil para os labs de RTL e para o uso de ferramentas Synopsys.

### Relação com VCS

O VCS simula o RTL. Ele pode aceitar constructs que a síntese não aceita, como:

```verilog
initial
#delay
$display
$finish
```

Portanto, passar na simulação não prova que o código é sintetizável.

### Relação com Design Compiler

O Design Compiler espera RTL em templates claros. Ele transforma:

```text
RTL → generic logic → mapped netlist
```

Código ambíguo pode gerar:

- latches;
- prioridade indesejada;
- lógica maior;
- timing pior;
- warning;
- erro de síntese;
- diferença entre RTL simulation e gate-level simulation.

### Relação com Makefile

Em labs, o Makefile pode ter alvos diferentes:

```text
simulação RTL
síntese
simulação gate-level
visualização de waveform
```

Um arquivo pode funcionar na simulação RTL e falhar na síntese. Esta aula explica por quê.

### Relação com debug em waveform

Se aparecer valor preso ou comportamento estranho, suspeite de:

- latch inferido;
- falta de `default`;
- falta de atribuição em caminho combinacional;
- lista de sensibilidade incompleta;
- uso incorreto de `= / <=`;
- reset mal modelado;
- prioridade não intencional.

### Relação com projeto RTL real

Para escrever RTL limpo:

- use `always @(*)` para combinacional;
- use `always @(posedge clk...)` para sequencial;
- atribua defaults em blocos combinacionais;
- evite clocks múltiplos no mesmo bloco;
- separe FSM em lógica sequencial e combinacional;
- pense no hardware que o código descreve.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

**Bloco 003 — 03 Verilog for Verification**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\03 Verilog for Verification.docx
```

Faixa:

```text
Slides 1-17
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\03 Verilog for Verification.md
```
