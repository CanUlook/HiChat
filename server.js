//服务器及页面响应部分
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器
    users = [];  //保存所有在线用户昵称
app.use('/', express.static(__dirname + '/www'));
server.listen(80);
 
//socket部分
io.on('connection', function(socket) {
    //昵称设置
    socket.on('login', function(nickname) {
       if (users.indexOf(nickname)>-1){
       	socket.emit('nickExisted');
       }else{
       	socket.userIndex = users.length;
       	socket.nickname = nickname;
       	users.push(nickname);
       	socket.emit('loginSuccess');
       	io.sockets.emit('system',nickname,users.length,'login');
       };
    });
    socket.on('disconnect',function(){
    	//将断开连接的用户从用户中删除
    	users.splice(socket.userIndex,1);
		//通知除自己以外的所有人
		socket.broadcast.emit('system',socket.nickname,users.length,'logout'); 
    });  

    socket.on('postMsg',function(msg){
    	//将消息传送到出自己以外的所有用户
    	socket.broadcast.emit('newMsg',socket.nickname,msg);
    });     

    //接受用户发来的图片
    socket.on('img',function(user,img){
    	this.displayImage(user,img);
    });
});

