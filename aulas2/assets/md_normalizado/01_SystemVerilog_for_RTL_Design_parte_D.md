# 01 SystemVerilog for RTL Design — parte D

## Controle do bloco

- **Bloco:** 030
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx`
- **Faixa processada conforme roteiro:** slides/prints **76-96**
- **Ponto de início aplicado:** continuação do fluxo de síntese com parâmetros e wrappers, a partir de `Parameter Synthesis – At Block Level`
- **Ponto de parada aplicado:** `Datapath QoR - Signed Arithmetic`
- **Conteúdo não processado:** slides/prints posteriores a 96, porque o roteiro encerra este arquivo no bloco 030
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_D.md`
- **Próximo bloco recomendado:** 031 — `01 Introduction`, na seção `07 Design Compiler NXT - RTL Synthesis`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: esta parte fecha o arquivo grande **01 SystemVerilog for RTL Design**. Alguns slides iniciais desta parte retomam temas da parte C sobre wrappers, interfaces e parâmetros, mas agora o roteiro os coloca na parte D. Por isso eles foram incorporados aqui de forma consolidada, sem repetir desnecessariamente tudo que já foi explicado.

---

## Resumo executivo

A parte D fecha a aula de **SystemVerilog for RTL Design** com temas muito práticos de síntese e QoR:

```text
síntese bottom-up com parâmetros;
wrappers SystemVerilog;
integração de netlist sintetizada em top-level;
simulação gate-level do bloco sintetizado;
geração de código de instanciação para simulação;
packages SystemVerilog;
restrições de packages em RTL sintetizável;
scripts de Design Compiler para packages;
estilos de código e impacto em QoR;
DesignWare;
QoR simultâneo de timing e área;
aritmética signed em datapath.
```

A primeira parte fecha o assunto de **interfaces + parâmetros + síntese**. O curso mostra que, em fluxo bottom-up, o bloco RTL precisa ser sintetizado com cuidado quando usa:

```text
interfaces;
parâmetros não default;
nomes de módulos modificados;
netlists de bloco integradas em top-level;
simulação gate-level.
```

O padrão apresentado é usar um **wrapper SystemVerilog** para instanciar a interface e o bloco parametrizado, elaborar o wrapper com os parâmetros desejados, descobrir o nome real do design sintetizado e gerar arquivos adequados para simulação gate-level.

Depois, a aula apresenta **packages**. Packages servem para compartilhar entre `module`, `program` e `interface`:

```text
localparams;
type definitions;
tasks;
functions;
sequence/property declarations para simulação;
classes para simulação.
```

Mas, em RTL sintetizável, há restrições importantes:

```text
não declarar net/wire nem var no escopo do package;
tasks e functions no package devem ser automatic;
sequence, property e classes são ignoradas pela síntese;
packages não devem conter processos always, initial ou assign;
packages devem ser autocontidos.
```

A parte final entra em **QoR — Quality of Results**. O curso compara diferentes estilos para implementar a especificação:

```text
rotacionar um vetor de entrada din, k posições à esquerda.
```

São comparados estilos como:

```text
assign;
for loop;
for with break;
while loop;
shift;
case;
DesignWare shifter.
```

A tabela mostra que estilos semanticamente equivalentes podem gerar resultados muito diferentes em:

```text
tempo de execução da síntese;
número de células;
timing WNS;
área;
uso de memória.
```

A grande lição é:

```text
o jeito de escrever RTL influencia diretamente o hardware sintetizado.
```

O bloco fecha com **datapath QoR para aritmética signed**. O curso recomenda aproveitar os recursos `signed` de SystemVerilog em vez de fazer extensão manual de sinal, porque extensão manual pode gerar lógica excessiva. A forma recomendada é deixar a linguagem expressar a intenção signed:

```systemverilog
input  signed [7:0]  a, b;
output signed [15:0] z;

assign z = a * b;
```

---

# 1. Parameter Synthesis — At Block Level

## Slide 76 — Parameter Synthesis at Block Level

O slide retoma o fluxo de síntese bottom-up e verificação gate-level.

Texto do slide:

```text
From bottom-up synthesis and gate-level verification, the block level RTL code synthesis
need to execute the following steps
```

Passos mostrados:

```text
Step 1: Create a SystemVerilog wrapper module for the design
Step 2: Analyze the SystemVerilog RTL and the wrapper modules
Step 3: Elaborate the wrapper module
Step 4: Set current_design to the target design
```

### Tradução

```text
Para síntese bottom-up e verificação gate-level, a síntese do código RTL em nível de bloco
precisa executar os seguintes passos:

1. Criar um módulo wrapper SystemVerilog para o design.
2. Analisar o RTL SystemVerilog e os módulos wrapper.
3. Elaborar o módulo wrapper.
4. Definir current_design para o design alvo.
```

### Interpretação

Esse slide reforça que, quando o bloco é sintetizado isoladamente, especialmente com:

```text
interfaces;
parâmetros;
modports;
nomes modificados pela ferramenta;
```

não basta analisar diretamente o módulo real. É melhor criar um wrapper que instancia corretamente:

```text
a interface;
o bloco;
os parâmetros;
as conexões.
```

O wrapper cria um contexto mais parecido com o ambiente real em que o bloco existe.

---

## Slide 77 — Block Level with Parameter Synthesis Example

O slide mostra o exemplo com `fifo`.

Módulo original:

```systemverilog
module fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n, fifo_io.fifo fifo_if);
```

### Step 1 — wrapper

```systemverilog
module wrapper_fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n);

  fifo_io #(WIDTH) fifo_if();

  fifo #(WIDTH, BUF_SIZE) fifo_inst(.*);

endmodule
```

### Steps 2, 3 e 4 — script de síntese

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv wrapper_fifo.sv }
elaborate wrapper_fifo -parameter "WIDTH=4, BUF_SIZE=8"
current_design [get_designs fifo*]
```

O slide destaca:

```text
Elaborate wrapper
```

e também:

```text
Wildcard is required!
Because of the modified module name
```

A saída gate-level mostrada aparece com nome modificado:

```systemverilog
module fifo_WIDTH4_BUF_SIZE8_I_fifo_if_fifo_io__4 (
  clk,
  reset_n,
  \fifo_if.rd_n,
  \fifo_if.wr_n,
  \fifo_if.empty,
  \fifo_if.full,
  \fifo_if.din,
  \fifo_if.dout
);
```

### Interpretação

Quando o bloco é parametrizado, uma instância com parâmetros não default pode gerar um nome de módulo especializado.

O RTL original chama o módulo de:

```text
fifo
```

Mas a versão elaborada/sintetizada com:

```text
WIDTH=4
BUF_SIZE=8
```

pode virar algo como:

```text
fifo_WIDTH4_BUF_SIZE8...
```

Por isso o script usa wildcard:

```tcl
current_design [get_designs fifo*]
```

em vez de:

```tcl
current_design fifo
```

### Por que o wrapper é útil?

O wrapper instancia:

```systemverilog
fifo_io #(WIDTH) fifo_if();
fifo #(WIDTH, BUF_SIZE) fifo_inst(.*);
```

Isso garante que:

```text
a interface existe;
os parâmetros foram aplicados;
as conexões são elaboradas;
o nome real do design pode ser descoberto.
```

Sem wrapper, a ferramenta pode não ter contexto suficiente ou pode gerar nomes/conexões difíceis de usar na próxima etapa.

---

## Slide 78 — Integrating Synthesized Block Level Netlist at Top Level

O slide mostra como integrar uma netlist sintetizada em nível de bloco no top-level.

Passos:

```text
Step T1: Read the complete RTL design with analyze command
Step T2: Elaborate the top-level design
Step T3: Remove the low-level RTL design
Step T4: Replace with with the synthesized version
```

Script mostrado:

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv top.sv ... }
elaborate top
remove_design [get_designs fifo*]
read_ddc fifo_mapped.ddc
```

### Tradução

```text
T1: Ler o design RTL completo com o comando analyze.
T2: Elaborar o design top-level.
T3: Remover o design RTL de baixo nível.
T4: Substituir pela versão sintetizada.
```

### Interpretação

Este é o fluxo de integração bottom-up.

A ideia é:

1. O top-level é elaborado com a hierarquia RTL completa.
2. O bloco que já foi sintetizado separadamente é removido.
3. A versão mapeada/sintetizada desse bloco é lida no ambiente.

O comando:

```tcl
read_ddc fifo_mapped.ddc
```

lê a versão sintetizada salva em DDC.

### Por que remover o RTL antes?

Se o ambiente mantém o RTL do `fifo` e depois lê a versão sintetizada, pode haver:

```text
conflito de nomes;
duas definições do mesmo design;
ambiguidade de hierarquia;
uso acidental da versão errada.
```

Por isso o fluxo remove:

```tcl
remove_design [get_designs fifo*]
```

e só então lê:

```tcl
read_ddc fifo_mapped.ddc
```

---

## Slide 79 — Simulating at Gate Level for the Synthesized Block

O slide mostra os passos extras para simulação gate-level.

Texto:

```text
Follow the 6 block level synthesis steps shown previously
```

Depois:

```text
Add the following steps:
Step 7: Set current design to wrapper
Step 8: Get design via instance name
Step 9: Write out a new wrapper file for the design
```

### Interpretação

Depois de sintetizar o bloco, a simulação gate-level pode precisar de um wrapper atualizado.

Por quê?

Porque a ferramenta pode ter mudado:

```text
nome do módulo;
lista de portas;
nomes dos sinais vindos de interface;
parâmetros especializados;
hierarquia interna.
```

Então, para simular a netlist, é preciso descobrir o nome real da versão sintetizada e gerar um wrapper que instancie corretamente esse design.

---

## Slide 80 — Generating Module Instantiation Code for Simulation

O slide mostra um script Tcl para gerar arquivos de simulação.

Trecho mostrado:

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv wrapper_fifo.sv }
elaborate wrapper_fifo -parameter "WIDTH=4, BUF_SIZE=8"
current_design [get_designs fifo*]

# synthesize design
write_file -format ddc -output mapped/fifo_mapped.ddc
```

Depois, para gerar arquivos de simulação:

```tcl
proc get_design_from_inst { inst } {
  return [get_attribute [get_cells $inst] ref_name]
}

current_design [get_designs wrapper_fifo*]
set dut [get_design_from_inst fifo_inst]
```

### Interpretação

A função:

```tcl
get_design_from_inst
```

recebe uma instância e retorna o `ref_name`, isto é, o nome real do módulo/design que aquela instância referencia.

No wrapper:

```systemverilog
fifo #(WIDTH, BUF_SIZE) fifo_inst(.*);
```

a instância se chama:

```text
fifo_inst
```

Mas o design real pode ter sido renomeado para:

```text
fifo_WIDTH4_BUF_SIZE8...
```

Então:

```tcl
set dut [get_design_from_inst fifo_inst]
```

descobre o nome real do DUT.

### Por que isso importa?

Para gerar um wrapper de simulação gate-level, o script precisa instanciar o nome correto do módulo sintetizado. Se usar `fifo` quando o nome real é `fifo_WIDTH4_BUF_SIZE8...`, a simulação não encontra o módulo.

---

# 2. SystemVerilog Packages

## Slide 81 — SystemVerilog Packages

O slide define packages:

```text
Packages are a mechanism for sharing among module, program and interface the following:
```

Itens:

```text
Parameters (can only be localparam)
Type definitions
Tasks & functions
Sequence and property declarations // simulation
Classes // simulation
```

Exemplo de package:

```systemverilog
package pkg16;
  localparam WIDTH = 16;
  typedef int unsigned uint;

  task automatic my_task(...);
    ...
  endtask

  function automatic bit f(...);
    ...
  endfunction
endpackage
```

### Interpretação

`package` é usado para compartilhar declarações comuns entre vários blocos.

Exemplos de uso:

```text
larguras comuns;
tipos typedef;
enums;
structs;
funções auxiliares;
tasks;
parâmetros locais;
declarações de properties/assertions para simulação;
classes de testbench.
```

Em vez de duplicar em vários arquivos:

```systemverilog
typedef enum logic [1:0] {IDLE, BUSY, DONE} state_t;
```

você pode colocar em um package e importar onde precisar.

---

## Slides 82 e 83 — Importando package no escopo correto

O slide acrescenta:

```text
import package into appropriate scope
```

Duas formas:

```systemverilog
pkg16::WIDTH;
```

e:

```systemverilog
import pkg16::*;
```

### Uso explícito

```systemverilog
pkg16::WIDTH
```

Esse estilo acessa diretamente um item específico do package.

Exemplo:

```systemverilog
logic [pkg16::WIDTH-1:0] data;
```

Vantagem:

```text
fica claro de onde veio WIDTH;
evita poluição do namespace;
reduz risco de conflito de nomes.
```

### Import implícito/global do conteúdo

```systemverilog
import pkg16::*;
```

Isso importa todo o conteúdo do package para o escopo atual.

Depois, você pode escrever:

```systemverilog
logic [WIDTH-1:0] data;
```

Vantagem:

```text
código fica mais curto.
```

Risco:

```text
conflito de nomes;
origem menos explícita;
dificuldade em projetos grandes.
```

### Regra prática

Para RTL grande e revisável, o uso explícito costuma ser mais seguro:

```systemverilog
pkg16::WIDTH
```

Para testbench ou arquivos controlados, `import pkg16::*` pode ser conveniente.

---

## Slide 84 — Rules Governing Packages for Synthesis

O slide lista restrições de packages em RTL sintetizável.

Texto:

```text
Restrictions for packages used in RTL code:
```

Itens:

```text
Net (wire) and variable (var) declarations not allowed at package scope

Functions and tasks inside packages must be automatic

Sequence, property, and classes are ignored

Packages must not contain any processes
  always, initial or assign

Packages must be self contained
```

Depois:

```text
Analyze package with –library switch to store result for reuse

Analyze and elaborate the modules that use the package by adding library directory path to search path
```

### Interpretação

Packages são úteis, mas em síntese não podem virar “um lugar para qualquer coisa”.

#### Não pode declarar net ou variável no escopo do package

Errado em RTL sintetizável:

```systemverilog
package p;
  logic [7:0] value;
endpackage
```

O package deve guardar declarações reutilizáveis, não estado físico global.

#### Tasks e functions devem ser automatic

O slide exige:

```systemverilog
function automatic ...
task automatic ...
```

Isso evita armazenamento estático implícito e torna a função/task mais adequada para uso em síntese.

#### Não colocar processos

Packages não devem conter:

```systemverilog
always
initial
assign
```

Um package não é hardware instanciado; é repositório de declarações.

#### Autocontido

O package deve conter ou importar tudo de que precisa de forma clara. Isso evita dependências implícitas difíceis de controlar no fluxo de síntese.

---

## Slides 85-87 — Using Package & Virtual Class: Script

Os slides mostram uma estrutura de diretórios:

```text
encryptor/
  script/
    run.tcl
  rtl/
    encryptor.sv
  package/
    pkg.sv
  pkg_lib/
    pkg.pvk
```

O script mostrado:

```tcl
# run.tcl
source ./script/common_setup.tcl
source ./script/dc_setup.tcl

define_design_lib pkg_lib -path ./pkg_lib
lappend search_path { ./package ./pkg_lib }

analyze -format sverilog -library pkg_lib { pkg.sv }
analyze -format sverilog { encryptor.sv }
elaborate encryptor; # using package parameter

link
source constraint.tcl
compile

# report qor violations and save output
```

Execução:

```bash
unix% dc_shell -f script/run.tcl | tee -i run.log
```

Os balões explicam:

```text
Setup package library and path
Analyze package (save in library)
Analyze and elaborate RTL
```

### Interpretação

Esse script mostra o fluxo correto para usar package em síntese.

#### 1. Criar biblioteca para package

```tcl
define_design_lib pkg_lib -path ./pkg_lib
```

Isso define uma biblioteca onde o resultado analisado do package será armazenado.

#### 2. Adicionar caminhos de busca

```tcl
lappend search_path { ./package ./pkg_lib }
```

Isso permite que a ferramenta encontre o arquivo do package e a biblioteca compilada.

#### 3. Analisar package com `-library`

```tcl
analyze -format sverilog -library pkg_lib { pkg.sv }
```

O package é analisado e salvo na biblioteca.

#### 4. Analisar RTL

```tcl
analyze -format sverilog { encryptor.sv }
```

Agora o RTL que usa o package pode ser analisado.

#### 5. Elaborar RTL

```tcl
elaborate encryptor
```

O comentário indica:

```text
using package parameter
```

Ou seja, o design usa algum parâmetro ou tipo vindo do package.

### Regra prática

Se o RTL depende de package, o package deve ser analisado antes e estar no search path/biblioteca correta.

---

## Slide 88 — Self-check sobre package no Design Compiler

O self-check pergunta:

```text
What are the issues in Synthesis (with Design Compiler) for the following code?
```

Código:

```systemverilog
package my_pkg;
  localparam WIDTH = 8;
  logic [WIDTH-1:0] value;

  function bit parity(logic[WIDTH-1:0] data);
    return ^(data);
  endfunction
endpackage
```

Opções visíveis:

```text
DC will report an error for localparam WIDTH = 8;
DC will report an error for logic [WIDTH-1:0] value;
DC will report an error for function bit parity(logic[WIDTH-1:0] data);
No errors reported
```

O usuário marcou as duas primeiras opções, mas o feedback mostra:

```text
localparam WIDTH = 8; is legal.
This is how local parameter are created in a package.

logic [WIDTH-1:0] value; is not supported by DC.
This is a tool-specific restriction.
```

### Resposta correta esperada

Pelo slide, a opção correta é:

```text
DC will report an error for logic [WIDTH-1:0] value;
```

Não há erro para:

```systemverilog
localparam WIDTH = 8;
```

porque parâmetros em package são permitidos como `localparam`.

### E a function?

Pelo slide anterior, tasks/functions em packages devem ser `automatic`.

O código mostra:

```systemverilog
function bit parity(...)
```

sem `automatic`.

Entretanto, no self-check visível, a marcação de erro para a função não foi selecionada e o feedback visível destaca apenas que `localparam` é legal e `logic value` não é suportado por DC. Para o banco do curso, priorizar a interpretação do slide:

```text
o erro cobrado aqui é a declaração de variável logic no escopo do package.
```

### Interpretação didática

O package pode conter:

```systemverilog
localparam WIDTH = 8;
```

Mas não deve conter estado/variável como:

```systemverilog
logic [WIDTH-1:0] value;
```

porque isso parece uma variável global de hardware, o que não é aceito no escopo do package para síntese.

A função deveria idealmente ser escrita como:

```systemverilog
function automatic bit parity(logic [WIDTH-1:0] data);
  return ^data;
endfunction
```

---

# 3. Coding Styles e QoR

## Slides 89-90 — Specification: rotate left

A especificação do exemplo:

```text
Rotate an input vector, din, k positions to the left
```

Tradução:

```text
Rotacionar um vetor de entrada, din, k posições para a esquerda.
```

Exemplo:

```text
If the variable k currently is the value 5,
then din must be rotated left by 5 bit positions.
```

Sequência original:

```text
11001011
```

### Interpretação

Rotacionar à esquerda não é o mesmo que apenas deslocar à esquerda.

#### Shift left

No shift, os bits que saem de um lado são descartados e zeros podem entrar do outro lado.

Exemplo:

```text
11001011 << 5 = 01100000
```

#### Rotate left

Na rotação, os bits que saem à esquerda voltam pela direita.

Exemplo com 8 bits e rotação de 5:

```text
original: 11001011
rot left 5: 01111001
```

A aula usa essa especificação para mostrar que diferentes estilos RTL podem implementar a mesma função, mas gerar QoR diferente.

---

## Slide 91 — Coding style: `for loop`

O slide mostra a implementação com `for`.

Código reconstruído:

```systemverilog
always_comb begin
  logic [WIDTH-1:0] tmp = '0;
  value = din;

  for (int i = 0; i < k; i++) begin
    tmp[0] = value[WIDTH-1];
    tmp[WIDTH-1:1] = value[WIDTH-2:0];
    value = tmp;
  end
end

always_ff @(posedge clk) begin
  dout <= value;
end
```

Tabela:

```text
Execution Time: 15.43
Cell Count:     84
Timing (WNS):   -1.58
Area:           221.87
Memory usage:   174 MB
```

### Interpretação

Esse código implementa a rotação executando uma rotação de 1 bit repetidamente `k` vezes.

Do ponto de vista de software, parece natural:

```text
repita k vezes:
  mova o MSB para o LSB;
  desloque o restante;
```

Mas para síntese, o `for` é desenrolado/unrolled ou convertido em lógica combinacional que precisa representar todas as possibilidades de `k`.

Isso pode gerar mais lógica do que uma expressão direta.

A tabela mostra:

```text
mais células;
mais área;
timing menos negativo que alguns estilos, mas custo maior.
```

---

## Slide 92 — Coding style: left shift

O slide mostra uma implementação mais direta com shift e concatenação.

Código:

```systemverilog
always_comb begin
  logic [WIDTH*2-1:0] tmp = '0;

  tmp   = din << k;
  value = tmp[WIDTH-1:0] | tmp[WIDTH*2-1:WIDTH];
end

always_ff @(posedge clk) begin
  dout <= value;
end
```

Tabela:

```text
Execution Time: 11.15
Cell Count:     35
Timing (WNS):   -3.46
Area:           138.76
Memory usage:   173 MB
```

### Interpretação

Aqui o código cria um vetor temporário maior:

```systemverilog
logic [WIDTH*2-1:0] tmp;
```

Depois desloca:

```systemverilog
tmp = din << k;
```

E reconstrói a rotação juntando as partes:

```systemverilog
value = tmp[WIDTH-1:0] | tmp[WIDTH*2-1:WIDTH];
```

Esse estilo expressa melhor a operação como hardware combinacional de deslocamento/rotação.

A tabela mostra resultado melhor em área e células:

```text
84 células no for loop
35 células no shift
```

Área:

```text
221.87 no for loop
138.76 no shift
```

Mas o WNS ficou mais negativo:

```text
-1.58 no for loop
-3.46 no shift
```

Isso mostra tradeoff entre área e timing.

---

## Slide 93 — Summary of Coding Styles

A tabela compara estilos:

```text
Coding Style     Execution Time   Cell Count   Timing (WNS)   Area     Memory Usage
Assign           10.89            35           -3.46          138.76   173 MB
For Loop         15.43            84           -1.58          221.87   174 MB
For with Break   16.05            92           -1.45          228.48   174 MB
While Loop       16.04            92           -1.45          228.48   174 MB
Shift            11.15            35           -3.46          138.76   173 MB
Case             11.32            35           -3.46          138.76   173 MB
```

### Interpretação

A tabela mostra que estilos diferentes podem gerar exatamente a mesma lógica otimizada ou lógicas bem diferentes.

#### Bons resultados em área/células

```text
Assign
Shift
Case
```

Todos:

```text
Cell Count = 35
Area = 138.76
Memory = 173 MB
```

#### Resultados piores em área/células

```text
For Loop
For with Break
While Loop
```

Com:

```text
84 a 92 células
área 221.87 a 228.48
```

#### Timing

Curiosamente, os loops têm WNS menos negativo:

```text
For Loop:       -1.58
For with Break: -1.45
While Loop:     -1.45
```

enquanto assign/shift/case têm:

```text
-3.46
```

Isso mostra que melhor área não significa automaticamente melhor timing.

### Conclusão do slide

A forma de escrever RTL influencia:

```text
hardware inferido;
qualidade da otimização;
tempo de execução;
área;
timing;
memória usada pela ferramenta.
```

---

## Slide 94 — RTL Using DesignWare Component

O slide mostra o uso de componente DesignWare:

```text
DesignWare "shifter"
```

Código:

```systemverilog
// Instance of DW01_bsh
DW01_bsh #(.A_width(WIDTH), .SH_width($clog2(WIDTH)))
bsh ( .A(din), .SH(k), .B(value) );

always_ff @(posedge clk) begin
  dout <= value;
end
```

Para simulação:

```text
-y ${SYNOPSYS}/dw/sim_ver +libext+.v+.sv \
+incdir+${SYNOPSYS}/dw/sim_ver+
```

Para síntese:

```tcl
set_app_var link_library "* $target_library dw_foundation.sldb"
```

Tabela:

```text
Execution Time: 10.85
Cell Count:     35
Timing (WNS):   -3.46
Area:           138.76
Memory usage:   173 MB
```

### Interpretação

DesignWare é uma biblioteca de componentes parametrizáveis da Synopsys.

Aqui, o componente:

```text
DW01_bsh
```

é um barrel shifter.

Em vez de esperar que a ferramenta infera um shifter a partir de RTL genérico, o designer instancia diretamente um componente conhecido.

### Vantagens

```text
controle explícito da implementação;
componentes otimizados;
resultado previsível;
boa integração com síntese Synopsys.
```

### Cuidados

Para simular, é necessário apontar para a biblioteca de simulação DesignWare.

Para sintetizar, é necessário incluir:

```tcl
dw_foundation.sldb
```

no `link_library`.

Se isso não for feito, a ferramenta pode não encontrar o componente.

### QoR

O resultado da tabela é praticamente igual aos melhores estilos anteriores:

```text
35 células
área 138.76
WNS -3.46
```

Isso mostra que a inferência por estilos `assign/shift/case` já conseguiu chegar a uma implementação equivalente ao DesignWare nesse exemplo.

---

## Slide 95 — Can Timing & Area QoR Exist at Same Time?

O slide pergunta:

```text
Can Timing & Area QoR Exist at Same Time?
```

Tema:

```text
Operations inside a for loop
```

Código:

```systemverilog
for (int K = 0; K < 8; K++) begin
  if (K > (A - 1)) begin
    S[K] = 1'b1;
  end
  else begin
    S[K] = 1'b0;
  end
end
```

Balão:

```text
A - 1 has the same fixed value during all iterations of the for loop.
```

Tabela:

```text
Execution Time: 6.37
Cell Count:     32
Timing (WNS):   -0.4
Area:           104.45
Memory usage:   174 MB
```

### Interpretação

Esse slide mostra que é possível, em alguns casos, conseguir bom timing e boa área ao mesmo tempo.

O insight está no balão:

```text
A - 1 tem o mesmo valor fixo durante todas as iterações do loop.
```

Se o código calcula implicitamente `A - 1` em cada iteração, isso pode parecer repetitivo. Mas a ferramenta pode reconhecer que `A - 1` é comum a todas as iterações e otimizar.

O resultado da tabela mostra QoR muito bom:

```text
Cell Count = 32
WNS = -0.4
Area = 104.45
```

Comparado aos exemplos anteriores de rotação:

```text
35 células
WNS -3.46
área 138.76
```

esse exemplo consegue área menor e timing melhor.

### Mensagem

Nem todo `for` é ruim.

O impacto do estilo depende de:

```text
tipo de operação;
dependências dentro do loop;
valores invariantes;
capacidade da ferramenta de otimizar;
forma como o RTL expressa a intenção.
```

---

# 4. Datapath QoR — Signed Arithmetic

## Slide 96 — Datapath QoR - Signed Arithmetic

O slide recomenda:

```text
For signed arithmetic, take advantage of the new signed feature of SystemVerilog
```

Pontos:

```text
Manual sign extension may lead to excess logic
Let the language help you
```

Tradução:

```text
Para aritmética signed, aproveite o novo recurso signed de SystemVerilog.
Extensão manual de sinal pode levar a lógica excessiva.
Deixe a linguagem ajudar você.
```

### Bad QoR

Código ruim:

```systemverilog
input  [7:0]  a, b;
output [15:0] z;

// a, b sign-extended to width of z
assign z = {{8{a[7]}}, a[7:0]} * {{8{b[7]}}, b[7:0]};
// unsigned 16x16=16 bit multiply
```

### Good QoR — usando cast signed

```systemverilog
input  [7:0]  a, b;
output [15:0] z;

logic signed [15:0] z_sgn;

assign z_sgn = signed'(a) * signed'(b);
assign z     = unsigned'(z_sgn);

// signed 8x8=16 bit multiply
```

### Good QoR — declarando portas signed

```systemverilog
input  signed [7:0]  a, b;
output signed [15:0] z;

assign z = a * b;

// signed 8x8=16 bit multiply
```

### Interpretação

A diferença é enorme em termos de hardware inferido.

#### Extensão manual ruim

O código ruim estende `a` e `b` para 16 bits antes de multiplicar:

```systemverilog
{{8{a[7]}}, a[7:0]}
{{8{b[7]}}, b[7:0]}
```

A ferramenta pode inferir:

```text
multiplicação unsigned 16x16
```

mesmo que o resultado final seja 16 bits.

Isso gera hardware maior do que necessário.

#### Usando `signed`

Quando o designer declara ou converte corretamente:

```systemverilog
signed'(a) * signed'(b)
```

a ferramenta entende que a multiplicação é:

```text
signed 8x8 → 16 bits
```

Isso permite uma implementação menor e mais adequada.

### Regra prática

Para aritmética signed:

```systemverilog
input  signed [7:0]  a, b;
output signed [15:0] z;

assign z = a * b;
```

é melhor que fazer extensão manual de sinal sem necessidade.

---

## Aula didática desenvolvida

### 1. Wrappers são uma resposta à diferença entre RTL bonito e netlist real

SystemVerilog permite escrever RTL com abstrações:

```text
interfaces;
modports;
parameters;
packages;
structs;
typedefs.
```

Mas a netlist gate-level precisa ser mais concreta:

```text
portas simples;
nomes específicos;
módulos especializados;
células de biblioteca;
nets.
```

O wrapper faz a ponte entre esses mundos.

Ele permite ao designer manter RTL organizado, mas ainda controlar como o bloco será elaborado e sintetizado.

---

### 2. Por que os nomes mudam na síntese?

Dois motivos principais aparecem nesta aula:

#### Interfaces

A interface:

```systemverilog
fifo_io.fifo fifo_if
```

vira portas como:

```text
fifo_if.rd_n
fifo_if.wr_n
fifo_if.din
```

#### Parâmetros não default

O módulo:

```systemverilog
fifo #(WIDTH=8, BUF_SIZE=16)
```

quando elaborado com:

```text
WIDTH=4
BUF_SIZE=8
```

pode virar:

```text
fifo_WIDTH4_BUF_SIZE8
```

A ferramenta faz isso para representar a especialização concreta daquele módulo parametrizado.

---

### 3. Por que isso cria problema em simulação gate-level?

O testbench ou wrapper de simulação pode tentar instanciar:

```systemverilog
fifo fifo_inst(...);
```

Mas a netlist contém:

```systemverilog
fifo_WIDTH4_BUF_SIZE8 fifo_inst(...);
```

Resultado:

```text
erro de módulo não encontrado;
falha de elaboração;
conexões incompatíveis;
portas com nomes inesperados.
```

Por isso o script descobre o `ref_name` real da instância e gera um wrapper atualizado.

---

### 4. Packages são bons para constantes e tipos, não para estado global

Use package para:

```text
localparams;
typedefs;
enums;
structs;
functions automatic;
tasks automatic.
```

Evite package para:

```text
logic global;
wire global;
always;
initial;
assign;
estado de hardware.
```

O package é como uma biblioteca de definições, não um módulo de hardware.

---

### 5. `localparam` em package

O slide destaca que parâmetros em package só podem ser `localparam`.

Isso significa que eles são constantes locais ao package, não parâmetros configuráveis por instância como em módulos.

Exemplo correto:

```systemverilog
package cfg_pkg;
  localparam int WIDTH = 8;
endpackage
```

Uso:

```systemverilog
logic [cfg_pkg::WIDTH-1:0] data;
```

---

### 6. Funções em packages

Para síntese, o slide exige:

```systemverilog
function automatic
task automatic
```

Exemplo recomendado:

```systemverilog
package math_pkg;
  function automatic bit parity(input logic [7:0] data);
    return ^data;
  endfunction
endpackage
```

O `automatic` evita armazenamento estático compartilhado e torna a função mais segura para uso em diferentes chamadas.

---

### 7. Coding style não é apenas estética

A tabela de estilos mostra que escrever RTL de formas diferentes muda o resultado.

Dois códigos podem ser funcionalmente equivalentes, mas gerar hardware diferente.

Exemplo:

```text
for loop: 84 células, área 221.87
shift:    35 células, área 138.76
```

Isso não é detalhe cosmético. É arquitetura inferida.

---

### 8. Loops em RTL não são loops de software

Em síntese, um `for` normalmente não significa “executar em vários ciclos”, a menos que esteja dentro de uma FSM ou lógica sequencial controlada.

Em `always_comb`, o `for` descreve lógica combinacional repetida/desenrolada.

Exemplo:

```systemverilog
for (int i = 0; i < k; i++)
```

pode criar uma rede combinacional que representa múltiplas possibilidades.

Por isso, loops podem aumentar área ou complexidade.

Mas o slide 95 mostra que loops também podem sintetizar bem quando a operação é simples e há otimização possível.

---

### 9. DesignWare: quando instanciar biblioteca

DesignWare pode ser útil quando:

```text
você quer uma implementação conhecida;
a inferência não está gerando bom QoR;
o operador é complexo;
a biblioteca Synopsys tem componente otimizado;
você quer previsibilidade.
```

Mas exige setup correto:

```text
biblioteca de simulação;
link_library para síntese;
arquivos DesignWare disponíveis.
```

Sem isso, a simulação ou síntese pode falhar.

---

### 10. Signed arithmetic: deixe a linguagem expressar intenção

Se a operação é signed, declare signed.

Ruim:

```systemverilog
assign z = {{8{a[7]}}, a} * {{8{b[7]}}, b};
```

Melhor:

```systemverilog
input signed [7:0] a, b;
output signed [15:0] z;

assign z = a * b;
```

Isso informa diretamente:

```text
os operandos são signed;
a multiplicação é signed;
a largura dos operandos é 8 bits;
o resultado é 16 bits.
```

A ferramenta pode então escolher hardware mais apropriado.

---

## Conceitos difíceis explicados em profundidade

### 1. `current_design`

O comando:

```tcl
current_design [get_designs fifo*]
```

define qual design está ativo para os comandos seguintes.

Se você compilar vários módulos, a ferramenta precisa saber em qual módulo aplicar:

```text
constraints;
compile;
write;
reports;
optimization.
```

Em fluxos parametrizados, o nome exato pode mudar. Por isso aparece `fifo*`.

---

### 2. `ref_name`

No script:

```tcl
return [get_attribute [get_cells $inst] ref_name]
```

`ref_name` é o nome do módulo/design referenciado por uma instância.

Exemplo:

```text
instância: fifo_inst
ref_name: fifo_WIDTH4_BUF_SIZE8
```

A instância mantém o nome local, mas o design referenciado pode ter outro nome.

---

### 3. `analyze`, `elaborate`, `link`, `compile`

No script de package, aparecem os comandos:

```tcl
analyze
elaborate
link
compile
```

Resumo:

```text
analyze   → lê e analisa arquivos HDL;
elaborate → constrói a hierarquia e aplica parâmetros;
link      → resolve referências entre designs e bibliotecas;
compile   → otimiza e mapeia para tecnologia.
```

Essa ordem é central no fluxo Design Compiler.

---

### 4. `search_path` e biblioteca de package

O package precisa ser encontrado pela ferramenta.

Por isso o script faz:

```tcl
lappend search_path { ./package ./pkg_lib }
```

Isso adiciona diretórios onde a ferramenta procurará arquivos e bibliotecas.

Também cria:

```tcl
define_design_lib pkg_lib -path ./pkg_lib
```

para armazenar o resultado analisado do package.

---

### 5. QoR

QoR significa **Quality of Results**.

No curso, QoR aparece como conjunto de métricas:

```text
Execution Time
Cell Count
Timing (WNS)
Area
Memory Usage
```

#### Execution Time

Tempo que a ferramenta levou para processar.

#### Cell Count

Número de células geradas.

#### Timing (WNS)

Worst Negative Slack. Valores negativos indicam violação de timing.

#### Area

Área estimada da lógica.

#### Memory Usage

Memória usada pela ferramenta durante síntese.

---

### 6. WNS

WNS = Worst Negative Slack.

Se WNS é negativo:

```text
há violação de timing.
```

Exemplo:

```text
WNS = -3.46
```

significa que o pior caminho está 3.46 unidades de tempo atrasado em relação ao requisito.

Quanto mais próximo de zero, melhor, se ainda negativo.

No slide 95:

```text
WNS = -0.4
```

é melhor que:

```text
WNS = -3.46
```

---

### 7. Timing e área podem melhorar juntos?

O slide 95 mostra que sim, em alguns casos.

Mas não é garantido.

Depende de:

```text
reconhecimento de subexpressões comuns;
constantes dentro do loop;
estrutura lógica gerada;
capacidade de otimização da ferramenta;
estilo de codificação.
```

O exemplo com `A - 1` mostra que uma expressão invariável no loop pode ser otimizada.

---

### 8. Multiplicação signed: por que extensão manual piora?

Quando você escreve:

```systemverilog
{{8{a[7]}}, a}
```

você cria explicitamente um operando de 16 bits.

Se depois multiplica dois operandos de 16 bits, a ferramenta pode inferir multiplicador 16x16.

Mas se a intenção real era:

```text
dois valores signed de 8 bits gerando resultado de 16 bits
```

o multiplicador correto é 8x8 signed.

A forma `signed` comunica isso melhor.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Quais são os passos iniciais para síntese bottom-up em nível de bloco com parâmetros?**  
   Criar wrapper SystemVerilog, analisar RTL e wrapper, elaborar o wrapper e definir `current_design` para o design alvo.

2. **Por que é necessário usar wrapper em síntese de bloco parametrizado com interface?**  
   Para instanciar a interface e o bloco com parâmetros em um contexto controlado, permitindo elaboração correta.

3. **Por que o comando usa `get_designs fifo*`?**  
   Porque o nome do módulo pode ser modificado pela ferramenta quando parâmetros não default são usados.

4. **Quais são os passos para integrar uma netlist de bloco sintetizado ao top-level?**  
   Ler RTL completo, elaborar top-level, remover o RTL de baixo nível e ler a versão sintetizada com `read_ddc`.

5. **Quais passos extras são adicionados para simulação gate-level do bloco sintetizado?**  
   Definir current design para o wrapper, obter o design pelo nome da instância e escrever novo wrapper para o design.

6. **Para que serve `get_design_from_inst` no script?**  
   Para obter o `ref_name`, ou seja, o nome real do design referenciado por uma instância.

7. **Para que servem packages em SystemVerilog?**  
   Para compartilhar localparams, typedefs, tasks, functions, sequences/properties e classes entre modules, programs e interfaces.

8. **Em packages, parâmetros podem ser de que tipo?**  
   Segundo o slide, somente `localparam`.

9. **Quais declarações não são permitidas no escopo de package para RTL sintetizável?**  
   Net/wire e variable/var declarations.

10. **Tasks e functions dentro de packages devem ser como?**  
    `automatic`.

11. **Packages podem conter `always`, `initial` ou `assign`?**  
    Não.

12. **Como acessar explicitamente um item de package?**  
    Usando escopo, por exemplo `pkg16::WIDTH`.

13. **Como importar todo o conteúdo de um package?**  
    `import pkg16::*;`.

14. **No self-check de package, `localparam WIDTH = 8;` é legal?**  
    Sim.

15. **No self-check de package, `logic [WIDTH-1:0] value;` é aceito pelo DC no escopo do package?**  
    Não. O slide indica que DC reporta erro para essa declaração.

16. **Qual é a especificação do exemplo de coding styles?**  
    Rotacionar o vetor `din` `k` posições à esquerda.

17. **Qual estilo teve 84 células e área 221.87?**  
    `for loop`.

18. **Quais estilos tiveram 35 células e área 138.76 na tabela?**  
    `assign`, `shift` e `case`.

19. **Qual componente DesignWare foi usado?**  
    `DW01_bsh`, um shifter/barrel shifter.

20. **O que precisa ser adicionado para síntese com DesignWare?**  
    `dw_foundation.sldb` no `link_library`.

21. **O que o slide sobre timing e área mostra com o `for` usando `A - 1`?**  
    Que é possível obter bom timing e boa área quando a ferramenta reconhece que `A - 1` é fixo durante todas as iterações.

22. **Qual recomendação do slide para aritmética signed?**  
    Usar o recurso `signed` de SystemVerilog em vez de extensão manual de sinal.

23. **Por que extensão manual de sinal pode ser ruim para QoR?**  
    Pode levar a lógica excessiva, como multiplicador maior do que o necessário.

24. **Qual é a forma recomendada para multiplicação signed 8x8?**  
    Declarar entradas e saída como signed, ou usar casts `signed'(...)`.

### Pegadinhas

- Wrapper não é detalhe opcional em fluxo bottom-up com parâmetros/interfaces; ele pode ser necessário para controlar elaboração.
- Módulos parametrizados podem ter nome modificado.
- Interfaces podem ser achatadas e seus sinais renomeados.
- `read_ddc` substitui a versão RTL por uma versão sintetizada já salva.
- Package não deve conter variáveis globais de hardware.
- `localparam` em package é legal; `logic value` no escopo do package não é suportado pelo DC.
- Tasks/functions em package devem ser `automatic`.
- Um `for` em RTL combinacional não é loop de software executando no tempo; ele vira hardware.
- Estilos diferentes de RTL podem gerar áreas e timings muito diferentes.
- DesignWare precisa de biblioteca de simulação e de síntese configuradas.
- Extensão manual de sinal pode inferir multiplicador maior.
- Declarar `signed` pode melhorar QoR.

### Frases para memorizar

```text
Wrapper controla a elaboração de blocos parametrizados com interfaces.
Parâmetros não default podem mudar o nome do módulo.
Interface em RTL vira portas comuns na netlist.
Packages compartilham tipos, localparams, tasks e functions.
Em package para síntese, não declare wire/var no escopo.
Tasks e functions em packages devem ser automatic.
Coding style altera QoR.
Loops em always_comb viram lógica, não ciclos de software.
DesignWare permite instanciar componentes otimizados da Synopsys.
Para signed arithmetic, deixe SystemVerilog expressar signed.
Extensão manual de sinal pode gerar lógica excessiva.
```

---

## Relação com laboratório/projeto

### Ao sintetizar bloco parametrizado

Use fluxo com wrapper:

```systemverilog
module wrapper_fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n);

  fifo_io #(WIDTH) fifo_if();

  fifo #(WIDTH, BUF_SIZE) fifo_inst(.*);
endmodule
```

E script:

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv wrapper_fifo.sv }
elaborate wrapper_fifo -parameter "WIDTH=4, BUF_SIZE=8"
current_design [get_designs fifo*]
compile
write_file -format ddc -output mapped/fifo_mapped.ddc
```

### Ao integrar bloco no top

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv top.sv ... }
elaborate top
remove_design [get_designs fifo*]
read_ddc fifo_mapped.ddc
```

### Ao usar package

Estrutura recomendada:

```text
project/
  script/
    run.tcl
  rtl/
    encryptor.sv
  package/
    pkg.sv
  pkg_lib/
```

Script básico:

```tcl
define_design_lib pkg_lib -path ./pkg_lib
lappend search_path { ./package ./pkg_lib }

analyze -format sverilog -library pkg_lib { pkg.sv }
analyze -format sverilog { encryptor.sv }
elaborate encryptor
```

### Ao otimizar QoR

Teste estilos diferentes quando o QoR for ruim.

Para operações como rotação:

```text
assign/shift/case podem gerar hardware menor que loop.
DesignWare pode ser uma alternativa controlada.
```

Para signed arithmetic:

```systemverilog
input  signed [7:0]  a, b;
output signed [15:0] z;

assign z = a * b;
```

é preferível a extensão manual desnecessária.

### Checklist prático

- [ ] Bloco parametrizado tem wrapper?
- [ ] Interface foi instanciada no wrapper?
- [ ] Parâmetros não default foram passados no `elaborate`?
- [ ] `current_design` usa wildcard quando nome pode mudar?
- [ ] DDC foi salvo para integração bottom-up?
- [ ] Top-level remove RTL antes de ler DDC mapeado?
- [ ] Wrapper gate-level usa nome real do design sintetizado?
- [ ] Package foi analisado antes do RTL que o usa?
- [ ] Package foi salvo em biblioteca com `-library`?
- [ ] Search path inclui diretório do package e da biblioteca?
- [ ] Package não tem variáveis globais de hardware?
- [ ] Funções/tasks do package são automatic?
- [ ] Estilo RTL foi revisado para QoR?
- [ ] Operações signed usam `signed` nativo?
- [ ] DesignWare está corretamente linkado quando usado?

---

## Necessidade de áudio

**Médio.**

Os prints são suficientes para reconstruir os conceitos principais, mas a fala do professor poderia ajudar em:

- detalhes dos comandos de wrapper e geração de arquivos de simulação;
- interpretação completa do self-check de package, especialmente sobre a função sem `automatic`;
- exemplos adicionais de QoR com `assign`, `case`, `while` e `for with break`;
- explicação do setup de DesignWare no laboratório;
- recomendações práticas sobre quando instanciar DesignWare em vez de confiar na inferência;
- detalhes de signed arithmetic em operações mistas, que parecem continuar em slides posteriores fora do roteiro deste bloco.

Mesmo sem áudio, a parte D fecha adequadamente o conteúdo solicitado pelo roteiro.

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides/prints 76-96.
- [x] Não avancei para os slides posteriores a 96.
- [x] Fluxo de síntese bottom-up com wrapper foi explicado.
- [x] Integração de DDC em top-level foi organizada.
- [x] Geração de wrapper/instanciação para simulação gate-level foi explicada.
- [x] Packages e restrições de síntese foram detalhados.
- [x] Script de package com `define_design_lib`, `search_path` e `analyze -library` foi explicado.
- [x] Self-check de package foi incorporado com justificativa.
- [x] Estilos de codificação e tabela de QoR foram analisados.
- [x] DesignWare foi explicado.
- [x] Signed arithmetic e QoR de datapath foram explicados.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 031 — 01 Introduction**

Nova seção:

```text
07 Design Compiler NXT - RTL Synthesis
```

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\01 Introduction.docx
```

Faixa:

```text
Slides 1-7
```

Salvar como:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\01 Introduction.md
```
