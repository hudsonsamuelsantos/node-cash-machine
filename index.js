const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs')
const { parse } = require('querystring')

operation()

function operation() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'O que você deseja fazer?',
            choices: ['Criar conta', 'Consultar Saldo', 'Depositar', 'Sacar', 'Transferir', 'Sair']
        }
    ]).then(answer => {
        const action = answer['action']

        if (action === 'Criar conta') {
            createAccount()
        } else if (action === 'Depositar') {
            deposit()
        } else if (action === 'Consultar Saldo') {
            getAccountBalance()
        } else if (action === 'Transferir') {
            transfer()
        } else if (action === 'Sacar') {
            withdraw()
        } else if (action === 'Sair') {
            console.log(chalk.bgBlue.black('Obrigado por usar o Accounts!'))

            process.exit()
        }
    })
        .catch(err => console.log(err))
}

function createAccount() {
    console.log(chalk.bgGreen.black('Parabéns por escolher o nosso banco!'))
    console.log(chalk.green('Defina as opções da sua conta a seguir'))

    buildAccount()
}

function buildAccount() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Digite um nome para sua conta:'
        }
    ]).then(answer => {
        const accountName = answer['accountName']

        console.info(accountName)

        if (!fs.existsSync('accounts')) {
            fs.mkdirSync('accounts')
        }

        if (fs.existsSync(`accounts/${accountName}.json`)) {
            console.log(chalk.bgRed.black('Esta conta já existe, escolha outro nome!'))

            buildAccount()

            return
        }

        fs.writeFileSync(`accounts/${accountName}.json`, '{"balance": 0}', err => {
            console.log(err)
        })

        console.log(chalk.green(`Parabéns, a sua conta de nome: ${accountName} foi criada com sucesso!`))

        operation()
    }).catch(err => console.log(err))
}

function deposit() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da conta?'
        }
    ])
        .then(answer => {
            const accountName = answer['accountName']

            if (!checkAccount(accountName)) {
                return deposit()
            }

            inquirer.prompt([
                {
                    name: 'amount',
                    message: 'Quanto você deseja depositar?'
                }
            ]).then(answer => {
                const amount = answer['amount']

                addAmount(accountName, amount)
                operation()
            })
                .catch(err => console.log(err))

        })
        .catch(err => console.log(err))
}

function checkAccount(accountName) {
    if (!fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(chalk.bgRed.black('Esta conta não existe, tente outro nome!'))

        return false
    }

    return true
}

function addAmount(accountName, amount) {
    const accountData = getAccount(accountName)

    if (!amount) {
        console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente!'))

        return deposit()
    }

    accountData.balance = parseFloat(amount) + parseFloat(accountData.balance)

    fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), err => console.log(err))

    console.log(chalk.green(`Foi depositado o valor de R$${amount} na sua conta!`))
}

function getAccount(accountName) {
    const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
        encoding: 'utf8',
        flag: 'r'
    })

    return JSON.parse(accountJSON)
}

function getAccountBalance() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da conta?'
        }
    ]).then(answer => {
        const accountName = answer['accountName']

        if (!checkAccount(accountName)) {
            return getAccountBalance()
        }

        const accountData = getAccount(accountName)

        console.log(chalk.bgBlue.black(`O saldo da sua conta de nome ${accountName} é de R$${accountData.balance}.`))

        operation()
    })
        .catch(err => console.log)
}

function withdraw() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da conta?'
        }
    ]).then(answer => {
        const accountName = answer['accountName']

        if (!checkAccount(accountName)) {
            return withdraw()
        }

        inquirer.prompt([
            {
                name: "amount",
                message: "Qaunto você deseja sacar?"
            }
        ]).then(answer => {
            const amount = answer['amount']

            removeAmount(accountName, amount)
        })
            .catch(err => console.log(err))
    })
        .catch(err => console.log)
}

function removeAmount(accountName, amount) {
    const accountData = getAccount(accountName)

    if (!amount) {
        console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente!'))

        return withdraw()
    }

    if (accountData.balance < amount) {
        console.log(chalk.bgRed.black('Valor indisponível!'))

        return withdraw()
    }

    accountData.balance = parseFloat(accountData.balance) - parseFloat(amount)

    fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), err => console.log(err))

    console.log(chalk.green(`Foi realizado um saque de R$${amount} da sua conta! Você ainda possui R$${parseFloat(accountData.balance)}!`))

    return operation()
}

function transfer() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da sua conta?'
        }
    ]).then(answer => {
        const accountName = answer['accountName']

        if (!checkAccount(accountName)) {
            return transfer()
        }

        inquirer.prompt([
            {
                name: 'amount',
                message: 'Qual valor você desja transferir?'
            }
        ]).then(answer => {
            const amount = answer['amount']

            if (!checkAccountBalance(accountName, amount)) {
                console.log(chalk.bgRed.black('Valor indisponível!'))

                return operation()
            }

            inquirer.prompt([
                {
                    name: 'beneficiaryAccountName',
                    message: 'Qual o nome da conta para qual você deseja transferir?'
                }
            ]).then(answer => {
                const beneficiaryAccountName = answer['beneficiaryAccountName']

                if (!checkAccount(beneficiaryAccountName)) {
                    return operation()
                } else if (accountName === beneficiaryAccountName) {
                    console.log(chalk.bgRed.black('Não é possível selecionar sua própria conta, por favor, tente outra conta!'))

                    return operation()
                }

                const accountData = getAccount(accountName)
                const beneficiaryAccountData = getAccount(beneficiaryAccountName)

                accountData.balance = parseFloat(accountData.balance) - parseFloat(amount)

                fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), err => console.log(err))

                beneficiaryAccountData.balance = parseFloat(beneficiaryAccountData.balance) + parseFloat(amount)

                fs.writeFileSync(`accounts/${beneficiaryAccountName}.json`, JSON.stringify(beneficiaryAccountData), err => console.log(err))

                console.log(chalk.green(`Transferência de R$${amount} da conta ${accountName} para a conta ${beneficiaryAccountName} realizada com sucesso! `))
            })
                .catch(err => console.log(err))
        })
            .catch(err => console.log(err))
    })
        .catch(err => console.log(err))
}

function checkAccountBalance(accountName, value) {
    const account = getAccount(accountName)

    if (account.balance < value) {
        return false
    } else {
        return true
    }
}