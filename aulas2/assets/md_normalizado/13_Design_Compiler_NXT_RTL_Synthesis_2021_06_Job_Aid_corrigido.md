# 13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid

## Controle do bloco

- **Bloco:** 051
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid.docx`
- **Tipo de material:** Job Aid / folha de referência de comandos
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid.md`
- **Próximo bloco recomendado:** `08 Formality Jumpstart\01 Overview`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: este arquivo é um **Job Aid**, não uma aula expositiva comum. Portanto, a melhor forma de estudar é como **mapa de comandos do fluxo completo**. A organização abaixo segue os assuntos do documento e acrescenta explicações práticas para transformar a folha de referência em material de estudo.

---

# Resumo executivo

Este Job Aid consolida os comandos essenciais do fluxo **Design Compiler NXT - RTL Synthesis**. Ele serve como referência rápida para:

- abrir o DC NXT em modo topographical;
- usar ajuda e comandos básicos do shell;
- configurar bibliotecas lógicas e físicas;
- criar e abrir uma NDM design library;
- configurar TLUPlus;
- usar Tcl e collection commands;
- criar constraints de clock, I/O, environment e exceptions;
- checar/remover constraints;
- gerar relatórios;
- ler RTL/DDC;
- aplicar floorplan;
- rodar `compile_ultra`;
- controlar otimizações como ungrouping, boundary optimization, retiming, scan e replication;
- usar SPG, net layer optimization e análise de congestionamento;
- escrever netlist, DDC, SDC, SCAN-DEF e arquivos para ICC2.

A leitura mais útil é enxergar o Job Aid como um **script completo em blocos**:

```text
1. invocar ferramenta
2. configurar bibliotecas
3. criar/abrir biblioteca física NDM
4. carregar modelos parasitários
5. ler RTL
6. elaborar/linkar/checkar
7. aplicar constraints
8. carregar floorplan
9. configurar otimizações
10. compilar
11. gerar relatórios
12. compilar incrementalmente, se necessário
13. recuperar área
14. escrever dados de saída
15. analisar congestionamento e seguir para ICC2
```

---

# 1. Tool Invocation e ajuda básica

## Invocar Design Compiler NXT em modo topographical

Modo interativo:

```bash
dcnxt_shell -topographical
```

Forma abreviada:

```bash
dcnxt_shell -topo
```

Dentro do shell:

```tcl
list_licenses
start_gui
stop_gui
```

Significado:

- `list_licenses`: lista licenças em uso.
- `start_gui`: abre a GUI a partir do shell.
- `stop_gui`: fecha a GUI e retorna ao shell.

Abrir direto com GUI:

```bash
dcnxt_shell -topo -gui
```

Modo batch:

```bash
dcnxt_shell -topo -f dc.tcl | tee -i dc.log
```

Interpretação:

- `-f dc.tcl` executa o script de síntese.
- `tee -i dc.log` mostra a saída no terminal e salva o log.

---

## Ajuda no shell do DC NXT

Comandos principais:

```tcl
help -verbose *clock
create_clock -help
man create_clock
apropos -symbols_only period
printvar *_library
man target_library
```

Uso:

- `help -verbose *clock`: lista opções/comandos relacionados a clock.
- `create_clock -help`: mostra ajuda direta do comando.
- `man create_clock`: abre a página de manual.
- `apropos -symbols_only period`: procura comandos/opções relacionados a `period`.
- `printvar *_library`: lista variáveis relacionadas a bibliotecas.
- `man target_library`: explica a variável `target_library`.

---

## Shorthands úteis

```tcl
history keep 200
set_app_var sh_enable_page_mode false
alias h history
alias rc "report_constraint -all_violators"
```

Explicação:

- `history keep 200`: mantém mais comandos no histórico.
- `sh_enable_page_mode false`: evita paginação interativa longa.
- `alias h history`: cria atalho para histórico.
- `alias rc`: cria atalho para relatório de constraints violadas.

---

## Comandos estilo UNIX dentro do DC NXT

```tcl
pwd
cd
ls
history
!!
!7
!report
sh <UNIX_command>
printenv
get_unix_variable <UNIX_variable>
```

Exemplo:

```tcl
sh grep ERROR dc.log
```

---

## Ajuda externa Synopsys

Criar alias para man pages no UNIX:

```bash
alias dcman '/usr/bin/man -M $SYNOPSYS/doc/syn/man'
dcman target_library
```

Fontes citadas:

```text
solvnet.synopsys.com
training.synopsys.com
```

---

# 2. Settings and Checks Applied at Startup

O Job Aid sugere dividir configurações em:

```text
common_setup.tcl
dc_setup.tcl
dc.tcl
```

No fluxo Reference Methodology, o script principal `dc.tcl` chama os arquivos de setup.

---

## Variáveis principais

```tcl
set ADDITIONAL_SEARCH_PATH "./libs/CLIBs ./libs/DBs ./rtl ./scripts"

set TARGET_LIBRARY_FILES sc_max.db
set ADDL_LINK_LIBRARY_FILES IP_max.db

set NDM_DESIGN_LIB ./MY_DESIGN_LIB
set NDM_REFERENCE_LIB "./libs/CLIBs/sc.ndm ./libs/CLIBs/IP.ndm"

set TECH_FILE ./libs/tech/cb13_6m.tf
set TLUPLUS_MAX_FILE ./libs/tech/cb13_6m_max.tluplus
set MAP_FILE ./libs/tech/cb13_6m.map
```

Função de cada uma:

```text
ADDITIONAL_SEARCH_PATH
```

Caminhos onde o DC NXT deve procurar bibliotecas, RTL e scripts.

```text
TARGET_LIBRARY_FILES
```

Biblioteca lógica alvo, normalmente `.db`, usada para mapear gates.

```text
ADDL_LINK_LIBRARY_FILES
```

Bibliotecas adicionais usadas para resolver IPs e referências.

```text
NDM_DESIGN_LIB
```

Biblioteca física do design atual.

```text
NDM_REFERENCE_LIB
```

Bibliotecas físicas de referência.

```text
TECH_FILE
```

Arquivo de tecnologia física.

```text
TLUPLUS_MAX_FILE
```

Modelo parasitário máximo.

```text
MAP_FILE
```

Mapeamento entre technology file e TLUPlus.

---

## Aplicar variáveis no DC NXT

```tcl
set_app_var search_path "$search_path $ADDITIONAL_SEARCH_PATH"

set_app_var target_library $TARGET_LIBRARY_FILES

set_app_var link_library "* $target_library $ADDL_LINK_LIBRARY_FILES"

set_app_var symbol_library $SYMBOL_LIBRARY_FILES

set_app_var ndm_reference_library $NDM_REFERENCE_LIB

set_app_var ndm_design_library $NDM_DESIGN_LIB
```

Verificar variáveis alteradas:

```tcl
get_app_var -list -only_changed_vars *
```

Ponto importante:

```text
link_library = "* $target_library $ADDL_LINK_LIBRARY_FILES"
```

O `*` permite que o DC NXT use designs já carregados na memória para resolver referências durante o link.

---

## Criar e abrir NDM design library

Criar apenas se ainda não existir:

```tcl
if {![file isdirectory $ndm_design_library]} {
  create_lib \
    -reference_library $ndm_reference_library \
    -technology $TECH_FILE \
    $ndm_design_library
}
```

Abrir biblioteca:

```tcl
open_lib $ndm_design_library
```

Checar biblioteca física:

```tcl
check_library -physical_library_name $ndm_reference_library
```

Configurar parasitas TLUPlus:

```tcl
set_tlu_plus_files \
  -max_tluplus $TLUPLUS_MAX_FILE \
  -tech2itf_map $MAP_FILE

check_tlu_plus_files
```

Outras configurações:

```tcl
set_app_var sh_enable_page_mode false

set_app_var alib_library_analysis_path [get_unix_variable HOME]

define_design_lib WORK -path ./work

set_svf <my_filename.svf>
```

Explicação:

- `alib_library_analysis_path`: diretório para arquivos ALIB.
- `define_design_lib WORK`: define biblioteca lógica de trabalho.
- `set_svf`: gera arquivo SVF para Formality/equivalência formal.

---

# 3. Tcl Constructs and Collection Commands

## Variáveis Tcl e expressões

```tcl
set PER 2.0
echo $PER

set MARG 0.95
expr $PER * $MARG
```

Operadores comuns:

```text
*, /, +, -, >, <, =, <=, >=
```

---

## Comandos embutidos

```tcl
set PCI_PORTS [get_ports A]
set PCI_PORTS [get_ports "Y??M Z*"]
```

O comando dentro de colchetes executa primeiro e retorna uma coleção.

---

## Aspas soft e hard

Soft quotes fazem substituição:

```tcl
echo "Effctv P = [expr $PERIOD * $MARGIN]"
```

Resultado:

```text
Effctv P = 1.9
```

Hard quotes não fazem substituição:

```tcl
echo {Effctv P = [expr $PERIOD * $MARGIN]}
```

Resultado literal:

```text
Effctv P = [expr $PERIOD * $MARGIN]
```

---

## Comentários

Linha inteira:

```tcl
# Tcl Comment line
```

Inline:

```tcl
set COMMENT in_line ; # Tcl inline comment
```

O `;` separa comandos na mesma linha.

---

## Loops

```tcl
set MY_DESIGNS "A.sv B.sv Top.sv"

foreach DESIGN $MY_DESIGNS {
  analyze -f sverilog $DESIGN
}
```

```tcl
for {set i 1} {$i < 10} {incr i} {
  analyze -f sverilog BLOCK_$i.sv
}
```

---

# 4. Object Retrieval — Collection Commands

Comandos para recuperar objetos:

```tcl
get_ports
get_pins
get_designs
get_cells
get_cells -hier
get_flat_cells
get_nets
get_clocks
```

Exemplos:

```tcl
get_nets -of_objects [get_pins FF1_reg/Q]
```

Bibliotecas:

```tcl
get_libs <lib_name>
get_lib_cells <lib_name/cell_names>
get_lib_cells -of_objects [get_nets net_sdram_clk]
get_lib_pins <lib_name/cell_name/pin_names>
get_lib_attribute <lib_name/cell_name>/<pin_name> <attribute_name>
```

Coleções especiais:

```tcl
all_inputs
all_outputs
all_clocks
all_registers
all_connected
all_fanin
all_fanout
all_ideal_nets
```

---

# 5. Object Manipulation — Collection Commands

Comandos:

```tcl
compare_collections
index_collection
sort_collection
```

Exemplo com ports:

```tcl
set PCI_PORTS [get_ports pci_*]
echo $PCI_PORTS
query_objects $PCI_PORTS
get_object_name $PCI_PORTS
sizeof_collection $PCI_PORTS
```

Adicionar objetos a coleção:

```tcl
set PCI_PORTS [add_to_collection $PCI_PORTS [get_ports CTRL*]]
```

Remover objetos:

```tcl
set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports CLK]]
```

Iterar sobre coleção:

```tcl
foreach_in_collection my_cells [get_cells -hier * \
  -filter "is_hierarchical == true"] {
  echo "Instance [get_object_name $cell] is hierarchical"
}
```

Outro exemplo:

```tcl
foreach_in_collection cell [get_cells] {
  query_objects [get_lib_cells -of $cell]
}
```

Operadores de filtro:

```text
==, !=, >, <, >=, <=, =~, !~
```

Exemplos:

```tcl
filter_collection [get_cells *] "ref_name =~ AN*"

get_cells * -filter "dont_touch == true"

get_clocks * -filter "period < 10"
```

Listar atributos:

```tcl
redirect -file cell_attr {
  list_attributes -application -class cell
}
```

Buscar no UNIX:

```bash
grep dont_ cell_attr | more
```

Ler atributo:

```tcl
get_attribute <cell_name> dont_touch
```

---

# 6. Timing Constraints

Antes de aplicar novas constraints:

```tcl
remove_sdc
```

---

## Clocks

Clock básico:

```tcl
create_clock -period 2 -name Main_Clk [get_ports Clk1]
```

Clock com waveform:

```tcl
create_clock -period 2.5 -waveform {0 1.5} [get_ports Clk2]
```

Clock virtual:

```tcl
create_clock -period 3.5 -name V_Clk
```

Generated clock:

```tcl
create_generated_clock -name DIV2CLK -divide_by 2 \
  -source [get_ports Clk1] [get_pins I_DIV_FF/Q]
```

---

## Clock uncertainty

Uncertainty global:

```tcl
set_clock_uncertainty -setup 0.14 [get_clocks *]
```

Uncertainty entre clocks:

```tcl
set_clock_uncertainty -setup 0.21 \
  -from [get_clocks Main_Clk] \
  -to [get_clocks Clk2]
```

---

## Clock latency

Pré-layout / pré-CTS:

```tcl
set_clock_latency -max 0.6 [get_clocks Main_Clk]
```

Pós-CTS:

```tcl
set_propagated_clock [all_clocks]
```

Atenção: aulas anteriores mostraram que `set_propagated_clock [all_clocks]` pode ser perigoso quando há clocks virtuais ou I/O reference clocks. O Job Aid lista o comando, mas o uso deve ser consciente.

Source latency:

```tcl
set_clock_latency -source -max 0.3 [get_clocks Main_Clk]
```

Clock transition:

```tcl
set_clock_transition -max 0.08 [get_clocks Main_Clk]
```

---

# 7. Clock Timing Exceptions

## Clock groups

Modelo geral:

```tcl
set_clock_groups -name false_group \
  -logically_exclusive | -physically_exclusive | -asynchronous \
  -group CLKA -group CLKB
```

Significados:

```text
-logically_exclusive
```

Clocks são mutuamente exclusivos do ponto de vista lógico.

```text
-physically_exclusive
```

Clocks não coexistem fisicamente no ponto/rede analisado.

```text
-asynchronous
```

Clocks não têm relação de fase/frequência confiável.

---

## False path

```tcl
set_false_path -setup \
  -from [get_clocks CLKA] \
  -through [get_ports din*] \
  -through [get_ports dout*] \
  -to [get_clocks CLKB]
```

Use `-through` para tornar a exceção mais específica e evitar cortar caminhos reais indevidamente.

---

## Multicycle path

Setup:

```tcl
set_multicycle_path -setup 4 \
  -from A_reg -through U_Mult/Out -to B_reg
```

Hold correspondente:

```tcl
set_multicycle_path -hold 3 \
  -from A_reg -through U_Mult/Out -to B_reg
```

Regra prática:

```text
setup N → hold N-1
```

---

# 8. I/O Timing

## Input delay

```tcl
set_input_delay -max 0.6 -clock Main_Clk \
  -source_latency_included \
  -network_latency_included \
  [all_inputs]
```

Input delay com clock virtual, falling edge e delay adicional:

```tcl
set_input_delay -max 0.48 -clock V_Clk -clock_fall \
  -add_delay [get_ports A]
```

---

## Output delay

```tcl
set_output_delay -max 0.9 -clock Clk2 \
  -source_latency_included \
  -network_latency_included \
  [get_ports "OUT2 OUT7"]
```

Output delay adicional na borda de descida:

```tcl
set_output_delay -max 1.1 -clock V_Clk -clock_fall \
  -add_delay [get_ports OUT7]
```

Pontos importantes:

- `-clock_fall`: delay relativo à borda de descida.
- `-add_delay`: adiciona constraint sem sobrescrever a anterior.
- `-source_latency_included`: valor já inclui source latency.
- `-network_latency_included`: valor já inclui network latency.

---

# 9. Environment Constraints

## Max capacitance

```tcl
set_max_capacitance 1.2 [all_inputs]
```

Esse é um design rule constraint definido pelo usuário.

---

## Load

Carga fixa em outputs:

```tcl
set_load -max 0.080 [all_outputs]
```

Carga baseada em pino de biblioteca:

```tcl
set_load -max [expr [load_of slow_proc/NAND2_3/A] * 4] \
  [get_ports OUT3]
```

Carga em inputs:

```tcl
set_load -max 0.12 [all_inputs]
```

---

## Input transition

```tcl
set_input_transition -max 0.12 \
  [remove_from_collection [all_inputs] [get_ports B]]
```

---

## Driving cell

```tcl
set_driving_cell -max -lib_cell FD1 -pin Q [get_ports B]
```

---

# 10. Checking and Removing Constraints

Relatórios e verificações:

```tcl
report_clock
report_clock -skew -attr
report_design
report_port -verbose
report_path_group
report_timing_requirements -ignored
report_auto_ungroup
report_interclock_relation
write_script -output <constraints.tcl>
check_timing
```

Remoções:

```tcl
reset_path -from FF1_reg
remove_clock
remove_clock_transition
remove_clock_uncertainty
remove_input_delay
remove_output_delay
remove_driving_cell
```

Checagem de sintaxe antes de aplicar no design:

```bash
dcprocheck constr_file.con
```

Observação:

```text
dcprocheck
```

checa sintaxe, mas não substitui `check_timing` com o design carregado.

---

# 11. Generating Reports

Gerar relatório de biblioteca:

```tcl
read_db library_file.db
list_libs

redirect -file reports/lib.rpt {
  report_lib <libname>
}
```

Hierarquia:

```tcl
report_hierarchy [-noleaf]
```

Implementação aritmética e resource sharing:

```tcl
report_resources
```

Área por células:

```tcl
report_cell [get_cells -hier *]
```

---

## Conservative Output Load Algorithm

Usado para “load budgeting” quando a carga real dos outputs ainda é desconhecida.

Ideia:

1. procurar todos os output pins da biblioteca;
2. encontrar o maior `max_capacitance`;
3. aplicar esse valor como carga conservadora.

Script:

```tcl
set LIB_NAME ssc_core_slow
set MAX_CAP 0

set OUTPUT_PINS [get_lib_pins $LIB_NAME/*/* \
  -filter "direction == 2"]

foreach_in_collection pin $OUTPUT_PINS {
  set NEW_CAP [get_attribute $pin max_capacitance]
  if {$NEW_CAP > $MAX_CAP} {
    set MAX_CAP $NEW_CAP
  }
}
```

Uso conceitual:

```tcl
set_load -max $MAX_CAP [all_outputs]
```

---

# 12. Correlação entre DC NXT e ICC / ICC II

Carregar a mesma definição de floorplan do ICC/ICC II no DC NXT.

Ajustar variáveis de timing para combinar com defaults do ICC/ICC II:

```tcl
set_compile_spg_mode icc | icc2
```

O Job Aid também menciona usar o **Consistency Checker** para comparar settings.

---

# 13. Physical Constraints

Comandos citados:

```tcl
set_aspect_ratio
set_utilization
create_die_area
create_site_row
set_port_side
create_terminal
set_cell_location
create_placement_blockage
create_voltage_area
create_bounds
create_route_guide
create_net_shape
create_user_shape
set_pin_physical_constraints
create_pin_guide
create_via_master
create_via
create_track
set_keepout_margin
compute_polygons
report_physical_constraints
reset_physical_constraints
```

Função geral:

- definir tamanho/aspect ratio do die;
- criar rows e sites;
- posicionar cells;
- criar blockages;
- definir voltage areas;
- orientar pinos;
- criar guides;
- controlar roteamento e formas físicas;
- reportar ou resetar constraints físicas.

---

# 14. Run Script

O script principal é chamado de `dc.tcl` no fluxo Reference Methodology.

---

## Leitura do design

Opções:

```tcl
read_verilog {A.v B.v TOP.v}
```

```tcl
read_sverilog {A.sv B.sv TOP.sv}
```

```tcl
read_vhdl {A.vhd B.vhd TOP.vhd}
```

```tcl
read_ddc MY_TOP.ddc
```

Ou:

```tcl
analyze -format verilog {A.v B.v TOP.v}
elaborate MY_TOP -parameters "A_WIDTH=8, B_WIDTH=16"
```

Selecionar design atual:

```tcl
current_design MY_TOP
```

Observação do Job Aid:

```text
current_design não é necessário se analyze + elaborate foi usado.
```

Link:

```tcl
link
```

O `link` é chamado implicitamente por `elaborate`, mas pode ser chamado explicitamente.

Checar design:

```tcl
if {[check_design] == 0} {
  echo "Check Design Error"
  exit
}
```

Salvar DDC não mapeado:

```tcl
write_file -f ddc -hier -out unmapped/TOP.ddc
```

---

## Aplicar constraints e floorplan

Aplicar constraints com log:

```tcl
redirect -tee -file reports/precompile.rpt {
  source -echo -verbose TOP.con
}
```

Acrescentar `check_timing` no mesmo relatório:

```tcl
redirect -append -tee -file reports/precompile.rpt {
  check_timing
}
```

Source de constraints físicas, se disponíveis:

```tcl
source <Physical_Constraints.tcl>
```

Carregar floorplan de DEF:

```tcl
extract_physical_constraints [-allow_physical_cells] <FP.def>
```

Carregar floorplan Tcl:

```tcl
read_floorplan <FP.tcl>
```

---

# 15. Relatórios depois do compile

Checar design:

```tcl
check_design
check_design -html check_design.html
sh firefox check_design.html
```

Relatórios principais:

```tcl
report_constraint -all_violators
report_qor
report_timing
report_area
report_congestion
```

Opções úteis de `report_timing`:

```tcl
report_timing \
  [-delay <max | min>] \
  [-to <pin_port_clock_list>] \
  [-from <pin_port_clock_list>] \
  [-through <pin_port_list>] \
  [-group] \
  [-input_pins] \
  [-max_paths <path_count>] \
  [-nworst <paths_per_endpoint_count>] \
  [-nets] \
  [-capacitance] \
  [-transition] \
  [-significant_digits <number>]
```

Execução paralela:

```tcl
update_timing

parallel_execute [list \
  "report_constraint -all > rc.rpt" \
  "report_timing > rt.rpt" \
  "report_area > ra.rpt" \
]
```

---

# 16. Escrita de dados de saída

Evitar `tri` em Verilog:

```tcl
set_app_var verilogout_no_tri true
```

Sanitizar nomes:

```tcl
change_names -rule verilog -hier
```

Evitar bit-blasted ports em SystemVerilog e VHDL records:

```tcl
define_name_rules verilog -preserve_struct_ports
change_names -hierarchy -rules verilog
```

Escrever arquivos:

```tcl
write_file -f verilog -hier -out mapped/TOP.v
write_file -f ddc -hier -out mapped/TOP.ddc
write_sdc TOP.sdc
write_scan_def -out TOP_scan.def
write_icc2_files -output TOP_icc2
exit
```

---

# 17. Compile Flow

## Path groups

```tcl
group_path -name CLK1 \
  -critical_range <10% of CLK1 Period> \
  -weight 5

group_path -name CLK2 \
  -critical_range <10% of CLK2 Period> \
  -weight 2

group_path -name INPUTS -from [all_inputs]

group_path -name OUTPUTS -to [all_outputs]

group_path -name COMBO -from [all_inputs] -to [all_outputs]
```

Ideia:

- clocks importantes recebem `critical_range` e `weight`;
- inputs, outputs e paths combinacionais são separados;
- evita que um caminho ruim de I/O esconda paths internos importantes.

---

## Multiple port nets

```tcl
set_fix_multiple_port_nets -all -buffer_constants
```

Evita `assign statements` problemáticos na netlist final e trata constantes.

---

## Multi-core

```tcl
set_host_options -max_cores <#>
report_host_options
remove_host_options
```

---

## Controle de ungrouping

Impedir ungroup em subdesigns específicos:

```tcl
set_ungroup <top_level_and/or_pipelined_blocks> false
```

Impedir ungroup de DesignWare:

```tcl
set_app_var compile_ultra_ungroup_dw false
```

---

## Boundary optimization

Desabilitar em células ou designs específicos:

```tcl
set_boundary_optimization <cells or designs> false
```

Permitir apenas constant propagation:

```tcl
set_app_var compile_enable_constant_propagation_with_no_boundary_opt true
```

Desabilitar constant propagation em pinos específicos:

```tcl
set_compile_directives -constant_propagation false \
  [get_pins "SUB2/In2 SUB2/In3"]
```

---

## Retiming e register replication

Excluir células/designs de adaptive retiming:

```tcl
set_dont_retime <cells_or_designs> true
```

Controlar register replication:

```tcl
set_register_replication [-num_copies 3 | -max_fanout 40] \
  [get_cells B_reg]
```

Mudar padrão de nomes:

```tcl
set_app_var register_replication_naming_style "%s_rep%d"
```

Permitir replication através de hierarquia:

```tcl
set_app_var compile_register_replication_across_hierarchy true
```

---

## Scan-ready synthesis

Selecionar estilo de scan:

```tcl
set_scan_configuration -style \
  <multiplexed_flip_flop | clocked_scan | lssd | aux_clock_lssd>
```

Desabilitar identificação automática de shift registers:

```tcl
set_app_var compile_seqmap_identify_shift_registers false
```

Preservar outputs registrados de pipeline:

```tcl
set_dont_retime [get_cells U_Pipeline/R12_reg*] true
```

Habilitar optimize registers para pipelines puros:

```tcl
set_optimize_registers true \
  -design My_Pipeline_Subdesign \
  [-clock CLK1 -delay_threshold] <clock_period>
```

---

## Esforço de timing, TNS, runtime e DRC

High effort timing:

```tcl
set_app_var compile_timing_high_effort true
```

TNS-driven placement:

```tcl
set_app_var placer_tns_driven true
```

Desabilitar settings intensivos de runtime:

```tcl
compile_prefer_runtime
```

Priorizar setup/max-delay sobre DRC:

```tcl
set_cost_priority -delay
```

Desabilitar DRC fixing em toda clock network:

```tcl
set_auto_disable_drc_nets -on_clock_network true
```

---

# 18. Variáveis relacionadas a congestionamento

O Job Aid lista variáveis que afetam coarse placement durante compile e incremental compile:

```tcl
set_app_var compile_prefer_mux false | true
set_app_var placer_channel_detect_mode false | true
set_app_var placer_congestion_effort auto | medium
set_app_var placer_enable_enhanced_router false | true
set_app_var placer_enable_enhanced_soft_blockages false | true
set_app_var placer_enable_redefined_blockage_behavior false | true
set_app_var placer_max_cell_density_threshold -1 | (0 <= value <= 1.0)
set_app_var placer_reduce_high_density_regions false | true
set_app_var placer_tns_driven false | true
set_app_var placer_tns_driven_in_incremental_compile false | true
set_app_var spg_congestion_placement_in_incremental_compile false | true
set_app_var spg_high_effort_mux_area_structuring false | true
set_app_var spg_place_enable_precluster false | true
```

Configurações de congestionamento:

```tcl
set_congestion_options [-max_util] [-layer] [-availability] \
  [-coordinate] ...
```

---

# 19. Comando principal de compile

```tcl
compile_ultra -scan -retime [-spg] [-no_boundary] [-no_autoungroup] \
  [-no_design_rule] [-no_seq_output_inversion]
```

Notas:

- `-scan`: considera scan-ready synthesis.
- `-retime`: permite movimentação de registradores.
- `-spg`: usa Synopsys Physical Guidance; recomendado quando floorplan está completo, normalmente na segunda passada.
- `-no_boundary`: desabilita boundary optimization.
- `-no_autoungroup`: desabilita auto-ungrouping.
- `-no_design_rule`: evita otimização para DRC.
- `-no_seq_output_inversion`: impede inversão sequencial de outputs.

Foco adicional em paths críticos:

```tcl
group_path -name <group_name> \
  -from <path_start> -to <path_end> \
  -critical_range <10% of max delay goal> \
  -weight 5
```

Incremental compile:

```tcl
compile_ultra [use same options from 2nd pass compile] -incremental
```

Recuperação final de área:

```tcl
optimize_netlist -area
```

---

# 20. Net Layer Optimization

O Job Aid apresenta três abordagens.

---

## 1a. Otimização automática usando top 2 layers

```tcl
compile_ultra -spg
```

---

## 1b. Otimização automática usando múltiplas camadas

```tcl
set_app_var spg_enable_zroute_layer_promotion true
compile_ultra -spg
```

---

## 2. Pattern-based layer-aware optimization

Remover padrões anteriores:

```tcl
remove_net_search_pattern -all
```

Padrão por fanout:

```tcl
set PATTERN_FO [create_net_search_pattern \
  -fanout_lower_limit 150.00]

set_net_search_pattern_delay_estimation_options \
  -min_layer_name M6 -max_layer_name M8 \
  -pattern $PATTERN_FO
```

Padrão por comprimento de net:

```tcl
set PATTERN_NL [create_net_search_pattern \
  -net_length_lower_limit 100]

set_net_search_pattern_delay_estimation_options \
  -min_layer_name M7 -max_layer_name M8 \
  -pattern $PATTERN_NL
```

Padrão para I/O crítico:

```tcl
set PATTERN_CRIT_IO \
  [create_net_search_pattern \
    -setup_slack_upper_limit "-1.0" \
    -connect_to_port]

set_net_search_pattern_delay_estimation_options \
  -min_layer M7 -max_layer M10 \
  -pattern $PATTERN_CRIT_IO

compile_ultra -spg
```

---

## 3. Constraint explícita de camada para net

```tcl
set_net_routing_layer_constraints \
  -min_layer_name M5 -max_layer_name M6 \
  [get_net top/sub/net1]

compile_ultra -incremental -spg

extract_rc -estimate
```

Ver assignments de camada:

```tcl
report_net_routing_layer_constraints [get_nets -hier] \
  -output net_layer.tcl
```

---

# 21. Congestion Analysis

O Job Aid recomenda usar no DC NXT as mesmas configurações globais e comuns de Zroute usadas no ICC II:

```tcl
set_route_zrt_global_options ...
set_route_zrt_common_options ...
```

Análise visual:

```tcl
start_gui
```

Na GUI:

```text
Window → New Layout Window
Layout Window: View → Map Mode → Reload
```

Comando equivalente:

```tcl
report_congestion -build_map
```

Relatório textual:

```tcl
report_congestion
```

---

## Métricas de congestionamento

O diagrama final do Job Aid mostra três grupos de métricas:

```text
Overall Congestion
Worst Hotspot
Violating GRCs
```

### Overall Congestion

Mostra overflow total:

```text
Both Dirs
H routing
V routing
```

Interpretação:

```text
Overflow = número de fios para os quais recurso de roteamento em GRC não estava disponível.
```

### Worst Hotspot

Mostra o máximo overflow em uma única GRC e quantas GRCs têm esse valor.

### Violating GRCs

Mostra:

```text
número de GRCs com algum overflow
porcentagem de GRCs violadas em relação ao total
```

GRC significa:

```text
Global Routing Cell
```

---

## Loop de decisão de congestionamento

O diagrama final apresenta um fluxo:

```text
Pre-floorplan synthesis
↓
ICC II floorplanning
↓
Post-floorplan synthesis
↓
Reload RTL + constraints
↓
Load floorplan
↓
compile_ultra -retime -scan -spg
↓
insert_dft
↓
compile_ultra -retime -scan -spg -incr
↓
report_congestion
↓
Congested?
```

Se **não** congestionado:

```text
seguir para ICC II P&R
```

Se congestionado:

```text
modificar placer/congestion settings
modificar floorplan
modificar RTL
repetir fluxo
```

---

# Aula didática consolidada

## 1. O Job Aid é o “mapa operacional” do curso

As aulas anteriores explicaram conceitos separadamente:

```text
libraries
RTL reading
constraints
compile_ultra
timing reports
multiple clocks
SPG
post-synthesis output
```

Este Job Aid junta tudo em uma referência de trabalho.

Ele não deve ser lido como narrativa, mas como roteiro de script. A pergunta principal é:

```text
Em que parte do fluxo este comando entra?
```

---

## 2. A ordem do fluxo importa

Um erro comum é tentar compilar sem garantir que o ambiente foi configurado.

A ordem segura é:

```text
configurar bibliotecas
abrir/criar NDM library
configurar TLUPlus
ler RTL
elaborar/linkar
check_design
aplicar constraints
check_timing
carregar floorplan, se houver
configurar otimizações
compile_ultra
reports
incremental/area recovery
write outputs
```

Se qualquer etapa anterior estiver errada, a síntese pode até rodar, mas os resultados não representam o projeto real.

---

## 3. Bibliotecas são a base de tudo

As variáveis principais são:

```tcl
target_library
link_library
ndm_reference_library
ndm_design_library
```

Elas conectam o design a:

- células lógicas;
- células físicas;
- IPs;
- tecnologia;
- parasitas;
- informações de layout.

Se a biblioteca errada for usada, todos os delays, áreas e constraints ficam comprometidos.

---

## 4. Collections são mais importantes do que parecem

Quase todo comando recebe objetos:

```tcl
[get_ports clk]
[get_clocks Main_Clk]
[get_cells -hier *]
[all_inputs]
[all_outputs]
```

Se a coleção estiver errada, a constraint fica errada.

Exemplo clássico:

```tcl
set_input_delay -max 0.6 -clock Main_Clk [all_inputs]
```

Isso pode incluir o port de clock se você não remover:

```tcl
remove_from_collection [all_inputs] [get_ports Clk]
```

---

## 5. Constraints precisam ser verificadas

O Job Aid lista três níveis de verificação:

```bash
dcprocheck constr_file.con
```

Checa sintaxe do arquivo.

```tcl
check_timing
```

Checa problemas de constraints no design carregado.

```tcl
report_timing_requirements -ignored
```

Mostra exceptions ignoradas/inválidas.

Isso é especialmente importante para:

- `set_false_path`;
- `set_multicycle_path`;
- `set_clock_groups`.

---

## 6. `compile_ultra` deve ser dirigido

O comando principal pode ser:

```tcl
compile_ultra -scan -retime -spg
```

Mas a qualidade depende das diretivas antes dele:

```tcl
group_path
set_ungroup
set_boundary_optimization
set_dont_retime
set_cost_priority
set_fix_multiple_port_nets
set_host_options
placer_* variables
```

Essas diretivas controlam:

- prioridade de caminhos;
- preservação de hierarquia;
- retiming;
- scan;
- DRC;
- congestionamento;
- correlação física.

---

## 7. SPG aproxima síntese do mundo físico

`-spg` deve ser usado quando há floorplan suficiente.

```tcl
compile_ultra -spg
```

A ideia é melhorar correlação com ICC II:

```text
menos surpresa no place-and-route
melhor estimativa de parasitas
melhor análise de congestionamento
melhor escolha de otimizações
```

---

## 8. A saída precisa ser limpa para o back-end

Antes de escrever netlist:

```tcl
set_app_var verilogout_no_tri true
change_names -rules verilog -hier
define_name_rules verilog -preserve_struct_ports
```

Isso evita:

- `tri` problemático;
- nomes com caracteres especiais;
- bit-blasted ports indesejados;
- inconsistências entre Verilog, SDC e SCAN-DEF.

---

## 9. Congestionamento pode exigir voltar ao RTL

O diagrama final mostra que, se o design fica congestionado, nem sempre a solução é apenas ajustar o placer.

Pode ser necessário:

```text
modificar placer/congestion settings
modificar floorplan
modificar RTL
```

Isso reforça a ideia de que síntese física é iterativa.

---

# Checklist prático do Job Aid

## Antes de ler o design

```text
[ ] search_path configurado
[ ] target_library configurada
[ ] link_library configurada
[ ] ndm_reference_library configurada
[ ] ndm_design_library configurada
[ ] NDM design library criada/aberta
[ ] check_library executado
[ ] TLUPlus configurado
[ ] check_tlu_plus_files passou
[ ] WORK library definida
[ ] SVF configurado, se Formality será usado
```

## Depois de ler o design

```text
[ ] RTL lido com read/analyze
[ ] elaborate executado
[ ] current_design correto
[ ] link executado
[ ] check_design limpo
[ ] unmapped DDC salvo
```

## Depois das constraints

```text
[ ] remove_sdc usado antes de reaplicar
[ ] create_clock correto
[ ] generated clocks criados
[ ] clock uncertainty definida
[ ] latências definidas
[ ] input/output delays definidos
[ ] loads/transitions/driving cell definidos
[ ] false paths e multicycle paths revisados
[ ] check_timing executado
[ ] report_timing_requirements -ignored revisado
```

## Antes do compile

```text
[ ] path groups definidos
[ ] set_fix_multiple_port_nets aplicado
[ ] multi-core configurado
[ ] ungroup/boundary control revisado
[ ] retiming/dont_retime revisado
[ ] scan configuration definida
[ ] floorplan carregado, se disponível
[ ] SPG decidido
```

## Depois do compile

```text
[ ] report_constraint -all_violators
[ ] report_qor
[ ] report_timing
[ ] report_area
[ ] report_congestion
[ ] incremental compile se necessário
[ ] optimize_netlist -area no final
```

## Antes de escrever arquivos

```text
[ ] verilogout_no_tri true
[ ] change_names aplicado
[ ] preserve_struct_ports se necessário
[ ] Verilog escrito
[ ] DDC escrito
[ ] SDC escrito
[ ] SCAN-DEF escrito
[ ] ICC2 files escritos, se aplicável
```

---

# Pontos de prova e revisão

1. O DC NXT em modo topographical pode ser aberto com:
   ```bash
   dcnxt_shell -topographical
   ```

2. Forma abreviada:
   ```bash
   dcnxt_shell -topo
   ```

3. Para abrir direto com GUI:
   ```bash
   dcnxt_shell -topo -gui
   ```

4. Para batch:
   ```bash
   dcnxt_shell -topo -f dc.tcl | tee -i dc.log
   ```

5. `target_library` define a biblioteca alvo de mapeamento.

6. `link_library` resolve referências e deve incluir `*`.

7. NDM design library é criada com:
   ```tcl
   create_lib
   ```

8. TLUPlus é configurado com:
   ```tcl
   set_tlu_plus_files
   ```

9. TLUPlus é validado com:
   ```tcl
   check_tlu_plus_files
   ```

10. `remove_sdc` limpa constraints anteriores.

11. Clock virtual é criado com `create_clock` sem objeto de port.

12. `create_generated_clock` define clock derivado.

13. `set_clock_groups` pode usar:
   ```text
   -logically_exclusive
   -physically_exclusive
   -asynchronous
   ```

14. Para multicycle setup N, normalmente usar hold N-1.

15. Para ver exceptions ignoradas:
   ```tcl
   report_timing_requirements -ignored
   ```

16. Para checar sintaxe:
   ```bash
   dcprocheck constr_file.con
   ```

17. Para resource sharing:
   ```tcl
   report_resources
   ```

18. Para correlação com ICC II:
   ```tcl
   set_compile_spg_mode icc2
   ```

19. Para path groups:
   ```tcl
   group_path -name CLK1 -critical_range ... -weight ...
   ```

20. Para evitar multiple port nets:
   ```tcl
   set_fix_multiple_port_nets -all -buffer_constants
   ```

21. Para impedir ungroup de DesignWare:
   ```tcl
   set_app_var compile_ultra_ungroup_dw false
   ```

22. Para scan style:
   ```tcl
   set_scan_configuration -style ...
   ```

23. Para priorizar setup timing sobre DRC:
   ```tcl
   set_cost_priority -delay
   ```

24. Para desabilitar DRC em toda clock network:
   ```tcl
   set_auto_disable_drc_nets -on_clock_network true
   ```

25. Para compile físico:
   ```tcl
   compile_ultra -scan -retime -spg
   ```

26. Para incremental:
   ```tcl
   compile_ultra -incremental
   ```

27. Para recuperação final de área:
   ```tcl
   optimize_netlist -area
   ```

28. Para net layer optimization automática:
   ```tcl
   compile_ultra -spg
   ```

29. Para múltiplas camadas:
   ```tcl
   set_app_var spg_enable_zroute_layer_promotion true
   ```

30. Para relatório de congestionamento:
   ```tcl
   report_congestion
   ```

31. Para mapa de congestionamento:
   ```tcl
   report_congestion -build_map
   ```

32. Para saída ICC2:
   ```tcl
   write_icc2_files -output TOP_icc2
   ```

---

# Script consolidado de referência

```tcl
################################################################################
# Setup
################################################################################

set ADDITIONAL_SEARCH_PATH "./libs/CLIBs ./libs/DBs ./rtl ./scripts"
set TARGET_LIBRARY_FILES sc_max.db
set ADDL_LINK_LIBRARY_FILES IP_max.db

set NDM_DESIGN_LIB ./MY_DESIGN_LIB
set NDM_REFERENCE_LIB "./libs/CLIBs/sc.ndm ./libs/CLIBs/IP.ndm"

set TECH_FILE ./libs/tech/cb13_6m.tf
set TLUPLUS_MAX_FILE ./libs/tech/cb13_6m_max.tluplus
set MAP_FILE ./libs/tech/cb13_6m.map

set_app_var search_path "$search_path $ADDITIONAL_SEARCH_PATH"
set_app_var target_library $TARGET_LIBRARY_FILES
set_app_var link_library "* $target_library $ADDL_LINK_LIBRARY_FILES"
set_app_var ndm_reference_library $NDM_REFERENCE_LIB
set_app_var ndm_design_library $NDM_DESIGN_LIB

if {![file isdirectory $ndm_design_library]} {
  create_lib \
    -reference_library $ndm_reference_library \
    -technology $TECH_FILE \
    $ndm_design_library
}

open_lib $ndm_design_library

check_library -physical_library_name $ndm_reference_library

set_tlu_plus_files \
  -max_tluplus $TLUPLUS_MAX_FILE \
  -tech2itf_map $MAP_FILE

check_tlu_plus_files

set_app_var sh_enable_page_mode false
set_app_var alib_library_analysis_path [get_unix_variable HOME]
define_design_lib WORK -path ./work
set_svf TOP.svf

################################################################################
# Read RTL
################################################################################

analyze -format sverilog {A.sv B.sv TOP.sv}
elaborate TOP
current_design TOP
link

if {[check_design] == 0} {
  echo "Check Design Error"
  exit
}

write_file -f ddc -hier -out unmapped/TOP.ddc

################################################################################
# Constraints
################################################################################

remove_sdc

create_clock -period 2 -name Main_Clk [get_ports Clk]

set_clock_uncertainty -setup 0.14 [get_clocks Main_Clk]
set_clock_latency -max 0.6 [get_clocks Main_Clk]
set_clock_latency -source -max 0.3 [get_clocks Main_Clk]
set_clock_transition -max 0.08 [get_clocks Main_Clk]

set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports Clk]]

set_input_delay -max 0.6 -clock Main_Clk $ALL_INP_EXC_CLK
set_output_delay -max 0.9 -clock Main_Clk [all_outputs]

set_load -max 0.080 [all_outputs]
set_driving_cell -max -lib_cell FD1 -pin Q $ALL_INP_EXC_CLK

check_timing
report_timing_requirements -ignored

################################################################################
# Optional floorplan
################################################################################

# source <Physical_Constraints.tcl>
# extract_physical_constraints -allow_physical_cells <FP.def>
# read_floorplan <FP.tcl>

################################################################################
# Compile setup
################################################################################

group_path -name Main_Clk \
  -critical_range 0.2 \
  -weight 5

group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]

set_fix_multiple_port_nets -all -buffer_constants

set_host_options -max_cores 8
report_host_options

set_app_var compile_timing_high_effort true
set_app_var placer_tns_driven true
set_auto_disable_drc_nets -on_clock_network true

################################################################################
# Compile
################################################################################

compile_ultra -scan -retime -spg

################################################################################
# Reports
################################################################################

report_constraint -all_violators
report_qor
report_timing -max_paths 10 -nworst 3 -nets -capacitance -transition
report_area
report_congestion

################################################################################
# Incremental and area recovery
################################################################################

compile_ultra -scan -retime -spg -incremental

optimize_netlist -area

################################################################################
# Output
################################################################################

set_app_var verilogout_no_tri true

define_name_rules verilog -preserve_struct_ports
change_names -hierarchy -rules verilog

write_file -f verilog -hier -out mapped/TOP.v
write_file -f ddc -hier -out mapped/TOP.ddc
write_sdc TOP.sdc
write_scan_def -out TOP_scan.def
write_icc2_files -output TOP_icc2
```

---

# Relação com projeto/laboratório

Este Job Aid é o resumo operacional do curso. Ele pega os conceitos das aulas e labs e transforma em uma referência de comandos para montar um fluxo real de síntese RTL no DC NXT.

Ele é especialmente útil para:

- lembrar a ordem correta do setup;
- recuperar a sintaxe de constraints;
- lembrar opções de `compile_ultra`;
- revisar comandos de relatório;
- montar scripts para laboratório;
- checar quais arquivos devem ser entregues ao back-end;
- entender quais knobs mexem com timing, congestionamento, hierarquia, scan e retiming.

O ponto mais importante: **não copiar comandos cegamente**. Cada comando deve corresponder a uma intenção real do design:

```text
set_clock_groups só se a relação de clocks realmente for exclusiva/assíncrona;
set_multicycle_path só se o hardware realmente permitir mais de um ciclo;
set_dont_retime só onde registradores não podem ser movidos;
-spg só quando houver informação física útil;
set_propagated_clock com cuidado quando houver clocks virtuais.
```

---

# Necessidade de áudio

**Necessidade de áudio: baixa.**

Por ser um Job Aid, o documento é uma referência de comandos. O áudio do professor pode ajudar em comentários de uso prático, mas a maior parte do valor está no próprio texto. O estudo principal é transformar a lista de comandos em um fluxo coerente.

---

## Próximo bloco

**Bloco seguinte:** `08 Formality Jumpstart — 01 Overview`

Arquivo esperado:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\01 Overview.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\01 Overview.md
```
