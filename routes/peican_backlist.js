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

// 黑名单删除 
route.post('/delete',(req,res)=>{
     const {id} =req.body||{};
     const params ={
	    name:"HIT_LIST",
	    params:{isDelete:1},
	    primaryKey:{key:'id', value:id,isString:false}
    }
    mysqlConnection({res,querySql: updateMyspl(params)})
    .then(()=>{
        res.send({code:0,message:'Ok',data:[]})
    })
})
//=>黑名单列表
route.get('/page', (req, res) => {
    const {page_num,page_size,ent_name} =req.query||{};
    let obj={isDelete:0}
    const par={ent_name}
    Object.keys(par).forEach(item=>{
        if(par[item]){
            obj[item]=par[item]
        }
    })
    const params = {
	    name:"HIT_LIST",
	    params:obj,
	    page:`${page_size*(page_num-1)},${page_size*page_num}`
	}
	const getEquipmentInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:getEquipmentInfoSql,res,isSearchList:true})
    .then(({result,total})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{
                total_page:total,
                list:result.map(item=>{
                   const poi_item_list = item.poi_id_list ? JSON.parse(item.poi_id_list) : []
                   return ({...item, poi_item_list  })
                })
            }
        }));
    })
})
// 保存接口
route.post('/add',(req,res)=>{
     const {ent_id,poi_id_list,remark} =req.body||{};
     const params = {
	    name:"ENT",
	    params:{ent_id},
	 }
	 let ent_name =''
     mysqlConnection({querySql:queryMyspl(params),res})
     .then(({result})=>{
         if(result.length === 0){
             res.send({code:1,message:'企业不存在！',data:{}})
         }
         ent_name=result[0].ent_name;
         const sqlAry = poi_id_list.map(item=>{
             return queryMyspl({name:'POI',params:{poi_id:item}})
         })
         return  mysqlConnection({querySql:sqlAry,res})
     })
     .then(r=>{
         const poi_list = [];
         r.forEach(item=>{
             const {code,result} =item
             if(code === 0 && result.length !== 0) {
                 poi_list.push(result[0])
             }
         })
         return poi_list
     })
     .then((poi_list)=>{
         const param ={
    	    name:"HIT_LIST",
    	    params:{
    	        ent_id,
    	        ent_name,
    	        poi_id_list:JSON.stringify(poi_list),
    	        remark
    	    },
    	 }
         return  mysqlConnection({querySql:addMyspl(param),res})
     })
     .then(()=> res.send({code:0,message:'OK',data:[]}))
})
module.exports = route;