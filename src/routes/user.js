const express = require('express')
const { Types } = require('mongoose') // for ObjectId valiadation (outside course content)
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth') // auth middleware
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

// CREATE (SIGN UP) - NO AUTH NEEDED
router.post('/users', async (req, res) => {
    const user = new User(req.body) // req.body is a json object
    try {
        const token = await user.generateAuthToken()
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send({ user, token })
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

// LOGIN - NO AUTH NEEDED
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken() // user is passed as 'this' into the function
        res.send({ user, token })
    } catch (e) {
        res.status(400).send("" + e) // just send(e) doesn't work. Check SO
    }
})

// LOGOUT - SINGLE SESSION
router.post('/users/logout', auth, async (req, res) => {
    try {
        // remove current token from user
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()

        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

// LOGOUT - ALL SESSIONS
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        // reset all tokens
        req.user.tokens = []
        await req.user.save()

        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

//READ
router.get('/users/me', auth, async (req, res) => {
    // middleware already handled errors
    // and passed user obj into req.user
    res.send(req.user)
})

// UPDATE
router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'age', 'email', 'password']
    // flatten incoming object into an array of its properties
    const updates = Object.keys(req.body)
    // only allow updates if it's an allowed update
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidUpdate) {
        return res.status(400).send({ error: "Invalid update property" })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])

        await req.user.save()

        res.send(req.user)
    } catch (e) {
        // could be mongdb connection loss or validator error
        // deal with them separately later
        console.log(e);
        res.status(400).send({ error: "Validation/Server error" })
    }
})
// DELETE
router.delete('/users/me', auth, async (req, res) => {
    // cascading task deletion is handled by 'remove' middleware
    try {
        await req.user.remove()
        
        sendCancelationEmail(req.user.email, req.user.name)

        res.send(req.user)

    } catch (e) {
        res.status(500).send("" + e)
    }
})

// UPLOAD AVATAR
const upload = multer({
    // dest: 'avatars', // can't be used if uploaded file needs to be accessible in route handler
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload jpg, jpeg, or png"))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => { // this function is run when middleware throws error
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined

        await req.user.save()
        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

// FETCH AVATAR by ID
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send()
    }
})
module.exports = router