console.log('Injected interface');
window.addEventListener("message", (event) => {

   if(event.data.type === 'eval'){
      console.log('INPUT EVAL', event.data);
      eval(event.data.code);
   }

});