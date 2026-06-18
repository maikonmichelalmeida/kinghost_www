# 01 Introduction to Synthesis

## Controle do bloco

- **Bloco:** 018
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\01 Introduction to Synthesis.docx`
- **Faixa de slides:** `1-23`
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\01 Introduction to Synthesis.md`
- **Próximo bloco recomendado:** 019 — `02 Design and Constraint Files for Synthesis`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco abre a seção **04 RTL Design Synthesis**. A partir daqui, o foco sai de SystemVerilog/testbench/UVM e entra no fluxo de **síntese lógica**, **constraints**, **bibliotecas**, **timing**, **área**, **potência** e transição para **physical synthesis**.

---

## Resumo executivo

Esta aula introduz o conceito de **síntese** no fluxo de projeto de circuitos digitais ASIC. A ideia central é transformar uma descrição funcional em HDL — Verilog, VHDL ou SystemVerilog — em uma implementação estrutural composta por portas, células padrão e, posteriormente, layout físico.

O fluxo começa com uma especificação de sistema, passa pela codificação RTL, simulação, síntese lógica, simulação em nível de portas, análise de timing, verificação formal, síntese física, place and route, DRC, LVS, STA pós-layout e termina em um design pronto para fabricação.

A aula separa dois mundos:

```text
Front-end
  especificação → RTL → simulação → síntese lógica → netlist em gates

Back-end
  floorplanning → placement → clock tree synthesis → routing → DRC/LVS → timing signoff
```

O ponto mais importante é que síntese não é apenas “converter código em portas”. A ferramenta precisa otimizar o circuito de acordo com metas de:

```text
timing
power
area
```

Para isso, ela precisa de:

```text
RTL/HDL
bibliotecas de células
regras/constraints de projeto
constraints de timing
constraints de ambiente
arquivos de tecnologia
```

Também é introduzida a diferença entre **logic synthesis** e **physical synthesis**:

```text
Logic synthesis:
  transforma comportamento RTL/lógico em netlist de portas/células.

Physical synthesis:
  transforma a netlist e bibliotecas físicas em layout, considerando posicionamento,
  roteamento, delays de interconexão, clock tree, DRC, LVS e análise temporal física.
```

A aula fecha mostrando que problemas como **clock skew**, **clock jitter** e distribuição de clock exigem **Clock-Tree Synthesis (CTS)**, onde uma árvore de buffers é construída para balancear cargas e reduzir atrasos.

---

## Texto extraído e organizado por slide

### Slide 1 — Cell-Based Automated Design

O slide mostra o conceito de **cell-based automated design**.

Elementos mostrados no diagrama:

```text
Process
Design rules
Cell library
RTL/Logic
EDA tools
Design
```

Interpretação:

No fluxo cell-based, o designer não desenha cada transistor manualmente. Em vez disso, usa uma biblioteca de células previamente projetadas, caracterizadas e validadas. Essas células representam portas lógicas, flip-flops, buffers, multiplexadores e outras funções básicas.

O fluxo visual do slide é:

```text
processo de fabricação + regras de projeto + biblioteca de células + RTL
              ↓
          ferramentas EDA
              ↓
            design
```

A biblioteca de células conecta o mundo físico ao mundo lógico. Ela contém informações sobre:

- função lógica das células;
- área;
- potência;
- atraso;
- pinos;
- layouts físicos;
- regras de uso;
- modelos para timing e síntese.

A ferramenta EDA usa o RTL e as bibliotecas para construir uma implementação realista do circuito.

---

### Slide 2 — Concept of Automated Design (1/3)

Texto do slide:

- Any digital function can be easily converted to a logic circuit.
- The logic circuit is mapped to generic logic gates available in the generic library.
- The synthesis tool uses logic gates in the generic library to automatically synthesize the circuit from functional description.

Exemplo mostrado:

```text
Y = (a + b) & (c ⊕ d) & e
```

A expressão é convertida em um circuito com portas lógicas.

Interpretação:

O slide apresenta a ideia fundamental da síntese:

```text
descrição funcional → circuito lógico
```

Se uma função digital pode ser descrita por uma equação booleana, por RTL ou por uma descrição comportamental sintetizável, a ferramenta consegue criar uma rede de portas equivalente.

O exemplo usa:

```text
+  → OR
&  → AND
⊕  → XOR
```

Então:

```text
Y = (a OR b) AND (c XOR d) AND e
```

vira uma rede composta por OR, XOR e AND.

A primeira etapa pode usar portas **genéricas**, ou seja, portas abstratas ainda não mapeadas para células físicas específicas de uma tecnologia.

---

### Slide 3 — Concept of Automated Design (2/3)

O slide separa o fluxo em **front end** e **back end**.

#### Front end

Itens listados:

- System specification and architecture.
- HDL coding: Verilog, VHDL ou SystemVerilog.
- Behavioral simulations using RTL/HDL.
- Synthesis.
- Gate-level simulations.

Interpretação:

O front-end trata principalmente da intenção funcional do design. É onde o comportamento do circuito é descrito, simulado, verificado e convertido em uma representação estrutural de portas/células.

#### Back end

Itens listados:

- Floorplanning, macro, and cell placement.
- Power-grid design.
- Clock-tree synthesis.
- Interconnect routing.
- DRC — Design Rule Check.
- LVS — Layout versus Schematic.
- Dynamic simulation and static timing analysis.

Interpretação:

O back-end transforma a netlist em layout físico fabricável. Aqui entram efeitos de posicionamento, fios, alimentação, clock, parasitas, regras geométricas e timing físico.

Resumo:

```text
Front-end pergunta:
  O circuito faz a função correta?

Back-end pergunta:
  O circuito pode ser implementado fisicamente e funcionar no tempo correto?
```

---

### Slide 4 — Concept of Automated Design (3/3)

Texto do slide:

- If primitive standard cells are previously designed, large number of various digital circuits can be built using these parts.

A figura mostra vários circuitos formados pela combinação de portas/células padrão.

Interpretação:

O conceito é semelhante a montar sistemas complexos usando peças básicas bem caracterizadas.

Se a foundry ou o fornecedor de biblioteca já disponibiliza células como:

```text
AND
OR
NAND
NOR
XOR
MUX
DFF
latches
buffers
inverters
```

então a ferramenta de síntese pode construir milhares ou milhões de combinações sem redesenhar cada célula.

Isso é o coração do design cell-based:

```text
reutilizar células padrão para construir circuitos complexos automaticamente.
```

---

### Slide 5 — Front-End Design Flow

O slide mostra o fluxo:

```text
System specification → RTL coding → Synthesis → Gate-level coding
```

Exemplo mostrado:

```systemverilog
c = !a & b
```

Mapeamento estrutural aproximado:

```verilog
INV (.in(a), .out(a_inv));
AND (.in1(a_inv), .in2(b), .out(c));
```

A figura mostra `a` passando por um inversor e depois entrando em uma AND junto com `b`, gerando `c`.

Interpretação:

Esse slide mostra a transição de RTL para netlist estrutural.

No RTL, o designer escreve a intenção:

```systemverilog
assign c = !a & b;
```

Após síntese, a ferramenta cria instâncias de células:

```verilog
INV U1 (.A(a), .Y(a_inv));
AND U2 (.A(a_inv), .B(b), .Y(c));
```

A função é a mesma, mas o nível de descrição mudou:

```text
RTL:
  descreve comportamento lógico.

Gate-level netlist:
  descreve conexões entre células reais ou genéricas.
```

---

### Slide 6 — Basic Steps of Synthesis

O slide apresenta a sequência:

```text
Circuit description
       ↓
Logic synthesis
       ↓
Logic circuit
       ↓
Physical synthesis
       ↓
Layout of finished design
```

Ferramentas indicadas:

```text
Fusion Compiler → logic synthesis
IC Compiler     → physical synthesis
```

O exemplo visual repete a função:

```text
y = (a + b) & (c ⊕ d) & e
```

e mostra que ela vira circuito lógico e depois layout.

Interpretação:

A síntese tem duas grandes etapas:

#### 1. Logic synthesis

Transforma a descrição funcional/RTL em circuito lógico estrutural.

Saída típica:

```text
gate-level netlist
```

#### 2. Physical synthesis

Transforma a netlist em implementação física, considerando posicionamento e roteamento.

Saída típica:

```text
layout físico
```

Em ferramentas modernas, essas fronteiras podem se misturar. Por exemplo, síntese lógica pode considerar informações físicas estimadas, e ferramentas como Fusion Compiler integram etapas que antes eram separadas.

---

### Slide 7 — Digital IC Specification

Texto do slide:

- Description of digital functionality using Verilog or VHDL in the specification.
- Example of a specification line:
  - If incoming_call AND line_is_available then RING.
- The specifications of a contemporary digital IC can contain millions of lines, and they can be created by a collective of numerous participants within a few months.

A figura mostra um exemplo de contador up/down de 8 bits com sinais:

```text
out
up_down
clk
data
reset
```

Trecho aproximado do código:

```verilog
module up_down_counter (
  out,       // output of the counter
  up_down,   // up_down control for counter
  clk,       // clock input
  data,      // data to load
  reset      // reset input
);

output [7:0] out;
input  [7:0] data;
input up_down, clk, reset;
reg [7:0] out;

always @(posedge clk)
  if (reset) begin
    out <= data;
  end
  else if (up_down) begin
    out <= out + 1;
  end
  else begin
    out <= out - 1;
  end

endmodule
```

Interpretação:

A especificação funcional pode começar em linguagem natural, por exemplo:

```text
Se incoming_call e line_is_available, então acione RING.
```

Depois ela é transformada em HDL. Para designs modernos, essa descrição pode ter milhões de linhas e exigir trabalho colaborativo de muitos engenheiros.

Esse slide conecta especificação com RTL:

```text
requisito funcional → comportamento descrito em HDL
```

---

### Slide 8 — Logic Synthesis Process Representation

Texto do slide:

- Logic synthesis is the process of writing a logic circuit from the function/circuit description.

A figura mostra:

```text
Circuit description:
  y: output;
  a,b,c: input;
  y = (a+b)*c;

Standard cells:
  AND
  OR

Logic synthesis
       ↓

Circuito com OR seguido de AND
```

Interpretação:

A síntese lógica recebe duas informações principais:

```text
1. descrição do circuito
2. biblioteca de células
```

A descrição diz **o que** o circuito deve fazer. A biblioteca diz **com quais peças** a ferramenta pode construir o circuito.

Exemplo:

```text
y = (a OR b) AND c
```

Se a biblioteca contém OR e AND, a síntese escolhe essas células e conecta:

```text
a,b → OR
OR,c → AND
AND → y
```

Esse é o processo básico de mapeamento lógico.

---

### Slide 9 — Logic Synthesis

Texto do slide:

- Logic synthesis optimizes the circuit.
- The problem:
  - Circuit created from a function cannot possibly operate as expected.

A figura mostra dois casos:

```text
The delay of U1 element affects the result.
Additional elements must be added to the circuit to ensure correct operation.
```

Interpretação:

A síntese não pode apenas traduzir uma equação em portas. Ela precisa considerar atrasos reais.

Em um circuito ideal, uma função booleana parece instantânea. Em hardware real:

```text
cada célula tem atraso
cada fio tem atraso
cada carga afeta o atraso
```

Se uma saída depende de caminhos com atrasos diferentes, podem aparecer glitches, violações de timing ou comportamento incorreto em sistemas síncronos.

A ferramenta pode precisar adicionar:

- buffers;
- inversores;
- células maiores;
- reestruturação lógica;
- balanceamento de caminhos;
- duplicação de lógica;
- mudanças de mapeamento.

O objetivo é preservar a função lógica e atender às restrições de operação.

---

### Slide 10 — Basic Synthesis Flow

O slide mostra um fluxo básico de síntese:

```text
Develop HDL files
       ↓
Specify libraries
       ↓
Read design
       ↓
Define design environment
       ↓
Set design constraints
       ↓
Optimize the design
       ↓
Analyze and resolve design problems
       ↓
Save the design database
```

Comandos/constraints laterais mostrados:

#### Design rule constraints

```tcl
set_max_transition
set_max_fanout
set_max_capacitance
```

#### Optimization command

```tcl
compile
```

#### Design optimization constraints

```tcl
create_clock
set_clock_latency
set_propagated_clock
set_clock_uncertainty
set_clock_transition
set_input_delay
set_output_delay
set_max_area
```

#### Análise

```tcl
check_design
report_area
report_constraints
report_timing
```

#### Escrita

```tcl
write
```

Interpretação:

Este slide é um dos mais importantes da aula. Ele mostra que síntese é um fluxo guiado por comandos e constraints.

A ferramenta precisa saber:

```text
quais arquivos HDL ler
quais bibliotecas usar
qual é o ambiente do design
quais clocks existem
quais atrasos de entrada/saída considerar
quais limites de transição/carga/fanout respeitar
qual meta de área/timing/potência perseguir
```

Depois da otimização, o engenheiro analisa relatórios. Se houver violações, ele ajusta constraints, RTL ou ambiente e roda novamente.

---

### Slide 11 — Scope of Logic Synthesis in the Standard Cell Design Flow

O slide lista o escopo da síntese lógica.

#### Logic-level behavior to structural implementation

- Logic equations and/or FSM to connected gates.

Interpretação:

A ferramenta transforma equações lógicas, RTL e FSMs em portas conectadas.

#### Combinational logic synthesis

- Two-level minimization:
  - sum of products;
  - product of sums.
- Best possible performance:
  - longest path = 2 gates;
  - AND gate + OR gate;
  - OR gate + AND gate.
- Minimize size:
  - minimum cover;
  - minimum cover that is prime;
  - heuristics.
- Multilevel minimization:
  - trade performance for size;
  - Pareto-optimal solution;
  - heuristics.

Interpretação:

Síntese combinacional pode tentar reduzir a lógica em duas camadas ou múltiplas camadas.

Duas camadas podem ser rápidas, mas podem exigir área grande. Múltiplos níveis reduzem área, mas podem aumentar atraso.

#### FSM synthesis

- State minimization.
- State encoding.

Interpretação:

Para máquinas de estados, a ferramenta pode:

```text
reduzir número de estados equivalentes
escolher codificação dos estados
```

Exemplos de codificação:

```text
binary
one-hot
gray
custom encoding
```

A escolha afeta timing, área e potência.

A figura lateral mostra uma ferramenta de síntese recebendo HDL, constraints/timing/power, physical macro, technology library, symbol library e SDF/SPEF, e gerando netlist otimizada, relatórios e dados para place & route, timing/power analysis e formal verification.

---

### Slide 12 — Synthesis: Input and Output Files

O slide lista entradas e saídas da síntese.

#### Inputs to synthesis

Design files in HDL:

- Verilog models;
- VHDL models;
- SystemVerilog models;
- Gate-level netlist in Verilog format.

Design constraints:

- Timing constraint in SDC format.
- Power constraint in UPF format.

Technology library:

- TLU files.
- Verilog models.
- Symbol library.

A figura mostra entradas para uma ferramenta como Fusion Compiler:

```text
Design source code:
  Verilog (.v)
  VHDL (.vhdl)

Synthesis scripts:
  .tcl

Design constraints:
  .con, .sdc
```

#### Outputs from synthesis

- Design netlist database.
- Gate-level Verilog netlist.
- Reports and logs.

A figura mostra saídas:

```text
Reports and logs
Design database
Gate-level Verilog description
```

Interpretação:

Síntese é dependente de arquivos corretos. Se a ferramenta recebe RTL, constraints ou bibliotecas erradas, o resultado será errado ou inútil.

Entradas fundamentais:

```text
RTL + libraries + constraints + scripts
```

Saídas fundamentais:

```text
netlist + database + reports + logs
```

---

### Slide 13 — Optimization Tradeoffs

Texto do slide:

- Circuit design is a tradeoff of timing, power, and area.
- Timing optimization:
  - Goal: small delays.
- Power optimization:
  - Goal: low power consumption.
- Area optimization:
  - Goal: small area.

A figura mostra a mesma função:

```text
Y = a + b + c + d
```

implementada de formas diferentes, com potências totais diferentes:

```text
Total power ≈ 6
Total power ≈ 5
```

Interpretação:

A mesma função lógica pode ser implementada por redes diferentes de portas.

Uma implementação pode ser:

- mais rápida;
- menor;
- consumir menos potência.

Mas raramente maximiza tudo ao mesmo tempo.

Exemplo de tradeoff:

```text
usar células maiores:
  melhora timing
  aumenta área
  aumenta potência

usar células menores:
  reduz área/potência
  piora timing

adicionar buffers:
  melhora transição/fanout
  aumenta área/potência

reestruturar lógica:
  pode melhorar caminho crítico
  pode aumentar número de células
```

A ferramenta de síntese tenta encontrar uma solução aceitável para as metas impostas pelas constraints.

---

### Slide 14 — Backend Design Flow

Texto do slide:

- Also called physical synthesis.

A figura mostra:

```text
Gate-level Verilog from synthesis
       ↓
Place and route
       ↓
Final layout for fabrication
       ↓
Gate-level Verilog

DRC — Design rule check
LVS — Layout vs. schematic

Timing information
       ↓
Gate-level dynamic and/or static timing analysis
```

Interpretação:

O back-end pega a netlist gerada pela síntese e a transforma em layout físico.

Etapas principais:

```text
place and route
DRC
LVS
timing analysis
```

DRC verifica se o layout respeita regras de fabricação.

LVS verifica se o layout implementa o mesmo circuito da netlist/esquemático.

STA e simulação pós-layout avaliam se o design ainda fecha timing depois de considerar fios reais, parasitas e clock tree.

---

### Slide 15 — Physical Synthesis (1/3)

Texto do slide:

- Physical synthesis is the process that produces a layout of logic circuit.
- Steps:
  - Floorplanning.
  - Placement.
  - Routing.

A figura mostra:

```text
Circuit + standard cell layouts → physical synthesis → layout
```

Interpretação:

Síntese física transforma uma representação lógica em representação física.

Ela precisa decidir:

```text
onde cada bloco/célula fica
como as conexões são roteadas
como clock e power são distribuídos
como minimizar congestionamento e atraso
```

As três etapas básicas:

#### Floorplanning

Define a organização global do chip/bloco.

#### Placement

Posiciona células e macros.

#### Routing

Cria conexões físicas entre pinos/células usando camadas metálicas.

---

### Slide 16 — Physical Synthesis (2/3)

Texto do slide:

- Floorplanning is the process of how the overall chip layout boundary is defined, including for individual design elements, cell size, supply network, and so on.

A figura mostra uma grade retangular de floorplan.

Interpretação:

Floorplanning define a “planta” do chip ou bloco.

Decisões típicas:

- tamanho do core;
- aspect ratio;
- localização de macros;
- regiões reservadas;
- canais de roteamento;
- power grid;
- localização de I/O;
- regiões de clock;
- halos/blockages;
- hierarquia física.

Um floorplan ruim pode tornar impossível fechar timing ou routing, mesmo que o RTL esteja correto.

---

### Slide 17 — Physical Synthesis (3/3)

Texto do slide:

- Placement.
- Modules, which can be standard cells or IPs, are placed and positioned.
- The goal is to minimize the total area and interconnect length.

A figura mostra:

```text
Cells from a circuit → Floor plan → Placed design
```

Interpretação:

Placement posiciona fisicamente as células no floorplan.

Objetivos:

```text
reduzir comprimento total dos fios
reduzir congestionamento
melhorar timing
preservar área
facilitar roteamento
respeitar regiões proibidas
```

O comprimento dos fios importa porque interconexões têm resistência e capacitância. Isso afeta:

```text
delay
power
slew/transição
crosstalk
timing closure
```

---

### Slide 18 — Digital IC Design Flow

O slide mostra o fluxo de projeto digital com ferramentas Synopsys.

Fluxo visual reconstruído:

```text
Specification
       ↓
Cell description coding (RTL)
       ↓
Description simulation             → VCS
       ↓
Logic synthesis                    → Design Compiler
       ↓
Formal verification
  RTL vs. gate-level netlist        → Formality
       ↓
Prelayout STA                      → PrimeTime
       ↓
Timing OK?
       ↓
Floorplanning, placement & routing → IC Compiler
       ↓
Formal verification
  Layout vs. synthesized netlist
       ↓
Postlayout STA                     → StarRC + PrimeTime
       ↓
Timing OK?
       ↓
Finished design
```

Interpretação:

Esse slide coloca cada ferramenta no fluxo:

| Etapa | Ferramenta |
|---|---|
| Simulação RTL | VCS |
| Síntese lógica | Design Compiler |
| Verificação formal RTL vs netlist | Formality |
| STA pré-layout | PrimeTime |
| Place and route | IC Compiler |
| Extração parasitária pós-layout | StarRC |
| STA pós-layout | PrimeTime |

O fluxo tem checkpoints de timing antes e depois do layout.

---

### Slide 19 — Design Environment of Logic Synthesis

A figura mostra o ambiente de síntese lógica.

Entradas:

```text
RTL code — Verilog/VHDL
Constraints
Cell library — logical description
```

Exemplos de constraints no slide:

```text
clock period
input delay
output delay
load 0.25
```

Saída:

```text
Gate-level netlist — Verilog/VHDL
```

Depois a netlist segue para:

```text
Physical design — Physical synthesis tool
```

Interpretação:

A síntese lógica precisa entender não só a função do RTL, mas também o ambiente em que o bloco vai operar.

Exemplo:

```text
clock period = 10 ns
input delay = 2 ns
output delay = 1 ns
load = 0.25
```

Isso muda a otimização. Um circuito que fecha timing com clock de 20 ns talvez não feche com clock de 2 ns. A mesma lógica pode exigir células maiores, menos níveis lógicos ou mais buffers.

---

### Slide 20 — Design Environment of Physical Synthesis

A figura mostra o ambiente de síntese física.

Entradas:

```text
Gate-level netlist — Verilog/VHDL
Design constraints
Cell library — physical description
```

Ferramenta:

```text
Physical design tool
```

Saída:

```text
Layout
```

Interpretação:

A síntese física precisa da netlist e das constraints, mas agora também precisa da descrição física das células.

A biblioteca física contém informações como:

- tamanho da célula;
- formato/layout;
- pinos físicos;
- camadas;
- obstruções;
- sites/rows;
- regras físicas;
- views para place and route.

A síntese lógica usa mais fortemente a visão lógica/timing da biblioteca. A síntese física usa a visão física/layout.

---

### Slide 21 — Physical Synthesis Circuit Optimization (1/3)

Texto do slide:

- Routes the circuit interconnections.
- Optimizes the cell as required by the designer.
- Optimizations:
  - Area.
  - Interconnect length.
  - Power density.
  - Clock distribution.
  - and so on.

Interpretação:

A síntese física não é apenas “desenhar fios”. Ela também otimiza o circuito considerando efeitos físicos.

Exemplos:

#### Área

Compactar células e macros sem violar regras.

#### Interconnect length

Reduzir comprimento de fios para melhorar timing e potência.

#### Power density

Evitar regiões de alta densidade de potência e problemas térmicos/IR drop.

#### Clock distribution

Distribuir o clock de forma balanceada e robusta.

---

### Slide 22 — Physical Synthesis Circuit Optimization (2/3)

Texto do slide:

- Clock delay problems:
  - Do not arrive at same time at all timing elements.
  - Clock is characterized by clock skew and clock jitter.
  - Clock skew and clock jitter cause timing problems in synchronous ASIC designs which eventually cause functional failures.
- All clock pins are driven by a single clock source.

A figura mostra uma fonte de clock dirigindo muitos elementos sequenciais com caminhos de clock diferentes.

Interpretação:

Em teoria, todos os flip-flops recebem o clock ao mesmo tempo. Na prática, o clock percorre fios e buffers diferentes até chegar a cada elemento.

Isso causa:

#### Clock skew

Diferença de chegada do mesmo clock em diferentes flip-flops.

```text
skew = chegada no FF2 - chegada no FF1
```

#### Clock jitter

Variação temporal da borda do clock ao longo do tempo, por ruído, PLL, variação de fonte, etc.

Problemas causados:

- violações de setup;
- violações de hold;
- captura no ciclo errado;
- perda de margem temporal;
- falhas funcionais em designs síncronos.

Esse slide prepara o conceito de Clock-Tree Synthesis.

---

### Slide 23 — Physical Synthesis Circuit Optimization (3/3)

Texto do slide:

- Clock-Tree Synthesis.
  - A buffer tree is built to balance the loads and minimize the delays.

A figura mostra uma árvore de clock com buffers distribuindo clock para múltiplos elementos.

Interpretação:

Clock-Tree Synthesis, ou CTS, constrói uma árvore de buffers/inversores para distribuir clock de forma controlada.

Objetivos da CTS:

```text
reduzir skew
controlar insertion delay
balancear cargas
melhorar slew do clock
reduzir violações de timing
distribuir clock de forma roteável
```

Sem CTS, uma fonte de clock dirigindo muitos flip-flops teria carga enorme e atrasos muito diferentes.

Com CTS, a rede de clock vira uma árvore hierárquica:

```text
clock source
  → buffer
    → buffers intermediários
      → grupos de flip-flops
```

A árvore tenta fazer a borda de clock chegar em tempos próximos aos elementos sequenciais.

---

## Aula didática desenvolvida

### 1. O que significa “síntese” no fluxo digital?

Síntese é o processo de transformar uma descrição de alto nível do circuito em uma implementação estrutural.

No começo, o designer escreve algo como:

```systemverilog
assign y = (a | b) & c;
```

Essa linha descreve uma função. Ela não diz qual célula física será usada, qual porta AND da biblioteca será escolhida, qual será o atraso, a área, a potência ou o posicionamento físico.

A síntese transforma essa intenção em uma estrutura:

```verilog
OR2  U1 (.A(a), .B(b), .Y(n1));
AND2 U2 (.A(n1), .B(c), .Y(y));
```

Essa estrutura é chamada de **netlist**.

Uma netlist é uma lista de instâncias e conexões:

```text
quais células existem
como seus pinos estão conectados
quais nets ligam uma célula à outra
```

---

### 2. Por que a biblioteca de células é indispensável?

A ferramenta de síntese não inventa uma célula do nada. Ela escolhe células disponíveis em uma biblioteca.

A biblioteca informa:

```text
esta célula é uma AND de 2 entradas
esta célula tem este atraso
esta célula tem esta área
esta célula consome esta potência
esta célula suporta esta carga
esta célula tem este layout físico
```

Exemplo de células:

```text
AND2_X1
AND2_X2
OR2_X1
INV_X1
INV_X4
DFF_X1
MUX2_X1
BUF_X8
```

O sufixo `_X1`, `_X2`, `_X4` costuma indicar força de drive. Uma célula mais forte pode dirigir cargas maiores e reduzir atraso, mas geralmente consome mais área e potência.

---

### 3. Generic library versus technology library

O slide fala em generic library no início.

Pense em duas fases:

#### Generic logic

A ferramenta representa a função usando portas genéricas:

```text
AND
OR
NOT
XOR
MUX
DFF
```

Ainda não está totalmente presa a uma célula real de tecnologia.

#### Technology mapping

Depois, a ferramenta mapeia essa lógica para células reais da biblioteca alvo:

```text
AND2_X1
NAND2_X2
AOI21_X1
OAI22_X1
DFFR_X1
```

Esse mapeamento considera timing, área, potência e constraints.

---

### 4. Front-end versus back-end

A aula separa bem os dois mundos.

#### Front-end

Foco:

```text
função
RTL
simulação
síntese lógica
gate-level netlist
```

Perguntas típicas:

```text
A função está correta?
O RTL simula corretamente?
A síntese gerou uma netlist equivalente?
A netlist fecha timing estimado?
```

#### Back-end

Foco:

```text
layout físico
floorplan
placement
routing
clock tree
DRC
LVS
STA pós-layout
```

Perguntas típicas:

```text
O circuito cabe no chip?
Os fios roteiam?
O clock chega bem?
As regras de fabricação são respeitadas?
O layout implementa a netlist?
O timing fecha com parasitas reais?
```

---

### 5. O papel das constraints

Constraints dizem à ferramenta quais metas e condições o design deve respeitar.

Sem constraints, a ferramenta não sabe:

```text
qual é a frequência do clock
quanto atraso externo já existe na entrada
quanto tempo o próximo bloco precisa na saída
qual carga será dirigida
qual fanout máximo é aceitável
qual transição máxima é permitida
qual área máxima buscar
```

Exemplos:

```tcl
create_clock -period 10 [get_ports clk]
set_input_delay 2 -clock clk [all_inputs]
set_output_delay 1 -clock clk [all_outputs]
set_max_transition 0.2 [current_design]
set_max_fanout 16 [current_design]
set_max_area 0
```

Essas constraints não são detalhe burocrático. Elas guiam a otimização.

---

### 6. O que significa “otimizar” na síntese?

Otimizar significa alterar a implementação sem alterar a função lógica.

A ferramenta pode:

```text
trocar uma célula fraca por uma forte
trocar uma rede AND/OR por NAND/NOR/AOI/OAI
adicionar buffers
remover lógica redundante
compartilhar lógica comum
duplicar lógica para reduzir fanout
reestruturar caminhos críticos
alterar codificação de FSM
```

Exemplo:

Uma expressão pode ser implementada como:

```text
(a + b) + (c + d)
```

ou como:

```text
a + b + c + d
```

Com células diferentes e agrupamentos diferentes, a área, potência e timing mudam.

---

### 7. Timing, power e area: o triângulo de tradeoff

O slide mostra que design de circuito é compromisso entre:

```text
timing
power
area
```

#### Otimizar timing

Meta:

```text
reduzir delay
```

Possíveis ações:

- usar células maiores;
- reduzir níveis lógicos;
- adicionar buffers;
- duplicar lógica;
- reestruturar caminho crítico.

Custo provável:

```text
mais área e mais potência
```

#### Otimizar potência

Meta:

```text
reduzir consumo
```

Possíveis ações:

- usar células menores;
- reduzir capacitância com menos buffers;
- reduzir switching;
- clock gating;
- escolher implementação com menor atividade;
- reduzir comprimento de fios.

Custo provável:

```text
pode piorar timing
```

#### Otimizar área

Meta:

```text
reduzir tamanho
```

Possíveis ações:

- usar células menores;
- compartilhar lógica;
- reduzir redundância;
- aceitar mais níveis lógicos.

Custo provável:

```text
pode piorar timing
```

Não existe implementação universalmente melhor. Existe implementação melhor para um conjunto de constraints.

---

### 8. Logic synthesis versus physical synthesis

#### Logic synthesis

Entrada:

```text
RTL
constraints
biblioteca lógica/timing
```

Saída:

```text
netlist de portas/células
relatórios de timing, área, potência
```

Foco:

```text
função lógica e otimização estrutural
```

#### Physical synthesis

Entrada:

```text
netlist
constraints
biblioteca física
informações de tecnologia
```

Saída:

```text
layout
netlist pós-layout
parasitics
relatórios físicos
```

Foco:

```text
posicionamento, roteamento, clock, parasitas, DRC/LVS e timing físico
```

A fronteira entre as duas pode ser integrada em ferramentas modernas, mas conceitualmente a diferença continua importante.

---

### 9. O que é STA e por que aparece várias vezes?

STA significa **Static Timing Analysis**.

STA verifica caminhos temporais sem precisar simular todos os vetores de entrada.

Ela responde:

```text
os dados chegam a tempo antes da borda de captura?
os dados permanecem estáveis tempo suficiente depois da borda?
```

Principais checagens:

```text
setup
hold
recovery/removal
clock gating checks
```

O slide mostra STA antes e depois do layout:

#### Prelayout STA

Usa estimativas de atraso antes do layout físico final.

#### Postlayout STA

Usa parasitas extraídos do layout, sendo muito mais realista.

Ferramentas citadas:

```text
PrimeTime
StarRC + PrimeTime
```

---

### 10. Por que existe verificação formal depois da síntese?

Depois da síntese, o RTL foi transformado em netlist.

É preciso garantir:

```text
a netlist implementa a mesma função do RTL?
```

Simular todos os casos pode ser inviável. Por isso se usa formal equivalence checking.

Ferramenta citada:

```text
Formality
```

No fluxo:

```text
RTL vs gate-level netlist
```

Depois do physical design, pode haver outra verificação:

```text
layout vs synthesized netlist
```

A ideia é garantir que as transformações não mudaram a função.

---

### 11. DRC e LVS no back-end

#### DRC — Design Rule Check

Verifica regras geométricas de fabricação.

Exemplos:

```text
largura mínima de metal
espaçamento mínimo
via enclosure
densidade de metal
regras de antena
```

Se DRC falha, o layout pode não ser fabricável.

#### LVS — Layout versus Schematic

Compara o circuito extraído do layout com a netlist/esquemático esperado.

Pergunta:

```text
o layout implementa o mesmo circuito?
```

Se LVS falha, pode haver curto, abertura, dispositivo faltando, conexão errada ou pino trocado.

---

### 12. Por que o clock é tão difícil no back-end?

Clock é um sinal especial porque controla todos os elementos sequenciais.

Se o clock chega tarde em alguns flip-flops e cedo em outros, o tempo disponível para dados muda.

#### Clock skew

Diferença de chegada entre pontos da rede de clock.

#### Clock jitter

Variação da borda do clock ao longo do tempo.

Ambos reduzem margem temporal.

Exemplo conceitual:

```text
Clock ideal:
  todos os FFs capturam exatamente ao mesmo tempo.

Clock real:
  FF1 recebe clock em 0.00 ns
  FF2 recebe clock em 0.18 ns
  FF3 recebe clock em 0.25 ns
```

Essa diferença pode criar violações de setup ou hold.

---

### 13. Clock-Tree Synthesis

CTS constrói uma rede de buffers para distribuir clock.

Sem CTS:

```text
uma fonte de clock tenta dirigir muitos flip-flops diretamente
```

Problemas:

- carga enorme;
- atraso grande;
- skew alto;
- transição ruim;
- timing instável.

Com CTS:

```text
fonte de clock → buffers intermediários → grupos de flip-flops
```

Objetivos:

```text
balancear atrasos
reduzir skew
controlar slew
reduzir carga direta
melhorar robustez temporal
```

CTS é uma etapa central do physical design.

---

## Conceitos difíceis explicados em profundidade

### 1. Netlist

Uma netlist é uma descrição estrutural do circuito.

Exemplo:

```verilog
INV_X1 U1 (
  .A(a),
  .Y(n1)
);

AND2_X1 U2 (
  .A(n1),
  .B(b),
  .Y(c)
);
```

Cada instância representa uma célula. Cada net representa uma conexão.

Erros comuns:

- achar que netlist é “código RTL otimizado”;
- esquecer que a netlist já está mapeada para células;
- simular netlist sem as bibliotecas corretas;
- comparar netlist com RTL sem considerar resets, Xs e constraints corretas.

---

### 2. Standard cells

Standard cells são células pré-projetadas com altura padronizada para encaixar em rows no layout.

Exemplos:

```text
INV
NAND
NOR
AOI
OAI
MUX
DFF
LATCH
BUF
TIEHI/TIELO
```

Cada célula tem múltiplas views:

```text
lógica
timing
power
layout
símbolo
Verilog model
```

A síntese usa essas views conforme a etapa.

---

### 3. Fanout

Fanout é o número de entradas dirigidas por uma saída.

Exemplo:

```text
um sinal reset dirigindo 200 flip-flops tem fanout alto
```

Fanout alto aumenta carga capacitiva e piora transição/delay.

Constraint:

```tcl
set_max_fanout 16 [current_design]
```

A ferramenta pode inserir buffers para reduzir fanout efetivo.

---

### 4. Transition / slew

Transition, ou slew, é o tempo que um sinal leva para mudar de 0 para 1 ou de 1 para 0.

Se a transição é lenta:

- aumenta consumo interno;
- piora timing;
- pode violar regra da biblioteca;
- pode causar comportamento instável.

Constraint:

```tcl
set_max_transition 0.2 [current_design]
```

---

### 5. Capacitance / load

A saída de uma célula enxerga uma carga capacitiva. Essa carga vem de:

```text
entradas das células conectadas
fios/interconexões
pinos de saída
carga externa
```

Constraint:

```tcl
set_max_capacitance 0.25 [current_design]
```

ou:

```tcl
set_load 0.25 [get_ports out]
```

Carga maior aumenta delay e potência dinâmica.

---

### 6. Clock period

`create_clock` define o período do clock.

Exemplo:

```tcl
create_clock -period 10 [get_ports clk]
```

Isso significa:

```text
clock de 10 ns → 100 MHz
```

A ferramenta usa esse período para otimizar caminhos reg-to-reg.

Se o período for apertado, a ferramenta precisa usar mais esforço, células maiores ou reestruturação.

---

### 7. Input delay e output delay

Um bloco raramente existe isolado. Ele conversa com blocos externos.

#### Input delay

Tempo já gasto antes do sinal chegar ao bloco.

```tcl
set_input_delay 2 -clock clk [get_ports data_in]
```

Isso diz:

```text
o dado de entrada chega 2 ns depois da borda de clock externa
```

#### Output delay

Tempo reservado para o bloco seguinte.

```tcl
set_output_delay 1 -clock clk [get_ports data_out]
```

Isso diz:

```text
o próximo bloco precisa de 1 ns fora deste bloco
```

Essas constraints evitam que a ferramenta assuma que todo o período de clock pertence ao bloco atual.

---

### 8. Clock uncertainty

Clock uncertainty representa incertezas de clock, incluindo jitter, skew estimado e margem.

Exemplo:

```tcl
set_clock_uncertainty 0.1 [get_clocks clk]
```

Isso reduz o tempo disponível para o dado, tornando a análise mais conservadora.

Sem uncertainty, o design pode parecer fechar timing de forma otimista.

---

### 9. Gate-level simulation

Depois da síntese, a netlist pode ser simulada.

Objetivos:

- detectar problemas de reset/X;
- checar comportamento pós-síntese;
- validar inicializações;
- rodar simulação com atrasos anotados, quando aplicável.

Mas gate-level simulation é mais lenta que simulação RTL e não substitui STA nem formal equivalence checking.

---

### 10. SDC e UPF

O slide cita:

```text
Timing constraint in SDC format
Power constraint in UPF format
```

#### SDC — Synopsys Design Constraints

Define clocks, delays, exceptions, loads, transitions e outras restrições temporais.

#### UPF — Unified Power Format

Define power intent:

```text
power domains
power switches
isolation
retention
level shifters
power states
```

Neste bloco, eles aparecem apenas como entradas de síntese. Em blocos posteriores, SDC e UPF serão aprofundados.

---

### 11. Timing prelayout versus postlayout

#### Prelayout

Antes de place and route, a ferramenta estima atrasos de fios.

Pode usar wireload models ou estimativas físicas.

#### Postlayout

Depois de routing, parasitas reais são extraídos.

A análise pós-layout é mais confiável porque inclui:

```text
resistência dos fios
capacitância dos fios
acoplamento
clock tree real
posicionamento real
```

Por isso o fluxo verifica timing antes e depois do layout.

---

### 12. Interconnect

No passado, o atraso das portas dominava. Em tecnologias modernas, o atraso dos fios/interconexões é muito importante.

Interconnect afeta:

- delay;
- power;
- crosstalk;
- congestion;
- IR drop;
- routing feasibility.

Por isso physical synthesis precisa otimizar comprimento de interconexão e posicionamento.

---

### 13. Floorplan ruim pode matar o timing

Mesmo uma netlist boa pode falhar se o floorplan for ruim.

Exemplo:

```text
blocos que conversam muito são colocados longe
clock precisa atravessar o chip inteiro
macros bloqueiam rotas críticas
power grid ocupa regiões importantes
```

Consequências:

- fios longos;
- congestionamento;
- buffers demais;
- timing ruim;
- potência maior.

---

### 14. Placement e timing

Placement não busca apenas encaixar células. Ele também tenta reduzir caminhos críticos.

Se duas células conectadas por um caminho crítico ficam longe, o fio aumenta delay.

Ferramentas modernas usam timing-driven placement:

```text
posicionar células críticas mais perto
reduzir delay de interconexão
evitar congestionamento
```

---

### 15. Roteamento e parasitas

Routing cria os fios reais. Depois do roteamento, é possível extrair parasitas:

```text
R — resistência
C — capacitância
```

Esses parasitas entram na STA pós-layout.

Ferramenta citada no fluxo:

```text
StarRC
```

Ela extrai RC para análise com PrimeTime.

---

## Figuras, diagramas e waveforms importantes

### Página 1 — Cell-Based Automated Design

A figura mostra a relação entre processo, regras de projeto, biblioteca de células, RTL/lógica, ferramentas EDA e design final. Estude essa figura como a visão geral do design cell-based.

### Página 1 — Concept of Automated Design (1/3)

A figura transforma uma expressão booleana em circuito lógico. Ela mostra que síntese começa convertendo função em rede de portas.

### Página 2 — Front-end e back-end

A lista diferencia tarefas do front-end e do back-end. Essa distinção é central para entender o restante do curso.

### Página 3 — Front-End Design Flow

A figura mostra a transformação de especificação em RTL, depois em síntese e netlist gate-level. O exemplo `c = !a & b` vira inversor + AND.

### Página 3 — Basic Steps of Synthesis

A figura mostra a passagem de descrição de circuito para lógica, depois para síntese física e layout. Ela conecta logic synthesis e physical synthesis.

### Página 4 — Digital IC Specification

A figura do contador up/down mostra como uma função digital vira HDL. É um exemplo de especificação funcional representada por código sintetizável.

### Página 4 — Logic Synthesis Process Representation

A figura mostra circuito descrito, células padrão e resultado lógico. Ela resume a ideia de mapeamento para standard cells.

### Página 5 — Logic Synthesis

A figura mostra que atrasos de elementos internos podem afetar o resultado e que elementos adicionais podem ser necessários para operação correta. Estude como introdução à otimização por timing.

### Página 5 — Basic Synthesis Flow

Esta é uma das figuras mais importantes do bloco. Ela conecta arquivos HDL, bibliotecas, leitura do design, constraints, otimização, relatórios e escrita da database/netlist.

### Página 6 — Scope of Logic Synthesis

A figura mostra a ferramenta de síntese recebendo HDL, constraints, bibliotecas e dados físicos e entregando netlist otimizada, relatórios e dados para timing/power/formal/place-route.

### Página 6 — Synthesis Input and Output Files

A figura mostra entradas e saídas da síntese. Memorize o trio:

```text
RTL + scripts + constraints → synthesis tool → netlist + database + reports
```

### Página 7 — Optimization Tradeoffs

A figura mostra duas implementações da mesma função com potência diferente. Ela ilustra que não existe implementação única e que a ferramenta escolhe conforme objetivo.

### Página 7 — Backend Design Flow

A figura mostra gate-level Verilog indo para place and route, layout final, DRC, LVS e análise temporal. É a ponte para physical design.

### Página 8 — Physical Synthesis 1/3, 2/3 e 3/3

Essas figuras mostram a passagem de circuito/células para layout, depois floorplan e placement. Elas explicam visualmente como o circuito ganha forma física.

### Página 9 — Digital IC Design Flow

A figura mapeia o fluxo completo com ferramentas: VCS, Design Compiler, Formality, PrimeTime, IC Compiler e StarRC. É uma visão de alto valor para entender o ecossistema Synopsys.

### Página 9 — Design Environment of Logic Synthesis

A figura mostra RTL, constraints e cell library entrando na síntese lógica e gerando netlist para physical design.

### Página 10 — Design Environment of Physical Synthesis

A figura mostra netlist, constraints e biblioteca física entrando no physical design tool para gerar layout.

### Página 10 — Physical Synthesis Circuit Optimization 1/3

A figura lista otimizações físicas: área, comprimento de interconexão, densidade de potência e distribuição de clock.

### Página 11 — Clock delay problems e CTS

As figuras mostram primeiro a distribuição de clock sem balanceamento e depois a árvore de clock com buffers. Elas explicam por que CTS existe: reduzir skew, balancear carga e controlar atraso.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é logic synthesis?**  
   É o processo de transformar uma descrição funcional/RTL em um circuito lógico estrutural, normalmente uma netlist de portas/células.

2. **O que é physical synthesis?**  
   É o processo de produzir layout físico a partir de uma representação lógica/netlist, usando floorplanning, placement e routing.

3. **Quais são as etapas básicas da síntese mostradas no slide?**  
   Circuit description → Logic synthesis → Logic circuit → Physical synthesis → Layout of finished design.

4. **Quais tarefas pertencem ao front-end?**  
   System specification, HDL coding, behavioral simulation, synthesis e gate-level simulation.

5. **Quais tarefas pertencem ao back-end?**  
   Floorplanning, placement, power-grid design, CTS, routing, DRC, LVS, STA e simulação dinâmica/pós-layout.

6. **O que é uma standard cell library?**  
   Uma biblioteca de células previamente projetadas e caracterizadas que a síntese usa para construir circuitos digitais.

7. **Quais entradas típicas da síntese aparecem no slide?**  
   HDL files, design constraints e technology library.

8. **Quais saídas típicas da síntese aparecem no slide?**  
   Design netlist database, gate-level Verilog netlist, reports e logs.

9. **Quais constraints de design rule aparecem no fluxo básico?**  
   `set_max_transition`, `set_max_fanout`, `set_max_capacitance`.

10. **Quais constraints de otimização aparecem no fluxo básico?**  
    `create_clock`, `set_clock_latency`, `set_propagated_clock`, `set_clock_uncertainty`, `set_clock_transition`, `set_input_delay`, `set_output_delay`, `set_max_area`.

11. **Quais relatórios/comandos de análise aparecem?**  
    `check_design`, `report_area`, `report_constraints`, `report_timing`.

12. **Qual comando de otimização aparece no fluxo?**  
    `compile`.

13. **Quais são os três grandes objetivos de otimização?**  
    Timing, power e area.

14. **O que é DRC?**  
    Design Rule Check: verifica se o layout respeita regras de fabricação.

15. **O que é LVS?**  
    Layout versus Schematic: verifica se o layout implementa o mesmo circuito da netlist/esquemático.

16. **O que é clock skew?**  
    Diferença de chegada do clock entre diferentes elementos sequenciais.

17. **O que é clock jitter?**  
    Variação temporal da borda do clock.

18. **Para que serve CTS?**  
    Para construir uma árvore de buffers de clock que balanceia cargas e minimiza atrasos/skew.

19. **Qual ferramenta aparece associada à simulação RTL?**  
    VCS.

20. **Qual ferramenta aparece associada à síntese lógica?**  
    Design Compiler.

21. **Qual ferramenta aparece associada à equivalência formal?**  
    Formality.

22. **Qual ferramenta aparece associada à STA?**  
    PrimeTime.

23. **Qual ferramenta aparece associada a place and route?**  
    IC Compiler.

24. **Qual ferramenta aparece associada à extração pós-layout?**  
    StarRC.

### Pegadinhas

- Síntese não é apenas tradução direta de equações para portas; ela também otimiza.
- Uma função booleana pode ter várias implementações com timing/power/area diferentes.
- Front-end não termina no RTL; inclui síntese e gate-level simulation.
- Back-end não é só layout visual; inclui DRC, LVS, clock tree, routing e timing.
- Logic synthesis gera netlist; physical synthesis gera layout.
- SDC define constraints de timing; UPF define power intent.
- `create_clock` é essencial; sem clock a ferramenta não entende metas temporais.
- Input/output delay modelam o ambiente externo ao bloco.
- `set_max_fanout`, `set_max_transition` e `set_max_capacitance` são design rule constraints, não apenas metas opcionais.
- Timing pré-layout é estimado; timing pós-layout é mais realista.
- Clock skew e jitter podem causar falhas funcionais.
- CTS não elimina todo atraso; ela controla e balanceia a distribuição do clock.

### Frases para memorizar

```text
Síntese lógica transforma RTL em netlist.
Síntese física transforma netlist em layout.
Front-end cuida da função; back-end cuida da implementação física.
Biblioteca de células é o conjunto de peças que a síntese pode usar.
Constraints dizem à ferramenta o que significa “bom” para timing, power e area.
Timing, power e area formam um tradeoff.
DRC verifica fabricabilidade; LVS verifica equivalência layout-circuito.
CTS constrói uma árvore de buffers para distribuir clock com menor skew.
```

---

## Relação com projeto/laboratorio

Esta aula é a base para entender os próximos blocos de síntese. Ela prepara o terreno para:

```text
arquivos de design
arquivos de constraints
scripts Tcl
bibliotecas
compile
relatórios
timing
área
potência
```

### Como isso aparece em um projeto real

Um fluxo básico de síntese pode ter:

```text
rtl/
  top.sv
  alu.sv
  control.sv

constraints/
  top.sdc

scripts/
  synth.tcl

reports/
  timing.rpt
  area.rpt
  constraints.rpt

outputs/
  top_netlist.v
  top.ddc
```

### Exemplo de script conceitual

```tcl
set search_path [list ./rtl ./libs]
set target_library [list my_stdcell.db]
set link_library   [list * my_stdcell.db]

read_verilog ./rtl/top.sv
current_design top
link

read_sdc ./constraints/top.sdc

check_design

compile

report_timing > reports/timing.rpt
report_area   > reports/area.rpt
report_constraints > reports/constraints.rpt

write -format verilog -hierarchy -output outputs/top_netlist.v
write -format ddc -hierarchy -output outputs/top.ddc
```

### Relação com os próximos blocos

O próximo bloco, **02 Design and Constraint Files for Synthesis**, deve aprofundar exatamente os arquivos que esta aula introduziu:

```text
HDL design files
constraint files
library files
scripts
SDC
ambiente de síntese
```

A ideia é sair da visão geral e começar a entender os arquivos concretos que uma ferramenta como Design Compiler/Fusion Compiler precisa para rodar síntese.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
- [x] A sugestão do próximo bloco seguiu o roteiro reenviado.

---

## Próximo bloco

**Bloco 019 — 02 Design and Constraint Files for Synthesis**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\02 Design and Constraint Files for Synthesis.docx
```

Faixa:

```text
Slides 1-11
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\02 Design and Constraint Files for Synthesis.md
```
