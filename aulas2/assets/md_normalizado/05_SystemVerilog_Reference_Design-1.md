# 05 SystemVerilog Reference Design-1

## Controle do bloco

- **Bloco:** 014
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\05 SystemVerilog Reference Design-1.docx`
- **Faixa processada:** slides visíveis 1-18 + questões finais, distribuídos em 10 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\05 SystemVerilog Reference Design-1.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. Este arquivo é explicitamente a **parte 1** do reference design; portanto, o próximo bloco não deve ser sugerido com nome genérico.
- **Próximo bloco recomendado:** 015 — `06 SystemVerilog Reference Design-2`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco foi tratado como **parte 1** do reference design de SystemVerilog. A sugestão do próximo bloco foi corrigida para seguir essa divisão.

---

## Resumo executivo

Esta aula mostra um **reference design em SystemVerilog** usando um **somador de 8 bits** como DUT e um testbench orientado a objetos ao redor dele. O foco não é apenas simular um somador simples, mas mostrar uma arquitetura completa de verificação com:

```text
DUT
interface
clock interface
virtual interface
transaction object
generator
driver
monitor
scoreboard
environment
test
tb top
dump de waveform
Makefile
VCS
Verdi
```

O design em si é simples: um somador combinacional que recebe dois operandos de 8 bits, `a` e `b`, e gera `sum` e `carry`. A parte importante é o **testbench**. Ele usa classes e objetos para modelar transações, monitorar sinais, comparar respostas e organizar componentes.

A aula também mostra como rodar a simulação com **VCS** em fluxo de dois passos para Verilog/SystemVerilog, como gerar arquivo `.fsdb`, como abrir a waveform no **Verdi**, como usar debug pós-processamento e quais boas práticas seguir em simulações.

O ponto central é:

```text
SystemVerilog permite transformar um testbench simples em um ambiente modular,
com transações, componentes reutilizáveis, interfaces e scoreboard automático.
```

---

## Texto extraído e organizado por slide

### Slide 1 — Simulation of Design

Para simular um design, é necessário um **testbench**. A estrutura geral do testbench aparece no diagrama do slide.

Componentes do testbench:

- **DUT — Design Under Test**
- **Stimulus generator**
- **Response checker**

O testbench pode ser desenvolvido usando qualquer HDL:

- Verilog;
- VHDL;
- SystemVerilog;
- combinação dessas linguagens.

Para simular, usa-se um simulador como o **VCS**. Para depurar, usa-se um ambiente de debug como o **Verdi Debug Environment**.

O slide mostra dois fluxos de simulação com VCS:

#### Fluxo de dois passos

Usado para DUT em Verilog/SystemVerilog:

```text
compile and simulation
```

Comandos conceituais:

```bash
vcs -sverilog -f <filelist> <elaboration_options> <design_unit> -l file.log
./simv <simulation_runtime_options> -l file.log
```

#### Fluxo de três passos

Necessário para DUTs de linguagem mista:

```text
analyzing
elaborating
simulating
```

Comandos conceituais:

```bash
vlogan -work <lib> <vlogan_options> -f source_list -l file.log
vcs -sverilog -kdb -lca <elaboration_options> <design_unit> -l file.log
./simv <simulation_runtime_options> -l file.log
```

Interpretação:

Para este reference design SystemVerilog puro, o curso enfatiza o fluxo de **dois passos**. Quando o ambiente mistura Verilog/SystemVerilog/VHDL, o fluxo de **três passos** aparece como alternativa mais geral.

---

### Slide 2 — Debug Flow

O slide destaca que detectar bugs é difícil, mesmo sendo um dos principais objetivos da simulação.

O processo de debug inclui:

- localizar a lógica defeituosa responsável pela resposta errada do DUT;
- isolar o bug;
- entender por que o design não responde como deveria.

Para designs complexos, é necessário um ambiente sofisticado de debug.

O debug environment inclui:

- source code browser;
- schematic viewer;
- waveforms;
- state machine diagrams;
- waveform comparison;
- automatic tracing of signal activity using temporal flow views;
- assertion-based debug;
- debug e análise de transaction/message data.

O diagrama do slide mostra a sequência:

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

A simulação mostra que existe erro. O debug mostra **onde** e **por que** o erro aconteceu. No fluxo Synopsys, VCS gera dados de simulação e Verdi permite navegar por waveform, código-fonte e hierarquia.

---

### Slide 3 — SystemVerilog Design Under Test (DUT)

O DUT escrito em SystemVerilog é o módulo a ser verificado.

Pontos principais do slide:

- SystemVerilog possui recursos criados para atender necessidades de verificação funcional.
- Neste caso, o DUT é um **adder** que soma dois operandos de 8 bits.
- O DUT é modelado com uma função simples e uma interface.
- A estrutura do testbench é mostrada na figura.
- O `Makefile` é o runscript usado para rodar a simulação em dois passos.
- Ele invoca comandos de compilação e simulação do VCS.
- Os próximos slides demonstram os componentes do testbench e o método para rodar as simulações.

A figura mostra um top de testbench com:

```text
adder
interface
virtual interface
clock generation
```

E também mostra a arquitetura geral:

```text
stimulus generator
driver
interface
DUT
monitor
scoreboard
```

Interpretação:

O DUT é simples de propósito. O objetivo da aula não é ensinar um somador, mas ensinar como criar um ambiente SystemVerilog modular em volta dele.

---

### Slide 4 — SystemVerilog Design Under Test (DUT): código do somador e interfaces

O slide mostra o código do somador e as interfaces.

Pontos principais:

- O DUT é um circuito somador simples.
- O modelo SystemVerilog é mostrado.
- A figura 4 mostra o módulo de interface SystemVerilog do somador.
- O adder é lógica combinacional e não exige clock.
- A clock interface existe para ser usada pelo testbench.

#### Código conceitual do somador

O código mostrado no slide tem a ideia:

```systemverilog
module my_adder (adder_if swif);

  always_comb begin
    if (!swif.rstn) begin
      swif.sum   = 0;
      swif.carry = 0;
    end
    else begin
      {swif.carry, swif.sum} = swif.a + swif.b;
    end
  end

endmodule
```

Interpretação:

- `a` e `b` são operandos de 8 bits.
- `sum` guarda os 8 bits inferiores da soma.
- `carry` guarda o nono bit.
- O resultado completo é `{carry, sum}`.
- Como o somador é combinacional, usa `always_comb`.

#### Interface do somador

O slide mostra uma interface semelhante a:

```systemverilog
interface adder_if();
  logic       rstn;
  logic [7:0] a;
  logic [7:0] b;
  logic [7:0] sum;
  logic       carry;
endinterface
```

#### Interface de clock

O slide também mostra uma interface de clock:

```systemverilog
interface clk_intf();
  logic tb_clk;

  initial tb_clk = 0;

  always #10 tb_clk = ~tb_clk;
endinterface
```

Interpretação:

O DUT não precisa de clock porque é combinacional. Mas o testbench usa clock para sincronizar monitoramento, driver e coleta de transações. Por isso existe uma interface de clock separada.

---

### Slide 5 — Verilog Design Under Test / Test Bench `tb`

O título do slide aparece como **Verilog Design Under Test (Test Bench tb)**, mas o conteúdo é SystemVerilog.

O testbench top do adder contém:

- instanciação do DUT;
- interface do DUT;
- interface de clock;
- virtual interface para o test;
- comandos de dump para debug;
- construtor do test.

Componentes listados:

```text
DUT instantiation
DUT interface
Clock interface
TB virtual interface
Dump commands for debug
Test constructor
```

Exemplo didático reconstruído:

```systemverilog
module tb;

  bit tb_clk;

  clk_intf   m_clk_if();
  adder_if   m_adder_if();

  my_adder u0 (m_adder_if);

  initial begin
    test t0;

    t0 = new();

    t0.e0.m_adder_vif = m_adder_if;
    t0.e0.m_clk_vif   = m_clk_if;

    t0.run();
  end

  initial begin
    $fsdbDumpfile("adder.fsdb");
    $fsdbDumpvars(3, tb);
  end

  initial begin
    #1000 $finish;
  end

endmodule
```

Interpretação:

O `tb` é o topo da simulação. Ele instancia as interfaces reais e passa handles dessas interfaces para as classes do testbench por meio de **virtual interfaces**.

---

### Slide 6 — Transaction Object (Packet)

O slide apresenta o objeto de transação chamado `Packet`.

Pontos principais:

- O transaction object ajuda a transmitir e receber novas transações.
- A função `display` na classe ajuda o monitor a saber o que está sendo escrito e lido pelo driver e pelo monitor.

Campos do objeto:

- `rand bit rstn;`
- `rand bit [7:0] a;`
- `rand bit [7:0] b;`
- `bit [7:0] sum;`
- `bit carry;`

Exemplo didático reconstruído:

```systemverilog
class Packet;

  rand bit       rstn;
  rand bit [7:0] a;
  rand bit [7:0] b;

  bit [7:0] sum;
  bit       carry;

  function void print(string name = "Packet");
    $display("T=%0t %s a=0x%0h b=0x%0h sum=0x%0h carry=0x%0h",
             $time, name, a, b, sum, carry);
  endfunction

  function void copy(Packet tmp);
    this.a     = tmp.a;
    this.b     = tmp.b;
    this.rstn  = tmp.rstn;
    this.sum   = tmp.sum;
    this.carry = tmp.carry;
  endfunction

endclass
```

Interpretação:

O `Packet` é o equivalente abstrato da transação do somador. Em vez de passar `a`, `b`, `sum`, `carry` como sinais soltos entre componentes, o testbench passa um objeto.

Isso permite:

- randomizar entrada;
- imprimir transação;
- copiar valores;
- enviar para mailbox;
- comparar no scoreboard.

---

### Slide 7 — SV Monitor

O slide apresenta a classe `monitor`.

Pontos principais:

- O monitor rastreia transações para o DUT.
- Ele obtém uma transação a partir da virtual interface.
- Captura transações, cria packets e escreve na mailbox do scoreboard, `scb_mbx`.
- O monitor fica ativo para sempre.
- A simulação precisa de `$finish` para parar.

Elementos do código:

- `virtual adder_if m_adder_vif;`
- `virtual clk_intf m_clk_vif;`
- `mailbox scb_mbx;`
- task `run()`;
- loop `forever`;
- espera por borda de clock;
- cria `Packet`;
- copia sinais da interface para o packet;
- imprime;
- envia ao scoreboard.

Exemplo didático reconstruído:

```systemverilog
class monitor;

  virtual adder_if m_adder_vif;
  virtual clk_intf m_clk_vif;

  mailbox scb_mbx;

  task run();
    $display("T=%0t [Monitor] starting ...", $time);

    forever begin
      Packet m_pkt = new();

      @(posedge m_clk_vif.tb_clk);
      #1;

      m_pkt.a     = m_adder_vif.a;
      m_pkt.b     = m_adder_vif.b;
      m_pkt.rstn  = m_adder_vif.rstn;
      m_pkt.sum   = m_adder_vif.sum;
      m_pkt.carry = m_adder_vif.carry;

      m_pkt.print("Monitor");

      scb_mbx.put(m_pkt);
    end
  endtask

endclass
```

Interpretação:

O monitor não decide se o resultado está certo. Ele apenas observa sinais do DUT, empacota em um objeto e manda para o scoreboard.

---

### Slide 8 — SV Scoreboard

O slide apresenta a classe `scoreboard`.

Pontos principais:

- O scoreboard rastreia transações na virtual interface.
- Ele recebe transações de leitura/escrita.
- Captura transações e cria packets.
- Escreve/obtém dados pela mailbox do scoreboard.
- Fica ativo para sempre.
- A simulação precisa de `$finish` para parar.

O código mostrado compara `carry` e `sum`.

Exemplo didático reconstruído:

```systemverilog
class scoreboard;

  mailbox scb_mbx;

  task run();
    forever begin
      Packet item;
      Packet ref_item = new();

      scb_mbx.get(item);

      item.print("Scoreboard");

      ref_item.copy(item);

      if (ref_item.rstn == 1'b0) begin
        {ref_item.carry, ref_item.sum} = '0;
      end
      else begin
        {ref_item.carry, ref_item.sum} = ref_item.a + ref_item.b;
      end

      if (ref_item.carry != item.carry) begin
        $display("[%0t] Scoreboard Error! Carry mismatch", $time);
      end
      else begin
        $display("[%0t] Scoreboard Pass! Carry match", $time);
      end

      if (ref_item.sum != item.sum) begin
        $display("[%0t] Scoreboard Error! sum mismatch", $time);
      end
      else begin
        $display("[%0t] Scoreboard Pass! sum match", $time);
      end
    end
  endtask

endclass
```

Interpretação:

O scoreboard recalcula o resultado esperado:

```text
expected = a + b
```

e compara com a resposta real do DUT:

```text
actual = {carry, sum}
```

Se não bater, imprime erro. Se bater, imprime `Pass`.

---

### Slide 9 — SV Environment

O slide apresenta a classe `env`.

Pontos principais:

- O testbench environment instancia os componentes do testbench.
- O slide diz que ele não tem stimulus generator, mas o código visual mostra `generator g0`. Há uma inconsistência textual no material.
- O código mostra:
  - `generator g0;`
  - `driver d0;`
  - `monitor m0;`
  - `scoreboard s0;`
  - `mailbox scb_mbx;`
  - `virtual adder_if m_adder_vif;`
  - `virtual clk_intf m_clk_vif;`
  - `event drv_done;`
  - `mailbox drv_mbx;`

O `new()` cria os componentes:

```systemverilog
function new();
  d0      = new();
  m0      = new();
  s0      = new();
  scb_mbx = new();
  drv_mbx = new();
  g0      = new();
endfunction
```

A task `run()` conecta handles:

```systemverilog
virtual task run();

  // conecta virtual interface handles
  d0.m_adder_vif = m_adder_vif;
  m0.m_adder_vif = m_adder_vif;

  d0.m_clk_vif = m_clk_vif;
  m0.m_clk_vif = m_clk_vif;

  // conecta mailboxes
  d0.drv_mbx = drv_mbx;
  g0.drv_mbx = drv_mbx;

  m0.scb_mbx = scb_mbx;
  s0.scb_mbx = scb_mbx;

  // conecta event handles
  d0.drv_done = drv_done;
  g0.drv_done = drv_done;

  fork
    d0.run();
    m0.run();
    s0.run();
    g0.run();
  join_any

endtask
```

Interpretação:

O environment é o ponto de montagem. Ele não deve fazer a verificação diretamente; ele cria e conecta os componentes.

A arquitetura é:

```text
generator → drv_mbx → driver → interface → DUT
monitor → scb_mbx → scoreboard
driver → drv_done → generator
```

---

### Slide 10 — SV Stimulus (Test)

O slide apresenta a classe `test`.

Pontos principais:

- `Test` é a classe de aplicação de stimulus.
- `Apply stimulus` alimenta o estímulo.
- O test cria o environment.
- O test cria a mailbox de driver.
- O test conecta a mailbox ao environment e chama `run`.

Exemplo didático reconstruído:

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
    e0.run();
  endtask

endclass
```

Interpretação:

O `test` representa o cenário. Em um projeto maior, poderia haver vários tests:

```text
random_test
reset_test
carry_test
corner_case_test
directed_test
```

Todos poderiam reutilizar o mesmo environment e alterar apenas a forma de gerar estímulos.

---

### Slide 11 — Simulation of adder DUT

O slide explica como rodar a simulação do DUT adder.

Pontos principais:

- Garantir acesso ao VCS.
- A simulação SystemVerilog é feita em fluxo de dois passos.
- Compilar usando VCS:

```bash
vcs -sverilog -f adder.f
```

- Simular:

```bash
./simv -l adder.log
```

- Para debug pós-processamento, usar `-debug_access` durante a compilação.
- Dumping de sinais para visualizar no ambiente de debug é feito com comandos mostrados no slide.

Comando com debug:

```bash
vlogan -sverilog -f adder.f -debug_access -l adder.log
```

Execução com dump FSDB:

```bash
./simv +vcs_sim.log -dump adder.fsdb -type FSDB
```

Exemplo de dump FSDB:

```systemverilog
initial begin
  $fsdbDumpvars;
  #100 $finish;
end
```

Exemplo de dump VCD:

```systemverilog
initial begin
  $dumpfile("adder.vcd");
  $dumpvars(0, tb);
  #100 $finish;
end
```

Tabela de arquivos do slide:

| Arquivo | Diretório | Descrição |
|---|---|---|
| `adder.sv` | `pc_tutorial/adder/rtl/` | Contém o código-fonte RTL do adder. |
| `tb.sv` | `pc_tutorial/simulation/` | Contém o testbench SystemVerilog top-level, incluindo driver, monitor, scoreboard e environment. A maioria das classes deste exemplo está em um único arquivo. Em designs maiores, pode haver centenas de test cases em arquivos separados. |
| `README` | `pc_tutorial/adder/` | Contém detalhes de execução da simulação. |
| `Makefile` | `pc_tutorial/adder/simulation/` | Contém scripts de compilação e execução da simulação. |

Interpretação:

Este é o fluxo prático do lab. O `adder.sv` tem o DUT. O `tb.sv` tem o testbench orientado a objetos. O `Makefile` automatiza os comandos.

---

### Slide 12 — Simulation Results of adder DUT: CLI

O slide mostra os resultados impressos na linha de comando.

A saída mostra mensagens de componentes do testbench, como:

```text
[Driver] starting ...
[Driver] waiting for item ....
[Monitor] starting ...
[Generator] Loop: 1/...
[Generator] Wait for driver to finish
Driver a=... b=... sum=... carry=...
Monitor a=... b=... sum=... carry=...
Scoreboard Pass! Carry match
Scoreboard Pass! sum match
```

Interpretação:

A saída de CLI mostra que o ambiente está funcionando como um pipeline:

```text
generator cria item
driver aplica item
monitor observa resposta
scoreboard compara
```

Quando o scoreboard imprime `Pass`, significa que o resultado observado bate com o esperado para aquela transação.

O slide também mostra que a simulação termina com `$finish` em tempo 1000.

---

### Slide 13 — Simulation Results of adder DUT: waveform

O slide mostra uma captura do Verdi com waveform do adder.

A waveform exibe sinais como:

- clock;
- reset;
- entradas `a` e `b`;
- saída `sum`;
- `carry`;
- possivelmente sinais de interface e objetos de testbench.

Interpretação:

A waveform permite verificar visualmente:

```text
quando o driver aplicou a transação
quando o monitor amostrou
quando o DUT atualizou sum/carry
se o reset estava ativo
se os valores batem com o log do CLI
```

A CLI diz se passou. A waveform ajuda a entender o comportamento temporal.

---

### Slide 14 — Invoking Debug Environment

O slide mostra como abrir o Verdi.

Comando:

```bash
verdi -nologo -ssf adder.fsdb &
```

Pontos principais:

- Simular o design com um bug.
- Invocar Verdi com o arquivo FSDB.
- O design e a waveform são carregados.
- É possível navegar pelos sinais e pelo source code.
- Identificar o bug no design.

O slide orienta:

- inserir um bug lógico no scoreboard adicionando uma condição quando `rstn` está alto e observar erros;
- corrigir o código mostrado em fonte azul e ressimular;
- observar o resultado para a mesma condição de estímulo;
- consultar o `VCS_quickstart` user guide para mais opções.

Interpretação:

Este debug é propositalmente feito no **scoreboard**, não necessariamente no DUT. Isso é didaticamente importante: nem todo erro de simulação vem do design; às vezes o bug está no testbench ou no checker.

---

### Slide 15 — Good Practice for Running Simulation

Boas práticas listadas:

- Tenha um **verification plan**.
- O verification plan está para o verification engineer como a functional specification está para o RTL designer.
- O verification plan reduz bastante o esforço de planejamento.
- Um plano de verificação executável detalha cada objetivo de verificação e permite quantificá-los com alguma automação.
- Pense em reuso de verificação como designers pensam em reuso de design.
- Os módulos do testbench devem ser modulares e distintos no ambiente.
- Todas as tarefas repetitivas durante a simulação devem virar scripts.
- Acelerar simulação é importante, pois ela roda ao longo de todo o processo de design.
- Uma forma de acelerar é compilar design e componentes do testbench uma vez e depois rodar simulação com modelos pré-compilados.
- Também se pode usar simulação incremental apenas para código alterado.

Interpretação:

O slide reforça que verificação deve ser planejada, modular, automatizada e reutilizável.

---

### Slide 16 — Good Practice for Running Simulation: organização e scripts

Boas práticas adicionais:

- Tenha organização de diretórios conforme a figura.
- Crie diretórios modulares de testbench.
- Tenha README explicando a estrutura de diretórios.
- Gere filelists separados para RTL e testbench.
- Gere scripts para rodar simulações com diferentes opções:
  - simulação simples;
  - simulação com debug;
  - outros modos.

Exemplo de run script mostrado:

```makefile
SOC_Verification: clean comp sim

comp:
	vcs -sverilog -f adder.f -l adder.log

sim:
	./simv
```

Comando de limpeza mostrado:

```makefile
clean:
	rm -rf simv* csrc* ${ROOT}/libs *.log vlogansetup.args *.fsdb
```

Interpretação:

O objetivo é tornar a simulação reproduzível. Ninguém deve depender de comandos manuais longos e sujeitos a erro.

---

### Slide 17 — Verify Yourself By Simulations Designs

O slide apresenta 10 designs pequenos para praticar simulação.

Tabela reconstruída:

| Nº | Design | Descrição | Arquivos de referência |
|---:|---|---|---|
| 1 | 32-bit Adder | Soma dois operandos de 32 bits armazenados em registradores `op_a` e `op_b`; resultado em registrador de 33 bits `out`. | `32bit_adder.sv`, `32bit_adder_tb.sv` |
| 2 | 16 × 16 multiplier | Multiplica dois operandos binários de 16 bits; resultado de 32 bits. | `multiplier.sv`, `multiplier_tb.sv` |
| 3 | 12-bit Counter with Overflow | Contador de 12 bits com `enable`, `load`, `loadval` e `overflow_out`. | `counter_overflow.sv`, `counter_overflow_tb.sv` |
| 4 | 4-bit Up/Down Counter | Conta para cima ou para baixo conforme sinal de controle, quando `enable` está alto. | `updown_counter.sv`, `updown_counter_tb.sv` |
| 5 | 2-Client Arbiter | Monitora requests de dois clientes e concede acesso por prioridade. | `arbiter.sv`, `arbiter_tb.sv` |
| 6 | 8:1 Multiplexer | Gera a saída apropriada conforme a linha selecionada. | `mux8x1.sv`, `Mux8x1_tb.sv` |
| 7 | 3:8 Demultiplexer | Direciona a entrada para a saída selecionada. | `demux3x8.sv`, `Demux3x8_tb.sv` |
| 8 | 4:2 Encoder | Codifica uma entrada de 4 bits. | `encoder4x2.sv`, `Encoder4x2_tb.sv` |
| 9 | 2:4 Decoder | Decodifica uma entrada de 2 bits. | `decoder2x4.sv`, `decoder2x4_tb.sv` |
| 10 | 2 × 2 Matrix Multiplication | Multiplica duas matrizes 2 × 2 com operandos de 32 bits e resultado em registrador de 32 bits. | `matrix2x2_mult.sv`, `matrix2x2_mult_tb.sv` |

Interpretação:

A lista serve para treinar o mesmo padrão do adder:

```text
DUT + interface + testbench + transação + driver + monitor + scoreboard + simulação + debug
```

---

### Slide 18 — Questão 1

**Questão:** Testbench consists of DUT, stimulus generator and ______.

Alternativas:

- A. input-outputs
- B. clock-reset
- C. response checker

**Resposta correta:** C. response checker.

**Tradução:** O testbench consiste em DUT, gerador de estímulos e verificador de resposta.

**Justificativa:** O primeiro slide define a estrutura do testbench como DUT, stimulus generator e response checker.

---

### Slide 19 — Questão 2

**Questão:** Simulator and debug environment are same.

Alternativas:

- True
- False

**Resposta correta:** False.

**Tradução:** Simulador e ambiente de debug são a mesma coisa.

**Justificativa:** O VCS é o simulador; o Verdi é o ambiente de debug. Eles têm funções diferentes: um executa a simulação, o outro ajuda a analisar waveform, código e sinais.

---

### Slide 20 — Questão 3

**Questão:** `vlogan` analyses the design for ________, and generates intermediate files for elaboration.

Alternativas:

- A. syntax errors
- B. instantiations
- C. hierarchy

**Resposta correta aceita pelo curso:** B. instantiations.

**Tradução:** `vlogan` analisa o design quanto a instâncias e gera arquivos intermediários para a elaboração.

**Justificativa pelo curso:** O gabarito marcado como correto é **instantiations**. Tecnicamente, `vlogan` também detecta erros de sintaxe, mas para este banco de questões deve-se priorizar **instantiations**.

---

### Slide 21 — Questão 4

**Questão:** Model libraries are not required for simulation.

Alternativas:

- True
- False

**Resposta correta aceita pelo curso:** True.

**Tradução:** Bibliotecas de modelo não são necessárias para simulação.

**Justificativa pelo curso:** No contexto do fluxo RTL simples apresentado, a simulação usa o RTL e o testbench diretamente. Portanto, o curso considera que model libraries não são exigidas.

---

### Slide 22 — Questão 5

**Questão:** ______ flow is used in design simulations with Verilog/SV and VHDL models.

Alternativas:

- A. two step
- B. three step
- C. simv

**Resposta correta:** B. three step.

**Tradução:** O fluxo de três etapas é usado em simulações de design com modelos Verilog/SV e VHDL.

**Justificativa:** Quando há modelos Verilog/SystemVerilog e VHDL juntos, o fluxo de três etapas é usado:

```text
analyze
elaborate
simulate
```

No ambiente Synopsys, isso envolve análise com ferramentas como `vlogan`/`vhdlan`, elaboração com `vcs` e simulação com `simv`.

---

## Aula didática desenvolvida

### 1. O DUT é simples; o testbench é a parte importante

O somador de 8 bits poderia ser testado com um testbench muito simples:

```systemverilog
initial begin
  a = 8'h10;
  b = 8'h20;
  #1;
  $display("sum=%0h carry=%0b", sum, carry);
end
```

Mas a aula quer mostrar um padrão profissional:

```text
Packet → generator → driver → interface → DUT → monitor → scoreboard
```

Mesmo em um exemplo pequeno, esse padrão prepara para designs grandes.

---

### 2. Por que usar interface no adder?

Sem interface, o DUT teria portas individuais:

```systemverilog
module my_adder (
  input  logic       rstn,
  input  logic [7:0] a,
  input  logic [7:0] b,
  output logic [7:0] sum,
  output logic       carry
);
```

Com interface:

```systemverilog
module my_adder (adder_if swif);
```

Isso agrupa os sinais do adder em um único canal.

Vantagens:

- menos portas no módulo;
- menos erro de conexão;
- mais fácil passar para driver/monitor;
- mais fácil usar virtual interface nas classes;
- a interface representa a fronteira entre DUT e testbench.

---

### 3. Por que usar clock se o adder é combinacional?

O slide deixa claro:

```text
adder is combinational logic and does not require clock signal
clock interface is used by the testbench
```

O clock não é necessário para o somador calcular. Mas é útil para o testbench coordenar:

- quando aplicar estímulo;
- quando amostrar saída;
- quando monitorar;
- quando enviar ao scoreboard.

Ou seja:

```text
o DUT é combinacional;
o ambiente de verificação é sincronizado por clock.
```

---

### 4. O transaction object é o centro da comunicação

A classe `Packet` representa uma transação completa:

```text
rstn
a
b
sum
carry
```

Isso permite que todos os componentes conversem usando o mesmo tipo de objeto.

Driver recebe um packet:

```text
a, b, rstn
```

Monitor produz um packet:

```text
a, b, rstn, sum, carry
```

Scoreboard compara um packet:

```text
expected sum/carry versus observed sum/carry
```

---

### 5. Monitor: observação sem julgamento

O monitor lê a interface:

```systemverilog
m_adder_vif.a
m_adder_vif.b
m_adder_vif.sum
m_adder_vif.carry
```

e monta um `Packet`.

Ele não calcula se está correto. Isso é função do scoreboard.

Essa separação é importante:

```text
monitor observa
scoreboard julga
```

Se o monitor também julgasse, o ambiente ficaria menos modular.

---

### 6. Scoreboard: cálculo esperado e comparação

O scoreboard cria um modelo de referência simples:

```systemverilog
{expected_carry, expected_sum} = a + b;
```

Depois compara com o observado:

```systemverilog
expected_sum   == actual_sum
expected_carry == actual_carry
```

Esse é o coração do self-checking testbench.

Em vez de o aluno olhar waveform manualmente, o scoreboard imprime:

```text
Pass
ou
Error
```

---

### 7. Por que um bug pode estar no scoreboard?

O slide de debug pede para inserir um bug lógico no scoreboard.

Isso é importante porque ensina:

```text
Falha na simulação não significa automaticamente bug no DUT.
```

Pode haver bug em:

- generator;
- driver;
- monitor;
- scoreboard;
- interface;
- reset;
- timing de amostragem;
- expected value.

Por isso, debug precisa isolar a causa.

---

### 8. Environment: montagem do sistema

O environment cria e conecta os componentes:

```text
generator
driver
monitor
scoreboard
mailboxes
events
virtual interfaces
```

Ele é uma camada de organização.

Sem environment, o `tb` teria que conectar tudo manualmente. Com environment, o `test` só chama:

```systemverilog
e0.run();
```

---

### 9. Mailbox e event no ambiente

O código do environment mostra dois mecanismos importantes:

#### Mailbox

Usada para transportar packets:

```text
generator → driver
monitor → scoreboard
```

#### Event

Usado para sincronizar:

```text
driver terminou → avisa generator
```

Padrão:

```systemverilog
-> drv_done;
@(drv_done);
```

---

### 10. Virtual interface: classes acessando sinais

Classes não têm portas físicas como módulos. Para uma classe acessar sinais da interface, ela precisa de um handle:

```systemverilog
virtual adder_if m_adder_vif;
```

O `tb` instancia a interface real:

```systemverilog
adder_if m_adder_if();
```

Depois passa para as classes:

```systemverilog
t0.e0.m_adder_vif = m_adder_if;
```

Resumo:

```text
interface real existe no tb_top
virtual interface é o handle usado pelas classes
```

---

### 11. Fluxo de simulação do adder

O slide usa fluxo de dois passos:

```bash
vcs -sverilog -f adder.f
./simv -l adder.log
```

Para debug:

```bash
vlogan -sverilog -f adder.f -debug_access -l adder.log
./simv +vcs_sim.log -dump adder.fsdb -type FSDB
verdi -nologo -ssf adder.fsdb &
```

A lógica é:

```text
compilar
simular
gerar waveform
abrir debug
```

---

### 12. CLI versus waveform

A CLI mostra mensagens do ambiente:

```text
Driver waiting for item
Monitor ...
Scoreboard Pass
```

A waveform mostra sinais no tempo.

Use CLI para:

- saber se passou;
- ver transações;
- localizar tempo de erro;
- ler mensagens do scoreboard.

Use waveform para:

- ver sinais reais;
- confirmar reset;
- checar timing;
- depurar divergência.

---

### 13. Boa prática: verification plan

Mesmo para o adder, um plano de verificação seria:

| Objetivo | Estímulo | Esperado |
|---|---|---|
| reset | `rstn=0` | `sum=0`, `carry=0` |
| soma sem carry | `a=1`, `b=2` | `sum=3`, `carry=0` |
| soma com carry | `a=8'hFF`, `b=1` | `sum=0`, `carry=1` |
| valores randômicos | `a,b random` | `{carry,sum}=a+b` |

O scoreboard automatiza a checagem.

---

### 14. Boa prática: scripts

Scripts evitam erro manual.

Em vez de digitar comandos longos todo dia, use:

```bash
make clean
make comp
make sim
make wave
```

Isso torna a simulação:

- repetível;
- fácil de compartilhar;
- menos sujeita a erro;
- adequada para regressão.

---

### 15. A lista final de designs

A lista de 10 designs serve para praticar o mesmo fluxo.

Para cada design, o ideal é criar:

```text
DUT
interface
transaction
driver
monitor
scoreboard
environment
test
tb_top
Makefile
```

Mesmo que alguns designs sejam simples, a prática é construir um padrão reutilizável.

---

## Conceitos difíceis explicados em profundidade

### 1. Por que `{carry, sum} = a + b`?

`a` e `b` têm 8 bits.

Maior valor:

```text
a = 255
b = 255
a + b = 510
```

510 em binário precisa de 9 bits.

O resultado de 9 bits é dividido em:

```text
carry → bit 8
sum   → bits 7:0
```

Por isso:

```systemverilog
{carry, sum} = a + b;
```

é a forma compacta de capturar o resultado completo.

---

### 2. Blocking versus nonblocking no adder

No código do somador, o uso de `always_comb` combina naturalmente com atribuições blocking `=`:

```systemverilog
always_comb begin
  {carry, sum} = a + b;
end
```

Como é lógica combinacional, `=` é apropriado.

Em lógica sequencial, usaríamos `<=`:

```systemverilog
always_ff @(posedge clk) begin
  q <= d;
end
```

Regra:

```text
always_comb → blocking =
always_ff   → nonblocking <=
```

---

### 3. Por que o monitor espera clock?

Mesmo que o DUT seja combinacional, o monitor usa clock para amostrar em pontos previsíveis.

Sem isso, ele poderia capturar valores durante transições.

Com clock:

```systemverilog
@(posedge m_clk_vif.tb_clk);
#1;
```

ele espera uma borda e depois um pequeno atraso, permitindo que os sinais se estabilizem.

---

### 4. Scoreboard como reference model

O scoreboard contém um modelo de referência simples:

```systemverilog
{expected_carry, expected_sum} = a + b;
```

Em designs complexos, esse modelo pode ser:

- função SystemVerilog;
- modelo C via DPI;
- modelo Python externo;
- modelo matemático;
- especificação comportamental.

A ideia é sempre a mesma:

```text
comparar observed output com expected output
```

---

### 5. O erro pode estar no testbench

Se o scoreboard estiver errado, ele pode acusar falhas falsas.

Exemplo:

```systemverilog
{expected_carry, expected_sum} = a - b; // bug no scoreboard
```

O DUT pode estar correto, mas o scoreboard vai dizer que está errado.

Por isso, ao debugar, pergunte:

```text
O estímulo está certo?
O monitor capturou certo?
O expected está certo?
O DUT está certo?
```

---

### 6. `join_any` no environment

O slide mostra execução concorrente dos componentes no environment.

Em muitos ambientes:

```systemverilog
fork
  driver.run();
  monitor.run();
  scoreboard.run();
  generator.run();
join_any
```

`join_any` termina quando qualquer uma das threads termina. Isso pode ser útil quando o generator termina e a simulação deve caminhar para encerramento.

Mas cuidado: driver, monitor e scoreboard podem rodar `forever`. O ambiente precisa de estratégia de finalização.

---

### 7. Por que `$finish` é necessário?

O monitor e scoreboard rodam para sempre:

```systemverilog
forever begin
  ...
end
```

Sem `$finish`, a simulação não terminaria sozinha.

Por isso o `tb` contém algo como:

```systemverilog
#1000 $finish;
```

Ou algum mecanismo mais elegante baseado em número de transações concluídas.

---

### 8. FSDB versus VCD

O slide mostra FSDB e VCD.

#### FSDB

Usado com Verdi:

```systemverilog
$fsdbDumpfile("adder.fsdb");
$fsdbDumpvars(3, tb);
```

#### VCD

Formato mais genérico:

```systemverilog
$dumpfile("adder.vcd");
$dumpvars(0, tb);
```

FSDB costuma ser mais eficiente e integrado ao Verdi.

---

### 9. O que o `-debug_access` habilita?

Essa opção permite que o Verdi acesse informações internas do design.

Sem debug access, você pode conseguir simular, mas o debug fica limitado.

Com debug access:

```text
mais sinais visíveis
melhor navegação de hierarquia
melhor correlação com código-fonte
```

---

### 10. Por que o Makefile fica na pasta de simulação?

O Makefile é parte do fluxo operacional, não do RTL.

Ele normalmente fica em:

```text
simulation/
```

porque controla:

```text
compilação
simulação
debug
limpeza
logs
waveforms
```

Isso separa o código-fonte do fluxo de execução.

---

## Figuras, diagramas e waveforms importantes

### Diagrama de testbench

Mostra a estrutura completa com stimulus generator, driver, interface, DUT, monitor e scoreboard. É a arquitetura principal deste bloco.

### Figura do testbench top

Mostra `adder`, `interface`, `virtual interface` e `clock generation`. Essa figura conecta o DUT simples ao ambiente SystemVerilog orientado a objetos.

### Figura do DUT e interfaces

Mostra o código do `my_adder`, a `adder_if` e a `clk_intf`. O ponto central é que o somador é combinacional, mas o testbench usa clock.

### Figura do `tb`

Mostra a instanciação do clock interface, adder interface, DUT, test e comandos FSDB.

### Figura do `Packet`

Mostra a classe de transação com campos randomizados, função de display e função de copy.

### Figura do monitor

Mostra o monitor capturando sinais da virtual interface, criando packet e enviando para a mailbox do scoreboard.

### Figura do scoreboard

Mostra comparação de carry e sum contra valores esperados.

### Figura do environment

Mostra instanciação e conexão de generator, driver, monitor, scoreboard, mailboxes, events e virtual interfaces.

### Figura do test

Mostra a classe `test`, que cria environment e aplica estímulo.

### Figura da simulação CLI

Mostra mensagens de driver, monitor, generator e scoreboard, com passes de carry e sum.

### Figura da waveform no Verdi

Mostra a atividade temporal do adder e dos sinais de interface.

### Figura de boas práticas

Mostra organização de diretórios, filelists, scripts e limpeza de arquivos intermediários.

### Tabela de designs para prática

Mostra 10 designs pequenos para treinar simulação SystemVerilog.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Testbench consists of DUT, stimulus generator and ______.**  
   Resposta: **response checker**.

2. **Simulator and debug environment are same. True or false?**  
   Resposta: **False**.

3. **`vlogan` analyses the design for ________, and generates intermediate files for elaboration.**  
   Resposta aceita pelo curso: **instantiations**.

4. **Model libraries are not required for simulation. True or false?**  
   Resposta aceita pelo curso: **True**.

5. **______ flow is used in design simulations with Verilog/SV and VHDL models.**  
   Resposta: **three step**.

6. **Qual é o DUT do reference design?**  
   Resposta: um somador de dois operandos de 8 bits.

7. **O somador precisa de clock?**  
   Resposta: não, ele é combinacional. O clock é usado pelo testbench.

8. **Para que serve `adder_if`?**  
   Resposta: agrupar sinais do adder: `rstn`, `a`, `b`, `sum`, `carry`.

9. **Para que serve `clk_intf`?**  
   Resposta: gerar e transportar o clock usado pelo testbench.

10. **Para que serve `Packet`?**  
    Resposta: representar uma transação do adder com entradas e saídas.

11. **Qual componente observa sinais e envia ao scoreboard?**  
    Resposta: monitor.

12. **Qual componente compara resultado esperado com observado?**  
    Resposta: scoreboard.

13. **Qual comando abre o Verdi com waveform FSDB?**  
    Resposta: `verdi -nologo -ssf adder.fsdb &`.

14. **Qual opção ajuda no debug pós-processamento?**  
    Resposta: `-debug_access`.

15. **Por que `$finish` é necessário?**  
    Resposta: porque componentes como monitor e scoreboard podem rodar em loops `forever`.

### Pegadinhas

- O adder é combinacional; o clock é do testbench.
- O bug pode estar no scoreboard, não apenas no DUT.
- Simulator e debug environment não são a mesma coisa.
- `vlogan` cobra `instantiations` no gabarito do curso.
- Model libraries são consideradas não necessárias neste fluxo RTL simples.
- Em design misto Verilog/SV/VHDL, o fluxo cobrado é three step.
- Monitor não julga; scoreboard compara.
- Interface real fica no `tb`; virtual interface é o handle usado pelas classes.
- `always_comb` combina com blocking assignment.
- `{carry, sum}` captura os 9 bits da soma de dois operandos de 8 bits.
- Loops `forever` exigem algum mecanismo externo de fim de simulação.
- FSDB é aberto no Verdi; VCD é formato mais genérico.

### Frases para memorizar

```text
O DUT é simples; o ambiente de verificação é o foco.
Adder é combinacional; clock é do testbench.
Packet representa uma transação.
Monitor observa; scoreboard compara.
Interface agrupa sinais; virtual interface conecta classes aos sinais.
VCS simula; Verdi depura.
-debug_access melhora o debug pós-processamento.
Testbench = DUT + stimulus generator + response checker.
```

---

## Relação com projeto/laboratório

Esta aula é um roteiro prático para rodar e depurar um reference design SystemVerilog.

### Estrutura esperada

```text
pc_tutorial/
└── adder/
    ├── rtl/
    │   └── adder.sv
    ├── simulation/
    │   ├── tb.sv
    │   ├── adder.f
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

Ou comandos manuais:

```bash
vcs -sverilog -f adder.f -debug_access -l adder.log
./simv -l adder.log
verdi -nologo -ssf adder.fsdb &
```

### Fluxo de debug

```text
rodar simulação
ver CLI
se scoreboard falhar, abrir waveform
localizar transação que falhou
comparar a, b, sum, carry
ver se reset estava ativo
ver se monitor capturou no tempo certo
ver se expected no scoreboard está correto
corrigir DUT ou testbench
ressimular
```

### Relação com a parte 2

Como este arquivo é explicitamente **Reference Design-1**, a próxima parte deve continuar o reference design SystemVerilog em outro arquivo. A sugestão correta não é um nome genérico como “Reference Designs”, mas a continuação numerada:

```text
06 SystemVerilog Reference Design-2
```

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] O conteúdo ficou fortemente baseado nos prints do DOCX.
- [x] Código/comandos foram preservados e explicados.
- [x] Questões foram respondidas com tradução, alternativa correta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O roteiro/checklist foi conferido antes de sugerir o próximo bloco.
- [x] A sugestão anterior genérica foi corrigida para a divisão em partes.
- [x] O próximo bloco indicado segue a continuação: `06 SystemVerilog Reference Design-2`.

---

## Próximo bloco

**Bloco 015 — 06 SystemVerilog Reference Design-2**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\06 SystemVerilog Reference Design-2.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\06 SystemVerilog Reference Design-2.md
```
