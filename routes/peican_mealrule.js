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
const {PageLimit} = require('../utils/pageLimit')
const {createUuid} = require('../utils/createUuid')
const errorObj ={
    name: '规则名称',
    range_time: '生效时间',
    day_of_weeks: '生效星期',
    dinner_scene: '用餐场景',
    address_id_list: '收餐地址'
}


//=>规则列表查询
route.get('/page', (req, res) => {
    const {page_num,page_size,ent_name,status,} =req.query||{};
    let obj={isDelete: 0}
    const par={ent_name,status}
    Object.keys(par).forEach(item=>{
        if(par[item]){
            if(['isDelete','status'].indexOf(item) !== -1) {
                obj[item]=Number(par[item])
                return
            }
            obj[item]=par[item]
        }
    })
    const params = {
	    name:"ARRANGE_RULE",
	    params:obj,
	    page:`${page_size*(page_num-1)},${page_size*page_num}`
	}
	const getEquipmentInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:getEquipmentInfoSql,res,isSearchList:true})
    .then(({result,total})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{
                total_count:total,
                page_num,
                list:result.map(item=>{
                    return {
                        ...item,
                        audit:JSON.parse(item.audit || ''),
                        dine_period:JSON.parse(item.dine_period || '')
                    }
                })
            }
        }));
    })
});

// =>规则详情查询
route.get('/find', (req, res) => {
    const {ent_name,status,sid} =req.query||{};
    const params = {
	    name:"ARRANGE_RULE",
	    params:{sid, isDelete: 0},
	}
	const getEquipmentInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:getEquipmentInfoSql,res,isSearchList:true})
    .then(({result,total})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:result.map(item=>{
                return {
                    ...item,
                    audit:JSON.parse(item.audit || ''),
                    day_of_weeks:item.day_of_weeks.split(','),
                    dine_period:JSON.parse(item.dine_period || ''),
                    range_time:JSON.parse(item.range_time || '')
                }
            })[0]
        }));
    })
});

//=>规则新增
route.post('/create', (req, res) => {
    const {name, sid, address_id_list, day_of_weeks, range_time, dinner_scene, remark, dine_period} =req.body||{};
    const uuid =createUuid()
	const ModifyAdressSql = addMyspl({
	    name:"ARRANGE_RULE",
	    params:{
	        name,
	        remark,
	        dinner_scene,
	        day_of_weeks:day_of_weeks.join(','),
	        range_time:JSON.stringify(range_time),
	        dine_period:JSON.stringify(dine_period || ''),
	        uuid,
	        audit:JSON.stringify({
	            modified_by_name:'配餐小可爱',
	            modified_time: dayjs()*1/1000
	        })
	    },
	}) // 编译转换为SQL指令
    mysqlConnection({querySql:ModifyAdressSql,res})
    .then(({result})=>{
        const queryArrangeRule = queryMyspl({
            name:'ARRANGE_RULE',
            params:{uuid },
        })
        return mysqlConnection({querySql:queryArrangeRule,res})
    })
    .then(({result})=>{
        const {sid} = result[0] || {}
        const AddAddressMap = addMyspl({
            name:'ARRANGE_ADDRESS_MAP',
            params:{
                sid,
                address_id_list:address_id_list.join(',')
            },
        })
        return mysqlConnection({querySql:AddAddressMap,res})
        
    })
    .then(r=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{}
        }));
    })
});
//=>规则编辑保存
route.post('/modify', (req, res) => {
    const {name, sid, address_id_list, day_of_weeks, range_time, dinner_scene, remark, dine_period} =req.body||{};
	const ModifyAdressSql = updateMyspl({
	    name:"ARRANGE_RULE",
	    primaryKey:{key:'sid',value:sid},
	    params:{
	        name,
	        remark,
	        dinner_scene,
	        day_of_weeks:day_of_weeks.join(','),
	        range_time:JSON.stringify(range_time),
	        audit:JSON.stringify({
	            modified_by_name:'配餐小可爱',
	            modified_time: dayjs()*1/1000
	        })
	    },
	}) // 编译转换为SQL指令
    mysqlConnection({querySql:ModifyAdressSql,res})
    .then(({result})=>{
        const UpdateAdderssMap = updateMyspl({
            name:'ARRANGE_ADDRESS_MAP',
            primaryKey:{key:'sid',value:sid},
            params:{
                address_id_list:address_id_list.join(',')
            },
        })
        return mysqlConnection({querySql:UpdateAdderssMap,res})
        
    })
    .then(r=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{}
        }));
    })
});
//=>规则删除
route.post('/remove', (req, res) => {
    const {sid} =req.body||{};
    const check ={
        res,
        templateText:'x必传呦！',
        params: {sid}
    }
    if(checkParams(check))return
	const AddAdressSql = updateMyspl({
	    name:"ARRANGE_RULE",
	    primaryKey:{key:'sid',value:sid},
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
//=>排餐规则选中地址查询
route.get('/address', (req, res) => {
    const { sid } =req.query||{};
	const queryAdderssMap = queryMyspl({
        name:'ARRANGE_ADDRESS_MAP',
        params:{sid}
    })
    mysqlConnection({querySql:queryAdderssMap,res})
    .then(({result})=>{
        res.send(success(true,{
            data:result.map(item=>{
                return {
                    ...item,
                   address_id_list: item.address_id_list.split(',')
                }
            })[0],
        }))
    })
});
module.exports = route;