# 02 Verification Methodology

## Controle do bloco

- **Bloco:** 024
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\02 Verification Methodology.docx`
- **Faixa processada:** slides visíveis 1-6, distribuídos em 3 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\02 Verification Methodology.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. O roteiro indica este bloco como `024 — 02 Verification Methodology` e o próximo como `025 — 03 Hardware Verification Languages`.
- **Próximo bloco recomendado:** 025 — `03 Hardware Verification Languages`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco continua a seção **05 Design Verification** e aprofunda a ideia de metodologia de verificação, especialmente o uso combinado de **code coverage**, **functional coverage**, tecnologias de verificação, estratégia por nível de design, arquitetura de testbench e padronização via Accellera.

---

## Resumo executivo

Esta aula aprofunda a metodologia de verificação depois da introdução geral do bloco anterior. O tema central é:

```text
cobertura alta não significa automaticamente design correto.
```

O bloco começa explicando que, em designs complexos, é muito difícil verificar 100% de todas as funcionalidades lógicas em todos os cenários de uso. Por isso, a verificação precisa de métricas, mas essas métricas precisam ser interpretadas corretamente.

A primeira mensagem forte do slide é:

```text
Completeness does not imply correctness.
```

Tradução:

```text
Completude não implica correção.
```

Ou seja, mesmo que a cobertura pareça alta, isso não prova que o design está correto. Code coverage mostra quanto do código foi exercitado, mas não prova que o testbench verificou corretamente os requisitos do design.

A aula também explica que **code coverage** é mais útil para dizer quando a verificação **não está pronta** do que para dizer que ela acabou. Uma cobertura baixa indica claramente que há partes não exercitadas. Uma cobertura alta, porém, não é garantia absoluta de conclusão.

Depois, a aula apresenta **coverage as a completion metric**, comparando code coverage e functional coverage:

```text
code coverage    → quantitativa
functional coverage → qualitativa
```

A mensagem prática é:

```text
Test Done = Test Plan Executed and All Code Executed
```

Ou seja, para considerar a verificação concluída, é preciso executar o plano de teste funcional e também exercitar o código relevante.

Em seguida, o bloco apresenta tecnologias de verificação:

```text
event-driven simulation
cycle-based simulation
emulation and acceleration
equivalence checking / formal methods
```

e mostra que a escolha depende da fase do projeto, desempenho desejado, capacidade necessária e tipo de verificação.

A aula também apresenta uma estratégia de verificação em fluxo:

```text
estudar especificações
extrair requisitos verificáveis
revisar requisitos com arquitetos/designers
definir ambiente de verificação
revisar arquitetura de testbench
projetar testbench com VCs reutilizáveis
codificar testes para cobrir plano e assertions
completar 100% de functional e code coverage
revisar coverage e remover redundâncias
fazer signoff contra o verification plan
```

O bloco fecha com uma visão de **Coverage Driven Verification** e uma arquitetura de testbench com componentes como:

```text
stimulus
configure
generator
transaction
driver
monitor
coverage
self check
DUT
```

Por fim, apresenta o padrão **Accellera**, organização ligada à criação e promoção de padrões de design, modelagem e verificação em nível de sistema para a indústria eletrônica mundial.

---

## Texto extraído e organizado por slide

### Slide 1 — Verification Goal

O slide começa destacando que, em designs complexos, é muito difícil verificar 100% da lógica e das funcionalidades em todos os cenários de uso.

Texto principal:

```text
In complex designs, it is very difficult to verify 100% logic design,
functionalities, in all the scenarios which it faces while using.
```

Tradução:

```text
Em designs complexos, é muito difícil verificar 100% da lógica e das funcionalidades
em todos os cenários que o design enfrentará durante o uso.
```

Interpretação:

A meta de verificação é alta, mas a realidade é limitada por complexidade, tempo, número de cenários e custo computacional. Por isso, a metodologia precisa usar cobertura, planos de teste e tecnologias combinadas.

---

#### Completeness does not imply correctness

O slide afirma:

```text
Completeness does not imply correctness.
```

Tradução:

```text
Completude não implica correção.
```

Pontos listados:

```text
Code coverage indicates how thoroughly your entire verification suite exercises
the source code. It does not provide an indication, in any way, about the correctness
of the verification suite.

Code coverage should be used to help identify corner cases that were not exercised
by the verification suite or implementation-dependent features that were introduced
during the implementation.

Code coverage is an additional indicator for the completeness of the verification job.
It can help increase your confidence that the verification job is complete,
but it should not be your only indicator.
```

Interpretação:

Code coverage mede execução do código, não correção do design.

Ela responde perguntas como:

```text
essa linha foi executada?
esse branch foi tomado?
essa expressão foi exercitada?
esse bloco foi visitado?
```

Mas não responde diretamente:

```text
o resultado estava correto?
o checker estava certo?
o requisito foi implementado?
o testbench validou a intenção real?
```

Por isso, code coverage é útil como sinal de completude, mas não como prova de correção.

---

#### Code coverage lets you know if you are not done

O slide diz:

```text
Code coverage lets you know if you are not done:
Code coverage indicates whether the verification task is not complete through low coverage numbers.
A high coverage number is by no means an indication that the job is over.
```

Tradução:

```text
Code coverage permite saber se você ainda não terminou:
números baixos de cobertura indicam que a tarefa de verificação não está completa.
Um número alto de cobertura não significa, por si só, que o trabalho acabou.
```

Interpretação:

Essa é uma das frases mais importantes do bloco.

Se a cobertura de código está baixa, há evidência clara de que partes do design ainda não foram exercitadas. Mas se a cobertura está alta, ainda é preciso perguntar:

```text
o plano funcional foi coberto?
os corner cases foram atingidos?
há requisitos ausentes?
há checkers suficientes?
o testbench poderia estar aceitando respostas erradas?
```

---

#### Ferramentas podem ajudar a chegar a 100% coverage

O slide afirma:

```text
Some tools can help you reach 100% coverage:
There are testbench generation tools that automatically generate stimulus
to exercise the uncovered code sections of a design.
```

Interpretação:

Ferramentas podem gerar estímulos para cobrir partes do código ainda não executadas. Isso ajuda a fechar buracos de cobertura, mas ainda não substitui o julgamento funcional.

Uma ferramenta pode exercitar uma linha sem garantir que aquele cenário é semanticamente relevante ou que o resultado foi corretamente checado.

---

#### Code coverage tools as profilers

O slide também diz:

```text
Code coverage tools can be used as profilers:
When developing models for simulation only, where performance is an important criteria,
code coverage tools can be used for profiling.

The aim of profiling is the opposite of code coverage.
The aim of profiling is to identify the lines of codes that are executed most often.
Those lines of code become the primary candidates for performance optimization efforts.
```

Interpretação:

Coverage também pode ser usada como ferramenta de desempenho. Em modelos de simulação, se uma parte do código é executada muitas vezes, ela pode estar reduzindo a velocidade da simulação.

Nesse caso, a ferramenta não serve apenas para dizer o que foi coberto, mas para indicar:

```text
quais linhas são mais executadas?
onde otimizar o simulador/modelo?
onde está o gargalo de performance?
```

---

### Slide 2 — Coverage as a Completion Metric

O slide compara code coverage e functional coverage como métricas de conclusão.

#### 100% code coverage e 50% functional coverage

O slide afirma:

```text
It is quite possible to achieve 100% code coverage but only 50% functional coverage.
Here, the design is half complete.
```

Interpretação:

Isso significa que todo o código existente foi executado, mas apenas metade dos requisitos funcionais do plano foi exercitada.

Exemplo:

```text
O RTL tem código para ADD e SUB.
Os testes exercitam todas as linhas desse código.
Mas o plano funcional também exigia testar overflow, underflow, flags e interações com reset.
```

Code coverage pode estar 100%, mas a verificação funcional ainda está incompleta.

---

#### 50% code coverage e 100% functional coverage

O slide afirma:

```text
Equally, it is possible to have 50% code coverage but 100% functional coverage.
```

Pontos listados:

```text
Indicates that the functional coverage model is missing some key features of the design.

Indicates the design contains untested code that is not part of the test plan.

This can come from an incomplete test plan, extra undocumented features in the design,
or case statement or other branches that do not get exercised in normal hardware operation.

Untested features need to either be tested or removed.

As a result, even with 100% functional coverage it is still a good idea to use code coverage
as a fail safe for the test plan.
```

Interpretação:

Se functional coverage está 100%, mas code coverage está baixa, há algo estranho.

Possibilidades:

```text
o plano funcional esqueceu requisitos;
o RTL tem código não documentado;
há features extras;
há branches mortos;
há código que nunca ocorre em operação normal;
há lógica que deveria ser removida;
há casos não cobertos pelo plano.
```

Esse caso mostra que code coverage e functional coverage se complementam.

---

#### Code coverage quantitativa, functional coverage qualitativa

O slide conclui:

```text
Code coverage is quantitative coverage and functional coverage is qualitative coverage.

The two coverage approaches are complementary,
and high-quality verification benefits from both.
```

Interpretação:

Code coverage é quantitativa porque mede execução estrutural do código. Functional coverage é qualitativa porque mede intenções do plano de verificação e requisitos funcionais.

No rodapé, o slide resume:

```text
Test Done = Test Plan Executed and All Code Executed
```

Tradução:

```text
Teste concluído = plano de teste executado e todo o código executado.
```

Essa frase é o resumo prático do slide.

---

### Slide 3 — Verification Technologies

O slide apresenta tecnologias de verificação usadas para maximizar cobertura conforme os requisitos do design.

Texto principal:

```text
To achieve maximum design coverage by verification,
depending on the design requirement, a mix of verification technologies are adopted.
```

Tradução:

```text
Para atingir máxima cobertura de design por verificação,
dependendo do requisito do design, uma mistura de tecnologias de verificação é adotada.
```

Interpretação:

Não existe uma tecnologia única que resolva tudo. A escolha depende de:

```text
fase do projeto
tamanho do design
nível de abstração
necessidade de debug
velocidade
capacidade
tipo de bug procurado
```

---

#### Event driven Simulation

Pontos listados:

```text
Used for interactive phase simulation during design coding stage.

Offers high flexibility.

Quick turnaround time.

Supported by good debug capabilities.
```

Interpretação:

Simulação orientada a eventos é boa durante a fase de codificação e debug interativo.

Ela permite:

```text
ver waveform
depurar RTL
observar eventos
testar mudanças rápidas
trabalhar com comportamento detalhado
```

É flexível, mas pode ser mais lenta em designs muito grandes.

---

#### Cycle based Simulation

Pontos listados:

```text
Used for in-design regression phase.

Provides highest performance.

Highest capacity.
```

Interpretação:

Simulação baseada em ciclos é usada em regressões maiores, quando a prioridade é velocidade e capacidade.

Ela assume design síncrono e abstrai detalhes de timing. Por isso, serve bem para rodar muitos testes em designs grandes.

---

#### Emulation and Acceleration

Pontos listados:

```text
In-system verification.

Highest performance.

Highest capacity.

Real system environment.
```

Interpretação:

Emulação e aceleração permitem verificar designs grandes em ambientes mais próximos do real.

São úteis quando:

```text
simulação tradicional é lenta demais;
é necessário rodar software real;
o sistema completo precisa ser observado;
o design é grande demais para regressão puramente simulada.
```

---

#### Figura de tecnologias

A figura do slide organiza as tecnologias em blocos, relacionando níveis/fases:

```text
Specification Validation
Functional Verification (interactive)
Functional Verification (regression)
In-system Verification
Implementation Verification
Event driven Simulation
Cycle Based Simulations
Emulation
Equivalence Checking / Formal methods
```

Interpretação:

A figura mostra que cada tecnologia cobre melhor uma parte do espaço de verificação.

Exemplo:

```text
event-driven → debug e interação
cycle-based → regressão e capacidade
emulation → verificação em sistema
formal/equivalence → verificação de implementação/equivalência
```

---

### Slide 4 — Verification Strategy

O slide apresenta a ideia de estratégia de verificação.

Texto principal:

```text
To achieve the verification goal, different strategies are adopted depending on
the complexity of the design, design size, criticality of the design block.
```

Tradução:

```text
Para atingir a meta de verificação, diferentes estratégias são adotadas conforme
a complexidade do design, o tamanho do design e a criticidade do bloco.
```

Interpretação:

Nem todo bloco exige o mesmo nível de esforço. Um bloco simples e pouco crítico pode ser verificado com estratégia mais simples. Um bloco de segurança, interface crítica ou controlador complexo exige metodologia mais rigorosa.

---

#### Different strategies

O slide lista:

```text
IP/Block level verification:
The flow chart shows the design verification strategy at block/module or IP level of the design.

Top level verification:
The flow chart shows the design verification strategy as block/module or IP level of the design.
```

Observação:

O segundo item parece ter uma inconsistência textual no slide, pois fala “Top level verification” mas repete “block/module or IP level”. A intenção provável é distinguir estratégia de verificação em nível de bloco/IP e em nível top/system.

Interpretação:

Em nível de bloco, o ambiente é mais controlado. Em nível top, o foco é integração, interfaces entre blocos, cenários de sistema e reutilização de verification components.

---

#### Fluxograma de estratégia

A figura mostra uma sequência de etapas:

```text
Study design under test and related specifications
↓
Study design requirements for functional features and test priorities
↓
Review design requirements with chip architects and design block owners
↓
Define requirements for verification environment and identify reusable VCs
↓
Review testbench architecture
↓
Design testbench using reusable VCs
↓
Code test cases per the testbench and verification plan, assertions, and functional cover points
↓
Complete verification for 100% functional and code coverage
↓
Review code coverage numbers and determine/remove redundant codes from the design
↓
Sign off module level verification against the verification plan
```

Interpretação:

Esse fluxograma é muito importante porque mostra verificação como processo planejado.

Não se começa escrevendo testes aleatórios. Primeiro:

```text
entende o DUT
entende requisitos
define prioridades
define ambiente
define VCs reutilizáveis
define arquitetura de testbench
só então escreve testes, assertions e cover points
```

Depois, a conclusão depende de:

```text
functional coverage
code coverage
review de cobertura
remoção ou análise de código redundante
signoff contra o verification plan
```

---

### Slide 5 — Coverage Driven Verification

O slide apresenta CDV com foco na arquitetura de testbench.

Título:

```text
Coverage Driven Verification
```

Ponto principal:

```text
Test bench architecture
```

A página contém duas figuras importantes.

---

#### Figura 1 — Coverage vs. Time

A figura mostra uma curva de cobertura ao longo do tempo.

Elementos visíveis:

```text
Preliminary Verification
Build verification environment
Broad-Spectrum Verification
Corner-case Verification
Directed tests can take care of this
Difficult to reach 100% convergence
customized directed tests can take care of this
Goal
% Coverage
Time
```

Interpretação:

A curva mostra que a cobertura cresce em fases:

#### 1. Preliminary verification

No começo, a cobertura é baixa porque o ambiente ainda está sendo criado e os primeiros testes são simples.

#### 2. Build verification environment

Há um período de construção do ambiente de verificação. O foco ainda não é cobertura máxima, mas infraestrutura.

#### 3. Broad-spectrum verification

Depois, testes amplos aumentam rapidamente a cobertura. Aqui entram testes randomizados, regressões e cenários gerais.

#### 4. Corner-case verification

Mais tarde, a cobertura fica difícil de aumentar. Os casos restantes são corner cases.

#### 5. Directed tests para fechar buracos

A figura indica que testes direcionados/customizados podem atingir regiões difíceis de cobertura.

Mensagem central:

```text
random e broad-spectrum tests aumentam cobertura rapidamente,
mas os últimos pontos geralmente exigem testes direcionados.
```

---

#### Figura 2 — Test bench architecture

A figura mostra uma arquitetura de testbench com blocos:

```text
Stimulus
Configure
Generator
Transaction
Driver
DUT
Monitor
Transaction
Coverage
Self Check
```

Também aparecem funções associadas:

```text
Configures testbench and DUT
Checks completeness
Checks correctness
Identifies transactions
Observes data from DUT
Creates random transactions
Executes transactions
Drive DUT
Interfaces
```

Interpretação:

A arquitetura mostra um testbench moderno orientado a transações e cobertura.

Fluxo simplificado:

```text
stimulus/configure define o cenário
generator cria transações
driver transforma transações em sinais no DUT
monitor observa o DUT e reconstrói transações
coverage mede o que foi exercitado
self check verifica correção
```

Essa figura conecta com conceitos já vistos em SystemVerilog/UVM:

```text
generator
driver
monitor
scoreboard/self-check
coverage
transaction
DUT
```

---

### Slide 6 — Accellera Standard

O slide apresenta a Accellera.

Texto principal:

```text
Accellera Systems Initiative is an independent, not-for-profit organization dedicated to create,
support, promote, and advance system-level design, modeling, and verification standards
for use by the worldwide electronics industry.
```

Tradução:

```text
Accellera Systems Initiative é uma organização independente, sem fins lucrativos,
dedicada a criar, apoiar, promover e avançar padrões de design, modelagem e verificação
em nível de sistema para uso pela indústria eletrônica mundial.
```

O slide também mostra:

```text
Official website is www.accellera.org
```

Interpretação:

A Accellera é importante porque muitas metodologias e padrões usados em verificação vêm de iniciativas padronizadas pela indústria.

A figura mostra uma linha histórica de padrões Accellera, com vários itens como:

```text
OVL
V-AMS
SV
PSL
UPF
IP-XACT
```

e integração/transferência para padrões IEEE em alguns casos.

A mensagem prática é:

```text
metodologias de verificação modernas não são apenas práticas internas;
muitas são apoiadas por padrões industriais.
```

---

## Aula didática desenvolvida

### 1. A meta da verificação não é “chegar a 100% de um número”

O slide de abertura corrige uma confusão comum.

É tentador pensar:

```text
100% code coverage = design verificado
```

Mas o curso deixa claro:

```text
completude não implica correção
```

A cobertura é uma evidência, não uma prova absoluta.

Um design pode executar todas as linhas e ainda estar errado se:

```text
o checker não verifica a saída corretamente
o plano funcional está incompleto
a especificação foi mal interpretada
um requisito não foi implementado
o testbench aceita comportamento inválido
```

---

### 2. Code coverage é sinal de alerta, não certificado final

A frase mais útil do slide é:

```text
Code coverage lets you know if you are not done.
```

Se code coverage está baixa, você sabe que ainda há código não exercitado.

Mas se code coverage está alta, você ainda precisa olhar:

```text
functional coverage
checkers
assertions
corner cases
requirements coverage
review do plano de teste
```

Então, code coverage é muito boa para encontrar buracos estruturais, mas não garante sozinho que o design está correto.

---

### 3. Functional coverage completa o olhar

Functional coverage nasce do plano de verificação.

Ela pergunta:

```text
os requisitos importantes aconteceram?
os valores de fronteira foram exercitados?
as sequências críticas ocorreram?
as combinações relevantes foram testadas?
```

Exemplo:

Para uma interface de barramento, functional coverage pode verificar:

```text
read e write
burst sizes
endereços alinhados e desalinhados
respostas de erro
wait states
backpressure
reset durante transação
```

Isso é qualitativo porque depende da intenção do design.

---

### 4. Por que code coverage e functional coverage se complementam?

O slide dá dois cenários importantes.

#### Caso A — 100% code coverage, 50% functional coverage

Todo o código foi executado, mas metade do plano funcional não foi coberto.

Interpretação:

```text
o design não foi funcionalmente verificado o suficiente
```

#### Caso B — 50% code coverage, 100% functional coverage

Todo o plano funcional foi coberto, mas metade do código não foi executado.

Interpretação:

```text
o plano funcional pode estar incompleto
ou o código tem features não documentadas
ou há código morto/redundante
```

Conclusão:

```text
é preciso olhar as duas métricas.
```

---

### 5. Test Done = Test Plan Executed and All Code Executed

A fórmula do slide é:

```text
Test Done = Test Plan Executed and All Code Executed
```

Essa frase resume o critério de conclusão.

Mas ela deve ser lida com cuidado:

```text
Test Plan Executed
```

significa que os requisitos funcionais relevantes foram exercitados.

```text
All Code Executed
```

significa que o código implementado foi estruturalmente visitado.

O ideal é cruzar:

```text
functional coverage
code coverage
assertions
checkers
reviews
bug status
risk analysis
```

para chegar ao signoff.

---

### 6. Tecnologias de verificação: cada uma tem seu papel

A aula mostra que nenhuma tecnologia cobre tudo.

#### Event-driven simulation

Boa para:

```text
debug interativo
fase de codificação
flexibilidade
waveforms detalhadas
```

#### Cycle-based simulation

Boa para:

```text
regressão
performance
capacidade
designs síncronos
```

#### Emulation/acceleration

Boa para:

```text
sistema completo
software real
cenários longos
ambiente realista
alta capacidade
```

#### Formal/equivalence checking

Boa para:

```text
provar propriedades
checar equivalência entre transformações
verificação de implementação
```

A estratégia moderna combina várias delas.

---

### 7. Estratégia de verificação começa pela especificação

O fluxograma do slide começa com:

```text
Study design under test and related specifications
```

Isso é fundamental. Não se escreve testbench antes de entender:

```text
o que o bloco deveria fazer?
quais são os requisitos?
quais features são críticas?
quais interfaces existem?
quais prioridades de teste?
quais corner cases?
```

Verificação ruim geralmente começa com especificação mal entendida.

---

### 8. Verification plan é o eixo do processo

O fluxo mostra que testes, assertions e cover points devem vir do plano.

Sem plano, a verificação vira uma coleção de testes soltos.

Com plano, cada item tem propósito:

```text
requisito → teste → checker/assertion → coverage point → signoff
```

Essa rastreabilidade é o que permite dizer que a verificação está completa.

---

### 9. Reusable VCs

O fluxograma fala em identificar e usar **reusable VCs**.

VC significa Verification Component.

Exemplos:

```text
driver reutilizável de barramento
monitor de protocolo
checker de interface
coverage collector
agent UVM
modelo de memória
scoreboard
```

A reutilização reduz esforço e aumenta consistência entre projetos.

---

### 10. Coverage vs Time: por que o final é difícil?

A figura de coverage vs time mostra uma curva típica:

```text
começo lento
crescimento rápido
platô difícil perto do final
```

No começo, você constrói o ambiente. Depois, testes amplos cobrem muito. No fim, restam casos raros:

```text
corner cases
combinações específicas
condições de erro
interações entre features
transições raras
```

Esses últimos pontos geralmente exigem testes direcionados.

---

### 11. Broad-spectrum verification versus corner-case verification

#### Broad-spectrum verification

Busca exercitar muitos cenários de forma ampla.

Pode usar:

```text
randomização
constrained random
regressões grandes
testes generalistas
```

#### Corner-case verification

Busca cenários específicos e difíceis.

Exemplos:

```text
FIFO cheia e reset simultâneo
erro de protocolo no último beat de burst
overflow em limite máximo
clock gating durante transação
interrupção no ciclo exato de resposta
```

Para fechar cobertura, corner cases muitas vezes precisam de testes direcionados.

---

### 12. Arquitetura de testbench no slide

A figura do testbench mostra uma estrutura parecida com UVM.

Componentes:

```text
stimulus
configure
generator
transaction
driver
monitor
coverage
self check
DUT
```

Fluxo conceitual:

```text
generator cria transações
driver aplica no DUT
monitor observa respostas
coverage mede completude
self check mede correção
```

Essa separação é importante:

```text
coverage responde: aconteceu?
self check responde: estava correto?
```

---

### 13. Coverage não substitui self-check

A figura separa `coverage` e `self check`.

Isso é didaticamente muito importante.

Coverage pode dizer:

```text
a transação READ ocorreu
```

Mas self-check diz:

```text
a resposta do READ estava correta
```

Um teste pode ter cobertura alta e ainda não detectar erro se não houver self-check adequado.

---

### 14. Accellera e padronização

A aula fecha com Accellera porque verificação moderna depende de padrões.

Padrões ajudam em:

```text
interoperabilidade de ferramentas
metodologias compartilhadas
bibliotecas reutilizáveis
linguagens e formatos comuns
adoção industrial
```

No contexto do curso, Accellera está relacionada a padrões como SystemVerilog, UVM, OVL, PSL, UPF e IP-XACT, que aparecem em diferentes etapas do fluxo de design e verificação.

---

## Conceitos difíceis explicados em profundidade

### 1. Completude versus correção

#### Completude

Pergunta:

```text
o teste passou por tudo que deveria passar?
```

Métricas:

```text
code coverage
functional coverage
requirements coverage
```

#### Correção

Pergunta:

```text
o comportamento observado estava certo?
```

Mecanismos:

```text
checkers
scoreboards
assertions
reference models
self-checking tests
```

Um ambiente forte precisa dos dois.

---

### 2. Coverage alta sem checker é perigosa

Imagine um teste que gera milhares de transações e cobre todos os casos, mas nunca compara a saída com o valor esperado.

Resultado:

```text
coverage alta
bugs não detectados
falso senso de segurança
```

Por isso, cobertura deve andar junto com checking.

---

### 3. Code coverage baixa é um diagnóstico claro

Se uma parte do código nunca foi executada, há três possibilidades principais:

```text
falta teste
código é inalcançável/dead code
feature não está no plano
```

Todas exigem ação:

```text
adicionar teste
remover código
atualizar especificação/plano
justificar exclusão
```

---

### 4. Functional coverage baixa pode revelar falha de planejamento

Se a functional coverage está baixa, talvez os testes não estejam atingindo cenários importantes.

Mas também pode indicar:

```text
coverpoints mal definidos
bins irreais
restrições de randomização impedindo cenários
testbench incapaz de gerar determinado caso
```

A cobertura não é só resultado; ela também testa a qualidade do próprio plano.

---

### 5. 100% functional coverage e 50% code coverage

Esse caso é muito didático.

Ele mostra que o plano funcional pode estar incompleto.

Se há código não exercitado, pergunte:

```text
esse código implementa requisito?
é feature não documentada?
é código morto?
é branch defensivo?
é caso de erro raro?
é redundância?
```

Não se ignora code coverage baixa só porque functional coverage chegou a 100%.

---

### 6. Testbench generation tools

Ferramentas que geram estímulos para cobrir código são úteis, mas há uma limitação:

```text
elas podem aumentar code coverage sem aumentar compreensão funcional.
```

Elas ajudam a chegar em lugares não exercitados, mas o engenheiro precisa validar se esses lugares importam e se há checkers adequados.

---

### 7. Profiling com coverage

Quando se desenvolve um modelo apenas para simulação, performance importa muito.

Coverage/profiling pode mostrar:

```text
quais funções são chamadas mais vezes?
quais branches são executados o tempo todo?
quais loops dominam o tempo de simulação?
```

Isso ajuda a otimizar a velocidade do ambiente de verificação.

---

### 8. Event-driven versus cycle-based dentro da estratégia

Event-driven é excelente para depurar detalhes, mas pode ser lento.

Cycle-based é excelente para regressão, mas exige design síncrono e timing verificado separadamente.

A estratégia certa pode ser:

```text
usar event-driven enquanto RTL está mudando muito
usar cycle-based para regressões grandes
usar emulation para software/sistema completo
usar formal para propriedades e equivalência
```

---

### 9. Emulation não substitui simulação detalhada

Emulação é rápida e tem alta capacidade, mas debug pode ser mais difícil e setup mais caro.

Simulação ainda é melhor para:

```text
debug fino
observabilidade ampla
waveforms detalhadas
testes pequenos e isolados
```

A boa metodologia combina as duas.

---

### 10. Signoff de verificação

Signoff não é apenas “todos os testes passaram”.

Um signoff sério considera:

```text
verification plan completo
functional coverage fechada
code coverage analisada
assertions limpas
bugs críticos fechados
waivers revisados
código não coberto justificado/removido
regressão estável
review com arquitetos e owners
```

O fluxograma do slide termina exatamente com:

```text
Sign off module level verification against the verification plan
```

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — Verification Goal

A parte superior da página 1 explica que code coverage mede quanto o código foi exercitado, mas não prova correção. O ponto mais importante é a frase: **Completeness does not imply correctness**.

### Página 1 — Coverage as a Completion Metric

A parte inferior compara situações de 100% code coverage com apenas 50% functional coverage e 50% code coverage com 100% functional coverage. A frase central é: **Test Done = Test Plan Executed and All Code Executed**.

### Página 2 — Verification Technologies

A figura mostra várias tecnologias de verificação em um mapa: event-driven simulation, cycle-based simulation, emulation e equivalence checking/formal methods, aplicadas a fases como specification validation, functional verification, in-system verification e implementation verification.

### Página 2 — Verification Strategy

O fluxograma da página 2 mostra a estratégia de verificação desde estudar o DUT e especificações até signoff contra o verification plan. Ele reforça que verificação começa em requisitos e termina em cobertura, revisão e signoff.

### Página 3 — Coverage Driven Verification

A figura de cobertura versus tempo mostra as fases: preliminary verification, build verification environment, broad-spectrum verification, corner-case verification e directed/customized tests para fechar buracos de cobertura.

### Página 3 — Test bench architecture

A arquitetura de testbench mostra stimulus/configure/generator/transaction/driver/monitor/coverage/self-check/DUT. Ela separa claramente **coverage** de **self-check**, mostrando que uma mede completude e a outra verifica correção.

### Página 3 — Accellera Standard

A figura final mostra uma linha histórica de padrões Accellera, indicando que design, modelagem e verificação usam padrões industriais para interoperabilidade e metodologia.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Qual é a dificuldade principal em designs complexos segundo o slide Verification Goal?**  
   Verificar 100% da lógica e das funcionalidades em todos os cenários de uso.

2. **O que significa “Completeness does not imply correctness”?**  
   Que completar cobertura ou exercitar código não prova automaticamente que o design ou a verificação estão corretos.

3. **O que code coverage indica?**  
   O quanto a suíte de verificação exercitou o código-fonte.

4. **O que code coverage não indica?**  
   A correção da suíte de verificação ou do design.

5. **Para que code coverage deve ser usada?**  
   Para identificar corner cases não exercitados e features dependentes da implementação que surgiram durante a implementação.

6. **Code coverage deve ser o único indicador de conclusão?**  
   Não.

7. **O que significa dizer que code coverage lets you know if you are not done?**  
   Cobertura baixa mostra que a verificação ainda não está completa; cobertura alta não prova que acabou.

8. **Como ferramentas podem ajudar a alcançar 100% coverage?**  
   Gerando estímulos automaticamente para exercitar seções de código ainda não cobertas.

9. **Como code coverage tools podem ser usadas como profilers?**  
   Identificando linhas executadas com maior frequência em modelos de simulação, para otimização de performance.

10. **É possível ter 100% code coverage e 50% functional coverage?**  
    Sim. Nesse caso, o design/verificação funcional ainda está incompleto.

11. **É possível ter 50% code coverage e 100% functional coverage?**  
    Sim. Isso pode indicar que o modelo de cobertura funcional está faltando features ou que há código não testado fora do plano.

12. **O que deve acontecer com features não testadas?**  
    Devem ser testadas ou removidas.

13. **Qual a diferença entre code coverage e functional coverage no slide?**  
    Code coverage é quantitativa; functional coverage é qualitativa.

14. **Qual é a fórmula/frase de conclusão do slide?**  
    `Test Done = Test Plan Executed and All Code Executed`.

15. **Por que diferentes tecnologias de verificação são usadas?**  
    Para atingir máxima cobertura dependendo dos requisitos do design.

16. **Para que é usada event-driven simulation?**  
    Para simulação interativa na fase de codificação, com flexibilidade, turnaround rápido e bons recursos de debug.

17. **Para que é usada cycle-based simulation?**  
    Para regressão no design, oferecendo maior performance e capacidade.

18. **Para que são usadas emulation and acceleration?**  
    Para in-system verification, maior performance, maior capacidade e ambiente real de sistema.

19. **De que depende a estratégia de verificação?**  
    Complexidade do design, tamanho do design e criticidade do bloco.

20. **Qual é o primeiro passo do fluxograma de estratégia?**  
    Estudar o design under test e as especificações relacionadas.

21. **O que deve ser feito após estudar requisitos funcionais e prioridades?**  
    Revisar requisitos com arquitetos do chip e donos dos blocos de design.

22. **O que deve ser identificado ao definir o ambiente de verificação?**  
    Requisitos do ambiente e VCs reutilizáveis.

23. **O que é feito antes do signoff?**  
    Completar 100% functional/code coverage, revisar coverage numbers, remover códigos redundantes e assinar contra o verification plan.

24. **O que a figura Coverage vs Time mostra?**  
    Que a cobertura cresce em fases e os últimos pontos/corner cases são difíceis de fechar, muitas vezes exigindo directed tests.

25. **Quais componentes aparecem na arquitetura de testbench?**  
    Stimulus, configure, generator, transaction, driver, monitor, coverage, self-check e DUT.

26. **Qual a diferença entre coverage e self-check na arquitetura?**  
    Coverage mede se cenários foram exercitados; self-check verifica se as respostas estão corretas.

27. **O que é Accellera Systems Initiative?**  
    Organização independente e sem fins lucrativos dedicada a criar, apoiar, promover e avançar padrões de design, modelagem e verificação em nível de sistema.

### Pegadinhas

- 100% code coverage não prova design correto.
- Code coverage baixa prova que ainda há trabalho; code coverage alta não prova fim.
- Functional coverage pode estar 100% mesmo com código não executado.
- Code coverage e functional coverage são complementares, não substitutas.
- Functional coverage depende da qualidade do test plan.
- Features não testadas devem ser testadas ou removidas.
- Coverage mede completude; checking mede correção.
- Event-driven simulation é boa para debug interativo, mas não necessariamente para máxima capacidade.
- Cycle-based simulation é boa para regressão e performance, mas depende de design síncrono e abstrações.
- Emulation/acceleration não elimina necessidade de simulação e debug detalhado.
- Signoff de verificação deve ser contra o verification plan, não apenas contra uma lista de testes passados.

### Frases para memorizar

```text
Completude não implica correção.
Code coverage mostra o que foi exercitado, não se estava correto.
Code coverage diz quando você não terminou; não prova que terminou.
Functional coverage é qualitativa; code coverage é quantitativa.
Test Done = Test Plan Executed and All Code Executed.
Event-driven simulation é flexível e boa para debug.
Cycle-based simulation é rápida e boa para regressão.
Emulation oferece alta performance e ambiente mais real.
Coverage mede completude; self-check mede correção.
Signoff deve ser feito contra o verification plan.
```

---

## Relação com projeto/laboratório

Esta aula é diretamente aplicável quando você começa a organizar a verificação de um bloco ou IP.

### Fluxo prático de verificação

```text
1. Ler especificação do DUT.
2. Extrair requisitos funcionais.
3. Definir prioridades de teste.
4. Revisar requisitos com arquitetos/design owners.
5. Definir ambiente de verificação.
6. Identificar VCs reutilizáveis.
7. Projetar arquitetura de testbench.
8. Criar stimulus/generator/driver/monitor/checker/coverage.
9. Rodar regressões.
10. Medir functional coverage e code coverage.
11. Fechar buracos com testes direcionados.
12. Revisar código não coberto.
13. Fazer signoff contra o plano.
```

### Exemplo de uso conjunto de coverage

Para um bloco ALU:

#### Code coverage

Mede:

```text
todas as linhas do RTL executaram?
todos os branches do case foram visitados?
todas as expressões foram exercitadas?
```

#### Functional coverage

Mede:

```text
todas as operações foram testadas?
overflow foi testado?
zero flag foi testada?
operações foram testadas com operandos limites?
operação × tipo de operando foi coberto?
```

#### Self-check

Verifica:

```text
resultado da ALU bate com reference model?
flags estão corretas?
comportamento inválido é tratado?
```

### Checklist prático

- [ ] Existe verification plan?
- [ ] Cada requisito tem teste ou coverage point?
- [ ] O testbench é self-checking?
- [ ] Há coverage funcional?
- [ ] Há code coverage?
- [ ] Buracos de coverage foram analisados?
- [ ] Código não coberto foi testado, removido ou justificado?
- [ ] Há directed tests para corner cases?
- [ ] Há regressão automatizada?
- [ ] O signoff foi feito contra o plano, não apenas contra “simulação passou”?

---

## Necessidade de áudio

**Baixo a médio.**

Os slides são poucos e bastante textuais, então a reconstrução está bem fundamentada pelos prints. A fala do professor poderia ajudar em:

- exemplos práticos de 100% code coverage com baixa functional coverage;
- como o curso espera interpretar “Test Done = Test Plan Executed and All Code Executed”;
- detalhes da figura de tecnologias de verificação;
- exemplos de reusable VCs;
- explicação da linha histórica da Accellera.

Mesmo sem áudio, os conceitos essenciais estão claros pelos slides.

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Diferença entre code coverage e functional coverage foi aprofundada.
- [x] Estratégias e tecnologias de verificação foram organizadas.
- [x] Arquitetura de testbench foi explicada.
- [x] Accellera foi contextualizada.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado seguindo o roteiro.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

**Bloco 025 — 03 Hardware Verification Languages**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\03 Hardware Verification Languages.docx
```

Faixa:

```text
Slides 1-19
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\03 Hardware Verification Languages.md
```
