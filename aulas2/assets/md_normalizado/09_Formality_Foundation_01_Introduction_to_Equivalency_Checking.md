# 01 Introduction to Equivalency Checking

## Controle do bloco

- **Bloco:** 058
- **Curso:** 09 Formality Foundation
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\01 Introduction to Equivalency Checking.docx`
- **Faixa de slides:** 1-15
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\01 Introduction to Equivalency Checking.md`
- **Próximo bloco recomendado:** Bloco 059 — `02 Concepts and Steps - parte A`

---

## Resumo executivo

Esta aula abre o curso **Formality Foundation** retomando o conceito central de **equivalency checking** (*verificação de equivalência*): comparar um **reference design** (*projeto de referência*, normalmente RTL) com um **implementation design** (*projeto de implementação*, normalmente netlist em gates) para provar se ambos têm a mesma função lógica.

O ponto mais importante é entender a tensão entre duas forças do fluxo de ASIC: a síntese quer liberdade para transformar o circuito e melhorar **QoR — Quality of Results** (*qualidade dos resultados: timing, área, potência etc.*), mas quanto mais agressivas forem essas transformações, mais difícil fica para uma ferramenta formal provar equivalência. O curso mostra que o **SVF — Automated Guidance Setup File** (*arquivo automático de orientação/configuração*) resolve esse conflito: ele registra as “jogadas” de otimização feitas pelo Design Compiler e entrega essas informações ao Formality.

A aula também introduz a terminologia básica que será usada no restante do curso: **reference**, **implementation**, **containers**, **guidance/SVF**, resultados de verificação (**Succeeded**, **Failed**, **Inconclusive**) e comandos como `verify` e `fm_mk_script`. O foco não é ainda depurar erros específicos, mas construir a base mental para entender por que a verificação formal pode ser fácil em alguns casos e difícil em outros.

---

## Texto extraído e organizado por slide

### Slide 1 — Formality is an Equivalence Checker

Texto principal extraído:

- **Formality is an Equivalence Checker** (*Formality é um verificador de equivalência*).
- Assumes that the reference design is functionally correct.
- Determines if the implementation design is functionally equivalent to the reference.
  - Provides counter-examples if designs are functional.
- Is mathematically exhaustive with no missing corner cases.
- Does not require test vectors.

Figura:

- À esquerda aparece o **Reference Design**, com exemplo de RTL.
- À direita aparece o **Implementation Design**, com exemplo de gates/layout.
- Entre os dois há a pergunta **“Functionally Equivalent?”** (*funcionalmente equivalente?*).

Interpretação:

O Formality não tenta provar que o projeto original está correto em relação à especificação do produto. Ele assume que o projeto de referência é o “golden” (*modelo confiável*) e verifica se a implementação gerada mantém a mesma função.

---

### Slide 2 — Equivalency Checking Challenges

Texto principal extraído:

- **Setup** (*configuração inicial*)
  - Setup: manual effort required to run tool.
  - Want minimal manual effort to setup the tool to successfully complete.
- **Completion** (*conclusão da prova*)
  - Completion: whether tool can conclusively say the designs compared are equivalent.
  - The general case of showing that designs are functionally equivalent is algorithmically difficult.
  - Want high probability of the equivalency checking tool will complete — Pass or Fail.
    - The third option is inconclusive — which can also hold up tape-out.
- **Debugging** (*depuração*)
  - When design doesn’t pass want to quickly diagnose and resolve issue.

Interpretação:

A aula separa os problemas do Formality em três categorias: preparar corretamente a verificação, conseguir uma conclusão formal e depurar quando algo falha ou fica inconclusivo.

---

### Slide 3 — Rules of thumb on traditional equivalency checking and synthesis

Texto principal extraído:

- For RTL synthesis, the more things allowed to change the better the QoR.
  - QoR: Timing, Area, Power etc.
- The more the design has changed the more difficult it is to prove functional equivalence.
  - Pre to Post layout gates — very little changes.
    - Easy for equivalency checkers.
  - RTL to post-synthesis gates.
    - Large changes.
      - Datapath.
      - Boundary/ungrouping.
      - Sequential transforms.
    - Potentially difficult for equivalence checkers.

Interpretação:

O slide mostra uma regra prática: comparar gates antes e depois de layout é geralmente mais fácil porque a estrutura lógica mudou pouco. Comparar RTL com netlist pós-síntese pode ser difícil porque a ferramenta de síntese pode alterar profundamente a estrutura, especialmente datapaths, hierarquia e elementos sequenciais.

---

### Slide 4 — QoR Trade off on traditional equivalency checking and synthesis

Texto principal extraído:

- **Dumbed down synthesis** (*síntese simplificada/limitada*)
  - Poor QoR.
  - Verification Easy.
- **Advanced synthesis optimizations** (*otimizações avançadas de síntese*)
  - Good QoR.
  - Verification Hard.

Figura:

- Na parte superior, o RTL contendo operadores simples como `+` e `*` vira gates com blocos mais diretos, como `ADD` e `MULT`. A verificação fica fácil, mas a QoR é ruim.
- Na parte inferior, a síntese avançada transforma a lógica em estruturas mais otimizadas, como **CSA** e **MAC**, produzindo boa QoR, mas tornando a verificação mais difícil.

Interpretação:

O slide comunica o trade-off clássico: limitar a síntese facilita a verificação, mas prejudica timing, área e potência. Permitir otimizações avançadas melhora o chip, mas exige mais inteligência da verificação formal.

---

### Slide 5 — Complexity analogy: Chess moves

Texto principal extraído:

- **Complexity analogy: Chess moves** (*analogia de complexidade: movimentos de xadrez*).
- Is chess position B a valid continuation of position A after a number of moves?
- Two approaches:
  - Write a general algorithm that looks at B and A and sees whether it is possible.
    - Do-able for normal chess, but unlikely to scale well for more complex chess variants.
    - Can restrict the valid moves to a less complex subset.
  - Get the game moves and validate each move.
    - Easy and scalable if you have the moves.

Figura:

- O slide mostra uma posição A de xadrez e uma posição B depois de várias jogadas.
- A pergunta é se B pode ter surgido legalmente a partir de A.

Interpretação:

A analogia é excelente para Formality: sem saber as transformações realizadas pela síntese, a ferramenta teria que deduzir globalmente se a netlist final pode ter vindo do RTL. Com as “jogadas” registradas, a ferramenta valida uma sequência de transformações menores.

---

### Slide 6 — Scalable solution: Validate each move

Texto principal extraído:

- **Scalable solution: Validate each move** (*solução escalável: validar cada movimento*).
- Exemplo de partida:

```text
[Date "2018.06.28"]
[White "Player"]
[Black "Computer - Hard"]

1. e4 d5 2. d4 dxe4 3. Nc3 c6
4. Bc4 Nf6 5. Nge2 b5
```

- A figura mostra verificações pequenas entre estados consecutivos:
  - Verify e4 d5.
  - Verify d4 dxe4.
  - Verify Nc3 c6.
  - Verify Bc4 Nf6.

Texto inferior parcialmente visível:

- Time to verify:
  - With moves: roughly proportional to number of moves.
  - Without moves: maybe exponential with respect to number of moves in some rule variants.

Interpretação:

A conclusão é que, se a ferramenta recebe o histórico das transformações, a verificação escala melhor. Em vez de resolver um problema enorme de uma vez, ela verifica cada transformação como um passo conhecido.

---

### Slide 7 — Synthesis: A sequence of discrete optimizations

Texto principal extraído:

- **Synthesis: A sequence of discrete optimizations** (*síntese: uma sequência de otimizações discretas*).
- Exemplo de transformações:
  - Opt1: Datapath Merge.
  - Opt2: Datapath Architecture.
  - Opt3: Register Merge.
- Faixa superior: **Synthesis: Good QoR**.
- Legenda inferior:
  - Pieces: Datapath, Registers.
  - A Move: Discrete optimization (small number of pieces doing one thing).

Figura:

- O RTL inicial passa por estados intermediários até chegar a uma implementação otimizada.
- Cada etapa intermediária é representada como uma transformação isolada que é mais fácil de verificar.

Interpretação:

A síntese não é uma “mágica única”; ela é composta por várias otimizações discretas. Isso é crucial porque o SVF pode registrar essas operações, permitindo que o Formality compreenda melhor a relação entre RTL e gates.

---

### Slide 8 — Guidance

Texto principal extraído:

- **SVF = Automated Guidance Setup File**.
- Guidance passed from Design Compiler to Formality.
  - Automatically generated by Design Compiler.
  - Contains both setup and guidance information.
  - Reduces user setup effort and errors.
  - Removes unnecessary verification iterations.
- SVF data is implicitly or explicitly proven in Formality, or it is not used (rejected).
- Using the SVF flow is recommended.
  - Required when verifying a netlist containing retiming, register merging, or register inversions.

Figura:

- Design Compiler gera RTL/netlist e um arquivo de **Guided Setup**.
- O Formality recebe tanto o design quanto a orientação.
- Também aparece um bloco “Tcl Syntax”, indicando que a orientação tem natureza de comandos/setup interpretáveis.

Interpretação:

O SVF é o elo entre síntese e Formality. Ele permite que o verificador não precise “adivinhar” sozinho todas as transformações feitas pelo Design Compiler.

---

### Slide 9 — Formality: SVF contains optimization “moves”

Texto principal extraído:

- **Formality: SVF contains optimization “moves”** (*o SVF contém os “movimentos” de otimização*).
- A figura repete a ideia de síntese com boa QoR e estados intermediários.
- À direita, há um arquivo SVF contendo:

```text
SVF
Guide1
Guide2
Guide3
```

Interpretação:

O slide conecta diretamente a analogia do xadrez ao fluxo Synopsys: as otimizações discretas da síntese são como lances de uma partida; o SVF registra esses lances para que o Formality valide a equivalência de modo escalável.

---

### Slide 10 — Design Compiler and SVF

Texto principal extraído:

- By default, Design Compiler names the automated setup file `default.svf`.
- To specify the name, use the `set_svf file.svf` command in Design Compiler.

Script parcialmente visível no slide:

```tcl
set_svf mydesign.svf

# Elaborate design
read_verilog RTL.v
current_design top

# Synthesize
compile_ultra -scan -gate_clock

# Write out netlist
...
```

Observação:

Parte inferior do script está coberta pela barra do vídeo, então o slide não permite garantir todos os comandos finais. O ponto didático visível é que o SVF deve ser definido antes das etapas importantes da síntese, para que o Design Compiler registre as transformações.

Interpretação:

O comando `set_svf` no Design Compiler define o arquivo onde serão gravadas as informações de guidance. Se não for especificado, o padrão é `default.svf`.

---

### Slide 11 — Formality Terminology

Texto principal extraído:

- **Reference Design**
  - The “golden” design under test.
  - Frequently RTL (Verilog, SystemVerilog, VHDL).
    - Simulated and known to be good.
- **Implementation Design**
  - The modified design being checked against the golden reference.
- **Containers**
  - Formality database for designs and libraries.
  - Default reference container is named `r`.
  - Default implementation container is named `i`.
  - Can be saved and read using any version of Formality. *(parte final parcialmente visível, mas a ideia de salvar/ler containers é apresentada)*

Interpretação:

A terminologia de Formality gira em torno de dois lados: referência e implementação. Cada lado é carregado em um container, que guarda design, bibliotecas e informações associadas.

---

### Slide 12 — Fundamental Formality steps

Texto principal extraído:

- **Steps to verify design**:
  - Set the SVF.
  - Read RTL into reference container.
  - Read gate level netlist into implementation container.
  - Verify the design.

Figura:

- Três entradas principais aparecem acima do ambiente Formality:
  - RTL.
  - SVF (Guidance).
  - Gates.
- Dentro do ambiente, o RTL alimenta o container **REF**, os gates alimentam o container **IMPL**, e ambos convergem para **Verify**.

Interpretação:

Este é o fluxo mínimo de equivalência: carregar referência, carregar implementação, aplicar guidance e rodar `verify`.

---

### Slide 13 — Verifying Design

Texto principal extraído:

- The Formality command that checks the implementation is `verify`.
- Possible results:
  - **Succeeded:** implementation is equivalent to the reference. That is verification has passed.
  - **Failed:** implementation is not equivalent to the reference.
  - **Inconclusive:** analysis not sufficient to say whether Succeeded or Failed.
- Figura do transcript:

```text
Verification Results
Verification SUCCEEDED
```

Interpretação:

O resultado ideal é `SUCCEEDED`. `FAILED` indica diferença funcional real ou problema de setup. `INCONCLUSIVE` não prova erro, mas também não prova sucesso; para tapeout, pode ser tão problemático quanto uma falha porque impede a confiança formal.

---

### Slide 14 — Formality: fm_mk_script

Texto principal extraído:

- Complete Formality scripts can be generated automatically from SVF.

Comandos extraídos:

```sh
unix> fm_mk_script mydesign.svf -o fm.tcl
unix> fm_shell -f fm.tcl
```

Texto inferior:

- All source file information and library information are passed from Design Compiler via SVF.
- May require some minor editing.
- Great if you are new to Formality.

Interpretação:

O comando `fm_mk_script` gera um script Tcl para o Formality usando informações do SVF. Isso é útil para iniciantes e para padronizar o fluxo, embora o script gerado possa exigir ajustes.

---

### Slide 15 — Unit Summary

Texto principal extraído:

- **Key terms:**
  - Reference, Implementation, Containers.
  - Pass, Fail, Inconclusive.
  - Guidance or SVF.
- The synthesis stage is the most challenging for equivalency checking.
- For ease of setup and completion for best synthesis QoR Formality uses SVF.

Interpretação:

O resumo fecha a aula: o maior desafio da equivalência está na síntese, justamente porque a síntese altera o design para melhorar QoR. O SVF é o mecanismo que permite manter boa QoR sem tornar a verificação impraticável.

---

## Aula didática desenvolvida

### 1. O que Formality realmente verifica

O Formality é uma ferramenta de **formal equivalence checking** (*verificação formal de equivalência*). Isso significa que ele compara dois modelos de um mesmo design e tenta provar matematicamente que eles produzem o mesmo comportamento lógico.

O par mais comum é:

- **Reference design** (*projeto de referência*): normalmente o RTL original, escrito em Verilog, SystemVerilog ou VHDL.
- **Implementation design** (*projeto de implementação*): normalmente a netlist em gates gerada pela síntese.

A ferramenta assume que o design de referência já está correto. Essa frase é muito importante para prova: Formality não substitui a verificação funcional do RTL. Ele não responde “o RTL cumpre a especificação do produto?”. Ele responde: “a implementação gerada preservou a função do RTL?”.

Em fluxo real, isso é essencial porque depois que o RTL passa pela síntese lógica, pela inserção de DFT, por otimizações de datapath, por clock gating ou por alterações físicas, o design pode ficar estruturalmente muito diferente. O Formality existe para garantir que essas transformações não mudaram a função lógica pretendida.

---

### 2. Diferença entre simulação e equivalência formal

Na simulação, você fornece vetores de entrada e observa saídas. Mesmo com uma regressão grande, sempre há risco de não cobrir algum canto do espaço de estados.

Na equivalência formal, a ferramenta tenta provar matematicamente a relação entre os dois designs. Por isso o slide afirma que a verificação é **mathematically exhaustive** (*matematicamente exaustiva*) e não exige **test vectors** (*vetores de teste*).

A diferença prática é:

| Método | O que faz | Limitação |
|---|---|---|
| Simulação | Testa cenários escolhidos | Pode perder corner cases |
| Equivalência formal | Prova equivalência entre referência e implementação | Pode falhar ou ficar inconclusiva se o problema for complexo ou mal configurado |

Isso explica por que um resultado `INCONCLUSIVE` é sério. Ele não quer dizer que o design está errado, mas quer dizer que a ferramenta não conseguiu provar a resposta.

---

### 3. Os três desafios: setup, completion e debugging

A aula lista três desafios principais.

#### Setup

**Setup** é a preparação da ferramenta: ler corretamente os arquivos, associar bibliotecas, definir reference e implementation, carregar SVF, configurar black boxes, scan, clock gating, UPF etc.

Um setup errado pode gerar falha falsa. Por exemplo, se a implementação tem uma porta de scan ativa e o RTL não tem, o Formality pode acusar diferença funcional mesmo que o circuito funcional esteja correto.

#### Completion

**Completion** é a capacidade da ferramenta concluir a prova. O melhor caso é `Succeeded`; o segundo caso claro é `Failed`; o pior para fluxo de fechamento pode ser `Inconclusive`, porque ele não dá uma conclusão objetiva.

O slide enfatiza que provar equivalência no caso geral é difícil. Isso é especialmente verdadeiro quando a síntese muda muito a estrutura.

#### Debugging

**Debugging** é o processo de descobrir por que a verificação falhou ou não concluiu. Uma falha pode vir de:

- diferença funcional real;
- setup incorreto;
- guidance faltante ou rejeitado;
- transformações muito agressivas;
- black boxes não pareadas;
- clock gating, scan ou retiming não tratados corretamente.

---

### 4. QoR versus facilidade de verificação

**QoR — Quality of Results** (*qualidade dos resultados*) envolve métricas como:

- timing;
- área;
- potência;
- qualidade estrutural da netlist;
- possibilidade de fechamento físico.

A síntese melhora QoR aplicando transformações. Porém, cada transformação cria uma distância maior entre o RTL e a netlist.

O slide mostra dois extremos:

1. **Dumbed down synthesis** (*síntese simplificada*):
   - a netlist fica parecida com o RTL;
   - a verificação é fácil;
   - a QoR é ruim.

2. **Advanced synthesis optimizations** (*otimizações avançadas de síntese*):
   - a netlist pode ficar muito diferente;
   - a QoR melhora;
   - a verificação fica difícil.

Em ASIC real, não faz sentido sacrificar QoR só para deixar Formality feliz. O caminho correto é usar guidance/SVF para permitir boas otimizações e ainda manter a equivalência verificável.

---

### 5. A analogia do xadrez

O curso usa uma analogia muito boa: dado um tabuleiro A e um tabuleiro B, como saber se B é uma continuação legal de A?

Há duas formas:

1. Olhar apenas A e B e tentar deduzir se existe alguma sequência possível de movimentos.
2. Receber a lista de movimentos e validar cada movimento.

A segunda forma é muito mais escalável. No xadrez comum, talvez seja possível deduzir algumas coisas apenas olhando as posições. Mas em sistemas muito maiores e com regras complexas, tentar resolver tudo globalmente pode explodir em complexidade.

No Formality, o RTL é como a posição inicial. A netlist é como a posição final. O SVF é como a lista de movimentos.

Sem SVF, o Formality precisa inferir sozinho a relação entre RTL e netlist.

Com SVF, o Formality recebe as transformações importantes feitas pela síntese:

- merge de datapath;
- mudança de arquitetura aritmética;
- register merge;
- retiming;
- inversão de registradores;
- re-encoding de FSM;
- outras transformações discretas.

---

### 6. Síntese como sequência de otimizações discretas

A síntese não transforma RTL em gates em um único salto conceitual. Ela aplica uma sequência de decisões:

- escolhe arquiteturas de operadores;
- compartilha recursos;
- reduz lógica;
- rearranja datapaths;
- funde registradores;
- move lógica ao redor de registradores;
- aplica clock gating;
- insere lógica de scan;
- altera nomes e hierarquias.

Cada uma dessas transformações pode ser vista como um “move” (*movimento*) na analogia do xadrez. O SVF grava esses movimentos para ajudar o Formality.

A grande mensagem é: **o problema fica mais fácil quando a ferramenta sabe como a implementação foi produzida**.

---

### 7. O papel do SVF

**SVF — Automated Guidance Setup File** é o arquivo gerado pelo Design Compiler para orientar o Formality.

Ele contém dois tipos de informação:

1. **Setup information** (*informações de configuração*): dados que ajudam o Formality a configurar a comparação corretamente.
2. **Guidance information** (*informações de orientação*): dados sobre transformações feitas durante a síntese.

O slide diz que o SVF reduz esforço manual e erros. Isso acontece porque muitas configurações que o usuário teria que escrever manualmente são capturadas automaticamente no fluxo de síntese.

Também é importante a frase: **SVF data is implicitly or explicitly proven in Formality, or it is not used**. Ou seja: o Formality não aceita cegamente qualquer informação do SVF. A orientação precisa ser validada; se não puder ser validada, ela pode ser rejeitada.

---

### 8. Por que o SVF é necessário para certas transformações

O slide diz que o uso do SVF é recomendado e exigido em casos como:

- **retiming**;
- **register merging**;
- **register inversions**.

Essas transformações são difíceis porque alteram a correspondência direta entre registradores no RTL e registradores na netlist.

Em uma comparação simples, um registrador RTL `state_reg[0]` poderia corresponder diretamente a um registrador de implementação com nome parecido. Mas com retiming, por exemplo, a lógica pode ser movida através dos registradores. A fronteira sequencial muda. Sem guidance, a ferramenta pode não conseguir encontrar uma relação óbvia.

---

### 9. `set_svf` no Design Compiler

No Design Compiler, o comando importante é:

```tcl
set_svf mydesign.svf
```

Ele define o arquivo SVF que será gravado durante a síntese. Se não for especificado, o padrão é:

```text
default.svf
```

O momento de chamar `set_svf` importa: ele precisa estar ativo antes das etapas de síntese que geram as transformações. Se você rodar síntese sem SVF e só depois chamar `set_svf`, as transformações anteriores não estarão registradas.

Um fluxo conceitual é:

```tcl
set_svf mydesign.svf
read_verilog RTL.v
current_design top
compile_ultra -scan -gate_clock
write -format verilog -hierarchy -output mydesign.vg
```

Mesmo que o slide não mostre completamente os comandos finais, o conceito é esse: registrar a síntese para que o Formality consiga usar a orientação depois.

---

### 10. Terminologia essencial

#### Reference Design

É o projeto de referência, também chamado de **golden design** (*projeto dourado/confiável*). Normalmente é RTL já simulado e considerado correto.

#### Implementation Design

É o projeto modificado que será comparado contra a referência. Normalmente é a netlist pós-síntese.

#### Containers

Containers são bancos internos do Formality onde designs e bibliotecas são carregados.

Por padrão:

- `r` é o container de referência.
- `i` é o container de implementação.

Essa notação aparece nos comandos e caminhos internos:

```text
r:/WORK/top
i:/WORK/top
```

---

### 11. Fluxo fundamental do Formality

O fluxo básico apresentado é:

1. Setar o SVF.
2. Ler o RTL no container de referência.
3. Ler a netlist gate-level no container de implementação.
4. Rodar a verificação.

Em comando conceitual:

```tcl
set_svf mydesign.svf
read_verilog -r rtl/top.v
set_top r:/WORK/top
read_db -i tech.db
read_verilog -i netlist/top.vg
set_top i:/WORK/top
verify
```

O comando decisivo é:

```tcl
verify
```

Ele verifica se a implementação é equivalente à referência.

---

### 12. Resultados possíveis do `verify`

O Formality pode retornar:

#### Succeeded

A implementação é equivalente à referência. Esse é o resultado desejado.

#### Failed

A implementação não é equivalente à referência. Pode ser erro real ou setup errado. Por isso, em prática, falha precisa ser investigada antes de concluir que a síntese quebrou o design.

#### Inconclusive

A análise não foi suficiente para dizer se passou ou falhou. Isso pode ocorrer por complexidade, timeout, guidance insuficiente, transforms difíceis ou limitação do solver.

---

### 13. `fm_mk_script`

O comando:

```sh
fm_mk_script mydesign.svf -o fm.tcl
```

gera automaticamente um script Tcl para Formality com base nas informações do SVF.

Depois, roda-se:

```sh
fm_shell -f fm.tcl
```

Isso é especialmente útil para quem está começando, porque o SVF pode carregar informações de arquivos-fonte e bibliotecas vindas do Design Compiler. O slide alerta que pode ser necessário algum ajuste manual, mas a base do script já vem pronta.

---

## Conceitos difíceis explicados em profundidade

### Equivalency checking

Equivalency checking é diferente de testar funcionalidade com vetores. Ele compara dois designs e tenta provar que as saídas correspondentes são iguais para todos os comportamentos relevantes.

No fluxo de síntese, o problema comum é:

```text
RTL  ===?===  gate-level netlist
```

Se a netlist foi gerada corretamente, ela deve implementar a mesma função lógica do RTL, mesmo que esteja estruturalmente diferente.

---

### QoR e por que síntese agressiva complica Formality

**QoR** significa **Quality of Results**. Em síntese, melhorar QoR significa atingir melhores metas de:

- timing;
- área;
- potência;
- congestionamento indireto;
- estrutura para implementação física.

A síntese agressiva pode trocar um multiplicador direto por uma estrutura otimizada, fundir operadores, reorganizar datapaths ou compartilhar recursos. Isso é bom para chip, mas ruim para correspondência visual/estrutural.

O Formality não precisa que a estrutura seja igual, mas quanto mais diferente, mais difícil fica encontrar e provar a correspondência.

---

### Datapath transformations

Datapath é a parte do circuito que manipula dados: somadores, multiplicadores, comparadores, shifters, acumuladores etc.

Transformações de datapath podem trocar operadores simples por arquiteturas equivalentes, como:

- `ADD` por uma estrutura otimizada;
- `MULT` por arquitetura diferente;
- `ADD + MULT` por um bloco tipo `MAC`;
- aritmética simples por `CSA` (*carry-save adder*).

Essas transformações preservam a função, mas mudam muito a estrutura.

---

### Register merge

**Register merge** (*fusão de registradores*) ocorre quando dois ou mais registradores equivalentes são combinados em menos registradores na implementação.

Para uma comparação simples, isso é difícil porque deixa de haver correspondência 1:1 entre registradores do RTL e da netlist.

O SVF ajuda a explicar ao Formality que certos registradores foram fundidos durante a síntese.

---

### Retiming

**Retiming** move registradores através da lógica combinacional para melhorar timing, sem alterar a função observável do circuito.

Exemplo conceitual:

```text
Antes:  FF -> lógica grande -> FF
Depois: FF -> parte da lógica -> FF -> resto da lógica
```

A função pode continuar equivalente, mas a posição dos registradores mudou. Sem guidance, isso pode ser muito difícil para equivalência tradicional.

---

### Register inversion

**Register inversion** ocorre quando a implementação usa uma forma invertida de um registrador ou sinal para otimização lógica.

Por exemplo, em vez de implementar diretamente `q`, a síntese pode usar `~q` e ajustar a lógica ao redor. Funcionalmente pode ser equivalente, mas a correspondência direta falha se a ferramenta não souber interpretar a inversão.

---

### SVF como “lista de movimentos”

A analogia do xadrez deve ser memorizada:

- Posição inicial = RTL.
- Posição final = netlist.
- Movimentos = otimizações de síntese.
- Registro dos movimentos = SVF.

O SVF transforma um problema global difícil em uma sequência de verificações orientadas.

---

## Figuras, diagramas e waveforms importantes

### Figura do slide 1 — Reference versus Implementation

A figura mostra o Formality no papel de juiz entre dois designs. O ponto central é que a ferramenta não compara texto, nomes ou aparência do circuito; ela pergunta se a função é equivalente.

### Figura do slide 4 — Trade-off QoR versus verificação

Essa figura é uma das mais importantes da aula. Ela mostra que:

- síntese simples gera verificação fácil, mas QoR ruim;
- síntese avançada gera QoR boa, mas verificação difícil.

A solução moderna é usar SVF para não precisar escolher entre boa síntese e verificação possível.

### Figuras dos slides 5 e 6 — Xadrez

As figuras mostram por que ter a sequência de movimentos facilita a prova. Para Formality, isso representa ter a sequência de otimizações da síntese.

### Figura do slide 7 — Otimizações discretas de síntese

Mostra que síntese é uma cadeia de transformações menores. Cada transformação é uma oportunidade de registrar guidance.

### Figura do slide 8 — Design Compiler → SVF → Formality

Mostra o fluxo Synopsys: Design Compiler gera netlist e guidance; Formality usa ambos.

### Figura do slide 12 — Fluxo fundamental

Mostra RTL, SVF e gates entrando no Formality. É o mapa mental mais simples do fluxo de equivalência.

---

## Pontos de prova e revisão

1. **Formality assume que o reference design está correto.** Ele não prova que o RTL atende à especificação; ele prova que a implementação equivale ao RTL.

2. **Formality não exige test vectors.** A prova é formal/matemática, não baseada em simulação por vetores.

3. **Os três desafios principais são setup, completion e debugging.**

4. **Quanto mais a síntese muda o design, mais difícil é provar equivalência.**

5. **Boa QoR geralmente exige otimizações avançadas**, e isso pode tornar a verificação mais difícil.

6. **SVF é o arquivo de guidance gerado pelo Design Compiler.**

7. **SVF contém informações de setup e guidance.**

8. **SVF é recomendado e pode ser exigido para retiming, register merging e register inversion.**

9. **O comando `set_svf` no Design Compiler define o arquivo SVF.** O padrão é `default.svf`.

10. **Reference container padrão:** `r`.

11. **Implementation container padrão:** `i`.

12. **O comando que roda a checagem é `verify`.**

13. **Resultados possíveis:** `Succeeded`, `Failed`, `Inconclusive`.

14. **`Inconclusive` não significa que o design está errado**, mas significa que a ferramenta não conseguiu concluir a prova.

15. **`fm_mk_script` pode gerar script Formality automaticamente a partir do SVF.**

---

## Relação com projeto/laboratório

Esta aula prepara o raciocínio para qualquer laboratório de Formality. Quando você encontrar scripts com comandos como:

```tcl
set_svf default.svf
read_verilog -r ...
read_db -i ...
read_verilog -i ...
set_top ...
verify
```

você deve interpretar assim:

- `set_svf`: carrega guidance vindo da síntese.
- `read_verilog -r`: carrega o RTL no lado de referência.
- `read_db -i`: carrega biblioteca tecnológica no lado de implementação.
- `read_verilog -i`: carrega a netlist no lado de implementação.
- `set_top`: define o topo a ser comparado.
- `verify`: executa a prova de equivalência.

Em um projeto real, o objetivo é manter a liberdade de síntese para obter boa QoR, mas garantir que Formality receba informação suficiente para provar equivalência.

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

- **Próximo bloco:** Bloco 059 — `02 Concepts and Steps - parte A`
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\02 Concepts and Steps.docx`
- **Processar somente slides:** 1-20
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\02 Concepts and Steps_parte_A.md`
