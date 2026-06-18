# 04 Module 04 — Supply Network — parte A

## Controle do bloco

- **Bloco:** 083
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 04 Module 04 — Supply Network — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network.docx`
- **Arquivo anexado nesta conversa:** `04 Module 04 - Supply Network.docx`
- **Faixa processada conforme roteiro:** slides 1-25
- **Total estimado do arquivo pelo roteiro:** 63 slides
- **Observação sobre o anexo:** o DOCX possui 29 páginas renderizadas e o texto não está parseável como texto editável. A extração foi feita visualmente a partir dos prints do próprio arquivo.
- **Começa em:** `Traditional Supply Network Definition`
- **Termina em:** `Supply Set Handles`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network_parte_A.md
```

---

## Resumo executivo

Este módulo inicia o tema **Supply Network** em UPF. Depois de estudar **power domains**, **power strategies**, level shifters, isolation, power switches e retention, agora o curso aprofunda como o UPF representa a **rede lógica de alimentação** do design.

A parte A cobre a transição entre duas formas de pensar supplies em UPF:

1. **Definição tradicional da supply network**
   - baseada em `supply ports`;
   - `supply nets`;
   - `connect_supply_net`;
   - `power switches`;
   - conectividade explícita de power/ground.

2. **Definição moderna usando supply sets e supply set handles**
   - abstrai a implementação lógica da implementação física;
   - permite escrever UPF de RTL sem conhecer todos os nomes físicos de nets/ports;
   - melhora reuso de IP;
   - habilita o fluxo ASIC, adiando detalhes de conectividade até physical synthesis.

A mensagem central da parte A é:

```text
Supply nets, supply ports e power switches são objetos lógicos no UPF.
Mas a implementação física exige que toda conectividade real de power/ground seja refinada e completamente definida.
```

O módulo também introduz uma distinção muito importante:

```text
Domain independent supply nets
Domain dependent supply nets
```

Essa distinção fica crítica quando se usa supply sets, porque o slide reforça:

```text
Supply nets associadas a supply sets DEVEM ser domain independent.
```

Outro conceito central é o **supply set**:

```text
Um supply set é um bundle/grupo de supply nets que, juntas, formam uma fonte completa de alimentação para elementos de design.
```

Dentro de um supply set, cada net executa uma função:

```text
power
ground
pwell
nwell
```

E cada função pode apontar para **uma e apenas uma** supply net.

A parte A termina introduzindo **supply set handles**, que são referências criadas automaticamente quando um power domain é criado. Cada power domain possui três handles padrão:

```text
<domain>.primary
<domain>.default_isolation
<domain>.default_retention
```

Esses handles são a base do fluxo recomendado pela Synopsys para definir supplies hoje.

---

# Parte 1 — Definição tradicional da supply network

## Slide 1 — Traditional Supply Network Definition

### Texto extraído

Título:

```text
Traditional Supply Network Definition
```

Primeira caixa:

```text
Supply network is built using detailed supply connectivity
```

Itens:

```text
Supply nets
Supply ports
Power switches
```

Segunda caixa:

```text
Supply nets (and ports and switches) do not have inherent power or ground semantic
```

Itens:

```text
Connectivity of supply net defines its semantic
i.e., the pg_type of the supply net is defined by the pg_pin to which it is connected
```

Terceira caixa:

```text
Each supply network connection requires explicit supply nets/ports connectivity definition
```

### Interpretação

Este slide mostra o modelo tradicional de supply network em UPF.

A rede de alimentação é montada explicitamente com:

- **supply ports**, que representam portas de alimentação;
- **supply nets**, que representam nets lógicas de power/ground;
- **power switches**, que conectam uma supply real a uma supply virtual switchable.

O ponto mais importante do slide é:

```text
Supply nets não têm semântica inerente de power ou ground.
```

Ou seja, uma net chamada `VDD` não é automaticamente “power” apenas por causa do nome. O significado vem da conectividade, especialmente de qual `pg_pin` da célula ela alimenta.

### Exemplo mental

Se uma supply net conecta ao pino `VDD` de uma standard cell, ela será interpretada como power para aquela célula. Se conecta ao pino `VSS`, será interpretada como ground.

A semântica nasce da conexão:

```text
supply net → pg pin → função elétrica
```

### Ponto de prova

```text
No modelo tradicional, cada conexão de supply precisa ser definida explicitamente.
```

---

## Slide 2 — Supply Net Availability

### Texto extraído

Título:

```text
Supply Net Availability
```

Primeira caixa:

```text
Domain independent supply nets
```

Itens:

```text
Supply nets created without -domain option are domain independent
create_supply_net VDD defines VDD as available in the scope it is created, and below
Requirement of implicit/explicit supply set flow
```

Segunda caixa:

```text
Domain dependent supply nets
```

Itens:

```text
Supply nets created with -domain option are available only in that domain
create_supply_net VDD -domain PD_B defines VDD as only available in PD_B,
unless also created elsewhere with -reuse option
Used in non-supply set based flow (UPF1.0)
```

### Interpretação

Este slide introduz uma distinção essencial.

## 1. Domain independent supply nets

São criadas sem `-domain`:

```tcl
create_supply_net VDD
```

Esse tipo de supply net fica disponível:

```text
no scope em que foi criada
e abaixo dele
```

Esse é o tipo exigido no fluxo baseado em supply sets.

## 2. Domain dependent supply nets

São criadas com `-domain`:

```tcl
create_supply_net VDD -domain PD_B
```

Nesse caso, a net fica disponível apenas naquele domínio, salvo se for criada em outro lugar com `-reuse`.

Esse estilo é associado ao fluxo não baseado em supply sets, especialmente estilo UPF 1.0.

### Ponto crítico para este módulo

O slide antecipa uma regra que volta depois:

```text
Supply nets usadas para refinar supply sets devem ser domain independent.
```

Isso evita que um supply set abstrato aponte para uma net local que não está disponível onde precisa ser usada.

---

## Slide 3 — What Supplies Will You Need?

### Texto extraído

Título:

```text
What Supplies Will You Need?
```

Pontos:

```text
Determining where a supply should be available may not always be evident at first glance
```

Exemplos:

```text
Power switch is not required to be instantiated inside the power domain it powers
```

Subitem:

```text
Any cells needing a pre-switch supply in that power domain would need a little more attention
```

Outro exemplo:

```text
Level shifters need their supplies to be available in the power domain where they will be placed
```

Subitens:

```text
Typically, low-to-high LS has two supplies, but high-to-low LS has only one supply
Placement must honor LS supply rail restrictions
```

Último ponto:

```text
Check reports and logs for errors / warnings on missing supplies
```

### Interpretação

Este slide alerta que determinar onde uma supply deve estar disponível pode ser menos óbvio do que parece.

## Power switches

O power switch não precisa obrigatoriamente estar dentro do domínio que ele alimenta. Ele pode estar no parent, na fronteira, em uma região física específica ou em uma topologia de power grid.

Mas se alguma célula dentro do domínio precisa da **pre-switch supply**, essa supply precisa estar disponível no local correto.

Exemplo:

```text
PD_SW usa VDD virtual como primary supply,
mas uma AO cell dentro de PD_SW precisa de VDD não switchada.
```

Isso exige atenção na definição da supply network.

## Level shifters

Level shifters precisam de supplies disponíveis onde serão inseridos.

- Um LS low-to-high normalmente precisa de duas supplies.
- Um LS high-to-low pode usar apenas uma supply, dependendo da biblioteca.
- O placement precisa respeitar restrições de rails da célula.

### Ponto prático

```text
Warnings de missing supplies nos reports/logs são sintomas importantes.
```

Quando LS/ISO/RET/switch não mapeia ou fica em local inesperado, muitas vezes o problema é supply indisponível.

---

## Slide 4 — Power Supply Network Commands

### Texto extraído

Título:

```text
Power Supply Network Commands
```

Comandos e descrições:

```tcl
create_supply_port
```

```text
Creates a supply port at specified scope or level of hierarchy
Can be used by all power domains at the same scope / level of hierarchy
```

```tcl
create_supply_net
```

```text
Creates a logical representation of a power or ground supply
```

```tcl
connect_supply_net
```

```text
Connects a defined supply net to one or more defined supply ports
```

```tcl
create_power_switch
```

```text
Defines input supply, virtual supply, and control signals of a switchable supply for a domain
```

Nota amarela:

```text
REMEMBER:
All of these are logical objects, described in the UPF
```

### Interpretação

Este slide lista os comandos básicos da supply network tradicional.

## `create_supply_port`

Cria uma porta lógica de alimentação em um determinado scope/hierarquia.

## `create_supply_net`

Cria uma net lógica de alimentação ou ground.

## `connect_supply_net`

Conecta a net de supply a uma ou mais supply ports.

## `create_power_switch`

Define um switch lógico que transforma uma supply de entrada em supply virtual controlada.

### Ideia fundamental

O slide reforça que todos esses objetos são **lógicos** no UPF:

```text
eles descrevem intenção e conectividade lógica,
não são ainda straps/metais físicos reais.
```

A implementação física virá depois, quando o Fusion Compiler/ICC II criar power grid, rails, straps e vias.

---

## Slide 5 — Power Supply Network — Create Ports

### Texto extraído

Título:

```text
Power Supply Network — Create Ports
```

Power domains:

```tcl
create_power_domain TOP
create_power_domain PD_SW \
    -elements pd_switchable
```

Criar top-level supply ports:

```tcl
create_supply_port VDD
create_supply_port VDDL
create_supply_port VSS
```

Figura:

```text
TOP
VDD
VDDL
VSS
PD_SW
pd_switchable (0.9V / OFF)
power_controller
```

### Interpretação

Este slide começa um exemplo passo a passo.

Primeiro, cria-se o domínio top e o domínio switchable:

```tcl
create_power_domain TOP
create_power_domain PD_SW -elements pd_switchable
```

Depois, criam-se as portas de supply no top:

```tcl
create_supply_port VDD
create_supply_port VDDL
create_supply_port VSS
```

### Significado das supplies no exemplo

- `VDD`: supply do top, provavelmente 1.08 V.
- `VDDL`: supply mais baixa ou supply para domínio low-power.
- `VSS`: ground.

A figura mostra essas portas no topo do design e o domínio `PD_SW` dentro do top.

### Ponto prático

Criar supply ports define os pontos de entrada lógica da alimentação na hierarquia. Ainda falta criar nets e conectar essas nets às portas.

---

## Slide 6 — Power Supply Network — Create Nets

### Texto extraído

Título:

```text
Power Supply Network — Create Nets
```

Criar supply nets no nível filho:

```tcl
create_supply_net VDD
create_supply_net VDDL
create_supply_net VSS
create_supply_net VDDLS1
```

Notas:

```text
NOTE: VDDLS1 is only showing in PD_SW for visualization purposes but is available throughout
```

```text
NOTE: power switch is not yet defined, but shown here for clarity
```

Figura:

```text
TOP
PD_SW
VDD
VDDL
VSS
VDDLS1
on/off
```

### Interpretação

Depois de criar portas, o exemplo cria supply nets:

```tcl
create_supply_net VDD
create_supply_net VDDL
create_supply_net VSS
create_supply_net VDDLS1
```

A net `VDDLS1` parece representar uma supply virtual ou switchada associada ao domínio `PD_SW`. O slide mostra o power switch na figura, mas alerta que ele ainda não foi definido formalmente; aparece apenas para clareza visual.

### Atenção ao escopo

Como essas nets são criadas sem `-domain`, elas são **domain independent**. Por isso, o slide observa que `VDDLS1`, embora desenhada dentro de `PD_SW`, está disponível em todo o escopo onde foi criada e abaixo.

### Ponto importante

```text
A figura visual não deve ser confundida com disponibilidade lógica.
```

Uma net desenhada dentro de um domínio pode estar disponível em escopo mais amplo se foi criada sem `-domain`.

---

## Slide 7 — Power Supply Network — Connect Nets

### Texto extraído

Título:

```text
Power Supply Network — Connect Nets
```

Conectar supply nets às portas:

```tcl
connect_supply_net VDD  -ports {VDD}
connect_supply_net VDDL -ports {VDDL}
connect_supply_net VSS  -ports {VSS}
```

### Interpretação

Este slide completa a conexão entre supply ports e supply nets.

Antes:

```text
portas existem
nets existem
```

Agora:

```text
nets são conectadas às portas
```

Exemplo:

```tcl
connect_supply_net VDD -ports {VDD}
```

A net lógica `VDD` é conectada à porta `VDD`.

### Ponto prático

No UPF tradicional, criar objetos não basta. É preciso conectar explicitamente.

Fluxo mínimo:

```text
create_supply_port
create_supply_net
connect_supply_net
```

---

## Slide 8 — Power Supply Network — Domain Nets

### Texto extraído

Título:

```text
Power Supply Network — Domain Nets
```

Texto:

```text
Specify primary nets for power domains handled through implicit supply set handles
```

Subitens:

```text
Once implicit supply set handles are refined to supply nets,
these will then be primary supply nets for the domains
```

```text
They will be associated to the primary supply attribute of all cells in this domain
```

Caixa:

```text
std_cell_main_rail
```

Exemplo 1:

```tcl
create_supply_set TOP.primary -update \
    -function {power VDD} \
    -function {ground VSS}
```

Exemplo 2:

```tcl
create_supply_set SS_TOP \
    -function {power VDD} \
    -function {ground VSS}

associate_supply_set -handle TOP.primary \
    -supply SS_TOP
```

### Interpretação

Este slide faz a ponte entre supply network tradicional e supply set handles.

O domínio `TOP` possui um handle implícito:

```text
TOP.primary
```

Esse handle representa a supply primária do domínio. Para a implementação física, ele precisa ser refinado para nets reais.

Há duas formas mostradas.

## Forma 1 — Refinar diretamente o handle

```tcl
create_supply_set TOP.primary -update \
    -function {power VDD} \
    -function {ground VSS}
```

Aqui, o próprio handle `TOP.primary` é atualizado com as funções power/ground.

## Forma 2 — Criar supply set explícito e associar ao handle

```tcl
create_supply_set SS_TOP \
    -function {power VDD} \
    -function {ground VSS}

associate_supply_set -handle TOP.primary \
    -supply SS_TOP
```

Aqui, `SS_TOP` é criado como supply set explícito e depois associado ao handle `TOP.primary`.

### Efeito nas células

Essas supplies serão associadas ao atributo de primary supply das células do domínio, como:

```text
std_cell_main_rail
```

Isso quer dizer que as standard cells daquele domínio passam a saber quais rails são power e ground.

---

## Slide 9 — Supply Network in Physical Synthesis

### Texto extraído

Título:

```text
Supply Network in Physical Synthesis
```

Ponto principal:

```text
Remember: Physical implementation requires all power and ground connectivity to be defined
```

Subitem:

```text
Actual supply network needs to be fully defined
```

Exemplo:

```tcl
create_supply_port VDD
create_supply_net myVDD
connect_supply_net myVDD -ports {VDD}

create_supply_port VSS
create_supply_net myVSS
connect_supply_net myVSS -ports {VSS}
```

### Interpretação

Este slide reforça uma diferença crucial entre UPF abstrato e implementação física.

Para RTL simulation ou intenção abstrata, talvez supply sets e handles sejam suficientes. Mas para physical synthesis, a ferramenta precisa saber:

```text
quais nets reais alimentam power e ground
como elas se conectam às portas
quais supply sets apontam para essas nets
```

O exemplo mostra o mínimo:

```tcl
create_supply_port
create_supply_net
connect_supply_net
```

para `VDD` e `VSS`.

### Ponto de prova

```text
Physical implementation requires all power and ground connectivity to be defined.
```

Essa frase é uma das mais importantes do módulo.

---

# Parte 2 — Introdução aos supply sets

## Slide 10 — Semantics in IEEE 1801-2009

### Texto extraído

Título:

```text
Semantics in IEEE 1801-2009
```

Pontos:

```text
Constructs from UPF 2-0 provide flexibility in defining low power constraints, using supply sets
```

Subitem:

```text
Abstracts logical implementation from physical implementation
```

Definição:

```text
A supply set relates multiple supply nets as a complete power source for one or more design elements
```

Subitem:

```text
In other words, a supply set is a bundle of supply nets
```

Figura:

```text
Supply Net A
Supply Net B
Supply Net C
→ Supply Set
```

### Interpretação

Este slide introduz o conceito de **supply set** em UPF 2.0 / IEEE 1801-2009.

Um supply set agrupa várias supply nets que, juntas, formam uma fonte completa para um elemento de design.

Exemplo:

```text
power net + ground net + well nets = supply set
```

O benefício é a abstração:

```text
em vez de referenciar cada net individual,
o UPF pode referenciar um conjunto de supplies.
```

### Analogia

O slide mostra várias supply nets como fios individuais entrando em um “cabo” chamado supply set.

Isso ajuda a pensar:

```text
Supply set = pacote de alimentação completo.
```

---

## Slide 11 — Definition: Supply Set Functions

### Texto extraído

Título:

```text
Definition: Supply Set Functions
```

Figura esquerda:

```text
Each supply net in a supply set performs a function
```

Funções:

```text
power
ground
pwell
nwell
```

Figura direita:

```text
Each function represents an electrical function on a logic element associated with the supply set
```

Pontos:

```text
Each function of a supply set can correspond to 1 and only 1 supply net
```

```text
Can be accessed using the following syntax:
<supplySetName>.<functionName>
```

Exemplos:

```text
ss1.power
ss1.ground
```

### Interpretação

Dentro de um supply set, cada net tem uma função.

Funções típicas:

```text
power
ground
pwell
nwell
```

A regra importante é:

```text
cada função de um supply set pode corresponder a uma e somente uma supply net.
```

Ou seja, dentro de um supply set, você não pode ter duas nets diferentes exercendo a função `power`.

A sintaxe para acessar uma função é:

```text
<supplySetName>.<functionName>
```

Exemplos:

```text
ss1.power
ss1.ground
```

### Ponto prático

Essa sintaxe será usada quando outras estratégias precisarem referenciar uma supply específica dentro de um supply set.

---

## Slide 12 — Benefits of Using Supply Sets

### Texto extraído

Título:

```text
Benefits of Using Supply Sets
```

Benefícios listados:

```text
Easier to define UPF power intent early
```

Subitem:

```text
Supply sets provide a level of abstraction
Refer to multiple supply nets as a group
```

```text
Allows more flexibility in defining strategies
```

Subitem:

```text
Specify with respect to the supplies of a net's driver / receiver
```

```text
Improves re-usability of low power IP's
```

Subitem:

```text
No supply nets/ports need to be known or handled until physical synthesis
```

```text
Enables ASIC Flow
```

Subitens:

```text
Allows RTL verification to be performed without any supply network
Allows RTL designers to define power intent, while deferring definition of actual supply nets until physical synthesis
```

### Interpretação

Supply sets resolvem um problema metodológico: no início do projeto, especialmente no RTL, o designer pode não saber ainda os nomes finais de todas as nets físicas de alimentação.

Com supply sets, é possível escrever power intent usando abstrações.

## Benefício 1 — Definir power intent cedo

O designer não precisa esperar a rede física estar pronta.

## Benefício 2 — Estratégias mais flexíveis

Em vez de dizer “use net `VDD1`”, pode dizer “use a supply do driver” ou “use a supply do receiver” por meio de supply sets e handles.

## Benefício 3 — Reuso de IP

Um IP pode carregar UPF abstrato, sem depender de nomes de power nets do chip final.

## Benefício 4 — Fluxo ASIC

O RTL designer pode definir intenção de potência cedo, e o time físico refina depois para nets reais.

### Ideia central

```text
Supply sets separam power intent lógico de detalhes físicos de implementação.
```

---

## Slide 13 — Supply Network in Physical Synthesis

### Texto extraído

Título:

```text
Supply Network in Physical Synthesis
```

Texto:

```text
Remember: Physical implementation requires all power and ground connectivity to be defined
```

Subitem:

```text
Actual supply network needs to be fully defined
```

Exemplo de conectividade:

```tcl
create_supply_port VDD
create_supply_net myVDD
connect_supply_net myVDD -ports {VDD}

create_supply_port VSS
create_supply_net myVSS
connect_supply_net myVSS -ports {VSS}
```

Outro ponto:

```text
All supply sets must be updated with supply nets
```

Exemplo:

```tcl
create_supply_set mySS1 \
    -function {power myVDD} \
    -function {ground myVSS} \
    -update
```

Nota amarela:

```text
REMEMBER:
Supply nets associated to supply sets MUST be domain independent
```

### Interpretação

Este slide reforça o que muda quando se sai de RTL/abstração e entra em physical synthesis.

Mesmo que o UPF use supply sets no RTL, em physical implementation é obrigatório refinar esses supply sets para nets reais.

Fluxo:

```text
supply set abstrato
→ update/refinement
→ supply nets reais
→ conectividade física implementável
```

A regra crítica:

```text
Supply nets associadas a supply sets devem ser domain independent.
```

Isso significa que elas devem ser criadas sem `-domain`.

### Por que domain independent?

Porque supply sets podem ser usados em diferentes domínios e escopos. Se a net fosse domain dependent, ela poderia não estar disponível onde a strategy precisa usá-la.

---

## Slide 14 — Updating Supply Sets — Caveats

### Texto extraído

Título:

```text
Updating Supply Sets — Caveats
```

Pontos:

```text
Associations must be complete before refinements
```

```text
Each function of a supply set can be updated only once
```

Explicação lateral:

```text
i.e., a supply set function can be mapped to a supply net one time only
```

```text
Two supply sets or nets with different power state values cannot be updated to each other
```

Exemplo:

```text
A 1.2V supply set cannot be updated to a 0.8V supply net
```

```text
Supply sets can only be refined to supply nets that have already been defined
```

### Interpretação

Este slide lista restrições importantes.

## 1. Associações antes de refinamentos

Se você vai associar handles/supply sets, faça essas associações antes de refinar para nets concretas. Depois do refinement, a estrutura fica mais fixa.

## 2. Cada função atualizada uma única vez

Uma função como:

```text
mySS1.power
```

só pode ser mapeada para uma supply net uma vez.

Não se deve fazer:

```text
mySS1.power → VDD1
mySS1.power → VDD2
```

## 3. Power states incompatíveis não podem ser unidos

Não faz sentido refinar um supply set de 1.2 V para uma net de 0.8 V. Isso violaria a semântica de power states.

## 4. Nets precisam existir antes

Você só pode refinar supply set para supply nets já definidas.

### Regra prática

```text
Crie nets primeiro, depois refine supply sets para essas nets.
```

---

## Slide 15 — Summary of Supply Sets Introduction

### Texto extraído

Título:

```text
Summary of Supply Sets Introduction
```

Pontos:

```text
Supply sets make easier and more concise to define UPF power intent at RTL,
without full knowledge of power network connectivity
```

Subitem:

```text
Still need to refine supplies with additional UPF for physical implementation
```

```text
No supply nets/ports to remember and connect at RTL
```

Subitem:

```text
Only referencing power domains and their handles
```

```text
Enables ASIC Flow
```

Subitem:

```text
Start with RTL UPF and defer implementation details until physical layout
```

### Interpretação

Este é um resumo da motivação de supply sets.

No RTL, o designer pode escrever power intent de forma mais simples:

```text
referenciando power domains e handles
```

sem precisar lembrar ou conectar nomes físicos de nets e ports.

Mas o slide reforça que isso não elimina o refinement posterior:

```text
physical implementation ainda precisa de supply nets/ports reais.
```

### Ponto de metodologia

```text
RTL UPF pode ser abstrato.
Implementation UPF precisa ser refinado.
```

---

## Slide 16 — Summary of Supply Sets Introduction — repetição

### Texto extraído

O slide repete os mesmos pontos do slide anterior:

```text
Supply sets make easier and more concise to define UPF power intent at RTL
No supply nets/ports to remember and connect at RTL
Enables ASIC Flow
```

### Interpretação

A repetição reforça o conceito para prova e prática:

```text
Supply set é a camada abstrata.
Supply net/port real entra depois, no refinement para implementação física.
```

Em questões de banco, esse tema pode aparecer como:

- supply sets facilitam UPF em RTL;
- supply sets adiam detalhes de implementação;
- supply sets ainda precisam ser refinados para physical synthesis;
- supply sets permitem fluxo ASIC.

---

## Slide 17 — Semantics in IEEE 1801-2009 — reforço

### Texto extraído

Título:

```text
Semantics in IEEE 1801-2009
```

Conteúdo repetido:

```text
Constructs from UPF 2-0 provide flexibility in defining low power constraints,
using supply sets
```

```text
A supply set relates multiple supply nets as a complete power source
for one or more design elements
```

```text
A supply set is a bundle of supply nets
```

### Interpretação

Este slide retoma a definição formal de supply set.

A repetição é útil porque a partir daqui o módulo começa a distinguir:

```text
supply sets explícitos
supply set handles implícitos
associação
refinamento
availability
```

Então o conceito-base precisa estar claro:

```text
supply set = conjunto de supply nets com funções.
```

---

## Slide 18 — Definition: Supply Set Functions — reforço

### Texto extraído

Título:

```text
Definition: Supply Set Functions
```

Pontos repetidos:

```text
Each supply net in a supply set performs a function
```

Funções:

```text
power
ground
pwell
nwell
```

```text
Each function of a supply set can correspond to 1 and only 1 supply net
```

Sintaxe:

```text
<supplySetName>.<functionName>
```

Exemplos:

```text
ss1.power
ss1.ground
```

### Interpretação

Este slide reforça a regra de cardinalidade:

```text
uma função → uma supply net
```

E reforça a sintaxe:

```text
supply_set.function
```

Essa sintaxe aparece nos slides seguintes quando um supply set é refinado a outro supply set ou a uma função específica, como:

```text
mySS1.power
mySS1.ground
```

---

## Slide 19 — Benefits of Using Supply Sets — reforço

### Texto extraído

Título:

```text
Benefits of Using Supply Sets
```

Benefícios repetidos:

```text
Easier to define UPF power intent early
Allows more flexibility in defining strategies
Improves re-usability of low power IP's
Enables ASIC Flow
```

### Interpretação

Este slide repete os benefícios, agora como transição para o uso de supply sets dentro de power domains.

O benefício mais importante para este curso é:

```text
permite que RTL UPF seja escrito sem nomes físicos de supply,
e depois refinado para physical synthesis.
```

Isso é exatamente o que o Fusion Compiler precisa em um fluxo real: separar intenção de potência do RTL da implementação física da rede de alimentação.

---

# Parte 3 — Supply sets e supply nets em power domains

## Slide 20 — Supply Sets in Power Domains

### Texto extraído

Título:

```text
Supply Sets in Power Domains
```

Pontos:

```text
Different types of design elements can exist in a power domain
```

Subitem:

```text
Logic elements, isolation elements, retention elements
```

```text
Each of them has a set of supply nets connected to them
```

```text
Supply sets allow grouping of the supply nets connected to each element type
```

Exemplo usando supply sets:

```text
Top level supply sets: ss_TOP, ss_TOP_LOW
Supply set for logic elements in p2: ss_P2
Supply set for ISO elements: ss_ISO
Supply set for shadow elements in retention flops: ss_RET
```

Figura:

```text
TOP (0.9V)
ss_TOP
ss_TOP_LOW
p2 (0.9V / OFF)
ss_P2
ss_RET
ss_ISO
p2_sd
p2_isolation
save/restore
RR
ISO
```

### Interpretação

Este slide mostra que um power domain pode conter diferentes tipos de elementos, e cada tipo pode precisar de supplies diferentes.

Dentro de um mesmo domínio, podem existir:

- lógica normal;
- isolation cells;
- retention elements;
- shadow elements de retention flops;
- power management logic.

Cada tipo pode precisar de um conjunto de supplies diferente.

### Exemplo

No domínio `p2`:

- lógica normal usa `ss_P2`;
- ISO usa `ss_ISO`;
- retention shadow elements usam `ss_RET`.

Isso mostra por que `primary`, `default_isolation` e `default_retention` existem como handles separados.

### Ponto importante

```text
Um power domain não tem apenas uma única supply conceitual para tudo.
Tipos diferentes de células dentro do domínio podem exigir supplies diferentes.
```

---

## Slide 21 — Supply Nets in Power Domains

### Texto extraído

Título:

```text
Supply Nets in Power Domains
```

Pontos:

```text
Different types of design elements can exist in a power domain
```

Subitem:

```text
Logic elements, isolation elements, retention elements
```

```text
Each of them has a set of supply nets connected to them
```

Exemplo:

```text
VDD_sw_p2, VSS form set of supplies controlling logic elements in p2
```

```text
VDD, VSS form set of supplies for ISO elements
```

```text
VDD_LOW, VSS form set of supplies for shadow elements in retention flops
```

Figura:

```text
TOP (0.9V)
VDD
VDD_LOW
p2 (0.9V / OFF)
VDD_sw_p2
VSS
RR
ISO
save/restore
p2_isolation
```

### Interpretação

Este slide mostra a mesma situação do slide 20, mas agora usando **supply nets concretas** em vez de supply sets abstratos.

Comparação:

| Tipo de elemento | Supply set no slide 20 | Supply nets no slide 21 |
|---|---|---|
| Lógica normal de p2 | `ss_P2` | `VDD_sw_p2`, `VSS` |
| ISO elements | `ss_ISO` | `VDD`, `VSS` |
| Retention shadow elements | `ss_RET` | `VDD_LOW`, `VSS` |

Essa comparação é muito didática:

```text
Supply set é abstração.
Supply net é conexão concreta.
```

O slide mostra que as duas formas descrevem a mesma intenção em níveis diferentes.

---

## Slide 22 — Supply Set Variations

### Texto extraído

Título:

```text
Supply Set Variations
```

Pontos:

```text
IEEE1801-2009 defines two ways of using supply sets
```

Subitens:

```text
Expressly creating supply sets (Explicit)
Using power domain supply handles (Implicit)
```

Outro ponto:

```text
Supply sets can be explicitly created via the create_supply_set command
```

Outro ponto:

```text
Power domain supply handles are supply set references that get implicitly
created with the create_power_domain command
```

### Interpretação

A partir daqui, o curso separa duas metodologias.

## 1. Explicit supply sets

Você cria o supply set diretamente:

```tcl
create_supply_set mySS
```

## 2. Implicit supply set handles

Quando você cria um power domain, a ferramenta cria automaticamente handles de supply set associados ao domínio.

Exemplo:

```tcl
create_power_domain PD1
```

cria handles como:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

### Ponto central

```text
Explicit supply set = objeto criado manualmente.
Supply set handle = referência criada automaticamente pelo power domain.
```

---

## Slide 23 — Explicitly Creating Supply Sets

### Texto extraído

Título:

```text
Explicitly Creating Supply Sets
```

Sintaxe:

```tcl
create_supply_set set_name \
    [-function {func_name [net_name]}] \
    [-update]
```

Exemplo em RTL:

```text
At RTL, only need supply set reference:
```

```tcl
create_supply_set PDT_primary_set
```

Exemplo para implementação física:

```text
For subsequent physical implementation, add supply net assignments:
```

```tcl
create_supply_set PDT_primary_set \
    -function {power VDD?} \
    -function {ground VSS} \
    -update
```

### Interpretação

O slide mostra a criação explícita de supply sets.

No RTL, você pode criar apenas a referência abstrata:

```tcl
create_supply_set PDT_primary_set
```

Sem apontar ainda para `VDD`, `VSS` ou outras nets.

Depois, na implementação física, o supply set é atualizado com funções reais:

```tcl
create_supply_set PDT_primary_set \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

### Ponto importante

A opção:

```tcl
-update
```

é usada para atualizar um supply set já existente.

Isso separa:

```text
fase RTL: abstração
fase física: refinamento para nets reais
```

---

## Slide 24 — Implicitly Creating Supply Sets: Supply Set Handles

### Texto extraído

Título:

```text
Implicitly Creating Supply Sets: Supply Set Handles
```

Definição:

```text
A supply set handle is a reference to a supply set associated with a particular power domain
```

Ponto:

```text
Further simplifies creation of supply sets by creating them automatically when a power domain is created
```

Exemplo:

```text
When power domain PD1 is defined
```

```tcl
create_power_domain PD1 -elements U1
```

Supply set handles predefinidos:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

Outro ponto:

```text
Additional user-defined supply set handles can be created by specifying a unique
identifier with the -supply option of the create_power_domain command
```

### Interpretação

Este slide introduz os supply set handles implícitos.

Quando você cria:

```tcl
create_power_domain PD1 -elements U1
```

a ferramenta cria automaticamente:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

Esses handles funcionam como referências aos supply sets associados ao domínio.

### Por que isso simplifica?

Em vez de criar manualmente supply sets para cada função do domínio, você pode referenciar:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

em strategies de isolation, retention, level shifting etc.

### Reuso

Handles tornam o UPF mais modular e independente de nomes concretos de nets.

---

## Slide 25 — Supply Set Handles

### Texto extraído

Título:

```text
Supply Set Handles
```

Pontos:

```text
There are 3 pre-defined supply set handles available for each power domain
```

Subitens:

```text
By default, the cells in a power domain are connected to these defaults
Default connections for isolation and retention cells can be overridden by specifying
a different supply in the isolation and retention strategies
Default connections can also be overridden with explicit exception connections
```

Figura:

```text
Power Domain
primary
default_isolation
default_retention
```

Descrições da figura:

```text
primary:
Set of supply nets connected to all elements partitioned into a power domain
```

```text
default_isolation:
Set of supply nets connected to isolation elements of a power domain
```

```text
default_retention:
Set of supply nets connected to retention elements of a power domain
```

### Interpretação

Este slide define os três handles padrão.

## `primary`

Supply set usado pelos elementos normais do domínio.

Exemplo:

```text
standard cells, lógica combinacional/sequencial normal
```

## `default_isolation`

Supply set usado pelas isolation cells associadas ao domínio.

Isso permite que ISO seja alimentada por uma supply diferente da lógica normal.

## `default_retention`

Supply set usado pelos retention elements do domínio.

Isso permite que retention flops usem uma supply always-on ou backup.

### Override

O slide destaca que essas conexões default podem ser substituídas:

- em estratégias de isolation;
- em estratégias de retention;
- por exception connections explícitas.

### Ponto importante

```text
Os handles são defaults convenientes, não prisões absolutas.
```

Eles dão uma base de conectividade, mas podem ser refinados ou sobrescritos quando a arquitetura exige.

---

# Aula didática desenvolvida

## 1. A supply network começa como lógica, mas precisa virar física

UPF descreve objetos lógicos:

```text
supply port
supply net
supply set
supply set handle
power switch
```

Mas o Fusion Compiler precisa transformar isso em implementação física:

```text
power grid
rails
straps
vias
switch cells
standard cell rails
AO rails
retention rails
isolation rails
```

Por isso, o curso repete:

```text
Physical implementation requires all power and ground connectivity to be defined.
```

## 2. Domain independent supply nets são essenciais para supply set flow

Supply nets criadas sem `-domain` ficam disponíveis no scope atual e abaixo. Isso é necessário quando supply sets serão refinados para essas nets.

Se uma net é domain dependent, ela fica restrita a um domínio e pode não estar disponível para o supply set em outro contexto.

Regra prática:

```text
Para supply set flow, crie supply nets domain independent.
```

## 3. Supply sets resolvem a lacuna entre RTL UPF e physical UPF

No RTL, o designer pode saber:

```text
este domínio tem uma primary supply
este domínio tem uma isolation supply
este domínio tem uma retention supply
```

mas talvez ainda não saiba os nomes físicos finais:

```text
VDD_TOP
VDD_AON
VDD_RET
VDD_SW_P2
```

Supply sets permitem escrever o power intent cedo e refinar depois.

## 4. Supply set functions são o coração da semântica

Um supply set não é só uma lista de nets. Cada net tem função.

Exemplo:

```text
ss1.power
ss1.ground
ss1.pwell
ss1.nwell
```

Isso permite que ferramentas entendam qual net alimenta power, qual net é ground e quais nets alimentam wells.

## 5. Handles são o fluxo recomendado

O slide de benefícios dos supply set handles, que vem logo depois desta parte, mostra explicitamente que esse é o fluxo recomendado pela Synopsys. A parte A já prepara esse conceito mostrando que cada power domain ganha automaticamente:

```text
PD.primary
PD.default_isolation
PD.default_retention
```

Essa abordagem é mais robusta para fluxo ASIC porque permite referenciar supplies do domínio sem conhecer nets reais.

## 6. Primary, isolation e retention não precisam usar a mesma supply

Um domínio pode ter:

```text
primary → supply switchada
default_isolation → supply always-on
default_retention → supply de backup
```

Essa separação é essencial em domínios com power gating.

Exemplo:

```text
lógica normal desliga
isolation precisa continuar ativa
retention precisa manter estado
```

Logo, primary, isolation e retention handles existem porque diferentes tipos de células têm diferentes necessidades de alimentação.

---

# Conceitos difíceis explicados em profundidade

## Supply port

Porta lógica de alimentação criada em um determinado scope/hierarquia.

Comando:

```tcl
create_supply_port
```

## Supply net

Representação lógica de uma supply power ou ground.

Comando:

```tcl
create_supply_net
```

## Connect supply net

Conecta uma supply net a uma ou mais supply ports.

Comando:

```tcl
connect_supply_net
```

## Domain independent supply net

Supply net criada sem `-domain`. Fica disponível no scope onde foi criada e abaixo. É exigida no fluxo baseado em supply sets.

## Domain dependent supply net

Supply net criada com `-domain`. Fica disponível apenas naquele domínio. Usada em fluxo antigo/não baseado em supply sets.

## Supply set

Grupo de supply nets que, juntas, formam uma fonte completa para um ou mais elementos de design.

## Supply set function

Função exercida por uma supply net dentro de um supply set.

Exemplos:

```text
power
ground
pwell
nwell
```

## Supply set handle

Referência a um supply set associado a um power domain. Criada automaticamente com `create_power_domain`.

## Primary handle

Handle que representa as supplies dos elementos normais de um power domain.

Exemplo:

```text
PD1.primary
```

## Default isolation handle

Handle que representa as supplies das isolation cells de um power domain.

Exemplo:

```text
PD1.default_isolation
```

## Default retention handle

Handle que representa as supplies dos retention elements de um power domain.

Exemplo:

```text
PD1.default_retention
```

## Refinement

Processo de mapear supply sets abstratos para supply nets reais.

## Update

Atualização de um supply set já existente usando `-update`, normalmente para adicionar funções power/ground.

---

# Comandos importantes da parte A

## Criar power domains

```tcl
create_power_domain TOP
create_power_domain PD_SW \
    -elements pd_switchable
```

## Criar supply ports

```tcl
create_supply_port VDD
create_supply_port VDDL
create_supply_port VSS
```

## Criar supply nets

```tcl
create_supply_net VDD
create_supply_net VDDL
create_supply_net VSS
create_supply_net VDDLS1
```

## Conectar supply nets a ports

```tcl
connect_supply_net VDD  -ports {VDD}
connect_supply_net VDDL -ports {VDDL}
connect_supply_net VSS  -ports {VSS}
```

## Refinar handle primário diretamente

```tcl
create_supply_set TOP.primary -update \
    -function {power VDD} \
    -function {ground VSS}
```

## Criar supply set explícito e associar ao handle

```tcl
create_supply_set SS_TOP \
    -function {power VDD} \
    -function {ground VSS}

associate_supply_set -handle TOP.primary \
    -supply SS_TOP
```

## Conectividade física mínima

```tcl
create_supply_port VDD
create_supply_net myVDD
connect_supply_net myVDD -ports {VDD}

create_supply_port VSS
create_supply_net myVSS
connect_supply_net myVSS -ports {VSS}
```

## Criar supply set abstrato no RTL

```tcl
create_supply_set PDT_primary_set
```

## Atualizar supply set para implementação física

```tcl
create_supply_set PDT_primary_set \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

## Criar power domain e handles implícitos

```tcl
create_power_domain PD1 -elements U1
```

Handles criados:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

---

# Tabelas de revisão

## Traditional supply network commands

| Comando | Função |
|---|---|
| `create_supply_port` | Cria uma porta lógica de supply |
| `create_supply_net` | Cria uma net lógica de power/ground |
| `connect_supply_net` | Conecta supply net a supply port |
| `create_power_switch` | Define input supply, virtual supply e controle de switchable supply |

---

## Domain independent vs domain dependent

| Tipo | Como cria | Disponibilidade | Uso |
|---|---|---|---|
| Domain independent | `create_supply_net VDD` | Scope atual e abaixo | Fluxo com supply sets |
| Domain dependent | `create_supply_net VDD -domain PD_B` | Apenas no domínio | Fluxo não baseado em supply sets / UPF 1.0 |

---

## Supply set functions

| Função | Significado |
|---|---|
| `power` | Supply de power da lógica |
| `ground` | Ground da lógica |
| `pwell` | Well supply associado a p-well |
| `nwell` | Well supply associado a n-well |

Sintaxe:

```text
<supplySetName>.<functionName>
```

Exemplos:

```text
ss1.power
ss1.ground
```

---

## Explicit supply set vs supply set handle

| Conceito | Como surge | Exemplo |
|---|---|---|
| Explicit supply set | Criado manualmente | `create_supply_set mySS` |
| Supply set handle | Criado automaticamente com power domain | `PD1.primary` |
| Handle de isolation | Criado com power domain | `PD1.default_isolation` |
| Handle de retention | Criado com power domain | `PD1.default_retention` |

---

## Handles padrão de um power domain

| Handle | Alimenta |
|---|---|
| `primary` | Elementos normais do power domain |
| `default_isolation` | Isolation elements do power domain |
| `default_retention` | Retention elements do power domain |

---

## Regras de update/refinement

| Regra | Explicação |
|---|---|
| Associações antes de refinamento | Defina relações antes de mapear para nets finais |
| Cada função só atualiza uma vez | `power` só pode apontar para uma net |
| Power states precisam ser compatíveis | Não mapear 1.2 V para 0.8 V |
| Nets precisam existir antes | Refinement só pode apontar para supply nets já definidas |
| Nets devem ser domain independent | Necessário no supply set flow |

---

# Fluxo mental da parte A

```text
1. Criar power domains.
2. Criar supply ports no top ou scope adequado.
3. Criar supply nets domain independent.
4. Conectar supply nets às supply ports.
5. Definir ou usar supply sets.
6. Usar supply set handles criados automaticamente pelos power domains.
7. No RTL, manter power intent abstrato se possível.
8. Na implementação física, refinar supply sets para supply nets reais.
9. Garantir que todas as conexões de power e ground estejam completas.
10. Verificar logs/reports de missing supplies.
```

---

# Figuras e diagramas importantes

## Slide 1 — Traditional Supply Network Definition

Mostra que a rede tradicional é construída por conectividade detalhada e que supply nets/ports/switches não têm semântica inerente de power/ground.

## Slide 2 — Supply Net Availability

Divide supply nets em domain independent e domain dependent. Essa figura é base para entender por que supply set flow exige nets domain independent.

## Slide 3 — What Supplies Will You Need?

Mostra que supplies necessárias nem sempre são óbvias, especialmente para power switches e level shifters.

## Slide 4 — Power Supply Network Commands

Mostra os comandos centrais: `create_supply_port`, `create_supply_net`, `connect_supply_net`, `create_power_switch`.

## Slide 5 — Create Ports

Mostra `TOP`, `PD_SW`, portas `VDD`, `VDDL` e `VSS`.

## Slide 6 — Create Nets

Mostra nets `VDD`, `VDDL`, `VSS` e `VDDLS1`, além do aviso de que o power switch ainda não foi definido.

## Slide 7 — Connect Nets

Mostra a conexão explícita entre supply nets e supply ports.

## Slide 8 — Domain Nets

Mostra como refinar o handle `TOP.primary` para `VDD/VSS` ou associá-lo a `SS_TOP`.

## Slide 9 — Physical Synthesis

Mostra a necessidade de definir toda conectividade real de power/ground para implementação física.

## Slide 10 — Semantics in IEEE 1801-2009

Mostra supply nets agrupadas como supply set, como um bundle.

## Slide 11 — Supply Set Functions

Mostra funções `power`, `ground`, `pwell`, `nwell` e a relação com um logic element.

## Slide 12 — Benefits of Using Supply Sets

Mostra quatro benefícios: definir cedo, flexibilidade, reuso de IP e ASIC flow.

## Slide 13 — Physical Synthesis com Supply Sets

Mostra que supply sets devem ser atualizados com supply nets e que essas nets devem ser domain independent.

## Slide 14 — Updating Supply Sets Caveats

Mostra regras de update/refinement, incluindo update único por função e incompatibilidade de power state values.

## Slides 15-19 — Reforço da introdução a supply sets

Repetem a definição, funções e benefícios de supply sets, preparando a transição para supply set handles.

## Slide 20 — Supply Sets in Power Domains

Mostra que lógica, ISO e retention podem ter supply sets diferentes dentro do mesmo power domain.

## Slide 21 — Supply Nets in Power Domains

Mostra a versão concreta com supply nets: `VDD_sw_p2`, `VDD`, `VDD_LOW`, `VSS`.

## Slide 22 — Supply Set Variations

Mostra os dois fluxos: explicit supply sets e implicit power domain supply handles.

## Slide 23 — Explicitly Creating Supply Sets

Mostra `create_supply_set` abstrato no RTL e depois update com power/ground nets.

## Slide 24 — Implicitly Creating Supply Sets

Mostra `create_power_domain PD1 -elements U1` criando automaticamente `PD1.primary`, `PD1.default_isolation`, `PD1.default_retention`.

## Slide 25 — Supply Set Handles

Mostra os três handles padrão e a função de cada um: primary, default_isolation e default_retention.

---

# Pontos de prova e revisão

1. Supply network tradicional é construída por conectividade detalhada.
2. A supply network usa supply nets, supply ports e power switches.
3. Supply nets não têm semântica inerente de power ou ground.
4. A semântica de uma supply net vem da conectividade com pg pins.
5. Cada conexão de supply network exige definição explícita.
6. Supply nets sem `-domain` são domain independent.
7. Supply nets com `-domain` são domain dependent.
8. Domain independent supply nets ficam disponíveis no scope onde são criadas e abaixo.
9. Domain dependent supply nets ficam disponíveis apenas no domínio indicado.
10. `create_supply_net VDD` cria uma net disponível no scope e abaixo.
11. `create_supply_net VDD -domain PD_B` cria uma net disponível apenas em `PD_B`.
12. Fluxo baseado em supply sets exige domain independent supply nets.
13. Power switch não precisa ser instanciado dentro do domínio que alimenta.
14. Células que precisam de pre-switch supply exigem atenção especial.
15. Level shifters precisam de suas supplies disponíveis no domínio onde serão colocados.
16. Low-to-high LS normalmente tem duas supplies.
17. High-to-low LS pode ter apenas uma supply, dependendo da biblioteca.
18. Placement precisa respeitar restrições de supply rails do LS.
19. Reports/logs devem ser checados para erros/warnings de missing supplies.
20. `create_supply_port` cria porta de supply no scope indicado.
21. `create_supply_net` cria representação lógica de power/ground.
22. `connect_supply_net` conecta supply net a supply ports.
23. `create_power_switch` define input supply, virtual supply e controle.
24. Todos esses objetos são lógicos e descritos no UPF.
25. Criar supply ports não conecta automaticamente nets.
26. Criar supply nets não conecta automaticamente ports.
27. `connect_supply_net` é necessário para conectar nets a ports.
28. Physical implementation exige toda conectividade de power/ground definida.
29. A actual supply network precisa estar fully defined.
30. Supply sets foram introduzidos no contexto IEEE 1801-2009 / UPF 2.0.
31. Supply sets abstraem implementação lógica da implementação física.
32. Supply set é um bundle de supply nets.
33. Supply set relaciona múltiplas supply nets como fonte completa para elementos.
34. Cada supply net no supply set executa uma função.
35. Funções comuns: power, ground, pwell, nwell.
36. Cada função de supply set pode corresponder a uma e apenas uma supply net.
37. Acesso a função usa sintaxe `<supplySetName>.<functionName>`.
38. Exemplos: `ss1.power`, `ss1.ground`.
39. Supply sets facilitam definir power intent cedo no RTL.
40. Supply sets permitem referenciar múltiplas supply nets como grupo.
41. Supply sets dão flexibilidade para strategies.
42. Supply sets melhoram reuso de low-power IP.
43. Supply sets habilitam ASIC flow.
44. Com supply sets, RTL verification pode ocorrer sem supply network completa.
45. Mesmo usando supply sets, physical implementation exige refinement.
46. Todos supply sets precisam ser atualizados com supply nets para physical synthesis.
47. Supply nets associadas a supply sets devem ser domain independent.
48. Associações devem estar completas antes dos refinamentos.
49. Cada função de supply set pode ser atualizada apenas uma vez.
50. Supply sets/nets com power states diferentes não podem ser atualizados um para o outro.
51. Supply sets só podem ser refinados para supply nets já definidas.
52. Diferentes tipos de elementos podem existir em um power domain.
53. Lógica, isolation e retention podem usar supplies diferentes.
54. Supply sets agrupam supplies por tipo de elemento.
55. `ss_P2` pode representar supplies da lógica normal.
56. `ss_ISO` pode representar supplies de isolation cells.
57. `ss_RET` pode representar supplies de retention shadow elements.
58. IEEE 1801-2009 define uso explícito e implícito de supply sets.
59. Supply sets explícitos são criados com `create_supply_set`.
60. Supply set handles são criados implicitamente com `create_power_domain`.
61. `PD1.primary` é handle primário do domínio.
62. `PD1.default_isolation` é handle de isolation padrão.
63. `PD1.default_retention` é handle de retention padrão.
64. Cada power domain tem três handles predefinidos.
65. Por default, as células do domínio são conectadas a esses defaults.
66. Conexões default de isolation e retention podem ser sobrescritas nas strategies.
67. Conexões default também podem ser sobrescritas por exception connections.
68. `primary` alimenta todos os elementos partitioned no power domain.
69. `default_isolation` alimenta isolation elements.
70. `default_retention` alimenta retention elements.

---

# Relação com Fusion Compiler

No Fusion Compiler, este conteúdo é essencial porque o compile físico precisa de informações completas de power/ground.

O FC pode usar UPF abstrato em fases iniciais, mas para implementar o design precisa resolver:

```text
1. quais supplies são primary para cada power domain;
2. quais supplies alimentam isolation cells;
3. quais supplies alimentam retention cells;
4. quais nets são power e ground reais;
5. como supply ports se conectam a supply nets;
6. quais supply sets foram refinados;
7. quais supply nets são domain independent;
8. se há missing supplies para LS/ISO/RET/power switches.
```

A parte A prepara o terreno para a parte B, que aprofunda:

```text
supply set handles
associação
refinamento
availability
strategies com supply sets
```

---

# Checklist prático da parte A

```text
1. Os power domains foram criados?
2. As supply ports foram criadas no scope correto?
3. As supply nets foram criadas como domain independent quando usadas por supply sets?
4. As supply nets foram conectadas às ports?
5. Os handles primários foram refinados ou associados?
6. As supplies de physical synthesis estão fully defined?
7. Todos os supply sets foram atualizados com nets reais?
8. As funções power/ground foram atualizadas apenas uma vez?
9. Os power state values são compatíveis?
10. As nets usadas em refinement já foram definidas?
11. O UPF RTL usa supply sets/handles para abstração?
12. O UPF físico refina essas abstrações?
13. Isolation e retention têm handles ou supplies adequadas?
14. Reports/logs não mostram missing supplies?
```

---

# Checklist de qualidade

- [x] Bloco 083 processado conforme roteiro, slides 1-25.
- [x] O arquivo grande foi mantido dividido, sem avançar para a parte B.
- [x] Traditional supply network foi explicada.
- [x] Domain independent/dependent supply nets foram diferenciadas.
- [x] Comandos `create_supply_port`, `create_supply_net`, `connect_supply_net`, `create_power_switch` foram preservados.
- [x] Supply sets e supply set functions foram explicados.
- [x] Caveats de update/refinement foram destacados.
- [x] Supply set handles foram introduzidos com `primary`, `default_isolation` e `default_retention`.
- [x] Figuras dos slides 1-25 foram interpretadas.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 084
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 04 Module 04 — Supply Network — parte B
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network.docx
```

- **Processar somente:** slides 26-50
- **Começar por:** `Supply Set Handles`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network_parte_B.md
```

- **Depois:** Bloco 085 — `04 Module 04 - Supply Network - parte C`, slides 51-63.
