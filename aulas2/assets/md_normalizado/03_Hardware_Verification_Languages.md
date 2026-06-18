# 03 Hardware Verification Languages

## Controle do bloco

- **Bloco:** 025
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\03 Hardware Verification Languages.docx`
- **Faixa processada:** slides visíveis 1-19
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\03 Hardware Verification Languages.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O roteiro indica este bloco como `025 — 03 Hardware Verification Languages` e o próximo como `026 — 04 VCS and Verdi Debug Environment`.
- **Próximo bloco recomendado:** 026 — `04 VCS and Verdi Debug Environment`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco retoma vários conceitos já vistos em SystemVerilog/UVM, mas agora dentro da seção **Design Verification**, com foco em **linguagens de verificação**, **metodologias padronizadas**, **UVM**, **arquitetura de testbench**, **plano de verificação** e **automação**.

---

## Resumo executivo

Esta aula explica por que surgiram **Hardware Verification Languages** — HVLs — ou linguagens de verificação de hardware, e por que linguagens como Verilog e VHDL, embora sejam simuláveis, não são suficientes como linguagens de verificação modernas para designs complexos.

A ideia central é:

```text
HDL descreve hardware.
HVL ajuda a criar ambientes, estímulos, cenários, checkers e cobertura em nível mais alto.
```

Os slides começam afirmando que linguagens de verificação permitem desenvolver **testbenches** e **test scenarios** em alto nível de abstração. Isso aumenta produtividade porque:

```text
o testbench fica mais próximo do caso de uso real;
fica mais fácil automatizar testes;
fica mais fácil criar cenários randômicos;
fica mais fácil extrair métricas de cobertura;
fica mais fácil integrar modelos de alto nível;
fica mais fácil reutilizar componentes.
```

A aula explica que VHDL e Verilog foram criadas como **hardware description languages** — linguagens de descrição de hardware — e não como linguagens de verificação de alto nível. Por isso, historicamente surgiram linguagens e metodologias como:

```text
e / Specman
OpenVera
OVM
RVM
OVL
UVM
OS-VVM
```

O bloco enfatiza especialmente **UVM — Universal Verification Methodology**, apresentada como uma metodologia de verificação baseada em SystemVerilog, com componentes reutilizáveis, cobertura, estímulo randômico com constraints, checkers, scoreboards, sequencers, agents, environments, factory, config-db e phases.

O ponto mais importante da aula é:

```text
SystemVerilog fornece a linguagem e os recursos.
UVM fornece a metodologia, a biblioteca de classes e a arquitetura padronizada.
```

A aula também introduz uma arquitetura genérica de testbench UVM:

```text
test
env
agent
sequencer
driver
monitor
scoreboard
coverage
DUT
```

e fecha com dois temas práticos: **verification plan** e **test automation**.

O verification plan é tratado como documento tão importante quanto a especificação do design, contendo:

```text
definição de conclusão da verificação;
blocos críticos;
cenários obrigatórios;
features a estressar;
metas de cobertura;
estratégia de release;
simuladores e ambiente de debug;
setup do projeto;
estratégia de regressão.
```

A aula conclui que a automação reduz esforço manual em tarefas repetitivas, como regressões e geração de infraestrutura de testbench, podendo usar scripts em Tcl/Perl.

---

## Texto extraído e organizado por slide

### Slide 1 — Verification Languages

O slide explica por que linguagens de verificação são importantes.

Texto principal:

```text
Verification languages enable developing test benches and test scenarios
at a high level of system abstraction.
```

Tradução:

```text
Linguagens de verificação permitem desenvolver testbenches e cenários de teste
em um alto nível de abstração de sistema.
```

Pontos listados:

```text
Higher the level of abstractions, easier the verification.
There is no need for the specialized skill of design modelling and constructs.

Best way to increase verification productivity is to raise the level of abstraction
used to perform a task.
```

Interpretação:

A ideia é que quanto mais alto o nível de abstração, mais próximo o teste fica da intenção funcional do sistema. Em vez de manipular manualmente cada fio e cada transição, o engenheiro trabalha com transações, pacotes, cenários e objetos.

Exemplo:

```text
baixo nível:
  force req=1, addr=..., data=..., wait clock, ack...

alto nível:
  send_write(address, data)
```

O segundo formato é mais produtivo e reutilizável.

---

#### VHDL e Verilog não são linguagens de verificação

O slide afirma:

```text
VHDL and Verilog are hardware description languages which are simulatable,
but they are not verification languages.
```

Tradução:

```text
VHDL e Verilog são linguagens de descrição de hardware que podem ser simuladas,
mas não são linguagens de verificação.
```

Pontos do slide sobre Verilog:

```text
Verilog was designed with a focus on describing low-level hardware structures.
It is used for verification of designs of smaller complexities.

It does not provide support for high-level data structures or object-oriented features.
```

Interpretação:

Verilog clássico é ótimo para descrever hardware, mas limitado para construir ambientes complexos de verificação. Faltam recursos modernos como classes, objetos, randomização com constraints e estruturas de dados mais ricas.

Pontos do slide sobre VHDL:

```text
VHDL was designed for very large design teams.
It strongly encapsulates all information and communicates strictly through well-defined interfaces.
```

Interpretação:

VHDL tem forte tipagem, encapsulamento e organização. Isso ajuda no design, mas pode dificultar a criação ágil de testbenches complexos quando se precisa de estruturas flexíveis de verificação.

O slide também afirma:

```text
Very often, these limitations get in the way of an efficient implementation
of a verification strategy.

HDLs cannot be easily integrated with C models for predictor development
for test automation.

There was a need for hardware verification language to overcome the shortcomings
of Verilog and VHDL.
```

Interpretação:

O problema não é que VHDL e Verilog sejam ruins. O problema é que elas foram criadas principalmente para **descrever hardware**, não para **orquestrar verificação moderna**.

---

#### Linguagens proprietárias de verificação

O slide cita:

```text
Proprietary verification languages were eventually developed.
Examples are e/Specman from Verisity, VERA from Synopsys, Rave from Chronology, and so on.
Accellera SystemVerilog was developed from OpenVera as a common design and verification language.
```

Interpretação:

Antes da consolidação de SystemVerilog e UVM, empresas criaram linguagens proprietárias para resolver limitações de Verilog/VHDL na verificação.

Exemplos:

```text
e / Specman
VERA / OpenVera
Rave
```

Depois, SystemVerilog evoluiu como uma linguagem comum para design e verificação, incorporando muitos recursos necessários para HVL.

---

### Slide 2 — Verification at Higher Abstractions

O slide mostra as vantagens de verificar em maior abstração.

Pontos listados:

```text
Verification at higher abstraction provides following advantages:

Easier verification test bench and test scenario development.

Looks like actual use case environment and scenarios are relatable.

Permits test automation.

Provides more flexibility to create test scenarios.

Supports extraction of coverage metrics and design analysis.

Provides support for development of integrated debug environment.

Enables creation of random scenarios more like real-life use case scenarios.

Reduces verification time during project cycle as it does not require expertise
to create test scenarios and validate. However, require expertise to develop such an environment.

Has all the features of high-level programming languages and support to integrate
with models of high-level programming languages.
```

Interpretação:

O slide separa dois tipos de esforço:

```text
usar o ambiente de verificação
desenvolver o ambiente de verificação
```

O ambiente de alto nível facilita a criação de testes para o usuário do ambiente, mas alguém ainda precisa ter conhecimento avançado para construir esse ambiente corretamente.

Exemplo:

```text
Um engenheiro de teste pode escrever uma sequence de alto nível.
Mas o arquiteto de verificação precisa desenvolver o agent, driver, monitor, scoreboard e coverage.
```

---

#### Reuso e estrutura padrão

O slide afirma:

```text
Makes test bench reusable, standard infrastructure in the form of base classes
which are predefined. These can be extended and enhanced as per user needs.
```

Interpretação:

Aqui começa a ponte para UVM. A ideia é que o testbench não seja uma construção improvisada em cada projeto, mas uma infraestrutura padronizada com classes base reutilizáveis.

---

#### O que uma metodologia define

O slide lista que uma metodologia define:

```text
Rules to create behavioral models also known as Verification Components (OVC/UVC).

Standards for higher level of modeling input stimulus using Transaction Level Modelling (TLM).

Rules to have a layered structure of testbenches.
```

Interpretação:

A metodologia diz como organizar o ambiente.

Ela define:

```text
como modelar estímulos;
como encapsular componentes de verificação;
como comunicar transações;
como separar camadas do testbench;
como permitir reuso.
```

A frase final do slide resume:

```text
Standardized Methodology of creating complex testbenches with constrained random test vectors.
```

Tradução:

```text
Metodologia padronizada para criar testbenches complexos com vetores de teste randômicos com constraints.
```

---

### Slide 3 — Verification Methodology

O slide aprofunda o conceito de metodologia de verificação.

Pontos principais:

```text
Methodology supported by Verification Language defines standards for higher level
of modeling input stimulus using Transaction Level Modelling (TLM).

Defines rules to have a layered structure of testbenches.

Verification Methodology provides standardization of the way of creating complex
testbenches with constrained random test vectors.

Makes the test environment reusable across design projects reducing verification effort
and hence time to market.

Permits creation of more realist test environment just like the actual use case environment
at high level abstraction.

Permits test automation supporting regression suites for stress testing to uncover
any corner design issues.

Random scenarios can be created to verify the complex design corners which otherwise
would have escaped.
```

Interpretação:

Metodologia de verificação é mais do que uma linguagem. É um conjunto de regras, arquitetura e padrões para construir o ambiente.

Ela organiza:

```text
camadas do testbench;
componentes reutilizáveis;
estímulos;
transações;
randomização;
regressões;
coverage;
debug.
```

A metodologia também permite **constrained random verification** (verificação randômica com restrições), que ajuda a encontrar cantos do design que testes dirigidos talvez não encontrem.

---

### Slide 4 — Verification Methodologies (1/2)

O slide apresenta metodologias históricas.

#### Open Verification Methodology — OVM

Texto do slide:

```text
Open Verification Methodology (OVM)

Derived mainly from the Universal Reuse Methodology (URM), which was,
to a large part, based on the e Reuse Methodology (eRM) for the e Verification Language
developed by Verisity Design in 2001.

The OVM also brings in concepts from the Advanced Verification Methodology (AVM).

System Verilog.
```

Interpretação:

OVM foi uma metodologia importante antes da consolidação de UVM. Ela reuniu conceitos de metodologias anteriores, como URM, eRM e AVM, usando SystemVerilog.

A ideia era padronizar testbenches reutilizáveis e orientados a objetos para verificação.

---

#### Reference Verification Methodology — RVM

Texto do slide:

```text
Reference Verification Methodology (RVM)

Complete set of metrics and methods for performing functional verification of complex designs.

The System Verilog implementation of the RVM is known as the Verification Methodology Manual.
```

Interpretação:

RVM foi uma metodologia de referência para verificação funcional, associada a práticas e manuais de verificação em SystemVerilog.

No contexto histórico, metodologias como RVM e OVM prepararam o caminho para UVM.

---

### Slide 5 — Verification Methodologies (2/2)

O slide continua as metodologias.

#### Open Verification Language — OVL

Texto do slide:

```text
Open Verification Language (OVL)

OVL library of assertion checkers is intended to be used by design, integration,
and verification engineers to check for good/bad behavior in simulation, emulation,
and formal verification.

Permits development of OVM verification component (OVC).

Accellera - http://www.accellera.org/downloads/standards/ovl/
```

Interpretação:

OVL é uma biblioteca de checkers/assertions. A ideia é fornecer verificadores prontos para comportamentos comuns, usados em simulação, emulação e formal.

Exemplo conceitual:

```text
verificar que um sinal one-hot é realmente one-hot;
verificar que uma FIFO não lê quando vazia;
verificar que request recebe acknowledge dentro de N ciclos.
```

---

#### Universal Verification Methodology — UVM

Texto do slide:

```text
Universal Verification Methodology (UVM)

Standard Universal Verification Methodology.

Accellera - http://www.accellera.org/downloads/standards/uvm

Permits development of universal verification component (UVC).

System Verilog.
```

Interpretação:

UVM é a metodologia universal padronizada, baseada em SystemVerilog, para construção de testbenches reutilizáveis.

O termo **UVC** significa **Universal Verification Component** (componente universal de verificação). Ele representa um componente reutilizável para verificar um protocolo, interface ou bloco.

---

#### Open Source VHDL Verification Methodology — OS-VVM

Texto do slide:

```text
Open Source VHDL verification Methodology (OS-VVM)

VHDL

Accellera
```

Interpretação:

OS-VVM é uma metodologia de verificação voltada ao mundo VHDL, trazendo recursos de randomização, cobertura e organização de testbench para projetos em VHDL.

---

### Slide 6 — Universal Verification Methodology (UVM)

O slide define UVM.

Pontos principais:

```text
UVM is verification methodology with reusable verification components.

Provides framework for coverage driven verification (CDV).
```

Objetivos de CDV no slide:

```text
Eliminate the effort and time spent creating hundreds of tests.

Ensure thorough verification using up-front goal setting.

Receive early error notifications and deploy run-time checking and error analysis
to simplify debugging.
```

Interpretação:

UVM ajuda a construir ambientes onde a cobertura guia a criação de testes e onde erros são detectados por checkers durante a simulação.

A ideia não é escrever manualmente centenas de testes dirigidos, mas criar um ambiente capaz de:

```text
gerar estímulos variados;
medir cobertura;
detectar erros automaticamente;
direcionar novos testes para buracos de cobertura.
```

Outros pontos do slide:

```text
Helps to develop reusable test environment using a large set of base classes.

Reduces verification environment development time.

Consists of set of base classes with defined methods.

UVM is developed using SystemVerilog.

Any test environment can be developed by extending the available large set
of base classes in UVM library.
```

Interpretação:

UVM fornece uma biblioteca de classes base. Em vez de criar tudo do zero, o engenheiro estende classes existentes.

Exemplos:

```systemverilog
class my_driver extends uvm_driver #(my_item);
class my_monitor extends uvm_monitor;
class my_agent extends uvm_agent;
class my_env extends uvm_env;
class my_test extends uvm_test;
```

---

### Slide 7 — UVM Base Class Library

O slide apresenta três tipos de classes base.

Texto inicial:

```text
UVM library consists of three types of base classes:
```

#### UVM Object Class

Pontos listados:

```text
It is core object class with operational methods such as create, copy, clone,
compare, print, record, etc.

It has class instance identification fields such as name, type name, unique id,
etc. and random seeding.

uvm_transaction and uvm_component are derived from the uvm_object.
```

Interpretação:

`uvm_object` é a raiz de muitos objetos UVM. Ele fornece operações comuns para objetos que representam dados, transações, configurações e itens de sequência.

Exemplos de métodos importantes:

```text
create
copy
clone
compare
print
record
```

Esses métodos são essenciais para debug, factory, comparação e registro de transações.

---

#### UVM Transaction Class

Ponto listado:

```text
UVM transaction classes are used for stimulus generation and checking.
```

Interpretação:

Transações representam operações abstratas do ambiente.

Exemplos:

```text
uma leitura de barramento;
uma escrita de registrador;
um pacote de rede;
uma transação AXI;
um comando de configuração.
```

No UVM moderno, o item mais comum é `uvm_sequence_item`.

---

#### UVM Component Class

Pontos listados:

```text
Components are dynamic objects that exist during the simulation time.

Every uvm_component is uniquely addressable via a hierarchical path name,
e.g. test.env.agent.driver.

The uvm_component goes through following three different phases during simulation:
build
connect
run

The uvm_component defines configuration, reporting, transaction recording,
and factory interfaces.
```

Interpretação:

`uvm_component` é a base para blocos estruturais do testbench:

```text
driver
monitor
agent
env
scoreboard
test
subscriber
```

Eles existem em uma hierarquia e passam por fases.

Regra mental:

```text
build cria componentes;
connect liga componentes;
run executa comportamento temporal.
```

---

### Slide 8 — UVM Testbench and Environment

O slide explica a composição de um testbench UVM.

Pontos principais:

```text
A UVM testbench is composed of reusable verification environments
called verification components (VC).

A VC is an encapsulated, ready-to-use, configurable verification environment
for an interface protocol, a design submodule, or a full system.

The VC is applied to the device under test (DUT) to verify the design implementation
of the protocol or design architecture.

These verification components might be stored in a company repository and reused
for multiple verification environments.

The interface verification component is instantiated and configured for a desired
operational mode.

The verification environment also contains a multi-channel sequence mechanism
(that is, virtual sequencer) which synchronizes the timing and the data between
the different interfaces and allows fine control of the test environment for
a particular test.
```

Interpretação:

O slide mostra que UVM incentiva a criação de componentes reutilizáveis.

Um VC pode verificar:

```text
um protocolo de barramento;
uma interface serial;
um submódulo;
um subsistema;
um SoC completo.
```

A figura mostra um DUT com CPU, RAM e periféricos, cercado por VCs. Também mostra um interface verification component com:

```text
monitor
driver
sequencer
```

O **virtual sequencer** coordena cenários em múltiplas interfaces. Isso é importante em designs com vários agents, por exemplo:

```text
AXI agent
APB agent
SPI agent
interrupt agent
memory agent
```

---

### Slide 9 — SystemVerilog as Verification Language

O slide apresenta SystemVerilog como linguagem de verificação.

Ponto inicial:

```text
SystemVerilog is first standard hardware verification language accepted as an industry standard.
```

Interpretação:

O curso apresenta SystemVerilog como a primeira linguagem padrão de verificação de hardware amplamente aceita pela indústria.

O slide diz que SystemVerilog é enhancement of Verilog 2005, com suporte adicional a:

```text
Data types as in C++ such as int, typedef, struct, union, enum.

Dynamic data types: struct, classes, dynamic queues, dynamic arrays.

New operators and built-in methods.

Enhanced flow control like foreach, return, break, continue.

Interprocess synchronization — Semaphores, Mailboxes, Event Extension.

Assertions and Coverage.

Clocking Domains.
```

Interpretação:

Esses recursos são exatamente o que faltava em Verilog clássico para testbenches avançados.

#### DPI/VPI

O slide também cita:

```text
Direct Programming Interface (DPI) - VPI
```

Interpretação:

DPI permite integração com C/C++ de forma direta, útil para modelos de referência, algoritmos externos e integração com software.

VPI é uma interface de programação para acessar e manipular a simulação.

#### Hardware-specific procedures

O slide lista:

```text
Hardware-specific procedures.
```

Interpretação:

SystemVerilog mantém a capacidade de descrever e interagir com hardware, mas adiciona recursos de software/OOP para verificação.

#### OOP

O slide conclui:

```text
Using SystemVerilog constructs class of functionalities can be developed
and used applying OOPS concepts of high-level programming languages.
```

Interpretação:

SystemVerilog suporta classes e conceitos de programação orientada a objetos. Isso permite construir testbenches com:

```text
classes de transação;
drivers;
monitors;
scoreboards;
agents;
envs;
sequences;
factory;
configuração.
```

A figura mostra semaphores controlando acesso de múltiplas threads a um shared resource, reforçando o tema de sincronização entre processos.

---

### Slide 10 — UVM Methodology with SystemVerilog

O slide conecta UVM com SystemVerilog.

Pontos principais:

```text
UVM (Universal Verification Methodology) is a SystemVerilog language-based
verification methodology.

UVM consists of a defined methodology for architecting modular testbenches
for design verification.

UVM has a library of classes that helps in designing and implementing modular
testbench components and stimulus.

This enables reusing testbench components and stimulus within and across projects,
development of Verification IP, easier migration from simulation to emulation,
and so on.

Relies on strong, proven industry foundations. The core of its success is adherence
to a standard, that is, architecture, stimulus creation, automation, factory usage
standards, and so on.
```

Interpretação:

SystemVerilog fornece os recursos da linguagem. UVM define a forma padronizada de usar esses recursos.

UVM padroniza:

```text
arquitetura do testbench;
criação de estímulos;
componentes reutilizáveis;
factory;
configuração;
automação;
coverage;
checking.
```

O slide também lista o que pode ser automatizado usando UVM:

```text
Coverage Driven Verification (CDV) environments.

Automated Stimulus Generation.

Independent function Checking.

Coverage Collection.
```

A figura mostra um ciclo:

```text
Add Constraints
→ Constrainable Random vector generation
→ Many runs with different seed value
→ Functional coverage
→ Identify gaps
→ Directed test cases
→ Optimize code
```

Interpretação:

Esse fluxo representa a essência da verificação dirigida por cobertura:

1. Define constraints.
2. Gera vetores randômicos.
3. Roda várias seeds.
4. Mede coverage.
5. Identifica gaps.
6. Cria directed tests ou ajusta constraints.
7. Repete até fechar cobertura.

---

### Slide 11 — UVM Architecture using SystemVerilog

O slide mostra uma arquitetura genérica de testbench usando SystemVerilog.

Texto do slide:

```text
Generic UVM test bench architecture using SV.
```

A figura à esquerda mostra um fluxo simplificado:

```text
Generator → Driver → DUT
Driver → Scoreboard
DUT → Scoreboard
DUT → Checker
```

Interpretação:

Essa figura mostra a lógica básica:

```text
Generator cria estímulos.
Driver aplica estímulos no DUT.
DUT responde.
Checker verifica comportamento.
Scoreboard compara esperado versus observado.
```

A figura à direita mostra um exemplo de testbench UVM com:

```text
test
env
scoreboard
coverage monitor
virtual sequencer
APB agent
SPI agent
monitor
driver
SQR
configuration
DUT
```

Interpretação:

Esse exemplo mostra a versão mais estruturada da arquitetura, com múltiplos agents conectados ao DUT.

Um agent APB e um agent SPI podem verificar interfaces diferentes. O virtual sequencer coordena cenários entre eles.

---

### Slide 12 — Key Components of UVM

O slide apresenta uma pirâmide com três camadas:

```text
SystemVerilog Language
Verification Concepts
Methodology
```

#### SystemVerilog Language

Itens associados:

```text
Syntax
RTL
OOP
Class
Interface
```

Interpretação:

Essa camada é a base linguística. Sem SystemVerilog, não há classes, interfaces e OOP suficientes para implementar UVM como metodologia moderna.

#### Verification Concepts

Itens associados:

```text
Constrained Random
Coverage Driven
Transaction Level
Sequences
Scoreboards
```

Interpretação:

Essa camada representa os conceitos de verificação moderna. São ideias que organizam a criação de estímulo, medição de cobertura e checagem.

#### Methodology

Itens associados:

```text
Base Classes
Use Cases
Configuration-db
Phases
```

Interpretação:

Essa camada representa UVM como metodologia concreta: classes base, uso padronizado, configuração e fases.

A pirâmide mostra que UVM não é apenas biblioteca; é uma combinação de linguagem, conceitos de verificação e metodologia.

---

### Slide 13 — UVM Architecture

O slide mostra a arquitetura de um testbench UVM.

Elementos principais da figura:

```text
UVM Testbench
  UVM Test
    Sequences
    Config/Factory Overrides
    UVM Environment
      UVM Sequencer
      UVM Scoreboard
      UVM Agent
      UVM Agent
      UVM Environment
      UVM Environment
  Design Under Test (DUT)
```

Interpretação:

Essa figura mostra a hierarquia UVM.

#### UVM Test

É o nível que escolhe:

```text
quais sequences rodam;
quais configurações são aplicadas;
quais factory overrides são usados;
qual cenário será verificado.
```

#### UVM Environment

Agrupa agentes, scoreboards, sequencers e outros ambientes.

#### UVM Agent

Encapsula componentes de uma interface, normalmente:

```text
sequencer
driver
monitor
```

#### Scoreboard

Compara transações observadas com resultados esperados.

#### Config/Factory Overrides

Permitem alterar comportamento do ambiente sem reescrever a arquitetura base.

---

### Slide 14 — Advantages of UVM

O slide lista vantagens de UVM.

#### Modularity and Reusability

Texto:

```text
The methodology is designed as modular components (Driver, Sequencer, Agents, env,
and so on) to enable reuse at different levels of verification and across projects.
```

Interpretação:

UVM organiza testbench em blocos modulares. Isso facilita reuso em nível de bloco, subsistema e SoC.

---

#### Separating Tests from Testbenches

Texto:

```text
Tests in terms of stimulus/sequencers are kept separate from the actual testbench hierarchy
and hence there can be reuse of stimulus across different units or across projects.
```

Interpretação:

O testbench é a infraestrutura. O test define o cenário.

Separar os dois permite usar o mesmo ambiente com vários testes e reutilizar sequences em projetos diferentes.

---

#### Simulator independent

Texto:

```text
The base class library and the methodology is supported by all simulators
and hence there is no dependence on any specific simulator.
```

Interpretação:

UVM é padronizado e suportado por simuladores industriais, reduzindo dependência de uma ferramenta específica.

---

#### Sequence based stimulus generation

Texto:

```text
There are several ways in which sequences can be developed which includes randomization,
layered sequences, virtual sequences, and so on which provides a good control and rich
stimulus generation capability.
```

Interpretação:

Sequences permitem criar estímulos simples, complexos, randômicos, dirigidos, compostos ou coordenados entre múltiplos agents.

---

#### Configuration mechanisms

Texto:

```text
Configuration mechanisms simplify configuration of objects with deep hierarchy.
The configuration mechanism (using UVM config database) helps in easily configuring
different testbench components based on verification environment using it, and without
worrying about how deep any component is in the testbench hierarchy.
```

Interpretação:

A `uvm_config_db` permite passar configurações para componentes profundos na hierarquia sem conectar tudo manualmente.

Exemplos:

```text
modo ativo/passivo do agent;
virtual interface;
enable de coverage;
endereços base;
timeouts;
configuração de protocolo.
```

---

#### Factory mechanisms

Texto:

```text
Simplifies modification of components easily.
Creating each component using factory enables them to be overridden in different tests
or environments without changing underlying code base.
```

Interpretação:

Factory permite trocar implementações em runtime.

Exemplo:

```text
usar driver normal em um teste;
usar driver com erro injetado em outro;
usar item especializado para corner cases;
usar scoreboard alternativo.
```

Sem alterar o código do environment.

---

### Slide 15 — Disadvantages of UVM

O slide lista desvantagens de UVM.

#### Steep learning curve

Texto:

```text
For anyone new to the methodology, the learning curve to understand all details
and the library is very steep.
```

Interpretação:

UVM tem muitas camadas:

```text
OOP
factory
phases
config_db
TLM
sequences
agents
coverage
scoreboards
objections
macros
```

Por isso, para iniciantes, pode parecer pesado.

---

#### Still developing and not perfect/stable

Texto:

```text
The methodology is still developing and has a lot of overhead that can sometimes
cause simulation to appear slow or probably can have some bugs.
```

Interpretação:

UVM adiciona infraestrutura e abstração. Isso traz reuso e padronização, mas também pode aumentar overhead de simulação, complexidade e dificuldade de debug.

A aula não apresenta UVM como perfeito, mas como uma metodologia poderosa com custo de aprendizado.

---

### Slide 16 — History of UVM

O slide mostra a evolução histórica de UVM.

A figura superior mostra uma linha do tempo aproximada:

```text
eRM / URM
AVM
RVM / VMM
OVM
UVM
```

com atores como:

```text
Verisity / Cadence
Mentor
Synopsys
```

A figura inferior mostra relações:

```text
Vera → RVM
e → eRM
SystemVerilog → VMM / AVM / URM
VMM → VMM 1.2
AVM + URM → OVM
OVM + VMM 1.2 → UVM
```

Interpretação:

UVM não surgiu do zero. Ele consolidou práticas e metodologias anteriores de diferentes empresas e comunidades.

A imagem mostra que UVM é resultado de convergência:

```text
e/eRM
Vera/RVM
SystemVerilog
AVM
OVM
VMM
```

A palavra **Open Source** na figura indica o esforço de padronização e abertura da metodologia.

---

### Slide 17 — Verification Plan (1/2)

O slide apresenta o verification plan.

Texto principal:

```text
Verification plan is document just as specification to design.
```

Tradução:

```text
O plano de verificação é um documento, assim como a especificação é para o design.
```

Interpretação:

O plano de verificação é o documento que orienta o esforço de verificação. Ele diz o que será verificado, como será verificado e quando considerar a verificação concluída.

Itens listados:

```text
It contains sections not restricting to the following:

Definition of verification completion.

Critical blocks to be verified.

Test scenarios which are mandatory at top level design verification.

Features to be stressed.

Coverage target for the design at block level and at top level.
```

Interpretação:

O verification plan deve conter critérios claros de encerramento, blocos críticos, cenários obrigatórios, features críticas e metas de cobertura.

Sem isso, é difícil saber se a verificação terminou ou se apenas rodamos alguns testes.

---

### Slide 18 — Verification Plan (2/2)

O slide continua o verification plan.

Itens listados:

```text
Release strategy.

Simulators and debug environment to be used.

Project setup for the design.

Plan for target features and regression strategies as follows:
```

Estratégias de regressão listadas:

```text
Run the most important tests first when you get a new build.

Do not start over on your test pass every time you receive a new build.

Regression tests that have been run already many times are unlikely to reveal new bugs.
If your test case is fully automated, by all means, run all of them for each build.

Prioritize tests into “Must-Pass” types with a more focused list of tests which can reduce
the time of the regression. Major builds will warrant running all test cases.

Automate whenever it makes sense to do so.
```

Interpretação:

O plano não cobre apenas features. Ele também define estratégia operacional:

```text
quais simuladores usar;
qual ambiente de debug;
como configurar o projeto;
quais testes rodar primeiro;
quando rodar regressão completa;
quais testes são must-pass;
quando automatizar.
```

A ideia é reduzir tempo sem perder confiança.

Em builds frequentes, rodar todos os testes sempre pode ser caro. Por isso, uma lista **must-pass** ajuda a detectar rapidamente bugs críticos. Builds maiores justificam regressões completas.

---

### Slide 19 — Test Automation

O slide fecha com automação de teste.

Pontos principais:

```text
Automation is a means of reducing manual effort in running repetitive tasks
such as regressions.

Automation can be done also in creating testbenches so that a standard infrastructure
is maintained across the team.

This can be done using Tcl/Perl scripts.
```

Interpretação:

Automação serve tanto para executar regressões quanto para gerar infraestrutura padronizada.

Exemplos:

```text
rodar simulações automaticamente;
compilar diferentes configurações;
coletar logs;
comparar resultados;
gerar relatórios;
criar skeleton de testbench;
padronizar diretórios;
rodar coverage merge;
abrir debug com scripts.
```

#### Why use Perl?

O slide lista:

```text
Free and works with most UNIX and Linux versions.

Easy to work with, smaller learning curve.

Advanced Perl with OOPS available makes scripting easier.
```

Interpretação:

No contexto histórico de EDA, Perl e Tcl foram muito usados para automação de fluxos, regressões e geração de scripts.

Hoje, Python também é muito usado em muitos ambientes, mas o slide cobra especificamente Tcl/Perl e as razões para Perl.

---

## Aula didática desenvolvida

### 1. Por que surgiram HVLs?

VHDL e Verilog descrevem hardware.

Mas verificação moderna precisa de recursos como:

```text
classes
objetos
randomização com constraints
mailboxes
semaphores
eventos
filas dinâmicas
arrays dinâmicos
scoreboards
coverage
assertions
transações
interfaces com C/C++
```

Esses recursos ajudam a criar ambientes que simulam casos de uso complexos e validam respostas automaticamente.

Por isso surgiram HVLs e, depois, SystemVerilog como uma linguagem capaz de unir design e verificação.

---

### 2. Abstração maior significa testar intenção, não fio por fio

Em baixo nível, você manipula sinais.

Em alto nível, você manipula transações.

Exemplo de transação:

```text
write address=0x1000 data=0xA5A5
read address=0x1000 expect=0xA5A5
```

Isso é mais próximo da intenção do protocolo do que manipular manualmente `addr`, `valid`, `ready`, `data`, `write_en` ciclo por ciclo.

O driver transforma a transação em sinais. O monitor transforma sinais de volta em transações.

---

### 3. Metodologia é arquitetura + regras + reuso

Uma metodologia de verificação define:

```text
como dividir componentes;
como gerar estímulo;
como comunicar transações;
como coletar coverage;
como verificar respostas;
como configurar ambiente;
como reutilizar componentes.
```

Sem metodologia, cada projeto cria testbench de um jeito diferente.

Com metodologia, os times compartilham padrões, nomes, fases e componentes.

---

### 4. TLM é a base da comunicação em alto nível

Transaction Level Modeling, ou TLM, significa comunicar por transações, não por fios.

Exemplo:

```text
monitor publica uma transação de leitura;
scoreboard recebe essa transação;
coverage recebe a mesma transação;
logger registra a transação.
```

Isso desacopla componentes e aumenta reuso.

---

### 5. UVM como padronização de SystemVerilog

SystemVerilog fornece recursos como classes, randomização, assertions e interfaces.

UVM organiza esses recursos em uma metodologia.

Pense assim:

```text
SystemVerilog = idioma
UVM = gramática arquitetural da verificação
```

Com UVM, os componentes seguem estrutura esperada:

```text
uvm_test
uvm_env
uvm_agent
uvm_driver
uvm_monitor
uvm_scoreboard
uvm_sequence
uvm_sequencer
```

---

### 6. UVM e Coverage Driven Verification

O slide mostra que UVM fornece framework para CDV.

Fluxo típico:

```text
1. Definir metas de cobertura.
2. Criar estímulos randômicos com constraints.
3. Rodar várias seeds.
4. Medir functional coverage.
5. Identificar gaps.
6. Criar directed tests ou ajustar constraints.
7. Repetir.
```

UVM facilita isso porque tem estrutura para:

```text
sequences;
coverage collectors;
monitors;
scoreboards;
factory;
configuração;
testes reutilizáveis.
```

---

### 7. Classes base de UVM

#### `uvm_object`

Base para objetos de dados.

Exemplos:

```text
sequence item
transaction
configuration object
```

Métodos úteis:

```text
copy
clone
compare
print
record
create
```

#### `uvm_component`

Base para blocos do testbench.

Exemplos:

```text
driver
monitor
agent
env
test
scoreboard
```

Tem fases:

```text
build
connect
run
```

---

### 8. Verification Component

Um VC é um componente de verificação reutilizável.

Ele pode encapsular:

```text
driver
monitor
sequencer
coverage
checks
configuração
```

Exemplo:

```text
APB VC
AXI VC
SPI VC
UART VC
memory VC
interrupt VC
```

Esses VCs podem ficar em repositório da empresa e ser reutilizados em vários projetos.

---

### 9. Virtual sequencer

Quando há várias interfaces, um único teste pode precisar coordenar ações entre elas.

Exemplo:

```text
configurar via APB;
iniciar transferência via SPI;
esperar interrupção;
ler status via APB.
```

Um virtual sequencer coordena sequences em múltiplos sequencers/agents.

---

### 10. SystemVerilog como linguagem de verificação

Os recursos citados pelo slide são essenciais:

```text
classes → modelar objetos de verificação
dynamic arrays/queues → estruturas de dados flexíveis
semaphores/mailboxes/events → sincronização
assertions → checagem temporal
coverage → medir cenários
clocking domains → organizar testbench síncrono
DPI → integrar C/C++
```

Esses recursos tornam SystemVerilog muito mais adequado para verificação que Verilog clássico.

---

### 11. Architecture UVM: separação de responsabilidades

Em UVM:

```text
test escolhe o cenário;
env organiza o ambiente;
agent encapsula uma interface;
sequencer organiza itens;
driver aplica sinais;
monitor observa sinais;
scoreboard compara resultados;
coverage mede completude.
```

Essa separação evita testbenches monolíticos e facilita reuso.

---

### 12. Tests separados do testbench

Uma vantagem importante de UVM é separar o teste da infraestrutura.

O mesmo `env` pode rodar:

```text
test_reset
test_random_read_write
test_error_response
test_backpressure
test_corner_case
test_stress
```

Cada test muda sequences, constraints, configurações e overrides, mas reutiliza o ambiente.

---

### 13. Factory

Factory permite substituir componentes sem editar o ambiente.

Exemplo:

```text
usar normal_driver no teste comum;
usar error_injection_driver no teste de erro;
usar slow_monitor em debug;
usar special_sequence_item em corner case.
```

Isso é muito poderoso para reuso e customização.

---

### 14. Config database

A `uvm_config_db` permite configurar objetos em hierarquia profunda.

Exemplos de configuração:

```text
virtual interface;
agent ativo/passivo;
coverage_enable;
checks_enable;
timeout;
base address;
protocolo;
modo de operação.
```

Sem config-db, seria necessário passar parâmetros manualmente por muitos níveis de hierarquia.

---

### 15. Desvantagens reais de UVM

UVM é poderoso, mas tem custo.

O slide cita:

```text
curva de aprendizado íngreme;
overhead;
simulação pode parecer lenta;
metodologia ainda em evolução.
```

Isso significa que UVM deve ser usado com disciplina. Para designs muito pequenos, pode parecer pesado. Para designs complexos, o reuso e a padronização compensam.

---

### 16. Verification plan como contrato

O plano de verificação é o contrato que define:

```text
o que será testado;
como será testado;
qual coverage é esperada;
quais cenários são obrigatórios;
quais blocos são críticos;
quando a verificação termina.
```

Sem plano, não há critério sólido de conclusão.

---

### 17. Estratégia de regressão

O slide recomenda priorizar testes.

Em cada novo build:

```text
rodar primeiro os testes mais importantes;
não recomeçar tudo sempre sem critério;
usar must-pass tests;
rodar regressão completa em major builds;
automatizar quando fizer sentido.
```

Isso reduz tempo de feedback.

---

### 18. Automação

Automação reduz esforço manual e padroniza o fluxo.

Tarefas automatizáveis:

```text
compilar;
rodar simulação;
rodar regressão;
coletar logs;
checar pass/fail;
gerar coverage;
mesclar coverage;
abrir waveform;
criar testbench skeleton;
gerar relatórios.
```

O slide cita Tcl/Perl, que são tradicionais em fluxos EDA.

---

## Conceitos difíceis explicados em profundidade

### 1. Linguagem de design versus linguagem de verificação

Uma linguagem de design responde:

```text
que hardware será construído?
```

Uma linguagem de verificação responde:

```text
como criar cenários para testar esse hardware?
como gerar estímulos?
como medir cobertura?
como comparar resposta?
como automatizar regressão?
```

SystemVerilog é híbrida: serve tanto para design quanto para verificação.

---

### 2. Por que Verilog não bastava?

Verilog clássico não tinha suporte robusto a:

```text
classes;
OOP;
randomização com constraints;
coverage funcional;
mailboxes;
semaphores;
dynamic arrays;
queues;
TLM;
factory;
testbench modular.
```

Era possível verificar designs pequenos, mas ambientes grandes ficavam difíceis de manter.

---

### 3. Constrained random

Randomização pura pode gerar muitos estímulos inválidos.

Constrained random gera estímulos aleatórios, mas obedecendo regras.

Exemplo:

```text
endereço precisa estar alinhado;
burst length deve estar entre 1 e 16;
write não pode ocorrer durante reset;
tipo de pacote precisa ser válido.
```

Isso aumenta chance de encontrar bugs sem gerar cenários impossíveis.

---

### 4. Directed tests ainda são importantes

Mesmo com randomização, testes dirigidos continuam úteis.

A figura de coverage mostra que, perto do fim, os corner cases podem ser difíceis de atingir aleatoriamente.

Então é comum usar:

```text
random para cobertura ampla;
directed tests para buracos específicos.
```

---

### 5. Scoreboard versus checker

#### Checker

Verifica uma propriedade ou condição específica.

Exemplo:

```text
ack deve ocorrer até 3 ciclos depois de req.
```

#### Scoreboard

Compara comportamento observado com comportamento esperado em nível de transação.

Exemplo:

```text
dado lido deve ser igual ao dado escrito anteriormente naquele endereço.
```

Ambos são usados em UVM.

---

### 6. Coverage collection

Coverage responde:

```text
o cenário ocorreu?
```

Exemplo:

```text
foi testado burst de tamanho 1, 2, 4, 8?
foi testada resposta de erro?
foi testado reset durante transação?
```

Sem coverage, você não sabe se a regressão realmente atingiu os casos importantes.

---

### 7. UVC versus OVC

O slide usa termos como OVC e UVC.

#### OVC

Open Verification Component, associado ao contexto OVM.

#### UVC

Universal Verification Component, associado ao contexto UVM.

Ambos representam componentes reutilizáveis de verificação para protocolos/interfaces/blocos.

---

### 8. Histórico de UVM ajuda a entender por que ele existe

UVM unificou metodologias concorrentes e práticas de várias empresas.

Antes havia:

```text
e/eRM
Vera/RVM
AVM
OVM
VMM
```

UVM consolidou essas ideias em uma metodologia padronizada.

Isso reduziu fragmentação industrial.

---

### 9. Por que automation é parte de metodologia?

Verificação envolve repetir muito:

```text
rodar testes;
mudar seed;
coletar cobertura;
reexecutar regressão;
analisar logs;
gerar relatórios.
```

Sem automação, o processo é lento, propenso a erro e pouco reprodutível.

---

### 10. Must-pass tests

Must-pass tests são testes críticos que devem passar em todo build.

Eles servem como filtro rápido.

Exemplos:

```text
reset básico;
boot básico;
interfaces principais;
sanity tests;
testes de fumaça;
cenários críticos.
```

Se esses testes falham, talvez nem valha rodar regressão longa.

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — Verification Languages

Mostra que VHDL e Verilog são simuláveis, mas não são linguagens de verificação. A figura/texto também lista limitações de HDLs e a necessidade de linguagens proprietárias como e/Specman e VERA antes da consolidação de SystemVerilog.

### Página 1 — Verification at Higher Abstractions

Mostra as vantagens da verificação em alto nível: automação, cenários mais próximos do uso real, randomização, cobertura, integração com modelos e testbenches reutilizáveis.

### Página 2 — Verification Methodology

Mostra que metodologia define TLM, estrutura em camadas de testbench, constrained random test vectors, reuso, automação e cenários randômicos para corners complexos.

### Página 2 — Verification Methodologies 1/2

Apresenta OVM e RVM, explicando a origem histórica de metodologias de verificação baseadas em SystemVerilog.

### Página 3 — Verification Methodologies 2/2

Apresenta OVL, UVM e OS-VVM. É importante para diferenciar biblioteca de assertions, metodologia universal em SystemVerilog e metodologia de verificação em VHDL.

### Página 3 — Universal Verification Methodology

Resume UVM como metodologia com componentes reutilizáveis, framework para CDV, classes base e desenvolvimento em SystemVerilog.

### Página 4 — UVM Base Class Library

Mostra as três famílias principais: `uvm_object`, `uvm_transaction` e `uvm_component`, com métodos e fases principais.

### Página 4 — UVM Testbench and Environment

Mostra VC aplicado ao DUT, múltiplos VCs em um ambiente de verificação e um interface verification component com monitor, driver e sequencer.

### Página 5 — SystemVerilog as Verification Language

Lista os recursos que fazem SystemVerilog funcionar como linguagem de verificação: tipos avançados, classes, dynamic arrays, semaphores, mailboxes, assertions, coverage, clocking domains e DPI/VPI.

### Página 5 — UVM Methodology with SystemVerilog

Mostra UVM como metodologia baseada em SystemVerilog e o ciclo de randomização, múltiplas seeds, coverage, identificação de gaps, directed tests e otimização.

### Página 6 — UVM Architecture using SystemVerilog

Mostra a arquitetura genérica generator-driver-DUT-scoreboard-checker e um exemplo mais rico de UVM testbench com agents APB/SPI, virtual sequencer, scoreboard, coverage e configuração.

### Página 6 — Key Components of UVM

A pirâmide mostra as três camadas: SystemVerilog language, verification concepts e methodology.

### Página 7 — UVM Architecture

Mostra a hierarquia de testbench: UVM Test, sequences, config/factory overrides, UVM environment, sequencer, scoreboard, agents e DUT.

### Página 7 — Advantages of UVM

Lista modularidade, reuso, separação entre testes e testbench, independência de simulador, stimulus baseado em sequences, config-db e factory.

### Página 8 — Disadvantages of UVM

Mostra a curva de aprendizado íngreme e o overhead/instabilidade relativa da metodologia.

### Página 8 — History of UVM

Mostra a convergência histórica de e/eRM, Vera/RVM, VMM, AVM, OVM até UVM.

### Página 9 — Verification Plan 1/2

Mostra que verification plan é documento análogo à especificação do design e deve conter critérios de conclusão, blocos críticos, cenários obrigatórios, features a estressar e metas de cobertura.

### Página 9 — Verification Plan 2/2

Mostra release strategy, simuladores, ambiente de debug, setup do projeto e estratégia de regressão, incluindo must-pass tests e automação.

### Página 10 — Test Automation

Mostra automação para regressões e criação de testbenches, com uso de Tcl/Perl scripts e motivos para uso de Perl.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Para que servem verification languages?**  
   Para desenvolver testbenches e cenários de teste em alto nível de abstração de sistema.

2. **Por que abstração maior ajuda a verificação?**  
   Porque facilita desenvolvimento de testbench, automação, criação de cenários, coleta de coverage e integração com modelos de alto nível.

3. **VHDL e Verilog são verification languages?**  
   Segundo o slide, não. São hardware description languages simuláveis, mas não linguagens de verificação.

4. **Qual limitação de Verilog clássico é destacada?**  
   Não oferece suporte adequado a estruturas de dados de alto nível ou recursos orientados a objetos.

5. **Por que houve necessidade de hardware verification languages?**  
   Para superar limitações de Verilog e VHDL na criação de ambientes de verificação complexos.

6. **Quais linguagens proprietárias de verificação são citadas?**  
   e/Specman, VERA/OpenVera e Rave.

7. **De onde SystemVerilog foi desenvolvido segundo o slide?**  
   De OpenVera, como linguagem comum de design e verificação.

8. **O que uma verification methodology define?**  
   Padrões para modelagem de estímulo em TLM, estrutura em camadas de testbench e criação padronizada de testbenches complexos.

9. **O que é TLM?**  
   Transaction Level Modelling, modelagem em nível de transação para estímulos e comunicação entre componentes.

10. **O que é OVM?**  
    Open Verification Methodology, derivada de URM/eRM e com conceitos de AVM, baseada em SystemVerilog.

11. **O que é RVM?**  
    Reference Verification Methodology, conjunto de métricas e métodos para verificação funcional de designs complexos.

12. **O que é OVL?**  
    Open Verification Language, biblioteca de assertion checkers para simulação, emulação e formal.

13. **O que é UVM?**  
    Universal Verification Methodology, metodologia padrão de verificação baseada em SystemVerilog com componentes reutilizáveis.

14. **O que é UVC?**  
    Universal Verification Component, componente reutilizável de verificação em UVM.

15. **O que é OS-VVM?**  
    Open Source VHDL Verification Methodology, metodologia de verificação para VHDL.

16. **UVM fornece framework para quê?**  
    Coverage Driven Verification, CDV.

17. **Quais objetivos de CDV são citados no slide de UVM?**  
    Eliminar esforço de criar centenas de testes, garantir verificação por metas definidas e receber erros cedo com run-time checking.

18. **UVM é desenvolvido usando qual linguagem?**  
    SystemVerilog.

19. **Quais são os três tipos de classes base UVM citados?**  
    UVM Object Class, UVM Transaction Class e UVM Component Class.

20. **Quais métodos aparecem em `uvm_object`?**  
    create, copy, clone, compare, print, record, entre outros.

21. **Para que servem UVM transaction classes?**  
    Para geração de estímulo e checking.

22. **Quais fases principais de `uvm_component` aparecem no slide?**  
    build, connect e run.

23. **O que é um VC?**  
    Verification Component: ambiente de verificação encapsulado, pronto para uso e configurável.

24. **O que contém um interface verification component na figura?**  
    Monitor, driver e sequencer.

25. **Para que serve virtual sequencer?**  
    Para sincronizar timing e dados entre diferentes interfaces e controlar cenários multi-interface.

26. **Quais recursos fazem SystemVerilog ser útil como verification language?**  
    Classes, tipos dinâmicos, arrays/queues, semaphores, mailboxes, event extension, assertions, coverage, clocking domains e DPI/VPI.

27. **O que UVM automatiza segundo o slide?**  
    CDV environments, automated stimulus generation, independent function checking e coverage collection.

28. **Quais são as camadas da pirâmide de componentes UVM?**  
    SystemVerilog language, verification concepts e methodology.

29. **Quais vantagens de UVM são citadas?**  
    Modularidade/reuso, separação de testes e testbench, independência de simulador, estímulo baseado em sequences, config-db e factory.

30. **Quais desvantagens de UVM são citadas?**  
    Curva de aprendizado íngreme e overhead/possível lentidão ou bugs.

31. **O que é verification plan?**  
    Documento análogo à especificação do design, que define escopo, metas, critérios e estratégia de verificação.

32. **Quais itens o verification plan deve conter?**  
    Definição de conclusão, blocos críticos, cenários obrigatórios, features a estressar e metas de cobertura.

33. **Quais itens aparecem na segunda parte do verification plan?**  
    Release strategy, simuladores, ambiente de debug, setup do projeto e estratégia de regressão.

34. **O que são must-pass tests?**  
    Lista focada de testes prioritários que devem passar em builds, reduzindo tempo de regressão.

35. **Para que serve test automation?**  
    Para reduzir esforço manual em tarefas repetitivas como regressões e padronizar criação de testbenches.

36. **Quais linguagens/scripts são citados para automação?**  
    Tcl/Perl scripts.

### Pegadinhas

- VHDL e Verilog são simuláveis, mas o slide não os classifica como verification languages.
- SystemVerilog é apresentado como linguagem comum de design e verificação.
- HVL não substitui HDL; complementa a verificação.
- Metodologia não é só biblioteca; define arquitetura, regras e fluxo.
- UVM é baseado em SystemVerilog, não uma linguagem separada.
- `uvm_object` é base de objetos; `uvm_component` é base de blocos hierárquicos.
- Monitor observa; driver dirige; sequencer organiza estímulos.
- Virtual sequencer coordena múltiplas interfaces.
- Factory permite override sem mudar o código base.
- Config-db ajuda a configurar componentes profundos na hierarquia.
- UVM tem vantagens fortes, mas também curva de aprendizado e overhead.
- Verification plan é tão importante para verificação quanto a especificação é para design.
- Must-pass tests não substituem regressão completa; são filtro rápido.
- Automação reduz trabalho manual, mas precisa ser bem planejada.

### Frases para memorizar

```text
HDL descreve hardware; HVL cria ambientes de verificação.
Maior abstração aumenta produtividade de verificação.
VHDL e Verilog são simuláveis, mas não são verification languages.
SystemVerilog une recursos de design e verificação.
UVM é metodologia de verificação baseada em SystemVerilog.
UVM fornece componentes reutilizáveis e base classes.
TLM modela comunicação em nível de transação.
VC é componente de verificação reutilizável.
Virtual sequencer coordena múltiplas interfaces.
Factory permite substituir componentes sem alterar o ambiente.
Verification plan guia a verificação.
Automação reduz esforço em regressões.
```

---

## Relação com projeto/laboratório

Esta aula prepara diretamente a criação de ambientes de verificação mais robustos.

### Estrutura mental de um ambiente UVM

```text
uvm_test
  escolhe cenário, sequences, configs e overrides

uvm_env
  organiza agents, scoreboards, coverage e VCs

uvm_agent
  encapsula sequencer, driver e monitor

uvm_sequence / sequencer
  cria e organiza transações

uvm_driver
  aplica transações na interface do DUT

uvm_monitor
  observa sinais e reconstrói transações

uvm_scoreboard / checker
  verifica correção

coverage
  mede completude funcional
```

### Exemplo prático de fluxo CDV

```text
1. Definir coverpoints.
2. Criar sequences constrained-random.
3. Rodar várias seeds.
4. Medir coverage.
5. Identificar buracos.
6. Ajustar constraints ou criar directed tests.
7. Rodar regressão.
8. Fazer signoff contra verification plan.
```

### Checklist para verification plan

- [ ] Definição clara de conclusão.
- [ ] Blocos críticos identificados.
- [ ] Cenários obrigatórios listados.
- [ ] Features a estressar definidas.
- [ ] Coverage target por bloco e top-level.
- [ ] Estratégia de release documentada.
- [ ] Simulador e ambiente de debug definidos.
- [ ] Setup de projeto definido.
- [ ] Estratégia de regressão definida.
- [ ] Must-pass tests separados.
- [ ] Automação planejada.

### Checklist para test automation

- [ ] Script de compilação.
- [ ] Script de simulação.
- [ ] Script de regressão.
- [ ] Coleta automática de logs.
- [ ] Detecção automática de PASS/FAIL.
- [ ] Coleta e merge de coverage.
- [ ] Geração de relatórios.
- [ ] Execução com múltiplas seeds.
- [ ] Separação entre smoke/must-pass e regressão completa.

---

## Necessidade de áudio

**Baixo a médio.**

Os slides são bastante textuais e os principais pontos foram reconstruídos diretamente dos prints. A fala do professor poderia ajudar em:

- exemplos concretos de uso de e/Specman, Vera, OVM, RVM e UVM;
- diferenças práticas entre OVC e UVC;
- detalhes históricos da figura de UVM;
- como o curso espera que o aluno interprete “SystemVerilog foi desenvolvido a partir de OpenVera”;
- exemplos de verification plan e must-pass tests no fluxo Synopsys.

Mesmo sem áudio, os conceitos essenciais estão bem claros pelos slides.

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Diferença entre HDL, HVL, SystemVerilog e UVM foi destacada.
- [x] Metodologias OVM, RVM, OVL, UVM e OS-VVM foram organizadas.
- [x] Arquitetura UVM foi explicada.
- [x] Verification plan e test automation foram aprofundados.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado seguindo o roteiro.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 026 — 04 VCS and Verdi Debug Environment**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\04 VCS and Verdi Debug Environment.docx
```

Faixa:

```text
Slides 1-27
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\04 VCS and Verdi Debug Environment.md
```
