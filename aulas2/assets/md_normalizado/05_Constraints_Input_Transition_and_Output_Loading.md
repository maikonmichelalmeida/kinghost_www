# 05 Constraints - Input Transition and Output Loading

## Controle do bloco

- **Bloco:** 038
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Aula:** 05 Constraints - Input Transition and Output Loading
- **Arquivo de origem:** `05 Constraints - Input Transition and Output Loading.docx`
- **Faixa de slides:** 1-11
- **Caminho sugerido para salvar:**  
  `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\05 Constraints - Input Transition and Output Loading.md`
- **Próximo bloco recomendado:** Bloco 039 - `06 Design Compiler NXT Ultra Synthesis Techniques - parte A`

---

## Resumo executivo

Esta aula continua o assunto de constraints de timing no Design Compiler NXT. Na aula anterior, o foco principal foi em `create_clock`, `set_input_delay` e `set_output_delay`, ou seja, em dizer ao DC NXT quanto tempo externo já foi consumido antes da entrada do bloco e quanto tempo externo será necessário depois da saída do bloco.

Aqui entra uma parte que costuma ser esquecida, mas é fundamental para uma análise de timing mais realista: **a forma elétrica dos sinais nas entradas e as cargas capacitivas nas saídas**. Mesmo que o período de clock, os atrasos de entrada e os atrasos de saída estejam definidos, o DC NXT ainda precisa saber duas coisas:

1. **Quão rápido ou lento o sinal chega nas entradas**: isso é modelado por `set_input_transition` ou por `set_driving_cell`.
2. **Quanto peso elétrico a saída precisa dirigir**: isso é modelado por `set_load` e, em alguns casos, por `set_max_capacitance`.

Sem essas informações, a ferramenta pode assumir condições irreais, como transições de entrada instantâneas ou cargas de saída nulas. Isso deixa o cálculo de atraso otimista demais e pode levar a uma netlist que parece boa no relatório, mas não se comporta bem quando integrada ao sistema real.

A aula também introduz a ideia de **load budgeting**, que é uma estratégia conservadora usada quando ainda não se sabe exatamente quais células dirigem as entradas e quais blocos serão conectados nas saídas.

---

## Texto extraído e organizado por slide

### Slide 1 — DC NXT Physical Synthesis Flow

O fluxo de síntese física do DC NXT aparece novamente com destaque na etapa:

```text
Apply Constraints
```

A sequência mostrada é:

```text
Specify Libraries
Load RTL Code
Load Floorplan
Apply Constraints
Synthesize the Design
Analyze Results
Write out Netlist with Cell Placement
```

A aula está localizada justamente na fase de aplicação de constraints antes da síntese. Nesta etapa, além dos constraints de clock, input delay e output delay, também entram constraints elétricos associados a transição de entrada e carga de saída.

---

### Slide 2 — Factors Affecting Timing

O slide mostra um bloco `MY_DESIGN` com:

- porta de entrada `A`;
- caminho interno passando por lógica combinacional e registradores;
- porta de saída `B`;
- uma célula externa dirigindo a entrada;
- uma carga capacitiva externa na saída.

O script base mostrado é:

```tcl
create_clock -period 2 [get_ports Clk]
set_input_delay  -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

Mensagem central do slide:

```text
The above constraints are required, but not sufficient for accurate timing analysis and optimization of I/O logic paths.
Need to take into account input transition times and output loads.
```

Tradução:

Os constraints acima são necessários, mas não suficientes para uma análise e otimização de timing precisa dos caminhos de I/O. Também é preciso considerar os tempos de transição nas entradas e as cargas nas saídas.

---

### Slide 3 — Effect of Output Capacitive Load

O slide mostra uma saída `B` dirigindo uma carga capacitiva externa. A pergunta visual é:

```text
3fF or 30fF?
```

A ideia é mostrar que uma saída com carga pequena comuta rápido, enquanto uma saída com carga maior comuta mais devagar. Essa transição mais lenta aumenta o atraso efetivo da célula que está dirigindo a saída.

Texto central:

```text
Capacitive loading on an output port affects the transition time, and thereby the cell delay of the output driver.

By default, DC NXT assumes zero capacitive loading on outputs. Therefore, it is important to accurately model capacitive loading on all outputs.
```

Tradução:

A carga capacitiva em uma porta de saída afeta o tempo de transição e, por consequência, o atraso da célula que dirige essa saída. Por padrão, o DC NXT assume carga capacitiva zero nas saídas. Por isso é importante modelar corretamente a carga capacitiva em todas as saídas.

---

### Slide 4 — Modeling Output Capacitive Load: Example 1

Especificação:

```text
Maximum capacitive load on output port B = 30fF
```

O slide indica que, neste exemplo, a unidade de capacitância é `1pF`, definida na technology library. Logo:

```text
30fF = 30 / 1000 pF = 0.03pF
```

Comando mostrado:

```tcl
create_clock -period 2 [get_ports Clk]
set_input_delay  -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]
set_load -max [expr {30.0/1000}] [get_ports B]
```

O comando `set_load` aplica carga capacitiva na porta de saída `B`.

A pergunta do slide:

```text
What if an absolute capacitive load value is not available?
```

Ou seja: e se você não souber a carga exata em fF ou pF?

---

### Slide 5 — Modeling Output Capacitive Load: Example 2

Especificação:

```text
Maximum load on output port B = 1 "AN2" gate load
or
Maximum load on output port B = 3 "inv1a0" gates
```

Quando a carga absoluta não é conhecida, podemos usar a carga de entrada de uma célula da biblioteca como referência. O comando destacado é `load_of`.

Exemplo 1: carregar a saída `B` com a capacitância equivalente ao pino `A` de uma célula `AN2`:

```tcl
set_load -max [load_of my_lib/AN2/A] [get_ports B]
```

Exemplo 2: carregar a saída `B` com a capacitância equivalente a três entradas de inversores `inv1a0`:

```tcl
set_load -max [expr {[load_of my_lib/inv1a0/A] * 3}] \
    [get_ports B]
```

A utilidade disso é transformar uma especificação aproximada em algo que o DC NXT entende eletricamente.

---

### Slide 6 — Effect of Input Transition Time

O slide mostra que a entrada `A` pode chegar com transição rápida ou lenta. Essa transição influencia o atraso das células internas que recebem esse sinal.

Texto central:

```text
Rise and fall transition times on an input port affect the cell delay of the input gate.

By default DC NXT assumes zero transition times on inputs. It is therefore important to accurately model transition times on all inputs.
```

Tradução:

Os tempos de subida e descida em uma porta de entrada afetam o atraso da célula de entrada. Por padrão, o DC NXT assume tempo de transição zero nas entradas. Portanto, é importante modelar corretamente as transições em todas as entradas.

---

### Slide 7 — Modeling Input Transition: Example 1

Especificação:

```text
Maximum rise/fall input transition on input port A = 0.12ns
```

Comando mostrado:

```tcl
create_clock -period 2 [get_ports Clk]
set_input_delay  -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]
set_load -max [expr {30.0/1000}] [get_ports B]
set_input_transition -max 0.12 [get_ports A]
```

O comando `set_input_transition` informa diretamente o tempo máximo de transição da entrada `A`.

Pergunta do slide:

```text
What if a specific transition time value is not known?
```

Ou seja: e se o projetista não souber o tempo exato de subida/descida?

---

### Slide 8 — Modeling Input Transition: Example 2

Especificação:

```text
Driving cell on input port A = OR3B gate
or
Driving cell on input port A = Qn pin of FD1 flip-flop
```

Quando a transição exata não é conhecida, é possível dizer ao DC NXT **qual célula externa está dirigindo a entrada**. A ferramenta usa os modelos da biblioteca para estimar a transição e a capacidade de drive.

Comandos mostrados:

```tcl
create_clock -period 10 [get_ports Clk]
set_input_delay  -max 3 -clock Clk [get_ports A]
set_output_delay -max 4 -clock Clk [get_ports B]
set_load -max [expr {30.0/1000}] [get_ports B]

set_driving_cell -max -lib_cell OR3B [get_ports A]
```

Alternativa usando um pino específico de uma célula sequencial:

```tcl
set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

Observações importantes do slide:

- Se nenhum pino for fornecido, o DC NXT usa o primeiro pino de saída listado na definição da célula da biblioteca.
- A porta `A` também herda logic DRCs definidos no pino de saída da driving cell, como `max_transition` e `max_capacitance`.

---

### Slide 9 — Load Budgeting

Pergunta do slide:

```text
What if, prior to compiling, the cells driving your inputs, and the loads on your outputs are not known?
```

Resposta:

```text
Create a Load Budget!
```

Tradução:

Se antes da compilação você ainda não sabe quais células dirigem suas entradas nem quais cargas estão conectadas às saídas, crie um orçamento de carga.

A figura mostra um bloco `MY_BLOCK` entre outros blocos ainda parcialmente desconhecidos (`X_BLOCK`, `Y_BLOCK`, `Z_BLOCK`). Isso é comum em projeto hierárquico: um bloco é sintetizado antes de todo o sistema estar completamente integrado.

---

### Slide 10 — Load Budgeting Assumptions

O slide propõe hipóteses conservadoras:

```text
Apply a weak driving cell on inputs (to be conservative): inv1a1
```

Ou seja, nas entradas, assume-se uma célula fraca dirigindo o sinal. Uma célula fraca produz uma transição mais lenta, então o DC NXT fica menos otimista.

Para saídas:

```text
Apply a reasonable maximum output load by:
- Limit the input capacitance fanout of 10 "and2a1" gates
- Estimating the number of other major blocks your outputs may have to drive: 3
```

Em outras palavras, cria-se uma estimativa máxima razoável:

- cada entrada do bloco deve ser limitada a uma capacitância equivalente a 10 entradas de uma porta `and2a1`;
- cada saída pode precisar dirigir até 3 blocos externos.

Comandos associados:

```tcl
set_driving_cell
set_max_capacitance
set_load
```

---

### Slide 11 — Load Budget Script

O slide mostra um script genérico de time e load budgeting para blocos `MY_BLOCK`, `X_BLOCK` e `Y_BLOCK`.

Código organizado:

```tcl
# A generic Time and Load Budgeting script file
# for MY_BLOCK, X_BLOCK and Y_BLOCK

remove_sdc
source timing_budget.tcl

set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports Clk]]

# Assume a weak driving buffer on the inputs
set_driving_cell -max -no_design_rule -lib_cell inv1a1 $ALL_INP_EXC_CLK

# Limit the input load
set MAX_INPUT_LOAD [expr {[load_of ssc_core_slow/and2a1/A] * 10}]
set_max_capacitance $MAX_INPUT_LOAD $ALL_INP_EXC_CLK

# Model the max possible load on the outputs, assuming
# outputs will only be tied to 3 subsequent blocks
set_load -max [expr {$MAX_INPUT_LOAD * 3}] [all_outputs]
```

Ideia do script:

1. Remove constraints antigos com `remove_sdc`.
2. Carrega o orçamento de timing com `source timing_budget.tcl`.
3. Separa todas as entradas exceto o clock.
4. Assume uma célula fraca dirigindo as entradas.
5. Limita a capacitância máxima permitida nas entradas.
6. Aplica uma carga máxima estimada nas saídas.

---

## Aula didática desenvolvida

### 1. Por que input transition e output load entram em timing?

Em circuitos digitais reais, sinais não mudam instantaneamente de 0 para 1 ou de 1 para 0. Existe um tempo de transição. Além disso, toda saída que dirige outro circuito precisa carregar e descarregar capacitâncias: capacitância de portas conectadas, capacitância de interconexão, capacitância de pads, capacitância de entrada de outros blocos etc.

O atraso de uma célula depende fortemente dessas duas coisas:

- **Slew de entrada**: quão lenta ou rápida é a transição que chega na entrada da célula.
- **Carga de saída**: quanta capacitância a célula precisa carregar/descarregar na saída.

Em bibliotecas `.db`, as tabelas de timing normalmente são indexadas por essas variáveis. Simplificando, a célula não tem um único atraso fixo. Ela tem uma tabela parecida com:

```text
delay = f(input_transition, output_load)
```

Se a entrada chega lenta, a célula pode demorar mais para comutar. Se a saída dirige muita carga, a célula também demora mais para entregar um nível lógico válido.

Por isso, constraints como `set_input_delay` e `set_output_delay` dizem **quanto tempo externo é consumido**, mas não dizem **qual é a qualidade elétrica do sinal**.

---

### 2. Diferença entre delay constraint e electrical constraint

Um erro comum é misturar estes dois mundos.

#### Timing delay constraints

São comandos como:

```tcl
create_clock
set_input_delay
set_output_delay
```

Eles respondem perguntas do tipo:

- Qual é o período do clock?
- Quanto tempo a lógica externa antes da entrada já consumiu?
- Quanto tempo a lógica externa depois da saída precisa reservar?
- Quanto tempo sobra para a lógica interna?

#### Electrical constraints

São comandos como:

```tcl
set_load
set_input_transition
set_driving_cell
set_max_capacitance
```

Eles respondem perguntas do tipo:

- A saída vai dirigir uma carga pequena ou grande?
- A entrada chega com transição rápida ou lenta?
- Qual célula externa dirige essa entrada?
- Qual carga máxima uma entrada ou net pode apresentar para o bloco anterior?

O timing constraint define a janela temporal. O electrical constraint ajuda a calcular atrasos realistas dentro dessa janela.

---

### 3. O problema da carga de saída

Quando uma saída do bloco está conectada a outro bloco, ela precisa carregar a capacitância de entrada desse bloco. Quanto maior a capacitância, mais lenta a transição da saída e maior o atraso da célula que dirige essa saída.

Por padrão, o DC NXT assume carga zero nas saídas. Isso é perigoso porque torna o cálculo otimista. Uma saída sem carga é fácil de dirigir; uma saída conectada a múltiplas entradas de outros blocos pode exigir uma célula maior ou buffers adicionais.

O comando principal é:

```tcl
set_load -max <valor> [get_ports <porta>]
```

Exemplo:

```tcl
set_load -max 0.03 [get_ports B]
```

Se a unidade de capacitância da biblioteca for `pF`, então `0.03` significa `0.03pF`, ou `30fF`.

---

### 4. Usando `load_of` quando a carga absoluta não é conhecida

Nem sempre o projetista sabe a carga em pF ou fF. Muitas vezes a especificação vem em termos de "gate load", como:

```text
A saída B deve dirigir o equivalente a 3 inversores.
```

Nesse caso, usa-se `load_of`.

Exemplo:

```tcl
set_load -max [load_of my_lib/AN2/A] [get_ports B]
```

Esse comando pega da biblioteca a capacitância do pino `A` da célula `AN2` e aplica essa capacitância como carga na porta `B`.

Para três inversores:

```tcl
set_load -max [expr {[load_of my_lib/inv1a0/A] * 3}] \
    [get_ports B]
```

Isso é melhor do que inventar um número absoluto sem base.

---

### 5. O problema da transição de entrada

A transição que chega na entrada do bloco também afeta o timing interno. Se a entrada chega lentamente, a primeira célula interna que recebe esse sinal pode ter atraso maior.

Por padrão, o DC NXT assume transição zero nas entradas. Isso significa uma borda ideal, instantânea. Na prática, isso é otimista demais.

Se você conhece o valor de transição, use:

```tcl
set_input_transition -max 0.12 [get_ports A]
```

Esse comando diz:

```text
A porta A pode chegar com transição máxima de 0.12ns.
```

---

### 6. Usando `set_driving_cell` quando a transição exata não é conhecida

Se você não sabe a transição exata, mas sabe qual célula externa dirige a entrada, use:

```tcl
set_driving_cell -max -lib_cell OR3B [get_ports A]
```

Esse comando informa ao DC NXT que a porta `A` é dirigida por uma célula `OR3B` da biblioteca. A ferramenta usa as informações elétricas da célula para estimar a transição e os efeitos de drive.

Se a célula tem vários pinos de saída, você pode especificar o pino:

```tcl
set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

Isso evita ambiguidade.

---

### 7. Por que assumir uma célula fraca pode ser conservador?

No load budgeting, o slide recomenda assumir uma célula fraca dirigindo as entradas, como:

```tcl
set_driving_cell -max -no_design_rule -lib_cell inv1a1 $ALL_INP_EXC_CLK
```

Uma célula fraca tem menor capacidade de drive. Isso tende a produzir uma transição mais lenta. Transição lenta geralmente piora o atraso das células internas. Portanto, a síntese não fica excessivamente otimista.

Essa é uma estratégia conservadora: se o bloco passa timing com entradas dirigidas por uma célula fraca, provavelmente estará mais seguro quando for integrado a células reais mais fortes.

---

### 8. `set_max_capacitance` e responsabilidade com o bloco anterior

O comando `set_load` modela a carga que uma saída do seu bloco precisa dirigir.

Já `set_max_capacitance` pode ser usado para limitar a carga que as entradas do seu bloco impõem ao bloco anterior.

Exemplo do script:

```tcl
set MAX_INPUT_LOAD [expr {[load_of ssc_core_slow/and2a1/A] * 10}]
set_max_capacitance $MAX_INPUT_LOAD $ALL_INP_EXC_CLK
```

Interpretação:

- A capacitância máxima de cada entrada, exceto clock, será limitada ao equivalente a 10 entradas da célula `and2a1`.
- Isso evita que a síntese crie uma entrada pesada demais para o bloco anterior dirigir.

---

### 9. Load budgeting em projeto hierárquico

Em um projeto grande, muitas vezes cada bloco é sintetizado separadamente. Nesse estágio, você não sabe exatamente:

- quem dirigirá suas entradas;
- quantos blocos serão conectados às suas saídas;
- qual será a capacitância real de interconexão;
- qual será o fanout final.

Então você cria hipóteses razoáveis:

```tcl
set_driving_cell
set_max_capacitance
set_load
```

Isso não substitui a análise final pós-integração, mas evita que o bloco seja sintetizado em um cenário irreal.

O importante é entender a filosofia:

```text
Melhor usar um orçamento conservador do que sintetizar com entradas e saídas eletricamente não modeladas.
```

---

## Conceitos difíceis explicados em profundidade

### `set_load`

#### O que é

`set_load` aplica uma carga capacitiva em portas ou nets. Nesta aula, o uso principal é em portas de saída.

#### Por que existe

A ferramenta precisa saber quanta carga uma saída dirige para calcular atraso e transição de saída corretamente.

#### Exemplo

```tcl
set_load -max 0.03 [get_ports B]
```

Isso aplica carga máxima de `0.03`, na unidade de capacitância definida pela biblioteca, sobre a porta `B`.

#### Erro comum

Achar que `set_output_delay` já modela a carga de saída. Não modela. `set_output_delay` reserva tempo para a lógica externa. `set_load` modela a capacitância que a saída precisa dirigir.

---

### `load_of`

#### O que é

`load_of` retorna a capacitância de entrada de um pino de uma célula de biblioteca.

#### Exemplo

```tcl
load_of my_lib/AN2/A
```

Isso retorna a carga capacitiva do pino `A` da célula `AN2` na biblioteca `my_lib`.

#### Uso com `set_load`

```tcl
set_load -max [load_of my_lib/AN2/A] [get_ports B]
```

Aplica em `B` a carga equivalente a uma entrada da célula `AN2`.

#### Uso com multiplicação

```tcl
set_load -max [expr {[load_of my_lib/inv1a0/A] * 3}] [get_ports B]
```

Aplica a carga equivalente a três entradas de inversores `inv1a0`.

---

### `set_input_transition`

#### O que é

Define o tempo de transição máximo ou mínimo em uma porta de entrada.

#### Exemplo

```tcl
set_input_transition -max 0.12 [get_ports A]
```

#### Por que existe

A primeira célula interna conectada à entrada `A` terá atraso calculado em função do slew de entrada. Se o slew não for modelado, a ferramenta pode assumir transição ideal.

#### Quando usar

Use quando você conhece diretamente o tempo de subida/descida esperado na entrada.

---

### `set_driving_cell`

#### O que é

Define uma célula externa equivalente que dirige uma porta de entrada.

#### Exemplo

```tcl
set_driving_cell -max -lib_cell OR3B [get_ports A]
```

#### Com pino específico

```tcl
set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

#### Por que existe

Quando você não conhece o slew exato, mas sabe ou pode estimar a célula que dirige a entrada, o DC NXT usa a célula de biblioteca para estimar a transição.

#### Efeito adicional

A porta também pode herdar logic DRCs do pino de saída da driving cell, como:

- `max_transition`;
- `max_capacitance`.

---

### `set_max_capacitance`

#### O que é

Define uma capacitância máxima permitida para um objeto, como porta, net ou conjunto de portas.

#### Exemplo

```tcl
set_max_capacitance $MAX_INPUT_LOAD $ALL_INP_EXC_CLK
```

#### Por que aparece no load budgeting

Ele limita quanto suas entradas podem pesar eletricamente para quem as dirige. Isso ajuda a manter o bloco integrável.

---

### `-no_design_rule`

No script de load budget aparece:

```tcl
set_driving_cell -max -no_design_rule -lib_cell inv1a1 $ALL_INP_EXC_CLK
```

A opção `-no_design_rule` evita que certas design rules da célula usada como modelo sejam impostas de forma indesejada. Em um orçamento genérico, você pode querer usar a célula fraca apenas para modelar drive/transição, sem necessariamente importar todos os limites de design rule dessa célula.

---

### `remove_from_collection`

O script usa:

```tcl
set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports Clk]]
```

Isso cria uma coleção com todas as entradas menos o clock.

Motivo: normalmente não se aplica `set_input_delay`, `set_driving_cell` ou `set_input_transition` ao clock como se ele fosse dado comum. O clock é tratado por comandos próprios, como `create_clock`, `set_clock_uncertainty`, `set_clock_latency` e `set_clock_transition`.

---

## Figuras, diagramas e waveforms importantes

### Carga capacitiva na saída

O diagrama da carga na saída mostra que uma capacitância maior deixa a borda de saída mais lenta. A forma de onda mostra a saída demorando mais para cruzar o ponto de referência, geralmente 50% da tensão.

Ponto de estudo:

```text
Mais carga -> transição mais lenta -> maior atraso da célula de saída.
```

---

### Transição na entrada

O diagrama de input transition mostra que o mesmo caminho pode ter atraso diferente dependendo da inclinação da borda que chega na entrada.

Ponto de estudo:

```text
Entrada lenta -> célula interna comuta pior -> timing mais pessimista.
```

---

### Load budgeting

O diagrama com `MY_BLOCK`, `X_BLOCK`, `Y_BLOCK` e `Z_BLOCK` representa o projeto hierárquico. Ele mostra que o bloco atual muitas vezes é compilado sem saber exatamente o contexto completo.

Ponto de estudo:

```text
Quando o contexto real ainda não existe, use hipóteses conservadoras.
```

---

## Pontos de prova e revisão

### 1. `set_input_delay` e `set_output_delay` são suficientes para timing preciso?

Não. Eles são necessários, mas não suficientes. Também é necessário modelar:

- input transition;
- output load.

---

### 2. O que o DC NXT assume por padrão nas saídas?

Assume **carga capacitiva zero** nas saídas.

Isso é otimista demais e pode gerar resultados irreais.

---

### 3. Qual comando modela carga capacitiva de saída?

```tcl
set_load
```

---

### 4. Como usar uma carga baseada em célula de biblioteca?

```tcl
set_load -max [load_of my_lib/AN2/A] [get_ports B]
```

---

### 5. Qual comando modela diretamente a transição de entrada?

```tcl
set_input_transition
```

---

### 6. Qual comando modela a célula externa que dirige uma entrada?

```tcl
set_driving_cell
```

---

### 7. Quando usar `set_driving_cell` em vez de `set_input_transition`?

Use `set_driving_cell` quando você não sabe o valor numérico da transição, mas sabe ou quer estimar qual célula externa dirige a entrada.

---

### 8. O que é load budgeting?

É a criação de hipóteses conservadoras para drive de entrada e carga de saída quando o contexto real de integração ainda não é conhecido.

---

### 9. Por que remover o clock de `[all_inputs]`?

Porque o clock não deve receber constraints de dado como as demais entradas. Ele é tratado como clock por comandos próprios.

---

### 10. O que `set_max_capacitance` faz no orçamento de carga?

Limita a capacitância máxima que as entradas do bloco podem apresentar ao bloco anterior.

---

## Relação com projeto/laboratório

Esta aula é diretamente aplicável a scripts `.con`, `.sdc` ou `.tcl` de síntese. Em um fluxo real, depois de carregar bibliotecas, RTL e floorplan, você aplica constraints como:

```tcl
create_clock
set_clock_uncertainty
set_input_delay
set_output_delay
set_load
set_input_transition
set_driving_cell
set_max_capacitance
```

Nos labs, é comum encontrar um script separado para constraints, por exemplo:

```text
TOP.con
mydesign.con
timing_budget.tcl
load_budget.tcl
```

A lógica de organização é:

1. O run script chama a preparação do design.
2. O constraints file define clocks e tempos externos.
3. O load budget complementa a visão elétrica das entradas e saídas.
4. A síntese roda com `compile_ultra`.
5. Relatórios como `report_timing`, `report_constraint`, `report_port` e `check_timing` são usados para verificar se os constraints foram aplicados corretamente.

Um ponto importante: se você sintetiza sem `set_load` e sem `set_input_transition`/`set_driving_cell`, a ferramenta pode otimizar o bloco para um mundo idealizado demais. Isso pode esconder problemas que aparecerão depois, na integração ou no pós-layout.

---

## Script consolidado da aula

Um exemplo didático combinando os principais comandos seria:

```tcl
# Clock principal
create_clock -period 2 [get_ports Clk]

# Timing externo
set_input_delay  -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]

# Carga de saída absoluta: 30fF, se a unidade for pF
set_load -max [expr {30.0/1000}] [get_ports B]

# Transição conhecida na entrada
set_input_transition -max 0.12 [get_ports A]
```

Se a transição exata não for conhecida:

```tcl
# Modela célula externa dirigindo A
set_driving_cell -max -lib_cell OR3B [get_ports A]
```

Se a carga absoluta não for conhecida:

```tcl
# Modela B dirigindo 3 inversores
set_load -max [expr {[load_of my_lib/inv1a0/A] * 3}] [get_ports B]
```

Script de orçamento genérico:

```tcl
remove_sdc
source timing_budget.tcl

set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports Clk]]

set_driving_cell -max -no_design_rule -lib_cell inv1a1 $ALL_INP_EXC_CLK

set MAX_INPUT_LOAD [expr {[load_of ssc_core_slow/and2a1/A] * 10}]
set_max_capacitance $MAX_INPUT_LOAD $ALL_INP_EXC_CLK

set_load -max [expr {$MAX_INPUT_LOAD * 3}] [all_outputs]
```

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
