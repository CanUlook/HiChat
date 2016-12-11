window.onload = function(){
	//实例并初始化我们的hichat程序
	var hichat = new HiChat();
	hichat.init();
};

//定义我们的hichat
var HiChat = function(){
	this.socket = null;
};

//向原型添加业务方法
HiChat.prototype = {
	init: function(){ //此方法初始化程序
		var that = this;
		//建立到服务器的socket连接
		this.socket = io.connect();
		//监听socket的connect事件，此事件表示连接已经建立
		this.socket.on('connect',function(){
			//连接到服务器后，显示昵称输入框
			document.getElementById('info').textContent = 'get yourself a nickName:';
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});

		//昵称设置的确定按钮
		document.getElementById('loginBtn').addEventListener('click',function(){
			var nickName = document.getElementById('nicknameInput').value;
			//检查昵称输入框是否为空
			if(nickName.trim().length!=0){
				that.socket.emit('login',nickName);
			}else{
				//否则输入框获得焦点
				document.getElementById('nicknameInput').focus();
			};
		},false);

		this.socket.on('nickExisted',function(){
			document.getElementById('info').textContent = 'nickName is taken,choose another pls';
		});//显示昵称倍占用的提示

		this.socket.on('loginSuccess',function(){
			document.title = 'hichat|'+ document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = "none";
			//隐藏遮罩层显示聊天
			document.getElementById('messageInput').focus();
			//让消息输入并且获得焦点
		});

		//显示在线人数及人员进出
		this.socket.on('system',function(nickName,userCount,type){
			var msg = nickName + (type == 'login'?'joined':'left');
			// var p = document.createElement('p');
			// p.textContent = msg;
			// document.getElementById('historyMsg').appendChild(p);
			//指定系统中的颜色为红色
			that._displayNewMsg('system',msg,'red');
			//将在线人数显示在页面顶部
			document.getElementById('status').textContent = userCount + (userCount>1?"users":"user") + 'online';
		});

		this.socket.on('newMsg',function(user,msg){
			that._displayNewMsg(user,msg);
		});

		document.getElementById('sendBtn').addEventListener('click',function(){
			var messageInput = document.getElementById('messageInput'),
			msg = messageInput.value;
			messageInput.value = '';
			messageInput.focus();
			if (msg.trim().length!=0) {
				that.socket.emit('postMsg',msg); //把消息显示在服务器中
				that._displayNewMsg('me',msg); //把自己的消息显示在自己的窗口中
			};
		},false);

		document.getElementById('sendImage').addEventListener('change',function(){
			//检查是否有文件被选中
			if (this.files.length!=0) {
				//获取文件并用filereader读取
				var file = this.files[0];
				reader = new FileReader();
				if(!reader){
					that._displayNewMsg('system',"!your browser doesn't support filereader","red");
					this.value = "";
					return;
				};
				reader.onload = function(e){
					//读取成功，显示到页面并且发送到服务器
					this.value = "";
					that.socket.emit('img',e.target.result);
					that._displayImage('me',e.target.result);
				};
				reader.readAsDataURL(file);	
			};
		},false);

		//接收显示图片
		this.socket.on('newImg',function(user,img){
			that._displayImage(user,img);
		});
		
		this._initialEmoji();
		//点击表情按钮显示窗口
		document.getElementById('emoji').addEventListener('click',function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			emojiwrapper.style.display = "block";
			e.stopPropagation();
		},false);
		//点击屏幕其他地方，表情关掉
		document.body.addEventListener('click'.function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			if (e.target != emojiwrapper) {
				emojiwrapper.style.display = "none";
			};
		},false);
		//将表情选中后，将相应的代码显示在框中
		document.getElementById('emojiWrapper').addEventListener('click',function(e){
			var target = e.target;
			if (target.nodeName.toLowerCase()=='img'){
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji.'+target.title+']';
			};
		},false);
	},
	_displayNewMsg:function(user,msg,color){
		var container = document.getElementById('historyMsg'),
		msgToDisplay = document.createElement('p');
		date = new Date().toTimeString().substr(0,8);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user + '<span class="timespan">('+date+'):</span>' + msg; 
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	_displayImage:function(user,imgData,color){
		var container = document.getElementById('historyMsg');
		msgToDisplay = document.createElement('p');
		date = new Date().toTimeString().substr(0,8);
		msgToDisplay.style.color = color || '#000'; 
		msgToDisplay.innerHTML = user + '<span class="timespan">('+date+'):</span><br/>'+'<a><img src="'+imgData+'"/></a>';
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight; 
	},
	_initialEmoji:function(){
		var emojiContainer = document.getElementById('emojiWrapper'),
		docFragment = document.createDocumentFragment();
		for(var i = 30 ; i>0 ; i--){
			var emojiItem = document.createElement('img');
			emojiItem.src = '../content/emoji'+i+'gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},
	_showEmogi:function(msg){
		var match,result = msg,
		reg = /\[emoji:\d+\]/g,
		emojiIndex,
		totalEmojiNum = document.getElementById('emojiwrapper').children.length;
		while(match = reg.exec(msg)){
			emojiIndex = match[0].slice(7,-1);
			if (emojiIndex>totalEmojiNum) {
				result = result.replace(match[0],'[x]');
			}else{
				result = result.replace(match[0],'img class = "emoji" src = "../content/emoji/'+emojiIndex+'gif"/>');
			};
		};
		return result;
	}
};

//

