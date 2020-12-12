//var randstr=require("./randstr");
//var sha256=require("./sha256");
//var rc4=require("./rc4");
if(typeof module==="undefined"){
    var Exports=window.SDTunnel={};
}else{
    var Exports={};
    module.exports=Exports;
}

var StringTools={
    decode:(e)=>(e.map(e=>String.fromCharCode(e))).join(""),
    encode:(e)=>e.split("").map(e=>e.charCodeAt(0))
}
var Send,Output,Close,Key,Keyid,status;
var ValidateSessionKey,SessionKey;
var Client_hello=(kid,rs)=>`{"type":"Client_hello","Keyid":"${kid}","Randstr":"${rs}"}`;
var Client_KeyExchange=(kid,rs)=>`{"type":"Client_KeyExchange","Keyid":"${kid}","Randstr":"${rs}"}`;
var Client_KeyCheck=()=>`{"type":"Client_KeyCheck"}`;
var Msg=(c,r)=>`{"type":"Message","Content":"${c}","Randstr":"${r}"}`;

function Setup(send,output,close,keyid,key){
    Send=send;
    Output=output;
    Close=close;
    Key=key;
    Keyid=keyid;
    HandShake_Step1();
}
function onReceive(data){
    //try{
        var ObjData=JSON.parse(data);
        if(ObjData.type==="Server_hello"){
            if(status!="HandShake_Step1"){Close("Unexcept status.");throw false;}
            if(ObjData.Keyhash!==SessionKey){Close("Untrust server or key incorrect.");throw false;}
            status="HandShake_Step1_Finished";
            HandShake_Step2();
        }
        
        if(ObjData.type==="Server_KeyExchange"){
            if(status!="HandShake_Step2"){Close("Unexcept status.");throw false;}
            //if(ObjData.Keyhash!==SessionKey){Close("Untrust server or key incorrect.");throw false;}
            status="HandShake_Step2_Finished";
            InternalSend(Client_KeyCheck());
        }
        
        if(ObjData.type==="Server_MsgResponse"){
            if(!((status=="HandShake_Step2_Finished")||(status=="Finished"))){throw "Error."}
            var data = StrTools.decode(rc4(JSON.parse(ObjData.Content),StringTools.encode(SessionKey)));
            if(status=="HandShake_Step2_Finished"){
                if(JSON.parse(data).type=="Finished."){}
                status="Finished";
                return true;
            };
            Output(data);
        }
    //}catch{return false;}
}
function HandShake_Step1(){
    var ExchangeString=randstr(20);
    var stepmsg=Client_hello(Keyid,ExchangeString);
    SessionKey=sha256(Key+ExchangeString);
    Send(stepmsg);
    status="HandShake_Step1";
}

function HandShake_Step2(){
    var ExchangeString=randstr(20);
    var step1msg=Client_KeyExchange(Keyid,ExchangeString);
    SessionKey=sha256(Key+ExchangeString);
    Send(step1msg);
    status="HandShake_Step2";
}
function InternalSend(data){
    if(!((status=="HandShake_Step2_Finished")||(status=="Finished"))){throw "Error."}
    //var data=Client_KeyCheck();
    var _randstr=randstr(20);
    var databin=StringTools.encode(data);
    var encrypted=rc4(databin,StringTools.encode(SessionKey));
    SessionKey=sha256(Key+_randstr)
    var msg=Msg(JSON.stringify(encrypted),_randstr);
    Send(msg);
}
Exports.InternalSend=InternalSend;
Exports.onReceive=onReceive;
Exports.Setup=Setup;
Exports.getStatus=()=>status;