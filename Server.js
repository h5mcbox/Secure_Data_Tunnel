function SDTServer(id){
    var randstr=require("./randstr");
    var sha256=require("./sha256");
    var rc4=require("./rc4");
    var fs=require("fs");
    var exports={};
    var keydb;
    if(fs.existsSync("./keydb-"+id)){
        keydb=JSON.parse(fs.readFileSync("keydb-"+id).toString());
    }else{
        keydb={};
        fs.writeFileSync("./keydb-"+id,JSON.stringify(keydb));
    }
    
    var StringTools={
        decode:(e)=>(e.map(e=>String.fromCharCode(e))).join(""),
        encode:(e)=>e.split("").map(e=>e.charCodeAt(0))
    }
    var Send,Output,Close,Finished_callback,Keyid,status="HandShake_Step1";
    var SessionKey;
    var Server_hello=(Keyhash)=>`{"type":"Server_hello","Keyhash":"${Keyhash}"}`;
    var Msg=(c,r)=>`{"type":"Server_MsgResponse","Content":"${c}","Randstr":"${r}"}`;
    
    function Setup(send,output,close,callback=function(){}){
        Send=send;
        Output=output;
        Close=close;
        Finished_callback=callback;
    }
    
    function onReceive(data){
        try{
            var ObjData=JSON.parse(data);
            if(ObjData.type==="Client_hello"){
                if(status!="HandShake_Step1"){Close("Unexcept status.");throw false;}
                var key=keydb[ObjData.Keyid];
                if(key===undefined){throw undefined;}
                var _randstr=ObjData.Randstr;
                var keyhash=sha256(key+_randstr);
                Send(Server_hello(keyhash));
                status="HandShake_Step1_Finished";
            }
            if(ObjData.type==="Client_KeyExchange"){
                if(status!="HandShake_Step1_Finished"){Close("Unexcept status.");throw false;}
                var key=keydb[ObjData.Keyid];
                if(key===undefined){throw undefined;}
                var _randstr=ObjData.Randstr;
                SessionKey=sha256(key+_randstr);
                ObjData.type="Server_KeyExchange";
                Send(JSON.stringify(ObjData));
                status="HandShake_Step2_Finished";
            }
            if(ObjData.type==="Message"){
                if(!((status=="HandShake_Step2_Finished")||(status=="Finished"))){throw "Error."}
                var _randstr=ObjData.Randstr;
                Keyid=ObjData.Keyid;
                var key=keydb[Keyid];
                SessionKey=sha256(key+_randstr);
                var data = StringTools.decode(rc4(JSON.parse(ObjData.Content),StringTools.encode(SessionKey)));
                if(status=="HandShake_Step2_Finished"){
                    if(JSON.parse(data).type=="Finished"){}
                    status="Finished";
                    ObjData.checked="True";
                    InternalSend(JSON.stringify(ObjData));
                    Finished_callback();
                    return true;
                };
                Output(data);
            }
        }catch{return false;}
    }
    function InternalSend(data){
        if(data===undefined){throw "";}
        if(!((status=="HandShake_Step2_Finished")||(status=="Finished"))){throw "Error."}
        var _randstr=randstr(20);
        var databin=StringTools.encode(data);
        var Key=keydb[Keyid];
        SessionKey=sha256(Key+_randstr)
        var encrypted=rc4(databin,StringTools.encode(SessionKey));
        var msg=Msg(JSON.stringify(encrypted),_randstr);
        Send(msg);
    }
    exports.getStatus=()=>status;
    exports.InternalSend=InternalSend;
    exports.onReceive=onReceive;
    exports.Setup=Setup;
    return exports;
}
module.exports=SDTServer;
