# 02 Concepts and Steps — parte B

## Controle do bloco

- **Bloco:** 060
- **Curso:** 09 Formality Foundation
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\02 Concepts and Steps.docx`
- **Faixa de slides:** 21-39
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\02 Concepts and Steps_parte_B.md`
- **Próximo bloco recomendado:** Bloco 061 — `03 Simple Logic Cones and Failing Points - parte A`

## Resumo executivo

Esta parte B continua a aula **Concepts and Steps** do curso Formality Foundation. A parte A já construiu a ideia central de equivalence checking: dividir o projeto em **logic cones**, criar **compare points**, aplicar **SVF/guidance**, fazer **match** e depois executar **verify**. A parte B aprofunda o fluxo operacional: como o **Auto Setup Mode** ajusta automaticamente variáveis para interpretar o RTL de forma compatível com a síntese, como o arquivo **SVF** é lido, como os designs são carregados em containers, como o `match` aplica o SVF e faz correspondência clássica, como o `verify` classifica os resultados, e como os estados do shell do Formality controlam quais comandos podem ser executados.

O tema mais importante desta faixa é entender que o Formality não é apenas “rodar `verify`”. O fluxo correto é uma sequência disciplinada: **Guide → Read → Setup → Match → Verify → Debug**. Cada etapa prepara a próxima. Quando essa sequência é mal feita, surgem falhas falsas: o design pode estar equivalente, mas o Formality falha porque a leitura, o setup, o SVF, os containers ou os estados do shell foram usados incorretamente.

Também aparecem comandos práticos que formam o esqueleto de um script real: `set synopsys_auto_setup true`, `set_svf`, `read_verilog`, `read_db`, `set_top`, `match`, `verify`, `save_session`, `restore_session`, `printvar`, `help` e `man`. Esses comandos são o vocabulário mínimo para montar, entender e depurar uma sessão de Formality.

## Texto extraído e organizado por slide

### Slide 21 — What Auto Setup Mode Does

Texto central extraído:

- **Runs the following commands by default (and more):**

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
set svf_ignore_unqualified_fsm_information false
set verification_set_undriven_signals synthesis
set verification_verify_directly_undriven_output false
```

- **Design Compiler places additional setup information in the SVF**
  - Clock-gating notification
  - Scan mode disable information

Este slide mostra que `synopsys_auto_setup` não é apenas uma “chave mágica”. Ele altera um conjunto de variáveis do Formality para que a ferramenta interprete certas situações do mesmo modo que a síntese interpretou. Isso é crucial porque o Formality compara um design RTL contra uma implementação sintetizada. Se o RTL for interpretado de forma diferente da síntese, a comparação pode falhar mesmo que a implementação esteja correta.

O slide enfatiza duas informações extras que o Design Compiler coloca no SVF: notificações de **clock-gating** e informações para desabilitar **scan mode**. Esses dois pontos são clássicos geradores de falsa falha, porque a síntese/DFT altera a estrutura do circuito, adicionando lógica que não existia no RTL original.

---

### Slide 22 — Using the SVF file

Texto central extraído:

- By default, Design Compiler names the automated setup file:

```text
default.svf
```

- To specify the name, use the command in Design Compiler:

```tcl
set_svf file.svf
```

- Formality uses the same command to read automated setup files:

```tcl
set_svf file.svf
```

- You can specify:
  - one file;
  - multiple files;
  - a directory.
- SVF guidance is specified by the design name.
- Formality automatically determines multiple SVF file processing order.
- Formality places the `formality_svf` directory in the current working directory.
  - It creates an ASCII text version: `svf.txt`.

Este slide conecta Design Compiler e Formality pelo mesmo comando `set_svf`, mas com papéis diferentes. No Design Compiler, `set_svf` define o arquivo onde a síntese gravará a guidance. No Formality, `set_svf` indica o arquivo que será lido para reconstruir e provar as transformações feitas durante a síntese.

A criação de `formality_svf/svf.txt` é muito útil para estudo e debug, porque permite inspecionar em formato texto quais informações de guidance foram passadas: mudanças de nomes, reencoding de FSM, register merge, retiming, clock-gating, scan etc.

---

### Slide 23 — Basic Formality Script: Read

Texto central extraído do script:

```tcl
#Step 0: Guidance
set synopsys_auto_setup true
set_svf default.svf

#Step 1: Read Reference Design
read_verilog -r alu.v
set_top alu

#Step 2: Read Implementation Design
read_db -i lsi_10k.db
read_verilog -i alu.fast.v
set_top alu_0

#Step 3: Setup
#No setup required here

#Step 4: Match
match

#Step 5: Verify
verify
```

Este slide destaca a parte de leitura do script básico. O ponto didático é que o Formality separa explicitamente o design de referência e o design de implementação. O RTL `alu.v` entra no container de referência com `-r`. A biblioteca `lsi_10k.db` e a netlist `alu.fast.v` entram no container de implementação com `-i`.

A ordem é importante: a biblioteca de tecnologia deve estar carregada antes de linkar a implementação, porque a netlist gate-level contém células que precisam ser resolvidas contra a biblioteca.

---

### Slide 24 — Reference Design

Texto central extraído:

- `read_verilog` loads design into container.
  - The `-r` signifies the default reference container.
- This script does not load a technology library into `r`.
  - The file `alu.v` is pure RTL, with no mapped logic.
- `set_top alu` finds and links the top-level module `alu`.
  - `set_top` uses the current container `r`.
  - Since the current container is `r`, Formality automatically sets the reference design variable:

```tcl
set_reference_design  ; # conceptually sets $ref
```

- The value of `$ref` becomes:

```text
r:/WORK/alu
```

- `WORK` is the default library name.

O slide explica a leitura do design de referência. O **reference design** costuma ser o RTL “golden”, isto é, a versão considerada funcionalmente correta. Ele não precisa de biblioteca de tecnologia se for RTL puro, porque ainda não foi mapeado para células físicas ou standard cells.

A variável `$ref` é uma conveniência do Formality para representar o design de referência atual. Quando o topo é `alu`, dentro do container `r`, na biblioteca padrão `WORK`, o identificador completo fica `r:/WORK/alu`.

---

### Slide 25 — Read Commands

Texto central extraído:

- Formality common input formats:
  - Verilog synthesizable subset:

```tcl
read_verilog
```

  - VHDL synthesizable subset:

```tcl
read_vhdl
```

  - SystemVerilog synthesizable subset:

```tcl
read_sverilog
```

  - Synopsys binary files:

```tcl
read_db
read_ddc
```

- Designs are read into containers:

```tcl
-r                      ; # default reference container
-i                      ; # default implementation container
-container containerID   ; # other container name
```

- Link top-level of design with:

```tcl
set_top
```

- Load all required designs and libraries before executing `set_top`.
- Must complete elaboration of each container before loading subsequent containers.

Este slide é fundamental para script. Ele mostra que o Formality aceita diferentes formatos de entrada, mas sempre organiza o conteúdo em **containers**. O container `r` é o padrão para referência; o container `i` é o padrão para implementação.

O erro comum é ler parte do design, chamar `set_top`, e só depois carregar bibliotecas ou módulos necessários. Isso pode causar referências não resolvidas e falhas de link. A regra prática é: **carregue primeiro tudo que aquele container precisa; depois chame `set_top`.**

---

### Slide 26 — Implementation Design

Script extraído:

```tcl
fm_shell (setup)> read_verilog -i alu.vg
fm_shell (setup)> read_db -i class.db
fm_shell (setup)> set_top alu_0
```

Texto central extraído:

- `read_verilog` loads the implementation design.
  - The `-i` signifies the default implementation container.
- `read_db` loads the technology library `class.db`.
  - Since `-i` is specified, this library is visible only in the implementation container `i`.
- `set_top` links top-level module `alu_0`.
  - The script reads both design and technology library before `set_top`.
  - `set_top` uses the current container `i`.
  - Since the current design is `i`, Formality automatically sets the implementation design variable `$impl` to:

```text
i:/WORK/alu_0
```

- `WORK` is the default library name.
- The script specifies that the top-level module is `alu_0`.

Este slide é o espelho do slide de referência. A implementação é a versão modificada: pode ser uma netlist sintetizada, otimizada, com células de biblioteca, clock-gating, scan, renomeações e outras transformações.

O detalhe crítico é que a biblioteca `class.db` foi carregada com `-i`, portanto só é visível dentro do container da implementação. Isso é coerente quando a referência é RTL puro e a implementação é gate-level. A netlist `alu.vg` precisa da biblioteca; o RTL `alu.v` normalmente não precisa.

---

### Slides 27 e 28 — Matching Compare Points: Applying SVF

Texto central extraído:

- The first thing `match` does is verify and apply the guidance/SVF if set.
  - The guidance makes subsequent matching and verification far easier.
  - Far less manual setup.
  - Better completion.
- As of Formality 2014.09, this “applying the SVF” step can be done separately using:

```tcl
preverify
```

- Applying the SVF is only done once.
  - If `match` has previously been run, a subsequent `match` will not apply the SVF again.
  - If `preverify` has previously been run, a subsequent `match` will not apply the SVF again.

Comando mostrado:

```tcl
fm_shell (setup)> match
```

Esses slides reforçam que `match` faz mais do que “combinar nomes”. Quando existe SVF, o primeiro trabalho do `match` é verificar e aplicar a guidance. Aplicar o SVF significa usar as informações vindas do Design Compiler para transformar o lado de referência de maneira controlada, aproximando-o da implementação sintetizada.

O comando `preverify` separa essa fase de aplicação/prova do SVF. Isso pode ser útil quando se quer depurar apenas a guidance antes de avançar para o matching completo.

A frase “applying the SVF is only done once” é importante. Se o SVF já foi aplicado, uma segunda execução de `match` não reaplica as transformações. Isso evita duplicar mudanças no container e mantém a sessão consistente.

---

### Slide 29 — Matching Compare Points: Classic match

Texto central extraído:

- Name matching algorithms are used after SVF is applied.
- Remaining unmatched points are matched by signature analysis.
  - Includes structural techniques.
  - May be turned off, but not recommended.
- Any remaining unmatched points are then reported.
  - User can specify compare rules or explicit matches.
  - Rarely required when using SVF.
- Strictly speaking, `match` is optional because `verify` will run `match` if it has not already run.

Comando mostrado:

```tcl
fm_shell (setup)> match
```

O slide apresenta a fase de matching clássico. A sequência é:

1. Aplica-se SVF, se houver.
2. Tenta-se casar compare points por nome.
3. O que sobrar é tentado por **signature analysis**, usando padrões estruturais.
4. O que ainda não casar é reportado ao usuário.

A pegadinha é que `verify` executa `match` automaticamente se necessário. Porém, em uso interativo, rodar `match` explicitamente antes é útil porque dá feedback mais cedo. Se muitos compare points ficarem unmatched, você descobre antes de gastar tempo no verify.

---

### Slide 30 — Basic Formality Script: Verify

Texto central extraído:

```tcl
#Step 0: Guidance
set synopsys_auto_setup true
set_svf default.svf

#Step 1: Read Reference Design
read_verilog -r alu.v
set_top alu

#Step 2: Read Implementation Design
read_db -i lsi_10k.db
read_verilog -i alu.fast.v
set_top alu_0

#Step 3: Setup
#No setup required here

#Step 4: Match
match

#Step 5: Verify
verify
```

Este slide fecha o script com a etapa `verify`. Depois de guidance, read, setup e match, o `verify` executa os algoritmos formais nos pares de compare points já casados.

No uso prático, `verify` é o comando que o aluno tende a lembrar primeiro, mas ele só é confiável quando as etapas anteriores foram bem feitas. A leitura correta, a aplicação do SVF e o matching adequado definem se o resultado será uma prova real de equivalência ou uma falha causada por setup incompleto.

---

### Slide 31 — Verify Implementation Design

Texto central extraído:

- Runs Formality’s verification algorithms on compare points.
  - Formality deploys many different solvers.
  - Each solver uses a different algorithm to prove equivalence or non-equivalence.
- Four possible results:
  - **Succeeded:** implementation is equivalent to the reference.
  - **Failed:** implementation is not equivalent to the reference.
    - Logic difference or setup problem.
  - **Inconclusive:** no points failed, but analysis is incomplete.
    - May be due to timeout or complexity.
  - **Not run:** a problem earlier in the flow prevented verification from running at all.

Comando mostrado:

```tcl
fm_shell (match)> verify
```

Este slide é um dos mais importantes para prova. O resultado `Failed` não significa automaticamente bug funcional no RTL ou na netlist. Pode ser diferença lógica real, mas também pode ser problema de setup: scan não desabilitado, clock-gating não reconhecido, black box não casada, SVF rejeitado, biblioteca errada, top errado etc.

O resultado `Inconclusive` também não é aprovação. Ele quer dizer que a ferramenta não encontrou falha, mas também não conseguiu provar tudo. Isso pode travar signoff, porque equivalência formal precisa de conclusão.

---

### Slide 32 — Verify Implementation Design (continued)

Texto central extraído:

- For each matched pair of compare points, Formality:
  - Confirms same functionality of logic cones.
  - Marks point as `passed`.
- Or:
  - Determines that the functionality is different between logic cones.
  - Finds one or more **counterexamples** that show different response at compare point.
  - Marks the compare point as `failed`.
- By default, all matched compare points are verified.
  - Constant registers are not verified.
  - Unread compare points are not verified by default.

Este slide detalha a lógica interna do `verify`: ele pega cada par de compare points casados e compara a função lógica dos cones que alimentam esses pontos. Se as funções são equivalentes para todos os casos possíveis, o ponto passa. Se existe pelo menos uma combinação de entradas que faz referência e implementação divergirem, o Formality pode gerar um **counterexample**.

Counterexample é uma evidência concreta de divergência: uma atribuição de sinais de entrada/estado que produz resposta diferente. Ele é a ponte entre “a ferramenta disse que falhou” e “onde está a causa provável”.

---

### Slide 33 — Formality Shell states

Texto central extraído:

- Formality has a number of shell states:
  - `guide`
  - `setup`
  - `match`
  - `verify`
- You transition between these states as you go through the steps.
- The `guide` state is reserved for SVF commands.

O Formality shell mostra o estado atual no prompt, por exemplo:

```text
fm_shell (setup)>
fm_shell (match)>
fm_shell (verify)>
```

Esses estados indicam o ponto do fluxo em que a sessão está. Isso importa porque certos comandos só fazem sentido em certos estados. Comandos que alteram design/setup normalmente devem ser executados no estado `setup`, não depois que você já entrou em `match` ou `verify`.

---

### Slide 34 — Formality Shell states: transitions

Exemplo extraído:

```tcl
fm_shell (setup)> set_top fred
fm_shell (setup)> match
fm_shell (match)> verify
fm_shell (verify)> analyze_points -all
fm_shell (verify)> setup
fm_shell (setup)> set_constant $ref/a 0
```

Texto central extraído:

- Certain commands cannot be executed in certain states.
- If the command modifies the design, then it will not be executable in `match` or `verify` state.
- The command `setup` returns you to setup state.

O exemplo mostra uma transição típica:

1. Em `setup`, define-se o top.
2. Executa-se `match`, entrando no estado `match`.
3. Executa-se `verify`, entrando no estado `verify`.
4. Executa-se `analyze_points -all` para depurar.
5. Volta-se para `setup` com o comando `setup`.
6. Só então se usa `set_constant`, porque ele altera restrições/setup do design.

Essa mecânica evita que o usuário modifique a base lógica enquanto a ferramenta está em uma fase que depende de dados já casados ou verificados.

---

### Slide 35 — Save and Restore Session

Texto central extraído:

- Session files contain all the Formality session information.
- Often used after verification to save the current state of Formality.
- Commonly used to debug failing verification in a separate Formality run.
- Saved sessions are **not portable** across Formality releases.

Comandos mostrados:

```tcl
fm_shell> save_session -replace mysession_file
fm_shell> restore_session mysession_file.fss
```

Salvar sessão é útil quando a verificação falha depois de muitos passos. Em vez de reler RTL, bibliotecas, netlist, SVF, refazer match e verify, você salva o estado e depura a partir dele. Isso economiza tempo e torna o debug mais controlado.

A restrição importante é a compatibilidade: sessões salvas não devem ser tratadas como arquivos portáveis entre versões diferentes do Formality.

---

### Slide 36 — Help For Commands and Variables

Texto central extraído:

- Three important commands for getting help:

```tcl
printvar
```

- Displays the value of a Tcl variable.
- Accepts wildcards.

```tcl
help
```

- Displays brief description of a Formality command.
- Accepts wildcards.

```tcl
man
```

- Displays detailed information about a Formality command, Tcl variable, warning, or error message.
- Does not accept wildcards.

Este slide mostra os comandos de sobrevivência no shell. O aluno não precisa decorar tudo, mas precisa saber consultar. `printvar` é essencial para descobrir o valor real de variáveis de setup. `help` ajuda a encontrar comandos por padrão. `man` é mais detalhado e serve inclusive para mensagens de erro e warning.

---

### Slide 37 — Unit Summary

Texto central extraído:

- Key concepts:
  - Logic cones and compare points.
  - Reference and implementation container.
- Key steps in Formality:
  - Guide.
  - Read: RTL, netlist, technology libraries.
  - Additional setup: optional.
  - Match: SVF processing; classic match.
  - Verify.
  - Debug: optional.

Este resumo confirma a espinha dorsal do módulo. A equivalência formal é feita dividindo o design em logic cones, criando compare points, carregando referência e implementação em containers separados, usando SVF para orientar transformações, casando pontos, verificando e depurando quando necessário.

---

### Slide 38 — Lab 2: Running Formality From GUI

Texto central extraído:

- Lab 2: Running Formality From GUI.
- 30 minutes.
- Run through the steps in Formality and get a passing result.
- Fluxo visual:
  - Guide.
  - Read RTL.
  - Read Netlist.
  - Match.
  - Verify.

Observação: este slide é um apontamento de laboratório. Pelo roteiro principal, labs são tratados separadamente. Aqui ele foi usado apenas para reforçar a ordem operacional do fluxo, não para construir um guia de laboratório.

---

### Slide 39 — Unit Summary

O último slide repete o resumo da unidade, reforçando:

- logic cones;
- compare points;
- reference container;
- implementation container;
- guide;
- read;
- setup;
- match;
- verify;
- debug.

A repetição indica que esses termos são o núcleo de memorização da aula.

## Aula didática desenvolvida

### 1. O papel do Auto Setup Mode

O `synopsys_auto_setup` existe para reduzir a distância entre a forma como o Design Compiler interpretou o RTL durante a síntese e a forma como o Formality interpretará esse mesmo RTL durante a verificação. Em teoria, as duas ferramentas deveriam ler o RTL com a mesma semântica. Na prática, há detalhes de síntese, pragmas, sinais sem driver, FSMs, scan, clock-gating e outras transformações que precisam ser alinhadas.

Por isso o script típico começa assim:

```tcl
set synopsys_auto_setup true
set_svf default.svf
```

A ordem indicada pelo material é importante: definir `synopsys_auto_setup` antes de rodar `set_svf`. Assim, quando o SVF for lido, o ambiente já está preparado para aplicar automaticamente variáveis e interpretações compatíveis com a síntese.

Quando o Auto Setup Mode roda, ele ajusta variáveis como:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
set svf_ignore_unqualified_fsm_information false
set verification_set_undriven_signals synthesis
set verification_verify_directly_undriven_output false
```

A leitura dessas variáveis mostra a intenção do recurso:

- respeitar informações de `parallel_case` e `full_case` em vez de ignorá-las;
- aceitar informações de FSM vindas do SVF;
- tratar sinais sem driver do modo como a síntese trataria;
- evitar verificações diretas problemáticas em saídas sem driver.

O ponto de prova é: **Auto Setup Mode aumenta a chance de sucesso out-of-the-box, principalmente quando a implementação veio do Design Compiler e existe SVF.**

### 2. SVF como ponte entre síntese e equivalência

O SVF registra as “decisões” ou “moves” da síntese. Quando o Design Compiler otimiza o design, ele pode alterar nomes, mesclar registradores, reencodar FSMs, inserir clock-gating, desabilitar scan, reorganizar datapath etc. Essas mudanças melhoram QoR, mas dificultam a comparação direta entre RTL e gates.

O Formality usa o SVF para reconstruir a intenção dessas transformações. O material insiste que o SVF pode ser provado implicitamente ou explicitamente. Se uma guidance não for comprovável, ela é rejeitada e não usada. Isso preserva a segurança formal: o SVF não é aceito cegamente.

O comando é o mesmo nas duas pontas:

```tcl
set_svf file.svf
```

No Design Compiler, ele define o arquivo que será gerado. No Formality, ele define o arquivo que será consumido.

### 3. Read: separação entre referência e implementação

A etapa **Read** carrega os designs nos containers. O Formality trabalha com dois mundos separados:

```text
r = reference container
i = implementation container
```

O RTL golden entra em `r`:

```tcl
read_verilog -r alu.v
set_top alu
```

A netlist sintetizada e a biblioteca entram em `i`:

```tcl
read_db -i lsi_10k.db
read_verilog -i alu.fast.v
set_top alu_0
```

A diferença entre `alu` e `alu_0` mostra por que o Formality precisa de matching. A referência e a implementação podem ter nomes diferentes, hierarquias diferentes, células diferentes e compare points modificados.

A regra prática do slide é clara: carregue todos os arquivos e bibliotecas necessários antes de `set_top`. `set_top` não é só “apontar o módulo principal”; ele também elabora e linka o design. Se algo estiver faltando, você terá erros de unresolved references.

### 4. Match: SVF primeiro, matching clássico depois

O `match` tem duas grandes fases:

1. **Aplicar/verificar SVF**, se existir.
2. **Casar compare points**, primeiro por nome, depois por assinatura/estrutura.

O material reforça que, com versões mais novas do Formality, a aplicação do SVF pode ser feita separadamente por:

```tcl
preverify
```

Isso ajuda a isolar problemas de guidance antes do matching completo.

Depois do SVF, o matching clássico tenta casar pontos equivalentes. Se os nomes foram preservados, é fácil. Se foram alterados de forma previsível, o SVF ou compare rules ajudam. Se ainda sobrarem pontos não casados, a ferramenta usa **signature analysis**, uma técnica estrutural para descobrir correspondências mesmo sem nomes iguais.

A grande pegadinha: `match` é tecnicamente opcional porque `verify` chama `match` se ele ainda não tiver rodado. Mas, para estudo e debug, é melhor executar `match` explicitamente, porque ele mostra unmatched points antes de gastar tempo em verificação formal.

### 5. Verify: provar cada par de cones

O `verify` executa os solvers formais nos compare points casados. Para cada par, ele tenta provar que a função do cone de referência é equivalente à função do cone de implementação.

Os resultados possíveis são:

- **Succeeded:** equivalência provada.
- **Failed:** diferença encontrada ou setup incorreto.
- **Inconclusive:** nenhuma falha provada, mas a prova não terminou.
- **Not run:** algum problema anterior impediu a verificação.

A diferença entre `Failed` e `Inconclusive` é importante:

- `Failed` traz um caminho para debug, frequentemente com counterexample.
- `Inconclusive` indica limitação de tempo, complexidade, setup ou capacidade do solver; não é aprovação.

Quando há falha, o Formality pode produzir counterexamples. Esses padrões mostram uma combinação de entradas/estado que produz resposta diferente no compare point. Esse é o material que alimenta a etapa de debug.

### 6. Estados do shell

O Formality shell muda de estado conforme o fluxo avança:

```text
guide → setup → match → verify
```

O prompt mostra o estado:

```tcl
fm_shell (setup)>
fm_shell (match)>
fm_shell (verify)>
```

Isso não é cosmético. O estado limita quais comandos podem ser usados. Comandos que modificam o design ou o setup, como `set_constant`, devem ser executados em `setup`. Se você está em `verify`, precisa voltar:

```tcl
setup
set_constant $ref/a 0
```

Essa regra evita inconsistência: não se deve mudar o design depois que a ferramenta já casou ou verificou pontos com base em uma versão anterior do setup.

### 7. Sessões e ajuda

Depois de uma verificação longa, especialmente se falhar, é comum salvar a sessão:

```tcl
save_session -replace mysession_file
restore_session mysession_file.fss
```

Isso permite abrir outra sessão de debug sem refazer tudo desde o começo. Porém, o slide alerta que sessões salvas não são portáveis entre releases do Formality.

Para consultar comandos:

```tcl
printvar
help
man
```

A diferença prática:

- `printvar` vê variáveis.
- `help` dá descrição breve e aceita wildcard.
- `man` dá documentação detalhada, inclusive de erros e warnings, mas não aceita wildcard.

## Conceitos difíceis explicados em profundidade

### `synopsys_auto_setup`

É uma variável de conveniência para alinhar Formality com a interpretação de síntese do Design Compiler. Ela não substitui o SVF, mas trabalha melhor com ele. O slide diz explicitamente: funciona com ou sem SVF, mas faz mais com SVF.

Erro comum: ativar depois de `set_svf`. O material recomenda definir antes:

```tcl
set synopsys_auto_setup true
set_svf default.svf
```

### SVF e `set_svf`

SVF significa **Automated Setup File** ou arquivo de guidance. Ele carrega informações sobre transformações feitas na síntese. O comando `set_svf` aparece tanto no Design Compiler quanto no Formality, mas o contexto muda:

- no Design Compiler: gerar/gravar guidance;
- no Formality: ler/aplicar guidance.

### Containers `r` e `i`

Containers são bancos internos do Formality para separar referência e implementação.

```tcl
read_verilog -r alu.v       ; # referência
read_verilog -i alu.fast.v  ; # implementação
```

Sem essa separação, a ferramenta não saberia qual design é o golden e qual deve ser provado equivalente.

### `$ref` e `$impl`

Após `set_top`, o Formality define variáveis que apontam para os designs ativos:

```text
$ref  → r:/WORK/alu
$impl → i:/WORK/alu_0
```

Essas variáveis tornam comandos mais curtos e menos propensos a erro.

### `match`

O `match` procura pares de compare points correspondentes. Com SVF, ele primeiro aplica guidance. Depois usa matching por nome e por assinatura estrutural.

A meta é criar pares coerentes para o `verify`.

### `verify`

O `verify` não compara texto, nem nomes, nem estrutura superficial. Ele prova equivalência funcional dos cones lógicos de compare points casados.

O ponto sutil é que duas estruturas diferentes podem ser equivalentes. Uma soma implementada com arquitetura diferente, por exemplo, pode ter a mesma função. O desafio do solver é provar isso matematicamente.

### Estados do shell

O estado do shell protege o fluxo. Se você está em `verify`, comandos de modificação de setup podem não ser permitidos. Voltar para setup é necessário para alterar constantes, black boxes, constraints ou outras condições da comparação.

## Figuras, diagramas e waveforms importantes

### Figura do fluxo: Guide → Read → Setup → Match → Verify → Debug

O fluxograma aparece várias vezes nesta parte. Ele é a representação mental que deve guiar o uso do Formality. O bloco **Guide** é onde entram `synopsys_auto_setup` e `set_svf`. O bloco **Read** carrega RTL, netlist e bibliotecas. O bloco **Setup** permite ajustes adicionais. O bloco **Match** aplica SVF e casa compare points. O bloco **Verify** prova equivalência. O bloco **Debug** é usado quando o resultado não passa.

### Figura do script básico

O script básico une todos os conceitos em uma sequência mínima. Ele mostra que uma sessão típica não precisa começar com comandos complexos: para um caso simples, basta auto setup, SVF, leitura da referência, leitura da implementação, match e verify.

### Figura do matching com SVF

A figura de matching mostra que o SVF torna os nomes mais próximos entre referência e implementação. Isso evita que o usuário tenha de escrever manualmente compare rules para nomes alterados pela síntese.

### Figura de verify

A figura de verificação representa cada compare point como um par de cones. Alguns passam, outros falham e outros podem ficar não casados. A ideia central é que a prova acontece cone por cone, não como uma comparação monolítica do chip inteiro.

### Figura do Lab 2

A figura do Lab 2 mostra uma versão simplificada do fluxo GUI: Guide, Read RTL, Read Netlist, Match e Verify. Como o roteiro separa labs do fluxo principal, este slide foi tratado apenas como reforço conceitual.

## Pontos de prova e revisão

- `set synopsys_auto_setup true` deve ser usado antes de `set_svf` no fluxo recomendado.
- O arquivo SVF padrão gerado pelo Design Compiler chama-se `default.svf`.
- `set_svf file.svf` é usado no Design Compiler para especificar o SVF e no Formality para ler o SVF.
- O Formality cria diretório `formality_svf` e versão ASCII `svf.txt`.
- `read_verilog -r` lê o design no container de referência.
- `read_verilog -i` lê o design no container de implementação.
- `read_db -i` lê biblioteca `.db` no container de implementação.
- `set_top` deve ser executado depois de carregar os arquivos e bibliotecas necessários.
- `$ref` aponta para o design de referência atual.
- `$impl` aponta para o design de implementação atual.
- O primeiro trabalho de `match`, se SVF estiver setado, é verificar e aplicar o SVF.
- `preverify` pode aplicar/verificar SVF separadamente em versões novas do Formality.
- `match` é opcional tecnicamente, porque `verify` executa matching se necessário, mas é recomendado em uso interativo.
- `verify` pode retornar `Succeeded`, `Failed`, `Inconclusive` ou `Not run`.
- `Failed` pode ser diferença real ou problema de setup.
- `Inconclusive` não é aprovação.
- O estado `guide` é reservado para comandos SVF.
- Comandos que modificam design/setup não devem ser executados em `match` ou `verify`.
- `setup` retorna o shell ao estado de setup.
- Sessões salvas não são portáveis entre releases diferentes do Formality.
- `printvar`, `help` e `man` são comandos essenciais de consulta.

## Relação com projeto/laboratório

Esta parte é diretamente aplicável a qualquer fluxo em que você precise comparar RTL contra netlist sintetizada. O padrão mínimo é:

```tcl
set synopsys_auto_setup true
set_svf default.svf

read_verilog -r rtl.v
set_top top

read_db -i tech.db
read_verilog -i netlist.vg
set_top top_synth

match
verify
```

Em laboratório, a GUI pode guiar o aluno pelas etapas, mas o entendimento real vem do script. A GUI mostra abas para cada fase, mas os comandos Tcl revelam o que a ferramenta está fazendo.

A conexão com Design Compiler é forte: o SVF gerado na síntese é o que permite ao Formality aceitar otimizações agressivas sem gerar falsas falhas. Portanto, quando o projeto envolver síntese com otimizações avançadas, retiming, clock-gating, scan ou FSM reencoding, o SVF não é detalhe; ele é parte essencial do fluxo.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

## Próximo bloco

- **Próximo bloco:** Bloco 061 — `03 Simple Logic Cones and Failing Points - parte A`
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\03 Simple Logic Cones and Failing Points.docx`
- **Processar somente:** slides 1-15
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\03 Simple Logic Cones and Failing Points_parte_A.md`
