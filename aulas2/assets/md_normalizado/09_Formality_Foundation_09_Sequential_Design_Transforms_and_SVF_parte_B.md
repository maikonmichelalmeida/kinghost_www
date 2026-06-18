# 09 Sequential Design Transforms and SVF — parte B

## Controle do bloco

- **Bloco:** 072
- **Curso:** 09 Formality Foundation
- **Aula:** 09 Sequential Design Transforms and SVF — parte B
- **Prioridade do roteiro:** média
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\09 Sequential Design Transforms and SVF.docx`
- **Faixa processada conforme roteiro:** slides 23-43
- **Continuação:** mesmo anexo usado na parte A
- **Começa em:** `Register Merging`
- **Termina em:** `Unit Summary`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\09 Sequential Design Transforms and SVF_parte_B.md
```

---

## Resumo executivo

Esta parte B completa a unidade sobre **Sequential Design Transforms and SVF**. A parte A mostrou por que transformações sequenciais são críticas para equivalence checking: elas mexem nos registradores e latches, que são compare points e marcam as fronteiras dos logic cones. Agora a aula continua com transformações sequenciais mais fortes e mais perigosas para debug:

1. **Register merging** — o DC detecta registros equivalentes e mescla em um único registro. O SVF usa `guide_reg_merging`.
2. **Register replication** — o DC duplica um registro para melhorar fanout/timing. O SVF usa `guide_reg_duplication`.
3. **Adaptive retiming** — o DC move registros localmente para reduzir violações de timing, especialmente WNS.
4. **Pipeline retiming** — movimentação maior de registradores de pipeline, geralmente recomendada em fluxo de duas passagens ou por checkpoint verification.
5. **Checkpoint verification** — mecanismo para sincronizar DC e Formality usando netlist intermediária e `guide_checkpoint`.
6. **Clock-gating** — transformação estrutural que insere latch/enable logic para reduzir consumo de clock; é tratada por setup/variáveis, não como os demais transforms puramente por guide commands.
7. **Resumo dos sintomas** — cada problema sequencial tem uma “assinatura” no Formality: tipo de guidance rejeitada, unmatched objects, tipo de register/latch que aparece, padrão na Pattern Window e comportamento na Verification Results Table.

A mensagem principal é: **cada transformação sequencial tem um sintoma distintivo**. Se você sabe ler a Guidance Summary, Match Summary, Verification Results Table, `report_svf_operation`, `report_unmatched_points`, `analyze_points` e Pattern Window, consegue diagnosticar falso negativo rapidamente sem depurar um cone aleatório às cegas.

---

## Texto extraído e organizado por slide

### Slide 23 — Register Merging

Figura:

O slide mostra dois registradores equivalentes no lado original. Depois do Design Compiler, eles são substituídos por um único registrador que alimenta as duas lógicas downstream.

Texto extraído:

- **What DC does by default**
  - Recognises equivalent registers and if beneficial to QoR merges them.
  - Writes out a `guide_reg_merging` command.
- **What Formality does**
  - With the `guide_reg_merging` command, verifies that the merging register is equivalent, then if successful, merges register.

Interpretação:

**Register merging** acontece quando dois ou mais registradores sempre carregam o mesmo valor e são funcionalmente equivalentes. O Design Compiler pode reduzir área e potência substituindo esses registros por apenas um.

Exemplo conceitual:

```text
Antes:
  reg_a e reg_b recebem a mesma função.

Depois:
  um único registro alimenta os lugares onde reg_a e reg_b eram usados.
```

Para o Formality, isso é uma transformação sequencial porque um compare point desaparece. Se o Formality não souber que o desaparecimento foi uma mesclagem válida, ele verá um DFF faltando e a verificação pode falhar.

O comando SVF associado é:

```text
guide_reg_merging
```

---

### Slide 24 — Summary: Register merging

Texto extraído:

Possible next steps:

```tcl
report_svf_operation -status rejected -command reg_merging
```

```text
Single point verify
```

Sintomas destacados no fluxograma:

- **Guidance Summary**
  - Possible rejected `reg_merging`.
- **Match Summary**
  - Unmatched non-constant register.
- **Verification Results Table**
  - Everything that unmatched register drives will fail.
- **analyze_points**
  - Will point out rejected `reg_merging` or unmatched input.
- **Pattern Window**
  - Failing stimulus opposite values.
- Caixa:
  - Further details in Appendix.

Interpretação:

Quando `guide_reg_merging` é rejeitado, o Formality não reconhece que um registro sumiu porque foi mesclado com outro equivalente.

Sintoma típico:

```text
Unmatched non-constant register
```

Isso é diferente de um constant register. No constant register, o registro sumiu porque virou constante. No register merging, o registro sumiu porque outro registro equivalente assumiu sua função.

Fluxo de diagnóstico:

```tcl
report_svf_operation -status rejected -command reg_merging
report_unmatched_points
analyze_points -fail
```

Se necessário, faça verificação pontual para confirmar equivalência entre o registro que foi mantido e o registro que foi removido.

---

### Slide 25 — Register Replication

Figura:

O lado original mostra um registrador alimentando lógica downstream. Depois do DC, o registrador aparece duplicado, alimentando ramos diferentes.

Texto extraído:

- **What DC can do** — see Appendix for details.
  - Writes out a `guide_reg_duplication` command.
- **What Formality does**
  - With the `guide_reg_duplication`, effectively duplicates the register.
  - That is a register that is constrained to take the same value as original register.

Interpretação:

**Register replication** é o oposto visual do register merging. Em vez de reduzir registros, o DC cria cópias de um registro.

Motivação:

- reduzir fanout;
- melhorar timing;
- aproximar fisicamente cargas diferentes;
- permitir otimizações independentes por região.

Exemplo:

```text
Antes:
  reg_a alimenta muitos destinos.

Depois:
  reg_a_1 alimenta um grupo de destinos.
  reg_a_2 alimenta outro grupo.
```

Funcionalmente, as cópias devem ter o mesmo valor do registro original. O SVF informa isso ao Formality com:

```text
guide_reg_duplication
```

O Formality então trata a cópia como vinculada ao registro original.

---

### Slide 26 — Summary: Register Replication

Texto extraído:

Possible next steps:

```tcl
report_svf_operation -status rejected -command reg_duplication
set_user_match
```

Sintomas no fluxograma:

- **Guidance Summary**
  - Possible rejected `reg_duplication`.
- **Match Summary**
  - Unmatched non-constant in Impl.
- **Verification Results Table**
  - Everything that unmatched Impl register drives will fail.
- **analyze_points**
  - Will point out rejected `reg_duplication` or unmatched input.
- **Pattern Window**
  - Failing stimulus opposite values.
- Caixa:
  - Further details in Appendix.

Interpretação:

O sintoma distintivo de register replication é que o registro extra aparece na **implementação**.

Comparação com register merging:

| Transformação | Sintoma típico |
|---|---|
| Register merging | unmatched non-constant register na referência |
| Register replication | unmatched non-constant register na implementação |

Isso faz sentido:

- no merging, a referência tem mais registros que a implementação;
- na replication, a implementação tem mais registros que a referência.

Próximos passos:

```tcl
report_svf_operation -status rejected -command reg_duplication
```

Se necessário, usar matching manual:

```tcl
set_user_match
```

Mas o ideal é corrigir o SVF/setup para que a guidance seja aceita.

---

## Retiming

### Slide 27 — Adaptive Retiming

Figura:

O slide mostra um caminho com registradores e blocos combinacionais `A` e `B`. Antes da transformação, há violações de setup:

```text
Setup slack = -0.12ns
Setup slack = -0.04ns
```

Depois do adaptive retiming, o slack melhora:

```text
Setup slack = +0.07ns
Setup slack = -0.01ns
```

Texto extraído:

```tcl
compile_ultra -retime
```

Caixa verde:

```text
Invokes local “adaptive retiming”, which moves registers to reduce critical timing violations (WNS)
```

Anotação:

```text
Distinctively named R_# registers
```

Interpretação:

**Adaptive retiming** move registradores localmente para melhorar timing, especialmente o pior slack negativo (**WNS — Worst Negative Slack**).

A lógica básica é:

```text
se um caminho antes do registrador está muito longo,
mova o registrador para redistribuir lógica entre estágios.
```

Isso altera fronteiras sequenciais, por isso é uma das transformações mais difíceis para equivalence checking. Registradores podem aparecer com nomes distintos, como:

```text
R_#
```

Esses nomes são uma pista visual no Match Summary e em relatórios.

O comando de síntese típico destacado é:

```tcl
compile_ultra -retime
```

---

### Slide 28 — Optimization Phases of Pipeline Retiming

Texto extraído:

- Pipeline or Register retiming makes large movements of pipeline registers.
- **Phases**
  - **Mapping**
    - Register retiming only works on a mapped netlist.
  - **Min-period**
    - Pipelines globally moved such the slack to pipeline stages same.
  - **Min-area**
    - Pipe lines adjusted so that still meet timing but minimum area used, i.e. number of registers reduced.
    - Key stage to minimize area and power.
  - Subsequent incremental optimization possibly including adaptive retiming.

Interpretação:

Pipeline retiming é mais amplo que adaptive retiming. Ele pode mover registradores de pipeline por regiões maiores do design.

A aula separa em fases:

#### 1. Mapping

Retiming funciona em netlist mapeada. Ou seja, primeiro o design precisa estar em gates/células.

#### 2. Min-period

Move registradores globalmente para balancear slack entre estágios e atingir menor período possível.

#### 3. Min-area

Depois de atender timing, ajusta pipelines para reduzir área e potência, muitas vezes reduzindo quantidade de registros.

#### 4. Incremental optimization

Após grandes movimentos, pode haver otimizações incrementais, inclusive adaptive retiming.

Mensagem importante:

```text
Retiming altera muito a estrutura sequencial.
```

---

### Slide 29 — Optimization Phases of pure Pipeline Retiming

Figura:

A figura mostra:

- design mapeado com input delay de `2 ns`;
- parâmetros:
  - `clock period = 10 ns`
  - `clk->q delay = 1 ns`
  - `setup time = 1 ns`
- fase **Min-period Retiming**
  - estágios com tempos como `6.0`, `7.0`, `7.0`.
- fase **Min-area Retiming**
  - tempos como `5.5`, `8.0`, `6.5`.
- Caixa:
  - `Register name change fred[*] -> clock_name_r_REG[#]_S#`
- Legenda:
  - Resulting design meets timing while the area is minimized.

Interpretação:

Este slide mostra visualmente que pipeline retiming muda a posição dos registradores e também seus nomes.

A mudança de nomes é distintiva:

```text
fred[*] → clock_name_r_REG[#]_S#
```

ou formas semelhantes com `REG#_S#`.

Isso é importante para debug porque no Match Summary podem aparecer registradores com nomes gerados pelo retiming. Se esses nomes aparecem unmatched, é uma pista forte de problema de retiming.

O objetivo da otimização é duplo:

1. atender timing;
2. minimizar área/potência depois de atender timing.

---

### Slide 30 — Design Compiler Flow: 2 Pass Flow

Figura do fluxo:

```text
RTL
↓
Read and elaborate RTL
↓
First Compile
↓
Optimize_registers
↓
...
```

Saídas:

```text
First Netlist
Pipelined Netlist
```

Verificações:

```text
RTL → First Netlist
First Netlist → Pipelined Netlist
```

Caixa amarela:

```text
For pipeline retiming recommended to break down the implementation to 2 stages
(This is sometimes called the two pass flow)

1) Mapping the design
2) Pipeline retiming with optimize_registers
```

Interpretação:

Para pipeline retiming, a recomendação é quebrar o fluxo em duas etapas:

1. **Mapear o design**
   - RTL para `first.v`.

2. **Rodar pipeline retiming**
   - `optimize_registers` para gerar `opt_reg.v`.

Isso facilita debug e reduz complexidade, porque a verificação é dividida:

```text
RTL → first.v
first.v → opt_reg.v
```

Em vez de tentar provar:

```text
RTL → opt_reg.v
```

de uma vez.

Essa ideia se conecta diretamente à aula de **Multi-Stage Verifications and SVF**.

---

### Slide 31 — Example DC and Formality two pass flow script

Script DC extraído e organizado:

```tcl
# Example Design Compiler script
set_svf first_compile.svf
compile_ultra
write -format verilog -hier -out first.v

set_svf opt_reg.svf
optimize_registers -no_compile
write -format verilog -hier -out opt_reg.v

set_svf incremental.svf
compile_ultra -inc
write -format verilog -hier -out inc.v
```

Script Formality para pipeline retiming stage:

```tcl
# Formality script for pipeline
# retiming stage
set_svf opt_reg.svf

read_verilog -r first.v
set_top mydesign

read_verilog -i opt_reg.v
set_top mydesign
```

Interpretação:

Este slide operacionaliza o fluxo de duas passagens.

No Design Compiler:

- `first_compile.svf` registra a primeira compilação;
- `opt_reg.svf` registra o retiming com `optimize_registers`;
- `incremental.svf` registra otimização incremental posterior.

No Formality, para verificar especificamente a etapa de retiming:

```text
Ref = first.v
Impl = opt_reg.v
SVF = opt_reg.svf
```

Isso é exatamente a lógica multi-stage:

```text
SVF certo para a etapa certa.
```

---

### Slide 32 — Checkpoint Verification: 1 Pass Flow

Texto extraído:

- New mechanism for FM and DC to “Sync up”.
  - Utilizes an Intermediate Representation.
  - Reduces Verification Complexity.
  - Establishes concordance between FM and DC.
  - Single fully automated verification flow.
  - Reduces the inherent complexity of two-pass verification.
  - Results in higher completion rates, and enables better QoR.

Interpretação:

Checkpoint verification é um mecanismo para sincronizar DC e Formality sem exigir que o usuário quebre manualmente tudo em duas passagens.

A ideia é que o DC cria uma representação intermediária para ajudar o Formality a entender grandes transformações, especialmente retiming e outras operações sequenciais complexas.

Benefícios:

- reduz complexidade de verificação;
- melhora concordância entre FM e DC;
- reduz complexidade operacional do fluxo two-pass;
- melhora taxa de conclusão;
- permite melhor QoR, porque o DC pode otimizar mais sem tornar a verificação impraticável.

---

### Slide 33 — Checkpoint Verification

Texto extraído:

- The Design Compiler tool creates an intermediate netlist and writes the `guide_checkpoint` guidance command to the SVF file when:
  - Retiming a design using the `set_optimize_registers` command before running the `compile_ultra` command.
  - Performing placement-aware multibit mapping of replicated registers, using `create_register_bank` command.

Interpretação:

Checkpoint verification usa:

```text
guide_checkpoint
```

O DC cria uma netlist intermediária e grava guidance no SVF para ajudar o Formality.

Casos citados:

1. Retiming usando:

```tcl
set_optimize_registers
```

antes de:

```tcl
compile_ultra
```

2. Placement-aware multibit mapping de registros replicados usando:

```tcl
create_register_bank
```

Essa guidance é importante porque dá ao Formality um ponto intermediário de sincronização.

---

### Slide 34 — Diagnosis: Adaptive or pipeline retiming

Texto extraído do fluxograma:

Possible next steps:

```text
Identifying missing SVF or naming issues
```

Sintomas:

- **Guidance Summary**
  - Possible rejected `*tim*`.
- **Match Summary**
  - Unmatched registers with `R_#` names or `REG#_S#` names.
- **Verification Results Table**
  - Everything that unmatched register drives will fail.

Interpretação:

Retiming tem sintomas próprios.

Na Guidance Summary, procure rejeições com padrão:

```text
*tim*
```

Isso pode incluir guidance relacionada a retiming.

No Match Summary, procure nomes distintivos:

```text
R_#
REG#_S#
```

Se esses registradores aparecem unmatched, o problema provavelmente é retiming, missing SVF, SVF errado ou naming issue.

A consequência no verify:

```text
Tudo que o registrador unmatched dirige pode falhar.
```

Próximo passo:

```text
investigar SVF e naming
```

---

## Clock Gating

### Slide 35 — Clock-Gating

Figura:

Antes de clock-gating:

```text
CLK → Register
Enable/Data In → Data Out
```

Depois de clock-gating:

```text
Enable → latch/control logic → clock gate → clken → Register Bank
CLK entra na lógica de clock gating
```

Interpretação:

Clock-gating é uma transformação para reduzir potência dinâmica. Em vez de deixar o clock alternar sempre no registrador, o circuito controla quando o clock chega ao banco de registradores.

Antes:

```text
registrador recebe clock sempre
enable controla dado ou mux
```

Depois:

```text
enable controla o clock
clock só alterna quando necessário
```

Isso reduz consumo porque clock tree e flops deixam de alternar quando não precisam.

Mas para o Formality, isso muda a estrutura do circuito:

- aparece latch de clock gating;
- aparece lógica no caminho de clock;
- o clock input do register bank muda;
- surgem compare points que não existiam no RTL.

---

### Slide 36 — Clock-Gating: Why Is It an Issue?

Texto extraído:

- Without intervention failing compare points will result.
  - A compare point will be created for the clock-gating latch.
    - This compare point does not have a matching point in the other design and will fail.
  - The logic feeding the clock input of the register bank has changed.
    - The register bank compare points will fail.

Interpretação:

Sem setup adequado, clock-gating causa falhas por dois motivos:

1. O latch de clock-gating vira compare point na implementação, mas não existe na referência.

```text
unmatched LAT in Impl
```

2. O clock que alimenta o banco de registradores deixa de ser o clock simples original. Agora passa por lógica de gating.

```text
clock input logic changed
```

Sem o Formality reconhecer clock-gating, os registradores alimentados por esse clock podem falhar em grande quantidade.

---

### Slide 37 — Verification Setup Issues: Clock-gating

Texto extraído:

- **Clock-gating**
  - How to recognize it:
    - Large number of unmatched LAT reported in the IMPL design in the matching summary table.
    - Logic cone debugging shows differences with clock.
- Use variable:

```tcl
set verification_clock_gate_hold_mode any
```

  - Typical setting that allows for both low and high clock-gating in the same design.
  - Automatically picked up from SVF with:

```tcl
synopsys_auto_setup true
```

- There is also the option of using a different clock gating detection algorithm:

```tcl
set verification_clock_gate_edge_analysis true
```

Interpretação:

Sintomas de clock-gating:

```text
muitos unmatched LAT na implementação
diferenças envolvendo clock no logic cone
```

Configuração principal:

```tcl
set verification_clock_gate_hold_mode any
```

Essa configuração permite que o Formality reconheça clock-gating tanto em polaridade baixa quanto alta no mesmo design.

Com:

```tcl
set synopsys_auto_setup true
```

essa informação pode ser capturada automaticamente a partir do SVF.

Opção alternativa:

```tcl
set verification_clock_gate_edge_analysis true
```

Isso muda o algoritmo de detecção de clock-gating.

---

### Slide 38 — Clock-Gating: Example

Figura:

Referência:

```verilog
module fred (a, clk, en, z);
input a, clk, en;
output reg z;

always @(posedge clk)
begin
  if (en)
    z <= a;
end
endmodule
```

Implementação com clock-gating:

- `en_lat`
- `clk_out = clk & en_lat`
- `always @(posedge clk_out)`
- latch de enable com sensibilidade semelhante a:

```verilog
always @(clk or en)
  if (!clk)
    en_lat = en;
```

Script:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred_cg.v
set_top fred

set verification_clock_gate_hold_mode any
verify
```

Anotações:

```text
Tell Formality to look for clock-gating
Clock-gate recognized in Impl
```

Interpretação:

O exemplo mostra uma transformação clássica:

RTL funcional:

```text
se en = 1, atualiza z no clock
```

Implementação clock-gated:

```text
enable é amostrado em latch
clock é mascarado/gated
registrador atualiza no clock gated
```

Para que o Formality reconheça equivalência, é necessário dizer que ele deve procurar clock-gating:

```tcl
set verification_clock_gate_hold_mode any
```

Quando reconhecido, o latch de clock-gating não é tratado como erro funcional comum.

---

### Slide 39 — Summary: Clock Gating

Texto extraído:

Possible next steps:

```tcl
set verification_clock_gate_hold_mode any
```

ou:

```tcl
set verification_clock_gate_edge_analysis true
```

Sintomas:

- **Match Summary**
  - Unmatched LAT in Impl.
  - Expecting unmatched LATCG.
- **Verification Results Table**
  - Everything LAT drives will fail.
  - So possibly a very large number of failing points.
- **Pattern Window**
  - Distinctive failure with clocking.

Interpretação:

Clock-gating pode gerar muitas falhas, porque um latch ou clock gate alimenta muitos registradores. Se a lógica de clock não é reconhecida, todos os registradores afetados podem falhar.

Assinatura de clock-gating:

```text
muitos LAT unmatched na implementação
falhas em massa downstream
Pattern Window com comportamento de clock distinto
```

Próximos passos:

```tcl
set verification_clock_gate_hold_mode any
```

ou:

```tcl
set verification_clock_gate_edge_analysis true
```

---

## Resumos finais da unidade

### Slide 40 — Summary of sequential transforms

Tabela extraída:

| Transform | Setup | Command |
|---|---|---|
| Constant register removal | DC SVF | `guide_reg_constant` |
| Unread register removal | None | — |
| Register merging | DC SVF | `guide_reg_merging` |
| Register replication | DC SVF | `guide_reg_duplication` |
| Phase inversion | DC SVF | `guide_inv_push` |
| Adaptive retiming | DC SVF | `guide_*tim*` |
| Pipeline retiming | DC SVF | `guide_*tim*` |
| Clock gating | variable passed in SVF | — |

Interpretação:

A tabela resume como cada transformação é tratada.

Padrão geral:

- quase todas as transformações sequenciais não-clock-gating dependem de SVF;
- unread register removal não exige setup;
- clock-gating depende de variáveis/setup, que podem ser passadas pelo SVF e por `synopsys_auto_setup`.

Essa tabela é excelente para revisão antes de questões ou debugging prático.

---

### Slide 41 — Most distinctive feature of sequential issues

Texto extraído:

- **Constant register** — rejected `reg_constant`
  - Pattern failure with “constant” register opposite to constant value.
- **Reg merging** — rejected `reg_merging`
  - Unmatched non-constant reg in Ref.
- **Reg replication** — rejected `reg_replication`
  - Unmatched non-const reg in Impl.
- **Phase Inversion** — rejected `inv_push`
  - Failing register with all patterns failing.
- **Adaptive or Pipeline retiming** — rejected `*tim*`
  - Unmatched or failing `R_#` or `REG#_S#` registers.
- **Clock gating**
  - Unmatched LAT in Impl.
- **Test inserted registers or latches**
  - Unmatched LAT or DFF in Impl with distinctive names, e.g. `LOCKUP`.

Interpretação:

Esse slide é um guia de diagnóstico rápido. Cada problema tem uma assinatura:

| Problema | Sintoma distintivo |
|---|---|
| Constant register | `reg_constant` rejected; padrão contradiz valor constante |
| Reg merging | non-constant reg unmatched na referência |
| Reg replication | non-constant reg unmatched na implementação |
| Phase inversion | `inv_push` rejected; todos os padrões falham |
| Retiming | `*tim*` rejected; nomes `R_#` ou `REG#_S#` |
| Clock gating | unmatched LAT na implementação |
| Test insertion | unmatched DFF/LAT com nomes típicos como `LOCKUP` |

A aula quer que o aluno reconheça esses padrões sem precisar depurar tudo manualmente.

---

### Slide 42 — Verification Setup Issues: Matching Results Summary Table

Tabela de Matching Results:

```text
24774 Compare points matched by name
66 Compare points matched by signature analysis
0 Compare points matched by topology
1837 Matched primary inputs, black-box outputs
805(977) Unmatched reference(implementation) compare points
0(0) Unmatched reference(implementation) primary inputs, black-box outputs
26841(0) Unmatched reference(implementation) unread points
```

Unmatched Objects:

```text
Cut-points (Cut): REF 68, IMPL 0
Registers: REF 737, IMPL 977
DFF: REF 72, IMPL 0
Clock-gate LAT: REF 0, IMPL 959
Constant 0: REF 659, IMPL 0
Constant 1: REF 6, IMPL 18
```

Anotações do slide:

- 66 matched by signature analysis:
  - Probably OK but worth investigating.
- Cut-points/undriven:
  - These undriven signals may cause problems.
- DFF unmatched:
  - These unmatched registers might be a problem — or may be okay if actually unread.
- Clock-gate LAT and constants:
  - No problem with these unmatched registers.
- Legenda:
  - Foundation to read and interpret the match summary more confidently.

Interpretação:

Este slide aplica tudo à leitura da Match Summary.

Pontos importantes:

#### 1. Muitos pontos casados por nome

```text
24774 matched by name
```

Isso é bom, especialmente em fluxo com SVF correto.

#### 2. Signature analysis

```text
66 matched by signature analysis
```

Provavelmente ok, mas vale investigar. Pode indicar nome diferente ou match não trivial.

#### 3. Unmatched DFF em referência

```text
DFF REF 72
```

Pode ser problema, a menos que sejam unread ou constantes identificados corretamente.

#### 4. Clock-gate LAT na implementação

```text
Clock-gate LAT IMPL 959
```

Provavelmente normal se clock-gating foi inserido e reconhecido.

#### 5. Constant 0/1

Constantes unmatched podem ser normais quando registradores foram removidos como constantes.

Mensagem:

```text
A tabela de Match Summary só é útil se você souber interpretar o tipo dos objetos.
```

---

### Slide 43 — Unit Summary

Texto extraído:

- All the non-clock gating sequential transforms are handled by SVF commands.
- For clock gating Formality when enabled will automatically identify the structural changes.
- Issues with each will show up in a distinctive way in Formality.

Interpretação:

Resumo final da unidade:

1. Transformações sequenciais não relacionadas a clock-gating são tratadas por SVF:
   - `guide_reg_constant`;
   - `guide_reg_merging`;
   - `guide_reg_duplication`;
   - `guide_inv_push`;
   - `guide_*tim*`.

2. Clock-gating é reconhecido estruturalmente quando o modo correto está habilitado.

3. Cada problema tem assinatura própria. O objetivo do engenheiro é reconhecer o sintoma e ir direto à causa provável.

---

## Aula didática desenvolvida

### 1. Register merging e register replication são opostos

No **register merging**, a implementação tem menos registradores:

```text
Ref: dois registradores equivalentes
Impl: um registrador
```

Sintoma:

```text
unmatched non-constant reg in Ref
```

No **register replication**, a implementação tem mais registradores:

```text
Ref: um registrador
Impl: duas cópias
```

Sintoma:

```text
unmatched non-constant reg in Impl
```

Essa simetria ajuda muito em questões e debug.

---

### 2. `guide_reg_merging` e `guide_reg_duplication`

Esses dois comandos SVF são críticos.

Se aceitos, o Formality entende a transformação. Se rejeitados, surgem unmatched registers e falhas downstream.

Comandos de diagnóstico:

```tcl
report_svf_operation -status rejected -command reg_merging
report_svf_operation -status rejected -command reg_duplication
```

Se necessário:

```tcl
set_user_match
```

Mas, como regra, primeiro investigue por que a guidance foi rejeitada: SVF errado, naming, top, hierarquia, etapa errada ou validade.

---

### 3. Retiming é mais agressivo que merging/replication

Retiming move registradores no tempo e no espaço lógico. Isso altera drasticamente os boundaries.

Adaptive retiming é local:

```text
mover registros para reduzir violações críticas de timing
```

Pipeline retiming é maior:

```text
mover registros de pipeline globalmente
```

Sintomas de retiming:

```text
rejected *tim*
unmatched R_# registers
unmatched REG#_S# registers
```

---

### 4. Fluxo two-pass para pipeline retiming

Pipeline retiming pode ser complexo demais se você tenta verificar tudo de uma vez.

Por isso, a aula recomenda quebrar em etapas:

```text
RTL → first.v
first.v → opt_reg.v
opt_reg.v → inc.v
```

Cada etapa usa seu SVF:

```text
first_compile.svf
opt_reg.svf
incremental.svf
```

Isso reduz a complexidade e facilita debug.

---

### 5. Checkpoint verification simplifica o fluxo

Checkpoint verification cria um ponto intermediário automaticamente para sincronizar DC e FM.

Em vez de o usuário construir manualmente todo o fluxo two-pass, o DC pode escrever:

```text
guide_checkpoint
```

no SVF.

Isso ajuda o Formality a lidar com transformações grandes e aumenta completion rate.

---

### 6. Clock-gating é diferente dos outros transforms

A maioria dos transforms sequenciais usa guide commands. Clock-gating depende de detecção estrutural e setup.

Comando principal:

```tcl
set verification_clock_gate_hold_mode any
```

Alternativa:

```tcl
set verification_clock_gate_edge_analysis true
```

Com `synopsys_auto_setup true`, muita coisa pode vir automaticamente do SVF.

Sintoma:

```text
muitos unmatched LAT na implementação
falhas de clocking na Pattern Window
```

---

### 7. Como ler a Match Summary depois desta aula

Depois desta unidade, a Match Summary deixa de ser uma tabela assustadora e vira uma fonte de diagnóstico.

Perguntas:

```text
Unmatched DFF em Ref: merging? constant? unread?
Unmatched DFF em Impl: replication? scan?
Unmatched LAT em Impl: clock-gating?
Nomes R_# ou REG#_S#: retiming?
Constantes: reg_constant aceito?
```

Essa é a habilidade principal da aula.

---

## Conceitos difíceis explicados em profundidade

### Register merging

Mesclagem de registros equivalentes. Reduz área/potência e pode melhorar QoR. Depende de `guide_reg_merging`.

---

### Register replication

Duplicação de registro para reduzir fanout e melhorar timing. Depende de `guide_reg_duplication`.

---

### Adaptive retiming

Movimento local de registradores para melhorar WNS. Pode criar nomes `R_#`.

---

### Pipeline retiming

Movimento amplo de registradores de pipeline. Pode envolver fases de mapping, min-period e min-area.

---

### Checkpoint verification

Mecanismo em que DC cria representação intermediária e escreve `guide_checkpoint` no SVF para sincronizar com Formality.

---

### Clock-gating

Transformação de potência que controla o clock para evitar toggling desnecessário. Insere latch/logic de clock-gating e pode gerar unmatched LAT na implementação.

---

### `verification_clock_gate_hold_mode any`

Configuração que permite ao Formality reconhecer clock-gating de polaridade baixa e alta no mesmo design.

---

### `verification_clock_gate_edge_analysis`

Algoritmo alternativo de detecção de clock-gating.

---

### `guide_*tim*`

Família de guidance relacionada a retiming/adaptive/pipeline timing transformations.

---

## Comandos importantes

### Register merging

```tcl
report_svf_operation -status rejected -command reg_merging
```

### Register replication

```tcl
report_svf_operation -status rejected -command reg_duplication
set_user_match
```

### Retiming

```tcl
compile_ultra -retime
optimize_registers -no_compile
set_optimize_registers
report_svf_operation -status rejected
```

Procurar rejeições do tipo:

```text
*tim*
```

### Two-pass flow — Design Compiler

```tcl
set_svf first_compile.svf
compile_ultra
write -format verilog -hier -out first.v

set_svf opt_reg.svf
optimize_registers -no_compile
write -format verilog -hier -out opt_reg.v

set_svf incremental.svf
compile_ultra -inc
write -format verilog -hier -out inc.v
```

### Two-pass flow — Formality

```tcl
set_svf opt_reg.svf

read_verilog -r first.v
set_top mydesign

read_verilog -i opt_reg.v
set_top mydesign
```

### Checkpoint verification

```text
guide_checkpoint
```

Comandos relacionados no DC:

```tcl
set_optimize_registers
compile_ultra
create_register_bank
```

### Clock-gating

```tcl
set verification_clock_gate_hold_mode any
set verification_clock_gate_edge_analysis true
```

---

## Tabela de diagnóstico rápido

| Transformação | Guidance/setup | Sintoma distintivo |
|---|---|---|
| Constant register removal | `guide_reg_constant` | rejected `reg_constant`; valor oposto na Pattern Window |
| Unread register removal | nenhum | `unread` matched/unmatched; não verificado por default |
| Register merging | `guide_reg_merging` | unmatched non-constant reg in Ref |
| Register replication | `guide_reg_duplication` | unmatched non-constant reg in Impl |
| Phase inversion | `guide_inv_push` | registrador falha para todos os padrões |
| Adaptive retiming | `guide_*tim*` | `R_#` unmatched/failing |
| Pipeline retiming | `guide_*tim*` | `REG#_S#` unmatched/failing |
| Clock-gating | variável/setup via SVF | unmatched LAT in Impl |
| Test inserted registers/latches | scan/test guidance | unmatched DFF/LAT com nomes como `LOCKUP` |

---

## Figuras e diagramas importantes

### Register Merging

Mostra dois DFFs equivalentes virando um só. A ideia visual é “dois para um”.

---

### Register Replication

Mostra um DFF virando duas cópias. A ideia visual é “um para dois”.

---

### Adaptive Retiming

Mostra slack negativo melhorando após mover registradores. Os nomes `R_#` são pista importante.

---

### Pure Pipeline Retiming

Mostra fases min-period e min-area, com redistribuição de registradores para atender timing e reduzir área.

---

### DC Flow: 2 Pass Flow

Mostra por que pipeline retiming deve ser quebrado em duas etapas: mapping e optimize_registers.

---

### Scripts DC/Formality two-pass

Mostram como alinhar SVF e netlist por etapa: `first_compile.svf`, `opt_reg.svf`, `incremental.svf`.

---

### Checkpoint Verification

Mostra mecanismo novo para sincronizar FM e DC usando representação intermediária e `guide_checkpoint`.

---

### Clock-Gating

Mostra a transformação de enable/data logic para clock-gated register bank.

---

### Summary of sequential transforms

Tabela central para revisão, conectando transform, setup e command.

---

### Matching Results Summary Table

Mostra como interpretar unmatched DFFs, LATs de clock-gating, constantes e signature analysis.

---

## Pontos de prova e revisão

1. Register merging mescla registros equivalentes.
2. DC escreve `guide_reg_merging` para register merging.
3. Se `reg_merging` é rejeitado, pode aparecer unmatched non-constant register na referência.
4. Tudo que o registro unmatched dirige pode falhar.
5. Register replication duplica registros.
6. DC escreve `guide_reg_duplication` para replication.
7. Se `reg_duplication` é rejeitado, pode aparecer unmatched non-constant register na implementação.
8. `set_user_match` pode ajudar em alguns casos de replication.
9. Adaptive retiming move registros localmente para reduzir WNS.
10. `compile_ultra -retime` invoca adaptive retiming.
11. Retiming pode criar registradores com nomes `R_#`.
12. Pipeline retiming move grandes conjuntos de registradores de pipeline.
13. Retiming só funciona sobre mapped netlist.
14. Min-period retiming balanceia slack entre estágios.
15. Min-area retiming reduz área/potência mantendo timing.
16. Pipeline retiming pode gerar nomes `REG#_S#`.
17. Para pipeline retiming, recomenda-se fluxo two-pass.
18. Two-pass separa mapping e `optimize_registers`.
19. No two-pass, use SVF correspondente a cada etapa.
20. Para verificar retiming stage, compare `first.v` contra `opt_reg.v` usando `opt_reg.svf`.
21. Checkpoint verification cria representação intermediária.
22. Checkpoint verification usa `guide_checkpoint`.
23. `guide_checkpoint` pode ser gerado com `set_optimize_registers` antes de `compile_ultra`.
24. `guide_checkpoint` também pode ser usado com `create_register_bank`.
25. Retiming problem aparece como rejected `*tim*`.
26. Retiming problem pode aparecer como unmatched `R_#` ou `REG#_S#`.
27. Clock-gating insere latch e lógica no caminho de clock.
28. Sem setup, latch de clock-gating vira compare point unmatched.
29. Sem setup, registradores do banco clock-gated podem falhar.
30. Sintoma de clock-gating: muitos unmatched LAT na implementação.
31. Use `verification_clock_gate_hold_mode any` para reconhecer clock-gating.
32. `synopsys_auto_setup true` pode pegar clock-gating automaticamente via SVF.
33. Opção alternativa: `verification_clock_gate_edge_analysis true`.
34. Clock-gating pode gerar grande número de failing points.
35. Constant registers e clock-gating LATs unmatched podem ser normais.
36. Unmatched DFFs não constantes precisam ser investigados.
37. Muitos matches por signature analysis podem ser ok, mas valem investigação.
38. A Match Summary deve ser lida por tipo de objeto, não só por número.
39. Cada issue sequencial tem uma assinatura distinta.
40. O objetivo é diagnosticar falso negativo rapidamente no match stage.

---

## Relação com projeto/laboratório

### Fluxo para register merging

```tcl
# Após match
report_svf_operation -status rejected -command reg_merging
report_unmatched_points
analyze_points -fail
```

### Fluxo para register replication

```tcl
report_svf_operation -status rejected -command reg_duplication
report_unmatched_points
analyze_points -fail
```

### Fluxo para retiming

```tcl
# Verificar Guidance Summary por rejected *tim*
report_svf_operation -status rejected
report_unmatched_points
```

Procurar nomes:

```text
R_#
REG#_S#
```

### Fluxo two-pass para pipeline retiming

Design Compiler:

```tcl
set_svf first_compile.svf
compile_ultra
write -format verilog -hier -out first.v

set_svf opt_reg.svf
optimize_registers -no_compile
write -format verilog -hier -out opt_reg.v
```

Formality:

```tcl
set_svf opt_reg.svf

read_verilog -r first.v
set_top mydesign

read_verilog -i opt_reg.v
set_top mydesign

match
verify
```

### Fluxo para clock-gating

```tcl
set verification_clock_gate_hold_mode any
verify
```

ou:

```tcl
set verification_clock_gate_edge_analysis true
verify
```

Com auto setup:

```tcl
set synopsys_auto_setup true
set_svf design.svf
```

---

## Checklist de qualidade

- [x] Bloco 072 processado como continuação do Bloco 071.
- [x] Conteúdo cobriu de `Register Merging` até `Unit Summary`.
- [x] Texto dos prints foi extraído e organizado.
- [x] Figuras de merging, replication, retiming, checkpoint e clock-gating foram interpretadas.
- [x] Comandos Tcl e SVF foram preservados.
- [x] Sintomas distintivos de cada transformação foram organizados.
- [x] Tabela de diagnóstico rápido foi criada.
- [x] Próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 073
- **Aula:** 10 Other Design Transforms and SVF — parte A
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\10 Other Design Transforms and SVF.docx
```

- **Processar somente:** slides 1-16
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\10 Other Design Transforms and SVF_parte_A.md
```

- **Próximo depois dele:** Bloco 074 — `10 Other Design Transforms and SVF - parte B`
