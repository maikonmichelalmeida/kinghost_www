# 10 Constraints - Complex Design Considerations — parte A

## Controle do bloco

- **Bloco:** 047
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations.docx`
- **Faixa processada:** slides 1-17
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations_parte_A.md`
- **Próximo bloco recomendado:** 048 — `10 Constraints - Complex Design Considerations - parte B`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento, processando apenas a faixa **slides 1-17**.

---

## Resumo executivo

Esta aula volta para constraints, mas agora em situações mais refinadas e fáceis de errar. O tema principal é: **o comando de constraint não modela só um número; ele modela uma relação temporal completa entre clock, dado, borda, latência, carga e ambiente externo**.

A parte A cobre:

- comportamento padrão de `create_clock`;
- diferença entre nome da porta e nome do objeto de clock;
- duty-cycle e waveform;
- offset de clock e por que não é recomendado modelá-lo diretamente em `-waveform`;
- clocks com waveform complexo;
- input delay com clock de nome diferente;
- input delay relativo à borda de descida;
- múltiplos caminhos de entrada no mesmo port;
- efeito de `set_driving_cell`;
- modelagem de carga capacitiva externa em inputs;
- revisão de output delay básico;
- output delay com múltiplos caminhos externos.

A ideia mais importante é que o DC NXT calcula quanto tempo sobra para a lógica interna a partir daquilo que você informa sobre o mundo externo. Se o atraso externo, o clock externo, a borda de lançamento, a carga ou a célula driver forem mal modelados, a ferramenta otimiza com base em uma realidade falsa.

---

## Texto extraído e organizado por slide

### Slide 1 — DC NXT Physical Synthesis Flow

O slide mostra o fluxo de síntese física do Design Compiler NXT e destaca novamente a etapa:

```text
Apply Constraints
```

Fluxo mostrado:

```text
Specify Libraries
Load RTL Code
Load Floorplan
Apply Constraints
Synthesize the Design
Analyze Results
Write out Netlist with Cell Placement
```

A aula está no ponto em que as constraints são aplicadas antes da síntese. A diferença para aulas anteriores é que agora o foco está em detalhes mais complexos de modelagem temporal.

---

### Slide 2 — Defining a Clock: Recall Default Behavior

Comando mostrado:

```tcl
create_clock -period 2 [get_ports Clk]
```

O slide destaca:

- `-period 2` é uma opção do comando Tcl.
- `[get_ports Clk]` é um comando Tcl embutido que retorna o objeto port `Clk`.
- Por padrão, o objeto de clock recebe o mesmo nome da porta.
- A unidade de tempo no exemplo é 1 ns, definida pela technology library.
- O clock sobe em 0 ns por padrão.
- O duty-cycle padrão é 50%.

Com período de 2 ns e duty-cycle de 50%, a forma de onda padrão é:

```text
rising edge em 0 ns
falling edge em 1 ns
próxima rising edge em 2 ns
```

Equivalente conceitual:

```text
waveform {0 1}
period 2
```

---

### Slide 3 — Defining a Clock: Different Clock Name

Comando mostrado:

```tcl
create_clock -period 2 -name My_CLK [get_ports Clk]
```

Neste caso:

- a porta física continua se chamando `Clk`;
- o objeto de clock passa a se chamar `My_CLK`.

O slide destaca:

```text
Different from "port" name
```

Isso é importante porque outras constraints, como `set_input_delay`, `set_output_delay`, `set_clock_uncertainty` e `set_clock_latency`, devem referenciar o **nome do objeto de clock**, não necessariamente o nome da porta.

---

### Slide 4 — Input Delay with Different Clock Name

O exemplo mostra um bloco externo chamado `JANE'S_DESIGN` alimentando o nosso bloco `MY_DESIGN`.

O clock do ambiente externo é chamado:

```text
My_CLK
```

A porta física do nosso bloco se chama:

```text
Clk
```

Comandos mostrados:

```tcl
create_clock -period 2 -name My_CLK [get_ports Clk]

set_input_delay -max 0.6 -clock My_CLK [get_ports A]
```

O detalhe do slide:

```text
JANE's clock object name, not port name
```

Tradução:

```text
Nome do objeto de clock da Jane, não o nome da porta.
```

Interpretação:

- `set_input_delay` deve usar `-clock My_CLK`, porque `My_CLK` é o objeto de clock.
- O input delay de 0.6 ns representa o atraso máximo externo do bloco anterior até a entrada `A`.
- A ferramenta usa esse valor para calcular quanto tempo sobra para a lógica interna a partir da chegada em `A`.

---

### Slide 5 — Defining a Clock: Duty-cycle

Comando mostrado:

```tcl
create_clock -period 2 -waveform {0 0.6} \
  -name My_CLK [get_ports Clk]
```

O slide identifica:

- primeiro número de `-waveform`: rising edge;
- segundo número de `-waveform`: falling edge.

Neste exemplo:

```text
rising edge = 0 ns
falling edge = 0.6 ns
period = 2 ns
```

Isso cria um clock com duty-cycle diferente de 50%.

O clock fica em nível alto de 0 a 0.6 ns e repete a cada 2 ns:

```text
rise em 0 ns
fall em 0.6 ns
rise seguinte em 2 ns
fall seguinte em 2.6 ns
```

---

### Slide 6 — Defining a Clock: Offset

Comando mostrado:

```tcl
create_clock -period 2 -waveform {0.4 1.4} \
  -name My_CLK [get_ports Clk]
```

Aqui:

```text
rising edge = 0.4 ns
falling edge = 1.4 ns
period = 2 ns
```

A forma de onda fica deslocada:

```text
rise em 0.4 ns
fall em 1.4 ns
rise seguinte em 2.4 ns
```

O slide alerta:

```text
Defining an offset with -waveform is NOT recommended!
See Notes for the alternative.
```

Interpretação:

- Tecnicamente é possível deslocar a primeira borda usando `-waveform`.
- Porém, para modelar atraso/offset de clock, normalmente é melhor usar latências de clock, como `set_clock_latency`, em vez de “embutir” offset na waveform.
- A waveform deve descrever a forma periódica do clock; latências devem descrever atrasos de chegada do clock.

---

### Slide 7 — Defining a Clock: Complex

Comando mostrado:

```tcl
create_clock -period 1.6 -waveform {0 0.4 0.6 1.4} \
  -name My_CLK [get_ports Clk]
```

O slide mostra um clock com múltiplas bordas dentro de um período:

```text
rise em 0 ns
fall em 0.4 ns
rise em 0.6 ns
fall em 1.4 ns
period = 1.6 ns
```

A pergunta do slide:

```text
If FF3setup = 0.03ns, what is Tmax for the Reg-to-Reg path?
```

Resposta mostrada:

```text
Tmax, Reg-to-Reg = 0.6 - 0.4 - 0.03 = 0.17 ns
```

Interpretação:

- O caminho analisado é de uma borda de lançamento em 0.4 ns para uma borda de captura em 0.6 ns.
- A janela bruta entre bordas é:
  ```text
  0.6 - 0.4 = 0.2 ns
  ```
- Subtraindo setup:
  ```text
  0.2 - 0.03 = 0.17 ns
  ```
- Esse é o tempo máximo disponível para o caminho reg-to-reg.

---

### Slide 8 — Defining a Clock: Exercise

O exercício pergunta como definir o clock:

```text
REFRESH_CLK
```

A forma de onda mostrada tem:

```text
rise em 1 ns
fall em 2 ns
rise em 5 ns
fall em 6 ns
rise em 9 ns
fall em 10 ns
```

Logo:

```text
period = 4 ns
high time = 1 ns
waveform relativo = {0 3}
```

Comando mostrado:

```tcl
create_clock -period 4 -waveform {0 3} \
  -name REFRESH_CLK [get_ports Clk_1]

set_clock_latency <-source> -max 2 [get_clocks REFRESH_CLK]
```

Pergunta do slide:

```text
If FF3setup = 0.3ns, what is Tmax for the Reg-to-Reg path?
```

Resposta mostrada:

```text
Tmax, Reg-to-Reg = 2 - 1 - 0.3 = 0.7 ns
```

Interpretação:

- A forma de onda foi descrita sem colocar offset diretamente em `-waveform`.
- O deslocamento efetivo é modelado por latência de clock.
- O tempo disponível entre a borda de lançamento e captura, descontado setup, é 0.7 ns.

---

### Slide 9 — Input Delay: Recall — Basic Options

O slide revisa `set_input_delay`.

Exemplo:

```tcl
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

O valor `0.6` representa:

```text
External delay: JANE's maximum output delay
```

Ou seja:

- atraso clock-to-Q do registrador externo;
- atraso da lógica externa;
- atraso até o port `A`.

O slide destaca:

```text
You specify how much time is used by external logic...
DC NXT calculates how much time is left for the internal logic.
```

Tradução:

```text
Você especifica quanto tempo é usado pela lógica externa.
O DC NXT calcula quanto tempo resta para a lógica interna.
```

O comando restringe o caminho interno de entrada para setup em relação ao clock de borda positiva de Jane.

---

### Slide 10 — Input Delay: Falling Clock Edge

O exemplo mostra um dado lançado por borda de descida do clock externo.

Comandos:

```tcl
create_clock -period 2 [get_ports Clk]

set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
```

Pontos importantes:

- `-clock_fall` indica que o atraso de entrada é relativo à borda de descida do clock.
- O bloco externo de Jane usa registrador acionado por borda negativa.
- O nosso bloco captura na borda positiva seguinte.

A linha temporal mostra:

```text
Jane's launch edge em 1.0 ns
My capture edge em 2.0 ns
input delay externo = 0.3 ns
```

A janela interna começa depois da chegada do dado em `A`.

---

### Slide 11 — Input Delay: Falling Clock Edge Exercise

O exercício mostra um clock com bordas em:

```text
0.0 ns
1.2 ns
3.6 ns
```

A forma de onda indica:

```text
period = 3.6 ns
falling edge = 1.2 ns
```

O dado externo tem atraso:

```text
1.3 ns
```

A pergunta mostra dois caminhos internos:

- `TN,max`, caminho de entrada até `FF2`;
- `TX,max`, caminho reg-to-reg interno até `FF3`.

O slide já revela as respostas numéricas:

```text
TN,max = 3.6 - 1.2 - 1.3 - 0.2 = 0.9 ns
```

```text
TX,max = 3.6 - 0.2 = 3.4 ns
```

Constraints correspondentes:

```tcl
create_clock -period 3.6 -waveform {0 1.2} [get_ports Clk]

set_input_delay -max 1.3 -clock Clk -clock_fall [get_ports A]
```

Interpretação:

- O dado externo é lançado na borda de descida em 1.2 ns.
- Chega ao port `A` após 1.3 ns.
- Captura interna ocorre na borda de 3.6 ns.
- Subtrai-se também o setup de 0.2 ns.

---

### Slide 12 — Input Delay: Multiple Input Paths

O slide mostra dois caminhos externos chegando ao mesmo port `A`:

- caminho M1 com delay de 0.3 ns, relativo à borda de descida;
- caminho M2 com delay de 1.2 ns, relativo à borda de subida.

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]

set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]

set_input_delay -max 1.2 -clock Clk -add_delay [get_ports A]
```

Ponto importante:

```text
-add_delay
```

é necessário para adicionar a segunda constraint ao mesmo port, sem sobrescrever a primeira.

Interpretação:

- O mesmo input `A` pode receber dados vindos de dois caminhos externos diferentes.
- O DC NXT deve analisar ambos.
- A lógica interna será restringida pelo caminho mais apertado.

---

### Slide 13 — Multiple Input Path Timing Analysis

O slide mostra a análise dos dois caminhos de entrada.

Texto principal:

```text
Design Compiler analyzes both paths and constrains input logic path N with the more restrictive of the two — path M1 in this example.
```

Tradução:

```text
O Design Compiler analisa ambos os caminhos e restringe a lógica de entrada N com o mais restritivo dos dois — o caminho M1 neste exemplo.
```

Pergunta:

```text
If FF2 has a 0.14 ns setup requirement:
What is the maximum delay TN,max?
```

Resposta mostrada:

```text
TN,max = 2.0 - 1.3 - 0.14 = 0.56 ns
```

Interpretação:

- O caminho M1 gera a condição mais restritiva.
- A ferramenta usa a menor janela disponível para a lógica interna.
- Portanto, mesmo que outro caminho pareça menos crítico, o path interno `N` precisa cumprir o pior caso.

---

### Slide 14 — Effect of Driving Cell on Input Delay

O slide mostra que a célula externa que dirige o port de entrada afeta a transição do sinal e, portanto, o atraso dentro do design.

Comandos mostrados:

```tcl
set_input_delay -max 0.6 -clock Clk [get_ports A]...

set_driving_cell -max -lib_cell NAND2_3 [get_ports A]...
```

A figura mostra:

- `set_input_delay` define quando a transição começa;
- a transição do dado em `A` depende da driving cell;
- o data arrival time no port `A` pode ficar depois do valor do input delay, porque a transição leva tempo.

O slide destaca:

```text
Transition begins AFTER set_input_delay time
```

Exemplo visual:

```text
set_input_delay time = 0.6 ns
data arrival time at port A = 0.72 ns
```

Interpretação:

- Se a driving cell for fraca ou a carga for alta, a transição será lenta.
- O ponto de chegada efetivo do dado pode ser posterior ao valor nominal do input delay.
- Isso impacta a análise de timing interna.

---

### Slide 15 — set_driving_cell Recommendation

O slide recomenda precisão ao combinar `set_input_delay` e `set_driving_cell`.

Mensagem principal:

Se as especificações de constraint são precisas e você quer modelar o input data arrival time com precisão, garanta que:

1. O número usado em `set_input_delay` seja baseado em **zero output load** no bloco externo de Jane.
2. A gate em `set_driving_cell` corresponda ao output driver de Jane.

Se isso não for seguido, as constraints de entrada podem incluir pessimismo embutido.

Exemplo do slide:

```text
Latest Data Arrival Time at Port A, after Jane's launching clock:
0.60 ns, with 50 fF load
0.48 ns, with 0.0 fF load
```

O slide indica usar:

```text
0.48 ns
```

porque o efeito da carga/transição será modelado por `set_driving_cell`.

Comandos:

```tcl
create_clock -period 2 [get_ports Clk]

set_input_delay -max 0.48 -clock Clk [get_ports A]

set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

Interpretação:

- `set_input_delay` modela o atraso intrínseco até o port sem carga externa.
- `set_driving_cell` modela a transição real causada pela célula que dirige a entrada.
- Isso evita contar o mesmo efeito duas vezes.

---

### Slide 16 — Modeling External Capacitive Load on Inputs

O slide mostra um caso em que a entrada `INPUT_A` do nosso design também dirige outros blocos externos, totalizando:

```text
12 fF total input capacitance
```

Essa carga externa afeta a transição no input e deve ser modelada em conjunto com `set_driving_cell`.

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]

set_input_delay -max 0.6 -clock Clk [get_ports A]

set_output_delay -max 0.8 -clock Clk [get_ports B]

set_load -max 0.030 [get_ports OUTPUT_B]

set_driving_cell -max -lib_cell NAND2_3 [get_ports INPUT_A]

set_load -max 0.012 [get_ports INPUT_A]
```

Ponto importante:

```text
set_load em input port
```

pode ser usado para modelar carga capacitiva externa adicional que o driver externo também enxerga.

Interpretação:

- `set_driving_cell` diz qual célula externa dirige o input.
- `set_load` em `INPUT_A` informa que existe carga adicional além do nosso bloco.
- Essa combinação melhora a modelagem da transição de entrada.

---

### Slide 17 — Output Delay: Recall — Basic Options

O slide revisa `set_output_delay`.

Exemplo:

```tcl
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

O valor de output delay representa:

```text
External delay: JOE's maximum setup time:
input delay (T) + FF setup time
```

Ou seja, o mundo externo depois da saída `B` consome parte do período de clock.

O slide destaca:

```text
You specify how much time is used by external logic...
DC NXT calculates how much time is left for the internal logic.
```

Tradução:

```text
Você especifica quanto tempo é usado pela lógica externa.
O DC NXT calcula quanto tempo resta para a lógica interna.
```

Interpretação:

- `set_output_delay` não diz quanto atraso tem dentro do nosso bloco.
- Ele diz quanto tempo o bloco externo precisa depois do nosso port de saída.
- O DC NXT usa isso para limitar o atraso máximo interno até `B`.

---

## Aula didática desenvolvida

### 1. A diferença entre porta de clock e objeto de clock

Quando você escreve:

```tcl
create_clock -period 2 [get_ports Clk]
```

o nome da porta e o nome do clock são iguais por padrão:

```text
porta: Clk
clock object: Clk
```

Mas quando você escreve:

```tcl
create_clock -period 2 -name My_CLK [get_ports Clk]
```

você separa as duas coisas:

```text
porta: Clk
clock object: My_CLK
```

Isso importa porque várias constraints se referem ao objeto de clock, não à porta. Então, se você criou `My_CLK`, deve usar:

```tcl
-clock My_CLK
```

em vez de assumir que o nome será `Clk`.

---

### 2. O que `-waveform` realmente define

A opção `-waveform` define as bordas do clock dentro do período.

Exemplo:

```tcl
create_clock -period 2 -waveform {0 0.6} \
  -name My_CLK [get_ports Clk]
```

Significa:

```text
borda de subida em 0 ns
borda de descida em 0.6 ns
período de 2 ns
```

Então o duty-cycle não é 50%. O clock fica alto por 0.6 ns e baixo por 1.4 ns.

Para clocks complexos:

```tcl
-waveform {0 0.4 0.6 1.4}
```

significa:

```text
rise, fall, rise, fall
```

dentro de um período.

---

### 3. Por que offset via `-waveform` não é recomendado

O slide mostra:

```tcl
create_clock -period 2 -waveform {0.4 1.4} \
  -name My_CLK [get_ports Clk]
```

Isso desloca a forma de onda para começar em 0.4 ns.

Mas o alerta do curso é que isso não é recomendado para modelar offset. O motivo prático é separar conceitos:

```text
waveform → formato periódico do clock
latency  → atraso de chegada do clock
```

Se você coloca offset diretamente na waveform, pode misturar a forma ideal do clock com atraso físico/lógico de distribuição. Para modelar atraso, use latência:

```tcl
set_clock_latency ...
```

---

### 4. Como calcular `Tmax` em clocks com bordas próximas

No exemplo complexo:

```tcl
create_clock -period 1.6 -waveform {0 0.4 0.6 1.4}
```

o caminho reg-to-reg considerado lança em uma borda e captura em outra muito próxima.

A conta do slide:

```text
Tmax = 0.6 - 0.4 - 0.03 = 0.17 ns
```

Isso mostra que a frequência nominal não é a única coisa importante. A posição das bordas também pode criar janelas de timing muito curtas.

---

### 5. Input delay: o número que você passa é tempo externo consumido

Em:

```tcl
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

você diz:

```text
antes de chegar em A, o dado já consumiu até 0.6 ns no mundo externo.
```

O DC NXT calcula:

```text
tempo para lógica interna = janela de clock - input delay - setup
```

Quanto maior o input delay externo, menor o tempo disponível para sua lógica interna.

---

### 6. Input delay relativo à borda de descida

Se o registrador externo lança dado na borda de descida, use:

```tcl
-clock_fall
```

Exemplo:

```tcl
set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
```

Isso muda a referência temporal do input delay. O atraso de 0.3 ns não é contado a partir da borda de subida, mas da borda de descida do clock externo.

---

### 7. Múltiplos caminhos de entrada no mesmo port

Um mesmo input pode receber dados de fontes externas diferentes. Então, ele pode precisar de mais de uma constraint.

Exemplo:

```tcl
set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
set_input_delay -max 1.2 -clock Clk -add_delay [get_ports A]
```

A opção:

```tcl
-add_delay
```

é essencial para preservar a constraint anterior.

Sem `-add_delay`, você corre o risco de substituir a constraint já existente.

O DC NXT analisa todas e aplica a mais restritiva ao caminho interno.

---

### 8. `set_driving_cell`: por que o driver externo importa

O input delay diz quando o dado começa a chegar, mas a forma da transição depende da célula externa e da carga.

Se você modela:

```tcl
set_driving_cell -max -lib_cell NAND2_3 [get_ports A]
```

você informa qual célula está dirigindo a entrada.

Isso permite ao DC NXT calcular melhor:

- slew/transição no input;
- atraso das células internas dependente da transição;
- chegada efetiva do dado.

A transição pode fazer o data arrival time no port ficar depois do valor nominal de `set_input_delay`.

---

### 9. Evitando pessimismo com `set_input_delay` + `set_driving_cell`

O slide recomenda não contar o mesmo efeito duas vezes.

Se a especificação externa diz:

```text
0.60 ns com 50 fF de carga
0.48 ns com 0 fF de carga
```

e você vai modelar a carga/transição via `set_driving_cell`, use:

```text
0.48 ns
```

no `set_input_delay`.

Depois, informe o driver real:

```tcl
set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

Assim:

- `set_input_delay` representa atraso intrínseco;
- `set_driving_cell` representa efeito do driver/transição;
- a ferramenta monta uma análise mais precisa.

---

### 10. Carga externa em input

Parece estranho usar `set_load` em input, mas o slide mostra um caso em que isso faz sentido.

Se o mesmo sinal de entrada também alimenta outros blocos externos, o driver externo precisa carregar:

```text
nosso input + inputs dos outros blocos
```

Então podemos modelar carga adicional:

```tcl
set_load -max 0.012 [get_ports INPUT_A]
```

Isso afeta a transição calculada em conjunto com `set_driving_cell`.

---

### 11. Output delay: o tempo que o bloco externo precisa depois da nossa saída

Em:

```tcl
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

você está dizendo:

```text
o circuito externo depois de B precisa de até 0.8 ns
```

Esse valor pode incluir:

- delay externo até o registrador de captura;
- setup do registrador externo.

O DC NXT então calcula quanto tempo resta para a lógica interna chegar até `B`.

---

## Conceitos difíceis explicados em profundidade

### Objeto Tcl versus nome textual

`[get_ports Clk]` não é texto comum. É um comando Tcl que retorna um objeto.

Quando usado em:

```tcl
create_clock -period 2 [get_ports Clk]
```

o clock é anexado ao objeto port `Clk`.

Já `-name My_CLK` cria um objeto de clock com nome independente:

```tcl
create_clock -period 2 -name My_CLK [get_ports Clk]
```

Depois, constraints devem referenciar:

```tcl
[get_clocks My_CLK]
```

ou:

```tcl
-clock My_CLK
```

dependendo do comando.

---

### Duty-cycle

Duty-cycle é a fração do período em que o clock fica alto.

Exemplo:

```text
period = 2 ns
falling edge = 0.6 ns
```

Duty-cycle:

```text
0.6 / 2 = 30%
```

Logo, `-waveform {0 0.6}` representa duty-cycle de 30%.

---

### Clock offset

Clock offset é deslocamento temporal da forma de onda.

Embora seja possível escrever:

```tcl
-waveform {0.4 1.4}
```

o curso alerta que isso não é recomendado para modelar offset. O melhor é usar latência, porque ela representa o atraso de chegada do clock.

---

### Falling clock edge

Quando se usa:

```tcl
-clock_fall
```

o delay passa a ser referenciado à borda de descida do clock.

Em input delay:

```tcl
set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
```

significa:

```text
o dado chega 0.3 ns após a borda de descida do clock de referência.
```

---

### `-add_delay`

`-add_delay` permite acumular constraints no mesmo port.

Sem ele:

```tcl
set_input_delay ...
set_input_delay ...
```

o segundo comando pode substituir o primeiro.

Com ele:

```tcl
set_input_delay ... 
set_input_delay ... -add_delay
```

a ferramenta mantém ambas as condições e analisa a mais restritiva.

---

### `set_driving_cell`

Modela a célula externa que dirige um input.

Exemplo:

```tcl
set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

Isso ajuda a calcular transição e atraso dependente de slew.

---

### `set_load` em input

Pode ser usado quando o sinal de entrada também carrega outros blocos externos além do nosso design.

Exemplo:

```tcl
set_load -max 0.012 [get_ports INPUT_A]
```

Isso representa carga adicional vista pelo driver externo.

---

## Pontos de prova e revisão

1. `create_clock -period 2 [get_ports Clk]` cria clock com nome igual ao port por padrão.
2. O duty-cycle padrão é 50%.
3. O clock sobe em 0 ns por padrão.
4. `-name` permite dar nome diferente ao objeto de clock:
   ```tcl
   create_clock -period 2 -name My_CLK [get_ports Clk]
   ```
5. Em `set_input_delay`, use o nome do objeto de clock, não necessariamente o nome da porta.
6. `-waveform {rise fall}` define bordas dentro do período.
7. Exemplo de duty-cycle diferente:
   ```tcl
   create_clock -period 2 -waveform {0 0.6}
   ```
8. Offset via `-waveform` não é recomendado.
9. Para waveform complexa, os valores alternam rise/fall:
   ```tcl
   -waveform {0 0.4 0.6 1.4}
   ```
10. Exemplo de cálculo:
    ```text
    Tmax = 0.6 - 0.4 - 0.03 = 0.17 ns
    ```
11. `set_input_delay -max` especifica tempo usado pela lógica externa.
12. O DC NXT calcula quanto tempo sobra para a lógica interna.
13. Para dado lançado por borda de descida:
    ```tcl
    -clock_fall
    ```
14. Para múltiplos input delays no mesmo port:
    ```tcl
    -add_delay
    ```
15. `set_driving_cell` modela o driver externo.
16. Se usar `set_driving_cell`, o input delay deve preferencialmente ser baseado em zero output load do bloco externo.
17. `set_load` em input pode modelar carga externa adicional vista pelo driver.
18. `set_output_delay` modela o tempo usado pelo circuito externo depois da saída.
19. Output delay reduz o tempo disponível para a lógica interna de saída.

---

## Script consolidado da parte A

### Clock básico

```tcl
create_clock -period 2 [get_ports Clk]
```

### Clock com nome diferente

```tcl
create_clock -period 2 -name My_CLK [get_ports Clk]

set_input_delay -max 0.6 -clock My_CLK [get_ports A]
```

### Clock com duty-cycle diferente

```tcl
create_clock -period 2 -waveform {0 0.6} \
  -name My_CLK [get_ports Clk]
```

### Clock complexo

```tcl
create_clock -period 1.6 -waveform {0 0.4 0.6 1.4} \
  -name My_CLK [get_ports Clk]
```

### Exercício de REFRESH_CLK

```tcl
create_clock -period 4 -waveform {0 3} \
  -name REFRESH_CLK [get_ports Clk_1]

set_clock_latency -source -max 2 [get_clocks REFRESH_CLK]
```

### Input delay básico

```tcl
set_input_delay -max 0.6 -clock Clk [get_ports A]
```

### Input delay relativo à borda de descida

```tcl
create_clock -period 2 [get_ports Clk]

set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
```

### Múltiplos input delays no mesmo port

```tcl
create_clock -period 2 [get_ports Clk]

set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
set_input_delay -max 1.2 -clock Clk -add_delay [get_ports A]
```

### Driving cell

```tcl
set_input_delay -max 0.48 -clock Clk [get_ports A]

set_driving_cell -max -lib_cell FD1 -pin Qn [get_ports A]
```

### Carga externa em input

```tcl
set_driving_cell -max -lib_cell NAND2_3 [get_ports INPUT_A]
set_load -max 0.012 [get_ports INPUT_A]
```

### Output delay básico

```tcl
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

---

## Relação com projeto/laboratório

Esta parte é muito importante para montar um `.sdc` real. Em laboratório, erros comuns são:

```text
usar nome da porta em vez do nome do clock;
esquecer -clock_fall em interface lançada por borda de descida;
sobrescrever delay anterior por esquecer -add_delay;
informar input delay já carregado e também usar set_driving_cell, criando pessimismo;
ignorar carga externa que afeta transição do input;
interpretar output delay como atraso interno, quando ele representa tempo externo.
```

A disciplina correta é separar o ambiente externo da lógica interna:

```text
set_input_delay → tempo já gasto antes do meu bloco;
set_output_delay → tempo necessário depois do meu bloco;
set_driving_cell → força/slew do driver externo;
set_load → carga externa no port;
create_clock → referência temporal;
set_clock_latency → atraso de chegada do clock.
```

Assim o DC NXT consegue calcular corretamente quanto tempo resta para otimizar a lógica interna.

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides 1-17.
- [x] Não avancei para a parte B.
- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 048 — 10 Constraints - Complex Design Considerations - parte B**

Mesmo arquivo:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations.docx
```

Faixa:

```text
slides 18-34
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations_parte_B.md
```
