# 08 RTL and Netlist Interpretation — parte A

## Controle do bloco

- **Bloco:** 069
- **Curso:** 09 Formality Foundation
- **Aula:** 08 RTL and Netlist Interpretation — parte A
- **Prioridade do roteiro:** média
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\08 RTL and Netlist Interpretation.docx`
- **Faixa processada conforme roteiro:** slides 1-21
- **Observação sobre o anexo:** o DOCX renderiza duas telas/slides por página. Esta parte A cobre do início da aula até o exemplo de `analyze_points` para fontes de `X`, imediatamente antes da seção **Black-boxes**.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\08 RTL and Netlist Interpretation_parte_A.md
```

- **Próximo bloco:** Bloco 070 — `08 RTL and Netlist Interpretation - parte B`
- **Próxima faixa:** slides 22-42

---

## Resumo executivo

Esta aula aprofunda um tipo de causa de falha muito importante em Formality: diferenças entre como o RTL é **simulado**, como o Design Compiler interpreta esse RTL para gerar hardware, e como o Formality interpreta o mesmo RTL para fazer equivalence checking.

O ponto central é que **Design Compiler e Formality têm leitores de RTL independentes**. Isso é bom porque permite que o Formality detecte problemas no leitor RTL do DC, mas também exige cuidado: se DC e FM interpretarem certos construtos RTL de maneira diferente, a verificação pode falhar ou parar antes mesmo de completar `set_top`.

A parte A cobre principalmente:

1. a retomada dos princípios de debug eficiente;
2. as categorias de interpretação de RTL;
3. a independência dos leitores RTL de DC e FM;
4. mismatches entre interpretação de simulação e interpretação de hardware;
5. filtragem seletiva de mensagens de mismatch;
6. pragmas `full_case` e `parallel_case`;
7. como `synopsys_auto_setup` altera a interpretação para se comportar mais como síntese;
8. como fazer um pipe-clean do leitor RTL do Design Compiler;
9. como tratar `X` como **don't care**;
10. os modos `verification_passing_mode consistency` e `verification_passing_mode equality`;
11. como `analyze_points` identifica fontes de `X` em verificações difíceis.

A ideia mais importante é: **Formality não está apenas comparando duas descrições; ele está comparando duas interpretações funcionais do design.** Quando o RTL usa `X`, pragmas de `case`, sinais não inicializados, ou construtos ambíguos, pode haver diferença entre “o que a simulação mostra” e “o hardware que a síntese escolhe implementar”.

---

## Texto extraído e organizado por slide

### Slide 1 — Recall: Some Debugging Principles

Texto extraído:

- **Debugging is about working back from the symptoms to identify the cause**
  - It involves reasoning and understanding.
- **A key to efficient debugging is knowing:**
  - What the likely causes of failure are, both false and real.
  - How each cause will show up in Formality, where to look.
  - From this catalogue of known symptoms from known causes, be able to work backwards from a given failure symptom to an unknown cause.
- Caixa amarela:
  - In this and the next two units we will start building up the catalogue of:
    1. Common causes of failure.
    2. How they manifest themselves in Formality.
    3. How to fix them.

Interpretação:

A aula retoma a filosofia da aula anterior: debug eficiente não é abrir aleatoriamente um failing point. É reconhecer sintomas e voltar até a causa.

Esta unidade começa a montar um “catálogo” de causas comuns de falha. Esse catálogo é essencial porque, em Formality, o mesmo sintoma final — por exemplo, `verify failed` — pode vir de causas muito diferentes:

- RTL interpretado diferente por simulação e síntese;
- `X` tratado como don't care;
- pragma de `case`;
- black-box inesperada;
- sinal sem driver;
- sinal com múltiplos drivers;
- nome de objeto diferente entre DC e FM;
- SVF ausente ou incompleto.

A parte A foca nas causas ligadas a **interpretação de RTL** e `X` como don't care.

---

### Slide 2 — Overview of Unit

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

- `X as don't care`
- `DC Hardware interpretation of RTL`
- `DC Name interpretation of RTL`
- `Black-boxes`
- `Undriven signals`
- `Multiply driven signals`

Interpretação:

O slide mostra onde cada tema aparece no fluxo de síntese.

Na parte inicial do fluxo, durante leitura e elaboração RTL, surgem temas como:

- como o DC interpreta o RTL como hardware;
- como os nomes de objetos são criados;
- como `X` é tratado;
- como pragmas de `case` são interpretados.

Mais adiante, surgem problemas como:

- black boxes;
- sinais sem driver;
- nets com múltiplos drivers.

A parte A cobre até `X as don't care`. A parte B continuará com black-boxes, undriven signals, multiply driven nets e naming interpretation.

---

### Slide 3 — Independence of RTL readers in DC and FM

Figura:

```text
RTL
 ↙       ↘
DC RTL Reader       FM RTL Reader
 ↓                  ↑
Gates  ------------ Verify
```

Caixas:

- Formality supports the same RTL constructs as DC.
- Independent implementations of RTL reading.
- If bugs here, caught here.

Interpretação:

O Design Compiler e o Formality suportam os mesmos construtos RTL, mas seus leitores RTL são implementações independentes.

Isso tem uma consequência importante:

```text
Se o leitor RTL do DC interpretar algo errado e gerar gates errados,
o Formality pode detectar isso comparando RTL com gates.
```

Se o Formality usasse exatamente o mesmo leitor RTL interno do DC, um bug no leitor poderia ser reproduzido nas duas ferramentas e passar despercebido. A independência aumenta a robustez do fluxo.

Mas essa independência também significa que diferenças de interpretação precisam ser controladas por setup, SVF e variáveis como `synopsys_auto_setup`.

---

### Slide 4 — Categories of RTL interpretation

Texto extraído:

- **Hardware vs simulation interpretation**
  - Design Compiler makes a hardware interpretation of RTL.
  - Even if that is the same as what was intended, will this be the same as the simulation interpretation of RTL?
  - RTL simulation often the golden verification view.
- **Initial hardware interpretation**
  - Is the DC functional representation of the design before synthesis correct? i.e. before `compile_ultra`.
  - Or is there a bug in DC RTL reader, Presto.
- **Naming interpretation**
  - The objects, registers, designs, datapath operators, in the design need to be given a name.
  - If Formality and Design Compiler give objects different initial names that may cause matching and SVF issues.

Interpretação:

A aula separa três problemas diferentes:

#### 1. Hardware versus simulation interpretation

O RTL pode simular de um jeito e sintetizar de outro. Isso ocorre especialmente com:

- pragmas `full_case` e `parallel_case`;
- `X` usado como don't care;
- `casex`/`casez`;
- sinais sem driver;
- construtos ambíguos ou perigosos.

O simulador mostra a “golden verification view” em muitos fluxos, mas o DC está fazendo uma interpretação de hardware.

#### 2. Initial hardware interpretation

Antes mesmo da síntese (`compile_ultra`), o DC lê e elabora o RTL. A pergunta é:

```text
A representação funcional inicial do DC está correta?
```

Se o DC RTL reader tiver bug ou interpretar um construto de forma inesperada, isso pode aparecer no Formality.

#### 3. Naming interpretation

Mesmo quando a função é correta, nomes importam. O SVF referencia objetos por nome. Se DC e FM nomeiam objetos de forma diferente, pode haver problemas de match e SVF guidance.

---

### Slide 5 — RTL Hardware vs. Simulation mismatch

Texto extraído:

- By default Formality will trap as an error a number of types of potential simulation mismatches.
  - The `set_top` will not complete successfully.
- Any type of mismatch can be globally downgraded to a warning, e.g.:

```tcl
set_mismatch_message_filter -warn FMR_ELAB-116
```

- All mismatches can be treated as a warning:

```tcl
set_mismatch_message_filter -warn
```

- A summary and details of the mismatches can be reported by:

```tcl
report_hdlin_mismatches
```

Caixa amarela parcialmente visível:

- Though it is easy to waive mismatches in Formality, it is worth checking these to see whether any of the potential problems are real.

Interpretação:

O Formality, por padrão, é conservador com possíveis diferenças entre simulação e hardware. Alguns mismatches fazem `set_top` falhar.

Você pode rebaixar certos erros para warning:

```tcl
set_mismatch_message_filter -warn FMR_ELAB-116
```

ou rebaixar todos:

```tcl
set_mismatch_message_filter -warn
```

Mas o slide alerta: só porque é fácil fazer waiver, isso não significa que você deve ignorar. Esses mismatches podem indicar que o RTL simula de um jeito, mas a síntese implementa outro.

Comando essencial:

```tcl
report_hdlin_mismatches
```

Ele permite listar e entender os mismatches.

---

### Slide 6 — Selective Filtering of Mismatch Messages

Texto extraído:

- `set_mismatch_message_filter`
  - This command can be used to reduce the severity to warning or suppress the mismatch message based on the specified selection criteria.

Sintaxe mostrada:

```tcl
set_mismatch_message_filter
  -warn
  -suppress
  [-signal signalName]
  [-block HierarchicalBlockName]
  [-file FileName]
  [-line LineNumber]
  [MismatchMessageIDList]
```

Outros comandos:

```tcl
remove_mismatch_message_filter
report_mismatch_message_filters
```

Recomendação:

- Recommended to use `set_mismatch_message_filter` instead of old variables:

```tcl
hdlin_warn_on_mismatch_message
hdlin_error_on_mismatch_message
```

Interpretação:

O slide mostra que a filtragem pode ser seletiva. Em vez de transformar todos os mismatches em warnings, você pode filtrar por:

- sinal;
- bloco;
- arquivo;
- linha;
- ID de mensagem.

Isso é muito melhor para signoff: você documenta exatamente o que está aceitando, em vez de esconder todos os problemas.

Comandos auxiliares:

```tcl
report_mismatch_message_filters
remove_mismatch_message_filter
```

---

### Slide 7 — An example mismatch: Case pragmas

Figura:

O RTL contém:

```verilog
// synopsys full_case
// synopsys parallel_case
```

Fluxo:

```text
RTL
 ├─ Interpretation without pragma assumption → Golden RTL verification simulations
 └─ Interpretation with pragma assumption → Design Compiler
```

Texto da caixa:

- If the RTL contains case pragmas, DC will make a functional assumption which neither DC or Formality can verify.
- Default for Formality is not to make this assumption, i.e. OOTB equivalency checking can fail.

Interpretação:

Pragmas de `case`, como:

```verilog
// synopsys full_case
// synopsys parallel_case
```

informam ao Design Compiler assumptions sobre o comportamento do `case`.

O problema é que essas assumptions podem não ser verdadeiras em todos os estados possíveis. O simulador RTL pode não aplicar a mesma assumption. Assim:

```text
Simulação RTL pode ver comportamento A.
Design Compiler pode implementar comportamento B baseado na assumption.
Formality, por padrão, não assume esses pragmas.
```

Consequência:

```text
equivalence checking pode falhar out-of-the-box
```

A aula reforça que DC e Formality não verificam se o pragma é verdadeiro. Essa responsabilidade fica para a verificação RTL.

---

### Slide 8 — RTL interpretation: Parallel Case

Texto extraído:

Para obter a interpretação do Formality igual à do DC:

```tcl
set hdlin_ignore_parallel_case false
set_mismatch_message_filter -warn \
  FMR_ELAB-116
```

Caixas:

- Default: Formality interpretation.
- Default: Design Compiler interpretation.
- Assumption:
  - Some states for OneHotAluOp not reachable.

Interpretação:

O `parallel_case` sugere que certos casos são mutuamente exclusivos. Se isso for verdade, o DC pode otimizar a lógica. Se não for verdade, a síntese pode gerar hardware que não corresponde à simulação.

Por padrão, Formality tende a ser mais conservador e ignorar a assumption. Para imitar DC:

```tcl
set hdlin_ignore_parallel_case false
```

E como isso pode gerar mismatch, pode ser necessário rebaixar a mensagem:

```tcl
set_mismatch_message_filter -warn FMR_ELAB-116
```

O ponto de prova é: **para fazer Formality interpretar como DC, você altera a variável de interpretação, mas a validade do pragma ainda precisa ser provada por verificação RTL.**

---

### Slide 9 — RTL interpretation: Parallel Case, teste com RTL contra ele mesmo

Texto extraído:

Script mostrado, reconstruído:

```tcl
read_verilog -r fred_parallel.v
set_top fred

# Now interpret like DC
set hdlin_ignore_parallel_case false
set_mismatch_message_filter -warn FMR_ELAB-116

read_verilog -i fred_parallel.v
set_top fred

verify
```

Texto:

- One can partly mimic what failures by default you will see with RTL to DC gates if compare RTL against itself.
- Note command:

```tcl
report_hdlin_mismatches
```

gives lots of useful info.

Interpretação:

O slide mostra uma técnica didática: comparar o RTL contra ele mesmo, mas usando interpretações diferentes.

Na referência, lê o RTL com interpretação padrão do Formality. Na implementação, lê o mesmo RTL com interpretação parecida com DC.

Isso permite simular, dentro do Formality, que tipo de falha aparecerá quando comparar RTL contra gates sintetizados.

A mensagem prática:

```text
Se RTL versus RTL já falha quando um lado usa interpretação DC,
então RTL versus gates provavelmente também falhará.
```

Comando de apoio:

```tcl
report_hdlin_mismatches
```

---

### Slide 10 — Summary: Case pragmas and mismatches

Texto extraído:

- One can instruct Formality to have same interpretation as DC:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
```

- It is up to RTL verification to verify the pragmas.
  - DC and Formality will not verify the pragmas.
- Paper:
  - “full_case parallel_case”, the Evil Twins of Verilog Synthesis, by Cliff Cummings.
- Consider using SystemVerilog constructs `unique case` / `parallel case`.
  - A far more robust way of coding the intent of `full_case` and `parallel_case` that will match simulation.

Interpretação:

Resumo da seção de pragmas.

Para alinhar Formality com DC:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
```

Mas isso não prova que o RTL está correto. Só faz a ferramenta aceitar a mesma assumption que o DC.

A recomendação moderna é evitar pragmas perigosos e usar construtos SystemVerilog mais explícitos, como `unique case` e `priority case`, que comunicam intenção de forma mais robusta ao simulador e às ferramentas.

O slide cita o artigo clássico de Cliff Cummings sobre `full_case` e `parallel_case`, frequentemente chamados de “evil twins” da síntese Verilog.

---

### Slide 11 — `synopsys_auto_setup` fine grain control

Texto extraído:

- With `synopsys_auto_setup true`, pragmas will be accepted, i.e. sets:

```tcl
hdlin_ignore_parallel_case false
hdlin_ignore_full_case false
set_mismatch_message_filters -warn
```

- Can use `synopsys_auto_setup_filter` to limit effect of `synopsys_auto_setup`.

Exemplo:

```tcl
printvar hdlin*case

set synopsys_auto_setup_filter \
  {hdlin_ignore_parallel_case hdlin_ignore_full_case}

set synopsys_auto_setup true

printvar hdlin*case
```

Caixa:

```text
hdlin_ignore_parallel_case unchanged
```

Interpretação:

`set synopsys_auto_setup true` configura várias variáveis para que Formality se comporte mais como o fluxo de síntese Synopsys. Entre elas:

```tcl
hdlin_ignore_parallel_case false
hdlin_ignore_full_case false
```

Mas é possível limitar seus efeitos com:

```tcl
set synopsys_auto_setup_filter { ... }
```

O filtro impede que certas variáveis sejam alteradas automaticamente.

Isso é importante porque `synopsys_auto_setup` é conveniente, mas às vezes você quer controle fino para não aceitar automaticamente algum comportamento.

---

### Slide 12 — Bringing Up RTL: DC RTL reader

Figura:

```text
RTL
↓
Read and elaborate RTL
↓
Compile
↓
Mapped Netlist
↓
Verify
```

A figura também mostra uma tentativa bloqueada de verificar diretamente `GTECH .ddc`.

Texto das caixas:

- Ideally when bringing up RTL we would like to verify before compile.
- But issues such as Xs make this unsupported/not recommended.
- The Impl netlist has to be mapped, post compile.
- Free to choose how to compile and to what library: can make it a simple compile.

Interpretação:

Para validar o leitor RTL do DC, seria ideal comparar:

```text
RTL original versus representação elaborada antes da síntese
```

Mas o slide diz que isso não é suportado/recomendado, por causa de temas como `X`.

A implementação que vai para o Formality precisa ser uma netlist mapeada pós-compile. Portanto, para “pipe-clean” do DC RTL reader, a estratégia é fazer uma síntese simples, preservando bastante estrutura, e verificar essa netlist contra o RTL.

O objetivo não é obter melhor QoR. É verificar se o RTL foi interpretado corretamente pelo DC.

---

### Slide 13 — Example RTL Pipeclean DC Script

Script extraído e reconstruído:

```tcl
set_svf mydesign.svf
set target_library "mystdcells.db"

# Read in the RTL

# If application clock period 10 and tight on timing
# maybe relax clock period to get faster synthesis
create_clock -period 100 clk

set compile_enable_constant_propagation_with_no_boundary_opt false
set compile_preserve_subdesign_interfaces true

compile_ultra -no_autoungroup -no_boundary_optimization

write -format verilog -hier -output design_gates.v
```

Caixas:

- Any library will do, if just checking the DC RTL reader.
- Preserving hierarchy.

Interpretação:

Este script é para pipe-clean de RTL, não para QoR final.

Ideias:

1. **Qualquer biblioteca serve** se o objetivo é verificar o leitor RTL do DC.
2. O clock pode ser relaxado para acelerar síntese:

```tcl
create_clock -period 100 clk
```

3. Preservar hierarquia ajuda a isolar problemas:

```tcl
set compile_preserve_subdesign_interfaces true
compile_ultra -no_autoungroup -no_boundary_optimization
```

4. Evitar certas propagações por boundary pode manter a estrutura mais próxima do RTL:

```tcl
set compile_enable_constant_propagation_with_no_boundary_opt false
```

Esse fluxo ajuda a descobrir cedo se o DC interpretou o RTL de forma incompatível com o Formality.

---

### Slide 14 — Example RTL Pipeclean FM Script

Texto extraído:

- Would still recommend verifying flat first.
- If have preserved hierarchy in DC then hierarchical verification is plausible option to isolate any issues.
- Command:

```tcl
write_hierarchical_verification_script
```

Script reconstruído:

```tcl
set synopsys_auto_setup true
set_svf mydesign.svf
set target_library "mystdcells.db"

# Read in the RTL
# Read in gates

write_hierarchical_verification_script -replace \
  -dont_resolve_failures vhier.tcl
```

Interpretação:

Mesmo com hierarquia preservada, a recomendação inicial ainda é verificar flat primeiro. Verificação flat evita algumas complexidades de particionamento.

Mas, se a síntese preservou hierarquia, a verificação hierárquica pode ser útil para isolar problemas em blocos.

O comando:

```tcl
write_hierarchical_verification_script
```

gera um script para verificação hierárquica.

A opção:

```tcl
-dont_resolve_failures
```

indica que a geração do script não deve tentar resolver automaticamente falhas; a ideia é estruturar a verificação hierárquica para investigação.

---

### Slide 15 — X as Don’t Care

Figura:

O fluxo mostra:

```text
RTL
↓
Read and elaborate RTL
↓
First Compile
↓
Test Insertion
...
```

Caixas:

- `X as don't care here`
- `X as don't care resolved by here`

Interpretação:

Em RTL, `X` pode aparecer como valor desconhecido, mas na síntese ele é frequentemente tratado como **don't care**. Isso significa que o Design Compiler pode escolher `0` ou `1`, conforme for melhor para QoR.

Até a primeira compilação, esses `X` precisam ser resolvidos em escolhas concretas de hardware.

Exemplo:

```verilog
assign b = 1'bx;
```

Para simulação, isso é desconhecido. Para síntese, pode ser oportunidade de otimização.

---

### Slide 16 — Synthesis: X is don’t care

Código visível no slide, reconstruído:

```verilog
module fred (a, clk, z);
input a, clk;
output reg z;
reg ar;
wire b;

assign b = 1'bx;

always @(posedge clk)
begin
  z <= ar | b;
  ar <= a;
end

endmodule
```

Caixas:

- Is this X 1 or 0? Choice made by synthesis.
- Here 1 is a good QoR choice as will make `z_reg` constant 1.
- RTL:

```text
z_reg = ar | 1'bx
```

- Gates1:

```text
z_reg = 1'b1
```

- Gates2:

```text
z_reg = ar
```

- By default Formality will also treat X like synthesis.

Interpretação:

O RTL contém:

```verilog
assign b = 1'bx;
z <= ar | b;
```

Se o DC escolher `b = 1`, então:

```text
z = ar | 1 = 1
```

Isso torna `z_reg` constante `1`, o que pode ser ótimo para QoR.

Se o DC escolher `b = 0`, então:

```text
z = ar | 0 = ar
```

Ambas as escolhas podem ser válidas sob a interpretação de `X` como don't care.

O Formality, por padrão, trata `X` de forma compatível com síntese, ou seja, permite que o `X` da referência corresponda a uma escolha concreta na implementação.

---

### Slide 17 — X: `verification_passing_mode`

Texto extraído:

- In synthesis the X state is considered as don't care and Design Compiler is free to choose 1 or 0.
- By default in Formality X is interpreted same as synthesis.
- The variable `verification_passing_mode` controls how X will compare.
- `verification_passing_mode consistency`
  - Default:
    - `Ref:X = Impl:1`
    - `Ref:X = Impl:0`
- `verification_passing_mode equality`
  - `Ref:X` fails against `Impl:1` or `Impl:0`.
- `consistency` asymmetric:
  - If RTL to gates passes, gates to RTL can fail.
- Mode `equality` useful when comparing RTL to RTL.

Interpretação:

A variável importante é:

```tcl
verification_passing_mode
```

Ela controla como `X` é tratado na comparação.

#### Modo padrão: `consistency`

```tcl
set verification_passing_mode consistency
```

Neste modo:

```text
Ref X pode passar contra Impl 0 ou Impl 1
```

Isso modela síntese, onde o `X` no RTL é don't care e a implementação pode escolher.

Mas o modo é assimétrico:

```text
RTL → gates pode passar
gates → RTL pode falhar
```

Porque `X` como don't care só faz sentido do lado de referência, onde está o RTL abstrato.

#### Modo `equality`

```tcl
set verification_passing_mode equality
```

Neste modo:

```text
X só passa contra X.
Ref X falha contra Impl 0 ou Impl 1.
```

É útil para RTL versus RTL, quando você quer comparação mais estrita de valores desconhecidos.

---

### Slide 18 — Example: Consistency vs. Equality

Código e script reconstruídos:

Referência `fred.v`:

```verilog
assign b = 1'bx;
```

Implementação `fred_c0.v`:

```verilog
assign b = 1'b0;
```

Script:

```tcl
read_verilog -r fred.v
set_top fred

read_verilog -i fred_c0.v
set_top fred_c0

verify
# This verification will pass

setup
set verification_passing_mode equality
verify
# This verification will fail
```

Caixas:

- X in Ref.
- 0 in Impl.
- Reference and Implementation asymmetric for consistency mode.
- No mode where `fred_c0` in Ref will pass against `fred` in Impl.

Interpretação:

No modo padrão `consistency`, a referência tem `X` e a implementação escolheu `0`. Isso passa:

```text
Ref X = Impl 0
```

Mas no modo `equality`, falha:

```text
X ≠ 0
```

A simetria é a pegadinha. Se inverter os lados e colocar `fred_c0` como referência e `fred` como implementação, não existe um modo equivalente onde `0` na referência aceite `X` na implementação como escolha válida de síntese.

Regra prática:

```text
RTL com X deve ficar no reference.
Gates com escolha concreta devem ficar no implementation.
```

---

### Slide 19 — X as don’t care: Formality Don’t care symbol

Figura:

O schematic mostra um bloco/célula com símbolo de don't care. Texto extraído:

- When DC (Don't Care) pin is 1, out is X.
- When DC is 0, out is F.

Interpretação:

O Formality representa don't cares no schematic com um símbolo específico. A função pode ser interpretada como:

```text
se o pino DC está ativo, a saída é X/don't care
se o pino DC está inativo, a saída segue a função F
```

Essa visualização ajuda a reconhecer que a ferramenta está modelando uma região como don't care, e não como lógica comum.

Em debug, ver esse símbolo no cone indica que a falha ou dificuldade pode estar relacionada a `X`/don't care.

---

### Slide 20 — Don’t Care (X) Analysis for Hard Verifications

Texto extraído:

- An X gives freedom to Design Compiler to do what it wants.
  - This can make verification harder for equivalency checking.
- `analyze_points` will identify and diagnose sources of don't cares for failing, hard and unverified compare points.
- Examples:
  - Direct assignment to don't cares in RTL.
  - `casex` and `casez` statements.
  - Over-indexing of array variables.

Interpretação:

`X` como don't care pode melhorar QoR, mas pode dificultar a prova formal.

Fontes comuns de `X`:

1. Atribuição direta:

```verilog
assign b = 1'bx;
```

2. `casex` e `casez`, porque podem mascarar bits desconhecidos ou don't care.

3. Indexação fora de faixa em arrays, que pode gerar valores indefinidos.

O comando:

```tcl
analyze_points
```

ajuda a identificar essas fontes quando há pontos:

- failing;
- hard;
- aborted;
- unverified.

Isso conecta a aula atual com a aula anterior de hard verifications e SVP.

---

### Slide 21 — Don’t Care (X) Analysis for Hard Verifications: example

Comando mostrado:

```tcl
fm_shell (verify)> analyze_points -aborted
```

Saída reconstruída:

```text
Found 1 RTL Source of X

An X source is caused due to direct assignment by the following
line in the RTL code:

reorder.v:147

Propagates 'X' to the ref compare point in the cones for 2 compare point(s):
  r:/WORK/top/out[2]
  r:/WORK/top/out[9]

Analysis Completed

Compare points that are aborted or unverified due to X sources
may potentially be resolved by re-writing the RTL constructs by eliminating the X sources.
```

Interpretação:

O exemplo mostra `analyze_points -aborted` encontrando uma fonte de `X` diretamente no RTL.

Ele informa:

- que existe uma fonte RTL de `X`;
- em qual arquivo e linha está;
- para quais compare points o `X` propaga;
- que a solução pode ser reescrever o RTL para eliminar a fonte de `X`.

Isso é extremamente útil porque transforma uma hard verification abstrata em uma ação concreta no RTL.

Exemplo de diagnóstico:

```text
O ponto não está falhando porque a netlist está errada.
Ele está hard/aborted porque o RTL contém X/don't care propagando até compare points.
```

---

## Aula didática desenvolvida

### 1. Por que interpretação de RTL é uma causa real de falha

Quando escrevemos RTL, podemos pensar que há apenas um significado para o código. Mas em ASIC há pelo menos três leituras relevantes:

1. **Simulação RTL**
   - Como o simulador interpreta.
   - Muitas vezes usada como golden reference funcional.

2. **Síntese**
   - Como o Design Compiler interpreta para criar hardware.
   - Pode tratar `X` como don't care.
   - Pode aplicar pragmas de `case`.

3. **Equivalence checking**
   - Como o Formality interpreta para comparar com gates.
   - Precisa ser coerente com DC quando o objetivo é verificar a netlist sintetizada.

Se essas leituras divergem, o Formality pode falhar ou alertar.

---

### 2. A independência DC × FM é uma proteção

Design Compiler e Formality têm leitores RTL independentes. Isso é uma vantagem de qualidade:

```text
se o DC errar na interpretação,
o Formality pode detectar.
```

Mas exige que o setup seja correto. Em especial:

```tcl
set synopsys_auto_setup true
set_svf design.svf
```

ajudam Formality a seguir a mesma intenção de síntese quando isso é desejado.

---

### 3. Mismatches não devem ser simplesmente ignorados

O Formality permite rebaixar mismatches para warning:

```tcl
set_mismatch_message_filter -warn
```

Mas isso deve ser usado com cuidado. Um mismatch pode indicar que:

```text
o RTL simulado não é o mesmo hardware que será sintetizado
```

O comando recomendado para investigar:

```tcl
report_hdlin_mismatches
```

Em projeto real, o ideal é:

1. listar mismatches;
2. entender cada tipo;
3. filtrar seletivamente apenas os aceitos;
4. documentar waivers.

---

### 4. Case pragmas: `full_case` e `parallel_case`

Pragmas como:

```verilog
// synopsys full_case
// synopsys parallel_case
```

são perigosos porque dizem ao DC para assumir certas condições que o RTL/simulador talvez não imponha.

Exemplo conceitual:

```text
O designer sabe que certos estados nunca ocorrem.
O DC usa essa assumption para otimizar.
O simulador pode ainda mostrar comportamento nesses estados.
Formality, por padrão, não assume a mesma coisa.
```

Para imitar DC:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
```

Mas a validade dessas assumptions precisa ser verificada no nível RTL.

---

### 5. `synopsys_auto_setup` como “behave like synthesis”

O `synopsys_auto_setup` ajusta várias variáveis para o Formality se comportar mais como a síntese.

Entre elas:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
set_mismatch_message_filters -warn
```

Isso explica por que ele resolve muitos false negatives: ele muda a interpretação do Formality para alinhar com o Design Compiler.

Mas se você quer preservar uma variável específica, use:

```tcl
set synopsys_auto_setup_filter { ... }
```

---

### 6. Pipe-clean do DC RTL reader

A ideia do pipe-clean é testar cedo se o DC consegue ler e sintetizar o RTL de forma verificável.

Não é uma síntese final de QoR. É uma síntese simples, com:

- hierarquia preservada;
- clock relaxado;
- biblioteca simples;
- menos boundary optimization;
- SVF gerado.

Exemplo de intenção:

```text
quero saber se o RTL e o leitor RTL do DC estão saudáveis,
não quero ainda otimização agressiva.
```

---

### 7. `X` como don't care

Em síntese, `X` dá liberdade:

```text
DC pode escolher 0 ou 1
```

Isso é bom para QoR, mas pode ser perigoso se o designer achava que `X` significava “desconhecido” de simulação.

No Formality, o modo padrão `consistency` permite:

```text
Ref:X passa contra Impl:0
Ref:X passa contra Impl:1
```

Isso modela o comportamento de síntese.

---

### 8. `consistency` versus `equality`

Use `consistency` quando comparar RTL com gates sintetizados:

```tcl
set verification_passing_mode consistency
```

Use `equality` quando quiser comparação estrita, especialmente RTL versus RTL:

```tcl
set verification_passing_mode equality
```

Diferença central:

```text
consistency: X na referência é don't care
equality: X precisa ser igual a X
```

A assimetria importa: coloque o RTL com `X` como referência.

---

### 9. `analyze_points` para fontes de X

Quando uma verificação fica hard, aborted ou unverified, o problema pode estar em fontes de `X` no RTL.

Comando:

```tcl
analyze_points -aborted
```

pode apontar:

- arquivo;
- linha;
- compare points afetados;
- tipo da fonte de `X`.

Isso permite resolver pela raiz:

```text
reescrever RTL para eliminar X/don't care problemático
```

---

## Conceitos difíceis explicados em profundidade

### Hardware interpretation versus simulation interpretation

A interpretação de hardware é aquela usada pela síntese para gerar portas. A interpretação de simulação é a usada pelo simulador RTL. Elas podem divergir quando o RTL contém pragmas, `X`, `casex`, `casez`, sinais sem driver ou construtos ambíguos.

---

### `full_case`

Pragma que sugere ao sintetizador que todos os casos possíveis foram cobertos, mesmo que o código não mostre explicitamente todos.

Risco:

```text
se um estado não coberto ocorrer em simulação/hardware, a síntese pode ter otimizado assumindo que ele nunca ocorre
```

---

### `parallel_case`

Pragma que sugere que as condições do `case` são mutuamente exclusivas.

Risco:

```text
se duas condições puderem ocorrer juntas, a síntese pode gerar lógica diferente da simulação
```

---

### `X` como don't care

Em síntese, `X` não significa necessariamente “valor desconhecido que precisa ser preservado”. Ele pode significar:

```text
qualquer valor serve aqui; escolha o melhor para QoR
```

---

### `verification_passing_mode consistency`

Modo padrão em que `X` na referência pode combinar com `0` ou `1` na implementação. Útil para RTL → gates.

---

### `verification_passing_mode equality`

Modo estrito em que `X` só combina com `X`. Útil para RTL → RTL.

---

### `synopsys_auto_setup_filter`

Permite impedir que `synopsys_auto_setup` altere algumas variáveis específicas.

---

### Pipe-clean

Fluxo simples para validar cedo que RTL, DC e Formality estão coerentes antes de síntese agressiva.

---

## Comandos importantes

### Mismatches RTL/hardware

```tcl
report_hdlin_mismatches
report_hdlin_mismatches -summary
```

```tcl
set_mismatch_message_filter -warn FMR_ELAB-116
set_mismatch_message_filter -warn
set_mismatch_message_filter -suppress
remove_mismatch_message_filter
report_mismatch_message_filters
```

### Case pragmas

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
```

### Auto setup e filtro

```tcl
set synopsys_auto_setup true
set synopsys_auto_setup_filter {hdlin_ignore_parallel_case hdlin_ignore_full_case}
printvar hdlin*case
```

### Pipe-clean DC

```tcl
set_svf mydesign.svf
set target_library "mystdcells.db"
create_clock -period 100 clk
set compile_enable_constant_propagation_with_no_boundary_opt false
set compile_preserve_subdesign_interfaces true
compile_ultra -no_autoungroup -no_boundary_optimization
write -format verilog -hier -output design_gates.v
```

### Pipe-clean FM

```tcl
set synopsys_auto_setup true
set_svf mydesign.svf
set target_library "mystdcells.db"
write_hierarchical_verification_script -replace \
  -dont_resolve_failures vhier.tcl
```

### X/don't care

```tcl
set verification_passing_mode consistency
set verification_passing_mode equality
```

### Análise de hard points por X

```tcl
analyze_points -aborted
```

---

## Figuras e diagramas importantes

### Independência dos leitores RTL

A figura DC RTL Reader versus FM RTL Reader mostra por que o Formality pode detectar bugs no leitor RTL do DC.

---

### Case pragmas

A figura divide a interpretação em:

```text
sem pragma assumption → simulação RTL golden
com pragma assumption → Design Compiler
```

Essa figura é a essência do problema de `full_case`/`parallel_case`.

---

### Pipe-clean do DC RTL reader

Mostra que o fluxo recomendado não é verificar uma netlist GTECH não mapeada, mas sintetizar para uma mapped netlist simples e verificar essa netlist.

---

### X as don't care

A figura mostra que o `X` existe no RTL, mas deve estar resolvido até a primeira compilação.

---

### Synthesis: X is don't care

Mostra que `z_reg = ar | 1'bx` pode virar tanto `z_reg = 1'b1` quanto `z_reg = ar`, dependendo da escolha de síntese.

---

### Consistency versus Equality

Mostra que a comparação passa no modo padrão quando a referência tem `X` e a implementação tem `0`, mas falha em `equality`.

---

### Formality don't care symbol

Mostra o símbolo de don't care no schematic, útil para reconhecer fontes de `X` no cone.

---

## Pontos de prova e revisão

1. DC e FM possuem leitores RTL independentes.
2. A independência permite que Formality detecte bugs no leitor RTL do DC.
3. Formality suporta os mesmos construtos RTL que DC, mas a implementação de leitura é independente.
4. Interpretação de simulação e interpretação de hardware podem divergir.
5. `set_top` pode falhar se o Formality detectar mismatch de interpretação.
6. `report_hdlin_mismatches` mostra detalhes de mismatches.
7. `set_mismatch_message_filter -warn` rebaixa mismatches para warning.
8. Filtragem seletiva é melhor que ignorar tudo globalmente.
9. `full_case` e `parallel_case` criam assumptions que DC usa, mas não verifica.
10. Formality por padrão não assume esses pragmas OOTB.
11. Para imitar DC, use `set hdlin_ignore_parallel_case false`.
12. Para imitar DC, use `set hdlin_ignore_full_case false`.
13. A validade dos pragmas deve ser verificada na verificação RTL.
14. `synopsys_auto_setup true` aceita esses pragmas e ajusta mismatches para warning.
15. `synopsys_auto_setup_filter` limita o efeito do auto setup.
16. Para pipe-clean do DC RTL reader, a implementação deve ser mapped netlist pós-compile.
17. Verificar antes de compile com GTECH não é recomendado/suportado.
18. Em pipe-clean, pode-se usar clock relaxado para acelerar.
19. Preservar hierarquia ajuda a isolar problemas.
20. `X` em síntese é tratado como don't care.
21. DC pode escolher `0` ou `1` para um `X`.
22. Formality por padrão trata `X` como síntese.
23. `verification_passing_mode consistency` é o modo padrão.
24. Em `consistency`, `Ref:X` passa contra `Impl:0` ou `Impl:1`.
25. `consistency` é assimétrico.
26. `verification_passing_mode equality` exige igualdade estrita.
27. `equality` é útil para comparar RTL contra RTL.
28. `analyze_points` pode diagnosticar fontes de `X`.
29. Fontes comuns de `X`: assignment direto, `casex`, `casez`, over-indexing de arrays.
30. Hard/aborted/unverified points podem ser resolvidos reescrevendo RTL para eliminar fontes de `X`.

---

## Relação com projeto/laboratório

Em laboratório, se o Formality falhar antes de `verify`, a primeira investigação desta aula é:

```tcl
report_hdlin_mismatches -summary
report_hdlin_mismatches
```

Se houver pragmas de `case`, conferir se o fluxo quer comportamento mais conservador ou comportamento igual ao DC:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
```

Se o projeto usa fluxo Synopsys padrão:

```tcl
set synopsys_auto_setup true
```

Para validar o leitor RTL do DC sem esperar síntese agressiva:

```tcl
set_svf mydesign.svf
set target_library "mystdcells.db"
create_clock -period 100 clk
set compile_preserve_subdesign_interfaces true
compile_ultra -no_autoungroup -no_boundary_optimization
write -format verilog -hier -output design_gates.v
```

Depois, no Formality:

```tcl
set synopsys_auto_setup true
set_svf mydesign.svf
read_verilog -r rtl.v
read_verilog -i design_gates.v
match
verify
```

Se a verificação ficar hard ou aborted por `X`:

```tcl
analyze_points -aborted
```

---

## Checklist de qualidade

- [x] Bloco 069 processado conforme roteiro, slides 1-21.
- [x] Texto dos prints foi convertido para conteúdo de estudo.
- [x] Figuras e fluxos foram interpretados.
- [x] Comandos Tcl foram preservados e explicados.
- [x] Pegadinhas sobre pragmas de case e `X` como don't care foram destacadas.
- [x] A diferença entre `consistency` e `equality` foi explicada.
- [x] O próximo bloco foi indicado conforme o roteiro.

---

## Próximo bloco

- **Bloco:** 070
- **Aula:** 08 RTL and Netlist Interpretation — parte B
- **Prioridade:** média
- **Arquivo para anexar:** mesmo arquivo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\08 RTL and Netlist Interpretation.docx
```

- **Processar somente:** slides 22-42
- **Começar por:** `Black-boxes`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\08 RTL and Netlist Interpretation_parte_B.md
```

- **Próximo depois dele:** Bloco 071 — `09 Sequential Design Transforms and SVF - parte A`
