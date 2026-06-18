# 01 Fusion Compiler Synthesis and Design Implementation Jumpstart — parte A

## Controle do bloco

- **Bloco:** 076
- **Curso:** 10 Fusion Compiler Synthesis and Design Implementation Jumpstart
- **Aula:** 01 Fusion Compiler Synthesis and Design Implementation Jumpstart — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart.docx`
- **Faixa processada conforme roteiro:** slides 1-20
- **Observação sobre o anexo:** o DOCX contém prints de slides em imagem. O texto foi extraído visualmente das páginas renderizadas, cobrindo da agenda inicial até o carregamento de floorplan via DEF.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart_parte_A.md
```

---

## Resumo executivo

Esta primeira parte inicia o curso de **Fusion Compiler Synthesis and Design Implementation Jumpstart**. A aula apresenta o Fusion Compiler como uma solução integrada **RTL-to-GDSII** (do RTL até o GDSII), unificando síntese lógica, otimização física, floorplanning, análise de múltiplos cenários, bibliotecas físicas/lógicas e preparação para implementação.

A grande diferença em relação a fluxos tradicionais é que o Fusion Compiler não é apenas um substituto do Design Compiler. Ele integra recursos de síntese com otimização física baseada no mecanismo do IC Compiler II. Por isso, desde cedo, o fluxo precisa carregar bibliotecas físicas/lógicas, tecnologia, floorplan e power intent. A síntese deixa de ser puramente lógica e passa a ser física desde as etapas iniciais.

A parte A cobre:

1. Agenda geral do curso.
2. Visão do Fusion Compiler como sistema único RTL-to-GDSII.
3. Novo data model do Fusion Compiler.
4. Diferença entre formatos antigos `.db`/Milkyway e o modelo NDM/CLIB.
5. Como controlar comportamento da ferramenta por application options.
6. Como invocar o Fusion Compiler.
7. Visão geral da GUI e principais views.
8. Criação da design library.
9. Leitura do RTL e criação do block.
10. Comandos `analyze`, `elaborate` e `set_top_module`.
11. Design Mismatch Manager.
12. Bibliotecas NDM/CLIBs.
13. Fontes de library/technology data.
14. UPF e power intent.
15. Comandos de design multi-voltage.
16. Floorplan/physical constraints.
17. Carregamento de floorplan gerado por Fusion Compiler/ICC II Design Planning.
18. Carregamento de floorplan via DEF.

A mensagem central da parte A é: **no Fusion Compiler, o projeto é criado dentro de uma design library física/lógica, usando CLIBs/NDM, tech file, RC models, RTL elaborado em block, power intent e floorplan físico.** O fluxo é muito mais integrado do que uma síntese lógica tradicional.

---

## Texto extraído e organizado por slide

### Slide 1 — Agenda

Texto extraído da agenda:

```text
Introduction
Design Setup and Reading RTL Design
NDMs/CLIBs
Floorplan and UPF data
Compile Flow
Timing Setup and CCD
Power Optimization
Design Implementation
Top Level Synthesis
```

Interpretação:

A agenda mostra que o curso não é apenas sobre síntese RTL. Ele cobre um fluxo completo de implementação física:

1. Introdução ao Fusion Compiler.
2. Preparação do design.
3. Bibliotecas NDM/CLIB.
4. Floorplan e UPF.
5. Fluxo de compile.
6. Timing setup e CCD.
7. Otimização de potência.
8. Implementação física.
9. Síntese top-level.

O ponto importante é que o Fusion Compiler trabalha de forma integrada: desde a leitura do RTL, já há preocupação com bibliotecas físicas, floorplan, power intent, modos/corners e implementação.

---

### Slide 2 — Fusion Compiler: Complete RTL-to-GDSII Solution

Texto extraído:

```text
Fusion Compiler: Complete RTL-to-GDSII Solution
```

Pontos destacados:

```text
Single Cockpit RTL-to-GDSII System
>1M RTL-to-GDSII Instances/Day
>3X Faster Synthesis
20% Better Timing QoR
10-15% Lower Power
5% Smaller Area
```

Rodapé:

```text
Best PPA. Most Predictable Flow. Fastest Time-to-Results
```

Interpretação:

O slide apresenta o Fusion Compiler como uma solução integrada do RTL até GDSII. A palavra **single cockpit** indica que a ferramenta busca concentrar em um ambiente único várias etapas que antes ficavam distribuídas entre ferramentas diferentes.

Promessas apresentadas:

- maior capacidade;
- síntese mais rápida;
- melhor timing QoR;
- menor potência;
- menor área;
- fluxo mais previsível.

O termo **PPA** significa:

```text
Power, Performance, Area
```

A ideia é melhorar simultaneamente potência, desempenho/timing e área por meio de um fluxo unificado.

---

### Slide 3 — Fusion Compiler

Texto extraído:

```text
Fusion Compiler combines new synthesis technologies with the physical optimization of IC Compiler II
```

```text
Fusion Compiler's data model is designed to handle all aspects of modern chips
```

Subitem:

```text
Uses the same data model from synthesis to final sign-off as in IC Compiler II
```

```text
Consistent tool control with IC Compiler II
```

Figura:

```text
New Data Model
Multi View
Multi Thread
Multi Hier
Multi Mode
Multi Voltage
```

Interpretação:

Este slide explica a base arquitetural do Fusion Compiler.

O Fusion Compiler combina:

```text
novas tecnologias de síntese
+
otimização física do IC Compiler II
```

O data model é preparado para chips modernos:

- **Multi View:** múltiplas visões de library/timing/physical.
- **Multi Thread:** execução paralela.
- **Multi Hier:** suporte a hierarquia.
- **Multi Mode:** múltiplos modos funcionais/teste/baixo consumo.
- **Multi Voltage:** múltiplos domínios de tensão/power intent.

A parte mais importante:

```text
O Fusion Compiler usa o mesmo data model desde síntese até signoff, alinhado ao IC Compiler II.
```

Isso reduz inconsistências entre ferramentas e torna o fluxo mais previsível.

---

### Slide 4 — Logic and Physical Cell Library Data

Texto extraído:

```text
Design Compiler traditionally uses Liberty db and Milkyway formats for logic and physical cell libraries, respectively
```

```text
FC uses NDM format which combines all logic and physical cell data
```

```text
For ease-of-use the user has the choice to provide FC with:
```

```text
Fully pre-assembled NDM cell libraries or CLIBs (same ones used in ICC II)
```

```text
Liberty db logic libraries plus .frame NDM physical libraries
```

Subitem:

```text
FC automatically combines logic and physical models into NDM CLIBs
```

Figura:

```text
Technology file
Frame NDM
pvt1.db
pvt2.db
pvt3.db
pvt4.db
```

```text
.db + .frame + tech file are provided by the library vendor/group
```

```text
NDM CLIB automatically generated by FC
```

Interpretação:

Aqui aparece uma mudança essencial de formato de biblioteca.

No fluxo tradicional:

```text
Design Compiler → Liberty .db para lógica/timing
IC Compiler/Milkyway → dados físicos separados
```

No Fusion Compiler:

```text
NDM/CLIB combina dados lógicos e físicos
```

Isso é necessário porque o FC faz síntese física. Ele precisa conhecer simultaneamente:

- timing;
- potência;
- área;
- geometria física;
- pins;
- abstracts;
- tecnologia;
- dados de roteamento/placement.

O usuário pode fornecer:

1. CLIBs já prontas em NDM.
2. Ou `.db` + `.frame` + tech file, para o FC montar a CLIB.

---

### Slide 5 — Controlling Tool Behavior

Texto extraído:

```text
Design Compiler uses non-persistent application variables to control various tool behaviors
```

```text
Fusion Compiler uses application options to control tool behavior, organized by functional categories, for example:
```

Categorias:

```text
compile: Controls the flow and other aspects of compile_fusion
opt:     Controls specific optimization engines
place:   Controls coarse placement and legalization
time:    Controls timing analysis
...
```

Outros pontos:

```text
Most settings are saved with the design and restored automatically when reloaded
```

```text
Consistent with ICC II application option settings
```

Interpretação:

No Design Compiler, muitas configurações são application variables não persistentes. No Fusion Compiler, o controle é feito por **application options** organizadas por categorias.

Exemplos:

- `compile.*`: comportamento do `compile_fusion`.
- `opt.*`: engines de otimização.
- `place.*`: placement e legalization.
- `time.*`: análise temporal.

A diferença importante é que muitas opções ficam salvas com o design e são restauradas automaticamente ao recarregar. Isso reduz risco de inconsistência entre sessões.

---

### Slide 6 — Invoking Fusion Compiler

Texto extraído:

Opção 1 — iniciar GUI diretamente:

```tcl
unix% fc_shell -gui
```

Opção 2 — iniciar shell e abrir/fechar GUI conforme necessário:

```tcl
unix% fc_shell
fc_shell> gui_start
...
fc_shell> gui_stop
```

Opção 3 — modo batch:

```tcl
unix% fc_shell -f RUN.tcl | tee RUN.log
```

Interpretação:

O Fusion Compiler pode ser usado em três modos:

#### 1. GUI direta

```tcl
fc_shell -gui
```

Útil para exploração visual, debug, inspeção de floorplan/layout e uso interativo.

#### 2. Shell com GUI sob demanda

```tcl
fc_shell
gui_start
gui_stop
```

Útil quando o fluxo principal é por comandos, mas ocasionalmente é necessário abrir a GUI.

#### 3. Batch mode

```tcl
fc_shell -f RUN.tcl | tee RUN.log
```

Usado em regressões, scripts de fluxo e execução reprodutível.

O uso de `tee RUN.log` salva o transcript enquanto mostra a saída no terminal.

---

### Slide 7 — Fusion Compiler GUI

A figura mostra a interface principal do Fusion Compiler com marcações:

```text
Menus Commands
Logical hierarchy view
Layout view window
Command Search
Visibility and Selection control
```

Caixa de Command Search:

```text
Example: List menus, commands and options related to 'compile'
You can also run the commands from right here or pull up a dialog for setting application options.
```

Interpretação:

A GUI do Fusion Compiler combina visão lógica e física do design.

Elementos importantes:

- **Menus/Commands:** acesso aos comandos da ferramenta.
- **Logical hierarchy view:** navegação pela hierarquia lógica.
- **Layout view window:** visualização física do layout/floorplan.
- **Command Search:** busca de comandos, menus e options.
- **Visibility and Selection control:** controle de visualização e seleção de objetos.

A Command Search é útil para aprendizagem e produtividade: o usuário pode procurar comandos relacionados a `compile`, abrir diálogos de opções ou executar comandos diretamente.

---

### Slide 8 — GUI Views

Views listadas:

```text
Hierarchy Browser
Schematic View
Layout View
Path Inspector View
UPF Diagram View
Supply Network View
```

Interpretação:

A GUI oferece várias visões complementares:

#### Hierarchy Browser

Mostra hierarquia lógica do design, módulos, instâncias e objetos.

#### Schematic View

Mostra conexões lógicas e estruturais.

#### Layout View

Mostra o aspecto físico: células, macros, regiões, roteamento/floorplan.

#### Path Inspector View

Usado para inspeção de caminhos de timing, atraso, slack e estágios.

#### UPF Diagram View

Mostra domínios de potência, relações de power intent e estruturas UPF.

#### Supply Network View

Mostra rede de alimentação, power grid e conexões de supply.

Essa combinação mostra o caráter físico-lógico do Fusion Compiler.

---

## Design Setup and Reading RTL Design

### Slide 9 — Creating the Design Library

Texto extraído:

```text
The design library acts as a container
```

Subitens:

```text
Holds your complete design data → block(s)
  Netlist, constraints, floorplan data, layout, settings, etc.
Contains the techfile data (.tf file)
Points to your logic+physical reference cell libraries (→ CLIBs)
Contains or points to RC models (nxtgrd or TLUPlus)
```

Criação:

```text
Create a design library
Specify the technology and cell libraries
Created in memory only (by default)
```

Comandos extraídos:

```tcl
lappend search_path /x/y/clibs

create_lib orca.dlib \
  -technology abc14_9m.tf \
  -ref_libs {abc14_std.ndm abc14_sram.ndm abc14_ip.ndm}
```

Interpretação:

A **design library** é o container do projeto no Fusion Compiler. Ela armazena ou referencia:

- blocos do design;
- netlist;
- constraints;
- floorplan;
- layout;
- settings;
- tech file;
- CLIBs;
- RC models.

O comando:

```tcl
create_lib
```

cria a library do design. No exemplo:

```tcl
orca.dlib
```

é a design library.

As opções principais são:

- `-technology`: arquivo tecnológico `.tf`;
- `-ref_libs`: bibliotecas de referência NDM/CLIB.

Por padrão, a design library é criada apenas em memória. Para persistir em disco, normalmente é necessário salvar explicitamente.

---

### Slide 10 — Read the RTL and Create a Block

Comandos extraídos:

```tcl
analyze -f sverilog "RTL1 RTL2 ..."
elaborate orca
set_top_module orca
```

Figura:

```text
Design Library
orca.dlib
```

```text
BLOCK
orca.dlib:orca.design
```

Caixa:

```text
Design view of the block, created after set_top_module
```

Interpretação:

O fluxo de leitura do RTL é:

1. Analisar os arquivos RTL:

```tcl
analyze -f sverilog "RTL1 RTL2 ..."
```

2. Elaborar o design:

```tcl
elaborate orca
```

3. Definir o top module:

```tcl
set_top_module orca
```

Depois de `set_top_module`, o Fusion Compiler cria uma **design view** do bloco dentro da design library:

```text
orca.dlib:orca.design
```

Esse bloco passa a ser o objeto principal do fluxo. Ele está dentro da design library e conectado às bibliotecas de referência.

---

### Slide 11 — Analyze the RTL Syntax

Comandos extraídos:

```tcl
analyze -format verilog "rtl/orca.v rtl/pci.v ..."
analyze -format vhdl counter.vhd
analyze -vcs "-f orca.vcs"
```

Texto:

```text
The analyze command analyzes the RTL syntax of Verilog, SystemVerilog or VHDL files
```

Subitens:

```text
RTL files do not have to be the same format
Creates intermediate template results which are saved on disk at HDL_LIBRARIES/WORK, by default
```

Texto:

```text
Allows the use of the same file list used for VCS
Options not supported by Fusion Compiler are ignored
```

Nota:

```text
The read_verilog command cannot be used to read RTL
```

Interpretação:

O comando `analyze` faz a análise sintática do RTL. Ele aceita:

- Verilog;
- SystemVerilog;
- VHDL.

Os arquivos não precisam estar todos no mesmo formato. O Fusion Compiler cria resultados intermediários de template, salvos por padrão em:

```text
HDL_LIBRARIES/WORK
```

Uma facilidade importante é:

```tcl
analyze -vcs "-f orca.vcs"
```

Isso permite reaproveitar uma filelist usada no VCS. Opções que o Fusion Compiler não suporta são ignoradas.

Ponto de prova:

```text
No Fusion Compiler, não se usa read_verilog para ler RTL.
Use analyze/elaborate/set_top_module.
```

---

### Slide 12 — Create a Linked “Top” Block

Comandos extraídos:

```tcl
elaborate orca
set_top_module orca
```

Texto:

```text
elaborate builds wgtech modules for the specified "top" and its sub-modules
```

Texto sobre `set_top_module`:

```text
Links the specified "top" module to its sub-modules and CLIB cells
Creates a block for the "top" module in the current design library
```

Texto:

```text
It is required to run both commands!
```

Comandos de consulta:

```tcl
get_blocks
{orca.dlib:orca.design}

get_modules
{orca risc_core alu ... prgrm_cnt}
```

Interpretação:

O fluxo exige os dois comandos:

```tcl
elaborate
set_top_module
```

#### `elaborate`

Constrói os módulos internos para o top e seus submódulos.

#### `set_top_module`

Faz o link do top com:

- submódulos;
- células de CLIB;
- design library;
- bloco do design.

Depois disso, o bloco aparece em:

```tcl
get_blocks
```

e os módulos elaborados aparecem em:

```tcl
get_modules
```

Ponto importante:

```text
Não basta analisar RTL. É necessário elaborar e criar o top block.
```

---

### Slide 13 — Design Mismatch Manager (DMM)

Texto extraído:

```text
Fusion Compiler can identify and act on mismatches between:
```

Subitens:

```text
Library definitions and instantiations
RTL top-level instantiations and sub-designs
```

Texto:

```text
By default, FC uses the "default" DMM configuration
```

Subitem:

```text
Mismatches are detected but no repairs take place
Exception: instantiated and library port types or directions differ
```

Texto:

```text
Change the configuration to "autofix" to accept early RTL
```

Fluxo mostrado:

```text
Configuration
Reading
Report
Optimization
Save
```

Descrições:

```text
The design mismatch configuration defines how the tool handles mismatches
Configured mitigations are applied automatically when reading and linking the design
Mitigation results can be reported
Tool preserves the logic connected to mitigated elements during optimization
Mismatches and mitigation are saved as part of the design
```

Interpretação:

O **Design Mismatch Manager (DMM)** trata diferenças entre o que o RTL instancia e o que a biblioteca/subdesign define.

Exemplos de mismatch:

- portas com tipos diferentes;
- direções diferentes;
- instância RTL que não bate com subdesign;
- definição de library que diverge da instância.

Por padrão, o DMM usa configuração `default`: detecta mismatches, mas não corrige automaticamente.

Para aceitar RTL ainda em fase inicial, é possível usar configuração `autofix`.

O fluxo do DMM é:

1. configurar como mismatches serão tratados;
2. aplicar mitigação durante leitura/link;
3. reportar resultados;
4. preservar lógica conectada aos elementos mitigados durante otimização;
5. salvar mismatches/mitigações como parte do design.

---

## NDMs / CLIBs

### Slide 14 — NDM Cell Libraries (CLIBs)

Texto extraído:

```text
FC uses standard and macro cell libraries in NDM format, called CLIBs
```

Subitem:

```text
Does not use .db, Milkyway, GDS or LEF
```

Texto:

```text
Each cell in a CLIB contains complete physical and logic/timing/power definitions required for placement, routing and optimization
```

Subitens:

```text
Logic/timing/power data is stored in timing view
Originates from multiple .db files
```

```text
Physical data is stored in frame view
Originates from GDS or LEF (not Milkyway)
```

```text
CLIBs can optionally also contain design and layout views
```

Texto final:

```text
CLIBs are associated with a specific technology (from the .tf file)
```

Interpretação:

CLIB é a biblioteca NDM usada pelo Fusion Compiler. Ela contém as informações necessárias para:

- placement;
- routing;
- timing;
- power;
- optimization.

Ponto importante:

```text
Fusion Compiler não usa diretamente .db, Milkyway, GDS ou LEF como biblioteca operacional principal.
Ele usa CLIBs em NDM.
```

Mas os dados podem se originar de `.db`, GDS ou LEF durante a criação da CLIB.

A CLIB possui views:

- **timing view:** logic/timing/power;
- **frame view:** physical abstract;
- opcionalmente **design** e **layout views**.

---

### Slide 15 — Library and Technology Data Sources

Texto extraído:

```text
Library Compiler creates:
.db from Liberty .lib
.frame from GDS or LEF
```

```text
Library Manager (LM) creates CLIBs from:
Logic/Timing .dbs
Physical NDM .frame
Tech-File
```

```text
Fusion Compiler uses CLIBs
Can invoke LM under-the-hood
```

Fluxo da figura:

```text
Library (.lib)
Physical (GDS or LEF)
Tech-File
↓
Library Compiler
↓
Logic/Timing .db
frame
↓
Library Manager
↓
CLIBs (.ndm)
↓
Fusion Compiler
```

Também aparece:

```text
nxtgrd TLUPlus
```

Interpretação:

O fluxo de dados de biblioteca é:

1. **Library Compiler**
   - gera `.db` a partir de Liberty `.lib`;
   - gera `.frame` a partir de GDS ou LEF.

2. **Library Manager**
   - usa `.db`, `.frame` e tech file;
   - cria CLIBs NDM.

3. **Fusion Compiler**
   - usa CLIBs;
   - pode invocar o Library Manager por baixo dos panos.

Além disso, RC models como `nxtgrd` ou TLUPlus entram no fluxo para modelagem de parasitas/interconexão.

---

## Floorplan and UPF data

### Slide 16 — Apply the Power Intent

Texto extraído:

```text
Unified Power Format (UPF) is an IEEE standard (1801)
```

```text
UPF defines the entire "power intent and structure" of a multi-voltage design
```

```text
Based on the power intent, Fusion Compiler will insert power management (PM) components, like level shifters (LS), isolation cells (ISO), retention registers (RET)
```

Interpretação:

UPF é o formato padrão IEEE 1801 usado para descrever power intent.

Ele define:

- domínios de potência;
- tensões;
- power states;
- isolamento;
- retenção;
- level shifting;
- estratégias de power management.

O Fusion Compiler usa o UPF para inserir componentes de gerenciamento de potência:

- **LS — Level Shifters:** para cruzamento entre domínios de tensão.
- **ISO — Isolation Cells:** para proteger domínios ligados contra domínios desligados.
- **RET — Retention Registers:** para preservar estado quando um domínio é desligado.

Este conteúdo se conecta diretamente ao curso anterior de Formality Foundation sobre UPF e multi-voltage designs.

---

### Slide 17 — Commands Used for MV Designs

Texto extraído:

```text
To load the power intent file(s)
```

Comandos:

```tcl
load_upf TOP.upf
load_upf -scope I_B B.upf
```

Depois de carregar todos os UPFs:

```tcl
commit_upf
```

Descrição:

```text
References all UPF objects and performs primary power/ground checks
Associates strategies for instantiated power management (PM) cells
It is recommended to run this command after loading the UPF to ensure that everything is resolved
```

Observação:

```text
commit_upf is run automatically when invoking check_mv_design or compile_fusion
```

Nota:

```text
To know more about UPF it is recommended to refer the Synopsys Customer Education Portal
```

Interpretação:

Fluxo de UPF no Fusion Compiler:

1. Carregar UPF top-level:

```tcl
load_upf TOP.upf
```

2. Carregar UPF em escopo específico:

```tcl
load_upf -scope I_B B.upf
```

3. Consolidar/verificar power intent:

```tcl
commit_upf
```

O `commit_upf` faz:

- resolução de objetos UPF;
- checks primários de power/ground;
- associação de estratégias de PM cells;
- validação de que tudo está resolvido.

Mesmo que `commit_upf` rode automaticamente com `check_mv_design` ou `compile_fusion`, o slide recomenda rodá-lo depois de carregar UPF para verificar cedo.

---

### Slide 18 — Floorplan / Physical Constraints

Texto extraído:

```text
Compile always requires a physical floorplan
```

Duas opções:

```text
Read a floorplan
Generated by FC / ICC II Design Planning
Or from 3rd party tool via DEF
```

```text
Use automatic floorplanning
Enabled by default (compile.auto_floorplan_enable)
Applied during compile, can be tuned and customized
```

Interpretação:

O Fusion Compiler exige floorplan físico para `compile`. Isso mostra novamente que o fluxo é físico desde cedo.

Há duas opções:

#### 1. Ler um floorplan

Pode vir de:

- Design Planning no Fusion Compiler;
- Design Planning no ICC II;
- ferramenta de terceiros via DEF.

#### 2. Usar automatic floorplanning

Habilitado por padrão por:

```text
compile.auto_floorplan_enable
```

O auto-floorplan é aplicado durante o compile e pode ser ajustado.

Mensagem importante:

```text
No Fusion Compiler, compile não é puramente lógico; ele precisa de contexto físico.
```

---

### Slide 19 — Load a Fusion Compiler DP Floorplan

Texto extraído:

```text
If write_floorplan was used in Design Planning (FC or ICCII) to save the floorplan, apply it using:
```

Comando:

```tcl
source orca_top.fp/floorplan.tcl
```

Texto:

```text
Applies DEF and Tcl floorplanning commands
```

Trecho do script:

```tcl
source ${_dirName_0}/fp.tcl
```

Dentro de `fp.tcl` aparecem comandos como:

```tcl
remove_site_arrays
read_def ... ${_dirName_0}/floorplan.def
remove_voltage_areas -all
set voltArea [create_voltage_area ...
# remaining Tcl floorplanning commands
```

Interpretação:

Se o floorplan foi salvo com `write_floorplan` no Design Planning do Fusion Compiler ou ICC II, ele pode ser recarregado com:

```tcl
source orca_top.fp/floorplan.tcl
```

Esse script aplica:

- DEF;
- comandos Tcl de floorplanning;
- site arrays;
- voltage areas;
- demais configurações físicas.

Isso permite reutilizar um floorplan planejado anteriormente no fluxo de síntese/implementação.

---

### Slide 20 — Load a DEF Floorplan File

Texto extraído:

```text
Alternatively, if the floorplan was saved with write_def, load it with:
```

Comando:

```tcl
read_def -add_def_only_objects all ORCA.def
```

Texto:

```text
By default, the tool ignores cells that exist in the DEF file but not in the netlist (tap and end-cap cells, for example)
```

```text
use -add_def_only_objects to add these cells to the netlist
```

Opções suportadas:

```text
add_def_only_objects supports all, cells, nets, ports, none
```

Nota:

```text
To know more about loading Physical Constraints, it is recommended to refer the Synopsys Customer Education Portal
```

Interpretação:

Se o floorplan foi salvo como DEF, carregue com:

```tcl
read_def -add_def_only_objects all ORCA.def
```

Por padrão, a ferramenta ignora objetos que existem no DEF, mas não na netlist. Exemplos:

- tap cells;
- end-cap cells.

Com:

```tcl
-add_def_only_objects all
```

esses objetos são adicionados à netlist/design.

Opções possíveis:

```text
all
cells
nets
ports
none
```

Esse comando é importante para preservar elementos físicos que podem estar no floorplan, mesmo que não tenham vindo do RTL/netlist lógica.

---

## Aula didática desenvolvida

### 1. O Fusion Compiler muda a mentalidade da síntese

No fluxo tradicional, o engenheiro podia pensar assim:

```text
Primeiro faço síntese lógica.
Depois penso em placement, floorplan, clock tree, route e signoff.
```

No Fusion Compiler, essa separação é reduzida. A ferramenta combina síntese com otimização física. Portanto, desde o início, ela precisa de:

- design library;
- tech file;
- CLIBs;
- RC models;
- floorplan;
- UPF;
- modos/corners;
- constraints físicas.

A síntese passa a ser **physically aware**.

---

### 2. Design library é o container central

A design library `.dlib` não é apenas uma pasta. Ela funciona como container do design.

Ela reúne:

```text
block data
netlist
constraints
floorplan
layout
settings
tech file
reference libraries
RC models
```

Isso é diferente de um fluxo puramente textual baseado apenas em scripts e netlists soltas.

---

### 3. CLIB/NDM substitui a separação antiga entre lógica e física

No Design Compiler tradicional:

```text
.db → lógica/timing
Milkyway/LEF/GDS → dados físicos
```

No Fusion Compiler:

```text
CLIB/NDM → lógica + timing + power + physical frame
```

Isso é essencial porque uma ferramenta físico-lógica precisa saber como a célula se comporta e também como ela ocupa espaço, conecta pins e interage com placement/routing.

---

### 4. `analyze`, `elaborate` e `set_top_module`

O fluxo correto de RTL é:

```tcl
analyze
elaborate
set_top_module
```

Não é:

```tcl
read_verilog
```

Ponto de prova do slide:

```text
The read_verilog command cannot be used to read RTL
```

A diferença operacional:

- `analyze`: analisa sintaxe e cria templates intermediários.
- `elaborate`: constrói módulos wgtech para top/submódulos.
- `set_top_module`: linka com submódulos e CLIBs e cria o block.

---

### 5. DMM ajuda com RTL inicial, mas não substitui qualidade de código

O Design Mismatch Manager pode detectar e mitigar diferenças entre instâncias RTL e definições de biblioteca/subdesign.

Por padrão, ele detecta, mas não corrige.

Com configuração `autofix`, pode ajudar a aceitar RTL ainda inicial. Porém, isso deve ser usado com consciência: autofix é útil para bring-up, mas não deve esconder problemas importantes de interface.

---

### 6. UPF entra cedo no fluxo

O Fusion Compiler precisa de UPF para inserir estruturas de power management:

- level shifters;
- isolation cells;
- retention registers.

O comando:

```tcl
commit_upf
```

é recomendado logo depois do carregamento dos UPFs, porque resolve objetos, faz checks e associa estratégias.

Isso evita descobrir problemas de power intent apenas durante `compile_fusion`.

---

### 7. Floorplan é obrigatório para compile

O slide diz explicitamente:

```text
Compile always requires a physical floorplan
```

Isso separa o Fusion Compiler de uma mentalidade antiga de síntese lógica.

Se o usuário não fornece floorplan, o FC pode usar automatic floorplanning. Mas, quando houver floorplan real, é melhor carregá-lo:

- via `source floorplan.tcl`;
- ou via `read_def`.

---

### 8. Floorplan via Tcl/DEF versus DEF puro

Se o floorplan foi salvo com `write_floorplan`, carregue:

```tcl
source orca_top.fp/floorplan.tcl
```

Esse script aplica DEF + comandos Tcl.

Se foi salvo com `write_def`, carregue:

```tcl
read_def -add_def_only_objects all ORCA.def
```

A diferença é que o Tcl pode conter comandos adicionais de floorplanning, como voltage areas e ajustes específicos, enquanto o DEF é uma representação mais física/geométrica.

---

## Conceitos difíceis explicados em profundidade

### RTL-to-GDSII

Fluxo completo que começa com RTL e termina no layout final exportável para fabricação em GDSII.

---

### Single cockpit

Ambiente único para várias etapas do fluxo, reduzindo dependência de múltiplas ferramentas desconectadas.

---

### PPA

Power, Performance and Area. Métricas centrais de qualidade do chip.

---

### QoR

Quality of Results. Resultado final medido por timing, power, area, congestion, routability e outros critérios.

---

### NDM

New Data Model. Modelo de dados usado pelo Fusion Compiler/IC Compiler II para integrar informações lógicas e físicas.

---

### CLIB

Cell Library em formato NDM. Contém dados lógicos, timing, power e físicos das células.

---

### Tech file `.tf`

Arquivo tecnológico que descreve camadas, regras e informações fundamentais da tecnologia de processo.

---

### RC models

Modelos de resistência/capacitância usados para estimar ou extrair parasitas de interconexão. Exemplos citados: `nxtgrd` e TLUPlus.

---

### Application options

Configurações persistentes organizadas por categoria funcional no Fusion Compiler, como `compile`, `opt`, `place` e `time`.

---

### Design library `.dlib`

Container do projeto no Fusion Compiler. Armazena design data e referências a tecnologia, bibliotecas e modelos.

---

### Block

Representação do top design dentro da design library, criada após `set_top_module`.

---

### DMM

Design Mismatch Manager. Recurso que detecta e pode mitigar mismatches entre instâncias, bibliotecas e subdesigns.

---

### UPF

Unified Power Format, padrão IEEE 1801 para descrever power intent.

---

### PM cells

Power Management cells, como:

- LS: level shifters;
- ISO: isolation cells;
- RET: retention registers.

---

### Floorplan

Definição física inicial do chip/bloco: tamanho, formato, macros, I/O pins, voltage areas, blockages e power network.

---

### DEF

Design Exchange Format. Formato usado para representar informações físicas, como placement, floorplan e objetos físicos.

---

## Comandos importantes

### Invocar Fusion Compiler

```tcl
fc_shell -gui
fc_shell
gui_start
gui_stop
fc_shell -f RUN.tcl | tee RUN.log
```

### Criar design library

```tcl
lappend search_path /x/y/clibs

create_lib orca.dlib \
  -technology abc14_9m.tf \
  -ref_libs {abc14_std.ndm abc14_sram.ndm abc14_ip.ndm}
```

### Ler e elaborar RTL

```tcl
analyze -f sverilog "RTL1 RTL2 ..."
elaborate orca
set_top_module orca
```

### Analisar RTL

```tcl
analyze -format verilog "rtl/orca.v rtl/pci.v ..."
analyze -format vhdl counter.vhd
analyze -vcs "-f orca.vcs"
```

### Consultar blocks e modules

```tcl
get_blocks
get_modules
```

### Carregar UPF

```tcl
load_upf TOP.upf
load_upf -scope I_B B.upf
commit_upf
```

### Carregar floorplan salvo por Design Planning

```tcl
source orca_top.fp/floorplan.tcl
```

### Carregar DEF

```tcl
read_def -add_def_only_objects all ORCA.def
```

---

## Figuras e diagramas importantes

### Agenda

Mostra a progressão do curso desde introdução até top-level synthesis.

---

### Complete RTL-to-GDSII Solution

Mostra o Fusion Compiler como single cockpit RTL-to-GDSII, com ganhos esperados de timing, power, area e throughput.

---

### New Data Model

Mostra o data model com suporte a multi-view, multi-thread, multi-hier, multi-mode e multi-voltage.

---

### Logic and Physical Cell Library Data

Mostra a combinação de `.db`, `.frame` e tech file em uma NDM CLIB.

---

### Fusion Compiler GUI

Mostra menus, hierarchy view, layout view, command search e controles de visibilidade/seleção.

---

### GUI Views

Mostra views principais: hierarchy, schematic, layout, path inspector, UPF diagram e supply network.

---

### Creating the Design Library

Mostra a design library como container com tech file, CLIBs e RC models.

---

### Read RTL and Create a Block

Mostra o RTL entrando na design library e criando `orca.dlib:orca.design`.

---

### Create Linked Top Block

Mostra `elaborate` e `set_top_module` criando um block conectado a submódulos e CLIB cells.

---

### Design Mismatch Manager

Mostra o fluxo configuration → reading → report → optimization → save.

---

### NDM CLIBs

Mostra timing view, frame view e associação com technology rules.

---

### Library and Technology Data Sources

Mostra Library Compiler, Library Manager e Fusion Compiler no fluxo de criação/uso de CLIBs.

---

### Apply the Power Intent

Mostra UPF como base para inserir LS, ISO e RET.

---

### Floorplan / Physical Constraints

Mostra que `compile` sempre exige floorplan físico.

---

### Load Fusion Compiler DP Floorplan

Mostra floorplan salvo como Tcl/DEF sendo aplicado com `source`.

---

### Load a DEF Floorplan File

Mostra `read_def -add_def_only_objects all ORCA.def` e o cuidado com objetos DEF-only.

---

## Pontos de prova e revisão

1. Fusion Compiler é uma solução RTL-to-GDSII.
2. Fusion Compiler combina síntese nova com otimização física do IC Compiler II.
3. Fusion Compiler usa o mesmo data model de synthesis até signoff, alinhado ao ICC II.
4. O data model suporta multi-view, multi-thread, multi-hier, multi-mode e multi-voltage.
5. Design Compiler tradicional usa `.db` e Milkyway para bibliotecas lógicas/físicas.
6. Fusion Compiler usa NDM/CLIB.
7. CLIB combina dados lógicos e físicos.
8. O usuário pode fornecer CLIBs prontas ou `.db` + `.frame` + tech file.
9. Application options substituem a mentalidade de application variables não persistentes.
10. Application options são organizadas por categorias como `compile`, `opt`, `place` e `time`.
11. Muitas settings são salvas com o design.
12. FC pode ser invocado com `fc_shell -gui`.
13. GUI pode ser iniciada de dentro do shell com `gui_start`.
14. Modo batch usa `fc_shell -f RUN.tcl | tee RUN.log`.
15. A GUI possui Hierarchy Browser, Schematic View, Layout View, Path Inspector, UPF Diagram e Supply Network View.
16. A design library funciona como container do design.
17. A design library contém/associa tech file, CLIBs e RC models.
18. `create_lib` cria a design library.
19. `-technology` aponta para o tech file.
20. `-ref_libs` aponta para CLIBs NDM.
21. O RTL é lido com `analyze`, não com `read_verilog`.
22. `analyze` suporta Verilog, SystemVerilog e VHDL.
23. `analyze -vcs "-f file.vcs"` permite usar filelist do VCS.
24. `elaborate` constrói módulos para o top e submódulos.
25. `set_top_module` cria o block na design library.
26. É obrigatório rodar `elaborate` e `set_top_module`.
27. DMM detecta mismatches entre library definitions/instantiations e RTL/subdesigns.
28. Default DMM detecta mismatches, mas não repara.
29. `autofix` pode ajudar a aceitar early RTL.
30. FC usa standard e macro cell libraries em NDM chamadas CLIBs.
31. CLIBs não usam diretamente `.db`, Milkyway, GDS ou LEF como formato operacional final.
32. Logic/timing/power data fica na timing view.
33. Physical data fica na frame view.
34. CLIBs são associadas a uma tecnologia do `.tf`.
35. Library Compiler cria `.db` de `.lib` e `.frame` de GDS/LEF.
36. Library Manager cria CLIBs usando `.db`, `.frame` e tech file.
37. UPF é padrão IEEE 1801.
38. UPF define power intent e estrutura de multi-voltage designs.
39. FC insere PM cells como LS, ISO e RET com base no UPF.
40. `load_upf` carrega power intent.
41. `commit_upf` resolve objetos UPF e faz checks de power/ground.
42. `commit_upf` é automaticamente invocado por `check_mv_design` ou `compile_fusion`.
43. `compile` sempre exige floorplan físico.
44. Floorplan pode vir de FC/ICC II Design Planning.
45. Floorplan pode vir de ferramenta de terceiros via DEF.
46. Automatic floorplanning é habilitado por `compile.auto_floorplan_enable`.
47. Floorplan salvo com `write_floorplan` pode ser aplicado por `source floorplan.tcl`.
48. Floorplan salvo com `write_def` pode ser aplicado por `read_def`.
49. `-add_def_only_objects` adiciona objetos do DEF que não existem na netlist.
50. Tap cells e end-cap cells são exemplos de DEF-only objects.

---

## Relação com projeto/laboratório

Fluxo mínimo conceitual para iniciar um projeto no Fusion Compiler:

```tcl
# 1) Criar design library
lappend search_path /x/y/clibs

create_lib orca.dlib \
  -technology abc14_9m.tf \
  -ref_libs {abc14_std.ndm abc14_sram.ndm abc14_ip.ndm}

# 2) Ler RTL
analyze -f sverilog "RTL1 RTL2 ..."
elaborate orca
set_top_module orca

# 3) Carregar UPF se houver power intent
load_upf TOP.upf
commit_upf

# 4) Carregar floorplan físico
source orca_top.fp/floorplan.tcl
# ou
read_def -add_def_only_objects all ORCA.def
```

Checklist prático:

```text
1. Tenho CLIBs NDM corretas?
2. Tenho tech file correto?
3. Tenho RC models?
4. Criei a design library?
5. Usei analyze/elaborate/set_top_module?
6. O block foi criado?
7. Carreguei UPF?
8. Rodei commit_upf?
9. Tenho floorplan?
10. Carreguei floorplan via source ou read_def?
```

---

## Checklist de qualidade

- [x] Bloco 076 processado conforme roteiro, slides 1-20.
- [x] Texto dos prints foi extraído e organizado.
- [x] Figuras de data model, CLIB, GUI, design library, UPF e floorplan foram interpretadas.
- [x] Comandos Tcl foram preservados.
- [x] Diferenças entre DC tradicional e Fusion Compiler foram explicadas.
- [x] Pontos de prova e revisão foram listados.
- [x] O próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 077
- **Curso:** 10 Fusion Compiler Synthesis and Design Implementation Jumpstart
- **Aula:** 01 Fusion Compiler Synthesis and Design Implementation Jumpstart — parte B
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart.docx
```

- **Processar a partir de:** slide 21
- **Começar por:** `Fusion Compiler Unified RTL-to-GDSII Flow`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart_parte_B.md
```

- **Observação:** a parte B deve continuar com compile flow, MCMM, CCD, power optimization, floorplanning avançado, CTS, routing, signoff/DFM e top-level implementation.
