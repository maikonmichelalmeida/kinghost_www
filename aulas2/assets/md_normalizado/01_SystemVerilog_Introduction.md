# 01 SystemVerilog Introduction

## Controle do bloco

- **Bloco:** 010
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\01 SystemVerilog Introduction.docx`
- **Faixa processada:** slides visíveis 1-12, distribuídos em 6 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\01 SystemVerilog Introduction.md`
- **Próximo bloco recomendado:** 011 — `02 SystemVerilog for Synthesis`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento. Este bloco aprofunda conceitos de alto nível de SystemVerilog, principalmente OOP, interfaces, assertions, coverage, constraint random, DPI, `unique/priority`, FSMs e organização de dados.

---

## Resumo executivo

Esta aula introduz **SystemVerilog** como uma evolução do Verilog 2005 que unifica três necessidades do projeto digital moderno:

```text
descrição de hardware
modelagem de sistema
verificação funcional
```

Diferente de Verilog clássico, SystemVerilog não é apenas uma linguagem para escrever RTL. Ele adiciona recursos de **linguagem de alto nível**, inspirados em C/C++ e Java, e recursos próprios de verificação, como:

- classes e orientação a objetos;
- constraint random verification;
- assertions;
- coverage;
- interfaces;
- tipos de dados mais ricos;
- structs, unions e arrays avançados;
- DPI para integração com C/C++;
- `unique` e `priority` para expressar intenção de decisão;
- `always_ff`, `always_comb` e `always_latch`;
- `logic` como tipo mais conveniente para RTL;
- organização de dados em estruturas mais legíveis.

O objetivo da aula é mostrar que SystemVerilog permite escrever designs mais claros e testbenches muito mais poderosos. Ele preserva compatibilidade com Verilog 2005, mas adiciona camadas modernas de modelagem e verificação. Para prova, os pontos-chave são: **nem todos os constructs SystemVerilog são sintetizáveis**, SystemVerilog suporta **interfaces** também sintetizáveis, o RTL entra na síntese para gerar **design netlist**, o conceito usado para system modeling é **OOP**, e SystemVerilog suporta os constructs e enhancements de **Verilog 2005**.

---

## Texto extraído e organizado por slide

### Slide 1 — Review of Logic Blocks

Um **logic block** representa uma função lógica em que as saídas são geradas avaliando um conjunto de entradas.

Circuitos digitais trabalham com blocos lógicos. Os tipos principais são:

- **Combinational**
- **Sequential**

Exemplos de blocos combinacionais padrão:

- AND
- OR
- NOT
- XOR
- NOR
- NAND
- XNOR

Exemplos de blocos sequenciais padrão:

- D FF
- D-Latch
- T FF
- SR FF

Blocos lógicos podem ser definidos por:

- truth table;
- timing diagram;
- logic function ou Boolean equation.

Interpretação:

SystemVerilog continua descrevendo os mesmos blocos digitais básicos já vistos em Verilog e VHDL. A diferença é que ele oferece formas mais modernas, seguras e expressivas para modelar esses blocos e verificar seu comportamento.

---

### Slide 2 — Basic Building Blocks of Digital Logic Blocks

Blocos básicos de circuitos digitais:

- standard logic gates;
- multiplexers/demultiplexers;
- encoders/decoders;
- sequential circuits;
- arithmetic logic circuits;
- timers and counters;
- FIFOs/register arrays and on-chip memories;
- finite state machines.

Interpretação:

Esses blocos podem ser escritos como RTL sintetizável ou usados como parte de um ambiente de verificação. Em SystemVerilog, um mux pode ser descrito com `assign`, `always_comb`, `case` ou `unique case`; um registrador pode ser descrito com `always_ff`; uma FSM pode usar `typedef enum` para deixar os estados mais claros; uma FIFO pode usar arrays, structs e interfaces para organizar melhor seus sinais.

---

### Slide 3 — Design Abstractions and SystemVerilog

A aula apresenta três camadas: behavioral modeling, RTL-level modeling e SystemVerilog como evolução da linguagem.

#### Behavioral modeling

- Descreve um sistema por comportamento concorrente.
- As funções podem ser sequenciais ou concorrentes.
- Exemplos: functions, tasks e `always` blocks.
- Blocos sequenciais geralmente são usados para simulação.
- Não é necessário conhecer a estrutura interna do design.
- Para gerar hardware real, é necessário passar por síntese.
- Os constructs do modelo precisam ser sintetizáveis quando o objetivo for hardware.

Behavioral modeling é mais abstrato. Pode ser usado para simulação, modelos de referência, testbench ou partes de RTL. Mas nem tudo que é behavioral vira hardware.

#### RTL-level modeling

- RTL significa **Register-Transfer Level**.
- Designs que usam RTL especificam o circuito por operações e transferência de dados entre registradores.
- O design RTL contém limites temporais claros.
- Processos funcionais são agendados para ocorrer em certos tempos, normalmente controlados por clock.

RTL é o nível típico de síntese. O designer descreve registradores, lógica combinacional entre registradores, controle por clock, reset, enables, FSMs e datapaths.

#### Histórico de SystemVerilog

- SystemVerilog começou como aprimoramento de Verilog 1364-2001.
- Foi padronizado como SystemVerilog 3.0 pela Accellera em 2002.
- SystemVerilog 3.1 foi lançado em 2003.
- O padrão IEEE 1800 consolidou SystemVerilog como linguagem de descrição e verificação de hardware.

#### SystemVerilog

Pontos do slide:

- É um superset de Verilog 2005.
- Inclui enhancements inspirados em C e C++.
- Ajuda na modelagem em maior abstração.
- Suporta modelagem structural com muitos constructs direcionados à estrutura de design.
- Arquivos SystemVerilog usam extensões como `.sv` e `.svh`.

SystemVerilog é, ao mesmo tempo:

```text
HDL  → para descrever hardware
HVL  → para verificar hardware
linguagem de modelagem → para abstrações de sistema
```

---

### Slide 4 — SystemVerilog Constructs

O slide divide SystemVerilog em três usos principais.

#### SystemVerilog for design

SystemVerilog para design:

- é uma extensão com suporte completo ao Verilog 2005;
- suporta modelagem structural, behavioral e RTL.

O slide lista constructs herdados ou associados a Verilog, como:

- ANSI C style ports;
- standard file I/O;
- attributes;
- multi-dimensional arrays;
- generate;
- configurations;
- signed types;
- `localparam`;
- `include`, `define`, `else`, `line`;
- memory part select;
- variable part select;
- constant functions.

#### SystemVerilog features for verification with OOP

Recursos de verificação associados a OOP, como em C++ e Java:

- assertions;
- mailboxes;
- test program blocks;
- semaphores;
- clocking domains;
- constrained random values;
- process control;
- direct C function calls;
- classes;
- dynamic arrays;
- allocators;
- associative arrays;
- strings;
- references.

#### SystemVerilog for modeling

Recursos de modelagem:

- interfaces;
- dynamic processes;
- nested hierarchy;
- 2-state modeling;
- unrestricted ports;
- packed arrays;
- implicit port connections;
- array assignments;
- enhanced literals;
- enhanced event control;
- time values and units;
- `unique` / `priority`;
- logic-specific processes;
- root name space access.

Também aparecem novos tipos e palavras-chave:

- `int`, `shortint`, `longint`, `byte`;
- `shortreal`, `real`;
- `void`, `return`, `ref`;
- `struct`, `union`;
- `do-while`;
- `casting`, `const`, `extern`.

A linguagem cresce em três direções:

```text
design mais claro
testbench mais poderoso
modelagem mais abstrata
```

---

### Slide 5 — SystemVerilog Extensions Over Verilog 2005 (1/2)

Pontos principais:

- Permite ambientes de verificação aprimorados com testbenches abrangentes.
- Suporta **constraint random verification**.
- Suporta assertions, coverage, formal verification e hardware-assisted verification.
- Facilita integração com C++ ou linguagens de alto nível.
- Introduz novos tipos de dados.
- Introduz procedimentos lógicos.
- Introduz modificadores `unique` e `priority`.

#### Tipos de dados citados

O slide mostra tipos como:

- `logic`
- `bit`
- `byte`
- `int`
- `shortint`
- `longint`
- `shortreal`
- `real`
- tipos definidos pelo usuário.

`logic` é um dos avanços mais importantes para RTL. Ele reduz a confusão entre `wire` e `reg` do Verilog clássico. Em SystemVerilog, muitas variáveis de design podem ser declaradas como `logic`, e a ferramenta entende se o uso será combinacional, sequencial ou contínuo conforme o contexto.

Exemplo:

```systemverilog
logic clk;
logic rst_n;
logic [7:0] data;
logic [7:0] q;
```

---

### Slide 6 — SystemVerilog Extensions Over Verilog 2005 (2/2)

Pontos principais:

- Data lifetimes.
- Suporta structures, user-defined data types, interfaces e implicit port instantiations.
- Constructs especiais para hardware reduzem mismatch entre simulação e simulação de netlist sintetizada.
- Código otimizado para modelagem de design.
- Linguagem unificada para design, modeling e verification.

SystemVerilog melhora o RTL e não apenas o testbench. Por exemplo:

- `always_ff` expressa intenção de flip-flop;
- `always_comb` expressa lógica combinacional;
- `interface` agrupa sinais relacionados;
- `typedef enum` organiza estados;
- `struct packed` organiza campos de barramento;
- `logic` simplifica declarações;
- `unique case` ajuda a capturar erros de cobertura de casos.

---

### Slide 7 — SystemVerilog Constructs (1/2): Unique/Priority

O slide foca nos modificadores:

- `unique`
- `priority`

Eles substituem o uso perigoso de directives antigas de síntese como:

- `full_case`
- `parallel_case`

O uso dessas directives em Verilog podia causar mismatch entre:

```text
simulação RTL
simulação pré-síntese
simulação pós-síntese
```

#### `unique`

Indica que as condições devem ser mutuamente exclusivas.

```systemverilog
unique case (sel)
  2'b00: y = a;
  2'b01: y = b;
  2'b10: y = c;
  2'b11: y = d;
endcase
```

Intenção:

```text
exatamente uma alternativa deve ser verdadeira
```

Se nenhuma alternativa for verdadeira, a simulação pode avisar. Isso transforma uma suposição escondida em uma regra verificável.

#### `priority`

Indica que existe ordem de prioridade.

```systemverilog
priority if (req0)
  grant = 2'd0;
else if (req1)
  grant = 2'd1;
else if (req2)
  grant = 2'd2;
else
  grant = 2'd3;
```

Intenção:

```text
req0 tem prioridade sobre req1
req1 tem prioridade sobre req2
```

Esses modificadores comunicam intenção ao simulador, à síntese e ao leitor do código.

---

### Slide 8 — SystemVerilog Constructs (2/2): FSM

O slide mostra uma FSM escrita em SystemVerilog com estados como:

```text
Idle
Read
Wait
Write
```

Sinais de transição:

- `fsm_en`
- `wait_over`
- `write`

Características do código:

- uso de `typedef enum`;
- estados nomeados;
- `always_comb`;
- `always_ff`;
- separação entre estado atual, próximo estado e saídas.

Exemplo didático:

```systemverilog
module fsm_example (
  input  logic clk,
  input  logic rst_n,
  input  logic fsm_en,
  input  logic wait_over,
  input  logic write,
  output logic rd_en,
  output logic wr_en
);

  typedef enum logic [1:0] {
    IDLE,
    READ,
    WAIT_ST,
    WRITE
  } state_t;

  state_t state, next_state;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n)
      state <= IDLE;
    else
      state <= next_state;
  end

  always_comb begin
    next_state = state;

    unique case (state)
      IDLE: begin
        if (fsm_en)
          next_state = READ;
      end

      READ: begin
        next_state = WAIT_ST;
      end

      WAIT_ST: begin
        if (wait_over)
          next_state = WRITE;
      end

      WRITE: begin
        if (write)
          next_state = IDLE;
      end

      default: begin
        next_state = IDLE;
      end
    endcase
  end

  always_comb begin
    rd_en = 1'b0;
    wr_en = 1'b0;

    unique case (state)
      READ:  rd_en = 1'b1;
      WRITE: wr_en = 1'b1;
      default: ;
    endcase
  end

endmodule
```

SystemVerilog deixa a FSM mais legível e segura porque:

- `typedef enum` dá nomes aos estados;
- `state_t` cria um tipo específico para estado;
- `always_ff` deixa claro que é lógica sequencial;
- `always_comb` deixa claro que é lógica combinacional;
- `unique case` ajuda a detectar estados ou casos não cobertos.

---

### Slide 9 — SystemVerilog: Enhanced Constructs

O slide apresenta melhorias de linguagem.

#### `for-loop` melhorado

SystemVerilog permite declarar variável local de iteração dentro do `for`.

```systemverilog
for (int i = 0; i < 8; i++) begin
  data[i] = i;
end
```

A variável `i` pode deixar de existir depois do loop, reduzindo poluição de escopo.

#### `do-while`

```systemverilog
do begin
  count++;
end while (count < 10);
```

#### Conexões implícitas de portas

SystemVerilog reduz verbosidade com:

```systemverilog
.name
```

e:

```systemverilog
.*
```

Exemplo com `.name`:

```systemverilog
my_module u0 (
  .clk,
  .rst_n,
  .data,
  .valid
);
```

Equivale a:

```systemverilog
my_module u0 (
  .clk(clk),
  .rst_n(rst_n),
  .data(data),
  .valid(valid)
);
```

Exemplo com `.*`:

```systemverilog
my_module u0 (.*);
```

Isso conecta automaticamente todas as portas que possuem sinais locais com o mesmo nome.

Atenção:

```text
menos linhas, mas mais risco de debug difícil se nomes coincidirem sem intenção.
```

#### Alias

O slide mostra `alias`, usado para conectar nomes diferentes ao mesmo objeto/sinal.

```systemverilog
alias y = y1 = y2 = y3;
```

Alias pode reduzir repetição e expressar equivalência de sinais, mas deve ser usado com cuidado para não esconder conexões importantes.

---

### Slide 10 — SystemVerilog: Data Organization

O slide destaca:

- SystemVerilog suporta structs, unions e arrays.
- `struct` preserva agrupamento lógico.
- Isso torna o código mais significativo e legível.

A figura mostra um comando de 32 bits dividido em campos:

```text
command[31:0]
 ├── opcode[15:0]
 ├── data_2[7:0]
 └── data_1[7:0]
```

Exemplo com `struct packed`:

```systemverilog
typedef struct packed {
  logic [15:0] opcode;
  logic [7:0]  data_2;
  logic [7:0]  data_1;
} command_t;

command_t cmd;
```

Uso:

```systemverilog
cmd.opcode = 16'hA001;
cmd.data_2 = 8'h55;
cmd.data_1 = 8'hAA;
```

Sem struct, seria comum escrever:

```systemverilog
logic [31:0] cmd;
logic [15:0] opcode;
logic [7:0] data_2;
logic [7:0] data_1;

assign opcode = cmd[31:16];
assign data_2 = cmd[15:8];
assign data_1 = cmd[7:0];
```

Com struct, o código fica mais próximo do significado funcional.

---

### Slide 11 — Questões 1, 2 e 3

#### Questão 1

**Questão:** All SystemVerilog constructs are synthesizable.

**Tradução:** Todos os constructs de SystemVerilog são sintetizáveis.

**Resposta correta:** False.

**Justificativa:** SystemVerilog tem muitos recursos exclusivos de verificação e simulação, como classes, mailboxes, semaphores, randomização, program blocks e coverage. Esses recursos não são RTL sintetizável comum. Apenas um subconjunto da linguagem é sintetizável.

#### Questão 2

**Questão:** SystemVerilog supports ______ which is also synthesizable.

Alternativas:

- A. verification classes
- B. mailbox
- C. interface

**Resposta correta:** C. interface.

**Tradução:** SystemVerilog suporta interface, que também é sintetizável.

**Justificativa:** Classes e mailboxes são recursos de verificação/testbench, não hardware sintetizável. `interface`, quando usada de forma adequada para agrupar sinais de comunicação, pode ser sintetizável e ajuda a organizar conexões entre módulos.

#### Questão 3

**Questão:** ______ is input to synthesis tool to generate ______.

Alternativas:

- A. RTL design, design netlist
- B. Netlist, gates
- C. RTL design, RTL timing

**Resposta correta:** A. RTL design, design netlist.

**Tradução:** O design RTL é entrada para a ferramenta de síntese para gerar a netlist do design.

**Justificativa:** O fluxo de síntese é:

```text
RTL design → synthesis tool → design netlist
```

---

### Slide 12 — Questões 4 e 5

#### Questão 4

**Questão:** ______ concept in SystemVerilog is used for system modeling.

Alternativas:

- A. OOP
- B. Macros
- C. Define

**Resposta correta:** A. OOP.

**Tradução:** O conceito de OOP em SystemVerilog é usado para modelagem de sistema.

**Justificativa:** SystemVerilog adiciona recursos de orientação a objetos, como classes, objetos, herança, métodos e encapsulamento, que são usados principalmente em modelagem e verificação de alto nível.

#### Questão 5

**Questão:** SystemVerilog supports all ______ constructs and enhancements.

Alternativas:

- A. C++
- B. Verilog 2005
- C. VHDL

**Resposta correta:** B. Verilog 2005.

**Tradução:** SystemVerilog suporta todos os constructs e aprimoramentos de Verilog 2005.

**Justificativa:** SystemVerilog é apresentado como superset de Verilog 2005. Portanto, ele herda os constructs de Verilog 2005 e adiciona novos recursos.

---

## Aula didática desenvolvida

### 1. Por que SystemVerilog existe?

Verilog clássico foi muito útil para descrever hardware, mas projetos digitais ficaram maiores e mais difíceis de verificar. Com SoCs, múltiplos blocos, barramentos, protocolos, caches, controladores, processadores e IPs, apenas escrever RTL e fazer testes manuais deixou de ser suficiente.

SystemVerilog surgiu para resolver dois problemas ao mesmo tempo:

```text
1. Melhorar a escrita do RTL.
2. Criar uma linguagem poderosa para verificação.
```

Por isso ele é uma linguagem híbrida:

```text
HDL + HVL
```

Essa é a diferença conceitual mais importante: SystemVerilog não é apenas “Verilog com alguns comandos a mais”. Ele é uma linguagem unificada para design e verificação.

---

### 2. SystemVerilog como superset de Verilog 2005

Dizer que SystemVerilog é um **superset** significa:

```text
Tudo que Verilog 2005 suporta, SystemVerilog também suporta,
e ainda adiciona novos recursos.
```

Exemplo de Verilog válido:

```verilog
module and_gate (
  input  wire a,
  input  wire b,
  output wire y
);

  assign y = a & b;

endmodule
```

Em SystemVerilog, podemos escrever de forma mais moderna:

```systemverilog
module and_gate (
  input  logic a,
  input  logic b,
  output logic y
);

  assign y = a & b;

endmodule
```

A função é a mesma, mas `logic` simplifica o modelo mental. Em vez de escolher entre `wire` e `reg` em muitos contextos, o designer usa `logic` para representar sinais lógicos de 4 estados.

---

### 3. `logic`: uma das mudanças mais importantes

Em Verilog clássico, havia uma confusão comum:

```verilog
wire y;
reg q;
```

Mas `reg` não significava necessariamente registrador físico. Significava apenas uma variável procedural.

SystemVerilog introduz `logic`, que pode ser usado em muitos lugares onde antes se usaria `reg`.

Exemplo combinacional:

```systemverilog
logic y;

always_comb begin
  y = a & b;
end
```

Exemplo sequencial:

```systemverilog
logic q;

always_ff @(posedge clk) begin
  q <= d;
end
```

Nos dois casos, o tipo é `logic`. O que define o hardware é a forma de atribuição e o bloco usado:

```text
always_comb → lógica combinacional
always_ff   → flip-flop / lógica sequencial
```

---

### 4. `always_comb`, `always_ff` e `always_latch`

Esses três constructs são muito importantes porque expressam intenção.

#### `always_comb`

Usado para lógica combinacional.

```systemverilog
always_comb begin
  y = a & b;
end
```

Vantagens:

- inferência automática da lista de sensibilidade;
- ajuda a evitar erro de esquecer sinal;
- ferramentas podem checar se a lógica parece combinacional.

#### `always_ff`

Usado para lógica sequencial com flip-flops.

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    q <= '0;
  else
    q <= d;
end
```

Vantagens:

- deixa claro que o bloco deve inferir flip-flops;
- ferramentas podem checar se há múltiplos eventos ou uso indevido;
- melhora legibilidade.

#### `always_latch`

Usado quando a intenção é inferir latch.

```systemverilog
always_latch begin
  if (en)
    q <= d;
end
```

Vantagem:

- se aparecer latch sem intenção em `always_comb`, a ferramenta pode alertar;
- se você realmente quer latch, declara isso explicitamente.

Resumo:

```text
always_comb  → quero combinacional
always_ff    → quero flip-flop
always_latch → quero latch
```

---

### 5. Interfaces: agrupando sinais relacionados

Interfaces são um dos recursos mais importantes de SystemVerilog para design e verificação.

Sem interface, um barramento simples pode exigir muitas portas:

```systemverilog
module master (
  input  logic clk,
  output logic valid,
  output logic write,
  output logic [7:0] addr,
  output logic [31:0] wdata,
  input  logic ready,
  input  logic [31:0] rdata
);
```

Com interface:

```systemverilog
interface bus_if (input logic clk);
  logic valid;
  logic write;
  logic [7:0] addr;
  logic [31:0] wdata;
  logic ready;
  logic [31:0] rdata;
endinterface
```

O módulo usa:

```systemverilog
module master (
  bus_if bus
);
```

Vantagens:

- menos portas;
- conexões mais organizadas;
- menor chance de esquecer sinal;
- facilita testbench;
- facilita criação de monitor/driver;
- pode ser sintetizável se usada com subconjunto adequado.

#### Modports

Interfaces podem ter `modport`, que define direção dos sinais para cada lado.

```systemverilog
interface bus_if (input logic clk);
  logic valid;
  logic write;
  logic [7:0] addr;
  logic [31:0] wdata;
  logic ready;
  logic [31:0] rdata;

  modport master (
    output valid, write, addr, wdata,
    input  ready, rdata
  );

  modport slave (
    input  valid, write, addr, wdata,
    output ready, rdata
  );
endinterface
```

Uso:

```systemverilog
module master (bus_if.master bus);
endmodule

module slave (bus_if.slave bus);
endmodule
```

O `modport` deixa claro quem dirige e quem lê cada sinal.

---

### 6. OOP em SystemVerilog

A questão 4 diz que o conceito usado para system modeling é **OOP**.

OOP significa **Object-Oriented Programming**, ou programação orientada a objetos.

SystemVerilog adiciona classes para modelagem e verificação. Classes não são RTL sintetizável comum; elas são usadas principalmente em testbench.

Exemplo simples:

```systemverilog
class Packet;
  rand bit [7:0] addr;
  rand bit [31:0] data;
  rand bit write;

  function void print();
    $display("addr=%0h data=%0h write=%0b", addr, data, write);
  endfunction
endclass
```

Uso:

```systemverilog
Packet p;

initial begin
  p = new();
  p.randomize();
  p.print();
end
```

A classe `Packet` representa uma transação. Em vez de manipular vários sinais soltos, o testbench manipula um objeto de alto nível.

#### Por que OOP é útil em verificação?

Porque testbenches modernos têm muitos elementos:

- geradores de estímulo;
- drivers;
- monitors;
- scoreboards;
- checkers;
- transações;
- sequências;
- modelos de referência.

OOP permite organizar isso em classes reutilizáveis.

---

### 7. Herança em SystemVerilog

Herança permite criar uma classe especializada a partir de outra.

```systemverilog
class Packet;
  rand bit [7:0] addr;
  rand bit [31:0] data;

  function void print();
    $display("Packet addr=%0h data=%0h", addr, data);
  endfunction
endclass

class WritePacket extends Packet;
  rand bit [3:0] byte_enable;

  function void print();
    $display("WritePacket addr=%0h data=%0h be=%0h",
             addr, data, byte_enable);
  endfunction
endclass
```

`WritePacket` herda `addr` e `data` de `Packet`, mas adiciona `byte_enable`.

Isso é útil quando várias transações compartilham campos comuns.

---

### 8. Constraint random verification

SystemVerilog suporta randomização com constraints.

```systemverilog
class Transaction;
  rand bit [7:0] addr;
  rand bit [31:0] data;
  rand bit write;

  constraint addr_range {
    addr inside {[8'h10:8'h7F]};
  }

  constraint aligned {
    addr[1:0] == 2'b00;
  }
endclass
```

Uso:

```systemverilog
Transaction tr = new();

initial begin
  assert(tr.randomize());
  $display("addr=%0h data=%0h write=%0b", tr.addr, tr.data, tr.write);
end
```

O testbench não escolhe manualmente cada valor. Ele pede ao solver da linguagem para gerar valores aleatórios que obedeçam às regras.

Isso é muito mais poderoso que `$random`, porque os valores são aleatórios, mas válidos.

---

### 9. Assertions

Assertions são checagens formais ou temporais no código.

Exemplo simples imediato:

```systemverilog
always_comb begin
  assert (!(read && write))
    else $error("read e write ativos ao mesmo tempo");
end
```

Exemplo temporal:

```systemverilog
property req_ack_p;
  @(posedge clk)
  req |-> ##[1:3] ack;
endproperty

assert property (req_ack_p);
```

Interpretação:

```text
Se req subir, ack deve ocorrer de 1 a 3 ciclos depois.
```

Assertions são importantes porque verificam regras do protocolo enquanto a simulação roda.

Elas aumentam a observabilidade: em vez de descobrir erro muito depois, o simulador acusa exatamente quando uma regra foi violada.

---

### 10. Coverage

Coverage mede quanto foi testado.

#### Code coverage

Mede:

- linhas executadas;
- branches;
- toggles;
- condições;
- FSM states.

#### Functional coverage

Mede cenários funcionais definidos pelo engenheiro.

```systemverilog
covergroup cg @(posedge clk);
  coverpoint opcode {
    bins add = {4'h0};
    bins sub = {4'h1};
    bins mul = {4'h2};
  }

  coverpoint burst_len {
    bins short = {[1:3]};
    bins long  = {[4:8]};
  }

  cross opcode, burst_len;
endgroup
```

Functional coverage responde perguntas como:

```text
Testei todos os opcodes?
Testei todos os tamanhos de burst?
Testei cada opcode com cada tamanho de burst?
```

Coverage não diz se o design está correto. Ela diz se você exercitou o que pretendia exercitar.

---

### 11. DPI: integração com C/C++

O slide menciona integração fácil com C++ ou linguagens de alto nível.

SystemVerilog tem **DPI — Direct Programming Interface**.

Exemplo SystemVerilog:

```systemverilog
import "DPI-C" function int c_model(input int a, input int b);

initial begin
  int result;
  result = c_model(10, 20);
  $display("result=%0d", result);
end
```

Código C:

```c
int c_model(int a, int b) {
    return a + b;
}
```

Uso:

- modelo de referência em C;
- algoritmo complexo;
- co-simulação;
- reutilização de software existente;
- comparação entre DUT e golden model.

---

### 12. Semaphores e mailboxes

O slide cita mailboxes e semaphores como recursos de verificação.

#### Mailbox

Mailbox é uma fila de comunicação entre processos.

```systemverilog
mailbox mbx = new();

initial begin
  mbx.put(32'hDEADBEEF);
end

initial begin
  bit [31:0] data;
  mbx.get(data);
  $display("data=%0h", data);
end
```

Uso típico:

```text
generator envia transações para driver
monitor envia transações para scoreboard
```

#### Semaphore

Semaphore controla acesso a recurso compartilhado.

```systemverilog
semaphore sem = new(1);

initial begin
  sem.get(1);
  // usa recurso exclusivo
  sem.put(1);
end
```

Esses recursos são de testbench, não de RTL sintetizável.

---

### 13. Structs e organização de dados

Sem struct:

```systemverilog
logic [31:0] cmd;
logic [15:0] opcode;
logic [7:0] data_2;
logic [7:0] data_1;

assign opcode = cmd[31:16];
assign data_2 = cmd[15:8];
assign data_1 = cmd[7:0];
```

Com struct:

```systemverilog
typedef struct packed {
  logic [15:0] opcode;
  logic [7:0]  data_2;
  logic [7:0]  data_1;
} command_t;

command_t cmd;
```

Acesso:

```systemverilog
cmd.opcode
cmd.data_2
cmd.data_1
```

A estrutura preserva o significado dos campos.

#### `packed` versus `unpacked`

`packed` significa que os campos são representados como um vetor contínuo de bits.

```systemverilog
typedef struct packed {
  logic [7:0] a;
  logic [7:0] b;
} pair_t;
```

Isso pode ser usado em RTL sintetizável.

`unpacked` é mais usado para organização de dados em arrays e testbenches.

---

### 14. Unions

`union` permite interpretar o mesmo conjunto de bits de formas diferentes.

```systemverilog
typedef union packed {
  logic [31:0] raw;
  command_t   cmd;
} packet_u;
```

Uso:

```systemverilog
packet_u p;

p.raw = 32'hA001_55AA;
$display("opcode=%0h", p.cmd.opcode);
```

O mesmo `32'hA001_55AA` pode ser visto como palavra bruta ou como comando com campos.

É poderoso, mas exige cuidado para não criar confusão.

---

### 15. Conexões implícitas: `.name` e `.*`

#### `.name`

```systemverilog
my_module u0 (
  .clk,
  .rst_n,
  .data
);
```

Equivale a:

```systemverilog
my_module u0 (
  .clk(clk),
  .rst_n(rst_n),
  .data(data)
);
```

#### `.*`

```systemverilog
my_module u0 (.*);
```

Conecta automaticamente todas as portas que têm sinais locais com mesmo nome.

Vantagem:

```text
menos código
menos repetição
```

Risco:

```text
conexão errada por coincidência de nomes
debug mais difícil
```

Para estudo, entenda que é um recurso de produtividade, mas em projetos críticos muitos times usam com regras rígidas.

---

### 16. FSM em SystemVerilog com `enum`

Em Verilog clássico:

```verilog
parameter IDLE = 2'b00;
parameter READ = 2'b01;
parameter WAIT = 2'b10;
parameter WRITE = 2'b11;

reg [1:0] state;
```

Em SystemVerilog:

```systemverilog
typedef enum logic [1:0] {
  IDLE,
  READ,
  WAIT_ST,
  WRITE
} state_t;

state_t state, next_state;
```

Vantagens:

- estados têm tipo próprio;
- melhora legibilidade;
- debug mostra nomes de estados em muitas ferramentas;
- reduz erro de codificação manual;
- facilita coverage de FSM.

---

### 17. Síntese: o que é e o que não é sintetizável

A questão 1 reforça:

```text
Nem todos os constructs SystemVerilog são sintetizáveis.
```

Sintetizável normalmente:

- `logic`;
- `always_comb`;
- `always_ff`;
- `assign`;
- `typedef enum`;
- `struct packed`;
- `interface` com uso RTL adequado;
- `case`, `if`, loops estáticos;
- operadores aritméticos e lógicos compatíveis com síntese.

Não sintetizável normalmente:

- classes;
- randomização;
- mailboxes;
- semaphores;
- program blocks;
- muitos recursos de coverage;
- DPI como hardware;
- delays de simulação;
- fork/join em RTL;
- testbench constructs.

Regra mental:

```text
Design RTL usa subconjunto sintetizável.
Testbench usa recursos completos de verificação.
```

---

## Conceitos difíceis explicados em profundidade

### 1. SystemVerilog não substitui o pensamento de hardware

SystemVerilog deixa o código mais expressivo, mas isso não significa que qualquer coisa vire circuito.

Exemplo:

```systemverilog
for (int i = 0; i < 8; i++) begin
  y[i] = a[i] & b[i];
end
```

Em RTL combinacional, isso vira oito portas AND.

Mas uma classe:

```systemverilog
class Packet;
  rand bit [7:0] addr;
endclass
```

não vira hardware. Ela é abstração de testbench.

A pergunta continua sendo:

```text
Este trecho descreve hardware ou controla a simulação?
```

---

### 2. Por que classes não são sintetizáveis?

Classes representam objetos criados dinamicamente durante simulação:

```systemverilog
Packet p = new();
```

Hardware físico não cria objetos com `new()` em tempo de execução como um programa. Um chip tem flip-flops, gates, memórias, muxes e fios fixos após síntese.

Por isso, classes são poderosas para testbench, mas não para RTL sintetizável.

---

### 3. Por que interface pode ser sintetizável?

Uma interface, quando usada para agrupar sinais, pode representar apenas fios e direções.

```systemverilog
interface bus_if;
  logic valid;
  logic ready;
  logic [31:0] data;
endinterface
```

Isso pode ser entendido como um bundle de sinais.

Mas se a interface contiver constructs de testbench, tasks com delays, assertions não suportadas pela síntese ou clocking blocks complexos, o uso pode não ser sintetizável.

Resumo:

```text
interface como pacote de sinais → pode ser sintetizável.
interface com comportamento de testbench → não necessariamente.
```

---

### 4. OOP e modelagem de sistema

OOP é usado para modelar entidades de alto nível:

- transações;
- pacotes;
- comandos;
- sequências;
- drivers;
- monitors;
- scoreboards;
- modelos de referência.

Exemplo mental:

```text
Em RTL: sinais valid, ready, addr, data.
Em testbench OOP: objeto Transaction com addr, data, kind.
```

Isso eleva o nível de abstração. Em vez de pensar bit por bit o tempo todo, o engenheiro de verificação pensa em operações:

```text
write address 0x10 with data 0xABCD
read address 0x20
send packet
receive response
```

---

### 5. Assertions como contrato do design

Uma assertion é como uma regra formal escrita no código.

```systemverilog
assert property (@(posedge clk) !(read && write));
```

Essa regra diz:

```text
read e write não podem estar ativos ao mesmo tempo.
```

Isso funciona como um contrato. Se o design ou testbench violar a regra, a simulação acusa.

Assertions são valiosas porque:

- detectam erro cedo;
- documentam intenção;
- podem ser usadas em simulação;
- podem ser usadas em verificação formal;
- aumentam observabilidade interna.

---

### 6. Coverage como mapa do território testado

Imagine que seu testbench passou. Isso não significa que ele testou tudo.

Exemplo:

```text
ALU tem ADD, SUB, AND, OR.
Teste executou só ADD.
Resultado: passou.
Mas SUB, AND e OR não foram testados.
```

Coverage mostra lacunas.

Functional coverage permite definir o que importa:

```systemverilog
coverpoint opcode {
  bins add = {ADD};
  bins sub = {SUB};
  bins and_op = {AND};
  bins or_op = {OR};
}
```

Se `SUB` nunca ocorreu, a coverage mostra.

---

### 7. Constraint random como exploração inteligente

Random puro pode gerar muitos casos inúteis.

Constraint random gera casos aleatórios dentro de regras úteis.

```systemverilog
constraint aligned_addr {
  addr[1:0] == 2'b00;
}
```

Isso garante endereços alinhados.

Outro exemplo:

```systemverilog
constraint legal_burst {
  burst_len inside {1, 2, 4, 8, 16};
}
```

Assim, o testbench explora muitas combinações válidas sem o engenheiro escrever cada uma manualmente.

---

### 8. `unique` não é só otimização

Muitos iniciantes pensam que `unique` serve só para síntese otimizar. Mas ele também ajuda a simulação a detectar erro.

```systemverilog
unique case (state)
  IDLE:  ...
  READ:  ...
  WRITE: ...
endcase
```

Se `state` cair em um valor não listado, a simulação pode emitir warning.

Isso é excelente para FSMs, porque detecta estado inválido.

---

### 9. `priority` comunica intenção de prioridade

Um `if-else` aninhado já sugere prioridade. Mas `priority` deixa isso explícito:

```systemverilog
priority if (irq0)
  service = 0;
else if (irq1)
  service = 1;
else if (irq2)
  service = 2;
```

Aqui não há ambiguidade: a ordem importa.

Isso ajuda o leitor, a simulação e a síntese.

---

### 10. `struct packed` e barramentos

Um barramento de 32 bits pode ser apenas:

```systemverilog
logic [31:0] bus;
```

Mas isso não explica o significado dos campos.

Com struct:

```systemverilog
typedef struct packed {
  logic [7:0]  opcode;
  logic [7:0]  src;
  logic [7:0]  dst;
  logic [7:0]  imm;
} instr_t;
```

Agora o código revela a intenção:

```systemverilog
instr.opcode
instr.src
instr.dst
instr.imm
```

Isso reduz bugs de bit slicing.

---

## Figuras, diagramas e waveforms importantes

### Figuras de blocos lógicos

As figuras de portas, flip-flops, tabelas verdade e diagramas de tempo reforçam que SystemVerilog continua descrevendo hardware digital real.

### Figura de blocos digitais básicos

Mostra mux/demux, encoder/decoder, circuitos sequenciais, FIFOs e FSMs. Isso prepara a ideia de que SystemVerilog pode descrever tanto datapath quanto controle.

### Slide de abstrações de design

Mostra behavioral, RTL e SystemVerilog como evolução de Verilog. Esse slide é central para entender que a linguagem cobre design, modelagem e verificação.

### Slide de constructs

Mostra que SystemVerilog junta recursos de design, modelagem e verificação. É um mapa da linguagem.

### Slides de extensions over Verilog 2005

Mostram os principais ganhos: verification environment, constraint random, assertions, coverage, integração C/C++, tipos de dados, `unique/priority`, interfaces e data lifetimes.

### Slide de `unique/priority`

Mostra a substituição de práticas antigas como `full_case/parallel_case` por constructs mais seguros e verificáveis.

### Slide de FSM

Mostra o uso de FSM com estados nomeados e constructs modernos. É uma das aplicações mais importantes de SystemVerilog em RTL.

### Slide de enhanced constructs

Mostra `for` com variável local, `do-while`, conexões implícitas e alias. São recursos de produtividade, mas exigem cuidado no debug.

### Slide de data organization

Mostra `struct`, `union` e arrays para representar comandos e pacotes de dados com campos significativos.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **All SystemVerilog constructs are synthesizable. True or false?**  
   Resposta: **False**.

2. **SystemVerilog supports ______ which is also synthesizable.**  
   Resposta: **interface**.

3. **______ is input to synthesis tool to generate ______.**  
   Resposta: **RTL design, design netlist**.

4. **______ concept in SystemVerilog is used for system modeling.**  
   Resposta: **OOP**.

5. **SystemVerilog supports all ______ constructs and enhancements.**  
   Resposta: **Verilog 2005**.

6. **SystemVerilog é superset de qual linguagem?**  
   Resposta: **Verilog 2005**.

7. **Quais extensões ajudam a verificação?**  
   Resposta: assertions, coverage, constraint random verification, OOP, DPI, mailboxes e semaphores.

8. **Para que serve `always_ff`?**  
   Resposta: modelar lógica sequencial com flip-flops.

9. **Para que serve `always_comb`?**  
   Resposta: modelar lógica combinacional com sensibilidade automática e intenção explícita.

10. **Para que serve `unique case`?**  
    Resposta: indicar que as alternativas devem ser exclusivas e ajudar a detectar casos não cobertos.

11. **Para que serve `priority if` ou `priority case`?**  
    Resposta: indicar que há ordem de prioridade entre condições.

12. **Para que serve `typedef enum` em FSMs?**  
    Resposta: criar estados nomeados e fortemente organizados.

13. **Para que serve `struct packed`?**  
    Resposta: organizar campos de um vetor/barramento mantendo representação contínua de bits.

14. **Classes são sintetizáveis?**  
    Resposta: normalmente não; são usadas em testbench e modelagem de alto nível.

15. **Mailboxes são sintetizáveis?**  
    Resposta: não; são recursos de comunicação entre processos em testbench.

### Pegadinhas

- SystemVerilog tem recursos sintetizáveis e não sintetizáveis.
- `interface` pode ser sintetizável, mas classes e mailboxes não são RTL sintetizável comum.
- OOP é para system modeling e verificação, não para gates físicos.
- `logic` não significa automaticamente flip-flop; o bloco onde é usado define a inferência.
- `always_comb` não deve inferir latch.
- `always_ff` deve representar lógica sequencial.
- `unique` e `priority` comunicam intenção e ajudam a detectar erro de simulação.
- `.*` reduz código, mas pode dificultar debug se usado sem disciplina.
- `struct packed` é útil para barramentos e pode ser sintetizável.
- Coverage mede quanto foi testado, não se o design está correto.
- Constraint random gera valores aleatórios válidos, não simplesmente qualquer valor.
- DPI chama C/C++ na simulação, não vira hardware sintetizado.

### Frases para memorizar

```text
SystemVerilog é superset de Verilog 2005.
SystemVerilog une design, modelagem e verificação.
Nem todos os constructs SystemVerilog são sintetizáveis.
Interface pode ser sintetizável; classes e mailbox são de verificação.
OOP é usado para system modeling.
RTL design entra na síntese e gera design netlist.
always_comb expressa combinacional.
always_ff expressa flip-flop.
unique expressa exclusividade.
priority expressa prioridade.
struct packed organiza bits com significado.
```

---

## Relação com projeto/laboratório

Esta aula prepara a transição de Verilog/VHDL para SystemVerilog moderno.

### Relação com RTL

Ao escrever RTL em SystemVerilog, prefira:

```systemverilog
logic
always_comb
always_ff
typedef enum
unique case
struct packed
interface
```

Exemplo de registrador:

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    q <= '0;
  else
    q <= d;
end
```

Exemplo de combinacional:

```systemverilog
always_comb begin
  y = '0;

  unique case (sel)
    2'b00: y = a;
    2'b01: y = b;
    2'b10: y = c;
    2'b11: y = d;
  endcase
end
```

### Relação com testbench

Ao escrever testbench, SystemVerilog permite usar:

```systemverilog
class
randomize()
constraint
mailbox
semaphore
interface
clocking block
assert property
covergroup
DPI
```

### Relação com UVM

Esta aula ainda não é UVM, mas prepara a base:

| Conceito deste bloco | Papel em UVM |
|---|---|
| OOP | base de todo ambiente UVM |
| class | `uvm_component`, `uvm_sequence_item`, `uvm_driver` |
| randomize/constraint | geração de transações |
| mailbox/fila | comunicação entre componentes |
| interface | conexão entre testbench e DUT |
| coverage | medição funcional |
| assertions | checagem temporal/protocolar |
| DPI | integração com modelos externos |

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] Conceitos de alto nível receberam explicação mais detalhada.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

**Bloco 011 — 02 SystemVerilog for Synthesis**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\02 SystemVerilog for Synthesis.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\02 SystemVerilog for Synthesis.md
```
