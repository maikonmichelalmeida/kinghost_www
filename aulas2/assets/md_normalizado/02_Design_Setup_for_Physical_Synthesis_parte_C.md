# 02 Design Setup for Physical Synthesis — parte C

## Controle do bloco

- **Bloco:** 034
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Faixa de slides processada:** slides 51-58
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis_parte_C.md`
- **Próximo bloco recomendado:** Bloco 035 — `03 Accessing Design and Library Objects`
- **Próximo arquivo:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\03 Accessing Design and Library Objects.docx`
- **Próxima faixa:** slides 1-22

> Observação: esta parte C é uma seção curta de revisão/quiz. Ela fecha a aula `Design Setup for Physical Synthesis` consolidando os conceitos da parte B: diferença entre **physical cell library** e **design library**, significado de **frame view**, função dos arquivos **TLUPlus** e **layer mapping**, conteúdo do **technology file** e momento de aplicação de **physical constraints** no fluxo pre-floorplan/post-floorplan.

---

## Resumo executivo

A parte C não introduz uma nova sequência longa de comandos. Ela funciona como uma revisão guiada dos pontos que costumam confundir no setup físico do DC NXT.

A mensagem principal é: para o DC NXT fazer **physical synthesis**, não basta ter RTL e bibliotecas lógicas `.db`. A ferramenta precisa de um contexto físico coerente. Esse contexto inclui uma **physical cell library**, que descreve células e macros no nível de layout/frame view, e uma **design library**, que funciona como contêiner do ambiente físico usado pela síntese.

A parte também reforça que **TLUPlus + layer mapping file** fornecem ao DC NXT a modelagem de parasitas RC das interconexões. Já o **technology file** define as camadas físicas, vias, regras físicas e sites da tecnologia, mas não deve ser confundido com bibliotecas lógicas nem com modelos de timing lógico.

O último ponto importante é o uso de **physical constraints** em dois momentos diferentes do fluxo:

1. antes da síntese **pre-floorplan**, quando ainda não existe um floorplan real, mas algumas restrições físicas podem ser estimadas;
2. antes da síntese **post-floorplan**, quando um floorplan real já foi criado no ICC II ou em ferramenta de layout e deve ser carregado no DC NXT.

---

## Texto extraído e organizado por slide

### Slide 51 — Quiz: Physical cell library versus Design library

**Texto principal extraído:**

```text
Match the correct answer for physical cell library and design library
```

Associação mostrada como correta:

```text
Physical cell library:
It contains physical layout descriptions of standard cells, macro and IO pad cells, which are used in a layout design.

Design library:
It is a container that holds the physical design or layout, and all the associated physical data.
```

**Explicação didática:**

A **physical cell library** é a biblioteca física das células. Ela descreve aquilo que a síntese física precisa saber sobre cada célula ou macro: contorno, tamanho, localização de pinos, regiões físicas relevantes e estrutura de layout suficiente para placement físico aproximado.

A **design library** não é a biblioteca de células em si. Ela é o contêiner da sessão/projeto físico. Ela guarda o contexto usado pelo DC NXT: dados de tecnologia, referências para bibliotecas físicas e informações associadas ao layout do design.

Uma forma simples de memorizar:

```text
Physical cell library = biblioteca das peças físicas disponíveis.
Design library        = contêiner do projeto físico que usa essas peças.
```

---

### Slide 52 — Quiz: Physical cell library Frame view

**Texto principal extraído:**

```text
A physical cell library Frame view

a) Defines physical Design Rule Checks (DRC)s
b) Defines each cell's outline, as well as pin locations
```

No slide, a alternativa marcada é:

```text
b) Defines each cell's outline, as well as pin locations
```

---

### Slide 53 — Confirmação do quiz sobre Frame view

**Texto principal extraído:**

```text
Correct
That's right! You selected the correct response.
```

**Resposta correta:**

```text
b) Defines each cell's outline, as well as pin locations
```

**Tradução da questão:**

```text
Uma Frame view de biblioteca física de células...
```

**Tradução das alternativas:**

```text
a) Define verificações físicas de regra de projeto, DRCs.
b) Define o contorno de cada célula, bem como as localizações dos pinos.
```

**Justificativa:**

A **frame view** é uma visão física abstrata da célula. Ela não precisa conter todos os detalhes internos do layout transistorizado, mas precisa conter o suficiente para que ferramentas físicas saibam:

- qual espaço a célula ocupa;
- onde estão seus pinos;
- onde existem obstruções relevantes;
- como ela se encaixa nas rows de standard cells;
- como macros ou IPs devem ser posicionados no chip.

DRC físico é outro assunto. Regras como largura mínima, espaçamento mínimo e pitch pertencem ao **technology file** e aos decks de verificação física, não à definição conceitual principal da frame view.

---

### Slide 54 — Quiz: TLUPlus and layer mapping files

**Texto principal extraído:**

```text
Parasitic net RC modeling is supplied to DC NXT with TLUPlus and layer mapping files. True or False?

True
False
```

No slide, aparece marcada a alternativa:

```text
False
```

---

### Slide 55 — Correção do quiz sobre TLUPlus and layer mapping

**Texto principal extraído visível:**

```text
Incorrect
You did not select the correct response.
Correct answer is:
```

A alternativa marcada anteriormente era **False**, e o slide indica que ela está incorreta. Portanto, a resposta correta é:

```text
True
```

**Tradução da questão:**

```text
A modelagem RC parasitária das nets é fornecida ao DC NXT com arquivos TLUPlus e arquivos de mapeamento de camadas. Verdadeiro ou falso?
```

**Resposta correta:**

```text
True
```

**Justificativa:**

O **TLUPlus** fornece tabelas/modelos para estimativa de resistência e capacitância parasitária das interconexões. Mas esses modelos usam nomes de camadas que nem sempre coincidem com os nomes usados no technology file. Por isso entra o **layer mapping file**.

A dupla funciona assim:

```text
TLUPlus file       -> fornece os modelos RC parasitários.
Layer mapping file -> conecta os nomes de camadas/vias do technology file aos nomes usados no TLUPlus.
```

Sem o mapeamento, a ferramenta pode ter os modelos RC disponíveis, mas não saber associar corretamente `METAL1`, `METAL2`, vias e camadas do technology file às camadas modeladas no TLUPlus.

---

### Slide 56 — Quiz: Technology file

**Texto principal extraído:**

```text
A technology file defines the number of metal routing layers as well as logic DRCs for a specific technology. True or False?

True
False
```

No slide, a alternativa marcada é:

```text
True
```

---

### Slide 57 — Correção do quiz sobre Technology file

**Texto principal extraído:**

```text
Incorrect
You did not select the correct response.
Correct answer is:
False. In addition to the number of metal layers, it defines physical DRCs: minimum spacing, width and pitch rule.
```

**Tradução da questão:**

```text
Um technology file define o número de camadas metálicas de roteamento, bem como DRCs lógicos para uma tecnologia específica. Verdadeiro ou falso?
```

**Resposta correta:**

```text
False
```

**Justificativa:**

A pegadinha está na expressão **logic DRCs**. O technology file não define “DRCs lógicos”. Ele define regras físicas da tecnologia.

O technology file contém dados como:

- nomes de camadas;
- números de camadas;
- camadas metálicas disponíveis;
- regras físicas de largura mínima;
- regras físicas de espaçamento mínimo;
- área mínima;
- pitch;
- definições de vias;
- sites para standard cells;
- cores/padrões de visualização da tecnologia.

Então a parte “define o número de camadas metálicas” está correta, mas a parte “logic DRCs” está errada. A formulação correta seria:

```text
A technology file defines the number of metal routing layers and physical DRCs for a specific technology.
```

Ou em português:

```text
Um technology file define o número de camadas metálicas de roteamento e as DRCs físicas de uma tecnologia específica.
```

---

### Slide 58 — Quiz: Quando aplicar physical constraints no fluxo DC NXT

**Texto principal extraído:**

```text
In the DC NXT physical synthesis flow, when are you likely to apply physical constraints?
Drag and drop the correct answer
```

Opções visíveis:

```text
Once an actual floorplan has been created by ICC II or a 3rd party layout tool, the DEF/Floorplan Tcl file is loaded before generating a netlist.

Prior to generating the pre-floorplan netlist, when an actual floorplan is not usually available, but some floorplan constraints are known, or can reasonably be guessed.
```

O slide mostra que a tentativa feita estava incorreta, mas não mostra a correção final completa. Pelo conteúdo dos slides anteriores, a associação correta é:

```text
Pre-floorplan synthesis:
Prior to generating the pre-floorplan netlist, when an actual floorplan is not usually available, but some floorplan constraints are known, or can reasonably be guessed.

Post-floorplan synthesis:
Once an actual floorplan has been created by ICC II or a 3rd party layout tool, the DEF/Floorplan Tcl file is loaded before generating a netlist.
```

**Tradução das opções:**

```text
Depois que um floorplan real foi criado pelo ICC II ou por uma ferramenta de layout de terceiros, o arquivo DEF/Floorplan Tcl é carregado antes de gerar uma netlist.

Antes de gerar a netlist pre-floorplan, quando um floorplan real normalmente ainda não está disponível, mas algumas restrições de floorplan são conhecidas ou podem ser razoavelmente estimadas.
```

**Justificativa:**

Na síntese física do DC NXT existem dois cenários diferentes.

No primeiro cenário, ainda não existe floorplan real. Mesmo assim, algumas informações podem ser conhecidas: formato aproximado do core, utilização esperada, posição provável de macros, bloqueios ou localização de ports. Essas informações podem ser aplicadas antes da **pre-floorplan synthesis** para gerar uma primeira netlist mais coerente com o futuro layout.

No segundo cenário, o floorplan real já foi criado no ICC II Design Planning ou em ferramenta de layout. Nesse caso, o DC NXT deve carregar esse floorplan, normalmente por `read_floorplan`, antes da síntese **post-floorplan**, para que a nova netlist seja otimizada com base em informações físicas mais realistas.

---

## Aula didática desenvolvida

### 1. A diferença essencial entre physical cell library e design library

O erro comum é tratar tudo como “biblioteca”. Mas o curso está separando conceitos diferentes.

A **physical cell library** é o catálogo das células físicas. Ela diz como uma NAND, uma NOR, um flip-flop, uma macro RAM ou um bloco IP aparecem fisicamente para a ferramenta. Em vez de se preocupar primariamente com função lógica e atraso, ela descreve o objeto físico: contorno, pinos, bloqueios e geometria.

A **design library** é o ambiente físico do projeto. Ela não é “uma lista de portas”. Ela é o contêiner que conecta o projeto às informações físicas necessárias para síntese topográfica. Nela ficam carregados ou referenciados os dados de tecnologia e as referências para bibliotecas físicas.

Pense assim:

```text
Biblioteca lógica .db:
  "Que porta é essa? Quanto ela atrasa? Qual sua capacitância?"

Physical cell library .ndm:
  "Qual é o tamanho físico dessa célula? Onde estão seus pinos?"

Design library:
  "Qual é o ambiente físico deste design e quais bibliotecas/tecnologias ele usa?"
```

### 2. O que exatamente é Frame view

A **frame view** é uma abstração física. Ela não precisa mostrar todos os transistores e detalhes internos da célula. Para a síntese física, o mais importante é que a ferramenta saiba:

- qual área a célula ocupa;
- onde estão seus pinos;
- por onde outras nets podem ou não passar;
- como ela pode ser encaixada no grid físico;
- como macros e IPs impactam a região de placement.

Por isso a resposta do quiz é que a frame view define o **outline** da célula e a localização dos pinos. Ela não é a definição principal das regras DRC da tecnologia.

### 3. TLUPlus e layer mapping trabalham juntos

A síntese física tenta estimar o impacto do fio. Para isso, ela precisa estimar resistência e capacitância das nets. É aí que entram os arquivos **TLUPlus**.

Mas os nomes das camadas podem variar entre arquivos. Uma tecnologia pode chamar uma camada de `METAL1`, enquanto outro arquivo parasitário pode chamá-la de `cm1`. O **layer mapping file** resolve essa equivalência.

Fluxo mental:

```text
Technology file:
  define camadas e vias com certos nomes.

TLUPlus:
  fornece tabelas RC para camadas/vias, às vezes com outros nomes.

Layer mapping file:
  diz quais nomes correspondem entre os dois mundos.
```

Sem esse casamento, a ferramenta fica com dados físicos incompletos ou desconectados.

### 4. Technology file não define DRC lógico

O technology file é sobre tecnologia física. Ele define regras e parâmetros do processo de fabricação: camadas, largura, espaçamento, pitch, vias, sites e propriedades físicas.

O quiz tenta enganar usando a expressão **logic DRCs**. A resposta correta é falsa porque o technology file define **physical DRCs**, não “logic DRCs”.

Em síntese lógica, checks lógicos aparecem em outros contextos: conectividade, hierarquia, restrições elétricas, timing, regras de biblioteca lógica etc. Já DRC físico é regra de fabricação/layout.

### 5. Quando aplicar physical constraints

Physical constraints aparecem em dois momentos com intenções diferentes.

Na **pre-floorplan synthesis**, a ferramenta ainda não tem floorplan real. Mesmo assim, usar alguma restrição física aproximada pode ser melhor do que deixar o DC NXT usar apenas defaults. Por exemplo:

```tcl
set_utilization 0.8
set_aspect_ratio 0.5
create_die_area -coordinate {{0 0} {600 400}}
set_cell_location -coordinate {400 160} -fixed -orientation {N} RAM1
create_placement_blockage -coordinate {350 110 600 400}
```

Essas restrições ajudam a primeira netlist a se aproximar do que será fisicamente possível.

Na **post-floorplan synthesis**, a situação é diferente. Agora já existe um floorplan real, criado no ICC II ou em uma ferramenta de layout. O DC NXT deve carregar esse floorplan antes de recompilar/sintetizar fisicamente:

```tcl
read_floorplan floorplan_def/floorplan.tcl
```

A síntese post-floorplan tende a ter melhor correlação física porque trabalha com informações reais de core, macros, ports, blockages e placement constraints.

---

## Conceitos difíceis explicados em profundidade

### Physical cell library

É a biblioteca física das células e macros. Ela contém informação de layout necessária para ferramentas físicas. Em DC NXT, aparece no contexto de bibliotecas NDM e frame views.

**Onde aparece no fluxo:**

- antes da leitura/elaboração do design para configurar o ambiente físico;
- na criação da design library;
- durante coarse placement e estimativas físicas.

**Erro comum:** achar que ela substitui a `.db`. Não substitui. A `.db` continua importante para timing, função lógica, área lógica e caracterização elétrica. A biblioteca física complementa com geometria e pinos.

### Design library

É o contêiner do ambiente físico do design. Ela armazena dados de tecnologia e referências para bibliotecas físicas.

**Onde aparece no fluxo:**

```tcl
create_lib \
    -ref_libs   $ndm_reference_library \
    -technology ./tech/saed32_1p9m.tf \
    $ndm_design_library
```

ou, se já existir:

```tcl
open_lib $ndm_design_library
```

**Erro comum:** recriar a design library toda vez sem testar se ela já existe. O script robusto verifica a existência da pasta/biblioteca e decide entre `create_lib` e `open_lib`.

### Frame view

É a visão física abstrata da célula. Em vez de focar no circuito interno, foca no contorno, pinos e informações necessárias para placement/roteamento aproximado.

**Regra de prova:**

```text
Frame view -> outline + pin locations.
```

Não confundir com:

```text
Technology file -> physical DRCs, layers, vias, pitch, width, spacing.
```

### TLUPlus

Fornece modelos RC parasitários das interconexões. Em tecnologias modernas, o atraso de fio pode ser tão importante quanto o atraso das portas. Por isso a síntese topográfica precisa de um modelo para estimar esses parasitas antes do roteamento final.

**Ideia-chave:**

```text
TLUPlus não diz a função lógica da célula.
TLUPlus ajuda a estimar parasitas físicos de interconexão.
```

### Layer mapping file

Mapeia nomes entre o technology file e o TLUPlus. Sem ele, a ferramenta pode não saber que uma camada chamada `METAL1` em um arquivo corresponde à camada `cm1` em outro.

**Ideia-chave:**

```text
Layer mapping file = tradutor de nomes de camadas/vias entre arquivos físicos.
```

### Technology file

Define parâmetros físicos da tecnologia. Ele diz quais camadas existem, como são chamadas, quais regras físicas se aplicam e como vias/sites são definidos.

**Pegadinha do quiz:**

```text
Technology file define physical DRCs, não logic DRCs.
```

---

## Figuras, diagramas e waveforms importantes

Esta parte C não contém diagramas novos de fluxo, apenas telas de quiz. Mesmo assim, as telas reforçam quatro associações visuais importantes:

1. **Physical cell library** aparece associada a descrições físicas de standard cells, macros e IO pad cells.
2. **Design library** aparece associada ao contêiner do layout/design físico e dados associados.
3. **Frame view** aparece associada a contorno de célula e localização de pinos.
4. **Technology file** aparece associado a DRCs físicas, não a DRCs lógicas.

O slide 58 é o mais importante para fluxo porque conecta os dois momentos de aplicação de restrições físicas:

```text
pre-floorplan  -> restrições físicas aproximadas antes da primeira netlist;
post-floorplan -> floorplan real carregado antes da nova síntese/netlist.
```

---

## Pontos de prova e revisão

### 1. Physical cell library versus Design library

**Questão provável:**

```text
Match physical cell library and design library.
```

**Resposta:**

```text
Physical cell library:
contains physical layout descriptions of standard cells, macro and IO pad cells.

Design library:
container that holds the physical design/layout and associated physical data.
```

### 2. Frame view

**Questão:**

```text
A physical cell library Frame view...
```

**Resposta correta:**

```text
Defines each cell's outline, as well as pin locations.
```

### 3. TLUPlus and layer mapping

**Questão:**

```text
Parasitic net RC modeling is supplied to DC NXT with TLUPlus and layer mapping files. True or False?
```

**Resposta correta:**

```text
True
```

### 4. Technology file

**Questão:**

```text
A technology file defines the number of metal routing layers as well as logic DRCs for a specific technology. True or False?
```

**Resposta correta:**

```text
False
```

**Motivo:** o technology file define **physical DRCs**, como minimum spacing, width e pitch, não logic DRCs.

### 5. Physical constraints no fluxo

**Questão provável:**

```text
When are you likely to apply physical constraints in DC NXT physical synthesis flow?
```

**Resposta conceitual:**

```text
Before pre-floorplan synthesis, when no real floorplan exists but approximate constraints are known.

Before post-floorplan synthesis, after an actual floorplan has been created and loaded through DEF/Floorplan Tcl.
```

---

## Relação com projeto/laboratório

No laboratório, esta parte ajuda a evitar erros de interpretação nos scripts de setup.

Quando aparecerem comandos como:

```tcl
set ndm_reference_library "./CLIB/saed32_lvt.ndm"
set ndm_design_library    "./MY_design.dlib"
create_lib \
    -ref_libs   $ndm_reference_library \
    -technology ./tech/saed32_1p9m.tf \
    $ndm_design_library
set_tlu_plus_files \
    -max_tluplus ./tech/saed32_1p9m_Cmax.tluplus \
    -tech2itf_map ./tech/saed32_tf_itf_tluplus.map
```

você deve ler assim:

```text
ndm_reference_library -> bibliotecas físicas de referência.
ndm_design_library    -> contêiner físico do design.
technology .tf        -> camadas, vias, regras físicas, sites.
TLUPlus               -> modelos RC parasitários.
map file              -> mapeamento de nomes de camadas/vias.
```

Quando aparecerem constraints físicas antes da primeira compilação, elas provavelmente pertencem ao cenário **pre-floorplan**:

```tcl
source MY_TOP_phys_cons.tcl
compile_ultra
```

Quando aparecer `read_floorplan`, o fluxo está entrando no cenário **post-floorplan**:

```tcl
read_floorplan floorplan_def/floorplan.tcl
compile_ultra
```

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados quando necessário.
- [x] Figuras/telas de quiz relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

- **Bloco:** 035
- **Título:** 03 Accessing Design and Library Objects
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\03 Accessing Design and Library Objects.docx`
- **Processar somente slides:** 1-22
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\03 Accessing Design and Library Objects.md`
