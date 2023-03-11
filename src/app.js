const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const session = require("express-session");

const connection = require("../src/conn");

const defaultPort =  9000;
const port = process.env.PORT || defaultPort;



app.use(
  session({
    secret: "mysecret", // a secret string used to sign the session ID cookie
    resave: false, // do not save the session if it has not been modified
    saveUninitialized: true, // do not save the session if it has not been initialized
  })
);

const staticPath = path.join(__dirname, "../views");
const partialsPath = path.join(__dirname, "../partials");
const cssPath = path.join(__dirname, "../public");

app.use(express.static(cssPath));
app.use(express.static(staticPath));

app.set("view engine", "ejs");
app.set("views", "./views");


const bodyparser = require("body-parser");
const { resourceLimits } = require("worker_threads");
const { normalize } = require("path");
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.render("index");
});


app.post("/register", function (req, res) {
  var username = req.body.userName;
  var emailid = req.body.emailID;
  var password = req.body.password;
  var cpassword = req.body.cpassword;

  if (password === cpassword) {
    var sql = "INSERT INTO rudeusers(name,email,password) VALUES(UPPER('" + username + "'), '" + emailid + "', '" + password + "' )";
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log("record inserted");
      res.redirect("/");
    });
  } else {
    console.log("password mismatch");
  }
});

app.post("/login", (req, res) => {

  var emailId = req.body.emailID;
  var password = req.body.password;

  var sql = "SELECT * FROM rudeusers WHERE email = '" + emailId + "'  and password = '" + password +"' ";
  connection.query(sql, function (error, results) {
    if (results.length > 0) {
      req.session.name = results[0].name;
      req.session.user_id = results[0].user_id;

      res.redirect("dashboard");
    } else {
      res.send("wrong id or password");
    }
  });
});

function process_weekly_ChartData(rows) {

    const Sunday = rows.filter((row) => row.week_name === 'Sunday').map((row) => row.pnl) || 0;
    const Monday = rows.filter((row) => row.week_name === 'Monday').map((row) => row.pnl) || 0;
    const Tuesday = rows.filter((row) => row.week_name === 'Tuesday').map((row) => row.pnl) || 0;
    const Wednesday = rows.filter((row) => row.week_name === 'Wednesday').map((row) => row.pnl) || 0;
    const Thusday = rows.filter((row) => row.week_name === 'Thursday').map((row) => row.pnl) || 0;
    const Friday = rows.filter((row) => row.week_name === 'Friday').map((row) => row.pnl) || 0;
    const Saturday = rows.filter((row) => row.week_name === 'Saturday').map((row) => row.pnl) || 0;

    
    const data = [Sunday,Monday, Tuesday,Wednesday,Thusday,Friday,Saturday];
    const colors = data.map((value) => value < 0 ? '#ff0000' : '#00ed0e');
    const background_Color = data.map((value) => value < 0 ? '#ff0000' : '#00ed0e');
    
  const label = ['Sunday','Monday', 'Tuesday','Wednesday','Thusday','Friday','Saturday'];
  return {
    labels: label,
    datasets: [
      {
        label: "Weekly PNL",
        data: data,
        fill: true,
        borderColor: colors,        
        borderWidth: 1,
        backgroundColor : background_Color
      },
    ],
  };
}

function process_monthly_ChartData(rows) {

  const data =rows.map(rows => rows.pnl)
  const label =rows.map(rows => rows.date)
  const colors = data.map((value) => value > 0 ? '#00ed0e' : '#ff0000');
  return {
    labels: label,
    datasets: [
      {
        label: "Monthly PNL",
        data: data,
        fill: {
          target: 'origin',
          above: '#00ed0e', 
          below: '#ff0000', 

        },
        borderColor: colors,        
        borderWidth: 1,
      },
    ],
  };
}

app.get('/weekly-chart-data', (req, res) => {
  const user_id = req.session.user_id;
    var sql = "SELECT DATE_FORMAT(`trade_date`, '%W') AS week_name, `pnl` FROM day_pnl WHERE (WEEK(`trade_date`) = WEEK(CURDATE()) AND id ='"+user_id+"')  ORDER BY `trade_date` DESC;"
    
    connection.query(sql, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
      } else {
        const chartData = process_weekly_ChartData(results);
        res.send(chartData);
      }
    });
});

app.get('/monthly-chart-data', (req, res) => {
  const user_id = req.session.user_id;

    var sql = "SELECT DATE_FORMAT(`trade_date`, '%D') AS date, `pnl` FROM day_pnl WHERE (MONTH(`trade_date`)  = MONTH(CURDATE()) AND id ='"+user_id+"') ;"
    
    connection.query(sql, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
      } else {
        const chartData = process_monthly_ChartData(results);

        res.send(chartData);
      }
    });
});

app.get("/dashboard", (req, res) => {

  const user_id = req.session.user_id;

  connection.query(
    'UPDATE usersdata SET `pnl_buy` = `exit_price` - `entry_price`  WHERE `action`="BUY";'
  );
  connection.query(
    'UPDATE usersdata SET `pnl_sell` = `entry_price` - `exit_price` WHERE `action`= "SELL";'
  );
  connection.query("UPDATE usersdata SET pnl = `pnl_buy` + `pnl_sell`;");
  connection.query("UPDATE usersdata SET pnl = `pnl`* `quantity`;");
  
  var msql ="SELECT *   FROM rudeusers  JOIN usersdata   ON rudeusers.user_id = usersdata.id WHERE usersdata.id='" +user_id +"' ORDER BY usersdata.trade_id DESC LIMIT 18 ;  ";

  connection.query(msql, function (error, rult, fields, row) {
    req.session.rult = rult;
    res.render("dashboard", { rult });
  });

  const name = req.session.name;
});

app.post("/new_trade", function (req, res) {
  rult = req.session.rult;

  

  const user_id = req.session.user_id;
  var trade_status = req.body.trade_status;
  var buy_sell = req.body.buy_sell;
  var market = req.body.market;
  var instrument = req.body.instrument;
  var quantity = req.body.quantity;
  var trading_system = req.body.trading_system;
  var emotions = req.body.emotions;
  var date_time = req.body.date_time;
  var exit_date_time = req.body.exit_date_time;
  var entry_price = req.body.entry_price;
  var exit_price = req.body.exit_price;
  var fees = req.body.fees;
  var trade_notes = req.body.trade_notes;

  var sql =
    "INSERT INTO `usersdata` (`id`, `trade_status`, `action`, `market`, `Instrument`, `quantity`, `system`, `emotions`, `entry_date_time`, `exit_date_time`, `entry_price`, `exit_price`, `fees`, `notes`) VALUES  ('" +
    user_id +
    "', '" +
    trade_status +
    "', UPPER('" +
    buy_sell +
    "'), UPPER('" +
    market +
    "'),UPPER( '" +
    instrument +
    "'), '" +
    quantity +
    "', '" +
    trading_system +
    "', '" +
    emotions +
    "', '" +
    date_time +
    "', '" +
    exit_date_time +
    "', '" +
    entry_price +
    "', '" +
    exit_price +
    "', '" +
    fees +
    "','" +
    trade_notes +
    "') ;";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("trade inserted");
  });

  connection.query(
    'UPDATE usersdata SET `pnl_buy` = `exit_price` - `entry_price`  WHERE `action`="BUY";'
  );
  connection.query(
    'UPDATE usersdata SET `pnl_sell` = `entry_price` - `exit_price` WHERE `action`= "SELL";'
  );
  connection.query("UPDATE usersdata SET pnl = `pnl_buy` + `pnl_sell`;");
  connection.query("UPDATE usersdata SET pnl = `pnl`* `quantity`;");
    
  connection.query("INSERT INTO `day_pnl`(`id`, `trade_date`, `pnl`) VALUES ('" + user_id + "', DATE('" + date_time + "'), (SELECT SUM(`pnl`) FROM `usersdata` WHERE DATE(`entry_date_time`) = DATE('" + date_time + "'))) ON DUPLICATE KEY UPDATE `pnl` = `pnl` + (SELECT SUM(`pnl`) FROM `usersdata` WHERE DATE(`entry_date_time`) = DATE('" + date_time + "'));");




  res.redirect("/dashboard");
});

app.get("/account_settings", function (req, res) {
  const user_id = req.session.user_id;

  var msql = "SELECT *   FROM rudeusers  WHERE user_id='" + user_id + "';  ";

  connection.query(msql, function (error, result, fields, row) {
    if(result.length>0){
      const name = result[0].name;
      res.render("profile", { result });
      
    } else{
      const result = ""
      res.render("profile", { result });

    }

  });


  // const name = "moiht";

  // res.render('profile');
});

app.get("/trades", function (req, res) {
  // console.log("trade is")
  // const userId = req.params.userId
  // console.log(userId)
  connection.query(
    'UPDATE usersdata SET `pnl_buy` = `exit_price` - `entry_price`  WHERE `action`="BUY";'
  );
  connection.query(
    'UPDATE usersdata SET `pnl_sell` = `entry_price` - `exit_price` WHERE `action`= "SELL";'
  );
  connection.query("UPDATE usersdata SET pnl = `pnl_buy` + `pnl_sell`;");
  connection.query("UPDATE usersdata SET pnl = `pnl`* `quantity`;");
  connection.query("UPDATE `day_pnl` SET `pnl` = (SELECT SUM(`pnl`) FROM `usersdata` WHERE DATE(`entry_date_time`) = day_pnl.trade_date) ;");
  
    
  const user_id = req.session.user_id;
  var msql =
    "SELECT `trade_id`, `action`, `Instrument`, DATE_FORMAT(`entry_date_time`, '%Y-%m-%d %H:%i:%s ') AS `entry_date`,DATE_FORMAT(`exit_date_time`, '%Y-%m-%d %H:%i:%s ') AS `exit_date`, `entry_price`, `exit_price`, `quantity`, `pnl` FROM `rudeusers` JOIN `usersdata` ON `rudeusers`.`user_id` = `usersdata`.`id` WHERE `usersdata`.`id` = '" + user_id + "' ORDER BY `usersdata`.`trade_id` DESC;";

  connection.query(msql, function (error, rult, fields, row) {
    req.session.rult = rult;
    const green_color = rult.pnl > 0;

    res.render("trades", { rult, green_color });
  });
});

app.get("/calender", function (req, res) {
  const user_id = req.session.user_id;
  var msql =
    "SELECT *   FROM rudeusers  JOIN usersdata   ON rudeusers.user_id = usersdata.id WHERE usersdata.id='" +
    user_id +
    "' ORDER BY usersdata.trade_id DESC ;  ";

  connection.query(msql, function (error, rult, fields, row) {
    req.session.rult = rult;

    res.render("calender", { rult });
  });
});
app.get("/note", function (req, res) {
  const user_id = req.session.user_id;

  var sql = "SELECT * FROM `usernote` WHERE `id`= '"+user_id+"'; "
  connection.query(sql,(err, result) =>{
    
    if(result.length > 0){
      const Note = result[0].note;
      res.render("note",{Note});
    } else{
      const Note = "Click Edit to Add Note"
      res.render("note",{Note});

      }
    }) 
});
app.post("/add_note", function (req, res) {
  const user_id = req.session.user_id;
  var note_insert = req.body.note_add;
  connection.query("INSERT INTO `usernote`(`id`, `note`) VALUES ('"+user_id+"','"+note_insert+"') ON DUPLICATE KEY UPDATE `note` = '"+note_insert+"';")

  // var sql = ""
  // connection.querry(sql,(error, result) =>{

  // })
  
  res.redirect("/note");
  
});

app.get("/trade_details/:trade_id", function (req, res) {
  
  const userId = req.params.trade_id; // Get the user ID from the URL parameter
  console.log(userId)
  // Do something with the user ID (e.g., retrieve user data from a database)
  res.send('hi');
  
  
});

app.post("/change_password", (req,res) => {
  const user_id = req.session.user_id
  var old_pass = req.body.old_pass
  var new_pass = req.body.new_pass
  console.log(user_id)
  connection.query("UPDATE `rudeusers` SET `password`='"+new_pass+"' WHERE (`user_id`='"+user_id+"' AND `password`= '"+old_pass+"')");
  res.redirect("/account_settings")


})
app.get("/contact_us", (req,res) => {

  res.render("contact_us") 


})
app.get("/delete_trade/:trade_id", (req,res) =>{
  const trade_id = req.params['trade_id']; // Get the user ID from the URL parameter
  connection.query("DELETE FROM `usersdata` WHERE `trade_id`= '"+trade_id+"';")
  res.redirect("/trades")
})

app.listen(port, () => {
  console.log("server is running at port ", port);
});
