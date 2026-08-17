from __future__ import annotations

import csv
import hashlib
import re
import shutil
import struct
import subprocess
from dataclasses import dataclass
from pathlib import Path, PurePosixPath


SOURCE = Path(r"M:\arquivos\ePSXe205\JOGOS\Command & Conquer - Red Alert - Retaliation (USA) (Disc 1) (Allies).bin")
OUTPUT = Path(r"M:\arquivos\experimento_ps1")
PACKAGE = OUTPUT / "analysis_package"
SECTOR = 2352
USER_OFFSET = 24
LOGICAL = 2048


@dataclass(frozen=True)
class Entry:
    path: str
    name: str
    extent: int
    size: int
    is_dir: bool


class RawPsxIso:
    def __init__(self, path: Path):
        self.path = path
        self.fp = path.open("rb")

    def close(self):
        self.fp.close()

    def sector(self, lba: int) -> bytes:
        self.fp.seek(lba * SECTOR + USER_OFFSET)
        data = self.fp.read(LOGICAL)
        if len(data) != LOGICAL:
            raise EOFError(f"Short sector at LBA {lba}")
        return data

    def read_extent(self, extent: int, size: int) -> bytes:
        chunks = []
        remaining = size
        lba = extent
        while remaining:
            block = self.sector(lba)
            take = min(remaining, LOGICAL)
            chunks.append(block[:take])
            remaining -= take
            lba += 1
        return b"".join(chunks)

    @staticmethod
    def record(data: bytes, pos: int):
        length = data[pos]
        if not length:
            return None, ((pos // LOGICAL) + 1) * LOGICAL
        rec = data[pos : pos + length]
        extent = struct.unpack_from("<I", rec, 2)[0]
        size = struct.unpack_from("<I", rec, 10)[0]
        flags = rec[25]
        name_len = rec[32]
        raw_name = rec[33 : 33 + name_len]
        if raw_name == b"\x00":
            name = "."
        elif raw_name == b"\x01":
            name = ".."
        else:
            name = raw_name.decode("ascii", "replace")
            name = re.sub(r";\d+$", "", name)
        return (name, extent, size, bool(flags & 2)), pos + length

    def entries(self) -> list[Entry]:
        pvd = self.sector(16)
        if pvd[1:6] != b"CD001":
            raise ValueError("ISO 9660 PVD not found")
        root_rec, _ = self.record(pvd, 156)
        assert root_rec
        _, extent, size, _ = root_rec
        result: list[Entry] = []
        seen_dirs: set[tuple[int, int]] = set()

        def walk(dir_extent: int, dir_size: int, parent: PurePosixPath):
            key = (dir_extent, dir_size)
            if key in seen_dirs:
                return
            seen_dirs.add(key)
            raw = self.read_extent(dir_extent, dir_size)
            pos = 0
            while pos < len(raw):
                parsed, new_pos = self.record(raw, pos)
                pos = new_pos
                if not parsed:
                    continue
                name, child_extent, child_size, is_dir = parsed
                if name in (".", ".."):
                    continue
                path = str(parent / name).replace("\\", "/")
                ent = Entry(path, name, child_extent, child_size, is_dir)
                result.append(ent)
                if is_dir:
                    walk(child_extent, child_size, parent / name)

        walk(extent, size, PurePosixPath("/"))
        return sorted(result, key=lambda e: (e.path.upper(), not e.is_dir))

    def extract(self, entry: Entry, target: Path):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(self.read_extent(entry.extent, entry.size))


def extension(name: str) -> str:
    suffix = Path(name).suffix
    return suffix[1:].lower() if suffix else ""


def make_tree(entries: list[Entry]) -> str:
    children: dict[str, list[Entry]] = {}
    for e in entries:
        parent = str(PurePosixPath(e.path).parent)
        children.setdefault(parent, []).append(e)
    lines = ["/"]

    def visit(parent: str, prefix: str):
        items = sorted(children.get(parent, []), key=lambda x: (not x.is_dir, x.name.upper()))
        for i, e in enumerate(items):
            last = i == len(items) - 1
            branch = "└── " if last else "├── "
            label = e.name + ("/" if e.is_dir else f" ({e.size} bytes)")
            lines.append(prefix + branch + label)
            if e.is_dir:
                visit(e.path, prefix + ("    " if last else "│   "))

    visit("/", "")
    return "\n".join(lines) + "\n"


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(SOURCE)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PACKAGE.mkdir(parents=True, exist_ok=True)
    iso = RawPsxIso(SOURCE)
    try:
        entries = iso.entries()
        files = [e for e in entries if not e.is_dir]

        (OUTPUT / "tree.txt").write_text(make_tree(entries), encoding="utf-8-sig", newline="")
        with (OUTPUT / "files.csv").open("w", encoding="utf-8-sig", newline="") as fp:
            writer = csv.writer(fp)
            writer.writerow(["nome", "caminho", "extensao", "tamanho_bytes"])
            for e in files:
                writer.writerow([e.name, e.path, extension(e.name), e.size])

        system = next((e for e in files if e.name.upper() == "SYSTEM.CNF"), None)
        if not system:
            raise RuntimeError("SYSTEM.CNF not found")
        system_data = iso.read_extent(system.extent, system.size)
        system_text = system_data.decode("ascii", "replace")
        (OUTPUT / "SYSTEM.CNF.txt").write_text(system_text, encoding="utf-8", newline="")
        match = re.search(r"BOOT\s*=\s*cdrom:\\?([^;\r\n]+)", system_text, re.I)
        if not match:
            raise RuntimeError("BOOT executable not found in SYSTEM.CNF")
        boot_path = "/" + match.group(1).replace("\\", "/").lstrip("/")
        exe = next((e for e in files if e.path.upper() == boot_path.upper()), None)
        if not exe:
            raise RuntimeError(f"Executable {boot_path} not found")

        # Always relevant: boot config and main executable.
        iso.extract(system, PACKAGE / system.path.lstrip("/"))
        exe_target = PACKAGE / exe.path.lstrip("/")
        iso.extract(exe, exe_target)

        # Conservative first-pass candidates: compact data/config/archive files,
        # while excluding extensions that are clearly audiovisual assets.
        av_ext = {
            "xa", "str", "mov", "avi", "mpg", "mpeg", "wav", "vag", "vb", "vh",
            "tim", "bmp", "tga", "pcx", "jpg", "jpeg", "png", "mdec", "mus", "snd",
        }
        interesting_ext = {
            "ini", "cfg", "cnf", "txt", "dat", "bin", "mix", "pak", "tbl", "lst",
            "db", "rules", "mpr", "map", "aud", "fnt", "eng", "ger", "fre", "exe",
        }
        keywords = re.compile(
            r"(RULE|UNIT|BUILD|PROD|STRUCT|VEH|INF|WEAPON|TECH|MISSION|SCEN|DATA|TABLE|CONFIG|MIX)",
            re.I,
        )
        candidates: list[tuple[Entry, str]] = []
        for e in files:
            if e in (system, exe):
                continue
            ext = extension(e.name)
            if ext in av_ext:
                continue
            reason = ""
            if ext in interesting_ext and e.name.upper() != "DATA.MIX":
                reason = f"extensão potencialmente relevante: .{ext}"
            elif keywords.search(e.path) and e.size <= 32 * 1024 * 1024:
                reason = "nome/caminho sugere regras ou dados"
            elif e.size <= 2 * 1024 * 1024 and ext not in {"raw", "img", "iso"}:
                reason = "arquivo compacto de tipo não audiovisual"
            if reason:
                candidates.append((e, reason))
                iso.extract(e, PACKAGE / e.path.lstrip("/"))

        # DATA.FAT is a 2-DWORD header followed by fixed 28-byte records:
        # 20-byte filename, 4-byte length and 4-byte XA metadata. Header[0]
        # is the number of records stored sequentially in DATA.MIX; the rest
        # refer to audiovisual streams in DATA.XA.
        fat_data = iso.read_extent(next(e for e in files if e.name.upper() == "DATA.FAT").extent,
                                   next(e for e in files if e.name.upper() == "DATA.FAT").size)
        mix_entry = next(e for e in files if e.name.upper() == "DATA.MIX")
        mix_count, mix_lba = struct.unpack_from("<II", fat_data, 0)
        internal = []
        relative_offset = 0
        for index, pos in enumerate(range(8, len(fat_data), 28)):
            record = fat_data[pos : pos + 28]
            if len(record) < 28:
                break
            internal_name = record[:20].split(b"\0", 1)[0].decode("ascii", "replace")
            internal_size, xa_meta = struct.unpack_from("<II", record, 20)
            container = "DATA.MIX" if index < mix_count else "DATA.XA"
            offset = relative_offset if container == "DATA.MIX" else None
            internal.append((index, internal_name, internal_size, xa_meta, container, offset))
            if container == "DATA.MIX":
                relative_offset += ((internal_size + LOGICAL - 1) // LOGICAL) * LOGICAL

        if relative_offset != mix_entry.size:
            raise RuntimeError(f"DATA.FAT/DATA.MIX size mismatch: {relative_offset} != {mix_entry.size}")

        with (OUTPUT / "data_fat_files.csv").open("w", encoding="utf-8-sig", newline="") as fp:
            writer = csv.writer(fp)
            writer.writerow(["indice", "nome", "extensao", "tamanho_bytes", "container", "offset_no_container", "xa_metadata"])
            for index, name, size, xa_meta, container, offset in internal:
                writer.writerow([index, name, extension(name), size, container, "" if offset is None else offset, xa_meta])

        internal_dir = PACKAGE / "DATA_MIX_RELEVANT"
        internal_dir.mkdir(parents=True, exist_ok=True)
        internal_candidates = []
        selected_ext = {"sce", "bri", "eng"}
        selected_names = {"TEMPLATE.LST", "TEMPLATE.DAT", "BOBAFETT.BIN", "ENGLISH.OVL"}
        # Extract directly from DATA.MIX's ISO extent, without retaining the
        # full mixed audiovisual/graphics container in the analysis package.
        for index, name, size, xa_meta, container, offset in internal:
            if container != "DATA.MIX":
                continue
            ext = extension(name)
            if ext not in selected_ext and name.upper() not in selected_names:
                continue
            absolute_lba = mix_entry.extent + (offset // LOGICAL)
            data = iso.read_extent(absolute_lba, size)
            target = internal_dir / name
            target.write_bytes(data)
            if ext in {"sce", "bri"}:
                reason = "metadado compacto de cenário/missão"
            elif ext == "eng":
                reason = "texto de tutorial/cenário; útil para identificar eventos e regras especiais"
            elif name.upper() == "BOBAFETT.BIN":
                reason = "binário atípico fora do conjunto regular de mapas"
            elif name.upper().startswith("TEMPLATE."):
                reason = "tabela/lista denominada TEMPLATE"
            else:
                reason = "overlay/localização compacto"
            internal_candidates.append((name, size, reason))

        with (OUTPUT / "internal_candidate_files.csv").open("w", encoding="utf-8-sig", newline="") as fp:
            writer = csv.writer(fp)
            writer.writerow(["nome", "tamanho_bytes", "motivo"])
            writer.writerows(internal_candidates)

        strings_exe = shutil.which("strings.exe") or shutil.which("strings")
        if not strings_exe:
            strings_exe = r"C:\msys64\ucrt64\bin\strings.exe"
        completed = subprocess.run(
            [strings_exe, "-a", "-n", "4", str(exe_target)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        (OUTPUT / "executable_strings.txt").write_bytes(completed.stdout)

        boba_target = internal_dir / "BOBAFETT.BIN"
        boba_completed = subprocess.run(
            [strings_exe, "-a", "-n", "4", str(boba_target)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        (OUTPUT / "boba_fett_strings.txt").write_bytes(boba_completed.stdout)

        exe_header = iso.read_extent(exe.extent, min(exe.size, 2048))
        if exe_header[:8] == b"PS-X EXE":
            pc = struct.unpack_from("<I", exe_header, 0x10)[0]
            text_addr = struct.unpack_from("<I", exe_header, 0x18)[0]
            text_size = struct.unpack_from("<I", exe_header, 0x1C)[0]
            sp_addr = struct.unpack_from("<I", exe_header, 0x30)[0]
        else:
            pc = text_addr = text_size = sp_addr = 0

        report = f"""# Relatório inicial de engenharia reversa

## Disco e boot

- Imagem analisada (somente leitura): `{SOURCE}`
- Sistema de arquivos: ISO 9660 em CD-ROM Mode 2/2352
- Arquivos ISO 9660: {len(files)}
- `SYSTEM.CNF`: `{system.path}`
- Executável de boot: `{exe.path}` ({exe.size} bytes)
- Formato: PS-X EXE; entrada `0x{pc:08X}`, carga `0x{text_addr:08X}`, payload `0x{text_size:X}`, pilha `0x{sp_addr:08X}`

## Contêineres

`DATA.FAT` indexa {len(internal)} itens: {mix_count} armazenados sequencialmente em `DATA.MIX` e {len(internal)-mix_count} itens audiovisuais em `DATA.XA`. O índice completo está em `data_fat_files.csv`. Os itens audiovisuais não foram extraídos.

## Alvos prioritários

1. `SLUS_006.65`: executável principal MIPS R3000 little-endian. É o alvo mais provável para o cálculo global de progresso de produção, contagem de fábricas e aplicação do bônus por múltiplos produtores.
2. `DATA_MIX_RELEVANT/BOBAFETT.BIN`: overlay de código MIPS explicitamente carregado pelo executável. Contém uma identificação do sistema de overlays e strings de gameplay/UI, incluindo `barracks`, `weapon`, `UNITS`, `GAME SPEED` e `PRODUCTION DISRUPTION`. Deve ser analisado em conjunto com o executável.
3. `DATA.FAT`: índice necessário para mapear nomes aos offsets do contêiner; não contém regras por si só.
4. `DATA_MIX_RELEVANT/CNC0PSX.ENG`: tabela de strings com nomes de unidades, edifícios e estados de produção (`Ready`, `On Hold`, `Primary`). É útil para identificar IDs/ordem de tipos e localizar referências cruzadas, mas não aparenta armazenar custos.
5. Arquivos `.SCE` e `.BRI`: metadados binários compactos de cenários. Podem conter condições, IDs e regras específicas de missão; são secundários para a fórmula global de produção.
6. `TEMPLATE.DAT` e `TEMPLATE.LST`: tabelas binárias de templates/terreno. Foram preservadas por serem tabelas, mas parecem menos relacionadas a produção e custos.

## Hipóteses por mecânica

- Tempo de construção: procurar rotinas MIPS que atualizem o progresso da fila a cada tick em `SLUS_006.65` e `BOBAFETT.BIN`; correlacionar referências às strings `Ready`, `On Hold`, `Primary` e aos IDs de tipos em `CNC0PSX.ENG`.
- Quantidade de War Factories/Barracks: procurar iterações sobre estruturas pertencentes à casa/jogador, filtradas por tipo e estado ativo, nos dois binários de código.
- Bônus por múltiplas fábricas: provavelmente cálculo hardcoded (divisão/escala do tempo por uma contagem de produtores), não um arquivo INI. Não há `RULES.INI` ou equivalente solto no disco.
- Custo das unidades: provavelmente tabelas constantes de descritores de tipos dentro de `SLUS_006.65` ou do overlay `BOBAFETT.BIN`; `CNC0PSX.ENG` fornece a ordem/nomenclatura para ajudar a reconhecer essas tabelas.
- Regras de produção: priorizar o código que manipula fila, produtor primário, dinheiro e progresso; depois usar `.SCE/.BRI` para exceções específicas de missão.

## Exclusões desta primeira passagem

Foram deixados fora do pacote os conteúdos de `DATA.XA`, `.STR`, `.MOV`, `.SND`, `.TIM`, tilesets e grandes payloads repetitivos de mapas/células. O `DATA.MIX` integral também não é necessário no pacote: os candidatos foram extraídos seletivamente com base no `DATA.FAT`.
"""
        (OUTPUT / "analysis_report.md").write_text(report, encoding="utf-8", newline="")

        def sha256(path: Path) -> str:
            digest = hashlib.sha256()
            with path.open("rb") as fp:
                for chunk in iter(lambda: fp.read(1024 * 1024), b""):
                    digest.update(chunk)
            return digest.hexdigest()

        checksum_lines = [f"{sha256(SOURCE)}  {SOURCE}"]
        for package_file in sorted((p for p in PACKAGE.rglob("*") if p.is_file()), key=lambda p: str(p).upper()):
            checksum_lines.append(f"{sha256(package_file)}  {package_file}")
        (OUTPUT / "checksums_sha256.txt").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")

        with (OUTPUT / "candidate_files.csv").open("w", encoding="utf-8-sig", newline="") as fp:
            writer = csv.writer(fp)
            writer.writerow(["caminho", "tamanho_bytes", "motivo"])
            writer.writerow([system.path, system.size, "configuração de boot do PlayStation"])
            writer.writerow([exe.path, exe.size, "executável principal identificado por SYSTEM.CNF"])
            for e, reason in candidates:
                writer.writerow([e.path, e.size, reason])

        summary = [
            f"Imagem: {SOURCE}",
            f"Arquivos: {len(files)}",
            f"Diretórios: {len(entries) - len(files)}",
            f"SYSTEM.CNF: {system.path}",
            f"BOOT: {boot_path}",
            f"Executável: {exe.path} ({exe.size} bytes)",
            f"Candidatos adicionais copiados: {len(candidates)}",
            f"Itens indexados por DATA.FAT: {len(internal)} ({mix_count} em DATA.MIX; {len(internal)-mix_count} em DATA.XA)",
            f"Itens internos seletivamente extraídos: {len(internal_candidates)}",
        ]
        (OUTPUT / "extraction_summary.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
        print("\n".join(summary))
    finally:
        iso.close()


if __name__ == "__main__":
    main()
