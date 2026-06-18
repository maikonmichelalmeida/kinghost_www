# 04 Module 04 — Supply Network — parte C

## Controle do bloco

- **Bloco:** 085
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 04 Module 04 — Supply Network — parte C
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network.docx`
- **Arquivo anexado nesta conversa:** `04 Module 04 - Supply Network.docx`
- **Faixa processada conforme roteiro:** slides 51-63
- **Continuação:** mesmo anexo usado nas partes A e B
- **Começa em:** `set_isolation and -source/-sink: Example`
- **Termina em:** `Supply Set Handle — Default Retention`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\04 Module 04 - Supply Network_parte_C.md
```

---

## Resumo executivo

Esta parte C fecha o módulo **04 Module 04 — Supply Network**. A parte A explicou a rede tradicional de supplies e introduziu supply sets. A parte B aprofundou **supply set handles**, association, refinement, `-available_supplies` e começou a mostrar como supply sets afetam strategies como `set_isolation`. Esta parte C conclui esse raciocínio com exemplos práticos de:

1. `set_isolation` com `-source` e `-sink`;
2. `set_isolation` com `-diff_supply_only`;
3. isolamento em presença de **heterogeneous fanout**;
4. `set_level_shifter` com `-source` e `-sink`;
5. interação entre isolation e level shifting;
6. uso dos handles:
   - `<domain>.primary`;
   - `<domain>.default_isolation`;
   - `<domain>.default_retention`;
7. supplies default de isolation e retention quando se usa supply set handles.

A mensagem central desta parte é:

```text
Supply sets permitem que isolation e level shifting sejam definidos com base na supply do driver/source e do receiver/sink, e não apenas por boundaries genéricas. Isso torna o UPF mais preciso, mas exige atenção a fanout heterogêneo, source/sink filtering e defaults de supply.
```

A parte C também reforça uma das vantagens mais práticas dos **supply set handles**:

```text
quando usamos handles, muitas vezes não precisamos escrever explicitamente -isolation_power_net ou -retention_power_net, porque o domínio já possui default_isolation e default_retention.
```

Isso simplifica o UPF, mas somente quando os handles foram corretamente associados/refinados.

---

# Parte 1 — `set_isolation` com `-source` e `-sink`

## Slide 51 — `set_isolation and -source/-sink: Example`

### Texto extraído

Título:

```text
set_isolation and -source/-sink: Example
```

Código:

```tcl
create_power_domain PD1 -elements {A}
set_isolation -domain PD1 -location parent \
-source SS_VDD1 -sink SS_VDD2
```

Figura:

```text
PD1; SS_VDD1
A

PD2; SS_VDD3
PD3; SS_VDD2
```

Anotação da figura:

```text
Isolation to be inserted here only
```

Lembrete:

```text
Remember: -source/-sink can only be used with supply sets, not supply nets
```

### Interpretação

Este slide mostra o uso de `-source` e `-sink` para filtrar onde a isolation cell deve ser inserida.

O domínio `PD1` contém o bloco `A`, alimentado por:

```text
SS_VDD1
```

A saída de `A` tem fanout para dois destinos:

```text
PD2; SS_VDD3
PD3; SS_VDD2
```

A estratégia é:

```tcl
set_isolation -domain PD1 -location parent \
-source SS_VDD1 -sink SS_VDD2
```

Isso significa:

```text
Inserir isolation apenas nos caminhos cujo source está relacionado a SS_VDD1
e cujo sink está relacionado a SS_VDD2.
```

Como o sink `SS_VDD2` corresponde ao ramo que vai para `PD3`, a isolation deve ser inserida somente nesse ramo.

### Ponto importante

Se a estratégia tivesse apenas `-domain PD1 -location parent`, a ferramenta poderia considerar todos os outputs do domínio. Com `-source/-sink`, a estratégia fica mais seletiva.

### Regra crítica do slide

```text
-source e -sink só podem ser usados com supply sets, não com supply nets.
```

Isso é uma motivação forte para usar supply sets e handles no UPF moderno.

---

## Slide 52 — `set_isolation and -source/-sink: More Examples`

### Texto extraído

Título:

```text
set_isolation and -source/-sink: More Examples
```

Exemplo 1:

```text
Insert isolation cells on ports which are driven by supply set ssTOP
```

Comando:

```tcl
set_isolation iso_pd1 -domain PD1 -source ssTOP
```

Exemplo 2:

```text
Insert isolation cells on ports whose loads are powered by supply set ssTOP
```

Comando:

```tcl
set_isolation iso_pd2 -domain PD2 -sink ssTOP
```

Exemplo 3:

```text
Insert isolation cells on ports which are driven by pins whose related supply set
is ssTOP and loaded by objects whose supply set is ssPD1
```

Comando:

```tcl
set_isolation iso_pd1 -domain PD1 \
    -source ssTOP \
    -sink ssPD1
```

### Interpretação

Este slide dá três padrões de uso.

## 1. Filtrar por source

```tcl
set_isolation iso_pd1 -domain PD1 -source ssTOP
```

A isolation se aplica aos ports de `PD1` dirigidos por lógica cujo supply set relacionado é `ssTOP`.

## 2. Filtrar por sink

```tcl
set_isolation iso_pd2 -domain PD2 -sink ssTOP
```

A isolation se aplica aos ports cujos loads/receivers são alimentados por `ssTOP`.

## 3. Filtrar por source e sink

```tcl
set_isolation iso_pd1 -domain PD1 \
    -source ssTOP \
    -sink ssPD1
```

A isolation se aplica apenas quando as duas condições são verdadeiras:

```text
driver/source relacionado a ssTOP
receiver/sink relacionado a ssPD1
```

### Ponto didático

`-source` e `-sink` permitem escrever isolation strategies orientadas à relação elétrica entre origem e destino, e não apenas à fronteira genérica do domínio.

---

# Parte 2 — `set_isolation` com `-diff_supply_only`

## Slide 53 — `set_isolation and -diff_supply_only`

### Texto extraído

Título:

```text
set_isolation and -diff_supply_only
```

Pontos:

```text
Inserts isolation cells only on ports whose sources and sinks have different supply sets or supply nets
```

Subitem:

```text
Useful when source and sink have same supplies, but are not in same logical hierarchy
```

Exemplo:

```text
Example: Integrating many hierarchies together
```

Comando de domínio:

```tcl
create_power_domain PD1 -elements {A B}
```

Observação:

```text
Traditional set_isolation can yield redundant isolation cells between logical blocks belonging to same power domain:
```

Comando tradicional:

```tcl
set_isolation iso_PD1_out -domain PD1 -applies_to outputs
```

Com `diff_supply_only`:

```tcl
set_isolation iso_PD1_out \
    -domain PD1 \
    -diff_supply_only true \
    -applies_to outputs
```

Nota:

```text
NOTE: Recommended methodology is still to have power domains defined on logical hierarchical boundaries
```

Figura:

```text
PD1; SS_VDD1
A
PD2; SS_VDD2
PD1; SS_VDD1
B
```

### Interpretação

`-diff_supply_only true` instrui a ferramenta a inserir isolation apenas quando source e sink têm supplies diferentes.

Isso é útil quando a hierarquia lógica é complexa e há blocos diferentes pertencendo ao mesmo power domain ou usando a mesma supply.

No exemplo, `PD1` contém `A` e `B`:

```tcl
create_power_domain PD1 -elements {A B}
```

Se usamos uma strategy tradicional:

```tcl
set_isolation iso_PD1_out -domain PD1 -applies_to outputs
```

a ferramenta pode inserir isolation de forma redundante entre blocos que, apesar de estarem em hierarquias lógicas distintas, pertencem ao mesmo domínio/supply.

Com:

```tcl
-diff_supply_only true
```

a isolation só aparece nos caminhos em que a supply realmente difere.

### Observação metodológica

O slide mantém a recomendação:

```text
O ideal ainda é definir power domains em fronteiras hierárquicas lógicas.
```

Ou seja, `-diff_supply_only` ajuda, mas não substitui uma boa definição de power domains.

---

## Slide 54 — `set_isolation and -diff_supply_only` — reforço

### Texto extraído

O slide repete o mesmo conteúdo do slide anterior, com a mesma mensagem:

```text
Inserts isolation cells only on ports whose sources and sinks have different supply sets or supply nets
```

E o mesmo exemplo:

```tcl
create_power_domain PD1 -elements {A B}

set_isolation iso_PD1_out -domain PD1 -applies_to outputs

set_isolation iso_PD1_out \
    -domain PD1 \
    -diff_supply_only true \
    -applies_to outputs
```

### Interpretação

A repetição reforça a pegadinha de `set_isolation` tradicional.

Sem `-diff_supply_only`, uma strategy ampla pode gerar células de isolation em interfaces onde source e sink usam a mesma supply.

Com `-diff_supply_only`, a ferramenta compara source e sink e só insere isolation quando há diferença real de supply.

### Regra prática

```text
Use -diff_supply_only quando quiser evitar isolation redundante em integrações hierárquicas onde nem toda fronteira lógica representa diferença de supply.
```

Mas continue preferindo power domains alinhados a boundaries hierárquicas limpas.

---

# Parte 3 — Heterogeneous Fanout

## Slide 55 — Isolation Insertion with Heterogeneous Fanout

### Texto extraído

Título:

```text
Isolation Insertion with Heterogeneous Fanout
```

Pontos:

```text
Isolation cell insertion may not happen when using -source/-sink or
-diff_supply_only argument
```

Outro ponto:

```text
Some Synopsys tools* require you to enable the capability that allows inserting
isolation cells with -source/-sink in presence of heterogeneous fanout
```

Subitem:

```text
This is done by using design attribute hetero_fanout_isolation set to true in your UPF
```

Comando:

```tcl
set_design_attributes -elements {.} \
    -attribute hetero_fanout_isolation TRUE
```

Nota de rodapé:

```text
*Design Compiler requires the setting of hetero_fanout_isolation, Fusion Compiler & IC Compiler II don't
```

### Interpretação

**Heterogeneous fanout** ocorre quando uma mesma saída dirige múltiplos destinos com características diferentes de supply/power domain.

Exemplo conceitual:

```text
A saída de A vai para:
  destino 1 com SS_VDD2
  destino 2 com SS_VDD3
```

Se a strategy usa `-source/-sink`, a ferramenta precisa inserir isolation apenas em um ramo do fanout, não necessariamente na raiz comum.

Algumas ferramentas Synopsys, especificamente **Design Compiler**, exigem habilitar explicitamente:

```tcl
set_design_attributes -elements {.} \
    -attribute hetero_fanout_isolation TRUE
```

para permitir esse tipo de inserção.

O slide observa que:

```text
Fusion Compiler e IC Compiler II não exigem essa configuração.
```

### Ponto prático

Se em DC a isolation esperada não aparece em fanout heterogêneo, verifique se o atributo `hetero_fanout_isolation` precisa ser ativado.

---

## Slide 56 — `set_isolation and -source/-sink: Example` com heterogeneous fanout

### Texto extraído

Título:

```text
set_isolation and -source/-sink: Example
```

Figura:

```text
PD1; SS_VDD1
A

PD2; SS_VDD3
PD3; SS_VDD2
```

Anotação:

```text
Isolation to be inserted here only
```

Lembrete:

```text
Remember: -source/-sink can only be used with supply sets, not supply nets
```

Caixa:

```text
Only required in Design Compiler!
```

Comando:

```tcl
set_design_attributes -elements {.} \
-attribute hetero_fanout_isolation true

create_power_domain PD1 -elements {A}
set_isolation -domain PD1 -location parent \
-source SS_VDD1 -sink SS_VDD2
```

### Interpretação

Este slide aplica o atributo do slide anterior ao exemplo de fanout heterogêneo.

A saída de `A`, em `PD1/SS_VDD1`, alimenta dois destinos:

```text
PD2; SS_VDD3
PD3; SS_VDD2
```

A strategy:

```tcl
-source SS_VDD1 -sink SS_VDD2
```

quer isolar apenas o ramo cujo sink é `SS_VDD2`.

Em Design Compiler, pode ser necessário habilitar:

```tcl
hetero_fanout_isolation true
```

para permitir a inserção seletiva da isolation no ramo correto.

### Observação importante

A caixa do slide deixa claro:

```text
Only required in Design Compiler!
```

Logo, para Fusion Compiler/ICC II, o comportamento já é suportado sem esse atributo específico.

---

# Parte 4 — Supply sets e `set_level_shifter`

## Slide 57 — Supply Sets and `set_level_shifter`

### Texto extraído

Título:

```text
Supply Sets and set_level_shifter
```

Sintaxe:

```tcl
-source <source_supply_set_ref_name>
-sink <sink_supply_set_ref_name>
```

Ponto:

```text
set_level_shifter also supports heterogeneous fanout presence with -source/-sink:
```

Exemplo:

```tcl
set_level_shifter LS1 -domain PDA \
    -source SSA -sink SSC \
    -location parent

set_level_shifter LS2 -domain PDA \
    -source SSA \
    -sink SSD -location parent
```

Figura:

```text
Domain: PDTOP
Domain: PDA
Supply: SSA (1V)

Domain: PDB
Supply: SSC (2V)

Domain: PDD
Supply: SSD (1V)

LS to be inserted here only
```

### Interpretação

Assim como `set_isolation`, `set_level_shifter` também pode usar `-source` e `-sink`.

Isso permite inserir level shifters apenas para caminhos específicos em fanout heterogêneo.

No exemplo:

```text
PDA usa SSA (1V)
PDB usa SSC (2V)
PDD usa SSD (1V)
```

A saída de PDA tem fanout para PDB e PDD.

Estratégia 1:

```tcl
set_level_shifter LS1 -domain PDA \
    -source SSA -sink SSC \
    -location parent
```

Aplica-se ao caminho de `SSA` para `SSC`, isto é, de 1V para 2V.

Estratégia 2:

```tcl
set_level_shifter LS2 -domain PDA \
    -source SSA \
    -sink SSD -location parent
```

Aplica-se ao caminho de `SSA` para `SSD`. Como ambos são 1V no exemplo, pode não haver necessidade real de level shift, mas a strategy mostra o mecanismo de filtragem.

### Ponto importante

`-source/-sink` em level shifter torna a strategy mais seletiva e ajuda a lidar com fanout para múltiplos domínios/supplies.

---

## Slide 58 — `set_level_shifter and -source/-sink: Example`

### Texto extraído

Título:

```text
set_level_shifter and -source/-sink: Example
```

Figura:

```text
Domain: PDA
Supply: SSA (1V)
FF1

SSB (2V)
ISO

SSC (1.1V)
FF2
```

Código:

```tcl
set_isolation ISO -domain PDA \
-isolation_supply SSB \
-location parent

set_level_shifter LS1 -domain PDA \
-source SSA -sink SSC -location parent \
-threshold 0.2

set_level_shifter LS2 -domain PDA -source SSA \
-sink SSB -location parent
```

Observações:

```text
Both LS belong to LS1 strategy
```

Pontos do slide:

```text
Level shifter strategies applied
```

Subitens:

```text
Strategy LS1 on the path mod1/p1 to FF2/D-pin, skip ISO for -source & -sink filtering
Strategy LS2 not applied, as there is no applicable load with supply SSB (ISO skipped)
```

Outro ponto:

```text
Voltage violations are analyzed on full path, considering ISO input and output pins
```

Outro ponto:

```text
Two nets have voltage violations and the strategy LS1 applies to both resulting in Level shifters being inserted
```

Subitens:

```text
Net n2: 2V -> 1V violation
Net n3: 2V -> 1.1V violation
```

Nota:

```text
Note: Before ISO insertion, no level shifter strategy applied because the voltage difference
between SSA and SSC was less than the threshold
```

### Interpretação

Este é o slide mais complexo da parte C.

O caminho lógico sai de `FF1`, no domínio `PDA`, com supply `SSA = 1V`, e chega a `FF2`, cujo lado final está relacionado a `SSC = 1.1V`.

Há uma isolation cell no meio, alimentada por:

```text
SSB = 2V
```

O comando de isolation:

```tcl
set_isolation ISO -domain PDA \
-isolation_supply SSB \
-location parent
```

insere uma ISO alimentada por `SSB`.

Depois, há duas strategies de level shifter:

```tcl
set_level_shifter LS1 -domain PDA \
-source SSA -sink SSC -location parent \
-threshold 0.2
```

e:

```tcl
set_level_shifter LS2 -domain PDA -source SSA \
-sink SSB -location parent
```

### Por que LS1 se aplica?

A análise de source/sink considera o caminho completo de `FF1` até `FF2`, pulando a ISO para fins de filtragem. Assim, a strategy LS1, que filtra `SSA → SSC`, se aplica ao caminho final.

### Por que LS2 não se aplica?

O slide diz que não há load aplicável com supply `SSB`, porque a ISO é pulada para o filtro de `-source/-sink`.

Ou seja, embora a ISO use `SSB`, ela não é considerada o sink lógico final para a strategy LS2.

### Por que dois level shifters aparecem?

Depois que a ISO é inserida, surgem dois nets com violações de tensão:

```text
n2: 2V -> 1V
n3: 2V -> 1.1V
```

A strategy LS1 se aplica ao caminho, e as violações nos dois nets resultam em LS inseridos. A anotação do slide diz:

```text
Both LS belong to LS1 strategy
```

### Papel do threshold

Antes da ISO, a diferença entre `SSA = 1V` e `SSC = 1.1V` era menor que o threshold `0.2`. Portanto, nenhum LS seria necessário.

Depois da ISO alimentada por `SSB = 2V`, aparecem violações maiores, e os LS passam a ser necessários.

### Moral da história

```text
Isolation cells podem alterar o contexto de tensão no caminho e causar necessidade de level shifters que não existia antes.
```

---

# Parte 5 — Supply set handles e supplies default

## Slide 59 — Supply Set Handle — Primary

### Texto extraído

Título:

```text
Supply Set Handle — Primary
```

Código:

```tcl
## Power domain definition
create_power_domain Top_PD
create_power_domain BLOCK_PD \
    -elements {Block}
```

Pontos:

```text
All cells in the TOP_PD power domain without exception connections are
considered connected to Top_PD.primary
```

```text
All cells in BLOCK_PD without exception connections are considered connected to
BLOCK_PD.primary
```

Figura:

```text
Top_PD.primary.power
Top_PD.primary.ground

BLOCK_PD.primary.power
BLOCK_PD.primary.ground
```

### Interpretação

Este slide mostra o comportamento default do handle `primary`.

Quando os domínios são criados:

```tcl
create_power_domain Top_PD
create_power_domain BLOCK_PD \
    -elements {Block}
```

todas as células normais do domínio `Top_PD`, sem exception connections, são consideradas conectadas a:

```text
Top_PD.primary
```

Da mesma forma, as células normais de `BLOCK_PD` são consideradas conectadas a:

```text
BLOCK_PD.primary
```

### O que são exception connections?

São conexões explícitas que sobrescrevem o default. Se uma célula específica recebe uma supply diferente, ela deixa de usar o default do domínio.

### Regra prática

```text
Sem exceções, células normais usam o primary handle do seu power domain.
```

---

## Slide 60 — Specifying Isolation Supplies

### Texto extraído

Título:

```text
Specifying Isolation Supplies
```

Pontos:

```text
Specifying isolation supplies in the isolation strategy is optional when using supply set handles
```

Subitem:

```text
<power_domain>.default_isolation will be the default isolation supply
```

Outro ponto:

```text
If specified, use only one of the following in the isolation strategy:
```

Opção 1 — supply set:

```tcl
-isolation_supply_set supply_set_ref
```

Opção 2 — funções de um supply set:

```tcl
-isolation_power_net supply_set_ref.power
-isolation_ground_net supply_set_ref.ground
```

Opção 3 — supply nets:

```tcl
-isolation_power_net power_supply_net
-isolation_ground_net ground_supply_net
```

### Interpretação

Quando se usa supply set handles, você não precisa necessariamente especificar a supply da isolation strategy.

Se nada for especificado, a ferramenta usa:

```text
<power_domain>.default_isolation
```

como supply default da ISO.

Mas, se o usuário quiser especificar, deve escolher **apenas uma** das três formas:

1. Supply set:

```tcl
-isolation_supply_set supply_set_ref
```

2. Funções de supply set:

```tcl
-isolation_power_net supply_set_ref.power
-isolation_ground_net supply_set_ref.ground
```

3. Supply nets diretas:

```tcl
-isolation_power_net power_supply_net
-isolation_ground_net ground_supply_net
```

### Pegadinha

Não misture formas. Por exemplo, não use `-isolation_supply_set` junto com `-isolation_power_net` em supply net direta, salvo se a documentação/ferramenta explicitamente permitir algum caso especial.

### Regra prática

```text
Com handles bem definidos, prefira deixar a isolation usar default_isolation ou especifique por supply set.
```

---

## Slide 61 — Supply Set Handle — Default Isolation

### Texto extraído

Título:

```text
Supply Set Handle — Default Isolation
```

Código:

```tcl
## Power domain definition
create_power_domain Top_PD
create_power_domain BLOCK_PD \
    -elements {Block}

## Block isolation strategy
set_isolation Block_iso_out \
    -domain BLOCK_PD \
    -source BLOCK_PD.primary \
    -sink Top_PD.primary \
    -clamp_value 1
```

Observação:

```text
No -isolation_power_net required
```

Figura:

```text
BLOCK_PD.default_isolation.power
BLOCK_PD.default_isolation.ground
ISO
```

### Interpretação

Este slide mostra a simplificação prática trazida por handles.

A isolation strategy é:

```tcl
set_isolation Block_iso_out \
    -domain BLOCK_PD \
    -source BLOCK_PD.primary \
    -sink Top_PD.primary \
    -clamp_value 1
```

Observe que o comando **não** especifica:

```tcl
-isolation_power_net
-isolation_ground_net
-isolation_supply_set
```

Por quê?

Porque a ferramenta usa o default:

```text
BLOCK_PD.default_isolation
```

A figura mostra a ISO alimentada por:

```text
BLOCK_PD.default_isolation.power
BLOCK_PD.default_isolation.ground
```

### Ponto importante

Isso só é seguro se `BLOCK_PD.default_isolation` estiver corretamente associado/refinado para uma supply adequada, normalmente uma supply que permanece ligada quando a ISO precisa funcionar.

### Regra prática

```text
No -isolation_power_net required quando o default_isolation do domínio está corretamente definido.
```

---

## Slide 62 — Specifying Retention Supplies

### Texto extraído

Título:

```text
Specifying Retention Supplies
```

Pontos:

```text
Specifying retention supplies in the retention strategy is optional when using supply set handles
```

Subitem:

```text
<power_domain>.default_retention will be the default retention supply
```

Outro ponto:

```text
If specified, use only one of the following in the retention strategy:
```

Opção 1 — supply set:

```tcl
-retention_supply_set supply_set_ref
```

Opção 2 — funções de supply set:

```tcl
-retention_power_net supply_set_ref.power
-retention_ground_net supply_set_ref.ground
```

Opção 3 — supply nets:

```tcl
-retention_power_net power_supply_net
-retention_ground_net ground_supply_net
```

### Interpretação

Este slide é o equivalente do slide 60, mas para retention.

Com supply set handles, se você não especificar supplies de retention, a ferramenta usa:

```text
<power_domain>.default_retention
```

Se quiser especificar explicitamente, escolha somente uma forma:

1. Supply set:

```tcl
-retention_supply_set supply_set_ref
```

2. Funções de supply set:

```tcl
-retention_power_net supply_set_ref.power
-retention_ground_net supply_set_ref.ground
```

3. Supply nets diretas:

```tcl
-retention_power_net power_supply_net
-retention_ground_net ground_supply_net
```

### Ponto prático

Retention supply precisa ser always-on enquanto o estado deve ser preservado. Portanto, `default_retention` precisa resolver para uma supply compatível com esse requisito.

---

## Slide 63 — Supply Set Handle — Default Retention

### Texto extraído

Título:

```text
Supply Set Handle — Default Retention
```

Código:

```tcl
## Power domain definition
create_power_domain Top_PD
create_power_domain BLOCK_PD -elements {Block}

## Block isolation strategy
set_isolation Block_iso_out -domain BLOCK_PD \
    -source BLOCK_PD.primary -sink Top_PD.primary \
    -clamp_value 1

## Block retention strategy
set_retention block_ret -domain BLOCK_PD
```

Observação:

```text
No -retention_power_net required
```

Figura:

```text
BLOCK_PD.default_isolation.power
BLOCK_PD.default_isolation.ground

BLOCK_PD.default_retention.power
BLOCK_PD.default_retention.ground

RET
ISO
```

### Interpretação

Este slide mostra o uso combinado de default isolation e default retention.

A isolation usa:

```text
BLOCK_PD.default_isolation
```

sem precisar de `-isolation_power_net`.

A retention usa:

```text
BLOCK_PD.default_retention
```

sem precisar de `-retention_power_net`.

O comando:

```tcl
set_retention block_ret -domain BLOCK_PD
```

não especifica power/ground de retention. Com handles, a ferramenta usa automaticamente:

```text
BLOCK_PD.default_retention.power
BLOCK_PD.default_retention.ground
```

### Condição para isso funcionar

Esses handles precisam estar corretamente associados/refinados. Caso contrário, o UPF fica aparentemente simples, mas a implementação física pode falhar por missing supply ou supply incorreta.

### Moral

```text
Supply set handles simplificam muito o UPF, mas transferem a responsabilidade para a associação/refinamento correto dos handles.
```

---

# Aula didática desenvolvida

## 1. `-source/-sink` tornam isolation e LS mais seletivos

Sem `-source/-sink`, uma strategy de isolation ou level shifter pode agir em todas as fronteiras de um domínio.

Com `-source/-sink`, ela age apenas quando o driver e/ou receiver estão relacionados a supply sets específicos.

Isso evita:

- isolation desnecessária;
- LS em fanout errado;
- células especiais em caminhos que não precisam;
- comportamento excessivamente amplo em designs hierárquicos.

## 2. `-diff_supply_only` evita isolation redundante

Quando source e sink estão na mesma supply, pode não haver necessidade de isolation mesmo que haja boundary lógica entre blocos.

`-diff_supply_only true` impede que a ferramenta insira isolation quando as supplies são iguais.

Esse recurso é útil em integração hierárquica, mas o curso reforça:

```text
a melhor metodologia ainda é definir power domains em logical hierarchical boundaries.
```

## 3. Heterogeneous fanout é uma situação especial

Em fanout heterogêneo, um mesmo driver alimenta destinos com supplies diferentes.

A ferramenta precisa conseguir inserir uma célula em apenas um ramo. Em Design Compiler, isso pode exigir:

```tcl
set_design_attributes -elements {.} \
    -attribute hetero_fanout_isolation TRUE
```

No Fusion Compiler e IC Compiler II, o slide diz que isso não é necessário.

## 4. Isolation pode criar necessidade de level shifter

O slide 58 mostra um ponto sofisticado: antes da ISO, a diferença entre source e sink podia estar abaixo do threshold de LS. Mas ao inserir uma ISO alimentada por uma supply intermediária ou diferente, novos nets aparecem com tensões diferentes.

Assim, a ISO pode introduzir novas violações de tensão que exigem LS.

Isso mostra que:

```text
LS e ISO não são estratégias independentes; elas interagem.
```

## 5. `primary`, `default_isolation` e `default_retention` reduzem verbosidade

Sem handles, seria necessário escrever supplies explicitamente em várias strategies.

Com handles:

```tcl
set_isolation Block_iso_out -domain BLOCK_PD \
    -source BLOCK_PD.primary \
    -sink Top_PD.primary \
    -clamp_value 1
```

não precisa especificar `-isolation_power_net`, porque o domínio já tem:

```text
BLOCK_PD.default_isolation
```

Da mesma forma:

```tcl
set_retention block_ret -domain BLOCK_PD
```

pode usar:

```text
BLOCK_PD.default_retention
```

## 6. A simplicidade dos handles depende do refinement correto

Handles deixam o UPF limpo, mas eles precisam resolver para supplies reais corretas.

Se `BLOCK_PD.default_retention` não for associado a uma supply always-on, a retention pode falhar.

Se `BLOCK_PD.default_isolation` não estiver disponível no local físico da ISO, a inserção pode falhar.

### Regra prática

```text
Use handles para escrever UPF limpo.
Use association/refinement para garantir implementação correta.
```

---

# Conceitos difíceis explicados em profundidade

## `-source`

Opção que filtra uma strategy pelo supply set relacionado ao driver do sinal.

Exemplo:

```tcl
-source SS_VDD1
```

## `-sink`

Opção que filtra uma strategy pelo supply set relacionado ao load/receiver do sinal.

Exemplo:

```tcl
-sink SS_VDD2
```

## `-diff_supply_only`

Opção que restringe a inserção de isolation a caminhos em que source e sink têm supplies diferentes.

## Heterogeneous fanout

Situação em que uma mesma saída dirige múltiplos destinos com supply sets diferentes.

## `hetero_fanout_isolation`

Atributo usado em algumas ferramentas Synopsys, especialmente Design Compiler, para permitir inserção de isolation em ramos específicos de fanout heterogêneo.

## `set_level_shifter -source/-sink`

Uso de source/sink filtering para level shifters, análogo ao uso em isolation.

## `threshold`

Parâmetro de strategy de level shifter que define diferença mínima de tensão para considerar a inserção de LS.

## `default_isolation`

Handle de supply set usado como supply default das isolation cells de um domínio.

## `default_retention`

Handle de supply set usado como supply default dos retention elements de um domínio.

## Exception connections

Conexões explícitas que sobrescrevem a supply default de um elemento.

---

# Comandos importantes da parte C

## `set_isolation` com source/sink

```tcl
create_power_domain PD1 -elements {A}
set_isolation -domain PD1 -location parent \
-source SS_VDD1 -sink SS_VDD2
```

## Mais exemplos de `set_isolation`

```tcl
set_isolation iso_pd1 -domain PD1 -source ssTOP
```

```tcl
set_isolation iso_pd2 -domain PD2 -sink ssTOP
```

```tcl
set_isolation iso_pd1 -domain PD1 \
    -source ssTOP \
    -sink ssPD1
```

## `set_isolation` com `-diff_supply_only`

```tcl
create_power_domain PD1 -elements {A B}

set_isolation iso_PD1_out \
    -domain PD1 \
    -diff_supply_only true \
    -applies_to outputs
```

## Heterogeneous fanout isolation — Design Compiler

```tcl
set_design_attributes -elements {.} \
    -attribute hetero_fanout_isolation TRUE
```

ou:

```tcl
set_design_attributes -elements {.} \
-attribute hetero_fanout_isolation true

create_power_domain PD1 -elements {A}
set_isolation -domain PD1 -location parent \
-source SS_VDD1 -sink SS_VDD2
```

## `set_level_shifter` com source/sink

```tcl
set_level_shifter LS1 -domain PDA \
    -source SSA -sink SSC \
    -location parent

set_level_shifter LS2 -domain PDA \
    -source SSA \
    -sink SSD -location parent
```

## Interação isolation + level shifter

```tcl
set_isolation ISO -domain PDA \
-isolation_supply SSB \
-location parent

set_level_shifter LS1 -domain PDA \
-source SSA -sink SSC -location parent \
-threshold 0.2

set_level_shifter LS2 -domain PDA -source SSA \
-sink SSB -location parent
```

## Primary handle

```tcl
create_power_domain Top_PD
create_power_domain BLOCK_PD \
    -elements {Block}
```

## Default isolation sem `-isolation_power_net`

```tcl
set_isolation Block_iso_out \
    -domain BLOCK_PD \
    -source BLOCK_PD.primary \
    -sink Top_PD.primary \
    -clamp_value 1
```

## Default retention sem `-retention_power_net`

```tcl
set_retention block_ret -domain BLOCK_PD
```

---

# Tabelas de revisão

## `set_isolation`: source/sink/diff

| Opção | Função |
|---|---|
| `-source SSx` | Aplica a strategy a sinais cujo driver está relacionado a `SSx` |
| `-sink SSy` | Aplica a strategy a sinais cujo receiver está relacionado a `SSy` |
| `-source SSx -sink SSy` | Aplica quando driver e receiver batem com os dois supply sets |
| `-diff_supply_only true` | Insere isolation apenas se source e sink têm supplies diferentes |

---

## Fanout heterogêneo

| Situação | Consequência |
|---|---|
| Um driver alimenta sinks com supplies diferentes | Pode ser necessário inserir ISO/LS em apenas um ramo |
| Uso de `-source/-sink` | Filtra o ramo correto |
| Design Compiler | Pode exigir `hetero_fanout_isolation TRUE` |
| Fusion Compiler/ICC II | O slide diz que não exige essa configuração |

---

## `set_level_shifter` com source/sink

| Elemento | Significado |
|---|---|
| `-source SSA` | Supply set do driver/origem |
| `-sink SSC` | Supply set do receiver/destino |
| `-location parent` | Inserção fora do domínio, no parent |
| `-threshold 0.2` | LS só considerado acima da diferença mínima de tensão |

---

## Handles e supplies default

| Handle | Uso default |
|---|---|
| `<PD>.primary` | Células normais do domínio |
| `<PD>.default_isolation` | Isolation cells do domínio |
| `<PD>.default_retention` | Retention elements do domínio |

---

## Formas de especificar isolation supply

| Forma | Exemplo |
|---|---|
| Supply set | `-isolation_supply_set supply_set_ref` |
| Funções de supply set | `-isolation_power_net supply_set_ref.power` + `-isolation_ground_net supply_set_ref.ground` |
| Supply nets diretas | `-isolation_power_net power_supply_net` + `-isolation_ground_net ground_supply_net` |
| Omitido com handles | Usa `<power_domain>.default_isolation` |

---

## Formas de especificar retention supply

| Forma | Exemplo |
|---|---|
| Supply set | `-retention_supply_set supply_set_ref` |
| Funções de supply set | `-retention_power_net supply_set_ref.power` + `-retention_ground_net supply_set_ref.ground` |
| Supply nets diretas | `-retention_power_net power_supply_net` + `-retention_ground_net ground_supply_net` |
| Omitido com handles | Usa `<power_domain>.default_retention` |

---

# Figuras e diagramas importantes

## Slide 51 — `set_isolation` source/sink example

Mostra `PD1; SS_VDD1` dirigindo `PD2; SS_VDD3` e `PD3; SS_VDD2`, com isolation inserida apenas no caminho cujo sink é `SS_VDD2`.

## Slide 52 — More examples

Mostra três formas de uso: apenas `-source`, apenas `-sink`, e combinação `-source` + `-sink`.

## Slides 53-54 — `-diff_supply_only`

Mostram como evitar isolation redundante entre blocos do mesmo power domain/supply, usando `-diff_supply_only true`.

## Slide 55 — Heterogeneous fanout

Mostra que em alguns fluxos a insertion pode não ocorrer sem habilitar `hetero_fanout_isolation`.

## Slide 56 — Heterogeneous fanout example

Mostra a mesma estrutura do slide 51, mas com o atributo necessário para Design Compiler.

## Slide 57 — `set_level_shifter` source/sink

Mostra uma saída em PDA/SSA indo para PDB/SSC e PDD/SSD, com LS inserido apenas no ramo apropriado.

## Slide 58 — LS e ISO interaction

Mostra a inserção de ISO alimentada por `SSB = 2V`, que cria nets com violações de tensão e exige LS associados à strategy LS1.

## Slide 59 — Primary handle

Mostra `Top_PD.primary.power/ground` e `BLOCK_PD.primary.power/ground`, indicando que células sem exceção usam o primary handle do seu domínio.

## Slide 60 — Specifying Isolation Supplies

Mostra que `default_isolation` é usado por default e que, se especificar supply, deve-se escolher apenas uma forma.

## Slide 61 — Default Isolation

Mostra uma ISO alimentada por `BLOCK_PD.default_isolation.power/ground` sem exigir `-isolation_power_net`.

## Slide 62 — Specifying Retention Supplies

Mostra regra análoga para retention: `default_retention` é usado por default.

## Slide 63 — Default Retention

Mostra RET e ISO no mesmo bloco, usando `BLOCK_PD.default_retention` e `BLOCK_PD.default_isolation` sem supplies explícitas na strategy.

---

# Pontos de prova e revisão

1. `-source/-sink` em `set_isolation` só pode ser usado com supply sets, não com supply nets.
2. `-source` filtra pela supply do driver/source.
3. `-sink` filtra pela supply do receiver/sink.
4. `-source SS_VDD1 -sink SS_VDD2` insere isolation apenas no caminho que atende às duas condições.
5. `set_isolation iso_pd1 -domain PD1 -source ssTOP` insere ISO em ports dirigidos por `ssTOP`.
6. `set_isolation iso_pd2 -domain PD2 -sink ssTOP` insere ISO em ports cujos loads são alimentados por `ssTOP`.
7. `-source` e `-sink` podem ser combinados.
8. `-diff_supply_only` insere ISO apenas quando source e sink têm supplies diferentes.
9. `-diff_supply_only` é útil quando source/sink têm mesmas supplies mas não estão na mesma hierarquia lógica.
10. `set_isolation` tradicional pode gerar ISO redundante entre blocos do mesmo power domain.
11. A metodologia recomendada ainda é definir power domains em logical hierarchical boundaries.
12. Heterogeneous fanout pode impedir insertion de ISO em alguns fluxos.
13. Design Compiler pode exigir `hetero_fanout_isolation TRUE`.
14. Fusion Compiler e IC Compiler II não exigem esse atributo, segundo o slide.
15. Heterogeneous fanout ocorre quando um driver alimenta sinks com supplies diferentes.
16. `set_level_shifter` também suporta `-source` e `-sink`.
17. `set_level_shifter` com `-source/-sink` pode lidar com fanout heterogêneo.
18. Em level shifter, `-source` identifica supply do driver.
19. Em level shifter, `-sink` identifica supply do receiver.
20. `-location parent` insere LS no parent.
21. No exemplo do slide 58, ISO é alimentada por `SSB`.
22. Voltage violations são analisadas no full path, considerando ISO input e output pins.
23. PM cells como ISO podem alterar o contexto de tensão do caminho.
24. Antes da ISO, a diferença entre `SSA` e `SSC` pode ser menor que o threshold.
25. Depois da ISO, novas violações podem aparecer.
26. LS1 pode se aplicar mesmo a nets criados pela presença da ISO.
27. LS2 não se aplica se não há load aplicável com supply `SSB`.
28. Todas as células em `Top_PD` sem exception connections usam `Top_PD.primary`.
29. Todas as células em `BLOCK_PD` sem exception connections usam `BLOCK_PD.primary`.
30. `primary` define supplies normais do domínio.
31. Ao usar supply set handles, especificar supplies de isolation é opcional.
32. Se não especificar, `<power_domain>.default_isolation` é a supply default da ISO.
33. Se especificar isolation supply, use apenas uma forma.
34. Uma forma é `-isolation_supply_set`.
35. Outra forma é `-isolation_power_net supply_set_ref.power` e `-isolation_ground_net supply_set_ref.ground`.
36. Outra forma é usar supply nets diretas em `-isolation_power_net` e `-isolation_ground_net`.
37. `set_isolation` pode não precisar de `-isolation_power_net` quando handles estão corretos.
38. `BLOCK_PD.default_isolation.power` alimenta a ISO no exemplo.
39. Ao usar supply set handles, especificar supplies de retention é opcional.
40. Se não especificar, `<power_domain>.default_retention` é a supply default de retention.
41. Se especificar retention supply, use apenas uma forma.
42. Uma forma é `-retention_supply_set`.
43. Outra forma é `-retention_power_net supply_set_ref.power` e `-retention_ground_net supply_set_ref.ground`.
44. Outra forma é usar supply nets diretas em `-retention_power_net` e `-retention_ground_net`.
45. `set_retention block_ret -domain BLOCK_PD` pode usar `BLOCK_PD.default_retention`.
46. `BLOCK_PD.default_retention.power/ground` alimenta o RET no exemplo.
47. A simplicidade do UPF com handles depende de association/refinement corretos.
48. Default isolation precisa resolver para supply adequada e disponível.
49. Default retention precisa resolver para supply always-on adequada.
50. A parte C fecha o módulo Supply Network.

---

# Relação com Fusion Compiler

No Fusion Compiler, estes conceitos aparecem diretamente na implementação de power management cells.

A ferramenta usa:

```text
source/sink supply set analysis
diff_supply_only
supply set handles
default isolation/retention supplies
exception connections
association/refinement dos handles
```

para decidir:

```text
1. onde inserir isolation cells;
2. onde evitar isolation redundante;
3. como lidar com fanout heterogêneo;
4. onde inserir level shifters;
5. como LS e ISO interagem no mesmo caminho;
6. qual supply alimenta ISO;
7. qual supply alimenta retention;
8. quais células normais usam primary supply.
```

A principal vantagem no Fusion Compiler é que o UPF pode ficar mais limpo e arquitetural, mas a ferramenta ainda precisa que os handles sejam refinados para supplies reais antes da implementação física.

---

# Checklist prático da parte C

## `set_isolation`

```text
1. Estou usando supply sets, não supply nets, com -source/-sink?
2. A strategy precisa filtrar por source?
3. A strategy precisa filtrar por sink?
4. O caminho tem fanout heterogêneo?
5. Em Design Compiler, preciso habilitar hetero_fanout_isolation?
6. A strategy está criando isolation redundante?
7. -diff_supply_only true resolveria?
```

## `set_level_shifter`

```text
1. O LS precisa ser filtrado por source/sink?
2. O caminho tem ISO no meio?
3. A ISO muda o contexto de tensão?
4. O threshold impede ou permite LS?
5. Há fanout heterogêneo?
```

## Handles

```text
1. As células normais usam o primary correto?
2. default_isolation está associado a supply apropriada?
3. default_retention está associado a supply always-on?
4. Alguma exception connection sobrescreve os defaults?
5. Estou misturando formas de especificar supply na mesma strategy?
```

---

# Checklist de qualidade

- [x] Bloco 085 processado conforme roteiro, slides 51-63.
- [x] O módulo Supply Network foi finalizado sem misturar com o próximo módulo.
- [x] `set_isolation -source/-sink` foi explicado com exemplos.
- [x] `-diff_supply_only` foi explicado e diferenciado de isolation tradicional.
- [x] Heterogeneous fanout foi tratado com o atributo `hetero_fanout_isolation`.
- [x] `set_level_shifter -source/-sink` foi explicado com interação com ISO.
- [x] Handles `primary`, `default_isolation` e `default_retention` foram fechados com exemplos.
- [x] As regras de supplies opcionais em isolation/retention foram destacadas.
- [x] Figuras dos slides 51-63 foram interpretadas.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 086
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 05 Module 05 — Power States
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\05 Module 05 - Power States.docx
```

- **Processar:** slides 1-17
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\05 Module 05 - Power States.md
```

- **Depois:** Bloco 087 — `06 Module 06 - Fusion Compiler and UPF`.
