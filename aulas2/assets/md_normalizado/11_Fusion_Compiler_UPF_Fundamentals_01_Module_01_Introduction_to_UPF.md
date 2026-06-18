# 01 Module 01 — Introduction to UPF

## Controle do bloco

- **Bloco:** 078
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 01 Module 01 — Introduction to UPF
- **Prioridade:** média
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\01 Module 01 - Introduction to UPF.docx`
- **Faixa processada conforme roteiro:** slides 1-16
- **Observação sobre o anexo:** o DOCX possui 8 páginas com 2 slides por página. O texto foi extraído visualmente dos prints, pois o documento não possui texto editável parseável.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\01 Module 01 - Introduction to UPF.md
```

---

## Resumo executivo

Este módulo é a introdução ao **UPF — Unified Power Format**, o formato usado para descrever **power intent** em projetos digitais, especialmente em designs **multi-voltage** e com **power gating**. A ideia principal é separar duas dimensões do projeto:

```text
RTL → descreve o comportamento funcional
UPF → descreve o comportamento de potência
```

O RTL diz o que o circuito faz logicamente: hierarquia, datapath, state machines, memória, I/Os e blocos funcionais. O UPF diz como esse circuito deve se comportar do ponto de vista de potência: quais blocos operam em quais tensões, quais domínios podem ser desligados, quais supplies alimentam cada domínio, quais estados de potência são permitidos, quais células especiais são necessárias e como proteger as interfaces entre domínios.

A aula começa com perguntas fundamentais:

```text
Alguma lógica pode rodar em tensão mais baixa?
Alguma lógica pode ser desligada quando não estiver em uso?
O estado dessa lógica precisa ser preservado durante shutdown?
Que proteção é necessária entre domínios diferentes?
```

Essas respostas formam o **power intent** do design.

O módulo cobre:

1. Conceito básico de power intent.
2. Por que designers RTL precisam de UPF.
3. Diferença entre functional intent e power intent.
4. Breve histórico do UPF e sua padronização como IEEE 1801.
5. Power domains.
6. Power supply network.
7. Power states.
8. Células especiais de low-power.
9. Level shifters.
10. Isolation cells.
11. Power switches / MTCMOS cells.
12. Retention registers.
13. Always-on logic.
14. Exemplo completo de UPF com domínio switchable.
15. Resumo dos conceitos que precisam ser dominados.

A mensagem central é: **um design moderno não tem apenas comportamento funcional; ele também tem comportamento de potência. O UPF captura esse comportamento de potência de forma separada e consistente ao longo do fluxo de verificação e implementação.**

---

## Slide 1 — Basic Concept of Power Intent

### Texto extraído

Título:

```text
Basic Concept of Power Intent
```

Texto principal:

```text
Starting with your functional design, what can you do to reduce power...
```

Perguntas:

```text
Can some logic run at lower voltage?
Can some logic be turned off when not in use?
  Does the state of that logic need to be preserved during shutdown?
What protection is required between these?
```

Caixa azul:

```text
A design's power behavior, its "multi-voltage architecture" is its power intent
```

### Interpretação

O slide define power intent a partir de perguntas práticas de baixo consumo.

Um design funcional já diz:

```text
o que o circuito faz
```

Mas power intent diz:

```text
como o circuito se comporta em termos de energia, tensão e shutdown
```

As perguntas do slide viram decisões de arquitetura:

#### 1. Alguma lógica pode rodar em tensão mais baixa?

Se sim, essa lógica pode ficar em um domínio de menor tensão. Isso reduz potência dinâmica, pois a potência dinâmica tem forte dependência da tensão.

Conceitualmente:

```text
menor VDD → menor potência dinâmica
```

Mas isso pode exigir level shifters quando sinais cruzam para domínios de tensão diferente.

#### 2. Alguma lógica pode ser desligada quando não estiver em uso?

Se sim, o design pode usar power gating. Um bloco pode ser colocado em modo sleep/shutdown.

Isso reduz leakage power, mas cria novos problemas:

```text
saídas do bloco desligado podem virar X
interfaces precisam ser protegidas
talvez o estado interno precise ser salvo
```

#### 3. O estado precisa ser preservado durante shutdown?

Se o bloco deve voltar depois com o mesmo estado, são necessários retention registers.

Se o estado pode ser perdido, a lógica pode reinicializar depois.

#### 4. Que proteção é necessária entre domínios?

Quando um domínio está desligado ou em outra tensão, sinais cruzando fronteiras precisam de proteção:

- level shifters;
- isolation cells;
- always-on control paths;
- retention;
- power switches.

### Ideia central

```text
Power intent = comportamento de potência + arquitetura multi-voltage do design
```

---

## Slide 2 — RTL Designers Need Power Intent

### Texto extraído

Título:

```text
RTL Designers Need Power Intent
```

Pontos principais:

```text
Designs have both a functional and a power behavior
```

Subitens:

```text
RTL and design constraints are not sufficient for describing power behavior
Need constructs for capturing operating voltage differences, shutdown, isolation, retention, etc.
```

Segundo bloco:

```text
UPF is an extension to RTL functional specification
```

Subitens:

```text
Provides consistent interpretation of power behavior throughout flow
Enables automation during verification and implementation
Minimizes design failure risk
```

Figura:

```text
Functional Behavior (RTL)
Power Behavior (UPF)
```

### Interpretação

Este slide explica por que o UPF existe.

RTL descreve comportamento funcional. Mas ele não descreve completamente:

- tensão de operação;
- domínios que desligam;
- quais supplies alimentam cada bloco;
- quais sinais controlam shutdown;
- quais células de isolamento são necessárias;
- quais registradores precisam retenção;
- quais sinais precisam level shifting.

Mesmo constraints tradicionais de síntese/STA não bastam para isso. Constraints descrevem clocks, delays, false paths, loads, timing etc., mas não capturam toda a intenção de potência.

Por isso o UPF aparece como uma extensão da especificação funcional:

```text
RTL + UPF = especificação funcional + especificação de potência
```

### Benefícios do UPF

#### 1. Interpretação consistente

O mesmo power intent pode ser usado por:

- simuladores;
- ferramentas de síntese;
- ferramentas de implementação física;
- verificação formal;
- checagens de low-power;
- signoff.

#### 2. Automação

A ferramenta pode inserir automaticamente:

- isolation cells;
- level shifters;
- retention registers;
- power switches;
- always-on buffers.

#### 3. Redução de risco

Sem UPF, cada etapa poderia interpretar power behavior de forma diferente, aumentando risco de erro de implementação.

---

## Slide 3 — Functional Intent vs. Power Intent

### Texto extraído

Título:

```text
Functional Intent vs. Power Intent
```

Tabela da esquerda:

```text
Functional intent specifies
```

Itens:

```text
Architecture
  Design hierarchy
  Data path
  Custom blocks

Application
  State machines
  Combinatorial logic
  I/Os
  ex: CPU, DSP, Cache

Usage of IP
  Industry-standard interfaces
  Memories
  Etc.
```

Rodapé:

```text
Captured in RTL
```

Tabela da direita:

```text
Power intent specifies
```

Itens:

```text
Power distribution architecture
  Power domains
  Supply rails
  Shutdown control

Power strategy
  Power state tables
  Operating voltages

Usage of special cells
  Isolation cells
  Level shifters
  Power switches
  Retention registers
```

Rodapé:

```text
Captured in UPF
```

### Interpretação

Este slide é uma divisão muito importante.

#### Functional intent — capturado em RTL

O RTL descreve:

- arquitetura lógica;
- hierarquia de módulos;
- datapath;
- state machines;
- lógica combinacional;
- I/Os;
- IPs;
- memórias;
- interfaces.

Exemplo:

```text
um CPU executa instruções
um DSP processa sinais
uma cache armazena dados
```

#### Power intent — capturado em UPF

O UPF descreve:

- quais são os power domains;
- quais supplies alimentam cada domínio;
- quais domínios podem desligar;
- quais tensões são usadas;
- quais estados de potência são permitidos;
- onde inserir células especiais.

Exemplo:

```text
PD_CPU roda em 0.9 V e pode desligar em standby
PD_AON fica sempre ligado
sinais de PD_CPU para PD_AON precisam isolation
sinais de 0.8 V para 1.2 V precisam level shifter
```

### Regra mental

```text
RTL responde: o que o design faz?
UPF responde: como o design é alimentado, desligado, protegido e preservado?
```

---

## Slide 4 — UPF: A Brief History

### Texto extraído

Título:

```text
UPF - A Brief History
```

Pontos:

```text
UPF is a power intent format co-developed by EDA vendors and their users
```

Subitem:

```text
Open standard, allows interoperability amongst vendors
```

Histórico:

```text
Version 1.0 was published as an Accellera specification in 2007
```

Subitem:

```text
Accellera donated UPF to IEEE
```

```text
IEEE 1801 specification (also referred to as UPF2.0) was published in 2009
```

Subitem:

```text
Widely adopted as the industry standard power intent format
```

Revisões:

```text
Officially named IEEE 1801-2013, also known as UPF2.1, approved in 2013
Officially named IEEE 1801-2015, also known as UPF3.0, approved in 2015
Officially named IEEE 1801-2018, also known as UPF3.1, approved in 2018
```

### Interpretação

UPF nasceu como uma especificação aberta desenvolvida por fornecedores de EDA e usuários. Isso é importante porque power intent precisa atravessar várias ferramentas e etapas do fluxo.

A evolução:

| Ano | Versão |
|---|---|
| 2007 | UPF 1.0, Accellera |
| 2009 | IEEE 1801 / UPF 2.0 |
| 2013 | IEEE 1801-2013 / UPF 2.1 |
| 2015 | IEEE 1801-2015 / UPF 3.0 |
| 2018 | IEEE 1801-2018 / UPF 3.1 |

### Ponto de prova

```text
UPF é o formato de power intent padronizado pela IEEE 1801.
```

---

## Slide 5 — UPF Terminology: Power Domain

### Texto extraído

Título:

```text
UPF Terminology: Power Domain
```

Definição:

```text
Power domain is a logic partition with common power characteristics:
```

Subitens:

```text
Power net voltage requirements
Power switching style and power down control signal(s), if any
Power supply network (i.e., same power mesh)
```

Outro ponto:

```text
Power domain is primary object upon which power intent specification is defined
```

Comando UPF:

```tcl
create_power_domain
```

Figura:

```text
Power Domain 1 (PD1)
Top-level Power Domain (PD_Top)
Power Domain 2 (PD2)
```

Supplies:

```text
VDD1 / VSS1
VDD / VSS
VDD2 / VSS2
```

### Interpretação

Power domain é o conceito mais básico do UPF.

Um power domain agrupa lógica que compartilha características de potência:

- mesma tensão;
- mesma supply;
- mesmo estilo de power switching;
- mesmos sinais de controle de shutdown;
- mesma rede de alimentação ou power mesh.

O slide mostra um domínio top-level e dois domínios internos:

```text
PD_Top
PD1
PD2
```

Cada domínio pode ter suas próprias supplies:

```text
PD1 → VDD1/VSS1
PD2 → VDD2/VSS2
PD_Top → VDD/VSS
```

### Comando central

```tcl
create_power_domain
```

Esse comando cria o objeto lógico que representa o domínio de potência.

### Ponto importante

O power domain não é necessariamente uma região física imediatamente. Ele é, primeiro, uma **partição lógica com propriedades de potência**. Mais tarde, no fluxo físico, esse domínio pode ser associado a voltage areas, power mesh, switches e outras estruturas físicas.

---

## Slide 6 — UPF Terminology: Power Supply Network

### Texto extraído

Título:

```text
UPF Terminology: Power Supply Network
```

Itens:

```text
Supply nets
  Logical representations of power and ground supplies
  Can be primary or secondary
```

```text
Supply ports
  Enable connectivity of supply nets at one level of hierarchy or scope to another level
```

```text
Domain supply nets
  Specific supply nets defined to be primary (default) power and ground supplies for a particular domain
```

```text
Power switches
  Representation of the input supply, virtual supply, and control signals used for providing a switchable supply to a power domain
```

Nota:

```text
All of these are logical objects, described in the UPF
```

Figura:

```text
SupplyPort1
SupplyNet1
SupplyPort2
SupplyNet2
SupplyPort3
SupplyNet3
power switch
VirtualSupply
sleep
```

### Interpretação

A power supply network no UPF é uma rede lógica que representa a alimentação do design.

#### Supply net

Representa uma supply de power ou ground, como:

```text
VDD
VSS
VDDL
VDDH
```

Pode ser:

- primary;
- secondary;
- backup;
- virtual.

#### Supply port

Permite conectar supply nets entre níveis de hierarquia ou escopos.

Pense como portas de alimentação entre módulos/níveis:

```text
supply do top → supply do sub-bloco
```

#### Domain supply nets

São as supplies principais/default de um domínio. Exemplo:

```text
PD_SW usa VDD_SW como power e VSS como ground
```

#### Power switch

Representa a relação entre:

- input supply;
- virtual supply;
- control signal;
- domínio alimentado.

Exemplo:

```text
VDD real entra no switch
virtual_VDD sai do switch
sleep controla ON/OFF
```

### Ponto essencial

O slide destaca que tudo isso são **objetos lógicos descritos no UPF**. O UPF não desenha metal físico diretamente nesse ponto; ele descreve intenção e conectividade lógica de supplies.

---

## Slide 7 — UPF Terminology: Power States

### Texto extraído

Título:

```text
UPF Terminology: Power States
```

Texto:

```text
Each power supply can be defined to run at one or more voltage levels. For example:
```

Tabela:

```text
High performance mode | Operating at high voltage (1.2V)
Power saving mode     | Operating at lower voltage (0.9V)
Inactive              | Supply at standby level or completely disconnected (0V)
```

Outros pontos:

```text
Each combination of supply values for a design is a possible "power state"
```

```text
UPF uses power state group states (akin to UPF1.0 PST state) to define the allowed combinations of operational power states for that design
```

### Interpretação

Um power state descreve o estado de alimentação do design.

Uma supply pode estar em:

- tensão alta;
- tensão baixa;
- standby;
- desligada.

Exemplo:

| Estado | Significado |
|---|---|
| High performance | supply em 1.2 V |
| Power saving | supply em 0.9 V |
| Inactive | standby ou 0 V |

O estado global do design é a combinação dos valores de suas supplies.

Exemplo:

```text
TOP = 0.9 V
PD_SW = OFF
PD_AON = 0.9 V
```

Essa combinação é um power state.

UPF define quais combinações são permitidas. Isso é essencial porque nem toda combinação física de supplies é operacionalmente válida.

### Relação com PST

O slide cita que UPF usa power state group states, semelhante ao conceito de PST state do UPF 1.0.

PST significa:

```text
Power State Table
```

A ideia é listar combinações permitidas de estados de supply.

---

## Slide 8 — LP Techniques Require Special Cells

### Texto extraído

Título:

```text
LP Techniques Require Special Cells
```

Bloco superior:

```text
To protect interfaces between power domains:
```

Células mostradas:

```text
Level Shifter
Isolation Cell
```

Bloco inferior:

```text
To implement new power behavior:
```

Células mostradas:

```text
Retention Register
Power Switch
Always-On Buffer
```

### Interpretação

LP significa:

```text
Low Power
```

Técnicas de baixo consumo exigem células especiais porque o circuito CMOS comum não resolve automaticamente problemas de múltiplas tensões e shutdown.

#### Para proteger interfaces

Quando sinais cruzam domínios:

- de 0.8 V para 1.2 V;
- de domínio desligado para domínio ativo;
- de domínio switchable para always-on;

são necessárias células especiais:

```text
Level shifters
Isolation cells
```

#### Para implementar novo comportamento de potência

Quando o domínio pode desligar ou preservar estado:

```text
Retention registers
Power switches
Always-on buffers
```

### Mapa mental

| Problema | Célula especial |
|---|---|
| Cruzar tensão diferente | Level shifter |
| Domínio desligado dirigindo domínio ativo | Isolation cell |
| Desligar supply de um bloco | Power switch |
| Preservar estado durante shutdown | Retention register |
| Manter controle ativo dentro/através de bloco desligado | Always-on buffer/logic |

---

## Slide 9 — Level Shifters

### Texto extraído

Título:

```text
Level Shifters
```

Pontos:

```text
Directly connecting two power domains at different voltage levels can cause design issues
```

Subitens:

```text
Timing not properly characterized
Signals not propagated
```

Outro ponto:

```text
Level shifter transforms input voltage level to match output voltage
```

Subitens:

```text
Buffer-type level shifter
Enable level shifters
```

Comandos UPF:

```tcl
set_level_shifter
map_level_shifter_cell
use_interface_cell
```

Figuras:

```text
high-to-low
low-to-high
1V → LS → 2V
```

### Interpretação

Level shifter é usado quando um sinal cruza entre domínios de tensões diferentes.

#### Problema sem level shifter

Se um sinal sai de 1.0 V e entra em uma célula alimentada por 2.0 V, o nível lógico alto pode não ser reconhecido corretamente. Além disso, o timing pode não estar caracterizado para essa conexão direta.

Possíveis problemas:

- sinal não propaga corretamente;
- margem de ruído insuficiente;
- timing inválido;
- consumo anormal;
- comportamento lógico incorreto.

#### Função do level shifter

O level shifter converte a amplitude do sinal:

```text
domínio de baixa tensão → domínio de alta tensão
domínio de alta tensão → domínio de baixa tensão
```

Tipos citados:

- buffer-type level shifter;
- enable level shifters.

### Comandos UPF

```tcl
set_level_shifter
map_level_shifter_cell
use_interface_cell
```

Interpretação dos comandos:

- `set_level_shifter`: define a estratégia de level shifting.
- `map_level_shifter_cell`: mapeia a estratégia para células reais de biblioteca.
- `use_interface_cell`: usa célula de interface, geralmente em flows mais modernos para representar células em fronteiras de domínio.

---

## Slide 10 — Isolation Cells

### Texto extraído

Título:

```text
Isolation Cells
```

Pontos:

```text
Connecting shut down logic and active logic can cause design issues
```

Subitens:

```text
Spurious signal propagation
Crowbar current
```

Outro ponto:

```text
Isolation cell protects logic
```

Subitens:

```text
Drives known value to powered on logic
Prevents leakage paths through powered down logic
```

Comandos UPF:

```tcl
set_isolation
map_isolation_cell
use_interface_cell
```

Figura:

```text
OFF domain → X → ISO → Active Logic
```

Controle:

```text
EN
```

### Interpretação

Isolation cells protegem domínios ativos de sinais vindos de domínios desligados.

Quando um domínio está OFF, suas saídas podem ficar:

```text
X
flutuantes
indeterminadas
parcialmente alimentadas
```

Se esses sinais chegam a lógica ativa, podem causar:

- propagação de valores espúrios;
- `X` na simulação/verificação;
- crowbar current;
- leakage paths;
- comportamento lógico incorreto.

A isolation cell força um valor conhecido para o domínio ativo:

```text
clamp 0
clamp 1
latch/hold, dependendo da estratégia
```

### Comandos UPF

```tcl
set_isolation
map_isolation_cell
use_interface_cell
```

- `set_isolation`: define a estratégia de isolamento.
- `map_isolation_cell`: escolhe célula física de isolamento.
- `use_interface_cell`: permite usar células de interface apropriadas na fronteira.

### Ponto importante

Isolation precisa ser ativada antes ou durante o power-down do domínio de origem. Se for ativada tarde, o `X` pode escapar.

---

## Slide 11 — Power Switches (MTCMOS Cells)

### Texto extraído

Título:

```text
Power Switches (MTCMOS Cells)
```

Pontos:

```text
Even when not switching, CMOS cells consume leakage power
```

```text
Save leakage power by turning off design partitions when the logic is inactive
```

```text
Power switches are added between the main supply and the "virtual" supply to be shutdown
```

Subitem:

```text
Virtual supply connected to standard cell supply rails
```

Comandos UPF:

```tcl
create_power_switch
map_power_switch
```

Figura:

```text
VDD (1.0V)
power switch
virtual_VDD
Power Down Module
Shutdown Logic
sleep
```

Forma de onda:

```text
sleep sobe → virtual_VDD cai de 1.0V para 0.0V
sleep desce → virtual_VDD volta para 1.0V
```

### Interpretação

Mesmo parado, um circuito CMOS consome leakage. Para reduzir leakage, pode-se desligar fisicamente a supply de uma partição quando ela está inativa.

O power switch fica entre:

```text
supply principal VDD
e
supply virtual do domínio
```

Quando o switch está ON:

```text
virtual_VDD ≈ VDD
domínio funciona
```

Quando o switch está OFF:

```text
virtual_VDD ≈ 0 V ou standby
domínio desligado
leakage reduzida
```

### MTCMOS

MTCMOS significa:

```text
Multi-Threshold CMOS
```

Em geral, switches usam transistores adequados para controlar leakage/power gating.

### Comandos UPF

```tcl
create_power_switch
map_power_switch
```

- `create_power_switch`: cria o objeto lógico do power switch no UPF.
- `map_power_switch`: mapeia para célula física de biblioteca.

---

## Slide 12 — Retention Registers

### Texto extraído

Título:

```text
Retention Registers
```

Pontos:

```text
States of some sequential elements in shutdown logic may need to be preserved
```

```text
These hold internal state when primary power supply is off
```

Subitem:

```text
Also referred to as "state retention cells"
```

Outro ponto:

```text
Designed to minimize leakage current in standby/sleep mode
```

Subitem:

```text
Without affecting performance during normal operation
```

Comandos UPF:

```tcl
set_retention
map_retention_cell
```

Figura:

```text
VDD
VDD_BACKUP
save
restore
RR
Shut Down
```

### Interpretação

Quando um domínio é desligado, os flip-flops comuns perdem o estado. Mas alguns estados precisam sobreviver ao shutdown.

Exemplo:

```text
configuração de modo
estado de controle
contexto mínimo para retorno rápido
```

Retention registers resolvem isso. Eles têm uma alimentação de backup:

```text
VDD_BACKUP
```

e sinais de controle:

```text
save
restore
```

Funcionamento conceitual:

1. Antes de desligar o domínio:
   - `save` captura o estado em uma parte retentiva.
2. Durante shutdown:
   - alimentação principal desliga;
   - backup mantém estado com baixa leakage.
3. Ao religar:
   - `restore` recupera o estado.

### Comandos UPF

```tcl
set_retention
map_retention_cell
```

- `set_retention`: define quais elementos precisam retenção e qual estratégia usar.
- `map_retention_cell`: mapeia para célula real de biblioteca.

---

## Slide 13 — Always-On (AO) Logic

### Texto extraído

Título:

```text
Always-On (AO) Logic
```

Pontos:

```text
Some logic needs to stay active during shutdown
```

Subitens:

```text
Path to enable pins of ISO/ELS
Power switches
Retention registers
Feedthrough paths
```

Outro ponto:

```text
Always-on logic remains powered within shutdown block
```

Subitens:

```text
Single-rail AO cells
Dual-rail AO cells
```

Figuras:

```text
Shut Down block
AO buffer
sleep signal path
Always On region
```

### Interpretação

Always-on logic é lógica que precisa permanecer ligada mesmo quando o bloco principal está desligado.

Exemplos do slide:

#### 1. Caminhos para enable pins de ISO/ELS

Isolation cells e enable level shifters precisam de controles ativos quando o domínio principal está desligando ou desligado. Esses controles não podem depender de lógica que também desligou.

#### 2. Power switches

O controle do power switch precisa existir enquanto o domínio é ligado/desligado.

#### 3. Retention registers

Sinais `save` e `restore`, ou partes da célula de retenção, podem precisar de alimentação always-on.

#### 4. Feedthrough paths

Alguns sinais precisam atravessar um bloco desligado sem perder conectividade, usando lógica always-on.

### Tipos de AO cells

- **Single-rail AO cells:** alimentadas por uma supply always-on.
- **Dual-rail AO cells:** possuem rails para o domínio normal e para always-on/backup, dependendo da arquitetura.

### Ideia central

```text
Nem tudo dentro de um domínio desligável pode desligar.
A lógica que controla o desligamento/isolamento/retenção precisa ficar viva.
```

---

## Slide 14 — UPF Example

### Texto extraído

Título:

```text
UPF Example
```

Pontos:

```text
Implementing multi-voltage and power gating
```

```text
Define two power domains
  Top-level and PD_SW
```

```text
Define supply network
  Supply ports (top-level)
  Supply nets (for TOP and PD_SW)
  Connect ports and nets
```

```text
Create UPF objects for PD_SW power domain:
  Power switches
  Isolation cells
  Retention registers
  Level shifters
```

Figura:

```text
TOP
PD_SW
pd_switchable
0.9V / OFF
VDD
VDDL
VSS
VDDLS1
pd1_sw
RR
LSL-H
LS-HL
sleep
save
restore
pd_iso
```

### Interpretação

O exemplo mostra um design com dois domínios:

```text
TOP
PD_SW
```

O domínio `PD_SW` é switchable, ou seja, pode operar em 0.9 V ou ficar OFF.

O UPF precisa definir:

#### 1. Domínios

```text
TOP
PD_SW
```

#### 2. Supply network

- supply ports do top;
- supply nets do top e do domínio switchable;
- conexão entre ports e nets.

#### 3. Power switch

O switch controla a supply virtual do domínio `PD_SW`.

#### 4. Isolation

Quando `PD_SW` está OFF, suas saídas precisam ser isoladas para proteger lógica ativa.

#### 5. Retention

Um retention register (`RR`) preserva estado quando o domínio desliga.

#### 6. Level shifters

Sinais que cruzam tensões diferentes precisam de level shifting, como:

```text
LSL-H
LS-HL
```

### Importância

Esse slide conecta todos os conceitos anteriores em um exemplo realista de multi-voltage + power gating.

---

## Slide 15 — UPF Example

### Texto extraído

Título:

```text
UPF Example
```

Pontos:

```text
Implementing multi-voltage and power gating
```

```text
Define two power domains
  Top-level and Switchable
```

```text
Define supply network
  Supply sets
```

```text
Create UPF objects for Switchable power domain:
  Power switches
  Isolation cells
  Retention registers
  Level shifters
```

Figura:

```text
TOP (0.9V)
ss_TOP
ss_TOP_LOW
switchable (0.9V / OFF)
ss_P2
ss_RET
ss_ISO
p2_sd
p2_isolation
save
restore
RR
ISO
```

### Interpretação

Este segundo exemplo mostra uma versão mais moderna/abstrata usando **supply sets**.

Em vez de falar apenas em nets individuais, o design usa conjuntos de supply:

```text
ss_TOP
ss_TOP_LOW
ss_P2
ss_RET
ss_ISO
```

Um supply set agrupa supplies de power/ground e facilita associar um domínio ou célula especial a um conjunto de alimentação.

O domínio switchable tem:

- supply set normal;
- retention supply set;
- isolation supply set;
- power switch;
- isolation;
- retention;
- level shifters.

### Observação importante

Esse exemplo mostra que, em designs UPF modernos, muitos objetos são associados por supply sets. Isso melhora organização e torna o power intent mais modular.

---

## Slide 16 — UPF: What Concepts Do You Need to Learn?

### Texto extraído

Título:

```text
UPF: What Concepts Do You Need to Learn?
```

Itens:

```text
Power domains
```

Figura:

```text
PD1
PDTOP
PD2
VDD1/VSS1
VDD/VSS
VDD2/VSS2
```

Itens:

```text
Power management cells:
  Level shifters
  Isolation cells
  Retention registers
```

Itens:

```text
Supply network
```

Figuras:

```text
Level Shifter
Isolation
Retention Register
Power Switch / Virtual Supply
```

### Interpretação

O slide final resume os pilares do curso.

Para aprender UPF, é necessário dominar três grandes grupos:

#### 1. Power domains

Saber como particionar o design por características de potência:

```text
quem fica sempre ligado
quem pode desligar
quem opera em tensão diferente
```

#### 2. Power management cells

Saber por que e onde usar:

- level shifters;
- isolation cells;
- retention registers;
- power switches;
- always-on buffers.

#### 3. Supply network

Saber modelar:

- supply nets;
- supply ports;
- supply sets;
- primary/secondary supplies;
- virtual supplies;
- switches;
- conexões entre níveis hierárquicos.

### Mapa final

```text
UPF = power domains + supply network + power states + special cells + strategies
```

---

## Aula didática desenvolvida

### 1. O que é power intent?

Power intent é a descrição formal do comportamento de potência de um design.

Ele responde perguntas que o RTL não responde:

```text
Quais blocos estão em quais domínios de potência?
Quais tensões cada domínio usa?
Quais domínios podem desligar?
Como esses domínios são alimentados?
Quais combinações de power states são válidas?
Como proteger sinais entre domínios?
Quais registradores devem reter estado?
Qual lógica precisa permanecer always-on?
```

### 2. Por que UPF é separado do RTL?

Porque power intent não é apenas função lógica.

Exemplo:

```verilog
assign out = a & b;
```

O RTL não diz se `a` vem de um domínio desligável, se `b` vem de um domínio de outra tensão, ou se `out` precisa ser isolado quando o bloco desliga.

Essas informações pertencem ao UPF.

### 3. Power domain é o ponto de partida

O comando:

```tcl
create_power_domain
```

cria a partição lógica de potência.

Tudo depois depende dos domínios:

- supplies;
- power states;
- isolation;
- retention;
- level shifting;
- switches;
- always-on logic.

### 4. Supply network é lógica no UPF, não metal físico diretamente

O slide enfatiza:

```text
All of these are logical objects, described in the UPF
```

Isso evita confusão. Supply net no UPF não é ainda o strap físico de metal. É uma representação lógica de alimentação.

Depois, no fluxo físico, isso será implementado por power grid, rails, straps, vias, switches físicos etc.

### 5. Power states organizam os modos de operação

Cada supply pode assumir diferentes valores:

```text
1.2 V
0.9 V
0 V
standby
```

As combinações válidas formam power states.

Isso é essencial porque células especiais dependem do estado:

- se o domínio está OFF, isolation deve estar ativa;
- se vai desligar, retention deve salvar antes;
- se domínio de tensão muda, level shifting pode ser necessário.

### 6. Células especiais resolvem problemas físicos e lógicos de low power

Cada célula existe por um problema específico:

| Problema | Solução |
|---|---|
| Sinal cruza tensões diferentes | Level shifter |
| Domínio desligado manda X para domínio ativo | Isolation cell |
| Domínio precisa desligar supply | Power switch |
| Estado precisa sobreviver shutdown | Retention register |
| Controle precisa ficar vivo durante shutdown | Always-on logic |

### 7. Level shifter não é opcional quando níveis de tensão não são compatíveis

Conectar diretamente 0.8 V a 1.2 V pode causar:

- sinal não reconhecido;
- timing inválido;
- caracterização errada;
- consumo indevido.

O level shifter converte o nível.

### 8. Isolation cell é proteção contra o domínio desligado

Quando um bloco está OFF, sua saída pode ser `X`. A isolation cell força valor conhecido para o domínio ativo.

Essa célula é crítica para evitar:

```text
spurious propagation
crowbar current
leakage paths
```

### 9. Power switch cria a supply virtual

O domínio desligável não é alimentado diretamente por VDD. Ele é alimentado por uma supply virtual controlada por switch.

```text
VDD → power switch → virtual_VDD → domínio
```

Quando `sleep` ativa, `virtual_VDD` cai, desligando o domínio.

### 10. Retention register salva o estado mínimo

Nem todo estado precisa ser preservado. Mas o que precisa sobreviver ao shutdown deve usar retention.

Isso evita ter que reinicializar tudo ao religar o domínio.

### 11. Always-on logic é necessária para controlar o desligamento

Se a lógica que controla isolation, retention e power switch também desligasse, o sistema ficaria sem controle.

Por isso, partes do bloco desligável podem conter lógica always-on.

### 12. O exemplo final junta tudo

O exemplo com `PD_SW`/`Switchable` mostra o fluxo de pensamento:

```text
1. definir domínios
2. definir supply network
3. criar power switch
4. definir isolation
5. definir retention
6. inserir level shifters
```

Esse é o esqueleto de um UPF real.

---

## Conceitos difíceis explicados em profundidade

### UPF

Unified Power Format. Formato padronizado para capturar power intent de um design.

---

### Power intent

Descrição do comportamento de potência do design: domínios, supplies, states, shutdown, retention, isolation, level shifting e special cells.

---

### Power domain

Partição lógica com características comuns de potência.

---

### Supply net

Objeto lógico que representa uma supply de power ou ground.

---

### Supply port

Objeto que permite conectar supply nets através de escopos/hierarquias.

---

### Domain supply net

Supply principal/default associada a um domínio.

---

### Supply set

Conjunto de supplies associado a um domínio ou célula/estratégia. Normalmente agrupa power e ground.

---

### Virtual supply

Supply que alimenta um domínio depois de passar por um power switch. Pode ser desligada.

---

### Power state

Combinação de valores de supplies que representa um modo operacional de potência.

---

### Level shifter

Célula que converte nível de tensão de um sinal entre domínios.

---

### Isolation cell

Célula que força valor conhecido quando um domínio desligado se comunica com domínio ativo.

---

### Power switch

Célula/transistor que conecta ou desconecta a supply principal da supply virtual de um domínio.

---

### Retention register

Registrador capaz de preservar estado durante shutdown usando supply de backup.

---

### Always-on logic

Lógica que permanece alimentada durante shutdown para controlar switches, isolation, retention ou feedthrough paths.

---

### MTCMOS

Multi-Threshold CMOS. Técnica/células usadas em power switching para reduzir leakage.

---

## Comandos UPF citados no módulo

### Power domains

```tcl
create_power_domain
```

### Level shifters

```tcl
set_level_shifter
map_level_shifter_cell
use_interface_cell
```

### Isolation

```tcl
set_isolation
map_isolation_cell
use_interface_cell
```

### Power switches

```tcl
create_power_switch
map_power_switch
```

### Retention

```tcl
set_retention
map_retention_cell
```

---

## Tabela de células especiais

| Célula | Problema que resolve | Comandos UPF citados |
|---|---|---|
| Level shifter | Cruzamento entre tensões diferentes | `set_level_shifter`, `map_level_shifter_cell`, `use_interface_cell` |
| Isolation cell | Domínio OFF enviando X/ruído para domínio ativo | `set_isolation`, `map_isolation_cell`, `use_interface_cell` |
| Power switch | Desligar supply de partição inativa | `create_power_switch`, `map_power_switch` |
| Retention register | Preservar estado durante shutdown | `set_retention`, `map_retention_cell` |
| Always-on logic | Manter controle ativo durante shutdown | associada a supplies/células AO |

---

## Tabela de conceitos UPF

| Conceito | Função |
|---|---|
| Power domain | Agrupa lógica por comportamento de potência |
| Supply net | Representa supply/ground logicamente |
| Supply port | Conecta supplies entre hierarquias |
| Domain supply net | Define supply primária/default de um domínio |
| Power switch | Cria supply virtual desligável |
| Power state | Define combinação de valores de supplies |
| Supply set | Agrupa supplies para domínio/estratégia |
| Isolation | Protege lógica ativa contra domínio desligado |
| Retention | Preserva estado durante power-down |
| Level shifting | Ajusta nível de tensão entre domínios |
| Always-on | Mantém controle ativo em shutdown |

---

## Fluxo mental para criar power intent

```text
1. Particionar o design em power domains.
2. Definir quais domains são always-on e quais são switchable.
3. Definir supply nets, supply ports e supply sets.
4. Definir power states permitidos.
5. Inserir power switches para domínios desligáveis.
6. Inserir isolation nas saídas de domínios que podem desligar.
7. Inserir level shifters entre domínios de tensões diferentes.
8. Definir retention para registradores cujo estado precisa ser preservado.
9. Garantir always-on logic para controles de switch/isolation/retention.
10. Validar se as combinações de estados são seguras e implementáveis.
```

---

## Figuras e diagramas importantes

### Página 1 — Basic Concept of Power Intent

A figura mostra blocos em uma planta/arquitetura e ilustra a pergunta central: quais partes podem operar em tensão menor, desligar ou precisar proteção.

---

### Página 1 — RTL Designers Need Power Intent

O diagrama em formato de círculo dividido mostra que o design possui duas metades complementares:

```text
Functional Behavior (RTL)
Power Behavior (UPF)
```

---

### Página 2 — Functional Intent vs. Power Intent

A tabela divide claramente o que pertence ao RTL e o que pertence ao UPF. É uma figura essencial para questões conceituais.

---

### Página 3 — Power Domain

A figura mostra um domínio top-level e dois power domains internos, cada um com suas supplies. Ela representa a ideia de que power domains são partições lógicas alimentadas por supplies próprias.

---

### Página 3 — Power Supply Network

A figura mostra supply ports, supply nets, power switch e virtual supply. É o primeiro diagrama importante para entender supply network.

---

### Página 4 — Power States

A tabela mostra três estados: high performance, power saving e inactive, associando cada estado a tensões como 1.2 V, 0.9 V e 0 V.

---

### Página 4 — LP Techniques Require Special Cells

A figura resume as células especiais de low-power: level shifter, isolation cell, retention register, power switch e always-on buffer.

---

### Página 5 — Level Shifters

As figuras mostram transição high-to-low e low-to-high, com level shifter entre domínios de 1 V e 2 V.

---

### Página 5 — Isolation Cells

O diagrama mostra um domínio OFF produzindo `X` e uma célula ISO protegendo a lógica ativa.

---

### Página 6 — Power Switches

A forma de onda mostra `sleep` controlando a queda de `virtual_VDD` de 1.0 V para 0 V.

---

### Página 6 — Retention Registers

O diagrama mostra VDD_BACKUP, sinais `save` e `restore` e o retention register dentro de um bloco shutdown.

---

### Página 7 — Always-On Logic

As figuras mostram caminhos AO dentro de um shutdown block e uma região always-on alimentando buffers/controles.

---

### Páginas 7 e 8 — UPF Example

Os exemplos mostram domínio TOP, domínio switchable, supply sets, power switch, retention, isolation e level shifters.

---

### Página 8 — What Concepts Do You Need to Learn?

A figura final conecta power domains, level shifter, isolation, retention register e supply network como os pilares do curso.

---

## Pontos de prova e revisão

1. Designs têm comportamento funcional e comportamento de potência.
2. RTL captura comportamento funcional.
3. UPF captura comportamento de potência.
4. RTL e constraints não são suficientes para descrever power behavior.
5. UPF fornece interpretação consistente do power behavior ao longo do fluxo.
6. UPF permite automação em verificação e implementação.
7. UPF reduz risco de falhas de design.
8. Functional intent especifica arquitetura, aplicação e uso de IP.
9. Power intent especifica power distribution architecture, power strategy e special cells.
10. Functional intent é capturado em RTL.
11. Power intent é capturado em UPF.
12. UPF foi publicado como Accellera 1.0 em 2007.
13. UPF foi doado pela Accellera para IEEE.
14. IEEE 1801/UPF 2.0 foi publicado em 2009.
15. IEEE 1801-2018 também é conhecido como UPF 3.1.
16. Power domain é partição lógica com características comuns de potência.
17. Power domain pode ter requisitos de voltage, switching style e supply network.
18. O comando para criar power domain é `create_power_domain`.
19. Supply nets são representações lógicas de power e ground.
20. Supply ports conectam supply nets entre níveis de hierarquia.
21. Domain supply nets são supplies primárias/default de um domínio.
22. Power switches representam input supply, virtual supply e control signals.
23. Objetos da supply network no UPF são objetos lógicos.
24. Cada supply pode operar em um ou mais níveis de tensão.
25. High performance mode pode operar em tensão alta.
26. Power saving mode pode operar em tensão mais baixa.
27. Inactive pode representar standby ou 0 V.
28. Power state é combinação de valores de supplies.
29. UPF define combinações permitidas de operational power states.
30. Low-power techniques exigem special cells.
31. Level shifter protege interface entre tensões diferentes.
32. Isolation cell protege lógica ativa contra domínio desligado.
33. Retention register preserva estado durante shutdown.
34. Power switch permite desligar a supply de uma partição.
35. Always-on buffer/logic mantém controle ativo durante shutdown.
36. Conectar domínios de tensão diferente diretamente pode causar problemas.
37. Level shifter transforma input voltage level para output voltage adequado.
38. Comandos de level shifter incluem `set_level_shifter`, `map_level_shifter_cell`, `use_interface_cell`.
39. Conectar lógica desligada com lógica ativa pode causar spurious signal propagation.
40. Conectar lógica desligada com lógica ativa pode causar crowbar current.
41. Isolation cell dirige valor conhecido para lógica ligada.
42. Isolation cell previne leakage paths através de lógica desligada.
43. Comandos de isolation incluem `set_isolation`, `map_isolation_cell`, `use_interface_cell`.
44. CMOS consome leakage mesmo quando não está switching.
45. Power switches economizam leakage desligando partições inativas.
46. Power switch fica entre supply principal e virtual supply.
47. Comandos de power switch incluem `create_power_switch` e `map_power_switch`.
48. Retention registers também são chamados state retention cells.
49. Retention registers usam backup supply.
50. Comandos de retention incluem `set_retention` e `map_retention_cell`.
51. Always-on logic pode alimentar enable pins de ISO/ELS.
52. Always-on logic pode controlar power switches.
53. Always-on logic pode controlar retention registers.
54. Always-on logic pode implementar feedthrough paths.
55. AO logic pode usar single-rail ou dual-rail AO cells.
56. Um exemplo UPF típico define power domains, supply network e objetos de PM cells.
57. Um domínio switchable pode ter power switches, isolation, retention e level shifters.
58. Supply sets organizam supplies para domains e células especiais.
59. Conceitos essenciais de UPF: power domains, PM cells e supply network.
60. O power intent descreve a arquitetura multi-voltage do design.

---

## Relação com Fusion Compiler

No Fusion Compiler, UPF é usado para orientar a implementação física e lógica de baixo consumo.

A ferramenta pode usar o power intent para:

```text
1. reconhecer power domains;
2. associar supplies e supply sets;
3. inserir level shifters;
4. inserir isolation cells;
5. inserir retention registers;
6. criar/mapeiar power switches;
7. preservar always-on paths;
8. implementar multi-voltage e power gating;
9. validar power states e conectividade de supplies;
10. automatizar parte da implementação low-power.
```

Isso conecta diretamente com o curso anterior de Fusion Compiler Jumpstart, onde o UPF era carregado com:

```tcl
load_upf TOP.upf
commit_upf
```

---

## Checklist de qualidade

- [x] Bloco 078 processado conforme roteiro, slides 1-16.
- [x] Texto dos prints foi extraído e organizado.
- [x] Diagramas de power domain, supply network, power states e special cells foram interpretados.
- [x] Comandos UPF citados nos slides foram preservados.
- [x] O conteúdo foi expandido como acervo didático para estudo.
- [x] Pontos de prova e revisão foram listados.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 079
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 02 Module 02 — Power Domains
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\02 Module 02 - Power Domains.docx
```

- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\02 Module 02 - Power Domains.md
```

- **Observação:** conferir no roteiro/anexo a faixa exata de slides antes de processar.
