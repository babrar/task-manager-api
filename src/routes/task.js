const express = require('express')
const { Types } = require('mongoose') // for ObjectId valiadation (outside course content)
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')

// CREATE
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body) // req.body is a json object
    const task = new Task({
        ...req.body, // es6 syntax for unrolling all items (same as **kwargs in python)
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=false
// GET /tasks?limit10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {

    // This can be implemented in 2 ways.
    // 1) Grab the current user and find all its tasks (execPopulate())
    // 2) From the Task collection find tasks with owner id === current user's id
    // Using the 2nd approach since it requires less refactoring
    try {
        // const tasks = await Task.find({owner: req.user._id})
        // res.send(tasks)

        // Alternatively, one can use the 1st method
        match = {}
        if (req.query.completed) {
            match.completed = req.query.completed === 'true'
        }

        sort = {}
        if (req.query.sortBy){
            [sortBy, sortOrder] = req.query.sortBy.split(':')
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1
        }

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)

    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const isValidId = Types.ObjectId.isValid(_id)
    if (!isValidId) {
        return res.status(400).send("Bad ObjectId format")
    }

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})
// UPDATE
router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    // check if update is allowed
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidUpdate) {
        return res.status(400).send({ error: "Invalid update property" })
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])

        await task.save()

        res.send(task)
    } catch (e) {
        // validation errors or mongodb errros
        // separate later
        res.status(400).send()
    }
})
// DELETE
router.delete('/tasks/:id', auth, async (req, res) => {
    // cascading delete (i.e. deleting all tasks of user if that user is deleted) 
    // is handled by User middleware
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()

        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router
