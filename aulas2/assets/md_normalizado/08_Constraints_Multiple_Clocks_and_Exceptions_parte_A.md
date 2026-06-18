# 08 Constraints - Multiple Clocks and Exceptions — parte A

## Controle do bloco

- **Bloco:** 044
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions.docx`
- **Faixa processada:** slides 1-17
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions_parte_A.md`
- **Próximo bloco recomendado:** 045 — `08 Constraints - Multiple Clocks and Exceptions - parte B`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula aprofunda o tema de constraints no Design Compiler NXT quando o projeto não tem apenas um clock simples. Agora aparecem situações mais realistas:

- múltiplos clocks síncronos derivados da mesma fonte;
- clocks virtuais usados para modelar circuitos externos;
- múltiplas constraints no mesmo port;
- clocks gerados por lógica sequencial;
- clocks logicamente exclusivos;
- clocks fisicamente exclusivos;
- clocks assíncronos;
- caminhos multi-cycle;
- exceções inválidas que precisam ser verificadas explicitamente.

O ponto central é que o DC NXT não pode adivinhar a intenção temporal do projeto. Se dois clocks existem, a ferramenta precisa saber se eles interagem, se são mutuamente exclusivos, se são derivados de uma mesma fonte, se passam por mux, se são fisicamente impossíveis de ocorrer ao mesmo tempo, ou se são realmente assíncronos.

A aula também reforça um detalhe importante: **exceções de timing são perigosas**. Elas removem ou relaxam checks de timing. Quando bem usadas, representam o comportamento real do hardware. Quando mal usadas, escondem violações reais.

---

## Texto extraído e organizado por slide

### Slide 1 — DC NXT Physical Synthesis Flow

O slide mostra novamente o fluxo de síntese física do DC NXT e destaca a etapa:

```text
Apply Constraints
```

O fluxo exibido é:

```text
Specify Libraries
Load RTL Code
Load Floorplan
Apply Constraints
Synthesize the Design
Analyze Results
Write out Netlist with Cell Placement
```

Esta aula está dentro da fase de aplicação de constraints, mas agora com foco em casos mais complexos que envolvem múltiplos clocks e exceções de timing.

---

### Slide 2 — Multiple Synchronous Clock Designs

O slide mostra um design com vários clocks derivados de uma mesma fonte:

```text
CLKA = 3.0 GHz
CLKB = CLKA / 9  ≈ 333 MHz
CLKC = CLKA / 6  = 500 MHz
CLKD = CLKA / 4  = 750 MHz
CLKE = CLKA / 3  = 1.0 GHz
```

A pergunta do slide é:

```text
What is different in this design?
```

Pontos listados:

- Multiple clocks.
- All derived from the same clock source.
- Some clocks do not have a corresponding clock port on our design.
- Multiple constraints on a single port.

Tradução direta:

- Há múltiplos clocks.
- Todos são derivados da mesma fonte de clock.
- Alguns clocks não têm um clock port correspondente dentro do design atual.
- Pode haver múltiplas constraints no mesmo port.

Interpretação: neste tipo de design, não basta criar apenas o clock do bloco interno. É necessário modelar clocks externos ou derivados, mesmo quando eles não entram diretamente como portas do design.

---

### Slide 3 — Multiple Clock Input Delay

O exemplo mostra um input path cujo dado vem de um circuito externo clockado por `CLKB`, enquanto o design interno usa `CLKC`.

Comandos do slide:

```tcl
create_clock -period 2.0 [get_ports CLKC]
create_clock -period 3.0 -name CLKB

set_input_delay -max 0.55 -clock CLKB [get_ports IN1]
```

Interpretação:

- `CLKC` é um clock real do design, aplicado em uma porta.
- `CLKB` é criado como clock nomeado sem porta, funcionando como clock de referência externo.
- O input delay de `IN1` é medido em relação a `CLKB`.

O valor:

```text
0.55 ns
```

representa o atraso máximo externo antes do sinal chegar em `IN1`.

Esse atraso inclui, no exemplo:

```text
CLK-Q externo + lógica externa
0.05 ns + 0.50 ns = 0.55 ns
```

---

### Slide 4 — Maximum Internal Input Delay Calculation

O slide mostra o cálculo do tempo que sobra para a lógica interna de entrada `N`.

A relação temporal entre `CLKB` e `CLKC` cria uma janela efetiva de:

```text
1.0 ns
```

Como o circuito externo já consumiu:

```text
0.55 ns
```

a lógica interna precisa cumprir:

```text
tN < 1.0 - 0.55 - tsetup
```

Ou seja:

```text
tempo disponível para lógica interna = janela entre clocks - input delay externo - setup do registrador interno
```

A ideia é a mesma das aulas anteriores, mas agora com clocks diferentes no lançamento externo e captura interna.

---

### Slide 5 — Multiple Clock Output Delay: Example

O exemplo mostra um output path em que a mesma saída `OUT1` pode ser capturada por circuitos externos associados a clocks diferentes.

Comandos do slide:

```tcl
create_clock -period 2.0 [get_ports CLKC]
create_clock -period 1.0 -name CLKE
create_clock -period [expr {1000/750.0}] -name CLKD

set_output_delay -max 0.15 -clock CLKD [get_ports OUT1]
set_output_delay -max 0.52 -clock CLKE -add_delay [get_ports OUT1]
```

Pontos importantes:

- `CLKC` é o clock interno do design.
- `CLKD` e `CLKE` são clocks externos de captura.
- A saída `OUT1` recebe duas constraints de output delay.
- A opção `-add_delay` é necessária para adicionar uma segunda constraint no mesmo port, sem sobrescrever a primeira.

Sem `-add_delay`, o segundo `set_output_delay` poderia substituir o delay anterior.

---

### Slide 6 — Maximum Internal Output Delay Calculation

O slide calcula quanto tempo sobra para a lógica interna de saída `S`.

A saída precisa cumprir a restrição mais apertada entre as possibilidades de captura externa.

O slide mostra duas condições:

```text
tS < 1.0 - 0.52
```

Resultado:

```text
tS < 0.48 ns
```

E:

```text
tS < 0.67 - 0.15
```

Resultado:

```text
tS < 0.52 ns
```

Como o caminho precisa satisfazer as duas, vale a menor janela:

```text
tS < 0.48 ns
```

Conclusão: mesmo que uma das relações pareça menos restritiva, a ferramenta deve considerar a pior relação temporal aplicável ao caminho.

---

### Slide 7 — Inter Clock Uncertainty

O slide mostra dois clocks diferentes:

```tcl
create_clock -period 3 [get_ports Clk1]
create_clock -period 2 [get_ports Clk2]
set_clock_uncertainty -setup 0.11 [get_clocks Clk1]
set_clock_uncertainty -setup 0.12 [get_clocks Clk2]
```

Problema destacado:

```text
Only the capture clock uncertainty is applied (0.12)
```

Ou seja: em um caminho de `Clk1` para `Clk2`, a uncertainty aplicada por padrão pode considerar apenas a incerteza do clock de captura.

Solução mostrada:

```tcl
set_clock_uncertainty -setup 0.20 \
  -from [get_clocks Clk1] -to [get_clocks Clk2]
```

A ideia é modelar explicitamente a uncertainty entre clocks quando o efeito combinado de skew, jitter e margem reduz a janela efetiva do caminho de `Clk1` para `Clk2`.

---

### Slide 8 — Clock Propagation Through Sequential Logic

Mensagem central do slide:

```text
Clock definitions (create_clock) do not propagate through sequential logic
```

Tradução:

```text
Definições de clock feitas com create_clock não se propagam através de lógica sequencial.
```

O exemplo mostra um clock entrando em um registrador `FF1`, e a saída desse registrador sendo usada como clock de outro registrador `FF2`.

A pergunta do slide é:

```text
How do we constrain clocks that are derived from sequential logic?
```

Resposta que virá no próximo slide:

```text
usar generated clocks
```

Isto é, quando um clock é derivado por lógica sequencial, não basta esperar que o clock original atravesse automaticamente o registrador. É necessário criar um clock gerado.

---

### Slide 9 — Generated Clocks — Instantiated Register

Resposta do slide:

```text
Use generated clocks!
create_generated_clock
```

Exemplo conceitual:

```tcl
create_clock -period 5 \
  [get_ports CLK]

create_generated_clock -divide_by 2 -name CLK_SLW \
  -source [get_ports CLK] [get_pins FF1/Qout]

set_clock_latency -source ... [get_clocks CLK_SLW]
set_clock_latency         ... [get_clocks CLK_SLW]
set_clock_uncertainty     ... [get_clocks CLK_SLW]
set_clock_transition      ... [get_clocks CLK_SLW]
```

Interpretação:

- O clock original entra em `CLK`.
- O registrador `FF1` gera uma saída que funciona como clock mais lento.
- `create_generated_clock` define esse clock derivado.
- `-divide_by 2` informa que ele tem metade da frequência do clock fonte.
- `-source [get_ports CLK]` indica a origem do clock mestre.
- `[get_pins FF1/Qout]` indica o ponto onde o clock gerado aparece.

Notas do slide:

- Source latency inclui clock source latency, network latency e atraso estimado de `FF1/CK` até `FF1/Qout`.
- Network latency representa o caminho estimado de `FF1/Qout` até `FF2/CK`.

---

### Slide 10 — Generated Clocks — RTL Register

Se o registrador não foi instanciado manualmente, mas codificado em RTL, a resposta do slide é:

```text
Use the gtech cell/pin name!
```

Exemplo:

```tcl
create_clock -period 5 \
  [get_ports CLK]

create_generated_clock -divide_by 2 -name CLK_SLW \
  -source [get_ports CLK] [get_pins DIV_CLK_reg/Q]

set_clock_latency     ...
set_clock_uncertainty ...
set_clock_transition  ...
```

O slide destaca que o nome do registrador codificado em RTL e o nome do pino GTECH são conhecidos antes do compile e podem ser usados nas constraints.

Exemplo destacado:

```text
DIV_CLK_reg/Q
```

Esse é o nome do sinal/pino de saída do registrador que gera o clock derivado.

---

### Slide 11 — Use Pin Synonyms to Apply Constraints to RTL/GTECH

O slide explica que constraints que usam nomes de pinos GTECH são modificadas durante a síntese para usar nomes reais dos pinos da biblioteca mapeada.

Ponto importante:

```text
Updated constraints must be captured for physical design
```

Em vez de manter dois conjuntos de constraints, uma para RTL/GTECH e outra para netlist mapeada, pode-se criar um conjunto baseado em nomes de pinos da biblioteca mapeada e usar sinônimos de nomes de pino.

Exemplo mostrado:

```tcl
# set_pin_name_synonym <target_lib_pin/synonym> <vvgtech_pin/orig>
set_pin_name_synonym CK  clocked_on
set_pin_name_synonym D   next_state
set_pin_name_synonym Out Q

set_multicycle_path -from SIG_A_reg/CK -to SIG_X_reg/D

# Example from previous page:
create_generated_clock -divide_by 2 -name CLK_SLW \
  -source [get_ports CLK] [get_pins DIV_CLK_reg/Out]
```

Interpretação:

- `CK` pode ser sinônimo de `clocked_on`.
- `D` pode ser sinônimo de `next_state`.
- `Out` pode ser sinônimo de `Q`.

Assim, constraints podem ser escritas usando uma nomenclatura mais próxima da biblioteca final, mas ainda funcionar no estágio RTL/GTECH.

---

### Slide 12 — Logically Exclusive Clocks: Problem #1

O slide apresenta dois clocks síncronos e logicamente mutuamente exclusivos:

```text
CLK1 = 500 MHz
CLK2 = 750 MHz
```

Eles não ativam simultaneamente o mesmo caminho lógico de saída.

Comandos mostrados:

```tcl
create_clock -period 2.0 [get_ports CLK1]
create_clock -period [expr {1000/750.0}] [get_ports CLK2]

set_output_delay -max .15 -clock CLK1 [get_ports OUT1]
set_output_delay -max .52 -clock CLK2 -add_delay [get_ports OUT1]
```

Pergunta do slide:

```text
Is this enough?
```

Resposta: não. Apenas criar clocks e delays não informa ao DC NXT que os clocks são logicamente exclusivos. Sem essa informação, a ferramenta pode analisar combinações impossíveis de clock.

---

### Slide 13 — Logically Exclusive Clocks: Solution #1

O slide mostra duas formas de declarar a exclusividade lógica entre `CLK1` e `CLK2`.

Primeira forma: false paths nos dois sentidos.

```tcl
set_false_path -from [get_clocks CLK1] -to [get_clocks CLK2]
set_false_path -from [get_clocks CLK2] -to [get_clocks CLK1]
```

Segunda forma: grupos de clocks logicamente exclusivos.

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

Interpretação:

- `CLK1` e `CLK2` são síncronos.
- Mas, pela lógica do circuito, não precisam ser analisados como caminhos temporais entre si.
- `set_clock_groups -logically_exclusive` é uma forma mais expressiva e compacta de dizer isso.

---

### Slide 14 — Logically Exclusive Clocks: Problem #2

Agora o slide apresenta um caso em que `CLK1` e `CLK2` são síncronos e apenas “parcialmente” mutuamente exclusivos.

A primeira tentativa mostrada é:

```tcl
set_false_path -from [get_clocks CLK1] -to [get_clocks CLK2]
set_false_path -from [get_clocks CLK2] -to [get_clocks CLK1]
```

Pergunta do slide:

```text
What's wrong with this?
```

Problema: cortar todos os caminhos entre `CLK1` e `CLK2` é amplo demais. Se apenas caminhos que passam por `OUT1` são exclusivos, a exceção deve ser aplicada especificamente aos caminhos através de `OUT1`, não a todos os caminhos entre os domínios.

---

### Slide 15 — Logically Exclusive Clocks: Solution #2

Solução: aplicar false paths com `-through`, limitando a exceção ao ponto onde a exclusividade realmente ocorre.

Comandos mostrados:

```tcl
set_false_path -from [get_clocks CLK1] \
  -through [get_ports OUT1] -to [get_clocks CLK2]

set_false_path -from [get_clocks CLK2] \
  -through [get_ports OUT1] -to [get_clocks CLK1]
```

Interpretação:

- Não se corta todo o relacionamento entre `CLK1` e `CLK2`.
- Apenas os caminhos que passam por `OUT1` são tratados como falsos.
- Isso evita esconder paths reais entre esses clocks.

---

### Slide 16 — Multiple Clocks per Register: Problem #3

O slide mostra um mux de clock selecionando entre `CLK1` e `CLK2` para alimentar registradores.

Pontos principais:

- Múltiplos clocks podem alcançar pinos de clock de registradores.
- Todos são analisados para pior caso de timing.
- Isso é controlado pela variável:

```text
timing_enable_multiple_clocks_per_reg
```

O slide informa que essa variável é `true` por padrão.

Ponto crítico:

```text
Muxed clocks are not inferred as exclusive clocks!
```

Ou seja: o DC NXT não assume automaticamente que clocks multiplexados são exclusivos.

Sem uma constraint adicional, a otimização considera quatro casos:

```text
CLK1 -> CLK1
CLK1 -> CLK2
CLK2 -> CLK1
CLK2 -> CLK2
```

Pergunta do slide:

```text
How do you direct DC NXT to consider only CLK1→CLK1 and CLK2→CLK2, and to optimize for the worst of the two?
```

Resposta: declarar `CLK1` e `CLK2` como clocks logicamente exclusivos.

---

### Slide 17 — Multiple Clocks per Register: Solution #3

Solução:

```tcl
create_clock -period ... [get_ports CLK1]
create_clock -period ... [get_ports CLK2]

set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

O slide informa:

```text
The delay between the registers will be optimized for the worst of CLK1→CLK1 or CLK2→CLK2 timing
```

Tradução:

```text
O atraso entre os registradores será otimizado para o pior caso entre CLK1→CLK1 e CLK2→CLK2.
```

Observações:

- Como alternativa, seria possível aplicar dois false paths.
- Se `set_case_analysis` for aplicado a `SEL1`, a análise de timing usará automaticamente apenas o clock selecionado.

---

### Slide 18 — Multiple Clocks per Register: Example #4

O exemplo mostra dois muxes de clock independentes:

- um selecionando entre `CLK1` e `CLK2`;
- outro selecionando entre `CLK3` e `CLK4`.

Comandos:

```tcl
create_clock -period ... [get_ports CLK1]
create_clock -period ... [get_ports CLK2]
create_clock -period ... [get_ports CLK3]
create_clock -period ... [get_ports CLK4]

set_clock_groups -logically_exclusive -group CLK1 -group CLK2
set_clock_groups -logically_exclusive -group CLK3 -group CLK4
```

Mensagem do slide:

```text
The delay of each path will be optimized for the worst of the logically possible timing conditions
```

Interpretação:

- A ferramenta não considera combinações impossíveis.
- Cada caminho é otimizado para o pior caso lógico possível.
- Alternativamente, seria possível aplicar vários false paths, mas `set_clock_groups` é mais limpo.

---

### Slide 19 — Multiple Clocks per Register: Example #5

Neste exemplo, os clocks são agrupados de outra forma:

```tcl
create_clock -period ... [get_ports CLK1]
create_clock -period ... [get_ports CLK2]
create_clock -period ... [get_ports CLK3]
create_clock -period ... [get_ports CLK4]

set_clock_groups -logically_exclusive \
  -group "CLK1 CLK3" -group "CLK2 CLK4"
```

Interpretação:

- `CLK1` e `CLK3` pertencem a um grupo lógico.
- `CLK2` e `CLK4` pertencem a outro grupo lógico.
- Os grupos são logicamente exclusivos entre si.

Mensagem do slide:

```text
The delay of each path will be optimized for the worst of the logically possible timing conditions
```

Esse formato é útil quando a seleção lógica faz com que certos conjuntos de clocks existam como alternativas mutuamente exclusivas.

---

### Slide 20 — Crosstalk Analysis in ICC II and PT-SI: Problem #6

O slide mostra um clock que entra no design por um port chamado `Clk`, mas esse clock pode ser `CLK1` ou `CLK2`, selecionado fora do design.

Comandos:

```tcl
create_clock -period 3 -name CLK1 [get_ports Clk]
create_clock -period 4 -name CLK2 -add [get_ports Clk]

set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

O slide afirma:

```text
DC NXT delay optimization does the right thing
```

Mas há um problema em análise de crosstalk com ICC II e PT-SI:

```text
Crosstalk analysis assumes both clocks are available simultaneously
```

Isso gera:

```text
Pessimistic crosstalk-induced delta delays
```

Pergunta do slide:

```text
Can we write constraints that will result in correct/accurate behavior in both DC NXT and PT-SI?
```

Resposta do próximo slide: sim, usando clocks fisicamente exclusivos.

---

### Slide 21 — Crosstalk Analysis in ICC II and PT-SI: Solution #6

Solução:

```tcl
create_clock -period 3 -name CLK1 [get_ports Clk]
create_clock -period 4 -name CLK2 -add [get_ports Clk]

set_clock_groups -physically_exclusive -group CLK1 -group CLK2
```

O slide explica:

```text
Delay optimization in DC NXT treats physically exclusive clocks exactly the same as logically exclusive clocks (or false paths)
```

E:

```text
SI analysis treats clocks as exclusive as well
```

Resultado:

```text
Accurate crosstalk-induced delay analysis
```

Pergunta lateral do slide:

```text
Why not ALWAYS use -physically_exclusive instead of -logically_exclusive?
```

Resposta conceitual: porque clocks logicamente exclusivos ainda podem existir fisicamente ao mesmo tempo em diferentes redes. Nesse caso, eles ainda podem causar crosstalk. `-physically_exclusive` só deve ser usado quando os clocks realmente não podem coexistir fisicamente no mesmo cenário de análise.

---

### Slide 22 — Challenge Exercise

O desafio mostra um mux de clock instanciado explicitamente, com `CLK1`, `CLK2` e seletor `SEL1`.

Comandos iniciais:

```tcl
create_clock -period 5 -name FST_CLK [get_ports CLK1]
create_clock -period 8 -name SLW_CLK [get_ports CLK2]
```

O slide diz:

```text
We would like to constrain this design for correct and accurate timing analysis in both DC NXT and PT-SI
```

Perguntas:

```text
Why can we not define CLK1 and CLK2 as exclusive clock groups?
```

```text
What trick can we use to define only the rr1 and rr2 clocks as physically exclusive?
```

Interpretação:

- `CLK1` e `CLK2` podem existir fisicamente no design e talvez alimentar outras partes.
- Só o clock depois do mux, usado por `rr1` e `rr2`, é fisicamente exclusivo.
- Portanto, a exclusividade física deve ser aplicada nos clocks gerados no output do mux, não nos clocks originais de entrada.

---

### Slide 23 — Challenge Exercise: Solution

Solução mostrada:

```tcl
create_clock -period 5 -name FST_CLK [get_ports CLK1]
create_clock -period 8 -name SLW_CLK [get_ports CLK2]

create_generated_clock -divide_by 1 -name MCLK1 \
  -source CLK1 [get_pins I_CLK_MUX/Z]

create_generated_clock -divide_by 1 -name MCLK2 -add \
  -source CLK2 [get_pins I_CLK_MUX/Z]

set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2

set_clock_latency ...
set_clock_uncertainty ...
set_clock_transition ...
```

Interpretação:

- `FST_CLK` e `SLW_CLK` são clocks primários.
- `MCLK1` e `MCLK2` são clocks gerados no output do mux.
- Como eles aparecem no mesmo pino de saída do mux, são fisicamente exclusivos.
- A exclusividade física é aplicada apenas aos clocks muxados, não aos clocks originais inteiros.

---

### Slide 24 — Asynchronous Clock Designs

O slide mostra dois clocks independentes:

```text
CLKA = 333.33 MHz, from osc1
CLKB = 500 MHz, from osc2
```

A pergunta:

```text
What do you do if the design has asynchronous clock sources?
```

Interpretação:

- Clocks assíncronos não têm relação de fase garantida.
- Não se deve tentar fechar timing comum entre eles como se fossem síncronos.
- É necessário projetar a travessia de domínio de clock corretamente e cortar a análise de timing entre domínios assíncronos.

---

### Slide 25 — Synthesizing with Asynchronous Clocks

O slide dá as recomendações.

Primeiro, é responsabilidade do projetista criar lógica que previna metastabilidade:

- instanciar sincronizadores de dois clocks;
- usar flip-flops metastability-hard;
- usar dual-port FIFO;
- entre outros.

Depois:

- criar clocks para restringir caminhos dentro de cada domínio de clock;
- desabilitar otimização de timing nos caminhos entre domínios assíncronos.

Motivos para desabilitar timing optimization entre domínios assíncronos:

- evita desperdiçar runtime em caminhos não críticos;
- evita ignorar a otimização de caminhos realmente críticos.

---

### Slide 26 — Example: Asynchronous Design Constraints

Exemplo:

```tcl
current_design TOP

# Constrain register-register paths within each clock domain
create_clock -period 3 [get_ports CLKA]
create_clock -period 2 [get_ports CLKB]
...
# Disable timing optimization across asynchronous clock domains
set_clock_groups -asynchronous -group CLKA -group CLKB
...
compile_ultra ...
```

Interpretação:

- Cada domínio recebe seu próprio clock.
- Caminhos internos de cada domínio continuam sendo analisados e otimizados.
- Caminhos entre `CLKA` e `CLKB` são tratados como assíncronos e removidos da otimização de timing comum.

---

### Slide 27 — Example Multi-Cycle Design

O slide mostra um design em que:

```text
Clock period is 2 ns.
The adder takes almost 6 clock cycles.
```

Pergunta:

```text
What happens when you apply create_clock -period 2 Clk?
```

Resposta conceitual:

- Por padrão, a ferramenta assume timing single-cycle.
- Portanto, ela tentaria fazer o adder cumprir 2 ns.
- Mas o circuito foi projetado para permitir quase 6 ciclos.
- É necessário usar uma exceção `set_multicycle_path`.

---

### Slide 28 — Default Single-Cycle Timing

Por padrão, todos os caminhos são restringidos por single-cycle timing.

Valores implícitos:

```tcl
set_multicycle_path -setup 1 <all paths>
set_multicycle_path -hold 0  <all paths>
```

O slide explica:

- setup capture edge ocorre 1 ciclo após o launch edge;
- hold capture edge é relativo ao setup capture edge;
- por padrão, o hold ocorre uma borda antes do setup capture edge.

Ponto crítico do slide:

```text
Increasing the setup multiplier without changing the hold multiplier moves both the setup and hold capture edges!
```

Pergunta:

```text
How do we constrain for 6 cycle timing?
```

---

### Slide 29 — Multi-Cycle Timing Constraint

Constraint de setup para permitir 6 ciclos:

```tcl
create_clock -period 2 [get_ports CLK]

set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

Isso move o setup capture edge para 6 ciclos depois do lançamento.

Como o período é 2 ns:

```text
6 ciclos × 2 ns = 12 ns
```

Pergunta do slide:

```text
Where does the hold check occur?
```

A resposta vem no próximo slide: se você só alterar setup, o hold fica em uma posição indesejada.

---

### Slide 30 — Default Hold Check

Se você aplica apenas:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

o hold multiplier continua 0.

Consequência mostrada:

```text
Hold capture edge is 10 ns!
```

Isso cria uma restrição min-max impraticável para o adder.

O slide afirma:

```text
Impossible to achieve and not required (no metastability concerns)!
```

E também:

```text
Hold check can safely occur at 0ns
```

Pergunta:

```text
How do we move the hold check back 5 edges?
```

Resposta: aplicar `set_multicycle_path -hold 5`.

---

### Slide 31 — Setting the Proper Hold Constraint

Solução correta:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]

set_multicycle_path -hold 5 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

Resultado desejado:

```text
Allow 0 - 12 ns for ADDER
```

Interpretação:

- `-setup 6` relaxa o setup para 6 ciclos.
- `-hold 5` move o hold check de volta 5 bordas.
- A combinação evita criar uma restrição de hold falsa e impossível.

Regra prática:

```text
Para um multicycle setup N, normalmente o hold associado é N-1.
```

Para N = 6:

```text
hold = 5
```

---

### Slide 32 — Another Example

O slide mostra um caminho com multiplicador que deve ser tratado como two-cycle path, enquanto outro caminho via soma continua one-cycle.

Comandos:

```tcl
set_multicycle_path -setup 2 -through U_Mult/Out
set_multicycle_path -hold 1  -through U_Mult/Out
```

Interpretação:

- Apenas caminhos que passam por `U_Mult/Out` são multi-cycle.
- O caminho pelo bloco `Add` continua single-cycle.
- Novamente, para setup 2, o hold correspondente é 1.

Isso mostra a utilidade da opção:

```tcl
-through
```

para aplicar exceções apenas a caminhos específicos.

---

### Slide 33 — Always Check for Invalid Exceptions

Mensagem principal:

```text
No warnings are issued if an invalid exception is applied to a design, so it is recommended to explicitly check for invalid exceptions:
```

Comando recomendado:

```tcl
report_timing_requirements -ignored
```

O relatório pode mostrar problemas como:

```text
NONEXISTENT PATH
INVALID FROM OBJECT
```

Exemplo mostrado:

```text
INVALID FROM OBJECT
-from FF1_reg/Q
```

Para remover e corrigir exceções inválidas:

```tcl
reset_path -from FF1_reg/Q
# OR
set_multicycle_path -reset_path -from FF1_reg/Q
```

Depois, corrigir usando o pino correto:

```tcl
set_multicycle_path -from FF1_reg/clocked_on
```

Interpretação:

- A exceção foi aplicada a um objeto errado.
- O comando pode não gerar warning imediatamente.
- É preciso verificar exceções ignoradas explicitamente.
- O uso de pin synonyms ajuda a evitar esse tipo de erro entre RTL/GTECH e netlist mapeada.

---

## Aula didática desenvolvida

### 1. O problema que esta aula resolve

Até aqui, muitos exemplos assumiam um clock simples. Mas projetos reais quase nunca são tão simples.

Um SoC ou bloco ASIC pode ter:

```text
um clock principal
clocks divididos
clocks muxados
clocks gerados por registradores
clocks virtuais externos
clocks assíncronos
caminhos que levam mais de um ciclo
caminhos que nunca acontecem funcionalmente
```

Se esses casos não forem descritos nas constraints, o DC NXT pode:

- otimizar caminhos impossíveis;
- ignorar caminhos reais;
- gastar runtime onde não precisa;
- gerar relatórios pessimistas;
- esconder violações reais;
- produzir uma netlist ruim.

A função desta aula é ensinar como dizer à ferramenta quais relações de timing são reais e quais não são.

---

### 2. Clocks síncronos múltiplos

Quando vários clocks vêm da mesma fonte, eles têm uma relação de fase/frequência. Exemplo:

```text
CLKA 3.0 GHz
CLKB = CLKA / 9
CLKC = CLKA / 6
CLKD = CLKA / 4
CLKE = CLKA / 3
```

Eles são diferentes, mas não são completamente independentes. O DC NXT pode analisar relações entre eles se você modelar corretamente.

O ponto mais sutil é que alguns clocks existem apenas fora do bloco. Mesmo assim, eles precisam ser criados como clocks de referência:

```tcl
create_clock -period 3.0 -name CLKB
```

Sem associar a uma porta, esse clock funciona como um clock virtual para modelar a origem externa do dado.

---

### 3. Input delay com clock externo diferente do clock interno

Quando um dado vem de um bloco externo clockado por `CLKB`, mas é capturado internamente por `CLKC`, o `set_input_delay` deve usar o clock de lançamento externo:

```tcl
set_input_delay -max 0.55 -clock CLKB [get_ports IN1]
```

Isso diz:

```text
O sinal IN1 chega até 0.55 ns depois da borda de CLKB.
```

A ferramenta então compara essa chegada com a borda de captura de `CLKC`.

A fórmula geral do slide é:

```text
tempo interno disponível = janela entre clocks - delay externo - setup
```

---

### 4. Output delay com múltiplos clocks externos

Quando uma mesma saída pode ser capturada por clocks diferentes, cada relação precisa ser declarada.

Exemplo:

```tcl
set_output_delay -max 0.15 -clock CLKD [get_ports OUT1]
set_output_delay -max 0.52 -clock CLKE -add_delay [get_ports OUT1]
```

A opção importante é:

```tcl
-add_delay
```

Sem ela, a segunda constraint poderia substituir a primeira.

A ferramenta deve satisfazer todas as relações possíveis. Portanto, o caminho interno precisa cumprir a mais restritiva.

---

### 5. Inter-clock uncertainty

Quando o caminho vai de um clock para outro, a uncertainty global de cada clock pode não representar corretamente o pior caso entre eles.

O slide mostra que apenas a uncertainty do clock de captura pode ser aplicada:

```text
0.12 ns
```

Mas o comportamento real entre `Clk1` e `Clk2` pode exigir:

```text
0.20 ns
```

Então se usa:

```tcl
set_clock_uncertainty -setup 0.20 \
  -from [get_clocks Clk1] -to [get_clocks Clk2]
```

Isso é mais específico e modela diretamente a margem entre dois domínios síncronos relacionados.

---

### 6. Generated clocks

Um clock gerado é um clock derivado de outro, por exemplo:

- clock dividido por registrador;
- clock gerado por PLL;
- clock saindo de um mux;
- clock habilitado ou transformado por lógica.

Quando o clock passa por lógica sequencial, `create_clock` não se propaga automaticamente. É preciso criar o clock derivado.

Exemplo:

```tcl
create_generated_clock -divide_by 2 -name CLK_SLW \
  -source [get_ports CLK] [get_pins FF1/Qout]
```

Esse comando diz:

```text
No pino FF1/Qout existe um clock chamado CLK_SLW,
derivado de CLK,
com frequência dividida por 2.
```

---

### 7. Generated clock em RTL

Mesmo que o registrador seja descrito em RTL, a ferramenta conhece seu nome GTECH antes da síntese mapeada.

Exemplo:

```tcl
[get_pins DIV_CLK_reg/Q]
```

Isso permite criar constraints antes do compile.

Mas, depois do mapeamento, os nomes de pino podem mudar. Por isso o curso apresenta `set_pin_name_synonym`.

---

### 8. Pin synonyms

Pin synonyms permitem escrever constraints que funcionam tanto em RTL/GTECH quanto em netlist mapeada.

Exemplo:

```tcl
set_pin_name_synonym CK  clocked_on
set_pin_name_synonym D   next_state
set_pin_name_synonym Out Q
```

Assim, se uma constraint usa `CK`, a ferramenta consegue relacionar esse nome ao pino GTECH correspondente, como `clocked_on`.

Isso reduz a necessidade de manter dois arquivos diferentes de constraints.

---

### 9. Clocks logicamente exclusivos

Clocks logicamente exclusivos são clocks que podem existir fisicamente, mas, pela lógica do circuito, não ativam o mesmo caminho ao mesmo tempo.

Exemplo típico:

```text
dois clocks entram em um mux
apenas um é selecionado
```

Nesse caso, combinações como:

```text
CLK1 -> CLK2
CLK2 -> CLK1
```

podem ser impossíveis para determinado caminho.

Para informar isso:

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

Ou, equivalentemente:

```tcl
set_false_path -from [get_clocks CLK1] -to [get_clocks CLK2]
set_false_path -from [get_clocks CLK2] -to [get_clocks CLK1]
```

---

### 10. Cuidado com exceções amplas demais

O slide de “Problem #2” mostra um erro comum: cortar todos os caminhos entre clocks quando apenas alguns caminhos são falsos.

Errado demais:

```tcl
set_false_path -from [get_clocks CLK1] -to [get_clocks CLK2]
```

se apenas a relação passando por `OUT1` é falsa.

Melhor:

```tcl
set_false_path -from [get_clocks CLK1] \
  -through [get_ports OUT1] -to [get_clocks CLK2]
```

Exceções de timing devem ser tão específicas quanto possível. Quanto mais ampla a exceção, maior o risco de esconder um caminho real.

---

### 11. Múltiplos clocks por registrador

Quando um mux seleciona clocks para um registrador, o DC NXT pode ver múltiplos clocks chegando ao mesmo clock pin.

Por padrão, ele não infere automaticamente exclusividade entre clocks muxados.

Então, sem constraint, ele analisa:

```text
CLK1 -> CLK1
CLK1 -> CLK2
CLK2 -> CLK1
CLK2 -> CLK2
```

Mas se a lógica só permite:

```text
CLK1 -> CLK1
CLK2 -> CLK2
```

você precisa declarar:

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

Isso evita otimizar para relações impossíveis.

---

### 12. Logically exclusive versus physically exclusive

Essa distinção é muito importante.

#### Logically exclusive

Use quando os clocks não ativam o mesmo caminho logicamente, mas ainda podem existir fisicamente ao mesmo tempo no chip.

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

Isso ajuda timing lógico, mas para análise de SI/crosstalk eles ainda podem ser considerados simultâneos.

#### Physically exclusive

Use quando os clocks realmente não podem coexistir fisicamente no mesmo ponto/rede.

```tcl
set_clock_groups -physically_exclusive -group CLK1 -group CLK2
```

Isso também informa ferramentas de SI que os clocks são exclusivos para crosstalk.

Regra prática:

```text
Se podem existir ao mesmo tempo em redes diferentes, não use physically_exclusive.
Se são alternativas físicas no mesmo ponto, use physically_exclusive.
```

---

### 13. Por que criar generated clocks no output do mux

No challenge exercise, não se deve declarar `CLK1` e `CLK2` inteiros como fisicamente exclusivos, porque eles podem alimentar outras partes do design ao mesmo tempo.

A solução é criar clocks gerados no output do mux:

```tcl
create_generated_clock -divide_by 1 -name MCLK1 \
  -source CLK1 [get_pins I_CLK_MUX/Z]

create_generated_clock -divide_by 1 -name MCLK2 -add \
  -source CLK2 [get_pins I_CLK_MUX/Z]
```

Depois, só esses clocks muxados são fisicamente exclusivos:

```tcl
set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

Isso dá precisão para DC NXT e para PT-SI.

---

### 14. Clocks assíncronos

Clocks assíncronos vêm de fontes sem relação de fase garantida.

Exemplo:

```text
CLKA vem de osc1
CLKB vem de osc2
```

Não se fecha timing comum entre eles como se fossem síncronos.

Mas isso não resolve metastabilidade. O projetista precisa inserir uma estrutura correta de CDC, como:

- sincronizador de dois flip-flops;
- FIFO dual-clock;
- handshake;
- flip-flops adequados para metastabilidade;
- lógica segura de transferência entre domínios.

A constraint correta corta timing entre domínios:

```tcl
set_clock_groups -asynchronous -group CLKA -group CLKB
```

Mas a arquitetura de CDC precisa estar correta no RTL.

---

### 15. Multi-cycle paths

Por padrão, todo caminho é single-cycle:

```text
setup = 1 ciclo
hold = 0 ciclos
```

Mas alguns circuitos são projetados para levar mais de um ciclo.

Exemplo do slide:

```text
clock = 2 ns
adder leva quase 6 ciclos
```

Se você só criar:

```tcl
create_clock -period 2 [get_ports CLK]
```

a ferramenta tentará fazer o adder fechar em 2 ns, o que é impossível ou desnecessário.

Então se declara:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

Isso dá 6 ciclos de setup.

---

### 16. A pegadinha do hold em multi-cycle

Quando você altera o setup para 6 ciclos, o hold default fica em posição errada se não for corrigido.

Para setup N, normalmente se usa:

```text
hold = N - 1
```

Então, para 6 ciclos:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]

set_multicycle_path -hold 5 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

Sem isso, o hold check pode ficar em 10 ns, criando uma constraint impossível e sem sentido para o adder.

---

### 17. Invalid exceptions

Exceções inválidas podem ser silenciosamente ignoradas.

Por isso, sempre verifique:

```tcl
report_timing_requirements -ignored
```

Esse comando mostra se você aplicou uma exceção em:

- path inexistente;
- objeto inválido;
- endpoint errado;
- pino que não corresponde ao tipo esperado.

Se encontrar erro, remova ou resete a exceção e reaplique corretamente.

---

## Conceitos difíceis explicados em profundidade

### Clock virtual

Clock virtual é um clock criado sem estar associado a uma porta física do design.

Exemplo:

```tcl
create_clock -period 3.0 -name CLKB
```

Ele serve como referência para modelar circuito externo.

Uso típico:

```tcl
set_input_delay -clock CLKB ...
set_output_delay -clock CLKB ...
```

Ele diz:

```text
o mundo externo está sincronizado por este clock
```

mesmo que esse clock não entre no bloco.

---

### `-add_delay`

Quando se aplica mais de um delay ao mesmo port, usa-se:

```tcl
-add_delay
```

Exemplo:

```tcl
set_output_delay -max 0.15 -clock CLKD [get_ports OUT1]
set_output_delay -max 0.52 -clock CLKE -add_delay [get_ports OUT1]
```

Sem `-add_delay`, a segunda constraint pode substituir a primeira.

---

### `set_clock_uncertainty -from -to`

A forma simples:

```tcl
set_clock_uncertainty -setup 0.12 [get_clocks Clk2]
```

vale para o clock de forma geral.

A forma específica:

```tcl
set_clock_uncertainty -setup 0.20 \
  -from [get_clocks Clk1] -to [get_clocks Clk2]
```

vale para uma relação específica entre clocks.

Use quando o caminho entre clocks tem margem diferente da margem individual de cada clock.

---

### `create_generated_clock`

Define um clock derivado.

Exemplo:

```tcl
create_generated_clock -divide_by 2 -name CLK_SLW \
  -source [get_ports CLK] [get_pins DIV_CLK_reg/Q]
```

Componentes:

- `-divide_by 2`: frequência dividida por 2.
- `-name CLK_SLW`: nome do clock gerado.
- `-source [get_ports CLK]`: clock mestre.
- `[get_pins DIV_CLK_reg/Q]`: ponto onde o clock gerado aparece.

---

### `set_clock_groups -logically_exclusive`

Use quando dois clocks são mutuamente exclusivos por lógica, mas ainda podem existir fisicamente.

Exemplo:

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

Efeito:

- remove análise de caminhos impossíveis entre grupos;
- ajuda o otimizador a não gastar esforço em relações irreais.

---

### `set_clock_groups -physically_exclusive`

Use quando dois clocks não podem existir fisicamente ao mesmo tempo no mesmo ponto/rede.

Exemplo:

```tcl
set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

Efeito:

- semelhante à exclusividade lógica para timing;
- também informa análise de SI/crosstalk que os clocks são exclusivos.

---

### `set_clock_groups -asynchronous`

Use para clocks sem relação de fase/frequência confiável.

Exemplo:

```tcl
set_clock_groups -asynchronous -group CLKA -group CLKB
```

Efeito:

- corta timing entre os domínios;
- mantém análise dentro de cada domínio;
- não substitui CDC correto no RTL.

---

### `set_multicycle_path`

Relaxa caminhos que foram projetados para levar mais de um ciclo.

Exemplo:

```tcl
set_multicycle_path -setup 6 -from A_reg[*] -to C_reg[*]
set_multicycle_path -hold 5  -from A_reg[*] -to C_reg[*]
```

Regra prática:

```text
setup = N
hold = N - 1
```

para o caso típico em que se quer mover apenas o setup e manter o hold check seguro perto do lançamento.

---

### `report_timing_requirements -ignored`

Verifica exceções ignoradas.

Exemplo:

```tcl
report_timing_requirements -ignored
```

Use depois de aplicar:

- `set_false_path`;
- `set_multicycle_path`;
- `set_clock_groups`;
- outras exceções.

Motivo: algumas exceções inválidas não geram warning automaticamente.

---

## Figuras, diagramas e exemplos importantes

### Multiple synchronous clock designs

Mostra um clock principal dividido em vários clocks relacionados. Ajuda a entender por que alguns clocks precisam ser virtuais.

### Multiple clock input delay

Mostra dado lançado por `CLKB` e capturado por `CLKC`. A lógica interna recebe apenas o tempo restante após o atraso externo.

### Multiple clock output delay

Mostra uma saída capturada por dois clocks externos. A opção `-add_delay` é essencial para preservar múltiplas constraints no mesmo port.

### Inter clock uncertainty

Mostra que uncertainty individual pode ser insuficiente em caminhos entre clocks. A forma `-from/-to` modela uma relação específica.

### Clock through sequential logic

Mostra que `create_clock` não atravessa registrador. A solução é `create_generated_clock`.

### Generated clock em registrador instanciado e RTL

Mostra duas formas de referenciar o ponto onde o clock derivado nasce: pino instanciado ou pino GTECH de registrador inferido.

### Logically exclusive clocks

Mostra casos em que clocks são exclusivos em todo o caminho ou apenas parcialmente. O segundo caso exige `-through`.

### Physically exclusive clocks

Mostra o problema de crosstalk: logicamente exclusivo pode ser bom para DC NXT, mas pessimista em PT-SI. Fisicamente exclusivo corrige a análise de SI quando os clocks realmente não coexistem.

### Multi-cycle path

Mostra por que `-setup 6` precisa vir acompanhado de `-hold 5`.

### Invalid exceptions

Mostra que exceções inválidas podem ser ignoradas sem warning, exigindo verificação explícita.

---

## Pontos de prova e revisão

1. Múltiplos clocks derivados da mesma fonte são síncronos relacionados.
2. Clocks que não entram no design podem ser criados como clocks virtuais:
   ```tcl
   create_clock -period 3.0 -name CLKB
   ```
3. `set_input_delay` deve referenciar o clock externo de lançamento.
4. `set_output_delay` deve referenciar o clock externo de captura.
5. Para aplicar múltiplos delays no mesmo port, usar:
   ```tcl
   -add_delay
   ```
6. Em caminhos entre clocks, pode ser necessário:
   ```tcl
   set_clock_uncertainty -setup valor -from clockA -to clockB
   ```
7. `create_clock` não se propaga através de lógica sequencial.
8. Clocks derivados por registradores ou muxes devem ser modelados com:
   ```tcl
   create_generated_clock
   ```
9. Em registrador RTL, pode-se usar o nome GTECH do pino, como:
   ```tcl
   DIV_CLK_reg/Q
   ```
10. Pin synonyms ajudam a aplicar constraints em RTL/GTECH e netlist mapeada.
11. Clocks muxados não são inferidos automaticamente como exclusivos.
12. Para clocks logicamente exclusivos:
   ```tcl
   set_clock_groups -logically_exclusive -group CLK1 -group CLK2
   ```
13. Quando a exclusividade é parcial, usar `set_false_path` com `-through`.
14. Para clocks fisicamente exclusivos:
   ```tcl
   set_clock_groups -physically_exclusive -group CLK1 -group CLK2
   ```
15. `-physically_exclusive` também afeta análise de crosstalk/SI.
16. Não usar `-physically_exclusive` quando os clocks podem existir fisicamente ao mesmo tempo em redes diferentes.
17. Para clocks assíncronos:
   ```tcl
   set_clock_groups -asynchronous -group CLKA -group CLKB
   ```
18. CDC correto é responsabilidade do projetista, não da constraint.
19. Caminhos multi-cycle precisam de `set_multicycle_path`.
20. Para setup N, normalmente usar hold N-1.
21. Exemplo:
   ```tcl
   set_multicycle_path -setup 6 ...
   set_multicycle_path -hold 5 ...
   ```
22. Exceções inválidas podem não gerar warning.
23. Sempre verificar:
   ```tcl
   report_timing_requirements -ignored
   ```
24. Exceções devem ser específicas, para não esconder timing real.

---

## Script consolidado da aula

### Exemplo: clocks síncronos múltiplos com input/output delays

```tcl
create_clock -period 2.0 [get_ports CLKC]
create_clock -period 3.0 -name CLKB

set_input_delay -max 0.55 -clock CLKB [get_ports IN1]

create_clock -period 1.0 -name CLKE
create_clock -period [expr {1000/750.0}] -name CLKD

set_output_delay -max 0.15 -clock CLKD [get_ports OUT1]
set_output_delay -max 0.52 -clock CLKE -add_delay [get_ports OUT1]
```

### Exemplo: uncertainty entre clocks

```tcl
set_clock_uncertainty -setup 0.20 \
  -from [get_clocks Clk1] -to [get_clocks Clk2]
```

### Exemplo: generated clock

```tcl
create_clock -period 5 [get_ports CLK]

create_generated_clock -divide_by 2 -name CLK_SLW \
  -source [get_ports CLK] [get_pins DIV_CLK_reg/Q]
```

### Exemplo: clocks logicamente exclusivos

```tcl
create_clock -period 2.0 [get_ports CLK1]
create_clock -period [expr {1000/750.0}] [get_ports CLK2]

set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

### Exemplo: exclusividade parcial

```tcl
set_false_path -from [get_clocks CLK1] \
  -through [get_ports OUT1] -to [get_clocks CLK2]

set_false_path -from [get_clocks CLK2] \
  -through [get_ports OUT1] -to [get_clocks CLK1]
```

### Exemplo: clocks fisicamente exclusivos no output de mux

```tcl
create_clock -period 5 -name FST_CLK [get_ports CLK1]
create_clock -period 8 -name SLW_CLK [get_ports CLK2]

create_generated_clock -divide_by 1 -name MCLK1 \
  -source CLK1 [get_pins I_CLK_MUX/Z]

create_generated_clock -divide_by 1 -name MCLK2 -add \
  -source CLK2 [get_pins I_CLK_MUX/Z]

set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

### Exemplo: clocks assíncronos

```tcl
current_design TOP

create_clock -period 3 [get_ports CLKA]
create_clock -period 2 [get_ports CLKB]

set_clock_groups -asynchronous -group CLKA -group CLKB

compile_ultra
```

### Exemplo: multi-cycle path

```tcl
create_clock -period 2 [get_ports CLK]

set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]

set_multicycle_path -hold 5 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

### Exemplo: verificar exceções inválidas

```tcl
report_timing_requirements -ignored
```

---

## Relação com projeto/laboratório

Esta aula é uma das mais importantes para scripts reais de constraints. Em laboratório e projeto, clocks raramente são simples. Um arquivo `.sdc` ou `.con` real pode ter:

```tcl
create_clock
create_generated_clock
set_input_delay
set_output_delay
set_clock_uncertainty
set_clock_groups
set_false_path
set_multicycle_path
report_timing_requirements -ignored
```

A disciplina prática é:

```text
1. criar todos os clocks reais e virtuais;
2. criar generated clocks quando houver clocks derivados;
3. definir input/output delays para o ambiente externo;
4. declarar exclusividade lógica/física quando aplicável;
5. cortar clocks assíncronos entre domínios;
6. declarar multi-cycle paths apenas quando o hardware realmente permite;
7. verificar exceções ignoradas;
8. analisar reports depois da síntese.
```

O risco maior desta aula é usar exceções amplas demais. `set_false_path`, `set_clock_groups` e `set_multicycle_path` podem melhorar relatórios artificialmente se forem aplicados de forma errada. Por isso, sempre validar com:

```tcl
report_timing
report_path_group
report_timing_requirements -ignored
```

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

**Bloco 045 — 08 Constraints - Multiple Clocks and Exceptions - parte B**

Mesmo arquivo:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions.docx
```

Faixa:

```text
slides 18-33
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions_parte_B.md
```
