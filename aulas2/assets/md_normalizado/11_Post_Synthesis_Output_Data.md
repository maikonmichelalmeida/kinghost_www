# 11 Post-Synthesis Output Data

## Controle do bloco

- **Bloco:** 049
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\11 Post-Synthesis Output Data.docx`
- **Faixa processada:** slides 1-11
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\11 Post-Synthesis Output Data.md`
- **Próximo bloco recomendado:** 050 — `13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid`
- **Codificação:** UTF-8 com BOM, para reduzir risco de problema de acentuação no Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento, processando a faixa **slides 1-11**.

---

## Resumo executivo

Esta aula fecha o fluxo principal do **Design Compiler NXT - RTL Synthesis** mostrando quais arquivos devem ser gerados depois da síntese para entregar o resultado ao fluxo físico/layout.

Até aqui, o fluxo passou por:

```text
Specify Libraries
Load RTL Code
Load Floorplan
Apply Constraints
Synthesize the Design
Analyze Results
```

Agora o foco é a etapa final:

```text
Write out Netlist with Cell Placement
```

A ideia central é que a saída da síntese não é apenas “um Verilog”. Para o fluxo físico funcionar corretamente, o DC NXT precisa entregar dados como:

- netlist gate-level em Verilog;
- constraints SDC;
- SCAN-DEF;
- informações de floorplan;
- arquivos Tcl/DEF usados pelo IC Compiler II;
- nomes sanitizados para evitar problemas em ferramentas de layout;
- netlist sem `assign` problemático;
- netlist sem caracteres especiais que ferramentas de layout possam interpretar errado;
- preservação de portas estruturadas quando aplicável.

A aula também chama atenção para problemas práticos de compatibilidade: ferramentas de layout, principalmente de terceiros, podem não entender diretivas específicas do DC NXT, `assign statements`, nomes escapados com `\`, declarações `tri` ou portas bit-blasted.

---

## Texto extraído e organizado por slide

### Slide 1 — DC NXT Physical Synthesis Flow

O slide mostra o fluxo de síntese física do DC NXT com destaque na etapa final:

```text
Write out Netlist with Cell Placement
```

No diagrama, as saídas destacadas do DC NXT são:

```text
Standard cell placement
Netlist
```

Interpretação:

- A síntese física não produz somente uma netlist lógica.
- Ela também pode produzir informação de posicionamento de standard cells.
- Essas informações são usadas por ferramentas físicas como o IC Compiler II para continuar o fluxo de implementação.

A etapa atual é a ponte entre o mundo de síntese e o mundo de layout/place-and-route.

---

### Slide 2 — Data Needed for Physical Design or Layout

O slide mostra dois caminhos de geração de dados a partir do DC NXT.

#### Caminho para IC Compiler II

Comando:

```tcl
write_icc2_files \
  -out DESIGN_icc2
```

Esse comando gera um diretório contendo:

```text
Gate-level Verilog netlist file
SDC constraints file
Floorplan DEF and Tcl files
SCAN-DEF file
...
```

Esse pacote é voltado ao fluxo com:

```text
IC Compiler II
```

#### Caminho para ferramenta de layout de terceiro

Comandos individuais:

```tcl
write_file -f verilog ..
write_sdc ..
write_scan_def ..
```

Esses comandos geram arquivos requeridos individualmente:

```text
Gate-level netlist
SDC constraints
SCAN-DEF file
...
```

Esse fluxo é usado quando o layout será feito por:

```text
3rd Party Layout tool
```

Interpretação:

- Se o destino é o IC Compiler II, `write_icc2_files` empacota vários dados necessários.
- Se o destino é uma ferramenta de terceiros, normalmente é preciso escrever cada arquivo individualmente.

---

### Slide 3 — What is SDC?

O slide explica que ferramentas de layout de terceiros não usam ou não entendem diretivas específicas do DC NXT, como:

```tcl
group_path
set_ungroup
set_cost_priority
set_optimize_registers
```

Esses comandos são úteis para a síntese, mas não são constraints físicas/temporais universais para o layout.

Por isso, para ferramentas de layout, deve-se escrever uma versão apenas de constraints:

```tcl
write_sdc <my_design.sdc>
```

O arquivo SDC contém constraints normais com argumentos expandidos, como:

```tcl
create_clock
set_input_delay
set_output_delay
set_false_path
...
```

Interpretação:

- O SDC é uma versão “limpa” das constraints.
- Ele deve conter o que a ferramenta de implementação física precisa para timing.
- Ele não deve depender de diretivas internas de otimização do DC NXT.

---

### Slide 4 — What is SCAN-DEF?

O slide define SCAN-DEF.

Pontos principais:

```text
Contains scan chain information
```

Ou seja, contém informações de cadeias de scan.

Uso:

```text
Used by physical design or layout tools to optimize the grouping and ordering of existing scan chains
```

Tradução:

```text
Usado por ferramentas de physical design ou layout para otimizar o agrupamento e ordenação de cadeias de scan existentes.
```

Formato:

```text
Standard DEF format used by ICC II and other 3rd party layout tools
```

Comando:

```tcl
write_scan_def -out <my_design.def>
```

Interpretação:

- SCAN-DEF não cria o scan por si só.
- Ele descreve informações de scan chain para a etapa física.
- A ferramenta física pode reordenar ou otimizar fisicamente as cadeias de scan para reduzir comprimento, congestionamento e custo de roteamento.

---

### Slide 5 — Problem: Verilog `assign` Statements

O slide apresenta um problema prático:

```text
Layout tools may not be able to handle assign statements in the Verilog netlist.
```

Tradução:

```text
Ferramentas de layout podem não conseguir lidar com comandos assign na netlist Verilog.
```

Solução:

```text
Prevent assign statements in Verilog netlists caused by:
- Multiple port nets
- Verilog tri declarations
```

Interpretação:

- `assign` em RTL é normal.
- Mas em uma netlist gate-level entregue ao layout, certos `assign` podem representar conexões diretas, feed-throughs ou equivalências de nets.
- Algumas ferramentas físicas não aceitam bem esse estilo.
- A netlist final deve preferencialmente representar conexões com células/buffers ou nomes adequadamente resolvidos.

---

### Slide 6 — Multiple Port Nets Cause `assign` Statements

O slide mostra que múltiplas portas ou pinos hierárquicos conectados ao mesmo sinal podem gerar `assign`.

Também podem causar isso:

```text
constant nets
feed-throughs
```

Exemplo de código mostrado:

```verilog
input IN_1, ...
output SUM_1, SUM_2, OUT_1, CONST_1, CONST_2 ...

...

DW01_add U3 (.SUM(SUM_1), .A(n37), .B(n55));

assign SUM_2 = SUM_1;
assign OUT_1 = IN_1;
```

A figura mostra:

- saída `SUM_1` do somador também ligada a `SUM_2`;
- entrada `IN_1` atravessando diretamente para `OUT_1`.

Interpretação:

- `SUM_2 = SUM_1` representa duas portas conectadas ao mesmo sinal.
- `OUT_1 = IN_1` representa feed-through.
- Na netlist, isso pode aparecer como `assign`.
- O problema é que a ferramenta de layout pode não aceitar ou interpretar mal esses assigns.

---

### Slide 7 — Preventing Multiple Port Nets

O slide mostra como evitar `assign` causado por multiple port nets.

Comando:

```tcl
set_fix_multiple_port_nets -all
compile_ultra ...
```

Objetivo:

```text
To ensure that your final netlist does not contain assign statements, separate the multiple port nets during compile.
```

Tradução:

```text
Para garantir que a netlist final não contenha assign statements, separe as multiple port nets durante o compile.
```

A figura mostra buffers sendo inseridos para separar as conexões:

- `SUM_1` e `SUM_2` deixam de ser a mesma net direta.
- `IN_1` e `OUT_1` deixam de ser um feed-through puro.

Interpretação:

- A ferramenta transforma conexões diretas problemáticas em estruturas mais aceitáveis para layout.
- Isso reduz a presença de `assign` na netlist final.
- O comando deve ser aplicado antes de `compile_ultra`.

---

### Slide 8 — Verilog `tri` Declarations Cause `assign` Statements

O slide explica outro motivo para geração de `assign`.

Pontos principais:

```text
DC NXT uses assign statements for tri signals, but not for wire signals.
```

Tradução:

```text
O DC NXT usa assign statements para sinais tri, mas não para sinais wire.
```

Tanto `tri` quanto `wire` podem modelar conexões sem função lógica, mas o tratamento na saída Verilog é diferente.

Solução:

```text
Automatically convert tri declarations to wire declarations before writing out the netlist.
```

Comando:

```tcl
compile_ultra ...
...
set_app_var verilogout_no_tri true
write_file -f verilog -out ...
```

Exemplo conceitual:

```verilog
tri SIG_1, SIG_2;
```

é convertido para:

```verilog
wire SIG_1, SIG_2;
```

Interpretação:

- A variável `verilogout_no_tri` deve ser ativada antes de escrever a netlist.
- Isso evita que declarações `tri` gerem constructs problemáticos para layout.

---

### Slide 9 — Special Characters in Netlists

O slide trata de caracteres especiais em nomes de ports, cells e nets.

Definição do slide:

```text
Special Characters in port, cell and net names:
Anything other than a number, letter, or underscore.
```

Tradução:

```text
Caracteres especiais em nomes de portas, células e nets são qualquer coisa diferente de número, letra ou underscore.
```

Quando o DC NXT escreve uma netlist, ele pode inserir backslashes para escapar caracteres especiais em nomes.

Exemplo:

```verilog
bus[7:0]
```

pode ser expandido para nomes escalares:

```verilog
\bus[7]
\bus[6]
...
```

O slide observa:

```text
The brackets in this case are just part of a scalar net name, not a special character denoting the "slice" of a bus.
```

Outro exemplo:

```text
VHDL multi-dimensional arrays use square brackets as word subscript delimiters:
\reg[0][19]
\reg[0][18]
...
```

Problema:

```text
Layout tools may not recognize DC NXT's "\" escape convention and may therefore misinterpret the special characters.
```

Tradução:

```text
Ferramentas de layout podem não reconhecer a convenção de escape "\" do DC NXT e podem interpretar os caracteres especiais de forma errada.
```

---

### Slide 10 — Special Characters Solution: `change_names`

Solução do slide:

```text
Ensure that the netlist is free of special characters by automatically replacing special characters with non-special ones before writing out the netlist.
```

Comandos mostrados:

```tcl
compile_ultra...
...
set_app_var verilogout_no_tri true
change_names -rules verilog -hier
write_file -f verilog -out ...
write_scan_def ...
write_sdc ...
```

Exemplos de renomeação:

```text
\bus[7]     -> bus_7_
\reg[0][19] -> reg_0__19_
```

Interpretação:

- `change_names -rules verilog -hier` aplica regras de nomes compatíveis com Verilog em toda a hierarquia.
- Remove ou substitui caracteres especiais.
- Deve ser feito antes de escrever a netlist e arquivos associados.
- Ajuda a evitar problemas em ferramentas que não interpretam corretamente nomes escapados.

---

### Slide 11 — Avoiding Bit-Blasted Ports

O slide mostra como evitar bit-blasting de portas em SystemVerilog e VHDL records, sejam eles packed ou unpacked.

Comandos:

```tcl
define_name_rules verilog -preserve_struct_ports

change_names -hierarchy -rules verilog
```

Interpretação:

- Bit-blasting ocorre quando uma porta estruturada é quebrada em muitos sinais escalares individuais.
- Em SystemVerilog, isso pode afetar structs.
- Em VHDL, pode afetar records.
- A regra `-preserve_struct_ports` ajuda a preservar portas estruturadas em vez de expandi-las de forma excessiva.
- Depois, `change_names` aplica as regras de nomeação preservando essas estruturas.

---

## Aula didática desenvolvida

### 1. O que significa “post-synthesis output data”

Depois da síntese, o design precisa sair do DC NXT e entrar no fluxo físico.

Esse “pacote de saída” precisa permitir que a ferramenta física saiba:

```text
quais células existem;
como elas estão conectadas;
quais constraints temporais continuam válidas;
qual informação de scan existe;
qual floorplan ou placement foi produzido;
quais nomes e objetos precisam ser preservados.
```

Por isso, a saída não é apenas:

```text
design.v
```

Ela pode incluir:

```text
design.v
design.sdc
scan.def
floorplan.def
scripts Tcl
diretório ICC2
```

---

### 2. `write_icc2_files` versus arquivos individuais

Se o destino é o **IC Compiler II**, o comando mais integrado é:

```tcl
write_icc2_files -out DESIGN_icc2
```

Ele gera um diretório com vários arquivos que o ICC II espera.

Se o destino é uma ferramenta de layout de terceiro, pode ser necessário gerar tudo separadamente:

```tcl
write_file -f verilog ...
write_sdc ...
write_scan_def ...
```

A diferença é:

```text
ICC II → fluxo integrado Synopsys
3rd party tool → entrega de arquivos padrão separados
```

---

### 3. O que é SDC nesse contexto

SDC significa **Synopsys Design Constraints**.

Mas o ponto do slide é sutil: o arquivo de constraints original usado pelo DC NXT pode conter comandos que são úteis para a síntese, mas inúteis ou desconhecidos para ferramentas físicas externas.

Exemplos:

```tcl
group_path
set_ungroup
set_cost_priority
set_optimize_registers
```

Esses comandos dizem ao DC NXT como otimizar. Eles não são necessariamente úteis para uma ferramenta de layout.

Por isso, usa-se:

```tcl
write_sdc my_design.sdc
```

Esse comando escreve uma versão adequada das constraints normais, como:

```tcl
create_clock
set_input_delay
set_output_delay
set_false_path
```

---

### 4. O que é SCAN-DEF

SCAN-DEF é uma descrição em formato DEF contendo informação de scan chain.

Depois que scan existe, a ferramenta física pode querer reordenar ou agrupar as cadeias para melhorar roteamento.

Exemplo:

```tcl
write_scan_def -out my_design.def
```

A ferramenta física usa isso para entender:

```text
quais flops fazem parte de quais scan chains;
qual a ordem atual;
como otimizar agrupamento e reordenação fisicamente.
```

Isso é importante porque uma ordem ruim de scan pode gerar fios longos e congestionamento.

---

### 5. Por que `assign` em netlist pode ser problema

No RTL, `assign` é normal. Mas na netlist final, ferramentas físicas podem esperar uma estrutura mais explícita de células e conexões.

Exemplo problemático:

```verilog
assign OUT_1 = IN_1;
```

Isso é um feed-through direto.

Outro exemplo:

```verilog
assign SUM_2 = SUM_1;
```

Isso é uma multiple port net.

Algumas ferramentas de layout não lidam bem com isso. Por isso o fluxo tenta remover esses `assign` antes de escrever a netlist final.

---

### 6. `set_fix_multiple_port_nets -all`

Quando múltiplas portas estão na mesma net, a saída Verilog pode precisar de `assign`.

O comando:

```tcl
set_fix_multiple_port_nets -all
```

instrui o DC NXT a separar essas nets durante compile.

Na prática, a ferramenta pode inserir buffers ou células simples para quebrar conexões diretas problemáticas.

Fluxo típico:

```tcl
set_fix_multiple_port_nets -all
compile_ultra
```

Isso ajuda a produzir uma netlist mais compatível com layout.

---

### 7. Por que `tri` vira problema

Sinais `tri` modelam nets tristate. Mas, segundo o slide, o DC NXT usa `assign` para sinais `tri`, enquanto não faz isso para `wire`.

Se o objetivo é evitar `assign`, a solução é converter `tri` para `wire` na saída:

```tcl
set_app_var verilogout_no_tri true
```

Fluxo:

```tcl
compile_ultra
set_app_var verilogout_no_tri true
write_file -f verilog -out ...
```

Isso não muda a intenção lógica sintetizada; é uma adaptação de formato da netlist de saída.

---

### 8. Caracteres especiais em nomes

Nomes com colchetes, barras, pontos ou outros caracteres especiais podem ser válidos quando escapados em Verilog, por exemplo:

```verilog
\bus[7]
```

Mas uma ferramenta de layout pode não entender que o `\` indica nome escapado.

Ela pode interpretar:

```text
bus[7]
```

como uma fatia de barramento, não como uma net escalar chamada `bus[7]`.

Para evitar isso, troca-se o nome por algo simples:

```text
bus_7_
```

---

### 9. `change_names -rules verilog -hier`

O comando:

```tcl
change_names -rules verilog -hier
```

aplica regras de nomeação Verilog em toda a hierarquia.

Ele substitui caracteres especiais por caracteres seguros.

Exemplos:

```text
\bus[7]      vira bus_7_
\reg[0][19]  vira reg_0__19_
```

Esse comando deve ser executado antes de escrever:

```tcl
write_file
write_scan_def
write_sdc
```

A ideia é manter consistência entre netlist, SCAN-DEF e SDC.

---

### 10. Preservar portas estruturadas

SystemVerilog structs e VHDL records podem ser quebrados em múltiplas portas escalares, processo chamado de bit-blasting.

Para evitar isso:

```tcl
define_name_rules verilog -preserve_struct_ports
change_names -hierarchy -rules verilog
```

Isso ajuda a manter a estrutura das portas em vez de transformar tudo em sinais escalares individuais.

Esse ponto é importante em designs modernos que usam tipos mais ricos na interface.

---

## Conceitos difíceis explicados em profundidade

### Gate-level netlist

É a netlist pós-síntese composta por células da biblioteca alvo.

Ela não descreve mais o comportamento em alto nível como RTL. Ela descreve conexões entre gates, flip-flops, buffers, muxes e células especiais.

Comando típico:

```tcl
write_file -f verilog -out design.v
```

---

### SDC

SDC é o arquivo de constraints temporais e de exceções usado pelo fluxo físico.

Ele contém comandos como:

```tcl
create_clock
set_input_delay
set_output_delay
set_false_path
set_multicycle_path
```

Mas não deve depender de comandos puramente diretivos da síntese, como:

```tcl
group_path
set_ungroup
set_cost_priority
```

---

### SCAN-DEF

SCAN-DEF é uma extensão/uso do formato DEF para representar informação de scan.

É importante para que o layout tool otimize fisicamente scan chains.

Comando:

```tcl
write_scan_def -out my_design.def
```

---

### Multiple port nets

Multiple port nets ocorrem quando mais de uma porta ou pino hierárquico se conecta diretamente ao mesmo sinal.

Exemplo:

```verilog
assign SUM_2 = SUM_1;
```

Isso pode parecer simples, mas pode gerar problema para ferramentas físicas.

Solução:

```tcl
set_fix_multiple_port_nets -all
```

---

### Feed-through

Feed-through é quando um sinal entra no bloco e sai diretamente, sem lógica.

Exemplo:

```verilog
assign OUT_1 = IN_1;
```

Isso também pode gerar `assign` na netlist final.

---

### `tri` versus `wire`

`tri` e `wire` podem ser usados para representar conexão sem lógica, mas o DC NXT pode escrever `assign` para `tri`.

Para evitar isso:

```tcl
set_app_var verilogout_no_tri true
```

---

### Nomes escapados em Verilog

Em Verilog, um nome escapado começa com `\`.

Exemplo:

```verilog
\bus[7]
```

Isso significa que `bus[7]` inteiro é o nome escalar, não uma seleção de bit de um barramento.

O problema é que ferramentas externas podem não interpretar essa convenção corretamente.

---

### `change_names`

`change_names` sanitiza nomes.

Exemplo:

```tcl
change_names -rules verilog -hier
```

Ele troca caracteres especiais por nomes mais seguros:

```text
\bus[7] -> bus_7_
```

---

### Bit-blasted ports

Bit-blasting é a quebra de uma porta estruturada em múltiplas portas individuais.

Exemplo conceitual:

```systemverilog
input my_struct_t bus
```

pode virar:

```text
bus_field1_0
bus_field1_1
bus_field2_0
...
```

Para preservar portas estruturadas:

```tcl
define_name_rules verilog -preserve_struct_ports
change_names -hierarchy -rules verilog
```

---

## Figuras e diagramas importantes

### Fluxo físico do DC NXT

O primeiro slide mostra que a etapa final escreve netlist com cell placement. Isso posiciona a aula na saída do fluxo de síntese.

### Data Needed for Physical Design or Layout

Mostra a divisão entre o pacote integrado para ICC II e a geração individual de arquivos para ferramentas de terceiros.

### Multiple Port Nets

A figura do somador mostra `SUM_1` e `SUM_2` conectados ao mesmo resultado e `IN_1` atravessando para `OUT_1`. Isso explica por que surgem `assign statements`.

### Preventing Multiple Port Nets

A figura mostra buffers inseridos para separar múltiplas portas, evitando `assign`.

### Verilog tri

A figura mostra a conversão de:

```verilog
tri SIG_1, SIG_2;
```

para:

```verilog
wire SIG_1, SIG_2;
```

### Special Characters

O slide mostra que nomes como `\bus[7]` e `\reg[0][19]` podem confundir ferramentas externas.

### change_names

Mostra a conversão para nomes seguros:

```text
\bus[7] -> bus_7_
\reg[0][19] -> reg_0__19_
```

---

## Pontos de prova e revisão

1. A etapa final do fluxo é:
   ```text
   Write out Netlist with Cell Placement
   ```
2. Para IC Compiler II, pode-se usar:
   ```tcl
   write_icc2_files -out DESIGN_icc2
   ```
3. `write_icc2_files` gera um diretório com netlist, SDC, floorplan DEF/Tcl, SCAN-DEF e outros arquivos.
4. Para ferramentas de layout de terceiros, normalmente se escrevem arquivos separados:
   ```tcl
   write_file -f verilog
   write_sdc
   write_scan_def
   ```
5. Ferramentas de layout de terceiros podem não entender diretivas específicas do DC NXT, como:
   ```tcl
   group_path
   set_ungroup
   set_cost_priority
   set_optimize_registers
   ```
6. Para gerar um SDC limpo:
   ```tcl
   write_sdc <my_design.sdc>
   ```
7. SCAN-DEF contém informações de scan chain.
8. SCAN-DEF é usado por ferramentas físicas para otimizar agrupamento e ordenação de scan chains.
9. Para escrever SCAN-DEF:
   ```tcl
   write_scan_def -out <my_design.def>
   ```
10. `assign statements` em netlists Verilog podem não ser aceitos por ferramentas de layout.
11. Multiple port nets podem causar `assign`.
12. Feed-throughs podem causar `assign`.
13. Para prevenir multiple port nets:
    ```tcl
    set_fix_multiple_port_nets -all
    compile_ultra
    ```
14. Declarações `tri` podem causar `assign`.
15. Para converter `tri` para `wire` na saída:
    ```tcl
    set_app_var verilogout_no_tri true
    ```
16. Caracteres especiais em nomes são qualquer coisa além de número, letra ou underscore.
17. O DC NXT pode escapar nomes com `\`, como:
    ```verilog
    \bus[7]
    ```
18. Ferramentas de layout podem não reconhecer a convenção de escape com `\`.
19. Para remover caracteres especiais:
    ```tcl
    change_names -rules verilog -hier
    ```
20. Para preservar portas estruturadas e evitar bit-blasting:
    ```tcl
    define_name_rules verilog -preserve_struct_ports
    change_names -hierarchy -rules verilog
    ```

---

## Script consolidado da aula

### Fluxo para IC Compiler II

```tcl
# Depois de compile e análise
write_icc2_files -out DESIGN_icc2
```

Esse diretório pode conter:

```text
gate-level Verilog netlist
SDC constraints
floorplan DEF and Tcl files
SCAN-DEF
```

---

### Fluxo para ferramenta de layout de terceiro

```tcl
write_file -f verilog -out my_design.v
write_sdc my_design.sdc
write_scan_def -out my_design_scan.def
```

---

### Fluxo recomendado para evitar `assign` e nomes problemáticos

```tcl
# Evitar multiple port nets que geram assign
set_fix_multiple_port_nets -all

# Síntese
compile_ultra ...

# Evitar tri na saída Verilog
set_app_var verilogout_no_tri true

# Sanitizar nomes especiais na hierarquia
change_names -rules verilog -hier

# Escrever arquivos de saída
write_file -f verilog -out my_design.v
write_scan_def -out my_design_scan.def
write_sdc my_design.sdc
```

---

### Fluxo preservando portas estruturadas

```tcl
define_name_rules verilog -preserve_struct_ports
change_names -hierarchy -rules verilog
```

---

## Relação com projeto/laboratório

Esta aula é diretamente aplicável ao momento em que você vai entregar a síntese para o back-end.

Em um projeto real, não basta rodar:

```tcl
write_file -f verilog
```

É preciso preparar a netlist para ser consumida pela ferramenta física.

Problemas comuns nessa transição:

```text
netlist com assign;
feed-throughs não resolvidos;
multiple port nets;
tri declarations;
nomes escapados com \;
nomes com colchetes;
portas estruturadas quebradas indevidamente;
SDC com comandos específicos do DC NXT que a ferramenta física não entende.
```

O fluxo correto precisa gerar arquivos compatíveis com o destino:

```text
ICC II → write_icc2_files
ferramenta de terceiro → Verilog + SDC + SCAN-DEF separados
```

Também é importante aplicar as correções antes de escrever os arquivos, para que Verilog, SDC e SCAN-DEF fiquem consistentes entre si.

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides 1-11.
- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 050 — 13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid.docx
```

Faixa:

```text
slides 1-3
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\13 Design Compiler NXT - RTL Synthesis_2021.06_Job Aid.md
```
