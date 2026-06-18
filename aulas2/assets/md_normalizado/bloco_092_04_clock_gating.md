# 04 Clock Gating

## Controle do bloco

- **Bloco:** 092
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\04 Clock Gating.docx`
- **Faixa de slides:** 1-16
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\04 Clock Gating.md
```

- **Próximo bloco recomendado:** 093 — `05 Advanced Clock Gating Techniques`
- **Arquivo do próximo bloco:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\05 Advanced Clock Gating Techniques.docx
```

- **Faixa do próximo bloco:** slides `1-12`
- **Caminho sugerido para salvar o próximo Markdown:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\05 Advanced Clock Gating Techniques.md
```

---

## Resumo executivo

Esta aula aprofunda uma das técnicas mais importantes de redução de potência dinâmica em ASICs: **clock gating**. A ideia central é simples: se um conjunto de registradores não precisa capturar novo valor em determinado ciclo, então não faz sentido continuar chaveando o clock nesses registradores e em parte da rede de clock que os alimenta. Ao inserir uma célula de clock gating, normalmente uma **ICG — Integrated Clock Gating cell**, a ferramenta consegue desligar localmente o clock quando a condição de enable está falsa.

No Design Compiler NXT, clock gating regular não é inserido automaticamente apenas por existir um `if (EN)` no RTL. A ferramenta precisa ser instruída com `compile_ultra -gate_clock`. A partir daí, ela procura condições de enable síncronas, agrupa registradores com clock e enable compartilhados, e insere células de clock gating quando os critérios de custo e estilo são atendidos.

A aula também diferencia **clock gating regular** de **self-gating**. O clock gating regular usa enables já existentes no RTL. O self-gating tenta desligar o clock quando o valor de entrada `D` do registrador não muda em relação ao valor atual, exigindo opção própria: `compile_ultra -self_gate`.

Outro ponto forte da aula é controle fino: seleção de estilos com `set_clock_gating_style`, prevenção de células específicas com `set_dont_use -power`, exclusões/inclusões com `set_clock_gating_objects`, identificação de clock gating pré-existente com `power_cg_auto_identify` ou `identify_clock_gating`, e análise por relatórios como `report_clock_gating`, `all_clock_gates` e `report_power`.

---

## Texto extraído e organizado por slide

## Slide 1 — Clock Gating in Design Compiler NXT

### Texto extraído e organizado

**Clock Gating in Design Compiler NXT**

- Regular clock gate insertion based on existing RTL select / enable.
  - ICGs are inserted only when appending `-gate_clock` to `compile_ultra`.
  - Pre-existing, instantiated clock gating cells are **not identified by default**.

- Self-gating.
  - An integrated clock gating cell, or ICG, is inserted to turn off the clock when the register's `D` input remains unchanged.
  - Self-gates are inserted only when appending `-self_gate` to `compile_ultra`.

### Leitura didática

Este slide separa duas técnicas:

1. **Clock gating regular**
   - Depende de um enable já presente no RTL.
   - Exemplo típico:

```verilog
always @(posedge clk) begin
  if (en)
    q <= d;
end
```

A ferramenta entende que, quando `en = 0`, o registrador manterá o valor anterior. Em vez de deixar o clock chegar ao registrador e apenas impedir a atualização lógica, ela pode inserir uma ICG para bloquear o clock.

2. **Self-gating**
   - Não depende necessariamente de um enable explícito do RTL.
   - A ferramenta tenta perceber quando `D` é igual ao valor já armazenado em `Q`.
   - Se `D` não muda, capturar novamente o mesmo valor seria desperdício de clock.

Comando-base:

```tcl
compile_ultra -gate_clock
```

Para self-gating:

```tcl
compile_ultra -self_gate
```

A pegadinha do slide é forte: **clock gates pré-existentes instanciados no RTL ou vindos de netlist não são identificados por padrão**. Eles precisam de identificação explícita em etapas posteriores da aula.

---

## Slide 2 — What Does Clock Gating Do?

### Texto extraído e organizado

**What Does Clock Gating Do?**

By default, one integrated clock gating cell, or ICG, is inserted during compile for **three or more registers** with a shared clock and synchronous enable condition.

```tcl
compile_ultra -gate_clock ... [-incremental]
```

Fluxo mostrado:

```text
RTL
  ↓ elaborate
Pre-compile GTECH
  ↓ compile_ultra -gate_clock
Post-compile netlist
```

Exemplo RTL mostrado no slide:

```verilog
always @(posedge Clk)
  if (EN)
    Q <= D;
```

### Leitura didática

O slide explica o comportamento padrão mais cobrado em prova:

> Por padrão, uma ICG é inserida para **três ou mais registradores** que compartilham o mesmo clock e a mesma condição de enable síncrona.

Isso significa que a ferramenta não necessariamente cria um clock gate para qualquer registrador isolado com enable. Existe um limiar mínimo para justificar a inserção, porque uma ICG também tem custo:

- área adicional;
- atraso no caminho de clock;
- carga extra;
- complexidade de teste;
- possíveis restrições de setup/hold no enable do clock gate.

Então o clock gating vale a pena quando o ganho de potência supera o custo. O default do curso é:

```text
minimum bit-width = 3
```

Ou seja, pelo comportamento padrão, o agrupamento precisa envolver pelo menos três bits de registradores.

---

## Slide 3 — What is the Benefit of Clock Gating?

### Texto extraído e organizado

**What is the Benefit of Clock Gating?**

Clock gating reduces dynamic power dissipation by keeping clock buffers and internal register logic static while the enable condition is false.

A figura compara dois casos:

- Sem clock gating:
  - clock buffers e lógica interna dos registradores continuam alternando mesmo quando `En = 0`.

- Com clock gating:
  - a ICG bloqueia o clock quando `En = 0`;
  - clock buffers downstream e lógica interna dos registradores ficam estáticos.

### Leitura didática

O ganho do clock gating vem do fato de que clock costuma ser uma das redes que mais chaveia no chip. Diferente de um dado comum, o clock alterna a cada ciclo, independentemente de o registrador precisar atualizar ou não.

Sem clock gating, mesmo que o RTL tenha:

```verilog
if (en)
  q <= d;
```

quando `en = 0`, o registrador não muda seu valor lógico, mas ainda recebe bordas de clock. Isso pode causar consumo em:

- árvore de clock local;
- buffers de clock;
- pinos de clock dos registradores;
- lógica interna do flip-flop;
- capacitâncias ligadas ao clock.

Com clock gating, o clock é bloqueado antes desses registradores. Assim, durante os ciclos inativos, a rede local fica sem alternância.

A relação com potência dinâmica é direta:

```text
P_dynamic ≈ atividade × capacitância × V² × frequência
```

Clock gating reduz principalmente o fator de **atividade** de parte da rede de clock e dos registradores.

---

## Slide 4 — Sources of Synchronous Enable Conditions

### Texto extraído e organizado

**Sources of Synchronous Enable Conditions**

Synchronous enable conditions are extracted from two GTECH sources:

- Signals directly connected to synchronous enable pins of sequential elements.
- Enable condition present on feedback loop from `Q` to `D` pin of sequential elements.

Analysis is performed on the **local hierarchy** of each register bank.

- Automatic ungrouping and constant propagation occur before clock gate insertion and will impact the enable extraction.

### Leitura didática

O DC NXT não trabalha apenas olhando o texto do RTL bruto. Ele elabora o RTL para uma representação intermediária, aqui chamada no slide de **GTECH**.

A ferramenta pode reconhecer enable síncrono de duas formas principais:

1. **Enable direto no elemento sequencial**

Exemplo conceitual:

```verilog
always @(posedge clk) begin
  if (en)
    q <= d;
end
```

A condição `en` está claramente associada ao registrador.

2. **Enable como mux de realimentação de Q para D**

O RTL pode ser representado internamente como:

```verilog
assign d_to_ff = en ? d_new : q;
```

Quando `en = 0`, o próximo valor de `D` é o próprio `Q`, então o registrador mantém o valor. Essa estrutura é funcionalmente equivalente a um enable síncrono.

O slide destaca que a análise é feita na **hierarquia local** de cada banco de registradores. Isso importa porque otimizações anteriores, como **ungrouping** e **constant propagation**, podem alterar a visibilidade ou a forma da condição de enable.

Exemplo de impacto:

```text
Se um enable vira constante 1 antes da inserção:
    não há mais condição útil para clock gating.

Se uma hierarquia é achatada:
    registradores antes separados podem passar a ser analisados juntos.
```

---

## Slide 5 — Preventing Specific ICG Library Cell Usage

### Texto extraído e organizado

**Preventing Specific ICG Library Cell Usage**

- ICG insertion will use all ICGs available in the libraries, by default.

To prevent ICG insertion of specific ICG library cells:

```tcl
# To prevent insertion of LVth ICGs during compile
set_dont_use -power [get_lib_cells "lib*/ICG_LVT*"]
```

- Sets the `pwr_cg_dont_use` and `dont_use` attributes to true.
- Does not prevent user-instantiation of ICG cells.
- Applying `set_dont_use` without `-power` will not prevent insertion of the specified ICG(s).

### Leitura didática

Por padrão, se a biblioteca contém várias células ICG, o DC NXT pode usar todas as disponíveis. Mas pode haver casos em que você não quer que certos tipos sejam usados.

O exemplo do slide impede uso de ICGs `LVT`, isto é, células de baixo threshold. Elas tendem a ser rápidas, mas com maior leakage. Em um fluxo low power, pode ser indesejável usar clock gates de alto vazamento, exceto se o timing exigir.

O comando correto do slide é:

```tcl
set_dont_use -power [get_lib_cells "lib*/ICG_LVT*"]
```

A opção `-power` é a parte crítica. O slide afirma explicitamente que aplicar `set_dont_use` sem `-power` **não impede** a inserção dos ICGs especificados para clock gating.

Também há outra pegadinha: isso não impede instanciação manual. Se o usuário escreveu uma ICG diretamente no RTL ou se a netlist já contém aquela célula, o comando não remove automaticamente essa instanciação. Ele controla a escolha da ferramenta durante a inserção.

---

## Slide 6 — Clock-Gating Style

### Texto extraído e organizado

**Clock-Gating Style**

The `set_clock_gating_style` command can be used to control:

- Conditions when clock gating is applied:
  - minimum bit-width and maximum fanout of sink registers;
  - maximum number of stages for multi-stage clock gating.

- Clock-gating circuitry that is implemented:
  - integrated or discrete logic;
  - latch-based or latch-free;
  - enable signal setup and hold time, library overrides.

- Additional circuitry to improve testability:
  - control input and/or observation output.

Applies to all power domains, sub-designs, instances or power domains unless specific sub-designs, instances or PDs are listed.

Must also set the application variable:

```tcl
set_app_var power_cg_iscgs_enable true
```

### Leitura didática

`set_clock_gating_style` é o comando de controle fino de clock gating. Ele não é apenas um “liga/desliga”. Ele define **como** a ferramenta deve implementar clock gating.

Entre os controles mais importantes estão:

- quantos registradores mínimos justificam um clock gate;
- qual fanout máximo uma ICG pode alimentar;
- se a implementação usará célula integrada ou lógica discreta;
- se a lógica será latch-based ou latch-free;
- se haverá controle para teste, como scan enable;
- se o estilo se aplica ao design inteiro ou a partes específicas.

A variável:

```tcl
set_app_var power_cg_iscgs_enable true
```

é exigida quando se quer usar estilos específicos com ICGs integradas em escopos como instância, design ou power domain.

---

## Slide 7 — Default Style With No Clock-Gating Style Specified

### Texto extraído e organizado

**Default Style With No Clock-Gating Style Specified**

If you do **not** apply any clock gating style, clock gate insertion will insert:

- Integrated latch-based clock gates, or ICGs.
- With a pre-control scan-enable pin.

If the above ICG style is not available in the specified libraries, a different style is chosen based on a prioritized list.

### Leitura didática

Este slide mostra o comportamento default quando você usa:

```tcl
compile_ultra -gate_clock
```

mas não define nenhum `set_clock_gating_style`.

Nesse caso, a ferramenta procura inserir:

```text
Integrated latch-based clock gates com pre-control scan-enable pin
```

Em termos práticos:

- **Integrated:** usa célula ICG pronta da biblioteca.
- **Latch-based:** há um latch interno para estabilizar o enable e evitar glitch no clock gated.
- **Pre-control scan-enable pin:** o sinal de scan enable entra antes da lógica de gating, permitindo controle adequado em modo de teste.

Se a biblioteca não tiver esse estilo, o DC NXT escolhe outro conforme uma lista de prioridade definida pela ferramenta/documentação.

---

## Slide 8 — Default Style Arguments for set_clock_gating_style

### Texto extraído e organizado

**Default Style Arguments for `set_clock_gating_style`**

- If you apply the `set_clock_gating_style` command, different default clock gating style arguments apply to the command.
- The following clock gating logic is inserted if the command is applied with no arguments:
  - discrete latch-based clock gating logic;
  - no control input.

### Leitura didática

Este slide é uma pegadinha importante.

Existem dois defaults diferentes:

### Caso 1 — Não usar `set_clock_gating_style`

Se você não chama o comando de estilo, o default do fluxo é:

```text
ICG integrada, latch-based, com pre-control scan-enable pin
```

### Caso 2 — Chamar `set_clock_gating_style` sem argumentos

Se você chama:

```tcl
set_clock_gating_style
```

sem argumentos, o comportamento default desse comando é diferente:

```text
lógica discreta latch-based, sem control input
```

Isso é fácil de errar em prova e em script. O simples fato de chamar o comando sem argumentos pode mudar o estilo em relação ao default de não chamar nada.

---

## Slide 9 — Minimum Bit-width and Max Fanout Control

### Texto extraído e organizado

**Minimum Bit-width and Max Fanout Control**

Use `set_clock_gating_style` to control:

- minimum number of register bits to gate, default: 3;
- maximum fanout of a clock gate, default: unlimited.

Exemplo do slide:

```tcl
# ICG with pre-control SE pin, and min bitwidth of 6 and max fanout of 16 for top design
set_clock_gating_style -minimum_bitwidth 6 -max_fanout 16 \
  -positive_edge_logic integrated -negative_edge_logic integrated \
  -control_point before

# Variable required when applying instance, design or power-domain specific clock gating style
set_app_var power_cg_iscgs_enable true

# ICG with pre-control SE pin, and min bitwidth of 4, max fanout of 32 just for registers in M0/B0
set_clock_gating_style -minimum_bitwidth 4 -max_fanout 32 \
  -positive_edge_logic integrated -control_point before \
  -instances [get_cells M0/B0]
```

Recommendation:

- Do not change max fanout.
- Let the tool determine the limit based on timing and `max_transition` / `max_capacitance` DRCs.

### Leitura didática

Dois controles são centrais:

### `-minimum_bitwidth`

Define o menor agrupamento de bits de registradores que justifica inserir clock gating.

Default:

```text
3
```

Se você aumenta para 6:

```tcl
-minimum_bitwidth 6
```

então agrupamentos menores que 6 bits não receberão clock gate, mesmo que tenham enable.

Isso reduz área e complexidade, mas pode perder oportunidades de economia.

### `-max_fanout`

Define quantos sinks uma ICG pode alimentar.

Default:

```text
unlimited
```

Mas o slide recomenda **não alterar** manualmente, porque a ferramenta pode decidir melhor com base em:

- timing;
- transição máxima;
- capacitância máxima;
- qualidade da árvore de clock local;
- custo da divisão ou fusão de clock gates.

A recomendação prática do curso é: mexer em `-minimum_bitwidth` pode ser útil; mexer em `-max_fanout` deve ser evitado, salvo motivo claro.

---

## Slide 10 — Control Clock Gating: Exclusions

### Texto extraído e organizado

**Control Clock Gating: Exclusions**

Use `set_clock_gating_objects` to define clock gating exclusions for:

- registers;
- hierarchical cells;
- power domains;
- modules.

Exemplos do slide:

```tcl
set_clock_gating_objects -exclude [get_modules MID]
# Exclude criteria set on all registers inside m0 and m1

set_clock_gating_objects -include [get_modules BOT]
# Override excluded criteria for all instances of BOT

set_clock_gating_objects -undo [get_cells m1/b1]
# Force include criteria removed from m1/b1,
# m1/b1 registers will inherit parent criteria
```

Legenda da figura:

```text
X = excluded register bank
losango verde = force include register bank
```

### Leitura didática

Este comando controla **onde** a ferramenta pode ou não aplicar clock gating.

### `-exclude`

Remove determinada região ou conjunto de registradores da elegibilidade para clock gating.

Exemplo:

```tcl
set_clock_gating_objects -exclude [get_modules MID]
```

Todos os registradores dentro das instâncias do módulo `MID` passam a herdar critério de exclusão.

### `-include`

Força inclusão, sobrescrevendo uma exclusão herdada.

Exemplo:

```tcl
set_clock_gating_objects -include [get_modules BOT]
```

Mesmo que `BOT` esteja dentro de uma região excluída, suas instâncias podem ser marcadas como incluídas.

### `-undo`

Remove um critério aplicado diretamente, fazendo o objeto voltar a herdar o critério do pai.

Exemplo:

```tcl
set_clock_gating_objects -undo [get_cells m1/b1]
```

O ponto importante é entender que esses critérios funcionam de modo hierárquico: um bloco pode herdar exclusão do pai, mas uma sub-região pode ser forçada a entrar, e depois esse critério pode ser desfeito.

---

## Slide 11 — Identification of Existing Clock Gating

### Texto extraído e organizado

**Identification of Existing Clock Gating**

DC NXT does not identify the following clock gating logic automatically:

- user-instantiated clock gating logic, from RTL or gate-level netlist, ASCII or DDC;
- tool-inserted clock gating logic in an ASCII netlist during incremental compile.

Unidentified ICGs are ignored by the clock gating engine and reporting:

- no ungating if violating min bit-width;
- no splitting if violating max fanout;
- not included in clock gating reporting.

To consider these ICGs during optimization and reporting, apply before:

```text
compile_ultra [-incr]
```

or before:

```text
report_clock_gating
```

Comandos:

```tcl
set_app_var power_cg_auto_identify true
```

or:

```tcl
identify_clock_gating [-gating_elements <uicg_cells_ident>]
```

### Leitura didática

Este slide corrige uma suposição perigosa: só porque uma célula de clock gating já existe na netlist, não significa que o DC NXT vai reconhecê-la automaticamente como clock gate.

Se ela não for identificada:

- não entra no relatório de clock gating;
- não é considerada para otimizações específicas;
- não será dividida se tiver fanout excessivo;
- não será removida se violar critérios de bit-width;
- pode distorcer estatísticas de cobertura de clock gating.

Para fazer a ferramenta considerar clock gates pré-existentes, use uma das abordagens:

```tcl
set_app_var power_cg_auto_identify true
```

ou:

```tcl
identify_clock_gating
```

O slide indica que isso deve ser feito antes de `compile_ultra -incr` ou antes de `report_clock_gating`, dependendo se o objetivo é otimização ou apenas relatório.

---

## Slide 12 — Possible Transformations of Existing Clock Gating

### Texto extraído e organizado

**Possible Transformations of Existing Clock Gating**

There are five transformations that clock gate optimization can perform on existing and identified clock gates, enabled by default unless noted:

1. Split.
2. Merge.
3. Un-gate.
4. Collapse or expand stages.
5. Remove redundancy.

Detalhes mostrados:

- **Split or Merge**
  - Split: clock gating style max fanout < 12.
  - Merge: clock gating style min bitwidth > 6.

- **Un-gate**
  - Clock gating style min bitwidth > 4.

- **Collapse or Expand Stages**
  - `power_cg_reconfig_stages` variable must be true.
  - Collapse: clock gating style max number of stages = 1.
  - Expand: clock gating style max number of stages > 1.

- **Remove redundancy**
  - Delete constant or unloaded ICGs.

### Leitura didática

Depois que clock gates existentes são identificados, a ferramenta pode transformá-los.

### Split

Se uma ICG alimenta sinks demais, pode ser dividida em múltiplas ICGs menores.

Motivo:

- reduzir fanout;
- melhorar transição;
- reduzir capacitância;
- ajudar timing/DRC.

### Merge

Se existem vários clock gates pequenos com a mesma condição, eles podem ser unidos.

Motivo:

- reduzir área;
- reduzir redundância;
- atingir bit-width mínimo;
- melhorar organização.

### Un-gate

Se um clock gate não atende aos critérios de estilo, por exemplo, bit-width mínimo, a ferramenta pode remover o gating.

Motivo:

- evitar ICG que custa mais do que economiza;
- limpar gating ineficiente.

### Collapse/Expand Stages

Clock gating pode ser multi-stage. Em alguns casos, a ferramenta pode colapsar estágios para simplificar ou expandir para respeitar limites e melhorar estrutura.

Esse comportamento exige:

```tcl
set_app_var power_cg_reconfig_stages true
```

### Remove redundancy

Se a ICG é constante, descarregada ou não tem função útil, pode ser removida.

---

## Slide 13 — Clock-Gating Reporting

### Texto extraído e organizado

**Clock-Gating Reporting**

Comando principal:

```tcl
report_clock_gating
```

Opções mostradas:

```text
[-no_hier]
[-verbose]
[-gated]
[-ungated]
[-gating_elements]
[-multi_stage]
[-style]
[-structure]
[-no_split]
```

Exemplos mostrados:

```tcl
report_clock_gating
```

```tcl
report_clock_gating -ungated
```

Comando para coleção:

```tcl
all_clock_gates
```

Opções mostradas:

```text
[-origin]
[-no_hierarchy]
[-clock clock]
[-cells]
[-enable_pins]
[-clock_pins]
[-output_pins]
[-test_pins]
[-observation_pins]
```

### Leitura didática

`report_clock_gating` é o comando de relatório. Ele responde perguntas como:

- quantos clock gates foram inseridos;
- quantos registradores foram gated;
- quantos ficaram ungated;
- por que alguns não foram gated;
- quais elementos são clock gates;
- qual o estilo utilizado;
- se há multi-stage clock gating.

`all_clock_gates` não é um relatório textual tradicional. Ele retorna uma **collection** de objetos de clock gating, que pode ser usada em scripts Tcl.

Exemplo de uso conceitual:

```tcl
set cgs [all_clock_gates -cells]
report_attributes $cgs
```

---

## Slide 14 — Clock-Gating Reporting

### Texto extraído e organizado

**Clock Gating has two commands for analysis and reporting**

### `report_clock_gating`

Includes three reports:

- a summary;
- statistics on clock gate origin along single-bit equivalent;
- a multibit decomposition report.

Opções importantes:

- Use `-gated` to report the names of all gated registers, along with the names of the corresponding clock-gating elements.
- Use `-ungated` to report all ungated registers, along with unmet clock-gating conditions, and a histogram of ungated reasons.
- Use `-gating_elements` to report the names of all clock-gating elements, along with their style, setup and hold times, inputs, and outputs.
- Use `-multi_stage` to include multistage clock-gating statistics in the clock-gating summary.

### `all_clock_gates`

Returns a collection of clock gating cells or pins depending on the options used.

### Leitura didática

A opção mais útil para debug costuma ser:

```tcl
report_clock_gating -ungated
```

Ela ajuda a responder:

```text
Por que estes registradores não receberam clock gating?
```

Motivos comuns:

- bit-width mínimo não atingido;
- registrador sempre habilitado;
- condição de enable não reconhecida;
- restrição de estilo;
- objeto excluído;
- problema de hierarquia;
- clock gate pré-existente não identificado;
- conflito com teste ou scan.

Já:

```tcl
report_clock_gating -gated
```

mostra o que foi gated e por qual elemento.

E:

```tcl
report_clock_gating -gating_elements
```

é útil para estudar as ICGs inseridas ou identificadas, incluindo estilo e pinos.

---

## Slide 15 — Clock-Gating Reporting: `report_clock_gating`

### Texto extraído e organizado

O slide mostra um exemplo de saída de `report_clock_gating`.

Mensagem destacada:

```text
Information: Identification of clock-gating cells has not been performed.
Pre-existing clock-gating cells will not be considered. (PWR-947)
```

Notas laterais do slide:

- `PWR-947` is issued to highlight that pre-existing clock gates were not identified; therefore, they are not included in the report.
- The summary is a cell-based report and pre-existing and tool-inserted gated registers are mutually exclusive statistics.
- Single-bit equivalent reports bits instead of cells.
- Tool-inserted gated register ratio is used to assess clock gating insertion performance.

### Leitura didática

`PWR-947` é uma mensagem muito importante. Ela não diz que o clock gating novo falhou. Ela avisa que **clock gates pré-existentes não foram identificados**, então não entram no relatório.

Se você tem ICGs já instanciadas e roda:

```tcl
report_clock_gating
```

sem identificar clock gates existentes, o relatório pode parecer pior do que o design real, porque a ferramenta só contabiliza o que ela reconhece.

Para evitar essa distorção:

```tcl
set_app_var power_cg_auto_identify true
```

ou:

```tcl
identify_clock_gating
```

antes do relatório.

Outro detalhe: o relatório pode usar **single-bit equivalent**. Isso significa que, em vez de contar uma célula multibit como uma célula, ele decompõe em bits equivalentes para estatística mais justa.

---

## Slide 16 — Clock-Gating Reporting: Power

### Texto extraído e organizado

**Clock-Gating Reporting: Power**

- By default, `report_power` includes register clock pin internal in the `clock_network` power group.
- A clock gate reduces the toggle rate in clock network nets and in register clock pins.

Observação mostrada no relatório:

```text
Including register clock pin internal power
```

Nota inferior do slide:

```text
set_ideal_network was used on all clock net to reduce clock network switching power to zero
```

### Leitura didática

Este slide conecta clock gating com `report_power`.

O ganho de clock gating deve aparecer principalmente no grupo de potência relacionado à rede de clock, porque a ICG reduz a alternância em:

- nets de clock depois da ICG;
- pinos de clock dos registradores;
- lógica interna dos registradores associada ao clock.

Por padrão, `report_power` inclui a potência interna dos pinos de clock dos registradores no grupo:

```text
clock_network
```

Isso é importante porque pode haver confusão: parte do consumo do registrador não aparece apenas no grupo `register`; ela pode ser contabilizada como `clock_network` por estar associada ao pino de clock.

A observação sobre `set_ideal_network` indica que, no exemplo, a rede de clock foi idealizada para reduzir a potência de switching da rede de clock a zero. Isso afeta como ler o relatório, pois pode esconder parte da potência de switching que existiria em uma rede real.

---

# Aula didática desenvolvida

## 1. Por que clock gating existe

Em circuitos síncronos, o clock alterna o tempo inteiro. Mesmo que um registrador não vá mudar de valor, ele ainda recebe bordas de clock. Isso causa consumo dinâmico.

O problema é que o clock tem três características que o tornam caro em potência:

1. **Alta atividade:** alterna todo ciclo.
2. **Alta capacitância:** alimenta muitos sinks.
3. **Distribuição ampla:** passa por buffers, branches e pinos de clock de muitos registradores.

O clock gating reduz a atividade em regiões onde os registradores estão temporariamente inativos.

Sem clock gating:

```text
clock alterna → buffers alternam → pinos de clock alternam → flip-flops consomem
```

Com clock gating:

```text
se enable = 0:
    clock é bloqueado localmente
    registradores e clock buffers downstream ficam estáticos
```

---

## 2. Clock gating não muda a função lógica

Clock gating deve preservar equivalência funcional.

O RTL:

```verilog
always @(posedge clk) begin
  if (en)
    q <= d;
end
```

significa:

```text
se en = 1: q recebe d
se en = 0: q mantém valor
```

A versão com clock gating faz:

```text
se en = 1: clock passa e q captura d
se en = 0: clock não passa e q mantém valor
```

A função observável de `q` deve ser a mesma. A diferença está na implementação física e no consumo.

---

## 3. Estrutura típica de uma ICG

Uma ICG normalmente contém:

- latch para capturar/stabilizar o enable;
- porta lógica para combinar clock e enable estabilizado;
- pino de teste ou scan enable;
- às vezes pino de observação.

O latch é importante porque bloquear clock com uma porta combinacional simples pode gerar glitch. Um glitch no clock é perigoso porque pode ser interpretado como borda falsa por flip-flops.

Por isso o estilo default do curso é **latch-based**.

---

## 4. Regular clock gating versus self-gating

### Regular clock gating

Usa um enable existente.

Exemplo:

```verilog
if (load)
  reg_data <= data_in;
```

Quando `load = 0`, o registrador mantém valor. Isso permite gating.

Comando:

```tcl
compile_ultra -gate_clock
```

### Self-gating

Procura casos em que o novo valor é igual ao valor antigo.

Exemplo conceitual:

```text
se D == Q:
    capturar D novamente não muda nada
```

Comando:

```tcl
compile_ultra -self_gate
```

Self-gating tende a exigir lógica extra de comparação/controle. Por isso é tratado separadamente e será aprofundado em outro bloco do curso.

---

## 5. Critério default: três ou mais registradores

O slide afirma que, por padrão, uma ICG é inserida para três ou mais registradores com:

- clock compartilhado;
- enable síncrono compartilhado.

Isso está ligado ao custo-benefício.

Inserir uma ICG para um único flip-flop pode economizar pouco e custar mais do que economiza. Para vários registradores juntos, o ganho aumenta.

Resumo:

```text
1 ou 2 bits: normalmente não recebe clock gate pelo default.
3 ou mais bits: candidato default.
```

Isso pode ser alterado com:

```tcl
set_clock_gating_style -minimum_bitwidth <N>
```

---

## 6. Por que enable precisa ser síncrono

Clock gating regular é extraído de enables síncronos porque o registrador deve manter seu valor quando o enable está falso. A ferramenta precisa ter segurança de que bloquear o clock preserva a função.

Enable síncrono típico:

```verilog
always @(posedge clk) begin
  if (en)
    q <= d;
end
```

Isso é diferente de reset assíncrono ou lógica que altera comportamento fora da borda do clock. Clock gating precisa respeitar temporização e testabilidade.

---

## 7. Onde `set_clock_gating_style` entra no fluxo

Um fluxo básico seria:

```tcl
# Setup de bibliotecas, design e constraints
read_verilog design.v
link
create_clock -period 10 [get_ports clk]

# Estilo de clock gating
set_clock_gating_style -minimum_bitwidth 3 \
  -positive_edge_logic integrated \
  -negative_edge_logic integrated \
  -control_point before

# Síntese com clock gating
compile_ultra -gate_clock

# Relatório
report_clock_gating
report_power
```

O comando de estilo deve vir antes da síntese, porque ele influencia a inserção.

---

## 8. O perigo dos clock gates pré-existentes

Muitos projetos já possuem clock gating manual ou herdado de síntese anterior. O problema é que o DC NXT pode não reconhecer isso automaticamente.

Se não reconhecer:

```text
A ICG existe fisicamente,
mas o motor de clock gating não a trata como ICG.
```

Consequências:

- relatório incompleto;
- transformações não aplicadas;
- otimizações perdidas;
- estatísticas enganosas.

A correção é usar:

```tcl
set_app_var power_cg_auto_identify true
```

ou:

```tcl
identify_clock_gating
```

---

# Conceitos difíceis explicados em profundidade

## 1. ICG — Integrated Clock Gating Cell

ICG é uma célula de biblioteca feita especificamente para gating de clock.

Ela é preferível a montar gating com portas comuns porque:

- tem comportamento caracterizado;
- tem restrições de setup/hold no enable;
- é reconhecida por ferramentas de síntese, STA e teste;
- reduz risco de glitch;
- integra controle de scan/teste;
- melhora consistência do fluxo.

Uma ICG para clock de borda positiva normalmente usa latch sensível ao nível oposto do clock para estabilizar o enable antes da borda ativa. Isso evita que mudanças no enable durante a fase perigosa criem pulsos espúrios em `gclk`.

---

## 2. `compile_ultra -gate_clock`

O comando:

```tcl
compile_ultra -gate_clock
```

ativa a inserção de clock gates baseada em enables existentes.

Sem `-gate_clock`, o design pode até conter enables no RTL, mas a ferramenta não necessariamente converterá esses enables em ICGs.

Fluxo conceitual:

```text
RTL com enable
  ↓ elaboração
GTECH com mux/enable
  ↓ compile_ultra -gate_clock
netlist com ICG
```

---

## 3. `compile_ultra -self_gate`

O comando:

```tcl
compile_ultra -self_gate
```

ativa self-gating.

Ele é diferente de `-gate_clock` porque não depende apenas de enables explícitos. A ferramenta procura oportunidades de desligar o clock quando o registrador não terá mudança efetiva.

Conceito:

```text
se D == Q, então clock pode ser bloqueado sem alterar Q
```

Mas isso pode exigir lógica adicional para detectar igualdade ou ausência de mudança. Por isso precisa ser avaliado com cuidado em área, timing e potência.

---

## 4. `set_dont_use -power`

O comando do slide:

```tcl
set_dont_use -power [get_lib_cells "lib*/ICG_LVT*"]
```

não é equivalente a um `set_dont_use` comum.

A opção `-power` é específica para impedir que o motor de clock gating escolha aquelas células ICG durante a inserção.

Pegadinha:

```tcl
set_dont_use [get_lib_cells "lib*/ICG_LVT*"]
```

Segundo o slide, isso **não** impede a inserção dos ICGs especificados pelo fluxo de clock gating. Para essa finalidade, é necessário:

```tcl
set_dont_use -power ...
```

---

## 5. `set_clock_gating_style`

Esse comando define o estilo de implementação.

Exemplo didático:

```tcl
set_clock_gating_style -minimum_bitwidth 6 \
  -positive_edge_logic integrated \
  -negative_edge_logic integrated \
  -control_point before
```

Interpretação:

- `-minimum_bitwidth 6`: só aplica se houver pelo menos 6 bits de registradores no agrupamento.
- `-positive_edge_logic integrated`: para registradores de borda positiva, usa ICG integrada.
- `-negative_edge_logic integrated`: para registradores de borda negativa, usa ICG integrada.
- `-control_point before`: coloca o controle de teste antes da lógica de gating.

---

## 6. Default sem estilo versus estilo sem argumentos

Esta é uma das maiores pegadinhas do bloco:

| Situação | Resultado default |
|---|---|
| Não chama `set_clock_gating_style` | ICG integrada latch-based com pre-control scan-enable |
| Chama `set_clock_gating_style` sem argumentos | lógica discreta latch-based sem control input |

Então, chamar o comando vazio não é neutro.

---

## 7. `set_clock_gating_objects`

Usado para incluir/excluir objetos da aplicação de clock gating.

Exemplo:

```tcl
set_clock_gating_objects -exclude [get_modules MID]
```

Isso pode ser necessário quando determinado bloco:

- tem clock sensível;
- é IP fechado;
- possui teste especial;
- não pode receber clock gating por decisão arquitetural;
- já possui gating manual;
- apresenta problemas de timing com ICG.

Também pode forçar inclusão:

```tcl
set_clock_gating_objects -include [get_modules BOT]
```

Ou desfazer uma regra local:

```tcl
set_clock_gating_objects -undo [get_cells m1/b1]
```

---

## 8. `power_cg_auto_identify` e `identify_clock_gating`

Para reconhecer clock gates já existentes:

```tcl
set_app_var power_cg_auto_identify true
```

ou:

```tcl
identify_clock_gating
```

Diferença prática:

- `power_cg_auto_identify true`: ativa identificação automática.
- `identify_clock_gating`: comando explícito para identificar clock gating, podendo receber elementos específicos.

Uso típico:

```tcl
set_app_var power_cg_auto_identify true
compile_ultra -incremental
report_clock_gating
```

---

## 9. `report_clock_gating`

Comando para análise e debug.

Uso básico:

```tcl
report_clock_gating
```

Para ver registradores que receberam gating:

```tcl
report_clock_gating -gated
```

Para ver registradores que não receberam gating e os motivos:

```tcl
report_clock_gating -ungated
```

Para ver as células de clock gating:

```tcl
report_clock_gating -gating_elements
```

Para multi-stage:

```tcl
report_clock_gating -multi_stage
```

---

## 10. `all_clock_gates`

Retorna uma collection Tcl de clock gates ou pinos.

Exemplos conceituais:

```tcl
all_clock_gates -cells
```

```tcl
all_clock_gates -enable_pins
```

```tcl
all_clock_gates -clock_pins
```

Isso permite criar scripts mais avançados, por exemplo, listar atributos, aplicar filtros ou cruzar com timing/power reports.

---

## 11. `report_power` e clock gating

Clock gating deve reduzir potência especialmente em:

- `clock_network`;
- pinos de clock dos registradores;
- buffers de clock downstream;
- lógica interna dos registradores.

O slide afirma que, por padrão, `report_power` inclui a potência interna dos pinos de clock dos registradores no grupo `clock_network`.

Isso significa que, ao comparar antes/depois, é importante olhar o grupo certo.

---

# Figuras, diagramas e waveforms importantes

## Figura do slide 1 — Regular clock gate insertion e self-gating

A primeira figura mostra um enable externo controlando uma célula ICG. Esse é o clock gating regular.

A segunda figura mostra uma estrutura associada à própria condição de mudança do registrador, representando self-gating. A ideia é desligar o clock quando o valor de entrada não precisa ser capturado.

---

## Figura do slide 2 — RTL para post-compile netlist

A figura mostra a transformação:

```text
RTL com if (EN)
  ↓ elaborate
registradores com enable em GTECH
  ↓ compile_ultra -gate_clock
netlist com ICG alimentando banco de registradores
```

É uma figura fundamental para entender que clock gating é uma transformação de síntese.

---

## Figura do slide 3 — Benefício em potência

A figura compara o antes e depois:

- antes: clock buffers e lógica interna alternam mesmo com `En = 0`;
- depois: a ICG bloqueia a rede local e reduz chaveamento.

O objetivo visual é mostrar que clock gating não economiza apenas no registrador final, mas também no caminho de clock local.

---

## Figura do slide 4 — Fontes de enable síncrono

A figura mostra o enable sendo extraído a partir da lógica GTECH, incluindo mux de feedback de `Q` para `D`. Isso reforça que a ferramenta procura padrões estruturais, não apenas texto literal do RTL.

---

## Figura do slide 7 — ICG com pre-control scan-enable pin

Mostra duas variantes para registradores de borda positiva e negativa. O ponto central é que o scan enable entra como controle antes do gating, preservando testabilidade.

---

## Figura do slide 8 — lógica discreta latch-based sem controle

Mostra o comportamento quando `set_clock_gating_style` é chamado sem argumentos. A figura é importante porque esse default é diferente do default de não chamar o comando.

---

## Figura do slide 10 — exclusões e inclusões hierárquicas

A figura usa `X` para bancos excluídos e losangos verdes para bancos forçados a incluir. Ela mostra a natureza hierárquica das regras de `set_clock_gating_objects`.

---

## Figura do slide 12 — transformações possíveis

Mostra split, merge, un-gate, collapse/expand stages e remoção de redundância. Ela deve ser estudada como um mapa das otimizações possíveis depois que clock gates existentes são identificados.

---

## Figura do slide 15 — relatório e aviso PWR-947

Mostra que `report_clock_gating` pode emitir aviso quando clock gates pré-existentes não foram identificados. Esse aviso é importante para interpretar corretamente o relatório.

---

## Figura do slide 16 — `report_power`

Mostra que a potência associada ao clock pode aparecer em `clock_network`, incluindo potência interna dos pinos de clock dos registradores. Isso afeta a leitura do ganho obtido com clock gating.

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **Qual opção de `compile_ultra` habilita inserção regular de clock gates?**

```tcl
compile_ultra -gate_clock
```

2. **Qual opção habilita self-gating?**

```tcl
compile_ultra -self_gate
```

3. **Por padrão, uma ICG é inserida para quantos registradores ou bits, no mínimo?**

```text
Três ou mais registradores/bits com clock e enable compartilhados.
```

4. **Clock gating reduz principalmente qual tipo de potência?**

```text
Potência dinâmica.
```

5. **Por que clock gating reduz potência dinâmica?**

Porque reduz a alternância em clock buffers, nets de clock e pinos internos de clock dos registradores quando o enable está falso.

6. **Clock gates pré-existentes são identificados por padrão?**

```text
Não.
```

7. **Como habilitar identificação automática de clock gates pré-existentes?**

```tcl
set_app_var power_cg_auto_identify true
```

8. **Qual comando explícito pode identificar clock gating existente?**

```tcl
identify_clock_gating
```

9. **Qual comando controla estilo de clock gating?**

```tcl
set_clock_gating_style
```

10. **Qual comando define exclusões/inclusões de clock gating?**

```tcl
set_clock_gating_objects
```

11. **Qual comando impede uso de ICGs específicas da biblioteca no contexto de power/clock gating?**

```tcl
set_dont_use -power [get_lib_cells "lib*/ICG_LVT*"]
```

12. **Aplicar `set_dont_use` sem `-power` impede inserção da ICG especificada?**

```text
Segundo o slide, não.
```

13. **Qual comando mostra registradores não gated e motivos?**

```tcl
report_clock_gating -ungated
```

14. **Qual comando mostra os elementos de clock gating?**

```tcl
report_clock_gating -gating_elements
```

15. **Qual mensagem avisa que clock gates pré-existentes não foram identificados?**

```text
PWR-947
```

16. **Em qual grupo `report_power` inclui, por padrão, potência interna dos pinos de clock dos registradores?**

```text
clock_network
```

---

## Pegadinhas do bloco

| Tema | Pegadinha | Correção |
|---|---|---|
| `compile_ultra` | Achar que clock gating é automático | Precisa de `-gate_clock` para inserção regular |
| Self-gating | Confundir com enable explícito | Self-gating usa condição de D não mudar em relação a Q |
| Bit-width | Achar que qualquer 1 registrador recebe ICG | Default exige 3 ou mais bits/registradores |
| Clock gates existentes | Achar que são reconhecidos automaticamente | Não são identificados por padrão |
| Relatório | Ignorar `PWR-947` | O aviso indica clock gates pré-existentes fora do relatório |
| `set_dont_use` | Usar sem `-power` | Para impedir ICG específica no clock gating, o slide exige `-power` |
| Estilo default | Chamar `set_clock_gating_style` vazio achando que não muda nada | Comando vazio muda para lógica discreta latch-based sem control input |
| Max fanout | Ajustar manualmente sem necessidade | Recomendação: deixar a ferramenta decidir |
| `report_power` | Procurar todo ganho em `register` | Parte importante aparece em `clock_network` |

---

# Relação com projeto/laboratório

Esta aula se conecta diretamente com scripts de síntese low power em DC NXT.

Um script de laboratório pode ter uma sequência como:

```tcl
# Configuração inicial
read_verilog design.v
link
create_clock -period 10 [get_ports clk]

# Opcional: evitar ICGs específicas de alto leakage
set_dont_use -power [get_lib_cells "lib*/ICG_LVT*"]

# Estilo de clock gating
set_clock_gating_style -minimum_bitwidth 3 \
  -positive_edge_logic integrated \
  -negative_edge_logic integrated \
  -control_point before

# Síntese com clock gating
compile_ultra -gate_clock

# Relatórios
report_clock_gating
report_clock_gating -ungated
report_clock_gating -gating_elements
report_power
```

Para fluxo incremental ou netlist com clock gating pré-existente:

```tcl
set_app_var power_cg_auto_identify true
compile_ultra -incremental
report_clock_gating
```

Ou:

```tcl
identify_clock_gating
report_clock_gating
```

A aula também prepara os blocos seguintes, porque técnicas como **advanced clock gating**, **self-gating** e **multibit** dependem de entender primeiro como a ferramenta reconhece, insere, controla e reporta clock gates.

---

# Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final com caminho copiável.

---

# Próximo bloco recomendado

## Bloco 093 — 05 Advanced Clock Gating Techniques

**Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\05 Advanced Clock Gating Techniques.docx
```

**Faixa:** slides `1-12`

**Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\05 Advanced Clock Gating Techniques.md
```
