console.log('Injected interface');
window.addEventListener("message", (event) => {

    if(event.data.type === 'eval') {
        eval(event.data.code);
    }

});