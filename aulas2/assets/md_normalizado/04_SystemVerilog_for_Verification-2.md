# 04 SystemVerilog for Verification-2

## Controle do bloco

- **Bloco:** 013
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\04 SystemVerilog for Verification-2.docx`
- **Faixa processada:** slides visíveis 1-8 + questões finais, distribuídos em 5 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\04 SystemVerilog for Verification-2.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O bloco atual é `04 SystemVerilog for Verification-2`; a próxima sugestão foi feita seguindo a sequência numérica provável da seção `03 SystemVerilog Refresher`, mas sem afirmar existência caso o arquivo não esteja na pasta.
- **Próximo bloco recomendado:** 014 — `05 SystemVerilog Reference Designs` — confirmar existência na pasta antes de anexar
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: como solicitado, os conceitos de alto nível foram aprofundados, especialmente constraints, distribuição ponderada, `rand`, `randc`, `inside`, `solve before`, `constraint_mode()`, particionamento de memória, coverage, covergroups, coverpoints, bins, code coverage, functional coverage e assertions.

---

## Resumo executivo

Esta aula aprofunda três pilares de **SystemVerilog para verificação funcional**:

```text
constraints
coverage
assertions
```

O bloco começa com **constraints**, mostrando como SystemVerilog permite gerar estímulos randômicos dentro de faixas legais, evitando valores inválidos para o cenário testado. A aula apresenta o operador `inside`, a distribuição ponderada com `dist`, os operadores `:=` e `:/`, variáveis `rand` e `randc`, randomização de arrays e queues, constraints estáticas e o uso de constraints para particionar regiões de memória.

Depois, a aula entra em **coverage**, explicando que CRV — Constraint Random Verification — não é suficiente por si só. O teste pode gerar muitos valores, mas é preciso medir se as funcionalidades importantes foram realmente exercitadas. Para isso, SystemVerilog usa `covergroup`, `coverpoint`, `bins` e cross coverage. A aula também diferencia **code coverage** e **functional coverage**, incluindo métricas como line, toggle, condition, branch e FSM coverage.

Por fim, o bloco apresenta **assertions**, que verificam propriedades do design durante a simulação. A aula diferencia `assert`, `assume`, `cover` e `restrict`, além de separar assertions em immediate e concurrent. Também aparecem os conceitos de `sequence`, `property`, `assert property` e funções temporais como `$rose`, `$fell` e `$stable`.

Os pontos de prova mais importantes são:

```text
O gabarito do curso aceita que só há operadores relacionais >, <, <=, >= em expressions.
Generator pushes data para a mailbox.
Driver pops data da mailbox.
find_last() exige cláusula with; max() não.
:= é usado como distribution operator.
```

---

## Texto extraído e organizado por slide

### Slide 1 — Constraints in SystemVerilog (1/4)

O slide introduz constraints em SystemVerilog.

Pontos principais:

- Sistemas digitais complexos exigem estímulos randômicos para descobrir bugs escondidos no design.
- SystemVerilog dá flexibilidade ao designer para especificar constraints ou ranges dentro dos quais o algoritmo interno gera dados randômicos.
- Constraints são valores legalmente permitidos que o design pode processar dentro de um cenário definido.
- O exemplo mostra geração randômica de endereço menor que `8'hB` usando uma constraint na classe.
- Um bloco de constraint contém apenas expressões.
- O operador `inside` é usado para restringir uma variável dentro de uma faixa.
- O operador `!` pode ser usado com `inside` para definir valores fora da faixa.

Exemplo didático simples:

```systemverilog
class downstream_data;
  rand bit [7:0] addr;
  rand bit [7:0] data;

  constraint addr_range {
    addr <= 8'h0B;
  }
endclass
```

Interpretação:

A variável `addr` é randômica, mas não pode assumir qualquer valor. O solver de SystemVerilog escolhe valores randômicos que respeitam a regra:

```text
addr <= 8'h0B
```

Exemplo com `inside`:

```systemverilog
class myClass;
  rand bit [7:0] min, typ, max;

  constraint pow_range {
    typ > min;
    typ < max;
    min inside {8'h10, 8'h20, 8'h30};
    max inside {[8'h80:8'hFF]};
  }
endclass
```

Exemplo com negação:

```systemverilog
constraint not_forbidden {
  !(addr inside {[8'h40:8'h4F]});
}
```

Interpretação:

O operador `inside` é uma forma limpa de dizer:

```text
este valor deve pertencer a este conjunto ou intervalo
```

Com `!`, a regra vira:

```text
este valor não deve pertencer a este conjunto ou intervalo
```

---

### Slide 2 — Constraints in SystemVerilog (2/4)

O slide apresenta **weighted distribution**.

Pontos principais:

- O operador de distribuição `:=` é usado para ter distribuição ponderada de números randômicos.
- Isso significa que alguns números aparecem com mais frequência do que outros dentro da faixa de randomização.
- Outro operador, `:/`, é usado para especificar peso de distribuição, como mostrado no segundo exemplo.
- A função `rand` pode ser aplicada a qualquer variável e usada para gerar números randômicos com distribuição uniforme e igual probabilidade.
- A função `randc`, ou random cyclic, percorre todos os valores randômicos antes de repetir.
- SystemVerilog suporta randomização de arrays e queues.
- A probabilidade de distribuição de números randômicos pode ser alterada usando o construct `solve before`.

#### Distribuição com `dist`

Exemplo com `:=`:

```systemverilog
class Packet;
  rand bit [7:0] data;

  constraint weighted_data {
    data dist {
      8'h00 := 5,
      8'hFF := 1,
      [8'h10:8'h1F] := 2
    };
  }
endclass
```

Interpretação de `:=`:

```text
cada valor ou item recebe o peso indicado
```

No caso de uma faixa, cada valor da faixa recebe aquele peso.

Exemplo com `:/`:

```systemverilog
class Packet;
  rand bit [7:0] data;

  constraint weighted_data {
    data dist {
      8'h00 := 5,
      [8'h10:8'h1F] :/ 8
    };
  }
endclass
```

Interpretação de `:/`:

```text
o peso é dividido entre os valores da faixa
```

Assim, `:=` e `:/` são parecidos visualmente, mas têm efeito diferente quando usados em ranges.

#### `rand` versus `randc`

```systemverilog
class Example;
  rand  bit [3:0] a;
  randc bit [3:0] b;
endclass
```

- `rand`: pode repetir valores livremente, seguindo as constraints.
- `randc`: percorre todos os valores possíveis antes de repetir, respeitando constraints.

#### `solve before`

Exemplo conceitual:

```systemverilog
class Packet;
  rand bit kind;
  rand bit [7:0] data;

  constraint relation {
    if (kind == 1)
      data inside {[8'h80:8'hFF]};
    else
      data inside {[8'h00:8'h7F]};
  }

  constraint order {
    solve kind before data;
  }
endclass
```

Interpretação:

`solve before` altera a ordem de solução e pode mudar a distribuição final. Ele não cria uma nova regra funcional por si só, mas influencia como o solver escolhe valores dependentes.

---

### Slide 3 — Constraints in SystemVerilog (3/4)

O slide apresenta **static constraints**.

Pontos principais:

- Assim como variáveis estáticas de classe, constraints também podem ser estáticas.
- Constraints estáticas são aplicadas através das classes.
- Elas usam a keyword `static constraint`.
- Por padrão, constraints são não estáticas.
- Constraints podem ser desligadas usando a função SystemVerilog `constraint_mode()`.

Exemplo do slide:

```systemverilog
class my_class;
  rand bit [7:0] addr;
  rand bit [7:0] data;

  static constraint addr_range {
    addr <= 8'h0B;
  }
endclass
```

Interpretação:

Uma constraint estática pertence ao escopo da classe, não apenas a uma instância isolada. Isso é parecido com uma variável `static`: ela está associada à classe de modo compartilhado.

#### `constraint_mode()`

Exemplo:

```systemverilog
class Packet;
  rand bit [7:0] addr;

  constraint low_addr {
    addr < 8'h40;
  }
endclass

initial begin
  Packet p = new();

  p.low_addr.constraint_mode(0); // desliga a constraint
  assert(p.randomize());

  p.low_addr.constraint_mode(1); // liga novamente
  assert(p.randomize());
end
```

Interpretação:

`constraint_mode(0)` desativa uma constraint; `constraint_mode(1)` reativa. Isso é útil para reutilizar a mesma classe em testes diferentes.

---

### Slide 4 — Constraints in SystemVerilog (4/4)

O slide mostra o uso de constraints para **particionar memórias** no design.

Ponto principal:

```text
Constraints are used to partition the memories in design.
```

O exemplo mostra uma classe `MemoryBlock` com campos como:

- `m_ram_start`
- `m_ram_end`
- `m_start_addr`
- `m_end_addr`
- `m_block_size`

A ideia é randomizar um bloco de memória válido dentro de uma RAM.

Exemplo didático reconstruído:

```systemverilog
class MemoryBlock;
  bit [31:0] m_ram_start;   // endereço inicial da RAM
  bit [31:0] m_ram_end;     // endereço final da RAM

  rand bit [31:0] m_start_addr;  // ponteiro para início do bloco
  rand bit [31:0] m_end_addr;    // ponteiro para fim do bloco
  rand int        m_block_size;  // tamanho do bloco em KB

  constraint c_block_size {
    m_block_size inside {64, 128, 512};
  }

  constraint c_addr {
    m_start_addr >= m_ram_start;
    m_end_addr   <= m_ram_end;

    m_end_addr == m_start_addr + m_block_size - 1;

    // exemplo de alinhamento
    m_start_addr[5:0] == 6'b0;
  }

  function void display();
    $display("RAM start = 0x%0h", m_ram_start);
    $display("RAM end   = 0x%0h", m_ram_end);
    $display("Block start = 0x%0h", m_start_addr);
    $display("Block end   = 0x%0h", m_end_addr);
    $display("Block size  = %0d KB", m_block_size);
  endfunction
endclass
```

Interpretação:

Esse é um exemplo realista de CRV. Em vez de escolher manualmente blocos de memória, o testbench randomiza regiões válidas obedecendo regras:

```text
o bloco deve caber na RAM
o tamanho deve ser um dos permitidos
o endereço deve estar alinhado
o endereço final depende do início e do tamanho
```

---

### Slide 5 — Coverage in SystemVerilog (1/3)

O slide introduz **coverage**.

Pontos principais:

- CRV — Constraint Random Verification — é usado para verificar funcionalidades randômicas que não são cobertas por testes dirigidos.
- Para garantir que o objetivo foi atingido, usa-se coverage.
- Functional coverage é importante para checar se a funcionalidade-alvo do design foi verificada usando CRV.
- Functional coverage ajuda a avaliar a qualidade da verificação feita.
- Ela checa se a funcionalidade geral da implementação foi exercitada.
- Simuladores capturam grupos funcionais cobertos em testes e permitem análise acumulativa.
- Para atingir 100% da meta de verificação e permitir que o simulador capture coverage, SystemVerilog suporta constructs para coletar coverage.
- Variáveis no design são chamadas de coverage points.
- Um conjunto de coverage points no design forma covergroups.
- Multiple covergroups podem capturar conjuntos de coverpoints que definem uma feature.
- Bins são cobertos quando o teste exercita os coverpoints.
- Exemplo: quando um teste cobre `my_reg1_0`, o bin `feature1` é considerado coberto.

#### Covergroup

Exemplo didático:

```systemverilog
class Packet;
  rand bit [7:0] my_reg1;
  rand bit [7:0] my_reg2;

  covergroup myCov;
    coverpoint my_reg1 {
      bins feature1 = {8'h00};
      bins feature2 = {[8'h10:8'h1F]};
      bins feature3 = {[8'h80:8'hFF]};
    }

    coverpoint my_reg2 {
      bins low  = {[0:63]};
      bins mid  = {[64:127]};
      bins high = {[128:255]};
    }
  endgroup

  function new();
    myCov = new();
  endfunction
endclass
```

Interpretação:

O covergroup define o que o testbench quer medir. Randomizar valores sem medir coverage é como atirar no escuro: você não sabe quais regiões funcionais foram exercitadas.

#### Cross coverage

Exemplo:

```systemverilog
covergroup cg;
  coverpoint opcode;
  coverpoint burst_len;

  cross opcode, burst_len;
endgroup
```

Interpretação:

Cross coverage mede combinações. Por exemplo:

```text
testei cada opcode com cada tamanho de burst?
```

---

### Slide 6 — Coverage in SystemVerilog (2/3)

O slide mostra coverage no fluxo com VCS/Verdi.

Pontos principais:

- VCS monitora a execução do código HDL durante a simulação.
- Opções de simulador para dump de coverage são desabilitadas por padrão.
- Elas podem ser habilitadas fornecendo opções de coverage ao simulador.
- O arquivo de coverage é escrito pelo simulador quando habilitado.
- Ferramentas de coverage como Verdi são usadas para visualizar os dados de coverage gerados durante a simulação.
- O comando para invocar Verdi permite analisar a coverage gerada.
- A figura mostra um snapshot do Verdi para análise de coverage.
- Module-wise cover count statistics são exibidas de forma amigável.
- Bins cobertos e não cobertos são coloridos.
- Cross reference para o código-fonte ajuda a planejar testes direcionados adicionais.

Comando conceitual para habilitar coverage no VCS:

```bash
vcs -cm line+cond+tgl+fsm+branch+assert ...
```

Execução:

```bash
./simv -cm line+cond+tgl+fsm+branch+assert
```

Abertura no Verdi:

```bash
verdi -cov -covdir simv.vdb
```

Interpretação:

Coverage não acontece automaticamente. É preciso compilar/rodar com opções de coverage e depois analisar os resultados. A ferramenta mostra o que já foi coberto e o que ainda precisa de novos testes.

---

### Slide 7 — Coverage in SystemVerilog (3/3)

O slide classifica métricas de **code coverage**.

Métricas:

#### Line coverage

Mede quais statements do código HDL foram executados durante a simulação.

Exemplo:

```text
Esta linha do RTL foi executada ao menos uma vez?
```

#### Toggle coverage

Mede bits de lógica que alternaram durante a simulação.

Um toggle significa:

```text
0 → 1
ou
1 → 0
```

É uma das métricas mais antigas de coverage em hardware e pode ser usada em RTL e gate-level.

#### Condition coverage

Mede como variáveis ou subexpressões em statements condicionais foram avaliadas durante simulação.

Ajuda a encontrar erros em condições que outras métricas não detectam.

Exemplo:

```systemverilog
if (a && b)
```

Condition coverage pergunta:

```text
a foi 0 e 1?
b foi 0 e 1?
a && b foi verdadeiro e falso?
```

#### Branch coverage

Mede cobertura de expressões e statements de controle de fluxo, como:

- `if`
- `case`
- `while`

Foca nos pontos de decisão que afetam o fluxo de execução do HDL.

#### FSM coverage

Verifica se:

- todos os estados legais da máquina de estados foram visitados;
- todas as transições legais entre estados foram cobertas.

#### Functional coverage

Checa a funcionalidade geral do design. Para realizar functional coverage, o engenheiro precisa definir coverage points para as funções que devem ser cobertas no DUT.

#### VCS e covergroups

O slide destaca que o VCS suporta:

- NTB — Native Testbench;
- modelos de SystemVerilog covergroup.

Covergroups especificados no design permitem que o VCS monitore valores e transições para variáveis e sinais, além de habilitar cross coverage entre variáveis e sinais.

Interpretação:

Code coverage mede o que o código executou. Functional coverage mede se os cenários funcionais importantes aconteceram. As duas são complementares.

---

### Slide 8 — Assertions in SystemVerilog

O slide apresenta assertions.

Pontos principais:

- SystemVerilog checa propriedades definidas no design.
- Diferentes tipos de assertions são listados na tabela.
- Diferentes componentes de assertions:
  - sequence: sequência de múltiplos eventos lógicos;
  - property: conjunto de sequences definindo uma função lógica.
- Tipos de assertions:
  - immediate: logic statement;
  - concurrent: clock dependent.

Tabela reconstruída:

| Tipo | Descrição |
|---|---|
| `assert` | Especifica que uma propriedade do design é verdadeira na simulação. |
| `assume` | Especifica que uma propriedade é uma suposição usada por ferramentas formais para gerar estímulos de entrada. |
| `cover` | Avalia a propriedade para functional coverage. |
| `restrict` | Especifica a propriedade como constraint em computações de formal verification e é ignorada por simuladores. |

Exemplo de property:

```systemverilog
property p_ack;
  @(posedge clk)
  req ##[1:2] ack;
endproperty

assert property (p_ack);
```

Interpretação:

A property diz que, após `req`, espera-se `ack` em um intervalo de 1 a 2 ciclos. O `assert property` checa essa regra durante a simulação.

#### Sequence

Forma conceitual:

```systemverilog
sequence TestSequence;
  req ##1 ack;
endsequence
```

#### Property usando sequence

```systemverilog
property TestProperty;
  @(posedge clk)
  TestSequence;
endproperty
```

#### Assertion

```systemverilog
assert property (TestProperty);
```

#### Funções que suportam assertions

O slide cita:

- `$rose`: detecta borda de subida.
- `$fell`: detecta borda de descida.
- `$stable`: detecta se o sinal permaneceu estável por um tempo especificado.

Exemplos:

```systemverilog
assert property (@(posedge clk) $rose(req) |-> ##1 ack);

assert property (@(posedge clk) valid |-> $stable(addr));

assert property (@(posedge clk) $fell(reset_n) |-> !valid);
```

Interpretação:

Assertions permitem escrever regras temporais do design diretamente no código de verificação. Elas detectam violações perto da causa.

---

### Slide 9 — Questão 1

**Questão:** There can be only relational operators `>`, `<`, `<=`, `>=` in expressions.

Alternativas:

- True
- False

**Resposta correta aceita pelo curso:** True.

**Tradução:** Só pode haver operadores relacionais `>`, `<`, `<=`, `>=` em expressões.

**Justificativa pelo curso:** A questão aparece logo após os slides de constraints. O gabarito marcado como correto é **True**. Para este banco, priorizar a interpretação simplificada do curso: as expressions de constraints apresentadas usam operadores relacionais para restringir faixas e valores.

Observação técnica: em SystemVerilog real, constraint expressions podem usar outros operadores e constructs, como `inside`, `dist`, implicações, condicionais e combinações lógicas. Porém, para a questão específica do curso, o gabarito aceito é **True**.

---

### Slide 10 — Questão 2

**Questão:** Generator ______ the data to/from the mailbox.

Alternativas:

- A. pushes and pops
- B. pops
- C. pushes

**Resposta correta:** C. pushes.

**Tradução:** O generator empurra/envia os dados para a mailbox.

**Justificativa:** No padrão generator-driver, o generator cria transações e usa `put()` para colocar os dados na mailbox. Portanto, ele **pushes**.

---

### Slide 11 — Questão 3

**Questão:** Driver ______ the data to/from mailbox.

Alternativas:

- A. pushes
- B. pops
- C. pushes and pops

**Resposta correta:** B. pops.

**Tradução:** O driver retira os dados da mailbox.

**Justificativa:** O driver consome transações enviadas pelo generator. Ele usa `get()` para retirar dados da mailbox, portanto ele **pops**.

---

### Slide 12 — Questão 4

**Questão:** Among `find_last()` and `max()`, ______ requires `with` clause mandatorily.

Alternativas:

- A. `find_last()`
- B. `max()`
- C. Both of them

**Resposta correta:** A. `find_last()`.

**Tradução:** Entre `find_last()` e `max()`, `find_last()` exige obrigatoriamente a cláusula `with`.

**Justificativa:** `find_last()` precisa de uma condição para definir “último elemento que satisfaz qual critério?”. Já `max()` possui critério implícito, que é retornar o maior valor.

Exemplo:

```systemverilog
res = array.find_last() with (item < 5);
res = array.max();
```

---

### Slide 13 — Questão 5

**Questão:** ______ is used as a distribution operator.

Alternativas:

- A. `|->`
- B. `->`
- C. `:=`

**Resposta correta:** C. `:=`.

**Tradução:** `:=` é usado como operador de distribuição.

**Justificativa:** Em constraints com `dist`, o operador `:=` define pesos de distribuição.

Exemplo:

```systemverilog
data dist {
  0 := 5,
  1 := 1
};
```

Nesse exemplo, o valor `0` tem peso maior que o valor `1`.

---

## Aula didática desenvolvida

### 1. Por que constraints são tão importantes?

Em designs pequenos, é possível escrever testes dirigidos manualmente:

```text
teste 1: addr = 0
teste 2: addr = 1
teste 3: addr = 2
```

Mas em designs grandes, o espaço de possibilidades explode:

```text
endereços
dados
tipos de comando
tamanhos de burst
alinhamento
reset
latência
ordem de resposta
interrupções
erros
```

É impossível escrever manualmente todos os casos.

Constraints resolvem isso permitindo gerar valores randômicos, mas dentro de regras legais.

```systemverilog
rand bit [7:0] addr;

constraint legal_addr {
  addr inside {[8'h10:8'h7F]};
}
```

Assim, o testbench explora muitos valores sem sair do cenário permitido.

---

### 2. Randomização sem constraint é perigosa

Se você randomiza tudo sem restrição, pode gerar muitos valores inúteis ou ilegais.

Exemplo:

```systemverilog
rand bit [7:0] addr;
```

Isso gera de `0` a `255`.

Mas talvez o protocolo só aceite endereços alinhados de 4 bytes entre `0x20` e `0x7F`.

Constraint correta:

```systemverilog
constraint legal {
  addr inside {[8'h20:8'h7F]};
  addr[1:0] == 2'b00;
}
```

Agora o testbench gera casos variados e válidos.

---

### 3. `inside`: conjunto e intervalo

O operador `inside` é muito expressivo.

Exemplo com conjunto:

```systemverilog
opcode inside {ADD, SUB, AND_OP, OR_OP};
```

Exemplo com intervalo:

```systemverilog
addr inside {[8'h00:8'h3F]};
```

Exemplo misto:

```systemverilog
size inside {1, 2, 4, 8, [16:32]};
```

Exemplo com negação:

```systemverilog
!(addr inside {[8'h40:8'h4F]});
```

Leitura:

```text
addr não pode estar entre 0x40 e 0x4F
```

---

### 4. `dist`, `:=` e `:/`

O operador `dist` permite mudar a probabilidade.

Sem `dist`, a distribuição tende a ser uniforme.

Com `dist`:

```systemverilog
kind dist {
  READ  := 70,
  WRITE := 30
};
```

Leitura:

```text
READ deve aparecer mais que WRITE
```

#### `:=`

```systemverilog
addr dist {
  [0:3] := 10
};
```

Cada valor da faixa recebe peso 10:

```text
0 peso 10
1 peso 10
2 peso 10
3 peso 10
```

#### `:/`

```systemverilog
addr dist {
  [0:3] :/ 10
};
```

O peso 10 é dividido entre todos os valores da faixa.

Resumo:

```text
:=  aplica o peso a cada valor da faixa.
:/  divide o peso entre os valores da faixa.
```

Para a questão de prova, o operador de distribuição cobrado é:

```text
:=
```

---

### 5. `rand` versus `randc`

#### `rand`

Pode repetir valores de forma normal.

```systemverilog
rand bit [1:0] x;
```

Sequência possível:

```text
2, 2, 0, 3, 1, 1, 0
```

#### `randc`

Cíclico: tenta passar por todos os valores antes de repetir.

```systemverilog
randc bit [1:0] x;
```

Sequência possível:

```text
2, 0, 3, 1
depois repete novo ciclo
```

Uso típico:

- `rand`: estímulo randômico geral.
- `randc`: quando você quer evitar repetição antes de cobrir o espaço.

---

### 6. `solve before`: distribuição dependente

Imagine:

```systemverilog
rand bit kind;
rand bit [7:0] addr;

constraint c {
  if (kind)
    addr inside {[128:255]};
  else
    addr inside {[0:127]};
}
```

O solver pode escolher combinações válidas, mas a distribuição pode não ser a desejada.

Com:

```systemverilog
constraint order {
  solve kind before addr;
}
```

você diz:

```text
decida kind primeiro; depois escolha addr conforme kind
```

Isso ajuda a controlar a probabilidade de cenários dependentes.

---

### 7. Static constraints

Uma constraint normal pertence à instância. Uma static constraint pertence à classe.

```systemverilog
static constraint addr_range {
  addr <= 8'h0B;
}
```

Isso deve ser usado com cuidado, porque afeta a classe de modo compartilhado.

`constraint_mode()` permite ligar/desligar constraints:

```systemverilog
obj.addr_range.constraint_mode(0);
```

Isso é útil quando a mesma classe é usada em múltiplos testes.

---

### 8. Constraints para memória

O exemplo de particionamento de memória é importante porque representa problemas reais.

Você pode querer randomizar:

```text
início de bloco
fim de bloco
tamanho
alinhamento
região permitida
```

Com constraints, você garante que o bloco gerado é válido:

```systemverilog
m_start_addr >= m_ram_start;
m_end_addr <= m_ram_end;
m_end_addr == m_start_addr + m_block_size - 1;
m_block_size inside {64, 128, 512};
```

Sem constraints, o testbench poderia gerar blocos fora da RAM, desalinhados ou com tamanho inválido.

---

### 9. Coverage: por que CRV precisa de métrica?

Randomização gera muitos casos. Mas quantidade não é qualidade.

Você pode randomizar mil vezes e ainda não testar um caso crítico.

Coverage responde:

```text
quais funcionalidades foram realmente exercitadas?
quais valores apareceram?
quais combinações aconteceram?
quais estados da FSM foram visitados?
quais branches foram executados?
```

Sem coverage, CRV fica sem direção.

---

### 10. Covergroup, coverpoint e bin

#### Covergroup

Agrupa métricas de coverage.

```systemverilog
covergroup cg @(posedge clk);
  ...
endgroup
```

#### Coverpoint

Variável ou expressão observada.

```systemverilog
coverpoint opcode;
```

#### Bin

Faixa ou valor específico dentro do coverpoint.

```systemverilog
coverpoint opcode {
  bins add = {ADD};
  bins sub = {SUB};
}
```

Leitura:

```text
quando opcode assumir ADD, bin add é coberto
quando opcode assumir SUB, bin sub é coberto
```

---

### 11. Cross coverage

Cross coverage mede combinações.

Exemplo:

```systemverilog
coverpoint opcode;
coverpoint size;

cross opcode, size;
```

Isso responde:

```text
testei cada opcode com cada size?
```

Sem cross coverage, você pode ter testado todos os opcodes e todos os tamanhos, mas não necessariamente todas as combinações.

---

### 12. Code coverage versus functional coverage

#### Code coverage

Pergunta:

```text
o código foi executado?
```

Métricas:

- line;
- toggle;
- condition;
- branch;
- FSM.

#### Functional coverage

Pergunta:

```text
as funcionalidades importantes foram testadas?
```

Exemplo:

```text
testei burst de tamanho 1, 4, 8 e 16?
testei leitura e escrita?
testei erro de alinhamento?
testei cada opcode?
```

As duas métricas se complementam.

---

### 13. Line coverage

Line coverage pode dizer que uma linha foi executada.

Mas cuidado: executar uma linha não significa verificar corretamente o comportamento.

Exemplo:

```systemverilog
data_out <= data_in + 1;
```

Line coverage pode estar 100%, mas se não houver checker, você não sabe se o resultado está correto.

Coverage indica exercício. Checker indica correção.

---

### 14. Toggle coverage

Toggle coverage mede se bits mudaram.

Se um sinal nunca toggla, pode ser:

- bug;
- sinal morto;
- estímulo insuficiente;
- feature não testada;
- reset permanente;
- clock ausente.

É útil em RTL e gate-level.

---

### 15. FSM coverage

FSM coverage é muito importante para controle digital.

Ela pergunta:

```text
todos os estados legais foram visitados?
todas as transições legais aconteceram?
```

Exemplo:

```text
IDLE → READ
READ → WAIT
WAIT → WRITE
WRITE → IDLE
```

Se uma transição nunca foi coberta, talvez falte teste direcionado.

---

### 16. Assertions: regras vivas do design

Assertion é uma regra executável.

Exemplo:

```systemverilog
assert property (@(posedge clk) !(read && write));
```

Ela documenta e verifica:

```text
read e write não podem estar ativos ao mesmo tempo
```

Se a regra falha, o simulador aponta o erro no ciclo em que aconteceu.

---

### 17. `assert`, `assume`, `cover`, `restrict`

#### `assert`

Verifica se uma propriedade é verdadeira.

```systemverilog
assert property (p);
```

#### `assume`

Usado principalmente em verificação formal para dizer o que o ambiente deve respeitar.

```systemverilog
assume property (env_rule);
```

#### `cover`

Mede se uma propriedade aconteceu.

```systemverilog
cover property (interesting_scenario);
```

#### `restrict`

Usado como constraint em formal verification; ignorado por simuladores.

---

### 18. Sequence e property

Uma sequence descreve eventos no tempo:

```systemverilog
sequence req_then_ack;
  req ##[1:3] ack;
endsequence
```

Uma property aplica essa sequence com clock e contexto:

```systemverilog
property p_req_ack;
  @(posedge clk)
  req_then_ack;
endproperty
```

Assertion:

```systemverilog
assert property (p_req_ack);
```

Resumo:

```text
sequence → padrão temporal
property → regra verificável baseada em sequence
assert property → checagem da regra
```

---

### 19. `$rose`, `$fell`, `$stable`

#### `$rose`

Detecta subida:

```systemverilog
$rose(req)
```

#### `$fell`

Detecta descida:

```systemverilog
$fell(valid)
```

#### `$stable`

Verifica estabilidade:

```systemverilog
$stable(addr)
```

Exemplo:

```systemverilog
assert property (@(posedge clk) valid |-> $stable(addr));
```

Leitura:

```text
quando valid estiver ativo, addr deve permanecer estável
```

---

## Conceitos difíceis explicados em profundidade

### 1. Constraint não é um `if` comum

Constraint não executa como software sequencial. Ela descreve um conjunto de condições que o solver deve satisfazer.

```systemverilog
constraint c {
  addr inside {[0:15]};
  addr[0] == 0;
}
```

O solver procura valores que satisfaçam tudo ao mesmo tempo.

Não leia como:

```text
primeiro faça isso, depois aquilo
```

Leia como:

```text
o valor final precisa obedecer a todas essas relações
```

---

### 2. Por que o bloco de constraint contém expressões?

O slide diz que o constraint block contém apenas expressions.

Isso significa que dentro de um constraint block você não escreve um algoritmo procedural como:

```systemverilog
for (...) begin
  ...
end
```

Você escreve relações:

```systemverilog
addr < max;
data inside {[0:255]};
kind -> size == 4;
```

É uma descrição declarativa de validade.

---

### 3. Distribuição ponderada não garante sequência fixa

Se você escreve:

```systemverilog
kind dist {
  READ := 80,
  WRITE := 20
};
```

isso não significa que a cada 10 casos virão exatamente 8 READ e 2 WRITE.

Significa que, estatisticamente, READ tem maior probabilidade.

Em poucos testes, pode haver variação. Em muitos testes, a proporção tende a se aproximar.

---

### 4. Coverage 100% não prova ausência de bugs

Coverage 100% indica que as metas definidas foram exercitadas.

Mas se as metas estavam incompletas, bugs podem continuar.

Exemplo:

```text
cobri todos os opcodes
mas não cobri reset durante operação
```

Coverage é tão boa quanto o plano de coverage.

---

### 5. Assertion e coverage são complementares

Assertion pergunta:

```text
esta regra foi violada?
```

Coverage pergunta:

```text
este cenário aconteceu?
```

Exemplo:

```systemverilog
assert property (req |-> ##[1:3] ack);
cover property  (req ##[1:3] ack);
```

A primeira detecta falha. A segunda mede se o handshake realmente ocorreu.

---

### 6. Code coverage pode enganar

Um teste pode executar uma linha, mas não checar seu resultado.

Por exemplo, line coverage pode mostrar que um branch foi executado, mas se não houver scoreboard/assertion, o teste pode não detectar saída errada.

Por isso, a estratégia robusta combina:

```text
code coverage
functional coverage
assertions
scoreboard
directed tests
constraint random tests
```

---

### 7. FSM coverage revela buracos de controle

Uma FSM pode parecer funcionar porque o caminho principal passou.

Mas talvez um estado de erro nunca tenha sido testado.

FSM coverage mostra:

```text
estado ERROR nunca visitado
transição WAIT → TIMEOUT nunca ocorreu
```

Isso orienta novos testes.

---

### 8. `assert` versus `assume`

Em simulação comum:

```text
assert → checa o DUT
```

Em formal verification:

```text
assume → restringe o ambiente
assert → prova propriedade do DUT
```

Exemplo:

```systemverilog
assume property (input_valid_protocol);
assert property (dut_response_protocol);
```

Se você assume errado, a prova pode ficar artificial. Por isso, assumptions precisam representar o ambiente real.

---

### 9. `cover property` não é o mesmo que `covergroup`

Ambos ajudam em coverage, mas são usados de formas diferentes.

#### `covergroup`

Mede valores e combinações de variáveis:

```systemverilog
coverpoint opcode;
cross opcode, size;
```

#### `cover property`

Mede se uma sequência temporal aconteceu:

```systemverilog
cover property (@(posedge clk) req ##[1:3] ack);
```

Use `covergroup` para espaço de dados. Use `cover property` para eventos temporais/protocolos.

---

### 10. O gabarito da questão 1

A questão afirma:

```text
There can be only relational operators >,<,<=,>= in expressions.
```

O gabarito do curso marca **True**.

Tecnicamente, SystemVerilog é mais amplo que isso. Mas para este banco, a interpretação deve ser:

```text
nas expressions de constraints apresentadas na aula, o foco são operadores relacionais de faixa
```

Então, em questões semelhantes deste curso, priorize **True** se a formulação for a mesma.

---

## Figuras, diagramas e waveforms importantes

### Constraints 1/4

Mostra exemplos de classes com `rand`, constraint range e uso do operador `inside`. A mensagem central é limitar randomização a valores legais.

### Constraints 2/4

Mostra distribuição ponderada com `dist`, `:=`, `:/`, além de `rand`, `randc`, arrays/queues e `solve before`.

### Constraints 3/4

Mostra `static constraint` e lembra que constraints são não estáticas por padrão, podendo ser desligadas com `constraint_mode()`.

### Constraints 4/4

Mostra particionamento de memória usando constraints para escolher início, fim, tamanho e alinhamento de blocos dentro de uma região válida.

### Coverage 1/3

Mostra a motivação de coverage em CRV, covergroups, coverpoints e bins.

### Coverage 2/3

Mostra fluxo VCS/Verdi para coletar e visualizar coverage, com bins cobertos/não cobertos coloridos.

### Coverage 3/3

Lista métricas de code coverage: line, toggle, condition, branch e FSM; e diferencia functional coverage.

### Assertions

Mostra tipos `assert`, `assume`, `cover`, `restrict`, além de sequence, property, immediate assertion e concurrent assertion.

### Questões finais

Confirmam os pontos cobrados pelo banco: generator pushes, driver pops, `find_last()` precisa de `with`, `:=` é distribution operator.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **There can be only relational operators `>`, `<`, `<=`, `>=` in expressions. True or false?**  
   Resposta aceita pelo curso: **True**.

2. **Generator ______ the data to/from the mailbox.**  
   Resposta: **Pushes**.

3. **Driver ______ the data to/from mailbox.**  
   Resposta: **Pops**.

4. **Among `find_last()` and `max()`, ______ requires `with` clause mandatorily.**  
   Resposta: **find_last()**.

5. **______ is used as a distribution operator.**  
   Resposta: **`:=`**.

6. **Para que serve constraint em SystemVerilog?**  
   Resposta: limitar valores randômicos a faixas/cenários legais.

7. **Para que serve `inside`?**  
   Resposta: restringir uma variável a um conjunto ou intervalo.

8. **Qual a diferença entre `rand` e `randc`?**  
   Resposta: `rand` gera valores randômicos comuns; `randc` percorre valores de forma cíclica antes de repetir.

9. **Para que serve `solve before`?**  
   Resposta: controlar a ordem de solução de variáveis randômicas dependentes e influenciar distribuição.

10. **Para que serve `constraint_mode()`?**  
    Resposta: ligar ou desligar uma constraint.

11. **Para que serve covergroup?**  
    Resposta: agrupar coverpoints e bins para medir functional coverage.

12. **O que é um coverpoint?**  
    Resposta: variável ou expressão cuja cobertura será medida.

13. **O que é um bin?**  
    Resposta: valor ou faixa que conta como coberta quando exercitada.

14. **Quais são métricas de code coverage citadas?**  
    Resposta: line, toggle, condition, branch e FSM coverage.

15. **Quais são tipos de assertion citados?**  
    Resposta: `assert`, `assume`, `cover` e `restrict`.

16. **Quais são componentes de assertions?**  
    Resposta: sequence e property.

17. **Quais funções temporais de assertion aparecem?**  
    Resposta: `$rose`, `$fell`, `$stable`.

### Pegadinhas

- O curso aceita **True** para a questão dos operadores relacionais em expressions, apesar de SystemVerilog real ser mais amplo.
- `:=` é distribution operator na questão; `|->` é implicação de assertions; `->` dispara eventos.
- `find_last()` precisa de `with`; `max()` não.
- Coverage não prova correção; apenas mede exercício.
- Assertion detecta violação de regra, mas não garante que o cenário ocorreu.
- CRV sem coverage não diz se os objetivos foram atingidos.
- `randc` evita repetição dentro de um ciclo de valores.
- `solve before` muda distribuição, não substitui constraints.
- `constraint_mode(0)` desliga constraints.
- Code coverage e functional coverage são diferentes.
- `cover property` mede ocorrência temporal; `covergroup` mede valores e combinações.

### Frases para memorizar

```text
Constraints limitam randomização a valores legais.
inside restringe por conjunto ou faixa.
dist controla distribuição de probabilidade.
:= é distribution operator.
rand é aleatório comum; randc é aleatório cíclico.
solve before controla ordem de solução.
Coverage mede se o teste exercitou o objetivo.
Code coverage mede execução do código.
Functional coverage mede cenários funcionais.
Assertion é uma regra executável do design.
Sequence descreve eventos no tempo; property transforma isso em regra verificável.
```

---

## Relação com projeto/laboratório

Esta aula completa a base de verificação SystemVerilog antes dos reference designs.

### Fluxo típico com CRV e coverage

```text
definir transaction class
adicionar rand variables
adicionar constraints
randomizar transações
dirigir DUT
monitorar resposta
comparar no scoreboard
amostrar coverage
analisar gaps
criar novos tests/constraints
```

### Exemplo integrado

```systemverilog
class switch_item;
  rand bit [7:0] addr;
  rand bit [15:0] data;
  rand bit       kind;

  constraint legal_addr {
    addr inside {[8'h00:8'h7F]};
  }

  constraint weighted_kind {
    kind dist {
      0 := 70,
      1 := 30
    };
  }

  covergroup cg;
    coverpoint addr {
      bins low  = {[8'h00:8'h1F]};
      bins mid  = {[8'h20:8'h5F]};
      bins high = {[8'h60:8'h7F]};
    }

    coverpoint kind;
    cross addr, kind;
  endgroup

  function new();
    cg = new();
  endfunction

  function void sample_cov();
    cg.sample();
  endfunction
endclass
```

### Relação com Verdi/VCS

Para usar coverage:

```bash
vcs -cm line+cond+tgl+fsm+branch+assert ...
./simv -cm line+cond+tgl+fsm+branch+assert
verdi -cov -covdir simv.vdb
```

### Relação com próximos labs

Nos próximos reference designs, o ideal é observar:

- quais constraints geram os estímulos;
- quais covergroups medem os objetivos;
- quais assertions verificam regras do protocolo;
- se o scoreboard realmente compara expected versus actual;
- se a coverage mostra gaps que exigem novos testes.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] Código/comandos foram preservados e explicados.
- [x] Questões foram respondidas com tradução, alternativa correta e justificativa.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Roteiro/checklist foi conferido antes de sugerir o próximo bloco.
- [x] O próximo bloco foi indicado com confirmação pendente de existência na pasta.

---

## Próximo bloco

**Bloco 014 — 05 SystemVerilog Reference Designs**  
Confirmar se este arquivo existe na pasta antes de anexar.

Arquivo provável:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\05 SystemVerilog Reference Designs.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\05 SystemVerilog Reference Designs.md
```
