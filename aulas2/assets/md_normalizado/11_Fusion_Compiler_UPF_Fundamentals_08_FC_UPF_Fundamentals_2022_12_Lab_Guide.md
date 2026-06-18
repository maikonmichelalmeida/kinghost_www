# 08 FC UPF Fundamentals 2022.12 — Lab Guide

## Controle do bloco

- **Bloco complementar:** Lab de reforço do curso 11 — Fusion Compiler UPF Fundamentals
- **Arquivo de origem:** `08 FC UPF Fundamentals_2022.12_Lab Guide.docx`
- **Arquivo anexado nesta conversa:** `08 FC UPF Fundamentals_2022.12_Lab Guide.docx`
- **Conteúdo processado:** Lab 1, Lab 2 e Lab 3
- **Objetivo do processamento:** transformar o lab em material de revisão didática, com foco nos comandos, erros, perguntas do lab, respostas esperadas e implicações para prova.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\08 FC UPF Fundamentals_2022.12_Lab Guide.md
```

---

## Resumo executivo

Este Lab Guide é um reforço prático do curso **Fusion Compiler UPF Fundamentals**. Ele consolida o que foi visto nos módulos teóricos, mas agora em forma de execução no Fusion Compiler usando um design baseado em **RISC CORE / PCI architecture**.

O lab é dividido em três partes principais:

1. **Lab 1 — Power Domains**
   - foco em power domains, scope e supply availability;
   - criação e inspeção de power domains;
   - erro de escopo em `PD_MACRO_WRITE`;
   - uso de `load_upf`, `commit_upf`, `report_power_domains`, `save_upf`, `reset_upf`;
   - uso de `create_power_domain -available_supplies`.

2. **Lab 2 — Power Strategies**
   - foco em isolation, level shifter e retention;
   - investigação de warnings em `create_mv_cells -mapped -verbose`;
   - uso de `check_mv_design -isolation`;
   - erro `MV-1102`, onde level shifter não pode ser inserido porque falta isolation cell no caminho;
   - criação de `set_isolation CORE_IN`;
   - criação de `set_retention CORE_RET`;
   - uso de `map_retention_cell`;
   - uso de `report_pst`, `get_related_supply_net`, `report_mv_lib_cells`, `analyze_mv_feasibility -retention`.

3. **Lab 3 — Supply Network and Power States**
   - foco em refinar supply sets e definir power states;
   - erro `MV-003`, relacionado a supply set sem funções refinadas;
   - erro `MV-002`, relacionado ao primary supply de power domain;
   - associação de `ss_core` ao handle `PD_CORE.primary`;
   - alternativa de refinar diretamente `PD_CORE.primary`;
   - criação do estado global ausente no Power State Group com `add_power_state -group PST -state OFF_STATE -update`;
   - uso de `report_supply_set`, `report_power_domains`, `report_pst`, `commit_upf`, `check_mv_design`, `compile_fusion`.

A mensagem central do lab é:

```text
O UPF precisa estar correto em três níveis ao mesmo tempo:
1. definição estrutural: power domains, scope e elements;
2. definição elétrica: supply sets, supply nets, availability e power states;
3. definição estratégica: isolation, level shifting, retention e mapping de cells.
```

A prova provavelmente não vai cobrar apenas definições. Ela pode cobrar sintomas de fluxo:

```text
Se aparece UPF-168, qual é a causa?
Se aparece MV-003, o que falta?
Se aparece MV-1102, por que o LS não entra?
Se todo supply set aparece em todo domínio, qual comando limita isso?
Se retention não mapeia, quais comandos e checagens usar?
```

---

# Contexto comum dos labs

## Design usado

Os três labs usam um design **RISC CORE** baseado em arquitetura **Peripheral Component Interconnect (PCI)**.

O design possui quatro power domains compartilhando a ground supply net:

```text
VSS = 0 V
```

## Power domains

| Power domain | Escopo/hierarquia | Primary power supply | Estados/tensões |
|---|---|---|---|
| `PD_TOP` | top scope | `VDD` | 0.75 V, 0.95 V, OFF |
| `PD_CORE` | `pci_core` | `VDD_CORE` | 1.16 V, OFF |
| `PD_MACRO_READ` | `pci_read_fifo` | `VDD_MACRO` | 1.05 V |
| `PD_MACRO_WRITE` | `pci_write_fifo` | `VDD_MACRO` | 1.05 V |

Todos usam:

```text
VSS = 0 V
```

## Strategies necessárias no design

Por causa dos power states e das diferenças de tensão/desligamento, o UPF precisa incluir:

- retention strategy dentro de `PD_CORE`, aplicada aos elementos sequenciais;
- isolation strategies entre `PD_TOP` e `PD_CORE`;
- isolation strategies entre `PD_TOP` e `PD_MACRO_READ` / `PD_MACRO_WRITE`;
- level shifter insertion automática para corrigir voltage shifting violations;
- em alguns casos, Enable Level Shifter, porque isolation e level shifting se sobrepõem.

---

# Lab 1 — Power Domains

## Objetivo

O Lab 1 serve para familiarizar o usuário com:

```text
power domain
scope
supply availability
UPF load/commit
report_power_domains
GUI power domain view
debug de erro de escopo no UPF
available_supplies
```

## Duração

```text
45 minutes
```

## Diretório do lab

```text
Lab1_power_domains/
```

Arquivos principais:

| Arquivo/diretório | Função |
|---|---|
| `run.tcl` | Script com os comandos executados no lab |
| `./rm_setup/fc_setup.tcl` | Setup de variáveis e configurações gerais |
| `design_data/` | UPF, floorplan e MCMM timing constraints |
| `../ref/CLIBs` | Bibliotecas SAED32nm |

---

## Fluxo inicial do Lab 1

### 1. Entrar no diretório e abrir o Fusion Compiler

```sh
cd lab1_power_domains
fc_shell
```

### 2. Abrir `run.tcl`

O arquivo contém os comandos que serão executados no lab.

### 3. Carregar setup geral

```tcl
source -echo ./rm_setup/fc_setup.tcl
```

### 4. Criar design library, carregar design e tecnologia

```tcl
source -echo ./rm_setup/design_setup.tcl
```

### 5. Inspecionar o UPF

Arquivo:

```text
design_data/pci_top.upf
```

### 6. Carregar e commitar UPF

```tcl
load_upf ./design_data/pci_top.upf
commit_upf
```

---

## Lab 1 — Pergunta 1

### Pergunta

```text
Were there any errors after load_upf or commit_upf?
If yes, list them here.
```

### Resposta esperada

Durante `load_upf`, aparece:

```text
Error: cannot find power domain 'PD_MACRO_WRITE' for set_isolation strategy MACRO_WRITE_IN. (UPF-168)
```

Também aparece um erro:

```text
CMD-013
```

que o lab diz que pode ser ignorado.

### Interpretação

O erro importante é:

```text
UPF-168
```

Ele indica que uma strategy `set_isolation` está apontando para um power domain que a ferramenta não consegue encontrar no escopo onde a strategy foi definida.

Isso é diretamente relacionado a:

```text
scope
hierarchical power domain names
strategy domain reference
```

---

## Lab 1 — Pergunta 2

### Pergunta

```text
List the created power domains and identify on which instances of the design the power domains are created.
```

### Resposta esperada

Power domains efetivamente criados:

```text
PD_CORE
PD_MACRO_READ
PD_TOP
```

Localização:

| Power domain | Local |
|---|---|
| `PD_TOP` | top-most scope |
| `PD_CORE` | hierarchy `pci_core` |
| `PD_MACRO_READ` | hierarchy `pci_read_fifo` |

### Observação

`PD_MACRO_WRITE` deveria existir, mas por causa do erro de scope, ele não aparece corretamente no report executado no top scope.

---

## Lab 1 — Pergunta 3

### Pergunta

```text
Identify the primary supply of each power domain in the design.
```

### Resposta esperada

| Power domain | Primary power supply | Primary ground |
|---|---|---|
| `PD_TOP` | `VDD` | `VSS` |
| `PD_CORE` | `VDD_CORE` | `VSS` |
| `PD_MACRO_READ` | `VDD_MACRO` | `VSS` |

### Observação

`PD_MACRO_WRITE` deveria usar `VDD_MACRO` e `VSS`, mas está envolvido no erro de escopo.

---

## Lab 1 — GUI exploration

Comando:

```tcl
gui_start
```

No GUI, navegar para:

```text
View > Multivoltage Views > Power Domain / Root Cell
```

ou usar o ícone indicado no lab.

### Objetivo

Visualizar:

- hierarquia do design;
- instances;
- power domains;
- root cells;
- informações do input UPF.

---

## Lab 1 — Pergunta 4

### Pergunta

```text
Identify the power domains displayed there.
Is there any mismatch between this view and the report run at top scope?
```

### Resposta esperada

A GUI mostra um power domain definido no escopo de:

```text
pci_write_fifo
```

O mismatch é que o report no top scope não lista corretamente esse domínio como esperado.

### Interpretação

Isso reforça que o problema não é simplesmente “não existe create_power_domain”. O problema é que o power domain foi criado em um escopo diferente do esperado pela strategy.

---

## Lab 1 — Pergunta 5

### Fluxo

Salvar o UPF atual:

```tcl
save_upf current_file.upf
```

Buscar criações de power domain:

```sh
sh grep create_power_domain current_file.upf
```

Comparar com:

```tcl
report_power_domains
```

### Pergunta

```text
How many power domains are created?
```

### Resposta esperada

O grep mostra quatro comandos `create_power_domain`:

```tcl
create_power_domain PD_TOP \
  -supply {primary ss_main}

create_power_domain PD_CORE \
  -elements pci_core \
  -supply {primary ss_core}

create_power_domain PD_MACRO_READ \
  -elements {pci_read_fifo} \
  -supply {primary ss_macro}

create_power_domain PD_MACRO_WRITE \
  -elements {pci_write_fifo} \
  -supply {primary ss_macro}
```

Então o UPF tenta criar:

```text
4 power domains
```

Mas a ferramenta reporta/resolve apenas parte deles corretamente por causa do erro de scope em `PD_MACRO_WRITE`.

---

## Lab 1 — Debug de `load_upf`

Comandos:

```tcl
reset_upf
load_upf ./design_data/pci_top.upf > load_upf.rpt
```

Depois analisar:

```text
load_upf.rpt
```

e consultar manual do erro:

```tcl
man UPF-168
```

### Interpretação do erro

O erro `UPF-168` indica que a strategy `set_isolation` aponta para um power domain que não é encontrado no escopo onde a strategy está sendo avaliada.

---

## Lab 1 — Pergunta 6 / 7 no documento

O lab tem uma numeração confusa: depois da pergunta 5, a pergunta sobre modificações aparece como Question 6 em uma parte e como Question 7 na resposta.

### Pergunta

```text
What modifications are required in the pci_top.upf/current_file.upf so that no more errors are seen during power domain definition and interaction with power strategies?
```

### Resposta esperada — abordagem 1

Corrigir a isolation strategy para apontar para o nome hierárquico correto do domínio e da supply:

```tcl
set_isolation MACRO_WRITE_IN \
  -domain pci_write_fifo/PD_MACRO_WRITE \
  -isolation_supply \
  pci_write_fifo/PD_MACRO_WRITE.primary \
  -isolation_signal iso_enable \
  -applies_to_boundary both \
  -diff_supply_only true -location parent
```

### Resposta esperada — abordagem 2

Remover o `set_scope` / evitar criar o domínio dentro de escopo diferente.

Mudar de:

```tcl
create_power_domain PD_MACRO_WRITE \
  -elements {pci_write_fifo} \
  -supply {primary ss_macro} \
  -scope pci_write_fifo
```

para:

```tcl
create_power_domain PD_MACRO_WRITE \
  -elements {pci_write_fifo} \
  -supply {primary ss_macro} \
  -available_supplies {}
```

### Interpretação

Existem duas formas de corrigir:

1. Manter o power domain criado em escopo hierárquico e ajustar a strategy para usar o nome com escopo.
2. Criar o power domain no escopo onde a strategy espera encontrá-lo.

A prova pode cobrar essa lógica como:

```text
Erro de strategy apontando para power domain inexistente pode ser erro de scope, não necessariamente ausência de create_power_domain.
```

---

## Lab 1 — `check_mv_design` e `create_mv_cells -mapped`

Depois de corrigir o UPF:

```tcl
check_mv_design
create_mv_cells -mapped
check_mv_design
```

O lab afirma que os únicos warnings restantes devem ser:

```text
retention registers not implemented
tie-off connections not implemented
```

Isso não é problema nesse ponto, porque:

```text
tie-offs serão implementados durante connect_pg_net
retention mapping ocorre durante compile_fusion -initial_map
```

---

## Lab 1 — Pergunta 7

### Pergunta

```text
How to mitigate warnings related to tie-off connections and retention cells?
```

### Resposta esperada

Para retention cells:

```tcl
compile_fusion -to initial_map
```

mas antes garantir que as design constraints foram carregadas conforme `run.tcl`.

Para direct tie connections:

```tcl
connect_pg_net
```

ou, em fluxo automático:

```tcl
connect_pg_net -automatic
```

dependendo do contexto.

### Interpretação

Esses warnings não indicam necessariamente erro de UPF. Eles podem indicar que a implementação ainda não chegou na etapa que resolve tie-offs e retention mapping.

---

## Lab 1 — Supply availability

Inicialmente, ao inspecionar:

```tcl
report_power_domains
```

o lab observa que:

```text
every supply set in the design is available everywhere
```

A tarefa é limitar isso com:

```tcl
create_power_domain -available_supplies
```

Tabela fornecida:

| Power domain | Supplies Available |
|---|---|
| `PD_TOP` | `ss_macro`, `ss_core`, `ss_main` |
| `PD_CORE` | `ss_main`, `ss_ret`, `ss_macro`, `ss_core` |
| `PD_MACRO_READ` | `ss_main`, `ss_macro` |
| `PD_MACRO_WRITE` | `ss_main`, `ss_macro` |

### Interpretação

Esse ponto reforça o módulo Supply Network:

```text
Por default, supply sets definidos no top podem ficar disponíveis em todos os domínios.
```

Mas isso pode ser fisicamente irrealista. Por isso usamos:

```tcl
-available_supplies
```

para restringir a availability.

---

# Lab 1 — Síntese conceitual

O Lab 1 ensina que:

```text
1. Power domain creation depende de scope.
2. Strategies precisam referenciar power domains no escopo correto.
3. A GUI pode revelar domínios criados em hierarquias que não aparecem como esperado no report top-level.
4. save_upf + grep ajuda a comparar o UPF em memória com os reports.
5. reset_upf + load_upf > log ajuda a depurar erros de carregamento.
6. -available_supplies controla a disponibilidade de supply sets.
7. Warnings de tie-off e retention podem ser etapa-dependentes, não erro final.
```

---

# Lab 2 — Power Strategies

## Objetivo

O Lab 2 foca em escrever e depurar strategies:

```text
set_isolation / map_isolation_cell
set_level_shifter / map_level_shifter
set_retention / map_retention_cell
```

Também ensina o fluxo de debug quando:

- isolation não é inserida;
- level shifter não pode ser inserido;
- ELS é necessário;
- retention precisa ser mapeada.

## Duração

```text
45 minutes
```

## Diretório do lab

```text
Lab2_power_strategies/
```

Arquivos:

| Arquivo/diretório | Função |
|---|---|
| `run.tcl` | Script do lab |
| `rm_setup/fc_setup.tcl` | Setup geral |
| `design_data/` | UPF, floorplan e MCMM constraints |
| `../ref/CLIBs` | Bibliotecas SAED32nm |

---

## Fluxo inicial do Lab 2

```sh
cd lab2_power_strategies
fc_shell
```

```tcl
source -echo ./rm_setup/fc_setup.tcl
source -echo ./rm_setup/design_setup.tcl
load_upf ./design_data/pci_top.upf
commit_upf
```

---

## Lab 2 — Contexto

O design é o mesmo RISC CORE / PCI do Lab 1.

O lab informa que:

```text
UPF tem isolation e level shifter violations.
```

Mas há uma condição importante:

```text
não serão usadas level shifter strategies;
o fluxo vai confiar na inserção automática de level shifters.
```

Por causa disso:

```text
Enable Level Shifter (ELS) insertion is required.
```

Além disso:

```text
PD_CORE é shutdown domain com sequential logic que precisa de retention.
```

Então há duas tarefas centrais:

1. Corrigir isolation para permitir LS/ELS insertion.
2. Escrever retention strategy para `PD_CORE`.

---

## Lab 2 — Pergunta 1

### Pergunta

```text
Inspect the output of create_mv_cells -mapped -verbose.
Identify any warning found during its execution and list them here.
```

### Resposta esperada

Warning:

```text
Warning: 15 nets required level shifters, but matching level shifters were not found. (MV-611)
```

### Interpretação

O design precisa de level shifters em 15 nets, mas a ferramenta não encontrou LS compatíveis.

Possíveis causas:

- falta de LS library cell;
- ranges de tensão incompatíveis;
- ausência de isolation antes de LS;
- ELS necessário;
- strategy/condição de UPF incompleta.

Neste lab, a causa está ligada à ausência de isolation cells em paths onde LS seriam necessários.

---

## Lab 2 — Pergunta 2

### Fluxo

Executar:

```tcl
check_mv_design
```

Inspecionar:

```text
Isolation rule
Voltage shifting rule
```

Depois redirecionar:

```tcl
check_mv_design -isolation \
  -max_message_count 100 > CMVD.rpt
```

Gerar lista de ports:

```sh
cat CMVD.rpt | awk '{print $4 }' | sort | uniq | grep "'" > port_list.txt
```

### Pergunta

```text
Inspect the section “Isolation rule” and “Voltage shifting rule”, how many warnings are there?
```

### Resposta esperada

```text
73 isolation violations due to missing iso cells.
73 voltage shifting violations.
```

### Interpretação

O mesmo conjunto de caminhos pode estar causando dois tipos de problemas:

```text
off-to-on / missing isolation
voltage shifting / missing LS
```

O lab quer mostrar que corrigir isolation pode destravar LS/ELS insertion.

---

## Lab 2 — Pergunta 3

### Fluxo

Executar:

```tcl
create_mv_cells -verbose
```

Listar erros `MV-*`.

Consultar:

```tcl
man MV-1102
```

### Pergunta

```text
List any MV-* Error given by the tool.
```

### Resposta esperada

Erro:

```text
MV-1102
```

Significado esperado:

```text
Level shifter cannot be inserted because there are no isolation cells in the path where the LS is required.
```

### Interpretação

Esse é um ponto de prova forte.

A ferramenta não consegue inserir LS porque há uma violação anterior/relacionada no caminho: falta isolation.

A ordem lógica é:

```text
corrigir isolation → permitir LS/ELS insertion
```

---

## Lab 2 — Investigando paths com violações

O lab orienta a selecionar alguns ports em `port_list.txt` e usar:

```tcl
change_selection [get_ports $port]
gui_start
```

Depois, no GUI, criar schematic view do port selecionado.

### Comandos de related supply

Ver supply relacionada ao port:

```tcl
get_related_supply_net $port
```

Ver supply relacionada ao leaf pin:

```tcl
get_related_supply_net $leaf_pin
```

### Objetivo

Confirmar se:

```text
os drivers desses paths têm a mesma supply
os loads entram em PD_CORE
as violações vêm majoritariamente de top-level ports que sink into PD_CORE
```

---

## Lab 2 — Strategy de isolation para PD_CORE

O lab conclui que muitas violações vêm de top-level ports entrando em `PD_CORE`.

Strategy proposta:

```tcl
set_isolation CORE_IN   -domain PD_CORE \
  -isolation_supply PD_CORE.primary \
  -isolation_signal iso_enable \
  -applies_to_boundary both \
  -diff_supply_only true -applies_to inputs
```

### Interpretação

Essa strategy:

- aplica-se ao domínio `PD_CORE`;
- usa `PD_CORE.primary` como isolation supply;
- usa `iso_enable` como sinal de controle;
- aplica-se a inputs;
- usa `-diff_supply_only true`, então só isola quando source e sink têm supplies diferentes;
- usa `-applies_to_boundary both`.

### Por que isso ajuda?

Porque cobre paths que entram em `PD_CORE` vindos de drivers com supply diferente.

Isso permite que isolation cells sejam inseridas, e depois level shifters/ELS possam ser inseridos nos paths que precisam.

---

## Lab 2 — Abordagem alternativa para isolation

O lab também mostra uma alternativa baseada em boundary pins.

Primeiro, obter pins de boundary:

```tcl
set pdb_pins [get_pins [all_fanout \
  -from [get_ports $ports] -levels 1 ] \
  -filter is_pd_boundary]
```

Depois:

```tcl
set_isolation CORE_AUX -elements $pdb_pins
  -isolation_supply PD_CORE.primary \
  -isolation_signal iso_enable \
  -domain PD_CORE
```

### Interpretação

Essa abordagem seleciona explicitamente os pins de boundary derivados do fanout dos ports com violação.

É mais cirúrgica, mas depende de coletar corretamente `$ports` e `$pdb_pins`.

---

# Lab 2 — Retention strategy para PD_CORE

## Condição de design

O lab fornece:

| Sinal | Função | Sense |
|---|---|---|
| `pwr_control_save` | save_signal | high |
| `pwr_control_restore` | restore_signal | low |

A retention deve se aplicar a:

```text
all sequential elements inside PD_CORE
```

---

## Passo 1 — Explorar comandos

Consultar:

```tcl
set_retention -help
map_retention_cell -help
```

Objetivo:

```text
identificar opções mínimas obrigatórias.
```

---

## Passo 2 — Escolher retention supply

Executar:

```tcl
report_pst -derived -nosplit -voltage_type all
```

Procurar uma supply set que:

```text
em todos os estados do sistema está ON
opera em 1.16 V
```

Resposta esperada:

```text
ss_ret
```

### Interpretação

`ss_ret` satisfaz os requisitos de retention porque permanece ligada e opera na tensão necessária para a retention supply.

---

## Passo 3 — Identificar save/restore ports

Comandos:

```tcl
get_ports *save*
get_ports *restore*
```

Depois, confirmar related supply:

```tcl
get_related_supply_net $port
```

O lab informa que o UPF já possui:

```tcl
create_logic_port pwr_control_save
create_logic_port pwr_control_restore

set_port_attributes -ports pwr_control* \
  -driver_supply ss_ret
```

### Interpretação

Os sinais de controle de retention já existem como logic ports e são relacionados a `ss_ret`.

---

## Passo 4 — Identificar retention lib-cells

Comando:

```tcl
get_lib_cells -filter "is_retention==true"
```

Ou contar:

```tcl
sizeof_collection [get_lib_cells -filter is_retention]
```

Resposta esperada:

```text
180 retention lib-cells available
```

Depois:

```tcl
write_sdc -output SDC.txt
```

Inspecionar tensões.

Tensões esperadas no SDC:

```tcl
set_voltage 0.75 -object_list {VDD}
set_voltage 0 -object_list {VSS}
set_voltage 1.16 -object_list {VDD_CORE}
set_voltage 0.95 -object_list {VDD_MACRO}
set_voltage 1.16 -object_list {VDD_RET}
```

Depois:

```tcl
report_mv_lib_cells -retention
```

Confirmar se há lib-cells com pane cobrindo:

```text
VDD_CORE = 1.16
VDD_RET  = 1.16
```

---

## Passo 5 — Criar retention strategy

Strategy:

```tcl
set_retention CORE_RET -domain PD_CORE \
  -elements { pci_core/* } \
  -retention_supply_set ss_ret \
  -save_signal {pwr_control_save high} \
  -restore_signal {pwr_control_restore low}
```

Mapping:

```tcl
map_retention_cell CORE_RET \
  -domain PD_CORE \
  -lib_cells {RSDFF* RDFF*}
```

Depois, checar feasibility:

```tcl
analyze_mv_feasibility -retention
```

### Interpretação

A strategy define:

- domínio: `PD_CORE`;
- elementos: `pci_core/*`;
- retention supply: `ss_ret`;
- save ativo alto;
- restore ativo baixo.

O mapping permite usar células compatíveis com nomes:

```text
RSDFF*
RDFF*
```

---

## Lab 2 — Compilar até initial_map

Depois de ajustar UPF:

```tcl
source ./design_data/pci_constraints.tcl
compile_fusion -to initial_map
check_mv_design
```

Warnings esperados restantes:

```text
MV-072
MV-027
```

### Significado

`MV-072`:

```text
level shifters not associated to set_level_shifter strategies
```

Isso é esperado porque o lab está confiando em level shifter automatic insertion, sem strategies explícitas.

`MV-027`:

```text
direct tie connections missing
```

Pode ser resolvido com `connect_pg_net`.

---

## Lab 2 — Optional tasks

### Remover `MV-072`

Criar explicitamente:

```tcl
set_level_shifter
map_level_shifter
```

e usar:

```tcl
create_mv_cells -mapped
```

para ver se a strategy aplica.

### Remover `MV-027`

Usar:

```tcl
connect_pg_net
```

ou:

```tcl
connect_pg_net -automatic
```

---

# Lab 2 — Síntese conceitual

O Lab 2 ensina:

```text
1. Isolation e level shifting podem estar acoplados.
2. Se falta isolation, LS pode não ser inserido.
3. MV-1102 indica que LS não entra porque falta ISO no caminho.
4. check_mv_design pode mostrar o mesmo número de isolation e voltage shifting violations.
5. create_mv_cells -verbose ajuda a entender por que PM cells não entraram.
6. get_related_supply_net ajuda a investigar source/sink.
7. set_isolation com -diff_supply_only true evita isolation redundante.
8. Retention exige supply always-on relativa correta.
9. set_retention precisa de save/restore e retention supply.
10. map_retention_cell precisa apontar para células de biblioteca compatíveis.
11. report_mv_lib_cells e write_sdc ajudam a confirmar tensões/corners.
```

---

# Lab 3 — Supply Network and Power States

## Objetivo

O Lab 3 foca em:

```text
supply network implementation
supply set refinement
implicit supply sets
power states
PST/PSG
commit_upf errors
```

## Duração

```text
45 minutes
```

## Diretório

```text
lab3_supply_network_power_states
```

Arquivos principais:

| Arquivo/diretório | Função |
|---|---|
| `run.tcl` | Script do lab |
| `rm_setup/fc_setup.tcl` | Setup geral |
| `design_data/` | UPF, floorplan e MCMM constraints |
| `../ref/CLIBs` | Bibliotecas SAED32nm |

---

## Fluxo inicial do Lab 3

```sh
cd lab3_supply_network_power_states
fc_shell
```

```tcl
source -echo ./rm_setup/fc_setup.tcl
source -echo ./rm_setup/design_setup.tcl
load_upf ./design_data/pci_top.upf
commit_upf
```

---

## Lab 3 — Erro `MV-003`

### Pergunta

Após `commit_upf`, identificar erros e supply set afetado.

O lab orienta:

```tcl
man MV-003
report_supply_set <supply_set_flagged>
```

### Interpretação esperada

`MV-003` está relacionado a supply set sem funções definidas/refinadas.

O lab diz:

```text
uma supply set precisa ter suas funções definidas.
```

Em particular, é necessário refinar `ss_core`.

---

## Lab 3 — Corrigir `MV-003`

Verificar se a supply port existe:

```tcl
get_supply_port VDD_CORE
```

Verificar se a supply net existe:

```tcl
get_supply_nets VDD_CORE
```

Verificar conexão entre port e net:

```tcl
get_supply_ports -of_objects [get_supply_nets VDD_CORE]
```

Refinar `ss_core`:

```tcl
create_supply_set ss_core -update \
  -function {power VDD_CORE} \
  -function {ground VSS}
```

Depois:

```tcl
commit_upf
```

### Interpretação

O erro é resolvido definindo as funções do supply set:

```text
ss_core.power  = VDD_CORE
ss_core.ground = VSS
```

Isso é exatamente o que o módulo Supply Network ensinou:

```text
supply set precisa ser refinado para supply nets reais para implementation.
```

---

## Lab 3 — Erro `MV-002`

Depois de corrigir `MV-003`, o lab orienta:

```tcl
man MV-002
report_power_domains <power_domain_flagged>
```

### Interpretação esperada

O power domain afetado não tem sua primary supply corretamente associada/refinada.

A solução envolve ligar `ss_core` ao handle:

```text
PD_CORE.primary
```

---

## Lab 3 — Corrigir `MV-002`

O lab apresenta dois métodos.

### Método 1 — Associação de `ss_core` ao handle `PD_CORE.primary`

```tcl
associate_supply_set ss_core -handle PD_CORE.primary
```

Depois:

```tcl
commit_upf
```

### Método 2 — Refinamento direto do handle `PD_CORE.primary`

```tcl
create_supply_set PD_CORE.primary -update \
  -function {power VDD_CORE} \
  -function {ground VSS}
```

Depois:

```tcl
commit_upf
```

### Interpretação

Os dois métodos resolvem o mesmo problema de formas diferentes:

| Método | Ideia |
|---|---|
| Association | `PD_CORE.primary` usa `ss_core` |
| Refinement direto | `PD_CORE.primary.power = VDD_CORE`, `PD_CORE.primary.ground = VSS` |

Isso reforça a diferença entre:

```text
association
refinement
```

---

## Lab 3 — Carregar constraints e reportar PST

Depois que `commit_upf` roda sem erros:

```tcl
source ./design_data/pci_constraints.tcl
```

Checar PST:

```tcl
report_pst -derived -voltage_type all -nosplit
```

### Observação

O lab identifica que falta um power state para o sistema:

```text
o estado onde ss_main está OFF
```

---

## Lab 3 — Verificar states individuais dos supply sets

Antes de criar o state global, verificar:

```tcl
report_supply_set ss_main
report_supply_set ss_core
report_supply_set ss_macro
```

Confirmar:

| Supply set | Estado esperado |
|---|---|
| `ss_main` | `main_OFF` |
| `ss_core` | `ON_1p16` |
| `ss_macro` | `ON_0p95` |

---

## Lab 3 — Criar state global ausente

Comando:

```tcl
add_power_state -group PST -state OFF_STATE \
  {-logic_expr { ss_main==main_OFF && ss_core == \
  ON_1p16  && ss_macro == ON_0p95 }} -update
```

Depois confirmar:

```tcl
report_pst -derived -voltage_type all -nosplit
```

### Interpretação

Os estados individuais já existiam, mas faltava uma combinação global no Power State Group.

O comando adiciona:

```text
OFF_STATE
```

ao grupo `PST`, combinando:

```text
ss_main = main_OFF
ss_core = ON_1p16
ss_macro = ON_0p95
```

---

## Lab 3 — Final do fluxo

Rodar:

```tcl
check_mv_design
compile_fusion -to logic_opto
check_mv_design
```

Observações:

- Como o fluxo confia em automatic level shifter insertion, mensagens informando que não há LS strategy podem ser esperadas.
- Warnings de direct tie connections podem ser resolvidos com:

```tcl
connect_pg_net -automatic
```

---

# Lab 3 — Síntese conceitual

O Lab 3 ensina:

```text
1. MV-003 aparece quando supply set não tem funções definidas/refinadas.
2. Corrigir MV-003 exige create_supply_set -update com power/ground.
3. MV-002 pode indicar problema no primary handle do power domain.
4. Corrigir MV-002 pode ser feito por association ou refinement direto do handle.
5. report_supply_set ajuda a diagnosticar supply sets incompletos.
6. report_power_domains ajuda a diagnosticar domínio com primary supply incorreta.
7. report_pst mostra estados derivados do sistema.
8. Estados individuais de supply sets não bastam; o Power State Group precisa ter as combinações globais.
9. add_power_state -group ... -update adiciona estado global ausente.
10. check_mv_design + compile_fusion confirmam se o design ficou coerente.
```

---

# Tabela geral de erros e sintomas do lab

| Erro/warning | Onde aparece | Causa principal | Correção/ação |
|---|---|---|---|
| `UPF-168` | Lab 1, `load_upf` | `set_isolation` aponta para power domain não encontrado por erro de scope | Usar nome hierárquico correto ou ajustar criação do power domain |
| `CMD-013` | Lab 1 | Mensagem secundária citada no lab | Pode ser ignorada conforme lab |
| Warnings de tie-off | Lab 1/2/3 | Direct tie connections ainda não implementadas | `connect_pg_net` / `connect_pg_net -automatic` |
| Retention not implemented | Lab 1/2 | Etapa de mapping ainda não executada | `compile_fusion -to initial_map` com constraints carregadas |
| `MV-611` | Lab 2, `create_mv_cells -mapped -verbose` | 15 nets precisam LS, mas matching LS não foi encontrado | Investigar isolation/ELS/library |
| 73 isolation violations | Lab 2, `check_mv_design` | Faltam isolation cells | Criar `set_isolation CORE_IN` |
| 73 voltage shifting violations | Lab 2, `check_mv_design` | LS/ELS não inseridos; relacionado à falta de ISO | Corrigir isolation primeiro |
| `MV-1102` | Lab 2, `create_mv_cells -verbose` | LS não pode ser inserido porque não há ISO no path onde LS é requerido | Inserir/corrigir isolation |
| `MV-072` | Lab 2 final | LS não associado a explicit `set_level_shifter` | Esperado se usa automatic LS; opcionalmente criar strategies |
| `MV-027` | Lab 2/3 | Direct tie connections missing | `connect_pg_net -automatic` |
| `MV-003` | Lab 3, `commit_upf` | Supply set sem função power/ground refinada | `create_supply_set ss_core -update -function ...` |
| `MV-002` | Lab 3, `commit_upf` | Power domain/primary handle sem supply correta | `associate_supply_set ss_core -handle PD_CORE.primary` ou refinar `PD_CORE.primary` |

---

# Tabela geral de comandos do lab

| Comando | Uso no lab |
|---|---|
| `fc_shell` | Abrir Fusion Compiler |
| `source -echo ./rm_setup/fc_setup.tcl` | Carregar setup geral |
| `source -echo ./rm_setup/design_setup.tcl` | Criar library e carregar design |
| `load_upf ./design_data/pci_top.upf` | Carregar UPF |
| `commit_upf` | Finalizar/checar power intent |
| `report_power_domains` | Ver power domains, supplies e strategies |
| `gui_start` | Abrir GUI |
| `save_upf current_file.upf` | Salvar UPF em memória |
| `reset_upf` | Resetar UPF carregado |
| `check_mv_design` | Checar violações MV/UPF/PG |
| `create_mv_cells -mapped` | Inserir cells MV mapeadas |
| `create_mv_cells -verbose` | Obter detalhes/falhas de inserção |
| `get_related_supply_net` | Ver supply relacionada a port/pin |
| `set_isolation` | Criar isolation strategy |
| `set_retention` | Criar retention strategy |
| `map_retention_cell` | Mapear retention strategy para lib-cells |
| `report_pst -derived -nosplit -voltage_type all` | Ver PST derivada |
| `get_ports *save*` / `get_ports *restore*` | Achar ports de retention control |
| `get_lib_cells -filter "is_retention==true"` | Achar retention cells |
| `write_sdc -output SDC.txt` | Exportar constraints/tensões |
| `report_mv_lib_cells -retention` | Ver cells retention disponíveis |
| `analyze_mv_feasibility -retention` | Checar feasibility de retention |
| `compile_fusion -to initial_map` | Mapear retention cells |
| `compile_fusion -to logic_opto` | Compilar até logic optimization |
| `connect_pg_net -automatic` | Resolver direct tie/PG connections |
| `report_supply_set` | Reportar funções/states de supply set |
| `create_supply_set -update` | Refinar supply set/handle |
| `associate_supply_set` | Associar supply set a handle |
| `add_power_state -group ... -update` | Adicionar estado global ao PSG/PST |

---

# Conexão direta com os módulos teóricos

## Módulo Power Domains

O Lab 1 confirma:

```text
power domains dependem de scope
strategy precisa enxergar o domain correto
report_power_domains e GUI ajudam a localizar mismatch
```

## Módulo Power Strategies

O Lab 2 confirma:

```text
isolation e LS interagem
set_isolation pode destravar ELS/LS insertion
retention exige supply, save/restore e map_retention_cell
```

## Módulo Supply Network

O Lab 1 e Lab 3 confirmam:

```text
supply availability precisa ser limitada com -available_supplies
supply sets precisam de functions
handles podem ser associados ou refinados
```

## Módulo Power States

O Lab 3 confirma:

```text
states individuais de supply sets precisam ser combinados em Power State Group
report_pst mostra states derivados
add_power_state -group ... -update corrige state ausente
```

## Módulo Fusion Compiler and UPF

Todos os labs confirmam:

```text
load_upf → commit_upf → check_mv_design → create_mv_cells/compile_fusion → reports
```

## Módulo Fusion Compiler Reporting

Os labs usam exatamente o raciocínio de reporting:

```text
report_power_domains
report_supply_set
report_pst
get_related_supply_net
report_mv_lib_cells
check_mv_design
create_mv_cells -verbose
```

---

# Pontos fortes para prova

## 1. Scope em UPF

Pegadinha provável:

```text
O UPF tem create_power_domain, mas a strategy não encontra o domain.
```

Resposta:

```text
Pode ser problema de scope/nome hierárquico. Usar nome scoped ou ajustar criação do domain.
```

## 2. Supply availability

Pegadinha provável:

```text
Todos os supply sets aparecem disponíveis em todos os domínios.
```

Resposta:

```text
Usar create_power_domain -available_supplies para restringir.
```

## 3. MV-003

Pegadinha provável:

```text
commit_upf acusa erro em supply set.
```

Resposta:

```text
Supply set precisa ter functions refinadas, como power e ground.
```

Exemplo:

```tcl
create_supply_set ss_core -update \
  -function {power VDD_CORE} \
  -function {ground VSS}
```

## 4. MV-002

Pegadinha provável:

```text
Power domain não tem primary supply corretamente associada.
```

Resposta:

```text
Associar supply set ao primary handle ou refinar o handle.
```

Exemplo:

```tcl
associate_supply_set ss_core -handle PD_CORE.primary
```

ou:

```tcl
create_supply_set PD_CORE.primary -update \
  -function {power VDD_CORE} \
  -function {ground VSS}
```

## 5. MV-1102

Pegadinha provável:

```text
Level shifter não pode ser inserido.
```

Resposta:

```text
Pode faltar isolation cell no caminho onde LS é requerido.
Corrigir isolation primeiro.
```

## 6. Retention

Pegadinha provável:

```text
Qual supply usar para retention?
```

Resposta:

```text
Supply set que fica ON em todos os estados necessários e opera na tensão adequada, aqui ss_ret em 1.16 V.
```

## 7. Estados globais

Pegadinha provável:

```text
Supply sets têm states individuais, mas PST/PSG está incompleta.
```

Resposta:

```text
Adicionar state ao group com add_power_state -group ... -update.
```

---

# Perguntas realistas para simulado

## Questão 1

Durante `load_upf`, aparece:

```text
UPF-168: cannot find power domain 'PD_MACRO_WRITE' for set_isolation strategy MACRO_WRITE_IN
```

Qual é a causa mais provável?

Resposta esperada:

```text
A strategy está referenciando o power domain em escopo errado ou sem nome hierárquico adequado.
```

---

## Questão 2

O UPF contém quatro `create_power_domain`, mas `report_power_domains` no top mostra apenas três. Qual comando pode ajudar a comparar o UPF carregado com as criações de domain?

Resposta esperada:

```tcl
save_upf current_file.upf
sh grep create_power_domain current_file.upf
```

---

## Questão 3

Após `commit_upf`, aparece `MV-003` em `ss_core`. O que falta?

Resposta esperada:

```text
Faltam functions do supply set, como power e ground.
```

Comando:

```tcl
create_supply_set ss_core -update \
  -function {power VDD_CORE} \
  -function {ground VSS}
```

---

## Questão 4

Como corrigir um problema em que `PD_CORE.primary` não está associado à supply correta?

Resposta esperada:

```tcl
associate_supply_set ss_core -handle PD_CORE.primary
```

ou:

```tcl
create_supply_set PD_CORE.primary -update \
  -function {power VDD_CORE} \
  -function {ground VSS}
```

---

## Questão 5

`create_mv_cells -verbose` mostra `MV-1102`: level shifter cannot be inserted because there are no isolation cells in the path. Qual a ação?

Resposta esperada:

```text
Criar/corrigir a isolation strategy no caminho afetado, por exemplo set_isolation CORE_IN.
```

---

## Questão 6

Qual comando limita supply sets disponíveis dentro de um power domain?

Resposta esperada:

```tcl
create_power_domain <PD> -available_supplies { ... }
```

---

## Questão 7

Qual comando permite verificar quais states estão definidos em uma supply set?

Resposta esperada:

```tcl
report_supply_set <supply_set>
```

---

## Questão 8

Qual comando permite ver a PST derivada com todas as tensões?

Resposta esperada:

```tcl
report_pst -derived -nosplit -voltage_type all
```

---

## Questão 9

Qual comando adiciona um estado global ausente no Power State Group?

Resposta esperada:

```tcl
add_power_state -group PST -state OFF_STATE \
  {-logic_expr { ss_main==main_OFF && ss_core == ON_1p16 && ss_macro == ON_0p95 }} -update
```

---

## Questão 10

Quais warnings podem ser esperados no final do Lab 2 se o fluxo usa automatic LS insertion e ainda não implementou direct tie connections?

Resposta esperada:

```text
MV-072 para level shifters não associados a set_level_shifter strategies.
MV-027 para direct tie connections missing.
```

---

# Checklist final de revisão do Lab Guide

```text
1. Sei explicar o erro UPF-168?
2. Sei diferenciar power domain criado no UPF e power domain visível no scope atual?
3. Sei usar report_power_domains?
4. Sei usar save_upf + grep create_power_domain?
5. Sei o que -available_supplies faz?
6. Sei explicar MV-003?
7. Sei refinar ss_core com create_supply_set -update?
8. Sei explicar MV-002?
9. Sei associar ss_core a PD_CORE.primary?
10. Sei refinar diretamente PD_CORE.primary?
11. Sei explicar MV-1102?
12. Sei escrever set_isolation CORE_IN?
13. Sei por que isolation pode destravar level shifter/ELS insertion?
14. Sei escolher ss_ret como retention supply?
15. Sei escrever set_retention CORE_RET?
16. Sei escrever map_retention_cell CORE_RET?
17. Sei usar report_mv_lib_cells -retention?
18. Sei usar report_pst -derived -nosplit -voltage_type all?
19. Sei adicionar OFF_STATE ao group PST?
20. Sei quais warnings finais são esperados e quais exigem ação?
```

---

# Conclusão didática

Este lab é extremamente útil para prova porque transforma os conceitos dos slides em sintomas reais da ferramenta.

Os slides ensinam:

```text
power domain, supply set, isolation, retention, PST
```

O lab ensina:

```text
quando isso dá erro, qual mensagem aparece e como corrigir.
```

Portanto, para preparação de prova, este lab deve ser usado como base para questões de cenário, não apenas memorização de comandos.

A recomendação é fazer um simulado realista com:

- questões conceituais;
- questões de comando;
- questões de interpretação de erro;
- questões de múltipla escolha com pegadinhas;
- questões de fluxo;
- questões de “qual próximo comando?”;
- questões do tipo “qual causa provável?”;
- questões sobre warnings esperados versus erros reais.
