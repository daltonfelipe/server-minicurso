var express = require("express");
var http = require('http');
var app = express();
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://10.1.19.55');

app.set('view engine', 'ejs');
app.set('porta', process.env.PORT || 3000);
app.use(express.static('public'));


var server = http.createServer(app).listen(app.get('porta'), function() {
    console.log("Conexao estabelecida, servindo na porta 3000");
});

var io = require('socket.io').listen(server);
//[MQTT] faz o subscribe no status
client.on('connect', function() {
    console.log('Cliente conectado!');
    client.subscribe('status');
});
//[MQTT] recebe o status
var status;
client.on('message', function(topic, status) {
    status = status.toString();
    console.log("status recebido: " + status);
    // [SOCKET.IO] envia o status recebido para o client
    io.sockets.emit("status", status);
});
// contador de usuarios
var users = 0;
//[SOCKET.IO] faz a conexao com o client
io.on('connection', function(socket) {
    // a cada conexao um usuario é acrescentado
    users++;
    // [SOCKET.IO] recebe a acao do client
    socket.on('acao', function(acao) {
        console.log("led " + acao);
        // [MQTT] envia a acao de "on" ou "off"
        client.publish('acao', acao);
    });
    // [SOCKET.IO] notifica ao broker que o cliente desconectou
    socket.on('disconnect', function(socket) {
        // [MQTT] envia a acao para o led ser desligado
        if (users == 1) {
            client.publish('acao', 'off');
        }
        console.log('Cliente desconectado!');
        // diminui um usuario
        users--;
    });
});

app.get('/', function(req, res) {
    res.render('index');
});