# 02 Power Analysis Setup

## Controle do bloco

- **Bloco:** 090
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\02 Power Analysis Setup.docx`
- **Faixa de slides:** 1-18
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\02 Power Analysis Setup.md`
- **Próximo bloco recomendado:** 091 — `03 Power Optimization`
- **Arquivo do próximo bloco:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\03 Power Optimization.docx`
- **Faixa do próximo bloco:** slides 1-7
- **Caminho sugerido para salvar o próximo bloco:** `C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\03 Power Optimization.md`

---

## Resumo executivo

Esta aula aprofunda a configuração de análise de potência no Design Compiler NXT a partir de um ponto central: **potência dinâmica depende de atividade de chaveamento**. Sem saber quais sinais alternam, com que frequência alternam e quanto tempo ficam em 0 ou 1, a ferramenta só consegue fazer estimativas grosseiras usando valores padrão.

O bloco apresenta as formas de descrever atividade de chaveamento: arquivos de waveform, como **FSDB** e **VCD**, e arquivos de atividade média, principalmente **SAIF**. Para síntese low power, o fluxo recomendado é gerar um **RTL SAIF** por simulação RTL e lê-lo no Design Compiler NXT com `read_saif`, usando corretamente o `-instance_name` que aponta para a instância do design dentro do testbench.

A aula também mostra como medir a cobertura da anotação de atividade com `report_activity -driver` e como encontrar elementos não anotados com `report_saif -rtl -hierarchy -missing`. Depois, compara tipos de origem da atividade: `simulated`, `annotated`, `default`, `propagated` e `inferred`.

Quando não há SAIF, o curso recomenda combinar `set_switching_activity` para sinais conhecidos com `infer_switching_activity -sci_based all -apply` para os demais essential points. Isso evita dois erros comuns: controles como reset/enable herdarem atividade default alta demais, e saídas sequenciais propagadas pela ferramenta tenderem a toggle quase zero, subestimando potência downstream.

A parte final explica por que a síntese muda nomes de objetos e por que, ao usar RTL SAIF em análise pós-síntese ou física, é necessário um **SAIF mapping flow**. A ferramenta precisa mapear nomes RTL para nomes gate-level, especialmente quando a síntese cria registradores com `_reg`, replica registradores, faz multibit banking ou usa saídas invertidas.

---

# Texto extraído e organizado por slide

## Slide 1 — Switching Activity

### Texto limpo do slide

**Switching Activity**

Activity switching from simulation can be saved in two types of files:

- **Waveform**
  - Fast Signal Database (**FSDB**)
  - Variable Change Dump (**VCD**)

- **Averaged**
  - Switching Activity Interchange Format (**SAIF**)

### Leitura didática

O slide separa duas formas de salvar atividade de chaveamento gerada por simulação.

A primeira forma é a **waveform**, como FSDB ou VCD. Ela registra mudanças de sinais ao longo do tempo. É o tipo de informação usado para debug em simuladores e visualizadores como Verdi, DVE etc. Em vez de dizer apenas “esse sinal chaveou X vezes”, a waveform permite ver **quando** cada transição ocorreu.

A segunda forma é o modelo **averaged**, representado por SAIF. Ele não tenta guardar a forma de onda completa. Ele resume a atividade em números médios: quanto tempo o sinal ficou em 0, quanto tempo ficou em 1, quanto tempo ficou desconhecido e quantas transições ocorreram.

Para síntese e análise média de potência, SAIF é muito prático porque reduz a informação de simulação para dados que a ferramenta de síntese consegue usar diretamente.

### Diferença prática

| Tipo | Exemplo | Guarda o quê? | Uso principal |
|---|---|---|---|
| Waveform | FSDB, VCD | Histórico temporal das transições | Debug, visualização, análise temporal detalhada |
| Averaged | SAIF | Estatísticas médias de chaveamento | Cálculo e otimização de potência |

---

## Slide 2 — Switching Activity: Averaged Model

### Texto limpo do slide

**Switching Activity: Averaged Model**

In averaged power analysis, switching activity is modeled with the following two variables:

- **Toggle Rate (TR)**
  - Number of transitions per unit of time.
  - For clock signals TR is two times the frequency of the signal.

- **Static probability (SP)**
  - Probability that a node is logic 1.
  - Completely random data has SP = 0.5.

Exemplos da figura:

```text
SP(A) = 4/6 = 0.66      TR(A) = 3/6 = 0.5
SP(B) = 4/6 = 0.66      TR(B) = 2/6 = 0.33
SP(C) = 2/6 = 0.33      TR(C) = 3/6 = 0.5
```

### Leitura didática

O modelo médio de atividade usa duas grandezas:

1. **TR — Toggle Rate**
2. **SP — Static Probability**

Essas duas grandezas são suficientes para a ferramenta estimar, de forma média, quanto um sinal contribui para potência dinâmica.

### Toggle Rate

`toggle_rate` mede quantas transições ocorrem por unidade de tempo. Uma transição pode ser:

```text
0 -> 1
1 -> 0
```

Quanto maior o toggle rate, maior tende a ser a potência dinâmica, porque mais vezes a capacitância associada à net será carregada e descarregada.

Para clock, o slide destaca uma regra importante:

```text
TR do clock = 2 × frequência
```

Por quê? Porque em cada período de clock há duas transições:

```text
0 -> 1
1 -> 0
```

Se o clock tem período de 10 ns, ele tem frequência de 100 MHz. Como existem duas bordas por período, o toggle rate do clock é duas vezes a frequência.

### Static Probability

`static_probability` mede a probabilidade de um nó estar em nível lógico 1.

Exemplo:

```text
SP = 0.7
```

Significa que, em média, aquele sinal fica em 1 durante 70% do tempo.

O slide diz que dados completamente aleatórios têm:

```text
SP = 0.5
```

Isso representa um sinal equilibrado: metade do tempo em 0, metade do tempo em 1.

### Por que SP importa?

A potência dinâmica não depende só de quantas vezes um sinal muda. Ela também depende de como essa atividade atravessa a lógica combinacional.

Por exemplo, em uma porta AND:

```verilog
assign y = a & b;
```

Se `b` quase sempre for 0, muitas transições de `a` não chegam à saída `y`. Portanto, a probabilidade estática dos sinais afeta a propagação de atividade pela lógica.

---

## Slide 3 — Switching Activity: Sources

### Texto limpo do slide

**Switching Activity: Sources**

- **RTL or Gate-level Simulation Activity**
  - SAIF (Switching Activity Interchange Format) file
    - Part of IEEE Std 1801 or newer (UPF)

- **Tool Default or User Defined Switching Activity**
  - `power_default_toggle_rate`, `power_default_static_probability`
  - `set_switching_activity`, `infer_switching_activity`
  - `create_clock`, `create_generated_clock`, `set_case_analysis`

- **Tool Propagated Activity**
  - Zero-delay simulation using random vectors generated from known toggle rate (TR) and static probability (SP) values, and cell function
  - Unknown TR/SP values are derived from simulation results

### Leitura didática

O Design Compiler pode receber ou criar atividade de chaveamento por várias fontes.

A melhor fonte costuma ser simulação, porque ela reflete um cenário funcional real ou representativo. O slide cita simulação RTL ou gate-level gerando SAIF.

Mas nem sempre há SAIF disponível. Nesse caso, a ferramenta pode usar valores default, valores definidos pelo usuário ou atividade propagada internamente.

### Hierarquia de qualidade da atividade

De forma prática:

```text
1. SAIF real de simulação representativa
   Melhor fonte para síntese/análise média.

2. set_switching_activity em sinais conhecidos
   Bom quando o projetista conhece comportamento de entradas ou black boxes.

3. infer_switching_activity
   Útil para preencher atividade em essential points sem SAIF.

4. Atividade propagada pela ferramenta
   Depende dos valores conhecidos e da função lógica das células.

5. Atividade default
   Último recurso; pode ser pessimista ou otimista demais.
```

### Comandos e variáveis citados

| Item | Função |
|---|---|
| `power_default_toggle_rate` | Define toggle rate default usado pela ferramenta |
| `power_default_static_probability` | Define static probability default |
| `set_switching_activity` | Anota manualmente atividade em objetos |
| `infer_switching_activity` | Faz inferência de atividade para essential points não anotados |
| `create_clock` | Define clock; também informa atividade de clock |
| `create_generated_clock` | Define clock gerado; também informa atividade |
| `set_case_analysis` | Força valor lógico constante em um ponto |

---

## Slide 4 — Switching Activity Interchange Format (SAIF)

### Texto limpo do slide

**Switching Activity Interchange Format (SAIF)**

**File Content**

- Top-Level & Hierarchical Ports
- Hierarchical Instances (blocks)
- Sequential Output Nets
- Instantiated Cells and Ports

**Switching Activity Information:**

- `T0` is the total time the design object has the value 0
- `T1` is the total time the design object has the value 1
  - `static_probability = T1 / DURATION`
- `TC` is the transition count. This is usually referred to as the toggle count
  - `toggle_rate = TC / DURATION`

Trecho representativo do SAIF mostrado no slide:

```text
(DESIGN "top")
(TIMESCALE 1ns )
(DURATION 1000 )
(INSTANCE risc_core_tb
  (INSTANCE risc_core
    (PORT
      (A\[0\]
        (T0 47)      (T1 0)      (TX 53)      (TZ 17300)
        (TC 0)       (IG 0)
      )
    )
    (NET
      (A\[0\]
        (T0 47)      (T1 0)      (TX 53)      (TZ 17300)
        (TC 0)       (IG 0)
      )
    )
    (INSTANCE BLOCK_A
      (NET delay\[0\]
        (T0 17349)   (T1 0)      (TX 51)
        (TC 0)       (IG 0)
      )
    )
    (INSTANCE MEM_A1
      (PORTS
        (datain\[1\]
          (T0 17349) (T1 0)      (TX 51)
          (TC 0)     (IG 0)
        )
      )
    )
  )
)
```

### Leitura didática

SAIF é uma representação textual/hierárquica da atividade do design.

Ele tem uma estrutura parecida com uma árvore:

```text
design top
└── instance risc_core_tb
    └── instance risc_core
        ├── ports
        ├── nets
        ├── instance BLOCK_A
        │   └── nets
        └── instance MEM_A1
            └── ports
```

Essa estrutura é importante porque o Design Compiler precisa encontrar, dentro do SAIF, os objetos correspondentes ao design que está sendo sintetizado.

### Campos principais

| Campo | Significado |
|---|---|
| `DURATION` | Tempo total observado na simulação |
| `T0` | Tempo em que o objeto ficou em 0 |
| `T1` | Tempo em que o objeto ficou em 1 |
| `TX` | Tempo em valor desconhecido X |
| `TZ` | Tempo em alta impedância Z |
| `TC` | Número de transições, ou toggle count |
| `IG` | Glitches ignorados ou informação relacionada a glitches, dependendo do contexto/formato |

### Fórmulas do slide

```text
static_probability = T1 / DURATION
```

```text
toggle_rate = TC / DURATION
```

A ferramenta usa essas informações para calcular potência média.

---

## Slide 5 — SAIF Generation Testbench Inputs and Outputs

### Texto limpo do slide

**SAIF Generation Testbench Inputs and Outputs**

- Besides the design RTL file, simulation requires:
  - Testbench RTL file, which instantiates the design RTL as the design-under-test
  - Input vectors or stimuli at the testbench level, one file per scenario

- The path `(risc_core_tb/risc_core)` to the current design instantiated in the simulator environment is called the `instance_name` in Design Compiler.

Exemplos mostrados:

```verilog
// Example: Design RTL
module RISC_CORE(...);
...
endmodule
```

```verilog
// Example: Testbench RTL
module risc_core_tb(...);
...
RISC_CORE risc_core (...);
...
endmodule
```

### Leitura didática

Para gerar SAIF, não basta ter o design RTL. É preciso simular o design dentro de um testbench.

O fluxo mostrado é:

```text
RTL do design + testbench + input vectors
             ↓
            VCS
             ↓
          RTL SAIF
             ↓
      Design Compiler NXT
             ↓
      Gate-level netlist
```

O ponto mais importante do slide é o `instance_name`.

No testbench, o design `RISC_CORE` é instanciado com o nome `risc_core` dentro do módulo `risc_core_tb`:

```verilog
module risc_core_tb(...);
  RISC_CORE risc_core (...);
endmodule
```

Então, dentro da simulação, o caminho hierárquico até o DUT é:

```text
risc_core_tb/risc_core
```

Esse caminho é passado para o Design Compiler no comando `read_saif`:

```tcl
read_saif -input risc_core_tb.saif \
    -instance_name risc_core_tb/risc_core
```

### Por que `-instance_name` é crítico?

O SAIF foi gerado no contexto da simulação, onde existe testbench. Mas o Design Compiler normalmente está sintetizando apenas o design, não o testbench inteiro.

Se o `-instance_name` estiver errado, a ferramenta pode não conseguir casar os nomes do SAIF com os objetos do design. O resultado é baixa cobertura de atividade ou anotação incorreta.

---

## Slide 6 — RTL SAIF Provides Accurate Synthesis Switching Activity

### Texto limpo do slide

**RTL SAIF Provides Accurate Synthesis Switching Activity**

- Dynamic power calculation requires accurate switching activity.
- Provided by reading RTL SAIF files from RTL-level simulation, recommended.

Comando mostrado:

```tcl
foreach scen [get_scenarios func.*] {
  current_scenario $scen
  set_scenario_options -dynamic_power true -setup \
true
  read_saif -input risc_core_tb.saif \
    -instance_name risc_core_tb/risc_core
  report_activity -driver
}
```

- RTL SAIF is accurate and recommended because:
  - Annotates all essential points (EPs) from RTL and hierarchical ports
    - Primary input ports, Register output nets, Macro output pins
  - Tool default switching activity is applied to non-annotated primary input ports and macro-output pins
  - Switching activity is propagated to non-EPs, combinational logic nets, during compile

### Leitura didática

Este é um dos slides mais importantes do bloco.

O Design Compiler NXT precisa de atividade para calcular potência dinâmica. O curso recomenda usar **RTL SAIF** porque ele vem de simulação RTL e carrega atividade dos principais pontos do design.

### Explicação do script

```tcl
foreach scen [get_scenarios func.*] {
```

Percorre todos os cenários cujo nome combina com `func.*`.

```tcl
current_scenario $scen
```

Seleciona o cenário atual.

```tcl
set_scenario_options -dynamic_power true -setup true
```

Ativa análise de potência dinâmica e setup no cenário. O `-setup true` é necessário porque potência interna depende de transições/slew, que vêm da análise de timing.

```tcl
read_saif -input risc_core_tb.saif \
    -instance_name risc_core_tb/risc_core
```

Lê o SAIF gerado pela simulação RTL e informa onde o design sintetizado aparece dentro da hierarquia do testbench.

```tcl
report_activity -driver
```

Gera relatório da origem/cobertura da atividade de chaveamento.

### Essential Points (EPs)

O slide usa o termo **essential points**, ou EPs.

No contexto da aula, EPs são pontos essenciais onde a atividade precisa ser conhecida ou anotada para que a ferramenta consiga calcular e propagar atividade corretamente.

Os exemplos do slide são:

- primary input ports;
- register output nets;
- macro output pins.

A partir desses pontos, a ferramenta consegue propagar atividade para lógica combinacional interna.

---

## Slide 7 — Switching Activity Coverage

### Texto limpo do slide

**Switching Activity Coverage**

- Use `report_activity -driver` to ensure near 100% switching activity coverage on essential points, broken down by activity type.

- Use `report_saif -rtl -hierarchy -missing` to list the design elements that do not have user specified switching activity annotation.

### Leitura didática

Depois de ler SAIF ou aplicar atividade manualmente, não basta confiar que tudo foi anotado corretamente. É preciso checar a cobertura.

O comando principal é:

```tcl
report_activity -driver
```

Ele mostra a cobertura por tipo de atividade, por exemplo:

- simulated;
- annotated;
- inferred;
- propagated;
- default.

A meta prática indicada no slide é ficar próximo de **100% de coverage nos essential points**.

### Comando para encontrar o que está faltando

```tcl
report_saif -rtl -hierarchy -missing
```

Esse comando lista elementos do design que não receberam anotação de atividade especificada pelo usuário.

É útil quando:

- o `read_saif` não mapeou corretamente;
- o `-instance_name` está errado;
- há portas ou registradores sem atividade;
- o fluxo está usando defaults sem você perceber.

### Interpretação prática

Se muitos EPs aparecem como `default`, isso é alerta.

```text
EPs com atividade real/simulada/anotada/inferida → melhor
EPs com atividade default → cuidado
```

Default pode ser aceitável para sinais pouco relevantes, mas é perigoso para sinais de alto impacto, como resets, enables, clocks, saídas de macros e saídas de registradores.

---

## Slide 8 — Activity Types

### Texto limpo do slide

**Activity Types**

- Activity types allow the user to recognize where in the flow the activity switching information for an object originates.

- Activity type can be checked by using the `get_switching_activity` or `report_activity` commands.

- There are no attributes for the activity type in Design Compiler.

Tabela do slide:

| Activity Type | Activity stemming from command/construct/engine |
|---|---|
| `simulated` | `read_saif` |
| `annotated` | `set_switching_activity` |
| `annotated` | `create_clock` |
| `annotated` | `create_generated_clock` |
| `annotated` | `set_case_analysis` |
| `default` | Timer propagated `set_case_analysis` |
| `default` | Verilog/VHDL netlist constant (`1'b0`, `1'b1`) |
| `default` | Connected to supply net |
| `default` | Default activity |
| `propagated` | Forward or backward implication during buffer or inverter propagation |
| `propagated` | Calculated by propagation engine |
| `inferred` | `infer_switching_activity` |

### Leitura didática

Activity type responde à pergunta:

```text
De onde veio esta atividade de chaveamento?
```

Isso é muito importante para depurar potência.

Se uma net aparece com atividade `simulated`, a informação veio do SAIF. Se aparece como `default`, talvez a ferramenta esteja apenas chutando com base em valores padrão. Se aparece como `inferred`, veio do comando `infer_switching_activity`.

### Como consultar

Os comandos citados são:

```tcl
get_switching_activity
```

```tcl
report_activity
```

O slide também alerta que não existem atributos específicos para activity type no Design Compiler. Ou seja, não é algo que você simplesmente acessa como atributo comum de objeto. A forma normal é consultar pelos comandos de relatório/atividade.

---

## Slide 9 — Activity Types: Example

### Texto limpo do slide

**Activity Types: Example**

The following diagram exemplifies multiple types of activity in a design.

Comandos mostrados:

```tcl
set_app_var power_default_toggle_rate 0.03
set_app_var power_default_static_probability 0.4
set_app_var power_default_toggle_rate_type fastest_clock
create_clock [get_port CLK] -period 10
set_case_analysis 0 [get_port DFT_EN]
set_switching_activity [get_port DIN] -toggle_rate 0.1 -static_probability 0.45
set_switching_activity [get_pin a_reg/Q] -toggle_rate 0.1 -static_probability 0.45 -base_clock *
```

Valores destacados no diagrama:

```text
RST
  toggle_rate        = 0.03/10 = 0.003
  static_probability = 0.4
  activity_type      = default

DIN
  toggle_rate        = 0.1
  static_probability = 0.45
  activity_type      = annotated

DFT_EN
  toggle_rate        = 0
  static_probability = 0
  activity_type      = default

CLK
  toggle_rate        = 2/10 = 0.2
  static_probability = 0.5
  activity_type      = default

b_reg/Q
  toggle_rate        = 0.01854
  static_probability = 0.18
  activity_type      = propagated

A_reg/Q
  toggle_rate        = 0.1/10 = 0.01
  static_probability = 0.45
  activity_type      = annotated

MACRO/DOUT
  toggle_rate        = 0.03/10 = 0.003
  static_probability = 0.4
  activity_type      = default
```

### Leitura didática

Esse slide é um exemplo completo de como diferentes sinais podem receber activity type diferente no mesmo design.

### Default activity

O comando:

```tcl
set_app_var power_default_toggle_rate 0.03
set_app_var power_default_static_probability 0.4
```

cria valores padrão.

Se um sinal não receber atividade por SAIF, por anotação manual, por inferência ou por propagação confiável, a ferramenta pode usar esses valores.

No exemplo, `RST` e `MACRO/DOUT` usam default:

```text
toggle_rate = 0.03/10 = 0.003
static_probability = 0.4
```

### Clock

```tcl
create_clock [get_port CLK] -period 10
```

Para o clock:

```text
toggle_rate = 2/10 = 0.2
static_probability = 0.5
```

Como o período é 10, e o clock tem duas transições por período, o toggle rate é 0.2.

### Case analysis

```tcl
set_case_analysis 0 [get_port DFT_EN]
```

Isso força `DFT_EN` para 0. Por isso:

```text
toggle_rate = 0
static_probability = 0
```

Ou seja, o sinal é tratado como constante 0.

### Atividade anotada manualmente

```tcl
set_switching_activity [get_port DIN] -toggle_rate 0.1 -static_probability 0.45
```

Aqui o usuário informou diretamente o comportamento de `DIN`. Por isso o tipo é `annotated`.

Também foi anotada a saída de registrador:

```tcl
set_switching_activity [get_pin a_reg/Q] -toggle_rate 0.1 -static_probability 0.45 -base_clock *
```

O diagrama mostra `A_reg/Q` com activity type `annotated`.

### Atividade propagada

`b_reg/Q` aparece como `propagated`. Isso significa que a ferramenta calculou essa atividade com base na lógica, nos valores conhecidos e no mecanismo de propagação.

---

## Slide 10 — Limitations with the set_switching_activity Approach

### Texto limpo do slide

**Limitations with the `set_switching_activity` Approach**

- Primary control inputs, reset and enable, that are not user-annotated inherit default switching activity values.
  - Since these inputs typically remain static, dynamic power calculations of the logic associated with these control inputs can be pessimistically high.
  - Default switching activity is set depending on the `power_default_toggle_rate`, `power_default_static_probability` and the related clock period.

- Tool-propagated switching activity of sequential output pins tends to approach a zero-toggle rate.
  - Dynamic power calculations of the downstream logic can be optimistically low.

- `infer_switching_activity` will apply appropriate static values to control signals, as well as better toggle rates for sequential output pins.

### Leitura didática

Esse slide explica por que apenas usar `set_switching_activity` manualmente não resolve tudo.

Existem dois problemas opostos:

1. **Pessimismo em sinais de controle**
2. **Otimismo em saídas sequenciais propagadas**

### Problema 1 — Reset e enable podem ficar pessimistas

Sinais como reset e enable geralmente ficam parados por longos períodos.

Exemplo:

```text
reset = 0 durante quase toda a operação normal
```

Se você não anota esse sinal, ele pode herdar atividade default. Se o default diz que o sinal alterna, a ferramenta pode calcular potência dinâmica demais em toda a lógica ligada ao reset.

Resultado:

```text
Potência calculada maior que a real → pessimismo
```

### Problema 2 — Saídas sequenciais propagadas podem ficar otimistas

O slide diz que atividade propagada pela ferramenta em saídas de elementos sequenciais tende a se aproximar de toggle zero.

Isso pode fazer a lógica downstream parecer menos ativa do que realmente é.

Resultado:

```text
Potência calculada menor que a real → otimismo
```

### Solução indicada

Usar:

```tcl
infer_switching_activity
```

Esse comando melhora os dois lados:

- aplica valores estáticos mais apropriados a sinais de controle;
- aplica toggle rates melhores para saídas sequenciais.

---

## Slide 11 — `infer_switching_activity`

### Texto limpo do slide

**`infer_switching_activity`**

Identifies essential points (EPs) and infers an activity.

- EPs that drive special control inputs (SCIs), such as resets and enables, are made static high/low.

- EPs that do not drive SCIs receive inferred switching activity.
  - The inferred switching activity is calculated using the settings of the `power_default_*` app options.
  - Inferred switching activity overrides the propagated activity.

### Leitura didática

Este slide formaliza a função de `infer_switching_activity`.

A ferramenta identifica **essential points** e decide que tipo de atividade faz sentido para eles.

### SCI — Special Control Input

SCI significa **special control input**.

Exemplos citados:

- reset;
- enable.

Esses sinais não devem ser tratados como dados aleatórios comuns, porque normalmente têm comportamento mais estático.

Por exemplo:

```text
reset ativo apenas na inicialização
enable pode ficar parado durante muitos ciclos
```

Por isso, quando um EP dirige um SCI, a ferramenta tende a torná-lo estático alto ou baixo, dependendo do caso.

### EPs que não dirigem SCI

Para EPs que não alimentam entradas especiais de controle, a ferramenta usa inferência baseada nas opções `power_default_*`.

Exemplos dessas opções:

```tcl
power_default_toggle_rate
power_default_static_probability
power_default_toggle_rate_type
```

### Inferido sobrescreve propagado

O slide afirma:

```text
Inferred switching activity overrides the propagated activity.
```

Isso é importante. Se uma saída sequencial recebeu uma atividade propagada ruim, próxima de zero, `infer_switching_activity` pode substituir essa estimativa por uma inferida mais adequada.

---

## Slide 12 — Recommended Setup for `infer_switching_activity`

### Texto limpo do slide

**Recommended Setup for `infer_switching_activity`**

1. Load timing constraints.

2. Use `set_switching_activity` for any ports with known required activity.

```tcl
current_scenario func.tt_60c
set_switching_activity -toggle_rate 0.02 -static_probability 0.7 [get_ports a]
set_switching_activity -toggle_rate 0.06 -static_probability 0.3 [get_ports b]
...
```

3. Use `infer_switching_activity` for all remaining unannotated EPs.

```tcl
set_scenario_options -scenarios func.ff_125c -setup true -dynamic_power true
infer_switching_activity -scenarios func.ff_125c \
    -sci_based all -apply
```

- `-sci_based` allowed values: `sci`, `non_sci`, `all`
- `-sci_based all` is recommended value since it annotates special control inputs (SCIs) and essential points (EPs), like reading a SAIF file.

### Leitura didática

O slide recomenda um fluxo de fallback quando você não tem SAIF completo.

### Passo 1 — Carregar timing constraints

Antes de inferir atividade, carregue constraints de timing.

Isso é necessário porque a ferramenta precisa entender clocks, cenários, relações temporais e contexto de análise.

### Passo 2 — Anotar o que você sabe

Se você conhece atividade de certos sinais, use `set_switching_activity`.

Exemplo:

```tcl
set_switching_activity -toggle_rate 0.02 -static_probability 0.7 [get_ports a]
```

Isso diz:

```text
porta a alterna com toggle_rate 0.02 e fica em 1 cerca de 70% do tempo.
```

### Passo 3 — Inferir o restante

Depois, use:

```tcl
infer_switching_activity -scenarios func.ff_125c \
    -sci_based all -apply
```

Esse comando aplica atividade inferida aos EPs restantes.

### Opções de `-sci_based`

| Opção | Ideia |
|---|---|
| `sci` | Foco nos pontos relacionados a special control inputs |
| `non_sci` | Foco nos pontos que não dirigem SCIs |
| `all` | Aplica nos dois casos |

O curso recomenda:

```tcl
-sci_based all
```

Porque isso se aproxima do efeito de ler um SAIF: cobre SCIs e EPs.

---

## Slide 13 — Gate-Level SAIF

### Texto limpo do slide

**Gate-Level SAIF**

- Ideally, gate-level SAIF is generated for physical design and post-synthesis power analysis.
  - Provides accurate activity for all nets.
  - Increases the turnaround time of full-flow.

- Power comparison between multiple runs requires activity files with the same accuracy.
  - Cannot compare reported power using Gate-level SAIF and RTL SAIF.

### Leitura didática

Gate-level SAIF é gerado simulando a netlist gate-level.

Fluxo conceitual:

```text
Testbench + input vectors + gate-level netlist
                  ↓
                 VCS
                  ↓
              GL SAIF
                  ↓
        IC Compiler II / PrimePower
```

### Por que gate-level SAIF é mais preciso?

Porque após a síntese existem objetos que não existiam no RTL da mesma forma:

- buffers inseridos;
- inversores;
- células mapeadas da biblioteca;
- registradores replicados;
- bancos multibit;
- mudanças de nome;
- otimizações estruturais.

Gate-level SAIF consegue refletir atividade em todas essas nets finais.

### Custo

O slide aponta que isso aumenta o turnaround time do fluxo completo.

Simular gate-level costuma ser mais pesado do que simular RTL.

### Pegadinha importante

O slide diz que não se deve comparar potência de uma run usando RTL SAIF com outra usando gate-level SAIF.

Motivo:

```text
RTL SAIF e GL SAIF têm acurácias diferentes.
```

Se a potência mudou, pode ser porque o design melhorou ou simplesmente porque a fonte de atividade ficou mais precisa.

Comparação justa exige o mesmo tipo de atividade nos experimentos.

---

## Slide 14 — RTL SAIF Is Commonly Used Post-Synthesis

### Texto limpo do slide

**RTL SAIF Is Commonly Used Post-Synthesis**

- In practice, RTL SAIF is commonly used post-synthesis.
  - Resources to generate gate-level SAIF may be limited.

- An RTL SAIF file cannot directly be read in gate level objects.
  - Netlist changes must be tracked in a name-mapping database that can be written to a name-mapping file to be passed to downstream EDA tools.

- PrimePower can read an RTL FSDB file onto a Gate-Level netlist using the mapping file to increase switching activity propagation accuracy.

### Leitura didática

O slide reconhece a prática real: embora gate-level SAIF seja ideal para análise pós-síntese/física, muitas vezes a equipe usa RTL SAIF porque é mais barato e mais disponível.

O problema é que RTL SAIF usa nomes do RTL/testbench, enquanto a netlist gate-level tem nomes alterados pela síntese.

Por isso, é necessário um banco de mapeamento de nomes:

```text
nome RTL  ->  nome gate-level
```

Esse mapeamento é gravado em um arquivo e passado para ferramentas downstream, como IC Compiler II e PrimePower.

### Ideia do fluxo mostrado no diagrama

```text
RTL + testbench + vectors
        ↓ VCS
      FSDB / RTL SAIF
        ↓
Design Compiler NXT
        ↓
Gate-level netlist + mapping file
        ↓
IC Compiler II / PrimePower
```

O mapping file permite que uma atividade originada em RTL seja aplicada corretamente em objetos pós-síntese.

---

## Slide 15 — Synthesis Changes Names so SAIF Mapping Is Required

### Texto limpo do slide

**Synthesis Changes Names so SAIF Mapping Is Required**

- Synthesis can change design-invariants point names:
  - RTL elaboration appends `_reg` to sequential elements.
  - Compile optimizations can make additional changes, e.g. replicating registers, multibit banking, using inverted outputs.

- SAIF mapping flow is required to ensure proper name mapping and annotation between RTL SAIF files and gate-level netlists.

### Leitura didática

Esse slide explica o motivo técnico do mapeamento.

Mesmo que um registrador conceitualmente seja “o mesmo” antes e depois da síntese, seu nome físico ou hierárquico pode mudar.

Exemplos do slide:

| Transformação | Exemplo conceitual |
|---|---|
| Elaboração RTL | `A` vira `A_reg` |
| Replicação | `B_reg` vira `B_reg` e `B_reg_rep1` |
| Multibit banking | `C_reg[0]` e `C_reg[1]` viram uma célula multibit |
| Saída invertida | ferramenta usa `QN` em vez de `Q` |

### Por que isso afeta SAIF?

O SAIF de RTL pode dizer:

```text
atividade de C[0]
```

Mas a netlist pode conter:

```text
C_reg_0_1_MB/Q0
```

Sem mapeamento, a ferramenta não sabe automaticamente que esses nomes representam o mesmo ponto lógico.

---

## Slide 16 — Synthesis Changes Names so SAIF Mapping Is Required: Example

### Texto limpo do slide

O slide mostra um exemplo com RTL, elaboração, simulação, SAIF, compilação e arquivo de mapeamento PrimePower.

RTL ilustrativo:

```verilog
module top ();
  reg A, B, D;
  reg [1:0] C;

  always @ (posedge clk)
  begin
    A <= A_new;
    B <= B_new;
    C <= C_new;
    D <= D_new;
  end
endmodule
```

Após elaboração, aparecem nomes como:

```text
A_reg
B_reg
B_reg_
C[0]_reg
C[1]_reg
D_reg
```

Após compilação, aparecem mudanças adicionais, como:

```text
B_reg_rep1
C_reg_0_1_MB
D_reg com QN
```

Exemplo de arquivo de mapeamento PrimePower mostrado no slide:

```tcl
set_rtl_to_gate_name -rtl {A}    -gate [get_pin { A_reg/Q}]
set_rtl_to_gate_name -rtl {B}    -gate [get_pin { B_reg/Q}]
set_rtl_to_gate_name -rtl {B}    -gate [get_pin { B_reg_rep1/Q}]
set_rtl_to_gate_name -rtl {C[0]} -gate [get_pin { C_reg_0_1_MB/Q0}]
set_rtl_to_gate_name -rtl {C[1]} -gate [get_pin { C_reg_0_1_MB/Q1}]
set_rtl_to_gate_name -rtl {D}    -gate [get_pin { D_reg/QN }] -inverted
```

### Leitura didática

O exemplo mostra que um mesmo RTL pode gerar vários objetos gate-level.

A linha mais interessante é:

```tcl
set_rtl_to_gate_name -rtl {D} -gate [get_pin { D_reg/QN }] -inverted
```

Ela indica que o RTL `D` está sendo associado à saída invertida `QN` do registrador gate-level. Por isso o mapping precisa informar `-inverted`.

Outro ponto importante é o multibit:

```tcl
set_rtl_to_gate_name -rtl {C[0]} -gate [get_pin { C_reg_0_1_MB/Q0}]
set_rtl_to_gate_name -rtl {C[1]} -gate [get_pin { C_reg_0_1_MB/Q1}]
```

O RTL tinha bits separados, mas a síntese agrupou os registradores em uma célula multibit. O mapping conecta cada bit RTL à saída correta da célula multibit.

---

## Slide 17 — Example Script with SAIF Mapping Flow

### Texto limpo do slide

**Example Script with SAIF Mapping Flow**

Script mostrado:

```tcl
saif_map -start
set_app_var hdlin_enable_upf_compatible_naming true
analyze < RISC_CORE_rtl.v > + elaborate RTL (RISC_CORE)
...
current_scenario $scen
set_scenario_options -dynamic_power true -setup true

read_saif -input risc_core_tb.saif -auto_map_names \
          -instance risc_core_tb/risc_core

report_activity -driver -scenarios $scen

compile_ultra
...
report_activity -driver -scenarios $scen

change_names -rules verilog -hier
set_app_var power_derive_rtl_saif_map true
saif_map -write_map saifmap.icc2
saif_map -write_map saifmap.ppwr -type primepower
write_file -format verilog -hier -out design.netl
```

Anotações laterais do slide:

- `saif_map -start` turns on name mapping and initializes name database with RTL names.
- `hdlin_naming_upf_compatible` enables Presto elaborates names like SAIF names and aligns identifiers between simulation and synthesis.
- `set_scenario_options` creates at least one dynamic setup scenario and annotates switching on it.
- `read_saif -auto_map_names` is mandatory to initialize name database with RTL names.
- `report_activity -driver` checks annotation rate.
- `power_derive_rtl_saif_map` allows `saif_map` to derive RTL names based on names assigned during RTL elaboration. It is recommended to generate a mapping file without reading a SAIF file.
- `saif_map -write_map -type` writes name-mapping database in IC Compiler II or PrimePower format.

### Leitura didática linha por linha

```tcl
saif_map -start
```

Liga o fluxo de mapeamento de nomes SAIF. A ferramenta começa a construir uma base de nomes RTL/gate para permitir rastrear os objetos após síntese.

```tcl
set_app_var hdlin_enable_upf_compatible_naming true
```

Ajusta a elaboração para usar nomes compatíveis com UPF/SAIF, ajudando a alinhar identificadores entre simulação e síntese.

```tcl
analyze < RISC_CORE_rtl.v > + elaborate RTL (RISC_CORE)
```

Representa a leitura/análise e elaboração do RTL.

```tcl
current_scenario $scen
set_scenario_options -dynamic_power true -setup true
```

Seleciona o cenário e ativa análise de potência dinâmica e setup.

```tcl
read_saif -input risc_core_tb.saif -auto_map_names \
          -instance risc_core_tb/risc_core
```

Lê o SAIF gerado na simulação e usa `-auto_map_names` para iniciar/ajudar o mapeamento automático dos nomes.

O `-instance` indica onde o design aparece dentro do testbench.

```tcl
report_activity -driver -scenarios $scen
```

Confere se a atividade foi aplicada corretamente e qual a origem da atividade.

```tcl
compile_ultra
```

Executa a otimização/síntese.

```tcl
report_activity -driver -scenarios $scen
```

Confere novamente a atividade depois da compilação.

```tcl
change_names -rules verilog -hier
```

Normaliza nomes para estilo Verilog hierárquico.

```tcl
set_app_var power_derive_rtl_saif_map true
```

Permite derivar mapeamento RTL-SAIF a partir dos nomes da elaboração RTL.

```tcl
saif_map -write_map saifmap.icc2
```

Escreve mapping file em formato para IC Compiler II.

```tcl
saif_map -write_map saifmap.ppwr -type primepower
```

Escreve mapping file em formato para PrimePower.

```tcl
write_file -format verilog -hier -out design.netl
```

Grava a netlist gate-level.

### Ideia geral do script

O fluxo não está apenas lendo SAIF. Ele está preparando a síntese para que, após otimizações e mudanças de nome, ferramentas downstream ainda consigam associar atividade RTL aos objetos gate-level.

---

## Slide 18 — Summary: Switching Activity Recommendations

### Texto limpo do slide

**Summary: Switching Activity Recommendations**

- Use RTL SAIF for synthesis whenever possible.

- If RTL SAIF is not available for synthesis:
  - Apply `set_switching_activity` on primary inputs and black box outputs.
  - Increase accuracy of switching activity on SCI's and register outputs by applying:

```tcl
infer_switching_activity -scib_based all
```

- If gate-level SAIF is not expected to be available post-synthesis:
  - Enable the SAIF mapping flow before synthesis optimization.
  - Write out SAIF mapping files for IC Compiler II and PrimePower after synthesis.

> Observação: nos slides anteriores o comando aparece como `-sci_based all`. No resumo, a imagem parece mostrar `-scib_based all`. Para o estudo e para o fluxo coerente do próprio material, trate a opção como `-sci_based all`, conforme o slide de setup recomendado.

### Leitura didática

O resumo deixa três regras práticas.

### Regra 1 — Use RTL SAIF sempre que possível

Esse é o melhor fluxo para síntese porque traz atividade real de simulação RTL com custo menor que simulação gate-level.

### Regra 2 — Sem RTL SAIF, anote e infira

Se não houver SAIF:

```tcl
set_switching_activity
```

para sinais conhecidos, especialmente:

- primary inputs;
- black box outputs.

Depois:

```tcl
infer_switching_activity -sci_based all -apply
```

para melhorar cobertura em:

- SCIs;
- register outputs;
- essential points restantes.

### Regra 3 — Se não haverá gate-level SAIF, prepare mapping

Se o fluxo pós-síntese/físico vai usar RTL SAIF/FSDB em vez de gate-level SAIF, então é preciso habilitar o SAIF mapping flow antes da otimização.

Depois da síntese, gere os mapping files para:

- IC Compiler II;
- PrimePower.

---

# Aula didática desenvolvida

## 1. O problema que esta aula resolve

A aula anterior introduziu que potência dinâmica depende de atividade. Esta aula responde à pergunta prática:

```text
Como informar atividade de chaveamento ao Design Compiler NXT de forma confiável?
```

Sem essa informação, o DC NXT pode até calcular potência, mas o cálculo será baseado em defaults ou inferências fracas. Isso pode distorcer totalmente a análise.

Exemplo simples:

```text
reset quase nunca chaveia na operação normal.
```

Se a ferramenta assumir que reset chaveia como um sinal comum, ela calculará potência dinâmica demais na lógica controlada por reset.

Outro exemplo:

```text
saída de registrador alimenta grande lógica combinacional.
```

Se a ferramenta propagar atividade e chegar perto de toggle zero nessa saída, ela calculará potência de menos no bloco downstream.

Portanto, low power depende não só de comandos de otimização, mas também de **qualidade da atividade de chaveamento**.

---

## 2. Waveform versus SAIF

A waveform é rica em informação, mas pesada. Ela responde:

```text
Quando exatamente cada sinal mudou?
```

O SAIF é resumido. Ele responde:

```text
Durante a simulação, quanto tempo o sinal ficou em 0, em 1, em X/Z, e quantas vezes mudou?
```

Para debug, waveform é melhor. Para potência média em síntese, SAIF costuma ser mais direto.

### VCD

VCD significa **Variable Change Dump**. É um formato tradicional para armazenar mudanças de sinais em simulação.

### FSDB

FSDB significa **Fast Signal Database**. É um formato eficiente bastante usado no ecossistema Synopsys/Verdi para armazenar waveforms grandes.

### SAIF

SAIF significa **Switching Activity Interchange Format**. É voltado à troca de atividade de chaveamento entre ferramentas.

---

## 3. Como a potência dinâmica usa TR e SP

A potência dinâmica média tem relação com:

```text
atividade × capacitância × tensão² × frequência
```

No nível da ferramenta, a atividade é modelada principalmente por:

- toggle rate;
- static probability.

### Toggle rate e consumo

Se uma net tem alta capacitância e alterna muito, ela consome muito.

```text
net grande + toggle alto = potência dinâmica alta
```

Clock é um caso extremo: ele alterna continuamente e alimenta muitos registradores. Por isso técnicas como clock gating aparecem mais adiante no curso.

### Static probability e propagação lógica

Static probability ajuda a ferramenta a estimar a chance de uma transição atravessar lógica combinacional.

Exemplo:

```verilog
assign y = a & b;
```

Se `b` quase sempre é 0, `y` quase sempre é 0, mesmo que `a` alterne muito. Portanto, `SP(b)` influencia a atividade de `y`.

---

## 4. O fluxo recomendado com RTL SAIF

O melhor caminho para síntese é:

```text
1. Simular RTL com testbench representativo.
2. Gerar RTL SAIF.
3. Ler o SAIF no Design Compiler NXT.
4. Ativar dynamic power e setup no cenário.
5. Conferir cobertura com report_activity -driver.
6. Rodar compile/otimização.
```

Script base:

```tcl
foreach scen [get_scenarios func.*] {
  current_scenario $scen
  set_scenario_options -dynamic_power true -setup true
  read_saif -input risc_core_tb.saif \
    -instance_name risc_core_tb/risc_core
  report_activity -driver
}
```

### Por que um SAIF por cenário?

O slide menciona input vectors ou stimuli no nível do testbench, um arquivo por cenário.

Isso importa porque modos diferentes podem ter atividades diferentes.

Exemplo:

| Cenário | Atividade esperada |
|---|---|
| modo idle | baixa atividade |
| modo encode/decode | atividade média |
| modo performance | alta atividade |
| modo scan/test | clocks e enables diferentes |

Se você usa um SAIF de modo idle para otimizar um modo performance, a análise pode ficar enganosa.

---

## 5. O papel de `-instance_name`

O SAIF é gerado pela simulação do testbench. O Design Compiler sintetiza o DUT.

No exemplo:

```verilog
module risc_core_tb(...);
  RISC_CORE risc_core (...);
endmodule
```

O caminho do DUT na simulação é:

```text
risc_core_tb/risc_core
```

Esse caminho precisa ser indicado ao ler o SAIF:

```tcl
read_saif -input risc_core_tb.saif \
  -instance_name risc_core_tb/risc_core
```

Se o caminho estiver errado, o Design Compiler pode ler o arquivo, mas não aplicar a atividade corretamente aos objetos do design.

Sintoma típico:

```text
report_activity -driver mostra baixa cobertura ou muita atividade default.
```

---

## 6. Como saber se a atividade foi bem aplicada

Use:

```tcl
report_activity -driver
```

O objetivo é observar a origem da atividade nos essential points.

Se o relatório mostra quase tudo como `simulated`, `annotated` ou `inferred`, o setup está mais confiável.

Se mostra muitos EPs como `default`, investigue.

Use também:

```tcl
report_saif -rtl -hierarchy -missing
```

Esse comando ajuda a listar elementos sem anotação especificada.

### Regra mental

```text
Sem relatório, você não sabe se o SAIF funcionou.
```

Ler SAIF sem checar cobertura é uma armadilha comum em fluxo de potência.

---

## 7. Activity types como ferramenta de debug

Activity type mostra a origem da atividade.

| Activity type | Confiança prática | Comentário |
|---|---|---|
| `simulated` | Alta | Veio de SAIF |
| `annotated` | Alta se o usuário souber o valor | Veio de comando manual ou constraint |
| `inferred` | Média/boa | Ferramenta inferiu com regra melhor que default |
| `propagated` | Depende | Calculada pela propagação lógica |
| `default` | Baixa/média | Valor padrão; precisa cuidado |

O tipo `default` não é automaticamente errado, mas deve ser consciente.

Exemplo aceitável:

```text
um sinal irrelevante de debug usa default
```

Exemplo perigoso:

```text
reset, enable, macro output ou register output importante usando default
```

---

## 8. Quando usar `set_switching_activity`

Use quando você sabe o comportamento de um sinal.

Exemplo:

```tcl
set_switching_activity -toggle_rate 0.02 -static_probability 0.7 [get_ports a]
```

Bom para:

- primary inputs;
- black box outputs;
- sinais de interface com comportamento conhecido;
- sinais de controle cujo comportamento é definido por especificação.

Mas não tente anotar tudo manualmente. Isso é trabalhoso e fácil de errar.

---

## 9. Quando usar `infer_switching_activity`

Use quando não há SAIF ou quando há lacunas de anotação em EPs.

Fluxo recomendado:

```text
1. Carrega constraints.
2. Anota manualmente sinais conhecidos.
3. Usa infer_switching_activity nos EPs restantes.
```

Comando recomendado:

```tcl
infer_switching_activity -scenarios func.ff_125c \
    -sci_based all -apply
```

### Por que `-sci_based all`?

Porque cobre:

- EPs que dirigem special control inputs;
- EPs que não dirigem special control inputs.

Isso evita os dois extremos:

- reset/enable com atividade default alta demais;
- saídas sequenciais com atividade propagada baixa demais.

---

## 10. Gate-level SAIF versus RTL SAIF

Gate-level SAIF é mais fiel ao design pós-síntese, mas mais caro.

RTL SAIF é mais comum porque é mais fácil de gerar.

Comparação:

| Critério | RTL SAIF | Gate-level SAIF |
|---|---|---|
| Custo de simulação | Menor | Maior |
| Disponibilidade no início do fluxo | Alta | Só depois da netlist |
| Precisão nos objetos finais | Menor | Maior |
| Uso em síntese | Recomendado | Não é o padrão para síntese inicial |
| Uso pós-síntese/físico | Usado com mapping | Ideal, se disponível |

### Regra de comparação

Não compare uma run com RTL SAIF contra outra com gate-level SAIF.

Use a mesma precisão de atividade para comparar otimizações.

---

## 11. Por que SAIF mapping é obrigatório em muitos fluxos

A síntese muda nomes.

Mesmo que a lógica seja equivalente, os identificadores podem mudar.

Exemplos:

```text
A       -> A_reg
B       -> B_reg e B_reg_rep1
C[0]    -> C_reg_0_1_MB/Q0
C[1]    -> C_reg_0_1_MB/Q1
D       -> D_reg/QN com inversão
```

Se um RTL SAIF fala sobre `C[0]`, a ferramenta downstream precisa saber que isso corresponde a `C_reg_0_1_MB/Q0` na netlist.

Esse é o papel do mapping file.

---

# Conceitos difíceis explicados em profundidade

## 1. Essential Points (EPs)

EPs são pontos em que a atividade é essencial para a propagação correta de potência.

Pelo slide, exemplos são:

- primary input ports;
- register output nets;
- macro output pins.

Esses pontos funcionam como fontes de atividade para o resto do design.

Se a atividade nos EPs estiver errada, a atividade propagada para a lógica combinacional também ficará errada.

### Exemplo

```text
Entrada DIN com toggle real alto
mas ferramenta assume toggle baixo
→ lógica combinacional downstream terá potência subestimada
```

---

## 2. Special Control Inputs (SCIs)

SCIs são entradas especiais de controle, como:

- reset;
- enable.

Esses sinais não devem ser tratados como dados aleatórios comuns.

Por exemplo, reset normalmente fica parado em modo funcional. Se ele herda default toggle, a ferramenta pode achar que toda lógica de reset está chaveando frequentemente.

`infer_switching_activity` corrige isso tornando esses controles estáticos alto/baixo quando apropriado.

---

## 3. `read_saif`

Comando central para carregar atividade de simulação.

Forma típica:

```tcl
read_saif -input risc_core_tb.saif \
  -instance_name risc_core_tb/risc_core
```

ou, no fluxo de mapping:

```tcl
read_saif -input risc_core_tb.saif -auto_map_names \
  -instance risc_core_tb/risc_core
```

### O que observar

- O arquivo SAIF existe e veio da simulação correta?
- O testbench usou vetores representativos?
- O `-instance_name` aponta para o DUT correto?
- O cenário está com `-dynamic_power true` e `-setup true`?
- `report_activity -driver` mostra boa cobertura?

---

## 4. `report_activity -driver`

Esse comando é ferramenta de validação.

Ele informa de onde veio a atividade:

```text
simulated / annotated / inferred / propagated / default
```

Use antes e depois de `compile_ultra`, especialmente em fluxos com mapping.

### Uso no script do slide

```tcl
report_activity -driver -scenarios $scen
```

A versão com `-scenarios` limita o relatório ao cenário escolhido.

---

## 5. `report_saif -rtl -hierarchy -missing`

Esse comando ajuda a encontrar lacunas.

```tcl
report_saif -rtl -hierarchy -missing
```

Ele lista elementos do design que não têm atividade especificada pelo usuário.

Use quando:

- a cobertura ficou baixa;
- muitos sinais aparecem default;
- você suspeita de erro no `-instance_name`;
- quer revisar portas/registradores não anotados.

---

## 6. `set_switching_activity`

Anota manualmente atividade.

Exemplo:

```tcl
set_switching_activity -toggle_rate 0.02 -static_probability 0.7 [get_ports a]
```

O comando precisa de dois números principais:

- `-toggle_rate`
- `-static_probability`

### Erro comum

Usar valores genéricos para todos os sinais.

Isso pode ser tão ruim quanto usar default, porque sinais diferentes têm comportamentos muito diferentes.

---

## 7. `infer_switching_activity`

Esse comando é um preenchimento inteligente de atividade.

Forma recomendada pelo slide:

```tcl
infer_switching_activity -scenarios func.ff_125c \
  -sci_based all -apply
```

### Partes do comando

| Parte | Função |
|---|---|
| `-scenarios func.ff_125c` | Escolhe o cenário |
| `-sci_based all` | Aplica inferência para SCIs e não-SCIs |
| `-apply` | Aplica a atividade inferida ao design |

### Por que não substituir SAIF?

`infer_switching_activity` é útil, mas não é uma simulação real. Ele é melhor que default, mas não melhor que um SAIF representativo.

---

## 8. `saif_map`

`saif_map` controla o fluxo de mapeamento de nomes entre RTL e gate-level.

Comandos principais do slide:

```tcl
saif_map -start
```

```tcl
saif_map -write_map saifmap.icc2
```

```tcl
saif_map -write_map saifmap.ppwr -type primepower
```

### Função

Permitir que uma atividade RTL seja aplicada corretamente em objetos pós-síntese, mesmo depois de mudanças de nome.

---

## 9. `-auto_map_names`

No script:

```tcl
read_saif -input risc_core_tb.saif -auto_map_names \
  -instance risc_core_tb/risc_core
```

A anotação lateral do slide diz que `read_saif -auto_map_names` é obrigatório para inicializar a base de nomes com nomes RTL.

### Ideia

A ferramenta usa os nomes do SAIF e da elaboração para construir correspondências automáticas entre RTL e gate.

---

## 10. `power_derive_rtl_saif_map`

No script:

```tcl
set_app_var power_derive_rtl_saif_map true
```

A anotação lateral diz que essa variável permite que `saif_map` derive nomes RTL com base nos nomes atribuídos durante a elaboração RTL. É recomendada para gerar mapping file sem ler um arquivo SAIF.

Isso é útil quando você quer preparar o mapping para ferramentas downstream mesmo sem SAIF naquele momento.

---

# Figuras, diagramas e waveforms importantes

## Página 1 — Waveform versus tabela SAIF

A imagem superior mostra uma waveform e uma tabela resumida. A comparação visual reforça que FSDB/VCD guardam comportamento temporal, enquanto SAIF guarda estatísticas médias por sinal.

## Página 1 — Exemplo de TR e SP

A imagem inferior mostra ondas de sinais e calcula SP/TR. Estude essa figura como base para entender por que `SP(A)` e `TR(A)` podem ser calculados contando amostras e transições.

## Página 2 — Estrutura de SAIF

O slide de SAIF mostra a hierarquia do arquivo: top-level ports, top-level nets, hierarchical instances, nets de sequential, instantiated cell e cell ports. Essa figura deve ser estudada como “mapa mental” do que o `read_saif` precisa casar com o design.

## Página 3 — Fluxo VCS → RTL SAIF → DC NXT

A figura mostra que o SAIF nasce da simulação, não da síntese. O Design Compiler consome esse arquivo para calcular/otimizar potência e gerar netlist.

## Página 4 — Coverage por activity type

A tabela de `report_activity -driver` mostra que cobertura deve ser analisada por tipo de origem. O ideal é ter near 100% coverage nos essential points.

## Página 5 — Exemplo com vários tipos de atividade

O diagrama com `RST`, `DIN`, `DFT_EN`, `CLK`, `a_reg/Q`, `b_reg/Q` e `MACRO/DOUT` mostra que um único design pode misturar atividade default, annotated e propagated. É um slide muito importante para prova.

## Página 6 — EPs, SCIs e inferência

A figura mostra pontos laranja e azuis. Laranja representa special control inputs e EPs que dirigem SCIs; azul representa EPs que não dirigem SCIs. A ferramenta trata esses casos de forma diferente.

## Página 7 — RTL SAIF pós-síntese com mapping file

A figura mostra por que RTL SAIF ainda pode ser usado pós-síntese se houver mapping file. Sem mapping, nomes RTL e gate-level não casam diretamente.

## Página 8 — Mudanças de nome na síntese

As figuras mostram o caminho RTL → elaboração → compilação. Elas destacam `_reg`, replicação, multibit banking e uso de saída invertida `QN`.

## Página 9 — Script completo de SAIF mapping

O script mostra o fluxo operacional: iniciar mapping, elaborar RTL, configurar cenário, ler SAIF com auto mapping, compilar, gerar mapping files para ICC2 e PrimePower e escrever a netlist.

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **Quais são os dois tipos de arquivos para salvar atividade de simulação?**
   - Waveform: FSDB/VCD.
   - Averaged: SAIF.

2. **O que é SAIF?**
   - Switching Activity Interchange Format, arquivo com atividade média de chaveamento.

3. **Quais variáveis modelam atividade em averaged power analysis?**
   - Toggle Rate (TR) e Static Probability (SP).

4. **O que é toggle rate?**
   - Número de transições por unidade de tempo.

5. **Qual é o toggle rate de um clock em relação à frequência?**
   - Duas vezes a frequência.

6. **O que é static probability?**
   - Probabilidade de um nó estar em lógica 1.

7. **Qual é o SP de dado completamente aleatório?**
   - 0.5.

8. **Quais campos do SAIF entram nas fórmulas do slide?**
   - `T1`, `TC` e `DURATION`.

9. **Qual fórmula calcula static probability no slide?**
   - `static_probability = T1 / DURATION`.

10. **Qual fórmula calcula toggle rate no slide?**
    - `toggle_rate = TC / DURATION`.

11. **O que é `instance_name` no Design Compiler?**
    - O caminho hierárquico do DUT dentro do ambiente de simulação/testbench.

12. **No exemplo, qual é o `instance_name`?**
    - `risc_core_tb/risc_core`.

13. **Qual comando lê RTL SAIF?**
    - `read_saif`.

14. **Qual comando verifica coverage e origem da atividade?**
    - `report_activity -driver`.

15. **Qual comando lista elementos sem anotação de switching activity?**
    - `report_saif -rtl -hierarchy -missing`.

16. **Quais são os activity types apresentados?**
    - `simulated`, `annotated`, `default`, `propagated`, `inferred`.

17. **De onde vem activity type `simulated`?**
    - `read_saif`.

18. **De onde vem activity type `inferred`?**
    - `infer_switching_activity`.

19. **Por que apenas `set_switching_activity` tem limitações?**
    - Porque controles não anotados podem herdar default pessimista e saídas sequenciais propagadas podem ficar otimistas demais.

20. **Qual comando melhora atividade de SCIs e saídas sequenciais quando não há SAIF?**
    - `infer_switching_activity -sci_based all -apply`.

21. **Por que gate-level SAIF é ideal para pós-síntese/físico?**
    - Porque fornece atividade precisa para todas as nets gate-level.

22. **Por que nem sempre se usa gate-level SAIF?**
    - Porque aumenta turnaround time e exige mais recursos.

23. **Pode comparar potência de uma run com RTL SAIF e outra com gate-level SAIF?**
    - Não. O slide diz que comparações precisam de arquivos com a mesma acurácia.

24. **Por que SAIF mapping é necessário?**
    - Porque a síntese muda nomes entre RTL e gate-level.

25. **Quais mudanças de nome/estrutura o slide cita?**
    - `_reg`, replicação de registradores, multibit banking e uso de saídas invertidas.

---

## Pegadinhas

| Tema | Pegadinha | Correção |
|---|---|---|
| Waveform vs SAIF | Achar que VCD/FSDB e SAIF têm o mesmo propósito | Waveform guarda transições no tempo; SAIF guarda atividade média |
| Clock TR | Usar frequência do clock como toggle rate | Para clock, TR = 2 × frequência |
| SP | Achar que SP mede transições | SP mede probabilidade de estar em 1 |
| SAIF | Esquecer `-instance_name` | Sem o caminho correto do DUT, a anotação pode falhar |
| Coverage | Ler SAIF e não verificar relatório | Use `report_activity -driver` |
| Defaults | Achar que default é sempre aceitável | Default pode ser pessimista ou otimista |
| Reset/enable | Deixar controles herdarem default | Use SAIF ou inferência para SCIs |
| Saídas sequenciais | Confiar cegamente em propagated activity | Pode tender a toggle zero |
| `infer_switching_activity` | Usar sem `-apply` | Sem `-apply`, pode não aplicar a atividade inferida |
| Comparação de runs | Comparar RTL SAIF com gate-level SAIF | Use mesma acurácia de atividade |
| Pós-síntese | Aplicar RTL SAIF diretamente na netlist | Precisa de mapping file |
| Mapping | Ignorar multibit/inverted output | O mapping precisa capturar essas transformações |

---

# Relação com projeto/laboratório

Esta aula provavelmente prepara scripts de laboratório envolvendo:

- geração ou leitura de SAIF;
- configuração de cenários de potência;
- uso de `set_scenario_options -dynamic_power true -setup true`;
- aplicação manual de atividade com `set_switching_activity`;
- uso de `infer_switching_activity` quando não há SAIF;
- verificação de cobertura com `report_activity -driver`;
- geração de mapping files para ferramentas downstream.

Um script de laboratório inspirado na aula poderia ter esta estrutura:

```tcl
# 1. Seleciona cenário
current_scenario func.tt_60c

# 2. Ativa setup e dynamic power
set_scenario_options -scenarios func.tt_60c \
  -setup true \
  -dynamic_power true

# 3. Lê SAIF, se disponível
read_saif -input risc_core_tb.saif \
  -instance_name risc_core_tb/risc_core

# 4. Confere cobertura
report_activity -driver -scenarios func.tt_60c

# 5. Se necessário, aplica atividade manual
set_switching_activity -toggle_rate 0.02 -static_probability 0.7 [get_ports a]
set_switching_activity -toggle_rate 0.06 -static_probability 0.3 [get_ports b]

# 6. Se não houver SAIF completo, infere o restante
infer_switching_activity -scenarios func.tt_60c \
  -sci_based all -apply

# 7. Confere novamente
report_activity -driver -scenarios func.tt_60c
```

Para fluxos pós-síntese com RTL SAIF, o laboratório pode exigir SAIF mapping:

```tcl
saif_map -start
read_saif -input risc_core_tb.saif -auto_map_names \
  -instance risc_core_tb/risc_core
compile_ultra
set_app_var power_derive_rtl_saif_map true
saif_map -write_map saifmap.icc2
saif_map -write_map saifmap.ppwr -type primepower
```

---

# Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final com caminho copiável.

---

# Próximo bloco recomendado

## Bloco 091 — 03 Power Optimization

- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\03 Power Optimization.docx
```

- **Faixa:** slides `1-7`

- **Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\03 Power Optimization.md
```
