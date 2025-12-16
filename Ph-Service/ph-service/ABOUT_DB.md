# Banco de Dados Simples (db.json)

O sistema agora utiliza um arquivo local chamado `db.json` para salvar todas as suas informações.

## Como funciona
1. Todas as alterações (cadastros, vendas, exclusões) são salvas automaticamente neste arquivo.
2. Ao fechar e abrir o site, os dados são recarregados deste arquivo.
3. Este arquivo está localizado na raiz do projeto: `c:\Users\Tay\Desktop\Ph Service\ph-service\db.json`.

## Backup
Para fazer um backup dos seus dados, basta copiar o arquivo `db.json` para um local seguro (pen drive, nuvem, etc).

## Restaurar Backup
Se precisar restaurar, basta substituir o arquivo `db.json` atual pelo arquivo de backup e reiniciar o site.
