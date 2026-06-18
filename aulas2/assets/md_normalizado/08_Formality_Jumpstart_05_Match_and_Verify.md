# 05 Match and Verify

## Controle do bloco

- **Bloco:** 055
- **Curso:** 08 Formality Jumpstart
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\05 Match and Verify.docx`
- **Faixa de slides:** 1-13
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\05 Match and Verify.md`
- **Próximo bloco recomendado:** Bloco 056 — `06 Debugging` — parte A, slides 1-17

## Resumo executivo

Esta aula entra na parte central do fluxo do Formality: depois de ler os designs, carregar bibliotecas, aplicar SVF/guidance e preparar o setup, chega o momento de **match** e **verify**.

O **match** tenta alinhar os *compare points* do design de referência com os *compare points* equivalentes do design de implementação. Em termos práticos, ele tenta responder: “este registrador/saída/ponto comparável do RTL corresponde a qual registrador/saída/ponto comparável da netlist sintetizada?”. Sem essa correspondência, o Formality não sabe quais cones lógicos devem ser comparados entre si.

O **verify** é a etapa em que o Formality executa seus algoritmos formais nos pares já casados de compare points. Ele tenta provar se os cones lógicos que alimentam esses pontos produzem exatamente a mesma função lógica. Se forem equivalentes, o ponto passa. Se houver diferença, o ponto falha e o Formality pode produzir *counterexamples*, isto é, exemplos de valores de entrada/estado que fazem o design de referência e o de implementação responderem de modo diferente.

A aula também apresenta recursos práticos para controle de runtime, verificação hierárquica, uso de multicore e estratégias alternativas para compare points difíceis. Esses tópicos são importantes porque, em designs reais, equivalência formal não é apenas “rodar verify”; é também saber interpretar pontos não casados, controlar tempo de execução, aplicar regras de comparação e escolher estratégias quando o design é grande ou complexo.

---

## Texto extraído e organizado por slide

### Slide 1 — Matching Compare Points

Comando mostrado:

```tcl
fm_shell (setup)> match
```

Texto principal extraído:

- The first thing `match` does is verify and apply the guidance (SVF) if set.
  - The guidance makes the subsequent matching and verification far easier.
  - Far less manual setup.
  - Better completion.
- With Formality 2014.09 and onwards, “applying the SVF” step can be done separately using `preverify` command.
- The “applying the SVF” is only done once.
  - If `match` has previously been run, a subsequent `match` will not apply the SVF again.
  - If `preverify` has previously been run, a subsequent `match` will not apply the SVF again.

#### Interpretação do slide

O slide mostra que `match` não é apenas uma etapa de comparação de nomes. A primeira coisa que ele faz, se houver SVF configurado com `set_svf`, é **verificar e aplicar o guidance** vindo do Design Compiler.

Isso é muito importante porque o SVF contém informações sobre transformações feitas durante a síntese: mudança de nomes, registros fundidos, registros duplicados, re-encoding de FSM, retiming, inversão de fase de registrador, clock-gating e outras alterações. Sem essas informações, o Formality teria que tentar adivinhar muita coisa, o que aumenta o risco de pontos não casados, falhas falsas e necessidade de debug manual.

A partir de versões mais novas citadas pelo slide, como Formality 2014.09 em diante, a aplicação do SVF pode ser separada pelo comando `preverify`. Assim, o usuário pode aplicar/verificar o guidance antes de efetivamente rodar `match`.

Ponto importante: aplicar SVF é uma operação feita uma vez. Se `match` já aplicou o SVF, rodar `match` novamente não reaplica o SVF. O mesmo vale se `preverify` já tiver aplicado essa etapa.

---

### Slide 2 — Matching Compare Points

Texto principal extraído:

- The `match` command is optional.
  - The `verify` command will also run matching.
  - Recommendation:
    - For interactive work, use the `match` command for feedback.
    - Omit the `match` command from scripts to reduce runtime.
- Name matching algorithms are used first.
- Remaining unmatched points matched by signature analysis.
  - Includes structural techniques.
  - Signature analysis may be turned off, but not recommended.
- Any remaining unmatched points are then reported.
  - User can specify compare rules or can manually set matches.
- Use of the SVF flow improves name matching performance and completion.
  - Matches points by name without user intervention.

#### Interpretação do slide

O slide deixa claro que `match` é tecnicamente opcional, porque `verify` também chama a etapa de matching. Mas a recomendação prática depende do modo de trabalho:

- em uso interativo, é melhor rodar `match` explicitamente para receber feedback antes de verificar;
- em scripts automatizados, pode ser melhor omitir `match` e deixar `verify` executar o matching, reduzindo tempo total e comandos redundantes.

A ordem do matching é importante:

1. Primeiro, o Formality tenta casar pontos por **nome**.
2. Depois, para o que sobrar sem match, ele usa **signature analysis**.
3. Se ainda sobrarem pontos não casados, eles são reportados.
4. O usuário pode então criar **compare rules** ou fazer matches manuais.

A assinatura (*signature*) é uma espécie de caracterização estrutural/funcional do ponto. Mesmo que o nome mude, o Formality pode tentar reconhecer que aquele ponto tem estrutura equivalente ou relação provável com outro ponto. Ainda assim, o fluxo com SVF é preferível porque evita depender demais de heurísticas.

---

### Slide 3 — GUI Unmatched Point Report

Texto e elementos visuais extraídos:

- Título: **GUI Unmatched Point Report**
- A tela mostra a GUI do Formality na etapa **4. Match**.
- Há abas como:
  - Compare Rule Setup
  - User Match Setup
  - Matched Points
  - Unmatched Points
  - Summary
- A figura destaca duas ações:
  - **Create a compare rule**
  - **Select two points and set match**
- A GUI lista pontos do design de referência e pontos do design de implementação que ainda não foram casados.

#### Análise da figura

A figura mostra o cenário em que o Formality não conseguiu casar todos os compare points automaticamente. Isso normalmente aparece quando houve mudança de nome, mudança hierárquica, otimização agressiva ou quando o SVF não trouxe guidance suficiente.

A GUI oferece dois caminhos:

1. **Criar uma compare rule**  
   Usada quando a diferença de nomes segue um padrão. Exemplo: todos os nomes da implementação têm um prefixo que não existe no RTL, ou uma hierarquia foi removida.

2. **Selecionar dois pontos e fazer match manual**  
   Usado quando o caso é isolado e não compensa escrever uma regra geral. O usuário aponta explicitamente que um ponto do reference design corresponde a um ponto do implementation design.

A lógica do slide é prática: antes de tentar debugar uma falha de equivalência, é preciso garantir que os pontos corretos foram comparados entre si. Um compare point não casado não é uma falha lógica ainda; é um problema de correspondência.

---

### Slide 4 — Compare Rules

Texto principal extraído:

- When names change in predictable ways, write a compare rule.
- Use SED syntax to translate names in one design to the corresponding names in the other design.

Comando mostrado:

```tcl
fm_shell (match)> set_compare_rule $ref \
    -from {i_tv80_core} -to {}
fm_shell (match)> match
```

#### Interpretação do comando

O comando `set_compare_rule` cria uma regra de tradução de nomes. Nesse exemplo:

```tcl
set_compare_rule $ref \
    -from {i_tv80_core} -to {}
```

A regra atua sobre `$ref`, isto é, sobre o design de referência. Ela diz, de forma simplificada: “ao comparar nomes, remova o trecho `i_tv80_core` do nome no reference design”.

Depois disso, o comando `match` é rodado novamente para que o Formality tente casar os pontos usando a nova regra.

#### Exemplo conceitual

Imagine que no RTL um registrador apareça como:

```text
i_tv80_core/u_reg/state[3]
```

Mas na implementação sintetizada ele apareça como:

```text
/u_reg/state[3]
```

Sem regra, o Formality pode não perceber a correspondência. Com uma compare rule removendo `i_tv80_core`, os nomes passam a se alinhar melhor.

O ponto central: **compare rules são úteis quando a diferença de nomes é sistemática**. Se cada ponto mudou de forma diferente, a regra pode ser inadequada e o match manual pode ser necessário.

---

### Slide 5 — Verify Implementation Design

Texto principal extraído:

- Runs Formality’s verification algorithms on compare points.
  - Formality deploys many different solvers.
  - Each solver uses a different algorithm to prove equivalence or non-equivalence.
- Four possible results:
  - **Succeeded:** Implementation is equivalent to the reference.
  - **Failed:** Implementation is not equivalent to the reference.
    - True logic difference, or setup problem.
  - **Inconclusive:** No points failed, but analysis is incomplete.
    - Might be due to timeout or complexity.
  - **Not run:** A problem earlier in the flow prevented verification from running at all.

#### Interpretação do slide

O comando `verify` é a etapa em que o Formality realmente tenta provar equivalência entre os cones lógicos. Ele não usa simulação por vetores; ele aplica algoritmos formais, muitas vezes com diferentes solvers.

O slide apresenta quatro resultados que precisam ser bem diferenciados:

| Resultado | Significado |
|---|---|
| `Succeeded` | A implementação foi provada equivalente à referência. |
| `Failed` | Foi encontrada diferença lógica, ou existe erro de setup causando aparente diferença. |
| `Inconclusive` | Nenhuma falha foi provada, mas o Formality não conseguiu completar a prova. |
| `Not run` | A verificação nem chegou a rodar, geralmente por erro anterior no fluxo. |

A pegadinha principal é que **Failed não significa automaticamente bug real no design**. Pode ser erro de setup: scan enable não travado, clock-gating mal configurado, black box sem match, UPF incorreto, SVF ausente ou nomes não alinhados.

Também é importante não confundir `Inconclusive` com sucesso. Ele apenas diz que o Formality não conseguiu concluir dentro dos limites/estratégias atuais.

---

### Slide 6 — Verify Implementation Design (cont)

Texto principal extraído:

- For each matched pair of compare points, Formality:
  - Confirms same functionality of logic cones.
  - Marks point as “passed”.
- Or:
  - Determines that functionality is different between logic cones.
  - Finds one or more “counter examples” that shows different response at compare point.
  - Marks the compare point as “failed”.
- All valid compare points are verified.
  - Constant registers are not verified.
  - “Unread” compare points are not verified by default.
    - Unread points do not affect other compare points or primary outputs.

#### Interpretação do slide

Depois que os compare points são casados, o Formality compara os cones lógicos que alimentam cada par. Se os cones são equivalentes, o ponto passa. Se há diferença funcional, o ponto falha.

O conceito de **counterexample** é essencial. Um counterexample é uma combinação de sinais de entrada, estados ou condições internas que demonstra a diferença. Ele funciona como uma “prova de falha”: para aquela condição, o design de referência produz um valor e o design de implementação produz outro.

O slide também destaca que nem todos os pontos são verificados:

- registradores constantes podem ser ignorados;
- pontos “unread” não são verificados por padrão.

Um ponto “unread” é um ponto cujo valor não afeta outros compare points nem saídas primárias. Se um registrador existe mas sua saída não influencia nada observável, verificar esse ponto pode ser irrelevante para a equivalência funcional observável do design.

---

### Slide 7 — Verify Example

Comando mostrado:

```tcl
fm_shell (match)> verify
```

Texto principal extraído:

- Verification is incremental.
  - Verification can continue again after being stopped.
  - You may match additional compare points manually and continue with verification.
  - To force verification of entire design: `verify -restart`.
- Options:
  - Verification of single compare point.
  - Verification against a constant: `verify $ref/cp -constant0`.
  - Use `set_dont_verify` to exclude points from verification.

#### Interpretação do slide

A verificação do Formality é incremental. Isso é muito útil em debug real. Se o Formality parou por timeout, se alguns pontos falharam, ou se você percebeu que precisa fazer matches manuais, não precisa começar necessariamente do zero.

O comando básico é:

```tcl
verify
```

Para forçar uma nova verificação completa, ignorando resultados incrementais anteriores, usa-se:

```tcl
verify -restart
```

Também é possível verificar um ponto específico. Isso ajuda quando o objetivo é depurar um compare point problemático sem gastar tempo no design inteiro.

O comando `set_dont_verify` exclui pontos da verificação. Deve ser usado com cuidado, porque excluir um ponto sem justificativa pode mascarar um problema real.

---

### Slide 8 — Controlling Verification Runtimes

Comandos e texto extraídos:

```tcl
set verification_timeout_limit hrs:min:sec
```

- Halts entire verification after a specified time.
- 36 CPU hours is default limit.
- `0:0:0` means no timeout.
- Remaining unverified compare points are not attempted.

```tcl
set verification_failing_point_limit number
```

- Halts verification after specified number of compare points fail.
- Default is 20 failing compare points.
- Allows you to correct for any missing setup.
- Allows you to begin debugging failing compare points.

#### Interpretação do slide

Essas variáveis controlam o custo da verificação.

A variável:

```tcl
set verification_timeout_limit hrs:min:sec
```

define um limite global de tempo. Se o Formality ultrapassar esse limite, ele para e deixa compare points restantes sem tentar. O slide indica que o default é 36 CPU hours, e que `0:0:0` remove timeout.

A variável:

```tcl
set verification_failing_point_limit number
```

interrompe a verificação quando muitos pontos falham. Isso é útil porque, quando muitos pontos falham logo no início, frequentemente existe erro de setup e não um bug lógico espalhado pelo design inteiro. Parar após certo número de falhas evita desperdiçar tempo e antecipa o debug.

Exemplo conceitual:

```tcl
set verification_failing_point_limit 5
verify
```

Se cinco compare points falharem, o Formality para. A partir daí, o usuário pode investigar se esqueceu de travar `scan_enable`, aplicar SVF, configurar clock-gating ou declarar black boxes corretamente.

---

### Slide 9 — Controlling Verification Runtimes

Comando e texto extraídos:

```tcl
set verification_effort_level [super_low | low | medium | high]
```

- Specifies amount of effort spent solving a compare point.
- Default level is `high`.
- Using `super_low` finds failing compare points quickly but will also produce several aborted compare points.

#### Interpretação do slide

`verification_effort_level` controla quanto esforço o Formality coloca para tentar resolver cada compare point.

- `high`: mais esforço por ponto, maior chance de concluir pontos difíceis, mas maior tempo.
- `medium`/`low`: reduzem esforço e tempo.
- `super_low`: útil para uma triagem rápida; encontra falhas fáceis rapidamente, mas pode gerar muitos pontos abortados/inconclusivos.

O uso correto depende da fase:

- Para debug inicial, `super_low` ou `low` podem revelar falhas óbvias rapidamente.
- Para signoff ou conclusão séria, normalmente é necessário esforço maior.
- Se muitos pontos abortam, o problema pode ser complexidade real, setup ruim ou estratégia insuficiente.

---

### Slide 10 — Hierarchical Verification

Texto principal extraído:

- Command: `write_hierarchical_verification_script`
  - Formality generates Tcl script that performs hierarchical verification on current reference and implementation designs.
  - Helpful for debugging large and hard-to-verify designs.
  - Usage:

```tcl
set_top i:/WORK/top
set_constant $impl/test_se 0
write_hier -replace -level 3 myhierscript
source myhierscript.tcl
quit
```

- View results in file:

```text
fm_myhierscript.log
```

- Formality will create one session file, by default, if verification fails on a sub-design.

#### Interpretação do slide

A verificação hierárquica divide o problema por subdesigns. Em vez de verificar tudo como um único bloco enorme, o Formality gera um script que verifica partes da hierarquia.

Isso é útil para:

- designs grandes;
- pontos difíceis de provar no topo;
- debug mais localizado;
- isolamento de qual sub-bloco causa falha.

O comando citado no slide aparece como `write_hierarchical_verification_script`, mas o exemplo usa a forma curta:

```tcl
write_hier -replace -level 3 myhierscript
```

A opção `-level 3` indica profundidade hierárquica. O arquivo gerado `myhierscript.tcl` é então executado com:

```tcl
source myhierscript.tcl
```

Se a verificação falhar em um subdesign, o Formality pode criar uma sessão salva para permitir debug posterior.

---

### Slide 11 — Multicore Support

Texto principal extraído:

- Specify up to 4 cores with a single license.
- Support for UPF designs and auto-factoring.
  - Legacy distributed processing did not support UPF or auto-factoring.
- Single command for setup:

```tcl
set_host_options -max_cores num_cores
```

- New command for reporting maximum number of cores:

```tcl
report_host_options
```

#### Interpretação do slide

O slide mostra que o Formality pode usar múltiplos cores para acelerar a verificação. O comando principal é:

```tcl
set_host_options -max_cores num_cores
```

Exemplo:

```tcl
set_host_options -max_cores 4
```

Segundo o slide, até 4 cores podem ser especificados com uma única licença. Isso é especialmente útil em designs grandes, com muitos compare points ou pontos difíceis.

O slide também diferencia esse suporte de abordagens antigas de processamento distribuído, que não suportavam bem UPF ou auto-factoring. Aqui, a ideia é simplificar: uma variável de setup habilita o uso de cores, e `report_host_options` mostra a configuração.

---

### Slide 12 — Multicore Support

Texto principal extraído:

- Measure performance using wall clock time.
  - Use new Formality command `elapsed_time`.
  - Shows “wall clock” seconds since session started.
  - Continues to run even when session is idle.
  - Use immediately after `verify` command to find total seconds for verification.
  - Do not use Formality command `cputime`.
    - Adds up all CPU time of child processes serially.

#### Interpretação do slide

Ao usar multicore, medir tempo por CPU pode enganar. Se quatro processos rodam por 10 segundos em paralelo, o tempo real de parede (*wall clock*) é 10 segundos, mas a soma de CPU pode parecer 40 segundos.

Por isso, o slide recomenda usar:

```tcl
elapsed_time
```

logo após:

```tcl
verify
```

Assim, o usuário mede o tempo real percebido desde o início da sessão ou do trecho observado.

O comando `cputime` não é recomendado para medir ganho com multicore, porque soma o tempo de CPU dos processos filhos como se fossem sequenciais.

---

### Slide 13 — Alternate Verification Strategies for Resolving Hard Compare Points

Texto principal extraído:

- Two new variables are introduced to enable alternate strategies:

```tcl
set verification_alternate_strategy <>
```

- Default is `none`, which uses the standard strategy.
- Setting value other than `none` enables an alternate verification solver flow.

Read-only variable:

```tcl
verification_alternate_strategy_names
```

- Contains list of names of all alternate strategies.
- The names of the strategies, their number, and their functions may vary from release to release of Formality.

Comando mostrado:

```tcl
fm_shell (setup)> printvar verification_alternate_strategy_names
verification_alternate_strategy_names = "none a1 s2 s3 s1 i2 s6 s10 l1 l3 s8 s4 s5 k1 k2 s7 s9"
```

> Observação: a imagem tem baixa resolução em parte da lista; a ideia principal é que a variável lista os nomes das estratégias disponíveis naquela versão.

#### Interpretação do slide

Quando compare points são difíceis, a estratégia padrão pode não resolver tudo. O Formality oferece estratégias alternativas de solver:

```tcl
set verification_alternate_strategy <estrategia>
```

O valor default é:

```tcl
none
```

Isto significa fluxo padrão.

Para saber quais estratégias existem na versão instalada, usa-se:

```tcl
printvar verification_alternate_strategy_names
```

O slide alerta que os nomes, quantidades e funções podem mudar entre releases. Portanto, não é bom decorar cegamente `a1`, `s2`, `k1` etc. O importante é entender que são opções internas de estratégia de prova, usadas quando a verificação padrão não conclui compare points difíceis.

---

## Aula didática desenvolvida

### 1. O lugar do match e verify no fluxo do Formality

O fluxo estudado até aqui pode ser entendido assim:

```text
1. Ler design de referência
2. Ler design de implementação
3. Ler bibliotecas
4. Aplicar SVF/guidance
5. Configurar exceções, scan, clock-gating, black boxes, UPF etc.
6. Casar compare points: match
7. Provar equivalência: verify
8. Depurar falhas, inconclusivos e unmatched points
```

Esta aula está concentrada nos passos 6 e 7.

O Formality compara dois designs:

- **reference design**: normalmente o RTL original;
- **implementation design**: normalmente a netlist sintetizada, ou outro design transformado.

Mas ele não compara “o design inteiro de uma vez” de forma genérica. Ele divide o circuito em **cones lógicos** terminando em **compare points**. Os compare points comuns são saídas primárias, registradores, latches e entradas de black boxes.

Antes de verificar equivalência, ele precisa saber quais pontos correspondem:

```text
reference:       state_reg[3]
implementation:  state_reg_3_
```

Se esses dois pontos são o mesmo elemento lógico depois da síntese, o Formality precisa casá-los. Essa é a função do `match`.

Depois de casar:

```text
state_reg[3]  <->  state_reg_3_
```

o Formality compara o cone lógico que alimenta cada lado. Essa é a função do `verify`.

---

### 2. O que o comando match realmente faz

O comando:

```tcl
match
```

executa a etapa de matching. Porém, segundo o slide, a primeira coisa que ele faz é verificar e aplicar o SVF, se houver um SVF definido.

Isso importa porque a síntese pode transformar o design de várias formas:

```text
RTL original             Netlist sintetizada
------------------------------------------------
state[3]                 state_reg_3_
FSM one-hot              FSM binary/gray/encoded
reg_a e reg_b            register merged
registro antes da lógica registro movido por retiming
clock normal             clock-gated
```

Algumas dessas transformações são óbvias para humanos, mas não são triviais para uma ferramenta formal. O SVF comunica essas decisões da síntese ao Formality.

Então, a sequência conceitual do `match` fica:

```text
match
 ├── aplica/verifica SVF, se configurado
 ├── tenta casar pontos por nome
 ├── tenta casar pontos por signature analysis
 ├── reporta pontos não casados
 └── permite intervenção por compare rules ou manual match
```

### 3. Por que o match pode ser opcional

O slide afirma que `match` é opcional porque `verify` também executa matching.

Isso cria dois estilos de uso:

#### Estilo interativo

```tcl
match
# analisar unmatched points
# criar compare rules se necessário
verify
```

Esse estilo é melhor para estudo, debug e aprendizado, porque você vê os problemas antes da verificação.

#### Estilo de script automatizado

```tcl
verify
```

Nesse caso, o `verify` chama o matching internamente. É mais enxuto e pode reduzir runtime em scripts de regressão.

Para aprendizado e prova, a distinção importante é:

```text
match é opcional no script, mas matching é obrigatório no fluxo.
```

Mesmo se você não digitar `match`, algum matching precisa acontecer antes da equivalência ser provada.

---

### 4. Matching por nome, signature analysis e unmatched points

O primeiro mecanismo é **name matching**. Ele tenta casar pontos com nomes iguais ou muito semelhantes.

Exemplo:

```text
reference:       alu_out_reg[7]
implementation:  alu_out_reg[7]
```

Esse é fácil.

Mas depois da síntese, nomes podem mudar:

```text
reference:       i_tv80_core/u_alu/result_reg[7]
implementation:  u_alu/result_reg_7_
```

Nesse caso, o name matching pode falhar. O Formality pode então usar **signature analysis**, que tenta inferir correspondência por características estruturais/funcionais.

Se ainda sobrarem pontos não casados, eles aparecem em relatórios de unmatched points. A GUI do slide mostra exatamente esse caso. A partir daí, o usuário pode:

- criar uma **compare rule**;
- fazer **manual match** entre dois pontos;
- revisar o SVF;
- revisar leitura de hierarquia;
- revisar black boxes;
- revisar containers `$ref` e `$impl`.

---

### 5. Compare rules: quando usar

Compare rules são úteis quando nomes mudam de maneira previsível.

Exemplo do slide:

```tcl
set_compare_rule $ref \
    -from {i_tv80_core} -to {}
match
```

Esse comando remove `i_tv80_core` dos nomes do reference design durante a tentativa de match.

A ideia é parecida com uma substituição textual:

```text
i_tv80_core/u1/reg_a
```

vira:

```text
/u1/reg_a
```

Se a implementação não contém o prefixo `i_tv80_core`, a regra melhora o casamento.

Use compare rule quando:

- há prefixo/sufixo sistemático;
- uma hierarquia foi removida ou renomeada;
- vários pontos seguem o mesmo padrão;
- a GUI mostra muitos unmatched points com diferença parecida.

Evite compare rule quando:

- a mudança não é sistemática;
- você não tem certeza se os pontos são equivalentes;
- a regra pode casar pontos errados.

Uma compare rule ruim é perigosa porque pode forçar correspondências inadequadas e tornar o debug mais confuso.

---

### 6. O que o verify prova

Depois do matching, o comando:

```tcl
verify
```

executa algoritmos formais nos compare points casados.

Para cada par:

```text
reference compare point       implementation compare point
state_reg[3]           <-->   state_reg_3_
```

o Formality compara os cones lógicos que alimentam esses pontos.

Se a função for igual:

```text
passed
```

Se a função for diferente:

```text
failed
```

Nesse caso, o Formality pode gerar um **counterexample**.

Um counterexample é uma condição que demonstra a diferença. Por exemplo:

```text
a = 1
b = 0
opcode = ADD
reset = 0

reference output = 1
implementation output = 0
```

Isso prova que, para aquela condição, os designs não são equivalentes naquele ponto.

---

### 7. Diferença entre failed, inconclusive e not run

Essa distinção é uma das partes mais importantes da aula.

#### Succeeded

Significa que a equivalência foi provada.

```text
Implementation is equivalent to reference.
```

#### Failed

Significa que o Formality encontrou diferença ou que o setup está errado.

```text
Implementation is not equivalent to reference.
```

Mas atenção: pode ser erro real ou problema de setup.

Possíveis causas:

- bug de síntese;
- RTL e netlist realmente diferentes;
- scan enable não travado;
- clock-gating sem configuração;
- SVF não carregado;
- black box mal casada;
- UPF incorreto;
- reset/test mode em estado errado.

#### Inconclusive

Significa que nenhum ponto falhou, mas a prova não terminou.

Causas comuns:

- timeout;
- complexidade muito alta;
- effort baixo;
- compare point muito difícil;
- solver padrão insuficiente.

#### Not run

Significa que a verificação nem executou.

Causas comuns:

- erro no read;
- erro no link;
- top não definido;
- match insuficiente;
- problema anterior impediu a verificação.

---

### 8. Verificação incremental

O Formality não precisa jogar tudo fora quando uma verificação é interrompida. Ele pode continuar de onde parou.

Fluxo típico:

```tcl
match
verify
# alguns pontos falham ou ficam unmatched
# usuário ajusta setup
set_compare_rule ...
match
verify
```

Se quiser forçar tudo de novo:

```tcl
verify -restart
```

Isso é útil quando houve grande mudança de setup e resultados anteriores podem não ser mais confiáveis.

---

### 9. Controle de runtime

Em designs reais, verificação formal pode ser cara. Por isso, a aula apresenta três controles.

#### Timeout global

```tcl
set verification_timeout_limit hrs:min:sec
```

Exemplo:

```tcl
set verification_timeout_limit 2:0:0
```

Para após 2 horas.

#### Limite de pontos falhando

```tcl
set verification_failing_point_limit 10
```

Para quando 10 compare points falharem.

Isso é muito útil para detectar erro de setup cedo. Se 500 pontos estão falhando, provavelmente não vale esperar tudo terminar antes de investigar.

#### Nível de esforço

```tcl
set verification_effort_level high
```

Valores:

```text
super_low | low | medium | high
```

O default é `high`, segundo o slide.

Uma estratégia prática:

```text
Debug inicial: super_low ou low
Verificação séria: medium ou high
Signoff: high e estratégias extras se necessário
```

---

### 10. Verificação hierárquica

A verificação hierárquica tenta quebrar o problema grande em subproblemas.

Comando principal citado:

```tcl
write_hierarchical_verification_script
```

Exemplo mostrado:

```tcl
set_top i:/WORK/top
set_constant $impl/test_se 0
write_hier -replace -level 3 myhierscript
source myhierscript.tcl
quit
```

A ideia é gerar um script que verifica sub-blocos automaticamente.

Isso ajuda quando:

- o design top-level é muito grande;
- um subdesign falha e precisa de sessão própria;
- o usuário quer isolar a origem da falha;
- o verify top-level fica inconclusive.

---

### 11. Multicore e medição correta de tempo

Para usar múltiplos cores:

```tcl
set_host_options -max_cores 4
```

Para reportar:

```tcl
report_host_options
```

Para medir tempo real:

```tcl
elapsed_time
```

O slide alerta para não usar `cputime` como métrica principal em multicore, porque ele soma o tempo de CPU dos processos filhos. Em ambiente paralelo, isso pode parecer pior do que realmente foi.

Exemplo:

```text
4 cores trabalhando por 60 segundos
wall clock: 60 segundos
CPU time somado: ~240 segundos
```

Por isso, para medir a duração percebida pelo usuário, use `elapsed_time`.

---

### 12. Estratégias alternativas para compare points difíceis

Quando o solver padrão não resolve, o Formality pode usar estratégias alternativas:

```tcl
set verification_alternate_strategy <estrategia>
```

O default é:

```tcl
none
```

Para consultar estratégias disponíveis:

```tcl
printvar verification_alternate_strategy_names
```

Como o slide alerta, a lista muda conforme release. Então o foco de prova não deve ser decorar nomes específicos, e sim entender o conceito:

```text
Estratégias alternativas ativam fluxos de solver diferentes para tentar resolver compare points difíceis.
```

---

## Conceitos difíceis explicados em profundidade

### Compare point

Um compare point é um ponto observável/comparável onde o Formality verifica equivalência entre referência e implementação.

Exemplos:

- saída primária;
- registrador;
- latch;
- entrada de black box.

O Formality não precisa comparar cada fio interno arbitrário. Ele compara os pontos que definem o comportamento sequencial e observável do design.

---

### Logic cone

Um logic cone é o bloco de lógica que alimenta um compare point.

Exemplo:

```text
a, b, opcode ──> lógica combinacional ──> result_reg[0]
```

O cone lógico é tudo que influencia `result_reg[0]`.

Quando o Formality verifica um compare point, ele verifica se o cone lógico de referência é equivalente ao cone lógico da implementação.

---

### Match

`match` é a etapa de associação entre compare points.

Exemplo:

```text
reference:       r:/WORK/alu/state[2]
implementation:  i:/WORK/alu_0/state_2_
```

O Formality precisa entender que esses dois pontos correspondem.

Sem match, não há par para verificar.

---

### Verify

`verify` é a etapa de prova formal.

Ele responde:

```text
Para todos os valores possíveis de entrada/estado válidos,
o cone de referência e o cone de implementação produzem o mesmo resultado?
```

Se sim, passa. Se não, falha com counterexample. Se não consegue concluir, fica inconclusive.

---

### Counterexample

Um counterexample é um exemplo concreto que viola equivalência.

Ele mostra uma condição em que:

```text
reference != implementation
```

Isso é muito mais forte que uma suspeita: é uma evidência formal de diferença ou de setup errado.

---

### Inconclusive

`Inconclusive` não é falha, mas também não é sucesso.

É quando o Formality não encontrou diferença, porém não conseguiu provar equivalência. Pode ocorrer por limite de tempo, complexidade, effort baixo ou necessidade de estratégia alternativa.

---

### Compare rule

Compare rule é uma regra de tradução de nomes. Ela é útil quando nomes mudam de forma previsível.

Exemplo:

```tcl
set_compare_rule $ref \
    -from {i_tv80_core} -to {}
```

Essa regra remove `i_tv80_core` do lado de referência para melhorar o casamento de nomes.

---

### Signature analysis

Signature analysis é uma técnica de matching que tenta casar pontos não apenas por nome, mas por características estruturais/funcionais. Ela ajuda quando os nomes mudaram, mas não substitui um bom SVF.

---

### Verification effort level

Controla quanto esforço o solver usa em cada compare point.

```tcl
set verification_effort_level high
```

Valores:

```text
super_low | low | medium | high
```

O tradeoff é:

```text
menos esforço = mais rápido, mas mais inconclusive/aborted
mais esforço = mais demorado, mas maior chance de prova
```

---

### Hierarchical verification

É uma técnica para dividir a verificação por hierarquia. Útil para designs grandes e debug localizado.

Ela transforma:

```text
verificar top inteiro
```

em algo como:

```text
verificar bloco A
verificar bloco B
verificar bloco C
depois integrar resultados
```

---

### Multicore

Permite usar múltiplos cores para acelerar a verificação.

Comando:

```tcl
set_host_options -max_cores num_cores
```

Medida correta:

```tcl
elapsed_time
```

Evitar para métrica principal:

```tcl
cputime
```

---

### Alternate verification strategy

Permite trocar o fluxo interno de solver para compare points difíceis.

Comando:

```tcl
set verification_alternate_strategy <estrategia>
```

Consultar disponíveis:

```tcl
printvar verification_alternate_strategy_names
```

---

## Figuras, diagramas e telas importantes

### Figura da GUI Unmatched Point Report

A figura mostra a etapa de match na GUI do Formality. Ela apresenta listas de pontos não casados no lado de referência e no lado de implementação.

A análise visual importante é:

- a GUI não apenas informa falha; ela ajuda a resolver o problema;
- o usuário pode criar compare rules;
- o usuário pode selecionar manualmente dois pontos e fazer match;
- a aba de unmatched points é uma ferramenta de debug antes do verify.

Essa figura deve ser estudada como representação prática da pergunta:

```text
O que faço quando o Formality não consegue casar compare points automaticamente?
```

Resposta:

```text
Uso SVF, compare rules ou user match/manual match.
```

---

### Figura/slide de Compare Rules

O slide não tem diagrama complexo, mas o bloco de comando é importante porque mostra a forma prática de traduzir nomes:

```tcl
set_compare_rule $ref \
    -from {i_tv80_core} -to {}
```

A figura conceitual é uma transformação de string aplicada aos nomes antes do matching.

---

### Slides de runtime

Os slides de runtime são importantes porque mostram que Formality é uma ferramenta formal, mas também operacional. Em design real, o usuário precisa evitar verificações infinitas ou longas demais.

Os comandos de runtime funcionam como “freios”:

```tcl
set verification_timeout_limit
set verification_failing_point_limit
set verification_effort_level
```

Eles ajudam a transformar a verificação formal em um fluxo gerenciável.

---

### Slides de multicore

Os slides de multicore indicam que o Formality pode usar paralelismo. A figura textual mais importante é a distinção entre:

```text
elapsed_time = tempo real de parede
cputime      = soma de CPU dos processos
```

Para medir ganho real com paralelismo, `elapsed_time` é o comando correto.

---

## Pontos de prova e revisão

1. **`match` é opcional, mas matching não é opcional.**  
   O comando `verify` também executa matching.

2. **Em uso interativo, recomenda-se rodar `match` para obter feedback.**  
   Em scripts, pode-se omitir `match` para reduzir runtime.

3. **A primeira coisa que `match` faz é aplicar/verificar o guidance do SVF, se configurado.**

4. **Aplicar SVF ocorre apenas uma vez.**  
   Se `match` ou `preverify` já aplicou o SVF, um novo `match` não reaplica.

5. **Name matching vem antes de signature analysis.**

6. **Unmatched points podem ser resolvidos com compare rules ou manual match.**

7. **Compare rules são úteis quando nomes mudam de forma previsível.**

8. **`verify` usa vários solvers para provar equivalência ou não equivalência.**

9. **Resultados possíveis do verify:**
   - `Succeeded`
   - `Failed`
   - `Inconclusive`
   - `Not run`

10. **`Failed` pode ser diferença real ou problema de setup.**

11. **`Inconclusive` não é sucesso.**  
    Apenas indica que a análise não foi completada.

12. **Counterexample mostra uma condição que produz respostas diferentes entre reference e implementation.**

13. **Constant registers não são verificados.**

14. **Unread compare points não são verificados por default.**

15. **`verify -restart` força verificação completa novamente.**

16. **`set_dont_verify` exclui pontos da verificação, mas deve ser usado com cuidado.**

17. **`verification_timeout_limit` controla o tempo máximo de verificação.**

18. **`verification_failing_point_limit` interrompe a verificação após certo número de falhas.**

19. **`verification_effort_level` controla esforço do solver por compare point.**

20. **`super_low` pode encontrar falhas rapidamente, mas tende a gerar pontos abortados/inconclusivos.**

21. **Verificação hierárquica ajuda em designs grandes e difíceis.**

22. **`set_host_options -max_cores` configura uso de múltiplos cores.**

23. **Para medir tempo com multicore, use `elapsed_time`, não `cputime`.**

24. **Estratégias alternativas de verificação são usadas para compare points difíceis.**

---

## Relação com projeto/laboratório

Este bloco é diretamente aplicável a qualquer lab ou projeto que use Formality para comparar RTL e netlist sintetizada.

Um fluxo mínimo de script poderia ter esta forma conceitual:

```tcl
# Guidance
set_svf default.svf

# Reference
read_verilog -r alu.v
set_top r:/WORK/alu

# Implementation
read_db -i class.db
read_verilog -i alu.vg
set_top i:/WORK/alu_0

# Setup adicional, se necessário
set synopsys_auto_setup true
set_constant $impl/test_se 0

# Match e verify
match
verify
```

Em debug real, se o resultado falhar:

```text
1. Verificar se o SVF foi carregado.
2. Verificar unmatched points.
3. Criar compare rules se os nomes mudaram.
4. Travar sinais de scan/test mode.
5. Revisar clock-gating e black boxes.
6. Rodar verify novamente.
7. Se necessário, ajustar runtime, effort ou estratégia alternativa.
8. Usar verificação hierárquica para isolar blocos difíceis.
```

Essa aula também ajuda a entender logs de Formality. Mensagens sobre unmatched compare points, inconclusive points, failing points, timeout e effort level estão diretamente ligadas aos conceitos do bloco.

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

- **Bloco:** 056
- **Aula:** 06 Debugging — parte A
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\06 Debugging.docx`
- **Processar somente slides:** 1-17
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\06 Debugging_parte_A.md`
