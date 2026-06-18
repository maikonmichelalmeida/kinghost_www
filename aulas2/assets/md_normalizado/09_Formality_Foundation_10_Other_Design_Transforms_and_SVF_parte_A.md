# 10 Other Design Transforms and SVF — parte A

## Controle do bloco

- **Bloco:** 073
- **Curso:** 09 Formality Foundation
- **Aula:** 10 Other Design Transforms and SVF — parte A
- **Prioridade do roteiro:** média
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\10 Other Design Transforms and SVF.docx`
- **Faixa processada conforme roteiro:** slides 1-16
- **Observação sobre o anexo:** o DOCX está composto por prints de vídeo, normalmente com duas telas/slides por página. Como o texto não veio em formato editável, a extração foi feita a partir das imagens renderizadas.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\10 Other Design Transforms and SVF_parte_A.md
```

---

## Resumo executivo

Esta aula complementa a unidade anterior. Antes, o foco foi em **transformações sequenciais**: constant registers, register merging, register replication, retiming, phase inversion e clock-gating. Agora o curso entra em **outras transformações de design**, principalmente transformações **estruturais não sequenciais**, e em como elas aparecem no Formality.

A ideia central da parte A é que o Design Compiler faz várias mudanças estruturais para melhorar **QoR** — timing, area e power. Algumas dessas mudanças são grandes e precisam de **SVF** para o Formality entender. Outras são pequenas e o Formality consegue lidar sozinho. A hierarquia do RTL não é necessariamente preservada pela síntese: o DC pode fazer **ungrouping**, **boundary optimization**, **uniquification**, compartilhamento de datapath, reordenação de árvores aritméticas, clock-tree buffering e outras mudanças.

A parte A cobre:

1. Visão geral das transformações estruturais não sequenciais.
2. Como o Formality usa SVF para validar e aplicar transformações.
3. Transformações de datapath: tree transforms, share transforms e sum of products.
4. Como lidar com hard verifications ligadas a datapath.
5. Ungrouping e por que a hierarquia lógica pode atrapalhar QoR.
6. Auto-ungrouping e mudança de nomes.
7. Uniquification e mudança de nomes de design.
8. Revisão da metodologia de debug antes de entrar em isolamento manual.
9. Importância do contexto ao depurar.
10. Isolamento e hierarquia.
11. Boundary optimization e seus efeitos na hierarquia.
12. Clock tree buffering e como tratar em verificação hierárquica/subbloco.
13. Introdução à verificação hierárquica clássica.

A mensagem mais importante é: **em verificação flat no topo, o Formality geralmente lida bem com várias transformações estruturais; mas, ao tentar verificar hierarquicamente ou isolar problemas em sub-blocos, você precisa entender o que a síntese fez com as fronteiras da hierarquia.**

---

## Texto extraído e organizado por slide

### Slide 1 — Structural (non-sequential) Transforms

Texto extraído da figura:

```text
Structural (non-sequential) Transforms
```

Centro:

```text
QoR
Power
Area
Timing
```

Transformações ao redor:

```text
Datapath
Major structural change to logic cone
Handled in SVF
```

```text
Ungrouping
Naming of compare points and hierarchy change
Handled in SVF
```

```text
Uniquification
Change of design names
Handled in SVF
```

```text
Boundary optimization
Formality handles automatically flat
```

```text
Others
Small changes to logic cones
No setup required
```

Interpretação:

O slide classifica transformações estruturais não sequenciais pelo impacto e pela forma como o Formality lida com elas.

#### Datapath

Transformações de datapath podem reestruturar profundamente um cone lógico. Exemplos:

- reordenação de árvores de soma;
- compartilhamento de operadores;
- transformação de soma de produtos;
- carry-save adders;
- tree balancing.

Como são grandes mudanças, são tratadas via SVF.

#### Ungrouping

Quando o DC remove hierarquia, nomes de objetos e caminhos hierárquicos mudam. Isso afeta matching e SVF, pois objetos podem sair de:

```text
inst1/leaf_reg
```

para algo como:

```text
inst1_leaf_reg
```

Também é tratado no SVF.

#### Uniquification

Quando duas instâncias usam o mesmo design, o DC pode duplicar/renomear o design para otimizar cada instância de modo diferente. Isso muda nomes de design e também é tratado via SVF.

#### Boundary optimization

O DC pode mover lógica através de fronteiras hierárquicas para melhorar QoR. Em verificação flat, o Formality geralmente lida automaticamente.

#### Others

Pequenas mudanças em logic cones normalmente não exigem setup especial.

---

### Slide 2 — Datapath Verification Flow Using SVF

Texto extraído do fluxograma:

```text
Start
↓
Formality reads transformation from SVF
↓
Verifies transformation is valid?
  ├─ No → Reject transformation
  └─ Yes → Apply transformation to RTL container
↓
Verify Design
```

À esquerda:

```text
SVF
Operation1:
Operation2:
Operation3:
Operation4:
```

Interpretação:

O Formality não aceita o SVF cegamente. O fluxo é:

1. Lê uma transformação registrada no SVF.
2. Verifica se a transformação é válida no contexto carregado.
3. Se for válida, aplica a transformação ao container RTL/reference.
4. Se não for válida, rejeita a transformação.
5. Depois tenta verificar o design.

Isso é uma garantia importante: o SVF ajuda, mas não pode “forçar” o Formality a aceitar uma transformação errada.

Em datapath, isso é fundamental porque as transformações podem ser grandes. O Formality precisa confirmar que a estrutura otimizada ainda representa a função correta.

---

### Slide 3 — Complex Arithmetic Support: Tree Transforms

Título:

```text
Complex Arithmetic Support
Tree Transforms
```

Na esquerda, o RTL mostra um módulo `DP` com lógica aritmética. Trecho visível:

```verilog
module DP (z, s1, s2, a, b, c, d, e);
output [3:0] z;
input s1, s2;
input [1:0] a, b, c, d, e;
reg [3:0] tmp;
always
  @(s1 or s2 or a or b or c or d or e)
begin
  if (e < 2)
    z = a + b + c + d;
  else begin
    case ({s1, s2})
      2'b10: tmp = a * b;
      2'b01: tmp = c * d;
    endcase
    z = 2 + tmp;
  end
end
endmodule
```

Na direita, a figura mostra **Optimized Gates** com uma árvore de somadores, multiplicadores e multiplexadores.

Interpretação:

O exemplo mostra um datapath aritmético em RTL que o DC reestrutura para melhorar QoR. A expressão:

```verilog
z = a + b + c + d;
```

pode ser implementada por diferentes árvores de soma.

Por exemplo:

```text
((a + b) + c) + d
```

ou:

```text
(a + b) + (c + d)
```

ou ainda uma árvore balanceada otimizada para atraso.

A estrutura dos gates pode ficar bem diferente do RTL, mas a função matemática é a mesma. O SVF registra a transformação para o Formality conseguir reconhecer e provar a equivalência.

---

### Slide 4 — Complex Arithmetic Support: Share Transforms

Título:

```text
Complex Arithmetic Support
Share Transforms
```

A figura mostra o mesmo RTL do módulo `DP` e, na direita, uma implementação otimizada com operadores compartilhados, multiplexadores e somadores/multiplicadores.

Interpretação:

**Share transforms** significam compartilhamento de operadores aritméticos.

No RTL, pode parecer que existem operações separadas em ramos diferentes:

```verilog
if (e < 2)
  z = a + b + c + d;
else
  z = 2 + tmp;
```

O DC pode perceber que certos operadores podem ser reutilizados em ramos diferentes, controlados por multiplexadores. Isso reduz área, mas muda bastante a estrutura do cone.

Para Formality, essa transformação pode ser difícil se não houver SVF ou se o SVF for rejeitado. O design pode estar correto, mas o cone otimizado não se parece mais com o cone original.

---

### Slide 5 — Complex Arithmetic Support: Sum of Products

Título:

```text
Complex Arithmetic Support
Sum of Products
```

Texto da figura:

```text
Recognizes and proves SOP, CSA, and tree re-ordering.
```

Na direita, a implementação otimizada mostra operadores, muxes e um bloco destacado como:

```text
SOP
```

Interpretação:

SOP significa **Sum of Products**. Em datapaths, isso aparece quando há combinações de produtos e somas, como:

```text
a*b + c*d + ...
```

O Formality consegue reconhecer e provar estruturas como:

- SOP;
- CSA — Carry Save Adder;
- tree re-ordering — reordenação de árvores aritméticas.

Essas transformações são comuns em síntese de datapath, porque ajudam a melhorar timing e área. Mas, novamente, elas dependem fortemente de guidance correta no SVF para evitar hard verification.

---

### Slide 6 — Hard Verification and Datapath

Texto extraído:

```text
Formality handles the datapath transforms through SVF
```

```text
Missing or rejected SVF of large datapath structures can lead to hard
(inconclusive) verification
```

Possible next steps:

```text
Do you have the right SVF? (Unit 4)
```

Datapath SVF may be rejected for 2 reasons:

```text
Naming:
Formality can't find the datapath objects or the design in which they are which SVF refers
```

```text
Validity:
Can't prove that datapath is valid
```

Commands that help:

```tcl
analyze_points -aborted
```

Também aparecem comandos de `report_svf_operation`/`report_svf_operations -status rejected`, mas o print está parcialmente coberto pela barra do vídeo.

Interpretação:

Quando datapath é grande, a verificação pode ficar **hard** ou **inconclusive** se o SVF está faltando ou foi rejeitado.

As causas de rejeição seguem o mesmo padrão de outras aulas:

#### 1. Naming

O Formality não encontra o objeto mencionado pelo SVF.

Causas comuns:

- SVF errado;
- etapa errada;
- mudança de hierarquia;
- ungrouping não reconhecido;
- variáveis de naming diferentes;
- top incorreto.

#### 2. Validity

O Formality encontra o objeto, mas não consegue provar que a transformação é válida.

Nesse caso, pode haver:

- transformação muito complexa;
- inconsistência no SVF;
- problema real;
- bug/limitação da ferramenta;
- necessidade de SVP.

Comando importante:

```tcl
analyze_points -aborted
```

Esse comando ajuda a identificar hard points causados por datapath.

---

### Slide 7 — DC and Ungrouping: QoR

Título:

```text
DC and ungrouping : QoR
```

Texto extraído:

```text
How does this partitioning, or logical hierarchy, affect synthesis?
```

Bullets:

```text
Design Compiler must preserve block pin definitions
```

```text
Logic optimization — e.g. merging of combinational logic — does not occur across block boundaries
```

```text
Path from REG A to REG C may be larger and slower than necessary → Poorly partitioned!
```

Interpretação:

A hierarquia do RTL pode limitar a otimização.

Se o caminho crítico atravessa blocos A, B e C, mas o DC precisa preservar as interfaces desses blocos, ele não consegue otimizar livremente a lógica combinacional através das fronteiras. Isso pode deixar o caminho:

- maior;
- mais lento;
- pior para timing.

A solução do DC pode ser **ungrouping**: remover hierarquia lógica para permitir otimização global.

A consequência para Formality é que nomes e caminhos hierárquicos mudam. Por isso o SVF precisa registrar essas mudanças.

---

### Slide 8 — DC: Auto-Ungrouping Example

Título:

```text
DC : Auto-Ungrouping Example
```

Figura:

- Lado esquerdo: `RTL partitioning`.
- Lado direito: `Auto-ungrouping`.

Texto destacado:

```text
Note name change: inst1/leaf_reg -> inst1_leaf_reg
```

Bullets:

```text
DC will auto-ungroup:
Small blocks
Paths on critical paths
```

Texto parcialmente visível:

```text
This is recorded in the SVF with guide_ungroup command
```

Interpretação:

O slide mostra que, após auto-ungrouping, a hierarquia desaparece ou é achatada. Um registrador que antes tinha caminho hierárquico:

```text
inst1/leaf_reg
```

pode virar:

```text
inst1_leaf_reg
```

Isso afeta:

- matching;
- relatórios;
- comandos de debug;
- SVF;
- hierarquia visível no schematic.

O DC faz auto-ungrouping especialmente em:

- blocos pequenos;
- blocos em caminhos críticos.

O SVF registra a operação, tipicamente com:

```text
guide_ungroup
```

Se essa guidance é rejeitada, o Formality pode não encontrar objetos ou pode ter problemas de match.

---

### Slide 9 — Synthesis: Uniquification

Texto extraído:

```text
If you have two instances of the same design then DC will by default uniquify
them to perform different optimizations in the 2 instances
```

```text
Duplicate and rename one or both so that design names are unique
```

```text
This is handled in the SVF
```

Figura:

Antes:

```text
top
  inst1 → blocka
  inst2 → blocka
```

Depois:

```text
top
  inst1 → blocka
  inst2 → blocka_1
```

Destaque:

```text
Design name change
```

Interpretação:

**Uniquification** acontece quando há duas instâncias do mesmo módulo/design, mas o DC quer otimizar cada uma de forma diferente.

Antes:

```text
inst1 e inst2 usam o mesmo design blocka
```

Depois:

```text
inst1 usa blocka
inst2 usa blocka_1
```

Isso permite otimizações específicas por instância.

Para Formality, isso importa porque o nome do design mudou. O SVF precisa informar essa mudança. Sem guidance, o Formality pode procurar `blocka` onde agora existe `blocka_1`.

---

### Slide 10 — Review of Debugging Failing Points

Texto extraído:

```text
Gone through recommended debugging steps:
Got the right SVF for synthesis (Unit 4)
Am debugging the smallest stage (Unit 4)
Got the other setup right (Unit 8, 9)
Got the matching clean (Unit 8, 9)
```

```text
And analyze_points is not suggesting anything
Or is, but requires further isolation
```

Pergunta em destaque:

```text
How does one debug and isolate problem further?
```

Caixa final:

```text
Obviously also always consider contacting Synopsys
(eg support case under SolvNet) at any stage — but especially if
getting close to tape-out/sign-off.
```

Interpretação:

Este slide estabelece o ponto de entrada para o debug manual profundo.

Antes de começar a isolar um failing point, você já deveria ter feito:

1. SVF correto.
2. Menor estágio possível.
3. Setup correto.
4. Matching limpo.
5. `analyze_points` sem diagnóstico suficiente.

Se tudo isso já foi feito, então é hora de usar recursos de isolamento:

- Pattern Window;
- probe points;
- cutpoints;
- matching tool;
- hierarchical verification;
- análise de cone.

O slide também lembra algo prático: se estiver próximo de tapeout/signoff e o problema parece ferramenta/limitação, abra suporte com Synopsys.

---

### Slide 11 — Always Think Context When Debugging

Texto extraído:

```text
Has the design been through Formality successfully before. If so what has changed:
RTL?
Synthesis scripts?
Versions of tools?
```

```text
What can go wrong at this stage of implementation and how would it show up
Possible problems for RTL to gates are many more than pre to post layout gates
```

```text
Thousands of failing points is different from 10 failing points
```

Caixas amarelas:

```text
One is using Formality as tool to help build a hypothesis and confirm a hypothesis of what issue is
```

```text
You have more context information than Formality
```

Interpretação:

A ferramenta não sabe tudo sobre o histórico do projeto. Você sabe.

Perguntas práticas:

- Esse design já passou antes?
- O RTL mudou?
- O script de síntese mudou?
- A versão do DC/Formality mudou?
- O SVF vem do mesmo run?
- O estágio é RTL → gates ou gates → post-layout?
- São milhares de falhas ou apenas dez?

Essas perguntas mudam a hipótese.

Exemplo:

```text
Milhares de failing points → suspeite de setup, scan, clock-gating, SVF, black box.
Poucos failing points → pode ser diferença localizada ou bug real.
```

Formality é uma ferramenta para construir e testar hipóteses, não substitui o contexto do engenheiro.

---

### Slide 12 — Isolation and Hierarchy

Texto extraído:

```text
One always wants to be debugging the smallest logic cone
```

```text
The failing logic cone may cross hierarchy that still exists in Impl
(i.e. hasn't been ungrouped)
```

Two ways of exploiting this hierarchy:

```text
Flat debugging
  Probe points
  Cut-point
  Overlaying stimulus on hierarchy

Hierarchical verification
```

Caixa final:

```text
Normally do flat debugging first.
But will consider hierarchical verification and boundary optimization to put in context.
```

Interpretação:

Quando um failing cone é grande, o objetivo é reduzir o problema. Se o cone atravessa hierarquias ainda existentes na implementação, essas fronteiras podem ajudar.

Duas abordagens:

#### 1. Flat debugging

Você continua verificando o design flat, mas usa recursos para isolar:

- probe points;
- cutpoints;
- stimulus overlay;
- matching tool.

#### 2. Hierarchical verification

Você divide a verificação por blocos. Verifica blocos individualmente e depois verifica o topo com blocos black-boxed.

O curso recomenda normalmente começar com **flat debugging**, e só depois considerar hierarchical verification quando fizer sentido.

---

### Slide 13 — Design Compiler: Boundary Optimization

Título:

```text
Design Compiler: Boundary Optimization
```

Caixa superior:

```text
Good for QoR. But hierarchy not synthesis invariant
```

Elementos da figura:

- `Constant or unconnected inputs`
- `Timing-critical path`
- `Phase inversion`
- `Unread port`
- `Unread logic removed`
- `Constant propagation`
- `Smaller, faster`

Interpretação:

Boundary optimization move e transforma lógica através das fronteiras de hierarquia para melhorar QoR.

Exemplos mostrados na figura:

- entradas constantes ou desconectadas podem ser propagadas para dentro do bloco;
- lógica não lida pode ser removida;
- phase inversion pode atravessar a fronteira;
- caminhos críticos podem ser encurtados;
- a lógica final fica menor e mais rápida.

A frase mais importante:

```text
hierarchy not synthesis invariant
```

Ou seja, a hierarquia do RTL não é uma verdade preservada pela síntese. Ela é uma organização do código, mas o DC pode atravessá-la para otimizar.

Consequência: verificar hierarquicamente pode exigir setup especial, porque as fronteiras do bloco após synthesis podem não ter a mesma função que no RTL.

---

### Slide 14 — Other boundary changes: Clock Tree Buffering

Título:

```text
Other boundary changes: Clock Tree Buffering
```

Texto extraído:

```text
Clock tree buffering is the addition of buffers in the clock path to allow the
clock signal to drive large loads
```

Figura:

- `Pre-Buffering`: um clock entra em `blocka` e alimenta três flops.
- `Post-Buffering`: o clock passa por buffers `clk_buf` e entra no bloco como `clk1`, `clk2`, `clk3`.

Interpretação:

Clock tree buffering adiciona buffers no caminho de clock para permitir que o sinal de clock dirija cargas grandes.

No topo, isso pode ser funcionalmente transparente. Mas se você tenta verificar apenas um sub-bloco, pode haver diferença:

Referência do sub-bloco:

```text
um pino clk
```

Implementação do sub-bloco:

```text
clk1, clk2, clk3
```

Nesse caso, é necessário dizer ao Formality que esses clocks bufferizados são equivalentes ao clock original.

---

### Slide 15 — Clock Tree Buffering: How to Deal With It

Texto extraído:

```text
Often setup is simple and obvious
```

```text
Verification at the top level requires no setup
```

```text
When verifying at “blocka” sub-block level use set_user_match command to show buffered clock pins are equivalent
```

Comando mostrado:

```tcl
fm_shell (setup)> set_reference_design r:/WORK/blocka
fm_shell (setup)> set_implementation_design i:/WORK/blocka
fm_shell (setup)> set_user_match r:/WORK/blocka/clk \
  i:/WORK/blocka/clk1 \
  i:/WORK/blocka/clk2 \
  i:/WORK/blocka/clk3
fm_shell (setup)> verify
```

Caixa final:

```text
The same set_user_match approach would apply to HFN
(High Fanout Net Synthesis) with port punching.
Eg the reset signal in say DCT
```

Interpretação:

No topo, o Formality vê o clock antes e depois dos buffers e geralmente não precisa de setup especial.

Mas na verificação de sub-bloco, os clocks aparecem como múltiplos pinos. Então é preciso fazer match manual:

```tcl
set_user_match r:/WORK/blocka/clk \
  i:/WORK/blocka/clk1 \
  i:/WORK/blocka/clk2 \
  i:/WORK/blocka/clk3
```

Essa mesma ideia vale para **HFN — High Fanout Net Synthesis**, quando sinais de alto fanout, como reset, são bufferizados e “port-punched” em múltiplos pinos.

---

### Slide 16 — Classic Hierarchical Verification: What is it?

Texto extraído:

Caixa superior:

```text
Flat: Verify TOP with BlockA and BlockB not black-boxed
```

Caixa de hierarchical:

```text
Hierarchical:
1) Verify BlockA
2) Verify BlockB
3) Verify TOP with BlockA and BlockB black-boxed
```

Pergunta e resposta:

```text
Are boundaries of BlockA and BlockB compare points?
```

```text
Flat:
Not explicitly. Though under-the-hood Formality may exploit SOME hierarchy pins.
Eg “Matching Hierarchy” during verify.
```

```text
Hierarchical:
ALL boundary pins are explicitly compare points.
```

Interpretação:

Esse slide define a diferença entre verificação flat e hierárquica.

#### Flat verification

O topo inteiro é verificado como um design único. `BlockA` e `BlockB` não são black-boxed. As fronteiras dos blocos não são, explicitamente, compare points. O Formality pode usar algumas fronteiras internamente, mas elas não são a divisão formal principal.

#### Hierarchical verification

O fluxo é:

1. Verificar `BlockA`.
2. Verificar `BlockB`.
3. Verificar o `TOP` com `BlockA` e `BlockB` como black boxes.

Nesse modo, todos os pinos de fronteira dos blocos viram compare points explícitos.

Isso é poderoso para isolamento, mas exige cuidado: se boundary optimization mudou a função nas fronteiras, a verificação hierárquica pode precisar de setup extra.

---

## Aula didática desenvolvida

### 1. Transformações não sequenciais também podem ser grandes

Depois da unidade de transformações sequenciais, pode parecer que só registradores causam problemas sérios. Esta aula mostra que não: transformações estruturais de datapath também podem ser muito grandes.

A diferença é:

```text
Sequencial: muda compare points/boundaries.
Datapath estrutural: muda muito a lógica dentro do cone.
```

Se o cone aritmético foi muito reestruturado, o Formality pode precisar do SVF para entender o que o DC fez.

---

### 2. Datapath é um caso forte de dependência do SVF

Em datapath, o DC pode:

- balancear árvores;
- compartilhar operadores;
- transformar soma de produtos;
- usar CSA;
- reordenar somas;
- inserir muxes;
- reorganizar multiplicadores.

Essas transformações podem preservar a função, mas destruir a semelhança estrutural com o RTL.

Por isso:

```text
SVF correto → Formality entende/aplica transformações.
SVF ausente ou rejeitado → hard/inconclusive verification.
```

---

### 3. O Formality valida o SVF

Um ponto importante é que o Formality não “acredita” automaticamente no SVF.

Fluxo:

```text
ler transformação
verificar se ela é válida
se válida, aplicar ao RTL container
se inválida, rejeitar
```

Isso protege contra SVF errado, SVF de outro run ou operação inválida.

---

### 4. Ungrouping melhora QoR, mas muda nomes

O DC pode remover hierarquia para melhorar timing. Isso é bom para QoR porque permite otimização através de fronteiras.

Mas os nomes mudam:

```text
inst1/leaf_reg → inst1_leaf_reg
```

Isso afeta:

- matching;
- scripts de debug;
- SVF;
- relatórios;
- hierarquia visual.

Se você está depurando e procura um objeto pelo nome antigo, talvez ele tenha sido ungrouped.

---

### 5. Uniquification permite otimizações por instância

Se duas instâncias usam o mesmo módulo `blocka`, o DC pode duplicar o design:

```text
blocka
blocka_1
```

Isso permite otimizar `inst1` e `inst2` de maneiras diferentes.

Mas, para o Formality, isso muda nomes de design e precisa estar no SVF.

---

### 6. Debug manual só vem depois dos resumos

O slide de revisão reforça uma metodologia:

Antes de isolar manualmente um failing point, confirme:

```text
SVF certo
menor estágio
setup certo
matching limpo
analyze_points sem diagnóstico suficiente
```

Se `analyze_points` já aponta a causa, não faz sentido abrir cone manualmente.

---

### 7. Contexto vale mais que ferramenta

O Formality mostra sintomas, mas você conhece o projeto.

Exemplo:

```text
Design já passou antes → o que mudou?
RTL mudou?
Script mudou?
Versão de ferramenta mudou?
São 10 falhas ou 10.000?
É RTL→gates ou pre→post-layout?
```

Essas perguntas guiam a hipótese.

---

### 8. Hierarquia pode ajudar a isolar, mas pode enganar

Hierarquia é útil para isolamento porque pode dividir um cone grande em partes menores. Mas a hierarquia não é necessariamente preservada pela síntese.

Boundary optimization pode fazer:

- constant propagation através da fronteira;
- phase inversion atravessar fronteira;
- remover lógica unread;
- mudar pinos;
- mover lógica para dentro/fora do bloco.

Por isso, hierarchical verification é útil, mas precisa de cuidado.

---

### 9. Clock buffering em sub-bloco exige match manual

No topo, clock buffering geralmente não exige setup. Mas em sub-bloco, um clock pode virar vários:

```text
clk → clk1, clk2, clk3
```

Então use:

```tcl
set_user_match
```

para dizer que são equivalentes.

Essa mesma lógica vale para resets ou outros high-fanout nets que foram bufferizados e divididos em múltiplos pinos.

---

### 10. Verificação hierárquica muda o conjunto de compare points

Em flat verification, pinos internos de bloco não são explicitamente compare points.

Em hierarchical verification, todos os pinos de fronteira do bloco viram compare points.

Isso é uma mudança enorme. Por isso, hierarchical verification pode expor diferenças de boundary optimization que não seriam problema em flat verification.

---

## Conceitos difíceis explicados em profundidade

### Structural non-sequential transform

Transformação que muda a estrutura lógica sem mover registradores/latches. Pode alterar profundamente o cone combinacional, mas não necessariamente os compare points.

---

### Datapath transform

Transformação em lógica aritmética, como somadores, multiplicadores, muxes, árvores de soma, SOP e CSA.

---

### Tree transform

Reordenação/balanceamento de uma árvore aritmética, como transformar uma cadeia de somas em uma árvore balanceada.

---

### Share transform

Compartilhamento de operadores entre ramos de controle diferentes, geralmente usando muxes para escolher entradas/saídas.

---

### Sum of Products

Forma aritmética baseada em somas de produtos, comum em datapaths. Pode ser otimizada com CSA e reordenação de árvores.

---

### Ungrouping

Remoção de hierarquia lógica pelo DC. Melhora QoR, mas muda nomes e caminhos.

---

### Auto-ungrouping

Ungrouping automático aplicado pelo DC em blocos pequenos ou caminhos críticos.

---

### Uniquification

Duplicação/renomeação de designs compartilhados por múltiplas instâncias para permitir otimizações diferentes por instância.

---

### Boundary optimization

Otimização que move/transforma lógica através de fronteiras hierárquicas para melhorar QoR.

---

### Clock tree buffering

Inserção de buffers no caminho de clock para dirigir grandes cargas.

---

### Flat verification

Verificação do design top inteiro sem black-boxing dos blocos internos.

---

### Hierarchical verification

Verificação bloco a bloco, seguida da verificação do topo com blocos já verificados como black boxes.

---

## Comandos importantes

### Datapath / hard verification

```tcl
analyze_points -aborted
report_svf_operation -status rejected
```

### Clock tree buffering em sub-bloco

```tcl
set_reference_design r:/WORK/blocka
set_implementation_design i:/WORK/blocka

set_user_match r:/WORK/blocka/clk \
  i:/WORK/blocka/clk1 \
  i:/WORK/blocka/clk2 \
  i:/WORK/blocka/clk3

verify
```

### Conceitos SVF associados

```text
guide_ungroup
```

```text
SVF registra transformações de datapath, ungrouping e uniquification.
```

---

## Figuras e diagramas importantes

### Structural non-sequential transforms

Mostra quais transformações precisam de SVF e quais o Formality lida automaticamente.

---

### Datapath Verification Flow Using SVF

Mostra que o Formality lê, valida e aplica transformações do SVF ao RTL container antes de verificar.

---

### Tree Transforms

Mostra uma expressão RTL como `a+b+c+d` virando uma árvore otimizada de somadores.

---

### Share Transforms

Mostra operadores aritméticos compartilhados entre ramos, com muxes.

---

### Sum of Products

Mostra reconhecimento de SOP, CSA e tree re-ordering.

---

### DC and ungrouping: QoR

Mostra que fronteiras hierárquicas podem impedir otimização de um caminho REG A → REG C.

---

### Auto-Ungrouping Example

Mostra mudança de nome:

```text
inst1/leaf_reg → inst1_leaf_reg
```

---

### Synthesis: Uniquification

Mostra `blocka` duplicado/renomeado para `blocka_1`.

---

### Boundary Optimization

Mostra que a síntese pode fazer constant propagation, phase inversion e remoção de unread logic através de fronteiras hierárquicas.

---

### Clock Tree Buffering

Mostra um clock único virando clocks bufferizados `clk1`, `clk2`, `clk3`.

---

### Classic Hierarchical Verification

Mostra a diferença entre verificar flat e verificar bloco a bloco com black boxes no topo.

---

## Pontos de prova e revisão

1. Transformações estruturais não sequenciais incluem datapath, ungrouping, uniquification, boundary optimization e outras mudanças pequenas.
2. Datapath faz grande mudança estrutural no logic cone.
3. Datapath é tratado via SVF.
4. Ungrouping muda hierarquia e nomes de compare points.
5. Ungrouping é tratado via SVF.
6. Uniquification muda nomes de design.
7. Uniquification é tratada via SVF.
8. Boundary optimization é geralmente tratada automaticamente em verificação flat.
9. Pequenas mudanças estruturais normalmente não exigem setup.
10. O Formality lê transformações do SVF e verifica se são válidas.
11. Se a transformação SVF é inválida, o Formality rejeita.
12. Tree transforms reordenam árvores aritméticas.
13. Share transforms compartilham operadores aritméticos.
14. SOP, CSA e tree re-ordering são suportados em datapath.
15. SVF ausente ou rejeitado em datapath grande pode levar a hard/inconclusive verification.
16. Rejeição de datapath SVF pode ser por naming.
17. Rejeição de datapath SVF pode ser por validity.
18. `analyze_points -aborted` ajuda em hard datapath verification.
19. Hierarquia lógica pode limitar otimização do DC.
20. DC pode fazer auto-ungroup em blocos pequenos.
21. DC pode fazer auto-ungroup em caminhos críticos.
22. Auto-ungrouping muda nomes hierárquicos.
23. A mudança `inst1/leaf_reg → inst1_leaf_reg` é exemplo de efeito de ungrouping.
24. Uniquification ocorre quando duas instâncias do mesmo design precisam de otimizações diferentes.
25. Uniquification pode criar nomes como `blocka_1`.
26. Antes de isolar manualmente, confirme SVF correto, menor estágio, setup correto e match limpo.
27. `analyze_points` deve ser usado antes de debug manual profundo.
28. Contexto do projeto é essencial para formular hipótese.
29. Milhares de failing points sugerem causa global/setup.
30. Dez failing points sugerem causa mais localizada.
31. Boundary optimization é boa para QoR, mas hierarquia não é synthesis invariant.
32. Boundary optimization pode fazer constant propagation através da hierarquia.
33. Boundary optimization pode mover phase inversion através da hierarquia.
34. Boundary optimization pode remover unread logic.
35. Clock tree buffering adiciona buffers no caminho do clock.
36. Top-level verification de clock buffering geralmente não exige setup.
37. Sub-block verification pode exigir `set_user_match` para clocks bufferizados.
38. HFN synthesis com port punching pode exigir abordagem semelhante.
39. Flat verification verifica o TOP com blocos internos não black-boxed.
40. Hierarchical verification verifica blocos separadamente e depois o TOP com blocos black-boxed.
41. Em flat verification, boundaries de blocos não são explicitamente compare points.
42. Em hierarchical verification, todos os boundary pins são explicitamente compare points.
43. Normalmente recomenda-se flat debugging primeiro.
44. Hierarchical verification pode ser útil para isolamento.
45. Hierarchical verification pode exigir setup extra quando boundary optimization foi aplicada.

---

## Relação com projeto/laboratório

### Quando suspeitar de datapath

Suspeite de datapath quando:

```text
- há hard/inconclusive points;
- analyze_points menciona datapath;
- SVF de datapath foi rejeitado;
- o cone envolve somadores, multiplicadores, muxes e SOP;
- a verificação fica muito lenta sem failing counterexample claro.
```

Comandos úteis:

```tcl
analyze_points -aborted
report_svf_operation -status rejected
```

### Quando suspeitar de ungrouping

Suspeite de ungrouping quando:

```text
- nomes hierárquicos não batem;
- objeto esperado em instância desapareceu;
- nomes têm separadores trocados por underscore;
- guidance de ungroup foi rejeitada;
- blocos pequenos/caminhos críticos foram achatados.
```

### Quando suspeitar de uniquification

Suspeite quando:

```text
- duas instâncias antes usavam o mesmo design;
- depois aparecem designs como blocka_1;
- o SVF ou matching não acha o design esperado;
- otimizações por instância parecem diferentes.
```

### Quando usar hierarquia para isolamento

Use quando:

```text
- o cone é grande;
- ainda existe hierarquia na implementação;
- Pattern Window sugere um ramo específico;
- probe/cutpoint pode separar L de R no cone;
- o problema parece localizado em sub-bloco.
```

### Clock tree buffering em sub-bloco

Se o sub-bloco tinha `clk`, mas a implementação tem `clk1`, `clk2`, `clk3`:

```tcl
set_user_match r:/WORK/blocka/clk \
  i:/WORK/blocka/clk1 \
  i:/WORK/blocka/clk2 \
  i:/WORK/blocka/clk3
```

---

## Checklist de qualidade

- [x] Bloco 073 processado conforme roteiro, slides 1-16.
- [x] Texto das imagens foi extraído e organizado.
- [x] Figuras de datapath, ungrouping, uniquification, boundary optimization e clock buffering foram interpretadas.
- [x] Comandos importantes foram preservados.
- [x] Pegadinhas sobre hierarquia e boundary optimization foram destacadas.
- [x] A diferença entre flat e hierarchical verification foi explicada.
- [x] O próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 074
- **Aula:** 10 Other Design Transforms and SVF — parte B
- **Prioridade:** média
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\10 Other Design Transforms and SVF.docx
```

- **Processar somente:** slides 17-30
- **Começar por:** `Hierarchical Verification: Why`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\10 Other Design Transforms and SVF_parte_B.md
```

- **Próximo depois dele:** Bloco 075 — confirmar no roteiro após concluir a parte B.
