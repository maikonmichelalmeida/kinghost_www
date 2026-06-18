# 04 VHDL Reference Designs

## Controle do bloco

- **Bloco:** 009
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\04 VHDL Reference Designs.docx`
- **Faixa processada:** slides visíveis 1-12, distribuídos em 6 páginas do DOCX
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\04 VHDL Reference Designs.md`
- **Próximo bloco recomendado:** 010 — `05 VHDL Reference Design of ROBOT Model`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula mostra um **reference design em VHDL** usando um somador de 2 bits como exemplo prático de simulação, debug e organização de arquivos. Ela retoma a estrutura básica de um testbench, o fluxo de simulação com **VCS**, o uso de **vhdlan** para análise de arquivos VHDL, a elaboração com **vcs**, a execução com **simv** e a abertura da waveform no **Verdi**.

A ideia central é transformar o conhecimento de VHDL para verificação em um fluxo operacional:

```text
DUT em VHDL
   ↓
testbench em VHDL
   ↓
análise com vhdlan
   ↓
elaboração com vcs
   ↓
simulação com simv
   ↓
waveform/debug com Verdi
```

O exemplo do somador reforça uma pegadinha clássica: somar dois operandos de 2 bits exige uma saída de 3 bits para preservar o carry. O bug proposto na aula ocorre justamente quando `a = b = 2'b11`, pois `3 + 3 = 6 = 3'b110`. Se a saída tiver largura insuficiente, o carry é perdido.

A aula também apresenta boas práticas para rodar simulações: ter plano de verificação, organizar diretórios, separar filelists de RTL e testbench, automatizar tarefas repetitivas com scripts, limpar arquivos intermediários e usar debug pós-processamento quando necessário.

---

## Texto extraído e organizado por slide

### Slide 1 — Simulation of the Design

Para simular um design, é necessário um **testbench**.

A estrutura mostrada no slide contém:

- **DUT — Design Under Test**
- **Stimulus generator**
- **Response checker**

O testbench pode ser desenvolvido em qualquer HDL:

- Verilog;
- VHDL;
- SystemVerilog;
- combinação dessas linguagens.

Para simular, usa-se um simulador como o **VCS**. Para depurar, usa-se um ambiente de debug como o **Verdi Debug Environment**.

O slide mostra o fluxo de simulação em dois ou três passos, dependendo do tipo de DUT:

- DUT Verilog/SystemVerilog;
- design misto Verilog/SystemVerilog/VHDL.

Para VHDL ou designs mistos, o fluxo de três passos é enfatizado:

```text
Analyzing    → vlogan/vhdlan
Elaborating  → vcs
Simulating   → simv
```

Comandos mostrados no slide:

```bash
% vhdlan -work -vhdl [vhdlan_options] -f source_list -l file.log
% vcs -kdb -lca [elaboration_options] [design_unit] -l file.log
% simv [simulation/runtime_options] -l file.log
```

Interpretação:

- `vhdlan` analisa arquivos VHDL;
- `vlogan` analisa arquivos Verilog/SystemVerilog;
- `vcs` elabora o design e gera o executável de simulação;
- `simv` executa a simulação.

---

### Slide 2 — Debug Flow

O slide destaca que detectar bugs em um design é difícil, mesmo sendo um dos principais objetivos da simulação.

O processo de debug inclui:

- localizar a lógica defeituosa responsável pela resposta errada do DUT;
- isolar o bug;
- entender por que o design não responde como deveria.

Para designs complexos, é necessário um ambiente sofisticado de debug.

O ambiente de debug inclui:

- source code browser;
- schematic viewer;
- waveforms;
- state machine diagrams;
- waveform comparison;
- automatic tracing of signal activity using temporal flow views;
- assertion-based debug;
- debug and analysis of transaction and message data.

A figura mostra um fluxo com:

```text
Analysis
  ↓
Compilation / Elaboration
  ↓
Post-processing Debug
  ↓
Interactive Simulation Debug
```

Interpretação:

A simulação detecta o erro. O debug ajuda a encontrar a causa. O Verdi permite cruzar waveform, código-fonte, hierarquia e sinais internos para descobrir onde a resposta errada nasce.

---

### Slide 3 — VHDL Design Under Test (DUT)

O DUT é o módulo a ser verificado. Neste caso, o DUT é um **somador de 2 bits** que soma dois operandos de 2 bits.

Pontos principais:

- `x` e `y` são entradas de 2 bits;
- `z` é saída de 3 bits;
- os 2 bits menos significativos de `z` representam a soma;
- o bit mais significativo de `z` representa o carry;
- o resultado tem um bit a mais que os operandos para acomodar o carry;
- o design usa pacote padrão IEEE;
- a `architecture` define o comportamento do módulo.

Exemplo didático reconstruído:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity twoBitAdder is
  port (
    x : in  unsigned(1 downto 0);
    y : in  unsigned(1 downto 0);
    z : out unsigned(2 downto 0)
  );
end twoBitAdder;

architecture behavior of twoBitAdder is
begin
  z <= ('0' & x) + ('0' & y);
end behavior;
```

Interpretação:

Como `x` e `y` têm 2 bits, o maior valor possível de cada um é `3`, ou seja, `"11"`. A maior soma é:

```text
3 + 3 = 6
6 = 110₂
```

Logo, a saída precisa de 3 bits.

---

### Slide 4 — Simulation of a 2-Bit Adder DUT

Antes de rodar, é necessário garantir acesso ao **VCS**.

O slide afirma que a simulação VHDL é feita usando um **two-step flow**:

1. compilar;
2. simular.

Comandos mostrados:

```bash
% vhdlan [vhdlan_options] VHDL_filename_list
% vhdlan -f src_rtl -debug_access -l vcs_test.log
```

Execução da simulação:

```bash
% ./simv +vcs_sim.log -dump adder2bit_tb.fsdb -type FSDB
```

Também aparece um fluxo com:

```bash
% vcs -file adder2bit_tb.vhd ./rtl/adder2bit.vhd
% ./simv
```

Para debug pós-processamento, o slide recomenda usar:

```bash
-debug_access
```

durante a compilação.

Dump de sinais para debug pode ser feito por comandos no testbench, como:

```vhdl
initial begin
  $fsdbDumpvars;
  #100 $finish;
end
```

ou, em um estilo Verilog/VCD mostrado no slide:

```verilog
initial begin
  $dumpfile("adder2bit_tb.vcd");
  $dumpvars(0, stimulus);
  #100 $finish;
end
```

Observação: o slide mistura exemplos de sintaxe Verilog com o fluxo VHDL. Para VHDL puro, FSDB normalmente depende de pacote específico da ferramenta, como `novas.fsdb_pkg`.

Tabela de arquivos do exemplo:

| Arquivo | Diretório | Descrição |
|---|---|---|
| `Adder2bit.vhd` | `pc_tutorial/adder2bit/rtl/` | Contém o código-fonte RTL do somador. |
| `Adder2bit_tb.vhd` | `pc_tutorial/adder2bit/tb/` | Contém o testbench VHDL top-level. |
| `README` | `pc_tutorial/adder2bit/tb/` | Contém detalhes de execução da simulação. |
| `run.sh` | `pc_tutorial/adder2bit/tb/` | Contém scripts de compilação e execução da simulação. |

---

### Slide 5 — Simulation Results of a 2-Bit Adder DUT

O slide mostra os resultados impressos no console e a waveform no Verdi.

Texto do console reconstruído:

```text
This example produces the following result in console
t=0    x=00, y=00, z=0
t=20   x=01, y=01, z=2
t=40   x=11, y=11, z=6
t=60   x=10, y=10, z=4
t=100
Note that the assignment x = 3 means 11 in binary.
```

Interpretação:

- `x = 3` significa `x = "11"` em binário.
- `y = 3` significa `y = "11"` em binário.
- `3 + 3 = 6`.
- `6` em binário com 3 bits é `"110"`.

A waveform no Verdi mostra os sinais mudando ao longo do tempo, como:

- `x`;
- `y`;
- `z`;
- sinais de controle ou mensagens de erro.

A waveform confirma visualmente o que foi impresso no console.

---

### Slide 6 — Invoking the Debug Environment

O slide orienta simular o design com um bug e abrir o ambiente de debug Verdi.

Comando:

```bash
% verdi -nologo -ssf adder2bit_tb.fsdb &
```

Interpretação:

- `verdi`: abre o ambiente Verdi;
- `-nologo`: abre sem tela de logo;
- `-ssf adder2bit_tb.fsdb`: carrega o arquivo FSDB;
- `&`: executa em background no terminal.

Depois disso:

- o design e a waveform são carregados;
- é possível navegar pelos sinais;
- é possível navegar pelo código-fonte;
- o objetivo é identificar o bug no design.

Hint do slide:

```text
bug is in the case when a = b = 2'b11
```

Ou seja, o erro aparece quando:

```text
x = "11"
y = "11"
```

Cálculo correto:

```text
"11" + "11" = 3 + 3 = 6 = "110"
```

Bug típico:

```vhdl
z : out unsigned(1 downto 0)
```

Correção:

```vhdl
z : out unsigned(2 downto 0)
```

Após corrigir, deve-se ressimular e observar o resultado para o mesmo estímulo.

---

### Slide 7 — Good Practice for Running the Simulation (1/2)

Boas práticas listadas:

- Tenha um **verification plan**.
- O plano de verificação está para o engenheiro de verificação assim como a especificação funcional está para o designer RTL.
- O plano reduz bastante o esforço de planejamento.
- Um plano de verificação executável detalha cada objetivo de verificação e permite quantificá-los usando automação.
- Pense em reutilização de verificação como designers pensam em reutilização de design.
- Os módulos do testbench devem ser modulares e distintos no ambiente.
- Todas as tarefas repetitivas durante a simulação devem virar scripts.
- Acelerar a simulação é muito importante, pois ela roda ao longo de todo o processo de design.
- Uma forma de acelerar é compilar design e componentes de testbench uma vez e depois rodar simulações com modelos pré-compilados.
- Também se pode usar simulação incremental apenas para o código alterado.

Interpretação:

A aula está dizendo que verificação não deve ser improvisada. Ela precisa de plano, modularidade, automação e reuso.

---

### Slide 8 — Good Practice for Running the Simulation (2/2)

Boas práticas adicionais:

- Organize o diretório do design como mostrado na figura.
- Crie diretórios modulares de testbench.
- Tenha um arquivo `README` explicando a estrutura de diretórios.
- Gere filelists separados para módulos RTL e módulos de testbench.
- Gere um script de execução para rodar simulações com diferentes opções:
  - simulação simples;
  - simulação com ambiente de debug;
  - outras opções.

Exemplo de script para verificação RTL:

```makefile
RTL_Verification: clean ana comp sim

ana: ana_core

ana_core:
	vhdlan -l adder2bit.log -kdb -work -vhdl adder2bit.v adder2bit_tb.v

comp:
	vcs -l adder2bit.log

sim:
	./simv
```

Comando de limpeza:

```makefile
clean:
	rm -rf simv* csrc* ${ROOT}/libs *.log vhdlansetup.args *.fsdb
```

Interpretação:

A ideia é automatizar o fluxo inteiro:

```text
limpar
analisar
elaborar
simular
gerar log
gerar waveform
```

Isso evita erros manuais e torna o processo repetível.

---

### Slide 9 — Verify the Simulation Designs Yourself

O slide apresenta uma lista de 10 pequenos designs para praticar simulação.

Tabela reconstruída:

| Nº | Design | Descrição | Arquivos de referência |
|---:|---|---|---|
| 1 | 32-bit adder | Soma dois operandos de 32 bits armazenados nos registradores `op_a` e `op_b`; resultado de 33 bits em `out`. | `32bit_adder.vhd`, `32bit_adder_tb.vhd` |
| 2 | 16 × 16 multiplier | Multiplica dois operandos de 16 bits; resultado de 32 bits em `out`. | `multiplier.vhd`, `multiplier_tb.vhd` |
| 3 | 12-bit Counter with Overflow | Contador de 12 bits com `enable`, `load`, `loadval` e `overflow_out`. | `counter_overflow.vhd`, `counter_overflow_tb.vhd` |
| 4 | 4-bit Up/Down Counter | Conta para cima ou para baixo conforme controle, quando `enable` está alto. | `updown_counter.vhd`, `updown_counter_tb.vhd` |
| 5 | 2-Client Arbiter | Monitora requests de dois clientes e concede acesso conforme prioridade/política. | `arbiter.vhd`, `arbiter_tb.vhd` |
| 6 | 8:1 Multiplexer | Seleciona uma entrada conforme linhas de seleção. | `mux8x1.vhd`, `mux8x1_tb.vhd` |
| 7 | 3:8 Demultiplexer | Direciona a entrada para uma saída conforme linhas de seleção. | `demux1x8.vhd`, `demux1x8_tb.vhd` |
| 8 | 4:2 Encoder | Codifica uma entrada de 4 bits. | `encoder4x2.vhd`, `encoder4x2_tb.vhd` |
| 9 | 2:4 Decoder | Decodifica uma entrada de 2 bits. | `decoder2x4.vhd`, `decoder2x4_tb.vhd` |
| 10 | 2 × 3 Matrix Multiplication | Multiplica matrizes com operandos de 32 bits e resultado armazenado em registradores de 32 bits. | `matrix2x3_mult.vhd`, `matrix2x3_mult_tb.vhd` |

Interpretação:

A lista cobre blocos importantes para praticar:

- aritmética;
- controle sequencial;
- mux/demux;
- codificação/decodificação;
- arbitragem;
- loops e estruturas mais complexas.

---

### Slide 10 — Questão 1

**Questão:** Model libraries are not required for simulation.

Alternativas:

- True
- False

**Resposta correta aceita pelo curso:** True.

**Tradução:** Bibliotecas de modelo não são necessárias para simulação.

**Justificativa pelo curso:** No fluxo simples de simulação RTL apresentado, o design VHDL e o testbench são simulados diretamente. Portanto, para esse exemplo, bibliotecas de modelo não são exigidas.

Observação importante: a imagem mostra uma bolinha azul em `False`, mas o check verde indica que a resposta correta do curso é `True`.

---

### Slide 11 — Questão 2

**Questão:** Testbench consists of DUT, stimulus generator, and ______.

Alternativas:

- A. Input-outputs
- B. Clock-reset
- C. Response checker

**Resposta correta:** C. Response checker.

**Tradução:** O testbench consiste em DUT, gerador de estímulos e verificador de resposta.

**Justificativa:** O primeiro slide define explicitamente a estrutura do testbench como DUT, stimulus generator e response checker.

---

### Slide 12 — Questão 3

**Questão:** Design analysis is carried out for VHDL designs using ______ executable of simulator.

Alternativas:

- A. `vlogan`
- B. `vsim`
- C. `vhdlan`

**Resposta correta:** C. `vhdlan`.

**Tradução:** A análise do design para projetos VHDL é realizada usando o executável `vhdlan` do simulador.

**Justificativa:** No fluxo Synopsys mostrado, `vhdlan` analisa arquivos VHDL. `vlogan` é usado para Verilog/SystemVerilog. `vsim` é associado a outro ecossistema de simulação, não ao fluxo VCS apresentado pelo curso.

---

### Slide 13 — Questão 4

**Questão:** `vhdlan` analyzes the design for ______ and generates intermediate files for elaboration.

Alternativas:

- A. Syntax errors
- B. Instantiations
- C. Hierarchy

**Resposta correta aceita pelo curso:** B. Instantiations.

**Tradução:** `vhdlan` analisa o design quanto a instâncias e gera arquivos intermediários para a elaboração.

**Justificativa pelo curso:** A alternativa marcada como correta no slide é **Instantiations**. Tecnicamente, `vhdlan` também detecta erros sintáticos, mas para este banco de questões o gabarito aceito é **Instantiations**.

---

### Slide 14 — Questão 5

**Questão:** ______ flow is used in design simulations with VHDL models.

Alternativas:

- A. Two step
- B. Three step
- C. simv

**Resposta correta:** B. Three step.

**Tradução:** O fluxo de três etapas é usado em simulações de design com modelos VHDL.

**Justificativa:** O slide de simulação mostra que o processo de três etapas é usado especialmente quando há modelos VHDL ou design de linguagem mista:

```text
vhdlan → vcs → simv
```

Essa questão confirma o gabarito ajustado do curso: para VHDL, a resposta esperada é **Three step**.

---

## Aula didática desenvolvida

### 1. Reference design: por que começar com um somador?

O somador de 2 bits é pequeno, mas ensina praticamente todo o ciclo de trabalho:

```text
ler o DUT
entender interface
ler o testbench
rodar simulação
ver console
abrir waveform
identificar bug
corrigir código
rodar novamente
```

Ele também ensina uma regra fundamental de largura de sinais:

```text
Soma de dois operandos de N bits pode precisar de N+1 bits.
```

Exemplo:

```text
2 bits + 2 bits → até 3 bits
32 bits + 32 bits → até 33 bits
```

Esse raciocínio volta em multiplicadores, contadores, acumuladores e datapaths.

---

### 2. Fluxo VHDL no VCS

Para VHDL, o fluxo didático mais importante é:

```text
vhdlan → vcs → simv
```

#### `vhdlan`

Analisa arquivos VHDL.

```bash
vhdlan -f filelist_vhdl.f -debug_access -l analyze.log
```

#### `vcs`

Elabora a hierarquia e gera o executável.

```bash
vcs adder2bit_tb -debug_access -l elaborate.log
```

#### `simv`

Executa a simulação.

```bash
./simv -l sim.log
```

Esse é o motivo da questão de prova:

```text
Design analysis for VHDL designs → vhdlan.
```

---

### 3. Two-step versus three-step no material

O slide menciona two-step flow para uma simulação simples, mas a questão final cobra **three step** para VHDL.

Para o banco do curso, a regra prática fica:

```text
VHDL models → three-step flow
vhdlan → vcs → simv
```

Mesmo que algumas ferramentas permitam comandos compactos, a forma conceitual cobrada é separar análise, elaboração e simulação.

---

### 4. O papel do testbench

O testbench não vira hardware. Ele existe para testar o DUT.

Estrutura:

```text
Stimulus generator → DUT → Response checker
```

#### Stimulus generator

Aplica entradas:

```vhdl
x <= "00";
y <= "00";
wait for 20 ns;

x <= "11";
y <= "11";
wait for 20 ns;
```

#### DUT

É o somador:

```vhdl
uut : entity work.twoBitAdder
  port map (
    x => x,
    y => y,
    z => z
  );
```

#### Response checker

Confere saída:

```vhdl
assert z = expected
  report "Erro no somador"
  severity error;
```

---

### 5. O bug do caso `a = b = 2'b11`

Se:

```text
x = "11" = 3
y = "11" = 3
```

então:

```text
x + y = 6 = "110"
```

Se a saída tiver apenas 2 bits:

```vhdl
z : out unsigned(1 downto 0)
```

o resultado `"110"` será truncado para `"10"`.

Se a saída tiver 3 bits:

```vhdl
z : out unsigned(2 downto 0)
```

o resultado correto cabe.

Esse bug é excelente para debug porque:

- alguns casos passam;
- o erro só aparece com carry;
- console e waveform mostram o mismatch;
- a causa raiz é largura incorreta.

---

### 6. Console versus waveform

O console mostra resultados resumidos:

```text
t=40 x=11 y=11 z=6
```

A waveform mostra a evolução temporal:

```text
x muda
y muda
z atualiza
erro aparece em determinado tempo
```

Console é ótimo para:

- PASS/FAIL;
- mensagens de erro;
- resumo dos casos.

Waveform é essencial para:

- debug temporal;
- reset;
- clock;
- sinais internos;
- verificar se estímulo chegou;
- rastrear causa de bug.

---

### 7. Verdi: debug pós-processamento

O fluxo com Verdi é:

```text
simulação gera FSDB
   ↓
Verdi abre FSDB
   ↓
usuário navega em sinais e código
```

Comando:

```bash
verdi -nologo -ssf adder2bit_tb.fsdb &
```

No Verdi, você pode:

- abrir a waveform;
- ver o valor de `x`, `y`, `z`;
- ir do sinal para o código;
- observar em que tempo o erro aparece;
- confirmar a hipótese de truncamento.

---

### 8. Plano de verificação

Mesmo para um somador pequeno, dá para ter um plano.

Exemplo:

| Objetivo | Estímulo | Esperado |
|---|---|---|
| soma zero | `0 + 0` | `0` |
| soma simples | `1 + 1` | `2` |
| soma com carry | `3 + 3` | `6` |
| todas as combinações | `x=0..3`, `y=0..3` | `x+y` |

Para um DUT maior, o plano inclui:

- funcionalidades;
- casos normais;
- casos de canto;
- casos ilegais;
- coverage;
- critérios de conclusão;
- testes dirigidos;
- testes randômicos.

---

### 9. Testbench mais forte para o somador

Um testbench apenas com waveform ainda depende do aluno olhar manualmente. Um testbench melhor é self-checking.

Exemplo:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity adder2bit_tb is
end entity;

architecture sim of adder2bit_tb is
  signal x : unsigned(1 downto 0);
  signal y : unsigned(1 downto 0);
  signal z : unsigned(2 downto 0);
begin

  uut : entity work.twoBitAdder
    port map (
      x => x,
      y => y,
      z => z
    );

  stim : process
    variable expected : unsigned(2 downto 0);
  begin
    for a in 0 to 3 loop
      for b in 0 to 3 loop
        x <= to_unsigned(a, 2);
        y <= to_unsigned(b, 2);

        wait for 1 ns;

        expected := to_unsigned(a + b, 3);

        assert z = expected
          report "FAILED: x=" & integer'image(a) &
                 " y=" & integer'image(b) &
                 " expected=" & integer'image(to_integer(expected)) &
                 " got=" & integer'image(to_integer(z))
          severity error;
      end loop;
    end loop;

    report "Teste concluído";
    wait;
  end process;

end architecture;
```

Esse testbench cobre todas as combinações possíveis do somador de 2 bits.

---

### 10. Organização de diretórios

O slide recomenda separar arquivos.

Uma organização didática:

```text
adder2bit/
├── rtl/
│   └── Adder2bit.vhd
├── tb/
│   ├── Adder2bit_tb.vhd
│   ├── README
│   └── run.sh
└── sim/
    ├── logs/
    └── waves/
```

Vantagens:

- separa design e testbench;
- facilita scripts;
- facilita limpeza;
- evita misturar arquivos gerados;
- melhora reprodutibilidade.

---

### 11. Filelist

Em vez de escrever todos os arquivos na linha de comando:

```bash
vhdlan ../rtl/Adder2bit.vhd ../tb/Adder2bit_tb.vhd
```

pode-se usar filelist:

```text
../rtl/Adder2bit.vhd
../tb/Adder2bit_tb.vhd
```

E rodar:

```bash
vhdlan -f filelist.f
```

Em projetos grandes, filelists são indispensáveis.

---

### 12. Script de execução

Um script ou Makefile automatiza:

```text
clean
analyze
compile/elaborate
simulate
debug
```

Exemplo:

```makefile
clean:
	rm -rf simv* csrc* *.log *.fsdb vhdlansetup.args

ana:
	vhdlan -f filelist.f -debug_access -l analyze.log

comp:
	vcs adder2bit_tb -debug_access -l compile.log

sim:
	./simv -l sim.log

wave:
	verdi -nologo -ssf adder2bit_tb.fsdb &
```

Isso permite rodar:

```bash
make clean
make ana
make comp
make sim
make wave
```

---

### 13. Designs de prática

A lista final é uma progressão de treino.

#### 32-bit adder

Ensina largura de resultado e carry.

#### 16×16 multiplier

Ensina que multiplicação de N bits por M bits exige até N+M bits.

#### 12-bit counter with overflow

Ensina clock, enable, load e overflow.

#### 4-bit up/down counter

Ensina controle de direção.

#### 2-client arbiter

Ensina prioridade e grants.

#### 8:1 mux e 3:8 demux

Ensina seleção combinacional.

#### 4:2 encoder e 2:4 decoder

Ensina codificação e decodificação.

#### Matrix multiplication

Ensina arrays, loops e organização de dados.

Cada design deve ser simulado com:

```text
DUT + testbench + estímulos + checker + waveform
```

---

## Conceitos difíceis explicados em profundidade

### 1. O que exatamente `vhdlan` faz?

No fluxo VCS, `vhdlan` é responsável por analisar arquivos VHDL.

Ele lê o código, verifica a estrutura VHDL e prepara informações intermediárias para a elaboração.

No banco do curso, a resposta específica para:

```text
vhdlan analyzes the design for ______
```

é:

```text
Instantiations
```

Tecnicamente, ele também verifica erros sintáticos e semânticos. Mas para a prova deste curso, priorize **Instantiations**.

---

### 2. Elaboração

Elaboração é quando a ferramenta monta a hierarquia real do design.

Ela resolve:

- entidades;
- arquiteturas;
- componentes;
- instâncias;
- `port map`;
- generics;
- dependências;
- unidade top-level.

Exemplo:

```vhdl
uut : entity work.twoBitAdder
  port map (
    x => x,
    y => y,
    z => z
  );
```

Durante a elaboração, a ferramenta entende que `uut` é uma instância de `twoBitAdder` conectada aos sinais locais do testbench.

---

### 3. Por que saída do somador precisa ser maior?

Para N bits, o maior número unsigned é:

```text
2^N - 1
```

Para 2 bits:

```text
2^2 - 1 = 3
```

Maior soma:

```text
3 + 3 = 6
```

Quantidade de bits necessária para representar 6:

```text
6 decimal = 110 binário → 3 bits
```

Portanto:

```vhdl
z : out unsigned(2 downto 0)
```

é correto.

---

### 4. Debug orientado por caso de falha

O slide dá uma pista:

```text
bug is in the case when a = b = 2'b11
```

Isso é uma estratégia de debug:

1. identificar um caso específico que falha;
2. reproduzir apenas esse caso;
3. abrir waveform;
4. comparar esperado e obtido;
5. inspecionar o RTL relacionado.

Para esse bug:

```text
caso falho: 3 + 3
esperado: 6
obtido: valor truncado
causa provável: largura de z
```

---

### 5. Por que model libraries podem não ser necessárias aqui?

Em simulação RTL simples, o simulador usa diretamente:

- o arquivo VHDL do DUT;
- o arquivo VHDL do testbench.

Não há células de biblioteca tecnológica envolvidas.

Por isso, no contexto do curso:

```text
Model libraries are not required for simulation → True
```

Mas em simulação gate-level, pós-síntese ou com IPs específicos, bibliotecas podem ser necessárias. A questão se refere ao exemplo simples da aula.

---

### 6. Three-step flow para VHDL

O fluxo cobrado é:

```text
vhdlan → vcs → simv
```

Isso separa:

1. **análise** dos arquivos VHDL;
2. **elaboração** da hierarquia;
3. **execução** da simulação.

Mesmo que algumas linhas de comando combinem etapas, o conceito de três passos é o que o banco cobra para VHDL.

---

### 7. Verification plan executável

Um plano de verificação executável não é apenas uma lista. Ele vira testes.

Exemplo:

```text
Objetivo: testar carry do somador.
Teste: x=3, y=3.
Checker: z deve ser 6.
```

Em VHDL:

```vhdl
x <= "11";
y <= "11";
wait for 1 ns;

assert z = "110"
  report "Erro no carry"
  severity error;
```

Assim, o plano vira código verificável.

---

### 8. Debug não é só Verdi

Verdi é ferramenta, mas o processo mental é mais importante.

Fluxo:

```text
log mostra falha
   ↓
identificar tempo
   ↓
abrir waveform
   ↓
ver entradas
   ↓
ver saída
   ↓
ver RTL
   ↓
formular causa
   ↓
corrigir
   ↓
ressimular
```

Sem processo, a waveform vira apenas um monte de sinais.

---

## Figuras, diagramas e waveforms importantes

### Figura do testbench

Mostra `Stimulus → Device under test → Response checker`. Essa é a arquitetura mínima de qualquer testbench.

### Figura do fluxo de três etapas

Mostra:

```text
Analyzing with vlogan/vhdlan
Elaborating vcs
Simulating simv
```

Para VHDL, memorize `vhdlan`.

### Figura do debug flow

Mostra debug pós-processamento e debug interativo, reforçando que o debug pode acontecer depois da simulação ou acoplado à execução.

### Código do DUT VHDL

Mostra o somador de 2 bits com pacote IEEE, entity, architecture e soma com saída de 3 bits.

### Comandos de simulação

Mostram análise com `vhdlan`, execução com `simv`, geração de FSDB e opções de debug.

### Waveform do Verdi

Mostra sinais do somador mudando ao longo do tempo. É usada para confirmar console e depurar bug.

### Slides de boas práticas

Mostram plano de verificação, modularidade, scripts, diretórios, filelists e limpeza de arquivos intermediários.

### Tabela de designs de prática

Mostra 10 designs para treinar VHDL, simulação, testbench e debug.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Model libraries are not required for simulation. True or false?**  
   Resposta aceita pelo curso: **True**.

2. **Testbench consists of DUT, stimulus generator, and ______.**  
   Resposta: **Response checker**.

3. **Design analysis is carried out for VHDL designs using which simulator executable?**  
   Resposta: **vhdlan**.

4. **`vhdlan` analyzes the design for ______ and generates intermediate files for elaboration.**  
   Resposta aceita pelo curso: **Instantiations**.

5. **Which flow is used in design simulations with VHDL models?**  
   Resposta: **Three step**.

6. **Qual é o fluxo de três passos para VHDL no VCS?**  
   Resposta: `vhdlan → vcs → simv`.

7. **Qual ferramenta é usada como debug environment?**  
   Resposta: **Verdi**.

8. **Qual é o comando para abrir o FSDB no Verdi?**  
   Resposta: `verdi -nologo -ssf adder2bit_tb.fsdb &`.

9. **Qual é o bug do somador de 2 bits?**  
   Resposta: largura insuficiente da saída `z` no caso `x = y = "11"`.

10. **Por que a saída do somador de 2 bits precisa ter 3 bits?**  
    Resposta: porque `3 + 3 = 6 = "110"`.

11. **Para que serve `-debug_access`?**  
    Resposta: habilitar informações necessárias para debug pós-processamento.

12. **Por que usar scripts/Makefile?**  
    Resposta: automatizar tarefas repetitivas, reduzir erro manual e tornar simulações reproduzíveis.

### Pegadinhas

- A questão 1 mostra a bolinha azul em `False`, mas o check verde indica que o gabarito correto é `True`.
- Para VHDL, a ferramenta de análise é `vhdlan`, não `vlogan`.
- Para a questão de `vhdlan analyzes`, o curso cobra `Instantiations`.
- Para VHDL models, o curso cobra **Three step flow**.
- `simv` é o executável de simulação, não a etapa de análise.
- `vcs` elabora e gera o executável.
- O somador pode funcionar para alguns casos e falhar apenas quando há carry.
- Console não substitui waveform.
- Waveform não substitui checker automático.
- Em RTL simples, model libraries podem não ser necessárias; em gate-level, podem ser.

### Frases para memorizar

```text
VHDL analysis → vhdlan.
Elaboration → vcs.
Simulation → simv.
Debug waveform → Verdi.
Testbench = DUT + stimulus generator + response checker.
Soma de N bits pode exigir N+1 bits.
O bug do somador aparece em 3 + 3.
Plano de verificação transforma objetivos em testes.
Scripts tornam simulações repetíveis.
```

---

## Relação com projeto/laboratório

Esta aula é um roteiro de lab para simulação VHDL.

### Arquivos principais

```text
Adder2bit.vhd
Adder2bit_tb.vhd
README
run.sh
```

### Comandos centrais

```bash
vhdlan -f src_rtl -debug_access -l vcs_test.log
vcs adder2bit_tb -debug_access -l elaborate.log
./simv -l sim.log
verdi -nologo -ssf adder2bit_tb.fsdb &
```

### Fluxo de debug

```text
rodar simulação
ver console
abrir Verdi
achar tempo do erro
ver x, y, z
confirmar largura de z
corrigir RTL
ressimular
```

### Testbench ideal para o somador

O testbench deve:

- aplicar todos os pares de `x` e `y`;
- calcular expected com 3 bits;
- usar `assert`;
- gerar log claro;
- gerar waveform apenas para debug.

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

**Bloco 010 — 05 VHDL Reference Design of ROBOT Model**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\05 VHDL Reference Design of ROBOT Model.docx
```

Faixa:

```text
Slides a confirmar pelo DOCX
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\05 VHDL Reference Design of ROBOT Model.md
```
