# 10 Other Design Transforms and SVF — parte B

## Controle do bloco

- **Bloco:** 074
- **Curso:** 09 Formality Foundation
- **Aula:** 10 Other Design Transforms and SVF — parte B
- **Prioridade do roteiro:** média
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\10 Other Design Transforms and SVF.docx`
- **Faixa processada conforme roteiro:** slides 17-31
- **Continuação:** mesmo anexo usado na parte A
- **Começa em:** `Hierarchical Verification: Why`
- **Termina em:** `Unit Summary`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\10 Other Design Transforms and SVF_parte_B.md
```

---

## Resumo executivo

Esta parte B fecha a aula **Other Design Transforms and SVF** aprofundando a parte mais prática: como usar **hierarquia**, **boundary information**, **Pattern Window**, **Matching Tool**, **probe points** e **cutpoints** para isolar uma falha quando os passos principais de setup já foram conferidos.

A parte A mostrou que transformações estruturais não sequenciais, como datapath transforms, ungrouping, uniquification e boundary optimization, existem para melhorar **QoR** — power, area e timing. Agora a parte B mostra como depurar depois que você já verificou:

```text
SVF correto
menor estágio possível
setup correto
matching limpo
analyze_points sem diagnóstico suficiente
```

O foco desta parte é: **como reduzir o cone falho até uma região menor e mais fácil de raciocinar.**

Os principais temas são:

1. Por que alguém escolheria verificação hierárquica.
2. Quando a verificação hierárquica ajuda e quando ela atrapalha.
3. Diferença entre verificação **flat** e **hierarchical**.
4. Como usar `write_hierarchical_verification_script`.
5. Como a hierarquia pode ser usada apenas como ferramenta de isolamento.
6. Exemplo em que uma instância `harry` fica equivalente após boundary optimization, mas suas fronteiras exigem setup especial.
7. Uso da Pattern Window para formular hipótese sobre o ramo problemático do cone.
8. Uso de boundary pins como bons candidatos a probe points.
9. Uso do Matching Tool para ver onde o estímulo bate ou diverge dentro da hierarquia.
10. Uso de cutpoints para alterar o cone de verificação e isolar se o problema está antes ou depois de um ponto.
11. Diferença entre probe points e cutpoints.
12. Uso de outros pontos invariantes para debug, especialmente em pre-layout versus post-layout e em clock-gating.
13. Fechamento da unidade: grandes transformações estruturais são tratadas por SVF; não há obrigação geral de preservar hierarquia; setup extra pode ser necessário para verificação hierárquica; e há muitas ferramentas para isolar failing points.

A mensagem central é: **normalmente você começa com debug flat, mas pode explorar a hierarquia existente para quebrar um cone grande em pedaços menores.** A hierarquia não precisa ser preservada para o Formality verificar o topo, mas pode ser valiosa para entender onde o problema está.

---

## Texto extraído e organizado por slide

### Slide 17 — Hierarchical Verification: Why

Texto extraído:

```text
Several reasons why you might be considering hierarchical verification
```

Motivos listados:

```text
For capacity reasons or other reasons (eg IP hardening) the implementation is
being done hierarchically
```

```text
Typically optimizations are managed or not allowed at boundary
```

```text
Trying to isolate logic cones
  Doing an ECO in BlockB
  Debugging a failing points in BlockB
```

```text
Habit from use of a non-Formality equivalency checker
  “Its how we've already done equivalency checking”
```

Interpretação:

A verificação hierárquica pode ser considerada por vários motivos, mas nem todos são igualmente bons.

#### 1. Capacidade ou fluxo físico/hierárquico

Em designs grandes, pode ser necessário implementar blocos separadamente por razões de capacidade, IP hardening, divisão de times ou fluxo físico. Nesse caso, a hierarquia é parte real do fluxo de implementação.

#### 2. Otimizações controladas nas fronteiras

Em fluxo hierárquico, normalmente as otimizações nas fronteiras são restringidas ou controladas. Isso ajuda a manter interfaces estáveis entre blocos.

#### 3. Isolamento de cones

Se há falha em um cone grande, verificar um bloco isolado pode ajudar a limitar o problema. Exemplo:

```text
fiz um ECO em BlockB → quero verificar especificamente BlockB
```

#### 4. Hábito de outra ferramenta

O slide alerta para um motivo fraco: usar verificação hierárquica só porque era o hábito em outra ferramenta. O Formality costuma ser muito forte em verificação flat; então a escolha por hierarquia deve ter razão técnica.

---

### Slide 18 — Hierarchical Verification: For isolation

Texto extraído:

```text
Formality can do hierarchical verification
Command write_hierarchical_verification_script
```

```text
Not the preferred way of verifying a design Formality but can be useful
ECOs
Isolating other issues
```

```text
Three uses of script
Can just be sourced to do hierarchical verification
Cut-and-pasted to verify just one block
Contains useful setup information that can help you debug logic cones that cross hierarchy
```

Interpretação:

O Formality consegue gerar um script de verificação hierárquica com:

```tcl
write_hierarchical_verification_script
```

Mas o slide deixa claro: **não é necessariamente o modo preferido de verificar o design inteiro**. Muitas vezes, o fluxo flat é melhor e mais simples.

A verificação hierárquica é útil principalmente para:

- ECOs localizados;
- isolamento de problemas;
- análise de blocos específicos;
- extração de setup de fronteira útil para debug.

O script gerado tem três usos:

1. Pode ser executado diretamente para fazer verificação hierárquica.
2. Pode ser copiado em partes para verificar apenas um bloco.
3. Pode fornecer setup útil para cones que cruzam hierarquia.

---

### Slide 19 — Classic Hierarchical Verification: What is it?

Texto extraído:

```text
Flat: Verify TOP with BlockA and BlockB not black-boxed
```

```text
Hierarchical:
1) Verify BlockA
2) Verify BlockB
3) Verify TOP with BlockA and BlockB black-boxed
```

Pergunta:

```text
Are boundaries of BlockA and BlockB compare points?
```

Resposta:

```text
Flat:
Not explicitly. Though under-the-hood Formality may exploit SOME hierarchy pins.
Eg “Matching Hierarchy” during verify
```

```text
Hierarchical:
ALL boundary pins are explicitly compare points
```

Interpretação:

Este slide define a diferença entre verificação flat e hierárquica.

#### Verificação flat

O design inteiro é verificado no topo. `BlockA` e `BlockB` permanecem abertos, isto é, não são black boxes. As fronteiras internas da hierarquia não viram compare points explícitos.

O Formality pode usar algumas fronteiras internamente, por exemplo em estratégias de matching, mas isso não muda o fato de que a prova é essencialmente top-level.

#### Verificação hierárquica

O fluxo hierárquico verifica primeiro os blocos individualmente:

```text
BlockA
BlockB
```

Depois verifica o topo com esses blocos como black boxes.

Nesse modo, todos os pinos de fronteira de `BlockA` e `BlockB` viram compare points explícitos. Isso pode ajudar a isolar, mas também cria obrigações: se boundary optimization mudou a função de uma fronteira, você precisará configurar essa equivalência.

---

### Slide 20 — Hierarchical Verification: For isolation — reforço

Este slide repete a ideia de que:

```text
Formality can do hierarchical verification
Command write_hierarchical_verification_script
```

E reforça que o script pode ser usado de três formas:

```text
1) source direto para verificação hierárquica;
2) copiar parte para verificar um bloco;
3) extrair setup útil para cones que cruzam hierarquia.
```

Interpretação adicional:

A repetição no vídeo reforça que a verificação hierárquica é menos uma “receita obrigatória” e mais uma ferramenta. Em Formality, especialmente com SVF correto, o fluxo flat costuma ser robusto. A hierarquia entra quando você quer isolar, reduzir complexidade ou trabalhar com um ECO/bloco específico.

---

### Slide 21 — Hierarchical Verification Isolation: Example

A figura mostra um exemplo com arquivos `fred.v` e `fred2.v`, uma instância interna `u1 (harry)` e observações de fronteira para `u1`.

Texto extraído das caixas:

```text
harry equivalent after boundary opt
```

No diagrama da direita:

```text
fred
```

Pinos de entrada de `harry`:

```text
a
b
c
d
```

Saída:

```text
z2
```

Observações de fronteira para `u1 (harry)`:

```text
Boundary observations for u1 (harry)
1) a is undriven
2) b is constant 1
3) c and d are equivalent
4) z2 is unread
```

Pergunta:

```text
Can one generate this setup?
```

Interpretação:

Este exemplo mostra um bloco interno chamado `harry` dentro de `fred`.

Após boundary optimization, `harry` pode continuar funcionalmente equivalente, mas suas fronteiras foram afetadas:

- `a` ficou sem driver;
- `b` virou constante `1`;
- `c` e `d` são equivalentes;
- `z2` não é lido.

Isso é típico de boundary optimization: a lógica ao redor do bloco permite inferir condições sobre os pinos do bloco. Para verificar `harry` isoladamente, você precisa recriar essas condições de fronteira.

Sem essas constraints, a verificação hierárquica de `harry` pode falhar, mesmo que o topo flat esteja correto.

A pergunta do slide é se o Formality consegue gerar esse setup automaticamente ou semi-automaticamente. A resposta vem no próximo slide: o script hierárquico pode conter essas informações.

---

### Slide 22 — Example script

Texto extraído e reconstruído do script superior:

```tcl
# Example FM script
set synopsys_auto_setup true
read_verilog -r fred.v
set_top fred
read_verilog -i fred2.v
set_top fred

# All hierarchy
write_hierarchical_verification_script -path $ref/u1 -rep fred_u1_hier.tcl

# source fred_u1_hier.tcl
```

Caixa:

```text
Can limit the path that Formality does verification on
```

Texto extraído do trecho copiado de `fred_u1_hier.tcl`:

```tcl
# Cut and paste from fred_u1_hier.tcl
set_reference_design r:/WORK/harry
set_implementation_design i:/WORK/harry

set_dont_verify_points -type port $ref/z2
set_dont_verify_points -type port $impl/z2

set_constant -type port $ref/a 0
set_constant -type port $ref/b 1

set master_obj c
set slave_obj d
set_connection -type port -to $master_obj -from $slave_obj
```

Caixas amarelas:

```text
Setup for verifying harry (u1) in fred_u1_hier.tcl
```

```text
Unread ports
```

```text
Constant constraints
```

```text
Equivalence of c and d pins
```

Interpretação:

Este slide mostra o valor prático de `write_hierarchical_verification_script`.

A opção:

```tcl
-path $ref/u1
```

limita o caminho que o Formality considera para gerar o script de verificação hierárquica. O objetivo é gerar setup específico para a instância `u1`.

O script gerado contém exatamente as condições vistas no slide anterior:

#### 1. `z2` é unread

```tcl
set_dont_verify_points -type port $ref/z2
set_dont_verify_points -type port $impl/z2
```

#### 2. `a` é constante

```tcl
set_constant -type port $ref/a 0
```

#### 3. `b` é constante `1`

```tcl
set_constant -type port $ref/b 1
```

#### 4. `c` e `d` são equivalentes

```tcl
set_connection -type port -to $master_obj -from $slave_obj
```

A mensagem é forte: mesmo que você não use verificação hierárquica completa, o script gerado pode fornecer setup de fronteira útil para depurar um bloco isolado.

---

### Slide 23 — Isolate problem: Where in the logic cone?

Texto extraído:

```text
The pattern window is good starting point.
Recall the pattern in red is what must be set for pattern to fail
```

Caixa amarela:

```text
Patterns only failing when instruct[2:0] = 010
```

Outra caixa:

```text
Working hypothesis. Problem on this branch of logic cone
```

Interpretação:

A Pattern Window mostra o estímulo que causa a falha. Os valores em vermelho indicam o que precisa ser configurado para que o padrão falhe.

No exemplo, a falha ocorre apenas quando:

```text
instruct[2:0] = 010
```

Isso sugere que o problema não está em todo o cone, mas em um ramo específico controlado por essa condição.

Esse é o raciocínio de debug:

```text
A falha só aparece em uma condição específica.
Logo, formule hipótese: o problema está no ramo da lógica selecionado por essa condição.
```

A Pattern Window não apenas mostra contraexemplo; ela ajuda a formular uma hipótese sobre qual parte do cone deve ser investigada.

---

### Slide 24 — Isolate problem: Where in the logic cone? Hierarchy crossing

Texto extraído e caixas:

```text
The failing point may cross hierarchy that is still there in implementation
```

```text
Boundary optimized hierarchy still useful
```

Diagrama:

```text
L → P → R → F
```

Onde:

```text
P = hierarchical crossing pin
F = failing point
```

Caixas:

```text
Problem here (Right)
Or here (Left)
```

```text
Hierarchical crossing, pin P
Good place for probe
```

```text
Add a compare to net connected to P
If probe point passes then problem not in L
```

```text
Note the stimulus may also suggest interesting parts of the hierarchy:
1) Red values (previous slide) may suggest which part of logic hierarchy
2) The stimulus values of pattern is overlaid on schematic.
   Also the matching tool is of great help.
```

Interpretação:

A figura divide o cone em duas partes:

```text
L → P → R → F
```

`F` é o failing point final. O problema pode estar:

- à esquerda de `P`, em `L`;
- à direita de `P`, em `R`.

O pino hierárquico `P` é um ponto natural para colocar um probe. Se o probe em `P` passa, então o lado esquerdo `L` provavelmente não é o problema. O problema fica no lado direito `R`.

Se o probe em `P` falha, então a diferença já existe antes ou no ponto `P`, e você deve investigar `L`.

Essa técnica reduz o cone:

```text
cone grande → divisão por uma fronteira hierárquica → cone menor
```

---

### Slide 25 — Isolating problem: Matching tool

Texto extraído:

```text
You can use the matching tool to see where the stimulus does and doesn’t match in the hierarchy
```

A figura mostra uma janela com opções:

```text
Show matched points with:
Different simulation values
Identical simulation values
Matches outside of the complementary cone
```

A tabela mostra objetos como:

```text
alu_inst/b
alu_inst/a
alu_inst/result
```

Com tipos como:

```text
hier in
hier out
```

Interpretação:

O Matching Tool ajuda a ver, dentro da hierarquia, onde os valores de simulação do padrão falho coincidem ou divergem.

Uso:

- Marcar “Different simulation values” para ver onde Ref e Impl diferem.
- Marcar “Identical simulation values” para ver fronteiras onde os valores ainda batem.
- Usar pinos `hier in` e `hier out` como marcos de localização.

Esse recurso ajuda a transformar o padrão de falha em uma trilha de debug dentro da hierarquia.

---

### Slide 26 — Isolating problem: Matching tool — reforço

Este slide repete a mesma ideia: a ferramenta de matching mostra onde o estímulo coincide ou não coincide na hierarquia.

Interpretação adicional:

A repetição sugere que, ao depurar cones que atravessam hierarquia, você não deve confiar apenas em leitura manual do schematic. Use a própria ferramenta para listar pontos casados com valores diferentes.

Isso evita perder tempo procurando visualmente onde o valor divergiu.

---

### Slide 27 — Isolate problem: Where in the logic cone? Cutpoint at P

Texto extraído:

```text
Assuming we suspect that the problem is in R or what to confirm problem in L
```

Caixa de comando:

```tcl
Add a cutpoint at P

set_cutpoint -type pin $ref/inst/P
set_cutpoint -type pin $impl/inst/P
```

Caixas:

```text
If cut point at P passes then L isn't the problem and we now have a smaller
logic cone to debug failing point F
```

```text
If cut point P fails but F now passes then problem in L
```

```text
If both cut-point and F and P fail consider using set_user_match -inverted
```

Interpretação:

Agora a aula sai de probe point e entra em cutpoint.

Um cutpoint em `P` muda a estrutura da verificação: `P` vira uma nova fronteira. O que antes era um cone grande passa a ser dividido.

Casos:

#### Caso 1 — Cutpoint em `P` passa

Se `P` passa, o lado esquerdo `L` está equivalente. O problema está depois de `P`, no lado direito `R` ou entre `P` e `F`.

#### Caso 2 — Cutpoint em `P` falha, mas `F` passa

Isso sugere que a diferença está antes de `P`, no lado esquerdo `L`. Ao cortar em `P`, você separou o problema do failing point final.

#### Caso 3 — `P` e `F` falham

Pode haver inversão ou relação não direta. O slide sugere considerar:

```tcl
set_user_match -inverted
```

Isso lembra a unidade de phase inversion.

---

### Slide 28 — Probe points vs. Cut-points

Texto extraído:

```text
Probe points
Very quick to use and verify
Don't have to go back to setup
But doesn't change the start point of logic cones for compare points in fanout of probe
Probes are probes (passive monitors)
```

```text
Cut-points
Can only be applied during setup
It changes logic cones
Is like a pseudo output and input.
Becomes the input of compare points in fanout
Typically cut a point in Ref and Impl
Sometimes need a set_user_match
```

Interpretação:

Este slide é essencial porque diferencia duas ferramentas parecidas, mas com efeitos diferentes.

#### Probe point

Probe é um monitor passivo. Ele compara duas nets internas, mas não muda o cone de verificação.

Vantagens:

- rápido;
- pode ser adicionado depois do verify;
- não exige voltar para setup.

Limitação:

- não reduz o cone dos compare points downstream;
- apenas informa se aquele ponto interno bate.

#### Cutpoint

Cutpoint altera a verificação. Ele corta o cone e cria uma nova fronteira.

Vantagens:

- reduz o cone;
- transforma um ponto interno em uma espécie de pseudo entrada/saída;
- ajuda a isolar de forma mais forte.

Limitações:

- precisa ser aplicado em setup;
- muda a estrutura da prova;
- normalmente precisa ser aplicado em Ref e Impl;
- pode precisar de `set_user_match`.

Regra prática:

```text
Use probe para investigar rápido.
Use cutpoint quando precisar alterar o cone e isolar formalmente.
```

---

### Slide 29 — Isolate problem: Other invariant points

Texto extraído:

```text
If the problem in between pre to post layout, then likely large numbers
of nets pin will not have changed.
```

```text
Applied cutpoints and probe points as see fit
Most problems straightforward and clear from pattern window
```

```text
There may be other problem relevant invariant points
If having problems with clock-gating a probe point on the enable pin of the ICG
and the enable pin of the original flip-flop may shed light on problem.
```

Interpretação:

O slide amplia o conceito de ponto de isolamento.

Em comparação pre-layout versus post-layout, muitas nets e pins não mudam. Isso cria muitos pontos invariantes úteis para probes/cutpoints.

Em problemas de clock-gating, um ponto interessante pode ser:

```text
enable pin da ICG cell
```

comparado com:

```text
enable pin do flip-flop original
```

Isso pode revelar se a diferença está no controle de clock-gating ou em outra parte da lógica.

Mensagem prática:

```text
Procure pontos invariantes relevantes ao problema.
Não use probe/cutpoint aleatoriamente.
```

---

### Slide 30 — Unit Summary

Texto extraído:

```text
Large structural changes (eg datapath) are handled in Formality by SVF
```

```text
No requirement to preserve hierarchy
```

```text
Some setup maybe required if trying to verify hierarchically
```

```text
Many debugging features available to isolate failing point
(Probe points; Pattern Window; Matching Tool; Cut-points)
```

Interpretação:

Resumo da unidade:

1. Grandes mudanças estruturais, como datapath, são tratadas por SVF.
2. O Formality não exige que a hierarquia seja preservada.
3. Se você escolher verificar hierarquicamente, pode precisar de setup extra.
4. Para isolar failing points, use:
   - Pattern Window;
   - Matching Tool;
   - probe points;
   - cutpoints;
   - hierarquia existente;
   - contexto do projeto.

---

### Slide 31 — Unit Summary — repetição final

O último print repete o resumo da unidade:

```text
Large structural changes (eg datapath) are handled in Formality by SVF
No requirement to preserve hierarchy
Some setup maybe required if trying to verify hierarchically
Many debugging features available to isolate failing point
(Probe points; Pattern Window; Matching Tool; Cut-points)
```

Interpretação:

A repetição final reforça a mensagem: a hierarquia é útil, mas não obrigatória. O Formality pode trabalhar flat. Quando o engenheiro decide usar hierarquia para isolar ou verificar blocos, ele assume a responsabilidade de modelar corretamente as fronteiras que a síntese pode ter otimizado.

---

## Aula didática desenvolvida

### 1. Verificação hierárquica não é automaticamente melhor

É tentador pensar:

```text
design grande → verificar hierarquicamente é melhor
```

Mas o curso mostra uma visão mais refinada. Em Formality, flat verification frequentemente é a melhor primeira abordagem, porque evita transformar fronteiras internas em compare points explícitos.

Hierarchical verification é útil quando há:

- fluxo de implementação hierárquico;
- restrições de capacidade;
- IP hardening;
- ECO localizado;
- necessidade de isolar um bloco;
- cone muito grande atravessando hierarquia.

Mas se a síntese fez boundary optimization, a verificação hierárquica pode precisar de setup extra. Caso contrário, o bloco isolado pode parecer diferente mesmo que o top flat esteja correto.

---

### 2. O grande risco da verificação hierárquica: boundary optimization

Boundary optimization permite que o DC:

- propague constantes para dentro do bloco;
- remova lógica não lida;
- mova inversões;
- modifique relações entre pinos;
- otimize caminhos críticos através da fronteira.

Isso é bom para QoR, mas muda o significado isolado das fronteiras.

Exemplo:

```text
No top:
  a é undriven
  b é constante 1
  c e d são equivalentes
  z2 não é lido
```

Se você verificar o bloco isoladamente sem essas informações, vai oferecer ao bloco estímulos que nunca ocorrem no contexto real do topo. A verificação pode falhar falsamente.

---

### 3. `write_hierarchical_verification_script` como gerador de setup

O comando:

```tcl
write_hierarchical_verification_script
```

não serve apenas para “rodar hierárquico”. Ele também gera conhecimento útil.

No exemplo, o script gerado revela:

```tcl
set_dont_verify_points -type port $ref/z2
set_constant -type port $ref/a 0
set_constant -type port $ref/b 1
set_connection -type port -to c -from d
```

Esses comandos representam as condições de fronteira inferidas pelo Formality.

Ou seja, mesmo que você não use o fluxo hierárquico completo, pode usar o script como fonte de setup para debug.

---

### 4. Pattern Window como ferramenta de hipótese

A Pattern Window mostra o padrão falho. O curso destaca que os valores em vermelho indicam condições necessárias para a falha.

Exemplo:

```text
falha só quando instruct[2:0] = 010
```

Isso permite formular hipótese:

```text
o problema está no ramo do case/if selecionado por instruct = 010
```

Esse é o jeito certo de usar Pattern Window: não apenas como tabela de valores, mas como guia para restringir a investigação.

---

### 5. Probe points: monitores rápidos

Probe points são bons para responder perguntas como:

```text
Ref e Impl têm o mesmo valor nesse pino hierárquico?
```

Eles são rápidos porque não exigem voltar a setup.

Uso típico:

```text
Tenho cone L → P → R → F.
Coloco probe em P.
Se P passa, L não é o problema.
Se P falha, a diferença já surgiu antes de P.
```

Mas probe não muda a verificação downstream. Ele só monitora.

---

### 6. Cutpoints: corte real do cone

Cutpoints são mais fortes que probes. Eles mudam o cone.

Comandos:

```tcl
set_cutpoint -type pin $ref/inst/P
set_cutpoint -type pin $impl/inst/P
```

Depois disso, `P` vira uma nova fronteira. Isso permite dividir o problema.

Mas como cutpoint muda o setup, precisa ser definido antes da verificação. Ele não é apenas um monitor.

---

### 7. Matching Tool: onde o estímulo diverge na hierarquia

O Matching Tool pode mostrar pontos hierárquicos com:

```text
different simulation values
identical simulation values
```

Isso ajuda a localizar o primeiro ponto onde Ref e Impl divergem.

Em vez de seguir fios manualmente, você usa a ferramenta para listar candidatos.

---

### 8. Outros pontos invariantes

O curso fecha com uma ideia ampla: procure pontos que você sabe que deveriam ser equivalentes.

Exemplos:

- nets iguais em pre-layout e post-layout;
- pinos que não deveriam mudar;
- enable da ICG cell versus enable original;
- resets bufferizados;
- clocks bufferizados;
- pinos hierárquicos preservados.

Esses pontos são bons candidatos para probes e cutpoints.

---

## Conceitos difíceis explicados em profundidade

### Hierarchical verification

Fluxo que verifica blocos separadamente e depois verifica o topo com os blocos já verificados como black boxes.

---

### Flat verification

Fluxo que verifica o design inteiro no topo, com os blocos internos abertos.

---

### Boundary pin

Pino na fronteira de um bloco hierárquico. Em verificação hierárquica, esses pinos viram compare points explícitos.

---

### Boundary optimization

Otimização que atravessa fronteiras hierárquicas. Pode mudar a função observada nos pinos de um bloco isolado, embora a função total do top esteja correta.

---

### `write_hierarchical_verification_script`

Comando que gera script de verificação hierárquica. Pode ser usado para rodar hierárquico ou para extrair setup de fronteira.

---

### `set_dont_verify_points`

Comando usado para dizer que certos pontos não devem ser verificados, por exemplo uma porta unread.

---

### `set_connection`

Comando usado para declarar relação/conexão entre objetos, como pinos equivalentes.

---

### Probe point

Monitor passivo que compara nets internas sem alterar o cone de verificação.

---

### Cutpoint

Ponto que corta o cone e vira uma nova fronteira formal de verificação.

---

### Matching Tool

Ferramenta da GUI que mostra pontos casados com valores de simulação iguais ou diferentes para um padrão.

---

### Invariant point

Ponto do design que deveria permanecer equivalente entre referência e implementação, útil para probe/cutpoint.

---

## Comandos importantes

### Gerar script hierárquico

```tcl
write_hierarchical_verification_script
```

Com path específico:

```tcl
write_hierarchical_verification_script -path $ref/u1 -rep fred_u1_hier.tcl
```

### Setup de bloco a partir do script gerado

```tcl
set_reference_design r:/WORK/harry
set_implementation_design i:/WORK/harry
```

### Portas unread

```tcl
set_dont_verify_points -type port $ref/z2
set_dont_verify_points -type port $impl/z2
```

### Constantes de fronteira

```tcl
set_constant -type port $ref/a 0
set_constant -type port $ref/b 1
```

### Conexão/equivalência de pinos

```tcl
set master_obj c
set slave_obj d
set_connection -type port -to $master_obj -from $slave_obj
```

### Cutpoints

```tcl
set_cutpoint -type pin $ref/inst/P
set_cutpoint -type pin $impl/inst/P
```

### Inversão suspeita

```tcl
set_user_match -inverted
```

---

## Probe points versus Cutpoints

| Recurso | Quando usar | Vantagem | Limitação |
|---|---|---|---|
| Probe point | Para testar rapidamente se uma net interna bate | Não precisa voltar ao setup; é rápido | Não muda o cone downstream |
| Cutpoint | Para dividir formalmente o cone e criar nova fronteira | Reduz o cone; isola antes/depois do ponto | Precisa ser definido em setup; muda a prova |

Regra prática:

```text
Probe primeiro para investigar.
Cutpoint depois se precisar isolar formalmente.
```

---

## Figuras e diagramas importantes

### Hierarchical Verification: Why

Mostra que hierarquia pode ser usada por capacidade, IP hardening, ECOs, isolamento de cones ou hábito de ferramenta anterior.

---

### Classic Hierarchical Verification

Mostra a diferença central:

```text
Flat: pinos de bloco não são explicitamente compare points.
Hierarchical: todos os pinos de fronteira são compare points.
```

---

### Hierarchical Verification Isolation Example

Mostra `harry` dentro de `fred`, com boundary observations:

```text
a undriven
b constant 1
c and d equivalent
z2 unread
```

Essa figura ensina que a verificação isolada de um bloco precisa replicar o contexto da fronteira.

---

### Example script

Mostra que o script gerado pelo Formality contém:

- `set_dont_verify_points`;
- `set_constant`;
- `set_connection`.

Esse script é fonte de setup útil.

---

### Pattern Window

Mostra que a falha ocorre apenas quando:

```text
instruct[2:0] = 010
```

e isso ajuda a localizar o ramo do cone.

---

### Hierarchy crossing pin P

Mostra o cone dividido em:

```text
L → P → R → F
```

e usa `P` como candidato a probe/cutpoint.

---

### Matching Tool

Mostra como listar pontos hierárquicos com valores de simulação diferentes ou idênticos.

---

### Cutpoint at P

Mostra como `set_cutpoint` muda o cone e ajuda a decidir se o problema está em `L` ou `R`.

---

### Probe points vs Cut-points

Figura/tabela conceitual que separa monitores passivos de cortes reais no cone.

---

### Other invariant points

Mostra que, em pre-layout versus post-layout, muitos pins/nets não mudam e podem ser usados como pontos de isolamento.

---

## Pontos de prova e revisão

1. Verificação hierárquica pode ser considerada por capacidade, IP hardening, ECO ou isolamento.
2. Usar hierarquia só por hábito de outra ferramenta não é necessariamente bom.
3. Formality suporta verificação hierárquica.
4. O comando principal é `write_hierarchical_verification_script`.
5. Verificação hierárquica não é necessariamente o modo preferido no Formality.
6. Hierarchical verification pode ser útil para ECOs.
7. Hierarchical verification pode ser útil para isolar problemas.
8. O script hierárquico pode ser sourceado diretamente.
9. O script hierárquico pode ser copiado parcialmente para verificar um bloco.
10. O script hierárquico contém setup útil para cones que cruzam hierarquia.
11. Em flat verification, blocos internos não são black-boxed.
12. Em hierarchical verification, blocos são verificados separadamente.
13. Depois de verificar blocos, o top é verificado com os blocos black-boxed.
14. Em flat verification, boundary pins não são explicitamente compare points.
15. Em hierarchical verification, todos os boundary pins são compare points.
16. Boundary optimization pode criar constraints necessárias nas fronteiras.
17. Um pino pode ficar undriven por causa do contexto do topo.
18. Um pino pode virar constante por causa do contexto do topo.
19. Dois pinos podem ser equivalentes por causa do contexto.
20. Uma saída pode ser unread.
21. `write_hierarchical_verification_script -path` pode limitar o caminho analisado.
22. `set_dont_verify_points` pode marcar portas unread.
23. `set_constant` pode aplicar constraints de fronteira.
24. `set_connection` pode declarar equivalência/conexão de pinos.
25. Pattern Window é bom ponto de partida para isolar falha.
26. Valores em vermelho na Pattern Window indicam condições necessárias para a falha.
27. Se a falha só ocorre para `instruct[2:0] = 010`, o problema pode estar no ramo selecionado por essa condição.
28. Pinos hierárquicos são bons candidatos a probe points.
29. Se probe em `P` passa, o problema provavelmente não está antes de `P`.
30. Se probe em `P` falha, a diferença já existe antes ou em `P`.
31. Matching Tool mostra onde o estímulo bate ou diverge na hierarquia.
32. Cutpoint muda o cone de verificação.
33. Cutpoint precisa ser aplicado em setup.
34. Probe point não muda o cone.
35. Probe point é monitor passivo.
36. Cutpoint vira pseudo input/output.
37. Normalmente aplica-se cutpoint em Ref e Impl.
38. Às vezes cutpoint precisa de `set_user_match`.
39. Se cutpoint e failing point falham, pode haver inversão, sugerindo `set_user_match -inverted`.
40. Em pre-layout versus post-layout, muitos nets/pins não mudam.
41. Pontos invariantes são bons candidatos a probe/cutpoint.
42. Em clock-gating, probe no enable da ICG e no enable original pode ajudar.
43. Grandes mudanças estruturais, como datapath, são tratadas por SVF.
44. Não há requisito geral de preservar hierarquia.
45. Setup extra pode ser necessário em verificação hierárquica.
46. Pattern Window, Matching Tool, probe points e cutpoints são recursos centrais para isolar failing points.

---

## Relação com projeto/laboratório

### Fluxo recomendado antes do isolamento manual

Antes de usar probe/cutpoint, confirme:

```text
1. SVF correto.
2. Menor estágio possível.
3. Setup correto.
4. Matching limpo.
5. analyze_points sem diagnóstico suficiente.
```

### Uso de Pattern Window

Se a falha ocorre apenas com um valor específico:

```text
instruct[2:0] = 010
```

isole o ramo do cone controlado por essa condição.

### Uso de hierarquia

Se o cone cruza uma fronteira hierárquica:

```text
L → P → R → F
```

use `P` como ponto candidato para probe ou cutpoint.

### Uso de cutpoint

```tcl
set_cutpoint -type pin $ref/inst/P
set_cutpoint -type pin $impl/inst/P
```

Interpretação:

```text
P passa → problema depois de P.
P falha → problema antes ou em P.
```

### Uso de script hierárquico para setup de boundary

```tcl
write_hierarchical_verification_script -path $ref/u1 -rep fred_u1_hier.tcl
```

Depois, procurar no script comandos como:

```tcl
set_dont_verify_points
set_constant
set_connection
```

---

## Checklist de qualidade

- [x] Bloco 074 processado como continuação do Bloco 073.
- [x] Faixa 17-31 do roteiro foi coberta.
- [x] Texto das imagens foi extraído e organizado.
- [x] Figuras de verificação hierárquica, boundary setup, Pattern Window, Matching Tool, probe/cutpoint e Unit Summary foram interpretadas.
- [x] Comandos Tcl foram preservados.
- [x] Diferença entre flat e hierarchical verification foi reforçada.
- [x] Diferença entre probe points e cutpoints foi explicada.
- [x] Próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 075
- **Aula:** 11 Conclusion
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\11 Conclusion.docx
```

- **Faixa:** slides 1-4
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\11 Conclusion.md
```

- **Próximo depois dele:** Bloco 076 — `01 Fusion Compiler Synthesis and Design Implementation Jumpstart - parte A`
