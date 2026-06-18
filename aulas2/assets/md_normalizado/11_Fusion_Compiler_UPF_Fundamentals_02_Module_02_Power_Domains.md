# 02 Module 02 — Power Domains

## Controle do bloco

- **Bloco:** 079
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 02 Module 02 — Power Domains
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\02 Module 02 - Power Domains.docx`
- **Faixa processada:** módulo completo, 20 slides em 10 páginas
- **Observação sobre o anexo:** o DOCX possui 10 páginas com 2 slides por página. O texto foi extraído visualmente dos prints, pois o arquivo não possui texto editável parseável.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\02 Module 02 - Power Domains.md
```

---

## Resumo executivo

Este módulo aprofunda o conceito de **power domain** em UPF, mas o verdadeiro foco da aula é entender **scope**, hierarquia lógica, definição correta de domínios e a relação entre **Power Domain (PD)** e **Voltage Area (VA)**.

A ideia principal é que um power domain não é apenas um retângulo colorido no layout. Em UPF, ele começa como um **objeto lógico** definido em um determinado **scope**. O scope determina onde o objeto existe, como ele é nomeado, quem “possui” o domínio e quais objetos UPF podem ser referenciados.

A aula cobre:

1. O que é **scope** em UPF.
2. Diferença entre **top-level scoped / parent-scoped** e **self-scoped / child-scoped**.
3. Como vários power domains podem coexistir no mesmo scope ou em scopes diferentes.
4. Como `set_scope`, `-scope` e `load_upf -scope` afetam a criação de domínios.
5. Regras de acesso a objetos UPF conforme o scope atual.
6. Diferença entre objetos globais e locais, especialmente quando a opção `-domain` é usada.
7. Quando usar self-scoped versus parent-scoped.
8. Como definir power domains em sub-blocos hierárquicos.
9. Boas práticas: definir power domains alinhados com fronteiras hierárquicas lógicas.
10. Problemas de estruturas **many-to-1**, isto é, quando um domínio agrupa elementos de diferentes partes da hierarquia.
11. Diferença entre **Power Domain** e **Voltage Area**.
12. Por que a correspondência 1:1 entre PD e VA é fortemente recomendada.
13. Como mapear estrutura RTL, power domains e voltage areas.
14. Casos especiais com IP sintetizado flat versus IP sintetizado separadamente.
15. Sibling elements em um domínio comum.
16. Disjoint voltage areas e seus riscos.
17. DRC em nets que cruzam voltage areas disjuntas.
18. Por que buffering precisa ser VA-aware nesses casos.

A mensagem central é: **Power Domain é conceito lógico; Voltage Area é conceito físico. Para implementação robusta, recomenda-se fortemente manter correspondência 1:1 entre o power domain e sua voltage area correspondente, com mesmo nome e mesmas células hierárquicas sempre que possível.**

---

## Slide 1 — What is Scope?

### Texto extraído

Título:

```text
What is Scope?
```

Pontos:

```text
Context in which power intent objects exist
Logic hierarchy level where a power domain is created is called the scope of that power domain
Defines which logical block "owns" a domain
```

Exemplo visual:

```tcl
set_scope /
```

```tcl
set_scope U1
```

Nota:

```text
set_scope / sets the scope at top-most level so it is recommended to use
set_scope $scope_level for avoiding issues in hierarchical integration
```

### Interpretação

Em UPF, **scope** é o contexto hierárquico onde um objeto de power intent existe. Ele funciona como uma espécie de “diretório atual” dentro da hierarquia lógica do design.

Se você está no topo:

```tcl
set_scope /
```

os objetos criados passam a existir no escopo top-level.

Se você entra em uma instância ou bloco:

```tcl
set_scope U1
```

os objetos criados passam a existir no contexto de `U1`.

### Por que scope importa?

Porque o scope define:

```text
quem possui o objeto UPF
como o objeto será nomeado
quais objetos podem ser referenciados
como o UPF se comportará em integração hierárquica
```

Exemplo:

```text
Domínio criado no topo:
PD1

Domínio criado dentro de U1:
U1/PD1
```

### Observação importante do slide

O slide recomenda evitar usar diretamente:

```tcl
set_scope /
```

em alguns contextos hierárquicos, preferindo algo como:

```tcl
set_scope $scope_level
```

Motivo: em integração hierárquica, o mesmo UPF pode ser carregado em diferentes níveis. Usar uma variável de scope torna o UPF mais reutilizável e evita problemas quando o bloco é integrado em outro top.

---

## Slide 2 — Top-Level Scope vs. Self-Scoped

### Texto extraído

Título:

```text
Top-Level Scope vs. Self-Scoped
```

Lado esquerdo:

```text
Top-Level Scoped
Also called "Scopeless" or "Parent-Scoped"
```

Descrição:

```text
Power domain created at top level scope
```

Comando:

```tcl
create_power_domain PD1 -elements U1
```

Resultado:

```text
Resulting power domain: PD1
```

Lado direito:

```text
Self-Scoped
Also called "Scoped" or "Child-Scoped"
```

Descrição:

```text
Power domain created at block level scope
```

Comando:

```tcl
create_power_domain PD1 -elements U1 -scope U1
```

Resultado:

```text
Resulting power domain: U1/PD1
```

### Interpretação

Este slide apresenta uma distinção fundamental.

## 1. Top-Level Scoped / Parent-Scoped

O domínio é criado no topo e aponta para o elemento `U1`.

```tcl
create_power_domain PD1 -elements U1
```

Resultado:

```text
PD1
```

Aqui, o domínio é “possuído” pelo topo. O domínio inclui a lógica de `U1`, mas o objeto `PD1` existe no escopo superior.

### Mentalidade

```text
O top cria um domínio chamado PD1 e coloca U1 dentro dele.
```

## 2. Self-Scoped / Child-Scoped

O domínio é criado no próprio escopo do bloco `U1`.

```tcl
create_power_domain PD1 -elements U1 -scope U1
```

Resultado:

```text
U1/PD1
```

A ideia é que o domínio pertence ao próprio bloco `U1`.

### Mentalidade

```text
U1 possui internamente seu próprio domínio PD1.
```

### Diferença prática

| Estilo | Nome resultante | Quem “possui” o domínio? |
|---|---|---|
| Top-level / Parent-scoped | `PD1` | Top |
| Self-scoped / Child-scoped | `U1/PD1` | U1 |

Essa diferença tem impacto forte em reuso de IP e integração hierárquica.

---

## Slide 3 — Multiple Scopes

### Texto extraído

Título:

```text
Multiple Scopes
```

Texto:

```text
Multiple domains can exist at the same scope or at different scopes
```

Power domains criados no top-level scope:

```tcl
create_power_domain PD1 -elements U1
create_power_domain PD2 -elements U2
```

Power domain criado em lower-level scope:

```tcl
create_power_domain PD3 -elements U3 -scope U3
```

Usando `set_scope` em vez de `-scope`:

```tcl
set_scope U3
create_power_domain PD3 -elements {.}
set_scope /
```

Figura:

```text
TOP
U1 → PD1
U2 → PD2
U3 → U3/PD3
```

### Interpretação

Vários domínios podem coexistir:

- no mesmo scope;
- em scopes diferentes.

No exemplo:

```tcl
create_power_domain PD1 -elements U1
create_power_domain PD2 -elements U2
```

`PD1` e `PD2` são criados no top-level scope.

Já:

```tcl
create_power_domain PD3 -elements U3 -scope U3
```

cria o domínio dentro do escopo de `U3`, resultando em:

```text
U3/PD3
```

### Equivalência entre `-scope` e `set_scope`

O slide também mostra que:

```tcl
create_power_domain PD3 -elements U3 -scope U3
```

pode ser escrito como:

```tcl
set_scope U3
create_power_domain PD3 -elements {.}
set_scope /
```

Dentro de `U3`, o elemento atual é representado por:

```text
.
```

Isto significa “o escopo atual”.

---

## Slide 4 — Scope of a Power Domain — Example 1

### Texto extraído

Título:

```text
Scope of a Power Domain — Example 1
```

Pontos:

```text
Power domain created at top level scope
```

Comando:

```tcl
create_power_domain PD_SW -elements pd_switchable
```

Resultado:

```text
Power domain created as PD_SW
```

Depois:

```text
Subsequently all UPF objects for power domain PD_SW will be created at top level
```

Exemplo:

```tcl
create_supply_port VDDL
```

Figura:

```text
PD_SW
pd_switchable
0.9V / OFF
VDDL
```

### Interpretação

Neste exemplo, o domínio `PD_SW` é criado no top-level scope.

```tcl
create_power_domain PD_SW -elements pd_switchable
```

Resultado:

```text
PD_SW
```

Embora o elemento do domínio seja `pd_switchable`, o objeto de domínio pertence ao topo.

Consequência:

```text
Objetos UPF associados a PD_SW serão criados no top-level.
```

Por isso, o supply port é criado simplesmente como:

```tcl
create_supply_port VDDL
```

sem precisar qualificar com `pd_switchable/`.

### Uso típico

Este estilo é mais compacto, mas exige cuidado com nomes e integração hierárquica.

---

## Slide 5 — Scope of a Power Domain — Example 2

### Texto extraído

Título:

```text
Scope of a Power Domain — Example 2
```

Pontos:

```text
Power domain created at lower-level scope
```

Comando:

```tcl
create_power_domain PD_SW \
  -elements pd_switchable \
  -scope pd_switchable
```

Resultado:

```text
Power domain created as pd_switchable/PD_SW
```

Depois:

```text
Subsequently, all UPF components for power domain PD_SW will be created at PD_SW level
```

Exemplo:

```tcl
create_supply_port VDDL \
  -domain pd_switchable/PD_SW
```

### Interpretação

Neste exemplo, o domínio é criado dentro do próprio bloco `pd_switchable`.

Resultado:

```text
pd_switchable/PD_SW
```

Agora, os objetos UPF associados ao domínio são criados em um contexto hierárquico mais baixo.

O comando de supply port precisa indicar o domínio qualificado:

```tcl
create_supply_port VDDL -domain pd_switchable/PD_SW
```

### Diferença em relação ao exemplo anterior

| Exemplo | Domínio resultante | Onde os objetos associados tendem a existir |
|---|---|---|
| Example 1 | `PD_SW` | Top-level |
| Example 2 | `pd_switchable/PD_SW` | Lower-level / dentro de `pd_switchable` |

### Ponto importante

O mesmo bloco físico/lógico pode estar no domínio, mas o nome e o ownership UPF mudam conforme o scope.

---

## Slide 6 — Accessing UPF Objects

### Texto extraído

Título:

```text
Accessing UPF Objects
```

Texto:

```text
In the context of UPF, the "scope" at which you execute a command determines what objects you can reference
```

Subitens:

```text
You can reference anything at or below your current scope
You cannot reference anything above your current scope
Analogous to Design Compiler's current_design command
```

Outro ponto:

```text
Some UPF objects are considered local or global, depending on whether the -domain option was used when they were defined
```

Subitens:

```text
Global scope - object available in all power domains defined in the current scope and below
Local scope - object only available in the scope of the power domain to which they were associated
Using the -domain option causes the object to have local scope
```

### Interpretação

Este slide explica regras de visibilidade.

### Regra 1 — Você enxerga para baixo, não para cima

Se você está em um scope, pode referenciar:

```text
objetos no scope atual
objetos abaixo dele
```

Mas não pode referenciar objetos acima.

Isso é análogo ao comando `current_design` do Design Compiler: quando você está em um design específico, o contexto determina o que pode ser acessado diretamente.

### Regra 2 — Objetos podem ser globais ou locais

Um objeto UPF pode ter escopo global ou local.

#### Objeto global

Disponível em todos os power domains definidos no escopo atual e abaixo.

#### Objeto local

Disponível apenas no escopo do domínio ao qual foi associado.

O slide destaca:

```text
Using the -domain option causes the object to have local scope
```

Ou seja, quando um objeto é criado com `-domain`, ele fica associado a um domínio específico e sua visibilidade fica mais restrita.

### Pegadinha

Um erro comum é criar um objeto em um scope e tentar referenciá-lo de outro onde ele não é visível. Isso pode gerar erros de UPF difíceis se o engenheiro não acompanha o scope atual.

---

## Slide 7 — How to Navigate Using Scope

### Texto extraído

Título:

```text
How to Navigate Using Scope
```

Texto:

```text
The following four examples all do the same thing
They create a power domain named "PD1" at hierarchy "U1"
Subsequently referenced as "U1/PD1"
```

Exemplo 1:

```tcl
set_scope U1
create_power_domain PD1
...
set_scope /
```

Exemplo 2:

```tcl
create_power_domain PD1 -elements U1 -scope U1
```

Exemplo 3:

```tcl
set_scope U1
load_upf u1.upf
...
set_scope /
```

Conteúdo de `u1.upf`:

```tcl
create_power_domain PD1
```

Exemplo 4:

```tcl
load_upf -scope U1 u1.upf
```

Conteúdo de `u1.upf`:

```tcl
create_power_domain PD1
```

### Interpretação

O slide mostra quatro formas equivalentes de criar:

```text
U1/PD1
```

Isto é, um domínio chamado `PD1` no escopo de `U1`.

### Forma 1 — Entrar no scope manualmente

```tcl
set_scope U1
create_power_domain PD1
set_scope /
```

### Forma 2 — Usar `-scope`

```tcl
create_power_domain PD1 -elements U1 -scope U1
```

### Forma 3 — Entrar no scope e carregar UPF local

```tcl
set_scope U1
load_upf u1.upf
set_scope /
```

com `u1.upf` contendo:

```tcl
create_power_domain PD1
```

### Forma 4 — Carregar UPF diretamente em scope específico

```tcl
load_upf -scope U1 u1.upf
```

### Ponto prático

A forma 4 é muito útil em integração hierárquica, porque permite carregar o UPF de um IP/bloco no scope correto sem editar o arquivo original.

---

## Slide 8 — Parent-Scoped vs. Self-Scoped: Which is Appropriate?

### Texto extraído

Título:

```text
Parent-Scoped vs. Self-Scoped: Which is Appropriate?
```

Self-Scoped:

```text
More mature, well-known flow
Well suited for multiply-instantiated modules and hierarchical implementation style
Avoids name space conflicts between domains
```

Parent-Scoped:

```text
More compact UPF
Name space conflicts must be avoided by user
```

Mistura:

```text
Parent-Scoped and Self-Scoped UPF can be mixed, but recommend using only one methodology, if possible
```

### Interpretação

Este slide é uma orientação de metodologia.

## Self-scoped

Vantagens:

- fluxo mais maduro;
- mais conhecido;
- bom para módulos instanciados várias vezes;
- bom para implementação hierárquica;
- evita conflitos de namespace.

### Por que evita conflito?

Se duas instâncias usam o mesmo UPF interno, cada uma pode criar seu domínio local:

```text
U1/PD1
U2/PD1
```

Os nomes são qualificados pelo scope.

## Parent-scoped

Vantagem:

```text
UPF mais compacto
```

Mas o usuário precisa gerenciar conflitos de nomes. Como os domínios existem no parent scope, dois domínios chamados `PD1` podem colidir se não forem cuidadosamente nomeados.

## Misturar metodologias

É possível misturar self-scoped e parent-scoped, mas o slide recomenda usar uma só metodologia quando possível. Isso reduz confusão e problemas de integração.

### Regra prática

```text
Para IP reutilizável e hierarquia: prefira self-scoped.
Para UPF pequeno/controlado no top: parent-scoped pode ser mais compacto.
```

---

## Slide 9 — Defining Power Domains

### Texto extraído

Título:

```text
Defining Power Domains
```

Pontos:

```text
Power domains can be defined on hierarchical sub blocks:
```

Subitens:

```text
Each hierarchical cell can belong to only one power domain
If undefined, power domain is inherited from parent
A leaf cell inherits its power domain from its parent
Nested power domains are allowed
```

Figura:

Hierarquia:

```text
TOP
A
B
C
D
E
Leaf
```

Exemplo de comandos:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements {B}
create_power_domain PD2 -elements {A/C A/D}
```

### Interpretação

Este slide define regras fundamentais.

### Regra 1 — Cada célula hierárquica pertence a apenas um power domain

Uma instância não pode estar simultaneamente em dois domínios diferentes.

### Regra 2 — Se não definido, herda do pai

Se um sub-bloco não foi explicitamente colocado em um domínio, ele herda o domínio do parent.

Exemplo:

```text
TOP pertence a PDTOP
A não foi colocado em outro domínio
então A herda PDTOP
```

### Regra 3 — Leaf cell herda do pai

Células folha herdam o domínio do bloco onde estão inseridas, salvo se a hierarquia acima define outro domínio.

### Regra 4 — Domínios aninhados são permitidos

Você pode ter um domínio dentro de outro.

Exemplo do slide:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements {B}
create_power_domain PD2 -elements {A/C A/D}
```

Aqui:

- `PDTOP` cobre o padrão/top;
- `PD1` cobre `B`;
- `PD2` cobre `A/C` e `A/D`.

### Pegadinha

Embora nested domains sejam permitidos, domínios que cortam a hierarquia de forma irregular podem complicar boundary strategies e implementação.

---

## Slide 10 — Defining Power Domains — Examples

### Texto extraído

Título:

```text
Defining Power Domains — Examples
```

Ponto principal:

```text
Defining power domains on logical hierarchical boundaries is ideal
```

Exemplo esquerdo:

```text
Define PD each on A and B: (1-to-1)
Golden. Best Practice!
```

Comandos:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements {A}
create_power_domain PD2 -elements {B}
```

Exemplo central:

```text
Define PD for both A and B: (many-to-1)
This has caveats
```

Comandos:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements {A B}
```

Exemplo direito:

```text
Define PD on B and A/D: (many-to-1)
Cannot use if B is synthesized separately
```

Comandos:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements {B A/D}
```

### Interpretação

O slide apresenta três formas de definir power domains.

## 1. Melhor prática: 1-to-1

```tcl
create_power_domain PD1 -elements {A}
create_power_domain PD2 -elements {B}
```

Cada power domain corresponde a um bloco hierárquico lógico claro.

```text
PD1 ↔ A
PD2 ↔ B
```

O slide chama isso de:

```text
Golden. Best Practice!
```

## 2. Many-to-1 entre A e B

```tcl
create_power_domain PD1 -elements {A B}
```

Aqui, um único domínio cobre dois blocos irmãos. Isso pode funcionar, mas tem caveats.

Problema: interfaces e boundaries de A e B podem ser tratadas separadamente pela ferramenta.

## 3. Many-to-1 entre B e A/D

```tcl
create_power_domain PD1 -elements {B A/D}
```

Esse caso é ainda mais delicado, porque mistura um bloco inteiro `B` com um sub-bloco interno `A/D`.

O slide alerta:

```text
Cannot use if B is synthesized separately
```

Motivo: se `B` é sintetizado separadamente, ele não pode ser facilmente agrupado em um domínio que também inclui um pedaço interno de outro bloco no mesmo nível de implementação hierárquica.

---

## Slide 11 — Power Domain Definitions on Hierarchical Blocks — Many-to-1 Design Structure

### Texto extraído

Título:

```text
Power Domain Definitions on Hierarchical Blocks
```

Subtítulo:

```text
Many-to-1 Design Structure
```

Pontos:

```text
Defining boundary strategies can be problematic
```

Subitens:

```text
Implementation tools see sub designs as not having shared interfaces
Interface of every block in the element list is handled as a separate interface
```

Figura:

```text
TOP
PD1 cobrindo dois blocos
```

### Interpretação

Este slide explica por que many-to-1 pode ser problemático.

Quando um domínio inclui vários blocos separados:

```tcl
create_power_domain PD1 -elements {A B}
```

a ferramenta de implementação pode enxergar `A` e `B` como subdesigns separados, cada um com sua própria interface.

Mesmo que o usuário pense:

```text
A e B fazem parte do mesmo domínio PD1
```

a ferramenta pode tratar as interfaces de cada bloco no element list separadamente.

Isso complica estratégias de fronteira, como:

- isolation;
- level shifting;
- always-on feedthrough;
- interface cells.

### Ponto prático

Many-to-1 pode funcionar em alguns casos, mas você precisa entender como a ferramenta tratará cada interface. Para fluxo robusto, prefira power domains alinhados com blocos hierárquicos claros.

---

## Slide 12 — Power Domain Definitions on Hierarchical Blocks — Many-to-1 Domain Structure

### Texto extraído

Título:

```text
Power Domain Definitions on Hierarchical Blocks
```

Subtítulo:

```text
Many-to-1 Domain Structure
```

Exemplo 1 — não fazer:

```tcl
create_power_domain PD1 -elements { A A/D }
```

Pergunta:

```text
What about A/C?
```

Recomendado:

```tcl
create_power_domain PD1 -elements {A}
create_power_domain PD2 -elements {A/C}
```

Exemplo 2 — não fazer:

```tcl
create_power_domain PD1 -elements { B B/E/G }
```

Pergunta:

```text
Where does B/E belong?
```

Recomendado:

```tcl
create_power_domain PD1 -elements {B}
create_power_domain PD2 -elements {B/F}
```

### Interpretação

Este slide mostra problemas de definições ambíguas.

## Exemplo 1

Não faça:

```tcl
create_power_domain PD1 -elements { A A/D }
```

Por quê?

Se `A` está em `PD1`, seus filhos herdam `PD1`, inclusive:

```text
A/C
A/D
```

Mas ao listar `A/D` explicitamente junto com `A`, você cria ambiguidade:

```text
A/D está no mesmo domínio do pai?
A/C fica onde?
```

O slide pergunta:

```text
What about A/C?
```

A recomendação é separar:

```tcl
create_power_domain PD1 -elements {A}
create_power_domain PD2 -elements {A/C}
```

Ou seja, coloque o bloco pai em um domínio e crie domínio separado para o filho que precisa ser diferente.

## Exemplo 2

Não faça:

```tcl
create_power_domain PD1 -elements { B B/E/G }
```

Pergunta:

```text
Where does B/E belong?
```

Se `B` está em `PD1`, seus filhos herdam `PD1`, incluindo `B/E`. Mas `B/E/G` foi destacado, gerando ambiguidade de herança.

A recomendação é definir domínios em blocos que respeitem a hierarquia:

```tcl
create_power_domain PD1 -elements {B}
create_power_domain PD2 -elements {B/F}
```

### Regra prática

```text
Não misture um bloco pai e um descendente do mesmo bloco no mesmo element list de maneira ambígua.
```

---

## Slide 13 — Implementing Power Domains

### Texto extraído

Título:

```text
Implementing Power Domains
```

Pontos:

```text
Power Domain (PD) is a virtual concept
  Parts of a design sharing common power behavior
```

```text
Voltage Area (VA) is a physical object
  Physical representation of a PD
  Specific coordinates defining the boundary where elements of a given PD are located
```

```text
For implementation, each PD must correspond to a VA, and vice versa
```

```text
Strongly recommend that PD and its corresponding VA have:
  1:1 relationship
  Same name
  Same hierarchical cells
```

Comando:

```tcl
create_voltage_area *
```

Nota:

```text
* Synopsys command (non-UPF)
```

Figura:

```text
Power domain:
PD1, PDTOP, PD2

Voltage area:
DEFAULT_VA (PDTOP)
VA1 (PD1)
VA2 (PD2)
```

### Interpretação

Este é um dos slides mais importantes do módulo.

## Power Domain é virtual/lógico

Um power domain é uma partição lógica:

```text
quais elementos compartilham comportamento de potência
```

Ele existe no UPF.

## Voltage Area é física

Voltage area é um objeto físico no layout:

```text
região com coordenadas onde os elementos daquele PD serão colocados
```

Ela existe na implementação física.

## Relação PD ↔ VA

Para implementação, cada power domain deve corresponder a uma voltage area, e cada voltage area deve corresponder a um power domain.

O slide recomenda fortemente:

```text
1:1 relationship
same name
same hierarchical cells
```

Exemplo:

```text
PD1 ↔ VA1
PD2 ↔ VA2
PDTOP ↔ DEFAULT_VA
```

### Comando

```tcl
create_voltage_area *
```

O asterisco no slide indica que é um comando Synopsys, não um comando UPF padronizado.

### Ponto-chave

```text
PD é lógico.
VA é físico.
Mas para implementação robusta, eles devem se corresponder claramente.
```

---

## Slide 14 — Voltage Area Mapping

### Texto extraído

Título:

```text
Voltage Area Mapping
```

Subtítulo:

```text
RTL vs. Power Domains vs. Voltage Area
```

Lado esquerdo:

```text
RTL Hierarchical Structure
(color coded by power domain structure)
```

Blocos:

```text
ChipTop
MemX & MemY
PwrCtrl
Inst Decode
GPRS
Multiplier
GENPP
```

Lado direito:

```text
Power Domains and Voltage Areas
```

Regiões:

```text
ChipTop
MemX & MemY Hier
MemY
MemY
Inst Decode
GPRS
Multiplier
GENPP
PwrCtrl
```

### Interpretação

Este slide mostra que a hierarquia RTL e a organização física de voltage areas não precisam parecer iguais visualmente.

Na hierarquia lógica, os blocos aparecem como uma árvore:

```text
ChipTop
 ├─ MemX & MemY
 ├─ PwrCtrl
 ├─ Inst Decode
 ├─ GPRS
 └─ Multiplier
      └─ GENPP
```

Na visão física, esses blocos viram regiões no layout. Um mesmo agrupamento lógico pode ser colocado em uma área física com formato e posição diferentes.

O objetivo do mapeamento é garantir que:

```text
elementos do mesmo power domain sejam colocados dentro da voltage area correta
```

### Observação

Esse slide reforça a diferença:

```text
RTL hierarchy = organização lógica
Voltage area = organização física
```

---

## Slide 15 — Voltage Area Mapping — repetição visual

### Texto extraído

A página repete a figura de:

```text
RTL vs. Power Domains vs. Voltage Area
```

com as mesmas regiões:

```text
ChipTop
MemX & MemY Hier
Inst Decode
GPRS
Multiplier
GENPP
PwrCtrl
```

### Interpretação

A repetição reforça o mapa mental:

- o RTL mostra hierarquia;
- os power domains colorem a hierarquia por comportamento de potência;
- as voltage areas implementam essa intenção no layout.

Nem sempre uma voltage area precisa ser um retângulo simples associado a um módulo diretamente visível no RTL. Mas, quanto mais alinhada for a relação PD/VA/hierarquia, mais robusto será o fluxo.

---

## Slide 16 — Defining PD's and VA's on Hierarchical Blocks — Example 1

### Texto extraído

Título:

```text
Defining PD's and VA's on Hierarchical Blocks
```

Subtítulo:

```text
Example 1: IP Synthesized as Part of Flat Design
```

Figura lógica:

```text
TOP
A
B
IP module
  C
  D
```

Figura física:

```text
PDTOP (DEFAULT_VA) 1.2V
A
B
C
PD1 5V
D
```

Nota:

```text
In a flat flow, C can belong to the PDTOP power domain
```

UPF:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements D
```

### Interpretação

Neste exemplo, o IP é sintetizado como parte de um design flat. Isso permite que elementos dentro do IP sejam tratados de forma mais flexível no top.

A figura mostra:

- `C` dentro do IP, mas pertencendo ao domínio `PDTOP`;
- `D` pertencendo a `PD1`.

Como o fluxo é flat, a ferramenta pode enxergar `C` e `D` no contexto do top e permitir que `C` pertença ao domínio top-level.

### Comandos

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements D
```

### Ponto importante

Em fluxo flat, é mais fácil misturar elementos internos do IP com domínios do top, porque tudo é sintetizado junto.

---

## Slide 17 — Defining PD's and VA's on Hierarchical Blocks — Example 2

### Texto extraído

Título:

```text
Defining PD's and VA's on Hierarchical Blocks
```

Subtítulo:

```text
Example 2: IP Module Synthesized Separately
```

Figura lógica:

```text
TOP
A
B
IP module
  C
  D
```

Figura física:

```text
PDTOP (DEFAULT_VA) 1.2V
A
B
IP: PDTOP
  C
  D/PD1 5V
```

UPF top:

```tcl
top.upf:
create_power_domain PDTOP
```

UPF IP:

```tcl
ip.upf:
create_power_domain PDTOP
create_power_domain PD1 -elements D -scope D
```

### Interpretação

Neste exemplo, o IP é sintetizado separadamente. Agora o IP precisa ter seu próprio contexto de power domains.

O top define:

```tcl
create_power_domain PDTOP
```

O IP também define seu próprio `PDTOP` e um domínio `PD1` para `D`:

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements D -scope D
```

### Diferença em relação ao exemplo 1

No fluxo flat, o top podia tratar `C` diretamente como parte de `PDTOP`.

No fluxo hierárquico separado, o IP possui seu próprio domínio top interno. Isso mantém o IP autocontido e facilita integração.

### Ponto prático

Para IP reutilizável/sintetizado separadamente, self-scoped e UPF modular tendem a ser mais seguros.

---

## Slide 18 — Defining PD's and VA's on Hierarchical Blocks — Example 3

### Texto extraído

Título:

```text
Defining PD's and VA's on Hierarchical Blocks
```

Subtítulo:

```text
Example 3: Sibling Elements in a Common Power Domain
```

Pontos:

```text
In a flat flow, A, C, D, and X/B can belong to one power domain
```

Nota:

```text
NOTE: Nets that connect between A and B logically traverse Default domain
```

Outro ponto:

```text
In a hierarchical flow, [A,B] cannot be a partition, because B belongs to a separate hierarchy
```

UPF:

```tcl
create_power_domain PDTOP
create_power_domain PD1 \
  -elements {A X/B}
```

Figura lógica:

```text
1.2V
X 1.2V
Y 1.2V
A 0.9V
B 0.9V
C 0.9V
D 0.9V
```

Figura física:

```text
PDTOP (DEFAULT_VA) 1.2V
PD1 0.9V
B
A
```

### Interpretação

Este é um caso avançado: elementos irmãos ou elementos em hierarquias diferentes podem pertencer ao mesmo domínio em fluxo flat.

No exemplo:

```text
A e X/B podem pertencer ao mesmo PD1
```

Comando:

```tcl
create_power_domain PD1 -elements {A X/B}
```

Mas há uma observação crítica:

```text
Nets que conectam A e B atravessam logicamente o domínio Default.
```

Isso significa que, embora fisicamente A e B possam estar juntos em uma voltage area, logicamente a conexão atravessa hierarquia/domínio default.

### Em fluxo hierárquico

O slide alerta:

```text
[A,B] cannot be a partition, because B belongs to a separate hierarchy
```

Se `B` pertence a uma hierarquia separada, não é simples criar uma partição comum com `A` em fluxo hierárquico.

### Conclusão

Esse tipo de estrutura pode ser possível em flat flow, mas fica difícil ou proibido em fluxo hierárquico.

---

## Slide 19 — What Happens if I Don't Have 1:1 Correspondence Between PD and VA?

### Texto extraído

Título:

```text
What Happens if I Don't Have 1:1 Correspondence Between PD and VA?
```

Pontos:

```text
It is possible to define a VA boundary that does not correspond to the power domain boundary
```

Subitens:

```text
Useful when logical block needs to be physically spread across the design
Referred to as a disjoint voltage area
```

Outro ponto:

```text
Single PD separated into multiple VA's allows more flexibility in floorplanning
```

Subitem:

```text
However, signals interconnecting the disjoint VA regions must be handled properly
```

Outro ponto:

```text
Placement QoR in disjoint VA flows can be very challenging
```

Figura:

```text
DEFAULT_VA (PDTOP)
VA1 (PD1)
VA2 (PD2)
VA1 (PD1)
```

Nota visual:

```text
Voltage Area VA1 is Disjoint
```

### Interpretação

Embora a recomendação seja PD↔VA 1:1, é possível criar uma voltage area que não corresponde diretamente à fronteira do power domain.

Um caso é a **disjoint voltage area**:

```text
um mesmo power domain separado em múltiplas regiões físicas
```

Exemplo:

```text
PD1 aparece em VA1 à esquerda e VA1 à direita,
separadas por VA2.
```

### Por que alguém faria isso?

Para espalhar fisicamente um bloco lógico pelo design, por exemplo por razões de floorplanning ou proximidade com outras macros.

### Problema

Sinais que conectam as regiões disjuntas precisam atravessar outras áreas. Isso exige tratamento correto de:

- roteamento;
- buffering;
- DRC;
- supplies;
- domínio atravessado;
- regras de voltage area.

O slide alerta que:

```text
Placement QoR in disjoint VA flows can be very challenging
```

Ou seja, pode dificultar muito placement e convergência.

---

## Slide 20 — DRC on Nets Crossing Disjoint VAs

### Texto extraído

Título:

```text
DRC on Nets Crossing Disjoint VAs
```

Ponto 1:

```text
Nets in the same power domain that traverse default VA require special handling
```

Figura:

```text
Power Domain View (logical)
Voltage Area View (physical)
DRC violations may arise
```

Ponto 2:

```text
Problem could also occur on a feedthrough net crossing a non-default VA
```

Figura:

```text
Power Domain View (logical)
Voltage Area View (physical)
DRC violations may arise
```

Ponto final:

```text
Buffering in these cases must be VA aware
```

### Interpretação

Este slide mostra a consequência prática de voltage areas disjuntas.

## Caso 1 — Nets do mesmo PD atravessando default VA

Na visão lógica, a net pertence ao mesmo power domain. Mas na visão física, ela cruza uma região default ou outro tipo de VA.

Isso pode gerar DRC violations, porque a ferramenta precisa respeitar regras de alimentação, placement, buffers e células permitidas em cada voltage area.

## Caso 2 — Feedthrough net cruzando non-default VA

Uma net pode atravessar uma voltage area que não pertence ao seu domínio. Mesmo que a net apenas “passe por dentro”, ela pode exigir tratamento especial.

## Buffering VA-aware

O slide conclui:

```text
Buffering in these cases must be VA aware
```

Isso significa que a ferramenta não pode inserir buffers aleatoriamente. Ela precisa saber em qual voltage area o buffer está sendo colocado e se a célula é compatível com a supply daquela região.

### Exemplo conceitual

Se uma net de `PD_A` cruza uma região de `PD_B`, um buffer inserido no meio não pode simplesmente ser uma célula alimentada por `PD_B`, a menos que a estratégia permita e a interface seja tratada corretamente.

---

## Aula didática desenvolvida

### 1. Scope é o “current directory” do UPF

Uma boa analogia é pensar em scope como o diretório atual em um terminal.

Se você está no topo:

```tcl
set_scope /
```

cria objetos no topo.

Se você entra em `U1`:

```tcl
set_scope U1
```

cria objetos dentro de `U1`.

Isso afeta o nome completo:

```text
PD1       → domínio no topo
U1/PD1    → domínio dentro de U1
```

### 2. O scope define ownership

O slide usa a frase:

```text
Defines which logical block "owns" a domain
```

Isso é muito importante. Um domínio pode cobrir um bloco, mas ser “possuído” pelo top, ou pode ser criado dentro do próprio bloco.

Essa diferença afeta:

- reutilização de IP;
- integração hierárquica;
- conflitos de nome;
- visibilidade de objetos;
- scripts UPF modulares.

### 3. Parent-scoped é compacto, mas exige disciplina

Em parent-scoped, o top cria os domínios para os filhos.

Exemplo:

```tcl
create_power_domain PD1 -elements U1
```

Vantagem:

```text
UPF compacto
```

Desvantagem:

```text
o usuário precisa evitar conflitos de namespace
```

### 4. Self-scoped é mais robusto para hierarquia e IP

Em self-scoped:

```text
U1/PD1
U2/PD1
```

O mesmo nome local `PD1` pode existir em várias instâncias sem conflito, pois cada um está dentro do seu scope.

Isso é excelente para:

- IP reutilizável;
- módulos multi-instanciados;
- implementação hierárquica;
- UPF entregue junto com bloco.

### 5. Não misture metodologias sem necessidade

O slide diz que parent-scoped e self-scoped podem ser misturados, mas recomenda usar apenas uma metodologia se possível.

Motivo:

```text
misturar aumenta confusão de nome, visibilidade e integração
```

### 6. Cada célula hierárquica pertence a um único domínio

Essa regra é fundamental:

```text
Each hierarchical cell can belong to only one power domain
```

Se um elemento não é definido explicitamente, ele herda o domínio do pai.

Então, ao definir domains, pense sempre em uma árvore de herança.

### 7. Domínios em fronteiras hierárquicas são a melhor prática

O slide 10 chama a definição 1-to-1 em A e B de:

```text
Golden. Best Practice!
```

Isso acontece porque:

- boundaries são claras;
- interfaces são claras;
- implementação é previsível;
- síntese separada é possível;
- mapeamento para VA é mais simples;
- estratégias de interface são mais controláveis.

### 8. Many-to-1 funciona, mas tem caveats

Quando um domínio cobre múltiplos blocos:

```tcl
create_power_domain PD1 -elements {A B}
```

a ferramenta pode tratar as interfaces de cada bloco separadamente. Isso pode complicar isolation, level shifting e boundary strategies.

O risco aumenta quando o domínio mistura:

```text
um bloco inteiro + descendente interno de outro bloco
```

### 9. PD não é VA

Este é o ponto mais importante da segunda metade da aula.

```text
Power Domain = conceito lógico/virtual
Voltage Area = objeto físico
```

Power domain diz:

```text
quem tem o mesmo comportamento de potência
```

Voltage area diz:

```text
onde fisicamente essas células serão colocadas
```

### 10. Correspondência 1:1 entre PD e VA é fortemente recomendada

O slide recomenda:

```text
1:1 relationship
same name
same hierarchical cells
```

Isso reduz ambiguidade.

Exemplo saudável:

```text
PD1 ↔ VA1
PD2 ↔ VA2
PDTOP ↔ DEFAULT_VA
```

### 11. Disjoint VA é possível, mas perigoso

Uma disjoint voltage area ocorre quando um mesmo PD é separado em múltiplas regiões físicas.

Isso dá flexibilidade de floorplan, mas cria problemas:

- nets atravessando default VA;
- feedthrough em non-default VA;
- buffering precisa ser VA-aware;
- DRC pode surgir;
- placement QoR fica desafiador.

### 12. Buffering precisa conhecer a VA

Quando uma net cruza regiões de tensão diferentes ou voltage areas disjuntas, a ferramenta não pode inserir buffer de qualquer jeito.

O buffer precisa estar em uma região compatível com sua alimentação.

Isso conecta power intent com implementação física.

---

## Conceitos difíceis explicados em profundidade

### Scope

Contexto hierárquico onde objetos UPF são criados e referenciados.

---

### Top-level scoped / parent-scoped

Domínio criado no escopo do pai/top, apontando para elementos filhos.

Exemplo:

```tcl
create_power_domain PD1 -elements U1
```

Domínio resultante:

```text
PD1
```

---

### Self-scoped / child-scoped

Domínio criado dentro do próprio bloco.

Exemplo:

```tcl
create_power_domain PD1 -elements U1 -scope U1
```

Domínio resultante:

```text
U1/PD1
```

---

### `set_scope`

Comando para mudar o scope atual do UPF.

Exemplo:

```tcl
set_scope U1
```

---

### `load_upf -scope`

Carrega um arquivo UPF em um scope específico sem precisar editar o arquivo.

Exemplo:

```tcl
load_upf -scope U1 u1.upf
```

---

### Objeto global

Objeto UPF disponível nos power domains definidos no scope atual e abaixo.

---

### Objeto local

Objeto UPF associado a um domínio específico, geralmente por uso de `-domain`.

---

### Power domain inheritance

Se um elemento não é explicitamente colocado em um domínio, ele herda o domínio do pai.

---

### Nested power domain

Domínio definido dentro de outro domínio, permitindo uma hierarquia de power behavior.

---

### Voltage Area

Objeto físico que representa a região onde células de um power domain são colocadas.

---

### `create_voltage_area`

Comando Synopsys, não-UPF, usado para criar uma voltage area física.

---

### Default VA

Voltage area padrão associada ao domínio top/default.

---

### Disjoint voltage area

Caso em que um mesmo power domain é implementado em múltiplas regiões físicas separadas.

---

### VA-aware buffering

Inserção de buffers levando em conta a voltage area, supply e domínio físico onde o buffer será colocado.

---

## Comandos citados no módulo

### Scope

```tcl
set_scope /
set_scope U1
set_scope $scope_level
```

### Power domains

```tcl
create_power_domain PD1 -elements U1
create_power_domain PD1 -elements U1 -scope U1
create_power_domain PD3 -elements U3 -scope U3
create_power_domain PD3 -elements {.}
```

### Load UPF em scope

```tcl
load_upf u1.upf
load_upf -scope U1 u1.upf
```

### Exemplos de domínios

```tcl
create_power_domain PDTOP
create_power_domain PD1 -elements {B}
create_power_domain PD2 -elements {A/C A/D}
```

```tcl
create_power_domain PD_SW -elements pd_switchable
```

```tcl
create_power_domain PD_SW \
  -elements pd_switchable \
  -scope pd_switchable
```

### Supply port com domínio

```tcl
create_supply_port VDDL
create_supply_port VDDL -domain pd_switchable/PD_SW
```

### Voltage area

```tcl
create_voltage_area *
```

---

## Tabela — Parent-scoped vs Self-scoped

| Critério | Parent-scoped / Top-level | Self-scoped / Child-scoped |
|---|---|---|
| Nome resultante | `PD1` | `U1/PD1` |
| Domínio criado em | Scope do pai/top | Scope do próprio bloco |
| UPF | Mais compacto | Mais modular |
| Reuso de IP | Menos robusto | Mais robusto |
| Múltiplas instâncias | Pode ter conflitos | Evita conflitos |
| Hierarchical implementation | Exige cuidado | Bem adequado |
| Recomendação do slide | útil, mas usuário evita conflitos | fluxo mais maduro e conhecido |

---

## Tabela — PD vs VA

| Conceito | Tipo | Função |
|---|---|---|
| Power Domain | Lógico / virtual | Agrupa partes do design com comportamento comum de potência |
| Voltage Area | Físico | Define região física onde elementos de um PD são colocados |
| `create_power_domain` | UPF | Cria domínio lógico |
| `create_voltage_area` | Synopsys non-UPF | Cria área física |
| Recomendação | Metodologia | PD e VA devem ter relação 1:1, mesmo nome e mesmas células hierárquicas |

---

## Tabela — Boas práticas e alertas

| Situação | Recomendação |
|---|---|
| Power domain alinhado a bloco hierárquico | Melhor prática |
| Cada bloco A e B em seu próprio PD | Golden / best practice |
| Um PD cobrindo A e B | Possível, mas com caveats |
| Um PD cobrindo B e A/D | Não usar se B for sintetizado separadamente |
| Listar pai e descendente de forma ambígua | Evitar |
| IP sintetizado flat | Pode permitir domínio mais flexível no top |
| IP sintetizado separadamente | Usar UPF/modularidade própria do IP |
| PD e VA sem 1:1 | Possível, mas complexo |
| Disjoint VA | Pode ajudar floorplan, mas dificulta QoR/DRC |
| Nets cruzando VAs disjuntas | Exigem tratamento especial |
| Buffering nesses casos | Deve ser VA-aware |

---

## Fluxo mental para definir power domains

```text
1. Identificar a hierarquia lógica do design.
2. Decidir quais blocos têm comportamento de potência próprio.
3. Preferir domínios alinhados com fronteiras hierárquicas claras.
4. Decidir metodologia: parent-scoped ou self-scoped.
5. Criar domínio top/default.
6. Criar domínios específicos para blocos que mudam tensão ou desligam.
7. Verificar herança de domínios para elementos não explicitamente definidos.
8. Evitar misturar pai e descendente de forma ambígua no mesmo element list.
9. Planejar a correspondência PD ↔ VA.
10. Criar voltage areas com relação 1:1 sempre que possível.
11. Evitar disjoint VAs, salvo necessidade real de floorplan.
12. Se usar disjoint VAs, garantir que routing/buffering seja VA-aware.
```

---

## Figuras e diagramas importantes

### Página 1 — What is Scope?

Mostra `TOP` contendo `U1`, com `set_scope /` apontando para o topo e `set_scope U1` apontando para o bloco interno. É a figura base para entender ownership do domínio.

---

### Página 1 — Top-Level Scope vs Self-Scoped

Compara `PD1` criado no top com `U1/PD1` criado dentro de `U1`. Essa figura é essencial para questões sobre nomenclatura e hierarquia.

---

### Página 2 — Multiple Scopes

Mostra `PD1`, `PD2` no top e `U3/PD3` em lower-level scope. Também compara `-scope` com `set_scope`.

---

### Página 2 — Scope of a Power Domain — Example 1

Mostra `PD_SW` criado no top-level scope para o bloco `pd_switchable`.

---

### Página 3 — Scope of a Power Domain — Example 2

Mostra `PD_SW` criado no lower-level scope, resultando em `pd_switchable/PD_SW`.

---

### Página 3 — Accessing UPF Objects

Resume regras de visibilidade: pode referenciar objetos no scope atual ou abaixo, mas não acima.

---

### Página 4 — How to Navigate Using Scope

Mostra quatro formas equivalentes de criar `U1/PD1`.

---

### Página 4 — Parent-Scoped vs Self-Scoped

Lista vantagens de cada metodologia e recomenda evitar mistura quando possível.

---

### Página 5 — Defining Power Domains

Mostra a árvore lógica TOP/A/B/C/D/E e exemplos de domínios aninhados.

---

### Página 5 — Defining Power Domains — Examples

Mostra três casos: 1-to-1 ideal, many-to-1 com caveats e many-to-1 não adequado para síntese separada.

---

### Página 6 — Many-to-1 Design Structure

Mostra que interfaces de cada bloco no element list são tratadas separadamente pela implementação.

---

### Página 6 — Many-to-1 Domain Structure

Mostra exemplos proibidos/ruins misturando pai e descendente, com perguntas como “What about A/C?” e “Where does B/E belong?”.

---

### Página 7 — Implementing Power Domains

Mostra a correspondência entre power domain lógico e voltage area física, com recomendação 1:1.

---

### Páginas 7 e 8 — Voltage Area Mapping

Mostram a diferença entre árvore RTL e disposição física dos power domains/voltage areas.

---

### Página 8 — Example 1: IP Synthesized as Part of Flat Design

Mostra que, em fluxo flat, um elemento interno como `C` pode pertencer ao domínio `PDTOP`.

---

### Página 9 — Example 2: IP Module Synthesized Separately

Mostra que, quando IP é sintetizado separadamente, ele possui seu próprio contexto UPF.

---

### Página 9 — Example 3: Sibling Elements in a Common Power Domain

Mostra que elementos irmãos podem pertencer a um domínio comum em fluxo flat, mas isso não se traduz diretamente em fluxo hierárquico.

---

### Página 10 — Disjoint Voltage Area

Mostra um mesmo `VA1 (PD1)` dividido em duas regiões separadas. A figura alerta que isso torna QoR de placement desafiador.

---

### Página 10 — DRC on Nets Crossing Disjoint VAs

Mostra nets que atravessam default VA ou non-default VA e podem gerar DRC violations. A mensagem final é que buffering precisa ser VA-aware.

---

## Pontos de prova e revisão

1. Scope é o contexto no qual objetos de power intent existem.
2. O nível de hierarquia lógica onde um power domain é criado é o scope desse domínio.
3. Scope define qual bloco lógico “possui” um domínio.
4. `set_scope /` coloca o scope no nível top.
5. `set_scope U1` coloca o scope no bloco `U1`.
6. Para integração hierárquica, recomenda-se usar `set_scope $scope_level`.
7. Top-level scoped também é chamado scopeless ou parent-scoped.
8. Self-scoped também é chamado scoped ou child-scoped.
9. Em parent-scoped, `create_power_domain PD1 -elements U1` cria `PD1`.
10. Em self-scoped, o domínio pode ser criado como `U1/PD1`.
11. Múltiplos domínios podem existir no mesmo scope.
12. Múltiplos domínios podem existir em scopes diferentes.
13. `-scope` em `create_power_domain` permite criar domínio em lower-level scope.
14. `set_scope` pode ser usado em vez de `-scope`.
15. Dentro do scope atual, `{.}` representa o escopo atual.
16. No Example 1, `PD_SW` é criado no top-level scope.
17. No Example 2, `PD_SW` é criado como `pd_switchable/PD_SW`.
18. O scope atual determina quais objetos podem ser referenciados.
19. Você pode referenciar objetos no scope atual ou abaixo.
20. Você não pode referenciar objetos acima do scope atual.
21. A regra de scope é análoga ao `current_design` do Design Compiler.
22. Objetos UPF podem ser globais ou locais.
23. Usar `-domain` faz o objeto ter local scope.
24. `load_upf -scope U1 u1.upf` carrega o UPF no scope de U1.
25. Quatro formas diferentes podem criar o mesmo domínio `U1/PD1`.
26. Self-scoped é mais maduro e bem conhecido.
27. Self-scoped é adequado para módulos multi-instanciados.
28. Self-scoped evita conflitos de namespace.
29. Parent-scoped gera UPF mais compacto.
30. Parent-scoped exige que o usuário evite conflitos de nomes.
31. Parent-scoped e self-scoped podem ser misturados.
32. Recomenda-se usar apenas uma metodologia quando possível.
33. Power domains podem ser definidos em sub-blocos hierárquicos.
34. Cada célula hierárquica pode pertencer a apenas um power domain.
35. Se não definido, o power domain é herdado do parent.
36. Leaf cell herda power domain do parent.
37. Nested power domains são permitidos.
38. Definir power domains em fronteiras hierárquicas lógicas é ideal.
39. Definir um PD para A e outro para B é best practice.
40. Definir um PD para A e B juntos é many-to-1 e tem caveats.
41. Definir PD em B e A/D pode ser inválido se B for sintetizado separadamente.
42. Em many-to-1, interfaces de cada bloco do element list são tratadas separadamente.
43. Não se deve misturar pai e descendente ambiguamente no mesmo element list.
44. `create_power_domain PD1 -elements {A A/D}` é exemplo ruim.
45. `create_power_domain PD1 -elements {B B/E/G}` é exemplo ruim.
46. Power Domain é conceito virtual/lógico.
47. Voltage Area é objeto físico.
48. Voltage Area representa fisicamente um PD.
49. Voltage Area define coordenadas onde elementos de um PD são colocados.
50. Para implementação, cada PD deve corresponder a uma VA e vice-versa.
51. Recomenda-se relação 1:1 entre PD e VA.
52. Recomenda-se mesmo nome entre PD e VA correspondente.
53. Recomenda-se mesmas células hierárquicas entre PD e VA correspondente.
54. `create_voltage_area` é comando Synopsys, não-UPF.
55. RTL hierarchy e voltage area mapping não são a mesma coisa.
56. Em flat flow, elementos internos de IP podem pertencer ao domínio top.
57. Em IP sintetizado separadamente, o IP precisa de seu próprio contexto UPF.
58. Sibling elements podem pertencer a um domínio comum em flat flow.
59. Em hierarchical flow, partições atravessando hierarquias podem ser inválidas.
60. É possível definir VA boundary que não corresponde ao PD boundary.
61. VA disjunta é útil quando um bloco lógico precisa ser espalhado fisicamente.
62. Um único PD pode ser separado em múltiplas VAs.
63. Disjoint VAs dão flexibilidade de floorplan.
64. Sinais entre regiões disjuntas precisam ser tratados corretamente.
65. Placement QoR em disjoint VA flows pode ser muito desafiador.
66. Nets no mesmo PD que atravessam default VA exigem tratamento especial.
67. Feedthrough net cruzando non-default VA também pode causar problema.
68. DRC violations podem surgir em crossings de disjoint VAs.
69. Buffering nesses casos deve ser VA-aware.
70. A melhor prática geral é manter power domains alinhados à hierarquia e às voltage areas.

---

## Relação com Fusion Compiler

No Fusion Compiler, essa aula conecta diretamente UPF com implementação física.

O UPF define:

```text
power domains
scope
hierarchical ownership
supply/domain relationships
```

O Fusion Compiler precisa transformar isso em implementação física com:

```text
voltage areas
placement regions
power grid
buffers compatíveis com supply
interface cells
DRC-clean routing
```

Por isso, a recomendação PD↔VA 1:1 é tão importante. Ela simplifica:

- placement;
- legalization;
- routing;
- insertion de level shifters/isolation;
- power grid;
- DRC;
- ECO;
- integração hierárquica.

---

## Checklist de qualidade

- [x] Bloco 079 processado com base no anexo completo, 20 slides em 10 páginas.
- [x] Texto dos prints foi extraído e organizado.
- [x] Exemplos de scope, parent-scoped, self-scoped e multiple scopes foram explicados.
- [x] Regras de acesso a objetos UPF foram destacadas.
- [x] Boas práticas de definição de power domains foram detalhadas.
- [x] Relação entre PD e VA foi explicada com foco em implementação.
- [x] Casos de flat flow, hierarchical flow, sibling elements e disjoint VAs foram analisados.
- [x] Pontos de prova e revisão foram listados.
- [x] Próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 080
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 03 Module 03 — Supply Network
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Supply Network.docx
```

- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\03 Module 03 - Supply Network.md
```

- **Observação:** conferir no próximo anexo a quantidade exata de slides/páginas antes de processar.
