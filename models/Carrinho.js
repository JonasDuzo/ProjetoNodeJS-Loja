const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Carrinho = new Schema({
    produtos: [
        {
            produtoID: {
                type: Schema.Types.ObjectId,
                ref: 'produtos'
            },
            produtoImagem: {
                type: Schema.Types.String,
                ref: 'produtos'
            },
            produtoNome: {
                type: Schema.Types.String,
                ref: 'produtos'
            },
            produtoPreco: {
                type: Schema.Types.Number,
                ref: 'produtos'
            },
            quantidade: Number,
        },
    ],
    total: Number,
})

mongoose.model('carrinho', Carrinho)
