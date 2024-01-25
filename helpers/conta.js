// Veriricando se o usuário autenticado é um Admin

module.exports = {
    eAdmin: function (req, res, next) {

        if (req.isAuthenticated() && req.user.eAdmin == 1) {
            return next()
        }
        req.flash('error_msg', 'Você precisa ser um Admin')
        res.redirect('/')
    },

    eUser: function (req, res, next) {

        if (req.isAuthenticated()) {
            return next()
        }
        req.flash('error_msg', 'Você precisa ser um Usuário')
        res.redirect('/')
    }
}