# Organiza para Windows

Organiza é um aplicativo desktop de controle financeiro pessoal. Registre receitas e despesas, acompanhe os valores por categoria e consulte relatórios mensais. As informações são armazenadas localmente no seu computador.

## Instalação e inicialização

1. Baixe `Organiza.exe` nos arquivos desta versão.
2. Salve-o em uma pasta de sua preferência e abra-o com dois cliques.
3. Opcional: clique com o botão direito em `Organiza.exe` e crie um atalho na área de trabalho.

O aplicativo precisa do WebView2 Runtime, incluído na maioria das instalações atuais do Windows 10 e 11. Se o Windows solicitar confirmação na primeira execução, verifique se o arquivo foi obtido pela página oficial de Releases deste projeto antes de autorizar.

## O que você pode fazer

- Consultar o saldo acumulado, as entradas e as despesas do mês.
- Registrar receitas e despesas com descrição, categoria, data e valor.
- Pesquisar e excluir movimentações.
- Ver totais e lançamentos agrupados por categoria.
- Consultar o resultado mensal e exportar os lançamentos do mês para CSV.

## Onde os dados ficam

O banco de dados não fica dentro do executável e não é enviado para a internet.

- No aplicativo baixado: `%LOCALAPPDATA%\Organiza\organiza.db`
- No modo Python, executado pelo código-fonte: `organiza.db` na pasta do projeto.
- Logs do aplicativo baixado: `%LOCALAPPDATA%\Organiza\organiza.log`

O banco local é criado na primeira execução e preservado quando o executável é atualizado. Faça uma cópia de segurança de `organiza.db` antes de reinstalar o Windows ou mover seus dados para outro computador.

## Exportação CSV

Na área **Relatórios**, escolha o mês e clique em **Exportar CSV**. O arquivo contém data, descrição, categoria, tipo e valor dos lançamentos daquele mês e pode ser aberto em programas de planilha.

## Solução de problemas

- **A janela não abre ou aparece um erro de WebView2:** instale ou atualize o Microsoft Edge WebView2 Runtime e tente novamente.
- **O aplicativo não inicia:** tente executar o arquivo a partir de uma pasta local, em vez de uma pasta compactada ou unidade removível.
- **Precisa recuperar seus dados:** verifique se `%LOCALAPPDATA%\Organiza\organiza.db` ainda existe e restaure sua cópia de segurança, se necessário.

Este aplicativo organiza registros financeiros informados pelo usuário. Ele não se conecta a bancos e não substitui aconselhamento financeiro, contábil ou fiscal.
