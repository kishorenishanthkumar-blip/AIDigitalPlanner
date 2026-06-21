(function(){
  var BFF="https://aiagenticplanner-auth-bff.kishorenishanthkumar.workers.dev";
  function go(conn){return function(e){e.preventDefault();e.stopImmediatePropagation();
    window.location.href=BFF+"/login"+(conn?("?connection="+conn):"");};}
  function match(el){
    if(el.__aidpBound)return;
    var t=(el.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
    if(t.length>40)return;
    var tag=el.tagName,role=el.getAttribute&&el.getAttribute("role");
    if(tag!=="BUTTON"&&tag!=="A"&&role!=="button")return;
    if(t==="google"||/continue with google/.test(t)){el.__aidpBound=1;el.addEventListener("click",go("google-oauth2"),true);}
    else if(t==="microsoft"||/continue with microsoft/.test(t)){el.__aidpBound=1;el.addEventListener("click",go("windowslive"),true);}
    else if(/sso|enterprise login/.test(t)){el.__aidpBound=1;el.addEventListener("click",go(""),true);}
  }
  function bind(){document.querySelectorAll("button,a,[role=button]").forEach(match);}
  function checkMe(){fetch(BFF+"/me",{credentials:"include"}).then(function(r){return r.json();}).then(function(s){
    if(s&&s.authenticated){window.__aidpUser=s;document.title="DI Platform — "+s.principal;
      document.querySelectorAll("*").forEach(function(el){
        if(el.children.length===0&&/not signed in/i.test(el.textContent))el.textContent="Signed in: "+s.principal;});}
  }).catch(function(){});}
  function init(){bind();checkMe();setInterval(bind,1500);}
  if(document.readyState!=="loading")init();else document.addEventListener("DOMContentLoaded",init);
})();
