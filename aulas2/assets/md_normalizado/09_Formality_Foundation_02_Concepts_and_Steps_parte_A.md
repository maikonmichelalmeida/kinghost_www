# 02 Concepts and Steps — parte A

## Controle do bloco

- **Bloco:** 059
- **Curso:** 09 Formality Foundation
- **Aula:** 02 Concepts and Steps — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\02 Concepts and Steps.docx`
- **Faixa de slides processada:** 1-20
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\02 Concepts and Steps_parte_A.md`
- **Próximo bloco recomendado:** Bloco 060 — `02 Concepts and Steps - parte B`, processando slides 21-39 do mesmo arquivo

## Resumo executivo

Esta aula aprofunda o modo como o Formality organiza uma verificação de equivalência. A ideia central é que comparar dois projetos inteiros diretamente pode ser difícil demais; por isso, o Formality divide o design em **logic cones** (cones lógicos) e **compare points** (pontos de comparação), tenta casar os pontos equivalentes entre o projeto de referência e o projeto de implementação, e depois verifica cada par de cones.

O material usa uma analogia com comparação de imagens: para saber se duas imagens são iguais, não se compara “a imagem inteira” de maneira abstrata; divide-se a imagem em pixels, casa-se cada pixel pela posição e verifica-se a cor. Em equivalência formal, os “pixels” são os **compare points** (pontos de comparação), e a “cor do pixel” é a função lógica que chega naquele ponto. Essa analogia é fundamental para entender a sequência **divide → match → verify** (dividir → casar → verificar).

A aula também mostra que o SVF funciona como uma lista de “moves” (movimentos) de otimização, semelhante a uma notação de partida de xadrez. Em vez de o Formality tentar adivinhar sozinho como a síntese transformou RTL em netlist, ele recebe do Design Compiler uma sequência de orientações que explicam mudanças como merge de registradores, renomeações, reestruturações de datapath e transformações que melhoram QoR. Com essas orientações, o Formality aplica transformações verificadas no lado de referência, deixando o match e o verify muito mais fáceis.

No final da parte A, a aula passa pelo fluxo operacional do Formality: **Guide**, **Read**, **Setup**, **Match**, **Verify** e **Debug**. Ela também reforça comandos essenciais como `set_svf`, `read_verilog`, `read_db`, `set_top`, `match`, `verify`, além de estados do shell como `setup`, `match` e `verify`.

## Texto extraído e organizado por slide

### Slide 1 — How can you verify two pictures are the same? (Como verificar se duas imagens são iguais?)

Texto principal extraído:

- **How can you verify two pictures are the same?** (Como verificar se duas imagens são iguais?)
- **Possible Algorithm:**
  1. Divide up each picture into small squares or pixels.
  2. Match each pixel between pictures, based on coordinate.
  3. Verify each pixel is the same RGB colour.
  4. If all pixels the same then pictures the same.
- Faixa inferior do vídeo: **A lot of comparison algorithms are: Divide, Match, Verify** (Muitos algoritmos de comparação são: dividir, casar, verificar). **Equivalency checking is no different** (Verificação de equivalência não é diferente).

Interpretação:

A figura compara duas fotografias aparentemente iguais. A proposta do slide é transformar uma comparação grande e difícil em várias comparações pequenas. Essa é exatamente a filosofia do Formality: quebrar um design em partes comparáveis, alinhar essas partes entre referência e implementação e verificar cada uma matematicamente.

### Slide 2 — Key Equivalence Checking Concepts: Logic Cones and Compare Points

Texto extraído:

- **Key Equivalence Checking Concepts** (Conceitos-chave de verificação de equivalência)
- **Logic Cones and Compare Points** (Cones lógicos e pontos de comparação)
- The dividing points in the design are called **compare points** (Os pontos de divisão do projeto são chamados de pontos de comparação).
- Broadly, what do we require of equivalency checking compare points?
  - Breaks up the design to make functionality easier, cf. pixels.
  - Sum of compare point functionality is complete function of design.
  - Synthesis invariant number of compare points between designs so we can match one to one.
  - Synthesis invariant functionality so we can verify each compare point, cf. RGB colour.
- **Common Formality Compare Points:**
  - Primary output.
  - Register or latch.
  - Input of a black-box.
- **Logic Cone:**
  - A block of combinational logic which drives a compare point.

Interpretação:

O slide estabelece a base da aula: o Formality não compara uma “massa” de lógica sem estrutura. Ele escolhe pontos que dividem o design. Cada ponto de comparação recebe uma função lógica combinacional vinda de entradas, registradores anteriores ou saídas de black boxes. Essa função é o **logic cone** (cone lógico).

### Slide 3 — Key Concept — Logic Cone

Texto e figura extraídos:

- **Key Concept — Logic Cone** (Conceito-chave — cone lógico)
- **Compare Point Function = Logical function (Inputs)**
- **Function represented as Logic Cone**
- Entradas do cone:
  - Registers (registradores)
  - Primary Input Ports (portas primárias de entrada)
  - Black Box Output Pins (pinos de saída de black boxes)
- Compare points:
  - Registers (registradores)
  - Primary Output Ports (portas primárias de saída)
  - Black Boxes Input Pins (pinos de entrada de black boxes)

Interpretação da figura:

A figura mostra um triângulo representando a lógica combinacional. À esquerda ficam as fontes: registradores, entradas primárias e saídas de black boxes. À direita fica o **compare point** (ponto de comparação), que pode ser um registrador, uma saída primária ou uma entrada de black box. O que o Formality verifica é se a função lógica que chega ao compare point no projeto de referência é equivalente à função lógica que chega ao ponto correspondente no projeto de implementação.

### Slide 4 — Design Read: Initial Division of Designs into Logic Cones

Texto extraído:

- **Design Read: Initial Division of Designs into Logic Cones** (Leitura do design: divisão inicial dos projetos em cones lógicos)
- Reference Design (projeto de referência)
- Implementation Design (projeto de implementação)
- Pergunta destacada na faixa inferior:
  - **What about synthesis optimizations that change number of compare points or logic cone boundaries, e.g. register merging?**
  - Tradução: O que acontece com otimizações de síntese que mudam o número de compare points ou as fronteiras dos logic cones, por exemplo, merge de registradores?

Interpretação da figura:

O slide mostra dois blocos: referência e implementação. Cada triângulo pequeno representa um cone lógico/ponto de comparação. A ideia é que, durante a leitura do design, o Formality inicialmente particiona os dois projetos. O problema é que a síntese pode alterar essa estrutura: pode fundir registradores, inverter polaridades, reestruturar datapaths ou mudar fronteiras entre cones. Quando isso acontece, uma comparação “um para um” simples pode deixar de funcionar.

### Slide 5 — Match: (1) SVF Verification and Application

Texto e elementos extraídos:

- **Match: (1) SVF Verification and Application**
- O diagrama mostra um arquivo SVF com:
  - Guide1
  - Guide2
  - Guide3
  - Guide4
- Exemplo de verificação:

```text
# Example verification
# For SVF register merge
if registers equivalent
    merge registers
else
    reject svf guide
```

- Exemplo de comando SVF:

```text
guide_change_names -design \
mydes { { a_reg[31] a_reg_31_ } }
```

- Faixa inferior:
  - **The reference container is transformed by verified SVF**
  - Tradução: O container de referência é transformado por SVF verificado.

Interpretação da figura:

O SVF entra como uma lista de guias de transformação. No exemplo, o Design Compiler informa que houve uma mudança de nome de `a_reg[31]` para `a_reg_31_`. O Formality não aceita cegamente a orientação: ele verifica se a transformação é válida. Se for válida, aplica a transformação no lado de referência. Se não for válida, rejeita aquele guia.

### Slide 6 — Match: (1) SVF Verification and Application — continuação

Texto extraído:

- **For register merge number of registers, i.e. compare points, now same as implementation: Matching easier**
- Tradução: Para merge de registradores, o número de registradores, isto é, de compare points, agora fica igual ao da implementação; o matching fica mais fácil.
- **Reference name now the same as implementation name: Matching easier**
- Tradução: O nome de referência agora é igual ao nome da implementação; o matching fica mais fácil.
- Faixa inferior:
  - **The reference container is transformed by verified SVF. This makes matching easier.**

Interpretação:

Aqui o slide mostra o benefício prático do SVF: ele aproxima o design de referência da forma estrutural da implementação, sem mudar sua função. Quando os nomes e a quantidade de compare points ficam coerentes com a implementação, o match passa a ser muito mais direto.

### Slide 7 — Match: (2) Classic Matching

Texto extraído:

- **Match: (2) Classic Matching**
- **Matches Corresponding Points between Designs**
- Reference Design
- Implementation Design
- **With SVF these point match exactly by name**
- **SVF makes matching straightforward, names are same in REF and IMPL**

Interpretação da figura:

Depois que o SVF foi aplicado, o processo clássico de matching tenta casar compare points correspondentes. No exemplo, o compare point da referência e o da implementação passam a ter nomes compatíveis, como `a_reg_31_`. Isso torna o casamento por nome simples.

### Slide 8 — Match: (2) Classic Matching — visão global

Texto e legenda extraídos:

- Reference Design
- Implementation Design
- Legenda:
  - Matched Cone (cone casado)
  - Unmatched Cone (cone não casado)

Interpretação:

O slide mostra dois conjuntos grandes de cones. A maioria dos cones está casada, mas alguns permanecem sem correspondência. Isso é importante porque compare points não casados não podem ser verificados diretamente. Quando sobram pontos não casados, pode ser sinal de problema de setup, ausência de SVF, nomes alterados sem regra de comparação, black boxes inconsistentes ou diferenças reais de estrutura.

### Slide 9 — Verification: Verifies Logical Equivalence for Each Logic Cone

Texto extraído:

- **Verification**
- **Verifies Logical Equivalence for Each Logic Cone**
- Legenda:
  - Passing Cone (cone que passou)
  - Failing Cone (cone que falhou)
  - Unmatched Cone (cone não casado)

Interpretação:

Depois do match, o Formality verifica pares de cones lógicos. Se os cones têm a mesma função, o compare point passa. Se existe diferença funcional, o ponto falha. Se o ponto não foi casado, ele aparece como unmatched e não pode ser verificado como um par válido.

### Slide 10 — The Debug Cycle

Texto extraído:

- **The Debug Cycle**
- **Isolation of root cause of any verification failures**
- Reference Design Cone
- Implementation Design Cone

Interpretação da figura:

A figura mostra dois cones: referência e implementação. Há uma diferença destacada em vermelho dentro da lógica da implementação. A saída da referência é `0`, enquanto a saída da implementação é `1`. O objetivo do debug é rastrear por que a função divergiu e localizar a causa raiz, que pode ser diferença real de RTL/netlist, setup incorreto, scan não desabilitado, clock-gating mal interpretado, black box sem correspondência ou orientação SVF rejeitada.

### Slide 11 — Formality Flow Overview: Guide

Texto extraído:

- **Formality Flow Overview: Guide**
- Etapas no fluxograma:
  - Guide
  - Read Reference Design
  - Read Implementation Design
  - Check reading
  - Setup
  - Match
  - Check Matching and SVF summary
  - Verify
  - Pass/Fail/Inconclusive
  - Debug
- Notas laterais:
  - For Design Compiler design.
  - Set auto setup: `synopsys_auto_setup`.
  - Set an SVF: `set_svf`.

Interpretação:

O fluxo começa pela etapa **Guide** (orientação). Para designs vindos do Design Compiler, o recomendado é habilitar o Auto Setup Mode e apontar para o SVF. Essa etapa fornece ao Formality a informação necessária para entender as transformações feitas pela síntese.

### Slide 12 — Formality Flow Overview: Read

Texto extraído:

- **Formality Flow Overview: Read**
- Notas laterais:
  - Read in libraries, e.g. standard cells, RAMs: `read_db`.
  - Read in reference design:
    - `read_verilog -r`
    - `read_vhdl -r`
    - `set_top`
  - Read in implementation design:
    - `read_verilog -i`
    - `set_top`

Interpretação:

A etapa **Read** (leitura) carrega os designs e bibliotecas. O design de referência normalmente é RTL e vai para o container `r`. O design de implementação normalmente é netlist gate-level e vai para o container `i`. Bibliotecas como standard cells e RAMs precisam ser carregadas para que a netlist seja interpretada corretamente.

### Slide 13 — Formality Flow Overview: Setup

Texto extraído:

- **Formality Flow Overview: Setup**
- **Optional step for additional setup:**
  - `set_constant`

Interpretação:

A etapa de setup é opcional, mas pode ser decisiva. Ela serve para ajustar condições que não fazem parte da função normal a ser comparada. Exemplo clássico: desabilitar scan com `set_constant`, fixando o sinal de scan enable no estado funcional. Se o circuito de teste ficar ativo, o Formality pode comparar o modo errado do design.

### Slide 14 — Formality Flow Overview: Match

Texto extraído:

- **Formality Flow Overview: Match**
- **Match the compare points:**
  - `match`
- Subetapas mostradas na figura:
  1. Apply SVF (aplicar SVF)
  2. Match up compare points (casar pontos de comparação)

Interpretação:

A etapa `match` primeiro aplica o SVF, se houver, e depois tenta casar compare points. O ponto importante é que o `match` não é apenas “comparar nomes”: ele inclui a aplicação de guidance (orientação), matching por nome, análise de assinatura e possivelmente regras manuais.

### Slide 15 — Formality Flow Overview: Debug

Texto extraído:

- **Formality Flow Overview: Debug**
- When the verification does not pass:
  - `analyze_points`
- Numerous debug features in the GUI.

Interpretação:

Se a verificação não passar, o fluxo segue para debug. O comando `analyze_points` ajuda a encontrar causas prováveis para compare points que falharam ou foram difíceis de verificar. A GUI oferece navegação entre pontos falhos, cones lógicos, padrões de falha e código fonte.

### Slide 16 — The Formality GUI: Tabs for each step

Texto extraído:

- **The Formality GUI: Tabs for each step**
- Guides you through the flow.
- Context sensitive help.
- Tabs for each step of the flow.

Interpretação:

A GUI organiza o fluxo em abas: Guide, Reference, Implementation, Setup, Match, Verify e Debug. Para quem está começando, isso reduz a necessidade de memorizar todos os comandos Tcl logo de início, mas a GUI também mostra os comandos equivalentes, o que ajuda a aprender o fluxo em script.

### Slide 17 — Basic Formality Script

Texto extraído e reconstruído:

```tcl
#Step 0: Guidance
set synopsys_auto_setup true
set_svf default.svf

#Step 1: Read Reference Design
read_verilog -r alu.v
set_top alu

#Step 2: Read Implementation Design
read_db -i lsi_10k.db
read_verilog -i alu.fast.vg
set_top alu_0

#Step 3: Setup
#No setup required here

#Step 4: Match
match

#Step 5: Verify
verify
```

Interpretação:

Esse script é o esqueleto clássico. Ele configura guidance, lê referência, lê implementação, faz setup se necessário, casa os compare points e verifica. O comando `verify` é o momento em que a equivalência é provada ou refutada.

### Slide 18 — Auto Setup Mode: OOTB success

Texto extraído:

- **Auto Setup Mode: OOTB success**
- Variable:

```tcl
set synopsys_auto_setup true
```

- Assumptions made in Design Compiler are also made in Formality.
- Increases **out-of-the-box (OOTB)** verification success rate.
- Set the auto setup variable before running the `set_svf file.svf` command.
- Works with or without the SVF, does more with SVF.
  - Handles undriven signals like synthesis.
  - RTL interpretation like synthesis, still independent RTL reader.
  - Auto-enable clock-gating and auto-disable scan, requires SVF.
- You can overwrite the SVF passed variables and commands.
  - Transcript summary shows variable settings.
  - Variables take the last value that was set.

Interpretação:

OOTB success significa sucesso “out-of-the-box” (pronto para funcionar com pouca configuração manual). O `synopsys_auto_setup` tenta alinhar a interpretação do Formality com as suposições feitas pelo Design Compiler. Isso reduz falsos erros causados por diferenças de setup.

### Slide 19 — What Auto Setup Mode Does

Texto extraído:

- **What Auto Setup Mode Does**
- Runs the following commands by default, and more:

```tcl
set hdlin_ignore_parallel_case false
set hdlin_ignore_full_case false
set svf_ignore_unqualified_fsm_information false
set verification_set_undriven_signals synthesis
set verification_verify_directly_undriven_output false
```

- Design Compiler places additional setup information in the SVF:
  - Clock-gating notification.
  - Scan mode disable information.

Interpretação:

Essas variáveis fazem o Formality se comportar mais parecido com a síntese. Por exemplo, `full_case` e `parallel_case` são pragmas que podem afetar a interpretação de RTL. Sinais não dirigidos também são tratados como na síntese. O SVF ainda pode trazer informações específicas sobre clock-gating e desabilitação de scan.

### Slide 20 — Auto Setup Mode: OOTB success — repetição/reforço

Texto extraído:

- Variable:

```tcl
set synopsys_auto_setup true
```

- Assumptions made in Design Compiler are also made in Formality.
- Increases out-of-the-box verification success rate.
- Set the auto setup variable before running the `set_svf file.svf` command.
- Works with or without the SVF, does more with SVF.
- You can overwrite the SVF passed variables and commands.

Interpretação:

O slide reforça a mensagem mais importante: habilitar Auto Setup antes de carregar o SVF é uma prática recomendada para designs vindos do Design Compiler. O Auto Setup não substitui o entendimento do fluxo, mas reduz muito o esforço manual e as chances de erro de configuração.

## Aula didática desenvolvida

### 1. A lógica geral: dividir, casar e verificar

A primeira analogia da aula é excelente: comparar duas imagens pixel a pixel. Se você tentar responder “essas duas imagens são iguais?” olhando apenas para a imagem completa, a pergunta parece subjetiva. Mas se você divide a imagem em pixels, o problema vira um conjunto de comparações objetivas: pixel `(x, y)` da imagem A tem o mesmo RGB do pixel `(x, y)` da imagem B?

No Formality acontece algo parecido. Em vez de perguntar diretamente “o RTL inteiro é igual à netlist inteira?”, a ferramenta divide o design em **logic cones** (cones lógicos). Cada cone termina em um **compare point** (ponto de comparação). Depois, a ferramenta tenta encontrar, para cada compare point da referência, o ponto correspondente na implementação. Só então ela verifica se as funções lógicas que alimentam esses pontos são equivalentes.

O fluxo conceitual é:

```text
1. Dividir o design em compare points e logic cones.
2. Casar compare points da referência com compare points da implementação.
3. Verificar se os cones correspondentes implementam a mesma função.
4. Depurar pontos não casados, falhos ou inconclusivos.
```

Essa divisão é o que torna o problema tratável. Em designs reais, a quantidade de lógica é enorme. Comparar o bloco inteiro como uma única função booleana gigantesca seria muito mais difícil. Ao quebrar o problema por cones, o Formality cria unidades menores de prova.

### 2. Compare points: os “pontos de parada” da comparação

**Compare points** (pontos de comparação) são os pontos onde o Formality para para comparar o valor lógico entre referência e implementação. Os principais são:

- **Primary outputs** (saídas primárias): sinais finais expostos para fora do bloco.
- **Registers or latches** (registradores ou latches): elementos sequenciais que guardam estado.
- **Inputs of black boxes** (entradas de black boxes): pontos onde a lógica entra em blocos não verificados internamente.

O motivo para usar registradores como compare points é importante: entre um registrador e outro normalmente existe lógica combinacional. Assim, o Formality pode comparar cada trecho combinacional de forma isolada. Em um design síncrono, isso cria uma fronteira natural entre ciclos de clock.

### 3. Logic cone: a função lógica que chega ao compare point

Um **logic cone** (cone lógico) é o conjunto de lógica combinacional que alimenta um compare point. Se um registrador recebe `D = (a & b) | c`, então o cone lógico daquele registrador inclui os sinais `a`, `b`, `c` e as portas que calculam essa expressão.

A ideia do slide pode ser traduzida assim:

```text
Função do compare point = função lógica das entradas
Essa função é representada como um logic cone.
```

Em termos de verificação, o Formality não precisa que a estrutura interna do cone seja idêntica. Ele precisa provar que a função resultante é equivalente. Por exemplo:

```verilog
assign y = (a & b) | (a & c);
```

pode ser equivalente a:

```verilog
assign y = a & (b | c);
```

A estrutura mudou, mas a função lógica é a mesma. Essa é a essência da equivalência formal.

### 4. Por que a síntese dificulta o matching

O problema surge porque a síntese não apenas troca RTL por portas. Ela otimiza. E otimizar significa alterar estrutura para melhorar **QoR — Quality of Results** (qualidade dos resultados), isto é, timing, área e potência.

O Design Compiler pode fazer transformações como:

- mudar nomes de sinais e registradores;
- fundir registradores equivalentes;
- inverter fase de registradores;
- reestruturar lógica de datapath;
- trocar arquitetura de somadores ou multiplicadores;
- aplicar clock-gating;
- reencodar FSMs;
- remover lógica redundante.

Essas mudanças podem ser totalmente corretas, mas dificultam o trabalho do equivalence checker. Se o número de compare points muda, ou se as fronteiras dos cones mudam, o Formality pode não conseguir casar os pontos apenas por nome.

### 5. SVF como “notação da partida” da síntese

A aula usa a analogia do xadrez. Para saber se uma posição B é continuação válida de uma posição A, existem duas estratégias:

1. Criar um algoritmo geral que olha para A e B e tenta descobrir se B poderia surgir de A.
2. Receber a lista de movimentos e validar cada movimento.

A segunda estratégia é muito mais escalável. Se você tem a notação da partida, basta verificar movimento por movimento.

No Formality, o **SVF — Automated Guidance Setup file** (arquivo automático de configuração e orientação) tem papel parecido. Ele registra os “movimentos” de síntese feitos pelo Design Compiler. Em vez de o Formality tentar adivinhar sozinho todas as transformações entre RTL e netlist, ele recebe guidance (orientação) do Design Compiler.

Exemplos de “moves” no SVF:

- `guide_change_names` para mudança de nomes.
- orientação de register merge.
- orientação de FSM re-encoding.
- orientação de datapath transformation.
- orientação de clock-gating ou scan disable.

O ponto crucial é: o Formality não usa o SVF cegamente. Ele verifica cada orientação. Se uma orientação é comprovada, ela é aplicada. Se não for comprovada, ela é rejeitada.

### 6. Como o SVF transforma o container de referência

Os slides mostram que o container de referência é transformado por SVF verificado. Isso pode soar estranho no começo: se o RTL é a referência golden (dourada), por que transformá-lo?

A resposta é: o Formality transforma a representação interna da referência, não a intenção funcional do projeto. Ele faz isso para aproximar a forma da referência da forma da implementação. Se a síntese renomeou `a_reg[31]` para `a_reg_31_`, o SVF informa essa mudança. O Formality verifica se a mudança é coerente e, se for, atualiza a representação de referência para facilitar o match.

Exemplo extraído do slide:

```text
guide_change_names -design \
mydes { { a_reg[31] a_reg_31_ } }
```

Esse comando indica que um nome na referência corresponde a outro nome na implementação. Após aplicar o guidance, o match por nome fica direto.

### 7. Classic matching depois do SVF

Depois de aplicar o SVF, vem o **classic matching** (matching clássico). Ele tenta casar compare points correspondentes entre referência e implementação.

A ordem conceitual é:

```text
1. Aplicar guidance do SVF.
2. Casar pontos por nome.
3. Usar análise de assinatura para pontos restantes.
4. Reportar pontos ainda não casados.
5. Permitir compare rules ou matches manuais se necessário.
```

Quando o SVF está bom, poucos pontos sobram para intervenção manual. Sem SVF, o usuário pode precisar criar compare rules (regras de comparação), mapear nomes manualmente ou investigar por que pontos não casaram.

### 8. Verify: provar equivalência dos cones

Após o matching, o `verify` executa os algoritmos formais nos pares de compare points. O objetivo é provar que, para todas as combinações possíveis de entradas relevantes, os dois cones produzem o mesmo valor.

Resultados possíveis:

- **Succeeded** (sucedido): a implementação é equivalente à referência.
- **Failed** (falhou): a implementação não é equivalente à referência, ou há problema de setup.
- **Inconclusive** (inconclusivo): nenhum ponto falhou, mas a análise não foi suficiente para concluir.
- **Not run** (não executado): algum problema anterior impediu a verificação.

A aula reforça que um failure (falha) nem sempre significa bug lógico real. Pode ser apenas setup errado, por exemplo scan habilitado, black box mal configurada, biblioteca faltante, SVF rejeitado ou clock-gating mal reconhecido.

### 9. Estados do shell do Formality

O Formality shell tem estados. Os principais citados são:

- `guide`
- `setup`
- `match`
- `verify`

O prompt muda conforme o estado:

```tcl
fm_shell (setup)>
fm_shell (match)>
fm_shell (verify)>
```

Certos comandos não podem ser executados em todos os estados. Por exemplo, se um comando modifica o design, ele normalmente precisa ser executado em `setup`, não em `match` ou `verify`. O comando `setup` pode retornar o shell ao estado de setup.

Exemplo extraído do slide:

```tcl
fm_shell (setup)> set_top fred
fm_shell (setup)> match
fm_shell (match)> verify
fm_shell (verify)> analyze_points -all
fm_shell (verify)> setup
fm_shell (setup)> set_constant $ref/a 0
```

Esse fluxo mostra que, após verificar, o usuário pode voltar para setup, aplicar um ajuste e repetir o processo.

### 10. Auto Setup Mode como prática recomendada

O comando:

```tcl
set synopsys_auto_setup true
```

é enfatizado porque alinha o Formality com suposições feitas pelo Design Compiler. O Auto Setup Mode melhora a taxa de sucesso inicial, especialmente quando combinado com SVF.

Ele ajuda em pontos como:

- sinais não dirigidos;
- interpretação de pragmas `full_case` e `parallel_case`;
- informações de FSM;
- clock-gating;
- scan disable.

A ordem recomendada é:

```tcl
set synopsys_auto_setup true
set_svf default.svf
```

Ou seja, habilitar o modo automático antes de carregar o SVF.

## Conceitos difíceis explicados em profundidade

### Compare point não é “qualquer sinal”

Um compare point é um ponto estrutural relevante onde o Formality decide comparar os dois designs. Isso normalmente coincide com fronteiras funcionais importantes: registradores, saídas primárias e entradas de black boxes. Sinais intermediários combinacionais podem até ser úteis para debug, mas não são necessariamente compare points principais.

A pegadinha é pensar que o Formality compara cada fio interno da referência com cada fio interno da implementação. Não é assim. A síntese pode reorganizar completamente a lógica interna. O que importa é a equivalência nos pontos observáveis escolhidos.

### Logic cone é função, não desenho físico da lógica

O cone lógico não precisa ter as mesmas portas nos dois lados. Ele precisa implementar a mesma função. Uma árvore de portas AND/OR pode virar outra estrutura equivalente. Um somador simples pode virar uma arquitetura carry-save. O Formality tenta provar equivalência funcional, não igualdade visual do circuito.

### Por que SVF é tão importante

Sem SVF, o Formality precisa inferir sozinho como a síntese transformou o design. Para mudanças simples, isso pode funcionar. Para mudanças fortes, como register merge, retiming, register inversion ou datapath optimization, isso pode ser difícil ou impossível sem guidance.

O SVF reduz a complexidade porque registra as transformações feitas pela síntese. Ele permite que o Formality valide os passos, em vez de resolver um problema gigante do zero.

### Applying SVF não é confiar cegamente no Design Compiler

O slide deixa claro: **SVF data is implicitly or explicitly proven in Formality, or it is not used/rejected**. Ou seja, os dados do SVF são provados no Formality, implícita ou explicitamente, ou são rejeitados.

Isso é essencial para confiança. Se o Formality aceitasse qualquer guidance sem validar, a equivalência perderia valor. O SVF orienta, mas a prova continua sendo responsabilidade do Formality.

### Match e verify são etapas diferentes

`match` responde à pergunta:

```text
Qual ponto da referência corresponde a qual ponto da implementação?
```

`verify` responde à pergunta:

```text
Esses pontos correspondentes têm a mesma função lógica?
```

Um design pode ter muitos pontos casados e ainda falhar no verify. Também pode falhar antes por ter muitos pontos não casados. Separar essas etapas ajuda no debug.

### Inconclusive não é pass

Um resultado **inconclusive** (inconclusivo) significa que a ferramenta não provou uma diferença, mas também não provou equivalência. Isso pode ocorrer por timeout, complexidade excessiva ou limitação de solver. Em fluxo de signoff, inconclusive pode bloquear tapeout tanto quanto uma falha, porque a equivalência não foi demonstrada.

## Figuras, diagramas e waveforms importantes

### Comparação de imagens

A figura dos dois auditórios representa a estratégia geral de comparação: dividir em partes menores, casar cada parte e verificar. Essa imagem deve ser memorizada porque resume toda a lógica da aula.

### Cone lógico

O triângulo roxo mostra visualmente que um compare point é alimentado por uma função lógica. As entradas podem vir de registradores, entradas primárias ou saídas de black boxes. A saída do cone é o compare point.

### Design read com muitos cones

A figura com REF e IMPL cheios de triângulos mostra a divisão inicial do design. A mensagem importante é que essa divisão pode ser alterada por otimizações de síntese.

### SVF verification and application

A sequência de blocos mostra o Formality aplicando guidance no container de referência. Essa é uma das figuras mais importantes: o SVF funciona como uma ponte entre a estrutura original RTL e a estrutura otimizada da netlist.

### Classic matching

A figura com dois cones e nomes `a_reg_31_` mostra que, após SVF, os nomes podem casar diretamente. A figura com muitos cones mostra que alguns pontos podem continuar unmatched.

### Verification

A figura com cones pretos, vermelhos e azuis resume os resultados por cone:

- preto: passou;
- vermelho: falhou;
- azul: não casado.

### Debug cycle

A figura dos cones de referência e implementação com valores divergentes mostra o objetivo do debug: isolar a porta, célula, entrada ou transformação que causou a divergência.

### Formality flow overview

Os fluxogramas Guide → Read → Setup → Match → Verify → Debug devem ser vistos como a espinha dorsal do uso do Formality. Cada etapa tem comandos e verificações próprias.

## Pontos de prova e revisão

1. **Compare points** são pontos de divisão do design usados para comparar referência e implementação.
2. Compare points comuns: **primary outputs**, **registers/latches** e **black-box input pins**.
3. **Logic cone** é o bloco de lógica combinacional que alimenta um compare point.
4. O fluxo conceitual é **divide, match, verify**.
5. O SVF contém guidance gerado pelo Design Compiler.
6. O Formality aplica guidance do SVF somente se puder validá-lo; caso contrário, rejeita.
7. O SVF transforma a representação interna do container de referência para facilitar o matching.
8. `match` aplica SVF e casa compare points.
9. `verify` prova equivalência dos cones casados.
10. `verify` pode retornar **Succeeded**, **Failed**, **Inconclusive** ou **Not run**.
11. `synopsys_auto_setup` deve ser habilitado antes de `set_svf`.
12. `read_verilog -r` lê o design de referência no container `r`.
13. `read_verilog -i` lê o design de implementação no container `i`.
14. `read_db -i` lê biblioteca de tecnologia no container de implementação.
15. `set_top` elabora/linka o top-level design.
16. `setup` é usado para ajustes adicionais, como `set_constant`.
17. `analyze_points` aparece no debug quando a verificação não passa.
18. Alguns comandos não podem ser executados em qualquer estado do shell.
19. `printvar`, `help` e `man` são comandos importantes de ajuda.
20. Saved sessions não são portáveis entre releases do Formality.

## Relação com projeto/laboratório

Este bloco prepara o raciocínio necessário para rodar Formality com consciência, seja por GUI ou por script. Ele mostra por que o fluxo não é apenas “carregar dois arquivos e apertar verify”. Antes de verificar, é preciso garantir que:

- o RTL foi lido no container correto;
- a netlist foi lida no container correto;
- as bibliotecas necessárias foram carregadas;
- o top foi definido com `set_top`;
- o SVF foi carregado;
- o Auto Setup Mode foi habilitado;
- scan, clock-gating, black boxes e outras transformações foram tratadas;
- os compare points foram casados corretamente.

A parte do **Lab 2: Running Formality From GUI** (Lab 2: rodando Formality pela GUI) aparece no material, mas o processamento prático do lab fica fora deste fluxo principal. O que deve ser retido aqui é o objetivo do lab: seguir as etapas Guide → Read RTL → Read Netlist → Match → Verify até obter um resultado passing.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

## Próximo bloco

- **Próximo bloco:** Bloco 060 — 02 Concepts and Steps — parte B
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\02 Concepts and Steps.docx`
- **Processar somente:** slides 21-39
- **Salvar em:** `C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\02 Concepts and Steps_parte_B.md`
