const express = require('express')
const router = express.Router()
const Handlebars = require('handlebars')

// Multer é o pactoe utilizado para fazer o upload de arquivos
// const multer = require('multer')
const upload = require('../routes/upload')

//Usando um model de forma externa
const mongoose = require('mongoose')
require('../models/Categoria')
const Categoria = mongoose.model('categorias')
require('../models/Postagem')
const Postagem = mongoose.model('postagens')
require('../models/Produto')
const Produto = mongoose.model('produtos')
require('../models/Venda')
const Venda = mongoose.model('vendas')

//Carregando o helper / Pegando somente a função eAdmin
//Colocar o eAdmin em todas as rotas para especificar que somente o Admin pode usar aquela rota
const { eAdmin } = require('../helpers/conta')

//ROTAS
router.get('/', eAdmin, (req, res) => {
    // res.send('Página Principal ADM')
    res.render('admin/index', { user: req.session.user })
})

// CATEGORIAS --------------------------------------------------------------
router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().lean().sort({ date: 'desc' }).then((categorias) => {
        res.render('admin/categorias', { categorias: categorias })
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao listar as Categorias')
        res.redirect('/admin')
    })
})

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategoria')
})

router.post('/categorias/cad', eAdmin, (req, res) => {
    var erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: 'Nome inválido' })
    }

    if (req.body.nome.length < 2) {
        erros.push({ texto: 'Nome muito pequeno' })
    }

    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: 'Slug inválido' })
    }

    if (req.body.slug.length < 2) {
        erros.push({ texto: 'Slug muito pequeno' })
    }

    if (erros.length > 0) {
        res.render('admin/addcategoria', {
            erros: erros
        })
    } else {
        //Criando uma nova Categoria no Banco de Dados
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }
        new Categoria(novaCategoria).save().then(() => {
            req.flash('success_msg', 'Categoria criada com sucesso!')
            res.redirect('/admin/categorias')
        }).catch(() => {
            req.flash('error_msg', 'Falha ao registra uma Categoria!')
            res.redirect('/admin')
        })
    }
})

router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render('admin/editcategoria', { categoria: categoria })
    }).catch((err) => {
        req.flash('error_msg', 'Categoria não existe')
        res.redirect('/admin/categorias')
    })
})

router.post('/categorias/edit', eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.body.id }).then((categoria) => {
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(() => {
            req.flash('success_msg', 'Categoria editada com sucesso!')
            res.redirect('/admin/categorias')
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao salvar as edições da categoria')
            res.redirect('/admin/categorias')
        })

    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao editar a categoria')
        res.redirect('/admin/categorias')
    })
})

router.post('/categorias/excluir', eAdmin, (req, res) => {
    Categoria.deleteOne({ _id: req.body.id }).then(() => {
        req.flash('success_msg', 'Categoria exluida com sucesso!')
        res.redirect('/admin/categorias')
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao deletar a categoria')
        res.redirect('/admin/categorias')
    })
})



// POSTAGENS ------------------------------------------------------------------
router.get('/postagens', eAdmin, (req, res) => {
    Postagem.find().populate('categoria').lean().sort({ date: 'desc' }).then((postagens) => {
        res.render('admin/postagens', { postagens: postagens })
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao listar as Postagens')
        res.redirect('/admin/postagens')
    })
})


router.get('/postagens/add', eAdmin, (req, res) => {
    Categoria.find().lean().sort({ date: 'desc' }).then((categorias) => {
        res.render('admin/addpostagem', { categorias: categorias })
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao carregar o formulário')
        res.redirect('/admin')
    })
})

router.post('/postagens/cad', eAdmin, (req, res) => {
    var erros = []

    if (req.body.titulo.length < 2) {
        erros.push({ texto: 'Titulo muito pequeno' })
    }

    if (req.body.categoria == '0') {
        erros.push({ texto: 'Categoria inválida, registre uma nova categoria' })
    }

    if (erros.length > 0) {
        res.render('admin/addpostagem', { erros: erros })
    } else {
        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            date: req.body.date,
            categoria: req.body.categoria
        }

        new Postagem(novaPostagem).save().then(() => {
            req.flash('success_msg', 'Postagem criada com sucesso!')
            res.redirect('/admin/postagens')
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao registrar uma Postagem')
            res.redirect('/admin/postagens')
        })
    }
})

router.get('/postagens/edit/:id', eAdmin, (req, res) => {

    Postagem.findOne({ _id: req.params.id }).lean().then((postagem) => {

        Categoria.find().lean().then((categorias) => {
            res.render('admin/editpostagem', { categorias: categorias, postagem: postagem })
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao listar as categorias')
            res.redirect('/admin/postagens')
        })

    }).catch((err) => {
        req.flash('error_msg', 'Erro ao carregar o formulário de edição')
        res.redirect('/admin/postagens')
    })

})

router.post('/postagens/edit', eAdmin, (req, res) => {
    Postagem.findOne({ _id: req.body.id }).then((postagem) => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.date = req.body.date

        postagem.save().then(() => {
            req.flash('success_msg', 'Postagem editada com sucesso!')
            res.redirect('/admin/postagens')
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao salvar as edições da postagem')
            res.redirect('/admin/postagens')
        })

    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao editar a postagem')
        res.redirect('/admin/postagens')
    })
})

router.post('/postagens/excluir', eAdmin, (req, res) => {
    Postagem.deleteOne({ _id: req.body.id }).then(() => {
        req.flash('success_msg', 'Postagem exluida com sucesso!')
        res.redirect('/admin/postagens')
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao deletar a postagem')
        res.redirect('/admin/postagens')
    })
})

// PRODUTOS
router.get('/produtos', eAdmin, (req, res) => {
    Produto.find().lean().then((produtos) => {

        produtos = produtos.map(produto => {
            // Convertendo o caminho da imagem para o Handlebars reconhecer
            produto.imagem = produto.imagem.replace('public\\img\\', '/img/')
            // Convertendo de numero para moeda real
            produto.preco = produto.preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
            return produto
        })

        res.render('admin/produtos', { produtos })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao carregar os produtos')
    })
})

router.get('/produtos/pesquisar', eAdmin, (req, res) => {
    Produto.find({ nome: req.query.nome }).lean().then((produtos) => {
        produtos = produtos.map(produto => {
            // Convertendo o caminho da imagem para o Handlebars reconhecer
            produto.imagem = produto.imagem.replace('public\\img\\', '/img/')
            // Convertendo de numero para moeda real
            produto.preco = produto.preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
            return produto
        })

        res.render('admin/produtos', { produtos })

    }).catch((err) => {
        req.flash('error_msg', 'Erro interno da pesquisa')
        res.redirect('/admin/produtos')
    })

})

router.get('/produtos/add', eAdmin, (req, res) => {
    res.render('admin/addproduto')
})

router.post('/produtos/cad', eAdmin, upload.single('imagem'), (req, res) => {

    console.log(req.file, req.body)

    erros = []
    if (req.body.nome.length < 2) {
        erros.push({ texto: 'Nome muito pequeno' })
    }

    if (erros.length > 0) {
        res.render('admin/addproduto', { erros: erros })
    } else {
        const novoProduto = {
            nome: req.body.nome,
            preco: req.body.preco,
        }
        if (req.file) {
            novoProduto.imagem = req.file.path
        }

        new Produto(novoProduto).save().then(() => {
            req.flash('success_msg', 'Produto criado com sucesso')
            res.redirect('/admin/produtos')
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao cadastrar o produto')
            res.redirect('/admin/produtos')
        })
    }
})

router.get('/produtos/edit/:id', eAdmin, (req, res) => {

    Produto.findOne({ _id: req.params.id }).lean().then((produto) => {
        produto.imagem = produto.imagem.replace('public\\img\\', '/img/')
        res.render('admin/editproduto', { produto })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao carregar o formulário de edição')
        res.redirect('/admin/produtos')
    })

})

router.post('/produtos/edit', eAdmin, upload.single('imagem'), (req, res) => {
    Produto.findOne({ _id: req.body.id }).then((produtos) => {
        produtos.nome = req.body.nome
        produtos.preco = req.body.preco
        produtos.imagem = req.body.imagem

        if (req.file) {
            produtos.imagem = req.file.path
        }

        produtos.save().then(() => {
            req.flash('success_msg', 'Produto editado com sucesso!')
            res.redirect('/admin/produtos')
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao salvar as edições do produto: ' + err)
            res.redirect('/admin/produtos')
        })

    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao editar o produto')
        res.redirect('/admin/produtos')
    })
})

router.post('/produtos/excluir', eAdmin, (req, res) => {
    Produto.deleteOne({ _id: req.body.id }).then(() => {
        req.flash('success_msg', 'Produto exluido com sucesso!')
        res.redirect('/admin/produtos')
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao deletar o produto')
        res.redirect('/admin/produtos')
    })
})

router.get('/pedidos', eAdmin, (req, res) => {
    Venda.find().lean().then((vendas) => {

        const somaPrecos = vendas.reduce((soma, vendas) => soma + vendas.total, 0);
        const somaPrecosVenda = somaPrecos.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })

        vendas.forEach((venda) => {

            venda.total = venda.total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
            venda.createdAt = venda.createdAt.toLocaleString('pt-BR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            })

            venda.produtos.forEach((produtos) => {
                produtos.precoProduto = produtos.precoProduto.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })
            })

        })

        res.render('admin/pedidos', { vendas, somaPrecosVenda })
    })
})


router.get('/pedidos/pesquisar', eAdmin, (req, res) => {
    Venda.find({ nomeUsuario: req.query.nomeUsuario }).lean().then((vendas) => {
        const somaPrecos = vendas.reduce((soma, vendas) => soma + vendas.total, 0);
        const somaPrecosVenda = somaPrecos.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
        vendas.forEach((venda) => {

            venda.total = venda.total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
            venda.createdAt = venda.createdAt.toLocaleString('pt-BR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            })

            venda.produtos.forEach((produtos) => {

                produtos.precoProduto = produtos.precoProduto.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })

            })
        })

        res.render('admin/pedidos', { vendas, somaPrecosVenda })

    }).catch((err) => {
        req.flash('error_msg', 'Erro interno da pesquisa')
        res.redirect('/admin/pedidos')
    })

})


module.exports = router