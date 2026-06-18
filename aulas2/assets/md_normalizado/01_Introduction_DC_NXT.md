# 01 Introduction — Design Compiler NXT - RTL Synthesis

## Controle do bloco

- **Bloco:** 031
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\01 Introduction.docx`
- **Faixa de slides:** 1-7
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\01 Introduction.md`
- **Próximo bloco recomendado:** 032 — `02 Design Setup for Physical Synthesis - parte A`

## Resumo executivo

Esta aula introduz o fluxo do **Design Compiler NXT** para síntese RTL com consciência física. A ideia principal é que a síntese moderna não deve transformar RTL em portas lógicas ignorando completamente o layout. Em tecnologias avançadas, o atraso dos fios, a posição física das células, o tamanho do chip, a presença de macros e a estimativa de roteamento influenciam diretamente timing, área e qualidade da netlist.

O ponto central é a **physical synthesis**, ou síntese física: o Design Compiler NXT recebe RTL, bibliotecas lógicas e físicas, constraints de timing e, quando disponível, informações de floorplan. Com isso, ele gera uma netlist otimizada e já com uma colocação física aproximada, chamada no slide de **coarse-placed netlist**.

A aula também mostra como abrir a ferramenta em modo interativo, GUI e batch, e apresenta a sequência geral do workshop: especificar bibliotecas, carregar RTL, carregar floorplan, aplicar constraints, sintetizar, analisar resultados e escrever a netlist com placement para etapas posteriores do fluxo físico.

## Texto extraído e organizado por slide

### Slide 1 — What is Physical Synthesis?

**Texto principal extraído:**

- **Physical synthesis converts RTL to an optimized and coarse-placed netlist**
  - Performed by invoking **Design Compiler NXT** in **topographical mode** and using `compile_ultra`.

- **A floorplan is needed for placement**
  - Floorplans are created by a physical design planning tool, like **IC Compiler II Design Planning**.
  - Use automatic floorplanning capabilities to use **Design Compiler NXT** to create floorplan based on RTL.

**Diagrama do slide:**

O diagrama mostra que a síntese física recebe:

- RTL design;
- timing constraints;
- design library, com biblioteca lógica e biblioteca física;
- floorplan.

E produz:

- standard cell placement;
- netlist;
- dados que se conectam ao fluxo de design planning e **SPG placement** no IC Compiler II.

### Slide 2 — Enabling Physical Synthesis

**Texto principal extraído:**

- **DC NXT in topographical mode performs coarse placement and uses virtual routing to estimate net lengths during synthesis**.
  - RCs are calculated based on reasonable net length estimates, instead of fanout.
  - Resulting RCs correlate closer with post-placement results → better optimized netlist.

- **A two-phase (pre-floorplan, post-floorplan) synthesis flow is recommended**.
  - The first netlist, pre-floorplan, is used by the layout tool, ICC II DP, to design the floorplan.
  - The post-floorplan netlist, based on floorplan from ICC II DP, is placed and routed.

**Figura do slide:**

A figura mostra um exemplo de floorplan contendo:

- tamanho e forma da área de colocação do core;
- posicionamento de macros, como IP e RAM;
- regiões de keepout para standard cells.

### Slide 3 — Interfaces of Design Compiler NXT

O slide apresenta três formas de usar o Design Compiler NXT.

**1. Shell interativo:**

```tcl
unix% dcnxt_shell -topographical_mode
dcnxt_shell-topo>
```

**2. GUI interativa com Design Vision:**

```tcl
unix% dcnxt_shell -topo -gui
```

**3. Batch mode:**

```tcl
unix% dcnxt_shell -topo -f RUN.tcl | tee RUN.log
```

### Slide 4 — Design Compiler NXT Transformations

**Fluxo mostrado no slide:**

```text
Translation → Logic optimization → Gate mapping
```

Etapas visíveis no diagrama:

1. **RTL source**
2. **Translate** com `analyze` e `elaborate`
3. **Floorplan** com `read_floorplan`
4. **Timing constraints** com comandos como `create_clock` e `set_input_delay`
5. **Constraint** com `source`
6. **Compile** com logic optimization + gate mapping usando `compile_ultra`
7. **Save** com `write_icc2_files`

O diagrama também mostra a transformação de uma representação genérica, como lógica booleana, GTECH ou portas ainda não mapeadas, para portas específicas da tecnologia e já colocadas fisicamente.

### Slide 5 — Design Compiler NXT Flow Covered in Workshop

O workshop cobre o seguinte fluxo:

1. **Specify libraries**
2. **Load RTL code**
3. **Load floorplan**
4. **Apply constraints**
5. **Synthesize the design**
6. **Analyze results**
7. **Write netlist with cell placement**

Esse slide resume o caminho prático do curso: preparar ambiente, carregar projeto, informar restrições, sintetizar, revisar relatórios e exportar resultado para a etapa física.

### Slide 6 — Helpful UNIX-Like `dcnxt_shell` Commands

**Encontrar localização e nomes de arquivos:**

```tcl
dcnxt_shell-topo> pwd; cd; ls
```

**Mostrar histórico de comandos:**

```tcl
dcnxt_shell-topo> history
```

**Repetir o último comando:**

```tcl
dcnxt_shell-topo> !!
```

**Executar o comando número 7 do histórico:**

```tcl
dcnxt_shell-topo> !7
```

**Executar o último comando que começa com `rep`:**

```tcl
dcnxt_shell-topo> !rep
```

**Executar qualquer comando UNIX:**

```tcl
dcnxt_shell-topo> sh <UNIX_command>
```

**Obter o valor de uma variável de ambiente UNIX:**

```tcl
dcnxt_shell-topo> get_unix_variable <UNIX_env_variable>
```

### Slide 7 — Icons Used

O slide lista ícones usados ao longo do curso:

- **Recommendation** — recomendação importante.
- **Question** — pergunta para reflexão ou checagem.
- **Quiz** — questão de revisão.
- **Caution: Non-intuitive tool behavior** — cuidado com comportamento não intuitivo da ferramenta.
- **Avoid** — prática a evitar.
- **Lab Exercise** — exercício de laboratório.

## Aula didática desenvolvida

### 1. Por que existe physical synthesis?

Na síntese lógica tradicional, o fluxo básico é:

```text
RTL → lógica genérica → portas da biblioteca → netlist
```

Esse fluxo funciona bem para entender a função lógica do circuito, mas ele é limitado quando o atraso físico dos fios começa a pesar. Em circuitos modernos, duas células podem estar logicamente conectadas, mas fisicamente muito distantes. Essa distância aumenta a capacitância e a resistência do fio, formando um atraso RC relevante.

Por isso, o Design Compiler NXT tenta aproximar a síntese lógica da realidade física. Ele não espera o placement final para começar a pensar em fios, distância, fanout físico e localização das células. Ele realiza uma estimativa física durante a própria síntese.

O resultado é uma netlist mais coerente com o que provavelmente acontecerá depois no backend.

### 2. O que significa transformar RTL em netlist otimizada e coarse-placed?

Quando o slide diz que physical synthesis converte RTL em uma **optimized and coarse-placed netlist**, há duas ideias juntas.

**Optimized netlist** significa que a ferramenta aplicou otimizações de lógica, timing, área e possivelmente potência. Ela escolheu portas da biblioteca, reestruturou lógica, inseriu buffers, ajustou células e tentou respeitar as constraints.

**Coarse-placed netlist** significa que a netlist já vem acompanhada de uma colocação física aproximada. Não é ainda o placement final do backend, mas já existe uma noção de onde as células devem ficar. Isso permite estimar melhor o comprimento dos fios e, portanto, os atrasos RC.

A diferença é esta:

```text
Síntese clássica:
RTL → netlist lógica, com pouca noção física

Síntese física:
RTL + bibliotecas + constraints + floorplan → netlist otimizada com noção física aproximada
```

### 3. O papel do topographical mode

O slide destaca que o DC NXT deve ser invocado em **topographical mode**.

Esse modo ativa a síntese com consciência física. A ferramenta passa a usar bibliotecas físicas e estimativas de placement/roteamento para calcular melhor os atrasos. Sem esse modo, a síntese fica mais próxima de uma síntese lógica tradicional.

Com topographical mode, o DC NXT usa **virtual routing** para estimar o comprimento das nets. Isso não é roteamento final, mas é uma aproximação baseada na posição física estimada das células e nos obstáculos do floorplan.

Em vez de estimar atraso apenas por fanout, a ferramenta tenta estimar atraso por algo mais físico:

```text
fanout puro → estimativa grosseira
comprimento estimado da net + RC → estimativa mais realista
```

### 4. Por que estimar RC é tão importante?

RC vem de:

- **R**: resistência do fio;
- **C**: capacitância do fio e das entradas conectadas.

Um fio maior tende a ter maior resistência e maior capacitância. Isso aumenta o atraso de propagação. Em síntese, se a ferramenta subestima o atraso dos fios, ela pode achar que o circuito fecha timing quando na prática não fecha depois do placement.

O slide afirma que, no modo topographical, os RCs são calculados com base em estimativas razoáveis de comprimento de net, não apenas em fanout. Isso aumenta a correlação entre a síntese e os resultados pós-placement.

Em termos práticos:

```text
Melhor estimativa física → melhor otimização → menos surpresa no backend
```

### 5. Floorplan: o mapa físico inicial do chip

A aula mostra que um floorplan é necessário para placement. O floorplan define a organização física de alto nível do design.

Ele pode incluir:

- tamanho e formato da área do core;
- localização de macros, como RAMs e IPs;
- regiões proibidas para standard cells, chamadas de keepout;
- possíveis regiões de placement;
- orientação física geral do design.

Macros são blocos grandes e pré-definidos, como memórias, PLLs ou IPs. Elas não são pequenas standard cells que a ferramenta pode espalhar livremente. Por isso, a posição delas influencia muito o roteamento e o timing.

Uma RAM mal posicionada pode criar fios longos, congestão e violações de timing. Um floorplan bem feito reduz esse risco.

### 6. Fluxo em duas fases: pre-floorplan e post-floorplan

O slide recomenda um fluxo em duas fases:

```text
1. Síntese pre-floorplan
2. Criação/refinamento do floorplan no ICC II DP
3. Síntese post-floorplan
4. Placement e routing final
```

Na primeira fase, o Design Compiler NXT gera uma netlist inicial. Essa netlist é usada pela ferramenta de layout, como o **IC Compiler II Design Planning**, para criar ou refinar o floorplan.

Depois, com o floorplan mais realista, o Design Compiler NXT roda novamente uma síntese melhor informada fisicamente. Essa segunda netlist, chamada no slide de post-floorplan netlist, tende a ter melhor qualidade para placement e routing.

O motivo é simples: antes do floorplan real, a ferramenta está estimando com menos informação. Depois do floorplan, ela passa a saber melhor onde estão macros, áreas de keepout e regiões disponíveis para standard cells.

### 7. Bibliotecas lógicas e bibliotecas físicas

O diagrama mostra uma **design library** contendo uma biblioteca lógica e uma biblioteca física.

A biblioteca lógica descreve características como:

- função lógica da célula;
- timing;
- potência;
- capacitância de entrada;
- drive strength;
- nomes de pinos.

A biblioteca física descreve informações necessárias ao layout, como:

- tamanho físico da célula;
- localização dos pinos;
- camadas de metal;
- informações de geometria;
- dados usados por placement e routing.

Para physical synthesis, não basta saber que existe uma NAND, um flip-flop ou um buffer. A ferramenta precisa saber também quanto espaço essas células ocupam e como elas se conectam fisicamente.

### 8. As interfaces do Design Compiler NXT

A aula apresenta três modos de uso.

#### Shell interativo

```tcl
unix% dcnxt_shell -topographical_mode
dcnxt_shell-topo>
```

Esse modo é útil para testar comandos, explorar o design, consultar objetos e aprender o comportamento da ferramenta.

#### GUI

```tcl
unix% dcnxt_shell -topo -gui
```

A GUI é útil para visualizar design, hierarquia, células, placement e alguns resultados de forma mais gráfica. Ela ajuda quando o problema não é apenas textual, mas espacial.

#### Batch mode

```tcl
unix% dcnxt_shell -topo -f RUN.tcl | tee RUN.log
```

Esse é o modo mais importante para fluxo profissional e laboratório. O arquivo `RUN.tcl` contém a sequência de comandos da síntese. O `tee RUN.log` mostra a saída no terminal e ao mesmo tempo grava tudo no arquivo de log.

Esse modo permite reprodutibilidade. Em projetos reais, você não quer depender de comandos digitados manualmente; quer um script versionado, revisável e repetível.

### 9. Transformações internas: de RTL até portas colocadas

O slide de transformações mostra esta sequência:

```text
Translation → Logic optimization → Gate mapping
```

Na prática, ela pode ser entendida assim:

1. **RTL source**: código Verilog/SystemVerilog/VHDL que descreve o comportamento ou estrutura RTL.
2. **Analyze**: leitura e análise sintática/semântica dos arquivos RTL.
3. **Elaborate**: construção da hierarquia do design, resolução de parâmetros, instâncias e conexões.
4. **Read floorplan**: leitura das informações físicas iniciais.
5. **Source constraints**: carregamento das constraints, normalmente em Tcl/SDC.
6. **Compile ultra**: otimização lógica, otimização física e mapeamento para a biblioteca tecnológica.
7. **Write ICC2 files**: exportação dos arquivos necessários para continuidade no IC Compiler II.

A fase de **translation** transforma RTL em uma representação interna genérica. A fase de **logic optimization** melhora a lógica antes ou durante o mapeamento. A fase de **gate mapping** escolhe células reais da biblioteca tecnológica.

### 10. O que significa GTECH ou unmapped gates?

Antes de mapear para células reais da biblioteca, a ferramenta pode representar a lógica com operadores e portas genéricas. Essa representação não é ainda fabricável, porque não diz exatamente qual célula da tecnologia será usada.

Exemplo conceitual:

```text
Lógica genérica:
y = (a & b) | c

Possível mapeamento tecnológico:
U1 = NAND2_X1
U2 = INV_X1
U3 = OR2_X2
```

A etapa de mapping escolhe células reais considerando timing, área, potência, drive strength e disponibilidade na biblioteca.

## Conceitos difíceis explicados em profundidade

### Physical synthesis

**O que é:** síntese que considera informações físicas durante a transformação de RTL em netlist.

**Por que existe:** porque o atraso de interconexão pode dominar o timing. Uma síntese puramente lógica pode gerar uma netlist que parece boa antes do layout, mas ruim depois do placement.

**Onde aparece no fluxo:** entre RTL e backend físico. Ela prepara uma netlist mais amigável para placement e routing.

**Erro comum:** pensar que physical synthesis substitui o backend. Não substitui. Ela melhora a netlist antes do backend, mas o placement e o routing finais ainda são feitos por ferramentas físicas.

### Topographical mode

**O que é:** modo do Design Compiler NXT que ativa a síntese com consciência física.

**Como aparece no comando:**

```tcl
dcnxt_shell -topographical_mode
```

ou:

```tcl
dcnxt_shell -topo
```

**Por que importa:** sem esse modo, a ferramenta não usa da mesma forma as informações físicas para estimar placement, roteamento virtual e RC.

**Erro comum:** rodar um script que pressupõe topographical mode sem abrir a ferramenta nesse modo. Isso pode causar erro, warning ou resultados de qualidade inferior.

### Coarse placement

**O que é:** uma colocação aproximada das células.

**Por que existe:** para permitir estimativas melhores de comprimento de fios e atraso RC durante a síntese.

**Diferença para placement final:** o coarse placement é uma orientação física inicial; o placement final é refinado no backend, considerando legalização, congestionamento, CTS, routing e signoff.

### Virtual routing

**O que é:** uma estimativa de roteamento usada para prever comprimento de nets e RC.

**Por que existe:** para não depender de estimativas muito abstratas, como fanout puro.

**Onde aparece:** durante a síntese física em topographical mode.

**Erro comum:** achar que virtual routing já é o routing final. Não é. Ele é uma aproximação para guiar otimização.

### Floorplan

**O que é:** organização física inicial do chip ou bloco.

**Contém:** área do core, macros, keepouts, regiões de placement e restrições físicas.

**Por que importa para síntese:** se o sintetizador conhece o floorplan, ele consegue otimizar a lógica com base em uma realidade física mais próxima.

**Erro comum:** tratar floorplan como algo apenas do backend. No fluxo físico moderno, ele também influencia a síntese.

### Timing constraints

O slide mostra comandos como:

```tcl
create_clock ...
set_input_delay ...
```

Esses comandos fazem parte do universo de constraints, normalmente em formato SDC/Tcl.

**`create_clock`** informa à ferramenta qual é o clock, seu período e sua origem.

Exemplo conceitual:

```tcl
create_clock -period 10 [get_ports clk]
```

Isso diz que `clk` tem período de 10 ns.

**`set_input_delay`** informa o atraso externo associado a uma entrada do bloco.

Exemplo conceitual:

```tcl
set_input_delay 2 -clock clk [get_ports data_in]
```

Isso diz que `data_in` chega ao bloco 2 ns depois da referência do clock externo.

**Erro comum:** carregar RTL e biblioteca, mas esquecer constraints. Sem constraints, a ferramenta não sabe qual timing perseguir.

### `compile_ultra`

**O que é:** comando de síntese/otimização usado para gerar uma netlist otimizada e mapeada para a biblioteca.

No contexto do slide, ele aparece como a etapa de:

```text
Logic optimization + gate mapping
```

**Por que importa:** é o comando central que transforma a representação intermediária em uma implementação tecnológica otimizada.

**Erro comum:** imaginar que `compile_ultra` apenas “converte para portas”. Ele também otimiza a lógica segundo constraints, bibliotecas e informações físicas disponíveis.

### `write_icc2_files`

**O que é:** comando usado para salvar dados de saída para continuidade no IC Compiler II.

**Por que importa:** o objetivo do fluxo não é apenas obter uma netlist textual. É gerar dados que preservem informações necessárias para a etapa física, incluindo placement de células.

**Erro comum:** salvar apenas uma netlist Verilog comum quando o próximo passo exige um pacote de dados mais completo para ICC II.

### Batch mode e `tee`

O comando:

```tcl
dcnxt_shell -topo -f RUN.tcl | tee RUN.log
```

faz três coisas:

1. abre o Design Compiler NXT em modo topográfico;
2. executa o script `RUN.tcl`;
3. grava a saída em `RUN.log`, sem deixar de mostrar no terminal.

Esse padrão é muito usado em laboratório e projeto real porque permite investigar warnings, erros, relatórios e comportamento da ferramenta depois da execução.

## Figuras, diagramas e waveforms importantes

### Diagrama de physical synthesis

O diagrama do primeiro slide mostra a síntese física como uma etapa que combina design lógico e informação física. Ele deve ser estudado como uma ponte entre frontend e backend.

A entrada não é apenas RTL. A ferramenta também precisa de constraints, bibliotecas e floorplan. A saída não é apenas uma netlist lógica; é uma netlist otimizada com placement aproximado.

### Exemplo de floorplan

A figura do segundo slide mostra um core com regiões internas, macros como IP/RAM e áreas de keepout. Essa imagem é importante porque mostra que o design físico não é uma folha em branco. Algumas regiões já estão ocupadas ou restritas, e isso afeta onde as standard cells podem ser colocadas.

### Diagrama de transformações

O slide de transformações deve ser memorizado como o ciclo lógico da ferramenta:

```text
RTL → analyze/elaborate → constraints/floorplan → compile_ultra → write_icc2_files
```

Ele conecta comandos Tcl com as transformações internas do sintetizador.

### Fluxo do workshop

O slide do workshop é o mapa prático da disciplina. Ele indica a ordem operacional que provavelmente aparecerá nos laboratórios e nos scripts:

```text
Bibliotecas → RTL → floorplan → constraints → síntese → análise → saída para ICC II
```

## Pontos de prova e revisão

- **Physical synthesis** converte RTL em uma netlist otimizada e com colocação física aproximada.
- O Design Compiler NXT deve ser invocado em **topographical mode** para realizar síntese física.
- O comando central de síntese mostrado é `compile_ultra`.
- Um **floorplan** é necessário para orientar placement.
- O floorplan pode vir de uma ferramenta como **IC Compiler II Design Planning**.
- Em topographical mode, o DC NXT usa **coarse placement** e **virtual routing**.
- O virtual routing estima comprimentos de nets durante a síntese.
- Os RCs passam a ser calculados com base em estimativas de comprimento de net, não apenas fanout.
- Melhor estimativa de RC gera melhor correlação com resultados pós-placement.
- O fluxo recomendado é de duas fases: **pre-floorplan** e **post-floorplan**.
- A netlist pre-floorplan ajuda a ferramenta de layout a criar o floorplan.
- A netlist post-floorplan é baseada no floorplan refinado e segue para placement e routing.
- Interface interativa:

```tcl
dcnxt_shell -topographical_mode
```

- Interface GUI:

```tcl
dcnxt_shell -topo -gui
```

- Execução batch:

```tcl
dcnxt_shell -topo -f RUN.tcl | tee RUN.log
```

- A sequência de transformações é:

```text
Translation → Logic optimization → Gate mapping
```

- `analyze` e `elaborate` aparecem na etapa de translation.
- `read_floorplan` carrega informações físicas.
- `source` carrega constraints/scripts.
- `write_icc2_files` salva dados para continuidade no IC Compiler II.
- Comandos úteis dentro do shell incluem `pwd`, `cd`, `ls`, `history`, `!!`, `!7`, `!rep`, `sh` e `get_unix_variable`.

## Relação com projeto/laboratório

Esta aula prepara o terreno para entender os scripts de síntese que aparecerão no curso. Quando você abrir um `RUN.tcl`, provavelmente verá comandos seguindo a ordem do workshop:

```tcl
# ideia geral do fluxo
# 1. configurar bibliotecas
# 2. ler RTL
# 3. elaborar o design
# 4. carregar floorplan
# 5. carregar constraints
# 6. rodar compile_ultra
# 7. gerar relatórios
# 8. escrever arquivos para ICC II
```

O comando batch:

```tcl
dcnxt_shell -topo -f RUN.tcl | tee RUN.log
```

é especialmente importante para laboratório. Ele permite rodar o fluxo completo e depois analisar o `RUN.log`. Em caso de erro, warning ou resultado ruim, o log será a principal fonte de diagnóstico.

Também é importante reconhecer que este curso não está ensinando apenas “síntese lógica”. Ele está preparando você para um fluxo em que síntese e implementação física conversam entre si. Por isso aparecem termos como floorplan, placement, virtual routing, RC, IC Compiler II e `write_icc2_files` já na primeira aula.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
