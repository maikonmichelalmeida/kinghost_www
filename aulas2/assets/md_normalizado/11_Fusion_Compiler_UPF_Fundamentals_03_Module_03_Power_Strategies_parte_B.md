# 03 Module 03 — Power Strategies — parte B

## Controle do bloco

- **Bloco:** 081
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 03 Module 03 — Power Strategies — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies.docx`
- **Arquivo anexado nesta conversa:** `03 Module 03 - Power Strategies.docx`
- **Faixa processada conforme roteiro corrigido:** slides 26-50
- **Continuação:** mesmo anexo usado na parte A
- **Começa em:** `Defining Isolation: Location Parent`
- **Termina em:** `Retention Register Example`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies_parte_B.md
```

---

## Resumo executivo

Esta parte B continua o módulo **Power Strategies** exatamente de onde a parte A parou. A parte A cobriu planejamento de **level shifters** e a primeira metade de **isolation strategy**. Esta parte B aprofunda os exemplos de isolation e entra em duas novas estratégias fundamentais de UPF:

1. **Isolation Strategy — continuação**
2. **Power Switch Strategy**
3. **State Retention Strategy — início e comandos principais**

A primeira metade deste bloco conclui isolation, com foco em:

- diferença entre definir isolation no top e no bloco;
- `-location parent`;
- `-applies_to_boundary lower`;
- problemas de scope;
- células NOR-style de isolation;
- gotchas importantes, como scan ports, sinais de controle e valores default;
- necessidade de estratégias completas para todos os cenários da PST;
- risco de células ISO instanciadas manualmente não associadas corretamente ao UPF.

Depois, a aula entra em **power switches**, explicando decisões de arquitetura:

- chavear VDD ou VSS;
- usar headers ou footers;
- usar topologia distributed/arrayed ou ring;
- conectar switches em daisy chain ou high-fanout;
- cuidar da polaridade de sinais de controle;
- entender `switch_function`;
- usar switches com propagação de controle/acknowledge quando possível;
- criar power switch lógico em UPF com `create_power_switch`;
- mapear para células reais com `map_power_switch`.

A parte final introduz **retention**, cobrindo:

- planejamento de retenção full ou partial;
- polaridade e origem dos sinais `save` e `restore`;
- tipos de retention registers permitidos;
- recomendação forte de full-state retention, salvo quando o design foi arquitetado para partial retention;
- necessidade de redes de reset independentes para estados retidos e não retidos;
- comandos `set_retention` e `map_retention_cell`;
- cuidados com retention supplies;
- uso de `-no_retention` para excluir elementos específicos;
- exemplos usando supply set e nets explícitas.

A mensagem central desta parte B é:

```text
Power strategies não são apenas comandos UPF; são decisões de arquitetura, biblioteca, hierarquia, supply, controle e implementação física.
```

---

# Parte 1 — Isolation Strategy: continuação

## Slide 26 — Defining Isolation: Location Parent

### Texto extraído

Título:

```text
Defining Isolation: Location Parent
```

Comando mostrado:

```tcl
set_isolation MyIso -domain BlkA/PD1 \
    -isolation_power_net VDDtop ... \
    -location parent \
    -isolation_signal iso_enable ... \
```

Descrição:

```text
From the scope of TOP, you are defining an isolation strategy for the block
using a top-level VDD and a control signal in the top-level
```

Subitem:

```text
This can be defined from the top-level as shown because everything is visible from the top
```

Figura:

```text
PD_TOP
iso_enable
ISO
PD1 / BlkA
```

### Interpretação

Este slide mostra um caso em que a estratégia de isolamento de um bloco `BlkA/PD1` é definida a partir do escopo do topo.

A opção importante é:

```tcl
-location parent
```

Isso significa que a isolation cell será inserida **fora** do domínio isolado, no domínio pai.

Como o comando é executado no topo, o UPF enxerga:

- o domínio `BlkA/PD1`;
- a supply top-level `VDDtop`;
- o sinal de controle `iso_enable`;
- o local de inserção no parent.

Por isso, o slide diz que “everything is visible from the top”.

### Conceito-chave

```text
Se você define isolation no top, pode usar sinais e supplies do top diretamente.
```

Isso é útil quando o controle de isolamento vem de lógica top-level ou de um power controller no topo.

---

## Slide 27 — Defining Isolation: Applies to Lower Boundary

### Texto extraído

Título:

```text
Defining Isolation: Applies to Lower Boundary
```

Comando mostrado:

```tcl
set_isolation MyIso -domain PD_TOP \
    -isolation_power_net VDDtop ... \
    -applies_to_boundary lower \
    -isolation_signal iso_enable ... \
```

Texto:

```text
This is equivalent as the previous example, but we are explicitly defining the
isolation strategy so it applies to lower (or LowConn) domain boundaries
```

Subitem:

```text
This makes the input of BlkA/PD1 to be considered an output of PD_TOP
```

Figura:

```text
PD_TOP
iso_enable
ISO
PD1 / BlkA
```

### Interpretação

Este slide mostra uma forma equivalente de obter o mesmo isolamento, mas vista do domínio superior.

Em vez de dizer:

```text
defina isolation para BlkA/PD1 no parent
```

o comando diz:

```text
defina isolation para PD_TOP na lower boundary
```

A opção crítica é:

```tcl
-applies_to_boundary lower
```

Isso faz com que a fronteira inferior do `PD_TOP`, isto é, a conexão com o domínio filho, seja considerada como boundary onde isolation pode ser aplicada.

O slide explica a consequência:

```text
a entrada de BlkA/PD1 passa a ser considerada como saída de PD_TOP
```

### Por que isso importa?

UPF pode descrever a mesma interface de dois pontos de vista:

1. Do domínio filho:
   - isolation no parent.
2. Do domínio pai:
   - isolation na lower boundary.

Isso é útil em fluxos hierárquicos e em estratégias onde o top controla as fronteiras com domínios internos.

---

## Slide 28 — Defining Isolation: Location Parent — From the block

### Texto extraído

Título:

```text
Defining Isolation: Location Parent
```

Texto:

```text
From the block:
```

Comando mostrado:

```tcl
set_isolation MyIso -domain PD1 \
    -isolation_power_net VDDtop ... \
    -location parent \
    -isolation_signal iso_enable ... \
```

Texto:

```text
To define this strategy from the scope of BlkA, the top-level VDD and the
top-level control signal both need to be pulled to the block-level
```

Subitem:

```text
Otherwise, the objects you are referring to are not defined at the scope of the block
```

Figura:

```text
PD_TOP
iso_enable
ISO
PD1 / BlkA
```

### Interpretação

Este slide mostra a mesma ideia do slide 26, mas tentando definir a estratégia a partir do escopo do bloco `BlkA`.

O problema é que, dentro do bloco, objetos do top talvez não existam diretamente:

```text
VDDtop
iso_enable
```

Se esses objetos não são visíveis no escopo do bloco, o comando não pode referenciá-los.

Para a estratégia funcionar a partir do bloco, é necessário “puxar” para o bloco:

- a supply top-level;
- o sinal de controle top-level.

### Regra prática

```text
O scope onde set_isolation é definido precisa enxergar o sinal de controle e a supply de isolation.
```

Se esses objetos existem apenas no top, defina a estratégia no top ou crie conectividade/portas para expô-los no bloco.

---

## Slide 29 — Using Special Lib-Cells

### Texto extraído

Título:

```text
Using Special Lib-Cells
```

Tópico:

```text
NOR-style isolation cells
```

Pontos:

```text
To use a NOR-type isolation library cell:
```

Subitens:

```text
Primary ground supply of the domain must be equal or more ON than the sink supply
UPF isolation policy should use clamp value 0
Driver cell supply should be more or equal ON when primary supply of the domain
```

Comando destacado:

```tcl
-isolation_supply_set {}
```

Figura:

```text
ISO NOR
A
ISO
Z
VDD_SW
VSS
```

### Interpretação

Este slide introduz células especiais de isolation do tipo **NOR-style**.

Essas células têm comportamento específico: conseguem forçar a saída para ground/clamp 0 em certas condições mesmo quando o domínio está em shutdown.

A aula indica requisitos para usar esse tipo:

1. O ground primário do domínio precisa estar pelo menos tão ligado quanto a supply do sink.
2. A política de isolation deve usar:

```text
clamp value 0
```

3. A supply da célula driver deve estar tão ligada quanto necessário quando a primary supply do domínio está em uso.

Para esse tipo de célula, o UPF usa:

```tcl
-isolation_supply_set {}
```

ou seja, não define uma supply set de isolation separada como normalmente faria.

### Ponto importante

NOR-style isolation é caso especial. Não se deve aplicar a regra geral de isolation supply sem considerar o tipo da célula na biblioteca.

---

## Slide 30 — Using NOR-style Isolation Example

### Texto extraído

Título:

```text
Using NOR-style Isolation Example
```

Comandos mostrados:

```tcl
set_isolation ISO1
    -domain PD_BLK
    -isolation_supply_set {} \
    -clamp_value 0 \
    -applies_to outputs
```

```tcl
set_isolation_control ISO1 -domain PD_BLK \
    -isolation_signal {control[0]} \
    -isolation_sense high \
    -location self
```

Texto:

```text
You can use single rail NOR type isolation cell in a shut-down domain,
regardless they don't have an isolation supply
```

Subitem:

```text
They can clamp its output to ground while the primary of the domain is turned off
```

Figura:

```text
PD_TOP
VDD_AO
PD_BLK
VDD_SW
ISO1
```

### Interpretação

Este exemplo mostra a forma prática de usar uma célula NOR-style de isolation.

A estratégia tem duas partes:

1. `set_isolation`, que define:
   - domínio;
   - ausência de isolation supply set;
   - clamp value 0;
   - aplicação em outputs.

2. `set_isolation_control`, que define:
   - sinal de controle;
   - polaridade;
   - localização.

A célula fica dentro do domínio desligável:

```tcl
-location self
```

Apesar de ser single-rail, ela consegue prender a saída em ground enquanto a primary supply do domínio está desligada.

### Observação importante

Esse slide usa `set_isolation_control`, que aparece em fluxos UPF para separar a definição da estratégia da definição do controle. Em outros slides, `set_isolation` aparece com `-isolation_signal` e `-isolation_sense` diretamente. O importante é entender a função: associar sinal e polaridade à estratégia de isolamento.

---

## Slide 31 — Isolation Gotchas

### Texto extraído

Título:

```text
Isolation Gotchas
```

Pontos:

```text
Not all ports should be isolated
```

Exemplos:

```text
Control signals for power management cells
```

Subitem:

```text
If you do isolate the control signal, what are you using as the control signal for your isolation cell?
```

```text
Scan ports
```

Subitem:

```text
If you need to toggle your scan chain while isolation is enabled, you cannot have your scan ports isolated
```

Outro ponto:

```text
Signals with isolation should be level sensitive, not edge sensitive
```

Subitem:

```text
The act of isolating and releasing may cause an edge
```

### Interpretação

Este slide traz pegadinhas práticas muito importantes.

## 1. Nem todas as portas devem ser isoladas

Isolar tudo indiscriminadamente é perigoso.

### Sinais de controle de power management

Se você isola o sinal que controla a própria isolation cell, cria um paradoxo:

```text
quem controla a isolation da isolation?
```

Sinais que controlam:

- isolation;
- power switch;
- retention;
- always-on logic;

normalmente precisam ser tratados com cuidado e podem não ser bons candidatos a isolation simples.

### Scan ports

Se durante teste você precisa alternar scan chain enquanto isolation está ativa, os scan ports não podem ser isolados, pois o scan deixaria de funcionar.

## 2. Sinais isolados devem ser level-sensitive

O ato de ligar/desligar isolation pode gerar uma transição.

Se o receptor interpreta bordas, essa transição pode ser vista como evento real.

Por isso, sinais com isolation devem preferencialmente ser level-sensitive, não edge-sensitive.

### Exemplo de risco

Se uma saída isolada alimenta um clock ou um enable sensível a borda, soltar a isolation pode gerar uma borda falsa.

---

## Slide 32 — Isolation Gotchas — default values

### Texto extraído

Título:

```text
Isolation Gotchas
```

Pontos:

```text
Be careful of "default" values
```

Subitem:

```text
Different tools might not have same assumptions
```

Exemplo:

UPF incompleto:

```tcl
set_isolation ISOL \
    -domain DOM \
    -isolation_signal {net1}
```

Ferramenta 1 interpreta:

```tcl
set_isolation ISOL
    -domain DOM
    -isolation_signal {net1}
    -isolation_sense high
```

Ferramenta 2 interpreta:

```tcl
set_isolation_control ISOL
    -domain DOM
    -isolation_signal {net1}
    -isolation_sense low
```

### Interpretação

Este slide mostra por que valores default são perigosos.

Se o UPF não explicita:

```text
-isolation_sense high ou low
```

duas ferramentas podem assumir coisas diferentes.

Ferramenta 1 pode considerar controle ativo alto:

```text
isolation_sense high
```

Ferramenta 2 pode considerar ativo baixo:

```text
isolation_sense low
```

Resultado: comportamento de shutdown completamente diferente.

### Regra de ouro

```text
Não dependa de default em power intent crítico.
Explicite clamp, sense, location, supplies e applies_to sempre que possível.
```

---

## Slide 33 — Additional Isolation Strategy Tips

### Texto extraído

Título:

```text
Additional Isolation Strategy Tips
```

Pontos:

```text
User must ensure isolation strategies in the UPF are complete and provide
protection for all scenarios in the PST where isolation is needed
```

Subitens:

```text
Isolation cells are inserted by tools based on the isolation strategies in the UPF
The need for isolation cells is determined by analysis of the PST
```

Outro ponto:

```text
Implementation tools can insert/infer isolation cells but do not easily remove them
```

Subitens:

```text
If user has hand instantiated isolation cells in the design and they do not match an existing isolation strategy DC/FC will report them as incorrect but they will NOT be removed
```

```text
Automatically removing isolation cells is very risky!
```

```text
DCT/FC requires that the user explicitly remove these cells or fix the UPF to properly associate them with an ISO strategy
```

### Interpretação

Este slide fecha isolation com duas recomendações fortes.

## 1. Estratégias precisam cobrir todos os cenários da PST

Se a PST tem múltiplos estados em que um domínio pode desligar, ou múltiplas combinações de supplies, a estratégia de isolation precisa proteger todos os cenários necessários.

A ferramenta decide a necessidade de ISO a partir da análise da PST.

Se o UPF não cobre um cenário, pode haver uma interface sem proteção.

## 2. Ferramentas inserem ISO com mais facilidade do que removem

Se o usuário instanciou manualmente isolation cells no RTL/netlist e elas não batem com uma estratégia UPF, DC/FC pode reportá-las como incorretas, mas não remove automaticamente.

Motivo:

```text
remover ISO automaticamente é arriscado
```

A célula pode ter sido intencional ou necessária para outra razão.

Então o usuário deve:

- remover manualmente se for erro;
- ou corrigir o UPF para associar a célula a uma estratégia válida.

---

# Parte 2 — Power Switch Strategy

## Slide 34 — Planning Your Power Switch Strategy

### Texto extraído

Título:

```text
Planning Your Power Switch Strategy
```

Perguntas:

```text
Will you be switching power or ground supply?
```

```text
Will you be providing switched supplies externally, or on chip?
```

```text
In what domain(s) will the power switches exist?
```

Subitem:

```text
And what placement topology will you employ?
```

```text
What is the control signal for your power switch?
```

Subitens:

```text
And what is the Boolean function of your power switch on_state/off_state?
And how will you hookup your control signals?
```

### Interpretação

Power switch strategy define como o domínio desligável será fisicamente conectado ou desconectado da alimentação.

As decisões principais são:

## 1. Chavear power ou ground?

- chavear VDD → header switch;
- chavear VSS → footer switch.

## 2. Supply switchada externa ou on-chip?

Alguns designs podem receber uma supply já switchada externamente. Outros usam power switches internos no chip.

## 3. Em qual domínio os switches existem?

O power switch pode estar associado ao domínio desligável, a uma região de power management ou a uma estrutura física de power grid.

## 4. Qual topologia de placement?

- switches distribuídos;
- ring;
- colunas;
- array;
- combinação.

## 5. Qual controle e função booleana?

O UPF precisa indicar:

```text
quando o switch está ON
quando está OFF
qual sinal controla
qual polaridade real da célula
```

---

## Slide 35 — Power Switch Strategy Trade-offs — Headers vs Footers

### Texto extraído

Título:

```text
Power Switch Strategy Trade-offs
```

Pergunta:

```text
Should you switch VDD or switch VSS?
```

Tabela:

```text
Headers Switching VDD
- Lower drive and thus larger cells
- Lower leakage
- "Clamp low" isolation easier to implement
- Suits active high interface protocols
```

```text
Footers Switching VSS
- Higher drive and thus smaller cells
- Higher leakage
- Harder to do "clamp low" isolation
```

Figuras:

```text
Header:
VDD → switch → VDD_Virtual → domain → VSS

Footer:
VDD → domain → VSS_Virtual → switch → VSS
```

### Interpretação

## Header switch

Header fica entre VDD e o domínio:

```text
VDD → header → VDD_virtual
```

Vantagens:

- menor leakage;
- clamp low é mais fácil;
- combina com protocolos de interface active high.

Desvantagem:

- menor drive, então células podem ser maiores.

## Footer switch

Footer fica entre o domínio e VSS:

```text
VSS_virtual → footer → VSS
```

Vantagens:

- maior drive;
- células menores.

Desvantagens:

- maior leakage;
- clamp low é mais difícil.

### Relevância para isolation

A escolha header/footer influencia que valor é seguro para clamp e quais células ISO são mais fáceis de implementar.

---

## Slide 36 — Power Switch Strategy Trade-offs — Distributed vs Ring

### Texto extraído

Título:

```text
Power Switch Strategy Trade-offs
```

Pergunta:

```text
Should you use distributed (arrayed) or ring-style placement topology?
```

Tabela:

```text
Distributed
- Routing impact due to multiple meshes required in shutdown region
- Fewer switches required
- Better IR-drop characteristics
- Unswitched supplies readily available for AO logic
```

```text
Ring
- Low routing impact (confined to region adjacent to shutdown domain)
- More switches required
- IR-drop issues for large shutdown regions
- Typically used for legacy IP blocks
```

### Interpretação

## Distributed / Arrayed

Switches espalhados dentro/ao redor da região.

Vantagens:

- menos switches;
- melhor IR-drop;
- supplies não switchadas disponíveis para AO logic.

Desvantagens:

- maior impacto de roteamento;
- exige múltiplas malhas na shutdown region.

## Ring

Switches em anel ao redor do domínio.

Vantagens:

- menor impacto de roteamento dentro do bloco;
- confinado à borda/região adjacente;
- comum em IP legado.

Desvantagens:

- mais switches;
- pode ter IR-drop ruim em regiões grandes.

### Regra prática

```text
Distributed é melhor eletricamente, mas mais invasivo.
Ring é menos invasivo, mas pode exigir mais switches e sofrer IR-drop.
```

---

## Slide 37 — Power Switch Strategy Trade-offs — Daisy Chain vs High-fanout

### Texto extraído

Título:

```text
Power Switch Strategy Trade-offs
```

Pergunta:

```text
How should you connect the power switches?
```

Tabela:

```text
Daisy Chain
- Requires buffered power switches
- Requires extra time for region turn-on
- Provides for low in-rush current
```

```text
High-fanout
- No buffers required on switches
- Faster turn on
- Greater exposure to in-rush current issues
```

Observação:

```text
Often, some combination of these two is employed
```

Exemplo:

```text
separate columns of daisy chained switches
```

### Interpretação

Power switches precisam ser controlados. A rede de controle pode ser conectada de formas diferentes.

## Daisy chain

O controle passa sequencialmente de switch para switch.

Vantagens:

- reduz in-rush current;
- liga a região gradualmente.

Desvantagens:

- turn-on mais lento;
- precisa switches/buffers adequados.

## High-fanout

O controle vai em paralelo para muitos switches.

Vantagens:

- turn-on rápido;
- menos necessidade de buffers nos switches.

Desvantagens:

- maior risco de in-rush current, porque muitos switches ligam simultaneamente.

### Combinação

A prática comum é combinar:

```text
colunas separadas de switches em daisy chain
```

Isso tenta equilibrar tempo de turn-on e corrente de inrush.

---

## Slide 38 — Flow Recommendations

### Texto extraído

Título:

```text
Flow Recommendations
```

Pontos:

```text
Using headers to switch off VDD is much more common than using footers
```

```text
Make sure to note the polarity of the control signals and honor this in the UPF
```

Subitens:

```text
Polarity mistakes in UPF are not detected until physical implementation, when actual switches are inserted
Optimization cannot change the polarity from what is in UPF
Liberty standard can be a bit confusing
```

Detalhe:

```text
Switch_function attribute denotes Boolean state when header/footer is switched,
i.e. when the output power is off
```

Outro ponto:

```text
Where possible, use headers/footers that propagate control signals
```

Subitens:

```text
Provides acknowledge signal back to power controller
Simplifies propagating switch signals through switch arrays
```

### Interpretação

Este slide traz recomendações práticas de fluxo.

## 1. Headers são mais comuns

Chavear VDD com header é mais comum do que usar footers para VSS.

## 2. Polaridade é crítica

O UPF precisa refletir exatamente a polaridade real do controle.

Erro de polaridade pode ser descoberto tarde, só quando os switches físicos são inseridos.

Além disso:

```text
optimization cannot change polarity from what is in UPF
```

Se o UPF diz que uma polaridade é certa, a ferramenta não pode simplesmente inverter para corrigir.

## 3. `switch_function` pode confundir

O atributo Liberty `switch_function` indica o estado booleano quando o header/footer está switched, isto é, quando a power output está OFF.

Isso pode ser contraintuitivo: o nome pode sugerir “quando liga”, mas o slide alerta que representa o estado de switchamento/desligamento.

## 4. Propagação de controle e acknowledge

Se possível, usar switches que propagam sinais de controle ajuda:

- a retornar acknowledge para o power controller;
- a encadear switches em arrays.

---

## Slide 39 — Power Switch Command Syntax

### Texto extraído

Título:

```text
Power Switch Command Syntax
```

Sintaxe:

```tcl
create_power_switch <switch_name>
    -domain <domain_name>
    -output_supply_port <port_name supply_net_name>
    {-input_supply_port <port_name supply_net_name>}*
    {-control_port <port_name net_name>}*
    {-on_state {state_name input_supply_port {boolean_function}}}*
    [-on_partial_state {state_name input_supply_port {boolean_function}}]*
    [-off_state {state_name {boolean_function}}]*
    [-error_state {state_name {boolean_function}}]*
    [-supply_set {supply set reference}]
    [-ack_port <port_name net_name>] [-ack_delay <ack port delay>]
```

Pontos:

```text
Defines a logical placeholder for power switch in the UPF
```

Subitem:

```text
Generally represents many physical switches
```

```text
Multiple control and acknowledge signals may be defined
```

```text
-on_partial_state and -error_state are for simulation only
```

### Interpretação

`create_power_switch` cria um objeto lógico de power switch no UPF.

Ele não é ainda uma célula física única. Muitas vezes representa um conjunto de muitos switches físicos.

Campos principais:

## `-domain`

Domínio ao qual o switch se aplica.

## `-input_supply_port`

Supply de entrada, normalmente a supply não switchada.

## `-output_supply_port`

Supply de saída, normalmente a supply virtual.

## `-control_port`

Sinal de controle.

## `-on_state`

Define quando o switch está ON, com função booleana.

## `-off_state`

Define estado OFF.

## `-ack_port`

Define sinal de acknowledge, útil para power controller.

## `-on_partial_state` e `-error_state`

O slide alerta que são usados apenas para simulação.

---

## Slide 40 — Power Switch Mapping

### Texto extraído

Título:

```text
Power Switch Mapping
```

Pontos:

```text
Power switches remain logical objects until physical implementation, where actual power network is created
```

Subitem:

```text
map_power_switch is used to define power switch mapping
```

Outro ponto:

```text
DC, FC and ICC II, physically map the constraint to real switch cells
```

Comando:

```tcl
map_power_switch -domain <domain_name> -lib_cell <lib_cell_name> <switch_name>
```

### Interpretação

Depois de criar o switch lógico com:

```tcl
create_power_switch
```

é necessário mapear para células reais com:

```tcl
map_power_switch
```

Até a implementação física, o switch é apenas uma intenção lógica.

Durante implementação, DC/FC/ICC II mapeiam a restrição para células reais da biblioteca.

### Ponto-chave

```text
create_power_switch define a intenção.
map_power_switch define a célula real permitida/usada.
```

---

## Slide 41 — Power Switch Example

### Texto extraído

Título:

```text
Power Switch Example
```

Comando mostrado:

```tcl
create_power_switch pdsw_sx
    -domain PD_SW
    -input_supply_port {in PD_SW.ss_unswitched}
    -output_supply_port {out PD_SW.primary}
    -control_port {sleep u_dh_sleep_logic/sleep}
    -on_state {on in {!sleep}}
```

Nota:

```text
"in", "out", "sleep", and "on" are merely user-defined virtual pin labels,
not actual switch pin names
```

Figura:

```text
TOP.primary
PD_SW.ss_unswitched
PD_SW.primary
PD_SW
pd_switchable (0.9V / OFF)
sleep
pdsw_sx
TOP.default_isolation
ELS
```

### Interpretação

Este exemplo cria o power switch `pdsw_sx` para o domínio `PD_SW`.

## Input supply

```tcl
-input_supply_port {in PD_SW.ss_unswitched}
```

A entrada do switch é a supply não switchada.

## Output supply

```tcl
-output_supply_port {out PD_SW.primary}
```

A saída do switch alimenta a primary supply do domínio `PD_SW`.

## Control port

```tcl
-control_port {sleep u_dh_sleep_logic/sleep}
```

O sinal `sleep` controla o switch.

## ON state

```tcl
-on_state {on in {!sleep}}
```

O switch está ON quando:

```text
!sleep
```

Ou seja, quando `sleep = 0`.

### Nota importante

Os nomes:

```text
in
out
sleep
on
```

são labels virtuais definidos pelo usuário no UPF. Eles não são necessariamente nomes reais de pinos da célula física. O mapeamento para pinos reais acontece depois com biblioteca/mapping.

---

# Parte 3 — State Retention Strategy

## Slide 42 — Planning Your Retention Strategy

### Texto extraído

Título:

```text
Planning Your Retention Strategy
```

Perguntas:

```text
Are you doing full or partial state retention?
```

```text
Will your retention control signal be active high or active low?
```

```text
What type(s) of retention registers will you allow?
```

Pergunta associada ao controle:

```text
And from where will this signal be driven?
```

### Interpretação

Antes de escrever comandos de retention, é preciso decidir a estratégia arquitetural.

## Full ou partial retention?

- **Full-state retention:** todos os registradores relevantes do domínio são retidos.
- **Partial-state retention:** apenas alguns registradores são retidos.

Partial retention é mais difícil porque o design precisa ser arquitetado para funcionar corretamente quando apenas parte do estado sobrevive ao shutdown.

## Controle ativo alto ou baixo?

Sinais como:

```text
save
restore
```

precisam ter polaridade clara.

## Tipo de retention register

A biblioteca pode ter diferentes tipos de células de retenção. A estratégia precisa permitir/mapear tipos adequados.

## Origem do sinal

Assim como isolation, os sinais de retention precisam ser visíveis no scope onde a estratégia é definida.

---

## Slide 43 — Implementing State Retention

### Texto extraído

Título:

```text
Implementing State Retention
```

Pontos:

```text
Unless a design has been explicitly architected for partial state retention, don't go there!
```

Subitens:

```text
Full state retention is strongly recommended over partial
Easier to implement and verify than partial
```

Outro ponto:

```text
Retained and non-retained states should have independent reset networks in RTL
```

Subitens:

```text
Allows functional simulation testing before state retention is implemented
Provides clear visibility as to which reset terms factor into state registers
```

Outro ponto:

```text
Only use single edge of the clock, to ensure the clock gating latch state can always be re-evaluated correctly
```

### Interpretação

Este slide é muito importante para metodologia.

## 1. Partial retention é perigosa

O slide é direto:

```text
se o design não foi explicitamente arquitetado para partial retention, não use.
```

Full-state retention é recomendada porque é mais simples de implementar e verificar.

## 2. Reset networks independentes

Estados retidos e não retidos devem ter redes de reset independentes no RTL.

Por quê?

- permite simulação funcional antes de inserir retention;
- deixa claro quais resets afetam quais registradores;
- ajuda a verificar comportamento após shutdown/restore.

## 3. Usar apenas uma borda de clock

O slide recomenda usar single edge de clock para garantir que o estado de clock gating latch possa ser reavaliado corretamente.

Isso evita ambiguidades em designs que usam múltiplas bordas e mecanismos de clock gating.

---

## Slide 44 — Retention Register Commands

### Texto extraído

Título:

```text
Retention Register Commands
```

Fluxo:

```text
set_retention
      ↓
map_retention_cell
```

Pontos:

```text
All registers targeted for retention cell inference must be covered by a
map_retention_cell constraint
```

Subitem:

```text
Otherwise, they will not be synthesized as retention cells
```

### Interpretação

A sequência para retention é:

```text
1. set_retention
2. map_retention_cell
```

`set_retention` define a estratégia:

- domínio;
- elementos;
- supplies;
- save/restore;
- condições.

`map_retention_cell` diz quais células reais da biblioteca podem implementar essa estratégia.

O slide alerta:

```text
registradores alvo de retention precisam estar cobertos por map_retention_cell
```

Caso contrário, a síntese não os transforma em retention cells.

### Regra prática

```text
set_retention sem map_retention_cell é estratégia incompleta para síntese.
```

---

## Slide 45 — `set_retention`

### Texto extraído

Título:

```text
set_retention
```

Sintaxe:

```tcl
set_retention <retention_strategy>
    -domain power_domain
    [-retention_power_net <retention_power_net>]
    [-retention_ground_net <retention_ground_net>]
    [-retention_supply_set <supply_set_ref>]
    [-no_retention]
    [-exclude_elements]
    [-elements objects]
    -save_signal {{net_name <high | low>}}
    -restore_signal {{net_name <high | low>}}
    [-update]
    [-save_condition {boolean function}]
    [-restore_condition {boolean function}]
    [-retention_condition {boolean function}]
```

### Interpretação

`set_retention` define a estratégia de retenção.

Campos principais:

## `-domain`

Domínio no qual a estratégia se aplica.

## Retention supplies

Podem ser definidas por:

```text
-retention_power_net
-retention_ground_net
-retention_supply_set
```

## `-elements`

Limita a estratégia a registradores específicos.

Se não usado, a estratégia pode se aplicar a todos os registradores do domínio, conforme explicado no slide seguinte.

## `-save_signal`

Sinal que salva o estado antes do shutdown.

Exemplo:

```tcl
-save_signal {save high}
```

## `-restore_signal`

Sinal que restaura estado após religar.

Exemplo:

```tcl
-restore_signal {restore high}
```

## Condições

Também é possível usar:

```text
-save_condition
-restore_condition
-retention_condition
```

para modelar condições booleanas mais complexas.

---

## Slide 46 — `set_retention` Considerations

### Texto extraído

Título:

```text
set_retention Considerations
```

Pontos:

```text
Retention supplies must be "always-on" for as long as registers need to hold their value
```

```text
Unless -elements option is used, this constraint will apply to all registers in the specified power domain
```

```text
You have the option to specify retention supplies in the strategy using only one of the following:
```

Subitem:

```text
Supply set, supply set functions, or supply nets
```

Outro ponto:

```text
The save and restore signals need to exist at the scope where retention is defined
```

Subitens:

```text
If the logical connectivity doesn't already exist, signals will be stitched up to the scope at which the set_retention command was defined
```

```text
e.g., if set_retention was defined at the top scope, save and restore will be stitched up to the top of the design
```

### Interpretação

Este slide traz regras críticas.

## 1. Retention supply precisa ser always-on

A supply de retenção precisa permanecer ligada enquanto o registrador precisa manter valor.

Se a retention supply também desligar, o estado será perdido.

## 2. Cuidado com ausência de `-elements`

Se você não usa:

```tcl
-elements
```

a estratégia se aplica a todos os registradores do domínio.

Isso pode ser desejado em full retention, mas perigoso se o objetivo era partial retention.

## 3. Especificar supplies de uma única forma

O slide diz para usar apenas uma forma entre:

```text
supply set
supply set functions
supply nets
```

Misturar formas pode gerar ambiguidade.

## 4. Save/restore precisam existir no scope

Assim como isolation, retention depende de scope.

Se `set_retention` é definido no top, sinais `save` e `restore` podem ser costurados até o topo se a conectividade não existir.

### Ponto prático

```text
Defina retention no scope certo para evitar stitching inesperado de save/restore.
```

---

## Slide 47 — `map_retention_cell`

### Texto extraído

Título:

```text
map_retention_cell
```

Sintaxe:

```tcl
map_retention_cell <retention_strategy>
    -domain power_domain
    [-lib_cells lib_cells]
    [-lib_cell_type lib_cell_type]
    [-lib_model_name {-port <port_name> <net_ref>}]
    [-elements objects]
```

Pontos:

```text
Directs mapping of specified sequential cells to specific retention cells during synthesis
```

Nota:

```text
Simulation uses retention functionality described in retention strategy,
not what's described in library cell model
```

Subitem:

```text
User must ensure behaviors correspond appropriately
```

### Interpretação

`map_retention_cell` mapeia a estratégia para células reais da biblioteca.

Ele diz à síntese:

```text
estes registradores devem virar estas células de retenção
```

Opções:

- `-lib_cells`: lista de células específicas;
- `-lib_cell_type`: tipo de célula;
- `-elements`: aplicar a elementos específicos.

### Nota importante sobre simulação

A simulação usa a funcionalidade descrita na estratégia de retention, não necessariamente o comportamento completo do modelo de biblioteca.

Por isso, o usuário precisa garantir que:

```text
o comportamento UPF da estratégia corresponde ao comportamento real da célula de biblioteca.
```

Se houver divergência, simulação e implementação podem não representar a mesma coisa.

---

## Slide 48 — `set_retention -no_retention`

### Texto extraído

Título:

```text
set_retention -no_retention
```

Pontos:

```text
Allows users to define specific elements which should not be retained
```

Exemplo:

```text
Specify a retention strategy for a power domain:
```

```tcl
set_retention RS1 -domain PD_SW \
    -retention_power_net rs1_power \
    -retention_ground_net rs1_ground
```

Depois:

```text
Then specify a "non-retention" strategy for specific elements in that power domain:
```

```tcl
set_retention RS1_no -domain PD_SW \
    -no_retention -elements {list R1 R2 R3}
```

Caixa amarela:

```text
The storage elements specified by the RS1_no strategy will not have retention capability
```

### Interpretação

Este slide mostra como excluir registradores específicos de uma estratégia de retenção.

Imagine que a estratégia geral aplica retenção ao domínio `PD_SW`:

```tcl
set_retention RS1 -domain PD_SW ...
```

Mas alguns registradores não devem ser retidos:

```text
R1, R2, R3
```

Então se define:

```tcl
set_retention RS1_no -domain PD_SW \
    -no_retention -elements {list R1 R2 R3}
```

Isso é útil em full retention com exceções ou em partial retention controlada.

### Pegadinha

Se o design não foi arquitetado para partial retention, excluir elementos pode quebrar o comportamento após restore. Use com cuidado.

---

## Slide 49 — Retention Register Example — supply set

### Texto extraído

Título:

```text
Retention Register Example
```

Ponto:

```text
Retention strategy for PD_SW power domain
```

Comandos:

```tcl
set_retention pdsw_ret
    -domain PD_SW
    -retention_supply_set PD_SW.unswitched
    -save_signal {save high}
    -restore_signal {restore high}

map_retention_cell pdsw_ret
    -domain PD_SW
    -lib_cells ret_lib_cell
```

Figura:

```text
TOP.primary
PD_SW.unswitched
PD_SW.primary
PD_SW
pd_switchable (0.9V / OFF)
sleep
save
restore
RR
pdsw_sx
TOP.default_isolation
ELS
```

### Interpretação

Este exemplo usa `retention_supply_set`.

A estratégia:

```tcl
-retention_supply_set PD_SW.unswitched
```

indica que os retention registers são alimentados pela supply não switchada do domínio `PD_SW`.

Isso faz sentido porque, quando a primary supply switchada do domínio desliga, a supply de retenção precisa continuar ligada.

Sinais:

```tcl
-save_signal {save high}
-restore_signal {restore high}
```

A retenção é controlada por sinais ativos em nível alto.

O mapeamento:

```tcl
map_retention_cell pdsw_ret -lib_cells ret_lib_cell
```

diz qual célula de biblioteca será usada.

---

## Slide 50 — Retention Register Example — power/ground nets

### Texto extraído

Título:

```text
Retention Register Example
```

Ponto:

```text
Retention strategy for PD_SW power domain
```

Comandos:

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

Figura:

```text
TOP
VDD
VDDL
VSS
PD_SW
pd_switchable (0.9V / OFF)
VDDLS1
VDDL
RR
ISO
sleep
save
restore
pd_iso
```

### Interpretação

Este exemplo define as supplies de retenção por nets explícitas:

```tcl
-retention_power_net VDDL
-retention_ground_net VSS
```

Em vez de usar um supply set, o comando aponta diretamente para power e ground nets.

O mapeamento usa:

```tcl
-lib_cell_type RDFFSRX1
```

Em vez de listar uma célula específica com `-lib_cells`.

### Comparação com slide 49

| Slide | Forma de especificar supply | Forma de mapear célula |
|---|---|---|
| 49 | `-retention_supply_set PD_SW.unswitched` | `-lib_cells ret_lib_cell` |
| 50 | `-retention_power_net VDDL` + `-retention_ground_net VSS` | `-lib_cell_type RDFFSRX1` |

Ambas são válidas metodologicamente, mas o slide 46 lembra: escolha **uma forma** de especificar retention supplies na estratégia.

---

# Aula didática desenvolvida

## 1. Isolation pode ser descrita do ponto de vista do filho ou do pai

Os slides 26 e 27 mostram uma ideia muito importante:

```text
A mesma interface pode ser descrita pelo domínio filho com -location parent
ou pelo domínio pai com -applies_to_boundary lower.
```

Isso é útil porque em UPF hierárquico às vezes o top controla as fronteiras dos sub-blocos, enquanto em outros fluxos o próprio bloco carrega seu UPF.

A escolha depende de:

- quem possui o UPF;
- onde o sinal de controle está;
- onde a supply está;
- se o bloco é IP reutilizável;
- se a implementação é flat ou hierárquica.

---

## 2. Scope errado causa comando aparentemente correto, mas inválido

No slide 28, a estratégia parece parecida com a do slide 26, mas é definida no escopo do bloco.

O problema é:

```text
VDDtop e iso_enable existem no top, não necessariamente dentro do bloco.
```

Logo, se você define a estratégia no bloco, precisa trazer esses objetos para o bloco ou definir a estratégia no top.

Regra:

```text
O comando só pode referenciar objetos visíveis no scope onde ele é executado.
```

---

## 3. NOR-style isolation é uma exceção que exige biblioteca compatível

A regra geral de isolation exige supply de isolation always-on. Mas NOR-style isolation pode usar uma célula single-rail especial que prende a saída em ground, mesmo quando a primary supply do domínio está OFF.

Por isso aparece:

```tcl
-isolation_supply_set {}
```

Mas isso só faz sentido se a biblioteca tem a célula adequada e se a política usa:

```text
clamp value 0
```

Não é uma solução genérica para qualquer isolamento.

---

## 4. Isolation não deve ser aplicada cegamente em todos os ports

O slide 31 é uma das partes mais práticas do módulo.

Não isole cegamente:

- control signals de PM cells;
- scan ports;
- sinais edge-sensitive.

Motivo:

```text
isolation pode bloquear o próprio controle do power management,
quebrar scan,
ou gerar bordas falsas na liberação.
```

---

## 5. Defaults são inimigos da portabilidade

Se o UPF omite `isolation_sense`, uma ferramenta pode assumir `high` e outra `low`.

Isso é grave porque a célula de isolation pode ativar no momento errado.

Por isso, em power intent importante:

```text
evite defaults.
explicite tudo.
```

---

## 6. Power switch é um objeto lógico antes de virar célula física

`create_power_switch` não cria diretamente uma célula física. Ele cria um placeholder lógico, que pode representar muitos switches físicos.

Só na implementação física, com `map_power_switch`, a intenção é associada a células reais.

Essa separação é essencial:

```text
UPF descreve intenção.
Implementação física cria a rede real.
```

---

## 7. Header versus footer afeta isolation e leakage

Header switch é mais comum porque:

- tem menor leakage;
- torna clamp low mais simples;
- combina com protocolos active high.

Footer pode ser menor por drive maior, mas tem maior leakage e dificulta clamp low.

Essa escolha deve ser feita cedo, porque impacta power grid, isolation, biblioteca e verificação.

---

## 8. Topologia de power switch é compromisso entre IR-drop, roteamento e inrush

Distributed/arrayed:

```text
melhor IR-drop, menos switches, mas mais impacto de roteamento.
```

Ring:

```text
menor impacto no bloco, mas mais switches e risco de IR-drop em regiões grandes.
```

Daisy chain:

```text
liga mais devagar, mas reduz inrush.
```

High fanout:

```text
liga rápido, mas aumenta risco de inrush.
```

---

## 9. Retention deve ser full, salvo projeto pensado para partial

A aula é bastante direta:

```text
Unless explicitly architected for partial state retention, don't go there.
```

Partial retention é difícil porque o design precisa funcionar corretamente com apenas parte do estado preservado. Isso exige arquitetura, reset e verificação pensados desde o início.

---

## 10. `set_retention` sem `map_retention_cell` não fecha o fluxo de síntese

`set_retention` define a intenção de reter estado.

Mas para síntese, a ferramenta precisa saber quais células podem implementar isso:

```tcl
map_retention_cell
```

Se os registradores alvo não são cobertos por `map_retention_cell`, não serão sintetizados como retention cells.

---

## 11. Retention supply precisa ficar ligada enquanto o estado for necessário

Isso parece óbvio, mas é uma causa crítica de erro.

Se a supply de retenção desliga, o estado desaparece.

Portanto, retention supply deve ser:

```text
always-on pelo menos durante todo o período em que os registros precisam manter valor.
```

---

## 12. `-no_retention` permite exceções, mas exige arquitetura

A opção:

```tcl
-no_retention
```

permite excluir certos registradores da retenção.

Isso é útil, mas perigoso se o design não foi feito para partial retention. Excluir estado necessário pode gerar comportamento errado após restore.

---

# Conceitos difíceis explicados em profundidade

## `-location parent`

Insere a célula de isolation fora do domínio alvo, no domínio pai. Bom quando o controle e a supply estão no parent, mas pode dificultar encapsulamento hierárquico.

---

## `-applies_to_boundary lower`

Aplica a estratégia nas fronteiras inferiores do domínio, isto é, nas conexões com domínios filhos. Permite descrever a fronteira do ponto de vista do domínio pai.

---

## `set_isolation_control`

Comando usado em alguns fluxos para associar sinal de controle e polaridade a uma estratégia de isolation já definida.

---

## NOR-style isolation

Tipo especial de isolation cell, geralmente clamp 0, que pode operar sem uma isolation supply set separada em certas condições.

---

## `isolation_sense`

Polaridade do sinal de controle de isolation. Deve ser explicitada para evitar diferenças de default entre ferramentas.

---

## `create_power_switch`

Comando UPF que cria um power switch lógico, representando input supply, output supply virtual e sinais de controle.

---

## Header switch

Power switch que chaveia VDD. Fica entre VDD e a supply virtual do domínio.

---

## Footer switch

Power switch que chaveia VSS. Fica entre a supply virtual de ground e VSS.

---

## In-rush current

Corrente alta que pode ocorrer quando muitos switches ligam simultaneamente e carregam a capacitância da região desligada.

---

## Daisy chain switch control

Conexão sequencial de switches para ligar gradualmente e reduzir inrush.

---

## High-fanout switch control

Conexão paralela de controle para muitos switches, permitindo turn-on rápido, mas com maior risco de inrush.

---

## `map_power_switch`

Comando que mapeia o power switch lógico para células reais de biblioteca.

---

## Full-state retention

Estratégia em que todos os registradores relevantes do domínio preservam estado.

---

## Partial-state retention

Estratégia em que apenas parte do estado é preservada. Exige arquitetura e verificação específicas.

---

## `set_retention`

Comando UPF que define a estratégia de retenção: domínio, supplies, save/restore, elementos e condições.

---

## `map_retention_cell`

Comando que mapeia registradores alvo para células de retention na biblioteca.

---

## `-no_retention`

Opção para declarar que certos elementos não devem ter retenção.

---

# Comandos importantes da parte B

## Isolation — location parent

```tcl
set_isolation MyIso -domain BlkA/PD1 \
    -isolation_power_net VDDtop ... \
    -location parent \
    -isolation_signal iso_enable ...
```

## Isolation — lower boundary

```tcl
set_isolation MyIso -domain PD_TOP \
    -isolation_power_net VDDtop ... \
    -applies_to_boundary lower \
    -isolation_signal iso_enable ...
```

## NOR-style isolation

```tcl
set_isolation ISO1
    -domain PD_BLK
    -isolation_supply_set {} \
    -clamp_value 0 \
    -applies_to outputs

set_isolation_control ISO1 -domain PD_BLK \
    -isolation_signal {control[0]} \
    -isolation_sense high \
    -location self
```

## Power switch

```tcl
create_power_switch <switch_name>
    -domain <domain_name>
    -output_supply_port <port_name supply_net_name>
    -input_supply_port <port_name supply_net_name>
    -control_port <port_name net_name>
    -on_state {state_name input_supply_port {boolean_function}}
    -off_state {state_name {boolean_function}}
    -ack_port <port_name net_name>
```

Exemplo:

```tcl
create_power_switch pdsw_sx
    -domain PD_SW
    -input_supply_port {in PD_SW.ss_unswitched}
    -output_supply_port {out PD_SW.primary}
    -control_port {sleep u_dh_sleep_logic/sleep}
    -on_state {on in {!sleep}}
```

Mapeamento:

```tcl
map_power_switch -domain <domain_name> \
    -lib_cell <lib_cell_name> <switch_name>
```

## Retention

```tcl
set_retention <retention_strategy>
    -domain power_domain
    -retention_supply_set <supply_set_ref>
    -save_signal {{net_name high|low}}
    -restore_signal {{net_name high|low}}
```

Com nets explícitas:

```tcl
set_retention pdsw_ret
    -domain PD_SW
    -retention_power_net VDDL
    -retention_ground_net VSS
    -save_signal {save high}
    -restore_signal {restore high}
```

Mapeamento:

```tcl
map_retention_cell <retention_strategy>
    -domain power_domain
    -lib_cells <lib_cells>
```

ou:

```tcl
map_retention_cell pdsw_ret
    -domain PD_SW
    -lib_cell_type RDFFSRX1
```

Exclusão:

```tcl
set_retention RS1_no -domain PD_SW \
    -no_retention -elements {list R1 R2 R3}
```

---

# Tabelas de revisão

## Isolation — scope e localização

| Caso | Comando/conceito | Ideia |
|---|---|---|
| Definir do top para bloco filho | `-domain BlkA/PD1 -location parent` | ISO no parent, usando sinais/supplies visíveis no top |
| Definir do domínio pai | `-domain PD_TOP -applies_to_boundary lower` | Fronteira inferior do top é tratada como boundary de isolation |
| Definir do bloco | `-domain PD1 -location parent` | Requer que VDD/control do top sejam visíveis no bloco |
| NOR-style | `-isolation_supply_set {}` | Caso especial, geralmente clamp 0 |

---

## Power switch — tradeoffs

| Decisão | Opção 1 | Opção 2 |
|---|---|---|
| Chavear supply | Header switching VDD | Footer switching VSS |
| Leakage | Header menor | Footer maior |
| Drive/tamanho | Header menor drive/células maiores | Footer maior drive/células menores |
| Clamp low | Header mais fácil | Footer mais difícil |
| Topologia | Distributed/arrayed | Ring |
| Controle | Daisy chain | High-fanout |
| Inrush | Daisy chain reduz | High-fanout aumenta risco |
| Turn-on | Daisy chain mais lento | High-fanout mais rápido |

---

## Retention — decisões principais

| Decisão | Opções/cuidados |
|---|---|
| Tipo de retenção | Full ou partial |
| Recomendação | Full, salvo design arquitetado para partial |
| Controle | Save/restore ativo alto ou baixo |
| Origem do controle | Precisa existir no scope da estratégia |
| Supply | Precisa ser always-on enquanto estado deve ser mantido |
| Aplicação | Sem `-elements`, aplica a todos os regs do domínio |
| Mapeamento | Precisa de `map_retention_cell` |
| Exceções | `set_retention -no_retention` |

---

# Figuras e diagramas importantes

## Slide 26 — Location Parent from top

Mostra `PD_TOP` controlando uma ISO na fronteira de `PD1/BlkA` com `iso_enable`. Ensina que definir no top funciona porque top enxerga VDD e controle.

## Slide 27 — Applies to Lower Boundary

Mostra a mesma interface, mas descrita a partir do domínio pai com `-applies_to_boundary lower`.

## Slide 28 — Location Parent from block

Mostra que, se a estratégia for definida no bloco, VDD e controle do top precisam ser visíveis no bloco.

## Slide 29 — NOR-style isolation cells

Mostra uma célula ISO NOR e atributos de biblioteca, destacando `-isolation_supply_set {}`.

## Slide 30 — NOR-style Isolation Example

Mostra `PD_BLK`, `VDD_AO`, `VDD_SW` e célula ISO1 single-rail clampando para ground enquanto o domínio está OFF.

## Slide 31 — Isolation Gotchas

Mostra alertas sobre PM control signals, scan ports e sinais edge-sensitive.

## Slide 32 — Default values

Mostra duas ferramentas assumindo polaridades diferentes para um UPF incompleto. É uma figura essencial para entender por que não depender de defaults.

## Slide 33 — Additional Isolation Strategy Tips

Mostra que o usuário deve cobrir todos os cenários da PST e que ferramentas não removem ISO facilmente.

## Slide 34 — Planning Power Switch Strategy

Mostra perguntas de arquitetura sobre switch de power/ground, externo/on-chip, domínio, topologia, controle e função booleana.

## Slide 35 — Headers vs Footers

Compara header switching VDD e footer switching VSS.

## Slide 36 — Distributed vs Ring

Compara topologias de placement de power switch.

## Slide 37 — Daisy Chain vs High-fanout

Compara conexão de controle dos switches.

## Slide 38 — Flow Recommendations

Destaca headers como mais comuns, cuidado com polaridade e uso de switches que propagam controle.

## Slide 39 — Power Switch Command Syntax

Mostra `create_power_switch` como placeholder lógico e opções de ON/OFF/ACK.

## Slide 40 — Power Switch Mapping

Mostra que switches permanecem lógicos até serem mapeados fisicamente.

## Slide 41 — Power Switch Example

Mostra `pdsw_sx`, `PD_SW.ss_unswitched`, `PD_SW.primary`, `sleep` e `on_state {!sleep}`.

## Slide 42 — Planning Retention Strategy

Mostra perguntas sobre full/partial retention, polaridade do controle, origem do sinal e tipos de cells.

## Slide 43 — Implementing State Retention

Mostra recomendações fortes contra partial retention sem arquitetura adequada.

## Slide 44 — Retention Register Commands

Mostra fluxo `set_retention → map_retention_cell`.

## Slide 45 — set_retention

Mostra a sintaxe completa do comando.

## Slide 46 — set_retention Considerations

Mostra cuidados com supplies always-on, `-elements`, forma única de especificar supply e scope de save/restore.

## Slide 47 — map_retention_cell

Mostra sintaxe e nota de simulação baseada na estratégia.

## Slide 48 — set_retention -no_retention

Mostra como excluir elementos específicos de retenção.

## Slide 49 — Retention Register Example com supply set

Mostra `PD_SW.unswitched` alimentando o retention register.

## Slide 50 — Retention Register Example com nets

Mostra `VDDL/VSS` como retention power/ground nets e mapeamento por `RDFFSRX1`.

---

# Pontos de prova e revisão

1. `-location parent` insere isolation fora do domínio alvo.
2. Uma strategy definida no top pode usar VDD e controle top-level porque tudo é visível no top.
3. `-applies_to_boundary lower` aplica a strategy nas fronteiras inferiores do domínio.
4. A entrada de um domínio filho pode ser tratada como saída do domínio pai.
5. Definir isolation a partir do bloco exige que controle e supply estejam visíveis no bloco.
6. Se objetos não existem no scope atual, não podem ser referenciados.
7. NOR-style isolation é uma célula especial de isolation.
8. NOR-style isolation geralmente usa clamp value 0.
9. Para NOR-style isolation, pode-se usar `-isolation_supply_set {}`.
10. NOR-style single-rail pode clamp para ground enquanto a primary supply está OFF.
11. Nem todas as portas devem ser isoladas.
12. Control signals de PM cells não devem ser isolados cegamente.
13. Scan ports não devem ser isolados se scan precisa alternar com isolation ativa.
14. Sinais com isolation devem ser level-sensitive, não edge-sensitive.
15. Isolar/liberar pode causar uma borda.
16. Defaults de isolation podem variar entre ferramentas.
17. `isolation_sense` deve ser explicitado.
18. Estratégias de isolation precisam cobrir todos os cenários da PST.
19. ISO cells são inseridas por ferramentas com base nas estratégias UPF.
20. A necessidade de ISO é determinada pela análise da PST.
21. Ferramentas inserem/inferem ISO, mas não removem facilmente.
22. ISO instanciada manualmente e não associada ao UPF pode ser reportada como incorreta.
23. Remover ISO automaticamente é arriscado.
24. Power switch strategy decide se chaveia power ou ground.
25. Power switch strategy decide se supply switchada vem externamente ou on-chip.
26. Power switch strategy decide em que domínio os switches existem.
27. Power switch strategy decide a topologia de placement.
28. Power switch strategy precisa definir controle e função booleana.
29. Header switching VDD é mais comum que footer.
30. Header tem menor leakage.
31. Header tem menor drive e pode exigir células maiores.
32. Header facilita clamp low.
33. Footer tem maior drive e células menores.
34. Footer tem maior leakage.
35. Footer dificulta clamp low.
36. Distributed topology usa múltiplas meshes e pode impactar roteamento.
37. Distributed topology exige menos switches.
38. Distributed topology tem melhor IR-drop.
39. Ring topology tem baixo impacto de roteamento dentro do domínio.
40. Ring topology exige mais switches.
41. Ring pode ter problemas de IR-drop em regiões grandes.
42. Daisy chain reduz in-rush current.
43. Daisy chain exige mais tempo de turn-on.
44. High-fanout liga mais rápido.
45. High-fanout aumenta risco de in-rush current.
46. Erros de polaridade em UPF podem aparecer apenas na implementação física.
47. Otimização não pode mudar polaridade definida no UPF.
48. `switch_function` indica estado booleano quando output power está OFF.
49. Switches que propagam controle ajudam no acknowledge.
50. `create_power_switch` cria placeholder lógico no UPF.
51. Um power switch lógico pode representar muitos switches físicos.
52. `-on_partial_state` e `-error_state` são para simulação.
53. `map_power_switch` mapeia switch lógico para lib cells.
54. `in`, `out`, `sleep` e `on` em `create_power_switch` podem ser labels virtuais.
55. Retention strategy precisa decidir full ou partial retention.
56. Full-state retention é fortemente recomendado sobre partial.
57. Partial retention só deve ser usada se o design foi arquitetado para isso.
58. Estados retidos e não retidos devem ter reset networks independentes.
59. Usar uma única borda de clock ajuda a reavaliar corretamente clock gating latch state.
60. `set_retention` deve ser seguido por `map_retention_cell`.
61. Registradores alvo precisam estar cobertos por `map_retention_cell`.
62. `set_retention` define save/restore signals.
63. Retention supplies precisam ser always-on enquanto o estado deve ser mantido.
64. Sem `-elements`, retention pode aplicar a todos os registradores do domínio.
65. Retention supplies devem ser especificadas por uma única forma: supply set, functions ou nets.
66. Save e restore precisam existir no scope onde retention é definida.
67. Se conectividade não existe, sinais podem ser stitched até o scope do `set_retention`.
68. `map_retention_cell` direciona células sequenciais para retention cells.
69. Simulação usa a funcionalidade descrita na strategy, não necessariamente o modelo da library cell.
70. `set_retention -no_retention` exclui elementos específicos de retenção.
71. Elementos especificados por strategy `-no_retention` não terão retention capability.
72. Retention com `PD_SW.unswitched` usa uma supply que continua ligada durante shutdown.
73. Retention pode ser definida com `-retention_power_net` e `-retention_ground_net`.
74. Retention pode ser mapeada por `-lib_cells` ou `-lib_cell_type`.
75. Estratégias de power intent precisam combinar arquitetura, scope, supply, controle e biblioteca.

---

# Relação com Fusion Compiler

No Fusion Compiler, as estratégias desta parte B são usadas para orientar a implementação automática e física de power management cells.

O FC precisa resolver:

```text
1. onde inserir ISO;
2. se a ISO fica no parent ou no self;
3. se a ISO usa supply always-on suficiente;
4. se a biblioteca possui célula compatível;
5. se a ISO também precisa resolver level shifting;
6. onde colocar power switches fisicamente;
7. como mapear power switches para células reais;
8. como respeitar controle, polaridade e acknowledge;
9. quais registradores devem virar retention cells;
10. quais células de retenção da biblioteca podem ser usadas;
11. quais sinais save/restore precisam ser conectados;
12. quais supplies permanecem always-on para retenção.
```

Esse conteúdo é crítico porque erros de UPF podem aparecer tarde, durante physical implementation, quando as células reais de switch, isolation e retention são inseridas.

---

# Checklist prático para revisar UPF da parte B

## Isolation

```text
1. A strategy está definida no scope correto?
2. O scope enxerga o sinal de controle?
3. O scope enxerga a supply da ISO?
4. A localização parent/self faz sentido?
5. `-applies_to_boundary lower` seria mais apropriado?
6. Existe célula ISO compatível com clamp/sense?
7. Algum sinal de PM control foi isolado indevidamente?
8. Algum scan port foi isolado indevidamente?
9. `isolation_sense` está explícito?
10. Todos os cenários da PST estão protegidos?
```

## Power switch

```text
1. O design usa header ou footer?
2. A polaridade do controle está correta?
3. A função booleana ON/OFF está correta?
4. A topologia é distributed, ring ou híbrida?
5. O controle é daisy chain, high-fanout ou combinação?
6. O risco de in-rush current foi considerado?
7. A supply virtual está modelada corretamente?
8. O switch lógico foi criado com `create_power_switch`?
9. O switch foi mapeado com `map_power_switch`?
10. A biblioteca tem células adequadas?
```

## Retention

```text
1. A estratégia é full ou partial?
2. O design foi arquitetado para partial retention?
3. Save/restore estão no scope correto?
4. A retention supply é always-on?
5. A strategy usa uma única forma de supply?
6. `-elements` foi usado se a retention não é global?
7. Há `map_retention_cell` cobrindo todos os regs alvo?
8. A célula de library corresponde ao comportamento da strategy?
9. Elementos sem retention foram explicitamente excluídos com `-no_retention`?
10. Reset networks retidas/não retidas estão claras no RTL?
```

---

## Checklist de qualidade

- [x] Bloco 081 processado conforme roteiro corrigido, slides 26-50.
- [x] O arquivo grande foi mantido dividido, sem avançar para a parte C.
- [x] A continuação de isolation foi extraída e explicada.
- [x] Power switch strategy foi tratada com tradeoffs e comandos.
- [x] State retention strategy foi iniciada com comandos e exemplos.
- [x] Figuras e diagramas foram interpretados.
- [x] Pegadinhas de scope, default values, scan, PM controls, polarity e retention foram destacadas.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 082
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 03 Module 03 — Power Strategies — parte C
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies.docx
```

- **Processar somente:** slides 51-60
- **Começar por:** `Retention Register Example`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies_parte_C.md
```

- **Depois:** Bloco 083 — `04 Module 04 - Supply Network - parte A`.
