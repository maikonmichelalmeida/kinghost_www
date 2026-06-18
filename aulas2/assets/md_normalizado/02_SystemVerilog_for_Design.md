# 02 SystemVerilog for Design

## Controle do bloco

- **Bloco:** 011
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\02 SystemVerilog for Design.docx`
- **Faixa processada:** slides visíveis 1-15, distribuídos em 8 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\02 SystemVerilog for Design.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O próximo bloco segue a sequência da seção `03 SystemVerilog Refresher`.
- **Próximo bloco recomendado:** 012 — `03 SystemVerilog for Verification-1`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: como solicitado, os conceitos de alto nível foram aprofundados, especialmente `interface`, `clocking block`, `program block`, DPI, assertions, properties, severity, arrays dinâmicos, packages, OOP, herança, classe virtual, polimorfismo e guidelines de síntese.

---

## Resumo executivo

Esta aula aprofunda os recursos de **SystemVerilog para design e modelagem**, indo além do RTL básico. O foco está em constructs que tornam o código mais organizado, reutilizável e seguro: **interfaces**, **clocking blocks**, **program blocks**, **DPI**, **assertions**, **additional data types**, **packages**, **OOP**, herança, classes virtuais, polimorfismo e diretrizes gerais de modelagem para síntese.

A mensagem central é que SystemVerilog melhora o fluxo de design e verificação porque permite expressar melhor a intenção do hardware e reduzir a verbosidade do código. Porém, isso não significa que tudo é sintetizável. Muitos recursos desta aula são voltados a testbench, modelagem e verificação, enquanto apenas um subconjunto deve ser usado em RTL de síntese.

Os pontos de prova mais importantes do bloco são:

```text
Interface não é restrita a testbench.
Dynamic memory allocation aloca memória apenas dentro do escopo ativo do código.
Herança é quando uma classe filha carrega propriedades e métodos da classe pai.
:: é o operador de resolução de escopo.
|-> é operador de implicação.
```

---

## Texto extraído e organizado por slide

### Slide 1 — SystemVerilog Interfaces (1/2)

O slide apresenta **interfaces** em SystemVerilog.

Pontos principais:

- Conexões de portas podem ser feitas por nome e por `.*`.
- Existem comandos lógicos específicos para constructs de interface.
- Uma interface pode passar tipos de dados `record` ou estruturas através de portas.
- Elementos da interface podem ser declarados ou passados como parâmetros.
- A interface pode conter:
  - parâmetros;
  - variáveis;
  - constantes.
- Functions e tasks são suportadas dentro da interface.
- Interfaces suportam assertions.

Vantagens listadas:

- Reduz erros humanos.
- Fornece conexão concisa.
- É fácil de atualizar, modificar e manter.
- Permite modelar transações de modo eficiente.
- Fornece estrutura hierárquica.
- Fornece boa abstração em nível RTL.

Outros pontos do slide:

- Elementos da interface são referenciados relativamente ao nome da interface.
- Módulos conectados podem chamar funções e tasks da interface para iniciar comunicação.
- Apenas a interface pode ser atualizada sem afetar diretamente o módulo.

Exemplo conceitual de interface simples:

```systemverilog
interface bus;
  logic [7:0] addr;
  logic [7:0] data;
  logic       rd;
endinterface
```

Uso em módulos:

```systemverilog
module mod_a (bus i1);
  assign i1.addr = 8'h10;
  assign i1.rd   = 1'b1;
endmodule

module mod_b (bus i2);
  logic [7:0] local_data;

  always_comb begin
    if (i2.rd)
      local_data = i2.data;
  end
endmodule
```

Instanciação:

```systemverilog
module top;
  bus intf();

  mod_a u_a (.i1(intf));
  mod_b u_b (.i2(intf));
endmodule
```

Interpretação:

A interface substitui uma grande quantidade de portas soltas. Em vez de conectar `addr`, `data`, `rd`, `wr`, `valid`, `ready` individualmente em todos os módulos, o designer passa um único objeto de interface.

---

### Slide 2 — SystemVerilog Interfaces (2/2)

O slide mostra três usos principais de interface:

1. **Interface entre `mod_a` e `mod_b`**
2. **Interface com portas**
3. **Interface com modports**

#### Interface simples

Exemplo conceitual:

```systemverilog
interface intf;
  logic [7:0] a1;
  logic [3:0] a2;
  logic       a3;
endinterface
```

Instanciação:

```systemverilog
module top;
  intf i1();

  mod_a u_a (.i1(i1));
  mod_b u_b (.i2(i1));
endmodule
```

#### Interface com portas

A interface também pode receber portas, como clock:

```systemverilog
interface intf (input bit clk);
  logic [7:0] a1;
  logic [3:0] a2;
  logic       a3;
endinterface
```

Instanciação:

```systemverilog
module top;
  bit clk;
  intf i1 (.clk(clk));

  mod_a u_a (.i1(i1));
  mod_b u_b (.i2(i1));
endmodule
```

#### Interface com modports

`modport` define a direção dos sinais para cada módulo.

Exemplo:

```systemverilog
interface intf (input bit clk);
  logic [7:0] a1;
  logic [3:0] a2;
  logic       a3;

  modport master (
    input  clk,
    output a1,
    output a2,
    output a3
  );

  modport slave (
    input clk,
    input a1,
    input a2,
    input a3
  );
endinterface
```

Uso:

```systemverilog
module mod_a (intf.master i1);
endmodule

module mod_b (intf.slave i2);
endmodule
```

Interpretação:

Sem `modport`, a interface é apenas um pacote de sinais. Com `modport`, ela também documenta e restringe quem escreve e quem lê cada sinal.

---

### Slide 3 — SystemVerilog Clocking and Program Blocks

O slide apresenta dois recursos importantes para testbench:

- **clocking blocks**
- **program blocks**

#### Clocking

Pontos principais:

- Define clock domains e diferentes atributos de clock.
- Ajuda no desenvolvimento de testbench para sincronização e timing.
- Permite reuso do testbench.
- Amostra sinais referenciados à borda do ciclo de clock.
- Dirige sinais com estímulos baseados em ciclo.
- Fornece amostras síncronas.
- Cria contextos livres de race condition.

Exemplo conceitual:

```systemverilog
clocking bus_cb @(posedge clk);
  default input #10ns output #5ns;
  input  data, enable;
  output req, addr;
endclocking
```

Interpretação:

O clocking block organiza quando o testbench lê e escreve sinais em relação à borda de clock. Isso evita uma das maiores fontes de bug em simulação: o testbench alterar sinais exatamente no mesmo instante em que o DUT os amostra.

#### Program blocks

Pontos principais:

- Usados para particionar componentes do testbench.
- Identificam código de testbench.
- Apenas blocos `initial` são permitidos.

Forma geral:

```systemverilog
program name (port_list);
  declarations;
  continuous_assign;

  initial begin
    // testbench code
  end
endprogram
```

Interpretação:

`program block` foi criado para separar melhor testbench e DUT e reduzir races. Em metodologias modernas, o uso de classes e UVM acabou sendo mais comum, mas o conceito continua importante: o testbench deve ser separado e sincronizado corretamente com o design.

---

### Slide 4 — SystemVerilog Direct Programming Interface (DPI)

O slide apresenta **DPI — Direct Programming Interface**.

Pontos principais:

- Facilita integração de testbench com programas de alto nível em C++.
- Suporta chamadas diretas para funções C++ usando comando `import`.
- Suporta tipos de dados de linguagens de alto nível, como C++.
- Possui interface C embutida.
- Facilita simulações RTL e gate-level.
- Permite co-simulação.
- Facilita linkar objetos compilados de C++ com o simulador.

O slide mostra dois tipos de função:

#### Imported functions

Funções C chamadas por SystemVerilog.

Forma:

```systemverilog
import "DPI" function int c_func(input int a, input int b);
```

Exemplo:

```systemverilog
module tb;
  import "DPI-C" function int c_add(input int a, input int b);

  initial begin
    int result;
    result = c_add(10, 20);
    $display("result = %0d", result);
  end
endmodule
```

Código C correspondente:

```c
int c_add(int a, int b) {
    return a + b;
}
```

#### Exported functions

Funções SystemVerilog chamadas por C.

Forma conceitual:

```systemverilog
export "DPI-C" function sv_func;
```

Interpretação:

DPI é uma ponte entre o mundo do simulador HDL e o mundo de software. É muito útil quando existe um **golden model** em C/C++ ou quando um algoritmo é mais fácil de implementar em software do que em SystemVerilog.

---

### Slide 5 — SystemVerilog Assertions

O slide introduz assertions em SystemVerilog.

Pontos principais:

- Assertion é uma afirmação de fato em design ou verificação.
- Uma assertion falha se essa afirmação não for verdadeira.
- É um statement adicional usado para checar comportamento pretendido de sinais ou lógica.
- Ajuda no processo de debug e encurta o ciclo de debug.
- Adiciona pouco overhead e aponta diretamente para o bug no design.
- Designs RTL típicos podem incluir milhares de assertions.
- Assertions são mais locais que checkers.
- Elas são as primeiras a falhar antes do design falhar funcionalmente.
- São em sua maioria combinacionais.
- Existem dois tipos:
  - immediate;
  - concurrent.

#### Immediate assertion

Usada em blocos procedurais. Exemplo:

```systemverilog
always_comb begin
  assert (a != b)
    else $error("a não deve ser igual a b");
end
```

Ela é avaliada quando o fluxo procedural chega nela.

#### Concurrent assertion

Avaliada ao longo do tempo, geralmente sincronizada com clock.

Exemplo:

```systemverilog
property p_req_ack;
  @(posedge clk)
  req |-> ##[1:3] ack;
endproperty

assert property (p_req_ack);
```

Interpretação:

Essa propriedade diz:

```text
Se req ocorrer, ack deve ocorrer entre 1 e 3 ciclos depois.
```

#### Assert em FSM

O slide também mostra assertions de transição de FSM. A ideia é verificar se uma transição permitida realmente segue a regra especificada, por exemplo:

```systemverilog
property idle_to_read;
  @(posedge clk)
  disable iff (!rst_n)
  (state == IDLE && start) |-> (next_state == READ);
endproperty

assert property (idle_to_read);
```

---

### Slide 6 — SystemVerilog Complex Properties and Severity

O slide apresenta propriedades complexas e severidade.

#### Complex properties

Pontos principais:

- São construídas usando sequences.
- Uma sequence é uma lista de expressões booleanas em ordem sequencial.

Exemplo conceitual do slide:

```systemverilog
sequence request;
  req;
endsequence

sequence acknowledge;
  ##[1:3] ack;
endsequence

property handshake;
  @(posedge clk)
  request |-> acknowledge;
endproperty

assert property (handshake);
```

Interpretação:

A propriedade define um comportamento temporal. O operador `|->` significa implicação temporal: quando a condição antecedente acontece, o consequente deve acontecer conforme especificado.

#### Severity

SystemVerilog suporta diferentes severidades para checks de assertion:

- `$fatal`
- `$warning`
- `$error`
- `$info`

##### `$fatal`

Reporta mensagem fatal em runtime e geralmente encerra a simulação.

```systemverilog
$fatal(1, "Erro fatal: protocolo violado");
```

##### `$warning`

Reporta warning em runtime. Pode ser suprimido dependendo da simulação.

```systemverilog
$warning("Condição suspeita detectada");
```

##### `$error`

É a severidade padrão para falha de assertion. Reporta erro em runtime, mas normalmente não para a simulação.

```systemverilog
$error("Erro: dado inválido");
```

##### `$info`

Reporta informação geral.

```systemverilog
$info("Checkpoint atingido");
```

Interpretação:

Severity permite separar:

```text
erro fatal
erro comum
aviso
informação
```

Isso torna o log de simulação mais útil.

---

### Slide 7 — SystemVerilog System Tasks for Assertion Control

O slide lista system tasks e funções para controlar assertions.

#### Controle de avaliação de assertions

- `$asserton`: liga avaliação de assertions.
- `$assertoff`: desliga avaliação de assertions.
- `$assertkill`: aborta imediatamente a execução de assertions avaliadas no momento e impede avaliação até novo `$asserton`.

Exemplo:

```systemverilog
initial begin
  $assertoff;
  reset_sequence();
  $asserton;
end
```

Uso típico:

```text
desligar assertions durante reset ou inicialização,
ligar novamente quando o design entra em operação válida.
```

#### Controle de ações de assertions

O slide cita tarefas como:

- `$assertpasson`
- `$assertpassoff`
- `$assertfailon`
- `$assertfailoff`
- `$assertnonvacuouson`
- `$assertvacuousoff`

Interpretação:

Essas tasks controlam ações associadas a pass/fail/vacuous success. Em propriedades temporais, uma assertion pode passar de modo “vacuous” quando o antecedente nunca acontece. Controlar isso ajuda a evitar falsa sensação de cobertura.

#### Vector analysis

Funções citadas:

- `$onehot(expression)`
- `$onehot0(expression)`
- `$isunknown(expression)`
- `$countones(expression)`

Exemplos:

```systemverilog
assert ($onehot(grant))
  else $error("grant não é one-hot");

assert (!$isunknown(data))
  else $error("data contém X ou Z");

assert ($countones(req) <= 1)
  else $error("mais de uma requisição ativa");
```

Interpretação:

Essas funções são extremamente úteis para validar vetores, protocolos e codificações.

#### Value change system functions

Funções citadas:

- `$rose`: detecta borda de subida.
- `$fell`: detecta borda de descida.
- `$stable`: verifica estabilidade.
- `$changed`: verifica mudança.
- `$sampled`: obtém valor amostrado.
- `$past`: acessa valor em ciclo anterior.

Exemplos:

```systemverilog
assert property (@(posedge clk) $rose(req) |-> ##1 ack);

assert property (@(posedge clk) enable |-> $stable(addr));

assert property (@(posedge clk) data == $past(data) + 1);
```

Interpretação:

Essas funções tornam assertions temporais muito mais expressivas.

---

### Slide 8 — SystemVerilog Additional Data Types

O slide apresenta tipos adicionais de dados.

#### String

`string` é uma sequência textual de tamanho variável.

Exemplo:

```systemverilog
string s1 = "SystemVerilog";
string s2 = "is design and verification language";
string p  = " ";
string s3;

initial begin
  s3 = {s1, p, s2};
  $display("[%0d] %s", s3.len(), s3);
end
```

Interpretação:

Strings são muito úteis em testbench, mensagens de log, nomes de testes, paths de arquivos e debug.

#### Arrays

SystemVerilog suporta:

- static arrays;
- dynamic arrays;
- associative arrays;
- queues.

##### Static array

Tamanho fixo em compilação.

```systemverilog
int fixed_array[16];
```

##### Dynamic array

Tamanho definido em runtime.

```systemverilog
int dyn_array[];

initial begin
  dyn_array = new[16];
end
```

##### Associative array

Indexado por chaves não necessariamente contínuas.

```systemverilog
int mem[int];

initial begin
  mem[1000] = 32'hDEAD_BEEF;
end
```

Também pode ser indexado por string:

```systemverilog
int score[string];

initial begin
  score["test_1"] = 95;
end
```

##### Queue

Fila dinâmica com inserção e remoção.

```systemverilog
int q[$];

initial begin
  q.push_back(10);
  q.push_back(20);
  $display("%0d", q.pop_front());
end
```

Interpretação:

Esses tipos são muito usados em testbenches e scoreboards, especialmente quando o tamanho dos dados não é conhecido antes da simulação.

---

### Slide 9 — SystemVerilog Miscellaneous Constructs (1/2)

O slide apresenta casts dinâmicos.

#### Dynamic cast

SystemVerilog fornece `$cast`.

Pontos principais:

- `$cast` é uma system task para atribuir valores a variáveis de tipos diferentes.
- Em atribuições simples, o simulador pode gerar erro se o cast for inválido.
- `$cast` pode ser usado como task ou function.
- Quando usado como task:
  - avalia a expressão;
  - atribui à variável;
  - se a avaliação for inválida, gera runtime error.
- Quando usado como function:
  - avalia e atribui;
  - em sucesso, retorna `1`;
  - caso contrário, retorna `0`;
  - não gera runtime error.
- Casting também pode ser feito em objetos de classe.

Exemplo:

```systemverilog
typedef enum {RED, GREEN, BLUE} color_t;

color_t c;
int value;

initial begin
  value = 1;

  if ($cast(c, value))
    $display("cast ok: %0d", c);
  else
    $display("cast falhou");
end
```

Interpretação:

`$cast` é mais seguro que cast direto quando há risco de valor inválido.

#### Cast com classes

Em OOP, `$cast` também permite verificar se um objeto base realmente aponta para um objeto de subclasse.

```systemverilog
base b;
child c;

if ($cast(c, b))
  c.child_method();
else
  $display("b não aponta para child");
```

---

### Slide 10 — SystemVerilog Miscellaneous Constructs (2/2)

O slide apresenta **packages**.

#### SystemVerilog Packages

Pontos principais:

- Usados para armazenar dados, métodos, interfaces e parâmetros reutilizados por múltiplos módulos e programs.
- Ajudam no gerenciamento da database do design, removendo bagunça ao agrupar estruturas comuns.
- São definidos com:
  - `package`
  - `endpackage`
- O package deve ser importado para usar seus constructs.
- Elementos individuais também podem ser importados.
- `::` é usado para se referir a um identificador no escopo de uma classe ou package.
- Ajuda a resolver colisão de nomes.

Exemplo:

```systemverilog
package my_pkg;
  parameter int WIDTH = 8;

  typedef enum logic [1:0] {
    IDLE,
    READ,
    WRITE
  } state_t;

  function int add(int a, int b);
    return a + b;
  endfunction
endpackage
```

Importando tudo:

```systemverilog
import my_pkg::*;
```

Importando item específico:

```systemverilog
import my_pkg::WIDTH;
```

Usando resolução de escopo:

```systemverilog
logic [my_pkg::WIDTH-1:0] data;
```

Interpretação:

Packages evitam duplicação de tipos, parâmetros e funções. O operador `::` diz explicitamente de qual escopo vem um nome.

---

### Slide 11 — SystemVerilog OOPs Concept (1/3)

O slide apresenta conceitos de OOP.

Ponto principal:

- SystemVerilog suporta conceitos de **object-oriented programming**.
- `class` é um construct OOP definido pelo usuário usado para encapsular:
  - propriedades de dados;
  - tasks;
  - métodos que operam nos dados.

Exemplo didático:

```systemverilog
class Packet;
  bit [7:0]  header;
  bit [2:0]  packet_type;
  bit [7:0]  packet_class;
  bit [31:0] packet_payload;
  bit        packet_end;

  function new(
    bit [7:0]  header_arg,
    bit [2:0]  packet_type_arg
  );
    this.header      = header_arg;
    this.packet_type = packet_type_arg;
  endfunction

  function void display();
    $display("header=%0h type=%0h payload=%0h",
             this.header, this.packet_type, this.packet_payload);
  endfunction
endclass
```

Uso:

```systemverilog
Packet p1;

initial begin
  p1 = new(8'hAA, 3'b001);
  p1.packet_payload = 32'h1234_5678;
  p1.display();
end
```

Interpretação:

Classe é um molde. Objeto é uma instância desse molde. A classe agrupa dados e métodos relacionados.

#### `this`

`this` é uma referência ao próprio objeto atual.

```systemverilog
this.header = header_arg;
```

Isso evita confusão entre argumento e campo da classe.

---

### Slide 12 — SystemVerilog OOPs Concept (2/3)

O slide apresenta **inheritance**.

Definição do slide:

```text
A child class carrying forward all the properties and methods from the parent class is called inheritance.
```

Tradução:

```text
Uma classe filha carregar todas as propriedades e métodos da classe pai é chamado de herança.
```

Exemplo didático:

```systemverilog
class Packet;
  bit [7:0] header;
  bit [31:0] payload;

  function new(bit [7:0] h);
    this.header = h;
  endfunction

  function void display();
    $display("Packet header=%0h payload=%0h", header, payload);
  endfunction
endclass

class CRC_Packet extends Packet;
  bit [15:0] crc;

  function new(bit [7:0] h, bit [15:0] c);
    super.new(h);
    this.crc = c;
  endfunction

  function void display();
    super.display();
    $display("CRC=%0h", crc);
  endfunction
endclass
```

Interpretação:

`CRC_Packet` herda `header`, `payload` e métodos de `Packet`, mas adiciona `crc`.

#### `super`

`super` referencia a classe pai.

```systemverilog
super.new(h);
super.display();
```

Isso permite chamar construtor e métodos da classe base.

---

### Slide 13 — SystemVerilog OOPs Concept (3/3)

O slide apresenta:

- abstract/virtual class;
- polymorphism.

#### Abstract/Virtual class

Pontos principais:

- Usada para impedir que outros criem um objeto de uma classe.
- Adiciona-se a palavra-chave `virtual`.
- Ainda é possível criar classes filhas.

Exemplo:

```systemverilog
virtual class BasePacket;
  bit [7:0] data;

  virtual function void display();
    $display("BasePacket data=%0h", data);
  endfunction
endclass

class DataPacket extends BasePacket;
  function void display();
    $display("DataPacket data=%0h", data);
  endfunction
endclass
```

Interpretação:

A classe virtual serve como modelo abstrato. Você não quer instanciar `BasePacket` diretamente; quer criar subclasses especializadas.

#### Polymorphism

Definição do slide:

```text
A method to use base class variable to hold subclass objects and reference methods of subclass by superclass variable.
```

Tradução:

```text
Polimorfismo é usar uma variável da classe base para guardar objetos de subclasses e chamar métodos da subclasse por meio da variável da superclasse.
```

Exemplo:

```systemverilog
class Base;
  virtual function void display();
    $display("Base");
  endfunction
endclass

class Child extends Base;
  function void display();
    $display("Child");
  endfunction
endclass

initial begin
  Base b;
  Child c;

  c = new();
  b = c;

  b.display(); // imprime "Child" se display for virtual
end
```

Interpretação:

O tipo da variável é `Base`, mas o objeto real é `Child`. Se o método for virtual, SystemVerilog chama a versão da subclasse.

Isso é essencial para testbenches reutilizáveis.

---

### Slide 14 — General Guidelines for SystemVerilog Modeling for Synthesis

Diretrizes gerais do slide:

- Não instancie componente ou gate diretamente no modelo de design, a menos que seja necessário.
- Use constructs `always*` apropriados conforme a necessidade:
  - lógica combinacional;
  - latch;
  - flip-flop.
- Não misture lógica de borda positiva e borda negativa em blocos procedurais.
- Use diretivas de compilador apropriadas para forçar lógica independente de tecnologia quando necessário.
- Use atribuições imediatas/blocking `=` dentro de blocos `always` combinacionais.
- Use atribuições delayed/nonblocking `<=` dentro de `always_latch` ou `always_ff`.
- Use variantes adequadas de `if` e `case` dependendo da lógica pretendida.
- Identifique e desenvolva classes, métodos e funções que possam ser compartilhados e crie packages.
- Use `assign` e casting conforme os requisitos do design.
- Garanta que o nome do sinal comunique seu significado ou valor sem ser excessivamente verboso.
- Use estilo consistente de nomeação, capitalização e separação de palavras.

Interpretação:

O slide mistura duas preocupações:

1. **RTL sintetizável limpo**
2. **organização de código reutilizável**

Para RTL, o ponto mais importante é usar:

```systemverilog
always_comb  // combinacional
always_ff    // flip-flop
always_latch // latch intencional
```

e não confundir recursos de testbench com hardware sintetizável.

---

### Slide 15 — Questões 1 a 5

#### Questão 1

**Questão:** Use of interface is restricted to testbench modules.

**Tradução:** O uso de interface é restrito a módulos de testbench.

**Resposta correta:** False.

**Justificativa:** Interfaces podem ser usadas tanto em testbench quanto em design RTL, desde que usadas com constructs sintetizáveis. O slide de interfaces mostra seu uso para conectar módulos, reduzir erros e melhorar abstração em nível RTL.

---

#### Questão 2

**Questão:** SystemVerilog supports dynamic memory allocation which means ______.

Alternativas:

- A. System memory is reserved during simulation run
- B. System memory is not reserved at all
- C. System memory is allocated only within the active scope of code

**Resposta correta:** C. System memory is allocated only within the active scope of code.

**Tradução:** SystemVerilog suporta alocação dinâmica de memória, o que significa que a memória é alocada apenas dentro do escopo ativo do código.

**Justificativa:** Arrays dinâmicos, objetos de classe e estruturas alocadas em runtime existem durante a simulação no escopo/tempo em que são criados e referenciados. Para o banco do curso, a alternativa correta é C.

---

#### Questão 3

**Questão:** A child class carrying forward all the properties and methods from the parent class called ______.

Alternativas:

- A. Polymorphism
- B. Inheritance
- C. Class

**Resposta correta:** B. Inheritance.

**Tradução:** Uma classe filha carregar todas as propriedades e métodos da classe pai é chamado de herança.

**Justificativa:** Essa é exatamente a definição de inheritance apresentada no slide de OOP.

---

#### Questão 4

**Questão:** `::` is a ______ used to avoid name same collision.

Alternativas:

- A. Nonblocking statement
- B. Implication operator
- C. Scope resolution operator

**Resposta correta:** C. Scope resolution operator.

**Tradução:** `::` é um operador de resolução de escopo usado para evitar colisão de nomes iguais.

**Justificativa:** `::` permite indicar de qual package, classe ou escopo vem um identificador.

Exemplo:

```systemverilog
my_pkg::WIDTH
Packet::type_id
```

---

#### Questão 5

**Questão:** ______ is an implication operator.

Alternativas:

- A. `==`
- B. `!=`
- C. `|->`

**Resposta correta:** C. `|->`.

**Tradução:** `|->` é um operador de implicação.

**Justificativa:** Em SystemVerilog Assertions, `|->` expressa implicação temporal sobreposta. Exemplo:

```systemverilog
req |-> ack
```

Significa: se `req` ocorre, `ack` deve ocorrer conforme a regra temporal especificada.

---

## Aula didática desenvolvida

### 1. Interface: o recurso que muda a organização do RTL

Em Verilog clássico, um barramento pode gerar listas enormes de portas:

```systemverilog
module master (
  input  logic clk,
  output logic valid,
  output logic write,
  output logic [7:0] addr,
  output logic [31:0] wdata,
  input  logic ready,
  input  logic [31:0] rdata
);
```

Se cinco módulos usam esse barramento, todos precisam repetir a mesma lista de sinais. Isso aumenta erro humano.

Com interface:

```systemverilog
interface bus_if (input logic clk);
  logic valid;
  logic write;
  logic [7:0] addr;
  logic [31:0] wdata;
  logic ready;
  logic [31:0] rdata;
endinterface
```

O módulo fica mais limpo:

```systemverilog
module master (bus_if bus);
endmodule
```

A interface funciona como um agrupador de sinais relacionados.

Isso melhora:

- legibilidade;
- manutenção;
- reuso;
- organização hierárquica;
- integração com testbench.

---

### 2. Interface não é só para testbench

A questão 1 reforça esse ponto.

Interfaces podem ser usadas em RTL, desde que o conteúdo seja compatível com síntese.

Sintetizável, em geral:

```systemverilog
interface bus_if;
  logic valid;
  logic ready;
  logic [31:0] data;

  modport master (
    output valid, data,
    input  ready
  );

  modport slave (
    input  valid, data,
    output ready
  );
endinterface
```

Não necessariamente sintetizável:

```systemverilog
interface tb_if;
  task automatic wait_for_valid();
    wait(valid);
  endtask

  assert property (...);
endinterface
```

O que define a sintetizabilidade não é a palavra `interface`, mas o que existe dentro dela e como ela é usada.

---

### 3. Modport: direção e disciplina

Sem `modport`, qualquer módulo conectado à interface pode, em princípio, acessar os sinais.

Com `modport`, você define o papel de cada módulo:

```systemverilog
modport master (
  output valid,
  output data,
  input  ready
);

modport slave (
  input  valid,
  input  data,
  output ready
);
```

Isso é parecido com declarar portas de módulo, mas dentro da interface.

Benefícios:

- documenta quem dirige cada sinal;
- evita erro de direção;
- melhora checagem por ferramenta;
- facilita leitura do projeto.

---

### 4. Clocking block: evitando race condition no testbench

Race condition acontece quando testbench e DUT leem/escrevem sinais no mesmo instante de simulação de forma ambígua.

Exemplo ruim:

```systemverilog
always @(posedge clk)
  dut_input = new_value;
```

Se o DUT também amostra `dut_input` em `posedge clk`, a ordem pode ficar ambígua.

Clocking block resolve isso:

```systemverilog
clocking cb @(posedge clk);
  default input #1step output #2ns;
  output dut_input;
  input  dut_output;
endclocking
```

Agora o testbench sabe:

```text
quando amostrar saídas
quando dirigir entradas
em relação à borda de clock
```

Isso cria um ambiente mais previsível.

---

### 5. Program block: separação histórica de testbench

`program block` foi criado para marcar código de testbench e reduzir races com o DUT.

Exemplo:

```systemverilog
program test (bus_if bus);
  initial begin
    bus.valid = 1'b1;
  end
endprogram
```

Hoje, em muitos fluxos modernos, UVM e classes são mais usados que `program`, mas a intenção permanece importante:

```text
separe testbench de design
sincronize corretamente com clock
evite races
```

---

### 6. DPI: chamando C/C++ a partir da simulação

DPI é útil quando você tem um modelo de referência em C.

Imagine um bloco de criptografia, compressão, filtro digital ou algoritmo matemático. Reescrever tudo em SystemVerilog pode ser trabalhoso. Então você chama o modelo C:

```systemverilog
import "DPI-C" function int golden_model(input int x);

initial begin
  int expected;
  expected = golden_model(dut_input);
end
```

O testbench compara:

```text
saída do DUT
versus
saída do modelo C
```

Isso permite co-simulação e verificação mais robusta.

---

### 7. Assertions: debug local e rápido

Sem assertion, um bug pode aparecer muito longe da causa.

Exemplo:

```text
protocolo violado no ciclo 100
erro visível na saída no ciclo 500
```

Com assertion, o simulador aponta a violação no ciclo 100.

Exemplo:

```systemverilog
assert property (@(posedge clk) !(read && write))
  else $error("read e write ativos juntos");
```

Isso reduz o tempo de debug porque a assertion fica próxima da regra que está sendo violada.

---

### 8. Immediate assertion versus concurrent assertion

#### Immediate assertion

Avaliada imediatamente dentro de um bloco procedural.

```systemverilog
always_comb begin
  assert (sel inside {[0:3]})
    else $error("sel fora da faixa");
end
```

Boa para checagens instantâneas.

#### Concurrent assertion

Avalia comportamento ao longo do tempo.

```systemverilog
property req_ack;
  @(posedge clk)
  req |-> ##[1:3] ack;
endproperty

assert property (req_ack);
```

Boa para protocolos temporais.

Resumo:

```text
Immediate assertion → condição agora.
Concurrent assertion → comportamento ao longo dos ciclos.
```

---

### 9. O operador `|->`

O operador `|->` é chamado de **overlapped implication**.

Exemplo:

```systemverilog
a |-> b
```

Significa:

```text
se a for verdadeiro neste ciclo,
b deve ser verdadeiro conforme a sequência consequente,
começando no mesmo ciclo ou na relação temporal indicada.
```

Exemplo com atraso:

```systemverilog
req |-> ##1 ack
```

Significa:

```text
se req ocorrer,
ack deve ocorrer no próximo ciclo.
```

Outro operador relacionado é `|=>`, chamado **non-overlapped implication**:

```systemverilog
req |=> ack
```

Ele começa a checar o consequente no ciclo seguinte por padrão.

Para esta questão do curso, o operador de implicação cobrado é:

```text
|-> 
```

---

### 10. `$past`, `$rose`, `$fell`, `$stable`

Essas funções são extremamente úteis em assertions.

#### `$rose`

Detecta subida.

```systemverilog
$rose(req)
```

Verdadeiro quando `req` sobe de 0 para 1.

#### `$fell`

Detecta descida.

```systemverilog
$fell(valid)
```

#### `$stable`

Verifica se não mudou.

```systemverilog
$stable(addr)
```

Exemplo:

```systemverilog
assert property (@(posedge clk) valid |-> $stable(addr));
```

Significa:

```text
quando valid estiver ativo, addr deve permanecer estável.
```

#### `$past`

Consulta valor anterior.

```systemverilog
data == $past(data) + 1
```

Útil para contadores, protocolos e sequências.

---

### 11. Arrays dinâmicos e escopo ativo

A questão 2 fala de dynamic memory allocation.

Em SystemVerilog:

```systemverilog
int arr[];

initial begin
  arr = new[10];
end
```

A memória é alocada em runtime durante a simulação.

Objetos de classe também são alocados dinamicamente:

```systemverilog
Packet p;
p = new();
```

Para o curso, isso significa:

```text
System memory is allocated only within the active scope of code.
```

Em termos práticos, esses recursos são principalmente de testbench/modelagem. Hardware sintetizado não cria arrays dinâmicos com `new[]` em tempo de execução.

---

### 12. Associative arrays e queues

#### Associative array

Ótimo para scoreboard.

```systemverilog
int expected_by_id[int];

expected_by_id[15] = 100;
expected_by_id[22] = 300;
```

Você não precisa alocar todos os índices de 0 até 22. Só os usados existem.

#### Queue

Ótima para filas de transações.

```systemverilog
Transaction q[$];

q.push_back(tr);
tr = q.pop_front();
```

Uso típico:

```text
monitor coleta transações
scoreboard compara na ordem correta
```

Esses recursos são centrais em testbenches modernos.

---

### 13. Packages e `::`

Packages evitam duplicação.

```systemverilog
package alu_pkg;
  typedef enum logic [2:0] {
    ADD,
    SUB,
    AND_OP,
    OR_OP
  } opcode_t;

  parameter int WIDTH = 32;
endpackage
```

Uso:

```systemverilog
import alu_pkg::*;

opcode_t op;
logic [WIDTH-1:0] data;
```

Ou com resolução explícita:

```systemverilog
alu_pkg::opcode_t op;
logic [alu_pkg::WIDTH-1:0] data;
```

O operador `::` é usado para dizer:

```text
pegue este nome dentro daquele escopo
```

Por isso ele evita colisão de nomes.

---

### 14. OOP: class, object, method

Uma classe é um molde:

```systemverilog
class Packet;
  bit [7:0] addr;
  bit [31:0] data;

  function void display();
    $display("addr=%0h data=%0h", addr, data);
  endfunction
endclass
```

Um objeto é uma instância:

```systemverilog
Packet p;

initial begin
  p = new();
  p.addr = 8'h10;
  p.data = 32'hDEAD_BEEF;
  p.display();
end
```

OOP permite representar transações de alto nível em testbench.

Em vez de manipular sinais soltos:

```text
addr, data, write, byte_enable, burst_len
```

você manipula um objeto:

```systemverilog
Transaction tr;
```

---

### 15. Herança

Herança permite especializar classes.

```systemverilog
class BasePacket;
  bit [7:0] addr;
endclass

class WritePacket extends BasePacket;
  bit [31:0] data;
endclass
```

`WritePacket` herda `addr` e adiciona `data`.

Resposta de prova:

```text
child class carrying forward properties and methods from parent → inheritance
```

---

### 16. Classe virtual

Uma classe virtual não deve ser instanciada diretamente.

```systemverilog
virtual class DriverBase;
  pure virtual task drive();
endclass
```

Classes filhas implementam:

```systemverilog
class AxiDriver extends DriverBase;
  virtual task drive();
    // drive AXI signals
  endtask
endclass
```

Interpretação:

A classe base define o contrato. A classe filha implementa o comportamento específico.

---

### 17. Polimorfismo

Polimorfismo permite usar uma variável da classe base para apontar para objetos de classes filhas.

```systemverilog
DriverBase drv;

drv = new AxiDriver();
drv.drive();
```

Se `drive()` for virtual, a versão de `AxiDriver` é chamada.

Isso é a base de testbenches reutilizáveis: o ambiente pode trabalhar com um tipo genérico e trocar implementações concretas.

---

### 18. Guidelines de síntese em SystemVerilog

Para RTL sintetizável, mantenha o código disciplinado.

#### Combinacional

```systemverilog
always_comb begin
  y = '0;

  unique case (sel)
    2'd0: y = a;
    2'd1: y = b;
    2'd2: y = c;
    2'd3: y = d;
  endcase
end
```

#### Sequencial

```systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n)
    q <= '0;
  else
    q <= d;
end
```

#### Latch intencional

```systemverilog
always_latch begin
  if (en)
    q <= d;
end
```

Regra:

```text
Use o construct que expressa exatamente o hardware desejado.
```

---

## Conceitos difíceis explicados em profundidade

### 1. Por que `interface` reduz erro humano?

Sem interface, você repete conexões:

```systemverilog
.valid(valid),
.ready(ready),
.addr(addr),
.data(data),
.write(write)
```

Em muitos módulos, basta trocar um nome ou inverter direção para gerar bug.

Com interface, você passa um pacote único:

```systemverilog
bus_if bus();
master u_master(bus);
slave  u_slave(bus);
```

Menos conexões manuais significam menos chance de erro.

---

### 2. Por que clocking block evita race?

Em simulação, DUT e testbench podem reagir à mesma borda de clock. Se ambos escrevem ou leem no mesmo instante, a ordem de execução pode ser problemática.

Clocking block define regiões temporais:

```text
amostrar entrada depois da borda
dirigir saída com skew controlado
```

Isso separa o momento em que o testbench observa e o momento em que ele dirige sinais.

---

### 3. Por que assertions são mais locais que checkers?

Um checker externo pode perceber que o resultado final deu errado. Mas uma assertion interna pode detectar a regra violada no ponto exato.

Exemplo:

```text
Erro final: pacote saiu corrompido.
Assertion local: FIFO overflow aconteceu no ciclo 120.
```

A assertion aponta para a causa mais cedo.

---

### 4. O que é sucesso vacuous em assertion?

Propriedade:

```systemverilog
req |-> ##1 ack
```

Se `req` nunca acontece, a propriedade nunca é realmente testada. Ela pode “passar” porque o antecedente não ocorreu. Isso é chamado de sucesso vacuous.

Por isso, além de assertions, coverage é importante. Você precisa saber se o cenário aconteceu.

---

### 5. `$onehot` e `$onehot0`

`$onehot(vector)` exige exatamente um bit em 1.

```systemverilog
$onehot(4'b0100) // verdadeiro
$onehot(4'b0000) // falso
$onehot(4'b0110) // falso
```

`$onehot0(vector)` permite zero ou um bit em 1.

```systemverilog
$onehot0(4'b0000) // verdadeiro
$onehot0(4'b0100) // verdadeiro
$onehot0(4'b0110) // falso
```

Útil para grants, estados one-hot e arbiters.

---

### 6. `$isunknown`

Detecta `X` ou `Z`.

```systemverilog
assert (!$isunknown(data))
  else $error("data contém X/Z");
```

Isso é muito útil em simulação RTL, porque `X` pode indicar:

- reset faltando;
- sinal não dirigido;
- múltiplos drivers;
- case incompleto;
- latch acidental.

---

### 7. `$cast` como function versus task

Como task:

```systemverilog
$cast(color, value);
```

Se falhar, pode gerar runtime error.

Como function:

```systemverilog
if (!$cast(color, value)) begin
  $display("cast inválido");
end
```

Como function, permite tratar a falha sem derrubar simulação.

---

### 8. `::` versus `.`

Use `.` para acessar membro de objeto:

```systemverilog
p.addr
p.display()
```

Use `::` para acessar item de escopo, classe ou package:

```systemverilog
my_pkg::WIDTH
my_pkg::opcode_t
BaseClass::type_id
```

A questão do curso cobra:

```text
:: → scope resolution operator
```

---

### 9. `|->` versus `=>` de outras linguagens

Em SystemVerilog Assertions, `|->` não é “maior que” nem comparação. É implicação temporal.

```systemverilog
antecedente |-> consequente
```

Leia como:

```text
se antecedente ocorrer, então consequente deve ocorrer conforme a sequência
```

---

### 10. OOP não é RTL

Classes, herança, polimorfismo e objetos são conceitos de simulação/modelagem.

Eles não viram gates em síntese ASIC comum.

Use OOP para:

- transações;
- drivers;
- monitors;
- scoreboards;
- sequências;
- modelos de referência.

Use RTL para:

- registradores;
- muxes;
- somadores;
- FSMs;
- datapaths;
- interfaces sintetizáveis.

---

## Figuras, diagramas e waveforms importantes

### Interface entre módulos

Os slides mostram módulos `mod_a` e `mod_b` conectados por uma interface. A figura reforça a ideia de substituir várias conexões individuais por uma estrutura agrupada.

### Interface com portas e modports

A segunda parte mostra interface recebendo clock e usando `modport` para definir direções. Essa é a forma mais disciplinada de usar interfaces em designs maiores.

### Clocking block

O slide mostra um bloco `clocking` sincronizado com `posedge clk`, definindo skew de input/output. Essa figura é importante para entender como testbench evita race condition.

### DPI

O slide mostra código SystemVerilog importando função de C/C++ e código C correspondente. É a ponte entre simulador e software externo.

### Assertions

O slide mostra exemplos de immediate e concurrent assertions. A mensagem principal é que assertions localizam bugs rapidamente e podem existir em grande número em designs RTL.

### Complex properties

O slide mostra sequences compondo properties mais complexas, além das severidades `$fatal`, `$warning`, `$error` e `$info`.

### Assertion control

O slide lista `$asserton`, `$assertoff`, `$assertkill`, funções de análise de vetor e funções temporais como `$rose`, `$fell`, `$stable`, `$changed`, `$sampled`, `$past`.

### Additional data types

O slide mostra strings, arrays dinâmicos, arrays associativos e queues. Esses recursos são fundamentais para testbenches e scoreboards.

### Packages

O slide mostra `package`, importação por `::*` e uso de `::` para resolução de escopo.

### OOP slides

Os três slides mostram classe, objeto, herança, classe virtual e polimorfismo. São a base conceitual para SystemVerilog de verificação e UVM.

### Guidelines

O slide final resume boas práticas para modelagem SystemVerilog para síntese, especialmente uso correto de `always_comb`, `always_ff`, `always_latch`, blocking/nonblocking e nomeação consistente.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Use of interface is restricted to testbench modules. True or false?**  
   Resposta: **False**.

2. **SystemVerilog supports dynamic memory allocation which means ______.**  
   Resposta: **System memory is allocated only within the active scope of code**.

3. **A child class carrying forward all the properties and methods from the parent class is called ______.**  
   Resposta: **Inheritance**.

4. **`::` is a ______ used to avoid name same collision.**  
   Resposta: **Scope resolution operator**.

5. **______ is an implication operator.**  
   Resposta: **`|->`**.

6. **Para que serve interface?**  
   Agrupar sinais, reduzir conexões manuais, melhorar manutenção e permitir abstração de comunicação.

7. **Para que serve modport?**  
   Definir direção e papel dos sinais dentro da interface.

8. **Para que serve clocking block?**  
   Sincronizar testbench com clock e evitar race conditions.

9. **Para que serve DPI?**  
   Integrar SystemVerilog com funções C/C++.

10. **Quais são os dois tipos principais de assertion?**  
    Immediate e concurrent.

11. **Para que serve `$rose`?**  
    Detectar borda de subida.

12. **Para que serve `$past`?**  
    Referenciar valor de ciclo anterior.

13. **Para que serve `$isunknown`?**  
    Detectar `X` ou `Z`.

14. **Para que serve package?**  
    Agrupar tipos, parâmetros, funções, classes e itens reutilizáveis.

15. **O que é polimorfismo?**  
    Usar variável da classe base para referenciar objetos de subclasses e chamar métodos especializados.

### Pegadinhas

- Interface não é restrita a testbench.
- Interface pode ser sintetizável se usada com subconjunto RTL adequado.
- Classes, arrays dinâmicos, queues, mailbox e OOP são majoritariamente recursos de testbench/modelagem.
- `::` não é nonblocking e não é operador de implicação; é scope resolution.
- `|->` não é comparação; é implicação temporal em assertions.
- `$error` normalmente não encerra simulação; `$fatal` geralmente encerra.
- Assertion pode passar de forma vacuous se o antecedente nunca ocorre.
- `program block` é para testbench, não para RTL comum.
- `clocking block` ajuda a evitar race, mas não substitui o entendimento de timing.
- Dynamic memory allocation é conceito de simulação/modelagem, não hardware físico sintetizado com `new`.
- `always_comb` deve usar blocking `=`.
- `always_ff` deve usar nonblocking `<=`.

### Frases para memorizar

```text
Interface agrupa sinais e não é restrita a testbench.
Modport define direções dentro da interface.
Clocking block cria contexto sem race para testbench.
DPI conecta SystemVerilog a C/C++.
Assertion é uma afirmação que falha quando não é verdadeira.
Immediate assertion checa agora; concurrent assertion checa no tempo.
Sequence é lista de expressões booleanas em ordem temporal.
|-> é operador de implicação.
:: é operador de resolução de escopo.
Herança é classe filha carregar propriedades e métodos da classe pai.
Polimorfismo usa handle da classe base para chamar comportamento da subclasse.
```

---

## Relação com projeto/laboratório

Esta aula será usada diretamente em designs e testbenches SystemVerilog mais avançados.

### Relação com RTL

Use:

```systemverilog
interface
modport
logic
always_comb
always_ff
typedef enum
struct packed
package
```

Exemplo RTL com interface:

```systemverilog
interface bus_if;
  logic valid;
  logic ready;
  logic [31:0] data;

  modport producer (
    output valid, data,
    input  ready
  );

  modport consumer (
    input  valid, data,
    output ready
  );
endinterface
```

### Relação com testbench

Use:

```systemverilog
class
randomize
clocking block
program block
DPI
assert property
queues
associative arrays
packages
```

### Relação com UVM

Este bloco prepara vários fundamentos de UVM:

| Conceito deste bloco | Uso em UVM |
|---|---|
| class | base de todos os componentes UVM |
| inheritance | especialização de drivers, monitors e sequences |
| polymorphism | factories e handles genéricos |
| package | organização de ambientes |
| interface | conexão com DUT |
| clocking block | sincronização com DUT |
| assertions | checagem de protocolo |
| queues/arrays | scoreboards e armazenamento |
| DPI | golden models externos |

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] Código/comandos foram preservados e explicados.
- [x] Questões foram respondidas com tradução, alternativa correta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Roteiro/checklist foi conferido antes de sugerir o próximo bloco.
- [x] O próximo bloco indicado segue a sequência fornecida: `03 SystemVerilog for Verification-1`.

---

## Próximo bloco

**Bloco 012 — 03 SystemVerilog for Verification-1**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\03 SystemVerilog for Verification-1.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\03 SystemVerilog for Verification-1.md
```
