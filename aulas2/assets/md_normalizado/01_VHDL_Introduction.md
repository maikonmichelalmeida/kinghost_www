# 01 VHDL Introduction

## Controle do bloco

- **Bloco:** 006
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\01 VHDL Introduction.docx`
- **Faixa de slides:** 1-13
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\01 VHDL Introduction.md`
- **Próximo bloco recomendado:** 007 — `02 VHDL for Synthesis`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula introduz VHDL no mesmo contexto em que Verilog foi apresentado: uma linguagem de descrição de hardware usada para modelar circuitos digitais em diferentes níveis de abstração. A aula começa revisando blocos lógicos, como portas, multiplexadores, registradores, contadores, memórias e máquinas de estados. Depois conecta esses blocos aos estilos de modelagem em VHDL: **behavioral**, **RTL** e **structural**.

A parte central do bloco é um guia de referência de VHDL: unidades de biblioteca, `entity`, `architecture`, `package`, `configuration`, tipos de dados, operadores, statements sequenciais, statements concorrentes, atributos predefinidos, tipos predefinidos, funções predefinidas e constructs não sintetizáveis.

O ponto mais importante para estudo é entender que VHDL é mais **fortemente tipado** e mais **verboso** que Verilog. Em troca, ele obriga o designer a declarar melhor interfaces, tipos e estruturas. Para síntese, o mesmo princípio continua valendo: nem tudo que simula vira hardware. O RTL sintetizável deve seguir templates claros de lógica combinacional, registradores, processos clockados e atribuições concorrentes.

---

## Texto extraído e organizado por slide

### Slide 1 — Review of Logic Blocks

Um **logic block** representa uma função lógica em que as saídas são geradas pela avaliação de um conjunto de entradas.

Circuitos digitais trabalham com blocos lógicos.

Tipos de blocos lógicos:

- **Combinational**
- **Sequential**

Exemplos de blocos lógicos:

- **Standard combinational logic gates**
  - AND
  - OR
  - NOT
  - XOR
  - NOR
  - NAND
  - XNOR
- **Standard sequential logic gates**
  - D FF
  - D-Latch
  - T FF
  - SR FF
  - etc.

Blocos lógicos podem ser definidos por:

- **truth table**
- **timing diagram**
- **logic function / Boolean equation**

Figuras do slide:

- portas combinacionais;
- elementos sequenciais;
- tabelas verdade;
- diagramas de tempo.

---

### Slide 2 — Basic Building Blocks of Digital Logic Blocks

Blocos básicos da lógica digital:

- standard logic gates;
- multiplexers/demultiplexers;
- encoders/decoders;
- sequential circuits;
- arithmetic logic circuits;
- timers and counters;
- FIFOs/register arrays and on-chip memories;
- finite state machines.

Interpretação:

VHDL pode modelar todos esses blocos. Um mux pode ser escrito com atribuição concorrente ou processo combinacional. Um registrador ou contador normalmente é escrito com processo sensível ao clock. Uma FSM combina registradores de estado com lógica combinacional de próximo estado e saída.

---

### Slide 3 — Design Abstractions and VHDL

A aula apresenta três níveis de modelagem.

#### Behavioral modeling

- Descreve um sistema por comportamento concorrente.
- As funções podem ser sequenciais ou concorrentes.
- Exemplos:
  - functions;
  - tasks;
  - always blocks.
- Blocos sequenciais geralmente são usados para simulação.
- Não é necessário conhecer a estrutura do design.
- É necessário fazer síntese para converter para uma descrição estrutural.
- Os constructs do modelo precisam ser sintetizáveis.

Observação: o slide parece reutilizar termos de Verilog, como `always blocks` e `tasks`. Em VHDL, os equivalentes mais próximos seriam `process`, `procedure` e `function`.

#### RTL level modeling

- RTL significa **Register-Transfer Level**.
- O design especifica as características do circuito por operações e transferência de dados entre registradores.
- Um sinal de clock é necessário para temporizar os eventos do modelo.
- O RTL contém limites temporais exatos, pois processos funcionais são agendados para ocorrer em certos tempos.
- Em resumo, um modelo sintetizável normalmente é modelado em nível RTL.

#### Structural modeling

- Modelado usando células lógicas e interconexões.
- Todos os sinais são discretos e assumem valores lógicos como:
  - `0`
  - `1`
  - `X`
  - `Z`
- A função do bloco é predefinida usando células lógicas básicas como AND, OR e NOT.
- Modelagem gate-level é difícil para circuitos complexos porque não é facilmente compreensível para humanos.
- A netlist gate-level é gerada por ferramentas de síntese e é o ponto inicial do physical design.

Mensagem do slide:

```text
VHDL supports all the three levels of modeling abstractions for the design.
```

Tradução:

```text
VHDL suporta os três níveis de abstração de modelagem para o design.
```

---

### Slide 4 — RTL Design

Pontos principais:

- Um design RTL modela blocos de dados que executam operações lógicas, aritméticas e de controle.
- O RTL representa fluxo de dados e armazenamento em registradores intermediários.
- O design é modelado usando HDL — Hardware Description Language.
- HDLs mais usadas:
  - Verilog;
  - SystemVerilog;
  - VHDL.
- O exemplo mostra o diagrama de bloco e modelos RTL de um multiplexador de 32 bits.

O slide mostra versões em:

- Verilog;
- SystemVerilog;
- VHDL.

Exemplo VHDL reconstruído do mux de 32 bits:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity mux is
  port (
    s : in  std_logic;
    x : in  std_logic_vector(31 downto 0);
    y : in  std_logic_vector(31 downto 0);
    z : out std_logic_vector(31 downto 0)
  );
end mux;

architecture rtl of mux is
begin
  z <= x when s = '0' else y;
end rtl;
```

Interpretação:

- `entity` define a interface externa do bloco.
- `architecture` define a implementação interna.
- A atribuição `z <= ...` é concorrente.
- O mux é combinacional: a saída depende diretamente de `s`, `x` e `y`.

---

### Slide 5 — VHDL Reference Guide: Library Units

O slide lista unidades fundamentais da linguagem VHDL.

Principais unidades:

- `entity`
- `architecture`
- `package`
- `package body`
- `configuration`

#### Estrutura de `entity`

Forma geral:

```vhdl
entity ID is
  generic (...);
  port (...);
  declarations
begin
  parallel_statements
end entity;
```

A `entity` descreve a interface do bloco: nome, generics, portas e declarações associadas.

#### Estrutura de `architecture`

Forma geral:

```vhdl
architecture ID of ENTITY_ID is
  declarations
begin
  parallel_statements
end architecture;
```

A `architecture` descreve o comportamento ou estrutura interna da entidade.

#### Estrutura de `package`

```vhdl
package ID is
  declarations
end package;
```

Um package agrupa declarações reutilizáveis, como tipos, constantes, funções e procedures.

#### Estrutura de `package body`

```vhdl
package body ID is
  declarations
end package body;
```

O package body contém implementações de funções/procedures declaradas no package.

#### Estrutura de `configuration`

O slide também mostra formas de `configuration`, usadas para associar entidades, arquiteturas e componentes.

Interpretação didática:

Em VHDL, a separação entre interface e implementação é explícita. A `entity` diz “o que entra e o que sai”. A `architecture` diz “como funciona”.

---

### Slide 6 — VHDL Reference Guide: Data Types and Subtypes

#### `bit` e `bit_vector`

- O tipo `bit` só pode assumir os valores `0` ou `1`.
- `bit_vector` é a versão vetorial de `bit`, composta por dois ou mais bits.

Exemplo:

```vhdl
signal a : bit;
signal bus : bit_vector(7 downto 0);
```

#### `std_logic` e `std_logic_vector`

- `std_logic` pode assumir valores como:
  - `X`
  - `0`
  - `1`
  - `Z`
- `std_logic_vector` é a versão vetorial de `std_logic`.

Exemplo:

```vhdl
signal clk  : std_logic;
signal data : std_logic_vector(7 downto 0);
```

#### Operadores VHDL

Operadores lógicos:

- `not`
- `and`
- `nand`
- `or`
- `nor`
- `xor`
- `xnor`

Operadores aritméticos:

- adição: `+`
- subtração: `-`
- multiplicação: `*`
- divisão: `/`
- valor absoluto: `abs`
- módulo: `mod`
- resto: `rem`
- expoente: `**`

Operadores relacionais:

- igual: `=`
- diferente: `/=`
- menor que: `<`
- maior que: `>`
- menor ou igual: `<=`
- maior ou igual: `>=`

Operadores de shift:

- shift left logical: `sll`
- shift right logical: `srl`
- shift left arithmetic: `sla`
- shift right arithmetic: `sra`
- rotate left: `rol`
- rotate right: `ror`

---

### Slide 7 — VHDL Reference Guide: Type and Other Declarations

O slide mostra formas gerais de declaração em VHDL.

Exemplos de declarações de tipo:

```vhdl
type ID is (...);
type ID is range number downto number;
type ID is array (range) of TYPEID;
type ID is record
  declarations
end record;
type ID is access TYPEID;
type ID is file of TYPEID;
```

Subtypes:

```vhdl
subtype ID is SCALARTYPE range range;
subtype ID is ARRAYTYPEID (range);
subtype ID is RESOLVTYPEID TYPEID;
```

Constantes, variáveis e sinais:

```vhdl
constant ID : TYPEID := expr;
variable ID : TYPEID := expr;
signal ID : TYPEID := expr;
```

Arquivos:

```vhdl
file ID : TYPEID is in | out string;
```

Alias e atributos:

```vhdl
alias ID is object;
attribute ID : TYPEID;
attribute ID of object is expr;
```

Componentes:

```vhdl
component ID is
  generic (...);
  port (...);
end component;
```

Procedures e functions:

```vhdl
procedure ID (...) is
begin
  sequential_statements
end procedure;

function ID (...) return TYPEID is
begin
  sequential_statements
end function;
```

Instanciação:

```vhdl
LABEL: COMPONENT
  generic map (...)
  port map (...);
```

Interpretação:

VHDL tem uma gramática rica e explícita. O designer declara tipos, sinais, componentes, procedures e functions com clareza. Isso torna o código mais verboso, mas também mais disciplinado.

---

### Slide 8 — VHDL Reference Guide: Expressions, Operators

O slide mostra a estrutura geral de expressões em VHDL e a precedência crescente dos operadores.

#### Expressões

Uma expressão pode envolver:

- relações;
- operadores lógicos;
- shifts;
- soma/subtração;
- multiplicação/divisão;
- exponenciação;
- primários, como literais, identificadores, chamadas de função e expressões entre parênteses.

#### Operadores em precedência crescente

Lista do slide:

```text
logop   and | or | xor | nand | nor | xnor
relop   = | /= | < | <= | > | >=
shop    sll | srl | sla | sra | rol | ror
addop   + | - | &
mulop   * | / | mod | rem
miscop  ** | abs | not
```

Interpretação:

A precedência define quais operações são avaliadas primeiro quando não há parênteses. Em código de hardware, usar parênteses explicitamente costuma ser mais seguro e mais legível.

Exemplo:

```vhdl
z <= (a and b) or c;
```

é mais claro que depender da precedência implícita.

---

### Slide 9 — VHDL Reference Guide: Sequential Statements

O slide lista statements sequenciais de VHDL.

Principais statements:

```vhdl
wait [on signal] [until expr] [for time];

assert expr
  [report string]
  [severity note | warning | error | failure];

signal <= transport | inertial expr after time;

variable := expr;

procedure_call(...);

if expr then
  sequential_statements
elsif expr then
  sequential_statements
else
  sequential_statements
end if;

case expr is
  when choice =>
    sequential_statements
end case;

while expr loop
  sequential_statements
end loop;

for ID in range loop
  sequential_statements
end loop;

next;
exit;
return;
null;
```

Interpretação:

Statements sequenciais aparecem dentro de regiões sequenciais, especialmente dentro de `process`, `procedure` e `function`. Isso não significa que VHDL é software sequencial. Significa que, dentro de um processo, o simulador executa statements em ordem, mas múltiplos processos e atribuições concorrentes existem em paralelo no hardware.

---

### Slide 10 — VHDL Reference Guide: Parallel Statements

O slide lista statements concorrentes/paralelos de VHDL.

Principais estruturas:

```vhdl
block
process
assert
concurrent signal assignment
component instantiation
entity instantiation
configuration
generate
```

Exemplo de `process` concorrente:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Exemplo de atribuição concorrente:

```vhdl
z <= x when s = '0' else y;
```

Exemplo de instanciação:

```vhdl
U1: entity work.mux
  port map (
    s => sel,
    x => a,
    y => b,
    z => out_sig
  );
```

Exemplo de `generate`:

```vhdl
gen_regs: for i in 0 to 7 generate
  q(i) <= d(i);
end generate;
```

Interpretação:

No nível da arquitetura, os statements são concorrentes. Assim como em Verilog, VHDL descreve hardware paralelo.

---

### Slide 11 — VHDL Reference Guide: Predefined Attributes

O slide lista atributos predefinidos de VHDL.

Atributos de tipo:

```vhdl
TYPEID'base
TYPEID'left
TYPEID'right
TYPEID'high
TYPEID'low
TYPEID'pos(expr)
TYPEID'val(expr)
TYPEID'succ(expr)
TYPEID'pred(expr)
TYPEID'leftof(expr)
TYPEID'rightof(expr)
TYPEID'ascending
TYPEID'image(expr)
TYPEID'value(string)
```

Atributos de array:

```vhdl
ARRAYID'left(expr)
ARRAYID'right(expr)
ARRAYID'high(expr)
ARRAYID'low(expr)
ARRAYID'range(expr)
ARRAYID'reverse_range(expr)
ARRAYID'length(expr)
ARRAYID'ascending(expr)
```

Atributos de sinal:

```vhdl
SIGNID'delayed[(time)]
SIGNID'stable[(time)]
SIGNID'quiet[(time)]
SIGNID'transaction
SIGNID'event
SIGNID'active
SIGNID'last_event
SIGNID'last_active
SIGNID'last_value
SIGNID'driving
SIGNID'driving_value
```

Atributos de objeto:

```vhdl
OBJID'simple_name
OBJID'instance_name
OBJID'path_name
```

Exemplos úteis:

```vhdl
if clk'event and clk = '1' then
  q <= d;
end if;
```

Forma moderna preferida:

```vhdl
if rising_edge(clk) then
  q <= d;
end if;
```

Uso de range:

```vhdl
for i in data'range loop
  result(i) <= not data(i);
end loop;
```

---

### Slide 12 — VHDL Reference Guide

#### Predefined types

Tipos predefinidos listados:

- `boolean`: `true` ou `false`
- `integer`: 32 ou 64 bits, dependendo da implementação
- `natural`: inteiros `>= 0`
- `positive`: inteiros `> 0`
- `real`: floating-point
- `bit`: `'0'` ou `'1'`
- `bit_vector`: array de bits
- `character`: 7-bit ASCII
- `string`: array de caracteres
- `time`: unidades como `fs`, `ps`, `ns`, `us`, `ms`, `sec`, `min`, `hr`
- `delay_length`: tempo `>= 0`

#### Predefined functions

Funções/rotinas predefinidas citadas:

```vhdl
now
deallocate
file_open
open
file_close
```

#### Lexical elements

O slide lista elementos léxicos, como:

- identificadores;
- literais decimais;
- literais baseados;
- bit string literal;
- comentários.

Exemplos:

```vhdl
-- Isto é um comentário

signal data_bus : std_logic_vector(7 downto 0);

constant WIDTH : integer := 8;
```

#### Legends

O slide mostra convenções usadas no guia:

```text
{} grouping
[] optional
{} repeated
| alternative
bold: VHDL-93 user identifier
italic: VHDL-1993
```

Observação: o slide possui uma área dizendo “Nets: continuously driven; Logic changes as driver changes”, que é uma formulação mais típica de Verilog. Em VHDL, a noção mais adequada é falar em `signal` e drivers concorrentes.

---

### Slide 13 — VHDL Nonsynthesizable Constructs

O slide lista constructs não sintetizáveis ou problemáticos para síntese.

#### Declarations and definitions

- `time`
- `event`, como dual-edge triggered clock, registers and counters
- net types como `triand`, `trior`, `tri0`, `tri1`, `trireg`
- ranges e arrays de integers
- primitive definitions

Observação: alguns termos nessa lista são de Verilog, provavelmente reaproveitados do material anterior. Para VHDL, o princípio correto é: constructs puramente de simulação, tempo absoluto e certos tipos abstratos não são sintetizáveis em RTL comum.

#### Statements

- initialization;
- delay statements;
- event control;
- wait statements;
- repeat statements.

#### Operators

- divisão e módulo por variáveis;
- case equality e inequality, como `===` e `!==`.

Observação: `===` e `!==` são operadores de Verilog, não VHDL. Em VHDL, igualdade é `=` e diferença é `/=`. O slide parece misturar conteúdo de Verilog. Para prova, reconheça a intenção: operadores e constructs não suportados diretamente por síntese devem ser evitados em RTL sintetizável.

#### Gate-level constructs

- pull up;
- pull down.

#### Other constructs

- compiler directives como:
  - `` `ifdef ``
  - `` `endif ``
  - `` `else ``
- hierarchical names in the module.

Novamente, esses exemplos são de Verilog. Em VHDL, constructs equivalentes de simulação/configuração precisam ser avaliados conforme a ferramenta.

Exemplos de snippets não sintetizáveis mostrados:

```vhdl
process
begin
  wait until rising_edge(clk);
  x <= a;
  wait until falling_edge(clk);
  x <= d;
end process;
```

Outro exemplo envolve `wait for 10 ns`, que é típico de testbench, não de RTL sintetizável.

Exemplo de loop fixo em processo clockado pode ser sintetizável se tiver limites estáticos, mas `wait` e delays temporais absolutos são geralmente de simulação.

---

## Aula didática desenvolvida

### 1. VHDL descreve hardware, não programa comum

Assim como Verilog, VHDL é uma HDL. Ela descreve circuitos.

Quando escrevemos:

```vhdl
z <= x and y;
```

não estamos escrevendo uma instrução para uma CPU executar em sequência. Estamos descrevendo uma relação concorrente entre sinais. Se `x` ou `y` mudam, `z` deve refletir a operação lógica.

A diferença para Verilog é que VHDL é mais explícito. Um bloco básico costuma ser dividido em:

```vhdl
entity      -- interface
architecture -- implementação
```

Exemplo:

```vhdl
entity and_gate is
  port (
    a : in  std_logic;
    b : in  std_logic;
    y : out std_logic
  );
end and_gate;

architecture rtl of and_gate is
begin
  y <= a and b;
end rtl;
```

A `entity` diz quais sinais entram e saem. A `architecture` diz como o bloco se comporta.

---

### 2. `entity` e `architecture`

Essa é a primeira grande diferença visual para quem vem de Verilog.

Em Verilog, normalmente tudo fica dentro de:

```verilog
module nome (...);
  ...
endmodule
```

Em VHDL, a interface e a implementação são separadas:

```vhdl
entity mux is
  port (...);
end mux;

architecture rtl of mux is
begin
  ...
end rtl;
```

Isso permite ter várias arquiteturas para a mesma entidade:

```vhdl
architecture behavioral of mux is
begin
  ...
end behavioral;

architecture structural of mux is
begin
  ...
end structural;
```

A mesma interface pode ter implementações diferentes.

---

### 3. Library e use

VHDL normalmente começa com cláusulas de biblioteca:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
```

Isso permite usar tipos como:

```vhdl
std_logic
std_logic_vector
```

Para aritmética com vetores, é comum usar:

```vhdl
use ieee.numeric_std.all;
```

Com `numeric_std`, podemos usar tipos como:

```vhdl
unsigned
signed
```

Exemplo:

```vhdl
signal a, b : unsigned(7 downto 0);
signal y    : unsigned(8 downto 0);

y <= ('0' & a) + ('0' & b);
```

Esse estilo deixa explícito que os vetores representam números sem sinal.

---

### 4. `bit` versus `std_logic`

O tipo `bit` só tem dois valores:

```vhdl
'0'
'1'
```

O tipo `std_logic` suporta mais estados, como:

```vhdl
'U'  -- uninitialized
'X'  -- forcing unknown
'0'
'1'
'Z'  -- high impedance
'W'  -- weak unknown
'L'  -- weak 0
'H'  -- weak 1
'-'  -- don't care
```

O slide simplifica para `X`, `0`, `1`, `Z`, mas na prática `std_logic` tem nove valores.

Por isso, em projetos reais, `std_logic` e `std_logic_vector` são muito mais comuns que `bit` e `bit_vector`.

---

### 5. `std_logic_vector` não é automaticamente número

Este é um ponto muito importante em VHDL.

Um vetor como:

```vhdl
signal data : std_logic_vector(7 downto 0);
```

é um conjunto de bits. Ele não é automaticamente um número com sinal ou sem sinal.

Para fazer aritmética corretamente, prefira:

```vhdl
signal a : unsigned(7 downto 0);
signal b : unsigned(7 downto 0);
signal y : unsigned(8 downto 0);
```

Ou converta explicitamente:

```vhdl
y <= std_logic_vector(unsigned(a) + unsigned(b));
```

VHDL força clareza de tipo. Isso evita ambiguidade, mas exige mais escrita.

---

### 6. Statements concorrentes versus sequenciais

Dentro de uma `architecture`, statements são concorrentes:

```vhdl
architecture rtl of example is
begin
  y1 <= a and b;
  y2 <= c or d;
end rtl;
```

Essas duas atribuições existem ao mesmo tempo.

Dentro de um `process`, statements são sequenciais:

```vhdl
process(a, b, sel)
begin
  if sel = '1' then
    y <= a;
  else
    y <= b;
  end if;
end process;
```

Mas atenção: o processo inteiro ainda é um statement concorrente dentro da arquitetura. Isso significa que múltiplos processos rodam em paralelo.

Resumo:

```text
Dentro da architecture: concorrente.
Dentro do process: sequencial.
O process como bloco: concorrente com outros processos.
```

---

### 7. Processo combinacional

Um mux combinacional pode ser escrito assim:

```vhdl
process(a, b, sel)
begin
  if sel = '0' then
    y <= a;
  else
    y <= b;
  end if;
end process;
```

A lista de sensibilidade precisa conter todos os sinais lidos:

```vhdl
a, b, sel
```

Em VHDL-2008, pode-se usar:

```vhdl
process(all)
begin
  ...
end process;
```

Isso reduz erro de esquecer sinal na sensibilidade.

Regra essencial:

```text
Em processo combinacional, toda saída deve receber valor em todos os caminhos.
```

Se não receber, a síntese pode inferir latch.

---

### 8. Processo sequencial clockado

Um registrador em VHDL:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Com reset assíncrono ativo baixo:

```vhdl
process(clk, reset_n)
begin
  if reset_n = '0' then
    q <= '0';
  elsif rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Com reset síncrono:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    if reset = '1' then
      q <= '0';
    else
      q <= d;
    end if;
  end if;
end process;
```

Diferença:

```text
Reset na lista de sensibilidade e testado antes do clock → assíncrono.
Reset testado dentro de rising_edge(clk) → síncrono.
```

---

### 9. Signal versus variable

Embora o slide cite `signal` e `variable`, vale aprofundar.

#### `signal`

Representa conexão ou registrador no hardware. A atribuição usa:

```vhdl
<=
```

Exemplo:

```vhdl
signal q : std_logic;
q <= d;
```

A atualização de signal ocorre conforme a semântica de simulação de VHDL, em delta cycles.

#### `variable`

Usada dentro de processos, procedures e functions. A atribuição usa:

```vhdl
:=
```

Exemplo:

```vhdl
process(a, b, c)
  variable temp : std_logic;
begin
  temp := a and b;
  y <= temp or c;
end process;
```

Variáveis atualizam imediatamente dentro do processo. São úteis para cálculos intermediários.

---

### 10. Delta cycle

VHDL usa um conceito chamado **delta cycle** para ordenar eventos que ocorrem no mesmo tempo físico de simulação.

Exemplo:

```vhdl
a <= b;
c <= a;
```

Se `a` e `c` são signals, `c` não recebe imediatamente o novo valor de `a` no mesmo instante lógico. Isso pode surpreender iniciantes.

Dentro de um processo, se precisar de atualização imediata para cálculo interno, use variable:

```vhdl
process(a, b)
  variable temp : std_logic;
begin
  temp := a and b;
  y <= temp;
end process;
```

Esse conceito é importante para simulação e debug.

---

### 11. `package`

Packages servem para agrupar declarações reutilizáveis.

Exemplo:

```vhdl
package robot_pkg is
  constant DATA_WIDTH : integer := 8;

  type state_t is (
    IDLE,
    LOAD,
    UNLOAD
  );
end package;
```

Uso:

```vhdl
library work;
use work.robot_pkg.all;
```

Isso evita repetir constantes, tipos e funções em muitos arquivos.

---

### 12. `generic`

Generics são parâmetros de entidade.

Exemplo:

```vhdl
entity mux is
  generic (
    WIDTH : integer := 32
  );
  port (
    s : in  std_logic;
    x : in  std_logic_vector(WIDTH-1 downto 0);
    y : in  std_logic_vector(WIDTH-1 downto 0);
    z : out std_logic_vector(WIDTH-1 downto 0)
  );
end mux;
```

Na instanciação:

```vhdl
U_MUX: entity work.mux
  generic map (
    WIDTH => 16
  )
  port map (
    s => sel,
    x => a,
    y => b,
    z => out_sig
  );
```

Generics tornam o design parametrizável.

---

### 13. `port map` e instanciação

Para conectar um componente ou entidade, usa-se `port map`.

Exemplo:

```vhdl
U1: entity work.and_gate
  port map (
    a => sig_a,
    b => sig_b,
    y => sig_y
  );
```

O lado esquerdo é a porta da entidade. O lado direito é o sinal local.

```text
porta_do_modulo => sinal_local
```

Isso é parecido com conexão nomeada em Verilog:

```verilog
.and_gate U1 (
  .a(sig_a),
  .b(sig_b),
  .y(sig_y)
);
```

---

### 14. Attributes

Atributos em VHDL fornecem informações sobre tipos, arrays, sinais e objetos.

Exemplo com range:

```vhdl
for i in data'range loop
  y(i) <= not data(i);
end loop;
```

Isso evita escrever índices fixos e torna o código mais genérico.

Exemplo com `length`:

```vhdl
constant WIDTH : integer := data'length;
```

Exemplo com evento de clock:

```vhdl
if clk'event and clk = '1' then
  q <= d;
end if;
```

Forma moderna preferida:

```vhdl
if rising_edge(clk) then
  q <= d;
end if;
```

---

### 15. Constructs não sintetizáveis

Assim como em Verilog, VHDL tem recursos excelentes para testbench, mas não para RTL sintetizável.

Exemplo de testbench:

```vhdl
process
begin
  a <= '0';
  wait for 10 ns;
  a <= '1';
  wait for 10 ns;
end process;
```

Isso controla tempo de simulação. Não deve ser usado como RTL de síntese.

Para RTL, use clock:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Regra prática:

```text
wait for 10 ns → testbench/simulação.
rising_edge(clk) → RTL sequencial sintetizável.
```

---

## Conceitos difíceis explicados em profundidade

### 1. Por que VHDL é fortemente tipado?

VHDL exige que tipos façam sentido. Isso impede muitas ambiguidades.

Exemplo problemático:

```vhdl
signal a, b : std_logic_vector(7 downto 0);
signal y    : std_logic_vector(7 downto 0);

y <= a + b;
```

Dependendo das bibliotecas, isso pode nem compilar, porque `std_logic_vector` não é explicitamente número.

Forma recomendada:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

signal a, b : unsigned(7 downto 0);
signal y    : unsigned(8 downto 0);

y <= ('0' & a) + ('0' & b);
```

A vantagem é que fica claro:

- `a` e `b` são números sem sinal;
- `y` tem um bit a mais para carry;
- a soma não perde overflow.

---

### 2. Behavioral, RTL e structural em VHDL

#### Behavioral

Foca em comportamento.

```vhdl
process
begin
  y <= '0';
  wait for 10 ns;
  y <= '1';
  wait;
end process;
```

Bom para testbench, mas não para síntese.

#### RTL

Foca em registradores e lógica entre registradores.

```vhdl
process(clk, reset_n)
begin
  if reset_n = '0' then
    q <= '0';
  elsif rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Bom para síntese.

#### Structural

Foca em instanciar blocos e conectá-los.

```vhdl
U1: entity work.and_gate
  port map (
    a => a_sig,
    b => b_sig,
    y => y_sig
  );
```

Usado para montar designs a partir de componentes.

---

### 3. Processo não é sempre registrador

Um `process` pode descrever lógica combinacional ou sequencial.

#### Combinacional

```vhdl
process(a, b, sel)
begin
  if sel = '1' then
    y <= a;
  else
    y <= b;
  end if;
end process;
```

Não há clock. É mux.

#### Sequencial

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Há clock. É flip-flop.

A diferença está na estrutura do processo, não apenas na palavra `process`.

---

### 4. `wait` em VHDL

`wait` pode ser usado em testbench:

```vhdl
wait for 10 ns;
```

Também pode aparecer em certas formas de processo, mas para RTL sintetizável o estilo preferido é usar lista de sensibilidade e `rising_edge`.

Exemplo de testbench:

```vhdl
process
begin
  clk <= '0';
  wait for 5 ns;
  clk <= '1';
  wait for 5 ns;
end process;
```

Clock generator de testbench:

```vhdl
clk <= not clk after 5 ns;
```

Esses constructs não devem ser confundidos com circuito físico.

---

### 5. Atribuição concorrente condicional

O mux do slide pode ser feito com:

```vhdl
z <= x when s = '0' else y;
```

Isso é uma atribuição concorrente condicional. Ela existe continuamente no hardware.

Equivale a pensar:

```text
se s = 0, z recebe x; senão, z recebe y.
```

Em hardware, isso vira um multiplexador.

---

### 6. `case` em VHDL

Dentro de processo:

```vhdl
process(sel, a, b, c, d)
begin
  case sel is
    when "00" =>
      y <= a;
    when "01" =>
      y <= b;
    when "10" =>
      y <= c;
    when others =>
      y <= d;
  end case;
end process;
```

`when others` é essencial para cobrir casos não listados, especialmente quando o tipo pode ter valores como `X`, `Z` ou combinações adicionais.

Para evitar latch:

```text
todos os caminhos devem atribuir y.
```

---

### 7. `if` e latch inferido

Exemplo ruim:

```vhdl
process(en, d)
begin
  if en = '1' then
    q <= d;
  end if;
end process;
```

Se `en = '0'`, `q` mantém valor anterior. Isso infere latch.

Correção combinacional:

```vhdl
process(en, d)
begin
  if en = '1' then
    q <= d;
  else
    q <= '0';
  end if;
end process;
```

Ou valor default:

```vhdl
process(en, d)
begin
  q <= '0';

  if en = '1' then
    q <= d;
  end if;
end process;
```

---

### 8. Loops sintetizáveis e não sintetizáveis

Um `for` com limites estáticos pode ser sintetizável:

```vhdl
process(a)
begin
  for i in a'range loop
    y(i) <= not a(i);
  end loop;
end process;
```

Isso vira hardware replicado, não um loop em tempo de execução.

Mas loops com espera temporal ou número indefinido de iterações podem ser apenas de simulação.

Exemplo de testbench:

```vhdl
while true loop
  clk <= not clk;
  wait for 5 ns;
end loop;
```

Isso gera clock na simulação, não hardware sintetizável.

---

### 9. Operadores de shift

Shift constante:

```vhdl
y <= x sll 2;
```

Pode virar apenas religação de fios.

Shift variável:

```vhdl
y <= x sll to_integer(shamt);
```

Pode virar um barrel shifter, que é maior e mais caro.

A mesma ideia já apareceu em Verilog: deslocamento constante é barato; deslocamento variável exige lógica adicional.

---

### 10. Atributos `range` e `reverse_range`

Eles tornam o código independente da direção do vetor.

Exemplo:

```vhdl
signal data : std_logic_vector(7 downto 0);
```

Loop seguro:

```vhdl
for i in data'range loop
  y(i) <= not data(i);
end loop;
```

Se amanhã o vetor for:

```vhdl
std_logic_vector(0 to 7)
```

o loop ainda funciona.

Esse é um dos pontos fortes de VHDL.

---

## Figuras, diagramas e waveforms importantes

### Figuras de blocos lógicos

As figuras de portas, flip-flops, tabelas verdade e timing diagrams reforçam que VHDL descreve blocos digitais reais, não apenas texto.

### Diagrama do mux de 32 bits

Mostra o mesmo bloco descrito em Verilog, SystemVerilog e VHDL. O ponto importante é perceber que a função é a mesma, mas a sintaxe VHDL separa `entity` e `architecture`.

### Tabelas de data types

A diferença entre `bit`, `bit_vector`, `std_logic` e `std_logic_vector` é central. Para projetos reais, `std_logic` é muito mais usado porque representa estados desconhecidos e alta impedância.

### Guia de library units

Mostra a estrutura formal da linguagem: `entity`, `architecture`, `package`, `configuration`. Essa parte é mais sintática, mas importante para ler códigos VHDL maiores.

### Statements sequenciais

Mostra o que pode aparecer dentro de processos e subprogramas: `if`, `case`, `loop`, `wait`, `assert`, `return`, `null`.

### Statements paralelos

Mostra o que aparece diretamente dentro da arquitetura: `process`, atribuições concorrentes, instâncias, `generate`.

### Atributos predefinidos

A tabela de atributos é útil como referência. Os mais importantes para começar são:

- `'event`
- `'range`
- `'length`
- `'left`
- `'right`
- `'high`
- `'low`

### Constructs não sintetizáveis

O último slide reforça a separação entre VHDL para simulação e VHDL para síntese. Delays temporais, `wait for`, certos usos de `wait` e inicializações livres são típicos de testbench.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Quais são os dois grandes tipos de blocos lógicos?**  
   Combinational e sequential.

2. **Quais são os três níveis de abstração suportados por VHDL?**  
   Behavioral, RTL e structural.

3. **O que é uma `entity` em VHDL?**  
   A definição da interface do bloco: portas, generics e declarações associadas.

4. **O que é uma `architecture` em VHDL?**  
   A implementação interna de uma entity.

5. **Qual é a diferença entre `bit` e `std_logic`?**  
   `bit` só tem `0` e `1`; `std_logic` suporta estados como `X`, `Z` e outros.

6. **Qual é a diferença entre `bit_vector` e `std_logic_vector`?**  
   São vetores dos respectivos tipos escalares.

7. **Quais operadores lógicos aparecem no guia?**  
   `not`, `and`, `nand`, `or`, `nor`, `xor`, `xnor`.

8. **Quais operadores relacionais aparecem no guia?**  
   `=`, `/=`, `<`, `>`, `<=`, `>=`.

9. **Quais operadores de shift aparecem no guia?**  
   `sll`, `srl`, `sla`, `sra`, `rol`, `ror`.

10. **Statements dentro de `process` são sequenciais ou concorrentes?**  
    Dentro do processo são sequenciais; o processo como um todo é concorrente com outros statements da arquitetura.

11. **Atribuições diretamente na architecture são sequenciais ou concorrentes?**  
    Concorrentes.

12. **Como se detecta borda de subida em VHDL moderno?**  
    `if rising_edge(clk) then`.

13. **Para que serve `when others` em `case`?**  
    Cobrir casos não explicitados e evitar comportamento incompleto/latch.

14. **O que é `signal'event`?**  
    Atributo que indica ocorrência de evento/mudança no signal.

15. **O que é `signal'range`?**  
    Atributo que retorna a faixa de índices do vetor.

16. **`wait for 10 ns` é típico de RTL sintetizável ou testbench?**  
    Testbench/simulação.

### Pegadinhas

- VHDL é concorrente no nível da arquitetura, mesmo que statements dentro do processo sejam sequenciais.
- `std_logic_vector` não deve ser tratado automaticamente como número; use `unsigned` ou `signed` com `numeric_std`.
- `process` sem clock pode ser combinacional.
- `process` com `rising_edge(clk)` normalmente infere flip-flop.
- Esquecer caminhos de atribuição em processo combinacional pode inferir latch.
- `wait for` é de simulação, não de RTL sintetizável comum.
- O slide mistura alguns termos de Verilog no último slide; entenda a intenção geral: constructs de simulação não são automaticamente sintetizáveis.
- `<=` em VHDL é atribuição de signal; `:=` é atribuição de variable.
- `when others` é importante em `case`.
- `rising_edge(clk)` é mais claro que `clk'event and clk = '1'`.

### Frases para memorizar

```text
Entity define a interface; architecture define a implementação.
VHDL suporta behavioral, RTL e structural modeling.
Architecture é concorrente; process contém statements sequenciais.
std_logic é mais usado que bit em projetos reais.
std_logic_vector é vetor de lógica, não número automaticamente.
rising_edge(clk) descreve lógica sequencial clockada.
wait for 10 ns pertence ao mundo de simulação/testbench.
```

---

## Relação com projeto/laboratório

Esta aula prepara a leitura de códigos VHDL em simulação e síntese.

### Relação com VCS/VHDL

Em fluxos Synopsys, arquivos VHDL normalmente passam por análise com ferramenta apropriada, como `vhdlan`, antes de elaboração com `vcs`.

Fluxo conceitual:

```text
vhdlan arquivos_vhdl
vcs top
./simv
```

Em design misto, pode haver Verilog/SystemVerilog e VHDL no mesmo ambiente.

### Relação com testbench

VHDL pode ser usado para escrever testbenches com:

```vhdl
wait for 10 ns;
assert ... report ... severity ...;
```

Exemplo:

```vhdl
assert y = expected
  report "Erro: saída diferente do esperado"
  severity error;
```

Isso é útil para self-checking testbench.

### Relação com síntese

Para RTL sintetizável, foque em templates claros:

#### Lógica combinacional

```vhdl
process(all)
begin
  y <= '0';

  if sel = '1' then
    y <= a;
  else
    y <= b;
  end if;
end process;
```

#### Registrador

```vhdl
process(clk, reset_n)
begin
  if reset_n = '0' then
    q <= '0';
  elsif rising_edge(clk) then
    q <= d;
  end if;
end process;
```

#### FSM

```vhdl
process(clk, reset_n)
begin
  if reset_n = '0' then
    state <= IDLE;
  elsif rising_edge(clk) then
    state <= next_state;
  end if;
end process;

process(all)
begin
  next_state <= state;

  case state is
    when IDLE =>
      if start = '1' then
        next_state <= RUN;
      end if;

    when RUN =>
      if done = '1' then
        next_state <= IDLE;
      end if;

    when others =>
      next_state <= IDLE;
  end case;
end process;
```

### Relação com debug

Ao debugar VHDL, observe:

- sinais não inicializados (`U`);
- sinais desconhecidos (`X`);
- lista de sensibilidade incompleta;
- diferença entre signal e variable;
- latches inferidos;
- vetores com direção `downto` ou `to`;
- conversões entre `std_logic_vector`, `unsigned` e `signed`.

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

**Bloco 007 — 02 VHDL for Synthesis**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\02 VHDL for Synthesis.docx
```

Faixa:

```text
Slides 1-14
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\02 VHDL for Synthesis.md
```
