var mongoose = require("mongoose");

var options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(
  "mongodb+srv://Margaux:hello@cluster0.pbrbs.mongodb.net/InterviewCop?retryWrites=true&w=majority",
  options,
  function (err) {
    if (err) {
      console.log(`error, failed to connect to the database because --> ${err}`);
    } else {
      console.info("*** Database InterviewCop connection : Success ***");
    }
  }
);
