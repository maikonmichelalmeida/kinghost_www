# 03 Module 03 — Power Strategies — parte A

## Controle do bloco

- **Bloco:** 080
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 03 Module 03 — Power Strategies — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies.docx`
- **Arquivo anexado nesta conversa:** `03 Module 03 - Power Strategies.docx`
- **Faixa processada conforme roteiro corrigido:** slides 1-25
- **Observação sobre o anexo:** o arquivo é grande, com 28 páginas renderizadas em imagens e cerca de 60 slides. Este Markdown processa apenas a **parte A**, sem avançar para a parte B.
- **Começa em:** `Planning Your Level Shifting Strategy`
- **Termina em:** `Scope and Defining Isolation`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies_parte_A.md
```

---

## Resumo executivo

Este bloco inicia o módulo **Power Strategies**, um dos módulos mais densos e importantes do curso de UPF. O foco desta parte A é entender duas grandes famílias de estratégias de power intent:

1. **Level Shifter Strategy**
2. **Isolation Strategy**

A aula parte da pergunta prática: quando o design tem múltiplos domínios de potência, múltiplas tensões e domínios que podem desligar, como a ferramenta decide onde inserir células especiais?

As células especiais principais desta parte são:

- **Level shifters (LS):** usados quando sinais cruzam entre domínios de tensões diferentes.
- **Isolation cells (ISO):** usadas quando sinais de domínios desligáveis podem alcançar lógica ainda ligada.

O módulo mostra que a inferência dessas células não depende de um único comando. Ela depende da combinação entre:

```text
UPF strategies
Power State Table / power states
set_voltage
libraries caracterizadas
supplies disponíveis
restrições nos nets
localização permitida
domínio de origem e domínio de destino
```

Para level shifters, a aula responde perguntas como:

```text
Quero LS em inputs, outputs ou ambos?
Quero high-to-low, low-to-high ou ambos?
Em qual domínio a célula deve existir?
A inserção pode ser automática?
Quero reduzir o espaço de solução?
Quero permitir apenas localizações explicitamente definidas?
Como input_supply e output_supply afetam a conexão do LS?
```

Para isolation, a aula responde:

```text
Quero isolar inputs, outputs ou ambos?
Qual valor de clamp usar?
A célula de isolamento deve ficar dentro ou fora do domínio desligável?
Qual é o sinal de controle?
O controle é ativo alto ou ativo baixo?
Que supply alimenta a lógica de isolamento?
Como o scope afeta a definição da estratégia?
```

A mensagem central da parte A é:

```text
Power strategies precisam ser completas e explícitas.
Estratégias incompletas deixam a ferramenta livre para inserir células em lugares inesperados ou gerar comportamento inconsistente entre ferramentas.
```

---

# Parte 1 — Level Shifting Strategy

## Slide 1 — Planning Your Level Shifting Strategy

### Texto extraído

Título:

```text
Planning Your Level Shifting Strategy
```

Perguntas principais:

```text
Do you want to level shift power domain inputs, outputs, or both?
```

```text
Do you want to level shift high-to-low, low-to-high, or both?
```

```text
In what domain(s) do you want the level shifter cells to exist?
```

### Interpretação

A aula começa mostrando que uma estratégia de level shifting deve responder três perguntas.

## 1. Inputs, outputs ou ambos?

Se um power domain recebe sinais de outra tensão, pode ser necessário inserir LS nos **inputs** do domínio.

Se um power domain envia sinais para outra tensão, pode ser necessário inserir LS nos **outputs**.

Se o domínio troca sinais nos dois sentidos, talvez seja necessário inserir LS em ambos.

### Exemplo conceitual

```text
PD_LOW → PD_HIGH
```

Pode exigir level shifter na saída de `PD_LOW` ou na entrada de `PD_HIGH`, dependendo da política de localização.

## 2. high-to-low, low-to-high ou ambos?

O cruzamento pode ser:

```text
high_to_low
low_to_high
both
```

- **low-to-high:** sinal sai de baixa tensão e entra em domínio de tensão maior.
- **high-to-low:** sinal sai de tensão maior e entra em domínio menor.

Nem toda biblioteca tem todas as variantes. A estratégia precisa estar alinhada com as células disponíveis.

## 3. Em qual domínio o LS deve existir?

O level shifter pode ser inserido:

- dentro do domínio de origem;
- dentro do domínio de destino;
- no parent/top;
- automaticamente, conforme a ferramenta decidir.

Essa escolha afeta:

- supply disponível para a célula;
- localização física;
- fronteira hierárquica;
- legalização;
- consistência com fluxo hierárquico.

---

## Slide 2 — How to Get Level Shifters Inferred

### Texto extraído

Título:

```text
How to Get Level Shifters Inferred
```

Pontos:

```text
Define power state table such that there is a need for a voltage shift between power domains
```

Subitem:

```text
PST defines voltage violations; LS inferred to resolve them
```

```text
Define synthesis voltage constraints on power supplies
```

Subitens:

```text
Should correspond to a valid voltage, as defined in the PST
Synopsys command: set_voltage
```

```text
Provide appropriate level shifter cell types in your target libraries
```

Subitens:

```text
Must be characterized for all input/output voltages at which they will be synthesized
Must also have the Liberty attributes defining the entire input and output voltage ranges at which the LS cell may operate
```

### Interpretação

Level shifters não são inferidos apenas porque existe um comando `set_level_shifter`. A ferramenta precisa enxergar uma **violação de tensão** que deve ser resolvida.

A inferência depende de três pilares:

## 1. PST / power states indicando diferença de tensão

A Power State Table precisa dizer que, em algum estado válido, dois domínios operam em tensões diferentes.

Exemplo:

```text
TOP = 0.8 V
PD1 = 1.0 V
```

Se há sinal entre esses domínios, existe necessidade de level shifting.

## 2. `set_voltage` para síntese

O comando Synopsys:

```tcl
set_voltage
```

define tensões específicas nas supplies para a síntese. Essas tensões devem corresponder a valores válidos definidos na PST.

Se a PST fala em `0.8 V` e `1.0 V`, mas a síntese não recebe `set_voltage` coerente, a ferramenta pode não inferir ou mapear corretamente os LS.

## 3. Células LS na biblioteca

A biblioteca precisa ter células level shifter caracterizadas para os ranges de entrada e saída.

Exemplo:

```text
input_voltage_range  = 0.6 V a 0.8 V
output_voltage_range = 0.8 V a 1.2 V
```

Se a célula não está caracterizada para a combinação usada, a inferência pode falhar ou ficar unmapped.

---

## Slide 3 — How to Get Level Shifters Inferred — Exemplo com PST e biblioteca

### Texto extraído

Título:

```text
How to Get Level Shifters Inferred
```

Pontos:

```text
PST defines all allowable supply value combinations (i.e., range)
```

```text
set_voltage defines specific voltages for synthesis
```

Subitem:

```text
Must have a LS library characterized for those voltages
```

Comandos destacados:

```tcl
set_voltage 0.8V -obj VDD
set_voltage 1.0V -obj VDD_PD1
```

Power State Table:

```text
HighPerf: VDD = 0.8, VDD_PD1 = 1.0
LowPerf:  VDD = 0.8, VDD_PD1 = 0.8
```

Trecho de biblioteca ilustrativo:

```text
voltage_map(VDD1, 0.8)
voltage_map(VDD2, 1.0)

cell(HL_Level_Shifter) {
  is_level_shifter : true;
  level_shifter_type : LH;

  pin(A) {
    input_voltage_range(0.6, 0.8);
  }

  pin(Z) {
    output_voltage_range(0.8, 1.2);
  }
}
```

### Interpretação

Este slide conecta PST, `set_voltage` e Liberty.

A PST indica que existem dois estados:

| Estado | VDD | VDD_PD1 |
|---|---:|---:|
| HighPerf | 0.8 | 1.0 |
| LowPerf | 0.8 | 0.8 |

No estado `HighPerf`, há diferença entre os domínios:

```text
VDD = 0.8 V
VDD_PD1 = 1.0 V
```

Se há sinal cruzando de um domínio para outro, há necessidade de LS.

O comando:

```tcl
set_voltage 0.8V -obj VDD
set_voltage 1.0V -obj VDD_PD1
```

diz à síntese quais tensões concretas devem ser usadas.

A biblioteca precisa ter uma célula LS compatível, marcada com atributos como:

```text
is_level_shifter
level_shifter_type
input_voltage_range
output_voltage_range
```

### Ponto de prova

```text
A PST define combinações permitidas; set_voltage define valores específicos para síntese; a biblioteca precisa ter LS caracterizado para esses valores.
```

---

## Slide 4 — Level Shifter Inference

### Texto extraído

Título:

```text
Level Shifter Inference
```

Pontos:

```text
Level shifters (LS) automatically inferred during synthesis
```

```text
Inference based on UPF, PST, library cells, and supply availability
```

Nota:

```text
Certain specific nets may have additional constraints that prohibit LS inferencing
```

Exemplos:

```text
clock net
ideal net
dont_touch net
```

Figura:

```text
TOP
PD_SW
pd_switchable (0.9V)
leon3s (1.08V)
HL
LH
```

### Interpretação

A ferramenta pode inferir LS automaticamente, mas a inferência depende de condições.

Ela analisa:

```text
UPF
PST / power states
células disponíveis na biblioteca
supplies disponíveis nos possíveis locais de inserção
restrições de design
```

A nota do slide é importante: alguns nets não podem receber LS mesmo que pareça necessário.

Exemplos:

- **clock net:** geralmente tem tratamento especial e não deve receber células arbitrárias.
- **ideal net:** pode estar fora de otimização/inserção.
- **dont_touch net:** impede alteração/inserção.

### Consequência

Se um sinal cruza tensões diferentes, mas está marcado como `dont_touch`, a ferramenta pode não inserir LS automaticamente. Isso pode gerar warnings, violations ou necessidade de estratégia especial.

---

## Slide 5 — Level Shifter Command Syntax

### Texto extraído

Título:

```text
Level Shifter Command Syntax
```

Sintaxe geral:

```tcl
set_level_shifter <level_shifter_strategy_name>
    -domain <domain_name>
    [-elements list]
    [-exclude_elements list]
    [-source <source supply set refs>]
    [-sink <sink supply set ref>]
    [-applies_to <inputs | outputs | both>]
    [-threshold value]
    [-rule <low_to_high | high_to_low | both>]
    [-location <self | parent | automatic>]
    [-input_supply supply_set_ref]
    [-output_supply supply_set_ref]
    [-no_shift]
    [-force_shift]
    [-update]
    [-name_suffix]
    [-name_prefix]
    [-applies_to_boundary]
```

Pontos do slide:

```text
-location self allows insertion inside power domain
-location parent allows insertion outside power domain
-location automatic allows the tools to determine what is the best location for level shifter insertion
-elements has precedence over -applies_to
```

### Interpretação

`set_level_shifter` define uma estratégia de level shifting.

Os argumentos centrais são:

## `-domain`

Define para qual power domain a estratégia se aplica.

## `-applies_to`

Define se a estratégia vale para:

```text
inputs
outputs
both
```

## `-rule`

Define a direção de conversão:

```text
low_to_high
high_to_low
both
```

## `-location`

Define onde a célula pode ser inserida:

```text
self      → dentro do domínio
parent    → fora do domínio / no domínio pai
automatic → ferramenta decide
```

## `-elements`

Restringe a estratégia a elementos específicos. O slide destaca que:

```text
-elements tem precedência sobre -applies_to
```

Ou seja, se você especifica uma lista de elementos, ela limita diretamente o alvo da estratégia.

## `-input_supply` e `-output_supply`

Definem quais supply sets alimentam o lado de entrada e o lado de saída do level shifter.

---

## Slide 6 — Level Shifter Example

### Texto extraído

Título:

```text
Level Shifter Example
```

Código mostrado:

```tcl
set_level_shifter pdsw_LSin
    -domain PD_SW
    -applies_to inputs
    -rule high_to_low
    -location self

set_level_shifter pdsw_LSout
    -domain PD_SW
    -applies_to outputs
    -rule low_to_high
    -location parent
```

Figura:

```text
TOP
leon3s (1.08V)
PD_SW
pd_switchable (0.9V)
HL
LH
```

### Interpretação

O exemplo usa duas estratégias diferentes para o domínio `PD_SW`.

## Estratégia para inputs

```tcl
set_level_shifter pdsw_LSin
    -domain PD_SW
    -applies_to inputs
    -rule high_to_low
    -location self
```

Significado:

```text
Sinais entrando em PD_SW vêm de tensão maior para tensão menor.
Inserir LS dentro do próprio PD_SW.
```

Como `PD_SW` está em `0.9 V` e o top está em `1.08 V`, entradas vindas do top para o domínio exigem high-to-low.

## Estratégia para outputs

```tcl
set_level_shifter pdsw_LSout
    -domain PD_SW
    -applies_to outputs
    -rule low_to_high
    -location parent
```

Significado:

```text
Sinais saindo de PD_SW vão de tensão menor para tensão maior.
Inserir LS fora do PD_SW, no parent.
```

### Ponto importante

A localização escolhida para inputs e outputs pode ser diferente. Isso depende de supplies disponíveis, hierarquia, estratégia física e metodologia de implementação.

---

## Slide 7 — Level Shifter Insertion

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Pontos:

```text
set_level_shifter command is a soft constraint
```

```text
All power domains have the following default LS strategy, which allows insertion on any power domain boundary to resolve voltage violations:
```

Estratégia default:

```tcl
set_level_shifter <domain_name> \
    -location automatic -rule both
```

Outro ponto:

```text
Automatic insertion, based on default LS strategy, is a good solution, but if you want to refine that behavior:
```

Recomendação:

```text
Recommendation is to explicitly define LS strategies
```

Subitens:

```text
Reduces the solution space
Eliminates possible inconsistent LS inferencing across tools
```

### Interpretação

O comando `set_level_shifter` é uma **soft constraint**. Isso significa que ele orienta a inserção, mas a ferramenta ainda considera necessidade real, PST, bibliotecas e viabilidade.

Por padrão, todos os power domains têm uma estratégia genérica:

```tcl
set_level_shifter <domain_name> -location automatic -rule both
```

Ou seja:

```text
Se houver violação de tensão, a ferramenta pode inserir LS automaticamente em qualquer boundary apropriado, em qualquer direção necessária.
```

### Por que explicitar estratégias?

A inserção automática é útil, mas pode ser ampla demais.

Estratégias explícitas:

- reduzem o espaço de solução;
- tornam a implementação mais previsível;
- evitam diferenças entre ferramentas;
- facilitam debug;
- evitam LS em lugares inesperados.

### Regra prática

```text
Para bring-up inicial, automático pode ajudar.
Para fluxo robusto, defina explicitamente as estratégias.
```

---

## Slide 8 — Level Shifter Insertion — Decisões de localização

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Pergunta:

```text
What decisions are being made?
```

Figura:

```text
Block1 — core logic PD1
Top Power Domain
Block2 — core logic PD2
```

Pontos:

```text
PST defines voltage violation on paths from PD1 to PD2
```

```text
For a path going between PD1 and PD2, level shifters can be inserted on hierarchical boundaries of power domains
```

```text
Locations A, B, C, D are candidates for LS insertion:
A = PD1, self
B = PD1, parent
C = PD2, parent
D = PD2, self
```

```text
Based on the selection of LS cells in target library, and power supplies available at the different locations, LS cell will be inserted in one of these locations to remove voltage violation
```

### Interpretação

Este slide é crucial para entender a escolha de localização.

Considere um caminho:

```text
PD1 → PD2
```

Existem quatro pontos candidatos:

| Local | Interpretação |
|---|---|
| A | dentro de PD1, `self` de PD1 |
| B | fora de PD1, `parent` de PD1 |
| C | fora de PD2, `parent` de PD2 |
| D | dentro de PD2, `self` de PD2 |

A ferramenta escolhe com base em:

- estratégia UPF;
- células disponíveis na target library;
- supplies disponíveis em cada local;
- regras de domínio;
- fronteira hierárquica;
- PST/violação de tensão.

### Ponto importante

Sem estratégia explícita, a ferramenta pode escolher qualquer ponto legal. Isso pode ser correto, mas talvez não seja o que o designer queria.

---

## Slide 9 — Level Shifter Insertion — Example 1: Reducing the Solution Space

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Subtítulo:

```text
Example 1: Reducing the solution space
```

Pontos:

```text
LS can be inserted on hierarchical boundaries of power domains
Locations A, B, C, D are candidates for LS insertion
```

```text
User can limit LS insertion to the top level only
```

Exemplo:

```tcl
set_level_shifter -domain PD2 -location parent \
    -applies_to inputs PD2LS_rule

set_level_shifter -domain PD1 -location parent \
    -applies_to outputs PD1LS_rule
```

Resultado:

```text
Locations B and C are available for insertion, still based on PST, LS cell selections, and supply net availability
```

### Interpretação

O usuário quer limitar a inserção ao **top level**.

Isso elimina os locais internos `A` e `D`, deixando apenas:

```text
B e C
```

Ou seja:

```text
fora de PD1
fora de PD2
no domínio pai/top
```

### Por que fazer isso?

- manter blocos internos sem células de interface;
- simplificar implementação hierárquica;
- deixar LS em uma região controlada;
- evitar alteração interna de blocos/IPs;
- facilitar reuso de blocos.

### Ponto prático

Mesmo reduzindo para B e C, a ferramenta ainda decide com base em:

```text
PST
LS cell availability
supply availability
```

---

## Slide 10 — Level Shifter Insertion — Example 2: Reducing the Solution Space

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Subtítulo:

```text
Example 2: Reducing the solution space
```

Pontos:

```text
LS can be inserted on hierarchical boundaries of power domains
Locations A, B, C, D are candidates for LS insertion
```

```text
User can limit LS insertion to a specific power domain
```

Exemplo:

```tcl
set_level_shifter -domain PD2 -location self \
    -applies_to inputs PD2LS_rule

set_level_shifter -domain PD1 -no_shift \
    -applies_to outputs PD1noLS_rule
```

Observação:

```text
If user only specifies -location self for PD2, this just means location C is not allowed; however, A and B locations are still open for insertion, so need second strategy as well
```

### Interpretação

Neste exemplo, o usuário quer limitar a inserção ao domínio `PD2`, especificamente no ponto `D`:

```text
PD2 self
```

Mas há uma pegadinha importante.

Se o usuário escrever apenas:

```tcl
set_level_shifter -domain PD2 -location self -applies_to inputs
```

ele proíbe a localização `C`, mas ainda pode permitir `A` e `B` via estratégias de outro domínio/default.

Por isso, o slide mostra a necessidade de uma segunda estratégia:

```tcl
set_level_shifter -domain PD1 -no_shift -applies_to outputs
```

Ela diz que, para os outputs de `PD1`, não deve haver shift. Assim, fecha as alternativas `A` e `B`.

### Moral

```text
Para restringir realmente a localização de LS, talvez seja necessário definir estratégias complementares de allow e no_shift.
```

---

## Slide 11 — Level Shifter Insertion: Incomplete Strategy

### Texto extraído

Título:

```text
Level Shifter Insertion: Incomplete Strategy
```

Figura:

```text
Top Power Domain (1.08V)
Block1 — core logic PD1 (0.7V)
Unintended behavior
LH
```

Pontos:

```text
User wants to limit LS insertion to only one direction
```

Exemplo:

```text
only low-to-high
```

Estratégia definida:

```tcl
set_level_shifter -domain PD1 -applies_to outputs \
    -rule low_to_high -location parent L2HLS_rule
```

Problema:

```text
However, this does not preclude LS from also being inserted on inputs to PD1
```

Estratégia adicional necessária:

```tcl
set_level_shifter -domain PD1 -applies_to inputs \
    -rule high_to_low -no_shift no_H2LLS_rule
```

### Interpretação

Este slide mostra um erro comum: estratégia incompleta.

O usuário queria permitir apenas:

```text
low_to_high nos outputs de PD1
```

Então definiu:

```tcl
set_level_shifter -domain PD1 -applies_to outputs -rule low_to_high -location parent
```

Mas isso não proíbe automaticamente a inserção de high-to-low nos **inputs** de `PD1`.

Resultado: a ferramenta ainda pode inserir LS nos inputs, causando comportamento não pretendido.

Para impedir, é preciso uma estratégia explícita:

```tcl
set_level_shifter -domain PD1 -applies_to inputs \
    -rule high_to_low -no_shift
```

### Ponto-chave

```text
Definir o que você quer não necessariamente proíbe tudo que você não quer.
```

Em power strategies, muitas vezes é preciso definir tanto a permissão quanto a negação.

---

## Slide 12 — Level Shifter Insertion — User-defined only

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Pontos:

```text
User-defined only (Synopsys specific variable)
```

```text
LS can be inserted on hierarchical boundaries of power domains
Locations A, B, C, D are candidates for LS insertion
```

```text
User can limit LS insertion to only where explicitly specified
```

Exemplo:

```tcl
## This is a SNPS-specific variable ##
set upf_level_shift_on_constraint_only true

set_level_shifter -domain PD2 -location self \
    -applies_to inputs PD2LS_rule
```

Nota:

```text
This is a change from the "soft constraint" behavior defined in IEEE spec
```

Resultado:

```text
With this variable, only location D is available for insertion, still based on PST, LS cell selections, and supply net availability
```

App option:

```text
mv.upf.insert_ls_on_user_cstr_only
```

### Interpretação

Este slide mostra uma variável específica Synopsys para mudar o comportamento default.

Normalmente, `set_level_shifter` é uma soft constraint e a ferramenta pode ainda inserir LS em locais legais por estratégia default.

Com:

```tcl
set upf_level_shift_on_constraint_only true
```

a ferramenta limita a inserção apenas onde o usuário explicitamente definiu.

No exemplo:

```tcl
set_level_shifter -domain PD2 -location self -applies_to inputs
```

somente o local `D` fica disponível.

### No Fusion Compiler

O slide também indica a app option:

```text
mv.upf.insert_ls_on_user_cstr_only
```

que deve ser setada para `true` para habilitar esse comportamento no FC.

### Atenção

O slide destaca que isso muda o comportamento “soft constraint” da especificação IEEE. Portanto, é específico Synopsys e deve ser usado conscientemente.

---

## Slide 13 — Level Shifter Insertion — `-input_supply` e `-output_supply`

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Pontos:

```text
-input_supply and -output_supply options in set_level_shifter
```

Subitens:

```text
-input_supply specifies the supply set connected to input supply ports of the level-shifter
-output_supply specifies the supply set connected to the output supply ports of the level-shifter
```

Exemplo de input UPF:

```tcl
create_supply_set SS_LS_IN \
    -function {power VDD_IN}

create_supply_set SS_LS_OUT \
    -function {power VDD_OUT}

set_level_shifter LS_RAM \
    -input_supply {SS_LS_IN} \
    -output_supply {SS_LS_OUT}
```

Exemplo de output UPF:

```tcl
connect_supply_set VDD_IN  -ports LS/VDD_input
connect_supply_set VDD_OUT -ports LS/VDD_output
```

### Interpretação

Level shifter normalmente possui dois lados de alimentação:

```text
lado de entrada
lado de saída
```

Por isso, as opções:

```tcl
-input_supply
-output_supply
```

definem quais supply sets conectam aos respectivos supply ports da célula LS.

### Exemplo mental

Para converter de `VDD_IN` para `VDD_OUT`:

```text
entrada do LS é alimentada por VDD_IN
saída do LS é alimentada por VDD_OUT
```

A ferramenta pode então conectar a célula de forma correta:

```tcl
connect_supply_set VDD_IN  -ports LS/VDD_input
connect_supply_set VDD_OUT -ports LS/VDD_output
```

### Ponto importante

Essa especificação evita ambiguidade em designs multi-voltage, especialmente quando há múltiplas supplies disponíveis no mesmo escopo.

---

## Slide 14 — Level Shifter Insertion — Defaults de input/output supply

### Texto extraído

Título:

```text
Level Shifter Insertion
```

Pontos:

```text
-input_supply and -output_supply options in set_level_shifter
```

Primeiro caso:

```text
If -input_supply is not specified, the default is the supply of the logic driving the level-shifter input
```

Segundo caso:

```text
If -output_supply is not specified, the default is the supply of the logic receiving the level-shifter output
```

### Interpretação

Se o usuário não define explicitamente as supplies do LS, a ferramenta usa defaults.

## Default de `-input_supply`

Se não especificado:

```text
input_supply = supply da lógica que dirige a entrada do LS
```

## Default de `-output_supply`

Se não especificado:

```text
output_supply = supply da lógica que recebe a saída do LS
```

### Por que isso importa?

Em casos simples, esses defaults são suficientes.

Mas em designs complexos, com:

- always-on supplies;
- retention supplies;
- multiple supply sets;
- isolation supplies;
- level shifters enable;
- domínios switchable;

pode ser melhor especificar explicitamente para evitar mapeamento incorreto.

---

# Parte 2 — Isolation Strategy

## Slide 15 — Planning Your Isolation Strategy

### Texto extraído

Título:

```text
Planning Your Isolation Strategy
```

Perguntas:

```text
Do you want to isolate power domain inputs, outputs, or both?
```

```text
Do you want the isolated signals to be clamped to '0', '1', or latch last known value?
```

```text
In what domain(s) do you want the isolation cells to exist?
```

```text
Will your isolation control signal be active high or active low?
And from where will this signal be driven?
```

```text
What supplies will you use for powering your isolation logic?
```

```text
Do you want to use NOR style isolation cells?
```

### Interpretação

A estratégia de isolamento tem mais decisões que a de LS, porque envolve controle funcional e comportamento durante shutdown.

Você precisa definir:

## 1. Inputs, outputs ou ambos?

- Outputs de domínios desligáveis normalmente precisam isolamento.
- Inputs para domínios desligáveis podem precisar isolamento em casos específicos.

## 2. Clamp value

O sinal isolado pode ser forçado para:

```text
0
1
latch last known value
```

## 3. Localização

A ISO cell pode ficar:

- dentro do domínio desligável;
- fora do domínio desligável;
- no fanout;
- no parent.

## 4. Sinal de controle

É preciso saber:

```text
qual net controla isolamento
se é ativo alto ou ativo baixo
de onde esse sinal vem
```

## 5. Supply da ISO

A ISO precisa ser alimentada por uma supply que continue ligada quando ela for necessária.

## 6. NOR-style isolation

Algumas bibliotecas têm células especiais NOR-style que podem ser usadas em condições específicas.

---

## Slide 16 — What Needs Isolating?

### Texto extraído

Título:

```text
What Needs Isolating?
```

Bloco 1:

```text
Outputs from shutdown domains should be isolated
```

Subitens:

```text
Prevents spurious signals propagating to powered on domains
Clamping to known value prevents floating nets from driving powered logic to unstable state
```

Bloco 2:

```text
Inputs to shutdown domains could be isolated
```

Subitens:

```text
Does keep powered up logic from powering "sneak leakage" paths in shutdown logic, especially if employing pass-transistors, XOR gate
Some memories do require static inputs during shutdown/standby
```

### Interpretação

O slide diferencia “should” e “could”.

## Outputs de domínios desligáveis

```text
should be isolated
```

Motivo: quando o domínio está OFF, suas saídas podem ficar `X`, flutuar ou gerar valores espúrios. Isso pode contaminar domínios que continuam ligados.

Isolation força valor conhecido e evita instabilidade.

## Inputs para domínios desligáveis

```text
could be isolated
```

Nem sempre é obrigatório, mas pode ser necessário para evitar sneak leakage.

### Sneak leakage

Mesmo com um domínio desligado, sinais vindos de lógica ligada podem criar caminhos de fuga através de estruturas internas, especialmente em:

- pass-transistors;
- XOR gates;
- certas memórias;
- entradas que precisam ficar estáticas em standby.

### Regra prática

```text
Outputs from OFF domains: normalmente isolar.
Inputs to OFF domains: avaliar arquitetura, memória e risco de leakage.
```

---

## Slide 17 — What if Top Level is Shutdown?

### Texto extraído

Título:

```text
What if Top Level is Shutdown?
```

Pontos:

```text
Isolation on inputs to more always-on sub-blocks is recommended
```

```text
Isolation cells typically located inside sub-blocks instead of at top-level
```

Subitem:

```text
This allows to use primary of sub-blocks as isolation power
```

Outro ponto:

```text
Top-level always-on nets may require special handling
```

Subitens:

```text
Especially if you have multiple flavors of "always-on"
STRONGLY RECOMMEND dual-rail AO logic for this strategy
```

### Interpretação

Este slide trata um caso mais avançado: o top-level pode desligar, mas alguns sub-blocos permanecem always-on.

Nesse caso, recomenda-se isolar inputs que entram nos sub-blocos always-on.

### Por que colocar ISO dentro dos sub-blocos?

Se o top pode desligar, uma isolation cell no top talvez também perca alimentação.

Ao colocar a ISO dentro do sub-bloco always-on, a célula pode usar a alimentação primária do próprio sub-bloco, que continua ativa.

### Múltiplos flavors de always-on

Se há mais de uma supply always-on, os nets AO no top podem exigir cuidado especial.

O slide recomenda fortemente:

```text
dual-rail AO logic
```

porque ela pode lidar melhor com múltiplas supplies e domínios que desligam.

---

## Slide 18 — Clamp to What Value?

### Texto extraído

Título:

```text
Clamp to What Value?
```

Bloco 1:

```text
For outputs from shutdown domain, clamp to "inactive" state or "known good" state
```

Notas:

```text
Inactive: clamp to "0" for active-high reset
Known good: latch last known value prior to shutdown
Powered up logic generally requires some signal(s) indicating state of shutdown logic
```

Bloco 2:

```text
For inputs to shutdown domain, clamp to unswitched power net value for the shutdown domain
```

Exemplo:

```text
e.g., clamp to "1" if using footer switches
```

Bloco 3:

```text
Be careful not to clamp to value opposite of any tie high/low
(short circuits waste a lot of power!)
```

Nota:

```text
May require separate strategies on same boundary, some clamping to "0" and some clamping to "1"
```

### Interpretação

A escolha do clamp value não é arbitrária.

## Outputs de domínio desligável

Devem ser presos a um estado seguro:

```text
inactive
known good
```

Exemplo:

- se o sinal é reset ativo alto, o estado inativo pode ser `0`;
- se o receptor precisa continuar vendo último valor válido, pode ser necessário latch.

## Inputs para domínio desligável

Podem ser presos ao valor da supply não desligada do domínio. Exemplo do slide:

```text
footer switches → clamp to 1
```

## Atenção com tie high/low

Se você prende um sinal no valor oposto a uma amarração interna, pode criar curto ou consumo desnecessário.

Exemplo:

```text
um lado força 1
outro lado força 0
```

Isso pode desperdiçar muita potência.

### Regra prática

```text
Escolha clamp value com base na função do sinal e na estrutura elétrica do domínio.
```

---

## Slide 19 — Where Should Isolation Cells Exist?

### Texto extraído

Título:

```text
Where Should Isolation Cells Exist?
```

Dentro do shutdown domain:

```text
Inside shutdown domain keeps isolation implementation "self-contained"
```

Subitens:

```text
Requires always-on supply inside domain
May require always-on buffering of control signals for ISO logic
Strongly recommend using dual-rail ISO cells
```

Fora do shutdown domain:

```text
Outside shutdown domain keeps shutdown block functionally unchanged
```

Subitens:

```text
Single-rail ISO cells (or even standard cell logic) can be used for isolating
Difficult to manage in a hierarchical implementation flow
```

### Interpretação

A ISO cell pode ficar dentro ou fora do domínio desligável.

## Dentro do shutdown domain

Vantagem:

```text
implementação self-contained
```

O bloco leva consigo sua própria estratégia de isolamento, bom para IP e hierarquia.

Desvantagens:

- precisa de always-on supply dentro do domínio;
- sinais de controle precisam chegar enquanto o domínio está OFF;
- pode exigir buffers always-on;
- recomenda-se dual-rail ISO.

## Fora do shutdown domain

Vantagem:

```text
bloco desligável fica funcionalmente inalterado
```

A ISO é colocada no domínio que permanece ligado.

Desvantagens:

- gerenciamento hierárquico mais difícil;
- pode espalhar estratégias no parent/top;
- menos self-contained.

### Regra prática

```text
Dentro do domínio: melhor para encapsulamento, mas exige AO/dual-rail.
Fora do domínio: preserva bloco, mas pode complicar integração hierárquica.
```

---

## Slide 20 — Isolation Commands

### Texto extraído

Título:

```text
Isolation Commands
```

Fluxo:

```text
set_isolation
      ↓
use_interface_cell
map_isolation_cell
```

Pontos:

```text
The set_isolation command needs to be used before the use_interface_cell or map_isolation_cell command for each isolation strategy
```

Subitem:

```text
Isolation sense and clamp value defined by the isolation commands must correspond to an isolation cell that exists in your technology library
```

Outro ponto:

```text
Supply associated to the isolation power supply must be at least as always-on as the supply of the sink
```

Nota:

```text
Unless you plan to use NOR-style isolation lib-cells, in which case you don't need to define any isolation power supply on -isolation_supply_set
```

### Interpretação

A sequência correta é:

```text
1. definir a estratégia lógica de isolation com set_isolation
2. mapear/usar célula física com map_isolation_cell ou use_interface_cell
```

A estratégia deve corresponder a uma célula real na biblioteca.

Se você define:

```text
isolation_sense high
clamp_value 1
```

a biblioteca precisa ter uma célula compatível com controle ativo alto e clamp para `1`.

### Supply da ISO

A supply que alimenta a isolation cell deve ser pelo menos tão always-on quanto a supply do sink.

Ou seja: se o sink continua ligado, a ISO também precisa continuar funcional para protegê-lo.

### NOR-style exception

Para células NOR-style, pode haver uma exceção: não é necessário definir `-isolation_supply_set`, dependendo do tipo de célula e da estratégia.

---

## Slide 21 — Isolation Command Syntax

### Texto extraído

Título:

```text
Isolation Command Syntax
```

Sintaxe geral:

```tcl
set_isolation <isolation_strategy_name>
    -domain power_domain
    [-isolation_power_net <isolation_power_net>]
    [-isolation_ground_net <isolation_ground_net>]
    [-isolation_supply_set <supply_set_ref>]
    [-clamp_value 0 | 1 | latch]
    [-applies_to inputs | outputs | both]
    [-diff_supply_only true | false]
    [-isolation_signal <isolation_signal>]
    [-isolation_sense low | high]
    [-update]
    [-location self | parent | fanout]
    [-no_isolation]
    [-elements objects]
    [-source <supply_set_ref>]
    [-name_prefix]
    [-applies_to_boundary]
    [-force_isolation]
    [-exclude_elements]
    [-sink <supply_set_ref>]
    [-name_suffix]
```

### Interpretação

`set_isolation` define a estratégia de isolamento.

Argumentos centrais:

## `-domain`

Domínio ao qual a estratégia se aplica.

## `-clamp_value`

Valor forçado quando isolation ativa:

```text
0
1
latch
```

## `-applies_to`

Define se isola:

```text
inputs
outputs
both
```

## `-isolation_signal`

Sinal de controle da ISO.

## `-isolation_sense`

Polaridade do controle:

```text
low
high
```

## `-location`

Local de inserção:

```text
self
parent
fanout
```

## `-isolation_supply_set`

Supply que alimenta a lógica de isolamento.

## `-no_isolation`

Usado para explicitamente impedir isolamento em uma estratégia/elemento.

---

## Slide 22 — Isolation Command Syntax — Scope e localização

### Texto extraído

Título:

```text
Isolation Command Syntax
```

Sintaxe reduzida:

```tcl
set_isolation <isolation_strategy>
    -domain power_domain
    -isolation_signal <isolation_signal>
    [-isolation_sense low | high]
    [-location self | parent]
```

Ponto:

```text
Logical hierarchy for isolation cells specified with -location must consider availability of supplies and control signals
```

Exemplo:

```tcl
set_isolation ISO_U2
    -domain PD_U2
    -location self | parent
```

Figura:

```text
U2 1.08V / OFF
TOP 1.08V
Location self
Location parent
```

### Interpretação

Este slide reforça que `-location` não é apenas uma decisão geométrica. É uma decisão de hierarquia lógica e disponibilidade.

Se você escolhe:

```text
-location self
```

a isolation cell fica dentro do domínio/bloco. Portanto, precisam estar visíveis/disponíveis ali:

- supply de isolamento;
- sinal de controle;
- células compatíveis;
- caminhos always-on se necessário.

Se escolhe:

```text
-location parent
```

a ISO fica fora do domínio, no parent. Então o controle e supply precisam existir no parent.

### Ponto-chave

```text
A estratégia de isolamento deve ser definida em um scope onde o sinal de controle e a supply de isolamento sejam visíveis.
```

---

## Slide 23 — Isolation Cell Insertion

### Texto extraído

Título:

```text
Isolation Cell Insertion
```

Pontos:

```text
Isolation cells (ISO) inferred during synthesis
```

```text
Inference based on UPF, library cells, and supply availability
```

Subitem:

```text
If no technology cells are available, inferred ISO will remain unmapped GTECH ISO
```

Outro ponto:

```text
Certain specific nets may have additional constraints that prohibit ISO inferencing
```

Exemplos:

```text
clock net
ideal net
etc.
```

Figura:

```text
TOP.primary
PD_SW.ss_unswitched
PD_SW.primary
TOP.default_isolation
PD_SW
pd_switchable (0.9V / OFF)
sleep
pdsw_sx
pd_iso
ELS
```

### Interpretação

Isolation cells podem ser inferidas durante synthesis.

A inferência depende de:

- estratégias UPF;
- células de biblioteca;
- supplies disponíveis;
- restrições em nets.

Se a ferramenta identifica necessidade de ISO, mas não encontra célula física compatível, pode deixar uma ISO genérica unmapped:

```text
GTECH ISO
```

Isso é um sinal de que o UPF pode estar correto conceitualmente, mas a biblioteca/mapeamento não está completo.

### Nets que podem impedir ISO

Assim como no level shifter:

- clock nets;
- ideal nets;
- nets com restrições especiais;

podem impedir inserção automática.

---

## Slide 24 — Isolation Strategy Example

### Texto extraído

Título:

```text
Isolation Strategy Example
```

Código mostrado:

```tcl
set_isolation pdsw_iso
    -domain PD_SW
    -clamp_value 1
    -applies_to outputs
    -isolation_signal pd_iso
    -isolation_sense high
    -location parent
```

Figura:

```text
TOP.primary
PD_SW.ss_unswitched
PD_SW.primary
PD_SW
pd_switchable (0.9V / OFF)
sleep
pdsw_sx
pd_iso
TOP.default_isolation
ELS
```

Nota:

```text
ELS cells inferred where isolation strategy is defined in UPF and level shifting is needed
```

### Interpretação

A estratégia:

```tcl
set_isolation pdsw_iso
```

define isolamento para outputs do domínio `PD_SW`.

Campos:

```tcl
-domain PD_SW
```

Aplica ao power domain `PD_SW`.

```tcl
-clamp_value 1
```

Quando isolation estiver ativa, força a saída para `1`.

```tcl
-applies_to outputs
```

Isola sinais que saem do domínio.

```tcl
-isolation_signal pd_iso
```

Sinal de controle da isolation.

```tcl
-isolation_sense high
```

Isolation ativa quando `pd_iso = 1`.

```tcl
-location parent
```

Células de isolamento são inseridas no parent/top, fora do domínio desligável.

### Nota sobre ELS

O slide mostra que células ELS podem ser inferidas quando:

```text
há estratégia de isolation definida
e também há necessidade de level shifting
```

ELS normalmente significa uma célula que combina enable/isolation com level shifting, dependendo da biblioteca.

---

## Slide 25 — Scope and Defining Isolation

### Texto extraído

Título:

```text
Scope and Defining Isolation
```

Pontos:

```text
Isolation can be defined at the scope of the power domain or above
```

```text
When defining the isolation strategy, both the isolation control signal and the isolation power must be visible at that scope
```

Subitens:

```text
You can define an isolation strategy whose control signal is just a top-level port if the strategy is defined at the top-level
```

```text
Same strategy cannot be defined at the block-level since the control signal does not exist there
```

### Interpretação

Este slide fecha a parte A com um princípio essencial: **scope importa para isolation**.

Você pode definir uma estratégia de isolation:

```text
no scope do próprio power domain
ou em um scope acima
```

Mas, no scope escolhido, precisam estar visíveis:

```text
o sinal de controle de isolation
a supply de isolation
```

## Exemplo

Se o sinal `iso_enable` é uma porta do top:

```text
TOP/iso_enable
```

Você pode definir a estratégia no top.

Mas se tentar definir a mesma estratégia dentro de um bloco onde `iso_enable` não existe, a definição pode falhar ou exigir que o sinal seja “puxado” para o escopo do bloco.

### Regra prática

```text
Defina isolation no scope onde você consegue enxergar tanto o controle quanto a alimentação da ISO.
```

Este é o ponto de transição para a parte B, que começa mostrando exemplos de definição de isolation com `location parent` e `applies_to_boundary`.

---

# Aula didática desenvolvida

## 1. Level shifter não aparece apenas porque há domínios diferentes

A ferramenta precisa detectar uma violação de tensão real em algum estado válido.

A cadeia de dependência é:

```text
PST/power states dizem quais tensões são possíveis
set_voltage define valores específicos para síntese
library oferece células LS caracterizadas
UPF define estratégia
supply availability permite colocar a célula em algum lugar
```

Se qualquer elo falhar, a inferência pode não acontecer ou a célula pode ficar unmapped.

---

## 2. A localização do LS é uma decisão de arquitetura

Para um caminho entre `PD1` e `PD2`, a ferramenta pode inserir LS em vários pontos:

```text
A = PD1 self
B = PD1 parent
C = PD2 parent
D = PD2 self
```

Não existe uma única localização sempre correta.

A escolha depende de:

- onde há supply compatível;
- onde a biblioteca permite célula legal;
- se o bloco deve ser autocontido;
- se a implementação é flat ou hierárquica;
- se o usuário quer manter IP intacto;
- se a ferramenta está em modo automático ou user-defined only.

---

## 3. Estratégia incompleta é perigosa

Um erro recorrente é especificar apenas o que se quer permitir, mas esquecer de impedir o resto.

Exemplo:

```tcl
set_level_shifter -domain PD1 -applies_to outputs \
    -rule low_to_high -location parent
```

Isso permite low-to-high nos outputs, mas não impede high-to-low nos inputs.

Para bloquear inputs, é preciso algo como:

```tcl
set_level_shifter -domain PD1 -applies_to inputs \
    -rule high_to_low -no_shift
```

A aula mostra que estratégias de power intent precisam ser completas.

---

## 4. Soft constraint versus user-defined only

Pelo comportamento padrão, `set_level_shifter` é uma soft constraint. A ferramenta ainda pode usar estratégias default para resolver violações.

Com variável/app option Synopsys:

```tcl
set upf_level_shift_on_constraint_only true
```

ou no FC:

```text
mv.upf.insert_ls_on_user_cstr_only
```

a ferramenta insere LS apenas onde o usuário explicitamente definiu.

Isso dá mais controle, mas também exige UPF mais completo.

---

## 5. Isolation é principalmente proteção contra domínio desligado

Quando um domínio está OFF, suas saídas podem ficar indeterminadas. Se elas alcançam domínio ligado, podem causar:

- propagação de `X`;
- instabilidade;
- crowbar current;
- leakage;
- comportamento inválido.

Por isso:

```text
outputs from shutdown domains should be isolated
```

Inputs para domínios desligáveis são opcionais, mas podem ser necessários para evitar sneak leakage ou satisfazer requisitos de memória.

---

## 6. Clamp value precisa respeitar função e eletricidade

Não basta escolher `0` ou `1` arbitrariamente.

A escolha depende de:

- estado inativo do sinal;
- estado seguro para o receptor;
- reset ativo alto/baixo;
- ties internos;
- tipo de power switch;
- necessidade de manter último valor válido.

Se escolher valor oposto a um tie, pode criar curto e desperdício de potência.

---

## 7. Isolation dentro ou fora do domínio tem tradeoff

## Dentro do domínio desligável

Vantagens:

```text
self-contained
bom para IP
bom para implementação hierárquica
```

Desvantagens:

```text
precisa AO supply
precisa controle AO
recomenda dual-rail ISO
```

## Fora do domínio desligável

Vantagens:

```text
shutdown block fica funcionalmente inalterado
pode usar single-rail ISO ou lógica padrão
```

Desvantagens:

```text
mais difícil em fluxo hierárquico
estratégia fica no parent/top
```

---

## 8. Scope é decisivo em isolation

A estratégia de isolation precisa ser definida em um scope onde são visíveis:

```text
isolation signal
isolation supply
power domain
```

Se o controle existe só no top, uma estratégia definida no bloco não o enxerga, a menos que a conectividade seja levada para dentro.

Essa é uma das causas clássicas de erro em UPF hierárquico.

---

# Conceitos difíceis explicados em profundidade

## Level shifter

Célula que converte o nível de tensão de um sinal ao cruzar entre domínios com tensões diferentes.

---

## `set_level_shifter`

Comando UPF que define uma estratégia de level shifting: domínio, direção, localização, inputs/outputs, supplies e restrições.

---

## Soft constraint

Restrição que orienta a ferramenta, mas não impede totalmente outras soluções legais. `set_level_shifter` é apresentado como soft constraint no slide.

---

## `-rule`

Opção que define a direção do LS:

```text
low_to_high
high_to_low
both
```

---

## `-location self`

Permite inserção dentro do próprio power domain.

---

## `-location parent`

Permite inserção fora do power domain, no parent.

---

## `-location automatic`

Permite que a ferramenta escolha a melhor localização.

---

## `-no_shift`

Estratégia que explicitamente impede level shifting para determinado conjunto/direção.

---

## `-force_shift`

Estratégia que força inserção de level shifter, mesmo em condições em que a ferramenta talvez não inferisse automaticamente.

---

## `-input_supply` e `-output_supply`

Definem as supplies conectadas aos supply ports de entrada e saída do level shifter.

---

## Isolation cell

Célula que força valor conhecido em sinais associados a domínios desligáveis.

---

## `set_isolation`

Comando UPF que define estratégia de isolation: domínio, clamp value, controle, polaridade, localização e supplies.

---

## Clamp value

Valor forçado pela isolation cell durante shutdown ou isolamento:

```text
0
1
latch
```

---

## Isolation sense

Polaridade do sinal de isolamento:

```text
high → isolation ativa com controle em 1
low  → isolation ativa com controle em 0
```

---

## Sneak leakage

Caminhos indesejados de corrente através de lógica desligada, causados por sinais vindos de lógica ainda ligada.

---

## Dual-rail ISO

Célula de isolamento com mais de uma alimentação, útil quando a célula precisa operar entre domínio desligável e domínio always-on.

---

## ELS

Célula combinada/associada a enable level shifter, inferida quando uma estratégia de isolation existe e também há necessidade de level shifting.

---

# Comandos importantes da parte A

## Level shifter

```tcl
set_level_shifter <level_shifter_strategy_name>
    -domain <domain_name>
    -applies_to inputs|outputs|both
    -rule low_to_high|high_to_low|both
    -location self|parent|automatic
```

Exemplo:

```tcl
set_level_shifter pdsw_LSin
    -domain PD_SW
    -applies_to inputs
    -rule high_to_low
    -location self
```

```tcl
set_level_shifter pdsw_LSout
    -domain PD_SW
    -applies_to outputs
    -rule low_to_high
    -location parent
```

Bloqueio de direção/local:

```tcl
set_level_shifter -domain PD1 -applies_to inputs \
    -rule high_to_low -no_shift no_H2LLS_rule
```

User-defined only:

```tcl
set upf_level_shift_on_constraint_only true
```

Fusion Compiler app option:

```text
mv.upf.insert_ls_on_user_cstr_only
```

Supplies de LS:

```tcl
set_level_shifter LS_RAM \
    -input_supply {SS_LS_IN} \
    -output_supply {SS_LS_OUT}
```

## Voltage

```tcl
set_voltage 0.8V -obj VDD
set_voltage 1.0V -obj VDD_PD1
```

## Isolation

```tcl
set_isolation <isolation_strategy_name>
    -domain power_domain
    -clamp_value 0|1|latch
    -applies_to inputs|outputs|both
    -isolation_signal <signal>
    -isolation_sense low|high
    -location self|parent|fanout
```

Exemplo:

```tcl
set_isolation pdsw_iso
    -domain PD_SW
    -clamp_value 1
    -applies_to outputs
    -isolation_signal pd_iso
    -isolation_sense high
    -location parent
```

Mapeamento/uso de célula:

```tcl
use_interface_cell
map_isolation_cell
```

---

# Tabelas de revisão

## Level shifter — decisões principais

| Decisão | Opções |
|---|---|
| Aplicar em quê? | inputs, outputs, both |
| Direção | high_to_low, low_to_high, both |
| Localização | self, parent, automatic |
| Restringir elementos | `-elements`, `-exclude_elements` |
| Bloquear LS | `-no_shift` |
| Forçar LS | `-force_shift` |
| Supply de entrada | `-input_supply` |
| Supply de saída | `-output_supply` |
| Só inserir onde usuário definiu | `upf_level_shift_on_constraint_only` / `mv.upf.insert_ls_on_user_cstr_only` |

---

## Isolation — decisões principais

| Decisão | Opções |
|---|---|
| Isolar o quê? | inputs, outputs, both |
| Clamp | 0, 1, latch |
| Localização | self, parent, fanout |
| Sinal de controle | `-isolation_signal` |
| Polaridade | `-isolation_sense low/high` |
| Supply | `-isolation_supply_set` ou nets |
| Bloquear ISO | `-no_isolation` |
| Forçar ISO | `-force_isolation` |
| Célula física | `map_isolation_cell`, `use_interface_cell` |

---

## LS versus ISO

| Célula | Problema resolvido | Quando aparece |
|---|---|---|
| Level Shifter | Diferença de tensão entre domínios | Quando PST/set_voltage indicam voltage violation |
| Isolation Cell | Saída/entrada associada a domínio desligável | Quando domínio OFF pode afetar domínio ON |
| ELS | Combinação de isolamento e level shifting | Quando isolation e LS são necessários no mesmo ponto |

---

# Figuras e diagramas importantes

## Página 1 — Planning Your Level Shifting Strategy

Mostra as três perguntas centrais de LS: inputs/outputs/both, high-to-low/low-to-high/both e domínio onde a célula deve existir.

## Página 2 — PST, `set_voltage` e biblioteca LS

Mostra que a PST define combinações de supply, `set_voltage` define tensões específicas e a biblioteca precisa ter ranges compatíveis.

## Página 2 — Level Shifter Inference

Mostra um domínio `PD_SW` em `0.9V` dentro de TOP `1.08V`, com LS high-to-low e low-to-high nas fronteiras.

## Página 3 — Level Shifter Command Syntax

Mostra a sintaxe completa de `set_level_shifter` e destaca `self`, `parent`, `automatic`.

## Página 4 — LS insertion locations A/B/C/D

Mostra o caminho entre `PD1` e `PD2` e os quatro candidatos: `PD1 self`, `PD1 parent`, `PD2 parent`, `PD2 self`.

## Página 5 — Reducing solution space

Mostra como restringir LS ao top-level ou a um domínio específico, usando estratégias complementares.

## Página 6 — Incomplete Strategy

Mostra comportamento indesejado quando o usuário define apenas low-to-high nos outputs, mas não bloqueia high-to-low nos inputs.

## Página 6 — User-defined only

Mostra a variável Synopsys que faz a ferramenta inserir LS apenas onde explicitamente definido.

## Página 7 — `input_supply` e `output_supply`

Mostra como supply sets são conectados aos supply ports do LS.

## Página 8 — Planning Your Isolation Strategy

Mostra as principais perguntas para ISO: inputs/outputs, clamp, localização, controle, supplies e NOR-style.

## Página 8 — What Needs Isolating?

Mostra que outputs de shutdown domains devem ser isolados, enquanto inputs podem ser isolados em casos específicos.

## Página 9 — Top Level Shutdown

Mostra o caso em que top-level desliga e sub-blocos always-on precisam isolamento em seus inputs.

## Página 9 — Clamp to What Value?

Mostra recomendações para clamp em outputs e inputs, e alerta contra clamp oposto a ties.

## Página 9 — Where Should Isolation Cells Exist?

Compara ISO dentro e fora do shutdown domain.

## Página 10 — Isolation Commands

Mostra a sequência `set_isolation` antes de `use_interface_cell` ou `map_isolation_cell`.

## Página 11 — Isolation Command Syntax e Cell Insertion

Mostra a sintaxe reduzida, a importância de supplies/controle visíveis e a inferência de ISO durante síntese.

## Página 12 — Isolation Strategy Example

Mostra `pdsw_iso` com clamp 1, outputs, controle `pd_iso`, sense high e location parent.

## Página 12 — Scope and Defining Isolation

Mostra que isolation pode ser definida no scope do domínio ou acima, desde que controle e supply estejam visíveis.

---

# Pontos de prova e revisão

1. Planejar level shifting exige decidir inputs, outputs ou both.
2. Planejar level shifting exige decidir high-to-low, low-to-high ou both.
3. Planejar level shifting exige decidir em qual domínio a célula LS deve existir.
4. A PST precisa definir violação de tensão para LS ser inferido.
5. `set_voltage` define tensões específicas para síntese.
6. `set_voltage` deve corresponder a tensões válidas definidas na PST.
7. A biblioteca precisa ter level shifters caracterizados para os ranges usados.
8. A Liberty deve conter atributos de input/output voltage ranges.
9. LS é inferido com base em UPF, PST, library cells e supply availability.
10. Clock nets, ideal nets e dont_touch nets podem impedir inferência de LS.
11. `set_level_shifter` é soft constraint.
12. A estratégia default permite `-location automatic -rule both`.
13. É recomendado definir LS strategies explicitamente.
14. Estratégias explícitas reduzem solution space.
15. Estratégias explícitas evitam inferência inconsistente entre ferramentas.
16. `-location self` insere dentro do power domain.
17. `-location parent` insere fora do power domain.
18. `-location automatic` deixa a ferramenta escolher.
19. `-elements` tem precedência sobre `-applies_to`.
20. Em caminho PD1→PD2, A/B/C/D são candidatos a LS.
21. A = PD1 self.
22. B = PD1 parent.
23. C = PD2 parent.
24. D = PD2 self.
25. Para limitar LS ao top-level, apenas B e C ficam disponíveis.
26. Para limitar LS a um domínio específico, pode ser necessário combinar allow com `-no_shift`.
27. Estratégia incompleta pode gerar LS em direção/local não pretendido.
28. Definir low-to-high nos outputs não impede high-to-low nos inputs.
29. `upf_level_shift_on_constraint_only` é variável específica Synopsys.
30. `mv.upf.insert_ls_on_user_cstr_only` habilita esse comportamento no Fusion Compiler.
31. `-input_supply` define supply set conectado aos supply ports de entrada do LS.
32. `-output_supply` define supply set conectado aos supply ports de saída do LS.
33. Se `-input_supply` não é especificado, usa-se a supply da lógica que dirige o input do LS.
34. Se `-output_supply` não é especificado, usa-se a supply da lógica que recebe o output do LS.
35. Planejar isolation exige decidir inputs, outputs ou both.
36. Planejar isolation exige escolher clamp 0, 1 ou latch.
37. Planejar isolation exige escolher localização da ISO.
38. Planejar isolation exige definir sinal de controle e polaridade.
39. Planejar isolation exige definir supplies para a ISO.
40. Outputs de shutdown domains devem ser isolados.
41. Isolation evita propagação de sinais espúrios para domínios ligados.
42. Clamp para valor conhecido evita nets flutuantes.
43. Inputs para shutdown domains podem ser isolados.
44. Isolar inputs pode evitar sneak leakage.
45. Algumas memórias exigem inputs estáticos durante shutdown/standby.
46. Se o top-level desliga, isolation em inputs de sub-blocos always-on é recomendada.
47. ISO cells nesse caso costumam ficar dentro dos sub-blocos.
48. Top-level always-on nets podem exigir tratamento especial.
49. Dual-rail AO logic é fortemente recomendado para múltiplos flavors de always-on.
50. Outputs de shutdown domain devem ser clampados para estado inactive ou known good.
51. Inputs para shutdown domain podem ser clampados para valor da unswitched power net.
52. Clamp oposto a tie high/low pode causar curto e desperdiçar potência.
53. ISO dentro do shutdown domain mantém implementação self-contained.
54. ISO dentro do shutdown domain exige always-on supply.
55. ISO dentro pode exigir always-on buffering dos controles.
56. ISO dentro recomenda dual-rail ISO cells.
57. ISO fora mantém o shutdown block funcionalmente inalterado.
58. ISO fora pode usar single-rail ISO ou lógica padrão.
59. ISO fora é difícil em implementação hierárquica.
60. `set_isolation` deve ser usado antes de `use_interface_cell` ou `map_isolation_cell`.
61. Isolation sense e clamp value precisam corresponder a uma célula existente na tecnologia.
62. Supply da ISO deve ser pelo menos tão always-on quanto a supply do sink.
63. `set_isolation` define domínio, clamp, aplica-se a inputs/outputs, controle, sense e localização.
64. `-location self` e `-location parent` para isolation precisam considerar supplies e control signals.
65. ISO é inferida durante synthesis com base em UPF, library cells e supply availability.
66. Se não houver célula de tecnologia, ISO pode ficar unmapped GTECH ISO.
67. Nets como clock e ideal net podem proibir inferência de ISO.
68. Scope da isolation precisa enxergar o sinal de controle.
69. Scope da isolation precisa enxergar a power supply da ISO.
70. Isolation pode ser definida no scope do power domain ou acima.

---

# Relação com Fusion Compiler

No Fusion Compiler, essas estratégias são usadas para orientar a implementação automática de células especiais durante synthesis/implementation.

A ferramenta usa as estratégias para:

```text
1. detectar voltage violations;
2. inferir level shifters;
3. decidir localização de LS;
4. mapear LS para células de biblioteca;
5. inferir isolation cells;
6. decidir clamp value e controle;
7. garantir supplies corretas para ISO;
8. combinar LS e ISO quando necessário, inferindo ELS;
9. respeitar restrições de nets como clocks, ideal nets e dont_touch;
10. evitar soluções inconsistentes quando o usuário restringe explicitamente o espaço de solução.
```

Essa parte é especialmente importante para evitar surpresas em implementação física, porque LS e ISO dependem de supplies disponíveis no local onde a célula será inserida.

---

# Checklist prático para revisar UPF de LS/ISO

## Level shifter

```text
1. A PST realmente cria uma diferença de tensão?
2. set_voltage foi aplicado às supplies certas?
3. A biblioteca tem LS caracterizado para essas tensões?
4. A estratégia define inputs/outputs corretamente?
5. A regra high_to_low/low_to_high está correta?
6. A localização self/parent/automatic está alinhada com a metodologia?
7. Existe supply disponível no local escolhido?
8. Nets especiais estão impedindo LS?
9. Estratégias incompletas deixam localizações não desejadas abertas?
10. É necessário usar user-defined only?
```

## Isolation

```text
1. Quais domínios podem desligar?
2. Quais outputs desses domínios precisam isolamento?
3. Algum input para shutdown domain precisa isolamento?
4. Qual clamp value é seguro?
5. O controle de isolation é ativo alto ou baixo?
6. O controle está visível no scope onde a estratégia é definida?
7. A supply da ISO é always-on o suficiente?
8. A ISO fica dentro ou fora do domínio?
9. A biblioteca tem célula compatível com clamp/sense?
10. Nets especiais estão impedindo ISO?
```

---

## Checklist de qualidade

- [x] Bloco 080 processado conforme roteiro corrigido, slides 1-25.
- [x] O arquivo grande foi tratado apenas na parte A, sem avançar indevidamente para parte B.
- [x] Texto dos prints foi extraído e organizado.
- [x] Level shifting foi explicado com PST, `set_voltage`, biblioteca, syntax, localização e exemplos.
- [x] Isolation foi explicado com planejamento, clamp, localização, comandos, exemplo e scope.
- [x] Figuras das páginas foram interpretadas.
- [x] Comandos UPF foram preservados.
- [x] Pegadinhas de estratégia incompleta, soft constraint e scope foram destacadas.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 081
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 03 Module 03 — Power Strategies — parte B
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies.docx
```

- **Processar somente:** slides 26-50
- **Começar por:** `Defining Isolation: Location Parent`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Power Strategies_parte_B.md
```

- **Depois:** Bloco 082 — `03 Module 03 - Power Strategies - parte C`, slides 51-60.
