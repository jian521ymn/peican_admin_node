// 校验接口入参是否为空
/**
 * res:透传的res，方便直接将异常抛出来
 * params:{name:'名称'}  key为校验的字段名，value为错误文案
 * templateText:'企业x必填哟！' templateText存在时，x将被替换为params的value,并输出
**/
exports.checkParams = function ({ res, params={}, templateText }) {
   return Object.keys(params).some(key=>{
        const value = params[key]
        if(!value) {
            res.send({
                code: 1,
                message: templateText ? templateText.replace('x',value) : value,
                data:{}
            })
            return true
        }
    })
}