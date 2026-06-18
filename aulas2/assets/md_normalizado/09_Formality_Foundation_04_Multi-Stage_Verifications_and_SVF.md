# 04 Multi-Stage Verifications and SVF

## Controle do bloco

- **Bloco:** 063
- **Curso:** 09 Formality Foundation
- **Aula:** 04 Multi-Stage Verifications and SVF
- **Prioridade do roteiro:** alta
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\04 Multi-Stage Verifications and SVF.docx`
- **Faixa do roteiro:** slides 1-25
- **Arquivo Markdown sugerido:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\04 Multi-Stage Verifications and SVF.md
```

- **Próximo bloco:** Bloco 064 — `05 Multi-Voltage Designs and UPF - parte A`

---

## Resumo executivo

Esta aula aprofunda uma ideia central do Formality Foundation: quando o Design Compiler transforma o design em várias etapas, o SVF precisa registrar essas transformações de forma correta para que o Formality consiga verificar cada etapa de maneira confiável.

Até agora, o SVF foi tratado como um arquivo de guidance que facilita o matching e a verificação. Nesta aula, a visão fica mais prática: em um fluxo real de Design Compiler, a síntese não é uma única operação. O design pode passar por **elaboração RTL**, **primeira compilação**, **inserção de teste**, **compilação incremental** e **renomeação de objetos** antes de gerar a netlist final. Cada uma dessas etapas pode alterar o design. Portanto, se quisermos verificar estágios intermediários, precisamos garantir que o SVF usado pelo Formality corresponda ao estágio certo.

O tema principal é: **o SVF certo para a netlist certa**.

A aula ensina que:

- sem SVF, equivalence checking entre RTL e netlist sintetizada pode exigir muito setup manual;
- com SVF correto, o setup fica muito menor porque as transformações do Design Compiler são registradas;
- o SVF é um registro progressivo das transformações feitas pelo Design Compiler;
- o arquivo SVF deve ser fechado corretamente, caso contrário o Formality pode enxergá-lo como corrompido ou incompleto;
- em fluxos multi-stage, pode ser útil gerar um SVF separado por etapa;
- o `set_svf` deve ser usado no Design Compiler nas fronteiras entre estágios;
- o Guidance Summary do Formality ajuda a verificar se o SVF contém comandos coerentes com a etapa que se quer verificar;
- o bloco de comentários no topo e no fim do `svf.txt` ajuda a conferir origem, timestamp, versão do DC e se o arquivo foi realmente finalizado.

---

## Texto extraído e organizado por slide

### Slide 1 — Design Compiler setup: The setup for the setup

Texto extraído:

- **Equivalency checking for synthesis without SVF or in other equivalency checking tools**
  - Potentially lots of manual setup.
  - Hierarchical verification.
  - Example skill required: detailed understanding of matching commands and other setup commands.
- **With SVF in Formality**
  - Virtually no setup — all in the SVF.
  - Example skill required: making sure you have setup DC to generate the SVF.
- Destaque:
  - **This unit: Making sure you have the right SVF.**

Interpretação:

O slide define o objetivo da unidade. Sem SVF, o engenheiro precisa conhecer profundamente os comandos de matching, setup manual, transformações de síntese e verificação hierárquica. Com SVF, muito desse trabalho é transferido para o arquivo de guidance gerado pelo Design Compiler.

Mas isso cria uma nova responsabilidade: garantir que o SVF foi produzido corretamente, pertence à síntese certa e contém as transformações esperadas.

A frase “setup for the setup” é importante: antes de configurar o Formality, é preciso configurar o Design Compiler para gerar o SVF correto.

---

### Slide 2 — Typical Top Down Design Compiler Flow

Texto extraído:

Fluxo mostrado:

```text
RTL
↓
Read and elaborate RTL
↓
First Compile
↓
Test Insertion
↓
Incremental Compile
↓
Change Names
↓
Final Netlist
```

Anotação do slide:

- Typical Design Compiler Flow has multiple stages that change the design.

Interpretação:

A síntese não é apenas “RTL entra, netlist sai”. Ela pode passar por múltiplas etapas, e cada etapa pode transformar a estrutura do design.

Exemplos de transformações:

- mapeamento de operadores para células;
- otimizações de datapath;
- remoção de registradores constantes;
- inserção de scan;
- alterações incrementais;
- renomeação de objetos.

Cada uma dessas transformações pode afetar a forma como o Formality precisa fazer match e verify.

---

### Slide 3 — Multiple Stage Verification

Texto extraído:

- When bringing up a design it always easiest to debug each stage in turn.
- You also want to be able verify end to end all in one go.
- You can do this provided you write a netlist and SVF for each step.
- Destaque:
  - **The fewer the design transforms the easier to debug.**

Interpretação:

A ideia de multi-stage verification é verificar o design em etapas menores.

Em vez de verificar apenas:

```text
RTL → Final Netlist
```

você pode verificar:

```text
RTL → First Netlist
First Netlist → Test Netlist
Test Netlist → Final Netlist
```

Isso facilita o debug porque cada verificação contém menos transformações. Se uma falha aparece apenas depois da inserção de teste, você sabe que deve investigar scan/DFT. Se aparece após a renomeação, pode ser problema de nomes/guidance.

Ao mesmo tempo, a aula diz que também é desejável verificar de ponta a ponta. Portanto, o fluxo ideal permite as duas coisas:

- debug por estágio;
- verificação end-to-end.

---

### Slide 4 — Multiple Stage Verification, repetição do conceito

O slide repete os mesmos pontos:

- depurar cada etapa separadamente;
- verificar end-to-end;
- escrever netlist e SVF para cada etapa.

Interpretação adicional:

A repetição reforça que a unidade não está só falando sobre “usar SVF”, mas sobre **organizar o fluxo de Design Compiler** para que o SVF seja útil. A ferramenta só consegue ajudar se os arquivos intermediários forem preservados.

---

### Slide 5 — Typical Design Compiler Flow com verificações por estágio

Texto extraído da figura:

Fluxo principal:

```text
RTL
↓
Read and elaborate RTL
↓
First Compile
↓
Test Insertion
↓
Incremental Compile
↓
Change Names
↓
Final Netlist
```

Saídas intermediárias:

```text
First Netlist
Test Netlist
Final Netlist
```

Vários blocos verdes `Verify` aparecem entre as etapas.

Anotação:

```text
Want the option of verifying each stage separately.
```

Interpretação:

A figura mostra que podemos inserir pontos de verificação entre as etapas:

- RTL contra First Netlist;
- First Netlist contra Test Netlist;
- Test Netlist contra Final Netlist;
- RTL contra Final Netlist.

O ponto didático é que, se a verificação final falhar, a verificação por etapas ajuda a localizar onde a diferença surgiu.

Se:

```text
RTL → First Netlist passa
First Netlist → Test Netlist falha
```

então o problema está provavelmente ligado à etapa de test insertion.

Se:

```text
Test Netlist → Final Netlist falha
```

então pode estar ligado a incremental compile, change names ou alterações finais.

---

### Slide 6 — Example Multi-Stage Design Compiler Script

Texto extraído e reconstruído do script:

```tcl
# Example DC script

set_svf mydesign.svf

# Elaborate design
read_verilog RTL.v
current_design top

# First compile
compile_ultra -scan -gate_clock
write -format verilog -hier -out first_gates.v

# Test insertion
set_dft_insertion_configuration -synthesis_optimization none
insert_dft
write -format verilog -hier -out test_gates.v

# Incremental compile
compile_ultra -incremental -scan

change_names -rules verilog -hierarchy
write -format verilog -hier -out final_gates.v
```

Caixas explicativas do slide:

- Single SVF will contain the transforms for all the stages.
- OK for RTL to `final_gates.v`.
- But what about, say, RTL to `first_gates.v`?
- `mydesign.svf` will have, for example, all the `change_names` information.

Interpretação:

Este script usa apenas um SVF:

```tcl
set_svf mydesign.svf
```

Isso é suficiente se a intenção for verificar o RTL contra a netlist final:

```text
RTL → final_gates.v
```

Porque o SVF acumulou todas as transformações até a netlist final.

Mas, se você quiser verificar:

```text
RTL → first_gates.v
```

o mesmo `mydesign.svf` pode conter informações posteriores, como `change_names`, que ainda não existiam em `first_gates.v`. Isso pode atrapalhar ou confundir a verificação intermediária.

Portanto, para multi-stage verification, muitas vezes é melhor gerar SVFs separados por estágio.

---

### Slide 7 — Helpful information to reason about SVF

Texto extraído:

- SVF is a running record of the transforms that Design Compiler does, as it does them.
  - Not saved up and written out in one go when you quit out of Design Compiler.
- Written to the SVF in the order in which DC does them.
  - Like a move in chess.
- In DC maximum of one SVF file open at any one time.
  - Opened with `set_svf` command in Design Compiler.
  - Or `default.svf` if no `set_svf` command.
- The SVF file is closed when:
  - You `set_svf` to another file.
  - Have a `set_svf -off` command.
  - When you quit out of DC.

Interpretação:

Este é um slide central.

O SVF não é gerado apenas no fim da síntese. Ele é escrito progressivamente enquanto o Design Compiler transforma o design. Isso significa que o SVF funciona como um histórico ordenado dos “movimentos” da síntese.

A analogia com xadrez é excelente: se você quer saber como a posição final foi alcançada, precisa da sequência correta de lances. Do mesmo modo, se o Formality quer entender como o RTL virou netlist, precisa da sequência correta de guidance commands.

Ponto operacional importante:

```text
Só pode haver um SVF aberto por vez no Design Compiler.
```

Quando você chama:

```tcl
set_svf outro_arquivo.svf
```

o arquivo anterior é fechado e o novo é aberto.

---

### Slide 8 — Example Design Compiler Script com SVF por estágio

Texto extraído e reconstruído:

```tcl
# Elaborate design
set_svf elab.svf
read_verilog RTL.v
current_design top

# First compile
set_svf first_comp.svf
compile_ultra -scan -gate_clock
write -format verilog -hier -out first_gates.v

# Test insertion
set_svf test_insert.svf
insert_dft
write -format verilog -hier -out test_gates.v

# Incremental compile
set_svf inc.svf
compile_ultra -incremental -scan

change_names -rules verilog -hierarchy
write -format verilog -hier -out final_gates.v

set_svf -off
```

Caixas explicativas:

- `elab.svf` opened.
- `elab.svf` closed, `first_comp.svf` opened.
- `first_comp.svf` closed, `test_insert.svf` opened.
- `test_insert.svf` closed, `inc.svf` opened.
- `inc.svf` closed.

Interpretação:

Este script demonstra o padrão correto para capturar SVF por etapa.

A cada fronteira do fluxo, o engenheiro chama `set_svf` para abrir um novo arquivo. Isso fecha automaticamente o SVF anterior.

Assim, cada SVF contém apenas as transformações daquele estágio:

- `elab.svf`: leitura/elaboração RTL;
- `first_comp.svf`: primeira compilação;
- `test_insert.svf`: inserção de DFT/scan;
- `inc.svf`: compile incremental e mudança de nomes.

Essa separação permite verificar estágios intermediários de maneira limpa.

---

### Slide 9 — SVF and the RTL read stage

Texto extraído:

- The RTL read stage writes useful and important information to SVF.
  - Which RTL files have been read — useful for example for `fm_mk_script`.
  - The DC RTL reader does some transformations on the design itself, recorded in the SVF.
- Can not verify a netlist written out after just elaborating RTL.
  - Can not easily verify an unmapped netlist.
- In some flows one elaborates the RTL and writes out a `.ddc` then quits DC.
  - To for example break up the flow and do the compile in a separate `dc_shell` run.
- Destaques:
  - Important to have SVF from the RTL read stage.
  - Sometimes useful to have RTL read stage SVF separate from the compile SVF.

Interpretação:

Mesmo a etapa de leitura/elaboração RTL já grava informação importante no SVF.

O SVF pode registrar:

- quais arquivos RTL foram lidos;
- transformações feitas pelo RTL reader do DC;
- informações úteis para gerar scripts automaticamente via `fm_mk_script`.

A observação sobre netlist após apenas elaborar RTL é importante: não é simples verificar uma “unmapped netlist” como se fosse uma netlist de gates final. Em alguns fluxos, a etapa de elaboração gera um `.ddc`, e a compilação acontece em outra sessão do DC. Nesses casos, pode ser útil preservar um SVF específico da leitura/elaboração.

---

### Slide 10 — Formality script for first compile

Texto extraído e reconstruído:

```tcl
# Elaborate design
set_svf "elab.svf first_comp.svf"
read_verilog -r RTL.v
set_top top

read_verilog -i first_gates.v
set_top top

match

verify
```

Caixa explicativa:

- Formality `set_svf` command can accept multiple SVF files.
- By default it uses timestamp information inside the SVF file to work out the correct order of the files.

Interpretação:

Para verificar:

```text
RTL → first_gates.v
```

o Formality precisa tanto das informações da etapa de elaboração (`elab.svf`) quanto das transformações da primeira compilação (`first_comp.svf`).

Por isso o script passa múltiplos SVFs:

```tcl
set_svf "elab.svf first_comp.svf"
```

O slide destaca que o Formality consegue usar timestamps internos dos SVFs para determinar a ordem correta. Mesmo assim, do ponto de vista de metodologia, o engenheiro deve manter os arquivos nomeados e organizados de forma clara.

---

### Slide 11 — Formality script for test insertion

Texto extraído e reconstruído:

```tcl
# Elaborate design
set_svf test_insert.svf
read_verilog -r first_gates.v
set_top top

read_verilog -i test_gates.v
set_top top

match

verify
```

Interpretação:

Para verificar a etapa de test insertion, a referência não é mais o RTL original, mas a netlist anterior:

```text
first_gates.v
```

A implementação é:

```text
test_gates.v
```

O SVF usado deve corresponder à etapa de test insertion:

```text
test_insert.svf
```

Esse é o princípio de verificação multi-stage: cada etapa compara a saída anterior contra a saída seguinte, usando o SVF daquela transformação.

---

### Slide 12 — Common mistakes with SVF files

Texto extraído:

- The SVF file is copied or used directly by Formality before it was closed by Design Compiler.
  - That is no `set_svf -off` was done or `dc_shell` still open or `dc_shell` was killed.
  - The file buffering will mean the end of the SVF will not have been written.
  - Formality will say the SVF is corrupt and won't be able to use it.
  - Recommendation: Have `set_svf -off` in script.
- The DC flow has been set up so that the SVF is easily accidentally overwritten.
  - If for example you don't explicitly do `set_svf` in DC, DC will write to `default.svf`.
  - If you kick off 2 DC runs in the same directory both will write to `default.svf`.
  - Recommendation: Use `set_svf` and preserve and copy the SVF as carefully as you would the netlist.

Interpretação:

Aqui estão dois erros muito comuns.

Primeiro erro: usar SVF antes de ele ser fechado. Como o arquivo pode estar em buffer, parte final pode não ter sido gravada. O Formality pode reportar que o SVF está corrompido.

Correção:

```tcl
set_svf -off
```

Segundo erro: confiar em `default.svf`. Se duas sínteses rodam no mesmo diretório, podem sobrescrever o mesmo arquivo. Isso cria um problema grave: você pode estar verificando uma netlist com SVF de outra execução.

A recomendação é tratar o SVF como parte do pacote de signoff da netlist. Se você preserva a netlist, preserve também o SVF correspondente.

---

### Slide 13 — The Guidance Summary

Texto extraído:

- The Guidance Summary first appears during `match`.
  - It appears before the match summary.
  - It contains useful information:
    - Summary of what SVF guide commands have been found.
    - Summary of what SVF guide commands have been accepted or rejected.

Figura:

A sequência do transcript aparece como:

```text
SVF processing
Guidance Summary
Match Summary
Verification progress
Verification Summary
```

Interpretação:

O Guidance Summary é a primeira grande ferramenta de sanity check do SVF dentro do Formality.

Ele aparece durante o `match`, antes do match summary. Ele mostra se o Formality encontrou comandos de guidance no SVF e quantos deles foram aceitos ou rejeitados.

Esse relatório deve ser lido sempre que houver suspeita de SVF errado, SVF incompleto ou SVF de outro estágio.

---

### Slide 14 — The Guidance Summary com tabela

Texto extraído e interpretação da figura:

A tabela mostra comandos com colunas como:

```text
Command | Accepted | Rejected | Unsupported | Unprocessed | Total
```

Anotações:

- Command corresponds to a `guide_` command in SVF.
- Example: 6 `guide_scan_input` commands in SVF.
- Nota:
  - If verification succeeds you can safely ignore unaccepted guidance commands.

Interpretação:

Cada linha da tabela corresponde a uma categoria de comando de guidance do SVF.

Exemplos de comandos que podem aparecer:

- guidance de scan;
- guidance de mudança de nomes;
- guidance de datapath;
- guidance de registradores constantes;
- guidance de multiplicadores;
- guidance de FSM.

A ideia não é decorar todos os detalhes da tabela, mas olhar se o perfil geral do SVF combina com o estágio que você está verificando.

Por exemplo:

- etapa de test insertion deve ter comandos relacionados a scan;
- etapa de first compile tende a ter muitas otimizações;
- etapa de elaboração não deveria ter grandes transformações de síntese.

---

### Slide 15 — Checking whether you have the right SVF

Texto extraído:

- Common mistakes when starting with SVF:
  - You have an SVF file but not clear that it is from the correct synthesis run.
    - Maybe overwritten from another synthesis run.
    - Accidental mistakes handling off SVF and netlist to person running Formality.
  - DC script not set up correctly and SVF doesn't contain the right information.
    - Too much.
    - Too little.
- Without needing a detailed understanding of SVF can sanity check you have the right SVF.
  - Use comment information at top and bottom of SVF file.
  - Use the guidance summary information and a rough understanding of what guide commands are expected in the various synthesis stages.

Interpretação:

O slide mostra uma postura prática: você não precisa entender todos os comandos internos do SVF para perceber que um SVF provavelmente está errado.

Dois tipos de problema:

1. SVF não corresponde à execução correta:
   - foi sobrescrito;
   - veio de outro diretório;
   - foi passado errado junto com a netlist.
2. SVF corresponde à execução, mas foi gerado de forma ruim:
   - contém informação demais;
   - contém informação de menos;
   - foi aberto/fechado no ponto errado.

Ferramentas de sanity check:

- bloco de comentários no começo e no fim do `svf.txt`;
- Guidance Summary;
- conhecimento aproximado do que se espera em cada etapa.

---

### Slide 16 — Expected characteristics vs. exact details

Texto extraído:

- If you used a calculator to multiply 11 x 12 and you got the answer 1211 why would you know that answer was wrong?
  - It is the wrong order of magnitude. Answer given is about 1000. Would expect something about just over 100.
  - Expecting an even number (odd x even = even). 1211 is an odd number.
- Destaques:
  - One doesn't need to know the exact right answer, or most of the details, to know 1211 is the wrong answer. Simple sanity checking rules suffice.
  - The same applies to SVF. Don't have to know the details to quickly sanity check whether you have the expected SVF for what you are trying to verify.

Interpretação:

Este é um slide metodológico. A analogia com `11 x 12 = 1211` mostra que é possível detectar erro sem saber todos os detalhes.

Você sabe que `1211` está errado porque:

- ordem de grandeza não faz sentido;
- paridade não faz sentido.

Da mesma forma, para SVF, você pode fazer checagens aproximadas:

- a data/hora combina com a síntese?
- o diretório é o esperado?
- a versão do DC é a esperada?
- a etapa contém comandos coerentes?
- o SVF de test insertion tem comandos de scan?
- o SVF de first compile contém muitas otimizações?
- o SVF de elaboração contém principalmente informações de leitura RTL?

---

### Slide 17 — The SVF comment block at top and bottom of `svf.txt`

Texto extraído da figura:

Topo:

```text
# Active SVF file my_run/mR4000.svf
# This file is automatically generated by Design Compiler
# Filename : /remote/.../projects/fm/lab1/my_run/mR4000.svf
# Timestamp : Tue Aug 28 06:48:21 2012
# DC Version : G-2012.06-SP1 (built Jul 24, 2012)
```

Fim:

```text
# Recording stopped at Tue Aug 28 06:48:58 2012
```

Perguntas destacadas:

- Is this the time you were expecting for start and end of synthesis?
- Was this the version of DC you were expecting?
- Does this correspond to where you were expecting the SVF to have been written to by DC?

Destaque:

- The comment block information is useful for resolving queries about the origin of the SVF.

Interpretação:

O bloco de comentários é uma das formas mais simples e eficientes de validar a origem do SVF.

Ele responde:

- qual arquivo SVF está ativo;
- onde ele foi gerado;
- quando começou a gravação;
- quando terminou;
- qual versão do Design Compiler gerou o arquivo.

Se o timestamp não combina com a síntese, ou o caminho é de outro projeto, ou a versão do DC é inesperada, há forte chance de o SVF não ser o correto.

O marcador `Recording stopped` no fim também indica que o arquivo foi fechado corretamente.

---

### Slide 18 — How to distinguish the SVF from the different DC stages: `elab.svf`

Texto extraído:

- The DC RTL read commands will be the `guide_environment` command at the top.

Exemplo de guidance:

```text
guide_environment {
  analyze {-format verilog -library WORK alu.v}
  analyze {-format verilog -library WORK cmti.v}
  analyze {-format verilog -library WORK r4000.v}
  analyze {-format verilog -library WORK register.v}
}
```

Destaque:

- The `elab.svf` will not contain major design transforms that happen during compile, e.g. `guide_reg_constant`, `guide_multiplier`.

Interpretação:

O `elab.svf` corresponde à leitura/elaboração do RTL. Portanto, espera-se encontrar informações sobre arquivos lidos e ambiente RTL, como `guide_environment`.

Mas não se espera encontrar grandes transformações de síntese, como:

- `guide_reg_constant`;
- `guide_multiplier`;
- transformações pesadas de datapath;
- grande quantidade de comandos de otimização.

Se um `elab.svf` contém muitas transformações de compile, talvez ele não seja apenas o SVF de elaboração.

---

### Slide 19 — SVF do first compile

Texto extraído:

- This is the stage where most of the major optimizations happen.
- For example `guide_reg_constant` is the command for constant register removal. Most of them will happen here.

Interpretação:

O `first_comp.svf` é geralmente o estágio mais rico em transformações de otimização.

Espera-se encontrar muitos comandos relacionados a:

- remoção de registradores constantes;
- otimização de datapath;
- mapeamento de operadores;
- mudanças estruturais relevantes;
- otimizações de área, timing e power.

Se a maioria dos comandos pesados aparece em `first_comp.svf`, isso é coerente. Se esse arquivo está vazio ou contém pouco guidance, pode haver erro na geração do SVF.

---

### Slide 20 — SVF do test insertion

Texto extraído:

- The `guide_*scan*` commands are associated with test insertion.
- If these commands are anywhere they will be at this stage.

Interpretação:

O `test_insert.svf` deve conter comandos relacionados a scan e DFT, como `guide_scan_input` e outros comandos com `scan`.

Isso faz sentido porque a etapa de test insertion adiciona lógica de scan, scan chains, scan enable, scan input/output e estruturas relacionadas.

Se você está verificando:

```text
first_gates.v → test_gates.v
```

e o Guidance Summary não mostra comandos de scan, isso é um sinal de alerta.

---

### Slide 21 — SVF do incremental compile

Texto extraído:

- Incremental compile — incremental changes.
- Would expect this to have less commands than `first_comp.svf`.
- And some `change_names` commands — often a single `change_names` command changing a large number of objects.

Interpretação:

O `inc.svf` tende a conter menos comandos que o `first_comp.svf`, porque incremental compile faz alterações mais localizadas.

Também pode conter `change_names`, especialmente se a renomeação de objetos foi feita nessa etapa. Às vezes um único comando de renomeação pode afetar muitos objetos.

Esse é um bom critério de sanity check:

- `first_comp.svf`: muitos comandos de otimização;
- `test_insert.svf`: comandos de scan;
- `inc.svf`: menos comandos, possivelmente `change_names`.

---

### Slide 22 — SVF único como concatenação dos SVFs por estágio

Texto extraído:

- If you had a DC script that just had a single SVF file, `mydesign.svf`, then `mydesign.svf` is a concatenation of `elab.svf`, `first_comp.svf`, `test_insert.svf` and `inc.svf`.
- All the above description of relative position of guide commands therefore still applies to `mydesign.svf`.

Interpretação:

Se o fluxo usa um único SVF, ele acumula os comandos de todas as etapas em ordem.

Isso significa que, mesmo em um SVF único, você pode aplicar a lógica temporal:

```text
início do SVF     → leitura/elaboração
meio inicial      → first compile
meio/final        → test insertion
fim               → incremental compile / change names
```

Portanto, a noção de “posição relativa” dos comandos ainda vale.

---

### Slide 23 — Summary: Characteristics of expected SVF

Texto extraído da figura:

Timeline:

```text
Time Stamp
Time line
```

Características esperadas por etapa:

- `elab.svf`:
  - RTL read info.
- `first_comp.svf`:
  - Majority of opt commands, e.g. `reg_constant`.
- `test_insert.svf`:
  - `*scan*` commands if anywhere.
- `inc.svf`:
  - Maybe `change_names` changing a large number of objects.

Interpretação:

Este slide consolida as regras de sanity check.

Você não precisa saber todos os comandos do SVF, mas precisa reconhecer o perfil esperado:

| Estágio | SVF esperado | Característica |
|---|---|---|
| Read/elaborate RTL | `elab.svf` | informações de leitura RTL, `guide_environment` |
| First compile | `first_comp.svf` | maioria das otimizações, `guide_reg_constant`, datapath |
| Test insertion | `test_insert.svf` | comandos relacionados a scan |
| Incremental compile / change names | `inc.svf` | menos comandos, possíveis `change_names` |

---

### Slide 24 — Unit Summary

Texto extraído:

- Can verify the separate stages of DC.
  - Use `set_svf` at boundary of stage in DC script.
- Can sanity check the SVF corresponds to the synthesis run and stage.
  - Timestamp information at top and bottom of SVF file.
  - Rough understanding of guide commands at each stage.

Interpretação:

O resumo final tem duas mensagens práticas:

1. Para verificar estágios separados do Design Compiler, use `set_svf` nas fronteiras entre etapas.
2. Para conferir se o SVF está correto, use:
   - timestamps;
   - caminho e versão do DC;
   - bloco de comentários;
   - Guidance Summary;
   - perfil esperado de comandos por etapa.

---

## Aula didática desenvolvida

### 1. O problema que esta aula resolve

Em um fluxo simples, parece que basta fazer:

```text
RTL → final netlist
```

e verificar tudo com um único SVF.

Mas em um fluxo real de Design Compiler, o design muda em várias etapas. Cada etapa pode introduzir uma transformação diferente:

- compile inicial;
- otimização de datapath;
- remoção de registradores constantes;
- inserção de scan;
- incremental compile;
- renomeação hierárquica.

Se a verificação final falha, pode ser difícil saber onde o problema surgiu. A solução é preservar netlists intermediárias e SVFs correspondentes para permitir verificação por estágio.

---

### 2. Verificação end-to-end versus verificação por estágio

Há dois tipos de verificação:

```text
End-to-end:
RTL → Final Netlist
```

e:

```text
Multi-stage:
RTL → First Netlist
First Netlist → Test Netlist
Test Netlist → Final Netlist
```

A verificação end-to-end é importante porque representa o objetivo final: provar que a netlist final equivale ao RTL.

A verificação por estágio é importante para debug. Ela reduz o espaço de investigação.

Se a falha aparece apenas em:

```text
First Netlist → Test Netlist
```

o provável responsável é a inserção de teste.

Se aparece apenas em:

```text
Test Netlist → Final Netlist
```

o provável responsável é o incremental compile ou change names.

---

### 3. Por que um único SVF pode ser insuficiente para etapas intermediárias

Um único SVF, como:

```tcl
set_svf mydesign.svf
```

acumula tudo:

```text
elaboração + first compile + test insertion + incremental compile + change names
```

Isso é adequado para:

```text
RTL → final_gates.v
```

Mas pode ser inadequado para:

```text
RTL → first_gates.v
```

porque o SVF contém guidance de etapas que ainda não existiam em `first_gates.v`, como `change_names` ou DFT.

Por isso, em multi-stage verification, o ideal é gerar SVFs separados:

```text
elab.svf
first_comp.svf
test_insert.svf
inc.svf
```

---

### 4. Como usar `set_svf` corretamente no Design Compiler

O comando `set_svf` abre um arquivo SVF para gravação. Como só pode existir um SVF aberto por vez, chamar `set_svf` novamente fecha o anterior e abre o próximo.

Exemplo correto:

```tcl
set_svf elab.svf
read_verilog RTL.v
current_design top

set_svf first_comp.svf
compile_ultra -scan -gate_clock
write -format verilog -hier -out first_gates.v

set_svf test_insert.svf
insert_dft
write -format verilog -hier -out test_gates.v

set_svf inc.svf
compile_ultra -incremental -scan
change_names -rules verilog -hierarchy
write -format verilog -hier -out final_gates.v

set_svf -off
```

O último comando é muito importante:

```tcl
set_svf -off
```

Ele garante que o SVF foi fechado corretamente e que o conteúdo final foi gravado.

---

### 5. Como montar o script do Formality para cada estágio

Para verificar o primeiro compile:

```text
RTL → first_gates.v
```

você pode usar:

```tcl
set_svf "elab.svf first_comp.svf"

read_verilog -r RTL.v
set_top top

read_verilog -i first_gates.v
set_top top

match
verify
```

Para verificar test insertion:

```text
first_gates.v → test_gates.v
```

você usa:

```tcl
set_svf test_insert.svf

read_verilog -r first_gates.v
set_top top

read_verilog -i test_gates.v
set_top top

match
verify
```

A regra é simples:

```text
Referência = design antes da etapa
Implementação = design depois da etapa
SVF = guidance da etapa
```

---

### 6. Como identificar se o SVF está errado

Um SVF pode estar errado de várias formas:

- SVF de outra execução;
- SVF sobrescrito;
- SVF incompleto;
- SVF não fechado;
- SVF da etapa errada;
- SVF com informação demais;
- SVF com informação de menos.

Sinais de alerta:

- arquivo chamado `default.svf` em diretório compartilhado;
- dois DC runs usando o mesmo diretório;
- ausência de `set_svf -off`;
- timestamp que não combina;
- versão de DC inesperada;
- caminho do arquivo diferente do projeto esperado;
- Guidance Summary com comandos incoerentes com a etapa.

---

### 7. O Guidance Summary como ferramenta de sanity check

Durante o `match`, o Formality imprime o Guidance Summary antes do Match Summary.

Ele mostra quantos comandos de guidance foram:

- encontrados;
- aceitos;
- rejeitados;
- não suportados;
- não processados.

Você deve olhar esse resumo antes de investigar falhas de lógica. Se muitos comandos importantes foram rejeitados, a falha pode estar no SVF/setup, não no design.

Exemplo de raciocínio:

- Se a etapa é test insertion, espero ver comandos de scan.
- Se a etapa é first compile, espero ver muitos comandos de otimização.
- Se a etapa é elab, não espero ver grandes transformações de compile.
- Se a etapa é incremental, espero menos comandos que na first compile.

---

### 8. O bloco de comentários do `svf.txt`

O topo e o fim do `svf.txt` ajudam a responder:

- de onde veio o arquivo;
- quando ele começou a ser gravado;
- quando parou;
- qual versão do Design Compiler gerou;
- qual path foi usado.

Exemplo:

```text
# Filename : /remote/.../my_run/mR4000.svf
# Timestamp : Tue Aug 28 06:48:21 2012
# DC Version : G-2012.06-SP1
# Recording stopped at Tue Aug 28 06:48:58 2012
```

Se o arquivo não tem `Recording stopped`, ou se a hora não combina, ou se o caminho é de outro run, não confie nele.

---

## Conceitos difíceis explicados em profundidade

### SVF como “registro dos movimentos” da síntese

A aula compara o SVF com movimentos de xadrez. Essa analogia é muito boa.

Se você vê uma posição final de xadrez, pode ser difícil provar como ela veio da posição inicial. Mas se você tem a lista de lances, basta verificar lance por lance.

Do mesmo modo, se o Formality compara RTL com netlist final sem guidance, ele precisa inferir sozinho uma sequência complexa de transformações. Com SVF, o Design Compiler informa os “lances” que fez:

```text
merge register
change names
remove constant register
map multiplier
insert scan
```

Isso torna a prova mais escalável.

---

### SVF correto para o estágio correto

O SVF não é apenas “um arquivo auxiliar”. Ele é parte da equivalência entre duas representações.

Para verificar:

```text
RTL → first_gates.v
```

você precisa do SVF que contém as transformações até `first_gates.v`.

Para verificar:

```text
first_gates.v → test_gates.v
```

você precisa do SVF de test insertion.

Para verificar:

```text
RTL → final_gates.v
```

você precisa do SVF completo.

Usar SVF da etapa errada pode causar:

- comandos rejeitados;
- match incorreto;
- falso debug;
- falha de verificação;
- dificuldade para entender o Guidance Summary.

---

### SVF com “informação demais” e “informação de menos”

Um SVF com informação demais pode conter transforms que ocorreram depois da netlist que você está verificando.

Exemplo:

```text
Verificação: RTL → first_gates.v
SVF usado: mydesign.svf completo até final_gates.v
```

Esse SVF pode conter `change_names`, scan e incremental compile que ainda não existem em `first_gates.v`.

Um SVF com informação de menos pode não conter a guidance necessária para uma transformação importante.

Exemplo:

```text
Verificação: RTL → final_gates.v
SVF usado: apenas elab.svf
```

Nesse caso, o Formality não recebe as informações sobre otimizações principais.

---

### Guidance Summary

O Guidance Summary é um relatório de aplicação do SVF.

Ele responde:

```text
Quais guide commands existiam no SVF?
Quantos foram aceitos?
Quantos foram rejeitados?
Quantos ficaram não processados?
```

Isso é essencial porque o SVF não é simplesmente “usado ou não usado”. Partes dele podem ser aceitas e partes podem ser rejeitadas.

---

### `set_svf -off`

O comando:

```tcl
set_svf -off
```

fecha o SVF ativo.

Ele deve estar no script do Design Compiler, especialmente em fluxos automatizados. Se o DC é interrompido ou o arquivo é usado antes de ser fechado, o final do SVF pode não ter sido gravado.

Resultado provável:

```text
Formality says SVF is corrupt
```

---

## Figuras e diagramas importantes

### Fluxo top-down do Design Compiler

A figura com:

```text
RTL → Read/elaborate → First Compile → Test Insertion → Incremental Compile → Change Names → Final Netlist
```

mostra por que a síntese é multi-stage. Cada bloco azul representa uma transformação potencial.

---

### Fluxo com verify por etapa

A figura com vários blocos verdes `Verify` mostra que podemos verificar em vários pontos:

- RTL contra first netlist;
- first netlist contra test netlist;
- test netlist contra final netlist;
- RTL contra final netlist.

Essa figura é o coração da aula: ela mostra a estratégia de debug.

---

### Script com um único SVF

A figura do script com:

```tcl
set_svf mydesign.svf
```

mostra o problema de acumular todas as transformações em um único arquivo. Isso funciona bem para verificação final, mas pode ser ruim para verificações intermediárias.

---

### Script com SVF por estágio

A figura com:

```text
elab.svf
first_comp.svf
test_insert.svf
inc.svf
```

mostra a metodologia recomendada para multi-stage verification.

---

### Guidance Summary

A figura do transcript mostra a ordem:

```text
SVF processing
Guidance Summary
Match Summary
Verification progress
Verification Summary
```

Isso mostra onde o engenheiro deve olhar quando roda `match`.

---

### SVF comment block

A figura do bloco de comentários do `svf.txt` mostra três itens de sanity check:

- timestamp;
- versão do Design Compiler;
- caminho do arquivo.

Também mostra o final:

```text
Recording stopped at ...
```

indicando fechamento correto.

---

## Pontos de prova e revisão

1. O SVF é um registro progressivo das transformações feitas pelo Design Compiler.
2. O SVF é escrito na ordem em que o Design Compiler faz as transformações.
3. O SVF não é simplesmente gerado todo de uma vez no final.
4. Só pode haver um SVF aberto por vez no Design Compiler.
5. `set_svf novo.svf` fecha o SVF anterior e abre outro.
6. `set_svf -off` fecha o SVF ativo.
7. Em fluxo multi-stage, é útil gerar SVF por etapa.
8. Sem SVF, equivalence checking pode exigir muito setup manual.
9. Com SVF correto, o setup no Formality é muito menor.
10. Um SVF único é adequado para RTL contra netlist final, mas pode ser inadequado para estágios intermediários.
11. Para verificar `first_gates.v`, use SVF até a primeira compilação.
12. Para verificar `test_gates.v`, use SVF da etapa de test insertion.
13. O Guidance Summary aparece durante `match`, antes do match summary.
14. O Guidance Summary mostra comandos de guidance aceitos e rejeitados.
15. Um SVF de test insertion deve ter comandos relacionados a scan.
16. Um SVF de first compile tende a ter a maioria das otimizações.
17. O `elab.svf` deve conter informação de leitura RTL e não grandes transforms de compile.
18. O bloco de comentários do SVF ajuda a conferir origem, timestamp e versão do DC.
19. `default.svf` pode ser perigoso se vários runs usam o mesmo diretório.
20. Preserve o SVF com o mesmo cuidado que preserva a netlist.

---

## Relação com projeto/laboratório

Um fluxo robusto de Design Compiler para Formality deve evitar depender implicitamente de `default.svf`.

Modelo de organização:

```tcl
set_svf elab.svf
# read/elaborate RTL

set_svf first_comp.svf
# first compile

set_svf test_insert.svf
# DFT insertion

set_svf inc.svf
# incremental compile and change_names

set_svf -off
```

Depois, no Formality, escolha os arquivos de acordo com a comparação:

```text
RTL → first_gates.v:
  set_svf "elab.svf first_comp.svf"

first_gates.v → test_gates.v:
  set_svf test_insert.svf

test_gates.v → final_gates.v:
  set_svf inc.svf

RTL → final_gates.v:
  set_svf "elab.svf first_comp.svf test_insert.svf inc.svf"
```

Essa organização dá flexibilidade para debug por etapa e verificação end-to-end.

---

## Checklist de qualidade

- [x] Texto dos prints foi extraído e organizado.
- [x] Comandos Tcl foram preservados e explicados.
- [x] Diagramas foram interpretados.
- [x] A relação entre Design Compiler, SVF e Formality foi desenvolvida.
- [x] O bloco foi escrito como aula didática, não apenas resumo.
- [x] O próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 064
- **Aula:** 05 Multi-Voltage Designs and UPF — parte A
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\05 Multi-Voltage Designs and UPF.docx
```

- **Processar somente:** slides 1-21
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\05 Multi-Voltage Designs and UPF_parte_A.md
```
