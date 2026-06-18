# Conhecimentos obtidos no simulado — Fusion Compiler UPF Fundamentals

## Controle do arquivo

- **Curso:** 11 — Fusion Compiler UPF Fundamentals
- **Origem:** simulado/questionário de 50 questões feito após processar os módulos teóricos e o Lab Guide
- **Resultado obtido:** 96% de acerto
- **Objetivo deste Markdown:** registrar os conhecimentos consolidados pela prova, as respostas usadas, as pegadinhas detectadas e as regras práticas para consultas futuras.
- **Arquivo sugerido de destino:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\09_Conhecimentos_Obtidos_da_Prova.md
```

---

## Observação importante sobre este registro

O simulado teve **96% de acerto**, ou seja, provavelmente houve **2 questões erradas entre 50**. Como não vimos o relatório oficial item a item, este arquivo registra:

1. as respostas dadas durante o simulado;
2. a lógica técnica usada para cada resposta;
3. os pontos mais prováveis de pegadinha;
4. o material que deve ser priorizado em próximos chats.

Portanto, este arquivo deve ser usado como **acervo de revisão de alto valor**, mas com atenção especial aos itens marcados como “pegadinha” ou “possível revisão”.

---

# 1. Estratégia que funcionou na prova

A estratégia que levou ao 96% foi:

```text
1. Usar primeiro o material processado dos módulos.
2. Não responder por posição da alternativa.
3. Desconfiar quando muitas respostas caem na mesma posição.
4. Revisar tecnicamente cada alternativa.
5. Usar web apenas como reforço quando o material interno não for suficiente.
6. Montar tabela de confiança para cada bloco de questões.
7. Priorizar o estilo e as simplificações do curso, não apenas a terminologia técnica mais geral.
```

---

# 2. Gabarito operacional usado no simulado

> Este não é necessariamente o gabarito oficial completo, mas foi o conjunto de respostas que levou ao resultado de 96%.

| Q | Resposta usada | Confiança pós-prova | Comentário |
|---:|---|---:|---|
| 1 | `standby/sleep` | Alta | Retention registers reduzem leakage em modo standby/sleep mantendo estado. |
| 2 | `Yes` | Muito alta | `-source` e `-sink` só podem ser usados quando supply sets estão definidos. |
| 3 | `Dual-Rail` | Alta | Top-level always-on nets podem exigir tratamento especial; o curso recomendou dual-rail AO logic. |
| 4 | `true` | Muito alta | Supply sets tornam mais fácil definir UPF power intent no RTL sem conhecer toda a power network. |
| 5 | `Self-Scoped` | Muito alta | Mais adequado para módulos multi-instanciados e implementação hierárquica. |
| 6 | `false` | Muito alta | Nem todos os ports devem ser isolados. |
| 7 | `Requires buffered power switches` | Muito alta | Daisy chain usa switches/buffers encadeados; turn-on mais gradual. |
| 8 | `Scoped or Child-Scoped` | Muito alta | Self-scoped também é chamado scoped/child-scoped. |
| 9 | `Both, outputs from shutdown and Inputs to shutdown domains` | Média/Alta | Provável gabarito do curso, mas tecnicamente outputs são obrigatórios e inputs podem depender do caso. |
| 10 | `Multiple` | Muito alta | Supply set é bundle de múltiplas supply nets. |
| 11 | `true` | Muito alta | `set_isolation` define a strategy antes de `use_interface_cell`/`map_isolation_cell`. |
| 12 | `Retention Strategy` | Muito alta | Simulação usa a funcionalidade descrita na retention strategy. |
| 13 | `Low routing impact...` | Alta | Ring-style placement confina roteamento próximo ao shutdown domain. |
| 14 | `true` | Muito alta | Zero-pin retention register não tem pino dedicado de retention control. |
| 15 | `Single` | Alta | Sinal de clock para clock-gating latch deve usar single edge para reavaliação correta. |
| 16 | `Yes` | Muito alta | Physical implementation exige toda conectividade power/ground definida. |
| 17 | `level shifting` | Alta | ELS aparece quando isolation strategy e necessidade de level shifting coexistem. |
| 18 | `Virtual concept` | Muito alta | Power Domain é conceito virtual/lógico. |
| 19 | `Scopeless or Parent-Scoped` | Muito alta | Top-level scoped também é parent/scopeless. |
| 20 | `No` | Muito alta | Com supply sets, no RTL não precisa lembrar/conectar supply nets/ports. |
| 21 | `No` | Alta | User-instantiated ISO cells incompatíveis não são simplesmente removidas automaticamente. |
| 22 | `When unswitched supplies are readily available for AO logic` | Alta | Distributed/arrayed topology é adequada quando unswitched supplies já estão disponíveis. |
| 23 | `false` | Alta | Se control signal não existe no bloco, a mesma strategy não deve ser definida ali sem expor/criar o sinal. |
| 24 | `True` | Muito alta | É erro usar `-available_supplies {}` junto com lista `{<supply set> ...}`. |
| 25 | `Architecture, Application, Usage of IP` | Muito alta | Functional intent capturado em RTL. |
| 26 | `Unmapped` | Muito alta | Sem technology cells, ISO inferida fica como GTECH unmapped. |
| 27 | `false` | Muito alta | RTL + constraints não bastam para power behavior; precisa UPF/power intent. |
| 28 | `Single-rail` | Alta | ISO fora do shutdown domain pode usar single-rail. |
| 29 | `Spurious signal propagation and Crowbar current` | Muito alta | Motivo clássico para isolation entre shutdown e active logic. |
| 30 | `All` | Muito alta | Todos os benefícios listados são de supply sets. |
| 31 | `Physical object` | Muito alta | Voltage Area é objeto físico. |
| 32 | `Header` | Muito alta | Header switch desliga VDD; footer desliga ground/VSS. |
| 33 | `true` | Muito alta | Zero-pin retention lib cell pode ser usada se especificada na strategy. |
| 34 | `Before isolation cell and level-shifter cell insertion` | Muito alta | Repeater insertion ocorre antes de ISO/LS insertion. |
| 35 | `All` | Alta | `set_level_shifter -location` aceita automatic, self e parent nas opções do curso. |
| 36 | `A leaf cell does not inherit its power domain from its parent` | Muito alta | A pergunta pede o que é falso; leaf cell herda se não definida. |
| 37 | `true` | Muito alta | CMOS consome leakage mesmo sem switching. |
| 38 | `Full` | Muito alta | Full state retention é fortemente recomendado. |
| 39 | `Logical` | Muito alta | Antes da physical implementation, power switches são objetos lógicos. |
| 40 | `Faster turn on` | Muito alta | High-fanout switch control liga mais rápido, mas com maior risco de in-rush. |
| 41 | `Power distribution architecture, Power strategy, Usage of special cells` | Alta | Power intent especifica arquitetura de distribuição, strategies e special cells. |
| 42 | `Level` | Muito alta | Signals with isolation should be level-sensitive. |
| 43 | `true` | Muito alta | `-location` de ISO deve considerar supplies e control signals. |
| 44 | `Parent-Scoped` | Muito alta | Parent-scoped gera UPF mais compacto. |
| 45 | `Improper timing characterization and non-propagation of the signal` | Alta | Sem LS, diferentes tensões podem causar não propagação e caracterização/timing incorreta. |
| 46 | `RDL nets` | Muito alta | Supply network usa supply nets, supply ports e power switches; não RDL nets. |
| 47 | `All` | Alta | ISO self-contained inside shutdown region exige AO supply, recomenda dual-rail ISO e pode exigir AO buffering de control signals. |
| 48 | `soft constraint` | Alta | `set_level_shifter` é strategy/constraint dependente de condição, não força cegamente LS em todo ponto. |
| 49 | `scope` | Muito alta | Scope determina se objetos UPF são locais ou globais. |
| 50 | `One` | Muito alta | Para registradores com mesma retention strategy, usar uma clamp cell por driver. |

---

# 3. Questões com maior risco de pegadinha

## Q9 — “Which of the following needs isolating?”

Resposta usada:

```text
Both, outputs from shutdown and Inputs to shutdown domains
```

Tecnicamente, outputs from shutdown domains são o caso obrigatório clássico. Inputs to shutdown domains podem precisar de isolation dependendo da arquitetura. O curso e o Lab 2 mostraram input isolation em `PD_CORE`, então a alternativa “Both” foi tratada como provável gabarito do curso.

---

## Q28 — ISO outside shutdown domain

Resposta usada:

```text
Single-rail
```

Se a isolation cell fica fora do shutdown domain, ela pode ser alimentada pela supply ativa externa. Dentro do shutdown region, para manter a implementação self-contained, o curso recomenda dual-rail ISO.

---

## Q41 — Functional intent vs Power intent

Resposta usada:

```text
Power distribution architecture, Power strategy, Usage of special cells
```

A redação misturava “power intent” com “captured in RTL”, mas o slide separava claramente:

| Tipo | Capturado em | Exemplos |
|---|---|---|
| Functional Intent | RTL | Architecture, Application, Usage of IP |
| Power Intent | UPF | Power distribution architecture, Power strategy, Usage of special cells |

---

## Q48 — `set_level_shifter` é soft ou hard constraint?

Resposta usada:

```text
soft constraint
```

`set_level_shifter` define uma strategy. A inserção real depende de power states, voltage threshold, source/sink, location, library availability e feasibility.

---

# 4. Functional intent vs Power intent

## Functional intent

Capturado em RTL:

```text
Architecture
Application
Usage of IP
```

## Power intent

Capturado em UPF:

```text
Power distribution architecture
Power strategy
Usage of special cells
Power domains
Supply network
Power states
Isolation
Level shifting
Retention
Power switches
```

Ponto-chave:

```text
RTL + design constraints não são suficientes para descrever power behavior.
```

---

# 5. Power Domain, Voltage Area e Scope

## Power Domain vs Voltage Area

| Conceito | Natureza | Função |
|---|---|---|
| Power Domain | Virtual/lógico | Agrupa elementos que compartilham uma intenção de potência |
| Voltage Area | Físico | Região física associada a uma tensão/domínio |

## Parent-scoped vs Self-scoped

| Estilo | Também chamado | Melhor para |
|---|---|---|
| Self-scoped | Scoped / Child-scoped | Módulos multi-instanciados, IP e implementação hierárquica |
| Parent-scoped | Top-level scoped / Scopeless | UPF mais compacto e controle centralizado |

## Herança de power domain

```text
Nested power domains são permitidos.
Se indefinido, power domain pode ser herdado do parent.
Cada hierarchical cell pertence a apenas um power domain.
```

---

# 6. Isolation

## Motivo para isolation

Conectar lógica desligada com lógica ativa pode causar:

```text
spurious signal propagation
crowbar current
```

## Ports e isolation

```text
Nem todos os ports podem/devem ser isolados.
Signals with isolation should be level-sensitive.
-location deve considerar availability de supplies e control signals.
```

## ISO fora e dentro do shutdown domain

| Local da ISO | Tipo/observação |
|---|---|
| Fora do shutdown domain | Single-rail pode ser usado |
| Self-contained dentro do shutdown region | Requer AO supply, recomenda dual-rail ISO e pode exigir AO buffering |

## Ordem de comandos

```tcl
set_isolation
map_isolation_cell / use_interface_cell
```

## User-instantiated ISO cells

Se não casam com a strategy existente, não são simplesmente removidas automaticamente. A ferramenta reporta/associa conforme possível e o usuário corrige.

---

# 7. Level shifters e ELS

## Problema resolvido por LS

Conectar domínios em tensões diferentes pode causar:

```text
Improper timing characterization
Non-propagation of the signal
```

## `set_level_shifter`

```text
É soft constraint/strategy.
-location inclui automatic, self e parent no conjunto cobrado pelo curso.
```

## ELS

ELS é inferido quando há:

```text
isolation strategy
+
level shifting necessário
```

## Erro MV-1102

```text
Level shifter cannot be inserted because there are no isolation cells in the path where the LS is required.
```

Ação: corrigir isolation antes.

---

# 8. Retention

## Regras consolidadas

```text
Retention registers reduzem leakage em standby/sleep.
Simulation usa retention strategy.
Full state retention é fortemente recomendado.
Zero-pin/live secondary retention não tem dedicated retention control pin.
A ferramenta pode usar zero-pin retention library cell se especificada na UPF strategy.
Para registradores com mesma retention strategy, usa-se one clamp cell per driver.
```

## Exemplo do Lab 2

```tcl
set_retention CORE_RET -domain PD_CORE \
  -elements { pci_core/* } \
  -retention_supply_set ss_ret \
  -save_signal {pwr_control_save high} \
  -restore_signal {pwr_control_restore low}

map_retention_cell CORE_RET \
  -domain PD_CORE \
  -lib_cells {RSDFF* RDFF*}
```

---

# 9. Power switches

## Header vs Footer

| Switch | Desliga |
|---|---|
| Header | VDD / power rail |
| Footer | VSS / ground rail |

## Antes da physical implementation

Power switches são objetos:

```text
Logical
```

## Topologias de controle/placement

| Tema | Resposta consolidada |
|---|---|
| Daisy chain | Requires buffered power switches |
| High fanout | Faster turn on |
| Ring-style placement | Low routing impact, confinado próximo ao shutdown domain |
| Distributed/arrayed | Use quando unswitched supplies estão disponíveis para AO logic |

---

# 10. Supply network e supply sets

## Supply network tradicional

Usa:

```text
Supply nets
Supply ports
Power switches
```

Não usa:

```text
RDL nets
```

## Physical implementation

```text
Physical implementation requires all power and ground connectivity to be defined.
```

## Supply set

Definição:

```text
A supply set relates multiple supply nets as a complete power source for one or more design elements.
```

Benefícios:

```text
Easier to define UPF power intent early
Allows more flexibility in defining strategies
Improves re-usability of low power IPs
Enables ASIC flow
```

## RTL com supply sets

No RTL, usando supply sets/handles:

```text
Não precisa lembrar/conectar supply nets/ports.
```

## `-available_supplies`

```text
-available_supplies {} = nenhuma supply adicional disponível.
```

É incorreto misturar:

```tcl
-available_supplies {}
```

com:

```tcl
-available_supplies {SS1 SS2}
```

## Scope

```text
Scope determina se objetos UPF são locais ou globais.
```

---

# 11. Power states e PST/PSG

| Conceito | Base |
|---|---|
| PST | supply nets |
| PSG | supply sets |

Regras importantes:

```text
OFF não recebe valor de tensão.
0.0 não é OFF.
ground == {FULL_ON 0.0} significa ground ligado em 0 V.
Always-on pode ser relativo.
States individuais de supply sets não bastam; PSG/PST precisa das combinações globais.
```

Exemplo do Lab 3:

```tcl
add_power_state -group PST -state OFF_STATE \
  {-logic_expr { ss_main==main_OFF && ss_core == ON_1p16 && ss_macro == ON_0p95 }} -update
```

---

# 12. Erros e warnings consolidados

| Código | Contexto | Significado | Ação |
|---|---|---|---|
| `UPF-168` | Lab 1 / `load_upf` | Strategy referencia power domain não encontrado por erro de scope | Corrigir nome hierárquico ou criação do domínio |
| `MV-003` | Lab 3 / `commit_upf` | Supply set sem funções refinadas | `create_supply_set ss_core -update -function ...` |
| `MV-002` | Lab 3 / `commit_upf` | Power domain/primary supply mal associado | `associate_supply_set ss_core -handle PD_CORE.primary` ou refinar handle |
| `MV-1102` | Lab 2 / `create_mv_cells` | LS não pode ser inserido porque falta ISO no caminho | Corrigir isolation strategy |
| `MV-611` | Lab 2 / `create_mv_cells -mapped` | Nets exigem LS, mas matching LS não encontrado | Investigar ISO/ELS/library |
| `MV-072` | Lab 2 final | LS não associado a explicit `set_level_shifter` | Pode ser esperado com automatic LS insertion |
| `MV-027` | Lab 2/3 | Direct tie connections missing | `connect_pg_net` / `connect_pg_net -automatic` |
| `CMD-013` | Lab 1 | Mensagem secundária citada no lab | Pode ser ignorada conforme lab |

---

# 13. Comandos importantes reforçados pela prova e lab

```tcl
load_upf
commit_upf
check_mv_design
create_mv_cells
create_mv_cells -mapped
create_mv_cells -verbose
compile_fusion
save_upf
```

```tcl
set_isolation
map_isolation_cell
use_interface_cell
set_level_shifter
map_level_shifter
set_retention
map_retention_cell
analyze_mv_feasibility -retention
```

```tcl
create_supply_port
create_supply_net
connect_supply_net
create_supply_set
associate_supply_set
add_power_state
create_power_state_group
```

```tcl
report_power_domains
report_supply_set
report_mv_cells
report_mv_lib_cells
report_cell -power
get_related_supply_net
get_related_supply_set
report_pst
report_pvt
check_bufferability
```

---

# 14. Regras rápidas para próximos simulados

```text
Power Domain = virtual concept.
Voltage Area = physical object.
Functional Intent = Architecture, Application, Usage of IP.
Power Intent = Power distribution architecture, Power strategy, Usage of special cells.
Self-Scoped = Scoped / Child-Scoped.
Top-Level Scoped = Scopeless / Parent-Scoped.
Parent-Scoped = more compact UPF.
Self-Scoped = multiply-instantiated modules and hierarchical implementation.
Supply set = multiple supply nets as complete power source.
-source and -sink require supply sets.
Signals with isolation should be level-sensitive.
Not all ports can be isolated.
set_level_shifter is a soft constraint.
ELS requires isolation + level shifting.
Retention = standby/sleep, strategy-based, full state preferred.
Header switches VDD.
Power switches are logical before physical implementation.
Daisy chain requires buffered power switches.
High fanout gives faster turn-on.
RDL nets are not part of traditional supply network construction.
Scope defines local/global UPF objects.
```

---

# 15. Próximo bloco do roteiro

- **Bloco:** 089
- **Curso:** 12 Design Compiler NXT — Low Power
- **Aula:** 01 Introduction
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\01 Introduction.docx
```

- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\01 Introduction.md
```
