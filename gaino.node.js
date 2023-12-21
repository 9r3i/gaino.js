/**
 * gaino.js
 * ~ 7th generation of my web engine (golf/gamma)
 * authored by 9r3i
 * https://github.com/9r3i/giano.js
 * started at november 21st 2023
 * continued at november 27th 2023 -v1.1.0
 *   - add some request methods
 *   - fix initializing
 * continued at november 29th 2023 -v1.2.0
 *   - fix stream method, header and body
 * continued at december 8th 2023 -v1.3.0
 *   - more portable and return as its own object
 * continued at december 21st 2023 -v1.3.1
 *   - add config update for silet update
 * requires:
 *   - virtual.js - https://github.com/9r3i/virtual.js - v1.1.0
 *     virtual.js is IMPORTANT! for gaino.js
 * usage: new gaino(virtual object, object config)
 * sample: (config object in json) -- optional
  {
    "load": [
      "router.js",
      "parser.js",
      "blog.js"
    ],
    "start": {
      "class": "blog",
      "method": "init",
      "args": [
        "alpha",
        "beta",
        "charlie"
      ]
    }
  }
 * note: load files must be registered to virtual object
 * history: 
 *   - force (foxtrot), 6th generation (2022)
 *     - https://github.com/9r3i/force
 *   - e-day (echo), 5th generation (2018)
 *     - https://github.com/9r3i/eday
 *   - dixie (delta), 4th generation (2013-2020) *
 *     - https://github.com/9r3i/dixie
 *   - charlie (charlie), 3rd generation (2013) **
 *   - black-apple (beta), 2nd generation (2012-2013) **
 *   - x1 to x9 (alpha), 1st generation (2012) **
 * (*) discontinued and archived
 * (**) discontinued and unloaded
 */
;function gaino(v,c){
/* the version */
Object.defineProperty(this,'version',{
  value:'1.3.1',
  writable:false,
});
/* the virtual */
Object.defineProperty(this,'virtual',{
  value:typeof virtual==='function'
    &&v instanceof virtual?v
    :typeof virtual==='function'
      ?new virtual:null,
  writable:false,
});
/* the config */
this.config=typeof c==='object'&&c!==null?c:{};
/* initialize as constructor */
this.init=async function(){
  let app=this.virtual,
  cnf=this.config,
  _this=this;
  /* self update for the app -- silently without waiting */
  if(app!==null){
    if(cnf.hasOwnProperty('update')
      &&cnf.update===true){
      app.update('gaino.js');
    }
    /* load registered files */
    if(cnf.hasOwnProperty('load')
      &&Array.isArray(cnf.load)){
      for(let file of cnf.load){
        if(app.files.hasOwnProperty(file)){
          await app.load(file);
        }
      }
    }
  }
  /* check for starting app */
  if(!cnf.hasOwnProperty('start')){
    return this;
  }
  /* check if document is ready */
  if(!await this.isReady()){
    alert('Error: document.body is not loaded!');
    return;
  }
  /* ready to start */
  let start=cnf.start;
  /* start as string */
  if(typeof cnf.start==='string'){
    return eval(start);
  }
  /* check for start object */
  if(typeof start!=='object'||start===null){
    return;
  }
  /* start as object -- function or class */
  if(start.hasOwnProperty('function')
    &&window.hasOwnProperty(start.function)
    &&typeof window[start.function]==='function'){
    let args=start.hasOwnProperty('args')?start.args:null;
    return window[start.function].call(this,app,args);
  }else if(start.hasOwnProperty('class')
    &&start.hasOwnProperty('method')
    &&window.hasOwnProperty(start.class)){
    let nap=new window[start.class](this,app),
    args=start.hasOwnProperty('args')
      &&Array.isArray(start.args)?start.args:[];
    if(nap.hasOwnProperty(start.method)
      &&typeof nap[start.method]==='function'){
      return nap[start.method].apply(nap,args);
    }
  }
  return this;
};
/* fetch method of stream -- with Promise */
this.fetch=function(url,cnf){
  let _this=this;
  return new Promise(resolve=>{
    return _this.stream(url,r=>{
      return resolve(r);
    },cnf);
  });
};
/* stream */
this.stream=function(url,cb,cnf){
  url=typeof url==='string'?url:this.toString(url);
  cb=typeof cb==='function'?cb:function(){};
  cnf=typeof cnf==='object'&&cnf!==null?cnf:{};
  /* config */
  let dt=cnf.hasOwnProperty('body')
        &&typeof cnf.body==='object'
        &&cnf.body!==null?cnf.body:{},
  hd=cnf.hasOwnProperty('headers')
        &&typeof cnf.headers==='object'
        &&cnf.headers!==null?cnf.headers:{},
  up=cnf.hasOwnProperty('upload')
        &&typeof cnf.upload==='function'
        ?cnf.upload:function(){},
  dl=cnf.hasOwnProperty('download')
        &&typeof cnf.download==='function'
        ?cnf.download:function(){},
  er=cnf.hasOwnProperty('error')
        &&typeof cnf.error==='function'
        ?cnf.error:cb,
  mts=[
    'GET','POST','PUT','PATCH','OPTIONS',
    'HEAD','DELETE','TRACE','CONNECT',
  ],
  mtd=cnf.hasOwnProperty('method')
        &&typeof cnf.method==='string'
        &&mts.indexOf(cnf.method)>=0
        ?cnf.method:'GET',
  head=cnf.hasOwnProperty('head')
        &&typeof cnf.head==='function'
        ?cnf.head:function(){},
  xhr=new XMLHttpRequest(),
  qmark=url.match(/\?/)?'&':'?',
  uri=mtd=='GET'?url+qmark+this.buildQuery(dt):url,
  mimeType='application/x-www-form-urlencoded',
  temp=null;
  xhr.open(mtd,uri,true);
  for(var i in hd){
    if(i.toLowerCase()=='content-type'&&i!='Content-Type'){
      hd['Content-Type']=hd[i];
      delete hd[i];
    }
  }
  if(!hd.hasOwnProperty('Content-Type')
    &&!(dt instanceof FormData)){
    hd['Content-Type']=mimeType;
  }
  for(var i in hd){xhr.setRequestHeader(i,hd[i]);}
  xhr.upload.addEventListener('progress',up,false);
  xhr.addEventListener('progress',dl,false);
  xhr.onreadystatechange=function(e){
    let hds=xhr.getAllResponseHeaders(),
    err='[error:'+xhr.status+'] '+xhr.statusText;
    if(xhr.readyState==0x04&&xhr.status==0xc8){
      return cb(xhr.responseText?xhr.responseText:'',xhr,hds);
    }else if(xhr.readyState===xhr.HEADERS_RECEIVED){
      /* HEADERS_RECEIVED === 0x02 */
      return head(hds,xhr);
    }else if(xhr.readyState<0x04){
      return false;
    }return er(err+'\n\n'+hds,xhr,hds);
  };
  if(mtd=='GET'){
    temp=null;
  }else if(hd['Content-Type']==mimeType){
    temp=this.buildQuery(dt);
  }else if(hd['Content-Type']=='application/json'){
    temp=JSON.stringify(dt);
  }else{
    temp=dt;
  }
  xhr.send(temp);
  return xhr;
};
/* buildQuery v2, build http query recusively */
this.buildQuery=function(data,key){
  var ret=[],dkey=null;
  for(var d in data){
    dkey=key?key+'['+encodeURIComponent(d)+']'
        :encodeURIComponent(d);
    if(typeof data[d]=='object'&&data[d]!==null){
      ret.push(this.buildQuery(data[d],dkey));
    }else{
      ret.push(dkey+"="+encodeURIComponent(data[d]));
    }
  }return ret.join("&");
};
/* parse json string */
this.parseJSON=function(t){
  let r=false;
  try{r=JSON.parse(t);}catch(e){r=false;}
  return r;
};
/* array of number --> to string */
this.toString=function(a){
  if(null===a){return (0x10faa9).toString(0x24);}
  if(typeof a===(0x4ea3aa4c3df5).toString(0x24)){
    return (0x4ea3aa4c3df5).toString(0x24);
  }
  if(typeof a===(0x55f57d43).toString(0x24)
    ||typeof a===(0x67e4c42c).toString(0x24)
    ||typeof a===(0x5ec2b639f).toString(0x24)
    ||typeof a===(0x1213796ebd7).toString(0x24)
    ||typeof a===(0x297e2079).toString(0x24)
    ||typeof a===(0x686136a5).toString(0x24)){
    return a.toString(0x24);
  }
  var r=String.raw({raw:[]});
  if(typeof a===(0x57a71a6d).toString(0x24)){
    for(var i in a){
      if(typeof a[i]===(0x57a71a6d).toString(0x24)){
        for(var o in a[i]){
          r+=String.fromCharCode(a[i][o]);
        }continue;
      }r+=this.toString(a[i]);
    }
  }return r;
};
/* is document.body ready -- with Promise */
this.isReady=function(){
  let _this=this;
  return new Promise(resolve=>{
    return _this.onReady(r=>{
      return resolve(r);
    });
  });
};
/* on document.body ready */
this.onReady=function(cb,i){
  i=typeof i==='number'&&i%1===0?i:0;
  let _this=this,
  b=document.querySelector('body');
  if(i>=0x3e8||b){
    return typeof cb==='function'?cb(b,i):false;
  }i++;
  return setTimeout(()=>{
    return _this.onReady(cb,i);
  },1);
};
/* start initializing */
this.init();
return this;
};

exports.gaino=gaino;
