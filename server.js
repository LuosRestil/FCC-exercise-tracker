const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Setting up user database
mongoose.connect(process.env.ATLAS_URI, {
  useUnifiedTopology: true, 
  useNewUrlParser:true})
  .then(() => console.log('DB Connected!'))
  .catch(err => {
    console.log(`DB Connection Error: ${err.message}`);
  });

let exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Date
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  exercises: [exerciseSchema]
});

let User = mongoose.model('User', userSchema);


// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

app.post("/api/exercise/new-user" , (req, res) => {
  let user = new User({username: req.body.username});
  user.save()
  .then(data => res.send({username: data.username, _id: data._id}));
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
