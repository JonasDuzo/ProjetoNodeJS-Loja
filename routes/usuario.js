const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
// npm i --save bcryptjs 
const bcrypt = require('bcryptjs')
const passport = require('passport')
const Handlebars = require('handlebars')

require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
require('../models/Produto')
const Produto = mongoose.model('produtos')
require('../models/Venda')
const Venda = mongoose.model('vendas')

//Carregando o helper / Pegando somente a função eUser
//Colocar o eUser em todas as rotas para especificar que somente o Usuário Logado pode usar aquela rota
const { eUser } = require('../helpers/conta')

//ROTAS
router.get('/registro', (req, res) => {
    res.render('usuarios/registro')
})


router.post('/registro/cad', (req, res) => {
    var erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: 'Nome inválido' })
    }

    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ texto: 'Email inválido' })
    }

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: 'Senha inválido' })
    }

    if (req.body.senha.length < 4) {
        erros.push({ texto: 'Senha muito curta' })
    }

    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: 'As senhas são diferentes' })
    }

    if (erros.length > 0) {
        res.render('usuarios/registro', { erros: erros })
    } else {
        Usuario.findOne({ email: req.body.email }).then((usuario) => {
            if (usuario) {
                req.flash('error_msg', 'Já existe uma conta com este e-mail')
                res.redirect('/usuarios/registro')
            } else {

                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    cep: req.body.cep,
                    logradouro: req.body.logradouro,
                    complemento: req.body.complemento,
                    bairro: req.body.bairro,
                    localidade: req.body.localidade,
                    uf: req.body.uf,
                    numero: req.body.numero,
                    senha: req.body.senha,
                    // eAdmin: 1
                })

                // Criptografando senha (Hash)
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (err, hash) => {
                        if (err) {
                            req.flash('error_msg', 'Houve um erro ao salvar o usuário')
                            res.redirect('/')
                        }

                        novoUsuario.senha = hash

                        novoUsuario.save().then(() => {
                            req.flash('success_msg', 'Cadastro realizado com sucesso!')
                            res.redirect('/')
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve um erro ao criar o usuário')
                        })
                    })
                })

            }
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro interno')
            res.redirect('/')
        })
    }
})

router.get('/login', (req, res) => {
    res.render('usuarios/login')
})

//Autenticando o usuário
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/usuarios/login',
        failureFlash: true,
    })(req, res, next)
})

//Logout
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect('/')
    })
})

//Informações da conta
router.get('/conta', eUser, (req, res) => {
    res.render('usuarios/conta')
})

router.post('/conta/edit', eUser, (req, res) => {
    Usuario.findOne({ _id: req.body.id }).then((usuario) => {
        usuario.nome = req.body.nome
        usuario.email = req.body.email
        usuario.cep = req.body.cep
        usuario.logradouro = req.body.logradouro
        usuario.complemento = req.body.complemento
        usuario.bairro = req.body.bairro
        usuario.cidade = req.body.cidade
        usuario.uf = req.body.uf
        usuario.numero = req.body.numero

        usuario.save().then(() => {
            req.flash('success_msg', 'Conta editada com sucesso!')
            res.redirect('/')
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao salvar as edições da conta')
            res.redirect('/')
        })

    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao editar a conta')
        res.redirect('/')
    })
})



//CARRINHO-------------------------------------------
router.get('/carrinho', (req, res) => {
    const carrinho = req.session.carrinho

    // Fazendo o handlebars converter para moeda BR
    Handlebars.registerHelper('formatarMoeda', function (valor) {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    })

    res.render('usuarios/carrinho', { carrinho })
})

router.get('/carrinho/carrinho-add/:id', (req, res) => {
    Produto.findOne({ _id: req.params.id }).lean().then((produto) => {
        // Convertendo o caminho da imagem para o Handlebars reconhecer
        produto.imagem = produto.imagem.replace('public\\img\\', '/img/')

        // Verificar se há um carrinho na sessão do usuário
        if (!req.session.carrinho) {
            req.session.carrinho = {
                produtos: [],
                total: 0,
            }
        }

        // Adicionar o produto ao carrinho na sessão
        const carrinho = req.session.carrinho
        const produtoExistente = carrinho.produtos.find(item => item.produtoID.toString() === produto._id.toString())

        if (produtoExistente) {
            produtoExistente.quantidade += 1
        } else {
            carrinho.produtos.push({
                produtoID: produto._id,
                produtoImagem: produto.imagem,
                produtoNome: produto.nome,
                produtoPreco: produto.preco,
                quantidade: 1,
            })
        }

        // Atualizar o total do carrinho
        carrinho.total += produto.preco

        // Salvar o carrinho na sessão
        req.session.save()

        if (produto) {
            res.redirect('/usuarios/carrinho')
        } else {
            req.flash('error_msg', 'Erro ao carregar o carrinho')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Erro interno Carrinho: ' + err)
        res.redirect('/')
    })
})

router.get('/carrinho/limpar-carrinho', (req, res) => {
    // Verificar se há um carrinho na sessão do usuário
    if (req.session.carrinho) {
        // Limpar o carrinho
        req.session.carrinho = {
            produtos: [],
            total: 0,
        }

        // Salvar o carrinho na sessão
        req.session.save()
    }

    res.redirect('/usuarios/carrinho')
})

router.get('/carrinho/excluir-item/:id', (req, res) => {
    const carrinho = req.session.carrinho || { produtos: [], total: 0 }

    // Encontrar o índice do produto a ser removido no array de produtos do carrinho
    const indiceProduto = carrinho.produtos.findIndex(item => item.produtoID.toString() === req.params.id)

    if (indiceProduto !== -1) {
        const produtoRemovido = carrinho.produtos.splice(indiceProduto, 1)[0]

        // Certificar-se de que produtoRemovido está definido e todas as propriedades necessárias estão presentes
        if (produtoRemovido && produtoRemovido.quantidade && produtoRemovido.produtoPreco) {
            carrinho.total -= produtoRemovido.quantidade * produtoRemovido.produtoPreco

            req.session.carrinho = carrinho

            req.flash('success_msg', 'Produto removido do carrinho')
        } else {
            req.flash('error_msg', 'Erro ao remover produto do carrinho')
        }
    } else {
        req.flash('error_msg', 'Produto não encontrado no carrinho')
    }

    res.redirect('/usuarios/carrinho')
})

router.post('/carrinho/finalizar', eUser, (req, res) => {

    const novaVenda = {
        idUsuario: req.body.idUsuario,
        nomeUsuario: req.body.nomeUsuario,
        produtos: [],
        total: req.body.total
    }

    // Itera pelos arrays de produtos e quantidades
    for (let i = 0; i < req.body.produtoID.length; i++) {
        novaVenda.produtos.push({
            idProduto: req.body.produtoID[i],
            imagemProduto: req.body.produtoImagem[i],
            nomeProduto: req.body.produtoNome[i],
            precoProduto: req.body.produtoPreco[i],
            qtde: req.body.quantidade[i]
        })
    }

    new Venda(novaVenda).save().then(() => {
        req.flash('success_msg', 'Compra realizada com sucesso!')
        req.session.carrinho = {
            produtos: [],
            total: 0
        }
        res.redirect('/')
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao comprar o produto: ' + err)
        res.redirect('/')
    })
})


// PEDIDOS -------------------------------------
router.get('/pedidos', eUser, (req, res) => {
    Venda.find({ idUsuario: req.user._id }).sort({ createdAt: 'desc' }).lean().then((vendas) => {

        // vendas.forEach((venda) => {
        //     console.log(venda.produtos)
        // })

        // Fazendo o handlebars converter para moeda BR
        Handlebars.registerHelper('formatarMoeda', function (valor) {
            return valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
        })

        // Fazendo o handlebars converter para data
        Handlebars.registerHelper('formatarData', function (valor) {
            return valor.toLocaleString('pt-BR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            })
        })

        res.render('usuarios/pedidos', { vendas })
    }).catch((err) => {
        console.error('Erro ao buscar pedidos: ', err);
        req.flash('error_msg', 'Erro ao buscar pedidos');
        res.redirect('/');
    });
})



module.exports = router