# 09 SPG Flow, Congestion, Layout GUI

## Controle do bloco

- **Bloco:** 046
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\09 SPG Flow, Congestion, Layout GUI.docx`
- **Faixa processada:** slides 1-24
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\09 SPG Flow, Congestion, Layout GUI.md`
- **Próximo bloco recomendado:** 047 — `10 Constraints - Complex Design Considerations - parte A`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula aprofunda os recursos físicos do **Design Compiler NXT** em modo topographical, especialmente o fluxo **SPG — Synopsys Physical Guidance**, análise de congestionamento e uso da GUI de layout.

A mensagem principal é que a síntese física moderna não deve se preocupar apenas com timing lógico. Ela também precisa prever problemas de implementação física, como:

- nets longas;
- resistência diferente entre camadas metálicas;
- congestionamento localizado ou severo;
- estruturas RTL/netlist difíceis de rotear;
- posicionamento de macros;
- correlação entre DC NXT e IC Compiler II;
- necessidade de modificar floorplan ou até RTL antes do place and route final.

O fluxo SPG permite que o Design Compiler NXT gere uma netlist com posicionamento físico aproximado e guie o IC Compiler II. Isso melhora correlação de timing, reduz iterações e ajuda a detectar problemas de roteabilidade ainda na síntese.

---

## Texto extraído e organizado por slide

### Slide 1 — Design Compiler NXT Features

O slide apresenta os recursos físicos do **Design Compiler NXT topographical**.

Ele suporta um pacote de recursos de síntese física:

- **Synopsys Physical Guidance (SPG) flow**.
- **Layout visualization and congestion analysis**.
- **Floorplan exploration**.
  - Criar ou modificar um floorplan no IC Compiler II.

Benefícios listados:

- melhora timing;
- melhora congestionamento;
- melhora correlação de timing pós-placement;
- para nós avançados, recomenda-se usar o DC NXT em modo **NDM** para capacidades avançadas de place and route.

Interpretação: o DC NXT não está apenas gerando uma netlist lógica. Ele tenta antecipar aspectos físicos para que o resultado faça mais sentido quando chegar ao IC Compiler II.

---

### Slide 2 — Synopsys Physical Guidance (SPG) Optimization

O slide apresenta a otimização SPG.

Pontos principais:

- SPG optimization é recomendada para Design Compiler NXT.
- É habilitada com:

```tcl
compile_ultra -spg
```

- É recomendada para síntese pós-floorplan.

Quando se usa a opção `-spg`, é possível habilitar recursos individuais no DC NXT:

- `set_qor_strategy`
  - melhora timing ou potência total, out-of-the-box.
- **Net layer optimization**
  - melhora timing.
- **Netlist topology optimization**
  - melhora congestionamento.
- **Physical guidance to IC Compiler II**
  - melhora correlação de timing.

O diagrama mostra dois fluxos:

1. **Pre-floorplan synthesis**
   - DC NXT usa constraints físicas default ou definidas pelo usuário.
   - Gera netlist inicial.
   - IC Compiler II Design Planning cria o floorplan.

2. **Post-floorplan synthesis**
   - DC NXT usa o floorplan real do sistema.
   - Gera netlist pós-floorplan e placement aproximado de standard cells.
   - IC Compiler II usa SPG placement.

---

### Slide 3 — Resistance Variation Across Metal Layers

O slide explica que a resistência das camadas metálicas varia muito em geometrias pequenas, especialmente abaixo de 40 nm.

Pontos listados:

- A resistência das camadas metálicas pode variar substancialmente.
- Uma variação de **500 a 1000 vezes** pode ocorrer entre as camadas metálicas mais baixas e mais altas.
- O detailed route do IC Compiler II tende a rotear nets longas nas camadas superiores, que têm menor resistência.
- Por padrão, o Design Compiler NXT estima atrasos de nets usando uma resistência média de todas as camadas metálicas.
- Isso pode levar a:
  - aumento na contagem de buffers;
  - timing subótimo durante a síntese.

Interpretação: se o DC NXT assume uma resistência média, ele pode acreditar que uma net longa será pior do que realmente será no route final, porque o roteador físico provavelmente usará camadas altas de menor resistência. Isso pode fazer a síntese inserir buffers demais.

---

### Slide 4 — Solution: Net Layer Optimization (NLO)

A solução apresentada é **NLO — Net Layer Optimization**.

Três tipos de otimização de camada estão disponíveis para lidar com tendências do metal stack em sub-40 nm:

#### Automatic NLO

- Nets longas e timing-critical são automaticamente promovidas para as duas camadas superiores disponíveis.

#### Pattern-based NLO

- Identifica nets problemáticas conhecidas usando um padrão de busca.
- Atribui essas nets a camadas específicas.

#### Manual NLO

- Atribui manualmente camadas mínimas e máximas para nets específicas.

O comando `write_icc2_files` gera um arquivo contendo atribuições de camadas de net para o IC Compiler II.

Para ver as atribuições de camada feitas pelo Design Compiler NXT:

```tcl
report_net_routing_layer_constraints [get_nets -hier] -output NLO.tcl
```

Essas routing rules são seguidas pelo IC Compiler II desde placement até routing.

---

### Slide 5 — What is Congestion?

O slide define congestionamento:

```text
It is a measure of a design's routability, and is analyzed prior to actual routing.
```

Tradução:

```text
É uma medida da roteabilidade do design, analisada antes do roteamento real.
```

Ideia central:

- Existe um limite para o número de nets que podem ser roteadas através de uma pequena área.
- Quando o design se aproxima ou excede esse limite, a área é considerada congestionada.

O slide mostra:

- pinos de célula próximos;
- trilhas de roteamento horizontais e verticais;
- metal layers como Metal 1, Metal 2 e Metal 3;
- região onde muitas nets precisam passar por poucas trilhas.

Interpretação: congestionamento é uma previsão de que o roteador terá dificuldade para passar fios por determinada região.

---

### Slide 6 — Detouring Around Localized Congestion

O slide mostra o caso de congestionamento localizado e não muito severo.

Pontos principais:

- Se o congestionamento é localizado e não é severo demais, a rota real pode fazer **detour** ao redor da área congestionada.
- Nets desviadas têm atrasos RC ligeiramente maiores.
- Isso não deve causar problemas para caminhos que não são timing-critical.

A figura mostra um congestion hot spot e uma rota desviando ao redor dele.

Interpretação: congestionamento leve ou localizado pode ser tolerável. O problema real surge quando o desvio aumenta muito o atraso em caminhos críticos ou quando a região fica impossível de rotear.

---

### Slide 7 — The Problem With Severe Congestion

O slide destaca o problema com congestionamento severo:

```text
Severe congestion can cause timing violations or cause a design to be un-routable.
```

Tradução:

```text
Congestionamento severo pode causar violações de timing ou tornar o design não roteável.
```

Consequências:

- exige iterações de design;
- aumenta o ciclo de projeto.

Possíveis correções:

- modificar floorplan e depois executar novo place and route;
- recodificar RTL, ressintetizar e depois executar place and route.

Objetivo da síntese:

```text
Eliminate serious congestion prior to placement to prevent iterations.
```

Interpretação: detectar e reduzir congestionamento na síntese evita descobrir tarde demais que o design não roteia ou viola timing depois do route.

---

### Slide 8 — Netlist Topology Congestion Optimization 1/3

O slide mostra otimização de topologia da netlist para minimizar congestionamento.

Comando central:

```tcl
compile_ultra ... -spg
```

A otimização faz mudanças estruturais ou de topologia da netlist para ficar mais amigável ao roteamento:

- minimiza estruturas altamente conectadas;
- minimiza fios e cruzamento de fios;
- compartilha ou exclui lógica da netlist quando necessário;
- otimiza de forma concorrente com timing, área, potência e scan chains.

Exemplos mostrados:

- uma grande árvore de MUX pode ser reestruturada;
- uma árvore de buffers pode ser transformada em uma topologia mais amigável ao roteamento;
- um address decoder pode ser reestruturado para ficar menor e menos congestionado.

Interpretação: às vezes a função lógica está correta, mas a estrutura física da netlist é ruim. A otimização SPG tenta trocar a estrutura por outra equivalente e mais roteável.

---

### Slide 9 — Netlist Topology Congestion Optimization Examples 2/3

O slide mostra otimização de MUX.

Pontos principais:

- Netlist topology optimization reestrutura MUXes existentes com muitas entradas em árvores de MUX.
- Isso reduz congestionamento porque distribui melhor as conexões.

Comando adicional para favorecer MUXes antes do compile:

```tcl
set_app_var compile_prefer_mux true
```

Objetivo:

- favorecer o uso de MUXes em vez de AOIs para multiplexadores;
- melhorar ainda mais o congestionamento.

Interpretação: uma célula AOI ou estrutura lógica compacta pode parecer boa logicamente, mas criar muitas conexões cruzadas. Uma árvore de MUX pode ocupar uma área diferente, mas ser mais roteável.

---

### Slide 10 — Netlist Topology Congestion Optimization Examples 3/3

O slide apresenta:

```text
Associative-Commutative Tree Decomposition
```

A ideia é melhorar congestionamento decompondo e reestruturando árvores AND e OR com base em localização de ports ou pinos de macros.

Exemplo:

- antes, a árvore lógica cruza muitos fios para alcançar uma macro;
- depois, a árvore é reorganizada para agrupar sinais conforme proximidade física;
- o resultado reduz cruzamentos e melhora roteabilidade.

Interpretação: operações AND e OR são associativas e comutativas. Isso significa que a ordem dos operandos pode mudar sem alterar a função lógica:

```text
(A & B) & C = A & (B & C)
A | B | C = C | A | B
```

O DC NXT usa essa liberdade para organizar a lógica de forma mais adequada ao layout.

---

### Slide 11 — Targeting and Limiting Congestion Optimization

Por padrão, o comando:

```tcl
compile_ultra -spg
```

aplica structural congestion optimization ao design atual inteiro.

O comando abaixo pode limitar ou focar quais sub-blocos serão alvo:

```tcl
set_congestion_optimization
```

#### Fazer congestion optimization em todos os sub-blocos exceto um design específico

```tcl
set_congestion_optimization [get_designs A] false
compile_ultra ... -spg
```

#### Fazer congestion optimization apenas em designs e células específicos

```tcl
set_congestion_optimization [get_designs *] false
set_congestion_optimization [get_designs "A D"] true
set_congestion_optimization [get_cells I_X4] true
compile_ultra ... -spg
```

Interpretação: se um bloco já está bom, ou se preservar sua estrutura é importante, é possível desabilitar otimização de congestionamento nele. Se o problema está concentrado em alguns blocos, é possível focar apenas neles.

---

### Slide 12 — Congestion Analysis After Synthesis

Depois da síntese, o congestionamento pode ser exibido visualmente como um heat map na janela de layout.

A análise é baseada em **global routing**.

Pontos principais:

- A área de core placement é dividida em **GRCs — Global Routing Cells**.
- Cada GRC possui número limitado de trilhas horizontais e verticais ao longo de suas bordas.
- O global routing desvia de GRCs congestionados.
- Congestionamento existe ao longo de uma borda de GRC quando mais trilhas são necessárias do que estão disponíveis.

Interpretação: a análise de congestionamento não faz o detailed route final, mas estima demanda e capacidade de roteamento em uma malha global.

---

### Slide 13 — Understanding the Congestion Heat Map

O slide explica como ler o heat map de congestionamento.

O congestionamento em uma borda de GRC é baseado em:

```text
Number of nets crossing the global routing cell edge versus number of available routing tracks.
```

Exemplo mostrado:

```text
20/14
19/14
```

O slide calcula overflow:

```text
Overflow = 19 - 14 = 5
```

Interpretação:

- 19 nets precisam cruzar aquela borda.
- Só existem 14 tracks disponíveis.
- Há overflow de 5.

Mensagem do slide:

```text
The size of the overflow determines the highlighting color — larger overflows are brighter or hotter.
```

Tradução:

```text
O tamanho do overflow determina a cor de destaque — overflows maiores ficam mais brilhantes ou mais quentes.
```

---

### Slide 14 — Textual Congestion Analysis

Além do heat map, pode-se gerar relatório textual com:

```tcl
report_congestion
```

O relatório mostra:

#### Overall Congestion

Exemplo de overflow geral:

```text
Both Dirs: Overflow = 3621
H routing: Overflow = 1724
V routing: Overflow = 1897
```

#### Worst Hotspot

Mostra o maior overflow em um hotspot, por exemplo:

```text
Max = 13 (1 GRCs)
Max = 8  (1 GRCs)
```

#### Violating GRCs

Mostra quantas GRCs têm overflow e a porcentagem do total.

O slide diz que o congestionamento pode ser severo se uma ou mais condições forem verdadeiras:

- há hotspots grandes ou numerosos no mapa de congestionamento;
- qualquer GRC overflow maior que 10;
- cerca de 2% ou mais das bordas de GRC têm overflow.

Interpretação: não basta ver uma pequena mancha colorida. É preciso olhar quantidade, intensidade e porcentagem de GRCs violadas.

---

### Slide 15 — Opening the Layout Window

Depois que a síntese é concluída, o slide mostra os passos para abrir a janela de layout.

Passo 1: iniciar a GUI:

```tcl
dcnxt_shell-topo> start_gui
```

Passo 2: no Design Vision, abrir uma nova janela de layout:

```text
Window → New Layout Window
```

Passo 3: no menu View, selecionar modo de mapa:

```text
View → Map Mode
```

Interpretação: o objetivo é sair da análise apenas textual e visualizar a distribuição física do congestionamento no layout.

---

### Slide 16 — Generating a Congestion Heat Map

O slide mostra a janela de layout com um painel de congestionamento.

Instrução principal:

```text
Select the Reload button to generate a congestion map.
```

Tradução:

```text
Selecione o botão Reload para gerar um mapa de congestionamento.
```

A interface mostra:

- layout físico;
- painel de objetos à esquerda;
- painel de global route/congestion à direita;
- escala de cores para regiões congestionadas;
- opção de listar cells em regiões congestionadas.

Interpretação: após a síntese, você consegue visualizar onde estão as regiões quentes de congestionamento e cruzar isso com células, macros e lógica RTL.

---

### Slide 17 — Congestion Alleviation Flow

O slide mostra um fluxo de alívio de congestionamento.

Fluxo geral:

1. **Pre-floorplan synthesis**.
2. IC Compiler II floorplanning.
3. Verificar se houve grande mudança.
   - Se sim, modificar floorplan ou RTL.
4. **Post-floorplan synthesis**.
   - Reload RTL + constraints.
   - Load floorplan.
   - Executar:

```tcl
compile_ultra -scan -spg
insert_dft
compile_ultra -scan -spg -incremental
```

5. Gerar relatórios de congestionamento:

```tcl
report_congestion -build_map
report_congestion
```

6. Se estiver congestionado:
   - modificar placement e congestion settings;
   - ou modificar floorplan;
   - ou modificar RTL.

7. Se não estiver congestionado:
   - seguir para IC Compiler II place and route.

Perguntas do slide:

```text
How can you modify the floorplan?
Which RTL code lines should be modified?
```

Interpretação: o fluxo orienta a decidir se o problema é físico, resolvido por floorplan/placement, ou lógico/estrutural, resolvido por mudanças no RTL.

---

### Slide 18 — Floorplan Exploration

O fluxo SPG do Design Compiler NXT permite acesso ao **IC Compiler II design planning**.

O slide também chama isso de:

```text
floorplan exploration flow
```

ou:

```text
IC Compiler II Link
```

Quando nenhum DEF de floorplan é fornecido, ou quando o DEF está incompleto, o auto floorplan é invocado durante o compile.

Comando para habilitar auto floorplanning:

```tcl
set_auto_floorplan_constraints
```

RTL designers podem:

- criar novo floorplan;
- modificar um floorplan existente.

Benefícios:

- permite análise “what-if” para exploração física;
- permite posicionamento ótimo de macros e ports.

Interpretação: o DC NXT permite que o projetista RTL investigue problemas físicos sem precisar esperar todo o fluxo completo de place and route.

---

### Slide 19 — Example: Modifying Floorplan

O slide mostra um exemplo de modificação de floorplan.

Problema inicial:

```text
Long net length
```

No IC Compiler II Link:

```text
Select and move macros as group
```

Após mover macros:

```text
Design Compiler NXT: Improved timing
```

Interpretação:

- Uma net longa pode causar atraso grande.
- Mover macros fisicamente pode reduzir comprimento das conexões.
- O DC NXT pode então melhorar timing porque a estimativa física ficou melhor.

A figura reforça que, às vezes, o problema não é RTL nem lógica: é posicionamento físico ruim.

---

### Slide 20 — Trace From GUI Back to RTL Source

O slide mostra como voltar da GUI de congestionamento para o código RTL.

Passos mostrados:

1. Clicar em:

```text
List cells in congested region
```

2. Selecionar a área de interesse.
3. Clicar em:

```text
Apply
```

4. Expandir:

```text
file name
line number
cell of interest
```

5. A linha aplicável do código RTL é destacada.

Interpretação: isso é muito importante para debug. Se uma região congestionada está ligada a uma estrutura RTL específica, a ferramenta permite rastrear a célula física/netlist de volta para a linha do RTL responsável.

---

### Slide 21 — Physical Guidance

O slide explica o que o physical guidance permite.

Permite:

- escrever coarse placement em DEF para o IC Compiler II;
- usar o SPG placement no IC Compiler II com o placement topológico do DC NXT como ponto inicial para otimização e legalização.

Benefícios:

- melhor correlação de timing entre Design Compiler NXT e IC Compiler II;
- melhor runtime em `place_opt`, porque o coarse placement é pulado.

Fluxo mostrado:

1. Entrada:
   - floorplan;
   - RTL + SDC.
2. SPG flow no DC NXT:

```tcl
compile_ultra ... -spg
insert_dft
compile_ultra ... -incremental -spg
```

3. Saída:
   - Verilog netlist;
   - DEF placement.

4. IC Compiler II SPG flow:

```tcl
set_app_options -name place_opt.flow.do_spg \
  -value true
place_opt
```

Interpretação: o DC NXT envia orientação física ao IC Compiler II, e o ICC II aproveita esse placement inicial para acelerar e correlacionar melhor a implementação.

---

### Slide 22 — Invoking IC Compiler II Design Planning

Para iniciar o IC Compiler II Design Planning a partir do ambiente do DC NXT:

```tcl
dcnxt_shell-topo> start_icc2
```

O slide mostra a GUI do IC Compiler II com layout, células e painel de seleção.

Interpretação: essa integração permite explorar floorplan e posicionamento sem sair do fluxo de síntese física.

---

### Slide 23 — After Exiting IC Compiler II Floorplanning

Após sair do IC Compiler II floorplanning:

- o controle retorna para o Design Compiler NXT;
- o shell do Design Compiler volta a ficar ativo.

Incremental synthesis é recomendada para:

- pequenas mudanças no floorplan;
- avaliação rápida de QoR.

Fluxo mostrado:

```tcl
compile_ultra -scan
# Minor edits to floorplan
compile_ultra -scan -incremental
```

Interpretação: se a mudança no floorplan é pequena, não é necessário recomeçar tudo. Uma compilação incremental permite avaliar rapidamente se o QoR melhorou.

---

### Slide 24 — Full Re-Synthesis

Full re-synthesis é recomendada para:

- criação inicial de floorplan;
- grandes mudanças no floorplan;
- fluxo final ou implementação final de QoR.

Fluxo conceitual mostrado:

```tcl
compile_ultra -scan
# Edit or create floorplan
```

Depois, o design volta para uma síntese completa considerando o novo floorplan.

Interpretação:

- mudanças pequenas → incremental synthesis;
- mudanças grandes ou fluxo final → full re-synthesis.

Essa regra evita usar incremental compile em uma situação na qual o ponto de partida físico mudou demais.

---

## Aula didática desenvolvida

### 1. Por que SPG existe

Em tecnologias antigas, uma parte grande do atraso vinha das portas lógicas. Em tecnologias mais avançadas, os fios e a física passaram a dominar muito mais o resultado. Por isso, uma síntese que olha apenas para fanout ou para um modelo médio de fio pode tomar decisões ruins.

O SPG existe para aproximar o DC NXT do mundo físico. Ele permite que a síntese considere:

- onde células e macros provavelmente ficarão;
- quais nets serão longas;
- onde o roteamento pode ficar congestionado;
- como o ICC II provavelmente tratará placement e routing;
- quais estruturas lógicas devem ser reescritas para rotear melhor.

O comando-chave é:

```tcl
compile_ultra -spg
```

A ideia é reduzir a distância entre “o que a síntese acha” e “o que o place and route realmente encontra”.

---

### 2. Pre-floorplan synthesis versus post-floorplan synthesis

O slide de SPG mostra dois momentos.

#### Pre-floorplan synthesis

Acontece antes de existir floorplan real.

Objetivo:

- gerar uma netlist inicial;
- ajudar o IC Compiler II Design Planning a criar um floorplan;
- ter uma primeira visão de timing, área e estrutura.

#### Post-floorplan synthesis

Acontece depois que já existe um floorplan.

Objetivo:

- usar localização de macros, ports e áreas;
- melhorar estimativa de RC;
- produzir uma netlist mais correlacionada com o layout;
- usar SPG placement no IC Compiler II.

Resumo:

```text
pre-floorplan = ajuda a criar o plano físico
post-floorplan = usa o plano físico para sintetizar melhor
```

---

### 3. Resistência das camadas metálicas e por que NLO importa

O slide de resistência entre camadas é muito importante. Em nós avançados, as camadas inferiores são finas e resistivas. As camadas superiores são mais largas e têm resistência muito menor.

Se o DC NXT usa uma média de resistência de todas as camadas, ele pode superestimar o atraso de nets longas. O resultado pode ser:

```text
net parece lenta demais
↓
DC NXT insere buffers demais
↓
área aumenta
↓
potência aumenta
↓
timing pode ficar subótimo
```

O NLO corrige isso informando que certas nets críticas ou longas devem usar camadas superiores.

Com isso, o DC NXT evita otimização baseada em uma estimativa pessimista demais.

---

### 4. Automatic, pattern-based e manual NLO

O curso divide NLO em três níveis.

#### Automatic NLO

A ferramenta decide automaticamente quais nets longas e críticas devem ir para camadas superiores.

#### Pattern-based NLO

Você identifica nets por padrão de nome. Exemplo conceitual:

```text
nets de clock enable
barramentos críticos
sinais longos conhecidos
```

A ferramenta aplica uma regra de camada para essas nets.

#### Manual NLO

Você especifica manualmente camadas mínimas e máximas para nets específicas.

Esse modo dá mais controle, mas exige mais conhecimento físico.

---

### 5. Congestionamento: demanda versus capacidade

Congestionamento é uma conta entre demanda de roteamento e capacidade de roteamento.

A demanda é:

```text
quantas nets precisam passar por aquela região
```

A capacidade é:

```text
quantas trilhas de roteamento estão disponíveis naquela região
```

Se a demanda passa da capacidade, existe overflow.

Exemplo do slide:

```text
19 nets precisam cruzar
14 tracks estão disponíveis
overflow = 5
```

O heat map mostra isso visualmente: quanto maior o overflow, mais quente a região.

---

### 6. Congestionamento leve versus severo

Nem todo congestionamento é igualmente grave.

#### Congestionamento leve/localizado

Pode ser resolvido por detour:

```text
fio desvia da região congestionada
```

Isso aumenta um pouco o RC, mas pode ser aceitável.

#### Congestionamento severo

Pode causar:

- violação de timing;
- design não roteável;
- necessidade de mudar floorplan;
- necessidade de mudar RTL;
- aumento do ciclo de projeto.

O objetivo do SPG é detectar e reduzir congestionamento severo antes do route final.

---

### 7. Netlist topology optimization

A ferramenta pode reescrever a netlist para ficar mais roteável, sem mudar a função lógica.

Exemplos:

- transformar MUX grande em árvore de MUX;
- reestruturar árvore de buffers;
- decompor AND/OR trees com base na posição física dos ports/macros;
- reduzir cruzamentos;
- compartilhar ou separar lógica conforme necessidade.

Isso é diferente de otimizar apenas timing. Uma estrutura pode ser boa para lógica, mas ruim para roteamento. SPG tenta equilibrar:

```text
timing + área + potência + scan + congestionamento
```

---

### 8. Por que MUX pode ser melhor que AOI para congestionamento

O slide recomenda:

```tcl
set_app_var compile_prefer_mux true
```

Isso favorece MUXes em vez de AOIs para estruturas de multiplexação.

Uma AOI pode compactar lógica, mas gerar conexões difíceis de rotear. Um MUX explícito pode distribuir melhor os sinais e formar uma árvore mais organizada.

Isso mostra que “menor área lógica” nem sempre é “melhor implementação física”.

---

### 9. Associative-commutative tree decomposition

AND e OR são operações associativas e comutativas:

```text
A & B & C = C & A & B
(A | B) | C = A | (B | C)
```

A ferramenta pode mudar a ordem e agrupamento dos operandos para reduzir fios longos.

Se um grupo de sinais vem de uma macro no canto inferior direito, faz sentido combinar esses sinais perto da macro, em vez de cruzar o bloco inteiro para depois voltar.

Essa otimização é fortemente física: a função lógica não muda, mas a topologia muda para respeitar a localização.

---

### 10. Como decidir onde aplicar congestion optimization

Por padrão, `compile_ultra -spg` tenta otimizar congestionamento no design todo.

Mas isso pode ser excessivo se:

- você quer preservar um bloco;
- um bloco já está bom;
- a otimização de topologia pode atrapalhar debug;
- apenas alguns sub-blocos têm congestionamento.

Com:

```tcl
set_congestion_optimization
```

você consegue controlar onde a otimização acontece.

Exemplo:

```tcl
set_congestion_optimization [get_designs A] false
```

Ou focar apenas em alguns blocos:

```tcl
set_congestion_optimization [get_designs *] false
set_congestion_optimization [get_designs "A D"] true
set_congestion_optimization [get_cells I_X4] true
```

---

### 11. Como ler o heat map

O heat map não é apenas uma imagem colorida. Ele representa uma métrica:

```text
overflow = demanda de tracks - tracks disponíveis
```

Se a cor está quente, a região está mais congestionada.

Mas você deve olhar também o relatório textual:

```tcl
report_congestion
```

Critérios do slide para congestionamento severo:

- hotspots grandes ou muitos hotspots;
- qualquer overflow maior que 10;
- cerca de 2% ou mais de GRC edges com overflow.

Assim você evita reagir exageradamente a uma pequena mancha que o roteador conseguiria contornar.

---

### 12. GUI de layout e rastreamento até RTL

A GUI permite abrir o layout, gerar heat map e selecionar uma região congestionada.

O ponto mais poderoso é rastrear de volta para o RTL:

```text
região congestionada
↓
lista de células naquela região
↓
nome de arquivo e linha
↓
linha RTL destacada
```

Isso responde uma pergunta prática:

```text
qual parte do meu código criou esta estrutura congestionada?
```

Esse recurso é muito útil para decidir se a correção deve ser física ou RTL.

---

### 13. Congestion alleviation flow

O fluxo do slide pode ser resumido assim:

```text
sintetiza
↓
analisa congestionamento
↓
se não há congestionamento severo → seguir para P&R
↓
se há congestionamento → decidir causa
```

Se o problema é físico:

```text
modificar floorplan
mover macros
ajustar placement/congestion settings
```

Se o problema é estrutural:

```text
modificar RTL
reescrever muxes/decoders/árvores lógicas
ressintetizar
```

O objetivo é evitar iterações tardias no IC Compiler II depois que o custo de mudança já é maior.

---

### 14. Floorplan exploration

O DC NXT pode chamar recursos de floorplanning do IC Compiler II.

Isso permite:

- criar floorplan inicial;
- modificar floorplan existente;
- fazer análise “what-if”;
- posicionar macros e ports melhor;
- avaliar rapidamente impacto de mudanças físicas.

Comando para auto floorplanning:

```tcl
set_auto_floorplan_constraints
```

Essa capacidade é especialmente útil para projetistas RTL que precisam entender se determinado problema vem da lógica ou do posicionamento físico.

---

### 15. Physical guidance para IC Compiler II

O DC NXT pode escrever um coarse placement em DEF.

O IC Compiler II usa esse placement como ponto inicial:

```tcl
set_app_options -name place_opt.flow.do_spg \
  -value true
place_opt
```

Benefícios:

- melhor correlação de timing;
- menor runtime em `place_opt`;
- menos retrabalho entre síntese e implementação física.

Esse é o fechamento do conceito SPG: a síntese não apenas prevê física; ela passa orientação física para a próxima ferramenta.

---

### 16. Incremental synthesis versus full re-synthesis

Após modificar floorplan, há duas opções.

#### Incremental synthesis

Recomendada para:

- pequenas mudanças;
- avaliação rápida de QoR.

Exemplo:

```tcl
compile_ultra -scan
# pequenas mudanças no floorplan
compile_ultra -scan -incremental
```

#### Full re-synthesis

Recomendada para:

- criação inicial de floorplan;
- grandes mudanças no floorplan;
- fluxo final de QoR.

Regra prática:

```text
mudança pequena → incremental
mudança grande ou final → full re-synthesis
```

---

## Conceitos difíceis explicados em profundidade

### SPG — Synopsys Physical Guidance

SPG é um fluxo em que o DC NXT gera uma orientação física que o IC Compiler II consegue usar depois.

Na prática, SPG conecta:

```text
síntese RTL
↓
placement topológico/coarse placement
↓
netlist + DEF placement
↓
IC Compiler II place_opt com SPG
```

Comando no DC NXT:

```tcl
compile_ultra -spg
```

Comando no IC Compiler II:

```tcl
set_app_options -name place_opt.flow.do_spg -value true
place_opt
```

---

### NLO — Net Layer Optimization

NLO é a otimização que informa ou sugere quais camadas metálicas certas nets devem usar.

Motivo:

```text
camadas inferiores = mais resistivas
camadas superiores = menos resistivas
```

Se o DC NXT assume resistência média, pode inserir buffers demais. NLO corrige essa estimativa para nets críticas/longas.

Relatório:

```tcl
report_net_routing_layer_constraints [get_nets -hier] -output NLO.tcl
```

---

### Congestion

Congestionamento é uma estimativa de roteabilidade.

Fórmula conceitual:

```text
overflow = demanda de roteamento - capacidade de roteamento
```

Se overflow é positivo, faltam tracks.

Exemplo:

```text
19 nets precisam passar
14 tracks disponíveis
overflow = 5
```

---

### GRC — Global Routing Cell

GRC é uma célula da grade de global routing.

A área de core placement é dividida em GRCs. Cada borda de GRC tem um número de tracks disponíveis. O congestionamento é avaliado nessas bordas.

---

### Heat map de congestionamento

O heat map colore regiões conforme overflow.

Regra visual:

```text
maior overflow → cor mais quente/brilhante
```

Mas a decisão técnica deve combinar heat map e relatório textual:

```tcl
report_congestion
```

---

### Netlist topology optimization

É a reestruturação da netlist para melhorar roteabilidade.

Exemplos:

- MUX grande → árvore de MUX;
- AND/OR tree reorganizada por localização física;
- buffer tree reestruturada;
- decoder reorganizado para reduzir área/congestionamento.

---

### Floorplan exploration

É a exploração física do floorplan dentro do fluxo DC NXT/ICC II Link.

Permite testar hipóteses como:

```text
E se eu mover esta macro?
E se eu agrupar estas macros?
E se eu mudar ports?
E se o auto floorplan criar uma distribuição melhor?
```

---

### Physical guidance

Physical guidance é o envio de posicionamento aproximado do DC NXT para o IC Compiler II.

Em vez de o ICC II começar do zero, ele usa o coarse placement da síntese como ponto de partida.

Benefícios:

- melhor correlação;
- menor runtime;
- transição mais suave entre síntese e implementação física.

---

## Figuras, diagramas e exemplos importantes

### Figura de recursos do DC NXT

Mostra que o DC NXT inclui SPG flow, layout visualization, congestion analysis e floorplan exploration.

### Diagrama SPG Optimization

Mostra a diferença entre síntese pre-floorplan e post-floorplan. É uma das figuras centrais da aula.

### Gráfico de resistência por camada metálica

Mostra que a resistência cai nas camadas superiores. Justifica o NLO.

### Figura de congestionamento

Mostra que congestionamento é excesso de nets tentando passar por uma área pequena.

### Figura de detour

Mostra que congestionamento localizado pode ser contornado, com pequeno aumento de RC.

### Figura de congestionamento severo

Mostra que congestionamento severo pode tornar uma net não roteável, exigindo iteração.

### Figuras de topology optimization

Mostram MUX trees, buffer trees, address decoder e decomposição associativa/comutativa.

### Heat map de congestionamento

Mostra como cores representam overflow em GRCs.

### GUI e trace back to RTL

Mostra como selecionar uma região congestionada e encontrar a linha RTL associada.

### Physical guidance flow

Mostra o caminho de RTL + SDC + floorplan até Verilog netlist + DEF placement e depois IC Compiler II `place_opt`.

---

## Pontos de prova e revisão

1. O DC NXT topographical suporta recursos de síntese física.
2. SPG significa **Synopsys Physical Guidance**.
3. SPG é habilitado com:
   ```tcl
   compile_ultra -spg
   ```
4. SPG é recomendado para post-floorplan synthesis.
5. Recursos associados ao SPG incluem:
   - `set_qor_strategy`;
   - net layer optimization;
   - netlist topology optimization;
   - physical guidance para IC Compiler II.
6. Em nós sub-40 nm, a resistência varia muito entre camadas metálicas.
7. Nets longas tendem a ser roteadas em camadas superiores de baixa resistência.
8. O DC NXT pode usar resistência média por padrão, o que pode inserir buffers demais.
9. NLO corrige ou melhora essa modelagem de camadas.
10. Tipos de NLO:
    - automatic;
    - pattern-based;
    - manual.
11. Para reportar constraints de camada:
    ```tcl
    report_net_routing_layer_constraints [get_nets -hier] -output NLO.tcl
    ```
12. Congestionamento é uma medida de roteabilidade antes do roteamento real.
13. Congestionamento ocorre quando mais tracks são necessárias do que disponíveis.
14. Congestionamento leve pode ser contornado por detour.
15. Congestionamento severo pode causar timing violations ou design un-routable.
16. Netlist topology optimization reestrutura a netlist para ser routing-friendly.
17. Para favorecer MUXes:
    ```tcl
    set_app_var compile_prefer_mux true
    ```
18. Para limitar ou focar otimização de congestionamento:
    ```tcl
    set_congestion_optimization
    ```
19. Após síntese, congestionamento pode ser visto como heat map.
20. Relatório textual:
    ```tcl
    report_congestion
    ```
21. Congestionamento pode ser severo se overflow > 10 em qualquer GRC.
22. Congestionamento pode ser severo se cerca de 2% ou mais das GRC edges tiverem overflow.
23. Para abrir GUI:
    ```tcl
    start_gui
    ```
24. Para iniciar IC Compiler II Design Planning:
    ```tcl
    start_icc2
    ```
25. Para auto floorplanning:
    ```tcl
    set_auto_floorplan_constraints
    ```
26. Para IC Compiler II usar SPG:
    ```tcl
    set_app_options -name place_opt.flow.do_spg -value true
    place_opt
    ```
27. Incremental synthesis é recomendada para pequenas mudanças de floorplan.
28. Full re-synthesis é recomendada para criação inicial, grandes mudanças e fluxo final de QoR.

---

## Script consolidado da aula

### Síntese SPG básica

```tcl
# RTL + constraints + floorplan já carregados
compile_ultra -scan -spg
insert_dft
compile_ultra -scan -spg -incremental
```

### Habilitar estratégia de QoR

```tcl
set_qor_strategy -metric timing -stage synthesis
compile_ultra -spg
```

### Reportar NLO

```tcl
report_net_routing_layer_constraints [get_nets -hier] -output NLO.tcl
```

### Favorecer MUXes para congestionamento

```tcl
set_app_var compile_prefer_mux true
compile_ultra -spg
```

### Controlar congestion optimization

```tcl
# Desabilitar em um design específico
set_congestion_optimization [get_designs A] false
compile_ultra -spg
```

```tcl
# Aplicar apenas em designs/células específicos
set_congestion_optimization [get_designs *] false
set_congestion_optimization [get_designs "A D"] true
set_congestion_optimization [get_cells I_X4] true
compile_ultra -spg
```

### Gerar relatório de congestionamento

```tcl
report_congestion -build_map
report_congestion
```

### Abrir GUI e layout

```tcl
start_gui
```

Depois, pela interface:

```text
Window → New Layout Window
View → Map Mode
Reload para gerar congestion map
```

### Habilitar auto floorplanning

```tcl
set_auto_floorplan_constraints
```

### Iniciar IC Compiler II Design Planning

```tcl
start_icc2
```

### Usar SPG no IC Compiler II

```tcl
set_app_options -name place_opt.flow.do_spg -value true
place_opt
```

---

## Relação com projeto/laboratório

Esta aula é extremamente prática para entender por que um design que “fecha timing” em síntese pode falhar depois no físico.

Causas comuns:

- nets longas foram estimadas pessimista ou otimisticamente;
- camadas metálicas não foram modeladas corretamente;
- congestionamento severo obriga detours grandes;
- macros estão mal posicionadas;
- uma estrutura RTL criou uma árvore lógica difícil de rotear;
- o design precisa de floorplan melhor antes de continuar.

A sequência prática de análise é:

```text
compile_ultra -spg
↓
report_congestion
↓
heat map na GUI
↓
identificar hotspot
↓
rastrear células até RTL ou floorplan
↓
decidir: mexer em settings, floorplan ou RTL
↓
incremental compile ou full re-synthesis
```

O ponto mais importante é não tratar congestionamento apenas como problema do backend. O RTL e a síntese podem criar ou reduzir congestionamento.

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides 1-24.
- [x] Não avancei para o próximo arquivo.
- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 047 — 10 Constraints - Complex Design Considerations - parte A**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations.docx
```

Faixa:

```text
slides 1-17
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\10 Constraints - Complex Design Considerations_parte_A.md
```
