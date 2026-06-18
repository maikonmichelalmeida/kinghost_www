# 01 SystemVerilog for RTL Design — parte C

## Controle do bloco

- **Bloco:** 029
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx`
- **Faixa processada conforme roteiro:** slides/prints **51-75**
- **Ponto de início aplicado:** continuação de `union`, logo após o ponto de parada da parte B
- **Ponto de parada aplicado:** `Synthesis Tool Support of SystemVerilog`, com parâmetros não default em interfaces e mudança de nome de módulo
- **Conteúdo não processado neste bloco:** slides/prints **76-96**, reservados para a parte D
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_C.md`
- **Próximo bloco recomendado:** 030 — `01 SystemVerilog for RTL Design - parte D`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: esta parte do DOCX contém alguns slides repetidos ou fragmentados sobre interfaces, porque a captura parece ter sido feita durante a reprodução da aula. O conteúdo foi organizado por conceito para evitar repetição desnecessária, mas mantendo a sequência dos slides 51-75.

---

## Resumo executivo

Esta parte continua a aula de **SystemVerilog for RTL Design** a partir do tema de **union** e avança para três blocos principais:

```text
1. union, arrays packed/unpacked e casts;
2. interfaces e modports;
3. suporte de síntese para interfaces, parâmetros e wrappers.
```

O primeiro tema fecha a discussão de `struct`/`union`. A aula mostra que `union` é um mecanismo parecido com C, onde o mesmo armazenamento pode ser visto por diferentes campos. O slide destaca uma regra importante:

```text
All members must be the same size.
```

Em seguida, aparecem self-checks sobre arrays. O curso reforça uma distinção essencial de SystemVerilog:

```text
colchetes à esquerda do nome  → packed array;
colchetes à direita do nome   → unpacked array.
```

Essa diferença afeta o que pode ser atribuído como um único valor. Um packed array pode ser tratado como vetor contínuo de bits. Já um unpacked array é uma coleção de elementos e, em geral, não pode receber um escalar único diretamente. Para converter explicitamente um unpacked array em um vetor packed, usa-se cast, como:

```systemverilog
value = value_t'(array);
```

Depois, a aula entra em **interfaces**. A ideia é que uma interface encapsula comunicação assim como uma struct encapsula dados. Sem interface, o top-level precisa declarar muitos sinais soltos e conectá-los manualmente entre módulos, o que aumenta a complexidade e o risco de erro. Com interface, os sinais de comunicação são agrupados em um único objeto, que pode ser passado na lista de portas.

O bloco também apresenta **modports**, que definem a direção dos sinais dentro da interface para cada tipo de módulo. Por exemplo:

```text
master vê req/addr/mode/start como output e gnt/rdy como input;
slave vê req/addr/mode/start como input e gnt/rdy como output.
```

Isso melhora checagem de conectividade e expressa melhor a intenção de cada lado da comunicação.

Por fim, a aula mostra uma consequência prática importante no fluxo Synopsys:

```text
a ferramenta de síntese muda a lista de portas quando encontra interfaces.
```

Sinais internos da interface são “achatados” e renomeados na netlist gate-level, por exemplo:

```text
fifo_if.rd_n
fifo_if.wr_n
fifo_if.din
fifo_if.empty
```

Além disso, quando o design usa parâmetros não default, a ferramenta também pode mudar o **nome do módulo sintetizado**, como:

```text
fifo_WIDTH4_BUF_SIZE8
```

Isso cria problemas para integração em top-level e simulação gate-level se o fluxo não for controlado. Por isso os slides introduzem uma estratégia com **wrapper SystemVerilog** para síntese bottom-up e verificação gate-level.

---

## Texto extraído e organizado por slide

### Slide 51 — Unions

O slide apresenta `union` como:

```text
C-like mechanism
```

e destaca:

```text
All members must be the same size
```

Código mostrado:

```systemverilog
typedef union {
  tcp_t          tcp_h;
  udp_t          udp_h;
  logic [63:0]   bits;
  logic [7:0][7:0] bytes;
} union_unpacked_t;
```

Também aparece a versão packed:

```systemverilog
typedef union packed {
  tcp_t          tcp_h;
  udp_t          udp_h;
  logic [63:0]   bits;
  logic [7:0][7:0] bytes;
} union_packed_t;
```

Exemplo de uso:

```systemverilog
union_packed_t ip_h;

ip_h.bits[31:16] = 5;
ip_h.bytes[3:2]  = 5;
```

### Interpretação

`union` permite que o mesmo conjunto de bits seja acessado por nomes ou formatos diferentes.

No exemplo, o mesmo dado pode ser visto como:

```text
tcp_h  → cabeçalho TCP
udp_h  → cabeçalho UDP
bits   → vetor bruto de 64 bits
bytes  → matriz packed de 8 bytes de 8 bits
```

A diferença entre `struct` e `union` é essencial:

```text
struct:
  cada campo tem seu próprio espaço.

union:
  todos os campos compartilham o mesmo espaço.
```

Em uma `union packed`, os membros compartilham a mesma representação de bits. Por isso, se você altera:

```systemverilog
ip_h.bits[31:16]
```

também está alterando o mesmo armazenamento que pode ser lido por:

```systemverilog
ip_h.bytes[3:2]
```

Isso é muito útil quando um pacote, comando ou palavra de controle precisa ser interpretado de várias formas.

### Regra importante: mesmo tamanho

O slide enfatiza:

```text
All members must be the same size.
```

Em `union packed`, isso é especialmente importante porque todos os campos compartilham a mesma região de bits. Se os tamanhos não forem compatíveis, a ferramenta não consegue mapear claramente a sobreposição.

---

### Slide 52 — Self-check: atribuir valor único a unpacked array

O self-check pergunta se o código compila:

```systemverilog
logic my_array[0:7];

my_array = 8'b1;
```

A resposta correta indicada pelo curso é:

```text
No
```

Explicação do slide:

```text
When the [] is specified on the right-hand side of the variable,
the variable declared is an unpacked array.
It is illegal to try to assign the entire unpacked array with a single value.
```

Tradução:

```text
Quando o [] é especificado do lado direito do nome da variável,
a variável declarada é um array unpacked.
É ilegal tentar atribuir um único valor ao array unpacked inteiro.
```

### Interpretação

A declaração:

```systemverilog
logic my_array[0:7];
```

significa:

```text
8 elementos unpacked, cada elemento com 1 bit.
```

Isso não é a mesma coisa que:

```systemverilog
logic [7:0] my_array;
```

No primeiro caso, `my_array` é uma coleção de 8 elementos separados. No segundo, é um vetor packed de 8 bits.

Por isso:

```systemverilog
my_array = 8'b1;
```

não é aceito para o array unpacked inteiro.

Formas corretas seriam atribuir elemento por elemento:

```systemverilog
my_array[0] = 1'b1;
my_array[1] = 1'b0;
```

ou usar uma atribuição compatível com array unpacked, como assignment pattern, dependendo do suporte do fluxo:

```systemverilog
my_array = '{default:1'b0};
```

---

### Slide 53 — Self-check: packed array pode receber valor único

O self-check pergunta se o código compila:

```systemverilog
logic [7:0] my_value;
logic       my_array[8];

my_value = 8'b1;
```

A resposta marcada como **No** foi considerada incorreta. O slide explica:

```text
When the [] is specified on the left-hand side of the variable,
the variable declared is a packed array.
It is perfectly legal to assign the entire packed array with a single value.
```

Tradução:

```text
Quando o [] é especificado do lado esquerdo do nome da variável,
a variável declarada é um array packed.
É perfeitamente legal atribuir o array packed inteiro com um único valor.
```

### Interpretação

A parte relevante é:

```systemverilog
logic [7:0] my_value;
```

Aqui `[7:0]` está antes do nome `my_value`, logo é um vetor packed.

Um vetor packed é tratado como uma palavra de bits contínua.

Por isso:

```systemverilog
my_value = 8'b1;
```

é legal. O valor será preenchido conforme a largura do vetor. Em 8 bits, `8'b1` é equivalente a:

```systemverilog
8'b0000_0001
```

Já:

```systemverilog
logic my_array[8];
```

continua sendo um unpacked array de 8 elementos de 1 bit.

---

### Slide 54 — Self-check: `typedef` de array unpacked e atribuição/cast

O self-check mostra:

```systemverilog
typedef logic [7:0] value_t;
typedef logic       array_t[8];

value_t value;
array_t array;

initial begin
  array = 1;
  value = array;
  $display("value = %0b", value);
end
```

As opções visíveis incluem:

```text
Code doesn't compile because typedef logic array_t[8]; is illegal
Code doesn't compile because array = 1; is illegal
Code doesn't compile because value = array; is illegal
Code compiles and prints 8'b0000_0001
Code compiles and prints 8'b1000_0000
```

O feedback visível corrige pelo menos um ponto:

```text
typedef logic array_t[8]; is legal and is useful for creating a data type
which is an unpacked array.
```

### Interpretação

O ponto principal do slide é que isto é legal:

```systemverilog
typedef logic array_t[8];
```

Esse `typedef` cria um tipo chamado `array_t`, que representa um unpacked array com 8 elementos de 1 bit.

Mas há duas armadilhas no código:

```systemverilog
array = 1;
value = array;
```

A primeira tenta atribuir um escalar a um array unpacked inteiro. Pelo self-check anterior, isso não é permitido nesse estilo.

A segunda tenta atribuir diretamente um array unpacked a um vetor packed sem conversão explícita. Isso não é uma atribuição simples comum entre tipos compatíveis.

O próximo slide mostra a forma correta de popular um elemento e depois fazer cast explícito para `value_t`.

---

### Slide 55 — Self-check: cast explícito de unpacked array para packed vector

O slide mostra:

```systemverilog
typedef logic [7:0] value_t;
typedef logic       array_t[8];

value_t value;
array_t array;

initial begin
  array[0] = 1'b1;
  value = value_t'(array);
  $display("value = %0b", value);
end
```

As opções visíveis incluem:

```text
Code doesn't compile because array[0] = 1'b1; is illegal
Code doesn't compile because value = value_t'(array); is illegal
Code compiles and prints 0000_0001
Code compiles and prints 1000_0000
None of the above
```

O feedback visível diz:

```text
array[0] = 1'b1; is legal. This is how users populate a single entry
of the unpacked array.

value = value_t'(array); is legal. This is how you change data type of a variable inline.
```

### Interpretação

Agora o código está usando duas práticas corretas.

#### 1. Atribuir elemento individual do unpacked array

```systemverilog
array[0] = 1'b1;
```

Isso é legal porque `array[0]` é um elemento de 1 bit.

#### 2. Fazer cast explícito

```systemverilog
value = value_t'(array);
```

Esse é um cast para o tipo `value_t`.

Em SystemVerilog, a forma:

```systemverilog
type'(expression)
```

faz conversão explícita de tipo.

A saída esperada pelo curso, conforme a organização de bits do slide/opções, é:

```text
1000_0000
```

porque o elemento `array[0]` é convertido para o bit mais significativo no vetor resultante nesse contexto de cast/bit-stream.

### Regra prática

Para evitar ambiguidade e bugs:

```text
packed vector  → pode receber valor como palavra de bits;
unpacked array → preencha por elemento ou use assignment pattern/cast explícito.
```

---

### Slide 56 — What Is An Interface?

O slide introduz interface comparando com struct.

Código da struct:

```systemverilog
typedef struct {
  int         i;
  logic [7:0] a;
} s_type_struct;

s_type_struct if1;

if1.a = 10;
```

### Interpretação

A mensagem visual é:

```text
struct agrupa dados relacionados;
interface agrupa sinais de comunicação relacionados.
```

Uma `struct` encapsula campos de dados para que eles sejam acessados por nome:

```systemverilog
if1.a
if1.i
```

Uma `interface` faz algo parecido, mas no domínio de comunicação entre módulos: agrupa sinais que normalmente viajariam juntos.

---

### Slides 57 e 70 — Simple Example Without Interfaces

O slide mostra dois módulos conectados sem interface:

```systemverilog
module memMod(
  input  logic       req,
  input  logic       clk,
  input  logic       start,
  input  logic [1:0] mode,
  input  logic [7:0] addr,
  inout  logic [7:0] data,
  output logic       gnt,
  output logic       rdy
);
  ...
endmodule
```

E:

```systemverilog
module cpuMod(
  input  logic       clk,
  input  logic       gnt,
  input  logic       rdy,
  inout  logic [7:0] data,
  output logic       req,
  output logic       start,
  output logic [7:0] addr,
  output logic [1:0] mode
);
  ...
endmodule
```

O top-level precisa declarar todos os sinais:

```systemverilog
module top;
  logic req, gnt, start, rdy;
  logic clk;
  logic [1:0] mode;
  logic [7:0] addr, data;

  memMod mem(req, clk, start, mode, addr, data, gnt, rdy);
  cpuMod cpu(clk, gnt, rdy, data, req, start, addr, mode);
endmodule
```

O balão do slide destaca:

```text
Complex connectivity
```

### Interpretação

Sem interface, todos os sinais do barramento precisam aparecer:

```text
na declaração de portas do módulo de memória;
na declaração de portas do módulo de CPU;
no top-level;
na instanciação da memória;
na instanciação da CPU.
```

Isso gera muitos riscos:

```text
ordem errada de portas;
sinal conectado invertido;
largura errada;
duplicação de declarações;
manutenção difícil quando o barramento muda.
```

Exemplo de risco:

```systemverilog
memMod mem(req, clk, start, mode, addr, data, gnt, rdy);
cpuMod cpu(clk, gnt, rdy, data, req, start, addr, mode);
```

Como as conexões estão por posição, uma troca de ordem pode criar bug difícil de detectar.

---

### Slides 58, 71 e 72 — Simple Example Using Interfaces

O slide mostra uma interface:

```systemverilog
interface simple_bus();
  logic       req, gnt;
  logic [7:0] addr, data;
  logic [1:0] mode;
  logic       start, rdy;
endinterface
```

Uso no módulo de memória:

```systemverilog
module memMod(simple_bus a, input logic clk);
  logic avail;

  always @(posedge clk)
    a.gnt <= a.req & avail;
endmodule
```

Uso no módulo de CPU:

```systemverilog
module cpuMod(simple_bus b, input logic clk);
  ...
endmodule
```

No top-level:

```systemverilog
module top;
  logic clk;
  simple_bus sb_intf();
endmodule
```

Os balões destacam:

```text
Bundle signals in interface
Use in port list
Refer to signals
```

### Interpretação

A interface agrupa os sinais do barramento:

```text
req
gnt
addr
data
mode
start
rdy
```

Em vez de passar todos os sinais separadamente, o módulo recebe um único objeto de interface:

```systemverilog
simple_bus a
```

Dentro do módulo, os sinais são acessados por seleção hierárquica:

```systemverilog
a.gnt
a.req
a.addr
```

Isso deixa o top-level mais limpo e reduz erros de conectividade.

### Analogia com struct

Assim como:

```systemverilog
if1.a = 10;
```

acessa o campo `a` de uma struct, a interface permite:

```systemverilog
a.gnt <= a.req & avail;
```

acessar os sinais agrupados.

---

### Slides 59 e 73 — Using modports In Interface

O slide mostra `modport` dentro da interface:

```systemverilog
interface simple_bus();
  logic       req, gnt;
  logic [7:0] addr, data;
  logic [1:0] mode;
  logic       start, rdy;

  modport slave (
    input  req, addr, mode, start,
    output gnt, rdy,
    inout  data
  );

  modport master (
    input  gnt, rdy,
    output req, addr, mode, start,
    inout  data
  );
endinterface
```

Uso nos módulos:

```systemverilog
module memMod(input logic clk, simple_bus.slave a);
  ...
endmodule
```

```systemverilog
module cpuMod(input logic clk, simple_bus.master b);
  ...
endmodule
```

Os balões destacam:

```text
Specify signal direction
Enforce modport rules for connectivity error checks
```

### Interpretação

`modport` define como cada módulo enxerga a interface.

A mesma interface física tem sinais compartilhados, mas cada lado da comunicação tem direção diferente.

#### Para o slave/memória

```text
req, addr, mode, start → inputs
gnt, rdy               → outputs
data                   → inout
```

#### Para o master/CPU

```text
gnt, rdy               → inputs
req, addr, mode, start → outputs
data                   → inout
```

Isso é muito útil porque a ferramenta pode detectar erros como:

```text
um módulo master tentando dirigir um sinal que deveria ser input;
um slave tentando ler como output;
conexão incompatível com a direção declarada.
```

### Regra prática

Use interface para agrupar sinais.

Use modport para definir papéis.

```text
interface = pacote de sinais;
modport   = visão/direção desses sinais para cada módulo.
```

---

### Slides 60 e 74 — Synthesis Tool Support of `interface`

O slide mostra que a ferramenta de síntese altera a lista de portas.

Código RTL:

```systemverilog
interface fifo_io #(WIDTH=8) ();
  logic rd_n, wr_n, empty, full;
  logic [WIDTH-1:0] din, dout;

  modport fifo(
    input  rd_n, wr_n, din,
    output empty, full, dout
  );
endinterface

module fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n, fifo_io.fifo fifo_if);
```

Comandos de síntese:

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv }
elaborate fifo # using default parameter values
```

A saída gate-level mostrada é:

```systemverilog
module fifo (
  clk,
  reset_n,
  \fifo_if.rd_n,
  \fifo_if.wr_n,
  \fifo_if.din,
  \fifo_if.empty,
  \fifo_if.full,
  \fifo_if.dout
);
```

O slide destaca:

```text
Interface and other non-integrals are renamed
```

### Interpretação

A interface é uma abstração de RTL/SystemVerilog.

Na netlist gate-level, a ferramenta precisa transformar essa abstração em portas comuns.

Por isso, os sinais internos da interface são achatados e renomeados:

```text
fifo_if.rd_n
fifo_if.wr_n
fifo_if.din
fifo_if.empty
fifo_if.full
fifo_if.dout
```

Como esses nomes têm ponto, aparecem escapados na sintaxe Verilog:

```systemverilog
\fifo_if.rd_n
```

O escape com barra invertida permite que o nome contenha caracteres especiais.

### Consequência prática

Isso afeta:

```text
integração em top-level;
simulação gate-level;
scripts;
conexões por nome;
testbenches;
debug;
comparações RTL vs netlist.
```

O designer precisa saber que a interface bonita do RTL pode virar um conjunto de portas renomeadas na netlist.

---

### Slides 61, 62 e 63 — Parameter Synthesis at Block Level

Os slides mostram os passos para síntese bottom-up em nível de bloco com parâmetros e interface.

Texto consolidado:

```text
From bottom-up synthesis and gate-level verification, the block level RTL code synthesis
needs to execute the following steps.
```

Passos:

```text
Step 1: Create a SystemVerilog wrapper module for the design
Step 2: Analyze the SystemVerilog RTL and the wrapper modules
Step 3: Elaborate the wrapper module
Step 4: Set current_design to the target design
Step 5: Proceed with the synthesis flow
Step 6: Save the design by using the write command
```

### Interpretação

O problema é que interfaces e parâmetros podem complicar a síntese de um bloco isolado.

Para resolver isso, o fluxo usa um **wrapper**.

O wrapper instancia:

```text
a interface;
o design real;
os parâmetros desejados.
```

Assim a ferramenta consegue elaborar o design com a configuração correta.

Fluxo mental:

```text
wrapper_fifo
 ├── fifo_io #(WIDTH) fifo_if()
 └── fifo #(WIDTH, BUF_SIZE) fifo_inst(...)
```

Depois a ferramenta elabora o wrapper e define `current_design` para o bloco alvo real.

---

### Slide 64 — Block Level with Parameter Synthesis Example

O slide mostra o módulo original:

```systemverilog
module fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n, fifo_io.fifo fifo_if);
```

#### Step 1 — Wrapper

```systemverilog
module wrapper_fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n);

  fifo_io #(WIDTH) fifo_if();

  fifo #(WIDTH, BUF_SIZE) fifo_inst(.*);
endmodule
```

#### Steps 2-4 — Comandos

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv wrapper_fifo.sv }
elaborate wrapper_fifo -parameter "WIDTH=4, BUF_SIZE=8"
current_design [get_designs fifo*]
```

O balão destaca:

```text
Elaborate wrapper
```

Outro balão diz:

```text
Wildcard is required!
Because of the modified module name
```

A saída gate-level mostrada tem nome modificado:

```systemverilog
module fifo_WIDTH4_BUF_SIZE8_I_fifo_if_fifo_io_4 (
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

Quando parâmetros não default são usados:

```text
WIDTH=4
BUF_SIZE=8
```

a ferramenta pode especializar o módulo e alterar seu nome para refletir essa configuração.

Por isso o slide usa:

```tcl
current_design [get_designs fifo*]
```

em vez de um nome exato.

O wildcard é necessário porque o nome final pode virar algo como:

```text
fifo_WIDTH4_BUF_SIZE8...
```

### Por que isso importa?

Se você esperava um módulo chamado:

```text
fifo
```

mas a síntese gera:

```text
fifo_WIDTH4_BUF_SIZE8_I_fifo_if_fifo_io_4
```

o top-level, o testbench ou a simulação gate-level podem não encontrar o módulo esperado.

---

### Slide 65 — Integrating Synthesized Block Level Netlist at Top Level

O slide mostra como integrar a netlist sintetizada em nível de bloco ao top-level.

Passos:

```text
Step T1: Read the complete RTL design with analyze command
Step T2: Elaborate the top-level design
Step T3: Remove the low-level RTL design
Step T4: Replace with the synthesized version
```

Comandos mostrados:

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv top.sv ... }
elaborate top
remove_design [get_designs fifo*]
read_ddc fifo_mapped.ddc
```

### Interpretação

Esse fluxo é comum em síntese bottom-up.

A ideia é:

1. Ler e elaborar o top completo em RTL.
2. Remover do ambiente o bloco RTL que já foi sintetizado separadamente.
3. Ler a versão sintetizada desse bloco, por exemplo:

```tcl
read_ddc fifo_mapped.ddc
```

Assim, o top-level passa a usar a versão mapeada/sintetizada do bloco.

### Por que remover o RTL antes?

Se a ferramenta mantém o RTL e também lê a versão sintetizada, pode haver conflito de nomes ou ambiguidade.

Por isso:

```tcl
remove_design [get_designs fifo*]
```

remove a versão antiga antes de ler a versão mapeada.

---

### Slide 66 — Simulating at Gate Level for the Synthesized Block

O slide orienta a simulação gate-level do bloco sintetizado.

Texto:

```text
Follow the 6 block level synthesis steps shown previously.
```

Depois adiciona:

```text
Add the following steps:

Step 7: Set current design to wrapper
Step 8: Get design via instance name
Step 9: Write out a new wrapper file for the design
```

### Interpretação

Depois de sintetizar o bloco, ainda há o problema de simular esse bloco em nível de gates.

Como o nome do módulo pode ter mudado por causa dos parâmetros e da interface, o wrapper original talvez não instancie corretamente o nome final.

Por isso a ferramenta precisa gerar um novo wrapper compatível com o design sintetizado.

---

### Slide 67 — Generating Module Instantiation Code for Simulation

O slide mostra comandos Tcl para gerar código de instanciação para simulação.

Trecho consolidado:

```tcl
# Steps 1:6
analyze -format sverilog { fifo_io.sv fifo.sv wrapper_fifo.sv }
elaborate wrapper_fifo -parameter "WIDTH=4, BUF_SIZE=8"
current_design [get_designs fifo*]

# synthesize design
write_file -format ddc -output mapped/fifo_mapped.ddc

# The following is for generating simulation files
proc get_design_from_inst { inst } {
  return [get_attribute [get_cells $inst] ref_name]
}

current_design [get_designs wrapper_fifo*]
set dut [get_design_from_inst fifo_inst]
```

### Interpretação

A parte nova é:

```tcl
proc get_design_from_inst { inst } {
  return [get_attribute [get_cells $inst] ref_name]
}
```

Essa função pega uma instância e retorna o nome real do design/módulo associado a ela.

Por que isso é necessário?

Porque a instância no wrapper é:

```systemverilog
fifo_inst
```

mas o módulo real referenciado por ela pode ter sido renomeado pela ferramenta devido aos parâmetros:

```text
fifo_WIDTH4_BUF_SIZE8...
```

Então o comando:

```tcl
set dut [get_design_from_inst fifo_inst]
```

descobre o nome real do DUT sintetizado para gerar o wrapper de simulação correto.

---

### Slide 68 — Self-check: interface com `inout` em modport

O self-check pergunta se o código compila:

```systemverilog
interface bus();
  logic [7:0] addr, data;
  logic       rd, wr;

  modport rcvr (
    input addr, rd, wr,
    inout data
  );

  modport drvr (
    output addr, rd, wr,
    inout data
  );
endinterface
```

A resposta marcada como **Yes** foi considerada incorreta.

Feedback visível:

```text
logic declared internal to module and interface defaults to variable.
DC does not allow variables to be used as inout signals.
```

Tradução:

```text
logic declarado internamente a module e interface assume variável por padrão.
O Design Compiler não permite que variáveis sejam usadas como sinais inout.
```

### Interpretação

Dentro de uma interface, `logic` declarado assim:

```systemverilog
logic [7:0] data;
```

é uma variável, não uma net.

Mas `inout` normalmente requer net, porque múltiplos lados podem dirigir o sinal. Para tri-state/inout, a ferramenta espera algo como `wire`.

Correção conceitual:

```systemverilog
interface bus();
  logic [7:0] addr;
  wire  [7:0] data;
  logic       rd, wr;

  modport rcvr (
    input addr, rd, wr,
    inout data
  );

  modport drvr (
    output addr, rd, wr,
    inout data
  );
endinterface
```

O ponto central do curso:

```text
inout em interface precisa ser tratado com cuidado;
em DC, variável logic não deve ser usada como inout.
```

---

### Slide 69 — What Is An Interface? Encapsulamento de comunicação

O slide retoma a definição:

```text
Encapsulates communication like a struct encapsulates data
```

Tradução:

```text
Encapsula comunicação como uma struct encapsula dados.
```

Outro texto do slide:

```text
At the simplest level an interface is to a wire
is similar to what a struct is to a variable
```

O exemplo de interface:

```systemverilog
interface intf();
  logic [2:0] sel;
  logic [7:0] bus;
endinterface
```

Uso:

```systemverilog
intf if1();

modA a(w, if1);

logic val;
assign val = if1.bus[if1.sel];
```

### Interpretação

O slide amplia a analogia:

```text
struct : variável
interface : wire/conjunto de wires
```

Se uma struct agrupa campos de dados, uma interface agrupa sinais de comunicação.

No exemplo:

```systemverilog
if1.bus[if1.sel]
```

a interface contém tanto o barramento quanto o seletor que escolhe um bit do barramento.

Isso mostra que a interface pode conter lógica de agrupamento e sinais relacionados, não apenas um fio simples.

---

### Slide 75 — Synthesis Tool Support of SystemVerilog: parâmetros não default

O slide mostra que o suporte de síntese fica mais complexo quando há parâmetros não default.

Texto:

```text
Gets a lot more complex if using non-default parameter values
```

Módulo original:

```systemverilog
module fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n, fifo_io.fifo fifo_if);
```

Comandos:

```tcl
analyze -format sverilog { fifo_io.sv fifo.sv }
elaborate fifo -parameter "WIDTH=4, BUF_SIZE=8"
```

Saída:

```systemverilog
module fifo_WIDTH4_BUF_SIZE8 (
  clk,
  reset_n,
  \fifo_if.rd_n,
  \fifo_if.wr_n,
  \fifo_if.din,
  \fifo_if.empty,
  \fifo_if.full,
  \fifo_if.dout
);
```

O slide destaca:

```text
Not only:
  Interface and other non-integrals are renamed

The module name also changes!
  This creates problems for block integration and simulation
```

### Interpretação

Este é o fechamento prático do bloco.

A ferramenta não apenas achata a interface em portas individuais. Ela também pode alterar o nome do módulo quando parâmetros são especializados.

Exemplo:

```text
fifo
```

vira:

```text
fifo_WIDTH4_BUF_SIZE8
```

Isso cria problemas porque o restante do fluxo talvez espere o nome original.

Problemas possíveis:

```text
top-level não encontra o módulo;
testbench gate-level instancia o nome errado;
scripts dependem de nome antigo;
Formality/equivalence precisa mapear nomes;
wrappers precisam ser atualizados;
integração bottom-up fica frágil.
```

Por isso os slides anteriores introduziram:

```text
wrapper;
wildcard em get_designs;
get_design_from_inst;
geração de novo wrapper para simulação.
```

---

## Aula didática desenvolvida

### 1. `union`: várias interpretações do mesmo armazenamento

`union` é útil quando os mesmos bits precisam ser vistos de formas diferentes.

Imagine uma palavra de 64 bits que pode representar um pacote:

```text
bits brutos
bytes
cabeçalho TCP
cabeçalho UDP
```

Com `union`, você evita criar várias variáveis e copiar dados entre elas.

Exemplo:

```systemverilog
typedef union packed {
  logic [63:0]     bits;
  logic [7:0][7:0] bytes;
} word64_u;

word64_u w;

w.bits = 64'h1122_3344_5566_7788;
```

Depois você pode acessar:

```systemverilog
w.bytes[0]
w.bytes[1]
```

dependendo da ordem de empacotamento usada no design.

### Cuidado com RTL

`union packed` pode ser útil em RTL para representar múltiplas visões de barramentos. Mas use com disciplina, porque a interpretação dos bits precisa ser clara.

Para testbench, `union` pode ajudar na conversão entre formatos de pacote.

---

### 2. Packed versus unpacked: a regra visual

A regra mais importante desta parte:

```text
antes do nome  → packed
depois do nome → unpacked
```

Exemplo packed:

```systemverilog
logic [7:0] value;
```

Isso é um vetor de 8 bits.

Exemplo unpacked:

```systemverilog
logic array[8];
```

Isso é um array com 8 elementos de 1 bit.

Exemplo misto:

```systemverilog
logic [7:0] mem [256];
```

Isso é:

```text
256 elementos unpacked;
cada elemento é um vetor packed de 8 bits.
```

### Por que isso importa?

Porque packed e unpacked se comportam de forma diferente em atribuições.

Packed:

```systemverilog
logic [7:0] value;
value = 8'hA5;
```

Unpacked:

```systemverilog
logic array[8];
array = 8'hA5; // problema no estilo mostrado pelo curso
```

O array unpacked deve ser tratado por elemento, assignment pattern ou cast explícito.

---

### 3. Cast explícito: `type'(expression)`

O slide mostra:

```systemverilog
value = value_t'(array);
```

Essa sintaxe significa:

```text
converta array para o tipo value_t.
```

É um mecanismo de cast explícito.

Forma geral:

```systemverilog
tipo'(expressao)
```

Exemplos:

```systemverilog
logic [7:0] value;
int i;

value = logic'(i);      // exemplo conceitual
value = value_t'(array);
```

Em RTL, casts ajudam a declarar intenção de largura e formato. Mas devem ser usados com cuidado para não esconder truncamentos ou rearranjos de bits.

---

### 4. Interfaces resolvem complexidade de conectividade

Sem interface, um barramento aparece como vários sinais:

```text
req
gnt
addr
data
mode
start
rdy
```

Cada módulo precisa listar tudo. O top precisa declarar tudo. As instâncias precisam conectar tudo.

Com interface:

```systemverilog
interface simple_bus();
  logic req, gnt;
  logic [7:0] addr, data;
  logic [1:0] mode;
  logic start, rdy;
endinterface
```

O módulo recebe:

```systemverilog
simple_bus a
```

e usa:

```systemverilog
a.req
a.gnt
a.addr
```

Isso reduz o risco de erro e deixa a intenção mais clara.

---

### 5. Interface não é apenas testbench

Um ponto importante do curso é que `interface` pode ser usado em RTL sintetizável, desde que respeite as regras e o suporte da ferramenta.

A interface pode agrupar conexões reais entre blocos.

Porém, o que é sintetizado no final não é uma “interface” abstrata. A ferramenta transforma a interface em portas e nets comuns.

Por isso, a interface melhora o RTL, mas exige atenção no fluxo gate-level.

---

### 6. Modports: definindo papéis

Uma mesma interface pode ser usada por vários módulos com papéis diferentes.

No exemplo:

```text
CPU  → master
Mem  → slave
```

O master dirige:

```text
req, addr, mode, start
```

e recebe:

```text
gnt, rdy
```

O slave recebe:

```text
req, addr, mode, start
```

e dirige:

```text
gnt, rdy
```

`modport` expressa isso no código.

Sem modport, os módulos enxergam a interface inteira de forma menos restrita. Com modport, a ferramenta pode checar conectividade e direção.

---

### 7. `inout` em interface: cuidado com `logic`

O self-check mostra um ponto prático de síntese:

```text
logic dentro de interface é variável;
DC não permite variável como inout.
```

Para `inout`, pense em net:

```systemverilog
wire [7:0] data;
```

em vez de:

```systemverilog
logic [7:0] data;
```

Isso conversa com a aula anterior sobre tri-state:

```text
tri-state/inout precisa de net;
variável procedural não é adequada para múltiplos drivers.
```

---

### 8. A síntese “achata” interfaces

RTL:

```systemverilog
module fifo(input clk, reset_n, fifo_io.fifo fifo_if);
```

Netlist:

```systemverilog
module fifo(
  clk,
  reset_n,
  \fifo_if.rd_n,
  \fifo_if.wr_n,
  \fifo_if.din,
  \fifo_if.empty,
  \fifo_if.full,
  \fifo_if.dout
);
```

A interface vira várias portas.

Isso é esperado.

Mas afeta:

```text
nomes dos sinais;
testbench gate-level;
scripts;
integração;
debug.
```

---

### 9. Parâmetros mudam o nome do módulo

Quando você elabora com parâmetros default:

```tcl
elaborate fifo
```

o módulo pode continuar com nome parecido com `fifo`.

Mas quando usa:

```tcl
elaborate fifo -parameter "WIDTH=4, BUF_SIZE=8"
```

a ferramenta pode gerar um design especializado com nome alterado:

```text
fifo_WIDTH4_BUF_SIZE8
```

Isso é lógico: a versão com `WIDTH=4` e `BUF_SIZE=8` não é exatamente a mesma especialização que a versão default.

Mas isso causa problema em integração se o fluxo espera o nome original.

---

### 10. Por que usar wrapper?

O wrapper ajuda a controlar esse problema.

Ele cria um ambiente em que:

```text
a interface é instanciada;
o módulo parametrizado é instanciado;
os parâmetros são passados explicitamente;
a ferramenta elabora tudo de forma rastreável.
```

Exemplo:

```systemverilog
module wrapper_fifo #(WIDTH=8, BUF_SIZE=16)
  (input clk, reset_n);

  fifo_io #(WIDTH) fifo_if();

  fifo #(WIDTH, BUF_SIZE) fifo_inst(.*);
endmodule
```

A síntese elabora o wrapper, descobre a especialização correta e depois pode selecionar o design alvo.

---

### 11. Fluxo bottom-up com bloco sintetizado

Em projetos grandes, muitas vezes sintetizamos blocos separadamente.

Depois, no top-level, removemos o RTL do bloco e lemos a versão mapeada:

```tcl
remove_design [get_designs fifo*]
read_ddc fifo_mapped.ddc
```

Isso permite que o top use a netlist já sintetizada.

A vantagem é modularidade.

A dificuldade é garantir que nomes, parâmetros e portas batam corretamente.

---

### 12. Simulação gate-level do bloco sintetizado

Para simular a versão sintetizada, talvez seja preciso gerar um wrapper novo.

Por quê?

Porque o nome real do módulo sintetizado pode ter mudado.

O comando:

```tcl
get_attribute [get_cells $inst] ref_name
```

permite descobrir o nome real do design referenciado por uma instância.

Assim, o script pode gerar o wrapper usando o nome correto.

---

## Conceitos difíceis explicados em profundidade

### 1. Bit-stream cast

Quando você faz:

```systemverilog
value_t'(array)
```

SystemVerilog converte a representação de bits de `array` para o tipo `value_t`.

Isso é diferente de atribuição normal.

Ele tenta interpretar a sequência de bits da expressão como o novo tipo.

Isso é útil para conversões entre:

```text
struct packed
array packed
vetores
unpacked arrays compatíveis com bit-stream cast
```

Mas exige cuidado com:

```text
ordem dos bits;
largura total;
truncamento;
extensão;
interpretação signed/unsigned.
```

---

### 2. Interface como encapsulamento de protocolo

Uma interface não deve ser vista apenas como “atalho de fio”.

Ela encapsula um protocolo.

Exemplo:

```text
req/gnt
valid/ready
addr/data
mode/start/rdy
```

Esses sinais só fazem sentido juntos.

Ao agrupá-los, o código passa a representar a comunicação como uma entidade.

Isso reduz inconsistência entre módulos.

---

### 3. Modport não cria outro hardware

`modport` não cria sinais novos.

Ele cria uma **visão** da interface.

A interface tem sinais. O modport define como um módulo pode usar esses sinais.

Exemplo:

```systemverilog
simple_bus.master
simple_bus.slave
```

são visões diferentes da mesma interface.

---

### 4. Por que a netlist não preserva interface?

A netlist é um nível mais baixo de representação.

Ela precisa conter:

```text
módulos;
portas;
nets;
células;
conexões.
```

`interface` é uma abstração de SystemVerilog. Para gate-level, a ferramenta a transforma em portas concretas.

Isso não é erro. É o comportamento esperado.

O problema é que essa transformação altera nomes e exige cuidado na integração.

---

### 5. Nomes escapados em Verilog

Quando a ferramenta gera:

```systemverilog
\fifo_if.rd_n
```

a barra invertida indica um escaped identifier.

Em Verilog/SystemVerilog, nomes escapados permitem caracteres especiais como ponto.

Sem escape, o ponto seria interpretado como hierarquia:

```text
fifo_if.rd_n
```

Com escape, é o nome literal de uma porta:

```text
\fifo_if.rd_n
```

---

### 6. Por que wildcard em `get_designs fifo*`?

Quando parâmetros mudam o nome do design, não dá para depender de:

```tcl
get_designs fifo
```

A ferramenta pode ter criado:

```text
fifo_WIDTH4_BUF_SIZE8
```

Então o script usa:

```tcl
get_designs fifo*
```

para capturar o design cujo nome começa com `fifo`.

Isso é prático, mas deve ser usado com cuidado para não pegar designs indesejados.

---

### 7. DDC

O slide usa:

```tcl
write_file -format ddc -output mapped/fifo_mapped.ddc
read_ddc fifo_mapped.ddc
```

`DDC` é um formato interno da Synopsys para salvar o design compilado/sintetizado.

Ele preserva informações do design em formato adequado para reabrir no fluxo Synopsys.

Uso:

```text
salvar bloco sintetizado;
reler bloco em top-level;
integrar síntese bottom-up;
preservar dados da ferramenta.
```

---

### 8. Gate-level verification e wrappers

A simulação gate-level precisa de um módulo que instancie corretamente a netlist.

Se o RTL wrapper instanciava:

```systemverilog
fifo fifo_inst(...)
```

mas a netlist gerou:

```systemverilog
fifo_WIDTH4_BUF_SIZE8 fifo_inst(...)
```

o wrapper antigo pode falhar.

Por isso o fluxo gera um wrapper atualizado para simulação.

---

## Figuras, diagramas e elementos visuais importantes

### Slide 51 — Union packed/unpacked

Mostra duas formas de `union`, unpacked e packed, e destaca que todos os membros devem ter o mesmo tamanho. A figura ajuda a ver que `bits` e `bytes` são apenas duas formas de enxergar o mesmo armazenamento.

### Slides 52-55 — Self-checks de arrays e casts

Esses slides são importantes para fixar a diferença entre packed e unpacked. O erro comum é achar que qualquer array de 8 bits pode receber `8'b1`, mas isso só é direto para packed vector/array. Unpacked array precisa de atribuição compatível, elemento por elemento ou cast explícito.

### Slides 56 e 69 — Interface como struct de comunicação

Mostram a analogia entre struct e interface. A struct encapsula dados; a interface encapsula comunicação.

### Slides 57 e 70 — Sem interface

Mostram a complexidade de conectar CPU e memória com vários sinais soltos. A figura enfatiza a conectividade complexa.

### Slides 58, 71 e 72 — Com interface

Mostram `simple_bus` agrupando os sinais e sendo passado na lista de portas. A figura mostra o bloco verde `sb_intf` entre CPU e Mem.

### Slides 59 e 73 — Modports

Mostram os modports `slave` e `master`, definindo direções dos sinais e ajudando na checagem de erros de conectividade.

### Slides 60 e 74 — Synthesis support of interface

Mostram que a interface é achatada na netlist e que sinais da interface viram portas renomeadas como `\fifo_if.rd_n`.

### Slides 61-64 — Parameter synthesis at block level

Mostram o uso de wrapper para sintetizar um bloco parametrizado com interface. A figura do wrapper é fundamental para entender por que o fluxo não sintetiza simplesmente o módulo isolado sem contexto.

### Slide 65 — Integrating block-level netlist at top level

Mostra como remover o RTL de baixo nível e substituir pela versão sintetizada com `read_ddc`.

### Slides 66-67 — Gate-level simulation wrapper

Mostram os passos extras para gerar arquivos de simulação e descobrir o nome real do design pela instância.

### Slide 68 — Inout em interface

Mostra que `logic` interno à interface vira variável e que DC não permite variável como `inout`. É uma pegadinha prática importante para síntese.

### Slide 75 — Non-default parameter values

Mostra que parâmetros não default não apenas renomeiam sinais da interface, mas também alteram o nome do módulo. Isso cria problemas de integração e simulação.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é `union` em SystemVerilog?**  
   Um mecanismo semelhante a C que permite múltiplas interpretações do mesmo armazenamento.

2. **Qual regra o slide destaca para membros de `union`?**  
   Todos os membros devem ter o mesmo tamanho.

3. **Em `logic my_array[0:7];`, o array é packed ou unpacked?**  
   Unpacked, porque os colchetes estão depois do nome da variável.

4. **É legal atribuir `my_array = 8'b1;` se `my_array` é unpacked array?**  
   Não, conforme o self-check do curso.

5. **Em `logic [7:0] my_value;`, o vetor é packed ou unpacked?**  
   Packed, porque os colchetes estão antes do nome.

6. **É legal atribuir `my_value = 8'b1;`?**  
   Sim.

7. **`typedef logic array_t[8];` é legal?**  
   Sim. Ele cria um tipo de unpacked array.

8. **Como atribuir um elemento individual de um unpacked array?**  
   Usando índice, por exemplo `array[0] = 1'b1;`.

9. **Como fazer cast explícito para `value_t`?**  
   `value = value_t'(array);`.

10. **O que é uma interface?**  
    Um construct que encapsula sinais de comunicação relacionados, como uma struct encapsula dados.

11. **Qual o benefício de usar interface?**  
    Reduz complexidade de conectividade, agrupa sinais, melhora legibilidade e reduz risco de erro.

12. **O que é modport?**  
    Uma declaração dentro da interface que define a direção dos sinais para um determinado papel, como master ou slave.

13. **Modport cria novos sinais?**  
    Não. Ele cria uma visão/direção sobre sinais existentes na interface.

14. **O que acontece com interfaces na netlist sintetizada?**  
    A ferramenta achata a interface em portas comuns e renomeia sinais internos.

15. **Por que aparecem nomes como `\fifo_if.rd_n`?**  
    Porque o ponto faz parte do nome escapado da porta gerada.

16. **Quais passos são necessários para síntese bottom-up com bloco parametrizado?**  
    Criar wrapper, analisar RTL e wrapper, elaborar wrapper, definir `current_design`, seguir fluxo de síntese e salvar com `write`.

17. **Por que usar wrapper?**  
    Para instanciar interface e módulo parametrizado em um contexto controlado para síntese.

18. **Por que usar wildcard em `get_designs fifo*`?**  
    Porque a ferramenta pode modificar o nome do módulo quando parâmetros não default são usados.

19. **Como integrar uma netlist sintetizada no top-level?**  
    Ler o RTL completo, elaborar top, remover o design RTL de baixo nível e ler o DDC mapeado.

20. **O que é `read_ddc`?**  
    Comando para ler um design salvo em formato DDC da Synopsys.

21. **Quais passos adicionais são necessários para simulação gate-level do bloco?**  
    Definir `current_design` para o wrapper, obter o design via nome da instância e escrever novo wrapper para simulação.

22. **Por que o self-check de interface com `logic data` e `inout data` não compila no DC?**  
    Porque `logic` interno à interface é variável por padrão, e DC não permite variável como `inout`.

23. **Que tipo deve ser usado para sinal `inout` em interface nesse contexto?**  
    Um net type, como `wire`.

24. **O que acontece quando parâmetros não default são usados?**  
    Além de renomear sinais da interface, a ferramenta pode mudar o nome do módulo.

### Pegadinhas

- Colchetes depois do nome indicam unpacked array.
- Colchetes antes do nome indicam packed vector/array.
- Unpacked array não recebe escalar único como se fosse vetor.
- `typedef logic array_t[8];` é legal; o problema está nas atribuições incompatíveis.
- Cast explícito pode converter entre representações, mas a ordem dos bits importa.
- Interface melhora RTL, mas não permanece como interface abstrata na netlist.
- Modport define direção, não cria novo hardware por si só.
- `logic` em interface é variável por padrão; cuidado com `inout`.
- Sinais de interface podem aparecer escapados na netlist.
- Parâmetros não default podem mudar o nome do módulo.
- Scripts que dependem de nome exato podem quebrar.
- Wrapper é essencial para controlar síntese e simulação em blocos parametrizados com interface.

### Frases para memorizar

```text
Union permite múltiplas visões do mesmo armazenamento.
Packed fica antes do nome; unpacked fica depois do nome.
Unpacked array é coleção de elementos, não vetor único.
Cast em SystemVerilog usa tipo'(expressão).
Interface encapsula comunicação como struct encapsula dados.
Modport define o papel e a direção dos sinais de uma interface.
A síntese achata interfaces em portas comuns.
Parâmetros não default podem mudar o nome do módulo.
Wrapper ajuda a sintetizar blocos parametrizados com interface.
Para inout, use net type; logic interno à interface é variável.
```

---

## Relação com projeto/laboratório

Esta parte é muito prática para quem vai trabalhar com RTL real em SystemVerilog e síntese Synopsys.

### Em RTL

Use interfaces para reduzir conexões repetitivas:

```systemverilog
interface bus_if();
  logic        req, gnt;
  logic [7:0]  addr, data;
endinterface
```

Use modports para definir papéis:

```systemverilog
modport master(output req, addr, input gnt, inout data);
modport slave (input req, addr, output gnt, inout data);
```

### Em síntese

Espere que a ferramenta transforme:

```systemverilog
fifo_io.fifo fifo_if
```

em portas separadas:

```text
fifo_if.rd_n
fifo_if.wr_n
fifo_if.din
...
```

### Em scripts

Ao usar parâmetros não default, não dependa cegamente de nome exato:

```tcl
current_design [get_designs fifo*]
```

mas também revise se o wildcard não pega módulos errados.

### Em integração bottom-up

Fluxo recomendado pelo slide:

```text
1. Sintetizar bloco com wrapper.
2. Salvar DDC.
3. No top, remover RTL do bloco.
4. Ler DDC mapeado.
5. Continuar integração.
```

### Em simulação gate-level

Se o nome do módulo mudou, gere wrapper atualizado:

```tcl
proc get_design_from_inst { inst } {
  return [get_attribute [get_cells $inst] ref_name]
}
```

Use o nome real descoberto para gerar arquivos de simulação coerentes.

### Checklist prático

- [ ] Arrays packed/unpacked foram declarados na ordem correta?
- [ ] Unpacked arrays não estão recebendo escalares diretamente?
- [ ] Casts estão explícitos quando há conversão de tipo?
- [ ] Interfaces agrupam sinais realmente relacionados?
- [ ] Modports foram definidos para master/slave?
- [ ] `inout` usa net type adequado?
- [ ] Scripts de síntese consideram renomeação de interfaces?
- [ ] Scripts consideram renomeação de módulos parametrizados?
- [ ] Wrapper foi criado para blocos com interface/parâmetros?
- [ ] DDC do bloco sintetizado foi integrado corretamente no top?
- [ ] Wrapper gate-level foi gerado com o nome real do módulo sintetizado?

---

## Checklist de qualidade

- [x] Processado conforme roteiro: slides/prints 51-75.
- [x] Começou na continuação de `union`, após a parte B.
- [x] Parou no slide de suporte de síntese com parâmetros não default.
- [x] Não avançou para os slides 76-96 da parte D.
- [x] Arrays packed/unpacked e casts foram explicados.
- [x] Interfaces e modports foram explicados com foco em RTL.
- [x] Suporte de síntese para interfaces foi explicado.
- [x] Fluxo com wrapper, DDC e integração bottom-up foi organizado.
- [x] Self-checks importantes foram incorporados com resposta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 030 — 01 SystemVerilog for RTL Design - parte D**

Usar o mesmo arquivo DOCX:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design.docx
```

Processar somente:

```text
slides/prints 76-96
```

Salvar como:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\06 SystemVerilog for RTL Design\01 SystemVerilog for RTL Design_parte_D.md
```
