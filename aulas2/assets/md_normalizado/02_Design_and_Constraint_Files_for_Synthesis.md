# 02 Design and Constraint Files for Synthesis

## Controle do bloco

- **Bloco:** 019
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\02 Design and Constraint Files for Synthesis.docx`
- **Faixa processada:** slides 1-11
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\02 Design and Constraint Files for Synthesis.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O roteiro indica este bloco como `019` e o próximo como `020 — 03 High-Level Synthesis`.
- **Próximo bloco recomendado:** 020 — `03 High-Level Synthesis`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco aprofunda os arquivos e restrições usados em síntese: HDL, estilos de descrição, constraints de projeto, constraints de regra de design, design targets e etapas de síntese.

---

## Resumo executivo

Esta aula explica quais **arquivos**, **estilos de descrição** e **constraints** são usados para preparar um design para síntese. Ela continua a aula anterior, que apresentou a síntese como transformação de RTL em netlist e, depois, em implementação física.

O bloco começa relembrando que HDLs — Hardware Description Languages — são linguagens usadas para descrever a estrutura e o comportamento do hardware. As principais linguagens citadas são:

```text
VHDL
Verilog
SystemVerilog
```

Depois, a aula mostra o fluxo básico de projeto usando HDL e ferramentas EDA:

```text
escrever design
escrever testbench
simular
sintetizar
analisar relatórios
implementar em FPGA/ASIC
```

Um ponto essencial do slide é:

```text
HDL descreve hardware, não um programa comum.
```

Por isso, o estilo de descrição importa muito. O mesmo comportamento pode ser descrito em estilo estrutural, comportamental ou RTL. Para síntese, o estilo RTL é especialmente importante, pois descreve como registradores armazenam dados intermediários e como esses dados são transformados entre ciclos.

A parte mais importante do bloco é a seção de **design constraints**. As constraints são comandos passados às ferramentas EDA para orientar etapas como:

```text
synthesis
place and route
static timing analysis
```

O curso divide constraints em dois grupos:

```text
Design rule constraints
Optimization constraints
```

As **design rule constraints** vêm das regras da tecnologia/biblioteca e precisam ser respeitadas para garantir que as células, nets e interconexões operem dentro de limites aceitáveis. Os exemplos principais são:

```text
maximum transition delay
maximum fanout
maximum capacitance
```

As **optimization constraints** são definidas pelo designer para atingir metas de PPA:

```text
Performance
Power
Area
```

A aula também introduz **design targets**, como:

```text
PLA
ASIC
Gate array
FPGA
```

e fecha explicando as etapas de síntese: escolher o target, usar descrições comportamentais/estruturais, inferir registradores e lógica, gerar netlist e, depois, passar por síntese física, placement, routing e back-annotation de timing.

---

## Texto extraído e organizado por slide

### Slide 1 — Hardware Description Languages (HDLs) for Synthesis

O slide define HDL:

```text
HDL is a language used for describing the structure of hardware
and how the hardware should behave.
```

Tradução:

```text
HDL é uma linguagem usada para descrever a estrutura do hardware
e como o hardware deve se comportar.
```

Exemplos citados:

```text
Verilog
SystemVerilog
VHDL
```

#### HDLs populares

O slide lista:

```text
VHDL
  - Ada-like syntax originated as a DoD project
  - Now an IEEE standard

Verilog

SystemVerilog
  - Verilog was replaced by SystemVerilog in 2009
  - C-like and C++-like syntax originated in industry in 1984
  - Now an IEEE standard
```

#### Histórico de Verilog e SystemVerilog

O slide resume:

```text
Verilog developed by Gateway Design Automation in 1984,
later bought by Cadence.

Became an IEEE standard in 1995:
IEEE 1364-1995.

Major update in 2001:
IEEE 1364-2001.

Minor update in 2005.
Also in 2005, related language SystemVerilog was standardized as:
IEEE 1800-2005.

In 2009 Verilog and SystemVerilog merged:
IEEE 1800-2009.

Minor update in 2013:
IEEE 1800-2012.
```

Interpretação:

O slide posiciona as linguagens HDL como ponto de entrada do fluxo de síntese. O designer escreve a funcionalidade e a estrutura do hardware em uma dessas linguagens. Depois, a ferramenta de síntese interpreta essa descrição e tenta gerar uma implementação estrutural com portas e células.

Um ponto importante para prova é reconhecer que SystemVerilog é apresentado como evolução/substituição de Verilog no padrão IEEE mais moderno, embora, na prática industrial, muitos fluxos ainda aceitem arquivos Verilog e SystemVerilog juntos.

---

### Slide 2 — Design Flow Using HDL and EDA Tools

O slide descreve o fluxo de projeto usando HDL e ferramentas EDA.

Etapas listadas:

```text
Enter the design
Use your favorite text editor and HDL.

Enter testbench for design.
The testbench is used to check the correctness by simulations.
```

#### Simulação

O slide define simulação como um processo em que:

```text
Input values are applied to the circuit.
Outputs are checked for correctness.
Millions of dollars saved by debugging in simulation instead of hardware
using waveform viewer and other tools to find bugs, if any.
```

Interpretação:

A simulação permite verificar comportamento antes de fabricar hardware ou programar FPGA. Isso economiza custo porque bugs encontrados em simulação são muito mais baratos que bugs encontrados depois da fabricação.

#### Programa de síntese

O slide diz que o programa de síntese:

```text
Transforms HDL code into a netlist describing the hardware,
that is, a list of gates and the wires connecting them.
```

Também afirma:

```text
Synthesis reports indicate area and timing.
If the design results are not as expected in terms of area,
timing and power consumption, the design is restarted from first step.
```

E:

```text
Otherwise, tape out, or download the design to FPGA, and so on.
```

Por fim, o slide enfatiza:

```text
When describing circuits using an HDL, it is critical to think of the hardware
the code should produce.
```

Interpretação:

Este slide mostra o ciclo prático:

```text
HDL → testbench → simulação → síntese → relatórios → ajustes → implementação
```

A mensagem mais importante é que escrever HDL não é escrever software comum. Cada construção em HDL deve ser pensada em termos do hardware que ela irá inferir.

---

### Slide 3 — Hardware Description Styles (1/2)

O slide explica estilos de descrição em HDL.

Texto principal:

```text
Descriptive style refers to a set of rules that a description adheres to.
HDLs are used to write a hardware description or model and not program.
```

Tradução:

```text
Estilo descritivo refere-se a um conjunto de regras seguido por uma descrição.
HDLs são usadas para escrever uma descrição ou modelo de hardware, e não um programa.
```

#### Estilos descritivos

O slide lista:

```text
Structural
Behavioral
Register Transfer Language (RTL)
```

#### Structural

O slide define:

```text
How parts are connected, like a schematic.
Structural code describes the hardware topology.
Describes how a module is built from simpler modules.
```

Interpretação:

No estilo estrutural, o código mostra instâncias e conexões.

Exemplo:

```verilog
and_gate u1 (.a(a), .b(b), .y(n1));
or_gate  u2 (.a(n1), .b(c), .y(y));
```

Esse estilo é próximo de um esquemático textual.

#### Behavioral

O slide define:

```text
What hardware is supposed to do.
Behavioral code describes the hardware.
To describe what a module does.
For synthesis.
For testbench, used to verify correctness of part of functional descriptions by simulation.
```

Interpretação:

No estilo comportamental, o foco é descrever o que o módulo faz, não necessariamente como ele é montado internamente.

Exemplo:

```verilog
always @(*) begin
  y = (a & b) | c;
end
```

Esse estilo pode ser sintetizável ou não, dependendo dos constructs usados.

#### RTL — Register Transfer Language

O slide define RTL como:

```text
A form in which registers are used to store the processed intermediate data
and transferred for next process.
```

Tradução:

```text
Uma forma em que registradores são usados para armazenar os dados intermediários
processados e transferi-los para o próximo processo.
```

Interpretação:

RTL é o estilo mais usado para síntese digital. Ele descreve:

```text
registradores
lógica combinacional entre registradores
transferência de dados em bordas de clock
controle por FSM
```

---

### Slide 4 — Hardware Description Styles (2/2)

O slide mostra um exemplo de síntese a partir de um modelo HDL.

A figura apresenta:

```text
HDL Model
  entradas: a, b, c
  saídas: y1, y2, y3
```

Código visível aproximado:

```verilog
module example (input a, b, c,
                output y1, y2, y3);

assign y1 = ~a & ~b;
assign y2 = ~c | a;
assign y3 = ~b & c;

endmodule
```

A figura mostra que o modelo comportamental é sintetizado em uma netlist com inversores, portas AND e OR.

Interpretação:

Esse slide reforça a ideia central:

```text
uma descrição HDL sintetizável vira circuito lógico.
```

O código usa `assign`, que descreve lógica combinacional contínua. A ferramenta de síntese identifica as operações:

```text
~  → inversor
&  → AND
|  → OR
```

e cria uma rede estrutural equivalente.

A figura mostra o lado esquerdo como modelo comportamental e o lado direito como netlist sintetizada.

---

### Slide 5 — Synthesis Design Constraints

O slide introduz **design constraints**.

Texto principal:

```text
Design constraints are commands to the EDA tools to apply on ASIC design steps
such as Synthesis, Place and Route and Static Timing analysis.
```

Tradução:

```text
Design constraints são comandos passados às ferramentas EDA para serem aplicados
em etapas de projeto ASIC, como síntese, place and route e análise estática de timing.
```

O slide também diz:

```text
They also contain commands to the tools about the restrictions and configurations
which the tool use to produce the intended gate level or layout level design files.
```

E:

```text
Constraints are presented to the tools using Synopsys design constraint (SDC) format
which is standard for feeding in the design timing specifications for the design.
```

Interpretação:

Constraints são o contrato entre o designer e a ferramenta. Elas dizem quais limites e objetivos o design precisa respeitar.

Sem constraints, a ferramenta não sabe, por exemplo:

```text
qual é o clock
qual frequência deve ser atingida
qual carga externa existe
qual fanout máximo é permitido
qual transição máxima é aceitável
quanto atraso externo existe nos inputs
quanto atraso deve ser reservado para outputs
```

#### Dois tipos de design constraints

O slide divide em:

```text
Design rule constraints
Optimization constraints
```

---

#### Design rule constraints

O slide afirma:

```text
Design rules are dictated by fabrication process and given by fabrication vendors.
They are mandatory for the designs for device fabrication.
You can apply more stringent rules but at minimum must meet the given rule set.
They constrain the interconnects or routing nets and are associated with the pins
of the design elements from technology library.
They are common across the cells in library elements but also some cell specific rules.
```

Interpretação:

Design rule constraints vêm da tecnologia e da biblioteca. São limites físicos/elétricos que não podem ser violados.

Exemplos:

```text
maximum transition
maximum fanout
maximum capacitance
```

A ferramenta pode usar esses limites para inserir buffers, trocar células ou reestruturar nets.

---

#### Optimization constraints

O slide afirma:

```text
Are explicit constraints set by the designer.
Define the design PPA (Performance, power and Area) requirements.
They must be realistic and practically achievable.
```

Interpretação:

Optimization constraints são metas definidas pelo designer. Elas expressam o que se deseja otimizar:

```text
performance/timing
power
area
```

Exemplos:

```tcl
create_clock -period 2.0 [get_ports clk]
set_max_area 0
set_input_delay 0.5 -clock clk [all_inputs]
set_output_delay 0.5 -clock clk [all_outputs]
```

Essas metas precisam ser realistas. Se o designer impõe um clock impossível, a ferramenta pode não conseguir fechar timing.

---

### Slide 6 — Synthesis Design Constraints: Design Rule Constraints (1/3)

O slide aprofunda **maximum transition delay**.

Título:

```text
Maximum transition delay
```

Pontos listados:

```text
Depends in Rise time and Fall time of the signal on the driver
as it is the charge and discharging time of load capacitor.

Defines maximum length of the net which can drive a load with full signal strength.
It is defined for only input pins of the design elements.

Buffer is inserted to avoid degradation in the path if the signal transition exceeds this value
throwing violation.

Depends on the timing model of the library.
Maximum transition delay is specified in the liberty file of the technology library.

Varies with the operating frequency as capacitive load varied as Xc = 1 / 2πfC.

In multi clock designs, value corresponding to minimum of the clock frequency used across the design,
thus using most stringent rule.

In multi library designs, minimum value across libraries is used for the design flow.
```

Interpretação:

Maximum transition limita o tempo máximo que um sinal pode levar para mudar de 0 para 1 ou de 1 para 0.

Isso também é chamado de:

```text
slew
transition time
rise/fall transition
```

Se a transição é muito lenta, podem ocorrer problemas:

- aumento de atraso;
- aumento de consumo interno;
- maior chance de ruído;
- violação de limites da biblioteca;
- degradação de sinal.

A ferramenta de síntese pode corrigir uma violação de transition por meio de:

```text
inserção de buffer
troca por célula de drive maior
redução de fanout
reestruturação da net
```

Comando típico:

```tcl
set_max_transition 0.2 [current_design]
```

ou aplicado em portas/nets específicas.

---

### Slide 7 — Synthesis Design Constraints: Design Rule Constraints (2/3)

O slide aprofunda **maximum fanout**.

Título:

```text
Maximum Fanout
```

Pontos listados:

```text
Defines load driving capability of the cell defined as cell of largest number of inputs
which can be safely driven by the cell output without signal degradation.

It depends on the current driving capacity of a cell in terms of number of inputs which can be connected.
It is dimensionless number.

It is defined for output signals and is specified in cell library in liberty file.

It is the current sourced or sunk when driving its load.

When output is logic high, ΣIH all load < ΣIOH of the driver.
When output is logic low, ΣIL all load < ΣIOL of the driver.
Fanout = Min(IOH/IIH, IOL/IIL)
```

A figura mostra uma porta dirigindo várias cargas, com exemplos de load:

```text
load of 1
load of 2
load of 4
max fanout load of 10
```

Interpretação:

Fanout mede quantas entradas uma saída consegue dirigir com segurança.

Um fanout alto significa que uma única saída está carregando muitas entradas. Isso aumenta carga e pode causar:

- transição lenta;
- atraso maior;
- violação de capacitância;
- degradação de sinal.

Comando típico:

```tcl
set_max_fanout 16 [current_design]
```

Se houver violação, a ferramenta pode inserir buffers para dividir a carga.

Exemplo conceitual:

```text
Antes:
  sinal X dirige 40 entradas.

Depois:
  sinal X dirige 4 buffers.
  cada buffer dirige 10 entradas.
```

Assim, o driver original não precisa carregar todos os loads diretamente.

---

### Slide 8 — Synthesis Design Constraints: Design Rule Constraints (3/3)

O slide aprofunda **maximum capacitance**.

Título:

```text
Maximum Capacitance
```

Pontos listados:

```text
Maximum (Minimum) load capacitance an output of the gate can drive.

Load capacitance is pin capacitance and interconnect capacitance.

It is defined for only output pins and is available in .lib file.
```

O slide também diz:

```text
Some cells are characterized for Minimum capacitance as well.

It specifies low capacitance an output pin is characterized to drive.

The capacitance of the cells affects the frequency of operation and power consumption.
```

Interpretação:

A capacitância de carga que uma saída enxerga vem de dois lugares:

```text
capacitância dos pinos das células conectadas
capacitância dos fios/interconexões
```

Se a capacitância for alta demais, o sinal muda lentamente e o atraso aumenta.

Comando típico:

```tcl
set_max_capacitance 0.25 [current_design]
```

Também pode aparecer:

```tcl
set_load 0.25 [get_ports out]
```

A relação com potência é importante. Potência dinâmica depende de capacitância:

```text
P ≈ α · C · V² · f
```

Logo, maior capacitância aumenta consumo dinâmico e dificulta operação em alta frequência.

---

### Slide 9 — Design Targets

O slide define **design target**.

Texto principal:

```text
It is the type of device to be manufactured or programmed.
Synthesis generates output for a particular design target.
```

Tradução:

```text
É o tipo de dispositivo que será fabricado ou programado.
A síntese gera saída para um alvo de projeto específico.
```

#### Diferentes design targets

O slide lista:

```text
PLA
ASIC
Gate array
FPGA
```

---

#### PLA — Programmable Logic Array

Texto do slide:

```text
Programmable Logic Array (PLA): chip that can be programmed once to implement a logic function.
Usually programmed at the factory.
PLAs might be used in prototypes or when only a few parts are needed.
```

Interpretação:

PLA é uma estrutura lógica programável mais simples, usada em contextos específicos. O curso a apresenta como target programável, normalmente configurado na fábrica.

---

#### ASIC — Application-Specific Integrated Circuit

Texto do slide:

```text
Application-Specific Integrated Circuit (ASIC) is a fully custom chip.
Usually the fastest design target, can have the most components.
```

Interpretação:

ASIC é um chip feito para uma aplicação específica. No contexto cell-based, não significa necessariamente full-custom transistor por transistor, mas sim um chip dedicado fabricado para aquela função.

Vantagens típicas:

- alto desempenho;
- menor potência por função;
- alta densidade;
- custo baixo em volume alto.

Desvantagens:

- custo inicial alto;
- tempo de desenvolvimento maior;
- risco maior se houver bug.

---

#### Gate array

Texto do slide:

```text
Gate array is a chip full of gates manufactured in two steps.

First generic layers containing gates are fabricated,
but gates are not connected to each other.

Later, metal layers connecting gates are added.
Designer using gate arrays specifies only metal layer.
Because gates are fabricated in advance, time is saved.
```

Interpretação:

Gate array é um meio-termo. Parte do chip já é pré-fabricada com gates. O design final é definido por camadas metálicas que conectam esses gates.

Isso reduz tempo de fabricação em comparação com ASIC completo, mas oferece menos flexibilidade/otimização.

---

#### FPGA — Field-Programmable Gate Array

Texto do slide:

```text
Field-Programmable Gate Array (FPGA):
A chip full of logic whose connection and function can be programmed and later reprogrammed.

Many FPGA vendors provide EDA tools for their products.

Synopsys has Synplify as its FPGA tool.
```

Interpretação:

FPGA é reprogramável. Em vez de fabricar um chip novo, o designer configura LUTs, flip-flops, blocos de memória, DSPs e interconexões internas.

Vantagens:

- rápido para prototipagem;
- reprogramável;
- baixo custo inicial;
- ideal para testes e baixo volume.

Desvantagens:

- menor desempenho que ASIC em muitos casos;
- maior potência por função;
- menor densidade lógica.

---

### Slide 10 — Synthesis Steps (1/2)

O slide apresenta etapas de síntese.

Texto principal:

```text
Synthesis starts with the choice of design target.
Type of target: FPGA, ASIC, and so on. Manufacturer and family.
```

Interpretação:

Antes de sintetizar, a ferramenta precisa saber para qual tecnologia está gerando hardware. Sintetizar para FPGA é diferente de sintetizar para ASIC.

Para FPGA, a ferramenta mapeia para recursos como:

```text
LUTs
flip-flops
BRAM
DSP blocks
carry chains
```

Para ASIC, a ferramenta mapeia para:

```text
standard cells
macros
memories
buffers
clock cells
```

#### Programa de síntese usa

O slide diz:

```text
A synthesis program or programs use behavioral or structural description of the functionality.
Verified by simulation.
Behavioral description, if used, follows synthesizability rule check for the synthesis tool.
```

Interpretação:

A ferramenta de síntese usa uma descrição funcional ou estrutural, mas essa descrição precisa ser sintetizável.

Nem todo código HDL é sintetizável. Por exemplo, constructs de testbench, delays arbitrários e manipulação de arquivos geralmente são para simulação, não para hardware.

#### Synthesis of technology

O slide lista:

```text
Independent gate-level description.
Synthesis program infers registers and minimizes logic.
Registers aren't explicitly declared, even though it appears otherwise.

Synthesis program must determine, infer, where they are needed.
Because most synthesis programs optimize combinational logic.

Functional descriptions should be written using a style that the synthesis tool
can interpret and generate output as a structural code called design netlist
consisting of gates and standard modules.

Based on output, designer might tweak design or give hints to synthesis program
to further optimize it without affecting functionality for desired performance.
```

Interpretação:

O designer escreve RTL. A ferramenta infere registradores, lógica combinacional e conexões. Depois gera uma netlist estrutural.

Exemplo:

```systemverilog
always_ff @(posedge clk) begin
  q <= d;
end
```

A ferramenta infere um flip-flop.

Exemplo:

```systemverilog
assign y = a & b;
```

A ferramenta infere uma porta AND ou célula equivalente.

O designer pode ajustar RTL ou constraints para melhorar performance, área ou potência sem alterar a função.

---

### Slide 11 — Synthesis Steps (2/2)

O slide apresenta a continuação das etapas, agora com foco em síntese física e timing.

Texto principal:

```text
Physical synthesis consists of the following steps:
Placement is the determination of the physical location of a part.
Routing is the determination of paths for wires interconnecting parts.
```

Interpretação:

Após a síntese lógica, a netlist precisa ser colocada fisicamente no chip e conectada por fios.

#### Placement

Define onde cada célula, macro ou bloco ficará.

#### Routing

Define os caminhos físicos dos fios que conectam as células.

O slide também diz:

```text
Timing information, because technology and wire lengths are known at this stage,
may be back annotated, written into, the original behavioral description.
```

Interpretação:

Depois que placement e routing são conhecidos, é possível estimar ou extrair atrasos mais realistas. Esses atrasos podem ser anotados de volta na simulação.

Isso é chamado de:

```text
back-annotation
```

Geralmente envolve formatos como:

```text
SDF — Standard Delay Format
```

O slide continua:

```text
Behavioral descriptions are restimulated to see whether they meet timing criteria.
For FPGAs, RTL code with timing is used to program the devices.
```

E:

```text
For ASICs and gate arrays, a design database is verified with backannotated timing
to tape out to a fabrication.
```

Interpretação:

O objetivo é garantir que, depois de considerar delays reais de tecnologia e fios, o design ainda funciona dentro dos critérios de timing.

Para ASIC, isso faz parte do caminho para tape-out.

---

## Aula didática desenvolvida

### 1. Por que este bloco é importante depois da introdução à síntese?

A aula anterior explicou o fluxo geral:

```text
RTL → síntese lógica → netlist → síntese física → layout
```

Este bloco responde à pergunta prática:

```text
Que tipo de descrição e que tipo de restrição eu preciso entregar para a ferramenta?
```

A resposta é:

```text
HDL sintetizável
testbench para simulação
constraints em formato adequado
target tecnológico
bibliotecas
estilo de codificação que represente hardware real
```

Síntese não é apertar um botão. A qualidade do resultado depende diretamente da qualidade do RTL e das constraints.

---

### 2. HDL não é linguagem de programação comum

O slide enfatiza:

```text
HDLs are used to write a hardware description or model and not program.
```

Isso é essencial.

Em software, normalmente pensamos em uma sequência de instruções sendo executada por uma CPU.

Em HDL sintetizável, pensamos em hardware existindo em paralelo:

```text
portas
registradores
muxes
fios
memórias
FSMs
```

Exemplo:

```systemverilog
assign y = a & b;
assign z = c | d;
```

Essas duas linhas não “executam uma depois da outra”. Elas descrevem duas lógicas que existem simultaneamente.

---

### 3. Estilo estrutural, comportamental e RTL

#### Estrutural

Mostra conexões explícitas.

```systemverilog
and_gate u1 (.a(a), .b(b), .y(n1));
or_gate  u2 (.a(n1), .b(c), .y(y));
```

Vantagem:

```text
controle explícito da topologia
```

Desvantagem:

```text
verboso e menos flexível
```

#### Comportamental

Descreve o que deve acontecer.

```systemverilog
always_comb begin
  y = (a & b) | c;
end
```

Vantagem:

```text
mais abstrato e legível
```

Risco:

```text
pode usar constructs não sintetizáveis se o designer não tiver cuidado
```

#### RTL

Descreve transferência entre registradores e lógica entre eles.

```systemverilog
always_ff @(posedge clk) begin
  q <= d;
end

always_comb begin
  d = a + b;
end
```

RTL é o estilo mais importante para ASIC/FPGA moderno.

---

### 4. O que significa “pensar no hardware que o código produz”?

Quando você escreve:

```systemverilog
if (sel)
  y = a;
else
  y = b;
```

a ferramenta provavelmente infere um mux.

Quando escreve:

```systemverilog
always_ff @(posedge clk)
  q <= d;
```

a ferramenta infere um flip-flop.

Quando escreve:

```systemverilog
always_comb begin
  if (en)
    y = a;
end
```

sem atribuição para `y` quando `en=0`, a ferramenta pode inferir latch.

Portanto, cada escolha de código tem uma consequência física.

Regra mental:

```text
if/case combinacional → mux/lógica
posedge clock → flip-flop
memória indexada → RAM/register file, dependendo do estilo
ausência de atribuição combinacional → latch
```

---

### 5. O papel do testbench antes da síntese

O slide coloca testbench antes da síntese porque o RTL deve ser simulado antes de virar netlist.

Fluxo:

```text
escrever RTL
escrever testbench
simular
corrigir bugs funcionais
sintetizar
analisar timing/area/power
```

Se o RTL já está funcionalmente errado, a síntese apenas criará hardware errado mais rápido.

O testbench verifica:

```text
entradas aplicadas
saídas esperadas
corner cases
reset
operações normais
operações inválidas
```

---

### 6. O que é netlist?

O slide diz que síntese transforma HDL em:

```text
a list of gates and wires connecting them
```

Isso é a netlist.

Exemplo RTL:

```systemverilog
assign y = ~a & b;
```

Netlist aproximada:

```verilog
INV_X1 U1 (.A(a), .Y(n1));
AND2_X1 U2 (.A(n1), .B(b), .Y(y));
```

A netlist descreve:

```text
células instanciadas
pinos
conexões
hierarquia
```

Ela é mais próxima do hardware físico do que o RTL.

---

### 7. Design constraints são comandos, não comentários

Constraints são comandos reais que alteram o comportamento da ferramenta.

Exemplo:

```tcl
set_max_fanout 8 [current_design]
```

Isso pode fazer a ferramenta inserir buffers.

Exemplo:

```tcl
create_clock -period 2 [get_ports clk]
```

Isso pode fazer a ferramenta escolher células mais rápidas e reestruturar caminhos.

Exemplo:

```tcl
set_max_area 0
```

Isso pode orientar a ferramenta a reduzir área, desde que timing seja respeitado.

Constraints ruins geram resultados ruins.

---

### 8. Design rule constraints versus optimization constraints

#### Design rule constraints

São limites que vêm da tecnologia/biblioteca.

Exemplos:

```text
maximum transition
maximum fanout
maximum capacitance
```

Eles existem porque células reais têm limites elétricos.

Se violados, o circuito pode ter:

- transição lenta;
- atraso excessivo;
- consumo alto;
- funcionamento instável;
- problemas de sinal.

#### Optimization constraints

São metas do designer.

Exemplos:

```text
clock period
input delay
output delay
max area
power goals
```

Eles dizem o que o designer deseja alcançar.

Resumo:

```text
Design rule constraints → limites mínimos obrigatórios.
Optimization constraints → metas de PPA definidas pelo designer.
```

---

### 9. Maximum transition

Transition é o tempo de subida ou descida de um sinal.

Uma transição muito lenta significa que o sinal passa tempo demais na região intermediária entre 0 e 1.

Problemas:

```text
mais consumo interno
mais atraso
maior sensibilidade a ruído
violação de timing model
```

Correções possíveis:

```text
usar célula mais forte
inserir buffer
reduzir carga
reduzir fanout
encurtar interconexão
```

Comando típico:

```tcl
set_max_transition 0.2 [current_design]
```

---

### 10. Maximum fanout

Fanout é a quantidade de cargas lógicas que uma saída dirige.

Se uma porta dirige muitas entradas:

```text
carga aumenta
slew piora
delay aumenta
potência aumenta
```

A ferramenta pode inserir buffers para dividir a carga.

Exemplo:

```text
sinal reset dirige 500 flip-flops
```

Isso provavelmente exige uma árvore de buffers.

Comando típico:

```tcl
set_max_fanout 16 [current_design]
```

---

### 11. Maximum capacitance

Capacitância é a carga elétrica vista pela saída.

Ela inclui:

```text
capacitância dos pinos das células
capacitância dos fios
capacitância de portas de saída
```

Maior capacitância causa:

```text
maior delay
maior power dinâmica
transição mais lenta
```

Comando típico:

```tcl
set_max_capacitance 0.25 [current_design]
```

Relação importante:

```text
P ≈ α · C · V² · f
```

Ou seja, potência dinâmica cresce com capacitância.

---

### 12. Por que design target muda a síntese?

A ferramenta precisa saber se vai gerar hardware para:

```text
FPGA
ASIC
gate array
PLA
```

Porque cada target tem recursos diferentes.

#### FPGA

A ferramenta mapeia para:

```text
LUTs
flip-flops
BRAM
DSP
carry chains
interconnect programável
```

#### ASIC

A ferramenta mapeia para:

```text
standard cells
macros
memórias
clock cells
tie cells
buffers
```

Um RTL pode ser o mesmo, mas o resultado de síntese será muito diferente dependendo do target.

---

### 13. O que é inferência?

Inferência é quando a ferramenta deduz qual hardware deve ser criado a partir do código.

Exemplo:

```systemverilog
always_ff @(posedge clk) begin
  q <= d;
end
```

A ferramenta infere:

```text
flip-flop
```

Exemplo:

```systemverilog
always_comb begin
  case (sel)
    2'b00: y = a;
    2'b01: y = b;
    2'b10: y = c;
    default: y = d;
  endcase
end
```

A ferramenta infere:

```text
multiplexador
```

Exemplo:

```systemverilog
reg [7:0] mem [0:255];
```

Dependendo do estilo de acesso, a ferramenta pode inferir:

```text
register array
RAM distribuída
SRAM macro
BRAM em FPGA
```

---

### 14. Regras de sintetizabilidade

O slide menciona que descrição comportamental precisa seguir regras de sintetizabilidade.

Código para simulação pode conter coisas como:

```systemverilog
#10;
$display("debug");
force signal = 1'b1;
initial begin
  read_file();
end
```

Mas nem tudo isso vira hardware.

Para síntese, o código precisa representar estruturas implementáveis:

```text
combinacional
sequencial
memória
FSM
datapath
muxes
comparadores
somadores
```

Regras práticas:

```text
use always_ff para registradores
use always_comb para lógica combinacional
evite delays # em RTL sintetizável
evite constructs de testbench no design
atribua todos os caminhos em combinacional
tenha reset/enable claros quando necessário
```

---

### 15. Back-annotation

Depois da síntese física, a ferramenta conhece melhor os atrasos reais.

Esses atrasos podem ser anotados de volta na simulação.

Formato comum:

```text
SDF — Standard Delay Format
```

Fluxo:

```text
layout/roteamento
extração de atrasos
geração de SDF
simulação gate-level com atrasos anotados
```

Objetivo:

```text
verificar se o comportamento temporal ainda atende ao esperado
```

Em ASIC, isso faz parte da confiança antes do tape-out.

---

## Conceitos difíceis explicados em profundidade

### 1. “HDL model” não é necessariamente sintetizável

Um modelo HDL pode ser usado só para simulação.

Exemplo não sintetizável típico:

```systemverilog
initial begin
  #100;
  data = 8'hAA;
end
```

Isso é ótimo para testbench, mas não representa hardware de produção.

Um modelo sintetizável precisa ter correspondência com estruturas físicas.

Exemplo sintetizável:

```systemverilog
always_ff @(posedge clk) begin
  data <= next_data;
end
```

---

### 2. Behavioral para síntese versus behavioral para testbench

O slide diz que behavioral pode ser usado:

```text
for synthesis
for testbench
```

Mas há diferença.

#### Behavioral sintetizável

```systemverilog
always_comb begin
  y = (a & b) | c;
end
```

#### Behavioral de testbench

```systemverilog
initial begin
  repeat (10) begin
    a = $random;
    b = $random;
    #10;
  end
end
```

O primeiro descreve lógica. O segundo descreve estímulo de simulação.

---

### 3. RTL e tempo

RTL normalmente organiza tempo por bordas de clock.

Exemplo:

```systemverilog
always_ff @(posedge clk) begin
  acc <= acc + data;
end
```

Isso significa:

```text
a cada borda de clock, acc recebe novo valor.
```

A lógica combinacional calcula entre bordas, e o registrador armazena na borda seguinte.

Essa estrutura é a base de designs síncronos.

---

### 4. Constraints precisam ser realistas

O slide diz que optimization constraints devem ser realistic and practically achievable.

Exemplo absurdo:

```tcl
create_clock -period 0.01 [get_ports clk]
```

Isso pediria um clock de 10 ps, praticamente impossível para a maioria dos designs digitais comuns.

Consequências:

- timing nunca fecha;
- a ferramenta faz otimizações agressivas;
- área e potência explodem;
- relatórios ficam cheios de violações.

Uma constraint boa representa o requisito real do sistema e o contexto físico esperado.

---

### 5. Maximum transition e capacitância estão ligados

Uma saída precisa carregar e descarregar capacitâncias.

Tempo de transição depende de:

```text
força do driver
capacitância da carga
resistência/interconexão
```

Se a carga aumenta, a transição fica mais lenta.

Por isso:

```text
maximum capacitance
maximum fanout
maximum transition
```

são constraints relacionadas. Violação de uma pode causar violação da outra.

---

### 6. Fanout não é só contagem de pinos

O slide mostra uma ideia de fanout baseada em correntes:

```text
Fanout = Min(IOH/IIH, IOL/IIL)
```

Isso significa que o fanout depende da capacidade elétrica do driver e da carga de cada entrada.

Em tecnologias modernas, ferramentas usam modelos mais sofisticados com capacitância e timing, mas a ideia básica continua:

```text
uma saída não pode dirigir carga infinita.
```

---

### 7. Mínima capacitância

O slide menciona que algumas células são caracterizadas também para capacitância mínima.

Isso existe porque algumas saídas precisam de uma carga mínima para operar dentro do modelo caracterizado.

Se a carga for muito baixa, o comportamento pode ficar fora da faixa de caracterização.

Na prática, isso é menos discutido por iniciantes que maximum capacitance, mas pode aparecer em bibliotecas.

---

### 8. Gate array versus FPGA

Ambos parecem “pré-fabricados”, mas são diferentes.

#### Gate array

A base de gates é fabricada antes. O projeto final é definido por metalização.

```text
não é reprogramável pelo usuário final
menos flexível que FPGA
mais próximo de ASIC
```

#### FPGA

O chip é programável e reprogramável por configuração.

```text
interconexão programável
LUTs
BRAMs
DSPs
reconfigurável em campo
```

---

### 9. ASIC versus FPGA na síntese

Para ASIC, a síntese precisa gerar uma netlist de standard cells.

Para FPGA, a síntese precisa mapear para recursos do fabricante.

Exemplo:

```text
soma em FPGA pode usar carry chain dedicada
soma em ASIC usa células lógicas/standard cells otimizadas
```

Por isso, o mesmo RTL pode ter estruturas finais muito diferentes.

---

### 10. “Registers aren't explicitly declared” no slide

O slide diz que a ferramenta infere registradores. Isso pode soar estranho, porque no RTL declaramos sinais como `reg` ou `logic`.

O ponto técnico é:

```text
declarar uma variável como reg/logic não cria necessariamente um flip-flop.
```

O flip-flop é inferido pelo uso em bloco sensível a clock.

Exemplo:

```systemverilog
logic q;
always_ff @(posedge clk)
  q <= d;
```

Aqui `q` vira registrador físico.

Mas:

```systemverilog
logic y;
always_comb
  y = a & b;
```

Aqui `y` é lógica combinacional, não flip-flop.

---

### 11. Structural netlist como saída

A saída da síntese é chamada pelo slide de:

```text
structural code called design netlist
```

Isso quer dizer que a netlist é código HDL, mas não é RTL abstrato.

Ela contém instâncias de células:

```verilog
NAND2_X1 U15 (.A(n3), .B(n7), .Y(n8));
DFF_X1   U16 (.D(n8), .CK(clk), .Q(q));
```

Ela é estrutural porque descreve como o circuito é montado.

---

### 12. Back-annotated timing e tape-out

Para ASIC, antes de tape-out, o banco de dados do design precisa ser verificado com timing realista.

Back-annotation permite simular com atrasos mais próximos do físico.

Mas, em fluxos modernos, STA é normalmente mais importante que simular todos os atrasos em gate-level, porque STA cobre sistematicamente os caminhos temporais.

Mesmo assim, o conceito do slide é:

```text
depois de conhecer tecnologia e fios, revalidar timing antes de fabricação.
```

---

## Figuras, diagramas e waveforms importantes

### Página 1 — HDLs for Synthesis

A parte superior da página 1 lista VHDL, Verilog e SystemVerilog, além do histórico de padronização. Estude essa figura como uma contextualização das linguagens aceitas no fluxo de síntese.

### Página 1 — Design Flow Using HDL and EDA Tools

A parte inferior da página 1 mostra o ciclo de entrada do design, testbench, simulação e síntese. Ela destaca que simulação economiza custo ao encontrar bugs antes do hardware.

### Página 2 — Hardware Description Styles (1/2)

A parte superior da página 2 mostra os estilos estrutural, comportamental e RTL. A figura com HDL model e waveform ajuda a entender que um HDL model pode ser usado para simular comportamento ao longo do tempo.

### Página 2 — Hardware Description Styles (2/2)

A parte inferior da página 2 mostra a conversão de um modelo comportamental em netlist sintetizada. Essa é uma figura central para entender síntese: operadores HDL viram inversores, ANDs, ORs e conexões.

### Página 3 — Synthesis Design Constraints

A parte superior da página 3 mostra a classificação de constraints em design rule constraints e optimization constraints. Essa é a base para entender SDC e os comandos de síntese.

### Página 3 — Design Rule Constraints: Maximum Transition

A parte inferior da página 3 aprofunda maximum transition delay. Estude essa parte como a relação entre slew, carga capacitiva e buffer insertion.

### Página 4 — Design Rule Constraints: Maximum Fanout

A parte superior da página 4 mostra exemplos de fanout e cargas. A figura ilustra que uma saída tem capacidade limitada de dirigir outras entradas.

### Página 4 — Design Rule Constraints: Maximum Capacitance

A parte inferior da página 4 lista maximum capacitance e sua relação com pin capacitance, interconnect capacitance, frequência e potência.

### Página 5 — Design Targets

A parte superior da página 5 compara PLA, ASIC, gate array e FPGA. Essa parte explica por que a síntese precisa saber o target antes de gerar hardware.

### Página 5 — Synthesis Steps (1/2)

A parte inferior da página 5 mostra que a síntese começa escolhendo o target e usa descrições comportamentais/estruturais, inferindo registradores e minimizando lógica.

### Página 6 — Synthesis Steps (2/2)

A página 6 mostra as etapas de síntese física: placement, routing e back-annotation de timing. Ela conecta a síntese lógica com a implementação física e a verificação final antes de tape-out.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é HDL?**  
   Uma linguagem usada para descrever a estrutura do hardware e como ele deve se comportar.

2. **Quais HDLs populares são citadas?**  
   VHDL, Verilog e SystemVerilog.

3. **Qual é a função do testbench no fluxo com HDL?**  
   Verificar a correção do design por simulação.

4. **O que o programa de síntese transforma?**  
   Código HDL em netlist descrevendo gates e fios.

5. **O que os relatórios de síntese indicam?**  
   Área e timing, e podem também orientar análise de potência.

6. **Qual frase importante sobre HDL aparece no slide?**  
   Ao descrever circuitos em HDL, é crítico pensar no hardware que o código deve produzir.

7. **Quais são os estilos de descrição citados?**  
   Structural, behavioral e RTL.

8. **O que é estilo estrutural?**  
   Descreve como partes são conectadas, como em um esquemático.

9. **O que é estilo comportamental?**  
   Descreve o que o hardware deve fazer.

10. **O que é RTL?**  
    Forma em que registradores armazenam dados intermediários processados e transferidos para o próximo processo.

11. **O que são design constraints?**  
    Comandos passados às ferramentas EDA para orientar síntese, place and route e STA.

12. **Qual formato padrão de constraints é citado?**  
    SDC — Synopsys Design Constraints.

13. **Quais são os dois tipos de design constraints?**  
    Design rule constraints e optimization constraints.

14. **O que são design rule constraints?**  
    Restrições ditadas pelo processo de fabricação e bibliotecas, obrigatórias para o design.

15. **O que são optimization constraints?**  
    Constraints definidas pelo designer para metas de PPA: performance, power e area.

16. **O que é maximum transition delay?**  
    Limite máximo para tempo de subida/descida de um sinal.

17. **O que acontece se a transition excede o limite?**  
    A ferramenta pode inserir buffer ou alterar a implementação para evitar degradação.

18. **O que é maximum fanout?**  
    Capacidade máxima de uma saída dirigir múltiplas entradas sem degradação de sinal.

19. **O que é maximum capacitance?**  
    Carga capacitativa máxima que uma saída pode dirigir.

20. **Quais design targets são citados?**  
    PLA, ASIC, gate array e FPGA.

21. **Qual target é reprogramável?**  
    FPGA.

22. **Qual target costuma ser o mais rápido e com mais componentes?**  
    ASIC, segundo o slide.

23. **Qual ferramenta Synopsys é citada para FPGA?**  
    Synplify.

24. **A síntese começa com qual escolha?**  
    Escolha do design target: FPGA, ASIC, fabricante, família etc.

25. **O que é placement?**  
    Determinação da localização física das partes.

26. **O que é routing?**  
    Determinação dos caminhos dos fios que interconectam as partes.

27. **O que é back-annotation?**  
    Anotar informações de timing extraídas de tecnologia/fios de volta à descrição ou simulação para revalidar critérios temporais.

### Pegadinhas

- HDL não é programa comum; descreve hardware.
- `reg` ou `logic` sozinho não garante flip-flop; o contexto de clock é que infere registrador.
- Behavioral pode ser sintetizável ou apenas de testbench; depende dos constructs usados.
- Structural descreve topologia, não apenas comportamento.
- RTL é o estilo mais importante para síntese de designs síncronos.
- Constraints não são opcionais; sem elas a ferramenta não sabe as metas reais.
- Design rule constraints vêm da tecnologia/biblioteca; optimization constraints vêm do designer.
- Maximum fanout é adimensional, mas tem base elétrica.
- Maximum capacitance inclui capacitância de pino e de interconexão.
- Fanout alto pode causar transition e capacitance violations.
- FPGA e gate array não são a mesma coisa.
- Back-annotation não é a mesma coisa que síntese; é uma etapa de revalidação com atrasos conhecidos.
- Síntese para FPGA e ASIC pode partir do mesmo RTL, mas gera implementações muito diferentes.

### Frases para memorizar

```text
HDL descreve hardware, não programa.
Síntese transforma HDL em netlist de gates e wires.
Structural descreve conexões.
Behavioral descreve comportamento.
RTL descreve transferência entre registradores.
Constraints guiam síntese, place and route e STA.
Design rule constraints vêm da tecnologia.
Optimization constraints vêm das metas de PPA do designer.
Maximum transition limita slew.
Maximum fanout limita quantas cargas uma saída dirige.
Maximum capacitance limita a carga capacitiva dirigida por uma saída.
A síntese começa escolhendo o design target.
Placement posiciona partes; routing conecta partes.
Back-annotation reintroduz timing físico na verificação.
```

---

## Relação com projeto/laboratório

Esta aula prepara diretamente o uso de scripts de síntese, arquivos HDL e constraints.

Em um laboratório de síntese, você provavelmente terá algo como:

```text
rtl/
  design.sv

tb/
  design_tb.sv

constraints/
  design.sdc

scripts/
  run_synth.tcl

reports/
  area.rpt
  timing.rpt
  constraints.rpt

outputs/
  design_netlist.v
```

### O que esta aula ajuda a entender

#### 1. Por que o RTL precisa ser sintetizável

Se o RTL usa constructs que só funcionam em simulação, a síntese falha ou gera hardware inesperado.

#### 2. Por que o testbench não entra na síntese

O testbench serve para simular e verificar, mas não representa hardware final do DUT.

#### 3. Por que constraints são necessárias

Sem `create_clock`, `set_input_delay`, `set_output_delay`, `set_max_transition`, `set_max_fanout` e `set_max_capacitance`, a ferramenta não entende completamente o ambiente do design.

#### 4. Por que relatórios importam

Depois da síntese, você precisa verificar:

```text
timing fechou?
area ficou aceitável?
houve violação de constraints?
houve violação de fanout/transition/capacitance?
```

#### 5. Por que o target muda o resultado

O mesmo RTL pode ser sintetizado para FPGA ou ASIC, mas a implementação final muda muito.

### Exemplo de constraints relacionadas ao bloco

```tcl
create_clock -period 10 [get_ports clk]

set_max_transition 0.2 [current_design]
set_max_fanout 16 [current_design]
set_max_capacitance 0.25 [current_design]

set_input_delay 2 -clock clk [all_inputs]
set_output_delay 2 -clock clk [all_outputs]
```

Esses comandos conectam diretamente a teoria dos slides com o fluxo prático de síntese.

---

## Necessidade de áudio

**Médio.**

O conteúdo textual dos slides é suficiente para montar a aula, mas alguns pontos se beneficiariam de explicação falada do professor, especialmente:

- como o curso diferencia behavioral sintetizável de behavioral de testbench;
- possíveis interpretações específicas do curso sobre SystemVerilog “substituir” Verilog em 2009;
- como o professor exemplifica maximum fanout, pois a figura tem detalhes pequenos;
- se o curso enfatiza algum comando específico de SDC para os próximos exercícios.

Mesmo sem áudio, os conceitos centrais ficaram claros pelos prints.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
- [x] O roteiro/checklist foi conferido antes de sugerir o próximo bloco.

---

## Próximo bloco

**Bloco 020 — 03 High-Level Synthesis**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\03 High-Level Synthesis.docx
```

Faixa:

```text
Slides 1-12
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\03 High-Level Synthesis.md
```
