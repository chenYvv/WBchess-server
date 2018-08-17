'use strict'

let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

server.listen(4747, function() {
	console.log('listening on:4747');
});

// 基本配置文件
let max_players = 30;

//大厅
let hall = {
	'player': 0,
	'socket': null,
};

//匹配队列
let queue = {
	'player': 0,
	'socket': null,
};

let rooms = [];

// 默认创建空房间
for (let i = 0; i < max_players; i++) {
	rooms[i] = {
		'player': 0,
		'socket': null,
	};
}

// 获取一个空房间
function getRoom () {
	for (let i = 0; i < max_players; i++) {
		if ( rooms[i].player == 0 ) {
			return i;
		}
	}
	return -1;
}



io.player = 0; // 初始化玩家数量
io.on('connection',function(socket){
    console.log('one player connected');
    io.player++;
    socket.on('disconnect',function(){
        console.log('one player disconnected');
        io.player--;
    });
    console.log('connected players: ' + io.player);
    console.log('hall players: ' + hall.player);
    console.log('queue players: ' + queue.player);
});

// 大厅连接
hall.socket = io.of('/hall').on('connection', function(socket) {
    hall.player++;
    console.log('a player connected.There are '+hall.player+' people in hall');
	// 点击开始按钮, 断开玩家大厅的socket
	socket.on('disconnect',function(){
		console.log('a player leave hall');
        hall.player--;
	});
    console.log('connected players: ' + io.player);
    console.log('hall players: ' + hall.player);
    console.log('queue players: ' + queue.player);
});

// 匹配队列
queue.socket = io.of('/queue').on('connection', function(socket) {
    queue.player++;
    if ( queue.player == 1 ) {
    	socket.emit('set stand','black');
    }else if ( queue.player == 2){
    	socket.emit('set stand','white');
		let roomId = getRoom();
		console.log('roomId: ' + roomId);
		if ( roomId >= 0 ) {
			// 传递房间号
	    	queue.socket.emit('match success', roomId);
		}else{
			console.log('no empty room!');
		}
    }
	// 点击取消, 断开玩家queue
	socket.on('disconnect',function(){
		console.log('a player leave queue');
    	queue.player--;
	});
    console.log('connected players: ' + io.player);
    console.log('hall players: ' + hall.player);
    console.log('queue players: ' + queue.player);
});

// 链接房间 增加人数
for (let i = 0; i < max_players; i++) {
	rooms[i].socket = io.of('/room' + i).on('connection', function(socket) {
		rooms[i].player++;
		console.log('someone connected room'+i+'.There are '+rooms[i].player+' player in the room');
		// 玩家退出, 断开玩家room
		socket.on('disconnect',function(){
	    	rooms[i].player--;
            console.log('someone disconnected room'+i+'.There are '+rooms[i].player+' player in the room');
		});
		// 发布更新棋盘
		socket.on('update chessboard',function(chessCoor){
			socket.broadcast.emit('update chessboard',chessCoor);
		});
		// 发布交换对手
		socket.on('change turn',function(){
			socket.broadcast.emit('change turn');
		});

	
	});
}