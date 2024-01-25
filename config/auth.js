// npm i --save passport
// npm i --save passport-local

const localStrategy = require("passport-local").Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

//Model de Usuário 
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')

module.exports = function (passport) {

    //Dizendo ao passport quais são os campos utilizados no login para fazer a autenticação
    passport.use(new localStrategy({ usernameField: 'email', passwordField: 'senha' }, (email, senha, done) => {
        Usuario.findOne({ email: email }).lean().then((usuario) => {
            if (!usuario) {
                //null = dados da conta autenticada
                //false = se a autenticação aconteceu com sucesso ou não
                return done(null, false, { message: 'Esta conta não existe' })
            }

            //Verificar se as senhas digitada do usuário é igual que está no banco
            bcrypt.compare(senha, usuario.senha, (err, batem) => {
                if (batem) {
                    return done(null, usuario)
                } else {
                    return done(null, false, { message: 'Senha incorreta' })
                }
            })
        })
    }))

    //Guardar um cookie e uma sessão
    passport.serializeUser((usuario, done) => {
        done(null, usuario._id)
    })

    //Caminho reverso, ele vai transformar os cookies em objetos novamente, para verificar se o usuário é valido
    passport.deserializeUser((id, done) => {

        Usuario.findById(id).then((usuario) => {
            console.log(`Nome do Usuário logado: ${usuario.nome}`)
            done(null, usuario)
        }).catch((err) => {
            done(null, false, { message: 'Algo deu errado' })
        })
    })
}