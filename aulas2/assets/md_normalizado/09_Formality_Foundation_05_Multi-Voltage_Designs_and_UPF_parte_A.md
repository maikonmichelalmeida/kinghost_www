# 05 Multi-Voltage Designs and UPF — parte A

## Controle do bloco

- **Bloco:** 064
- **Curso:** 09 Formality Foundation
- **Aula:** 05 Multi-Voltage Designs and UPF — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\05 Multi-Voltage Designs and UPF.docx`
- **Faixa processada:** parte A do anexo, organizada pela sequência conceitual inicial do curso
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\05 Multi-Voltage Designs and UPF_parte_A.md
```

- **Próximo bloco recomendado:** Bloco 065 — `05 Multi-Voltage Designs and UPF - parte B`

---

## Resumo executivo

Esta parte inicia o tema de **multi-voltage designs and UPF** (projetos multi-tensão e UPF). O objetivo é entender como o Formality verifica equivalência quando a funcionalidade do circuito não depende apenas da lógica RTL/gates, mas também do **power intent** (intenção de potência) descrito em UPF.

A ideia central é que, em projetos low-power (baixo consumo), o circuito pode ter vários **power domains** (domínios de potência), alguns deles podendo ser desligados por **power gating** (desligamento controlado de domínio). Quando um domínio é desligado, seus sinais podem virar `X`. Para evitar que esse `X` contamine um domínio ainda ligado, o fluxo insere células especiais, como **isolation cells** (células de isolamento), **retention cells** (células de retenção), **level shifters** (conversores de nível) e power switches (chaves de potência).

O Formality precisa considerar esses efeitos na verificação. Por isso, a comparação não é apenas:

```text
RTL versus gates
```

mas sim:

```text
RTL + UPF versus gates + UPF'
```

ou, em estágios posteriores:

```text
gates + UPF' versus post-layout gates + UPF''
```

A parte A cobre os fundamentos: o que é UPF, por que isolamento existe, como UPF entra no fluxo Synopsys, a diferença entre Formality e VC LP, como o Formality detecta diferenças funcionais mesmo em designs low-power, como o power-down injeta `X`, quais são os “sabores” de UPF no fluxo, como carregar UPF no Design Compiler e no Formality, e como lidar com a variável `verification_force_upf_supplies_on`.

---

## Texto extraído e organizado por slide

### Slide 1 — At its most basic: What is UPF? (No mais básico: o que é UPF?)

Texto extraído:

- A common way to reduce power is have multiple power domains, e.g.:
  - Different voltages: Multi Voltage (multi-tensão), 1/2CV².
  - Same voltage but domain can be shut down: Power Gating (desligamento de domínio), reduce leakage power.
- Where multiple power domains you want to end up with certain power structures in design so silicon works.
  - Isolation cells: for when a power domain is shut down.
- Want to avoid capturing these structures in the RTL.
  - Still wish to verify/simulate at the RTL level.
  - Want the implementation flow to automatically implement the power intent.
- IEEE 1801 (UPF) is a standard for specifying the power intent.
  - Supported across Synopsys tools.

Interpretação:

UPF significa **Unified Power Format** (formato unificado de potência). Ele descreve a intenção de potência do projeto sem obrigar o RTL a conter explicitamente todas as estruturas físicas de baixo consumo.

Em vez de escrever no RTL todas as células de isolamento, retenção, power switches e conexões de alimentação, o projetista escreve a intenção no UPF. Depois, as ferramentas de implementação usam essa intenção para inserir as estruturas corretas.

A motivação é separar duas coisas:

```text
RTL = funcionalidade lógica do design
UPF = intenção de potência do design
```

Assim, o RTL continua limpo e simulável, enquanto o UPF informa como o circuito deve se comportar em relação a domínios de potência, desligamento, isolamento e retenção.

---

### Slide 2 — At its most basic: Isolation Cells (No mais básico: células de isolamento)

Texto extraído da figura e caixas:

- Assume: `SUB_A` is driving signals into `SUB_B`.
- `SUB_A` can be powered down with `SUB_B` still powered up.
- Bad things could then happen on silicon.
- Isolation cells: buffers that clamp signals to hard values.
- Intent of isolation:
  - cells should be inserted between the domains;
  - when isolation signal is asserted, the output is clamped to a hard value;
  - isolation should be asserted before `SUB_A` is shut down;
  - isolation cell supply needs to be on appropriately.

Interpretação da figura:

A figura mostra dois blocos:

```text
SUB_A → SUB_B
```

O bloco `SUB_A` pode ser desligado, enquanto `SUB_B` continua ligado. Se `SUB_A` for desligado e continuar dirigindo sinais para `SUB_B`, os valores podem ficar indefinidos, instáveis ou inválidos. No silício, isso pode causar comportamento incorreto no domínio que ainda está ligado.

A solução é inserir uma célula de isolamento entre os domínios:

```text
SUB_A → ISO → SUB_B
```

Quando `SUB_A` vai desligar, o sinal de isolamento é ativado antes do power-down (desligamento de potência). A célula de isolamento força a saída para um valor conhecido, por exemplo `0` ou `1`.

Essa célula precisa estar alimentada por um domínio que permanece ligado; caso contrário, ela não conseguiria proteger o domínio receptor.

---

### Slide 3 — At its most basic: UPF and Formality (No mais básico: UPF e Formality)

Texto extraído da figura:

```text
RTL + UPF = Simulatable design with overlaid power intent
```

Fluxo mostrado:

```text
RTL + UPF
   ↓
Design Compiler
   ↓
Gates + UPF'
```

Caixas importantes:

- Post-DC gates will only have part of power intent, e.g. isolation cells.
- Power switches and PG hook-up will happen in P&R tool.
- To capture this incremental implementation of power intent, you need post-DC UPF.
- Gates + UPF' provide the implementation functionality.

Interpretação:

O Formality precisa comparar designs levando em conta que a intenção de potência é implementada progressivamente.

No início:

```text
Reference = RTL + UPF
```

Após o Design Compiler:

```text
Implementation = gates + UPF'
```

O `UPF'` representa o UPF pós-síntese, gerado ou atualizado pelo Design Compiler. Ele não é exatamente o mesmo UPF original, porque parte da intenção já foi implementada em gates, como células de isolamento. Outras partes ainda podem ser implementadas depois, no place & route, como conexão de power/ground e power switches.

Por isso, em verificação low-power, o design lógico sozinho não é suficiente. O Formality precisa ler o design e o UPF correspondente.

---

### Slide 4 — Synopsys IEEE 1801 (UPF) Flow (Fluxo Synopsys IEEE 1801/UPF)

Figura do fluxo:

A figura divide o fluxo em colunas:

- **Functional Verification** (verificação funcional)
  - VCS NLP / VC LP.
- **Implementation** (implementação)
  - RTL + UPF.
  - Design Compiler / Power Compiler.
  - Gate + UPF'.
  - ICC II.
  - PG Netlist.
  - Gate + UPF''.
- **Equivalence Checking** (verificação de equivalência)
  - Formality em diferentes pontos do fluxo.
- **Timing/Power Signoff** (signoff de temporização/potência)
  - PrimeTime / PrimePower.
  - RedHawk.

Interpretação:

O fluxo mostra que o UPF acompanha o design em vários estágios:

```text
RTL + UPF
Gate + UPF'
Gate + UPF''
PG Netlist
```

Cada estágio representa uma implementação mais concreta da intenção de potência. O Formality entra como ferramenta de equivalence checking (verificação de equivalência) para garantir que as transformações preservam a funcionalidade, considerando também os efeitos de potência.

---

### Slide 5 — Formality Low Power Capabilities (Capacidades low-power do Formality)

Texto extraído:

- Formality Comprehensive Low Power Equivalence Checks.
  - Verifies the design in all power states as defined in the power state table.
  - Supports advanced low-power design techniques:
    - Multi-Vth;
    - Multi Voltage;
    - Power Gating;
    - State Retention;
    - DVFS;
    - AWFS.
  - Supports special low-power cells:
    - isolation cells;
    - level shifters;
    - always-on cells;
    - retention registers;
    - power gates.
- Complemented by VC LP for static low power rule checking.
- See also SolvNet Article 034551, “Recognizing and Debugging UPF Issues Using Formality”.

Interpretação:

O Formality não faz apenas equivalência booleana tradicional. Ele também consegue considerar estados de potência definidos no UPF e na power state table (tabela de estados de potência).

Isso é importante porque um design pode ser equivalente em estado “tudo ligado”, mas falhar em um estado onde um domínio está desligado e outro permanece ligado.

A lista de estruturas low-power indica que o Formality precisa entender células especiais, como isolation cells e retention registers, porque elas alteram a função observável do circuito dependendo do estado de potência.

---

### Slide 6 — Formality and VC LP: Complementary Tools for Low Power Checking (Formality e VC LP: ferramentas complementares para checagem low-power)

Texto extraído:

- Formality checks for functional equivalence between two designs.
  - Example: functional comparison of post-layout PG netlist to the original low power design specification, RTL+UPF.
- VC LP checks for adherence to MV rules and power intent specification for a single design.
  - MV rules examples:
    - level shifter or isolation cell missing;
    - level shifter/isolation cell interchange;
    - illegal routing/placement;
    - polarity of isolation signal.
  - Power intent examples:
    - check power up/down sequence;
    - validate control signal networks.

Interpretação:

O slide separa bem as responsabilidades.

**Formality** pergunta:

```text
O design A é funcionalmente equivalente ao design B?
```

Exemplo:

```text
RTL + UPF  versus  post-layout PG netlist
```

**VC LP** pergunta:

```text
Um único design está respeitando as regras de low-power e a especificação de power intent?
```

Exemplos de problemas que VC LP procura:

- célula de isolamento ausente;
- level shifter ausente;
- isolamento no lugar de level shifter;
- roteamento ilegal entre domínios;
- polaridade errada do sinal de isolamento;
- sequência de power-up/power-down inválida.

Então, Formality e VC LP são complementares: um verifica equivalência funcional entre versões; o outro verifica regras estáticas e coerência do power intent dentro de um design.

---

### Slide 7 — Formality Detects Functional Differences (Formality detecta diferenças funcionais)

Texto extraído:

- Both the RTL and Gates designs are properly isolated.
- Formality will show a functional difference because the “OR” function in the RTL has changed to “AND” in the Gates.

Interpretação da figura:

A figura mostra um exemplo em que tanto o RTL quanto a netlist gates têm isolamento corretamente inserido. Mesmo assim, há uma diferença funcional: a lógica mudou de OR para AND.

O ponto didático é importante: o Formality não deve ser visto apenas como ferramenta para checar se as células low-power existem. Ele verifica se a função total do design é equivalente. Se a lógica real mudou, ele acusa a diferença mesmo que as estruturas de isolamento estejam corretas.

Em outras palavras:

```text
Low-power correto não compensa função lógica errada.
```

---

### Slide 8 — UPF Effects on Verification (Efeitos do UPF na verificação)

Texto extraído:

- Extends functional equivalence checking to include power effects on logic function.
- Connects supply rails to power/ground pins.
- Powers-down cell outputs and sequential elements.
- Matches IEEE-1801 (UPF) simulation semantics.
- Drives X into circuit using power-down functions triggered by power and ground pins.

Interpretação:

Quando o Formality carrega UPF, ele modifica o modelo de verificação para incluir efeitos de potência.

Isso significa que:

- pinos de alimentação e ground são conectados conforme o UPF;
- células podem ter comportamento diferente quando o domínio desliga;
- saídas de células e elementos sequenciais podem virar `X`;
- a simulação/verificação segue a semântica IEEE 1801;
- funções de power-down podem injetar `X` no circuito.

Portanto, a equivalência passa a considerar não apenas sinais lógicos normais, mas também o estado das fontes de alimentação.

---

### Slide 9 — Power down inserts X into the design (Power-down insere X no design)

Texto extraído da figura:

- `X generator / Don't care cell`
- A figura mostra uma célula UPF ISO com saída `OUT = X`.

Interpretação:

Quando um domínio é desligado, a ferramenta pode modelar esse comportamento injetando `X` em determinados pontos. Esse `X` representa um valor desconhecido ou inválido causado pelo estado de power-down.

O problema é que `X` pode se propagar pelo circuito e aparecer em compare points. Quando isso acontece, o debug de equivalência precisa identificar se a falha é:

- uma diferença funcional real;
- uma diferença causada por power-down;
- uma diferença causada por isolamento ausente ou mal controlado;
- uma diferença causada por supply net mal restrita;
- um problema de modelagem UPF.

---

### Slide 10 — UPF: Several flavors — Chocolate, Strawberry, Pistachio (UPF: vários sabores — chocolate, morango, pistache)

Texto extraído:

- **UPF (Chocolate)**
  - Implement all UPF constructs, like simulation.
- **UPF' (Strawberry)**
  - Created by Design Compiler.
  - Implement supplies and switches.
  - Do not implement isolation/retention.
- **UPF'' (Pistachio)**
  - Created by IC Compiler.
  - Implement supplies.
  - Used by PrimeTime and other tools.
- **PG Netlist (Vanilla)**
  - Nothing to implement, it is all explicit in the netlist.

Interpretação:

A aula usa os “sabores” para diferenciar versões do UPF ao longo do fluxo.

Uma forma prática de entender:

| Nome no slide | Estágio | Ideia |
|---|---|---|
| UPF / Chocolate | fonte original | power intent completo, usado com RTL |
| UPF' / Strawberry | pós-Design Compiler | UPF ajustado após parte da intenção ser implementada |
| UPF'' / Pistachio | pós-IC Compiler | UPF ajustado após implementação física |
| PG Netlist / Vanilla | netlist com power/ground explícitos | não há mais muito a “implementar”; conexões estão explícitas |

A principal mensagem é que o Formality precisa receber o UPF adequado para o estágio comparado.

---

### Slide 11 — Example UPF Design Compiler Script (Exemplo de script UPF no Design Compiler)

Texto extraído e reconstruído:

```tcl
# Example DC script

set_svf mydesign.svf

# Elaborate design
read_verilog RTL.v
current_design top

load_upf design_choc.upf

# Compile
compile_ultra -scan -gate_clock
write -format verilog -hier -out top_gates.v

save_upf design_strawberry.upf
```

Anotações:

- `design_choc.upf`: Source UPF (UPF fonte).
- `design_strawberry.upf`: Post synthesis UPF (UPF pós-síntese).

Interpretação:

No Design Compiler, o UPF fonte é carregado após a leitura/elaboração do design:

```tcl
load_upf design_choc.upf
```

Depois da síntese, a netlist de gates é escrita:

```tcl
write -format verilog -hier -out top_gates.v
```

E o Design Compiler salva uma versão pós-síntese do UPF:

```tcl
save_upf design_strawberry.upf
```

Esse UPF pós-síntese deve ser usado no container de implementação do Formality.

---

### Slide 12 — Formality script for UPF DC (Script do Formality para UPF gerado no DC)

Texto extraído e reconstruído:

```tcl
# Elaborate design
set_svf "mydesign.svf"
read_verilog -r RTL.v
set_top top

load_upf -r design_choc.upf

read_verilog -i top_gates.v
set_top top

load_upf -i design_strawberry.upf

match

verify
```

Nota do slide:

```text
UPF is loaded into container after set_top.
```

Interpretação:

Esse slide é operacionalmente muito importante.

O UPF deve ser carregado no container correto:

- UPF fonte no container de referência:

```tcl
load_upf -r design_choc.upf
```

- UPF pós-síntese no container de implementação:

```tcl
load_upf -i design_strawberry.upf
```

E a nota diz que o UPF é carregado **depois de `set_top`**.

Sequência correta:

```text
read design
set_top
load_upf
```

Isso permite que o Formality associe o power intent à hierarquia/topo já elaborados.

---

### Slide 13 — All Supplies are Forced on by Default (Todas as fontes são forçadas ligadas por padrão)

Texto extraído:

- In Formality the variable:

```tcl
verification_force_upf_supplies_on
```

defaults to value:

```tcl
true
```

- Verification runs faster out of the box.
- Allows detection of non-power related flow/optimization issues more quickly.
- This is only a partial verification result. Set this variable to `false` to get a complete verification of all power states.
- Destaque:
  - One of the very few exceptions to the rule that the default settings in Formality are conservative or sign-off.

Interpretação:

Por padrão, o Formality força todas as supplies UPF para ON:

```tcl
set verification_force_upf_supplies_on true
```

Isso simplifica e acelera a verificação inicial. Com tudo ligado, a ferramenta detecta problemas de lógica/otimização sem misturar imediatamente os efeitos de power-down.

Mas essa verificação é parcial. Ela não cobre todos os estados de potência. Para verificar todos os estados, é necessário usar:

```tcl
set verification_force_upf_supplies_on false
```

Este é um ponto de prova importante: neste caso, o default do Formality é prático e rápido, mas **não é sign-off completo**.

---

### Slide 14 — Over-constrained UPF Power Supply Report (Relatório de supply UPF super-restrita)

Texto extraído:

- `analyze_upf` highlights UPF power supplies that will never turn on because of over-constrained supply net.
- Variable:

```tcl
upf_auto_analyze
```

when set to true, default at 2018.06, will run `analyze_upf` at the preverify stage and prevent verification continuing if issues found.
- This can occur due to several reasons:
  - Bad power states.
  - Corruption.
  - Feedback.
- If design has not been simulated with the UPF then this may catch a problem in the reference design.
- A bad reference UPF may pass verification.

Interpretação:

Quando se verifica todos os estados de potência, pode acontecer de o UPF estar super-restrito. Isso significa que determinada supply net nunca consegue assumir o estado ON, embora devesse.

O comando:

```tcl
analyze_upf
```

ajuda a detectar esse tipo de problema.

A variável:

```tcl
upf_auto_analyze
```

pode rodar essa análise automaticamente antes da verificação.

O slide alerta que um UPF ruim pode até passar em certas condições, especialmente se a verificação estiver parcial. Por isso, é importante simular e validar o UPF, não apenas confiar que o arquivo existe.

---

### Slide 15 — Over-constrained UPF Power Supply Report: exemplo de saída

Texto extraído da saída mostrada:

```tcl
Formality (verify) > analyze_upf

Container: ref

Found 1 Supply Net(s) that can never be turned ON

Supply Net ref:/WORK/top/VDDA can never be 1 (ON value)

Set verification_force_upf_supplies_on to false
Use "verify -constant1 ref:/WORK/top/VDDA" to see a failing logic cone
for the supply net.
```

Interpretação:

A saída mostra que a supply net:

```text
ref:/WORK/top/VDDA
```

nunca consegue chegar ao valor ON (`1`). Isso indica que o modelo UPF ou as restrições de power states podem estar incorretas.

A sugestão do Formality é usar:

```tcl
verify -constant1 ref:/WORK/top/VDDA
```

para ver um logic cone falho associado à supply net. Isso transforma um problema abstrato de UPF em um problema depurável por cone lógico.

---

### Slide 16 — Formality Inserts Cutpoints at the Power Domain Boundary (Formality insere cutpoints na fronteira do domínio de potência)

Texto extraído:

- Cutting of power domains:

```tcl
verification_insert_upf_isolation_cutpoints true
```

- Improves verification performance by reducing verification complexity.
- Prevents X from escaping a power off domain into a power on domain.
  - Reduces failures due to X propagation differences.

Interpretação:

O Formality pode inserir cutpoints nas fronteiras de power domains. Um **cutpoint** é um ponto onde a ferramenta “corta” a análise para reduzir complexidade e isolar regiões.

A variável:

```tcl
verification_insert_upf_isolation_cutpoints
```

controla essa estratégia.

Benefícios:

- reduz complexidade de verificação;
- evita que `X` de um domínio desligado escape para domínio ligado;
- reduz falhas causadas apenas por diferenças de propagação de `X`.

Isso é especialmente importante em designs com muitos domínios de potência e isolamento.

---

### Slide 17 — Look at the Verification Results ATTENTION Messages (Olhe as mensagens ATTENTION dos resultados de verificação)

Texto extraído:

Casos mostrados:

1. Com:

```tcl
verification_insert_upf_isolation_cutpoints true
```

Mensagem conceitual:

```text
Verification FAILED
ATTENTION: Failing PDCut compare point(s) represent UPF power domain boundary differences.
UPF power domain boundary verification is enabled by the variable
verification_insert_upf_isolation_cutpoints.
```

2. Com:

```tcl
verification_force_upf_supplies_on true
```

Mensagem conceitual:

```text
Verification SUCCEEDED
ATTENTION: Verification was run with all UPF supplies constrained to their ON state.
This is only a partial verification result as it does not cover all operational states.
```

Interpretação:

As mensagens **ATTENTION** são fundamentais. Elas explicam o contexto da verificação.

Se aparecem falhas em `PDCut`, pode ser que a diferença esteja relacionada à fronteira de domínios de potência, não a uma lógica comum.

Se a verificação passa com supplies forçadas ON, o resultado é parcial. O usuário não deve interpretar isso como sign-off completo de low-power.

---

### Slide 18 — Messages from `load_upf` (Mensagens do `load_upf`)

Texto extraído:

Três tipos de mensagens:

1. **RTL + UPF**

```text
Loading upf file 'test.upf'
Info: load_upf: ... implementing all UPF constructs.
Info: load_upf: Implemented 0 retention registers and 0 isolation cells.
Info: load_upf: completed.
```

2. **UPF' — Generated by Design Compiler**

```text
Info: load_upf: ... Generated by Design Compiler ... implementing
supply network and connecting retentions and isolation supplies.
```

3. **UPF'' — Generated by IC Compiler**

```text
Info: load_upf: ... Generated by IC Compiler ... connecting primary supplies.
```

Interpretação:

As mensagens do `load_upf` indicam que tipo de UPF foi carregado e o que a ferramenta está implementando naquele estágio.

Isso ajuda a confirmar se o arquivo carregado é coerente com o container:

- referência RTL deve usar UPF fonte;
- implementação pós-DC deve usar UPF gerado pelo Design Compiler;
- implementação pós-ICC deve usar UPF gerado pelo IC Compiler.

---

### Slide 19 — Failure Symptoms (Sintomas de falha)

Texto extraído:

- Failing patterns show X differences at compare point:
  - CutPin;
  - Primary output;
  - Black box inputs;
  - Registers;
  - Something in the netlist is powered off causing X to propagate.
- Failing patterns show 1/0 differences at the compare point:
  - maybe not a power-off related problem.

Interpretação:

Este slide ensina uma heurística simples para debug.

Se a falha mostra diferença de `X`, é provável que o problema esteja relacionado a power-down, isolamento, propagação de `X` ou supply.

Se a falha mostra diferença direta `1/0`, pode ser uma diferença funcional comum, não necessariamente relacionada a low-power.

Isso não é uma regra absoluta, mas é um bom primeiro filtro:

```text
X difference → investigar UPF, supply, isolation, power-down
1/0 difference → investigar lógica funcional normal também
```

---

### Slide 20 — Pattern Window: UPF cones are unusual (Janela de padrões: cones UPF são incomuns)

Figura:

A Pattern Window mostra compare point values para um vetor, com sinais de supply e valores como:

```text
VSS
VDD
VDDadd
```

e compare point relacionado a `sum_preciso_reg[0]`.

Interpretação:

Com UPF, a Pattern Window pode parecer diferente da verificação tradicional. Além dos sinais lógicos comuns, aparecem:

- supply nets;
- ground nets;
- sinais de power state;
- sinais de isolamento;
- valores `X`;
- controles de power-down.

Por isso o slide diz que UPF cones are unusual (cones UPF são incomuns). A análise de padrões low-power exige olhar também para sinais de alimentação e estado de domínio.

---

### Slide 21 — Matched point window can also quickly pinpoint X on hierarchical pins (Janela de matched points pode localizar X em pinos hierárquicos)

Texto extraído do título:

- Matched point window can also quickly pinpoint X on hierarchical pins.

Figura:

A janela mostra opções como:

- Show matched points with different simulation values.
- Show matched points with identical simulation values.
- Show points with matches outside of the complementary cone.

A tabela mostra objetos de referência e implementação, tipo “hier in” e “hier out”, com valores incluindo `X`.

Interpretação:

A janela de matched points pode ajudar a localizar rapidamente em que fronteira hierárquica o `X` aparece. Isso é útil porque, em designs UPF, o `X` frequentemente atravessa ou é bloqueado em fronteiras de domínios, células de isolamento ou cutpoints.

O debug pode seguir esta lógica:

1. ver o failing pattern;
2. identificar que existe `X`;
3. usar matched point window para localizar o boundary/hierarchical pin onde o `X` aparece;
4. abrir o cone schematic e investigar supply, isolamento ou power-down.

---

## Aula didática desenvolvida

### 1. UPF separa funcionalidade lógica de intenção de potência

O primeiro conceito da aula é que o RTL não deve carregar todos os detalhes físicos de baixo consumo. O RTL descreve a função lógica. O UPF descreve a intenção de potência.

Exemplo:

```text
RTL: SUB_A calcula uma função e envia para SUB_B.
UPF: SUB_A pode desligar; SUB_B permanece ligado; saída de SUB_A deve ser isolada.
```

O benefício é que o RTL continua limpo, enquanto o fluxo de implementação insere as estruturas low-power necessárias.

---

### 2. Por que isolation cells existem

Imagine:

```text
SUB_A → SUB_B
```

Se `SUB_A` desliga e `SUB_B` continua ligado, os sinais vindos de `SUB_A` podem ficar indefinidos. Isso pode causar propagação de `X`, corrente indesejada ou comportamento incorreto.

A célula de isolamento faz:

```text
se isolamento ativo:
    saída = valor fixo
senão:
    saída = entrada normal
```

Esse valor fixo é chamado de clamp value (valor de travamento). Pode ser `0` ou `1`, dependendo da intenção de potência.

---

### 3. O Formality verifica `RTL + UPF` contra `gates + UPF'`

Em equivalência tradicional, comparamos:

```text
RTL → gates
```

Em equivalência low-power, comparamos:

```text
RTL + UPF → gates + UPF'
```

O `UPF'` é a versão pós-síntese do UPF, gerada pelo Design Compiler. Ele representa o estado da implementação naquele ponto do fluxo.

Isso é necessário porque a intenção de potência é implementada aos poucos. Algumas estruturas aparecem após síntese; outras após P&R.

---

### 4. Formality e VC LP têm papéis diferentes

O Formality verifica equivalência funcional entre dois designs.

O VC LP verifica regras low-power em um design.

Exemplo de diferença:

- Se a lógica OR virou AND, o Formality detecta diferença funcional.
- Se falta uma isolation cell, o VC LP pode apontar violação de regra.
- Se uma isolation cell existe mas a função total ficou errada, o Formality pode falhar.

Em fluxo real, os dois são necessários.

---

### 5. UPF introduz `X` no modelo de verificação

Quando um domínio desliga, a saída de células desse domínio pode virar `X`.

O Formality modela isso para refletir a semântica IEEE 1801. Portanto, falhas com `X` não devem ser tratadas como falhas comuns imediatamente. Elas podem indicar:

- power domain desligado;
- isolation control errado;
- supply mal conectada;
- power state inválido;
- falta de cutpoint;
- diferença de propagação de `X`.

---

### 6. Os “sabores” de UPF no fluxo

A aula usa nomes como Chocolate, Strawberry e Pistachio para diferenciar versões de UPF.

A leitura prática é:

```text
UPF fonte:
  usado com RTL

UPF' pós-DC:
  usado com gates pós-síntese

UPF'' pós-ICC:
  usado com gates pós-layout/implementação física

PG Netlist:
  power/ground já aparecem explicitamente
```

Não basta ter “um UPF”. É necessário ter o UPF correspondente ao estágio do design.

---

### 7. Como carregar UPF no Formality

O script típico é:

```tcl
set_svf "mydesign.svf"

read_verilog -r RTL.v
set_top top
load_upf -r design_choc.upf

read_verilog -i top_gates.v
set_top top
load_upf -i design_strawberry.upf

match
verify
```

A nota mais importante:

```text
load_upf vem depois de set_top
```

E deve ser carregado no container certo:

```text
-r = referência
-i = implementação
```

---

### 8. `verification_force_upf_supplies_on`

Por padrão:

```tcl
verification_force_upf_supplies_on = true
```

Isso força todas as supplies a ON.

Vantagens:

- verificação inicial mais rápida;
- menos complexidade;
- encontra problemas não relacionados a power mais cedo.

Desvantagem:

- resultado é parcial;
- não verifica todos os power states;
- não serve como sign-off completo de low-power.

Para verificação completa:

```tcl
set verification_force_upf_supplies_on false
```

Esse é um dos pontos mais importantes da aula.

---

### 9. `analyze_upf` e supplies super-restritas

Se uma supply nunca consegue ligar, o Formality pode reportar:

```text
Supply Net ... can never be 1 (ON value)
```

Isso pode ser causado por:

- power states ruins;
- corrupção do UPF;
- feedback;
- restrições incoerentes.

O comando:

```tcl
analyze_upf
```

ajuda a diagnosticar.

---

### 10. Cutpoints em fronteiras de power domains

A variável:

```tcl
verification_insert_upf_isolation_cutpoints true
```

faz o Formality inserir cutpoints em fronteiras de domínios de potência.

Isso reduz complexidade e impede que `X` escape de domínio OFF para domínio ON.

Atenção: quando aparecem compare points do tipo `PDCut`, eles estão ligados a essas fronteiras de power domain.

---

## Conceitos difíceis explicados em profundidade

### Power domain

Um power domain é uma região do design controlada por uma alimentação específica. Pode ter tensão diferente ou pode ser desligada independentemente.

---

### Power gating

Power gating é a técnica de desligar um domínio para reduzir leakage power (potência de fuga). Quando o domínio desliga, seus sinais internos podem perder valor válido.

---

### Isolation cell

Isolation cell é uma célula que força um sinal a um valor conhecido quando o domínio de origem é desligado.

Exemplo conceitual:

```text
SUB_A desligado → ISO força saída para 0 → SUB_B continua estável
```

---

### UPF fonte, UPF' e UPF''

- **UPF fonte:** descreve a intenção original.
- **UPF':** versão pós-Design Compiler.
- **UPF'':** versão pós-IC Compiler.

Cada uma corresponde a um estágio do fluxo.

---

### `X` em UPF

Em UPF, `X` pode representar efeito de power-down. Isso difere de um `X` comum por não inicialização; ele pode ser uma modelagem intencional da perda de alimentação.

---

### CutPin / PDCut

CutPins ou PDCut compare points aparecem quando o Formality corta fronteiras de power domains para reduzir complexidade e controlar propagação de `X`.

---

## Figuras e diagramas importantes

### Diagrama de isolation cells

A figura com `SUB_A` e `SUB_B` mostra por que isolamento é necessário: um domínio desligado não deve dirigir sinais indefinidos para um domínio ligado.

---

### Diagrama RTL + UPF versus gates + UPF'

A figura mostra que o Formality recebe uma combinação de design lógico e power intent. A equivalência não é só entre netlists, mas entre modelos funcionais com intenção de potência aplicada.

---

### Fluxo Synopsys IEEE 1801

A figura mostra que UPF acompanha o design desde RTL até implementação física e signoff. Formality aparece nos pontos de equivalence checking.

---

### Figura de OR virando AND

Essa figura é uma pegadinha conceitual: mesmo com isolamento correto, o Formality detecta a diferença funcional porque a lógica mudou de OR para AND.

---

### Pattern Window com cones UPF

A Pattern Window mostra que, em UPF, os cones podem incluir supply nets como `VSS`, `VDD` e sinais de power state. Isso torna o debug diferente de uma falha puramente booleana.

---

### Matched point window com X em pinos hierárquicos

A matched point window ajuda a localizar rapidamente em qual fronteira hierárquica o `X` aparece, facilitando o debug de power-domain boundary.

---

## Pontos de prova e revisão

1. UPF descreve power intent (intenção de potência), não a função lógica principal.
2. IEEE 1801 é o padrão associado ao UPF.
3. UPF permite manter estruturas low-power fora do RTL.
4. Isolation cells protegem domínios ligados contra sinais vindos de domínios desligados.
5. O Formality compara `RTL + UPF` contra `gates + UPF'`.
6. O UPF deve ser carregado após `set_top`.
7. Use `load_upf -r` para o container de referência.
8. Use `load_upf -i` para o container de implementação.
9. Formality verifica equivalência funcional entre dois designs.
10. VC LP verifica regras low-power e power intent em um design.
11. Power-down pode inserir `X` no design.
12. Diferenças `X` sugerem investigação de UPF, supply, isolamento ou power-down.
13. Diferenças `1/0` podem indicar problema funcional comum.
14. `verification_force_upf_supplies_on` é `true` por padrão.
15. Com supplies forçadas ON, a verificação é parcial.
16. Para verificar todos os power states, use `verification_force_upf_supplies_on false`.
17. `analyze_upf` detecta supplies que nunca ligam por over-constraint.
18. `verification_insert_upf_isolation_cutpoints` insere cutpoints em fronteiras de domínios.
19. Mensagens ATTENTION do Formality devem ser lidas com cuidado.
20. Pattern Window e matched point window ajudam a localizar X em designs UPF.

---

## Relação com projeto/laboratório

Script típico do Design Compiler:

```tcl
set_svf mydesign.svf

read_verilog RTL.v
current_design top

load_upf design_choc.upf

compile_ultra -scan -gate_clock
write -format verilog -hier -out top_gates.v

save_upf design_strawberry.upf
```

Script típico do Formality:

```tcl
set_svf "mydesign.svf"

read_verilog -r RTL.v
set_top top
load_upf -r design_choc.upf

read_verilog -i top_gates.v
set_top top
load_upf -i design_strawberry.upf

match
verify
```

Para verificação completa de power states:

```tcl
set verification_force_upf_supplies_on false
verify
```

Para análise de problemas UPF:

```tcl
analyze_upf
```

---

## Checklist de qualidade

- [x] Texto dos prints foi extraído e organizado.
- [x] Termos UPF foram explicados em português com os nomes originais preservados.
- [x] Scripts de Design Compiler e Formality foram preservados.
- [x] Figuras principais foram interpretadas.
- [x] Conceitos de `X`, isolation cells, UPF flavors e supplies ON foram detalhados.
- [x] O próximo bloco foi indicado conforme o roteiro.

---

## Próximo bloco

- **Bloco:** 065
- **Aula:** 05 Multi-Voltage Designs and UPF — parte B
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\05 Multi-Voltage Designs and UPF.docx
```

- **Conteúdo esperado:** continuação com debug gráfico de UPF, cone schematic, Find X Sources, PDCut/CutPins, hiding supply nets, tech cells, `report_upf`, top-level port assumptions e fechamento da unidade.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\05 Multi-Voltage Designs and UPF_parte_B.md
```
