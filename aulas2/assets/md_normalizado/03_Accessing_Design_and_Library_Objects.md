# 03 Accessing Design and Library Objects

## Controle do bloco

- **Bloco:** 035
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\03 Accessing Design and Library Objects.docx`
- **Faixa de slides:** 1-22
- **Caminho sugerido para salvar:**
  `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\03 Accessing Design and Library Objects.md`
- **Próximo bloco recomendado:** Bloco 036 - `04 Constraints - Reg-to-Reg and I-O Timing - parte A`

---

## Resumo executivo

Esta aula ensina como o **Design Compiler NXT** organiza internamente o projeto como um banco de dados de objetos: `design`, `cell`, `port`, `pin`, `net`, `clock`, bibliotecas, células de biblioteca e atributos. Esse ponto é fundamental porque quase todos os comandos de síntese, constraints (restrições), análise e debug operam em cima desses objetos.

A ideia central é: em DC NXT, você não trabalha apenas com nomes de sinais como texto. Você consulta objetos reais do banco de dados usando comandos `get_*`, como `get_ports`, `get_cells`, `get_pins`, `get_nets`, `get_clocks`, `get_lib_cells`, e passa essas coleções para outros comandos, como `set_load`, `set_input_delay`, `set_dont_touch`, `report_timing` ou `filter_collection`.

A aula também mostra uma diferença crítica entre **listas Tcl** e **collections (coleções)**. Uma lista Tcl guarda dados definidos pelo usuário; uma collection guarda handles (referências internas) para objetos do banco de dados Synopsys. Misturar comandos de lista com comandos de collection é uma fonte clássica de erro.

---

## Texto extraído e organizado por slide

### Slide 1 - Design Objects: Verilog Perspective

Texto central:

- Design Compiler NXT creates and manipulates different object types:
  - `design`
  - `port`
  - `cell`
  - `pin`
  - `net`
  - `clock`
  - and so on

Exemplo visual em Verilog:

```verilog
module TOP (A,B,C,D,CLK,OUT1);
  input        A, B, C, D, CLK;
  output [1:0] OUT1;

  wire INV1, INV0, bus1, bus0;

  ENCODER U1 (.AIN(A), ... .Q1(bus1));
  INVX1*  U2 (.A(BUS0), .Y(INV0));
  INVX1*  U3 (.A(BUS1), .Y(INV1));
  REGFILE U4 (.D0(INV0), .D1(INV1), .CLK(CLK));
endmodule

module ENCODER ...
```

Interpretação:

- `TOP` é um **design**.
- `A`, `B`, `C`, `D`, `CLK`, `OUT1` são **ports** do design `TOP`.
- `CLK` também pode ser tratado como **clock**, depois que um clock for definido por constraint.
- `U1`, `U2`, `U3`, `U4` são **cells**, isto é, instâncias dentro de `TOP`.
- `.AIN`, `.Q1`, `.A`, `.Y`, `.D0`, `.D1`, `.CLK` são **pins** das instâncias.
- `bus0`, `bus1`, `INV0`, `INV1` são **nets**.
- `INVX1*` representa uma **library cell** (célula de biblioteca), não um subdesign RTL.

---

### Slide 2 - Design Objects: VHDL Perspective

Texto central:

O mesmo conceito aparece em VHDL:

```vhdl
entity TOP is
  port (
    A, B, C, D, CLK : in  STD_LOGIC;
    OUT1            : out STD_LOGIC_VECTOR (1 downto 0)
  );
end TOP;

architecture STRUCTURAL of TOP is
  signal INV1, INV0, bus1, bus0 : STD_LOGIC;
begin
  U1: ENCODER port map (AIN => A, Q1 => BUS1);
  U2: INVX1*  port map (A => bus0, Y => INV0);
  U3: INVX1*  port map (A => bus1, Y => INV1);
  U4: REGFILE port map (D0 => INV0, D1 => INV1, CLK => CLK);
end STRUCTURAL;

entity ENCODER is ...
```

Interpretação:

- `entity TOP` é o design principal.
- `port (...)` define os ports.
- `signal INV1, INV0, bus1, bus0` cria nets internas.
- `U1`, `U2`, `U3`, `U4` são cells/instâncias.
- `INVX1*` indica uma célula vinda da biblioteca tecnológica.
- `ENCODER` pode existir como outro design em memória, se tiver descrição RTL lida/elaborada.

---

### Slide 3 - Design Object Classes: Schematic Perspective

O slide mostra o mesmo projeto em forma de esquemático.

Objetos identificados:

- **design:** bloco hierárquico atual, por exemplo `TOP`;
- **port:** entrada/saída do design atual, por exemplo `A`, `B`, `C`, `D`, `CLK`, `OUT1[1:0]`;
- **clock:** objeto de clock associado, por exemplo `CLK`;
- **cell:** instâncias internas, por exemplo `U1`, `U2`, `U3`, `U4`;
- **pin:** terminais das cells, por exemplo `U1/AIN`, `U1/BIN`, `U4/Q[0]`;
- **net:** fios que conectam pins e ports, por exemplo `bus0`, `bus1`, `INV0`, `INV1`.

Comandos mostrados:

```tcl
get_designs
```

Exemplo de retorno:

```text
{TOP ENCODER REGFILE}
```

```tcl
get_cells
```

Exemplo de retorno dentro de `TOP`:

```text
{U1 U2 U3 U4}
```

```tcl
get_pins
```

Exemplo de retorno dentro de `TOP`:

```text
{U1/AIN U1/BIN ... U4/Q[0] U4/Q[1]}
```

---

### Slide 4 - Design Object Classes: Pergunta sobre `INVX1`

Pergunta do slide:

```text
Why is INVX1 not a design object like ENCODER or REGFILE?
```

Tradução:

```text
Por que INVX1 não é um objeto de design como ENCODER ou REGFILE?
```

Resposta:

`ENCODER` e `REGFILE` são módulos/subdesigns RTL que foram lidos e elaborados dentro da memória do DC NXT. Por isso aparecem como objetos do tipo `design`.

`INVX1`, por outro lado, é uma **library cell** (célula de biblioteca). Ela vem da biblioteca tecnológica, como a biblioteca `.db`, e não do RTL do usuário. Quando aparece instanciada, ela é usada como referência tecnológica, mas não vira um `design` do projeto do mesmo modo que `ENCODER` ou `REGFILE`.

Em termos práticos:

- Use `get_designs` para designs RTL/elaborados.
- Use `get_lib_cells` para células de biblioteca, como `INVX1`, `NAND2`, `DFF`, `AND2`, etc.
- Use `get_cells` para instâncias no design atual, por exemplo `U2`, mesmo que `U2` instancie uma célula de biblioteca `INVX1`.

---

### Slide 5 - Ports Versus Pins

Texto central:

- **Ports** are the inputs and outputs of the current design.
  - They become **pins** if the current design moves up to a parent design.
- **Pins** are the inputs and outputs of any cell that is instantiated in the current design.
  - They become **ports** if the instantiated design is made the current design.

Tradução e interpretação:

- **Ports (portas)** são as entradas e saídas do design atual.
- **Pins (pinos)** são as entradas e saídas de uma instância/cell dentro do design atual.
- A classificação depende do nível hierárquico que você está olhando.

Exemplo conceitual:

Se o `current_design` é `TOP`, a instância `U2` tem o pin `U2/MI`.

Se você entra no design `MID` e ele passa a ser o `current_design`, aquele mesmo ponto funcional pode aparecer como port `MI` do design `MID`.

Ou seja:

```text
No pai:      U2/MI é pin.
No próprio:  MI é port.
```

---

### Slide 6 - Multiple Objects With the Same Name

O slide mostra um caso em que existe um port chamado `SUM` e uma net também chamada `SUM`.

Comando mostrado:

```tcl
set_load 5 SUM
```

Perguntas do slide:

```text
Does SUM refer to the port or the net object?
Does it matter onto which object Design Compiler NXT places the load?
How does one specifically set the load on the port?
```

Tradução:

```text
SUM se refere ao objeto port ou ao objeto net?
Importa em qual objeto o Design Compiler NXT coloca a carga?
Como definir especificamente a carga no port?
```

Interpretação:

Quando há ambiguidade de nome, você não deve depender do nome cru. Use comandos `get_*` para dizer exatamente qual classe de objeto você quer.

Para aplicar carga no port:

```tcl
set_load 5 [get_ports SUM]
```

Para aplicar carga na net:

```tcl
set_load 5 [get_nets SUM]
```

O ponto didático do slide é que nomes iguais podem existir em classes diferentes. O comando fica mais seguro quando você passa uma collection explícita.

---

### Slide 7 - The `get_*` Command

Comando destacado:

```tcl
dc nxt_shell-topo> set_load 5 [get_nets SUM]
```

Texto central:

- Os comandos `get_*` retornam objetos no `current_design`, na memória do DC NXT ou nas bibliotecas.
- Eles podem ser usados sozinhos ou embutidos em outros comandos.
- Objetos podem ser usados com wildcards `?` ou `*`.
- Comandos `get_*` retornam uma collection de objetos de banco de dados que combinam com os argumentos.
- Se nenhum objeto for encontrado, uma collection vazia é retornada.

Exemplos:

```tcl
set_load 5 [get_ports addr_bus*]
```

```tcl
set_load 6 [get_ports "*Y??M Z*"]
```

Interpretação:

O colchete em Tcl executa o comando interno primeiro. Então:

```tcl
set_load 5 [get_ports SUM]
```

significa:

1. Execute `get_ports SUM`.
2. Pegue a collection de ports retornada.
3. Aplique `set_load 5` nessa collection.

---

### Slide 8 - Querying Objects or Hierarchy (1/2)

Texto central:

- A maioria das consultas de objetos é realizada no nível do `current_design`.
- Os nomes dos objetos devem combinar com o atributo `name` da cell.
- `/` é tratado como delimitador de hierarquia em certos comandos.
- Com a opção `-hierarchical`, o comando procura em todas as hierarquias.

Exemplos mostrados:

```tcl
get_cells I_SDRAM_TOP/I_SDRAM_IF/sd_mux*
```

```tcl
get_cells */I_SDRAM_IF/sd_mux*
```

Retorno típico:

```text
{I_SDRAM_TOP/I_SDRAM_IF/sd_mux_0 I_SDRAM_TOP/I_SDRAM_IF/sd_mux_1 ...}
```

Exemplo que não encontra:

```tcl
get_cells *I_SDRAM_IF/sd_mux*
```

Motivo:

O `*` não inclui `/` nessa busca. Por isso o padrão pode falhar se você tenta atravessar hierarquia de maneira genérica.

Com `-hierarchical`:

```tcl
get_cells -hierarchical sd_mux*
```

Retorna correspondências em todas as hierarquias.

Atenção:

```tcl
get_cells -hierarchical */sd_mux*
```

ou

```tcl
get_cells -hierarchical */I_SDRAM_IF/sd_mux*
```

podem falhar porque, nessa forma, `/` não é reconhecido como delimitador de hierarquia da maneira que se espera. A busca hierárquica com `-hierarchical` normalmente quer o padrão do nome local da célula, não o caminho completo.

---

### Slide 9 - Querying Objects or Hierarchy (2/2)

Texto central:

- Com `get_flat_cells`, o delimitador de hierarquia é opcional.
- Os comandos `flat` usam o nome completo dos objetos para busca.
- Também existem:
  - `get_flat_nets`
  - `get_flat_pins`
- Você pode usar expressões regulares com a opção `-regexp`.

Exemplo:

```tcl
get_flat_cells *I_SDRAM_IF*sd_mux*
```

Retorno típico:

```text
{I_SDRAM_TOP/I_SDRAM_IF/sd_mux_0 I_SDRAM_TOP/I_SDRAM_IF/sd_mux_1 ...}
```

Interpretação:

`get_cells -hierarchical` e `get_flat_cells` parecem parecidos, mas não são exatamente iguais.

- `get_cells -hierarchical sd_mux*` busca por cells em níveis hierárquicos usando o nome da cell.
- `get_flat_cells *I_SDRAM_IF*sd_mux*` busca no nome completo achatado, permitindo capturar partes do caminho.

---

### Slide 10 - Querying Objects Associated With Objects

Texto central:

Você pode encontrar objetos associados ou conectados a objetos específicos usando a opção:

```tcl
-of_objects
```

Exemplo:

```tcl
get_cells -of_objects [get_nets net_sdram_clk]
```

Retorno mostrado:

```text
{snps_OCC_controller I_SDRAM_TOP}
```

Interpretação:

Esse comando pergunta:

```text
Quais cells estão associadas/conectadas à net net_sdram_clk?
```

A opção `-of_objects` é muito útil porque permite navegar no banco de dados:

- de uma net para os pins conectados;
- de pins para cells;
- de clocks para ports;
- de cells para pins;
- de nets para drivers e loads, dependendo do comando usado.

---

### Slide 11 - Library Content

Texto central:

Você pode acessar conteúdo de bibliotecas:

```text
libs, lib_cells, lib_pins, lib_attribute, and so on
```

Exemplos:

Bibliotecas:

```tcl
get_libs
```

Célula de biblioteca:

```tcl
get_lib_cells 20nm/OR2_4x
```

Pins da célula de biblioteca:

```tcl
get_lib_pins 20nm/OR2_4x/*
```

Atributos da célula:

```tcl
get_lib_attribute 20nm/OR2_4x area
```

```tcl
get_lib_attribute 20nm/OR2_4x/Y direction
```

Interpretação:

- `get_cells` consulta instâncias do design.
- `get_lib_cells` consulta células disponíveis na biblioteca tecnológica.
- `get_pins` consulta pins de instâncias.
- `get_lib_pins` consulta pins da definição da célula na biblioteca.
- `get_lib_attribute` consulta atributos caracterizados na biblioteca, como área, direção do pin, capacitância, função lógica, etc.

---

### Slide 12 - `get_*` Command Exercise 1/2

O slide mostra o banco de dados em memória do DC NXT, com:

- design `TOP`;
- subdesigns `ENCODER`, `REGFILE`, `PLL`;
- instâncias `I_ENC`, `U1`, `U2`, `I_REG`;
- registradores `Z_reg[0]` e `Z_reg[1]`;
- biblioteca `20nm`;
- bibliotecas genéricas `gtech` e `standard.sldb`.

O exercício pede para usar essa figura para responder às questões do slide seguinte, assumindo:

```text
current design is TOP
```

---

### Slide 13 - `get_*` Command Exercise 2/2

Respostas mostradas no slide:

1. O que `get_designs *` retorna?

```tcl
get_designs *
```

Retorno:

```text
{TOP ENCODER REGFILE PLL}
```

2. O que `get_ports {C? Z*}` retorna?

```tcl
get_ports {C? Z*}
```

Retorno:

```text
{ZOUT[0] ZOUT[1]}
```

3. O que `get_libs` retorna?

```tcl
get_libs
```

Retorno:

```text
{20nm gtech standard.sldb}
```

4. Como determinar todas as células da biblioteca `20nm` que começam com `INV`?

```tcl
get_lib_cells 20nm/INV*
```

Retorno:

```text
{20nm/INV1 20nm/INV2 20nm/INV3 ...}
```

5. Como determinar todas as cells na hierarquia inteira com underscore `_` no nome?

```tcl
get_cells -hier *_*
```

Retorno:

```text
{I_ENC I_REG I_REG/Z_reg[0] I_REG/Z_reg[1]}
```

6. Como determinar todos os pins `Q*` de todos os módulos sob `TOP`?

```tcl
get_pins */Q*
```

Retorno:

```text
{I_ENC/Q0 I_ENC/Q1 I_REG/Q[0] I_REG/Q[1]}
```

7. Como determinar todos os pins `Q` dentro de `REGFILE`?

```tcl
get_pins I_REG/*/Q
```

Retorno:

```text
{I_REG/Z_reg[0]/Q I_REG/Z_reg[1]/Q}
```

---

### Slide 14 - Some Handy `all_*` Commands

Comandos úteis:

Retorna todos os input e inout ports do design atual:

```tcl
all_inputs
```

Retorna todos os output e inout ports do design atual:

```tcl
all_outputs
```

Retorna todos os clocks definidos a partir do design atual no nível atual ou abaixo:

```tcl
all_clocks
```

Retorna todas as cells de registrador na hierarquia inteira do design atual:

```tcl
all_registers
```

Interpretação:

Os comandos `all_*` são atalhos muito usados em constraints e relatórios. Eles não aceitam nomes arbitrários como argumento do mesmo modo que os `get_*`.

---

### Slide 15 - `all_*` Command Exercise 1/3

O slide mostra o mesmo design do exercício anterior e pede para usar a figura nas perguntas seguintes.

Hipótese:

```text
current design is TOP
```

---

### Slide 16 - `all_*` Command Exercise 2/3

Respostas mostradas:

1. O que `all_inputs` retorna?

```tcl
all_inputs
```

Retorno:

```text
{A B C D CLK}
```

2. O que `all_outputs` retorna?

```tcl
all_outputs
```

Retorno:

```text
{ZOUT[0] ZOUT[1]}
```

3. O que `all_registers` retorna?

```tcl
all_registers
```

Retorno:

```text
{I_REG/Z_reg[0] I_REG/Z_reg[1]}
```

4. O que `all_inputs C*` retorna?

```tcl
all_inputs C*
```

Retorno:

```text
Error: extra positional option 'C*' (CMD-012)
```

Motivo:

Os comandos `all_*` não aceitam um nome de objeto como argumento posicional. Se quiser filtrar, use um comando de collection, como `filter_collection`, ou combine com `get_ports`.

---

### Slide 17 - `all_*` Command Exercise 3/3

Comando mostrado:

```tcl
remove_from_collection [all_inputs] [get_ports CLK]
```

Retorno:

```text
{A B C D}
```

Interpretação:

Esse comando pega todos os inputs e remove o clock `CLK` da collection. Isso é muito comum em scripts de constraints, por exemplo para aplicar input delay em todas as entradas exceto clock:

```tcl
set_input_delay 2.0 -clock CLK \
  [remove_from_collection [all_inputs] [get_ports CLK]]
```

Homework (dever de casa) do slide:

Estudar o apêndice desta unidade para aprender mais sobre:

- Accessing and Manipulating Collections (acessando e manipulando coleções)
- Tcl Syntax (sintaxe Tcl)

---

### Slide 18 - Accessing the Synopsys Database

Texto central:

O acesso a objetos do DC NXT via Tcl é feito através de **collections** (coleções), que são uma extensão do Design Compiler NXT ao Tcl padrão.

Exemplo:

```tcl
dc nxt_shell-topo> set foo [get_ports p*]
{pclk pframe_n pidsel pad[31]...}

dc nxt_shell-topo> echo $foo
_sel184
```

Interpretação:

Quando você executa:

```tcl
set foo [get_ports p*]
```

o valor de `foo` não é uma lista Tcl comum. Ele é um **collection handle** (identificador de coleção), uma referência interna para os objetos encontrados.

Por isso:

```tcl
echo $foo
```

pode mostrar algo como:

```text
_sel184
```

Esse `_sel184` não é o nome dos ports; é o identificador interno da collection.

---

### Slide 19 - Accessing and Manipulating Collections

Comandos mostrados:

```tcl
dc nxt_shell-topo> set foo [get_ports p*]
{pclk pframe_n pidsel pad[31]...}

dc nxt_shell-topo> sizeof_collection $foo
50

dc nxt_shell-topo> query_objects $foo
{pclk pframe_n pidsel pad[31]...}
```

Interpretação:

- `sizeof_collection` informa quantos objetos existem dentro da collection.
- `query_objects` expande a collection e mostra os nomes dos objetos.
- Isso é melhor do que tentar manipular a collection como se fosse lista Tcl.

Outro exemplo:

```tcl
dc nxt_shell-topo> set pci_ports [get_ports DATA*]
{DATA[0] DATA[1] DATA[2] ...}

dc nxt_shell-topo> set pci_ports [add_to_collection \
    $pci_ports [get_ports CTRL*]]
{DATA[0] DATA[1] DATA[2] ... CTRL_A CTRL_B}
```

Exemplo destacado:

```tcl
dc nxt_shell-topo> set all_inputs_except_clk \
    [remove_from_collection [all_inputs] \
    [get_ports CLK]]
```

Interpretação:

- `add_to_collection` junta collections.
- `remove_from_collection` subtrai objetos de uma collection.
- Esse padrão é extremamente útil para constraints.

---

### Slide 20 - Filtering Collections

Texto central:

Use `filter_collection` para obter apenas os objetos de interesse.

Exemplos:

```tcl
filter_collection [get_cells *] "ref_name =~ AN*"
```

Retorna cells cuja referência de biblioteca começa com `AN`.

```tcl
filter_collection [get_cells *] "is_mapped != true"
```

Retorna cells que ainda não estão mapeadas.

Atalho com `-filter`:

```tcl
get_cells * -filter "dont_touch == true"
```

```tcl
set fastclks [get_clocks * -filter "period < 10"]
```

Operadores relacionais:

```text
==, !=, >, <, >=, <=, =~, !~
```

Interpretação:

- `==` compara igualdade.
- `!=` compara diferença.
- `>`, `<`, `>=`, `<=` comparam valores numéricos.
- `=~` faz casamento com padrão.
- `!~` significa "não casa com o padrão".

---

### Slide 21 - Iterating Over a Collection

Texto central:

Use `foreach_in_collection` para iterar sobre uma collection.

Exemplo:

```tcl
foreach_in_collection cell [get_cells -hier * -filter \
    "is_hierarchical == true"] {
  echo "Instance [get_object_name $cell] is hierarchical"
}
```

Saída mostrada:

```text
Instance I_Ablock is hierarchical
Instance I_CONTROL is hierarchical
Instance I_Bblock is hierarchical
...
```

Interpretação:

O comando percorre cada cell retornada por:

```tcl
get_cells -hier * -filter "is_hierarchical == true"
```

e imprime o nome de cada instância hierárquica.

Ponto importante:

- Use `foreach` para listas Tcl.
- Use `foreach_in_collection` para collections Synopsys.

---

### Slide 22 - Collection Versus Tcl List Commands

Texto central:

- Tcl lists are structures to store user-defined data.
- Collections are used to access database data.
  - Collections are more memory efficient for this purpose.
- List commands should not be used on collections and vice versa.
  - Use `foreach` to iterate through a list.
  - Use `foreach_in_collection` to iterate through a collection.

Tradução:

- Listas Tcl são estruturas para guardar dados definidos pelo usuário.
- Collections são usadas para acessar dados do banco de dados Synopsys.
- Comandos de lista não devem ser usados em collections, e comandos de collections não devem ser usados em listas.

Resumo prático:

```tcl
# Lista Tcl
set nomes {A B C D}
foreach nome $nomes {
  puts $nome
}

# Collection Synopsys
set ports [get_ports *]
foreach_in_collection p $ports {
  echo [get_object_name $p]
}
```

---

## Aula didática desenvolvida

### 1. Por que esta aula é importante?

Em síntese lógica, constraints e timing, quase tudo depende de selecionar corretamente objetos do design. Um erro de seleção pode fazer uma constraint não ser aplicada, ser aplicada no objeto errado ou simplesmente retornar vazio sem você perceber.

Exemplo:

```tcl
set_load 5 SUM
```

parece simples, mas é ambíguo. `SUM` pode ser:

- um port;
- uma net;
- uma cell;
- parte de um nome hierárquico;
- ou até não existir no `current_design`.

A forma robusta é:

```tcl
set_load 5 [get_ports SUM]
```

ou:

```tcl
set_load 5 [get_nets SUM]
```

Assim você informa explicitamente ao DC NXT qual classe de objeto quer atingir.

---

### 2. O que é um objeto de design?

Um **design object** (objeto de design) é uma entidade que existe no banco de dados interno do Design Compiler NXT. Os principais são:

| Objeto | O que representa | Exemplo |
|---|---|---|
| `design` | módulo/entity elaborada | `TOP`, `ENCODER`, `REGFILE` |
| `cell` | instância dentro de um design | `U1`, `U2`, `I_REG` |
| `port` | entrada/saída do design atual | `A`, `CLK`, `OUT1[0]` |
| `pin` | terminal de uma instância | `U1/AIN`, `I_REG/Z_reg[0]/Q` |
| `net` | conexão/fio interno | `bus0`, `SUM`, `INV0` |
| `clock` | objeto de clock criado por constraint | `CLK` |
| `lib` | biblioteca carregada | `20nm`, `gtech`, `standard.sldb` |
| `lib_cell` | célula da biblioteca | `20nm/INV1`, `20nm/OR2_4x` |
| `lib_pin` | pin de uma célula da biblioteca | `20nm/OR2_4x/Y` |

A distinção é essencial porque os comandos esperam certos tipos de objetos. Por exemplo:

```tcl
set_input_delay
```

normalmente age sobre ports de entrada.

```tcl
set_load
```

pode agir sobre ports ou nets, dependendo do contexto.

```tcl
set_dont_touch
```

pode ser aplicado a cells, designs ou nets, mas o significado muda.

---

### 3. `design`, `cell` e `lib_cell`: três coisas que parecem parecidas, mas não são

Este é um dos pontos mais importantes da aula.

#### `design`

Um `design` é um módulo/entity que o DC NXT conhece como unidade lógica hierárquica.

Exemplo:

```tcl
get_designs *
```

Pode retornar:

```text
{TOP ENCODER REGFILE PLL}
```

Esses nomes correspondem a blocos lidos/elaborados.

#### `cell`

Uma `cell` é uma instância dentro de um design.

Exemplo:

```tcl
get_cells *
```

Pode retornar:

```text
{I_ENC U1 U2 I_REG}
```

`I_ENC` é a instância de `ENCODER`. `I_REG` é a instância de `REGFILE`.

#### `lib_cell`

Uma `lib_cell` é uma definição da biblioteca tecnológica.

Exemplo:

```tcl
get_lib_cells 20nm/INV*
```

Pode retornar:

```text
{20nm/INV1 20nm/INV2 20nm/INV3}
```

Essas células não foram escritas por você no RTL como designs. Elas vêm da biblioteca `.db`.

Por isso `INVX1` não aparece como `design`. Ele é uma célula de biblioteca. A instância `U2` pode existir como `cell`, mas a referência tecnológica dela é uma `lib_cell`.

---

### 4. Port versus pin: depende do nível hierárquico

Um erro comum é pensar que port e pin são propriedades absolutas do sinal. Não são. Eles dependem do ponto de vista.

Se você está olhando para o design `TOP`, a entrada de uma instância é um pin:

```text
U2/MI
```

Mas se você entra no design da instância `U2`, aquele mesmo terminal pode aparecer como port:

```text
MI
```

Então:

- **port:** terminal externo do design atual;
- **pin:** terminal de uma instância dentro do design atual.

Isso aparece muito em constraints. Por exemplo:

```tcl
get_ports CLK
```

procura o port `CLK` no design atual.

```tcl
get_pins U4/CLK
```

procura o pin `CLK` da instância `U4`.

Se você usar o tipo errado, o comando pode retornar vazio.

---

### 5. Por que usar `get_*` em vez de nomes crus?

Porque nomes crus são ambíguos e frágeis.

Ruim:

```tcl
set_load 5 SUM
```

Melhor:

```tcl
set_load 5 [get_ports SUM]
```

ou:

```tcl
set_load 5 [get_nets SUM]
```

Com `get_*`, você força o DC NXT a resolver o nome dentro de uma classe de objetos.

Principais comandos:

```tcl
get_designs
get_cells
get_ports
get_pins
get_nets
get_clocks
get_libs
get_lib_cells
get_lib_pins
```

Você pode usar wildcards:

```tcl
get_ports DATA*
get_cells U*
get_pins */Q
get_lib_cells 20nm/INV*
```

E pode embutir um comando dentro de outro:

```tcl
set_load 5 [get_ports SUM]
```

---

### 6. Como entender `current_design`

Muitos comandos agem no nível do `current_design`.

Se o `current_design` é `TOP`, então:

```tcl
get_ports *
```

retorna os ports de `TOP`.

```tcl
get_cells *
```

retorna as instâncias diretamente dentro de `TOP`.

```tcl
get_pins *
```

retorna pins de instâncias visíveis a partir de `TOP`.

Se você muda o design atual, os mesmos comandos podem retornar objetos diferentes. Por isso, em scripts maiores, é comum garantir explicitamente:

```tcl
current_design MY_TOP
```

antes de aplicar constraints ou executar relatórios.

---

### 7. Hierarquia: `get_cells -hierarchical` versus `get_flat_cells`

O slide chama atenção para uma pegadinha importante.

#### Busca no nível atual

```tcl
get_cells sd_mux*
```

Procura apenas no nível atual.

#### Busca hierárquica

```tcl
get_cells -hierarchical sd_mux*
```

Procura em todas as hierarquias, usando nomes locais das cells.

#### Busca flat

```tcl
get_flat_cells *I_SDRAM_IF*sd_mux*
```

Procura usando o nome completo achatado, incluindo partes do caminho hierárquico.

A diferença prática:

- `get_cells -hierarchical` é bom para "ache todas as instâncias chamadas assim em qualquer nível".
- `get_flat_cells` é bom para "ache objetos cujo caminho completo contém tal padrão".

Em projetos grandes, usar o comando errado pode retornar uma collection vazia ou retornar muito mais do que você queria.

---

### 8. `-of_objects`: navegar pelo banco de dados

A opção `-of_objects` permite encontrar objetos associados a outros objetos.

Exemplo:

```tcl
get_cells -of_objects [get_nets net_sdram_clk]
```

Isso pergunta quais cells estão associadas à net `net_sdram_clk`.

Outros exemplos úteis:

```tcl
get_pins -of_objects [get_cells U1]
```

Retorna pins da instância `U1`.

```tcl
get_nets -of_objects [get_pins U1/Q]
```

Retorna a net conectada ao pin `U1/Q`.

```tcl
get_ports -of_objects [get_clocks CLK]
```

Pode retornar ports associados ao clock, dependendo do contexto de definição.

Esse tipo de navegação é muito útil em debug, principalmente quando você não sabe exatamente o nome do objeto, mas sabe a que ele está conectado.

---

### 9. Conteúdo de biblioteca

Na biblioteca lógica/tecnológica, você encontra informações como:

- células disponíveis;
- pins de cada célula;
- função lógica;
- área;
- capacitância;
- direção do pin;
- timing arcs;
- constraints de transição/capacitância.

Exemplos:

```tcl
get_libs
```

```tcl
get_lib_cells 20nm/OR2_4x
```

```tcl
get_lib_pins 20nm/OR2_4x/*
```

```tcl
get_lib_attribute 20nm/OR2_4x area
```

```tcl
get_lib_attribute 20nm/OR2_4x/Y direction
```

Isso permite consultar diretamente a biblioteca sem abrir manualmente o `.lib` ou `.db`.

---

### 10. `all_*`: atalhos úteis, mas com limitações

Comandos como:

```tcl
all_inputs
all_outputs
all_clocks
all_registers
```

são úteis porque retornam coleções prontas.

Exemplo:

```tcl
all_inputs
```

Retorna todos os input e inout ports do design atual.

Mas eles não aceitam padrões como argumento da mesma forma que `get_ports`.

Errado:

```tcl
all_inputs C*
```

Isso gera erro porque `all_inputs` não espera um nome como argumento posicional.

Para filtrar, use:

```tcl
filter_collection [all_inputs] "name =~ C*"
```

ou use diretamente:

```tcl
get_ports C*
```

Um uso muito comum:

```tcl
remove_from_collection [all_inputs] [get_ports CLK]
```

Esse comando retorna todos os inputs exceto `CLK`.

---

### 11. Collections: o coração dos scripts Synopsys

Uma collection é uma referência eficiente para objetos do banco de dados Synopsys.

Quando você faz:

```tcl
set foo [get_ports p*]
```

`foo` não guarda uma lista Tcl comum. Ele guarda um handle, algo como:

```text
_sel184
```

Para ver o conteúdo da collection:

```tcl
query_objects $foo
```

Para contar os objetos:

```tcl
sizeof_collection $foo
```

Para juntar collections:

```tcl
add_to_collection $a $b
```

Para remover objetos:

```tcl
remove_from_collection $a $b
```

Para filtrar:

```tcl
filter_collection $a "attribute == value"
```

Para iterar:

```tcl
foreach_in_collection obj $collection {
  echo [get_object_name $obj]
}
```

---

## Conceitos difíceis explicados em profundidade

### Conceito 1 - O que é uma collection?

Uma **collection** é uma estrutura interna usada pela Synopsys para representar um conjunto de objetos do banco de dados.

Ela não é uma lista Tcl comum. Isso fica claro no exemplo:

```tcl
set foo [get_ports p*]
echo $foo
```

A saída pode ser:

```text
_sel184
```

Esse `_sel184` é um identificador interno. Para ver os objetos:

```tcl
query_objects $foo
```

Para contar:

```tcl
sizeof_collection $foo
```

Erro comum:

```tcl
foreach p $foo {
  puts $p
}
```

Isso tenta tratar a collection como lista Tcl. O correto é:

```tcl
foreach_in_collection p $foo {
  echo [get_object_name $p]
}
```

---

### Conceito 2 - Lista Tcl versus collection Synopsys

Lista Tcl:

```tcl
set nomes {A B C D}
foreach n $nomes {
  puts $n
}
```

Collection:

```tcl
set ports [get_ports *]
foreach_in_collection p $ports {
  echo [get_object_name $p]
}
```

A lista Tcl é para dados comuns. A collection é para objetos do banco de dados. Embora às vezes pareçam semelhantes na tela, internamente são diferentes.

Regra prática:

| Situação | Use |
|---|---|
| Dados criados por você | lista Tcl |
| Objetos do design/biblioteca | collection |
| Iterar lista | `foreach` |
| Iterar collection | `foreach_in_collection` |
| Ver nomes de objetos da collection | `query_objects` ou `get_object_name` |
| Contar objetos da collection | `sizeof_collection` |

---

### Conceito 3 - Wildcards e hierarquia

Wildcards são úteis, mas perigosos.

Exemplo simples:

```tcl
get_ports DATA*
```

Retorna ports que começam com `DATA`.

Mas em hierarquia, o `/` pode ter tratamento especial.

Exemplo:

```tcl
get_cells I_SDRAM_TOP/I_SDRAM_IF/sd_mux*
```

Aqui o `/` representa caminho hierárquico.

Com `-hierarchical`, muitas vezes o comando espera o nome local:

```tcl
get_cells -hierarchical sd_mux*
```

Se você tentar misturar caminho com `-hierarchical`, pode não obter o resultado esperado:

```tcl
get_cells -hierarchical */I_SDRAM_IF/sd_mux*
```

Para busca por caminho completo, use comandos flat:

```tcl
get_flat_cells *I_SDRAM_IF*sd_mux*
```

---

### Conceito 4 - Filtros por atributos

Objetos no DC NXT têm atributos. Por exemplo:

- `name`
- `ref_name`
- `is_mapped`
- `dont_touch`
- `is_hierarchical`
- `period`, no caso de clocks
- `direction`, no caso de pins/ports
- `area`, no caso de células de biblioteca

Você pode filtrar assim:

```tcl
get_cells * -filter "dont_touch == true"
```

Ou:

```tcl
filter_collection [get_cells *] "ref_name =~ AN*"
```

Exemplo prático:

```tcl
set fastclks [get_clocks * -filter "period < 10"]
```

Isso cria uma collection apenas com clocks de período menor que 10 unidades de tempo.

---

### Conceito 5 - `get_object_name`

Quando você está dentro de um loop sobre collection, a variável não é o texto do nome. Ela é um handle de objeto.

Por isso:

```tcl
foreach_in_collection cell [get_cells *] {
  echo $cell
}
```

pode não imprimir o nome esperado.

Use:

```tcl
foreach_in_collection cell [get_cells *] {
  echo [get_object_name $cell]
}
```

Esse comando converte o handle do objeto para o nome legível.

---

## Figuras, diagramas e waveforms importantes

### Figura dos slides 1 e 2 - Verilog/VHDL com objetos marcados

Essas figuras são importantes porque mostram que a mesma estrutura lógica pode ser vista como código ou como banco de dados de objetos. O RTL é apenas a entrada textual. Depois de lido/elaborado, o DC NXT transforma esse RTL em objetos manipuláveis.

O que estudar:

- identificar o que é design;
- identificar o que é port;
- identificar o que é cell;
- identificar o que é pin;
- identificar o que é net;
- separar cell instanciada de library cell.

---

### Figura dos slides 3 e 4 - Esquemático com classes de objetos

A figura mostra `TOP` contendo `U1`, `U2`, `U3` e `U4`. Ela ajuda a fixar a relação:

```text
design contém cells;
cells têm pins;
pins são conectados por nets;
ports ligam o design ao exterior.
```

O ponto principal da pergunta é entender por que `INVX1` não é design: ele é uma definição da biblioteca tecnológica, enquanto `ENCODER` e `REGFILE` são designs lidos/elaborados.

---

### Figura dos slides 5 e 6 - Port versus pin e ambiguidade de nome

A figura de port versus pin ensina que o mesmo terminal muda de categoria conforme o nível hierárquico. A figura com `SUM` ensina que um mesmo nome pode existir como net e port.

Mensagem prática:

```tcl
set_load 5 SUM
```

é menos seguro que:

```tcl
set_load 5 [get_ports SUM]
```

ou:

```tcl
set_load 5 [get_nets SUM]
```

---

### Figura dos slides 12 e 13 - Exercício `get_*`

Essa figura é boa para treinar mentalmente a navegação no banco de dados. Ela combina designs, instances, nets, pins, library cells e libraries.

Estude especialmente:

```tcl
get_designs *
get_ports {C? Z*}
get_libs
get_lib_cells 20nm/INV*
get_cells -hier *_*
get_pins */Q*
get_pins I_REG/*/Q
```

---

### Figura dos slides 15 a 17 - Exercício `all_*`

A figura reforça que `all_inputs`, `all_outputs` e `all_registers` retornam collections prontas. O detalhe de prova é que `all_inputs C*` é inválido.

A forma correta de remover o clock dos inputs é:

```tcl
remove_from_collection [all_inputs] [get_ports CLK]
```

---

## Pontos de prova e revisão

1. **`get_*` retorna collections, não listas Tcl comuns.**

2. **`port` é entrada/saída do design atual; `pin` é entrada/saída de uma cell instanciada.**

3. **A classificação port/pin depende do `current_design`.**

4. **`INVX1` não é design como `ENCODER`; `INVX1` é library cell.**

5. **Use `[get_ports SUM]` ou `[get_nets SUM]` para evitar ambiguidade.**

6. **`get_cells -hierarchical` busca na hierarquia; `get_flat_cells` busca pelo nome completo achatado.**

7. **`/` pode funcionar como delimitador de hierarquia em alguns contextos, mas não deve ser usado de qualquer forma com `-hierarchical`.**

8. **`-of_objects` permite navegar entre objetos associados.**

9. **`all_inputs`, `all_outputs`, `all_clocks`, `all_registers` são atalhos úteis, mas não aceitam padrões como argumento comum.**

10. **Para remover clock dos inputs:**

```tcl
remove_from_collection [all_inputs] [get_ports CLK]
```

11. **Para contar objetos em uma collection:**

```tcl
sizeof_collection $collection
```

12. **Para mostrar objetos dentro da collection:**

```tcl
query_objects $collection
```

13. **Para iterar sobre collection:**

```tcl
foreach_in_collection obj $collection {
  echo [get_object_name $obj]
}
```

14. **Para filtrar por atributo:**

```tcl
get_cells * -filter "dont_touch == true"
```

15. **Para procurar células de biblioteca:**

```tcl
get_lib_cells 20nm/INV*
```

---

## Relação com projeto/laboratório

Esta aula é diretamente útil para scripts de síntese e debug no DC NXT. Quando você começar a escrever ou interpretar scripts `.tcl`, vai encontrar comandos como:

```tcl
set_input_delay
set_output_delay
set_load
set_driving_cell
set_dont_touch
report_timing
report_constraint
compile_ultra
```

Quase todos esses comandos precisam de objetos selecionados corretamente.

Exemplo típico de constraints:

```tcl
create_clock -name CLK -period 10 [get_ports CLK]

set_input_delay 2.0 -clock CLK \
  [remove_from_collection [all_inputs] [get_ports CLK]]

set_output_delay 2.0 -clock CLK [all_outputs]
```

Sem entender collections, ports, pins e hierarquia, esse script vira uma sequência de comandos decorados. Com esta aula, ele passa a fazer sentido:

- `get_ports CLK` seleciona o port de clock;
- `all_inputs` pega todos os inputs;
- `remove_from_collection` remove o clock da lista de inputs;
- `all_outputs` seleciona os outputs;
- as constraints são aplicadas aos objetos corretos.

Essa base também ajuda a interpretar mensagens de erro do tipo:

```text
Warning: No objects matched ...
```

ou:

```text
Error: extra positional option ...
```

Esses erros geralmente significam que você selecionou o tipo errado de objeto, usou um comando `all_*` com argumento indevido ou tratou collection como lista Tcl.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
