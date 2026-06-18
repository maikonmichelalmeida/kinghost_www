# 04 High-Level Synthesis (HLS) for Power Optimization

## Controle do bloco

- **Bloco:** 021
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.docx`
- **Faixa processada:** slides 1-8
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim até o bloco atual. O arquivo atual não mostra a tela final de sequência; portanto, a próxima sugestão deve ser confirmada no roteiro antes de anexar o próximo DOCX.
- **Próximo bloco recomendado:** confirmar no roteiro antes de anexar o próximo arquivo.
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco continua o tema de HLS, mas agora com foco em **otimização de potência**, principalmente **clock gating**, redução de tensão, glitch power, clock skew, clock domains, metastability, sincronização entre domínios de clock e boas práticas para ASIC/FPGA.

---

## Resumo executivo

Esta aula explica como a otimização de potência aparece no projeto digital, especialmente no contexto de HLS/RTL synthesis. A ideia central é que uma parte importante da potência em CMOS é **potência dinâmica**, causada pela carga e descarga de capacitâncias parasitas de portas e interconexões metálicas.

O slide apresenta uma fórmula simplificada:

```text
P = V · C · f
```

com:

```text
V = tensão de alimentação
C = capacitância acumulada relacionada ao número de gates chaveando
f = frequência de chaveamento, diretamente ligada à frequência de clock
```

Tecnicamente, a forma clássica da potência dinâmica é:

```text
Pdyn ≈ α · C · V² · f
```

Mas, para o curso, o ponto cobrado é: reduzir potência dinâmica significa reduzir um ou mais fatores associados a **tensão**, **capacitância**, **frequência** e **atividade de chaveamento**.

A técnica mais enfatizada é **clock gating**, que desativa o clock de blocos ou partes do datapath quando eles não estão em uso. Como o clock alterna continuamente e dirige muitos flip-flops, bloquear o clock de regiões inativas pode economizar bastante potência.

A aula também aborda:

```text
redução de tensão de alimentação;
uso de flip-flops dual-edge para reduzir frequência;
glitch power;
reestruturação de muxes para evitar glitches;
clock gating com enable;
integrated clock gate cells;
efeito de clock skew;
clock domains;
metastability;
sincronização com double flip-flops;
sincronização usando asynchronous FIFO;
boas práticas de clock gating para ASIC e FPGA.
```

O ponto prático mais importante é:

```text
Clock gating economiza potência, mas mexe em clock.
Mexer em clock pode criar problemas de skew, domínios de clock e metastabilidade.
Por isso, clock gating deve ser feito com células apropriadas, análise de timing e boas práticas.
```

---

## Texto extraído e organizado por slide

### Slide 1 — Understanding Design Power Optimization (1/7)

O slide introduz a otimização de potência no design.

#### Dynamic power

Pontos listados:

```text
Dynamic power is due to the charging and discharging of parasitic capacitances
of gates and metal interconnects in CMOS devices.
```

Tradução:

```text
A potência dinâmica ocorre por causa da carga e descarga das capacitâncias
parasitas de gates e interconexões metálicas em dispositivos CMOS.
```

O slide mostra a equação geral:

```text
P = V · C · f
```

com:

```text
V is the power supply.
C is cumulative capacitance related to number of gates toggling at any point of time.
f is switching frequency, which is directly due to clock frequency.
```

Interpretação:

A potência dinâmica cresce quando:

- a tensão de alimentação aumenta;
- a capacitância chaveada aumenta;
- a frequência aumenta;
- mais gates alternam ao mesmo tempo.

Em forma técnica mais completa, a equação costuma ser:

```text
Pdyn ≈ α · C · V² · f
```

onde `α` é a atividade de chaveamento. O slide simplifica a equação, mas o raciocínio é o mesmo: reduzir potência significa reduzir atividade, capacitância, tensão ou frequência.

O slide também afirma:

```text
All power reduction techniques deals with reducing one or more of these parameters.
```

Tradução:

```text
Todas as técnicas de redução de potência lidam com a redução de um ou mais desses parâmetros.
```

#### Clock gating

O slide afirma:

```text
Clock gating is the most used power optimization technique in digital circuits.
```

Pontos listados:

```text
Involves disabling clock to the blocks or parts of data path of circuit blocks when not used.
Because dynamic power is proportional to the clock, power saving is guaranteed.
As in example shown, the bottom part of logic is made to run on gated clock,
and when not used, the clk_enable signal is disabled to block the clock.
```

Interpretação:

Clock gating corta o clock de uma região quando ela não precisa operar.

Sem clock gating:

```text
flip-flops continuam recebendo bordas de clock
mesmo que seus dados não mudem de forma útil
```

Com clock gating:

```text
quando clk_enable = 0
o clock não chega ao bloco
os flip-flops não comutam
a lógica associada tende a chavear menos
```

A figura mostra um design dividido em uma parte com clock normal e outra parte com **gated clock**, controlada por `clk_enable`.

---

### Slide 2 — Understanding Design Power Optimization (2/7)

O slide aborda três temas:

```text
reducing supply voltage
dual-edge-triggered flip-flops
glitch power
```

#### Reducing supply voltage

Pontos listados:

```text
Power dissipation has quadratic relationship with the supply voltage,
hence reducing supply voltage gives significant power reduction.

Reducing power also reduces the speed performance of the design.
So careful consideration is essential in applying this technique for power reduction.

Also, timing analysis for maximum timing performance to be run at lowest power supply level.
```

Interpretação:

A redução de tensão é poderosa porque potência dinâmica depende quadraticamente de `V`.

Forma clássica:

```text
Pdyn ≈ α · C · V² · f
```

Se `V` diminui, a potência cai bastante. Porém, a velocidade dos transistores também cai, aumentando atrasos e dificultando timing.

Por isso, quando se usa baixa tensão, é necessário rodar timing no pior cenário de desempenho:

```text
menor tensão
pior processo
pior temperatura, dependendo do corner
```

O slide destaca que a análise de timing de máximo desempenho deve ser feita no menor nível de tensão de alimentação.

#### Dual-edge-triggered flip-flops

O slide diz:

```text
If the technology library supports dual-edge-triggered flip flops,
they can be used to make the design work at half the frequency
and hence reduce toggle count.
```

Interpretação:

Flip-flops dual-edge capturam dados tanto na borda de subida quanto na borda de descida.

Isso permite, em alguns casos, transferir a mesma quantidade de dados usando metade da frequência de clock.

Menor frequência significa menor potência dinâmica, pois:

```text
Pdyn ∝ f
```

Mas essa técnica depende da biblioteca e exige cuidado com timing, duty cycle e disponibilidade de células.

#### Glitch power

O slide define glitch como:

```text
Glitch is a design hazard or undesirable transition that occurs before
the signal settles in correct value.
```

Tradução:

```text
Glitch é um hazard de projeto ou transição indesejada que ocorre antes de
o sinal se estabilizar no valor correto.
```

Pontos listados:

```text
Glitches get propagated in both data or control paths in the designs.
This contributes to significant amount of power dissipation in the design.
Glitches are avoided if the signal paths are balanced and arrive at the same time.
```

Interpretação:

Mesmo quando a saída final de uma lógica deveria mudar apenas uma vez, diferenças de atraso entre caminhos podem causar transições temporárias.

Essas transições consomem potência porque também carregam e descarregam capacitâncias.

#### RTL transformations to reduce glitches

O quadro vermelho lista transformações em RTL usadas para reduzir glitches:

```text
Restructuring multiplexer circuits for control paths.
Clocking control signals before using them.
Using special cells such as integrated gated clocks.
Increase in design resources might not always increase power consumption.
Balancing signal paths might reduce power consumption.
RTL data path transformations with balanced signals are preferred for low power.
```

Interpretação:

Glitches podem ser reduzidos por:

- balanceamento de caminhos;
- registrar sinais de controle;
- reestruturar muxes;
- usar células apropriadas de clock gating;
- transformar datapaths para reduzir caminhos desequilibrados.

Um ponto interessante do slide:

```text
mais recursos nem sempre significam mais potência
```

Às vezes, adicionar lógica ou registradores reduz glitching e diminui potência total.

---

### Slide 3 — Understanding Design Power Optimization (3/7)

O slide aprofunda glitch avoidance e clock gating.

#### Reestruturação de muxes

O slide diz:

```text
Restructuring multiplexer circuits for control paths.
As shown in the figure, if the signal sel_aorb_once is glitchy,
multiplexer control signal restructuring can be done to avoid glitch
without affecting the functionality of the circuit.
```

Interpretação:

Muxes são muito sensíveis a glitches nos sinais de seleção. Se o select de um mux oscila temporariamente, a saída pode alternar indevidamente, causando potência extra e possivelmente comportamento incorreto se for capturada por registradores.

A figura compara uma lógica de mux original com uma versão reestruturada para evitar glitch no caminho de controle.

#### Clocking control signals

O slide diz:

```text
Clocking control signals as shown in Figure 2.
```

Interpretação:

Registrar sinais de controle antes de usá-los pode estabilizar esses sinais e evitar glitches.

Em vez de usar um sinal combinacional diretamente como controle, ele pode ser capturado em um flip-flop antes de controlar muxes ou clock gates.

#### Clock gating e sinais assíncronos

O slide diz:

```text
Clock gating is a common technique for reducing clock power by shutting off
the clock to modules by a clock enable signal.

Gating clock generates glitch as clock enable signals are asynchronous signals.
```

Interpretação:

Se o clock for simplesmente combinado com um enable por uma porta AND ou OR, e o enable mudar perto de uma borda de clock, pode aparecer um pulso estreito ou glitch no clock.

Isso é perigoso porque clock deve ser limpo e controlado.

#### Skew causado por clock gating

O slide diz:

```text
Clock tree in designs with clock gating logic adds extra skew complicating the problem.
```

Interpretação:

Adicionar lógica no caminho do clock pode alterar atrasos de clock. Se alguns flip-flops recebem clock gated e outros recebem clock normal, a diferença de atraso pode aumentar o clock skew.

#### Integrated Clock Gate Cells — ICG

O slide diz:

```text
To avoid this problem, special cells called integrated clock gate cells are used in the design.
An integrated clock gate (ICG) is shown in Figure 3.

ICG filters out clock glitches from the clock tree.
Provides stable clock by latching it at the right time.
ICG is available as a library cell.
```

Interpretação:

Em ASIC, não se recomenda criar clock gating manual com portas lógicas comuns.

O correto é usar células dedicadas de clock gating, como ICG cells.

Essas células normalmente incluem:

```text
latch interno para o enable
porta lógica de gating
estrutura caracterizada para timing
modelo de biblioteca
checagens específicas de clock gating
```

O latch interno segura o enable em momento seguro, evitando glitches no clock.

---

### Slide 4 — Understanding Design Power Optimization (4/7)

O slide explica o efeito de **clock skew**.

Título:

```text
Effect of clock skew in designs
```

Pontos listados:

```text
In digital designs, clock signal is expected to reach all flip flop clock inputs points
at same time all the time. But in practice, due to sub-micron interconnect issues,
it is not a practical expectation.

Depending on the path delays of ΔL and ΔC in the circuit example,
the data latched in the second flip-flop changes.

This unpredictable behavior of the design can be catastrophic to the design
and hence clock skew must be addressed during the design carefully.
```

Interpretação:

Idealmente, todos os flip-flops deveriam receber a borda de clock ao mesmo tempo. Na prática, isso não ocorre porque os caminhos de clock têm atrasos diferentes.

A figura mostra:

- um clock gated passando por lógica de enable;
- flip-flops em sequência;
- lógica combinacional entre eles;
- atrasos marcados como `ΔL` e `ΔC`.

A diferença entre o atraso do caminho de dados e o atraso do caminho de clock altera o tempo efetivo disponível para captura.

Clock skew pode causar:

```text
setup violation
hold violation
captura de dado errado
comportamento não determinístico
falha funcional
```

Este slide conecta clock gating com risco temporal: economizar potência mexendo no clock exige cuidado rigoroso de timing.

---

### Slide 5 — Understanding Design Power Optimization (5/7)

O slide apresenta problemas de **clock domains**.

Pontos listados:

```text
Clock domains: As in the example shown, the clock and gated clock circuits are seen
to be in different clock domains.

If signals cross these domains, there is a possibility of metastability which can
induce design failure if they are not taken care.

Resulting problems in design could be technology dependent.

Timing analyzer tools such as PrimeTime flag such scenarios and alert the designers.
If these seep through the design phase, it is very difficult to detect and debug.

Failures due to clock domain issues are difficult to detect and hence can be fatal.
```

Interpretação:

Quando uma parte do circuito usa clock normal e outra usa clock gated, a ferramenta pode tratá-las como domínios de clock diferentes ou como caminhos com relações temporais especiais.

Se sinais atravessam esses domínios sem sincronização adequada, pode ocorrer metastabilidade.

#### Metastabilidade

Metastabilidade ocorre quando um flip-flop recebe uma transição de dado muito próxima da borda de clock, violando setup ou hold. A saída pode ficar temporariamente em um estado indefinido antes de resolver para 0 ou 1.

Isso é especialmente comum em cruzamento de domínios de clock, ou CDC — Clock Domain Crossing.

A figura mostra dois domínios:

```text
Slow_clk
Fast_clk
```

com lógica combinacional entre flip-flops de domínios diferentes.

O slide cita o PrimeTime como ferramenta de timing capaz de sinalizar esses cenários.

---

### Slide 6 — Understanding Design Power Optimization (6/7)

O slide continua o tema de clock domains, agora com fast clock múltiplo de slow clock.

Título:

```text
Clock domains: When fast clock is a multiple of slow clock
```

Pontos listados:

```text
For the design to work reliably, signals are expected to meet setup and hold times
for flip-flops.

For designs using multiple clock frequencies, there is a possibility of metastability
due to violation of setup and hold times of flip-flops.
The transistors might permanently get stuck at value which is indeterministic.
```

Interpretação:

Mesmo quando os clocks têm uma relação matemática, como fast clock sendo múltiplo de slow clock, ainda há risco se as fases não forem controladas.

O slide diz:

```text
The solution to avoid metastability is phase control,
which uses internal Phase Locked Loop (PLL) or Delay Locked Loop (DLL)
for blocking the clock transition with respect to the main clock.
```

Interpretação:

Se os clocks são relacionados, controlar fase pode garantir que as bordas estejam posicionadas de forma segura.

O slide também afirma:

```text
Phase matching eliminates timing violation which is used when slow clocks operate
at multiples of the master clock.

This ensures that no setup violation happens when propagation delays of flip-flops
are much less than clock period of faster clocks.

The clock edges are aligned in such cases.
```

Interpretação:

A ideia é alinhar as bordas para evitar captura em momentos perigosos.

#### Double flip-flop synchronization

O slide também diz:

```text
Another technique used to avoid metastability is using synchronization with double flipflops.
This is used to avoid metastability when data is latched by a faster clock
but generated by a slow clock.
```

Interpretação:

Um sincronizador de dois flip-flops reduz a probabilidade de metastabilidade se propagar.

Fluxo:

```text
sinal assíncrono ou de outro domínio
        ↓
flip-flop 1
        ↓
flip-flop 2
        ↓
sinal sincronizado no domínio de destino
```

O primeiro flip-flop pode ficar metastável, mas tem um ciclo para resolver antes de o segundo capturar.

A figura mostra exatamente essa ideia: o sinal vindo de um domínio é passado por dois flip-flops antes de ser usado pela lógica do domínio de destino.

---

### Slide 7 — Understanding Design Power Optimization (7/7)

O slide apresenta sincronização de cruzamento de clock domain usando FIFO.

Título:

```text
Handling clock domain crossover synchronization using first in first out FIFO
```

Pontos listados:

```text
Technique used when clocks are not synchronized and out of phase.

With asynchronous FIFO, data can come at arbitrary time intervals on the writing side
and read side blocks such as Module 2 in example can pull data any time.

Size of the FIFO must be selected knowing the frequency relationship of write and read side clocks
such that it does not overflow.

Other technique is using handshaking signals such as full and empty.
When FIFO is full, further write are blocked and when empty, read is avoided.
The handshake signals are suitably double synchronized.
```

Interpretação:

Quando os clocks são assíncronos e sem relação de fase confiável, sincronizar um único sinal com dois flip-flops pode não ser suficiente para transferir dados multi-bit com segurança.

Nesse caso, uma solução comum é usar **asynchronous FIFO**.

A figura mostra:

```text
Module 1 — 200 MHz
      ↓
Async FIFO
      ↓
Module 2 — 175 MHz
```

A FIFO tem lado de escrita em um clock e lado de leitura em outro clock.

Ela usa sinais como:

```text
full
empty
write enable
read enable
```

para evitar escrita quando cheia e leitura quando vazia.

Esses sinais de controle precisam ser sincronizados adequadamente, normalmente com técnicas de dupla sincronização e ponteiros Gray-code em FIFOs assíncronas reais.

---

### Slide 8 — Design Power Optimization: Good Practice

O slide fecha com boas práticas.

Pontos listados:

```text
Use clock gating only for ASICs and not FPGAs as they create timing analysis issues.

Have a separate module for all gated clocks in the clock module as they can be removed
easily for FPGA prototyping.

Clock gate enables are grouped in the data cone of the logic to isolate them from clock tree cone
as it helps FPGA prototyping the ASIC blocks.

The FPGA synthesis tools remove clock gate logic as they pose challenges in timing closure.

Gated clock conversion in FPGA flow converts clock gate cells with AND and OR
to enable flip-flops that are directly connected to clock lines.
```

Interpretação:

O slide recomenda clock gating principalmente para ASIC, não para FPGA.

Em FPGA, o clock tree é uma estrutura dedicada e controlada pelo fabricante. Criar clocks derivados usando lógica comum pode causar problemas sérios de timing e roteamento.

Em FPGA, o mais recomendado normalmente é usar **clock enable** dos próprios flip-flops, em vez de criar um clock gated manual.

#### Boas práticas resumidas

1. Use clock gating em ASIC com células apropriadas.
2. Evite clock gating manual em FPGA.
3. Coloque a lógica de clock gating em um módulo separado.
4. Agrupe enables de clock no cone de dados, isolando-os do cone de clock.
5. Para prototipagem FPGA de blocos ASIC, facilite a remoção/substituição dos clock gates.
6. Use gated clock conversion no fluxo FPGA quando necessário.

A figura mostra um módulo de clock com múltiplas células de clock gating:

```text
Sys_clk
Cg-enable1 → CG1 → Clk1
Cg-enable2 → CG2 → Clk2
Cg-enable3 → CG3 → Clk3
Cg-enable4 → CG4 → Clk4
```

Interpretação:

Separar clock gates em um módulo de clock facilita manutenção, análise e adaptação entre ASIC e FPGA.

---

## Aula didática desenvolvida

### 1. O que significa otimizar potência no nível RTL/HLS?

No nível RTL ou HLS, você ainda não está escolhendo cada transistor manualmente. Mas suas decisões mudam o quanto o circuito irá chavear.

Exemplos:

```text
um loop sempre ativo gera chaveamento constante
um bloco com enable bem definido pode ser desligado
um mux mal estruturado pode gerar glitches
um datapath balanceado pode reduzir transições temporárias
um array acessado desnecessariamente consome potência
```

Otimização de potência nesse nível significa escrever e transformar a lógica para reduzir:

```text
atividade de chaveamento
capacitância chaveada
frequência efetiva
tensão, quando a arquitetura permite
glitches
clock desnecessário
```

---

### 2. Por que clock consome tanto?

Clock alterna o tempo todo.

Mesmo quando os dados não mudam, o clock continua:

```text
carregando e descarregando a rede de clock
acionando entradas de clock dos flip-flops
causando atividade interna nos registradores
alimentando lógica sequencial
```

Por isso clock gating é tão poderoso: ele bloqueia uma das maiores fontes de atividade dinâmica.

Exemplo:

```text
bloco de multiplicação usado apenas 10% do tempo
```

Sem clock gating:

```text
os registradores do bloco recebem clock 100% do tempo
```

Com clock gating:

```text
recebem clock apenas quando bloco está ativo
```

---

### 3. Clock gating versus clock enable

Há uma diferença importante.

#### Clock enable

O clock chega ao flip-flop, mas o dado só atualiza quando enable está ativo.

Exemplo RTL:

```systemverilog
always_ff @(posedge clk) begin
  if (en)
    q <= d;
end
```

A ferramenta pode implementar isso como mux de feedback ou como flip-flop com enable.

#### Clock gating

O clock é fisicamente bloqueado antes de chegar ao flip-flop.

Conceito:

```text
gated_clk = clk & enable
```

Mas em ASIC não se deve fazer isso com uma AND comum no RTL sem controle. O ideal é que a síntese ou o fluxo de clock gating use células ICG apropriadas.

Clock enable reduz comutação de dados. Clock gating reduz também a comutação do clock no bloco.

---

### 4. Por que não usar uma AND simples no clock?

Porque o enable pode mudar enquanto o clock está alto.

Exemplo:

```text
clk = 1
enable muda de 0 para 1
saída da AND gera pulso estreito
```

Esse pulso pode ser interpretado como uma borda falsa por flip-flops.

Consequências:

```text
captura inesperada
violação de timing
glitch no clock
metastabilidade
falha difícil de depurar
```

Por isso o slide recomenda **Integrated Clock Gate Cells**.

---

### 5. Integrated Clock Gate Cell

Uma ICG cell normalmente contém:

```text
latch para estabilizar enable
porta de gating
modelos de timing
checagens de clock gating
caracterização na biblioteca
```

O latch segura o enable em uma fase segura do clock, evitando que ele mude no momento errado.

Em termos conceituais:

```text
enable combinacional
        ↓
latch interno
        ↓
gating seguro do clock
        ↓
gated clock limpo
```

Essa célula é analisável por ferramentas de timing e é apropriada para ASIC.

---

### 6. Glitch power: potência desperdiçada em transições inúteis

Imagine uma saída que deveria terminar em 1.

Por atrasos diferentes, ela pode fazer:

```text
0 → 1 → 0 → 1
```

Antes de estabilizar.

A saída final é 1, mas houve duas transições extras. Cada transição consome energia.

Essas transições extras são glitches.

Glitches são comuns em:

```text
muxes
comparadores
árvores aritméticas
lógica de controle
caminhos de dados desbalanceados
```

Reduzir glitch power pode ser tão importante quanto reduzir número de operações.

---

### 7. Balanceamento de caminhos

Se duas entradas de uma porta chegam em tempos muito diferentes, a saída pode oscilar.

Exemplo:

```text
entrada A chega no tempo 1 ns
entrada B chega no tempo 4 ns
```

Durante esse intervalo, a lógica pode produzir valores temporários.

Balancear caminhos significa fazer sinais relacionados chegarem em tempos mais próximos.

Técnicas:

```text
reestruturar lógica
registrar sinais de controle
balancear árvore aritmética
usar estágios de pipeline
evitar caminhos muito desequilibrados
```

---

### 8. Redução de tensão: poderosa, mas perigosa para timing

Como potência dinâmica depende de `V²`, reduzir tensão é muito eficaz.

Mas transistores em tensão menor comutam mais devagar.

Consequência:

```text
menor potência
maior delay
menor frequência máxima
maior risco de violação de setup
```

Por isso, se um design opera em baixa tensão, timing precisa ser analisado nesse nível de tensão, geralmente no corner de pior desempenho.

---

### 9. Flip-flops dual-edge

Dual-edge flip-flops capturam em duas bordas.

Objetivo:

```text
fazer o mesmo trabalho com metade da frequência
```

Se o design antes precisava de 200 MHz com single-edge, em alguns casos poderia operar a 100 MHz usando duas bordas.

Menor frequência reduz potência dinâmica.

Mas há custos:

```text
células especiais
timing mais complexo
sensibilidade a duty cycle
biblioteca precisa suportar
```

Por isso é uma técnica dependente da tecnologia.

---

### 10. Clock skew

Clock skew é a diferença de chegada do clock entre dois flip-flops.

Exemplo:

```text
FF1 recebe clock em 0.0 ns
FF2 recebe clock em 0.3 ns
```

Skew pode ajudar ou atrapalhar setup, mas é perigoso para hold.

Clock gating pode aumentar skew porque insere lógica no caminho do clock.

Por isso, redes de clock devem ser construídas e analisadas com cuidado.

---

### 11. Clock domains criados por gated clocks

O slide mostra que clock e gated clock podem parecer domínios diferentes.

Mesmo que o gated clock venha do clock principal, ele passa por lógica adicional, tem comportamento diferente e pode parar.

Isso cria desafios:

```text
como analisar timing entre clock normal e gated clock?
quando o gated clock está ativo?
há relação de fase confiável?
sinais cruzam entre os domínios?
```

Ferramentas como PrimeTime podem detectar cenários suspeitos.

---

### 12. Metastability em cruzamento de clock

Metastabilidade ocorre quando o sinal de dado muda perto da borda de clock.

O flip-flop pode não resolver imediatamente para 0 ou 1.

Em clock domain crossing, isso é comum porque o clock de origem e o clock de destino podem não ter relação de fase segura.

Consequência:

```text
sinal incerto
falha intermitente
erro difícil de reproduzir
bug dependente de temperatura/processo/tensão
```

Por isso o slide diz que falhas de clock domain podem ser fatais.

---

### 13. Double flip-flop synchronizer

Para um sinal de controle de 1 bit cruzando de um domínio para outro, uma técnica comum é usar dois flip-flops em série no domínio de destino.

```text
async_signal → FF1 → FF2 → synced_signal
```

O primeiro flip-flop pode ficar metastável, mas tem um ciclo para resolver. O segundo reduz a chance de a metastabilidade se propagar.

Uso típico:

```text
flags
enable
pulsos convertidos corretamente
sinais de controle de 1 bit
```

Não é solução suficiente para barramentos multi-bit sem protocolo adicional.

---

### 14. Asynchronous FIFO

Para dados multi-bit entre clocks assíncronos, usa-se FIFO assíncrona.

Ela separa:

```text
write clock domain
read clock domain
```

O lado de escrita empurra dados quando não está cheia. O lado de leitura puxa dados quando não está vazia.

Sinais importantes:

```text
full
empty
write pointer
read pointer
write enable
read enable
```

A FIFO evita que o consumidor leia dados inválidos ou que o produtor sobrescreva dados ainda não lidos.

---

### 15. Por que FIFO precisa de tamanho adequado?

Se o produtor escreve mais rápido do que o consumidor lê, a FIFO enche.

Se a FIFO for pequena demais:

```text
overflow
bloqueio frequente de escrita
perda de throughput
```

O slide diz que o tamanho da FIFO deve ser escolhido conhecendo a relação entre frequência de escrita e leitura.

Exemplo:

```text
write side = 200 MHz
read side = 175 MHz
```

Se o produtor estiver continuamente ativo, a FIFO tende a encher, porque escreve mais rápido do que lê. O controle `full` precisa bloquear escrita ou o sistema precisa aceitar backpressure.

---

### 16. Clock gating em ASIC versus FPGA

O slide é explícito:

```text
Use clock gating only for ASICs and not FPGAs.
```

Motivo:

FPGA tem redes de clock dedicadas. Criar clocks gated com lógica comum pode gerar:

```text
skew imprevisível
problemas de roteamento
dificuldade de timing closure
glitches
uso ruim de recursos globais de clock
```

Em FPGA, prefira:

```text
clock enable
enable de flip-flops
gated clock conversion
recursos recomendados pelo fabricante
```

Para prototipagem FPGA de um ASIC com clock gates, é comum converter clock gates em enables.

---

## Conceitos difíceis explicados em profundidade

### 1. Potência dinâmica e atividade de chaveamento

A potência dinâmica é consumida quando capacitâncias mudam de estado.

Cada vez que um nó vai de 0 para 1, ele carrega capacitância. Quando vai de 1 para 0, descarrega.

A atividade de chaveamento mede quantas dessas transições acontecem.

Mesmo que a lógica esteja funcionalmente correta, se ela gera muitas transições internas, consome mais potência.

---

### 2. Capacitância acumulada

O `C` da fórmula não é apenas uma capacitância única.

Ele inclui:

```text
capacitância de entrada de portas
capacitância de fios
capacitância de difusão
capacitâncias parasitas internas
```

Quanto maior o circuito e quanto mais nets chaveando, maior o `C` efetivo.

---

### 3. Por que clock gating é tão usado?

Porque o clock:

```text
tem alta frequência
alterna sempre
alcança muitos flip-flops
dirige redes grandes
causa atividade mesmo sem trabalho útil
```

Reduzir clock em regiões inativas ataca uma das maiores fontes de potência dinâmica.

---

### 4. Gated clock é clock novo?

Em análise de timing, um gated clock pode ser tratado como clock derivado ou como um domínio relacionado ao clock original.

Mas, funcionalmente, ele é diferente:

```text
pode parar
tem atraso adicional
passa por célula de gating
depende de enable
```

Por isso exige constraints e análise corretas.

---

### 5. Clock gating check

Ferramentas de STA fazem checagens específicas para clock gating.

A ideia é garantir que o enable da ICG esteja estável no momento correto, evitando glitch no clock.

Se o enable muda no momento perigoso, pode ocorrer pulso falso.

---

### 6. Glitch em sinal de controle é pior que glitch em dado?

Ambos consomem potência, mas glitch em controle pode ser mais perigoso.

Um glitch em select de mux pode selecionar temporariamente o dado errado.

Um glitch em enable pode ativar escrita indevida.

Um glitch em clock gate pode gerar borda falsa de clock.

Por isso sinais de controle frequentemente são registrados antes de serem usados.

---

### 7. CDC — Clock Domain Crossing

CDC é todo caminho em que um sinal sai de um domínio de clock e entra em outro.

Exemplos:

```text
slow_clk → fast_clk
fast_clk → slow_clk
clock normal → gated clock
PLL clock A → PLL clock B
domínio externo → domínio interno
```

CDC precisa de técnicas específicas porque STA tradicional nem sempre garante segurança funcional em clocks assíncronos.

---

### 8. Double synchronizer não serve para qualquer coisa

Dois flip-flops funcionam bem para sinais de 1 bit estáveis por tempo suficiente.

Mas para barramento multi-bit:

```text
data[7:0]
```

cada bit pode resolver em ciclo diferente. Isso pode criar um valor misturado.

Para barramentos, use:

```text
handshake
asynchronous FIFO
protocolo valid/ready sincronizado
Gray-code pointers
```

---

### 9. Handshaking com full/empty

Em FIFO assíncrona:

```text
full impede escrita quando não há espaço
empty impede leitura quando não há dado
```

Esses sinais cruzam domínios e precisam ser sincronizados adequadamente.

O slide destaca que os handshake signals são suitably double synchronized.

---

### 10. Por que problemas de CDC são difíceis de debug?

Porque podem ser:

```text
intermitentes
dependentes de fase
dependentes de temperatura
dependentes de tensão
dependentes de variação de processo
raros em simulação RTL
difíceis de reproduzir em laboratório
```

Um design pode funcionar por horas e falhar uma vez em uma combinação específica de bordas.

---

### 11. Gated clock conversion no FPGA

Quando um design ASIC usa clock gates e precisa ser prototipado em FPGA, o fluxo FPGA pode converter:

```text
clock gate
```

em:

```text
clock enable de flip-flop
```

Assim, o clock continua usando rede dedicada do FPGA, e o enable controla atualização dos registradores.

Isso preserva melhor o timing no FPGA.

---

### 12. Mais lógica pode reduzir potência?

O slide menciona que aumento de recursos nem sempre aumenta potência.

Exemplo:

```text
adicionar registradores para balancear caminhos pode reduzir glitches
```

Mesmo com mais células, se a atividade de chaveamento cair bastante, a potência total pode diminuir.

Portanto, otimização de potência não é apenas reduzir área. É reduzir energia consumida por atividade real.

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — Design part with gated clock

A figura do primeiro slide mostra uma parte do design com clock normal e outra parte com gated clock. Ela ilustra que o clock pode ser bloqueado em uma região quando `clk_enable` está desabilitado.

### Página 1 — Glitch power

A figura do segundo slide mostra um pequeno circuito combinacional e uma waveform com glitch. Ela ilustra uma transição indesejada antes do sinal estabilizar.

### Página 2 — Glitch avoidance with restructuring mux logic

A figura 1 compara muxes antes e depois de reestruturação do controle. O objetivo é evitar glitch no sinal de seleção sem alterar a funcionalidade.

### Página 2 — Glitch avoidance with clocking sel control

A figura 2 mostra o uso de clocking/registro no sinal de controle antes de ele controlar a lógica, reduzindo glitch em sinais de select.

### Página 2 — ICG cell

A figura 3 mostra uma integrated clock gate cell. Ela representa o uso de uma célula dedicada para gerar clock gated de forma segura, em vez de uma porta lógica comum.

### Página 2 — Efeito de clock skew

A figura do slide 4 mostra flip-flops conectados por lógica combinacional e clock gating, destacando atrasos `ΔL` e `ΔC`. Ela explica por que clock skew pode alterar o comportamento do dado capturado.

### Página 3 — Design with different clock domains

A figura mostra um domínio com clock normal e outro com gated clock, indicando que sinais cruzando esses domínios podem causar metastabilidade.

### Página 3 — Signals crossing different clock domains

A figura com `Slow_clk` e `Fast_clk` mostra uma transferência entre domínios de clock diferentes através de lógica combinacional.

### Página 3 — Avoiding metastability using double flipflops

A figura mostra sincronização com dois flip-flops e waveforms associadas. Ela representa a técnica clássica para reduzir propagação de metastabilidade em sinais de controle.

### Página 4 — Avoiding metastability using Async FIFO

A figura mostra dois módulos com clocks diferentes, por exemplo 200 MHz e 175 MHz, comunicando por uma FIFO assíncrona. Ela ilustra a técnica adequada para transferência de dados entre domínios assíncronos.

### Página 4 — Clock module with gated clocks

A figura final mostra um módulo de clock contendo múltiplas células de clock gating, cada uma gerando um clock gated separado. Ela reforça a boa prática de isolar e organizar clock gates em um módulo próprio.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Qual é a principal causa da potência dinâmica em CMOS?**  
   Carga e descarga de capacitâncias parasitas de gates e interconexões metálicas.

2. **Quais parâmetros aparecem na equação simplificada de potência do slide?**  
   `V`, `C` e `f`.

3. **O que representa `V`?**  
   A tensão de alimentação.

4. **O que representa `C`?**  
   A capacitância acumulada relacionada ao número de gates chaveando em um dado momento.

5. **O que representa `f`?**  
   A frequência de chaveamento, diretamente associada à frequência de clock.

6. **Qual técnica é citada como a mais usada para otimização de potência em circuitos digitais?**  
   Clock gating.

7. **O que clock gating faz?**  
   Desativa o clock para blocos ou partes do datapath quando não estão em uso.

8. **Por que reduzir tensão reduz potência significativamente?**  
   Porque a dissipação de potência tem relação quadrática com a tensão de alimentação.

9. **Qual é o efeito colateral de reduzir a tensão de alimentação?**  
   Reduz a velocidade/performance do design, exigindo cuidado com timing.

10. **Como flip-flops dual-edge podem reduzir potência?**  
    Permitindo operação com metade da frequência e reduzindo o número de toggles.

11. **O que é glitch?**  
    Uma transição indesejada antes de o sinal estabilizar no valor correto.

12. **Por que glitches aumentam potência?**  
    Porque causam transições extras que carregam e descarregam capacitâncias.

13. **Como reduzir glitches segundo o slide?**  
    Reestruturar muxes, registrar sinais de controle, usar ICG cells e balancear caminhos de sinal.

14. **Por que clock gating simples pode gerar glitches?**  
    Porque o enable pode ser assíncrono em relação ao clock.

15. **Qual célula especial é recomendada para clock gating em ASIC?**  
    Integrated Clock Gate Cell, ou ICG.

16. **O que a ICG faz?**  
    Filtra glitches do clock e fornece clock estável, travando o enable no momento correto.

17. **O que é clock skew?**  
    Diferença de chegada do clock em diferentes entradas de clock de flip-flops.

18. **Por que clock skew é perigoso?**  
    Pode causar comportamento imprevisível, violações de setup/hold e falhas funcionais.

19. **O que pode acontecer quando sinais cruzam clock domains?**  
    Pode ocorrer metastabilidade.

20. **Qual ferramenta é citada como capaz de flagrar cenários de clock domain/timing?**  
    PrimeTime.

21. **Qual técnica é usada quando dados de clock lento são capturados por clock rápido?**  
    Sincronização com double flip-flops, quando apropriado para sinal de controle.

22. **Quando usar asynchronous FIFO?**  
    Quando clocks não estão sincronizados e estão fora de fase, especialmente para transferência de dados entre domínios.

23. **Como escolher o tamanho da FIFO?**  
    Conhecendo a relação de frequência entre clock de escrita e clock de leitura, para evitar overflow.

24. **Quais sinais de handshake de FIFO são citados?**  
    `full` e `empty`.

25. **Qual boa prática o slide dá sobre clock gating em ASIC/FPGA?**  
    Usar clock gating apenas para ASICs e não para FPGAs, pois em FPGA ele cria problemas de timing.

26. **O que gated clock conversion faz no fluxo FPGA?**  
    Converte clock gate cells com AND/OR em enables de flip-flops conectados diretamente às linhas de clock.

### Pegadinhas

- Clock gating economiza potência, mas pode criar problemas de timing se for feito de forma incorreta.
- Não se deve fazer clock gating com porta AND comum sem considerar glitches e timing.
- ICG é célula de biblioteca própria para clock gating em ASIC.
- Reduzir tensão reduz potência, mas piora velocidade.
- Dual-edge flip-flop depende de suporte da biblioteca.
- Glitches podem consumir potência significativa mesmo sem mudar o valor final correto.
- Mais área nem sempre significa mais potência se a transformação reduzir glitches.
- Gated clock pode criar análise parecida com múltiplos clock domains.
- Double flip-flop é adequado para sinais de controle de 1 bit, não para barramento multi-bit sem protocolo.
- Async FIFO é mais apropriada para transferência de dados multi-bit entre clocks assíncronos.
- Clock gating em FPGA é problemático; prefira clock enable ou conversão apropriada.
- Problemas de CDC/metastabilidade podem ser difíceis de detectar e fatais.

### Frases para memorizar

```text
Potência dinâmica vem da carga e descarga de capacitâncias.
Clock gating é a técnica mais usada de otimização de potência em circuitos digitais.
Clock gating desativa o clock de blocos não usados.
Reduzir tensão reduz potência, mas piora timing.
Glitch é transição indesejada antes do sinal estabilizar.
Glitches consomem potência.
ICG evita glitches no clock gated.
Clock skew muda o tempo efetivo de captura.
Sinais cruzando clock domains podem gerar metastabilidade.
Double flip-flop reduz propagação de metastabilidade para sinais de controle.
Async FIFO é usada para cruzamento seguro de dados entre clocks assíncronos.
Clock gating é prática de ASIC; em FPGA, prefira enable/conversão.
```

---

## Relação com projeto/laboratório

Esta aula conecta otimização de potência com práticas reais de RTL/ASIC.

### Como isso aparece em RTL

Um bloco com enable:

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    q <= '0;
  else if (en)
    q <= d;
end
```

Pode permitir que a ferramenta infira clock gating ou use clock enable, dependendo do fluxo, das constraints e da tecnologia.

### Exemplo conceitual de clock gating

Em ASIC, o ideal é que a síntese use uma célula ICG:

```text
clk + enable → ICG → gated_clk → flip-flops do bloco
```

Não é boa prática criar manualmente:

```systemverilog
assign gated_clk = clk & en;
```

sem controle de glitch e sem célula apropriada.

### Exemplo de CDC com double flip-flop

```systemverilog
always_ff @(posedge dst_clk or negedge rst_n) begin
  if (!rst_n) begin
    sync1 <= 1'b0;
    sync2 <= 1'b0;
  end
  else begin
    sync1 <= async_signal;
    sync2 <= sync1;
  end
end
```

Esse padrão reduz risco de metastabilidade para sinal de controle de 1 bit.

### Exemplo conceitual de async FIFO

```text
write side:
  wr_clk, wr_en, wdata, full

read side:
  rd_clk, rd_en, rdata, empty
```

Use quando:

```text
dados multi-bit precisam atravessar clocks assíncronos
produtor e consumidor têm frequências diferentes
não há fase confiável entre clocks
```

### Checklist prático para análise de potência

- [ ] Blocos ociosos têm enable claro?
- [ ] A ferramenta pode inferir clock gating?
- [ ] Clock gates usam ICG cells em ASIC?
- [ ] Há gated clocks sendo usados indevidamente em FPGA?
- [ ] Sinais de controle são registrados quando necessário?
- [ ] Há muxes com selects glitchy?
- [ ] Caminhos de dados estão muito desbalanceados?
- [ ] Há sinais cruzando clock domains?
- [ ] CDC foi tratado com synchronizer ou async FIFO?
- [ ] PrimeTime/CDC checks estão limpos?
- [ ] FIFOs têm tamanho adequado para diferença de frequência?

---

## Necessidade de áudio

**Médio.**

Os prints trazem a maior parte do conteúdo, mas alguns pontos poderiam ser melhor confirmados com a fala do professor:

- a interpretação exata da fórmula simplificada `P = V · C · f`;
- exemplos específicos de como o curso espera tratar dual-edge flip-flops;
- detalhes das figuras de mux restructuring e clocking select control;
- se o banco de questões cobra a recomendação “clock gating só para ASICs e não FPGAs” literalmente;
- como o professor conecta PrimeTime à detecção de clock domain issues.

Mesmo sem áudio, os conceitos principais estão claros pelos slides.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco não foi inventado sem confirmação na tela final/roteiro.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

O DOCX atual não mostra uma tela final com a sequência do curso. Para evitar erro de roteiro, confirmar no checklist qual é o primeiro DOCX depois de:

```text
04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.docx
```

Salvar este bloco em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.md
```
