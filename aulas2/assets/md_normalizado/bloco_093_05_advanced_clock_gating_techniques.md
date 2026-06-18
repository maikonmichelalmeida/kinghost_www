# 05 Advanced Clock Gating Techniques

## Controle do bloco

- **Bloco:** 093
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\05 Advanced Clock Gating Techniques.docx`
- **Faixa de slides:** 1-12
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\05 Advanced Clock Gating Techniques.md
```

- **Próximo bloco recomendado:** 094 — `06 Self-Gating`
- **Arquivo do próximo bloco:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\06 Self-Gating.docx
```

- **Faixa do próximo bloco:** slides `1-9`
- **Salvar próximo Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\06 Self-Gating.md
```

---

## Resumo executivo

Esta aula aprofunda técnicas avançadas de **clock gating** no Design Compiler NXT. A aula anterior explicou o clock gating básico: detectar enables síncronos no RTL e inserir células ICG para desligar o clock de grupos de registradores quando eles não precisam atualizar. Esta aula vai além: mostra como controlar **árvores de clock gating com múltiplos estágios**, como preservar ou modificar clock gates já existentes, como remover ICGs, como atravessar fronteiras hierárquicas e como resolver problemas físicos de timing pós-CTS usando **PACG — Physically-Aware Clock Gating**.

A ideia central é que clock gating não é apenas “colocar uma AND no clock”. Em ASIC real, o clock é uma rede física crítica. O Design Compiler NXT precisa decidir:

- quantos estágios de clock gating podem existir entre a fonte de clock e os registradores;
- quando pode dividir, unir, remover, colapsar ou expandir ICGs existentes;
- quando deve preservar clock gates inseridos pelo usuário ou por uma etapa anterior;
- se pode inserir clock gating atravessando limites de hierarquia;
- como evitar que o enable do ICG vire um caminho crítico depois da síntese de árvore de clock;
- quando duplicar clock gates e aproximá-los dos clusters físicos de registradores.

O ponto mais importante para prova e prática é: **quanto mais avançado o clock gating, mais forte fica o tradeoff entre potência, timing, área, hierarquia e testabilidade**. Uma transformação que reduz número de clock gates pode piorar timing de enable; uma transformação que melhora timing físico pode aumentar consumo; uma preservação excessiva pode impedir otimização; uma remoção agressiva pode perder oportunidade de economia de potência.

---

## Texto extraído e organizado por slide

## Slide 1 — Multistage Clock Gating

**Texto extraído e organizado:**

- O número máximo de estágios de clock gating permitidos no design pode ser restringido com o comando `set_clock_gating_style`.

```tcl
set_clock_gating_style [-num_stages integer]
```

- Essa configuração define um limite para o **número máximo** de estágios de clock gating permitidos entre a fonte de clock e os registradores gated.
- O número de estágios é `1` por padrão.
- O comando não força o número exato de estágios; ele apenas impõe um limite máximo.

**Figura do slide:**

A figura mostra uma cadeia entre a fonte de clock e um registrador com três níveis:

```text
CLK → CG_ROOT → clk_gate_x → clk_gate_y → registrador
       Stage 3    Stage 2      Stage 1
```

O estágio mais próximo do registrador é considerado o primeiro estágio. Estágios mais próximos da fonte de clock são estágios superiores da árvore.

---

## Slide 2 — Multistage Clock Gating: Insertion

**Texto extraído e organizado:**

- O clock gating depende da identificação das células de clock gating quando a ferramenta calcula o número de estágios.
  - A inserção de clock gating em múltiplos estágios depende de os clock gates preexistentes terem sido identificados.
  - Por padrão, registradores que já atendem ou excedem a restrição `-num_stages` não são analisados para extrair novos sinais de enable.

- Em uma árvore de clock gating com múltiplos estágios, os sinais de enable dos clock gates mais próximos da fonte de clock são fatores comuns para os registradores gated downstream.
  - A ferramenta insere clock gates usando como condição de enable os fatores compartilhados pelo maior número de registradores gated.
  - Depois ela itera o processo nos registradores do fanout.

**Interpretação da figura:**

A figura mostra uma decomposição progressiva de condições de enable. Os registradores têm enables compostos, por exemplo:

```text
abc
abd
acd
bcd
```

A ferramenta percebe que certas letras aparecem como fatores comuns. Um fator como `a` pode controlar um primeiro clock gate que alimenta vários registradores. Depois, em níveis inferiores, fatores como `b`, `c` ou `d` podem formar gates mais locais. Isso evita repetir a mesma lógica de enable em muitos pontos e permite desligar porções maiores da árvore de clock quando uma condição comum é falsa.

---

## Slide 3 — Multistage Clock Gating: Insertion — Exemplo visual

**Texto extraído e organizado:**

O slide visualiza a decomposição em estágios:

1. A ferramenta começa com grupos de registradores cujos enables possuem fatores comuns.
2. Extrai o fator comum mais amplo.
3. Insere um clock gate mais próximo da fonte de clock para esse fator.
4. Continua analisando os grupos restantes no fanout.
5. Insere clock gates adicionais mais próximos dos registradores quando há condições específicas adicionais.

**Ideia didática:**

Se quatro registradores têm enables:

```text
abc
abd
acd
bcd
```

um estágio superior pode usar um fator comum que cobre muitos registradores. Depois, estágios inferiores refinam a condição. Isso cria uma árvore em que cada nível remove uma parte comum da expressão de enable.

A vantagem é reduzir atividade de clock em partes maiores da rede. A desvantagem é que cada estágio adicionado cria mais células, mais arcos de timing e mais complexidade para CTS e análise de enable.

---

## Slide 4 — Controlling Transformations of Existing Clock Gating (1/4)

**Texto extraído e organizado:**

- Habilitar reconfiguração geral de múltiplos estágios, isto é, colapsar ou expandir estágios:

```tcl
set_app_var power_cg_reconfig_stages true
```

- Preservar ICGs listados durante colapso e merge:

```tcl
set_preserve_clock_gate <uicg_cells_preserved>
```

- Splitting, ungating e remoção de redundância não são afetados.

**Exemplo do slide:**

```tcl
set_app_var power_cg_reconfig_stages true
set_clock_gating_style -num_stages 1 \
    -pos integrated -neg integrated

set_preserve_clock_gate [get_cells uicg_b]
```

**Sentido do exemplo:**

O comando habilita reconfiguração de estágios e define que o design deve respeitar um limite de um estágio de clock gating. Em seguida, `set_preserve_clock_gate [get_cells uicg_b]` diz à ferramenta que o ICG `uicg_b` deve ser preservado durante transformações como colapso ou merge.

---

## Slide 5 — Controlling Transformations of Existing Clock Gating (2/4)

**Texto extraído e organizado:**

- Preservar ICGs listados se uma transformação modificar seu fanout:

```tcl
set_preserve_clock_gate -dont_modify_fanout [get_cells uicg_a]
```

- A remoção de redundância não é afetada.

**Interpretação das figuras:**

O slide mostra vários tipos de transformação e indica quais são bloqueados quando se usa `-dont_modify_fanout`:

- **Split:** bloqueado, porque dividir um clock gate altera seu fanout.
- **Merge:** bloqueado, porque juntar clock gates altera quem cada ICG dirige.
- **Un-gate:** bloqueado, porque remover o gate também altera fanout.
- **Collapse/expand stages:** pode ser bloqueado quando altera o fanout do ICG preservado.
- **Redundancy removal:** continua permitida.

**Ideia prática:**

Use `-dont_modify_fanout` quando determinado ICG precisa continuar dirigindo o mesmo conjunto de cargas. Isso é útil quando a árvore de clock gating já foi planejada, validada ou alinhada com alguma restrição física/testabilidade.

---

## Slide 6 — Controlling Transformations of Existing Clock Gating (3/4)

**Texto extraído e organizado:**

- Preservar ICGs listados durante merge e quando a condição de enable for modificada:

```tcl
set_preserve_clock_gate -dont_modify_enable [get_cells uicg_a*]
```

- Splitting, ungating e remoção de redundância não são afetados.

**Interpretação da figura:**

O slide diferencia transformações que mexem apenas na estrutura/fanout daquelas que alteram a lógica de enable. A opção `-dont_modify_enable` protege a condição de enable do ICG. Portanto, transformações que mudariam a expressão lógica usada para ligar/desligar o gate são bloqueadas.

A figura sugere que certos merges podem ser permitidos quando não modificam a condição de enable protegida, enquanto colapsar ou expandir estágios pode ser bloqueado quando reescreve a lógica de enable.

**Uso típico:**

Use quando o enable do clock gate foi escrito cuidadosamente no RTL ou inserido manualmente para representar uma condição funcional importante. A ferramenta pode otimizar ao redor, mas não deve reescrever a condição de controle do gate.

---

## Slide 7 — Controlling Transformations of Existing Clock Gating (4/4)

**Texto extraído e organizado:**

- Prevenir todas as transformações, exceto remoção de redundância:

```tcl
set_preserve_clock_gate -dont_modify_fanout -dont_modify_enable \
    [get_cells uicg_a*]
```

- Isso é semelhante a `set_dont_touch`, mas não é recomendado como regra geral.

**Interpretação da figura:**

Com as duas opções juntas:

- **Split/merge:** bloqueado.
- **Un-gate:** bloqueado.
- **Collapse/expand stages:** bloqueado.
- **Remove redundancy:** permitido.

**Comentário importante:**

Essa configuração é forte. Ela praticamente congela o ICG contra modificações funcionais e estruturais. O slide compara com `set_dont_touch`, mas alerta que não é recomendado. Motivo: preservar demais pode impedir a ferramenta de corrigir problemas de fanout, timing, redundância e eficiência de clock gating.

---

## Slide 8 — Removal of Existing Clock Gating

**Texto extraído e organizado:**

- Clock gates existentes que não são preservados podem ser automaticamente removidos durante a otimização de clock gating por:
  - ungating;
  - collapsing;
  - merging.

- Para forçar a remoção de ICGs que atendem a certos critérios durante compile incremental:
  - conectados a uma lista específica de registradores sink;
  - dirigindo menos do que uma largura mínima especificada, independentemente do `min_bitwidth` do estilo de clock gating;
  - lista específica de células ICG;
  - todos os ICGs.

```tcl
remove_clock_gating [-gated_registers gated_register_list] \
    [-min_bitwidth minsize_value] \
    [-gating_cells clock_gating_cells_list] \
    [-all]
```

**Interpretação:**

Esse comando é usado para remover clock gating já existente quando ele não é desejado ou quando ficou ineficiente após mudanças de design. Por exemplo, um ICG que controla apenas poucos bits pode não compensar o custo de área, potência interna e complexidade de timing.

---

## Slide 9 — Clock-Gate Insertion Through Hierarchies

**Texto extraído e organizado:**

- Por padrão, a inserção de clock gating ocorre na hierarquia local de cada banco de registradores.
- Ao habilitar `compile_clock_gating_through_hierarchy`, o Design Compiler NXT executa clock gating atravessando fronteiras hierárquicas.
- Isso pode aumentar o número de oportunidades de clock gating e reduzir o número de clock gates.

**Comando associado:**

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

**Interpretação da figura:**

A figura mostra dois blocos hierárquicos diferentes, cada um com bancos de registradores. Sem atravessar hierarquia, a ferramenta insere gates localmente dentro de cada bloco. Com clock gating through hierarchy, a ferramenta consegue perceber condições comuns acima dos blocos e pode inserir um clock gate compartilhado, reduzindo duplicação.

**Tradeoff:**

Atravessar hierarquia pode melhorar potência e reduzir número de ICGs, mas também pode tornar a otimização menos modular. Em projetos grandes, hierarquia é usada para organização, ECO, floorplan, debug e signoff. Portanto, atravessar hierarquia é poderoso, mas precisa ser aplicado com cuidado.

---

## Slide 10 — Post-CTS ICG Enable Timing Problem

**Texto extraído e organizado:**

- A síntese da árvore de clock, ou CTS, balanceia as latências de clock para todos os pinos de clock dos registradores folha, não necessariamente para os ICGs, dentro da mesma árvore:

```text
Latency1 = Latency3
```

- Se habilitada, a otimização **CCD — concurrent clock-and-data** pode introduzir useful skew.
- ICGs são colocados perto da fonte de clock:

```text
Latency2 << Latency1
```

- Isso pode causar violações de setup no enable do ICG:

```text
ICG enable setup timing violations
```

**Interpretação da figura:**

A figura mostra o clock saindo da fonte e passando por uma árvore até os registradores. O ICG fica perto da fonte de clock, então o clock chega ao ICG cedo. Porém, o sinal de enable do ICG vem de uma lógica de controle que pode estar longe e pode chegar tarde. Como o enable precisa estar estável no momento correto para o latch interno do ICG, o caminho de enable pode se tornar crítico.

**Resumo em uma frase:**

Depois do CTS, o clock dos registradores pode estar bem balanceado, mas o clock do ICG pode estar cedo demais; isso reduz a janela disponível para o enable chegar e pode gerar violação de setup no ICG.

---

## Slide 11 — Solution: Physically-Aware Clock Gating (PACG)

**Texto extraído e organizado:**

- PACG aumenta a latência de clock até os ICGs.
- Isso melhora o timing de enable do ICG.
- A figura compara:
  - **No PACG:** um ICG controla muitos registradores, por exemplo 4000 registradores, e fica mais próximo da fonte.
  - **With PACG:** os clock gates são duplicados/divididos e colocados perto de clusters menores, por exemplo grupos de 1000 registradores.

**Interpretação:**

PACG tenta aproximar a estrutura lógica de clock gating da realidade física do chip. Em vez de um único ICG grande e distante dos registradores, a ferramenta pode duplicar o gate e colocá-lo mais próximo dos grupos físicos de registradores. Isso aumenta a latência até o ICG crítico e melhora a folga do caminho de enable.

A figura também indica buffers que seriam inseridos durante CTS. Com PACG, parte dessa estrutura é antecipada ou estimada de forma mais consciente durante a síntese.

---

## Slide 12 — Physically-Aware Clock Gating (PACG)

**Texto extraído e organizado:**

- Para designs com timing crítico no enable de ICG, habilite **placement-aware clock gating (PACG)**.
- Durante a síntese, PACG executa:
  - identificação automática de clock gating;
  - estimação automática de latência de clock para células de clock gating;
    - essa latência só é vista pelo placer e não pode ser escrita para fora;
  - duplicação de clock gates com enable crítico;
  - divisão dos fanouts dos registradores;
  - posicionamento dos gates perto dos clusters de registradores.

- O benefício de PACG é aumentar a latência para ICGs com timing crítico de enable, melhorando o enable timing.
- Pode levar a aumento no consumo de potência.
- PACG é habilitado por:

```tcl
set_app_var power_cg_physically_aware_cg true
```

**Interpretação das imagens:**

As imagens com PACG desabilitado mostram uma distribuição mais cruzada e congestionada. Com PACG habilitado, os grupos ficam mais organizados em clusters, indicando que os clock gates foram posicionados de forma mais coerente com a distribuição física dos registradores.

---

# Aula didática desenvolvida

## 1. Por que existem técnicas avançadas de clock gating

Clock gating básico resolve um problema simples: se um registrador não precisa atualizar, desligue seu clock. Isso reduz potência dinâmica porque o clock normalmente é uma das redes mais ativas de um chip.

Mas em projetos reais surgem problemas mais complexos:

- vários registradores compartilham partes da condição de enable;
- algumas condições de enable são hierárquicas;
- já existem clock gates instanciados no RTL ou inseridos anteriormente;
- a ferramenta pode querer unir ou dividir gates;
- alguns gates não compensam porque controlam poucos bits;
- o clock gate pode ficar fisicamente longe dos registradores;
- o enable do ICG pode virar um caminho crítico depois do CTS;
- preservar todos os gates pode impedir otimização;
- deixar a ferramenta mexer em tudo pode violar uma intenção de projeto.

Por isso o Design Compiler NXT oferece comandos para controlar o comportamento da otimização.

---

## 2. Multistage clock gating

Em clock gating simples, podemos imaginar uma estrutura assim:

```text
CLK → ICG → registradores
```

Em multistage clock gating, a estrutura pode virar uma árvore:

```text
CLK → ICG comum → ICG local → registradores
```

O objetivo é aproveitar fatores comuns entre enables. Por exemplo:

```text
Reg1 enable = a & b & c
Reg2 enable = a & b & d
Reg3 enable = a & c & d
Reg4 enable = b & c & d
```

Se muitos registradores dependem de `a`, pode valer a pena inserir um ICG superior controlado por `a`. Depois, dentro do fanout desse gate, a ferramenta analisa os fatores restantes.

### O comando principal

```tcl
set_clock_gating_style -num_stages 2
```

Isso não significa “insira exatamente dois estágios”. Significa:

```text
Você pode usar até 2 estágios de clock gating entre a fonte de clock e o registrador.
```

Se a ferramenta encontrar oportunidade para apenas um estágio, ela pode usar um. Se não encontrar oportunidade segura, pode não inserir. O comando define teto, não obrigação.

### Por que o padrão é 1

O padrão `1` é conservador. Um estágio é mais simples de analisar, mais simples de implementar e tende a criar menos riscos de timing. Ao permitir múltiplos estágios, aumentamos a possibilidade de economia de potência, mas também aumentamos:

- número de ICGs;
- número de arcos de enable;
- complexidade de CTS;
- risco de timing de enable;
- complexidade de debug e reporting.

---

## 3. Fatoração de enables

A figura do slide 3 mostra a ferramenta extraindo fatores comuns. Pense em uma forma algébrica.

Se temos:

```text
en1 = a b c
en2 = a b d
en3 = a c d
en4 = b c d
```

A ferramenta procura fatores que aparecem em muitos enables. Um fator comum permite desligar o clock de um grupo maior.

Exemplo conceitual:

```text
Se a = 0, todos os registradores que dependem de a podem parar.
```

Então pode fazer sentido criar um gate mais alto controlado por `a`. Depois, para cada subgrupo, gates mais locais podem usar `b`, `c` ou `d`.

Esse processo é parecido com fatoração lógica, mas com uma diferença prática: a ferramenta não está apenas minimizando portas. Ela está decidindo onde colocar gates em uma árvore de clock, levando em conta timing, fanout, número de registradores e estilo de ICG.

---

## 4. Identificação de clock gates existentes

Um ponto recorrente no curso é: a ferramenta só consegue transformar corretamente clock gates que ela reconhece como clock gates.

Se um ICG foi instanciado manualmente ou veio de uma netlist incremental, a ferramenta pode não identificá-lo automaticamente. Se ele não for identificado, pode ser ignorado pelo motor de clock gating.

Isso afeta multistage clock gating porque o cálculo de número de estágios depende de saber quais células são ICGs.

Exemplo:

```text
CLK → ICG manual → ICG inserido pela ferramenta → registrador
```

Se o ICG manual não for identificado, a ferramenta pode contar errado os estágios e fazer decisões ruins.

---

## 5. Reconfiguração de estágios existentes

O comando:

```tcl
set_app_var power_cg_reconfig_stages true
```

habilita reconfiguração de múltiplos estágios. Isso permite à ferramenta colapsar ou expandir estágios de clock gating.

### Collapse

Colapsar significa reduzir níveis. Exemplo:

```text
CLK → ICG1 → ICG2 → regs
```

pode virar:

```text
CLK → ICG_combined → regs
```

### Expand

Expandir significa dividir um gate em níveis adicionais:

```text
CLK → ICG_big → muitos regs
```

pode virar:

```text
CLK → ICG_common → ICG_local_1 → regs grupo 1
                 → ICG_local_2 → regs grupo 2
```

A ferramenta faz isso para melhorar tradeoffs de potência, timing, fanout e estágio máximo.

---

## 6. Preservação de ICGs

Preservar ICGs é necessário quando determinado clock gate tem uma intenção que a ferramenta não deve destruir.

Existem níveis de preservação.

### Preservação simples

```tcl
set_preserve_clock_gate [get_cells uicg_b]
```

Preserva a célula durante colapso e merge, mas ainda permite algumas transformações como splitting, ungating e remoção de redundância.

### Não modificar fanout

```tcl
set_preserve_clock_gate -dont_modify_fanout [get_cells uicg_a]
```

Protege o conjunto de registradores ou cargas dirigidas pelo ICG. Bloqueia transformações que mudariam o fanout, como split, merge e un-gate.

### Não modificar enable

```tcl
set_preserve_clock_gate -dont_modify_enable [get_cells uicg_a*]
```

Protege a condição de enable do ICG. A ferramenta não deve reescrever a lógica que decide quando o clock passa.

### Preservação forte

```tcl
set_preserve_clock_gate -dont_modify_fanout -dont_modify_enable \
    [get_cells uicg_a*]
```

Essa forma é parecida com um congelamento do clock gate, exceto que remoção de redundância ainda pode ocorrer. O slide diz que é semelhante a `set_dont_touch`, mas não recomenda uso amplo.

---

## 7. Por que preservação excessiva é ruim

Preservar tudo parece seguro, mas pode prejudicar muito a qualidade de resultado.

Se a ferramenta não pode modificar clock gates:

- pode manter gates inúteis;
- pode deixar fanout ruim;
- pode manter estágio excessivo;
- pode impedir redução de área;
- pode impedir melhoria de timing;
- pode manter consumo maior;
- pode impedir duplicação física útil.

Portanto, a regra prática é:

```text
Preserve apenas quando houver motivo claro.
```

Motivos claros incluem:

- ICG manual validado;
- restrição de testabilidade;
- necessidade de preservar hierarquia/estrutura;
- ECO controlado;
- clock gate exigido por arquitetura;
- compatibilidade com fluxo downstream.

---

## 8. Remoção de clock gating existente

O comando:

```tcl
remove_clock_gating
```

serve para remover ICGs existentes por critérios. Isso é útil quando o clock gating ficou ineficiente.

Exemplo de caso ruim:

```text
Um ICG controla apenas 1 registrador.
```

Talvez o custo do ICG seja maior que a economia de potência. Ele adiciona célula, área, capacitância, arco de enable, complexidade de timing e teste.

Critérios possíveis:

```tcl
remove_clock_gating -gated_registers [get_cells {reg1 reg2 reg3}]
```

Remove clock gating associado a registradores específicos.

```tcl
remove_clock_gating -min_bitwidth 4
```

Remove gates que dirigem menos que a largura mínima especificada.

```tcl
remove_clock_gating -gating_cells [get_cells uicg_bad*]
```

Remove células ICG específicas.

```tcl
remove_clock_gating -all
```

Remove todos os ICGs elegíveis.

---

## 9. Clock gating através de hierarquias

Por padrão, a ferramenta trabalha localmente dentro da hierarquia de cada banco de registradores. Isso respeita a estrutura do RTL, mas pode perder oportunidades.

Exemplo:

```text
top
 ├─ mid_1/bot_1: regs com enable EN
 └─ mid_2/bot_2: regs com enable EN
```

Se a ferramenta só olha localmente, pode inserir dois gates separados. Se atravessar hierarquia, pode perceber que o enable é comum e inserir um gate compartilhado.

Comando:

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

Vantagens:

- mais oportunidades de clock gating;
- menos gates duplicados;
- potencial redução de potência e área.

Riscos:

- mudanças estruturais atravessam limites de módulo;
- pode dificultar debug;
- pode afetar ECO;
- pode interferir em floorplan hierárquico;
- pode exigir cuidado em flows com blocos reutilizados.

---

## 10. O problema de timing do enable pós-CTS

Este é um dos conceitos mais importantes da aula.

Um ICG normalmente contém um latch interno que captura o enable em uma fase segura do clock. Para funcionar corretamente, o enable precisa chegar a tempo.

Depois de CTS, a árvore de clock é balanceada para os registradores finais. O slide diz:

```text
Latency1 = Latency3
```

Ou seja, o clock chega com latências equilibradas nos registradores folha. Mas o ICG pode estar perto da fonte:

```text
Latency2 << Latency1
```

Isso quer dizer que o clock chega no ICG cedo demais em relação ao clock dos registradores finais.

### Por que isso piora setup do enable

O sinal de enable do ICG vem de lógica de controle. Se essa lógica está longe, ou se o caminho é longo, o enable pode chegar tarde. Como o clock do ICG chega cedo, a janela de setup do enable fica apertada.

Resultado:

```text
ICG enable setup timing violation
```

Esse problema pode aparecer mesmo quando os registradores finais estão com clock bem balanceado.

---

## 11. PACG — Physically-Aware Clock Gating

PACG significa **Physically-Aware Clock Gating**, ou clock gating consciente da física do layout.

O objetivo é melhorar timing do enable do ICG usando informação física estimada.

Comando:

```tcl
set_app_var power_cg_physically_aware_cg true
```

### O que PACG faz

Durante a síntese, o PACG:

1. identifica clock gating automaticamente;
2. estima latência de clock para células ICG;
3. duplica gates com enable crítico;
4. divide fanout de registradores;
5. coloca gates perto de clusters de registradores.

### Por que isso ajuda

Se o ICG é colocado mais perto dos registradores, o clock até o ICG pode ter uma latência maior. Isso dá mais tempo para o enable chegar.

O slide resume:

```text
PACG increases ICG clock latency → better ICG enable timing
```

### Tradeoff: pode aumentar potência

PACG pode duplicar clock gates e criar mais estrutura local. Isso pode aumentar:

- número de ICGs;
- capacitância total;
- buffers;
- área;
- consumo.

Então PACG não é “sempre melhor”. Ele é útil quando o timing de enable do ICG é crítico.

---

# Conceitos difíceis explicados em profundidade

## 1. `set_clock_gating_style -num_stages`

O comando:

```tcl
set_clock_gating_style -num_stages 2
```

controla quantos níveis de clock gating podem existir entre a fonte de clock e os registradores gated.

Erro comum:

```text
Achar que -num_stages 2 força exatamente dois estágios.
```

Correção:

```text
Ele define o máximo permitido. A ferramenta usa até esse número, se fizer sentido.
```

Uso prático:

- `-num_stages 1`: conservador, padrão.
- `-num_stages 2` ou mais: permite árvores mais sofisticadas, mas aumenta complexidade.

---

## 2. Clock gate mais próximo da fonte versus mais próximo do registrador

Em uma árvore de clock gating:

```text
CLK → ICG_A → ICG_B → registrador
```

`ICG_A` está mais perto da fonte. `ICG_B` está mais perto do registrador.

Um gate perto da fonte pode desligar uma porção maior da árvore, economizando mais potência potencialmente. Mas ele também controla mais fanout e pode ter enable mais global.

Um gate perto do registrador é mais localizado. Pode ser mais fácil de fechar timing, mas economiza menos clock upstream.

---

## 3. `power_cg_reconfig_stages`

```tcl
set_app_var power_cg_reconfig_stages true
```

Habilita a ferramenta a reconfigurar estágios de clock gating existentes.

Sem isso, a ferramenta pode ficar mais limitada para colapsar/expandir árvores já existentes. Com isso, ela ganha liberdade para reorganizar os gates.

Use quando quer permitir que o DC NXT melhore uma estrutura de clock gating já existente em vez de apenas preservar o que veio do RTL ou da netlist.

---

## 4. `set_preserve_clock_gate`

Esse comando é mais específico que um `set_dont_touch` genérico. Ele preserva clock gates considerando tipos específicos de transformação.

### Forma simples

```tcl
set_preserve_clock_gate [get_cells uicg_b]
```

Protege o ICG em colapso e merge.

### Protegendo fanout

```tcl
set_preserve_clock_gate -dont_modify_fanout [get_cells uicg_a]
```

A ferramenta não deve alterar as cargas dirigidas pelo gate.

### Protegendo enable

```tcl
set_preserve_clock_gate -dont_modify_enable [get_cells uicg_a*]
```

A ferramenta não deve alterar a lógica de enable do gate.

### Proteção forte

```tcl
set_preserve_clock_gate -dont_modify_fanout -dont_modify_enable \
    [get_cells uicg_a*]
```

Impede quase todas as transformações, exceto remoção de redundância.

---

## 5. Split, merge, un-gate, collapse, expand e redundancy removal

Essas palavras aparecem nos slides e são importantes.

### Split

Divide um clock gate em mais de um gate.

```text
1 ICG → 2 ICGs menores
```

Pode ajudar fanout, timing ou posicionamento.

### Merge

Une clock gates semelhantes.

```text
2 ICGs → 1 ICG maior
```

Pode reduzir área e redundância, mas pode aumentar fanout.

### Un-gate

Remove clock gating de um grupo.

```text
CLK → ICG → regs
```

vira:

```text
CLK → regs
```

Pode ser usado quando o gate não compensa ou viola alguma regra.

### Collapse stages

Reduz níveis da árvore.

```text
CLK → ICG1 → ICG2 → regs
```

vira:

```text
CLK → ICG_combined → regs
```

### Expand stages

Cria níveis adicionais.

```text
CLK → ICG → muitos regs
```

vira:

```text
CLK → ICG_common → ICG_local → regs
```

### Remove redundancy

Remove gates constantes, sem carga útil ou logicamente redundantes. Mesmo preservações fortes geralmente ainda permitem isso.

---

## 6. `remove_clock_gating`

Esse comando serve para forçar remoção de clock gates existentes durante compile incremental.

Exemplo:

```tcl
remove_clock_gating -all
```

Remove todos os ICGs elegíveis.

Exemplo mais seletivo:

```tcl
remove_clock_gating -gating_cells [get_cells uicg_debug*]
```

Remove apenas os gates selecionados.

Exemplo por largura mínima:

```tcl
remove_clock_gating -min_bitwidth 4
```

Remove gates que dirigem menos de 4 bits, mesmo que o estilo de clock gating tenha outro `min_bitwidth`.

---

## 7. `compile_clock_gating_through_hierarchy`

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

Permite inserir clock gating atravessando limites hierárquicos.

Isso pode ser muito útil quando a condição de enable está em um nível superior e registradores estão espalhados em submódulos.

Sem essa opção, cada submódulo pode receber seu próprio ICG. Com essa opção, a ferramenta pode criar uma estrutura compartilhada.

---

## 8. ICG enable timing

O enable do ICG é um caminho de timing real. Ele precisa chegar ao latch interno do ICG no momento certo.

O erro comum é pensar:

```text
Clock gating só reduz potência, não afeta timing.
```

Na verdade, clock gating adiciona arcos de timing:

```text
lógica de controle → enable do ICG
clock → latch interno do ICG
ICG output → registradores
```

Se o enable chega tarde, há violação.

---

## 9. PACG

```tcl
set_app_var power_cg_physically_aware_cg true
```

PACG é usado quando o problema de timing do enable é físico. Não basta reescrever lógica; a posição do ICG e a latência de clock importam.

PACG duplica e posiciona gates perto de clusters de registradores. Isso aumenta a latência até ICGs críticos e melhora setup do enable.

Pegadinha:

```text
PACG melhora timing de enable, mas pode aumentar potência.
```

Isso parece contraditório em um curso de low power, mas faz sentido: para melhorar timing físico, a ferramenta pode duplicar gates e inserir estrutura adicional.

---

# Figuras, diagramas e waveforms importantes

## Figura do Slide 1 — Estágios de clock gating

Mostra três gates entre a fonte de clock e o registrador. A mensagem é que `-num_stages` limita a profundidade máxima da árvore de clock gating.

---

## Figura do Slide 3 — Fatoração de enables

Mostra registradores com enables compostos, como `abc`, `abd`, `acd`, `bcd`. A ferramenta extrai fatores comuns e cria gates em níveis diferentes. Isso ajuda a entender multistage clock gating como fatoração de condições de enable.

---

## Figuras dos Slides 4-7 — Transformações de ICGs existentes

Essas figuras mostram quais transformações são permitidas ou bloqueadas por diferentes formas de `set_preserve_clock_gate`:

- preservação simples;
- preservação de fanout;
- preservação de enable;
- preservação forte.

Estude essas figuras como uma matriz mental:

```text
Fanout protegido  → bloqueia transformações que mudam cargas.
Enable protegido  → bloqueia transformações que mudam condição.
Ambos protegidos  → bloqueia quase tudo, exceto redundância.
```

---

## Figura do Slide 9 — Through hierarchy

Mostra que clock gating pode ser inserido cruzando fronteiras hierárquicas. A ferramenta consegue reduzir gates duplicados quando uma condição comum existe em nível superior.

---

## Figura do Slide 10 — Problema pós-CTS

Mostra a diferença entre a latência até o ICG e a latência até os registradores. O ICG fica perto da fonte, então o clock chega cedo nele. Isso pode transformar o caminho de enable em caminho crítico.

---

## Figuras dos Slides 11-12 — PACG

Mostram a diferença entre um ICG grande, distante e com fanout enorme versus vários gates duplicados e posicionados perto de clusters de registradores. A mensagem é:

```text
PACG troca uma estrutura lógica simples por uma estrutura fisicamente melhor para timing.
```

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **Qual comando controla o número máximo de estágios de clock gating?**

```tcl
set_clock_gating_style -num_stages <n>
```

2. **`-num_stages` define número exato ou máximo?**  
Define o número **máximo**, não o número exato.

3. **Qual é o número de estágios padrão?**  
`1`.

4. **Multistage clock gating depende da identificação de quê?**  
Das células de clock gating existentes.

5. **Qual variável habilita reconfiguração de estágios?**

```tcl
set_app_var power_cg_reconfig_stages true
```

6. **Qual comando preserva ICGs listados?**

```tcl
set_preserve_clock_gate [get_cells ...]
```

7. **Qual opção preserva fanout?**

```tcl
-dont_modify_fanout
```

8. **Qual opção preserva enable?**

```tcl
-dont_modify_enable
```

9. **Como impedir quase todas as transformações, exceto redundância?**

```tcl
set_preserve_clock_gate -dont_modify_fanout -dont_modify_enable [get_cells ...]
```

10. **Qual comando força remoção de clock gating?**

```tcl
remove_clock_gating
```

11. **Qual variável permite clock gating através de hierarquias?**

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

12. **Por que ICG enable timing pode falhar após CTS?**  
Porque CTS balanceia os registradores folha, mas o ICG pode ficar perto da fonte de clock. O clock chega cedo no ICG e o enable pode chegar tarde.

13. **Qual recurso ajuda em designs com timing crítico de enable de ICG?**  
PACG — Physically-Aware Clock Gating.

14. **Qual variável habilita PACG?**

```tcl
set_app_var power_cg_physically_aware_cg true
```

15. **PACG pode aumentar potência?**  
Sim. Ele pode duplicar gates e aumentar estrutura, embora melhore timing de enable.

---

## Pegadinhas

| Tema | Pegadinha | Correção |
|---|---|---|
| `-num_stages` | Achar que força número exato de estágios | Define apenas o máximo permitido |
| Multistage | Achar que sempre melhora | Pode aumentar complexidade e risco de timing |
| ICG existente | Achar que a ferramenta sempre reconhece | ICGs preexistentes podem precisar ser identificados |
| Preservação | Achar que preservar tudo é melhor | Preservar demais limita otimização |
| `-dont_modify_fanout` | Confundir com preservação de enable | Protege cargas/fanout, não necessariamente a lógica de enable |
| `-dont_modify_enable` | Confundir com fanout fixo | Protege a condição de enable |
| Remoção | Achar que remover clock gating é sempre ruim | Pode ser necessário quando o ICG não compensa |
| Hierarquia | Achar que clock gating sempre respeita módulo | Pode atravessar hierarquia se habilitado |
| CTS | Achar que CTS resolve tudo | CTS pode criar problema de enable no ICG |
| PACG | Achar que sempre reduz potência | Pode melhorar timing e aumentar potência |

---

# Relação com projeto/laboratório

Esta aula é diretamente útil para scripts Tcl de síntese low power no Design Compiler NXT.

Um fluxo típico com clock gating avançado poderia conter:

```tcl
# Permitir múltiplos estágios de clock gating
set_clock_gating_style -num_stages 2 \
    -pos integrated -neg integrated

# Habilitar reconfiguração de estágios existentes
set_app_var power_cg_reconfig_stages true

# Preservar clock gates manuais específicos
set_preserve_clock_gate -dont_modify_enable [get_cells uicg_manual*]

# Permitir clock gating através de hierarquia
set_app_var compile_clock_gating_through_hierarchy true

# Habilitar PACG se houver problema crítico de enable timing
set_app_var power_cg_physically_aware_cg true

# Rodar compile com clock gating
compile_ultra -gate_clock
```

No laboratório ou projeto, essa aula ajuda a interpretar:

- por que a ferramenta inseriu mais de um nível de ICG;
- por que alguns registradores não receberam clock gating;
- por que um ICG existente foi removido ou transformado;
- por que o relatório mostra gates ungated;
- por que um caminho de enable do ICG aparece como crítico;
- por que o PACG pode duplicar clock gates;
- por que a potência pode subir em uma tentativa de corrigir timing.

Relação com aulas anteriores:

- O bloco 092 explicou inserção básica de clock gating, estilos, exclusões, identificação e reporting.
- Este bloco 093 aprofunda transformações, múltiplos estágios, hierarquia e consciência física.
- O próximo bloco 094, Self-Gating, deve tratar um caso ainda mais específico: inserir clock gating quando o dado de entrada do registrador permanece igual ao valor armazenado.

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

## Bloco 094 — 06 Self-Gating

**Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\06 Self-Gating.docx
```

**Faixa:** slides `1-9`

**Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\06 Self-Gating.md
```
