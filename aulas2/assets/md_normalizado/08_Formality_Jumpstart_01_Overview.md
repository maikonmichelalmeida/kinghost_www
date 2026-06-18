# 01 Overview

## Controle do bloco
- Bloco: 051
- Arquivo de origem: `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\01 Overview.docx`
- Faixa de slides: 1-18
- Caminho sugerido para salvar: `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\01 Overview.md`
- Próximo bloco recomendado: 052 - `02 SVF Guidance`

## Resumo executivo

Esta aula introduz o papel do **Formality** no fluxo Synopsys: ele é uma ferramenta de **equivalence checking** (verificação de equivalência), usada para provar que dois modelos de um mesmo projeto têm o mesmo comportamento lógico. O caso mais comum é comparar o **reference design** (projeto de referência), normalmente o RTL considerado correto, contra o **implementation design** (projeto de implementação), normalmente uma netlist pós-síntese ou pós-transformação.

A ideia central é simples, mas poderosa: depois que o RTL passa por síntese, otimizações, mapeamento para biblioteca, possíveis transformações físicas, otimizações de baixo consumo e até mudanças estruturais profundas, a aparência do circuito pode mudar muito. O Formality não pergunta se os dois projetos “parecem iguais”. Ele pergunta se, para todos os casos possíveis relevantes, eles produzem a mesma função lógica nos pontos de comparação.

A aula também apresenta os conceitos fundamentais de **logic cone** (cone lógico), **compare point** (ponto de comparação), ciclos de **read** (leitura), **match** (casamento/alinhamento), **verify** (verificação) e **debug** (depuração). Esses conceitos são a base para entender os próximos blocos do curso, especialmente o bloco de **SVF Guidance** (orientação via SVF), porque o SVF ajuda o Formality a entender transformações feitas pelo Design Compiler.

Um ponto muito importante: equivalência formal não substitui a verificação funcional do RTL. Ela assume que o projeto de referência está correto. Se o RTL estiver funcionalmente errado, mas a netlist estiver equivalente ao RTL, o Formality pode aprovar a equivalência mesmo que o chip continue errado em relação à especificação. Portanto, no fluxo correto, primeiro se valida funcionalmente o RTL com simulação, assertions, lint/static checks e metodologias de verificação; depois se usa equivalence checking para garantir que as transformações posteriores preservaram a função.

## Texto extraído e organizado por slide

### Slide 1 — Equivalence Checking

Texto visível:

- Assumes that the reference design is functionally correct.
- Determines if the implementation design is functionally equivalent to the reference design.
  - Provides counter-examples if designs are functionally different.
- Is mathematically exhaustive with no missing corner cases.
- Does not require test vectors.

Figura:

- O slide mostra dois blocos: `Reference Design` e `Implementation Design`.
- Entre eles aparece a pergunta: `Functionally Equivalent?`
- A mensagem visual é que o Formality compara dois modelos para decidir se a implementação preserva a função do modelo de referência.

Interpretação:

O Formality não tenta provar que o projeto atende à especificação original do produto. Ele prova que dois modelos são equivalentes entre si. Por isso a primeira frase é decisiva: ele assume que o projeto de referência está funcionalmente correto.

### Slide 2 — Equivalence Checking in The Flow

Texto visível principal:

- Static Rule Checker LEDA.
- RTL.
- Dynamic/Semi-Formal Verification:
  - Magellan — Property/Model Checking.
  - Vera — Testbench Automation.
  - VCS — Verilog Simulation.
  - VCS MX — VHDL Simulation.
  - VCS NLP — Low Power simulation.
- Synthesis.
- Physical Synthesis.
- Detailed Place/Route.
- Formality.

Quadro verde, texto visível:

- Customer Usage Model.
- Simulates RTL first.
- Identifies problems early with static and dynamic RTL verification.
- Uses equivalence checking throughout the flow — not just at the end.

Interpretação:

A figura posiciona o Formality ao longo do fluxo, não apenas no signoff final. O uso ideal é verificar equivalência após etapas importantes, como síntese lógica, síntese física e place-and-route detalhado, para detectar rapidamente onde uma transformação quebrou a função.

### Slide 3 — Key Equivalence Checking Concepts

Texto visível:

- Logic Cones and Compare Points.
- Common Compare Points:
  - Primary output.
  - Register or latch.
  - Input of a black box.
- Less Common Compare Points:
  - Multiply-driven net.
  - Loop.
  - Cutpoint.
- Logic Cone:
  - A block of combinational logic that drives a compare point.

Interpretação:

Este slide apresenta a linguagem básica da ferramenta. O Formality divide o projeto em regiões combinacionais chamadas cones lógicos e compara o resultado desses cones em pontos específicos chamados compare points.

### Slide 4 — Logic Cone

Texto visível:

- Logic Cone.
- Compare Point.
- Inputs to a Logic cone:
  - Register Output Pins.
  - Primary Input Ports.
  - Black Box Output Pins.
- Compare Points:
  - Registers.
  - Primary Output Ports.
  - Black Box Input Pins.

Figura:

- Um cone roxo representa um bloco de lógica combinacional.
- À esquerda ficam as entradas do cone: saídas de registradores, entradas primárias e saídas de black boxes.
- À direita fica o compare point, que pode ser registrador, porta de saída primária ou entrada de black box.

Interpretação:

A comparação formal fica mais tratável quando o projeto é dividido em pedaços. Em vez de comparar o circuito inteiro de uma vez como uma massa única, o Formality identifica cones de lógica combinacional entre fronteiras sequenciais e pontos de observação.

### Slide 5 — Formality Flow Overview

Texto visível:

- Formality Equivalence Checker.
- Entradas: `REF`, `IMP`, `LIB`.
- READ: Partitions reference and implementation designs into logic cones and compare points.
- MATCH: Aligns/map corresponding compare points between the two designs.
- VERIFY: Checks functionality of each compare point pair.
- DEBUG: GUI and Reports.

Interpretação:

O fluxo básico do Formality tem quatro fases conceituais:

1. Ler os projetos e bibliotecas.
2. Mapear os pontos correspondentes.
3. Verificar equivalência de cada par de pontos.
4. Depurar diferenças quando houver falhas.

### Slide 6 — The Design Read Cycle

Texto visível:

- The Design Read Cycle.
- Breaks Designs into Logic Cones.
- Reference Design.
- Implementation Design.

Figura:

- O projeto de referência e o projeto de implementação são quebrados em múltiplos cones lógicos.
- A representação visual mostra que os dois projetos podem ter muitos cones e que a organização interna não precisa ser idêntica.

Interpretação:

Na etapa de leitura, o Formality constrói uma representação interna dos dois designs. Ele identifica os objetos importantes, as fronteiras combinacionais, os registradores, as saídas, as black boxes e as bibliotecas utilizadas.

### Slide 7 — The Matching Cycle: Matches corresponding points between designs

Texto visível:

- The Matching Cycle.
- Matches corresponding points between designs.
- Reference Design.
- Implementation Design.
- Exemplo de nomes:
  - `a_reg[31]` no reference design.
  - `a_reg_31_` no implementation design.
- These points match automatically.
- Most compare points match by name. For those compare points that do not need guidance information, matching is performed manually or by compare rules.

Interpretação:

Mesmo quando a síntese muda a notação dos nomes, o Formality consegue reconhecer muitos pontos equivalentes automaticamente. Por exemplo, um registrador chamado `a_reg[31]` no RTL pode virar `a_reg_31_` na netlist. Em casos simples, o casamento por nome resolve. Em casos complexos, é necessário usar regras, orientação do SVF ou intervenção manual.

### Slide 8 — The Matching Cycle: matched, user-specified and unmatched cones

Texto visível da legenda:

- Matched Cone.
- User Specified Matched Cone.
- Unmatched Cone.

Figura:

- Os cones azuis representam cones casados automaticamente.
- Os cones verdes representam cones casados por especificação do usuário.
- Os cones roxos/vermelhos representam cones não casados.

Interpretação:

A etapa de match é crítica. Se um cone ou compare point não encontra correspondente, a ferramenta não tem como provar equivalência naquele ponto. Um bom fluxo de Formality precisa reduzir ou eliminar pontos não casados antes de confiar no resultado final.

### Slide 9 — The Verification Cycle

Texto visível:

- The Verification Cycle.
- Verifies logical equivalence for each logic cone.
- Reference Design.
- Implementation Design.
- Legenda:
  - Passing Cone.
  - Failing Cone.
  - Unmatched Cone.

Interpretação:

Depois que os pontos são casados, o Formality verifica a equivalência lógica de cada par de cones. Um cone pode passar, falhar ou permanecer não casado. Um cone que falha indica que existe pelo menos uma condição lógica em que o reference design e o implementation design produzem resultados diferentes.

### Slide 10 — The Debug Cycle

Texto visível:

- The Debug Cycle.
- Isolates implementation errors.
- Reference Design Cone.
- Implementation Design Cone.
- Exemplo de compare points:
  - `a_reg[31]` no reference design.
  - `a_reg_31_` no implementation design.

Figura:

- O slide mostra dois cones com portas lógicas internas.
- Há um destaque circular em uma região da lógica.
- O reference design produz `0` no ponto observado, enquanto o implementation design produz `1`.

Interpretação:

O debug não é apenas dizer “falhou”. A ferramenta tenta mostrar onde a divergência aparece e qual cone ou região lógica deve ser investigada. Isso ajuda a localizar se o problema veio de RTL incorreto, setup errado, biblioteca errada, constraints mal aplicadas, black box mal configurada ou transformação não informada ao Formality.

### Slide 11 — Invoking Formality

Texto visível:

Para rodar um script Tcl típico do Formality:

```tcl
% fm_shell -f runme.fms | tee runme.log
```

Para iniciar a GUI a partir do UNIX:

```tcl
% formality
```

ou:

```tcl
% fm_shell -gui -f runme.fms | tee runme.log
```

Para iniciar a GUI dentro de uma sessão batch:

```tcl
fm_shell (setup)> start_gui
```

Para ver outras opções de invocação:

```tcl
% fm_shell -help
```

Interpretação:

O Formality pode ser usado por script, por interface gráfica ou por combinação dos dois. Em ambiente profissional, o script é essencial para repetibilidade. A GUI é muito útil no aprendizado e no debug.

### Slide 12 — Files that Formality Generates

Texto visível:

- Record of commands issued:
  - `fm_shell_command.log`
- Log file that stores informational messages:
  - `formality.log`
- Working files:
  - `FM_WORK` directory.
  - `fm_shell_command.lck` and `formality.lck`.
  - Formality automatically deletes all working files when you exit the tool gracefully.

Interpretação:

Os logs são importantes para auditoria, repetição e debug. O arquivo de comandos mostra o histórico do que foi executado; o log principal guarda mensagens, avisos e erros; os arquivos de trabalho guardam estado temporário da execução.

### Slide 13 — Formality Setup File

Texto visível:

- Formality reads the `.synopsys_fm.setup` file when invoked.
- A typical setup file contains commands such as:

```tcl
set search_path ". ./lib ./netlists ./rtl"
alias h history
```

- Formality reads this file from the following locations:
  - The Formality installation directory:
    - `formality_root/admin/setup/.synopsys_fm.setup`
  - Your home directory.
  - The current working directory.
- The setup is a cumulative effect of all three files.

Interpretação:

O setup file define comandos iniciais carregados automaticamente. Isso evita repetir configurações comuns em todos os scripts. O efeito cumulativo exige cuidado: uma configuração global pode afetar o projeto, e uma configuração local pode complementar ou alterar o ambiente.

### Slide 14 — Formality Flow Overview detalhado

Texto visível no fluxograma:

- Start.
- 0: Guidance.
  - Read in automated setup file: SVF.
- 1: Read Reference.
  - Design + Libraries.
- 1: Link Design.
  - Set top.
- 1: Load Reference UPF.
- 2: Read Implementation.
  - Design + Libraries.
- 2: Link Design.
  - Set top.
- 2: Load Implementation UPF.
- 3: Setup.
- 4: Match.
- 5: Verify.
- Success?
  - Y: End.
  - N: Debug.
- 6: Debug.

Interpretação:

Este é o roteiro operacional do Formality. Antes de comparar, a ferramenta precisa ler guidance/SVF, referência, implementação, bibliotecas, top modules e, em projetos de baixo consumo, os arquivos UPF. Só depois faz setup, match, verify e debug.

### Slide 15 — The Formality GUI

Texto visível:

- GUI is recommended for new users.
- Guides you through the flow.
- Contains context-sensitive help.
- Tabs for each step of the flow.
- Do not have to remember the Tcl syntax.
- Displays the corresponding Tcl commands.
- Stores GUI preferences in the `~/.synopsys_fmg` folder.

Interpretação:

A GUI é uma ferramenta didática e prática para entender o fluxo. Ela mostra comandos Tcl correspondentes, o que ajuda a transformar ações manuais em scripts reprodutíveis.

### Slide 16 — Formality Low Power Capabilities

Texto visível:

- Complete low-power static verification solution.
- Adheres to IEEE 1801 (UPF).
- Comprehensive low-power checks.
  - Verifies all legal power states as defined in the power state table.
    - Including power-up and power-down states.
  - Supports advanced low-power design techniques.
  - Supports special low-power cells.
- VCLP support for static low-power rule checking.

Interpretação:

O Formality também participa de fluxos de baixo consumo. Quando o projeto usa UPF, domínios de potência, estados de energia, células especiais e power intent, a equivalência precisa considerar mais do que apenas portas lógicas comuns.

### Slide 17 — Low Power Verification Flow

Texto visível:

- Data Requirements:
  - RTL and UPF must be simulated with Synopsys tool VCS NLP.
  - Design Compiler netlist can be either Verilog or DDC.
  - UPF must be from the Design Compiler command:

```tcl
save_upf
```

  - Technology libraries:
    - Power aware cells must have power pins and power down functions.
    - Formality can create power pins for standard logic function cells.

Figura:

- O fluxo mostra RTL + UPF entrando em Design Compiler/Power Compiler.
- Depois aparece Gate + UPF seguindo para IC Compiler.
- Em pontos diferentes do fluxo, Formality verifica equivalência.

Interpretação:

Em low power, a comparação precisa preservar a intenção de potência. Não basta comparar apenas a lógica booleana se estados de energia, isolamento, retenção e células especiais interferem no comportamento observável.

### Slide 18 — A Basic Formality Script

Texto visível:

```tcl
#Step 0: Guidance
set_svf default.svf

#Step 1: Read Reference Design
read_verilog -r alu.v
set_top alu
load_upf -r alu.upf

#Step 2: Read Implementation Design
read_db -i lsi_10k.db
read_verilog -i alu.fast.vg
set_top -auto
load_upf -i alu.fast.upf

#Step 3: Setup
#No setup required here

#Steps 4 & 5: Match and Verify
verify
```

Interpretação:

O script resume o fluxo mínimo: carregar guidance/SVF, ler referência, definir top, carregar UPF da referência, ler bibliotecas e netlist de implementação, definir top da implementação, carregar UPF da implementação e chamar a verificação.

## Aula didática desenvolvida

### 1. O problema que o Formality resolve

Em um fluxo ASIC/RTL real, o projeto começa em uma descrição de alto nível, normalmente RTL em Verilog, VHDL ou SystemVerilog. Esse RTL é simulado, revisado, verificado e então enviado para síntese. A síntese transforma o RTL em uma netlist de portas, usando células reais de uma biblioteca tecnológica.

Durante essa transformação, o circuito pode mudar muito. Uma expressão simples em RTL pode virar uma rede de portas complexa. Um mux pode ser reestruturado. Registradores podem ser renomeados. Uma lógica combinacional pode ser otimizada, duplicada, removida ou compartilhada. Em fluxos mais avançados, pode haver otimização para timing, área, potência, clock gating, scan, mudanças relacionadas a UPF e outras transformações.

A pergunta fundamental é:

> Depois de todas essas transformações, a implementação ainda faz a mesma coisa que o RTL fazia?

Uma resposta ingênua seria: “simule a netlist e compare com a simulação do RTL”. Isso ajuda, mas não é suficiente para signoff, porque simulação depende de vetores. Se você não aplicar um vetor que ative determinado canto lógico, pode não perceber a diferença.

O Formality resolve esse problema de outro modo. Ele faz equivalence checking (verificação de equivalência), isto é, uma prova formal de que dois modelos são logicamente equivalentes nos pontos observáveis relevantes. Em vez de testar alguns casos, ele tenta provar matematicamente que não existe caso que diferencie os dois modelos. Se existir uma diferença, a ferramenta pode gerar um counter-example (contraexemplo): uma combinação de entradas/estados que faz a referência e a implementação divergirem.

### 2. O que significa “mathematically exhaustive”

Quando o slide diz que a verificação é mathematically exhaustive (matematicamente exaustiva), ele está contrastando o Formality com simulação baseada em vetores.

Na simulação, você escolhe estímulos:

```text
entrada A = 0, B = 0
entrada A = 0, B = 1
entrada A = 1, B = 0
entrada A = 1, B = 1
```

Para um circuito pequeno, é possível testar tudo. Para um design real, o número de combinações explode. Se houver 100 entradas, há 2^100 combinações possíveis só para entradas, sem contar estados internos. É inviável testar tudo com simulação.

Na verificação formal de equivalência, a ferramenta trabalha simbolicamente. Ela não precisa enumerar manualmente todos os vetores. Ela analisa as funções lógicas representadas pelos cones e tenta provar que a função do cone da referência é igual à função do cone da implementação.

Por exemplo, imagine que o RTL diz:

```verilog
assign y = (a & b) | (a & c);
```

Depois da síntese, a implementação pode estar otimizada como:

```verilog
assign y = a & (b | c);
```

Estruturalmente os dois circuitos são diferentes. Um tem dois ANDs e um OR; o outro tem um OR e um AND. Mas funcionalmente são equivalentes pela distributividade booleana. O Formality deve aprovar essa equivalência.

Agora imagine que por algum erro a implementação ficou:

```verilog
assign y = a & (b & c);
```

Neste caso, a função mudou. O Formality deve falhar e apontar um contraexemplo, como `a=1`, `b=1`, `c=0`. Na referência, `y=1`; na implementação errada, `y=0`.

### 3. O limite da equivalência: ela não prova que o RTL está certo

O primeiro bullet do slide 1 é um dos mais importantes do curso:

> Assumes that the reference design is functionally correct.

Ou seja, se o RTL estiver errado, mas a síntese preservar perfeitamente esse erro, o Formality vai dizer que a implementação é equivalente ao RTL. Isso é correto do ponto de vista da ferramenta.

Por isso, o fluxo correto tem duas grandes perguntas diferentes:

1. O RTL está correto em relação à especificação?
2. A implementação preserva o comportamento do RTL?

A primeira pergunta é respondida por simulação funcional, testbenches, assertions (asserções), coverage (cobertura), revisão de código, lint, análise estática e técnicas de verificação funcional.

A segunda pergunta é respondida por equivalence checking (verificação de equivalência), usando ferramentas como Formality.

Uma pegadinha comum de prova é dizer que Formality “valida o design”. Mais precisamente, ele valida equivalência entre dois designs. Ele não substitui a validação funcional do RTL contra a especificação.

### 4. Por que usar equivalence checking ao longo do fluxo

O slide 2 mostra que equivalence checking deve ser usado throughout the flow (ao longo do fluxo), não apenas at the end (no fim).

Isso é importante porque cada etapa pode introduzir mudanças:

- RTL para netlist pós-síntese.
- Netlist pós-síntese para netlist otimizada fisicamente.
- Inserção de scan/DFT.
- Otimizações de clock gating.
- Transformações de baixo consumo baseadas em UPF.
- Place and route com possíveis ECOs.

Se você só roda equivalência no final, uma falha pode ter sido introduzida muito antes. O debug fica mais difícil, porque você não sabe em qual transformação o problema apareceu.

O uso inteligente é verificar após marcos importantes:

```text
RTL aprovado
   ↓
Síntese lógica
   ↓ equivalence check
Síntese/otimização física
   ↓ equivalence check
Pós-place-and-route / ECO
   ↓ equivalence check
Signoff
```

Essa estratégia transforma o Formality em uma ferramenta de controle de continuidade funcional. Ele garante que cada etapa preserve o comportamento da etapa anterior.

### 5. Reference design e implementation design

No vocabulário da aula:

- Reference design (projeto de referência): o modelo considerado golden, isto é, o modelo correto contra o qual a comparação será feita.
- Implementation design (projeto de implementação): o modelo transformado que precisa provar equivalência com a referência.

No caso mais comum:

```text
Reference design      = RTL
Implementation design = netlist sintetizada
```

Mas outros pares também são possíveis:

```text
Reference design      = netlist pós-síntese
Implementation design = netlist pós-ECO
```

ou:

```text
Reference design      = netlist antes de otimização física
Implementation design = netlist depois de otimização física
```

O importante é que o reference design seja o ponto de verdade para aquela comparação. A implementação precisa preservar a função do reference.

### 6. Logic cone: o pedaço combinacional que será verificado

Um logic cone (cone lógico) é o bloco de lógica combinacional que alimenta um compare point (ponto de comparação).

Em circuitos síncronos, normalmente temos algo assim:

```text
registrador → lógica combinacional → registrador
```

O cone lógico é a parte do meio:

```text
saídas de registradores / entradas primárias / black boxes
      ↓
lógica combinacional
      ↓
entrada de registrador / saída primária / entrada de black box
```

O Formality usa esse particionamento porque comparar todo o circuito de uma vez pode ser muito complexo. Ao dividir em cones, a ferramenta compara funções locais entre fronteiras bem definidas.

As entradas típicas de um cone lógico são:

- Register output pins (pinos de saída de registradores).
- Primary input ports (portas primárias de entrada).
- Black box output pins (pinos de saída de black boxes).

Os compare points típicos são:

- Registers (registradores).
- Primary output ports (portas primárias de saída).
- Black box input pins (pinos de entrada de black boxes).

A visão mental correta é: o Formality compara a função combinacional que leva dos pontos de origem até os pontos de observação.

### 7. Compare point: onde a equivalência é observada

Compare point (ponto de comparação) é um ponto do design em que o Formality espera comparar reference e implementation.

Os pontos mais comuns são:

- Saídas primárias.
- Registradores ou latches.
- Entradas de black boxes.

Por que registradores são compare points tão importantes? Porque em um circuito sequencial, os registradores guardam o estado. Se a lógica que calcula o próximo estado de cada registrador é equivalente, e as saídas também são equivalentes, então a implementação preserva a evolução do estado do projeto.

Em uma equivalência simples RTL versus netlist, a ferramenta tenta casar cada registrador da referência com um registrador correspondente na implementação. Se esse casamento for correto, os cones entre os registradores podem ser verificados como problemas combinacionais.

### 8. Black boxes no Formality

Uma black box (caixa preta) é um bloco cujo comportamento interno não está disponível ou não será verificado naquele momento. Pode ser uma memória, um IP externo, uma macro analógica, um PLL, um bloco criptografado ou qualquer módulo tratado como abstrato.

Quando há black boxes, as fronteiras dessas caixas viram pontos importantes:

- Saídas de black box podem alimentar cones lógicos.
- Entradas de black box podem ser compare points.

O raciocínio é: se o bloco interno não será analisado, a ferramenta precisa garantir que a lógica conectada ao redor dele seja equivalente até a fronteira observável.

Erros comuns com black boxes:

- A black box existe na referência, mas não na implementação.
- O nome ou a interface da black box não bate.
- Pinos foram invertidos ou renomeados sem guidance.
- A ferramenta tenta abrir um bloco que deveria ser tratado como black box.

### 9. O ciclo READ

A fase READ (leitura) não é apenas “abrir arquivos”. Ela transforma os arquivos de entrada em um banco interno de objetos que o Formality consegue comparar.

Nessa fase, a ferramenta precisa ler:

- O projeto de referência.
- O projeto de implementação.
- As bibliotecas tecnológicas.
- Possíveis arquivos UPF.
- Possível SVF.
- Definições de top module.

Depois disso, ela particiona os designs em logic cones (cones lógicos) e compare points (pontos de comparação).

No slide 5, as entradas `REF`, `IMP` e `LIB` resumem essa necessidade:

- `REF`: banco da referência.
- `IMP`: banco da implementação.
- `LIB`: bibliotecas usadas para interpretar células e funções.

Sem bibliotecas corretas, o Formality pode não entender a função de células da netlist. Isso causa falhas falsas, células não resolvidas, black boxes indesejadas ou impossibilidade de verificar determinados cones.

### 10. O ciclo MATCH

A fase MATCH (casamento/alinhamento) tenta mapear cada compare point da referência para um compare point correspondente na implementação.

Exemplo do slide:

```text
a_reg[31]   → referência
a_reg_31_   → implementação
```

Esses nomes são diferentes, mas representam o mesmo bit de registrador. A síntese frequentemente converte caracteres especiais como colchetes em sublinhados. O Formality conhece muitas convenções de renomeação e consegue casar automaticamente muitos pontos.

Mas nem sempre o match automático é suficiente. Ele pode falhar quando:

- A síntese renomeia agressivamente objetos.
- Registradores são otimizados, duplicados ou removidos.
- O design passou por retiming.
- Há clock gating ou transformações sequenciais.
- Há mudanças causadas por UPF/low power.
- Há hierarquia flatten (achatada) na implementação.
- O top foi definido errado.
- Bibliotecas ou black boxes não foram carregadas corretamente.

Quando isso acontece, podem aparecer unmatched points (pontos não casados). Esses pontos precisam ser resolvidos antes de confiar no resultado da verificação.

### 11. Matched, user-specified e unmatched cones

O slide 8 mostra três situações:

- Matched Cone (cone casado): o Formality encontrou correspondência automaticamente.
- User Specified Matched Cone (cone casado especificado pelo usuário): o usuário ou script ajudou a ferramenta a casar os pontos.
- Unmatched Cone (cone não casado): a ferramenta não encontrou correspondência.

Um unmatched cone não significa necessariamente que há erro funcional. Pode ser apenas falta de informação. Mas, enquanto estiver não casado, a ferramenta não consegue provar equivalência daquele ponto.

O objetivo prático da fase de matching é reduzir o conjunto de unmatched points para zero ou para uma condição justificada e compreendida.

### 12. O ciclo VERIFY

A fase VERIFY (verificação) é onde a prova de equivalência acontece. Para cada par de compare points casados, o Formality compara o cone lógico da referência com o cone lógico da implementação.

Os resultados principais são:

- Passing cone (cone aprovado): a função é equivalente.
- Failing cone (cone falhando): a função difere em pelo menos uma condição.
- Unmatched cone (cone não casado): não foi possível comparar por falta de correspondência.

Um failing cone é muito importante. Ele diz que, assumindo o setup atual correto, existe uma diferença lógica real entre referência e implementação.

Mas a frase “assumindo o setup atual correto” é essencial. Uma falha pode indicar:

- Erro real na implementação.
- RTL e netlist de versões diferentes.
- Biblioteca errada.
- Top module errado.
- UPF errado.
- SVF ausente ou incompleto.
- Black box mal configurada.
- Constraints ou constantes de setup ausentes.

Por isso o debug precisa separar erro real de erro de ambiente.

### 13. O ciclo DEBUG

O debug do Formality procura isolar a causa da diferença. No slide 10, o compare point da referência produz `0`, enquanto o da implementação produz `1`. A ferramenta destaca uma região interna do cone para mostrar onde a divergência aparece.

Uma boa depuração segue uma lógica:

1. Verificar se o arquivo correto foi lido.
2. Verificar se reference e implementation são versões correspondentes.
3. Verificar se as bibliotecas foram carregadas.
4. Verificar se o top está correto.
5. Verificar unmatched points.
6. Verificar se há SVF necessário.
7. Verificar black boxes.
8. Verificar UPF/low power, se aplicável.
9. Só então concluir que a implementação está funcionalmente errada.

Isso evita culpar a síntese quando o problema é apenas setup incompleto.

### 14. Como invocar Formality

O slide 11 apresenta modos práticos de chamar a ferramenta.

Script batch típico:

```tcl
fm_shell -f runme.fms | tee runme.log
```

Aqui:

- `fm_shell` chama o shell do Formality.
- `-f runme.fms` executa o script Tcl chamado `runme.fms`.
- `| tee runme.log` grava a saída no arquivo `runme.log` e também mostra na tela.

Chamar diretamente a GUI:

```tcl
formality
```

Chamar GUI já executando script:

```tcl
fm_shell -gui -f runme.fms | tee runme.log
```

Iniciar GUI a partir de uma sessão já aberta:

```tcl
start_gui
```

Ver opções:

```tcl
fm_shell -help
```

A diferença prática é:

- Batch é melhor para regressão e repetibilidade.
- GUI é melhor para aprendizado e debug visual.
- Script + GUI é uma combinação forte: você mantém a repetibilidade e usa a interface para investigar problemas.

### 15. Arquivos gerados pelo Formality

O Formality gera arquivos úteis para rastrear o que aconteceu.

`fm_shell_command.log` registra comandos executados. Isso é valioso porque, se você fez algo manualmente na GUI ou no shell, pode recuperar o histórico e transformar em script.

`formality.log` guarda mensagens informativas, warnings e erros. Em debug, esse arquivo deve ser lido com atenção. Muitas falhas de equivalência começam com avisos anteriores sobre bibliotecas, módulos não resolvidos, black boxes inesperadas ou setup incompleto.

`FM_WORK` é um diretório de trabalho. Ele guarda arquivos temporários usados pela ferramenta.

Arquivos `.lck`, como `fm_shell_command.lck` e `formality.lck`, são arquivos de lock. Eles indicam que uma sessão está usando determinado recurso ou log. Se a ferramenta for encerrada corretamente, os arquivos temporários são removidos. Se houver queda de sessão, podem sobrar arquivos de trabalho e locks.

### 16. O arquivo `.synopsys_fm.setup`

O arquivo `.synopsys_fm.setup` é carregado quando o Formality é iniciado. Ele serve para configurar o ambiente antes do script principal.

Exemplo do slide:

```tcl
set search_path ". ./lib ./netlists ./rtl"
alias h history
```

`set search_path` define caminhos onde a ferramenta vai procurar arquivos. No exemplo:

- `.` significa diretório atual.
- `./lib` pode conter bibliotecas.
- `./netlists` pode conter netlists.
- `./rtl` pode conter arquivos RTL.

`alias h history` cria um atalho: digitar `h` equivale a chamar `history`.

O slide informa três locais de leitura:

```text
formality_root/admin/setup/.synopsys_fm.setup
home directory
current working directory
```

O efeito é cumulativo. Em prática, isso significa que o ambiente final pode ser resultado de comandos globais da instalação, comandos pessoais do usuário e comandos específicos do diretório do projeto.

Boa prática: manter o setup local do projeto claro, versionado e mínimo. Evite depender demais de configurações invisíveis no home do usuário, porque outro usuário ou servidor de regressão pode não ter o mesmo setup.

### 17. Fluxo detalhado do Formality

O slide 14 resume o fluxo operacional completo:

```text
0. Guidance / SVF
1. Read Reference
1. Link Reference / set top
1. Load Reference UPF
2. Read Implementation
2. Link Implementation / set top
2. Load Implementation UPF
3. Setup
4. Match
5. Verify
6. Debug, se falhar
```

O passo 0, Guidance (orientação), é especialmente importante para o próximo bloco. O SVF contém informações geradas pela síntese para ajudar o Formality a entender transformações realizadas pelo Design Compiler.

Sem SVF, o Formality ainda pode resolver equivalências simples. Mas transformações mais complexas podem gerar unmatched points ou failing points porque a ferramenta não recebeu a orientação necessária.

### 18. GUI do Formality

A GUI é recomendada para novos usuários porque transforma o fluxo em abas e etapas visuais. Ela também mostra os comandos Tcl correspondentes. Isso tem valor didático enorme: você pode executar ações na interface e observar quais comandos aparecem.

Mas a GUI não deve virar dependência permanente. Em fluxo profissional, o objetivo é construir scripts repetíveis.

A melhor forma de estudar é:

1. Usar GUI para entender.
2. Observar os comandos Tcl gerados.
3. Transferir os comandos para scripts `.fms`.
4. Rodar batch.
5. Voltar à GUI quando houver debug difícil.

### 19. Formality e low power

Os últimos slides conectam Formality com low power verification (verificação de baixo consumo). Em designs modernos, o comportamento do circuito pode depender de estados de potência. O RTL sozinho pode não carregar toda a intenção de baixo consumo. O UPF descreve power intent (intenção de potência), incluindo domínios de energia, estados, isolamento, retenção e outras estratégias.

O Formality adere ao IEEE 1801, que é o padrão UPF. Ele pode verificar estados legais de potência definidos na power state table (tabela de estados de potência), incluindo power-up (ligamento) e power-down (desligamento).

Também pode lidar com técnicas avançadas e special low-power cells (células especiais de baixo consumo), como:

- Isolation cells (células de isolamento).
- Retention cells (células de retenção).
- Level shifters (conversores de nível).
- Power switches (chaves de potência).

O slide também menciona VCLP, ferramenta/fluxo de static low-power rule checking (checagem estática de regras de baixo consumo). A ideia é que, além de provar equivalência, o fluxo precisa garantir que as regras de power intent estejam corretas.

### 20. Low Power Verification Flow

No slide 17, os requisitos de dados são importantes:

- RTL e UPF devem ser simulados com VCS NLP.
- A netlist do Design Compiler pode estar em Verilog ou DDC.
- O UPF deve ser gerado pelo comando `save_upf` do Design Compiler.
- Bibliotecas tecnológicas precisam modelar células power-aware com pinos de potência e funções de power-down.

O comando:

```tcl
save_upf
```

é importante porque o UPF usado na equivalência precisa refletir a interpretação/transformação feita pela síntese. Se você usar um UPF inconsistente com a netlist, o Formality pode comparar modelos incompatíveis.

### 21. Script básico do Formality explicado linha por linha

Script do slide:

```tcl
#Step 0: Guidance
set_svf default.svf
```

`set_svf default.svf` carrega o SVF. Esse arquivo contém guidance (orientação) sobre transformações feitas pela síntese. Ele é fundamental quando o Design Compiler renomeia, otimiza ou transforma estruturas.

```tcl
#Step 1: Read Reference Design
read_verilog -r alu.v
set_top alu
load_upf -r alu.upf
```

`read_verilog -r alu.v` lê o Verilog da referência. A opção `-r` indica reference (referência).

`set_top alu` define o módulo top como `alu`. Sem top correto, a ferramenta pode comparar a hierarquia errada.

`load_upf -r alu.upf` carrega o UPF da referência.

```tcl
#Step 2: Read Implementation Design
read_db -i lsi_10k.db
read_verilog -i alu.fast.vg
set_top -auto
load_upf -i alu.fast.upf
```

`read_db -i lsi_10k.db` lê a biblioteca no lado da implementação. A opção `-i` indica implementation (implementação).

`read_verilog -i alu.fast.vg` lê a netlist Verilog da implementação. A extensão `.vg` costuma indicar Verilog gate-level.

`set_top -auto` pede para a ferramenta inferir automaticamente o top da implementação. Em projetos maiores, muitas equipes preferem explicitar o top para evitar ambiguidade.

`load_upf -i alu.fast.upf` carrega o UPF da implementação.

```tcl
#Step 3: Setup
#No setup required here
```

Neste exemplo, não há setup adicional. Em projetos reais, esta etapa pode incluir constantes, black boxes, configurações de clock/reset, tratamento de scan, constraints formais ou ajustes específicos.

```tcl
#Steps 4 & 5: Match and Verify
verify
```

`verify` executa a verificação. Em scripts simples, esse comando pode englobar o fluxo de match e verify. Em fluxos mais controlados, é comum separar comandos de matching, relatórios e verificação.

## Conceitos difíceis explicados em profundidade

### Equivalence Checking

Equivalence checking (verificação de equivalência) compara dois modelos para provar que produzem o mesmo comportamento observável. O uso clássico é RTL versus netlist.

O Formality não depende de test vectors (vetores de teste). Ele tenta provar a equivalência matematicamente. Isso remove o problema de corner cases não simulados.

Erro comum: acreditar que equivalence checking prova que o chip atende à especificação. Não prova. Ele prova que dois modelos são equivalentes.

### Reference Design e Implementation Design

Reference design (projeto de referência) é o modelo golden. Implementation design (projeto de implementação) é o modelo transformado.

Se o reference design estiver errado, a equivalência pode passar mesmo assim. Por isso o RTL precisa ser validado antes.

### Logic Cone

Logic cone (cone lógico) é a região combinacional que alimenta um compare point. É a unidade lógica que a ferramenta analisa entre fronteiras como registradores, portas primárias e black boxes.

Erro comum: achar que cone lógico é necessariamente um módulo do RTL. Não é. Um cone pode atravessar hierarquia ou ser apenas parte de um módulo.

### Compare Point

Compare point (ponto de comparação) é onde a ferramenta observa equivalência entre referência e implementação. Registradores, saídas primárias e entradas de black boxes são os exemplos mais comuns.

Erro comum: ignorar unmatched compare points. Se pontos importantes não foram casados, a prova de equivalência fica incompleta.

### Matching

Matching (casamento/alinhamento) é a fase em que o Formality tenta mapear pontos da referência para pontos da implementação.

Pode ser automático por nome, por regras ou guiado por SVF. Quando falha, surgem unmatched points.

Erro comum: tentar depurar failing points antes de resolver unmatched points importantes.

### Verification

Verification (verificação) é a prova de equivalência nos pares casados. Um passing point indica equivalência provada naquele cone. Um failing point indica divergência lógica, setup incorreto ou falta de guidance.

Erro comum: assumir que toda falha é bug da síntese. Muitas falhas vêm de ambiente incorreto.

### Debug

Debug (depuração) identifica onde a divergência aparece e ajuda a chegar à causa. Pode envolver GUI, reports, análise de cones, counterexamples e revisão do setup.

Erro comum: olhar apenas para o ponto final que falhou e não para a cadeia de causas: bibliotecas, top, black boxes, UPF, SVF e versões de arquivos.

### SVF

SVF significa Setup Verification for Formality ou, no uso prático Synopsys, o arquivo de orientação gerado pela síntese para guiar o Formality. Ele registra transformações feitas pelo Design Compiler.

O próximo bloco aprofunda isso. Nesta aula, o SVF aparece no passo 0 como guidance (orientação). Sua função é reduzir problemas de matching e verification quando a síntese fez transformações que não são triviais de reconhecer apenas pelos nomes.

### UPF e Low Power

UPF descreve power intent (intenção de potência). Em designs com múltiplos domínios de energia, isolamento, retenção e power states, a equivalência precisa considerar o comportamento em estados legais de potência.

Erro comum: comparar netlist low power sem usar UPF consistente. Isso pode gerar falhas falsas ou deixar passar problemas de power intent.

### `.synopsys_fm.setup`

Esse arquivo configura o ambiente automaticamente na inicialização. Ele pode definir search paths, aliases e variáveis.

Erro comum: depender de configurações pessoais escondidas no home directory. O script pode funcionar para uma pessoa e falhar para outra.

## Figuras, diagramas e waveforms importantes

### Página 1 — Comparação entre reference e implementation

A primeira figura mostra a essência do Formality: um modelo de referência e um modelo de implementação com a pergunta “são funcionalmente equivalentes?”. Estude essa figura como a definição mental do curso.

### Página 1 — Formality no fluxo

A segunda figura mostra que Formality aparece em vários pontos do fluxo, junto com simulação, static rule checking, síntese e physical synthesis. A principal lição é: equivalence checking deve acompanhar o fluxo, não ser usado apenas no fim.

### Página 2 — Cone lógico

A figura do cone roxo é central. Ela mostra entradas do cone à esquerda e compare point à direita. Ela deve ser memorizada porque todos os próximos conceitos dependem dela.

### Página 3 — Fluxo READ, MATCH, VERIFY, DEBUG

O fluxograma com `REF`, `IMP` e `LIB` mostra a arquitetura conceitual do Formality. Ele lê os dois modelos e bibliotecas, particiona em cones, casa pontos, verifica pares e gera debug/reports.

### Página 4 — Matching

As figuras de matching mostram que nem todos os cones são automaticamente resolvidos. Alguns são casados por usuário e outros ficam unmatched. Essa distinção é essencial para interpretar relatórios.

### Página 5 — Verification e Debug

A figura de verification classifica cones como passing, failing ou unmatched. A figura de debug mostra uma divergência concreta: a referência produz `0`, a implementação produz `1`. Esse é o tipo de evidência que orienta a investigação.

### Página 7 — Fluxo detalhado do Formality

O fluxograma com passos 0 a 6 é o roteiro operacional da ferramenta. Ele é especialmente importante para montar scripts e para entender a ordem correta: guidance, read, link, UPF, setup, match, verify e debug.

### Página 9 — Low Power Flow e script básico

O fluxo low power mostra a integração RTL+UPF, Design Compiler/Power Compiler, Gate+UPF, IC Compiler e Formality. O script básico traduz o fluxo em comandos Tcl e deve ser usado como esqueleto inicial de estudo.

## Pontos de prova e revisão

1. Formality faz equivalence checking (verificação de equivalência), não verificação funcional completa contra especificação.
2. A ferramenta assume que o reference design está funcionalmente correto.
3. Equivalence checking não requer test vectors.
4. A verificação é matematicamente exaustiva dentro do modelo/configuração analisado.
5. Se referência e implementação forem funcionalmente diferentes, a ferramenta pode fornecer counterexamples.
6. O fluxo correto simula/verifica o RTL primeiro e usa equivalência ao longo do fluxo.
7. Logic cone é o bloco de lógica combinacional que alimenta um compare point.
8. Compare points comuns: primary outputs, registers/latches e black box inputs.
9. Entradas de cones incluem saídas de registradores, entradas primárias e saídas de black boxes.
10. Fase READ particiona os designs em cones e compare points.
11. Fase MATCH alinha compare points correspondentes entre referência e implementação.
12. Muitos compare points casam por nome, mas transformações complexas podem exigir guidance.
13. SVF aparece como guidance no passo 0 do fluxo.
14. Fase VERIFY checa a funcionalidade de cada par de compare points.
15. Fase DEBUG isola erros de implementação ou problemas de setup.
16. GUI é recomendada para usuários novos e mostra comandos Tcl correspondentes.
17. `.synopsys_fm.setup` é lido na invocação do Formality.
18. Setup é cumulativo entre instalação, home directory e current working directory.
19. Logs importantes: `fm_shell_command.log` e `formality.log`.
20. Para low power, UPF e bibliotecas power-aware precisam estar consistentes.

### Pegadinhas prováveis

- “Formality prova que o RTL está correto?” Não. Ele prova equivalência entre referência e implementação.
- “Equivalence checking precisa de vetores de teste?” Não.
- “Se a equivalência passa, o chip está correto?” Só se a referência estiver correta e o setup da comparação estiver correto.
- “Unmatched point é sempre erro funcional?” Não. Pode ser falta de matching/guidance/setup.
- “Failing point é sempre erro da síntese?” Não. Pode ser erro real ou setup incorreto.
- “A GUI substitui Tcl?” Não. Ela ajuda, mas o script é necessário para repetibilidade.
- “UPF é opcional em design low power?” Não se a comparação precisa representar power intent corretamente.

## Relação com projeto/laboratório

Esta aula ajuda a entender como a verificação formal entra depois da síntese RTL. Em um projeto/lab típico com Design Compiler e Formality, o fluxo mental será:

```text
RTL original
   ↓
Design Compiler gera netlist
   ↓
Design Compiler gera SVF
   ↓
Formality lê RTL como referência
   ↓
Formality lê netlist como implementação
   ↓
Formality lê bibliotecas
   ↓
Formality usa SVF como guidance
   ↓
Formality faz match e verify
```

Quando aparecerem scripts `.fms`, comandos como `read_verilog`, `read_db`, `set_top`, `set_svf`, `load_upf` e `verify`, eles devem ser lidos como partes desse fluxo.

Também ajuda a interpretar logs:

- Se há erro de biblioteca, olhar `read_db` e search path.
- Se há erro de top, olhar `set_top`.
- Se há muitos unmatched points, olhar match, nomes, SVF e transformações.
- Se há falhas low power, olhar UPF, `save_upf`, bibliotecas power-aware e VCS NLP.

Para o próximo bloco, o ponto mais importante é guardar que SVF entra no passo 0 como guidance. Ele será a ponte entre o que o Design Compiler fez e o que o Formality precisa entender.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

## Próximo bloco

Bloco 052 — `02 SVF Guidance`

Arquivo para anexar no próximo processamento:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\02 SVF Guidance.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\02 SVF Guidance.md
```
