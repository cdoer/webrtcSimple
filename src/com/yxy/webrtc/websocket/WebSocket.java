package com.yxy.webrtc.websocket;

/**
 * Created by yang on 2018-08-03.
 * email 1249492252@qq.com
 */

import com.alibaba.fastjson.JSONObject;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/websocket/{username}/{room}")
public class WebSocket {

    private static int onlineCount = 0;
    private static Map<String, WebSocket> clients = new ConcurrentHashMap<String, WebSocket>();
    private Session session;
    private String username;
    private String room;

    @OnOpen
    public void onOpen(@PathParam("username") String username,@PathParam("room") String room, Session session) throws IOException {

        this.username = username;
        this.room = room;
        this.session = session;

        addOnlineCount();
        clients.put(username, this);
        System.out.println("已连接");
    }

    @OnClose
    public void onClose() throws IOException {
        clients.remove(username);
        subOnlineCount();
    }

    @OnMessage
    public void onMessage(String message) throws IOException {
        JSONObject jsonTo = JSONObject.parseObject(message);
        String room = jsonTo.getString("room");
        if(room!=null&&!"".equals(room.trim())){
            Collection<WebSocket> sockets =  clients.values();
            WebSocket soc = null;
            for (WebSocket socket : sockets) {
                if(socket.room.equals(room)){
                    soc = socket;
                    break;
                }
            }
            if(soc==null||soc==this){
                JSONObject data = new JSONObject();
                data.put("type","notfound");
                this.sendMessageTo(data.toJSONString(),username);
            }else{
                soc.session.getAsyncRemote().sendText(message);
            }
        }else{
            sendMessageTo(message, jsonTo.get("to").toString());
        }
    }

    @OnError
    public void onError(Session session, Throwable error) {
        error.printStackTrace();
    }

    public void sendMessageTo(String message, String To) throws IOException {
        // session.getBasicRemote().sendText(message);
        //session.getAsyncRemote().sendText(message);
        for (WebSocket item : clients.values()) {
            if (item.username.equals(To) ){
                try {
                    item.session.getAsyncRemote().sendText(message);
                } catch (Exception e) {
                    System.out.println("信息发送错误"+message);
                }
            }
        }
    }

    public void sendMessageAll(String message) throws IOException {
        for (WebSocket item : clients.values()) {
            item.session.getAsyncRemote().sendText(message);
        }
    }



    public static synchronized int getOnlineCount() {
        return onlineCount;
    }

    public static synchronized void addOnlineCount() {
        WebSocket.onlineCount++;
    }

    public static synchronized void subOnlineCount() {
        WebSocket.onlineCount--;
    }

    public static synchronized Map<String, WebSocket> getClients() {
        return clients;
    }
}



