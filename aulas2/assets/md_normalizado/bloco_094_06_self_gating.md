# 06 Self-Gating

## Controle do bloco

- **Bloco:** 094
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\06 Self-Gating.docx`
- **Faixa de slides:** 1-9
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\06 Self-Gating.md
```

- **Próximo bloco recomendado:** 095 — `07 Multibit`

---

## Resumo executivo

Esta aula aprofunda uma técnica específica de redução de potência dinâmica chamada **self-gating**. Ela é uma forma de clock gating em que a própria ferramenta identifica registradores cujo valor de entrada `D` tende a permanecer igual ao valor armazenado `Q` durante muitos ciclos. Quando isso acontece, o clock daquele registrador pode ser desligado temporariamente, porque aplicar um novo pulso de clock não alteraria o estado do flip-flop.

A ideia central é simples: se `D == Q`, o registrador não precisa capturar nada novo. Logo, o clock pode ser bloqueado naquele ciclo. O Design Compiler NXT implementa isso inserindo uma célula de clock gating integrada, chamada **ICG**, mais uma lógica combinacional que compara o valor antigo `Q` com o novo valor `D` e gera o enable da ICG.

A aula também mostra que self-gating não é aplicado cegamente. O algoritmo considera **timing**, **potência**, **cenários MCMM**, atividade de chaveamento e qualidade do enable. Em fluxos com múltiplos cenários, self-gating só funciona em cenários habilitados com `-dynamic_power true`. Para obter bons resultados, o uso de atividade realista, especialmente via **SAIF**, é altamente recomendado.

Além disso, a aula apresenta os principais comandos de controle:

- `compile_ultra -gate_clock -self_gating`
- `set_self_gating_options`
- `set_self_gating_objects`
- `report_self_gating`
- `all_self_gates`

---

## Texto extraído e organizado por slide

## Slide 1 — Self-Gating Overview

### Texto limpo do slide

**Self-gating** is an optimization technique used to reduce dynamic power consumption by turning off the clock signal of certain registers during clock cycles when the data remains unchanged.

- Uses switching activity to identify registers with very low D-input toggle-rates.

Gating logic is comprised of an ICG cell plus appropriate combinational logic to drive the ICG enable pin.

- Enable signal is created by comparing a register's stored value, `Q`, and the new data arriving to the register, `D`.

Comando:

```tcl
compile_ultra -gate_clock -self_gating ... [-incremental]
```

### Explicação

Self-gating é uma forma de clock gating baseada no próprio comportamento do registrador.

Em um registrador comum:

```verilog
always_ff @(posedge clk)
  q <= d;
```

O clock chega ao flip-flop em todo ciclo, mesmo quando `d` é igual ao valor já armazenado em `q`. Se `d == q`, o registrador captura o mesmo valor que já tinha. Funcionalmente nada muda, mas a rede de clock, o pino de clock do registrador e partes internas do flip-flop ainda chaveiam e consomem potência dinâmica.

Self-gating tenta evitar exatamente esse desperdício. A ferramenta cria uma lógica que compara `D` e `Q`. Se os valores são iguais, o clock pode ser bloqueado. Se são diferentes, o clock deve passar para atualizar o registrador.

Forma conceitual:

```text
se D != Q:
    habilita clock do registrador
senão:
    bloqueia clock do registrador
```

Em termos de lógica simples, a versão tradicional usa XOR:

```text
enable_self_gate = D XOR Q
```

- Se `D = Q`, então `D XOR Q = 0`: não precisa clockar.
- Se `D != Q`, então `D XOR Q = 1`: precisa clockar.

A figura do slide mostra uma ICG inserida pela ferramenta, junto com a lógica de comparação que alimenta o enable da ICG.

---

## Slide 2 — Sharing Self-Gating Condition

### Texto limpo do slide

Self-gating ICGs can be shared by creating a combined enable condition.

- Also applies to multibit registers.

While ICG count is reduced, the quality of the enable signal decreases with the number of registers sharing an enable, since the clock signal is less likely to be turned off.

### Explicação

A ferramenta pode compartilhar uma mesma ICG entre vários registradores. Em vez de colocar uma ICG para cada flip-flop, ela cria uma condição combinada de enable para um banco de registradores.

Exemplo conceitual para três registradores:

```text
Precisa clockar reg0 se D0 != Q0
Precisa clockar reg1 se D1 != Q1
Precisa clockar reg2 se D2 != Q2
```

Se os três compartilham a mesma ICG, o enable combinado fica parecido com:

```text
enable_shared = (D0 != Q0) OR (D1 != Q1) OR (D2 != Q2)
```

Assim, o clock só é desligado quando **todos** os registradores do grupo permaneceriam inalterados:

```text
D0 == Q0 e D1 == Q1 e D2 == Q2
```

Isso reduz o número de ICGs e economiza área, mas também reduz a chance de desligar o clock. Se apenas um registrador do grupo precisar mudar, o clock passa para todos os registradores do grupo.

### Tradeoff principal

| Escolha | Vantagem | Desvantagem |
|---|---|---|
| Uma ICG por registrador | Melhor precisão de gating | Mais área e mais lógica |
| ICG compartilhada | Menos área e menos células ICG | Clock desliga menos vezes |

Esse é um tradeoff clássico entre **potência economizada** e **overhead de implementação**.

---

## Slide 3 — When is a Self-Gate Inserted?

### Texto limpo do slide

To ensure QoR improvements, the self-gating algorithm takes timing and power into consideration.

A self-gating cell is inserted for the candidate registers if:

- There is enough timing slack available in the register's data pin.
  - For designs with multiple scenarios, the algorithm considers the timing of the worst case among active scenarios enabled for setup.

- Internal dynamic power of the circuit is reduced.
  - For designs with multiple scenarios, the algorithm uses the average internal dynamic power among active scenarios enabled for dynamic power during `compile_ultra`.

### Explicação

Self-gating adiciona lógica nova no caminho de dados. Essa lógica compara `D` e `Q` para gerar o enable da ICG. Como essa lógica extra tem atraso, ela pode piorar timing. Por isso o DC NXT só insere self-gating quando a troca melhora a QoR geral.

A ferramenta verifica principalmente dois critérios:

1. **Existe slack suficiente no caminho de dados?**
2. **A potência dinâmica interna realmente diminui?**

### Critério 1 — Timing slack

O caminho de dados que chega ao registrador pode passar a incluir a lógica de comparação para self-gating. Se esse caminho já é crítico, inserir lógica extra pode causar violação de setup.

Então a ferramenta evita inserir self-gating quando isso prejudica timing.

Em MCMM, o algoritmo considera o pior caso entre os cenários ativos para setup. Isso significa que não basta estar bom em um cenário típico. Se um cenário de pior timing não suporta o atraso extra, a inserção pode ser rejeitada.

### Critério 2 — Redução real de potência dinâmica

A ferramenta também estima se a economia de clock compensa o custo da lógica adicional.

Self-gating adiciona:

- ICG;
- lógica de comparação;
- roteamento adicional;
- possível aumento de capacitância;
- possíveis impactos de timing e área.

Se a economia de clock for pequena, a técnica pode não valer a pena.

Exemplo:

```text
Registrador A:
  D quase nunca muda.
  Self-gating tende a economizar potência.

Registrador B:
  D muda quase todo ciclo.
  Self-gating quase nunca bloqueia clock.
  A lógica extra pode gastar mais do que economiza.
```

---

## Slide 4 — Multicorner-Multimode Support

### Texto limpo do slide

Self-gating works only for scenarios with the dynamic power option.

- Switching activity from RTL simulation is highly recommended to drive self-gating insertion.

Exemplo de setup:

```tcl
create_scenario power_scenario
set_scenario_options -setup true -dynamic_power true
read_saif
```

Mensagem emitida no compile log quando self-gating é habilitado com sucesso:

```text
Information: Performing self-gating power optimization based on scenario: <scenario> (PWR-949)
```

Se a redução de cenários selecionar um cenário sem dynamic power, a ferramenta pula a inserção de self-gating:

```text
Warning: Skipping self-gating power optimization because no scenarios with setup and dynamic power options are available. (PWR-948)
```

### Explicação

Self-gating depende de informação de potência dinâmica. Portanto, em um fluxo MCMM, é obrigatório ter ao menos um cenário com:

```tcl
-setup true -dynamic_power true
```

O `-setup true` é necessário porque a ferramenta precisa avaliar timing. O `-dynamic_power true` é necessário porque a técnica depende de atividade de chaveamento e estimativa de economia de potência dinâmica.

A recomendação do slide é usar atividade vinda de simulação RTL, tipicamente por SAIF:

```tcl
read_saif
```

Sem atividade de chaveamento realista, a ferramenta pode selecionar candidatos ruins para self-gating. Por exemplo, pode achar que um registrador muda pouco quando na prática ele muda muito, ou o contrário.

### Mensagens importantes para prova e debug

| Código | Significado |
|---|---|
| `PWR-949` | Self-gating foi habilitado com sucesso com base em um cenário de potência. |
| `PWR-948` | Self-gating foi pulado porque não havia cenário com setup e dynamic power disponíveis. |

Pegadinha: não basta usar `-self_gating` no `compile_ultra`. O cenário precisa estar preparado para potência dinâmica.

---

## Slide 5 — Global Self-Gating Options

### Texto limpo do slide

Global self-gating control options:

```tcl
set_self_gating_options
```

Opções:

- `-min_bitwidth` e `-max_bitwidth`
- `-interaction_with_clock_gating <type>`

Tipos de interação com clock gating:

- `insert` — default: add self-gate with existing clock gate.
- `merge` — merge enable of self-gate with existing clock gate.
- `none` — only self-gate if no clock gating exists.

Exemplo:

```tcl
set_self_gating_options \
    -min_bitwidth 3 -max_bitwidth 6 \
    -interaction_with_clock_gating insert
```

### Explicação

O comando `set_self_gating_options` controla políticas globais de self-gating.

### `-min_bitwidth`

Define o tamanho mínimo de banco/registrador para considerar self-gating.

Exemplo:

```tcl
-min_bitwidth 3
```

Indica que a ferramenta não deve aplicar self-gating em bancos menores que 3 bits. Isso evita inserir lógica de gating em casos pequenos onde o overhead pode não compensar.

### `-max_bitwidth`

Define o tamanho máximo considerado.

Exemplo:

```tcl
-max_bitwidth 6
```

Pode ser usado para evitar que bancos muito grandes compartilhem uma condição de self-gating ruim demais ou uma lógica de comparação muito pesada.

### `-interaction_with_clock_gating`

Esse ponto é importante porque o registrador pode já estar sob clock gating comum, derivado de enable RTL. A pergunta é: se já existe clock gating, como o self-gating deve interagir com ele?

#### `insert`

Adiciona self-gate junto com clock gating existente. É o comportamento default segundo o slide.

Conceitualmente:

```text
clock original
   → clock gate existente
      → self-gate adicional
         → registrador
```

#### `merge`

Mescla o enable do self-gate com o enable do clock gate existente.

Exemplo lógico:

```text
enable_final = enable_RTL AND enable_self_gate
```

A forma exata depende da polaridade e do estilo da ICG, mas a ideia é combinar as condições.

#### `none`

Só aplica self-gating se não existir clock gating naquele registrador. É uma opção conservadora.

---

## Slide 6 — Controlling Self-Gating Objects

### Texto limpo do slide

Control specific self-gating objects:

```tcl
set_self_gating_objects
```

Objects can be of type register, hierarchical cell, power domain, or design.

Opções sobre lista de objetos:

```text
<object_list> -include | -exclude | -force_include | -undo
```

Também especifica o tipo de célula combinacional comparadora:

```text
-type <type>
```

Tipos:

- `auto` — default: automatically choose the combinational cell for each register. Available only in Design Compiler NXT.
- `xor` — use XOR cells.
- `nand` — use NAND cells.
- `or` — use OR cells.

### Explicação

Enquanto `set_self_gating_options` define uma política global, `set_self_gating_objects` permite controlar onde a técnica será aplicada.

Objetos possíveis:

- registradores específicos;
- células hierárquicas;
- power domains;
- designs inteiros.

### Modos de inclusão/exclusão

| Opção | Uso |
|---|---|
| `-include` | Permite self-gating nos objetos indicados. |
| `-exclude` | Exclui objetos da análise/inserção de self-gating. |
| `-force_include` | Força inclusão, sobrescrevendo critérios herdados. |
| `-undo` | Remove configuração aplicada anteriormente. |

### Escolha do comparador

Tradicionalmente, self-gating usa XOR para detectar diferença entre `D` e `Q`:

```text
enable = D XOR Q
```

Mas o DC NXT pode escolher automaticamente outros tipos de célula para reduzir área e potência, dependendo da probabilidade estática do sinal.

---

## Slide 7 — Automatic Selection of Comparator Cell for Enable Logic

### Texto limpo do slide

Traditional self-gating creates the enable signal by using an XOR gate to compare input and output pins of the self-gated register.

Design Compiler NXT automatically selects the comparator cells based on switching activity, specifically static probability, of register data input by default.

- Use OR gates for those registers known to be at state 0 most of the time.
- Use NAND gates for those registers known to be at state 1 most of the time.
- Use traditional XOR self-gating for remaining registers.

Smaller comparator cells help to reduce self-gating area and power overheads.

### Explicação

Este é um ponto muito didático: a comparação `D != Q` não precisa sempre ser implementada com XOR.

O XOR é a forma geral, porque detecta diferença entre os dois valores:

| D | Q | D XOR Q |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Mas se a ferramenta sabe, por atividade de chaveamento, que um sinal fica em 0 a maior parte do tempo, ela pode usar uma lógica mais barata para aquele padrão. Se sabe que fica em 1 a maior parte do tempo, pode usar outra lógica mais eficiente.

O slide indica:

- registradores cujo `D` fica em 0 na maior parte do tempo: usar OR;
- registradores cujo `D` fica em 1 na maior parte do tempo: usar NAND;
- demais casos: usar XOR tradicional.

A razão é reduzir o overhead do próprio self-gating. Se a lógica de comparação for grande demais ou chavear muito, ela pode consumir parte da economia que o gating tentava criar.

### Relação com SAIF

Para essa seleção automática funcionar bem, a ferramenta precisa saber a **static probability** dos sinais. Isso vem de atividade de chaveamento, normalmente SAIF.

Sem SAIF, a ferramenta pode cair em aproximações default e escolher comparadores menos adequados.

---

## Slide 8 — Toggle-Rate Based Clustering

### Texto limpo do slide

Self-gating effectiveness directly depends on the switching activity of the D and Q-pin of the registers.

- If at least one of the registers in a self-gated bank has high toggle rate in D-pin, the resulting enable signal degrades, affecting the entire bank.

To avoid this condition, Design Compiler NXT creates banks by banking together registers with similar D-pin toggle rate.

Important: SAIF file is required for accurate toggle-rate based clustering and comparator cell selection.

### Explicação

Self-gating compartilhado funciona melhor quando os registradores do grupo têm comportamento parecido.

Imagine um banco com quatro registradores:

```text
reg0: quase nunca muda
reg1: quase nunca muda
reg2: quase nunca muda
reg3: muda quase todo ciclo
```

Se todos compartilham a mesma ICG, o enable combinado fica ativo quase sempre por causa de `reg3`. Assim, o clock passa para o banco inteiro quase todo ciclo, e `reg0`, `reg1` e `reg2` deixam de aproveitar a economia que poderiam ter.

Por isso o DC NXT tenta agrupar registradores com **toggle rate semelhante**.

Exemplo melhor:

```text
Banco A: registradores de baixo toggle rate
Banco B: registradores de alto toggle rate
```

O banco A consegue desligar clock frequentemente. O banco B talvez não valha a pena ou terá comportamento diferente.

### Ideia principal

A qualidade do self-gating depende da qualidade do enable. A qualidade do enable depende de os registradores compartilhados terem padrões de mudança compatíveis.

### Ponto crítico do slide

O slide enfatiza que SAIF é necessário para:

- clustering baseado em toggle rate;
- seleção precisa de comparador;
- estimativa realista de benefício.

Sem SAIF, a ferramenta não conhece bem o comportamento dos registradores.

---

## Slide 9 — Self-Gating Reporting

### Texto limpo do slide

Comando principal:

```tcl
report_self_gating
```

Opções mostradas:

```text
-gated
-ungated
-no_split
```

Exemplo de resumo:

```text
XOR Self Gating Summary
Number of self-gating cells
Number of self-gated registers
Number of registers not self-gated
Total number of registers
```

Relatório de não-gated:

```tcl
report_self_gating -ungated
```

Mostra registradores não self-gated e o motivo.

Comando para criar coleção de self-gating cells ou pins:

```tcl
all_self_gates
```

Opções mostradas:

```text
-no_hierarchy
-clock clock
-cells
-enable_pins
-clock_pins
-output_pins
-test_pins
```

### Explicação

Depois da síntese, não basta confiar que a ferramenta aplicou self-gating. É necessário verificar.

O comando:

```tcl
report_self_gating
```

mostra um resumo da inserção de self-gates, incluindo:

- número de células de self-gating;
- número de registradores self-gated;
- número de registradores não self-gated;
- total de registradores.

A opção:

```tcl
report_self_gating -ungated
```

é especialmente útil porque mostra os registradores que **não** receberam self-gating e os motivos.

Exemplos de motivos típicos:

- clock gated register;
- registradores não estão próximos o suficiente;
- self-gating cria slack negativo;
- atividade de chaveamento não justifica;
- tamanho do banco não atende às opções configuradas.

O comando:

```tcl
all_self_gates
```

cria coleções de objetos, permitindo investigar células, pinos de enable, pinos de clock, pinos de saída e pinos de teste relacionados ao self-gating.

---

# Aula didática desenvolvida

## 1. Onde self-gating entra no fluxo de low power

No bloco anterior, clock gating comum foi apresentado como uma técnica que usa enables já existentes no RTL. Por exemplo:

```verilog
always_ff @(posedge clk) begin
  if (en)
    q <= d;
end
```

Nesse caso, o enable `en` já está explícito no RTL. O Design Compiler NXT consegue transformar essa estrutura em clock gating:

```text
se en = 0 → bloqueia clock
se en = 1 → deixa clock passar
```

Self-gating é diferente. Ele não depende necessariamente de um enable explícito no RTL. A ferramenta observa que, mesmo sem enable RTL, muitos registradores recebem o mesmo valor que já possuem. Então ela cria um enable derivado da comparação entre `D` e `Q`.

Forma conceitual:

```text
enable_self_gate = D != Q
```

Isso permite economizar clock em registradores que seriam clockados inutilmente.

---

## 2. Diferença entre clock gating comum e self-gating

| Técnica | Origem do enable | Exemplo | Comando típico |
|---|---|---|---|
| Clock gating comum | Enable RTL já existente | `if (en) q <= d;` | `compile_ultra -gate_clock` |
| Self-gating | Comparação gerada pela ferramenta entre `D` e `Q` | `q <= d`, mas `d` muda pouco | `compile_ultra -gate_clock -self_gating` |

O clock gating comum é normalmente mais limpo, porque aproveita uma intenção funcional já presente no código. Self-gating é mais agressivo, pois cria lógica nova para detectar quando a atualização seria redundante.

---

## 3. Por que self-gating reduz potência dinâmica

A potência dinâmica está relacionada a chaveamento:

```text
Pdynamic ≈ atividade × capacitância × V² × frequência
```

Self-gating reduz a atividade de clock em determinados registradores. Como a rede de clock costuma ser uma das maiores fontes de chaveamento em designs síncronos, desligar clock em ciclos inúteis pode trazer economia relevante.

A economia pode ocorrer em:

- pino de clock do registrador;
- capacitância interna do flip-flop;
- parte local da rede de clock;
- buffers locais ligados ao clock gated;
- lógica interna do registrador.

Mas existe overhead:

- ICG nova;
- lógica comparadora;
- roteamento adicional;
- possíveis buffers;
- possível piora de timing.

Por isso a ferramenta precisa avaliar se a técnica compensa.

---

## 4. Self-gating não é sempre bom

Um erro comum é pensar:

```text
Se self-gating economiza potência, então devo aplicar em tudo.
```

Isso é falso.

Self-gating pode piorar QoR se:

- o registrador muda frequentemente;
- a lógica de comparação consome muito;
- o banco compartilhado tem enable ruim;
- o caminho de dados já está crítico;
- não há slack suficiente;
- a atividade fornecida à ferramenta é imprecisa;
- a célula ICG e comparadores aumentam área sem retorno.

Por isso o algoritmo considera timing e potência. Ele só insere self-gate em candidatos onde há expectativa de melhora.

---

## 5. A importância de SAIF

Vários slides desta aula dependem de uma ideia comum: a ferramenta precisa saber como os sinais se comportam.

A informação mais importante é:

- toggle rate do pino `D`;
- static probability do pino `D`;
- atividade de `Q`;
- comportamento por cenário de potência.

Essa informação vem de simulação RTL, normalmente por SAIF.

Sem SAIF, a ferramenta pode usar valores default, mas isso reduz a qualidade da decisão.

O próprio slide 8 traz o alerta:

```text
SAIF file is required for accurate toggle-rate based clustering and comparator cell selection.
```

---

# Conceitos difíceis explicados em profundidade

## 1. ICG em self-gating

ICG significa **Integrated Clock Gating cell**.

É uma célula de biblioteca projetada para bloquear clock de forma segura. Em vez de usar uma porta lógica comum diretamente no clock, usa-se uma célula própria, normalmente com latch interno para evitar glitch no clock gated.

No self-gating, a ICG recebe um enable gerado pela comparação entre o valor atual e o novo valor do registrador.

Conceito:

```text
D == Q → enable = 0 → clock bloqueado
D != Q → enable = 1 → clock liberado
```

---

## 2. Por que comparar `D` com `Q`

O flip-flop só precisa receber clock quando o próximo valor é diferente do valor atual.

Tabela:

| Q atual | D novo | Precisa clock? | Motivo |
|---|---|---|---|
| 0 | 0 | Não | O valor continuaria 0 |
| 0 | 1 | Sim | Precisa atualizar para 1 |
| 1 | 0 | Sim | Precisa atualizar para 0 |
| 1 | 1 | Não | O valor continuaria 1 |

A lógica XOR representa exatamente essa diferença.

---

## 3. Por que OR ou NAND podem substituir XOR em alguns casos

XOR é geral, mas pode ser mais caro. Se a ferramenta conhece a probabilidade estática do sinal, pode usar células menores e mais eficientes.

Exemplo conceitual:

- Se `D` fica em 0 quase sempre, uma estrutura baseada em OR pode ser suficiente e mais barata para o padrão dominante.
- Se `D` fica em 1 quase sempre, uma estrutura baseada em NAND pode ser mais eficiente.
- Se não há predominância clara, usa-se XOR.

O objetivo não é alterar a função do registrador. O objetivo é implementar a lógica de enable de forma mais eficiente, usando conhecimento estatístico da atividade.

---

## 4. Clustering por toggle rate

Quando vários registradores compartilham uma ICG, o enable conjunto é uma combinação das condições individuais. Se qualquer registrador do grupo precisa mudar, o clock passa para o grupo inteiro.

Por isso, misturar registradores de baixo toggle com registradores de alto toggle prejudica o grupo.

Exemplo:

```text
reg_a: toggle baixo
reg_b: toggle baixo
reg_c: toggle alto
```

Se os três compartilham o mesmo gate:

```text
enable = change_a OR change_b OR change_c
```

Como `change_c` ocorre muito, o enable fica ativo com frequência. O grupo quase nunca desliga.

O clustering por toggle rate tenta evitar isso agrupando registradores com comportamento parecido.

---

## 5. Self-gating em MCMM

Em MCMM, a ferramenta analisa múltiplos modos e cantos. Self-gating precisa ser válido nesses cenários.

Para timing:

```text
Usa o pior caso entre cenários ativos com setup.
```

Para potência dinâmica:

```text
Usa a média da potência dinâmica interna entre cenários ativos com dynamic_power durante compile_ultra.
```

Isso significa que a decisão de inserir self-gating não é local a um único cenário simples. Ela depende da configuração dos cenários.

Comando mínimo mostrado no slide:

```tcl
create_scenario power_scenario
set_scenario_options -setup true -dynamic_power true
read_saif
```

---

## 6. Interação com clock gating comum

Self-gating pode coexistir com clock gating comum.

A opção:

```tcl
-interaction_with_clock_gating insert
```

adiciona self-gate junto com clock gate existente.

A opção:

```tcl
-interaction_with_clock_gating merge
```

combina os enables.

A opção:

```tcl
-interaction_with_clock_gating none
```

só aplica self-gating quando não existe clock gating comum.

Essa escolha afeta:

- área;
- profundidade lógica;
- timing de enable;
- economia de potência;
- complexidade de clock gating.

---

# Figuras, diagramas e waveforms importantes

## Slide 1 — ICG com lógica comparadora

A figura mostra a ICG inserida pela ferramenta e uma lógica combinacional que compara `D` e `Q`. Ela representa o mecanismo fundamental do self-gating: bloquear clock quando o novo dado é igual ao valor armazenado.

## Slide 2 — ICG compartilhada

A figura mostra vários registradores ligados a uma lógica de self-gating compartilhada. Ela ilustra o tradeoff: menos ICGs, mas enable menos seletivo.

## Slide 5 — Interação merge/insert/none

As três figuras mostram formas diferentes de combinar self-gating com clock gating existente:

- `merge`: combina enables;
- `insert`: adiciona self-gate junto ao gate existente;
- `none`: aplica self-gating apenas quando não há clock gate.

## Slide 7 — Comparadores OR/NAND/XOR

A figura representa diferentes implementações de comparador. O ponto central é que o DC NXT pode escolher automaticamente o tipo mais eficiente com base na static probability.

## Slide 8 — Clustering por toggle rate

A figura compara agrupamento sem e com toggle-rate clustering. A ideia é evitar que registradores com alta atividade contaminem bancos que poderiam desligar clock com frequência.

## Slide 9 — Reporting

A imagem mostra `report_self_gating`, `report_self_gating -ungated` e `all_self_gates`. Esses comandos são a base para verificar se o self-gating foi aplicado e por que certos registradores ficaram fora.

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **O que é self-gating?**  
   É uma técnica de redução de potência dinâmica que desliga o clock de registradores quando o dado de entrada permanece igual ao valor armazenado.

2. **Qual comparação gera o enable básico do self-gating?**  
   Comparação entre `D` e `Q`.

3. **Qual comando ativa self-gating no compile?**

```tcl
compile_ultra -gate_clock -self_gating
```

4. **Self-gating depende de atividade de chaveamento?**  
   Sim. A ferramenta usa switching activity para identificar registradores com baixo toggle rate em `D`.

5. **Por que SAIF é recomendado?**  
   Porque fornece atividade realista para seleção de candidatos, clustering por toggle rate e escolha automática de comparador.

6. **Self-gating funciona em qualquer cenário MCMM?**  
   Não. Funciona apenas em cenários com `-dynamic_power true`, e também precisa de setup para avaliação de timing.

7. **Qual mensagem indica self-gating habilitado com sucesso?**  
   `PWR-949`.

8. **Qual mensagem indica que self-gating foi pulado por falta de cenário adequado?**  
   `PWR-948`.

9. **Qual comando controla opções globais de self-gating?**

```tcl
set_self_gating_options
```

10. **Qual comando controla objetos específicos para self-gating?**

```tcl
set_self_gating_objects
```

11. **Quais tipos de comparador podem ser usados?**  
   `auto`, `xor`, `nand`, `or`.

12. **Qual comando gera relatório de self-gating?**

```tcl
report_self_gating
```

13. **Qual comando cria coleção de células ou pinos de self-gating?**

```tcl
all_self_gates
```

## Pegadinhas

| Tema | Pegadinha | Correção |
|---|---|---|
| Self-gating | Achar que é igual ao clock gating comum | Self-gating cria enable comparando `D` e `Q` |
| Ativação | Usar só `-self_gating` | Também precisa cenário com dynamic power |
| SAIF | Achar opcional sem impacto | É essencial para boa precisão |
| Compartilhamento | Achar que compartilhar ICG sempre melhora | Pode reduzir a qualidade do enable |
| Timing | Achar que self-gating sempre ajuda | Pode piorar setup se não houver slack |
| Comparador | Achar que sempre usa XOR | DC NXT pode escolher OR/NAND/XOR automaticamente |
| Clustering | Misturar sinais com toggle muito diferente | Degrada o enable do banco inteiro |
| Relatório | Olhar só número de self-gates | Também verificar `-ungated` e motivos |

---

# Relação com projeto/laboratório

Em um fluxo Tcl de síntese low power, o uso de self-gating pode aparecer junto das configurações de potência dinâmica e clock gating:

```tcl
create_scenario power_scenario
set_scenario_options -setup true -dynamic_power true
read_saif design.saif

set_self_gating_options \
    -min_bitwidth 3 \
    -max_bitwidth 6 \
    -interaction_with_clock_gating insert

compile_ultra -gate_clock -self_gating

report_self_gating
report_self_gating -ungated
```

No laboratório, os pontos mais importantes para observar são:

1. se o cenário de potência está corretamente ativado;
2. se o SAIF foi lido;
3. se o log mostra `PWR-949` ou `PWR-948`;
4. quantos registradores foram self-gated;
5. por que os demais não foram self-gated;
6. se houve impacto de timing;
7. se a economia de potência compensou a área e a lógica adicional.

---

# Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

# Próximo bloco

## Bloco 095 — 07 Multibit

**Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\07 Multibit.docx
```

**Faixa:** slides `1-9`

**Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\07 Multibit.md
```
