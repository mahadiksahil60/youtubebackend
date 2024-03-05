

// higher order functions - fns that accept and return other functions as params
// using promises

const asynchandler= (requesthandler) => {
   return (req, res, next)=>{
        Promise.resolve(requesthandler(req, res, next)).catch((err)=> next(err))
    }

}



//using try catch block

/*const asynchandler = (fn) => async(req, res, next) => {
try {
    await fn(req, res, next)
} catch (error) {
    res.status(err.code || 500).json({
        success: false,
        message: error.message
    })
}
}
*/
export { asynchandler }

