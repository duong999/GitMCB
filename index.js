var mysql = require('mysql');
var mqtt  = require('mqtt');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname ) 
app.engine('html', require('ejs').renderFile);
app.use(express.static('public'));

var count = 0;
var client = mqtt.connect("mqtt://broker.hivemq.com:1883",{username:"duongserver@!#",password:"duong123"}); 
// var client = mqtt.connect("http://18.139.208.99/:1883",{username:"dave",password:"123123"}); 
//  var led_status = "duong/ledStatus";
// var message="test message";
var topic_list=["home/sensors/temperature","home/sensors/humidity"];

// console.log("ChrisNguyen=======connected flag  " + client.connected);


// function publish(topic,msg,options){
// 	console.log("publishing",msg);
	
// 	if (client.connected == true){
// 		client.publish(topic,msg,options);
// 	}
// }

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

var server = app.listen(3000, () => {
    console.log("ChrisNguyen=======Connect to requests on port 3000...");
})

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'duong1',
	password : 'duong123',
	database : 'wsn'
});

connection.connect(function(err) {
	if (err) 
		throw err;
	console.log("ChrisNguyen=======mysql connected");
	var sql ="DROP TABLE IF EXISTS sensors";
	connection.query(sql, function(err, result){
		if (err) 
			throw err;
		console.log("ChrisNguyen=======drop tables sensors ok");
	});
	sql = "CREATE TABLE sensors( id INT(10) PRIMARY KEY  auto_increment , Sensor_ID varchar(10) not null, Date_and_Time datetime not null, Temperature int(3) not null,Humidity int(3) not null)"
	connection.query(sql, function(err, result){
		if (err) 
			throw err;
		console.log("ChrisNguyen=======create tables sensors ok");
	});
});





var options={
	retain:true,
	qos:1};
var io = require('socket.io')(server); //Bind socket.io to our express server.



io.on('connection', (socket) => {

    // console.log("duong"); //show a log as a new client connects.
    var today = new Date();
	 connection.query("SELECT * FROM sensors", function (err, result, fields) {
	 if (err) throw err;
	 result.forEach(function(value) {
	 var m_time = value.Date_and_Time.toString().slice(4,24);
	console.log(m_time);
    io.sockets.emit('temp', {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:m_time , temp:value.Temperature,hum:value.Humidity}); 
	 });
	 
	});
	
	socket.on("led_status", function(data){
		console.log(data);
		client.publish("duong/led_status", data);
	  });
	

	
})


var Temp ;
var Hum ;


var cnt_check = 0;

client.on('message',function(topic, message, packet){
	console.log("message is "+ message);
	console.log("topic is "+ topic);
	//message = JSON.parse(message);
	if( topic == topic_list[0]){
		cnt_check ++;
		//Temp = message["Temperature"];
		Temp = message;
	}
	else if( topic == topic_list[1]){
		cnt_check ++;
		//Hum = message["Humidity"];
		Hum = message;
	}
	
	// or: publish is not defined
	if( cnt_check == 2 ){
		cnt_check = 0;
		console.log(Temp,Hum);

		console.log("ChrisNguyen=======ready to save");
		var first_name = "DHT-11";
		var Date_and_Time = new Date().toMysqlFormat(); 
		let query = "INSERT INTO `sensors` (Sensor_ID,Date_and_Time,Temperature,Humidity) VALUES ('" +
		    first_name + "', '" + Date_and_Time + "', '" + Temp + "', '" + Hum + "')";
			connection.query(query, (err, result) => {
		    if (err) {
		        throw err;
		    }
		});

    	var today = new Date(); //new
    	io.sockets.emit(first_name, {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:Date_and_Time , temp:Temp,hum:Hum}); 
		

		 connection.query("SELECT * FROM sensors ORDER BY id DESC LIMIT 1", function (err, result, fields) {
		 if (err) throw err;
		 result.forEach(function(value) {
		 var m_time = value.Date_and_Time.toString().slice(4,24);
   		 console.log('temp', {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:m_time , temp:value.Temperature,hum:value.Humidity}); 
   		 io.sockets.emit('temp', {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:m_time , temp:value.Temperature,hum:value.Humidity}); 
	 });
	 
	});
	}

});

client.on("connect",function(){	
	console.log("ChrisNguyen=======connected  "+ client.connected);
	
});

//handle errors
client.on("error",function(error){
console.log("Can't connect" + error);
process.exit(1)});

var options={
retain:true,
qos:1};

console.log("ChrisNguyen=======subscribing to topics");
client.subscribe(topic_list,{qos:1}); 
console.log("ChrisNguyen=======end of script");
