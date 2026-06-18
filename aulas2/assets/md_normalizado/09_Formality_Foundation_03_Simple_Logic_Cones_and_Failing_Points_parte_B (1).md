# 03 Simple Logic Cones and Failing Points — parte B

## Controle do bloco

- **Bloco:** 062
- **Curso:** 09 Formality Foundation
- **Aula:** 03 Simple Logic Cones and Failing Points — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\03 Simple Logic Cones and Failing Points.docx`
- **Faixa processada:** slides 16-29
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\03 Simple Logic Cones and Failing Points_parte_B.md
```

- **Próximo bloco recomendado:** Bloco 063 — `04 Multi-Stage Verifications and SVF`

---

## Resumo executivo

Esta parte continua exatamente de onde a parte A parou: o `match` entre `fred` e `fred2` parece limpo, mas o `verify` detecta uma diferença funcional no compare point `z1_reg`. O objetivo agora é aprender **como descobrir por que um ponto falhou**.

A sequência didática é muito boa: primeiro o Formality mostra o resumo de falha no transcript; depois a aula usa a **Pattern Window** para descobrir o estímulo que causa a divergência; em seguida usa `analyze_points -failing` para obter uma análise textual da causa provável; depois abre os **logic cones** para ver graficamente a diferença entre referência e implementação; e por fim introduz **probe points** para comparar nets internas dentro dos cones.

O conceito final da aula é sutil e importante: restringir input values com `set_constant` pode resolver uma falha, mas se a constante for aplicada só em um lado da comparação, ela pode criar uma nova diferença artificial. No exemplo, fixar `c = 1` somente na implementação faz `z1_reg` passar, mas faz `z2_reg` falhar. Para a comparação ser justa, a restrição precisa ser aplicada de forma coerente na referência e na implementação.

---

## Texto extraído e organizado por slide

### Slide 16 — The verification results summary

Texto extraído:

- Comando:

```tcl
verify
```

- At the end of `verify` you will get a verification results summary. In this example:
  - Verification fails as one would expect.
  - 1 DFF fails — the rest of output ports and DFFs pass.
  - Not shown but `report_failing_points` would list the `z1_reg` point.
- Anotações da figura:
  - **Failing point in transcript**
  - **Summary of results**
  - The `verify` command returns `0` when doesn't succeed.

Trecho conceitual do transcript:

```text
Status: Verifying...
Compare point z1_reg failed (is not equivalent)

Verification FAILED

3 Passing compare points
1 Failing compare point
0 Aborted compare points
0 Unverified compare points
```

Interpretação:

Este slide confirma a previsão feita na parte A. O `match` foi limpo, mas o `verify` falhou. Isso mostra a diferença exata entre as duas etapas:

- `match`: alinhou `z1_reg` com `z1_reg`;
- `verify`: provou que a função do `z1_reg` não é equivalente.

O ponto que falha é o registrador `z1_reg`, porque:

```verilog
// Referência fred
z1 <= a & b;

// Implementação fred2
z1 <= a & b & c;
```

O Formality encontra uma combinação de entradas em que essas duas expressões produzem valores diferentes.

O retorno do comando também é importante para scripts:

- `verify` retorna `1` quando a verificação passa;
- `verify` retorna `0` quando a verificação não tem sucesso.

Esse retorno pode ser usado em automação para decidir se o fluxo continua ou para interromper o processo com erro.

---

### Slide 17 — For what stimulus would `z1_reg` fail?

Texto extraído:

- The pattern window in the Formality tells you for what stimulus a compare point fails.
- To pull up the pattern window:
  - Select the failing point under the failing points tab under Debug.
  - Click on the show patterns icon.

Interpretação:

Depois que o Formality identifica o compare point que falhou, o próximo passo é descobrir **qual estímulo causa a falha**.

A Pattern Window mostra um contraexemplo. Em verificação formal, esse contraexemplo é uma combinação de valores nos inputs do logic cone que prova que referência e implementação não são equivalentes.

No exemplo, o compare point falho é `z1_reg`. A pergunta que o slide faz é:

```text
Para quais valores de a, b e c o z1_reg da referência difere do z1_reg da implementação?
```

---

### Slide 18 — For what stimulus would `z1_reg` fail? Resultado do estímulo

Texto extraído:

- The `z1_reg` only fails when `c` is `0`.
  - `a & b & 1 = a & b`
- The `z1_reg` only fails when `a` and `b` are `1`.
  - That is if `a&b = 0`, `a&b&c = a&b`.
- Anotações da figura:
  - **Results of stimulus here**
  - **Stimulus driven on logic cone inputs**
  - **Greyed out value 0: Failure doesn't depend on this value**

Caixa de código no slide:

```text
Ref (fred)
z1 <= a & b;

Impl (fred2)
z1 <= a & b & c;
```

Análise funcional:

A referência calcula:

```text
z1_ref = a & b
```

A implementação calcula:

```text
z1_impl = a & b & c
```

Para os dois valores serem diferentes, precisamos de:

```text
z1_ref = 1
z1_impl = 0
```

Isso ocorre quando:

```text
a = 1
b = 1
c = 0
```

Tabela:

| a | b | c | `z1_ref = a & b` | `z1_impl = a & b & c` | Resultado |
|---|---|---|---|---|---|
| 0 | 0 | X | 0 | 0 | passa |
| 0 | 1 | X | 0 | 0 | passa |
| 1 | 0 | X | 0 | 0 | passa |
| 1 | 1 | 1 | 1 | 1 | passa |
| 1 | 1 | 0 | 1 | 0 | falha |

O “X” nesta tabela didática significa “não importa para a diferença neste caso”, não necessariamente o valor desconhecido do simulador. A ideia é que, quando `a & b = 0`, a saída será `0` nos dois designs, independentemente de `c`.

---

### Slide 19 — Other points of interest in pattern window

Texto extraído:

- For the failing vector Ref is loading a `1`, Impl is loading a `0`.
- Anotações:
  - `1 & 1 = 1`
  - `1 & 1 & 0 = 0`
- `c` is unmatched in the Impl logic cone.
  - From the match summary we know it matches to the Ref.
  - But `c` does not drive `z1_reg` in the Ref.
- Anotações:
  - **Empty**
  - **Only 1 vector. All other vectors pass**

Caixa de código no slide:

```text
Ref (fred)
z1 <= a & b;

Impl (fred2)
z1 <= a & b & c;
```

Interpretação:

Este slide aprofunda a leitura da Pattern Window.

A janela mostra que, para o vetor que falha:

```text
Referência carrega 1 em z1_reg
Implementação carrega 0 em z1_reg
```

Isso é coerente com a expressão:

```text
Ref:  1 & 1     = 1
Impl: 1 & 1 & 0 = 0
```

O ponto mais interessante é o papel de `c`. O input `c` existe nos dois designs e foi casado no match summary. Portanto, `c` não é um input “sem match” no design como um todo.

Mas no cone específico de `z1_reg`:

- na implementação, `c` participa do cone;
- na referência, `c` não participa do cone.

Assim, a diferença não é que `c` não exista na referência. A diferença é que `c` existe, mas não influencia `z1_reg` na referência.

Essa é uma distinção essencial em debug de equivalência:

```text
Um sinal pode estar casado globalmente, mas ainda aparecer como diferença dentro de um cone específico.
```

---

### Slide 20 — Formality Analysis: `analyze_points`

Texto extraído:

- Formality can analyze failing points and suggest reasons why something has failed for common problems.
- Either under GUI or command:

```tcl
analyze_points -failing
```

Trecho conceitual do relatório mostrado:

```text
Found 1 Unmatched Cone Input

Unmatched cone inputs result either from mismatched compare points
or from differences in the logic within the cones. Only unmatched
inputs that are suspected of contributing to verification failures
are included in the report.

The source of the matching or logical difference may be determined
using the schematic, cone and source views.

i:/WORK/fred2/c
  Matched with port r:/WORK/fred/c
  Exists in the impl cone but not in the ref cone for 1 compare point(s):
    r:/WORK/fred/z1_reg
```

Interpretação:

O comando `analyze_points -failing` tenta explicar a falha em linguagem mais próxima do engenheiro.

Ele identifica que há um **unmatched cone input**, isto é, um input que aparece em um cone, mas não no cone correspondente do outro design.

No caso:

```text
i:/WORK/fred2/c
```

existe no cone da implementação para `z1_reg`, mas não existe no cone da referência para o mesmo compare point.

O relatório também esclarece que `c` está casado com:

```text
r:/WORK/fred/c
```

Então não é problema de match global. É uma diferença de cone lógico.

---

### Slide 21 — What are the logic cones for failing point?

Texto extraído:

- Pull up the cone schematic window by clicking the icon.

Figura:

A janela mostra dois esquemáticos:

- o cone da referência;
- o cone da implementação.

Interpretação:

A melhor forma visual de entender a falha é abrir os logic cones do failing point.

Para `z1_reg`:

Referência:

```text
a ----\
      AND ---- z1_reg
b ----/
```

Implementação:

```text
a ----\
      AND ----\
b ----/        AND ---- z1_reg
c ------------/
```

A implementação tem uma dependência extra de `c`.

Essa visualização é muito útil porque mostra que a diferença não está no flop em si, nem no nome do compare point. A diferença está na lógica combinacional que alimenta o flop.

---

### Slide 22 — Are nets in the failing logic cone the same?

Texto extraído:

- Probe points allow one to compare nets in failing logic cones.
- Select a net in Ref and net in Impl then click the probe icon.

Interpretação:

Depois de identificar que os cones são diferentes, a ferramenta permite investigar nets internas usando **probe points**.

Um probe point é uma comparação temporária entre duas nets internas. Ele serve para responder perguntas como:

```text
Esta net interna da referência é equivalente a esta net interna da implementação?
```

Isso é útil quando o cone é grande. Em vez de tentar entender toda a lógica de uma vez, você escolhe sinais internos estratégicos e testa equivalência por partes.

---

### Slide 23 — Are nets in the failing logic cone the same? Verificando probes

Texto extraído:

- To verify probe:
  - Click on the probe verification icon.
  - Or verify under probe points tab.

Figura:

A GUI mostra a aba **Probe Points** e um resultado de verificação de probe com status de sucesso.

Comandos visíveis de forma aproximada:

```tcl
set_probe_points r:/WORK/fred/... i:/WORK/fred2/...
verify -probe
```

Interpretação:

O probe point é uma espécie de verificação localizada. Ele não substitui o `verify` do design inteiro, mas ajuda a localizar onde a diferença começa.

Se um probe passa, significa que aquelas duas nets escolhidas são equivalentes. Se falha, a diferença já aparece naquele ponto.

Na prática, o debug pode seguir esta lógica:

1. O compare point final falhou.
2. Abra o cone.
3. Escolha nets internas próximas ao compare point.
4. Verifique probes.
5. Vá voltando no cone até encontrar onde os valores divergem.

---

### Slide 24 — Probe point commands

Texto extraído:

- The cone schematic is a good place to apply probe points.
- Probes can also usefully be applied and verified from shell.
- To set a probe:

```tcl
set_probe_points <ref_net> <impl_net>
```

- To verify probes:

```tcl
verify -probe
```

- Other probe point commands:

```tcl
report_probe_status [-status pass | fail | abort | notrun]
report_probe_points
remove_probe_point <net> | -all
```

Anotação importante:

```text
Probe points can be set and verified any time after verify.
Don't have to go back to setup.
```

Interpretação:

O slide destaca uma regra prática importante: probes podem ser criados depois do `verify`. Isso é diferente de comandos que alteram o setup do design, como `set_constant`.

Isso torna os probe points muito convenientes para debug iterativo. O engenheiro pode:

```tcl
verify
report_failing_points
set_probe_points ...
verify -probe
report_probe_status
```

sem reiniciar toda a sessão.

---

### Slide 25 — Restricting the input values

Texto extraído:

- By default inputs to logic cones are free to take all values.
- One way of restricting the input values is using the `set_constant` command.
  - Can only be applied during setup.
- Recall failing vector for `z1_reg`.
- Pergunta: Will the below script pass or fail?

Script mostrado:

```tcl
read_verilog -r fred.v
set_top fred
read_verilog -i fred2.v
set_top fred2
set_constant i:/WORK/fred2/c 1
verify
```

Anotação:

```text
Applying constant 1 to c in implementation
```

Interpretação:

A ideia é tentar eliminar a falha de `z1_reg`.

Como a diferença entre `fred` e `fred2` ocorre quando `c = 0`, alguém poderia pensar:

```text
Se eu forçar c = 1 na implementação, fred2 vira equivalente a fred para z1.
```

De fato, para `z1`:

```text
fred2: z1 = a & b & 1 = a & b
```

Então `z1_reg` deve deixar de falhar.

Mas há um problema: `c` também participa da lógica de `z2`.

---

### Slide 26 — Restricting the input values (continued)

Texto extraído:

- It fails. But now it is `z2_reg` that fails.
- Pergunta do slide: `z2_reg now fails. Why?`
- Código conceitual:

```text
Ref (fred)
z2 <= a | c;

Impl (fred2)
z2 <= a | c;
```

- Comando aplicado:

```tcl
set_constant i:/WORK/fred2/c 1
```

- Anotações:
  - `Ref c still free to take value 0`
  - `Constant Impl z2_reg doesn't appear in pattern`

Interpretação:

O script falha porque a constante foi aplicada **somente na implementação**.

Na referência:

```text
z2_ref = a | c
```

Na implementação, como `c` foi forçado a `1`:

```text
z2_impl = a | 1 = 1
```

Se a referência ainda pode usar `c = 0` e `a = 0`, então:

```text
z2_ref = 0 | 0 = 0
z2_impl = 0 | 1 = 1
```

Logo, `z2_reg` passa a falhar.

Isso ensina um ponto crítico: restrições precisam representar o mesmo ambiente para referência e implementação. Se você restringe só um lado, você pode criar uma diferença artificial.

---

### Slide 27 — Restricting the input values (continued): aplicando constante nos dois lados

Texto extraído:

- To get verification to pass in this case, constant has to be applied to reference as well.
- Don't have to read in from scratch; can just revert to setup and apply.

Script do slide:

```tcl
read_verilog -r fred.v
set_top fred
read_verilog -i fred2.v
set_top fred2
set_constant i:/WORK/fred2/c 1
verify
# Verification failed
# Revert to setup
setup
set_constant r:/WORK/fred/c 1
# This verify will succeed
verify
```

Anotação:

```text
Constant 1 now applied to c in both Ref and Impl
```

Interpretação:

Quando `c` é fixado em `1` nos dois designs, as duas expressões ficam equivalentes:

Para `z1`:

```text
Ref:  z1 = a & b
Impl: z1 = a & b & 1 = a & b
```

Para `z2`:

```text
Ref:  z2 = a | 1 = 1
Impl: z2 = a | 1 = 1
```

Assim, a verificação passa.

O slide também mostra um detalhe operacional importante:

```tcl
setup
```

Esse comando permite voltar ao estado de setup para aplicar comandos que modificam o design, como `set_constant`, sem precisar reler tudo do zero.

---

### Slide 28 — Formality Flow Overview: Unit overview

Texto extraído da figura:

- Learn these well in understandable context:
  - `set_constant`
  - Match summary
  - `report_matched_points`
  - `report_unmatched_points`
  - Results summary
  - `report_failing_points`
  - `report_passing_points`
  - `analyze_points`
  - Pattern window
  - Logic cones
  - Probe Points

Interpretação:

Este slide organiza a unidade em torno do fluxo do Formality:

1. **Setup**
   - `set_constant`
2. **Match**
   - match summary;
   - `report_matched_points`;
   - `report_unmatched_points`.
3. **Verify**
   - results summary;
   - `report_failing_points`;
   - `report_passing_points`.
4. **Debug**
   - `analyze_points`;
   - Pattern Window;
   - Logic Cones;
   - Probe Points.

É uma excelente lista de comandos e recursos para memorizar, porque cobre o caminho completo de uma falha simples: detectar, localizar, explicar e testar hipóteses.

---

### Slide 29 — Unit Summary

Texto extraído:

- **Match:**
  - Match summary in transcript.
  - Details with `report_matched_points`, `report_unmatched_points` commands.
- **Verify:**
  - Verification results summary in transcript.
  - Details with `report_passing_points`, `report_failing_points` commands.
- **Debug:**
  - Pattern window.
  - Command `analyze_points`.
  - Logic cones, probe points.

Interpretação:

O resumo fecha a aula em três camadas:

1. **Match:** verificar se os pontos foram corretamente alinhados.
2. **Verify:** verificar se os pontos alinhados são funcionalmente equivalentes.
3. **Debug:** se falhar, descobrir por qual estímulo falha e onde a lógica começa a divergir.

---

## Aula didática desenvolvida

### 1. Quando o `verify` falha, comece pelo transcript

Depois de rodar:

```tcl
verify
```

o Formality imprime um resumo no transcript. Esse resumo deve ser lido antes de abrir qualquer janela da GUI.

No exemplo, a mensagem principal é:

```text
Compare point z1_reg failed (is not equivalent)
```

Essa frase já dá três informações:

1. existe uma falha real ou uma diferença de setup;
2. o ponto falho é `z1_reg`;
3. a falha é de equivalência funcional.

Logo depois, o resumo mostra quantos pontos passaram e quantos falharam. Isso ajuda a saber se o problema é local ou sistêmico.

Se apenas 1 ponto falha em um design pequeno, é provável que a causa esteja em uma diferença localizada. Se milhares de pontos falham em um design grande, antes de investigar lógica é melhor suspeitar de setup, clock, scan, black boxes, libraries ou SVF.

---

### 2. Pattern Window: transformando uma falha em um contraexemplo

A Pattern Window mostra o estímulo que prova a diferença.

No exemplo:

```text
a = 1
b = 1
c = 0
```

Para esse estímulo:

```text
Ref:  z1 = a & b     = 1 & 1     = 1
Impl: z1 = a & b & c = 1 & 1 & 0 = 0
```

Isso é um contraexemplo formal. Ele não é um vetor de teste criado pelo usuário; é uma combinação encontrada pela ferramenta para provar que as funções não são equivalentes.

A Pattern Window também mostra quais inputs importam e quais não importam para a falha. Valores acinzentados indicam que a falha não depende daquele valor específico.

---

### 3. `analyze_points -failing`: a explicação textual da falha

O comando:

```tcl
analyze_points -failing
```

é usado para pedir que o Formality analise os pontos falhos.

No exemplo, ele identifica:

```text
Found 1 Unmatched Cone Input
```

E aponta que:

```text
i:/WORK/fred2/c
```

existe no cone da implementação, mas não no cone da referência para o compare point `z1_reg`.

Essa saída é muito valiosa porque diferencia dois casos:

- `c` não está casado no design?
- ou `c` está casado globalmente, mas aparece em um cone e não no outro?

A resposta da ferramenta é a segunda: `c` está casado como port, mas só participa do cone de `z1_reg` na implementação.

---

### 4. Logic Cone Viewer: vendo a diferença estrutural

O Logic Cone Viewer mostra o cone da referência e o cone da implementação lado a lado.

Para `z1_reg`:

Referência:

```text
a, b → AND → z1_reg
```

Implementação:

```text
a, b, c → AND/AND → z1_reg
```

A diferença visual é direta: a implementação tem uma dependência extra de `c`.

Em projetos reais, a diferença nem sempre será tão óbvia. O cone pode ter centenas de gates. Mesmo assim, a ideia é a mesma: procurar onde a lógica começa a divergir.

---

### 5. Probe points: comparando nets internas

Quando um cone é grande, pode ser difícil saber exatamente onde a diferença nasce. Os probe points permitem comparar nets internas.

Exemplo genérico:

```tcl
set_probe_points <ref_net> <impl_net>
verify -probe
```

Se o probe passa, aquelas nets são equivalentes. Se falha, a divergência já existe naquele ponto.

Comandos úteis:

```tcl
report_probe_status
report_probe_points
remove_probe_point -all
```

A grande vantagem é que probes podem ser criados depois do `verify`, sem voltar para setup.

---

### 6. `set_constant`: restrição de ambiente versus alteração unilateral

Por padrão, os inputs dos logic cones são livres para assumir todos os valores possíveis. Isso é o que torna a verificação formal exaustiva.

O comando:

```tcl
set_constant
```

restringe um sinal a um valor fixo.

Exemplo:

```tcl
set_constant i:/WORK/fred2/c 1
```

Isso força `c = 1` na implementação.

O erro didático do slide é proposital: ao restringir `c` só na implementação, a comparação deixa de ser justa. A implementação passa a trabalhar em um ambiente diferente da referência.

Por isso `z1_reg` é consertado, mas `z2_reg` falha.

Para a restrição ser coerente, aplique nos dois lados:

```tcl
set_constant i:/WORK/fred2/c 1
set_constant r:/WORK/fred/c 1
```

Agora ambos os designs são verificados sob a mesma hipótese de ambiente.

---

## Conceitos difíceis explicados em profundidade

### Failing compare point

Um failing compare point é um ponto casado entre referência e implementação cuja função não pôde ser provada equivalente.

No exemplo:

```text
z1_reg
```

falha porque a lógica de entrada é diferente.

Importante:

```text
Um ponto só pode falhar no verify depois de ter sido casado no match.
```

Se o ponto nem casou, ele aparece como unmatched, não como failing.

---

### Pattern Window

A Pattern Window é a janela de contraexemplos. Ela mostra:

- inputs do logic cone;
- valores que causam falha;
- valor da referência;
- valor da implementação;
- quais valores são relevantes ou irrelevantes para a falha.

No exemplo, ela mostra que:

```text
a = 1
b = 1
c = 0
```

faz a referência carregar `1` e a implementação carregar `0`.

---

### Unmatched cone input

Um unmatched cone input é um sinal que aparece como input de um cone, mas não aparece no cone correspondente do outro design.

No exemplo:

```text
c
```

é um unmatched cone input para `z1_reg`, porque:

- em `fred`, `c` não influencia `z1`;
- em `fred2`, `c` influencia `z1`.

Isso não quer dizer que `c` seja unmatched globalmente. Ele está casado como primary input, mas é unmatched dentro daquele cone específico.

---

### Probe point

Probe point é uma comparação temporária entre duas nets internas.

Ele é útil quando:

- o compare point final falha;
- o cone é grande;
- você quer descobrir se uma subexpressão interna ainda é equivalente.

Exemplo:

```tcl
set_probe_points r:/WORK/fred/some_net i:/WORK/fred2/some_net
verify -probe
```

Probes ajudam a quebrar o debug em partes menores.

---

### `set_constant`

`set_constant` restringe um sinal a 0 ou 1.

Exemplo:

```tcl
set_constant i:/WORK/fred2/c 1
```

Cuidados:

- deve ser usado em setup;
- altera o espaço de estados que a ferramenta considera;
- se usado só de um lado, pode criar falsas diferenças;
- deve refletir uma hipótese real do ambiente ou uma condição válida de operação.

---

## Figuras, diagramas e janelas importantes

### Janela de Verification Results

A figura do slide 16 mostra o transcript destacando o ponto `z1_reg` como falho e o resumo com 3 pontos passando e 1 falhando. Ela ensina que o primeiro passo do debug é ler o transcript.

---

### Pattern Window

A figura da Pattern Window mostra o contraexemplo. Ela deve ser estudada como uma tabela de prova:

- coluna de referência;
- coluna de implementação;
- valores dos inputs;
- valores carregados no compare point.

No exemplo, o valor carregado pela referência é `1` e o da implementação é `0`.

---

### Logic Cone Viewer

A figura dos cones mostra, visualmente, a diferença entre os designs:

- referência: `a & b`;
- implementação: `a & b & c`.

Esse é o tipo de visualização que liga o relatório textual à estrutura real da lógica.

---

### Probe Points

A figura da aba de probe mostra que é possível comparar nets internas e obter um resultado de probe verification. Isso ajuda a confirmar se uma net interna da referência corresponde a uma net interna da implementação.

---

### Fluxo final da unidade

A figura final organiza o fluxo:

```text
Setup → Match → Verify → Debug
```

Com os comandos principais:

```tcl
set_constant
report_matched_points
report_unmatched_points
report_failing_points
report_passing_points
analyze_points
```

E ferramentas GUI:

```text
Pattern Window
Logic Cones
Probe Points
```

---

## Pontos de prova e revisão

1. `match` pode passar mesmo quando há diferença funcional.
2. `verify` é a etapa que detecta diferença funcional.
3. `z1_reg` falha porque `fred` usa `a & b` e `fred2` usa `a & b & c`.
4. A falha ocorre quando `a = 1`, `b = 1`, `c = 0`.
5. A Pattern Window mostra o estímulo/contraexemplo que causa a falha.
6. `analyze_points -failing` sugere causas prováveis para pontos falhos.
7. “Unmatched cone input” não significa necessariamente input global sem match; pode significar sinal presente em um cone e ausente no cone correspondente.
8. Logic Cone Viewer mostra visualmente a lógica que alimenta o compare point.
9. Probe points comparam nets internas entre referência e implementação.
10. `set_probe_points <ref_net> <impl_net>` cria um probe.
11. `verify -probe` verifica probes.
12. `report_probe_status`, `report_probe_points` e `remove_probe_point` ajudam a gerenciar probes.
13. `set_constant` restringe sinais, mas deve ser aplicado no estado de setup.
14. Restringir só referência ou só implementação pode criar nova falha artificial.
15. Para a restrição ser justa, aplique a mesma hipótese nos dois lados quando a condição faz parte do ambiente comum.

---

## Relação com projeto/laboratório

Em laboratório, quando a verificação falhar, uma sequência prática seria:

```tcl
verify
report_failing_points
analyze_points -failing
```

Depois, na GUI:

1. abrir a aba Debug;
2. selecionar o failing point;
3. abrir Pattern Window;
4. abrir Logic Cone Viewer;
5. criar probe points se necessário.

Para scripts, alguns comandos recorrentes são:

```tcl
report_failing_points
report_passing_points
set_probe_points <ref_net> <impl_net>
verify -probe
report_probe_status
```

E, se for necessário restringir ambiente:

```tcl
setup
set_constant r:/WORK/design/signal 1
set_constant i:/WORK/design/signal 1
verify
```

A regra prática é: **restrições precisam representar o mesmo cenário operacional para os dois designs**.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código e comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

- **Bloco:** 063
- **Aula:** 04 Multi-Stage Verifications and SVF
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\04 Multi-Stage Verifications and SVF.docx
```

- **Faixa:** slides 1-25
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\04 Multi-Stage Verifications and SVF.md
```
