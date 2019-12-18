const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'baninabrar98@gmail.com',
        subject: 'Thanks for joining Task App',
        text: `Hello ${name}, welcome to Task app. Let me know how it goes.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'baninabrar98@gmail.com',
        subject: 'Sorry to see you go :(',
        text: `Hello ${name}, I am sorry to see you go. Let me know what I could have done to make you stay.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}