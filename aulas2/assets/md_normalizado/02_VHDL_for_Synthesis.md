# 02 VHDL for Synthesis

## Controle do bloco

- **Bloco:** 007
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\02 VHDL for Synthesis.docx`
- **Faixa de slides:** 1-14
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\02 VHDL for Synthesis.md`
- **Próximo bloco recomendado:** 008 — `03 VHDL for Verification`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula explica como escrever **VHDL voltado à síntese**, isto é, VHDL que a ferramenta consegue transformar em circuito real. O bloco começa comparando **compilação** e **síntese**, reforçando que compilar um programa não é a mesma coisa que mapear uma descrição RTL para uma netlist de hardware.

A síntese lógica recebe uma descrição em HDL/RTL e gera uma implementação usando células padrão, gates ou recursos de FPGA. O circuito gerado depende do estilo do código, das constraints, da tecnologia-alvo e da biblioteca de células. Por isso, o mesmo comportamento lógico pode virar circuitos diferentes em área, timing e potência.

A parte mais importante da aula está nas **guidelines de modelagem VHDL para síntese**: evitar latches não intencionais, escrever processos combinacionais e sequenciais corretamente, usar `if-else` e `case` para estruturas de mux, tomar cuidado com `wait`, evitar loops de feedback combinacional, evitar resets gerados por lógica combinacional e sempre “pensar em hardware” antes de escrever o RTL.

---

## Texto extraído e organizado por slide

### Slide 1 — Compilation vs. Synthesizability

O slide compara **Compilation** e **Synthesis**.

#### Compilation

A compilação verifica módulos codificados para as descrições de entrada e checa erros sintáticos e semânticos para execução da função.

Ela:

- reconhece todos os constructs possíveis de uma linguagem de programação formalmente definida;
- traduz esses constructs para uma representação de linguagem de máquina;
- não tem impacto no hardware onde o programa roda;
- é seguida por execução em uma plataforma computacional ou baseada em processador;
- é executada em plataformas genéricas ou identificadas usando software compilador;
- gera executável correspondente ao programa escrito;
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

A síntese pega descrições **behavioral** e **RTL** dos módulos lógicos e mapeia para portas lógicas padrão ou elementos equivalentes de design mapeados à tecnologia.

Ela:

- reconhece um subconjunto dependente do alvo dentro da linguagem de descrição de hardware;
- mapeia a descrição para uma coleção de recursos concretos de hardware;
- é uma ferramenta iterativa no fluxo de design;
- gera uma descrição estrutural de hardware dependendo do comportamento ou RTL descrito;
- compila os modelos antes de mapeá-los para elementos padrão;
- executa visando células padrão ou FPGAs;
- produz netlist cujo desempenho depende do estilo de codificação da descrição behavioral/RTL.

Fluxo conceitual:

```text
HDL or RTL design models
   ↓
Synthesis
   ↓
Design netlist
```

Interpretação:

Compilação prepara software para rodar em hardware já existente. Síntese cria a estrutura de hardware correspondente à descrição RTL.

---

### Slide 2 — Logic Synthesis

Síntese lógica é o processo de escrever ou gerar um circuito lógico a partir da descrição funcional ou da descrição do circuito.

Pontos principais:

- Pode haver muitas formas de gerar a netlist para uma descrição lógica pretendida.
- A netlist depende da descrição comportamental em RTL.
- A síntese também otimiza a netlist para desempenho.

Possíveis problemas destacados:

- A netlist gerada pela síntese a partir de uma função pode não operar exatamente como esperado se o RTL for ambíguo ou mal modelado.
- Delays das células mapeadas afetam a netlist.
- Elementos adicionais podem precisar ser adicionados para que a netlist funcione como pretendido.
- Síntese lógica também pode mirar FPGAs em fluxos de design com FPGA.

Figura do slide:

A figura mostra uma descrição de circuito, células padrão como AND e OR, a ferramenta de síntese e uma netlist resultante. O ponto visual é que a síntese escolhe uma estrutura física para implementar a função, e essa estrutura não é necessariamente uma tradução literal linha por linha.

---

### Slide 3 — Logic Synthesis in Cell-Based ASIC Design Flow

A síntese lógica é uma etapa dependente da ferramenta de síntese dentro do fluxo automatizado de design **cell-based**.

Benefícios listados:

- gera menos bugs na geração da netlist;
- melhora a produtividade do design;
- abstrai os dados do design, como a descrição HDL/RTL, de uma tecnologia de implementação específica;
- permite ressintetizar designs visando tecnologias diferentes;
- exemplo: primeiro implementar em FPGA e depois em ASIC;
- em alguns casos, leva a designs mais otimizados do que por meios manuais, por exemplo em logic optimization.

O slide reforça que design de circuito é um tradeoff entre:

- **timing**
- **power**
- **area**

#### Area optimization

Objetivo: área pequena.

#### Timing optimization

Objetivo: atrasos pequenos.

#### Power optimization

Objetivo: baixo consumo de potência.

Figura importante:

A mesma função lógica pode ser implementada com células diferentes, cada uma com potência diferente. O slide mostra células com potência 2, 2.5 e 3, e duas implementações com potências totais diferentes. A mensagem é que a ferramenta pode escolher estruturas diferentes para reduzir potência, área ou atraso.

---

### Slide 4 — VHDL RTL Features and Equivalent Hardware

O slide mostra como recursos RTL de VHDL se relacionam com hardware equivalente.

#### Operadores lógicos

Mapeiam para portas lógicas primitivas.

Exemplo:

```vhdl
y <= a and b;
z <= a or b;
n <= not a;
```

Hardware equivalente:

```text
AND, OR, NOT e outras portas lógicas.
```

#### Operadores aritméticos

Mapeiam para somadores, subtratores e outros circuitos aritméticos.

Pontos do slide:

- aritmética unsigned em complemento de 2 é simples;
- modelar carry exige um bit adicional além dos operandos;
- `*`, `%` e `/` não são diretamente mapeáveis para hardware simples;
- operadores relacionais geram comparadores.

Observação: em VHDL o operador de módulo é `mod`, e não `%`; o slide reutiliza notação mais próxima de Verilog/C em alguns pontos. A ideia central é que multiplicação, divisão e módulo podem gerar circuitos mais caros ou exigir cuidado de síntese.

#### Shifts por constante

Shifts por quantidade constante são apenas conexões de fios.

Pontos:

- não há lógica envolvida;
- shifts variáveis exigem circuito adicional.

Exemplo conceitual:

```vhdl
y <= x sll 2;
```

Se o shift é fixo em 2, a ferramenta pode implementar como religação de bits e preenchimento com zeros.

#### Expressão condicional

Expressões condicionais geram lógica ou multiplexador.

Exemplo VHDL:

```vhdl
z <= a when sel = '0' else b;
```

Hardware equivalente: um MUX 2:1.

---

### Slide 5 — RTL Model Structure for Synthesis

O slide mostra a estrutura de um modelo RTL em VHDL voltado à síntese.

Pontos principais:

- Um modelo RTL em VHDL segue uma estrutura de design com `entity` e `architecture`.
- VHDL suporta estilos de modelagem:
  - structural;
  - behavioral;
  - RTL.
- Ferramentas de síntese processam templates dessas estruturas de modelo.
- A ordem dos statements concorrentes é irrelevante; todos são analisados concorrentemente.
- Statements entre `begin` e `end` em uma `architecture` definem funções.
- Statements de `process` dentro da `architecture` são executados concorrentemente em relação a outros statements/processos.
- O slide mostra exemplos de modelos VHDL para uma porta AND e um flip-flop D.

Exemplo didático de uma porta AND em VHDL:

```vhdl
entity and2 is
  port (
    a : in  std_logic;
    b : in  std_logic;
    z : out std_logic
  );
end and2;

architecture rtl of and2 is
begin
  z <= a and b;
end rtl;
```

Exemplo didático de flip-flop D:

```vhdl
entity d_ff is
  port (
    clk : in  std_logic;
    rst : in  std_logic;
    d   : in  std_logic;
    q   : out std_logic
  );
end d_ff;

architecture rtl of d_ff is
begin
  process(clk, rst)
  begin
    if rst = '1' then
      q <= '0';
    elsif rising_edge(clk) then
      q <= d;
    end if;
  end process;
end rtl;
```

Interpretação:

Dentro da arquitetura, as estruturas são concorrentes. Um `process` é uma unidade concorrente, mas seus statements internos são executados sequencialmente pelo simulador.

---

### Slide 6 — VHDL Modeling Guidelines for Synthesis (1/4)

#### Latches

Se a intenção não é inferir um latch, então o sinal ou variável deve receber valor explicitamente em todos os ramos de um `if` ou `case`.

Exemplo problemático:

```vhdl
if a > b then
  z <= a;
else
  -- z não recebe valor em algum caminho
end if;
```

Exemplo correto:

```vhdl
if a > b then
  z <= a;
else
  z <= b;
end if;
```

Exemplo com `case`:

```vhdl
case opc is
  when add =>
    z <= a + b;
  when sub =>
    z <= a - b;
  when mul =>
    z <= a * b;
  when div =>
    z <= a / b;
  when others =>
    null;
end case;
```

Observação: se `z` não receber valor no `when others`, pode haver latch dependendo do restante do processo. Para lógica combinacional segura, atribua valor default antes do `case` ou atribua `z` em todos os ramos.

#### Loop statement in VHDL

O slide cita:

- `while loop`;
- `for loop`.

Mensagem principal:

```text
for loop: only this loop statement is synthesizable loop
```

Interpretação: para síntese, `for` com limites estáticos é o loop mais seguro e previsível. Ele vira replicação de hardware, não loop de software em tempo de execução.

Exemplo sintetizável:

```vhdl
for i in data'range loop
  y(i) <= not data(i);
end loop;
```

#### Wait statement

Guideline do slide: evitar `wait` para síntese.

Tipos citados:

- `wait for time;`
- `wait until condition;`
- `wait on signal-list`

Pontos importantes:

- `wait until condition` é o único tipo citado como sintetizável em determinadas condições.
- Se usado, o `wait` deve ser o primeiro e o único wait statement presente no processo.
- A condição deve ser uma expressão de clock que indique borda de subida ou descida.

Exemplo aceitável em alguns estilos:

```vhdl
process
begin
  wait until clk = '1';
  count <= count + 1;
end process;
```

Estilo preferido para síntese:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    count <= count + 1;
  end if;
end process;
```

---

### Slide 7 — VHDL Modeling Guidelines for Synthesis (2/4)

#### Combinational process modeling

Guideline:

- em processo combinacional, todos os sinais de entrada devem estar na lista de sensibilidade.

Exemplo:

```vhdl
process(a, b, sel)
begin
  if sel = '1' then
    z <= a;
  else
    z <= b;
  end if;
end process;
```

Em VHDL-2008:

```vhdl
process(all)
begin
  ...
end process;
```

#### Sequential process modeling

Guideline:

- em processo sequencial, apenas clock e reset devem estar na lista de sensibilidade.

Exemplo:

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

#### Fundamental process types in VHDL

O slide lista tipos fundamentais de processo:

- `if-else`;
- `for statement`;
- `case statement`;
- signal assignment precedence;
- variables for structuring.

#### Precedência de atribuição de signal

A última atribuição feita a um signal durante a execução do processo sobrescreve as atribuições anteriores.

Exemplo conceitual:

```vhdl
process(state, cond_shutdown)
begin
  do_1 <= '0';
  do_2 <= '0';
  next_state <= state;

  if cond_shutdown then
    do_1 <= '1';
    do_2 <= '1';
    next_state <= idle;
  end if;
end process;
```

Atribuições no início funcionam como valores padrão. Atribuições posteriores podem sobrescrevê-las.

#### Variables for structuring

Variáveis podem ser usadas para organizar estruturas complexas e reduzir repetição em lógica que consome recursos, como:

- adders;
- comparators;
- equações lógicas complexas.

O slide recomenda usar parênteses para controlar a estrutura da lógica sintetizada.

#### `if-else` e `case`

`if-else` e `case` são usados para estruturas semelhantes a multiplexadores.

Exemplo:

```vhdl
if sel = '0' then
  z <= a;
else
  z <= b;
end if;
```

ou:

```vhdl
case sel is
  when "00" => z <= a;
  when "01" => z <= b;
  when "10" => z <= c;
  when others => z <= d;
end case;
```

---

### Slide 8 — VHDL Modeling Guidelines for Synthesis (3/4)

Pontos principais:

- Particione o design considerando tempo de síntese e qualidade do circuito.
- Mantenha módulos de nível folha razoavelmente dimensionados para facilitar debug.
- Isso limita o tempo de síntese e ajuda a obter netlists conforme metas de performance, área e potência.
- Limite o número de módulos separados que um caminho de timing pode atravessar.
- Quando o designer melhora timing e área, existe tradeoff entre regras de particionamento.
- Modelar para síntese exige “pensar em hardware e codificar em RTL”.
- Imagine qual hardware será inferido pelo statement escrito no modelo.

Pontos detalhados:

- pensar em hardware é pensar no timing relativo de eventos e geração de sinais;
- pensar em hardware significa pensar quando precisa de um novo adder ou comparator antes de codificar;
- VHDL modeling é fácil, e nem todo statement precisa ser usado para modelar hardware;
- apenas um subconjunto dos statements VHDL é necessário para design ASIC;
- muitas regras tradicionais de design de software também se aplicam ao código VHDL:
  - modularidade;
  - bom estilo;
  - bons comentários;
  - bom plano de teste;
  - boas especificações de design;
  - reuso.

Interpretação:

Esta é uma das mensagens mais importantes da aula: não escreva VHDL como se estivesse programando software. Antes de escrever, imagine o circuito que será criado.

---

### Slide 9 — VHDL Modeling Guidelines for Synthesis (4/4)

O slide enfatiza evitar **combinational feedback loop** em latch e lógica combinacional.

Pontos principais:

- Evite loop de feedback combinacional em latch e lógica combinacional.
- O comportamento do sistema se torna imprevisível porque a função do circuito passa a depender de delays de portas, delays de interconexão e tecnologia.
- O exemplo 5 mostra um provável loop combinacional que deve ser evitado.
- Evite sinais gated ou gerados internamente para resetar latch ou flip-flop.
- O exemplo 6 mostra um problema em snippet de código.

#### Problema com reset gerado por lógica combinacional

Exemplo conceitual baseado no slide:

```vhdl
rstGated <= rst and gatingSig;

process(enable, rstGated, data)
begin
  if rstGated = '1' then
    out <= '0';
  elsif enable = '1' then
    out <= data;
  end if;
end process;
```

Problema:

- o reset é gerado por lógica combinacional;
- isso pode criar glitch;
- um glitch no reset pode resetar indevidamente um latch ou flip-flop.

#### Problema de loop combinacional

Exemplo conceitual baseado no slide:

```vhdl
process(enable, rst, data)
begin
  if rst = '1' then
    q1 <= '0';
  elsif enable = '1' then
    q1 <= data;
  end if;
end process;

process(enable, rst, q1)
begin
  if rst = '1' then
    q2 <= '0';
  elsif enable = '1' then
    q2 <= q1;
  end if;
end process;

output <= q2;
```

Dependendo da forma real do código e das listas de sensibilidade, pode haver latch, feedback ou comportamento dependente de delays. A diretriz é evitar feedback combinacional não controlado e usar clock/reset bem definidos.

---

### Slide 10 — Questão 1

**Questão:** Logic blocks are defined by ______.

Alternativas:

- A. Truth table
- B. Timing diagram
- C. Logic function
- D. All of the above

**Resposta correta:** D. All of the above.

**Tradução:** Blocos lógicos são definidos por tabela verdade, diagrama de tempo e função lógica.

**Justificativa:** A revisão inicial da aula afirma que blocos lógicos podem ser definidos por truth table, timing diagram e logic function / Boolean equation.

---

### Slide 11 — Questão 2

**Questão:** RTL model of a 32-bit multiplexer using VHDL is ______.

Alternativas visuais:

- A. Código em estilo Verilog/SystemVerilog.
- B. Código com `library IEEE`, `use IEEE.STD_LOGIC_1164.ALL`, `entity`, `architecture` e `process`.

**Resposta correta:** B.

**Tradução:** O modelo RTL de um multiplexador de 32 bits usando VHDL é o código que contém a estrutura típica VHDL com `library`, `entity`, `architecture` e sinais `STD_LOGIC_VECTOR`.

**Justificativa:** VHDL usa `entity` para a interface e `architecture` para a implementação. A alternativa A está no estilo Verilog/SystemVerilog, não VHDL.

Exemplo equivalente:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity mux_2to1 is
  port (
    a : in  std_logic_vector(31 downto 0);
    b : in  std_logic_vector(31 downto 0);
    s : in  std_logic;
    z : out std_logic_vector(31 downto 0)
  );
end mux_2to1;

architecture rtl of mux_2to1 is
begin
  process(a, b, s)
  begin
    if s = '0' then
      z <= a;
    else
      z <= b;
    end if;
  end process;
end rtl;
```

---

### Slide 12 — Questão 3

**Questão:** All the HDL statements are synthesizable.

Alternativas:

- True
- False

**Resposta correta:** False.

**Tradução:** Todos os statements de HDL são sintetizáveis.

**Justificativa:** A aula mostra que apenas um subconjunto da linguagem é apropriado para síntese. Constructs de simulação, delays temporais, certos usos de `wait`, loops não estáticos e modelagens com feedback combinacional podem não ser sintetizáveis ou podem gerar hardware indesejado.

---

### Slide 13 — Questão 4

**Questão:** Following VHDL code represents ______.

Alternativas:

- A. Adder
- B. Multiplexer
- C. Functional, performance

O código mostrado é semelhante a:

```vhdl
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity IAM is
  port (
    A, B, Cin : in  STD_LOGIC;
    Sum, Cout : out STD_LOGIC
  );
end IAM;

architecture Behavioral of IAM is
begin
  Sum  <= A xor B xor Cin;
  Cout <= (A and B) or (B and Cin) or (A and Cin);
end Behavioral;
```

**Resposta correta:** A. Adder.

**Tradução:** O código VHDL representa um somador.

**Justificativa:** O código calcula `Sum` e `Cout` a partir de `A`, `B` e `Cin`. Isso é a lógica de um **full adder** de 1 bit.

---

### Slide 14 — Questão 5

**Questão:** A task only returns a single value.

Alternativas:

- True
- False

**Resposta correta pelo conceito da aula anterior:** False.

**Tradução:** Uma task retorna apenas um único valor.

**Justificativa:** Em Verilog, quem retorna um único valor é uma **function**. Uma **task** pode retornar múltiplos valores por argumentos `output` ou `inout` e pode consumir tempo de simulação. A questão parece reaproveitada do bloco de Verilog, mas pelo conceito correto do curso, a afirmação é falsa.

---

## Aula didática desenvolvida

### 1. Síntese não é tradução literal

Quando você escreve VHDL, a ferramenta de síntese não pega cada linha e transforma em uma porta diretamente. Ela interpreta o comportamento RTL e tenta implementar esse comportamento com células da biblioteca.

Exemplo:

```vhdl
z <= (a and b) or (c and d);
```

Esse comportamento pode virar:

- duas portas AND e uma OR;
- uma célula complexa da biblioteca;
- uma estrutura otimizada para timing;
- uma estrutura otimizada para área;
- uma estrutura otimizada para potência.

Por isso, a qualidade do RTL influencia diretamente a qualidade da netlist.

---

### 2. Pensar em hardware antes de codificar

O slide usa a frase essencial:

```text
thinking in hardware and coding in RTL
```

Em português:

```text
pensar em hardware e codificar em RTL
```

Isso significa que, antes de escrever:

```vhdl
z <= a + b + c + d;
```

você deve imaginar:

```text
Quantos somadores isso pode gerar?
Eles ficam em série?
Qual será o caminho crítico?
Preciso pipeline?
Preciso balancear a árvore de soma?
```

Um código simples pode gerar hardware pesado.

Exemplo serial:

```vhdl
z <= a + b + c + d;
```

Pode ser interpretado como uma cadeia de somadores.

Uma estrutura mais explícita:

```vhdl
sum1 <= a + b;
sum2 <= c + d;
z    <= sum1 + sum2;
```

Pode ajudar a pensar em uma árvore de soma, embora a síntese também possa otimizar dependendo das constraints.

---

### 3. Latch inferido em VHDL

Um dos erros mais importantes em síntese é inferir latch sem querer.

Exemplo ruim:

```vhdl
process(en, d)
begin
  if en = '1' then
    q <= d;
  end if;
end process;
```

Se `en = '0'`, `q` não recebe valor. Para manter o valor anterior, a ferramenta infere um latch.

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

Ou com valor padrão:

```vhdl
process(en, d)
begin
  q <= '0';

  if en = '1' then
    q <= d;
  end if;
end process;
```

Regra:

```text
Se não quero memória, toda saída deve receber valor em todos os caminhos.
```

---

### 4. Processo combinacional correto

Um processo combinacional deve ter:

1. todos os sinais lidos na lista de sensibilidade;
2. atribuição de todas as saídas em todos os caminhos;
3. ausência de clock;
4. ausência de memória intencional.

Exemplo:

```vhdl
process(a, b, c, d, sel)
begin
  case sel is
    when "00" =>
      z <= a;
    when "01" =>
      z <= b;
    when "10" =>
      z <= c;
    when others =>
      z <= d;
  end case;
end process;
```

Em VHDL-2008:

```vhdl
process(all)
begin
  ...
end process;
```

Isso evita esquecer algum sinal na sensibilidade.

---

### 5. Processo sequencial correto

Um processo sequencial deve ter normalmente apenas clock e reset na lista de sensibilidade.

Reset assíncrono ativo baixo:

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

Reset síncrono:

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

Regra:

```text
Reset na sensibilidade e antes do clock → assíncrono.
Reset dentro do rising_edge → síncrono.
```

---

### 6. `if-else` e `case` como multiplexadores

Quando você escreve:

```vhdl
if sel = '0' then
  z <= a;
else
  z <= b;
end if;
```

a ferramenta infere um multiplexador.

Quando escreve:

```vhdl
case sel is
  when "00" => z <= a;
  when "01" => z <= b;
  when "10" => z <= c;
  when others => z <= d;
end case;
```

a ferramenta infere um mux de múltiplas entradas.

Portanto, `if`, `elsif` e `case` não são “software”. Eles representam seleção de caminhos em hardware.

---

### 7. Precedência de atribuição em processo

Dentro de um processo, se o mesmo signal recebe múltiplas atribuições, a última atribuição executada vence.

Exemplo:

```vhdl
process(a, b, sel)
begin
  z <= a;  -- valor padrão

  if sel = '1' then
    z <= b;  -- sobrescreve quando sel = 1
  end if;
end process;
```

Esse padrão é muito útil.

Interpretação de hardware:

```text
z normalmente recebe a.
Se sel = 1, z recebe b.
```

Isso cria um mux, não duas saídas diferentes.

---

### 8. `for loop` sintetizável

Em VHDL, `for` com limites fixos é normalmente sintetizável.

Exemplo:

```vhdl
process(a)
begin
  for i in 0 to 7 loop
    y(i) <= not a(i);
  end loop;
end process;
```

Isso não vira um loop que roda no tempo como software. Vira oito inversores em paralelo.

Outro exemplo:

```vhdl
process(a, b)
begin
  result <= (others => '0');

  for i in 0 to 7 loop
    result(i) <= a(i) and b(i);
  end loop;
end process;
```

Hardware: oito portas AND.

---

### 9. `while loop` e cuidado com síntese

`while` é mais perigoso para síntese porque o número de iterações pode depender de condição dinâmica.

Exemplo problemático:

```vhdl
while data /= 0 loop
  ...
end loop;
```

A ferramenta pode não saber quantas cópias de hardware criar.

Para RTL sintetizável, prefira:

- `for` com limites fixos;
- FSM para operações iterativas ao longo de vários ciclos;
- contadores explícitos.

---

### 10. `wait` em síntese

A aula recomenda evitar `wait` para síntese.

Exemplo de testbench:

```vhdl
wait for 10 ns;
```

Isso é claramente simulação.

Exemplo de clock em testbench:

```vhdl
process
begin
  clk <= '0';
  wait for 5 ns;
  clk <= '1';
  wait for 5 ns;
end process;
```

Para RTL, prefira:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Algumas ferramentas aceitam:

```vhdl
process
begin
  wait until rising_edge(clk);
  q <= d;
end process;
```

Mas o estilo com lista de sensibilidade e `rising_edge(clk)` é mais claro e mais comum em ASIC.

---

### 11. Evitar feedback combinacional

Feedback combinacional ocorre quando a saída de uma lógica volta para sua própria entrada sem registrador no caminho.

Exemplo conceitual ruim:

```vhdl
a <= not b;
b <= not a;
```

O comportamento depende de delays físicos. Pode oscilar ou ficar imprevisível.

Outro exemplo mais sutil:

```vhdl
process(en, q, d)
begin
  if en = '1' then
    q <= d;
  else
    q <= q;
  end if;
end process;
```

Isso sugere memória/latch e pode criar comportamento dependente de feedback.

Regra:

```text
Feedback deve ser controlado por clock ou por latch intencional e bem especificado.
```

---

### 12. Evitar reset gerado por lógica combinacional

O slide alerta contra sinais gated ou gerados internamente para resetar latch ou flip-flop.

Exemplo perigoso:

```vhdl
rst_internal <= rst and enable;
```

Usar isso como reset pode gerar glitch.

```vhdl
process(clk, rst_internal)
begin
  if rst_internal = '1' then
    q <= '0';
  elsif rising_edge(clk) then
    q <= d;
  end if;
end process;
```

Se `rst_internal` tiver glitch, o registrador pode resetar sem intenção.

Melhor:

```vhdl
process(clk, rst)
begin
  if rst = '1' then
    q <= '0';
  elsif rising_edge(clk) then
    if enable = '1' then
      q <= d;
    end if;
  end if;
end process;
```

Reset deve ser limpo, controlado e distribuído com cuidado.

---

### 13. Particionamento de design

O slide recomenda particionar considerando:

- tempo de síntese;
- qualidade do circuito;
- debug;
- caminhos de timing;
- tamanho dos módulos folha.

Módulos muito grandes podem dificultar:

- síntese;
- debug;
- reutilização;
- leitura.

Módulos pequenos demais podem criar:

- hierarquia excessiva;
- muitos caminhos atravessando módulos;
- dificuldade de otimização global;
- overhead de integração.

Existe tradeoff.

Regra prática:

```text
Separe por função clara, mas não fragmente demais o caminho crítico.
```

---

### 14. Código VHDL do full adder da questão

A questão 4 mostra um full adder.

Equações:

```text
Sum  = A xor B xor Cin
Cout = (A and B) or (B and Cin) or (A and Cin)
```

Código limpo:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity full_adder is
  port (
    A    : in  std_logic;
    B    : in  std_logic;
    Cin  : in  std_logic;
    Sum  : out std_logic;
    Cout : out std_logic
  );
end full_adder;

architecture behavioral of full_adder is
begin
  Sum  <= A xor B xor Cin;
  Cout <= (A and B) or (B and Cin) or (A and Cin);
end behavioral;
```

Esse é um exemplo de lógica combinacional expressa por atribuições concorrentes.

---

## Conceitos difíceis explicados em profundidade

### 1. Por que a netlist depende do estilo do RTL?

Considere estas duas formas:

```vhdl
z <= a when sel = '0' else b;
```

e:

```vhdl
process(a, b, sel)
begin
  if sel = '0' then
    z <= a;
  else
    z <= b;
  end if;
end process;
```

Ambas tendem a gerar um mux.

Mas em casos maiores, escolhas de estilo mudam o hardware:

```vhdl
if req0 = '1' then
  grant <= "00";
elsif req1 = '1' then
  grant <= "01";
elsif req2 = '1' then
  grant <= "10";
else
  grant <= "11";
end if;
```

Isso sugere prioridade.

Já um `case` sobre um vetor one-hot pode sugerir outra estrutura. A ferramenta otimiza, mas ela parte do que o RTL expressa.

---

### 2. Latch intencional versus latch acidental

Às vezes, um latch pode ser intencional. Mas em RTL síncrono moderno, latches são frequentemente evitados.

Latch acidental:

```vhdl
process(en, d)
begin
  if en = '1' then
    q <= d;
  end if;
end process;
```

A ferramenta cria latch porque `q` precisa manter valor quando `en = 0`.

Registrador correto:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    if en = '1' then
      q <= d;
    end if;
  end if;
end process;
```

Aqui a memória é um flip-flop, não um latch transparente.

---

### 3. O que significa “for loop vira hardware replicado”?

Este código:

```vhdl
for i in 0 to 3 loop
  y(i) <= a(i) and b(i);
end loop;
```

não significa que uma única porta AND será usada quatro vezes em sequência. Em hardware combinacional, ele normalmente vira:

```text
y(0) = a(0) AND b(0)
y(1) = a(1) AND b(1)
y(2) = a(2) AND b(2)
y(3) = a(3) AND b(3)
```

Ou seja, quatro portas em paralelo.

O loop é uma forma compacta de escrever repetição estrutural.

---

### 4. `wait for` não cria atraso físico sintetizável

Exemplo:

```vhdl
wait for 10 ns;
```

Isso só faz sentido no simulador. Em hardware real, a noção de “esperar 10 ns” precisa ser implementada com:

- clock;
- contador;
- FSM;
- delay line física específica;
- circuito analógico, dependendo do caso.

Em RTL digital sintetizável, tempo é representado por ciclos de clock.

Exemplo:

```vhdl
if rising_edge(clk) then
  if count = 9 then
    done <= '1';
  else
    count <= count + 1;
  end if;
end if;
```

Esse código espera 10 ciclos, não 10 ns absolutos.

---

### 5. Sinais na lista de sensibilidade

Processo combinacional com lista incompleta pode simular errado.

Exemplo ruim:

```vhdl
process(a, b)
begin
  y <= a and b and c;
end process;
```

Se `c` muda, o processo não roda, e a simulação RTL pode ficar incorreta.

Correto:

```vhdl
process(a, b, c)
begin
  y <= a and b and c;
end process;
```

Ou em VHDL-2008:

```vhdl
process(all)
begin
  y <= a and b and c;
end process;
```

Síntese pode inferir a lógica correta mesmo com lista incompleta, mas simulação e síntese podem divergir. Por isso a lista completa é importante.

---

### 6. Pensar em caminho crítico

Um caminho crítico é o caminho combinacional mais lento entre registradores.

Exemplo:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    z <= (((a + b) + c) + d) + e;
  end if;
end process;
```

Esse código pode criar uma cadeia longa de somadores antes do registrador `z`.

Uma forma de melhorar timing pode ser pipeline:

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    sum_ab <= a + b;
    sum_cd <= c + d;
    sum_e  <= e;
    z      <= sum_ab + sum_cd + sum_e;
  end if;
end process;
```

Dependendo de como for escrito e registrado, isso pode reduzir o caminho crítico por estágio, ao custo de latência e registradores adicionais.

---

### 7. `case` e `when others`

Em VHDL, `case` deve cobrir todas as possibilidades do tipo. Para `std_logic_vector`, há valores além de `0` e `1`, como `X` e `Z`.

Por isso, use:

```vhdl
case sel is
  when "00" => z <= a;
  when "01" => z <= b;
  when "10" => z <= c;
  when "11" => z <= d;
  when others => z <= (others => '0');
end case;
```

O `when others` evita lacunas.

---

### 8. MUX com `if`, `case` e atribuição concorrente

Três formas equivalentes para um mux simples:

#### Atribuição concorrente

```vhdl
z <= a when sel = '0' else b;
```

#### Processo com `if`

```vhdl
process(a, b, sel)
begin
  if sel = '0' then
    z <= a;
  else
    z <= b;
  end if;
end process;
```

#### Processo com `case`

```vhdl
process(a, b, sel)
begin
  case sel is
    when '0' =>
      z <= a;
    when others =>
      z <= b;
  end case;
end process;
```

Todas descrevem lógica combinacional, desde que os caminhos estejam completos.

---

## Figuras, diagramas e waveforms importantes

### Comparação compilation versus synthesis

A figura mostra software virando machine code de um lado e RTL virando design netlist do outro. A diferença é essencial: síntese gera hardware, não código para um processador executar.

### Figura de logic synthesis

Mostra uma descrição de circuito, células padrão e a ferramenta de síntese gerando uma estrutura de portas. Ela reforça que existe escolha de implementação.

### Figura de potência das células

Mostra que células diferentes têm custos de potência diferentes. A mesma função pode ter implementações com potência total diferente.

### Figura `Y[5:0] = ~X[3:0] << 2`

Mostra que shift constante pode virar inversores e conexões diretas de fios, sem circuito complexo de deslocamento.

### Figura de estrutura RTL

Mostra exemplos de modelo VHDL para AND e D flip-flop. A mensagem é que a `architecture` contém statements concorrentes e processos que descrevem hardware.

### Figuras de guidelines

Os exemplos de latch, `case`, `wait`, processo combinacional, processo sequencial e feedback combinacional são a parte mais prática da aula. Eles indicam o que escrever e o que evitar em RTL de síntese.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Logic blocks are defined by what?**  
   Resposta: truth table, timing diagram and logic function; portanto, **All of the above**.

2. **Qual alternativa representa um modelo RTL VHDL de mux de 32 bits?**  
   Resposta: a alternativa com `library IEEE`, `entity`, `architecture`, `STD_LOGIC_VECTOR` e `process`.

3. **All HDL statements are synthesizable. True or false?**  
   Resposta: **False**.

4. **O código com `Sum <= A xor B xor Cin` e `Cout <= ...` representa o quê?**  
   Resposta: **Adder**, especificamente um full adder.

5. **A task only returns a single value. True or false?**  
   Resposta pelo conceito correto: **False**. Function retorna um valor; task pode retornar múltiplos por `output/inout`.

6. **Qual loop é mais seguro para síntese em VHDL?**  
   Resposta: `for loop` com limites estáticos.

7. **O que acontece se um sinal não recebe valor em todos os ramos de um `if` ou `case` combinacional?**  
   Resposta: pode haver inferência de latch.

8. **O que deve estar na lista de sensibilidade de processo combinacional?**  
   Resposta: todos os sinais de entrada/lidos pelo processo.

9. **O que deve estar na lista de sensibilidade de processo sequencial?**  
   Resposta: normalmente clock e reset.

10. **Por que evitar feedback combinacional?**  
    Resposta: porque o comportamento pode depender de delays de portas, interconexões e tecnologia, tornando-se imprevisível.

11. **Por que evitar reset gerado por lógica combinacional?**  
    Resposta: porque pode produzir glitches e resetar indevidamente latches ou flip-flops.

12. **O que significa pensar em hardware ao escrever VHDL?**  
    Resposta: imaginar quais registradores, muxes, somadores, comparadores e caminhos de timing serão inferidos pelo código.

### Pegadinhas

- Nem todo statement HDL é sintetizável.
- `wait for 10 ns` é típico de testbench, não RTL sintetizável.
- `wait until rising_edge(clk)` pode ser aceito por algumas ferramentas, mas o estilo preferido é processo com `rising_edge(clk)`.
- `for loop` com limite fixo vira replicação de hardware.
- `while loop` pode ser problemático para síntese.
- Processo combinacional incompleto pode inferir latch.
- Lista de sensibilidade incompleta pode causar divergência entre simulação e síntese.
- Última atribuição de signal dentro de um processo tem precedência na execução daquele processo.
- Shifts constantes são baratos; shifts variáveis exigem circuito adicional.
- Divisão e módulo por variável podem gerar hardware caro ou não ser diretamente suportados.
- Reset e clock não devem ser gerados por lógica combinacional sem muito cuidado.

### Frases para memorizar

```text
Síntese transforma RTL em netlist.
A netlist depende do estilo do RTL.
Nem todo HDL é sintetizável.
Processo combinacional precisa de lista de sensibilidade completa.
Processo sequencial deve ter clock e reset na sensibilidade.
Se não quer latch, atribua valor em todos os caminhos.
for loop fixo vira hardware replicado.
Pense em hardware antes de codificar VHDL.
Evite feedback combinacional e resets gerados por lógica combinacional.
```

---

## Relação com projeto/laboratório

Esta aula será usada diretamente quando você escrever ou revisar RTL VHDL para simulação e síntese.

### Relação com síntese

Ferramentas de síntese esperam templates claros:

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

Se o design sintetizado ou simulado se comportar diferente do esperado, procure:

- latches inferidos;
- lista de sensibilidade incompleta;
- ausência de `when others`;
- processo combinacional com saída sem valor default;
- resets gerados por lógica;
- loops combinacionais;
- uso indevido de `wait`;
- operação aritmética com largura insuficiente.

### Relação com qualidade de RTL

As guidelines da aula são regras de qualidade de código:

- modularidade;
- bons comentários;
- boas especificações;
- plano de teste;
- particionamento equilibrado;
- pensar em timing, área e potência;
- clareza na inferência de hardware.

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

**Bloco 008 — 03 VHDL for Verification**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\03 VHDL for Verification.docx
```

Faixa:

```text
Slides 1-15
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\03 VHDL for Verification.md
```
