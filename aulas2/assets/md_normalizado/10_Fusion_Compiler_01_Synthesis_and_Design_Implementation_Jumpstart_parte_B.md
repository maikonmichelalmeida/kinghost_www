# 01 Fusion Compiler Synthesis and Design Implementation Jumpstart — parte B

## Controle do bloco

- **Bloco:** 077
- **Curso:** 10 Fusion Compiler Synthesis and Design Implementation Jumpstart
- **Aula:** 01 Fusion Compiler Synthesis and Design Implementation Jumpstart — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart.docx`
- **Faixa processada conforme roteiro:** slides 21-39
- **Continuação:** mesmo anexo usado na parte A
- **Começa em:** `Fusion Compiler Unified RTL-to-GDSII Flow`
- **Termina em:** `Parallel Blocks and Top Implementation`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart_parte_B.md
```

---

## Resumo executivo

Esta parte B completa a aula **Fusion Compiler Synthesis and Design Implementation Jumpstart**. A parte A mostrou a preparação do ambiente: Fusion Compiler como solução integrada **RTL-to-GDSII** (do RTL ao GDSII), design library, CLIBs/NDM, leitura de RTL, UPF e floorplan. A parte B continua com o fluxo completo de implementação: `compile_fusion`, `clock_opt`, `route_auto`, `route_opt`, `eco_opt`, MCMM, CCD, potência, floorplanning detalhado, CTS, roteamento, signoff/DFM e implementação top-level.

A ideia central é que o Fusion Compiler trabalha como um fluxo físico-lógico unificado. Ele não faz apenas síntese lógica: ele integra placement, otimização física, clock tree synthesis, roteamento, ECOs e tarefas de signoff. Por isso, desde o início, o fluxo precisa considerar modos, corners, cenários MCMM, power optimization, floorplan físico e abstrações de blocos.

A parte B cobre:

1. Fluxo unificado RTL-to-GDSII do Fusion Compiler.
2. `compile_fusion`, `clock_opt`, `route_auto`, `route_opt` e `eco_opt`.
3. Múltiplos modos e corners.
4. MCMM — Multi-Corner Multi-Mode (múltiplos corners e múltiplos modos).
5. Criação de modes, corners e scenarios.
6. CCD — Concurrent Clock and Data Optimization (otimização concorrente de clock e dados).
7. Potência estática/leakage e potência dinâmica.
8. Otimização de leakage e dynamic power.
9. Floorplanning overview.
10. Reuso do floorplan gerado por auto-floorplan para uma nova síntese.
11. Objetivos e fluxos de Clock Tree Synthesis.
12. Setup de CTS.
13. Fluxo de roteamento.
14. Routing and DRC fixing.
15. `route_opt`.
16. Signoff e DFM.
17. ECOs funcionais e timing ECOs.
18. Top-level implementation.
19. Uso de design views, block abstracts e ETMs.
20. Implementação de blocos completamente implementados.
21. Implementação paralela de blocos e top.

A mensagem principal é: **Fusion Compiler permite um fluxo integrado no qual síntese, placement, CTS, route, otimização, ECO e signoff se retroalimentam com dados físicos e temporais reais.** O objetivo é melhorar PPA — **power, performance, area** (potência, desempenho e área) — com maior previsibilidade.

---

## Texto extraído e organizado por slide

### Slide 21 — Fusion Compiler Unified RTL-to-GDSII Flow

Texto extraído:

```text
Fusion Compiler Unified RTL-to-GDSII Flow
```

Etapas principais:

```text
compile_fusion
clock_opt
route_auto
route_opt
eco_opt
```

Descrição do fluxo:

```text
RTL synthesis and placement
```

Subitens:

```text
Mapping and area-based optimization followed by logic-based delay optimization
Placement and buffer-tree creation
Physical optimization for timing, power, area
```

Depois:

```text
Clock tree synthesis and post-CTS optimization
```

Depois:

```text
Routing and post-route optimization
```

Final:

```text
ECO Fusion: Built-in sign-off timing closure with PrimeTime and StarRC
```

Interpretação:

Este slide apresenta a espinha dorsal do fluxo Fusion Compiler.

#### 1. `compile_fusion`

É a etapa de síntese física inicial. Ela faz:

- mapeamento lógico;
- otimização de área;
- otimização de delay lógico;
- placement inicial;
- criação de buffer trees;
- otimização física para timing, power e area.

Ou seja, não é apenas “compilar RTL para gates”. É síntese + placement + otimização física.

#### 2. `clock_opt`

Faz Clock Tree Synthesis (síntese da árvore de clock) e otimização pós-CTS.

#### 3. `route_auto` e `route_opt`

Fazem roteamento e otimização pós-roteamento.

#### 4. `eco_opt`

Faz fechamento de timing com qualidade de signoff, usando PrimeTime e StarRC no conceito de ECO Fusion.

A visão geral é:

```text
RTL → compile_fusion → clock_opt → route_auto/route_opt → eco_opt → signoff/GDSII
```

---

### Slide 22 — Multiple Modes and Corners

Texto extraído:

```text
Today’s chips must operate in multiple modes
```

Modos mostrados na figura:

```text
Normal Functional Mode
High Performance Mode
Standby Mode
Low Power Mode
Test Mode
```

Texto:

```text
...and across multiple PVT corners
```

Corners/condições mostradas:

```text
Hi-T Slow
Lo-T Slow
Max Dynamic Pwr
Max Leakage Pwr
Hi-T Fast
Lo-T Fast
```

Interpretação:

Um chip moderno não é otimizado para apenas uma condição. Ele precisa funcionar em múltiplos modos e múltiplos corners.

#### Modos

Exemplos:

- **Normal Functional Mode** (modo funcional normal);
- **High Performance Mode** (modo de alto desempenho);
- **Standby Mode** (modo de espera);
- **Low Power Mode** (modo de baixo consumo);
- **Test Mode** (modo de teste).

Cada modo pode ter clocks, constraints, power states e objetivos diferentes.

#### Corners PVT

PVT significa:

```text
Process, Voltage, Temperature
```

Corners representam variações de fabricação, tensão e temperatura. Exemplos:

- high-temperature slow;
- low-temperature slow;
- high-temperature fast;
- low-temperature fast;
- máxima potência dinâmica;
- máxima leakage power.

O Fusion Compiler precisa otimizar considerando tudo isso simultaneamente. Esse é o fundamento do MCMM.

---

### Slide 23 — Concurrent MCMM Optimization

Texto extraído:

```text
Concurrent MCMM Optimization
```

```text
Fusion Compiler performs concurrent optimization under multiple corner and mode combinations, called scenarios
```

Figura conceitual:

```text
FUNC_SLOW Scenario = FUNC Mode @ SLOW Corner
```

Texto:

```text
Improves each violation in a scenario, while trying not to cause/increase a violation in another scenario
```

Anotações da figura:

```text
Adding buffer to fix DRC here ...
... will not cause setup violation here
```

Interpretação:

MCMM significa:

```text
Multi-Corner Multi-Mode
```

Um **scenario** (cenário) é uma combinação de:

```text
mode + corner
```

Exemplo:

```text
FUNC_SLOW = modo funcional + corner slow
```

A otimização concorrente MCMM busca corrigir violações em um cenário sem piorar outro.

Exemplo do slide:

- adicionar buffer pode corrigir uma violação de DRC em um cenário;
- mas a ferramenta precisa garantir que isso não crie ou aumente uma violação de setup timing (temporização de setup) em outro cenário.

Esse é o valor do fluxo concorrente: ele evita a otimização “míope” em apenas um cenário.

---

### Slide 24 — Creating Modes, Corners and Scenarios

Texto extraído:

```text
Creating Modes, Corners and Scenarios
```

Pontos:

```text
Define modes and corners first
Define scenarios, comprised of applicable mode+corner combinations
Fusion Compiler and IC Compiler II have modes and corners, which are shareable among scenarios
```

Código extraído:

```tcl
create_mode func
create_mode test

create_corner ss125c ; # Common corner to both modes

create_scenario -mode func -corner ss125c
create_scenario -mode test -corner ss125c
```

Figura:

```text
func
test
ss125c
func::ss125c
test::ss125c
```

Interpretação:

O fluxo de MCMM tem uma ordem lógica:

1. Criar os modos:

```tcl
create_mode func
create_mode test
```

2. Criar os corners:

```tcl
create_corner ss125c
```

3. Criar cenários combinando modo + corner:

```tcl
create_scenario -mode func -corner ss125c
create_scenario -mode test -corner ss125c
```

O mesmo corner pode ser compartilhado por múltiplos modos. No exemplo, `ss125c` é comum ao modo funcional e ao modo de teste.

Essa estrutura evita duplicação e organiza claramente os ambientes de análise.

---

### Slide 25 — Concurrent Clock and Data Optimization

Texto extraído:

```text
Concurrent Clock and Data Optimization
```

Pontos:

```text
Prime Changing clock latencies can balance the slack in successive timing path stages to optimize clock and data paths
```

```text
CCD optimization introduces "useful skew" to improve data path setup timing
```

Subitem:

```text
Applies clock network latencies to clock pins, individually adjusted to improve timing
```

```text
CCD optimization (ON by default) performs "useful skew computations" to apply clock latencies and balance points
```

```text
Multiple runs of useful skew computation are integrated with data-path optimization for better QoR convergence
```

Interpretação:

CCD significa:

```text
Concurrent Clock and Data Optimization
```

A ideia é otimizar clock e data path juntos, em vez de tratar clock tree e data path como problemas totalmente separados.

O conceito-chave é **useful skew** (skew útil). Em vez de tentar sempre deixar todos os clocks perfeitamente alinhados, a ferramenta pode ajustar latências de clock em pins específicos para melhorar setup timing.

Exemplo conceitual:

```text
Se atrasar um pouco o clock de captura melhora setup sem quebrar hold,
isso pode ser útil.
```

A otimização CCD calcula essas latências e balanceia pontos do design. Segundo o slide, ela fica **ON by default** (ligada por padrão).

A vantagem é melhor convergência de QoR, porque o caminho de dados e o caminho de clock são otimizados juntos.

---

### Slide 26 — Power

Texto extraído:

```text
The power dissipated in a CMOS circuit falls into two categories:
```

Categorias:

```text
Static or Leakage Power
Dynamic Power
```

Leakage:

```text
Power dissipated due to leakage currents when the circuit is idle
Leakage increases exponentially with low-threshold voltages
```

Dynamic:

```text
Power dissipated when a circuit is active, i.e., stimulus applied to the circuit
```

Subcategorias:

```text
Internal power (→ Cell)
Models the power dissipated by the circuit to charge and discharge the internal capacitances while switching
Includes the power dissipated by momentary short circuit path between supply rails, also called crowbar or transient power
```

```text
Switching power (→ Net)
Power dissipated by charging/discharging load capacitances
```

Interpretação:

O slide separa potência em CMOS em duas grandes categorias.

#### 1. Static/Leakage Power

É consumida mesmo quando o circuito está parado. Vem de correntes de fuga. A leakage cresce muito com células de baixo limiar de tensão, chamadas low-Vt cells.

#### 2. Dynamic Power

É consumida quando há chaveamento.

Ela se divide em:

- **Internal power:** potência dentro da célula, para carregar/descarregar capacitâncias internas e por corrente de curto momentâneo entre VDD e GND.
- **Switching power:** potência nas nets, para carregar e descarregar capacitâncias de carga.

Essa distinção é importante porque as técnicas de otimização mudam conforme o tipo de potência.

---

### Slide 27 — Leakage and Dynamic Power Optimization

Texto extraído:

```text
Leakage Power Optimization
```

Pontos:

```text
Tradeoff between
Faster, higher leakage low-Vt, and
Slower, lower leakage high-Vt cells
```

```text
Leakage power becomes a component of the overall optimization cost
```

```text
Multi-Vt/Vt libraries should be made available
```

Dynamic:

```text
Dynamic Power Optimization
```

Técnicas:

```text
Sizing, pin swapping, (de-)composition, area recovery
Data path minPower optimizations
Multibit banking
Low power placement
Clock gating, self gating
```

Figura:

Gráfico de comparação entre:

```text
Low-Vt
Std-Vt
High-Vt
```

Com curvas:

```text
Leakage
Delay
```

Interpretação:

#### Otimização de leakage

Existe um tradeoff:

- **Low-Vt:** mais rápido, mas mais leakage.
- **High-Vt:** mais lento, mas menos leakage.
- **Std-Vt:** meio-termo.

A ferramenta escolhe células considerando timing e leakage. Para isso, o projeto deve disponibilizar bibliotecas multi-Vt.

#### Otimização de dynamic power

Técnicas citadas:

- sizing de células;
- pin swapping;
- decomposição/recomposição lógica;
- area recovery;
- otimizações `minPower` em datapath;
- multibit banking;
- low power placement;
- clock gating;
- self gating.

A mensagem é que potência entra no custo global de otimização, junto com timing e área.

---

### Slide 28 — Floorplanning Overview

Texto extraído:

```text
Floorplanning Overview
```

Fluxo à esquerda:

```text
compile_fusion -to logic_opto using auto-floorplan
Define block size/shape
Place VAs and hard macros
Place I/O pins
Apply placement blockages
Build power network
Write out floorplan
```

Texto à direita:

```text
This module provides an overview of some of the key steps in floorplanning:
```

Defining:

```text
Block shape/size
Voltage area shapes/locations
Macro cell locations
I/O pin locations
Standard cell placement blockages (to address congestion)
```

Outros tópicos:

```text
Overview of PNS
Exporting the floorplan
```

Interpretação:

O slide mostra o objetivo do floorplanning inicial.

Durante uma etapa usando auto-floorplan, o Fusion Compiler pode ajudar a definir:

- tamanho e formato do bloco;
- posições de voltage areas;
- localização de hard macros;
- pinos de I/O;
- placement blockages;
- power network;
- exportação do floorplan.

**PNS** provavelmente se refere a power network synthesis (síntese da rede de alimentação), associada à construção da power network.

O floorplan é fundamental porque influencia:

- congestionamento;
- timing;
- power network;
- roteabilidade;
- posicionamento de macros;
- qualidade do placement.

---

### Slide 29 — Synthesis with New Floorplan

Texto extraído:

```text
Synthesis with New Floorplan
```

Frase:

```text
Restarting the flow in Fusion Compiler with the actual floorplan will produce better overall quality of results
```

Figura:

Primeira etapa:

```text
compile_fusion -to logic_opto using auto-floorplan
```

Gera:

```text
Detailed Floorplan Definition
```

Depois:

```text
compile_fusion using new detailed floorplan
```

E segue para:

```text
clock_opt
route_auto
route_opt
...
```

Interpretação:

Este slide mostra uma estratégia iterativa.

Primeiro, a ferramenta pode usar auto-floorplan para gerar uma definição inicial detalhada:

- block shape/size;
- VAs e hard macros;
- I/O pins;
- blockages;
- power network;
- floorplan exportado.

Depois, o fluxo é reiniciado usando esse floorplan real/detalhado:

```text
compile_fusion using new detailed floorplan
```

Isso melhora QoR porque a síntese física passa a otimizar com informações mais realistas de placement e interconexão.

Mensagem prática:

```text
Auto-floorplan pode ser usado para gerar uma primeira versão, mas recomeçar com o floorplan detalhado melhora o resultado.
```

---

### Slide 30 — Clock Tree Synthesis Goal and Flows

Texto extraído:

```text
Clock Tree Synthesis Goal and Flows
```

Pré-condições:

```text
Placement should be completed
Acceptable congestion, setup timing, and logical DRCs
High fanout signal nets (reset, scan enable, etc) are buffered
```

Objetivo de CTS:

```text
Build the clock tree buffer structure
Detail-route the clock nets
Global-route and optimize data-path logic for setup and hold timing, power and DRCs
```

Dois fluxos CTS:

```text
Classic CTS flow: CTS first, followed by data path optimization
Concurrent Clock & Data flow (CCD): CTS and data path optimization performed concurrently
```

Interpretação:

CTS significa:

```text
Clock Tree Synthesis
```

Antes de CTS, o placement deve estar aceitável:

- congestionamento aceitável;
- setup timing razoável;
- logical DRCs resolvidos;
- nets de alto fanout bufferizadas.

Objetivos:

- construir estrutura de buffers de clock;
- rotear clock nets;
- otimizar data path para setup/hold, power e DRCs.

Dois fluxos:

#### Classic CTS

Primeiro faz CTS, depois otimiza data path.

#### CCD

Faz CTS e data path optimization concorrentemente, usando useful skew e balanceamento de clock/data paths.

---

### Slide 31 — Setting Up CTS

Texto extraído:

```text
Setting Up CTS
```

Itens principais:

```text
Clock Tree Balancing
```

Subitens:

```text
Sink and Ignore Pins
Clock Tree Skew and Latency Targets
Controlling CTS Cell Selection
Inter-Clock-Tree Balancing
```

```text
Pre-existing Clock Elements
```

Subitem:

```text
Removing and Preserving Pre-Existing Cells on the Clock Tree
```

```text
Non-Default Routing Rules
```

Subitens:

```text
Controlling Wire Width and Spacing
Controlling Via Selection
Applying Rules on Selected Clock Tree Parts
```

```text
Timing and DRC Constraints
```

Subitens:

```text
Input Drive and Loads
Max Transition and Capacitance Constraints
Clock Uncertainties
```

Interpretação:

Este slide lista os principais temas de setup para CTS.

#### Clock Tree Balancing

Define como a árvore de clock será balanceada:

- quais pins são sinks;
- quais pins ignorar;
- metas de skew e latency;
- seleção de células de CTS;
- balanceamento entre árvores de clock diferentes.

#### Pre-existing Clock Elements

Algumas células de clock podem já existir. A ferramenta precisa saber se deve preservá-las ou removê-las.

#### Non-Default Routing Rules

Clocks geralmente usam regras especiais de roteamento:

- fios mais largos;
- maior espaçamento;
- vias específicas;
- regras aplicadas apenas em partes da clock tree.

#### Timing and DRC Constraints

CTS precisa respeitar:

- input drive;
- loads;
- max transition;
- capacitance;
- clock uncertainties.

---

### Slide 32 — IC Compiler II Routing Flow

Texto extraído:

```text
IC Compiler II Routing Flow
```

Fluxo:

```text
CTS + Clock routing
↓
Pre-routing checks and setup
↓
Routing
↓
Optimization and Reroute
↓
Signoff
```

Texto:

```text
The "routing phase" involves several key steps:
```

Itens:

```text
Pre-routing checks and setup
Signal routing
Optimization and rerouting (routing update)
```

Interpretação:

O slide apresenta o fluxo de roteamento herdado/conceitualmente alinhado ao IC Compiler II.

A fase de roteamento não é apenas “ligar fios”. Ela inclui:

1. checks e setup antes de route;
2. roteamento dos sinais;
3. otimização e reroute.

Essa última etapa é importante porque o primeiro roteamento pode criar violações de DRC, congestionamento ou timing que precisam de ajustes incrementais.

---

### Slide 33 — Routing and DRC Fixing

Texto extraído do fluxo expandido:

```text
Route signal nets
Check DRCs
Incremental Routing
```

Interpretação:

A fase de roteamento inclui um loop:

```text
rotear → checar DRC → roteamento incremental
```

Isso é necessário porque:

- roteamento inicial pode criar violações;
- corrigir uma violação pode criar outra;
- vias/fios precisam obedecer regras de fabricação;
- o design precisa convergir para DRC clean.

O roteamento incremental evita refazer tudo do zero e corrige localmente regiões problemáticas.

---

### Slide 34 — Fusion Compiler route_opt Flow

Texto extraído:

```text
Fusion Compiler route_opt Flow
```

Fluxo:

```text
Routed design
↓
Pre-postroute opt. checks and setup
↓
Optimization
↓
ECO route
↓
Signoff
```

Texto:

```text
The route_opt phase involves several key steps:
```

Itens:

```text
Pre-postroute optimization checks and setup
Optimization
ECO route
```

Interpretação:

Depois que o design já está roteado, `route_opt` faz otimização pós-roteamento.

Etapas:

1. Checks e setup de otimização pós-route.
2. Otimização.
3. ECO route.

Essa fase usa dados físicos mais realistas do roteamento e pode corrigir timing, DRCs e outros problemas sem destruir o design inteiro.

---

### Slide 35 — Signoff / DFM

Texto extraído:

```text
Signoff / DFM
```

Texto:

```text
After route_opt has completed, there are several tasks that are required, and some that might be required
```

Required:

```text
Sign-off Extraction and STA, with possible ECO
Use ECO Fusion for faster timing signoff
Sign-off DRC
Filler cell insertion (fill gaps between standard cells)
Metal Filling (fill metal layers for CMP)
```

Possibly required:

```text
Functional ECO (pre- or post-freeze-silicon)
```

Interpretação:

Depois de `route_opt`, ainda há tarefas finais de signoff e DFM.

#### Required

- **Sign-off extraction and STA:** extração de parasitas e análise temporal final.
- **ECO:** correções se timing ainda falhar.
- **Sign-off DRC:** checagem final de regras de fabricação.
- **Filler insertion:** preencher gaps entre standard cells.
- **Metal fill:** preencher camadas metálicas para atender densidade/CMP.

#### Possibly required

- **Functional ECO:** alteração funcional, antes ou depois de freeze do silício.

DFM significa:

```text
Design for Manufacturability
```

Ou seja, preparar o layout para ser fabricável com qualidade e rendimento.

---

### Slide 36 — Signoff / DFM Tasks

Figura:

Fluxo:

```text
route_opt
↓
Timing ECOs (PT/StarRC)
↓
Filler cell insertion
↓
Signoff DRC checking / fixing (ICV)
↓
Metal filling (ICV)
```

Lateral:

```text
Functional ECOs
Can occur anytime
```

Notas:

```text
Manually, or using ECO Fusion
```

```text
Since flow uses signoff quality runset from foundry, fills are DRC clean by construction
```

Interpretação:

Este slide organiza as tarefas pós-route.

#### Timing ECOs

São feitos com PrimeTime/StarRC, manualmente ou usando ECO Fusion.

#### Filler cell insertion

Preenche espaços vazios entre standard cells para continuidade física e regras de layout.

#### Signoff DRC checking/fixing

Feito com ICV — IC Validator — usando runsets de qualidade de signoff.

#### Metal filling

Adiciona metal dummy para atender requisitos de densidade, especialmente para CMP. O slide diz que, como o fluxo usa runset de qualidade signoff da foundry, os fills são DRC clean by construction (limpos por construção).

#### Functional ECOs

Podem ocorrer a qualquer momento, porque mudanças funcionais podem ser exigidas por bugs ou ajustes de specification.

---

### Slide 37 — Top Level Implementation

Texto extraído:

```text
Top Level Implementation
```

Texto:

```text
When implementing the top level, blocks can be design views, or they can be abstracted by using a block abstract or an ETM
```

Subitens:

```text
Design views are OK up to 100k gates
Block abstracts are generated in FC and are the preferred choice
ETMs can provide memory and runtime benefits for very large designs
Also useful for IP that needs to be hidden
```

Texto:

```text
The blocks can be at any design phase
```

Subitens:

```text
Synthesized, placed
Clock trees synthesized
Completely routed and optimized
```

Interpretação:

Na implementação top-level, blocos internos podem ser representados de três formas:

#### 1. Design views

Contêm o design completo do bloco. São aceitáveis até cerca de 100k gates.

#### 2. Block abstracts

Gerados no Fusion Compiler. São a escolha preferida para muitos casos porque preservam informação física/timing relevante sem carregar todos os detalhes.

#### 3. ETMs

ETM significa extracted timing model. Eles reduzem memória e runtime em designs muito grandes e também são úteis quando IP precisa ser escondido.

Os blocos podem estar em diferentes fases:

- apenas sintetizados/placed;
- com clock tree sintetizada;
- completamente roteados e otimizados.

Isso permite integração top-level incremental.

---

### Slide 38 — Using Completely Implemented Blocks

Texto extraído:

```text
Using Completely Implemented Blocks
```

Fluxo de bloco:

```text
Block-Level Flow
Synthesis+Placement
Clock Tree Synthesis
Post-CTS Optimization
Route
Postroute Optimization
```

Texto:

```text
All blocks are completely implemented first
Top-level is implemented afterwards
```

Fluxo top-level:

```text
Top-Level Flow
Synthesis+Placement
Clock Tree Synthesis
Post-CTS Optimization
Route
Postroute Optimization
```

Conexão:

```text
Abstract / ETM + Frame
```

Interpretação:

Neste fluxo, cada bloco é completamente implementado antes do top-level.

Depois, o top-level usa uma representação abstrata dos blocos:

```text
Abstract / ETM + Frame
```

Vantagem:

- o top-level vê timing/physical boundary dos blocos;
- reduz complexidade;
- protege detalhes internos;
- permite integração de blocos já fechados.

Essa estratégia é comum quando blocos são grandes, feitos por times diferentes ou já estão praticamente signoff-ready.

---

### Slide 39 — Parallel Blocks and Top Implementation

Texto extraído:

```text
Parallel Blocks and Top Implementation
```

Texto:

```text
For each implementation step at the top-level, use a block for which the same or subsequent implementation step is completed
```

Exemplo:

```text
compile_fusion on blocks complete → perform compile_fusion at top
```

Fluxo de bloco:

```text
Synthesis+Placement
Clock Tree Synthesis
Post-CTS Optimization
Route
Postroute Optimization
```

Fluxo top-level:

```text
Synthesis+Placement
Clock Tree Synthesis
Post-CTS Optimization
Route
Postroute Optimization
```

Conexão:

```text
Abstract / ETM + Frame
```

Interpretação:

Este fluxo permite que blocos e top-level avancem em paralelo, desde que o top use uma versão de bloco que esteja na mesma etapa ou em etapa mais avançada.

Exemplo:

```text
Se os blocos já completaram compile_fusion,
o top pode rodar compile_fusion usando abstracts/ETMs correspondentes.
```

Depois, quando blocos avançam para CTS, route etc., o top pode avançar também usando modelos atualizados.

Essa abordagem melhora produtividade porque não exige esperar todos os blocos terminarem completamente antes de começar o top. Mas exige disciplina de versionamento e consistência dos abstracts/ETMs.

---

## Aula didática desenvolvida

### 1. O fluxo do Fusion Compiler é físico desde o começo

A parte A já mostrou que `compile` exige floorplan. A parte B confirma isso: o primeiro comando grande do fluxo é `compile_fusion`, que já inclui synthesis + placement + physical optimization.

Isso muda a mentalidade:

```text
Design Compiler tradicional:
  síntese lógica primeiro, físico depois

Fusion Compiler:
  síntese e físico caminham juntos desde cedo
```

Essa integração é a razão dos ganhos prometidos de PPA e time-to-results.

---

### 2. MCMM é a realidade de chips modernos

Um chip precisa funcionar em vários modos e corners.

Um cenário é:

```text
mode @ corner
```

Exemplo:

```text
func @ ss125c
test @ ss125c
```

O Fusion Compiler otimiza cenários simultaneamente. Isso é importante porque corrigir uma violação em um cenário pode causar violação em outro.

Sem MCMM concorrente, o fluxo pode virar um ciclo ruim:

```text
corrige slow → quebra fast
corrige fast → quebra low power
corrige low power → quebra test
```

A otimização concorrente tenta evitar isso.

---

### 3. CCD usa skew útil como ferramenta de otimização

Em um pensamento iniciante, clock skew é sempre ruim. Mas em projetos avançados, parte do skew pode ser usada de forma controlada para melhorar setup.

Isso é chamado de:

```text
useful skew
```

O CCD ajusta latências de clock para balancear caminhos de clock e dados.

A ideia é:

```text
não otimizar só data path;
não otimizar só clock;
otimizar ambos juntos.
```

Isso pode melhorar convergência de timing.

---

### 4. Potência precisa ser separada por tipo

O slide separa potência em:

```text
leakage
dynamic
```

Leakage é crítica em idle e depende muito de Vt. Dynamic depende de chaveamento.

Técnicas diferentes atacam problemas diferentes:

- trocar low-Vt por high-Vt reduz leakage;
- clock gating reduz dynamic power;
- multibit banking reduz clock/data switching;
- low power placement reduz capacitância e interconexão;
- datapath minPower reduz atividade/potência no datapath.

---

### 5. Floorplan não é uma etapa “bonita”; é uma etapa de QoR

O floorplan define o espaço de solução da ferramenta. Macro mal posicionada, pinos ruins, voltage areas ruins ou blockages inadequados podem tornar o design difícil de fechar.

A estratégia mostrada no slide é prática:

```text
1. Rodar compile_fusion -to logic_opto com auto-floorplan.
2. Escrever floorplan.
3. Reiniciar o fluxo usando floorplan detalhado.
4. Continuar com compile_fusion, clock_opt, route_auto, route_opt.
```

Isso aumenta previsibilidade.

---

### 6. CTS é mais que inserir buffers de clock

CTS precisa:

- construir a clock tree;
- rotear clocks;
- controlar skew/latency;
- respeitar DRCs;
- otimizar setup e hold;
- lidar com high fanout nets;
- usar regras especiais de roteamento.

O fluxo clássico separa CTS e data path optimization. O CCD otimiza clock e dados simultaneamente.

---

### 7. Roteamento é iterativo

O roteamento não termina quando os fios são conectados. É necessário:

```text
route signal nets
check DRCs
incremental routing
optimization and reroute
```

Isso é normal porque o layout físico precisa satisfazer timing, regras de fabricação e congestionamento.

---

### 8. Signoff/DFM fecha o chip para fabricação

Depois de route_opt, ainda há tarefas finais:

- extração signoff;
- STA signoff;
- timing ECO;
- DRC signoff;
- filler insertion;
- metal fill;
- functional ECO se necessário.

O Fusion Compiler se conecta com PrimeTime, StarRC e IC Validator, o que reforça o conceito de fluxo integrado.

---

### 9. Top-level implementation depende de abstrações corretas

Em designs grandes, não se carrega sempre todos os detalhes de todos os blocos no top.

Alternativas:

- design view;
- block abstract;
- ETM.

Cada uma tem tradeoffs:

```text
design view → mais detalhada, mas mais pesada
block abstract → preferida, bom equilíbrio físico/timing
ETM → reduz memória/runtime e pode esconder IP
```

---

### 10. Blocos podem ser implementados antes ou em paralelo

Duas estratégias:

#### Blocos completos primeiro

```text
Implementa todos os blocos completamente.
Depois implementa o top usando abstracts/ETMs/frames.
```

#### Implementação paralela

```text
Blocos e top avançam etapa por etapa.
Top usa blocos que já completaram a mesma etapa ou etapa posterior.
```

A segunda estratégia pode reduzir tempo total, mas exige mais controle de versões e consistência dos modelos.

---

## Conceitos difíceis explicados em profundidade

### MCMM

Multi-Corner Multi-Mode. Técnica de análise/otimização considerando múltiplas combinações de modos funcionais e corners PVT.

---

### Scenario

Combinação de modo e corner. Exemplo:

```text
func::ss125c
```

---

### CCD

Concurrent Clock and Data Optimization. Otimização simultânea da rede de clock e dos caminhos de dados, usando latências de clock e useful skew.

---

### Useful skew

Skew intencional e controlado para melhorar timing, especialmente setup, sem violar hold.

---

### Leakage power

Potência estática causada por correntes de fuga, mesmo quando o circuito está parado.

---

### Dynamic power

Potência consumida durante chaveamento. Inclui internal power e switching power.

---

### Internal power

Potência interna da célula, incluindo carga/descarga de capacitâncias internas e corrente de curto momentâneo.

---

### Switching power

Potência para carregar e descarregar capacitâncias de nets/interconexões.

---

### Multi-Vt

Uso de células com diferentes threshold voltages: low-Vt, standard-Vt e high-Vt.

---

### Floorplan

Definição física de tamanho/formato do bloco, macros, pinos, voltage areas, blockages e power network.

---

### CTS

Clock Tree Synthesis. Construção e otimização da árvore de clock.

---

### DRC

Design Rule Check. Checagem de regras físicas de fabricação.

---

### ECO

Engineering Change Order. Mudança incremental no design para corrigir timing, funcionalidade ou problemas físicos.

---

### DFM

Design for Manufacturability. Conjunto de tarefas para tornar o design mais fabricável.

---

### Filler cell

Célula usada para preencher espaços entre standard cells.

---

### Metal fill

Preenchimento de metal dummy para atender requisitos de densidade, principalmente para CMP.

---

### ETM

Extracted Timing Model. Modelo abstrato de timing de um bloco, útil para top-level implementation.

---

### Block abstract

Representação abstrata de um bloco gerada no Fusion Compiler, usada para integração top-level com menor custo de memória/runtime.

---

## Comandos importantes

### Fluxo principal

```tcl
compile_fusion
clock_opt
route_auto
route_opt
eco_opt
```

### Criar modos, corners e cenários

```tcl
create_mode func
create_mode test

create_corner ss125c

create_scenario -mode func -corner ss125c
create_scenario -mode test -corner ss125c
```

### Opções/conceitos citados

```text
compile_fusion -to logic_opto
compile.auto_floorplan_enable
```

### Tarefas associadas ao fluxo

```text
PrimeTime
StarRC
IC Validator
ECO Fusion
```

---

## Tabela de comandos/fases do Fusion Compiler

| Fase | Comando/tema | Função |
|---|---|---|
| Synthesis + placement | `compile_fusion` | Síntese física, placement, otimização de timing/power/area |
| CTS | `clock_opt` | Clock tree synthesis e pós-CTS optimization |
| Routing | `route_auto` | Roteamento automático |
| Post-route optimization | `route_opt` | Otimização pós-route e ECO route |
| Timing ECO | `eco_opt` | Fechamento de timing com ECO Fusion |
| MCMM setup | `create_mode`, `create_corner`, `create_scenario` | Define modos, corners e cenários |
| Floorplan inicial | `compile_fusion -to logic_opto` | Pode gerar floorplan inicial com auto-floorplan |
| Signoff | PrimeTime/StarRC/ICV | STA, extraction, DRC e metal fill |

---

## Figuras e diagramas importantes

### Unified RTL-to-GDSII Flow

Mostra a sequência:

```text
compile_fusion → clock_opt → route_auto/route_opt → eco_opt
```

É a figura central do fluxo.

---

### Multiple Modes and Corners

Mostra modos funcionais/teste/baixo consumo e corners PVT, justificando MCMM.

---

### Concurrent MCMM Optimization

Mostra que a ferramenta corrige violações em um cenário sem causar/aumentar violações em outros.

---

### Creating Modes, Corners and Scenarios

Mostra o relacionamento entre `func`, `test`, `ss125c` e os cenários `func::ss125c` e `test::ss125c`.

---

### Concurrent Clock and Data Optimization

Mostra a ideia de aplicar latências de clock para balancear slack.

---

### Power

Mostra a divisão entre static/leakage power e dynamic power, com internal e switching power.

---

### Leakage and Dynamic Power Optimization

Mostra o tradeoff entre low-Vt, standard-Vt e high-Vt.

---

### Floorplanning Overview

Mostra a sequência: definir bloco, colocar voltage areas/macros, colocar pinos, aplicar blockages, construir power network e escrever floorplan.

---

### Synthesis with New Floorplan

Mostra que reiniciar o fluxo com floorplan detalhado melhora QoR.

---

### Clock Tree Synthesis Goal and Flows

Compara Classic CTS e CCD.

---

### IC Compiler II Routing Flow

Mostra checks pré-route, routing, optimization/reroute e signoff.

---

### Signoff / DFM Tasks

Mostra timing ECO, filler insertion, DRC/fixing e metal filling.

---

### Top Level Implementation

Mostra uso de design views, block abstracts e ETMs.

---

### Using Completely Implemented Blocks

Mostra blocos completos primeiro, depois top-level usando abstracts/ETMs/frames.

---

### Parallel Blocks and Top Implementation

Mostra blocos e top evoluindo em paralelo por etapa.

---

## Pontos de prova e revisão

1. O fluxo unificado do Fusion Compiler usa `compile_fusion`, `clock_opt`, `route_auto`, `route_opt` e `eco_opt`.
2. `compile_fusion` faz síntese RTL, placement e otimização física inicial.
3. `clock_opt` faz CTS e otimização pós-CTS.
4. `route_auto` e `route_opt` fazem roteamento e otimização pós-route.
5. `eco_opt` está ligado ao fechamento de timing com ECO Fusion.
6. Chips modernos operam em múltiplos modos.
7. Chips modernos operam em múltiplos PVT corners.
8. Um scenario é combinação de mode e corner.
9. `create_mode` cria modo.
10. `create_corner` cria corner.
11. `create_scenario` combina modo e corner.
12. MCMM otimiza múltiplos cenários concorrentemente.
13. MCMM tenta corrigir uma violação sem causar/aumentar violação em outro cenário.
14. CCD significa Concurrent Clock and Data Optimization.
15. CCD introduz useful skew para melhorar setup timing.
16. CCD fica ligado por padrão segundo o slide.
17. Leakage power é potência estática de fuga.
18. Leakage aumenta com células low-Vt.
19. Dynamic power ocorre quando o circuito está ativo.
20. Dynamic power inclui internal power e switching power.
21. Internal power ocorre dentro da célula.
22. Switching power ocorre nas nets.
23. Low-Vt é mais rápido e tem mais leakage.
24. High-Vt é mais lento e tem menos leakage.
25. Bibliotecas multi-Vt devem estar disponíveis para otimização de leakage.
26. Dynamic power pode ser otimizada por sizing, pin swapping, decomposition, multibit banking e clock gating.
27. Floorplan define block shape/size, voltage areas, macros, I/O pins, blockages e power network.
28. Auto-floorplan pode ser usado em `compile_fusion -to logic_opto`.
29. Reiniciar o fluxo com floorplan detalhado melhora QoR.
30. CTS deve ocorrer após placement aceitável.
31. Antes de CTS, high fanout nets como reset e scan enable são bufferizadas.
32. CTS constrói clock tree buffer structure.
33. CTS também roteia clock nets.
34. Classic CTS faz CTS primeiro e otimização de data path depois.
35. CCD faz CTS e data path optimization concorrentemente.
36. Setup de CTS envolve sink/ignore pins, skew/latency targets, CTS cell selection e inter-clock-tree balancing.
37. Non-default routing rules podem controlar largura, espaçamento e vias.
38. Routing envolve pre-routing checks, signal routing e optimization/reroute.
39. DRC fixing envolve roteamento incremental.
40. `route_opt` envolve pre-postroute checks, optimization e ECO route.
41. Depois de route_opt, são necessários signoff extraction, STA e possivelmente ECO.
42. Filler cell insertion preenche gaps entre standard cells.
43. Metal filling preenche camadas metálicas para CMP.
44. Functional ECO pode ocorrer a qualquer momento.
45. Top-level blocks podem ser design views, block abstracts ou ETMs.
46. Design views são aceitáveis até cerca de 100k gates.
47. Block abstracts são gerados no FC e são a escolha preferida.
48. ETMs reduzem memória/runtime em designs muito grandes.
49. ETMs também ajudam quando IP precisa ser escondido.
50. Blocos podem estar sintetizados/placed, com CTS feito ou completamente roteados.
51. Em fluxo de blocos completamente implementados, os blocos fecham primeiro e o top vem depois.
52. Em fluxo paralelo, top usa blocos que completaram a mesma etapa ou etapa posterior.
53. `Abstract / ETM + Frame` é a interface entre bloco e top.
54. A estratégia paralela reduz tempo total, mas exige consistência de modelos.
55. O objetivo do fluxo é melhor PPA e convergência mais previsível.

---

## Relação com projeto/laboratório

Fluxo conceitual completo depois do setup da parte A:

```tcl
# Após criar design library, ler RTL, carregar UPF e floorplan

compile_fusion

clock_opt

route_auto
route_opt

eco_opt
```

Setup MCMM básico:

```tcl
create_mode func
create_mode test

create_corner ss125c

create_scenario -mode func -corner ss125c
create_scenario -mode test -corner ss125c
```

Estratégia de floorplan:

```text
1. Rodar compile_fusion -to logic_opto com auto-floorplan.
2. Exportar floorplan.
3. Recomeçar compile_fusion com floorplan detalhado.
4. Seguir para clock_opt, route_auto, route_opt e eco_opt.
```

Checklist prático da parte B:

```text
1. Defini modes?
2. Defini corners?
3. Criei scenarios?
4. Tenho floorplan adequado?
5. Rodei compile_fusion?
6. CTS está preparado com constraints de skew/latency?
7. Usei clock_opt?
8. Rodei route_auto e route_opt?
9. Fiz signoff extraction/STA?
10. Há timing ECOs?
11. Fiz DRC signoff?
12. Inserção de filler e metal fill está prevista?
13. Para top-level, usarei design views, block abstracts ou ETMs?
14. Os blocos estão na etapa certa para o top-level?
```

---

## Checklist de qualidade

- [x] Bloco 077 processado conforme roteiro, slides 21-39.
- [x] Conteúdo continuou a partir de `Fusion Compiler Unified RTL-to-GDSII Flow`.
- [x] Texto dos prints foi extraído e organizado.
- [x] Figuras de fluxo, MCMM, CCD, power, floorplanning, CTS, routing, signoff e top-level foram interpretadas.
- [x] Comandos Tcl foram preservados.
- [x] Pontos de prova e revisão foram listados.
- [x] Próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 078
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 01 Module 01 — Introduction to UPF
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\01 Module 01 - Introduction to UPF.docx
```

- **Faixa:** slides 1-16
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\01 Module 01 - Introduction to UPF.md
```

- **Próximo depois dele:** Bloco 079 — `02 Module 02 - Power Domains`
