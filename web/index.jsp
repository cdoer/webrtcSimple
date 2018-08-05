
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<!DOCTYPE html>
  <head>
    <title>视频聊天室 Create by yang</title>
    <jsp:include page="src-import.jsp"></jsp:include>
    <script src="index.js"></script>
  </head>
  <body style="width: 100%; height: 100%;">
      <div style="height:60px;width:100%; background:#1E9FFF;
          color: #fff; line-height: 60px;box-sizing: border-box; padding: 0 10px; ">
        <%=session.getAttribute("name")%>，欢迎来到视频聊天室,当前房间号<span id="roomname" style="color:#393D49; vertical-align:middle; padding:0 10px;
        font-size: 30px;"><%=session.getAttribute("room")%></span>，<span id="room_state">等待加入...</span>
        <div  style="display: inline-block;">
          <div class="layui-form" action="">
            <div class="layui-form-item">
              <div class="layui-inline">
                <label class="layui-form-label">加入房间：</label>
                <div class="layui-input-block">
                  <input type="text" id="room" style="display: inline-block" placeholder="房间号" autocomplete="off" class="layui-input">
                </div>
              </div>
              <div class="layui-inline">
                <button class="layui-btn" lay-submit lay-filter="formDemo" id="join">立即加入</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="videobox" style=" width:100%;margin: 0px auto;background:#f5f5f5;position: absolute; top:60px; bottom: 0;">
          <div style="width: 50%; height:575px;float: left; position: relative;">
              <video id="you" style="width: 100%;"  autoplay>
              </video>
              <div id="mask" style="text-align: center;background:#000;opacity:0.6; color:#fff; line-height:575px;
              left: 0;top: 0; position: absolute; width:100%; height:100%; ">
                    等待加入....
              </div>
          </div>
          <div style="width: 50%;height:575px;float: left;position: relative;">
              <video id="me" style="width: 100%;" autoplay>
              </video>
          </div>
      </div>
      <script>
        $(function(){
          webos.execute({
              name:"<%=session.getAttribute("name")==null?"":(String)session.getAttribute("name")%>",
              room:"<%=session.getAttribute("room")==null?"":(String)session.getAttribute("room")%>"
          });
        })
      </script>
  </body>
</html>
