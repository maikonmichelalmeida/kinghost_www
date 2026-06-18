# 06 Debugging — parte A

## Controle do bloco
- **Bloco:** 056
- **Curso:** 08 Formality Jumpstart
- **Aula:** 06 Debugging — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\06 Debugging.docx`
- **Faixa de slides:** 1-17
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\06 Debugging_parte_A.md`
- **Próximo bloco recomendado:** Bloco 057 — `06 Debugging - parte B`

## Resumo executivo

Esta parte da aula entra no ponto em que o Formality deixa de ser apenas um fluxo “read → setup → match → verify” e passa a ser uma ferramenta de investigação. O foco é entender como depurar uma verificação que falhou, ficou inconclusiva, abortou por complexidade ou sequer chegou a rodar corretamente por erro de setup.

A ideia principal é: antes de assumir que há erro funcional real entre RTL e netlist, é preciso investigar sinais de setup incorreto. Muitos “failures” em Formality são falsos negativos causados por biblioteca lida tarde demais, top-level errado, scan não desabilitado, SVF rejeitado, guidance ausente, black boxes mal resolvidas, compare points não casados ou entradas de teste não restringidas.

A aula apresenta um roteiro prático de debug: olhar o transcript, verificar mensagens importantes, resolver black boxes e problemas de design, confirmar se o fluxo com SVF está sendo usado, considerar `synopsys_auto_setup`, checar guidance rejeitado, analisar pontos não casados, escolher pontos para depurar, abrir Pattern Viewer, abrir Logic Cone Viewer e isolar a diferença real entre os cones de lógica.

Nesta parte A, os slides dão muita ênfase aos comandos e ferramentas de debug do Formality: `analyze_points`, `report_analysis_results`, Pattern Viewer, Logic Cone Viewer, análise de failing patterns, identificação de entradas não restringidas e comparação visual dos cones de referência e implementação.

---

## Texto extraído e organizado por slide

### Slide 1 — Example of Typical Formality Script

Texto/código extraído:

```tcl
set search_path ". ./rtl ./lib ./netlist"
set synopsys_auto_setup true
set hdlin_dwroot /tools/syn/E-2010.12

set_svf default.svf

read_verilog -r "fifo.v gray_counter.v \
                 pop_ctrl.v push_ctrl.v rs_flop.v"
set_top fifo

read_db -i tcb013ghpwc.db
read_verilog -i fifo.vg
set_top fifo

# set_constant $impl/test_se 0

verify
```

Notas do slide:

- O script mostra um fluxo típico de Formality.
- Primeiro são definidos caminhos e variáveis de setup.
- Depois o SVF é carregado com `set_svf`.
- Em seguida o design de referência é lido com `read_verilog -r`.
- O top-level da referência é definido com `set_top fifo`.
- Depois a biblioteca tecnológica e a implementação são lidas no container de implementação com `-i`.
- O top-level da implementação também é definido.
- Há uma linha comentada para desabilitar scan: `set_constant $impl/test_se 0`.
- Por fim roda-se `verify`.

Comentário técnico:

Esse script é importante porque resume a ordem saudável de um fluxo Formality: primeiro setup e guidance, depois referência, depois implementação com biblioteca, depois restrições necessárias, depois verificação.

---

### Slide 2 — Debugging: Problem 1

Texto/código extraído:

```tcl
read_verilog -r alu.v
set_top alu

read_verilog -i alu.fast.vg
set_top alu
read_db -i class.db

verify
```

Problema a encontrar:

O comando `read_db -i class.db` aparece **depois** do `set_top` da implementação. Isso é perigoso porque uma netlist pós-síntese normalmente contém células mapeadas para uma biblioteca tecnológica. Se a biblioteca ainda não foi lida no container de implementação, o Formality pode não conseguir resolver as referências das células no momento do link/elaboration.

Forma correta, em princípio:

```tcl
read_verilog -r alu.v
set_top alu

read_db -i class.db
read_verilog -i alu.fast.vg
set_top alu

verify
```

Ou, se o módulo top da implementação tiver outro nome, usar o nome correto:

```tcl
set_top i:/WORK/alu_0
```

Lição do slide:

Antes de `set_top`, carregue todos os arquivos necessários para aquele container: design, submódulos e bibliotecas. O `set_top` não é só “escolher o módulo top”; ele também elabora/linka o design. Se faltam células ou módulos, o problema aparece nessa fase.

---

### Slide 3 — Debugging: Problem 2

Texto/código extraído:

```tcl
read_verilog -r alu.v

read_db -i class.db
read_verilog -i alu.fast.vg

set_top r:/WORK/alu
set_top i:/WORK/alu

verify
```

Problema provável no contexto da aula:

O script força o top-level da implementação para `i:/WORK/alu`. Pelo histórico dos exemplos anteriores do curso, uma implementação sintetizada pode aparecer com nome diferente do RTL, por exemplo `alu_0`, `alu_fast` ou algum nome alterado pela síntese. Se o top real da implementação não for `alu`, esse `set_top i:/WORK/alu` aponta para o design errado ou para um design inexistente.

Forma mais segura de depurar:

```tcl
report_designs
```

ou usar o transcript para ver quais designs foram lidos no container `i:`.

Se o top correto for `alu_0`, o setup deveria ser algo como:

```tcl
set_top r:/WORK/alu
set_top i:/WORK/alu_0
```

Outra suspeita didática importante:

Mesmo que o top esteja certo, esse script não carrega `set_svf default.svf` nem ativa `set synopsys_auto_setup true`. Para designs sintetizados com transformações, essa ausência pode dificultar matching e verificação.

Lição do slide:

No debug, não olhe só para a sintaxe. Verifique se os objetos existem, se o top-level escolhido é realmente o top de cada container e se o SVF/guidance necessário foi aplicado.

---

### Slide 4 — Debugging Flow

Texto extraído:

- Step 1: Look at the transcript for clues
- Step 2: Use debugging tools and commands
- Step 3: Identify and resolve problem areas
- Step 4: Try the verification again
- Step 5: Ask for help

Tradução didática:

1. Olhe o transcript/log antes de mexer no design.
2. Use as ferramentas e comandos de debug.
3. Identifique áreas problemáticas.
4. Corrija setup ou design e rode a verificação de novo.
5. Se o problema continuar, peça ajuda com evidências: transcript, comandos, failing points, mensagens e scripts.

Comentário:

Esse fluxo é importante porque evita o erro comum de “sair tentando comandos aleatórios”. O Formality deixa pistas muito valiosas no transcript. Warnings de black box, unresolved references, SVF rejected operations e unmatched compare points frequentemente indicam exatamente onde está o problema.

---

### Slide 5 — Debugging Flow Chart

Texto e estrutura extraídos do fluxograma:

Fluxo principal:

1. **Start**
2. **Review the transcript for important messages**
3. **Resolve black boxes and design issues**
4. Pergunta: **SVF flow being used?**
   - Se **não**, considerar:
     - **Consider using `synopsys_auto_setup`**
   - Se **sim**, seguir para:
     - **Check for rejected SVF operations**
5. **Check setup**
6. **Run Analyze**
7. Pergunta: **Problem identified?**
   - Se **sim**, corrigir e finalizar/tentar novamente.
   - Se **não**, perguntar:
     - **Unexplained unmatched points?**
       - Se **sim**, voltar para checagem de SVF/setup/análise.
       - Se **não**, seguir para debug de ponto específico.
8. **Choose point to debug**
9. **Display pattern window**
10. **Display logic cone**
11. **Isolate difference**
12. **Finish**

Análise da figura:

O fluxograma divide o debug em duas fases. A primeira é macro: transcript, black boxes, SVF, setup e análise automática. A segunda é micro: escolher um compare point, abrir padrões, abrir cone lógico e isolar a diferença. Isso reflete bem a prática real: primeiro eliminar problemas globais de ambiente; só depois investigar uma falha lógica específica.

---

### Slide 6 — Steps of Debugging

Texto extraído:

- Check for Warning Signs
  - Check for simulation or synthesis mismatch errors
  - Check RTL interpretation messages in transcript
  - Were `full_case` and `parallel_case` pragmas interpreted?
  - Check for black-box warnings in the transcript
- Check for rejected SVF guidance commands
- Check for unmatched compare points
  - Unmatched compare points only in implementation?
  - Clock-gating latches?
- Is there a setup problem? Did you disable scan?
- Try using Auto Setup Mode
  - `set synopsys_auto_setup true`

Comentário didático:

O slide reforça que a maioria dos primeiros passos não é “abrir esquema” nem “procurar erro na lógica”. Primeiro se procuram sinais de setup inconsistente.

Pontos importantes:

- **Simulation or synthesis mismatch errors:** podem indicar que RTL e netlist não representam a mesma intenção.
- **RTL interpretation messages:** mostram como o Formality entendeu o RTL; se ele interpreta diferente do Design Compiler, pode haver falsa falha.
- **`full_case` e `parallel_case`:** pragmas que podem mudar a interpretação de casos incompletos ou mutuamente exclusivos.
- **Black-box warnings:** indicam módulos sem lógica interna; precisam estar equivalentes nos dois lados.
- **Rejected SVF guidance:** se o Formality rejeitou alguma informação do SVF, ele pode perder instruções importantes da síntese.
- **Unmatched compare points:** se há muitos pontos só na implementação, pode ser scan, clock gating, retiming, buffers ou transformações sem guidance.
- **Scan:** se `test_se` ou sinal equivalente não for desabilitado, o Formality pode comparar o modo de teste em vez do modo funcional.
- **Auto Setup Mode:** ajuda a alinhar o comportamento do Formality com as suposições feitas no Design Compiler.

---

### Slide 7 — Debugging Tools: `analyze_points`

Texto extraído:

- Provides debugging guidance for failing or hard to verify compare points.
- Command:
  - `analyze_points`
- Options for failing verifications:
  - `-failing`
  - `-all`
- Options for hard verifications:
  - `-aborted`
  - `-unverified`
  - `-no_operator_svp`
  - `-all`
- Takes a single or list of compare points as an argument.
- Report command:
  - `report_analysis_results`
  - option: `-summary`
- Variable:
  - `verification_run_analyze_points`
  - Default value is `false`
  - When enabled, runs `analyze_points -all`
- For hard-to-verify compare points, the `analyze_points` command looks at datapath-specific SVF operations involved with logic cone inputs.
- Produces Design Compiler Tcl script command:
  - `set_verification_priority`
  - Targets specific blocks, instances, or arithmetic operators.
  - Turns off specific optimizations.
  - Improves verification success.

Comandos organizados:

```tcl
analyze_points -failing
analyze_points -all
analyze_points -aborted
analyze_points -unverified
analyze_points -no_operator_svp
report_analysis_results -summary
set verification_run_analyze_points true
```

Comentário:

`analyze_points` é uma ferramenta de diagnóstico. Ela não corrige automaticamente tudo; ela aponta suspeitas e recomenda comandos. Seu papel é transformar uma falha genérica em uma hipótese concreta: “há entrada de implementação não restringida”, “há guidance rejeitado”, “há datapath difícil”, “há scan ativo”, “há ponto não casado”, etc.

---

### Slide 8 — `analyze_points`: Guidance for Failing Verifications

Texto/código extraído parcialmente:

```tcl
fm_shell (verify)> analyze_points -failing
```

Resultado descrito no slide:

```text
Analysis Results
Found 1 Unconstrained Implementation Input

Unmatched input ports in the implementation typically result
from test logic insertion. Constraining the unmatched ports
to a constant value may correct the failures.
```

O relatório aponta um sinal parecido com:

```text
i:/WORK/aes_cipher_top/test_se
```

e mostra que ele afeta implementation cones de múltiplos compare points.

Recomendação do relatório:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

Interpretação:

O Formality identificou que existe uma entrada da implementação sem correspondente funcional na referência. Isso é típico de lógica de teste, especialmente scan enable. Se `test_se` fica livre, o solver pode escolher `test_se = 1` em algum padrão, colocando a netlist em modo de scan. Como o RTL de referência geralmente representa o modo funcional, a comparação falha.

O comando recomendado força o sinal de scan para o estado inativo:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

---

### Slide 9 — `analyze_points`: Guidance for Hard Verifications

Texto/código extraído parcialmente:

```text
Analysis Results
Found 1 Hard Datapath Component Module

These modules contain arithmetic operators that may be contributing
to hard verifications. Lowering the Design Compiler optimization level
for these modules may permit verification to succeed.
```

O slide mostra um exemplo de módulo com datapath difícil:

```text
Module with datapath cell(s):
i:/WORK/top/DP_OP_23J1_125_5602
```

Comando sugerido para o script do Design Compiler, antes do primeiro `compile_ultra`:

```tcl
current_design top
set_verification_priority [get_cells { add_28 mult_28 sub_28 }]
```

Interpretação:

Algumas transformações de datapath, especialmente em multiplicadores, divisores, somadores complexos e operadores aritméticos reestruturados, podem ser funcionalmente corretas, mas difíceis de provar para o Formality. O `analyze_points` pode recomendar ajustes no Design Compiler para preservar uma estrutura mais amigável à verificação formal.

Esse é um ponto muito importante: às vezes a solução do problema de Formality não está no script do Formality, mas no modo como a síntese otimizou o design. O comando `set_verification_priority` é uma forma de orientar o Design Compiler a priorizar verificabilidade formal em certos blocos ou operadores.

---

### Slide 10 — `analyze_points` na GUI

Texto/figura extraídos:

A tela da GUI mostra a aba de debug do Formality, com listas de pontos:

- Failing Points
- Passing Points
- Aborted Points
- Unverified Points
- Probe Points
- Analyses

Na parte inferior aparecem botões como:

- **Analyze**
- **Analyze Selected Points**

Análise da figura:

A GUI permite escolher pontos específicos de falha e rodar a análise apenas neles. Isso é útil quando o design possui muitas falhas e o usuário quer começar por um conjunto pequeno e representativo.

Uso típico:

1. Abrir a aba **Debug**.
2. Selecionar um ou mais failing points.
3. Clicar em **Analyze** ou **Analyze Selected Points**.
4. Ler as recomendações na aba de análise.

---

### Slide 11 — `analyze_points` na GUI: causas prováveis

Texto visível na figura:

Na lista de causas possíveis aparecem categorias como:

- **Unconstrained Implementation Input**
- **Rejected Guidance Type**
- **Unseen Reference Special Cell**
- **Unreviewed DesignWare Component**
- **Missing Reference Register**
- **Modules With Rejected Datapath Guidance**
- **Modules With Datapath Components**

No painel de descrição, a GUI explica o problema de entrada não restringida na implementação e recomenda algo como:

```tcl
set_constant i:/WORK/.../test_se 0
```

Interpretação:

A GUI transforma o resultado textual de `analyze_points` em uma investigação navegável. Ela agrupa causas prováveis e aponta comandos de correção. Para prova e uso prático, vale memorizar que **Unconstrained Implementation Input** é fortemente associado a sinal de teste/scan não fixado.

---

### Slide 12 — Debugging Tools: Pattern Viewer

Texto extraído:

- Formality automatically creates sets of vectors to illustrate failures at the compare point.
  - These counter-examples are failing patterns.
  - Failing patterns are applied on the inputs of each logic cone.
  - Proof of non-equivalence performed mathematically.
  - No failing patterns exist for passing or hard-to-verify compare points.
- Viewing the logic cone inputs and failing patterns are extremely helpful in debugging.

Comentário:

O Pattern Viewer mostra padrões de entrada que fazem referência e implementação produzirem respostas diferentes em um compare point. Esses padrões são chamados de **counter-examples** ou **failing patterns**.

Diferença importante:

- Em simulação, você escreve vetores e observa resposta.
- No Formality, o solver encontra matematicamente um vetor que prova a diferença.
- Esse vetor é apresentado ao usuário para facilitar debug.

Se um ponto passou, não há failing pattern. Se o ponto é hard-to-verify, também pode não haver failing pattern, porque o Formality não provou nem equivalência nem diferença.

---

### Slide 13 — Abrindo o Pattern Viewer na GUI

Texto/figura extraídos:

A figura mostra um menu contextual na GUI com opções como:

- Show Logic Cones
- Show Selected Cone Sizes
- Show All Cone Sizes
- Show Patterns
- Show Matching Tool
- View Reference Object
- View Implementation Object
- View Reference Source
- View Implementation Source
- Set Don’t Verify
- Analyze
- Analyze Selected
- Diagnose
- Diagnose Selected Points
- Copy

Comentário:

O caminho visual é: selecionar um ponto problemático, abrir o menu contextual e escolher **Show Patterns**. Isso abre os padrões que demonstram a falha.

Essa tela reforça que o debug no Formality é orientado por compare points. Primeiro escolhe-se o ponto; depois se abre padrão, cone, fonte, matching ou diagnóstico.

---

### Slide 14 — Pattern Viewer: identificação rápida de problema de setup

Texto extraído parcialmente:

- Allows quick identification of issues with setup and matching.
- For this example, note failure when scan enable `test_se` has `1` value.
- Try using `set_constant $impl/test_se 0` to get a successful verification.

Comando sugerido:

```tcl
set_constant $impl/test_se 0
```

Análise da figura:

O Pattern Viewer exibe valores de sinais de referência e implementação em diferentes vetores. No exemplo, a falha aparece quando `test_se = 1`. Isso revela que a implementação está sendo analisada em modo de teste, não em modo funcional.

Lição:

Quando um pattern mostra um sinal de teste ativo, o problema pode não ser a lógica funcional. Pode ser ausência de restrição de setup. Fixar `test_se` em `0` alinha a implementação com o comportamento funcional esperado.

---

### Slide 15 — Pattern Viewer com valores anotados no cone lógico

Texto/figura extraídos:

A figura destaca:

- **Failing Compare Point values annotated**
- **Vector Annotated in Schematic (logic cone view)**

Interpretação:

O Formality permite correlacionar o vetor de falha com a visualização esquemática do cone lógico. Isso significa que o valor do pattern não fica apenas em uma tabela; ele aparece anotado nos fios, portas e registradores do cone.

Uso prático:

1. Escolha o failing pattern.
2. Abra o Logic Cone Viewer.
3. Anote os valores nos cones.
4. Siga o caminho onde referência e implementação divergem.
5. Isole a primeira diferença significativa.

Esse recurso é muito útil porque transforma uma falha abstrata em uma trilha visual dentro da lógica.

---

### Slide 16 — Debugging Tools: Logic Cone Viewer

Texto/figura extraídos:

A imagem mostra dois cones lógicos em paralelo:

- parte superior: cone da referência;
- parte inferior: cone da implementação.

A visualização mostra portas, inversores, registradores e conexões, permitindo comparar a lógica que alimenta o compare point.

Comentário:

O Logic Cone Viewer é uma das ferramentas centrais do debug visual. Ele permite comparar a estrutura do cone de referência e do cone de implementação. Mesmo quando a implementação foi otimizada, o visual pode mostrar onde uma inversão, mux, latch de clock gating, scan cell ou lógica extra alterou a forma do cone.

O objetivo não é apenas ver “que são diferentes”, porque netlists pós-síntese quase sempre são estruturalmente diferentes do RTL. O objetivo é localizar a diferença funcional relevante.

---

### Slide 17 — Logic Cone Viewer: remoção de valores iguais

Texto/figura extraídos:

A figura mostra um comando na barra da GUI associado a remover/filtrar valores iguais nos cones de entrada do compare point. A ideia visual é esconder ou reduzir partes que se comportam igual para todos os patterns, deixando mais clara a região divergente.

Interpretação:

Quando um cone lógico é grande, comparar tudo visualmente é impraticável. A ferramenta ajuda a “podar” ou esconder regiões que não contribuem para a diferença observada. Assim, o usuário foca no caminho onde os valores divergem.

Essa estratégia é essencial em debug formal: reduzir o problema até a primeira diferença relevante.

---

## Aula didática desenvolvida

### 1. O que significa “debugar” no Formality

Debug em Formality não é igual a debug de simulação. Em simulação, você normalmente tem uma waveform, um tempo específico, uma sequência de estímulos e observa quando o sinal ficou errado. Em Formality, a comparação é matemática e estrutural: o objetivo é provar que cada par de compare points da referência e da implementação tem a mesma função lógica para todos os estados/entradas permitidos.

Por isso, quando a verificação falha, você precisa responder uma pergunta central:

> A implementação é realmente diferente da referência ou o ambiente de equivalência foi montado errado?

Essa pergunta aparece o tempo todo nos slides. O curso mostra que muitos problemas de Formality vêm de setup incompleto: biblioteca lida depois do link, top-level errado, scan enable livre, SVF ausente, SVF rejeitado, black boxes diferentes, entradas de teste sem constante, clock-gating não tratado, guidance de datapath rejeitado, etc.

A postura correta é seguir uma ordem:

1. Conferir transcript.
2. Resolver problemas globais de leitura/link/setup.
3. Conferir SVF e `synopsys_auto_setup`.
4. Rodar `match`/`verify`.
5. Se falhar, usar `analyze_points`.
6. Abrir Pattern Viewer.
7. Abrir Logic Cone Viewer.
8. Isolar a diferença.
9. Corrigir setup ou design.
10. Rodar novamente.

---

### 2. O script típico e por que cada linha existe

O slide 1 traz o script-base:

```tcl
set search_path ". ./rtl ./lib ./netlist"
set synopsys_auto_setup true
set hdlin_dwroot /tools/syn/E-2010.12

set_svf default.svf

read_verilog -r "fifo.v gray_counter.v \
                 pop_ctrl.v push_ctrl.v rs_flop.v"
set_top fifo

read_db -i tcb013ghpwc.db
read_verilog -i fifo.vg
set_top fifo

# set_constant $impl/test_se 0

verify
```

Linha por linha:

```tcl
set search_path ". ./rtl ./lib ./netlist"
```

Define onde o Formality deve procurar arquivos. Isso facilita comandos que usam nomes relativos.

```tcl
set synopsys_auto_setup true
```

Ativa o Auto Setup Mode. Essa variável faz o Formality adotar várias suposições compatíveis com o Design Compiler, reduzindo falsos failures.

```tcl
set hdlin_dwroot /tools/syn/E-2010.12
```

Aponta para a raiz do DesignWare. Isso é importante quando o design usa componentes DesignWare instanciados ou inferidos.

```tcl
set_svf default.svf
```

Carrega o SVF. O SVF contém informações de guidance geradas pelo Design Compiler: renomeações, otimizações de registradores, FSM re-encoding, datapath transformations, retiming, inversões de fase, etc.

```tcl
read_verilog -r "fifo.v gray_counter.v \
                 pop_ctrl.v push_ctrl.v rs_flop.v"
```

Lê o design de referência no container `r:`. Normalmente é o RTL.

```tcl
set_top fifo
```

Define e elabora o top-level da referência.

```tcl
read_db -i tcb013ghpwc.db
read_verilog -i fifo.vg
set_top fifo
```

Lê a biblioteca tecnológica e a netlist da implementação no container `i:`, depois define o top-level da implementação.

```tcl
# set_constant $impl/test_se 0
```

Linha comentada, mas muito importante. Se a implementação contém scan, `test_se` deve ser forçado para o modo funcional. Se ficar livre, o solver pode entrar no modo de teste e gerar falhas falsas.

```tcl
verify
```

Roda a verificação de equivalência.

---

### 3. Problema 1: biblioteca lida tarde demais

O primeiro exercício de debug mostra:

```tcl
read_verilog -r alu.v
set_top alu

read_verilog -i alu.fast.vg
set_top alu
read_db -i class.db

verify
```

O erro mais provável é a ordem:

```tcl
set_top alu
read_db -i class.db
```

A biblioteca `class.db` é lida depois do `set_top` da implementação. Mas `set_top` elabora o design. Se `alu.fast.vg` contém instâncias de células como `AND2X1`, `DFFQX1`, `INVX1`, etc., o Formality precisa conhecer essas células no momento do link.

A correção é ler a biblioteca antes do `set_top` da implementação:

```tcl
read_verilog -r alu.v
set_top alu

read_db -i class.db
read_verilog -i alu.fast.vg
set_top alu

verify
```

Regra prática:

> Tudo que o container precisa para ser elaborado deve estar lido antes do `set_top`.

---

### 4. Problema 2: top-level e objetos precisam existir exatamente

O segundo exercício mostra:

```tcl
read_verilog -r alu.v

read_db -i class.db
read_verilog -i alu.fast.vg

set_top r:/WORK/alu
set_top i:/WORK/alu

verify
```

Aqui, a ordem da biblioteca está melhor, mas há uma suspeita forte: o top da implementação pode não ser `i:/WORK/alu`. Em aulas anteriores, a implementação muitas vezes aparece como `alu_0`, enquanto a referência é `alu`.

A forma correta é confirmar os designs lidos:

```tcl
report_designs
```

e então apontar para o top certo:

```tcl
set_top r:/WORK/alu
set_top i:/WORK/alu_0
```

A lição é simples: não basta “parecer” que o nome está certo. Em Formality, o caminho completo importa:

```text
container/library/design
```

Exemplo:

```text
r:/WORK/alu
i:/WORK/alu_0
```

---

### 5. O transcript é o primeiro instrumento de debug

O slide do fluxo de debug começa pelo transcript. Isso não é detalhe. O transcript mostra:

- arquivos que foram lidos;
- containers usados;
- designs encontrados;
- warnings de black boxes;
- erros de unresolved reference;
- mensagens de SVF aceitas ou rejeitadas;
- problemas de RTL interpretation;
- pontos não casados;
- motivos de abort/inconclusive;
- recomendações de análise.

Um erro comum é ignorar o transcript e abrir direto o cone lógico. Isso pode desperdiçar muito tempo. Se a biblioteca nem foi carregada, se o top está errado ou se o SVF foi rejeitado, a falha visual no cone será consequência de um setup ruim.

---

### 6. Unmatched points e failing points são sintomas diferentes

É importante separar:

- **Unmatched compare points:** o Formality não conseguiu casar um ponto da referência com um ponto da implementação.
- **Failing compare points:** o ponto foi casado, mas a função lógica não é equivalente.
- **Aborted/hard points:** o Formality não conseguiu terminar a prova por complexidade.
- **Unverified points:** ficaram sem prova concluída.
- **Passing points:** equivalência provada.

Um design com muitos unmatched points pode falhar antes mesmo de uma comparação funcional útil. Um design com pontos casados mas failing pode ter erro real ou setup ausente. Um design com pontos aborted pode exigir ajuste de effort, estratégias alternativas, particionamento ou alterações no Design Compiler.

---

### 7. `analyze_points`: o comando que transforma falha em hipótese

O comando:

```tcl
analyze_points -failing
```

é usado para investigar pontos que falharam. Ele tenta classificar a causa provável. No slide, ele encontra:

```text
Found 1 Unconstrained Implementation Input
```

e recomenda:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

Esse é um caso clássico: a implementação tem entrada de teste que não existe no RTL de referência ou não está restrita. O solver escolhe valores para essa entrada e pode colocar a netlist em modo scan.

Para pontos difíceis, usa-se:

```tcl
analyze_points -aborted
analyze_points -unverified
analyze_points -no_operator_svp
```

ou:

```tcl
analyze_points -all
```

Depois, os resultados podem ser resumidos com:

```tcl
report_analysis_results -summary
```

---

### 8. Scan enable livre: uma das maiores causas de falso failure

O exemplo do Pattern Viewer mostra uma falha quando `test_se = 1`. Isso significa:

- `test_se = 0`: modo funcional.
- `test_se = 1`: modo scan/teste.

Se o RTL de referência é funcional, mas a implementação é deixada livre para operar em modo scan, a comparação deixa de ser justa. O Formality está comparando comportamentos de modos diferentes.

A correção é forçar o sinal para o modo funcional:

```tcl
set_constant $impl/test_se 0
```

ou com caminho completo:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

Ponto de prova:

> Scan não é “erro funcional” da implementação. É lógica extra de teste. Para equivalência funcional, ela precisa ser desabilitada.

---

### 9. Pattern Viewer: o contraexemplo da falha

Quando o Formality prova que dois compare points são diferentes, ele pode produzir um counterexample. Esse counterexample é mostrado como pattern.

O Pattern Viewer responde:

- Quais entradas fazem os cones divergirem?
- Qual valor a referência produz?
- Qual valor a implementação produz?
- Algum sinal de setup, como `test_se`, está ativo?
- A divergência aparece por lógica funcional ou por modo de teste?

No exemplo do slide, a observação de `test_se = 1` permite concluir rapidamente que a falha é de setup. Isso é muito mais eficiente do que tentar entender toda a lógica do cone.

---

### 10. Logic Cone Viewer: onde a diferença nasce

Depois de ver o pattern, o próximo passo é abrir o Logic Cone Viewer. Ele mostra:

- cone da referência;
- cone da implementação;
- portas e registradores relevantes;
- valores anotados;
- regiões equivalentes;
- caminhos de divergência.

A técnica correta é procurar a primeira divergência significativa, não apenas a saída final. Se a saída final difere, a causa está em algum ponto anterior do cone.

A ferramenta também permite remover ou esconder regiões que têm valores iguais, reduzindo ruído visual. Isso é essencial em designs reais, onde um cone pode ter centenas ou milhares de células.

---

## Conceitos difíceis explicados em profundidade

### 1. `set_top` não é apenas escolher um nome

Em Formality, `set_top` elabora o design. Isso significa que ele tenta resolver a hierarquia, conectar instâncias, encontrar bibliotecas e preparar o container para matching/verificação.

Por isso, a ordem errada abaixo é problemática:

```tcl
read_verilog -i alu.fast.vg
set_top alu
read_db -i class.db
```

A biblioteca é necessária para elaborar a netlist. A ordem melhor é:

```tcl
read_db -i class.db
read_verilog -i alu.fast.vg
set_top alu
```

Erro comum:

> Ler a netlist, dar `set_top`, só depois lembrar da biblioteca.

Consequência:

- unresolved references;
- black boxes acidentais;
- falha ao setar top;
- matching ruim;
- verify impossível ou enganoso.

---

### 2. Container `r:` e container `i:`

O Formality separa os designs em containers:

- `r:` para referência;
- `i:` para implementação.

Exemplos:

```tcl
read_verilog -r alu.v
read_verilog -i alu.fast.vg
```

Design IDs completos podem aparecer assim:

```text
r:/WORK/alu
i:/WORK/alu_0
```

A biblioteca padrão costuma ser `WORK`. O nome final do design pode mudar conforme a síntese ou os arquivos lidos.

Erro comum:

```tcl
set_top i:/WORK/alu
```

quando o design real da implementação é:

```text
i:/WORK/alu_0
```

Como conferir:

```tcl
report_designs
```

---

### 3. SVF e `synopsys_auto_setup` no debug

O SVF carrega guidance da síntese. Se o design passou por transformações como retiming, register merging, FSM re-encoding, clock gating ou inversão de registrador, o Formality precisa dessas pistas para entender que a implementação ainda é equivalente ao RTL.

Comando:

```tcl
set_svf default.svf
```

Auto setup:

```tcl
set synopsys_auto_setup true
```

O Auto Setup Mode ajusta várias variáveis do Formality para imitar suposições do Design Compiler. Isso reduz falsos failures.

No debug, uma pergunta básica é:

> O fluxo com SVF está sendo usado? O SVF foi aceito? Houve guidance rejeitado?

Se houver guidance rejeitado, o Formality pode perder a ponte entre RTL e netlist otimizada.

---

### 4. `analyze_points`

`analyze_points` é uma ferramenta de diagnóstico pós-falha ou pós-abort.

Uso para falhas:

```tcl
analyze_points -failing
```

Uso para pontos difíceis:

```tcl
analyze_points -aborted
analyze_points -unverified
```

Uso geral:

```tcl
analyze_points -all
```

Relatório:

```tcl
report_analysis_results -summary
```

Variável para rodar automaticamente:

```tcl
set verification_run_analyze_points true
```

O comando pode sugerir:

- `set_constant` para scan/test inputs;
- ajustes de SVF;
- uso de `set_verification_priority` no Design Compiler;
- revisão de datapath;
- investigação de guidance rejeitado.

---

### 5. `set_constant` como comando de setup funcional

Exemplo:

```tcl
set_constant $impl/test_se 0
```

ou:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

Esse comando diz ao Formality que determinado sinal deve ser considerado constante durante a verificação. Ele é usado para:

- desabilitar scan;
- fixar modo funcional;
- desativar teste;
- restringir entradas que não existem na referência;
- evitar que o solver explore modos inválidos.

Erro comum:

> Deixar `test_se` livre e interpretar a falha como erro funcional da netlist.

---

### 6. Counterexample não é vetor de teste comum

O counterexample do Formality é um padrão encontrado pelo solver para provar que existe uma diferença funcional entre os cones.

Ele não é um vetor que você escreveu. Ele é uma evidência matemática de não-equivalência.

Se existe counterexample:

- o ponto falhou;
- existe pelo menos uma combinação de entradas/estados permitidos que diferencia referência e implementação.

Mas se o counterexample depende de `test_se = 1`, talvez a combinação não seja funcionalmente válida. Nesse caso, a correção é restringir o setup.

---

### 7. Logic Cone Viewer e isolamento de diferença

O cone lógico é a lógica combinacional que alimenta um compare point. O Logic Cone Viewer mostra esse cone na referência e na implementação.

O objetivo é encontrar:

- entrada divergente;
- mux selecionando caminho errado;
- inversão inesperada;
- scan ativo;
- clock gating não modelado;
- black box diferente;
- ponto de comparação mal casado;
- problema de setup.

Ferramentas como remoção de valores iguais ajudam a reduzir o cone e destacar só a região relevante.

---

## Figuras, diagramas e waveforms importantes

### Figura do script típico — slide 1

Mostra a estrutura mínima de um script Formality robusto:

1. caminhos;
2. auto setup;
3. DesignWare root;
4. SVF;
5. referência;
6. implementação + biblioteca;
7. possíveis constantes de setup;
8. verificação.

É a base para interpretar todos os problemas seguintes.

---

### Figuras dos problemas 1 e 2 — slides 2 e 3

São exercícios de leitura de script. Eles treinam a capacidade de encontrar erro não pela mensagem final, mas pela ordem e semântica dos comandos.

A figura do problema 1 ensina: biblioteca antes de `set_top`.

A figura do problema 2 ensina: top-level e design IDs precisam ser conferidos, especialmente entre referência e implementação.

---

### Debugging Flow Chart — slide 5

É a figura mais importante do bloco. Ela mostra o fluxo recomendado:

- transcript;
- black boxes;
- SVF;
- auto setup;
- rejected guidance;
- setup;
- analyze;
- unmatched points;
- pattern;
- cone;
- diferença.

Esse fluxograma deve ser memorizado como metodologia.

---

### Figuras de `analyze_points` — slides 8 a 11

Mostram a transição entre comando textual e análise guiada na GUI. O ponto central é que o Formality consegue sugerir comandos de correção, como:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

e também sugerir ajustes para datapaths difíceis no Design Compiler:

```tcl
set_verification_priority [get_cells { add_28 mult_28 sub_28 }]
```

---

### Figuras do Pattern Viewer — slides 12 a 15

Mostram que o Formality produz padrões de falha e permite correlacioná-los com os cones. A informação decisiva do exemplo é a ativação de `test_se`.

Essa é uma das melhores formas de distinguir:

- falha real de lógica;
- falha causada por setup ausente.

---

### Figuras do Logic Cone Viewer — slides 16 e 17

Mostram comparação visual entre referência e implementação. A ferramenta permite enxergar a região divergente do cone e remover valores iguais para reduzir complexidade visual.

---

## Pontos de prova e revisão

1. **Qual é o primeiro passo do debug em Formality?**  
   Olhar o transcript em busca de mensagens importantes.

2. **Por que `read_db` deve ocorrer antes do `set_top` da implementação?**  
   Porque o `set_top` elabora/linka a netlist e precisa das células da biblioteca já carregadas.

3. **O que `set_top` faz além de escolher o top-level?**  
   Elabora/linka o design dentro do container.

4. **O que significa `-r` em `read_verilog -r`?**  
   Lê no container de referência.

5. **O que significa `-i` em `read_verilog -i` ou `read_db -i`?**  
   Lê no container de implementação.

6. **O que o SVF fornece ao Formality?**  
   Guidance de síntese: renomeações, otimizações, FSM re-encoding, datapath transformations, retiming, register merging, etc.

7. **Qual variável ativa Auto Setup Mode?**  
   ```tcl
   set synopsys_auto_setup true
   ```

8. **Qual comando analisa pontos com falha?**  
   ```tcl
   analyze_points -failing
   ```

9. **Qual comando mostra resumo dos resultados de análise?**  
   ```tcl
   report_analysis_results -summary
   ```

10. **O que significa “Unconstrained Implementation Input”?**  
    Uma entrada da implementação, geralmente de teste/scan, está livre e não tem equivalente funcional adequado na referência.

11. **Como corrigir scan enable livre?**  
    ```tcl
    set_constant $impl/test_se 0
    ```

12. **O que é um counterexample no Formality?**  
    Um padrão encontrado matematicamente que prova diferença entre referência e implementação em um compare point.

13. **Por que um failing pattern pode não indicar erro real de design?**  
    Porque pode usar uma combinação inválida de setup, como `test_se = 1`.

14. **Para que serve o Pattern Viewer?**  
    Para visualizar os padrões que causam a divergência.

15. **Para que serve o Logic Cone Viewer?**  
    Para visualizar e comparar os cones de lógica da referência e da implementação.

16. **Quando `set_verification_priority` pode aparecer como recomendação?**  
    Quando há datapath difícil e o Formality sugere orientar o Design Compiler a gerar lógica mais verificável.

17. **O que fazer antes de depurar um cone individual?**  
    Resolver problemas globais de setup, black boxes, SVF, unmatched points e constantes de teste.

---

## Relação com projeto/laboratório

Esta aula tem relação direta com qualquer laboratório de Formality, porque o aluno normalmente recebe ou cria um script Tcl de equivalence checking. Quando o `verify` não passa, a tendência é imaginar que o RTL ou a netlist está errada. Mas, na prática, muitas falhas são causadas por problemas de script.

Relações práticas:

- Em um Makefile ou script de laboratório, a ordem de leitura importa.
- O `.db` da biblioteca deve estar disponível antes de elaborar a implementação.
- O SVF deve ser gerado pelo Design Compiler e lido pelo Formality.
- Se o design tem scan, o sinal de scan enable precisa ser fixado.
- Se o transcript mostra `FM-...`, `FE-LINK-...`, unresolved reference ou black box inesperada, isso deve ser resolvido antes de investigar lógica.
- Se houver failure, rode `analyze_points -failing`.
- Se houver hard verification, investigue datapath e possíveis recomendações de `set_verification_priority`.
- Use a GUI para navegar em Pattern Viewer e Logic Cone Viewer quando a falha não for óbvia.

Fluxo mental recomendado para laboratório:

```text
1. O script leu os arquivos certos?
2. A biblioteca foi lida antes do set_top?
3. O top da referência está correto?
4. O top da implementação está correto?
5. O SVF foi carregado?
6. Auto setup está ativo?
7. Scan/test foi desabilitado?
8. Existem black boxes inesperadas?
9. Existem compare points não casados?
10. analyze_points recomenda algum comando?
11. O Pattern Viewer mostra algum sinal de setup ativo?
12. O Logic Cone Viewer mostra uma diferença funcional real?
```

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

- **Próximo bloco:** Bloco 057 — 06 Debugging — parte B
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\06 Debugging.docx`
- **Processar somente:** slides 18-34
- **Salvar em:** `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\06 Debugging_parte_B.md`
