# 08 Constraints - Multiple Clocks and Exceptions — parte B

## Controle do bloco

- **Bloco:** 045
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions.docx`
- **Faixa processada:** slides 18-33
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions_parte_B.md`
- **Próximo bloco recomendado:** 046 — `09 SPG Flow, Congestion, Layout GUI`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento, processando apenas a faixa **18-33**.

---

## Resumo executivo

Esta parte B continua o assunto de **múltiplos clocks e exceções de timing**, mas agora entra nos casos mais perigosos: clocks muxados, exclusividade lógica, exclusividade física, análise de crosstalk/SI, clocks assíncronos, caminhos multi-cycle e exceções inválidas.

A mensagem central é que existem diferentes tipos de “não analisar este caminho”:

- `-logically_exclusive`: clocks são mutuamente exclusivos do ponto de vista lógico.
- `-physically_exclusive`: clocks não podem coexistir fisicamente no mesmo ponto/rede, importante para SI/crosstalk.
- `-asynchronous`: clocks não têm relação temporal confiável.
- `set_false_path`: corta caminhos específicos.
- `set_multicycle_path`: relaxa caminhos que realmente levam mais de um ciclo.
- `report_timing_requirements -ignored`: verifica se suas exceções foram ignoradas ou aplicadas em objetos inválidos.

O risco desta aula é aplicar uma exceção ampla demais e esconder timing real. A ferramenta pode parar de analisar caminhos que deveriam ser analisados. Por isso, toda exceção precisa ser justificada pelo hardware.

---

## Texto extraído e organizado por slide

### Slide 18 — Multiple Clocks per Register: Example #4

O slide mostra dois grupos de clocks chegando ao design por muxes diferentes:

- Um mux seleciona entre `CLK1` e `CLK2`, controlado por `SEL1`.
- Outro mux seleciona entre `CLK3` e `CLK4`, controlado por `SEL2`.

A figura mostra caminhos entre registradores internos que podem ser alimentados por diferentes clocks, dependendo da seleção dos muxes.

Comandos exibidos:

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
The delay of each path will be optimized for the worst of the logically possible timing conditions.
```

Tradução:

```text
O atraso de cada caminho será otimizado para o pior caso entre as condições de timing logicamente possíveis.
```

Observação lateral:

```text
You can alternatively apply two false paths.
```

Interpretação:

- `CLK1` e `CLK2` são alternativas lógicas no primeiro mux.
- `CLK3` e `CLK4` são alternativas lógicas no segundo mux.
- O DC NXT não deve analisar combinações impossíveis entre clocks mutuamente exclusivos.
- Mas ele ainda deve analisar o pior caso entre as combinações logicamente possíveis.

---

### Slide 19 — Multiple Clocks per Register: Example #5

Neste exemplo, os clocks são agrupados de outra maneira.

Comandos exibidos:

```tcl
create_clock -period ... [get_ports CLK1]
create_clock -period ... [get_ports CLK2]
create_clock -period ... [get_ports CLK3]
create_clock -period ... [get_ports CLK4]

set_clock_groups -logically_exclusive \
  -group "CLK1 CLK3" -group "CLK2 CLK4"
```

Mensagem do slide:

```text
The delay of each path will be optimized for the worst of the logically possible timing conditions.
```

Interpretação:

- Em vez de declarar `CLK1` exclusivo de `CLK2` e `CLK3` exclusivo de `CLK4`, o slide mostra dois grupos compostos.
- O grupo `"CLK1 CLK3"` é logicamente exclusivo do grupo `"CLK2 CLK4"`.
- Isso representa um cenário em que certas combinações de clocks pertencem ao mesmo modo lógico do design.

Esse formato é útil quando a seleção lógica não é independente em cada mux, mas ocorre por modo de operação. Por exemplo:

```text
Modo A: CLK1 e CLK3 ativos logicamente
Modo B: CLK2 e CLK4 ativos logicamente
```

---

### Slide 20 — Crosstalk Analysis in ICC II and PT-SI: Problem #6

O slide mostra um clock externo que chega ao design por uma porta `Clk`. Esse clock pode ser `CLK1` ou `CLK2`, selecionado fora do bloco atual.

Comandos exibidos:

```tcl
create_clock -period 3 -name CLK1 [get_ports Clk]
create_clock -period 4 -name CLK2 -add [get_ports Clk]

set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

O slide afirma:

```text
DC NXT delay optimization does the right thing.
```

Ou seja, para a otimização de delay dentro do DC NXT, a exclusividade lógica já evita análise de relações impossíveis.

Mas o problema aparece em SI/crosstalk:

```text
Crosstalk analysis (ICC II, PT-SI) assumes both clocks are available simultaneously
→ Pessimistic crosstalk-induced delta delays
```

Tradução:

```text
A análise de crosstalk no ICC II e PT-SI assume que ambos os clocks estão disponíveis simultaneamente,
gerando deltas de atraso induzidos por crosstalk pessimistas.
```

Pergunta do slide:

```text
Can we write constraints that will result in correct/accurate behavior in both DC NXT and PT-SI?
```

Resposta: sim, usando `-physically_exclusive`.

---

### Slide 21 — Crosstalk Analysis in ICC II and PT-SI: Solution #6

Solução exibida:

```tcl
create_clock -period 3 -name CLK1 [get_ports Clk]
create_clock -period 4 -name CLK2 -add [get_ports Clk]

set_clock_groups -physically_exclusive -group CLK1 -group CLK2
```

O slide explica:

```text
Delay optimization in DC NXT treats physically exclusive clocks exactly the same as logically exclusive clocks (or false paths).
```

Tradução:

```text
A otimização de delay no DC NXT trata clocks fisicamente exclusivos exatamente da mesma forma que clocks logicamente exclusivos ou false paths.
```

E também:

```text
SI analysis treats clocks as exclusive as well
→ Accurate crosstalk-induced delay analysis.
```

Interpretação:

- Para o DC NXT, `-physically_exclusive` e `-logically_exclusive` podem produzir efeito semelhante na otimização temporal.
- Para análise de SI/crosstalk, `-physically_exclusive` é mais preciso quando os clocks realmente não coexistem fisicamente.
- Isso evita crosstalk pessimista entre clocks que nunca estão presentes simultaneamente no mesmo ponto físico.

Pergunta lateral do slide:

```text
Why not ALWAYS use -physically_exclusive instead of -logically_exclusive?
```

Resposta conceitual:

- Porque clocks podem ser logicamente exclusivos em um caminho, mas ainda existir fisicamente ao mesmo tempo em outras redes do chip.
- Se eles podem coexistir fisicamente, eles ainda podem causar crosstalk.
- Nesse caso, usar `-physically_exclusive` seria otimista demais para SI.

---

### Slide 22 — Challenge Exercise

O desafio mostra um mux de clock instanciado, com dois clocks de entrada:

```text
CLK1
CLK2
```

e um seletor:

```text
SEL1
```

O mux alimenta registradores `rr1` e `rr2`. Também existem outros registradores no design que podem ser alimentados por clocks relacionados.

Comandos iniciais:

```tcl
create_clock -period 5 -name FST_CLK [get_ports CLK1]
create_clock -period 8 -name SLW_CLK [get_ports CLK2]
```

Texto do slide:

```text
We would like to constrain this design for correct and accurate timing analysis in both DC NXT and PT-SI.
```

Perguntas:

```text
Why can we not define CLK1 and CLK2 as exclusive clock groups?
```

```text
What trick can we use to define only the rr1 and rr2 clocks as physically exclusive?
```

Interpretação:

- `CLK1` e `CLK2` podem existir fisicamente ao mesmo tempo em outras partes do design.
- Portanto, não é correto declarar os clocks primários inteiros como fisicamente exclusivos.
- A exclusividade física vale apenas no ponto depois do mux, onde só um dos clocks pode aparecer.
- O “truque” é criar clocks gerados no output do mux e declarar esses clocks gerados como fisicamente exclusivos.

---

### Slide 23 — Challenge Exercise: Solution

Solução exibida:

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
- `MCLK1` e `MCLK2` são clocks gerados no output do mux `I_CLK_MUX/Z`.
- `-divide_by 1` indica que o clock gerado tem a mesma frequência do clock fonte.
- `-add` permite definir mais de um clock gerado no mesmo pino.
- Apenas os clocks muxados `MCLK1` e `MCLK2` são fisicamente exclusivos.
- Isso dá comportamento correto tanto para DC NXT quanto para PT-SI.

---

### Slide 24 — Asynchronous Clock Designs

O slide apresenta um design com dois clocks vindos de osciladores diferentes:

```text
CLKA = 333.33 MHz, from osc1
CLKB = 500 MHz, from osc2
```

Eles alimentam partes diferentes do design:

- `Des_A`
- `Des_B`
- `Des_C`

Pergunta do slide:

```text
What do you do if the design has asynchronous clock sources?
```

Interpretação:

- Clocks assíncronos não têm relação de fase garantida.
- Não há uma borda previsível de captura em relação à borda de lançamento.
- Portanto, não se deve tentar fechar timing comum entre eles como se fossem clocks síncronos.
- A travessia entre domínios precisa ser projetada com técnicas de CDC.

---

### Slide 25 — Synthesizing with Asynchronous Clocks

O slide explica como tratar clocks assíncronos durante a síntese.

Primeiro, é responsabilidade do projetista prevenir metastabilidade:

```text
It is your responsibility to design the logic in order to prevent metastability:
```

Exemplos:

- instanciar double-clocking;
- usar flip-flops resistentes à metastabilidade;
- usar dual-port FIFO;
- outras técnicas CDC.

Depois:

```text
Create clocks to constrain the paths within each clock domain.
```

Ou seja, cada domínio de clock ainda precisa ser bem restringido internamente.

E:

```text
Disable timing optimization along paths between asynchronous clock domains.
```

Motivo:

- evitar que o DC NXT desperdice runtime em caminhos não críticos;
- evitar que ele ignore a otimização de caminhos realmente críticos.

Texto destacado:

```text
prevents DC NXT from:
- Wasting run time on a non-critical timing paths
- Ignoring timing optimization of actual timing critical paths
```

---

### Slide 26 — Example: Asynchronous Design Constraints

Exemplo de constraints para clocks assíncronos:

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

- `CLKA` e `CLKB` continuam existindo e restringindo seus próprios domínios.
- Caminhos internos de `CLKA` são analisados.
- Caminhos internos de `CLKB` são analisados.
- Caminhos entre `CLKA` e `CLKB` são removidos da otimização de timing síncrona.

Ponto importante:

```text
set_clock_groups -asynchronous não projeta o sincronizador.
```

Ele apenas diz à ferramenta que não deve fechar timing comum entre domínios assíncronos. A segurança funcional da travessia depende do RTL.

---

### Slide 27 — Example Multi-Cycle Design

O slide mostra um design com registradores de entrada, um somador e um registrador de saída `C_reg`.

Pergunta:

```text
Clock period is 2 ns. The adder takes almost 6 clock cycles.
What happens when you apply create_clock -period 2 Clk?
```

Interpretação:

- Se apenas `create_clock -period 2` for aplicado, o DC NXT assume single-cycle timing.
- Portanto, ele tentará fazer o somador cumprir 2 ns.
- Mas o circuito foi projetado para permitir quase 6 ciclos.
- A constraint correta precisa declarar um caminho multi-cycle.

---

### Slide 28 — Default Single-Cycle Timing

O slide explica que todos os caminhos são restringidos por single-cycle timing por padrão.

Multiplicadores implícitos:

```tcl
set_multicycle_path -setup 1 <all paths>
set_multicycle_path -hold 0  <all paths>
```

Significado:

- setup capture edge ocorre 1 ciclo após a launch edge.
- hold capture edge é relativo à setup capture edge.
- Para o clock único, o hold ocorre uma borda antes da borda de setup.

O slide enfatiza:

```text
Increasing the setup multiplier without changing the hold multiplier moves both the setup and hold capture edges!
```

Tradução:

```text
Aumentar o multiplicador de setup sem mudar o multiplicador de hold move tanto a borda de captura de setup quanto a borda de captura de hold.
```

Pergunta:

```text
How do we constrain for 6 cycle timing?
```

---

### Slide 29 — Multi-Cycle Timing Constraint

Para permitir 6 ciclos ao caminho do somador:

```tcl
create_clock -period 2 [get_ports CLK]

set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

A figura mostra:

- launch em 0 ns;
- setup capture em 12 ns.

Como o período é 2 ns:

```text
6 ciclos × 2 ns = 12 ns
```

Pergunta do slide:

```text
Where does the hold check occur?
```

A resposta é que, se apenas o setup for mudado, o hold fica em uma posição indesejada.

---

### Slide 30 — Default Hold Check

Com apenas:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

o hold multiplier permanece:

```text
0
```

O slide afirma:

```text
The hold multiplier remains 0 → Hold capture edge is 10 ns!
```

Isso cria uma restrição de delay mínimo extremamente forte, como se o dado tivesse que não chegar antes de 10 ns.

O slide diz:

```text
Impossible to achieve and not required (no metastability concerns)!
```

E:

```text
Hold check can safely occur at 0ns
```

Pergunta:

```text
How do we move the hold check back 5 edges?
```

Resposta: usando `set_multicycle_path -hold 5`.

---

### Slide 31 — Setting the Proper Hold Constraint

Constraint correta:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]

set_multicycle_path -hold 5 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

A figura mostra o resultado desejado:

```text
Allow 0 - 12ns for ADDER
```

Interpretação:

- `-setup 6` move o check de setup para 6 ciclos.
- `-hold 5` move o check de hold de volta 5 bordas.
- O caminho passa a ter janela de 0 a 12 ns para o adder.
- Não é criada uma exigência falsa de delay mínimo gigante.

Regra prática importante:

```text
Para um multicycle setup N, normalmente o hold correspondente é N-1.
```

Neste caso:

```text
setup = 6
hold = 5
```

---

### Slide 32 — Another Example

O slide mostra dois caminhos possíveis:

- um caminho de um ciclo passando por `Add`;
- um caminho de dois ciclos passando por `U_Mult`.

Comandos:

```tcl
set_multicycle_path -setup 2 -through U_Mult/Out
set_multicycle_path -hold 1  -through U_Mult/Out
```

Interpretação:

- Apenas os caminhos que passam por `U_Mult/Out` são tratados como multi-cycle.
- O caminho pelo bloco `Add` continua single-cycle.
- `-through` restringe a exceção ao ponto desejado.
- Para setup 2, o hold correto é 1.

Este slide reforça a ideia de aplicar exceções de forma precisa, sem relaxar caminhos que não deveriam ser relaxados.

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

O relatório pode indicar problemas como:

```text
NONEXISTENT PATH
INVALID FROM OBJECT
```

Exemplo visível:

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

Depois, corrigir usando o objeto certo:

```tcl
set_multicycle_path -from FF1_reg/clocked_on
```

Interpretação:

- A exceção foi aplicada a um pino inadequado.
- O comando pode não gerar warning automaticamente.
- A exceção pode ser ignorada silenciosamente.
- Por isso, depois de aplicar exceções, sempre rodar:

```tcl
report_timing_requirements -ignored
```

---

## Aula didática desenvolvida

### 1. O grande perigo da parte B: otimizar relações de clock que não existem

Quando há muxes de clock, múltiplos clocks por registrador e clocks externos, o DC NXT pode enxergar mais combinações de timing do que realmente existem no hardware.

Por exemplo, se um mux seleciona entre `CLK1` e `CLK2`, a ferramenta pode inicialmente considerar:

```text
CLK1 -> CLK1
CLK1 -> CLK2
CLK2 -> CLK1
CLK2 -> CLK2
```

Mas, se o mux garante que só um clock está ativo naquele caminho, as relações cruzadas podem ser impossíveis:

```text
CLK1 -> CLK2
CLK2 -> CLK1
```

Se você não informar isso, o DC NXT pode gastar esforço tentando fechar timing impossível ou pessimista demais.

---

### 2. Quando usar `-logically_exclusive`

Use quando clocks são mutuamente exclusivos por lógica.

Exemplo típico:

```text
CLK1 e CLK2 entram em um mux.
Apenas um deles alimenta determinado caminho.
```

Constraint:

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

Efeito:

- remove checks entre clocks que não podem se relacionar logicamente;
- orienta a otimização para relações reais;
- equivale, em muitos casos, a aplicar false paths entre os grupos.

Atenção: isso não significa que os clocks não existem fisicamente ao mesmo tempo. Eles podem existir em redes diferentes e ainda causar crosstalk.

---

### 3. Quando usar `-physically_exclusive`

Use quando dois clocks não podem existir fisicamente no mesmo ponto ou rede.

Exemplo:

```text
A saída de um mux de clock pode carregar CLK1 ou CLK2, mas nunca os dois ao mesmo tempo.
```

Constraint:

```tcl
set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

Efeito:

- para timing lógico, funciona como exclusividade lógica;
- para SI/crosstalk, informa que os clocks não coexistem fisicamente;
- reduz pessimismo em análise de delta delay induzido por crosstalk.

Erro comum:

```text
usar -physically_exclusive em clocks primários inteiros só porque são muxados em um ponto.
```

Se `CLK1` e `CLK2` ainda coexistem em outras partes do chip, não declare os clocks primários como fisicamente exclusivos. Crie clocks gerados no output do mux e aplique exclusividade física neles.

---

### 4. O truque dos generated clocks no output do mux

Quando a exclusividade física só vale depois de um mux, faça:

```tcl
create_generated_clock -divide_by 1 -name MCLK1 \
  -source CLK1 [get_pins I_CLK_MUX/Z]

create_generated_clock -divide_by 1 -name MCLK2 -add \
  -source CLK2 [get_pins I_CLK_MUX/Z]

set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

Por que isso é melhor?

Porque você não está dizendo que `CLK1` e `CLK2` inteiros são exclusivos. Você está dizendo que as versões muxadas no pino `I_CLK_MUX/Z` são exclusivas.

Isso modela o hardware com precisão.

---

### 5. Clocks assíncronos: constraint não substitui CDC

Para clocks assíncronos:

```tcl
set_clock_groups -asynchronous -group CLKA -group CLKB
```

Essa constraint diz ao DC NXT:

```text
não tente fechar timing síncrono entre CLKA e CLKB.
```

Mas ela não evita metastabilidade.

A metastabilidade é evitada por arquitetura, por exemplo:

- sincronizador de dois flip-flops;
- FIFO dual-clock;
- protocolo handshake;
- gray code em ponteiros de FIFO;
- células especiais para sincronização.

A constraint só impede que a ferramenta otimize uma relação temporal que não existe.

---

### 6. Multi-cycle path: relaxar setup exige ajustar hold

Esta é uma das partes mais importantes da aula.

Por padrão:

```text
setup = 1 ciclo
hold = 0 ciclos
```

Se um caminho foi projetado para levar 6 ciclos, você pode aplicar:

```tcl
set_multicycle_path -setup 6 ...
```

Mas isso sozinho desloca também a referência do hold. O hold check pode ficar em uma borda errada, como 10 ns no exemplo do slide.

Por isso, para o caso comum:

```text
setup = N
hold = N - 1
```

Exemplo:

```tcl
set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]

set_multicycle_path -hold 5 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

Sem o `-hold 5`, você pode criar uma violação de hold artificial e impossível.

---

### 7. Use `-through` para não relaxar demais

No slide do multiplicador, apenas o caminho por `U_Mult/Out` é de dois ciclos:

```tcl
set_multicycle_path -setup 2 -through U_Mult/Out
set_multicycle_path -hold 1  -through U_Mult/Out
```

Isso preserva o caminho de um ciclo pelo `Add`.

Essa é a diferença entre uma exceção segura e uma perigosa.

Ruim:

```text
relaxar todos os caminhos entre dois registradores quando só um subcaminho é multi-cycle.
```

Melhor:

```text
usar -through para atingir apenas o caminho que realmente passa pela lógica multi-cycle.
```

---

### 8. Exceções inválidas podem ser silenciosas

O último slide é um alerta forte.

Você pode escrever:

```tcl
set_multicycle_path -from FF1_reg/Q
```

mas se `FF1_reg/Q` não for um objeto válido para aquela exceção, ou se no estágio atual o nome correto for outro, a ferramenta pode ignorar a exceção sem warning evidente.

Por isso, sempre usar:

```tcl
report_timing_requirements -ignored
```

Esse comando mostra se alguma exceção não pegou.

Se houver erro, remova a exceção antiga:

```tcl
reset_path -from FF1_reg/Q
```

ou:

```tcl
set_multicycle_path -reset_path -from FF1_reg/Q
```

e reaplique usando o objeto correto.

---

## Conceitos difíceis explicados em profundidade

### Exclusividade lógica

Dois clocks são logicamente exclusivos quando o funcionamento lógico do circuito impede que eles ativem o mesmo caminho ao mesmo tempo.

Exemplo:

```text
mux escolhe CLK1 ou CLK2 para um conjunto de registradores.
```

Mesmo que `CLK1` e `CLK2` existam fisicamente no chip ao mesmo tempo, a lógica impede certas relações de timing.

Constraint:

```tcl
set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

---

### Exclusividade física

Dois clocks são fisicamente exclusivos quando não podem estar presentes simultaneamente no mesmo ponto físico.

Exemplo:

```text
output de um mux de clock só pode carregar CLK1 ou CLK2.
```

Constraint:

```tcl
set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

Isso é relevante para crosstalk porque, se dois sinais nunca coexistem fisicamente, eles não devem ser considerados agressores simultâneos.

---

### Diferença entre exclusividade lógica e física

| Caso | Existe simultaneamente em redes diferentes? | Relação temporal impossível? | Pode causar crosstalk? | Constraint típica |
|---|---:|---:|---:|---|
| Logicamente exclusivo | Sim | Sim | Sim, se fisicamente coexistem | `-logically_exclusive` |
| Fisicamente exclusivo | Não, no ponto analisado | Sim | Não, naquele ponto | `-physically_exclusive` |
| Assíncrono | Sim | Relação de fase desconhecida | Sim | `-asynchronous` |

---

### Clocks assíncronos

Clocks assíncronos não têm relação de fase previsível. A ferramenta não sabe qual borda captura qual lançamento de forma determinística.

Constraint:

```tcl
set_clock_groups -asynchronous -group CLKA -group CLKB
```

Isso corta análise temporal entre domínios, mas não resolve CDC.

---

### CDC e metastabilidade

CDC significa **Clock Domain Crossing**.

Se um sinal sai de um domínio e entra em outro sem sincronização, ele pode violar setup/hold do registrador de destino e entrar em metastabilidade.

A constraint de clock assíncrono apenas evita análise de timing síncrona. A segurança vem do circuito:

```text
2 flip-flops em série
FIFO dual-clock
handshake
gray counters
```

---

### Multi-cycle path

Multi-cycle path é um caminho que foi projetado para levar mais de um ciclo de clock.

Exemplo:

```text
adder precisa de 6 ciclos
```

Constraint:

```tcl
set_multicycle_path -setup 6 ...
set_multicycle_path -hold 5 ...
```

Sem isso, a ferramenta tenta fechar em um ciclo.

---

### Por que hold = setup - 1 em multicycle

Quando você move o setup capture edge para N ciclos depois, o hold check default também se desloca de forma indesejada. Para manter o hold check perto do lançamento original, move-se o hold de volta N-1 bordas.

Por isso:

```text
setup 2 → hold 1
setup 6 → hold 5
```

Essa é uma regra prática muito cobrada.

---

### Invalid exceptions

Exceções inválidas são constraints que parecem existir no script, mas não têm efeito real porque:

- o objeto não existe;
- o caminho não existe;
- o pino está errado;
- o nome mudou após mapeamento;
- a exceção não se aplica ao tipo de path.

Verificação:

```tcl
report_timing_requirements -ignored
```

---

## Figuras, diagramas e exemplos importantes

### Multiple Clocks per Register — Examples #4 e #5

Mostram que a exclusividade lógica pode ser declarada entre clocks individuais ou entre grupos compostos. O importante é modelar os modos lógicos reais do design.

### Crosstalk Problem #6

Mostra que `-logically_exclusive` é suficiente para otimização de delay no DC NXT, mas pode ser insuficiente para análise de SI em ICC II/PT-SI, porque as ferramentas podem assumir clocks simultâneos e gerar pessimismo de crosstalk.

### Crosstalk Solution #6

Mostra o uso de:

```tcl
set_clock_groups -physically_exclusive
```

quando os clocks realmente não coexistem fisicamente.

### Challenge Exercise

Mostra por que não se deve aplicar exclusividade física diretamente nos clocks primários quando a exclusividade só existe depois do mux.

### Challenge Solution

Mostra a técnica correta:

```text
criar generated clocks no output do mux
declarar esses generated clocks como fisicamente exclusivos
```

### Asynchronous Clock Designs

Mostra dois clocks vindos de osciladores diferentes. A principal mensagem é que CDC é responsabilidade do design, e a constraint apenas corta timing entre domínios.

### Multi-Cycle Design

Mostra um somador que leva quase 6 ciclos, explicando por que single-cycle timing não serve.

### Default Hold Check

Mostra a armadilha de aplicar apenas `-setup 6`: o hold check fica em 10 ns, criando uma restrição falsa.

### Always Check for Invalid Exceptions

Mostra que exceções inválidas podem ser ignoradas sem warning, exigindo verificação explícita.

---

## Pontos de prova e revisão

1. Clocks muxados não são inferidos automaticamente como exclusivos.
2. Para clocks logicamente exclusivos:
   ```tcl
   set_clock_groups -logically_exclusive -group CLK1 -group CLK2
   ```
3. Dois false paths em sentidos opostos podem representar exclusividade lógica.
4. Para grupos compostos:
   ```tcl
   set_clock_groups -logically_exclusive \
     -group "CLK1 CLK3" -group "CLK2 CLK4"
   ```
5. `-logically_exclusive` ajuda o DC NXT a evitar relações temporais impossíveis.
6. `-logically_exclusive` pode não ser suficiente para análise de SI/crosstalk.
7. Para clocks fisicamente exclusivos:
   ```tcl
   set_clock_groups -physically_exclusive -group CLK1 -group CLK2
   ```
8. `-physically_exclusive` também informa PT-SI/ICC II que os clocks não coexistem fisicamente.
9. Não usar `-physically_exclusive` se os clocks podem coexistir em redes diferentes.
10. Quando exclusividade física só existe depois de um mux, criar generated clocks no output do mux.
11. Exemplo:
    ```tcl
    create_generated_clock -divide_by 1 -name MCLK1 \
      -source CLK1 [get_pins I_CLK_MUX/Z]
    ```
12. Para clocks assíncronos:
    ```tcl
    set_clock_groups -asynchronous -group CLKA -group CLKB
    ```
13. CDC correto é responsabilidade do projetista.
14. `set_clock_groups -asynchronous` não evita metastabilidade.
15. Por padrão, timing é single-cycle:
    ```tcl
    set_multicycle_path -setup 1 <all paths>
    set_multicycle_path -hold 0 <all paths>
    ```
16. Para caminho de 6 ciclos:
    ```tcl
    set_multicycle_path -setup 6 ...
    set_multicycle_path -hold 5 ...
    ```
17. Regra prática:
    ```text
    hold = setup - 1
    ```
18. Para caminho de 2 ciclos:
    ```tcl
    set_multicycle_path -setup 2 ...
    set_multicycle_path -hold 1 ...
    ```
19. Use `-through` para limitar multicycle a caminhos específicos.
20. Exceções inválidas podem não gerar warning.
21. Sempre verificar:
    ```tcl
    report_timing_requirements -ignored
    ```
22. Para remover exceção errada:
    ```tcl
    reset_path -from ...
    ```
    ou:
    ```tcl
    set_multicycle_path -reset_path -from ...
    ```

---

## Script consolidado da parte B

### Clocks logicamente exclusivos simples

```tcl
create_clock -period ... [get_ports CLK1]
create_clock -period ... [get_ports CLK2]

set_clock_groups -logically_exclusive -group CLK1 -group CLK2
```

### Grupos logicamente exclusivos compostos

```tcl
create_clock -period ... [get_ports CLK1]
create_clock -period ... [get_ports CLK2]
create_clock -period ... [get_ports CLK3]
create_clock -period ... [get_ports CLK4]

set_clock_groups -logically_exclusive \
  -group "CLK1 CLK3" -group "CLK2 CLK4"
```

### Clocks fisicamente exclusivos no mesmo port

```tcl
create_clock -period 3 -name CLK1 [get_ports Clk]
create_clock -period 4 -name CLK2 -add [get_ports Clk]

set_clock_groups -physically_exclusive -group CLK1 -group CLK2
```

### Generated clocks no output de mux

```tcl
create_clock -period 5 -name FST_CLK [get_ports CLK1]
create_clock -period 8 -name SLW_CLK [get_ports CLK2]

create_generated_clock -divide_by 1 -name MCLK1 \
  -source CLK1 [get_pins I_CLK_MUX/Z]

create_generated_clock -divide_by 1 -name MCLK2 -add \
  -source CLK2 [get_pins I_CLK_MUX/Z]

set_clock_groups -physically_exclusive -group MCLK1 -group MCLK2
```

### Clocks assíncronos

```tcl
current_design TOP

create_clock -period 3 [get_ports CLKA]
create_clock -period 2 [get_ports CLKB]

set_clock_groups -asynchronous -group CLKA -group CLKB

compile_ultra
```

### Multi-cycle path de 6 ciclos

```tcl
create_clock -period 2 [get_ports CLK]

set_multicycle_path -setup 6 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]

set_multicycle_path -hold 5 \
  -from {A_reg[*] B_reg[*]} -to C_reg[*]
```

### Multi-cycle path específico por `-through`

```tcl
set_multicycle_path -setup 2 -through U_Mult/Out
set_multicycle_path -hold 1  -through U_Mult/Out
```

### Verificar exceções ignoradas

```tcl
report_timing_requirements -ignored
```

---

## Relação com projeto/laboratório

Esta parte é essencial para qualquer arquivo real de constraints, porque é aqui que os erros mais difíceis de timing costumam aparecer.

Em um laboratório, quando surgem clocks muxados ou múltiplos clocks no mesmo registrador, é comum o relatório de timing mostrar relações que parecem estranhas. Muitas vezes a ferramenta está analisando combinações que o hardware não permite. A correção é declarar corretamente a exclusividade lógica ou física.

Em projetos reais, a diferença entre estas três linhas é crítica:

```tcl
set_clock_groups -logically_exclusive ...
set_clock_groups -physically_exclusive ...
set_clock_groups -asynchronous ...
```

Elas não significam a mesma coisa.

Também é comum errar `set_multicycle_path`, aplicando apenas o setup e esquecendo o hold. O curso deixa claro que isso cria um hold check artificial e impossível. Por isso, sempre lembrar:

```text
setup N → hold N-1
```

Por fim, exceções precisam ser auditadas. Um script pode conter uma exceção bonita, mas sem efeito real se o objeto estiver errado. A verificação obrigatória é:

```tcl
report_timing_requirements -ignored
```

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides 18-33.
- [x] Não avancei para o próximo arquivo.
- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 046 — 09 SPG Flow, Congestion, Layout GUI**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\09 SPG Flow, Congestion, Layout GUI.docx
```

Faixa:

```text
slides 1-24
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\09 SPG Flow, Congestion, Layout GUI.md
```
