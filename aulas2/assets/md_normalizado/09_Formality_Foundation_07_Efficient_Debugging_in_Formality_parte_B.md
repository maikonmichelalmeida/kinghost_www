# 07 Efficient Debugging in Formality — parte B

## Controle do bloco

- **Bloco:** 068
- **Curso:** 09 Formality Foundation
- **Aula:** 07 Efficient Debugging in Formality — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\07 Efficient Debugging in Formality.docx`
- **Continuação:** mesmo anexo usado na parte A
- **Faixa processada:** continuação a partir de `Guidance Summary: What to look for` até o fechamento da unidade
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\07 Efficient Debugging in Formality_parte_B.md
```

---

## Resumo executivo

Esta parte B completa a aula de **Efficient Debugging in Formality**. A parte A estabeleceu a mentalidade correta: a maioria das falhas em Formality são **false negatives**, isto é, a implementação pode estar boa, mas a ferramenta falha por causa de setup, SVF, matching ou guidance rejeitada. A parte B continua essa ideia com uma metodologia prática: antes de abrir um failing point isolado, olhe os resumos de cada estágio e tente descobrir se há uma causa comum.

O foco agora é:

1. O que procurar na **Guidance Summary**.
2. Como interpretar a **Matching Results Summary Table**.
3. Como raciocinar sobre unmatched points.
4. Como identificar sintomas de registros constantes não reconhecidos.
5. Como interpretar o estágio de `verify`.
6. Como controlar o número de failing points com `verification_failing_point_limit`.
7. Como chegar rápido aos pontos falhos usando `verification_effort_level`.
8. Como usar multicore para acelerar.
9. Como montar um script de bring-up eficiente.
10. Como usar `analyze_points -fail`.
11. Como usar a **Failing Pattern Window** para descobrir setup/matching issues.
12. Como consolidar um fluxo geral de debug.

A mensagem final da aula é muito importante: **depurar um único failing point na GUI pode não ser o melhor ponto de partida**. Em designs reais, muitos failures podem ter a mesma causa raiz. Portanto, o método eficiente é procurar padrões em summaries e relatórios antes de fazer debug manual de cone/pattern.

---

## Texto extraído e organizado por slide

### Slide 20 — Guidance Summary: What to look for

Texto extraído:

- **Does it look like the right SVF?**
  - Rough number and type of guide commands, Unit 4.
  - If you have a previous successful run for design, compare with Guidance Summary from that run.
- **Are there any rejected sequential or test guide commands?**
  - If yes, investigate further with:

```tcl
report_svf_operation -status rejected
```

  - `analyze_points` will catch a lot of this as well — but that is post-verify.

Interpretação:

Este slide é a continuação direta da parte A. A Guidance Summary deve ser lida como uma ferramenta de sanity check do SVF.

Perguntas fundamentais:

```text
Esse SVF parece ser o SVF certo?
O número de guide commands faz sentido?
Os tipos de guide commands fazem sentido para essa etapa?
Há rejeições sequenciais?
Há rejeições de scan/test?
```

Se você tem um run anterior bem-sucedido, compare a Guidance Summary atual com a anterior. Isso é muito poderoso: se antes havia milhares de comandos aceitos e agora quase nada, ou se de repente muitas operações críticas são rejeitadas, provavelmente o problema está no SVF, no script de DC ou na forma como o Formality está lendo o design.

O slide também reforça uma diferença temporal importante:

```text
Guidance Summary aparece no match.
analyze_points aparece depois do verify.
```

Então, se você usa a Guidance Summary bem, pode prever e corrigir problemas antes de gastar tempo no verify.

---

### Slide 21 — Matching Results Summary Table

Texto visível na tabela:

```text
Matching Results

24774 Compare points matched by name
66 Compare points matched by signature analysis
0 Compare points matched by topology
1837 Matched primary inputs, black-box outputs
805(977) Unmatched reference(implementation) compare points
0(0) Unmatched reference(implementation) primary inputs, black-box outputs
26841(0) Unmatched reference(implementation) unread points
```

A tabela inferior lista objetos unmatched, como:

```text
Cut-points (Cut)
Registers
DFF
Clock-gate LAT
Constant 0
Constant 1
```

Caixa do slide:

```text
What is important?
```

Interpretação:

O Match Summary deve ser lido com perguntas, não apenas como uma lista de números.

O que importa:

1. **Quantos compare points casaram por nome?**
   - Em fluxo Synopsys com SVF correto, espera-se muitos pontos casando por nome.

2. **Há muitos compare points casados por signature analysis?**
   - Pode ser normal em alguns casos, mas também pode indicar que os nomes mudaram e o Formality precisou usar heurísticas.

3. **Há unmatched compare points?**
   - Isso é crítico. É preciso entender se são esperados ou não.

4. **Há unmatched primary inputs ou black-box outputs?**
   - Isso costuma ser mais grave, porque inputs não casados podem afetar muitos cones.

5. **Há unread points?**
   - Normalmente unread points não afetam compare points nem primary outputs, mas ainda precisam ser entendidos.

6. **Quais tipos de objetos estão unmatched?**
   - Registros? Cutpoints? Clock-gating latches? Constantes?

O slide provoca a pergunta correta: não basta ver que há 805/977 unmatched points. É preciso perguntar **que tipo de unmatched são esses e se fazem sentido no fluxo**.

---

### Slide 22 — General matching reasoning

Texto extraído:

- **What needs to match**
  - compare points;
  - primary inputs or black-box outputs that drive compare points.
- **A matchable object in reference will not match if**
  - the implementation object exists but Formality cannot find it;
    - maybe the name is radically different.
  - the reference object has been transformed into something different and Formality does not know about that transform.
- **Common special cases**
  - Constant registers will likely be optimized away:
    - in Ref but not in Impl.
  - Clock-gating latches introduced during synthesis:
    - in Impl but not in Ref.
- If you are using SVF, expect things to match by name.

Interpretação:

Este slide ensina como raciocinar sobre matching.

Em equivalence checking, nem tudo precisa virar compare point. O que precisa casar:

```text
compare points
primary inputs
black-box outputs que alimentam compare points
```

Um objeto pode ficar unmatched por duas razões principais:

1. **O objeto correspondente existe, mas o Formality não encontrou**
   - nomes muito diferentes;
   - hierarquia alterada;
   - `change_names` rejeitado;
   - SVF errado;
   - ungrouping não compreendido.

2. **O objeto foi transformado em outra coisa**
   - registro constante removido;
   - registro mesclado;
   - latch de clock-gating inserido;
   - scan logic inserida;
   - retiming.

Casos especiais:

- Registro constante: pode existir na referência, mas ser removido na implementação.
- Clock-gating latch: pode ser inserido na implementação, mas não existir no RTL.

O detalhe final é forte:

```text
Se você está usando SVF corretamente, espera-se que muitas coisas casem por nome.
```

Se isso não acontece, investigue SVF, nomes, top, containers e setup.

---

### Slide 23 — Example: Constant registers

Figura e texto extraído:

O exemplo mostra um registro `fred_reg` na referência. O Design Compiler remove esse registro porque ele é constante `0`.

Texto da caixa:

```text
Assume DC has correctly removed fred_reg as a constant 0 register
```

Casos:

```text
Matching correct:
fred_reg will be identified as unmatched constant 0 register in Ref
```

```text
Matching incorrect:
fred_reg will be identified as unmatched non-constant DFF Ref

Verification will fail:
point a_reg[31] will fail for stimulus with fred logic 1 in Ref
```

Interpretação:

Esse exemplo é um dos mais importantes para debug eficiente.

Se o Design Compiler removeu corretamente `fred_reg` porque ele é constante `0`, o Formality deve reconhecer isso. O resultado esperado é:

```text
fred_reg = unmatched constant 0 register in Ref
```

Isso é aceitável porque o registro foi otimizado para uma constante.

Mas se o Formality não reconhece que `fred_reg` é constante, ele pode aparecer como:

```text
unmatched non-constant DFF in Ref
```

Aí a ferramenta acha que existe um registrador funcional na referência que desapareceu na implementação sem explicação. Tudo que depende desse registrador pode falhar.

A consequência:

```text
a_reg[31] pode falhar quando a lógica de fred produzir 1 na referência
```

Isso é típico de rejected `reg_constant`.

---

### Slide 24 — Matching Results Summary Table: Worth checking

A tabela mostra novamente o Match Summary e destaca:

```text
Worth checking
Where did these go?
Where did these come from?
These OK
```

Pontos destacados:

- Compare points matched by name.
- Compare points matched by signature analysis.
- Unmatched registers.
- DFF em referência.
- Clock-gate latches em implementação.
- Constant 0 e Constant 1.

Interpretação:

O slide ensina a criar o hábito de fazer as perguntas certas sobre o Match Summary:

```text
Os pontos casados por nome fazem sentido?
Por que alguns pontos precisaram de signature analysis?
Para onde foram os DFFs da referência?
De onde vieram os clock-gate latches da implementação?
As constantes 0/1 são esperadas?
```

Na figura, certos itens são marcados como “These OK” porque constantes e clock-gating latches podem ser esperados em fluxos Synopsys, desde que o Formality os reconheça corretamente.

Mas DFFs unmatched não constantes são suspeitos. A pergunta “Where did these go?” é o tipo de raciocínio que evita debug cego.

---

### Slide 25 — Verify Stage

Figura:

O fluxo Formality destaca:

```text
Verify
↓
Pass/Fail/Inconclusive
```

Caixa indicada:

```text
Verification Results Table
analyze_points
```

Interpretação:

Depois do match, entra o estágio de verify. Aqui o Formality usa seus algoritmos para provar equivalência ou não equivalência dos compare points casados.

O ponto metodológico é:

```text
Depois do verify, comece pela Verification Results Table e por analyze_points.
```

Não comece diretamente por um failing pattern isolado se o resultado geral ainda não foi entendido.

---

### Slide 26 — Verify Implementation Design

Texto extraído:

- Runs Formality's verification algorithms on compare points.
  - Formality deploys many different solvers.
  - Each solver uses a different algorithm to prove equivalence or non-equivalence.
- Four possible results:
  - **Succeeded:** Implementation is equivalent to the reference.
  - **Failed:** Implementation is not equivalent to the reference.
    - True logic difference or setup problem.
  - **Inconclusive:** No points failed, but analysis is incomplete.
    - Might be due to timeout or complexity.
  - **Not run:** A problem earlier in the flow prevented verification from running at all.

Interpretação:

O Formality não usa um único algoritmo. Ele usa múltiplos solvers para tentar provar equivalência ou diferença.

Os resultados principais:

1. **Succeeded**
   - equivalência provada.

2. **Failed**
   - há pontos não equivalentes.
   - pode ser diferença real ou setup problem.

3. **Inconclusive**
   - não encontrou falha, mas não conseguiu completar a prova.
   - pode ser timeout, complexidade ou hard verification.

4. **Not run**
   - algo antes impediu o verify.

Pegadinha:

```text
Failed não significa automaticamente bad silicon.
Pode ser setup problem.
```

---

### Slide 27 — Verify Implementation Design (status messages)

Tabela extraída e explicada:

Durante a verificação, o Formality atribui status aos compare points:

| Status | Significado |
|---|---|
| Passing | O compare point passou; as funções são equivalentes. |
| Failing | O compare point não passou; Formality determinou diferença funcional entre os objetos comparados. |
| Aborted | Formality não determinou pass/fail; pode haver loop combinacional não quebrado ou ponto difícil demais. |
| Unverified | O ponto ainda não foi verificado; pode ocorrer porque limite de failing points ou wall clock foi atingido. |
| Not Verified / Not Run | A verificação nem rodou para o ponto por algum erro anterior. |

Interpretação:

Essa tabela é essencial para não confundir status.

- **Failing** significa que a ferramenta encontrou contraexemplo.
- **Aborted** não significa fail; significa que a ferramenta não conseguiu concluir.
- **Unverified** não significa que o ponto é bom; significa que ele ainda não foi analisado.
- **Not run** aponta problema anterior.

Em debug, misturar esses status leva a conclusões erradas.

---

### Slide 28 — Verify Implementation Design (matched pairs)

Texto extraído:

- For each matched pair of compare points, Formality:
  - confirms same functionality of logic cones;
  - marks point as “passed”;
  - or determines that functionality is different between logic cones;
  - finds one or more “counter examples” that shows different response at compare point;
  - marks the compare point as “failed”.
- All valid compare points are verified:
  - Constant registers are not verified.
  - “Unread” compare points are not verified by default.
    - Unread points do not affect other compare points or primary outputs.

Interpretação:

O verify funciona por pares de compare points já casados.

Para cada par:

```text
Ref compare point ↔ Impl compare point
```

o Formality tenta provar que os logic cones são equivalentes.

Se não são, ele encontra um **counterexample** — uma combinação de estímulos que produz respostas diferentes.

Pontos importantes:

- Registros constantes não são verificados como compare points comuns.
- Unread points não são verificados por padrão porque não afetam compare points nem primary outputs.

---

### Slide 29 — Do I have all failing points?

Texto extraído:

- The number of points that will fail is controlled by the variable:

```tcl
verification_failing_point_limit
```

- Default value is `20`.
- A `0` setting means unlimited failures.
- When the failing point limit is reached Formality will stop `verify` command.
  - All outstanding points classified as unverified.
  - Verify is incremental — so another `verify` will start with unverified list and stop after another 20 failures.
- Caixa:
  - May not have all failing points yet.

Interpretação:

Por padrão, o Formality para depois de encontrar 20 failing points:

```tcl
verification_failing_point_limit = 20
```

Isso significa que, se o relatório mostra 20 failures, talvez existam muitos outros. Os demais ficam como `unverified`.

Para trazer todos:

```tcl
set verification_failing_point_limit 0
```

Mas isso pode aumentar tempo. Em bring-up, às vezes vale a pena usar 0 para ver o padrão completo das falhas.

Pegadinha:

```text
Se o limite foi atingido, você ainda não sabe todos os failing points.
```

---

### Slide 30 — How does one get to failing points fast?

Texto extraído:

- When bringing up a design often want to get to failing points as fast as possible.
- By default Formality, if there are hard points, will spend a lot of CPU time on those points.
  - Not uncommon for a small percentage of the compare points to take a large fraction of the verification time.
- One can control the amount of effort spent on points by variable:

```tcl
verification_effort_level
```

- Default setting: `high`.
- Lowest setting: `super_low`.
  - May want `super_low` when bringing up design.

Interpretação:

Durante bring-up, o objetivo inicial pode não ser provar tudo. Pode ser descobrir rapidamente se há falhas óbvias de setup.

Se o Formality gasta muito tempo tentando resolver hard points, você pode reduzir o esforço:

```tcl
set verification_effort_level super_low
```

Isso faz a ferramenta gastar menos tempo por ponto e chegar mais rápido aos failing points.

Uso típico:

```text
bring-up inicial → super_low
signoff/prova final → high/default ou estratégia adequada
```

---

### Slide 31 — Getting results fast: Multicore Support

Texto extraído:

- Specify up to 4 cores — with a single license.
  - Can go up to 8 cores, pulls extra Formality licenses, but beyond 4 not currently the sweet spot of tool.
- Single command for setup:

```tcl
set_host_options -max_cores num_cores
```

- Command for reporting maximum number of cores:

```tcl
report_host_options
```

Interpretação:

O Formality pode usar múltiplos cores para acelerar.

Com uma licença, é possível usar até 4 cores. Até 8 pode ser possível, mas consome licenças extras e, segundo o slide, acima de 4 não é necessariamente o ponto ideal.

Comandos:

```tcl
set_host_options -max_cores 4
report_host_options
```

Uso prático:

```text
em bring-up ou regressão, configure multicore para reduzir tempo de verify
```

---

### Slide 32 — Example: Bringing up a design at verify stage

Script extraído e organizado:

```tcl
set synopsys_auto_setup true
set_svf design.svf

# Read in RTL and netlist

match

# Optional
set verification_failing_point_limit 0

# Useful
set verification_effort_level super_low

verify
```

Caixas explicativas:

- If design has multiple issues maybe don't want to stop after first 20 failures.
- Don't want Formality to waste time on hard to verify points.

Interpretação:

Esse é um script de bring-up, não necessariamente de signoff.

Ideia:

1. Usar auto setup e SVF.
2. Fazer match.
3. Opcionalmente permitir falhas ilimitadas:

```tcl
set verification_failing_point_limit 0
```

4. Reduzir esforço para chegar rápido aos problemas:

```tcl
set verification_effort_level super_low
```

5. Rodar verify.

Esse fluxo é bom quando você quer identificar rapidamente padrões de falha causados por setup.

---

### Slide 33 — Analysis of Failing Points

Texto extraído:

```tcl
analyze_points -fail
```

- By default analyzes all failing points and gives both summary and some details.

Interpretação:

Depois de obter failing points, o comando:

```tcl
analyze_points -fail
```

ou, em algumas versões/estilos:

```tcl
analyze_points -failing
```

analisa os pontos falhos e tenta agrupá-los por causas prováveis.

A GUI mostra categorias possíveis de causas, como:

- Unmatched implementation input.
- Unmatched cone input.
- Rejected SVF operation.
- Constant register issue.
- Setup/matching-related categories.

A ideia é agrupar sintomas. Se 200 pontos falham pela mesma causa, `analyze_points` ajuda a mostrar isso.

---

### Slide 34 — Failing Pattern Window

Texto extraído:

- Allows identification of issues with setup and matching.
  - This example shows scan enable signal which makes verification fail when it has a `1` value.
  - Try using:

```tcl
set_constant Simpl/test_se 0
```

to get a successful verification.

Interpretação:

A Pattern Window mostra um counterexample para o failing point. No exemplo, ela revela que `test_se` está em `1`, ativando o modo scan e mudando a função do circuito.

Isso indica que a falha não é necessariamente lógica funcional errada, mas setup de scan incorreto. A correção sugerida é:

```tcl
set_constant Simpl/test_se 0
```

Isso força o circuito em modo funcional, desativando scan.

Esse slide reforça uma ideia recorrente:

```text
Pattern Window não serve só para provar diferença lógica.
Ela também ajuda a descobrir setup problem.
```

---

### Slide 35 — Example Formality Script

Script extraído e organizado:

```tcl
set synopsys_auto_setup true
set_svf design.svf

# Read in RTL and netlist

report_setup_status
match
report_setup_status
save_session -replace match.fss
report_unmatched_points > unmatched.rpt
report_svf_operation -status rejected > rej.txt

if {![verify]} {
  save_session -replace verify.fss
  report_failing_points > failing.rpt
  analyze_points -fail > analysis_fail.rpt
}
```

Interpretação:

Este é um script excelente para regressão e bring-up.

Ele captura artefatos importantes em cada estágio:

- `report_setup_status` antes/depois do match;
- sessão salva após match:

```tcl
save_session -replace match.fss
```

- relatório de unmatched points:

```tcl
report_unmatched_points > unmatched.rpt
```

- relatório de guidance rejeitada:

```tcl
report_svf_operation -status rejected > rej.txt
```

Depois do verify, se falhar:

- salva sessão:

```tcl
save_session -replace verify.fss
```

- gera failing report:

```tcl
report_failing_points > failing.rpt
```

- gera análise:

```tcl
analyze_points -fail > analysis_fail.rpt
```

Esse script cria um pacote de debug, permitindo analisar sem repetir tudo manualmente.

---

### Slide 36 — Unidentified constant register

Figura:

O fluxo mostra que uma causa pode aparecer em múltiplos lugares.

Caixas do slide:

- **Failing cause shows up in multiple places: Eg Unidentified constant reg**
- Nothing here — no check reading.
- Guidance Summary:
  - Possible rejected `reg_constant`.
- Match Summary:
  - Unmatched non-constant register.
- Verification Results Table:
  - Everything that register drives will fail.
- `analyze_points`:
  - Will point out rejected `reg_constant`.

Interpretação:

Este slide é uma síntese perfeita da aula.

Um problema de registro constante não reconhecido aparece em vários estágios:

1. **Read stage**
   - Nada aparece.

2. **Guidance Summary**
   - Pode mostrar `reg_constant` rejeitado.

3. **Match Summary**
   - Mostra unmatched non-constant register.

4. **Verify Results**
   - Todos os pontos alimentados por esse registro falham.

5. **analyze_points**
   - Aponta rejected `reg_constant`.

Isso reforça a metodologia: uma falha individual no verify é apenas o sintoma final. A causa raiz já estava visível no match/guidance summary.

---

### Slide 37 — Debugging General Flow Chart

Fluxo extraído da figura:

```text
Start
↓
Review the transcript for important messages
↓
Resolve black boxes and library issues
↓
SVF flow being used?
  ├─ Yes → Consider using synopsys_auto_setup
  └─ No  → seguir investigação
↓
Unexplained unmatched points?
  ├─ Yes → Check for failing SVF operations → Change setup → Run Analyze
  └─ No  → Choose point to debug
↓
Problem identified?
  ├─ Yes → Finish
  └─ No  → Choose point to debug
↓
Display pattern window
↓
Display logic cone
↓
Isolate difference
↓
Finish
```

Interpretação:

O flow chart organiza todo o método:

1. Comece pelo transcript.
2. Resolva black boxes e library issues.
3. Se usa SVF, considere `synopsys_auto_setup`.
4. Se há unmatched points inexplicados, investigue SVF rejection antes de escolher failing point.
5. Rode análise.
6. Só depois vá para debug de ponto individual:
   - Pattern Window;
   - Logic Cone;
   - Isolate difference.

A lógica é clara:

```text
resolva problemas globais antes de investigar sintomas locais.
```

---

### Slide 38 — Unit Summary

Texto extraído:

- Plan to use Formality early in project.
- Debugging a single failing point in GUI may not be efficient starting point.
  - Each Formality stage has summary information:
    - Match Summary, Guidance Summary.
    - Verification results, `analyze_points`.
  - The majority of issues can be diagnosed and debugged before verify.
- Then, if required, use some of the single point debug features of Formality:
  - Pattern window.

Interpretação:

O resumo final reforça as mensagens essenciais da unidade:

1. Use Formality cedo no projeto.
2. Não comece pelo debug de um failing point isolado.
3. Use summaries primeiro.
4. A maioria dos problemas pode ser diagnosticada antes do verify.
5. Se necessário, use recursos de debug ponto a ponto:
   - Pattern Window;
   - Logic Cone;
   - Matched Point Window;
   - análise de cone.

---

## Aula didática desenvolvida

### 1. O objetivo do debug eficiente

Debug eficiente em Formality não significa saber clicar em muitas janelas. Significa saber **onde olhar primeiro**.

A ordem recomendada é:

```text
transcript
report_setup_status
Guidance Summary
Match Summary
Verification Results Table
analyze_points
Pattern Window
Logic Cone
```

O erro comum é inverter:

```text
abrir failing point → abrir cone → tentar entender tudo manualmente
```

Isso é ruim porque um único problema global pode gerar centenas de failures.

---

### 2. Guidance Summary: o radar antes da tempestade

A Guidance Summary aparece antes do verify. Isso permite antecipar problemas.

Exemplo:

```text
reg_constant rejected
```

Isso pode prever:

```text
unmatched non-constant DFF no Match Summary
vários failing points no Verify
analyze_points apontando rejected reg_constant
```

Portanto, a Guidance Summary é um radar: ela mostra o problema antes da falha aparecer no verify.

---

### 3. Match Summary: perguntar para onde os objetos foram

Ao ver unmatched objects, pergunte:

```text
Esse objeto deveria desaparecer?
Ele virou constante?
Foi introduzido por clock-gating?
Foi renomeado?
Foi removido por otimização sequencial?
Foi criado por scan?
```

Exemplo:

- `Constant 0` na referência pode ser normal.
- `Clock-gate LAT` na implementação pode ser normal.
- `DFF` não constante unmatched na referência é suspeito.

A habilidade é distinguir objetos esperados de objetos inexplicados.

---

### 4. Verify Results: interpretar status corretamente

Nem tudo que não passou é “failing”.

Diferenças:

```text
Failing     → contraexemplo encontrado
Aborted     → ferramenta não conseguiu concluir
Unverified  → ainda não analisado, limite/tempo pode ter parado
Not run     → problema anterior impediu verify
```

Isso muda a ação:

- Failing: olhar pattern/analyze_points.
- Aborted: pode ser hard verification/SVP/effort/solver.
- Unverified: talvez limite de failing points foi atingido.
- Not run: corrigir problema anterior.

---

### 5. Failing point limit pode esconder falhas

Por padrão:

```tcl
verification_failing_point_limit = 20
```

Se o relatório mostra exatamente 20 failures, desconfie:

```text
talvez existam mais failures não vistos
```

Para trazer todos:

```tcl
set verification_failing_point_limit 0
```

Isso é útil no bring-up para ver o padrão global.

---

### 6. Effort level: chegar rápido ao sintoma

Em bring-up, às vezes não queremos que o Formality gaste horas tentando resolver hard points. Queremos encontrar problemas óbvios.

Use:

```tcl
set verification_effort_level super_low
```

Isso sacrifica profundidade da prova, mas acelera o diagnóstico inicial.

---

### 7. Multicore: acelerar sem mudar a lógica

Comando:

```tcl
set_host_options -max_cores 4
```

E para conferir:

```tcl
report_host_options
```

Até 4 cores com uma licença é o ponto destacado pelo slide. Isso pode reduzir tempo de verify sem alterar setup ou design.

---

### 8. analyze_points: agrupar falhas por causa provável

`analyze_points -fail` é útil porque agrupa failing points em categorias de causa.

Exemplo:

```text
100 failing points
causa comum: rejected reg_constant
```

Sem `analyze_points`, você poderia depurar 100 pontos manualmente. Com ele, corrige a causa raiz.

---

### 9. Pattern Window: útil, mas depois dos summaries

A Pattern Window mostra contraexemplos e pode revelar setup problem, como `test_se = 1`.

No exemplo:

```tcl
set_constant Simpl/test_se 0
```

pode corrigir a verificação.

Mas a aula deixa claro: Pattern Window é poderosa, porém geralmente deve vir depois dos summaries.

---

### 10. Script de debug: gerar artefatos automaticamente

O script do slide é bom porque salva relatórios antes e depois do match/verify.

Ele cria:

```text
match.fss
unmatched.rpt
rej.txt
verify.fss
failing.rpt
analysis_fail.rpt
```

Isso transforma um run de Formality em um pacote de debug. Muito melhor do que depender apenas do transcript.

---

## Conceitos difíceis explicados em profundidade

### Unmatched non-constant register

É um registro que aparece sem match, mas que o Formality não reconheceu como constante. Isso é perigoso, porque pode indicar que uma otimização sequencial importante não foi compreendida.

---

### Unmatched constant register

É um registro sem match, mas identificado como constante. Em muitos fluxos, isso é esperado porque o DC removeu o registro e substituiu por `0` ou `1`.

---

### Clock-gating latch

Latch introduzido pela síntese para clock gating. Pode aparecer na implementação sem existir no RTL. Com setup/SVF correto, isso pode ser entendido pelo Formality.

---

### Signature analysis

Técnica de matching usada quando nomes não bastam. Pode ser útil, mas se muitos pontos precisam dela, vale investigar por que o match por nome não está acontecendo.

---

### Failing point limit

Limite de pontos falhos que o Formality coleta antes de parar o verify. Default:

```text
20
```

Com `0`, falhas ilimitadas.

---

### Effort level

Controla quanto esforço de solver o Formality dedica por ponto. `super_low` é útil no bring-up para chegar rápido a falhas.

---

## Comandos importantes

### Guidance e SVF

```tcl
report_svf_operation -status rejected
report_svf_operation -status rejected -command reg_constant
```

### Matching

```tcl
report_unmatched_points > unmatched.rpt
```

### Verify

```tcl
set verification_failing_point_limit 0
set verification_effort_level super_low
verify
```

### Multicore

```tcl
set_host_options -max_cores 4
report_host_options
```

### Analysis

```tcl
analyze_points -fail
analyze_points -failing
```

### Script de setup comum

```tcl
set synopsys_auto_setup true
set_svf design.svf
```

### Scan enable

```tcl
set_constant Simpl/test_se 0
```

---

## Script modelo consolidado

```tcl
set synopsys_auto_setup true
set_svf design.svf

# Read in RTL and netlist

report_setup_status

match

report_setup_status
save_session -replace match.fss

report_unmatched_points > unmatched.rpt
report_svf_operation -status rejected > rej.txt

# Bring-up options
set verification_failing_point_limit 0
set verification_effort_level super_low

if {![verify]} {
  save_session -replace verify.fss
  report_failing_points > failing.rpt
  analyze_points -fail > analysis_fail.rpt
}
```

Uso:

- `match.fss`: estado logo após match.
- `unmatched.rpt`: objetos sem match.
- `rej.txt`: operações SVF rejeitadas.
- `verify.fss`: estado após verify falho.
- `failing.rpt`: pontos falhos.
- `analysis_fail.rpt`: causas prováveis agrupadas.

---

## Figuras e diagramas importantes

### Matching Results Summary Table

A figura ensina a olhar não só o total de unmatched points, mas o tipo deles. Perguntas do slide:

```text
Where did these go?
Where did these come from?
```

Essa é a mentalidade correta.

---

### Constant register example

Mostra que um registro removido corretamente pelo DC deve aparecer como constant unmatched. Se aparece como non-constant unmatched, a verificação pode falhar.

---

### Verify status table

Diferencia passing, failing, aborted, unverified e not verified. Essa tabela evita interpretações erradas do resultado.

---

### Failing point limit

Mostra que o resultado pode não conter todos os failing points se o limite foi atingido.

---

### Failing Pattern Window

Mostra scan enable causando falha quando vale `1`, sugerindo `set_constant Simpl/test_se 0`.

---

### Unidentified constant register flow

Mostra que a mesma causa aparece em Guidance Summary, Match Summary, Verification Results e `analyze_points`.

---

### Debugging General Flow Chart

Mostra a ordem correta de debug:

```text
transcript → libraries/black boxes → SVF/auto setup → unmatched/SVF ops → analyze → point debug
```

---

## Pontos de prova e revisão

1. Guidance Summary deve ser lida antes do verify.
2. Compare Guidance Summary atual com run anterior bem-sucedido quando possível.
3. Rejeições sequenciais e de test são mais perigosas que rejeições combinacionais.
4. `report_svf_operation -status rejected` mostra detalhes de operações SVF rejeitadas.
5. Match Summary deve ser lido por tipo de objeto unmatched.
6. Compare points, primary inputs e black-box outputs que dirigem compare points precisam casar.
7. Com SVF correto, espera-se muito match por nome.
8. Constant registers podem aparecer na referência e sumir na implementação.
9. Clock-gating latches podem aparecer na implementação e não no RTL.
10. Unmatched constant register pode ser esperado.
11. Unmatched non-constant DFF é suspeito.
12. Verify pode terminar como succeeded, failed, inconclusive ou not run.
13. Failed pode ser true logic difference ou setup problem.
14. Inconclusive pode indicar timeout ou complexidade.
15. Aborted não é a mesma coisa que failed.
16. Unverified pode aparecer porque limite de failing points foi atingido.
17. `verification_failing_point_limit` default é 20.
18. `verification_failing_point_limit 0` significa falhas ilimitadas.
19. `verification_effort_level super_low` ajuda no bring-up.
20. Multicore pode ser configurado com `set_host_options -max_cores`.
21. `analyze_points -fail` agrupa failing points por causas prováveis.
22. Pattern Window pode revelar problemas de setup, como `test_se = 1`.
23. `set_constant Simpl/test_se 0` pode corrigir falhas de scan enable livre.
24. Salvar sessões `match.fss` e `verify.fss` ajuda no debug.
25. A maioria dos issues pode ser diagnosticada antes do verify.
26. Debug de ponto único na GUI não deve ser o primeiro passo em design grande.
27. Transcript deve ser revisado logo no início.
28. Black boxes e library issues devem ser resolvidos antes de debug funcional.
29. Se usa SVF, considere `synopsys_auto_setup`.
30. A causa raiz pode aparecer em vários relatórios diferentes.

---

## Relação com projeto/laboratório

A sequência prática recomendada para um laboratório ou projeto real:

```text
1. Rodar Formality com synopsys_auto_setup e SVF.
2. Checar transcript.
3. Rodar report_setup_status.
4. Rodar match.
5. Ler Guidance Summary.
6. Ler Match Summary.
7. Gerar report_unmatched_points.
8. Gerar report_svf_operation -status rejected.
9. Só então rodar verify.
10. Se falhar, salvar sessão, report_failing_points e analyze_points.
11. Usar Pattern Window/Logic Cone apenas quando summaries não forem suficientes.
```

---

## Checklist de qualidade

- [x] Parte B processada como continuação da parte A.
- [x] Conteúdo estruturado como acervo didático.
- [x] Texto das figuras foi extraído e explicado.
- [x] Tabelas e fluxogramas foram interpretados.
- [x] Comandos Tcl foram preservados.
- [x] Pegadinhas de prova foram destacadas.
- [x] Script de debug foi consolidado.
- [x] Estratégia de debug foi organizada por estágios.

---

## Próximo bloco

O próximo bloco deve ser conferido no roteiro antes de processar, pois esta aula encerra `07 Efficient Debugging in Formality`. Pelo padrão do curso, o próximo arquivo deve iniciar a unidade seguinte dentro de **09 Formality Foundation**, mas é melhor confirmar o nome exato no roteiro antes de anexar/processar.
