randstr=e=>{var randstr="";if(typeof e!=="number"){return undefined};for(let i=0;i<e;i++){randstr+="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*62)]};return randstr;}
module.exports=randstr
