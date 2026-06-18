# 03 VHDL for Verification

## Controle do bloco

- **Bloco:** 008
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\03 VHDL for Verification.docx`
- **Faixa de slides:** 1-20
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\03 VHDL for Verification.md`
- **Próximo bloco recomendado:** 009 — `04 VHDL Reference Designs`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula apresenta **VHDL para verificação**, ou seja, o uso de VHDL para construir testbenches, gerar estímulos, observar respostas, escrever mensagens no console, gerar arquivos de waveform, ler e gravar arquivos externos, conectar modelos em linguagens externas e organizar uma verificação mais robusta.

O bloco começa retomando a diferença entre **compilação** e **síntese**, mas o foco real passa a ser o testbench: um ambiente que cerca o **DUT — Design Under Test**, aplica estímulos, captura respostas e verifica se o comportamento bate com a especificação.

O exemplo inicial é um **somador de 2 bits** escrito em VHDL. O testbench usa sinais locais, instancia o DUT, aplica valores ao longo do tempo com `wait for`, usa processos para gerar estímulos e pode imprimir resultados com recursos de `textio`, `report` ou `assert`.

A aula também apresenta conceitos importantes de verificação moderna: **HVL**, **self-checking testbench**, **BFM**, **driver**, **receiver**, **scoreboard**, **checker**, **coverage**, **CRV**, **FLI**, pacotes VHDL, funções, procedures, operações com arquivos, geração de clock e debugging.

---

## Texto extraído e organizado por slide

### Slide 1 — Compilation vs. Synthesizability

O slide retoma a diferença entre **Compilation** e **Synthesis**.

#### Compilation

A compilação verifica módulos codificados, checa erros sintáticos e semânticos e prepara o programa para execução.

Pontos principais:

- reconhece todos os constructs de uma linguagem formalmente definida;
- traduz para uma representação em linguagem de máquina;
- não altera o hardware no qual o programa roda;
- é seguida pela execução em uma plataforma computacional ou processador;
- é típica de linguagens de programação de alto nível.

Fluxo conceitual:

```text
Source code
   ↓
Compilation
   ↓
Machine code
   ↓
Execution
```

#### Synthesis

A síntese pega uma descrição **behavioral** ou **RTL** e a mapeia para recursos concretos de hardware.

Pontos principais:

- reconhece um subconjunto da HDL dependente do alvo;
- mapeia para recursos de hardware reais;
- é iterativa dentro do fluxo de design;
- gera netlist estrutural;
- mira standard cells ou FPGAs;
- a qualidade da netlist depende do estilo de codificação do RTL.

Fluxo conceitual:

```text
HDL / RTL design models
   ↓
Synthesis
   ↓
Design netlist
```

Interpretação:

Compilar um testbench e sintetizar um DUT são coisas diferentes. O testbench é executado pelo simulador. O DUT, quando escrito como RTL sintetizável, pode ser transformado em hardware.

---

### Slide 2 — Hardware Verification Language (HVL)

HVLs combinam recursos de linguagens de alto nível, como C++ ou Java, com recursos de manipulação bit-level típicos de HDLs.

Características citadas:

- suportam geração de estímulos randômicos com constraints;
- possuem constructs para extrair coverage de verificação;
- devem ser simples, abstratas, escaláveis e fáceis de manter;
- no início, como o hardware era mais simples, HDLs eram usadas para escrever testbenches com estímulos randômicos mínimos;
- VHDL foi uma das linguagens usadas para verificação de blocos lógicos simples;
- uma HVL deve ter:
  - assertions concorrentes;
  - geração randômica com constraints;
  - noção de tempo;
  - formas de conexão com o DUT;
- Specman e foi a primeira HVL completa, seguida por SystemVerilog, OpenVera e SystemC.

Figura do slide:

```text
Testbench
 ├── Stimulus
 ├── Device under test
 └── Response checker
```

Interpretação:

A figura mostra a estrutura fundamental da verificação: o testbench gera estímulos, aplica ao DUT e verifica a resposta.

---

### Slide 3 — VHDL Design Under Test (DUT)

O **DUT** é o módulo a ser verificado.

Pontos principais:

- A verificação do DUT busca conformidade funcional com a especificação do design.
- O exemplo usa um somador de 2 bits como DUT.
- O design é modelado em VHDL usando constructs diretos.
- O módulo se chama `twoBitAdder`.
- `x` e `y` são entradas de 2 bits.
- `z` é saída de 3 bits.
- Os 2 bits menos significativos de `z` representam a soma.
- O bit mais significativo de `z` representa o carry.
- O resultado tem um bit a mais que os operandos para acomodar o carry.
- Usa atribuição combinacional para modelar a função do somador.

Exemplo didático reconstruído:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity twoBitAdder is
  port (
    x : in  unsigned(1 downto 0);
    y : in  unsigned(1 downto 0);
    z : out unsigned(2 downto 0)
  );
end twoBitAdder;

architecture behavioral of twoBitAdder is
begin
  z <= ('0' & x) + ('0' & y);
end behavioral;
```

Interpretação:

Como `x` e `y` têm 2 bits, o valor máximo é:

```text
3 + 3 = 6 = 3'b110
```

Por isso a saída precisa ter 3 bits.

---

### Slide 4 — VHDL Testbench for 2-Bit Adder DUT

O testbench para testar o somador é mostrado no slide.

Pontos principais:

- O testbench não tem portas externas.
- O módulo se chama `adder2bit_tb`.
- Os estímulos `x`, `y` e a saída `z` são declarados como `signal`.
- A instanciação do DUT é feita com o nome `uut`.
- O estímulo é aplicado em processos, em tempos diferentes, usando passos de `#20` no conceito do slide, mas em VHDL isso aparece como `wait for 20 ns`.
- Os processos no testbench terminam com `end process`.
- O testbench termina com `end behavior`.

Exemplo didático reconstruído:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity adder2bit_tb is
end entity;

architecture behavior of adder2bit_tb is

  component twoBitAdder
    port (
      x : in  unsigned(1 downto 0);
      y : in  unsigned(1 downto 0);
      z : out unsigned(2 downto 0)
    );
  end component;

  signal x : unsigned(1 downto 0);
  signal y : unsigned(1 downto 0);
  signal z : unsigned(2 downto 0);

begin

  uut : twoBitAdder
    port map (
      x => x,
      y => y,
      z => z
    );

  stimulus : process
  begin
    x <= "00";
    y <= "00";
    wait for 20 ns;

    x <= "01";
    y <= "01";
    wait for 20 ns;

    x <= "11";
    y <= "11";
    wait for 20 ns;

    x <= "00";
    y <= "11";
    wait for 20 ns;

    wait;
  end process;

end behavior;
```

Resultado conceitual mostrado no console:

```text
t=0    x=01, y=00, z=01
t=20   x=10, y=01, z=3
t=40   x=11, y=00, z=3
t=60   x=00, y=11, z=4
t=100
```

A ideia é demonstrar que o testbench aplica estímulos ao longo do tempo e observa a saída.

---

### Slide 5 — Código completo do testbench VHDL

O slide mostra um trecho ampliado do testbench.

Elementos principais visíveis:

- `library ieee`;
- `use ieee.std_logic_1164.all`;
- `use ieee.numeric_std.all`;
- `entity adder2bit_tb is`;
- `architecture behavior of adder2bit_tb is`;
- declaração de `component twoBitAdder`;
- declaração de signals:
  - `I0`
  - `I1`
  - `O`
- constante `num_iterations`;
- instanciação do componente;
- processos de estímulo;
- loops `for`;
- uso de `wait for`.

Trecho didático aproximado:

```vhdl
constant num_iterations : integer := 4;

process
begin
  for i in 1 to num_iterations loop
    I1(1) <= '0';
    wait for 20 ns;

    I1(1) <= '1';
    wait for 20 ns;
  end loop;

  wait;
end process;
```

Interpretação:

O testbench usa processos separados para gerar padrões diferentes nos bits de entrada. Cada processo pode rodar em paralelo com os demais, pois processos em VHDL são concorrentes no nível da arquitetura.

---

### Slide 6 — VHDL Constructs for Output Generation

VHDL fornece recursos para gerar entrada e saída em testbenches, geralmente com uso de pacotes especiais.

Pontos principais:

- VHDL não tem equivalentes diretos às system calls de Verilog que começam com `$`.
- A função `write()` escreve valores no console durante a simulação.
- Para usar `write`, é necessário incluir o pacote `IEEE.textio`.
- `report` é outro construct usado para saída de sinais e mensagens.
- Monitorar sinais também pode ser feito com `assert`.
- Loops são muito úteis em testbenches.

Constructs citados:

- `for`
- `if-else`
- `while`

Exemplo didático com `textio`:

```vhdl
use std.textio.all;

process
  variable L : line;
begin
  write(L, string'("z = "));
  write(L, integer'image(to_integer(z)));
  writeline(output, L);
  wait;
end process;
```

Exemplo com `report`:

```vhdl
report "valor de z = " & integer'image(to_integer(z));
```

Exemplo com `assert`:

```vhdl
assert z = expected
  report "Erro: resultado inesperado"
  severity error;
```

---

### Slide 7 — VHDL Testbench

O slide mostra um exemplo maior de testbench VHDL.

Elementos principais:

- uso de `library ieee`;
- uso de `ieee.std_logic_1164.all`;
- uso de `ieee.numeric_std.all`;
- entidade de testbench sem portas;
- componente a ser testado;
- sinais internos;
- instanciação do DUT;
- processo principal de teste;
- uso de `wait for`;
- uso de `assert`;
- mensagem de erro com `severity warning`;
- geração de clock;
- loop para simulação.

Trecho conceitual:

```vhdl
process
begin
  rst <= '0';
  wait for 10 ns;

  rst <= '1';
  wait for 10 ns;

  assert unsigned(qout) = qsim
    report "ERROR: q not equal"
    severity warning;

  wait;
end process;
```

Interpretação:

O testbench VHDL pode ser estruturado como um programa de teste, mas ele roda em um simulador de hardware. O uso de `assert` permite transformar o testbench em self-checking.

---

### Slide 8 — VHDL Constructs

O slide explica como gerar dump de sinais para análise de waveform.

Pontos principais:

- VHDL precisa incluir comandos para dumping de sinais do design.
- Esses comandos são específicos do simulador.
- O usuário deve consultar o guia do simulador para comandos específicos.
- `fsdbDumpfile` e `fsdbDumpvars` são system tasks usadas para:
  - dump de sinais para análise de waveform;
  - criação de arquivo FSDB.

Exemplo reconstruído com pacote Novas/FSDB:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

library novas;
use novas.fsdb_pkg.all;

process
begin
  fsdbDumpfile("test.fsdb");
  fsdbDumpvars(0, "+all");
  wait;
end process;
```

Interpretação:

Em Verilog, é comum escrever `$fsdbDumpfile` e `$fsdbDumpvars`. Em VHDL, usa-se um pacote específico do simulador, como o pacote `novas`, para chamar funções equivalentes.

---

### Slide 9 — VHDL Timing Control and Delays

Pontos principais:

- VHDL usa **inertial delays** por padrão, por serem mais realistas para modelar circuitos.
- O código e as figuras mostram representação de delay inercial.
- Delays podem ser especificados dentro de uma atribuição.
- Primeiro, a expressão do lado direito é avaliada.
- Depois, aguarda-se o tempo especificado para atribuir o valor.
- O delay inercial pode rejeitar glitches/pulsos estreitos.
- O exemplo também mostra **transport delay**.

#### Inertial delay

Exemplo:

```vhdl
p <= reject 10 ns inertial (a or b) after 5 ns;
```

Interpretação:

- modela rejeição de glitch;
- pulsos menores que certo limite podem ser filtrados;
- aproxima o comportamento de portas reais, que não propagam todo pulso infinitamente estreito.

Outro exemplo:

```vhdl
z <= y after 20 ns;
```

Como `inertial` é o padrão, isso tende a funcionar como delay inercial.

#### Transport delay

Exemplo:

```vhdl
p <= transport a after 10 ns;
```

Interpretação:

- modela atraso de propagação de fio;
- não filtra pulsos curtos;
- todo evento de entrada é transportado para a saída após o delay.

Resumo:

```text
inertial delay  → modela atraso de porta e rejeita glitches curtos.
transport delay → modela propagação e preserva pulsos.
```

---

### Slide 10 — VHDL Multi-Driven Net Declaration

O slide trata de nets/sinais com múltiplos drivers.

Pontos principais:

- Um módulo lógico pode ter entradas, saídas e sinais internos dirigidos por uma ou mais portas lógicas.
- Esses sinais podem se comportar como funções wired.
- VHDL não permite diretamente declarações como Verilog `wand` ou `wor`, mas é possível realizar comportamento semelhante com constructs de resolução disponíveis em pacotes especiais.
- O exemplo mostra uma função `f` dirigida por duas portas com AND e OR.
- Apesar de ser possível usar esses tipos de sinal, eles devem ser evitados pela confusão que causam.

Exemplo conceitual:

```vhdl
entity test is
  port (
    a, b, x, y : in std_logic;
    f : out std_logic
  );
end entity;

architecture rtl of test is
begin
  f <= a and b;
  f <= x or y;
end architecture;
```

Em VHDL, múltiplos drivers exigem que o tipo seja resolvido, como `std_logic`, ou que se defina uma função de resolução customizada.

Exemplo conceitual de função de resolução:

```vhdl
function resolved_wor(s : std_logic_vector) return std_logic is
  variable result : std_logic := '0';
begin
  for i in s'range loop
    result := result or s(i);
  end loop;

  return result;
end function;
```

Interpretação:

Mesmo quando tecnicamente possível, sinais com múltiplos drivers tornam o debug mais difícil. Em RTL moderno, prefira muxes e lógica de arbitragem explícita.

---

### Slide 11 — VHDL Functions and Procedures

Pontos principais:

- Functions são subprogramas VHDL usados para funções frequentes.
- Functions não possuem `wait statements`; portanto, consomem zero tempo de simulação.
- Functions sempre retornam um valor que deve ser atribuído a uma variável ou sinal.
- Existem dois tipos de function:
  - pure;
  - impure.
- Uma function é pure se não modifica nem lê objetos externos de forma que cause efeitos colaterais.
- A diferença entre function e procedure é mostrada na tabela.

#### Function

- Deve ter corpo e declarações.
- Executa computação sequencial e retorna um valor.
- Em VHDL, uma function recebe zero ou mais valores de entrada e retorna um valor calculado.

Exemplo:

```vhdl
function addition(a : integer; b : integer) return integer is
  variable sum_result : integer;
begin
  sum_result := a + b;
  return sum_result;
end function;
```

#### Procedure

- Deve ter corpo e declarações.
- Executa computações sequenciais.
- Não retorna valor diretamente por `return`.
- Pode alterar objetos globais ou retornar valores por parâmetros.
- Packages ajudam a agrupar subprogramas para uso em outros arquivos.
- Uma procedure pode ter qualquer número de entradas e gerar múltiplas saídas.

Exemplo:

```vhdl
procedure pulse_generate(
  signal pulse : inout std_logic;
  signal pulse_length : in time
) is
begin
  pulse <= not pulse;
  wait for pulse_length;
  pulse <= not pulse;
end procedure;
```

Interpretação:

Functions são boas para cálculo. Procedures são boas para sequências de ações no testbench, especialmente quando podem envolver tempo.

---

### Slide 12 — VHDL Packages

Um package VHDL agrupa elementos relacionados.

Pontos principais:

- Um package fornece uma forma conveniente de manter agrupados:
  - functions;
  - procedures;
  - type definitions;
  - components;
  - constants.
- Isso permite reutilizar elementos do package em diferentes designs VHDL.
- Packages geralmente têm duas partes:
  - package declaration;
  - package body.

#### Package declaration

Contém declarações visíveis:

```vhdl
package example_package is
  function addition(a : integer; b : integer) return integer;

  procedure pulse_generate(
    signal pulse : inout std_logic;
    signal pulse_length : in time
  );
end package;
```

#### Package body

Contém implementações:

```vhdl
package body example_package is

  function addition(a : integer; b : integer) return integer is
    variable sum_result : integer;
  begin
    sum_result := a + b;
    return sum_result;
  end function;

  procedure pulse_generate(
    signal pulse : inout std_logic;
    signal pulse_length : in time
  ) is
  begin
    pulse <= not pulse;
    wait for pulse_length;
    pulse <= not pulse;
  end procedure;

end package body;
```

Uso:

```vhdl
use work.example_package.all;
```

Interpretação:

Packages são essenciais para organizar código VHDL reutilizável, principalmente em testbenches maiores.

---

### Slide 13 — VHDL: Foreign Language Interface (FLI)

FLI é a interface de VHDL com linguagens externas.

Pontos principais:

- **FLI — Foreign Language Interface** conecta VHDL a linguagens de programação externas.
- As principais linguagens citadas são C++ e Java.
- Vantagens:
  - permite reutilizar código C existente;
  - permite gerar testbenches usando abstrações mais altas.
- VHDL fornece constructs para interfacear modelos escritos em linguagem de alto nível.
- Um modelo funcional pode ser escrito em C e pode incluir chamadas específicas do simulador.
- O modelo C é compilado para criar um objeto compartilhado.
- A compilação é dependente de máquina e pode não ser portátil.
- Pode-se compilar com um compilador ANSI C padrão.
- A entidade e arquitetura com objeto compartilhado usam atributo `foreign`.
- O atributo `foreign` indica que uma arquitetura estrangeira está no arquivo `.so`, e a função de inicialização deve ser usada.
- A entidade pode então ser instanciada e simulada em outros módulos.

Exemplo conceitual de código C:

```c
#include <stdio.h>

void hello() {
  printf("Hello world\n");
}
```

Exemplo conceitual de atributo VHDL:

```vhdl
attribute foreign of arch : architecture is
  "init_message hello.so";
```

Interpretação:

FLI é útil quando já existe um modelo de referência em C/C++ ou quando a verificação precisa de uma abstração que seria difícil de escrever diretamente em VHDL.

---

### Slide 14 — VHDL: File Operations

O slide apresenta operações com arquivos em VHDL.

Pontos principais:

- Em testbenches complexos, frequentemente é necessário fazer o DUT ler estímulos por arquivo externo.
- A resposta do DUT pode ser capturada em outro arquivo para pós-processamento.
- VHDL fornece bibliotecas predefinidas para isso.
- `TextIO` é a biblioteca VHDL predefinida que permite leitura e escrita de dados em arquivos externos.
- A figura mostra procedures para leitura de diferentes tipos de dados a partir da biblioteca `TextIO`.

Exemplo didático de leitura:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use std.textio.all;

process
  file data_file : text open read_mode is "data.txt";
  variable row   : line;
  variable value : integer;
begin
  while not endfile(data_file) loop
    readline(data_file, row);
    read(row, value);

    report "Valor lido: " & integer'image(value);
  end loop;

  wait;
end process;
```

Exemplo conceitual de arquivo `data.txt`:

```text
10
25
37
42
```

Interpretação:

File I/O permite separar os vetores de teste do código do testbench. Isso é útil quando os estímulos são gerados por scripts ou modelos externos.

---

### Slide 15 — VHDL Constraint Random Verification (CRV)

Pontos principais:

- Antigamente, quando os designs eram simples, estímulos direcionados eram suficientes para garantir a operação do DUT.
- Com o aumento da complexidade, é impossível verificar funcionalidade completa apenas com estímulos direcionados.
- Estímulos randômicos com constraints passam a ser úteis.
- OSVVM possui um package VHDL com função `RandomPType` para gerar números randômicos.
- Limitando o tamanho da variável e atribuindo `RandomPType`, pode-se gerar estímulos randômicos com constraints.
- `RandomPType` retorna um novo número randômico de 32 bits a cada chamada.
- O número randômico é um inteiro com sinal, podendo ser positivo ou negativo.
- Pode-se restringir o número randômico usando módulo.
- `unsigned` converte número signed para unsigned.
- Para tornar o randômico determinístico, usa-se seed conhecida.
- A mesma seed gera a mesma sequência.

Exemplo conceitual com OSVVM:

```vhdl
library osvvm;
use osvvm.RandomPkg.all;

process
  variable rv : RandomPType;
  variable addr : integer;
begin
  rv.InitSeed(123);

  for i in 0 to 15 loop
    addr := rv.RandInt(0, 255);
    report "addr = " & integer'image(addr);
  end loop;

  wait;
end process;
```

O slide também mostra geração randômica de read/write:

```vhdl
wr_en   <= rv.RandSlv(1)(0);
wr_data <= rv.RandSlv(RAM_WIDTH);
addr    <= rv.RandInt(0, RAM_DEPTH-1);
```

Interpretação:

CRV em VHDL é menos nativo que em SystemVerilog, mas pode ser feito com bibliotecas como OSVVM.

---

### Slide 16 — VHDL Concepts (1/2)

Pontos principais:

- Um testbench VHDL verifica o hardware para toda funcionalidade pretendida e também para comportamento não pretendido.
- Testbench baseado em File I/O é usado quando estímulos ficam armazenados em arquivos externos.
- Constructs VHDL leem os dados para dentro do DUT.
- A resposta é escrita e comparada com uma resposta esperada por comparação de arquivos.
- O testbench atua como interface entre arquivos e DUT.
- Testbenches simples baseados em File I/O podem ser caros porque o tempo de simulação aumenta.
- Arquivos externos podem ser convertidos em constantes VHDL por scripts.
- Testbenches baseados em máquinas de estado eram populares em anos anteriores.
- Diferentes máquinas de estado testam funcionalidades diferentes.
- Dependendo da escolha do usuário, uma máquina de estado específica é habilitada para dirigir estímulos ao DUT.
- Esse tipo de testbench fica complexo e difícil de depurar.
- Testbench baseado em tasks/functions/procedures é mais flexível.
- Em VHDL, os equivalentes práticos são functions e procedures.
- Testbenches baseados em BFMs são mais eficientes.

Vantagens do modelo baseado em tasks/procedures/BFMs:

- cada procedure executa uma função;
- é mais rápido;
- testbenches estruturais também podem ser definidos;
- altamente portátil com esforço mínimo;
- facilita desenvolvimento de cenários.

Exemplo conceitual de procedure de escrita:

```vhdl
procedure write_data(
  signal clk     : in  std_logic;
  signal wr_en   : out std_logic;
  signal address : out integer;
  signal data    : out integer;
  constant a     : in integer;
  constant d     : in integer
) is
begin
  wait until rising_edge(clk);
  address <= a;
  data    <= d;
  wr_en   <= '1';

  wait until rising_edge(clk);
  wr_en <= '0';
end procedure;
```

---

### Slide 17 — VHDL Concepts (2/2)

Pontos principais:

- Testbenches self-checking garantem reusabilidade e qualidade.
- Eles são modulares e facilitam rastrear coverage.
- Um self-checking testbench é inteligente:
  - amostra a saída do DUT;
  - compara a saída amostrada com a saída esperada.

Sequência de teste em testbenches:

1. gerar vetores de estímulo;
2. transmitir estímulo ao DUT;
3. monitorar resposta gerada pelo DUT;
4. verificar a resposta gerada;
5. gerar relatório sobre o desempenho do DUT;
6. produzir uma figura de mérito para mostrar a qualidade do testbench.

Arquitetura visual:

```text
Stimulus generator → Driver → DUT → Response checker / receiver
                           ↘
                         Scoreboard
```

Tabela do slide:

| Módulo do testbench | Função |
|---|---|
| Stimulus generator | Gera vetores directed e constraint random; deve ser fácil e inteligente. |
| BFM / Driver | Interage com o DUT dirigindo e amostrando sinais; converte transações de alto nível em sinais de interface. |
| Receiver | Reconstrói informação de saída; a saída do DUT é coletada e disponibilizada em formato de alto nível. |
| Scoreboard | Estrutura de armazenamento; coleta estímulos e respostas do DUT. |
| Checker | Compara dados esperados e observados; decide match/mismatch; valida legalidade dos dados. |
| Coverage | Pode ser functional coverage e code coverage; mede o quanto foi verificado/coberto. |

Interpretação:

A aula introduz a arquitetura moderna de verificação, mesmo em VHDL. Esse modelo antecipa conceitos usados em ambientes mais avançados.

---

### Slide 18 — VHDL Compiler Switches

Pontos principais:

- Switches VHDL podem ser usados para compilação seletiva durante simulação.
- Compilar com `+define+TYPE_1` gera uma mensagem `TYPE_1`.
- Compilar com `+define+TYPE_2` gera uma mensagem `TYPE_2`.

O slide lista três tipos de directives:

#### Translation stop and start directives

Exemplos:

```vhdl
-- pragma translate_off
-- pragma translate_on
-- pragma synthesis_off
-- pragma synthesis_on
```

Interpretação:

Usadas para excluir trechos da síntese ou tradução, mantendo código apenas para simulação.

#### Resolution function directives

Exemplos:

```vhdl
-- pragma resolution_method wired_and
-- pragma resolution_method wired_or
-- pragma resolution_method three_state
```

Interpretação:

Relacionadas a métodos de resolução de múltiplos drivers.

#### Component implication directives

Exemplos:

```vhdl
-- pragma map_to_entity entity_name
-- pragma return_port_name port_name
```

Interpretação:

Ajudam a orientar ferramentas em mapeamento ou inferência de componentes.

---

### Slide 19 — VHDL Clock Generator

Pontos principais:

- Clocks são os principais eventos de sincronização aos quais todos os outros sinais se referenciam.
- Se o RTL está em VHDL, o clock generator é escrito em VHDL, mesmo que o testbench esteja em outra linguagem.
- Clocks podem ser gerados de várias formas.
- O slide mostra dois métodos de geração de clock.
- Alguns testbenches precisam de mais de um clock generator.
- Alguns testbenches precisam de clocks com fases diferentes.
- Outros precisam de clock com jitter.

Exemplo simples:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

signal clk : std_logic := '0';

clk <= not clk after half_period;
```

Exemplo com processo:

```vhdl
constant clk_period : time := 10 ns;

clk_process : process
begin
  clk <= '0';
  wait for clk_period / 2;

  clk <= '1';
  wait for clk_period / 2;
end process;
```

Interpretação:

Esse código é típico de testbench. Ele gera um clock ideal na simulação. Não deve ser confundido com um oscilador sintetizável.

---

### Slide 20 — Debugging

Pontos principais:

- Debugging é um método sistemático para encontrar e reduzir o número de bugs.
- Bugs podem estar no DUT ou no testbench.
- Debuggers permitem:
  - monitorar a execução;
  - parar;
  - reiniciar;
  - rodar em modo interativo.

Passos básicos de debug:

1. Identificar mismatch entre resposta do DUT e resposta esperada. Isso indica bug.
2. Reduzir a investigação ao DUT ou ao testbench como área provável do bug.
3. Encontrar a causa raiz do bug.
4. Corrigir o bug.
5. Validar a correção e retestar o cenário.

Outros pontos:

- Ao fim da simulação de cada teste, é gerado um relatório `FAILED` ou `PASSED`.
- Isso é chamado de **self checking**.
- Arquivos de log e waveform viewer ajudam no debug quando o teste falha.

---

## Aula didática desenvolvida

### 1. VHDL de verificação não é VHDL de síntese

Nas aulas de síntese, o foco era escrever VHDL que vira hardware. Nesta aula, o foco é escrever VHDL que controla a simulação.

Isso muda tudo.

No DUT, você evita:

```vhdl
wait for 10 ns;
```

No testbench, isso é normal:

```vhdl
wait for 10 ns;
```

No DUT, você escreve:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    q <= d;
  end if;
end process;
```

No testbench, você pode escrever:

```vhdl
clk <= not clk after 5 ns;
```

A regra central é:

```text
DUT deve seguir disciplina de RTL sintetizável.
Testbench pode usar constructs de simulação.
```

---

### 2. Estrutura mínima de um testbench VHDL

Um testbench VHDL geralmente tem:

1. uma entidade sem portas;
2. uma arquitetura;
3. sinais locais;
4. instanciação do DUT;
5. processos de estímulo;
6. processo de clock, se necessário;
7. checks com `assert` ou `report`;
8. finalização com `wait`.

Exemplo:

```vhdl
entity tb is
end entity;

architecture sim of tb is
  signal a : std_logic := '0';
  signal b : std_logic := '0';
  signal y : std_logic;
begin

  dut : entity work.and_gate
    port map (
      a => a,
      b => b,
      y => y
    );

  stim : process
  begin
    a <= '0'; b <= '0';
    wait for 10 ns;

    a <= '1'; b <= '1';
    wait for 10 ns;

    wait;
  end process;

end architecture;
```

---

### 3. Por que o testbench não tem portas?

O testbench é o topo da simulação. Ele não precisa ser conectado externamente a outro módulo.

Ele cria seus próprios sinais:

```vhdl
signal x : unsigned(1 downto 0);
signal y : unsigned(1 downto 0);
signal z : unsigned(2 downto 0);
```

E conecta esses sinais ao DUT:

```vhdl
uut : entity work.twoBitAdder
  port map (
    x => x,
    y => y,
    z => z
  );
```

Assim, o testbench controla as entradas e observa as saídas.

---

### 4. `wait for` como controle de tempo

Em testbench, `wait for` é uma das ferramentas mais usadas.

Exemplo:

```vhdl
x <= "00";
y <= "00";
wait for 20 ns;

x <= "11";
y <= "11";
wait for 20 ns;
```

Isso significa:

```text
aplique uma entrada
espere o tempo de simulação passar
aplique outra entrada
```

Esse tempo não vira hardware. Ele apenas organiza a simulação.

---

### 5. `assert` como checker

Um testbench fraco apenas mostra valores. Um testbench forte verifica automaticamente.

Exemplo:

```vhdl
assert z = expected
  report "Erro no somador"
  severity error;
```

Se a condição for falsa, o simulador emite a mensagem.

Exemplo completo:

```vhdl
process
  variable expected : unsigned(2 downto 0);
begin
  x <= "11";
  y <= "11";
  wait for 1 ns;

  expected := resize(x, 3) + resize(y, 3);

  assert z = expected
    report "FAILED: z diferente do esperado"
    severity error;

  wait;
end process;
```

Isso é o começo de um **self-checking testbench**.

---

### 6. `report` para mensagens

`report` escreve mensagens no log da simulação.

Exemplo:

```vhdl
report "Iniciando teste do somador";
```

Com valor numérico:

```vhdl
report "z = " & integer'image(to_integer(z));
```

`report` é mais simples que `textio` para mensagens diretas.

Use `textio` quando precisar formatar linhas, escrever arquivos ou manipular entrada/saída textual mais detalhada.

---

### 7. `TextIO` para arquivos e console

`TextIO` é útil quando o testbench precisa ler vetores de teste de um arquivo ou gravar resultados.

Exemplo de leitura:

```vhdl
file input_file : text open read_mode is "vectors.txt";
variable L : line;
variable value : integer;

readline(input_file, L);
read(L, value);
```

Exemplo de escrita no console:

```vhdl
variable L : line;

write(L, string'("Resultado = "));
write(L, value);
writeline(output, L);
```

Exemplo de escrita em arquivo:

```vhdl
file output_file : text open write_mode is "results.txt";

write(L, string'("PASS"));
writeline(output_file, L);
```

---

### 8. Inertial delay e transport delay

VHDL tem uma diferença elegante entre atrasos.

#### Inertial delay

Padrão em VHDL:

```vhdl
y <= a after 10 ns;
```

Se `a` tiver um pulso muito curto, esse pulso pode ser filtrado. Isso imita o comportamento de uma porta lógica real, que não responde a glitches muito estreitos.

#### Transport delay

```vhdl
y <= transport a after 10 ns;
```

Todo pulso é propagado, mesmo que seja curto.

Resumo:

```text
inertial  → porta lógica, filtra glitch curto.
transport → fio/caminho ideal, transporta tudo com atraso.
```

Essa diferença é relevante em modelagem temporal e testbench.

---

### 9. Múltiplos drivers em VHDL

VHDL permite múltiplos drivers apenas quando o tipo do sinal tem função de resolução.

`std_logic` é um tipo resolvido. Se dois drivers dirigem o mesmo sinal, uma tabela de resolução decide o valor final.

Exemplo perigoso:

```vhdl
f <= a and b;
f <= x or y;
```

Mesmo que compile com `std_logic`, isso pode gerar confusão.

Melhor escrever explicitamente:

```vhdl
f <= (a and b) or (x or y);
```

Ou controlar com mux/enable:

```vhdl
f <= source1 when sel = '0' else source2;
```

A diretriz é evitar múltiplos drivers sempre que possível.

---

### 10. Function versus procedure em VHDL

#### Function

Retorna um valor e não consome tempo.

```vhdl
function parity(data : std_logic_vector) return std_logic is
  variable p : std_logic := '0';
begin
  for i in data'range loop
    p := p xor data(i);
  end loop;

  return p;
end function;
```

Uso:

```vhdl
par <= parity(data_in);
```

#### Procedure

Executa uma sequência de ações e pode alterar sinais/variáveis passados como parâmetro.

```vhdl
procedure apply_vector(
  signal x : out unsigned(1 downto 0);
  signal y : out unsigned(1 downto 0);
  constant a : in unsigned(1 downto 0);
  constant b : in unsigned(1 downto 0)
) is
begin
  x <= a;
  y <= b;
  wait for 20 ns;
end procedure;
```

Uso:

```vhdl
apply_vector(x, y, "01", "11");
```

Functions são para cálculo. Procedures são para ações.

---

### 11. Packages para organizar testbench

Em testbenches maiores, é ruim repetir functions e procedures em todo arquivo.

Use package:

```vhdl
package tb_pkg is
  procedure apply_reset(signal rst : out std_logic);
  function to_int(v : unsigned) return integer;
end package;
```

E package body:

```vhdl
package body tb_pkg is

  procedure apply_reset(signal rst : out std_logic) is
  begin
    rst <= '1';
    wait for 10 ns;
    rst <= '0';
    wait for 10 ns;
  end procedure;

  function to_int(v : unsigned) return integer is
  begin
    return to_integer(v);
  end function;

end package body;
```

Uso:

```vhdl
use work.tb_pkg.all;
```

Isso torna o ambiente reutilizável.

---

### 12. FLI: quando usar linguagem externa

FLI é útil quando:

- já existe modelo de referência em C/C++;
- o algoritmo é muito complexo para reescrever em VHDL;
- o testbench precisa conversar com software externo;
- a verificação usa bibliotecas externas;
- há co-simulação.

Exemplo mental:

```text
DUT em VHDL
Modelo esperado em C
Testbench compara saída do DUT com saída do modelo C
```

Isso evita duplicar algoritmos complexos em VHDL.

---

### 13. File-based testbench

Um testbench baseado em arquivo segue este fluxo:

```text
arquivo de entrada → testbench → DUT → arquivo de saída → comparação
```

Vantagens:

- fácil gerar vetores por script;
- fácil reproduzir testes;
- facilita comparação com modelo externo;
- útil para grandes conjuntos de dados.

Desvantagens:

- pode ser mais lento;
- exige cuidado com formato;
- erros de caminho/arquivo podem atrapalhar;
- debug pode ficar menos direto.

---

### 14. Constraint random em VHDL

VHDL não nasceu com randomização avançada como SystemVerilog. Mas bibliotecas como OSVVM adicionam esse poder.

Exemplo:

```vhdl
variable rv : RandomPType;
variable value : integer;

rv.InitSeed(123);
value := rv.RandInt(0, 100);
```

Isso permite gerar casos variados sem escrever todos manualmente.

Mas o ponto central da randomização é:

```text
gerar valores válidos e úteis, não apenas valores aleatórios.
```

Por isso entram constraints.

---

### 15. Self-checking testbench

Um testbench self-checking gera `PASS` ou `FAIL` sem depender de inspeção manual.

Exemplo:

```vhdl
if z = expected then
  report "PASSED";
else
  report "FAILED" severity error;
end if;
```

Em projetos reais, isso é obrigatório, porque ninguém consegue olhar manualmente milhares de waveforms.

O teste precisa dizer:

```text
o resultado está correto ou incorreto.
```

Waveform é para debug posterior.

---

### 16. Driver, receiver, scoreboard e checker

A arquitetura moderna de testbench separa responsabilidades.

#### Stimulus generator

Decide o que testar.

#### Driver / BFM

Converte uma transação em sinais reais do DUT.

Exemplo:

```text
transação: write addr=10 data=55
sinais: wr_en, addr, data, valid
```

#### Receiver

Observa as saídas do DUT e reconstrói transações.

#### Scoreboard

Guarda o esperado e o observado.

#### Checker

Compara e decide se passou ou falhou.

#### Coverage

Mede o quanto foi testado.

Essa separação torna o testbench mais modular, reutilizável e fácil de debugar.

---

### 17. Compiler directives em VHDL

O slide cita pragmas como:

```vhdl
-- pragma translate_off
-- pragma translate_on
```

Uso típico:

```vhdl
-- pragma translate_off
report "Mensagem só para simulação";
-- pragma translate_on
```

A ferramenta de síntese ignora o trecho entre `translate_off` e `translate_on`.

Isso é útil para colocar código de simulação dentro de um arquivo que também será sintetizado, mas deve ser usado com cuidado para não esconder comportamento importante.

---

### 18. Gerador de clock em VHDL

Duas formas comuns:

#### Atribuição concorrente

```vhdl
clk <= not clk after 5 ns;
```

#### Processo

```vhdl
clk_process : process
begin
  clk <= '0';
  wait for 5 ns;

  clk <= '1';
  wait for 5 ns;
end process;
```

Para encerrar a simulação, geralmente há outro processo com `wait` e `assert false` ou mecanismo da ferramenta.

Exemplo:

```vhdl
process
begin
  wait for 1 us;
  assert false report "Fim da simulação" severity failure;
end process;
```

---

### 19. Debugging em VHDL

Quando um teste falha, o caminho é:

```text
1. Ver mensagem de erro no log.
2. Identificar tempo da falha.
3. Abrir waveform.
4. Conferir estímulo.
5. Conferir saída do DUT.
6. Conferir expected value do testbench.
7. Decidir se o bug está no DUT ou no testbench.
8. Corrigir.
9. Rodar novamente.
```

É comum o bug estar no testbench, especialmente em:

- cálculo errado do esperado;
- atraso insuficiente antes do check;
- reset mal aplicado;
- arquivo de entrada errado;
- conversão de tipo incorreta;
- signed/unsigned confundido;
- largura de sinal insuficiente.

---

## Conceitos difíceis explicados em profundidade

### 1. VHDL não tem `$display`

Em Verilog:

```verilog
$display("valor = %0d", valor);
```

Em VHDL, opções comuns são:

```vhdl
report "valor = " & integer'image(valor);
```

ou com `TextIO`:

```vhdl
write(L, string'("valor = "));
write(L, valor);
writeline(output, L);
```

Portanto:

```text
Verilog usa system tasks com $.
VHDL usa report, assert e pacotes como TextIO.
```

---

### 2. `assert` não é só erro

`assert` tem uma condição. Se a condição for falsa, ele reporta a mensagem.

Exemplo:

```vhdl
assert z = expected
  report "z não bate com expected"
  severity error;
```

Se `z = expected`, nada acontece.

Se `z /= expected`, o simulador reporta.

Níveis de severidade:

```text
note
warning
error
failure
```

Uso típico:

- `note`: informação;
- `warning`: suspeita;
- `error`: falha de teste;
- `failure`: parar simulação ou indicar erro grave.

---

### 3. Expected value no testbench

Para um somador de 2 bits, o expected pode ser calculado assim:

```vhdl
expected := resize(x, 3) + resize(y, 3);
```

É importante usar `resize`, porque:

```text
x tem 2 bits
y tem 2 bits
z tem 3 bits
```

Sem ampliar corretamente, o cálculo esperado pode truncar o carry e mascarar bug.

---

### 4. O perigo de testar combinacional sem esperar delta/time

Depois de aplicar entrada:

```vhdl
x <= "11";
y <= "11";
```

não cheque imediatamente sem considerar a semântica de signal update.

Faça:

```vhdl
wait for 1 ns;
```

ou, em simulação puramente delta:

```vhdl
wait for 0 ns;
```

Depois cheque:

```vhdl
assert z = expected;
```

Isso garante que a saída teve chance de atualizar.

---

### 5. Por que seed importa em randomização?

Se um teste randômico falha, você precisa reproduzir exatamente o mesmo cenário.

Por isso:

```vhdl
rv.InitSeed(123);
```

Com a mesma seed, a sequência randômica se repete.

Fluxo correto:

```text
teste randômico falhou
guardar seed
rodar de novo com a mesma seed
abrir waveform
corrigir bug
rodar regressão
```

Sem seed, uma falha pode desaparecer e virar um bug quase impossível de depurar.

---

### 6. Inertial delay como filtro de glitch

Imagine um pulso de 2 ns na entrada e um delay inercial de 10 ns. O pulso pode ser rejeitado.

Isso imita uma porta real: se o pulso for curto demais, a porta pode nem responder.

Com transport delay, o pulso aparece na saída atrasado.

Resumo visual:

```text
pulso curto + inertial  → pode sumir
pulso curto + transport → aparece atrasado
```

---

### 7. Multiple drivers e resolução

`std_logic` tem função de resolução. Se dois drivers escrevem no mesmo sinal:

```vhdl
driver1: f <= '1';
driver2: f <= '0';
```

o resultado pode ser `X`.

Isso é útil para detectar conflito, mas ruim se não for intencional.

Prefira um driver único:

```vhdl
f <= a when sel = '0' else b;
```

---

### 8. Procedure com `wait`

Uma function não pode consumir tempo. Uma procedure pode.

Exemplo:

```vhdl
procedure pulse(
  signal s : out std_logic
) is
begin
  s <= '1';
  wait for 10 ns;
  s <= '0';
end procedure;
```

Isso é excelente para testbench.

Uso:

```vhdl
stimulus : process
begin
  pulse(start);
  wait;
end process;
```

---

### 9. Coverage não é PASS/FAIL

Um teste pode passar e ainda assim ter pouca coverage.

Exemplo:

```text
Testei só x=0, y=0.
Passou.
Mas não testei carry.
```

Coverage responde:

```text
Quanto do espaço funcional eu exercitei?
```

PASS/FAIL responde:

```text
O que eu testei deu certo?
```

São métricas diferentes.

---

### 10. Debug: DUT ou testbench?

Quando há mismatch, não assuma imediatamente que o DUT está errado.

Pode ser:

- estímulo incorreto;
- check feito cedo demais;
- expected value errado;
- signed/unsigned errado;
- arquivo de entrada errado;
- reset não aplicado;
- clock não gerado;
- DUT realmente errado.

A primeira tarefa é isolar a origem.

---

## Figuras, diagramas e waveforms importantes

### Diagrama Testbench → DUT → Response checker

Mostra a estrutura básica de verificação. É a imagem central para entender testbench.

### Código do DUT twoBitAdder

Mostra o somador de 2 bits com saída de 3 bits. O ponto didático é a largura extra para carry.

### Código do testbench do somador

Mostra entity sem portas, architecture, component, signals, instância `uut`, processos de estímulo e `wait for`.

### Slide de Output Generation

Mostra que VHDL não usa `$display`; ele usa `write`, `report`, `assert` e pacotes como `textio`.

### Slide de dump FSDB

Mostra que comandos de waveform em VHDL dependem do simulador e de pacotes, como `novas.fsdb_pkg`.

### Slide de inertial/transport delay

Mostra graficamente a diferença entre atraso que filtra glitch e atraso que transporta todo pulso.

### Slide de multi-driven net

Mostra a ideia de múltiplos drivers e resolução. A mensagem prática é evitar por clareza.

### Tabela function versus procedure

Function retorna um valor e não consome tempo. Procedure executa ações e pode gerar múltiplas saídas.

### Slide de packages

Mostra package declaration e package body. Essencial para reuso em VHDL.

### Slide de FLI

Mostra conexão entre modelo C/C++ e simulador VHDL por FLI.

### Slide de File Operations

Mostra `TextIO` e leitura de arquivos externos. Essencial para testbench baseado em vetores.

### Slide de CRV

Mostra OSVVM e `RandomPType`. Essencial para randomização em VHDL.

### Diagrama de self-checking testbench

Mostra stimulus generator, driver, DUT, receiver, scoreboard, checker e coverage.

### Slide de clock generator

Mostra formas de criar clock em testbench VHDL.

### Slide de debugging

Mostra o processo de encontrar mismatch, isolar, corrigir e retestar.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é um DUT?**  
   O módulo ou design a ser verificado.

2. **Qual é a função do testbench?**  
   Gerar estímulos, aplicar no DUT, observar respostas e verificar se batem com o esperado.

3. **VHDL tem system calls com `$` como Verilog?**  
   Não. VHDL usa constructs como `report`, `assert` e pacotes como `TextIO`.

4. **Como imprimir mensagens simples em VHDL?**  
   Com `report`.

5. **Como escrever/formatar saída com mais controle?**  
   Usando `TextIO`, com `write` e `writeline`.

6. **Como fazer checagem automática em VHDL?**  
   Usando `assert`.

7. **Qual é a diferença entre inertial e transport delay?**  
   Inertial pode rejeitar glitches; transport propaga todos os eventos com atraso.

8. **Qual é a diferença entre function e procedure?**  
   Function retorna um valor e não consome tempo; procedure executa ações e pode consumir tempo.

9. **Para que serve um package?**  
   Agrupar functions, procedures, tipos, constantes e componentes reutilizáveis.

10. **O que é FLI?**  
    Interface de VHDL com linguagens externas, como C/C++.

11. **Para que serve TextIO?**  
    Ler e escrever dados em arquivos externos ou console.

12. **O que é CRV?**  
    Constraint Random Verification: geração randômica com restrições.

13. **Qual biblioteca VHDL pode apoiar randomização?**  
    OSVVM, com `RandomPType`.

14. **O que é self-checking testbench?**  
    Testbench que compara automaticamente a resposta observada com a esperada.

15. **O que é scoreboard?**  
    Estrutura que armazena estímulos, respostas esperadas e respostas observadas para comparação.

16. **Para que servem pragmas `translate_off` e `translate_on`?**  
    Isolar trechos de simulação para que não sejam considerados pela síntese/tradução.

17. **Como gerar clock em VHDL testbench?**  
    Com `clk <= not clk after half_period;` ou processo com `wait for`.

18. **Quais são os passos básicos de debug?**  
    Identificar mismatch, isolar fonte, achar causa raiz, corrigir, validar e retestar.

### Pegadinhas

- Testbench pode usar `wait for`; DUT sintetizável normalmente não.
- VHDL não usa `$display`; use `report`, `assert` ou `TextIO`.
- `assert` só reporta quando a condição é falsa.
- Function não pode ter `wait`; procedure pode.
- `inertial` é o delay padrão em VHDL.
- `transport` preserva glitches.
- Multiple drivers podem gerar confusão; prefira driver único.
- Randomização sem seed registrada dificulta debug.
- PASS/FAIL não mede coverage.
- Um bug pode estar no testbench, não no DUT.
- Dump FSDB em VHDL depende de pacote e ferramenta.
- File I/O pode facilitar regressão, mas pode deixar simulação mais lenta.

### Frases para memorizar

```text
DUT é o bloco testado; testbench é o ambiente de teste.
VHDL de verificação usa report, assert, TextIO e wait.
Self-checking testbench gera PASS/FAIL automaticamente.
Function calcula e retorna valor; procedure executa ações.
Inertial filtra glitches; transport propaga eventos.
Packages organizam código reutilizável.
FLI conecta VHDL a modelos externos.
Coverage mede quanto foi testado; PASS/FAIL mede se o teste passou.
```

---

## Relação com projeto/laboratório

Esta aula prepara a escrita e leitura de testbenches VHDL.

### Relação com simulação

Em um fluxo Synopsys, VHDL costuma ser analisado com:

```bash
vhdlan arquivo.vhd
```

Depois elaborado e executado com:

```bash
vcs top
./simv
```

Em designs mistos, VHDL pode coexistir com Verilog/SystemVerilog.

### Relação com waveform

Para gerar FSDB em VHDL, é comum usar pacotes específicos:

```vhdl
library novas;
use novas.fsdb_pkg.all;
```

E chamadas como:

```vhdl
fsdbDumpfile("test.fsdb");
fsdbDumpvars(0, "+all");
```

Depois, abre-se no Verdi.

### Relação com testbench de somador

Um bom testbench para o somador de 2 bits deve:

- testar todas as combinações de `x` e `y`;
- calcular expected com 3 bits;
- usar `assert`;
- reportar PASS/FAIL;
- gerar waveform se necessário.

Exemplo de loop completo:

```vhdl
process
  variable expected : unsigned(2 downto 0);
begin
  for a in 0 to 3 loop
    for b in 0 to 3 loop
      x <= to_unsigned(a, 2);
      y <= to_unsigned(b, 2);

      wait for 1 ns;

      expected := to_unsigned(a + b, 3);

      assert z = expected
        report "FAILED: x=" & integer'image(a) &
               " y=" & integer'image(b)
        severity error;
    end loop;
  end loop;

  report "Fim do teste";
  wait;
end process;
```

### Relação com próximos blocos

Os próximos reference designs em VHDL devem usar os mesmos princípios:

```text
entender o DUT
instanciar no testbench
gerar clock/reset
gerar estímulos
checar respostas
gerar log/waveform
debugar se falhar
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

**Bloco 009 — 04 VHDL Reference Designs**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\04 VHDL Reference Designs.docx
```

Faixa:

```text
Slides 1-15
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\04 VHDL Reference Designs.md
```
