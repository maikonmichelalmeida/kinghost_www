# 04 Module 04 — Supply Network — parte B

## Controle do bloco

- **Bloco:** 084
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 04 Module 04 — Supply Network — parte B
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network.docx`
- **Arquivo anexado nesta conversa:** `04 Module 04 - Supply Network.docx`
- **Faixa processada conforme roteiro:** slides 26-50
- **Continuação:** mesmo anexo usado na parte A
- **Começa em:** `Supply Set Handles`
- **Termina em:** `Supply Sets and set_isolation`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network_parte_B.md
```

---

## Resumo executivo

Esta parte B aprofunda o fluxo moderno de **supply sets** e **supply set handles** em UPF. A parte A introduziu a rede tradicional de supplies, supply nets, supply ports, conectividade explícita e a motivação dos supply sets. Agora a aula entra no coração do fluxo recomendado pela Synopsys: usar **handles implícitos de power domains** em vez de depender de nomes físicos de supply nets no RTL.

A parte B cobre:

1. Revisão dos três handles padrão de cada power domain:
   - `primary`;
   - `default_isolation`;
   - `default_retention`.

2. Funções dentro dos handles:
   - `power`;
   - `ground`;
   - `pwell`;
   - `nwell`.

3. Benefícios dos supply set handles:
   - não precisar saber nomes reais de supply nets;
   - não precisar criar explicitamente supply sets em muitos casos;
   - descrever supplies por domínio;
   - fluxo recomendado nas ferramentas Synopsys.

4. Atualização de supply sets por:
   - **association**;
   - **refinement**.

5. Associação de handles:
   - handle com outro handle;
   - explicit supply set com handle;
   - associação durante `create_power_domain`.

6. Caveats de associação:
   - cada handle só pode ser associado uma vez;
   - um supply set pode ser associado a múltiplos handles;
   - explicit supply set precisa estar no mesmo scope ou acima do handle;
   - `associate_supply_set` também pode associar supply sets entre si.

7. Refinamento:
   - supply sets abstratos precisam ser refinados para supply nets reais para implementação física;
   - refinamento não elimina o supply set;
   - após refinamento, supply set semantics e supply net name podem ser tratados de forma equivalente.

8. Diferença entre refinamento de explicit supply sets e handles implícitos:
   - explicit supply set pode refinar para supply nets ou para funções de outro supply set;
   - supply set handle refinado via `create_supply_set` só pode ser refinado para supply nets.

9. Como definir primary supply de power domains com explicit supply sets:
   - quando o supply set já é conhecido na criação do domínio;
   - quando o supply set é definido depois e associado ao handle.

10. Exemplo completo comparando explicit vs implicit:
    - fluxo com explicit supply sets;
    - fluxo com supply set handles;
    - recomendação do curso: supply set handles.

11. Controle de availability de supply sets com:
    - `-available_supplies`.

12. Exemplos de domains Purple, Orange e Green:
    - disponibilidade default;
    - restringir a domain primary only;
    - permitir um conjunto adicional específico.

13. Recapitulação das regras de availability.

14. Uso de supply sets em strategies:
    - isolation;
    - retention;
    - power switches;
    - power states;
    - simulation testbenches.

15. Introdução às opções de `set_isolation` baseadas em supply sets:
    - `-source`;
    - `-sink`;
    - `-diff_supply_only`.

A mensagem central desta parte B é:

```text
Supply set handles são o fluxo preferido/recomendado nas ferramentas Synopsys porque permitem escrever power intent em termos de domínios e funções de supply, sem amarrar o UPF RTL aos nomes físicos de supply nets.
```

---

# Parte 1 — Supply set handles

## Slide 26 — Supply Set Handles

### Texto extraído

Título:

```text
Supply Set Handles
```

Pontos principais:

```text
There are 3 pre-defined supply set handles available for each power domain
```

Subitens:

```text
By default, the cells in a power domain are connected to these defaults
Default connections for isolation and retention cells can be overridden by specifying a different supply in the isolation and retention strategies
Default connections can also be overridden with explicit exception connections
```

Handles mostrados:

```text
primary
default_isolation
default_retention
```

Descrições da figura:

```text
primary:
Set of supply nets connected to all elements partitioned into a power domain
```

```text
default_isolation:
Set of supply nets connected to isolation elements of a power domain
```

```text
default_retention:
Set of supply nets connected to retention elements of a power domain
```

### Interpretação

Este slide retoma o final da parte A e aprofunda os três handles padrão criados para cada power domain.

Quando você cria um power domain, a ferramenta cria automaticamente referências de supply set associadas ao domínio. Essas referências são os **supply set handles**.

Para um domínio `PD1`, os handles típicos são:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

## `primary`

É o supply set usado pelos elementos normais do domínio:

```text
standard cells
registradores comuns
lógica combinacional
lógica sequencial normal
```

## `default_isolation`

É o supply set default para as isolation cells associadas ao domínio.

Isso é importante porque uma isolation cell pode precisar ficar ligada mesmo quando a lógica normal do domínio desligar.

## `default_retention`

É o supply set default para retention elements.

Retention flops frequentemente precisam de uma supply de backup ou always-on para manter estado durante shutdown.

### Ponto importante

Esses handles são defaults, mas não são obrigatoriamente definitivos. O slide diz que as conexões default de isolation e retention podem ser sobrescritas:

- diretamente nas strategies;
- por exception connections explícitas.

---

## Slide 27 — Supply Set Handles and Their Functions

### Texto extraído

Título:

```text
Supply Set Handles and Their Functions
```

Pontos:

```text
Like explicit supply sets, each supply set handle contains supply set functions
```

```text
Supply nets connected to elements in a domain can be accessed through the functions of supply set handles
```

Funções mostradas:

```text
power
ground
pwell
nwell
```

### Interpretação

Este slide mostra que um handle se comporta como um supply set explícito em relação às suas funções.

Se `PD1.primary` é um handle, ele pode ter funções como:

```text
PD1.primary.power
PD1.primary.ground
PD1.primary.pwell
PD1.primary.nwell
```

A função `power` aponta para a supply de power; `ground` para ground; `pwell` e `nwell` para supplies de well quando relevantes.

### Regra mental

```text
Supply set handle = referência automática para um supply set do domínio.
Ele também possui funções.
```

Isso permite escrever strategies de modo abstrato, por exemplo:

```text
use a primary supply of PD2
use default isolation supply of PD1
use default retention supply of BLOCK_PD
```

sem precisar saber se a net real se chama `VDD`, `VDDL`, `VDD_AON`, `VDD_LOW`, etc.

---

## Slide 28 — Benefits of Supply Set Handles

### Texto extraído

Título:

```text
Benefits of Supply Set Handles
```

Pontos:

```text
Supply set handles allow reference to supply nets and supply net groups of a domain without requiring actual supply net names
```

Subitem:

```text
Don't even need explicit supply set name
```

Exemplo:

```text
Statement "output isolation of PD1 is powered by PD2" can be easily represented as
```

Comando:

```tcl
set_isolation PD1iso -domain PD1 \
    -applies_to outputs -isolation_supply_set PD2.primary ...
```

Caixa verde:

```text
This is the recommended flow in Synopsys tools today for defining supplies
```

### Interpretação

Este slide é metodologicamente muito importante. Ele diz explicitamente que usar supply set handles é o fluxo recomendado nas ferramentas Synopsys para definir supplies.

O exemplo:

```tcl
set_isolation PD1iso -domain PD1 \
    -applies_to outputs -isolation_supply_set PD2.primary ...
```

expressa:

```text
A isolation de saída de PD1 é alimentada pela supply primária de PD2.
```

Sem supply set handles, o usuário precisaria saber o nome real da supply:

```text
VDD2? VDD_AON? VDD_TOP? VDDL?
```

Com handles, basta dizer:

```text
PD2.primary
```

### Benefício central

```text
O UPF fica mais arquitetural e menos dependente de nomes físicos.
```

Isso melhora:

- reuso de IP;
- portabilidade;
- legibilidade;
- manutenção;
- fluxo RTL-to-physical.

---

# Parte 2 — Updating, association e refinement

## Slide 29 — Updating Supply Sets

### Texto extraído

Título:

```text
Updating Supply Sets
```

Texto:

```text
A supply set can be updated with either:
```

Opção 1:

```text
Association to another supply set defined at the same scope
```

Subitem:

```text
Using associate_supply_set command or as part of create_power_domain command
```

Opção 2:

```text
Refinement to domain independent supply nets defined at the same scope
```

Subitens:

```text
As part of create_supply_set command or using set_domain_supply_net command
Refinement is how the logical supply gets mapped to the physical space
```

### Interpretação

Um supply set pode ser atualizado de duas formas diferentes.

## 1. Association

A association define uma relação entre:

- um handle e outro handle;
- um handle e um explicit supply set;
- um supply set e outro supply set.

É uma forma de dizer:

```text
este handle usa o mesmo conjunto de supplies daquele outro supply set/handle.
```

## 2. Refinement

O refinement mapeia o supply set abstrato para supply nets reais.

Exemplo:

```text
SS_TOP.power  → VDD
SS_TOP.ground → VSS
```

O slide diz:

```text
Refinement is how the logical supply gets mapped to the physical space.
```

### Diferença mental

```text
Association = relaciona abstrações.
Refinement = resolve abstração para nets físicas reais.
```

---

## Slide 30 — Supply Set Association

### Texto extraído

Título:

```text
Supply Set Association
```

Ponto principal:

```text
Association is used to define a relationship between a supply set handle and either another handle or an explicit supply set
```

Exemplos:

```tcl
create_supply_set mySS1
create_power_domain PD1
```

Associação entre handles:

```tcl
associate_supply_set PD1.default_isolation \
    -handle PD1.default_retention
```

Associação de supply set explícito para handle:

```tcl
associate_supply_set mySS1 \
    -handle PD1.default_isolation
```

Associação durante criação do power domain:

```tcl
create_supply_set mySS2
create_power_domain PD2 \
    -supply {primary mySS2}
```

### Interpretação

Este slide mostra três formas de association.

## 1. Handle com handle

```tcl
associate_supply_set PD1.default_isolation \
    -handle PD1.default_retention
```

Isso indica que `PD1.default_retention` será associado ao mesmo supply set de `PD1.default_isolation`, ou que um handle resolve para o outro, dependendo do ponto de vista do comando.

Uso típico:

```text
isolation e retention usam a mesma supply always-on.
```

## 2. Explicit supply set com handle

```tcl
associate_supply_set mySS1 \
    -handle PD1.default_isolation
```

Isso associa o explicit supply set `mySS1` ao handle `PD1.default_isolation`.

## 3. Association durante criação do domínio

```tcl
create_power_domain PD2 \
    -supply {primary mySS2}
```

Neste caso, o domínio `PD2` já nasce com o handle `PD2.primary` associado a `mySS2`.

### Ponto prático

A association é muito útil quando se quer manter o UPF abstrato, mas ainda declarar relações entre supplies.

---

## Slide 31 — Supply Set Handle Association: Using Explicit Supply Sets

### Texto extraído

Título:

```text
Supply Set Handle Association: Using Explicit Supply Sets
```

Código:

```tcl
# Explicit supply set definition
create_supply_set VDD_LOW

# Top level power domain definition
create_power_domain Top_PD

# Block level power domain definition
# with association
create_power_domain BLOCK_PD \
    -elements {Block} \
    -supply {primary VDD_LOW}
```

Figura:

```text
TOP
Top_PD
BLOCK_PD
VDD_LOW.power
VDD_LOW.ground
Top_PD.primary.power
Top_PD.primary.ground
BLOCK_PD.primary.power
BLOCK_PD.primary.ground
```

### Interpretação

Este exemplo mostra um explicit supply set chamado:

```text
VDD_LOW
```

O domínio top é criado:

```tcl
create_power_domain Top_PD
```

Depois, o bloco é colocado em `BLOCK_PD`, e seu handle primário é associado ao supply set explícito `VDD_LOW`:

```tcl
create_power_domain BLOCK_PD \
    -elements {Block} \
    -supply {primary VDD_LOW}
```

### Significado

```text
A primary supply de BLOCK_PD é VDD_LOW.
```

O diagrama mostra o domínio `BLOCK_PD` dentro de `Top_PD`, com rails de power/ground de `VDD_LOW` entrando no bloco.

### Ponto importante

Esse estilo permite definir explicitamente a supply de um bloco já na criação do power domain.

---

## Slide 32 — Supply Set Handle Association: Using Other Handles

### Texto extraído

Título:

```text
Supply Set Handle Association: Using Other Handles
```

Definição dos power domains:

```tcl
create_power_domain Top_PD \
    -supply {aolow}

create_power_domain BLOCK_PD \
    -elements {Block}
```

Association:

```tcl
associate_supply_set \
    BLOCK_PD.default_isolation \
    -handle BLOCK_PD.default_retention

associate_supply_set \
    Top_PD.aolow \
    -handle BLOCK_PD.default_isolation
```

Nota:

```text
BLOCK_PD default_isolation or BLOCK_PD default_retention handles can still be referenced,
but both will resolve to Top_PD.aolow and will then share the same power states as TOP_PD.aolow
```

### Interpretação

Este slide mostra um caso muito comum em power-gated blocks: isolation e retention usam a mesma supply always-on do top.

O top cria um handle definido pelo usuário:

```tcl
create_power_domain Top_PD -supply {aolow}
```

Isso cria algo como:

```text
Top_PD.aolow
```

Depois, o bloco `BLOCK_PD` é criado. Suas supplies default de isolation e retention existem como handles:

```text
BLOCK_PD.default_isolation
BLOCK_PD.default_retention
```

A association faz duas coisas:

1. Liga `default_retention` ao `default_isolation`:

```tcl
associate_supply_set BLOCK_PD.default_isolation \
    -handle BLOCK_PD.default_retention
```

2. Liga `default_isolation` ao handle always-on do top:

```tcl
associate_supply_set Top_PD.aolow \
    -handle BLOCK_PD.default_isolation
```

Resultado:

```text
BLOCK_PD.default_isolation
BLOCK_PD.default_retention
```

continuam podendo ser referenciados, mas ambos resolvem para:

```text
Top_PD.aolow
```

### Ponto prático

Isso permite escrever strategies do bloco usando handles locais:

```text
BLOCK_PD.default_isolation
BLOCK_PD.default_retention
```

mas, na implementação, ambos são alimentados pela supply always-on do top.

---

## Slide 33 — Supply Set Association — Caveats

### Texto extraído

Título:

```text
Supply Set Association — Caveats
```

Pontos:

```text
Each supply set handle can be associated only once
```

Subitem:

```text
But a given supply set can be associated to multiple supply set handles
```

Exemplo:

```tcl
create_supply_set mySS2
associate_supply_set mySS2 -handle PD1.default_isolation
associate_supply_set mySS2 -handle PD1.default_retention
```

Outro ponto:

```text
Explicit supply set must be at same scope or higher than the supply set handle being associated
```

Outro ponto:

```text
associate_supply_set can be used without -handle argument; must be a supply set:
```

Exemplo:

```tcl
create_supply_set mySS1
create_supply_set mySS2
associate_supply_set {mySS1 mySS2}
```

### Interpretação

Este slide traz caveats importantes.

## 1. Cada handle só pode ser associado uma vez

Você não pode fazer:

```text
PD1.default_isolation → mySS1
PD1.default_isolation → mySS2
```

O handle já teria uma associação.

## 2. Um supply set pode alimentar múltiplos handles

Isso é permitido:

```tcl
associate_supply_set mySS2 -handle PD1.default_isolation
associate_supply_set mySS2 -handle PD1.default_retention
```

Significado:

```text
isolation e retention usam o mesmo supply set.
```

## 3. Scope do explicit supply set

O supply set explícito precisa estar no mesmo scope ou acima do handle associado.

Isso evita que um handle referencie um objeto que não é visível naquele nível hierárquico.

## 4. `associate_supply_set` sem `-handle`

Também pode associar supply sets entre si:

```tcl
associate_supply_set {mySS1 mySS2}
```

Nesse caso, os argumentos devem ser supply sets, não handles.

---

# Parte 3 — Refining supply sets

## Slide 34 — Refining Supply Sets to Supply Nets

### Texto extraído

Título:

```text
Refining Supply Sets to Supply Nets
```

Pontos:

```text
While supply sets are sufficient for RTL synthesis and simulation,
physical implementation requires that these abstract supply sets be "refined"
to actual supply nets
```

```text
This refinement is required for physical implementation
```

Subitem:

```text
It can also be performed at RTL or synthesis stage, if supply net names are already known
```

```text
Refinement to a supply net does not eliminate the supply set, it simply provides
a specific net name for each supply set function
```

Subitem:

```text
Once refined, user can use supply_set semantics or supply_net name; both will be treated equivalently
```

### Interpretação

Supply sets abstratos são suficientes para RTL simulation e algumas fases iniciais. Mas physical implementation precisa de nets reais.

O refinement resolve:

```text
supply set function → supply net name
```

Exemplo:

```text
PD1.primary.power  → VDD
PD1.primary.ground → VSS
```

### Ponto importante

Refinar um supply set **não destrói** o supply set.

Depois do refinement, o usuário pode usar:

```text
supply set semantics
```

ou:

```text
supply net name
```

e ambos serão tratados de forma equivalente.

### Exemplo mental

Depois de refinar:

```text
PD1.primary.power = VDD
```

a ferramenta entende que referir-se a `PD1.primary.power` ou a `VDD`, naquele contexto, aponta para a mesma semântica de supply.

---

## Slide 35 — Supply Set Refinement

### Texto extraído

Título:

```text
Supply Set Refinement
```

Ponto 1:

```text
An explicit supply set can be refined when it is created
```

Exemplo:

```tcl
create_supply_set mySS1 \
    -function {power VDD} \
    -function {ground VSS}
```

Ponto 2:

```text
Both explicit and implicit supply sets can be refined after they have been created,
using the "-update" argument
```

Exemplo explicit:

```tcl
create_supply_set mySS1
...
create_supply_set mySS1 \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

Anotações:

```text
-update option required
Can be either supply nets or explicit supply set functions
```

Exemplo implicit:

```tcl
create_power_domain PD1
...
create_supply_set PD1.primary \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

Anotações:

```text
-update option required
Must be supply nets
```

### Interpretação

Este slide diferencia refinamento explícito e implícito.

## Explicit supply set

Pode ser criado já refinado:

```tcl
create_supply_set mySS1 \
    -function {power VDD} \
    -function {ground VSS}
```

Ou pode ser criado abstrato e depois atualizado:

```tcl
create_supply_set mySS1
create_supply_set mySS1 \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

Para explicit supply sets, as funções podem apontar para:

- supply nets;
- funções de outro explicit supply set.

## Implicit supply set handle

Criado por `create_power_domain`.

Exemplo:

```text
PD1.primary
```

Para refiná-lo com `create_supply_set`, usa-se:

```tcl
create_supply_set PD1.primary \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

Mas o slide destaca:

```text
Must be supply nets
```

Ou seja, ao refinar handle implícito via `create_supply_set`, as funções devem apontar para nets reais, não para funções de outro supply set.

---

## Slide 36 — Explicit Supply Set Refinement: Examples

### Texto extraído

Título:

```text
Explicit Supply Set Refinement: Examples
```

Código:

```tcl
create_supply_set mySS1
create_supply_set mySS2

create_supply_set mySS3 \
    -function {ground mySS1.ground}

create_supply_set mySS2 \
    -function {power mySS1.power} \
    -function {ground mySS1.ground} \
    -update

create_supply_set mySS1 \
    -function {power myVDD} \
    -function {ground myVSS} \
    -update
```

Anotações:

```text
Common ground
Supply set to supply set update
Supply set to supply net update
```

### Interpretação

Este exemplo mostra três padrões.

## 1. Common ground

```tcl
create_supply_set mySS3 \
    -function {ground mySS1.ground}
```

`mySS3` compartilha a função ground de `mySS1`.

## 2. Supply set to supply set update

```tcl
create_supply_set mySS2 \
    -function {power mySS1.power} \
    -function {ground mySS1.ground} \
    -update
```

`mySS2` passa a usar as funções power/ground de `mySS1`.

## 3. Supply set to supply net update

```tcl
create_supply_set mySS1 \
    -function {power myVDD} \
    -function {ground myVSS} \
    -update
```

`mySS1` é refinado para nets concretas `myVDD` e `myVSS`.

### Ponto prático

Isso permite criar relações abstratas entre supply sets antes de resolver tudo para nets físicas.

---

## Slide 37 — Supply Set Handle Refinement: Examples

### Texto extraído

Título:

```text
Supply Set Handle Refinement: Examples
```

Ponto:

```text
Using the create_supply_set command, you can refine a supply set handle only to a supply net
```

Código com caso correto:

```tcl
create_power_domain PD1

create_supply_set PD1.primary \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

Anotação:

```text
-update option required when using create_supply_set with supply set handle
```

Exemplo parcial:

```tcl
create_supply_set PD1.primary \
    -function {power VDD} \
    -update
```

Anotação:

```text
Recommend complete refinement to both power and ground, if possible
```

Exemplo inválido:

```tcl
create_supply_set mySS1
create_supply_set PD1.primary \
    -function {power mySS1.power} \
    -update
```

Anotação:

```text
Cannot update handle to only the power or ground function of a supply set
```

### Interpretação

Este slide é uma pegadinha forte.

Para **supply set handles** como:

```text
PD1.primary
```

o refinamento via `create_supply_set` deve apontar para **supply nets**, não para funções de outro supply set.

Correto:

```tcl
create_supply_set PD1.primary \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

Cuidado:

```tcl
create_supply_set PD1.primary \
    -function {power VDD} \
    -update
```

É possível refinar só power, mas o slide recomenda refinamento completo para power e ground, se possível.

Incorreto:

```tcl
create_supply_set PD1.primary \
    -function {power mySS1.power} \
    -update
```

Porque um handle não pode ser refinado dessa forma para uma função isolada de outro supply set.

### Regra de prova

```text
Explicit supply set pode usar funções de outro supply set.
Supply set handle refinado via create_supply_set deve ser refinado para supply nets.
```

---

## Slide 38 — Defining Primary Supply Set of a Power Domain with Explicit Supply Sets

### Texto extraído

Título:

```text
Defining Primary Supply Set of a Power Domain with Explicit Supply Sets
```

Método 1:

```text
Supply set is known when power domain is defined:
```

```tcl
create_supply_set mySS
create_power_domain PD1 -include_scope \
    -supply {primary mySS}
```

Método 2:

```text
Supply set is defined after power domain has already been created:
```

```tcl
create_power_domain PD1 -include_scope
...
create_supply_set mySS
associate_supply_set mySS \
    -handle PD1.primary
```

### Interpretação

Este slide mostra duas formas válidas de definir a primary supply de um power domain usando explicit supply sets.

## Método 1 — Supply set conhecido antes

Se `mySS` já existe:

```tcl
create_supply_set mySS
create_power_domain PD1 -include_scope \
    -supply {primary mySS}
```

O domínio já é criado com `PD1.primary` associado a `mySS`.

## Método 2 — Supply set definido depois

Se o domínio já foi criado:

```tcl
create_power_domain PD1 -include_scope
```

e só depois o supply set é criado:

```tcl
create_supply_set mySS
```

então usa-se:

```tcl
associate_supply_set mySS \
    -handle PD1.primary
```

### Regra prática

```text
Se o supply set existe antes, use -supply na criação do domínio.
Se ele surge depois, use associate_supply_set.
```

---

## Slide 39 — Full Example: Explicit vs. Implicit

### Texto extraído

Título:

```text
Full Example: Explicit vs. Implicit
```

Lado esquerdo — supply sets explícitos em RTL:

```tcl
create_supply_set mySS
create_supply_set isoSS

create_power_domain PD1 -include_scope

set_isolation iso1 -domain PD1 \
    -isolation_supply_set isoSS \
    -applies_to outputs

associate_supply_set mySS -handle PD1.primary
```

Lado direito — supply set handles em RTL:

```tcl
create_power_domain PD1 -include_scope

set_isolation iso1 -domain PD1 \
    -applies_to outputs
```

Selo:

```text
Recommended
```

### Interpretação

Este slide compara dois estilos.

## Estilo com explicit supply sets

O usuário cria explicitamente:

```tcl
mySS
isoSS
```

Depois associa `mySS` ao `PD1.primary` e usa `isoSS` na strategy de isolation.

Isso funciona, mas é mais verboso.

## Estilo com supply set handles

O usuário escreve apenas:

```tcl
create_power_domain PD1 -include_scope

set_isolation iso1 -domain PD1 \
    -applies_to outputs
```

A strategy usa os defaults do domínio:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

conforme necessário.

### Recomendação

O slide marca o fluxo com handles como:

```text
Recommended
```

### Interpretação metodológica

Em RTL UPF, usar handles reduz a quantidade de objetos explícitos e torna o power intent mais portável. O refinamento pode vir depois, no UPF de implementação.

---

# Parte 4 — Controlando availability de supply sets

## Slide 40 — Controlling Supply Set Availability

### Texto extraído

Título:

```text
Controlling Supply Set Availability
```

Pontos:

```text
Supply sets are available in the scope they are defined in and below
```

```text
In the physical implementation space, this can create unreasonable expectations for the power grid
```

```text
IEEE1801-2013 LRM defines a method to control the availability of a supply set
```

Comando:

```tcl
create_power_domain <PD name> \
    -available_supplies {<supply set list>}
```

### Interpretação

Por padrão, supply sets definidos em um scope ficam disponíveis ali e abaixo.

Em termos abstratos, isso é útil. Mas no espaço físico, pode criar expectativas irrealistas.

Exemplo:

```text
Se SS1, SS2, SS3 e SS4 estão definidos no top,
por default todos podem parecer disponíveis em todos os domínios internos.
```

Fisicamente, isso talvez exigiria power grid levando todas essas supplies para todos os lugares, o que não é realista.

O IEEE 1801-2013 define:

```tcl
-available_supplies
```

para limitar quais supply sets ficam disponíveis em um domínio.

---

## Slide 41 — Controlling Supply Set Availability — default

### Texto extraído

Título:

```text
Controlling Supply Set Availability
```

Texto:

```text
Default supply availability
```

Subitens:

```text
SS1, SS2, SS3, and SS4 are explicit supply sets, defined at the top level
Available everywhere
May not be realistic
```

Figura:

```text
U1 sees SS1 SS2 SS3 SS4
U2 sees SS1 SS2 SS3 SS4
U3 sees SS1 SS2 SS3 SS4
```

### Interpretação

Este slide mostra o problema default.

Se supply sets são definidos no top, todos os domínios abaixo podem vê-los.

Visualmente:

```text
U1 recebe SS1, SS2, SS3, SS4
U2 recebe SS1, SS2, SS3, SS4
U3 recebe SS1, SS2, SS3, SS4
```

Mas isso pode não refletir a realidade física.

Talvez `U1` só tenha acesso a `SS2`; `U2` a `SS1`, `SS2`, `SS3`; e `U3` a todos.

### Ponto importante

```text
Disponibilidade lógica default pode ser ampla demais para implementação física.
```

---

## Slide 42 — Controlling Supply Set Availability — desired network

### Texto extraído

Título:

```text
Controlling Supply Set Availability
```

Texto:

```text
Desired supply network:
```

Subitens:

```text
SS1, SS2, SS3, and SS4 are explicit supply sets, defined at the top level,
and are also available in PDPurple
```

```text
Only SS2 available in PDOrange
```

```text
SS1, SS2, and SS3 available in PDGreen
```

Figura:

```text
PDOrange / U1: SS2
PDGreen / U2: SS1 SS2 SS3
PDPurple / U3: SS1 SS2 SS3 SS4
```

### Interpretação

Este slide define a rede desejada.

Em vez de todos os domínios enxergarem tudo, a intenção é:

| Domínio | Supplies disponíveis |
|---|---|
| `PDPurple` | `SS1`, `SS2`, `SS3`, `SS4` |
| `PDOrange` | apenas `SS2` |
| `PDGreen` | `SS1`, `SS2`, `SS3` |

Isso representa melhor uma power grid realista.

### Ponto prático

```text
-available_supplies serve para alinhar disponibilidade lógica do UPF à disponibilidade física esperada da power grid.
```

---

## Slide 43 — Supply Set Availability Example — Purple Domain

### Texto extraído

Título:

```text
Supply Set Availability Example — Purple Domain
```

Ponto:

```text
By default, PDPurple will be allowed to use all supply sets defined: SS1, SS2, SS3 and SS4
```

Comando:

```tcl
create_power_domain PDPurple \
    -elements {U3}
```

Outro ponto:

```text
To have SS1 defined as the domain's primary supply:
```

Comando:

```tcl
associate_supply_set SS1 \
    -handle PDPurple.primary
```

### Interpretação

O domínio Purple não usa `-available_supplies`, então mantém a disponibilidade default.

Como `SS1`, `SS2`, `SS3` e `SS4` foram definidos no top, `PDPurple` pode usá-los.

Depois, define-se a primary supply do domínio:

```tcl
associate_supply_set SS1 \
    -handle PDPurple.primary
```

Isso significa:

```text
PDPurple.primary = SS1
```

Mas os outros supply sets ainda podem estar disponíveis no domínio, por default.

---

## Slide 44 — Supply Set Availability Example — Orange Domain

### Texto extraído

Título:

```text
Supply Set Availability Example — Orange Domain
```

Texto:

```text
To have PDOrange only use SS2, the domain primary:
```

Comando:

```tcl
create_power_domain PDOrange \
    -elements {U1} \
    -available_supplies {}

associate_supply_set SS2 \
    -handle PDOrange.primary
```

### Interpretação

Este slide mostra um caso especial.

O objetivo é que `PDOrange` use apenas:

```text
SS2
```

como primary supply, sem supplies adicionais.

O comando:

```tcl
-available_supplies {}
```

significa:

```text
nenhuma supply adicional estará disponível no domínio
```

Mas a supply primary associada explicitamente ainda estará disponível por ser a supply do domínio.

Depois:

```tcl
associate_supply_set SS2 \
    -handle PDOrange.primary
```

define:

```text
PDOrange.primary = SS2
```

### Pegadinha importante

`-available_supplies {}` não significa que o domínio não tem supply nenhuma. Significa que não há supplies **adicionais** disponíveis além das supplies do próprio domínio/associações obrigatórias.

---

## Slide 45 — Supply Set Availability Example — Green Domain

### Texto extraído

Título:

```text
Supply Set Availability Example
```

Texto:

```text
To have PDGreen only use SS3, the domain primary, and SS1 and SS2:
```

Comando:

```tcl
create_power_domain PDGreen \
    -elements {U2} \
    -available_supplies {SS1 SS2}

associate_supply_set SS3 \
    -handle PDGreen.primary
```

### Interpretação

Para `PDGreen`, a intenção é:

```text
primary = SS3
supplies adicionais disponíveis = SS1, SS2
```

Por isso:

```tcl
-available_supplies {SS1 SS2}
```

e:

```tcl
associate_supply_set SS3 \
    -handle PDGreen.primary
```

Resultado:

```text
PDGreen pode usar SS3 como primary,
e também SS1 e SS2 como supplies adicionais.
```

### Comparação com Orange

| Domínio | Primary | `-available_supplies` | Resultado |
|---|---|---|---|
| Orange | SS2 | `{}` | só SS2 |
| Green | SS3 | `{SS1 SS2}` | SS3 + SS1 + SS2 |
| Purple | SS1 | omitido | SS1 + SS2 + SS3 + SS4 |

---

## Slide 46 — Recap: Availability of Supply Sets

### Texto extraído

Título:

```text
Recap: Availability of Supply Sets
```

Resumo 1:

```text
For a given power domain, the following supplies will always be available:
```

Itens:

```text
Any supplies specified in retention, isolation, or power switch strategies for a domain
Any domain-dependent supplies declared or reused in a domain
Any supplies specified with the -supply option of create_power_domain
```

Resumo 2:

```text
When using supply set handles, each power domain will also have primary,
default_isolation, and default_retention supplies
```

Resumo 3:

```text
If -available_supplies {<supply set> ...} are defined for a domain,
the domain gets restricted to use only whatever additional supply sets are specified as part of that argument
```

Subitem:

```text
And those supply sets must have been previously defined
```

Resumo 4:

```text
-available_supplies {} defines that no additional supplies will be available in the power domain
```

Resumo 5:

```text
It is an error to use -available_supplies {} and {<supply set> ...} together
```

### Interpretação

Este slide resume as regras de availability.

## Supplies sempre disponíveis

Mesmo quando availability é restringida, algumas supplies continuam disponíveis:

- supplies usadas em retention/isolation/power switch strategies;
- domain-dependent supplies declaradas/reutilizadas no domínio;
- supplies indicadas com `-supply` em `create_power_domain`.

## Handles padrão

Cada power domain com supply set handles tem:

```text
primary
default_isolation
default_retention
```

## `-available_supplies {SS1 SS2}`

Restringe supplies adicionais aos itens listados.

## `-available_supplies {}`

Diz que nenhuma supply adicional estará disponível.

## Erro

Não pode misturar:

```tcl
-available_supplies {}
```

com:

```tcl
-available_supplies {SS1 SS2}
```

São significados incompatíveis.

---

# Parte 5 — Strategies com supply sets

## Slide 47 — Defining Strategies with Supply Sets

### Texto extraído

Título:

```text
Defining Strategies with Supply Sets
```

Ponto:

```text
In addition to affecting how power domains are defined, supply sets also affect many other power intent constructs
```

Lista:

```text
Isolation Strategies
Retention Strategies
Power Switches
Power States
Simulation Testbenches
```

### Interpretação

Supply sets não afetam apenas a definição de power domains.

Eles também aparecem em várias partes do power intent:

- strategies de isolation;
- strategies de retention;
- power switch definitions;
- power states;
- testbenches de simulação.

Isso é importante porque, ao migrar de supply nets para supply sets, não basta mudar `create_power_domain`. Todo o UPF começa a ficar mais baseado em handles e supply sets.

---

## Slide 48 — Supply Sets and `set_isolation`

### Texto extraído

Título:

```text
Supply Sets and set_isolation
```

Pontos:

```text
Certain aspects of a design may stay relatively unchanged or may be easily identifiable
```

Subitens:

```text
The power supply driving a port/pin
The power supply receiving a port/pin
A difference in power across a port/pin
```

Outro ponto:

```text
IEEE1801-2009 onwards allows for more intuitive isolation strategies
```

Estratégias:

```text
Isolate the ports whose loads are different than the driver (-diff_supply_only TRUE)
```

```text
Isolate the ports whose drivers are related to the specified supply set (-source)
```

```text
Isolate the ports whose receivers are related to the specified supply set (-sink)
```

```text
Isolate the ports whose drivers and receivers are related to the specified supply sets (-source -sink)
```

### Interpretação

Este slide introduz a aplicação de supply sets em `set_isolation`.

Com supply sets, a ferramenta pode raciocinar de forma mais semântica:

- qual supply alimenta o driver;
- qual supply alimenta o receiver;
- se existe diferença de power entre os lados.

Isso permite escrever isolation strategies mais intuitivas.

## `-diff_supply_only true`

Isola apenas quando a supply do load é diferente da supply do driver.

Isso evita isolation desnecessária quando driver e receiver estão no mesmo power state/supply.

## `-source`

Aplica a strategy a sinais cujos drivers estão relacionados a determinado supply set.

## `-sink`

Aplica a strategy a sinais cujos receivers estão relacionados a determinado supply set.

## `-source -sink`

Aplica quando ambos, driver e receiver, correspondem aos supply sets especificados.

### Ponto importante

Essas opções dependem da existência de supply sets, porque a ferramenta precisa saber a relação entre pinos e supplies de forma abstrata.

---

## Slide 49 — UPF Terminology: Source and Sink

### Texto extraído

Título:

```text
UPF Terminology: Source and Sink
```

Pontos:

```text
Power intent can be constructed relative to a "source" and/or "sink"
```

```text
A "source" is the originating logic cell that drives a signal
```

Subitem:

```text
"source supply set" is the supply set related to driving pin of that cell
```

```text
A "sink" is the terminal point of that signal path
```

Subitem:

```text
"sink supply set" is the supply set related to load pin of that object
```

Outro ponto:

```text
One or more power management cells may be inserted (either explicitly or by inference)
along that path, but source and sink are not allowed to change
```

Subitem:

```text
Source/sink property of a net is determined by looking across LS/ISO cells
```

Legenda da figura:

```text
std logic cells
LS, ISO cells
```

### Interpretação

Este slide define `source` e `sink`.

## Source

É a célula lógica de origem que dirige o sinal.

A supply do source é a supply associada ao pino driver dessa célula.

## Sink

É o ponto terminal do caminho do sinal, ou seja, o load/receiver.

A supply do sink é a supply associada ao pino de carga.

## PM cells no meio não mudam source/sink

Mesmo se houver LS ou ISO no meio do caminho, source e sink do caminho lógico não devem mudar.

O slide diz que a propriedade source/sink é determinada olhando **através** das células LS/ISO.

### Por que isso importa?

Se uma isolation cell é inserida no meio, a ferramenta ainda precisa entender:

```text
quem era o driver lógico original
quem era o receiver lógico final
```

para aplicar corretamente `-source`, `-sink` e `-diff_supply_only`.

---

## Slide 50 — Supply Sets and `set_isolation`

### Texto extraído

Título:

```text
Supply Sets and set_isolation
```

Sintaxe para opções de `set_isolation`:

```tcl
-source <source_supply_set_ref_name>
-sink <sink_supply_set_ref_name>
-diff_supply_only true | false
```

Notas:

```text
-source and -sink can ONLY be used when supply sets are defined
```

Subitem:

```text
This is a motivation for moving from supply nets to supply sets
```

Outro ponto:

```text
Synopsys allows -diff_supply to work with supply nets or supply sets,
even though IEEE-1801 restricts it to supply sets only
```

### Interpretação

Este slide fecha a parte B mostrando a sintaxe das opções de `set_isolation`.

As opções:

```tcl
-source
-sink
```

só funcionam quando supply sets estão definidos.

Isso é uma motivação forte para migrar de uma metodologia baseada apenas em supply nets para uma metodologia baseada em supply sets e handles.

### `-diff_supply_only`

A opção:

```tcl
-diff_supply_only true
```

faz a ferramenta aplicar isolation apenas quando há diferença de supply entre source e sink.

O slide observa uma diferença entre padrão e ferramenta:

```text
IEEE-1801 restringe a supply sets.
Synopsys permite funcionar com supply nets ou supply sets.
```

### Ponto de prova

```text
-source e -sink em set_isolation exigem supply sets.
```

---

# Aula didática desenvolvida

## 1. Supply set handles tornam o UPF mais arquitetural

Em vez de escrever:

```text
a isolation usa VDD_AON_0P9
```

o UPF pode escrever:

```text
a isolation usa PD2.primary
```

Isso é mais arquitetural, porque descreve a relação entre domínios:

```text
PD1 é isolado usando a supply primária de PD2.
```

O nome físico da net pode ser refinado depois.

## 2. Handles mantêm o UPF reutilizável

Se um bloco é entregue como IP, ele talvez não saiba o nome real da supply no chip final.

Usar handles permite que o IP diga:

```text
minha lógica usa BLOCK_PD.primary
minhas ISOs usam BLOCK_PD.default_isolation
minhas retentions usam BLOCK_PD.default_retention
```

O integrador depois associa/refina esses handles às supplies reais do SoC.

## 3. Association e refinement não são a mesma coisa

Essa distinção é central.

## Association

Associa abstrações:

```text
BLOCK_PD.default_isolation → Top_PD.aolow
```

Ou:

```text
PD1.primary → mySS
```

## Refinement

Mapeia para nets reais:

```text
mySS.power  → VDD
mySS.ground → VSS
```

O fluxo bom costuma ser:

```text
definir handles/supply sets no RTL
associar handles conforme arquitetura
refinar para nets reais na implementação física
```

## 4. Handles têm regras mais restritas de refinamento

Explicit supply sets podem ser atualizados com funções de outro supply set.

Mas supply set handles refinados via `create_supply_set` devem apontar para supply nets.

Essa é uma pegadinha importante para questões e para scripts reais.

## 5. `-available_supplies` evita expectativas físicas irreais

Por default, supply sets definidos no top ficam disponíveis abaixo. Isso parece conveniente, mas pode sugerir que a power grid leva todas as supplies a todos os blocos.

Fisicamente, isso pode ser impossível ou indesejado.

`-available_supplies` permite dizer:

```text
este domínio só pode usar estas supplies adicionais.
```

Isso alinha a semântica do UPF com o planejamento real da power grid.

## 6. `-available_supplies {}` não remove a primary supply do domínio

Esse ponto é delicado.

No exemplo de `PDOrange`:

```tcl
create_power_domain PDOrange \
    -elements {U1} \
    -available_supplies {}

associate_supply_set SS2 \
    -handle PDOrange.primary
```

O domínio ainda usa `SS2` como primary. O `{}` significa:

```text
não há supplies adicionais além daquelas do próprio domínio/estratégias obrigatórias.
```

## 7. Supply sets tornam `set_isolation` mais inteligente

Com supply sets, a ferramenta pode perguntar:

```text
a supply do driver é diferente da supply do receiver?
o driver está relacionado a qual supply set?
o receiver está relacionado a qual supply set?
```

Isso permite strategies como:

```tcl
-diff_supply_only true
-source SS1
-sink SS2
```

Esse nível de semântica não existe de forma tão limpa quando o UPF usa apenas nomes de supply nets.

## 8. Source e sink atravessam PM cells

Mesmo que uma LS ou ISO seja inserida no meio do caminho, source e sink do caminho lógico não mudam.

Isso evita que uma célula especial inserida pela ferramenta quebre a interpretação da strategy.

---

# Conceitos difíceis explicados em profundidade

## Supply set handle

Referência automática a um supply set associado a um power domain.

Exemplos:

```text
PD1.primary
PD1.default_isolation
PD1.default_retention
```

## Association

Atualização que cria relação entre supply set handle e outro handle ou explicit supply set.

Comando:

```tcl
associate_supply_set
```

## Refinement

Atualização que mapeia supply set abstrato para supply nets reais.

Exemplo:

```text
mySS.power → VDD
mySS.ground → VSS
```

## `-supply` em `create_power_domain`

Opção que permite associar supply set handles durante a criação do domínio.

Exemplo:

```tcl
create_power_domain PD2 \
    -supply {primary mySS2}
```

## `-available_supplies`

Opção que restringe quais supply sets adicionais estão disponíveis em um power domain.

## `-available_supplies {}`

Declara que nenhuma supply adicional está disponível no domínio.

## `-source`

Opção de strategy que filtra/define comportamento com base no supply set do driver/source.

## `-sink`

Opção de strategy que filtra/define comportamento com base no supply set do receiver/sink.

## `-diff_supply_only`

Opção que aplica strategy apenas quando driver e receiver têm supplies diferentes.

## Source

Célula lógica de origem que dirige um sinal.

## Sink

Ponto terminal/load que recebe o sinal.

---

# Comandos importantes da parte B

## Usar handle em isolation

```tcl
set_isolation PD1iso -domain PD1 \
    -applies_to outputs -isolation_supply_set PD2.primary ...
```

## Association entre handles

```tcl
associate_supply_set PD1.default_isolation \
    -handle PD1.default_retention
```

## Association de explicit supply set para handle

```tcl
associate_supply_set mySS1 \
    -handle PD1.default_isolation
```

## Association durante criação de domínio

```tcl
create_supply_set mySS2
create_power_domain PD2 \
    -supply {primary mySS2}
```

## Using explicit supply set na criação de domain

```tcl
create_supply_set VDD_LOW

create_power_domain Top_PD

create_power_domain BLOCK_PD \
    -elements {Block} \
    -supply {primary VDD_LOW}
```

## Associar handles a outro handle

```tcl
create_power_domain Top_PD \
    -supply {aolow}

create_power_domain BLOCK_PD \
    -elements {Block}

associate_supply_set \
    BLOCK_PD.default_isolation \
    -handle BLOCK_PD.default_retention

associate_supply_set \
    Top_PD.aolow \
    -handle BLOCK_PD.default_isolation
```

## Caveat: supply set associado a múltiplos handles

```tcl
create_supply_set mySS2
associate_supply_set mySS2 -handle PD1.default_isolation
associate_supply_set mySS2 -handle PD1.default_retention
```

## Association entre supply sets

```tcl
create_supply_set mySS1
create_supply_set mySS2
associate_supply_set {mySS1 mySS2}
```

## Refinamento de explicit supply set

```tcl
create_supply_set mySS1 \
    -function {power VDD} \
    -function {ground VSS}
```

ou:

```tcl
create_supply_set mySS1
...
create_supply_set mySS1 \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

## Refinamento de handle implícito

```tcl
create_power_domain PD1
...
create_supply_set PD1.primary \
    -function {power VDD} \
    -function {ground VSS} \
    -update
```

## Definir primary supply de domínio — método 1

```tcl
create_supply_set mySS
create_power_domain PD1 -include_scope \
    -supply {primary mySS}
```

## Definir primary supply de domínio — método 2

```tcl
create_power_domain PD1 -include_scope
...
create_supply_set mySS
associate_supply_set mySS \
    -handle PD1.primary
```

## Availability

```tcl
create_power_domain <PD name> \
    -available_supplies {<supply set list>}
```

Orange:

```tcl
create_power_domain PDOrange \
    -elements {U1} \
    -available_supplies {}

associate_supply_set SS2 \
    -handle PDOrange.primary
```

Green:

```tcl
create_power_domain PDGreen \
    -elements {U2} \
    -available_supplies {SS1 SS2}

associate_supply_set SS3 \
    -handle PDGreen.primary
```

Purple:

```tcl
create_power_domain PDPurple \
    -elements {U3}

associate_supply_set SS1 \
    -handle PDPurple.primary
```

## `set_isolation` com supply sets

```tcl
-source <source_supply_set_ref_name>
-sink <sink_supply_set_ref_name>
-diff_supply_only true | false
```

---

# Tabelas de revisão

## Handles padrão

| Handle | Uso |
|---|---|
| `<PD>.primary` | Supplies dos elementos normais do domínio |
| `<PD>.default_isolation` | Supplies default das isolation cells |
| `<PD>.default_retention` | Supplies default dos retention elements |

---

## Association vs refinement

| Conceito | O que faz | Exemplo |
|---|---|---|
| Association | Relaciona handle com handle ou explicit supply set | `associate_supply_set mySS -handle PD1.primary` |
| Refinement | Mapeia supply set abstrato para nets reais | `mySS.power → VDD` |
| Association durante domain creation | Define handle na criação do domínio | `-supply {primary mySS}` |
| Refinement posterior | Usa `-update` | `create_supply_set mySS -function {power VDD} -update` |

---

## Explicit supply set vs handle refinement

| Tipo | Pode refinar para | Observação |
|---|---|---|
| Explicit supply set | supply nets ou funções de outro explicit supply set | Mais flexível |
| Supply set handle | supply nets | `-update` obrigatório via `create_supply_set` |
| Handle parcial | power sem ground, por exemplo | Possível, mas recomendação é refinar power e ground |
| Handle para função de outro supply set | Não permitido | Pegadinha do slide 37 |

---

## Availability examples

| Domínio | Primary | Additional available supplies | Comando-chave |
|---|---|---|---|
| `PDPurple` | `SS1` | default: `SS1 SS2 SS3 SS4` | sem `-available_supplies` |
| `PDOrange` | `SS2` | nenhuma adicional | `-available_supplies {}` |
| `PDGreen` | `SS3` | `SS1 SS2` | `-available_supplies {SS1 SS2}` |

---

## `set_isolation` com supply sets

| Opção | Significado |
|---|---|
| `-source` | Filtra/aplica com base no supply set do driver |
| `-sink` | Filtra/aplica com base no supply set do receiver |
| `-diff_supply_only true` | Isola apenas quando source e sink têm supplies diferentes |
| `-diff_supply_only false` | Não restringe a diferenças de supply |
| `-source -sink` | Usa relação de driver e receiver simultaneamente |

---

# Figuras e diagramas importantes

## Slide 26 — Supply Set Handles

Mostra os três handles de cada power domain: `primary`, `default_isolation`, `default_retention`, com descrições do tipo de elementos que cada um alimenta.

## Slide 27 — Handles and Functions

Mostra que handles também possuem funções `power`, `ground`, `pwell`, `nwell`.

## Slide 28 — Benefits of Supply Set Handles

Mostra o exemplo `PD2.primary` em `set_isolation` e declara que esse é o fluxo recomendado pela Synopsys.

## Slide 29 — Updating Supply Sets

Divide update em association e refinement.

## Slide 30 — Supply Set Association

Mostra association entre handles, explicit supply set para handle e association durante criação do power domain.

## Slide 31 — Using Explicit Supply Sets

Mostra `BLOCK_PD` usando `VDD_LOW` como primary supply.

## Slide 32 — Using Other Handles

Mostra `BLOCK_PD.default_isolation` e `BLOCK_PD.default_retention` resolvendo para `Top_PD.aolow`.

## Slide 33 — Association Caveats

Mostra que um handle só pode ser associado uma vez, mas um supply set pode alimentar múltiplos handles.

## Slide 34 — Refining Supply Sets

Mostra que physical implementation exige refinamento para supply nets reais.

## Slide 35 — Supply Set Refinement

Mostra refinamento no momento da criação ou posteriormente com `-update`, distinguindo explicit e implicit.

## Slide 36 — Explicit Refinement Examples

Mostra common ground, supply set to supply set update e supply set to supply net update.

## Slide 37 — Handle Refinement Examples

Mostra o uso correto e incorreto de refinamento de handles.

## Slide 38 — Primary Supply with Explicit Supply Sets

Mostra dois métodos: usando `-supply` na criação do domínio ou `associate_supply_set` depois.

## Slide 39 — Explicit vs Implicit

Mostra que supply set handles reduzem o RTL UPF e são recomendados.

## Slide 40 — Controlling Availability

Introduz `-available_supplies`.

## Slides 41-42 — Availability default vs desired network

Mostram por que disponibilidade default pode ser irrealista e como restringir supplies por domínio.

## Slides 43-45 — Purple, Orange, Green examples

Mostram exemplos concretos de disponibilidade e primary supply.

## Slide 46 — Recap

Resume regras de availability e o erro de misturar `{}` com lista de supply sets.

## Slide 47 — Defining Strategies with Supply Sets

Mostra que supply sets afetam isolation, retention, switches, states e testbenches.

## Slide 48 — Supply Sets and set_isolation

Mostra `-source`, `-sink` e `-diff_supply_only` como estratégias mais intuitivas.

## Slide 49 — Source and Sink

Define source como driver lógico e sink como terminal/load, atravessando LS/ISO.

## Slide 50 — set_isolation syntax

Mostra a sintaxe das opções e a restrição de que `-source` e `-sink` exigem supply sets.

---

# Pontos de prova e revisão

1. Cada power domain tem três supply set handles predefinidos.
2. Os handles padrão são `primary`, `default_isolation` e `default_retention`.
3. Por default, células do power domain são conectadas aos defaults.
4. Conexões default de isolation podem ser sobrescritas por strategies.
5. Conexões default de retention podem ser sobrescritas por strategies.
6. Conexões default também podem ser sobrescritas por exception connections.
7. `primary` alimenta todos os elementos partitioned no power domain.
8. `default_isolation` alimenta isolation elements.
9. `default_retention` alimenta retention elements.
10. Supply set handles também contêm supply set functions.
11. Funções típicas são `power`, `ground`, `pwell` e `nwell`.
12. Supply nets de elementos do domínio podem ser acessadas pelas funções dos handles.
13. Supply set handles permitem referenciar supplies sem nomes reais de supply nets.
14. Supply set handles nem exigem nomes explícitos de supply sets.
15. O exemplo `PD2.primary` representa a primary supply de PD2.
16. Supply set handles são o fluxo recomendado nas ferramentas Synopsys para definir supplies.
17. Supply sets podem ser atualizados por association.
18. Supply sets podem ser atualizados por refinement.
19. Association relaciona handle com outro handle ou explicit supply set.
20. Refinement mapeia logical supply para physical space.
21. `associate_supply_set` pode associar handle a handle.
22. `associate_supply_set` pode associar explicit supply set a handle.
23. `create_power_domain -supply` pode associar supply durante criação do domínio.
24. `create_power_domain BLOCK_PD -supply {primary VDD_LOW}` associa primary a `VDD_LOW`.
25. Handles `default_isolation` e `default_retention` podem resolver para o mesmo supply set.
26. Um handle pode continuar sendo referenciado mesmo resolvendo para outro supply set.
27. Cada supply set handle pode ser associado apenas uma vez.
28. Um dado supply set pode ser associado a múltiplos handles.
29. Explicit supply set precisa estar no mesmo scope ou acima do handle associado.
30. `associate_supply_set` pode ser usado sem `-handle` se os argumentos forem supply sets.
31. Supply sets abstratos precisam ser refinados para physical implementation.
32. Refinement para supply net não elimina o supply set.
33. Depois de refinado, supply set semantics e supply net name podem ser tratados equivalentemente.
34. Explicit supply set pode ser refinado quando criado.
35. Explicit e implicit supply sets podem ser refinados depois com `-update`.
36. Para explicit supply sets, functions podem apontar para supply nets ou functions de outros explicit supply sets.
37. Para implicit supply set handles refinados via `create_supply_set`, functions devem apontar para supply nets.
38. `-update` é obrigatório ao atualizar supply set já existente.
39. Recomenda-se refinamento completo de power e ground se possível.
40. Não se pode atualizar handle para apenas a função power/ground de outro supply set.
41. Primary supply pode ser definida com `-supply` se o supply set é conhecido na criação do domínio.
42. Primary supply pode ser definida com `associate_supply_set` se o supply set é criado depois.
43. Exemplo com supply set handles no RTL é recomendado sobre explicit supply sets.
44. Supply sets estão disponíveis no scope onde são definidos e abaixo.
45. Disponibilidade default pode criar expectativas irreais para power grid.
46. IEEE 1801-2013 define `-available_supplies`.
47. Por default, supplies top-level podem ficar disponíveis em todos os domínios abaixo.
48. `PDPurple` sem `-available_supplies` pode usar todos os supply sets top-level.
49. `PDOrange -available_supplies {}` restringe supplies adicionais.
50. `PDGreen -available_supplies {SS1 SS2}` permite SS1 e SS2 como supplies adicionais.
51. Supplies especificadas em retention/isolation/power switch strategies ficam sempre disponíveis para o domínio.
52. Domain-dependent supplies declaradas/reusadas no domínio ficam disponíveis.
53. Supplies especificadas com `-supply` em `create_power_domain` ficam disponíveis.
54. Cada power domain com handles tem primary, default_isolation e default_retention supplies.
55. `-available_supplies {<supply set> ...}` restringe supplies adicionais.
56. Supply sets listados em `-available_supplies` precisam ter sido previamente definidos.
57. `-available_supplies {}` define que nenhuma supply adicional está disponível.
58. É erro usar `-available_supplies {}` junto com lista de supply sets.
59. Supply sets afetam isolation strategies.
60. Supply sets afetam retention strategies.
61. Supply sets afetam power switches.
62. Supply sets afetam power states.
63. Supply sets afetam simulation testbenches.
64. `set_isolation` pode usar `-diff_supply_only`.
65. `set_isolation` pode usar `-source`.
66. `set_isolation` pode usar `-sink`.
67. `source` é a célula lógica de origem que dirige o sinal.
68. `sink` é o terminal/load final do caminho do sinal.
69. LS/ISO no caminho não devem alterar source e sink.
70. Source/sink property é determinada olhando através de LS/ISO cells.
71. `-source` e `-sink` só podem ser usados quando supply sets estão definidos.
72. Isso é motivação para migrar de supply nets para supply sets.
73. Synopsys permite `-diff_supply` com supply nets ou supply sets.
74. IEEE-1801 restringe `-diff_supply` a supply sets.
75. Supply set handles reduzem dependência de nomes físicos e melhoram reuso de IP.

---

# Relação com Fusion Compiler

No Fusion Compiler, essa parte é essencial porque o fluxo físico precisa resolver supplies reais, mas o UPF de RTL deve continuar reutilizável e abstrato.

O fluxo recomendado fica assim:

```text
RTL UPF:
  create_power_domain
  usar handles como PD.primary, PD.default_isolation, PD.default_retention
  definir strategies de forma abstrata

Implementation UPF / physical synthesis:
  criar supply nets domain independent
  associar/refinar handles
  controlar available supplies
  conectar power/ground reais
```

O Fusion Compiler usa essas informações para:

```text
1. conectar standard cells à primary supply correta;
2. alimentar isolation cells com default_isolation ou strategy override;
3. alimentar retention cells com default_retention ou strategy override;
4. decidir se supplies estão disponíveis em um domínio;
5. evitar power grid irrealista por excesso de availability;
6. interpretar source/sink em strategies de isolation;
7. preparar o design para physical synthesis e implementação low-power.
```

---

# Checklist prático da parte B

## Supply set handles

```text
1. Cada domínio tem primary, default_isolation e default_retention?
2. As strategies usam handles em vez de nomes físicos quando possível?
3. Isolation e retention usam supplies adequadas?
4. Handles locais resolvem para supplies corretas no top?
```

## Association

```text
1. O handle foi associado apenas uma vez?
2. O supply set explícito está no mesmo scope ou acima?
3. Vários handles podem compartilhar o mesmo supply set?
4. A association foi feita antes do refinement?
```

## Refinement

```text
1. Os supply sets abstratos foram refinados para physical implementation?
2. As supply nets já existem antes do refinement?
3. As funções power/ground foram refinadas uma única vez?
4. Para handles, o refinement aponta para supply nets, não para funções de outro supply set?
5. O refinement completo power+ground foi feito quando possível?
```

## Availability

```text
1. Supplies definidas no top ficaram amplas demais?
2. Algum domínio precisa restringir supplies adicionais?
3. `-available_supplies {}` foi usado corretamente?
4. A lista de `-available_supplies` contém apenas supply sets previamente definidos?
5. Não houve mistura inválida entre `{}` e lista de supply sets?
```

## Strategies

```text
1. `set_isolation` usa `-source`/`-sink` apenas com supply sets definidos?
2. `-diff_supply_only` está coerente com a estratégia?
3. Source e sink foram entendidos atravessando LS/ISO?
```

---

# Checklist de qualidade

- [x] Bloco 084 processado conforme roteiro, slides 26-50.
- [x] O arquivo grande foi mantido dividido, sem avançar para a parte C.
- [x] Supply set handles foram explicados em profundidade.
- [x] Association e refinement foram separados com clareza.
- [x] Explicit vs implicit supply sets foram comparados.
- [x] `-available_supplies` foi explicado com exemplos Purple, Orange e Green.
- [x] `set_isolation` com supply sets, `-source`, `-sink` e `-diff_supply_only` foi introduzido.
- [x] Figuras dos slides 26-50 foram interpretadas.
- [x] Comandos Tcl/UPF foram preservados.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 085
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 04 Module 04 — Supply Network — parte C
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network.docx
```

- **Processar somente:** slides 51-63
- **Começar por:** `Supply Sets and set_isolation`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network_parte_C.md
```

- **Depois:** conferir o roteiro para o próximo módulo após Supply Network.
