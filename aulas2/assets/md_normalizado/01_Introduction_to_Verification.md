# 01 Introduction to Verification

## Controle do bloco

- **Bloco:** 023
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\01 Introduction to Verification.docx`
- **Faixa processada:** slides visíveis 1-15, distribuídos em 8 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\01 Introduction to Verification.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O roteiro indica este bloco como `023 — 01 Introduction to Verification` e o próximo como `024 — 02 Verification Methodology`.
- **Próximo bloco recomendado:** 024 — `02 Verification Methodology`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco inicia a seção **05 Design Verification**. A partir daqui, o foco sai de síntese/otimização e entra na verificação funcional, simulação, tipos de simuladores, desafios de cobertura e diferença entre verificação e teste de fabricação.

---

## Resumo executivo

Esta aula introduz a necessidade de **verificação de projetos VLSI**. A mensagem central é que, em ASICs, SoCs e FPGAs complexos, não basta projetar o circuito: é preciso demonstrar que a implementação realmente corresponde à especificação antes da fabricação ou entrega.

O bloco começa com motivações históricas, como falhas de missão por erros de implementação ou conversão de dados. Em seguida, explica que **first-time success** e **field success** são necessidades absolutas, porque o custo de corrigir problemas cresce muito conforme o projeto avança no fluxo.

A aula define verificação como:

```text
um processo usado para demonstrar a correção funcional de um design
```

e também como a confirmação de que o design implementa aquilo que deveria implementar.

Um ponto central é a diferença entre **verification** e **testing**:

```text
Verification:
  verifica a correção do design antes da fabricação.

Testing:
  verifica a correção das peças fabricadas depois da manufatura.
```

A aula também aprofunda os simuladores usados em verificação, explicando suas limitações:

```text
simuladores aproximam o mundo real;
dependem da qualidade do modelo;
não provam automaticamente que o design está correto;
precisam de testbench, estímulos e análise externa;
não são rápidos em comparação com o mundo físico.
```

Depois, o bloco diferencia tipos de simuladores:

```text
event-based simulators
cycle-based simulators
co-simulation environments
```

A parte final mostra por que verificação exaustiva é impraticável. O número de vetores possíveis explode rapidamente, então é necessário usar várias técnicas combinadas e medir a qualidade da verificação por **coverage**.

O bloco fecha introduzindo **Coverage Driven Verification**, diferenciando:

```text
functional coverage
code coverage
statement/block coverage
path coverage
expression coverage
cross coverage
```

A principal conclusão é:

```text
Code coverage sozinha não prova que terminamos a verificação.
Functional coverage mede se o plano de teste foi exercitado.
Verificação completa exige combinação de técnicas, cobertura e julgamento de engenharia.
```

---

## Texto extraído e organizado por slide

### Slide 1 — Need for VLSI Design Verification

O slide apresenta a motivação para verificação em VLSI.

#### Motivation

Exemplos citados:

```text
NASA's Mars Mission failure due to wrong implementation of measurement units (1999).

Ariane-5 Flight 501 failure: internal software exception during data conversion
from 64-bit floating point to 16-bit signed integer value led to mission failure.

The corresponding exception handling mechanism contributed to the processor being shutdown
(This was part of the system specification).
```

Interpretação:

O slide usa falhas conhecidas para mostrar que pequenos erros de especificação, implementação, conversão ou tratamento de exceção podem gerar falhas enormes. No contexto de VLSI, um bug pode chegar ao silício e custar muito caro para corrigir.

#### First-time success and field success are absolute necessity

Pontos listados:

```text
Due to the exorbitant cost of design, development, and fabrication.

Complexity of designs: designs have hundreds of internally developed and third-party IPs integrated.

Complex interactions of large number of internal blocks.

High debug cost as design advances, as shown in figure.

Increased number of power domains, clocks add to complexity.

Increased sense of reliability in safety critical applications such as automotive engineering.
```

A figura mostra uma curva de custo crescendo com o avanço do tempo/fase do projeto:

```text
Spec design
Design validation
System validation
Board validation
Customer return
```

Interpretação:

Quanto mais tarde um erro é encontrado, mais caro ele fica. Um bug encontrado na especificação pode ser corrigido em texto ou RTL. Um bug encontrado depois da fabricação pode exigir respin do chip, perda de prazo, falha em campo ou recall.

Por isso, verificação busca encontrar problemas o mais cedo possível.

---

### Slide 2 — Causes of Design Bugs

O slide mostra causas de bugs de design.

Pontos principais:

```text
The figure shows different categories of design flaws in FPGA.

The design flaws in ASIC are different.
More than 50% of the design flaws are logic or functional issues.
40% are clocking issues.
Remaining are timing, crosstalk, and other issues.
```

Interpretação:

A maior parte dos bugs em ASIC está ligada à lógica ou funcionalidade, mas clocking também aparece como grande causa de erro. Isso conecta com aulas anteriores sobre clock domains, clock gating, skew, timing e metastabilidade.

#### Major causes of design bugs in VLSI

O slide lista:

```text
Unspecified functionality
Conflicting requirements
Unrealized features
Verifying complete system-level functionality may be difficult due to lack of system modules
Human error in design interpretation
```

Interpretação:

Nem todo bug nasce de erro de código. Muitos surgem antes:

```text
especificação incompleta
requisitos contraditórios
recurso esquecido
interpretação humana errada
falta de modelo de sistema completo
```

Isso é importante porque a verificação não é apenas simular RTL. Ela também precisa confrontar o design com a especificação e com o comportamento esperado do sistema.

---

### Slide 3 — What is Verification?

O slide define verificação.

Pontos listados:

```text
A process used to demonstrate the functional correctness of a design.

Confirming that you are indeed implementing what you are required to implement.

Verification ensures that the result of some transformation during design flow is per the specifications.

Full conformance to specification without false positives.
```

Tradução:

```text
Verificação é um processo usado para demonstrar a correção funcional de um design.

Ela confirma que você está implementando aquilo que realmente deveria implementar.

Ela garante que o resultado de alguma transformação durante o fluxo de projeto está de acordo com as especificações.

O objetivo é conformidade completa com a especificação, sem falsos positivos.
```

#### Figuras do slide

A primeira figura mostra:

```text
Specifications → transformations → netlist
        ↖ verification ↙
```

A segunda figura mostra uma sequência de transformações:

```text
Idea
→ Algorithm
→ Architectural spec
→ RTL
→ Gate
→ GDSII
→ ASIC
→ End product
```

e abaixo aparecem atividades como:

```text
Spec assertions review
Simulation code review
Formal functional verification
Signoff review
ATE
Product acceptance test
```

Interpretação:

Durante o fluxo, o design passa por várias transformações. Em cada transformação, pode haver erro:

```text
ideia para algoritmo
algoritmo para arquitetura
arquitetura para RTL
RTL para gates
gates para GDSII
GDSII para ASIC
ASIC para produto final
```

A verificação busca garantir que cada transformação preserva a intenção da especificação.

#### Figura do testbench

A figura menor mostra um fluxo de resultado de simulação:

```text
Testbench simulation result: Pass/Fail
Pass → tape out
Fail → debug testbench ou debug RTL code
```

Ela também indica:

```text
False positive result = shipping a bad design
```

Interpretação:

Se a simulação passa, mas o design está ruim, isso é um falso positivo perigoso. Ele pode levar ao tape-out de um design incorreto.

---

### Slide 4 — Problems of Verification

O slide apresenta perguntas fundamentais da verificação:

```text
Is the specification captured correctly?

Has the designer understood the correct design specifications?

Is the implementation of the design per the correct specification?

Are the defined interfaces of the blocks correct?

Are signal transitions on the interfaces correct?

And many more on these lines.
```

Tradução:

```text
A especificação foi capturada corretamente?

O designer entendeu corretamente as especificações?

A implementação está de acordo com a especificação correta?

As interfaces dos blocos estão definidas corretamente?

As transições dos sinais nas interfaces estão corretas?

E muitas outras perguntas desse tipo.
```

Interpretação:

A verificação não pergunta apenas se a saída bate para alguns vetores. Ela questiona todo o processo:

```text
especificação
interpretação
implementação
interfaces
protocolos
transições
casos extremos
integração
```

Esse slide prepara o entendimento de que a verificação é ampla e sistemática.

---

### Slide 5 — Verification vs. Testing

O slide compara **Verification** e **Testing**.

Tabela reconstruída:

| Verification | Testing |
|---|---|
| Verifies correctness of design. | Verifies the correctness of manufactured parts. |
| Performed by simulation, hardware emulation or formal methods. | Two-step process: test generation e test application. |
| Performed prior to manufacturing during the design cycle. | Test application performed on every individual part manufactured. |
| Determines quality of the design. | Determines quality of the devices. |

No lado de testing, o slide detalha:

```text
Test generation: software process executed once during the design.

Test application: test vectors applied, and response monitored on the automatic test equipment (ATE).
```

A figura inferior mostra:

```text
Specifications → transformations → netlist → manufacturing → silicon devices
      verification                      testing
```

Interpretação:

Essa diferença é essencial:

#### Verification

Antes da fabricação:

```text
o design lógico está correto?
o RTL implementa a especificação?
a netlist é equivalente?
o protocolo funciona?
```

#### Testing

Depois da fabricação:

```text
este chip fabricado está livre de defeitos físicos?
há stuck-at, bridging, delay fault?
a peça individual passou no ATE?
```

Verificação detecta erro de projeto. Testing detecta defeito de fabricação.

---

### Slide 6 — VLSI Design Verification

O slide reforça a definição de verificação VLSI.

Pontos listados:

```text
A process used to demonstrate the functional correctness of a design.

Verification ensures that the result of some transformation during design flow
is per the specifications.

Verification is carried out using tools called simulators.
Simulators approximate real application scenario for the design.

The design goal is to develop devices from design and not the successful simulations.
Simulators are used in this process.

Simulators create an artificial environment that mimics the future application scenarios
for the designs.
```

Interpretação:

O objetivo final não é “fazer a simulação passar”. O objetivo é criar um dispositivo correto.

A simulação é uma ferramenta para aproximar os cenários reais em um ambiente artificial.

A figura mostra um fluxo VLSI:

```text
System specifications
↓
Convert to functional and performance requirements
↓
Behavioral functional design
↓
Architecture mapping (HW-SW partitioning)
↓
ASIC HW RTL design / ASIC SW functions
```

Também aparecem:

```text
Functional verification using system-level testbench
Performance verification
HW IP Library
SW IP & RTOS Library
```

Interpretação:

A verificação ocorre em vários níveis:

```text
funcional
performance
sistema
arquitetura
hardware
software
interfaces
```

Em SoCs, hardware e software podem ser verificados juntos, especialmente quando há particionamento HW/SW.

---

### Slide 7 — Simulators for Design Verification (1/2)

O slide explica o papel e as limitações dos simuladores.

#### Simuladores permitem interação antes da fabricação

```text
Simulators enable the designers to interact with the design before it is manufactured
and correct flaws and issues which could occur earlier during design phase.
```

Interpretação:

Simulação permite testar o comportamento antes de fabricar o chip ou programar o hardware final.

#### Simuladores são aproximações

```text
Simulators are only approximations of real application scenarios for the design.
```

Pontos:

```text
Many physical characteristics are simplified or even ignored.

For example, a digital simulator assumes that the only possible values for a signal are
0, 1, X, and Z.

However, in the physical and analog world, a signal can take an infinite number of values.

In a discrete simulator, events that happen deterministically in some defined time units,
like 5 ns apart, may be asynchronous in the real world and may occur at random times.
```

Interpretação:

Simuladores digitais simplificam a realidade. No mundo real, sinais têm rampas, ruído, overshoot, valores analógicos, variações e eventos assíncronos.

No simulador digital, os sinais são abstraídos em poucos estados lógicos.

#### Simuladores dependem da descrição simulada

```text
Simulators are at the mercy of the design descriptions being simulated.
```

Pontos:

```text
The design description is limited to a well-defined language with precise semantics.

If that description does not accurately reflect the reality it is trying to model,
there is no way for you to know that you are simulating something different
from the design that will be ultimately manufactured.

Functional correctness and accuracy of models is a big problem
as errors cannot be proven not to exist.
```

Interpretação:

Se o modelo está errado, o simulador apenas simula o erro de forma consistente.

Isso é uma ideia crítica:

```text
simulação correta de um modelo errado não garante design correto.
```

#### Stimulus and response

```text
Simulators are dynamic tools.
They require you to provide a facsimile of the environment in which the design finds itself.
This facsimile is often called a testbench.

They need stimulus.
The testbench needs to provide a representation of the inputs observed by the design,
so the simulator can emulate the design's responses based on its description.
```

Interpretação:

Simulador não cria automaticamente todos os cenários relevantes. O testbench precisa gerar estímulos e verificar respostas.

---

### Slide 8 — Simulators for Design Verification (2/2)

O slide continua as limitações dos simuladores.

#### Saídas são validadas externamente

```text
The simulation outputs are validated externally, against design intents.
```

Pontos:

```text
Simulators have no knowledge of your goal of verification.

They cannot determine whether a design being simulated is correct.

Correctness is a value judgment on the outcome of a simulation that must be made by you,
the designer.

Once the design is submitted to an approximation of the inputs from its environment,
your primary responsibility is to examine the outputs produced by the simulation
of the design's description and determine whether that response is appropriate and as intended.
```

Interpretação:

O simulador executa o modelo. Quem define se a resposta está correta é o engenheiro, o checker, o scoreboard ou o reference model.

Sem checker, o simulador apenas produz waveform e logs.

#### Simuladores não são rápidos

```text
Simulators are not fast.
```

Pontos:

```text
They are attempting to emulate a physical world where electricity travels at the speed of light
and transistors switch over 1 billion times in a second.

Simulators are run on general-purpose computers that can execute, under ideal conditions,
up to 100 million instructions per second.

The speed advantage is unfairly and forever tipped in favor of the physical world.
```

Interpretação:

O hardware real opera em paralelo e em alta frequência. O simulador roda em software, em processador geral, tentando imitar esse paralelismo. Por isso, simulações longas podem ser muito lentas.

#### Saídas mudam só quando entrada muda

```text
Outputs change only when an input changes.
```

Pontos:

```text
One way to optimize the performance of a simulator is to avoid simulating something
that does not need to be simulated.

Figure shows a 2-input XOR gate with different input scenarios.
In the physical world, if the inputs do not change, output does not change,
even though supply voltage is constantly applied.
C only if one of the inputs or both of them change, the output changes.
```

Interpretação:

Essa é a base da simulação orientada a eventos. Se nada muda na entrada, não há necessidade de recalcular a saída.

A figura mostra uma porta XOR com cenários:

```text
entradas estáveis → saída estável
entrada muda → saída precisa ser reavaliada
```

---

### Slide 9 — Types of Simulators (1/3)

O slide apresenta simuladores **event-based** e **cycle-based**.

#### Event-based simulators

Definição:

```text
If the change in input values, called events, drives the simulation process,
they are called event-based simulators.
```

Pontos:

```text
The simulator is made to hold the same output value if the input values did not change.

This improves the simulator's performance in terms of speed.

Do not process the model while the inputs are not changed.
Phrased another way: only execute a model when an input changes.

The simulation is driven by changes in inputs.
If you define an input change as an event, you now have an event-driven simulator.
```

Interpretação:

Simuladores event-based só reavaliam partes do design quando há eventos, ou seja, mudanças nos sinais.

Isso é eficiente porque não recalcula tudo o tempo todo.

#### Cycle-based simulators

Definição:

```text
Cycle-based simulators: In this, simulations have no timing information.
```

Pontos:

```text
Does not consider any design timing and delay information.

Cycle-based simulators assume that the entire design meets the setup-and-hold
requirements of all the flip-flops.

When using a cycle-based simulator, timing is usually verified using a static timing analyzer.

Cycle-based simulators can handle only synchronous circuits.
```

Interpretação:

Simuladores cycle-based trabalham em nível de ciclo, geralmente considerando bordas de clock ativas. Eles são mais rápidos, mas não modelam atrasos internos detalhados.

Eles assumem que timing está correto e deixam a verificação de setup/hold para STA.

---

### Slide 10 — Types of Simulators (2/3)

O slide continua cycle-based simulation.

Pontos listados:

```text
Cycle-based simulators use active clock edge as the only significant event
in changing the state of the design.

All other inputs are assumed to be in sync with the active clock edge.
Therefore, cycle-based simulators can simulate only synchronous designs.

Asynchronous logic such as latches, or multiple-clock domains cannot be simulated accurately.

The same restrictions apply to static timing analysis.
Thus, circuits which can be simulated by cycle-based simulation to verify functionality
use static timing verification to verify the timing.
```

Interpretação:

Cycle-based simulation é adequada para designs síncronos bem comportados. Ela não lida bem com:

```text
latches
lógica assíncrona
múltiplos domínios de clock
comportamento sensível a atrasos
eventos fora da borda ativa
```

#### Co-simulators

O slide diz:

```text
Co-simulators used to verify the portions of a design that do not meet the requirements
for cycle-based simulation.

Almost all simulators are integrated with an event-driven simulator.
```

Pontos:

```text
The synchronous portion of the design is simulated using the cycle-based algorithm,
while the remainder of the design is simulated using a conventional event-driven simulator.

Both simulators, event-driven and cycle-based, run together, coordinating to simulate
the entire design.
```

Interpretação:

Co-simulation combina simuladores diferentes para aproveitar vantagens de cada um:

```text
cycle-based para partes síncronas e rápidas
event-driven para partes assíncronas ou mais detalhadas
```

---

### Slide 11 — Types of Simulators (3/3)

O slide mostra outros ambientes de co-simulação.

Pontos listados:

```text
Other co-simulation environments support:
VHDL and Verilog
HDL and C
Digital and analog co-simulation
```

A figura mostra três exemplos:

#### VHDL e Verilog

```text
VHDL descriptions → VHDL Compiler → VHDL Simulator
Verilog descriptions → Verilog Compiler → Verilog Simulator
```

com integração entre simuladores.

#### HDL e C/C++

```text
HDL descriptions → HDL Compiler → HDL Simulator
C++ descriptions → C++ Compiler → C++ Execution
```

com integração entre simulação HDL e execução C++.

#### Digital e analógico

```text
HDL descriptions → HDL Compiler → HDL Simulator
Analog descriptions → Circuit Simulator
```

Interpretação:

Projetos modernos podem combinar linguagens e domínios:

```text
RTL em Verilog/SystemVerilog
modelos em VHDL
modelos de referência em C/C++
partes analógicas em simulador de circuito
```

Co-simulação permite verificar sistemas heterogêneos.

---

### Slide 12 — Verification Challenges

O slide mostra por que verificação exaustiva é impraticável.

#### 64-bit floating-point division unit

Pergunta do slide:

```text
How long does it take to verify a 64-bit floating-point division unit?
```

Cálculo:

```text
There are 2^64 * 2^64 = 2^128 test vectors.
At 1 test/µsec, it will take 10^25 years.
```

Interpretação:

Mesmo testando um vetor por microssegundo, o espaço de entrada é tão grande que verificação exaustiva é impossível.

#### 256-bit RAM

Pergunta do slide:

```text
How long does it take to verify a 256-bit RAM?
```

Cálculo:

```text
There are 2^256 = 10^80 bits to be tested.
At 1 test/ps, it will take 10^10 years to verify only 0.05% of the design.
```

Interpretação:

O número de estados possíveis explode. Isso mostra que testar todas as combinações não é uma estratégia viável.

#### Conclusões do slide

```text
Verification using all the possible input combinations is not practical.

Need different combinations of different techniques to completely verify the design fully.
```

Interpretação:

É necessário combinar:

```text
directed tests
random tests
constrained random
formal methods
coverage
assertions
scoreboards
reference models
static analysis
emulation
```

---

### Slide 13 — Coverage Driven Verification (1/3)

O slide introduz **Coverage Driven Verification**, CDV.

Pontos listados:

```text
Today's complex designs have hundreds of IP cores developed in-house
and third-party off-the-shelf IPs integrated.

It is impossible to verify all the use case scenarios by targeted test cases.
Hence, random simulation vectors are used to detect design issues in complex designs.

This requires a measure of design verification coverage so that uncovered designs
can further be targeted, this is called coverage driven verification.
```

Interpretação:

Como não dá para escrever teste dirigido para todos os casos, usa-se randomização. Mas randomização sem métrica não basta. É preciso medir o que foi coberto.

#### Design coverage

```text
Design coverage is a figure of merit of verification quality.
There are many types of design coverages used for this purpose.
They are:
Functional Coverage
Code Coverage
  Statement or Block Coverage
  Path Coverage
  Expression Coverage
```

Interpretação:

Coverage é uma métrica de qualidade da verificação. Ela mostra o que já foi exercitado e o que ainda falta.

#### Verification languages

O slide diz:

```text
Verification languages can raise the level of abstraction.

Best way to increase productivity is to raise the level of abstraction used to perform a task.

VHDL and Verilog are design languages, not verification languages.
But they are used for simulation in simpler designs.
```

Interpretação:

Linguagens e metodologias de verificação aumentam a abstração, permitindo escrever testbenches mais produtivos. VHDL e Verilog podem ser usados para simulação simples, mas SystemVerilog/UVM e linguagens de verificação oferecem recursos mais avançados.

---

### Slide 14 — Coverage Driven Verification (2/3)

O slide aprofunda **functional coverage**.

Definição:

```text
Functional coverage is code that observes execution of a test plan.
```

Explicação:

```text
As such, it is code you write to track whether important values, sets of values,
or sequences of values that correspond to design or interface requirements,
features, or boundary conditions have been exercised.
```

Interpretação:

Functional coverage mede se os cenários importantes do plano de verificação aconteceram.

Não é gerada automaticamente apenas a partir do RTL. O engenheiro escreve cobertura com base nos requisitos.

#### 100% functional coverage

```text
Specifically, 100% functional coverage indicates that all items in the test plan
have been tested.

Combine this with 100% code coverage and it indicates that testing is done.
```

Interpretação:

O slide apresenta a visão de que 100% functional coverage + 100% code coverage é um forte indicador de conclusão, desde que o plano de cobertura esteja correto.

#### Point/item coverage

```text
Functional coverage that examines the values within a single object is called
either point coverage or item coverage.
```

Exemplo:

```text
observar tamanhos de transferência em um barramento baseado em pacotes:
1, 2, 3, 4 to 127, 128 to 252, 253, 254, 255
```

Interpretação:

Point coverage mede valores individuais ou faixas de valores de um item.

#### Cross coverage

```text
Functional coverage that examines the relationships between different objects
is called cross coverage.
```

Exemplo:

```text
examinar se uma ALU realizou todas as operações suportadas com todos os pares
de registradores de entrada.
```

Interpretação:

Cross coverage mede combinações.

Exemplo:

```text
opcode × register_pair
operation × burst_size
address_region × access_type
```

#### OSVVM e cobertura

O slide diz:

```text
VHDL's Open Source VHDL Verification Methodology (OSVVM) provides a package,
CoveragePkg, with a protected type that facilitates capturing the data structure
and writing functional coverage.
```

Interpretação:

OSVVM fornece suporte de cobertura funcional para VHDL.

#### Suplemento aos métodos de teste

```text
Functional coverage provides additional supporting data that the design is tested.

It is a supplement to primitive testing directed, algorithmic, file based,
or constrained random test methods.
```

Interpretação:

Functional coverage não substitui testes. Ela complementa os testes, dizendo se os objetivos foram exercitados.

---

### Slide 15 — Coverage Driven Verification (3/3)

O slide aprofunda **code coverage**.

Definição:

```text
HDL simulators can automatically calculate a metric called code coverage
(might need licenses for this tool feature).
```

Pontos listados:

```text
Code coverage tracks what lines of code or expressions in the code have been exercised.

Code coverage cannot detect conditions that are not in the code.

Code coverage on a partially implemented design can reach 100%.

It cannot detect missing features and many boundary conditions,
those that span more than one block.
```

Interpretação:

Code coverage mede execução do código existente. Mas se uma feature não foi implementada, não existe código para ela, então code coverage não percebe a ausência.

Exemplo:

```text
se o RTL não implementa modo de erro,
code coverage pode chegar a 100% mesmo sem testar modo de erro,
porque o modo de erro nem existe no código.
```

#### Code coverage como métrica otimista

O slide diz:

```text
Code coverage is an optimistic metric.
In combinational logic code in an HDL, a process may be executed many times
during a given clock cycle due to delta cycle changes on input signals.

This can result in several different branches of code being executed.
However, only the last branch of code executed before the clock edge truly has been covered.

Hence, code coverage cannot be used exclusively to indicate we are done testing.
```

Interpretação:

Code coverage pode superestimar a verificação. Em lógica combinacional, delta cycles podem executar branches que não representam uma condição funcional relevante capturada pelo design.

Conclusão central:

```text
code coverage sozinha não prova que a verificação acabou.
```

Ela deve ser combinada com functional coverage, plano de verificação, checkers, assertions e análise de resultados.

---

## Aula didática desenvolvida

### 1. Por que verificação é necessária?

Em VLSI, custo e complexidade tornam o erro muito caro.

Um bug no começo do fluxo pode ser corrigido rapidamente. Um bug após fabricação pode exigir:

```text
novo tape-out
novo lote de máscaras
atraso de mercado
perda de confiança
falha em campo
recall
risco em aplicações críticas
```

A verificação existe para evitar que erros de especificação, interpretação, implementação e integração cheguem ao produto.

---

### 2. Verificação é diferente de “rodar simulação”

Simulação é uma ferramenta. Verificação é um processo.

Você pode rodar simulação sem verificar direito se:

```text
não há checker
não há scoreboard
não há cobertura
não há plano de teste
não há análise de corner cases
não há reference model
```

Verificação exige intenção:

```text
o que quero provar ou demonstrar?
qual requisito estou testando?
qual resposta esperada?
como sei que exercitei o cenário?
como sei que não tive falso positivo?
```

---

### 3. O risco do falso positivo

Um falso positivo ocorre quando a simulação passa, mas o design está errado.

Isso é perigoso porque dá confiança falsa.

Causas possíveis:

```text
testbench errado
checker incompleto
cenário não exercitado
reference model errado
coverage mal definida
bug em requisito ausente
simulação simplificada demais
```

A figura do slide mostra que um falso positivo pode levar a “shipping a bad design”.

---

### 4. Verificação acompanha transformações

Durante o fluxo, o design é transformado várias vezes:

```text
ideia → algoritmo → arquitetura → RTL → gates → GDSII → ASIC → produto
```

Cada transformação precisa ser verificada.

Exemplos:

```text
algoritmo implementa a ideia?
arquitetura implementa o algoritmo?
RTL implementa a arquitetura?
netlist implementa o RTL?
layout implementa a netlist?
chip fabricado atende ao produto?
```

Essa visão conecta verificação funcional, equivalência formal, LVS, STA, ATE e validação de produto.

---

### 5. Verification versus testing

A diferença é muito importante no curso.

#### Verification

Pergunta:

```text
O design está correto?
```

Acontece antes da fabricação.

Técnicas:

```text
simulação
emulação
formal methods
coverage
assertions
scoreboards
```

#### Testing

Pergunta:

```text
Esta peça fabricada está correta?
```

Acontece depois da fabricação.

Técnicas:

```text
ATPG
scan test
BIST
ATE
production test
fault models
```

Verificação encontra bugs de design. Testing encontra defeitos de fabricação.

---

### 6. Simuladores são modelos, não realidade

Simuladores digitais trabalham com abstrações:

```text
0
1
X
Z
tempo discreto
eventos
delays modelados
```

O mundo real tem:

```text
tensão contínua
ruído
variação de processo
temperatura
jitter
metastabilidade
crosstalk
efeitos analógicos
```

Por isso, simulação funcional é necessária, mas não suficiente para todos os aspectos de um chip.

---

### 7. O simulador não sabe sua intenção

O simulador não sabe se a saída deveria ser 1 ou 0. Ele apenas calcula a resposta do modelo.

Quem sabe a intenção é:

```text
a especificação
o testbench
o checker
o scoreboard
o reference model
o engenheiro
```

Por isso, uma waveform bonita não basta. É preciso checagem automática sempre que possível.

---

### 8. Testbench é o ambiente artificial do design

O testbench imita o ambiente futuro do DUT.

Ele fornece:

```text
clock
reset
estímulos
transações
modelos externos
memórias
drivers
monitores
checkers
scoreboards
coverage
```

Quanto melhor o testbench representa o ambiente real, mais útil é a simulação.

---

### 9. Event-based simulation

Event-based simulation é natural para HDL.

Ela reavalia blocos quando sinais mudam.

Exemplo:

```systemverilog
always_comb begin
  y = a ^ b;
end
```

Esse bloco só precisa ser reavaliado quando `a` ou `b` mudam.

Vantagens:

```text
mais fiel a eventos e delays
lida melhor com lógica assíncrona
adequado para RTL geral
```

Desvantagens:

```text
pode ser mais lento que cycle-based
muitos eventos podem tornar simulação pesada
```

---

### 10. Cycle-based simulation

Cycle-based simulation simplifica a simulação para bordas de clock.

Ela assume que:

```text
o design é síncrono
inputs estão sincronizados com o clock
setup/hold são atendidos
timing será verificado por STA
```

Vantagens:

```text
mais rápida
boa para designs grandes síncronos
```

Desvantagens:

```text
não modela delays internos
não lida bem com lógica assíncrona
não lida bem com múltiplos clocks complexos
```

---

### 11. Co-simulation

Co-simulation combina mundos.

Exemplos:

```text
VHDL + Verilog
HDL + C/C++
digital + analógico
cycle-based + event-driven
```

Isso permite verificar sistemas onde diferentes partes são modeladas em diferentes linguagens ou níveis de abstração.

Exemplo:

```text
DUT em RTL
modelo de referência em C++
interface analógica em SPICE/circuit simulator
testbench em SystemVerilog
```

---

### 12. Por que verificação exaustiva é impossível?

O espaço de combinações cresce exponencialmente.

Para duas entradas de 64 bits:

```text
2^64 × 2^64 = 2^128 combinações
```

Isso é impossível de simular exaustivamente.

Logo, a estratégia precisa ser inteligente:

```text
testar cenários representativos
testar corner cases
usar randomização com constraints
usar formal onde aplicável
medir coverage
usar checkers/assertions
priorizar riscos
```

---

### 13. Coverage Driven Verification

Coverage Driven Verification é usar cobertura para guiar a verificação.

Fluxo:

```text
definir plano de verificação
criar coverage points
rodar testes
medir coverage
identificar buracos
criar novos testes ou ajustar constraints
rodar novamente
```

O objetivo é transformar verificação em um processo mensurável.

---

### 14. Functional coverage

Functional coverage responde:

```text
os cenários importantes da especificação aconteceram?
```

Exemplo para ALU:

```text
testei ADD?
testei SUB?
testei AND?
testei OR?
testei overflow?
testei zero?
testei cada operação com registradores diferentes?
```

Functional coverage é escrita pelo engenheiro com base no plano de verificação.

---

### 15. Code coverage

Code coverage responde:

```text
o código foi executado?
```

Tipos citados:

```text
statement/block coverage
path coverage
expression coverage
```

É útil para encontrar partes do RTL não exercitadas.

Mas não detecta:

```text
feature ausente
requisito não implementado
cenário funcional não descrito no código
condição de fronteira entre blocos
checker errado
```

Por isso, code coverage é necessária, mas não suficiente.

---

## Conceitos difíceis explicados em profundidade

### 1. Erro de especificação versus erro de implementação

#### Erro de especificação

A especificação está incompleta, contraditória ou errada.

Exemplo:

```text
o protocolo não diz o que acontece se req cair antes de ack
```

#### Erro de implementação

A especificação está correta, mas o RTL implementa errado.

Exemplo:

```text
a especificação diz ack em 1 a 3 ciclos,
mas o RTL gera ack depois de 5 ciclos
```

A verificação precisa lidar com os dois, mas erro de especificação é mais perigoso porque pode fazer o design inteiro parecer correto contra uma especificação ruim.

---

### 2. Falso positivo e falso negativo

#### Falso positivo

Teste passa, mas design está errado.

Risco:

```text
bug escapa para tape-out
```

#### Falso negativo

Teste falha, mas design está correto.

Causas:

```text
testbench errado
checker errado
referência errada
restrição irrealista
```

Ambos são ruins. Falso positivo é especialmente perigoso porque dá confiança falsa.

---

### 3. Por que clocking bugs são tão comuns?

Clocking envolve:

```text
múltiplos clocks
reset
clock gating
clock domain crossing
skew
jitter
metastability
setup/hold
```

Esses problemas podem ser intermitentes e difíceis de reproduzir. Por isso o slide destaca que cerca de 40% dos flaws em ASIC podem ser clocking issues.

---

### 4. Por que simular todas as combinações não funciona?

Mesmo designs pequenos têm espaços enormes.

Exemplo:

```text
entrada A de 32 bits
entrada B de 32 bits
operação de 4 bits
```

Combinações:

```text
2^32 × 2^32 × 2^4 = 2^68
```

Isso já é impraticável.

A verificação moderna usa cobertura para saber se testou o que importa, em vez de testar tudo cegamente.

---

### 5. Coverage não prova ausência de bugs

Coverage mede se algo foi exercitado. Ela não prova que está correto.

Exemplo:

```text
cobri todos os opcodes,
mas meu scoreboard estava errado.
```

Ou:

```text
cobri todas as linhas,
mas não cobri a combinação opcode × estado × reset.
```

Coverage precisa ser combinada com checkers.

---

### 6. Functional coverage depende da qualidade do plano

Se o plano de verificação esquece um requisito, a functional coverage pode chegar a 100% mesmo assim.

Exemplo:

```text
plano não inclui reset durante transação
coverage chega a 100%
bug de reset durante transação escapa
```

Portanto, a qualidade da coverage depende da qualidade do test plan.

---

### 7. Code coverage pode ser 100% em design incompleto

Se uma feature não foi implementada, não há código correspondente.

O simulador pode dizer:

```text
100% das linhas existentes foram executadas
```

Mas a feature faltante continua ausente.

Por isso o slide afirma que code coverage em design parcialmente implementado pode chegar a 100%.

---

### 8. Delta cycles e code coverage otimista

Em HDL, processos combinacionais podem executar várias vezes no mesmo tempo de simulação por causa de delta cycles.

Isso pode fazer diferentes branches serem executados durante a estabilização.

Mas o que importa funcionalmente pode ser apenas o valor final capturado na borda de clock.

Por isso code coverage pode contar execução de branch que não corresponde a um cenário funcional real.

---

### 9. Point coverage versus cross coverage

#### Point coverage

Mede valores de um item isolado.

Exemplo:

```text
burst_size = 1, 2, 4, 8, 16
```

#### Cross coverage

Mede combinações entre itens.

Exemplo:

```text
opcode × burst_size
read/write × address_region
operation × register_pair
```

Cross coverage é importante porque cobrir valores individualmente não garante cobrir combinações.

---

### 10. Simulador rápido não substitui verificação completa

Cycle-based simulation pode acelerar regressões, mas deixa timing para STA e não captura certos comportamentos assíncronos.

Event-based simulation é mais detalhada, mas mais lenta.

Co-simulation permite combinar abordagens.

A escolha depende do objetivo:

```text
funcionalidade
timing
múltiplos clocks
software integrado
analógico/digital
desempenho de simulação
```

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — Need for VLSI Design Verification

A primeira metade da página mostra exemplos de falhas históricas e uma curva de custo que cresce conforme o bug avança no fluxo. Essa figura reforça que debug tardio é muito caro.

### Página 1 — Causes of Design Bugs

A segunda metade mostra categorias de flaws em FPGA e lista causas de bugs em VLSI. O ponto mais importante é que bugs funcionais/lógicos e clocking issues dominam os problemas.

### Página 2 — What is Verification?

A figura mostra a ideia de transformação durante o design flow e a verificação comparando resultado com especificação. A figura inferior mostra a sequência de ideia até produto final, com verificação em múltiplas fases.

### Página 2 — Problems of Verification

A lista de perguntas mostra que verificação envolve especificação, interpretação, implementação, interfaces e transições de sinais.

### Página 3 — Verification vs. Testing

A tabela é central: verification verifica design antes da fabricação; testing verifica peças fabricadas depois. A figura inferior mostra verification antes da manufacturing e testing depois da netlist virar silicon devices.

### Página 3 — VLSI Design Verification

A figura mostra o fluxo de system specifications até HW/SW partitioning, RTL e funções de software, com functional e performance verification.

### Página 4 — Simulators 1/2 e 2/2

Esses slides explicam limitações dos simuladores: aproximação do mundo real, dependência do modelo, necessidade de testbench e validação externa dos outputs.

### Página 5 — Types of Simulators 1/3 e 2/3

A página explica event-based e cycle-based simulators. A figura mostra a combinação de event-driven simulator e cycle-based simulator para diferentes porções do design.

### Página 6 — Types of Simulators 3/3 e Verification Challenges

A página mostra co-simulation entre VHDL/Verilog, HDL/C++ e digital/analógico. A segunda metade mostra a explosão combinatória dos vetores de teste.

### Página 7 — Coverage Driven Verification 1/3 e 2/3

A página apresenta coverage driven verification, functional coverage, code coverage e cross coverage. O ponto central é que cobertura mede qualidade de verificação e ajuda a direcionar testes.

### Página 8 — Coverage Driven Verification 3/3

A página aprofunda code coverage e suas limitações, especialmente a impossibilidade de usar code coverage exclusivamente como critério de fim de teste.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Por que VLSI design verification é necessária?**  
   Porque o custo e a complexidade de designs VLSI tornam essencial encontrar bugs antes da fabricação e garantir first-time success e field success.

2. **Quais exemplos históricos aparecem como motivação?**  
   Falha da missão de Marte da NASA por unidades de medida e Ariane-5 Flight 501 por exceção em conversão de dados.

3. **Quais são grandes causas de bugs em VLSI?**  
   Funcionalidade não especificada, requisitos conflitantes, features não realizadas, dificuldade de verificar funcionalidade de sistema completo e erro humano de interpretação.

4. **O que é verification?**  
   Processo usado para demonstrar a correção funcional de um design.

5. **O que verification confirma?**  
   Que o design implementa aquilo que deveria implementar conforme a especificação.

6. **O que é falso positivo no contexto do slide?**  
   Resultado de simulação que passa, mas leva ao envio/tape-out de um design ruim.

7. **Qual a diferença entre verification e testing?**  
   Verification verifica a correção do design antes da fabricação; testing verifica a correção das peças fabricadas.

8. **Quais métodos podem realizar verification?**  
   Simulação, emulação de hardware e métodos formais.

9. **Testing é realizado em que momento?**  
   Depois da manufatura, em cada peça fabricada, normalmente com ATE.

10. **Qual é o objetivo de simuladores em verificação?**  
    Criar um ambiente artificial que aproxima cenários reais de aplicação para observar respostas do design.

11. **Por que simuladores são apenas aproximações?**  
    Porque simplificam características físicas e modelam sinais digitais com valores discretos como 0, 1, X e Z.

12. **O simulador sabe se o design está correto?**  
    Não. A correção é julgada externamente contra a intenção/especificação.

13. **O que é testbench?**  
    Um ambiente artificial que fornece estímulos e imita o contexto em que o design irá operar.

14. **O que é event-based simulator?**  
    Simulador em que mudanças de entrada, chamadas eventos, dirigem o processo de simulação.

15. **Qual é a ideia principal do event-based simulator?**  
    Só executar/reavaliar o modelo quando uma entrada muda.

16. **O que é cycle-based simulator?**  
    Simulador que usa a borda ativa de clock como evento significativo e não considera timing/delays detalhados.

17. **Cycle-based simulators assumem o quê?**  
    Que o design atende setup e hold de todos os flip-flops.

18. **Cycle-based simulators são adequados para quais designs?**  
    Apenas circuitos síncronos.

19. **Que tipos de lógica não são simulados com precisão por cycle-based simulators?**  
    Latches, lógica assíncrona e múltiplos domínios de clock.

20. **O que é co-simulation?**  
    Uso conjunto de simuladores/ambientes diferentes, como VHDL+Verilog, HDL+C ou digital+analógico.

21. **Por que verificação exaustiva não é prática?**  
    Porque o número de combinações de entrada cresce exponencialmente.

22. **Quantos vetores existem para duas entradas de 64 bits no exemplo de divisão floating-point?**  
    `2^64 × 2^64 = 2^128`.

23. **O que é Coverage Driven Verification?**  
    Processo que usa métricas de cobertura para direcionar testes e mirar partes ainda não exercitadas do design.

24. **Quais tipos de coverage são citados?**  
    Functional coverage e code coverage, incluindo statement/block, path e expression coverage.

25. **O que é functional coverage?**  
    Código escrito para observar se valores, sequências e condições importantes do plano de teste foram exercitados.

26. **O que é point/item coverage?**  
    Functional coverage de valores dentro de um único objeto.

27. **O que é cross coverage?**  
    Cobertura de relações ou combinações entre objetos diferentes.

28. **O que é code coverage?**  
    Métrica automática que rastreia quais linhas, expressões ou blocos de código foram exercitados.

29. **Por que code coverage não basta?**  
    Porque não detecta features ausentes, condições não presentes no código nem muitos casos de fronteira entre blocos.

30. **Qual conclusão final sobre code coverage aparece no slide?**  
    Code coverage não pode ser usada exclusivamente para indicar que terminamos os testes.

### Pegadinhas

- Verification e testing não são a mesma coisa.
- Verification verifica o design; testing verifica peças fabricadas.
- Simulação passar não significa automaticamente que o design está correto.
- O simulador não conhece sua intenção de verificação.
- Um modelo errado pode simular perfeitamente, mas continuar errado.
- Event-based simulation é dirigida por mudanças de entrada.
- Cycle-based simulation não considera timing/delay detalhado.
- Cycle-based simulation só serve bem para designs síncronos.
- Verificação exaustiva por todas as combinações é impraticável.
- Functional coverage mede plano de teste, não linhas de código.
- Code coverage mede execução do código existente, mas não requisitos ausentes.
- 100% code coverage pode ocorrer em um design incompleto.
- Coverage não substitui checkers/scoreboards.
- Cross coverage é necessária quando combinações importam.

### Frases para memorizar

```text
Verification demonstra a correção funcional do design.
Testing verifica peças fabricadas.
Simuladores aproximam cenários reais, mas não conhecem a intenção do projeto.
Testbench fornece estímulos e ambiente artificial ao DUT.
Event-based simulation executa quando há eventos.
Cycle-based simulation usa bordas de clock e assume timing correto.
Verificação exaustiva não é prática.
Coverage Driven Verification usa cobertura para guiar testes.
Functional coverage mede se o plano de teste foi exercitado.
Code coverage mede se o código existente foi executado.
Code coverage sozinha não indica fim da verificação.
```

---

## Relação com projeto/laboratório

Esta aula prepara a base para entender os próximos blocos de verificação.

### Em um fluxo real

Você terá:

```text
DUT
testbench
stimulus
driver
monitor
checker
scoreboard
reference model
coverage
assertions
simulator
waveform/debug
```

### Perguntas que devem guiar a verificação

```text
Qual requisito estou verificando?
Qual cenário preciso exercitar?
Qual resposta é esperada?
Como o testbench detecta erro?
Qual coverage prova que o cenário aconteceu?
O bug seria detectado automaticamente ou só olhando waveform?
Existe risco de falso positivo?
```

### Exemplo simples

Para uma ALU, não basta testar algumas operações.

Um plano melhor inclui:

```text
todas as operações
operandos zero
operandos máximos
overflow
underflow
sinal negativo
flags
combinações operação × registradores
reset
operações inválidas
```

Functional coverage mede esses objetivos. Code coverage mede se o RTL foi executado.

### Checklist prático

- [ ] A especificação está clara?
- [ ] Os requisitos conflitantes foram resolvidos?
- [ ] O testbench representa o ambiente real?
- [ ] Existem checkers automáticos?
- [ ] Existe scoreboard ou reference model?
- [ ] A coverage funcional cobre o plano de teste?
- [ ] A code coverage está alta?
- [ ] Existem cenários não cobertos?
- [ ] Há múltiplos clocks ou lógica assíncrona?
- [ ] O tipo de simulador escolhido é adequado?
- [ ] A simulação não está apenas “passando” sem verificar nada?

---

## Necessidade de áudio

**Médio.**

Os prints deixam claro o conteúdo central, mas a fala do professor poderia ajudar especialmente em:

- exemplos detalhados das falhas históricas;
- interpretação da curva de custo de debug;
- diferenças práticas entre simuladores event-based e cycle-based;
- exemplos de false positive;
- como o curso espera relacionar 100% functional coverage + 100% code coverage com conclusão de teste;
- possíveis questões específicas do banco sobre code coverage como métrica otimista.

Mesmo sem áudio, os conceitos fundamentais do bloco estão bem definidos pelos slides.

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Diferença entre verification e testing foi destacada.
- [x] Tipos de simuladores foram diferenciados.
- [x] Coverage driven verification foi explicada com cuidado.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado seguindo o roteiro.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 024 — 02 Verification Methodology**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\02 Verification Methodology.docx
```

Faixa:

```text
Slides 1-6
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\02 Verification Methodology.md
```
