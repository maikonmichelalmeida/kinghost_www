# 07 Module 07 — Fusion Compiler Reporting

## Controle do bloco

- **Bloco:** 088
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 07 Module 07 — Fusion Compiler Reporting
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\07 Module 07 - Fusion Compiler Reporting.docx`
- **Arquivo anexado nesta conversa:** `07 Module 07 - Fusion Compiler Reporting.docx`
- **Faixa processada conforme roteiro:** slides 1-26
- **Observação sobre o anexo:** o DOCX possui 13 páginas renderizadas, com 2 slides por página. O texto não veio como texto editável parseável; a extração foi feita visualmente a partir dos prints.
- **Começa em:** `UPF Flow Overview`
- **Termina em:** `Reference — Useful Reporting Commands`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\07 Module 07 - Fusion Compiler Reporting.md
```

---

## Resumo executivo

Este módulo fecha o curso **Fusion Compiler UPF Fundamentals** mostrando como investigar, reportar e depurar problemas de UPF dentro do **Fusion Compiler**. Os módulos anteriores ensinaram a construir o power intent; este módulo mostra como conferir se ele está sendo aplicado corretamente.

A ideia central é:

```text
Depois de carregar UPF, commitar o power intent e criar/inserir células multivoltage, o projetista precisa usar reports para responder:
o design está eletricamente correto?
as cells multivoltage foram inseridas onde deveriam?
as supplies estão conectadas corretamente?
as power states explicam a violação?
a célula pertence ao power domain esperado?
há mismatch de PVT/corner?
é possível inserir buffer em determinada net?
```

O módulo gira em torno de um fluxo de debug:

```text
load_upf
commit_upf
create_mv_cells
check_mv_design
reports específicos
compile_fusion
check_mv_design
save_upf
```

Os comandos principais estudados são:

```tcl
commit_upf
create_mv_cells
check_mv_design
report_cell -power
get_related_supply_nets
get_related_supply_set
report_pst
report_mv_cells
report_mv_lib_cells
get_lib_cells
get_power_domains
report_power_domains
report_pvt
check_bufferability
```

O módulo também inclui uma seção de suporte Synopsys:

- Training;
- SolvNetPlus;
- Support Center;
- Application Engineers;
- Design Consultants;
- SNUG.

A parte mais importante tecnicamente é a lógica de investigação após `check_mv_design`:

```text
1. check_mv_design aponta uma violação.
2. report_cell -power mostra como a célula está alimentada.
3. get_related_supply_nets / get_related_supply_set mostra a supply relacionada aos pinos.
4. report_pst compara os estados das supplies envolvidas.
5. report_mv_cells mostra a estratégia e a célula PM inserida.
6. report_mv_lib_cells mostra atributos da célula de biblioteca.
7. report_power_domains confirma se a célula pertence ao domínio esperado.
8. report_pvt detecta mismatches de corner/tensão/temperatura.
9. check_bufferability investiga se a ferramenta consegue inserir buffers naquela net.
```

---

# Parte 1 — Visão geral do fluxo UPF e pontos de relatório

## Slide 1 — UPF Flow Overview

### Texto extraído

Título:

```text
UPF Flow Overview
```

Pontos:

```text
Unified RTL-to-GDSII in one single shell
```

```text
UPF is loaded for the design
```

Subitem:

```text
create_mv_cells is an optional step for checking how the power intent is applied
```

```text
Steps that perform multivoltage cell insertion:
```

Subitens:

```text
initial_map
initial_place
```

Fluxo da figura:

```text
Fusion Compiler
Load UPF
create_mv_cells
initial_map
logic_opto
insert_dft
initial_place
...
compile_fusion
Insertion of multivoltage cells
```

### Interpretação

O slide retoma a visão geral do fluxo UPF no Fusion Compiler.

O UPF é carregado para o design e as células multivoltage são inseridas durante o fluxo de `compile_fusion`, especialmente em:

```text
initial_map
initial_place
```

O comando:

```tcl
create_mv_cells
```

é opcional. Ele não é necessariamente parte obrigatória da implementação, mas serve para verificar cedo como o power intent será aplicado.

### Ponto didático

`create_mv_cells` é útil para responder:

```text
o UPF está inferindo as células esperadas?
a strategy de isolation está gerando ISO?
a strategy de level shifter está gerando LS?
retention está sendo convertida?
```

Antes de gastar tempo em um compile completo, esse comando pode ajudar no debug do UPF.

---

## Slide 2 — UPF Flow Overview — perguntas que os reports ajudam a responder

### Texto extraído

Título:

```text
UPF Flow Overview
```

Perguntas laterais:

```text
Is the design electrically correct?
```

```text
Are multivoltage cells mapped as intended on the input UPF?
```

```text
Are there operating condition issues in my design?
```

```text
Many issues in multivoltage implementation could need investigation
```

Notas:

```text
* create_mv_cells is an optional command, not necessarily part of the implementation flow
** initial_place step only inserts power management cells if insert_dft step has been run
```

### Interpretação

Este slide explica por que o módulo existe: os reports não são acessórios; eles são a forma de confirmar se a implementação UPF está coerente.

As perguntas principais são:

## 1. O design está eletricamente correto?

Isso envolve:

- PG connectivity;
- always-on violations;
- voltage-level violations;
- off-to-on violations;
- supply mismatches.

## 2. As células MV foram mapeadas como pretendido?

O UPF pode pedir isolation ou LS, mas a ferramenta pode:

- não inserir;
- inserir unmapped;
- inserir em outro local;
- usar célula diferente;
- não mapear por falta de library cell adequada.

## 3. Há problemas de operating condition?

PVT/corner mismatch pode afetar delay, power, e até a seleção/inserção de PM cells.

### Ponto importante

A nota sobre `initial_place` é importante:

```text
initial_place só insere PM cells se insert_dft já tiver sido executado.
```

Isso explica por que, em alguns fluxos, células PM adicionais aparecem depois por causa de caminhos DFT.

---

# Parte 2 — Verificando se o UPF foi corretamente commitado

## Slide 3 — Checking Whether Your UPF is Correctly Committed

### Texto extraído

Título:

```text
Checking Whether Your UPF is Correctly Committed
```

Fluxo:

```text
Fusion Compiler
Load UPF
commit_upf
create_mv_cells
```

Perguntas/etapas:

```text
Are there incomplete constraints in my input UPF?
Resolution of conflicts between DEF and UPF
Basic checks are performed
```

Pontos:

```text
Committing the input UPF indicates to the tool that the UPF intent is complete and finalized for the design
```

Subitem:

```text
Auto executed during compile_fusion and create_mv_cells
```

`commit_upf` faz checagens básicas como:

```text
UPF object reference
Primary power/ground check
Strategy association for instantiated power management cells
Power Domain - Voltage Area correspondence check
Library cells specified in the mapping commands can be used by the tool
```

Outro ponto:

```text
Resolves PG conflict between DEF and UPF
```

Subitem:

```text
Only happens if DEF is loaded before this command is executed
```

### Interpretação

`commit_upf` é uma etapa de fechamento do power intent.

Ele diz ao Fusion Compiler:

```text
o UPF que foi carregado está completo e pode ser usado pela ferramenta.
```

Mesmo sendo executado automaticamente por `compile_fusion` e `create_mv_cells`, chamar `commit_upf` explicitamente ajuda a detectar problemas cedo.

## Checagens feitas

### 1. Referência de objetos UPF

Verifica se os objetos citados no UPF existem:

```text
power domains
supply sets
signals
instances
strategies
library cells
```

### 2. Primary power/ground

Verifica se os domínios possuem power/ground primários coerentes.

### 3. Association de PM cells instanciadas

Se o design já possui células de isolation, LS, retention etc. instanciadas, a ferramenta tenta associá-las às strategies corretas.

### 4. Power Domain ↔ Voltage Area

Confere se o domínio de potência está coerente com a voltage area.

### 5. Library cells de mapping

Verifica se as células especificadas em comandos de mapping podem realmente ser usadas pela ferramenta.

### Ponto prático

Se o `commit_upf` acusa erro, normalmente não vale seguir para `compile_fusion` antes de corrigir.

---

## Slide 4 — Checking Whether Your UPF is Correctly Committed — Usage Example

### Texto extraído

Título:

```text
Checking Whether Your UPF is Correctly Committed
```

Exemplo:

```tcl
fc_shell> commit_upf
```

Mensagens destacadas no log:

```text
Warning: map_retention_cell of retention strategy RET for power domain PD_TOP specifies unusable library cells
```

```text
Information: Related supplies are not explicitly specified on ... ports and primary supplies ... will be used
```

```text
Information: The power domain PD_1 is associated to the voltage area DEFAULT_VA by enable_existing_voltage_area.
```

```text
Information: Total 30 isolation cell(s) in the design.
Information: Total 0 level shifter cell(s) in the design.
Information: Total 5 enable level shifter cell(s) in the design.
Information: Total 0 repeater cell(s) in the design.
Information: Total 15 retention cell(s) in the design.
Information: Total 0 power switch cell(s) in the design.
```

Anotações laterais:

```text
Basic check detecting library cells not suitable for retention mapping
```

```text
Power management cells already present in the design where UPF is committed
```

```text
Conflicts between PG netlist and UPF information that have been resolved
```

### Interpretação

O exemplo mostra três tipos de informação úteis.

## 1. Célula de biblioteca inadequada

A mensagem sobre `map_retention_cell` indica que a célula especificada para retention mapping não é utilizável.

Isso pode ocorrer por:

- célula não estar na biblioteca;
- célula não possuir atributos de retention;
- célula não estar compatível com strategy;
- falta de PG pins/modelagem.

## 2. Supplies implícitas usadas

O log mostra que algumas supplies não foram especificadas explicitamente, então a ferramenta usará primary supplies. Isso pode ser aceitável ou pode ser sintoma de UPF incompleto.

## 3. Contagem de PM cells já presentes

A ferramenta reporta quantas células já existem:

```text
isolation
level shifter
enable level shifter
repeater
retention
power switch
```

Isso ajuda a entender o estado inicial do design antes do compile.

### Regra prática

Leia o log de `commit_upf`; ele costuma apontar problemas de setup que depois aparecem como violações mais difíceis.

---

# Parte 3 — Criar células multivoltage e checar power intent

## Slide 5 — Create Multivoltage Cells and Check your Power Intent — Implementation of Strategies

### Texto extraído

Título:

```text
Create Multivoltage Cells and Check your Power Intent — Implementation of Strategies
```

Comando:

```tcl
create_mv_cells [-mapped] (optional)
```

Pontos:

```text
Inserts level shifters, isolation cells, and retention cells in the design,
based on defined UPF strategies and conditions; by default, no mapping to library cells happen
```

Subitem:

```text
Useful for UPF authoring; check your power intent early in the flow and modify the strategies as required
```

Outro subitem:

```text
When used with -mapped, inserts power management cells mapped to libraries loaded in the design and according to UPF definition
```

Outro ponto:

```text
Traces power management cells to establish drivers and loads
```

Perguntas que ele ajuda a responder:

```text
Are UPF strategies being applied correctly?
How many power management cells are inserted?
Are all strategies implemented?
Does UPF require modifications?
Why were some power management cells not inserted?
```

### Interpretação

`create_mv_cells` é um comando de autoria e debug de UPF.

Ele permite inserir células MV de acordo com as strategies UPF antes do fluxo completo de implementação.

## Sem `-mapped`

A ferramenta insere células genéricas/unmapped. Isso é útil para validar a lógica do UPF:

```text
deveria haver isolation aqui?
deveria haver LS nesse boundary?
a retention foi reconhecida?
```

## Com `-mapped`

A ferramenta tenta inserir células já mapeadas para as bibliotecas carregadas:

```tcl
create_mv_cells -mapped
```

Isso testa também se a biblioteca tem células compatíveis.

## Tracing de drivers e loads

O comando também rastreia PM cells para estabelecer drivers e loads, algo importante para source/sink analysis.

### Ponto prático

Se `create_mv_cells` não insere a célula esperada, investigue:

- strategy incompleta;
- power states/PST;
- source/sink;
- available supplies;
- biblioteca;
- constraints em nets;
- location incompatível.

---

## Slide 6 — Create Multivoltage Cells and Check your Power Intent — loop de autoria

### Texto extraído

Título:

```text
Create Multivoltage Cells and Check your Power Intent — Implementation of Strategies
```

Fluxo:

```text
Load UPF
commit_upf
create_mv_cells
check_mv_design
Edit your UPF
```

Pontos:

```text
create_mv_cells allows you to check your power intent early in the flow and modify strategies as required
```

Subitens:

```text
Check implementation of UPF strategies with the outcome of the command
Use check_mv_design to ensure electrical correctness
Edit your input UPF as required while authoring the power intent for your design
```

Exemplo:

```tcl
fc_shell> create_mv_cells
Information: Total 40 sequential cells have been converted to generic retention cells. (MV-075)
Information: Total 0 repeater cells have been inserted. (MV-054)
Information: Total 15 isolation cells have been inserted. (MV-054)
Information: Total 0 enable level shifter (as isolation cells) have been inserted. (MV-054)
Information: Total 10 level shifter cells have been inserted. (MV-054)
Information: Total 15 enable level shifter cells have been inserted to replace isolation cells. (MV-057)
```

### Interpretação

Este slide mostra `create_mv_cells` como parte de um ciclo iterativo.

```text
load UPF → commit UPF → create MV cells → check MV design → editar UPF
```

O objetivo é ajustar o power intent antes de ir para implementação mais pesada.

## Como interpretar o log?

O log mostra contagens:

- registradores convertidos para retention;
- repeaters inseridos;
- isolation cells inseridas;
- enable level shifters;
- level shifters;
- ELS substituindo isolation cells.

### Exemplo de interpretação

Se você esperava 100 LS e o log mostra 0, algo está errado:

- PST/PSG não indica diferença de tensão;
- threshold impede LS;
- source/sink não bate;
- strategy não aplica;
- biblioteca não tem célula;
- net é ideal/dont_touch;
- supply não disponível.

Se você esperava isolation cells e aparecem ELS substituindo ISO, a biblioteca/strategy pode ter escolhido célula combinada.

---

# Parte 4 — Multivoltage static checkers

## Slide 7 — Using Multivoltage Static Checkers

### Texto extraído

Título:

```text
Using Multivoltage Static Checkers
```

Comando:

```tcl
check_mv_design (optional)
```

Pontos:

```text
Performs multivoltage, PG connectivity, and UPF intent checks
Ensures electrical correctness of your design
```

Outro ponto:

```text
Captures any violation in the design related to multivoltage
```

Subitens:

```text
Use it to investigate each kind of violation reported
The checker options can be combined to adjust the level of detail in the final report
```

Categorias mostradas:

```text
Power management cell association
Off to on violations
Always-on violations
Voltage level violations
Power domain rule
Operand mismatches
PG net connectivity
```

### Interpretação

`check_mv_design` é o checker estático principal para design multivoltage.

Ele verifica:

- coerência de UPF;
- conectividade PG;
- associação de PM cells;
- violações off-to-on;
- violações always-on;
- violações de voltage level;
- power domain rules;
- operand mismatches;
- PG net connectivity.

### Quando usar?

Use antes e depois da implementação:

```text
antes: detectar problema de intenção/setup
depois: detectar problema na implementação resultante
```

### Ponto prático

O comando não apenas diz “há violação”. Ele deve guiar qual report usar depois.

Exemplo:

```text
voltage level violation → report_cell -power + get_related_supply_set + report_pst
always-on violation → report_power_domains + supplies + PST
PM cell association → report_mv_cells
PVT mismatch → report_pvt
```

---

# Parte 5 — Reportando conectividade de células

## Slide 8 — Reporting Cell Connectivity

### Texto extraído

Título:

```text
Reporting Cell Connectivity
```

Pontos:

```text
Once check_mv_design is run, you might have information on different kinds of violations in your design such as:
```

Exemplos:

```text
Off-to-on violations, which require to check your power state table and an isolation cell that could be missing
Voltage shifting violations, which might require level shifter
Always-on violations, when a cell should be powered by a "more always-on" supply
```

Para investigar conexões em nível de célula e supplies relacionadas:

```text
Related supply net of port(s) or pin(s):
```

```tcl
get_related_supply_nets -objects $name_or_collection_of_pins_or_ports
```

```text
Related supply set of port(s) or pin(s):
```

```tcl
get_related_supply_set -objects $name_or_collection_of_pins_or_ports
```

Power connectivity da célula:

```tcl
report_cell $cell -power
```

### Interpretação

Depois que `check_mv_design` aponta uma violação, a próxima pergunta é:

```text
como essa célula ou esse pino está alimentado de verdade?
```

Para isso, o slide apresenta três comandos.

## `get_related_supply_nets`

Mostra as supply nets relacionadas a um pino/porta.

## `get_related_supply_set`

Mostra o supply set relacionado a um pino/porta.

## `report_cell -power`

Mostra a conectividade de power da célula, isto é, quais supplies estão conectadas aos PG pins da célula.

### Quando usar cada um?

| Pergunta | Comando |
|---|---|
| Qual supply net alimenta este pino? | `get_related_supply_nets` |
| Qual supply set está relacionado a este pino? | `get_related_supply_set` |
| Quais PG pins/supplies alimentam esta célula? | `report_cell -power` |

---

## Slide 9 — Reporting Cell Connectivity — Example

### Texto extraído

Título:

```text
Reporting Cell Connectivity — Example
```

Cenário:

```text
In this example, there is a multivoltage violation between cells U1 and U2
```

Ponto:

```text
For more detail on how these cells are powered, you may want to check the cell connectivity,
that is, which supplies are used to power the cell
```

Exemplo:

```tcl
report_cell U1 -power
```

Para output pin `Y` de `U1`:

```tcl
get_related_supply_nets [get_pins U1/Y]
get_related_supply_set  [get_pins U1/Y]
```

Para input pin `A` de `U2`:

```tcl
get_related_supply_nets [get_pins U2/A]
get_related_supply_set  [get_pins U2/A]
```

Figura:

```text
U1 → violação multivoltage → U2
```

### Interpretação

O exemplo mostra uma violação entre `U1` e `U2`.

A investigação começa por `U1`:

```tcl
report_cell U1 -power
```

Isso mostra os PG pins e as supplies conectadas.

Depois, verifica-se o pino de saída de `U1`:

```tcl
get_related_supply_nets [get_pins U1/Y]
get_related_supply_set  [get_pins U1/Y]
```

E o pino de entrada de `U2`:

```tcl
get_related_supply_nets [get_pins U2/A]
get_related_supply_set  [get_pins U2/A]
```

### Objetivo

Comparar:

```text
supply do driver U1/Y
supply do receiver U2/A
```

Se elas têm tensões diferentes, pode ser necessária uma célula LS.

Se o driver pode estar OFF enquanto receiver está ON, pode ser necessária ISO.

---

## Slide 10 — Reporting Cells Connectivity — Reporting Supplies

### Texto extraído

Título:

```text
Reporting Cells Connectivity — Reporting Supplies
```

Pontos:

```text
By check_mv_design or by inspection of cell connectivity, you have identified
supplies in a path; you now might want to check their power state table behavior
in case there is a violation of any kind
```

Explicação:

```text
Power state table behavior means how they are defined in the power state table,
or how their power states interact:
```

Perguntas:

```text
Do they have different voltages?
Is one of them more Always On than the other?
```

Exemplo:

```text
Using the previous example, you can easily compare states of supply nets VDD and VDD_2
```

Comando:

```tcl
report_pst -supplies {VDD VDD_2} -derived -voltage_type all
```

Nota:

```text
Using report_pst -supplies you can check the states in your power state table
of VDD and VDD_2 that generate the violation between U1 and U2
```

### Interpretação

Depois de descobrir quais supplies estão nos pinos/células, o próximo passo é analisar os estados dessas supplies.

O comando:

```tcl
report_pst -supplies {VDD VDD_2} -derived -voltage_type all
```

permite comparar a PST das duas supplies.

### O que procurar?

## 1. Diferença de tensão

Se `VDD = 0.85` e `VDD_2 = 0.95`, pode existir voltage level violation e necessidade de LS.

## 2. Relação always-on

Se uma supply permanece ON quando a outra está OFF, pode existir off-to-on ou necessidade de isolation/AO handling.

## 3. Estados incompatíveis

Se uma combinação de estados não está definida ou é ilegal, a violação pode vir da PST/PSG.

### Ponto didático

O debug correto não para em “U1 e U2 têm supplies diferentes”. É preciso saber em quais power states essa diferença ocorre.

---

# Parte 6 — Reportando power management cells

## Slide 11 — Reporting Power Management Cells — Instance Report

### Texto extraído

Título:

```text
Reporting Power Management Cells — Instance Report
```

Pontos:

```text
Besides reporting cell connectivity, you might face scenarios where you want to check the information about a power management cell
```

Exemplos:

```text
Strategy that made the power management cell insertion where it is inserted
Power supplies
```

Comando:

```tcl
report_mv_cells $cell
```

Opções mostradas:

```text
-level_shifter      include only level shifter cells
-enable_level_shifter include only enable level shifter cells
-isolation          include only isolation cells
-repeater           include only repeater cells
-retention          include only retention cells
-retention_clamp    include only retention clamp cells
-always_on          include only always-on buffer, inverter, and tie cells
-power_strategy     include cells associated to power strategy
-cells              list of cells
-verbose            print extra info about cells
```

### Interpretação

`report_mv_cells` reporta informações sobre células multivoltage inseridas no design.

Ele responde:

```text
que tipo de célula PM é esta?
qual strategy a inseriu?
onde ela foi inserida?
quais supplies ela usa?
qual biblioteca/célula foi mapeada?
```

### Uso com filtros

Você pode filtrar por tipo:

```tcl
report_mv_cells -isolation
report_mv_cells -level_shifter
report_mv_cells -retention
report_mv_cells -always_on
```

Ou reportar uma célula específica:

```tcl
report_mv_cells ISO
```

Com `-verbose`, o relatório fica mais detalhado.

---

## Slide 12 — Reporting Power Management Cells — Instance Report Example

### Texto extraído

Título:

```text
Reporting Power Management Cells — Instance Report Example
```

Cenário:

```text
We have same previous violation between U1 and U2 buffers
Now there is isolation cell, named ISO, inserted between U1 and U2
```

Comando:

```tcl
fc_shell> report_mv_cells ISO -verbose -isolation
```

Informações visíveis no relatório:

```text
Isolation Cell(s)
ISO

Cell Name ISO
Cell Type Isolation Cell
Location Domain PD_TOP
Clamp Value 0
Isolation Sense low
Isolation Style Multi Rail
ISO Strategy set_isolation ISO -domain PD_TOP -location self -isolation_supply SS_ISO
Isolation Signal iso_enable
Associated Pin/Port ...
Input Supplies (VDD,VSS)
Output Supplies (VDD_2,VSS)
Area ...
Multibit No
Library Cell lib/ISO_LIB_CELL
```

### Interpretação

O exemplo mostra uma ISO inserida entre `U1` e `U2`.

O relatório mostra informações críticas:

## 1. Tipo

```text
Isolation Cell
```

## 2. Domínio/localização

```text
Location Domain PD_TOP
```

## 3. Clamp e sense

```text
Clamp Value 0
Isolation Sense low
```

Isso diz qual valor a célula força e qual polaridade ativa a isolation.

## 4. Strategy que inseriu a célula

O relatório mostra a strategy `set_isolation` associada.

Isso é essencial para debug: se a célula apareceu em lugar inesperado, você pode ver qual strategy a criou.

## 5. Supplies

```text
Input Supplies
Output Supplies
```

Mostra quais supplies estão em cada lado da ISO.

## 6. Library cell

Mostra qual célula de biblioteca foi usada.

### Ponto prático

`report_mv_cells -verbose` é um dos comandos mais úteis para entender por que uma PM cell existe e como ela foi conectada.

---

## Slide 13 — Reporting Power Management Cells — Library Cell Report

### Texto extraído

Título:

```text
Reporting Power Management Cells — Library Cell Report
```

Pontos:

```text
For obtaining information of the library cell to which a multivoltage cell is mapped,
you can use the report_mv_lib_cells command
```

Exemplo:

```text
Based on an example similar to the previous one, let us examine the ELS library cell,
lib/ELS_LIB_CELL
```

Obter lib cell a partir da célula:

```tcl
get_lib_cells -of_objects ELS
```

Combinar comandos:

```tcl
report_mv_lib_cells [get_lib_cells -of_objects ELS]
```

Relatório mostra:

```text
Enable Level Shifter
Attributes: ELS, DH/LLH?, Sense, ...
Signal Pins: A(VDD1/VSS), EN(VDD/VSS), Z(VDD/VSS)
Supply Pins: VDD1(power/prim), VDD(power/...), VSS(ground/prim)
```

Anotações:

```text
Library cell attributes and pins
Panels with operating conditions available for the library cell
Signal pins are reported with their relation to supply PG-pins
For example, signal pin A is related to PG-pins VDD1 and VSS
```

### Interpretação

`report_mv_cells` mostra a instância no design. `report_mv_lib_cells` mostra a célula de biblioteca por trás da instância.

Fluxo:

```tcl
get_lib_cells -of_objects ELS
report_mv_lib_cells [get_lib_cells -of_objects ELS]
```

### O que esse report mostra?

- atributos da célula;
- tipo: ELS, LS, ISO etc.;
- pinos de sinal;
- PG pins;
- relação entre signal pins e PG pins;
- operating conditions disponíveis.

### Por que isso importa?

Se uma PM cell foi inserida, mas parece funcionar errado, talvez a modelagem da library cell esteja incorreta.

Exemplo:

```text
signal pin A deveria estar relacionado a VDD1/VSS,
mas está modelado em outro rail.
```

Isso pode causar erro de source/sink, PVT, operating condition ou voltage-level.

---

# Parte 7 — Reportando power domains

## Slide 14 — Reporting Power Domain Information

### Texto extraído

Título:

```text
Reporting Power Domain Information
```

Pontos:

```text
After running check_mv_design and reporting power connectivity of a cell,
you might find that the cell is not powered by the same supply you expected
```

Possíveis causas:

```text
Applicability of strategies
Cell could belong to a different power domain than you defined, or domain constraints are not applied as you expected
```

Para checar power domain de uma célula:

```tcl
get_power_domains -of_object $cell
```

Para reportar informações de um domínio:

```tcl
report_power_domains [$power_domain]
```

Combinando:

```tcl
report_power_domains [get_power_domains -of_objects [get_cells $cell]]
```

Nota:

```text
One call here allows you to report the information of the power domain of the cell of your interest
```

### Interpretação

Se uma célula está alimentada por supply inesperada, talvez ela esteja no power domain errado.

Isso pode acontecer por:

- `create_power_domain -elements` errado;
- hierarquia inesperada;
- `-include_scope` mal aplicado;
- constraints de domínio não aplicadas;
- strategy aplicando em outro domínio;
- célula inserida em parent ou fanout.

### Comandos

Para descobrir o domínio da célula:

```tcl
get_power_domains -of_objects [get_cells $cell]
```

Para reportar esse domínio:

```tcl
report_power_domains [get_power_domains -of_objects [get_cells $cell]]
```

### Ponto prático

Quando o debug envolve supply errada, sempre confirme:

```text
a célula pertence ao domínio que eu penso?
```

---

## Slide 15 — Reporting Power Domain Information — Example

### Texto extraído

Título:

```text
Reporting Power Domain Information — Example
```

Comando:

```tcl
fc_shell> report_power_domains [get_power_domains -of_objects [get_cells u1]]
```

Informações destacadas no report:

```text
Power Domain: PD_TOP
Current Scope: / (top scope)
Elements: top
Voltage Area: DEFAULT_VA
Available Supply Nets: ...
Available Supply Sets: ...
Default Supplies:
  Power
  Ground
  Nwell
  Pwell
Primary: ...
Isolation Strategy: ISO
  Supply Set: SS_ISO
  Signal: iso_enable
  Sense: low
  Location: self
  Applies To: outputs
  Applies To Boundary: lower
  Elements: N/A
  Excluded Elements: N/A
  Mapped Cells: ISO
```

Anotações:

```text
Supply net and supply set availability
Supply handles of the domain
Details of strategies defined in the power domain
```

### Interpretação

O relatório de power domain é uma visão consolidada.

Ele mostra:

## 1. Identidade do domínio

```text
nome
scope
elementos
voltage area
```

## 2. Supplies disponíveis

```text
available supply nets
available supply sets
```

Isso é essencial para entender se LS/ISO/RET podem ser inseridos em determinado local.

## 3. Default supplies / handles

Mostra primary, ground, nwell, pwell e handles associados.

## 4. Strategies definidas

Exemplo:

```text
Isolation Strategy ISO
Supply Set SS_ISO
Signal iso_enable
Sense low
Location self
Applies To outputs
```

### Ponto prático

`report_power_domains` é útil quando a pergunta é:

```text
o domínio foi definido como eu imaginava?
as supplies estão disponíveis?
a strategy está associada ao domínio certo?
```

---

# Parte 8 — Reportando PVT mismatches

## Slide 16 — Reporting PVT Mismatches

### Texto extraído

Título:

```text
Reporting PVT Mismatches
```

Pontos:

```text
Process, Voltage, and Temperature (PVT) mismatching can impact your design in
several ways, including generating wrong delay and power calculation
```

Subitem:

```text
Wrong PVT setting can make the tool link to an improper panel for a given corner,
affecting calculations
```

Comando:

```tcl
report_pvt
```

Pontos:

```text
Use report_pvt command to check your design operating conditions
```

Subitens:

```text
Reports per-corner PVT information, including mismatches between the specified and effective PVT values
The PVT parameters include the specified and effective values of the process label,
the process number, the temperature, and the voltages of each power rail,
for both early and late analysis types
The actual early and late pane numbers are also reported
```

Outro ponto:

```text
Insertion of power management cells can be affected by PVT mismatches
```

Comando mostrado:

```tcl
report_pvt
    [-object_list objects]
    [-mismatched]
    [-nosplit]
    [-significant_digits digits]
    [corner_list]
```

Nota:

```text
report_pvt can also work with specific objects or corners in your design
```

### Interpretação

PVT significa:

```text
Process
Voltage
Temperature
```

Mismatches de PVT podem fazer a ferramenta usar um painel/corner incorreto da biblioteca.

### Consequências

- delay errado;
- power errado;
- operating condition errada;
- PM cell insertion afetada;
- seleção de library cell inadequada.

### O que `report_pvt` mostra?

- valores especificados;
- valores efetivos;
- process label;
- process number;
- temperature;
- voltagens de cada power rail;
- early e late analysis;
- pane numbers reais usados.

### Ponto importante

Se uma célula MV não é inserida ou mapeada como esperado, PVT mismatch pode ser parte do problema.

---

## Slide 17 — Reporting PVT Mismatches — Using the `-mismatched` Argument

### Texto extraído

Título:

```text
Reporting PVT Mismatches — Using the -mismatched Argument
```

Comando:

```tcl
report_pvt -mismatched ...
```

Anotações no relatório:

```text
Specified value is due to user constraints; effective value is what is coming from library data
```

```text
Column flagging where the user constraint is set specifically
```

```text
.db file where the information is coming for the parameters in early corner
```

No relatório aparecem colunas como:

```text
Parameter
Specified Value
Effective Value
Source
```

### Interpretação

A opção:

```tcl
-mismatched
```

foca nos casos em que o valor especificado pelo usuário difere do valor efetivo vindo da biblioteca.

## Specified Value

É o que o usuário definiu por constraints.

## Effective Value

É o que a ferramenta está realmente usando, vindo da library data.

## Source

Mostra de onde veio a informação:

- constraint do usuário;
- arquivo script;
- library `.db`.

### Por que isso é importante?

Às vezes o usuário acha que está analisando um corner/tensão, mas a biblioteca efetiva usada é outra.

Isso pode explicar:

```text
por que a ferramenta rejeita uma célula
por que delay/power parece errado
por que PM cell não é inserida como esperado
```

---

# Parte 9 — Checking Buffer Insertion

## Slide 18 — Checking Buffer Insertion

### Texto extraído

Título:

```text
Checking Buffer Insertion
```

Pontos:

```text
You might want to study if is possible for a buffer to be inserted in a net in your design
```

Subitem:

```text
Or understand if there is any condition preventing buffer insertion on a particular net
```

Comando:

```tcl
check_bufferability
```

Perguntas que o comando ajuda a responder:

```text
What supply net is used for buffering net n?
```

```text
Whether single/dual rail, or insulated bias dual rail buffers are used for buffering net n?
```

```text
How many and which buffer and inverter library cells are available for buffering net n?
```

```text
Are there design constraints or other factors that would prevent buffering net n?
```

Categorias laterais:

```text
Library cell availability
Design constraints
Supplies for buffering
Operating conditions affecting
```

### Interpretação

Em designs UPF/multivoltage, inserir um buffer não é trivial.

A ferramenta precisa saber:

- em qual power domain a net está;
- qual supply alimentaria o buffer;
- se há buffer single-rail ou dual-rail disponível;
- se a net atravessa voltage areas;
- se há constraints impedindo buffering;
- se operating conditions permitem a célula.

O comando:

```tcl
check_bufferability
```

investiga se a ferramenta consegue inserir buffers em uma net específica.

### Quando usar?

Use quando:

- a ferramenta não bufferiza uma net;
- uma net ficou `dont_touch`;
- há problema de feedthrough;
- há dúvida sobre supply usada para buffering;
- há falha em buffer insertion por voltage area ou library availability.

---

## Slide 19 — Checking Buffer Insertion — Example

### Texto extraído

Título:

```text
Checking Buffer Insertion — Example
```

Comando mostrado:

```tcl
fc_shell> check_bufferability -nets n
```

Relatório mostra:

```text
Bufferability Summary
Specified net segment: n
Derived hierarchy: /
Derived power domain: PD_TOP
Primary supplies of PD: {power VDD_TOP, ground VSS, ...}
Lib cell purpose: CTS || optimization
```

Mensagem:

```text
Information: Can insert single rail buffers (...) and inverters (...) with supply nets ...
```

Outro trecho:

```text
Bias analysis ...
```

Pontos à direita:

```text
Use -verbose option of the command to print library-cell-based report
```

Subitem:

```text
Details which library cells were accepted or rejected for buffering
```

Outro ponto:

```text
Option -voltage_area restricts the bufferability analysis to the specified Voltage Area only
```

Subitem:

```text
Explore command options that suit the analysis you require
```

Anotações:

```text
Summary of Buffers and inverters that can be used
Bias analysis for using merged-well or insulated-well type of library cells
```

### Interpretação

O exemplo mostra `check_bufferability` aplicado à net `n`.

O relatório identifica:

- net analisada;
- hierarquia derivada;
- power domain derivado;
- primary supplies do domínio;
- library cell purpose;
- buffers/inverters disponíveis;
- análise de bias/well.

## `-verbose`

Mostra relatório baseado em library cells, indicando quais células foram aceitas ou rejeitadas para buffering.

## `-voltage_area`

Restringe a análise a uma voltage area específica.

### Ponto prático

Se uma net não recebe buffer, `check_bufferability -verbose` pode explicar se o problema é:

```text
falta de célula
supply indisponível
bias/well incompatível
voltage area
constraint de design
operating condition
```

---

# Parte 10 — Recursos de suporte Synopsys

## Slide 20 — Synopsys Support Resources

### Texto extraído

Título:

```text
Synopsys Support Resources
```

Pontos:

```text
Build a solid foundation:
Hands-on training for Synopsys tools and methodologies
```

Link mostrado:

```text
https://synopsys.com/support/training.html
```

Subitens:

```text
Workshop Schedule and Registration
Download Labs (SolvNetPlus ID required)
```

Outro bloco:

```text
Drill down to areas of interest:
SolvNetPlus online support
```

Link:

```text
https://solvnetplus.synopsys.com
```

Subitens:

```text
Online technical information and access to support resources
Documentation & Media
Ask an Expert: Synopsys Support Center
```

Outro link:

```text
https://training.synopsys.com
```

### Interpretação

O slide lista recursos oficiais da Synopsys para continuar o estudo:

- treinamentos;
- workshops;
- labs;
- documentação;
- SolvNetPlus;
- suporte técnico;
- Ask an Expert.

No contexto do curso, este slide é menos técnico, mas importante para saber onde buscar informações oficiais quando uma regra de UPF/ferramenta não está clara.

---

## Slide 21 — SolvNetPlus — Synopsys Support Community

### Texto extraído

Título:

```text
SolvNetPlus — Synopsys Support Community
```

Pontos:

```text
Immediate access to the latest technical information
Product Update Training
Methodology Training
Thousands of expert-authored articles, Q&A, scripts and tool tips
Open a Support Center Case
Release information
Online documentation
License keys
Electronic software downloads
Synopsys announcements (latest tool, event and product information)
```

Link:

```text
https://solvnetplus.synopsys.com
```

### Interpretação

SolvNetPlus é a comunidade/plataforma de suporte técnico da Synopsys.

Ela reúne:

- artigos técnicos;
- Q&A;
- scripts;
- tool tips;
- documentação;
- release notes;
- license keys;
- downloads;
- abertura de casos de suporte.

Para problemas reais de UPF/FC, SolvNetPlus costuma ser uma fonte de referência mais direta do que materiais genéricos.

---

## Slide 22 — SolvNetPlus Registration

### Texto extraído

Título:

```text
SolvNetPlus Registration
```

Passos:

```text
Visit SolvNetPlus:
https://solvnetplus.synopsys.com/
```

```text
Click on:
"Register — Create Account"
```

```text
Fill out the required information
```

Subitens:

```text
Corporate email address and Site ID are required
Site IDs can be requested at securelogin@synopsys.com
Registration may take up to 24 hours to process
```

### Interpretação

Este slide explica como criar acesso ao SolvNetPlus.

Pontos práticos:

- exige e-mail corporativo;
- exige Site ID;
- Site ID pode ser solicitado no e-mail indicado;
- aprovação pode levar até 24 horas.

---

## Slide 23 — Support Center

### Texto extraído

Título:

```text
Support Center
```

Pontos:

```text
Industry seasoned Application Engineers:
50% of the support staff has >5 years applied experience
Many tool specialist AEs with >12 years industry experience
Engineers located worldwide
```

Outro bloco:

```text
Great wealth of applied knowledge:
Service >2000 issues per month
```

Outro ponto:

```text
Remote access and interactive debug available
```

Link:

```text
https://www.synopsys.com/support/global-support-centers.html
```

### Interpretação

O slide apresenta o Support Center da Synopsys.

O ponto mais relevante para fluxo profissional é que existe possibilidade de:

```text
remote access
interactive debug
```

Isso pode ser importante em problemas complexos de implementação, como:

- MV insertion inesperada;
- mismatch de biblioteca;
- problemas de PG connectivity;
- DRC/UPF complexos;
- bug de tool/script.

---

## Slide 24 — Other Technical Sources

### Texto extraído

Título:

```text
Other Technical Sources
```

Application Engineers:

```text
Tool and methodology pre-sales support
Contact your Sales Account Manager for more information
```

Design Consultants:

```text
Available for in-depth, on-site, dedicated, custom consulting
Contact your Sales Account Manager for more details
```

SNUG:

```text
SNUG (Synopsys Users Group):
https://www.synopsys.com/community/snug.html
```

### Interpretação

O slide lista outras fontes técnicas:

- Application Engineers;
- Design Consultants;
- SNUG.

SNUG pode ser útil para apresentações, cases e experiências reais de usuários Synopsys.

---

## Slide 25 — Summary: Getting Support

### Texto extraído

Título:

```text
Summary: Getting Support
```

Customer Training:

```text
https://training.synopsys.com
Register for a Class
Download Labs
```

SolvNetPlus:

```text
https://solvnetplus.synopsys.com
Tool Documentation and Support Articles
Product Update and Methodology Information / Training
Open a Support Case (Support Center)
```

Other Technical Resources:

```text
Synopsys Users Group (SNUG)
Application Consultants
Synopsys Professional Services
```

### Interpretação

Este slide resume os canais de suporte.

Para o estudo do curso, os principais são:

```text
training.synopsys.com
solvnetplus.synopsys.com
SNUG
Support Center
```

---

# Parte 11 — Referência de comandos úteis de reporting

## Slide 26 — Reference — Useful Reporting Commands

### Texto extraído

Título:

```text
Reference — Useful Reporting Commands
```

Tabela:

| Command | Purpose |
|---|---|
| `check_mv_design` | Perform multivoltage, PG connectivity and UPF intent checks |
| `report_cell -power` | Report the power net connection of a cell |
| `report_mv_cells` | Report isolation, level shifter, retention, AO-BUFF/INV/TIE cells in the design |
| `report_mv_lib_cells` | Report isolation, level shifter, retention, AO-BUFF/INV/TIE cells in the design. Use this command to report the PG pin topology of the library cell |
| `report_lib_pins` | Report details on the pins of a library cell |
| `report_supply_ports|nets|sets` | Report details about supply nets/sets and supply ports |
| `report_pst` | Report the power state table details of a supply net |
| `report_mv_path` | Report paths with multivoltage constraints and power management cell insertion/association |
| `report_mv_design` | Report multivoltage QoR of the design |
| `report_power_domains` | Report information on specific power domains |
| `report_pvt` | Report PVT information of your design |
| `check_bufferability` | Check how buffers can be inserted in a specific net |

### Interpretação

Este slide é a tabela de referência do módulo.

A tabela pode ser vista como um mapa de debug.

## Se a pergunta é “existe violação?”

Use:

```tcl
check_mv_design
```

## Se a pergunta é “como esta célula está alimentada?”

Use:

```tcl
report_cell -power
```

## Se a pergunta é “qual PM cell foi inserida e por qual strategy?”

Use:

```tcl
report_mv_cells
```

## Se a pergunta é “a library cell está modelada corretamente?”

Use:

```tcl
report_mv_lib_cells
report_lib_pins
```

## Se a pergunta é “as supplies/power states explicam a violação?”

Use:

```tcl
report_pst
report_supply_ports
report_supply_nets
report_supply_sets
```

## Se a pergunta é “qual caminho multivoltage está sendo afetado?”

Use:

```tcl
report_mv_path
```

## Se a pergunta é “o domínio da célula está correto?”

Use:

```tcl
report_power_domains
```

## Se a pergunta é “há mismatch de operating conditions?”

Use:

```tcl
report_pvt
```

## Se a pergunta é “por que não dá para inserir buffer?”

Use:

```tcl
check_bufferability
```

---

# Aula didática desenvolvida

## 1. O debug de UPF começa em `check_mv_design`, mas não termina nele

`check_mv_design` é o detector. Ele aponta violações e categorias.

Mas para entender a causa, você precisa combinar outros comandos:

```text
report_cell -power
get_related_supply_set
report_pst
report_mv_cells
report_power_domains
report_pvt
check_bufferability
```

## 2. Sempre investigue em camadas

Uma violação entre `U1` e `U2` pode ter várias causas:

```text
source e sink têm tensões diferentes
falta level shifter
source pode desligar enquanto sink fica ON
falta isolation
a cell foi colocada no power domain errado
a supply default está errada
a PST/PSG tem estado inconsistente
a biblioteca modela PG pins incorretamente
há mismatch de PVT/corner
```

Por isso, o debug deve ir em camadas.

## 3. Conectividade de célula é a primeira prova concreta

Antes de interpretar teoricamente, veja como a célula está realmente conectada:

```tcl
report_cell U1 -power
get_related_supply_set [get_pins U1/Y]
get_related_supply_set [get_pins U2/A]
```

Isso confirma se a violação faz sentido.

## 4. A PST/PSG explica quando a violação ocorre

Depois de saber as supplies envolvidas, use:

```tcl
report_pst -supplies {VDD VDD_2} -derived -voltage_type all
```

Isso mostra se as supplies:

- têm tensões diferentes;
- têm relação always-on diferente;
- têm estados incompatíveis;
- exigem LS ou ISO.

## 5. `report_mv_cells` explica a célula inserida

Quando a ferramenta insere ISO/LS/RET/ELS, o comando mais direto é:

```tcl
report_mv_cells <cell> -verbose
```

Ele mostra:

- strategy;
- location;
- clamp;
- sense;
- supplies;
- associated pin/port;
- library cell.

## 6. `report_mv_lib_cells` valida a biblioteca por trás da célula

Se a instância parece certa, mas o comportamento parece errado, investigue a library cell:

```tcl
report_mv_lib_cells [get_lib_cells -of_objects ELS]
```

Isso mostra PG pins, signal pins e operating conditions.

## 7. Power domain errado causa supply errada

Se uma célula pertence ao domínio errado, ela pode herdar a supply errada.

Use:

```tcl
report_power_domains [get_power_domains -of_objects [get_cells $cell]]
```

Isso mostra:

- domain;
- voltage area;
- available supplies;
- default supplies;
- strategies associadas.

## 8. PVT mismatch pode afetar PM insertion

Operating conditions erradas não afetam só timing/power. Elas podem afetar também a escolha e inserção de PM cells.

Use:

```tcl
report_pvt -mismatched
```

para ver diferenças entre valores especificados e valores efetivos vindos da biblioteca.

## 9. Buffer insertion em UPF depende de supplies e bias

Em design multivoltage, inserir buffer depende de:

- power domain;
- supply;
- voltage area;
- library cells;
- bias/well;
- constraints.

Use:

```tcl
check_bufferability -nets n
```

e, se necessário:

```tcl
check_bufferability -nets n -verbose
```

---

# Fluxos de debug recomendados

## Debug de voltage level violation

```text
1. Rodar check_mv_design.
2. Identificar células/pinos envolvidos.
3. Rodar report_cell <cell> -power.
4. Rodar get_related_supply_set nos pinos source/sink.
5. Rodar report_pst nas supplies envolvidas.
6. Verificar se há LS strategy aplicável.
7. Verificar report_mv_cells se LS foi inserido.
8. Verificar report_mv_lib_cells se a library cell está correta.
```

## Debug de off-to-on violation

```text
1. Rodar check_mv_design.
2. Identificar source que pode desligar e sink que fica ON.
3. Usar report_pst para confirmar estados ON/OFF.
4. Verificar isolation strategy.
5. Rodar create_mv_cells para ver se ISO é inferida.
6. Rodar report_mv_cells na ISO, se inserida.
7. Conferir clamp, sense, supply e location.
```

## Debug de always-on violation

```text
1. Rodar check_mv_design.
2. Identificar cell que deveria estar em supply mais always-on.
3. Usar report_cell -power.
4. Usar report_power_domains para confirmar domínio.
5. Usar report_pst para comparar relative always-on.
6. Conferir default_isolation/default_retention/AO supplies.
```

## Debug de power management cell inesperada

```text
1. Rodar report_mv_cells <cell> -verbose.
2. Verificar strategy associada.
3. Verificar location e applies_to.
4. Conferir input/output supplies.
5. Conferir library cell.
6. Usar report_mv_lib_cells na library cell.
7. Voltar ao UPF e revisar strategy.
```

## Debug de PVT/corner

```text
1. Rodar report_pvt.
2. Rodar report_pvt -mismatched.
3. Comparar specified value e effective value.
4. Conferir SDC/corners/libs.
5. Verificar se PM insertion depende de operating condition afetada.
```

## Debug de bufferability

```text
1. Rodar check_bufferability -nets <net>.
2. Se necessário, rodar com -verbose.
3. Verificar supply usada para buffering.
4. Verificar buffers/inverters disponíveis.
5. Verificar bias/well analysis.
6. Restringir com -voltage_area se necessário.
7. Corrigir constraints/supplies/libs.
```

---

# Conceitos difíceis explicados em profundidade

## Power management cell association

Associação entre uma célula PM existente/inserida e a strategy UPF que a justifica.

Exemplo:

```text
uma ISO instanciada precisa estar associada a uma set_isolation strategy.
```

## Off-to-on violation

Violação em que um sinal vindo de domínio OFF pode alcançar lógica que está ON. Normalmente exige isolation.

## Voltage level violation

Violação em que source e sink operam com tensões incompatíveis. Normalmente exige level shifter.

## Always-on violation

Violação em que uma célula deveria estar alimentada por uma supply mais always-on do que a supply atual.

## PG connectivity

Conectividade de power/ground entre cells, PG pins, supply nets, supply sets e power domains.

## Operand mismatch

Categoria de inconsistência em checagens multivoltage, normalmente relacionada a operandos/expressões incompatíveis no power intent ou análise.

## PVT mismatch

Diferença entre valores PVT especificados por constraints e valores efetivos vindos da biblioteca/corner.

## Bufferability

Capacidade de inserir buffer/inverter em uma net considerando supplies, voltage area, bias, operating conditions, library cells e constraints.

---

# Comandos importantes do módulo

## Commit UPF

```tcl
commit_upf
```

## Criar MV cells

```tcl
create_mv_cells
create_mv_cells -mapped
```

## Checar design multivoltage

```tcl
check_mv_design
```

## Reportar power connectivity da célula

```tcl
report_cell $cell -power
```

Exemplo:

```tcl
report_cell U1 -power
```

## Related supplies de pinos/portas

```tcl
get_related_supply_nets -objects $name_or_collection_of_pins_or_ports
get_related_supply_set  -objects $name_or_collection_of_pins_or_ports
```

Exemplos:

```tcl
get_related_supply_nets [get_pins U1/Y]
get_related_supply_set  [get_pins U1/Y]

get_related_supply_nets [get_pins U2/A]
get_related_supply_set  [get_pins U2/A]
```

## Reportar PST

```tcl
report_pst -supplies {VDD VDD_2} -derived -voltage_type all
```

## Reportar MV cells

```tcl
report_mv_cells $cell
report_mv_cells ISO -verbose -isolation
```

Filtros:

```tcl
report_mv_cells -level_shifter
report_mv_cells -enable_level_shifter
report_mv_cells -isolation
report_mv_cells -repeater
report_mv_cells -retention
report_mv_cells -retention_clamp
report_mv_cells -always_on
report_mv_cells -power_strategy
```

## Obter library cell associada

```tcl
get_lib_cells -of_objects ELS
```

## Reportar MV library cells

```tcl
report_mv_lib_cells [get_lib_cells -of_objects ELS]
```

## Obter power domain de uma célula

```tcl
get_power_domains -of_objects [get_cells $cell]
```

## Reportar power domain de uma célula

```tcl
report_power_domains [get_power_domains -of_objects [get_cells $cell]]
```

## Reportar PVT

```tcl
report_pvt
report_pvt -mismatched
```

Sintaxe mostrada:

```tcl
report_pvt \
    [-object_list objects] \
    [-mismatched] \
    [-nosplit] \
    [-significant_digits digits] \
    [corner_list]
```

## Checar bufferability

```tcl
check_bufferability -nets n
```

Opções citadas:

```tcl
check_bufferability -nets n -verbose
check_bufferability -nets n -voltage_area <voltage_area>
```

---

# Tabelas de revisão

## Comandos por objetivo

| Objetivo | Comando |
|---|---|
| Commitar power intent | `commit_upf` |
| Inserir/verificar MV cells cedo | `create_mv_cells` |
| Checar violações MV/UPF/PG | `check_mv_design` |
| Ver supplies de uma célula | `report_cell -power` |
| Ver supply net de pino/porta | `get_related_supply_nets` |
| Ver supply set de pino/porta | `get_related_supply_set` |
| Ver PST de supplies | `report_pst -supplies` |
| Ver instância PM cell | `report_mv_cells` |
| Ver library cell PM | `report_mv_lib_cells` |
| Ver domínio da célula | `get_power_domains -of_objects` |
| Reportar domínio | `report_power_domains` |
| Ver PVT/corner | `report_pvt` |
| Checar inserção de buffer | `check_bufferability` |

---

## Categorias de violação em `check_mv_design`

| Categoria | Possível causa |
|---|---|
| Off-to-on violations | Falta ISO ou power states mal definidos |
| Voltage level violations | Falta LS ou PST/voltage mismatch |
| Always-on violations | Célula deveria usar supply mais always-on |
| Power management cell association | PM cell não associada à strategy correta |
| PG net connectivity | Power/ground conectados incorretamente |
| Operand mismatches | Inconsistência em expressions/constraints |
| Power domain rule | Domínio mal definido ou strategy fora do domínio |

---

## Reports de células

| Comando | Mostra |
|---|---|
| `report_cell $cell -power` | PG pins e supplies da célula |
| `report_mv_cells $cell -verbose` | PM strategy, location, supplies, library cell |
| `report_mv_lib_cells <lib_cell>` | Atributos e PG topology da library cell |
| `report_lib_pins` | Detalhes de pinos da library cell |

---

## PVT report

| Campo | Significado |
|---|---|
| Specified Value | Valor definido por constraints do usuário |
| Effective Value | Valor efetivo vindo da biblioteca/dados carregados |
| Source | Origem da informação |
| Early/Late values | Valores por tipo de análise |
| Pane number | Painel/corner real usado pela tool |

---

## Bufferability

| Pergunta | O que olhar |
|---|---|
| Qual supply será usada? | Primary supplies e supply nets do report |
| Há buffers/inverters disponíveis? | Summary de células disponíveis |
| Por que célula foi rejeitada? | `-verbose` |
| Há restrição de voltage area? | `-voltage_area` |
| Há problema de bias/well? | Bias analysis |
| Há constraints impedindo? | design constraints no report |

---

# Figuras e diagramas importantes

## Página 1 — UPF Flow Overview

Mostra o fluxo `Load UPF → create_mv_cells → initial_map → logic_opto → insert_dft → initial_place`, com inserção de células multivoltage. A segunda figura lista perguntas de debug: correção elétrica, mapeamento de MV cells, operating conditions e necessidade de investigação.

## Página 2 — `commit_upf`

Mostra `load_upf → commit_upf → create_mv_cells` e destaca três funções: encontrar constraints incompletas, resolver conflitos DEF/UPF e fazer checagens básicas. O exemplo mostra warnings de retention mapping, contagem de PM cells e conflitos resolvidos.

## Página 3 — `create_mv_cells`

Mostra `create_mv_cells [-mapped]` como comando opcional para inserir LS/ISO/RET e validar power intent. A segunda figura mostra o loop `edit your UPF` após `check_mv_design`.

## Página 4 — `check_mv_design` e conectividade

Mostra as categorias de checagem: off-to-on, always-on, voltage level, PG net connectivity, operand mismatches e PM cell association. Em seguida, mostra os comandos para reportar related supply nets/sets e `report_cell -power`.

## Página 5 — Exemplo de conectividade e supplies

Mostra violação entre `U1` e `U2`, usando `report_cell U1 -power`, `get_related_supply_nets/set` em `U1/Y` e `U2/A`. O segundo slide mostra `report_pst -supplies {VDD VDD_2}` para comparar estados da PST.

## Página 6 — `report_mv_cells`

Mostra `report_mv_cells $cell` e filtros por tipo de PM cell. O exemplo com `ISO` reporta clamp, sense, location, strategy, supplies e library cell.

## Página 7 — `report_mv_lib_cells` e power domains

Mostra como obter library cell de uma ELS e reportar seus atributos/PG pins. O segundo slide mostra como obter e reportar o power domain de uma célula.

## Página 8 — Power domain report e PVT

O primeiro slide mostra available supply nets/sets, supply handles e strategies dentro de um power domain. O segundo explica `report_pvt` e PVT mismatch.

## Página 9 — `report_pvt -mismatched` e `check_bufferability`

Mostra specified vs effective values e fontes. O segundo slide introduz `check_bufferability` para investigar se uma net pode receber buffers.

## Página 10 — Bufferability example e suporte

Mostra `check_bufferability -nets n`, summary de buffers/inverters, bias analysis, `-verbose` e `-voltage_area`. O segundo slide lista recursos de suporte Synopsys.

## Páginas 11-12 — SolvNetPlus, registration, Support Center e recursos técnicos

Mostram canais oficiais para treinamento, documentação, casos de suporte, SNUG e consultoria.

## Página 13 — Summary e comandos de referência

Mostra o resumo de suporte e uma tabela final com comandos úteis de reporting.

---

# Pontos de prova e revisão

1. `create_mv_cells` é opcional e serve para checar como o power intent é aplicado.
2. A inserção de multivoltage cells ocorre em `initial_map` e `initial_place`.
3. `initial_place` só insere PM cells se `insert_dft` já foi executado.
4. `commit_upf` indica que o UPF intent está completo e finalizado.
5. `commit_upf` é autoexecutado por `compile_fusion` e `create_mv_cells`.
6. `commit_upf` checa referências de objetos UPF.
7. `commit_upf` checa primary power/ground.
8. `commit_upf` checa associação de strategies para PM cells instanciadas.
9. `commit_upf` checa power domain-voltage area correspondence.
10. `commit_upf` verifica se library cells de mapping podem ser usadas.
11. `commit_upf` pode resolver conflitos PG entre DEF e UPF.
12. Resolução DEF/UPF só ocorre se DEF foi carregado antes de `commit_upf`.
13. Log de `commit_upf` pode mostrar library cells inadequadas para retention mapping.
14. Log de `commit_upf` mostra contagem de PM cells já presentes.
15. `create_mv_cells [-mapped]` insere LS, ISO e retention cells com base no UPF.
16. Por default, `create_mv_cells` não mapeia para library cells.
17. Com `-mapped`, PM cells são mapeadas para bibliotecas carregadas.
18. `create_mv_cells` é útil para UPF authoring.
19. `create_mv_cells` ajuda a ver quantas PM cells foram inseridas.
20. `create_mv_cells` ajuda a descobrir por que algumas PM cells não foram inseridas.
21. `check_mv_design` executa checks multivoltage, PG connectivity e UPF intent.
22. `check_mv_design` garante correção elétrica do design.
23. `check_mv_design` captura violações de multivoltage.
24. Opções de checker podem ser combinadas para ajustar o detalhe do relatório.
25. `check_mv_design` pode reportar off-to-on violations.
26. `check_mv_design` pode reportar voltage level violations.
27. `check_mv_design` pode reportar always-on violations.
28. `check_mv_design` pode reportar power management cell association.
29. `check_mv_design` pode reportar PG net connectivity.
30. `get_related_supply_nets` reporta supply nets relacionadas a pinos/portas.
31. `get_related_supply_set` reporta supply set relacionado a pinos/portas.
32. `report_cell $cell -power` reporta conexão de power da célula.
33. Para violação entre `U1` e `U2`, verificar `U1/Y` e `U2/A` ajuda a comparar source/sink supplies.
34. `report_pst -supplies` compara estados das supplies envolvidas.
35. `report_pst` ajuda a ver diferença de tensão e relação always-on.
36. `report_mv_cells` reporta células PM inseridas.
37. `report_mv_cells -isolation` filtra isolation cells.
38. `report_mv_cells -level_shifter` filtra level shifters.
39. `report_mv_cells -retention` filtra retention cells.
40. `report_mv_cells -always_on` filtra AO buffers/inverters/tie cells.
41. `report_mv_cells -verbose` imprime informações extras.
42. `report_mv_cells` pode mostrar strategy que inseriu a célula.
43. `report_mv_cells` pode mostrar clamp, sense, location e supplies de uma ISO.
44. `report_mv_lib_cells` reporta informações da library cell MV.
45. `get_lib_cells -of_objects ELS` obtém a lib cell associada a uma instância.
46. `report_mv_lib_cells [get_lib_cells -of_objects ELS]` combina instância e library report.
47. `report_mv_lib_cells` mostra signal pins com relação a PG pins.
48. `report_power_domains` reporta informações de power domains específicos.
49. `get_power_domains -of_objects [get_cells $cell]` obtém o power domain de uma célula.
50. `report_power_domains [get_power_domains -of_objects [get_cells $cell]]` reporta o domínio da célula.
51. Power domain report mostra available supply nets e supply sets.
52. Power domain report mostra handles de supply.
53. Power domain report mostra details de strategies definidas no domínio.
54. PVT mismatch pode gerar cálculo errado de delay e power.
55. PVT mismatch pode fazer a tool linkar painel incorreto da biblioteca.
56. `report_pvt` checa operating conditions.
57. `report_pvt` mostra valores especificados e efetivos.
58. `report_pvt -mismatched` foca em divergências.
59. PM cell insertion pode ser afetada por PVT mismatches.
60. `check_bufferability` investiga se um buffer pode ser inserido em uma net.
61. `check_bufferability` mostra qual supply será usada para buffering.
62. `check_bufferability` avalia single/dual rail e insulated bias buffers.
63. `check_bufferability` mostra buffers/inverters disponíveis.
64. `check_bufferability -verbose` mostra library-cell-based report.
65. `check_bufferability -voltage_area` restringe análise a uma voltage area.
66. SolvNetPlus oferece documentação, artigos, Q&A, scripts, tool tips e casos de suporte.
67. Support Center pode oferecer debug remoto/interativo.
68. A tabela final lista `check_mv_design`, `report_cell -power`, `report_mv_cells`, `report_mv_lib_cells`, `report_lib_pins`, `report_supply_ports|nets|sets`, `report_pst`, `report_mv_path`, `report_mv_design`, `report_power_domains`, `report_pvt` e `check_bufferability`.

---

# Relação com os módulos anteriores

## Com Power Domains

`report_power_domains` confirma se a célula está no domínio esperado e quais supplies/strategies estão associadas.

## Com Power Strategies

`report_mv_cells` mostra qual strategy gerou ISO/LS/RET/ELS e como ela foi implementada.

## Com Supply Network

`report_cell -power`, `get_related_supply_nets`, `get_related_supply_set` e reports de supply mostram a conectividade real das supplies.

## Com Power States

`report_pst` mostra os estados das supplies e explica voltage/off-to-on/always-on violations.

## Com Fusion Compiler and UPF

Este módulo aprofunda os reports usados depois de `load_upf`, `commit_upf`, `create_mv_cells`, `check_mv_design` e `compile_fusion`.

---

# Checklist prático para debug em Fusion Compiler Reporting

```text
1. Rode commit_upf e leia warnings.
2. Rode create_mv_cells para validar strategies cedo.
3. Rode check_mv_design para coletar violações.
4. Classifique a violação: off-to-on, voltage level, always-on, PG connectivity etc.
5. Use report_cell -power nas células envolvidas.
6. Use get_related_supply_set nos pinos source/sink.
7. Use report_pst nas supplies envolvidas.
8. Se houver PM cell, use report_mv_cells -verbose.
9. Se houver dúvida de library, use report_mv_lib_cells.
10. Se a supply/domínio parecer errado, use report_power_domains.
11. Se houver corner/OC estranho, use report_pvt -mismatched.
12. Se buffer não entra, use check_bufferability.
13. Corrija UPF, libraries, constraints, PVT ou power domain definitions conforme a causa.
14. Rode check_mv_design novamente.
```

---

# Checklist de qualidade

- [x] Bloco 088 processado conforme roteiro, slides 1-26.
- [x] O módulo foi processado inteiro, pois o roteiro indica 26 slides.
- [x] UPF Flow Overview foi explicado.
- [x] `commit_upf` foi detalhado com checagens e interpretação de log.
- [x] `create_mv_cells` foi explicado como ferramenta de autoria/debug.
- [x] `check_mv_design` foi explicado com categorias de violação.
- [x] Reports de conectividade de célula foram explicados.
- [x] `report_pst` foi conectado ao debug de supplies.
- [x] `report_mv_cells` e `report_mv_lib_cells` foram detalhados.
- [x] `report_power_domains` foi explicado.
- [x] `report_pvt` e `-mismatched` foram explicados.
- [x] `check_bufferability` foi explicado com opções.
- [x] Recursos de suporte Synopsys foram resumidos.
- [x] Tabela final de comandos úteis foi organizada.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 089
- **Curso:** 12 Design Compiler NXT — Low Power
- **Aula:** 01 Introduction
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\01 Introduction.docx
```

- **Processar:** conferir no roteiro/anexo a faixa exata de slides antes de processar.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\01 Introduction.md
```
