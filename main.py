from contextlib import contextmanager
import logging
import os
import shutil
import sqlite3
import sys
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

import webview


PASTA_PROJETO = Path(__file__).resolve().parent
PASTA_RECURSOS = Path(getattr(sys, "_MEIPASS", PASTA_PROJETO))
CATEGORIAS = {
    "Alimentação",
    "Vendas",
    "Transporte",
    "Moradia",
    "Lazer",
    "Saúde",
    "Educação",
    "Salário",
    "Outros",
}


def pasta_dados():
    if getattr(sys, "frozen", False):
        raiz_dados = Path(os.environ.get("LOCALAPPDATA", Path.home()))
        return raiz_dados / "Organiza"
    return PASTA_PROJETO


CAMINHO_BANCO = pasta_dados() / "organiza.db"


def configurar_logs():
    diretorio_logs = pasta_dados()
    diretorio_logs.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(diretorio_logs / "organiza.log", encoding="utf-8"),
            *([] if getattr(sys, "frozen", False) else [logging.StreamHandler()]),
        ],
    )


@contextmanager
def conectar_banco():
    conexao = sqlite3.connect(CAMINHO_BANCO)
    try:
        yield conexao
        conexao.commit()
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()


def preparar_banco():
    CAMINHO_BANCO.parent.mkdir(parents=True, exist_ok=True)
    with conectar_banco() as conexao:
        conexao.execute("""
            CREATE TABLE IF NOT EXISTS movimentacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                descricao TEXT NOT NULL,
                categoria TEXT NOT NULL,
                tipo TEXT NOT NULL
                    CHECK(tipo IN ('Receita', 'Despesa')),
                valor_centavos INTEGER NOT NULL
                    CHECK(valor_centavos > 0)
            )
        """)


def migrar_banco_existente():
    if not getattr(sys, "frozen", False) or CAMINHO_BANCO.exists():
        return

    CAMINHO_BANCO.parent.mkdir(parents=True, exist_ok=True)
    pasta_executavel = Path(sys.executable).resolve().parent
    candidatos = (
        pasta_executavel / "organiza.db",
        pasta_executavel.parent / "organiza.db",
    )
    for origem in candidatos:
        if origem.is_file() and origem.resolve() != CAMINHO_BANCO.resolve():
            shutil.copy2(origem, CAMINHO_BANCO)
            logging.info("Banco de dados existente copiado de %s.", origem)
            return


def converter_valor(texto):
    texto = str(texto).strip().replace("R$", "").replace(" ", "")

    if not texto:
        raise ValueError("Informe o valor da movimentação.")

    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")

    try:
        valor = Decimal(texto)
    except InvalidOperation as erro:
        raise ValueError("Digite um valor válido, como 150,50.") from erro

    if not valor.is_finite() or valor <= 0:
        raise ValueError("O valor precisa ser maior que zero.")

    centavos = (valor * 100).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )

    if centavos > 999_999_999_999:
        raise ValueError("O valor informado é muito alto.")

    if centavos <= 0:
        raise ValueError("O valor precisa ser de pelo menos R$ 0,01.")

    return int(centavos)


def converter_data_banco(texto):
    for formato in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(texto, formato).date()
        except ValueError:
            continue
    raise ValueError("A data cadastrada no banco é inválida.")


def serializar_movimentacao(registro):
    id_movimentacao, data_texto, descricao, categoria, tipo, centavos = registro
    return {
        "id": id_movimentacao,
        "date": converter_data_banco(data_texto).isoformat(),
        "description": descricao,
        "category": categoria,
        "type": tipo,
        "amount": centavos / 100,
    }


class OrganizaApi:
    def list_transactions(self):
        try:
            with conectar_banco() as conexao:
                registros = conexao.execute("""
                    SELECT id, data, descricao, categoria, tipo, valor_centavos
                    FROM movimentacoes
                    ORDER BY id DESC
                """).fetchall()
            logging.info("Movimentações carregadas: %s.", len(registros))
            return {
                "success": True,
                "data": [serializar_movimentacao(registro) for registro in registros],
            }
        except (sqlite3.Error, ValueError):
            logging.exception("Não foi possível carregar as movimentações.")
            return {
                "success": False,
                "error": "Não foi possível carregar as movimentações. Consulte o log do Organiza.",
            }

    def create_transaction(self, dados):
        try:
            if not isinstance(dados, dict):
                raise ValueError("Os dados da movimentação são inválidos.")

            descricao = dados.get("description")
            categoria = dados.get("category")
            tipo = dados.get("type")
            data_texto = dados.get("date")

            if not isinstance(descricao, str) or not descricao.strip():
                raise ValueError("Informe uma descrição para a movimentação.")
            descricao = descricao.strip()
            if len(descricao) > 120:
                raise ValueError("A descrição deve ter no máximo 120 caracteres.")
            if not isinstance(categoria, str) or categoria not in CATEGORIAS:
                raise ValueError("Selecione uma categoria válida.")
            if not isinstance(tipo, str) or tipo not in ("Receita", "Despesa"):
                raise ValueError("Selecione Receita ou Despesa.")
            if not isinstance(data_texto, str):
                raise ValueError("Informe uma data válida.")
            try:
                data_movimentacao = date.fromisoformat(data_texto)
            except ValueError as erro:
                raise ValueError("Informe uma data válida.") from erro
            centavos = converter_valor(dados.get("amount"))

            with conectar_banco() as conexao:
                cursor = conexao.execute("""
                    INSERT INTO movimentacoes
                    (data, descricao, categoria, tipo, valor_centavos)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    data_movimentacao.strftime("%d/%m/%Y"),
                    descricao,
                    categoria,
                    tipo,
                    centavos,
                ))
                id_movimentacao = cursor.lastrowid

            registro = (
                id_movimentacao,
                data_movimentacao.strftime("%d/%m/%Y"),
                descricao,
                categoria,
                tipo,
                centavos,
            )
            return {"success": True, "data": serializar_movimentacao(registro)}
        except ValueError as erro:
            return {"success": False, "error": str(erro)}
        except sqlite3.Error:
            logging.exception("Não foi possível salvar a movimentação.")
            return {
                "success": False,
                "error": "Não foi possível salvar a movimentação. Consulte o log do Organiza.",
            }

    def delete_transaction(self, id_movimentacao):
        try:
            id_movimentacao = int(id_movimentacao)
        except (TypeError, ValueError):
            return {"success": False, "error": "Movimentação inválida."}

        try:
            with conectar_banco() as conexao:
                cursor = conexao.execute(
                    "DELETE FROM movimentacoes WHERE id = ?",
                    (id_movimentacao,),
                )
            if cursor.rowcount == 0:
                return {"success": False, "error": "Movimentação não encontrada."}
            return {"success": True, "data": {"deleted": True}}
        except sqlite3.Error:
            logging.exception("Não foi possível excluir a movimentação.")
            return {
                "success": False,
                "error": "Não foi possível excluir a movimentação. Consulte o log do Organiza.",
            }

    def close_app(self):
        if webview.windows:
            webview.windows[0].destroy()
        return {"success": True, "data": None}


def main():
    configurar_logs()
    migrar_banco_existente()
    preparar_banco()
    api = OrganizaApi()
    arquivo_html = PASTA_RECURSOS / "index.html"

    if not arquivo_html.is_file():
        raise FileNotFoundError(f"Arquivo da interface não encontrado: {arquivo_html}")

    logging.info("Iniciando o Organiza. Banco de dados: %s", CAMINHO_BANCO)
    webview.create_window(
        "Organiza — Controle Financeiro",
        arquivo_html.as_uri(),
        js_api=api,
        width=1280,
        height=850,
        min_size=(900, 600),
        background_color="#f7f8f5",
    )
    webview.start(debug=not getattr(sys, "frozen", False))


if __name__ == "__main__":
    main()
