# 08 RTL and Netlist Interpretation — parte B

## Controle do bloco

- **Bloco:** 070
- **Curso:** 09 Formality Foundation
- **Aula:** 08 RTL and Netlist Interpretation — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\08 RTL and Netlist Interpretation.docx`
- **Continuação:** mesmo anexo usado na parte A
- **Faixa processada conforme roteiro:** slides 22-42
- **Começa em:** `Black-boxes`
- **Termina em:** `Unit Summary`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\08 RTL and Netlist Interpretation_parte_B.md
```

---

## Resumo executivo

Esta parte B continua a aula de **RTL and Netlist Interpretation** a partir dos problemas de interpretação e setup que aparecem depois da leitura/elaboração do RTL. A parte A focou em **interpretação de RTL**, pragmas `full_case`/`parallel_case`, `X` como don't care e modos `verification_passing_mode`. A parte B aprofunda os outros problemas comuns de setup que aparecem em Formality:

1. **Black boxes**  
   Partes do design sem lógica interna, como memórias, blocos analógicos, módulos interface-only ou módulos não resolvidos. Elas não são verificadas internamente, mas seus pinos precisam casar entre referência e implementação.

2. **Unresolved modules transformados em black boxes**  
   Quando um módulo faltante é tratado como black box no lado de referência, mas existe sintetizado no lado de implementação, a comparação pode falhar porque os pinos/saídas da black box não correspondem à lógica real.

3. **Undriven signals**  
   Sinais sem driver podem ser tratados de formas diferentes por simulação, síntese e Formality. Por padrão, o Formality é conservador e usa `BINARY:X`. Para se comportar como síntese, pode-se usar a interpretação `synthesis`, que é ativada por `synopsys_auto_setup true`.

4. **Multiply driven nets**  
   Nets com múltiplos drivers aparecem como pontos especiais do tipo `BBNet`. Elas podem ser esperadas em alguns contextos, mas nets multidriven inesperadas podem indicar erro funcional ou problema de modelagem.

5. **DC RTL Name Interpretation**  
   O SVF referencia objetos por nome. Portanto, DC e Formality precisam interpretar nomes de objetos RTL de forma compatível. Variáveis de naming, como `template_naming_style`, são registradas no `guide_environment` do SVF.

6. **Resumo do Auto Setup Mode**  
   O `synopsys_auto_setup true` ajusta o Formality para se comportar mais como síntese, incluindo pragmas de case, undriven signals e outputs diretamente sem driver.

A mensagem final da unidade é simples e muito útil: **muitos problemas de equivalence checking não começam no `verify`; eles aparecem já em `report_setup_status`, `report_black_boxes`, `report_hdlin_mismatches`, Match Summary, Guidance Summary e relatórios de unmatched points.**

---

## Texto extraído e organizado por slide

### Slide 22 — Black-boxes

Figura do fluxo:

```text
RTL
↓
Read and elaborate RTL
↓
First Compile
↓
Test Insertion
↓
Incremental Compile
↓
Change Names
↓
Final Netlist
```

Tópicos destacados:

```text
X as don't care here
DC Hardware interpretation of RTL
DC Name interpretation of RTL
Black-boxes: How does Formality treat parts of the design with no logic function
Undriven signals
Multiply driven signals
```

Interpretação:

A seção muda do tema `X` para **black boxes**.

Uma black box é uma parte do design cuja interface é conhecida, mas cuja lógica interna não está disponível ou não será verificada. Em Formality, isso é comum para:

- memórias;
- macros;
- blocos analógicos;
- IPs sem modelo lógico;
- módulos ainda não resolvidos;
- células de biblioteca com portas e timing arcs, mas sem função lógica completa.

O ponto principal é que o Formality não verifica a lógica interna da black box. Ele verifica se a black box aparece de forma coerente nos dois lados e se seus pinos/saídas estão casados corretamente.

---

### Slide 23 — Black-Boxes

Texto extraído:

- A Black-Box is a module or entity which contains no logic.
- These are modules that are not verified:
  - Analog circuitry.
  - Memory devices.
- Need to match up between reference and implementation.

Figura:

O slide mostra:

```text
Top_ref: Mod_a → Ram (Black-Box)
Top_imp: Mod_a → Ram (Black-Box)
```

Interpretação:

Black boxes não são um problema por si só. Elas são esperadas quando o bloco não deve ser verificado internamente.

Exemplo:

```text
Referência tem RAM como black box.
Implementação também tem RAM como black box.
Pinos da RAM casam.
```

Nesse caso, Formality consegue verificar a lógica ao redor. A RAM é tratada como uma caixa com entradas e saídas, e as saídas da black box podem alimentar logic cones.

O requisito é:

```text
black boxes precisam casar entre Ref e Impl
```

Se uma RAM é black box na referência, mas aparece como lógica real na implementação, ou se os pinos não casam, surgem problemas de match e verify.

---

### Slide 24 — How Are Black-Boxes Created?

Texto extraído:

- Modules read in that have only I/O port declarations.
- Library `.db` cells that contain port and timing arcs only.
  - Typically a memory.
- Missing a piece of design when using this variable:

```tcl
set hdlin_unresolved_modules black_box
```

  - Default setting is error, i.e. an unresolved module will prevent `set_top` completing successfully.
- Usage of other variable when reading in designs:

```tcl
set hdlin_interface_only "SRAM* dram16x8"
```

  - Any module beginning with `SRAM` and the `dram16x8` module will become a black-box.
- Declare a sub-design as a black-box:

```tcl
set_black_box designID
```

Interpretação:

O slide mostra várias formas de criar black boxes.

#### 1. Módulo com apenas declaração de portas

Exemplo conceitual:

```verilog
module myram(input clk, input [7:0] addr, output [31:0] data);
endmodule
```

Sem lógica interna, o módulo vira black box.

#### 2. Célula `.db` com portas e timing arcs

Memórias e macros muitas vezes têm informação de timing, mas não uma função lógica completa para equivalência.

#### 3. Módulo não resolvido

Por padrão, se um módulo não é encontrado, `set_top` falha. Mas é possível dizer:

```tcl
set hdlin_unresolved_modules black_box
```

Com isso, módulos não resolvidos viram black boxes. É útil em alguns fluxos, mas perigoso se estiver escondendo um arquivo RTL faltante.

#### 4. Interface-only por padrão de nome

```tcl
set hdlin_interface_only "SRAM* dram16x8"
```

Tudo que começa com `SRAM` e o módulo `dram16x8` vira black box.

#### 5. Declarar subdesign explicitamente como black box

```tcl
set_black_box designID
```

---

### Slide 25 — Do I have the black boxes I was expecting?

Texto extraído:

- Black-boxes are obviously visible at the read stage.
- Command `report_black_boxes` shows list of black-boxes.
- Command `report_setup_status` contains some good summary information related to black-boxes.
- After match stage, command:

```tcl
report_unmatched_points -point_type bbox
```

will report unmatched black-boxes.

Interpretação:

Black boxes aparecem cedo. Não é necessário esperar o verify para descobrir se existem black boxes erradas.

Comandos principais:

```tcl
report_black_boxes
report_setup_status
report_unmatched_points -point_type bbox
```

Uso recomendado:

1. Após leitura e `set_top`, rode:

```tcl
report_black_boxes
```

2. Confira se a lista bate com o esperado.

3. Rode:

```tcl
report_setup_status
```

para ver resumo.

4. Após match, confira se há black boxes unmatched:

```tcl
report_unmatched_points -point_type bbox
```

Se você esperava uma RAM como black box, tudo bem. Se aparece um bloco RTL inteiro como black box por falta de arquivo, isso é problema grave.

---

### Slide 26 — Effects of black boxes: match, verify

Texto extraído das caixas:

- A black box, say RAM, will be in both Ref and Impl.
- Will have a number of output pins which will be the input of logic cones.
- No problem during match and verify if pins match.

Figura:

A RAM black box possui vários pinos `BB`. Esses pinos alimentam logic cones em Ref e Impl.

Interpretação:

Uma black box correta funciona como uma fronteira de comparação.

Os outputs da RAM black box são tratados como entradas para os cones lógicos que vêm depois. Se os pinos casam entre referência e implementação, o Formality pode verificar os cones downstream.

Ou seja:

```text
não verifico a RAM internamente
mas verifico se o que depende das saídas da RAM é equivalente
```

Isso é aceitável quando a RAM é intencionalmente abstrata.

---

### Slide 27 — Effects of black boxes: match, verify — caso problemático

Figura:

Referência:

```text
Unresolved RTL module fred (Black-Box)
```

Implementação:

```text
Synthesized module fred
com a_reg, b_reg, z_reg
```

Caixas:

```text
Unmatched
Matched. Verification Fails
```

Interpretação:

Este é o caso perigoso.

Se, na referência, o módulo `fred` não foi encontrado e virou black box, mas na implementação ele está sintetizado como lógica real, a comparação fica inconsistente:

```text
Ref: fred é black box, sem lógica interna.
Impl: fred é lógica real com registradores e gates.
```

Alguns pontos podem casar superficialmente, mas a verificação falha porque o Formality está comparando uma abstração sem função com lógica implementada.

Esse caso geralmente indica:

- RTL faltando no container de referência;
- `hdlin_unresolved_modules black_box` usado de forma perigosa;
- lista de arquivos incompleta;
- biblioteca/IP não carregado corretamente;
- referência e implementação em níveis de abstração incompatíveis.

---

### Slide 28 — Summary: Black-box issues

Figura do fluxo com caixas:

- No estágio **Check reading**:
  - `report_black_box`
  - `report_setup_status`
- No **Match Summary**:
  - Unmatched black-box pins.
- No **Verify**:
  - Points driven by unmatched output BBPins fail.
  - `analyze_points` should diagnose issue.

Interpretação:

Problemas de black box aparecem em vários estágios.

#### Read stage

```tcl
report_black_boxes
report_setup_status
```

Aqui você descobre se existem black boxes inesperadas.

#### Match stage

Unmatched black-box pins aparecem no Match Summary ou em:

```tcl
report_unmatched_points -point_type bbox
```

#### Verify stage

Se saídas de black boxes unmatched alimentam logic cones, pontos downstream podem falhar.

#### Debug stage

```tcl
analyze_points
```

deve ajudar a diagnosticar que a causa vem de black-box pins.

Mensagem prática:

```text
Black-box issue deve ser detectado cedo. Se você só descobrir no verify, já perdeu tempo.
```

---

### Slide 29 — Interpretation of undriven signals

Texto extraído:

- Variable:

```tcl
verification_set_undriven_signals
```

- Default setting is:

```text
BINARY:X
```

- Clearly identifies when undriven signals impact implemented functionality.
- If undriven reference signal can control downstream compare points, the verification will fail.
- To match Design Compiler, change setting to `synthesis`, similar to `0:X`, instead:
  - Still conservative: Formality will fail verification if undriven signal in the implementation design affects compare points.
- To ignore undriven failures on output ports, common for test output ports:

```tcl
set_dont_verify -directly_undriven_output
```

Interpretação:

Sinais sem driver são outro problema clássico.

Por padrão, o Formality usa uma interpretação conservadora:

```tcl
verification_set_undriven_signals = BINARY:X
```

Isso significa que um sinal sem driver pode revelar diferenças importantes. Se um undriven signal da referência controla compare points downstream, a verificação falha.

Para se comportar mais como o Design Compiler, pode-se usar:

```tcl
set verification_set_undriven_signals synthesis
```

Isso é similar a tratar undriven em referência de forma compatível com síntese, mas ainda é conservador: se o sinal sem driver estiver na implementação e afetar compare points, Formality falha.

Para outputs diretamente sem driver — comum em test output ports — pode-se usar:

```tcl
set_dont_verify -directly_undriven_output
```

---

### Slide 30 — Failing verifications due to undriven signals

Texto extraído:

- **Failures Due to Undriven Signals**
  - Look for clues in the transcript.

Mensagem de transcript:

```text
ATTENTION: 5 failing compare points have unmatched undriven signals in their
reference fan-in. To report such failing points, use
"report_failing_points -inputs unmatched -inputs undriven".
```

Comando:

```tcl
report_failing_points -inputs undriven
```

Texto:

- indicates that undriven signals are affecting the reference logic cone.

Mensagem exemplo:

```text
This failure may be due to an undriven signal in the reference design;
use "report_unmatched_points <compare-point> -status undriven" to see
a report of unmatched undriven points in the fan-in of a given compare point.
```

- See `formality.log` file for complete list of undriven signal names.

Interpretação:

O Formality dá pistas no transcript quando undriven signals causam falha.

Comandos úteis:

```tcl
report_failing_points -inputs unmatched -inputs undriven
report_failing_points -inputs undriven
report_unmatched_points <compare-point> -status undriven
```

O arquivo `formality.log` também contém a lista completa dos sinais sem driver.

Mensagem prática:

```text
Se o transcript fala em undriven fan-in, não comece abrindo cone aleatório.
Use os relatórios específicos para undriven signals.
```

---

### Slide 31 — Undriven Nets in Pattern Window

Texto extraído:

- Failing Pattern Window shows undriven signal of type `Und` and names with the text:

```text
(originally undriven)
```

Figura:

A Pattern Window mostra um sinal `b` marcado como:

```text
b (Originally undriven)
```

e tipo:

```text
Und
```

Interpretação:

Na Pattern Window, sinais sem driver aparecem explicitamente.

A marcação:

```text
(originally undriven)
```

é uma pista visual de que a falha não veio de lógica funcional comum, mas de um sinal que não recebeu driver no design.

Tipo:

```text
Und
```

indica undriven.

Se esse sinal afeta o compare point, o Formality pode produzir counterexample mostrando como o valor livre/indefinido altera o resultado.

---

### Slide 32 — Undriven Nets in Cone Schematics

Figura:

O cone schematic mostra um bloco/cut net com texto indicando:

```text
b:CUT_NET
net_driver
```

e uma marcação vermelha/alaranjada para sinal originalmente undriven.

Interpretação:

No cone schematic, nets sem driver também aparecem marcadas. Isso permite localizar visualmente onde o undriven entra no cone.

Fluxo de debug:

1. Transcript acusa undriven.
2. `report_failing_points -inputs undriven` lista pontos.
3. Pattern Window mostra `Und`.
4. Cone schematic mostra onde o sinal sem driver entra.
5. Corrija RTL/setup ou ajuste interpretação se for intencional.

---

### Slide 33 — Undriven signals: Example

Código da referência, reconstruído:

```verilog
module fred (a, clk, z);
input a, clk;
output reg z;
reg ar;
wire b;

always @(posedge clk)
begin
  z <= ar | b;
  ar <= a;
end

endmodule
```

Código da implementação `fred_c0`:

```verilog
module fred_c0 (a, clk, z);
input a, clk;
output reg z;
reg ar;
wire b;

assign b = 1'b0;

always @(posedge clk)
begin
  z <= ar | b;
  ar <= a;
end

endmodule
```

Texto:

```text
In fred b is undriven. In fred_c0 b is 1'b0.
```

Script:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred_c0.v
set_top fred

verify
# This verification will fail
```

Destaque:

```text
Example with default setting of verification_set_undriven_signals
```

Interpretação:

Na referência, `b` é declarado, mas não recebe valor:

```verilog
wire b;
```

Na implementação, `b` é explicitamente `0`:

```verilog
assign b = 1'b0;
```

O Design Compiler pode tratar o undriven de uma forma parecida com `0`/synthesis, mas o Formality por padrão quer evidenciar que há um sinal sem driver influenciando a lógica.

Por isso, com o default:

```text
verification_set_undriven_signals = BINARY:X
```

a verificação falha.

---

### Slide 34 — Undriven signals: Example — sinais em vários lugares

Texto da caixa:

```text
Formality flags undriven signals information in many places.
```

A figura mostra:

- transcript com warning de undriven nets;
- Match/Verify results;
- análise de failing points;
- Pattern Window com `b (Originally undriven)`.

Interpretação:

O slide reforça que undriven signals não são difíceis de encontrar se você sabe onde olhar. Eles aparecem em:

- transcript;
- `formality.log`;
- Match/Verify reports;
- `report_failing_points`;
- Pattern Window;
- Cone schematic.

A lição é a mesma de Efficient Debugging: o sintoma aparece em vários níveis. Não depure manualmente antes de ler os resumos.

---

### Slide 35 — Multiple driven nets

Código extraído:

```verilog
module fred_m (a, b, z);
input a, b;
output z;

assign z = a;
assign z = b;

endmodule
```

Texto:

- Multiply driven nets are, as the name implies, driven from multiple sources.
  - Here `z` is driven from both `a` and `b` ports.
- They will appear as `BBNet` compare points.
- Unexpected multidriven nets may indicate a problem and result in verification failure.

Interpretação:

Uma net multidriven é uma net com mais de uma fonte dirigindo seu valor.

No exemplo:

```verilog
assign z = a;
assign z = b;
```

O sinal `z` é dirigido por `a` e por `b`.

Em hardware real, múltiplos drivers podem representar:

- tri-state bus;
- wired logic;
- erro de RTL;
- conflito de drivers;
- modelagem inadequada.

No Formality, aparecem como compare points do tipo:

```text
BBNet
```

Se forem inesperados, podem causar falha.

---

### Slide 36 — Multiple driven nets: Example

Comandos mostrados:

```tcl
report_setup -design_info
report_multidriven_nets -ref
```

A figura também mostra:

```tcl
report_matched_points -point_type bbox_net
```

Texto:

- Note: lots of good summary information.
- Details.

Saída de exemplo:

```text
1 Multiply driven net:

Net r:/WORK/fred_m/a
Drivers (2)
  r:/WORK/fred_m/b/b
  r:/WORK/fred_m/a/a
```

Interpretação:

O Formality fornece relatório de nets multidriven.

Comandos importantes:

```tcl
report_setup_status -design_info
report_multidriven_nets -ref
report_multidriven_nets -impl
report_matched_points -point_type bbox_net
```

A saída mostra:

- qual net é multidriven;
- quantos drivers;
- quais são os drivers.

Isso ajuda a separar multidriven esperado de problema real.

---

### Slide 37 — Multiple driven nets: Example — verificação

Texto extraído:

- Two points are verified: the `BBNet` and the output port.

Tabela de verify:

```text
Matched Compare Points

Passing (equivalent):
  BBNet 1
  Port 1
  TOTAL 2

Failing:
  TOTAL 0
```

Interpretação:

No exemplo, há dois pontos de verificação:

1. o ponto especial `BBNet`;
2. o output port.

Se referência e implementação têm o mesmo comportamento multidriven, ambos podem passar.

Isso mostra que multidriven nets não são automaticamente erro. Elas são uma estrutura especial que precisa ser reconhecida e casada corretamente.

---

### Slide 38 — DC RTL Name Interpretation

Figura do fluxo:

```text
RTL
↓
Read and elaborate RTL
↓
First Compile
...
```

Destaques:

```text
DC Hardware interpretation of RTL
DC Name interpretation of RTL
```

Interpretação:

Depois de hardware interpretation, black boxes, undriven e multidriven, a aula entra em **naming interpretation**.

O ponto é que DC e Formality precisam dar nomes compatíveis aos objetos iniciais do RTL:

- designs;
- registradores;
- operadores de datapath;
- estruturas geradas pela elaboração.

Se os nomes forem diferentes, o SVF pode apontar para objetos que o Formality não encontra. Isso causa:

- rejected guidance;
- problemas de match;
- unmatched compare points;
- necessidade de setup manual.

---

### Slide 39 — RTL naming interpretation

Texto extraído:

- Common RTL naming interpretation is important between DC and FM.
  - Helps matching.
  - SVF refers to objects by name, designs, registers, datapath objects.
- There are a number of variables in DC that change how objects are named, e.g.:

```tcl
template_naming_style
```

- These variables are passed in SVF.
- In the absence of this SVF, some manual setup may be required in Formality.

Interpretação:

O SVF não contém apenas transformações funcionais. Ele também carrega informações de ambiente, incluindo variáveis que afetam nomes.

Exemplo:

```tcl
template_naming_style
```

Se o DC usa uma convenção de nomes para operadores gerados e o Formality usa outra, objetos como multiplicadores, adders e registradores podem ter nomes diferentes.

Com SVF correto, essas variáveis são passadas para Formality. Sem SVF, talvez seja necessário configurar manualmente.

Mensagem-chave:

```text
SVF correto evita problemas de naming.
```

---

### Slide 40 — Naming variables in `guide_environment`

Figura:

Mostra um bloco SVF:

```text
guide_environment {
  ...
}
```

Várias variáveis são apontadas por setas, incluindo nomes relacionados a:

- `bus_dimension_separator_style`
- `bus_extraction_style`
- `bus_multiple_separator_style`
- `bus_naming_style`
- `hdlin_enable_upf_compatible_naming`
- `hdlin_generate_naming_style`
- `template_naming_style`
- `template_parameter_style`
- `template_separator_style`

Caixa:

```text
Variables that affect the names of RTL objects
```

Interpretação:

O `guide_environment` registra variáveis do ambiente do DC que afetam a nomeação dos objetos RTL.

Isso explica por que o SVF é importante mesmo antes das transformações de compile. Ele não registra apenas “otimizações”; ele também registra o ambiente de leitura/elaboração.

Se essas variáveis não chegam ao Formality, o matching pode ficar pior, porque o Formality pode gerar nomes iniciais diferentes dos nomes esperados pelo SVF.

---

### Slide 41 — Recall: What Auto Setup Mode Does

Texto extraído:

- Now have explanation of most of variables changed by:

```tcl
synopsys_auto_setup true
```

- Runs the following commands by default, and more:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
set verification_set_undriven_signals synthesis
set verification_verify_directly_undriven_output false
```

Caixa:

```text
In summary: Behave like synthesis
```

Interpretação:

Este slide conecta tudo.

`set synopsys_auto_setup true` faz o Formality se comportar mais como síntese em pontos críticos:

1. Aceita `parallel_case` como DC:

```tcl
set hdlin_ignore_parallel_case false
```

2. Aceita `full_case` como DC:

```tcl
set hdlin_ignore_full_case false
```

3. Trata undriven signals como síntese:

```tcl
set verification_set_undriven_signals synthesis
```

4. Não verifica diretamente outputs undriven:

```tcl
set verification_verify_directly_undriven_output false
```

A frase final resume:

```text
Behave like synthesis
```

Ou seja: Formality é ajustado para interpretar o design de forma compatível com o Design Compiler.

---

### Slide 42 — Unit Summary

Texto extraído:

- **RTL interpretation**
  - DC and FM readers are independent so can detect bugs in DC RTL reader.
  - `synopsys_auto_setup true` sets interpretation as synthesis.
- **Other setup issues**
  - Black boxes, undriven and multidriven nets.
- **Good summary commands**

```tcl
report_hdlin_mismatches
report_setup_status
```

Interpretação:

O resumo final fecha a unidade.

Pontos principais:

1. DC e FM têm leitores independentes.
2. Isso ajuda a detectar bugs ou divergências no RTL reader do DC.
3. `synopsys_auto_setup true` alinha Formality à interpretação de síntese.
4. Problemas comuns de setup incluem:
   - black boxes;
   - undriven signals;
   - multidriven nets.
5. Bons comandos de resumo:

```tcl
report_hdlin_mismatches
report_setup_status
```

Esses comandos devem ser usados cedo, antes de gastar tempo com debug manual de failing points.

---

## Aula didática desenvolvida

### 1. Black boxes: quando são corretas e quando são perigosas

Black box correta:

```text
Ref: RAM black box
Impl: RAM black box
Pinos casam
```

Nesse caso, Formality não verifica a RAM internamente, mas verifica a lógica ao redor. Isso é normal.

Black box perigosa:

```text
Ref: módulo fred virou black box porque RTL faltou
Impl: módulo fred está sintetizado
```

Nesse caso, a referência não tem função lógica interna, mas a implementação tem. Isso pode causar unmatched pins e falhas downstream.

Regra prática:

```text
Toda black box deve ser intencional.
```

Se aparecer black box inesperada, investigue antes do verify.

---

### 2. Onde black boxes aparecem no fluxo

No read stage:

```tcl
report_black_boxes
report_setup_status
```

No match stage:

```tcl
report_unmatched_points -point_type bbox
```

No verify/debug:

```tcl
analyze_points
```

Se a causa é black box, geralmente o problema já era visível no read/match. Não espere o failing point final.

---

### 3. Undriven signals: por que Formality é conservador

Um sinal sem driver é perigoso porque sua interpretação pode variar.

Exemplo:

```verilog
wire b;
z <= ar | b;
```

O que é `b`?

- Simulação pode propagar `X`.
- Síntese pode escolher algum valor.
- Formality, por default, quer revelar o problema.

Por isso:

```tcl
verification_set_undriven_signals = BINARY:X
```

Se você quer comportamento como síntese:

```tcl
set verification_set_undriven_signals synthesis
```

Mas cuidado: isso deve ser uma decisão consciente.

---

### 4. Undriven outputs e test ports

Alguns outputs podem estar diretamente sem driver, especialmente portas de teste não usadas. Para esses casos, existe:

```tcl
set_dont_verify -directly_undriven_output
```

O `synopsys_auto_setup true` também altera comportamento relacionado a outputs diretamente sem driver.

---

### 5. Como identificar undriven signals rapidamente

Pistas:

- transcript;
- `formality.log`;
- `report_failing_points -inputs undriven`;
- Pattern Window com tipo `Und`;
- texto `(originally undriven)`;
- cone schematic destacando net sem driver.

Comandos:

```tcl
report_failing_points -inputs unmatched -inputs undriven
report_unmatched_points <compare-point> -status undriven
```

---

### 6. Multiply driven nets: não são sempre erro, mas exigem atenção

Um sinal com múltiplos drivers pode ser:

- intencional, como barramento tri-state;
- erro de RTL;
- conflito de drivers;
- modelagem inadequada.

Formality representa isso com `BBNet`.

Comandos úteis:

```tcl
report_multidriven_nets -ref
report_multidriven_nets -impl
report_matched_points -point_type bbox_net
```

Se Ref e Impl possuem a mesma estrutura multidriven e os pontos casam, a verificação pode passar.

---

### 7. Naming interpretation: por que SVF ajuda tanto

O SVF usa nomes para referenciar objetos. Se nomes divergem entre DC e FM, guidance pode ser rejeitada.

Exemplo de variáveis que afetam nomes:

```tcl
template_naming_style
bus_naming_style
hdlin_generate_naming_style
```

Essas variáveis aparecem no:

```text
guide_environment
```

do SVF.

Portanto, o SVF correto não serve apenas para otimizações. Ele também comunica ao Formality como o DC nomeou objetos.

---

### 8. Auto Setup como “se comportar como síntese”

Depois desta unidade, fica claro por que o comando é tão importante:

```tcl
set synopsys_auto_setup true
```

Ele configura Formality para se comportar mais como síntese em pontos de divergência:

- pragmas `parallel_case`;
- pragmas `full_case`;
- undriven signals;
- outputs diretamente sem driver.

Resumo:

```text
Auto setup reduz false negatives causados por diferenças de interpretação.
```

---

## Conceitos difíceis explicados em profundidade

### Black box

Módulo sem lógica interna disponível para verificação. Formality conhece a interface, mas não verifica a função interna.

---

### BBPin

Pino de black box usado como ponto de fronteira. Saídas de black box alimentam logic cones downstream.

---

### `hdlin_unresolved_modules black_box`

Configuração que transforma módulos não resolvidos em black boxes. Útil com cuidado; perigosa se estiver escondendo arquivo faltante.

---

### `hdlin_interface_only`

Configuração para declarar módulos como interface-only por nome/padrão.

Exemplo:

```tcl
set hdlin_interface_only "SRAM* dram16x8"
```

---

### Undriven signal

Sinal declarado, mas sem driver. Pode causar divergência entre simulação, síntese e verificação.

---

### `verification_set_undriven_signals`

Variável que controla como Formality interpreta sinais sem driver.

Default:

```text
BINARY:X
```

Modo alinhado à síntese:

```text
synthesis
```

---

### Multiply driven net

Net dirigida por múltiplas fontes. Formality representa como `BBNet`.

---

### BBNet

Compare point especial usado para nets multidriven.

---

### `guide_environment`

Seção do SVF que registra variáveis de ambiente do DC, incluindo variáveis de naming.

---

## Comandos importantes

### Black boxes

```tcl
report_black_boxes
report_setup_status
report_unmatched_points -point_type bbox
set hdlin_unresolved_modules black_box
set hdlin_interface_only "SRAM* dram16x8"
set_black_box designID
```

### Undriven signals

```tcl
set verification_set_undriven_signals synthesis
report_failing_points -inputs unmatched -inputs undriven
report_failing_points -inputs undriven
report_unmatched_points <compare-point> -status undriven
set_dont_verify -directly_undriven_output
```

### Multidriven nets

```tcl
report_setup_status -design_info
report_multidriven_nets -ref
report_multidriven_nets -impl
report_matched_points -point_type bbox_net
```

### Naming / SVF

```tcl
printvar template_naming_style
```

### Auto setup

```tcl
set synopsys_auto_setup true
```

Comandos/efeitos associados:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
set verification_set_undriven_signals synthesis
set verification_verify_directly_undriven_output false
```

---

## Figuras e diagramas importantes

### Black-box no Ref e Impl

Mostra o caso correto: RAM black box aparece nos dois lados e seus pinos casam.

---

### Unresolved RTL module como black box

Mostra o caso perigoso: referência tem black box, implementação tem módulo sintetizado. A verificação pode falhar porque os cones não têm equivalência funcional real.

---

### Summary: Black-box issues

Mostra onde black boxes aparecem:

```text
read stage → report_black_box/report_setup_status
match stage → unmatched black-box pins
verify stage → pontos downstream falham
```

---

### Undriven Nets in Pattern Window

Mostra o tipo `Und` e o texto `(originally undriven)`, que são pistas diretas para debug.

---

### Undriven Nets in Cone Schematics

Mostra como uma net sem driver aparece no cone, facilitando localizar a origem.

---

### Multiple driven nets

Mostra um exemplo simples com:

```verilog
assign z = a;
assign z = b;
```

e explica por que aparece como `BBNet`.

---

### Naming variables in `guide_environment`

Mostra que variáveis que afetam nomes de objetos RTL são registradas no SVF, especialmente no `guide_environment`.

---

### Recall: What Auto Setup Mode Does

Mostra que `synopsys_auto_setup true` configura Formality para “behave like synthesis”.

---

## Pontos de prova e revisão

1. Black box é módulo/entidade sem lógica interna.
2. Black boxes não são verificadas internamente.
3. Black boxes precisam casar entre Ref e Impl.
4. Memórias e blocos analógicos são exemplos comuns de black boxes.
5. Módulos com apenas declaração de I/O podem virar black boxes.
6. Células `.db` com portas e timing arcs podem ser black boxes.
7. `hdlin_unresolved_modules black_box` transforma módulos não resolvidos em black boxes.
8. O default para módulo não resolvido é erro; `set_top` não completa.
9. `hdlin_interface_only` pode declarar módulos como black boxes por padrão de nome.
10. `report_black_boxes` lista black boxes.
11. `report_setup_status` dá resumo de black boxes.
12. Após match, `report_unmatched_points -point_type bbox` mostra black boxes unmatched.
13. Black box nos dois lados não é problema se os pinos casam.
14. Black box só em um lado pode causar falhas.
15. Saídas de black boxes alimentam logic cones.
16. Pontos dirigidos por BBPins unmatched podem falhar.
17. `verification_set_undriven_signals` controla interpretação de sinais sem driver.
18. Default de `verification_set_undriven_signals` é `BINARY:X`.
19. Se um undriven signal na referência controla compare points, verify falha.
20. Para se aproximar do DC, use `verification_set_undriven_signals synthesis`.
21. `set_dont_verify -directly_undriven_output` ignora outputs diretamente sem driver.
22. Transcript dá pistas sobre undriven signals.
23. Pattern Window mostra tipo `Und` e `(originally undriven)`.
24. Cone schematic também mostra undriven nets.
25. Multiply driven nets têm múltiplos drivers.
26. Multiply driven nets aparecem como `BBNet` compare points.
27. `report_multidriven_nets -ref` mostra detalhes de nets multidriven na referência.
28. `report_matched_points -point_type bbox_net` mostra BBNet matched.
29. Naming interpretation comum entre DC e FM ajuda matching.
30. SVF referencia objetos por nome.
31. Variáveis de naming do DC são passadas no SVF.
32. `guide_environment` contém variáveis que afetam nomes RTL.
33. Sem SVF, setup manual pode ser necessário.
34. `synopsys_auto_setup true` ajusta Formality para se comportar como síntese.
35. Auto setup configura `hdlin_ignore_parallel_case false`.
36. Auto setup configura `hdlin_ignore_full_case false`.
37. Auto setup configura `verification_set_undriven_signals synthesis`.
38. Auto setup configura `verification_verify_directly_undriven_output false`.
39. Bons comandos de resumo: `report_hdlin_mismatches` e `report_setup_status`.
40. A maioria desses problemas deve ser diagnosticada antes de debug manual de failing point.

---

## Relação com projeto/laboratório

Para investigar black boxes logo após leitura:

```tcl
report_black_boxes
report_setup_status
```

Após match:

```tcl
report_unmatched_points -point_type bbox
```

Para sinais sem driver:

```tcl
report_failing_points -inputs unmatched -inputs undriven
report_failing_points -inputs undriven
report_unmatched_points <compare-point> -status undriven
```

Para aproximar comportamento de síntese:

```tcl
set synopsys_auto_setup true
```

ou, manualmente:

```tcl
set verification_set_undriven_signals synthesis
set verification_verify_directly_undriven_output false
```

Para multidriven nets:

```tcl
report_multidriven_nets -ref
report_multidriven_nets -impl
report_matched_points -point_type bbox_net
```

Para confirmar problemas gerais de setup:

```tcl
report_setup_status
report_hdlin_mismatches
```

---

## Checklist de qualidade

- [x] Bloco 070 processado como continuação do Bloco 069.
- [x] Conteúdo organizado a partir de `Black-boxes` até `Unit Summary`.
- [x] Texto das imagens foi extraído e explicado.
- [x] Figuras, exemplos e fluxos foram interpretados.
- [x] Comandos Tcl foram preservados.
- [x] Pegadinhas de black boxes, undriven e multidriven foram destacadas.
- [x] Efeitos de `synopsys_auto_setup` foram resumidos.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 071
- **Aula:** 09 Sequential Design Transforms and SVF — parte A
- **Prioridade:** alta
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\09 Sequential Design Transforms and SVF.docx
```

- **Processar somente:** slides 1-21
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\09 Sequential Design Transforms and SVF_parte_A.md
```

- **Próximo depois dele:** Bloco 072 — `09 Sequential Design Transforms and SVF - parte B`
