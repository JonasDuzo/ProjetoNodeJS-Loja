const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Usuario = new Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    cep: {
        type: Number,
        required: true
    },
    logradouro: {
        type: String,
        required: true
    },
    complemento: {
        type: String,
    },
    bairro: {
        type: String,
        required: true
    },
    localidade: {
        type: String,
        required: true
    },
    uf: {
        type: String,
        required: true
    },
    numero: {
        type: Number,
        required: true
    },

    // Verificando se o suário é Admin, se for 1 = usuário admin
    eAdmin: {
        type: Number,
        default: 0
    },

    // npm i --save bcryptjs 
    senha: {
        type: String,
        required: true
    }
})

mongoose.model('usuarios', Usuario)