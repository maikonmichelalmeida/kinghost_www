# 06 Debugging — parte B

## Controle do bloco

- **Bloco:** 057
- **Curso:** 08 Formality Jumpstart
- **Aula:** 06 Debugging — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\06 Debugging.docx`
- **Faixa de slides processada:** slides 18-34
- **Caminho sugerido para salvar:**
  `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\06 Debugging_parte_B.md`
- **Próximo bloco recomendado:** Bloco 058 — `09 Formality Foundation\01 Introduction to Equivalency Checking.docx`

## Resumo executivo

Esta segunda parte da aula de **Debugging** continua a exploração das ferramentas de depuração do Formality depois que a verificação falha, fica inconclusiva ou apresenta pontos difíceis de provar. A parte A já apresentou o fluxo geral: olhar o transcript, procurar sinais de erro, analisar pontos com `analyze_points`, usar o Pattern Viewer para enxergar contraexemplos e abrir o Logic Cone Viewer para comparar o cone lógico da referência e da implementação.

A parte B aprofunda o uso visual dessas ferramentas. O foco passa a ser: navegar no **Logic Cone Viewer**, localizar fontes de `X`, encontrar drivers e loads, remover trechos irrelevantes com **prune**, correlacionar valores do cone com padrões de falha, abrir o código RTL diretamente a partir do esquemático, entender condições **don't care**, usar comandos de setup enfileirados pela GUI, navegar pelo **Dual Design Browser** e consultar a ajuda interna do Formality.

O ponto central desta aula é que o debug em equivalência formal não deve ser feito “no escuro”. Quando um compare point falha, o Formality normalmente já tem um contraexemplo matemático: um conjunto de valores de entrada que faz referência e implementação divergirem. A tarefa do engenheiro é interpretar esse contraexemplo, reduzir o cone até a causa provável e distinguir entre três possibilidades:

1. **erro real de implementação**, quando a síntese ou alguma transformação alterou a função;
2. **problema de setup**, quando algo como scan, clock-gating, black-box, `X` ou UPF foi interpretado errado;
3. **diferença intencional**, quando uma transformação precisa ser explicada por SVF, constante, compare rule, black-box ou outra orientação.

## Texto extraído e organizado por slide

### Slide 18 — Debugging Tools: Logic Cone Viewer

**Texto/elementos visuais principais:**

- Título: `Debugging Tools: Logic Cone Viewer`
- Tela do Formality mostrando dois cones lógicos: referência e implementação.
- Um botão/ícone da barra de ferramentas está destacado em amarelo.
- O tooltip visível indica uma função de agrupamento, algo como agrupar células relacionadas no cone, especialmente células parent/relacionadas ao cone.
- A imagem mostra a continuação do uso do Logic Cone Viewer para simplificar e organizar visualmente o cone.

**Ideia do slide:**

O Logic Cone Viewer não serve apenas para “olhar o circuito”. Ele também oferece comandos de visualização que reduzem a complexidade gráfica. Quando o cone é grande, cheio de buffers, inversores, portas equivalentes e nets intermediárias, a ferramenta permite agrupar partes da lógica para que o engenheiro foque no caminho relevante até o compare point.

---

### Slide 19 — Debugging Tools: Logic Cone Viewer — Find X-Sources

**Texto/elementos visuais principais:**

- Título: `Debugging Tools: Logic Cone Viewer`
- Tela do Logic Cone Viewer com menu de contexto aberto.
- Menu `Find`.
- Opção destacada: `Find X-Sources`.

**Texto provável do menu visível:**

```text
Find
  Find Compare Point
  Find Inner Cone State
  Find Diagnosed Matching Region
  Find Net Load
  Find By Name
  Find Missing
  Find X-Sources
```

**Ideia do slide:**

O Formality permite procurar a origem de valores desconhecidos ou don't care (`X`) dentro do cone. Isso é importante porque muitos problemas de equivalência não vêm de uma porta lógica errada, mas de uma interpretação diferente de `X`, de lógica não inicializada, de black-box, de scan, de constantes ausentes ou de condições não dirigidas.

---

### Slide 20 — Debugging Tools: Logic Cone Viewer — Find Net Driver

**Texto/elementos visuais principais:**

- Título: `Debugging Tools: Logic Cone Viewer`
- Menu de contexto aberto dentro do esquemático.
- Menu `Find`.
- Opção destacada: `Find Net Driver`.

**Ideia do slide:**

Quando o valor de uma net parece suspeito, uma das primeiras perguntas é: **quem está dirigindo esse sinal?** O comando `Find Net Driver` leva o usuário ao elemento lógico que produz aquele valor. No debug, isso permite caminhar “para trás” a partir do ponto de falha até a causa da divergência.

---

### Slide 21 — Debugging Tools: Prune

**Texto/elementos visuais principais:**

- Título: `Debugging Tools: Prune`
- Tela do Logic Cone Viewer com menu `Prune`.
- Opções visíveis relacionadas a remover partes não relevantes do cone.
- Uma opção do menu aparece destacada, ligada a remover/filtrar elementos do cone.

**Ideia do slide:**

`Prune` significa podar. Em debug formal, podar é retirar do esquemático partes que não contribuem para a diferença observada. Isso ajuda a transformar um cone enorme em um subcone menor, onde a causa do erro fica mais visível.

---

### Slide 22 — Correlation From Logic Cone to Pattern Viewer

**Texto/elementos visuais principais:**

- Título: `Correlation From Logic Cone to Pattern Viewer`
- Figura com o Logic Cone Viewer ao fundo e o Pattern Viewer sobreposto.
- Há um destaque ligando um ponto no cone aos valores exibidos no Pattern Viewer.

**Ideia do slide:**

O slide mostra que a ferramenta permite correlacionar o circuito visual com os padrões de falha. Ou seja: ao selecionar uma net ou célula no Logic Cone Viewer, é possível ver seus valores nos vetores do contraexemplo dentro do Pattern Viewer. Isso une duas visões: estrutura lógica e valores concretos que causam a falha.

---

### Slide 23 — Viewing RTL Source From Schematics

**Texto extraído:**

```text
Viewing RTL Source From Schematics

Select Cell,
Popup Menu,
and View Source
```

**Elementos visuais:**

- Esquemático no Logic Cone Viewer.
- Uma célula selecionada.
- Menu de contexto aberto.
- Opção `View Source`.

**Ideia do slide:**

O Formality permite sair do esquemático e ir diretamente para o trecho do código fonte que gerou aquele elemento lógico. Isso é essencial quando o engenheiro precisa entender se a falha vem de uma intenção RTL, de uma interpretação de síntese ou de uma transformação posterior.

---

### Slide 24 — Source Code Browser

**Texto extraído:**

```text
Source Code Browser
Gate and line number highlighted
```

**Elementos visuais:**

- Janela de código fonte.
- Trecho RTL exibido.
- Linha destacada.
- Número de linha/gate destacado.

**Ideia do slide:**

Ao usar `View Source`, o Formality abre o navegador de código e destaca a linha associada ao elemento selecionado. Essa ponte entre esquemático e código acelera o debug, porque evita procurar manualmente o sinal ou a célula no RTL.

---

### Slide 25 — Don’t Care Conditions

**Texto extraído:**

```text
Don’t Care Conditions

• In synthesis, the X state is considered as don't care and Design Compiler is free to choose 1 or 0
• By default in Formality, X is interpreted same as synthesis
• The variable verification_passing_mode controls how X will compare
  – verification_passing_mode consistency
    – Default: Ref X = Impl 1; Ref X = Impl 0
  – verification_passing_mode equality
    – Ref X fails against Impl 1 or Impl 0
• consistency asymmetric: If RTL to gates passes, gates to RTL can fail
• Mode equality useful when comparing RTL to RTL
```

**Ideia do slide:**

Este é um dos slides conceituais mais importantes da parte B. Ele explica que `X` não tem o mesmo significado em simulação comum, síntese e verificação formal. Na síntese, `X` pode ser tratado como liberdade de escolha. No Formality, por padrão, a comparação segue a interpretação de síntese para evitar falsas falhas entre RTL e netlist.

---

### Slide 26 — Formality Don’t Care Symbol

**Texto extraído:**

```text
Formality Don’t care Symbol
```

Texto inferior visível:

```text
When DC (Don't Care) pin is 1; out is X. When DC is 0; out is F.
```

**Elementos visuais:**

- Esquemático com um bloco marcado por um símbolo de `X`.
- Um pino/entrada chamado `DC`, representando condição don't care.
- Saída `OUT`.
- Texto explicando a semântica do pino `DC`.

**Ideia do slide:**

O Formality pode representar explicitamente uma região don't care no esquemático. Quando o pino `DC` está ativo, a saída pode ser `X`, significando que aquele valor é irrelevante/indeterminado para fins de comparação. Quando `DC` está inativo, a saída segue a função lógica real.

---

### Slide 27 — Queued Setup Commands

**Texto extraído:**

```text
Queued Setup Commands
```

**Elementos visuais:**

- Logic Cone Viewer aberto.
- Menu de configuração de setup.
- Janela `Command Queue`.
- Um comando de setup aparece enfileirado, semelhante a um `set_constant`.

**Ideia do slide:**

A GUI do Formality pode gerar comandos Tcl a partir de ações visuais. Em vez de aplicar imediatamente cada comando, ela pode colocá-los em uma fila. O engenheiro revisa o que a GUI vai executar, confirma e transforma uma ação visual em script reproduzível.

---

### Slide 28 — Debugging Tools: Dual Design Browser

**Texto extraído:**

```text
Debugging Tools: Dual Design Browser

• Reference and implementation browser now integrated together
• Search feature
  – "Find Matching" feature
  – Select an object and find corresponding object in other container
```

**Elementos visuais:**

- Janela com navegação integrada entre referência e implementação.
- Destaque para opção `Find Matching`.
- O menu mostra ações para encontrar objeto correspondente.

**Ideia do slide:**

O Dual Design Browser ajuda a navegar simultaneamente pelos dois designs. Ele permite selecionar um objeto em um container e procurar o objeto correspondente no outro, o que é útil para confirmar matches, investigar unmatched points e entender renomeações entre RTL e netlist.

---

### Slide 29 — Formality Online Help

**Texto extraído:**

```text
Formality Online Help

• Click on a hyperlink in the transcript, or use the man command
• Variable sh_man_browser_mode controls the GUI opening the browser for man command
```

**Elementos visuais:**

- Transcript do Formality com mensagens e códigos de erro em azul.
- Alguns códigos destacados por círculos vermelhos, como links clicáveis.
- Exemplo de mensagens de erro/warning, incluindo códigos como `FM-...`.

**Ideia do slide:**

Os códigos de mensagem do Formality são navegáveis. O usuário pode clicar no código no transcript ou usar `man <código>` para abrir a documentação da mensagem. Isso é parte do fluxo de debug: não ignorar warnings e erros, mas consultar exatamente o significado deles.

---

### Slide 30 — Formality Online Help Web Browser Window

**Texto extraído:**

```text
Formality Online Help
Web browser window
```

**Elementos visuais:**

- Janela de navegador web com a documentação do Formality.
- Página de ajuda de um comando, aparentemente `find_design`.
- Lista de argumentos e opções do comando.

**Ideia do slide:**

Ao usar `man`, o Formality pode abrir a documentação detalhada no browser. Isso ajuda a entender sintaxe, argumentos, opções e comportamento de comandos sem sair do ambiente da ferramenta.

---

### Slide 31 — Help For Commands and Variables

**Texto extraído:**

```text
Help For Commands and Variables

• Three important commands for getting help:

printvar
  – Displays the value of a Tcl variable
  – Accepts wildcards

help
  – Displays brief description of a Formality command
  – Accepts wildcards

man
  – Displays detailed information about a Formality command, Tcl variable, warning, or error message
  – Does not accept wildcards
```

**Ideia do slide:**

O Formality fornece três níveis de ajuda: ver variável (`printvar`), obter descrição curta (`help`) e abrir documentação detalhada (`man`). O detalhe importante é que `printvar` e `help` aceitam curingas, mas `man` não.

---

### Slide 32 — Help Examples

**Texto extraído:**

```text
Help Examples

fm_shell (setup)> help report_con*

report_constants     # Report user specified constants
report_constraint    # Reports on the defined constraints
```

Segundo exemplo:

```text
fm_shell (setup)> read_verilog -r r400.v
Error: Can't open file r400.v (FM-016)
0

fm_shell (setup)> man FM-016
```

Trecho da documentação exibida:

```text
NAME
  FM-016 (error) Can't open file %s.

DESCRIPTION
  The specified file does not exist or cannot be created.

WHAT NEXT
  Verify that you specified the correct filename ...
```

**Ideia do slide:**

O primeiro exemplo mostra busca por comando com wildcard. O segundo mostra como investigar uma mensagem de erro real: o arquivo `r400.v` não pôde ser aberto, o erro gerou código `FM-016`, e `man FM-016` explica a causa e a ação recomendada.

---

### Slide 33 — Command Editing and Completion

**Texto extraído:**

```text
Command Editing and Completion

• The Tcl shell supports powerful command editing and completion capabilities
  – Command completion with "Tab"
  – Use up and down arrow keys for moving through command stack
```

Exemplo visível:

```text
fm_shell (setup)> read_v
read_verilog read_vhdl

fm_shell (setup)> read_verilog
```

Anotações visíveis:

```text
Hit Tab key
Enter "e" and hit Tab key
```

**Ideia do slide:**

O shell Tcl do Formality permite completar comandos com Tab e navegar pelo histórico com as setas. Isso reduz erro de digitação e acelera o trabalho interativo.

---

### Slide 34 — Sources for Information

**Texto extraído:**

```text
Sources for Information

• SolvNet Website: https://solvnet.synopsys.com/
  – Formality release notes and user guides
  – Online training
  – Articles
  – Reference Methodology Guides
    – https://solvnet.synopsys.com/rmgen/
    – Design Compiler and Formality Tcl scripts
    – IC Compiler and Formality Tcl script

• Synopsys Website:
  http://www.synopsys.com/Tools/Verification/FormalEquivalence/Pages/Formality.aspx
```

**Ideia do slide:**

Além da ajuda local, o fluxo de aprendizado/debug usa documentação externa da Synopsys, especialmente SolvNet, release notes, user guides, artigos, treinamentos e guias de metodologia.

## Aula didática desenvolvida

### 1. Continuação natural da parte A: de “há uma falha” para “onde está a causa?”

Na parte A, o fluxo de debug partiu de uma situação típica:

```tcl
verify
```

A verificação falhou, abortou ou ficou inconclusiva. O primeiro passo era olhar o transcript, depois usar ferramentas como:

```tcl
analyze_points -failing
analyze_points -aborted
report_analysis_results
```

O Formality podia então sugerir ações como:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

ou ajustes no Design Compiler, por exemplo com `set_verification_priority`, quando o problema envolvia datapath difícil.

A parte B assume que já estamos olhando para os pontos problemáticos. Agora entram ferramentas visuais e conceituais para responder perguntas mais precisas:

- Qual sinal está diferente?
- Qual entrada do cone está causando a diferença?
- O valor diferente é real ou é um `X`/don't care?
- Existe scan enable ativo por engano?
- O cone contém lógica irrelevante que atrapalha a leitura?
- O mesmo objeto existe nos dois containers?
- Onde, no RTL, está a linha que originou a célula problemática?
- O erro é do design ou do setup?

O objetivo é transformar uma falha abstrata de equivalência em uma causa concreta.

---

### 2. Logic Cone Viewer: o esquemático da falha

O **Logic Cone Viewer** mostra, lado a lado ou em janelas correlacionadas, o cone lógico da referência e o cone lógico da implementação.

Um cone lógico é o conjunto de lógica combinacional que alimenta um compare point. Em equivalência formal, o compare point normalmente é:

- uma saída primária;
- um registrador;
- um latch;
- a entrada de uma black-box;
- ou outro ponto definido pela ferramenta.

Se o compare point falha, significa que existe pelo menos uma combinação de valores nos inputs do cone em que a referência produz um valor e a implementação produz outro.

O Logic Cone Viewer torna isso visual. Em vez de olhar apenas:

```text
compare point X failed
```

você passa a enxergar:

```text
entrada A = 1
entrada B = 0
sinal intermediário S = X
saída da referência = 0
saída da implementação = 1
```

A diferença crucial é que, no Formality, esse padrão não é chute. É um contraexemplo matematicamente encontrado.

---

### 3. Agrupamento e simplificação visual do cone

O slide 18 mostra que o Logic Cone Viewer possui ferramentas para organizar a visualização. Em designs reais, um cone pode ter centenas ou milhares de elementos. Muitas vezes, a diferença real está escondida atrás de:

- buffers;
- inversores;
- árvores de clock;
- lógica de scan;
- células de clock-gating;
- multiplexadores;
- sinais constantes;
- wrappers;
- blocos repetitivos;
- células equivalentes ou quase equivalentes.

Ferramentas de agrupamento ajudam a reduzir ruído visual. O objetivo não é alterar a verificação; é alterar a forma de visualizar o cone. Isso é parecido com “dobrar” partes de um código ou agrupar hierarquias em uma árvore de projeto.

Em debug, isso importa porque a mente humana não consegue comparar dois cones enormes elemento por elemento. O engenheiro precisa reduzir a figura até a diferença essencial.

---

### 4. Find X-Sources: rastreando a origem de `X`

O slide 19 destaca a opção `Find X-Sources`.

Em equivalência formal, `X` pode aparecer por várias razões:

- RTL usa `X` como don't care;
- sinal não dirigido;
- black-box sem comportamento interno;
- memória abstraída;
- scan logic não desabilitada;
- UPF ou power intent introduz estados ilegais/não especificados;
- reset ausente;
- latch ou flop sem inicialização;
- interpretação diferente entre referência e implementação.

A opção `Find X-Sources` ajuda a localizar onde o `X` entra no cone.

Isso é especialmente importante porque um `X` pode mascarar uma diferença real ou gerar uma falsa diferença. Por exemplo:

```verilog
assign y = sel ? a : 1'bx;
```

Durante síntese, o `1'bx` pode ser escolhido como `0` ou `1`, conforme conveniência de otimização. Se o Formality interpretar esse `X` como valor literal desconhecido em um contexto errado, pode parecer que a netlist está errada quando, na verdade, a diferença vem da liberdade permitida pela síntese.

---

### 5. Find Net Driver: voltando da falha até a origem

O slide 20 destaca `Find Net Driver`.

Quando um sinal está errado, uma pergunta direta resolve metade do debug:

```text
Quem dirige esse sinal?
```

Em Verilog, uma net pode ser dirigida por:

```verilog
assign out = a & b;
```

ou pela saída de uma instância:

```verilog
AND2X1 u1 (.A(a), .B(b), .Y(out));
```

No esquemático, o driver é a célula ou expressão que gera o valor da net. Ao usar `Find Net Driver`, o engenheiro navega para trás no cone.

O processo típico é:

1. começar no compare point falho;
2. olhar o valor da referência e da implementação;
3. identificar a primeira net divergente;
4. encontrar o driver dessa net;
5. repetir o processo até chegar a uma entrada, constante, black-box, scan enable, don't care ou transformação de síntese.

Esse processo é semelhante a depurar software usando uma pilha de chamadas, mas em hardware a “pilha” é o grafo de dependências lógicas.

---

### 6. Prune: podando o cone até sobrar a causa

O slide 21 apresenta `Prune`.

A palavra “prune” significa podar. Em Formality, podar significa esconder ou remover da visualização partes que não ajudam a explicar a diferença.

Isso pode incluir:

- lógica igual nos dois lados;
- entradas de compare point que possuem o mesmo valor;
- subcones que não contribuem para a falha;
- partes já provadas equivalentes;
- ramos irrelevantes para o padrão atual;
- lógica que está presente mas não afeta a saída no contraexemplo.

A ideia não é deletar lógica do design. É reduzir a visualização.

Exemplo conceitual:

```text
Antes do prune:

a ----\
       AND ----\
b ----/        \
                OR ---- failed_compare_point
c ----\        /
       AND ----
d ----/

Depois de descobrir que o ramo inferior tem mesmo valor nos dois designs:

a ----\
       AND ----\
b ----/        \
                OR ---- failed_compare_point
```

O prune ajuda a encontrar o “primeiro ponto de divergência”.

---

### 7. Correlação entre Logic Cone Viewer e Pattern Viewer

O slide 22 mostra a correlação entre o cone e o Pattern Viewer.

O **Pattern Viewer** mostra valores de sinais para os vetores de falha. O **Logic Cone Viewer** mostra estrutura lógica. A correlação une as duas coisas.

Sem correlação, você teria duas perguntas separadas:

```text
No esquemático, onde está a porta problemática?
No padrão, qual valor essa porta recebeu?
```

Com correlação, você pode selecionar uma célula ou net no esquemático e observar seus valores nos padrões de falha.

Isso é poderoso porque a falha formal é baseada em um contraexemplo. Não basta saber que uma porta existe; é preciso saber quais valores ela recebeu no caso em que a equivalência quebrou.

---

### 8. Viewing RTL Source From Schematics: voltando ao código

Os slides 23 e 24 mostram a navegação do esquemático para o código fonte.

A ação é:

```text
Select Cell → Popup Menu → View Source
```

A ferramenta abre o **Source Code Browser** e destaca a linha/gate correspondente.

Esse recurso é essencial porque o objetivo final do debug não é apenas entender a netlist. O objetivo é decidir o que fazer:

- corrigir RTL;
- alterar constraints;
- ajustar setup do Formality;
- adicionar `set_constant`;
- revisar SVF;
- declarar black-box;
- mudar `verification_passing_mode`;
- alterar script de leitura;
- corrigir biblioteca;
- corrigir uma transformação de síntese;
- ou confirmar que é uma diferença permitida.

Sem ir ao RTL, o engenheiro pode ficar preso no esquemático de portas e perder a intenção original do design.

---

### 9. Don't care conditions: o ponto mais conceitual da parte B

O slide 25 é fundamental.

Em síntese, `X` não significa necessariamente “valor desconhecido que precisa ser preservado”. Muitas vezes, `X` significa **don't care**: o designer está dizendo que naquele caso qualquer valor serve.

Exemplo:

```verilog
always_comb begin
  unique case (state)
    IDLE: y = 1'b0;
    RUN : y = 1'b1;
    default: y = 1'bx;
  endcase
end
```

Nesse exemplo, `default: y = 1'bx;` pode indicar que estados fora de `IDLE` e `RUN` não deveriam acontecer, então a síntese pode escolher `0` ou `1` para otimizar área/timing/potência.

O Design Compiler pode usar essa liberdade para simplificar a lógica. Por isso, a netlist pode não preservar o `X` literalmente. O Formality precisa comparar RTL e netlist respeitando essa semântica.

#### 9.1. `verification_passing_mode consistency`

O modo padrão é indicado como:

```text
verification_passing_mode consistency
```

Nesse modo, a interpretação segue a ideia de síntese:

```text
Ref X = Impl 1
Ref X = Impl 0
```

Ou seja, se a referência tem `X` e a implementação escolheu `0` ou `1`, isso pode passar.

Esse comportamento evita falsas falhas em RTL versus netlist.

#### 9.2. Assimetria do modo `consistency`

O slide diz:

```text
consistency asymmetric: If RTL to gates passes, gates to RTL can fail
```

Isso é muito importante.

Quando você compara RTL → gates, o RTL com `X` pode aceitar a escolha feita pela netlist. Mas se inverter a direção e tratar gates como referência e RTL como implementação, a lógica da aceitação pode mudar. Por isso o modo é assimétrico.

Em equivalência, a escolha de quem é referência e quem é implementação não é meramente estética. Para RTL versus netlist, o RTL normalmente é referência porque representa a intenção funcional antes da síntese.

#### 9.3. `verification_passing_mode equality`

O modo alternativo é:

```text
verification_passing_mode equality
```

Nesse modo:

```text
Ref X fails against Impl 1 or Impl 0
```

Aqui o `X` precisa ser tratado como valor a ser igualado, não como liberdade de escolha.

O slide afirma que esse modo é útil em comparação RTL-to-RTL, porque nesse caso você geralmente quer saber se os dois modelos têm exatamente a mesma semântica de `X`.

Resumo prático:

```text
RTL vs gates:
  normalmente use consistency.

RTL vs RTL:
  equality pode ser mais apropriado.

Gates vs gates:
  cuidado; X pode ter outra semântica dependendo do caso.
```

---

### 10. Formality Don't Care Symbol

O slide 26 mostra o símbolo usado pelo Formality para representar don't care.

O texto diz:

```text
When DC (Don't Care) pin is 1; out is X. When DC is 0; out is F.
```

Isso significa que o bloco tem uma entrada de controle `DC`. Quando `DC = 1`, a saída é `X`, representando condição don't care. Quando `DC = 0`, a saída segue a função `F`.

Em forma conceitual:

```text
if DC == 1:
    OUT = X
else:
    OUT = F
```

Isso ajuda o usuário a identificar visualmente regiões do cone onde a diferença pode ser aceitável por causa de don't care.

Erro comum: olhar o `X` no esquemático e concluir automaticamente que há bug. Nem sempre. Em Formality, `X` pode ser uma marcação intencional de liberdade funcional.

---

### 11. Queued Setup Commands: transformando clique em Tcl

O slide 27 mostra a janela **Command Queue**.

Durante debug visual, a GUI pode sugerir ou gerar comandos de setup, por exemplo:

```tcl
set_constant i:/WORK/TOP/some_signal 0
```

Em vez de executar silenciosamente, a GUI pode enfileirar o comando para revisão.

Isso tem duas vantagens:

1. **Transparência:** você vê exatamente qual comando será aplicado.
2. **Reprodutibilidade:** você pode copiar o comando para o script Tcl.

Em fluxo profissional, é perigoso depender apenas de cliques na GUI. O ideal é que todo ajuste importante vire script, porque a verificação precisa ser repetível.

Exemplo de ajuste que pode ser criado durante debug:

```tcl
set_constant $impl/test_se 0
verify -restart
```

Ou:

```tcl
set_black_box i:/WORK/top/u_mem
match
verify
```

A GUI ajuda a descobrir o comando, mas o script é o que garante rastreabilidade.

---

### 12. Dual Design Browser: navegar referência e implementação ao mesmo tempo

O slide 28 apresenta o **Dual Design Browser**.

Ele integra a navegação do design de referência e do design de implementação. Isso é útil porque o Formality trabalha sempre com dois mundos:

```text
Reference container      Implementation container
RTL original             Netlist sintetizada
r:/WORK/top              i:/WORK/top
```

O recurso `Find Matching` permite selecionar um objeto em um lado e buscar seu correspondente no outro.

Isso é útil em casos como:

- renomeação de registradores;
- registradores duplicados;
- registradores fundidos;
- hierarquia alterada;
- instâncias com nomes diferentes;
- compare points não casados;
- objetos que existem apenas em um lado;
- black-boxes com nomes diferentes;
- mudanças causadas por Design Compiler.

Exemplo conceitual:

```text
Referência:
  r:/WORK/top/u_ctrl/state_reg[2]

Implementação:
  i:/WORK/top/u_ctrl/state_reg_2_
```

Se o match automático não acontecer, o Dual Design Browser pode ajudar a identificar a relação correta.

---

### 13. Ajuda online: códigos de erro são parte do debug

Os slides 29 e 30 mostram a ajuda online do Formality.

Um erro no transcript geralmente vem com código, por exemplo:

```text
FM-016
FM-234
FE-LINK-2
```

A aula mostra que esses códigos podem ser clicados no transcript ou consultados com:

```tcl
man FM-016
```

Isso abre uma explicação detalhada da mensagem.

Essa é uma prática essencial: **não trate warnings e errors como texto genérico**. Em ferramentas Synopsys, o código da mensagem é uma chave de diagnóstico. Ele geralmente explica:

- o que aconteceu;
- por que aconteceu;
- quais comandos revisar;
- que setup pode estar faltando;
- como corrigir.

---

### 14. `printvar`, `help` e `man`

O slide 31 organiza três comandos de ajuda.

#### 14.1. `printvar`

```tcl
printvar variable_name
```

Mostra o valor de uma variável Tcl/Formality.

Exemplo:

```tcl
printvar synopsys_auto_setup
printvar verification_passing_mode
printvar hdlin_unresolved_modules
```

Aceita wildcards:

```tcl
printvar verification_*
```

Uso típico: confirmar se uma variável realmente foi setada.

#### 14.2. `help`

```tcl
help command_name
```

Mostra descrição curta de comandos.

Aceita wildcards:

```tcl
help report_con*
```

O slide mostra:

```tcl
fm_shell (setup)> help report_con*

report_constants     # Report user specified constants
report_constraint    # Reports on the defined constraints
```

Uso típico: descobrir nomes de comandos sem lembrar a sintaxe completa.

#### 14.3. `man`

```tcl
man command_or_message
```

Mostra documentação detalhada sobre:

- comando;
- variável Tcl;
- warning;
- error message.

Não aceita wildcards.

Exemplo:

```tcl
man set_constant
man verification_passing_mode
man FM-016
```

Uso típico: entender detalhes, argumentos e ações corretivas.

---

### 15. Help Examples: investigando erro de arquivo

O slide 32 mostra um exemplo simples:

```tcl
fm_shell (setup)> read_verilog -r r400.v
Error: Can't open file r400.v (FM-016)
0
```

O usuário consulta:

```tcl
fm_shell (setup)> man FM-016
```

A documentação mostra:

```text
FM-016 (error) Can't open file %s.
The specified file does not exist or cannot be created.
```

Esse exemplo é simples, mas ensina uma disciplina poderosa: erros de ferramenta devem ser tratados pelo código exato da mensagem.

Causas possíveis para `Can't open file`:

- arquivo não existe;
- caminho errado;
- diretório de trabalho errado;
- `search_path` incompleto;
- permissão insuficiente;
- erro de maiúsculas/minúsculas em ambiente UNIX;
- arquivo gerado com outro nome;
- script rodando de diretório diferente do esperado.

Comando útil antes de ler arquivos:

```tcl
pwd
printvar search_path
```

E no UNIX:

```sh
ls -l r400.v
```

---

### 16. Command editing and completion

O slide 33 mostra que o `fm_shell` possui facilidades de edição.

Exemplo:

```tcl
fm_shell (setup)> read_v
```

Ao pressionar Tab, o shell pode sugerir:

```text
read_verilog read_vhdl
```

Se o usuário digita mais letras:

```tcl
fm_shell (setup)> read_ve
```

e pressiona Tab, pode completar para:

```tcl
read_verilog
```

Também é possível usar setas para navegar pelo histórico. Isso é útil porque scripts e comandos Formality podem ter caminhos longos:

```tcl
set_constant i:/WORK/aes_cipher_top/test_se 0
```

ou nomes extensos:

```tcl
set verification_clock_gate_hold_mode low
```

O autocompletar reduz erro de digitação.

---

### 17. Sources for Information

O slide 34 aponta fontes de informação:

```text
SolvNet
Formality release notes and user guides
Online training
Articles
Reference Methodology Guides
Design Compiler and Formality Tcl scripts
IC Compiler and Formality Tcl script
Synopsys Website
```

No fluxo real, isso significa que a documentação externa complementa:

- mensagens do transcript;
- `man`;
- `help`;
- user guide;
- release notes;
- scripts de metodologia;
- exemplos de fluxo Synopsys.

O ponto de prova aqui é menos decorar URL e mais entender que o Formality possui um ecossistema de documentação, e que debug profissional envolve consultar mensagens, comandos e metodologia.

## Conceitos difíceis explicados em profundidade

### 1. Compare point falho versus causa da falha

Um erro comum é pensar:

```text
O compare point falhou, então o problema está nesse registrador.
```

Na verdade, o compare point é onde a diferença aparece. A causa pode estar em qualquer lugar do cone que alimenta aquele ponto.

Exemplo:

```text
a ----\
       AND ---- q_ref = 0
b ----/

a ----\
       OR ----- q_impl = 1
b ----/
```

O compare point é `q`, mas a causa é que a implementação tem `OR` onde a referência tem `AND`.

Em designs reais, a diferença pode vir de:

- porta trocada;
- mux com seleção invertida;
- scan enable ativo;
- clock-gating mal configurado;
- black-box diferente;
- `X` interpretado de modo diferente;
- register retiming sem SVF;
- FSM re-encoding sem guidance;
- biblioteca errada;
- top module errado;
- design lido no container errado.

Por isso o Logic Cone Viewer, Pattern Viewer e Source Browser são complementares.

---

### 2. Pattern Viewer: contraexemplo não é vetor de teste comum

O Pattern Viewer mostra padrões que fazem a equivalência falhar.

Esses padrões são diferentes de test vectors tradicionais. Em simulação, você escreve ou gera estímulos e observa a saída. Em equivalência formal, a ferramenta prova matematicamente que as funções são iguais ou encontra um contraexemplo.

Quando encontra um contraexemplo, ele pode ser visto como:

```text
input_a = 1
input_b = 0
mode = 1
test_se = 1
reference_output = 0
implementation_output = 1
```

Esse padrão não veio de um testbench. Ele foi sintetizado pelo solver para demonstrar a diferença.

Por isso, quando o Pattern Viewer mostra que `test_se = 1`, isso é uma pista fortíssima. Se `test_se` deveria estar desabilitado durante equivalência funcional, o problema é de setup, não necessariamente de design.

---

### 3. Logic Cone Viewer: estrutura, valores e navegação

O Logic Cone Viewer permite enxergar:

- estrutura lógica;
- correspondência entre referência e implementação;
- valores do contraexemplo;
- compare point;
- cones de entrada;
- células equivalentes;
- caminhos divergentes;
- fontes de `X`;
- drivers e loads;
- células removíveis por prune;
- pontos que podem ser vistos no código.

O uso típico é:

```text
1. Abrir compare point falho.
2. Mostrar patterns.
3. Observar valores diferentes.
4. Encontrar driver da net divergente.
5. Procurar X-sources se houver X.
6. Fazer prune do que não contribui.
7. Abrir RTL source da célula suspeita.
8. Decidir se é bug real ou setup.
```

---

### 4. Don't care: por que `X` pode passar contra `0` ou `1`

Em Verilog, `X` pode significar “desconhecido” em simulação, mas em síntese muitas vezes significa “não me importo”.

Considere:

```verilog
assign y = valid ? data : 1'bx;
```

Se `valid = 0`, o designer diz que `y` não importa. A síntese pode escolher o valor que simplificar o circuito. Talvez a netlist gere `0`, talvez `1`, talvez reduza uma porta.

Em equivalência, se a referência RTL tem `X` e a implementação tem `0`, isso pode ser aceitável.

Por isso o modo padrão do Formality para RTL versus gates é:

```tcl
set verification_passing_mode consistency
```

Já se você estiver comparando dois RTLs e quiser que ambos preservem exatamente as mesmas condições de `X`, pode fazer sentido usar:

```tcl
set verification_passing_mode equality
```

Mas isso pode gerar mais falhas, porque `X` deixa de ser liberdade e passa a ser tratado como algo que precisa coincidir.

---

### 5. Assimetria de `consistency`

A assimetria significa que a direção da comparação importa.

Se:

```text
Reference = RTL com X
Implementation = gates com 0
```

pode passar, porque o RTL deu liberdade e a netlist escolheu `0`.

Mas se inverter:

```text
Reference = gates com 0
Implementation = RTL com X
```

não é a mesma relação. O RTL agora não está sendo interpretado como fonte de liberdade da síntese da mesma maneira. Por isso, Formality usa uma semântica orientada pelo fluxo: referência geralmente é o RTL original, implementação é a netlist transformada.

Pegadinha de prova:

```text
No modo consistency, RTL-to-gates passar não garante que gates-to-RTL também passe.
```

---

### 6. Prune: por que podar é uma técnica de debug, não de verificação

`Prune` não muda o design verificado. Ele muda a visualização.

Isso é importante porque, se você usa prune no GUI, não está “consertando” o design. Está apenas removendo ruído visual para entender melhor o problema.

Exemplo de elementos que podem ser podados:

- ramos com valores iguais;
- lógica não contribuinte;
- cutpoints irrelevantes;
- buffers que não afetam a diferença;
- subcones já diagnosticados.

A verificação matemática continua baseada no design completo e nos constraints/setup aplicados.

---

### 7. Dual Design Browser e match manual

O Dual Design Browser é útil quando a ferramenta não consegue casar nomes automaticamente. Isso pode acontecer quando:

```text
RTL:  state_reg[3]
Gate: state_reg_3_
```

ou:

```text
RTL:  u_core/u_ctrl/count_reg[7]
Gate: U1234/Q
```

O SVF normalmente reduz esse problema, porque carrega informações do Design Compiler para o Formality. Mas se o match não acontece, o browser permite investigar manualmente.

O fluxo pode ser:

```text
1. Abrir objeto na referência.
2. Usar Find Matching.
3. Ver objeto correspondente na implementação.
4. Se necessário, criar match manual ou compare rule.
```

Isso se conecta aos slides anteriores de `set_compare_rule` e user match.

---

### 8. Help interno como ferramenta de produtividade

O curso enfatiza `printvar`, `help` e `man` porque, em ferramentas EDA, memorizar todos os comandos é inviável.

O engenheiro precisa saber se orientar.

Tabela prática:

| Necessidade | Comando |
|---|---|
| Ver valor de variável | `printvar nome_da_variavel` |
| Descobrir comandos por prefixo | `help prefixo*` |
| Ler documentação completa | `man comando_ou_codigo` |
| Entender erro do transcript | `man FM-xxx` |
| Confirmar variável de setup | `printvar verification_*` |
| Encontrar comandos de relatório | `help report_*` |

Exemplo de rotina ao encontrar erro:

```tcl
# erro no transcript:
# Error: Can't open file r400.v (FM-016)

man FM-016
pwd
printvar search_path
```

---

## Figuras, diagramas e telas importantes

### Slide 18 — Agrupamento no Logic Cone Viewer

A tela mostra que a ferramenta possui botões para organizar o cone. Isso é importante em debug real, porque os cones podem ser muito grandes. O agrupamento permite reduzir a complexidade sem alterar a verificação.

### Slide 19 — Find X-Sources

A figura mostra o menu `Find X-Sources`. Estude este slide como uma pista de diagnóstico: quando o problema envolve `X`, don't care, sinais não dirigidos ou estados não especificados, essa opção ajuda a localizar a origem.

### Slide 20 — Find Net Driver

A figura mostra `Find Net Driver`. Esse comando é usado para navegar para trás no cone e descobrir quem produz o valor suspeito.

### Slide 21 — Prune

A tela mostra opções de poda no esquemático. A poda reduz ruído visual e facilita enxergar a primeira diferença real entre referência e implementação.

### Slide 22 — Correlação cone/pattern

A figura conecta a visualização estrutural com os valores do Pattern Viewer. Esse é o coração do debug: não basta ver o circuito; é preciso ver os valores que causam a falha.

### Slides 23-24 — View Source e Source Code Browser

Esses slides mostram a ponte entre esquemático e RTL. A ferramenta destaca a linha de origem associada à célula selecionada. Isso permite verificar se o problema vem do RTL, da síntese ou do setup.

### Slides 25-26 — Don't care

Esses slides explicam a semântica de `X` e o símbolo de don't care no Formality. São slides de alta chance de questão conceitual.

### Slide 27 — Command Queue

A figura mostra que ações feitas pela GUI podem virar comandos Tcl. Esse é um ponto de metodologia: usar GUI para descobrir, mas salvar em script para reproduzir.

### Slide 28 — Dual Design Browser

A tela mostra navegação integrada entre referência e implementação e o recurso `Find Matching`. Isso ajuda em problemas de match e renomeação.

### Slides 29-32 — Online Help e exemplos

Esses slides mostram que mensagens do transcript têm documentação associada. O exemplo `FM-016` é típico: a ferramenta não conseguiu abrir um arquivo, e `man FM-016` explica a causa e próximos passos.

### Slide 33 — Completion

A figura mostra autocompletar com Tab no `fm_shell`. Isso é útil para produtividade, mas também evita erro de digitação.

### Slide 34 — Sources for Information

O slide aponta SolvNet e documentação Synopsys como fontes de aprofundamento.

## Pontos de prova e revisão

### Perguntas prováveis

1. **Para que serve o Logic Cone Viewer?**  
   Para visualizar e depurar o cone lógico associado a compare points, comparando referência e implementação.

2. **O que o Pattern Viewer mostra?**  
   Mostra padrões/contraexemplos que fazem compare points falharem.

3. **O que significa `Find X-Sources`?**  
   Localizar a origem de valores `X` dentro do cone lógico.

4. **O que significa `Find Net Driver`?**  
   Encontrar a célula ou lógica que dirige uma net.

5. **O que é `Prune` no debug visual?**  
   Remover da visualização partes que não contribuem para a diferença, simplificando o cone.

6. **O que a opção `View Source` faz?**  
   Abre o código RTL/fonte associado à célula selecionada no esquemático.

7. **Como o Formality trata `X` por padrão em RTL versus gates?**  
   Como don't care de forma consistente com síntese, usando o modo `consistency`.

8. **Qual variável controla como `X` compara?**  
   `verification_passing_mode`.

9. **Diferença entre `consistency` e `equality`:**  
   `consistency` permite que `X` da referência passe contra `0` ou `1` da implementação; `equality` exige igualdade mais estrita e pode falhar se `X` for comparado com `0` ou `1`.

10. **Por que `consistency` é assimétrico?**  
    Porque RTL-to-gates pode passar com `X` como liberdade de síntese, mas gates-to-RTL pode falhar.

11. **Para que serve o Command Queue da GUI?**  
    Para enfileirar/revisar comandos Tcl gerados por ações visuais antes de executá-los.

12. **Para que serve o Dual Design Browser?**  
    Para navegar referência e implementação juntos e encontrar objetos correspondentes.

13. **Quais comandos de ajuda são destacados?**  
    `printvar`, `help` e `man`.

14. **Qual comando aceita wildcards: `help` ou `man`?**  
    `help` aceita; `man` não aceita.

15. **Como consultar a explicação de um erro `FM-016`?**  
    Com `man FM-016`.

16. **O que `printvar` faz?**  
    Mostra o valor de uma variável Tcl/Formality.

17. **O que `help report_con*` demonstra?**  
    Busca comandos por wildcard, retornando comandos como `report_constants` e `report_constraint`.

### Pegadinhas

- `X` nem sempre é erro; em síntese pode ser don't care.
- `Prune` não corrige o design; só simplifica a visualização.
- Pattern Viewer não mostra testbench tradicional; mostra contraexemplos formais.
- RTL-to-gates passar em `consistency` não implica gates-to-RTL passar.
- `man` não aceita wildcard.
- A GUI ajuda no debug, mas o setup final deve ser convertido para Tcl reproduzível.
- O compare point falho não é necessariamente a causa da falha.
- `Find X-Sources` é crucial quando a diferença envolve `X`.
- `Find Net Driver` ajuda a rastrear a causa para trás.
- `View Source` é útil para voltar do esquemático ao RTL e entender a intenção original.

## Relação com projeto/laboratório

Esta parte da aula ajuda diretamente em qualquer laboratório ou fluxo de equivalence checking com Formality, especialmente quando o script não passa de primeira.

Um fluxo de laboratório típico pode ser:

```tcl
set search_path ". ./rtl ./lib ./netlist"
set synopsys_auto_setup true
set_svf default.svf

read_verilog -r rtl/top.v
set_top top

read_db -i tech.db
read_verilog -i netlist/top.vg
set_top top

verify
```

Se falhar, a parte B orienta o debug:

```tcl
analyze_points -failing
report_analysis_results
```

Depois, pela GUI:

```text
Open failing compare point
Show Patterns
Open Logic Cone Viewer
Find X-Sources
Find Net Driver
Prune irrelevant logic
View Source
```

E, se o problema for setup, converter a correção para script:

```tcl
set_constant $impl/test_se 0
verify -restart
```

ou ajustar modo de don't care:

```tcl
set verification_passing_mode consistency
```

ou investigar variável:

```tcl
printvar verification_passing_mode
man verification_passing_mode
```

Em projeto real, esta aula também se conecta com Design Compiler, porque muitas falhas de Formality decorrem de transformações feitas na síntese:

- otimizações com don't care;
- retiming;
- register merging;
- FSM re-encoding;
- datapath optimization;
- clock-gating;
- scan insertion;
- renomeação de objetos.

Por isso, o SVF e o setup correto continuam sendo a base para reduzir falso debug.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

## Próximo bloco

O Bloco 057 encerra a aula `06 Debugging` do curso `08 Formality Jumpstart`.

Pelo roteiro principal, o próximo bloco é:

```text
Bloco 058 - 01 Introduction to Equivalency Checking
```

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\01 Introduction to Equivalency Checking.docx
```

Salvar como:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\01 Introduction to Equivalency Checking.md
```
