# 05 Synthesis with Time or Area Optimization

## Controle do bloco

- **Bloco:** 022
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\05 Synthesis with Time or Area Optimization.docx`
- **Faixa processada:** slides visíveis 1-12, distribuídos em 6 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\05 Synthesis with Time or Area Optimization.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O roteiro indica este bloco como `022 — 05 Synthesis with Time or Area Optimization`; depois dele começa a seção `05 Design Verification`.
- **Próximo bloco recomendado:** 023 — `01 Introduction to Verification`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco fecha a sequência de **RTL Design Synthesis** mostrando como otimizar um design para **tempo/desempenho** ou para **área**, e por que há tradeoffs entre throughput, latency, timing e quantidade de recursos.

---

## Resumo executivo

Esta aula explica como a síntese pode otimizar um design para **timing** ou para **área**. O bloco começa definindo termos essenciais:

```text
throughput
critical path
latency
timing
critical path delay
propagation delay
```

Depois, a aula mostra que otimizar timing pode ter objetivos diferentes:

```text
aumentar throughput
reduzir latency
reduzir delay do caminho crítico
aumentar frequência máxima
```

O ponto central é que melhorar desempenho geralmente exige mais recursos de hardware. Por exemplo:

```text
pipelining
parallel logic
retiming
replication
adding registers
flattening logic
```

podem melhorar timing, mas frequentemente aumentam área, registradores, multiplexadores ou complexidade.

A aula também mostra o outro lado: otimização para **área**. Para reduzir área, o design pode reutilizar recursos:

```text
folding
rolling up the pipeline
resource sharing
```

Essas técnicas reduzem a quantidade de unidades funcionais, como multiplicadores, somadores, contadores e timers, mas podem aumentar número de ciclos, reduzir throughput ou complicar controle.

A mensagem principal do bloco é:

```text
Timing e área competem entre si.
Melhorar throughput/latency costuma exigir mais hardware.
Reduzir área costuma exigir reuso de hardware, aumentando ciclos ou controle.
```

---

## Texto extraído e organizado por slide

### Slide 1 — Common Terminologies w.r.t. Timing (1/2)

O slide define termos comuns relacionados a timing.

#### Throughput

```text
Throughput: Amount of data processed per clock cycle.
Specified as bits per second (bps).
```

Tradução:

```text
Throughput é a quantidade de dados processada por ciclo de clock.
Pode ser especificado em bits por segundo.
```

Interpretação:

Throughput mede **taxa de processamento**. Um circuito pode ter latência alta, mas throughput alto se for pipeline e conseguir aceitar novos dados a cada ciclo.

Exemplo:

```text
8 bits por ciclo
clock de 100 MHz
throughput = 800 Mbits/s
```

#### Critical path

```text
Critical path: Maximum delay time for signal to travel from one sequential element
(register) to the other.
```

Tradução:

```text
Caminho crítico é o maior tempo de atraso para um sinal viajar de um elemento
sequencial, registrador, até outro.
```

A figura mostra:

```text
Reg1 → combinational path → Reg2
```

Interpretação:

O caminho crítico determina a frequência máxima do design. Se o caminho entre dois registradores demora mais que o período de clock permitido, o design não fecha timing.

#### Latency

```text
Latency: Time between data input and data output.
Specified as number of clock cycles.
```

Tradução:

```text
Latência é o tempo entre a entrada de dado e a saída de dado.
É especificada em número de ciclos de clock.
```

Exemplo:

```text
dado entra no ciclo 0
resultado sai no ciclo 4
latência = 4 ciclos
```

#### Timing

```text
Timing: Logic processing delay between concerned design elements.
```

Tradução:

```text
Timing é o atraso de processamento lógico entre elementos relevantes do design.
```

#### Timing not met

```text
Critical path delay or propagation delay larger than clock period is timing not met.
```

Tradução:

```text
Quando o atraso do caminho crítico ou atraso de propagação é maior que o período
de clock, o timing não foi atendido.
```

Interpretação:

Se:

```text
critical path delay > clock period
```

então o dado não chega a tempo para ser capturado pelo próximo registrador.

---

### Slide 2 — Common Terminologies w.r.t. Timing (2/2)

O slide mostra os componentes de delay em um timing path.

Fórmula do slide:

```text
delay = clock to Q delay + interconnect delay
      + combinational logic delay + setup time + clock skew
```

A figura mostra uma cadeia:

```text
Reg1 → comb path → Reg2 → comb path → Reg3 → comb path → Reg4
```

com:

```text
latency = 4 clock cycles
throughput = 8 bits per cycle
```

O slide também afirma:

```text
Optimization goal of design timing is to improve throughput,
reduce latency, and optimize delay.
```

Tradução:

```text
O objetivo da otimização de timing do design é melhorar throughput,
reduzir latência e otimizar delay.
```

Interpretação:

Esse slide mostra que timing não é um único número. O atraso total inclui:

- clock-to-Q do registrador de origem;
- atraso de interconexão;
- atraso da lógica combinacional;
- setup time do registrador de destino;
- clock skew entre registradores.

Para fechar timing, todos esses componentes precisam caber dentro do período de clock.

---

### Slide 3 — Design Optimization for Timing: Throughput

O slide explica otimização para **throughput**.

Objetivo:

```text
Maximizing number of bits per sec
```

Tradução:

```text
Maximizar o número de bits por segundo.
```

Pontos listados:

```text
Widely used concept: Pipelining by unrolling the loop.
Logic processing is organized into stages.
New data is taken up by any stage for processing if it is free after processing
the previous data, thus increasing the throughput.
```

Interpretação:

A ideia é organizar a lógica em estágios para permitir que diferentes dados estejam sendo processados em diferentes partes do circuito ao mesmo tempo.

Exemplo mental de pipeline:

```text
ciclo 1: dado A no estágio 1
ciclo 2: dado A no estágio 2, dado B no estágio 1
ciclo 3: dado A no estágio 3, dado B no estágio 2, dado C no estágio 1
```

Depois que o pipeline enche, ele pode produzir um resultado por ciclo, dependendo da arquitetura.

#### Exemplo do slide: potência cúbica

O slide mostra o cálculo de `x³`:

```text
Input x;
Result = 1;
for (i = 0; i < 2; i++)
    Result = Result * x;
```

A figura mostra uma lógica iterativa com:

```text
mux
registrador
multiplicador
feedback
```

Pontos listados:

```text
Example demonstrates increases in throughput.
Increased by number of pipes N where N is the rolling factor.
Latency will be N clocks; remains the same.
Delay of the path is the delay of mux and multiplier; increased by delay of multiplier.
Requires more resources and hence area.
It is the tradeoff exercised per the design requirement.
```

Interpretação:

O exemplo mostra que throughput pode ser aumentado organizando a computação em estágios ou usando mais recursos. Porém, isso não é gratuito:

```text
mais throughput → mais recursos → mais área
```

---

### Slide 4 — Design Optimization for Timing: Latency

O slide explica otimização para **latency**.

Objetivo:

```text
Minimizing the latency, which is the number of clock cycles from input to output.
```

Pontos listados:

```text
Parallel logic
Increasing resources to execute in parallel
Requires more resources and hence area
Removes pipeline
Increases throughput
Reduces latency as in the example shown
Clock frequency increased
Most times, improving latency numbers is the preferred goal
```

A figura usa novamente o exemplo de `x³`, mas agora com operações paralelas. Em vez de usar uma estrutura iterativa com feedback, a operação é expandida em uma rede paralela de multiplicadores.

Interpretação:

Para reduzir latência, a técnica comum é executar operações em paralelo.

Exemplo:

```text
modo iterativo:
  usa 1 multiplicador reutilizado
  precisa de vários ciclos

modo paralelo:
  usa múltiplos multiplicadores
  produz resultado em menos ciclos
```

Tradeoff:

```text
menor latência → mais unidades funcionais → mais área
```

Esse slide reforça uma regra clássica:

```text
Área compra desempenho.
```

---

### Slide 5 — Design Optimization for Timing: Timing

O slide apresenta a fórmula da frequência máxima.

Objetivo:

```text
Maximum delay between any two sequential elements
```

A fórmula reconstruída do slide é:

```text
frequency_max =
1 / (Tclock-to-Q delay
   + Tinterconnect delay
   + Tcombinational logic delay
   + Tsetup
   + Tclock skew)
```

Definições listadas:

```text
frequency_max: Maximum allowable frequency

Tclock-to-Q delay:
Time from clock arrival at clock input to data arrival at Q output of a design timing element.

Tcombinational logic delay:
Propagation delay of the combinational logic between the two timing elements.

Tinterconnect delay:
Routing delay between flip-flops.

Tsetup:
Setup time of the flip-flops.

Tclock skew:
Propagation delay of the clock between launching and capture flip-flops.
```

Interpretação:

A frequência máxima é limitada pelo atraso total do caminho entre registradores.

Se o atraso total é grande, o período de clock precisa ser maior, então a frequência máxima é menor.

Exemplo:

```text
delay total = 5 ns
frequency_max = 1 / 5 ns = 200 MHz
```

Se a otimização reduz o delay para 2.5 ns:

```text
frequency_max = 400 MHz
```

Esse slide conecta diretamente timing closure com frequência máxima.

---

### Slide 6 — Design Optimization for Timing: Strategies to Improve Timing (1/4)

O slide lista estratégias para melhorar timing:

```text
Retiming
Adding registers in the data path
Parallel structures
Flatten the logic structure by removing hierarchy
Reorder input patterns
Replications
```

A figura mostra novamente um caminho crítico:

```text
Reg1 → comb path → Reg2
```

Interpretação:

Todas essas técnicas tentam reduzir o atraso do caminho crítico ou permitir que o trabalho seja distribuído em mais ciclos.

Resumo das estratégias:

#### Retiming

Mover registradores dentro do datapath sem alterar a funcionalidade.

#### Adding registers

Inserir novos registradores para quebrar caminho combinacional longo.

#### Parallel structures

Transformar lógica serial em lógica paralela.

#### Flatten logic

Remover hierarquia para permitir otimização global.

#### Reorder input patterns

Alterar ordem de entradas em lógica condicional para reduzir atraso do caminho crítico.

#### Replications

Duplicar lógica para reduzir fanout ou encurtar caminhos.

---

### Slide 7 — Strategies to Improve Timing (2/4): Retiming e Adding Registers

O slide aprofunda duas técnicas.

#### Retiming

Pontos listados:

```text
Move or relocate the registers in the data path such that there is no change
in functionality of the design.

Widely used technique.

In the adjoining example shown, by relocating the register in the path,
timing is improved by 20 ns.
```

A figura mostra um caminho onde os registradores são movidos para redistribuir atrasos.

Exemplo visual:

```text
antes:
path delay = 10 + 10 + 20 = 40 ns

depois:
path delay = 10 + 10 = 20 ns
```

Interpretação:

Retiming não muda a função externa do design, mas move registradores para balancear atrasos entre estágios.

Se um estágio tem muita lógica e outro tem pouca, mover registradores pode equilibrar os caminhos.

#### Adding registers in the data path

Pontos listados:

```text
Adding registers in the data path without affecting the function as shown in the example.

Increases latency due to added register.

To be added to all parallel paths to maintain the same functionality.
```

Interpretação:

Inserir registradores quebra um caminho longo em caminhos menores.

Antes:

```text
Reg1 → lógica longa → Reg2
```

Depois:

```text
Reg1 → parte da lógica → RegX → resto da lógica → Reg2
```

Isso melhora frequência máxima, mas aumenta latência em ciclos.

A observação importante do slide:

```text
se há caminhos paralelos, é preciso adicionar registradores nos caminhos correspondentes
para manter alinhamento funcional.
```

Caso contrário, sinais que deveriam chegar juntos podem chegar em ciclos diferentes.

---

### Slide 8 — Strategies to Improve Timing (3/4)

O slide aprofunda outras estratégias.

#### Parallel structure

Pontos listados:

```text
Reorganize the critical path so that logic structures are parallel.
Serial logic is converted to parallel.
For example, large data width can be split and processed such as 32-bit addition
can be split to two 16-bit additions in parallel.
```

Interpretação:

Transformar lógica serial em paralela reduz profundidade do caminho.

Exemplo:

```text
operação serial:
  parte 1 → parte 2 → parte 3

operação paralela:
  parte 1 e parte 2 em paralelo → combinação final
```

Aula conecta isso com divisão de largura de dados, como dividir uma operação de 32 bits em duas de 16 bits quando a arquitetura permitir.

#### Flattening the logic

Pontos listados:

```text
Like parallel logic conversion.
Can be applied to chained logic such as priority encoding.
```

Interpretação:

Flattening remove fronteiras hierárquicas e permite que a ferramenta otimize a lógica de forma global.

Exemplo:

```text
módulo A calcula sinal intermediário
módulo B usa esse sinal
```

Se a hierarquia é mantida rigidamente, a ferramenta pode não enxergar uma simplificação entre A e B. Ao achatar a lógica, ela pode reduzir níveis ou reestruturar expressões.

#### Reorder path

Pontos listados:

```text
Knowing the critical path of the circuit, input order is modified to reduce path delay.
Used for logic which has large number of conditional logic.
```

Interpretação:

Em lógica condicional, a ordem dos testes pode afetar o caminho crítico.

Exemplo:

```systemverilog
if (cond1)
  y = a;
else if (cond2)
  y = b;
else if (cond3)
  y = c;
else
  y = d;
```

Dependendo de qual condição está no caminho crítico, reordenar pode reduzir delay.

#### Replication of logic

Pontos listados:

```text
By copying the logic and provide the same inputs thus reducing propagation delay.
This is useful for reducing the fanout.
```

Interpretação:

Se um sinal dirige muitas cargas, fanout alto aumenta delay. Duplicar a lógica que gera esse sinal pode reduzir fanout por cópia.

Antes:

```text
um bloco gera X
X dirige 100 cargas
```

Depois:

```text
duas cópias geram X1 e X2
cada uma dirige 50 cargas
```

Custo:

```text
mais área
```

Benefício:

```text
menor fanout, menor delay, melhor timing
```

---

### Slide 9 — Strategies to Improve Timing (4/4)

O slide mostra diagramas de otimização para timing.

A primeira figura mostra uma expressão:

```text
f = ax1 + bx2 + cx3
```

com registradores adicionados nos caminhos. A região destacada em vermelho indica inserção de registradores em caminhos paralelos.

Interpretação:

A figura reforça a regra do slide anterior:

```text
ao inserir registradores para melhorar timing, é preciso manter alinhamento entre caminhos paralelos.
```

Se um caminho recebe registrador extra e outro não, os dados podem se combinar em ciclos diferentes.

A segunda figura mostra uma árvore de operações com atrasos indicados:

```text
10 ns
10 ns
15 ns
20 ns
```

Interpretação:

Esse tipo de diagrama ajuda a identificar onde está o caminho crítico. A estratégia é redistribuir, paralelizar ou registrar pontos que reduzem o maior atraso combinacional entre registradores.

---

### Slide 10 — Folding for Design Optimization for Area

O slide apresenta **folding** como técnica para otimização de área.

#### Folding the logic

Pontos listados:

```text
Widely used to reduce the number of hardware functional units by a factor of N
at the expense of increasing the computation time by a factor of N.

As shown in example 3, common functional units are identified,
and corresponding inputs are multiplexed and fed to a single set of common functional unit.

Adds multiplexers but multiplexers are less costly in terms of area compared to multipliers.
```

Interpretação:

Folding reduz área reutilizando uma mesma unidade funcional em momentos diferentes.

Exemplo:

```text
antes:
4 multiplicadores em paralelo

depois:
1 multiplicador compartilhado
muxes escolhem quais operandos entram
controle decide em qual ciclo cada operação acontece
```

Custo:

```text
mais ciclos
mais controle
muxes adicionais
```

Benefício:

```text
menos unidades funcionais caras
menor área
```

O slide destaca que muxes são mais baratos que multiplicadores. Então trocar vários multiplicadores por um multiplicador + muxes pode reduzir bastante área.

#### Folding em lógica serial

O slide também diz:

```text
Folding is applied to series logic operations as shown example 4.
```

A figura mostra uma sequência de operações sendo reestruturada para reutilizar recurso.

Interpretação:

Folding não vale apenas para operações paralelas. Também pode ser usado em sequências de operações quando uma unidade funcional pode ser reutilizada em diferentes etapas de computação.

---

### Slide 11 — Rolling for Design Optimization for Area

O slide apresenta **rolling up the pipeline**.

Pontos listados:

```text
Reusing the logic resources in different stages of computation.
Unrolling pipelines improve throughput.
Rolling up improves area.
Rolling the logic may simplify complex logic providing scope for further area reduction.
Multiplier replaced with a shifter, and adder logic is a good example.
But shifter and adder may take multiple clock cycles for results and hence impact to be studied.
```

Interpretação:

Rolling é o movimento contrário de unrolling.

#### Unrolling

Expande a lógica para melhorar throughput:

```text
mais hardware
menos ciclos
maior área
```

#### Rolling

Recolhe ou reutiliza a lógica para melhorar área:

```text
menos hardware
mais ciclos
menor área
```

A figura usa novamente o exemplo de `x³`, mostrando a versão iterativa com mux, registrador, multiplicador e feedback.

Esse tipo de estrutura reutiliza o mesmo recurso várias vezes.

Exemplo:

```text
ciclo 1: result = 1 * x
ciclo 2: result = result * x
```

Se quiser reduzir área ainda mais, pode trocar multiplicador por shift/add quando a operação permitir. Mas isso pode aumentar número de ciclos.

---

### Slide 12 — Resource Sharing for Design Optimization for Area

O slide apresenta **resource sharing**.

Ponto principal:

```text
Sharing logic resources across different operation boundaries is good for area reduction in designs.
```

Tradução:

```text
Compartilhar recursos lógicos entre diferentes limites de operação é bom para reduzir área em designs.
```

Exemplo do slide:

```text
Counters, timers are good examples which can be shared across different blocks.
```

A figura mostra um exemplo com:

```text
8-bit counter
32-bit counter / second timer
glue logic
```

Interpretação:

Se dois blocos usam contadores ou timers em momentos diferentes, talvez eles possam compartilhar um único recurso.

Antes:

```text
bloco A tem contador de 8 bits
bloco B tem contador de 32 bits
```

Depois:

```text
um contador maior é compartilhado
glue logic seleciona/organiza o uso
```

Custo:

```text
lógica de controle adicional
muxes
restrições de agendamento
possível perda de paralelismo
```

Benefício:

```text
menos área
```

#### Observações para FPGA

O slide fecha com observações importantes:

```text
Area utilization in FPGA may pose different problems.
For example, reset consideration for memory utilization in FPGA is another challenge to be taken care of.
Block RAMs in FPGA might not be used due to incompatibility of reset requirement.

Set resources are not typically available in FPGA.
Most FPGAs have synchronous resets which need careful study of FPGA resources for logic mapping.

RAMs in designs are not initialized in any design unless the design requires it.
Also, it is not a good practice to reset RAM in designs if it has asynchronous reset.
```

Interpretação:

Em FPGA, otimização de área depende dos recursos físicos disponíveis.

Por exemplo, se o RTL exige reset assíncrono para uma memória grande, a ferramenta pode não conseguir mapear essa memória para Block RAM, porque BRAMs têm restrições específicas de reset/inicialização.

Resultado:

```text
memória pode virar registradores distribuídos
área explode
recursos FPGA são desperdiçados
```

A recomendação é evitar resetar RAM sem necessidade, especialmente com reset assíncrono.

---

## Aula didática desenvolvida

### 1. Timing optimization não é uma coisa só

Quando dizemos “otimizar timing”, podemos querer coisas diferentes:

```text
aumentar throughput
reduzir latency
aumentar frequência máxima
reduzir delay do caminho crítico
```

Esses objetivos estão relacionados, mas não são idênticos.

Um pipeline pode aumentar throughput, mas aumentar ou manter latência em ciclos.

Uma lógica paralela pode reduzir latência, mas aumentar área.

Um retiming pode melhorar frequência máxima sem mudar função externa.

Por isso, antes de otimizar, é preciso saber qual métrica importa.

---

### 2. Throughput versus latency

#### Throughput

Mede quantos dados são processados por unidade de tempo.

Exemplo:

```text
1 resultado por ciclo
clock de 200 MHz
throughput = 200 milhões de resultados por segundo
```

#### Latency

Mede quanto tempo um dado individual leva para atravessar o sistema.

Exemplo:

```text
entrada no ciclo 0
saída no ciclo 5
latência = 5 ciclos
```

Um pipeline profundo pode ter:

```text
latência alta
throughput alto
```

Porque o primeiro dado demora para sair, mas depois o circuito produz resultados rapidamente.

---

### 3. Caminho crítico

O caminho crítico é o caminho mais lento entre registradores.

Ele define a frequência máxima.

Se o caminho crítico tem 10 ns, o clock precisa ser maior que isso, considerando margens.

Se você quer clock de 5 ns, precisa reduzir o caminho crítico.

Técnicas:

```text
retiming
pipeline
registradores extras
paralelização
replicação
flattening
reorder path
```

---

### 4. Componentes do timing path

A fórmula do slide é:

```text
delay = clock-to-Q + interconnect + combinational logic + setup + clock skew
```

Isso mostra que timing não depende só da lógica combinacional.

#### Clock-to-Q

Tempo para o dado aparecer na saída do registrador após a borda de clock.

#### Interconnect delay

Atraso dos fios.

#### Combinational logic delay

Atraso das portas lógicas entre registradores.

#### Setup time

Tempo mínimo que o dado precisa estar estável antes da borda de captura.

#### Clock skew

Diferença de chegada do clock entre registrador de lançamento e registrador de captura.

---

### 5. Pipelining para throughput

Pipelining divide uma computação em estágios.

Exemplo sem pipeline:

```text
operação A → operação B → operação C
resultado só sai depois de tudo
```

Com pipeline:

```text
estágio 1: operação A
estágio 2: operação B
estágio 3: operação C
```

Cada estágio trabalha em um dado diferente.

Isso aumenta throughput, pois o circuito pode aceitar novos dados antes de o dado anterior terminar.

Custo:

```text
mais registradores
mais controle
possível aumento de latência
mais área
```

---

### 6. Paralelismo para reduzir latência

Se você tem operações independentes, pode executá-las em paralelo.

Exemplo:

```text
x = a + b
y = c + d
z = x + y
```

As duas primeiras somas podem acontecer ao mesmo tempo.

Isso reduz ciclos ou caminho lógico, mas exige mais unidades funcionais.

Tradeoff:

```text
menos latência → mais hardware
```

---

### 7. Retiming

Retiming move registradores dentro do datapath.

Exemplo:

```text
antes:
Reg → lógica 40 ns → Reg

depois:
Reg → lógica 20 ns → Reg → lógica 20 ns → Reg
```

Se a função externa for preservada, o design continua equivalente, mas pode operar com clock mais rápido.

Retiming é poderoso porque não necessariamente muda o algoritmo, apenas redistribui registradores.

---

### 8. Adicionar registradores

Adicionar registradores quebra caminhos longos.

Isso melhora frequência máxima, mas aumenta latência.

Exemplo:

```text
antes:
1 ciclo para atravessar caminho longo

depois:
2 ciclos, mas cada ciclo tem caminho menor
```

Atenção:

```text
em caminhos paralelos, registradores extras precisam ser adicionados de forma alinhada
```

para que os dados continuem chegando juntos.

---

### 9. Estruturas paralelas

Estruturas paralelas transformam lógica serial em lógica simultânea.

Exemplo:

```text
32-bit operation
```

pode ser dividida em partes de 16 bits, se a dependência permitir.

Isso reduz delay, mas pode exigir mais recursos.

---

### 10. Flattening

Flattening remove hierarquia para permitir otimização global.

Vantagem:

```text
ferramenta enxerga mais oportunidades de simplificação
```

Desvantagem:

```text
pode dificultar debug
pode aumentar tempo de síntese
pode prejudicar modularidade
```

O slide cita priority encoding como exemplo de lógica encadeada que pode se beneficiar.

---

### 11. Reorder path

Em lógica condicional, a ordem das condições pode afetar timing.

Exemplo:

```systemverilog
if (cond_slow)
  y = a;
else if (cond_fast)
  y = b;
else
  y = c;
```

Se `cond_slow` está no caminho crítico, reordenar ou reestruturar pode reduzir atraso.

Isso é útil em lógica com muitas condições.

---

### 12. Replication

Replication copia lógica para reduzir fanout e delay.

Se uma lógica gera um sinal usado em muitos lugares, o fanout pode ser alto.

Duplicar essa lógica cria cópias locais, cada uma dirigindo menos cargas.

Benefício:

```text
melhor timing
menor fanout
menor interconnect delay
```

Custo:

```text
mais área
```

---

### 13. Folding para área

Folding é reutilizar uma unidade funcional em múltiplos ciclos.

Exemplo:

```text
quatro multiplicações independentes
```

Sem folding:

```text
4 multiplicadores
1 ciclo
```

Com folding:

```text
1 multiplicador
4 ciclos
muxes selecionam operandos
```

Isso reduz área porque multiplicadores são caros. Muxes e controle costumam custar menos.

---

### 14. Rolling up the pipeline

Rolling é desfazer parte do unrolling/pipelining para reutilizar hardware.

Se unrolling melhora throughput aumentando área, rolling faz o contrário:

```text
reduz área
aumenta tempo de computação
reutiliza recursos
```

É útil quando área é mais importante que desempenho máximo.

---

### 15. Resource sharing

Resource sharing é compartilhar recursos entre blocos ou operações que não precisam operar ao mesmo tempo.

Exemplos:

```text
contador
timer
multiplicador
somador
comparador
shifter
```

Se dois módulos usam um timer em momentos mutuamente exclusivos, talvez um único timer compartilhado baste.

Custo:

```text
muxes
glue logic
controle
possível perda de paralelismo
```

Benefício:

```text
menor área
```

---

### 16. FPGA: cuidado com reset e RAM

O slide final destaca um problema prático importante.

Em FPGA, memórias grandes devem mapear para Block RAM quando possível.

Mas certas escolhas de RTL impedem isso.

Exemplo problemático:

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin
    for (int i = 0; i < DEPTH; i++)
      mem[i] <= '0;
  end
  else begin
    ...
  end
end
```

Esse reset assíncrono de RAM pode impedir mapeamento para BRAM.

A ferramenta pode implementar a memória com registradores, consumindo muito mais área.

Regra prática:

```text
não resetar RAM se o design não exige.
não usar reset assíncrono em RAM se isso impede mapeamento eficiente.
```

---

## Conceitos difíceis explicados em profundidade

### 1. Pipeline pode aumentar throughput sem reduzir latência

Um erro comum é pensar que pipeline sempre deixa tudo mais rápido em termos de latência.

Na verdade:

```text
pipeline melhora taxa de produção
mas pode manter ou aumentar o número de ciclos até o primeiro resultado
```

Exemplo:

```text
sem pipeline:
  1 dado entra
  resultado sai após 3 ciclos
  novo dado só entra depois

com pipeline:
  1 dado entra a cada ciclo
  resultado ainda sai após 3 ciclos
  mas depois sai 1 resultado por ciclo
```

---

### 2. Área versus tempo

Muitas otimizações são escolhas entre:

```text
mais hardware e menos tempo
menos hardware e mais tempo
```

Exemplos:

| Técnica | Melhora | Custo |
|---|---|---|
| Paralelismo | latency/throughput | área |
| Pipeline | throughput/frequência | registradores/latência |
| Retiming | timing | possível complexidade |
| Replication | fanout/timing | área |
| Folding | área | ciclos/controle |
| Rolling | área | throughput/latência |
| Resource sharing | área | muxes/controle/possível timing |

---

### 3. Retiming não é simplesmente adicionar registradores

Retiming move registradores existentes ou redistribui registradores.

Adicionar registradores cria novos pontos de armazenamento.

Ambos podem melhorar timing, mas são conceitos diferentes.

```text
retiming:
  move registradores sem mudar comportamento visível

adding registers:
  pode aumentar latência e exige alinhamento funcional
```

---

### 4. Por que adicionar registrador em todos os caminhos paralelos?

Imagine:

```text
caminho A recebe registrador extra
caminho B não recebe
```

Agora A atrasa um ciclo em relação a B.

Se A e B se combinam depois, a operação pode misturar dados de ciclos diferentes.

Por isso, em datapaths paralelos, pipeline precisa ser balanceado.

---

### 5. Flattening pode ajudar ou atrapalhar

Flattening ajuda a ferramenta a enxergar lógica entre módulos.

Mas pode dificultar:

```text
debug hierárquico
incremental compile
reuso de blocos
controle de constraints por módulo
```

Use quando o ganho de otimização global compensa perda de estrutura.

---

### 6. Replication e fanout

Fanout alto aumenta delay porque uma saída precisa carregar muitas entradas.

Replication cria cópias da lógica para reduzir a carga por cópia.

Exemplo:

```text
1 gerador de enable para 200 FFs
```

pode virar:

```text
4 geradores equivalentes de enable, cada um para 50 FFs
```

Área aumenta, mas timing melhora.

---

### 7. Folding versus resource sharing

Folding é uma forma específica de compartilhar recursos ao longo do tempo, normalmente dentro de uma computação ou datapath.

Resource sharing é mais geral: pode compartilhar recursos entre blocos diferentes, modos diferentes ou operações diferentes.

Ambos reduzem área, mas exigem controle para multiplexar entradas e agendar uso.

---

### 8. Multiplicadores são caros

O slide enfatiza que muxes são mais baratos que multiplicadores.

Por isso, trocar vários multiplicadores por um multiplicador compartilhado com muxes pode reduzir área.

Mas cuidado:

```text
muxes também têm atraso
controle fica mais complexo
latência aumenta
throughput pode cair
```

---

### 9. Rolling pode permitir outras otimizações

O slide diz que rolling pode simplificar lógica complexa, abrindo espaço para mais redução de área.

Isso acontece porque, ao reutilizar hardware, a ferramenta pode remover duplicações e combinar controle.

Mas rolling precisa ser analisado com cuidado porque pode aumentar ciclos.

---

### 10. FPGA não é ASIC

Algumas otimizações de ASIC não funcionam da mesma forma em FPGA.

Em FPGA, os recursos são discretos:

```text
LUTs
FFs
BRAMs
DSPs
carry chains
clock networks
```

Uma mudança pequena no RTL pode fazer a ferramenta deixar de usar BRAM ou DSP e mapear tudo em LUT/FF, aumentando área e reduzindo performance.

Por isso, reset, inicialização de RAM e estilo de código são críticos em FPGA.

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — Terminologias de timing

A página 1 mostra duas partes: a definição de throughput, critical path, latency e timing; depois mostra uma cadeia de registradores com componentes de delay. A figura da cadeia Reg1-Reg4 é importante para visualizar latency de 4 ciclos e throughput de 8 bits por ciclo.

### Página 2 — Throughput e latency

A página 2 compara otimização para throughput e otimização para latency usando o exemplo de `x³`. A parte superior mostra uma implementação iterativa/pipeline com feedback; a parte inferior mostra lógica paralela para reduzir latência.

### Página 3 — Fórmula de frequência máxima e estratégias gerais

A página 3 mostra a fórmula de `frequency_max` em função de clock-to-Q, interconnect, combinational delay, setup e clock skew. A segunda parte lista as estratégias de melhoria de timing: retiming, registros, paralelismo, flattening, reorder e replication.

### Página 4 — Retiming e estratégias de timing

A página 4 aprofunda retiming e adição de registradores, mostrando melhora de path delay de 40 ns para 20 ns no exemplo. Também lista parallel structure, flattening logic, reorder path e replication.

### Página 5 — Pipeline balanceado e folding

A página 5 mostra diagramas de caminhos paralelos com registradores adicionados e uma árvore de operações com delays. Depois introduz folding para área, mostrando que unidades funcionais comuns podem ser compartilhadas por meio de muxes.

### Página 6 — Rolling e resource sharing

A página 6 mostra rolling up the pipeline usando novamente o exemplo de `x³`. A parte final mostra resource sharing, com contadores/timers compartilhados e observações importantes sobre FPGA, BRAM, resets síncronos e assíncronos.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é throughput?**  
   Quantidade de dados processados por ciclo de clock ou por segundo.

2. **O que é critical path?**  
   O maior atraso para um sinal viajar de um registrador até outro.

3. **O que é latency?**  
   Tempo entre entrada e saída de dados, normalmente medido em ciclos de clock.

4. **Quando timing é considerado não atendido?**  
   Quando o atraso do caminho crítico ou propagação é maior que o período de clock.

5. **Quais componentes formam o delay de um timing path segundo o slide?**  
   Clock-to-Q delay, interconnect delay, combinational logic delay, setup time e clock skew.

6. **Qual é o objetivo da otimização de timing?**  
   Melhorar throughput, reduzir latência e otimizar delay.

7. **Como throughput pode ser aumentado?**  
   Usando pipelining/organização em estágios e, em alguns casos, unrolling/mais recursos.

8. **Como latency pode ser reduzida?**  
   Usando lógica paralela e mais recursos para executar operações ao mesmo tempo.

9. **Qual é o tradeoff de reduzir latency com lógica paralela?**  
   Aumenta recursos e, portanto, área.

10. **O que limita a frequência máxima?**  
    A soma de clock-to-Q, interconnect, combinational delay, setup e clock skew.

11. **Quais estratégias de melhoria de timing são listadas?**  
    Retiming, adding registers, parallel structures, flattening logic, reorder input patterns e replications.

12. **O que é retiming?**  
    Mover ou realocar registradores no datapath sem mudar a funcionalidade.

13. **Qual efeito de adicionar registradores no datapath?**  
    Melhora timing ao quebrar caminhos, mas aumenta latência.

14. **Por que adicionar registradores em todos os caminhos paralelos?**  
    Para manter a mesma funcionalidade e alinhamento temporal dos dados.

15. **O que é parallel structure?**  
    Reorganizar o caminho crítico para que estruturas lógicas operem em paralelo.

16. **O que é flattening the logic?**  
    Remover hierarquia para permitir otimização global da lógica.

17. **O que é reorder path?**  
    Modificar a ordem de entradas/condições para reduzir atraso do caminho crítico.

18. **O que é replication of logic?**  
    Copiar lógica para reduzir fanout e atraso de propagação.

19. **O que é folding?**  
    Reduzir o número de unidades funcionais compartilhando recursos, ao custo de aumentar tempo de computação.

20. **Qual é o custo do folding?**  
    Mais ciclos, muxes e controle; porém menos unidades funcionais caras.

21. **Por que folding pode reduzir área mesmo adicionando muxes?**  
    Porque muxes são menos custosos em área que multiplicadores e outras unidades funcionais grandes.

22. **O que é rolling up the pipeline?**  
    Reutilizar recursos de lógica em diferentes estágios de computação para reduzir área.

23. **Qual é o efeito de unrolling pipelines?**  
    Melhora throughput.

24. **Qual é o efeito de rolling up?**  
    Melhora área, mas pode aumentar ciclos ou reduzir desempenho.

25. **O que é resource sharing?**  
    Compartilhar recursos lógicos entre operações ou blocos diferentes para reduzir área.

26. **Quais recursos são citados como bons exemplos para sharing?**  
    Counters e timers.

27. **Qual cuidado o slide traz sobre FPGA e RAM?**  
    Requisitos de reset podem impedir uso eficiente de Block RAM; não é boa prática resetar RAM com reset assíncrono se o design não exige.

### Pegadinhas

- Throughput alto não significa necessariamente baixa latência.
- Pipeline pode aumentar throughput, mas a latência em ciclos pode permanecer ou aumentar.
- Reduzir latency com paralelismo geralmente aumenta área.
- A frequência máxima depende também de interconnect, setup e clock skew, não apenas da lógica combinacional.
- Retiming não muda funcionalidade, mas move registradores.
- Adicionar registradores melhora timing, mas aumenta latência.
- Em caminhos paralelos, registradores precisam ser balanceados.
- Replication melhora fanout/timing, mas aumenta área.
- Folding reduz área, mas aumenta tempo de computação.
- Rolling é o oposto conceitual de unrolling.
- Resource sharing reduz área, mas exige controle e pode prejudicar paralelismo.
- Em FPGA, reset mal especificado pode impedir uso de Block RAM.
- RAM não deve ser resetada/inicializada sem necessidade de design.

### Frases para memorizar

```text
Throughput mede taxa; latency mede tempo de atravessamento.
Critical path define a frequência máxima.
Timing falha quando o atraso do caminho crítico excede o período de clock.
Pipelining melhora throughput.
Lógica paralela reduz latency, mas aumenta área.
Retiming move registradores sem mudar funcionalidade.
Adicionar registradores quebra caminhos, mas aumenta latência.
Replication reduz fanout, mas aumenta área.
Folding reduz unidades funcionais, mas aumenta ciclos.
Rolling melhora área; unrolling melhora throughput.
Resource sharing reduz área compartilhando recursos.
Em FPGA, reset de RAM pode impedir mapeamento eficiente para Block RAM.
```

---

## Relação com projeto/laboratório

Esta aula é diretamente aplicável quando você olha relatórios de síntese e tenta melhorar timing ou área.

### Quando o problema é timing

Perguntar:

```text
qual é o caminho crítico?
o atraso está em lógica combinacional ou interconnect?
há fanout alto?
dá para adicionar pipeline?
dá para retiming?
dá para paralelizar?
dá para replicar lógica?
dá para achatar hierarquia?
dá para reordenar condições?
```

### Quando o problema é área

Perguntar:

```text
há multiplicadores/somadores duplicados?
operações podem compartilhar recurso?
dá para aplicar folding?
dá para rolling up pipeline?
contadores/timers podem ser compartilhados?
arrays/RAMs estão mapeando para recursos eficientes?
reset está impedindo BRAM em FPGA?
```

### Exemplo de decisão de arquitetura

Para calcular várias multiplicações:

#### Arquitetura rápida

```text
vários multiplicadores em paralelo
baixa latência
alto throughput
maior área
```

#### Arquitetura compacta

```text
um multiplicador compartilhado
muxes e controle
mais ciclos
menor área
```

A escolha depende do requisito do sistema.

### Checklist de otimização

- [ ] Identifique o caminho crítico.
- [ ] Separe problema de throughput, latency e frequency.
- [ ] Verifique se pipeline é aceitável.
- [ ] Verifique se aumento de latência é permitido.
- [ ] Verifique se há caminhos paralelos que precisam ser balanceados.
- [ ] Verifique fanout alto para possível replication.
- [ ] Verifique se flattening ajudaria.
- [ ] Verifique se operações caras podem ser compartilhadas.
- [ ] Verifique se folding/rolling é aceitável.
- [ ] Em FPGA, verifique se RAMs estão inferindo BRAM corretamente.

---

## Necessidade de áudio

**Médio.**

Os prints são suficientes para reconstruir os conceitos principais, mas alguns detalhes poderiam ser confirmados com a fala do professor:

- a relação exata que o curso faz entre pipelining e unrolling no slide de throughput;
- o exemplo numérico completo de `x³`;
- a interpretação específica do “rolling factor N”;
- os detalhes das figuras de retiming e folding;
- se alguma questão do banco cobra literalmente “rolling up improves area” ou “unrolling pipelines improve throughput”.

Mesmo sem áudio, a lógica dos slides está clara.

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado seguindo o roteiro.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 023 — 01 Introduction to Verification**

Nova seção:

```text
05 Design Verification
```

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\01 Introduction to Verification.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\01 Introduction to Verification.md
```
