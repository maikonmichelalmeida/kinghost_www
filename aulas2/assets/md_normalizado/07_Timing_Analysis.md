# 07 Timing Analysis

## Controle do bloco

- **Bloco:** 043
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\07 Timing Analysis.docx`
- **Faixa processada:** slides 1-12
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\07 Timing Analysis.md`
- **Próximo bloco recomendado:** 044 — `08 Constraints - Multiple Clocks and Exceptions - parte A`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula ensina como analisar os resultados de timing depois da síntese no **Design Compiler NXT**.

Até agora, o fluxo já passou por:

```text
Specify Libraries
Load RTL Code
Load Floorplan
Apply Constraints
Synthesize the Design
```

Agora o destaque vai para:

```text
Analyze Results
```

O comando central é:

```tcl
report_timing
```

Ele chama o analisador de timing estático do DC NXT, quebra o design em caminhos de timing, calcula atraso de chegada dos dados, tempo requerido, slack e mostra se o caminho está cumprindo ou violando timing.

A aula também mostra a diferença entre:

```tcl
report_constraint -all_violators
```

e:

```tcl
report_timing
```

O primeiro mostra uma visão geral das violações. O segundo permite investigar o caminho violado em detalhe.

A parte final da aula usa um exercício para mostrar como interpretar padrões de violação: alguns caminhos de entrada podem estar over-constrained, enquanto caminhos register-to-register podem estar sendo ignorados durante a otimização. A solução sugerida é criar path groups separados e aplicar `critical_range` e `weight` ao grupo de clock antes de uma compilação incremental.

---

## Texto extraído e organizado por slide

### Slide 1 — Design Compiler NXT Physical Synthesis Flow

O slide mostra novamente o fluxo físico do DC NXT, agora com destaque em:

```text
Analyze Results
```

Essa etapa vem depois de:

```text
Synthesize the Design
```

e antes de:

```text
Write out Netlist with Cell Placement
```

A mensagem é que, após executar `compile_ultra`, não se deve simplesmente gerar a netlist final. É necessário analisar os resultados, especialmente timing, constraints e violações.

---

### Slide 2 — Timing Reports

O comando:

```tcl
report_timing
```

invoca o **Static Timing Analyzer** do Design Compiler NXT.

Ele faz três coisas principais:

1. Quebra o design em caminhos individuais de timing.
2. Analisa cada caminho de timing pelo menos duas vezes para timing de single-cycle max-delay.
   - endpoint de subida;
   - endpoint de descida.
3. Gera um relatório padrão com quatro seções.

O relatório padrão inclui:

- um caminho, o pior violador, por path group;
- timing de maximum delay ou setup;
- não inclui hold timing por padrão;
- não inclui DRC por padrão;
- não inclui área por padrão.

Comandos relacionados citados:

```tcl
report_timing -delay min
report_constraint -all -max_tran -max_cap
report_area -physical
```

Interpretação:

- `report_timing` padrão olha max/setup.
- Para hold, usa-se `report_timing -delay min`.
- Para DRCs lógicos, usa-se `report_constraint`.
- Para área física, usa-se `report_area -physical`.

---

### Slide 3 — Timing Report: Path Information Section

A primeira seção do relatório informa o contexto do caminho.

Exemplo de comando mostrado:

```tcl
Report : timing
  -path full
  -delay max
  -max_paths 1
```

Informações exibidas:

```text
Design
Version
Date
Operating Conditions
Library
Wire Load Model Mode
Startpoint
Endpoint
Path Group
Path Type
```

Exemplo de startpoint e endpoint:

```text
Startpoint: data1
Endpoint: xyz_reg[14]
Path Group: clk
Path Type: max
```

Pontos importantes:

- **Startpoint** é onde o caminho começa.
- **Endpoint** é onde o caminho termina.
- **Path Group** mostra em qual grupo o caminho foi colocado.
- **Path Type: max** indica análise de maximum delay/setup.

---

### Slide 4 — Timing Report: Path Delay Section

Essa seção mostra como o dado percorre o caminho.

O relatório tem colunas como:

```text
Point
Incr
Path
```

Interpretação:

- **Point**: ponto do caminho, como clock edge, net, pino, célula ou registrador.
- **Incr**: contribuição individual daquele ponto para o atraso.
- **Path**: soma acumulada do atraso até aquele ponto.

Exemplo conceitual do slide:

```text
clock clk (rise edge)             0.00   0.00
clock network delay (ideal)       0.50   0.50
input external delay              1.00   1.50
data1 (in)                        0.04   1.54
u2/Y (inv1a1)                     0.12   1.66
u12/Y (or2a1)                     0.26   1.92
u23/Y (mx2d2)                     0.23   2.15
XYZ_reg[14]/D                     0.00   2.15
data arrival time                        2.15
```

O slide destaca:

```text
Individual Contribution to Path Delay
Running Total of the Path Delay
Signal Transition
Arrival Time
Net + Cell Delay
```

A ideia é que o `report_timing` mostra tanto o atraso de cada trecho quanto o atraso acumulado.

---

### Slide 5 — Timing Report: Path Required Section

Essa seção calcula o tempo limite que o dado precisa respeitar.

Exemplo do slide:

```text
clock clk (rise edge)        2.00   2.00
clock network delay (ideal)  0.50   2.50
clock uncertainty           -0.27   2.23
XYZ_reg[14]/CK               0.00   2.23
library setup time          -0.06   2.17
data required time                  2.17
```

Interpretação:

- O clock de captura está em 2.00 ns.
- O clock network delay soma atraso até o clock pin do registrador de captura.
- A uncertainty reduz a margem disponível.
- O setup time da biblioteca também reduz o tempo disponível.
- O resultado final é o **data required time**.

O slide destaca:

```text
Data Must be Valid by this Time
```

Ou seja: o dado precisa chegar antes desse tempo.

---

### Slide 6 — Timing Report: Summary Section

A seção final resume a conta do slack.

Exemplo:

```text
data required time      2.17
data arrival time      -2.15
--------------------------------
slack (MET)             0.02
```

Interpretação:

```text
slack = data required time - data arrival time
```

Neste exemplo:

```text
slack = 2.17 - 2.15 = 0.02 ns
```

Como o slack é positivo, o caminho está:

```text
MET
```

Regras:

- slack positivo → timing atendido;
- slack zero → timing no limite;
- slack negativo → violação.

O slide destaca que o relatório mostra:

```text
MET
```

ou:

```text
VIOLATED
```

---

### Slide 7 — Timing Report: Options

O comportamento padrão de `report_timing` é reportar o caminho com o pior slack dentro de cada path group.

Opções visíveis:

```tcl
report_timing
  [-delay max/min]
  [-to pin_port_clock_list]
  [-from pin_port_clock_list]
  [-through pin_port_list]
  [-group]
  [-input_pins]
  [-max_paths path_count]
  [-nworst paths_per_endpoint_count]
  [-nets]
  [-transition]
  [-capacitance]
  [-significant_digits number]
```

Pergunta do slide:

```text
Can you guess which option reports cell and net delays separately?
```

Resposta:

```tcl
-nets
```

A opção `-nets` permite detalhar atrasos de nets separadamente dos atrasos de célula.

Outras opções importantes:

- `-delay max`: análise de setup/max delay.
- `-delay min`: análise de hold/min delay.
- `-from`: filtra caminhos por startpoint.
- `-to`: filtra caminhos por endpoint.
- `-through`: força caminho passando por determinado ponto.
- `-max_paths`: limita número máximo de caminhos reportados.
- `-nworst`: controla quantos piores caminhos por endpoint podem ser reportados.
- `-transition`: mostra transições.
- `-capacitance`: mostra capacitâncias.

---

### Slide 8 — Example: `nworst` vs `max_paths`

O slide mostra quatro caminhos com slacks diferentes:

```text
Slack = -0.30
Slack = -0.25
Slack = -0.15
Slack = -0.05
```

Comandos mostrados:

```tcl
report_timing
report_timing -max_paths 2
report_timing -max_paths 2 -nworst 2
```

Interpretação:

#### `report_timing`

Relata o pior caminho padrão:

```text
-0.30
```

#### `report_timing -max_paths 2`

Relata até dois caminhos, respeitando o comportamento padrão de `-nworst 1` por endpoint. Assim, tende a mostrar o pior caminho de dois endpoints diferentes:

```text
-0.30
-0.15
```

#### `report_timing -max_paths 2 -nworst 2`

Permite mais de um caminho por endpoint. Assim, pode mostrar os dois piores caminhos mesmo que terminem no mesmo endpoint:

```text
-0.30
-0.25
```

Ponto importante:

- `-max_paths` controla quantidade total de caminhos reportados.
- `-nworst` controla quantos caminhos por endpoint podem entrar no relatório.

---

### Slide 9 — Timing Analysis Exercise (1 of 3)

O exercício começa com:

```tcl
report_constraint -all_violators
```

O relatório mostra violações de:

```text
max_delay/setup ('clk' group)
```

A tabela mostra endpoints, required path delay, actual path delay e slack.

Exemplos visíveis:

```text
coeff_reg[14]/D   required 5.52   actual 6.98   slack -1.46   VIOLATED
coeff_reg[15]/D   required 5.52   actual 6.91   slack -1.39   VIOLATED
coeff_reg[0]/D    required 5.53   actual 6.55   slack -1.02   VIOLATED
mul_reg[31]/D     required 5.54   actual 5.87   slack -0.33   VIOLATED
mul_reg[30]/D     required 5.53   actual 5.85   slack -0.32   VIOLATED
mul_reg[0]/D      required 5.50   actual 5.69   slack -0.19   VIOLATED
```

Perguntas do slide:

1. O que é importante notar sobre as violações?
2. Qual poderia ser uma causa possível desse padrão de violação?
3. Como confirmar a suspeita?

Observações destacadas no slide:

```text
Over-constrained inputs?
Ignored reg-to-reg paths?
```

A recomendação é:

- descobrir se os dois conjuntos de caminhos são input paths ou reg-to-reg paths usando `report_timing`;
- verificar o critical range do path group com `report_path_group`.

---

### Slide 10 — Timing Analysis Exercise (2 of 3)

O slide mostra relatórios mais detalhados:

```tcl
report_timing
report_timing -to mul_reg[31]/D
report_path_group
```

Conclusões indicadas no slide:

- Um dos caminhos provavelmente é um input path over-constrained.
- Outro caminho é um reg-to-reg path que está sendo ignorado durante a otimização.
- O `report_path_group` mostra o critical range do grupo `clk`.

Texto do slide:

```text
This is a reg-to-reg path that is being ignored during optimization!
```

Recomendação no rodapé:

```text
Create separate path group for input paths and apply recommended critical range/weight to clock group -> incremental compile.
```

Ou seja:

- separar caminhos de entrada em um path group próprio;
- aplicar `critical_range` e `weight` no grupo de clock;
- executar compilação incremental.

---

### Slide 11 — Timing Analysis Exercise (3 of 3)

O slide mostra os comandos sugeridos:

```tcl
group_path -name INPUTS_COEFF -to coeff_reg*/D
group_path -name clk -critical 0.33 -weight 5
report_path_group
```

A tabela resultante mostra:

```text
Group Name     Weight   Critical Range
**default**    1.00     0.00
INPUTS_COEFF   1.00     0.00
clk            5.00     0.33
```

Depois:

```tcl
compile_ultra -scan -retime -incremental
report_constraint -all_violators
```

O slide pergunta:

```text
What if you also get an updated input delay constraint?
```

Resposta sugerida pelo slide: se houve atualização de input delay, não apenas fazer incremental no estado atual. Em vez disso, recarregar o DDC GTECH/uncompiled e aplicar novamente constraints, floorplan e compile.

Exemplo:

```tcl
read_ddc DESIGN_gtech.ddc
# Load constraints, floorplan
set_input_delay -max 1.2 -clk clk [get_ports [coeff*]]
group_path -name INPUTS_COEFF -to coeff_reg*/D
group_path -name clk -critical 0.33 -weight 5
compile_ultra -scan -retime
```

Interpretação:

- Se a mudança é apenas foco de otimização, incremental compile é adequado.
- Se a constraint de entrada mudou, é melhor recompilar a partir de uma base não compilada/GTECH com as constraints atualizadas.

---

### Slide 12 — Analysis Recommendations

Recomendações finais:

Depois de cada etapa de compile ou otimização:

1. Usar:

```tcl
report_constraint -all
```

para determinar todas as violações de constraints no design.

2. Usar:

```tcl
report_timing
```

com opções apropriadas para analisar caminhos de timing violados com mais detalhe.

Mensagem final:

- Primeiro encontre o conjunto de violações.
- Depois investigue caminhos específicos.
- Não tente corrigir às cegas.

---

## Aula didática desenvolvida

### 1. O papel da análise de timing no fluxo

A síntese não termina quando `compile_ultra` acaba. O resultado precisa ser analisado.

Um fluxo mínimo seria:

```tcl
compile_ultra
report_constraint -all_violators
report_timing
```

A lógica é:

```text
compile_ultra
  ↓
gera netlist otimizada
  ↓
report_constraint
  ↓
mostra o que ainda está violando
  ↓
report_timing
  ↓
explica por que cada caminho está violando
```

Sem essa análise, você não sabe se a ferramenta realmente atingiu as metas de timing.

---

### 2. Diferença entre `report_constraint` e `report_timing`

Esses dois comandos são complementares.

#### `report_constraint`

Mostra uma visão resumida das violações:

```tcl
report_constraint -all_violators
```

Ele responde perguntas como:

```text
Quais endpoints violam setup?
Quais nets violam max_capacitance?
Quais pinos violam max_transition?
Qual é o slack de cada violação?
```

É ótimo para triagem.

#### `report_timing`

Mostra o caminho em detalhe:

```tcl
report_timing
```

Ele responde:

```text
De onde o caminho começa?
Onde termina?
Quanto atraso veio de cada célula?
Quanto veio de net?
Qual foi o input delay?
Qual foi o clock uncertainty?
Quanto era o tempo requerido?
Quanto foi o tempo de chegada?
```

É ótimo para diagnóstico.

Regra prática:

```text
report_constraint mostra "onde dói".
report_timing mostra "por que dói".
```

---

### 3. Como ler um timing path

Um timing path possui duas grandes contas:

```text
data arrival time
data required time
```

O dado precisa chegar antes do tempo requerido.

A fórmula final é:

```text
slack = data required time - data arrival time
```

Se:

```text
data required time = 2.17 ns
data arrival time  = 2.15 ns
```

então:

```text
slack = 0.02 ns
```

Como o slack é positivo, o caminho está atendido.

Se fosse:

```text
data required time = 2.17 ns
data arrival time  = 2.30 ns
```

então:

```text
slack = -0.13 ns
```

Nesse caso, o caminho estaria violado.

---

### 4. Path delay section: entendendo `Incr` e `Path`

A seção de atraso do caminho tem duas colunas essenciais:

```text
Incr
Path
```

`Incr` é o atraso incremental daquele ponto.

Exemplo:

```text
u2/Y  0.12  1.66
```

Significa:

- o ponto `u2/Y` adicionou 0.12 ns;
- o atraso acumulado até ali é 1.66 ns.

A coluna `Path` é a soma acumulada. Ela ajuda a enxergar onde o caminho ficou caro.

Se uma célula tem um `Incr` muito alto, ela pode ser candidata a:

- troca por célula mais forte;
- reestruturação lógica;
- duplicação;
- alteração de constraints;
- mudança de RTL.

Se uma net tem atraso alto, pode indicar:

- distância física grande;
- fanout alto;
- carga grande;
- necessidade de buffer;
- problema de placement.

---

### 5. Path required section: o tempo que o circuito exige

A seção de required time calcula o prazo final.

Para setup, o dado precisa chegar antes do clock de captura menos margens e setup time.

Exemplo conceitual:

```text
clock capture edge
+ clock network delay
- clock uncertainty
- setup time
= data required time
```

O slide mostra:

```text
2.00 + 0.50 - 0.27 - 0.06 = 2.17 ns
```

Esse 2.17 ns é o limite. O dado precisa estar válido até esse momento.

---

### 6. O que significa `Path Type: max`

Quando o relatório mostra:

```text
Path Type: max
```

ele está tratando de maximum delay, isto é, setup timing.

Setup pergunta:

```text
O dado chega cedo o suficiente antes do próximo clock de captura?
```

Para hold, a análise é diferente e usa min delay:

```tcl
report_timing -delay min
```

Hold pergunta:

```text
O dado não chega cedo demais depois do clock de lançamento?
```

Nesta aula, o foco principal é setup/max delay.

---

### 7. Opções importantes de `report_timing`

#### Filtrar por origem

```tcl
report_timing -from [get_ports A]
```

Mostra caminhos que começam em `A`.

#### Filtrar por destino

```tcl
report_timing -to [get_pins mul_reg[31]/D]
```

Mostra caminhos que terminam nesse endpoint.

#### Filtrar passando por um ponto

```tcl
report_timing -through [get_cells U_ALU]
```

Mostra caminhos que passam por certa célula ou ponto.

#### Ver hold/min delay

```tcl
report_timing -delay min
```

#### Mostrar mais caminhos

```tcl
report_timing -max_paths 10
```

#### Permitir múltiplos caminhos por endpoint

```tcl
report_timing -max_paths 10 -nworst 3
```

#### Separar nets e cells

```tcl
report_timing -nets
```

#### Mostrar transições

```tcl
report_timing -transition
```

#### Mostrar capacitância

```tcl
report_timing -capacitance
```

---

### 8. `max_paths` versus `nworst`

Essa é uma pegadinha comum.

`-max_paths` limita quantos caminhos no total serão reportados.

`-nworst` limita quantos caminhos por endpoint podem aparecer.

Sem `-nworst`, o relatório pode mostrar apenas um caminho por endpoint. Então, se dois piores caminhos terminam no mesmo registrador, o segundo pode não aparecer.

Exemplo do slide:

```text
endpoint 1:
  caminho A: slack -0.30
  caminho B: slack -0.25

endpoint 2:
  caminho C: slack -0.15
  caminho D: slack -0.05
```

Com:

```tcl
report_timing
```

sai:

```text
-0.30
```

Com:

```tcl
report_timing -max_paths 2
```

sai:

```text
-0.30
-0.15
```

Com:

```tcl
report_timing -max_paths 2 -nworst 2
```

sai:

```text
-0.30
-0.25
```

A diferença é que `-nworst 2` permite pegar dois caminhos para o mesmo endpoint.

---

### 9. O exercício: como interpretar padrões de violação

O exercício mostra vários endpoints violando, mas com dois grupos aparentes:

```text
coeff_reg...
mul_reg...
```

Os caminhos `coeff_reg` têm violações maiores:

```text
-1.46
-1.39
-1.02
```

Os caminhos `mul_reg` têm violações menores:

```text
-0.33
-0.32
-0.19
```

O slide sugere duas suspeitas:

```text
Over-constrained inputs?
Ignored reg-to-reg paths?
```

Isso é um padrão realista. Às vezes, constraints de entrada são pessimistas demais, fazendo paths de input parecerem os piores. Como a ferramenta foca no pior grupo/caminho, caminhos reg-to-reg importantes podem ficar sem otimização suficiente.

---

### 10. Confirmando a suspeita com `report_timing`

Para saber se um endpoint é input path ou reg-to-reg path, usa-se:

```tcl
report_timing -to <endpoint>
```

Exemplo:

```tcl
report_timing -to mul_reg[31]/D
```

Se o startpoint for uma porta de entrada, é input path.

Se o startpoint for clock pin ou saída de registrador interno, é reg-to-reg path.

O slide mostra que um caminho para `mul_reg` é reg-to-reg e está sendo ignorado durante a otimização.

---

### 11. Confirmando path groups com `report_path_group`

Use:

```tcl
report_path_group
```

para ver:

```text
Group Name
Weight
Critical Range
```

Se o grupo `clk` tem:

```text
weight = 1
critical range = 0
```

então apenas o pior caminho do grupo tende a receber atenção forte. Caminhos quase críticos podem ser ignorados.

---

### 12. Ajuste recomendado: separar inputs e reforçar clock group

O slide sugere:

```tcl
group_path -name INPUTS_COEFF -to coeff_reg*/D
group_path -name clk -critical 0.33 -weight 5
report_path_group
```

Interpretação:

- `INPUTS_COEFF` separa os caminhos problemáticos de entrada.
- O grupo `clk` recebe prioridade maior.
- `critical 0.33` faz caminhos próximos do crítico dentro do grupo `clk` também serem otimizados.
- `weight 5` dá mais importância aos caminhos reg-to-reg.

Depois:

```tcl
compile_ultra -scan -retime -incremental
report_constraint -all_violators
```

Ou seja, faz uma compilação incremental com foco melhorado.

---

### 13. Quando não usar apenas incremental compile

O slide pergunta: e se você também recebeu uma constraint atualizada de input delay?

Nesse caso, o fluxo recomendado é voltar para um estado não compilado ou GTECH:

```tcl
read_ddc DESIGN_gtech.ddc
# Load constraints, floorplan
set_input_delay -max 1.2 -clk clk [get_ports [coeff*]]
group_path -name INPUTS_COEFF -to coeff_reg*/D
group_path -name clk -critical 0.33 -weight 5
compile_ultra -scan -retime
```

Por quê?

Porque mudar input delay altera a especificação temporal do design. Isso não é só ajuste fino. É melhor reaplicar constraints corretamente desde uma base limpa e recompilar.

Regra prática:

```text
Mudou foco de otimização? Incremental pode servir.
Mudou constraint importante ou RTL? Volte para base não compilada/GTECH e recompile.
```

---

## Conceitos difíceis explicados em profundidade

### Static Timing Analysis

Static Timing Analysis, ou STA, é análise de timing sem simular vetores.

Ele não pergunta:

```text
esse caminho será ativado em tal vetor?
```

Ele pergunta:

```text
se esse caminho for ativado, o atraso máximo/minímo cumpre a constraint?
```

Por isso é rápido e cobre estruturalmente muitos caminhos. O DC NXT usa STA para avaliar se a netlist atende clock, input delays, output delays, uncertainty, setup, hold e outras regras.

---

### Data arrival time

É o momento em que o dado chega no endpoint.

Ele inclui:

- clock launch edge;
- clock network delay de lançamento;
- input external delay, se o caminho começa em uma porta;
- atrasos de células;
- atrasos de nets;
- transições/capacitâncias que afetam delay.

No relatório, aparece como:

```text
data arrival time
```

---

### Data required time

É o prazo máximo permitido para o dado chegar.

Ele inclui:

- clock capture edge;
- clock network delay de captura;
- clock uncertainty;
- library setup time;
- outras margens aplicáveis.

No relatório, aparece como:

```text
data required time
```

---

### Slack

É a margem temporal.

```text
slack = required - arrival
```

Para setup/max delay:

- positivo: chegou antes do prazo;
- zero: chegou exatamente no limite;
- negativo: chegou tarde.

Exemplo:

```text
required = 2.17 ns
arrival  = 2.15 ns
slack    = 0.02 ns
```

Resultado:

```text
MET
```

---

### Path Group

Path group é um conjunto de caminhos que a ferramenta otimiza em conjunto.

Por padrão, caminhos são agrupados pelo clock de captura. Mas path groups podem ser definidos manualmente para separar inputs, outputs, combos ou grupos específicos.

Exemplo:

```tcl
group_path -name INPUTS_COEFF -to coeff_reg*/D
group_path -name clk -critical 0.33 -weight 5
```

---

### Critical Range

`critical_range` define uma faixa de caminhos próximos ao pior caminho do grupo que também devem receber atenção.

Sem critical range, a ferramenta pode focar só no pior caminho e ignorar outros caminhos quase críticos.

Exemplo:

```tcl
group_path -name clk -critical 0.33
```

---

### Weight

`weight` define prioridade relativa de um grupo de caminhos.

Exemplo:

```tcl
group_path -name clk -weight 5
```

Isso diz que violações no grupo `clk` têm prioridade maior na função de custo da otimização.

---

## Figuras, diagramas e relatórios importantes

### Fluxo de síntese física

A primeira figura mostra que a análise de resultados ocorre após a síntese. Isso reforça que `compile_ultra` deve ser seguido por relatórios.

### Timing report: Path Information Section

Essa figura mostra os metadados do caminho: startpoint, endpoint, path group e path type. É o cabeçalho do diagnóstico.

### Timing report: Path Delay Section

Essa figura é essencial para entender onde o atraso se acumula. A coluna `Incr` mostra a contribuição individual; `Path` mostra a soma acumulada.

### Timing report: Path Required Section

Essa figura mostra como o prazo é calculado a partir do clock de captura, uncertainty e setup time.

### Timing report: Summary Section

Essa figura mostra a conta final do slack e se o caminho está `MET` ou `VIOLATED`.

### Example `nworst` vs `max_paths`

Essa figura mostra por que `-max_paths` e `-nworst` não são a mesma coisa. É uma pegadinha importante para relatórios.

### Timing Analysis Exercise

O exercício mostra um padrão realista: paths de entrada possivelmente over-constrained dominam o relatório e caminhos reg-to-reg acabam ignorados.

---

## Pontos de prova e revisão

1. `report_timing` invoca o Static Timing Analyzer do DC NXT.
2. O relatório padrão mostra o pior caminho por path group.
3. O relatório padrão foca em max delay/setup.
4. Para hold/min delay:
   ```tcl
   report_timing -delay min
   ```
5. Para DRCs como max transition e max capacitance:
   ```tcl
   report_constraint -all -max_tran -max_cap
   ```
6. Para área física:
   ```tcl
   report_area -physical
   ```
7. `Path Type: max` indica análise de setup/max delay.
8. `Incr` é atraso incremental.
9. `Path` é atraso acumulado.
10. `data arrival time` é quando o dado chega.
11. `data required time` é o prazo em que o dado precisa estar válido.
12. Fórmula:
    ```text
    slack = data required time - data arrival time
    ```
13. Slack positivo significa `MET`.
14. Slack negativo significa `VIOLATED`.
15. Opção que mostra cell e net delays separadamente:
    ```tcl
    -nets
    ```
16. `-max_paths` controla número máximo total de caminhos reportados.
17. `-nworst` controla número de piores caminhos por endpoint.
18. Para investigar endpoint específico:
    ```tcl
    report_timing -to <endpoint>
    ```
19. Para ver grupos de caminhos:
    ```tcl
    report_path_group
    ```
20. Se caminhos reg-to-reg estão sendo ignorados, criar path group separado para inputs e reforçar grupo de clock.
21. Exemplo:
    ```tcl
    group_path -name INPUTS_COEFF -to coeff_reg*/D
    group_path -name clk -critical 0.33 -weight 5
    ```
22. Depois de ajustar foco:
    ```tcl
    compile_ultra -scan -retime -incremental
    ```
23. Se input delay mudou, melhor recarregar GTECH/uncompiled DDC e recompilar com constraints atualizadas.
24. Depois de cada compile ou otimização:
    ```tcl
    report_constraint -all
    ```
25. Para analisar violadores em detalhe:
    ```tcl
    report_timing
    ```

---

## Script consolidado da aula

Um fluxo didático de análise após compile:

```tcl
# Síntese
compile_ultra -scan -retime

# Ver violações gerais
report_constraint -all_violators

# Ver timing detalhado do pior caminho
report_timing

# Ver caminhos específicos
report_timing -to mul_reg[31]/D
report_timing -to coeff_reg[14]/D

# Ver grupos de caminho
report_path_group
```

Se o relatório indicar inputs dominando e reg-to-reg ignorado:

```tcl
# Separar caminhos de entrada problemáticos
group_path -name INPUTS_COEFF -to coeff_reg*/D

# Dar foco ao grupo de clock/reg-to-reg
group_path -name clk -critical 0.33 -weight 5

# Conferir grupos
report_path_group

# Reotimizar incrementalmente
compile_ultra -scan -retime -incremental

# Conferir novamente
report_constraint -all_violators
```

Se a constraint de input delay mudou:

```tcl
# Voltar para design não mapeado/GTECH
read_ddc DESIGN_gtech.ddc

# Reaplicar constraints e floorplan
set_input_delay -max 1.2 -clk clk [get_ports [coeff*]]

# Reaplicar path groups
group_path -name INPUTS_COEFF -to coeff_reg*/D
group_path -name clk -critical 0.33 -weight 5

# Recompilar
compile_ultra -scan -retime

# Relatar novamente
report_constraint -all_violators
report_timing
```

---

## Relação com projeto/laboratório

Esta aula é diretamente prática para qualquer fluxo de síntese. Depois de rodar `compile_ultra`, o relatório de timing é o principal instrumento de diagnóstico.

Um erro comum é olhar apenas a primeira violação e tentar “consertar” sem entender o padrão. O exercício mostra que é preciso separar:

```text
caminhos de entrada
caminhos de saída
caminhos reg-to-reg
caminhos combinacionais
```

Se um tipo de caminho domina o relatório por constraints pessimistas, outros caminhos podem ficar esquecidos. Nesse caso, path groups, `critical_range` e `weight` ajudam a direcionar a otimização.

A aula também reforça a disciplina de fluxo:

```text
compile
relatórios
diagnóstico
ajuste de path groups/constraints
incremental compile ou recompilação limpa
novos relatórios
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

**Bloco 044 — 08 Constraints - Multiple Clocks and Exceptions - parte A**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions.docx
```

Faixa:

```text
slides 1-17
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\08 Constraints - Multiple Clocks and Exceptions_parte_A.md
```
