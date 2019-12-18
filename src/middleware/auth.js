/**
 * Middleware for routes that require authentication
 * usage: router.get/post('path', auth, callback)
 */
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '') // grab token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) // ensure token was issued by this app
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }) // check if token belongs to the user in the payload

        if (!user) {
            throw new Error()
        }

        // pass token to route handler
        req.token = token
        // pass user to route handler (in order avoid re-finding user)
        req.user = user
        next()

    } catch (e) {
        res.status(401).send({ error: "Please authenticate" })
    }
}

module.exports = auth