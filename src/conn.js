
const mysql= require("mysql");
const connection = mysql.createConnection({
  username : "doadmin",
  password : "AVNS_NOaOyGUrLhNVlfvjxEu",
host : "rudetradedb-do-user-13735603-0.b.db.ondigitalocean.com",
port : "25060",
database : "defaultdb",
sslmode : "REQUIRED"
});

connection.connect(function(err) {
  if (err) throw err
  console.log('You are now connected...')
})
module.exports = connection;