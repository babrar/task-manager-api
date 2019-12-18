// REST APIs
const express = require('express')
require('./db/mongoose') // connection module
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')

const app = express()
const port = process.env.PORT

app.use(express.json()) // accept json in http req body
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is running on port ' + port);
})