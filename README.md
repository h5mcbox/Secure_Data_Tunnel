# Secure Data Tunnel  
A module to keep connection safe.  
## How to use  
```Server:  
var SDTunnelGen=require("./Server");
var SDTunnel=SDTunnel("ID");
example.on("message",(data)=>SDTunnel.onReceive(data));
SDTunnel.Setup(example.send,function(data){console.log(data);SDTunnel.InternalSend("Hello")},example.close,callback);
```
```Client:  
var SDTunnel=require("./Client");
example.on("message",(data)=>SDTunnel.onReceive(data));
SDTunnel.Setup(example.send,function(data){console.log(data);SDTunnel.InternalSend("Hello")},example.close,Keyid,Key);
```
