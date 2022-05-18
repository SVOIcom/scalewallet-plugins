console.log('Injected interface');
window.addEventListener("message", (event) => {

   if(event.type === 'eval'){
      eval(event.code);
   }
   console.log('INPUT MESSAGE', event);
});