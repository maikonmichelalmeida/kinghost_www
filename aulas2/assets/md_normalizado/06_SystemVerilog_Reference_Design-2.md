# 06 SystemVerilog Reference Design-2

## Controle do bloco

- **Bloco:** 015
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\06 SystemVerilog Reference Design-2.docx`
- **Faixa processada:** slides visíveis 1-20, distribuídos em 10 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\06 SystemVerilog Reference Design-2.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. Este arquivo é explicitamente a **parte 2** do reference design de SystemVerilog. O DOCX não mostra uma tela final com o próximo arquivo do curso; portanto, a próxima sugestão não deve ser inferida por nome genérico.
- **Próximo bloco recomendado:** consultar o roteiro fornecido antes de anexar o próximo DOCX. Não sugerir arquivo específico sem confirmar no roteiro.
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: esta é a **parte 2** do reference design. A parte 1 usou um somador de 8 bits; esta parte usa um **Register Array Controller** de 4 KB como DUT.

---

## Resumo executivo

Esta aula continua os **reference designs em SystemVerilog**, agora com um DUT mais interessante que o somador da parte 1: um **Register Array Controller** de 4 KB. O objetivo é mostrar como aplicar a mesma arquitetura de testbench orientada a objetos a um design com comportamento temporal de leitura/escrita.

O DUT é uma matriz de registradores ou memória simples, acessada por endereço. Ele possui:

```text
clock
reset síncrono
write enable
address
write data
read data
select
ready
```

A operação de escrita acontece em um único ciclo de clock quando endereço e dado são fornecidos. A operação de leitura leva um ciclo extra. O sinal `ready` indica quando a matriz está pronta para uma nova operação ou quando o dado lido está válido.

A estrutura de verificação usa os mesmos componentes conceituais do bloco anterior:

```text
reg_item
driver
interface
monitor
scoreboard
environment
test
tb top
VCS
Verdi
Makefile
```

O ponto didático central deste bloco é entender como um testbench SystemVerilog verifica um protocolo simples de memória:

```text
escrever em um endereço
armazenar o valor esperado no scoreboard
ler o mesmo endereço
comparar o dado lido com o valor esperado
detectar erro se a escrita for feita quando ready está baixo
```

O debug proposto pelo slide é exatamente esse: simular o design com bug forçando escrita quando `ready` está baixo, abrir o FSDB no Verdi e identificar o problema.

---

## Texto extraído e organizado por slide

### Slide 1 — Simulation of Design

Para simular um design, é necessário um **testbench**. A estrutura geral do testbench é mostrada na figura do slide.

Componentes principais:

- **DUT — Design Under Test**
- **Stimulus generator**
- **Response checker**

O testbench pode ser desenvolvido usando:

- Verilog;
- VHDL;
- SystemVerilog;
- combinação dessas linguagens.

Para simular, usa-se um simulador como o **VCS**. Para debug, usa-se um ambiente como o **Verdi Debug Environment**.

O slide diferencia dois fluxos:

#### Fluxo de dois passos

Usado quando o DUT é Verilog/SystemVerilog:

```bash
vcs -sverilog -lca [elaboration_options] [design_unit] -l file.log
./simv [simulation_runtime_options] -l file.log
```

#### Fluxo de três passos

Usado quando há DUTs de linguagem mista:

```text
Analyzing
Elaborating
Simulating
```

Interpretação:

Neste reference design, como o DUT e o testbench são SystemVerilog, o fluxo prático usado é o de dois passos. Em ambientes com Verilog/SV misturado com VHDL, o curso volta a destacar o fluxo de três passos.

---

### Slide 2 — Debug Flow

O slide reforça que é difícil detectar bugs em um design, mesmo sendo esse o objetivo central da simulação.

O processo de debug inclui:

- localizar a lógica defeituosa responsável pela resposta errada do DUT;
- isolar o bug;
- entender por que o design não responde da forma esperada.

Para designs complexos, é necessário um ambiente sofisticado de debug.

O ambiente de debug inclui:

- source code browser;
- schematic viewer;
- waveforms;
- state machine diagrams;
- waveform comparison;
- automatic tracing of signal activity using temporal flow views;
- assertion-based debug;
- debug and analysis of transaction and message data.

O fluxo visual mostrado é:

```text
Analysis
  ↓
Compilation / Elaboration
  ↓
Post-processing Debug
  ↓
Interactive Simulation Debug
```

Interpretação:

O VCS executa a simulação e gera dados como FSDB. O Verdi carrega esses dados e permite navegar por sinais, código e hierarquia. Neste bloco, isso será usado para observar uma falha relacionada a escrita quando `ready` está baixo.

---

### Slide 3 — SystemVerilog Design Under Test (DUT)

O DUT escrito em SystemVerilog é o módulo a ser verificado.

Pontos principais:

- O DUT é um **4K byte Register array**.
- Ele armazena os dados em uma matriz de registradores.
- O módulo é modelado em SystemVerilog com uma interface.
- O `Makefile` é o runscript que usa o fluxo de dois passos para simular o design.
- Ele invoca os comandos de compilação e simulação do VCS.
- Os próximos slides demonstram os componentes do testbench e o método de execução da simulação.

A figura mostra a estrutura do testbench com:

```text
Register array controller
interface
virtual interface
clock generation
```

e a arquitetura completa:

```text
stimulus generator
driver
interface
DUT
monitor
scoreboard
```

Interpretação:

Este bloco é a continuação natural da parte 1. A estrutura do testbench é a mesma, mas o DUT agora tem memória, protocolo de leitura/escrita e sinal de prontidão.

---

### Slide 4 — SystemVerilog Design Under Test (DUT): Register Array Controller

O slide apresenta as características funcionais do DUT.

Pontos principais:

- O DUT é um design de **4 KB register array controller**.
- Operação de escrita é feita em um único clock quando endereço e dado são fornecidos.
- Operação de leitura leva um ciclo de clock extra.
- A prontidão do register array é indicada pelo sinal `ready`.
- Usa reset síncrono.
- O register array é inicializado com `00` no reset.

O código visível mostra um módulo com nome semelhante a:

```systemverilog
module reg_array (reg_if _if);
```

Parâmetros visíveis/conceituais:

```systemverilog
parameter ADDR_WIDTH = 8;
parameter DATA_WIDTH = 16;
parameter DEPTH      = 256;
parameter RESET_VAL  = 16'h1234;
```

Memória interna:

```systemverilog
reg [DATA_WIDTH-1:0] ctrl [DEPTH];
```

Interpretação:

Embora o slide fale em 4 KB, o código visual usa parâmetros didáticos. O conceito principal é uma matriz de registradores indexada por endereço. A escrita atualiza uma posição da memória; a leitura devolve o dado daquela posição com uma latência adicional.

---

### Slide 5 — Design Under Test (DUT): corpo do RTL

O slide continua o código do DUT.

A lógica reconstruída a partir do print é:

#### Reset síncrono

```systemverilog
always_ff @(posedge _if.tb_clk) begin
  if (!_if.rstn) begin
    for (int i = 0; i < DEPTH; i++) begin
      ctrl[i] <= RESET_VAL;
    end
  end
  else begin
    ...
  end
end
```

Interpretação:

No reset, todas as posições da matriz são inicializadas. O slide afirma que são inicializadas para `00`, embora o trecho visível também mostre parâmetro de reset. Para a leitura do curso, memorize o conceito: **reset síncrono inicializa o register array**.

#### Escrita

Trecho conceitual:

```systemverilog
if (_if.sel && _if.ready && _if.wr) begin
  ctrl[_if.addr] <= _if.wdata;
end
```

Interpretação:

A escrita é válida quando:

```text
sel = 1
ready = 1
wr = 1
```

Ou seja, o DUT só deveria aceitar escrita quando selecionado, pronto e em operação de escrita.

#### Leitura

Trecho conceitual:

```systemverilog
if (_if.sel && _if.ready && !_if.wr) begin
  _if.rdata <= ctrl[_if.addr];
end
else begin
  _if.rdata <= 0;
end
```

Interpretação:

A leitura usa o endereço para buscar o dado armazenado. O slide destaca que leitura leva um ciclo extra.

#### Geração de `ready`

O slide mostra uma lógica de `ready`, com sinais internos como:

```systemverilog
ready
ready_dly
ready_pe
```

Trecho conceitual:

```systemverilog
always_ff @(posedge clk) begin
  if (!rstn)
    ready_dly <= 1'b0;
  else
    ready_dly <= ready;
end

assign ready_pe = ~ready & ready_dly;
```

Observação: o sinal de borda/atraso no print é difícil de ler perfeitamente, mas a intenção do slide é mostrar que `ready` é dirigido internamente e indica quando o DUT aceita ou conclui operação.

Interpretação:

O sinal `ready` é essencial para o protocolo. Ele controla quando uma transação é válida. O bug proposto no debug está justamente ligado a escrever dado quando `ready` está baixo.

---

### Slide 6 — Design Under Test Interface — `reg_if`

O slide apresenta a interface SystemVerilog do DUT.

Pontos principais:

- O ambiente de teste interage com o DUT usando uma interface.
- O test environment acessa os I/Os do DUT usando uma **virtual interface**, pois os componentes do testbench são dinâmicos/classes.

Código reconstruído:

```systemverilog
interface reg_if (input bit tb_clk);

  logic        rstn;
  logic [7:0]  addr;
  logic [15:0] wdata;
  logic [15:0] rdata;
  logic        wr;
  logic        sel;
  logic        ready;

endinterface
```

Interpretação:

A interface agrupa todos os sinais do protocolo de acesso ao register array.

Sinais:

| Sinal | Papel |
|---|---|
| `tb_clk` | Clock usado pelo DUT/testbench. |
| `rstn` | Reset ativo baixo. |
| `addr` | Endereço da posição acessada. |
| `wdata` | Dado escrito na matriz. |
| `rdata` | Dado lido da matriz. |
| `wr` | Define operação de escrita quando 1; leitura quando 0. |
| `sel` | Seleciona/ativa o acesso ao DUT. |
| `ready` | Indica prontidão do DUT para operação ou resposta válida. |

---

### Slide 7 — Verilog Design Under Test — Testbench `tb`

O slide mostra o módulo top-level do testbench.

O `tb` contém:

- instanciação do DUT;
- interface do DUT;
- virtual interface para o testbench;
- geração de clock/reset;
- comandos de dump para debug.

Pontos do slide:

```text
DUT instantiation
DUT Interface
TB Virtual Interface
Clock/reset generation
```

Exemplo didático reconstruído:

```systemverilog
module tb;

  reg tb_clk;

  initial begin
    tb_clk = 1'b0;
    forever #10 tb_clk = ~tb_clk;
  end

  reg_if _if(tb_clk);

  initial begin
    _if.rstn = 1'b0;
    _if.sel  = 1'b0;
    _if.wr   = 1'b0;

    #20 _if.rstn = 1'b1;
    #20 _if.sel  = 1'b1;
  end

  reg_array u0 (_if);

  test t0;

  initial begin
    t0 = new();
    t0.e0.vif = _if;
    t0.run();
  end

  initial begin
    $fsdbDumpfile("reg_array.fsdb");
    $fsdbDumpvars(3, tb);
  end

  initial begin
    #200 $finish;
  end

endmodule
```

Interpretação:

O `tb` conecta o mundo estático do design — módulo, interface e clock — ao mundo orientado a objetos — test, environment, driver, monitor e scoreboard.

---

### Slide 8 — Transaction Object — `reg_item`

O slide apresenta a classe `reg_item`, que representa uma transação do register array.

Pontos principais:

- O transaction object ajuda a transmitir e receber novas transações.
- A função `display` ajuda a monitorar o que está sendo escrito e lido pelo driver e pelo monitor.

Campos visíveis/conceituais:

```systemverilog
class reg_item;

  rand bit        sel;
  rand bit [7:0]  addr;
  rand bit [15:0] wdata;

  bit [15:0]      rdata;
  rand bit        wr;

  function void print(string tag = "");
    $display("T=%0t %s addr=0x%0h wr=%0b wdata=0x%0h rdata=0x%0h",
             $time, tag, addr, wr, wdata, rdata);
  endfunction

endclass
```

Interpretação:

O `reg_item` representa tanto escrita quanto leitura.

Se:

```text
wr = 1
```

a transação é uma escrita, usando `addr` e `wdata`.

Se:

```text
wr = 0
```

a transação é uma leitura, usando `addr` e recebendo `rdata`.

Esse objeto é passado por mailbox entre componentes do testbench.

---

### Slide 9 — SV Monitor

O slide mostra a classe `monitor`.

Pontos principais:

- O monitor rastreia transações para o DUT.
- Obtém uma transação a partir da virtual interface.
- Captura transações, cria pacotes e escreve na mailbox do scoreboard.
- Fica ativo para sempre.
- A simulação precisa de `$finish` para parar.

Código conceitual reconstruído:

```systemverilog
class monitor;

  virtual reg_if vif;
  mailbox scb_mbx;

  task run();
    $display("T=%0t [Monitor] starting ...", $time);

    forever begin
      reg_item item;

      @(posedge vif.tb_clk);

      if (vif.sel) begin
        item = new();

        item.addr  = vif.addr;
        item.wr    = vif.wr;
        item.wdata = vif.wdata;

        if (!vif.wr) begin
          @(posedge vif.tb_clk);
          item.rdata = vif.rdata;
        end

        item.print("Monitor");

        scb_mbx.put(item);
      end
    end
  endtask

endclass
```

Interpretação:

O monitor observa o protocolo. Para escrita, captura endereço e dado escrito. Para leitura, espera o ciclo extra e captura `rdata`. Depois envia o item ao scoreboard.

---

### Slide 10 — SV Scoreboard — parte 1

O slide mostra a primeira parte da classe `scoreboard`.

Pontos principais:

- O scoreboard rastreia transações na virtual interface.
- Recebe transações de escrita e leitura.
- Captura transações, cria packets e escreve/obtém pela mailbox do scoreboard.
- Fica ativo para sempre.
- A simulação precisa de `$finish` para parar.

O comentário no código diz:

```text
The scoreboard checks data integrity.
The design writes data it receives at each address.
Scoreboard captures it and checks if the read data from the same address
is correct as written data at that address.
The scoreboard stores every write and read transactions.
```

Estrutura reconstruída:

```systemverilog
class scoreboard;

  mailbox scb_mbx;

  reg_item refq[256];

  task run();
    forever begin
      reg_item item;

      scb_mbx.get(item);
      item.print("Scoreboard");

      if (item.wr) begin
        if (refq[item.addr] == null)
          refq[item.addr] = new();

        refq[item.addr].copy(item);

        $display("T=%0t [Scoreboard] Store addr=0x%0h wr=%0b data=0x%0h",
                 $time, item.addr, item.wr, item.wdata);
      end
      else begin
        ...
      end
    end
  endtask

endclass
```

Interpretação:

Para cada escrita, o scoreboard guarda o valor esperado por endereço. Isso cria um modelo de referência simples da memória.

---

### Slide 11 — SV Scoreboard — parte 2

O slide continua o código do scoreboard.

A lógica de leitura reconstruída é:

```systemverilog
if (!item.wr) begin
  if (refq[item.addr] == null) begin
    if (item.rdata != 'h0000) begin
      $display("T=%0t [Scoreboard] ERROR! First time read, addr=0x%0h exp=0x0000 act=0x%0h",
               $time, item.addr, item.rdata);
    end
    else begin
      $display("T=%0t [Scoreboard] PASS! First time read, addr=0x%0h exp=0x0000 act=0x%0h",
               $time, item.addr, item.rdata);
    end
  end
  else begin
    if (item.rdata != refq[item.addr].wdata) begin
      $display("T=%0t [Scoreboard] ERROR! addr=0x%0h exp=0x%0h act=0x%0h",
               $time, item.addr, refq[item.addr].wdata, item.rdata);
    end
    else begin
      $display("T=%0t [Scoreboard] PASS! addr=0x%0h exp=0x%0h act=0x%0h",
               $time, item.addr, refq[item.addr].wdata, item.rdata);
    end
  end
end
```

Interpretação:

O scoreboard lida com dois casos:

#### Caso 1 — leitura sem escrita anterior

Se nunca houve escrita naquele endereço, o valor esperado é o valor de reset, mostrado como `0x0000` no slide.

#### Caso 2 — leitura após escrita

Se já houve escrita naquele endereço, o valor esperado é o `wdata` armazenado anteriormente pelo scoreboard.

Essa é uma forma simples e eficiente de verificar integridade de memória.

---

### Slide 12 — SV Environment

O slide mostra a classe `env`.

Pontos principais:

- O environment instancia todos os componentes do testbench.
- O slide diz que ele não possui stimulus generator.
- No código, o test parece aplicar estímulo diretamente ao driver por mailbox, em vez de usar uma classe generator separada.
- O environment conecta:
  - driver;
  - monitor;
  - scoreboard;
  - mailbox do driver;
  - mailbox do scoreboard;
  - virtual interface.

Código conceitual reconstruído:

```systemverilog
class env;

  driver     d0;
  monitor    m0;
  scoreboard s0;

  mailbox drv_mbx;
  mailbox scb_mbx;

  virtual reg_if vif;

  function new();
    d0 = new();
    m0 = new();
    s0 = new();

    drv_mbx = new();
    scb_mbx = new();
  endfunction

  virtual task run();

    // assign handles
    d0.vif = vif;
    m0.vif = vif;

    d0.drv_mbx = drv_mbx;

    m0.scb_mbx = scb_mbx;
    s0.scb_mbx = scb_mbx;

    fork
      d0.run();
      m0.run();
      s0.run();
    join_any

  endtask

endclass
```

Interpretação:

Diferentemente da parte 1, aqui o slide enfatiza que o environment não possui stimulus generator. O estímulo é aplicado pela classe `test`, que coloca itens na mailbox do driver.

---

### Slide 13 — SV Stimulus — `test`

O slide apresenta a classe `test`.

Pontos principais:

- Test é o stimulus generator.
- Ele chama o environment e executa a task `run`.
- `apply_stimulus` alimenta o estímulo.

Código conceitual reconstruído:

```systemverilog
class test;

  env e0;
  mailbox drv_mbx;

  function new();
    drv_mbx = new();
    e0      = new();
  endfunction

  virtual task run();
    e0.d0.drv_mbx = drv_mbx;

    fork
      e0.run();
      apply_stim();
    join_any
  endtask

  virtual task apply_stim();
    reg_item item;

    $display("T=%0t [Test] Starting stimulus ...", $time);

    item = new();
    item.randomize() with {
      addr  == 8'hAA;
      wr    == 1;
      wdata == 16'h5A5A;
      sel   == 1;
    };
    drv_mbx.put(item);

    item = new();
    item.randomize() with {
      addr == 8'hAA;
      wr   == 0;
      sel  == 1;
    };
    drv_mbx.put(item);
  endtask

endclass
```

Interpretação:

O test cria uma sequência dirigida:

```text
1. escrever dado em um endereço
2. ler o mesmo endereço
3. deixar o scoreboard verificar se o dado lido é igual ao escrito
```

Esse é o caso principal mostrado na waveform: write followed by read.

---

### Slide 14 — Simulation of Register Array DUT

O slide mostra como rodar a simulação.

Pontos principais:

- Garantir acesso ao VCS.
- A simulação SystemVerilog é feita em fluxo de dois passos.
- Compilar usando VCS:

```bash
vcs -sverilog reg_ctrl.sv tb.sv test.sv
```

ou:

```bash
vcs -sverilog -f reg_array.f -l comp.log
```

- Simular:

```bash
./simv -l reg_array.log
```

- Para debug pós-processamento, usar `-debug_access` durante a compilação.
- Dumping de sinais para debug pode ser feito com comandos FSDB ou VCD.

Comandos mostrados no slide:

```bash
vcs -f reg_array.f -debug_access -l reg_array.log
./simv +vcs_sim.log -dump reg_array.fsdb -type FSDB
```

FSDB:

```systemverilog
initial begin
  $fsdbDumpfile("reg_array.fsdb");
  $fsdbDumpvars;
  #100 $finish;
end
```

VCD:

```systemverilog
initial begin
  $dumpfile("reg_array.vcd");
  $dumpvars(0, tb);
  #100 $finish;
end
```

Tabela de arquivos:

| Arquivo | Diretório | Descrição |
|---|---|---|
| `Reg_array.sv` | `pc_tutorial/reg_array/rtl/` | Contém o código-fonte RTL do register array. |
| `tb.sv` / `Test.sv` | `pc_tutorial/simulation/` | Contém o testbench SystemVerilog top-level. Neste exemplo, é um único arquivo; em designs maiores, pode haver vários arquivos e centenas de test cases. |
| `README` | `pc_tutorial/reg_array/` | Contém detalhes de execução da simulação. |
| `Makefile` | `pc_tutorial/reg_array/simulation/` | Contém scripts de compilação e execução da simulação. |

---

### Slide 15 — Simulation Results of Register Array Controller DUT — CLI

O slide mostra resultados na linha de comando.

Mensagens visíveis/conceituais:

```text
[Driver] starting ...
[Monitor] starting ...
[Driver] waiting for item ....
[Driver] addr=... wr=1 wdata=...
[Monitor] addr=... wr=1 wdata=... rdata=...
[Scoreboard] Store addr=... wr=1 data=...
[Driver] addr=... wr=0 ...
[Monitor] addr=... wr=0 rdata=...
[Scoreboard] PASS! addr=... exp=... act=...
$finish called from file "tb.sv"
V C S   S i m u l a t i o n   R e p o r t
```

Interpretação:

A CLI mostra uma sequência típica:

```text
driver aplica escrita
monitor captura escrita
scoreboard armazena valor esperado
driver aplica leitura
monitor captura dado lido
scoreboard compara e imprime PASS
```

O resultado mostrado confirma que o testbench verificou uma operação de escrita seguida de leitura.

---

### Slide 16 — Simulation Results of Register Array Controller DUT — waveform

O slide mostra a waveform no Verdi.

O texto do slide diz:

```text
Write followed by read test case waveform capture using Verdi debug environment is shown here.
```

Sinais visíveis na waveform:

- `tb_clk`
- `rstn`
- `addr[7:0]`
- `wdata[15:0]`
- `rdata[15:0]`
- `wr`
- `sel`
- `ready`

Interpretação da waveform:

1. O reset é liberado.
2. O testbench aplica uma escrita em determinado endereço.
3. O DUT aceita a escrita quando `ready` está adequado.
4. Depois o testbench aplica uma leitura no mesmo endereço.
5. A leitura aparece em `rdata` após a latência de um ciclo.
6. O scoreboard compara `rdata` com o valor escrito anteriormente.

Essa waveform mostra a parte temporal que o CLI resume em mensagens.

---

### Slide 17 — Invoking Debug Environment

O slide mostra como invocar o Verdi.

Comando:

```bash
verdi -nologo -ssf reg_array.fsdb &
```

Pontos principais:

- Simular o design com bug forçando escrita de dado enquanto `ready` está baixo.
- Invocar o Verdi debug environment com o arquivo FSDB.
- O design e a waveform são carregados.
- É possível navegar por sinais e source code.
- Identificar o bug no design.

Hint do slide:

```text
bug is in the case when data is written with ready low
```

Ações:

- corrigir o código como mostrado em fonte azul;
- ressimular;
- observar o resultado para a mesma condição de estímulo;
- consultar o `VCS_quickstart` user guide para mais opções.

Interpretação:

O ponto de debug é o protocolo:

```text
o DUT não deve aceitar escrita quando ready está baixo
```

Se aceitar, pode armazenar dado em momento inválido, e uma leitura posterior vai mostrar mismatch no scoreboard.

---

### Slide 18 — Good Practice for Running Simulation (1/2)

Boas práticas listadas:

- Tenha um **verification plan**.
- O verification plan está para o verification engineer assim como a functional specification está para o RTL designer.
- O plano de verificação reduz bastante o esforço de planejamento.
- Um plano de verificação executável detalha cada objetivo de verificação e permite quantificá-los usando alguma automação.
- Pense em reuso de verificação como designers pensam em reuso de design.
- Os módulos do testbench devem ser modulares e distintos dentro do ambiente.
- Todas as tarefas repetitivas durante a simulação devem virar scripts.
- Acelerar a simulação é muito importante porque ela roda ao longo de todo o processo de design.
- Uma forma de acelerar é compilar design e componentes do testbench uma vez e depois rodar com modelos pré-compilados.
- Também se pode usar simulação incremental apenas para o código alterado.

Interpretação:

O bloco não ensina apenas o design. Ele ensina fluxo de trabalho. O engenheiro de verificação deve pensar em plano, automação, reuso e regressão.

---

### Slide 19 — Good Practice for Running Simulation (2/2)

Boas práticas adicionais:

- Organizar diretórios de design como mostrado na figura.
- Criar diretórios modulares de testbench.
- Ter README explicando a estrutura de diretórios.
- Gerar filelists separados para módulos RTL e testbench.
- Gerar script para rodar simulações com diferentes opções:
  - simulação simples;
  - simulação com debug environment;
  - outros modos.

Exemplo de script:

```makefile
RTL_Verification: comp sim

comp:
	vcs -f reg_array.f -l reg_array.log -debug_access

sim:
	./simv
```

Limpeza:

```makefile
clean:
	rm -rf simv* csrc* ${ROOT}/libs *.log vlogansetup.args *.fsdb *.vcd
```

Interpretação:

O fluxo deve ser reproduzível. Em projetos reais, rodar simulação manualmente sem scripts leva a erros, inconsistências e dificuldade de regressão.

---

## Aula didática desenvolvida

### 1. Diferença entre Reference Design-1 e Reference Design-2

Na parte 1, o DUT era um somador combinacional.

Agora, o DUT é um register array controller. Isso adiciona três dificuldades:

```text
estado interno
latência de leitura
protocolo com ready
```

No somador, bastava comparar:

```text
{carry, sum} = a + b
```

No register array, é necessário lembrar o que foi escrito anteriormente em cada endereço. Por isso o scoreboard precisa armazenar valores esperados.

---

### 2. O DUT como uma pequena memória

O register array funciona como uma pequena memória indexada por endereço.

Escrita:

```text
addr = endereço
wdata = dado a escrever
wr = 1
sel = 1
ready = 1
```

Leitura:

```text
addr = endereço
wr = 0
sel = 1
após um ciclo, rdata deve conter o valor armazenado
```

Essa diferença de latência é muito importante. O testbench não pode comparar `rdata` imediatamente no mesmo ciclo da leitura.

---

### 3. Por que o scoreboard precisa de memória interna?

O DUT armazena dados. Logo, o scoreboard também precisa lembrar o que deveria estar armazenado.

Exemplo:

```text
escrevi 0x5A5A no endereço 0xAA
depois li o endereço 0xAA
espero receber 0x5A5A
```

O scoreboard guarda:

```systemverilog
refq[8'hAA] = 16'h5A5A;
```

Quando uma leitura chega:

```systemverilog
expected = refq[item.addr].wdata;
```

Essa estrutura é o modelo de referência do scoreboard.

---

### 4. Leitura de endereço nunca escrito

Se o testbench lê um endereço que nunca foi escrito, o scoreboard precisa ter uma regra.

O slide mostra uma regra de primeiro acesso:

```text
First time read → expected 0x0000
```

Então:

```text
se não há valor salvo para aquele endereço
rdata esperado = 0x0000
```

Isso depende da especificação do design. O slide também fala que o array é inicializado no reset. Portanto, o scoreboard assume um valor inicial conhecido.

---

### 5. O bug com `ready` baixo

O slide de debug dá a pista:

```text
bug is in the case when data is written with ready low
```

O protocolo correto deveria impedir escrita quando `ready = 0`.

Escrita correta:

```systemverilog
if (sel && ready && wr) begin
  mem[addr] <= wdata;
end
```

Bug típico:

```systemverilog
if (sel && wr) begin
  mem[addr] <= wdata;
end
```

Nesse bug, o DUT escreve mesmo quando `ready` está baixo.

Consequência:

```text
scoreboard pode acreditar que a escrita não deveria valer
mas o DUT atualizou a memória
ou o contrário, dependendo do monitoramento
```

Isso causa mismatch quando o endereço é lido depois.

---

### 6. O papel do `ready`

`ready` é um sinal de handshake.

Ele diz:

```text
o DUT está pronto para aceitar a operação
ou
o dado de leitura está válido
```

Sem respeitar `ready`, o testbench ou o DUT pode tratar transações inválidas como válidas.

Regra mental:

```text
sel diz que há tentativa de acesso.
wr diz se é escrita ou leitura.
ready diz se o acesso pode acontecer/agora está válido.
```

---

### 7. Driver: aplicando transações

O driver pega um `reg_item` e dirige a interface:

```systemverilog
vif.addr  <= item.addr;
vif.wdata <= item.wdata;
vif.wr    <= item.wr;
vif.sel   <= item.sel;
```

Para escrita, ele ativa `wr`.

Para leitura, ele coloca `wr = 0`.

O driver precisa respeitar clock e, idealmente, `ready`.

---

### 8. Monitor: capturando com latência

O monitor não pode tratar leitura e escrita do mesmo jeito.

Para escrita:

```text
captura addr, wr, wdata
```

Para leitura:

```text
captura addr, wr
espera a latência
captura rdata
```

Isso aparece no slide quando o monitor espera um clock extra para leitura.

---

### 9. Scoreboard: verificação temporal e funcional

O scoreboard verifica duas coisas:

#### Integridade funcional

```text
o dado lido é igual ao dado escrito?
```

#### Comportamento temporal/protocolar

```text
o dado só foi considerado válido no momento correto?
a escrita respeitou ready?
```

No bloco, a ênfase principal está na integridade dos dados e no bug de escrita com `ready` baixo.

---

### 10. Test como stimulus generator

Na parte 1, havia uma classe `generator`. Nesta parte, o slide diz que o environment não tem stimulus generator e que o **test é o stimulus generator**.

Isso significa que a classe `test` cria os `reg_item` diretamente e os envia à mailbox do driver.

Padrão:

```systemverilog
item = new();
item.randomize() with { ... };
drv_mbx.put(item);
```

Interpretação:

O design é simples o bastante para o test aplicar estímulos diretamente. Em ambientes maiores, seria comum separar novamente uma classe `generator` ou `sequence`.

---

### 11. Environment sem generator

O environment instancia:

```text
driver
monitor
scoreboard
mailboxes
virtual interface
```

Mas não instancia generator. Isso está alinhado com o slide:

```text
It does not have stimulus generator
```

Neste bloco:

```text
test gera estímulo
environment organiza componentes
driver aplica estímulo
monitor observa
scoreboard compara
```

---

### 12. `reg_item` como transação de leitura/escrita

O mesmo objeto representa duas operações.

#### Escrita

```text
wr = 1
addr = endereço
wdata = dado
```

#### Leitura

```text
wr = 0
addr = endereço
rdata = dado observado
```

Isso simplifica a comunicação entre monitor e scoreboard.

---

### 13. Waveform: o que observar

Na waveform do Verdi, observe principalmente:

```text
rstn
sel
wr
ready
addr
wdata
rdata
```

Para o caso write-followed-by-read:

1. `wr = 1`, `sel = 1`, endereço e `wdata` são aplicados.
2. `ready` deve permitir a operação.
3. Depois `wr = 0`, mesmo endereço é aplicado para leitura.
4. `rdata` aparece depois de um ciclo.
5. Scoreboard imprime PASS se `rdata == wdata`.

---

### 14. CLI: por que ela importa?

O log da CLI mostra o comportamento em alto nível:

```text
Driver aplicou escrita
Monitor capturou escrita
Scoreboard armazenou
Driver aplicou leitura
Monitor capturou leitura
Scoreboard passou
```

Isso é muito mais rápido do que olhar a waveform inteira. A waveform fica para quando o log indica erro.

---

### 15. Plano de verificação para o register array

Um plano mínimo seria:

| Objetivo | Estímulo | Esperado |
|---|---|---|
| Reset | aplicar `rstn=0` | memória inicializada |
| Escrita válida | `sel=1`, `wr=1`, `ready=1` | dado armazenado |
| Leitura após escrita | ler mesmo endereço | `rdata == wdata` |
| Leitura sem escrita prévia | ler endereço limpo | valor inicial |
| Escrita com `ready=0` | forçar escrita inválida | dado não deve ser aceito |
| Múltiplos endereços | escrever/ler endereços diferentes | dados não se misturam |
| Sobrescrita | escrever duas vezes no mesmo endereço | última escrita prevalece |

Esse plano mostra que o DUT não é apenas uma memória; ele tem protocolo.

---

## Conceitos difíceis explicados em profundidade

### 1. Por que leitura leva um ciclo extra?

Em designs síncronos, a leitura de memória ou register array frequentemente é registrada.

Isso significa:

```text
ciclo N: aplica endereço
ciclo N+1: dado aparece em rdata
```

O monitor e o scoreboard precisam respeitar essa latência.

Se o monitor capturar `rdata` no ciclo errado, pode acusar erro falso.

---

### 2. Reset síncrono

O slide diz que o design usa reset síncrono.

Reset síncrono significa que o reset só é aplicado na borda do clock:

```systemverilog
always_ff @(posedge clk) begin
  if (!rstn)
    ...
end
```

Diferente do reset assíncrono:

```systemverilog
always_ff @(posedge clk or negedge rstn) begin
  if (!rstn)
    ...
end
```

Aqui, pelo slide, o reset pertence ao fluxo do clock.

---

### 3. Diferença entre `sel`, `wr` e `ready`

Esses três sinais têm papéis diferentes.

#### `sel`

Seleciona o DUT para uma operação.

```text
sel = 1 → há acesso ao bloco
```

#### `wr`

Define o tipo de operação.

```text
wr = 1 → escrita
wr = 0 → leitura
```

#### `ready`

Define se a operação pode ser aceita ou se a resposta está válida.

```text
ready = 1 → pronto/válido
ready = 0 → não aceitar ou ainda não válido
```

Confundir esses sinais é uma fonte clássica de bug.

---

### 4. Por que o bug de `ready` é realista?

Em hardware real, muitos blocos usam handshake.

Se o produtor escreve quando o consumidor não está pronto, dados podem ser perdidos ou armazenados incorretamente.

Este bug é importante porque ensina:

```text
não basta verificar dado e endereço;
também é preciso verificar o protocolo de validade.
```

---

### 5. Scoreboard com array de referência

O scoreboard usa uma estrutura como:

```systemverilog
reg_item refq[256];
```

Isso cria um espelho esperado da memória.

Quando escreve:

```text
refq[addr] = item
```

Quando lê:

```text
compare rdata with refq[addr].wdata
```

Essa técnica é muito usada em verificação de memórias, registradores, FIFOs e caches.

---

### 6. Primeiro acesso e valor default

Se `refq[addr] == null`, o scoreboard entende que aquele endereço nunca foi escrito.

Então usa valor default:

```text
expected = 0x0000
```

Isso precisa bater com a especificação do reset. Se o DUT inicializa com outro valor, o scoreboard precisa acompanhar.

---

### 7. Por que monitor e scoreboard rodam para sempre?

O monitor precisa observar qualquer transação que aconteça durante a simulação.

O scoreboard precisa estar pronto para comparar qualquer transação capturada.

Por isso aparecem loops:

```systemverilog
forever begin
  ...
end
```

A simulação para por `$finish` ou por controle do test.

---

### 8. `join_any` em ambiente com processos eternos

Se driver, monitor e scoreboard rodam para sempre, `join` nunca terminaria.

`join_any` permite que o ambiente avance quando alguma thread terminar. Mas o uso exige cuidado, porque processos eternos podem continuar rodando até `$finish`.

Em projetos maiores, é comum ter mecanismos mais robustos de finalização, como contadores de transações, objections ou eventos globais.

---

### 9. Por que separar test e environment?

O environment é reutilizável. Ele monta a infraestrutura.

O test é específico. Ele decide o cenário.

Exemplo:

```text
test_write_read
test_ready_low
test_reset
test_random_access
```

Todos podem reutilizar o mesmo environment.

---

### 10. O test como generator neste bloco

O slide deixa claro:

```text
Test is the stimulus generator
```

Isso é uma variação mais simples do padrão completo. Em vez de criar uma classe generator separada, o próprio test cria os itens e manda ao driver.

Essa escolha é didática e suficiente para o reference design.

---

## Figuras, diagramas e waveforms importantes

### Diagrama geral de testbench

Mostra DUT, stimulus generator, driver, interface, monitor e scoreboard. É a arquitetura base repetida nos reference designs.

### Diagrama de debug flow

Mostra o caminho entre análise, compilação/elaboração, debug pós-processamento e debug interativo.

### Figura do DUT Register Array Controller

Mostra o testbench top com register array controller, interface, virtual interface e clock generation.

### Código do DUT

Mostra o `reg_array`, parâmetros, memória interna, reset síncrono, escrita, leitura e lógica de `ready`.

### Interface `reg_if`

Mostra os sinais principais do protocolo:

```text
rstn, addr, wdata, rdata, wr, sel, ready
```

### Testbench `tb`

Mostra instanciação do DUT, interface, geração de clock/reset, test, FSDB dump e `$finish`.

### Transaction object `reg_item`

Mostra a transação com `sel`, `addr`, `wdata`, `rdata` e `wr`.

### Monitor

Mostra o monitor capturando transações da interface e enviando ao scoreboard.

### Scoreboard

Mostra o modelo de referência com array por endereço e comparação entre dado lido e dado esperado.

### Environment

Mostra a montagem de driver, monitor, scoreboard, mailboxes e virtual interface, sem stimulus generator interno.

### Test

Mostra que o próprio test aplica os estímulos, randomizando itens e enviando pela mailbox do driver.

### Simulation results CLI

Mostra mensagens de driver, monitor e scoreboard com um caso de escrita seguida de leitura.

### Waveform no Verdi

Mostra a captura temporal do caso write-followed-by-read.

### Debug Environment

Mostra o comando para abrir `reg_array.fsdb` no Verdi e a pista do bug de escrita com `ready` baixo.

### Good practices

Mostra plano de verificação, reuso, modularidade, scripts, diretórios, filelists e limpeza de arquivos intermediários.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Qual é o DUT deste reference design?**  
   Um **4 KB Register Array Controller**.

2. **O que o register array armazena?**  
   Dados em uma matriz de registradores indexada por endereço.

3. **Quanto tempo leva uma escrita?**  
   Uma escrita é feita em um único clock quando endereço e dado são fornecidos.

4. **Quanto tempo leva uma leitura?**  
   A leitura leva um ciclo de clock extra.

5. **Qual sinal indica prontidão do register array?**  
   `ready`.

6. **O reset é síncrono ou assíncrono?**  
   Síncrono, segundo o slide.

7. **Qual interface agrupa os sinais do DUT?**  
   `reg_if`.

8. **Quais sinais principais aparecem em `reg_if`?**  
   `rstn`, `addr`, `wdata`, `rdata`, `wr`, `sel`, `ready`.

9. **O que representa `reg_item`?**  
   Uma transação de leitura ou escrita.

10. **Qual componente captura transações da virtual interface?**  
    Monitor.

11. **Qual componente compara o dado lido com o esperado?**  
    Scoreboard.

12. **O environment possui stimulus generator neste bloco?**  
    Segundo o slide, não. O **test** é o stimulus generator.

13. **Qual é o caso de debug indicado?**  
    Escrita de dado quando `ready` está baixo.

14. **Qual comando abre o Verdi com o FSDB?**  
    `verdi -nologo -ssf reg_array.fsdb &`.

15. **Qual fluxo é usado para simulação SystemVerilog pura?**  
    Fluxo de dois passos.

16. **Qual opção deve ser usada para debug pós-processamento?**  
    `-debug_access`.

17. **Por que o scoreboard precisa armazenar escritas anteriores?**  
    Para comparar leituras futuras com o valor esperado naquele endereço.

18. **O que acontece se ler endereço nunca escrito?**  
    O scoreboard espera o valor inicial/default, como `0x0000`, conforme o slide.

### Pegadinhas

- O test é o stimulus generator neste bloco; o environment não possui generator interno.
- A leitura leva um ciclo extra; comparar no mesmo ciclo pode gerar falso erro.
- Escrita só deve ser válida quando `ready` permite.
- O bug sugerido é escrita com `ready` baixo.
- `ready`, `sel` e `wr` têm funções diferentes.
- O scoreboard precisa guardar histórico por endereço.
- O valor default de leitura precisa seguir o reset/especificação.
- Monitor observa; scoreboard julga.
- Virtual interface permite classes acessarem a interface real.
- Reset é síncrono segundo o slide.
- O fluxo de dois passos vale para SystemVerilog puro; design misto usa três passos.
- `-debug_access` ajuda no Verdi.
- A simulação precisa de `$finish`, pois componentes podem rodar `forever`.

### Frases para memorizar

```text
Register array controller armazena dados por endereço.
Escrita ocorre em um clock; leitura leva um ciclo extra.
ready indica quando o acesso é válido.
reg_if agrupa os sinais do protocolo.
reg_item representa uma transação de leitura ou escrita.
Test é o stimulus generator neste bloco.
Scoreboard guarda writes e confere reads.
O bug didático é escrever quando ready está baixo.
VCS simula; Verdi depura.
```

---

## Relação com projeto/laboratório

### Estrutura esperada

```text
pc_tutorial/
└── reg_array/
    ├── rtl/
    │   └── Reg_array.sv
    ├── simulation/
    │   ├── tb.sv
    │   ├── Test.sv
    │   ├── reg_array.f
    │   └── Makefile
    └── README
```

### Fluxo de execução

```bash
make clean
make comp
make sim
make wave
```

Ou manualmente:

```bash
vcs -f reg_array.f -debug_access -l reg_array.log
./simv -l reg_array.log
verdi -nologo -ssf reg_array.fsdb &
```

### Fluxo de debug

```text
rodar simulação
ver CLI
identificar erro do scoreboard
abrir reg_array.fsdb no Verdi
observar sel, wr, ready, addr, wdata, rdata
ver se a escrita ocorreu com ready baixo
corrigir RTL ou testbench
ressimular
comparar o mesmo estímulo
```

### Checklist de testbench ideal

- [ ] Reset aplicado e liberado corretamente.
- [ ] Escrita testada com `ready=1`.
- [ ] Leitura testada um ciclo depois.
- [ ] Escrita com `ready=0` testada como caso negativo.
- [ ] Scoreboard guarda valor por endereço.
- [ ] Leitura de endereço não escrito tem expected definido.
- [ ] CLI mostra PASS/FAIL claro.
- [ ] Waveform FSDB é gerada.
- [ ] Makefile automatiza compilação e simulação.

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] O conteúdo ficou fortemente baseado nos prints do DOCX.
- [x] Código/comandos foram preservados e explicados.
- [x] Pontos de prova e revisão foram criados sem inventar questões finais inexistentes.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O roteiro/checklist foi conferido antes de sugerir o próximo bloco.
- [x] Não foi sugerido um próximo arquivo específico sem confirmação no roteiro.

---

## Próximo bloco

O DOCX atual não mostra uma tela final indicando o próximo arquivo. Como este bloco encerra a parte 2 do reference design de SystemVerilog, o próximo arquivo deve ser confirmado no **roteiro/checklist fornecido**, em vez de ser inferido pelo nome.

Próximo passo de organização:

```text
Verificar no roteiro qual é o primeiro DOCX depois de:
03 SystemVerilog Refresher\06 SystemVerilog Reference Design-2.docx
```

Salvar este bloco em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\06 SystemVerilog Reference Design-2.md
```
