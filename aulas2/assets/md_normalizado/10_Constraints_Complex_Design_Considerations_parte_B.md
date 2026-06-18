# 10 Constraints - Complex Design Considerations — parte B

## Controle do bloco

- **Bloco:** 048
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations.docx`
- **Faixa processada:** slides 18-34
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations_parte_B.md`
- **Próximo bloco recomendado:** 049 — `11 Post-Synthesis Output Data`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento, processando apenas a faixa **slides 18-34**.

---

## Resumo executivo

Esta parte B continua a aula de **Constraints - Complex Design Considerations**, agora focando em três assuntos que costumam gerar muitos erros em scripts SDC/Tcl:

1. **Output delay em caminhos externos complexos**
   - Uma mesma saída pode alimentar caminhos externos diferentes.
   - Cada caminho externo pode usar borda de clock diferente.
   - A ferramenta deve considerar a constraint mais restritiva.
   - Para múltiplas constraints no mesmo port, é necessário usar `-add_delay`.

2. **Ordem dos argumentos em comandos Tcl**
   - A ordem das opções geralmente não importa.
   - Mas o valor numérico, o clock e o objeto final têm posições sensíveis.
   - O nome do clock deve vir imediatamente depois de `-clock`.
   - Não se pode colocar dois valores numéricos no mesmo comando.
   - Para adicionar uma constraint complementar, usa-se `-add_delay`.

3. **Latências de clock pré-CTS e pós-CTS**
   - Antes da CTS, clocks são tratados como ideais e as latências são estimadas.
   - Depois da CTS, redes de clock do design atual podem se tornar propagadas.
   - Se alguém propaga todos os clock objects com `set_propagated_clock [all_clocks]`, clocks de referência de I/O também podem ficar propagados indevidamente.
   - Isso é perigoso, pois pode gerar violações falsas ou mascarar violações reais.
   - A solução é tratar latências de I/O de forma independente, usando clocks virtuais ou incluindo source/network latency diretamente nos delays de I/O.

A mensagem central é: **constraints de I/O não são apenas números; elas precisam permanecer corretas antes e depois da CTS**. Se a latência de clock for mal modelada, a chegada absoluta dos dados de entrada/saída muda artificialmente, e a análise de timing deixa de representar o circuito real.

---

## Texto extraído e organizado por slide

### Slide 18 — Output Delay: Complex Output Paths

O slide mostra um caso em que a saída `B` do bloco `MY_DESIGN` alimenta dois caminhos externos diferentes no bloco `JOE'S_DESIGN`.

O clock interno do nosso bloco é:

```text
Clk = 250 MHz
```

Logo, o período é:

```text
4 ns
```

O bloco externo tem dois caminhos:

- Caminho superior:
  - atraso externo `T1 = 2.4 ns`;
  - registrador externo acionado por borda de subida;
  - setup externo `Tsetup, FF = 0.1 ns`.

- Caminho inferior:
  - atraso externo `T2 = 0.6 ns`;
  - registrador externo acionado por borda de descida;
  - setup externo `Tsetup, FF = 0.1 ns`.

Pergunta do slide:

```text
How do you constrain MY_DESIGN for the indicated path?
```

Comandos mostrados:

```tcl
create_clock -period 4 [get_ports Clk]

set_output_delay -max 2.5 -clock Clk [get_ports B]

set_output_delay -max 0.7 -clock Clk -clock_fall -add_delay [get_ports B]
```

Interpretação:

- `2.5 ns = 2.4 ns + 0.1 ns`
- `0.7 ns = 0.6 ns + 0.1 ns`
- O primeiro `set_output_delay` modela o caminho externo capturado na borda de subida.
- O segundo modela o caminho externo capturado na borda de descida.
- `-add_delay` mantém as duas constraints no mesmo port `B`.

---

### Slide 19 — Complex Output Path Timing Analysis

O slide analisa os dois caminhos externos declarados no slide anterior.

Comandos repetidos:

```tcl
create_clock -period 4 [get_ports Clk]

set_output_delay -max 2.5 -clock Clk [get_ports B]

set_output_delay -max 0.7 -clock Clk -clock_fall -add_delay [get_ports B]
```

Texto principal:

```text
Design Compiler analyzes both paths and constrains output logic path S with the more restrictive of the two.
```

Tradução:

```text
O Design Compiler analisa ambos os caminhos e restringe a lógica de saída S com o mais restritivo dos dois.
```

Resultado mostrado:

```text
TS,max = 1.3 ns
```

Interpretação:

- Para a borda de subida, o mundo externo consome 2.5 ns de um período de 4 ns.
- Sobraria:
  ```text
  4.0 - 2.5 = 1.5 ns
  ```
- Para a borda de descida, a relação é mais apertada.
- O slide mostra que a ferramenta calcula a janela mais restritiva para a lógica interna de saída:
  ```text
  TS,max = 1.3 ns
  ```

Conclusão: quando há múltiplas constraints de output delay no mesmo port, o DC NXT considera todas e usa a pior janela temporal aplicável.

---

### Slide 20 — Argument Ordering of TCL Commands

O slide mostra que a ordem das opções em Tcl geralmente não importa, mas existem exceções.

Comando original:

```tcl
set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
```

Comando equivalente:

```tcl
set_input_delay 0.3 -clock_fall -max [get_ports A] -clock Clk
```

O slide indica que esses comandos são equivalentes.

Mas há regras importantes:

1. Não pode haver dois valores numéricos no mesmo comando.
2. Se quiser adicionar outra constraint complementar, use `-add_delay`.
3. O source port ou pin precisa estar à direita do valor numérico.
4. O nome do clock precisa vir imediatamente depois da opção `-clock`.

Exemplo problemático mostrado:

```tcl
set_input_delay 0.1 -clock_fall -min [get_ports A] -clock Clk
```

Interpretação:

- O Tcl permite reordenar opções, mas algumas opções esperam argumentos imediatamente depois.
- `-clock` espera o nome do clock logo em seguida.
- O objeto de porta normalmente fica ao final do comando.
- Não se deve misturar múltiplos valores numéricos no mesmo comando tentando definir várias constraints de uma vez.

---

### Slide 21 — Pre-versus Post-CTS Clock Latencies

O slide introduz o assunto das próximas páginas:

```text
The remaining pages cover "ideal" (pre-CTS) versus "propagated" (post-CTS) clock latencies.
```

Tradução:

```text
As páginas restantes cobrem latências de clock "ideais" antes da CTS versus latências de clock "propagadas" depois da CTS.
```

A figura mostra três blocos:

- `JANE'S_DESIGN`, à esquerda;
- `MY_DESIGN`, no centro;
- `JOE'S_DESIGN`, à direita.

O clock passa pelo ambiente externo e pelo nosso design. A partir daqui, o problema é manter as constraints de I/O coerentes antes e depois da clock tree synthesis.

---

### Slide 22 — Pre-CTS: Ideal Clock Latencies

Antes da CTS, as redes de clock são tratadas como ideais:

```text
Prior to clock tree synthesis (CTS), clock networks are ideal.
```

O slide afirma:

- A análise de timing em Design Compiler, IC Compiler II e PrimeTime usa valores estimados de latência ideal de clock definidos por `set_clock_latency`.
- Latências ideais de clock se aplicam ao design atual e também aos clocks de referência de I/O definidos por `set_input_delay` e `set_output_delay`.

Exemplo mostrado:

```tcl
set_input_delay -clock CLK -max 2.2 [get_ports IN1]

create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]
```

A figura destaca:

```text
Current design and I/O reference clocks are "ideal"
```

e:

```text
The "absolute" arrival time of the input data is 1.0 + 2.2 = 3.2 ns
```

Interpretação:

- A latência de clock de 1.0 ns é somada ao input delay de 2.2 ns.
- Logo, a chegada absoluta do dado de entrada é:
  ```text
  3.2 ns
  ```

---

### Slide 23 — Post-CTS: Propagated Clock Sources

Depois da CTS, as redes de clock se tornam propagadas:

```text
After CTS, clock networks become propagated.
```

O slide diz:

- O IC Compiler II aplica automaticamente:
  ```tcl
  set_propagated_clock
  ```
  às fontes de clock, ou seja, ports/pins.
- As latências reais propagadas da rede de clock são calculadas dentro do design atual.
- Latências ideais estimadas ainda se aplicam aos clocks de referência de I/O.

Exemplo mostrado:

```tcl
set_input_delay -clock CLK -max 2.2 [get_ports IN1]

create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]
set_propagated_clock [get_ports CLOCK]
```

A figura destaca:

```text
I/O reference clocks remain "ideal"
```

e:

```text
Current design clock networks become "propagated"
```

Mesmo com a rede interna propagada, o slide mostra que:

```text
The "absolute" arrival time of the input data remains 3.2 ns
```

Interpretação:

- O clock do design atual usa latência propagada real, por exemplo 0.92 ns.
- Mas o clock de referência de I/O continua ideal com 1.0 ns.
- Assim, a chegada absoluta do dado de entrada continua coerente com o pré-CTS.

---

### Slide 24 — Post-CTS: Propagated Clock Objects

O slide alerta sobre um erro comum pós-CTS.

Alguns usuários de IC Compiler II ou PrimeTime propagam inadvertidamente os **clock objects** aplicando explicitamente:

```tcl
set_propagated_clock [all_clocks]
```

Problema:

```text
I/O reference clocks also become propagated, but there are no actual clock paths
→ Calculated I/O clock latencies are 0!
```

Tradução:

```text
Os clocks de referência de I/O também se tornam propagados, mas não existem caminhos reais de clock para eles.
Logo, as latências calculadas de clock de I/O viram 0.
```

O slide alerta:

```text
Dangerous: Can cause missed or false timing violations!
```

Na figura, a chegada absoluta do dado de entrada muda artificialmente:

```text
de 3.2 ns para 2.2 ns
```

Interpretação:

- Antes, o input data arrival era:
  ```text
  1.0 + 2.2 = 3.2 ns
  ```
- Se o clock de referência de I/O é propagado indevidamente e sua latência vira 0:
  ```text
  0 + 2.2 = 2.2 ns
  ```
- Isso altera a análise de timing sem que o hardware real tenha mudado.
- Pode esconder ou criar violações falsas.

---

### Slide 25 — Independent I/O Clock Latencies (1 of 2)

O slide propõe uma solução para garantir que as latências de referência de I/O fiquem corretas independentemente de como `set_propagated_clock` é aplicado.

Primeira abordagem:

```text
Use independent virtual clocks for the I/Os, with their own latencies.
```

Tradução:

```text
Use clocks virtuais independentes para os I/Os, com suas próprias latências.
```

Exemplo:

```tcl
create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]

create_clock -period 4 -name V_CLK
set_clock_latency -max 1.0 [get_clocks V_CLK]

set_input_delay -clock V_CLK -max 2.2 [get_ports IN1]
```

O slide afirma:

```text
Virtual clocks remain ideal so their network latencies are determined by their set_clock_latency constraints.
```

Tradução:

```text
Clocks virtuais permanecem ideais, então suas latências de rede são determinadas pelas constraints de set_clock_latency.
```

Interpretação:

- O clock real `CLK` pode ser propagado pós-CTS.
- O clock virtual `V_CLK`, usado como referência de I/O, continua ideal.
- Assim, o input delay não muda de significado quando os clocks reais são propagados.

---

### Slide 26 — Independent I/O Clock Latencies (2 of 2)

A segunda abordagem é incluir a latência de clock no próprio delay de dados de I/O.

O slide diz:

```text
Include the clock network latency in the I/O data path delay.
```

Em vez de fazer:

```tcl
create_clock -period 4 -name CLK [get_ports CLK]
set_clock_latency -max 1.0 [get_clocks CLK]

set_input_delay -clock CLK -max 2.2 [get_ports IN1]
```

faz-se:

```tcl
create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]

set_input_delay -clock CLK -max 3.2 \
  -network_latency_included [get_ports IN1]
```

O slide explica:

```text
The -network_latency_included option ensures that the I/O data arrival times are the same for both ideal and propagated clocks.
```

Tradução:

```text
A opção -network_latency_included garante que os tempos de chegada dos dados de I/O sejam os mesmos tanto para clocks ideais quanto para clocks propagados.
```

Interpretação:

- Antes, a chegada absoluta era:
  ```text
  1.0 + 2.2 = 3.2 ns
  ```
- Agora, coloca-se diretamente:
  ```text
  3.2 ns
  ```
  no input delay.
- A opção `-network_latency_included` informa que a latência de rede já foi incluída naquele número.

---

### Slide 27 — Exercise: Output Delay with Network Latency

O slide apresenta um exercício de output delay.

Comandos iniciais:

```tcl
create_clock -period 4 [get_ports CLK]
set_clock_latency -max 1.0 [get_clocks CLK]
set_output_delay -clock CLK -max 2.5 [get_ports B]
```

A pergunta:

```text
How would you modify the above output delay constraint to keep the required output arrival time at port B the same pre-versus post-CTS?
```

O slide mostra a estrutura do comando com a resposta escondida:

```tcl
set_output_delay -clock CLK -max ____ \
  -network_latency_included [get_ports B]
```

Interpretação:

- É necessário subtrair a network latency do valor original de output delay.
- O slide seguinte revela o número.

---

### Slide 28 — Exercise: Output Delay with Network Latency — resposta

O slide revela a resposta:

```tcl
set_output_delay -clock CLK -max 1.5 \
  -network_latency_included [get_ports B]
```

Cálculo mostrado:

```text
2.5 - 1.0 = 1.5
```

Interpretação:

- O output delay original era 2.5 ns.
- A network latency era 1.0 ns.
- Para que o required output arrival time em `B` permaneça o mesmo pré e pós-CTS, usa-se:
  ```text
  1.5 ns
  ```
  com `-network_latency_included`.

Essa conta é diferente do caso de input delay porque output delay representa tempo reservado para o mundo externo depois da saída.

---

### Slide 29 — Exercise: Output Delay with Source Latency

Agora o exercício inclui source latency e network latency.

Comandos iniciais:

```tcl
create_clock -period 4 [get_ports CLK]
set_clock_latency -source -max 0.4 [get_clocks CLK]
set_clock_latency -max 1.0 [get_clocks CLK]
set_output_delay -clock CLK -max 2.5 [get_ports B]
```

Pergunta:

```text
How would you modify the above output delay constraint to include both source- and network-latency?
```

Resposta mostrada:

```tcl
set_output_delay -clock CLK -max 1.1 \
  -source_latency_included \
  -network_latency_included [get_ports B]
```

Cálculo:

```text
2.5 - 0.4 - 1.0 = 1.1
```

Interpretação:

- O valor original de output delay incluía implicitamente relações com latências.
- Para manter o required output arrival time coerente quando source e network latency são tratadas como incluídas, subtraem-se ambas:
  ```text
  output delay ajustado = 2.5 - source latency - network latency
  ```
- Resultado:
  ```text
  1.1 ns
  ```

---

### Slide 30 — Different I/O versus Internal Latencies

O slide apresenta uma pergunta:

```text
How do we model "ideal" external or I/O latencies that are different than the current design's latencies?
```

Tradução:

```text
Como modelamos latências externas ou de I/O ideais que são diferentes das latências do design atual?
```

A tabela de especificação mostra:

```text
             JANE    ME     JOE
Source       0.18    0.30   0.30
Network      0.12    0.12   0.07
```

Interpretação:

- `JANE` é o bloco que lança dados para nosso input.
- `ME` é o nosso design.
- `JOE` é o bloco que captura nossa saída.
- As latências externas podem ser diferentes das latências internas do nosso design.
- Se usarmos apenas a latência do nosso clock para tudo, modelaremos o ambiente externo errado.

---

### Slide 31 — Default External or I/O Clock Latencies

O slide mostra o comportamento default quando se usam as latências do próprio `MY_DESIGN` para input/output data arrival times.

Tabela:

```text
             JANE    ME     JOE
Source       0.30    0.30   0.30
Network      0.12    0.12   0.12
```

Comandos mostrados:

```tcl
create_clock -period 2 [get_ports Clk]

set_clock_latency -source -max 0.3 [get_clocks Clk]
set_clock_latency -max 0.12 [get_clocks Clk]

set_input_delay -max 0.6 -clock Clk [all_inputs]
set_output_delay -max 0.8 -clock Clk [all_outputs]
```

O slide mostra os tempos calculados:

```text
Input arrival = 0.42 + 0.60 = 1.02
```

```text
Output arrival = 2.42 - 0.80 = 1.62
```

Interpretação:

- A latência total de clock usada como referência é:
  ```text
  0.30 + 0.12 = 0.42 ns
  ```
- Para input, a chegada absoluta do dado é:
  ```text
  clock reference latency + input delay
  ```
- Para output, o required arrival é:
  ```text
  capture clock edge com latência - output delay
  ```

Esse caso só está correto se as latências externas forem iguais às latências internas. Se Jane ou Joe tiverem latências diferentes, será necessário ajustar.

---

### Slide 32 — Handling Different I/O vs Internal Latencies

O slide mostra a especificação real desejada:

```text
             JANE    ME     JOE
Source       0.18    0.30   0.30
Network      0.12    0.12   0.07
```

Logo:

```text
Jane total clock latency = 0.18 + 0.12 = 0.30 ns
ME total clock latency   = 0.30 + 0.12 = 0.42 ns
Joe total clock latency  = 0.30 + 0.07 = 0.37 ns
```

O slide mostra os tempos desejados:

```text
Input arrival = 0.30 + 0.60 = 0.90 ns
```

```text
Output arrival = 2.37 - 0.80 = 1.57 ns
```

Mensagem final:

```text
This is easily accomplished using either the "virtual" or "included" clock latency methods — shown next.
```

Tradução:

```text
Isso é facilmente obtido usando o método de latência de clock virtual ou o método de latência incluída — mostrados a seguir.
```

---

### Slide 33 — Virtual External Clock Latencies

O slide mostra a solução usando clocks virtuais externos independentes.

Comandos reconstruídos do slide:

```tcl
create_clock -period 2 [get_ports Clk]
create_clock -period 2 -name Clk_Jane   ;# Launch virtual clock
create_clock -period 2 -name Clk_Joe    ;# Capture virtual clock

set_clock_latency -source -max 0.30 [get_clocks Clk]
set_clock_latency -source -max 0.18 [get_clocks Clk_Jane]
set_clock_latency -source -max 0.30 [get_clocks Clk_Joe]

set_clock_latency -max 0.12 [get_clocks Clk]
set_clock_latency -max 0.12 [get_clocks Clk_Jane]
set_clock_latency -max 0.07 [get_clocks Clk_Joe]

set_input_delay  -max 0.6 -clock Clk_Jane [all_inputs]
set_output_delay -max 0.8 -clock Clk_Joe  [all_outputs]
```

Interpretação:

- `Clk` representa o clock interno do nosso design.
- `Clk_Jane` representa o clock de lançamento externo de Jane.
- `Clk_Joe` representa o clock de captura externo de Joe.
- Cada clock virtual recebe suas próprias latências.
- Input delays usam `Clk_Jane`.
- Output delays usam `Clk_Joe`.

Isso modela corretamente:

```text
Input arrival = 0.30 + 0.60 = 0.90 ns
Output arrival = 2.37 - 0.80 = 1.57 ns
```

---

### Slide 34 — Included External Clock Latencies

O slide mostra a solução alternativa: incluir as latências externas diretamente nos delays de I/O.

Comandos reconstruídos do slide:

```tcl
create_clock -period 2 [get_ports Clk]

set_clock_latency -source -max 0.3 [get_clocks Clk]
set_clock_latency -max 0.12 [get_clocks Clk]

set_input_delay -max [expr {0.6 + 0.18 + 0.12}] \
  -clock Clk \
  -source_latency_included \
  -network_latency_included [all_inputs]

set_output_delay -max [expr {0.8 - (0.30 + 0.07)}] \
  -clock Clk \
  -source_latency_included \
  -network_latency_included [all_outputs]
```

A figura mostra os resultados desejados:

```text
Input arrival = 0.00 + 0.90 = 0.90 ns
Output arrival = 2.00 - 0.43 = 1.57 ns
```

Interpretação:

- Para input, soma-se a latência externa de Jane ao input delay:
  ```text
  0.6 + 0.18 + 0.12 = 0.90
  ```
- Para output, ajusta-se o output delay para incluir a latência externa de Joe:
  ```text
  0.8 - (0.30 + 0.07) = 0.43
  ```
- As opções:
  ```tcl
  -source_latency_included
  -network_latency_included
  ```
  dizem ao DC NXT que essas latências já foram embutidas nos valores de I/O delay.

---

## Aula didática desenvolvida

### 1. Output delay em caminhos externos complexos

No caso simples, uma saída vai para um único registrador externo. Então um `set_output_delay` basta.

Mas o slide mostra um caso mais realista: a mesma saída `B` pode alimentar dois caminhos externos. Um é capturado por borda de subida; outro, por borda de descida.

Por isso temos:

```tcl
set_output_delay -max 2.5 -clock Clk [get_ports B]

set_output_delay -max 0.7 -clock Clk -clock_fall -add_delay [get_ports B]
```

O `-add_delay` é essencial. Ele informa que a segunda constraint não substitui a primeira; ela é mais uma condição que precisa ser analisada.

A ferramenta então pergunta:

```text
qual dessas condições deixa menos tempo para a lógica interna?
```

E restringe o caminho interno `S` com a mais apertada.

---

### 2. Por que o output delay representa tempo externo, não interno

Um erro comum é pensar:

```text
set_output_delay -max 0.8 significa que minha lógica interna pode atrasar 0.8 ns.
```

Não é isso.

Significa:

```text
o circuito externo depois da minha saída precisa de 0.8 ns.
```

Então, se o período é 4 ns, o tempo restante para o meu bloco não é 0.8 ns. É algo como:

```text
tempo restante interno = janela de clock - output delay externo
```

Por isso, quanto maior o output delay, menos tempo sobra para a lógica interna.

---

### 3. Ordem dos argumentos: por que parece livre, mas não totalmente

Tcl permite grande flexibilidade:

```tcl
set_input_delay -max 0.3 -clock Clk -clock_fall [get_ports A]
```

e:

```tcl
set_input_delay 0.3 -clock_fall -max [get_ports A] -clock Clk
```

podem ser equivalentes.

Mas algumas opções precisam do argumento certo imediatamente depois.

Exemplo:

```tcl
-clock Clk
```

Aqui, `Clk` precisa vir logo depois de `-clock`.

Outro cuidado: o valor numérico principal não pode aparecer duas vezes no mesmo comando. Se quiser duas constraints, use dois comandos e `-add_delay` no segundo.

---

### 4. Pré-CTS: clocks ideais

Antes da clock tree synthesis, a árvore de clock ainda não existe fisicamente. Então o DC NXT usa uma latência ideal estimada:

```tcl
set_clock_latency -max 1.0 [get_clocks CLK]
```

Essa latência ideal é usada tanto para:

- o clock interno do design;
- o clock de referência usado em `set_input_delay` e `set_output_delay`.

Por isso, no exemplo:

```text
input delay = 2.2 ns
clock latency = 1.0 ns
```

a chegada absoluta do dado de entrada é:

```text
3.2 ns
```

---

### 5. Pós-CTS: clock propagado corretamente

Depois da CTS, a árvore de clock real existe. A ferramenta passa a calcular a latência real dentro do design.

Comando:

```tcl
set_propagated_clock [get_ports CLOCK]
```

Nesse caso:

- o clock interno do design fica propagado;
- o clock de referência de I/O continua ideal;
- a chegada absoluta do dado de entrada permanece coerente.

Isso é bom, porque o ambiente externo não deve ser reescrito automaticamente apenas porque a árvore de clock interna foi construída.

---

### 6. O erro perigoso: propagar todos os clocks

O slide alerta contra:

```tcl
set_propagated_clock [all_clocks]
```

Isso pode propagar também clocks de referência de I/O.

O problema é que clocks de referência de I/O podem ser virtuais ou não ter caminho físico real dentro do design atual. Se eles se tornam propagados, a ferramenta calcula latência 0 para eles.

Resultado:

```text
input arrival muda de 3.2 ns para 2.2 ns
```

Essa mudança é artificial. O hardware externo não mudou, mas o relatório de timing mudou. Isso pode gerar:

- violações falsas;
- violações mascaradas;
- análise inconsistente pré e pós-CTS.

---

### 7. Solução 1: clocks virtuais independentes

Uma forma robusta é separar clock interno e clock de referência externo.

Exemplo:

```tcl
create_clock -period 4 -name CLK [get_ports CLOCK]
create_clock -period 4 -name V_CLK
```

Depois:

```tcl
set_input_delay -clock V_CLK -max 2.2 [get_ports IN1]
```

Assim:

- `CLK` é o clock real do design;
- `V_CLK` é só referência de I/O;
- `V_CLK` permanece ideal;
- sua latência vem de `set_clock_latency`.

Essa abordagem é limpa quando o ambiente externo tem latência própria.

---

### 8. Solução 2: latência incluída no I/O delay

A outra abordagem é embutir a latência no próprio delay.

Para input:

```tcl
set_input_delay -clock CLK -max 3.2 \
  -network_latency_included [get_ports IN1]
```

Aqui, `3.2` já inclui:

```text
clock network latency + data delay
```

A opção `-network_latency_included` evita que a ferramenta some ou remova essa latência de forma diferente entre pré e pós-CTS.

---

### 9. Output delay com `-network_latency_included`

No exercício:

```tcl
set_clock_latency -max 1.0 [get_clocks CLK]
set_output_delay -clock CLK -max 2.5 [get_ports B]
```

Para manter o mesmo required output arrival pré e pós-CTS, o slide muda para:

```tcl
set_output_delay -clock CLK -max 1.5 \
  -network_latency_included [get_ports B]
```

A conta é:

```text
2.5 - 1.0 = 1.5
```

Em output delay, quando você diz que a network latency já está incluída, ajusta o valor do delay externo de forma que o required time no port continue igual.

---

### 10. Output delay com source e network latency incluídas

Quando há source latency e network latency:

```text
source latency = 0.4 ns
network latency = 1.0 ns
output delay original = 2.5 ns
```

o valor ajustado é:

```text
2.5 - 0.4 - 1.0 = 1.1 ns
```

Comando:

```tcl
set_output_delay -clock CLK -max 1.1 \
  -source_latency_included \
  -network_latency_included [get_ports B]
```

A ideia é dizer:

```text
este valor já está ajustado considerando source e network latency.
```

---

### 11. Quando I/O externo tem latências diferentes do design interno

O slide mostra:

```text
             JANE    ME     JOE
Source       0.18    0.30   0.30
Network      0.12    0.12   0.07
```

Se você usar apenas o clock interno `ME` como referência para tudo, você assume implicitamente que Jane e Joe têm as mesmas latências que o seu design. Isso está errado.

O resultado correto desejado é:

```text
Jane total = 0.18 + 0.12 = 0.30
Input arrival = 0.30 + 0.60 = 0.90 ns
```

e:

```text
Joe total = 0.30 + 0.07 = 0.37
Output arrival = 2.37 - 0.80 = 1.57 ns
```

---

### 12. Método dos clocks virtuais externos

Com clocks virtuais, cada ambiente externo ganha seu próprio clock:

```tcl
create_clock -period 2 -name Clk_Jane
create_clock -period 2 -name Clk_Joe
```

Depois, aplica-se latência específica:

```tcl
set_clock_latency -source -max 0.18 [get_clocks Clk_Jane]
set_clock_latency -max 0.12 [get_clocks Clk_Jane]

set_clock_latency -source -max 0.30 [get_clocks Clk_Joe]
set_clock_latency -max 0.07 [get_clocks Clk_Joe]
```

E usa-se esses clocks nas constraints:

```tcl
set_input_delay -max 0.6 -clock Clk_Jane [all_inputs]
set_output_delay -max 0.8 -clock Clk_Joe [all_outputs]
```

Esse método é didaticamente limpo e separa bem:

```text
clock interno
clock externo de lançamento
clock externo de captura
```

---

### 13. Método das latências incluídas

No método incluído, você mantém um clock, mas ajusta os valores de I/O delay.

Input:

```text
0.6 + 0.18 + 0.12 = 0.90
```

Output:

```text
0.8 - (0.30 + 0.07) = 0.43
```

Comandos:

```tcl
set_input_delay -max 0.90 -clock Clk \
  -source_latency_included \
  -network_latency_included [all_inputs]

set_output_delay -max 0.43 -clock Clk \
  -source_latency_included \
  -network_latency_included [all_outputs]
```

Esse método é mais compacto, mas exige cuidado matemático. O valor já precisa conter o efeito das latências externas.

---

## Conceitos difíceis explicados em profundidade

### Required output arrival time

Em um output path, o DC NXT calcula até quando o dado precisa chegar ao port de saída para que o bloco externo ainda consiga capturá-lo.

Forma conceitual:

```text
required output arrival = capture clock edge externo - output delay externo
```

Quando latências entram na conta, esse tempo pode mudar. Por isso os slides focam em manter o required output arrival igual pré e pós-CTS.

---

### Clock ideal

Clock ideal é um clock cuja rede física ainda não foi propagada.

A ferramenta não calcula o atraso real da árvore. Ela usa um valor estimado:

```tcl
set_clock_latency
```

Pré-CTS, isso é normal.

---

### Clock propagado

Clock propagado é um clock cuja rede física já existe e pode ser analisada.

Depois da CTS, a ferramenta calcula atrasos reais da rede de clock dentro do design.

Comando típico:

```tcl
set_propagated_clock [get_ports CLOCK]
```

---

### Clock object versus clock source

Propagar a fonte de clock, como uma porta, é diferente de propagar todos os objetos de clock.

Seguro no contexto do slide:

```tcl
set_propagated_clock [get_ports CLOCK]
```

Perigoso:

```tcl
set_propagated_clock [all_clocks]
```

O segundo pode afetar clocks virtuais ou clocks de referência de I/O que não têm caminho físico real.

---

### I/O reference clock

É o clock usado por `set_input_delay` ou `set_output_delay` para representar o ambiente externo.

Esse clock pode ser:

- o próprio clock do design;
- um clock virtual;
- um clock externo nomeado.

Se ele for tratado incorretamente como propagado, sua latência pode virar 0 e alterar os tempos absolutos de chegada.

---

### `-network_latency_included`

Indica que o valor de input/output delay já inclui a latência de rede do clock.

Exemplo input:

```tcl
set_input_delay -clock CLK -max 3.2 \
  -network_latency_included [get_ports IN1]
```

O 3.2 já contém a latência de rede que seria somada separadamente.

---

### `-source_latency_included`

Indica que o valor de input/output delay já inclui a latência de source do clock.

Exemplo output:

```tcl
set_output_delay -clock CLK -max 1.1 \
  -source_latency_included \
  -network_latency_included [get_ports B]
```

O 1.1 já foi ajustado considerando source e network latency.

---

### Clocks virtuais externos

São clocks criados sem porta física, usados para modelar ambiente externo.

Exemplo:

```tcl
create_clock -period 2 -name Clk_Jane
create_clock -period 2 -name Clk_Joe
```

Vantagem:

- cada ambiente externo pode ter latência própria;
- clocks virtuais permanecem ideais;
- o comportamento fica mais estável pré e pós-CTS.

---

## Figuras, diagramas e exemplos importantes

### Output Delay: Complex Output Paths

A figura mostra uma única saída `B` alimentando dois caminhos externos, um capturado por borda de subida e outro por borda de descida. O ponto-chave é o uso de `-add_delay`.

### Complex Output Path Timing Analysis

Mostra que o DC NXT analisa ambos os paths externos e usa o mais restritivo para limitar a lógica interna `S`.

### Argument Ordering of Tcl Commands

Mostra que a ordem das opções geralmente é flexível, mas alguns argumentos têm posição obrigatória.

### Pre-CTS versus Post-CTS Clock Latencies

Introduz a diferença entre clock ideal e clock propagado.

### Pre-CTS Ideal Clock Latencies

Mostra que a chegada absoluta do input é `1.0 + 2.2 = 3.2 ns`.

### Post-CTS Propagated Clock Sources

Mostra o comportamento correto: clock interno propagado, clock de referência de I/O ainda ideal.

### Post-CTS Propagated Clock Objects

Mostra o comportamento perigoso: `set_propagated_clock [all_clocks]` faz clock de referência de I/O virar propagado com latência 0.

### Independent I/O Clock Latencies

Mostra duas soluções: clocks virtuais independentes ou latências incluídas no delay de I/O.

### Virtual External Clock Latencies

Mostra o método mais explícito: `Clk_Jane` e `Clk_Joe`.

### Included External Clock Latencies

Mostra o método matemático: ajustar os delays com `-source_latency_included` e `-network_latency_included`.

---

## Pontos de prova e revisão

1. Em output delay complexo, uma saída pode ter múltiplas constraints.
2. Para adicionar outra constraint ao mesmo port, usar:
   ```tcl
   -add_delay
   ```
3. Para output path capturado na borda de descida, usar:
   ```tcl
   -clock_fall
   ```
4. O DC NXT analisa múltiplos output paths e usa o mais restritivo.
5. A ordem das opções Tcl geralmente não importa, mas o argumento de `-clock` precisa vir logo após `-clock`.
6. Não se deve colocar dois valores numéricos no mesmo comando para tentar criar duas constraints.
7. Pré-CTS, clocks são ideais.
8. Pré-CTS usa-se `set_clock_latency` para modelar latência estimada.
9. Pós-CTS, clocks do design atual podem se tornar propagados.
10. Propagar sources de clock é diferente de propagar todos os clock objects.
11. Evitar:
    ```tcl
    set_propagated_clock [all_clocks]
    ```
    quando há clocks virtuais ou clocks de referência de I/O.
12. Se um I/O reference clock propagado não tem caminho físico, sua latência calculada pode virar 0.
13. Isso pode causar violações falsas ou perdidas.
14. Uma solução é usar clocks virtuais independentes para I/O.
15. Outra solução é incluir latências no próprio delay de I/O.
16. Para input com network latency incluída:
    ```tcl
    set_input_delay -network_latency_included ...
    ```
17. Para output com network latency incluída, ajustar o valor do output delay subtraindo a network latency quando necessário.
18. Exemplo:
    ```text
    2.5 - 1.0 = 1.5
    ```
19. Para output com source e network latency incluídas:
    ```text
    2.5 - 0.4 - 1.0 = 1.1
    ```
20. Para ambientes externos com latências diferentes, usar clocks virtuais ou delays com latência incluída.
21. Clocks virtuais externos podem representar Jane e Joe separadamente.
22. Método virtual é mais explícito; método incluído é mais compacto, porém exige cuidado nos cálculos.

---

## Script consolidado da parte B

### Output delay com dois caminhos externos

```tcl
create_clock -period 4 [get_ports Clk]

set_output_delay -max 2.5 -clock Clk [get_ports B]

set_output_delay -max 0.7 -clock Clk -clock_fall \
  -add_delay [get_ports B]
```

### Propagação correta pós-CTS

```tcl
create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]

set_input_delay -clock CLK -max 2.2 [get_ports IN1]

set_propagated_clock [get_ports CLOCK]
```

### Evitar propagação ampla demais

```tcl
# Perigoso em presença de clocks virtuais ou I/O reference clocks
set_propagated_clock [all_clocks]
```

### Solução com clock virtual para input

```tcl
create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]

create_clock -period 4 -name V_CLK
set_clock_latency -max 1.0 [get_clocks V_CLK]

set_input_delay -clock V_CLK -max 2.2 [get_ports IN1]
```

### Input delay com network latency incluída

```tcl
create_clock -period 4 -name CLK [get_ports CLOCK]
set_clock_latency -max 1.0 [get_clocks CLK]

set_input_delay -clock CLK -max 3.2 \
  -network_latency_included [get_ports IN1]
```

### Output delay com network latency incluída

```tcl
create_clock -period 4 [get_ports CLK]
set_clock_latency -max 1.0 [get_clocks CLK]

set_output_delay -clock CLK -max 1.5 \
  -network_latency_included [get_ports B]
```

### Output delay com source e network latency incluídas

```tcl
create_clock -period 4 [get_ports CLK]
set_clock_latency -source -max 0.4 [get_clocks CLK]
set_clock_latency -max 1.0 [get_clocks CLK]

set_output_delay -clock CLK -max 1.1 \
  -source_latency_included \
  -network_latency_included [get_ports B]
```

### Método com clocks virtuais externos diferentes

```tcl
create_clock -period 2 [get_ports Clk]
create_clock -period 2 -name Clk_Jane
create_clock -period 2 -name Clk_Joe

set_clock_latency -source -max 0.30 [get_clocks Clk]
set_clock_latency -source -max 0.18 [get_clocks Clk_Jane]
set_clock_latency -source -max 0.30 [get_clocks Clk_Joe]

set_clock_latency -max 0.12 [get_clocks Clk]
set_clock_latency -max 0.12 [get_clocks Clk_Jane]
set_clock_latency -max 0.07 [get_clocks Clk_Joe]

set_input_delay  -max 0.6 -clock Clk_Jane [all_inputs]
set_output_delay -max 0.8 -clock Clk_Joe  [all_outputs]
```

### Método com latências incluídas

```tcl
create_clock -period 2 [get_ports Clk]

set_clock_latency -source -max 0.3 [get_clocks Clk]
set_clock_latency -max 0.12 [get_clocks Clk]

set_input_delay -max [expr {0.6 + 0.18 + 0.12}] \
  -clock Clk \
  -source_latency_included \
  -network_latency_included [all_inputs]

set_output_delay -max [expr {0.8 - (0.30 + 0.07)}] \
  -clock Clk \
  -source_latency_included \
  -network_latency_included [all_outputs]
```

---

## Relação com projeto/laboratório

Esta parte é muito importante para ambientes com integração entre blocos, porque I/O timing quase sempre envolve uma suposição sobre o mundo externo. Se essa suposição muda entre pré-CTS e pós-CTS, o fechamento de timing fica inconsistente.

Em scripts reais, preste atenção nestes sinais de alerta:

```text
uso de set_propagated_clock [all_clocks];
clocks virtuais sendo propagados;
input arrival mudando sem mudança real de constraint;
output required time mudando após CTS;
uso de set_input_delay/set_output_delay sem considerar source/network latency;
múltiplos delays no mesmo port sem -add_delay.
```

A prática segura é escolher um método e ser consistente:

```text
Método 1: clocks virtuais externos, com latências próprias.
Método 2: delay de I/O com source/network latency incluídas.
```

O método dos clocks virtuais costuma ser mais legível. O método de latência incluída é compacto, mas exige mais cuidado nas contas.

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides 18-34.
- [x] Não avancei para o próximo arquivo.
- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 049 — 11 Post-Synthesis Output Data**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\11 Post-Synthesis Output Data.docx
```

Faixa:

```text
slides 1-11
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\11 Post-Synthesis Output Data.md
```
