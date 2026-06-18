# 04 Constraints - Reg-to-Reg and I/O Timing — parte B

## Controle do bloco

- **Bloco:** 037
- **Curso:** 07 Design Compiler NXT - RTL Synthesis
- **Aula:** 04 Constraints - Reg-to-Reg and I-O Timing
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\04 Constraints - Reg-to-Reg and I-O Timing.docx`
- **Faixa de slides:** 26-47
- **Conteúdo visível processado:** da seção **Constraining a Purely Combinational Design** até **Need Help with Commands and Variables?**
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\04 Constraints - Reg-to-Reg and I-O Timing_parte_B.md
```

- **Próximo bloco recomendado:** Bloco 038 — `05 Constraints - Input Transition and Output Loading`

---

## Resumo executivo

Esta parte fecha a aula de constraints de timing cobrindo três ideias centrais.

A primeira é como restringir designs ou caminhos puramente combinacionais usando **virtual clocks**. Quando não existe um clock físico conectado ao bloco atual, o Design Compiler NXT ainda precisa de uma referência temporal para calcular o tempo disponível entre a lógica externa de entrada, a lógica interna do bloco e a lógica externa de saída. O clock virtual resolve isso: ele cria um objeto de clock na memória do DC NXT, mas não fica conectado a uma porta nem a um pino do design.

A segunda é o conceito de **time budgeting**. Quando os atrasos reais dos blocos vizinhos ainda não são conhecidos, o projetista reserva uma parte conservadora do período de clock para entrada e saída. Assim, o bloco não fica com caminhos não restringidos. O princípio prático é: é melhor impor um orçamento conservador do que compilar um bloco com paths livres, porque paths sem constraint podem parecer "bons" no relatório, mas apenas porque a ferramenta não recebeu a meta correta.

A terceira é a organização prática do fluxo: constraints em arquivos separados, execução interativa versus batch, recomendações de script, comandos de checagem como `dcprocheck`, `report_clock`, `report_port`, `check_timing`, redirecionamento de relatórios e comandos de ajuda (`help`, `man`, `printvar`, `apropos`). Essa parte é muito importante para laboratório porque transforma comandos isolados em um fluxo reproduzível de síntese.

---

## Texto extraído e organizado por slide

### Slide 26 — Constraining a Purely Combinational Design

O slide mostra um bloco `MY_DESIGN` composto apenas por lógica combinacional entre um circuito de lançamento externo (`JANE'S_DESIGN`) e um circuito de captura externo (`JOE'S_DESIGN`).

Perguntas do slide:

- **What is different about this design?**
- **How do we constrain such a design?**

Texto/ideia central:

- O design atual não possui flip-flops internos.
- Não há caminho reg-to-reg dentro do bloco.
- Mesmo assim, o bloco participa de um caminho síncrono maior, entre registradores externos.
- Como não há registrador interno nem clock conectado necessariamente ao bloco, será necessário usar uma referência temporal externa.

---

### Slide 27 — Answer: Use a Virtual Clock!

Pergunta do slide:

- **What is a virtual clock?**

Resposta do slide:

- A clock that is not connected to any port or pin within the current design.
- Serves as a reference for input or output delays.
- Creates a clock object with a user-specified name within DC NXT's memory.

Comando mostrado:

```tcl
create_clock -name VCLK -period 2
```

Observações do slide:

- O clock precisa receber um nome com `-name`.
- Não há porta nem pino fonte no final do comando.
- O clock existe apenas como objeto de referência temporal dentro do DC NXT.

---

### Slide 28 — Exercise: Combinational Design

O slide mostra um bloco combinacional `MY_DESIGN` entre dois circuitos externos. O clock virtual é de 500 MHz, ou seja, período de 2 ns.

Valores usados:

- Clock period: `2 ns`
- Clock uncertainty: `0.3 ns`
- Input delay no porto `A`: `0.4 ns`
- Output delay no porto `B`: `0.3 ns`

Comandos mostrados:

```tcl
create_clock -period 2 -name VCLK
set_clock_uncertainty -setup 0.3 [get_clocks VCLK]
set_input_delay  -max 0.4 -clock VCLK [get_ports A]
set_output_delay -max 0.3 -clock VCLK [get_ports B]
```

Cálculo mostrado:

```text
Tcombo,max = 2 - 0.3 - 0.4 - 0.3 = 1.0 ns
```

Interpretação:

- O período total é 2 ns.
- A ferramenta subtrai a incerteza de setup.
- A ferramenta subtrai o tempo consumido pela lógica externa antes da entrada.
- A ferramenta subtrai o tempo reservado para a lógica externa depois da saída.
- O restante é o orçamento máximo para a lógica combinacional interna.

---

### Slide 29 — Time Budgeting (1/2)

Pergunta do slide:

- **What if you do not know the delays on your inputs or the setup requirements of your outputs?**

Resposta do slide:

- **Create a Time Budget!**

Ideia:

- Muitas vezes, no início do projeto, o bloco ainda não tem informações precisas sobre os blocos vizinhos.
- Mesmo sem saber o atraso real de entrada ou o requisito real de saída, não se deve deixar os caminhos sem constraint.
- Cria-se uma estimativa conservadora de quanto tempo será reservado para o ambiente externo.

---

### Slide 30 — Time Budgeting (2/2)

O slide mostra o exemplo de reservar uma fração do período de clock para o bloco.

Mensagem principal:

- **Better to budget conservatively than to compile with unconstrained paths!**

Imagem:

- O bloco `MY circuit` recebe uma indicação de **40% of clock period**.
- A intenção é reservar uma parcela do período para o caminho interno e outra parcela para os circuitos externos.

Interpretação:

- Time budgeting é uma técnica de divisão do período de clock.
- O objetivo não é ser matematicamente perfeito no começo, mas evitar que a ferramenta otimize sem meta.
- Um caminho sem constraint pode não ser otimizado, ou pode ser tratado com baixa prioridade.

---

### Slide 31 — Time Budgeting Example

O slide mostra um arquivo `timing_budget.tcl`.

Script mostrado:

```tcl
# A generic Time Budgeting script file
# for MY_BLOCK, X_BLOCK and Y_BLOCK

create_clock -period 10 [get_ports CLK]

set_input_delay -max 6 -clock CLK [all_inputs]
remove_input_delay [get_ports CLK]
set_output_delay -max 6 -clock CLK [all_outputs]
```

Pergunta do slide:

- **Would it be easier to specify a time budget if all outputs were registered?**

Interpretação:

- O período de clock é 10 ns.
- As entradas recebem `set_input_delay -max 6`, reservando 6 ns para lógica externa antes do bloco.
- As saídas recebem `set_output_delay -max 6`, reservando 6 ns para lógica externa depois do bloco.
- O clock é removido do conjunto de inputs restringidos, porque clock não deve receber `set_input_delay`.

---

### Slide 32 — Registered Outputs

O slide mostra uma estratégia mais organizada quando todos os blocos possuem saídas registradas.

Comandos mostrados:

```tcl
# Assume every block has registered outputs, 10ns clock:
set CLK2Q_MAX 1.5; # Assume slowest register driving your input
set CLK2Q_MIN 0.2; # Assume fastest register driving your output

set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports CLK]]

set_input_delay  -max $CLK2Q_MAX -clock CLK $ALL_INP_EXC_CLK
set_output_delay -max [expr {10 - $CLK2Q_MIN}] -clock CLK [all_outputs]
```

Observação do slide:

- **Tcl arithmetic expression with its arguments surrounded by curly braces `{}`**.

Interpretação:

- Se a saída do bloco anterior é registrada, o atraso de entrada pode ser modelado como `CLK2Q` máximo do registrador externo.
- Se o bloco atual dirige um registrador no bloco seguinte, o output delay pode ser calculado como o tempo que se deseja reservar para o mundo externo.
- O uso de variáveis melhora a manutenção do script.
- O uso de `[expr {...}]` evita problemas de parsing em Tcl e deixa clara a expressão aritmética.

---

### Slide 33 — Timing Constraint Summary

Resumo visual do slide:

- Todos os caminhos de entrada são restringidos por:

```tcl
set_input_delay
```

- Todos os caminhos registrador-para-registrador são restringidos por:

```tcl
create_clock
```

- Todos os caminhos de saída são restringidos por:

```tcl
set_output_delay
```

Mensagem central:

```text
You specify how much time is used by external logic...
DC NXT calculates how much time is left for the internal logic.
```

Interpretação:

- O projetista informa o tempo consumido fora do bloco.
- A ferramenta calcula quanto sobra para otimizar dentro do bloco.
- O SDC não descreve apenas o clock; ele descreve o contexto temporal ao redor do design.

---

### Slide 34 — Area Constraint

O slide explica que o comando `compile_ultra` aplica automaticamente uma constraint de área máxima igual a zero ao design atual.

Trecho mostrado no log:

```text
Beginning Area-Recovery Phase  (max_area 0)
```

Pontos do slide:

- O comando `compile_ultra` aplica automaticamente `max_area 0`.
- Área tem a menor prioridade quando comparada a DRCs, timing e power.
- A constraint de área zero nunca deve prejudicar timing ou outras constraints principais do design.
- Para listar área do core e aspect ratio após a compilação:

```tcl
report_area -physical
```

Interpretação:

- `max_area 0` não significa "área literalmente zero".
- Significa: depois de atender constraints mais importantes, tente reduzir área o máximo possível.
- A ferramenta trata timing, DRC e potência como prioridades superiores.

---

### Slide 35 — Executing Commands Interactively

O slide mostra que comandos podem ser digitados diretamente no shell do DC NXT.

Fluxo exemplo:

```tcl
dcnext_shell-topo
source dc_setup.tcl
analyze -f sverilog {A.sv B.sv TOP.sv}
elaborate MY_TOP
link
check_design
create_clock -period 2 [get_ports Clk]
set_input_delay -max 0.6 -clock Clk [all_inputs]
```

Uso recomendado:

- Bom para testar ou depurar comandos individuais.
- Não é eficiente para produção.

Interpretação:

- Modo interativo é excelente para aprender, investigar erro e testar uma constraint.
- Mas um fluxo real precisa ser reproduzível; por isso, scripts são preferidos.

---

### Slide 36 — Sourcing Constraints Files

O slide recomenda capturar constraints em um arquivo de constraints.

Fluxo mostrado no shell:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design
source TOP.con
```

Exemplo de arquivo `TOP.con`:

```tcl
create_clock -period 2 [get_ports Clk]
set_input_delay -max 0.6 -clock Clk [all_inputs]
...
```

Interpretação:

- `source TOP.con` executa o arquivo de constraints dentro da sessão atual.
- Isso separa o script principal de síntese do arquivo de constraints.
- Facilita revisão, reuso e controle de versão.

---

### Slide 37 — Executing Run Scripts in “Batch Mode”

O slide mostra execução em batch para máxima eficiência.

Comando UNIX mostrado:

```bash
dcnext_shell -topo -f dc.tcl | tee -i dcnxt.log
```

Arquivo `dc.tcl` mostrado:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design
source TOP.con
...
```

Pontos do slide:

- Capturar comandos em um run script.
- Executar em batch mode.
- Permite executar outras tarefas enquanto o DC NXT roda.
- Só deve ser feito quando o run script e o constraints file estiverem completos e corretos.

Interpretação:

- Batch mode é o modo natural para produção e regressão.
- O arquivo de log permite auditar mensagens, warnings e erros.
- O fluxo ideal é: testar interativamente primeiro, depois consolidar em script e rodar em batch.

---

### Slide 38 — Constraints File Recommendations (1 of 3)

O slide lembra que constraints podem ficar salvas no formato de design `.ddc`.

Recomendação principal:

- Apagar constraints antigas do design atual antes de aplicar novas constraints.

Comando mostrado:

```tcl
remove_sdc
create_clock -period 2 [get_ports Clk]
...
```

Aviso do slide:

```text
When applying multiple constraint scripts, there should only be ONE remove_sdc command.
```

Interpretação:

- Como constraints podem persistir dentro de um `.ddc`, aplicar constraints novas por cima de antigas pode criar conflito.
- `remove_sdc` limpa o conjunto atual de constraints.
- Mas se vários scripts forem chamados em sequência, apenas o primeiro deve limpar tudo; se um script intermediário usar `remove_sdc`, ele pode apagar constraints já aplicadas anteriormente.

---

### Slide 39 — Constraints File Recommendations (2 of 3)

Recomendação:

- Incluir comentários nos scripts.

Exemplo de comentário em Tcl:

```tcl
# Comments in Tcl

# If you want to comment on the same line, be sure
# to use a semicolon before the comment:

create_clock -p 5 -n V_Clk; # This is a VIRTUAL clock
```

Observação importante:

- Comentários em Tcl usam `#`.
- Se o comentário vem na mesma linha de um comando, é necessário terminar o comando antes com `;`.

Forma correta:

```tcl
create_clock -period 5 -name V_Clk; # This is a VIRTUAL clock
```

Forma problemática:

```tcl
create_clock -period 5 -name V_Clk # This is a VIRTUAL clock
```

Interpretação:

- Em Tcl, `#` só inicia comentário em posição adequada de comando.
- Sem o `;`, a ferramenta pode tentar interpretar o comentário como parte dos argumentos do comando.

---

### Slide 40 — Constraints File Recommendations (3 of 3)

Recomendações do slide:

- Usar extensões comuns:
  - `dc.tcl`
  - `DESIGN.sdc`
- Evitar aliases.
- Evitar abreviar comandos.
- Evitar abreviar opções.
- Evitar **snake scripts**.

Exemplo mostrado:

```tcl
create_clock -period 5 [get_ports clk]
```

Interpretação:

- Mesmo que abreviações funcionem, elas tornam o script menos legível e menos robusto.
- Em ambiente de equipe, script claro é melhor que script curto.
- `create_clock -period` é preferível a versões abreviadas como `create_clock -p`.
- "Snake script" sugere script confuso, longo, sinuoso, difícil de seguir e de manter.

---

### Slide 41 — Check the Syntax of Constraints

O slide apresenta o utilitário `dcprocheck`.

Comando UNIX mostrado:

```bash
dcprocheck TOP.con
```

Exemplo de erro mostrado:

```text
Unknown option 'create_clock -freq'
create_clock -freq 3.0 [get_ports clk]
```

Pontos do slide:

- `dcprocheck` é uma ferramenta de verificação de sintaxe incluída com o DC NXT.
- Está disponível se o usuário consegue lançar o DC NXT.
- Não exige setup adicional.

Interpretação:

- `dcprocheck` ajuda a detectar erros antes de rodar uma síntese inteira.
- Isso economiza tempo, principalmente quando o script é grande.
- Ele valida sintaxe de comandos e opções, mas não substitui análise semântica completa com o design carregado.

---

### Slide 42 — Check Values/Options of Clock Constraints

O slide mostra comandos para revisar clocks definidos.

Comandos mostrados:

```tcl
report_clock
report_clock -skew
report_clock -skew -attr
```

Exemplo de saída:

- `report_clock` mostra:
  - nome do clock,
  - período,
  - waveform,
  - atributos,
  - sources.

- `report_clock -skew` mostra informações relacionadas a:
  - rise delay,
  - fall delay,
  - uncertainty,
  - minimum/maximum transition,
  - latências/atrasos.

Observação do slide:

```tcl
report_clock -skew -attr; # Combines both outputs
```

Interpretação:

- Depois de aplicar `create_clock`, `set_clock_uncertainty`, `set_clock_latency` e `set_clock_transition`, deve-se conferir se o clock ficou como esperado.
- Muitos erros de timing vêm de clock mal definido ou de constraint aplicada ao objeto errado.

---

### Slide 43 — Check Values/Options of Port Constraints

O slide mostra o comando:

```tcl
report_port -verbose
```

A saída apresentada inclui informações de output delay:

- Output port
- Min rise/fall
- Max rise/fall
- Related clock
- Fanout load

O slide marca a pergunta:

- **Missing output constraint?**

Interpretação:

- `report_port -verbose` ajuda a descobrir se algum porto ficou sem `set_input_delay` ou `set_output_delay`.
- Campos vazios ou `--` podem indicar constraint ausente.
- Para designs com muitos I/Os, essa checagem é essencial.

---

### Slide 44 — Check for Missing/Inconsistent Constraints

O slide recomenda executar:

```tcl
check_timing
```

Fluxo mostrado:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design
source TOP.con
check_timing
...
```

Boa prática do slide:

```text
check_timing after applying constraints
```

O comando `check_timing` emite warnings para:

- Missing endpoint constraints
- Missing, overlapping or multiple clocks
- Clock-gating signals that may interfere with the clock
- And more...

Interpretação:

- `check_design` verifica estrutura/conectividade/hierarquia.
- `check_timing` verifica qualidade e consistência do ambiente temporal.
- Um design pode estar estruturalmente correto e ainda assim estar mal restringido.

---

### Slide 45 — Redirect Checks and Reports to a File

O slide recomenda redirecionar saídas de checks e reports para arquivos.

Exemplo de script `dc.tcl`:

```tcl
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link

redirect -tee -file precompile.rpt {
  check_design
  source TOP.con
  check_timing
}

redirect -tee -file compile.rpt {
  compile_ultra
}

redirect -tee -file post_compile.rpt {
  report_constraint -all
  report_timing
}
```

Interpretação:

- `redirect` captura a saída de comandos em arquivo.
- `-tee` mostra a saída na tela e também grava no arquivo.
- Separar `precompile.rpt`, `compile.rpt` e `post_compile.rpt` organiza o debug.
- Isso permite comparar resultados entre runs e guardar evidências de warnings, violações e melhorias.

---

### Slide 46 — Need Help with Commands and Variables?

O slide mostra comandos de ajuda para variáveis e comandos.

Para variáveis:

```tcl
printvar *_library;   # Lists all matching variables and corresponding values

man target_library;   # Complete 'man page'
```

Para comandos:

```tcl
help *clock;          # Lists all matching commands

man create_clock;     # Complete 'man page'

create_clock -help;   # Lists command options

# List command(s) containing the specified string,
# e.g. "period", in the command name or option(s):

apropos -symbols_only period;
```

Interpretação:

- `printvar` é útil para inspecionar variáveis de aplicação, como `target_library`, `link_library`, `search_path`.
- `man` abre documentação completa.
- `help` procura comandos por padrão.
- `-help` mostra opções de um comando específico.
- `apropos` ajuda quando se lembra de uma palavra relacionada, mas não do comando exato.

---

## Aula didática desenvolvida

### 1. Por que design combinacional puro exige cuidado especial?

Nos exemplos anteriores da aula, o design possuía registradores internos. Nesse caso, basta criar um clock real conectado ao porto de clock do design para que o DC NXT consiga restringir automaticamente os caminhos registrador-para-registrador.

Em um design puramente combinacional, isso muda. O bloco não tem registradores internos. Ele pode ser apenas uma função combinacional entre entrada e saída:

```text
A ----> [ lógica combinacional ] ----> B
```

Mesmo assim, na placa ou no SoC, esse bloco geralmente fica entre dois registradores externos:

```text
FF externo de lançamento -> lógica externa -> bloco combinacional -> lógica externa -> FF externo de captura
```

O problema é que o Design Compiler NXT está enxergando apenas o bloco atual. Ele não sabe automaticamente:

- quanto tempo o bloco anterior já consumiu antes de entregar o sinal na entrada;
- quanto tempo o bloco posterior ainda precisa depois da saída;
- qual é o clock de referência se nenhum clock entra fisicamente no bloco.

Por isso, a ferramenta precisa de três informações:

1. uma referência de clock;
2. um input delay para dizer quanto tempo foi gasto antes da entrada;
3. um output delay para dizer quanto tempo deve ser reservado depois da saída.

Quando o clock não existe fisicamente no bloco, usamos um **virtual clock**.

---

### 2. Virtual clock: o clock que existe para análise, não para conexão física

Um clock normal geralmente é criado sobre uma porta ou pino:

```tcl
create_clock -period 2 [get_ports Clk]
```

Isso cria um clock conectado à porta `Clk`.

Já o virtual clock é criado sem porta ou pino:

```tcl
create_clock -name VCLK -period 2
```

Ele existe na memória do DC NXT como objeto de clock, mas não está ligado ao circuito. O papel dele é servir como referência para constraints de I/O:

```tcl
set_input_delay  -max 0.4 -clock VCLK [get_ports A]
set_output_delay -max 0.3 -clock VCLK [get_ports B]
```

A ferramenta passa a entender algo como:

```text
O sistema externo trabalha com período de 2 ns.
O sinal chega na entrada A até 0.4 ns depois da borda de lançamento.
O sinal precisa sair em B deixando 0.3 ns reservados para o ambiente de captura.
```

Assim, o DC NXT calcula o tempo máximo permitido para a lógica interna.

---

### 3. Como calcular o tempo restante para a lógica combinacional

Para setup, a lógica interna recebe o que sobra do período:

```text
Tempo interno disponível =
Período
- incerteza de setup
- input delay
- output delay
```

No exemplo:

```text
Período = 2 ns
Uncertainty = 0.3 ns
Input delay = 0.4 ns
Output delay = 0.3 ns
```

Então:

```text
Tcombo,max = 2 - 0.3 - 0.4 - 0.3 = 1.0 ns
```

Isso significa que a ferramenta vai tentar implementar a lógica combinacional de forma que o atraso máximo de entrada até saída seja no máximo 1.0 ns.

O ponto mais importante é: `set_input_delay` e `set_output_delay` não dizem diretamente "otimize a lógica interna para este valor". Eles descrevem o tempo externo. A ferramenta subtrai esse tempo do período total e deduz o orçamento interno.

---

### 4. Time budgeting: quando ainda não sei os atrasos reais

Em projeto real, muitas vezes você não sabe os atrasos reais dos blocos vizinhos. O bloco anterior ainda pode estar em desenvolvimento; o bloco posterior talvez também não esteja fechado. Mesmo assim, você precisa sintetizar o seu bloco.

A solução é criar um orçamento de tempo.

Exemplo com clock de 10 ns:

```tcl
create_clock -period 10 [get_ports CLK]

set_input_delay -max 6 -clock CLK [all_inputs]
remove_input_delay [get_ports CLK]

set_output_delay -max 6 -clock CLK [all_outputs]
```

Esse script é conservador. Ele está dizendo:

- todos os inputs podem chegar até 6 ns após a borda de clock;
- todas as saídas devem deixar 6 ns reservados para o ambiente externo;
- a porta de clock não deve receber input delay.

Por que isso ajuda? Porque evita caminhos sem constraint.

Um caminho sem constraint é perigoso porque a ferramenta pode não otimizá-lo de acordo com uma meta real. O relatório pode parecer limpo, mas não porque o circuito é rápido; e sim porque não havia uma exigência temporal clara.

---

### 5. Registered outputs tornam o budgeting mais previsível

Quando os blocos têm saídas registradas, fica mais fácil estimar delays. Se o bloco anterior entrega sinais por registradores, o atraso de entrada pode ser aproximadamente o pior `CLK2Q` desses registradores.

Exemplo:

```tcl
set CLK2Q_MAX 1.5
set CLK2Q_MIN 0.2

set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports CLK]]

set_input_delay  -max $CLK2Q_MAX -clock CLK $ALL_INP_EXC_CLK
set_output_delay -max [expr {10 - $CLK2Q_MIN}] -clock CLK [all_outputs]
```

Aqui aparecem três boas práticas:

1. usar variáveis para valores repetidos;
2. remover a porta de clock da coleção de inputs;
3. usar `[expr {...}]` para cálculo aritmético em Tcl.

O uso de chaves em `expr` é importante porque evita substituições e interpretações inesperadas. Em Tcl, expressões complexas devem ser escritas de forma segura:

```tcl
[expr {10 - $CLK2Q_MIN}]
```

---

### 6. Resumo mental das constraints temporais

Para memorizar:

| Tipo de caminho | Constraint principal | O que informa |
|---|---|---|
| Input path | `set_input_delay` | Quanto tempo já foi consumido antes do sinal entrar no bloco |
| Reg-to-reg path | `create_clock` | Qual é o período disponível entre registradores internos |
| Output path | `set_output_delay` | Quanto tempo deve ser reservado depois que o sinal sai do bloco |
| Combinational-only design | `create_clock -name VCLK -period ...` | Clock de referência sem porta física |
| Verificação de constraints | `check_timing` | Detecta constraints ausentes ou inconsistentes |

Frase-chave da aula:

```text
Você especifica quanto tempo é usado pela lógica externa.
O DC NXT calcula quanto tempo sobra para a lógica interna.
```

---

### 7. Constraints como arquivos: por que não digitar tudo manualmente?

No começo, é normal testar comandos no shell:

```tcl
create_clock -period 2 [get_ports Clk]
set_input_delay -max 0.6 -clock Clk [all_inputs]
```

Mas isso não escala. Para um fluxo real, use arquivos:

```tcl
source TOP.con
```

O arquivo `TOP.con` pode conter:

```tcl
remove_sdc

create_clock -period 2 [get_ports Clk]
set_input_delay -max 0.6 -clock Clk [all_inputs]
set_output_delay -max 0.8 -clock Clk [all_outputs]
```

Essa separação facilita:

- versionamento;
- revisão;
- reuso;
- automação;
- comparação entre runs;
- debug.

---

### 8. Batch mode: fluxo profissional de execução

Depois de validar comandos, rode em batch:

```bash
dcnext_shell -topo -f dc.tcl | tee -i dcnxt.log
```

A ideia é que `dc.tcl` contenha o fluxo completo:

```tcl
source dc_setup.tcl

analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design

source TOP.con
check_timing

compile_ultra

report_constraint -all
report_timing
```

O arquivo `dcnxt.log` registra a execução. Isso é essencial porque warnings importantes podem aparecer no meio do log.

---

### 9. Por que usar `remove_sdc` com cuidado?

O slide recomenda apagar constraints antigas antes de aplicar novas:

```tcl
remove_sdc
```

Isso evita que constraints antigas salvas no `.ddc` continuem ativas sem você perceber.

Mas existe uma pegadinha: se você carrega vários arquivos de constraints, não coloque `remove_sdc` em todos. Apenas o primeiro deve limpar. Exemplo problemático:

```tcl
source clocks.sdc       ;# tem remove_sdc
source io_delays.sdc    ;# também tem remove_sdc -> apaga clocks
source exceptions.sdc   ;# também tem remove_sdc -> apaga delays
```

Melhor:

```tcl
remove_sdc
source clocks.sdc
source io_delays.sdc
source exceptions.sdc
```

Assim, a limpeza acontece uma única vez.

---

### 10. Comentários em Tcl: a pegadinha do ponto e vírgula

Comentário em Tcl usa `#`, mas comentário no fim da linha exige que o comando termine antes.

Correto:

```tcl
create_clock -period 5 -name V_Clk; # This is a VIRTUAL clock
```

O `;` termina o comando. Depois disso, `#` inicia comentário.

Sem o `;`, a linha pode ser interpretada de forma errada:

```tcl
create_clock -period 5 -name V_Clk # This is a VIRTUAL clock
```

Em scripts de síntese, esse tipo de detalhe é importante porque um comentário mal colocado pode virar argumento inválido.

---

### 11. Checagens depois de aplicar constraints

Depois de carregar constraints, rode:

```tcl
check_timing
```

Ele ajuda a detectar:

- endpoint sem constraint;
- clock ausente;
- múltiplos clocks no mesmo ponto;
- clocks sobrepostos;
- sinais de clock gating interferindo no clock;
- inconsistências de timing.

Para clocks:

```tcl
report_clock
report_clock -skew
report_clock -skew -attr
```

Para portos:

```tcl
report_port -verbose
```

Para constraints e timing no final:

```tcl
report_constraint -all
report_timing
```

Esses comandos são o equivalente a "olhar se a ferramenta entendeu o que você quis dizer".

---

### 12. Redirecionando relatórios

Em vez de deixar tudo perdido no terminal, use:

```tcl
redirect -tee -file precompile.rpt {
  check_design
  source TOP.con
  check_timing
}
```

O `-tee` é especialmente útil porque mostra no terminal e grava no arquivo.

Uma boa organização:

```text
precompile.rpt     -> checks antes da síntese
compile.rpt        -> log/resultados do compile_ultra
post_compile.rpt   -> timing e constraints após síntese
```

Isso facilita comparar antes e depois da otimização.

---

## Conceitos difíceis explicados em profundidade

### 1. Virtual clock

Um **virtual clock** é um objeto de clock sem fonte física no design atual.

Com clock real:

```tcl
create_clock -period 2 [get_ports Clk]
```

Com clock virtual:

```tcl
create_clock -name VCLK -period 2
```

Use virtual clock quando:

- o bloco é puramente combinacional;
- o clock de referência existe no sistema, mas não entra no bloco;
- você precisa restringir `set_input_delay` e `set_output_delay`;
- está sintetizando um bloco isolado, mas ele pertence a um sistema síncrono maior.

Erro comum:

```tcl
set_input_delay -max 0.4 -clock Clk [get_ports A]
```

sem ter criado `Clk` nem como clock real nem como virtual.

Forma correta no design combinacional:

```tcl
create_clock -name VCLK -period 2
set_input_delay -max 0.4 -clock VCLK [get_ports A]
```

---

### 2. Input delay e output delay não são atrasos internos

`set_input_delay` não força a entrada a atrasar. Ele diz para a ferramenta quanto tempo o ambiente externo já consumiu antes do sinal chegar à entrada.

`set_output_delay` não adiciona atraso na saída. Ele diz quanto tempo o ambiente externo precisa depois que o sinal sai do bloco.

Exemplo:

```tcl
create_clock -period 2 [get_ports Clk]
set_input_delay  -max 0.6 -clock Clk [get_ports A]
set_output_delay -max 0.8 -clock Clk [get_ports B]
```

A ferramenta entende:

```text
Período total: 2 ns
Entrada já consumiu: 0.6 ns
Saída precisa reservar: 0.8 ns
Tempo interno restante: 0.6 ns
```

desconsiderando, neste exemplo simplificado, setup/uncertainty adicionais.

---

### 3. Time budgeting

Time budgeting é a técnica de dividir o período de clock entre blocos quando os valores finais ainda não são conhecidos.

Exemplo de orçamento:

```text
Clock = 10 ns
Entrada externa = 4 ns
Bloco interno = 4 ns
Saída externa = 2 ns
```

Ou, de forma mais conservadora:

```tcl
set_input_delay -max 6 -clock CLK [all_inputs]
set_output_delay -max 6 -clock CLK [all_outputs]
```

A vantagem é evitar paths sem constraint.

A desvantagem é que, se o orçamento for conservador demais, a ferramenta pode trabalhar com metas mais difíceis do que necessário. Mas isso costuma ser preferível a deixar caminhos livres.

---

### 4. `remove_from_collection`

O comando aparece em:

```tcl
remove_from_collection [all_inputs] [get_ports CLK]
```

Ele cria uma coleção com todos os inputs, exceto a porta de clock.

Por que isso é necessário?

Porque `all_inputs` inclui a porta de clock. Mas não faz sentido aplicar `set_input_delay` ao próprio clock:

```tcl
set_input_delay -max 0.5 -clock CLK [all_inputs]
```

Isso pode aplicar delay indevido ao clock. A forma correta é:

```tcl
set_input_delay -max 0.5 -clock CLK \
  [remove_from_collection [all_inputs] [get_ports CLK]]
```

Ou com variável:

```tcl
set ALL_INP_EXC_CLK [remove_from_collection [all_inputs] [get_ports CLK]]
set_input_delay -max 0.5 -clock CLK $ALL_INP_EXC_CLK
```

---

### 5. `remove_sdc`

`remove_sdc` remove constraints SDC do design atual.

Use no começo de um arquivo mestre de constraints:

```tcl
remove_sdc
source clocks.sdc
source io.sdc
source exceptions.sdc
```

Evite usar em cada arquivo separado, porque pode apagar constraints já carregadas.

---

### 6. `dcprocheck`

`dcprocheck` verifica sintaxe de constraints sem exigir uma execução completa da síntese.

Exemplo:

```bash
dcprocheck TOP.con
```

Ele pode detectar erros como opção inexistente:

```tcl
create_clock -freq 3.0 [get_ports clk]
```

Se `-freq` não é uma opção reconhecida, ele aponta erro.

Limitação:

- Ele é bom para sintaxe.
- Ele não garante que os objetos existem no design, porque isso depende do design carregado.
- Depois ainda é necessário usar `check_timing`, `report_clock` e `report_port`.

---

### 7. `redirect -tee`

`redirect` grava a saída de comandos em arquivo.

Sem `-tee`, a saída pode ir apenas para o arquivo. Com `-tee`, vai para a tela e para o arquivo.

Exemplo:

```tcl
redirect -tee -file post_compile.rpt {
  report_constraint -all
  report_timing
}
```

Isso é útil para:

- guardar evidência dos relatórios;
- comparar resultados;
- enviar logs;
- depurar violações;
- automatizar regressões.

---

### 8. `report_clock`, `report_port` e `check_timing`

Esses comandos respondem perguntas diferentes:

```tcl
report_clock
```

Mostra quais clocks existem e como foram definidos.

```tcl
report_port -verbose
```

Mostra constraints e propriedades dos portos.

```tcl
check_timing
```

Verifica se o ambiente temporal está completo e consistente.

Regra prática:

```text
Depois de aplicar constraints, nunca vá direto para compile_ultra sem rodar check_timing.
```

---

## Figuras, diagramas e waveforms importantes

### Figura do design combinacional puro

A figura com `JANE'S_DESIGN`, `MY_DESIGN` e `JOE'S_DESIGN` mostra que o bloco atual pode não ter registradores internos, mas ainda está no meio de um caminho síncrono. O clock está nos blocos externos, não necessariamente no bloco atual.

Esse é o motivo de usar virtual clock.

---

### Figura do time budgeting

A figura com blocos `circuit X`, `MY circuit` e `ckt Y` mostra que, quando os atrasos externos são desconhecidos, deve-se reservar uma parte do período para cada região.

O ponto didático é que o design interno não pode ser otimizado como se tivesse o período inteiro disponível.

---

### Figura dos registered outputs

A figura mostra blocos com registradores nas saídas. Essa arquitetura facilita o budgeting porque as interfaces temporais ficam mais previsíveis. A saída registrada transforma o atraso externo em algo mais próximo de um `CLK2Q` conhecido.

---

### Figura do timing constraint summary

Essa figura é a melhor revisão da aula:

- input paths → `set_input_delay`;
- reg-to-reg paths → `create_clock`;
- output paths → `set_output_delay`.

Ela mostra que constraints descrevem o ambiente ao redor do design, não apenas o design interno.

---

### Figura dos relatórios

Os slides de `report_clock`, `report_port` e `check_timing` mostram a transição de "escrever constraints" para "confirmar que a ferramenta entendeu". Em síntese, esse passo é tão importante quanto escrever o SDC.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **What is a virtual clock?**  
   É um clock que não está conectado a nenhuma porta ou pino do design atual. Serve como referência para input/output delays.

2. **When should a virtual clock be used?**  
   Quando o design não tem clock físico conectado, especialmente em blocos puramente combinacionais ou em constraints de I/O baseadas em um clock externo.

3. **What does `set_input_delay` represent?**  
   Representa o tempo consumido pela lógica externa antes do sinal chegar à entrada do bloco.

4. **What does `set_output_delay` represent?**  
   Representa o tempo que deve ser reservado para a lógica externa depois da saída do bloco.

5. **What constrains register-to-register paths?**  
   `create_clock`.

6. **What constrains input paths?**  
   `set_input_delay`.

7. **What constrains output paths?**  
   `set_output_delay`.

8. **Why remove the clock from `[all_inputs]`?**  
   Porque a porta de clock não deve receber `set_input_delay`.

9. **What is the purpose of `remove_sdc`?**  
   Remover constraints antigas antes de aplicar novas constraints.

10. **Why should only one `remove_sdc` be used when sourcing multiple constraint scripts?**  
    Porque um `remove_sdc` posterior pode apagar constraints carregadas por scripts anteriores.

11. **What is `dcprocheck` used for?**  
    Verificar sintaxe de arquivos de constraints.

12. **What is `check_timing` used for?**  
    Detectar constraints ausentes ou inconsistentes, clocks ausentes/múltiplos/sobrepostos e outros problemas de timing setup.

13. **What does `redirect -tee` do?**  
    Grava a saída em arquivo e também mostra no terminal.

14. **What does `report_port -verbose` help identify?**  
    Constraints de porto, incluindo possíveis input/output delays ausentes.

15. **Why avoid aliases and abbreviations in constraint scripts?**  
    Para melhorar legibilidade, robustez e manutenção.

---

## Pegadinhas importantes

### Pegadinha 1 — Virtual clock não tem source

Errado para clock virtual:

```tcl
create_clock -name VCLK -period 2 [get_ports CLK]
```

Isso já não é puramente virtual, porque foi associado a uma porta.

Virtual clock típico:

```tcl
create_clock -name VCLK -period 2
```

---

### Pegadinha 2 — Aplicar input delay no clock

Ruim:

```tcl
set_input_delay -max 0.5 -clock CLK [all_inputs]
```

Melhor:

```tcl
set_input_delay -max 0.5 -clock CLK \
  [remove_from_collection [all_inputs] [get_ports CLK]]
```

---

### Pegadinha 3 — Comentário Tcl na mesma linha sem `;`

Ruim:

```tcl
create_clock -period 5 -name VCLK # virtual clock
```

Melhor:

```tcl
create_clock -period 5 -name VCLK; # virtual clock
```

---

### Pegadinha 4 — Muitos `remove_sdc`

Ruim:

```tcl
source clocks.sdc
source inputs.sdc
source outputs.sdc
```

se cada um desses arquivos começa com `remove_sdc`.

Melhor:

```tcl
remove_sdc
source clocks.sdc
source inputs.sdc
source outputs.sdc
```

---

### Pegadinha 5 — Confiar apenas em `dcprocheck`

`dcprocheck` ajuda na sintaxe, mas não garante que a constraint está correta semanticamente para o design carregado. Depois ainda use:

```tcl
check_timing
report_clock
report_port -verbose
```

---

## Relação com projeto/laboratório

Esta parte é diretamente aplicável ao laboratório porque ensina a transformar constraints em um fluxo real de síntese.

Um script de laboratório bem organizado provavelmente terá esta estrutura:

```tcl
# Setup
source dc_setup.tcl

# Read RTL
analyze -f verilog {A.v B.v TOP.v}
elaborate MY_TOP
link
check_design

# Constraints
source TOP.con
check_timing

# Compile
compile_ultra

# Reports
redirect -tee -file post_compile.rpt {
  report_constraint -all
  report_timing
  report_area -physical
}
```

Para o projeto, a ideia mais importante é não tratar constraints como comandos decorativos. Elas são a especificação temporal que orienta a síntese. Sem constraints corretas, o Design Compiler NXT pode produzir uma netlist que parece válida estruturalmente, mas não atende ao contexto real do sistema.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

**Bloco 038 — 05 Constraints - Input Transition and Output Loading**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\05 Constraints - Input Transition and Output Loading.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\05 Constraints - Input Transition and Output Loading.md
```
