const express = require('express'),
	route = express.Router(),
	path = require('path'),
    mysqlConnection = require('../mysql/mysql'),
    md5 = require('md5'),
    dayjs = require("dayjs")
const {
    updateMyspl,
    queryMyspl,
    addMyspl,
} = require('../utils/operationMysql')
const {
	success,
} = require('../utils/tools');
const {checkParams} = require('../utils/checkParams')
const errorObj ={
    name: '地址名称',
    short_name: '地址简称',
    receiver_name: '收餐人',
    receiver_phone: '收餐手机号',
    detail: '地址详情'
}



//=>地址列表查询
route.get('/page', (req, res) => {
    const {page_size,page_num, rule_id} =req.query||{};
    const params = {
	    name:"EQUIPMENT_ADDRESS",
	    params:rule_id ? {isDelete:0,sid:Number(rule_id)} : {isDelete:0},
	    page: `${page_size*(page_num-1)},${page_size*page_num}`
	}
	const EquipmentSnInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:EquipmentSnInfoSql,res, isSearchList:true})
    .then(({result,total})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{
                total_count:total|| 0,
                list:result.map(item=>{
                    return {
                        ...item,
                        id:`${item.uid}`,
                        audit:JSON.parse(item.audit || '')
                    }
                })
            }
        }));
    })
});

// =>地址详情查询
route.get('/find', (req, res) => {
    const {id} =req.query||{};
    const params = {
	    name:"EQUIPMENT_ADDRESS",
	    params:{isDelete:0,uid:Number(id)},
	}
	const EquipmentSnInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:EquipmentSnInfoSql,res, isSearchList:true})
    .then(({result,total})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:result.map(item=>{
                return {
                    ...item,
                    id:item.uid,
                    audit:JSON.parse(item.audit || '')
                }
            })[0]
        }));
    })
});

//=>地址新增
route.post('/create', (req, res) => {
    const {name, detail, short_name, receiver_name, receiver_phone,} =req.body||{};
    const check ={
        res,
        templateText:'x必填呦！',
        params:errorObj
    }
    if(checkParams(check))return
	const AddAdressSql = addMyspl({
	    name:"EQUIPMENT_ADDRESS",
	    params:{
	        name,
	        detail,
	        short_name,
	        receiver_name,
	        receiver_phone,
	        audit:JSON.stringify({
	            modified_by_name:'配餐小可爱',
	            modified_time: dayjs()*1/1000
	        })
	    },
	}) // 编译转换为SQL指令
    mysqlConnection({querySql:AddAdressSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{}
        }));
    })
});
//=>地址编辑保存
route.post('/modify', (req, res) => {
    const {name, detail, short_name, receiver_name, receiver_phone,id} =req.body||{};
    const check ={
        res,
        templateText:'x必填呦！',
        params: errorObj
    }
    if(checkParams(check))return
	const AddAdressSql = updateMyspl({
	    name:"EQUIPMENT_ADDRESS",
	    primaryKey:{key:'uid',value:id},
	    params:{
	        name,
	        detail,
	        short_name,
	        receiver_name,
	        receiver_phone,
	        audit:JSON.stringify({
	            modified_by_name:'配餐小可爱',
	            modified_time: dayjs()*1/1000
	        })
	    },
	}) // 编译转换为SQL指令
    mysqlConnection({querySql:AddAdressSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{}
        }));
    })
});
//=>地址删除
route.post('/delete', (req, res) => {
    const {id} =req.body||{};
    const check ={
        res,
        templateText:'x必传呦！',
        params: {id}
    }
    if(checkParams(check))return
	const AddAdressSql = updateMyspl({
	    name:"EQUIPMENT_ADDRESS",
	    primaryKey:{key:'uid',value:id},
	    params:{
            isDelete: 1,
	        audit:JSON.stringify({
	            modified_by_name:'配餐小可爱',
	            modified_time: dayjs()*1/1000
	        })
	    },
	}) // 编译转换为SQL指令
    mysqlConnection({querySql:AddAdressSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{}
        }));
    })
});
module.exports = route;