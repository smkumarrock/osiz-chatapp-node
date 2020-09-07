const express = require('express')
const app = express();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/chatapp";

const http = require('http');
const server = http.Server(app);

const socketIO = require('socket.io');
const io = socketIO(server);

const port = process.env.PORT || 3200;

io.on('connection', (socket) => {
    console.log('user connected');
    socket.on('join', function(data) {
        socket.join(data.targtUserRoom+'-'+data.curUserRoom);
        socket.join(data.curUserRoom+'-'+data.targtUserRoom);
        console.log('the', data.name ,'has joined to ', data.room);
        io.emit('user joined', {data});
        socket.broadcast.to(data.targtUserRoom+'-'+data.curUserRoom).emit(data.message, 'new user');
        socket.broadcast.to(data.curUserRoom+'-'+data.targtUserRoom).emit(data.message, 'new user');
    });
    socket.on('message', function(data) {
        console.log(data);
        io.in(data.CRroom, data.TRroom).emit('new message', {room: data.room, message: data.message, name: data.name});
    });
    socket.on('login', function(data){
        console.log(data.name);
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatapp");
            var roomNo = Math.floor(100000 + Math.random() * 900000);
            var myobj = { name: data.name, room: roomNo };
            dbo.collection("chatusers").insertOne(myobj, function(err, res) {
              if (err) throw err;
              io.emit('loginres', res);
              console.log("1 document inserted");
              db.close();
            });
          });
    });;
    socket.on('userList', function(){
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatapp");
            dbo.collection("chatusers").find({}).toArray(function(err, result) {
              if (err) throw err;
              console.log(result);
              db.close();
              io.emit('getUser', result);
            });
          });
    });
    socket.on('single user', function(roomId){
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatapp");
            console.log('roomId', roomId);
            
            dbo.collection("chatusers").find({}, {'room': roomId}).toArray( function(err, result) {
              if (err) throw err;
              console.log(result);
              db.close();
              io.emit('getSingleUser', result);
            });
          });
    })

    socket.on('getUserDetails', function(U_Id){
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatapp");
            console.log('U_Id', U_Id);
            console.log('U_Id', U_Id.user);
            
            dbo.collection("chatusers").find({room: parseInt(U_Id)}).toArray(function(err, result) {
              if (err) throw err;
              console.log(result);
              db.close();
              io.emit('getSingleUserDetails', result);
            });
          });
    })
});

server.listen(port, () => {
    console.log(`started on port: ${port}`);
});
io.on('disconnect', () => {
    console.log('user disconnected');
});