const moongose = require('mongoose')
const Schema = moongose.Schema

const Produto = new Schema({
    nome: {
        type: String,
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    imagem: {
        type: String,
        required: true
    }
}, { timestamps: true })

moongose.model('produtos', Produto)