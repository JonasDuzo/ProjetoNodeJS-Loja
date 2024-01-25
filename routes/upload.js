const path = require('path')
const multer = require('multer')

var storate = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, 'uploads/')
        cb(null, 'public/img')
    },

    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname)
        cb(null, Date.now() + ext)
    }

})

var upload = multer({
    storage: storate,
    limits: {
        fileSize: 1024 * 1024 * 2
    }
})

module.exports = upload

