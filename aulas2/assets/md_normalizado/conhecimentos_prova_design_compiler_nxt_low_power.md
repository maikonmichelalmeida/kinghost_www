# Conhecimentos obtidos da prova — Design Compiler NXT - Low Power

## Controle do arquivo

- **Curso:** 12 — Design Compiler NXT - Low Power
- **Base usada:** blocos 089 a 098 processados em Markdown + Lab Guide + simulado de 25 questões
- **Resultado do simulado:** 25/25 — 100% de acerto
- **Objetivo deste MD:** consolidar as pegadinhas, comandos, conceitos e gabaritos confirmados pela prova para uso em próximos simulados, revisões e consultas rápidas.

---

# 1. Resumo executivo

A prova confirmou que o curso cobra fortemente a interpretação direta dos slides e labs, com ênfase em comandos Tcl do Design Compiler NXT, opções de low power e detalhes de reporting.

Os temas mais cobrados foram:

- **switching activity** e arquivos SAIF/FSDB/VCD;
- **modelo médio de atividade**, usando `toggle_rate` e `static_probability`;
- **Total Power Optimization (TPO)**;
- **clock gating** comum, hierárquico, multistage e fisicamente consciente;
- **self-gating**, principalmente dependência de SAIF e cenários com `dynamic_power`;
- **multibit banking** e **de-banking**;
- **DesignWare minPower**;
- **IC Compiler II Link / enhanced low-power placement (eLPP)**;
- **report_power`, `report_power_calculation`, `report_saif` e `report_activity`;
- detalhes de **pre-CTS power reporting** e uso de `set_ideal_network`;
- mensagens e opções de fluxo vistas no Lab Guide.

A estratégia vencedora foi priorizar o material processado do curso, sem extrapolar demais. Quando uma resposta tecnicamente geral poderia ter nuances, o gabarito seguiu a formulação dos slides.

---

# 2. Gabarito consolidado das 25 questões

| Nº | Resposta correta | Certeza | Conceito cobrado |
|---:|---|---:|---|
| 1 | Increase in number of clock gating opportunities & reduction in number of clock gates | 98% | `compile_clock_gating_through_hierarchy` |
| 2 | `analyze_datapath` | 99% | DesignWare minPower / datapath content |
| 3 | Switching activity on all nets | 99% | `report_power` |
| 4 | true | 99% | Scenario reduction no modo topográfico |
| 5 | `-verbose` | 99% | `report_power_calculation` |
| 6 | true | 99% | SAIF para toggle-rate clustering e comparator selection |
| 7 | true | 99% | Smaller comparator cells reduzem overhead |
| 8 | Yes, from constraints | 85% | Inferência/default de switching activity |
| 9 | Dynamic | 99% | Self-gating reduz potência dinâmica |
| 10 | true | 99% | De-banking só no incremental compile em SPG |
| 11 | false | 99% | Pre-CTS: recomenda excluir clock network switching power |
| 12 | true | 99% | Esforço de dynamic power-driven placement pode mudar |
| 13 | `set_clock_gating_style -num_stages` | 99% | Número máximo de estágios de clock gating |
| 14 | If enough timing slack available in register's data pin | 99% | Critério de inserção de self-gate |
| 15 | Increases area/power | 99% | Multibit banking reduz área/potência |
| 16 | Non timing-driven | 99% | Multibit banking por padrão não é timing-driven |
| 17 | `-missing` | 99% | `report_saif -rtl -missing` |
| 18 | true | 99% | Self-gating só em cenários com `dynamic_power` |
| 19 | true | 99% | SAIF mapping flow antes da síntese |
| 20 | One and Two | 90% | CTS balanceia pinos de clock dos registradores folha, não ICGs |
| 21 | Toggle Rate (TR), Static probability (SP) | 99% | Averaged power analysis |
| 22 | true | 99% | Banking manual após leitura do RTL |
| 23 | Increase in power consumption | 95% | PACG pode aumentar consumo |
| 24 | Waveform and Average | 99% | Formatos de atividade da simulação |
| 25 | false | 99% | Clock gates existentes não preservados podem ser removidos |

---

# 3. Lições centrais extraídas da prova

## 3.1 Clock gating através de hierarquia

Questão confirmada:

> When enabling `compile_clock_gating_through_hierarchy`, the tool performs clock gating through hierarchy boundaries. Which one is true?

Resposta:

```text
Increase in number of clock gating opportunities & reduction in number of clock gates
```

O material mostra que, por padrão, a inserção de clock gating ocorre na hierarquia local do banco de registradores. Quando se habilita:

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

ou a variável equivalente do fluxo, o Design Compiler NXT passa a buscar oportunidades de clock gating atravessando fronteiras hierárquicas.

Isso pode:

- encontrar enables compartilhados entre blocos;
- aumentar o número de oportunidades de clock gating;
- reduzir a quantidade total de ICGs;
- agrupar melhor registradores que, localmente, pareciam separados.

Pegadinha: o objetivo não é simplesmente “aumentar clock gates”. O ganho vem de **mais oportunidades**, mas **menos clock gates** por compartilhamento mais eficiente.

---

## 3.2 `analyze_datapath` no DesignWare minPower

Questão confirmada:

> Add the ______ command after first compile to report the total datapath content percentage.

Resposta:

```tcl
analyze_datapath
```

O comando aparece no conteúdo de **DesignWare minPower**. Ele deve ser usado depois do primeiro compile para verificar a porcentagem total de conteúdo datapath no design, como:

- adders;
- multipliers;
- shifters;
- subtractors;
- estruturas aritméticas.

Esse diagnóstico ajuda a decidir se faz sentido habilitar:

```tcl
set_app_var power_enable_minpower true
```

O DesignWare minPower é voltado especialmente a designs com muito datapath, onde a ferramenta pode aplicar arquiteturas e estruturas mais econômicas em potência.

---

## 3.3 `report_power` precisa de switching activity em todas as nets

Questão confirmada:

> To accurately report power for a design, which of the following do you need?

Resposta:

```text
Switching activity on all nets
```

O comando:

```tcl
report_power
```

calcula e reporta potência para o design. Para que esse cálculo seja preciso, ele precisa de informação de atividade de chaveamento em todas as nets relevantes.

Se uma net não tem atividade anotada, a ferramenta pode:

- usar atividade default;
- inferir atividade;
- propagar atividade a partir de pontos anotados.

Mas, para precisão, o ideal é fornecer atividade realista via SAIF/FSDB/VCD ou comandos adequados.

---

## 3.4 Scenario reduction no modo topográfico

Questão confirmada:

> Topographical mode automatically performs scenario reduction on the current set of active scenarios to reduce memory and runtime.

Resposta:

```text
true
```

O material confirma que o modo topográfico faz automaticamente redução de cenários ativos para economizar memória e runtime.

Atenção: o cenário dominante de timing nem sempre é o cenário dominante de potência. O Design Compiler NXT pode adicionar um cenário dominante extra de potência quando o cenário dominante de timing não coincide com o cenário dominante de power.

Resumo:

```text
Dominant timing scenario != necessarily dominant power scenario
```

---

## 3.5 `report_power_calculation -verbose`

Questão confirmada:

> What option do you use to report power calculation in more detail?

Resposta:

```tcl
-verbose
```

O comando:

```tcl
report_power_calculation
```

é usado para detalhar como a potência foi calculada para:

- potência interna de um pino;
- leakage power de uma célula;
- switching power de uma net.

O material recomenda fortemente usar:

```tcl
report_power_calculation -verbose
```

porque `-verbose` aumenta a quantidade de informação exibida.

Pegadinha: não é `-detail`, nem `-all`.

---

# 4. Switching activity: SAIF, FSDB, VCD e modelo médio

## 4.1 Tipos de arquivo de atividade

Questão confirmada:

> From which of the following files can you save the switching activity from simulation?

Resposta:

```text
Waveform and Average
```

A atividade de chaveamento gerada por simulação pode ser salva em dois grandes formatos:

### Waveform

Exemplos:

```text
FSDB
VCD
```

São arquivos de forma de onda, com transições ao longo do tempo.

### Averaged

Exemplo:

```text
SAIF
```

O SAIF não guarda a waveform completa. Ele guarda uma forma resumida/média da atividade.

---

## 4.2 Modelo médio de switching activity

Questão confirmada:

> In averaged power analysis, switching activity is modeled with the ______ following variables.

Resposta:

```text
Toggle Rate (TR), Static probability (SP)
```

No modelo médio de potência, a atividade é descrita principalmente por:

```text
Toggle Rate (TR)
Static Probability (SP)
```

### Toggle Rate (TR)

É o número de transições por unidade de tempo.

Para clock, o material destaca que:

```text
TR do clock = 2 × frequência
```

porque em cada ciclo há duas transições: subida e descida.

### Static Probability (SP)

É a probabilidade de um nó estar em nível lógico 1.

Exemplo:

```text
SP = 0.7
```

significa que o sinal fica em 1 durante aproximadamente 70% do tempo.

---

## 4.3 `report_saif -rtl -missing`

Questão confirmada:

> Which option of `report_saif -rtl` should you use to list the design elements that do not have user-specified switching activity annotation?

Resposta:

```tcl
-missing
```

Comando cobrado:

```tcl
report_saif -rtl -hierarchy -missing
```

ou em forma reduzida conforme a prova:

```tcl
report_saif -rtl -missing
```

Ele lista elementos do design que não possuem anotação de switching activity especificada pelo usuário.

Isso é importante porque pontos não anotados podem receber atividade default e distorcer a análise de potência.

---

## 4.4 Sem atividade simulada: inferência e constraints

Questão confirmada:

> If there is no simulated activity, does the tool infer activity automatically?

Resposta aceita no simulado:

```text
Yes, from constraints
```

Ponto importante: esta questão tem nuance. O material do curso trabalha com três fontes de atividade:

1. atividade de simulação RTL/gate-level via SAIF;
2. atividade default ou definida pelo usuário;
3. atividade propagada/inferida pela ferramenta.

Quando não há atividade simulada, a ferramenta pode usar informações de:

- constraints;
- clocks;
- generated clocks;
- case analysis;
- defaults;
- comandos de inferência, como `infer_switching_activity`.

O gabarito da prova simplifica isso como:

```text
Yes, from constraints
```

Para prova, seguir essa formulação.

---

# 5. Total Power Optimization (TPO)

## 5.1 Ativação de TPO

O curso reforça que o Design Compiler NXT não otimiza dynamic power por padrão. Para ativar a otimização total de potência, usa-se:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Também é possível usar:

```tcl
set_qor_strategy -stage synthesis -metric total_power
```

O `set_qor_strategy -metric total_power` inclui configurações de timing e também habilita a variável de TPO.

## 5.2 Cenário com dynamic power

Para TPO fazer sentido em fluxo MCMM, é necessário ter pelo menos um cenário com:

```tcl
set_scenario_options -setup true -dynamic_power true
```

O `-setup true` é necessário porque o cálculo de potência interna depende de informação de transição de nets, que vem da análise de timing/setup.

---

# 6. Clock gating

## 6.1 Conceito

Clock gating reduz potência dinâmica desligando o clock de registradores quando eles não precisam atualizar seu valor.

O comando básico visto no curso é:

```tcl
compile_ultra -gate_clock
```

Com SPG:

```tcl
compile_ultra -spg -gate_clock
```

No lab, o fluxo usava frequentemente:

```tcl
compile_ultra -spg -no_autoungroup -gate_clock
```

## 6.2 Benefício principal

Clock gating reduz consumo dinâmico porque evita toggle em:

- clock buffers;
- clock tree;
- pinos de clock dos registradores;
- lógica interna dos registradores.

## 6.3 Clock gating style

Questão confirmada:

> How can you constrain a design to use maximum number of clock-gating stages?

Resposta:

```tcl
set_clock_gating_style -num_stages
```

A forma geral é:

```tcl
set_clock_gating_style -num_stages <integer>
```

Importante:

- `-num_stages` define o **número máximo** de estágios permitidos;
- não força exatamente aquele número de estágios;
- default é 1 estágio;
- usado em multistage clock gating.

## 6.4 Pre-CTS e `set_ideal_network`

Questão confirmada:

> It is not recommended to exclude clock network switching power when reporting pre-CTS power.

Resposta:

```text
false
```

A frase é falsa porque o material recomenda sim excluir o clock network switching power no relatório pre-CTS.

Motivo:

Antes do CTS, a rede de clock ainda não foi construída/bufferizada realisticamente. Nets de clock com fanout alto podem gerar potência irrealista.

Comando recomendado:

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
```

E então:

```tcl
report_power
```

O objetivo é reduzir a switching power da clock network para zero no relatório pre-CTS.

Importante: a potência interna dos ICGs continua sendo considerada.

---

# 7. Advanced Clock Gating

## 7.1 Multistage clock gating

O número máximo de estágios é controlado por:

```tcl
set_clock_gating_style -num_stages <integer>
```

A ferramenta procura fatores comuns nos enables. Clock gates mais próximos da fonte de clock usam condições compartilhadas por mais registradores downstream.

## 7.2 Preservação e transformação de ICGs existentes

Clock gates existentes podem ser transformados por:

- split;
- merge;
- un-gate;
- collapse stages;
- expand stages;
- remove redundancy.

Para preservar clock gates:

```tcl
set_preserve_clock_gate [get_cells <icg_cells>]
```

Para preservar fanout:

```tcl
set_preserve_clock_gate -dont_modify_fanout [get_cells <icg_cells>]
```

Para preservar enable:

```tcl
set_preserve_clock_gate -dont_modify_enable [get_cells <icg_cells>]
```

Para impedir quase todas as transformações:

```tcl
set_preserve_clock_gate -dont_modify_fanout -dont_modify_enable [get_cells <icg_cells>]
```

## 7.3 Remoção de clock gates existentes

Questão confirmada:

> Existing clock gates that are not preserved cannot be removed during clock gate optimization through ungating, collapsing, and merging.

Resposta:

```text
false
```

A frase é falsa porque o material diz que clock gates existentes que **não foram preservados** podem ser automaticamente removidos durante otimização por:

- ungating;
- collapsing;
- merging.

Comando relacionado:

```tcl
remove_clock_gating \
    [-gated_registers gated_register_list] \
    [-min_bitwidth minsize_value] \
    [-gating_cells clock_gating_cells_list] \
    [-all]
```

## 7.4 PACG — Physically-Aware Clock Gating

Questão confirmada:

> What is the impact of physically-aware clock gating?

Resposta:

```text
Increase in power consumption
```

O PACG melhora timing do enable do ICG, mas pode aumentar consumo de potência.

Comando:

```tcl
set_app_var power_cg_physically_aware_cg true
```

O objetivo do PACG é aumentar a latência até ICGs com enable timing crítico, melhorando o timing do enable.

Efeito colateral:

```text
Can lead to increased power consumption
```

Para prova, quando perguntarem impacto em potência, marcar aumento de consumo.

---

# 8. Self-gating

## 8.1 Conceito principal

Questão confirmada:

> Self-gating is an optimization technique used to reduce ______ kind of power consumption?

Resposta:

```text
Dynamic
```

Self-gating reduz potência dinâmica desligando o clock de registradores quando a entrada `D` permanece igual ao valor armazenado `Q`.

Comando de síntese:

```tcl
compile_ultra -gate_clock -self_gating
```

## 8.2 Critério de inserção

Questão confirmada:

> When is a self-gate inserted?

Resposta:

```text
If enough timing slack available in register's data pin
```

A inserção de self-gating depende de:

- haver slack suficiente no pino de dados do registrador;
- a potência dinâmica interna do circuito ser reduzida;
- o cenário ativo possuir `dynamic_power`.

O algoritmo considera timing e power para não piorar QoR.

## 8.3 Self-gating em MCMM

Questão confirmada:

> Self-gating works only for scenarios with the dynamic power option.

Resposta:

```text
true
```

Configuração típica:

```tcl
create_scenario power_scenario
set_scenario_options -setup true -dynamic_power true
read_saif
```

Mensagem de sucesso vista no material:

```text
Information: Performing self-gating power optimization based on scenario: <scenario> (PWR-949)
```

Se não houver cenário com setup e dynamic power:

```text
Warning: Skipping self-gating power optimization because no scenarios with setup and dynamic power options are available. (PWR-948)
```

## 8.4 SAIF para clustering e comparador

Questão confirmada:

> SAIF file is required for accurate toggle-rate based clustering and comparator cell selection.

Resposta:

```text
true
```

O SAIF é necessário para seleção correta de:

- bancos de registradores com toggle rates semelhantes;
- células comparadoras mais adequadas;
- OR/NAND/XOR conforme probabilidade estática.

## 8.5 Comparator cell selection

Questão confirmada:

> Smaller comparator cells help to reduce self-gating area and power overheads.

Resposta:

```text
true
```

O self-gating tradicional usa XOR para comparar `D` e `Q`.

O Design Compiler NXT pode escolher automaticamente:

- OR, para registradores que ficam em 0 a maior parte do tempo;
- NAND, para registradores que ficam em 1 a maior parte do tempo;
- XOR, para os demais casos.

Células comparadoras menores reduzem overhead de área e potência.

---

# 9. Multibit banking

## 9.1 Conceito principal

Multibit banking junta registradores de 1 bit em registradores multibit.

Questão confirmada:

> Which of the following is not true regarding merging single bit registers with multibit registers?

Resposta:

```text
Increases area/power
```

Essa é a opção falsa porque multibit banking normalmente leva a:

- menor área;
- menor potência;
- compartilhamento de transistores;
- layout otimizado;
- menor comprimento total da clock tree;
- menor número de buffers de clock.

## 9.2 Por padrão não é timing-driven

Questão confirmada:

> By default multibit banking is ________.

Resposta:

```text
Non timing-driven
```

O slide diz:

```text
MB banking is not timing-driven, by default.
```

Por padrão, o objetivo é obter o melhor banking ratio.

Para evitar banking em caminhos críticos:

```tcl
set_multibit_options -mode timing_driven
```

## 9.3 Banking manual

Questão confirmada:

> It is possible for registers can be manually marked for multibit banking after reading RTL.

Resposta:

```text
true
```

Comando:

```tcl
create_multibit {x_reg y_reg} -name xy_mb
```

Depois:

```tcl
compile_ultra -scan -gate_clock -spg
```

O mapping para multibit acontece durante compile.

## 9.4 De-banking

Questão confirmada:

> De-banking is triggered only during incremental compile in Synopsys Physical Guidance (SPG) mode.

Resposta:

```text
true
```

Exemplo:

```tcl
set_multibit_options -mode timing_only -critical_range 0.05
compile_ultra -scan -spg -incremental
```

O de-banking tenta desfazer bancos multibit em caminhos críticos se isso melhorar timing.

Também existe de-banking manual:

```tcl
split_register_bank reg_6_bit_inst \
    -lib_cells { mylib/REG_4_BIT mylib/REG_2_BIT }
```

---

# 10. IC Compiler II Link e Enhanced Low-Power Placement

## 10.1 eLPP

Questão confirmada:

> It is possible to change the effort during dynamic power-driven placement.

Resposta:

```text
true
```

A variável é:

```tcl
set_app_var placer_enhanced_low_power_effort [ none | low | medium | high ]
```

Para habilitar eLPP, normalmente é necessário:

```tcl
set_app_var compile_enable_total_power_optimization true
```

E, em NDM mode, o comando:

```tcl
set_qor_strategy -metric total_power
```

habilita eLPP com esforço `low`.

## 10.2 Mensagens importantes

Mensagem de TPO habilitado:

```text
Information: Design Compiler NXT Total Power Optimization is enabled. (PWR-1101)
```

Mensagem indicando otimização de potência com cenário e switching activity:

```text
Information: Performing power optimization on scenario: s2 and dynamic power optimization with switching activity from scenario: s1. (PWR-850)
```

---

# 11. DesignWare minPower

## 11.1 Aplicação

DesignWare minPower é voltado para designs com datapath intensivo.

Ele pode aplicar:

- arquiteturas de datapath de baixa potência;
- reestruturação power-aware;
- datapath gating;
- IPs low power.

## 11.2 Comandos

Verificar conteúdo datapath após primeiro compile:

```tcl
analyze_datapath
```

Relatórios úteis:

```tcl
report_area -designware
report_resources -hier
```

Habilitar minPower:

```tcl
set_app_var power_enable_minpower true
```

Default:

```text
false
```

---

# 12. Reporting de potência

## 12.1 `report_power`

O comando:

```tcl
report_power
```

reporta potência por power group:

- `io_pad`;
- `memory`;
- `black_box`;
- `clock_network`;
- `register`;
- `sequential`;
- `combinational`.

Pode reportar um grupo específico:

```tcl
report_power -group $group [-net] [-cell]
```

## 12.2 Power groups

| Grupo | Significado |
|---|---|
| `io_pad` | Células definidas no pad_cell_group |
| `memory` | Células definidas no memory_group |
| `black_box` | Células sem descrição funcional na biblioteca |
| `clock_network` | Células na rede de clock, excluindo io_pad |
| `register` | Latches/flip-flops dirigidos pela clock network |
| `sequential` | Latches/flip-flops clockados por sinais fora da clock network |
| `combinational` | Células funcionais não sequenciais |

## 12.3 `report_power_calculation`

Comando:

```tcl
report_power_calculation
```

Opção importante:

```tcl
-verbose
```

Usado para detalhar:

- internal power de pino;
- leakage power de célula;
- switching power de net.

---

# 13. CTS, ICG enable timing e pinos balanceados

Questão confirmada:

> Clock tree synthesis balances the clock latencies of leaf-level register clock pins (not ICGs) in the same clock tree. What is the number of leaf-level register clock pins that are balanced?

Resposta:

```text
One and Two
```

O slide de **Post-CTS ICG Enable Timing Problem** diz que CTS balanceia as latências dos pinos de clock dos registradores folha, não dos ICGs.

No desenho, o ICG está mais próximo da fonte de clock e não entra no mesmo balanceamento dos pinos folha. Isso pode causar violação de setup no enable do ICG.

Resumo:

```text
CTS balances leaf-level register clock pins.
CTS does not balance ICG clock pins as leaf sinks in the same way.
```

---

# 14. SAIF mapping flow

Questão confirmada:

> If gate-level SAIF is not available post-synthesis, you should enable the SAIF mapping flow before synthesis optimization.

Resposta:

```text
true
```

Isso é necessário porque nomes RTL e nomes gate-level podem mudar durante:

- elaboration;
- compile;
- register replication;
- multibit banking;
- uso de saídas invertidas;
- `change_names`.

Comandos importantes:

```tcl
set_app_var hdlin_enable_upf_compatible_naming true
saif_map -start
```

Leitura de SAIF com mapeamento:

```tcl
read_saif -input risc_core_tb.saif -auto_map_names \
    -instance risc_core_tb/risc_core
```

Escrita de mapping file:

```tcl
saif_map -write_map ./results/primepower_dc.saif.map -type primepower
```

Mensagem importante:

```text
Information: The SAIF name mapping information database is now active. (PWR-602)
```

---

# 15. Pegadinhas confirmadas pela prova

## 15.1 “Not recommended” invertido

A questão 11 usa uma negação:

```text
It is not recommended to exclude clock network switching power when reporting pre-CTS power.
```

O correto é marcar:

```text
false
```

Porque é recomendado excluir essa parcela no pre-CTS.

## 15.2 PACG melhora timing, mas pode aumentar power

PACG não é cobrado como “reduz potência”. O slide alerta que pode aumentar consumo.

Resposta de prova:

```text
Increase in power consumption
```

## 15.3 Multibit banking não aumenta área/power

Se a questão perguntar o que é falso:

```text
Increases area/power
```

é a opção falsa.

## 15.4 De-banking só em incremental compile SPG

Questão literal do slide:

```text
De-banking is triggered only during incremental compile in SPG mode.
```

Resposta:

```text
true
```

## 15.5 Self-gating depende de dynamic power scenario

Sem cenário com:

```tcl
-setup true -dynamic_power true
```

self-gating pode ser pulado.

## 15.6 `-verbose`, não `-detail`

Para detalhar power calculation:

```tcl
report_power_calculation -verbose
```

## 15.7 `-missing`, não `-incomplete`

Para listar falta de annotation:

```tcl
report_saif -rtl -missing
```

---

# 16. Comandos que precisam ficar memorizados

## Power analysis

```tcl
report_power
report_power -group $group [-net] [-cell]
report_power_calculation -verbose
report_saif -rtl -hierarchy -missing
report_activity -driver
get_switching_activity [all_inputs]
```

## Switching activity

```tcl
read_saif design_sim.saif
read_saif -input top_rtl.fsdb.saif -instance_name top_tb/top
set_switching_activity -toggle_rate 0 -static_probability 0 [get_ports SE]
set_case_analysis 0 [get_ports SE]
infer_switching_activity -sci_based all -apply
```

## TPO

```tcl
set_app_var compile_enable_total_power_optimization true
set_qor_strategy -stage synthesis -metric total_power
set_scenario_options -setup true -dynamic_power true
```

## Clock gating

```tcl
compile_ultra -gate_clock
compile_ultra -spg -no_autoungroup -gate_clock
set_clock_gating_style -num_stages <integer>
set_clock_gating_style -minimum_bitwidth <integer>
set_clock_gating_style -max_fanout <integer>
report_clock_gating
report_clock_gating -ungated
all_clock_gates
```

## Hierarchical clock gating

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

## Identificação de clock gates existentes

```tcl
identify_clock_gating
set_app_var power_cg_auto_identify true
```

## Preservação e remoção

```tcl
set_preserve_clock_gate [get_cells uicg_b]
set_preserve_clock_gate -dont_modify_fanout [get_cells uicg_a]
set_preserve_clock_gate -dont_modify_enable [get_cells uicg_a]
remove_clock_gating -all
```

## Self-gating

```tcl
compile_ultra -gate_clock -self_gating
set_self_gating_options
set_self_gating_objects
report_self_gating
report_self_gating -ungated
all_self_gates
```

## PACG

```tcl
set_app_var power_cg_physically_aware_cg true
```

## Multibit

```tcl
set_app_var hdlin_infer_multibit default_all
identify_register_banks -output_file create_reg.tcl
source create_reg.tcl
create_multibit {x_reg y_reg} -name xy_mb
set_multibit_options -mode timing_driven
set_multibit_options -mode timing_only -critical_range 0.05
split_register_bank reg_6_bit_inst -lib_cells { mylib/REG_4_BIT mylib/REG_2_BIT }
report_multibit -hierarchical
report_multibit_banking -hierarchical
get_cells -filter "multibit_width > 1"
```

## ICC II Link / eLPP

```tcl
set_app_var placer_enhanced_low_power_effort low
set_app_var placer_enhanced_low_power_effort medium
set_app_var placer_enhanced_low_power_effort high
```

## DesignWare minPower

```tcl
analyze_datapath
report_area -designware
report_resources -hier
set_app_var power_enable_minpower true
```

## Pre-CTS report

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
report_power
```

## SAIF mapping

```tcl
set_app_var hdlin_enable_upf_compatible_naming true
saif_map -start
saif_map -write_map ./results/primepower_dc.saif.map -type primepower
```

---

# 17. Mensagens PWR importantes

| Código | Significado |
|---|---|
| `PWR-1101` | Confirma que Design Compiler NXT Total Power Optimization está habilitado |
| `PWR-850` | Indica otimização de potência em cenário e dynamic power com switching activity |
| `PWR-949` | Self-gating power optimization está sendo executado com base em cenário |
| `PWR-948` | Self-gating foi pulado por ausência de cenário com setup e dynamic power |
| `PWR-602` | SAIF name mapping database está ativo |
| `PWR-876` | Início da identificação de clock gating circuitry |
| `PWR-877` | Gating elements identificados automaticamente |

---

# 18. Estratégia para próximos simulados

## 18.1 Como responder

1. Verificar se a questão é de **círculo** ou **quadrado**.
   - Círculo: uma alternativa.
   - Quadrado: pode haver múltiplas alternativas.

2. Procurar termos literais do slide:
   - `required`;
   - `recommended`;
   - `default`;
   - `only`;
   - `not`;
   - `must`;
   - `can lead to`;
   - `before compile`;
   - `after first compile`;
   - `incremental compile`;
   - `SPG mode`.

3. Priorizar o gabarito do curso acima de interpretações gerais.

4. Quando a questão usar negação, reescrever mentalmente:
   - “It is not recommended...”;
   - “is not true”;
   - “cannot be removed”.

5. Associar comandos aos temas:
   - `analyze_datapath` → DesignWare minPower;
   - `set_clock_gating_style -num_stages` → multistage clock gating;
   - `report_saif -rtl -missing` → atividade ausente;
   - `report_power_calculation -verbose` → cálculo detalhado de potência;
   - `set_ideal_network` → pre-CTS clock network switching power;
   - `set_multibit_options -mode timing_driven` → evitar banking em timing crítico;
   - `infer_switching_activity -sci_based all -apply` → inferir atividade quando SAIF não está disponível.

---

# 19. Conclusão

O simulado confirmou que o acervo produzido está suficientemente forte para responder questões do curso **Design Compiler NXT - Low Power** com alta precisão.

Os pontos de maior valor para retenção são:

- TPO não é default; precisa ser habilitado.
- Dynamic power exige cenário com `-dynamic_power true` e `-setup true`.
- Power report preciso exige switching activity.
- SAIF é o caminho recomendado para atividade realista.
- Self-gating depende fortemente de SAIF e dynamic power scenario.
- Clock gating through hierarchy aumenta oportunidades e reduz número de clock gates.
- PACG melhora enable timing, mas pode aumentar power.
- Multibit banking reduz área/power e por padrão não é timing-driven.
- De-banking só ocorre em incremental compile no modo SPG.
- Pre-CTS power report deve zerar clock network switching power com `set_ideal_network`.
- `report_power_calculation -verbose` e `report_saif -rtl -missing` são comandos de prova.
