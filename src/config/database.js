const mongoose = require("mongoose");

const dbContacion = async () => {
  console.log(process.env.DB_URI);

  mongoose
    .connect(
      "mongodb+srv://boss:1234@pos.jsfduqc.mongodb.net/job?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then((conn) => {
      console.log(`databases Connceted:${conn.connection.host}`);
    });
};

module.exports = dbContacion;
