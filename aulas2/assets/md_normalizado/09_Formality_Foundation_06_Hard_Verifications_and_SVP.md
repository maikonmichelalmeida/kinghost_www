# 06 Hard Verifications and SVP

## Controle do bloco

- **Bloco:** 066
- **Curso:** 09 Formality Foundation
- **Aula:** 06 Hard Verifications and SVP
- **Prioridade do roteiro:** alta
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\06 Hard Verifications and SVP.docx`
- **Faixa processada:** slides 1-17
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\06 Hard Verifications and SVP.md
```

- **Próximo bloco:** Bloco 067 — `07 Efficient Debugging in Formality - parte A`

---

## Resumo executivo

Esta aula trata de um problema central em equivalence checking com Formality: algumas verificações ficam **hard** — difíceis, demoradas ou inconclusivas — não porque o design esteja funcionalmente errado, mas porque a síntese fez otimizações que transformaram demais certos cones lógicos. O Formality pode ter SVF e ainda assim encontrar alguns pontos difíceis, especialmente em datapaths aritméticos, cadeias grandes de XOR, CRC, ECC, parity trees e otimizações agressivas de Design Compiler.

A mensagem principal é que **não é desejável simplesmente desligar otimizações do Design Compiler de forma global**. Desligar otimizações pode facilitar a verificação, mas pode prejudicar fortemente o **QoR** — timing, area e power. A estratégia boa é mais refinada: usar o Formality para descobrir onde a verificação ficou difícil e devolver essa informação ao Design Compiler por meio de **SVP — Set Verification Priority**, usando o comando:

```tcl
set_verification_priority
```

A aula compara dois fluxos:

1. **SVP flow**  
   Mais comum. Mantém o foco em alto QoR e usa feedback do Formality para ajustar apenas pontos necessários no Design Compiler.

2. **Single Pass simplified verification mode**  
   Mais voltado a tempo de resultado (**TTR — Time To Results**) do que a QoR. Usa:

```tcl
set simplified_verification_mode true
```

antes de ler o RTL no Design Compiler. Esse modo gera uma netlist mais fácil de verificar, mas pode sacrificar mais QoR e não é para todos.

A aula também apresenta `analyze_points` como comando essencial para localizar causas de hard points e gerar recomendações, inclusive comandos `set_verification_priority` que podem ser copiados para o script do Design Compiler.

---

## Texto extraído e organizado por slide

### Slide 1 — Hard verifications and Synthesis Optimizations: Manually tricky

Texto extraído da figura:

- **Most logic cones with optimization 1 easy for Formality.**
- **Occasionally hard. Eg**
  - a) What opt1 is optimizing in particular instance.
  - b) Particular context.
- Caixa amarela:
  - **Manually trying to turn off synthesis optimizations is difficult:**
    - a) What to turn off?
    - b) Where to turn off? Global? Local?
    - c) Does it significantly affect synthesis QoR?

Interpretação da figura:

O slide mostra vários logic cones submetidos a uma otimização de síntese chamada genericamente de `OPT1`. A maioria fica marcada como **Easy**, mas um caso específico fica marcado como **Hard**.

A mensagem é: uma otimização de síntese não é necessariamente ruim para Formality. Na maior parte do design, ela pode ser perfeitamente verificável. O problema é que, em contextos específicos, a mesma otimização pode transformar um cone lógico em algo difícil demais para o solver provar.

A parte importante é a dificuldade de desativar manualmente otimizações:

1. **What to turn off?**  
   Nem sempre é óbvio qual otimização está causando o problema.

2. **Where to turn off? Global? Local?**  
   Se você desliga globalmente, pode facilitar o Formality, mas piorar QoR no design inteiro. Se desliga localmente, precisa saber exatamente onde.

3. **Does it significantly affect synthesis QoR?**  
   Uma mudança pequena para o Formality pode ser cara em timing, area ou power.

Conclusão: a abordagem manual é arriscada. O fluxo precisa ser guiado por análise.

---

### Slide 2 — Recall: Synthesis QoR verification issue

Texto extraído:

- For RTL synthesis the more things allowed to change the better the QoR.
  - QoR: Timing, Area, Power etc.
  - Change: Made up of a number of optimizations.
- The more the logic cone has changed the more difficult it is to prove functional equivalence.
  - Hard/inconclusive: logic cone transformed to something too difficult to prove pass or fail.
  - In most logic cones, for on-by-default DC optimizations SVF is sufficient.
- Destaque:
  - **Even with SVF not all potential hard verification issues solved OOTB.**

Interpretação:

A síntese procura melhorar **QoR**. Para isso, ela transforma a estrutura do design. Quanto mais liberdade o Design Compiler tem, melhor pode ser o resultado em timing, area e power.

Mas existe uma tensão:

```text
mais otimização → melhor QoR
mais transformação → verificação potencialmente mais difícil
```

O SVF ajuda muito, porque registra transformações feitas pelo Design Compiler. Porém, o slide destaca que mesmo com SVF nem todos os casos difíceis são resolvidos **OOTB — out of the box** (pronto, sem ajuste manual).

Isso prepara a necessidade do SVP.

---

### Slide 3 — Set Verification Priority (SVP) flow

Texto extraído:

- Development scenarios where DC QoR is main focus:
  - Use all Design Compiler on-by-default optimizations.
  - Detune DC only if and where necessary.
- After first run, Formality often knows what is causing hard verification.
  - Can be fed back to DC using `set_verification_priority` commands.

Interpretação:

O fluxo SVP parte de uma premissa saudável: primeiro preserve QoR. Não desligue otimizações antes de saber se elas realmente causam problema.

Estratégia:

1. Rode Design Compiler normalmente, com otimizações padrão.
2. Gere netlist e SVF.
3. Rode Formality.
4. Se houver pontos hard/inconclusive/aborted/unverified, use `analyze_points`.
5. O Formality recomenda onde o DC deveria reduzir agressividade ou preservar estrutura.
6. Insira `set_verification_priority` no script do DC.
7. Re-sintetize o design ou bloco.
8. Rode Formality novamente.

Esse é um loop de feedback:

```text
Design Compiler → SVF/netlist → Formality → análise de hard points → set_verification_priority → Design Compiler
```

---

### Slide 4 — Using `set_verification_priority`

Texto extraído:

- Formality identifies operators that are causing verification issues.
- Formality generates guidance for DC targeted at these specific operators.
- Commands are inserted in the DC script — design/block is re-synthesized.
- Caixas:
  - **SVF: DC → FM**
    - What DC did.
  - **SVP: FM → DC**
    - What FM found hard.

Interpretação da figura:

A figura mostra o fluxo entre Design Compiler e Formality.

O **SVF** vai do Design Compiler para o Formality:

```text
SVF = DC → FM = "o que o DC fez"
```

O **SVP** é o caminho de volta:

```text
SVP = FM → DC = "o que o FM achou difícil"
```

Essa distinção é muito importante:

- SVF explica transformações já feitas.
- SVP influencia a próxima síntese para tornar a verificação mais fácil sem sacrificar QoR globalmente.

O comando central é:

```tcl
set_verification_priority
```

Ele deve ser inserido no script do Design Compiler antes da etapa de compile relevante.

---

### Slide 5 — Find Cause of Hard Points: `analyze_points` command

Texto extraído:

- `analyze_points`
  - Can take single or list of compare points as an argument.
  - Options: `-failing`, `-aborted`, `-unverified`, `-all`.
- Analyzes hard points to look for common causes.
  - Modules with complex datapath where SVF has been rejected resulting in a hard verification.
- It is a great command for batch jobs where you can have:

```tcl
analyze_points -all
```

run as part of the script.

Interpretação:

`analyze_points` é o comando que liga debug e ação corretiva. Ele não serve apenas para falhas funcionais; ele também analisa pontos difíceis, como:

- aborted points;
- unverified points;
- failing points;
- pontos complexos de datapath.

Opções importantes:

```tcl
analyze_points -failing
analyze_points -aborted
analyze_points -unverified
analyze_points -all
```

Em batch jobs, é muito útil rodar:

```tcl
analyze_points -all
```

ao final, porque o relatório pode indicar causas e sugestões sem exigir interação manual na GUI.

---

### Slide 6 — Find Resolution of Hard Points: `set_verification_priority` (SVP)

Texto extraído do slide:

- Shell Example report for SVP recommendation through:

```tcl
analyze_points -aborted
```

Trecho reconstruído do relatório:

```text
Analysis Results

Found 1 Hard Datapath Component Module

These modules contain arithmetic operators that may be
contributing to hard verifications.
Lowering the Design Compiler optimization level for these
modules may permit verification to succeed.

r:/WORK/top in file /remote/fmcae4/users/udixit/rtl/test.v
  Module with datapath cell(s):
    r:/WORK/top/DP_OP_23J1_125_5602

Try adding the following command(s) to your Design Compiler script
right before the first compile_ultra command:

current_design top
set_verification_priority [ get_cells { add_28 mult_28 sub_28 } ]

current_design top
```

Interpretação:

Este slide mostra exatamente o tipo de relatório útil que o Formality pode gerar.

O comando `analyze_points -aborted` identifica um módulo de datapath difícil, com operadores aritméticos que podem estar causando a dificuldade de prova. Em seguida, recomenda um comando para inserir no script do Design Compiler:

```tcl
set_verification_priority [ get_cells { add_28 mult_28 sub_28 } ]
```

A ideia é reduzir ou direcionar otimizações nos operadores problemáticos, não no design inteiro.

O comando é colocado **antes do primeiro `compile_ultra`**. Isso é importante porque o DC precisa receber essa prioridade antes de transformar a lógica.

---

### Slide 7 — `Analyze_points`: In GUI

Figura:

A GUI mostra uma aba de análises com categorias como:

- Hard Datapath Component Module.
- Unconstrained Implementation Input.
- Unmatched Cone Input.
- Rejected Datapath Guidance Module.
- X propagation-related categories.
- Dificuldades associadas a compare points.

Interpretação:

O mesmo conteúdo de `analyze_points` pode ser visto na GUI. A interface organiza possíveis causas à esquerda e a descrição/recomendação à direita.

Isso é útil quando o engenheiro está explorando interativamente:

- quais pontos falharam;
- quais foram aborted;
- quais ficaram unverified;
- quais causas comuns foram detectadas;
- quais comandos ou ações são recomendados.

Para fluxo automatizado, o shell é melhor. Para entender visualmente a causa, a GUI ajuda.

---

### Slide 8 — Reducing QoR impact

Figura:

O slide mostra um design dividido em blocos, com áreas destacadas por círculos vermelhos. Alguns operadores parecem ser aritméticos: `+`, `*`, cadeias ou blocos de datapath.

Interpretação:

A imagem reforça a ideia de **localidade**. Em vez de prejudicar QoR do design inteiro, o SVP tenta agir apenas nos pontos problemáticos.

Se a verificação difícil está concentrada em poucos operadores, não faz sentido desotimizar globalmente. A abordagem correta é:

```text
preservar otimizações no restante do design
ajustar somente os cones/operadores problemáticos
```

Isso reduz o impacto em timing, area e power.

---

### Slide 9 — Find Resolution of Hard Points: Verification of large XOR chains

Texto extraído:

- Formality better handles verification of designs that contain large XOR chains, such as CRCs, ECCs, and parity trees.
- Design Compiler, through the use of the command `set_verification_priority` (to be set on designs with CRC logic), will preserve the XOR chains into a hierarchy, and issue new SVF guidance (`guide_group_function`) as necessary.

Comando mostrado:

```tcl
set_verification_priority [ get_designs { *crc* } ]
```

- Formality uses this guidance to create the appropriate hierarchy which assists verification.

Interpretação:

Cadeias grandes de XOR são um caso clássico de verificação difícil. Exemplos:

- CRC;
- ECC;
- parity trees.

Essas estruturas podem ser matematicamente simples, mas estruturalmente difíceis para o solver quando a síntese reestrutura agressivamente os XORs.

O comando:

```tcl
set_verification_priority [ get_designs { *crc* } ]
```

orienta o DC a preservar ou organizar essas cadeias em uma hierarquia verificável. O SVF então inclui guidance novo, como:

```text
guide_group_function
```

O Formality usa essa guidance para construir uma hierarquia adequada e facilitar a prova.

---

### Slide 10 — Example SVP Design Compiler Script

Texto extraído e reconstruído:

```tcl
# Example DC script

set_svf mydesign.svf

# Elaborate design
read_verilog RTL.v
current_design top

# Generated by Formality
set_verification_priority [get_cells { add_28 mult_28 }]

# First compile
compile_ultra -scan -gate_clock
write -format verilog -hier -out top_gates.v
```

Anotação da figura:

```text
Cut-and-pasted from analyze_points
```

Interpretação:

Este slide mostra o uso prático do SVP. O comando recomendado pelo Formality é copiado para o script do Design Compiler.

Ponto essencial:

```tcl
set_verification_priority
```

deve ser inserido depois da elaboração, quando os objetos existem, e antes do compile, para que o DC possa considerar a prioridade durante a síntese.

O objetivo não é transformar o design inteiro em “fácil para Formality”, mas ajustar os objetos específicos identificados.

---

### Slide 11 — Single Pass Flow: Context

Texto extraído:

- Development scenarios where time to results (TTR) trumps QoR.
  - DC often detuned for a higher likelihood of verification success.
- Often too much QoR is surrendered.
  - In some cases the DC settings were based on experience with a 3rd party equivalence checker, i.e. not tuned to what Formality can do.
- Solution:
  - DC and Formality R&D teams work together to provide optimal global settings.

Interpretação:

O Single Pass Flow aparece em um contexto diferente.

No SVP flow, o foco é alto QoR, com ajustes locais quando necessário.

No Single Pass Flow, o foco é **TTR — Time To Results**. Ou seja, obter uma verificação que passe rapidamente, mesmo que isso sacrifique parte do QoR.

O slide alerta que muitos fluxos antigos ou baseados em ferramentas de terceiros “detunavam” o Design Compiler demais, desligando otimizações de forma excessiva para facilitar equivalence checking. Isso sacrifica QoR mais do que necessário.

A proposta do modo simplificado é dar um conjunto global de configurações ajustadas pelas equipes de R&D de DC e Formality, em vez de depender de detuning artesanal.

---

### Slide 12 — Single Pass Flow

Texto extraído:

- Enabled by setting a single DC variable:

```tcl
set simplified_verification_mode true
```

- Default is false.
- Set prior to reading RTL.
- DC produces a synthesized design that is easier to verify.
- THIS IS NOT FOR EVERYONE.
  - Use in place of your existing DC scripting aimed at improving verification success.
  - If you do not detune DC to improve verification success... this is not for you.

Interpretação:

O Single Pass Flow é ativado com:

```tcl
set simplified_verification_mode true
```

Ponto crítico:

```text
deve ser setado antes de ler o RTL
```

Esse modo altera o comportamento global do Design Compiler para produzir uma netlist mais amigável à verificação. Mas o próprio slide avisa:

```text
THIS IS NOT FOR EVERYONE
```

Ele é indicado para fluxos que já fazem detuning manual do DC com objetivo de facilitar a verificação. Se o seu fluxo já usa DC normal e Formality consegue verificar bem, esse modo pode não ser necessário.

---

### Slide 13 — Example Single Pass Design Compiler Script

Texto extraído e reconstruído:

```tcl
# Example DC script

set_svf mydesign.svf

set simplified_verification_mode true

# Elaborate design
read_verilog RTL.v
current_design top

# First compile
compile_ultra -scan -gate_clock
write -format verilog -hier -out top_gates.v
```

Anotação:

```text
Enables single pass flow
```

Interpretação:

O script mostra o ponto de inserção da variável:

```tcl
set simplified_verification_mode true
```

Ela aparece antes de:

```tcl
read_verilog RTL.v
```

Isso confirma a regra do slide anterior: a variável deve ser definida antes da leitura do RTL.

---

### Slide 14 — Single Pass Flow: repetição de contexto

O slide repete a visão do Single Pass Flow com a figura de DC gerando SVF/netlist para Formality.

Interpretação:

A repetição reforça que Single Pass é um fluxo direto:

```text
DC script + RTL
↓
Design Compiler com simplified_verification_mode
↓
SVF + netlist
↓
Formality
```

Diferente do SVP, ele não depende de um primeiro run para gerar recomendações e depois re-sintetizar. Por isso o nome **Single Pass**.

---

### Slide 15 — Alternate Verification Strategy

Texto extraído:

- One option if one can't resynthesize in DC is to try an alternate verification strategy.
- Controlled by variable:

```tcl
set verification_alternate_strategy <name>
```

- Default is `none`, which uses the standard strategy.
- Setting value other than `none` enables an alternate verification solver flow.
- To get a list of current options (2018.06-SP2):

```tcl
fm_shell (setup)> printvar verification_alternate_strategy_names
```

Exemplo mostrado:

```text
verification_alternate_strategy_names =
"none s2 s3 s1 s6 o2 l1 l3 s8 s4 o3 s5 k1 k2 s7 s9 o1 s10 l2"
```

Interpretação:

Se não é possível re-sintetizar no Design Compiler, ainda há uma alternativa: mudar a estratégia de solver no Formality.

A variável:

```tcl
verification_alternate_strategy
```

permite escolher um fluxo alternativo de verificação. O default é `none`, que usa a estratégia padrão.

Isso deve ser visto como plano B. Se possível, o fluxo mais robusto é usar feedback para o Design Compiler via SVP. Mas se a netlist já está congelada ou não há como re-sintetizar, estratégias alternativas podem ajudar.

---

### Slide 16 — Unit Summary

Texto extraído:

- **SVP flow**
  - Focus on verifiable high QoR designs.
  - Feedback loop from Formality to Design Compiler.
  - Use `set_verification_priority` as needed.
  - Most common flow.
- **Single Pass simplified verification mode**
  - Focus on time to results (TTR).
  - Single Pass: Formality run once.
  - `set simplified_verification_mode true`.

Interpretação:

O resumo coloca lado a lado os dois fluxos principais da aula.

**SVP flow:**

- foco em alto QoR;
- usa feedback do Formality;
- ajusta apenas onde necessário;
- é o fluxo mais comum.

**Single Pass simplified verification mode:**

- foco em TTR;
- tenta facilitar a verificação desde a primeira síntese;
- usa `simplified_verification_mode`;
- pode sacrificar mais QoR;
- não é indicado para todos.

---

## Aula didática desenvolvida

### 1. O que é uma hard verification

Uma hard verification é uma verificação que o Formality não consegue resolver facilmente. Ela pode terminar como:

- inconclusive;
- aborted;
- unverified;
- ou extremamente demorada.

Isso não significa automaticamente que o design está errado. Pode significar que o cone lógico foi transformado de uma forma muito difícil de provar.

Exemplo típico:

```text
RTL: uma expressão aritmética clara
Netlist: datapath otimizado, reestruturado, compartilhado e reagrupado
```

O resultado pode ser funcionalmente equivalente, mas difícil de provar.

---

### 2. Por que desligar otimizações globalmente é ruim

Uma reação comum seria:

```text
Se o Formality sofre, desligue otimizações.
```

Mas isso pode prejudicar QoR.

QoR envolve:

- timing;
- area;
- power.

Se você desliga uma otimização no design inteiro para resolver um cone difícil, você pode pagar um preço grande no chip inteiro.

O objetivo do SVP é evitar isso:

```text
não desotimize tudo;
desotimize ou preserve apenas onde o Formality mostrou dificuldade.
```

---

### 3. O triângulo QoR × verificabilidade × tempo

A aula trabalha com três forças:

1. **QoR**
   - melhor timing/area/power.
2. **Verificabilidade**
   - facilidade de provar equivalência.
3. **TTR**
   - tempo até obter resultado.

O SVP prioriza:

```text
alto QoR + verificabilidade local ajustada
```

O Single Pass prioriza:

```text
tempo de resultado + maior chance de verificação passar rapidamente
```

---

### 4. SVF versus SVP

Essa distinção é uma das mais importantes da aula.

```text
SVF: Design Compiler → Formality
```

O SVF diz ao Formality:

```text
foi isso que o DC fez durante a síntese
```

```text
SVP: Formality → Design Compiler
```

O SVP diz ao DC:

```text
isso aqui ficou difícil para o Formality; sintetize com prioridade de verificabilidade
```

Portanto:

- SVF é histórico/guidance da síntese já feita.
- SVP é feedback para a próxima síntese.

---

### 5. Como o `analyze_points` entra no fluxo

Depois de uma verificação difícil, rode:

```tcl
analyze_points -all
```

ou, mais especificamente:

```tcl
analyze_points -aborted
analyze_points -unverified
analyze_points -failing
```

O Formality pode identificar:

- hard datapath component module;
- operadores aritméticos problemáticos;
- SVF guidance rejeitada;
- cones com datapath muito complexo;
- pontos que precisam de intervenção.

Ele pode gerar uma recomendação como:

```tcl
set_verification_priority [ get_cells { add_28 mult_28 sub_28 } ]
```

---

### 6. Onde inserir `set_verification_priority`

O comando deve ser inserido no script do Design Compiler:

1. depois que o design foi lido/elaborado;
2. depois que os objetos existem;
3. antes do `compile_ultra`.

Exemplo:

```tcl
set_svf mydesign.svf

read_verilog RTL.v
current_design top

set_verification_priority [get_cells { add_28 mult_28 }]

compile_ultra -scan -gate_clock
write -format verilog -hier -out top_gates.v
```

Se o comando for colocado depois do compile, ele não terá efeito sobre a síntese que já ocorreu.

---

### 7. SVP em grandes cadeias XOR

Cadeias grandes de XOR aparecem em:

- CRC;
- ECC;
- parity trees.

Essas estruturas podem ser difíceis de verificar se o DC reorganiza tudo de forma agressiva. O SVP pode orientar o DC a preservar uma hierarquia ou gerar guidance melhor.

Exemplo:

```tcl
set_verification_priority [ get_designs { *crc* } ]
```

A ferramenta pode gerar guidance como:

```text
guide_group_function
```

O Formality usa essa guidance para montar a hierarquia apropriada e resolver melhor a verificação.

---

### 8. Single Pass simplified verification mode

O Single Pass é uma solução diferente. Em vez de rodar DC, falhar no Formality, analisar e voltar ao DC, você já configura o DC para gerar uma netlist mais fácil de verificar:

```tcl
set simplified_verification_mode true
```

Mas há restrições:

- default é `false`;
- deve ser definido antes da leitura do RTL;
- pode sacrificar QoR;
- é indicado para fluxos onde TTR é mais importante;
- não é para quem já não detuna o DC.

---

### 9. Alternate verification strategy

Se não é possível re-sintetizar, use:

```tcl
set verification_alternate_strategy <name>
```

e veja opções com:

```tcl
printvar verification_alternate_strategy_names
```

Essa é uma alternativa dentro do Formality, trocando a estratégia do solver.

É útil quando:

- netlist está congelada;
- não há acesso ao DC;
- não se pode alterar a síntese;
- uma estratégia alternativa pode resolver um cone específico.

Mas deve ser usada com cuidado e documentada.

---

## Conceitos difíceis explicados em profundidade

### QoR

QoR significa **Quality of Results**. No contexto de síntese, envolve principalmente:

- timing;
- area;
- power.

Uma netlist mais otimizada pode ter melhor QoR, mas ser mais difícil de provar equivalente ao RTL.

---

### Hard point

Hard point é um compare point ou cone que o Formality tem dificuldade de provar. Pode ser um ponto aborted, unverified ou inconclusive.

---

### Datapath difícil

Datapaths aritméticos podem ser difíceis porque o DC pode transformar operadores:

- soma;
- subtração;
- multiplicação;
- compartilhamento de operadores;
- reestruturação de carry;
- otimização de constantes.

O resultado pode ser funcionalmente igual, mas estruturalmente muito diferente.

---

### `set_verification_priority`

Comando do Design Compiler usado para dizer:

```text
este objeto deve ser sintetizado com maior prioridade para verificabilidade formal
```

Ele não deve ser aplicado cegamente em tudo. O ideal é aplicá-lo nos objetos recomendados pelo Formality.

---

### `guide_group_function`

Tipo de guidance SVF usado para ajudar o Formality a agrupar funções, especialmente em casos como grandes cadeias XOR.

---

### `simplified_verification_mode`

Variável do Design Compiler que ativa um modo global de síntese mais amigável à verificação:

```tcl
set simplified_verification_mode true
```

Deve ser definida antes de ler o RTL.

---

### `verification_alternate_strategy`

Variável do Formality que troca a estratégia de solver:

```tcl
set verification_alternate_strategy <name>
```

O default é:

```text
none
```

---

## Figuras e diagramas importantes

### Figura dos cones Easy/Hard

Mostra que uma mesma otimização pode ser fácil em muitos cones e difícil em poucos. Isso justifica ação local em vez de desligamento global.

---

### Fluxo `set_verification_priority`

Mostra o ciclo:

```text
DC → SVF/netlist → Formality → hard points → SVP → DC
```

A figura diferencia SVF e SVP.

---

### Relatório de `analyze_points -aborted`

Mostra que o Formality pode gerar uma recomendação direta de comando:

```tcl
set_verification_priority [ get_cells { add_28 mult_28 sub_28 } ]
```

---

### Figura de redução de impacto QoR

Mostra que o objetivo é mexer apenas nos blocos problemáticos, preservando QoR no restante do design.

---

### Figura de grandes cadeias XOR

Mostra o caso de CRC/ECC/parity tree, onde `set_verification_priority` ajuda a preservar hierarquia verificável.

---

### Fluxo Single Pass

Mostra que `simplified_verification_mode` muda o comportamento do DC antes da leitura do RTL e gera uma netlist mais fácil para Formality.

---

## Pontos de prova e revisão

1. Nem toda hard verification indica erro funcional.
2. Hard verification pode ocorrer por transformação agressiva de síntese.
3. Mais liberdade para o DC geralmente melhora QoR.
4. Mais transformação pode dificultar equivalence checking.
5. SVF ajuda, mas não resolve todos os hard cases OOTB.
6. Desligar otimizações globalmente pode prejudicar QoR.
7. SVP permite feedback do Formality para o Design Compiler.
8. SVF é DC → FM: informa o que o DC fez.
9. SVP é FM → DC: informa o que o Formality achou difícil.
10. O comando principal do SVP é `set_verification_priority`.
11. `analyze_points` pode gerar recomendações de SVP.
12. `analyze_points -all` é útil em batch jobs.
13. Opções importantes: `-failing`, `-aborted`, `-unverified`, `-all`.
14. `set_verification_priority` deve ser colocado antes do `compile_ultra`.
15. Operadores aritméticos podem causar hard datapath verification.
16. CRC, ECC e parity trees podem gerar grandes cadeias XOR difíceis.
17. Para CRC, pode-se usar `set_verification_priority [ get_designs { *crc* } ]`.
18. `guide_group_function` pode ajudar o Formality a criar hierarquia apropriada.
19. Single Pass Flow usa `set simplified_verification_mode true`.
20. `simplified_verification_mode` deve ser definido antes de ler RTL.
21. Single Pass foca em TTR, não necessariamente em máximo QoR.
22. Single Pass não é para todos.
23. Se não puder re-sintetizar, pode-se tentar `verification_alternate_strategy`.
24. `verification_alternate_strategy` default é `none`.
25. Use `printvar verification_alternate_strategy_names` para listar estratégias disponíveis.

---

## Relação com projeto/laboratório

Fluxo típico com SVP:

```text
1. Rodar Design Compiler normalmente.
2. Gerar netlist e SVF.
3. Rodar Formality.
4. Se houver pontos hard/aborted/unverified, rodar analyze_points.
5. Copiar recomendações de set_verification_priority.
6. Inserir no script do Design Compiler antes do compile_ultra.
7. Re-sintetizar.
8. Rodar Formality novamente.
```

Comandos principais:

```tcl
analyze_points -all
analyze_points -aborted
analyze_points -unverified
analyze_points -failing
```

```tcl
set_verification_priority [ get_cells { add_28 mult_28 sub_28 } ]
set_verification_priority [ get_designs { *crc* } ]
```

Single Pass:

```tcl
set simplified_verification_mode true
```

Alternate strategy:

```tcl
printvar verification_alternate_strategy_names
set verification_alternate_strategy <name>
```

---

## Checklist de qualidade

- [x] Texto e figuras do anexo foram interpretados.
- [x] O bloco foi estruturado como aula didática extensa.
- [x] Conceitos de SVP, SVF, Single Pass e alternate strategy foram diferenciados.
- [x] Comandos Tcl foram preservados.
- [x] Pegadinhas de prova foram destacadas.
- [x] O próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 067
- **Aula:** 07 Efficient Debugging in Formality — parte A
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\07 Efficient Debugging in Formality.docx
```

- **Processar somente:** slides 1-19
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\07 Efficient Debugging in Formality_parte_A.md
```
