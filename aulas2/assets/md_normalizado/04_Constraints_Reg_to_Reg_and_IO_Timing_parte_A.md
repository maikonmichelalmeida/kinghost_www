# 04 Constraints - Reg-to-Reg and I-O Timing — parte A

## Controle do bloco

- **Bloco:** 036
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\04 Constraints - Reg-to-Reg and I-O Timing.docx`
- **Faixa de slides processada:** slides 1-25
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\04 Constraints - Reg-to-Reg and I-O Timing_parte_A.md`
- **Próximo bloco recomendado:** Bloco 037 — `04 Constraints - Reg-to-Reg and I-O Timing - parte B`, slides 26-47

## Resumo executivo

Esta aula entra no coração da síntese orientada por timing no Design Compiler NXT: **como informar ao sintetizador quanto tempo cada caminho do circuito tem para funcionar**. Até aqui, o fluxo já preparou bibliotecas, RTL, design library, floorplan e objetos de design. Agora o foco passa a ser a etapa **Apply Constraints**, isto é, aplicar restrições temporais antes de rodar `compile_ultra`.

A ideia central é simples, mas poderosa: o Design Compiler NXT não sabe sozinho qual é a frequência-alvo do projeto, quanto atraso existe fora do bloco, quanto tempo o circuito externo consome antes de entregar um sinal de entrada, nem quanto tempo o circuito externo precisa depois de receber uma saída. Essas informações precisam ser declaradas em comandos Tcl/SDC como `create_clock`, `set_clock_uncertainty`, `set_input_delay` e `set_output_delay`.

A aula começa definindo **timing paths**: caminhos de entrada, caminhos registrador-para-registrador, caminhos de saída e caminhos puramente combinacionais. Depois mostra como o clock limita caminhos reg-to-reg, como modelar efeitos pré-layout de clock tree, como incerteza reduz o tempo disponível, e como declarar delays de entrada e saída para representar circuitos externos.

O conceito mais importante da parte A é: **você especifica quanto tempo está sendo consumido pela lógica externa; o DC NXT calcula quanto sobra para a lógica interna**. Se você deixar caminhos sem restrição, o sintetizador pode otimizar o lugar errado ou não otimizar caminhos críticos reais.

## Texto extraído e organizado por slide

### Slide 1 — DC NXT Physical Synthesis Flow

O slide mostra o fluxo de physical synthesis no DC NXT e destaca a etapa **Apply Constraints**. A sequência visual do fluxo é:

1. Specify Libraries
2. Load RTL Code
3. Load Floorplan
4. **Apply Constraints**
5. Synthesize the Design
6. Analyze Results
7. Write out Netlist with Cell Placement

A aula começa exatamente no ponto em que as constraints entram no fluxo: depois de carregar RTL e floorplan, antes de sintetizar.

### Slide 2 — Default Design Scenario

O slide mostra um bloco chamado `MY_DESIGN` conectado a dois blocos externos hipotéticos:

- `JANE's_DESIGN`, como circuito externo de lançamento na entrada;
- `JOE's_DESIGN`, como circuito externo de captura na saída.

O DC NXT assume, por padrão, um ambiente **synchronously-clocked**, isto é, sincronizado por clock.

Por padrão:

- dados de entrada chegam a partir de um dispositivo clockado por borda positiva;
- dados de saída vão para um dispositivo clockado por borda positiva.

Esse modelo é usado para calcular os tempos de setup dos caminhos que entram, saem e atravessam o bloco.

### Slide 3 — Timing Path Definition

O DC NXT divide o projeto em **timing paths**, cada um com:

**Startpoint:**

- porta de entrada, exceto porta de clock;
- pino de clock de flip-flop ou registrador.

**Endpoint:**

- porta de saída, exceto porta de clock;
- qualquer pino de entrada de um dispositivo sequencial, exceto pino de clock.

A figura mostra quatro tipos de caminho:

- **Path 1:** porta de entrada até registrador;
- **Path 2:** registrador até registrador;
- **Path 3:** registrador até porta de saída;
- **Path 4:** porta de entrada até porta de saída, caminho puramente combinacional.

### Slide 4 — Constraining Register-to-Register Paths

A pergunta do slide é:

> What information must you provide to constrain all the register-to-register paths in `MY_DESIGN` for setup time?

Resposta conceitual: é necessário informar o **clock** do design, especialmente o período. Com um clock criado por `create_clock`, o DC NXT consegue derivar automaticamente a restrição de setup para caminhos entre registradores acionados por esse clock.

### Slide 5 — Constraining Reg-to-Reg Paths: Example

Especificação:

```tcl
# Clock Period = 2 ns
create_clock -period 2 [get_ports Clk]
```

O slide pergunta qual é o requisito de atraso máximo `Tmax` para o caminho registrador-para-registrador através de `X` em `MY_DESIGN`.

No exemplo, o clock tem período de 2 ns e o setup do registrador de captura é indicado como `Tsetup = 0.2 ns`. Sem incerteza adicional, o orçamento máximo aproximado para a lógica combinacional `X` é:

```text
Tmax = Period - Tsetup
Tmax = 2.0 - 0.2
Tmax = 1.8 ns
```

### Slide 6 — `create_clock` Required Arguments

Comando mostrado:

```tcl
create_clock -period 2 [get_ports Clk]
```

Elementos importantes:

- `create_clock`: comando Tcl/SDC que cria um objeto de clock na memória do DC NXT;
- `-period 2`: define o período do clock;
- `[get_ports Clk]`: comando embutido que retorna o objeto porta `Clk`;
- por padrão, o clock criado tem o mesmo nome da porta;
- por padrão, a borda de subida ocorre em 0 ns e o duty cycle é de 50%;
- a unidade de tempo é definida pela biblioteca de tecnologia. Neste exemplo, a unidade é 1 ns.

### Slide 7 — Ideal Clock Behavior

Ao definir um clock em um design single-clock, os caminhos entre registradores passam a ser restringidos para **single-cycle setup time**.

Por padrão:

- o clock sobe em 0 ns;
- o duty cycle é de 50%;
- o DC NXT não faz buffering da rede de clock, mesmo se ela alimentar muitos pinos de clock ou enable;
- a rede de clock é tratada como **ideal**.

Um clock ideal tem:

- capacidade de drive infinita;
- tempos de subida e descida iguais a zero;
- skew zero;
- insertion delay ou latency zero.

O slide também alerta que skew, latency e transition estimados podem — e devem — ser modelados para representar melhor o comportamento real do clock.

### Slide 8 — Modeling Clock Trees

O slide enfatiza:

- o DC NXT **não** é usado para sintetizar árvores de clock;
- a síntese da árvore de clock normalmente é feita por uma ferramenta de implementação física/layout, baseada no posicionamento real das células.

Pergunta do slide:

> What clock tree effects need to be taken into account by the synthesis tool, prior to layout?

Resposta: antes do layout, o DC NXT ainda precisa de estimativas de:

- skew;
- jitter/margem;
- latency/insertion delay;
- transition time.

Essas estimativas permitem que o sintetizador não seja otimista demais.

### Slide 9 — Modeling Clock Skew

O slide define que `uncertainty` modela a diferença máxima de atraso entre os ramos da rede de clock, conhecida como **clock skew**, mas também pode incluir **clock jitter** e **margin**.

Comando mostrado:

```tcl
set_clock_uncertainty -setup Ts [get_clocks CLK]
```

Interpretação:

- `set_clock_uncertainty`: adiciona uma margem de incerteza ao clock;
- `-setup`: aplica essa incerteza nas análises de setup;
- `Ts`: valor de incerteza/margem;
- `[get_clocks CLK]`: aplica ao objeto de clock `CLK`.

O slide resume a ideia:

```text
Pre-Layout: clock skew + jitter + margin
```

### Slide 10 — `set_clock_uncertainty` and Setup Timing

Exemplo mostrado:

```tcl
create_clock -period 2 [get_ports CLK]
set_clock_uncertainty -setup 0.14 [get_clocks CLK]
```

A figura mostra que a incerteza de setup reduz o tempo disponível para o caminho registrador-para-registrador.

O cálculo indicado no slide é:

```text
FF2 setup check at: 2 - 0.14 - 0.08 = 1.78 ns
```

Onde:

- `2 ns` é o período do clock;
- `0.14 ns` é a incerteza de setup;
- `0.08 ns` é o setup assumido pela biblioteca;
- `1.78 ns` é o máximo atraso permitido para o caminho `X`.

### Slide 11 — Modeling Latency or Insertion Delay

O slide separa dois conceitos:

**Network latency:** modela o atraso interno médio desde a porta/pino onde foi criado o clock até os pinos de clock dos registradores.

**Source latency:** modela o atraso desde a origem real do clock até a porta ou pino onde o `create_clock` foi aplicado. Pode ser usado tanto para clocks ideais quanto para clocks propagados.

Comandos mostrados:

```tcl
create_clock -period 10 [get_ports CLK]
set_clock_latency -source -max 3 [get_clocks CLK]
set_clock_latency -max 1 [get_clocks CLK] ;# pre layout
# set_propagated_clock [get_ports CLK] ;# post layout
```

A figura mostra:

```text
Origin of Clock -> Source Latency -> CLK port -> Network Latency -> register CLK pin
```

O slide também observa que:

```text
Source Latency + Network Latency = "clock network delay" seen in a default timing report
```

### Slide 12 — Modeling Transition Time

O slide define `transition` como a modelagem dos tempos de subida e descida da forma de onda de clock nos pinos de clock dos registradores.

Comando mostrado:

```tcl
set_clock_transition -max Tr [get_clocks CLK]
```

Esse valor é importante porque uma borda de clock não ideal pode afetar checks temporais e caracterizações de células.

### Slide 13 — Pre/Post Layout Clock

O slide compara constraints de clock antes e depois do layout.

A forma de onda destaca três efeitos:

- **latency**: deslocamento temporal médio do clock;
- **uncertainty**: janela de incerteza, associada a jitter, skew e margin;
- **transition**: inclinação da borda, isto é, rise/fall time.

A fórmula visual destacada é:

```text
jitter 0.05 + skew 0.3 + margin 0.15
```

Na fase **pre-CTS/pre-layout**, é comum modelar:

- source latency;
- network latency estimada;
- uncertainty maior;
- transition estimada.

Na fase **post-CTS/post-layout**, depois que a árvore de clock foi criada pela ferramenta física, parte dessas estimativas pode ser substituída por informação propagada/extraída, usando comando como `set_propagated_clock`.

### Slide 14 — Constraining Input Paths

O slide introduz caminhos de entrada: o dado sai de um registrador externo em `JANE's_DESIGN`, atravessa lógica externa e chega à porta de entrada de `MY_DESIGN`.

Pergunta implícita:

> What additional information must you provide to constrain input paths for setup time?

Resposta: além do clock, é necessário informar quanto tempo já foi consumido fora do bloco antes do sinal chegar à porta de entrada. Isso é feito com `set_input_delay`.

### Slide 15 — Constraining Input Paths

Pergunta do slide:

> What additional information must you provide to constrain all the input paths (`N`) in your design for setup time?

Resposta: é preciso informar o **input delay**, isto é, o atraso máximo de chegada do dado na porta de entrada, medido em relação ao clock de referência.

Esse atraso representa o tempo consumido por:

- clock-to-Q do registrador externo;
- lógica combinacional externa;
- interconexão externa até a entrada do bloco.

### Slide 16 — Constraining Input Paths: Example 1

Especificação:

```text
Latest Data Arrival Time at Port A, after Jane's launching clock edge = 0.6 ns
```

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

O slide pergunta o atraso máximo `Tmax` para o caminho de entrada `N` em `MY_DESIGN`.

### Slide 17 — Constraining Input Paths: Example 1 — resposta

O cálculo mostrado no slide é:

```text
Tmax = 2 - 0.3 - 0.2 - 0.6 = 0.9 ns
```

Forma geral:

```text
Tmax = Period - Uncertainty - Setup - Input Delay
```

Interpretação:

- o período total é `2 ns`;
- `0.6 ns` já foi gasto antes do sinal chegar ao bloco;
- `0.3 ns` é reservado para incerteza de setup;
- `0.2 ns` é o setup do registrador interno de captura;
- sobra `0.9 ns` para a lógica interna `N`.

### Slide 18 — Constraining Input Paths: Example 2

Especificação:

```text
Clock frequency = 400 MHz
Clock uncertainty for setup = 0.3 ns
Maximum delay for path N = 1.5 ns
```

Como `400 MHz` corresponde a período de `2.5 ns`, e o setup indicado é `0.1 ns`, o input delay necessário é:

```text
Input Delay = Period - Uncertainty - Internal Max Delay - Setup
Input Delay = 2.5 - 0.3 - 1.5 - 0.1
Input Delay = 0.6 ns
```

Comandos resultantes:

```tcl
create_clock -period 2.5 [get_ports Clk]
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

O slide explica que, durante a síntese, o DC calcula:

```text
Tn = Period - Uncertainty - Tsetup - Input Delay
Tn = 2.5 - 0.3 - 0.1 - 0.6
Tn = 1.5 ns
```

Isso bate com o requisito especificado para o caminho `N`.

### Slide 19 — Constraining Output Paths

O slide introduz caminhos de saída: um sinal é gerado dentro de `MY_DESIGN`, sai pela porta de saída e será capturado por um registrador externo em `JOE's_DESIGN`.

Pergunta do slide:

> What additional information must you provide to constrain all the output paths (`S`) in your design for setup time?

Resposta: é necessário informar quanto tempo o circuito externo precisa depois da saída do bloco. Isso é feito com `set_output_delay`.

### Slide 20 — Constraining Output Paths: Example 1

Especificação:

```text
Latest Data Arrival Time at Port B, before Joe's capturing clock = 0.8 ns
```

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
set_input_delay -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

Cálculo mostrado:

```text
Tmax = 2 - 0.3 - 0.8 = 0.9 ns
```

Forma geral para saída:

```text
Tmax = Period - Uncertainty - Output Delay
```

O `set_output_delay` representa o tempo reservado para a lógica/captura externa depois da porta de saída.

### Slide 21 — Constraining Output Paths: Example 2

Especificação:

```text
The maximum delay to Port B = 0.7 ns
```

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
set_output_delay -max 1.0 -clock Clk [get_ports B]
```

O slide explica o cálculo:

```text
Output Delay = Period - Uncertainty - Internal Max Delay
Output Delay = 2.0 - 0.3 - 0.7
Output Delay = 1.0 ns
```

Durante a síntese, o DC calcula:

```text
Ts = Period - Uncertainty - Output Delay
Ts = 2.0 - 0.3 - 1.0
Ts = 0.7 ns
```

Esse valor corresponde ao requisito de atraso máximo interno até a porta `B`.

### Slide 22 — Default I/O Clock Latency and Uncertainty

O slide explica que clocks usados em `set_input_delay -clock` e `set_output_delay -clock` herdam, por padrão, as mesmas latências e incertezas especificadas por `set_clock_latency` e `set_clock_uncertainty`.

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]
set_clock_latency -source -max 0.3 [get_clocks Clk]
set_clock_latency -max 0.12 [get_clocks Clk]
set_clock_uncertainty -setup 0.2 [get_clocks Clk]
set_input_delay -max 0.6 -clock Clk [all_inputs]
set_output_delay -max 0.8 -clock Clk [all_outputs]
```

A figura mostra que as latências e a incerteza afetam tanto o lado de entrada quanto o lado de saída quando o mesmo clock é usado como referência.

### Slide 23 — Multiple Inputs/Outputs - Same Constraints

Para aplicar a mesma constraint em todas as entradas, exceto no clock:

```tcl
set_input_delay -max 0.5 -clock Clk \
  [remove_from_collection [all_inputs] [get_ports Clk]]
```

Para aplicar a mesma constraint em todas as saídas:

```tcl
set_output_delay -max 1.1 -clock Clk [all_outputs]
```

O ponto importante é: `all_inputs` também inclui a porta de clock, por isso é comum removê-la da coleção antes de aplicar `set_input_delay`.

### Slide 24 — Different Port Constraints

Para restringir a maioria das portas de uma forma, mas tratar algumas de maneira diferente:

```tcl
set_input_delay -max 0.5 -clock Clk [all_inputs]
set_input_delay -max 0.8 -clock Clk [get_ports C]
remove_input_delay [get_ports Clk]
```

O segundo comando sobrescreve a constraint anterior para a porta `C`. O terceiro remove a constraint aplicada indevidamente à porta `Clk`.

### Slide 25 — Exercise: Combinational Path

O slide mostra um caminho puramente combinacional `F` que entra por uma porta de entrada e sai por uma porta de saída, sem registrador interno.

Pergunta:

> How do you constrain the combinational path `F`? What is the maximum delay through `F`?

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
set_input_delay -max 0.4 -clock Clk [get_ports B]
set_output_delay -max 0.3 -clock Clk [get_ports D]
```

Cálculo mostrado:

```text
TF,max = 2 - 0.3 - 0.4 - 0.3 = 1.0 ns
```

Esse exercício junta a lógica de input delay e output delay: como o caminho começa em uma entrada e termina em uma saída, o tempo disponível para a lógica interna é o período menos o que já foi reservado para o mundo externo nos dois lados.

## Aula didática desenvolvida

### 1. O que são constraints no contexto de síntese

Uma constraint é uma forma de dizer ao sintetizador: **“este circuito precisa obedecer a estas condições”**. O RTL descreve a função lógica; as constraints descrevem o contexto físico e temporal no qual essa função precisa funcionar.

Sem constraints, o DC NXT até pode transformar RTL em portas lógicas, mas não saberá qual caminho é crítico. Ele não saberá se o circuito precisa operar a 50 MHz, 400 MHz ou 1 GHz. Também não saberá se os dados externos chegam cedo ou tarde, nem se o bloco seguinte precisa de muito tempo para capturar os dados de saída.

Por isso, aplicar constraints não é detalhe burocrático. É parte essencial da especificação do projeto.

Nesta aula, as constraints principais são:

```tcl
create_clock
set_clock_uncertainty
set_clock_latency
set_clock_transition
set_input_delay
set_output_delay
```

Elas formam a base de timing para a síntese.

### 2. Como o DC NXT enxerga timing paths

O DC NXT não pensa no design como “um monte de portas” soltas. Ele decompõe o circuito em **timing paths**. Cada caminho começa em um startpoint e termina em um endpoint.

Um startpoint pode ser:

- uma porta de entrada, exceto clock;
- um registrador lançando dado.

Um endpoint pode ser:

- uma porta de saída;
- a entrada de dado de um registrador de captura.

Com isso, surgem quatro classes principais:

| Tipo de caminho | Começa em | Termina em | Constraint principal |
|---|---|---|---|
| Input path | porta de entrada | registrador interno | `set_input_delay` + `create_clock` |
| Reg-to-reg | registrador interno | registrador interno | `create_clock` |
| Output path | registrador interno | porta de saída | `set_output_delay` + `create_clock` |
| Input-to-output combinacional | porta de entrada | porta de saída | `set_input_delay` + `set_output_delay` + clock de referência |

Essa classificação é fundamental para não confundir as fórmulas.

### 3. Caminhos registrador-para-registrador

O caminho mais clássico em circuitos síncronos é:

```text
FF de lançamento -> lógica combinacional -> FF de captura
```

Nesse caso, o clock define o orçamento total. Se o período é 2 ns, o dado lançado por um registrador precisa atravessar a lógica combinacional e chegar ao próximo registrador com tempo suficiente antes da borda de captura.

Em uma forma simplificada:

```text
Atraso máximo da lógica = Período - Setup do registrador de captura
```

Quando adicionamos incerteza:

```text
Atraso máximo da lógica = Período - Setup - Clock Uncertainty
```

Isso aparece claramente no exemplo:

```text
2.0 - 0.14 - 0.08 = 1.78 ns
```

A incerteza funciona como uma margem de segurança. Ela reduz o tempo disponível para a lógica, forçando o sintetizador a otimizar mais agressivamente.

### 4. Por que `create_clock` é tão importante

O comando:

```tcl
create_clock -period 2 [get_ports Clk]
```

faz muito mais do que nomear um clock. Ele cria um **clock object** dentro da memória do DC NXT. A partir dele, o tool consegue:

- identificar caminhos síncronos;
- calcular relação entre bordas de lançamento e captura;
- derivar requisitos de setup;
- analisar caminhos reg-to-reg;
- aplicar delays de entrada e saída relativos a esse clock;
- gerar relatórios de timing.

Sem `create_clock`, muitos caminhos ficam sem timing real. O design pode parecer “fácil” para o sintetizador, mas na prática estará mal especificado.

### 5. Clock ideal versus clock real

No começo da síntese, o DC NXT trata o clock como ideal. Isso significa:

- borda perfeita;
- sem atraso de distribuição;
- sem diferença de chegada entre registradores;
- sem slew/transition;
- sem jitter.

Mas no chip real a rede de clock não é assim. A árvore de clock terá buffers, fios, RC parasitas, diferenças de chegada e bordas não instantâneas.

Como o DC NXT não faz clock tree synthesis, esses efeitos precisam ser modelados por estimativas:

```tcl
set_clock_uncertainty
set_clock_latency
set_clock_transition
```

Esses comandos não constroem fisicamente a árvore de clock. Eles apenas dizem ao sintetizador: “reserve margem porque o clock real não será perfeito”.

### 6. `set_clock_uncertainty`: margem para skew, jitter e risco

`set_clock_uncertainty` é uma das constraints mais importantes. Ela reduz o tempo disponível para os caminhos de setup.

Exemplo:

```tcl
set_clock_uncertainty -setup 0.14 [get_clocks CLK]
```

Esse `0.14 ns` pode representar:

- skew estimado;
- jitter do clock;
- margem de segurança;
- incerteza por ainda não existir layout final.

Se o período é 2 ns, o setup da biblioteca é 0.08 ns e a incerteza é 0.14 ns, então o caminho não tem 2 ns inteiros. Ele tem:

```text
2 - 0.14 - 0.08 = 1.78 ns
```

Logo, uma incerteza maior deixa o design mais conservador. Isso pode melhorar robustez, mas também pode aumentar área e consumo se o sintetizador precisar usar células maiores ou inserir buffers.

### 7. Latency: onde o clock nasce e onde ele chega

Latency modela atrasos no caminho do clock.

A aula separa:

**Source latency:** atraso desde a origem real do clock até a porta onde o clock entra no design.

```tcl
set_clock_latency -source -max 3 [get_clocks CLK]
```

**Network latency:** atraso desde a porta de clock do design até os pinos de clock dos registradores internos.

```tcl
set_clock_latency -max 1 [get_clocks CLK]
```

Antes do layout, esses valores são estimativas. Depois do layout/CTS, pode-se usar clock propagado, quando o atraso passa a vir da rede física extraída.

### 8. Transition time: a borda não é vertical

No desenho ideal, o clock sobe instantaneamente. No chip real, a transição leva tempo. Esse tempo de transição influencia caracterização de células e checks temporais.

Comando:

```tcl
set_clock_transition -max Tr [get_clocks CLK]
```

Esse comando modela rise/fall time do clock nos pinos dos registradores.

### 9. Input delay: o que já aconteceu antes da entrada

Quando um sinal chega a uma porta de entrada do bloco, ele não apareceu magicamente ali. Ele veio de outro bloco externo, lançado por algum registrador externo e atravessou alguma lógica externa.

O comando `set_input_delay` informa esse consumo externo de tempo.

Exemplo:

```tcl
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

Interpretação:

> O dado na porta `A` pode chegar até 0.6 ns depois da borda de referência do clock `Clk`.

Então, se o período é 2 ns, a incerteza é 0.3 ns e o setup interno é 0.2 ns, sobra:

```text
2 - 0.3 - 0.2 - 0.6 = 0.9 ns
```

para a lógica interna que vai da porta `A` até o registrador interno.

### 10. Output delay: o que precisa acontecer depois da saída

O caminho de saída é o inverso. O bloco gera um sinal, mas esse sinal ainda precisa atravessar lógica externa e ser capturado por outro registrador fora do bloco.

O comando `set_output_delay` informa quanto tempo deve ser reservado para esse mundo externo.

Exemplo:

```tcl
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

Interpretação:

> Depois que o dado sai pela porta `B`, o ambiente externo precisa de até 0.8 ns antes da captura.

Logo, se o período é 2 ns e a incerteza é 0.3 ns, sobra para a lógica interna até `B`:

```text
2 - 0.3 - 0.8 = 0.9 ns
```

### 11. Caminho puramente combinacional

Um caminho input-to-output não tem registrador interno. Ele começa em uma porta de entrada e termina em uma porta de saída. Por isso, o tempo externo precisa ser reservado nos dois lados:

```text
Tmax = Period - Uncertainty - Input Delay - Output Delay
```

No exemplo do slide:

```text
Tmax = 2 - 0.3 - 0.4 - 0.3 = 1.0 ns
```

Esse é um ponto clássico de prova: se o caminho é puramente combinacional, ele depende simultaneamente de `set_input_delay` e `set_output_delay`.

## Conceitos difíceis explicados em profundidade

### `create_clock`

`create_clock` cria um objeto de clock usado pelo mecanismo de timing.

Forma básica:

```tcl
create_clock -period 2 [get_ports Clk]
```

O comando diz:

- existe um clock associado à porta `Clk`;
- seu período é 2 ns;
- por padrão, a borda ativa inicial é em 0 ns;
- por padrão, o duty cycle é 50%;
- o nome do clock será o nome da porta, salvo se for usado `-name`.

Erro comum: achar que `create_clock` apenas documenta o clock. Na prática, ele define a base de todos os caminhos síncronos.

### `set_clock_uncertainty`

`set_clock_uncertainty` reserva margem para incertezas de clock.

```tcl
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
```

Em setup, essa margem reduz o tempo disponível. Se o clock tem 2 ns, uma uncertainty de 0.3 ns transforma o orçamento efetivo em algo menor.

Erro comum: colocar uncertainty muito pequena antes do layout e depois descobrir que o design fecha no DC, mas não fecha após CTS/route.

### `set_clock_latency`

Modela atraso de clock.

```tcl
set_clock_latency -source -max 3 [get_clocks CLK]
set_clock_latency -max 1 [get_clocks CLK]
```

- `-source`: atraso antes da entrada do clock no bloco;
- sem `-source`: atraso da rede interna de clock até os registradores.

Erro comum: confundir latency com uncertainty. Latency desloca a chegada do clock; uncertainty cria uma margem/janela de insegurança.

### `set_clock_transition`

Modela a qualidade da borda do clock:

```tcl
set_clock_transition -max Tr [get_clocks CLK]
```

Uma transição lenta pode afetar timing e seleção de células. Não é a mesma coisa que frequência. Frequência é período; transition é o tempo da borda.

### `set_input_delay`

Define atraso externo antes da porta de entrada:

```tcl
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

Ele não diz que a porta `A` tem internamente 0.6 ns. Ele diz que, visto a partir da borda do clock de referência, o dado pode chegar à porta `A` até 0.6 ns depois.

Erro comum: usar `set_input_delay` como se fosse atraso físico da porta. Ele é uma constraint de interface, não uma extração física da porta.

### `set_output_delay`

Define tempo reservado para o circuito externo depois da saída:

```tcl
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

Ele reduz o tempo disponível para a lógica interna que alimenta a porta de saída.

Erro comum: pensar que output delay é o atraso interno até a porta. Na verdade, é o atraso externo ou requisito externo associado à captura depois da porta.

### `all_inputs`, `all_outputs` e `remove_from_collection`

Para aplicar constraints em muitas portas:

```tcl
set_input_delay -max 0.5 -clock Clk \
  [remove_from_collection [all_inputs] [get_ports Clk]]
```

O comando `all_inputs` pega todas as entradas, incluindo o clock. Como normalmente não se aplica input delay ao clock, removemos `Clk` da coleção.

Para saídas:

```tcl
set_output_delay -max 1.1 -clock Clk [all_outputs]
```

Erro comum: aplicar `set_input_delay` em `[all_inputs]` e esquecer de remover a porta de clock.

## Figuras, diagramas e waveforms importantes

### Diagrama do cenário padrão

A figura com `JANE's_DESIGN`, `MY_DESIGN` e `JOE's_DESIGN` é a base mental da aula. Ela mostra que o bloco sintetizado nunca vive isolado. Sempre existe um ambiente externo lançando dados e capturando dados.

### Diagrama dos timing paths

O desenho com Path 1, Path 2, Path 3 e Path 4 deve ser memorizado. Ele separa os quatro tipos de restrição temporal:

- entrada;
- reg-to-reg;
- saída;
- combinacional input-to-output.

### Waveform de `set_clock_uncertainty`

A figura do slide 10 é importante porque mostra visualmente que a incerteza “come” uma parte do período disponível. Ela não muda o período nominal, mas reduz o tempo seguro para o dado chegar.

### Figura de latency

O desenho com `Origin of Clock`, `Source Latency`, `CLK` e `Network Latency` ajuda a separar dois atrasos que frequentemente se confundem.

### Figura do caminho combinacional

O exercício do caminho `F` é essencial porque une input delay e output delay no mesmo cálculo:

```text
Tmax = Period - Uncertainty - Input Delay - Output Delay
```

## Pontos de prova e revisão

1. **Qual comando restringe caminhos registrador-para-registrador?**

   `create_clock`. Ele define o período e permite derivar checks de setup entre registradores.

2. **O que `set_clock_uncertainty -setup` faz?**

   Reduz o tempo disponível para setup, modelando skew, jitter e margem.

3. **Qual é a diferença entre input delay e output delay?**

   `set_input_delay` representa tempo gasto antes da entrada do bloco. `set_output_delay` representa tempo reservado depois da saída do bloco.

4. **Por que remover o clock de `[all_inputs]`?**

   Porque a porta de clock é uma entrada, mas normalmente não deve receber `set_input_delay`.

5. **Fórmula para caminho reg-to-reg com uncertainty:**

   ```text
   Tmax = Period - Setup - Uncertainty
   ```

6. **Fórmula para caminho de entrada:**

   ```text
   Tmax = Period - Uncertainty - Setup - Input Delay
   ```

7. **Fórmula para caminho de saída:**

   ```text
   Tmax = Period - Uncertainty - Output Delay
   ```

8. **Fórmula para caminho puramente combinacional input-to-output:**

   ```text
   Tmax = Period - Uncertainty - Input Delay - Output Delay
   ```

9. **DC NXT sintetiza clock tree?**

   Não. Clock tree synthesis normalmente é feita pela ferramenta física/layout. O DC NXT apenas modela efeitos estimados antes do layout.

10. **Clock ideal no DC NXT significa:**

    zero skew, zero latency, zero transition e drive infinito.

## Relação com projeto/laboratório

Em scripts reais de síntese, esta aula se transforma em um arquivo de constraints, geralmente algo como:

```text
TOP.con
DESIGN.sdc
constraints.tcl
```

Esse arquivo será chamado no script principal com `source`:

```tcl
source TOP.con
```

Em um fluxo típico, a ordem fica assim:

```tcl
source dc_setup.tcl
analyze -format verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design
source TOP.con
compile_ultra
```

A parte A da aula explica exatamente o que entra dentro de `TOP.con` no começo:

```tcl
create_clock -period 2 [get_ports Clk]
set_clock_uncertainty -setup 0.3 [get_clocks Clk]
set_input_delay -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

No laboratório, se o design apresentar mensagens de caminhos não restringidos, o problema provavelmente estará em:

- ausência de `create_clock`;
- portas de entrada sem `set_input_delay`;
- portas de saída sem `set_output_delay`;
- clock tratado erroneamente como entrada de dados;
- clock name incorreto em `[get_clocks ...]`;
- constraint aplicada ao objeto errado.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
