# 01 Verilog Introduction

## Controle do bloco

- **Bloco:** 001
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\01 Verilog Introduction.docx`
- **Faixa de slides:** 1-17
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\01 Verilog Introduction.md`
- **Próximo bloco recomendado:** 002 — `02 Verilog for Synthesis`

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula é uma introdução ao papel do **Verilog** na descrição de circuitos digitais. Ela começa revisando blocos lógicos básicos, como portas combinacionais, multiplexadores, registradores, contadores, memórias e máquinas de estados. Depois conecta esses blocos aos níveis de abstração usados em projeto digital: **behavioral modeling**, **RTL modeling** e **structural/gate-level modeling**.

O ponto central é entender que Verilog não é uma linguagem de programação comum. Ele descreve hardware. Um trecho de código Verilog pode representar lógica combinacional, registradores, portas, conexões, atrasos de simulação ou até comandos de testbench. Por isso, a pergunta mais importante da aula é: **isso vira circuito real ou só serve para simulação?**

A aula também apresenta os principais **constructs** da linguagem: `module`, portas, `wire`, `reg`, `assign`, blocos `always`, blocos `initial`, operadores, delays, funções, tasks, diretivas de compilação, controle de simulação e constructs não sintetizáveis. Para estudo e prova, o foco é distinguir **RTL sintetizável** de recursos úteis apenas em simulação/verificação.

---

## Texto extraído e organizado por slide

### Slide 1 — Review of Logic Blocks

Um **logic block** representa uma função lógica na qual as saídas são geradas pela avaliação de um conjunto de entradas.

Circuitos digitais trabalham com blocos lógicos. Os tipos principais são:

- **Combinational**
- **Sequential**

Exemplos de blocos lógicos:

- **Standard combinational logic gates**
  - AND
  - OR
  - NOT
  - XOR
  - NOR
  - NAND
  - XNOR
- **Standard sequential logic gates**
  - D FF
  - D-Latch
  - T FF
  - SR FF
  - etc.

Blocos lógicos podem ser definidos por:

- **Truth table**
- **Timing diagram**
- **Logic function / Boolean equation**

Figuras do slide:

- Figura 1: portas combinacionais.
- Figura 2: elementos sequenciais.
- Figura 3: tabelas verdade.
- Figura 4: diagramas de tempo.

---

### Slide 2 — Basic Building Blocks of Digital Logic Blocks

Blocos básicos de circuitos digitais:

- Standard logic gates
- Multiplexers/demultiplexers
- Encoders/decoders
- Sequential circuits
- Arithmetic logic circuits
- Timers and counters
- FIFOs/register arrays and on-chip memories
- Finite state machines

Figuras do slide:

- Portas lógicas padrão.
- Mux/Demux.
- Encoder/Decoder.
- Portas ou células sequenciais.
- Blocos aritméticos e contadores.
- FIFOs e arrays de registradores.
- Máquina de estados finitos.

---

### Slide 3 — Design Abstractions and Verilog

A aula apresenta três estilos ou níveis de modelagem.

#### Behavioral modeling

- Descreve um sistema pelo seu comportamento concorrente.
- As funções podem ser sequenciais ou concorrentes.
- Exemplos:
  - functions
  - tasks
  - `always` blocks
- Blocos sequenciais geralmente são usados para simulação.
- Não é necessário conhecer a estrutura interna do design.
- Para gerar hardware real, a descrição precisa ser convertida para uma descrição estrutural pela síntese.
- Os constructs usados no modelo precisam ser sintetizáveis para entrar no fluxo de síntese.

#### RTL level modeling

- RTL significa **Register-Transfer Level**.
- O projeto especifica as características do circuito por meio de operações e transferência de dados entre registradores.
- Um sinal de clock é necessário para temporizar eventos no modelo de design.
- O RTL contém limites temporais exatos, pois processos funcionais são agendados para ocorrer em tempos definidos.
- Em resumo: um modelo Verilog sintetizável normalmente é um modelo em nível RTL.

#### Structural modeling

- Modelo construído com células lógicas e interconexões.
- Os sinais são discretos e assumem valores lógicos como:
  - `0`
  - `1`
  - `X`
  - `Z`
- A função do bloco é predefinida usando células lógicas básicas, como AND, OR e NOT.
- Modelagem em nível de portas fica difícil para circuitos complexos, pois não é facilmente compreensível para humanos.
- A netlist gate-level é gerada por ferramentas de síntese e vira o ponto inicial do physical design.

Mensagem final do slide:

- Verilog suporta níveis de abstração de modelagem para o design.

---

### Slide 4 — RTL Design Modeling

O modelo RTL representa blocos de dados que executam operações:

- lógicas;
- aritméticas;
- de controle;
- de fluxo de dados;
- de armazenamento em registradores intermediários.

O design é modelado usando uma **HDL — Hardware Description Language**.

HDLs mais usadas:

- Verilog
- SystemVerilog
- VHDL

O exemplo do slide mostra um diagrama de bloco e os modelos RTL de um multiplexador de 32 bits.

Exemplo reconstruído de multiplexador 2:1 em Verilog:

```verilog
module mux (a, b, s, z);
  input [31:0] a, b;
  input s;
  output [31:0] z;

  assign z = ~(s ? b : a);
endmodule
```

A ideia do slide é mostrar que um bloco físico, como um mux, pode ser descrito em RTL de forma textual. A síntese depois transforma essa descrição em portas reais.

---

### Slide 5 — Gate-Level Design Modeling

A modelagem em nível de portas representa o projeto executando operações lógicas, aritméticas e de controle em sistemas digitais.

Características:

- Representa o design usando portas lógicas padrão.
- Também é chamada de **structural modeling**.
- Normalmente, a ferramenta de síntese gera a netlist a partir do modelo behavioral ou RTL.
- A netlist pode ser escrita pelas ferramentas de síntese em:
  - Verilog
  - SystemVerilog
  - VHDL

O exemplo mostra o diagrama de bloco e a netlist de um multiplexador de 32 bits. Essa netlist pode ser implementada de muitas formas, dependendo das células disponíveis na biblioteca **GTECH** e das otimizações aplicadas.

Exemplo conceitual de netlist gate-level para um mux simples:

```verilog
module mux2_gate (
  input  wire a,
  input  wire b,
  input  wire sel,
  output wire y
);

  wire nsel;
  wire a_path;
  wire b_path;

  not U1 (nsel, sel);
  and U2 (a_path, a, nsel);
  and U3 (b_path, b, sel);
  or  U4 (y, a_path, b_path);

endmodule
```

Esse código não descreve a intenção abstrata “se `sel` então escolha `b`, senão escolha `a`”. Ele já descreve a estrutura: inversor, portas AND, OR e fios intermediários.

---

### Slide 6 — Verilog Constructs (1/6)

O slide introduz constructs básicos de Verilog.

#### Verilog module

Exemplo:

```verilog
module mux (a, b, s, z);
  input [31:0] a, b;
  input s;
  output [31:0] z;

  assign z = ~(s ? b : a);
endmodule
```

Um `module` é a unidade básica de projeto em Verilog. Ele define:

- nome do bloco;
- portas de entrada;
- portas de saída;
- sinais internos;
- comportamento ou estrutura interna.

#### Parallel or concurrent statements

O slide mostra que Verilog possui blocos que existem em paralelo no hardware:

```verilog
module mydesign (a, b, s, z);
  input [31:0] a, b;
  input s;
  output [31:0] z;

  initial begin
    // sequential statements
  end

  always begin
    // sequential statements
  end

  assign z = ~(s ? b : a);
endmodule
```

Importante: dentro de um bloco `initial` ou `always`, as instruções são executadas de modo sequencial pelo simulador. Mas os próprios blocos existem em paralelo no design.

#### Basic data types

- **Nets:** continuously driven.
- **Logic changes as driver changes.**

Exemplo:

```verilog
wire [31:0] my_net1, my_net2;

assign my_net1 = a;              // unconditional
assign my_net2 = ~(s ? b : a);   // conditional
```

#### Registers

Registradores representam armazenamento:

- Guardam o último valor atribuído.
- São usados em blocos procedurais.
- Em Verilog clássico, `reg` não significa necessariamente flip-flop físico; significa uma variável procedural que mantém valor entre atribuições.

Exemplo reconstruído:

```verilog
reg [31:0] my_reg1, my_reg2;

always @(posedge clk or reset) begin
  if (reset)
    my_reg1 = 0;
  else begin
    my_reg1 = a;

    if (s)
      my_reg2 = a;
    else
      my_reg2 = b;
  end
end
```

Observação importante: em RTL sequencial moderno, é preferível usar non-blocking assignment (`<=`) em blocos clockados.

---

### Slide 7 — Verilog Constructs (2/6)

O slide apresenta statements sequenciais e exemplos de controle de simulação.

#### `if` / `else`

```verilog
if (reset)
  my_reg1 = 0;
else
  my_reg1 = d;
```

#### `case`

```verilog
case (sel)
  2'b00: f = a;
  2'b01: f = b;
  2'b10: f = c;
  2'b11: f = d;
endcase
```

#### `initial`, `forever` e geração de clock

```verilog
initial begin
  clk = 1'b0;
  forever #10 clk = ~clk;
end
```

Esse tipo de código é típico de testbench, não de lógica sintetizável. Ele cria um clock na simulação.

#### `repeat`

```verilog
repeat (4) @(posedge clk);

data_out <= data;

repeat (5) @(posedge clk);
```

Uso comum em testbenches: esperar alguns ciclos de clock antes de aplicar ou observar estímulos.

#### `while`

```verilog
while (cnt < 100) begin
  // sequential statements
end
```

#### `wait`

```verilog
wait (!oen)
#10 data_out = data;
```

`wait` espera uma condição se tornar verdadeira. Normalmente é recurso de simulação/testbench.

#### Event control

```verilog
@(negedge clk)
```

O simulador espera uma borda de descida do clock.

#### `begin` / `end`

Agrupam comandos sequenciais em um bloco.

#### `fork` / `join`

```verilog
fork
  #5 my_reg1 = data1;
  #5 my_reg2 = data2;
join
```

`fork/join` inicia comandos em paralelo dentro da simulação. É muito usado em testbench, mas não é parte típica de RTL sintetizável.

---

### Slide 8 — Verilog Constructs (3/6)

O slide apresenta quatro grupos: gate primitives, operations, delays e declarations/attributes.

#### Gate primitives

Exemplos de primitivas de porta:

```verilog
and  u1 (out, in1, in2);
or   u2 (out, in1, in2);
nand u3 (out, in1, in2);
nor  u4 (out, in1, in2);
xor  u5 (out, in1, in2);
xnor u6 (out, in1, in2);
not  u7 (out, in);
buf  u8 (out, in);
```

Também aparecem primitivas como:

```verilog
bufif0
bufif1
notif0
notif1
pulldown
pullup
```

Essas primitivas são mais próximas de modelagem estrutural/gate-level.

#### Operations

Operadores apresentados no slide:

```verilog
{a, b}       // concatenation
+, -, *, /   // arithmetic
%            // modulus
>>, <<       // shift
!, ~         // logical / bitwise negation
&&, ||       // logical operators
==, !=       // equality / inequality
===, !==     // case equality / case inequality
<, >, <=, >= // relational
&            // reduction AND
~&           // reduction NAND
|            // reduction OR
~|           // reduction NOR
^            // reduction XOR
~^, ^~       // reduction XNOR
? :          // conditional operator
```

#### Delays

Exemplos:

```verilog
and #10 u1 (in1, in2, out);       // single delay
and #(5,4) u2 (in1, in2, out);    // rise/fall delay
buf #(3,4,5) u3 (in, out);        // rise, fall, turnoff
```

Delays são importantes em simulação, principalmente em modelos temporais. Em RTL para síntese, delays com `#` normalmente não são sintetizáveis.

#### Declarations and attributes

O slide mostra estruturas como:

```verilog
specify
  specparam thold = 3, tsetup = 5;
  // timing checks
endspecify
```

Exemplo conceitual:

```verilog
$setup(data, posedge clk, t_setup);
$hold(posedge clk, data, t_hold);
```

`specify` blocks e timing checks são recursos usados em modelos temporais, bibliotecas e simulação, não como RTL comum de projeto.

---

### Slide 9 — Verilog Constructs (4/6)

#### Memories

O slide mostra uma memória declarada como array:

```verilog
module mem_test;
  reg [7:0] my_memory [1:10];
  integer i;

  initial begin
    $readmemh("data.dat", my_memory);

    for (i = 0; i < 10; i = i + 1)
      $display("my_memory[%0d] = %h", i, my_memory[i]);
  end
endmodule
```

O arquivo `data.dat` contém valores de memória. O comando `$readmemh` lê valores em hexadecimal. O slide também menciona `$readmemb`, usado para ler valores binários.

Observação: inicializar memória com arquivo é comum em simulação. Em FPGA e alguns fluxos específicos pode haver suporte a inicialização, mas em ASIC synthesis isso depende fortemente da ferramenta, biblioteca e metodologia.

#### Blocking and non-blocking statements

O slide destaca a diferença entre:

```verilog
=
```

e:

```verilog
<=
```

Exemplo com blocking assignment:

```verilog
always @(posedge clk)
  a = b;

always @(posedge clk)
  b = a;
```

Esse estilo pode produzir condição de corrida em simulação, porque a ordem de execução entre blocos `always` concorrentes pode afetar o resultado.

Exemplo com non-blocking assignment:

```verilog
always @(posedge clk)
  a <= b;

always @(posedge clk)
  b <= a;
```

Aqui os valores são amostrados no mesmo instante lógico e atualizados depois. Isso modela melhor flip-flops operando na mesma borda de clock.

#### Functions

Características listadas:

- Executam em tempo zero de simulação.
- Podem ser aninhadas com outras funções, mas não com tasks.
- Não contêm timing, delay nem event control statements.
- Precisam ter pelo menos um argumento de entrada.
- Podem ter muitas entradas.
- Sempre retornam um único valor.
- Não podem ter argumento `output` ou `inout`.

Exemplo:

```verilog
function cal_parity;
  input [31:0] address;
  begin
    cal_parity = ^address;
  end
endfunction
```

O operador `^address` faz redução XOR sobre os bits de `address`, calculando paridade.

---

### Slide 10 — Verilog Constructs (5/6)

#### Tasks

Tasks são mais flexíveis que functions.

Características:

- Podem chamar outra task ou function.
- Podem consumir tempo de simulação.
- Podem conter delay, event control e time control statements.
- Podem ter zero ou mais argumentos.
- Podem ter argumentos dos tipos:
  - input
  - output
  - inout
- Não retornam valor diretamente como uma function.
- Podem passar múltiplos valores por argumentos `output` e `inout`.

Exemplo conceitual baseado no slide:

```verilog
task packet_read;
  input        clock;
  input  [7:0] data_in;
  input        data_valid;
  output [7:0] header;
  output       header_valid;
  output       payload_valid;

  reg [7:0] payload;
  reg [1:0] i;

  always @(posedge clock) begin
    if (data_valid == 1'b1) begin
      if (i == 1'b0) begin
        header <= data_in;
        header_valid <= 1'b1;
      end
      else begin
        payload <= data_in;
        payload_valid <= 1'b1;
      end

      i = i + 1;
    end
    else begin
      i = 2'b00;
      header_valid <= 1'b0;
      payload_valid <= 1'b0;
    end
  end
endtask
```

Observação técnica: uma task pode conter controle de tempo, mas em RTL sintetizável é preciso cuidado. Muitas tasks são usadas em testbenches, especialmente para encapsular sequências de estímulos.

---

### Slide 11 — Verilog Constructs (6/6)

O slide traz três grupos: compiler directives, response checking e simulation control.

#### Compiler directives

Exemplos visíveis:

```verilog
`define word_size 32
`include defs.v
`timescale 1ns/1ps
`ifdef
`else
`endif
```

Uso típico:

```verilog
`define word_size 32

module and_op (out, in1, in2);
  input  [`word_size-1:0] in1, in2;
  output [`word_size-1:0] out;

`ifdef behavior
  assign out = in1 & in2;
`else
  and u1 (out, in1, in2);
`endif

endmodule
```

Ponto importante: diretivas de compilador usam crase/backtick, como em `` `define ``. Elas não são system tasks com `$`.

#### Response checking

Exemplos:

```verilog
$display("value of variable: %h", data_in);
```

Dump de dados para arquivo:

```verilog
integer file;
initial file = $fopen("file_out.dat");

always @(...) begin
  $fwrite(file, data);
  $fclose(file);
end
```

Monitoramento:

```verilog
$monitor($time, "a=%b, b=%b, y=%b", a, b, y);
```

Esses recursos são usados para debug e checagem em simulação.

#### Simulation control

Exemplos:

```verilog
initial begin
  $dumpfile("test.vcd");
  $dumpvars;

  #100 $dumpoff;
  #500 $dumpon;
  $stop;
  $finish;
end
```

Função dos comandos:

- `$dumpfile`: define o arquivo de waveform.
- `$dumpvars`: escolhe sinais para dump.
- `$dumpoff`: desliga o dump.
- `$dumpon`: religa o dump.
- `$stop`: pausa a simulação para debug.
- `$finish`: termina a simulação.

---

### Slide 12 — Verilog Non-Synthesizable Constructs

O slide lista constructs que não são sintetizáveis ou normalmente não pertencem ao RTL de síntese.

#### Declarations and definitions

- `time`
- `event`
- tipos de net como `triand`, `trior`, `tri0`, `tri1`, `trireg`
- ranges e arrays de integers
- primitive definitions

#### Statements

- `initial`
- delay statements
- event control
- wait statements
- repeat statements
- fork statement
- deassign
- force
- release
- defparam

#### Operators

- division and modulus operators for variables
- case equality and inequality:
  - `===`
  - `!==`

#### Gate-level constructs

- `pullup`
- `pulldown`
- `tranif0`
- `tranif1`
- `rtran`
- `rtranif0`
- `rtranif1`

#### Other constructs

- compiler directives such as:
  - `` `ifdef ``
  - `` `endif ``
  - `` `else ``
- hierarchical names in the module

Ponto central: Verilog tem muitos recursos úteis para simulação, modelagem e testbench, mas nem todos viram hardware real.

---

### Slide 13 — Questão 1

**Questão:** All Verilog constructs are synthesizable.

**Tradução:** Todos os constructs de Verilog são sintetizáveis.

**Resposta correta:** False.

**Justificativa:** A aula mostrou uma lista de constructs não sintetizáveis, como `initial`, delays `#`, `wait`, `fork/join`, `$display`, `$monitor`, `$finish`, diretivas de compilação e recursos de controle de simulação. Portanto, nem tudo que é aceito pelo simulador pode ser convertido em hardware.

---

### Slide 14 — Questão 2

**Questão:** Verilog supports describing functionality in which procedures can be:

Alternativas:

- A. Sequential
- B. Combinational
- C. Concurrent

**Resposta correta do curso:** C. Concurrent.

**Tradução:** Verilog suporta a descrição de funcionalidade em que os procedimentos podem ser concorrentes.

**Justificativa:** Verilog descreve hardware, e hardware opera de forma paralela. Mesmo que comandos dentro de um bloco procedural sejam executados sequencialmente pelo simulador, vários blocos `always`, `initial`, `assign` e instâncias de módulos existem simultaneamente.

---

### Slide 15 — Questão 3

**Questão:** ______ is input to synthesis tool to generate ______.

Alternativas:

- A. RTL design, design netlist
- B. Netlist, gates
- C. RTL design, RTL timing

**Resposta correta:** A. RTL design, design netlist.

**Tradução:** O design RTL é entrada para a ferramenta de síntese para gerar a netlist do design.

**Justificativa:** O fluxo ensinado é: o projetista escreve RTL sintetizável; a ferramenta de síntese transforma esse RTL em uma netlist estrutural/gate-level composta por células e conexões.

---

### Slide 16 — Questão 4

**Questão:** `$_______` is the system task in Verilog.

Alternativas:

- A. define
- B. if else
- C. while

**Resposta aceita pelo curso:** A. define.

**Tradução:** `$_______` é a system task em Verilog.

**Justificativa para prova:** O curso marcou `define` como resposta correta.

**Observação técnica importante:** há uma inconsistência na formulação. Em Verilog, `` `define `` usa crase/backtick e é uma **diretiva de compilador**, não uma system task com `$`. System tasks reais usam `$`, como `$display`, `$monitor`, `$finish`, `$fopen`, `$fwrite`, `$dumpfile` e `$dumpvars`. Para o banco do curso, porém, a resposta esperada nessa questão é `define`.

---

### Slide 17 — Questão 5

**Questão:** `` `timescale `` in Verilog defines ______.

Alternativas:

- A. Local time, simulation time
- B. Simulation time unit and precision
- C. Time resolution and accuracy

**Resposta correta:** B. Simulation time unit and precision.

**Tradução:** `` `timescale `` em Verilog define a unidade de tempo da simulação e a precisão.

Exemplo:

```verilog
`timescale 1ns/1ps
```

Interpretação:

- `1ns`: unidade de tempo usada nos delays.
- `1ps`: precisão/resolução de arredondamento da simulação.

Exemplo:

```verilog
#10
```

Com `` `timescale 1ns/1ps ``, `#10` significa 10 ns.

---

## Aula didática desenvolvida

### 1. A ideia fundamental: Verilog descreve hardware

Uma linguagem de programação comum descreve uma sequência de instruções executadas por um processador. Verilog é diferente: ele descreve circuitos. Quando escrevemos:

```verilog
assign z = a & b;
```

não estamos dizendo “o processador deve calcular `a & b` e colocar em `z`”. Estamos descrevendo uma conexão lógica contínua: sempre que `a` ou `b` mudarem, `z` deve refletir a operação AND.

Essa diferença é a base da aula. Verilog pode parecer software, mas o resultado esperado no fluxo de design é hardware: portas, fios, multiplexadores, registradores, memórias e máquinas de estado.

---

### 2. Blocos combinacionais e sequenciais

Circuitos digitais são construídos a partir de dois grandes tipos de blocos.

#### Blocos combinacionais

Um bloco combinacional não tem memória. A saída depende apenas das entradas atuais.

Exemplo:

```verilog
assign y = (sel) ? b : a;
```

Esse código descreve um multiplexador. Se `sel = 0`, escolhe `a`; se `sel = 1`, escolhe `b`.

Outros exemplos:

- AND
- OR
- XOR
- Decoders
- Encoders
- Somadores
- Comparadores
- Multiplexadores

#### Blocos sequenciais

Um bloco sequencial tem memória. A saída depende de estado armazenado, normalmente atualizado por clock.

Exemplo:

```verilog
always @(posedge clk) begin
  q <= d;
end
```

Esse código descreve um flip-flop D. Na borda de subida do clock, o valor de `d` é armazenado em `q`.

Outros exemplos:

- registradores;
- contadores;
- FIFOs;
- máquinas de estados;
- pipelines;
- bancos de registradores.

---

### 3. Behavioral, RTL e estrutural

A aula separa os níveis de descrição.

#### Behavioral

No nível behavioral, a preocupação principal é “o que o bloco faz”. Pode ser uma descrição de alto nível, útil para simulação ou modelagem.

Exemplo:

```verilog
initial begin
  a = 0;
  b = 1;
  #10 a = 1;
  #20 b = 0;
end
```

Esse código é behavioral e útil em testbench, mas não representa diretamente um circuito sintetizável.

#### RTL

No nível RTL, a descrição já se aproxima de hardware real. O foco está em:

- registradores;
- clock;
- reset;
- lógica combinacional entre registradores;
- transferência de dados.

Exemplo:

```verilog
always @(posedge clk or posedge reset) begin
  if (reset)
    q <= 1'b0;
  else
    q <= d;
end
```

Esse é um exemplo típico de RTL sintetizável.

#### Structural / Gate-level

No nível estrutural, o circuito é descrito por instâncias e conexões.

Exemplo:

```verilog
and U1 (y, a, b);
```

Aqui a porta AND é instanciada explicitamente. Em projetos grandes, escrever tudo assim manualmente seria impraticável. Por isso o fluxo normal é escrever RTL e deixar a síntese gerar a estrutura.

---

### 4. O fluxo essencial: RTL entra, netlist sai

O fluxo apresentado na aula pode ser resumido assim:

```text
RTL Verilog/SystemVerilog/VHDL
        ↓
Ferramenta de síntese
        ↓
Gate-level netlist
        ↓
Physical design
```

A ferramenta de síntese recebe uma descrição RTL e tenta implementar a mesma funcionalidade usando células da biblioteca tecnológica.

Por exemplo, este RTL:

```verilog
assign y = sel ? b : a;
```

pode virar uma estrutura parecida com:

```verilog
not U1 (nsel, sel);
and U2 (a_path, a, nsel);
and U3 (b_path, b, sel);
or  U4 (y, a_path, b_path);
```

Na prática, a síntese pode usar uma célula de mux pronta da biblioteca, se ela existir e for vantajosa para área, timing ou potência.

---

### 5. Concorrência em Verilog

Este é um ponto essencial para não confundir Verilog com software.

Exemplo:

```verilog
assign y1 = a & b;
assign y2 = c | d;
assign y3 = y1 ^ y2;
```

Essas atribuições existem ao mesmo tempo. No hardware, não há uma “linha 1, depois linha 2, depois linha 3” como em software tradicional. Existem redes lógicas conectadas.

Também podemos ter vários blocos `always`:

```verilog
always @(posedge clk) begin
  q1 <= d1;
end

always @(posedge clk) begin
  q2 <= d2;
end
```

Esses dois blocos representam dois comportamentos simultâneos. Na mesma borda de clock, os dois registradores podem ser atualizados.

---

### 6. `wire`, `reg` e a confusão clássica

Em Verilog clássico:

- `wire` representa uma rede/conexão continuamente dirigida.
- `reg` representa uma variável procedural que guarda valor entre atribuições.

Mas `reg` não significa automaticamente “registrador físico”.

Exemplo combinacional usando `reg`:

```verilog
reg y;

always @(*) begin
  y = a & b;
end
```

Esse código usa `reg`, mas pode sintetizar uma porta AND, não um flip-flop.

Exemplo sequencial usando `reg`:

```verilog
reg q;

always @(posedge clk) begin
  q <= d;
end
```

Agora `q` provavelmente sintetiza um flip-flop.

A diferença não está só no tipo `reg`, mas no tipo de bloco e na sensibilidade ao clock.

---

### 7. `assign` versus `always`

#### `assign`

Usado para atribuição contínua:

```verilog
assign y = a & b;
```

Boa escolha para lógica combinacional simples.

#### `always @(*)`

Usado para lógica combinacional procedural:

```verilog
always @(*) begin
  if (sel)
    y = b;
  else
    y = a;
end
```

Também descreve lógica combinacional, desde que todas as saídas sejam atribuídas em todos os caminhos.

#### `always @(posedge clk)`

Usado para lógica sequencial:

```verilog
always @(posedge clk) begin
  q <= d;
end
```

Descreve armazenamento sincronizado por clock.

---

### 8. Blocking `=` e non-blocking `<=`

A aula toca em um dos pontos mais importantes de Verilog.

#### Blocking assignment

```verilog
a = b;
```

A atribuição acontece imediatamente no fluxo procedural. A próxima linha já enxerga o novo valor.

Uso típico:

- lógica combinacional em `always @(*)`;
- cálculos temporários dentro de um bloco.

#### Non-blocking assignment

```verilog
a <= b;
```

A atribuição é agendada para ocorrer depois, no fim do timestep de simulação. Todos os lados direitos são avaliados antes das atualizações.

Uso típico:

- lógica sequencial clockada.

Regra prática:

```text
Combinacional: use =
Sequencial clockado: use <=
```

Exemplo clássico:

```verilog
always @(posedge clk) begin
  a <= b;
  b <= a;
end
```

Esse código troca os valores de `a` e `b` na mesma borda de clock. Se fosse usado `=`, o comportamento poderia ser diferente na simulação.

---

### 9. Constructs de simulação não são necessariamente hardware

A aula mostra vários comandos úteis, como:

```verilog
$display
$monitor
$finish
$dumpfile
$dumpvars
$readmemh
```

Esses comandos ajudam a simular, debugar e verificar. Mas eles não viram portas lógicas no chip.

Exemplo:

```verilog
initial begin
  $display("Iniciando simulação");
  #100;
  $finish;
end
```

Esse código faz sentido para o simulador. Não faz sentido para um ASIC físico. Um chip não “dá `$finish`”.

---

### 10. A fronteira mais importante da aula

A aula inteira prepara a seguinte separação mental:

```text
Verilog para descrever hardware sintetizável:
- module
- input/output
- wire/reg
- assign
- always @(*)
- always @(posedge clk)
- if/case sintetizáveis
- operadores lógicos e aritméticos suportados

Verilog para simulação/testbench:
- initial
- #delay
- wait
- fork/join
- $display
- $monitor
- $finish
- $dumpfile
- $readmemh
- tasks com controle de tempo
```

Essa distinção vai voltar em praticamente todos os cursos seguintes: simulação, testbench, síntese, Design Compiler, VCS, Verdi e verificação formal.

---

## Conceitos difíceis explicados em profundidade

### 1. O que significa “sintetizável”?

Um código Verilog é sintetizável quando a ferramenta consegue transformá-lo em hardware real.

Exemplo sintetizável:

```verilog
assign y = a & b;
```

Hardware correspondente: uma porta AND.

Exemplo não sintetizável:

```verilog
initial begin
  #10 y = 1'b1;
end
```

Esse código depende de tempo absoluto de simulação. A ferramenta de síntese não tem como criar um circuito genérico que “espere exatamente 10 unidades de tempo de simulação” sem uma estrutura física explícita, como clock e contador.

A pergunta correta durante o estudo é:

```text
Este comando descreve uma estrutura de hardware ou apenas uma ação do simulador?
```

---

### 2. RTL não é simplesmente “código Verilog”

RTL é uma forma específica de escrever hardware. O foco é representar:

- onde os dados são armazenados;
- em qual borda de clock são transferidos;
- qual lógica combinacional calcula o próximo valor;
- como reset e controle atuam.

Exemplo típico:

```verilog
always @(posedge clk or posedge rst) begin
  if (rst)
    count <= 4'd0;
  else
    count <= count + 1'b1;
end
```

Esse código mostra claramente:

- registrador: `count`;
- evento de atualização: `posedge clk`;
- reset: `posedge rst`;
- próxima função de estado: `count + 1`.

Isso é RTL.

---

### 3. Por que gate-level é difícil para humanos?

Imagine um mux simples escrito em RTL:

```verilog
assign y = sel ? b : a;
```

É fácil entender: se `sel` for 1, `y = b`; senão, `y = a`.

Agora veja a versão estrutural:

```verilog
not U1 (nsel, sel);
and U2 (a_path, a, nsel);
and U3 (b_path, b, sel);
or  U4 (y, a_path, b_path);
```

Ainda dá para entender. Mas em um processador, uma controladora ou um SoC, a netlist pode ter milhões de células. A leitura direta fica inviável. Por isso humanos escrevem RTL e ferramentas geram gate-level.

---

### 4. `initial` é proibido em síntese?

Como regra de estudo para este curso: trate `initial` como **não sintetizável**.

Ele é típico de testbench:

```verilog
initial begin
  clk = 0;
  forever #5 clk = ~clk;
end
```

Esse bloco cria clock em simulação. Em hardware real, o clock vem de fora ou de um circuito físico específico. A ferramenta de síntese comum para ASIC não transforma esse `forever #5` em um oscilador físico.

Observação técnica: alguns fluxos de FPGA aceitam inicialização de registradores/memórias com `initial`, mas isso é dependente da tecnologia. Para o curso e para ASIC, a regra segura é: `initial` pertence ao mundo de simulação/testbench.

---

### 5. `#delay` não é delay físico sintetizável

Exemplo:

```verilog
assign #10 y = a & b;
```

Isso significa que o simulador deve atrasar a atualização de `y` em 10 unidades de tempo. Mas a síntese não usa esse `#10` para dimensionar portas. O atraso real do circuito virá da biblioteca, das células, das cargas, da interconexão e do physical design.

No fluxo ASIC, timing é tratado por:

- constraints;
- bibliotecas `.lib`;
- análise estática de timing;
- otimização de síntese;
- placement/routing;
- extração parasitária.

Não por `#10` no RTL.

---

### 6. `===` e `!==` versus `==` e `!=`

Em Verilog existem valores especiais:

- `0`
- `1`
- `X` desconhecido
- `Z` alta impedância

O operador `==` compara de forma lógica comum, mas pode produzir `X` quando há desconhecidos.

O operador `===` faz comparação incluindo `X` e `Z`.

Exemplo:

```verilog
if (a === 1'bx)
  $display("a está desconhecido");
```

Isso é muito útil em testbench e debug. Mas o slide lista `===` e `!==` como não sintetizáveis no contexto do curso. Para RTL de síntese, use comparações que façam sentido em hardware real com `0` e `1`.

---

### 7. Functions versus tasks

#### Function

Uma function deve executar em tempo zero e retornar um único valor.

Exemplo:

```verilog
function parity;
  input [7:0] data;
  begin
    parity = ^data;
  end
endfunction
```

Uso:

```verilog
assign p = parity(data_in);
```

#### Task

Uma task pode consumir tempo e retornar valores por argumentos.

Exemplo de testbench:

```verilog
task send_byte;
  input [7:0] data;
  begin
    tx_valid = 1'b1;
    tx_data  = data;
    @(posedge clk);
    tx_valid = 1'b0;
  end
endtask
```

Essa task espera clock. Portanto, ela é muito mais natural em testbench.

Resumo:

```text
function: calcula algo e retorna um valor, sem consumir tempo.
task: executa uma sequência, pode esperar tempo/eventos e pode produzir múltiplas saídas.
```

---

### 8. `$display`, `$monitor`, `$dumpfile` e `$finish`

Esses comandos são chamados de **system tasks** ou **system functions**, dependendo do caso. Eles começam com `$`.

Exemplos:

```verilog
$display("valor = %b", valor);
```

Imprime uma mensagem no console da simulação.

```verilog
$monitor("tempo=%0t a=%b b=%b y=%b", $time, a, b, y);
```

Monitora mudanças nos sinais.

```verilog
$dumpfile("wave.vcd");
$dumpvars;
```

Gera arquivo de waveform.

```verilog
$finish;
```

Termina a simulação.

Esses comandos são fundamentais para aprender Verilog e depurar testbenches, mas não viram circuito.

---

### 9. Diretivas de compilador

Diretivas de compilador são processadas antes da simulação/síntese propriamente dita. Elas começam com crase/backtick.

Exemplo:

```verilog
`define WIDTH 8
```

Uso:

```verilog
wire [`WIDTH-1:0] data;
```

Outra diretiva importante:

```verilog
`include "defs.v"
```

Ela inclui outro arquivo no ponto em que aparece.

Condicionais:

```verilog
`ifdef SIMULATION
  initial $display("Modo simulação");
`endif
```

Essas diretivas controlam como o código é compilado. Elas não representam, por si só, hardware.

---

### 10. `` `timescale ``

A diretiva:

```verilog
`timescale 1ns/1ps
```

define:

```text
unidade de tempo / precisão
```

Se a unidade é `1ns`, então:

```verilog
#10
```

significa 10 ns.

Se a precisão é `1ps`, o simulador arredonda eventos temporais para resolução de 1 ps.

Isso importa em testbenches, delays, geração de clock e modelos temporais. Em RTL sintetizável, o ideal é não depender de delays `#`.

---

## Figuras, diagramas e waveforms importantes

### Figura de portas combinacionais

Mostra portas básicas como AND, OR, NAND, NOR, XOR, XNOR, buffer, inversor e diodo. A utilidade dessa figura é lembrar que código RTL, no fim do fluxo, será mapeado para células equivalentes da biblioteca.

### Figura de elementos sequenciais

Mostra flip-flops e latches. Ela prepara a distinção entre lógica combinacional e lógica sequencial. Em RTL, sempre que aparece `posedge clk`, normalmente estamos descrevendo armazenamento sequencial.

### Tabelas verdade

As tabelas verdade mostram que blocos combinacionais podem ser definidos por todas as combinações possíveis de entrada e suas respectivas saídas. Para portas simples, essa é a forma mais direta de especificar comportamento.

### Diagramas de tempo

Diagramas de tempo mostram como sinais mudam ao longo do tempo. Eles são essenciais para entender clock, delays, setup/hold, registradores, simulação e debug em waveform.

### Diagrama RTL do mux de 32 bits

O mux de 32 bits mostra que um bloco pode ser representado como caixa funcional: entradas `x`, `y`, seleção `s` e saída `z`. O RTL descreve a escolha entre os barramentos de entrada.

### Netlist gate-level do mux

A netlist mostra o mesmo mux em forma estrutural, usando células e conexões. O ponto importante é perceber que a netlist é menos amigável para humanos, mas mais próxima do que seguirá para implementação física.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **All Verilog constructs are synthesizable. True or false?**  
   Resposta: False.

2. **RTL design is input to synthesis tool to generate what?**  
   Resposta: design netlist / gate-level netlist.

3. **What does `` `timescale `` define?**  
   Resposta: simulation time unit and precision.

4. **What is the difference between RTL and gate-level modeling?**  
   RTL descreve transferência entre registradores e lógica; gate-level descreve portas/células e interconexões.

5. **What is the difference between blocking and non-blocking assignments?**  
   `=` atualiza imediatamente no fluxo procedural; `<=` agenda atualização, sendo adequado para lógica sequencial.

6. **What is the difference between function and task?**  
   Function executa em tempo zero e retorna um valor; task pode consumir tempo e retornar múltiplos valores por argumentos.

7. **Which constructs are generally non-synthesizable?**  
   `initial`, delays, `wait`, `fork/join`, `$display`, `$monitor`, `$finish`, diretivas de compilação e comandos de simulação.

8. **What are common HDLs?**  
   Verilog, SystemVerilog e VHDL.

### Pegadinhas

- `reg` em Verilog não significa obrigatoriamente flip-flop físico.
- `initial` é útil em testbench, mas não deve ser tratado como RTL ASIC sintetizável.
- `#delay` simula atraso, mas não força atraso físico na síntese.
- System tasks usam `$`, mas `` `define `` é diretiva de compilador com crase/backtick.
- Gate-level pode estar em Verilog, mas isso não significa que seja RTL.
- `always` não é automaticamente sequencial; depende da lista de sensibilidade.
- `always @(*)` tende a modelar combinacional.
- `always @(posedge clk)` tende a modelar sequencial.

### Conceitos para memorizar

```text
RTL → entrada da síntese
Síntese → gera netlist
Netlist → entrada para etapas posteriores de implementação física
Verilog → descreve hardware concorrente
Nem todo Verilog é sintetizável
```

---

## Relação com projeto/laboratório

Esta aula é a base para entender os labs e ferramentas que aparecerão depois.

### Relação com simulação

Quando você rodar VCS ou outro simulador, verá comandos como:

```verilog
$display
$monitor
$finish
$dumpfile
$dumpvars
```

Eles pertencem ao testbench e ajudam a observar o comportamento do DUT.

### Relação com waveform

Os diagramas de tempo e comandos de dump conectam diretamente com Verdi/VCS. Para abrir waveform, é comum o testbench gerar arquivos de dump com sinais internos e de interface.

### Relação com Makefile

O Makefile normalmente automatiza etapas como:

```text
analisar arquivos Verilog
elaborar o design
rodar simulação
gerar logs
abrir waveform
```

A distinção entre arquivos de design e arquivos de testbench será essencial. O design deve ser majoritariamente sintetizável; o testbench pode usar constructs não sintetizáveis.

### Relação com síntese

Quando chegar em Design Compiler, o fluxo será:

```text
read_verilog
elaborate
link
compile
write netlist
```

O Design Compiler espera receber RTL sintetizável. Se o código tiver `#delay`, `$display`, `fork/join`, `$finish` ou estruturas de testbench misturadas ao design, a síntese pode falhar ou ignorar partes.

### Relação com debug

Entender `X`, `Z`, `wire`, `reg`, blocking e non-blocking é essencial para debug. Muitos erros em waveform surgem de:

- reset mal aplicado;
- registrador não inicializado;
- uso errado de `=` e `<=`;
- sensibilidade incompleta em bloco combinacional;
- testbench encerrando cedo com `$finish`;
- sinal em alta impedância `Z`;
- propagação de desconhecido `X`.

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

**Bloco 002 — 02 Verilog for Synthesis**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\02 Verilog for Synthesis.docx
```

Faixa:

```text
Slides 1-22
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\02 Verilog for Synthesis.md
```
