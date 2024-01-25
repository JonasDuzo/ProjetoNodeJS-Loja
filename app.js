// npm install --save mongoose
// npm install --save body-parser
// npm install --save express-handlebars
// npm install --save express
// npm install --save multer


const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const app = express()
const admin = require('./routes/admin')
const usuarios = require('./routes/usuario')

//MODELS
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
require('./models/Produto')
const Produto = mongoose.model('produtos')

//Passport
const passport = require('passport')
require('./config/auth')(passport)

//Manipulando pastas
const path = require('path')

// npm install --save express-session
// npm install --save connect-flash 
const session = require('express-session')
const flash = require('connect-flash')
const MongoStore = require('connect-mongo')


//CONFIGURAÇÕES ------------------------------------------------------

//BodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//HandleBars
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

//Public Path
app.use(express.static(path.join(__dirname, 'public')))

//Moongose
mongoose.Promise = global.Promise
mongoose.connect('mongodb://127.0.0.1:27017/blogapp').then(() => {
    console.log('Conectado ao Mongo')
}).catch((err) => {
    console.log('Erro: ' + err)
})

//SESSÃO
//Dados da sessão são armazenados no banco de dados
app.use(session({
    //Chave para Criptografar os cookies da sessão
    secret: 'AppBlog',
    //Se a cada requisição tenho que salvar ou não a sessão
    resave: false,
    //Se eu devo ou não salvar sessões anonimas
    saveUninitialized: true,
    //Tempo de duração da sessão (30min)
    cookie: { maxAge: 30 * 60 * 1000 },
    //Salvar os dados no Carrinho
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/blogapp' })
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

//Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    // Armazenando dados do usuário logado
    res.locals.user = req.user ? { _id: req.user._id, nome: req.user.nome, email: req.user.email, cep: req.user.cep, complemento: req.user.complemento, numero: req.user.numero } : null
    res.locals.eAdmin = req.user ? req.user.eAdmin === 1 ? req.user.eAdmin : null : null

    next()
})



//ROTAS -------------------------------------------------------
app.use('/admin', admin)
app.use('/usuarios', usuarios)


//LISTANDO POSTAGENS
app.get('/', (req, res) => {
    console.log(req.user)
    Postagem.find().populate('categoria').sort({ date: 'desc' }).lean().then((postagens) => {
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
            res.render('index', { postagens: postagens, produtos })
        })
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Erro interno')
        res.redirect('/404')
    })
})


app.get('/404', (req, res) => {
    res.send('Error 404')
})


// CARREGANDO PRODUTO
app.get('/produto/:nome', (req, res) => {
    Produto.findOne({ nome: req.params.nome }).lean().then((produto) => {

        // Convertendo o caminho da imagem para o Handlebars reconhecer
        produto.imagem = produto.imagem.replace('public\\img\\', '/img/')
        // Convertendo de numero para moeda real
        produto.preco = produto.preco.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })

        if (produto) {
            res.render('produto/index', { produto })
        } else {
            req.flash('error_msg', 'Este produto não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Erro interno: ' + err)
        res.redirect('/')
    })
})

// CARREGANDO POSTAGEM
app.get('/postagem/:slug', (req, res) => {
    Postagem.findOne({ slug: req.params.slug }).lean().then((postagem) => {
        if (postagem) {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            }
            const date = new Date(postagem.date).toLocaleDateString('pt-br', options)
            res.render('postagem/index', { postagem, date })
        } else {
            req.flash('error_msg', 'Está postagem não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Erro interno')
        res.redirect('/')
    })
})

// LISTAR CATEGORIAS
app.get('/categorias', (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render('categorias/index', { categorias: categorias })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao listar as categorias')
        res.redirect('/')
    })
})

//Carregar postagens com slug das categorias
app.get('/categorias/:slug', (req, res) => {
    Categoria.findOne({ slug: req.params.slug }).lean().then((categoria) => {
        if (categoria) {
            Postagem.find({ categoria: categoria._id }).lean().then((postagens) => {
                res.render('categorias/postagens', { postagens: postagens, categoria: categoria })
            }).catch((err) => {
                req.flash('error_msg', 'Erro ao listar as postagens')
                res.redirect('/')
            })

        } else {
            req.flash('error_msg', 'Está categoria não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno')
        res.redirect('/')
    })
})

// LISTAR PRODUTOS
app.get('/produtos', (req, res) => {
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

        res.render('produto/produtos', { produtos })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao listar os produtos')
        res.redirect('/')
    })
})

app.get('/produtos/pesquisar', (req, res) => {
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

        res.render('produto/produtos', { produtos })

    }).catch((err) => {
        req.flash('error_msg', 'Erro interno da pesquisa')
        res.redirect('/produto/produtos')
    })

})


//Conexão do Servidor
const PORT = 8081
app.listen(PORT, () => {
    console.log('Servidor Iniciado!')
})

//Exportar para executavel
// npm i -g pkg
