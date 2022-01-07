const express = require('express'),
	route = express.Router(),
	path = require('path'),
    svgCaptcha = require('svg-captcha'),
    mysql = require("mysql"),
    mysqlConnection = require('../mysql/mysql'),
    md5 = require('md5'),
    dayjs = require("dayjs")
const {
	handleMD5,
	success,
	getDepartInfo,
	getJobInfo,
	getUserInfo,
} = require('../utils/tools');
const {
    updateMyspl,
    queryMyspl,
    addMyspl,
} = require('../utils/operationMysql')
const {
	writeFile,
	readFile,
} = require('../utils/promiseFS');
const { createUuid } = require('../utils/createUuid')
const xlsxParsing = require('../utils/xlsxParsing'); //xlsx转换包
const {imgProxyAxios} = require('../utils/imgProxyAxios')
const { fileBufferPromise } = require('../utils/fileBufferPromise')


//=>获取设备类表
route.get('/cabinet_order/cabinet_order_cell_code_list', (req, res) => {
    const {source,sn,rule_id,rule_day,address_id} =req.query||{};
    const param ={source,sn,rule_id,rule_day,address_id}
    const isZero =Object.keys(param).every(item=>{
        console.log(param[item],'22')
        if(!param[item]){
            res.send({code:1,message:item+'参数必传！'})
        }
        return param[item]
    })
    if(!isZero){
        return
    }
	const params = {
	    name:"EQUIPMENT",
	    params:{isDelete:0}
	}
	let data = []
	const getEquipmentInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:getEquipmentInfoSql,res,isSearchList:true})
    .then(({result,total})=>{
      data = result
      const sql = result.map(item=>{
            const params = { name:"OPEN_CABINET", params:{sid:item.sid,isDelete:0}};
            return queryMyspl(params)
      })
      return mysqlConnection({querySql:sql,res})
    }).then((ress)=>{
        const cabinetOrderList =data.map((item,index)=>{
            return {...item,cell_code_list:ress[index].result}
        })
        res.send(success(true, {
            msg: 'Ok',
            data:{cabinetOrderList}
        }));
    })
});

// 批量开柜接口
route.post('/cabinet_order/batch_open_cell',(req,res)=>{
    const {order_id_list} =req.body || {};
    if(!order_id_list || order_id_list.length === 0) {
        res.send({code:1,message:'订单号必须传'})
        return
    }
     const sql = (Array.from(order_id_list)).map(item=>{
            const params = { name:"OPEN_CABINET", params:{state:3},primaryKey:{key:'order_id',value:item}};
            return updateMyspl(params)
     })
     mysqlConnection({querySql:sql,res})
     .then(ress=>{
         res.send({code:0,data:[]})
     })
})
// 轮询接口
route.get('/cabinet_order/open_state_list',(req,res)=>{
    const order_id_list =(req.query.order_id_list || '').split(',');
    
    if(!order_id_list || order_id_list.length === 0) {
        res.send({code:1,message:'订单号必须传'})
        return
    }
     const sql = (Array.from(order_id_list)).map(item=>{
            const params = { name:"OPEN_CABINET", params:{order_id:item}};
            return queryMyspl(params)
     })
     mysqlConnection({querySql:sql,res})
     .then(ress=>{
        const data = ress.map(item=>{
            const {code,result,order_id} =item || {}
            return {order_id:result[0].order_id, openState:code? -1 : (result[0].state === 3 ? 1 : 0)}
        })
         res.send({code:0,data})
     })
})

module.exports = route;