# Organiza para Windows

O Organiza é um aplicativo de controle financeiro pessoal para Windows. Registre receitas e despesas, acompanhe os valores por categoria e consulte relatórios mensais. Seus dados ficam armazenados localmente no computador.

## Instalação e inicialização

1. Baixe `Organiza.exe` na seção **Assets** desta versão.
2. Salve o arquivo em uma pasta de sua preferência e abra-o com dois cliques.
3. Para criar um atalho na área de trabalho, clique com o botão direito em `Organiza.exe` e selecione **Enviar para > Área de trabalho (criar atalho)**. No Windows 11, talvez seja necessário clicar primeiro em **Mostrar mais opções**.

O aplicativo requer o Microsoft Edge WebView2 Runtime, que já vem instalado na maioria dos computadores com Windows 10 e 11. Se o Windows pedir autorização na primeira execução, confirme que o arquivo foi baixado da página oficial de [Releases do Organiza](https://github.com/Patricker487/organiza-financeiro/releases) antes de prosseguir.

## Funcionalidades

- Consultar o saldo acumulado e o total de receitas e despesas do mês.
- Registrar receitas e despesas com descrição, categoria, data e valor.
- Pesquisar e excluir lançamentos.
- Consultar os totais e lançamentos de cada categoria.
- Ver o resultado mensal e exportar os lançamentos do período selecionado para CSV.

## Armazenamento dos dados

O banco de dados fica fora do executável. O Organiza não envia seus registros financeiros para a internet.

- Aplicativo baixado: `%LOCALAPPDATA%\Organiza\organiza.db`
- Executado pelo código-fonte: `organiza.db`, na pasta do projeto.
- Log do aplicativo baixado: `%LOCALAPPDATA%\Organiza\organiza.log`

O banco local é criado na primeira execução e preservado quando o aplicativo é atualizado. Faça uma cópia de segurança de `organiza.db` antes de reinstalar o Windows ou transferir seus dados para outro computador.

## Exportação CSV

Na área **Relatórios**, selecione o mês desejado e clique em **Exportar CSV**. O arquivo contém a data, a descrição, a categoria, o tipo e o valor dos lançamentos do período. Você pode abri-lo em um programa de planilhas.

## Solução de problemas

- **A janela não abre ou aparece um erro do WebView2:** instale ou atualize o Microsoft Edge WebView2 Runtime e tente novamente.
- **O aplicativo não inicia:** extraia o executável para uma pasta local e abra-o de lá. Não o execute diretamente de um arquivo compactado ou de uma unidade removível.
- **Você precisa recuperar seus dados:** verifique se o arquivo `%LOCALAPPDATA%\Organiza\organiza.db` existe. Se necessário, restaure uma cópia de segurança.

O Organiza apenas registra as informações inseridas por você. Ele não se conecta a instituições financeiras nem substitui orientação financeira, contábil ou fiscal.
