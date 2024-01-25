const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Venda = new Schema({
    idUsuario: {
        type: Schema.Types.ObjectId,
        ref: 'usuarios',
        required: true
    },
    nomeUsuario: {
        type: Schema.Types.String,
        ref: 'usuarios',
        required: true
    },

    produtos: [
        {
            idProduto: {
                type: Schema.Types.ObjectId,
                ref: 'produtos',
                required: true
            },
            imagemProduto: {
                type: Schema.Types.String,
                ref: 'produtos',
                required: true
            },
            nomeProduto: {
                type: Schema.Types.String,
                ref: 'produtos',
                required: true
            },
            precoProduto: {
                type: Schema.Types.Number,
                ref: 'produtos',
                required: true
            },
            qtde: {
                type: Number,
                required: true
            },
        }
    ],
    total: {
        type: Number,
        required: true
    }
}, { timestamps: true })

mongoose.model('vendas', Venda)