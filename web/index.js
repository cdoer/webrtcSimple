/**
 * Created by yang on 2018-08-03.
 */

var webos=window.webos = window.webos||{};
webos.execute = function(params){
    //消息类型 这个demo总共就5种
    var MSG_TYPE = {
        nofound:"notfound",
        request:"request",//用户请求
        response:"response",//用户回复
        offer:"offer",//webrtc请求
        answer:"answer",//webrtc回复
        candidate:"candidate"//candidate消息
    };

    var ROOM_STATE = {
        wait:"等待加入...",
        connect:"连接中...",
        chat:"正在和{name}聊天中"
    };

    if(!params.name||!params.room){
        layer.prompt({title: '输入名字和房间号，格式：名字=房间号', formType: 0}, function(pass, index){
            var name = pass.split("=")[0];
            var room = pass.split("=")[1];
            if(!name||!room){
                msg("信息不完整!");
            }else{
                $.ajax({
                    url:"settings",
                    data:{
                        name:name,
                        room:room
                    },
                    success:function(data){
                        layer.close(index);
                        location.href = location.href;
                    }
                });
            }
        });
        return;
    }
    var websocket = null;
    var name = params.name;
    var room = params.room;;
    //判断当前浏览器是否支持WebSocket
    if ('WebSocket' in window) {
        websocket = new WebSocket("ws://" + document.location.host + "/websocket/" + name+"/"+room);
    } else {
        layer.msg('当前浏览器 Not support websocket')
    }

    //连接发生错误的回调方法
    websocket.onerror = function() {
        layer.msg("WebSocket连接发生错误");
    };

    //连接成功建立的回调方法
    websocket.onopen = function() {
        layer.msg("WebSocket连接成功");
    }

    //接收到消息的回调方法
    websocket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        receive[data.type](data);
    }

    //连接关闭的回调方法
    websocket.onclose = function() {
        layer.msg("WebSocket连接关闭");
    }

    //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = function() {
        closeWebSocket();
    }

    //关闭WebSocket连接
    function closeWebSocket() {
        websocket.close();
    }

    function msg(msg){
        layer.msg(msg);
    }

    function send(data){
        var data = data||{};
        data.from = name;
        websocket.send(JSON.stringify(data));
    }

    function changestate(state){
        $("#room_state").text(state);
    }

    function setVideo(id,stream){
        var video =$("#"+id);
        if (video[0]) {
            video[0].src = window.URL.createObjectURL(stream);
        }
    }

    //以下为接收到消息处理
    var receive = {
        notfound:function(){
            msg("房间不存在或试图和自己聊天！");
        },
        request:function(data){//接收到请求消息  提示是否同意
            layer.confirm(data.from+"请求加入视频聊天，是否同意？",{
                btn:["同意","拒绝"]
            },function(index){
                send({
                    type:MSG_TYPE.response,
                    accept:true,
                    to:data.from
                });
                layer.close(index);
            },function(){
                send({
                    type:MSG_TYPE.response,
                    accept:false,
                    to:data.from
                });
            });
        },
        response:function(data){
            if(data.accept){
                changestate(ROOM_STATE.connect);
                var conn = rtc.connect(function(e){
                    $("#roomname").text(room);
                    rtc.remotestream =e.stream;
                    changestate(ROOM_STATE.chat.replace("{name}",data.from))
                    setVideo("you",rtc.remotestream);
                    $("#mask").hide();
                },function(e){
                    send({
                        type:MSG_TYPE.candidate,
                        candidate:e.candidate,
                        to:data.from
                    });
                });
                conn.createOffer(function(offer){
                    conn.setLocalDescription(offer);
                    //发送offer
                    send({
                        type:MSG_TYPE.offer,
                        offer:offer,
                        to:data.from
                    })
                },function(e){
                    console.log("发送offer失败!失败原因"+e);
                });
            }else{
                layer.alert(data.from+"拒绝了你的请求!");
            }
        },
        offer:function(data){//收到offer请求 发送answer回复
            changestate(ROOM_STATE.connect)
            var conn = rtc.connect(function(e){
                rtc.remotestream = e.stream;
                changestate(ROOM_STATE.chat.replace("{name}",data.from))
                setVideo("you",rtc.remotestream);
                $("#mask").hide();
            },function(e){
                send({
                    type:MSG_TYPE.candidate,
                    candidate:e.candidate,
                    to:data.from
                });
            });
            var rtcs =new  RTCSessionDescription(data.offer);
            conn.setRemoteDescription(rtcs,function(answer){
                conn.createAnswer(function(answer){
                    conn.setLocalDescription(answer);
                    send({
                        type:MSG_TYPE.answer,
                        answer:answer,
                        to:data.from
                    })
                },function(e){
                    console.log("发送answer失败："+e);
                });
            },function(e){
                console.log("建立连接失败，失败原因："+e);
            });
        },
        answer:function(data){
            $.each(rtc.candidates,function(index,item){
                rtc.conn.addIceCandidate(item,function(){},function(ee){});
            });
            var rtcs =new RTCSessionDescription(data.answer);
            rtc.conn.setRemoteDescription(rtcs);
        },
        candidate:function(data){
            var candidate = new RTCIceCandidate(data.candidate);
            rtc.conn.addIceCandidate(candidate,function(){},function(ee){
                rtc.candidates.push(candidate);
            });
        }
    };



    function WebRtc(socket,config){
        var cfg = {
            keyField:"id",
            servers:{
                iceServers:[]
            },
            options:{video:true,audio:true}
        };
        this.remotestream = null;
        this.localstream = null;
        this.config = $.extend(cfg,config);
        this.socket = socket?socket:this.config.socket;
        this.PeerConnection = (window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCPeerConnection || undefined);
        this.RTCSessionDescription = (window.webkitRTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription || undefined);
        this.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        this.successCallback = null;
        this.errorCallback = null;
        this.conn = null;
        this.candidates = [];
    }

    WebRtc.prototype.startGetUserMedia = function(options,successCallback,errorCallback){
        var _this = this;
        this.getUserMedia.call(navigator,options,function(localstreamMedia){
            _this.localstream = localstreamMedia;
            if(typeof successCallback==="function") successCallback(localstreamMedia);
        },function(e){
            layer.alert("打开摄像头错误！", {icon: 5});
            if(typeof errorCallback==="function") errorCallback(e);
        });
    }

    WebRtc.prototype.connect = function(onaddstream,onicecandidate){
        var conn = this.conn = new this.PeerConnection();
        /*var conn = this.conn = new this.PeerConnection({
            此参数打洞用   实现广域网通信  局域网不需要
        });*/
        if(this.localstream!=null){
            conn.addStream(this.localstream);
        }
        //连接成功的回调函数 显示对方的画面
        conn.onaddstream = function(e){
            if($.isFunction(onaddstream)) onaddstream(e);
        };
        conn.onicecandidate =function(e) {
            if (e.candidate) {
                if($.isFunction(onicecandidate)) onicecandidate(e);
            }
        };
        return conn;
    }

    var rtc = new WebRtc(websocket);

    rtc.startGetUserMedia({video:true,audio:true},function(local){
        setVideo("me",local);
    },function(){
        msg("打开摄像头失败！");
    });


    /**
     * 加入房间 发送请求
     */
    $("#join").click(function(){
        room = $("#room").val();
        if(!room) return;
        send({
            type:MSG_TYPE.request,
            to:room,
            room:room
        })
    });


}


