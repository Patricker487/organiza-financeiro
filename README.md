<div align="center">
  <img src="assets/organiza.png" width="72" height="72" alt="Logo do Organiza">

  # Organiza

  **Controle financeiro pessoal, simples e local.**

  Aplicativo desktop para registrar movimentações, visualizar categorias e acompanhar relatórios mensais — sem depender de uma conta ou servidor na nuvem.

  [Baixar para Windows](https://github.com/Patricker487/organiza-financeiro/releases/latest) · [Como instalar](RELEASE_README.md) · [Gerar o executável](#gerar-o-executável)
</div>

---

## Sobre o projeto

Organiza é um aplicativo desktop de finanças pessoais feito para manter o registro do dinheiro direto no computador. A interface tem inspiração visual no Windows XP Luna, com navegação simples para consultar o saldo, registrar receitas e despesas e entender os gastos ao longo do tempo.

Os dados ficam em um banco SQLite local. Não há servidor HTTP, sincronização em nuvem ou necessidade de criar uma conta.

## Recursos

- **Visão geral:** saldo acumulado, entradas e despesas do mês, fluxo dos últimos seis meses e panorama de gastos.
- **Movimentações:** registro e exclusão de receitas e despesas, com descrição, categoria, data e valor.
- **Categorias:** totais de entradas, despesas e quantidade de lançamentos, com acesso às movimentações de cada categoria.
- **Relatórios mensais:** resultado do mês e detalhamento por categoria.
- **Exportação CSV:** exporte as movimentações do mês selecionado para abrir em planilhas.
- **Armazenamento local:** banco SQLite persistente, separado do executável.
- **Interface em português:** valores em reais e datas no formato brasileiro.

## Baixar e executar

1. Acesse [Releases](https://github.com/Patricker487/organiza-financeiro/releases/latest) e baixe `Organiza.exe`.
2. No Windows, abra o arquivo para iniciar o aplicativo. O WebView2 Runtime é necessário e já está disponível na maioria das instalações atuais do Windows 10 e 11.
3. Para facilitar o acesso, clique com o botão direito no executável e escolha a opção de criar atalho.

Consulte [RELEASE_README.md](RELEASE_README.md) para instruções de instalação, dados e solução de problemas.

## Executar pelo código-fonte

Requisitos: Windows, Python 3.10 ou superior e WebView2 Runtime.

```powershell
python -m pip install -r requirements.txt
python main.py
```

## Gerar o executável

No Windows, execute `gerar_exe.bat`. O script instala as dependências e gera:

- `dist\Organiza.exe` — aplicativo independente, sem janela de terminal;
- `dist\Organiza.lnk` — atalho do Windows para o aplicativo.

O ícone do executável e a marca da interface são gerados a partir dos arquivos em `assets/`.

## Dados e privacidade

- Ao executar pelo Python, o banco é salvo como `organiza.db` na pasta do projeto.
- No executável, os dados ficam em `%LOCALAPPDATA%\Organiza\organiza.db`.
- O aplicativo não inclui dados pessoais no executável nem precisa de conexão à internet para acessar os registros.
- Logs de execução são salvos em `%LOCALAPPDATA%\Organiza\organiza.log` no aplicativo empacotado.

Faça cópias de segurança do banco de dados regularmente. Banco de dados, logs e executáveis gerados são arquivos locais e não devem ser enviados ao repositório junto com o código-fonte.

## Tecnologias

- Python e SQLite
- pywebview
- HTML, CSS e JavaScript
- PyInstaller

## Licença

Ainda não foi definida uma licença para este projeto. Até que uma licença seja adicionada, todos os direitos permanecem reservados; consulte o autor antes de reutilizar ou redistribuir o código.
