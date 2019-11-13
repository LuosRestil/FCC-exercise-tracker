const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const shortid = require("shortid");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Setting up database
mongoose
  .connect(process.env.ATLAS_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => console.log("DB Connected!"))
  .catch(err => {
    console.log(`DB Connection Error: ${err.message}`);
  });

let exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now()}
});

let userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  _id: { type: String, default: shortid.generate },
  exercises: [exerciseSchema]
});

let User = mongoose.model("User", userSchema);

// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })
// Error Handling middleware
// app.use((err, req, res, next) => {
//   let errCode, errMessage
//   if (err.errors) {
//     // mongoose validation error
//     errCode = 400 // bad request
//     const keys = Object.keys(err.errors)
//     // report the first validation error
//     errMessage = err.errors[keys[0]].message
//   } else {
//     // generic or custom error
//     errCode = err.status || 500
//     errMessage = err.message || 'Internal Server Error'
//   }
//   res.status(errCode).type('txt')
//     .send(errMessage)
// })

app.post("/api/exercise/new-user", (req, res) => {
  let user = new User({ username: req.body.username});
  user.save(err => {
    if (err) {
      return res.send({
        success: false,
        message: "username taken"
      })
    }
    res.send({username: user.username, _id: user._id});
  })
});

app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.send(err);
    let userArray = [];
    users.forEach(user => {
      userArray.push({username: user.username, _id: user._id});
    });
    res.send(userArray)
  });
});

app.post("/api/exercise/add", (req, res) => {
  if (req.body.date) {
    User.findOneAndUpdate({_id: req.body.userId},{$push: {exercises:{
      description: req.body.description, 
      duration: req.body.duration, 
      date: req.body.date
    }}},{ "new": true, "upsert": true },(err, data) => {
    if (err) return res.send(err);
    res.send(data)
    })
  } else {
    User.findOneAndUpdate({_id: req.body.userId},{$push: {exercises:{
      description: req.body.description, 
      duration: req.body.duration
    }}},{ "new": true, "upsert": true },(err, data) => {
    if (err) return res.send(err);
    res.send(data)
    })
  }
})

app.get('/api/exercise/log', (req, res) => {
  let log = [];
  let limit = req.query.limit;
  let from = req.query.from;
  let to = req.query.to;
  User.findOne({_id: req.query.userId}, (err, data) => {
    if (err) {
      res.send(err);
    }
    log = data.exercises.slice();
    if (from && !to) {
      log = log.map(item => item.date > from);
    } else if (!from && to) {
      log = log.map(item => item.date < to);
    } else if (from && to) {
      log = log.map(item => item.date > from && item.date < to);
    }
    if (limit) {
      log = log.slice(0, limit);
    }
    res.send({
      username: data.username, 
      _id: data._id, 
      count: data.exercises.length,
      log: log});
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
