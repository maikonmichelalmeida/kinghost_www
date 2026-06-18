# 03 Design Read

## Controle do bloco

- **Bloco:** 053
- **Curso:** 08 Formality Jumpstart
- **Aula:** 03 Design Read
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\03 Design Read.docx`
- **Faixa de slides:** 1-12
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\03 Design Read.md
```

- **Próximo bloco recomendado:** Bloco 054 — `04 Setup for Verification`
- **Arquivo do próximo bloco:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\04 Setup for Verification.docx
```

> Observação de extração: o DOCX contém prints de slides, sem texto pesquisável. O conteúdo abaixo foi extraído visualmente das imagens. Algumas áreas inferiores dos prints aparecem parcialmente cobertas pela barra do player ou por avisos de “Buffering”; quando isso ocorre, o texto foi reconstruído pelo contexto do slide e dos comandos visíveis, sem inventar comandos fora do fluxo apresentado.

---

## Resumo executivo

Esta aula mostra como o **Formality lê os projetos** antes de executar equivalence checking. No fluxo formal, “ler o design” não significa apenas abrir arquivos Verilog ou VHDL. Significa colocar cada versão do projeto dentro de um **container**, carregar bibliotecas necessárias, elaborar a hierarquia com `set_top`, definir qual design é a **referência** e qual é a **implementação**, e preparar o ambiente para as etapas seguintes de `match` e `verify`.

O ponto central é a separação entre dois mundos:

- **Reference design**, normalmente o RTL considerado correto.
- **Implementation design**, normalmente a netlist sintetizada ou transformada pelo Design Compiler.

O Formality precisa ler esses dois mundos separadamente para depois provar que os compare points de ambos são equivalentes. Por isso aparecem opções como `-r`, `-i` e `-container`, além das variáveis internas `$ref` e `$impl`.

A aula também apresenta como carregar bibliotecas Verilog, VHDL, `.db`, DDC, DesignWare e UPF; como usar leitura em estilo VCS com `-vcs`; como salvar/restaurar containers; e como salvar/restaurar uma sessão de depuração.

---

## Texto extraído e organizado por slide

### Slide 1 — Read Commands

**Texto extraído**

Formality input formats:

- Verilog (synthesizable subset) — `read_verilog`
- VHDL (synthesizable subset) — `read_vhdl`
- SystemVerilog (synthesizable subset) — `read_sverilog`
- Synopsys Milkyway — `read_milkyway`
- Synopsys binary files — `read_db`, `read_ddc`
- UPF Files — `load_upf`

Designs are read into containers:

```tcl
-r                       ;# default reference container
-i                       ;# default implementation container
-container containerID   ;# other container name
```

Link top-level of design by using the `set_top` command:

- Load all required designs and libraries before running the `set_top` command.
- Elaborate each container before loading subsequent containers.

**Leitura didática**

Esse slide define a entrada do Formality. Ele aceita RTL sintetizável em Verilog, VHDL e SystemVerilog, formatos binários Synopsys e dados de baixo consumo em UPF. O detalhe mais importante é que o Formality não lê tudo em uma pilha única. Ele lê cada design em um **container**, isto é, um espaço separado de armazenamento interno.

O container `-r` é o container padrão da referência. O container `-i` é o container padrão da implementação. Quando o fluxo exige mais do que dois designs ou nomes específicos, usa-se `-container containerID`.

O comando `set_top` vem depois da leitura dos arquivos. Ele elabora a hierarquia, resolve instâncias, identifica o módulo de topo e prepara o design para as próximas etapas.

---

### Slide 2 — Reading in Libraries: Verilog Simulation Libraries e Design Libraries

**Texto extraído**

Verilog Simulation Libraries:

- Use the `-vcs` option of the `read_verilog` command.
- Example:

```tcl
read_verilog -i top.vg -vcs "-y ./lib +libext+.v"
```

Design Libraries:

- Use:

```tcl
read_verilog -tech design.v
```

or:

```tcl
read_vhdl -tech design.vhd
```

- Subsequent containers will have access to this library.
- Use the `-r` or `-i` options to place library only within the specified containers.

**Leitura didática**

O Formality pode precisar de bibliotecas para resolver módulos instanciados no design. Uma biblioteca pode ser carregada de forma parecida com uma simulação Verilog, usando opções estilo VCS, ou como biblioteca de tecnologia/design com `-tech`.

A diferença prática:

- `-vcs` é útil quando o projeto usa a mesma estrutura de busca de arquivos usada em simulação.
- `-tech` indica que aquele arquivo representa uma biblioteca de tecnologia ou biblioteca de design, não necessariamente o RTL principal.
- Se a biblioteca for carregada sem `-r` ou `-i`, ela pode ficar disponível para containers posteriores.
- Se for carregada com `-r` ou `-i`, fica restrita ao container especificado.

---

### Slide 3 — Reading in Libraries: Synopsys Binary Libraries e DesignWare

**Texto extraído**

Synopsys binary libraries (`.db` file format libraries):

- Use the `read_db` command.
- Example:

```tcl
read_db lsi_10k.db
```

- Shared technology libraries.
- Subsequent containers will have access to this library.
- Use the `-r` or `-i` options to place the library in the reference or implementation containers.

Instantiated DesignWare components:

- Set the `hdlin_dwroot` variable to the top-level of Design Compiler software tree.

Note:

- Pure RTL does not require any component library.

**Leitura didática**

Arquivos `.db` são bibliotecas binárias da Synopsys. Em síntese, eles descrevem células de tecnologia, células especiais, funções mapeadas, timing e informações necessárias para interpretar uma netlist. No Formality, são necessários principalmente para a **implementation netlist**, porque essa netlist já pode estar mapeada para células de biblioteca.

O slide também menciona DesignWare. Quando o RTL ou a netlist instancia componentes DesignWare, o Formality precisa saber onde encontrar esses modelos. A variável `hdlin_dwroot` aponta para a árvore de instalação do Design Compiler, permitindo que a ferramenta localize esses componentes.

O aviso “pure RTL does not require any component library” é importante: se o arquivo de referência é RTL puro, sem lógica mapeada e sem componentes especiais instanciados, ele normalmente não precisa de biblioteca de tecnologia.

---

### Slide 4 — Linking and Referencing Designs

**Texto extraído**

After reading in the source files, use the `set_top` command to elaborate or link the design and designate the top-level module.

- Using default containers (`r` and `i`), the `set_top` command automatically designates which design is reference or implementation.
- Using non-default container names, specify which container is reference or implementation:

```tcl
set_reference_design
set_implementation_design
```

After `set_top` has been completed:

- The `$ref` Tcl variable specifies the reference design.
- The `$impl` Tcl variable specifies the implementation design.

The syntax of `$ref` and `$impl` is:

```text
ContainerName:/Library/Design
```

Examples:

```text
r:/DESIGN/chip
i:/WORK/alu_0
```

**Leitura didática**

Esse slide conecta os conceitos de container com o conceito de design ativo. Depois de carregar arquivos, o Formality ainda precisa saber qual é o topo. O comando `set_top` elabora o design e cria uma referência interna completa para o topo.

Quando se usa `r` e `i`, o Formality consegue inferir automaticamente:

- `r` → reference design
- `i` → implementation design

Mas se o usuário usar containers personalizados, essa associação deixa de ser óbvia. Nesse caso entram `set_reference_design` e `set_implementation_design`.

As variáveis `$ref` e `$impl` são atalhos Tcl internos. Elas apontam para os designs já elaborados. A sintaxe `ContainerName:/Library/Design` mostra a localização interna do design dentro do banco do Formality.

---

### Slide 5 — Reference Design

**Texto extraído**

Comandos exibidos:

```tcl
fm_shell (setup)> read_verilog -r alu.v
fm_shell (setup)> set_top -auto
```

Explicação do slide:

- The `read_verilog` command loads design into a container.
  - The `-r` option signifies the default reference container.
- This script does not load a technology library into the reference container.
  - The file `alu.v` is pure RTL, no mapped logic.
- The `set_top -auto` command finds and links the top-level module.
  - The `set_top` command uses the current container (`r`).
  - The top-level module found by Formality is `alu`.
  - Since the current container is `r`, Formality automatically sets the `set_reference_design` variable (`$ref`) to:

```text
r:/WORK/alu
```

- `WORK` is the default library name.

**Leitura didática**

Esse é o fluxo mínimo para ler um design de referência RTL. O arquivo `alu.v` é carregado no container `r`. Depois, `set_top -auto` procura automaticamente o módulo de topo.

O ponto mais importante: como o container atual é `r`, o Formality entende que esse design é a referência. Ele cria a variável `$ref` apontando para `r:/WORK/alu`.

A biblioteca `WORK` aqui não é uma biblioteca tecnológica de células. É o nome padrão de biblioteca lógica interna usado para armazenar o design lido.

---

### Slide 6 — Reading and Linking

**Texto extraído**

Exemplo exibido:

```tcl
read_ver -r { controller.v multiplier.v top.v}
...
set_top r:/WORK/top
```

Saída mostrada:

```text
Setting top design to 'r:/WORK/top'
Status: Elaborating design top ...
Warning: Cannot link cell '/WORK/top/add1' to its reference design 'adder'. (FE-LINK-2)
Warning: Cannot link cell '/WORK/top/add2' to its reference design 'adder'. (FE-LINK-2)
Status: Elaborating design controller ...
Error: Unresolved references detected during link. (FM-234)
Error: Failed to set top design to 'r:/WORK/top' (FM-156)
0
```

Correção mostrada:

```tcl
read_ver -r adder.v
```

Saída:

```text
No target library specified, default is WORK
Loading verilog file "../../rtl/adder.v"
1
```

Nova tentativa:

```tcl
set_top r:/WORK/top
```

Saída:

```text
Setting top design to 'r:/WORK/top'
Status: Elaborating design adder ...
Status: Implementing inferred operators...
Top design successfully set to 'r:/WORK/top'
```

**Leitura didática**

Este é um dos slides mais importantes da aula. Ele mostra um erro clássico: tentar executar `set_top` antes de carregar todos os módulos necessários.

O design `top` instancia células ou módulos chamados `add1` e `add2`, cujo módulo de referência é `adder`. Mas o arquivo `adder.v` ainda não foi lido. Por isso o Formality não consegue resolver a hierarquia e gera:

```text
Unresolved references detected during link. (FM-234)
Failed to set top design. (FM-156)
```

Depois de ler `adder.v`, a mesma chamada de `set_top` funciona. Isso reforça a regra do primeiro slide: **carregue todos os arquivos e bibliotecas necessários antes de executar `set_top`**.

---

### Slide 7 — Implementation Design

**Texto extraído**

Comandos exibidos:

```tcl
fm_shell (setup)> read_verilog -i alu.vg
fm_shell (setup)> read_db -i class.db
fm_shell (setup)> set_top alu_0
```

Explicação do slide:

- The `read_verilog` command loads the implementation design.
  - The `-i` option specifies the default implementation container.
- The `read_db` command loads the technology library `class.db`.
  - Because the `-i` option is specified, this library is visible only in the implementation container.
- The `set_top` command links top-level module `alu_0`.
  - The script reads both design and technology library before `set_top`.
  - The `set_top` command uses the current container (`i`).
  - Since the current container is `i`, Formality automatically sets the implementation design variable (`$impl`) to:

```text
i:/WORK/alu_0
```

- `WORK` is the default library name.
- The script specifies that the top-level module is `alu_0`.

**Leitura didática**

Este slide mostra o lado da implementação. Diferente do RTL de referência, a implementação geralmente é uma netlist pós-síntese. Por isso, além de ler `alu.vg`, o fluxo carrega a biblioteca de tecnologia `class.db`.

A biblioteca é carregada com `-i`, ficando visível apenas no container da implementação. Isso evita confundir a referência RTL com células mapeadas de implementação.

Outro ponto importante: o topo da implementação pode ter nome diferente do topo RTL. Aqui, a implementação se chama `alu_0`, não apenas `alu`. Isso pode acontecer por transformações, renomeações ou convenções do fluxo de síntese. O Formality lida com isso desde que os designs sejam lidos, elaborados e associados corretamente.

---

### Slide 8 — Simulation-Style Verilog Read

**Texto extraído**

The `read_verilog` supports VCS style switches.

```tcl
read_verilog -r top.v -vcs "switches"
```

where `switches` include:

```text
-y <directory_name>
```

Search `<directory_name>` for unresolved modules.

```text
-v <file_name>
```

Search `<file_name>` for unresolved modules.

```text
+libext+<extension>
```

Look at files with this extension, typically `.v` or `.h`.

```text
+define+
```

Define values for Verilog parameters.

```text
+incdir <dirname>
```

Directory containing `include files.

```text
-f <file_name>
```

VCS option file supported.

Use the `-vcs` option only once for each container.

**Leitura didática**

Esse slide é muito útil para quem já simula com VCS. Em vez de reescrever toda a estrutura de diretórios e bibliotecas em comandos específicos do Formality, é possível usar opções no estilo VCS dentro do `read_verilog`.

Exemplo:

```tcl
read_verilog -r top.v -vcs "-y ./rtl +libext+.v +incdir+./include"
```

A ideia é permitir que o Formality encontre módulos não resolvidos do mesmo modo que o simulador encontraria.

A pegadinha: o slide diz para usar `-vcs` apenas uma vez por container. Isso significa que o usuário deve agrupar as opções VCS em uma única chamada ou organizar o fluxo de leitura para não duplicar a configuração do container.

---

### Slide 9 — Reading and Writing Containers

**Texto extraído**

Command: `write_container`

- Saves all design information in the current elaborated state, including libraries, to a file.
- Recommended: run the `set_top` command before saving the container.
- Can save without running the `set_top` command using the `-pre_set_top` option.

Command: `read_container`

- Restores a design.

Recommended to save containers before running `match`:

- SVF processing can change the contents of the container.

Complete containers can be used with any version of Formality.

Comandos visíveis no rodapé:

```tcl
fm_shell> write_container -replace -r ref.fsc
fm_shell> read_container -r ref.fsc
```

**Leitura didática**

Containers são estados intermediários salvos do design lido e elaborado. Eles ajudam a não repetir sempre a leitura completa dos arquivos, principalmente quando o design é grande ou quando a fase de debug exige várias rodadas.

O slide recomenda salvar containers antes do `match` porque o processamento do SVF pode alterar o conteúdo do container. Assim, se algo der errado ou se for necessário comparar comportamentos antes/depois da guidance, o usuário tem um ponto de retorno.

A opção `-pre_set_top` permite salvar antes da elaboração, mas o fluxo recomendado é salvar depois de `set_top`, quando o design já está em um estado mais completo e resolvido.

---

### Slide 10 — Loading Low Power Data

**Texto extraído**

Use the `load_upf` command after running the `set_top` command.

Example script for RTL and UPF versus Post-DC-netlist + UPF:

```tcl
read_db {low_power_library.db special_lp_cells.db}
read_verilog -r { top.v block1.v block2.v block3.v }
set_top r:/WORK/top
load_upf -r top.upf

read_verilog -i { post_dc_netlist.v } ; set_top i:/WORK/top
load_upf -i top_post_dc.upf
```

- Formality modifies the reference or implementation design to meet the specification implied by the UPF commands.
- UPF commands cannot be issued interactively.

**Leitura didática**

O UPF descreve intenção de potência: domínios de alimentação, power states, isolamento, retention, level shifters e outras estratégias de low power. No Formality, o UPF não é apenas “anotação externa”. Ele pode modificar a interpretação do design para que a verificação considere corretamente a intenção de potência.

O slide enfatiza que `load_upf` deve ser usado depois de `set_top`. Isso faz sentido porque o UPF normalmente se aplica à hierarquia do design. Sem o topo elaborado, a ferramenta não tem contexto suficiente para aplicar corretamente os comandos de power intent.

A comparação mostrada é:

- RTL + `top.upf`
- Netlist pós-Design Compiler + `top_post_dc.upf`

Ou seja, o Formality vai provar equivalência considerando também a transformação de baixo consumo.

---

### Slide 11 — Loading Low Power Data: reforço do fluxo

**Texto extraído**

O conteúdo repete o mesmo fluxo do slide anterior, reforçando:

```tcl
read_db {low_power_library.db special_lp_cells.db}
read_verilog -r { top.v block1.v block2.v block3.v }
set_top r:/WORK/top
load_upf -r top.upf

read_verilog -i { post_dc_netlist.v } ; set_top i:/WORK/top
load_upf -i top_post_dc.upf
```

Pontos reforçados:

- Use `load_upf` after running the `set_top` command.
- Formality modifies the reference or implementation design to meet the specification implied by the UPF commands.
- UPF commands cannot be issued interactively.

**Leitura didática**

Como o print repete o slide de baixo consumo, ele deve ser estudado como reforço: **UPF entra depois do design estar linkado**. A ordem importa.

Um erro comum seria tentar carregar UPF antes de `set_top` ou tentar digitar comandos UPF um por um interativamente dentro do Formality. O slide deixa claro que o fluxo correto é carregar o arquivo UPF com `load_upf`.

---

### Slide 12 — Save and Restore Session

**Texto extraído**

Use after verification to save the current state of Formality.

- Commonly used to debug failing verification in a separate Formality run.
- Saved sessions are not portable across Formality releases.

Comandos:

```tcl
fm_shell> save_session -replace mysession_file
fm_shell> restore_session mysession_file.fss
```

**Leitura didática**

Salvar sessão é diferente de salvar container.

- **Container** salva o design lido/elaborado.
- **Session** salva o estado mais amplo da ferramenta, normalmente depois da verificação.

A sessão é útil quando a verificação falha e o usuário quer abrir outra execução, talvez com GUI, para depurar sem repetir todo o fluxo. Porém, o slide avisa que sessões salvas não são portáveis entre versões do Formality. Isso é importante em ambientes Synopsys, porque versões diferentes podem ter bancos internos incompatíveis.

---

## Aula didática desenvolvida

### 1. O que significa “Design Read” no Formality

No contexto do Formality, a etapa de **Design Read** é a etapa em que a ferramenta recebe os arquivos do projeto e constrói uma representação interna comparável. Essa representação precisa conter:

- a hierarquia do design;
- os módulos ou entidades;
- as bibliotecas necessárias;
- a distinção entre referência e implementação;
- o topo de cada design;
- eventuais dados adicionais, como UPF.

Essa etapa é crítica porque a verificação formal só pode começar se a ferramenta entender corretamente os dois lados da comparação. Se o Formality não consegue resolver um módulo, uma célula, um componente DesignWare ou uma biblioteca, ele nem chega corretamente à etapa de `match`.

A sequência mental correta é:

```text
Ler arquivos → carregar bibliotecas → elaborar/linkar com set_top → definir reference/implementation → match → verify → debug se necessário
```

O erro de muitos iniciantes é achar que `read_verilog` já basta. Não basta. Ele apenas carrega arquivos em um container. A elaboração real acontece com `set_top`.

---

### 2. Reference design versus implementation design

O Formality compara dois designs:

```text
Reference Design  ── equivalência? ── Implementation Design
```

Normalmente:

- **Reference design** = RTL original, considerado correto.
- **Implementation design** = netlist sintetizada, otimizada, mapeada ou transformada.

No fluxo Synopsys típico:

```text
RTL → Design Compiler → Gate-level netlist
```

O Formality verifica se:

```text
RTL original == netlist resultante da síntese
```

Essa verificação não depende de vetores de teste. Ela tenta provar matematicamente que os compare points correspondentes possuem comportamento equivalente.

Mas para isso funcionar, o Formality precisa saber qual lado é referência e qual lado é implementação. O slide mostra três formas de controlar isso:

```tcl
-r
-i
-container containerID
```

A opção `-r` envia o conteúdo para o container padrão de referência. A opção `-i` envia o conteúdo para o container padrão de implementação. A opção `-container` permite criar containers com nomes personalizados.

---

### 3. Containers: o espaço interno onde o Formality organiza os designs

Um container é como uma área separada dentro do Formality. Ele pode conter:

- arquivos RTL;
- netlists;
- bibliotecas;
- design elaborado;
- estado interno de link;
- dados necessários para match e verify.

Os containers padrão são:

```text
r → reference container
i → implementation container
```

Exemplo de referência:

```tcl
read_verilog -r alu.v
set_top -auto
```

Exemplo de implementação:

```tcl
read_verilog -i alu.vg
read_db -i class.db
set_top alu_0
```

A separação é importante porque o RTL e a netlist podem precisar de bibliotecas diferentes. O RTL puro pode não precisar de `.db`, enquanto a netlist mapeada precisa de uma biblioteca de tecnologia para que as células sejam entendidas.

---

### 4. Por que `set_top` é obrigatório

O comando `set_top` faz a etapa de elaboração/linking. Ele diz ao Formality:

- qual é o módulo de topo;
- como resolver as instâncias internas;
- quais módulos pertencem à hierarquia;
- qual design está pronto para comparação.

Sem `set_top`, o Formality pode até ter lido arquivos, mas ainda não tem uma hierarquia completa.

Exemplo correto para RTL puro:

```tcl
read_verilog -r alu.v
set_top -auto
```

Neste caso, `set_top -auto` tenta encontrar automaticamente o topo. Se houver apenas um candidato claro, funciona bem.

Exemplo explícito:

```tcl
set_top r:/WORK/top
```

Aqui o usuário informa exatamente:

```text
container r
biblioteca WORK
design top
```

A sintaxe é:

```text
ContainerName:/Library/Design
```

---

### 5. A regra de ouro: leia tudo antes de `set_top`

O slide “Reading and Linking” mostra uma falha clássica. O usuário leu:

```tcl
read_ver -r { controller.v multiplier.v top.v}
```

Depois tentou:

```tcl
set_top r:/WORK/top
```

Mas o design `top` tinha instâncias dependentes do módulo `adder`, e o arquivo `adder.v` não havia sido carregado. O Formality então gerou avisos de link:

```text
Cannot link cell '/WORK/top/add1' to its reference design 'adder'
Cannot link cell '/WORK/top/add2' to its reference design 'adder'
```

E erros finais:

```text
Unresolved references detected during link. (FM-234)
Failed to set top design to 'r:/WORK/top' (FM-156)
```

A correção foi ler o arquivo faltante:

```tcl
read_ver -r adder.v
```

E repetir:

```tcl
set_top r:/WORK/top
```

A lição é direta:

```text
Se o set_top falha por unresolved reference, quase sempre falta arquivo, biblioteca ou caminho de busca.
```

Esse padrão aparece muito em projetos reais, especialmente quando o design tem vários blocos, IPs, includes, macros ou bibliotecas separadas.

---

### 6. Bibliotecas no Formality

A aula separa vários tipos de bibliotecas.

#### 6.1 Verilog simulation libraries

São bibliotecas usadas de modo semelhante à simulação VCS. Exemplo:

```tcl
read_verilog -i top.vg -vcs "-y ./lib +libext+.v"
```

Isso permite buscar módulos indefinidos dentro de diretórios e arquivos de biblioteca.

#### 6.2 Design libraries com `-tech`

Exemplo:

```tcl
read_verilog -tech design.v
read_vhdl -tech design.vhd
```

Essas bibliotecas podem ficar disponíveis para containers subsequentes, a menos que sejam restringidas com `-r` ou `-i`.

#### 6.3 Synopsys binary libraries `.db`

Exemplo:

```tcl
read_db lsi_10k.db
```

Essas são comuns para netlists mapeadas. Uma netlist pós-síntese instância células como NAND, NOR, flip-flops, buffers, clock gates, isolation cells etc. O Formality precisa saber a funcionalidade dessas células.

#### 6.4 DesignWare

Se o design instancia componentes DesignWare, o Formality precisa localizar esses modelos. O slide mostra a variável:

```tcl
hdlin_dwroot
```

Ela deve apontar para o topo da árvore do Design Compiler. Isso permite resolver componentes DesignWare usados no design.

---

### 7. Leitura em estilo VCS com `-vcs`

O comando `read_verilog` pode aceitar opções no estilo do VCS. Isso é útil porque muitas equipes já têm filelists e opções de simulação funcionando. O Formality pode reaproveitar parte dessa estrutura.

Formato geral:

```tcl
read_verilog -r top.v -vcs "switches"
```

Exemplos de switches:

```text
-y <directory_name>      busca módulos não resolvidos em um diretório
-v <file_name>           busca módulos não resolvidos em um arquivo
+libext+<extension>      define extensões de arquivos de biblioteca
+define+                 define macros/parâmetros Verilog
+incdir <dirname>        diretório de arquivos `include
-f <file_name>           arquivo de opções VCS
```

Exemplo prático:

```tcl
read_verilog -r top.v -vcs "-y ./rtl -y ./lib +libext+.v +incdir+./include -f files.f"
```

Cuidado: o slide diz para usar `-vcs` apenas uma vez por container. Então é melhor consolidar as opções.

---

### 8. `$ref` e `$impl`

Depois de `set_top`, o Formality cria variáveis Tcl que apontam para os designs principais.

```text
$ref  → reference design
$impl → implementation design
```

Elas seguem a sintaxe:

```text
ContainerName:/Library/Design
```

Exemplos:

```text
r:/WORK/alu
i:/WORK/alu_0
```

Essas variáveis são importantes porque comandos posteriores podem usar essas referências sem precisar escrever o caminho completo.

No fluxo com containers padrão:

```tcl
read_verilog -r alu.v
set_top -auto
```

O Formality cria algo como:

```text
$ref = r:/WORK/alu
```

Para a implementação:

```tcl
read_verilog -i alu.vg
read_db -i class.db
set_top alu_0
```

O Formality cria algo como:

```text
$impl = i:/WORK/alu_0
```

---

### 9. Por que a implementação precisa de `.db`

A implementação geralmente é uma netlist como:

```verilog
DFFX1 U1 (.D(n1), .CK(clk), .Q(q));
NAND2X1 U2 (.A(a), .B(b), .Y(n1));
```

Esses nomes `DFFX1`, `NAND2X1` etc. não são operadores Verilog genéricos. Eles são células da biblioteca da tecnologia. Então o Formality precisa de uma descrição funcional dessas células.

Por isso o slide mostra:

```tcl
read_db -i class.db
```

Sem a biblioteca, o Formality poderia não entender a função das células mapeadas, levando a erros de link ou black boxes indesejadas.

---

### 10. `write_container` e `read_container`

Depois que um design foi lido e elaborado, pode ser vantajoso salvá-lo:

```tcl
write_container -replace -r ref.fsc
```

E depois restaurá-lo:

```tcl
read_container -r ref.fsc
```

Isso é útil quando:

- a leitura é demorada;
- há muitas bibliotecas;
- o design é grande;
- você quer preservar o estado antes do `match`;
- você quer comparar efeitos do SVF;
- vai depurar em outra execução.

O slide recomenda salvar containers antes de `match` porque o processamento do SVF pode alterar o conteúdo do container. Essa observação é importante porque o SVF não é só um arquivo passivo: ele pode orientar transformações, match e interpretações internas do Formality.

---

### 11. `save_session` e `restore_session`

Salvar sessão não é a mesma coisa que salvar container.

Container:

```text
salva o design lido/elaborado
```

Session:

```text
salva o estado da ferramenta, especialmente útil após verificação/debug
```

Comandos:

```tcl
save_session -replace mysession_file
restore_session mysession_file.fss
```

Uso típico:

1. Rodar a verificação.
2. Encontrar falha.
3. Salvar sessão.
4. Abrir a sessão em outra execução ou GUI para investigar.

Pegadinha: sessões não são portáveis entre versões do Formality. Então, se a sessão foi criada em uma release, tente restaurá-la na mesma release.

---

### 12. UPF e low power data

O fluxo de UPF mostrado no slide é:

```tcl
read_db {low_power_library.db special_lp_cells.db}
read_verilog -r { top.v block1.v block2.v block3.v }
set_top r:/WORK/top
load_upf -r top.upf

read_verilog -i { post_dc_netlist.v } ; set_top i:/WORK/top
load_upf -i top_post_dc.upf
```

A ordem é essencial:

1. Carregar bibliotecas low power.
2. Ler RTL de referência.
3. Executar `set_top`.
4. Carregar UPF da referência.
5. Ler netlist de implementação.
6. Executar `set_top`.
7. Carregar UPF da implementação.

O slide diz que o Formality modifica o design de referência ou implementação para atender à especificação implícita pelos comandos UPF. Isso significa que o power intent altera a visão lógica que será verificada.

Por isso UPF não deve ser tratado como comentário. Ele afeta a equivalência.

---

## Conceitos difíceis explicados em profundidade

### Containers

Um container no Formality é uma unidade de armazenamento interno para design, bibliotecas e estado de elaboração. Ele evita misturar referência e implementação.

Exemplo:

```tcl
read_verilog -r alu.v
read_verilog -i alu.vg
```

Nesse caso:

```text
alu.v  → container r
alu.vg → container i
```

Erro comum: carregar bibliotecas ou designs no container errado. Se uma biblioteca de implementação for carregada no container de referência por engano, a ferramenta pode interpretar mal o design ou contaminar a comparação.

---

### `read_verilog`, `read_vhdl`, `read_sverilog`

Esses comandos leem HDL sintetizável. O slide especifica “synthesizable subset”, ou seja, o Formality não está interessado em testbench, delays de simulação, classes, randomização, mailboxes ou recursos não sintetizáveis de SystemVerilog.

Exemplo:

```tcl
read_verilog -r alu.v
read_sverilog -r top.sv
read_vhdl -r block.vhd
```

Onde aparece no fluxo:

```text
Design Read
```

Erro comum: tentar ler arquivos de testbench ou SystemVerilog de verificação como se fossem parte do design sintetizável.

---

### `read_db` e bibliotecas `.db`

O comando `read_db` lê bibliotecas binárias da Synopsys.

Exemplo:

```tcl
read_db -i class.db
```

Por que existe:

A netlist pós-síntese contém células de biblioteca. O Formality precisa saber a função lógica dessas células para provar equivalência.

Onde aparece no fluxo:

```text
Implementation Design Read
```

Erro comum: ler a netlist de implementação sem carregar a biblioteca `.db` correspondente.

---

### `set_top`

O comando `set_top` elabora/linka o design e define o topo.

Exemplos:

```tcl
set_top -auto
set_top alu_0
set_top r:/WORK/top
```

Por que existe:

Ler arquivos não basta. A ferramenta precisa resolver a hierarquia.

Erro comum:

```text
Executar set_top antes de ler todos os módulos necessários.
```

Sintoma:

```text
Unresolved references detected during link. (FM-234)
```

---

### `-vcs`

A opção `-vcs` permite que `read_verilog` use opções de busca no estilo VCS.

Exemplo:

```tcl
read_verilog -r top.v -vcs "-y ./lib +libext+.v +incdir+./include"
```

Por que existe:

Facilita reutilizar o ambiente de simulação para resolver includes, bibliotecas e módulos.

Erro comum:

```text
Usar -vcs várias vezes no mesmo container.
```

---

### `write_container` e `read_container`

`write_container` salva o estado elaborado de um design em arquivo. `read_container` restaura.

Exemplo:

```tcl
write_container -replace -r ref.fsc
read_container -r ref.fsc
```

Por que existe:

Evita repetir leitura e elaboração em designs grandes.

Erro comum:

```text
Confundir container com sessão.
```

Container é sobre o design. Sessão é sobre o estado da ferramenta.

---

### `load_upf`

`load_upf` carrega power intent.

Exemplo:

```tcl
load_upf -r top.upf
load_upf -i top_post_dc.upf
```

Por que existe:

Para verificar equivalência considerando domínios de potência, power states e células especiais.

Erro comum:

```text
Carregar UPF antes de set_top.
```

O slide recomenda explicitamente carregar depois de `set_top`.

---

### `save_session` e `restore_session`

Comandos:

```tcl
save_session -replace mysession_file
restore_session mysession_file.fss
```

Por que existem:

Permitem continuar debug em outro momento ou em outra execução.

Erro comum:

```text
Tentar restaurar sessão em outra release do Formality.
```

O slide afirma que sessões salvas não são portáveis entre releases.

---

## Figuras, diagramas e waveforms importantes

### Página 1 — Mapa de comandos de leitura

A figura textual da página 1 coloca lado a lado formatos e comandos. Ela deve ser memorizada como tabela de associação:

```text
Verilog          → read_verilog
VHDL             → read_vhdl
SystemVerilog    → read_sverilog
Milkyway         → read_milkyway
.db / DDC        → read_db / read_ddc
UPF              → load_upf
```

Esse é um ponto provável de prova porque mistura formatos e comandos.

---

### Página 3 — Exemplo de erro de link por módulo faltante

A imagem da página 3 é essencial. Ela mostra uma tentativa de `set_top` que falha porque `adder.v` não foi lido. Os avisos `FE-LINK-2` indicam que instâncias internas não puderam ser ligadas ao módulo de referência.

Interpretação correta:

```text
O problema não é equivalência funcional ainda.
O problema é leitura/link incompleto.
```

Antes de culpar o Formality ou o SVF, deve-se verificar se todos os arquivos e bibliotecas foram carregados.

---

### Página 4 — Separação entre RTL de referência e netlist de implementação

A imagem da página 4 mostra o script da implementação:

```tcl
read_verilog -i alu.vg
read_db -i class.db
set_top alu_0
```

Ela reforça que a implementação não é lida sozinha. A biblioteca de tecnologia precisa ser lida junto, e antes de `set_top`.

---

### Página 5 e 6 — UPF depois de `set_top`

As imagens de baixo consumo repetem a sequência com `load_upf` depois de `set_top`.

Essa figura deve ser estudada como ordem de execução:

```text
read design → set_top → load_upf
```

A razão técnica é que o UPF se aplica à hierarquia elaborada.

---

## Pontos de prova e revisão

1. **Quais comandos leem os principais formatos?**
   - Verilog: `read_verilog`
   - VHDL: `read_vhdl`
   - SystemVerilog: `read_sverilog`
   - Synopsys binary: `read_db`, `read_ddc`
   - UPF: `load_upf`

2. **O que significa `-r`?**
   - Coloca o design no container padrão de referência.

3. **O que significa `-i`?**
   - Coloca o design no container padrão de implementação.

4. **Quando usar `set_top`?**
   - Depois de carregar todos os arquivos e bibliotecas necessárias.

5. **O que `set_top` faz?**
   - Elabora/linka o design e define o módulo de topo.

6. **O que indica erro `Unresolved references detected during link`?**
   - Geralmente falta arquivo, biblioteca, módulo, IP ou caminho de busca.

7. **Por que a implementação precisa de `read_db`?**
   - Porque a netlist mapeada usa células de tecnologia descritas na biblioteca `.db`.

8. **O que é `$ref`?**
   - Variável Tcl que aponta para o reference design elaborado.

9. **O que é `$impl`?**
   - Variável Tcl que aponta para o implementation design elaborado.

10. **Qual a sintaxe de referência interna de design?**
    - `ContainerName:/Library/Design`

11. **Quando usar `load_upf`?**
    - Depois de `set_top`.

12. **UPF pode ser digitado interativamente no Formality?**
    - Segundo o slide, não. Deve ser carregado via `load_upf`.

13. **Qual a diferença entre container e session?**
    - Container salva o design elaborado; session salva o estado da ferramenta.

14. **Sessões são portáveis entre releases?**
    - Não.

15. **Qual comando gera/restaura container?**
    - `write_container` e `read_container`.

16. **Qual comando salva/restaura sessão?**
    - `save_session` e `restore_session`.

17. **Qual opção permite switches estilo VCS no `read_verilog`?**
    - `-vcs`.

18. **Quantas vezes usar `-vcs` por container?**
    - O slide recomenda usar apenas uma vez por container.

---

## Relação com projeto/laboratório

Esta aula é diretamente aplicável a qualquer lab de Formality. Em um roteiro real, você provavelmente verá uma sequência parecida com:

```tcl
set_svf default.svf

read_verilog -r rtl/top.v
set_top -auto

read_db -i tech.db
read_verilog -i mapped/top.vg
set_top top

match
verify
```

Quando um lab falha logo no início, antes de `match`, geralmente o problema está nesta aula:

- arquivo não lido;
- caminho de include errado;
- biblioteca `.db` faltando;
- `set_top` executado cedo demais;
- top module incorreto;
- container errado;
- componente DesignWare não encontrado;
- UPF carregado fora de ordem.

O conhecimento deste bloco também ajuda a entender scripts Tcl de Formality. Sempre que aparecerem `read_verilog`, `read_db`, `set_top`, `load_upf`, `write_container`, `save_session`, a pergunta deve ser:

```text
A ferramenta já tem todos os arquivos, bibliotecas e hierarquia necessários para comparar referência e implementação?
```

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código e comandos foram preservados e explicados.
- [x] Figuras e prints de comandos foram interpretados.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

- **Próximo bloco:** Bloco 054 — `04 Setup for Verification`
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\04 Setup for Verification.docx
```

- **Salvar próximo Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\04 Setup for Verification.md
```
