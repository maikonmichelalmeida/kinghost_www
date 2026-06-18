# 04 Verilog Reference Designs

## Controle do bloco

- **Bloco:** 004
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\04 Verilog Reference Designs.docx`
- **Faixa de slides:** 1-15
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\04 Verilog Reference Designs.md`
- **Próximo bloco recomendado:** 005 — `05 Verilog Reference Design of ROBOT Model`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula transforma os conceitos de verificação vistos anteriormente em um fluxo prático de simulação e debug usando **VCS** e **Verdi**. O exemplo principal é um somador de 2 bits, com um arquivo RTL (`Adder2bit.v`) e um testbench (`Adder2bit_tb.v`). A aula mostra como compilar, simular, gerar dump de sinais, abrir a waveform no Verdi, identificar um bug proposital e corrigir o código.

O ponto central é entender o ciclo real de trabalho:

```text
escrever RTL + testbench
        ↓
compilar/analisar com VCS
        ↓
elaborar/simular
        ↓
gerar log e waveform
        ↓
abrir no Verdi
        ↓
identificar bug
        ↓
corrigir e simular novamente
```

A aula também reforça boas práticas: ter plano de verificação, organizar diretórios, separar listas de arquivos do RTL e do testbench, automatizar comandos com scripts, limpar arquivos intermediários e usar o ambiente de debug para investigar a causa de erros. No fim, há uma lista de designs pequenos para praticar simulação: somador, multiplicador, contador, árbitro, mux, demux, encoder, decoder e multiplicação de matrizes.

---

## Texto extraído e organizado por slide

### Slide 1 — Simulation of Design

Para simular um design, é necessário um **testbench**. A estrutura de um testbench é mostrada na figura.

Componentes do testbench:

- **DUT — Design Under Test**
- **Stimulus generator**
- **Response checker**

O testbench pode ser desenvolvido usando qualquer HDL:

- Verilog
- VHDL
- SystemVerilog
- combinação dessas linguagens

Para simular, é necessário um simulador, como o **VCS**. Para depurar, é necessário um ambiente de debug, como o **Verdi Debug Environment**.

O slide apresenta o uso do VCS e o fluxo de simulação em dois ou três passos, dependendo do DUT:

- design Verilog/SystemVerilog;
- design misto Verilog/SystemVerilog/VHDL.

Processo de três passos na simulação:

```text
Analyzing     → vlogan
Elaborating   → vcs
Simulating    → simv
```

Comandos mostrados no slide:

```bash
% vlogan -work -vdb [vlogan_options] -f source_filelist_f + file.log
% vcs -kdb -lca [elaboration_options] [design_unit] + file.log
% simv [simulation/runtime_options] + file.log
```

Interpretação:

- `vlogan` analisa/compila os arquivos Verilog/SystemVerilog.
- `vcs` elabora o design e gera o executável de simulação.
- `simv` executa a simulação.

---

### Slide 2 — Debug Flow

O slide destaca que detectar bug em um design é difícil, embora seja um dos principais objetivos da simulação.

O processo de debug inclui:

- localizar a lógica defeituosa responsável pela resposta errada do DUT;
- isolar o bug;
- entender por que o design não está respondendo como deveria.

Para designs complexos, é necessário um ambiente sofisticado de debug.

O ambiente de debug inclui:

- source code browser;
- schematic viewer;
- waveforms;
- state machine diagrams;
- waveform comparison;
- tracing automático de atividade de sinais usando visão de fluxo temporal;
- assertion-based debug;
- debug e análise de dados de transações e mensagens.

A figura do slide mostra um framework de debug com etapas como:

```text
Analysis
  ↓
Compiling / Elaborating
  ↓
Post-simulation Debug
  ↓
Interactive Simulation Debug
```

E componentes como:

- carregamento de `FSDB`;
- carregamento de database;
- debug por source code;
- debug por waveform;
- análise de mudanças de sinais;
- navegação entre código, esquemático e sinais.

---

### Slide 3 — Verilog Design Under Test (DUT)

O DUT é o módulo a ser verificado. Neste caso, o DUT é um **somador de 2 bits**, que soma dois operandos de 2 bits.

O slide considera um modelo Verilog de somador de 2 bits como design under test.

Características do módulo:

- `x` e `y` são entradas de 2 bits;
- `z` é saída de 3 bits;
- os 2 bits inferiores de `z` representam a soma;
- o bit mais significativo de `z` representa o carry;
- o resultado tem um bit a mais que os operandos para acomodar o carry.

Exemplo reconstruído do DUT:

```verilog
`timescale 1ns / 1ps

module adder2bit (
  input  [1:0] x,
  input  [1:0] y,
  output [2:0] z
);

  wire [1:0] x, y;
  wire [2:0] z;

  assign z = x + y;

endmodule
```

Forma moderna equivalente:

```verilog
`timescale 1ns / 1ps

module adder2bit (
  input  wire [1:0] x,
  input  wire [1:0] y,
  output wire [2:0] z
);

  assign z = x + y;

endmodule
```

Diretório de trabalho indicado:

```text
pc_tutorial
```

Tabela de arquivos:

| Arquivo | Diretório | Descrição |
|---|---|---|
| `Adder2bit.v` | `pc_tutorial/adder2bit/rtl/` | Contém o código-fonte RTL do somador. |
| `Adder2bit_tb.v` | `pc_tutorial/adder2bit/tb/` | Contém o testbench Verilog top-level. |
| `README` | `pc_tutorial/adder2bit/tb/` | Contém detalhes de execução da simulação. |
| `run.sh` | `pc_tutorial/adder2bit/tb/` | Contém scripts de compilação e execução da simulação. |

---

### Slide 4 — Verilog Test Bench for 2-bit Adder DUT

O testbench para testar o módulo somador é mostrado no slide.

Pontos principais:

- A primeira instrução é `` `timescale ``, que define resolução e precisão temporal do simulador.
- O módulo do testbench é `adder2bit_tb` e não possui portas externas.
- Os estímulos `x` e `y` são declarados como `reg`, pois serão atribuídos pelo testbench.
- A saída `z` é declarada como `wire`, pois será dirigida pelo DUT.
- A instanciação do DUT usa o nome de instância `uut`.
- Um bloco `initial` define o arquivo de dump e as variáveis que serão registradas.
- Outro bloco aplica estímulos em tempos diferentes, separados por `#20`.
- Outro bloco usa `$monitor` para observar os sinais durante a simulação.
- O módulo termina com `endmodule`.

Exemplo reconstruído:

```verilog
`timescale 1ns / 1ps

module adder2bit_tb;

  // Inputs
  reg [1:0] x;
  reg [1:0] y;

  // Output
  wire [2:0] z;

  // Instantiate the Design Under Test (DUT)
  adder2bit uut (
    .x(x),
    .y(y),
    .z(z)
  );

  // Dumping signals
  initial begin
    $dumpfile("adder2bit_tb.vcd");
    $dumpvars(0, adder2bit_tb);
  end

  // Feeding the stimulus
  initial begin
    x = 0;
    y = 0;

    #20 x = 1;
        y = 1;

    #20 x = 3;
        y = 1;

    #20 x = 2;
        y = 2;

    #20 x = 0;
        y = 0;

    #40;
  end

  // Monitoring the signals
  initial begin
    $monitor("t=%0t x=%0b y=%0b z=%0b",
             $time, x, y, z);
  end

endmodule
```

A figura lateral do slide separa visualmente o testbench em:

- module and signal declarations;
- DUT instantiation;
- dumping signals;
- feeding the stimulus;
- monitoring the signals.

---

### Slide 5 — Simulation of 2-bit Adder DUT

Antes de rodar, é necessário garantir acesso ao **VCS**.

A simulação Verilog pode ser feita usando **two-step flow**:

1. compilar;
2. simular.

Comandos mostrados:

```bash
% vlogan [vlogan_options] Verilog_filename_list
% vlogan -f src_rtl -debug_access + vcs_test.log
```

Depois:

```bash
% ./simv +vcs_sim.log -dump adder2bit_tb.fsdb -type FSDB
```

Outra forma conceitual citada no slide:

```bash
% vcs -file adder2bit_tb.v ./rtl/adder2bit.v
% ./simv
```

Para pós-processamento e debug, usa-se a opção:

```bash
-debug_access
```

durante a compilação. Essa opção permite que o ambiente de debug tenha acesso às informações necessárias do design.

Dump de sinais pode ser feito com comandos como:

```verilog
initial begin
  $fsdbDumpvars;
  #100 $finish;
end
```

Ou:

```verilog
initial begin
  $dumpfile("adder2bit_tb.vcd");
  $dumpvars(0, stimulus);
  #100 $finish;
end
```

A tabela do slide reforça os arquivos:

| Arquivo | Diretório | Descrição |
|---|---|---|
| `Adder2bit.v` | `pc_tutorial/adder2bit/rtl/` | Contém o código-fonte RTL do somador. |
| `Adder2bit_tb.v` | `pc_tutorial/adder2bit/tb/` | Contém o testbench Verilog top-level. |
| `README` | `pc_tutorial/adder2bit/tb/` | Contém detalhes de execução da simulação. |
| `run.sh` | `pc_tutorial/adder2bit/tb/` | Contém scripts de compilação e execução da simulação. |

---

### Slide 6 — Simulation Results of 2-bit Adder DUT

Os comandos `$display` no testbench imprimem valores na interface de linha de comando.

Resultado mostrado no console:

```text
This example produces the following result in console
t=0   x=00, y=00, z=0
t=20  x=01, y=01, z=2
t=40  x=11, y=11, z=6
t=60  x=10, y=10, z=4
t=100
Note that the assignment x = 3 means 11 in binary.
```

Interpretação:

- `x = 3` em decimal equivale a `2'b11`;
- `y = 3` em decimal equivale a `2'b11`;
- `3 + 3 = 6`;
- em binário, `6 = 3'b110`.

O slide também mostra que o Verdi captura a waveform na GUI. A waveform mostra os sinais mudando ao longo do tempo, permitindo comparar o console com a evolução temporal dos sinais.

---

### Slide 7 — Invoking Debug Environment

O slide orienta simular o design com um bug proposital e abrir o ambiente Verdi.

Comando para abrir o Verdi:

```bash
% verdi -nologo -ssf adder2bit_tb.fsdb &
```

Interpretação:

- `verdi`: abre o ambiente de debug;
- `-nologo`: abre sem tela/logo inicial;
- `-ssf adder2bit_tb.fsdb`: carrega o arquivo de waveform FSDB;
- `&`: executa em background no shell.

Depois disso:

- o design e a waveform são carregados;
- é possível navegar pelos sinais;
- é possível navegar pelo código-fonte;
- o objetivo é identificar o bug no design.

Hint do slide:

```text
bug is in the case when a = b = 2'b11
```

Ou seja, o bug aparece quando:

```verilog
x = 2'b11;
y = 2'b11;
```

O resultado correto deveria ser:

```text
2'b11 + 2'b11 = 3'b110
```

O slide mostra uma versão bugada e uma versão corrigida.

Versão bugada conceitual:

```verilog
module adder2bit (
  input  [1:0] x,
  input  [1:0] y,
  output [2:0] z
);

  wire [1:0] x, y;
  wire [1:0] z;   // bug: largura incorreta

  assign z = x + y;

endmodule
```

Problema: `z` foi declarado com 2 bits em vez de 3. Assim, quando `x = 3` e `y = 3`, a soma `6` precisa de 3 bits (`110`), mas a saída de 2 bits perde o carry e pode ficar `10`.

Correção:

```verilog
module adder2bit (
  input  [1:0] x,
  input  [1:0] y,
  output [2:0] z
);

  wire [1:0] x, y;
  wire [2:0] z;

  assign z = x + y;

endmodule
```

Após corrigir, deve-se rodar a simulação novamente para observar o resultado com o mesmo estímulo.

---

### Slide 8 — Good Practice for Running Simulation (1/2)

Boas práticas para simulação:

- Tenha um **verification plan**.
- O plano de verificação está para o engenheiro de verificação assim como a especificação funcional está para o designer RTL.
- O verification plan reduz o esforço de planejamento em grande extensão.
- Um plano de verificação executável detalha cada objetivo de verificação e permite quantificá-los usando alguma automação.
- Pense em reutilização de verificação como designers pensam em reutilização de design.
- Os módulos de testbench devem ser modulares e distintos no ambiente.
- Todas as tarefas repetitivas durante a simulação devem ser transformadas em scripts.
- Acelerar a simulação é muito importante, pois ela é executada ao longo de todo o processo de design.
- Uma forma de acelerar é compilar design e componentes do testbench uma vez e depois rodar simulação com modelos pré-compilados.
- Também se pode usar simulação incremental apenas para o código alterado.

Interpretação didática: a aula está dizendo que verificação não deve ser feita “no improviso”. Ela precisa de planejamento, modularidade, automação e reaproveitamento.

---

### Slide 9 — Good Practice for Running Simulation (2/2)

Boas práticas adicionais:

- Organize o diretório do design conforme mostrado na figura.
- Crie diretórios modulares de testbench.
- Tenha arquivo `README` explicando a estrutura dos diretórios.
- Gere listas de arquivos separadas para módulos RTL e módulos de testbench.
- Gere script de execução para rodar simulações com opções diferentes:
  - simulação simples;
  - simulação com ambiente de debug;
  - outras opções de runtime.

Exemplo de script mostrado para verificação RTL:

```bash
RTL_Verification: clean ana comp sim

ana_ana_comp:
	vlogan -f adder2bit.log -kdb -work -vlogan adder2bit.v adder2bit_tb.v

comp:
	vcs -l adder2bit.log

sim:
	./simv
```

O slide também mostra um comando de limpeza:

```bash
clean:
	rm -rf simv* csrc* ${VROOOT}/libs *.log vlogansetup.args *.fsdb
```

Observação: o texto no slide parece conter erro visual em `${VROOOT}`. O mais provável em scripts reais seria uma variável como `${VROOT}` ou `${ROOT}`. A ideia principal é remover arquivos intermediários e logs antes de uma nova execução.

A figura de diretórios mostra uma organização típica com:

```text
Design/
 ├── src/
 ├── sys/
 ├── sim/
 ├── logs/
 ├── unmapped/
 ├── mapped/
 └── netlist/
```

A mensagem central é separar claramente fonte, scripts, logs, resultados e arquivos gerados por ferramenta.

---

### Slide 10 — Verify Yourself by Simulation Designs...

O slide propõe uma lista de 10 pequenos designs para praticar simulação.

Lista reconstruída:

| Nº | Design | Descrição | Arquivos de referência |
|---:|---|---|---|
| 1 | 32-bit Adder | Soma dois operandos de 32 bits armazenados em registradores `op_a` e `op_b`; o resultado é armazenado em registrador de 33 bits `out`. | `32bit_adder.v`, `32bit_adder_tb.v` |
| 2 | 16 x 16 multiplier | Multiplica dois operandos de 16 bits armazenados em `op_a` e `op_b`; requer saída de 32 bits. | `multiplier.v`, `multiplier_tb.v` |
| 3 | 12-bit Counter with Overflow | Contador de 12 bits inicia contagem quando `enable` fica alto; quando `load` fica alto, carrega `loadval`; `overflow_out` indica overflow. | `counter_overflow.v`, `counter_overflow_tb.v` |
| 4 | 4-bit Up/Down Counter | Quando `enable` está alto, conta up/down conforme sinal de controle; contador de 4 bits. | `updown_counter.v`, `updown_counter_tb.v` |
| 5 | 2-Client Arbiter | Monitora requests de client 1 e client 2; concede acesso conforme política de prioridade. | `arbiter.v`, `arbiter_tb.v` |
| 6 | 4:1 Multiplexer | Seleciona uma das entradas conforme linhas de seleção. | `Mux4x1.v`, `Mux4x1_tb.v` |
| 7 | 1:8 Demultiplexer | Direciona a entrada para uma saída selecionada. | `Demux1x8.v`, `Demux1x8_tb.v` |
| 8 | 4:2 Encoder | Codifica entrada de 4 bits. | `encoder4x2.v`, `Encoder4x2_tb.v` |
| 9 | 2:4 Decoder | Decodifica entrada de 2 bits. | `decoder2x4.v`, `decoder2x4_tb.v` |
| 10 | 3 x 2 Matrix Multiplication | Multiplica matriz com operandos de 32 bits e armazena resultado em registradores de 32 bits. | `matrix3x2_mult.v`, `matrix3x2_mult_tb.v` |

A função didática dessa lista é treinar o ciclo completo:

```text
ler RTL
entender entradas e saídas
criar ou rodar testbench
simular
observar waveform
identificar erro
corrigir
retestar
```

---

### Slide 11 — Questão 1

**Questão:** Test bench consists of DUT, stimulus generator and ______.

Alternativas:

- A. input-outputs
- B. clock-reset
- C. response checker

**Resposta correta:** C. response checker.

**Tradução:** O testbench consiste em DUT, gerador de estímulos e verificador de resposta.

**Justificativa:** O primeiro slide define a estrutura básica do testbench como DUT, stimulus generator e response checker.

---

### Slide 12 — Questão 2

**Questão:** Simulator and debug environment are same.

Alternativas:

- True
- False

**Resposta correta:** False.

**Tradução:** Simulador e ambiente de debug são a mesma coisa.

**Justificativa:** O slide separa claramente o simulador, como **VCS**, do ambiente de debug, como **Verdi**. O VCS executa a simulação; o Verdi permite navegar em waveforms, código-fonte, esquemáticos e estruturas de debug.

---

### Slide 13 — Questão 3

**Questão:** `vlogan` analyses the design for ________, and generates intermediate files for elaboration.

Alternativas:

- A. syntax errors
- B. instantiations
- C. hierarchy

**Resposta correta aceita pelo curso:** B. instantiations.

**Tradução:** `vlogan` analisa o design quanto a instâncias e gera arquivos intermediários para a elaboração.

**Justificativa pelo curso:** O banco do curso aceita **instantiations**. Tecnicamente, `vlogan` também realiza análise sintática e semântica, mas nesta questão específica o gabarito validado é **instantiations**.

---

### Slide 14 — Questão 4

**Questão:** Model libraries are not required for simulation.

Alternativas:

- True
- False

**Resposta correta aceita pelo curso:** True.

**Tradução:** Bibliotecas de modelo não são necessárias para simulação.

**Justificativa pelo curso:** No fluxo simples de simulação RTL apresentado, a simulação usa o RTL e o testbench diretamente. Portanto, no enquadramento desta questão, bibliotecas de modelo não são exigidas.

---

### Slide 15 — Questão 5

**Questão:** ______ flow is used in design simulations with Verilog/SV and VHDL models.

Alternativas:

- A. two step
- B. three step
- C. simv

**Resposta correta aceita pelo curso:** C. simv.

**Tradução:** O fluxo ______ é usado em simulações de design com modelos Verilog/SV e VHDL.

**Justificativa pelo curso:** O print mostra a alternativa **simv** como aceita. Há uma inconsistência técnica na formulação, porque `simv` é o executável de simulação gerado pelo VCS, não exatamente um “flow”. Ainda assim, para esta questão do banco, a resposta correta é **simv**.

---

## Aula didática desenvolvida

### 1. Simular é testar comportamento antes do hardware existir

Em projeto digital, o RTL descreve um circuito, mas antes de síntese, implementação física ou fabricação, é necessário simular. Simulação significa executar o modelo do circuito em um simulador e observar se a resposta bate com o esperado.

O fluxo mental é:

```text
Eu tenho um DUT.
Eu aplico entradas nele.
Eu observo saídas.
Eu comparo com o esperado.
Se bate, o teste passa.
Se não bate, preciso depurar.
```

No exemplo da aula, o DUT é muito simples: um somador de 2 bits. Mesmo assim, ele já mostra um erro clássico: largura insuficiente da saída. Se o resultado pode ter 3 bits, mas a saída tem só 2, o carry é perdido.

---

### 2. Testbench: o ambiente que cerca o DUT

Um testbench não é apenas um arquivo que “chama” o DUT. Ele é um ambiente de teste.

A estrutura mínima é:

```text
stimulus generator → DUT → response checker
```

#### Stimulus generator

Gera entradas para o DUT.

Exemplo:

```verilog
initial begin
  x = 0;
  y = 0;

  #20 x = 1;
      y = 1;

  #20 x = 3;
      y = 3;
end
```

#### DUT

É o módulo testado:

```verilog
adder2bit uut (
  .x(x),
  .y(y),
  .z(z)
);
```

#### Response checker

Compara a saída com o esperado. No exemplo dos slides, aparece monitoramento por console e waveform. Em um testbench mais robusto, haveria um check explícito:

```verilog
if (z !== x + y)
  $display("FAILED");
else
  $display("PASSED");
```

---

### 3. VCS: analisar, elaborar e simular

O VCS trabalha com etapas.

#### Análise com `vlogan`

A etapa de análise lê os arquivos HDL, interpreta o código, checa consistência e gera arquivos intermediários.

Exemplo:

```bash
vlogan -f src_rtl -debug_access -l vcs_test.log
```

- `-f src_rtl`: lê uma lista de arquivos.
- `-debug_access`: habilita informações necessárias para debug.
- `-l vcs_test.log`: grava log da execução.

#### Elaboração com `vcs`

A elaboração monta a hierarquia do design, resolve instâncias e gera o executável de simulação.

Exemplo:

```bash
vcs -debug_access -l elaborate.log adder2bit_tb
```

#### Simulação com `simv`

Depois da elaboração, o executável gerado é normalmente chamado de `simv`.

Exemplo:

```bash
./simv -l sim.log
```

Esse comando executa a simulação.

---

### 4. Two-step versus three-step flow

O slide menciona que o VCS pode ser usado em fluxo de dois ou três passos.

#### Two-step flow

Fluxo mais simples para Verilog/SystemVerilog:

```text
compilar/elaborar
simular
```

Exemplo:

```bash
vcs Adder2bit_tb.v ../rtl/Adder2bit.v
./simv
```

Aqui o comando `vcs` já faz boa parte do trabalho e gera o executável.

#### Three-step flow

Fluxo separado:

```text
vlogan → vcs → simv
```

Esse fluxo é mais explícito e útil quando há:

- muitos arquivos;
- bibliotecas;
- design misto;
- necessidade de recompilação incremental;
- opções específicas por etapa;
- integração com scripts.

---

### 5. O papel do `-debug_access`

Quando você quer abrir o Verdi e navegar no design, o simulador precisa guardar informações extras. Sem isso, a simulação pode até rodar, mas o debug fica limitado.

A opção:

```bash
-debug_access
```

habilita informações para que o ambiente de debug consiga acessar sinais, hierarquia, código e dados necessários.

Em fluxos Synopsys modernos, é comum ver variações como:

```bash
-debug_access+all
```

ou opções equivalentes configuradas pelo curso, pelo Makefile ou pelo script do lab.

---

### 6. Dump de sinais: VCD e FSDB

Para abrir waveform, a simulação precisa gerar um arquivo de dump.

#### VCD

Formato comum e simples:

```verilog
initial begin
  $dumpfile("adder2bit_tb.vcd");
  $dumpvars(0, adder2bit_tb);
end
```

#### FSDB

Formato usado com Verdi:

```verilog
initial begin
  $fsdbDumpfile("adder2bit_tb.fsdb");
  $fsdbDumpvars(0, adder2bit_tb);
end
```

O slide usa o arquivo:

```text
adder2bit_tb.fsdb
```

e abre com:

```bash
verdi -nologo -ssf adder2bit_tb.fsdb &
```

---

### 7. Como encontrar o bug do somador

O bug indicado aparece quando:

```verilog
x = 2'b11;
y = 2'b11;
```

Cálculo correto:

```text
2'b11 = 3 decimal
3 + 3 = 6
6 = 3'b110
```

Se a saída tiver 3 bits:

```verilog
output [2:0] z;
```

o resultado cabe.

Se a saída tiver só 2 bits:

```verilog
output [1:0] z;
```

o bit de carry é truncado.

Resultado truncado:

```text
3'b110 → usando só 2 bits inferiores → 2'b10
```

Esse é um bug perfeito para aprender debug, porque:

- a simulação roda;
- não há necessariamente erro de compilação;
- alguns casos passam;
- só o caso com carry revela o problema;
- waveform e console ajudam a localizar.

---

### 8. Debug não é só olhar waveform

Waveform é importante, mas debug é um processo.

Passos:

```text
1. Ver o resultado errado.
2. Identificar em qual tempo o erro ocorreu.
3. Ver quais entradas estavam ativas.
4. Ver a saída esperada.
5. Ver a saída real.
6. Inspecionar o RTL.
7. Formular hipótese.
8. Corrigir.
9. Reexecutar o mesmo teste.
```

No exemplo:

```text
tempo do erro → caso x=3 e y=3
saída esperada → 6
saída real → valor truncado
hipótese → largura de z errada
correção → z deve ter 3 bits
```

---

### 9. Verification plan

O slide compara:

```text
Verification plan para engenheiro de verificação
Functional specification para designer RTL
```

Isso significa que verificação não deve ser improvisada. Um plano de verificação define:

- o que será testado;
- quais funcionalidades são obrigatórias;
- quais casos de canto precisam ser cobertos;
- quais cenários são ilegais;
- quais checks serão feitos;
- quais métricas indicam que a verificação foi suficiente;
- quais testes são directed;
- quais testes são randômicos;
- quais funcionalidades precisam de coverage.

Para um somador simples, o plano é pequeno. Para um processador, barramento ou SoC, o plano vira parte central do projeto.

---

### 10. Reutilização de verificação

O slide diz para pensar em reuse de verificação como designers pensam em reuse de design.

Isso é muito importante. Um testbench bem feito não deve servir só uma vez. Ele deve poder ser adaptado para:

- novo tamanho de dado;
- novos casos de teste;
- nova versão do RTL;
- simulação com debug;
- simulação regressiva;
- simulação gate-level;
- variações de parâmetros.

Por isso o testbench deve ser modular:

```text
gerador de estímulos separado
checker separado
driver separado
monitor separado
scripts separados
filelists separados
logs separados
```

---

### 11. Organização de diretórios

Um projeto que mistura tudo em uma pasta fica difícil de manter. A aula recomenda separar:

```text
rtl/
tb/
sim/
log/
scripts/
netlist/
```

Uma organização prática para o exemplo seria:

```text
pc_tutorial/
└── adder2bit/
    ├── rtl/
    │   └── Adder2bit.v
    ├── tb/
    │   ├── Adder2bit_tb.v
    │   ├── README
    │   └── run.sh
    └── sim/
        ├── logs/
        └── waves/
```

Essa organização ajuda no uso de Makefile, scripts e automações.

---

### 12. Filelists

Em vez de escrever todos os arquivos na linha de comando:

```bash
vcs Adder2bit_tb.v ../rtl/Adder2bit.v
```

é melhor usar filelist:

```text
../rtl/Adder2bit.v
../tb/Adder2bit_tb.v
```

E chamar:

```bash
vlogan -f filelist.f
```

Vantagens:

- mais limpo;
- facilita projetos grandes;
- permite separar RTL e TB;
- reduz erro de digitação;
- facilita integração com Makefile.

Observação importante do curso anterior: em alguns labs do professor, quando a waveform não aparece corretamente, pode ser necessário colocar o testbench antes do design no `filelist.f`. Para este fluxo, seguir a orientação específica do lab quando ela aparecer.

---

### 13. Scripts de execução

Um script como `run.sh` ou um `Makefile` deve automatizar:

```text
limpar arquivos antigos
compilar/analisar
elaborar
simular
gerar log
gerar waveform
abrir Verdi
```

Exemplo didático:

```bash
#!/bin/bash

rm -rf simv* csrc *.log *.fsdb *.vcd

vlogan -full64 -sverilog -f filelist.f -debug_access+all -l compile.log
vcs -full64 adder2bit_tb -debug_access+all -l elaborate.log
./simv -l sim.log
```

Com Verdi:

```bash
verdi -nologo -ssf adder2bit_tb.fsdb &
```

Essa automação evita que cada simulação dependa de comandos manuais longos.

---

### 14. Limpeza de arquivos intermediários

Simuladores geram muitos arquivos:

```text
simv
simv.daidir
csrc
*.log
*.fsdb
*.vcd
ucli.key
novas*
verdiLog
```

Se esses arquivos ficarem acumulados, podem causar confusão. Um comando `clean` ajuda:

```bash
rm -rf simv* csrc *.log *.fsdb *.vcd ucli.key novas* verdiLog
```

Isso garante que a próxima simulação começa limpa.

---

### 15. Designs de prática

A lista final da aula é importante porque cria uma progressão natural:

1. Somador: largura de sinal e carry.
2. Multiplicador: largura de resultado.
3. Contador: clock, enable, load, overflow.
4. Up/down counter: controle de direção.
5. Arbiter: prioridade e grants.
6. Mux: seleção combinacional.
7. Demux: roteamento de entrada.
8. Encoder: codificação e prioridade.
9. Decoder: decodificação.
10. Matrix multiplication: loops, arrays e organização de dados.

Esses designs são pequenos, mas cobrem a base de RTL e testbench.

---

## Conceitos difíceis explicados em profundidade

### 1. DUT, testbench e ambiente de simulação

O DUT é o circuito. O testbench é o ambiente.

```verilog
module adder2bit (...);
  // DUT
endmodule

module adder2bit_tb;
  // Testbench
endmodule
```

O testbench instancia o DUT:

```verilog
adder2bit uut (
  .x(x),
  .y(y),
  .z(z)
);
```

A instância `uut` significa normalmente:

```text
Unit Under Test
```

Ela é o objeto que o testbench manipula.

---

### 2. Por que o testbench não tem portas?

Um módulo RTL comum tem portas porque se conecta a outros blocos.

Um testbench top-level geralmente não tem portas porque ele é o topo da simulação. Ele cria internamente os sinais de estímulo e observação.

Exemplo:

```verilog
module adder2bit_tb;

  reg [1:0] x;
  reg [1:0] y;
  wire [2:0] z;

endmodule
```

Esses sinais existem dentro do ambiente de teste e são conectados ao DUT.

---

### 3. Erro de largura de sinal

Esse é o bug principal do exemplo.

Se temos:

```verilog
wire [1:0] z;
assign z = x + y;
```

e:

```verilog
x = 2'b11;
y = 2'b11;
```

o resultado matemático é:

```text
3 + 3 = 6 = 3'b110
```

Mas `z` só tem 2 bits. Resultado truncado:

```text
z = 2'b10
```

Por isso a saída correta deve ser:

```verilog
wire [2:0] z;
```

Regra geral:

```text
Soma de dois operandos de N bits pode precisar de N+1 bits.
Multiplicação de A bits por B bits pode precisar de A+B bits.
```

Exemplos:

```text
2 bits + 2 bits → até 3 bits
16 bits × 16 bits → até 32 bits
32 bits + 32 bits → até 33 bits
```

---

### 4. Diferença entre simulador e ambiente de debug

A questão 2 reforça uma distinção importante.

#### Simulador

Executa o modelo.

Exemplo:

```text
VCS
```

Funções:

- compilar/analisar HDL;
- elaborar hierarquia;
- executar simulação;
- gerar logs;
- gerar dump de sinais.

#### Ambiente de debug

Ajuda a investigar o que aconteceu.

Exemplo:

```text
Verdi
```

Funções:

- abrir waveform;
- navegar em hierarquia;
- cruzar sinal com código;
- ver esquemático;
- rastrear drivers e loads;
- comparar sinais;
- investigar causa de bug.

Resumo:

```text
VCS roda.
Verdi investiga.
```

---

### 5. O que significa “elaboration”?

Elaboração é a etapa em que a ferramenta monta a hierarquia real do design.

Ela resolve:

- qual módulo instancia qual módulo;
- parâmetros;
- conexões de portas;
- hierarquia;
- dependências;
- unidades de design;
- preparação do executável de simulação.

Exemplo:

```verilog
adder2bit uut (
  .x(x),
  .y(y),
  .z(z)
);
```

Durante a elaboração, a ferramenta resolve que `uut` é uma instância do módulo `adder2bit`, conectada aos sinais do testbench.

---

### 6. `vlogan`, `vcs` e `simv`

Esses três nomes aparecem muito em labs Synopsys.

#### `vlogan`

Analisa arquivos Verilog/SystemVerilog.

```bash
vlogan -f filelist.f
```

#### `vcs`

Elabora e gera o executável da simulação.

```bash
vcs top_tb
```

#### `simv`

Executa a simulação.

```bash
./simv
```

A resposta de prova validada pelo curso para a questão de `vlogan` é **instantiations**, mas na prática também é correto lembrar que `vlogan` detecta erros sintáticos e prepara informações intermediárias para as próximas etapas.

---

### 7. FSDB

FSDB é um formato de banco de dados de waveform associado ao ecossistema Verdi/Novas/Synopsys.

Para gerar FSDB, usa-se algo como:

```verilog
initial begin
  $fsdbDumpfile("adder2bit_tb.fsdb");
  $fsdbDumpvars(0, adder2bit_tb);
end
```

Para abrir:

```bash
verdi -nologo -ssf adder2bit_tb.fsdb &
```

Sem arquivo de waveform, o debug visual fica muito limitado.

---

### 8. Console versus waveform

O console mostra texto:

```text
t=40 x=11 y=11 z=6
```

A waveform mostra sinais ao longo do tempo.

Console é bom para:

- PASS/FAIL;
- mensagens de erro;
- prints resumidos;
- logs de checkpoints.

Waveform é boa para:

- ver transições;
- ver reset;
- ver clock;
- ver se o estímulo chegou;
- ver em que ciclo o bug apareceu;
- rastrear causa temporal.

Os dois se complementam.

---

### 9. Verification plan executável

Um plano de verificação pode ser uma tabela simples:

| Funcionalidade | Teste | Critério de aprovação |
|---|---|---|
| Soma sem carry | `1 + 1` | `z = 2` |
| Soma com carry | `3 + 3` | `z = 6` |
| Entrada zero | `0 + 0` | `z = 0` |
| Todos os pares | loop de `x=0..3`, `y=0..3` | todas as somas corretas |

Um plano executável transforma esses objetivos em testes automatizados.

Exemplo:

```verilog
integer a, b;

initial begin
  for (a = 0; a < 4; a = a + 1) begin
    for (b = 0; b < 4; b = b + 1) begin
      x = a;
      y = b;
      #1;

      if (z !== a + b)
        $display("FAILED: x=%0d y=%0d z=%0d expected=%0d",
                 a, b, z, a+b);
    end
  end
end
```

Esse teste cobre todas as combinações do somador de 2 bits.

---

### 10. Por que automatizar?

Sem script, cada simulação exige lembrar comandos longos. Isso gera erros.

Com script:

```bash
make sim
make wave
make clean
```

ou:

```bash
./run.sh
```

o fluxo fica repetível.

Repetibilidade é essencial em verificação:

```text
O mesmo código + mesmo teste + mesma seed + mesmo comando
deve produzir o mesmo resultado.
```

Se cada pessoa roda de um jeito, os bugs ficam difíceis de reproduzir.

---

## Figuras, diagramas e waveforms importantes

### Figura de estrutura do testbench

Mostra `Stimulus → DUT → Response checker`. Essa figura resume a função de um testbench e aparece como base para as questões.

### Figura de three-step simulation

Mostra três blocos:

```text
Analyzing with vlogan
Elaborating vcs
Simulating simv
```

É essencial para memorizar a ordem do fluxo VCS.

### Figura de debug flow

Mostra a passagem de análise/compilação para debug pós-simulação e debug interativo. A figura reforça que debug exige banco de dados, waveform, código-fonte e ferramentas de navegação.

### Figura do DUT `adder2bit`

Mostra o código do somador. O ponto importante é a largura da saída `z`, que precisa de 3 bits.

### Figura do testbench

Mostra a divisão do testbench em seções: sinais, instância do DUT, dump, estímulo e monitoramento.

### Figura da simulação do somador

Mostra comandos VCS, geração de FSDB/VCD e tabela de arquivos. Essa figura é a ponte entre código e execução real em terminal.

### Figura de resultados no console

Mostra que `$display` ou `$monitor` imprimem valores como `t=0`, `t=20`, `t=40`. Ela confirma a relação entre estímulo e tempo de simulação.

### Figura da waveform no Verdi

Mostra os sinais do somador mudando ao longo do tempo. Ela é o principal recurso visual para confirmar ou investigar a simulação.

### Figura de organização de diretórios

Mostra uma estrutura de projeto separando fontes, scripts, logs e resultados. Essa organização evita confusão em labs maiores.

### Tabela de designs de prática

Mostra 10 designs pequenos para treinar simulação e testbench, indo de somador até multiplicação de matrizes.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Test bench consists of DUT, stimulus generator and ______.**  
   Resposta: **response checker**.

2. **Simulator and debug environment are same. True or false?**  
   Resposta: **False**.

3. **`vlogan` analyses the design for ______ and generates intermediate files for elaboration.**  
   Resposta aceita pelo curso: **instantiations**.

4. **Model libraries are not required for simulation. True or false?**  
   Resposta aceita pelo curso: **True**.

5. **______ flow is used in design simulations with Verilog/SV and VHDL models.**  
   Resposta aceita pelo curso: **simv**.

6. **Qual ferramenta é usada como simulador no slide?**  
   Resposta: **VCS**.

7. **Qual ferramenta é usada como ambiente de debug?**  
   Resposta: **Verdi**.

8. **Quais são as três etapas do fluxo VCS mostrado?**  
   Resposta: **vlogan → vcs → simv**.

9. **Para que serve `-debug_access`?**  
   Resposta: habilitar informações necessárias para debug pós-simulação.

10. **Para que serve `verdi -nologo -ssf adder2bit_tb.fsdb &`?**  
    Resposta: abrir o Verdi carregando o arquivo FSDB da simulação.

11. **Qual é o bug do somador de 2 bits?**  
    Resposta: largura incorreta da saída `z`, que precisa ter 3 bits para acomodar o carry.

12. **Por que `3 + 3` precisa de 3 bits?**  
    Resposta: porque `3 + 3 = 6 = 3'b110`.

### Pegadinhas

- Simulador e debug environment não são a mesma coisa.
- `simv` não é uma linguagem; é o executável de simulação gerado pelo VCS.
- O curso aceitou `instantiations` para a questão sobre `vlogan`, apesar de `syntax errors` parecer tecnicamente plausível.
- No exemplo do curso, model libraries não são exigidas para simulação RTL simples.
- Somar dois sinais de 2 bits pode exigir 3 bits de resultado.
- Um design pode compilar e ainda estar funcionalmente errado.
- Console ajuda, mas waveform é fundamental para debug temporal.
- Sem `-debug_access`, o Verdi pode não ter acesso suficiente ao design.
- Scripts evitam erro manual e tornam simulações repetíveis.
- Testbench não deve ficar misturado com RTL em organização de projeto.

### Frases para memorizar

```text
VCS simula; Verdi depura.
Testbench = DUT + stimulus generator + response checker.
vlogan analisa; vcs elabora; simv executa.
FSDB é waveform para debug no Verdi.
Soma de N bits pode precisar de N+1 bits.
Plano de verificação guia os testes como especificação funcional guia o RTL.
Scripts tornam a simulação repetível.
```

---

## Relação com projeto/laboratório

Esta aula é praticamente um roteiro de laboratório para simulação.

### Relação com comandos de terminal

Os comandos centrais são:

```bash
vlogan -f filelist.f -debug_access -l compile.log
vcs top_tb -debug_access -l elaborate.log
./simv -l sim.log
verdi -nologo -ssf adder2bit_tb.fsdb &
```

Esses comandos aparecem em muitos labs Synopsys, com variações.

### Relação com Makefile

Um Makefile pode organizar os alvos:

```makefile
clean:
	rm -rf simv* csrc *.log *.fsdb *.vcd

compile:
	vlogan -f filelist.f -debug_access+all -l compile.log

elab:
	vcs adder2bit_tb -debug_access+all -l elaborate.log

sim:
	./simv -l sim.log

wave:
	verdi -nologo -ssf adder2bit_tb.fsdb &
```

Assim, o usuário roda:

```bash
make clean
make compile
make elab
make sim
make wave
```

### Relação com debug real

Quando um teste falhar, o caminho é:

```text
ler log
achar tempo do erro
abrir waveform
ver entradas e saídas
ir para o código-fonte
corrigir RTL ou testbench
rodar novamente
```

### Relação com próximos blocos

Os próximos reference designs devem usar exatamente a mesma lógica:

```text
entender o DUT
entender o testbench
rodar a simulação
olhar resultados
usar Verdi se necessário
corrigir bugs ou interpretar comportamento
```

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

**Bloco 005 — 05 Verilog Reference Design of ROBOT Model**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\05 Verilog Reference Design of ROBOT Model.docx
```

Faixa:

```text
Slides 1-19
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\05 Verilog Reference Design of ROBOT Model.md
```
