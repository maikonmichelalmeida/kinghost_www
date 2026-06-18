# 03 SystemVerilog for Verification-1

## Controle do bloco

- **Bloco:** 012
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\03 SystemVerilog for Verification-1.docx`
- **Faixa processada:** slides visíveis 1-20 + questões finais, distribuídos em 11 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\03 SystemVerilog for Verification-1.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O bloco atual é `03 SystemVerilog for Verification-1`; a sequência lógica da seção `03 SystemVerilog Refresher` aponta para o próximo bloco numerado como `04 SystemVerilog for Verification-2`.
- **Próximo bloco recomendado:** 013 — `04 SystemVerilog for Verification-2`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: como solicitado, os conceitos de alto nível foram aprofundados, especialmente arquitetura de testbench, generator, driver, monitor, scoreboard, environment, mailbox, semaphore, event, arrays, métodos de array, tipos de dados e comunicação entre componentes.

---

## Resumo executivo

Esta aula aprofunda **SystemVerilog como linguagem de verificação de hardware**, focando na construção de testbenches modernos e modulares. A aula começa com a motivação para o uso de HVLs — Hardware Verification Languages — e depois mostra como SystemVerilog organiza um ambiente de verificação completo com:

```text
stimulus generator
driver
interface
DUT
monitor
scoreboard
environment
test
testbench_top
```

O exemplo central é um DUT simples com uma interface de comunicação e um testbench orientado a objetos. A sequência didática mostra como criar um **transaction object**, como o **generator** produz transações randômicas, como o **driver** pega essas transações de uma **mailbox** e aplica no DUT por uma **interface**, como o **monitor** observa os sinais e transforma atividade de pinos em objetos, e como o **scoreboard** compara a resposta do DUT com o esperado.

A segunda metade da aula aprofunda recursos fundamentais para testbenches:

- tipos de dados SystemVerilog;
- strings;
- arrays estáticos, dinâmicos, associativos e queues;
- métodos de busca, ordenação e redução em arrays;
- loops;
- comunicação por `event`, `semaphore` e `mailbox`;
- exemplos de semaphore e mailbox;
- questões de prova sobre mailbox, semaphore, métodos de arrays e eventos.

O ponto mais importante da aula é entender que o testbench moderno não deve ser apenas um bloco `initial` com estímulos manuais. Ele deve ser estruturado como um ambiente reutilizável, com componentes especializados e comunicação clara entre eles.

---

## Texto extraído e organizado por slide

### Slide 1 — Hardware Verification Languages

HVLs — **Hardware Verification Languages** — incluem recursos de linguagens de programação de alto nível, com conceitos de OOP — object-oriented programming — como C++ ou Java, além de recursos de manipulação bit-level encontrados em HDLs.

Pontos principais:

- HVLs suportam geração de estímulos randômicos com constraints.
- Suportam assertions.
- Suportam constructs para extrair verification coverage.
- Devem ser simples, abstratas, escaláveis e fáceis de manter.
- Como o hardware antigo era mais simples, HDLs eram usadas para escrever testbenches com estímulos randômicos mínimos.
- Verilog foi uma das linguagens usadas para verificação de blocos lógicos simples.
- Uma HVL deve ser capaz de:
  - concurrent assertions;
  - constraint random stimulus generation;
  - noção de tempo;
  - conexão com o DUT.
- Specman e foi a primeira linguagem de verificação full-fledged.
- Depois vieram SystemVerilog, OpenVera e SystemC.

A figura mostra uma estrutura típica de testbench:

```text
Testbench environment
 ├── Stimulus generator
 ├── Driver
 ├── Interface
 ├── DUT
 ├── Monitor
 └── Scoreboard
```

Interpretação:

A figura deixa claro que verificação moderna não é apenas “aplicar entrada e olhar saída”. Existe uma arquitetura: alguém gera estímulos, alguém dirige o DUT, alguém monitora, alguém compara e alguém organiza o ambiente.

---

### Slide 2 — SystemVerilog as a Hardware Verification Language

SystemVerilog é apresentado como uma linguagem adequada para verificar sistemas digitais complexos.

Pontos principais:

- Para testar sistemas digitais complexos, SystemVerilog suporta:
  - constraint random simulations;
  - assertions;
  - conceitos de OOP.
- Esses recursos ajudam a construir estruturas complexas de testbench com:
  - coverage;
  - assertions;
  - estímulos randômicos em simulações de hardware.
- Como a maioria dos designs é geralmente escrita em Verilog ou SystemVerilog, fica mais fácil verificá-los usando SystemVerilog, pois ele é um enhancement de Verilog.

Funções principais do testbench:

1. Gerar estímulos e dirigir entradas do DUT.
2. Permitir que o DUT processe as entradas e gere a resposta pretendida.
3. Comparar a resposta do DUT com a resposta esperada.
4. Aceitar o design alterado após correção dos bugs identificados.
5. Revalidar até que nenhum bug seja detectado.

Tabela do slide:

| Componente do testbench | Descrição |
|---|---|
| Stimulus generator | Gera diferentes estímulos correspondentes aos diferentes use cases do DUT. |
| Interface | Define sinais de input-output a serem dirigidos e monitorados. |
| Driver | Dirige os estímulos gerados para os sinais de entrada do DUT. |
| Monitor | Monitora sinais de input-output para capturar atividade do design. |
| Scoreboard | Compara a resposta do DUT com a resposta esperada. |
| Environment | Contém todos os módulos/componentes do testbench. |
| Test | Define condições reais para invocar os componentes do testbench e criar use cases. |
| DUT | Design under test; também chamado DUV — design under verification — durante a verificação. |

Interpretação:

O testbench é dividido por responsabilidades. Isso torna o ambiente mais modular, mais reutilizável e mais fácil de debugar.

---

### Slide 3 — SystemVerilog Testbench Components

O slide detalha os componentes principais de um testbench SystemVerilog.

#### Interface

Pontos principais:

- Designs complexos contêm milhares de sinais de I/O.
- Conectar todos manualmente se torna trabalhoso e propenso a erro.
- Reuso e manutenção ficam difíceis.
- SystemVerilog permite encapsular esses sinais em uma interface.
- O DUT é dirigido e monitorado usando a interface.

Interpretação:

A interface é o ponto de contato entre testbench e DUT. Ela agrupa sinais físicos, como `valid`, `addr`, `data`, `ready`, `reset`, `clock`, etc.

#### Driver

Pontos principais:

- Dirige estímulos para o DUT usando tarefas definidas na interface.
- Invoca tasks da interface com timing específico.
- Fornece flexibilidade e escalabilidade por operar em nível transacional.
- É reutilizável entre testbenches, pois a transação de sinais nos pinos fica escondida.

Interpretação:

O driver recebe uma transação abstrata, como “escreva dado X no endereço Y”, e a transforma em sinais reais na interface.

#### Stimulus generator

Pontos principais:

- Gera dados válidos a serem enviados ao DUT.
- Objetos de classe gerados por generator module.
- O driver recebe esses dados e transaciona com a interface para entregar ao DUT.

Interpretação:

O generator pensa em transações. O driver pensa em pinos.

#### Monitor

Pontos principais:

- As respostas do DUT estão nos sinais de output definidos na interface.
- O monitor coleta essas transações da interface e cria data objects.
- Depois, envia os data objects para o scoreboard.

Interpretação:

O monitor faz o caminho inverso do driver: transforma atividade de sinais em objetos de alto nível.

#### Scoreboard

Pontos principais:

- Pode ter um reference model do DUT representando o comportamento esperado.
- O estímulo enviado ao DUT também é enviado ao reference model para gerar a resposta esperada.
- A saída do DUT é comparada com a saída esperada no scoreboard.

Interpretação:

O scoreboard é o juiz do testbench. Ele decide se o DUT passou ou falhou.

#### Environment

Ponto principal:

- Torna o testbench reutilizável entre módulos, top-level designs e projetos.

#### Test

Ponto principal:

- Instancia o environment e dirige o cenário necessário configurando o ambiente de forma específica.

---

### Slide 4 — SystemVerilog Testbench Example: DUT

O slide mostra o modelo do DUT usado como exemplo.

O DUT parece ser um módulo chamado `switch`, parametrizado por:

- `ADDR_WIDTH`
- `DATA_WIDTH`
- `ADDR_DIV`

Entradas principais:

- `clk`
- `rstn`
- `vld`
- `addr`
- `data`

Saídas principais:

- `addr_a`
- `data_a`
- `addr_b`
- `data_b`

Comportamento conceitual:

- Em reset, as saídas são zeradas.
- Quando `vld` está ativo, o DUT verifica o endereço.
- Se o endereço pertence a uma faixa, encaminha o pacote para o canal A.
- Caso contrário, encaminha para o canal B.

Exemplo didático reconstruído:

```systemverilog
module switch #(
  parameter ADDR_WIDTH = 8,
  parameter DATA_WIDTH = 16,
  parameter ADDR_DIV   = 8'h3F
)(
  input  logic clk,
  input  logic rstn,
  input  logic vld,

  input  logic [ADDR_WIDTH-1:0] addr,
  input  logic [DATA_WIDTH-1:0] data,

  output logic [ADDR_WIDTH-1:0] addr_a,
  output logic [DATA_WIDTH-1:0] data_a,

  output logic [ADDR_WIDTH-1:0] addr_b,
  output logic [DATA_WIDTH-1:0] data_b
);

  always_ff @(posedge clk) begin
    if (!rstn) begin
      addr_a <= '0;
      data_a <= '0;
      addr_b <= '0;
      data_b <= '0;
    end
    else begin
      if (vld) begin
        if (addr <= ADDR_DIV) begin
          addr_a <= addr;
          data_a <= data;
        end
        else begin
          addr_b <= addr;
          data_b <= data;
        end
      end
    end
  end

endmodule
```

Interpretação:

O exemplo é simples, mas bom para testbench porque permite verificar roteamento: conforme o endereço, o pacote deve aparecer no canal A ou no canal B.

---

### Slide 5 — SystemVerilog Testbench Example: Generator

O slide mostra duas partes:

- transaction object;
- generator.

#### Transaction object

O objeto de transação representa os dados que serão gerados e passados para o DUT.

Campos visíveis/conceituais:

- `rand bit [7:0] addr;`
- `rand bit [15:0] data;`
- sinais ou campos para saídas esperadas, como:
  - `addr_a`
  - `data_a`
  - `addr_b`
  - `data_b`

Exemplo didático:

```systemverilog
class switch_item;
  rand bit [7:0]  addr;
  rand bit [15:0] data;

  bit [7:0]  addr_a;
  bit [15:0] data_a;
  bit [7:0]  addr_b;
  bit [15:0] data_b;

  function void display(string name = "item");
    $display("[%0s] addr=%0h data=%0h addr_a=%0h data_a=%0h addr_b=%0h data_b=%0h",
             name, addr, data, addr_a, data_a, addr_b, data_b);
  endfunction
endclass
```

Interpretação:

A classe `switch_item` encapsula uma transação. Em vez de passar vários sinais separados, o testbench passa um objeto com todos os dados relacionados.

#### Generator

O generator cria transações randômicas e as envia ao driver por uma mailbox.

Elementos principais do slide:

- mailbox para comunicação com driver;
- event para sincronizar quando o driver terminou;
- número de itens a gerar;
- loop `for`;
- criação de item com `new`;
- randomização com `randomize`;
- envio por mailbox com `put`;
- espera por evento do driver.

Exemplo didático:

```systemverilog
class generator;
  mailbox drv_mbx;
  event drv_done;
  int num = 20;

  task run();
    for (int i = 0; i < num; i++) begin
      switch_item item = new();

      assert(item.randomize())
        else $fatal("Randomization failed");

      item.display($sformatf("Generator item %0d", i));

      drv_mbx.put(item);

      @(drv_done);
    end

    $display("[Generator] Done generation of %0d items", num);
  endtask
endclass
```

Interpretação:

O generator não dirige sinais do DUT diretamente. Ele gera objetos e entrega ao driver. Essa separação é central em testbenches modernos.

---

### Slide 6 — SystemVerilog Testbench Example: Driver

O driver recebe itens da mailbox e aplica no DUT usando a interface virtual.

Elementos principais do slide:

- `virtual switch_if vif;`
- `event drv_done;`
- `mailbox drv_mbx;`
- task `run`;
- espera de clock;
- loop infinito;
- `drv_mbx.get(item);`
- direção dos sinais:
  - `vif.vld <= 1;`
  - `vif.addr <= item.addr;`
  - `vif.data <= item.data;`
- ao final, desativa `vld`;
- dispara evento `-> drv_done`.

Exemplo didático:

```systemverilog
class driver;
  virtual switch_if vif;
  event drv_done;
  mailbox drv_mbx;

  task run();
    $display("[%0t] [Driver] starting...", $time);

    @(posedge vif.clk);

    forever begin
      switch_item item;

      $display("[%0t] [Driver] waiting for item...", $time);

      drv_mbx.get(item);

      item.display("Driver");

      vif.vld  <= 1'b1;
      vif.addr <= item.addr;
      vif.data <= item.data;

      @(posedge vif.clk);

      vif.vld <= 1'b0;

      -> drv_done;
    end
  endtask
endclass
```

Interpretação:

O driver é o tradutor entre o mundo abstrato e o mundo físico. Ele recebe uma transação e gera atividade nos sinais da interface.

---

### Slide 7 — SystemVerilog Testbench Example: Scoreboard

O scoreboard compara a resposta do DUT com a resposta esperada.

Pontos principais do slide:

- O scoreboard é responsável por checar a integridade dos dados.
- Como o design roteia pacotes com base em faixa de endereço, o scoreboard verifica se o endereço do item está dentro da faixa válida.
- Se o item deveria ir para A, compara `addr_a` e `data_a`.
- Se o item deveria ir para B, compara `addr_b` e `data_b`.
- Usa mensagens `PASS` e `FAIL`.

Exemplo didático:

```systemverilog
class scoreboard;
  mailbox scb_mbx;
  localparam bit [7:0] ADDR_DIV = 8'h3F;

  task run();
    forever begin
      switch_item item;

      scb_mbx.get(item);

      if (item.addr <= ADDR_DIV) begin
        if ((item.addr_a == item.addr) && (item.data_a == item.data)) begin
          $display("[%0t] [Scoreboard] PASS: canal A addr=%0h data=%0h",
                   $time, item.addr, item.data);
        end
        else begin
          $display("[%0t] [Scoreboard] FAIL: canal A expected addr=%0h data=%0h got addr=%0h data=%0h",
                   $time, item.addr, item.data, item.addr_a, item.data_a);
        end
      end
      else begin
        if ((item.addr_b == item.addr) && (item.data_b == item.data)) begin
          $display("[%0t] [Scoreboard] PASS: canal B addr=%0h data=%0h",
                   $time, item.addr, item.data);
        end
        else begin
          $display("[%0t] [Scoreboard] FAIL: canal B expected addr=%0h data=%0h got addr=%0h data=%0h",
                   $time, item.addr, item.data, item.addr_b, item.data_b);
        end
      end
    end
  endtask
endclass
```

Interpretação:

O scoreboard conhece a regra funcional do DUT. Ele não precisa saber todos os detalhes do RTL, mas precisa saber o comportamento esperado.

---

### Slide 8 — SystemVerilog Testbench Example: Environment

O environment é um container que guarda todos os componentes do testbench.

Elementos visíveis no slide:

- `driver`
- `monitor`
- `generator`
- `scoreboard`
- mailboxes:
  - generator para driver;
  - monitor para scoreboard;
- eventos de sincronização;
- interface virtual;
- método `new`;
- task `run`;
- execução concorrente dos componentes.

Exemplo didático:

```systemverilog
class environment;
  driver     d0;
  monitor    m0;
  generator  g0;
  scoreboard s0;

  mailbox drv_mbx;
  mailbox scb_mbx;

  event drv_done;

  virtual switch_if vif;

  function new(virtual switch_if vif);
    this.vif = vif;

    drv_mbx = new();
    scb_mbx = new();

    d0 = new();
    m0 = new();
    g0 = new();
    s0 = new();

    d0.vif = vif;
    m0.vif = vif;

    d0.drv_mbx = drv_mbx;
    g0.drv_mbx = drv_mbx;

    m0.scb_mbx = scb_mbx;
    s0.scb_mbx = scb_mbx;

    d0.drv_done = drv_done;
    g0.drv_done = drv_done;
  endfunction

  task run();
    fork
      d0.run();
      m0.run();
      g0.run();
      s0.run();
    join_any
  endtask
endclass
```

Interpretação:

O environment organiza o testbench para que o test possa apenas configurar e rodar o ambiente. Isso é o início da mentalidade UVM, mesmo que ainda não seja UVM.

---

### Slide 9 — SystemVerilog Testbench Example: Test

O test instancia o environment e inicia sua execução.

Elementos do slide:

- classe `test`;
- handle para `environment`;
- método `new`;
- task `run`;
- instanciação da interface virtual;
- chamada de `env.run()`.

Exemplo didático:

```systemverilog
class test;
  environment env;

  function new(virtual switch_if vif);
    env = new(vif);
  endfunction

  task run();
    env.run();
  endtask
endclass
```

O slide também mostra a interface do exemplo:

```systemverilog
interface switch_if (input bit clk);
  logic        rstn;
  logic        vld;
  logic [7:0]  addr;
  logic [15:0] data;

  logic [7:0]  addr_a;
  logic [15:0] data_a;
  logic [7:0]  addr_b;
  logic [15:0] data_b;
endinterface
```

Interpretação:

O test é o cenário. Ele decide como o environment será configurado e quais condições serão exercitadas.

---

### Slide 10 — SystemVerilog Testbench Example: Testbench_top

O `testbench_top` instancia o DUT, a interface e o test.

Elementos principais:

- `module tb;`
- clock;
- interface;
- DUT;
- test;
- reset;
- dump de waveform;
- execução da simulação.

Exemplo didático:

```systemverilog
module tb;
  bit clk;

  always #10 clk = ~clk;

  switch_if _if (clk);

  switch dut (
    .clk   (clk),
    .rstn  (_if.rstn),
    .vld   (_if.vld),
    .addr  (_if.addr),
    .data  (_if.data),
    .addr_a(_if.addr_a),
    .data_a(_if.data_a),
    .addr_b(_if.addr_b),
    .data_b(_if.data_b)
  );

  test t0;

  initial begin
    clk = 0;
    _if.rstn = 0;

    #20 _if.rstn = 1;

    t0 = new(_if);
    t0.run();
  end

  initial begin
    $dumpvars;
    $dumpfile("dump.vcd");
  end
endmodule
```

Interpretação:

O `tb_top` é o topo da simulação. Ele conecta o mundo do design e o mundo das classes de verificação.

---

### Slide 11 — SystemVerilog Data Types (1)

O slide apresenta tipos de dados.

Pontos principais:

- SystemVerilog suporta todos os tipos de dados de Verilog.
- Define novos tipos de dados.
- A tabela mostra tipos já suportados por Verilog e novos tipos suportados por SystemVerilog.

Tabela reconstruída:

| Data type | 2/4-state | Bitwidth | Signed/unsigned | C equivalent |
|---|---:|---:|---|---|
| `reg` | 4 | >=1 | — | — |
| `wire` | 4 | >=1 | — | — |
| `real` | — | — | — | double |
| `integer` | 4 | 32 | signed | — |
| `time` | — | — | — | — |
| `realtime` | — | — | — | double |
| `logic` | 4 | >=1 | unsigned | — |
| `bit` | 2 | >=1 | unsigned | — |
| `byte` | 2 | 8 | signed | char |
| `shortint` | 2 | 16 | signed | shortint |
| `int` | 2 | 32 | signed | int |
| `longint` | 2 | 64 | signed | longint |
| `shortreal` | — | — | — | float |

Interpretação:

A diferença entre tipos 2-state e 4-state é fundamental:

```text
2-state: 0 e 1
4-state: 0, 1, X e Z
```

Tipos como `bit`, `byte`, `int`, `longint` são 2-state e mais parecidos com software. Tipos como `logic`, `reg`, `wire` são 4-state e representam melhor incertezas de hardware.

---

### Slide 12 — SystemVerilog Data Types (2)

O slide foca em strings.

Pontos principais:

- SystemVerilog suporta operações com string disponíveis em Verilog.
- Também suporta formatação amigável usando `%s`.
- O tamanho da string pode ser dinâmico e variar durante a simulação.
- Não ocorre truncamento no uso de string.
- Funções de string são chamadas usando o operador ponto.
- SystemVerilog também suporta funções de conversão de string.

Métodos de string mostrados:

| Método | Descrição |
|---|---|
| `len()` | Retorna número de caracteres da string. |
| `putc(i, c)` | Substitui o caractere na posição `i` pelo caractere dado. |
| `getc(i)` | Retorna o código ASCII do caractere na posição `i`. |
| `tolower()` | Retorna string convertida para minúsculas. |
| `compare(s)` | Compara strings como função `strcmp` do C. |
| `icompare(s)` | Compara ignorando maiúsculas/minúsculas. |
| `substr(i, j)` | Retorna substring da posição `i` até `j`. |

Exemplo:

```systemverilog
module tb;
  string mystring = "Hello";

  initial begin
    $display("%s", mystring);

    mystring.putc(0, "h");
    $display("%s", mystring);

    $display("len=%0d", mystring.len());
  end
endmodule
```

Interpretação:

Strings são úteis para logs, nomes de testes, mensagens de erro e construção de relatórios no testbench.

---

### Slide 13 — SystemVerilog Arrays

O slide apresenta tipos de arrays em SystemVerilog.

Pontos principais:

- SystemVerilog oferece várias system functions para manipulação de arrays.
- Essas funções ajudam a construir testbenches complexos.

#### Static arrays

Tamanho conhecido antes da compilação.

Tipos:

- packed;
- unpacked.

Exemplo:

```systemverilog
bit [7:0] packed_data;      // packed
int mem [0:15];             // unpacked
```

#### Dynamic arrays

Tamanho desconhecido em compilação, definido e expandido conforme a necessidade.

Características:

- armazenados em heap;
- reconhecidos por colchetes vazios `[]`.

Exemplo:

```systemverilog
int dyn_array[];

initial begin
  dyn_array = new[16];
end
```

#### Associative arrays

Armazenam conteúdo com uma tag ou key em colchetes `[]`.

Exemplos:

```systemverilog
int memory[int];
int score[string];

initial begin
  memory[1000] = 32'h1234;
  score["test1"] = 95;
end
```

#### Queues

Estruturas cujos elementos podem ser inseridos ou removidos dinamicamente.

Exemplo:

```systemverilog
int q[$];

initial begin
  q.push_back(10);
  q.push_back(20);
  $display("%0d", q.pop_front());
end
```

Interpretação:

Arrays dinâmicos, associativos e queues são essenciais para testbenches, principalmente para armazenar transações, expected results, logs, filas e scoreboards.

---

### Slide 14 — SystemVerilog Methods for Array Manipulations (1)

O slide apresenta métodos de busca em arrays usando a cláusula `with`.

Métodos listados:

| Método | Descrição |
|---|---|
| `find()` | Retorna todos os elementos que satisfazem a expressão. |
| `find_index()` | Retorna os índices dos elementos que satisfazem a expressão. |
| `find_first()` | Retorna o primeiro elemento que satisfaz a expressão. |
| `find_first_index()` | Retorna o índice do primeiro elemento que satisfaz a expressão. |
| `find_last()` | Retorna o último elemento que satisfaz a expressão. |
| `find_last_index()` | Retorna o índice do último elemento que satisfaz a expressão. |
| `min()` | Retorna o menor elemento. |
| `max()` | Retorna o maior elemento. |
| `unique()` | Retorna valores únicos. |
| `unique_index()` | Retorna índices únicos. |

O slide destaca:

- Funções sem cláusula `with`:
  - `min()`
  - `max()`
  - `unique()`
  - `unique_index()`

Exemplo:

```systemverilog
module tb;
  int array[] = '{4, 7, 3, 5, 7, 2, 6, 5, 1};
  int res[$];

  initial begin
    res = array.find() with (item > 5);
    $display("find item > 5: %p", res);

    res = array.find_last() with (item < 5);
    $display("find_last item < 5: %p", res);

    res = array.max();
    $display("max: %p", res);
  end
endmodule
```

Interpretação:

`find_last()` precisa de uma condição para saber “último elemento que satisfaz o quê?”. Já `max()` não precisa de condição, porque o critério é implícito: maior valor.

---

### Slide 15 — SystemVerilog Methods for Array Manipulations (2)

O slide apresenta métodos de ordenação e redução.

#### Array ordering methods

Métodos:

- `reverse()`
- `sort()`
- `rsort()`
- `shuffle()`

Exemplo:

```systemverilog
int array[] = '{4, 7, 3, 5, 7, 2, 6, 5, 1};

initial begin
  array.reverse();
  $display("reverse: %p", array);

  array.sort();
  $display("sort: %p", array);

  array.rsort();
  $display("rsort: %p", array);

  array.shuffle();
  $display("shuffle: %p", array);
end
```

#### Array reduction methods

Métodos:

- `sum()`
- `product()`
- `and()`
- `or()`
- `xor()`

Exemplo:

```systemverilog
int array[] = '{1, 2, 3, 4};

initial begin
  $display("sum     = %0d", array.sum());
  $display("product = %0d", array.product());
  $display("and     = %0d", array.and());
  $display("or      = %0d", array.or());
  $display("xor     = %0d", array.xor());
end
```

Interpretação:

Esses métodos economizam muito código em testbenches e scoreboards. Em vez de escrever loops manuais para ordenar, buscar ou reduzir dados, o SystemVerilog oferece métodos prontos.

---

### Slide 16 — SystemVerilog Looping Constructs

O slide lista loops suportados em SystemVerilog.

Tabela reconstruída:

| Construct | Descrição |
|---|---|
| `forever` | Executa o conjunto de statements para sempre. |
| `repeat` | Repete o conjunto de statements um número determinado de vezes. |
| `while` | Repete enquanto a condição for verdadeira. |
| `for` | Similar ao `while`, mas mais compacto e popular. |
| `do while` | Executa pelo menos uma vez e depois repete enquanto a condição for verdadeira. |
| `foreach` | Usado principalmente para iterar por todos os elementos de um array. |

Exemplos:

```systemverilog
forever begin
  @(posedge clk);
end
```

```systemverilog
repeat (10) begin
  send_transaction();
end
```

```systemverilog
foreach (array[i]) begin
  $display("array[%0d]=%0d", i, array[i]);
end
```

Interpretação:

Em testbench, loops são usados para gerar muitos estímulos, percorrer arrays, repetir cenários e executar processos contínuos como monitores.

---

### Slide 17 — SystemVerilog Communication

O slide apresenta constructs de comunicação entre componentes de testbench.

Componentes:

- events;
- semaphores;
- mailbox.

#### Events

Pontos principais:

- Diferentes threads sincronizam entre si por event handles no testbench.
- Sincroniza dois ou mais processos.
- O operador `->` pode ser usado para ativar/disparar o evento.

Exemplo:

```systemverilog
event done;

initial begin
  #100;
  -> done;
end

initial begin
  @done;
  $display("Evento done recebido");
end
```

#### Semaphores

Pontos principais:

- Threads diferentes podem precisar acessar o mesmo recurso.
- Elas se revezam usando um semaphore.
- Usado para compartilhamento exclusivo de recurso entre componentes.
- Um objeto semaphore é declarado e criado com `new`.
- O argumento em `new` define o número de chaves.
- Usa `get()` e `put()` para pegar e devolver chaves.

Exemplo:

```systemverilog
semaphore sem = new(1);

initial begin
  sem.get(1);
  // região crítica
  sem.put(1);
end
```

#### Mailbox

Pontos principais:

- Threads/componentes precisam trocar dados.
- Dados são colocados em uma mailbox e enviados.
- Mailbox é um canal dedicado para transferir dados entre componentes.
- Generator e driver podem se comunicar através de mailbox.
- Generator pode empurrar dados; driver pode acessar dados pela mailbox.

Exemplo:

```systemverilog
mailbox mbx = new();

initial begin
  mbx.put(item);
end

initial begin
  mbx.get(item);
end
```

Interpretação:

- Event sincroniza.
- Semaphore controla recurso compartilhado.
- Mailbox transporta dados entre componentes.

---

### Slide 18 — SystemVerilog Communication: Semaphore Example

O slide mostra um exemplo com `semaphore`.

Ideia do exemplo:

- Cria-se um semaphore chamado `rooms`, com quantidade limitada de tokens/chaves.
- Diferentes pessoas/processos tentam pegar a sala.
- Quem pega a chave usa o recurso.
- Depois devolve a chave com `put`.

Exemplo didático:

```systemverilog
module tb;
  semaphore rooms;

  initial begin
    rooms = new(1); // apenas uma chave disponível

    fork
      personA();
      personB();
    join
  end

  task personA();
    $display("[%0t] A tenta pegar sala", $time);
    rooms.get(1);
    $display("[%0t] A entrou na sala", $time);

    #50;

    $display("[%0t] A saiu da sala", $time);
    rooms.put(1);
  endtask

  task personB();
    #10;
    $display("[%0t] B tenta pegar sala", $time);
    rooms.get(1);
    $display("[%0t] B entrou na sala", $time);

    #20;

    $display("[%0t] B saiu da sala", $time);
    rooms.put(1);
  endtask
endmodule
```

Interpretação:

Semaphore não é um canal de dados. Ele é um controle de acesso. Ele responde à pergunta:

```text
quem pode usar este recurso agora?
```

---

### Slide 19 — SystemVerilog Communication: Mailbox Example

O slide mostra comunicação entre generator e driver usando mailbox.

Estrutura conceitual:

- Classe de dados:
  - objeto enviado.
- Generator:
  - cria transações;
  - coloca na mailbox com `put`.
- Driver:
  - espera transações;
  - retira da mailbox com `get`.
- Environment:
  - conecta generator e driver com a mesma mailbox.

Exemplo didático:

```systemverilog
class Data;
  rand bit [7:0] value;

  function void display(string name);
    $display("[%s] value=%0h", name, value);
  endfunction
endclass

class Generator;
  mailbox mbx;

  function new(mailbox mbx);
    this.mbx = mbx;
  endfunction

  task run();
    Data tr;

    repeat (5) begin
      tr = new();
      assert(tr.randomize());

      tr.display("Generator");
      mbx.put(tr);
    end
  endtask
endclass

class Driver;
  mailbox mbx;

  function new(mailbox mbx);
    this.mbx = mbx;
  endfunction

  task run();
    Data tr;

    forever begin
      mbx.get(tr);
      tr.display("Driver");
    end
  endtask
endclass
```

Environment:

```systemverilog
class Env;
  mailbox mbx;
  Generator gen;
  Driver drv;

  function new();
    mbx = new();
    gen = new(mbx);
    drv = new(mbx);
  endfunction

  task run();
    fork
      gen.run();
      drv.run();
    join
  endtask
endclass
```

Interpretação:

A mailbox é o canal de comunicação. O generator **pushes** data para a mailbox. O driver **pops** data da mailbox.

---

### Slide 20 — Questões 1 e 2

#### Questão 1

**Questão:** All testbench components can access shared data through dedicated channel using a semaphore.

Alternativas:

- True
- False

**Resposta correta:** False.

**Tradução:** Todos os componentes do testbench podem acessar dados compartilhados por um canal dedicado usando um semaphore.

**Justificativa:** O canal dedicado para transferir dados entre componentes é a **mailbox**. O **semaphore** controla acesso a recurso compartilhado, mas não é o mecanismo principal para envio de dados. Portanto, a afirmação é falsa.

---

#### Questão 2

**Questão:** Generator ______ the data to/from the mailbox.

Alternativas:

- A. Pushes and pops
- B. Pops
- C. Pushes

**Resposta correta:** C. Pushes.

**Tradução:** O generator empurra/envia os dados para a mailbox.

**Justificativa:** No padrão mostrado na aula, o generator cria transações e usa `mailbox.put(...)` para colocá-las na mailbox. O driver é quem retira com `get`.

---

### Slide 21 — Questões 3, 4 e 5

#### Questão 3

**Questão:** Driver ______ the data to/from mailbox.

Alternativas:

- A. Pushes
- B. Pops
- C. Pushes and pops

**Resposta correta:** B. Pops.

**Tradução:** O driver retira os dados da mailbox.

**Justificativa:** O driver consome transações geradas pelo generator. Ele usa `mailbox.get(...)`, ou seja, retira/puxa dados da mailbox.

---

#### Questão 4

**Questão:** Among `find_last()` and `max()`, ______ requires `with` clause mandatorily.

Alternativas:

- A. `find_last()`
- B. `max()`
- C. Both of them

**Resposta correta:** A. `find_last()`.

**Tradução:** Entre `find_last()` e `max()`, `find_last()` exige obrigatoriamente a cláusula `with`.

**Justificativa:** `find_last()` precisa de uma condição para definir “último elemento que satisfaz o quê?”. Já `max()` tem critério implícito: retornar o maior valor.

Exemplo:

```systemverilog
res = array.find_last() with (item < 5);
res = array.max();
```

---

#### Questão 5

**Questão:** ______ is used to trigger the created event.

Alternativas:

- A. `|->`
- B. `!=`
- C. `->`

**Resposta correta:** C. `->`.

**Tradução:** `->` é usado para disparar o evento criado.

**Justificativa:** Em SystemVerilog, eventos são disparados usando o operador `->`.

Exemplo:

```systemverilog
event done;

initial begin
  -> done;
end
```

---

## Aula didática desenvolvida

### 1. O salto mental: de testbench simples para ambiente modular

Em Verilog clássico, era comum escrever um testbench assim:

```systemverilog
initial begin
  rst = 0;
  #10 rst = 1;
  addr = 8'h10;
  data = 16'hABCD;
  vld = 1;
end
```

Isso funciona para exemplos pequenos. Mas não escala.

Quando o design fica maior, o testbench precisa virar um ambiente organizado:

```text
generator → driver → interface → DUT → monitor → scoreboard
```

Cada componente tem uma responsabilidade clara.

Isso permite:

- reuso;
- debug mais fácil;
- geração randômica;
- checagem automática;
- cobertura;
- separação entre estímulo, protocolo e verificação.

---

### 2. Transaction object: o dado vira objeto

Um transaction object representa uma operação em alto nível.

Em vez de pensar:

```text
vld = 1
addr = 8'h10
data = 16'hCAFE
```

o testbench pensa:

```text
transação: enviar data=16'hCAFE para addr=8'h10
```

Código:

```systemverilog
class switch_item;
  rand bit [7:0]  addr;
  rand bit [15:0] data;
endclass
```

Esse objeto é mais fácil de randomizar, imprimir, passar entre componentes e comparar no scoreboard.

---

### 3. Generator: produtor de transações

O generator é quem cria estímulos.

Ele pode gerar:

- casos dirigidos;
- casos randômicos;
- casos com constraints;
- sequências longas;
- cenários de corner case.

Exemplo:

```systemverilog
switch_item item = new();
item.randomize();
drv_mbx.put(item);
```

O generator não precisa saber como os sinais serão dirigidos no DUT. Essa é a função do driver.

---

### 4. Mailbox: ponte entre generator e driver

A mailbox é um canal de comunicação entre processos/classes.

Generator:

```systemverilog
drv_mbx.put(item);
```

Driver:

```systemverilog
drv_mbx.get(item);
```

A mailbox desacopla os componentes.

Sem mailbox, o generator teria que chamar diretamente o driver. Com mailbox, o generator apenas deposita transações e o driver consome no seu ritmo.

Padrão mental:

```text
generator pushes
driver pops
```

Esse padrão aparece nas questões de prova.

---

### 5. Driver: conversor de transação em sinais

O driver pega a transação:

```systemverilog
item.addr
item.data
```

e aplica na interface:

```systemverilog
vif.vld  <= 1'b1;
vif.addr <= item.addr;
vif.data <= item.data;
```

O driver conhece o protocolo temporal:

```text
quando ativar valid
por quantos ciclos manter
quando desativar
quando sinalizar fim
```

Isso separa a geração de dados da aplicação do protocolo.

---

### 6. Virtual interface

Classes não são módulos. Uma classe não pode se conectar fisicamente a portas como um módulo faz.

Por isso usamos **virtual interface**.

```systemverilog
virtual switch_if vif;
```

A interface real é criada no `tb_top`:

```systemverilog
switch_if _if(clk);
```

Depois o handle é passado para as classes:

```systemverilog
t0 = new(_if);
```

Assim, o driver dentro de uma classe consegue acessar sinais da interface.

Resumo:

```text
interface real → existe no mundo do hardware/simulação
virtual interface → handle usado por classes para acessar essa interface
```

---

### 7. Monitor: transformando sinais em objetos

O monitor observa a interface:

```systemverilog
vif.addr_a
vif.data_a
vif.addr_b
vif.data_b
```

e reconstrói um objeto:

```systemverilog
switch_item item = new();
item.addr_a = vif.addr_a;
item.data_a = vif.data_a;
```

Depois envia para o scoreboard:

```systemverilog
scb_mbx.put(item);
```

O monitor não decide se está certo ou errado. Ele apenas observa e empacota a atividade do DUT.

---

### 8. Scoreboard: o juiz funcional

O scoreboard recebe:

- a transação esperada;
- a resposta observada;
- ou uma transação enriquecida pelo monitor.

Ele compara.

Para o DUT de switch:

```text
se addr <= ADDR_DIV → deve ir para canal A
se addr > ADDR_DIV  → deve ir para canal B
```

Se o DUT mandar para o canal errado, o scoreboard reporta `FAIL`.

O scoreboard é o componente que transforma simulação em verificação automática.

---

### 9. Environment: container do testbench

O environment junta todos os componentes:

```text
generator
driver
monitor
scoreboard
mailboxes
events
virtual interface
```

Ele também conecta tudo:

```text
generator → mailbox → driver
monitor → mailbox → scoreboard
driver ↔ event ↔ generator
```

Sem environment, o test ficaria cheio de detalhes de conexão.

Com environment, o test apenas configura e roda.

---

### 10. Test: o cenário

O test define o cenário de verificação.

Exemplos de possíveis tests:

```text
teste com 20 transações randômicas
teste só com endereços baixos
teste só com endereços altos
teste alternando A e B
teste com reset no meio
teste com dados extremos
```

Cada test pode reutilizar o mesmo environment, mudando apenas configuração e cenário.

---

### 11. `tb_top`: onde design e verificação se encontram

O `tb_top` é o topo da simulação.

Ele instancia:

```text
clock
interface
DUT
test
dump de waveform
reset
```

Esse é o ponto de conexão entre:

```text
mundo RTL → DUT/interface
mundo OOP → test/environment/classes
```

---

### 12. Tipos 2-state versus 4-state

SystemVerilog tem tipos 2-state e 4-state.

#### 4-state

Valores possíveis:

```text
0, 1, X, Z
```

Exemplos:

```systemverilog
logic
reg
wire
integer
```

Útil para simular hardware real, onde pode haver desconhecido e alta impedância.

#### 2-state

Valores possíveis:

```text
0, 1
```

Exemplos:

```systemverilog
bit
byte
shortint
int
longint
```

Útil para testbench e modelagem de software, pois simula mais rápido e evita propagação de `X`.

Cuidado:

```text
2-state pode esconder problemas de X/Z.
4-state é mais fiel ao hardware.
```

---

### 13. Strings em testbench

Strings são muito usadas para logs.

Exemplo:

```systemverilog
string testname = "random_switch_test";

$display("Starting %s", testname);
```

Métodos como `len()`, `tolower()`, `compare()` e `substr()` ajudam a manipular nomes de testes, mensagens e arquivos.

Strings não são RTL sintetizável comum. São recursos de simulação/testbench.

---

### 14. Arrays estáticos, dinâmicos, associativos e queues

#### Static array

Use quando o tamanho é conhecido:

```systemverilog
int hist[16];
```

#### Dynamic array

Use quando o tamanho será decidido em runtime:

```systemverilog
int data[];
data = new[packet_count];
```

#### Associative array

Use quando os índices são esparsos ou simbólicos:

```systemverilog
int expected_by_addr[int];
int pass_count_by_test[string];
```

Muito útil para scoreboards.

#### Queue

Use como fila:

```systemverilog
Transaction q[$];

q.push_back(tr);
tr = q.pop_front();
```

Muito útil para guardar transações em ordem.

---

### 15. Métodos de array com `with`

Métodos como `find`, `find_first`, `find_last` precisam saber a condição.

Exemplo:

```systemverilog
res = array.find_last() with (item < 5);
```

Sem `with`, a pergunta fica incompleta:

```text
último elemento que satisfaz qual condição?
```

Já `max()` não precisa:

```systemverilog
res = array.max();
```

O critério já é “maior valor”.

---

### 16. Métodos de ordenação e redução

Ordenação:

```systemverilog
array.sort();
array.rsort();
array.reverse();
array.shuffle();
```

Redução:

```systemverilog
array.sum();
array.product();
array.and();
array.or();
array.xor();
```

Esses métodos são muito úteis em testbenches porque reduzem código manual e erros.

---

### 17. Events: sincronização simples

Event serve para avisar que algo aconteceu.

```systemverilog
event done;

-> done;  // dispara
@done;   // espera
```

No exemplo do testbench, o driver dispara `drv_done` quando termina de aplicar uma transação. O generator espera esse evento antes de mandar a próxima.

Isso cria uma sincronização simples:

```text
generator envia item
driver aplica item
driver dispara done
generator envia próximo
```

---

### 18. Semaphore: controle de recurso compartilhado

Semaphore não transporta dados. Ele controla acesso.

Exemplo mental:

```text
há uma sala com uma chave
quem pega a chave entra
os outros esperam
quem sai devolve a chave
```

Em SystemVerilog:

```systemverilog
sem.get(1);
  // usa recurso
sem.put(1);
```

Use semaphore quando vários processos precisam acessar o mesmo recurso sem conflito.

---

### 19. Mailbox: canal de dados

Mailbox transporta objetos.

```systemverilog
mbx.put(tr); // envia
mbx.get(tr); // recebe
```

Ela é perfeita para:

```text
generator → driver
monitor → scoreboard
producer → consumer
```

Por isso a questão “shared data through dedicated channel using semaphore” é falsa. O canal dedicado é mailbox.

---

## Conceitos difíceis explicados em profundidade

### 1. Por que separar generator e driver?

Porque gerar o conteúdo da transação e aplicar o protocolo são tarefas diferentes.

Generator:

```text
qual endereço?
qual dado?
quantas transações?
quais constraints?
```

Driver:

```text
em qual ciclo ativar valid?
quando colocar addr e data?
quando desativar valid?
como respeitar reset e clock?
```

Separar isso permite reutilizar o driver com muitos generators diferentes.

---

### 2. Por que o monitor não é checker?

O monitor observa. O checker julga.

Monitor:

```text
captura o que aconteceu
transforma sinais em transação
envia ao scoreboard
```

Scoreboard/checker:

```text
compara com o esperado
decide PASS/FAIL
```

Essa separação evita misturar captura de protocolo com regra funcional.

---

### 3. Por que mailbox é melhor que chamada direta?

Sem mailbox:

```systemverilog
generator chama driver.drive(item)
```

Isso acopla os dois componentes.

Com mailbox:

```text
generator coloca item
driver retira item
```

Eles ficam independentes. O driver pode rodar em seu próprio processo e consumir quando estiver pronto.

Isso é mais parecido com uma arquitetura real de produção/consumo.

---

### 4. Por que usar event junto com mailbox?

Mailbox entrega dados, mas não necessariamente controla o ritmo desejado.

No exemplo, o generator faz:

```systemverilog
drv_mbx.put(item);
@(drv_done);
```

Isso garante que ele só envia o próximo item quando o driver concluiu o anterior.

Sem esse controle, o generator poderia encher a mailbox com muitos itens rapidamente.

---

### 5. Como o scoreboard sabe o esperado?

Há duas formas:

#### Regra simples embutida

Para o switch:

```text
addr <= ADDR_DIV → canal A
addr > ADDR_DIV  → canal B
```

O próprio scoreboard calcula.

#### Reference model

Para um DUT complexo, o scoreboard pode chamar um modelo de referência:

```text
expected = golden_model(input_transaction)
```

Depois compara com o observado.

---

### 6. O papel do environment em relação ao UVM

Este bloco ainda não é UVM, mas já mostra a mesma arquitetura mental:

| Este bloco | UVM |
|---|---|
| generator | sequence / sequencer |
| driver | uvm_driver |
| monitor | uvm_monitor |
| scoreboard | uvm_scoreboard |
| environment | uvm_env |
| transaction object | uvm_sequence_item |
| mailbox | TLM port/export/fifo em UVM |

A aula prepara a base conceitual.

---

### 7. Arrays associativos em scoreboards

Imagine respostas fora de ordem.

Você envia transações com ID:

```systemverilog
expected[id] = transaction;
```

Quando a resposta chega:

```systemverilog
actual = response;
compare(actual, expected[actual.id]);
```

Associative arrays são perfeitos para isso porque você indexa por ID, endereço ou string.

---

### 8. Queue em protocolos ordenados

Se o protocolo garante ordem, uma queue basta.

```systemverilog
expected_q.push_back(expected);
actual = observed_q.pop_front();
```

Isso é comum em FIFOs, streams e pipelines in-order.

---

### 9. `foreach` em arrays

`foreach` é mais seguro que `for` quando você quer iterar sobre todos os elementos de um array.

```systemverilog
foreach (array[i]) begin
  $display("array[%0d]=%0d", i, array[i]);
end
```

Ele respeita os índices reais do array.

---

### 10. `forever` em driver e monitor

Drivers e monitors normalmente rodam para sempre:

```systemverilog
forever begin
  @(posedge clk);
  // observar ou dirigir
end
```

O test termina por outro mecanismo:

- fim do generator;
- timeout;
- `$finish`;
- evento global;
- controle do environment.

---

## Figuras, diagramas e waveforms importantes

### Figura da estrutura típica do testbench

Mostra testbench environment com stimulus generator, driver, interface, DUT, monitor e scoreboard. Essa é a figura central do bloco.

### Tabela de componentes do testbench

Define as funções de stimulus generator, interface, driver, monitor, scoreboard, environment, test e DUT.

### Slide de componentes

Detalha cada componente e destaca o papel da interface, do driver, do generator, do monitor, do scoreboard, do environment e do test.

### DUT model

Mostra o DUT como um roteador/switch simples baseado em endereço, útil para entender como o scoreboard decide canal A ou B.

### Generator

Mostra transaction object e generator com mailbox/event, estabelecendo o padrão produtor-consumidor.

### Driver

Mostra driver usando virtual interface, mailbox e event para aplicar transações ao DUT.

### Scoreboard

Mostra comparação de expected versus observed, imprimindo PASS/FAIL.

### Environment

Mostra a classe que conecta componentes, mailboxes e eventos.

### Test e Testbench_top

Mostram a ponte entre o mundo de classes e o mundo do DUT/interface.

### Data types

Mostra tabela de tipos 2-state e 4-state, incluindo `logic`, `bit`, `byte`, `shortint`, `int`, `longint`.

### Arrays e métodos

Mostra arrays estáticos, dinâmicos, associativos, queues e métodos de busca, ordenação e redução.

### Communication

Mostra a diferença entre events, semaphores e mailbox. Essa parte é central para as questões finais.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **All testbench components can access shared data through dedicated channel using a semaphore. True or false?**  
   Resposta: **False**.

2. **Generator ______ the data to/from the mailbox.**  
   Resposta: **Pushes**.

3. **Driver ______ the data to/from mailbox.**  
   Resposta: **Pops**.

4. **Among `find_last()` and `max()`, ______ requires `with` clause mandatorily.**  
   Resposta: **find_last()**.

5. **______ is used to trigger the created event.**  
   Resposta: **`->`**.

6. **Qual componente gera estímulos?**  
   Resposta: **Stimulus generator**.

7. **Qual componente dirige estímulos para o DUT?**  
   Resposta: **Driver**.

8. **Qual componente monitora sinais do DUT e cria objetos de dados?**  
   Resposta: **Monitor**.

9. **Qual componente compara a resposta do DUT com o esperado?**  
   Resposta: **Scoreboard**.

10. **Qual construct transporta dados entre generator e driver?**  
    Resposta: **Mailbox**.

11. **Qual construct controla acesso a recurso compartilhado?**  
    Resposta: **Semaphore**.

12. **Qual construct sincroniza processos por disparo/espera?**  
    Resposta: **Event**.

13. **Qual operador dispara um evento?**  
    Resposta: **`->`**.

14. **Qual método retira item de uma mailbox?**  
    Resposta: **`get()`**.

15. **Qual método coloca item em uma mailbox?**  
    Resposta: **`put()`**.

16. **Qual tipo de array tem tamanho definido em runtime?**  
    Resposta: **Dynamic array**.

17. **Qual tipo de array usa chave/tag como índice?**  
    Resposta: **Associative array**.

18. **Qual estrutura permite push/pop dinâmico?**  
    Resposta: **Queue**.

### Pegadinhas

- Semaphore não é canal dedicado de dados; mailbox é.
- Generator coloca dados na mailbox; driver retira.
- `find_last()` precisa de `with`; `max()` não.
- `->` dispara evento; `|->` é operador de implicação de assertions; `!=` é comparação de diferença.
- Monitor não é scoreboard.
- Driver não gera transações; driver aplica transações.
- Generator não dirige diretamente pinos do DUT.
- Virtual interface é o handle que permite classes acessarem uma interface real.
- 2-state pode esconder `X/Z`; 4-state representa melhor incertezas de hardware.
- Queues são úteis para ordem; associative arrays são úteis para lookup por chave.
- `forever` é comum em driver/monitor, mas precisa de mecanismo externo para terminar simulação.
- Scoreboard pode embutir regra simples ou usar reference model.

### Frases para memorizar

```text
Generator pushes; driver pops.
Mailbox transporta dados.
Semaphore controla acesso a recurso.
Event sincroniza processos.
-> dispara evento.
Monitor observa; scoreboard compara.
Environment conecta todos os componentes.
Test define o cenário.
Virtual interface permite classes acessarem sinais da interface.
find_last() precisa de with; max() não.
```

---

## Relação com projeto/laboratório

Esta aula é praticamente a base para qualquer testbench SystemVerilog orientado a objetos.

### Estrutura mínima recomendada

```text
tb_top
 ├── interface
 ├── DUT
 └── test
      └── environment
           ├── generator
           ├── driver
           ├── monitor
           └── scoreboard
```

### Arquivos possíveis

```text
switch_if.sv
switch_item.sv
generator.sv
driver.sv
monitor.sv
scoreboard.sv
environment.sv
test.sv
tb_top.sv
switch.sv
```

### Fluxo de execução

```text
tb_top cria interface e DUT
test cria environment
environment cria componentes
generator randomiza transações
generator coloca transações na mailbox
driver retira transações e dirige interface
DUT responde
monitor observa interface
monitor envia observado ao scoreboard
scoreboard compara e imprime PASS/FAIL
```

### Relação com UVM

Este bloco antecipa UVM:

| Conceito deste bloco | Equivalente/continuação em UVM |
|---|---|
| transaction object | `uvm_sequence_item` |
| generator | `uvm_sequence` / `uvm_sequencer` |
| driver | `uvm_driver` |
| monitor | `uvm_monitor` |
| scoreboard | `uvm_scoreboard` |
| environment | `uvm_env` |
| mailbox | TLM FIFO/port/export |
| virtual interface | ainda usado para conectar driver/monitor ao DUT |

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] Código/comandos foram preservados e explicados.
- [x] Questões foram respondidas com tradução, alternativa correta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Roteiro/checklist foi conferido antes de sugerir o próximo bloco.
- [x] O próximo bloco indicado segue a sequência da seção: `04 SystemVerilog for Verification-2`.

---

## Próximo bloco

**Bloco 013 — 04 SystemVerilog for Verification-2**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\04 SystemVerilog for Verification-2.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\04 SystemVerilog for Verification-2.md
```
