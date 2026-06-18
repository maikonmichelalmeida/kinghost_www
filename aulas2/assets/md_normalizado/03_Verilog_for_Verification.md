# 03 Verilog for Verification

## Controle do bloco

- **Bloco:** 003
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\03 Verilog for Verification.docx`
- **Faixa de slides:** 1-17
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\03 Verilog for Verification.md`
- **Próximo bloco recomendado:** 004 — `04 Verilog Reference Designs`

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula apresenta o uso de **Verilog para verificação**, isto é, para construir testbenches que estimulam um **DUT — Design Under Test** e verificam se a resposta gerada bate com a especificação esperada. O foco deixa de ser “como escrever RTL sintetizável” e passa a ser “como testar o RTL por simulação”.

A aula começa introduzindo **HVL — Hardware Verification Language**, explica a estrutura básica de um testbench, mostra um exemplo de verificação de um somador de 2 bits, apresenta system tasks como `$monitor`, `$display`, `$dumpfile`, `$dumpvars`, `$dumplimit`, `$dumpon` e `$dumpoff`, e depois avança para delays, nets multidirigidas, functions, tasks, `begin/end`, `fork/join`, PLI, operações com arquivos, geração randômica de estímulos, conceitos de testbench auto-checável, switches de compilação, geradores de clock, estilo de codificação para verificação e debugging.

O ponto central é: **Verilog em testbench pode usar constructs não sintetizáveis**, porque o objetivo não é virar hardware, mas sim controlar a simulação, gerar estímulos, observar respostas, gravar arquivos, abrir waveforms e automatizar checks. Essa separação entre **DUT sintetizável** e **testbench não sintetizável** é fundamental para todo o fluxo posterior com VCS, Verdi, SystemVerilog e UVM.

---

## Texto extraído e organizado por slide

### Slide 1 — Hardware Verification Language (HVL)

HVLs incluem recursos de linguagens de programação de alto nível, como C++ ou Java, além de recursos para manipulação em nível de bits semelhantes aos encontrados em HDLs.

Características listadas:

- suportam geração de estímulos randômicos com constraints;
- possuem constructs para extrair coverage de verificação;
- devem ser simples, abstratas, escaláveis e fáceis de manter;
- no início, como o hardware era mais simples, HDLs eram usadas para escrever testbenches com estímulos randômicos mínimos;
- Verilog foi uma das linguagens usadas para verificação de blocos lógicos simples;
- uma HVL deve ser capaz de:
  - concurrent assertions;
  - constraint random stimulus generation;
  - noção de tempo;
  - formas de conexão ao device under test;
- Specman e foi a primeira linguagem de verificação de hardware full-fledged;
- depois vieram SystemVerilog, OpenVera e SystemC.

Figura do slide:

```text
Testbench
 ├── Stimulus
 ├── Device under test
 └── Response checker
```

Interpretação: o testbench gera estímulos, aplica no DUT e confere a resposta.

---

### Slide 2 — Verilog Design Under Test (DUT)

Pontos principais:

- O **Design Under Test** é o módulo a ser verificado.
- A verificação do DUT busca confirmar conformidade funcional com a especificação do design derivada dos requisitos.
- O exemplo considera um somador de 2 bits como DUT.
- O design é modelado em Verilog usando constructs diretos.
- O módulo é um somador de 2 bits:
  - `x` e `y` são entradas de 2 bits;
  - `z` tem 3 bits;
  - os 2 bits menos significativos de `z` representam a soma;
  - o MSB de `z` representa o carry.
- O resultado tem um bit a mais que os operandos para acomodar o carry.
- Usa `assign` combinacional para a função comportamental do somador.
- Todas as variáveis são declaradas como `wire`.

Exemplo reconstruído:

```verilog
`timescale 2ns / 1ps

module adder2bit;
  input  [1:0] x;
  input  [1:0] y;
  output [2:0] z;

  wire [1:0] x, y;
  wire [2:0] z;

  assign z = x + y;
endmodule
```

Observação técnica: a forma mais comum e correta de declarar seria:

```verilog
module adder2bit (
  input  wire [1:0] x,
  input  wire [1:0] y,
  output wire [2:0] z
);

  assign z = x + y;

endmodule
```

---

### Slide 3 — Verilog Testbench for a 2-Bit Adder DUT

O slide mostra um testbench para testar o módulo `adder2bit` como DUT.

Pontos principais:

- A primeira instrução `` `timescale `` define a resolução e precisão temporal do simulador.
- O módulo de testbench se chama `adder2bit_tb` e não tem sinais de I/O externos.
- Os estímulos `x` e `y` são declarados como `reg`, pois serão atribuídos proceduralmente dentro do testbench.
- A saída `z` é declarada como `wire`, pois será dirigida pelo DUT.
- A instanciação do DUT é feita com nome de instância `uut`.
- Um bloco `initial` define o nome do arquivo de dump e configura quais variáveis serão salvas para a simulação.
- Os estímulos são aplicados em diferentes instantes, separados por `#20`.
- Outro bloco `initial` usa `$monitor` para monitorar os sinais em diferentes tempos da simulação.
- O módulo testbench termina com `endmodule`.

Exemplo reconstruído:

```verilog
`timescale 2ns / 1ps

module adder2bit_tb;

  // Inputs
  reg [1:0] x;
  reg [1:0] y;

  // Outputs
  wire [2:0] z;

  // Instantiate the Design Under Test (DUT)
  adder2bit uut (
    .x(x),
    .y(y),
    .z(z)
  );

  initial begin
    $dumpfile("adder2bit_tb.vcd");
    $dumpvars;
  end

  initial begin
    // Initialize inputs
    x = 0;
    y = 0;

    #20 x = 3;
        y = 1;

    #20 x = 3;
        y = 3;

    #20 x = 3;
        y = 1;

    #20 x = 1;
        y = 0;

    #40;
  end

  initial begin
    $monitor("t=%0t x=%0d y=%0d z=%0d",
             $time, x, y, z);
  end

endmodule
```

O console do simulador mostra resultados em tempos diferentes, indicando que a atribuição `x + y` está funcionando.

---

### Slide 4 — Verilog System Tasks for Verification

Verilog fornece system tasks e system functions para gerar entrada/saída e ajudar na verificação.

Exemplos citados:

- `$monitor`
- `$display`
- `$dumpfile`
- `$dumpvars`
- `$dumplimit`
- `$dumpon`
- `$dumpoff`

#### `$monitor`

`$monitor` imprime sempre que algum dos parâmetros monitorados muda.

Exemplo:

```verilog
initial begin
  $monitor("t=%0d x=%0b y=%0b z=%0b",
           $time, x, y, z);
end
```

#### `$display`

`$display` imprime no momento em que é executado.

Exemplo:

```verilog
#50 x = 2'b01;
    $display("x=%b, y=%b, z=%b", x, y, z);
```

#### Dump de sinais

`$dumpfile` cria arquivo para armazenar valores de waveform.

```verilog
initial begin
  $dumpfile("adder2bit_tb.vcd");
  $dumpvars;
  $dumplimit(file_size);
end
```

O slide também menciona:

- `$dumpvars`: salva sinais do escopo indicado e escopos hierárquicos abaixo;
- `$dumplimit`: limita o tamanho do arquivo de dump;
- `$dumpon` e `$dumpoff`: ligam e desligam o dump de sinais durante períodos selecionados da simulação.

#### Loops em testbench

Loops são úteis em testbenches. Constructs citados:

- `for`
- `if-else`
- `while`

Exemplo:

```verilog
for (x = 0; x < 4; x = x + 1) begin
  for (y = 0; y < 4; y = y + 1) begin
    #10;
    $display("x=%0d y=%0d z=%0d", x, y, z);
  end
end
```

---

### Slide 5 — Verilog Timing Control and Delays

Pontos principais:

- Um delay é especificado por `#` seguido de um valor.
- Delays também podem ser usados dentro de statements de atribuição.
- Exemplo: primeiro avalia a expressão do lado direito `(a | b)`, depois espera 10 unidades de tempo conforme definido no `` `timescale ``.
- O exemplo 3 mostra um buffer com:
  - delay mínimo de 2 unidades;
  - delay típico de 3 unidades;
  - delay máximo de 4 unidades.
- Simulações podem ser rodadas usando diferentes opções de delay.
- Parâmetros temporais diferentes, como tempos de subida e descida, podem ser modelados com parâmetros `#`.

Exemplos reconstruídos:

```verilog
x = 0;
y = 0;

#20 x = 1;
    y = 1;
```

Exemplo de intra-assignment delay:

```verilog
p = #10 (a | b);
```

Interpretação: o simulador avalia `(a | b)` e agenda a atribuição para depois de 10 unidades de tempo.

Exemplo de primitive com delay:

```verilog
module bufferdelay (input p, output q);
  buf #(2,3,4) (q, p);
endmodule
```

Interpretação: o buffer tem valores de delay para condições de subida, descida ou turn-off, dependendo da forma da primitive.

---

### Slide 6 — Verilog Multi-Driven Net Declaration

Pontos principais:

- Um módulo lógico tem entradas, saídas e nets internas.
- Algumas nets podem ser dirigidas por uma ou mais portas lógicas.
- Essas portas podem se comportar como funções wired.
- Verilog permite declarar nets como:
  - `wor`
  - `wand`
- No exemplo, a função `f` é dirigida por duas portas com AND e OR.
- Embora seja possível usar esses tipos de sinal, eles devem ser evitados por causarem confusão.

Exemplo conceitual de `wand`:

```verilog
module compndwand (input x, input y, output z);
  wand f;

  assign f = x & y;
  assign f = x | y;
  assign z = f;
endmodule
```

A ideia de `wand` é resolver múltiplos drivers fazendo uma espécie de AND wired entre os drivers. Já `wor` faz resolução como OR wired.

Observação didática: para RTL moderno e legível, evite múltiplos drivers, exceto em situações muito específicas, como barramentos tri-state controlados ou modelos de interface.

---

### Slide 7 — Verilog Functions and Tasks

Pontos principais:

- Functions e tasks são constructs muito úteis em testbenches.
- Podem ser `static` ou `automatic`.
- Em tasks estáticas, argumentos/variáveis podem ser compartilhados entre chamadas.
- Em tasks automáticas, argumentos não são compartilhados, e tasks podem executar concorrentemente.
- Uma global task pode ser usada por muitos módulos.
- Tasks podem ser desabilitadas usando `disable`.
- O slide compara function e task.

#### Function

- Retorna um único valor como resultado da função.
- Não pode conter statements de controle de tempo ou delay.
- Executa na mesma unidade de tempo de simulação.
- Não pode chamar task.
- Deve ter pelo menos um argumento de entrada.
- Não pode ter argumento `output` ou `inout`.

#### Task

- Retorna múltiplos valores por outputs após processar entradas.
- Pode conter statements de controle de tempo ou delay.
- Pode terminar em outro tempo de simulação.
- Pode chamar outra task e function.
- Pode ter zero ou mais argumentos de qualquer tipo.

Exemplo de task estática problemática:

```verilog
module tb;

  initial display();
  initial display();
  initial display();
  initial display();

  task display();
    integer i;
    i = i + 1;
    $display("i=%0d", i);
  endtask

endmodule
```

Como `i` é estático, as chamadas compartilham o mesmo armazenamento.

Exemplo com `automatic`:

```verilog
module tb;

  initial display();
  initial display();
  initial display();
  initial display();

  task automatic display();
    integer i;
    i = i + 1;
    $display("i=%0d", i);
  endtask

endmodule
```

Com `automatic`, cada chamada tem armazenamento próprio.

---

### Slide 8 — Verilog begin end vs. fork join

O slide compara `fork/join` e `begin/end`.

#### `fork/join`

- Statements executados concorrentemente.
- `fork/join` e `begin/end` podem ser aninhados.

Exemplo:

```verilog
always @(posedge clk) begin
  fork
    #2 a = 1;
    #1 b = 1;
  join
end
```

As duas atribuições começam em paralelo. Uma ocorre após 2 unidades e outra após 1 unidade.

#### `begin/end`

- Statements executados sequencialmente.
- `fork/join` e `begin/end` podem ser aninhados.

Exemplo:

```verilog
always @(posedge clk) begin
  #2 a = 1;
  #1 b = 0;
end
```

Aqui o segundo delay começa depois do primeiro comando terminar. Portanto, o tempo total até `b = 0` é a soma dos delays anteriores.

O slide mostra diagramas de tempo para comparar esses comportamentos.

---

### Slide 9 — Verilog: Program Link Interface (PLI)

Pontos principais:

- **PLI — Program Link Interface** é uma interface para linguagens de programação externas.
- As principais linguagens integradas são C++ e Java, segundo o slide.
- Vantagens:
  - permite reutilizar código C existente;
  - permite gerar testbench usando abstrações mais altas.
- Uma função invocada por Verilog é chamada de system call.
- O slide mostra exemplos de system calls built-in.
- PLI permite definir system calls do usuário.
- Para suportar recursos avançados como:
  - code coverage;
  - power analysis;
  - co-simulation;
  - interface com modelos em C;
  - design debug utilities;
  é necessário acesso à estrutura de dados do simulador.
- Verilog PLI fornece esse acesso por rotinas task-function ou `tf`.
- Um conjunto avançado de rotinas é chamado de **VPI**.

Exemplos conceituais:

```text
C/C++ model call_me()
        ↓
Verilog PLI $call_me
        ↓
Simulator
```

Exemplo de system calls built-in:

```verilog
$display;
$stop;
$random;
```

Exemplo de chamada de usuário:

```verilog
initial begin
  $hello;
end
```

Com uma função C associada:

```c
#include <stdio.h>

void hello() {
  printf("Hello Designer\n");
}
```

---

### Slide 10 — Verilog: File Operations

Pontos principais:

- Estímulos podem ser aplicados ao DUT usando um arquivo externo.
- O arquivo é lido pelo testbench usando:
  - `$readmemh`
  - `$readmemb`
- Os dados ou estímulos do arquivo seguem formato específico, como um vetor por linha.
- Saídas do DUT também podem ser gravadas em arquivo externo usando:
  - `$writememh`
  - `$writememb`
- Depois, podem ser pós-processadas.
- Um exemplo de comparação entre saída do DUT e saída de modelo matemático pode ser simplesmente uma comparação entre arquivos.

Exemplo reconstruído:

```verilog
module readmemh_demo;

  reg [31:0] Mem [0:11];

  initial begin
    $readmemh("data.txt", Mem);
  end

  integer k;

  initial begin
    #10;
    $display("Contents of Mem after reading data file:");

    for (k = 0; k < 12; k = k + 1)
      $display("%0d: %h", k, Mem[k]);
  end

endmodule
```

Arquivo `data.txt` conceitual:

```text
000234ac
00023ac
0001c54
00023a6
000254a
0001234
```

---

### Slide 11 — Verilog Constraint Random Verification (CRV)

Pontos principais:

- Nos primeiros tempos, quando os designs eram simples, estímulos direcionados eram suficientes para garantir a operação do DUT.
- Com o crescimento da complexidade do DUT, é impossível verificar a funcionalidade completa apenas com estímulos direcionados.
- A geração de estímulos randômicos com constraints passa a ser necessária.
- Verilog suporta a função `$random` para geração de números randômicos.
- Restringindo tamanho de variável e atribuindo `$random`, pode-se gerar estímulos randômicos com restrição.
- `$random` retorna um novo número randômico de 32 bits a cada chamada.
- O número randômico é um inteiro com sinal, podendo ser positivo ou negativo.
- Outra forma de restringir o número randômico é usar módulo, por exemplo:
  - `$random % 10`
  - isso mantém o resto da divisão de 0 a 10, conforme a formulação do slide.
- O construct `$unsigned` converte número signed para unsigned.
- Para tornar o randômico determinístico, usa-se `$random(seed)` com uma seed conhecida.
- A seed é o valor inicial do gerador pseudo-randômico.
- A mesma seed retorna a mesma sequência randômica.

Exemplo reconstruído:

```verilog
module tb_mem;

  reg clock;
  reg read_write;
  reg [31:0] data;
  reg [31:0] address;

  initial begin
    clock = 0;
    forever #10 clock = ~clock;
  end

  initial begin
    repeat (5) @(negedge clock) begin
      read_write = $random;
      data       = $random;
      address    = $random;

      $display($time,
               " read_write=%0d data=%0d address=%0d",
               read_write, data, address);
    end

    #10 $finish;
  end

endmodule
```

Exemplo com módulo:

```verilog
data = $random % 10;
```

Exemplo com seed:

```verilog
integer seed;
initial begin
  seed = 32'h1234abcd;
  data = $random(seed);
end
```

---

### Slide 12 — Verification Concepts Using Verilog (1/2)

Pontos principais:

- Um testbench Verilog verifica o hardware para toda funcionalidade pretendida e também para comportamento não pretendido.
- Testbench baseado em File I/O é mais usado quando o estímulo está armazenado em arquivos externos.
- Constructs Verilog leem os dados para dentro do DUT.
- A resposta é escrita e comparada com a resposta esperada por comparação de arquivos.
- O testbench é uma interface entre arquivos e DUT.
- Testbenches simples baseados em File I/O podem ser caros porque o tempo de simulação aumenta.
- Arquivos externos podem ser convertidos para valores constantes em Verilog por scripts.
- Testbenches baseados em máquinas de estado eram populares em anos anteriores.
- Diferentes state machines testam funcionalidades diferentes.
- Dependendo do use case, uma máquina de estado específica é habilitada para dirigir estímulos ao DUT.
- Esse tipo de testbench se torna complexo e difícil de debugar.
- Testbench baseado em tasks é mais flexível e muito usado em Verilog.
- Todas as funções são definidas como tasks e functions.
- Testbenches baseados em BFMs são mais eficientes.

Vantagens do modelo baseado em tasks/BFMs:

- cada task executa uma função;
- é mais rápido;
- testbenches estruturais também podem ser definidos;
- altamente portátil com esforço mínimo;
- desenvolvimento de cenários é fácil.

Exemplo conceitual de task de escrita:

```verilog
task write;
  input integer data;
  input integer address;
  begin
    @(posedge clock);
    read_write = 1'b0;
    address    = $random;
    data       = $random;
  end
endtask
```

Exemplo conceitual de cenário:

```verilog
initial begin
  repeat (10) write($random, $random);
end
```

---

### Slide 13 — Verification Concepts Using Verilog (2/2)

Pontos principais:

- Testbenches self-checking garantem reusabilidade e qualidade.
- São modulares e permitem rastrear coverage com facilidade.
- Um testbench self-checking é inteligente:
  - faz amostragem da saída do DUT;
  - compara a saída amostrada com a saída esperada.

Sequência de teste em um testbench:

1. Gerar vetores de estímulo.
2. Transmitir o estímulo ao DUT.
3. Monitorar a resposta gerada pelo DUT.
4. Verificar a resposta gerada.
5. Gerar relatório sobre o desempenho do DUT.
6. Produzir uma figura de mérito para mostrar a qualidade do testbench.

Arquitetura visual do slide:

```text
Stimulus generator → Driver → DUT → Response checker / receiver
                           ↘
                         Scoreboard
```

Tabela do slide:

| Módulo do testbench | Função |
|---|---|
| Stimulus generator | Gera vetores de teste, tanto directed quanto constraint random; deve ser fácil e inteligente. |
| BFM / Driver | Interage com o DUT dirigindo e amostrando sinais; converte transações de alto nível em sinais específicos de interface. |
| Receiver | Reconstrói a informação de saída; em geral é um tipo de BFM. |
| Scoreboard | Armazena estrutura; coleta estímulo e resposta do DUT. |
| Checker | Compara estímulo e resposta para decidir match/mismatch; valida se os dados no scoreboard são legais. |
| Coverage | Pode ser functional coverage e code coverage; functional coverage mede features verificadas; code coverage mede linhas cobertas. |

---

### Slide 14 — Verilog Compiler Switches for Verification

Pontos principais:

- Switches de Verilog podem ser usados para compilação seletiva durante simulação.
- Compilar com `+define+TYPE_1` produz mensagem `TYPE_1`.
- Compilar com `+define+TYPE_2` produz mensagem `TYPE_2`.
- O compilador pode gastar bastante tempo processando esses switches.
- Diretivas de simulação podem ser simples usando macros `define`.
- A simulação é feita com `+TYPE_*`.
- `$plusargs` procura uma string informada pelo usuário e retorna inteiro diferente de zero quando encontra.
- O simulador usa isso para executar uma parte específica do testbench.

Exemplo com diretivas:

```verilog
module switches();

  initial begin
`ifdef TYPE_1
    $display("TYPE_1 message");
`else
`ifdef TYPE_2
    $display("TYPE_2 message");
`endif
`endif
  end

endmodule
```

Compilação/simulação conceitual:

```text
+define+TYPE_1
+define+TYPE_2
```

Exemplo com `$test$plusargs`:

```verilog
module switches();

  initial begin
    if ($test$plusargs("TYPE_1"))
      $display("TYPE_1 message");
    else if ($test$plusargs("TYPE_2"))
      $display("TYPE_2 message");
  end

endmodule
```

Observação: o nome técnico mais comum é `$test$plusargs`, embora o slide destaque `$plusargs`.

---

### Slide 15 — Verilog Clock Generator

Pontos principais:

- Clocks são os principais eventos de sincronização aos quais todos os sinais são referenciados.
- Se o RTL está em Verilog, o clock generator é escrito em Verilog, mesmo que o testbench esteja em outra linguagem.
- Clock pode ser gerado de várias formas.
- Alguns testbenches precisam de mais de um clock generator.
- Testbenches podem precisar de clocks com fases diferentes e incertezas como jitter.
- Clock com jitter pode ser gerado definindo valor de jitter como porcentagem do período de clock e distribuindo uniformemente com `$dist_uniform`.

Formas simples de gerar clock:

```verilog
initial clk = 0;
always #10 clk = ~clk;
```

Outra forma:

```verilog
always begin
  clk = 0;
  #10;
  clk = 1;
  #10;
end
```

Forma com `forever`:

```verilog
initial begin
  clk = 0;
  forever #20 clk = ~clk;
end
```

Exemplo conceitual com jitter:

```verilog
module Tb();

  reg clock;
  integer no_of_clocks;
  parameter CLOCK_PERIOD = 5;

  initial begin
    no_of_clocks = 0;
    clock = 1'b0;
    always #(CLOCK_PERIOD/2) clock = ~clock;
  end

  always @(posedge clock)
    no_of_clocks = no_of_clocks + 1;

endmodule
```

A ideia do slide é mostrar que clocks em testbench são gerados por constructs de simulação, geralmente não sintetizáveis.

---

### Slide 16 — Verilog Coding Style for Verification

Pontos principais:

- O estilo de codificação Verilog é o fator mais importante que afeta a performance de simulação de um design.
- Codificação ruim pode causar race conditions nos sinais e afetar a performance de simulação.
- Uma diretriz importante é evitar race condition.

Definição do slide:

- Race condition é um estilo de codificação no qual há mais de um resultado correto possível.
- Como o resultado é imprevisível, pode tornar a simulação lenta.
- O exemplo mostrado pode causar race condition por formação de loop.

Exemplo reconstruído:

```verilog
always @(A or C) begin
  B = C;
  D = A;
end

assign C = B;
```

Isso pode criar dependência circular/eventos repetidos.

Outro caso citado:

- race condition dinâmica ocorre quando leitura e escrita no mesmo sinal acontecem no mesmo tempo de simulação.

Exemplo:

```verilog
initial
  wr_en_a = 0; // write operation on signal var

initial
  rd_en = wr_en_a; // read operation on signal var
```

Outras guidelines:

- evitar `force` e `release`;
- evitar `repeat`, `wait`, `disable` e `fork-join` em constructs `always`;
- todos os sinais de controle sequencial devem estar na lista de sensibilidade;
- no exemplo final, o simulador interpreta o bloco `always` como sequencial, e não há evento de simulação quando `sel` é falso.

Exemplo conceitual problemático:

```verilog
always @(sel or a or b) begin
  if (sel)
    y = a;
end
```

Se `sel = 0`, `y` não é atualizado, podendo criar comportamento indesejado.

---

### Slide 17 — Debugging

Pontos principais:

- Debugging é um objetivo importante da verificação.
- É um método sistemático de encontrar e reduzir o número de bugs.
- Bugs podem estar no DUT ou no testbench.
- Debuggers são ferramentas que permitem:
  - monitorar a execução do programa;
  - parar;
  - reiniciar;
  - rodar em modo interativo.

Passos básicos de debugging:

1. Identificar mismatch entre resposta do DUT e resposta esperada; isso significa que existe bug.
2. Reduzir o DUT ou testbench a uma área provável do bug.
3. Encontrar a causa raiz do bug.
4. Corrigir o bug.
5. Validar a correção e retestar o cenário.

Outros pontos:

- Ao fim da simulação de cada teste, um relatório `FAILED` ou `PASSED` é gerado.
- Isso é chamado de **self checking**.
- Arquivos de log e waveform viewer ajudam no debug quando o teste falha.

---

## Aula didática desenvolvida

### 1. Verificação: o outro lado do RTL

Nas aulas anteriores, o foco estava em escrever hardware sintetizável. Agora o foco muda: depois que temos um design, precisamos provar que ele funciona conforme a especificação.

A estrutura mínima é:

```text
Testbench → aplica estímulos → DUT → gera resposta → Checker compara
```

O **DUT** é o módulo que queremos testar. O **testbench** é um ambiente de simulação que existe apenas para verificar o DUT. Ele pode usar delays, arquivos, loops, `$display`, `$monitor`, randomização e outras estruturas que não viram hardware.

Essa separação é essencial:

```text
DUT: deve ser sintetizável.
Testbench: pode ser não sintetizável.
```

Exemplo:

```verilog
initial begin
  x = 0;
  y = 0;
  #20 x = 3;
      y = 1;
end
```

Esse bloco é perfeito para testbench, mas não para RTL de ASIC. Ele controla a simulação.

---

### 2. O que é uma HVL?

Uma **HVL — Hardware Verification Language** é uma linguagem voltada à criação de ambientes de verificação. Ela precisa ter:

- capacidade de manipular bits, como uma HDL;
- abstrações de alto nível, como linguagens de software;
- randomização;
- constraints;
- coverage;
- mecanismos de tempo;
- conexão com DUT;
- assertions;
- estruturas modulares de testbench.

Verilog foi usado historicamente para testbenches simples. SystemVerilog evoluiu esse papel, adicionando recursos muito mais fortes para verificação moderna, como classes, randomização com constraints, covergroups, assertions e interfaces.

---

### 3. DUT: o bloco sob teste

Um DUT pode ser qualquer módulo:

- somador;
- contador;
- mux;
- FSM;
- ALU;
- controlador de barramento;
- bloco de comunicação;
- processador;
- IP inteiro.

No exemplo da aula, o DUT é simples:

```verilog
assign z = x + y;
```

Para `x` e `y` de 2 bits, os valores possíveis vão de 0 a 3. A soma máxima é:

```text
3 + 3 = 6
```

Em binário:

```text
3 = 2'b11
6 = 3'b110
```

Por isso a saída precisa ter 3 bits. Se `z` tivesse só 2 bits, o carry seria perdido.

---

### 4. Estrutura de um testbench simples

Um testbench clássico tem:

1. declaração de sinais;
2. instanciação do DUT;
3. geração de estímulos;
4. monitoramento ou checagem;
5. finalização da simulação;
6. opcionalmente, dump de waveform.

Exemplo:

```verilog
module adder2bit_tb;

  reg  [1:0] x;
  reg  [1:0] y;
  wire [2:0] z;

  adder2bit uut (
    .x(x),
    .y(y),
    .z(z)
  );

  initial begin
    x = 0;
    y = 0;

    #10 x = 1; y = 2;
    #10 x = 3; y = 3;
    #10 $finish;
  end

  initial begin
    $monitor("time=%0t x=%0d y=%0d z=%0d",
             $time, x, y, z);
  end

endmodule
```

Note que `x` e `y` são `reg` porque o testbench atribui valores a eles dentro de blocos `initial`. Já `z` é `wire` porque é dirigido pelo DUT.

---

### 5. `$display` versus `$monitor`

#### `$display`

Executa uma vez quando a linha é atingida:

```verilog
$display("x=%0d y=%0d z=%0d", x, y, z);
```

É parecido com um `print`.

#### `$monitor`

Fica ativo e imprime sempre que algum argumento mudar:

```verilog
$monitor("t=%0t x=%0d y=%0d z=%0d", $time, x, y, z);
```

É útil para testbenches simples, porque acompanha a evolução dos sinais automaticamente.

---

### 6. Waveform e arquivos VCD

Para debugar, geralmente não basta olhar o console. É comum gerar waveform:

```verilog
initial begin
  $dumpfile("adder2bit_tb.vcd");
  $dumpvars(0, adder2bit_tb);
end
```

O arquivo `.vcd` guarda mudanças dos sinais ao longo do tempo. Ele pode ser aberto em ferramentas de waveform.

Em fluxos Synopsys, é comum usar VCS para simulação e Verdi/DVE para debug visual. Mesmo que o slide use VCD, a lógica geral é a mesma: salvar sinais, abrir waveform e investigar comportamento.

---

### 7. Delays em testbench

Delays com `#` são fundamentais em testbench.

```verilog
#20 x = 3;
```

Significa: espere 20 unidades de tempo da simulação e depois atribua `3` a `x`.

A unidade depende de:

```verilog
`timescale 1ns / 1ps
```

Nesse caso:

```text
#20 = 20 ns
```

Delays servem para:

- separar estímulos;
- esperar estabilização;
- gerar clock;
- controlar sequência de teste;
- modelar atraso em modelos de simulação.

Mas delays não devem ser confundidos com hardware sintetizável.

---

### 8. Multi-driven nets

Em hardware real, múltiplos drivers no mesmo sinal podem causar conflito. Verilog tem tipos especiais, como `wand` e `wor`, que resolvem múltiplos drivers usando lógica wired.

Exemplo conceitual:

```verilog
wand bus;

assign bus = driver1;
assign bus = driver2;
```

O valor final é uma combinação AND dos drivers.

Embora isso exista, a aula recomenda evitar porque causa confusão. Em RTL moderno, é melhor escrever explicitamente a lógica de arbitragem:

```verilog
assign bus = enable1 ? data1 :
             enable2 ? data2 :
             1'bz;
```

Ou, em ASIC interno, evitar tri-state interno e usar muxes.

---

### 9. Function e task no testbench

#### Function

Use quando você quer calcular algo imediatamente.

Exemplo:

```verilog
function [2:0] expected_sum;
  input [1:0] a;
  input [1:0] b;
  begin
    expected_sum = a + b;
  end
endfunction
```

Uso:

```verilog
if (z !== expected_sum(x, y))
  $display("Erro");
```

#### Task

Use quando você quer executar uma sequência de ações, possivelmente consumindo tempo.

Exemplo:

```verilog
task apply_vector;
  input [1:0] a;
  input [1:0] b;
  begin
    x = a;
    y = b;
    #10;
  end
endtask
```

Uso:

```verilog
initial begin
  apply_vector(0, 0);
  apply_vector(1, 2);
  apply_vector(3, 3);
end
```

Tasks deixam o testbench mais limpo e reutilizável.

---

### 10. `automatic`: reentrância em tasks

Uma task estática compartilha variáveis entre chamadas. Isso pode causar problema se a task for chamada em paralelo.

Exemplo:

```verilog
task display;
  integer i;
  begin
    i = i + 1;
    $display("i=%0d", i);
  end
endtask
```

Se várias chamadas ocorrem concorrentemente, elas podem mexer na mesma variável `i`.

Com `automatic`:

```verilog
task automatic display;
  integer i;
  begin
    i = i + 1;
    $display("i=%0d", i);
  end
endtask
```

Cada chamada ganha seu próprio armazenamento local. Isso é importante em ambientes de verificação concorrentes.

---

### 11. `begin/end` versus `fork/join`

#### `begin/end`

Executa sequencialmente:

```verilog
begin
  #10 a = 1;
  #10 b = 1;
end
```

Linha do tempo:

```text
t=10 → a=1
t=20 → b=1
```

#### `fork/join`

Executa em paralelo:

```verilog
fork
  #10 a = 1;
  #10 b = 1;
join
```

Linha do tempo:

```text
t=10 → a=1 e b=1
```

Isso é muito importante em testbenches, porque muitas coisas acontecem ao mesmo tempo:

- gerar clock;
- aplicar estímulos;
- monitorar resposta;
- coletar coverage;
- checar protocolo;
- controlar timeout.

---

### 12. PLI: ligação com C/C++ e acesso ao simulador

PLI permite criar funções externas que podem ser chamadas a partir de Verilog. O motivo é que, em verificação, muitas vezes já existe um modelo de referência em C/C++.

Exemplo de ideia:

```verilog
initial begin
  result = $c_model(input_data);
end
```

A função `$c_model` pode chamar código C por trás. Isso permite comparar o DUT com um modelo de software.

Esse conceito antecipa temas posteriores:

- DPI em SystemVerilog;
- co-simulation;
- modelos de referência;
- testbenches mais abstratos;
- integração com ferramentas;
- VPI para acessar objetos internos do simulador.

---

### 13. Operações com arquivos

Testbenches podem ler estímulos de arquivo:

```verilog
$readmemh("vectors.hex", memory);
```

Também podem gravar resultados:

```verilog
$writememh("output.hex", memory);
```

Fluxo típico:

```text
Arquivo de entrada → Testbench → DUT → Arquivo de saída → Comparação
```

Isso é útil quando:

- os vetores são gerados por script;
- existe um modelo de referência externo;
- há muitos casos de teste;
- o testbench precisa ser reproduzível.

---

### 14. Randomização em Verilog

Verilog clássico tem `$random`, que retorna um inteiro pseudo-randômico de 32 bits.

Exemplo:

```verilog
data = $random;
```

Para restringir faixa:

```verilog
addr = $random % 16;
```

Problema: `$random` é signed, então pode gerar números negativos. Uma técnica é usar `$unsigned`:

```verilog
addr = $unsigned($random) % 16;
```

Com seed:

```verilog
integer seed;
initial begin
  seed = 123;
  data = $random(seed);
end
```

A seed permite repetir a mesma sequência. Isso é essencial para debug: se um teste randômico falha, você precisa rodar de novo com a mesma seed para reproduzir.

---

### 15. Directed testing versus constrained random

#### Directed testing

Você escolhe manualmente os casos.

Exemplo:

```verilog
apply_vector(0, 0);
apply_vector(3, 3);
apply_vector(1, 2);
```

Vantagem: simples e previsível.

Desvantagem: pode não cobrir casos inesperados.

#### Random testing

O testbench gera estímulos automaticamente.

```verilog
repeat (1000) begin
  x = $random;
  y = $random;
  #10;
end
```

Vantagem: explora mais espaço de entradas.

Desvantagem: pode gerar casos inúteis ou inválidos.

#### Constrained random

Gera valores randômicos, mas dentro de restrições úteis.

Em Verilog clássico, isso é feito de modo manual, com `%`, masks e ranges. Em SystemVerilog, fica muito mais poderoso com `rand`, `randc` e `constraint`.

---

### 16. Testbench self-checking

Um testbench fraco apenas imprime sinais:

```verilog
$monitor("x=%0d y=%0d z=%0d", x, y, z);
```

Um testbench melhor verifica automaticamente:

```verilog
if (z !== x + y) begin
  $display("FAILED: x=%0d y=%0d z=%0d expected=%0d",
           x, y, z, x + y);
end
else begin
  $display("PASSED");
end
```

Isso é self-checking. A simulação não depende de uma pessoa olhando manualmente o waveform.

Exemplo completo:

```verilog
task check_adder;
  input [1:0] a;
  input [1:0] b;
  reg   [2:0] expected;
  begin
    x = a;
    y = b;
    #1;

    expected = a + b;

    if (z !== expected)
      $display("FAILED t=%0t x=%0d y=%0d z=%0d expected=%0d",
               $time, x, y, z, expected);
    else
      $display("PASSED t=%0t x=%0d y=%0d z=%0d",
               $time, x, y, z);
  end
endtask
```

---

### 17. BFM, driver, monitor, scoreboard e checker

A aula introduz uma arquitetura que será fundamental depois em SystemVerilog/UVM.

#### Stimulus generator

Gera transações ou vetores de teste.

#### Driver / BFM

Converte transações de alto nível em sinais reais do DUT.

Exemplo: uma transação “write address 10 data 55” vira sinais `addr`, `data`, `wr_en`, `valid`, etc.

#### Receiver / monitor

Observa a saída do DUT e reconstrói transações.

#### Scoreboard

Guarda o que foi enviado e o que se espera receber.

#### Checker

Compara resultado esperado e resultado observado.

#### Coverage

Mede o quanto o teste explorou:

- linhas de código;
- branches;
- estados;
- transações;
- cenários funcionais;
- combinações importantes.

Essa arquitetura prepara a mente para UVM: sequence item, sequencer, driver, monitor, agent, scoreboard e env.

---

### 18. Compiler switches e plusargs

Em verificação, é comum mudar o comportamento do testbench sem editar o código.

#### `+define+`

Ativa diretivas de compilação:

```text
vcs +define+TYPE_1 tb.v
```

Código:

```verilog
`ifdef TYPE_1
  $display("TYPE_1 message");
`endif
```

#### `$test$plusargs`

Ativa comportamento em tempo de simulação:

```text
./simv +TYPE_1
```

Código:

```verilog
if ($test$plusargs("TYPE_1"))
  $display("TYPE_1 message");
```

Diferença:

```text
`ifdef       → decisão em compilação
$plusargs   → decisão em simulação
```

Isso é muito usado para escolher testes, habilitar logs, ativar modos de debug e controlar cenários.

---

### 19. Gerador de clock

O clock mais simples:

```verilog
initial clk = 0;
always #5 clk = ~clk;
```

Com `` `timescale 1ns/1ps ``, isso gera período de 10 ns.

Outro estilo:

```verilog
initial begin
  clk = 0;
  forever #5 clk = ~clk;
end
```

Múltiplos clocks:

```verilog
initial begin
  clk_a = 0;
  forever #5 clk_a = ~clk_a;
end

initial begin
  clk_b = 0;
  forever #7 clk_b = ~clk_b;
end
```

Clock com jitter é uma evolução: o período não é perfeitamente constante. Isso serve para testar robustez em cenários mais realistas, embora em verificação RTL básica geralmente se use clock ideal.

---

### 20. Race condition em testbench

Uma race condition ocorre quando a ordem de execução entre processos concorrentes altera o resultado.

Exemplo:

```verilog
initial a = 0;
initial b = a;
```

Se ambos acontecem no mesmo tempo, dependendo da ordem interna do simulador, `b` pode ver o valor antigo ou novo de `a`.

Outro exemplo:

```verilog
always @(posedge clk)
  a = b;

always @(posedge clk)
  b = a;
```

Com blocking assignment (`=`), a ordem de execução dos blocos pode alterar o resultado. Por isso, em lógica sequencial, usa-se `<=`.

Em testbench, race conditions causam bugs difíceis, porque o erro pode aparecer ou desaparecer com pequenas mudanças no código.

---

### 21. Debugging: processo, não chute

Debug eficiente segue etapas.

1. **Detectar mismatch**  
   Exemplo: o checker esperava `z = 5`, mas o DUT gerou `z = 4`.

2. **Isolar área**  
   O erro está no DUT ou no testbench? Está no estímulo, no monitor, no checker ou no modelo de referência?

3. **Achar causa raiz**  
   Pode ser:
   - reset errado;
   - largura de sinal incorreta;
   - carry perdido;
   - delay de testbench mal posicionado;
   - race condition;
   - expected value calculado errado.

4. **Corrigir**  
   Corrigir RTL ou testbench.

5. **Retestar**  
   Rodar o mesmo teste novamente, idealmente com a mesma seed se for randômico.

---

## Conceitos difíceis explicados em profundidade

### 1. DUT versus testbench

O DUT é o circuito sob teste. Deve representar hardware.

O testbench é o ambiente que testa o circuito. Pode usar recursos de simulação.

Exemplo:

```verilog
module dut (...);
  // RTL sintetizável
endmodule

module tb;
  // código de simulação
endmodule
```

No fluxo ASIC:

```text
DUT → síntese → netlist → chip
Testbench → simulação/verificação → não vai para o chip
```

Essa separação explica por que o testbench pode ter:

```verilog
initial
#delay
$display
$finish
$random
$readmemh
fork/join
```

e o DUT geralmente não deve ter esses constructs.

---

### 2. Por que `reg` nas entradas do testbench e `wire` nas saídas?

No testbench, sinais dirigidos proceduralmente precisam ser declarados como `reg` em Verilog clássico.

Exemplo:

```verilog
reg [1:0] x;

initial begin
  x = 2'b00;
  #10 x = 2'b01;
end
```

A saída do DUT é dirigida por uma conexão contínua ou por lógica dentro do DUT, então no testbench ela é um `wire`:

```verilog
wire [2:0] z;
```

O testbench observa `z`, mas não atribui diretamente a ele.

---

### 3. `$monitor` não é igual a `$display`

`$display` imprime uma vez:

```verilog
$display("x=%0d", x);
```

`$monitor` permanece ativo:

```verilog
$monitor("x=%0d", x);
```

Se `x` mudar várias vezes, `$monitor` imprime várias vezes.

Use `$display` para mensagens pontuais. Use `$monitor` para acompanhamento contínuo simples. Em testbenches maiores, checkers e logs estruturados são melhores do que muitos `$monitor`.

---

### 4. Intra-assignment delay

Considere:

```verilog
p = #10 (a | b);
```

A aula diz: primeiro avalia o lado direito `(a | b)`, depois espera 10 unidades de tempo e atribui a `p`.

Isso é diferente de:

```verilog
#10 p = (a | b);
```

Nesse segundo caso, o simulador espera 10 unidades e só então avalia `(a | b)`.

Diferença:

```verilog
p = #10 expr;   // captura expr agora, atribui depois
#10 p = expr;   // espera, depois calcula expr
```

Essa diferença é importante em simulação temporal.

---

### 5. `$random`, seed e reprodutibilidade

Um teste randômico só é útil se puder ser reproduzido.

Imagine que o teste 842 falhou com uma sequência aleatória. Se você não consegue repetir a mesma sequência, o debug fica muito difícil.

Por isso se usa seed:

```verilog
integer seed;
initial begin
  seed = 32'hCAFE1234;
  value = $random(seed);
end
```

Com a mesma seed, o gerador pseudo-randômico produz a mesma sequência. Isso permite:

```text
falhou → guardar seed → rodar de novo → abrir waveform → debugar
```

---

### 6. File-based testbench

Um testbench baseado em arquivo permite separar dados de teste do código.

Arquivo:

```text
00
01
10
11
```

Testbench:

```verilog
reg [1:0] vectors [0:3];

initial begin
  $readmemb("vectors.txt", vectors);
end
```

Vantagens:

- fácil gerar vetores por script;
- fácil comparar com modelo externo;
- útil para grandes massas de dados.

Desvantagens:

- pode ser lento;
- debug pode ser menos direto;
- exige cuidado com formato, path e sincronização.

---

### 7. Self-checking versus inspeção manual

Testbench manual:

```verilog
$display("z=%0d", z);
```

Você olha o resultado e decide se está certo.

Testbench self-checking:

```verilog
if (z !== expected)
  $display("FAILED");
else
  $display("PASSED");
```

Em projetos reais, inspeção manual não escala. Um SoC pode ter milhões de ciclos de simulação e milhares de testes. Por isso, todo teste sério precisa gerar `PASS` ou `FAIL` automaticamente.

---

### 8. Scoreboard

O scoreboard é uma estrutura que guarda expectativa e resultado.

Exemplo simples:

```verilog
expected = x + y;

#1;

if (z !== expected)
  error_count = error_count + 1;
```

Em designs mais complexos, o scoreboard pode ter filas, tabelas, IDs de transação e comparação fora de ordem.

Exemplo conceitual:

```text
Transação enviada:
ID=5, addr=0x100, data=0xAA

Resposta recebida:
ID=5, status=OK

Scoreboard:
compara resposta observada com resposta esperada
```

---

### 9. Coverage

Coverage responde à pergunta:

```text
Quanto eu realmente testei?
```

#### Code coverage

Mede aspectos do código:

- linhas executadas;
- branches;
- condições;
- toggles;
- FSM states.

#### Functional coverage

Mede intenção funcional:

- testei todos os comandos?
- testei todos os modos?
- testei todos os estados?
- testei combinações importantes?
- testei transações read/write/back-to-back?

O slide ainda está em Verilog, mas esse conceito será muito mais forte em SystemVerilog com `covergroup`, `coverpoint`, `bins` e `cross`.

---

### 10. Race condition em simulação

Race condition é uma das causas mais traiçoeiras de erro.

Exemplo ruim:

```verilog
always @(posedge clk)
  q = d;

initial begin
  @(posedge clk);
  d = 1;
end
```

Se `d` muda no mesmo instante em que `q` amostra `d`, a ordem dos eventos no simulador pode alterar o resultado. Para evitar:

- aplicar estímulos longe da borda ativa;
- usar non-blocking em lógica sequencial;
- organizar testbench com clocking blocks em SystemVerilog;
- evitar leitura e escrita simultânea sem sincronização.

---

### 11. Debug com log e waveform

Logs mostram eventos importantes:

```verilog
$display("FAILED at time %0t", $time);
```

Waveform mostra sinais ao longo do tempo.

Um bom fluxo de debug é:

```text
FAIL no log
   ↓
identificar tempo do erro
   ↓
abrir waveform naquele tempo
   ↓
ver entrada, estado interno e saída
   ↓
decidir se bug está no DUT ou testbench
```

Sem log, você não sabe onde procurar. Sem waveform, você não vê a dinâmica dos sinais.

---

## Figuras, diagramas e waveforms importantes

### Diagrama testbench–DUT–checker

Mostra a arquitetura mínima de verificação: estímulo entra no DUT, resposta sai, checker compara. Essa figura é a base de todo testbench.

### Diagrama do testbench do somador de 2 bits

Mostra a estrutura completa:

- módulo testbench sem portas;
- sinais `reg` para entradas;
- `wire` para saída;
- instância `uut`;
- blocos `initial`;
- dumpfile;
- monitor;
- sequência temporal de estímulos.

### Diagramas de delay

Mostram a diferença entre atribuições com `#` e a modelagem de atrasos em primitives. Isso é importante para entender simulação temporal e geração de clock.

### Figura de multi-driven net

Mostra nets dirigidas por mais de uma fonte. A mensagem importante é: Verilog permite, mas o uso deve ser cuidadoso para não criar confusão.

### Tabela function versus task

É uma das tabelas mais importantes da aula. Function calcula em tempo zero e retorna um valor; task pode consumir tempo e retornar múltiplos valores por argumentos.

### Diagramas begin/end versus fork/join

Mostram visualmente que `begin/end` é sequencial e `fork/join` é concorrente. Essa diferença afeta diretamente waveforms.

### Diagrama PLI

Mostra modelo C/C++ chamando ou sendo chamado por Verilog via PLI. É uma ponte entre simulação HDL e software externo.

### Diagrama de testbench self-checking

Mostra stimulus generator, driver, DUT, receiver/checker, scoreboard e coverage. Essa figura antecipa metodologias modernas como UVM.

### Slide de clock generator

Mostra diferentes formas de gerar clock. Essa figura conecta diretamente com qualquer lab de simulação RTL.

### Slide de debugging

Mostra o processo sistemático de encontrar, isolar, corrigir e validar bugs.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **What is a DUT?**  
   O módulo ou design a ser verificado.

2. **What does a testbench do?**  
   Gera estímulos, aplica no DUT, observa resposta e compara com o esperado.

3. **Why does a 2-bit adder need a 3-bit output?**  
   Porque a soma máxima é `3 + 3 = 6`, que exige 3 bits (`110`).

4. **What is `$monitor` used for?**  
   Para imprimir valores sempre que algum dos sinais monitorados muda.

5. **What is `$display` used for?**  
   Para imprimir uma mensagem no momento em que é executado.

6. **What is `$dumpfile` used for?**  
   Para definir o arquivo de waveform/dump.

7. **What is `$dumpvars` used for?**  
   Para selecionar sinais/escopos que serão gravados no dump.

8. **How is a delay specified in Verilog?**  
   Com `#` seguido do valor do delay.

9. **What is the difference between function and task?**  
   Function retorna um valor e não consome tempo; task pode consumir tempo e retornar múltiplos valores por argumentos.

10. **What is the difference between `begin/end` and `fork/join`?**  
    `begin/end` executa sequencialmente; `fork/join` executa concorrentemente.

11. **What is PLI?**  
    Interface que permite conectar Verilog a linguagens externas e acessar estruturas do simulador.

12. **What is CRV?**  
    Constraint Random Verification: geração randômica de estímulos com restrições.

13. **What is a self-checking testbench?**  
    Testbench que compara automaticamente a saída do DUT com a esperada e reporta PASS/FAIL.

14. **What is a scoreboard?**  
    Estrutura que armazena estímulos/respostas esperadas e compara com saídas observadas.

15. **What are compiler switches used for?**  
    Para compilação seletiva e controle de partes do testbench.

16. **How do you generate a simple clock in Verilog testbench?**  
    `initial clk = 0; always #10 clk = ~clk;`

17. **What is debugging in verification?**  
    Processo sistemático de localizar, reduzir e corrigir bugs no DUT ou testbench.

### Pegadinhas

- `reg` no testbench não significa necessariamente registrador físico; significa variável atribuída proceduralmente.
- `wire` é usado para observar saída dirigida pelo DUT.
- `$monitor` imprime quando algo muda; `$display` imprime quando é chamado.
- `#10 p = expr` não é o mesmo que `p = #10 expr`.
- `$random` é signed; pode gerar valores negativos.
- Sem seed registrada, falha randômica pode ser difícil de reproduzir.
- `fork/join` executa em paralelo; `begin/end` executa em sequência.
- Testbench pode usar constructs não sintetizáveis.
- DUT deve ser escrito com disciplina de RTL se for para síntese.
- Race condition pode gerar resultados imprevisíveis mesmo com código aparentemente correto.
- Um teste que só imprime sinais não é self-checking.
- Coverage não é a mesma coisa que PASS/FAIL; coverage mede o quanto foi exercitado.

### Frases para memorizar

```text
DUT é o design sob teste.
Testbench gera estímulo, observa resposta e checa resultado.
Verilog de verificação pode usar constructs não sintetizáveis.
Self-checking testbench gera PASS/FAIL automaticamente.
Function executa em tempo zero; task pode consumir tempo.
begin/end é sequencial; fork/join é concorrente.
$random com seed permite reprodução.
Logs dizem onde falhou; waveform mostra por que falhou.
```

---

## Relação com projeto/laboratório

Esta aula se conecta diretamente aos labs de simulação.

### Relação com VCS

O VCS compila e executa o testbench. Em um fluxo típico:

```text
vlogan arquivos.v
vcs top_tb
./simv
```

O testbench pode conter:

```verilog
$display
$monitor
$finish
$dumpfile
$dumpvars
$random
```

Esses comandos ajudam a controlar e observar a simulação.

### Relação com Verdi/DVE

Quando o teste falha, você abre waveform e investiga:

- entradas do DUT;
- saídas do DUT;
- clock;
- reset;
- estado interno;
- sinais de controle;
- tempo exato do mismatch.

O dump gerado pelo testbench alimenta esse debug visual.

### Relação com Makefile

Em labs, o Makefile pode automatizar:

```text
compilação
elaboração
simulação
geração de log
geração de waveform
abertura do viewer
limpeza de arquivos
```

Switches e plusargs podem aparecer no Makefile para escolher testes:

```text
+define+TEST_A
+TEST_A
+SEED=123
```

### Relação com futuros tópicos de SystemVerilog/UVM

Esta aula introduz conceitos que depois serão formalizados em UVM:

| Conceito aqui | Evolução em SystemVerilog/UVM |
|---|---|
| task de estímulo | sequence / sequence item |
| driver manual | UVM driver |
| monitor/receiver | UVM monitor |
| scoreboard simples | UVM scoreboard |
| random com `$random` | `rand`, `randc`, constraints |
| coverage conceitual | covergroup, coverpoint, bins |
| checker manual | assertions e checkers |
| testbench modular | agent, env, test |

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

**Bloco 004 — 04 Verilog Reference Designs**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\04 Verilog Reference Designs.docx
```

Faixa:

```text
Slides 1-15
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\04 Verilog Reference Designs.md
```
