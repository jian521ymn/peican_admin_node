const {readFile} =require('./promiseFS');

readFile('test.svg').then(res=>{
    console.log(res)
})