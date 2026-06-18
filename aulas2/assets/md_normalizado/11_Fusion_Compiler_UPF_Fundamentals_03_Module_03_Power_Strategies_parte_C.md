# 03 Module 03 — Power Strategies — parte C

## Controle do bloco

- **Bloco:** 082
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 03 Module 03 — Power Strategies — parte C
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies.docx`
- **Arquivo anexado nesta conversa:** `03 Module 03 - Power Strategies.docx`
- **Faixa processada conforme roteiro corrigido:** slides 51-60
- **Continuação:** mesmo anexo usado nas partes A e B
- **Começa em:** `Retention Register Example`
- **Termina em:** `Defining Repeaters with set_repeater Command`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies_parte_C.md
```

---

## Resumo executivo

Esta parte C fecha o módulo **03 Module 03 — Power Strategies**. Ela conclui o tema de **State Retention Strategy** e depois adiciona duas camadas finais importantes:

1. **Zero-pin retention registers**
2. **Informações adicionais sobre definição de strategies**
3. **Feedthrough nets**
4. **Repeater strategy com `set_repeater`**

A parte B já mostrou os comandos principais de retention:

```tcl
set_retention
map_retention_cell
set_retention -no_retention
```

A parte C começa com mais um exemplo de retention register para o domínio `PD_SW`, depois explica um tipo especial de retention register chamado **zero-pin retention register**, também chamado no slide de **Live Secondary** ou **Live Primary retention register**. A ideia é que esse registrador não tem um pino dedicado de controle de retention. Em vez disso, a ferramenta precisa garantir condições conhecidas em clock e outros pinos assíncronos durante o modo de retenção.

Depois, a aula muda para recomendações gerais sobre strategies:

- nomes de strategies precisam ser únicos no scope;
- strategies não podem ser redefinidas;
- isolation e level shifting só se aplicam em boundaries de power domain;
- não se aplicam em pinos internos de glue logic;
- ferramentas de placement devem colocar LS/ISO perto das fronteiras;
- interface nets entre células especiais e boundaries precisam ser gerenciadas com cuidado.

Em seguida, a aula trata de **feedthrough nets**. Esse é um tema importante porque uma net pode apenas atravessar um domínio, sem ser logicamente processada nele. Mesmo assim, o caminho físico pode exigir buffering, e esse buffering pode criar problemas de supply, always-on behavior, isolation e `dont_touch`.

Por fim, o módulo introduz o comando:

```tcl
set_repeater
```

Ele define uma estratégia para inserir **repeater cells**, normalmente buffers, em interfaces de power domains. Esses repeaters afetam a análise de `-source` e `-sink` em strategies de isolation e level shifter, porque passam a ser considerados endpoints para essa análise.

A mensagem central desta parte C é:

```text
Power strategies não terminam em LS, ISO, switch e retention. 
A robustez do UPF também depende de boundaries, feedthrough nets, repeaters, nomes únicos, scope e interação entre células especiais.
```

---

# Parte 1 — Fechamento de State Retention Strategy

## Slide 51 — Retention Register Example

### Texto extraído

Título:

```text
Retention Register Example
```

Ponto principal:

```text
Retention strategy for PD_SW power domain
```

Elementos da figura:

```text
TOP
PD_SW
PD_SW.primary
PD_SW.unswitched
VDD
VDDL
VSS
VDDL_S1
sleep
save
restore
RR
ISO
pdsw_sx
```

Comandos mostrados no bloco preto, reconstituídos a partir do slide:

```tcl
set_retention pdsw_ret
    -domain PD_SW
    -retention_power_net VDDL
    -retention_ground_net VSS
    -save_signal {save high}
    -restore_signal {restore high}

map_retention_cell pdsw_ret
    -domain PD_SW
    -lib_cell_type RDFFSRX1
```

### Interpretação

Este slide é uma continuação direta dos exemplos dos slides 49 e 50. Ele mostra a estratégia de retenção para o domínio `PD_SW`, usando nets explícitas de power e ground para retention:

```tcl
-retention_power_net VDDL
-retention_ground_net VSS
```

Isso significa que os retention registers usam `VDDL/VSS` como alimentação de retenção, em vez de depender da supply primária switchable do domínio.

O domínio `PD_SW` pode desligar sua supply primária, mas o registrador de retenção precisa continuar alimentado o suficiente para preservar estado. Por isso, `VDDL` deve representar uma supply que permanece ligada durante o período em que o estado precisa ser mantido.

Os sinais:

```tcl
-save_signal {save high}
-restore_signal {restore high}
```

indicam que `save` e `restore` são ativos em nível alto.

O comando:

```tcl
map_retention_cell
```

fecha a intenção de síntese, mapeando a estratégia para uma célula de biblioteca compatível, aqui indicada por `RDFFSRX1`.

### Relação com os exemplos anteriores

| Slide | Forma de especificar retention supply | Forma de mapear |
|---|---|---|
| 49 | `-retention_supply_set PD_SW.unswitched` | `-lib_cells ret_lib_cell` |
| 50 | `-retention_power_net VDDL` e `-retention_ground_net VSS` | `-lib_cell_type RDFFSRX1` |
| 51 | reforça o caso com nets explícitas | reforça mapeamento para retention register |

### Ponto importante

```text
A retention supply precisa permanecer ligada enquanto o estado precisa ser preservado.
```

Se `VDDL` desligar junto com o domínio, a retenção não funciona.

---

## Slide 52 — Zero-Pin Retention Register: Overview

### Texto extraído

Título:

```text
Zero-Pin Retention Register: Overview
```

Ponto principal:

```text
A zero-pin, a.k.a., Live Secondary (or Primary) retention register is a register without a dedicated retention control pin
```

Figura:

```text
Live Secondary Retention Register Model
```

Elementos visíveis:

```text
Master Latch
Slave Latch
Always on RET supply
VDD_SW - Switched Supply
VDD_AO - Retention Supply
D
CLK
Q
```

### Interpretação

Este slide introduz o conceito de **zero-pin retention register**.

Um retention register tradicional costuma ter pinos dedicados de controle, como:

```text
save
restore
retention enable
```

Já um **zero-pin retention register** não tem um pino dedicado de controle de retention. A retenção acontece por uma arquitetura interna da célula e por condições aplicadas aos pinos existentes, como clock e pinos assíncronos.

O slide chama esse tipo também de:

```text
Live Secondary retention register
Live Primary retention register
```

A figura mostra a ideia de duas partes internas:

- uma parte ligada à supply switchable, como `VDD_SW`;
- uma parte ligada à supply always-on/retention, como `VDD_AO`.

Durante shutdown, a parte retentiva permanece viva para manter o estado.

### Ponto essencial

```text
Zero-pin retention não significa “sem controle no sistema”.
Significa “sem pino dedicado de controle de retention na célula”.
```

A ferramenta ainda precisa garantir que clock e sinais assíncronos estejam em estados seguros durante o modo de retenção.

---

## Slide 53 — Support for Zero-Pin Retention Register: Overview

### Texto extraído

Título:

```text
Support for Zero-Pin Retention Register: Overview
```

Pontos principais:

```text
Tool can use a zero-pin retention library cell for retention mapping,
if the library cell is specified in the UPF strategy
```

```text
Using a zero-pin retention register requires the clock pin and other
asynchronous input pins (powered by backup supply) to be clamped to a known
value during retention mode
```

Exemplo mostrado:

```tcl
retention_condition() {
    required_condition : "!clock & rst";
    power_down_function : "VDD_SW + VSS";
}
```

Outros pontos:

```text
For registers with same retention strategy, tool uses one clamp cell per driver
```

Subitem:

```text
An instantiated buffer or Clock Gating cell on the zero-pin ret register
control path is treated as driver
```

Último ponto:

```text
Clamp cells are placed in the same power domain as the retention register
```

Subitem:

```text
With each root cell of power domain having a clamp cell for the zero-pin ret
register with same strategy
```

### Interpretação

O slide explica o suporte da ferramenta para zero-pin retention.

## 1. A célula precisa ser especificada na estratégia UPF

A ferramenta só usa uma célula zero-pin retention se ela estiver disponível na biblioteca e for especificada/mapeada pela estratégia UPF.

Ou seja:

```text
não basta existir célula na biblioteca;
a strategy precisa permitir seu uso.
```

## 2. Clock e pinos assíncronos precisam ser clampados

Como não há pino dedicado de controle de retention, a retenção depende de condições conhecidas em pinos comuns da célula.

Exemplo conceitual do slide:

```tcl
required_condition : "!clock & rst";
```

Isso sugere que, durante o modo de retenção, a ferramenta precisa garantir algo como:

```text
clock = 0
rst = 1
```

ou outro conjunto de condições definido pela biblioteca.

## 3. Clamp cells são inferidas para garantir essas condições

A ferramenta pode inserir clamp cells nos sinais que precisam ficar em valor conhecido.

Para vários registradores com a mesma retention strategy, a ferramenta usa uma clamp cell por driver, não necessariamente uma por registrador.

### Exemplo

Se um mesmo clock gating cell dirige vários zero-pin retention registers, ele pode ser tratado como driver comum.

## 4. Clamp cells ficam no mesmo power domain

O slide destaca que as clamp cells são colocadas no mesmo power domain do retention register. Isso é importante para coerência de supply e implementação física.

---

## Slide 54 — Support for Zero-Pin Retention Register

### Texto extraído

Título:

```text
Support for Zero-Pin Retention Register
```

Ponto:

```text
UPF - Example:
```

A figura mostra um retention register com:

```text
D-pin RET RDFF
clock
reset
retention
```

Legenda visual:

```text
Domain's Primary Supply
Always On Supply
```

Comandos UPF visíveis parcialmente:

```tcl
set_retention ret_reg -domain PS_TOP \
    -retention_supply_set SS_RET \
    -elements ... \
    -save_condition ... \
    -restore_condition ...

set_retention_control ret_reg -domain PS_TOP \
    -save_signal {retain high} \
    -restore_signal {retain low}

map_retention_cell ret_reg -domain PS_TOP \
    -lib_cell_type ...
```

### Interpretação

Este slide mostra um exemplo de UPF para zero-pin retention.

A figura do circuito indica que alguns pinos/sinais são alimentados pela supply primária do domínio e outros precisam ser mantidos por uma supply always-on.

O UPF usa três ideias:

## 1. `set_retention`

Define a strategy de retenção e associa a supply de retenção:

```tcl
-retention_supply_set SS_RET
```

Também pode especificar elementos e condições de save/restore.

## 2. `set_retention_control`

Associa sinais de controle e polaridade, como:

```tcl
-save_signal {retain high}
-restore_signal {retain low}
```

Mesmo em zero-pin retention, o fluxo pode ter um sinal de modo/controle externo que orienta a estratégia, embora a célula não possua pino dedicado de retention.

## 3. `map_retention_cell`

Mapeia a strategy para uma célula de biblioteca compatível com zero-pin retention.

### Ponto didático

A principal dificuldade do zero-pin retention é que a estratégia envolve **condições de pinos existentes** e **clamps adicionais**, não apenas conexão de um pino `SAVE/RESTORE` direto.

---

## Slide 55 — Prerequisites

### Texto extraído

Título:

```text
Prerequisites
```

Texto:

```text
You should have knowledge on
```

Lista:

```text
What a Power Domain is and to write one
About power intent of a basic design
Have completed the "Getting Started with Power Strategies Module"
Have completed the "Level Shifter Strategies Module"
Have completed the "Isolation Strategies Module"
Have completed the "Power Switch Strategies Module"
Have completed the "State Retention Strategies Module"
```

### Interpretação

Este slide funciona como uma transição. Ele indica que, antes de estudar os próximos detalhes finais de strategies, o aluno já deve dominar:

- power domains;
- power intent básico;
- level shifter strategies;
- isolation strategies;
- power switch strategies;
- state retention strategies.

No contexto do nosso roteiro, este slide aparece no final do módulo grande e serve como checklist de pré-requisitos para entender a parte de repeaters e informações adicionais.

---

# Parte 2 — Informações adicionais sobre defining strategies

## Slide 56 — Additional Information on Defining Strategies

### Texto extraído

Título:

```text
Additional Information on Defining Strategies
```

Primeira caixa:

```text
Strategy names need to be unique in the scope in which they are defined
```

Segunda caixa:

```text
Strategies cannot be redefined
```

Exemplo:

```text
set_isolation on the same strategy name will result in an error
```

### Interpretação

Este slide traz uma regra simples, mas muito importante para UPF modular.

## 1. Nomes de strategy precisam ser únicos no scope

Se você define uma strategy chamada `ISO1` dentro de um scope, não pode definir outra `ISO1` no mesmo scope.

Isso vale para strategies como:

- `set_isolation`;
- `set_level_shifter`;
- `set_retention`;
- `set_repeater`;
- outras estratégias de power management.

## 2. Strategies não podem ser redefinidas

Se você tenta fazer:

```tcl
set_isolation ISO1 ...
set_isolation ISO1 ...
```

no mesmo scope, a ferramenta gera erro.

### Como alterar uma strategy?

Em alguns comandos UPF existe opção como:

```tcl
-update
```

quando o objetivo é atualizar uma definição existente. Mas redefinir simplesmente com o mesmo nome não é permitido.

### Ponto prático

Em fluxos hierárquicos, use nomes claros e consistentes, ou prefira self-scoped quando o mesmo IP é instanciado várias vezes.

---

## Slide 57 — Additional Information on Defining Strategies

### Texto extraído

Título:

```text
Additional Information on Defining Strategies
```

Primeira caixa:

```text
Strategies for isolation and level shifting can only be applied at domain boundaries
```

Subitens:

```text
Application on hierarchical pins or top-level ports
NO application on glue logic pins
```

Segunda caixa:

```text
Placement tools should place isolation cells and level shifters close to domain boundaries
```

Subitem:

```text
Interface nets between these cells and the domain boundaries must be carefully managed
```

### Interpretação

Este slide reforça que strategies de LS e ISO são conceitos de **interface entre domínios**.

Elas se aplicam em:

```text
hierarchical pins
top-level ports
domain boundaries
```

Elas não se aplicam em pinos internos de lógica aleatória, chamados no slide de:

```text
glue logic pins
```

### Por que isso importa?

Isolation e level shifting existem para resolver problemas de interface entre power domains:

- domínio com tensão diferente;
- domínio desligável conectado a domínio ligado;
- fronteira entre source e sink com power states diferentes.

Se a célula fosse inserida em ponto arbitrário de glue logic, a ferramenta poderia quebrar a semântica de power domains.

### Placement

A ferramenta de placement deve colocar LS/ISO perto das boundaries. Isso reduz:

- comprimento de interface nets;
- risco de crossing indevido;
- complexidade de supply;
- problemas de DRC;
- confusão na análise `source/sink`.

### Cuidado com interface nets

O slide alerta que os nets entre a célula especial e a boundary precisam ser gerenciados com cuidado. Se uma ISO ou LS é colocada longe da fronteira, o net entre célula e fronteira pode atravessar regiões de supply inadequadas.

---

# Parte 3 — Feedthrough Nets

## Slide 58 — Feedthrough Nets

### Texto extraído

Título:

```text
Feedthrough Nets
```

Pontos:

```text
Consider the relative always-on properties of the domains when defining your power intent
```

```text
If the path is a feedthrough:
```

Subitem:

```text
Will it be short enough that buffering is not required?
```

Subitens internos:

```text
Buffers in one power domain may require a supply net from another power domain
If the appropriate supply net is not available, net will be marked dont_touch
```

Outro subitem:

```text
Is input/output isolation still necessary for paths between two domains with the same power states?
```

Subitem interno:

```text
If all cells are powered by supplies from the same domain, isolation may not be necessary,
unless buffering is needed in another domain
```

### Interpretação

Um **feedthrough net** é um caminho que atravessa um domínio sem ser logicamente processado por ele. Em termos práticos, o sinal entra por um lado do bloco/domínio e sai por outro lado, servindo como passagem.

## 1. Considere always-on properties

Se um domínio atravessado pode desligar, mas o sinal precisa continuar funcionando, isso cria uma questão:

```text
o caminho precisa ser always-on?
o domínio atravessado permanece ligado?
o domínio atravessado precisa de buffers always-on?
```

## 2. O caminho precisa de buffering?

Se o feedthrough for curto, talvez não precise de buffers.

Mas se for longo, a ferramenta pode querer inserir buffers. O problema é: em qual power domain esses buffers ficam? Qual supply os alimenta?

Se o buffer é colocado dentro de um domínio, mas precisa ser alimentado por supply de outro domínio, a supply adequada precisa estar disponível.

Se não estiver disponível, o slide diz que o net pode ser marcado como:

```text
dont_touch
```

para impedir que a ferramenta tente modificar/inserir buffers de forma inválida.

## 3. Isolation ainda é necessária entre domínios com mesmos power states?

Se dois domínios têm os mesmos power states e todas as células envolvidas são alimentadas por supplies do mesmo domínio, talvez isolation não seja necessária.

Mas se o caminho exige buffering em outro domínio, a análise muda: o buffer pode introduzir uma célula alimentada por outra supply, exigindo nova proteção.

### Regra prática

```text
Feedthrough nets exigem análise física e de supply, não apenas análise lógica.
```

---

# Parte 4 — Repeater Strategy com `set_repeater`

## Slide 59 — Defining Repeaters with `set_repeater` Command

### Texto extraído

Título:

```text
Defining Repeaters with set_repeater Command
```

Ponto principal:

```text
set_repeater defines a strategy for inserting repeater cells (buffers) on the
interface of a power domain
```

Subitem:

```text
Repeaters are placed within the domain, driven by input ports of the domain
and driving output ports of the domain
```

Exemplos de comando visíveis:

```tcl
set_repeater ORANGE_RPTR -domain PD_ORANGE \
    -repeater_supply ss_orange \
    -applies_to_boundary both

set_repeater BLUE_RPTR -domain PD_BLUE \
    -elements {*} \
    -repeater_supply ss_blue
```

Figura:

```text
PD_ORANGE
PD_BLUE
buffers/repeaters nas interfaces
```

### Interpretação

`set_repeater` define uma estratégia para inserir repeaters, isto é, buffers, na interface de um power domain.

A função principal é controlar como sinais de interface são bufferizados quando atravessam domínios.

## Por que repeaters são importantes em UPF?

Em um design comum, inserir buffer é apenas uma otimização elétrica/timing.

Em um design multi-power-domain, inserir buffer também é decisão de power intent:

```text
qual supply alimenta o buffer?
em qual domínio ele fica?
ele muda a análise source/sink?
ele afeta isolation ou level shifting?
```

Por isso, o UPF oferece `set_repeater`.

## Exemplo 1

```tcl
set_repeater ORANGE_RPTR -domain PD_ORANGE \
    -repeater_supply ss_orange \
    -applies_to_boundary both
```

Significado:

- inserir repeaters associados ao domínio `PD_ORANGE`;
- alimentados por `ss_orange`;
- aplicados nas duas boundaries, inputs e outputs.

## Exemplo 2

```tcl
set_repeater BLUE_RPTR -domain PD_BLUE \
    -elements {*} \
    -repeater_supply ss_blue
```

Significado:

- estratégia para `PD_BLUE`;
- aplicada aos elementos selecionados;
- repeaters alimentados por `ss_blue`.

---

## Slide 60 — Defining Repeaters with `set_repeater` Command

### Texto extraído

Título:

```text
Defining Repeaters with set_repeater Command
```

Primeiro bloco:

```text
Interaction with other PM cells
```

Subitens:

```text
Repeater insertion happens before isolation cell and level-shifter cell insertion
```

```text
Presence of repeaters affects implementation of -source/-sink isolation and
level-shifter strategies
```

Segundo bloco:

```text
Repeaters are considered as end points for -source/-sink analysis
```

Subitens:

```text
Repeaters on input boundary of PD impact supply evaluation of sink based ISO/LS strategies
```

```text
Repeaters on output boundary of PD impact supply evaluation of source based ISO/LS strategies
```

Código visível, reconstituído:

```tcl
set_repeater R1 -domain PD_BLUE -repeater_supply SS_BLUE

set_isolation ISO1 -domain PD_BLUE -isolation_supply SS_ORANGE \
    -applies_to inputs -sink SS_BLUE

set_isolation ISO2 -domain PD_BLUE -isolation_supply SS_BLUE \
    -applies_to outputs -source SS_BLUE
```

### Interpretação

Este slide é o mais importante sobre repeaters porque explica a interação com LS/ISO.

## 1. Repeaters são inseridos antes de ISO e LS

A ordem importa:

```text
repeaters → isolation cells → level shifters
```

ou, conforme o slide, repeater insertion acontece antes da inserção de isolation e level-shifter cells.

Isso significa que a presença de repeaters altera a topologia vista pelas strategies de LS/ISO.

## 2. Repeaters afetam análise `-source` e `-sink`

Strategies de isolation e level shifter podem usar critérios baseados em:

```text
source
sink
```

Se um repeater é inserido na boundary, ele passa a ser considerado endpoint da análise.

### Input boundary

Repeaters na boundary de entrada do power domain impactam avaliação da supply do sink.

Isso afeta strategies baseadas em:

```tcl
-sink
```

### Output boundary

Repeaters na boundary de saída impactam avaliação da supply do source.

Isso afeta strategies baseadas em:

```tcl
-source
```

### Consequência prática

Se você define repeaters em uma interface, precisa revisar as strategies de LS/ISO que usam `-source` ou `-sink`, porque a fonte/destino efetivo pode mudar.

---

# Aula didática desenvolvida

## 1. Zero-pin retention é retenção sem pino dedicado, não sem controle arquitetural

O nome “zero-pin” pode confundir. Ele não quer dizer que a retenção acontece magicamente sem qualquer condição. Quer dizer que a célula não tem um pino dedicado de retention control.

A ferramenta precisa garantir condições como:

```text
clock em valor conhecido
reset/set assíncronos em valor conhecido
supply de backup ligada
```

Isso pode exigir clamp cells.

## 2. Clamps em zero-pin retention são parte da estratégia

Se o clock ou reset precisa ficar em determinado valor durante retention mode, a ferramenta pode inserir clamp cells.

Essas clamps:

- ficam no mesmo power domain do retention register;
- são compartilhadas por driver quando vários registradores usam a mesma strategy;
- dependem da biblioteca e das condições declaradas.

## 3. Nomes únicos de strategy evitam confusão em UPF modular

Em um projeto grande, vários arquivos UPF podem ser carregados em diferentes scopes. Se os nomes não forem únicos no scope, ocorrerão erros.

Isso reforça a importância de:

```text
self-scoped UPF para IP reutilizável
nomes prefixados
uso disciplinado de scope
```

## 4. LS e ISO são células de boundary

Não tente pensar em level shifter e isolation como buffers comuns que podem ser jogados em qualquer ponto do cone.

Eles só fazem sentido em domain boundaries, porque resolvem problemas de interface entre domínios.

## 5. Feedthrough nets são perigosos porque parecem simples

Um net feedthrough pode parecer “só um fio atravessando o bloco”. Mas em implementação física:

- pode ser longo;
- pode precisar de buffer;
- pode atravessar voltage area;
- pode requerer supply que não existe naquela região;
- pode mudar necessidade de isolation;
- pode ser marcado `dont_touch`.

A simplicidade lógica esconde complexidade física.

## 6. Repeaters são buffers com power intent

Um buffer comum em domínio único é simples. Em multi-voltage/multi-power-domain, o buffer precisa de supply e domínio.

`set_repeater` existe para controlar esse comportamento.

## 7. Repeaters mudam a análise de source/sink

Se a strategy de LS/ISO depende de `source` e `sink`, a inserção de um repeater muda quem é o endpoint da análise.

Isso pode alterar:

- se LS é inferido;
- onde LS é inserido;
- qual supply é considerada;
- se isolation é necessária;
- qual strategy se aplica.

---

# Conceitos difíceis explicados em profundidade

## Zero-pin retention register

Retention register sem pino dedicado de retention control. Depende de condições conhecidas em clock e pinos assíncronos durante retention mode.

---

## Live Secondary retention register

Tipo de retention register em que uma parte secundária, alimentada por uma supply de retenção/always-on, preserva o estado quando a parte principal desliga.

---

## Live Primary retention register

Variação em que a parte primária da célula permanece viva para preservar estado, conforme modelagem da biblioteca.

---

## Retention condition

Condição declarada na biblioteca/estratégia que define o estado necessário dos pinos durante retention mode.

---

## Clamp cell para zero-pin retention

Célula usada para prender clock/reset/set ou outros pinos a valores conhecidos durante retention mode.

---

## Domain boundary

Fronteira de um power domain. É o local conceitual onde LS e ISO se aplicam.

---

## Glue logic pins

Pinos internos de lógica comum. O slide alerta que LS/ISO não se aplicam diretamente nesses pinos; aplicam-se em boundaries.

---

## Feedthrough net

Net que atravessa um domínio/bloco sem ser logicamente processada por ele.

---

## Repeater

Buffer inserido em interface de power domain para preservar qualidade elétrica/timing, controlado por power intent.

---

## `set_repeater`

Comando UPF que define estratégia para inserir repeaters em interfaces de power domains.

---

## `-repeater_supply`

Supply usada para alimentar os repeaters inseridos.

---

## `-applies_to_boundary both`

Opção que aplica a estratégia de repeater em ambas as fronteiras do domínio, input e output.

---

## `-source` / `-sink` analysis

Análise usada em strategies de ISO/LS para decidir comportamento com base na origem ou destino de um caminho. Repeaters podem alterar os endpoints considerados.

---

# Comandos importantes da parte C

## Retention register com nets explícitas

```tcl
set_retention pdsw_ret
    -domain PD_SW
    -retention_power_net VDDL
    -retention_ground_net VSS
    -save_signal {save high}
    -restore_signal {restore high}

map_retention_cell pdsw_ret
    -domain PD_SW
    -lib_cell_type RDFFSRX1
```

## Zero-pin retention — exemplo conceitual de condição

```tcl
retention_condition() {
    required_condition : "!clock & rst";
    power_down_function : "VDD_SW + VSS";
}
```

## Zero-pin retention — exemplo UPF conceitual

```tcl
set_retention ret_reg -domain PS_TOP \
    -retention_supply_set SS_RET \
    -elements {...} \
    -save_condition {...} \
    -restore_condition {...}

set_retention_control ret_reg -domain PS_TOP \
    -save_signal {retain high} \
    -restore_signal {retain low}

map_retention_cell ret_reg -domain PS_TOP \
    -lib_cell_type {...}
```

## Repeater strategy

```tcl
set_repeater ORANGE_RPTR -domain PD_ORANGE \
    -repeater_supply ss_orange \
    -applies_to_boundary both

set_repeater BLUE_RPTR -domain PD_BLUE \
    -elements {*} \
    -repeater_supply ss_blue
```

## Repeater com interaction source/sink

```tcl
set_repeater R1 -domain PD_BLUE -repeater_supply SS_BLUE

set_isolation ISO1 -domain PD_BLUE -isolation_supply SS_ORANGE \
    -applies_to inputs -sink SS_BLUE

set_isolation ISO2 -domain PD_BLUE -isolation_supply SS_BLUE \
    -applies_to outputs -source SS_BLUE
```

---

# Tabelas de revisão

## Zero-pin retention

| Item | Ideia |
|---|---|
| O que é | Retention register sem pino dedicado de retention control |
| Também chamado | Live Secondary ou Live Primary retention register |
| Exige | Clock e pinos assíncronos em valores conhecidos durante retention |
| Como garantir | Clamp cells |
| Onde ficam os clamps | Mesmo power domain do retention register |
| Compartilhamento | Uma clamp cell por driver para registradores da mesma strategy |
| Requisito | Célula deve estar especificada/mapeada na strategy UPF |

---

## Strategy naming

| Regra | Consequência |
|---|---|
| Nome precisa ser único no scope | Evita conflito entre strategies |
| Strategy não pode ser redefinida | Reusar mesmo nome em `set_isolation` gera erro |
| Use `-update` quando suportado | Alteração controlada, não redefinição simples |
| Em IP multi-instanciado | Preferir self-scoped ou nomes qualificados |

---

## Boundaries e placement

| Tópico | Regra |
|---|---|
| LS/ISO | Aplicam-se em domain boundaries |
| Aplicação válida | hierarchical pins ou top-level ports |
| Aplicação inválida | glue logic pins |
| Placement | LS/ISO devem ficar perto das domain boundaries |
| Risco | Interface nets longos podem cruzar supplies/regions indevidas |

---

## Feedthrough nets

| Pergunta | Implicação |
|---|---|
| O caminho é curto? | Talvez não precise buffering |
| Precisa de buffer? | Buffer exige supply adequada |
| Supply adequada existe? | Se não, net pode virar `dont_touch` |
| Domínios têm mesmos power states? | Isolation talvez não seja necessária |
| Buffering em outro domínio é necessário? | Pode reintroduzir necessidade de protection |

---

## Repeaters

| Item | Efeito |
|---|---|
| `set_repeater` | Define estratégia de buffers em interface de PD |
| Inserção | Acontece antes de ISO/LS |
| Repeater em input boundary | Afeta análise de sink |
| Repeater em output boundary | Afeta análise de source |
| `-repeater_supply` | Define supply do buffer |
| Interação | Pode alterar implementação de `-source`/`-sink` em ISO/LS |

---

# Figuras e diagramas importantes

## Slide 51 — Retention Register Example

Mostra `PD_SW` com power switch, retention register, `VDDL`, `VSS`, sinais `sleep`, `save`, `restore` e ISO. A figura reforça a separação entre primary supply switchable e retention supply.

## Slide 52 — Zero-Pin Retention Register Overview

Mostra modelo de retention register com Master Latch e Slave Latch, usando `VDD_SW` e `VDD_AO`. É a figura base para entender Live Secondary retention.

## Slide 53 — Zero-Pin Retention Support

Mostra que a ferramenta pode usar zero-pin retention cell se a library cell estiver especificada na UPF strategy e que clock/pinos assíncronos precisam clamp.

## Slide 54 — UPF Example for Zero-Pin Retention

Mostra um exemplo com `set_retention`, `set_retention_control` e `map_retention_cell`, conectando estratégia UPF a uma célula zero-pin.

## Slide 55 — Prerequisites

Lista os conhecimentos necessários antes de seguir: power domain, power intent, level shifter, isolation, power switch e state retention strategies.

## Slide 56 — Additional Information on Defining Strategies

Mostra regras de unicidade de nomes e impossibilidade de redefinir strategies.

## Slide 57 — Strategies at Domain Boundaries

Mostra que isolation e level shifting só se aplicam em domain boundaries, não em glue logic pins.

## Slide 58 — Feedthrough Nets

Mostra considerações sobre always-on properties, buffering, `dont_touch` e isolation em paths de feedthrough.

## Slide 59 — set_repeater

Mostra repeaters em interfaces de `PD_ORANGE` e `PD_BLUE`, alimentados por suas supplies.

## Slide 60 — Repeater Interaction with PM Cells

Mostra que repeaters são considerados endpoints para análise `source/sink` e afetam ISO/LS.

---

# Pontos de prova e revisão

1. A parte C começa fechando retention register examples.
2. Retention register de `PD_SW` pode usar `-retention_power_net VDDL`.
3. Retention register de `PD_SW` pode usar `-retention_ground_net VSS`.
4. `save` e `restore` podem ser definidos como ativos em nível alto.
5. `map_retention_cell` mapeia a strategy para uma célula real.
6. Zero-pin retention register não tem pino dedicado de retention control.
7. Zero-pin retention também é chamado Live Secondary ou Live Primary retention register.
8. Zero-pin retention exige clock e pinos assíncronos em valores conhecidos durante retention mode.
9. A ferramenta pode inserir clamp cells para satisfazer condições de zero-pin retention.
10. A célula zero-pin precisa estar especificada na UPF strategy.
11. Para registradores com mesma retention strategy, a ferramenta usa uma clamp cell por driver.
12. Buffer instanciado ou clock gating cell no control path pode ser tratado como driver.
13. Clamp cells são colocadas no mesmo power domain do retention register.
14. `set_retention_control` pode associar save/restore signals a uma strategy.
15. A funcionalidade de zero-pin retention depende da biblioteca e das conditions.
16. Strategy names precisam ser únicos no scope onde são definidos.
17. Strategies não podem ser redefinidas.
18. `set_isolation` repetido com mesmo strategy name pode gerar erro.
19. Strategies de isolation e level shifting só se aplicam em domain boundaries.
20. LS/ISO podem ser aplicados em hierarchical pins.
21. LS/ISO podem ser aplicados em top-level ports.
22. LS/ISO não se aplicam em glue logic pins.
23. Placement tools devem colocar ISO e LS perto das domain boundaries.
24. Interface nets entre células especiais e boundaries precisam ser gerenciados com cuidado.
25. Feedthrough nets exigem considerar propriedades always-on relativas dos domínios.
26. Caminho feedthrough curto pode não precisar buffering.
27. Buffers em um power domain podem exigir supply net de outro power domain.
28. Se supply apropriada não está disponível, o net pode ser marcado `dont_touch`.
29. Isolation entre domínios com mesmos power states pode não ser necessária se todas as células são alimentadas pelo mesmo domínio.
30. Se buffering for necessário em outro domínio, isolation pode voltar a ser necessária.
31. `set_repeater` define estratégia para inserir repeater cells.
32. Repeater cells geralmente são buffers.
33. Repeaters são inseridos na interface de power domains.
34. Repeaters são colocados dentro do domínio.
35. Repeaters são dirigidos por input ports e dirigem output ports do domínio.
36. `-repeater_supply` define a supply dos repeaters.
37. `-applies_to_boundary both` aplica repeaters nas duas boundaries.
38. Repeater insertion acontece antes de isolation cell insertion.
39. Repeater insertion acontece antes de level-shifter cell insertion.
40. A presença de repeaters afeta implementation de `-source`/`-sink` strategies.
41. Repeaters são considerados endpoints para source/sink analysis.
42. Repeater na input boundary impacta avaliação de supply do sink.
43. Repeater na output boundary impacta avaliação de supply do source.
44. Repeaters podem alterar onde LS/ISO são inferidos.
45. Repeaters podem alterar qual supply é considerada em LS/ISO.
46. Feedthrough e repeater strategies conectam power intent com implementação física.
47. Células especiais devem ser pensadas com domain boundary, supply e placement.
48. A parte C fecha o módulo Power Strategies.
49. O próximo módulo do roteiro é Supply Network.
50. O módulo Power Strategies como um todo cobre LS, ISO, power switches, retention e repeaters.

---

# Relação com Fusion Compiler

No Fusion Compiler, essa parte C é importante porque ela trata situações que afetam diretamente a implementação física:

```text
1. zero-pin retention precisa de clamps e mapeamento correto de cells;
2. strategies com nomes duplicados quebram scripts UPF;
3. ISO/LS precisam ser colocados próximos às boundaries;
4. feedthrough nets podem ser marcados dont_touch se supply adequada não existir;
5. repeaters podem mudar a análise source/sink de LS/ISO;
6. repeaters precisam de supply compatível;
7. a ordem de inserção repeater → ISO/LS altera o resultado final.
```

Ou seja, o Fusion Compiler não interpreta essas strategies isoladamente. Ele precisa combinar:

```text
UPF
library cells
supply sets
power domains
voltage areas
placement
routing
source/sink analysis
```

---

# Checklist prático para revisar a parte C

## Zero-pin retention

```text
1. A célula zero-pin está na biblioteca?
2. Ela foi especificada/mapeada na strategy?
3. As retention conditions da biblioteca estão claras?
4. Clock e pinos assíncronos precisam de clamp?
5. A supply de retention/always-on está correta?
6. As clamp cells ficam no mesmo power domain?
7. Há clock gating ou buffers no control path que viram drivers?
```

## Strategies

```text
1. Os nomes são únicos no scope?
2. Alguma strategy foi redefinida indevidamente?
3. O uso de -update seria necessário?
4. O scope é adequado para IP multi-instanciado?
```

## Boundaries

```text
1. LS/ISO foram definidos em domain boundaries?
2. Alguma strategy tentou atingir glue logic pins?
3. As células especiais estão próximas das boundaries?
4. Interface nets foram gerenciados corretamente?
```

## Feedthrough

```text
1. O caminho é realmente feedthrough?
2. O caminho precisa de buffering?
3. Existe supply adequada para buffers?
4. O net virou dont_touch?
5. Os domínios têm mesmos power states?
6. Isolation ainda é necessária?
```

## Repeaters

```text
1. Existe strategy `set_repeater` para a interface?
2. A supply do repeater está correta?
3. O repeater é aplicado em inputs, outputs ou both?
4. A inserção de repeater muda análise -source/-sink?
5. As strategies de ISO/LS foram revisadas depois do repeater?
```

---

# Checklist de qualidade

- [x] Bloco 082 processado conforme roteiro corrigido, slides 51-60.
- [x] O arquivo grande foi finalizado sem misturar com o próximo módulo.
- [x] Retention register example e zero-pin retention foram explicados.
- [x] Informações adicionais sobre strategies foram organizadas.
- [x] Feedthrough nets foram explicados com foco em always-on, buffering e `dont_touch`.
- [x] `set_repeater` foi explicado com interação com ISO/LS.
- [x] Figuras dos slides 51-60 foram interpretadas.
- [x] Pontos de prova e revisão foram listados.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 083
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 04 Module 04 — Supply Network — parte A
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network.docx
```

- **Processar somente:** slides 1-25
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network_parte_A.md
```

- **Depois:** Bloco 084 — `04 Module 04 - Supply Network - parte B`.
