# 04 VCS and Verdi Debug Environment

## Controle do bloco

- **Bloco:** 026
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\05 Design Verification\04 VCS and Verdi Debug Environment.docx`
- **Faixa processada:** seção visível de **VCS, Verdi Debug Environment e Coverage Monitoring**, localizada nas páginas finais do DOCX renderizado.
- **Observação sobre o arquivo:** o DOCX renderizado contém, nas páginas iniciais, slides repetidos do bloco anterior sobre **Hardware Verification Languages**. Nesta aula, para evitar redundância, o conteúdo novo processado começa em **Simulator: VCS (1/2)** e segue até **Coverage Monitoring**.
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\04 VCS and Verdi Debug Environment.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** o bloco atual corresponde ao `026 — 04 VCS and Verdi Debug Environment`. O próximo bloco deve ser confirmado no roteiro antes de anexar o próximo DOCX, porque este arquivo não mostra claramente a tela final de sequência.
- **Próximo bloco recomendado:** confirmar no roteiro.
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco é mais prático. Ele sai da discussão geral sobre metodologias e entra no uso de ferramentas Synopsys para simulação, debug e cobertura: **VCS** como simulador funcional e **Verdi** como ambiente de debug/análise.

---

## Resumo executivo

Esta aula apresenta o ambiente de simulação e debug usando **VCS** e **Verdi**.

O ponto central é:

```text
VCS executa a simulação funcional.
Verdi ajuda a depurar, visualizar, analisar waveforms, esquemáticos, FSDB e relatórios de cobertura.
```

A aula posiciona o **VCS** como uma solução de verificação funcional com recursos como:

```text
simulador com constraint solver;
suporte a múltiplas linguagens HDL;
suporte a SystemVerilog avançado;
verification planning;
coverage analysis;
integração com Verdi;
logic simulation;
debug de design;
monitoramento de coverage;
checagem com assertions.
```

Depois, a aula apresenta o fluxo de simulação em três grandes etapas:

```text
Design Analysis
Elaboration / Compilation
Simulation
```

A etapa de **Design Analysis** analisa os arquivos do design, verifica construtos corretos, identifica referências ausentes e prepara a base para depuração. A etapa de **Elaboration/Compilation** cria instâncias únicas, compila o design e gera o executável de simulação. Por fim, a etapa de **Simulation** executa a simulação do design.

Em seguida, a aula mostra como preparar a simulação para debug. Existem dois modos principais:

```text
Interactive debug
Postprocessing debug
```

No **interactive debug**, a simulação pode ser parada e controlada durante a execução, como em um ambiente de programação procedural com step-by-step. No **postprocessing debug**, a simulação gera um arquivo **FSDB** com sinais, transações e mensagens, que depois é aberto no Verdi para análise.

O Verdi é apresentado como uma interface gráfica com acesso a:

```text
hierarquia do design;
código-fonte;
console;
mensagens;
valores dinâmicos;
waveforms;
schematic viewer;
coverage reports;
source code coverage;
coverage detail;
exclusion manager.
```

A parte final mostra **Coverage Monitoring**, explicando que o ambiente integrado permite gerar bases de cobertura durante a simulação e analisá-las no Verdi. A cobertura é dividida em:

```text
Code Coverage
Functional Coverage
```

A **code coverage** inclui cobertura de fluxo de controle e de valores:

```text
line coverage;
branch coverage;
condition coverage;
toggle coverage;
FSM coverage.
```

A **functional coverage** envolve:

```text
covergroups;
cover properties;
assertions.
```

A conclusão prática é:

```text
VCS roda e coleta.
Verdi visualiza, depura e analisa.
FSDB é a ponte central para debug pós-simulação.
Coverage database permite medir o progresso da verificação.
```

---

## Texto extraído e organizado por slide

### Slide 1 — Simulator: VCS (1/2)

O slide apresenta o VCS como solução de verificação funcional.

Texto principal:

```text
VCS is one of the functional verification solutions with following features:
```

Recursos listados:

```text
Simulator with constraint solver engine.

Supports multiple hardware description languages including legacy support
and advanced SystemVerilog.

Verification planning.

Coverage analysis.

Integrated to debug analysis tool such as Verdi debug platform.
```

Interpretação:

O VCS não é apenas um simulador simples de HDL. Ele faz parte de um ambiente de verificação funcional mais amplo.

Ele suporta:

```text
HDLs clássicas;
SystemVerilog avançado;
constrained random;
assertions;
coverage;
integração com debug.
```

O item **constraint solver engine** é especialmente importante para ambientes SystemVerilog/UVM, porque constrained random verification depende de resolver constraints para gerar estímulos válidos.

Exemplo:

```systemverilog
rand bit [7:0] addr;

constraint aligned {
  addr[1:0] == 2'b00;
}
```

O solver do simulador precisa gerar valores de `addr` que respeitam a constraint.

---

#### Atividades suportadas pelo VCS

O slide afirma:

```text
VCS supports the following activities:
```

Lista:

```text
Logic simulation.

Design debugging tasks.

Monitor coverage to track the status of verification process and completion.

Check design correctness using assertions.
```

Interpretação:

O VCS atua em quatro frentes:

#### 1. Logic simulation

Executa o comportamento lógico do design e do testbench.

#### 2. Design debugging tasks

Permite depurar problemas encontrados durante a simulação, especialmente quando integrado ao Verdi.

#### 3. Monitor coverage

Gera dados de cobertura para acompanhar o progresso da verificação.

#### 4. Assertions

Executa checagens embutidas no código, como propriedades temporais e regras de protocolo.

Exemplo conceitual:

```systemverilog
assert property (@(posedge clk) req |-> ##[1:3] ack);
```

Essa assertion verifica se, quando `req` ocorre, `ack` aparece entre 1 e 3 ciclos depois.

---

### Slide 2 — Simulator: VCS (2/2)

O slide mostra as etapas de simulação.

Texto principal:

```text
Simulation steps are shown in figure.
```

A figura mostra três blocos principais:

```text
Design Analysis
Elaboration / Compilation
Simulation
```

---

#### Design Analysis

Texto do slide:

```text
Design analysis: In this step design files are analyzed for correct constructs
and missing references.
```

A figura descreve:

```text
Analyzing the design and linking to logic library and preparing the database
for debug environment.
```

Interpretação:

Nesta etapa, o VCS lê e analisa os arquivos HDL. Ele verifica:

```text
sintaxe;
construtos válidos;
módulos/entities encontrados;
referências ausentes;
dependências;
bibliotecas;
ligações com modelos lógicos.
```

Se há erro de sintaxe ou instância de módulo inexistente, o problema aparece aqui.

Exemplo de problema:

```text
top.sv instancia alu_unit,
mas alu_unit.sv não foi incluído no filelist.
```

O VCS pode acusar referência ausente.

---

#### Design database

Texto do slide:

```text
Design database prepares the environment for debugging it further.
```

Interpretação:

A base de dados do design permite que ferramentas como Verdi naveguem na hierarquia, relacionem sinais ao código-fonte e habilitem recursos de debug.

Sem dados adequados de debug, a simulação pode até rodar, mas será mais difícil inspecionar sinais, hierarquia e waveforms depois.

---

#### Links to logic library

O slide também lista:

```text
Links to logic library.
```

Interpretação:

A simulação pode precisar se conectar a bibliotecas lógicas, especialmente quando há:

```text
gate-level netlist;
standard cell models;
bibliotecas Verilog de células;
modelos de primitives;
IP models.
```

No nível RTL simples, isso pode ser menos visível. No nível gate-level, é essencial.

---

#### Elaboration / Compilation

Texto do slide:

```text
Elaboration/Compilation: In this step, the simulator uses the intermediate files
for design compilation and generates simulation executable.
```

A figura descreve:

```text
Elaboration: Creating unique instances and Compilation.
```

Interpretação:

Elaboration é a etapa em que a ferramenta resolve a hierarquia do design.

Ela cria instâncias concretas a partir das definições de módulos/classes/interfaces.

Exemplo:

```systemverilog
alu u_alu0 (...);
alu u_alu1 (...);
```

Há uma única definição de `alu`, mas duas instâncias únicas no design elaborado:

```text
top.u_alu0
top.u_alu1
```

A compilação gera o executável de simulação.

No fluxo Synopsys, esse executável costuma ser chamado:

```text
simv
```

---

#### Simulation

Texto do slide:

```text
Simulation: Simulates the design using execution script generated in elaboration stage.
```

A figura resume:

```text
Design simulation.
```

Interpretação:

Depois de analisar e elaborar/compilar, a simulação é executada.

Nessa etapa:

```text
clock e reset são aplicados;
testbench gera estímulos;
DUT responde;
assertions são avaliadas;
coverage é coletada;
waveforms/FSDB podem ser gerados;
logs são produzidos.
```

O slide conclui:

```text
There are different options which enable different simulation features
at each of the above step.
```

Interpretação:

Cada etapa possui opções específicas de comando que habilitam debug, coverage, assertions, waveforms, linguagem, bibliotecas etc.

---

### Slide 3 — Simulation with Debug Environment

O slide explica que a simulação precisa ser preparada para debug.

Texto principal:

```text
Design simulation requires some additional features to be enabled with options
to make it debug ready.
```

Tradução:

```text
A simulação do design requer recursos adicionais habilitados por opções
para deixá-la pronta para debug.
```

Pontos listados:

```text
The options are enabled during elaboration and compilation.

The simulation for debug flow is shown in the figure.
```

Interpretação:

Nem toda simulação gera automaticamente todos os dados necessários para debug profundo.

Para depurar no Verdi, geralmente é necessário habilitar opções específicas no VCS para:

```text
acesso à hierarquia;
dump de sinais;
dump de transações;
debug de classes;
debug de UVM;
FSDB;
código-fonte relacionado ao waveform.
```

---

#### Dois modos de debug

O slide afirma:

```text
Design debug is done during simulations in two ways:
```

Modos:

```text
Interactive debug
Postprocessing debug
```

---

#### Interactive debug

Texto do slide:

```text
Simulation stopped in between for user interruptions and proceeding similar to
single step execution in high level programming environment.

Debug tool is automatically invoked during simulation for user interaction.
```

Interpretação:

No debug interativo, o usuário acompanha e controla a simulação em tempo de execução.

É semelhante a depurar software:

```text
parar em determinado ponto;
avançar passo a passo;
inspecionar sinais;
inspecionar variáveis;
controlar execução;
analisar hierarquia ao vivo.
```

Esse modo é útil quando se quer entender exatamente o que acontece durante a simulação.

---

#### Postprocessing debug

Texto do slide:

```text
The fast signal database (FSDB) file is written out during simulation run
and file is used later in debug tool for analysis.

The FSDB stores the simulation results, including transaction data and logged messages
from System Verilog Testbench (SVTB) or other applicable languages, in an efficient
and compact format that allows data to be accessed quickly.
```

Interpretação:

No debug pós-processamento, a simulação roda e gera um arquivo FSDB.

Depois, o Verdi abre esse FSDB para análise.

Esse fluxo é muito comum porque permite:

```text
rodar simulação em batch;
guardar resultado;
analisar depois;
compartilhar FSDB;
abrir waveforms sem rerodar simulação;
depurar regressões.
```

O FSDB é importante porque armazena sinais, transações e mensagens de forma eficiente.

---

### Slide 4 — Verdi Debug Environment: User Interface

O slide mostra a interface do usuário do Verdi.

Texto principal:

```text
Verdi debug environment is shown in the figure.
```

Pontos listados:

```text
Through the debug environment, the simulator can be stopped and rerun again interactively.

The graphical user interface (GUI) provides easy access to internal design elements
in the design models and their values at run time.

Debugging in post processing mode by writing FSDB file requires certain tool-specific
commands to be inserted in the design testbench.
```

Interpretação:

O Verdi permite tanto debug interativo quanto análise posterior com FSDB.

A interface gráfica organiza:

```text
hierarquia do design;
código-fonte;
mensagens;
console;
valores de sinais;
threads e estados;
waveforms;
painéis de debug.
```

---

#### Elementos visuais da interface

A figura mostra vários painéis e barras. Os rótulos visíveis incluem:

```text
Simulation Control toolbar
Interactive Toolbar
Source Code pane
Design Browser pane
Interactive Console Tab
Message pane
Load and Reference Pane Tabs
Status Bar
Watch pane
```

Também há descrições de painéis:

```text
This pane displays the hierarchy of dynamic objects,
along with all the testbench threads and their status.

This pane displays all the classes defined in the design in a hierarchical view.

This pane displays the static instance tree.

This pane displays the current dynamic objects and their values.
```

Interpretação:

O Verdi é feito para debug de projetos complexos. Ele não mostra apenas waveform. Ele permite navegar por:

```text
instâncias estáticas;
objetos dinâmicos;
classes;
threads do testbench;
valores em runtime;
código-fonte;
mensagens.
```

Isso é especialmente importante em SystemVerilog/UVM, onde há muitos objetos dinâmicos, sequences, transactions e threads.

---

### Slide 5 — Verdi Debug Environment: Waveform and Schematic Viewing

O slide mostra recursos de waveform e schematic.

Texto principal:

```text
Verdi debug environment permits:
```

Itens:

```text
Viewing the schematic of the design.
The snapshot of schematic is shown in the figure.

Viewing waveforms.
The waveform window opens the FSDB file of the design.
```

Interpretação:

O Verdi permite olhar o design de duas formas complementares:

#### 1. Waveform

Mostra a evolução dos sinais no tempo.

É útil para responder:

```text
quando esse sinal mudou?
qual era o valor antes da borda de clock?
qual transação ocorreu?
qual assertion falhou?
qual foi a sequência de eventos?
```

#### 2. Schematic

Mostra a conectividade do design.

É útil para responder:

```text
de onde vem esse sinal?
para onde ele vai?
qual lógica gera essa net?
quais módulos estão conectados?
quais sinais alimentam esse bloco?
```

---

#### Elementos da janela de waveform

A figura de waveform mostra rótulos como:

```text
Signal pane
Signal cursor
Values pane
Waveform pane
Cursor
Full scale ruler
Marker
Zoom scale ruler
```

Interpretação:

Esses elementos ajudam no debug temporal:

```text
Signal pane: lista de sinais.
Values pane: valores no cursor atual.
Waveform pane: formas de onda.
Cursor: ponto de tempo inspecionado.
Marker: marcação de evento importante.
Full scale ruler: escala global.
Zoom scale ruler: escala ampliada.
```

---

#### Schematic viewing

A figura de schematic mostra blocos e conexões em fundo escuro.

Interpretação:

O schematic ajuda a rastrear conectividade visualmente.

Em debug, isso é útil quando o problema não está apenas no valor de um sinal, mas na origem/conexão do sinal.

Exemplo:

```text
um sinal está X;
o schematic ajuda a descobrir qual driver está produzindo X
ou se há múltiplos drivers.
```

---

### Slide 6 — Coverage Monitoring

O slide apresenta monitoramento de cobertura.

Texto principal:

```text
Integrated verification environment supports monitoring design coverage during verification.
```

Pontos listados:

```text
Coverage databases must be generated during simulation.

Different coverage databases generated are the following:
```

Tipos:

```text
Code coverage
Functional Coverage
```

---

#### Code coverage

Texto do slide:

```text
Code coverage monitors control-flow coverage and value coverage.

Control-flow coverage includes line coverage and branch coverage.

Value coverage includes condition coverage, toggle coverage, and FSM coverage.
```

Interpretação:

Code coverage mede o quanto o código RTL foi exercitado.

O slide divide em duas categorias:

#### Control-flow coverage

Mede o fluxo de execução:

```text
line coverage;
branch coverage.
```

Exemplo:

```text
essa linha foi executada?
esse if entrou no then e no else?
esse case visitou todos os branches?
```

#### Value coverage

Mede valores e transições:

```text
condition coverage;
toggle coverage;
FSM coverage.
```

Exemplo:

```text
cada condição booleana assumiu 0 e 1?
cada bit togglou?
cada estado da FSM foi visitado?
cada transição da FSM ocorreu?
```

---

#### Functional coverage

Texto do slide:

```text
Functional Coverage: Consists of cover groups and cover properties/assertions.
```

Interpretação:

Functional coverage mede cenários definidos pelo plano de verificação.

Ela normalmente é escrita pelo engenheiro e se conecta a:

```text
covergroup;
coverpoint;
bins;
cross coverage;
cover property;
assertions.
```

Exemplo conceitual:

```systemverilog
covergroup cg_bus;
  coverpoint burst_len {
    bins small = {[1:4]};
    bins medium = {[5:16]};
    bins large = {[17:64]};
  }

  coverpoint access_type {
    bins read;
    bins write;
  }

  cross burst_len, access_type;
endgroup
```

---

#### Fluxo visual da cobertura

A figura mostra o fluxo:

```text
Design Analysis
  Analyzing the design for coverage

Elaboration/Compilation
  Elaboration and Compilation for coverage

Simulation
  Design simulation for coverage

Analyze Coverage Reports using Verdi
```

Interpretação:

Assim como debug, coverage precisa ser habilitada no fluxo de simulação.

A ferramenta analisa o design com suporte a cobertura, elabora/compila com cobertura, simula coletando dados e depois permite analisar relatórios no Verdi.

---

### Slide 7 — Coverage Monitoring

O slide final mostra análise de relatórios de coverage no Verdi.

Texto principal:

```text
Coverage reports are viewed and analyzed in Verdi.

Snapshot shown in figure.
```

A figura mostra a interface do Verdi com painéis rotulados:

```text
Coverage View Pane
Coverage Source Code Pane
Coverage Detail Pane
Exclusion Manager Pane
```

Interpretação:

O Verdi permite navegar pela cobertura em diferentes níveis:

#### Coverage View Pane

Mostra visão hierárquica ou resumida da cobertura, com indicadores visuais, frequentemente em verde/vermelho, para mostrar partes cobertas e não cobertas.

#### Coverage Source Code Pane

Mostra o código-fonte associado à cobertura. Isso permite ver exatamente quais linhas ou trechos não foram exercitados.

#### Coverage Detail Pane

Mostra detalhes da métrica selecionada, como porcentagens, bins, itens cobertos e não cobertos.

#### Exclusion Manager Pane

Permite gerenciar exclusões de cobertura.

Exclusões são usadas quando determinado código não precisa ou não pode ser coberto, por exemplo:

```text
código defensivo impossível no modo atual;
branch reservado para configuração não usada;
feature desativada;
código legado justificado;
caminho inalcançável por construção.
```

A exclusão deve ser feita com critério e revisão, para não esconder buracos reais de verificação.

---

## Aula didática desenvolvida

### 1. Onde VCS entra no fluxo?

Nas aulas anteriores, o curso explicou conceitos de verificação, testbench, coverage e UVM.

Agora entra a ferramenta prática:

```text
VCS = motor de simulação.
```

Ele compila, elabora e executa o design/testbench.

Em um fluxo típico:

```text
RTL + testbench + bibliotecas + opções
        ↓
VCS análise/elaboração/compilação
        ↓
executável de simulação
        ↓
simulação
        ↓
logs, coverage, FSDB
        ↓
Verdi para debug/análise
```

---

### 2. VCS não é só “rodar o código”

O slide mostra que VCS suporta:

```text
constraint solver;
SystemVerilog avançado;
coverage;
assertions;
debug;
Verdi integration.
```

Isso significa que ele é adequado para ambientes modernos como UVM.

Em UVM, a simulação envolve:

```text
classes;
objetos dinâmicos;
randomização;
constraints;
sequences;
threads;
mailboxes;
events;
assertions;
covergroups.
```

O VCS precisa suportar tudo isso de forma robusta.

---

### 3. Constraint solver no contexto de verificação

O constraint solver é essencial para gerar estímulos randômicos válidos.

Exemplo:

```systemverilog
class packet;
  rand bit [7:0] addr;
  rand bit [3:0] len;

  constraint c_addr { addr inside {[8'h10:8'hF0]}; }
  constraint c_len  { len inside {[1:8]}; }
endclass
```

Quando o testbench chama:

```systemverilog
pkt.randomize();
```

o solver encontra valores que respeitam as constraints.

Sem solver, constrained random verification não funcionaria de forma prática.

---

### 4. As três etapas da simulação

O slide divide em:

```text
Design Analysis
Elaboration/Compilation
Simulation
```

Essa divisão ajuda muito a entender os erros.

#### Erro em Design Analysis

Geralmente envolve:

```text
sintaxe;
arquivo faltando;
módulo não encontrado;
package não importado;
biblioteca ausente;
construto inválido.
```

#### Erro em Elaboration

Geralmente envolve:

```text
parâmetros;
instanciação;
hierarquia;
interfaces;
módulos duplicados;
binding;
incompatibilidade de portas.
```

#### Erro em Simulation

Geralmente envolve:

```text
assertion falhando;
resultado errado;
timeout;
X propagation;
testbench travando;
coverage baixa;
deadlock de UVM;
erro de protocolo.
```

Saber em qual etapa o erro ocorre acelera o debug.

---

### 5. Design database e debug

O slide menciona que a database prepara o ambiente para debug.

Isso é importante porque ferramentas de debug precisam relacionar:

```text
sinal no waveform;
instância na hierarquia;
linha no código-fonte;
objeto UVM;
thread do testbench;
mensagem de log;
transação.
```

Quanto mais informação de debug é preservada na compilação/elaboração, mais rica será a análise no Verdi.

---

### 6. Interactive debug versus postprocessing debug

#### Interactive debug

Você acompanha a simulação enquanto ela roda.

Vantagens:

```text
controle fino;
parar e avançar;
inspecionar valores no momento;
bom para bugs pequenos e determinísticos.
```

Desvantagens:

```text
mais interativo e manual;
pode ser lento;
menos conveniente para regressões longas.
```

#### Postprocessing debug

Você roda a simulação, gera FSDB e analisa depois.

Vantagens:

```text
bom para regressões;
permite abrir resultado depois;
não exige ficar acompanhando;
facilita compartilhar arquivo de debug.
```

Desvantagens:

```text
é preciso ter dumpado os sinais certos;
FSDB pode ficar grande;
se faltou sinal, pode precisar rerodar.
```

---

### 7. FSDB como arquivo central de debug

FSDB significa **Fast Signal Database**.

Ele armazena:

```text
valores de sinais;
mudanças ao longo do tempo;
transações;
mensagens;
informações do testbench;
dados úteis para debug.
```

O Verdi abre o FSDB para mostrar waveforms e permitir análise pós-simulação.

Regra prática:

```text
sem FSDB adequado, debug pós-processamento fica limitado.
```

---

### 8. Por que Verdi é mais que waveform viewer?

Waveform viewer mostra sinais no tempo.

Verdi também permite:

```text
navegar hierarquia;
abrir código-fonte;
rastrear drivers e loads;
ver schematic;
analisar coverage;
ver objetos dinâmicos;
ver mensagens;
integrar com simulação;
depurar UVM/testbench.
```

Por isso o slide chama de debug environment, não apenas waveform tool.

---

### 9. Debug de SystemVerilog/UVM precisa de visão dinâmica

Em RTL puro, a hierarquia estrutural já ajuda bastante.

Em UVM, há muitos objetos que nascem em tempo de simulação:

```text
sequence items;
sequences;
transactions;
components;
threads;
callbacks;
config objects.
```

A interface do Verdi mostra painéis para objetos dinâmicos, classes e threads, porque debug UVM exige enxergar o comportamento dinâmico do testbench.

---

### 10. Waveform: quando usar?

Waveform é ideal para:

```text
entender sequência temporal;
ver reset;
ver handshakes;
ver protocolo;
ver X/Z;
comparar expected vs actual;
inspecionar assertions;
localizar ciclo do erro.
```

Exemplo:

```text
valid ficou alto, mas ready nunca veio.
```

No waveform, isso aparece imediatamente.

---

### 11. Schematic: quando usar?

Schematic é ideal para rastrear conectividade.

Use quando a pergunta for:

```text
quem dirige esse sinal?
de onde vem esse X?
por que esse net está preso?
qual lógica alimenta essa saída?
qual caminho conecta esses módulos?
```

Waveform mostra **o que aconteceu no tempo**. Schematic ajuda a entender **como o circuito está conectado**.

---

### 12. Coverage database

Para coverage aparecer no Verdi, a simulação precisa gerar uma base de cobertura.

O fluxo é:

```text
habilitar coverage no VCS;
compilar/elaborar com coverage;
rodar simulação;
gerar coverage database;
abrir/analisar no Verdi.
```

Sem habilitar coverage, Verdi não terá dados para reportar.

---

### 13. Code coverage em detalhes

O slide divide code coverage em control-flow e value coverage.

#### Line coverage

Verifica se linhas foram executadas.

#### Branch coverage

Verifica se caminhos de decisão foram tomados.

Exemplo:

```systemverilog
if (enable)
  y = a;
else
  y = b;
```

Branch coverage verifica se `enable=1` e `enable=0` ocorreram.

#### Condition coverage

Verifica combinações ou valores de condições.

Exemplo:

```systemverilog
if (a && b)
```

É importante verificar se `a` e `b` tiveram variações relevantes.

#### Toggle coverage

Verifica se bits alternaram 0→1 e 1→0.

Útil para detectar sinais nunca exercitados.

#### FSM coverage

Verifica estados e transições de máquinas de estado.

Exemplo:

```text
IDLE → SETUP → ACCESS → IDLE
```

Se uma transição nunca ocorreu, pode haver cenário não testado.

---

### 14. Functional coverage em detalhes

Functional coverage é definida pelo plano de verificação.

Ela mede intenção, não apenas código.

Exemplo:

```text
todas as operações da ALU foram testadas?
todos os tamanhos de burst foram testados?
endereços alinhados e desalinhados foram testados?
erro de protocolo foi exercitado?
reset durante transação ocorreu?
```

No SystemVerilog, isso aparece como:

```text
covergroups;
coverpoints;
bins;
crosses;
cover properties.
```

---

### 15. Assertions e coverage

O slide conecta functional coverage com:

```text
cover properties/assertions
```

Assertions normalmente verificam que algo **sempre** deve ser verdadeiro.

Cover properties verificam que algo **aconteceu**.

Exemplo:

```systemverilog
assert property (@(posedge clk) req |-> ##[1:3] ack);
cover  property (@(posedge clk) req ##[1:3] ack);
```

A primeira detecta violação. A segunda mede se o cenário ocorreu.

---

### 16. Exclusion Manager

O slide final mostra o Exclusion Manager.

Isso é importante porque nem todo código não coberto deve obrigatoriamente ser coberto.

Alguns trechos podem ser:

```text
inalcançáveis;
dependentes de configuração desativada;
código defensivo;
features fora do escopo;
branches para segurança;
código de erro impossível no ambiente atual.
```

Mas exclusões precisam ser justificadas. Caso contrário, podem esconder falhas reais de cobertura.

---

## Conceitos difíceis explicados em profundidade

### 1. Análise, elaboração e simulação não são a mesma coisa

Um iniciante pode pensar que “simular” é uma etapa única. O slide mostra que não.

#### Análise

Lê e verifica arquivos.

#### Elaboração

Monta a hierarquia concreta e gera instâncias.

#### Simulação

Executa o comportamento ao longo do tempo.

Essa separação ajuda a entender mensagens de erro.

---

### 2. Por que a elaboração cria instâncias únicas?

Um módulo pode ser usado várias vezes.

Exemplo:

```systemverilog
fifo u_rx_fifo (...);
fifo u_tx_fifo (...);
```

A definição é a mesma, mas as instâncias são diferentes.

A elaboração cria:

```text
top.u_rx_fifo
top.u_tx_fifo
```

Cada uma tem seus próprios sinais e estado interno.

---

### 3. Debug precisa ser habilitado antes

Se a simulação foi compilada sem informações de debug ou sem dump adequado, talvez o Verdi não consiga mostrar tudo.

Por isso o slide afirma que opções precisam ser habilitadas durante elaboração e compilação.

Em termos práticos:

```text
a escolha das opções de compile/elab afeta a qualidade do debug depois.
```

---

### 4. O FSDB não é o design

FSDB é registro de uma execução de simulação.

Ele mostra o que aconteceu naquele teste, com aquela seed, naquela configuração.

Se você mudar seed ou test, precisa de outro FSDB.

---

### 5. Coverage precisa de múltiplas simulações

Uma única simulação raramente fecha coverage.

Normalmente, coverage é acumulada ao longo de:

```text
vários testes;
várias seeds;
vários cenários;
regressões;
corner cases.
```

Depois, as bases podem ser mescladas e analisadas.

---

### 6. Coverage alta não significa bug zero

Coverage mostra que algo foi exercitado.

Para detectar erro, também precisa de:

```text
assertions;
scoreboards;
self-checks;
reference models;
checkers de protocolo.
```

Coverage sem checking pode apenas dizer que o bug foi exercitado, mas não percebido.

---

### 7. Code coverage versus functional coverage no Verdi

No Verdi, code coverage pode ser analisada junto ao código-fonte.

Isso ajuda a localizar:

```text
linhas não executadas;
branches não visitados;
condições não exercitadas;
FSM states/transitions não cobertos.
```

Functional coverage, por outro lado, está ligada a covergroups, bins e propriedades definidos no testbench/plano.

---

### 8. Toggle coverage e sinais mortos

Se um bit nunca toggla, pode indicar:

```text
sinal não conectado;
feature não usada;
reset preso;
clock parado;
testbench não estimula;
otimização removendo lógica;
erro de integração.
```

Mas também pode ser esperado para sinais constantes. Por isso é preciso analisar antes de excluir.

---

### 9. FSM coverage e estados inalcançáveis

FSM coverage ajuda a descobrir se:

```text
todos os estados foram visitados;
todas as transições ocorreram;
há estado morto;
há transição impossível;
há cenário de erro não testado.
```

Se um estado esperado nunca é visitado, pode ser bug de testbench ou bug de design.

---

### 10. Coverage exclusions precisam de revisão

Excluir cobertura sem critério é perigoso.

Boas exclusões devem ter:

```text
justificativa;
revisão;
vínculo com configuração ou requisito;
aprovação;
rastreamento.
```

Caso contrário, é fácil esconder buracos reais.

---

## Figuras, diagramas e elementos visuais importantes

### Página 10 — Simulator: VCS (1/2)

A primeira figura da seção mostra o VCS como solução de verificação funcional com constraint solver, suporte a múltiplas HDLs/SystemVerilog, verification planning, coverage analysis e integração com Verdi. A seta laranja destaca a integração com a plataforma Verdi.

### Página 10 — Simulator: VCS (2/2)

A segunda figura mostra as três etapas do fluxo: **Design Analysis**, **Elaboration/Compilation** e **Simulation**. Essa figura é central para entender onde ocorrem erros de sintaxe, erros de hierarquia e erros funcionais de simulação.

### Página 11 — Simulation with Debug Environment

A figura mostra o fluxo de debug, separando **interactive simulation debug** de **postprocessing debug**. O postprocessing usa FSDB, enquanto o interactive debug permite interação durante a simulação.

### Página 11 — Verdi Debug Environment: User Interface

A figura mostra a GUI do Verdi com barras e painéis como source code pane, design browser, console, message pane, watch pane, toolbar e painéis de objetos/classes/threads. Ela é importante para entender que Verdi trabalha com debug estrutural e dinâmico.

### Página 12 — Waveform and Schematic Viewing

A figura de waveform mostra elementos como signal pane, values pane, waveform pane, cursor, marker, rulers e zoom. A figura de schematic mostra conectividade do design. Juntas, elas mostram as duas visões fundamentais de debug: temporal e estrutural.

### Página 12 — Coverage Monitoring

A figura mostra que coverage precisa ser habilitada em análise, elaboração/compilação e simulação. Depois os relatórios são analisados no Verdi.

### Página 13 — Coverage Monitoring no Verdi

A figura mostra painéis de análise de coverage: Coverage View Pane, Coverage Source Code Pane, Coverage Detail Pane e Exclusion Manager Pane. Ela mostra como o Verdi ajuda a navegar da porcentagem de cobertura até o código e detalhes específicos.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é VCS?**  
   Uma solução de verificação funcional/simulador da Synopsys com suporte a SystemVerilog avançado, coverage, assertions, constraint solver e integração com Verdi.

2. **Quais recursos do VCS são citados?**  
   Constraint solver engine, suporte a múltiplas HDLs, SystemVerilog avançado, verification planning, coverage analysis e integração com Verdi.

3. **Quais atividades o VCS suporta?**  
   Logic simulation, design debugging tasks, monitoramento de coverage e checagem de correção com assertions.

4. **Quais são as etapas de simulação mostradas?**  
   Design Analysis, Elaboration/Compilation e Simulation.

5. **O que ocorre na etapa de Design Analysis?**  
   Arquivos do design são analisados quanto a construtos corretos e referências ausentes.

6. **Para que serve a design database?**  
   Para preparar o ambiente para debug posterior.

7. **O que ocorre em Elaboration/Compilation?**  
   O simulador usa arquivos intermediários, cria instâncias únicas, compila o design e gera o executável de simulação.

8. **O que ocorre na etapa de Simulation?**  
   O design é simulado usando o script/executável gerado na elaboração.

9. **Por que opções adicionais são necessárias para debug?**  
   Para habilitar recursos de debug durante elaboração e compilação.

10. **Quais são os dois modos de debug citados?**  
    Interactive debug e postprocessing debug.

11. **O que é interactive debug?**  
    Debug em que a simulação pode ser parada e avançada com intervenção do usuário, semelhante a step-by-step em programação.

12. **O que é postprocessing debug?**  
    Debug posterior à simulação usando arquivo FSDB gerado durante o run.

13. **O que é FSDB?**  
    Fast Signal Database, arquivo que armazena resultados de simulação, transações e mensagens de forma eficiente para análise no Verdi.

14. **O que o Verdi permite na interface gráfica?**  
    Acesso a hierarquia, código, mensagens, console, valores de runtime, objetos dinâmicos, waveforms, schematic e coverage.

15. **O que é waveform viewing?**  
    Visualização das formas de onda do design a partir do arquivo FSDB.

16. **O que é schematic viewing?**  
    Visualização da conectividade/esquemático do design.

17. **Quais elementos aparecem na janela de waveform?**  
    Signal pane, signal cursor, values pane, waveform pane, cursor, full scale ruler, marker e zoom scale ruler.

18. **O que é Coverage Monitoring?**  
    Monitoramento da cobertura do design durante a verificação.

19. **Quando as coverage databases são geradas?**  
    Durante a simulação, quando coverage está habilitada.

20. **Quais tipos de coverage databases o slide cita?**  
    Code coverage e Functional Coverage.

21. **O que code coverage monitora?**  
    Control-flow coverage e value coverage.

22. **O que control-flow coverage inclui?**  
    Line coverage e branch coverage.

23. **O que value coverage inclui?**  
    Condition coverage, toggle coverage e FSM coverage.

24. **O que functional coverage inclui?**  
    Covergroups e cover properties/assertions.

25. **Onde coverage reports são vistos e analisados?**  
    No Verdi.

26. **Quais painéis aparecem na tela de coverage do Verdi?**  
    Coverage View Pane, Coverage Source Code Pane, Coverage Detail Pane e Exclusion Manager Pane.

### Pegadinhas

- VCS não é apenas simulador RTL básico; ele também suporta constraints, coverage, assertions e integração com Verdi.
- Debug profundo precisa ser habilitado antes, durante elaboração/compilação.
- Interactive debug e postprocessing debug são fluxos diferentes.
- FSDB é gerado durante a simulação e analisado depois.
- Verdi não é apenas waveform viewer; ele também mostra código, hierarquia, schematic, objetos, mensagens e coverage.
- Coverage precisa ser habilitada e gerar database.
- Code coverage e functional coverage são diferentes.
- Toggle coverage e FSM coverage fazem parte da categoria de value coverage no slide.
- Functional coverage vem de covergroups e cover properties/assertions.
- Exclusion Manager não deve ser usado para esconder buracos reais sem justificativa.

### Frases para memorizar

```text
VCS executa a simulação; Verdi ajuda no debug e análise.
VCS suporta constraint solver, coverage, assertions e SystemVerilog avançado.
O fluxo de simulação passa por analysis, elaboration/compilation e simulation.
Debug pode ser interativo ou por pós-processamento.
FSDB armazena sinais, transações e mensagens para debug posterior.
Verdi permite visualizar waveform e schematic.
Coverage databases são geradas durante a simulação.
Code coverage inclui line, branch, condition, toggle e FSM coverage.
Functional coverage usa covergroups e cover properties/assertions.
Coverage reports são analisados no Verdi.
```

---

## Relação com projeto/laboratório

Esta aula é diretamente aplicável quando você for rodar simulação e debug no ambiente Synopsys.

### Fluxo mental para rodar simulação

```text
1. Preparar filelist com RTL e testbench.
2. Analisar/compilar o design no VCS.
3. Elaborar a hierarquia.
4. Gerar executável de simulação.
5. Rodar a simulação.
6. Gerar logs, FSDB e coverage database.
7. Abrir FSDB/coverage no Verdi.
8. Depurar waveform, schematic, código e mensagens.
```

### Quando algo dá errado

#### Erro de compile/análise

Verificar:

```text
filelist;
ordem dos arquivos;
packages;
includes;
módulos faltando;
bibliotecas;
sintaxe.
```

#### Erro de elaboração

Verificar:

```text
instâncias;
parâmetros;
interfaces;
port maps;
hierarquia;
bibliotecas lógicas.
```

#### Erro de simulação

Verificar:

```text
assertions;
logs;
waveform;
reset;
clock;
handshake;
scoreboard;
coverage;
deadlock;
X propagation.
```

### Checklist para debug com Verdi

- [ ] A simulação gerou FSDB?
- [ ] Os sinais necessários foram dumpados?
- [ ] O erro aparece no log?
- [ ] Há assertion falhando?
- [ ] A waveform mostra o primeiro ciclo errado?
- [ ] O schematic ajuda a rastrear origem do sinal?
- [ ] Há múltiplos drivers ou X?
- [ ] A coverage mostra cenário não exercitado?
- [ ] O problema está no DUT ou no testbench?

### Checklist para coverage

- [ ] Coverage foi habilitada no VCS?
- [ ] Code coverage foi coletada?
- [ ] Functional coverage foi coletada?
- [ ] Coverage database foi gerada?
- [ ] Relatórios foram abertos no Verdi?
- [ ] Linhas/branches não cobertos foram analisados?
- [ ] Toggle/FSM coverage foram revisadas?
- [ ] Exclusions foram justificadas?
- [ ] Gaps de coverage geraram novos testes?

---

## Necessidade de áudio

**Baixo a médio.**

Os slides são curtos e bastante visuais, mas suficientes para reconstruir os conceitos principais. A fala do professor poderia ajudar em:

- comandos exatos de VCS usados no laboratório;
- opções específicas para gerar FSDB;
- opções específicas para habilitar coverage;
- exemplos reais de abrir FSDB no Verdi;
- diferença prática entre interactive debug e postprocessing debug no fluxo do curso;
- como o curso espera organizar os relatórios de coverage.

Sem o áudio, a explicação conceitual está completa, mas os comandos exatos de laboratório devem ser confirmados quando aparecerem nos próximos slides ou exercícios.

---

## Checklist de qualidade

- [x] Conteúdo novo do DOCX foi separado dos slides repetidos do bloco anterior.
- [x] Texto dos slides de VCS/Verdi foi reconstruído a partir dos prints.
- [x] Conceitos de VCS, Verdi, FSDB, debug e coverage foram explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] Diferença entre interactive debug e postprocessing debug foi destacada.
- [x] Code coverage e functional coverage foram diferenciadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Arquivo gerado em UTF-8 com BOM.

---

## Próximo bloco

Este DOCX não mostra claramente a tela final de sequência do curso após **04 VCS and Verdi Debug Environment**.

Antes de sugerir o próximo arquivo, confirmar no roteiro/checklist qual é o primeiro DOCX depois de:

```text
05 Design Verification\04 VCS and Verdi Debug Environment.docx
```

Salvar este bloco em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\05 Design Verification\04 VCS and Verdi Debug Environment.md
```
