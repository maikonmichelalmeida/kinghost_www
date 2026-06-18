# 09 Sequential Design Transforms and SVF — parte A

## Controle do bloco

- **Bloco:** 071
- **Curso:** 09 Formality Foundation
- **Aula:** 09 Sequential Design Transforms and SVF — parte A
- **Prioridade do roteiro:** alta
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\09 Sequential Design Transforms and SVF.docx`
- **Faixa processada conforme roteiro:** slides 1-21
- **Observação sobre o anexo:** o DOCX renderiza duas telas/slides por página. Esta parte A cobre da abertura da unidade até **Summary: Phase Inversion**. A parte B deve começar em **Register Merging**.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\09 Sequential Design Transforms and SVF_parte_A.md
```

---

## Resumo executivo

Esta aula aprofunda um dos temas mais importantes do Formality: **transformações sequenciais** feitas pelo Design Compiler e como o Formality consegue verificá-las, principalmente por meio do **SVF**.

Até agora, as aulas anteriores mostraram que o `match` e o `verify` dependem de compare points como registradores, latches, outputs e cutpoints. Agora a unidade mostra por que as otimizações sequenciais são tão delicadas: elas mexem exatamente nos elementos que definem as fronteiras dos cones lógicos. Em outras palavras, se o Design Compiler remove, mescla, duplica, inverte fase ou move registradores, ele muda onde os logic cones começam e terminam. Se o Formality não entender essa transformação, a verificação tende a falhar, mesmo que a implementação esteja correta.

A parte A cobre:

1. Visão geral das transformações sequenciais.
2. Por que elas são importantes para **QoR** — power, area e timing.
3. Por que registradores e latches são compare points.
4. Como diagnosticar problemas de transformações sequenciais no match stage.
5. **Constant register removal** e `guide_reg_constant`.
6. Sintomas de um constant register não identificado.
7. Workaround emergencial com `set_constant` e seus riscos.
8. Exemplos simples e complexos de constant register.
9. SVF inválido e rejeição de guidance.
10. Dependências entre registros constantes.
11. **Unread / unloaded registers**.
12. Como unread registers aparecem no match e no verify.
13. Como verificar unread compare points se necessário.
14. **Phase inversion** e `guide_inv_push`.
15. Sintomas quando `inv_push` é rejeitado.

Mensagem central: **rejeição de guidance sequencial é muito mais perigosa do que rejeição combinacional**, porque ela afeta compare points e fronteiras de cones. Por isso, a Guidance Summary, o Match Summary, `report_svf_operation`, `report_unmatched_points`, `analyze_points` e Pattern Window precisam ser usados em conjunto.

---

## Texto extraído e organizado por slide

### Slide 1 — Overview of Unit: Sequential Transforms

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

Destaques do slide:

```text
Sequential transforms
Handled by Formality mainly by SVF
```

Interpretação:

O slide localiza as transformações sequenciais dentro do fluxo do Design Compiler. Elas aparecem principalmente durante:

- `First Compile`;
- `Incremental Compile`.

A mensagem importante é que o Formality lida com essas transformações principalmente via **SVF**. Isso significa que o Design Compiler precisa escrever comandos de guidance no SVF, e o Formality precisa aceitar esses comandos.

Se uma transformação sequencial foi feita pelo DC, mas a guidance correspondente foi rejeitada no Formality, o resultado típico é falso negativo: a netlist pode estar correta, mas a verificação falha.

---

### Slide 2 — Sequential optimizations

A figura mostra várias otimizações ao redor de um bloco central de **QoR**:

```text
QoR
Power
Area
Timing
```

Otimizações listadas:

```text
Clock Gating
Register Merging
Register Replication
Constant register removal
Multibit banking
Phase Inversion
Adaptive retiming
Pipeline retiming
Unread register removal
```

Textos destacados:

```text
Sequential optimizations important to implementation QoR
Eg Registers mark start and end point of timing paths.
The more and better sequential optimizations available to synthesis the better the QoR.
```

Interpretação:

O Design Compiler usa transformações sequenciais para melhorar qualidade de resultado:

- **timing:** mover ou ajustar registradores pode melhorar slack;
- **area:** remover registros redundantes ou mesclar registros reduz área;
- **power:** clock gating e remoção de lógica reduz comutação;
- **QoR geral:** otimizações em registradores podem melhorar várias métricas ao mesmo tempo.

O ponto crítico é que registradores também são elementos centrais na verificação. Eles marcam fronteiras de cones lógicos e são compare points. Portanto, quanto mais a síntese mexe nos registradores, mais o Formality precisa entender o que aconteceu.

---

### Slide 3 — Important to equivalency checking

Texto extraído:

- **Registers and latches are compare points**
  - The fundamental division that equivalency checkers make.
  - Similar but not identical to start and endpoints of timing paths — the fundamental division of STA.
- **Sequential optimizations transform registers and latches**
  - They change logic cone boundaries.
- **If Formality doesn’t identify these compare point transforms the verification will fail**
  - If a sequential guide command is rejected verification likely to fail.
- **Having a firm understanding of these transforms and non-SVF setup also helps debugging in other contexts.**

Interpretação:

Este é o slide conceitual mais importante da abertura.

Em equivalence checking, registradores e latches são pontos de comparação. O Formality divide o design em cones entre compare points. Quando uma otimização sequencial muda os registradores, ela muda a própria estrutura da prova.

Exemplo:

```text
Antes: cone A termina em reg1 e cone B começa em reg1.
Depois: reg1 foi removido, mesclado, duplicado ou movido.
```

Se o Formality não recebe/aceita a guidance da transformação, ele tenta comparar pontos que já não correspondem diretamente.

Regra de prova:

```text
Rejected sequential guide command → verification likely to fail.
```

---

### Slide 4 — Diagnosing Problems with Sequential Transforms

Texto extraído:

- There is a finite, small number of common sequential transforms.
- With a little understanding most common issues can be distinguished and diagnosed at the match stage.
- Caixa amarela:
  - For sequential transforms a little knowledge is a powerful, productive thing for equivalency checking.
- Figura de Formality Runs:
  - Pass;
  - False Negative;
  - True Negative.
- Caixa:
  - We want to quickly diagnose False Negatives.

Interpretação:

A aula enfatiza que existe um conjunto pequeno de transformações sequenciais comuns. Isso é ótimo para debug, porque permite reconhecer padrões.

A maioria dos problemas relacionados a transformações sequenciais aparece antes mesmo do debug profundo:

- na Guidance Summary;
- no Match Summary;
- nos unmatched points;
- na Verification Results Table;
- em `analyze_points`;
- em Pattern Window.

O objetivo é diagnosticar rapidamente **false negatives**, isto é, casos em que o design implementado está correto, mas a prova falha porque o Formality não entendeu uma transformação.

---

## Constant Registers

### Slide 5 — Constant Registers

Figura:

Um registrador recebe valor constante `0`. O Design Compiler remove o registrador e propaga a constante para a lógica downstream.

Texto extraído:

- **What DC does by default**
  - Recognises constant registers and removes them from the design, propagating the constant to downstream logic.
  - Writes out a `guide_reg_constant` command.
- **What Formality does**
  - With the `guide_reg_constant` command, verifies that command, then if successful, identifies register as constant.
  - Even without SVF Formality can identify some constant registers.

Interpretação:

Um constant register é um registrador que sempre assume um valor constante, como `0` ou `1`.

O Design Compiler pode removê-lo:

```text
reg constante → constante propagada → lógica downstream simplificada
```

Para que o Formality entenda isso, o DC escreve no SVF:

```text
guide_reg_constant
```

O Formality lê esse comando, verifica se o registro realmente é constante e, se aceitar a guidance, classifica o registro como constant. Assim, ele não tenta comparar um DFF que desapareceu na implementação como se fosse erro.

Mesmo sem SVF, o Formality consegue identificar alguns casos simples, mas casos complexos dependem do SVF.

---

### Slide 6 — Symptoms: Constant register non-identified

Texto extraído:

- **Symptom 1: Guidance Summary rejected `reg_constant`**
- **Next step:**

```tcl
report_svf_operation -status rejected -command reg_constant
```

- Result:
  - **Naming:** Formality can't find the register with that name.
  - **Validity:** Formality doesn't think it is a constant.
- Next Step Naming:
  - Investigate naming issue — could be setup issue.
  - Could change the name in the SVF.
- Next Step Validity:
  - Verify the register:

```tcl
verify r:/WORK/top/potentially_constant_reg -constant0
```

  - Stimulus in Pattern Window will say why Formality doesn't think it is a constant.

Interpretação:

Se a Guidance Summary mostra `reg_constant` rejeitado, há duas causas principais:

#### 1. Naming problem

O Formality não encontrou o registro indicado pelo SVF. Possíveis causas:

- SVF errado;
- top errado;
- hierarquia diferente;
- variável de naming diferente;
- design não lido igual ao DC;
- SVF de outra etapa.

#### 2. Validity problem

O Formality encontrou o registro, mas não concorda que ele seja constante.

Nesse caso, use verificação pontual:

```tcl
verify r:/WORK/top/potentially_constant_reg -constant0
```

ou, se a suspeita for constante `1`:

```tcl
verify r:/WORK/top/potentially_constant_reg -constant1
```

A Pattern Window mostrará um estímulo que contradiz a constância.

---

### Slide 7 — Symptoms: Constant register non-identified — Other symptoms

Texto extraído:

- **Other symptoms**
- Unmatched DFF in Ref (Match Summary)
  - Next step:

```tcl
report_unmatched_points
```

- `analyze_points -fail`
- Unmatched register input in reference logic cone displayed in Pattern Window.
  - Failing patterns showing constant value on unmatched input.

Interpretação:

Um constant register não identificado aparece de várias formas:

1. **Guidance Summary**
   - `reg_constant` rejected.

2. **Match Summary**
   - DFF unmatched na referência.

3. **Reports**
   - `report_unmatched_points`.

4. **Analyze**
   - `analyze_points -fail`.

5. **Pattern Window**
   - entrada unmatched no cone de referência mostrando valor constante.

A chave é reconhecer que todos esses sintomas podem apontar para a mesma causa: um registro constante que o Formality não classificou como constante.

---

### Slide 8 — Emergency work-around

Texto extraído:

- **Use `set_constant`**
  - But remember this doesn't verify register is a constant.
- Caixa amarela:
  - If this really isn't a constant: your silicon could be bad.
- Figura:
  - Um `a_reg` na referência é constrained to `0`.
  - Pontos downstream passam.
- Comando visível:

```tcl
set_constant >ref/a_reg -constant0
```

Interpretação:

Workaround emergencial:

```tcl
set_constant r:/WORK/top/a_reg 0
```

ou estilo equivalente:

```tcl
set_constant r:/WORK/top/a_reg -constant0
```

Isso força o registro na referência a ser tratado como constante, permitindo que pontos downstream passem.

Mas o slide faz um alerta forte: isso **não prova** que o registro é constante. Se ele não for realmente constante, você pode esconder uma diferença funcional real e liberar silício ruim.

Uso correto:

- apenas como workaround temporário;
- apenas depois de entender por que o Formality rejeitou `reg_constant`;
- preferencialmente depois de verificar a constância com `verify ... -constant0/-constant1`.

---

### Slide 9 — Constant register: Example

Texto extraído da figura:

- Caixa amarela:
  - Some simple constants don't require SVF or other setup.
- Código da referência mostra algo equivalente a:

```verilog
b <= b ^ b;
```

- Anotação:

```text
b xor b = 0
```

- Implementação mais simples:

```verilog
z <= a;
```

- Script mostrado:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred_const.v
set_top fred

verify
```

- Resultado:
  - Constant 0 register identified.
  - Verification succeeds.

Interpretação:

Este exemplo mostra um registro constante simples. Se `b` é atualizado por:

```text
b xor b
```

então o resultado é sempre `0`.

O Formality consegue identificar esse constant register sem SVF especial, porque a constância é simples.

Mensagem:

```text
Nem todo constant register precisa de SVF.
Mas constant registers complexos geralmente dependem de guide_reg_constant.
```

---

### Slide 10 — Constant register: Example — complex constant with valid SVF

Texto extraído:

- Caixa:
  - Complex constant: code is `a * b - a * b`.
- O registro `br_reg` é constante `0`.
- Caixas:
  - `guide accepted`
  - `Valid SVF`
  - `Identified`
  - `Verification passes`

Script/guia mostrado:

```tcl
guide_reg_constant -design fred \
  br_reg 0
```

Interpretação:

Este exemplo mostra uma constância mais complexa:

```text
a*b - a*b = 0
```

Matematicamente é óbvio, mas estruturalmente pode ser complexo para a ferramenta identificar sozinha, especialmente depois de otimização aritmética.

O DC grava no SVF:

```text
guide_reg_constant
```

O Formality aceita a guidance, identifica `br_reg` como constant 0 e a verificação passa.

Mensagem prática:

```text
Para constantes complexas, SVF correto é essencial.
```

---

### Slide 11 — Constant register: Example — invalid guide

Texto extraído:

- Guia incorreta:

```tcl
guide_reg_constant -design fred \
  br_reg 1
```

- Caixas:
  - `SVF invalid`
  - `Guide rejected in summary`
  - `Non-constant register still in match summary`
  - `If SVF is invalid, Formality will reject it`
  - `Details from report_svf_operation`
- Comandos sugeridos:

```tcl
report_svf_operation -status rejected
verify fred/br_reg -constant1
```

Interpretação:

Aqui o SVF diz que `br_reg` é constante `1`, mas a verdade é que ele é constante `0`.

O Formality rejeita a guidance. Isso é importante: Formality não aceita cegamente o SVF. Ele verifica se a operação de guidance é válida.

Resultado:

- Guidance Summary mostra `reg_constant` rejected.
- Match Summary ainda mostra o registro como não constante.
- `report_svf_operation` mostra detalhes da rejeição.
- `verify ... -constant1` pode mostrar o contraexemplo de por que não é constante `1`.

Mensagem de segurança:

```text
SVF ajuda, mas Formality valida a guidance.
```

---

### Slide 12 — Subtleties when debugging constant registers

Texto extraído:

- **There may be dependencies between constant registers**
  - One constant register (`a_reg`) can lead to another (`b_reg`).
  - Exemplo:

```tcl
verify r:/WORK/top/b_reg -constant0
```

will fail unless `a_reg` is identified as a constant first.
- Registers `c_reg`, `d_reg`, once in state `11`, don't escape.
  - Can initialize to `11` state.
  - DC free to optimize them away.
- Caixa:
  - Cases handled naturally by SVF.

Interpretação:

Nem todo constant register é independente.

Exemplo conceitual:

```text
a_reg é constante 0.
b_reg só é constante 0 se a_reg já for reconhecido como constante.
```

Se o Formality não identificou `a_reg`, uma verificação direta de `b_reg` como constante pode falhar.

Também há casos dependentes de estado inicial. Se dois registros entram em um estado estável, como `11`, e nunca escapam, o DC pode tratá-los como otimizáveis dependendo das assumptions de inicialização e alcançabilidade.

Essas sutilezas são tratadas naturalmente pelo SVF quando o fluxo está correto.

---

### Slide 13 — Diagnosis: Unidentified constant register

Texto extraído do fluxograma:

Possible next steps:

```tcl
report_svf_operation -status rejected -command reg_constant
verify r:/WORK/top/possible_const_reg -constant0
# Or -constant1
```

Sinais no fluxo:

- Guidance Summary:
  - Possible rejected `reg_constant`.
- Match Summary:
  - Unmatched non-constant register in Ref.
- Verification Results Table:
  - Everything that register drives will fail.
- `analyze_points`:
  - Will point out rejected `reg_constant` or unmatched input.
- Pattern Window:
  - Failing stimulus opposite to constant register value.

Interpretação:

Este slide consolida o diagnóstico de constant register não identificado.

A causa aparece em múltiplos lugares:

```text
Guidance Summary → reg_constant rejected
Match Summary → unmatched non-constant register in Ref
Verify Results → pontos downstream falham
analyze_points → aponta reg_constant rejected/unmatched input
Pattern Window → estímulo contradiz valor constante
```

Isso é exatamente a filosofia de debug eficiente: não olhar cada failing point isoladamente, mas reconhecer o padrão global.

---

## Unloaded and Unread Registers

### Slide 14 — Unloaded and Unread Registers

Texto extraído:

- **Unloaded register:** A register that doesn’t drive anything.
- **Unread register:** A register that doesn’t affect any other compare point — superset of unloaded.
- **What DC does by default**
  - Will remove unloaded registers.
- **What Formality does**
  - Automatically recognises unread registers — no setup required.
  - Where DC has removed them they will be unmatched.
  - Where registers haven’t been removed they will be matched.
  - Not verified by default.

Interpretação:

A aula diferencia:

#### Unloaded register

Um registrador que não dirige nada.

```text
reg existe, mas sua saída não alimenta lógica alguma.
```

#### Unread register

Um registrador que não afeta nenhum compare point downstream. É uma categoria maior, que inclui unloaded.

O DC pode remover esses registros porque eles não afetam a funcionalidade observável.

O Formality reconhece unread registers automaticamente. Se eles foram removidos, aparecem como unmatched unread. Se estão nos dois lados, podem casar, mas não são verificados por default.

---

### Slide 15 — Unread register: Example

Código da referência mostra:

```verilog
reg ar1, ar2;

assign z = ar1;

// Note ar2 does not drive anything
always @(posedge clk)
begin
  ar1 <= a;
  ar2 <= a & b;
end
```

Implementação:

```verilog
reg ar1;

assign z = ar1;

always @(posedge clk)
begin
  ar1 <= a;
end
```

Anotações:

```text
ar2_reg unread
Unmatched in Ref
```

Script:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred_unread.v
set_top fred

verify
```

Comando para detalhes:

```tcl
report_unmatched_points -status unread
```

Interpretação:

`ar2` existe na referência, mas não afeta `z` nem qualquer compare point relevante. A implementação removeu `ar2`.

O Formality reconhece que `ar2_reg` é unread. Ele aparece como unmatched na referência, mas isso não causa falha de verificação.

Para detalhes:

```tcl
report_unmatched_points -status unread
```

Mensagem:

```text
Unmatched unread register pode ser normal.
```

---

### Slide 16 — Unread register: Matched unread

Texto extraído:

- Matched unread compare points are not verified by default.
- Caixa:
  - Unread register in both Ref and Impl.
- Verification Results:
  - Verification succeeded.
  - 2 passing compare points.
  - Unread appears as not compared.

Interpretação:

Se um unread register existe tanto em Ref quanto em Impl, ele pode casar. Mesmo assim, por default, ele não é verificado.

Isso faz sentido porque ele não afeta outputs ou outros compare points. Verificá-lo consumiria esforço sem afetar a equivalência observável.

Na Verification Results Table, ele pode aparecer como:

```text
Not Compared: Unread
```

---

### Slide 17 — Unread register: Matched unread — verifying unread compare points

Texto extraído:

- To verify unread compare points:

```tcl
set verification_verify_unread_compare_points true
```

Resultado:

```text
Extra passing compare point
```

Interpretação:

Se por algum motivo você quiser verificar unread compare points, use:

```tcl
set verification_verify_unread_compare_points true
```

Então o Formality inclui esses pontos na verificação.

Uso típico:

- debug específico;
- auditoria mais estrita;
- confirmar que um unread register ainda é equivalente nos dois lados.

Mas para signoff funcional comum, o default de não verificar unread é geralmente aceitável.

---

### Slide 18 — Summary: Unread registers

Texto extraído:

Possible next steps:

```tcl
report_matched_points -status unread
report_unmatched_points -status unread
set verification_verify_unread_compare_points true
```

Fluxograma:

- Match Summary:
  - Unmatched unread registers.
  - Matched unread registers.
- Verification Results Table:
  - Matched unread registers not verified by default.

Interpretação:

Resumo de unread registers:

1. Eles podem aparecer no Match Summary.
2. Podem estar matched ou unmatched.
3. Não são verificados por default.
4. Se precisar verificar:

```tcl
set verification_verify_unread_compare_points true
```

Comandos para investigar:

```tcl
report_matched_points -status unread
report_unmatched_points -status unread
```

---

## Phase Inversion

### Slide 19 — Phase inversion

Figura:

Antes:

```text
inversor → DFF → lógica downstream
```

Depois do DC:

```text
DFF → inversor → lógica downstream
```

Texto extraído:

- **What DC does by default**
  - Moves inversions across register boundaries to improve performance and area.
  - Writes out a `guide_inv_push` command.
- **What Formality does**
  - Reads `guide_inv_push` command in SVF and effectively issues a `set_inv_push` command.

Interpretação:

Phase inversion ocorre quando o DC empurra uma inversão através da fronteira de um registrador.

Exemplo conceitual:

```text
~D antes do registrador
```

pode virar:

```text
D registrado e inversão depois do registrador
```

A função observável pode ser preservada, mas o compare point muda de fase. Sem guidance, o Formality pode comparar sinais invertidos como se fossem iguais e falhar.

O DC escreve:

```text
guide_inv_push
```

O Formality interpreta isso como uma autorização para considerar a inversão empurrada:

```tcl
set_inv_push
```

---

### Slide 20 — Inversion push example failing

Texto extraído:

- Both the inv push point and what it is driving fail.
- All vectors to the SD pin of the inv push register.
- Matching clean.

Interpretação:

Este slide mostra o sintoma quando a inversão de fase não é tratada corretamente.

Mesmo com o matching limpo, o verify falha:

- o próprio ponto de inv push falha;
- tudo que ele dirige também falha;
- todos os vetores para o pino SD do registrador falham.

Esse padrão é distintivo: quando a fase está invertida e o Formality não entendeu, praticamente qualquer estímulo pode produzir valor oposto.

Mensagem:

```text
Match limpo não garante que inv_push foi aceito.
Olhe Guidance Summary.
```

---

### Slide 21 — Summary: Phase Inversion

Texto extraído:

Possible next steps:

```tcl
report_svf_operation -status rejected -command inv_push
set_inv_push
# or
set_user_match -inverted
```

Fluxograma e sintomas:

- Match Summary:
  - No clue in Match Summary.
- Guidance Summary:
  - Rejected `inv_push`.
- Verification Results Table:
  - Register and all that drives fail.
- Debug:
  - If has async reset, Pattern Window failure distinctive.
  - Fail for all input stimulus.
- Caixa:
  - Further details in Appendix.

Interpretação:

Phase inversion é um caso em que o Match Summary pode parecer limpo. Isso é perigoso, porque a falha só fica clara no verify.

O principal sinal antecipado é:

```text
Guidance Summary: rejected inv_push
```

Próximos passos:

```tcl
report_svf_operation -status rejected -command inv_push
```

Se for necessário corrigir manualmente:

```tcl
set_inv_push
```

ou, em alguns casos:

```tcl
set_user_match -inverted
```

O padrão de falha é característico:

```text
o registrador falha e tudo que ele alimenta também falha
falha para todos os estímulos de entrada
```

Se há async reset, a Pattern Window pode ter um padrão ainda mais distintivo, porque a inversão interage com o comportamento de reset.

---

## Aula didática desenvolvida

### 1. Por que transformações sequenciais são especiais

Transformações combinacionais mudam a lógica dentro do cone. Transformações sequenciais mudam as fronteiras do cone.

Essa diferença é enorme.

Em uma transformação combinacional, o Formality ainda compara os mesmos registradores e outputs. Em uma transformação sequencial, o Design Compiler pode:

- remover um registrador;
- criar outro;
- mesclar dois;
- duplicar um;
- mover uma inversão;
- mover registradores no tempo;
- inserir latch de clock-gating.

Isso muda a lista de compare points e os caminhos entre eles.

Por isso:

```text
Rejected combinational guidance → talvez verificação demore.
Rejected sequential guidance → verificação provavelmente falha.
```

---

### 2. Constant register removal é o caso base

O caso mais simples é um registrador constante.

Se no RTL há:

```text
reg sempre 0
```

o DC pode remover o registrador e propagar `0`.

O Formality precisa saber que:

```text
aquele DFF não sumiu por erro;
ele virou constante.
```

O comando SVF é:

```text
guide_reg_constant
```

Se aceito, a verificação passa. Se rejeitado, os pontos alimentados pelo registro podem falhar.

---

### 3. Como saber se `reg_constant` rejeitado é naming ou validade

Use:

```tcl
report_svf_operation -status rejected -command reg_constant
```

Se o problema for naming:

```text
Formality não encontrou o registro.
```

Investigue:

- SVF certo?
- top certo?
- hierarquia igual?
- variáveis de naming?
- fluxo multi-stage?

Se o problema for validade:

```text
Formality encontrou o registro, mas não concorda que seja constante.
```

Use:

```tcl
verify r:/WORK/top/possible_const_reg -constant0
```

ou:

```tcl
verify r:/WORK/top/possible_const_reg -constant1
```

---

### 4. Por que `set_constant` é perigoso

`set_constant` pode fazer a verificação passar, mas não prova que a constante é verdadeira.

É um comando de restrição, não de prova.

Exemplo perigoso:

```tcl
set_constant r:/WORK/top/a_reg 0
```

Se `a_reg` realmente puder ser `1` em algum estado, você acabou de esconder um bug real.

Uso aceitável:

- workaround temporário;
- quando há forte evidência externa;
- após verificar a constância;
- documentado;
- preferencialmente substituído por correção do SVF/setup.

---

### 5. Dependência entre constantes

Algumas constantes só são reconhecidas se outra constante for reconhecida antes.

Exemplo:

```text
b_reg é constante 0 porque depende de a_reg constante 0.
```

Se `a_reg` não foi identificado, verificar `b_reg -constant0` pode falhar.

Por isso o SVF é importante: ele registra uma sequência de transformações e dependências que o Formality pode validar na ordem adequada.

---

### 6. Unread registers não devem assustar automaticamente

Unread register não afeta compare points observáveis. Portanto, se o DC removeu, normalmente não há problema.

Sinais no relatório:

```text
unmatched unread register in Ref
matched unread register not verified by default
```

Comandos:

```tcl
report_unmatched_points -status unread
report_matched_points -status unread
```

Se quiser verificar mesmo assim:

```tcl
set verification_verify_unread_compare_points true
```

---

### 7. Phase inversion: quando tudo parece casado, mas está invertido

A phase inversion é traiçoeira porque o Match Summary pode não dar pista. Os objetos podem casar por nome, mas a função comparada está invertida.

O sinal principal é no SVF:

```text
guide_inv_push rejected
```

E no verify:

```text
register and all it drives fail
fail for all input stimulus
```

Comandos:

```tcl
report_svf_operation -status rejected -command inv_push
set_inv_push
set_user_match -inverted
```

---

## Conceitos difíceis explicados em profundidade

### Transformação sequencial

Transformação que altera registradores/latches ou fronteiras sequenciais. Exemplos:

- constant register removal;
- unread register removal;
- register merging;
- register replication;
- phase inversion;
- adaptive retiming;
- pipeline retiming;
- clock gating.

---

### Compare point boundary

Compare points definem fronteiras de cones. Se um registrador é removido, duplicado ou movido, a fronteira muda. Por isso a guidance sequencial é crítica.

---

### `guide_reg_constant`

Comando SVF que informa ao Formality que o DC removeu um registrador por ser constante.

---

### Constant register

Registrador cujo valor é sempre `0` ou sempre `1`, independentemente dos estímulos válidos.

---

### Unloaded register

Registrador que não dirige nada.

---

### Unread register

Registrador que não afeta nenhum compare point ou output observável. É uma categoria mais ampla que unloaded.

---

### `verification_verify_unread_compare_points`

Variável que força o Formality a verificar compare points unread.

---

### Phase inversion

Transformação em que uma inversão é movida através de uma fronteira de registrador.

---

### `guide_inv_push`

Comando SVF que informa ao Formality uma inversão empurrada pelo DC.

---

### `set_inv_push`

Comando manual para indicar ao Formality que uma inversão foi empurrada.

---

### `set_user_match -inverted`

Comando para casar pontos considerando inversão.

---

## Comandos importantes

### Constant registers

```tcl
report_svf_operation -status rejected -command reg_constant
verify r:/WORK/top/potentially_constant_reg -constant0
verify r:/WORK/top/potentially_constant_reg -constant1
report_unmatched_points
analyze_points -fail
set_constant r:/WORK/top/a_reg 0
```

### Unread registers

```tcl
report_matched_points -status unread
report_unmatched_points -status unread
set verification_verify_unread_compare_points true
```

### Phase inversion

```tcl
report_svf_operation -status rejected -command inv_push
set_inv_push
set_user_match -inverted
```

---

## Figuras e diagramas importantes

### Sequential optimizations e QoR

Mostra que clock gating, register merging, register replication, retiming, phase inversion e remoção de registros impactam power, area e timing.

---

### Constant register removal

Mostra o DC removendo o DFF constante e propagando `0` para a lógica downstream.

---

### Workaround com `set_constant`

Mostra que restringir `a_reg` a `0` faz os pontos downstream passarem, mas alerta que isso pode esconder silício ruim.

---

### Constant register complex example

Mostra `a*b - a*b = 0`, em que `guide_reg_constant` aceito permite identificação de `br_reg` como constante `0`.

---

### Invalid guide

Mostra que Formality rejeita SVF inválido. Se o SVF diz constante `1`, mas a prova contradiz, a guidance é rejeitada.

---

### Dependencies between constant registers

Mostra que um registro constante pode depender de outro já reconhecido como constante.

---

### Unread register example

Mostra `ar2_reg` não dirigindo nada e aparecendo como unmatched unread na referência.

---

### Phase inversion

Mostra o inversor sendo movido através do registrador.

---

### Summary: Phase Inversion

Mostra que o Match Summary pode não dar pista, mas a Guidance Summary aponta `inv_push` rejected e o verify mostra falhas em cascata.

---

## Pontos de prova e revisão

1. Transformações sequenciais são tratadas pelo Formality principalmente via SVF.
2. Registradores e latches são compare points.
3. Transformações sequenciais mudam boundaries de logic cones.
4. Se o Formality não identificar uma transformação sequencial, o verify tende a falhar.
5. `guide_reg_constant` é usado para constant register removal.
6. DC remove constant registers e propaga constantes para lógica downstream.
7. Formality valida `guide_reg_constant` antes de aceitar.
8. Mesmo sem SVF, Formality pode reconhecer algumas constantes simples.
9. `reg_constant` rejected pode ser problema de naming ou de validade.
10. Para investigar, use `report_svf_operation -status rejected -command reg_constant`.
11. Para testar constância, use `verify ... -constant0` ou `verify ... -constant1`.
12. Unmatched DFF in Ref pode indicar constant register não identificado.
13. `analyze_points -fail` pode apontar rejected `reg_constant`.
14. Pattern Window pode mostrar valor oposto ao valor constante esperado.
15. `set_constant` é workaround, não prova.
16. Se o registro não for realmente constante, usar `set_constant` pode esconder bug real.
17. Constantes complexas dependem mais do SVF.
18. Formality rejeita SVF inválido.
19. Pode haver dependência entre registros constantes.
20. Unloaded register não dirige nada.
21. Unread register não afeta outros compare points.
22. Unread é superset de unloaded.
23. DC remove unloaded registers por default.
24. Formality reconhece unread registers automaticamente.
25. Unread registers não são verificados por default.
26. Para verificar unread compare points, use `verification_verify_unread_compare_points true`.
27. Phase inversion move inversões através de boundaries de registradores.
28. DC escreve `guide_inv_push`.
29. Formality lê `guide_inv_push` e efetivamente aplica `set_inv_push`.
30. Rejected `inv_push` pode não aparecer claramente no Match Summary.
31. Rejected `inv_push` aparece na Guidance Summary.
32. Em phase inversion rejeitada, o registrador e tudo que ele dirige podem falhar.
33. Falha de phase inversion tende a ocorrer para todos os estímulos.
34. Próximos passos para phase inversion: `report_svf_operation`, `set_inv_push`, `set_user_match -inverted`.
35. Debug eficiente de transformações sequenciais começa no match stage, não no cone isolado.

---

## Relação com projeto/laboratório

Fluxo de diagnóstico para constant register:

```tcl
# Após match
# olhar Guidance Summary
report_svf_operation -status rejected -command reg_constant
report_unmatched_points

# Se suspeitar de constante
verify r:/WORK/top/possible_const_reg -constant0
# ou
verify r:/WORK/top/possible_const_reg -constant1

# Após verify falho
analyze_points -fail
```

Fluxo de diagnóstico para unread register:

```tcl
report_unmatched_points -status unread
report_matched_points -status unread

# Se quiser verificar unread points
set verification_verify_unread_compare_points true
verify
```

Fluxo de diagnóstico para phase inversion:

```tcl
# olhar Guidance Summary
report_svf_operation -status rejected -command inv_push

# correções manuais possíveis
set_inv_push
set_user_match -inverted
```

Regra prática da aula:

```text
Para transformações sequenciais, olhe primeiro:
1. Guidance Summary
2. Match Summary
3. report_svf_operation
4. report_unmatched_points
5. analyze_points
6. Pattern Window
```

---

## Checklist de qualidade

- [x] Bloco 071 processado conforme roteiro, slides 1-21.
- [x] Texto dos prints foi extraído e organizado.
- [x] Figuras e exemplos foram interpretados.
- [x] Comandos SVF/Formality foram preservados.
- [x] Pegadinhas de constant register, unread register e phase inversion foram destacadas.
- [x] A relação com QoR e compare points foi explicada.
- [x] O próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 072
- **Aula:** 09 Sequential Design Transforms and SVF — parte B
- **Prioridade:** alta
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\09 Sequential Design Transforms and SVF.docx
```

- **Processar somente:** slides 22-42
- **Começar por:** `Register Merging`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\09 Sequential Design Transforms and SVF_parte_B.md
```

- **Próximo depois dele:** Bloco 073 — confirmar no roteiro após concluir a parte B.
