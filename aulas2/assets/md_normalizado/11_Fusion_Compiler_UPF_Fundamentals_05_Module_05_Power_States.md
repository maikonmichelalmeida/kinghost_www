# 05 Module 05 — Power States

## Controle do bloco

- **Bloco:** 086
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 05 Module 05 — Power States
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\05 Module 05 - Power States.docx`
- **Arquivo anexado nesta conversa:** `05 Module 05 - Power States.docx`
- **Faixa processada conforme roteiro:** slides 1-17
- **Observação sobre o anexo:** o DOCX possui 9 páginas renderizadas, normalmente com 2 slides por página, exceto a última página. O texto foi extraído visualmente dos prints, pois o documento não possui texto editável parseável.
- **Começa em:** `Defining Your Power Intent: Power State Table and Power State Group`
- **Termina em:** `Power State Group — Example UPF`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\05 Module 05 - Power States.md
```

---

## Resumo executivo

Este módulo explica como o UPF descreve **power states**, isto é, os estados legais de alimentação do design. Até aqui, o curso apresentou:

- power domains;
- power strategies;
- supply network;
- supply sets;
- supply set handles;
- isolation, level shifting, power switches e retention.

Agora o foco passa a ser a tabela que diz **quais combinações de supplies são válidas** em cada modo de operação.

O módulo trabalha dois conceitos relacionados:

```text
PST — Power State Table
PSG — Power State Group
```

A diferença principal é:

```text
PST é a abordagem baseada em supply nets.
PSG é a abordagem análoga baseada em supply sets.
```

A aula reforça que os power states capturam:

- modos com diferentes tensões;
- dynamic voltage scaling;
- DVFS;
- cenários de shutdown;
- supplies switchadas e não switchadas;
- relative always-on;
- simulação de estados corrompidos, normais, ilegais ou equivalentes.

O módulo também introduz o comando central:

```tcl
add_power_state
```

e seus usos principais:

```tcl
add_power_state -supply
add_power_state -domain
create_power_state_group
add_power_state -group
```

Os conceitos principais são:

1. **Cada power state representa uma combinação permitida de valores de supply.**
2. **Shutdown aumenta rapidamente o número de estados necessários.**
3. **Em designs com power switches, é preciso representar supplies switchadas e unswitched/pre-switch supplies.**
4. **Always-on pode ser relativo, não absoluto.**
5. **`add_power_state -supply` define estados de uma supply set function.**
6. **`-supply_expr` descreve o comportamento elétrico da supply function no estado.**
7. **`-logic_expr` permite condicionar estados a eventos lógicos, como enables/clocks/gates.**
8. **Estados como `OFF`, `FULL_ON`, `PARTIAL_ON` e `UNDETERMINED` têm semântica específica.**
9. **ON/OFF default states podem ser usados em fases iniciais do UPF, especialmente a partir de R-2020.09.**
10. **Nomes de estados devem ser significativos, não genéricos como `S1`, `S2`, `S3`, `S4`.**

A mensagem central do módulo é:

```text
Power states conectam o power intent abstrato ao comportamento operacional real do chip: quais supplies estão ON, OFF, em baixa tensão, em alta tensão, switchadas, preservadas ou corrompidas em cada modo.
```

---

# Slide 1 — Defining Your Power Intent: Power State Table and Power State Group

## Texto extraído

Título:

```text
Defining Your Power Intent: Power State Table and Power State Group
```

Pontos:

```text
PST defines all legal voltage states, and all power state combinations of the voltage states, for a given design
```

Subitens:

```text
Requires knowing (or deciding) the operational voltages for each power domain, and the supplies being used
Must know each voltage for each supply, in each mode
```

Segundo ponto:

```text
UPF uses power state tables (PST) to define the relationship between the domains' operational voltages
```

Subitem:

```text
Captures dynamic voltage scaling (DVS/DVFS) and shutdown scenarios
```

Terceiro ponto:

```text
A Power State Group (PSG) is the analog definition, but using supply sets instead of supply nets in your design
```

Subitens:

```text
It obeys to a newer version of the IEEE standard for UPF
Synopsys support both approaches, supply net based (PST) and supply set based (PSG)
```

## Interpretação

Este slide define o objetivo do módulo.

## PST — Power State Table

A PST define:

```text
todos os estados legais de tensão
e todas as combinações legais desses estados
```

Para construir uma PST, é preciso saber ou decidir:

- quais supplies existem;
- quais tensões cada supply pode assumir;
- quais power domains usam essas supplies;
- quais combinações são legais em cada modo.

Exemplo:

```text
TOP = 1.08 V
PD_SW.unswitched = 0.9 V
PD_SW.primary = OFF
```

Isso pode ser um estado válido de shutdown.

## Por que a PST existe?

Porque a ferramenta precisa saber o relacionamento entre tensões operacionais dos domínios.

Ela captura:

```text
DVS / DVFS
shutdown
modos high-performance
modos low-power
modos sleep/hibernate
```

## PSG — Power State Group

O PSG é o conceito análogo à PST, mas usando supply sets em vez de supply nets.

Como o curso anterior mostrou que o fluxo moderno recomendado usa supply sets e handles, o PSG é a forma mais natural nessa metodologia.

## Diferença prática

| Conceito | Base |
|---|---|
| PST | Supply nets |
| PSG | Supply sets |

O slide também diz que a Synopsys suporta as duas abordagens.

---

# Slide 2 — Power State Group — Example

## Texto extraído

Título:

```text
Power State Group — Example
```

Pontos:

```text
Two power domains: TOP, PD1
```

```text
Four supplies:
TOP primary power (1.08V)
PD_SW unswitched power (1.08V, 0.9V)
PD_SW primary (1.08V, 0.9V, OFF)
```

Nota:

```text
NOTE: Supply set ground functions omitted from table
```

Tabela:

```text
SUPPLY: VDD | VDD_PD1 | VDD_PD1S

STATE    VDD   VDD_PD1  VDD_PD1S
ON_LO    1.08  0.9      0.9
ON_HI    1.08  1.08     1.08
OFF_LO   1.08  0.9      OFF
OFF_HI   1.08  1.08     OFF
```

Destaque:

```text
Each state defines an allowed combination of supply values
```

## Interpretação

O exemplo tem dois domínios:

```text
TOP
PD1
```

e supplies:

```text
VDD        → supply do TOP
VDD_PD1    → supply unswitched/pre-switch de PD1
VDD_PD1S   → supply switchada/primary de PD1 após power switch
```

A tabela mostra quatro estados legais.

## `ON_LO`

```text
VDD = 1.08
VDD_PD1 = 0.9
VDD_PD1S = 0.9
```

PD1 está ligado em baixa tensão.

## `ON_HI`

```text
VDD = 1.08
VDD_PD1 = 1.08
VDD_PD1S = 1.08
```

PD1 está ligado em alta tensão.

## `OFF_LO`

```text
VDD = 1.08
VDD_PD1 = 0.9
VDD_PD1S = OFF
```

A supply unswitched de PD1 está em baixa tensão, mas a primary switchada está OFF.

## `OFF_HI`

```text
VDD = 1.08
VDD_PD1 = 1.08
VDD_PD1S = OFF
```

A supply unswitched está em alta tensão, mas a supply switchada está OFF.

## Ponto central

```text
Cada linha da tabela é uma combinação permitida de valores de supply.
```

Esse é o conceito de power state group/table.

---

# Slide 3 — How Many States are Needed?

## Texto extraído

Título:

```text
How Many States are Needed?
```

Ponto:

```text
Must define a state for each valid combination of supply values
```

Exemplo:

```text
Given 5 power domains
Each domain with at least one supply
Each supply with at least one value
```

Tabela:

```text
Power state table might look like this...
```

```text
STATE        Top  Orange  Green  Purple  Blue
FullOn       0.8  1.0     0.8    0.8     0.8
LowPower     0.8  1.0     0.8    0.6     0.8
LowerPower   0.8  1.0     0.6    0.6     0.6
```

## Interpretação

Este slide mostra que, mesmo sem shutdown, o número de estados cresce conforme o número de domínios e valores possíveis cresce.

Com cinco power domains:

```text
Top, Orange, Green, Purple, Blue
```

e cada um podendo operar em certas tensões, é necessário definir uma linha para cada combinação válida.

Exemplo:

## `FullOn`

Todos operam em tensão nominal/alta esperada:

```text
Top = 0.8
Orange = 1.0
Green = 0.8
Purple = 0.8
Blue = 0.8
```

## `LowPower`

Purple reduz para 0.6:

```text
Purple = 0.6
```

## `LowerPower`

Green, Purple e Blue reduzem para 0.6:

```text
Green = 0.6
Purple = 0.6
Blue = 0.6
```

### Ponto prático

A PST/PSG não precisa listar combinações impossíveis ou ilegais, apenas as combinações válidas do design.

---

# Slide 4 — How Many States are Needed? Shutdown quickly expands PSG

## Texto extraído

Título:

```text
How Many States are Needed?
```

Ponto:

```text
Shutdown quickly expands PSG
```

Subitens:

```text
Must represent both switched and unswitched supply nets in PSG
Each shutdown supply will have at least two values
If all shutdown supplies operate independently, even more states must be defined
```

Tabela exemplo:

```text
Example Power State Group
```

Colunas:

```text
Top
Orange
Green pre-switch
Purple pre-switch
Blue pre-switch
Green
Purple
Blue
```

Estados:

```text
FullOn
LowPwr
LowerPwr
PwrSave
Hibernate
```

Valores visíveis:

```text
FullOn    0.8 1.0 0.8 0.8 0.8 0.8 0.8 0.8
LowPwr    0.8 1.0 0.8 0.6 0.8 0.8 0.6 0.8
LowerPwr  0.8 1.0 0.6 0.6 0.6 0.6 0.6 0.6
PwrSave   0.8 1.0 0.6 0.6 0.6 0.6 0.6 OFF
Hibernate 0.8 1.0 0.6 0.6 0.6 OFF OFF OFF
```

## Interpretação

Shutdown torna a tabela maior porque agora não basta representar a supply “final” do domínio. É preciso representar:

```text
pre-switch / unswitched supply
switched / primary supply
```

Por exemplo, para um domínio power-gated:

```text
pre-switch supply = ainda pode estar ON
switched supply = pode estar OFF
```

A tabela separa colunas como:

```text
Green pre-switch
Green
Purple pre-switch
Purple
Blue pre-switch
Blue
```

Isso permite representar estados como:

- o domínio tem alimentação disponível antes do switch;
- mas a supply efetiva interna do domínio está OFF.

### `PwrSave`

No exemplo, `Blue` fica OFF, mas Green e Purple continuam ON.

### `Hibernate`

Green, Purple e Blue ficam OFF, mas suas pre-switch supplies continuam em valores definidos.

### Ponto-chave

```text
Cada shutdown supply terá pelo menos dois valores: ON e OFF.
```

Se várias shutdown supplies operam independentemente, o número de combinações cresce rapidamente.

---

# Slide 5 — How Many States are Needed? Shutdown quickly expands PST

## Texto extraído

Título:

```text
How Many States are Needed?
```

Ponto:

```text
Shutdown quickly expands PST
```

Subitens:

```text
Must represent both switched and unswitched supply nets in PST
Each shutdown supply will have at least two values
If all shutdown supplies operate independently, even more states must be defined
```

Tabela:

```text
Example Power State Table
```

Destaques visuais:

```text
5 states
5 always-on supplies
2 relative always-on supplies
1 supply shutdown relative to all others
```

Estados:

```text
FullOn
LowPwr
LowerPwr
PwrSave
Hibernate
```

## Interpretação

Este slide reforça o mesmo conceito do slide anterior, agora usando a linguagem de PST.

A tabela destaca:

- `5 states`;
- `5 always-on supplies`;
- `2 relative always-on supplies`;
- `1 supply shutdown relative to all others`.

Isso é importante porque os supplies não são todos apenas ON/OFF absolutos. Alguns são **relative always-on**.

### Exemplo conceitual

Uma supply pode estar ligada durante o shutdown de um domínio específico, mas ainda assim desligar em um estado mais profundo de hibernação.

Logo:

```text
always-on pode ser relativo ao domínio observado.
```

Esse é o gancho para o próximo slide.

---

# Slide 6 — Is "Always-on" Really Always On?

## Texto extraído

Título:

```text
Is "Always-on" Really Always On?
```

Pontos:

```text
For a given shutdown power domain, cells in that domain remaining powered up during shutdown are referred to as "always-on" (AO)
```

Subitem:

```text
Even if that "always-on" supply is also switchable
```

Segundo ponto:

```text
Hence the concept of "relative always-on"
```

Subitem:

```text
An object that is powered up more than another is considered "always-on" from the perspective of that other object, regardless of whether it, too, can be shutdown
```

Tabela PSG:

```text
STATE  TOP  PD1  PD2
ON     0.8  0.8  0.8
LP     0.8  0.8  OFF
Sleep  0.8  OFF  OFF
```

Notas:

```text
PD1 is always-on, relative to PD2
TOP is always-on, relative to PD2 and PD1
```

## Interpretação

Este é um dos slides conceituais mais importantes.

A expressão **always-on** pode enganar. Uma supply chamada always-on nem sempre é absolutamente ligada em todos os estados possíveis do chip.

Ela pode ser **always-on relativa** a outro domínio.

## Exemplo da tabela

```text
ON:
TOP = 0.8
PD1 = 0.8
PD2 = 0.8
```

Todos ligados.

```text
LP:
TOP = 0.8
PD1 = 0.8
PD2 = OFF
```

Aqui, PD1 está ligado enquanto PD2 está desligado. Então PD1 é always-on **relativo a PD2**.

```text
Sleep:
TOP = 0.8
PD1 = OFF
PD2 = OFF
```

Aqui, TOP está ligado enquanto PD1 e PD2 estão desligados. Então TOP é always-on relativo aos dois.

### Definição prática

```text
Um objeto é always-on em relação a outro se permanece alimentado em estados onde o outro está desligado.
```

### Importância para ISO/RET/AO logic

Isolation e retention precisam ser alimentadas por supplies que sejam always-on **relativas** ao domínio que está sendo desligado.

---

# Slide 7 — Defining Power States and Power State Groups

## Texto extraído

Título:

```text
Defining Power States and Power State Groups
```

Ponto principal:

```text
The add_power_state -supply command is used to specify the power state of a supply set
```

Subitem:

```text
Defines state information for a supply set by specifying the state of a specific supply function in the supply set
```

Additional options:

```text
In addition, -domain can be used to capture power state for a power_domain
```

Comando destacado:

```tcl
add_power_state -domain
```

Outro item:

```text
In addition, -group can be used to capture power state for a group of supply sets
```

Comandos destacados:

```tcl
create_power_state_group
add_power_state -group
```

## Interpretação

Este slide introduz os comandos centrais.

## `add_power_state -supply`

Usado para definir o estado de uma supply set.

Ele especifica o estado de uma função específica dentro do supply set, por exemplo:

```text
power = FULL_ON 0.9
ground = FULL_ON 0.0
```

## `add_power_state -domain`

Permite capturar o power state de um power domain.

## `create_power_state_group` e `add_power_state -group`

Permitem criar e preencher um grupo de power states baseado em múltiplos supply sets.

### Ponto prático

```text
Power state pode ser definido no nível de supply, domínio ou grupo de supplies.
```

Isso dá flexibilidade para modelar desde estados simples de uma supply até combinações completas de funcionamento do design.

---

# Slide 8 — `add_power_state` (UPF2.0)

## Texto extraído

Título:

```text
add_power_state (UPF2.0)
```

Sintaxe:

```tcl
add_power_state <object_name>
    -state <state_name> \
    {[-supply_expr {boolean_function*}] \
     [-logic_expr {boolean_function}] \
     [-simstate] \
     [-illegal] \
     [-simstate simstate] \
     [-group] \
     [-domain] \
     [-supply] \
     [-update]}
```

Nota:

```text
*Where "boolean_function" is a System Verilog Boolean expression, not Tcl
```

Ponto:

```text
The -logic_expr argument helps include logic events (e.g., enable signal states) in defining power state
```

## Interpretação

A sintaxe mostra que `add_power_state` é flexível.

## `-state`

Nome do estado definido.

Exemplo:

```text
ON_LO
OFF_HI
Hibernate
```

## `-supply_expr`

Expressão booleana que descreve o estado das supplies.

Importante: a expressão é uma expressão booleana de SystemVerilog, não Tcl.

## `-logic_expr`

Permite incluir condições lógicas, como:

```text
enable
sleep
clock gate
retention enable
```

Exemplo conceitual:

```text
!isoOn && clkGate
```

## `-simstate`

Define comportamento de simulação, como normal/corrupt.

## `-illegal`

Marca um estado como ilegal.

## `-group`, `-domain`, `-supply`

Indicam a categoria/objeto ao qual o state se aplica.

## `-update`

Atualiza uma definição existente.

### Ponto importante

```text
Power state pode depender tanto de condições de supply quanto de condições lógicas.
```

---

# Slide 9 — Defining Power States for Supply Sets — Example

## Texto extraído

Título:

```text
Defining Power States for Supply Sets — Example
```

Código mostrado:

```tcl
add_power_state PD1.primary \
    -state LV \
    {-supply_expr {power == {FULL_ON 0.9} && ground == {FULL_ON 0.0}} \
     -logic_expr {!isoOn && clkGate} \
     -simstate NORMAL}
```

Anotações:

```text
Supply set name used here is a reference to the implicit primary supply set of domain PD1
Supply set function
Supply set state and voltage value
Condition based on supply set function
Can specify states based on logic expressions
Specifying simulation behavior
```

## Interpretação

Este slide mostra um exemplo completo.

O objeto:

```tcl
PD1.primary
```

é o handle da supply primária do domínio `PD1`.

A state:

```tcl
-state LV
```

define um estado chamado `LV`, provavelmente low voltage.

A supply expression:

```tcl
-supply_expr {power == {FULL_ON 0.9} && ground == {FULL_ON 0.0}}
```

diz:

```text
a função power está FULL_ON em 0.9 V
a função ground está FULL_ON em 0.0 V
```

A logic expression:

```tcl
-logic_expr {!isoOn && clkGate}
```

adiciona uma condição lógica para esse estado.

A simstate:

```tcl
-simstate NORMAL
```

indica que, nesse estado, a simulação deve tratar o comportamento como normal.

### Ponto central

```text
add_power_state pode combinar estado elétrico da supply com condição lógica e comportamento de simulação.
```

---

# Slide 10 — `add_power_state -supply_expr`

## Texto extraído

Título:

```text
add_power_state -supply_expr
```

Pontos:

```text
The -supply_expr argument is used for defining the power behavior of given supply set functions, for the power state being defined
```

Sintaxe Synopsys:

```text
supply_set_function == function_state
```

Explicação:

```text
Where supply_set_function is power and ground (plus bias functions if used), and function_state can be one of the following:
```

Formas:

```text
{status}
{status, nom}
{status, min, max}
{status, min, nom, max}
```

Status:

```text
status can be OFF or FULL_ON
```

Tensões:

```text
min, nom, max are floating point numbers representing the min/nom/max voltages,
respectively, of the specified state
```

Regra:

```text
If status is FULL_ON, then at least one voltage must be specified
```

## Interpretação

`-supply_expr` descreve o comportamento elétrico da supply function.

A forma geral é:

```text
supply_set_function == function_state
```

Exemplo:

```text
power == {FULL_ON 0.9}
ground == {FULL_ON 0.0}
```

## Estados possíveis

O slide destaca:

```text
OFF
FULL_ON
```

## Valores de tensão

Se o estado é `FULL_ON`, pelo menos uma tensão deve ser especificada.

Formas possíveis:

```text
{FULL_ON 0.9}
{FULL_ON 0.8 1.0}
{FULL_ON 0.7 0.8 0.9}
```

A ideia é representar:

- valor nominal;
- intervalo min/max;
- min/nom/max.

## OFF

Quando o status é `OFF`, não se especifica voltage value. Esse ponto é reforçado no slide 12.

---

# Slide 11 — `add_power_state`: Supply Set Function States

## Texto extraído

Título:

```text
add_power_state: Supply Set Function States
```

Ponto:

```text
IEEE-1801 defines power state of a supply net (i.e., supply set function) to be one of the following
```

Tabela:

```text
Supply Net/Port State | Semantic
OFF
Supply net/port is electrically OFF. All elements driven by it will be corrupted.

FULL_ON
Supply net/port is connected to a supply-driver (e.g. VRM) which is fully ON.

PARTIAL_ON*
Supply net/port is connected to multiple power switches all of which are not FULL_ON.

UNDETERMINED*
Supply net/port has no connected path to a supply-driver.
```

Nota:

```text
* These constructs are only used in simulation.
```

Ponto final:

```text
These states are used in defining power state of a supply set function, using -supply_expr argument in the add_power_state command
```

## Interpretação

Este slide define os estados possíveis de uma supply net/port ou função de supply set.

## `OFF`

A supply está eletricamente desligada. Todos os elementos alimentados por ela ficam corrompidos.

## `FULL_ON`

A supply está conectada a um supply driver, como um VRM, totalmente ligado.

## `PARTIAL_ON`

A supply está conectada a múltiplos power switches, mas nem todos estão totalmente ON.

O slide marca como usado apenas em simulação.

## `UNDETERMINED`

Não há caminho conectado até um supply driver.

Também é marcado como usado apenas em simulação.

### Ponto de prova

```text
OFF corrompe elementos dirigidos pela supply.
FULL_ON significa conectado a supply-driver fully ON.
PARTIAL_ON e UNDETERMINED são construtos de simulação.
```

---

# Slide 12 — `add_power_state`: Supply Set Function States — OFF example

## Texto extraído

Título:

```text
add_power_state: Supply Set Function States
```

Subtítulo:

```text
Example: OFF state
```

Código:

```tcl
add_power_state -supply SSPDI -state ss1_OFF \
{-supply_expr {power == {OFF} && ground == {FULL_ON 0.0}} \
 -logic_expr {instOn || !clkGate} } \
 -simstate CORRUPT
```

Nota:

```text
NOTE:
When specifying a supply state of "OFF", no voltage value is defined
```

## Interpretação

Este exemplo define um estado OFF para uma supply.

A expressão:

```tcl
power == {OFF}
```

não traz tensão, porque supply OFF não tem voltage value definido.

Já ground permanece:

```tcl
ground == {FULL_ON 0.0}
```

A lógica:

```tcl
-logic_expr {instOn || !clkGate}
```

associa o estado a uma condição lógica.

A simstate:

```tcl
-simstate CORRUPT
```

indica que elementos alimentados por essa supply devem ser tratados como corrompidos na simulação.

### Ponto importante

```text
OFF não recebe valor de tensão.
```

Esse é um detalhe comum de prova e de erro em scripts.

---

# Slide 13 — `add_power_state`: Using Default Power States

## Texto extraído

Título:

```text
add_power_state: Using Default Power States
```

Ponto:

```text
From R-2020.09 onwards, implementation tools have the capability to handle
ON and OFF states of add_power_state command as if they were already created
```

Segundo ponto:

```text
You can refer to ON and OFF states in early definition of UPF without the need
of knowing the voltage of a supply in each state
```

Subitem:

```text
For a flow where different teams are involved in design flow, implementation
details as voltage operation are not known at early stages
```

## Interpretação

A partir da release R-2020.09, as ferramentas de implementação Synopsys conseguem lidar com estados `ON` e `OFF` como se já estivessem criados.

Isso permite escrever UPF cedo, antes de conhecer todas as tensões exatas.

Exemplo de situação:

```text
time de RTL sabe que PD_A pode estar ON ou OFF,
mas ainda não sabe se a tensão ON será 0.72 V, 0.8 V ou 0.9 V.
```

Nesse caso, o UPF inicial pode referenciar estados default `ON` e `OFF`.

### Benefício

```text
Permite que diferentes times trabalhem em fases diferentes sem bloquear o power intent inicial.
```

O time de implementação pode refinar as tensões depois.

---

# Slide 14 — Using default power states — Example

## Texto extraído

Título:

```text
Using default power states — Example
```

Código:

```tcl
create_power_domain TOP -elements {.} \
    -supply {primary} -supply {aon}
```

Anotação:

```text
Creation of Power Domain TOP
```

Código:

```tcl
create_power_domain PD_A -elements {pd_a} \
    -supply {primary} -supply {aon}
```

Anotação:

```text
Creation of Power Domain PD_A
```

Código:

```tcl
add_power_state -domain PD_A \
    -state {ST_1 -logic_expr \
        {TOP.aon==ON && PD_A.primary==ON}}

    -state {ST_2 -logic_expr \
        {TOP.aon==ON && PD_A.primary==OFF}}
```

Anotações:

```text
ON state for TOP.aon and PD_A.primary is created by default and referenced here
ON state for TOP.aon and OFF for PD_A.primary is created by default and referenced here
```

## Interpretação

Este exemplo mostra o uso de estados default `ON` e `OFF`.

Dois domínios são criados:

```text
TOP
PD_A
```

Cada um com handles:

```text
primary
aon
```

Depois, os states de `PD_A` usam lógica baseada em:

```text
TOP.aon == ON
PD_A.primary == ON
PD_A.primary == OFF
```

Sem definir explicitamente a tensão.

## `ST_1`

```text
TOP.aon está ON
PD_A.primary está ON
```

## `ST_2`

```text
TOP.aon está ON
PD_A.primary está OFF
```

### Ponto didático

Esse estilo é útil em UPF inicial porque expressa:

```text
quais supplies estão ligadas/desligadas
```

sem ainda fixar:

```text
quantos volts exatamente significa ON.
```

---

# Slide 15 — Power State Group — Example

## Texto extraído

Título:

```text
Power State Group — Example
```

Pontos:

```text
Two power domains: TOP, PD1
```

```text
Four supply sets:
TOP.primary (1.08V)
PD_SW.USW (1.08V, 0.9V)
PD_SW.primary (1.08V, 0.9V, OFF)
```

Tabela:

```text
SUPPLY        TOP.primary  PD_SW.USW  PD_SW.primary

STATE
ON_LO         1.08         0.9        0.9
ON_HI         1.08         1.08       1.08
OFF_LO        1.08         0.9        OFF
OFF_HI        1.08         1.08       OFF
```

Destaque:

```text
Each state defines an allowed combination of supply values
```

## Interpretação

Este slide repete o exemplo inicial, mas agora claramente usando supply sets/handles:

```text
TOP.primary
PD_SW.USW
PD_SW.primary
```

A tabela define quatro estados:

## `ON_LO`

```text
TOP.primary = 1.08
PD_SW.USW = 0.9
PD_SW.primary = 0.9
```

## `ON_HI`

```text
TOP.primary = 1.08
PD_SW.USW = 1.08
PD_SW.primary = 1.08
```

## `OFF_LO`

```text
TOP.primary = 1.08
PD_SW.USW = 0.9
PD_SW.primary = OFF
```

## `OFF_HI`

```text
TOP.primary = 1.08
PD_SW.USW = 1.08
PD_SW.primary = OFF
```

### Observação

`PD_SW.USW` representa uma supply unswitched/pre-switch, enquanto `PD_SW.primary` é a supply efetiva do domínio, que pode estar OFF.

---

# Slide 16 — Power State Group — Example UPF

## Texto extraído

Título:

```text
Power State Group — Example UPF
```

Código para `TOP.primary`:

```tcl
add_power_state TOP.primary \
    -state HV {-supply_expr \
        {power == {FULL_ON 1.08} && \
         ground == {FULL_ON 0.0}}}
```

Código para `PD_SW.USW`:

```tcl
add_power_state PD_SW.USW -state \
    HV {-supply_expr {power == {FULL_ON 1.08} && \
    ground == {FULL_ON 0.0}}}

-state LV {-supply_expr {power == {FULL_ON \
    0.9} && ground == {FULL_ON 0.0}}}
```

Código para `PD_SW.primary`:

```tcl
add_power_state PD_SW.primary -state HV \
    {-supply_expr {power == {FULL_ON 1.08} \
    && ground == {FULL_ON 0.0}}}

-state LV {-supply_expr {power == {FULL_ON \
    0.9} && ground == {FULL_ON 0.0}}}

-state PD_SW_OFF {-supply_expr {power == {OFF} \
    && ground == {FULL_ON 0.0}}}
```

Nota:

```text
Note that "0.0" is NOT the same as "off"
```

Recomendação:

```text
Recommendation: Use meaningful state names (instead of S1, S2, S3, S4)
```

## Interpretação

Este slide mostra como definir estados individuais para cada supply set.

## `TOP.primary`

Define estado `HV`:

```text
power = FULL_ON 1.08
ground = FULL_ON 0.0
```

## `PD_SW.USW`

Define dois estados:

```text
HV = 1.08
LV = 0.9
```

## `PD_SW.primary`

Define três estados:

```text
HV = 1.08
LV = 0.9
PD_SW_OFF = OFF
```

### Detalhe crítico

O slide reforça:

```text
0.0 não é igual a OFF.
```

`0.0` para ground significa ground ligado em 0 V:

```text
ground == {FULL_ON 0.0}
```

Já OFF significa supply eletricamente desligada:

```text
power == {OFF}
```

### Recomendação de nomenclatura

Use nomes significativos:

```text
HV
LV
PD_SW_OFF
ON_LO
OFF_HI
Hibernate
```

em vez de:

```text
S1, S2, S3, S4
```

Isso facilita debug e leitura dos reports.

---

# Slide 17 — Power State Group — Example UPF

## Texto extraído

Título:

```text
Power State Group — Example UPF
```

Código:

```tcl
create_power_state_group PSG
```

Estados do grupo:

```tcl
add_power_state -group PSG \
-state ON_LO {-logic_expr {TOP.primary == HV && PD_SW.USW == LV && PD_SW.primary == LV}}
```

```tcl
add_power_state -group PSG \
-state ON_HI {-logic_expr {TOP.primary == HV && PD_SW.USW == HV && PD_SW.primary == HV}}
```

```tcl
add_power_state -group PSG \
-state OFF_LO {-logic_expr {TOP.primary == HV && PD_SW.USW == LV && PD_SW.primary == OFF_state}}
```

```tcl
add_power_state -group PSG \
-state OFF_HI {-logic_expr {TOP.primary == HV && PD_SW.USW == LV && PD_SW.primary == OFF_state}}
```

Observação visual:

A tabela por trás mostra as colunas:

```text
TOP.primary
PD_SW.USW
PD_SW.primary
```

e estados:

```text
ON_LO
ON_HI
OFF_LO
OFF_HI
```

## Interpretação

Depois de definir estados individuais para cada supply set, o slide cria um grupo:

```tcl
create_power_state_group PSG
```

Esse grupo define as combinações legais entre os estados individuais.

## `ON_LO`

```text
TOP.primary == HV
PD_SW.USW == LV
PD_SW.primary == LV
```

## `ON_HI`

```text
TOP.primary == HV
PD_SW.USW == HV
PD_SW.primary == HV
```

## `OFF_LO`

```text
TOP.primary == HV
PD_SW.USW == LV
PD_SW.primary == OFF_state
```

## `OFF_HI`

```text
TOP.primary == HV
PD_SW.USW == HV
PD_SW.primary == OFF_state
```

### Observação importante sobre o slide

No print, o último exemplo parece visualmente indicar `PD_SW.USW == LV` para `OFF_HI`, mas pela tabela e pelo nome `OFF_HI`, a combinação esperada é:

```text
PD_SW.USW == HV
PD_SW.primary == OFF_state
```

Portanto, ao estudar para prova/fluxo, a lógica conceitual correta é:

```text
OFF_HI = unswitched em alta tensão + primary OFF
OFF_LO = unswitched em baixa tensão + primary OFF
```

Se o slide do curso tiver uma inconsistência visual na linha do código, a tabela é a referência semântica mais clara.

### Ponto final

O power state group combina estados individuais em modos de operação válidos.

```text
Estados individuais:
  HV, LV, OFF_state

Estados de grupo:
  ON_LO, ON_HI, OFF_LO, OFF_HI
```

---

# Aula didática desenvolvida

## 1. Power state é uma combinação válida, não apenas um nome

Um erro comum é pensar que `ON_LO` ou `Hibernate` são apenas rótulos. Na verdade, cada estado representa uma combinação específica de valores de supply.

Exemplo:

```text
ON_LO = TOP ligado + PD_SW pre-switch em baixa + PD_SW primary em baixa
OFF_LO = TOP ligado + PD_SW pre-switch em baixa + PD_SW primary OFF
```

## 2. Shutdown aumenta muito a complexidade

Sem shutdown, cada domínio pode ter uma tensão por modo. Com shutdown, precisamos representar:

```text
supply antes do switch
supply depois do switch
estado do switch
estado ON/OFF da lógica
```

Por isso, power-gated domains aumentam rapidamente o tamanho da PST/PSG.

## 3. Always-on é relativo

Uma supply pode ser always-on em relação a um domínio desligado, mas também pode desligar em um modo mais profundo.

Exemplo:

```text
PD1 é always-on relativo a PD2 em LP.
Mas PD1 desliga em Sleep.
```

Logo, para isolation e retention, a pergunta correta é:

```text
esta supply fica ligada quando o objeto que ela protege/desliga está OFF?
```

e não apenas:

```text
esta supply se chama always-on?
```

## 4. `add_power_state` descreve estado elétrico e lógico

Com `-supply_expr`, descrevemos a parte elétrica:

```text
power == FULL_ON 0.9
ground == FULL_ON 0.0
power == OFF
```

Com `-logic_expr`, podemos incluir eventos lógicos:

```text
sleep
isoOn
clkGate
enable
```

Com `-simstate`, definimos como a simulação deve tratar o estado:

```text
NORMAL
CORRUPT
```

## 5. OFF não tem tensão

O slide de OFF é uma pegadinha importante:

```text
power == {OFF}
```

não deve ter tensão.

Já ground em 0.0 V ligado é:

```text
ground == {FULL_ON 0.0}
```

Isso explica a frase:

```text
0.0 is NOT the same as off.
```

## 6. Estados default ON/OFF permitem escrever UPF cedo

Em projetos grandes, o time de RTL pode não saber as tensões finais. A partir de R-2020.09, o fluxo Synopsys permite referenciar `ON` e `OFF` como estados default.

Isso permite escrever:

```text
PD_A.primary == ON
PD_A.primary == OFF
```

sem ainda saber se ON será 0.8 V, 0.9 V ou 1.08 V.

## 7. Defina estados individuais antes de estados de grupo

O fluxo do exemplo é:

```text
1. Definir estados de cada supply set:
   TOP.primary: HV
   PD_SW.USW: HV, LV
   PD_SW.primary: HV, LV, OFF_state

2. Criar power state group:
   create_power_state_group PSG

3. Definir combinações legais:
   ON_LO, ON_HI, OFF_LO, OFF_HI
```

Essa separação deixa o UPF mais organizado.

## 8. Use nomes significativos

A recomendação do slide é simples e importante:

```text
Use meaningful state names.
```

Melhor:

```text
ON_LO
ON_HI
OFF_LO
OFF_HI
PD_SW_OFF
Hibernate
```

Pior:

```text
S1
S2
S3
S4
```

Nomes bons ajudam muito no debug.

---

# Conceitos difíceis explicados em profundidade

## PST — Power State Table

Tabela baseada em supply nets que define combinações legais de valores de supply para o design.

## PSG — Power State Group

Abordagem baseada em supply sets para definir combinações legais de power states.

## DVS

Dynamic Voltage Scaling. Técnica em que a tensão muda dinamicamente conforme modo de operação.

## DVFS

Dynamic Voltage and Frequency Scaling. Técnica em que tensão e frequência mudam conforme modo de operação.

## Switched supply

Supply efetiva depois do power switch, que pode ser desligada.

## Unswitched / pre-switch supply

Supply antes do power switch, que pode continuar ligada mesmo quando a switched supply está OFF.

## Relative always-on

Um objeto/supply é always-on relativo a outro se permanece ligado em estados em que o outro está desligado.

## `add_power_state`

Comando usado para definir power states de supplies, domains ou groups.

## `-supply_expr`

Expressão que define o estado elétrico de funções de supply set.

## `-logic_expr`

Expressão booleana de SystemVerilog que inclui condições lógicas na definição do power state.

## `-simstate`

Define o comportamento de simulação associado ao estado.

## `FULL_ON`

Supply conectada a supply-driver totalmente ligado.

## `OFF`

Supply eletricamente desligada. Elementos alimentados por ela ficam corrompidos.

## `PARTIAL_ON`

Supply conectada a múltiplos switches, mas nem todos FULL_ON. Usado apenas em simulação.

## `UNDETERMINED`

Supply sem caminho conectado para supply-driver. Usado apenas em simulação.

## Default ON/OFF states

Estados `ON` e `OFF` que ferramentas Synopsys podem tratar como já criados a partir da release R-2020.09.

---

# Comandos importantes do módulo

## Definir power state de uma supply set

```tcl
add_power_state <object_name>
    -state <state_name> \
    {-supply_expr {boolean_function} \
     -logic_expr {boolean_function} \
     -simstate NORMAL}
```

## Exemplo com supply set handle

```tcl
add_power_state PD1.primary \
    -state LV \
    {-supply_expr {power == {FULL_ON 0.9} && ground == {FULL_ON 0.0}} \
     -logic_expr {!isoOn && clkGate} \
     -simstate NORMAL}
```

## Estado OFF

```tcl
add_power_state -supply SSPDI -state ss1_OFF \
{-supply_expr {power == {OFF} && ground == {FULL_ON 0.0}} \
 -logic_expr {instOn || !clkGate} } \
 -simstate CORRUPT
```

## Estados default ON/OFF

```tcl
create_power_domain TOP -elements {.} \
    -supply {primary} -supply {aon}

create_power_domain PD_A -elements {pd_a} \
    -supply {primary} -supply {aon}

add_power_state -domain PD_A \
    -state {ST_1 -logic_expr \
        {TOP.aon==ON && PD_A.primary==ON}}

    -state {ST_2 -logic_expr \
        {TOP.aon==ON && PD_A.primary==OFF}}
```

## Estados individuais de supply sets

```tcl
add_power_state TOP.primary \
    -state HV {-supply_expr \
        {power == {FULL_ON 1.08} && \
         ground == {FULL_ON 0.0}}}
```

```tcl
add_power_state PD_SW.USW -state \
    HV {-supply_expr {power == {FULL_ON 1.08} && \
    ground == {FULL_ON 0.0}}}

-state LV {-supply_expr {power == {FULL_ON \
    0.9} && ground == {FULL_ON 0.0}}}
```

```tcl
add_power_state PD_SW.primary -state HV \
    {-supply_expr {power == {FULL_ON 1.08} \
    && ground == {FULL_ON 0.0}}}

-state LV {-supply_expr {power == {FULL_ON \
    0.9} && ground == {FULL_ON 0.0}}}

-state PD_SW_OFF {-supply_expr {power == {OFF} \
    && ground == {FULL_ON 0.0}}}
```

## Criar power state group

```tcl
create_power_state_group PSG
```

## Definir estados do grupo

```tcl
add_power_state -group PSG \
-state ON_LO {-logic_expr {TOP.primary == HV && PD_SW.USW == LV && PD_SW.primary == LV}}
```

```tcl
add_power_state -group PSG \
-state ON_HI {-logic_expr {TOP.primary == HV && PD_SW.USW == HV && PD_SW.primary == HV}}
```

```tcl
add_power_state -group PSG \
-state OFF_LO {-logic_expr {TOP.primary == HV && PD_SW.USW == LV && PD_SW.primary == OFF_state}}
```

```tcl
add_power_state -group PSG \
-state OFF_HI {-logic_expr {TOP.primary == HV && PD_SW.USW == HV && PD_SW.primary == OFF_state}}
```

---

# Tabelas de revisão

## PST vs PSG

| Conceito | Base | Uso |
|---|---|---|
| PST | Supply nets | Abordagem supply net based |
| PSG | Supply sets | Abordagem supply set based |
| Ambos | Definem combinações legais de estados | Synopsys suporta ambos |

---

## Exemplo de estados `ON/OFF` com supply switchada

| Estado | TOP.primary | PD_SW.USW | PD_SW.primary |
|---|---:|---:|---|
| ON_LO | 1.08 | 0.9 | 0.9 |
| ON_HI | 1.08 | 1.08 | 1.08 |
| OFF_LO | 1.08 | 0.9 | OFF |
| OFF_HI | 1.08 | 1.08 | OFF |

---

## Supply set function states

| Estado | Semântica |
|---|---|
| `OFF` | Supply eletricamente OFF; elementos alimentados serão corrompidos |
| `FULL_ON` | Supply conectada a supply-driver fully ON |
| `PARTIAL_ON` | Supply conectada a múltiplos power switches, nem todos FULL_ON; usado em simulação |
| `UNDETERMINED` | Sem caminho conectado até supply-driver; usado em simulação |

---

## `-supply_expr` forms

| Forma | Exemplo |
|---|---|
| `{status}` | `{OFF}` |
| `{status, nom}` | `{FULL_ON 0.9}` |
| `{status, min, max}` | `{FULL_ON 0.8 1.0}` |
| `{status, min, nom, max}` | `{FULL_ON 0.7 0.8 0.9}` |

Observação:

```text
Se status é FULL_ON, pelo menos uma tensão deve ser especificada.
Se status é OFF, nenhuma tensão é especificada.
```

---

## Relative always-on

| Estado | TOP | PD1 | PD2 | Relação |
|---|---:|---:|---:|---|
| ON | 0.8 | 0.8 | 0.8 | Todos ON |
| LP | 0.8 | 0.8 | OFF | PD1 é always-on relativo a PD2 |
| Sleep | 0.8 | OFF | OFF | TOP é always-on relativo a PD1 e PD2 |

---

# Figuras e diagramas importantes

## Página 1 — Defining Power Intent

O slide superior define PST e PSG. PST é supply-net based; PSG é supply-set based. O slide inferior mostra TOP e PD1 com tabela `ON_LO`, `ON_HI`, `OFF_LO`, `OFF_HI`.

## Página 2 — How Many States are Needed?

O slide superior mostra uma tabela simples com cinco domínios e três estados. O slide inferior mostra como shutdown expande o PSG ao adicionar pre-switch e switched supplies.

## Página 3 — Shutdown expands PST / Relative always-on

O slide superior destaca `5 states`, `5 always-on supplies`, `2 relative always-on supplies` e `1 supply shutdown relative to all others`. O slide inferior mostra que PD1 é always-on relativo a PD2, e TOP é always-on relativo a PD1/PD2.

## Página 4 — add_power_state syntax

O slide superior apresenta `add_power_state -supply`, `-domain` e `-group`. O slide inferior mostra a sintaxe geral de `add_power_state`.

## Página 5 — Supply set power state example

O slide superior mostra `PD1.primary` com `-supply_expr`, `-logic_expr` e `-simstate`. O slide inferior detalha a sintaxe de `-supply_expr`.

## Página 6 — Supply set function states

O slide superior define `OFF`, `FULL_ON`, `PARTIAL_ON` e `UNDETERMINED`. O slide inferior mostra exemplo de estado OFF e reforça que OFF não recebe tensão.

## Página 7 — Default power states

O slide superior explica que ferramentas a partir de R-2020.09 podem usar ON/OFF como estados default. O slide inferior mostra exemplo com `TOP.aon==ON` e `PD_A.primary==ON/OFF`.

## Página 8 — PSG example and UPF

O slide superior mostra a tabela `TOP.primary`, `PD_SW.USW`, `PD_SW.primary`. O slide inferior mostra a definição UPF dos estados `HV`, `LV`, `PD_SW_OFF` e a nota de que `0.0` não é OFF.

## Página 9 — PSG group example

Mostra `create_power_state_group PSG` e os `add_power_state -group PSG` para `ON_LO`, `ON_HI`, `OFF_LO`, `OFF_HI`.

---

# Pontos de prova e revisão

1. PST define todos os estados legais de tensão.
2. PST define todas as combinações legais de power states para um design.
3. Para definir PST, é preciso conhecer ou decidir as tensões operacionais de cada power domain.
4. É preciso saber cada tensão de cada supply em cada modo.
5. UPF usa PST para definir relação entre tensões operacionais dos domínios.
6. PST captura DVS/DVFS.
7. PST captura shutdown scenarios.
8. PSG é análogo à PST, mas usando supply sets.
9. Synopsys suporta PST baseada em supply nets e PSG baseada em supply sets.
10. Cada state define uma combinação permitida de supply values.
11. Shutdown expande rapidamente o número de states.
12. Shutdown exige representar supplies switchadas e unswitched/pre-switch.
13. Cada shutdown supply terá pelo menos dois valores.
14. Se shutdown supplies operam independentemente, mais states precisam ser definidos.
15. Always-on pode ser relativo.
16. Uma supply pode ser always-on relativa a um domínio e desligar em outro modo.
17. `PD1` pode ser always-on relativo a `PD2`.
18. `TOP` pode ser always-on relativo a `PD1` e `PD2`.
19. `add_power_state -supply` especifica power state de uma supply set.
20. `add_power_state -domain` captura power state de um power domain.
21. `create_power_state_group` cria um PSG.
22. `add_power_state -group` adiciona states ao PSG.
23. `-supply_expr` define o comportamento de supply set functions.
24. `-logic_expr` inclui eventos lógicos na definição do power state.
25. A boolean function em `add_power_state` é expressão booleana de SystemVerilog, não Tcl.
26. `PD1.primary` pode referenciar o implicit primary supply set de PD1.
27. `power` e `ground` são supply set functions.
28. `-simstate NORMAL` indica comportamento normal em simulação.
29. `-simstate CORRUPT` indica estado corrompido em simulação.
30. `supply_set_function == function_state` é a sintaxe usada em `-supply_expr`.
31. `status` pode ser `OFF` ou `FULL_ON`.
32. `FULL_ON` exige pelo menos uma tensão especificada.
33. `OFF` não recebe valor de tensão.
34. `OFF` significa supply eletricamente desligada.
35. Elementos alimentados por uma supply OFF serão corrompidos.
36. `FULL_ON` significa supply conectada a supply-driver fully ON.
37. `PARTIAL_ON` é usado apenas em simulação.
38. `UNDETERMINED` é usado apenas em simulação.
39. Ground em `0.0` não é igual a OFF.
40. `ground == {FULL_ON 0.0}` significa ground ligado em 0 V.
41. A partir de R-2020.09, ferramentas podem tratar ON/OFF como default states.
42. Estados default ON/OFF permitem escrever UPF cedo sem saber tensões exatas.
43. Isso é útil quando times diferentes definem RTL e implementação.
44. `TOP.aon==ON` pode ser usado em logic_expr.
45. `PD_A.primary==OFF` pode ser usado em logic_expr.
46. `TOP.primary` pode ter estado `HV`.
47. `PD_SW.USW` pode ter estados `HV` e `LV`.
48. `PD_SW.primary` pode ter estados `HV`, `LV` e `PD_SW_OFF`.
49. `PD_SW_OFF` deve usar `power == {OFF}`.
50. Recomenda-se usar nomes significativos de states.
51. Evitar nomes genéricos como `S1`, `S2`, `S3`, `S4`.
52. `create_power_state_group PSG` cria o grupo de power states.
53. `ON_LO` combina TOP high, unswitched low e primary low.
54. `ON_HI` combina TOP high, unswitched high e primary high.
55. `OFF_LO` combina TOP high, unswitched low e primary OFF.
56. `OFF_HI` combina TOP high, unswitched high e primary OFF.
57. Power state group combina estados individuais em estados globais legais.
58. Power states são essenciais para LS/ISO/RET/switch analysis.
59. Uma combinação não listada pode ser considerada ilegal ou não suportada, dependendo da modelagem.
60. O módulo Power States fecha a base de UPF antes do módulo de Fusion Compiler e UPF.

---

# Relação com Fusion Compiler

No Fusion Compiler, power states são usados para entender:

```text
1. quais supplies estão ON/OFF em cada modo;
2. quais domínios estão em alta ou baixa tensão;
3. quando level shifters são necessários;
4. quando isolation cells devem proteger interfaces;
5. quando retention deve preservar estado;
6. quais supplies são relative always-on;
7. quais combinações de supply são legais durante implementação;
8. como simular ou analisar estados CORRUPT/NORMAL.
```

Sem uma PST/PSG correta, a ferramenta pode:

- deixar de inferir LS;
- deixar de inserir isolation;
- inserir células demais;
- interpretar wrongly uma supply como always-on;
- não entender shutdown;
- não validar corretamente os modos de operação.

---

# Checklist prático para revisar power states

```text
1. Todos os power domains relevantes estão representados?
2. Todas as supplies primárias, switchadas e unswitched estão representadas?
3. Há uma linha/estado para cada combinação legal?
4. Estados ilegais foram evitados ou marcados?
5. Supplies OFF usam {OFF}, sem tensão?
6. Grounds ligados usam {FULL_ON 0.0}, não OFF?
7. Os estados têm nomes significativos?
8. DVS/DVFS estão representados?
9. Shutdown states estão representados?
10. Relative always-on foi analisado corretamente?
11. ON/OFF default states são suficientes nesta fase ou é preciso refinar tensão?
12. Os states individuais de supply sets foram definidos antes do PSG?
13. O power state group combina corretamente os states individuais?
14. `-logic_expr` usa expressão booleana de SystemVerilog, não Tcl?
15. `-simstate` está coerente com comportamento esperado?
```

---

# Checklist de qualidade

- [x] Bloco 086 processado conforme roteiro, slides 1-17.
- [x] PST e PSG foram diferenciados.
- [x] Tabelas de power states foram interpretadas.
- [x] Shutdown, pre-switch/unswitched e switched supplies foram explicados.
- [x] Relative always-on foi explicado.
- [x] `add_power_state` e suas opções foram detalhados.
- [x] `-supply_expr`, `-logic_expr` e `-simstate` foram explicados.
- [x] Estados `OFF`, `FULL_ON`, `PARTIAL_ON`, `UNDETERMINED` foram descritos.
- [x] ON/OFF default states foram incluídos.
- [x] Example UPF de PSG foi organizado e comentado.
- [x] Pontos de prova foram listados.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 087
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 06 Module 06 — Fusion Compiler and UPF
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\06 Module 06 - Fusion Compiler and UPF.docx
```

- **Processar:** conferir no roteiro/anexo a faixa exata de slides antes de processar.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\06 Module 06 - Fusion Compiler and UPF.md
```
