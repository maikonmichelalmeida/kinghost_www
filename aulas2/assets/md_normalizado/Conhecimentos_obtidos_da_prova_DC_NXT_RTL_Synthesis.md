# Conhecimentos obtidos da prova — Design Compiler NXT - RTL Synthesis

## Controle do arquivo

- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Tipo:** consolidação pós-simulado/prova
- **Resultado obtido:** 96%
- **Base:** simulado de 50 questões + acervo processado dos blocos do curso + Lab Guide + Job Aid
- **Objetivo:** registrar os conceitos, pegadinhas, comandos e interpretações que foram úteis para responder ao questionário.
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\Conhecimentos_obtidos_da_prova_DC_NXT_RTL_Synthesis.md
```

> Observação importante: como o resultado foi **96%**, é provável que até duas respostas tenham divergido do gabarito oficial do curso. O questionário não mostrou aqui quais foram essas divergências. Por isso, este arquivo registra o conhecimento consolidado que levou ao alto acerto e destaca pontos sensíveis em que vale ter cautela em provas futuras.

---

# 1. Leitura geral do resultado

O desempenho de **96%** indica domínio forte dos temas centrais do curso:

- fluxo do Design Compiler NXT;
- logical synthesis;
- physical synthesis;
- topographical mode;
- bibliotecas;
- GTECH;
- target library e link library;
- `analyze`, `elaborate`, `compile_ultra`;
- constraints de timing;
- input/output delay;
- clock uncertainty;
- clock latency;
- multiple clocks;
- exceptions;
- SPG;
- floorplan;
- congestion;
- pós-síntese;
- Lab Guide;
- Job Aid.

A prova teve muitas pegadinhas de formulação literal. A mais importante foi:

```text
círculo  → escolha única
quadrado → pode marcar mais de uma alternativa
```

---

# 2. Regras práticas que funcionaram

## 2.1. Círculo versus quadrado

Quando a alternativa aparece com **círculo**, escolher apenas uma.  
Quando aparece com **quadrado**, avaliar cada alternativa como potencialmente correta.

Exemplos de questões de múltipla marcação:

```text
Clock uncertainty models...
GTECH cells are...
Valid startpoints/endpoints...
Architectural optimization includes...
```

## 2.2. Priorizar a linguagem do curso

Em várias questões, a resposta correta é a que reproduz a classificação do curso, não necessariamente a explicação técnica mais ampla.

Exemplo forte:

```text
Physical synthesis:
RTL → optimized and coarse-placed netlist
```

Não reduzir isso para apenas:

```text
RTL → gate-level netlist
```

---

# 3. Logical synthesis versus physical synthesis

## 3.1. Logical synthesis

Síntese lógica converte:

```text
RTL → optimized gate-level netlist
```

Ela envolve:

```text
translation
logic optimization
gate-level mapping
```

A netlist resultante é otimizada e mapeada para células reais, mas não carrega a ideia central de coarse placement físico.

## 3.2. Physical synthesis

Síntese física converte:

```text
RTL → optimized and coarse-placed netlist
```

Outra formulação cobrada:

```text
output da physical synthesis = standard-cell placed netlist
```

A diferença essencial é que physical synthesis usa informação física/topographical para estimar interconexões e posicionamento.

---

# 4. Topographical mode

Durante síntese em modo topo, o DC NXT:

```text
faz coarse placement
estima interconexões com base física
usa virtual routing / RC estimation
```

Pegadinha:

```text
Topo mode NÃO usa Wire Load Models para estimar net lengths.
```

Portanto:

```text
"uses Virtual Routing to estimate net lengths" → verdadeiro
"uses Wire Load Models to estimate net lengths" → falso
```

---

# 5. Bibliotecas e representações

## 5.1. GTECH

GTECH cells são:

```text
technology-independent cells
generic cells/libraries provided by DC NXT
used to represent RTL constructs before technology mapping
```

Não são:

```text
technology-dependent
present in user-defined target libraries
```

Fluxo:

```text
RTL/analyze/elaborate → GTECH/unmapped representation
compile_ultra/gate mapping → technology-specific cells
```

## 5.2. Target library

`target_library` é a biblioteca usada para mapear e otimizar o design em células reais.

Função:

```text
selecionar gates/células que atendam timing, DRC e área
```

Questão típica:

```text
During optimization and mapping, DC NXT uses the cells from the ______.
Resposta: user-defined target library
```

## 5.3. Link library

`link_library` resolve referências:

```text
subdesigns instanciados
leaf cells
IPs
referências externas
```

Configuração típica:

```tcl
set_app_var link_library "* $target_library $ADDL_LINK_LIBRARY_FILES"
```

Pegadinha:

```text
target_library → mapeamento/otimização
link_library   → resolução de referências
```

---

# 6. Comandos do fluxo RTL

## 6.1. `analyze`

O comando `analyze` realiza:

```text
semantic check / leitura e análise de arquivos Verilog, SystemVerilog ou VHDL
```

Ele não faz link do design atual e não carrega diretamente bibliotecas `.db`.

## 6.2. `elaborate`

O comando `elaborate` constrói o design a partir da descrição analisada.

Fluxo:

```tcl
analyze -format verilog {A.v B.v TOP.v}
elaborate TOP
```

Resultado:

```text
design em representação não mapeada / GTECH
```

## 6.3. RTL para schematic com unmapped gates

Resposta cobrada:

```text
analyze and elaborate
```

Não incluir `compile_ultra`, pois `compile_ultra` já faz otimização e mapeamento.

## 6.4. `compile_ultra`

Função central:

```text
logic optimization and gate-level mapping
```

Resposta de prova:

```text
Logic optimization and gate-level mapping
```

---

# 7. Níveis de otimização do `compile_ultra`

O `compile_ultra` trabalha em três níveis:

```text
1. Architectural level
2. Logic level
3. Gate level
```

Sequência correta:

```text
Architectural level → Logic level → Gate level
```

## 7.1. Architectural level optimization

Inclui:

```text
sharing resources
selecting DesignWare implementations
sharing common subexpressions
```

Não inclui:

```text
mapping of gates
```

pois gate mapping pertence ao nível de gate.

## 7.2. Logic level optimization

Trabalha sobre:

```text
GTECH netlist
```

Inclui dois processos principais:

```text
structuring
flattening
```

Resposta:

```text
The Logic Level Optimization consists of 2 processes.
```

## 7.3. Flattening

Durante flattening, caminhos combinacionais são convertidos para representação de dois níveis:

```text
SOP — Sum of Products
```

Resposta:

```text
SOP
```

Ponto sensível: a questão “The flattening process is dependent on design constraints” foi respondida como **false**, tratando flattening como transformação estrutural. Porém, se o curso considerar a decisão de aplicar flattening dependente das metas de timing/área, pode haver nuance.

## 7.4. Gate-level optimization

Produz netlist:

```text
technology-specific
```

Inclui processos como:

```text
mapping
delay optimization
design rule fixing
area optimization
```

Resposta usada:

```text
How many processes are included in gate-level optimization? → 4
```

---

# 8. Delay optimization, area optimization e DRC

## 8.1. Delay optimization

Delay optimization tenta:

```text
corrigir delay violations
cumprir target frequency / período alvo
reduzir atraso em caminhos críticos
```

Técnica mais direta em questão de escolha única:

```text
cell sizing
```

Outras técnicas podem aparecer em contexto geral:

```text
load splitting
load isolation
logic restructuring
```

## 8.2. Area optimization

Técnicas relacionadas:

```text
minimizar número de gates
cell resizing para células menores quando timing permite
```

Não confundir com:

```text
load splitting → normalmente associado a timing/DRC e pode aumentar área
LVT/HVT swap → mais associado a leakage/power/timing
```

## 8.3. Design Rule Constraints

DRCs cobradas:

```text
max_transition / max_tran
max_capacitance / max_cap
max_fanout
```

Questão de dupla:

```text
Design rule constraints are ______ and ______.
Resposta: max_tran, max_cap
```

## 8.4. Prioridade de DRC

Por padrão:

```text
Design rule constraints têm prioridade maior que optimization constraints.
```

Comando para mudar foco:

```tcl
set_cost_priority -delay
```

Ordem de prioridade cobrada:

```text
max_tran → max_fanout → max_cap → max_delay
```

## 8.5. Design Rule Fixing

Corrige violações inserindo ou modificando células.

Resposta:

```text
Buffer, resizing
```

Interpretação:

```text
inserir buffers
redimensionar células existentes
```

---

# 9. Timing paths

## 9.1. Quatro tipos básicos

A ferramenta quebra o design em quatro tipos principais:

```text
1. input port → register
2. register → register
3. register → output port
4. input port → output port
```

Resposta:

```text
By default, the tool breaks the design into 4 timing paths.
```

## 9.2. Startpoints válidos

Marcar:

```text
Input port
Clock pin of register/flip-flop
```

Não marcar:

```text
Clock port
Output port
```

## 9.3. Endpoints válidos

Marcar:

```text
Input pin of a sequential element
Output port
```

Mais precisamente:

```text
data input pin do registrador/elemento sequencial
porta de saída
```

Não marcar:

```text
Clock port
Clock pin of register/flip-flop
```

## 9.4. Input-to-register path

Começa em:

```text
input ports
```

e termina no:

```text
data pin do registrador
```

## 9.5. Combinational timing path

Começa em:

```text
input ports
```

e termina em:

```text
output ports
```

---

# 10. Cell delay

O atraso de uma célula é função de:

```text
input transition
load capacitance
```

Resposta:

```text
Input transition, load capacitance
```

Comandos relacionados:

```tcl
set_input_transition
set_driving_cell
set_load
```

---

# 11. Clock definition, duty cycle, uncertainty e latency

## 11.1. Nome padrão do clock

Quando se cria:

```tcl
create_clock -period 2 [get_ports Clk]
```

o nome do clock definido é, por padrão:

```text
o nome da clock port onde o clock foi definido
```

Se quiser nome diferente:

```tcl
create_clock -period 2 -name My_CLK [get_ports Clk]
```

## 11.2. Duty cycle

É possível alterar o duty cycle usando `-waveform`.

Exemplo:

```tcl
create_clock -period 2.5 -waveform {0 1.5} [get_ports Clk2]
```

Resposta:

```text
true
```

## 11.3. Maximum data arrival time

Para 1 GHz:

```text
period = 1 ns
```

Com setup de 0.15 ns:

```text
maximum data arrival time = 1.00 - 0.15 = 0.85 ns
```

## 11.4. Clock uncertainty

`set_clock_uncertainty` modela:

```text
clock skew
clock jitter
clock margin
```

Não modela:

```text
net delay
```

## 11.5. Modelar skew no prelayout

Resposta:

```text
Using the set_clock_uncertainty command
```

## 11.6. Clock latency

`set_clock_latency` modela atraso de chegada/insertion delay do clock.

Tipos:

```tcl
set_clock_latency -source -max ...
set_clock_latency -max ...
```

Não confundir:

```text
skew/margem → set_clock_uncertainty
latência média/insertion delay → set_clock_latency
clock real pós-CTS → set_propagated_clock
```

---

# 12. Input delay e output delay

## 12.1. Input delay

`set_input_delay` modela o tempo externo já gasto antes do sinal chegar ao input port do nosso design.

Na figura com Jane:

```text
input delay = clock-to-Q do flip-flop externo + delay combinacional externo M
```

Resposta:

```text
Clock to Q delay of the flip-flop + combo delay of circuit M
```

## 12.2. Cálculo do path N

No exemplo:

```text
frequência = 500 MHz
período = 2 ns
input delay externo = 0.7 ns
setup do FF2 = 0.15 ns
```

Cálculo:

```text
Tmax = período - input_delay - setup
Tmax = 2.00 - 0.70 - 0.15
Tmax = 1.15 ns
```

## 12.3. Output delay

Comando:

```tcl
set_output_delay
```

Ele modela o tempo necessário ao circuito externo depois da saída.

---

# 13. Physical synthesis, floorplan e RC

## 13.1. Output da physical synthesis

Resposta:

```text
standard-cell placed netlist
```

ou:

```text
optimized and coarse-placed netlist
```

## 13.2. Floorplan

Questão sensível:

```text
Floorplan is required to perform physical synthesis.
```

Resposta usada:

```text
true
```

Justificativa: physical synthesis/topographical mode trabalha com placement e informação física. Se não houver floorplan explícito, a ferramenta pode usar/defaultar informação, mas o curso tende a associar floorplan ao fluxo físico.

## 13.3. `read_floorplan`

Usado para:

```text
load physical constraints
```

## 13.4. RC em figura com Out1 e Out2

Na figura, `Out1` percorre rota mais longa que `Out2`.

Logo:

```text
RCout1 > RCout2
```

---

# 14. Sequential optimization

Sequential optimization inclui duas fases:

```text
initial sequential optimization
final sequential optimization
```

Respostas:

```text
Sequential optimization includes 2 phases.
```

```text
Sequential optimization includes 2 phases namely initial and final sequential optimization. → true
```

## 14.1. Final sequential optimization

Pode alcançar:

```text
improving design timing
reducing area
reducing delay
```

Ponto sensível: “mapping sequential cells to cells in target library” foi tratado como não pertencente à final sequential optimization, mas ao mapping/inicial.

---

# 15. Post-synthesis output

Arquivos/saídas importantes:

```text
Verilog gate-level netlist
DDC
SDC
SCAN-DEF
ICC2 files
```

Comandos:

```tcl
write_file -f verilog -hier -out mapped/TOP.v
write_file -f ddc -hier -out mapped/TOP.ddc
write_sdc TOP.sdc
write_scan_def -out TOP_scan.def
write_icc2_files -output TOP_icc2
```

Limpeza de netlist:

```tcl
set_app_var verilogout_no_tri true
change_names -rules verilog -hier
define_name_rules verilog -preserve_struct_ports
```

---

# 16. Gabarito operacional usado no simulado

| Questão | Resposta usada | Observação curta |
|---:|---|---|
| 1 | d | Physical synthesis: RTL → optimized/coarse-placed netlist |
| 2 | true | DRC tem prioridade sobre optimization constraints |
| 3 | b | Sequential optimization tem 2 fases |
| 4 | d | Architectural → logic → gate |
| 5 | c | Input port → data pin |
| 6 | true | `target_library` usada em optimization/mapping |
| 7 | true | Topo mode usa coarse placement + virtual routing |
| 8 | false | Essa função é da `link_library`, não `target_library` |
| 9 | a, b, d | Final sequential optimization: timing/area/delay |
| 10 | a | `analyze` faz semantic check/leitura HDL |
| 11 | a, b, d | Architectural opt: resources, DW, common subexpressions |
| 12 | true | `link_library` resolve subdesigns/leaf cells |
| 13 | b, c | Area: minimizar gates e resizing |
| 14 | a, d | Endpoints: data input pin seq element e output port |
| 15 | c | Cell delay = input transition + load capacitance |
| 16 | a, b, c | Uncertainty = skew + jitter + margin |
| 17 | b | Comb path: input ports → output ports |
| 18 | b, c | GTECH = technology-independent/generic |
| 19 | c | `compile_ultra` = logic optimization + gate mapping |
| 20 | d | Prelayout skew: `set_clock_uncertainty` |
| 21 | true | Floorplan requerido/associado a physical synthesis |
| 22 | c | `compile_ultra` tem 3 níveis |
| 23 | b | Output path: `set_output_delay` |
| 24 | b, c | Não aplicável a delay opt: DRC fixing e area constraints |
| 25 | c | Logical synthesis: RTL → optimized gate-level netlist |
| 26 | b | Physical synthesis output: standard-cell placed netlist |
| 27 | d | Input delay = clk-Q + combo M externo |
| 28 | a | DRCs: max_tran, max_cap |
| 29 | c | RTL → unmapped schematic: analyze + elaborate |
| 30 | false | Flattening como transformação estrutural |
| 31 | false | Topo mode não usa WLM para net length |
| 32 | b | RCout1 > RCout2 pela rota mais longa |
| 33 | b | Logic level optimization tem 2 processos |
| 34 | d | Gate-level optimization tem 4 processos |
| 35 | b | max_tran → max_fanout → max_cap → max_delay |
| 36 | c | Flattening → SOP |
| 37 | a | Delay optimization: cell sizing |
| 38 | b | Clock name padrão = clock port name |
| 39 | b | Optimization/mapping usa target library |
| 40 | true | Sequential optimization = initial + final |
| 41 | true | Duty cycle pode ser alterado com `-waveform` |
| 42 | c | 1 GHz, setup 0.15 → 0.85 ns |
| 43 | b | Gate-level opt produz technology-specific netlist |
| 44 | c | Logic-level opt trabalha em GTECH netlist |
| 45 | d | Quatro tipos de timing paths |
| 46 | d | DRC fixing: buffer + resizing |
| 47 | c | `read_floorplan` carrega physical constraints |
| 48 | c | 2 - 0.7 - 0.15 = 1.15 |
| 49 | d | Reg-to-reg setup básico: clock definition |
| 50 | a, c | Startpoints: input port e clock pin de FF |

---

# 17. Pontos sensíveis para revisar

Como o resultado foi 96%, alguns itens podem ter sido aceitos de forma diferente pelo gabarito. Sem o relatório oficial, os principais candidatos a revisão são:

## 17.1. Floorplan obrigatório

```text
Floorplan is required to perform physical synthesis.
```

Resposta usada:

```text
true
```

Nuance:

```text
Um floorplan explícito pode não ser obrigatório se a ferramenta criar/defaultar um floorplan.
Mas informação física/floorplan é parte do conceito de physical synthesis/topo mode.
```

## 17.2. Flattening depender de design constraints

Resposta usada:

```text
false
```

Nuance:

```text
Flattening é uma transformação de lógica/hierarquia.
Mas a ferramenta pode decidir aplicar flattening de acordo com metas de timing/área.
```

## 17.3. Delay optimization com técnica única

Resposta usada:

```text
cell sizing
```

Nuance:

```text
load splitting, load isolation e logic restructuring também podem ser técnicas de delay optimization em sentido amplo.
```

Mas como a questão usou círculo, a resposta mais direta foi `cell sizing`.

---

# 18. Mini-revisão final por tema

## Logical versus Physical Synthesis

```text
Logical synthesis:
RTL → optimized gate-level netlist

Physical synthesis:
RTL → optimized and coarse-placed / standard-cell placed netlist
```

## `compile_ultra`

```text
3 níveis:
Architectural
Logic
Gate

sequência:
Architectural → Logic → Gate
```

## GTECH versus Target Library

```text
GTECH:
technology-independent
generic
antes do mapping

Target library:
technology-specific
células reais
usada em optimization/mapping
```

## Link Library

```text
resolve referências
subdesigns
leaf cells
IP
```

## Timing Paths

```text
Startpoints:
input port
clock pin of register/flip-flop

Endpoints:
data input pin of sequential element
output port
```

## Clock

```text
clock name padrão = nome do clock port
duty cycle pode ser alterado com -waveform
uncertainty = skew + jitter + margin
prelayout skew = set_clock_uncertainty
```

## Input / Output Delay

```text
input delay:
tempo externo já gasto antes do meu bloco

output delay:
tempo reservado para o circuito externo depois do meu bloco
```

## DRC

```text
max_transition
max_fanout
max_capacitance
```

Prioridade típica:

```text
max_tran → max_fanout → max_cap → max_delay
```

## Physical / Topographical

```text
coarse placement
virtual routing
RC estimation
não Wire Load Models
```

---

# 19. Próximo bloco

```text
Bloco 052 - 08 Formality Jumpstart - 01 Overview
```

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\01 Overview.docx
```

Faixa:

```text
slides 1-18
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\01 Overview.md
```

Sugestão de início para o próximo chat:

```text
Vamos continuar do Bloco 052 - 08 Formality Jumpstart - 01 Overview. Vou anexar o DOCX. Faça o Markdown didático seguindo a mesma pegada do curso anterior e mantenha atenção às pegadinhas de prova.
```
