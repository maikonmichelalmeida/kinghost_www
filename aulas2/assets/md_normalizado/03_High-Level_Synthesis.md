# 03 High-Level Synthesis

## Controle do bloco

- **Bloco:** 020
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\03 High-Level Synthesis.docx`
- **Faixa processada:** slides 1-12
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\03 High-Level Synthesis.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O roteiro indica este bloco como `020 — 03 High-Level Synthesis` e o próximo como `021 — 04 High-Level Synthesis (HLS) for Power Optimization`.
- **Próximo bloco recomendado:** 021 — `04 High-Level Synthesis (HLS) for Power Optimization`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco aprofunda **High-Level Synthesis (HLS)**, conectando linguagens de alto nível como C/C++ com a geração de RTL, e mostra como decisões de escalonamento, alocação de recursos, binding, estilo de código, arrays, loops e otimizações afetam área, desempenho e recursos de hardware.

---

## Resumo executivo

Esta aula introduz **High-Level Synthesis (HLS)**, uma forma de automação de projeto que transforma uma descrição de alto nível, normalmente escrita em C/C++, em uma implementação RTL. Diferente da síntese RTL tradicional, em que o designer já escreve registradores, FSMs e datapaths em HDL, o HLS parte de uma descrição mais algorítmica e decide automaticamente como transformar operações, variáveis, loops e funções em hardware.

A ideia central é:

```text
C/C++ ou descrição algorítmica
        ↓
High-Level Synthesis
        ↓
RTL com datapath e control path
        ↓
síntese lógica tradicional
        ↓
netlist / implementação física
```

A aula mostra que HLS oferece vantagens como:

```text
ciclo de projeto menor
exploração de espaço de estados
menos erros por reduzir processos manuais
otimização guiada por especificação em nível mais alto
```

Mas também deixa claro que o resultado depende muito do estilo de código. Em HLS, decisões aparentemente simples de software podem criar hardware muito diferente. O tamanho dos tipos de dados, o uso de funções, a estrutura de loops e a organização de arrays podem afetar diretamente:

```text
área
latência
throughput
número de ciclos
número de registradores
número de unidades funcionais
número de portas de memória
consumo de potência
```

Os principais passos de HLS apresentados são:

```text
Preprocessing
Scheduling
Resource Allocation
Binding
Data path and controller design
```

Depois, a aula aprofunda **operation scheduling**, com técnicas como:

```text
ASAP — As Soon As Possible
ALAP — As Late As Possible
List scheduling
Force Directed Scheduling (FDS)
Integer Linear Programming (ILP)
Iterative refinement
```

A parte final mostra técnicas de otimização:

```text
tree height reduction
constant propagation
constant folding
copy propagation
dead code elimination
common sub-expression elimination
variable renaming
operator strength reduction
model expansion
conditional expansion
loop expansion
```

O ponto mais importante do bloco é:

```text
Em HLS, escrever C/C++ não significa programar uma CPU.
O código é uma especificação que será transformada em hardware.
Por isso, tipos de dados, loops, funções e arrays precisam ser pensados como estruturas físicas.
```

---

## Texto extraído e organizado por slide

### Slide 1 — High-Level Synthesis: Introduction (1/2)

O slide apresenta as vantagens de design automation.

Pontos listados:

```text
Design automation provides great advantages in terms of:
- Shorter design cycle
- State space exploration
- Fewer errors because there are no manual processes
- Specification-driven optimization at higher abstraction
```

Tradução:

```text
A automação de projeto oferece grandes vantagens em termos de:
- ciclo de projeto mais curto;
- exploração de espaço de estados;
- menos erros, porque há menos processos manuais;
- otimização guiada por especificação em uma abstração mais alta.
```

O slide define HLS:

```text
High-level synthesis converts functions written in high-level programming languages
such as C/C++ to RTL level design.
```

Tradução:

```text
Síntese de alto nível converte funções escritas em linguagens de programação
de alto nível, como C/C++, em design no nível RTL.
```

A figura do slide é baseada no diagrama de abstrações, mostrando domínios:

```text
Structural
Behavioral
Physical
```

e níveis diferentes, indo de elementos físicos mais baixos até blocos, registradores, processadores, memórias, features e algoritmos.

Interpretação:

HLS trabalha em um nível mais alto de abstração. Em vez de o projetista escrever diretamente o RTL, com registradores, FSMs e sinais, ele descreve o comportamento algorítmico e a ferramenta gera uma arquitetura RTL.

A figura reforça a ideia de que, quanto mais longe do centro, maior é o nível de abstração. HLS fica mais próximo do domínio comportamental/algorítmico e depois desce para estruturas RTL.

---

### Slide 2 — High-Level Synthesis: Introduction (2/2)

O slide mostra um exemplo visual de transformação:

```text
C++ model for high-level behavior
        ↓ HLS
RTL model with datapath and control path
```

À esquerda, aparece um modelo C++ para comportamento de alto nível, relacionado a um exemplo de **bubble sort**. À direita, aparece um modelo RTL com:

```text
data path
control path
comparadores
muxes
saídas minimum/maximum
```

Interpretação:

O exemplo mostra que uma descrição de software, como um algoritmo de ordenação ou comparação, precisa virar hardware composto por:

```text
registradores
comparadores
muxes
unidades funcionais
controlador
sinais de controle
datapath
```

Em C/C++, um `if`, um `for` ou uma função parecem apenas estruturas de software. Em HLS, elas precisam ser mapeadas para hardware.

Exemplo conceitual:

```cpp
if (a < b) {
    min = a;
    max = b;
} else {
    min = b;
    max = a;
}
```

Pode virar:

```text
comparador a < b
mux para selecionar min
mux para selecionar max
sinais de controle
registradores, se necessário
```

Esse slide é central porque mostra a diferença entre:

```text
programa executando em processador
```

e:

```text
hardware dedicado gerado a partir de uma descrição algorítmica
```

---

### Slide 3 — High-Level Synthesis Steps (1/2)

O slide lista os principais passos do HLS.

#### 1. Preprocessing

Pontos listados:

```text
Intermediate representation control data flow graph (CDFG) constructions
Data dependency
Live variable analysis
Compiler optimization
```

Interpretação:

A ferramenta começa convertendo o código de alto nível em uma representação interna. Uma representação comum é o **CDFG — Control Data Flow Graph**.

O CDFG mostra:

```text
dependências de dados
dependências de controle
operações
ordem parcial entre operações
variáveis vivas
pontos de decisão
```

Isso permite à ferramenta entender o que pode ser executado em paralelo e o que precisa esperar por outro resultado.

#### 2. Scheduling

Ponto listado:

```text
Assign control step to operators of the input behavior.
```

Tradução:

```text
Atribui passos de controle aos operadores do comportamento de entrada.
```

Interpretação:

Scheduling decide em qual ciclo ou etapa de controle cada operação será executada.

Exemplo:

```text
ciclo 1: fazer a + b
ciclo 2: fazer resultado * c
ciclo 3: armazenar saída
```

ou, se houver recursos paralelos:

```text
ciclo 1: fazer a + b e c + d ao mesmo tempo
ciclo 2: multiplicar os resultados
```

#### 3. Resource Allocation

Ponto listado:

```text
Compute minimum number of functional units and registers.
```

Interpretação:

A ferramenta decide quantos recursos serão necessários:

```text
quantos somadores
quantos multiplicadores
quantos registradores
quantas memórias
quantos comparadores
```

Essa decisão impacta área, desempenho e potência.

#### 4. Binding

Pontos listados:

```text
Variables mapped to registers
Operations to functional units
Data transfers to interface units
Internal graph generation for variables and resources for optimization
```

Interpretação:

Binding é o processo de mapear operações e variáveis específicas para recursos físicos específicos.

Exemplo:

```text
operação add1 usa somador A
operação add2 usa somador A em outro ciclo
variável x fica no registrador R1
variável y fica no registrador R2
transferência de dados usa interface I1
```

#### 5. Data path and controller design

Ponto listado:

```text
Controller designed based on interaction of data processes and its elements.
```

Interpretação:

Depois de scheduling, allocation e binding, a ferramenta constrói:

```text
datapath
control path / controller / FSM
```

O datapath contém operações e armazenamento. O controlador gera sinais que dizem quando cada registrador carrega, qual mux seleciona qual entrada, quando cada unidade funcional opera, e quando cada interface é acessada.

---

### Slide 4 — High-Level Synthesis Steps (2/2)

O slide mostra graficamente o fluxo de HLS.

Fluxo visual:

```text
Input behavior
   ↓ Preprocessing
Control/data-flow representation
   ↓ Scheduling
Tabela de operações por clock cycle
   ↓ Resource allocation and binding
Resource map
   ↓ Datapath synthesis
Datapath
   ↓ Controller FSM generation
Controller + datapath
   ↓ HDL generation
RTL final
```

A figura mostra:

- um pequeno trecho de código;
- um grafo de comportamento;
- uma tabela de scheduling por clock cycle;
- um mapa de recursos, com recursos como adders, subtractors, multipliers;
- datapath synthesis;
- controller FSM generation;
- HDL generation.

Interpretação:

Esse slide conecta os nomes do slide anterior a um fluxo real. A ferramenta não pula diretamente de C++ para RTL. Ela passa por representações intermediárias.

O ponto mais importante é que o RTL final é composto por duas grandes partes:

```text
datapath
controller
```

#### Datapath

Executa as operações:

```text
somas
subtrações
multiplicações
comparações
muxes
registradores
memórias
```

#### Controller

Organiza quando cada coisa acontece:

```text
qual operação ocorre em cada ciclo
qual registrador recebe dado
qual mux seleciona qual entrada
qual estado da FSM está ativo
```

HLS automatiza a criação dessas duas partes a partir do comportamento de alto nível.

---

### Slide 5 — High-Level Synthesis: Operation Scheduling (1/2)

O slide apresenta técnicas de **scheduling**.

Título:

```text
Scheduling techniques
```

#### Unconstrained algorithms

O slide lista:

```text
As soon as possible (ASAP)
As late as possible (ALAP)
```

##### ASAP — As Soon As Possible

Pontos listados:

```text
Minimum latency scheduling
Uses topological sorting of sequencing graph
Gives optimal solution for scheduling problem
Schedules first node to last node until all nodes are complete
```

Interpretação:

ASAP agenda cada operação o mais cedo possível, respeitando dependências.

Exemplo:

```text
se b depende de a, b só pode acontecer depois de a.
se c não depende de a, c pode acontecer no mesmo ciclo de a.
```

ASAP tende a minimizar latência, mas pode exigir muitos recursos em paralelo.

##### ALAP — As Late As Possible

Pontos listados:

```text
Latency constrained scheduling
Uses reverse topological sorting of sequencing graph
If over constrained, solution may not exist
Schedule first last node and first node are scheduled
```

Interpretação:

ALAP agenda cada operação o mais tarde possível dentro de uma latência permitida.

Ele é útil para:

```text
avaliar mobilidade das operações
reduzir pressão de recursos
ajudar em force-directed scheduling
```

Se a latência imposta for muito apertada, talvez não exista solução.

#### Resource constrained algorithm

O slide lista:

```text
List scheduling
```

#### Time constrained

O slide lista:

```text
Force directed scheduling (FDS)
Integer linear programming (ILP)
Iterative refinement
```

Interpretação:

Quando há restrição de recursos ou de tempo, o problema de scheduling fica mais complexo. A ferramenta precisa decidir como equilibrar:

```text
latência
número de recursos
paralelismo
área
desempenho
```

---

### Slide 6 — High-Level Synthesis: Operation Scheduling (2/2)

O slide continua as técnicas de scheduling.

#### Resource constrained algorithm — List scheduling

Pontos listados:

```text
Minimizes latency if there is resource constraint (ML-RC)
Minimizes resource if there is latency constraint (MR-LC)
Exponential time to converge for solution
```

Interpretação:

List scheduling é usado quando há restrições de recursos, por exemplo:

```text
só existe 1 multiplicador
só existem 2 somadores
só é permitido usar 1 porta de memória por ciclo
```

A ferramenta agenda operações respeitando a quantidade de recursos disponíveis.

Duas visões importantes:

```text
ML-RC — Minimum Latency under Resource Constraint
MR-LC — Minimum Resource under Latency Constraint
```

Ou seja:

- dado um limite de recursos, minimize a latência;
- dada uma latência alvo, minimize recursos.

#### Time constrained

O slide lista:

```text
Force Directed Scheduling (FDS)
Integer Linear Programming (ILP)
Iterative refinement
```

##### FDS — Force Directed Scheduling

Busca distribuir operações ao longo do tempo para equilibrar uso de recursos.

##### ILP — Integer Linear Programming

O slide identifica como:

```text
Exact solution method
```

Interpretação:

ILP pode formular o scheduling como problema matemático de otimização. É exato, mas pode ser caro computacionalmente para problemas grandes.

##### Iterative refinement

A ferramenta melhora uma solução gradualmente, ajustando schedule e recursos até chegar a uma solução aceitável.

---

### Slide 7 — Coding Style and Synthesis (1/2)

O slide mostra como estilo de codificação afeta a síntese.

#### Data types

Pontos listados:

```text
Determines the area and performance
32-bit int data require 4 times the area of 8-bit int data
64-bit data might take multiple cycles to read data
Use exact data width to reduce area
```

Interpretação:

Em HLS, o tamanho dos tipos de dados vira largura de hardware.

Se você usa `int` de 32 bits onde 8 bits seriam suficientes, o HLS pode gerar:

```text
somadores de 32 bits
registradores de 32 bits
comparadores de 32 bits
muxes de 32 bits
barramentos de 32 bits
```

Isso aumenta área e pode piorar timing.

Regra prática:

```text
use a menor largura de dados que preserve a função correta.
```

Exemplo:

```cpp
uint8_t x;   // hardware de 8 bits
uint32_t y;  // hardware de 32 bits
uint64_t z;  // hardware de 64 bits
```

#### Functions

Pontos listados:

```text
Gets implemented as a separate module
Optimization is local to the function body
Input data types are propagated, and data path width and output might not need that precision
of input data propagated. Specify exact input data width
```

Interpretação:

Funções em C/C++ podem virar módulos ou blocos separados no hardware gerado.

Se uma função recebe tipos muito largos, essa largura pode se propagar para o datapath, mesmo quando a saída não precisa de tanta precisão.

Exemplo:

```cpp
int f(int a, int b) {
    return a + b;
}
```

Pode gerar um somador de 32 bits.

Se o domínio real é pequeno:

```cpp
uint8_t f(uint8_t a, uint8_t b) {
    return a + b;
}
```

o hardware pode ser muito menor.

---

### Slide 8 — Coding Style and Synthesis (2/2)

O slide trata de loops.

Pontos listados:

```text
Loops
- Partially or fully unrolled
- Pipelined
```

A figura mostra:

```text
for loop
pipelined loop
loop unrolling
```

Código visual aproximado:

```cpp
for (int i = 1; i < 10; i++) {
    z[i] = var1[i] + var2[i];
}
```

#### Loops aninhados

O slide diz:

```text
Nested loops to be mapped per the performance
```

Pontos listados:

```text
Pipelining innermost loop gives optimal hardware with reasonable performance
Pipelining upper levels of loops with unrolled inner loops uses more operations per cycle
Pipelining inner loops are best tradeoff for optimal hardware and performance
```

Interpretação:

Loops são uma das partes mais críticas de HLS. Um loop pode virar:

```text
hardware reutilizado ciclo após ciclo
```

ou:

```text
várias cópias paralelas de hardware
```

dependendo de unrolling e pipelining.

#### Loop unrolling

Unrolling replica o corpo do loop para executar múltiplas iterações em paralelo.

Exemplo:

```cpp
for (int i = 0; i < 4; i++) {
    y[i] = a[i] + b[i];
}
```

Unrolled:

```cpp
y[0] = a[0] + b[0];
y[1] = a[1] + b[1];
y[2] = a[2] + b[2];
y[3] = a[3] + b[3];
```

Isso pode gerar 4 somadores em paralelo.

#### Loop pipelining

Pipelining permite iniciar uma nova iteração antes de a anterior terminar.

Exemplo mental:

```text
ciclo 1: começa iteração 0
ciclo 2: começa iteração 1 enquanto iteração 0 avança
ciclo 3: começa iteração 2 enquanto iterações anteriores avançam
```

Isso melhora throughput sem necessariamente replicar tudo como no unrolling completo.

#### Parallel loops

O slide diz:

```text
Parallel loops can be sequential or parallel as function depending on the performance requirement.
```

Interpretação:

Loops independentes podem ser implementados sequencialmente para economizar recursos ou em paralelo para aumentar desempenho.

---

### Slide 9 — Arrays

O slide aprofunda arrays em HLS.

Pontos listados:

```text
Arrays are implemented as memories: RAM/ROM.
Access to arrays might create performance bottleneck.
Might result in mapping large arrays as a register bank which might not be desirable.
Need multiple cycles to read data.
Parallel access to array elements requires different ports.
Memories have fixed number of access ports, typically one or two ports.
Access of memory elements depends on the number of ports the memory has.
Memory organization is critical for reducing the access times depending on the design needs.
Input arrays assume memories to be outside the block.
Number of parallel access decides the number of memory ports.
Arrays or memories need not be initialized unless required by the design.
Read only arrays map to ROM.
Read data once, store locally, and reuse them, if possible, per the design.
```

Interpretação:

Arrays em C/C++ parecem simples, mas em HLS eles viram estruturas de armazenamento físico:

```text
RAM
ROM
register bank
memória externa
```

O gargalo principal é acesso.

Uma memória típica tem poucas portas:

```text
1 porta
2 portas
```

Se o algoritmo tenta ler muitos elementos do array no mesmo ciclo, a ferramenta precisa resolver o conflito.

Opções possíveis:

```text
serializar acessos em múltiplos ciclos
criar mais bancos de memória
particionar array
duplicar memória
mapear para registradores
aumentar portas, se a tecnologia permitir
```

Exemplo:

```cpp
y = a[i] + a[j] + a[k] + a[m];
```

Se `a` está em uma RAM de 1 porta, não é possível ler 4 elementos no mesmo ciclo. Isso pode exigir 4 ciclos ou reorganização da memória.

A recomendação do slide:

```text
Read data once, store locally, and reuse them.
```

Ou seja, se o dado será usado várias vezes, leia uma vez da memória e guarde em registradores locais para reduzir acessos repetidos.

---

### Slide 10 — Optimization Techniques (1/3)

O slide apresenta **data path optimization**.

#### Tree height reduction

Pontos listados:

```text
Process of splitting large arithmetic expression into smaller arithmetic statements
to reduce the number of cycles it takes to execute.

In the example shown, the expression is split into two operand adders which can exploit
the arithmetic resource well.
```

Exemplo visual aproximado:

```text
x = a + b + c + d
Rewritten as:
x = a + b;
y = c + d;
z = x + y;
```

O slide também diz:

```text
Good to balance the arithmetic tree expression to exploit parallel operations
and optimum resource utilization with improved performance.
```

E:

```text
Tree height reduction exploits some of the arithmetic properties such as
commutativity, associativity, and distributivity.
```

Exemplo textual do slide:

```text
f = a (b*c*d + e) = a*b*c*d + a*e
```

Interpretação:

Tree height reduction reduz a profundidade da árvore aritmética.

Exemplo ruim, em cadeia:

```text
((((a + b) + c) + d) + e)
```

A profundidade é grande, pois cada soma depende da anterior.

Exemplo balanceado:

```text
s1 = a + b
s2 = c + d
s3 = s1 + s2
out = s3 + e
```

Isso permite mais paralelismo e pode reduzir latência.

A figura do slide mostra uma árvore aritmética mais profunda sendo transformada em uma árvore mais balanceada.

---

### Slide 11 — Optimization Techniques (2/3)

O slide lista várias otimizações.

#### Constant propagation and constant folding

Pontos listados:

```text
Detecting constant operands in the expression and precomputing the values
of the variable with that operand.

Reduces computation time and resource utilization.
```

Interpretação:

Se uma expressão usa constantes, a ferramenta pode calcular partes em tempo de compilação.

Exemplo:

```cpp
x = y * 4;
```

Pode virar deslocamento:

```text
x = y << 2
```

Ou:

```cpp
x = 3 + 5 + y;
```

pode virar:

```cpp
x = 8 + y;
```

#### Value propagation / copy propagation and dead code deletion

Ponto listado:

```text
Reduced register usage resulting in resource optimization.
```

Exemplo visual do slide:

```text
a = x;
b = a + y;
Rewritten as:
b = x + y;
```

Interpretação:

Se `a` é apenas cópia de `x`, a ferramenta pode eliminar `a` e usar `x` diretamente.

Isso reduz registradores e conexões.

#### Common sub-expression elimination

Texto:

```text
Common sub-expression elimination reduces time and resource utilization.
```

Exemplo visual aproximado:

```text
a = x + y;
b = a + c;
z = y + x;

Rewritten as:
z = a;
```

Interpretação:

Se a mesma expressão aparece mais de uma vez, a ferramenta pode calcular uma vez e reutilizar.

Exemplo:

```cpp
t1 = a + b;
t2 = a + b;
```

Pode virar:

```cpp
t1 = a + b;
t2 = t1;
```

#### Variable renaming

Texto:

```text
Variable renaming; in the example shown statement for z is rewritten in terms of a
instead of y and x.

Reduced computation time.
```

Interpretação:

A ferramenta reescreve variáveis para reutilizar resultados existentes e reduzir operações.

#### Dead code elimination

Texto:

```text
Dead code elimination is identifying statements which are not used and removing them.
```

Interpretação:

Se um cálculo não afeta nenhuma saída, ele pode ser removido.

Exemplo:

```cpp
temp = a + b; // temp nunca usado
y = c + d;
```

`temp` pode ser eliminado.

#### Operator strength reduction

Texto:

```text
Operator strength reduction: multiplier reduced to addition in the example.
Useful in loop mapping to hardware.
Multiplication by 2 can be replaced by left shift and division by 2 by right shift.
```

Interpretação:

Operator strength reduction troca operações caras por operações mais baratas.

Exemplos:

```text
x * 2  → x << 1
x / 2  → x >> 1
x * 3  → (x << 1) + x
```

Multiplicadores são caros em área e timing. Deslocamentos e somas podem ser mais baratos.

---

### Slide 12 — Optimization Techniques (3/3)

O slide apresenta **control path optimization**.

#### Model expansion

Texto:

```text
Model expansion when instead of calling a function use function body.
```

Interpretação:

Em vez de manter uma chamada de função separada, a ferramenta pode expandir o corpo da função no ponto de chamada.

Isso é semelhante a **function inlining**.

Exemplo:

```cpp
y = f(a);
```

Se:

```cpp
f(a) = a + 1;
```

pode virar:

```cpp
y = a + 1;
```

Isso pode permitir mais otimização, mas também pode aumentar área se a função for expandida muitas vezes.

#### Conditional expansion

Texto:

```text
Conditional expansion is exploring possibility of replacing if-else statements
with simple arithmetic statements.
```

Exemplo visual aproximado:

```cpp
y = a*b;
if (a)
    x = b*c;
else
    x = d*e;
```

O slide mostra que pode ser escrito como uma forma aritmética equivalente, por exemplo:

```text
x = a*b*c + ~a*d*e
```

Interpretação:

A ideia é transformar controle em datapath, reduzindo ou simplificando lógica de controle.

Em hardware, `if-else` frequentemente vira mux. Às vezes, reescrever a condição pode permitir otimização aritmética ou paralelismo.

#### Loop expansion

O slide mostra:

```cpp
x = 0;
for (i = 0; i < 2; i++) {
    z[i] = a[i];
}
```

Pode ser escrito como:

```cpp
z[0] = a[0];
z[1] = a[1];
```

Interpretação:

Loop expansion é semelhante a unrolling: expande iterações explicitamente.

Vantagens:

```text
mais paralelismo
menos overhead de controle
mais oportunidade de otimização
```

Custo:

```text
mais área
mais recursos
```

O slide fecha com:

```text
Many loop transformation techniques are used for RTL optimization
which is active area of research.
```

Tradução:

```text
Muitas técnicas de transformação de loops são usadas para otimização RTL,
e isso é uma área ativa de pesquisa.
```

Interpretação:

Loops são tão importantes em HLS que existe uma grande área de estudo sobre como transformá-los para melhorar hardware.

---

## Aula didática desenvolvida

### 1. O que realmente é HLS?

HLS é uma etapa acima da síntese RTL tradicional.

Na síntese RTL tradicional, você escreve algo como:

```systemverilog
always_ff @(posedge clk) begin
  if (!rst_n)
    acc <= 0;
  else
    acc <= acc + data;
end
```

Aqui você já decidiu:

```text
existe um registrador acc
ele atualiza na borda de clock
existe um somador
há um reset
```

Em HLS, você pode escrever algo mais algorítmico:

```cpp
for (int i = 0; i < N; i++) {
    acc += data[i];
}
```

A ferramenta precisa decidir:

```text
quantos somadores usar
quantos ciclos usar
se o loop será pipeline
se haverá unroll
onde colocar registradores
como organizar memória
como criar FSM de controle
```

Então HLS não elimina a necessidade de entender hardware. Ele muda o nível em que você descreve o hardware.

---

### 2. HLS não é compilar software normal

Quando C/C++ é compilado para software, o código vira instruções que rodam em uma CPU.

Quando C/C++ é usado em HLS, o código vira hardware dedicado.

Exemplo:

```cpp
z = a + b;
```

Em software:

```text
instrução de soma executada por uma ALU da CPU
```

Em HLS:

```text
pode virar um somador físico dedicado no datapath
```

Exemplo:

```cpp
for (int i = 0; i < 4; i++) {
    y[i] = a[i] + b[i];
}
```

Em software:

```text
uma instrução de soma é executada várias vezes
```

Em HLS, dependendo das diretivas:

```text
pode virar 1 somador reutilizado por 4 ciclos
ou 4 somadores em paralelo
ou pipeline com throughput de 1 soma por ciclo
```

Essa é a diferença fundamental.

---

### 3. CDFG — Control Data Flow Graph

No preprocessing, a ferramenta constrói uma representação intermediária como CDFG.

O CDFG combina:

#### Data flow

Mostra dependências de dados.

Exemplo:

```cpp
x = a + b;
y = x * c;
```

`y` depende de `x`, então a multiplicação só pode acontecer depois da soma.

#### Control flow

Mostra decisões e caminhos.

Exemplo:

```cpp
if (sel)
    y = a;
else
    y = b;
```

A ferramenta precisa representar a condição `sel` e os caminhos possíveis.

O CDFG ajuda o HLS a decidir:

```text
o que pode rodar em paralelo
o que precisa ser sequencial
quais variáveis precisam ser registradas
quais operações são mutuamente exclusivas
```

---

### 4. Scheduling é uma das decisões mais importantes

Scheduling decide quando cada operação acontece.

Exemplo:

```cpp
x = a + b;
y = c + d;
z = x * y;
```

Como `x` e `y` são independentes, as duas somas podem ocorrer no mesmo ciclo se houver dois somadores.

Schedule com dois somadores:

```text
ciclo 1: x = a + b; y = c + d
ciclo 2: z = x * y
```

Schedule com um somador:

```text
ciclo 1: x = a + b
ciclo 2: y = c + d
ciclo 3: z = x * y
```

Mesma função. Hardware diferente.

---

### 5. Resource allocation: desempenho versus área

Se você aloca mais recursos, ganha paralelismo.

Exemplo:

```text
4 somadores → mais paralelo, menor latência, mais área
1 somador  → menos área, maior latência
```

A ferramenta faz essa escolha com base em constraints e diretivas.

Essa é a essência do tradeoff em HLS:

```text
mais recursos → mais desempenho
menos recursos → menor área/potência
```

---

### 6. Binding: compartilhar recursos ou duplicar?

Binding decide qual operação usa qual unidade funcional.

Exemplo:

```text
op1 = a + b
op2 = c + d
```

Se op1 e op2 ocorrem em ciclos diferentes, podem compartilhar o mesmo somador:

```text
somador A faz op1 no ciclo 1
somador A faz op2 no ciclo 2
```

Se precisam ocorrer no mesmo ciclo, precisam de dois somadores:

```text
somador A faz op1
somador B faz op2
```

Binding transforma decisões abstratas em hardware concreto.

---

### 7. Controller e datapath

A saída do HLS normalmente tem duas grandes partes.

#### Datapath

Contém:

```text
somadores
multiplicadores
comparadores
muxes
registradores
memórias
barramentos
```

#### Controller

Contém:

```text
FSM
sinais de enable
sinais de select
controle de leitura/escrita
controle de estado
```

Exemplo:

```text
estado S0: carregar entradas
estado S1: somar
estado S2: multiplicar
estado S3: gravar saída
```

O controller organiza o uso do datapath ao longo do tempo.

---

### 8. ASAP e ALAP de forma intuitiva

Imagine operações:

```text
A e B não dependem de ninguém
C depende de A
D depende de B
E depende de C e D
```

#### ASAP

Agenda tudo o mais cedo possível:

```text
ciclo 1: A, B
ciclo 2: C, D
ciclo 3: E
```

Minimiza latência, mas usa paralelismo.

#### ALAP

Dado um prazo, agenda o mais tarde possível.

Se o prazo é ciclo 5:

```text
ciclo 3: A, B
ciclo 4: C, D
ciclo 5: E
```

ALAP ajuda a descobrir mobilidade:

```text
uma operação pode se mover entre quais ciclos sem quebrar prazo?
```

Essa mobilidade é usada por algoritmos mais sofisticados.

---

### 9. List scheduling

List scheduling é usado quando há recursos limitados.

Exemplo:

```text
há 10 operações de soma
mas só 1 somador disponível
```

A ferramenta mantém uma lista de operações prontas e escolhe quais executar em cada ciclo.

Critérios possíveis:

```text
caminho crítico
prioridade
mobilidade
dependências
recursos disponíveis
```

Ele tenta minimizar latência respeitando os recursos, ou minimizar recursos respeitando a latência.

---

### 10. FDS, ILP e iterative refinement

#### FDS — Force Directed Scheduling

Busca distribuir operações ao longo dos ciclos para reduzir picos de uso de recursos.

Exemplo:

```text
não colocar todas as multiplicações no mesmo ciclo se isso exige muitos multiplicadores
```

#### ILP — Integer Linear Programming

Formula o problema de scheduling como otimização matemática.

Vantagem:

```text
pode encontrar solução ótima/exata
```

Desvantagem:

```text
pode ser caro computacionalmente
```

#### Iterative refinement

Começa com uma solução e melhora aos poucos.

É útil quando soluções exatas são caras demais para designs grandes.

---

### 11. Tipos de dados: uma das maiores fontes de desperdício em HLS

Em software, usar `int` por padrão é comum.

Em hardware, isso pode custar caro.

Exemplo:

```cpp
int a, b, c;
c = a + b;
```

Se `int` é 32 bits, o HLS pode gerar um somador de 32 bits.

Mas se os valores reais são de 0 a 255:

```cpp
uint8_t a, b;
uint9_t c;
```

O hardware é muito menor.

Regra:

```text
use largura exata.
```

Se soma dois valores de 8 bits, o resultado pode precisar de 9 bits.

```text
255 + 255 = 510
510 precisa de 9 bits
```

Então usar 8 bits no resultado pode causar truncamento; usar 32 bits pode desperdiçar área.

---

### 12. Funções em HLS

Uma função pode virar:

```text
módulo separado
lógica inline
bloco compartilhado
datapath local
```

O slide diz que funções podem ser implementadas como módulos separados e que a otimização é local ao corpo da função.

Isso significa que funções ajudam organização, mas também podem limitar otimização global se a ferramenta mantiver fronteiras rígidas.

Exemplo:

```cpp
int f(int a, int b) {
    return a + b;
}
```

Se chamada várias vezes, a ferramenta pode:

```text
criar um módulo f compartilhado
duplicar hardware
fazer inline
```

dependendo das opções.

---

### 13. Loops: onde HLS ganha ou perde desempenho

Loops são centrais em algoritmos.

Um loop pode ser implementado de forma:

#### Sequencial

```text
uma iteração por vez
menos hardware
mais ciclos
```

#### Unrolled

```text
várias iterações em paralelo
mais hardware
menos ciclos
```

#### Pipelined

```text
iterações sobrepostas
bom throughput
área intermediária
```

Exemplo:

```cpp
for (int i = 0; i < 4; i++) {
    y[i] = a[i] + b[i];
}
```

Sequencial:

```text
1 somador
4 ciclos
```

Unrolled:

```text
4 somadores
1 ciclo
```

Pipelined:

```text
1 ou mais somadores
nova iteração por ciclo, dependendo do pipeline
```

---

### 14. Arrays e portas de memória

Arrays viram memórias.

Memórias têm número limitado de portas.

Se o loop precisa acessar muitos elementos por ciclo, há gargalo.

Exemplo:

```cpp
for (int i = 0; i < N; i++) {
    y[i] = a[i] + b[i];
}
```

Para executar uma iteração por ciclo, precisa ler:

```text
a[i]
b[i]
```

e escrever:

```text
y[i]
```

Se `a`, `b` e `y` são memórias separadas, pode ser tranquilo.

Mas se todos estão na mesma memória de 1 porta, há conflito.

Por isso organização de arrays é crucial.

Técnicas possíveis:

```text
array partitioning
array banking
local buffering
read once and reuse
mapear read-only para ROM
evitar inicialização desnecessária
```

---

### 15. Tree height reduction em hardware

Considere:

```cpp
y = a + b + c + d;
```

Implementação em cadeia:

```text
s1 = a + b
s2 = s1 + c
y  = s2 + d
```

Profundidade: 3 somadores em série.

Implementação balanceada:

```text
s1 = a + b
s2 = c + d
y  = s1 + s2
```

Profundidade: 2 níveis de somadores.

Isso melhora timing, pois reduz o caminho crítico.

Custo possível:

```text
pode exigir mais somadores em paralelo
```

---

### 16. Constant folding e constant propagation

Se uma expressão tem constantes, calcule antes.

Exemplo:

```cpp
x = y + 3 + 5;
```

vira:

```cpp
x = y + 8;
```

Se uma variável é constante:

```cpp
const int K = 4;
x = y * K;
```

pode virar:

```cpp
x = y << 2;
```

Menos hardware, menos atraso.

---

### 17. Copy propagation e dead code elimination

Copy propagation:

```cpp
a = x;
b = a + y;
```

vira:

```cpp
b = x + y;
```

Remove registrador/intermediário desnecessário.

Dead code elimination:

```cpp
t = a + b;  // nunca usado
y = c + d;
```

`t` é removido.

Isso reduz recursos e simplifica datapath.

---

### 18. Common sub-expression elimination

Se duas expressões são iguais, calcule uma vez.

Exemplo:

```cpp
x = a + b;
y = (a + b) * c;
```

vira:

```cpp
x = a + b;
y = x * c;
```

Isso pode reduzir operadores.

Cuidado: dependendo do scheduling, compartilhar uma expressão pode economizar área, mas também pode criar dependência ou gargalo. A ferramenta avalia tradeoff.

---

### 19. Operator strength reduction

Multiplicação é mais cara que soma ou shift.

Exemplos:

```text
x * 2 → x << 1
x / 2 → x >> 1
x * 4 → x << 2
x * 3 → (x << 1) + x
```

Isso reduz área e pode melhorar timing.

É especialmente útil dentro de loops, onde uma operação cara seria repetida muitas vezes.

---

### 20. Otimizações de controle

#### Model expansion

Expande função no ponto de chamada.

Pode permitir otimizações locais.

#### Conditional expansion

Transforma controle em expressões aritméticas ou lógicas.

Pode reduzir FSM ou simplificar muxes.

#### Loop expansion

Expande iterações de loop.

Pode remover overhead de controle e aumentar paralelismo.

Essas otimizações mostram que HLS não trabalha apenas no datapath. Ele também transforma o **control path**.

---

## Conceitos difíceis explicados em profundidade

### 1. Latency versus throughput

#### Latency

Tempo total para uma entrada produzir uma saída.

Exemplo:

```text
entrada no ciclo 0
saída no ciclo 5
latência = 5 ciclos
```

#### Throughput

Taxa de produção de resultados.

Exemplo:

```text
pipeline aceita nova entrada a cada ciclo
throughput = 1 resultado por ciclo após encher pipeline
```

Um design pode ter latência alta, mas throughput alto se for pipeline.

---

### 2. Pipelining versus unrolling

#### Pipelining

Sobrepõe execuções no tempo.

```text
menos duplicação total
melhor throughput
latência pode continuar existindo
```

#### Unrolling

Duplica operações no espaço.

```text
mais paralelismo imediato
menos ciclos
mais área
```

Combinações são comuns:

```text
unroll parcial + pipeline
```

---

### 3. Resource sharing

Resource sharing é reutilizar a mesma unidade funcional em ciclos diferentes.

Exemplo:

```text
um somador faz op1 no ciclo 1 e op2 no ciclo 2
```

Vantagem:

```text
menor área
```

Desvantagem:

```text
mais ciclos ou menor paralelismo
```

HLS decide isso em allocation/binding.

---

### 4. Dependência de dados

Uma operação depende de outra quando precisa do resultado dela.

Exemplo:

```cpp
x = a + b;
y = x * c;
```

A multiplicação depende da soma.

Dependências limitam paralelismo.

Outro exemplo:

```cpp
a[i] = a[i-1] + b[i];
```

Este loop tem dependência entre iterações, o que dificulta pipelining agressivo.

---

### 5. Dependência de memória

Arrays podem criar dependências difíceis.

Exemplo:

```cpp
A[i] = A[i] + 1;
```

Há leitura e escrita no mesmo array.

Se não for claro que índices são diferentes, a ferramenta pode ser conservadora e impedir paralelismo.

Por isso, organizar arrays e índices de forma clara ajuda HLS.

---

### 6. Read-only arrays como ROM

Se um array nunca é escrito, apenas lido, ele pode ser mapeado para ROM.

Exemplo:

```cpp
const int table[256] = {...};
```

Pode virar:

```text
ROM / lookup table
```

Isso é útil para coeficientes, tabelas de senos, filtros, correções e decodificadores.

---

### 7. Por que inicialização de arrays pode custar caro?

O slide diz:

```text
Arrays or memories need not be initialized unless required by the design.
```

Se você inicializa uma memória grande, o hardware precisa de algum mecanismo para isso:

```text
reset escrevendo todas as posições
conteúdo inicial de ROM
lógica extra de inicialização
arquivo de memória
```

Se o design não precisa de valores iniciais definidos, inicializar pode desperdiçar recursos ou tempo de reset.

---

### 8. Função como módulo separado pode limitar otimização

Se uma função vira módulo separado, a ferramenta pode otimizar internamente essa função, mas talvez tenha menos liberdade para otimizar através da fronteira.

Exemplo:

```cpp
z = f(a, b) + c;
```

Se `f` é mantida separada, a otimização de `f` é local.

Se `f` é expandida, a ferramenta pode simplificar:

```text
f(a,b) + c
```

junto com o restante.

Tradeoff:

```text
módulo separado → reuso e organização
inline/expansão → mais otimização global, possivelmente mais área
```

---

### 9. Control path versus data path

#### Data path

Faz cálculo.

```text
somadores, multiplicadores, comparadores, muxes, registradores
```

#### Control path

Coordena.

```text
FSM, enables, selects, starts, dones, ready/valid
```

HLS precisa gerar os dois.

Um algoritmo aparentemente simples pode virar uma FSM complexa se tiver loops, ifs, waits ou acessos de memória.

---

### 10. Por que HLS exige disciplina de codificação?

Porque o código de alto nível não é apenas executado: ele é transformado em circuito.

Código ruim para HLS pode gerar:

```text
hardware grande demais
latência alta
memórias com gargalo
portas insuficientes
muitos registradores
multiplicadores desnecessários
dificuldade de timing
```

Código bom para HLS explicita:

```text
largura exata
acessos de memória organizados
loops estruturados
paralelismo intencional
funções bem particionadas
uso controlado de arrays
```

---

## Figuras, diagramas e waveforms importantes

### Página 1 — Introduction 1/2

A figura usa o diagrama de abstração com domínios structural, behavioral e physical. Ela mostra que HLS trabalha em nível mais alto, mais próximo de algoritmos, funções e features, e depois desce para RTL e estruturas físicas.

### Página 1 — Introduction 2/2

A figura mostra um modelo C++ de alto nível virando um modelo RTL com datapath e control path. Ela é a imagem central do bloco: HLS transforma algoritmo em hardware.

### Página 2 — HLS Steps 1/2

A tabela azul lista os passos principais: preprocessing, scheduling, resource allocation, binding e data path/controller design. É o mapa conceitual da aula.

### Página 2 — HLS Steps 2/2

A figura mostra o fluxo completo: comportamento de entrada, preprocessing, scheduling, allocation/binding, datapath synthesis, controller FSM generation e HDL generation. Ela conecta todos os termos técnicos do bloco.

### Página 3 — Operation Scheduling 1/2 e 2/2

As duas figuras listam os algoritmos de scheduling: ASAP, ALAP, list scheduling, FDS, ILP e iterative refinement. Elas explicam como HLS decide em qual ciclo cada operação acontece.

### Página 4 — Coding Style and Synthesis 1/2

O slide mostra que tipos de dados e funções afetam área e performance. A figura da função reforça que argumentos entram no corpo da função e produzem valor de retorno, que pode virar datapath/módulo.

### Página 4 — Coding Style and Synthesis 2/2

A figura mostra loops pipelined e unrolled. Ela é importante para entender como uma estrutura de repetição em C/C++ pode virar hardware sequencial, pipeline ou paralelo.

### Página 5 — Arrays

O slide lista os principais riscos de arrays em HLS: gargalo de memória, número de portas, mapeamento para RAM/ROM/register bank e necessidade de reutilizar dados localmente.

### Página 5 — Optimization Techniques 1/3

A figura mostra tree height reduction, transformando uma árvore aritmética profunda em uma árvore mais balanceada. Isso reduz caminho crítico e melhora desempenho.

### Página 6 — Optimization Techniques 2/3

O slide lista otimizações de datapath como constant folding, propagation, dead code elimination, common sub-expression elimination, renaming e strength reduction.

### Página 6 — Optimization Techniques 3/3

O slide mostra otimizações de controle: model expansion, conditional expansion e loop expansion. Ele fecha indicando que transformações de loop para otimização RTL são uma área ativa de pesquisa.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é High-Level Synthesis?**  
   É a conversão de funções escritas em linguagens de alto nível, como C/C++, para um design RTL.

2. **Quais vantagens da design automation são citadas?**  
   Ciclo de projeto menor, exploração de espaço de estados, menos erros por reduzir processos manuais e otimização guiada por especificação em alta abstração.

3. **Quais são os principais passos de HLS?**  
   Preprocessing, scheduling, resource allocation, binding e data path/controller design.

4. **O que é preprocessing em HLS?**  
   Construção de representação intermediária como CDFG, análise de dependência de dados, análise de variáveis vivas e otimizações de compilador.

5. **O que é scheduling?**  
   Atribuir passos de controle/ciclos às operações do comportamento de entrada.

6. **O que é resource allocation?**  
   Calcular o número mínimo ou necessário de unidades funcionais e registradores.

7. **O que é binding?**  
   Mapear variáveis para registradores, operações para unidades funcionais e transferências para unidades de interface.

8. **O que é data path and controller design?**  
   Geração do datapath e do controlador/FSM com base nas interações entre processos e elementos de dados.

9. **O que significa ASAP?**  
   As Soon As Possible: agenda operações o mais cedo possível, buscando mínima latência.

10. **O que significa ALAP?**  
    As Late As Possible: agenda operações o mais tarde possível dentro de uma restrição de latência.

11. **Qual algoritmo é citado para restrição de recursos?**  
    List scheduling.

12. **Quais técnicas são citadas para time constrained scheduling?**  
    Force Directed Scheduling, Integer Linear Programming e Iterative Refinement.

13. **Por que tipos de dados importam em HLS?**  
    Porque determinam área e performance; dados de 32 bits exigem mais área que dados de 8 bits.

14. **Qual recomendação sobre largura de dados aparece no slide?**  
    Usar largura exata de dados para reduzir área.

15. **Como funções podem ser implementadas em HLS?**  
    Como módulos separados, com otimização local ao corpo da função.

16. **Como loops podem ser transformados?**  
    Podem ser parcialmente ou totalmente unrolled e também pipelined.

17. **O que é loop unrolling?**  
    Expansão de iterações do loop para permitir paralelismo, com maior uso de recursos.

18. **O que é loop pipelining?**  
    Sobreposição de iterações do loop para melhorar throughput.

19. **Como arrays são implementados?**  
    Como memórias, RAM ou ROM.

20. **Por que arrays podem criar gargalo de desempenho?**  
    Porque memórias têm número fixo de portas, normalmente uma ou duas, limitando acessos paralelos.

21. **O que acontece com arrays read-only?**  
    Podem mapear para ROM.

22. **Qual recomendação aparece sobre leitura de dados de arrays?**  
    Ler uma vez, armazenar localmente e reutilizar, se possível.

23. **O que é tree height reduction?**  
    Redução da profundidade de uma árvore aritmética por reestruturação de expressões, explorando paralelismo e propriedades algébricas.

24. **O que é constant folding?**  
    Pré-computar expressões constantes para reduzir tempo de computação e recursos.

25. **O que é common sub-expression elimination?**  
    Eliminar cálculos repetidos reutilizando uma expressão comum.

26. **O que é operator strength reduction?**  
    Trocar operações caras por equivalentes mais simples, como multiplicação por 2 por deslocamento à esquerda.

27. **O que é model expansion?**  
    Usar o corpo da função no lugar da chamada de função, semelhante a inlining.

28. **O que é conditional expansion?**  
    Explorar substituição de if-else por expressões aritméticas ou lógicas simples.

29. **O que é loop expansion?**  
    Expandir iterações de loop explicitamente, semelhante a unrolling.

### Pegadinhas

- HLS não gera software; gera RTL/hardware.
- C/C++ em HLS precisa ser escrito pensando em hardware.
- `int` de 32 bits pode gerar hardware muito maior que o necessário.
- Unrolling aumenta paralelismo, mas também aumenta área.
- Pipelining melhora throughput, mas não necessariamente reduz latência inicial.
- Arrays viram memórias e podem limitar paralelismo por número de portas.
- Ler muitos elementos de um mesmo array no mesmo ciclo pode exigir memória multiporta, particionamento ou múltiplos ciclos.
- Read-only arrays podem virar ROM.
- Funções podem virar módulos separados, o que pode limitar otimização global.
- ASAP minimiza latência, mas pode exigir mais recursos.
- ALAP depende de uma restrição de latência viável.
- ILP pode ser exato, mas caro.
- Strength reduction troca operações caras por operações mais baratas.
- Dead code elimination remove cálculos que não afetam saídas.
- Otimização de datapath e otimização de control path são coisas diferentes.

### Frases para memorizar

```text
HLS converte C/C++ em RTL.
Preprocessing constrói CDFG e analisa dependências.
Scheduling decide em qual ciclo cada operação acontece.
Resource allocation decide quantos recursos existem.
Binding decide qual operação usa qual recurso.
Datapath calcula; controller coordena.
ASAP agenda o mais cedo possível.
ALAP agenda o mais tarde possível.
Tipos de dados determinam área e performance.
Loops podem ser unrolled ou pipelined.
Arrays viram RAM/ROM e podem criar gargalos por portas de memória.
Tree height reduction balanceia expressões aritméticas.
Strength reduction troca operação cara por operação mais simples.
```

---

## Relação com projeto/laboratório

Esta aula prepara a leitura de códigos HLS e a análise de por que uma descrição de alto nível gera um hardware maior, menor, mais rápido ou mais lento.

### Estrutura mental para analisar código HLS

Ao olhar um código C/C++ para HLS, perguntar:

```text
1. Quais são as larguras reais necessárias dos dados?
2. Quantas operações aritméticas existem?
3. Quais operações podem rodar em paralelo?
4. Há dependências de dados entre operações?
5. Os loops podem ser pipelined?
6. Os loops podem ser unrolled parcial ou totalmente?
7. Os arrays criam gargalo de memória?
8. Quantos acessos paralelos a memória são necessários?
9. Funções devem ser mantidas como módulos ou expandidas?
10. Há constantes, código morto ou subexpressões repetidas?
```

### Exemplo didático de impacto de tipo

```cpp
int add(int a, int b) {
    return a + b;
}
```

Pode gerar hardware de 32 bits.

Melhor, se a faixa real permitir:

```cpp
uint8_t add(uint8_t a, uint8_t b) {
    return a + b;
}
```

Mas se o resultado pode passar de 255:

```cpp
uint9_t add(uint8_t a, uint8_t b) {
    return a + b;
}
```

### Exemplo didático de loop

Código sequencial:

```cpp
for (int i = 0; i < 4; i++) {
    y[i] = a[i] + b[i];
}
```

Possíveis implementações:

```text
sem unroll:
  1 somador reutilizado em 4 ciclos

unroll completo:
  4 somadores em paralelo

pipeline:
  nova iteração iniciada a cada ciclo, dependendo de dependências e recursos
```

### Exemplo didático de array como gargalo

```cpp
sum = A[i] + A[j] + A[k] + A[m];
```

Se `A` está em memória de 1 porta, não dá para ler quatro posições no mesmo ciclo.

Soluções possíveis:

```text
ler em múltiplos ciclos
particionar A em bancos
duplicar memória
guardar dados localmente
reorganizar algoritmo
```

---

## Necessidade de áudio

**Médio.**

O conteúdo textual dos slides permite reconstruir a aula, mas alguns pontos poderiam ser aprofundados com áudio do professor, especialmente:

- exemplos concretos usados para diferenciar ASAP e ALAP;
- como o curso interpreta “optimal solution” no caso de ASAP;
- detalhes da figura de scheduling/resource map, pois há texto pequeno no print;
- exemplos do professor para arrays e memória multiporta;
- como o professor conecta essas otimizações às ferramentas Synopsys usadas no curso.

Mesmo sem áudio, os conceitos principais do bloco estão claros pelos prints.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/conceitos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
- [x] O roteiro/checklist foi conferido antes de sugerir o próximo bloco.

---

## Próximo bloco

**Bloco 021 — 04 High-Level Synthesis (HLS) for Power Optimization**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.docx
```

Faixa:

```text
Slides 1-8
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.md
```
