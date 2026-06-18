# 12 Design Compiler NXT - RTL Synthesis_2021.06_Lab Guide

## Controle do bloco

- **Bloco corrigido:** 050 — `12 Design Compiler NXT - RTL Synthesis_2021.06_Lab Guide`
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\12 Design Compiler NXT - RTL Synthesis_2021.06_Lab Guide.docx`
- **Motivo da correção:** o bloco coerente após `11 Post-Synthesis Output Data` é o **Lab Guide** do curso Design Compiler NXT, não o `Job Aid`. O Job Aid fica como material de referência separado.
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\12 Design Compiler NXT - RTL Synthesis_2021.06_Lab Guide.md`
- **Próximo bloco recomendado:** `13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: este DOCX é um **Lab Guide**, não uma aula normal de slides. Por isso, em vez de transformar cada página em “slide”, organizei o material como roteiro de laboratório didático, preservando comandos, objetivos, perguntas importantes, respostas e relação com o fluxo real de síntese.

---

## Resumo executivo

Este Lab Guide reúne os exercícios práticos do curso **Design Compiler NXT - RTL Synthesis**. Ele conecta as aulas teóricas anteriores com uso real da ferramenta em shell e GUI.

O guia cobre seis blocos práticos principais:

1. **Fluxo básico em Topographical mode**
   - configurar bibliotecas;
   - editar `common_setup.tcl`;
   - abrir o DC NXT GUI;
   - ler RTL;
   - explorar esquemático;
   - aplicar constraints;
   - rodar `compile_ultra`;
   - gerar relatórios;
   - salvar DDC e arquivos para ICC II.

2. **Criação de constraints de timing**
   - descobrir unidade de tempo da biblioteca;
   - criar `MY_DESIGN.con`;
   - definir clock, latências, uncertainty, input/output delays e caminho combinacional;
   - validar constraints com `dcprocheck`, `check_timing`, `report_clock`, `report_port -verbose` e `write_script`.

3. **Input transition e output loading**
   - aplicar `set_driving_cell`;
   - aplicar `set_input_transition`;
   - aplicar `set_load`;
   - consultar capacitância de pino de biblioteca com `load_of`.

4. **Técnicas de síntese Ultra**
   - compilar o design `STOTO`;
   - aplicar path groups, retiming, scan-ready synthesis, controle de ungrouping, `set_dont_retime`, multi-core e floorplan;
   - analisar reports;
   - verificar efeitos de retiming;
   - exportar SVF e validar equivalência com Formality.

5. **Multiple clocks e exceptions**
   - aplicar clock virtual;
   - usar `-add_delay`;
   - separar caminhos combinacionais e sequenciais;
   - aplicar `set_clock_groups -logically_exclusive`;
   - aplicar `set_false_path`;
   - aplicar `set_multicycle_path`;
   - corrigir hold em multi-cycle path.

6. **Complex design considerations**
   - constraints com borda positiva e negativa;
   - latencies included;
   - I/O timing complexo;
   - relatório de timing detalhado;
   - relação entre entradas, saídas, external delay, uncertainty e required time.

A mensagem central do laboratório é: **síntese não é apenas rodar `compile_ultra`; é preparar o ambiente, aplicar constraints corretas, conferir reports, ajustar o fluxo, salvar dados e verificar a equivalência funcional**.

---

# Parte 1 — Lab 1: Fluxo básico no DC NXT Topographical

## Objetivos

Ao final deste laboratório, o aluno deve conseguir:

- atualizar `common_setup.tcl` com bibliotecas lógicas, bibliotecas físicas e arquivos de tecnologia;
- abrir o Design Compiler NXT em modo topographical;
- verificar configurações de biblioteca;
- ler e elaborar RTL;
- explorar o schematic view da GUI;
- aplicar constraints;
- sintetizar com `compile_ultra`;
- gerar relatórios de timing, constraints e área;
- salvar o design compilado em DDC;
- gerar arquivos para IC Compiler II;
- usar histórico e documentação online.

---

## Arquivos iniciais e estrutura de setup

O laboratório começa no diretório:

```bash
cd lab1
ls -a .syn*
ls -l *setup*
```

Arquivos relevantes:

```text
.synopsys_dc.setup
setup.tcl
rm_setup/dc_setup.tcl
rm_setup/common_setup.tcl
```

Papel de cada arquivo:

```text
.synopsys_dc.setup
```

Configura aliases, procedures e suprime mensagens irrelevantes para o lab.

```text
setup.tcl
```

Configura parâmetros específicos do design e chama `rm_setup/dc_setup.tcl`.

```text
rm_setup/common_setup.tcl
```

Contém variáveis em letras maiúsculas que definem bibliotecas, diretórios e arquivos tecnológicos.

```text
rm_setup/dc_setup.tcl
```

Usa as variáveis de `common_setup.tcl` para configurar bibliotecas lógicas, criar biblioteca física de design e carregar modelos parasitários TLUPlus.

---

## Variáveis que precisam ser preenchidas em `common_setup.tcl`

O laboratório pede para editar `rm_setup/common_setup.tcl` com os valores da tabela.

### Caminhos adicionais

```tcl
set ADDITIONAL_SEARCH_PATH "../ref/DBs ../ref/CLIBs ../ref/tech ./rtl ./scripts"
```

Esses diretórios incluem:

- bibliotecas lógicas `.db`;
- bibliotecas físicas `.ndm`;
- arquivos de tecnologia;
- RTL;
- scripts.

### Biblioteca lógica alvo

```tcl
set TARGET_LIBRARY_FILES saed32lvt_ss0p75v125c.db
```

Essa biblioteca fica em:

```text
../ref/DBs
```

### Biblioteca física de design

```tcl
set NDM_DESIGN_LIB TOP.dlib
```

Esse é o nome definido pelo usuário para a design library NDM.

### Bibliotecas físicas de referência

```tcl
set NDM_REFERENCE_LIBS saed32_lvt.ndm
```

Essa biblioteca fica em:

```text
../ref/CLIBs
```

### Technology file

```tcl
set TECH_FILE saed32nm_1p9m.tf
```

Fica em:

```text
../ref/tech
```

### TLUPlus max

```tcl
set TLUPLUS_MAX_FILE saed32nm_1p9m_Cmax.tluplus
```

Fica em:

```text
../ref/tech
```

### Map file

```tcl
set MAP_FILE saed32nm_tf_itf_tluplus.map
```

Fica em:

```text
../ref/tech
```

---

## Abrindo o DC NXT GUI em modo topographical

Depois de salvar o setup:

```bash
dcnxt_shell -topo -gui
```

A GUI pode receber comandos tanto no campo de comando da interface quanto no terminal onde o DC foi aberto.

Aplicar o setup:

```tcl
source setup.tcl
```

Se aparecer erro, normalmente há erro de digitação em `common_setup.tcl`, como espaço extra no fim do nome de uma biblioteca.

---

## Verificação das bibliotecas

Comandos úteis:

```tcl
printvar search_path
printvar link_library
printvar target_library
current_lib
```

Verificação da biblioteca física:

```tcl
v check_library
```

O comando `v` é uma procedure/alias do lab para abrir relatórios longos em janela separada.

Possíveis diferenças esperadas:

- physical cells ausentes na logic library;
- diferenças em nomes de pinos de power/ground.

Para este laboratório, essas diferenças podem ser ignoradas.

Verificar TLUPlus:

```tcl
check_tlu_plus_files
```

Resultado esperado:

```text
Passed!
```

---

## Perguntas e respostas importantes do Lab 1

### Question 1 — Link library

Resposta esperada:

```text
* saed32lvt_ss0p75v125c.db
```

O `*` é importante porque indica que o design carregado em memória também pode ser usado para resolver referências durante o link.

### Question 2 — Target library

Resposta:

```text
saed32lvt_ss0p75v125c.db
```

### Question 3 — Symbol library

Resposta:

```text
your_library.sdb
```

### Question 4 — Diretórios adicionados ao search path

Resposta:

```text
../ref/DBs
../ref/CLIBs
../ref/tech
./rtl
./scripts
```

---

## Lendo e elaborando o RTL

O DC NXT pode ler Verilog, SystemVerilog, VHDL e DDC.

Neste lab:

```tcl
analyze -f verilog TOP.v
elaborate TOP
```

Alternativa VHDL:

```tcl
analyze -f vhdl TOP.vhd
elaborate TOP
```

Mensagem esperada:

```text
Presto compilation completed successfully
```

Ver designs e libs carregadas:

```tcl
list_designs
list_libs
```

Designs esperados em memória:

```text
COUNT
DECODE
FSM
TOP
```

O `*` em `TOP(*)` indica o current design.

Salvar design não mapeado:

```tcl
write_file -hier -f ddc -output ./unmapped/TOP.ddc
```

---

## Explorando o schematic view

Na GUI:

- selecionar `TOP`;
- abrir o schematic;
- observar instâncias hierárquicas:
  - `I_COUNT`;
  - `I_DECODE`;
  - `I_FSM`.

Antes de compilar, a lógica aparece em representação **GTECH**, não em gates da biblioteca alvo.

Exemplos de referências que podem aparecer:

```text
SEQGEN
GTECH_XX
SELECT_OP
```

Isso confirma que o design ainda está em forma genérica/unmapped.

---

## Aplicando constraints e sintetizando

Verificar current design:

```tcl
current_design
```

Aplicar constraints:

```tcl
source TOP.con
```

Compilar:

```tcl
compile_ultra
```

Durante o compile, o log mostra fases de otimização com colunas como:

```text
AREA
WORST NEG SLACK
```

Depois da compilação, hierarquias podem desaparecer por causa de auto-ungrouping e outras otimizações Ultra.

---

## Relatórios principais

Alias para constraints violadas:

```tcl
rc
```

Equivalente a:

```tcl
report_constraint -all_violators
```

Alias para timing:

```tcl
rt
```

Equivalente a:

```tcl
report_timing
```

Alias para área:

```tcl
ra
```

Equivalente a:

```tcl
report_area
```

Conceitos:

```text
Slack negativo = violação
Slack positivo = constraint atendida
```

---

## Salvando o design compilado

Pela GUI ou comando:

```tcl
write -hierarchy -format ddc -output lab1/mapped/TOP.ddc
```

`write` é alias para `write_file`.

Verificar:

```tcl
ls mapped
```

Gerar arquivos ASCII para ICC II:

```tcl
write_icc2_files -output ./mapped/TOP_icc2
```

---

## Histórico e reexecução

Remover designs da memória:

```tcl
fr
```

Alias para:

```tcl
remove_design -designs
```

Ver histórico:

```tcl
h
```

Alias para:

```tcl
history
```

Recriar fluxo a partir do log:

```bash
dcnxt_shell -topo -gui -f command_copy.log
```

Ou usando script salvo:

```bash
dcnxt_shell -topo -f scripts/run.tcl
```

---

## Leitura alternativa estilo VCS

Outro método de leitura usa opção estilo VCS:

```tcl
analyze -vcs -verilog -y ./rtl +libext+.v TOP.v
elaborate TOP
```

Uso típico:

- arquivos Verilog espalhados em diretórios;
- o usuário não quer listar todos os subdesigns manualmente;
- `-y ./rtl` define diretório de busca;
- `+libext+.v` define extensão de arquivos.

---

# Parte 2 — Lab 3: Timing constraints

## Objetivos

Este laboratório ensina a:

- descobrir a unidade de tempo da target library;
- criar um arquivo de constraints de timing;
- traduzir especificações do circuito para comandos DC NXT;
- verificar sintaxe antes de aplicar constraints;
- aplicar constraints ao design;
- validar se as constraints foram aplicadas corretamente.

---

## Especificação temporal do design

### Clock

O clock `clk` tem frequência:

```text
333.33 MHz
```

Período:

```text
3.0 ns
```

Todos os inputs e outputs são lançados/capturados pelo mesmo clock. Portanto, não são necessários clocks virtuais para I/O neste lab.

Especificações:

```text
clock generator delay externo até clk = 700 ps
clock insertion delay interno = 300 ps +/- 30 ps
jitter de período = +/- 40 ps
setup margin = 50 ps
clock pin transition = 120 ps
```

Interpretação:

- `700 ps` vira source latency;
- `300 ps` vira network latency;
- `+/- 30 ps`, `+/- 40 ps` e margem de `50 ps` entram na margem/uncertainty de setup;
- `120 ps` vira `set_clock_transition`.

Comandos conceituais:

```tcl
create_clock -period 3.0 [get_ports clk]

set_clock_latency -source -max 0.7 [get_clocks clk]
set_clock_latency -max 0.3 [get_clocks clk]

set_clock_uncertainty -setup 0.12 [get_clocks clk]

set_clock_transition -max 0.12 [get_clocks clk]
```

A uncertainty de `0.12 ns` vem da soma didática:

```text
30 ps skew + 40 ps jitter + 50 ps setup margin = 120 ps
```

---

## Especificações de paths

### Setup interno

```text
Assumir setup máximo de 0.2 ns para qualquer registrador em MY_DESIGN.
```

### Inputs sequenciais

```text
data1/data2 até lógica interna S: delay máximo 2.2 ns
sel: chegada absoluta mais tardia = 1.4 ns
```

A ideia é transformar isso em `set_input_delay` de modo que o DC NXT limite a lógica interna corretamente.

### Outputs sequenciais

```text
out1: lógica externa = 420 ps, setup de F6 = 80 ps
out2: delay interno máximo até out2 = 810 ps
out3: setup externo = 400 ps
```

Para `out1`, o delay externo total é:

```text
0.420 + 0.080 = 0.500 ns
```

### Caminho combinacional

```text
Cin1/Cin2 até Cout: delay máximo 2.45 ns
```

Esse path é puramente combinacional de entrada para saída. Deve ser modelado usando input/output delays apropriados em relação a `clk`, de modo que a janela interna efetiva seja 2.45 ns.

---

## Descobrindo unidade de tempo da biblioteca

Entrar no laboratório:

```bash
cd lab3
dcnxt_shell -topo
```

Setup:

```tcl
source setup.tcl
```

Carregar target library sem carregar design:

```tcl
read_db saed32lvt_ss0p75v125c.db
```

Listar bibliotecas:

```tcl
list_libs
```

Gerar relatório:

```tcl
view report_lib saed32lvt_ss0p75v125c
```

Respostas importantes:

```text
Target library file = saed32lvt_ss0p75v125c.db
Target library name = saed32lvt_ss0p75v125c
Time Unit = 1 ns
```

---

## Criando e checando `MY_DESIGN.con`

Criar:

```text
scripts/MY_DESIGN.con
```

Primeiro comando recomendado em qualquer constraint file:

```tcl
remove_sdc
```

Checar sintaxe:

```bash
dcprocheck scripts/MY_DESIGN.con
```

Aplicar no design:

```tcl
source scripts/MY_DESIGN.con
```

Se houver erro, usar:

```tcl
source -echo scripts/MY_DESIGN.con
```

---

## Validando constraints

Checar timing:

```tcl
check_timing
```

A mensagem abaixo pode ser ignorada se o lab estiver focado apenas em setup:

```text
Warning: input ports only have partial input delay specified. (TIM-212)
```

Porque foram especificados delays `-max`, sem `-min`.

Relatórios:

```tcl
report_clock
report_clock -skew
report_port -verbose
```

O esperado:

- um clock com período e waveform corretos;
- source/network latency corretas;
- uncertainty correta;
- transition correta;
- input/output delays corretos.

Escrever constraints aplicadas em forma expandida:

```tcl
write_script -out scripts/MY_DESIGN.wscr
```

Comparar com solução:

```bash
tkdiff scripts/MY_DESIGN.wscr .solutions
```

ou:

```bash
diff scripts/MY_DESIGN.wscr .solutions
```

Salvar design não mapeado:

```tcl
write_file -format ddc -hier -out unmapped/MY_DESIGN.ddc
```

---

# Parte 3 — Lab 4: Input transition e capacitive loading

## Objetivos

Este laboratório adiciona constraints de ambiente ao arquivo de timing:

- `set_driving_cell`;
- `set_input_transition`;
- `set_load`;
- verificação de capacitance unit;
- validação de constraints aplicadas.

---

## Especificação do design

### Input ports

```text
Driving cell NBUFFX2_LVT em todos os inputs, exceto clk e Cin*
```

Os ports `Cin*` são chip-level inputs e possuem:

```text
maximum input transition = 120 ps
```

### Output ports

```text
Todos os outputs, exceto Cout, dirigem carga máxima equivalente a 2x a capacitância do pino A da célula NBUFFX16_LVT.
```

O port `Cout` dirige:

```text
25 fF
```

---

## Consultando capacitance unit

Entrar em `lab4`, abrir DC NXT e setup.

Carregar biblioteca:

```tcl
read_db saed32lvt_ss0p75v125c.db
```

Gerar report:

```tcl
view report_lib saed32lvt_ss0p75v125c
```

Pergunta importante:

```text
Qual é a Capacitive Load Unit da biblioteca?
```

Em bibliotecas desse fluxo, normalmente o valor usado no lab é interpretado em **pF**, então:

```text
25 fF = 0.025 pF
```

---

## Constraints principais

Driving cell:

```tcl
set_driving_cell -max -lib_cell NBUFFX2_LVT \
  [remove_from_collection [all_inputs] [get_ports clk Cin*]]
```

Input transition em `Cin*`:

```tcl
set_input_transition -max 0.12 [get_ports Cin*]
```

Output load geral:

```tcl
set_load -max [expr {2 * [load_of saed32lvt_ss0p75c/NBUFFX16_LVT/A]}] \
  [remove_from_collection [all_outputs] [get_ports Cout*]]
```

Output load em `Cout`:

```tcl
set_load -max 0.025 [get_ports Cout*]
```

O lab alerta que `dcprocheck` pode reclamar da expressão se não houver chaves. Forma preferida:

```tcl
expr {2 * [load_of lib/cell/pin]}
```

---

## Validação

Fluxo:

```bash
dcprocheck scripts/MY_DESIGN.con
```

Depois no DC NXT:

```tcl
source setup.tcl
analyze/elaborate MY_DESIGN
check_design
source scripts/MY_DESIGN.con
check_timing
report_port -verbose
write_script -out scripts/MY_DESIGN.wscr
diff scripts/MY_DESIGN.wscr .solutions
```

---

# Parte 4 — Lab 5: Técnicas de síntese Ultra com STOTO

## Objetivos

Este é um dos labs mais importantes do curso. Ele usa o design `STOTO` para praticar:

- path groups;
- preservação seletiva de hierarquia;
- `set_ungroup`;
- `set_optimize_registers`;
- `set_dont_retime`;
- `set_cost_priority -delay`;
- routing direction;
- floorplan;
- multi-core;
- `compile_ultra -retime -scan`;
- análise de resultados;
- Layout Window;
- Formality com SVF.

---

## Especificação do design `STOTO`

Arquivo de constraints:

```text
scripts/STOTO.con
```

Esses arquivos não devem ser modificados.

Especificações principais:

```text
1. I/O constraints são estimadas e conservadoras.
2. O design final deve cumprir setup timing em todos os caminhos internos register-to-register.
3. A hierarquia INPUT deve ser preservada para facilitar verificação pós-síntese.
4. PIPELINE contém pipeline puro.
5. A saída POUT[9:0] de PIPELINE deve permanecer registrada.
6. Os registradores da instância I_DONT_PIPELINE não podem ser movidos.
7. DRC deve ser corrigido, exceto se impedir setup timing.
8. A posição lógica de registradores pode ser modificada para melhorar timing, exceto onde proibido.
9. Scan será inserido pelo grupo de teste depois do design cumprir especificações.
```

Floorplan:

```text
core size = 75 um x 50 um
sem hard macros instanciadas
standard cells podem ocupar o core exceto uma região 30 um x 20 um no canto superior esquerdo
```

---

## Preparação

Descobrir cores disponíveis:

```bash
./num_cores.sh
```

Abrir DC NXT:

```bash
dcnxt_shell -topo
```

Criar `scripts/dc.tcl` e ir copiando todos os comandos interativos para ele.

Setup:

```tcl
source setup.tcl
```

Antes de ler o design, criar arquivo SVF para Formality:

```tcl
set_svf ./scripts/STOTO.svf
```

Ler, elaborar, linkar e checar `STOTO`.

Aplicar constraints com echo:

```tcl
source -echo STOTO.con
check_timing
```

A warning `TIM-212` sobre input ports com delay parcial pode ser ignorada se só `-max` for relevante.

---

## Path groups e foco em reg-to-reg

Como os I/Os são conservadores e o objetivo é reg-to-reg, deve-se priorizar o clock group.

Espera-se criar grupos:

```tcl
group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]
group_path -name clk -critical_range 0.12 -weight 5
```

A resposta do lab informa:

```text
clock period = 1.2 ns
critical range = 0.12 ns = 10% do período
weight do grupo clk = 5.00
demais grupos = weight 1.00 e critical range 0.00
```

---

## Preservação e otimização seletiva

Preservar `INPUT`:

```tcl
set_ungroup [get_designs INPUT] false
```

O retorno esperado:

```tcl
get_attribute [get_designs INPUT] ungroup
```

deve ser:

```text
false
```

Habilitar otimização de pipeline:

```tcl
set_optimize_registers true -design PIPELINE
```

Verificação:

```tcl
get_attribute [get_designs PIPELINE] optimize_registers
```

deve retornar:

```text
true
```

Preservar registradores de saída `z2_reg*`:

```tcl
set_dont_retime [get_cells I_MIDDLE/I_PIPELINE/z2_reg*] true
```

Preservar `I_DONT_PIPELINE`:

```tcl
set_dont_retime [get_cells I_MIDDLE/I_DONT_PIPELINE] true
```

Priorizar setup timing sobre DRC quando necessário:

```tcl
set_cost_priority -delay
```

Verificação:

```tcl
get_attribute [get_designs STOTO] cost_priority
```

deve retornar:

```text
max_delay
```

---

## Direções preferenciais de roteamento

Aplicar camadas horizontais:

```tcl
set_preferred_routing_direction -layers {M1 M3 M5 M7 M9} -direction horizontal
```

Aplicar camadas verticais:

```tcl
set_preferred_routing_direction -layers {M2 M4 M6 M8 MRDL} -direction vertical
```

`MRDL` é redistribution layer, usada em flip-chip para conexão a bumps.

---

## Aplicar floorplan

Aplicar constraints físicas:

```tcl
source -echo STOTO.pcon
```

Verificar:

```tcl
report_physical_constraints
```

Resultados esperados:

```tcl
create_die_area -coordinate {0 0 75 50}
create_placement_blockage -name Blockage1 -coordinate {0 30 30 50}
```

Salvar design não mapeado:

```tcl
write_file -format ddc -hier -out unmapped/STOTO.ddc
```

---

## Multi-core

Com uma licença disponível, o lab indica que é possível usar até 8 cores/threads:

```tcl
set_host_options -max_cores 8
```

Verificar:

```tcl
report_host_options
```

Mensagem esperada no log durante compile:

```text
Information: Running optimization using a maximum of 4 cores. (OPT-1500)
```

O número real pode variar conforme máquina/licença.

---

## Compile

Opções esperadas:

```tcl
compile_ultra -retime -scan
```

Justificativa:

- `-retime`: permitido pelas especificações, exceto nos pontos protegidos com `dont_retime`;
- `-scan`: ativa test-ready synthesis, pois scan será considerado no fluxo.

Mensagem que indica retiming:

```text
Information: Retiming is enabled. SVF file must be used for formal verification. (OPT-1210)
```

Hierarquias que devem ser ungrouped:

```text
MIDDLE
DONT_PIPELINE
GLUE
ARITH
RANDOM
OUTPUT
```

A hierarquia `INPUT` não deve ser ungrouped.

---

## Análise de results

Relatório de constraints:

```tcl
redirect -tee -file rc_compile_ultra.rpt {rc}
```

Relatório de timing:

```tcl
redirect -tee -file rt_compile_ultra.rpt {rt}
```

Esperado:

```text
sem violações setup reg-to-reg no grupo clk
possíveis violações em grupos I/O podem existir, pois constraints de I/O são conservadoras
```

O lab reforça: como o objetivo é cumprir reg-to-reg e I/O é estimado, não faz sentido gastar esforço para remover violações conservadoras de I/O se o objetivo principal já foi cumprido.

---

## Retimed registers

Os registradores retimed aparecem com nomes em:

```text
I_MIDDLE/I_PIPELINE/clk*
```

Isso indica que pertencem ao subdesign `PIPELINE`.

Verificar relação cell/reference:

```tcl
report_cell -nosplit I_MIDDLE/I_PIPELINE
```

Verificar que `z2_reg*` não foi movido:

```tcl
get_cells -hier *z2_reg*
```

Se apenas `z1_reg` foi movido, os nomes relacionados a `z2_reg*` ainda existem.

---

## Próximos passos se ainda houvesse violação

Se houvesse violações reg-to-reg:

```tcl
group_path -critical_range ... -weight ...
compile_ultra -spg -scan -retime -incremental
```

Mas a solução indica que, se reg-to-reg já está cumprido e só I/O conservador viola, não vale insistir.

---

## Verificação física na Layout Window

Verificar core:

```text
75 x 50
```

Verificar blockage:

```text
(0,30) até (30,50)
```

Essas coordenadas devem corresponder ao `STOTO.pcon`.

---

## Formality

O arquivo SVF escrito pelo DC NXT:

```text
STOTO.svf
```

Reference design:

```text
rtl/STOTO.v
```

Implementation design:

```text
mapped/STOTO.ddc
```

Resultado esperado:

```text
Verification SUCCEEDED
```

O SVF captura transformações como retiming e outras otimizações Ultra que poderiam dificultar equivalence checking.

---

# Parte 5 — Lab 7: Multiple clocks e timing exceptions

## Objetivos

Este lab usa o design `EXCEPTIONS` para mostrar:

- análise de timing em design com caminhos paralelos;
- separação de caminhos combinacionais e sequenciais;
- uso de clock virtual;
- uso de `-add_delay`;
- exclusividade lógica entre clocks;
- false paths específicos;
- multicycle setup/hold;
- verificação de exceptions ignoradas.

---

## Setup inicial

Entrar em `lab7`:

```bash
dcnxt_shell -topo
```

Setup:

```tcl
source setup.tcl
read_ddc mapped/EXCEPTION.ddc
```

Relatórios iniciais:

```tcl
view rc
view rt
```

O design está propositalmente mal restringido para demonstração.

Resultado inicial:

```text
WNS = -6.6 ns
```

O caminho crítico começa em:

```text
input port adr_i*
```

e termina em:

```text
output port dout*
```

Portanto, é um caminho combinacional puro.

A janela disponível inicial para esse caminho é:

```text
4 ns - 2 ns - 3 ns = -1 ns
```

Ou seja: a constraint é impossível.

---

## Separar caminhos combinacionais com clock virtual

Os caminhos sequenciais já usam `clk` de 4 ns com input delay de 2 ns e output delay de 3 ns.

Os caminhos combinacionais devem ter delay máximo de 6 ns.

Criar clock virtual:

```tcl
create_clock -name vclk -period 6
```

Selecionar inputs:

```tcl
set in_ports [get_ports coeff* adr_i*]
```

Adicionar input/output delay de 0 ns com relação a `vclk`:

```tcl
set_input_delay -max 0 -clock vclk -add_delay $in_ports
set_output_delay -max 0 -clock vclk -add_delay [all_outputs]
```

O `-add_delay` é indispensável para não sobrescrever os delays sequenciais existentes.

---

## Problema: `clk` e `vclk` interagem indevidamente

Relatório:

```tcl
view rt -group vclk
```

Inicialmente pode violar, porque o launch clock aparece como `clk` e capture como `vclk`.

Isso está errado: caminhos combinacionais devem ser analisados apenas com `vclk`.

Solução:

```tcl
set_clock_groups -name false_grp1 -logically_exclusive \
  -group clk -group vclk
```

Alternativa:

```tcl
set_false_path -from [get_clocks clk] -to [get_clocks vclk]
set_false_path -from [get_clocks vclk] -to [get_clocks clk]
```

Depois disso, o path combinacional em `vclk` deve cumprir timing.

---

## Problema: caminhos combinacionais ainda aparecem no grupo `clk`

Relatório:

```tcl
view rt -group clk
```

Se ainda aparecer um caminho de input para output no grupo `clk`, isso está errado.

Cortar especificamente caminhos `clk -> clk` através da lógica combinacional:

```tcl
set_false_path -from [get_clocks clk] \
  -through $in_ports \
  -through [all_outputs] \
  -to [get_clocks clk]
```

Esse false path é específico e evita cortar caminhos sequenciais reais.

---

## Multicycle path

Os caminhos para `mul_result_reg*` podem levar 2 ciclos para setup.

Aplicar:

```tcl
set_multicycle_path 2 -setup -to mul_result_reg*/D
```

Verificar:

```tcl
view rt -group clk -to mul_result_reg*/D
```

O período efetivo deve ser:

```text
8 ns
```

porque:

```text
2 ciclos x 4 ns = 8 ns
```

Mas o hold ainda precisa ser corrigido. Relatório:

```tcl
view rt -group clk -to mul_result_reg*/D -delay min
```

O lab mostra que o hold default não corresponde à especificação. Para setup 2, usar hold 1:

```tcl
set_multicycle_path 1 -hold -to mul_result_reg*/D
```

Regra:

```text
setup N → hold N-1
```

---

## Verificar exceptions ignoradas

Depois de aplicar false paths e multicycle paths:

```tcl
view report_timing_requirements -ignored
```

O lab informa que aparecerão muitos `NONEXISTENT PATH, FALSE paths`, causados por wildcards em ports bit-sliced. Isso é esperado neste caso e pode ser ignorado, porque os caminhos inexistentes são combinações de bits que não se conectam fisicamente.

---

# Parte 6 — Lab 9: Complex design considerations

## Objetivos

Este lab consolida constraints complexas em um design com:

- registradores de borda positiva e negativa;
- entradas e saídas lançadas/capturadas por múltiplos registradores;
- latências externas diferentes;
- método `latencies included`;
- carga externa de sibling blocks;
- análise detalhada de timing report.

---

## Especificações principais

### Clock

```text
Renomear clock object de clk para my_clk.
Duty-cycle: 40% active high.
Zero offset.
```

Como o período final observado nas respostas é 3 ns e high time é 1.2 ns:

```tcl
create_clock -period 3.0 \
  -name my_clk -waveform {0 1.2} \
  [get_ports clk]
```

---

## Input port `sel`

O port `sel` vem de um registrador externo `F4` acionado por borda negativa.

Especificação:

```text
sel chega no máximo 420 ps após a borda negativa de lançamento de F4.
clock pin de F4 tem latência total de 600 ps.
usar método latencies included.
```

Valor de input delay com latência incluída:

```text
0.420 + 0.600 = 1.020 ns
```

Constraint:

```tcl
set_input_delay -max 1.02 \
  -clock my_clk \
  -add_delay \
  -clock_fall \
  -network_latency_included \
  -source_latency_included \
  [get_ports sel]
```

---

## Output port `out1`

`out1` é capturado por registrador externo `F5` acionado por borda negativa.

Especificação:

```text
out1 deve chegar no máximo 260 ps antes da borda negativa de F5.
clock pin de F5 tem network latency de 500 ps.
source latency é igual à de my_clk.
usar latencies included.
```

A solução do lab usa:

```tcl
set_output_delay -max -0.94 \
  -clock my_clk \
  -add_delay \
  -clock_fall \
  -network_latency_included \
  -source_latency_included \
  [get_ports out1*]
```

O valor negativo aparece porque a exigência externa, combinada com a latência, faz a saída precisar chegar antes da referência de captura ajustada.

---

## Cargas externas em inputs

Cada input, exceto clocks, fanout para dois sibling blocks. Cada sibling block equivale internamente a 3 buffers `NBUFFX16_LVT` no pino A.

Então a carga externa equivalente por input é:

```text
2 sibling blocks x 3 buffers = 6 x load_of(NBUFFX16_LVT/A)
```

Também é aplicado driving cell para inputs:

```tcl
set_driving_cell \
  -max -no_design_rule \
  -lib_cell NBUFFX2_LVT -pin Y \
  [remove_from_collection [all_inputs] [get_ports clk Cin*]]
```

O relatório mostra transition aproximada em `sel`:

```text
~0.10 ns
```

---

## Compilação

Checar constraints:

```bash
dcprocheck scripts/MY_DESIGN.con
```

Abrir DC NXT, setup, ler/elaborar design, aplicar constraints e compilar:

```tcl
compile_ultra -scan -retime
```

---

## Constraint report esperado

Relatório:

```tcl
view rc
```

Resposta esperada:

```text
sem violações de timing ou DRC
```

Se houver violações, corrigir constraints, remover design da memória, reaplicar constraints e recompilar.

---

## Timing report para `out1`

Comando:

```tcl
view rt -trans -input -sig 6 -nets -to [get_ports out1*]
```

Startpoint esperado:

```text
clock pin de um registrador: R_#
```

Launching clock:

```text
my_clk
launch edge = 0.0 ns
rising edge
```

Clock network delay:

```text
1.0 ns
```

produzido por:

```tcl
set_clock_latency -source -max 0.7 [get_clocks my_clk]
set_clock_latency -max 0.3 [get_clocks my_clk]
```

Clock pin transition:

```text
0.12 ns
```

produzido por:

```tcl
set_clock_transition -max 0.12 [get_clocks my_clk]
```

Capturing clock:

```text
my_clk
capture edge = 1.2 ns
falling edge
```

Uncertainty:

```text
-0.15 ns
```

produzido por:

```tcl
set_clock_uncertainty -setup 0.15 [get_clocks my_clk]
```

Output external delay:

```text
0.94 ns
```

relacionado ao comando:

```tcl
set_output_delay -max -0.94 ...
```

Aparece com sinal negativo no report porque é subtraído do data required time.

---

## Por que `out1` usa falling edge?

O lab responde:

```text
out1 é restringido por dois registradores externos, um de borda positiva e outro de borda negativa. O DC NXT determinou que a constraint para o registrador de borda negativa é a mais restritiva.
```

---

## Timing report de `sel` para `Cout`

Comando:

```tcl
view rt -trans -input -sig 6 \
  -from [get_ports sel] \
  -to [get_ports Cout*]
```

Startpoint:

```text
sel
```

Launching clock:

```text
my_clk
launch edge = 1.2 ns
falling edge
```

Input external delay:

```text
1.02 ns
```

produzido por:

```tcl
set_input_delay -max 1.02 \
  -clock my_clk \
  -add_delay \
  -clock_fall \
  -network_latency_included \
  -source_latency_included \
  [get_ports sel]
```

Transition em `sel`:

```text
~0.10 ns
```

produzida por `set_driving_cell`.

O `Incr` no port `sel` representa o tempo adicional para o input, com aquela transition, atingir o switching point. Não é net delay; net delay aparece separadamente no primeiro gate.

---

## Verificar path COMBO de `Cin*` para `Cout`

Comando:

```tcl
view rt -from [get_ports Cin*] \
  -to [get_ports Cout*]
```

A verificação pedida pelo lab:

```text
data required time - data arrival time = 2.45 ns
```

Exemplo da solução:

```text
3.75 ns - 1.30 ns = 2.45 ns
```

Isso confirma que o path combinacional foi restringido corretamente.

---

# Diagramas importantes do Lab Guide

## Diagrama de fluxo básico

O guia traz um fluxo vertical com as etapas:

```text
Examine and modify common_setup.tcl
Invoke DC NXT in Topo mode and verify setup
Read rtl/TOP.v ou TOP.vhd
Explore schematic view
Constrain using scripts/TOP.con
Compile with compile_ultra
Generate timing/area reports
Save mapped/TOP.ddc
Explore alternate read/invocation methods
Access SolvNet resources
```

Esse fluxo mostra a sequência mínima de uso da ferramenta em laboratório.

---

## Diagrama `MY_DESIGN`

O diagrama de `MY_DESIGN` mostra:

- entradas `data1[4:0]`, `data2[4:0]`, `sel`, `Cin1[4:0]`, `Cin2[4:0]`;
- lógica interna `S`, `T`, `V` e `COMBO`;
- registradores internos `R1`, `R2`, `R3`, `R4`;
- registradores externos `F3`, `F4`, `F5`, `F6`;
- saídas `out1[4:0]`, `out2[4:0]`, `out3[4:0]`, `Cout[4:0]`.

Esse desenho é a base dos labs de timing, input transition, output loading e complex design constraints. Ele mostra por que algumas constraints são sequenciais e outras são combinacionais.

---

# Conceitos-chave

## 1. Setup files

A cadeia:

```text
.synopsys_dc.setup → setup.tcl → dc_setup.tcl → common_setup.tcl
```

define ambiente, bibliotecas e variáveis de tecnologia.

## 2. Target library versus link library

```text
target_library
```

é usada para mapear o design em células.

```text
link_library
```

resolve referências de design, bibliotecas e IPs.

## 3. DDC

DDC é o formato nativo do DC NXT.

Usos:

```text
unmapped DDC: design ainda genérico
mapped DDC: design já compilado/gate-level
```

## 4. GTECH

GTECH é representação genérica antes do mapeamento para cells reais.

## 5. Constraints

As constraints definem o que a ferramenta precisa cumprir:

```text
clock
latency
uncertainty
input delay
output delay
load
transition
driving cell
false path
multicycle path
```

## 6. `dcprocheck`

Checa sintaxe de arquivo de constraints antes de aplicar no design.

```bash
dcprocheck scripts/MY_DESIGN.con
```

## 7. `check_timing`

Verifica ausência de constraints essenciais e conflitos.

```tcl
check_timing
```

## 8. `write_script`

Escreve constraints aplicadas em forma expandida.

```tcl
write_script -out scripts/MY_DESIGN.wscr
```

Ótimo para comparar com solução.

## 9. `compile_ultra`

Executa síntese e otimizações avançadas.

## 10. `-scan` e `-retime`

```text
-scan  → considera scan-ready synthesis
-retime → permite mover registradores para melhorar timing
```

## 11. SVF

SVF registra transformações de síntese para ajudar Formality.

```tcl
set_svf ./scripts/STOTO.svf
```

## 12. Clock virtual

Usado quando o clock não existe fisicamente no bloco, mas serve como referência de constraint.

## 13. `-add_delay`

Mantém constraints anteriores no mesmo port.

## 14. `set_clock_groups -logically_exclusive`

Remove relações temporais impossíveis entre clocks.

## 15. `set_multicycle_path`

Relaxamento de caminhos que levam mais de um ciclo.

Regra prática:

```text
setup N → hold N-1
```

---

# Possíveis questões de prova

1. Qual arquivo contém variáveis como `TARGET_LIBRARY_FILES`, `NDM_REFERENCE_LIBS`, `TECH_FILE` e `TLUPLUS_MAX_FILE`?
   - Resposta: `rm_setup/common_setup.tcl`.

2. Qual é a função do `dc_setup.tcl`?
   - Configurar bibliotecas lógicas, criar biblioteca física de design e carregar TLUPlus usando variáveis do `common_setup.tcl`.

3. Por que o `*` é importante em `link_library`?
   - Porque permite resolver referências usando designs já carregados na memória.

4. Qual comando abre o DC NXT em modo topographical com GUI?
   ```bash
   dcnxt_shell -topo -gui
   ```

5. Qual comando checa arquivos de constraints antes de abrir o design?
   ```bash
   dcprocheck scripts/MY_DESIGN.con
   ```

6. Qual comando escreve constraints aplicadas em forma expandida?
   ```tcl
   write_script -out scripts/MY_DESIGN.wscr
   ```

7. Como salvar um design não mapeado em DDC?
   ```tcl
   write_file -hier -f ddc -output ./unmapped/TOP.ddc
   ```

8. Qual comando gera arquivos para ICC II?
   ```tcl
   write_icc2_files -output ./mapped/TOP_icc2
   ```

9. Em `STOTO`, qual é o objetivo principal de timing?
   - Cumprir setup em todos os paths internos register-to-register.

10. Em `STOTO`, por que violações de I/O podem ser menos preocupantes?
    - Porque as constraints de I/O são estimadas e conservadoras.

11. Para setup multicycle de 2 ciclos, qual hold normalmente deve ser aplicado?
    ```tcl
    set_multicycle_path 1 -hold ...
    ```

12. Em um path multicycle com setup 6, qual hold típico?
    ```tcl
    hold 5
    ```

13. Para que serve `report_timing_requirements -ignored`?
    - Verificar exceptions ignoradas/inválidas.

14. O que significa WNS?
    - Worst Negative Slack, ou pior slack negativo.

15. O que indica `Verification SUCCEEDED` no Formality?
    - A netlist sintetizada é logicamente equivalente ao RTL de referência.

---

# Relação com laboratório/projeto

Este Lab Guide é o ponto em que a teoria do curso vira fluxo real. Ele mostra como passar de RTL e constraints para uma netlist sintetizada, analisada e exportada.

Em projeto real, o fluxo aprendido aqui vira algo como:

```text
1. preparar setup de biblioteca;
2. ler RTL;
3. elaborar e linkar;
4. checar design;
5. aplicar constraints;
6. validar constraints;
7. aplicar floorplan, se disponível;
8. configurar path groups e otimizações;
9. compilar;
10. analisar timing, área e DRC;
11. ajustar;
12. salvar DDC/netlist/SDC/SCAN-DEF;
13. verificar equivalência formal quando houver transformações fortes.
```

O principal aprendizado prático é que cada comando tem consequência:

- `set_ungroup` muda hierarquia preservada;
- `set_dont_retime` protege registradores;
- `set_clock_groups` remove relações de timing;
- `set_multicycle_path` relaxa timing;
- `-add_delay` impede sobrescrita de constraints;
- `set_svf` permite Formality entender transformações.

---

# Necessidade de áudio

**Necessidade de áudio: média.**

O conteúdo do Lab Guide é principalmente textual e baseado em comandos, então o Markdown consegue preservar boa parte do aprendizado. Porém, áudio ou vídeo do professor seria útil nos pontos em que o lab depende de interpretação:

- por que certas violações podem ser ignoradas;
- como interpretar mensagens `OPT-*`;
- como observar retiming na prática;
- como navegar na GUI;
- como diferenciar constraint errada de design realmente crítico;
- como decidir entre incremental compile, novo compile ou ajuste de RTL.

---

## Próximo bloco

**Bloco seguinte coerente:** `13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid`

Arquivo:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid.md
```
