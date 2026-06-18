# 02 Design Setup for Physical Synthesis — parte A

## Controle do bloco

- **Bloco:** 032
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Faixa de slides processada:** slides 1-25
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis_parte_A.md`
- **Próximo bloco recomendado:** Bloco 033 — `02 Design Setup for Physical Synthesis - parte B`
- **Próximo arquivo:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Próxima faixa:** slides 26-50

> Observação de divisão: este bloco processa a primeira parte do arquivo, parando nos quizzes finais sobre `target_library`, `link_library`, variáveis de aplicação e conteúdo de bibliotecas `.db`. O slide seguinte, **Physical Synthesis Requirements**, já pertence à parte B.

---

## Resumo executivo

Esta aula explica o primeiro grande requisito para preparar uma síntese no **Design Compiler NXT**: antes de sintetizar RTL, a ferramenta precisa saber **quais bibliotecas usar**, **onde encontrar arquivos**, **como representar o RTL internamente** e **como transformar o código em um design atual ligado e verificável**.

O ponto central é entender a diferença entre:

- **bibliotecas lógicas específicas da tecnologia**, normalmente em formato `.db`;
- **bibliotecas genéricas internas do DC NXT**, como `gtech.db` e `standard.sldb`;
- **`target_library`**, usada para escolher as células reais da tecnologia durante o `compile_ultra`;
- **`link_library`**, usada para resolver referências instanciadas no design;
- **`search_path`**, usado para indicar os diretórios onde a ferramenta deve procurar arquivos;
- comandos de leitura do RTL, como `analyze` e `elaborate`;
- boas práticas após elaborar o design: rodar `link`, `check_design` e salvar o design em `.ddc` antes da síntese.

A aula também mostra uma ideia muito importante: depois de `analyze` + `elaborate`, o RTL ainda não virou portas reais da tecnologia. Ele é traduzido para uma representação intermediária chamada **GTECH**, isto é, uma forma genérica de lógica. Só depois de `compile_ultra` a ferramenta faz otimização e mapeamento para células reais da biblioteca alvo.

---

## Texto extraído e organizado por slide

### Slide 1 — Technology-Specific Logic Libraries

**Texto principal extraído:**

- DC NXT requires technology-specific logic libraries for synthesis.
- Standard cell libraries:
  - Used to implement and optimize RTL constructs, for example `if/case`, `always@` or `clk'event`.
  - Contains logic function, for example AND and FF, and cell characterization data such as area and timing.
- Hard macro or IP libraries:
  - Instantiated in RTL, not optimized.
  - Contains only cell characterization data.
- Each logic library is characterized for a single process/voltage/temperature, PVT, corner or operating condition.
- In this workshop we are assuming that synthesis is performed in one single PVT corner.

**Leitura didática:**

O DC NXT não sintetiza um RTL em uma lógica abstrata qualquer. Ele precisa escolher células reais de uma tecnologia real. Por isso, antes da síntese, é obrigatório dizer qual biblioteca lógica será usada. Essa biblioteca contém portas, flip-flops e células caracterizadas para uma condição de fabricação, tensão e temperatura.

Uma biblioteca de **standard cells** permite que o sintetizador implemente e otimize lógica. Já uma biblioteca de **hard macro/IP** serve principalmente para reconhecer blocos já prontos, como RAMs, PLLs, ROMs ou IPs fechados. Esses blocos são instanciados, ligados e considerados no timing, mas normalmente não são “reescritos” internamente pelo DC NXT.

---

### Slide 2 — Example: Standard Cell Function and Characterization Data

**Texto principal extraído:**

- Example of a cell description in `.lib` format.
- Exemplo de célula: `OR2_4x`.
- A descrição inclui:
  - cell name;
  - cell area;
  - pin direction;
  - timing arcs;
  - related pin;
  - timing sense;
  - propagation delay table;
  - rise transition;
  - fall transition;
  - function;
  - max capacitance;
  - pin capacitance.
- A figura mostra uma porta OR com entradas `A`, `B` e saída `Y`.
- A função aparece como:

```text
Y = A | B
```

- O slide também destaca curvas de caracterização dependentes de carga e transição de entrada.
- Mensagem de rodapé:
  - Logic libraries are usually supplied as binary `.db` files.

**Leitura didática:**

A biblioteca nasce frequentemente em formato textual `.lib`, mas no fluxo Synopsys costuma ser usada em formato compilado `.db`. A célula não é apenas uma porta lógica; ela vem com dados elétricos e temporais. Para síntese, isso é decisivo, porque o DC NXT precisa saber:

- quanto a célula ocupa;
- quanto atraso ela gera;
- quanta capacitância ela suporta na saída;
- qual transição de entrada afeta o atraso;
- quais DRCs lógicos precisam ser respeitados, como máxima transição e máxima capacitância.

O exemplo mostra que a biblioteca lógica contém **função lógica + área + modelos de timing + restrições elétricas**. Ela não contém geometria física detalhada de layout. Isso será importante nos quizzes.

---

### Slide 3 — Additional Requirement: DC NXT Generic Logic Libraries

**Texto principal extraído:**

- DC NXT also requires generic libraries, provided by DC NXT, to represent RTL constructs prior to synthesis.
- Function only: no timing, area or DRC.
- `gtech.db`: generic gate-level logic functions, for example AND, XOR and FF.
- `standard.sldb`: generic arithmetic logic functions, for example `+`, `*` and `>`.
- Generic libraries are used when RTL is read or loaded into the DC NXT shell and translated into unmapped or GTECH format.
- Three application variables are used to specify and access technology-specific and generic libraries:
  - `target_library`: technology-specific libraries.
  - `link_library`: technology-specific libraries.
  - `search_path`: paths to technology-specific and generic libraries.

**Leitura didática:**

Antes de mapear para células reais, o DC NXT precisa criar uma forma intermediária do design. Essa forma intermediária usa bibliotecas genéricas. O RTL pode ter construções como:

```verilog
assign sum = a + b;
always_ff @(posedge clk) q <= d;
if (sel) y = a; else y = b;
```

A ferramenta precisa representar isso em elementos internos. Para isso ela usa bibliotecas genéricas, principalmente `gtech.db` e `standard.sldb`.

Essas bibliotecas não modelam atraso real, área real nem DRC real. Elas servem para a etapa anterior ao mapeamento, isto é, para construir uma lógica genérica não mapeada.

---

### Slide 4 — Target Library: Used to Select Technology Specific Cells

**Texto principal extraído:**

- The `target_library` content is used during compile to create a technology-specific gate-level netlist.
- DC NXT optimization selects the smallest technology-specific gates that meet the required DRCs, timing and logic functionality.
- Default setting:

```tcl
printvar target_library
```

Valor padrão mostrado no slide:

```tcl
target_library = your_library.db
```

- Antes do `compile`, especificar os arquivos reais de standard cell logic library fornecidos pelo vendor de silício ou grupo de biblioteca:

```tcl
set_app_var target_library libs/20nm_wc.db
```

**Leitura didática:**

`target_library` responde à pergunta:

> Para quais células reais o meu RTL será sintetizado?

Durante `compile_ultra`, o DC NXT pega a lógica genérica e escolhe células reais da biblioteca alvo. Por exemplo, ele pode escolher entre versões diferentes de uma mesma porta:

```text
AND2_X1
AND2_X2
AND2_X4
```

A menor célula tende a consumir menos área e potência, mas pode ser lenta demais ou incapaz de dirigir a carga. A ferramenta escolhe células que respeitam função, timing e DRCs lógicos.

O comando recomendado usa `set_app_var`, não apenas `set`, porque `set_app_var` sabe que a variável é uma variável de aplicação do DC NXT. Se houver erro de digitação no nome da variável, a ferramenta consegue acusar o problema.

---

### Slide 5 — Link Library: Used to Resolve Instantiated References

**Texto principal extraído:**

Default:

```tcl
link_library = "* your_library.db"
```

- `"*"` represents designs in DC NXT memory.
- `your_library.db` aparece como nome padrão inexistente.
- Used to link the design: resolve instantiated references in the RTL design or gate-level netlist.
- Primeiro procura na memória do DC NXT por um nome de design correspondente, como módulo ou entity no RTL.
- Depois procura dentro das bibliotecas listadas por um nome correspondente de célula de biblioteca.
- Especificar standard cell e IP logic library names antes de o design ser linked.
- O `*` deve sempre ser listado primeiro.

Comando mostrado:

```tcl
set_app_var link_library "* $target_library libs/IP.db libs/RAMs.db"
```

Nota Tcl do slide:

- Soft quotes define a list while allowing variable substitution, `$var`.

**Leitura didática:**

`link_library` responde à pergunta:

> Quando o design instancia algo, onde o DC NXT deve procurar essa referência?

Exemplo RTL:

```verilog
module top (...);
  alu u_alu (...);
  RAM_1P u_ram (...);
endmodule
```

Ao elaborar ou ligar o design, o DC NXT precisa saber o que são `alu` e `RAM_1P`.

A ordem típica é:

1. Procurar na própria memória do DC NXT, porque talvez `alu` seja outro módulo RTL já analisado.
2. Procurar nas bibliotecas listadas, porque talvez `RAM_1P` seja uma macro/IP da biblioteca.

O `*` representa “olhe primeiro para os designs já carregados na memória”. Por isso ele deve aparecer antes das bibliotecas externas.

---

### Slide 6 — Search Path: Used for Generic Libs and Search Directories

**Texto principal extraído:**

Default search directories:

```tcl
printvar search_path
```

Valor padrão mostrado:

```tcl
search_path = ". <install_dir>/libraries/syn
               <install_dir>/dw/sim_ver
               <install_dir>/dw/syn_ver"
```

Notas do slide:

- `"."` represents current working directory, CWD.
- `<install_dir>` representa o diretório raiz de instalação do DC NXT.
- O `search_path` padrão inclui a localização das bibliotecas genéricas requeridas:
  - `gtech.db`;
  - `standard.sldb`.
- Add search directories to the default list; do not overwrite.
- DC NXT looks for design and library files in the `search_path` directories.

Comando recomendado:

```tcl
set_app_var search_path "$search_path \
                         mapped libs cons"
```

**Leitura didática:**

`search_path` não diz quais bibliotecas usar. Ele diz **onde procurar arquivos**. Isso vale para RTL, constraints, bibliotecas e outros arquivos referenciados pelo script.

O erro comum é sobrescrever o `search_path` e perder os caminhos padrão onde estão `gtech.db` e `standard.sldb`. Por isso a boa prática é acrescentar novos diretórios mantendo o conteúdo anterior:

```tcl
set_app_var search_path "$search_path rtl libs cons"
```

Assim a ferramenta continua encontrando as bibliotecas internas e passa a encontrar também as pastas do projeto.

---

### Slide 7 — Application Variables are Global and Non-Persistent

**Texto principal extraído:**

- Most application variables in DC NXT are global and non-persistent.
- They apply to all designs during the same tool session.
- Settings are not saved with the design.
- When the tool session ends and is later restarted, application variables revert back to their default values, if any.
- Application variables must therefore be reapplied at tool start-up.
- Create a file with all app var settings and source immediately after tool start-up.

Exemplo mostrado:

```tcl
dc_shell-topo> source dc_setup.tcl
```

Exemplo de `dc_setup.tcl`:

```tcl
set_app_var search_path    "$search_path cons rtl libs"
set_app_var target_library 20nm_wc.db
set_app_var link_library   "* $target_library IP.db"
```

**Leitura didática:**

As variáveis de aplicação são globais dentro da sessão do DC NXT, mas não ficam gravadas automaticamente no design. Isso significa:

- se você fechar a ferramenta, perde os ajustes;
- se abrir uma nova sessão, precisa aplicar de novo;
- se ler outro design na mesma sessão usando as mesmas bibliotecas, não precisa reaplicar só por trocar de design.

O arquivo `dc_setup.tcl` existe justamente para padronizar a inicialização.

---

### Slide 8 — DC NXT Initialization Files

**Texto principal extraído:**

Arquivos executados automaticamente na inicialização do DC NXT, na ordem mostrada:

1. `$SYNOPSYS/admin/setup/.synopsys_dc.setup`
2. `~/.synopsys_dc.setup`
3. `.synopsys_dc.setup` no diretório de inicialização do DC NXT, geralmente o CWD.

Mensagem principal:

- These files are automatically executed, in the order shown, upon startup of DC NXT.

**Leitura didática:**

A ferramenta carrega arquivos de setup automaticamente. A ordem importa porque arquivos posteriores podem complementar ou sobrescrever configurações anteriores.

O arquivo global da instalação define defaults. O arquivo do usuário pode definir preferências pessoais. O arquivo no diretório do projeto costuma definir configurações específicas daquele projeto.

---

### Slide 9 — Default .../admin/setup/.synopsys_dc.setup

**Texto principal extraído:**

Exemplo de arquivo em:

```text
$SYNOPSYS/admin/setup/.synopsys_dc.setup
```

Conteúdo típico mostrado:

```tcl
set_app_var target_library your_library.db
set_app_var link_library {* your_library.db}
set_app_var symbol_library your_library.sdb
set_app_var search_path \
    ". <install_dir>/libraries/syn ..."
```

Mensagem destacada:

- This file sets default values for all application variables and is automatically executed first upon tool startup.
- Do NOT delete or modify!

**Leitura didática:**

Esse é o setup padrão da instalação Synopsys. Ele não deve ser apagado nem editado, porque pertence ao ambiente comum da ferramenta. O fluxo correto é criar seus próprios arquivos de setup no usuário ou no projeto.

---

### Slide 10 — Reading RTL File(s) with analyze + elaborate

**Texto principal extraído:**

Estrutura de diretórios mostrada:

```text
risc_design/
├── dc_setup.tcl
├── cons/
├── rtl/
│   └── TOP.v
└── libs/
    ├── 20nm_wc.db
    └── IP.db
```

Exemplo de `dc_setup.tcl`:

```tcl
set_app_var search_path    "$search_path cons rtl libs"
set_app_var target_library 20nm_wc.db
set_app_var link_library   "* $target_library IP.db"
```

Fluxo mostrado no shell:

```tcl
unix% cd risc_design
unix% dcnxt_shell -topo
dcnxt_shell-topo> source dc_setup.tcl
dcnxt_shell-topo> ....  ;# physical data setup - shown later
dcnxt_shell-topo> analyze -format verilog TOP.v
dcnxt_shell-topo> elaborate MY_TOP
```

**Leitura didática:**

Ler RTL no DC NXT normalmente envolve duas etapas:

1. `analyze`: lê arquivos RTL e verifica sintaxe.
2. `elaborate`: constrói o design a partir do top, resolve parâmetros, monta hierarquia e cria a representação GTECH.

Isso é diferente de simulação. No simulador, o objetivo é executar comportamento. No DC NXT, o objetivo é preparar uma representação sintetizável e otimizável.

---

### Slide 11 — Analyze the RTL Syntax

**Texto principal extraído:**

Exemplos:

```tcl
analyze -format verilog "rtl/orca.v rtl/pci.v ..."
analyze -format sverilog "rtl/encryptor.sv ..."
analyze -format vhdl counter.vhd
analyze -vcs "-f orca.vcs"
```

Arquivo `orca.vcs` mostrado:

```text
-verilog
+libext+.v+.h
rtl/alu/alu.v
rtl/control.v
rtl/data_path.v
rtl/instrn_lat.v
rtl/prog_cnt.v
...
```

Pontos do slide:

- The `analyze` command analyzes the RTL syntax of Verilog, SystemVerilog or VHDL files.
- RTL files do not have to be the same format.
- Creates intermediate template results saved in current working directory, CWD.
- Allows the use of the same file list used for VCS.
- Options not supported by DC NXT are ignored.
- Also loads the `.db` link library files.

**Leitura didática:**

O `analyze` é a etapa de leitura e checagem sintática. Ele aceita diferentes linguagens, o que permite projetos mistos.

O uso de `-vcs` é prático porque permite reaproveitar um filelist de simulação. Isso é comum em projetos reais: o mesmo conjunto de arquivos usado no VCS pode ser passado ao DC NXT, desde que as opções não suportadas sejam ignoradas ou não prejudiquem a leitura.

---

### Slide 12 — Dealing with Intermediate Files from analyze Command

**Texto principal extraído:**

O slide mostra que o `analyze` cria vários arquivos intermediários, como:

```text
MY_TOP-verilog.syn
MY_A-verilog.syn
MY_B-verilog.syn
MY_TOP-verilog.pvl
MY_A-verilog.pvl
MY_B-RTL-verilog.pvl
MY_TOP.mr
MY_A.mr
MY_B.mr
```

Mensagem destacada:

- The `analyze` command creates several intermediate files.
- These files are stored in a directory controlled by the `WORK` library, which defaults to the CWD.
- This can create clutter in the CWD.
- These files should be redirected for a cleaner CWD.

Comando recomendado:

```tcl
dcnxt_shell-topo> define_design_lib WORK -path ./work
dcnxt_shell-topo> analyze -f verilog TOP.v
```

**Leitura didática:**

A biblioteca `WORK` funciona como o local onde a ferramenta guarda resultados intermediários da análise. Se você não definir esse caminho, a ferramenta pode poluir o diretório do projeto.

Boa prática:

```tcl
define_design_lib WORK -path ./work
```

Assim, os artefatos intermediários do `analyze` ficam em `./work`, deixando o diretório principal mais limpo.

---

### Slide 13 — Create a Linked current_design for Synthesis

**Texto principal extraído:**

- `elaborate` builds GTECH models for the specified top and its sub-designs.
- Loads the link libraries into memory.
- Links the specified top design to its sub-designs and `link_library` cells.
- Sets the elaborated design as the `current_design`.
- During compile, DC NXT synthesizes the `current_design` and its linked sub-designs.

Exemplo de comandos mostrado:

```tcl
analyze -format verilog TOP.v
elaborate MY_TOP
```

Trechos do log:

```text
Loading db file ...
Linking file ...
Elaborated 1 design.
Current design is now 'MY_TOP'.
Building the design 'MY_A' ...
Building the design ...
```

**Leitura didática:**

O comando `elaborate` é a etapa em que o DC NXT entende qual é o top do design. A partir dele, a ferramenta monta a hierarquia, aplica parâmetros e cria modelos GTECH.

`current_design` é o design ativo. Muitos comandos do DC NXT atuam implicitamente sobre ele. Por isso, depois de elaborar, é importante verificar se o `current_design` correto foi definido.

---

### Slide 14 — Apply Parameters with elaborate

**Texto principal extraído:**

Exemplo RTL:

```verilog
module MY_TOP (A, B, C, ...);
parameter A_WIDTH 2
parameter B_WIDTH 4
...
```

Exemplo de filelist:

```text
risc_design.vcs
-verilog
+libext+.v+.sv
rtl/TOP.v
rtl/A.v
rtl/B.v
rtl/C.v
...
```

Comandos mostrados:

```tcl
analyze -vcs "-f risc_design.vcs"
elaborate MY_TOP -parameters "A_WIDTH=8, B_WIDTH=16"
```

Mensagem destacada:

- These values override the default values defined in the RTL code.
- When `-parameters` is used, the `current_design` name is modified to include the parameter setting(s).

Exemplo de nome gerado:

```text
Current design is now 'MY_TOP_A_WIDTH8_B_WIDTH16'
```

**Leitura didática:**

Parâmetros em Verilog/SystemVerilog permitem que o mesmo módulo tenha variações de largura, tamanho ou configuração. O `elaborate` pode sobrescrever esses parâmetros.

Exemplo:

```tcl
elaborate MY_TOP -parameters "A_WIDTH=8, B_WIDTH=16"
```

Isso gera uma versão específica do design. Como o hardware resultante muda, o DC NXT modifica o nome do `current_design` para refletir os parâmetros usados. Isso evita confundir uma versão parametrizada com outra.

---

### Slide 15 — Good Practice: After elaborate Run link

**Texto principal extraído:**

- The `elaborate` command performs an implicit `link`.
- Locates all design and library components referenced in the current design and connects them to the current design.
- Will not abort a batch run if a linking error occurs.
- Use `link` to abort if error is detected.
- Good practice: explicitly link the design.

Exemplo:

```tcl
analyze -vcs "-f risc_design.vcs"
elaborate MY_TOP       ;# does not abort if link error occurs
if {![link] == 0} {
  exit                 ;# aborts if error detected
}
```

**Leitura didática:**

Embora `elaborate` execute um link implícito, o slide recomenda rodar `link` explicitamente. O motivo é controle de erro em scripts batch.

Em um fluxo automatizado, você quer que o script pare quando houver referência não resolvida. Se a ferramenta continuar mesmo com erro de link, você pode só descobrir o problema muito depois.

Uma forma comum é:

```tcl
if {![link] == 0} {
  exit
}
```

A intenção é: se o `link` indicar falha, abortar o fluxo.

---

### Slide 16 — Good Practice: After elaborate Run check_design

**Texto principal extraído:**

- `check_design` checks your current design for connectivity and hierarchy issues.
- Exemplos:
  - Missing ports or unconnected input pins.
  - Recursive hierarchy or multiple instantiations.
- Issues warnings, errors or "No issues found".
- Any error returns a 0 value.
- Good practice: run `check_design` after `elaborate`.

Exemplo:

```tcl
analyze -f verilog "A.v B.v C.v TOP.v"
analyze -vcs "-f risc_design.vcs"
elaborate MY_TOP
if {![link] == 0} { exit }
check_design       ;# does not abort if error detected
                   ;# see note
...
```

**Leitura didática:**

Depois de elaborar e ligar, ainda é possível haver problemas estruturais. O design pode estar sintaticamente correto, mas semanticamente suspeito: porta faltando, input desconectado, hierarquia errada, instância duplicada, etc.

`check_design` é uma verificação básica antes de constraints e síntese. Ele não substitui simulação nem formalidade, mas evita gastar tempo sintetizando um design estruturalmente problemático.

---

### Slide 17 — HTML-Based check_design Report

**Texto principal extraído:**

- The `check_design` report can be created in an HTML format for easier navigation and expansion.

Comandos:

```tcl
check_design -html check_design.html
sh firefox check_design.html
```

O exemplo visual mostra um relatório com categorias como:

- Inputs/Outputs;
- Cells;
- Designs;
- Nets;
- Tristates;
- total messages reported.

**Leitura didática:**

Quando há muitos warnings, o relatório textual pode ficar difícil de navegar. A opção `-html` cria um relatório organizado, útil para investigar categorias de problemas.

Abrir com:

```tcl
sh firefox check_design.html
```

usa `sh` para executar um comando Unix a partir do shell do DC NXT.

---

### Slide 18 — Good Practice: Save the Design Before compile

**Texto principal extraído:**

Comandos:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design
write_file -format ddc -hier -output unmapped/MY_TOP.ddc
source TOP.con
...
compile_ultra
```

Mensagem destacada:

- Good practice: save design in `ddc` format before constraining/compiling.
- `analyze/elaborate` translates RTL into GTECH.
- Translation of large designs may take a long time.
- May need to re-read the un-compiled design in the future.
- `read_ddc` loads existing GTECH faster.
- Save GTECH as `.ddc` file.

**Leitura didática:**

Antes de rodar constraints e `compile_ultra`, o design ainda está em forma não mapeada, GTECH. Salvar essa etapa pode economizar muito tempo.

Se depois você quiser mudar constraints, experimentar scripts ou refazer a síntese, não precisa ler e elaborar o RTL inteiro novamente. Pode carregar o `.ddc` salvo.

---

### Slide 19 — Read .ddc Design File Instead of RTL File

**Texto principal extraído:**

Fluxo inicial:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
if {![link] == 0} { exit }
check_design
write_file -format ddc -hier -out unmapped/MY_TOP.ddc
source TOP.con
...
compile_ultra
```

Fluxo alternativo:

```tcl
remove_design -designs
read_ddc unmapped/MY_TOP.ddc
current_design MY_TOP     ;# good practice to explicitly set the current_design
if {![link] == 0} { exit }
check_design
source TOP_NEW.con
...
compile_ultra
```

Mensagem destacada:

- If constraints or other non-RTL design specifications change, read the `.ddc` file instead of RTL.
- Much faster loading.

**Leitura didática:**

Essa é uma boa prática de produtividade. Se o RTL não mudou, mas as constraints mudaram, você pode carregar o design não mapeado salvo em `.ddc`.

Isso reduz tempo de setup em projetos grandes, especialmente quando `analyze` e `elaborate` são demorados.

---

### Slide 20 — Save the Design After compile

**Texto principal extraído:**

Fluxo mostrado:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design
write_file -f ddc -hier -out unmapped/MY_TOP.ddc
source TOP.con
compile_ultra
write_file -f verilog -hier -out mapped/MY_TOP_nl.v
write_file -f ddc     -hier -out mapped/MY_TOP.ddc
write_icc2_files      -out mapped/MY_TOP_icc2
```

Mensagem destacada:

- The `ddc` format stores the design netlist, constraints, compile directives, attributes, cell placement and more.
- The `ddc` format can be read by DC NXT but not ICC II.

**Leitura didática:**

Depois do `compile_ultra`, o design já está mapeado para células da tecnologia. A prática é salvar:

- netlist Verilog mapeada;
- `.ddc` mapeado para reabrir no DC NXT;
- arquivos para ICC II por meio de `write_icc2_files`.

O `.ddc` é muito útil para DC NXT, mas não é o formato consumido diretamente pelo ICC II. Para a passagem ao fluxo físico, usa-se outro pacote de arquivos gerado com `write_icc2_files`.

---

### Slide 21 — RTL Code to Gate Flow (SystemVerilog Example)

**Texto principal extraído:**

O slide mostra um exemplo de RTL SystemVerilog com construções como:

```systemverilog
module my_design (...);
  always_ff @(posedge clk)
    dout <= din1;

  always_latch
    if (en)
      lout = din2;

  always_comb
    sum = din1 + din2;

  assign bout = ~(sum);
endmodule
```

Setas indicam a tradução:

- `register`;
- `latch`;
- `ripple carry adder`;
- `boolean operator`.

Depois de `analyze + elaborate`, aparece um design **unmapped (gtech)** com elementos genéricos, por exemplo:

```verilog
module my_design (...);
  **SEQGEN** \dout_reg (...);
  **SEQGEN** \lout_reg (...);
  ADD_UNS_OP add_12 (...);
  GTECH_NOT I_0 (...);
  GTECH_AND2 C23 (...);
endmodule
```

Depois de `compile_ultra`, aparece um design **mapped** com células reais, por exemplo:

```verilog
module my_design (...);
  DFFRX1_LVT  \dout_reg (...);
  LATRX1_LVT  \lout_reg (...);
  INVX1_LVT   U20 (...);
  OR2X1_LVT   U21 (...);
  NBUFFX4_LVT U23 (...);
endmodule
```

**Leitura didática:**

Este slide resume o fluxo inteiro:

```text
RTL → GTECH/unmapped → mapped gates
```

No RTL, você escreve comportamento sintetizável. Após `analyze + elaborate`, o DC NXT transforma isso em blocos genéricos. Após `compile_ultra`, a lógica é otimizada e mapeada em células reais da biblioteca alvo.

Exemplo:

- `always_ff` vira registrador.
- `always_latch` vira latch.
- `+` vira estrutura de somador.
- operadores booleanos viram portas genéricas.
- depois do compile, tudo vira nomes reais da tecnologia.

---

### Slide 22 — Quiz: target_library

**Questão extraída:**

> The `target_library` is used during optimization (`compile_ultra`) to select the smallest gates that meet DRCs and timing. True or False?

**Resposta correta do curso:** True.

**Justificativa:**

O `target_library` é justamente a biblioteca usada durante o `compile_ultra` para escolher as células reais da tecnologia. A ferramenta tenta escolher as menores células que satisfaçam funcionalidade, timing e DRCs lógicos.

---

### Slide 23 — Quiz: link_library

**Questão extraída:**

> The `link_library` variable is used to resolve instantiated sub-designs and leaf cells by looking for matching cell names in the listed libraries. True or False?

**Resposta correta do curso:** False.

**Justificativa:**

A frase é incompleta/enganosa. O `link_library` não resolve tudo apenas procurando nomes nas bibliotecas listadas. O fluxo correto é:

1. primeiro procurar designs já carregados na memória do DC NXT, indicados pelo `*`;
2. depois procurar células nas bibliotecas listadas.

Além disso, sub-designs RTL podem estar na memória, enquanto leaf cells e macros podem estar nas bibliotecas.

---

### Slide 24 — Quiz: reapplying link_library and target_library

**Questão extraída:**

> The `link_library` and `target_library` variable settings must be re-applied within a DC NXT session whenever a new design is read in, assuming the same libraries are used. True or False?

**Resposta correta do curso:** False.

**Justificativa:**

As variáveis de aplicação são globais dentro da sessão. Se a sessão continua aberta e as mesmas bibliotecas são usadas, não é necessário reaplicar `target_library` e `link_library` apenas porque um novo design foi lido. Elas precisam ser reaplicadas quando a ferramenta é reiniciada, porque são não persistentes entre sessões.

---

### Slide 25 — Quizzes: set_app_var e conteúdo de biblioteca .db

#### Questão 25.1 — Vantagem de `set_app_var` sobre `set`

**Questão extraída:**

> Select the correct advantage of using `set_app_var` over `set` when specifying DC NXT variable values.

**Ideia correta:**

A vantagem é que `set_app_var` valida se o nome informado é realmente uma variável de aplicação do DC NXT. Se houver erro de digitação, a ferramenta emite mensagem de erro. Com `set`, Tcl poderia simplesmente criar uma variável comum com aquele nome, mascarando o erro.

Exemplo de problema:

```tcl
set target_libray libs/20nm_wc.db
```

Nesse caso, `target_libray` está escrito errado. Usar `set` poderia criar uma variável Tcl inútil e deixar `target_library` sem alteração. Usar `set_app_var` ajuda a detectar esse tipo de erro.

#### Questão 25.2 — O que NÃO está contido em uma definição de célula NAND em biblioteca `.db`

**Questão extraída:**

> Which of the following is NOT contained in a db library cell definition of a NAND gate?

Opções visíveis:

- a) Timing models
- b) "Area" of the cell, in vendor-dependent units
- c) Footprint, size and shape, of the cell
- d) Logic function definition
- e) Physical DRCs, for example minimum spacing, width, pitch
- f) Logic or buffering DRCs, for example maximum transition, capacitance
- g) Number of input/output pins
- h) Physical location of pins

**Resposta correta do curso:** c), e), h).

**Justificativa:**

A biblioteca lógica `.db` contém função lógica, área abstrata, timing, capacitâncias e DRCs lógicos como max transition e max capacitance. Ela não contém geometria física detalhada: footprint real, regras físicas de layout nem localização física dos pinos. Essas informações pertencem à biblioteca física, como NDM/frame view, e aos arquivos de tecnologia.

---

## Aula didática desenvolvida

### 1. A síntese começa antes do `compile_ultra`

Uma ideia importante nesta aula é que o comando `compile_ultra` não trabalha sozinho. Antes dele funcionar corretamente, o ambiente precisa estar configurado. O DC NXT precisa responder a perguntas básicas:

1. **Onde estão meus arquivos?**  
   Isso é configurado com `search_path`.

2. **Quais células reais posso usar para implementar o design?**  
   Isso é configurado com `target_library`.

3. **Onde encontro módulos, IPs, macros e células instanciadas?**  
   Isso é configurado com `link_library`.

4. **Como transformar o RTL em uma representação interna?**  
   Isso é feito com `analyze` e `elaborate`.

5. **O design está estruturalmente correto antes da síntese?**  
   Isso é conferido com `link` e `check_design`.

Então, o fluxo inicial recomendado não é simplesmente:

```tcl
compile_ultra
```

É algo mais parecido com:

```tcl
source dc_setup.tcl
define_design_lib WORK -path ./work
analyze -format verilog TOP.v
elaborate MY_TOP
if {![link] == 0} { exit }
check_design
write_file -format ddc -hier -output unmapped/MY_TOP.ddc
source TOP.con
compile_ultra
```

O objetivo é criar uma base limpa e reprodutível antes de otimizar o design.

---

### 2. Bibliotecas lógicas específicas da tecnologia

Quando se fala em síntese ASIC, “biblioteca” não é uma biblioteca de software. É um conjunto de células físicas e lógicas que podem existir no chip.

Uma standard cell library contém células como:

```text
INVX1
INVX2
NAND2_X1
NAND2_X4
DFFRX1
MUX2_X1
AOI21_X2
```

Cada célula tem:

- função lógica;
- área;
- pinos;
- capacitâncias;
- tabelas de atraso;
- tabelas de transição;
- restrições elétricas;
- informações de setup/hold para células sequenciais.

Quando o DC NXT sintetiza o RTL, ele escolhe uma combinação dessas células.

Exemplo conceitual:

```verilog
assign y = ~(a & b);
```

Isso pode virar:

```text
NAND2_X1 U1 (.A(a), .B(b), .Y(y));
```

Mas se a carga for grande ou o timing apertado, talvez a ferramenta escolha:

```text
NAND2_X4 U1 (.A(a), .B(b), .Y(y));
```

A decisão depende da biblioteca, das constraints e dos modelos de timing.

---

### 3. PVT corner: processo, tensão e temperatura

O slide diz que cada biblioteca lógica é caracterizada para um único **PVT corner**.

PVT significa:

- **Process:** variação de fabricação do silício.
- **Voltage:** tensão de alimentação.
- **Temperature:** temperatura de operação.

Exemplos típicos:

```text
slow process, low voltage, high temperature
fast process, high voltage, low temperature
typical process, nominal voltage, nominal temperature
```

Uma célula não tem sempre o mesmo atraso. Em um corner lento, ela pode atrasar mais. Em um corner rápido, ela pode atrasar menos, mas gerar problemas de hold.

Neste workshop, o curso assume um único PVT corner para simplificar. Em projetos reais, o fluxo normalmente trabalha com múltiplos corners e múltiplos modos, o chamado **MMMC**.

---

### 4. `.lib` versus `.db`

O slide mostra uma descrição de célula em formato `.lib`, mas afirma que as bibliotecas geralmente são fornecidas como `.db`.

A diferença é:

- `.lib`: formato textual Liberty, legível por humanos.
- `.db`: formato compilado Synopsys, lido diretamente pelas ferramentas Synopsys.

O conteúdo conceitual é semelhante, mas o `.db` é o formato operacional usado pelo DC NXT.

Exemplo simplificado de uma célula em `.lib`:

```liberty
cell (OR2_4x) {
  area : 6.000;
  pin (Y) {
    direction : output;
    function : "(A | B)";
    max_capacitance : 1.14810;
    timing () {
      related_pin : "A";
      timing_sense : positive_unate;
      cell_rise (...) { ... }
      rise_transition (...) { ... }
    }
  }
  pin (A) {
    direction : input;
    capacitance : 0.012000;
  }
}
```

Essa célula informa a função, a área e os modelos temporais. Mas não diz exatamente onde o pino `A` está no layout ou qual é o formato físico da célula. Isso pertence à biblioteca física.

---

### 5. Bibliotecas genéricas: `gtech.db` e `standard.sldb`

Antes de escolher células reais, o DC NXT precisa transformar o RTL em uma estrutura lógica genérica.

Exemplo RTL:

```verilog
assign y = (a & b) | c;
```

Antes do mapeamento, isso pode virar algo como:

```text
GTECH_AND2
GTECH_OR2
```

Esses elementos genéricos vêm de `gtech.db`.

Para operações aritméticas, como soma, multiplicação e comparação, a ferramenta usa funções genéricas de `standard.sldb`.

Exemplo:

```verilog
assign sum = a + b;
assign gt  = a > b;
```

Essas operações podem virar blocos genéricos antes de serem implementadas com portas reais.

O ponto importante é:

```text
RTL → GTECH/unmapped → mapped gates
```

A biblioteca genérica ajuda na etapa intermediária. A biblioteca alvo ajuda na etapa final.

---

### 6. `target_library`: biblioteca alvo da síntese

A variável `target_library` define quais bibliotecas a ferramenta pode usar para mapear a lógica.

Exemplo:

```tcl
set_app_var target_library libs/20nm_wc.db
```

Aqui, `20nm_wc.db` provavelmente significa uma biblioteca de 20 nm no corner `wc`, worst case.

Durante `compile_ultra`, o DC NXT escolhe células dessa biblioteca. Se `target_library` estiver errada, vazia ou apontando para uma biblioteca incompatível, a síntese não terá as células corretas para implementar o design.

Erro comum:

```tcl
set_app_var target_library 20nm_wc.db
```

mas o arquivo não está no diretório atual nem em nenhum diretório de `search_path`.

Nesse caso, o DC NXT pode não encontrar a biblioteca. Por isso `search_path` e `target_library` trabalham juntos.

---

### 7. `link_library`: resolução de referências

`link_library` é diferente de `target_library`.

A pergunta do `target_library` é:

> Quais células posso usar para implementar o design?

A pergunta do `link_library` é:

> Quando eu encontro uma instância, onde procuro a definição dela?

Exemplo:

```verilog
module TOP (...);
  ALU u_alu (...);
  SRAM_1P u_mem (...);
endmodule
```

`ALU` pode ser um módulo RTL já carregado na memória. `SRAM_1P` pode ser uma macro da biblioteca de IP.

Por isso, uma configuração comum é:

```tcl
set_app_var link_library "* $target_library libs/IP.db libs/RAMs.db"
```

O `*` manda procurar primeiro nos designs carregados em memória.

Sem o `*`, o DC NXT poderia não encontrar submódulos RTL já analisados. Por isso o slide enfatiza que o `*` deve sempre aparecer primeiro.

---

### 8. `search_path`: caminho de procura

`search_path` indica onde a ferramenta procura arquivos. Ele não define quais bibliotecas serão usadas; ele define diretórios.

Exemplo:

```tcl
set_app_var search_path "$search_path cons rtl libs"
```

Isso diz:

- mantenha os diretórios já existentes;
- acrescente `cons`, `rtl` e `libs`.

A parte `$search_path` é importante. Sem ela, você sobrescreveria os caminhos padrão da ferramenta. Isso poderia fazer a ferramenta perder acesso a bibliotecas genéricas internas como `gtech.db` e `standard.sldb`.

---

### 9. Por que usar `set_app_var` em vez de `set`

Em Tcl, `set` define uma variável comum. O problema é que, se você errar o nome, Tcl pode aceitar e criar uma variável inútil.

Exemplo de erro:

```tcl
set target_libray libs/20nm_wc.db
```

Aqui faltou o `r` em `library`. Tcl pode criar `target_libray`, mas o DC NXT continuará usando o valor antigo de `target_library`.

Com `set_app_var`, a ferramenta verifica se a variável existe como variável de aplicação:

```tcl
set_app_var target_library libs/20nm_wc.db
```

Se o nome estiver errado, a ferramenta tende a emitir erro. Por isso o slide diz que `set_app_var` é mais seguro do que o comando Tcl `set`.

---

### 10. Variáveis globais e não persistentes

As variáveis de aplicação do DC NXT são globais dentro da sessão. Isso significa que, se você configurou:

```tcl
set_app_var target_library libs/20nm_wc.db
set_app_var link_library "* $target_library libs/IP.db"
```

essas configurações valem para os designs lidos naquela mesma sessão.

Mas elas são não persistentes. Ao fechar e reabrir o DC NXT, os valores voltam aos defaults. Por isso o setup precisa ser reaplicado no início da sessão.

Boa prática:

```tcl
source dc_setup.tcl
```

Esse arquivo centraliza as configurações do projeto.

---

### 11. Arquivos de inicialização do DC NXT

A ferramenta pode executar automaticamente arquivos `.synopsys_dc.setup`.

A ordem mostrada é:

```text
$SYNOPSYS/admin/setup/.synopsys_dc.setup
~/.synopsys_dc.setup
./.synopsys_dc.setup
```

A ordem representa níveis de configuração:

1. instalação da ferramenta;
2. usuário;
3. projeto/diretório atual.

O arquivo global da instalação não deve ser editado. O projeto deve usar seus próprios scripts, como:

```tcl
dc_setup.tcl
common_setup.tcl
```

Isso melhora reprodutibilidade. Se outra pessoa rodar o fluxo, terá as mesmas configurações.

---

### 12. `analyze`: leitura e análise sintática do RTL

O comando `analyze` lê arquivos RTL e cria representações intermediárias.

Exemplo:

```tcl
analyze -format verilog TOP.v
```

Para SystemVerilog:

```tcl
analyze -format sverilog rtl/encryptor.sv
```

Para VHDL:

```tcl
analyze -format vhdl counter.vhd
```

Com filelist estilo VCS:

```tcl
analyze -vcs "-f risc_design.vcs"
```

Isso é útil porque muitos projetos já têm filelists de simulação. A ferramenta pode reaproveitar esse arquivo para saber quais arquivos RTL ler e em qual ordem.

---

### 13. `define_design_lib WORK -path ./work`

O `analyze` gera arquivos intermediários. Se você não configurar o local, esses arquivos podem ficar espalhados no diretório principal.

Boa prática:

```tcl
define_design_lib WORK -path ./work
```

Isso cria ou aponta a biblioteca de trabalho para `./work`.

Depois:

```tcl
analyze -format verilog TOP.v
```

Os resultados intermediários são organizados dentro de `./work`.

Isso não muda a lógica do design. É organização de fluxo.

---

### 14. `elaborate`: criação do design atual

Depois de `analyze`, o RTL foi lido, mas ainda não existe necessariamente um design top montado. O comando `elaborate` escolhe o top e cria a hierarquia.

Exemplo:

```tcl
elaborate MY_TOP
```

O que ele faz:

- monta a hierarquia a partir do top;
- aplica parâmetros;
- cria representação GTECH;
- carrega bibliotecas necessárias;
- realiza link implícito;
- define `MY_TOP` como `current_design`.

A partir daqui, muitos comandos passam a agir sobre o design atual.

---

### 15. Parâmetros no `elaborate`

Quando o RTL tem parâmetros, o `elaborate` pode sobrescrever valores.

Exemplo:

```systemverilog
module MY_TOP #(parameter A_WIDTH = 2,
                parameter B_WIDTH = 4)
               (...);
endmodule
```

No DC NXT:

```tcl
elaborate MY_TOP -parameters "A_WIDTH=8, B_WIDTH=16"
```

Isso muda o hardware gerado. Um barramento de 8 bits não ocupa a mesma lógica que um barramento de 2 bits. Por isso o nome do `current_design` pode ser modificado para incluir os parâmetros.

---

### 16. Por que rodar `link` explicitamente

`elaborate` faz um link implícito. Mesmo assim, o slide recomenda rodar:

```tcl
link
```

A razão é controle de erro. Em batch, você quer que o script pare se houver referência não resolvida.

Exemplo:

```tcl
if {![link] == 0} {
  exit
}
```

A intenção é abortar se o link falhar.

Referência não resolvida pode ser:

- módulo RTL que não foi analisado;
- nome de IP errado;
- biblioteca não incluída em `link_library`;
- macro com nome diferente;
- erro de ordem de leitura.

---

### 17. `check_design`: verificação estrutural

Depois do link, rode:

```tcl
check_design
```

Ele procura problemas de conectividade e hierarquia.

Exemplos:

- porta faltando;
- entrada desconectada;
- hierarquia recursiva;
- múltiplas instâncias problemáticas;
- design sem saída;
- nets desconectadas.

Para relatório navegável:

```tcl
check_design -html check_design.html
sh firefox check_design.html
```

Esse relatório é útil quando há muitos avisos.

---

### 18. Salvar o design antes do compile

Depois de `analyze` + `elaborate`, o design está em GTECH. Salvar nesse ponto é útil:

```tcl
write_file -format ddc -hier -output unmapped/MY_TOP.ddc
```

Motivo:

- evita reler e reelaborar RTL grande;
- permite trocar constraints e repetir síntese;
- cria um checkpoint pré-compile.

Depois, em uma nova rodada:

```tcl
remove_design -designs
read_ddc unmapped/MY_TOP.ddc
current_design MY_TOP
```

Isso carrega a representação já elaborada.

---

### 19. Salvar o design depois do compile

Depois da síntese:

```tcl
compile_ultra
```

é comum salvar:

```tcl
write_file -f verilog -hier -out mapped/MY_TOP_nl.v
write_file -f ddc     -hier -out mapped/MY_TOP.ddc
write_icc2_files      -out mapped/MY_TOP_icc2
```

Cada saída tem função:

- `MY_TOP_nl.v`: netlist Verilog mapeada;
- `MY_TOP.ddc`: checkpoint para DC NXT;
- `MY_TOP_icc2`: pacote de dados para ICC II.

O `.ddc` não é o formato principal para o ICC II. Para o fluxo físico, usa-se o pacote apropriado gerado pelo DC NXT.

---

### 20. RTL → GTECH → mapped gates

A transformação central é:

```text
RTL source
   ↓ analyze + elaborate
unmapped GTECH
   ↓ compile_ultra
technology-specific mapped gates
```

Um `always_ff` vira primeiro uma célula sequencial genérica, como `SEQGEN`, e depois vira um flip-flop real da tecnologia, como `DFFRX1_LVT`.

Uma soma `+` vira primeiro uma operação aritmética genérica, como `ADD_UNS_OP`, e depois vira portas reais ou células mais complexas da biblioteca.

Isso ajuda a entender por que o fluxo salva dois tipos de `.ddc`:

- `unmapped/MY_TOP.ddc`: design em GTECH, antes do compile;
- `mapped/MY_TOP.ddc`: design mapeado, depois do compile.

---

## Conceitos difíceis explicados em profundidade

### `target_library`

`target_library` é a biblioteca usada para **mapeamento tecnológico**. Ela define o conjunto de células reais disponíveis para implementar a lógica.

Exemplo:

```tcl
set_app_var target_library libs/20nm_wc.db
```

Durante `compile_ultra`, a ferramenta escolhe células dessa biblioteca tentando satisfazer:

- função lógica;
- timing;
- área;
- max capacitance;
- max transition;
- outras restrições lógicas.

Erro comum: achar que `target_library` resolve todos os módulos instanciados. Não resolve. Para referência instanciada e IP, o conceito central é `link_library`.

---

### `link_library`

`link_library` serve para resolver referências. Ela é usada quando o design instancia algo que precisa ser encontrado.

Exemplo correto:

```tcl
set_app_var link_library "* $target_library libs/IP.db libs/RAMs.db"
```

O `*` significa: procure nos designs já carregados na memória do DC NXT.

Sem o `*`, submódulos RTL já lidos podem não ser encontrados corretamente.

Erro comum: colocar apenas a biblioteca alvo:

```tcl
set_app_var link_library "$target_library"
```

Isso pode falhar se o design instancia macros, RAMs ou IPs que estão em outras bibliotecas.

---

### `search_path`

`search_path` é uma lista de diretórios.

Exemplo recomendado:

```tcl
set_app_var search_path "$search_path cons rtl libs"
```

Erro comum:

```tcl
set_app_var search_path "cons rtl libs"
```

Esse comando sobrescreve a lista anterior. Se a lista anterior continha caminhos internos da instalação Synopsys, você pode quebrar o acesso a bibliotecas genéricas.

Regra prática:

```text
Para adicionar diretórios, preserve $search_path.
```

---

### `set_app_var` versus `set`

`set` é comando Tcl genérico. `set_app_var` é comando da ferramenta para variáveis de aplicação.

Prefira:

```tcl
set_app_var target_library libs/20nm_wc.db
```

Evite:

```tcl
set target_library libs/20nm_wc.db
```

O motivo é segurança. `set_app_var` ajuda a detectar nomes inválidos de variáveis de aplicação. `set` pode aceitar um erro de digitação como uma variável Tcl comum, causando um bug silencioso no setup.

---

### `analyze`

`analyze` lê arquivos RTL e faz análise sintática. Ele não finaliza a hierarquia do top por si só.

Exemplo:

```tcl
analyze -format verilog TOP.v
```

Com filelist:

```tcl
analyze -vcs "-f risc_design.vcs"
```

Ele gera arquivos intermediários. Por isso é recomendável definir:

```tcl
define_design_lib WORK -path ./work
```

---

### `elaborate`

`elaborate` constrói o design a partir do top.

Exemplo:

```tcl
elaborate MY_TOP
```

Ele:

- monta a hierarquia;
- aplica parâmetros;
- cria GTECH;
- define `current_design`;
- faz link implícito.

Se parâmetros forem usados:

```tcl
elaborate MY_TOP -parameters "A_WIDTH=8, B_WIDTH=16"
```

o nome do design pode ser alterado para refletir a parametrização.

---

### `current_design`

`current_design` é o design ativo no DC NXT. Muitos comandos atuam nele implicitamente.

Depois de:

```tcl
elaborate MY_TOP
```

a ferramenta define:

```text
Current design is now 'MY_TOP'
```

Depois de carregar um `.ddc`, é boa prática definir explicitamente:

```tcl
current_design MY_TOP
```

Isso evita que comandos posteriores atuem em um design errado.

---

### `link`

`link` conecta referências. Ele verifica se módulos, macros e células instanciadas foram encontrados.

Boa prática:

```tcl
if {![link] == 0} {
  exit
}
```

O objetivo é parar o fluxo se houver erro de link.

---

### `check_design`

`check_design` é uma checagem estrutural.

Exemplo:

```tcl
check_design
```

Relatório HTML:

```tcl
check_design -html check_design.html
sh firefox check_design.html
```

Ele deve ser rodado após `elaborate` e `link`, antes de constraints e compile.

---

### `.ddc`

`.ddc` é o formato interno Synopsys para salvar o estado de um design no DC NXT.

Antes do compile:

```tcl
write_file -format ddc -hier -output unmapped/MY_TOP.ddc
```

Depois do compile:

```tcl
write_file -format ddc -hier -output mapped/MY_TOP.ddc
```

O primeiro salva GTECH/unmapped. O segundo salva o design mapeado.

---

### `compile_ultra`

`compile_ultra` é o comando que otimiza e mapeia o design.

Ele transforma:

```text
GTECH/unmapped
```

em:

```text
mapped gate-level netlist
```

Usa principalmente:

- `target_library`;
- constraints de timing;
- DRCs lógicos;
- informações físicas/topográficas, quando em modo topographical/physical synthesis.

Nesta parte A, o foco está no setup lógico e no fluxo até o design mapeado. Os requisitos físicos completos entram na parte B.

---

## Figuras, diagramas e waveforms importantes

### Figura da célula `.lib` com porta OR

A figura da porta OR mostra que uma célula de biblioteca lógica contém função e caracterização. As curvas ao lado representam como atraso e transição dependem de carga de saída e transição de entrada.

Estudo recomendado da figura:

- identificar `cell`;
- identificar `pin`;
- identificar `function`;
- identificar tabelas de timing;
- separar o que é lógico/elétrico do que é físico.

A pegadinha é não confundir biblioteca lógica `.db` com biblioteca física. A `.db` lógica não contém localização física de pinos nem geometria real da célula.

---

### Diagrama de `link_library`

A figura mostra `link_library = "* your_library.db"`.

O ponto mais importante é o `*`. Ele representa designs carregados na memória da ferramenta. A ferramenta não procura apenas nas bibliotecas externas; ela procura primeiro nos designs já analisados.

Isso explica o quiz em que a resposta correta é False quando a frase diz que `link_library` resolve tudo olhando apenas nas bibliotecas listadas.

---

### Diagrama de `search_path`

A figura mostra que o `search_path` padrão inclui:

```text
.
<install_dir>/libraries/syn
<install_dir>/dw/sim_ver
<install_dir>/dw/syn_ver
```

O ponto de prova é: não sobrescrever. Acrescentar.

Correto:

```tcl
set_app_var search_path "$search_path mapped libs cons"
```

Risco:

```tcl
set_app_var search_path "mapped libs cons"
```

---

### Diagrama dos arquivos de inicialização

A figura mostra três níveis de `.synopsys_dc.setup`:

```text
$SYNOPSYS/admin/setup/.synopsys_dc.setup
~/.synopsys_dc.setup
./.synopsys_dc.setup
```

A interpretação correta é que esses arquivos são executados automaticamente na inicialização e em ordem. O arquivo da instalação não deve ser alterado.

---

### Diagrama do fluxo RTL para gate

O slide final da parte didática mostra:

```text
RTL → unmapped GTECH → mapped gates
```

Essa é uma das figuras mais importantes do bloco. Ela conecta:

- `analyze + elaborate`: tradução para GTECH;
- `compile_ultra`: mapeamento tecnológico.

A figura também ajuda a entender os checkpoints:

- antes do compile: salvar em `unmapped/`;
- depois do compile: salvar em `mapped/`.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Para que serve `target_library`?**  
   Serve para selecionar células específicas da tecnologia durante o `compile_ultra`.

2. **Para que serve `link_library`?**  
   Serve para resolver referências instanciadas no design, procurando primeiro na memória do DC NXT via `*` e depois nas bibliotecas listadas.

3. **Para que serve `search_path`?**  
   Serve para indicar os diretórios onde o DC NXT procura arquivos.

4. **Por que não sobrescrever `search_path`?**  
   Porque o valor padrão inclui diretórios importantes das bibliotecas genéricas do DC NXT, como `gtech.db` e `standard.sldb`.

5. **O que são `gtech.db` e `standard.sldb`?**  
   Bibliotecas genéricas fornecidas pelo DC NXT para representar RTL antes do mapeamento tecnológico.

6. **`target_library` precisa ser reaplicada sempre que um novo design é lido na mesma sessão?**  
   Não, se a sessão continua e as mesmas bibliotecas são usadas. Ela é global na sessão.

7. **As variáveis de aplicação são persistentes?**  
   Não. Precisam ser reaplicadas ao iniciar nova sessão.

8. **Qual a vantagem de `set_app_var` sobre `set`?**  
   `set_app_var` valida variáveis de aplicação e ajuda a detectar erros de digitação.

9. **O que `analyze` faz?**  
   Analisa sintaxe RTL e cria arquivos intermediários.

10. **O que `elaborate` faz?**  
    Constrói o design top, monta hierarquia, aplica parâmetros, cria GTECH e define `current_design`.

11. **Por que rodar `link` depois de `elaborate`?**  
    Porque `elaborate` faz link implícito, mas pode não abortar um batch em erro; `link` explícito permite tratar erro.

12. **Por que rodar `check_design`?**  
    Para detectar problemas de conectividade e hierarquia antes da síntese.

13. **Por que salvar `.ddc` antes do compile?**  
    Para preservar o design GTECH/unmapped e evitar reler RTL se só constraints mudarem.

14. **O `.ddc` pós-compile pode ser lido pelo ICC II?**  
    Não como formato principal. O slide afirma que `.ddc` pode ser lido pelo DC NXT, mas não pelo ICC II.

15. **O que NÃO está contido em uma definição de célula `.db` lógica?**  
    Footprint físico, DRCs físicos e localização física dos pinos.

---

### Pegadinhas do bloco

- `target_library` e `link_library` não são a mesma coisa.
- O `*` em `link_library` é essencial.
- `search_path` deve ser estendido, não sobrescrito.
- `set_app_var` é mais seguro que `set`.
- `.db` lógico não é biblioteca física.
- GTECH não é netlist mapeada.
- `elaborate` não substitui a boa prática de rodar `link` e `check_design`.
- `.ddc` pode representar tanto design unmapped quanto mapped, dependendo do momento em que foi salvo.
- Ler `.ddc` pode ser mais rápido que reler RTL, mas só é seguro se o RTL não mudou.

---

## Relação com projeto/laboratório

Esta aula é diretamente ligada aos scripts que aparecem em fluxos reais de síntese. Em um laboratório ou projeto, é comum encontrar arquivos como:

```text
dc_setup.tcl
common_setup.tcl
dc.tcl
constraints.tcl
filelist.vcs
```

Um fluxo típico pode ter:

```tcl
source dc_setup.tcl
define_design_lib WORK -path ./work
analyze -vcs "-f filelist.vcs"
elaborate TOP
if {![link] == 0} { exit }
check_design
write_file -format ddc -hier -output unmapped/TOP.ddc
source constraints.tcl
compile_ultra
write_file -format verilog -hier -output mapped/TOP_nl.v
write_file -format ddc -hier -output mapped/TOP.ddc
```

Para entender ou depurar esse tipo de script, os conceitos desta aula são fundamentais.

Se o laboratório der erro, as causas comuns serão:

- biblioteca `.db` não encontrada;
- `search_path` errado;
- `link_library` sem `*`;
- IP ou RAM não incluído em `link_library`;
- top passado errado para `elaborate`;
- parâmetros não aplicados corretamente;
- `current_design` errado;
- erro estrutural detectado em `check_design`;
- tentativa de usar `.ddc` antigo depois que o RTL mudou.

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

- **Bloco:** 033
- **Título:** 02 Design Setup for Physical Synthesis - parte B
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis.docx`
- **Processar somente slides:** 26-50
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\02 Design Setup for Physical Synthesis_parte_B.md`
