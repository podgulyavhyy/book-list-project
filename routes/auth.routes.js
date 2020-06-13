const {Router} = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')

const router = Router()


// /api/auth/register
router.post('/register',
    [check('email', 'Email not valid').isEmail(),
        check('password', 'Min password length is 6 symbols').isLength({min: 6})],
    async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Invalid credentials'
            })
        }

        const {email, password} = req.body

        const candidate = await User.findOne({email})

        if (candidate) {
            return res.status(400).json({message: 'This user already exists'})
        }
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({email, password: hashedPassword})

        await user.save()

        res.status(201).json({message: 'User successfully created'})

    } catch (e) {
        res.status(500).json({message: 'Something went wrong'})
    }
})


// /api/auth/login
router.post('/login',
    [check('email', 'Email does not exist').isEmail(),
        check('password', 'Wrong password').exists()],
    async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Invalid credentials'
            })
        }
        const {email, password} = req.body
        //console.log('email and pass log', {email, password})
        const user = await User.findOne({email})

        if (!user) {
            return res.status(400).json({message: 'User not found'})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.status(400).json({message: "Wrong password"})
        }
        const token = jwt.sign(
            {userId: user.id},
            config.get('jwtSecret'),
            {expiresIn: '1h'}
        )

        res.json({ token, userId: user.id })

    } catch (e) {
        res.status(500).json({message: 'Something went wrong'})
    }

})

module.exports = router