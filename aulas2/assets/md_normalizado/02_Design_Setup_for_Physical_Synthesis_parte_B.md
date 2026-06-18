# 02 Design Setup for Physical Synthesis — parte B

## Controle do bloco

- **Bloco:** 033
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Faixa de slides processada:** slides 26-50
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis_parte_B.md`
- **Próximo bloco recomendado:** Bloco 034 — `02 Design Setup for Physical Synthesis - parte C`
- **Próximo arquivo:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Próxima faixa:** slides 51-58

> Observação de divisão: esta parte começa no slide **Physical Synthesis Requirements**, logo depois dos quizzes finais da parte A sobre bibliotecas lógicas `.db`, `target_library`, `link_library` e variáveis de aplicação. A parte B aprofunda o que o DC NXT precisa para fazer **physical synthesis**: bibliotecas físicas, arquivo de tecnologia, TLUPlus, mapeamento de camadas, design library, floorplan e scripts de setup.

---

## Resumo executivo

Nesta parte da aula, o foco muda de **setup lógico** para **setup físico**. Na parte A, a ferramenta precisava de bibliotecas lógicas `.db` para saber quais portas e flip-flops existem, quais atrasos têm, quais restrições elétricas possuem e como mapear GTECH para células reais. Agora, para operar em **topographical mode** e fazer **physical synthesis**, o DC NXT também precisa de dados físicos: tamanho das células, localização dos pinos, camadas de roteamento, vias, modelos RC de interconexão, nomes de camadas e informações de floorplan.

A ideia central é: physical synthesis não é apenas “síntese lógica com timing”. Ela tenta estimar melhor o mundo físico antes do place & route final. Para isso, o DC NXT faz **coarse placement** interno, estima comprimentos de nets e parasitas, e produz uma netlist com melhor correlação com o resultado pós-placement. Mas ele não cria rotas metálicas precisas nem substitui o IC Compiler II.

A aula também apresenta o problema “chicken and egg”: para sintetizar fisicamente bem, seria ideal ter um floorplan; mas para criar um floorplan, geralmente é preciso ter uma netlist inicial. A solução recomendada é um fluxo em duas fases:

1. **Pre-floorplan synthesis:** usa floorplan padrão ou restrições físicas iniciais para gerar uma netlist inicial. Essa netlist serve principalmente para ajudar o planejamento físico.
2. **Post-floorplan synthesis:** depois que o floorplan real foi criado no ICC II ou outra ferramenta, o DC NXT relê esse floorplan e refaz a síntese com estimativas físicas melhores.

Ao final, a aula mostra uma boa organização de scripts: separar variáveis editáveis em `common_setup.tcl`, deixar `dc_setup.tcl` como setup reutilizável e criar um script principal de síntese, como `dc.tcl`, que lê RTL, elabora, checa o design, aplica constraints, compila e exporta dados para o ICC II.

---

## Texto extraído e organizado por slide

### Slide 26 — Physical Synthesis Requirements

**Texto principal extraído:**

- Recall the definition of physical synthesis:
  - Physical synthesis takes RTL input and generates an optimized gate-level netlist with standard cell coarse placement.
  - Coarse placement is used to estimate routing lengths.
- Performed by invoking DC NXT in **topographical mode**, and executing `compile_ultra`.
- Requires:
  - physical cell library in New Data Model, **NDM**, format and technology data;
  - floorplan information, to be covered in the next section.

**Leitura didática:**

Physical synthesis é a síntese que considera informações físicas aproximadas durante a otimização lógica. A ferramenta ainda recebe RTL como entrada e ainda produz uma netlist gate-level, mas ela tenta posicionar grosseiramente as células para estimar melhor os comprimentos das interconexões.

Isso é importante porque, em tecnologias modernas, o atraso não vem apenas da célula lógica. Muitas vezes o atraso do fio, a capacitância da net e a carga física passam a dominar o timing. Se a síntese ignorar completamente onde as células estarão, ela pode otimizar uma netlist que parece boa antes do placement, mas fica ruim depois.

---

### Slide 27 — Physical Information Needed for Physical Synthesis

**Texto principal extraído:**

Physical information needed for physical synthesis:

- From the ASIC vendor/library group:
  - **Physical cell libraries (NDM)**:
    - standard cells, frame view;
    - IP or macro cells, frame view;
    - provides cell size and pin locations.
  - **Technology data**:
    - Technology File;
    - TLUPlus files;
    - Layer Mapping File.
- The technology file defines routing layers, vias and more.
- TLUPlus files provide parasitic net RC models.
- The layer mapping file matches same layers with different names.
- A **design library** is required to store the Technology File content and pointers to the physical cell libraries.

**Leitura didática:**

Para síntese lógica tradicional, a biblioteca `.db` já dá muita informação: função lógica, área, timing e restrições elétricas. Mas para síntese física, isso não basta. A ferramenta precisa saber onde os pinos ficam, qual é a forma aproximada da célula, quais camadas existem, quais vias existem e como estimar resistência/capacitância dos fios.

O slide separa bem três grupos:

1. **Biblioteca física NDM:** descreve o “frame view” das células e macros. Isso inclui contorno da célula, pinos, obstruções e informação física suficiente para estimar placement/roteamento.
2. **Technology File `.tf`:** descreve camadas, vias, regras e sites da tecnologia.
3. **TLUPlus + map file:** fornece modelos RC e resolve diferenças de nomes entre camadas do technology file e camadas dos modelos parasitários.

---

### Slide 28 — What is a Physical Cell Library?

**Texto principal extraído:**

- A standard cell is a predesigned layout of one specific basic logic gate.
- Each cell usually has the same standard height.
- A physical cell library contains a collection of standard cells or macro/IP cells described in **frame view** and is available in **NDM format**, `.ndm`.
- Libraries are usually supplied by an ASIC vendor or library group and are unique to each foundry’s technology or process parameters:
  - example: 10 nm vs. 7 nm;
  - 8 vs. 10 metal layers.
- DC NXT uses the **frame view** of the physical library.
  - Timing views are ignored.

**Figura:**

A figura mostra uma célula física NAND de duas entradas, `NAND_1`, com trilhos de `VDD` e `GND`, pinos metálicos `A`, `B` e `Y`, e o contorno físico da célula.

**Leitura didática:**

A biblioteca física não é a mesma coisa que a biblioteca lógica. A biblioteca lógica responde perguntas como:

- qual é a função da célula?
- qual é o atraso da célula?
- qual é a capacitância máxima suportada?
- qual é a área lógica usada pela síntese?

A biblioteca física responde perguntas como:

- qual é o tamanho físico da célula?
- onde ficam os pinos?
- quais regiões bloqueiam roteamento?
- como a célula encaixa nas rows de standard cells?
- como macros e IPs ocupam espaço no core?

Quando o slide diz que o DC NXT usa o **frame view** e ignora timing views da biblioteca física, a ideia é: o timing continua vindo das bibliotecas lógicas `.db`. A parte física da NDM serve para placement, pin location, obstruções e geometria.

---

### Slide 29 — Technology File (`.tf file`)

**Texto principal extraído:**

- The technology file is unique to each technology.
- Defines parameters for all process layers:
  - layer name;
  - layer number;
  - colors and patterns for display;
  - design rules: width, spacing, area, pitch, etc.;
  - via contact definitions: lower/upper metal layers, metal enclosure, etc.;
  - default via array rules;
  - site definitions.

**Leitura didática:**

O technology file é uma descrição da tecnologia física vista pela ferramenta. Ele diz quais camadas existem, como elas são chamadas, quais números terão no banco de dados físico, quais regras mínimas devem obedecer e como as vias conectam uma camada à outra.

Em physical synthesis, o DC NXT não precisa fazer um roteamento final com todos os detalhes de signoff, mas precisa ter informação suficiente para estimar congestionamento, possíveis caminhos de roteamento, área de célula, rows e relações físicas básicas.

Um detalhe importante: o technology file não é um substituto para os arquivos de parasitas TLUPlus. O `.tf` define a tecnologia e regras geométricas. O TLUPlus modela resistência e capacitância das interconexões.

---

### Slide 30 — Routing Direction

**Texto principal extraído:**

- The technology file does **not** define the preferred routing direction of metal layers.
- Preferred routing direction is needed for global route-based congestion analysis.
- Specify the routing directions:

```tcl
set_preferred_routing_direction -layers {M1 M3 M5 M7} \
    -direction horizontal
set_preferred_routing_direction -layers {M2 M4 M6 M8 MRDL} \
    -direction vertical
```

- Must be set **after** reading in the RTL code or `ddc` netlist.
- If set before `current_design` is set, an error will be generated:

```text
Error: Current design is not defined. (UID-4)
Error: Can't find object 'M1'. (UID-109)
0
```

**Leitura didática:**

Mesmo com technology file carregado, o DC NXT ainda precisa saber a direção preferencial de roteamento por camada. Em muitos processos, as camadas alternam: uma horizontal, outra vertical, outra horizontal, outra vertical. Essa alternância reduz congestionamento e facilita o roteamento.

O detalhe de ordem é importante: o comando deve ser aplicado depois que a ferramenta já tem um `current_design`. Se o design ainda não foi lido/elaborado, a ferramenta pode não conseguir resolver corretamente objetos como `M1`, `M2` etc. Por isso o slide mostra erro quando o comando é usado cedo demais.

**Regra prática:** comandos que dependem do contexto do design devem vir depois de `analyze`/`elaborate` ou depois de `read_ddc` e `current_design`.

---

### Slide 31 — TLUPlus Files

**Texto principal extraído:**

- TLUPlus files contain R and C look-up tables.
- Model UDSM process effects:
  - conformal dielectric;
  - metal fill;
  - shallow trench isolation;
  - copper dishing:
    - density analysis;
    - width/spacing;
  - trapezoid conductor;
  - etc.
- Generated from ITF using StarRC `grdgenxo`.

**Leitura didática:**

TLUPlus é um formato usado para representar modelos de parasitas de interconexão. O nome está ligado à ideia de tabelas de consulta: a ferramenta consulta tabelas para estimar resistência e capacitância conforme largura, espaçamento, camada, densidade e outros parâmetros físicos.

Isso é essencial porque o atraso de uma net depende não só da porta que a dirige, mas também do fio. Em tecnologias muito pequenas, efeitos de fabricação como metal fill, copper dishing e isolamento entre regiões influenciam a capacitância e a resistência vistas pelo sinal.

Em termos práticos:

- a biblioteca `.db` diz o atraso da célula e suas restrições elétricas;
- a biblioteca NDM diz geometria e pinos;
- o TLUPlus ajuda a estimar o RC das nets.

---

### Slide 32 — Layer Mapping File

**Texto principal extraído:**

- The layer mapping file matches the technology file layer/via names with the TLUPlus layer/via names.
- Exemplo visual:
  - no technology file, a camada aparece como `METAL1`;
  - no TLUPlus, a camada equivalente pode aparecer como `cm1`;
  - no mapping file, a relação é declarada.

Exemplo conceitual do mapeamento mostrado:

```text
Technology file      TLUPlus file
POLY             ->  poly
METAL1           ->  cm1
METAL2           ->  cm2
METAL3           ->  cm3
METAL4           ->  cm4
```

**Leitura didática:**

O arquivo de mapeamento existe porque diferentes arquivos podem chamar a mesma camada por nomes diferentes. Para o technology file, a camada pode se chamar `METAL1`. Para o TLUPlus, ela pode se chamar `cm1`. A ferramenta precisa saber que esses dois nomes representam a mesma camada física.

Sem esse mapeamento, a ferramenta pode carregar o technology file e carregar o TLUPlus, mas não saber associar os modelos RC às camadas corretas. Isso quebraria a estimativa física.

---

### Slide 33 — Physical Synthesis Requires a Design Library

**Texto principal extraído:**

- For physical synthesis, DC NXT requires a **Design Library**.
- Acts as a container to hold technology data and pointers to physical cell libraries.
- Points to the same physical reference libraries used by IC Compiler II, ICC II.
- Diagram:
  - Design Library, NDM;
  - Cell Libraries, CLIBs, with logic, timing and physical data;
  - `.ndm` standard cells;
  - `.ndm` IP cells;
  - Technology File, `.tf file`.

**Leitura didática:**

A design library é um contêiner usado pelo DC NXT para trabalhar com dados físicos. Ela não é apenas uma pasta qualquer. Ela guarda o conteúdo do technology file e aponta para as bibliotecas físicas de referência.

Pense nela como o “ambiente físico ativo” da sessão. Quando o DC NXT faz physical synthesis, ele precisa abrir uma design library para saber qual tecnologia e quais bibliotecas físicas estão sendo usadas.

Esse conceito é muito parecido com o que aparece no IC Compiler II, porque o objetivo é manter correlação entre síntese física e implementação física.

---

### Slide 34 — Creating a Design Library

**Texto principal extraído:**

Create the design library and set TLUPlus files before reading RTL:

```tcl
source dc_setup.tcl

set ndm_reference_library ../CLIB/saed32_lvt.ndm
set ndm_design_library    ./MY_design.dlib

create_lib \
    -ref_libs   $ndm_reference_library \
    -technology ./tech/saed32_1p9m.tf \
    $ndm_design_library

check_library

set_tlu_plus_files \
    -max_tluplus  ./tech/saed32_1p9m_Cmax.tluplus \
    -tech2itf_map ./tech/saed32_tf_itf_tluplus.map

analyze ...
elaborate ...
```

**Anotações visuais do slide:**

- `create_lib` cria uma design library com nome definido pelo usuário.
- Essa biblioteca guarda o **cell frame view** e os dados de tecnologia.
- `check_library` faz checagem de consistência entre bibliotecas lógicas e físicas.
- `set_tlu_plus_files` carrega arquivos TLUPlus e map file separadamente.

**Leitura didática:**

A ordem é importante: o setup físico deve ser preparado antes de ler e elaborar o RTL, porque a síntese topográfica precisa dessas informações para estimar placement e parasitas.

O comando `create_lib` cria a design library de trabalho. Ele recebe:

- `-ref_libs`: bibliotecas físicas de referência, como standard cells, IPs e macros em NDM;
- `-technology`: arquivo `.tf` da tecnologia;
- nome da biblioteca de design a ser criada.

Depois, `check_library` verifica se há consistência entre o mundo lógico e o mundo físico. Por exemplo: uma célula existente na biblioteca lógica deve ter correspondente físico quando for usada em physical synthesis.

---

### Slide 35 — Opening an Existing Design Library

**Texto principal extraído:**

Subsequent DC NXT physical synthesis session:

- Open the existing library.
- Re-load the TLUPlus and map files.

Script mostrado:

```tcl
if {![file isdirectory $ndm_design_library]} {
    # If library already exists, skip create_lib

    create_lib \
        -ref_libs   $ndm_reference_library \
        -technology ./tech/saed32_1p9m.tf \
        $ndm_design_library

    check_library
} else {
    open_lib $ndm_design_library
}

set_tlu_plus_files \
    -max_tluplus  ./tech/saed32_1p9m_Cmax.tluplus \
    -tech2itf_map ./tech/saed32_tf_itf_tluplus.map
```

**Leitura didática:**

A design library pode já existir de uma execução anterior. Nesse caso, não faz sentido recriá-la sempre. A boa prática é testar se a biblioteca já existe:

- se não existe, cria com `create_lib`;
- se existe, abre com `open_lib`.

Mas há um detalhe crítico: mesmo abrindo uma biblioteca existente, o slide indica que os arquivos TLUPlus e map file devem ser carregados novamente. Ou seja, abrir a design library não substitui todo o setup de parasitas da sessão.

---

### Slide 36 — The “Chicken and Egg” Problem

**Texto principal extraído:**

- Physical synthesis requires a floorplan.
- Generating a floorplan requires a netlist.
- But synthesizing a netlist requires a floorplan.
- But generating a floorplan requires a netlist...

Pergunta do slide:

```text
What comes first — the netlist or the floorplan?
```

**Leitura didática:**

Esse é um problema clássico de fluxo físico. Para fazer uma síntese física boa, a ferramenta gostaria de saber o floorplan: tamanho do core, posição de macros, portas, bloqueios, canais de roteamento etc. Mas para planejar o floorplan, a ferramenta física geralmente precisa de uma netlist inicial, porque precisa saber quais blocos existem, quantas células serão usadas e como as conexões se distribuem.

A solução prática não é tentar resolver tudo de uma vez. A solução é iterativa:

1. gerar uma netlist inicial com estimativas físicas simplificadas;
2. usar essa netlist para criar um floorplan melhor;
3. voltar ao DC NXT com o floorplan real;
4. resintetizar com correlação física melhor.

---

### Slide 37 — Solution: Two-Phase SPG Synthesis Flow

**Texto principal extraído:**

A two-phase SPG synthesis flow is recommended:

- **Pre-floorplan synthesis** uses DC NXT’s default floorplan or user-defined physical constraints, if available.
  - Netlist used only to design the floorplan.
- **Post-floorplan synthesis** uses the designed floorplan for improved netlist optimization.
  - Netlist and placement sent to ICC II placement.
  - Requires an SPG flow, covered in unit 8.

**Figura:**

O diagrama mostra:

- RTL design entrando em duas fases;
- pre-floorplan synthesis gerando uma pre-floorplan netlist;
- essa netlist indo para Design Planning, ICC II DP;
- o resultado é um floorplan;
- depois o floorplan volta para uma post-floorplan SPG synthesis;
- a saída final inclui post-floorplan netlist e standard cell placement;
- esses dados seguem para SPG Placement no ICC II.

**Leitura didática:**

SPG significa, no contexto do fluxo Synopsys, um fluxo em que a síntese passa informações de placement para a ferramenta física, melhorando a correlação entre DC NXT e ICC II.

O primeiro passo não busca a melhor netlist final. Ele busca uma netlist razoável para ajudar o design planning. O segundo passo, já com floorplan real, é que deve produzir uma netlist mais próxima do resultado físico esperado.

---

### Slide 38 — Pre-Floorplan Synthesis: Default Floorplan Constraints

**Texto principal extraído:**

- Topographical mode uses default floorplan constraints, if none are specified:
  - square core placement area;
  - core size based on 60% utilization;
  - places IP or macro cells along with standard cells;
  - assigns arbitrary port locations to top-level design.
- Acceptable for pre-floorplan synthesis:
  - this netlist will only be used to design the floorplan;
  - maximum netlist QoR is not crucial at this point.

**Figura:**

A figura mostra uma estimativa de interconnect do DC NXT usando constraints padrão de floorplan. O core aparece de forma retangular/quase quadrada, com IP e RAM posicionados de forma inicial.

**Leitura didática:**

Quando você ainda não tem floorplan, o DC NXT inventa um floorplan razoável por padrão. Ele assume área de core, utiliza 60% de ocupação e coloca macros/IPs de modo aproximado.

Isso não deve ser confundido com floorplan final. É apenas um modelo físico inicial para estimativa. Serve para gerar uma netlist mais útil do que uma síntese completamente wireload/fanout-based.

---

### Slide 39 — Modified FP Constraints — Pre-Floorplan Synthesis

**Texto principal extraído:**

Before having a finalized floorplan available, if any floorplan constraints are expected to be significantly different than the default:

- specify them before the pre-floorplan synthesis run, after loading RTL.

A figura compara:

- estimativa com floorplan padrão;
- estimativa com constraints modificadas, incluindo core size/shape, macro cell e pin placement.

**Leitura didática:**

Se você sabe que o chip não será quadrado, que uma RAM ficará em uma região específica, que um IP ficará próximo à borda, ou que determinados ports estarão em lados específicos, é melhor informar isso ao DC NXT antes da síntese pre-floorplan.

Mesmo que o floorplan final ainda não exista, constraints físicas aproximadas podem melhorar a estimativa dos comprimentos de nets. Isso reduz a diferença entre a síntese inicial e o planejamento físico posterior.

---

### Slide 40 — Default Core Size and Shape

**Texto principal extraído:**

- DC NXT creates a default core placement area based on:
  - standard cell utilization area of 60%;
  - aspect ratio of 1, height/width.

Comandos padrão:

```tcl
set_utilization 0.6
set_aspect_ratio 1
```

- User can change the size and shape as needed:

```tcl
set_utilization 0.8
set_aspect_ratio 0.5
```

**Figuras:**

- Default core example:
  - 40 mils × 40 mils;
  - 1600 mils², determined by DC NXT.
- Modified core example:
  - 49.0 mils × 24.5 mils;
  - 1200 mils².

**Leitura didática:**

`set_utilization` define quanto da área do core será ocupado por standard cells. Uma utilização de 0.6 significa 60% de utilização. O restante fica como espaço para roteamento, buffers, otimizações e folgas.

`set_aspect_ratio` define a proporção entre altura e largura. Um aspect ratio igual a 1 cria uma área quadrada. Um valor como 0.5 cria um core mais alongado.

**Cuidado:** aumentar a utilização reduz área, mas pode aumentar congestionamento. Reduzir demais a utilização aumenta área, mas facilita placement/roteamento. A escolha correta depende do design e da tecnologia.

---

### Slide 41 — Defining an Exact Rectangular/Rectilinear Die/Core Area

**Texto principal extraído:**

- A rectangular or rectilinear die area can be specified with exact coordinates.
  - Overrides default utilization/aspect ratio constraints.
  - Cell boundary or die area encompasses the core area:
    - standard cells/macros are placed in core area;
    - pads and I/O pins are placed along the edge of the die.
- By default, DC NXT assumes placement core area = die area.
  - Unless `create_site_row` is used to define core site rows.

Comando mostrado:

```tcl
create_die_area -coordinate { {0 0} {600 400} }
```

Observação do slide:

```text
Use -polygon to define a rectilinear shape
```

**Leitura didática:**

Quando se usa `set_utilization` e `set_aspect_ratio`, a ferramenta calcula uma área de core aproximada. Mas também é possível definir coordenadas exatas. Isso é útil quando o tamanho do die/core já é conhecido ou quando se quer representar uma forma não apenas quadrada.

O comando `create_die_area` define a área do die por coordenadas. No exemplo, o canto inferior esquerdo é `(0,0)` e o canto superior direito é `(600,400)`. Para formas rectilineares, usa-se `-polygon`.

**Diferença importante:** die area é a área total do chip/bloco; core area é a região onde standard cells e macros serão posicionadas. Em fluxos simples, DC NXT pode assumir core = die, mas em flows físicos reais costuma existir distinção entre die, core, pads, rings, keepouts e rows.

---

### Slide 42 — Example: Physical Constraints File

**Texto principal extraído:**

Arquivo mostrado: `MYDESIGN_phys_cons.tcl`

```tcl
create_die_area -coordinate {{0 0} {600 400}}

set_cell_location -coordinate {400 160} -fixed \
    -orientation {N} RAM1

create_placement_blockage -coordinate {350 110 600 400}

create_terminal -bbox {0 40 2 42} -layer M1 \
    -direction {left} -port A2

report_physical_constraints
```

Anotação do slide:

- `report_physical_constraints` lists applied physical constraints.

**Figura:**

O desenho mostra:

- área `CORE`;
- macro `RAM1` em uma posição fixa próxima à coordenada `(400,160)`;
- `Blockage1` próximo da RAM;
- porta `A2` posicionada na borda esquerda;
- coordenada geral do die indo até `(600,400)`.

**Leitura didática linha por linha:**

```tcl
create_die_area -coordinate {{0 0} {600 400}}
```

Define a área física do die/core usada pelo DC NXT.

```tcl
set_cell_location -coordinate {400 160} -fixed \
    -orientation {N} RAM1
```

Posiciona a macro `RAM1` na coordenada indicada, fixa a macro e define orientação `N`, isto é, orientação normal, sem rotação/espelhamento.

```tcl
create_placement_blockage -coordinate {350 110 600 400}
```

Cria uma região onde a ferramenta deve evitar colocar standard cells. Blockages são usados para reservar espaço, proteger macros, criar canais de roteamento ou representar regiões ocupadas.

```tcl
create_terminal -bbox {0 40 2 42} -layer M1 \
    -direction {left} -port A2
```

Cria/posiciona um terminal físico para a porta `A2`, com bounding box em uma região específica da camada `M1`, apontando para a borda esquerda.

```tcl
report_physical_constraints
```

Lista as constraints físicas aplicadas, servindo como conferência.

---

### Slide 43 — Post-Floorplan Synthesis: Loading the Floorplan

**Texto principal extraído:**

- After design planning in ICC II, floorplan data is captured using `write_floorplan` as a combination of:
  - DEF file;
  - Floorplan Tcl file.
- To load ICC II floorplan in DC NXT:

```tcl
create_net -power "VDD VDDL"
create_net -ground VSS

read_floorplan floorplan_def/floorplan.tcl ; # Will also read the DEF file
```

- Third party DEF can also be imported, but supplemental Tcl required:

```tcl
extract_physical_constraints [-allow_physical_cells] \
    MYDESIGN.def ; # Primary FP data
read_floorplan MYDESIGN_suppl_fp.tcl ; # Suppl. FP data
```

Nota do slide:

- The option/command in square brackets `[]` is needed if the physical-only cells exist in the floorplan.

**Leitura didática:**

Na fase post-floorplan, já existe um floorplan real ou muito mais próximo do real, geralmente criado no ICC II Design Planning. Esse floorplan precisa voltar para o DC NXT para que a síntese use posições de macros, tamanho de core, ports, blockages e demais informações físicas.

Quando o floorplan vem do ICC II, ele pode ser exportado como um par de arquivos: um DEF e um Tcl de floorplan. O comando `read_floorplan` lê o Tcl e, segundo o slide, também lê o DEF associado.

Quando o floorplan vem de uma ferramenta de terceiro, pode ser necessário importar o DEF e complementar com Tcl, porque o DEF pode não conter toda a informação necessária no formato esperado pelo DC NXT.

---

### Slide 44 — Best Practice: Handy Alternative Setup Files (1 of 2)

**Texto principal extraído:**

Estrutura de diretório mostrada:

```text
risc_design (CWD)
├── .synopsys_dc.setup
├── scripts/
├── rtl/
├── libs/
│   ├── DBs/
│   ├── CLIBs/
│   └── tech/
├── unmapped/
└── mapped/
```

Arquivo `.synopsys_dc.setup`:

```tcl
history keep 200
alias rc "report_constraint -all_violators"
# other useful shorthands
```

Arquivo `common_setup.tcl`:

```tcl
set ADDL_SEARCH_PATH   "scripts rtl libs mapped tech CLIBs DBs"
set TARGET_LIBS        "saed32_75v125c.db"
set ADDL_LINK_LIBS     "IP.db MEM.db"
set NDM_REFERENCE_LIBS "saed32.ndm IP.ndm MEM.ndm"
set NDM_DESIGN_LIB     ORCA_design_lib
set TECH_FILE          saed32nm.tf
set TLUPLUS_MAX_FILE   saed32nm_Cmax.tluplus
set MAP_FILE           saed32nm_tf_itf_tluplus.map
```

Anotação do slide:

```text
User edits only this file!
```

**Leitura didática:**

A boa prática proposta é separar arquivos por responsabilidade:

- `.synopsys_dc.setup`: configurações rápidas da interface, histórico e aliases.
- `common_setup.tcl`: variáveis editáveis específicas do projeto, como nomes de bibliotecas, caminhos, arquivos de tecnologia, TLUPlus e map file.
- `dc_setup.tcl`: script reutilizável que usa as variáveis do `common_setup.tcl` para configurar a sessão.
- `dc.tcl`: script principal de síntese.

Essa separação reduz erros. O usuário altera apenas o arquivo com variáveis (`common_setup.tcl`), enquanto o script de setup permanece padronizado.

---

### Slide 45 — Best Practice: Handy Alternative Setup Files (2 of 2)

**Texto principal extraído:**

Arquivo `dc_setup.tcl`:

```tcl
source common_setup.tcl

set_app_var search_path    "$search_path $ADDL_SEARCH_PATH"
set_app_var target_library $TARGET_LIBS
set_app_var link_library   "* $target_library $ADDL_LINK_LIBS"

if {![file isdirectory $NDM_DESIGN_LIB]} {
    create_lib \
        -ref_libs   $NDM_REFERENCE_LIBS \
        -technology $TECH_FILE \
        $NDM_DESIGN_LIB
} else {
    open_lib $NDM_DESIGN_LIB
}

check_library

set_tlu_plus_files \
    -max_tluplus  $TLUPLUS_MAX_FILE \
    -tech2itf_map $MAP_FILE

check_tlu_plus_files
```

Anotação do slide:

```text
No edits!
```

**Leitura didática:**

Aqui aparece a versão organizada do setup. O arquivo `dc_setup.tcl` faz o seguinte:

1. Carrega `common_setup.tcl`.
2. Estende o `search_path` sem apagar o valor padrão.
3. Define a `target_library`.
4. Define a `link_library` com `*`, target library e bibliotecas extras.
5. Cria ou abre a design library física.
6. Roda `check_library`.
7. Carrega TLUPlus e map file.
8. Roda `check_tlu_plus_files`.

A lógica é excelente para laboratório e projeto real: o setup da ferramenta fica repetível, e as variáveis do projeto ficam concentradas em um único ponto.

---

### Slide 46 — Pre-Floorplan Synthesis Script Example

**Texto principal extraído:**

Arquivo mostrado: `dc.tcl`

```tcl
source dc_setup.tcl

define_design_lib WORK -path ./work
analyze -format verilog TOP.v
elaborate MY_TOP

if {![link] == 0} { exit }      ; # optional: if one wants to abort on link failure

check_design

write_file -format ddc -hierarchy -output unmapped/MY_TOP.ddc
write_file -f verilog -hier -out unmapped/MY_TOP.v

source MY_TOP_phys_cons.tcl      ; # pre-floorplan synthesis physical constraint
source MY_TOP_timing_cons.tcl    ; # will be covered in future unit

compile_ultra -retime -scan      ; # will be covered in future unit
report_constraint -all_violators ; # will be covered in future unit

write_file -format ddc -hierarchy -output mapped/MY_TOP.ddc
write_icc2_files -out MY_TOP_icc2 ; # will be covered in future unit
```

Comando de execução mostrado na parte inferior:

```sh
dcnxt_shell -topo -f dc.tcl | tee RUN.log
```

**Leitura didática:**

Este slide junta muitos conceitos do bloco em um fluxo prático. O script primeiro prepara o ambiente físico e lógico com `dc_setup.tcl`. Depois cria a biblioteca `WORK`, lê o RTL, elabora o top e checa o design.

Em seguida, salva uma versão **unmapped** em `.ddc` e Verilog. Essa etapa é útil porque preserva o design antes da síntese final. Depois, carrega constraints físicas e de timing, roda `compile_ultra` e gera saídas **mapped**.

O comando `write_icc2_files` prepara dados para o IC Compiler II, reforçando a ideia de que o fluxo DC NXT → ICC II busca correlação física.

---

### Slide 47 — Quiz: coarse placement under the hood

**Questão visível:**

```text
Select all that apply: DC NXT performs under-the-hood coarse placement to
```

Alternativas visíveis:

- a) Create accurate metal routes.
- b) Generate a netlist with better timing correlation.
- c) Estimate net parasitics based on estimated routes.
- d) Create an accurate floorplan.

**Gabarito mostrado pelo curso:**

```text
Correct answer is: b) and c)
```

**Tradução da questão:**

Selecione todas as alternativas aplicáveis: o DC NXT realiza coarse placement internamente para:

- criar rotas metálicas precisas;
- gerar uma netlist com melhor correlação de timing;
- estimar parasitas de nets com base em rotas estimadas;
- criar um floorplan preciso.

**Resposta correta:** **b e c**.

**Justificativa:**

O coarse placement do DC NXT não cria roteamento metálico preciso e não cria um floorplan final preciso. Ele existe para melhorar estimativas físicas durante a síntese. A ferramenta posiciona grosseiramente as células, estima comprimentos de nets e parasitas, e com isso gera uma netlist com timing mais correlacionado ao resultado físico.

---

### Slide 48 — Quiz: when to apply physical constraints

**Questão visível:**

```text
In the DC NXT physical synthesis flow, when are you likely to apply physical constraints?
Drag and drop the correct answer.
```

Opções visíveis:

```text
Once an actual floorplan has been created by ICC II or a 3rd party layout tool, the DEF/Floorplan Tcl file is loaded before generating a netlist.
```

```text
Prior to generating the pre-floorplan netlist, when an actual floorplan is not usually available, but some floorplan constraints are known, or can reasonably be guessed.
```

**Tradução da questão:**

No fluxo de síntese física do DC NXT, quando você provavelmente aplica constraints físicas? Arraste e solte a resposta correta.

**Resposta conceitual correta:**

- Na **pre-floorplan synthesis**, aplicam-se constraints físicas antes de gerar a netlist pre-floorplan, quando o floorplan real ainda não existe, mas algumas informações físicas são conhecidas ou podem ser razoavelmente estimadas.
- Na **post-floorplan synthesis**, carrega-se o floorplan real depois que ele foi criado no ICC II ou em uma ferramenta de layout de terceiro, antes da nova geração/otimização da netlist.

**Justificativa:**

O fluxo em duas fases usa constraints físicas em dois momentos diferentes. Antes do floorplan real, você pode usar restrições aproximadas para melhorar a netlist inicial. Depois do floorplan real, você carrega dados de DEF/Floorplan Tcl para fazer a síntese com base na geometria planejada.

---

## Aula didática desenvolvida

### 1. Por que a síntese física precisa de mais dados que a síntese lógica

Na síntese lógica clássica, a ferramenta transforma RTL em portas reais usando bibliotecas `.db`. Ela precisa saber função, atraso, área, capacitância e restrições elétricas de cada célula. Isso permite escolher entre, por exemplo, uma NAND fraca, uma NAND forte, um flip-flop específico ou um buffer de determinado drive strength.

Mas essa informação ainda é insuficiente para responder uma pergunta fundamental: **quanto os fios vão atrasar?**

Em tecnologias modernas, o atraso da interconexão pode ser tão importante quanto o atraso da célula. Uma net que conecta células próximas pode ter baixo RC. Uma net longa, cruzando o bloco, pode ter capacitância alta, transição ruim e violação de timing. Por isso o DC NXT em topographical mode tenta estimar fisicamente o design antes da implementação final.

Para isso, ele precisa de:

- **bibliotecas físicas NDM**, para saber tamanho e pinos de células/macros;
- **technology file `.tf`**, para saber camadas, vias, sites e regras;
- **TLUPlus**, para estimar parasitas RC;
- **layer mapping file**, para associar nomes de camadas entre arquivos;
- **floorplan**, ou pelo menos constraints físicas aproximadas.

Sem esses dados, a síntese pode até funcionar logicamente, mas não será uma physical synthesis confiável.

---

### 2. O papel da biblioteca física NDM

A NDM contém informações físicas usadas pela ferramenta. O slide destaca que o DC NXT usa o **frame view**. Isso quer dizer que a ferramenta não precisa necessariamente enxergar todos os transistores internos da célula para a síntese física; ela precisa saber o contorno físico da célula, seus pinos e suas obstruções.

Imagine uma NAND de duas entradas. Para a síntese lógica, basta saber:

```text
Y = !(A & B)
```

Mas para síntese física, é importante saber:

- onde está o pino `A`;
- onde está o pino `B`;
- onde está o pino `Y`;
- onde passam `VDD` e `GND`;
- qual é a altura da célula;
- qual é a largura;
- quais regiões podem ou não receber roteamento.

Com isso, o DC NXT consegue estimar se uma conexão será curta ou longa, se macros estão bloqueando caminhos e se o posicionamento aproximado cria congestionamento.

---

### 3. Technology file, TLUPlus e map file: três arquivos que trabalham juntos

Esses três arquivos aparecem juntos, mas cada um tem função diferente.

#### Technology file `.tf`

Define a “geografia” básica da tecnologia:

- nomes de camadas;
- números de camadas;
- regras de largura e espaçamento;
- pitch;
- vias;
- sites de standard cells;
- informações de display.

Ele é como o mapa das camadas e regras físicas.

#### TLUPlus

Define modelos de resistência e capacitância para interconexões. Ele responde melhor a perguntas como:

- quanto RC uma net em `M2` terá?
- como a largura do fio muda a resistência?
- como o espaçamento muda a capacitância?
- como efeitos de fabricação influenciam o parasita?

Ele é como a tabela de propriedades elétricas dos fios.

#### Layer Mapping File

Liga os nomes entre os dois mundos. Se o `.tf` chama a camada de `METAL1` e o TLUPlus chama a mesma camada de `cm1`, o map file diz:

```text
METAL1 -> cm1
```

Sem esse arquivo, os modelos RC podem não ser associados às camadas corretas.

---

### 4. Por que existe uma design library

A design library é o contêiner físico do projeto no DC NXT. Ela guarda a tecnologia e aponta para as bibliotecas físicas de referência. Ela é necessária porque o DC NXT precisa manter um contexto físico consistente para fazer topographical synthesis.

Em um script simples, isso aparece assim:

```tcl
create_lib \
    -ref_libs   $NDM_REFERENCE_LIBS \
    -technology $TECH_FILE \
    $NDM_DESIGN_LIB
```

Esse comando diz:

- use estas bibliotecas físicas como referência;
- use este technology file;
- crie esta design library de trabalho.

Em execuções futuras, em vez de recriar tudo, abre-se a biblioteca:

```tcl
open_lib $NDM_DESIGN_LIB
```

Mas o slide chama atenção para um detalhe: mesmo abrindo uma biblioteca existente, ainda é preciso carregar TLUPlus e map file.

---

### 5. O problema netlist versus floorplan

A pergunta do slide é ótima: o que vem primeiro, a netlist ou o floorplan?

Para criar uma netlist fisicamente boa, você quer um floorplan. Mas para criar um floorplan, você quer uma netlist inicial. Essa dependência circular é comum em ASIC.

O fluxo recomendado resolve isso em duas passagens:

#### Primeira passagem: pre-floorplan synthesis

O DC NXT usa:

- floorplan padrão;
- ou constraints físicas aproximadas;
- ou informações que o projetista já conhece.

A netlist gerada não precisa ser perfeita. Ela serve para planejar o chip.

#### Segunda passagem: post-floorplan synthesis

Depois que o ICC II ou outra ferramenta cria um floorplan real, esse floorplan volta para o DC NXT. Agora a ferramenta tem informações físicas muito melhores e consegue otimizar a netlist com maior correlação.

Essa segunda netlist é muito mais próxima daquilo que seguirá para place & route.

---

### 6. Constraints físicas antes do floorplan real

Mesmo sem floorplan final, às vezes o projetista sabe coisas importantes:

- o core será retangular e alongado;
- uma RAM ficará à direita;
- um IP ficará à esquerda;
- um conjunto de ports ficará em uma borda;
- uma região deve ficar bloqueada;
- o design não pode usar core quadrado;
- a utilização padrão de 60% é inadequada.

Nesse caso, é melhor informar essas restrições antes da pre-floorplan synthesis. Isso melhora a estimativa de interconexões.

Exemplo:

```tcl
set_utilization 0.8
set_aspect_ratio 0.5
```

Aqui a ferramenta cria um core mais compacto e com formato diferente do padrão.

Para controle exato:

```tcl
create_die_area -coordinate {{0 0} {600 400}}
```

Para macro fixa:

```tcl
set_cell_location -coordinate {400 160} -fixed \
    -orientation {N} RAM1
```

Essas constraints aproximam a síntese da realidade física esperada.

---

### 7. Carregar floorplan real depois do design planning

Quando o floorplan já existe, o processo muda. Em vez de apenas “chutar” constraints, você carrega o floorplan real:

```tcl
read_floorplan floorplan_def/floorplan.tcl
```

Esse floorplan pode ter sido gerado no ICC II com `write_floorplan`, normalmente como combinação de DEF + Tcl.

O DEF traz dados físicos principais, como posições, regiões, blockages e informações de placement. O Tcl suplementar pode carregar detalhes adicionais que o DEF não representa completamente ou que precisam ser interpretados pelo DC NXT.

---

### 8. Organização limpa de setup

Os últimos slides mostram uma prática extremamente útil para laboratório e projeto real: separar variáveis editáveis de scripts fixos.

#### `.synopsys_dc.setup`

Usado para configurações automáticas ao iniciar o DC NXT, como histórico e aliases.

```tcl
history keep 200
alias rc "report_constraint -all_violators"
```

#### `common_setup.tcl`

Arquivo que o usuário edita. Contém nomes de bibliotecas, arquivos e caminhos:

```tcl
set TARGET_LIBS        "saed32_75v125c.db"
set NDM_REFERENCE_LIBS "saed32.ndm IP.ndm MEM.ndm"
set TECH_FILE          saed32nm.tf
set TLUPLUS_MAX_FILE   saed32nm_Cmax.tluplus
set MAP_FILE           saed32nm_tf_itf_tluplus.map
```

#### `dc_setup.tcl`

Script reutilizável. Não deve ser editado a cada projeto. Ele aplica as variáveis, cria/abre biblioteca e carrega TLUPlus.

#### `dc.tcl`

Script principal de síntese. Ele executa o fluxo:

```text
setup -> analyze -> elaborate -> link -> check_design -> constraints -> compile -> reports -> outputs
```

Essa separação evita bagunça e facilita repetir o fluxo.

---

## Conceitos difíceis explicados em profundidade

### Physical synthesis

Physical synthesis é a síntese que usa informação física para melhorar decisões lógicas. Ela não substitui o place & route final, mas tenta antecipar parte dos efeitos físicos.

Sem physical synthesis, a ferramenta pode otimizar com base em estimativas ruins. Por exemplo, pode escolher uma célula pequena porque o timing parece bom, mas depois do placement a net fica longa, a capacitância cresce e o timing falha.

Com physical synthesis, o DC NXT faz coarse placement, estima comprimento de nets e RC, e escolhe células/buffers com mais consciência física.

**Erro comum:** achar que coarse placement é roteamento final. Não é. Ele serve para estimativa.

---

### Coarse placement

Coarse placement é um posicionamento aproximado usado internamente pela ferramenta. Ele ajuda a responder:

- quais células provavelmente ficarão próximas?
- quais nets serão longas?
- onde pode haver congestionamento?
- quais caminhos terão parasitas maiores?

O quiz do curso deixa isso claro: coarse placement serve para gerar netlist com melhor correlação de timing e estimar parasitas com base em rotas estimadas. Ele não cria rotas metálicas precisas nem floorplan exato.

---

### NDM

NDM significa New Data Model. No contexto desta aula, é o formato das bibliotecas físicas usadas pelo DC NXT. Uma biblioteca NDM pode representar standard cells, macros ou IP cells.

O DC NXT usa principalmente o frame view para entender:

- tamanho da célula;
- pinos;
- obstruções;
- encaixe físico;
- relação com tecnologia.

O timing não vem da parte física da NDM nessa explicação; o slide afirma que timing views são ignoradas pelo DC NXT nesse contexto. O timing principal vem das `.db` lógicas.

---

### Technology file `.tf`

O `.tf` define camadas e regras físicas. Ele é específico da tecnologia. Um `.tf` de 32 nm não serve para 7 nm; um `.tf` com 8 camadas metálicas não representa corretamente um processo com 10 camadas.

Ele contém informações de camada, via, pitch, spacing, width e sites. Mas não define tudo. Por exemplo, o slide diz explicitamente que a direção preferencial de roteamento não vem do technology file e precisa ser especificada com `set_preferred_routing_direction`.

---

### TLUPlus

TLUPlus fornece tabelas para estimar resistência e capacitância de nets. Ele é essencial para correlação física porque os fios têm impacto forte no timing.

Em síntese física, se a ferramenta estima que uma net será longa e terá alta capacitância, ela pode:

- escolher uma célula com drive maior;
- inserir buffer;
- mudar mapeamento lógico;
- alterar otimização de caminhos críticos;
- melhorar transição.

Tudo isso depende de modelos RC razoáveis.

---

### Layer mapping

O layer mapping file é um tradutor de nomes. Ele resolve o problema de um arquivo chamar a camada de `METAL1` e outro chamar de `cm1`.

Se esse mapeamento estiver errado, o DC NXT pode associar modelo RC errado a camada errada, ou falhar ao carregar parasitas. Isso compromete a confiabilidade da estimativa física.

---

### Design library

A design library é o contêiner físico do projeto dentro do DC NXT. Ela guarda dados de tecnologia e referências às bibliotecas físicas.

O fluxo correto precisa garantir:

```tcl
create_lib ...
```

ou:

```tcl
open_lib ...
```

Depois:

```tcl
check_library
set_tlu_plus_files ...
check_tlu_plus_files
```

Assim a ferramenta trabalha com tecnologia, bibliotecas físicas e modelos RC coerentes.

---

### `create_lib`

`create_lib` cria uma design library física.

Exemplo:

```tcl
create_lib \
    -ref_libs   $NDM_REFERENCE_LIBS \
    -technology $TECH_FILE \
    $NDM_DESIGN_LIB
```

- `-ref_libs`: bibliotecas físicas de referência.
- `-technology`: arquivo `.tf`.
- `$NDM_DESIGN_LIB`: nome/caminho da design library.

Erro comum: tentar rodar physical synthesis sem design library criada ou aberta.

---

### `open_lib`

`open_lib` abre uma design library existente.

```tcl
open_lib $NDM_DESIGN_LIB
```

É usado em execuções posteriores. Mas não elimina a necessidade de recarregar TLUPlus e map file, como o slide destaca.

---

### `set_tlu_plus_files`

Carrega os modelos RC e o arquivo de mapeamento:

```tcl
set_tlu_plus_files \
    -max_tluplus  $TLUPLUS_MAX_FILE \
    -tech2itf_map $MAP_FILE
```

Nesta aula aparece o arquivo máximo, `Cmax`, voltado para um cenário conservador de capacitância. Em fluxos mais completos, podem aparecer modelos min/max e corners diferentes.

---

### `check_library` e `check_tlu_plus_files`

`check_library` verifica consistência entre bibliotecas lógicas e físicas. É importante para detectar problemas antes do compile.

`check_tlu_plus_files` confere se os arquivos TLUPlus e map estão carregados corretamente e coerentes com a tecnologia.

Esses comandos devem ser vistos como checkpoints de sanidade do setup físico.

---

### `set_preferred_routing_direction`

Define direções preferenciais de roteamento. Exemplo:

```tcl
set_preferred_routing_direction -layers {M1 M3 M5 M7} \
    -direction horizontal
set_preferred_routing_direction -layers {M2 M4 M6 M8 MRDL} \
    -direction vertical
```

Esse comando deve vir depois de existir um `current_design`. O slide mostra erro se for executado cedo demais.

---

### `set_utilization`

Define a taxa de utilização das standard cells no core.

```tcl
set_utilization 0.6
```

Significa que a área de standard cells ocupará aproximadamente 60% da área disponível. Utilização mais alta reduz área, mas pode aumentar congestionamento.

---

### `set_aspect_ratio`

Define proporção altura/largura do core.

```tcl
set_aspect_ratio 1
```

Valor 1 indica core quadrado. Valor 0.5 indica core mais retangular/alongado.

---

### `create_die_area`

Define área exata por coordenadas:

```tcl
create_die_area -coordinate {{0 0} {600 400}}
```

Esse comando substitui o cálculo automático baseado em utilização/aspect ratio.

---

### `set_cell_location`

Fixa ou posiciona uma macro/célula:

```tcl
set_cell_location -coordinate {400 160} -fixed \
    -orientation {N} RAM1
```

Esse comando é muito útil para macros como RAMs, ROMs, PLLs ou IPs físicos.

---

### `create_placement_blockage`

Cria uma região onde não se deve colocar células:

```tcl
create_placement_blockage -coordinate {350 110 600 400}
```

Blockages podem representar regiões reservadas, canais de roteamento, proteção ao redor de macros ou áreas proibidas.

---

### `create_terminal`

Define terminal físico de uma porta:

```tcl
create_terminal -bbox {0 40 2 42} -layer M1 \
    -direction {left} -port A2
```

Isso ajuda a representar localização de pinos top-level. A posição dos ports afeta fortemente o comprimento das nets conectadas ao ambiente externo.

---

### `read_floorplan`

Carrega floorplan vindo do ICC II ou de arquivo Tcl/DEF:

```tcl
read_floorplan floorplan_def/floorplan.tcl
```

Na fase post-floorplan, esse comando é essencial para que o DC NXT resintetize o design com base em um floorplan real, não em estimativa padrão.

---

### `write_icc2_files`

No script final aparece:

```tcl
write_icc2_files -out MY_TOP_icc2
```

Esse comando prepara arquivos para o fluxo com IC Compiler II. Ele representa a ponte entre síntese física no DC NXT e implementação física no ICC II.

---

## Figuras, diagramas e waveforms importantes

### Frame view da NAND

A figura da NAND mostra que uma célula física não é apenas função lógica. Ela tem trilhos de alimentação, pinos metálicos e área física. Esse é o tipo de informação que a NDM fornece para a síntese física.

### Diagrama Design Library + CLIBs + Technology File

Esse diagrama mostra que a design library não contém tudo isoladamente; ela aponta para bibliotecas físicas de referência e carrega a tecnologia. É um contêiner de contexto físico.

### Problema “Chicken and Egg”

O diagrama mostra a dependência circular entre RTL, physical synthesis, netlist, design planning e floorplan. Ele é o motivo principal para o fluxo em duas fases.

### Two-Phase SPG Flow

Esse é o diagrama mais importante da parte B. Ele mostra a lógica completa:

```text
RTL -> pre-floorplan synthesis -> pre-floorplan netlist -> ICC II DP -> floorplan
RTL + floorplan -> post-floorplan SPG synthesis -> post-floorplan netlist + placement -> ICC II
```

### Default versus modified floorplan constraints

As figuras mostram que usar constraints físicas aproximadas pode mudar muito a estimativa de interconexões. Se o chip real será alongado, usar core quadrado padrão pode dar estimativas ruins.

### Physical constraints file

A figura com `CORE`, `RAM1`, `Blockage1` e `Port A2` mostra como comandos Tcl viram objetos físicos. Essa figura é importante porque conecta script com geometria.

---

## Pontos de prova e revisão

1. **O que physical synthesis faz?**  
   Recebe RTL e gera netlist gate-level otimizada com coarse placement de standard cells para estimar comprimentos de roteamento.

2. **Physical synthesis é feita em qual modo do DC NXT?**  
   Em topographical mode, usando `compile_ultra`.

3. **Quais dados físicos são necessários?**  
   Bibliotecas físicas NDM, technology file, TLUPlus, layer mapping file, design library e floorplan/physical constraints.

4. **O que a biblioteca física NDM fornece?**  
   Frame view, tamanho de células, localização de pinos e informação física de standard cells/macros.

5. **O DC NXT usa timing views da biblioteca física?**  
   Pelo slide, não. Ele usa o frame view; timing vem das bibliotecas lógicas.

6. **O que o `.tf` define?**  
   Camadas, números, regras físicas, vias, sites, cores/padrões de display.

7. **O `.tf` define direção preferencial de roteamento?**  
   Não. Isso é definido por `set_preferred_routing_direction`.

8. **Quando aplicar `set_preferred_routing_direction`?**  
   Depois de ler/elaborar o design ou carregar `.ddc`, quando já existe `current_design`.

9. **O que o TLUPlus contém?**  
   Tabelas de R e C para modelar parasitas de interconexão.

10. **Para que serve o layer mapping file?**  
    Para associar nomes de camadas/vias entre technology file e TLUPlus.

11. **Para que serve a design library?**  
    Para armazenar dados de tecnologia e apontar para bibliotecas físicas de referência.

12. **Qual a diferença entre `create_lib` e `open_lib`?**  
    `create_lib` cria uma design library nova; `open_lib` abre uma já existente.

13. **Ao abrir uma design library existente, ainda é necessário carregar TLUPlus?**  
    Sim, segundo o slide.

14. **Qual é o problema “chicken and egg”?**  
    A síntese física precisa de floorplan, mas o floorplan precisa de uma netlist inicial.

15. **Qual é a solução recomendada?**  
    Fluxo de duas fases: pre-floorplan synthesis e post-floorplan synthesis.

16. **A netlist pre-floorplan precisa ter QoR máximo?**  
    Não. Ela serve principalmente para ajudar a criar o floorplan.

17. **O que o DC NXT assume por padrão para floorplan se nada for especificado?**  
    Core quadrado, 60% de utilização, macros/IPs posicionados junto com standard cells e ports arbitrários.

18. **Como mudar utilização e formato do core?**

```tcl
set_utilization 0.8
set_aspect_ratio 0.5
```

19. **Como definir área exata?**

```tcl
create_die_area -coordinate {{0 0} {600 400}}
```

20. **Como fixar uma macro?**

```tcl
set_cell_location -coordinate {400 160} -fixed -orientation {N} RAM1
```

21. **Como carregar um floorplan vindo do ICC II?**

```tcl
read_floorplan floorplan_def/floorplan.tcl
```

22. **Para que serve `common_setup.tcl`?**  
    Para concentrar variáveis editáveis do projeto.

23. **Para que serve `dc_setup.tcl`?**  
    Para configurar a sessão de forma padronizada, sem edições frequentes.

24. **Qual é o gabarito do quiz sobre coarse placement?**  
    **b e c**: gerar netlist com melhor correlação de timing e estimar parasitas de nets com base em rotas estimadas.

25. **O coarse placement cria rotas metálicas precisas?**  
    Não.

26. **O coarse placement cria floorplan preciso?**  
    Não.

---

## Relação com projeto/laboratório

Esta parte da aula é extremamente prática, porque mostra a estrutura típica de um ambiente de síntese física.

Em um laboratório do DC NXT, você provavelmente verá uma estrutura parecida com:

```text
risc_design/
├── .synopsys_dc.setup
├── common_setup.tcl
├── dc_setup.tcl
├── dc.tcl
├── rtl/
├── libs/
│   ├── DBs/
│   ├── CLIBs/
│   └── tech/
├── unmapped/
└── mapped/
```

O fluxo básico será:

```tcl
source dc_setup.tcl

define_design_lib WORK -path ./work
analyze -format verilog TOP.v
elaborate MY_TOP
link
check_design

write_file -format ddc -hierarchy -output unmapped/MY_TOP.ddc

source MY_TOP_phys_cons.tcl
source MY_TOP_timing_cons.tcl

compile_ultra -retime -scan
report_constraint -all_violators

write_file -format ddc -hierarchy -output mapped/MY_TOP.ddc
write_icc2_files -out MY_TOP_icc2
```

Se houver erro no laboratório, os pontos mais prováveis são:

- caminho errado para `.db`;
- caminho errado para `.ndm`;
- technology file `.tf` não encontrado;
- TLUPlus ou map file não carregado;
- layer mapping incompatível;
- `create_lib` tentando criar biblioteca já existente;
- `open_lib` tentando abrir biblioteca inexistente;
- `set_preferred_routing_direction` executado antes de existir `current_design`;
- constraint física aplicada antes da hora;
- macro referenciada em `set_cell_location` com nome errado;
- porta usada em `create_terminal` inexistente;
- floorplan Tcl/DEF não encontrado ou incompleto.

A lógica que você deve guardar é:

```text
Bibliotecas lógicas dizem como a lógica funciona e quanto atrasa.
Bibliotecas físicas dizem onde as células existem fisicamente e onde estão seus pinos.
Technology file descreve camadas, vias, regras e sites.
TLUPlus descreve RC dos fios.
Map file conecta nomes entre technology file e TLUPlus.
Design library junta o contexto físico da sessão.
Floorplan aproxima a síntese da implementação real.
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

- **Bloco:** 034
- **Título:** 02 Design Setup for Physical Synthesis - parte C
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Processar somente slides:** 51-58
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis_parte_C.md`
