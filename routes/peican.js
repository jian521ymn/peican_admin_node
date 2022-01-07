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
route.get('/equipment/page', (req, res) => {
    const {uuid} =req.query||{};
    const params = {
	    name:"EQUIPMENT",
	    params:{isDelete:0}
	}
	const getEquipmentInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:getEquipmentInfoSql,res,isSearchList:true})
    .then(({result,total})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{
                admin_auth: true,
                total,
                list:result
            }
        }));
    })
});
//=>新增取餐柜
route.post('/equipment/save', (req, res) => {
    const {sn,equipment_type,name="",specification_num="",can_heat='null',capacity="",heating='null'} =req.body||{};
    const params = {
	    name:"EQUIPMENT",
	    params:{sn,equipment_type,name,specification_num,can_heat,capacity,heating}
	}
	const snParams = {
	    name:"EQUIPMENT_SN",
	    params:{sn},
	}
	const addEquipmentInfoSql = addMyspl(params) // 新增的SQL指令
	const equipmentSnInfoSql = queryMyspl(snParams) // 查询sn的SQL指令
	if(equipment_type === 1) {
	    // 类型为取餐柜的话查询sn信息并写入
	    mysqlConnection({querySql:equipmentSnInfoSql,res})
	    .then(({result})=>{
	        if(!result || result.length === 0) {
	            res.send(success(false, {
                    msg: 'SN码不存在！',
                    data:{}
                }));
                return
	        }
	        const {can_heat,specification_num,capacity,heating} =result[0]
	        console.log(result,'result',heating)
	        params.params={...params.params,can_heat,specification_num,capacity,heating:heating === null ? 'null':typeof undefined === 'undefined' && can_heat === 0 ? 0 :heating}
	        return mysqlConnection({querySql:addMyspl({...params}),res})
	    })
	    .then(()=>{
            res.send(success(true, {
                msg: 'Ok',
                data:{}
            }));
        })
	}else{
	    mysqlConnection({querySql:addEquipmentInfoSql,res})
        .then(()=>{
            res.send(success(true, {
                msg: 'Ok',
                data:{}
            }));
        })
	}
});
//=>删除取餐柜
route.post('/equipment/delete', (req, res) => {
    const {sid} =req.body||{};
    const params = {
	    name:"EQUIPMENT",
	    params:{isDelete:1},
	    primaryKey:{value:sid,key:'sid'}
	}
	const deleteEquipmentInfoSql = updateMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:deleteEquipmentInfoSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{}
        }));
    })
});
//=>sn详情查询
route.get('/equipment/cabinet_detail', (req, res) => {
    const {sn} =req.query||{};
    const params = {
	    name:"EQUIPMENT_SN",
	    params:{sn},
	}
	const EquipmentSnInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:EquipmentSnInfoSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:result[0]
        }));
    })
});
//=>企业查询
route.get('/address_search', (req, res) => {
    const {address} =req.query||{};
    const params = {
	    name:"ADDRESS",
	    params:{address:`%${address}%`},
	    like:"LIKE"
	}
	const EquipmentSnInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:EquipmentSnInfoSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:result
        }));
    })
});
//=>mis号查询
route.get('/crm/mis_search', (req, res) => {
    const {keyword} =req.query||{};
    const params = {
	    name:"EQUIPMENT_MIS",
	    params:{name:`%${keyword}%`},
	    like:"LIKE"
	}
	const EquipmentSnInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:EquipmentSnInfoSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:result
        }));
    })
});
//=>企业查询
route.get('/mealrule/ent_search/page', (req, res) => {
    const {ent_name} =req.query||{};
    const params = {
	    name:"ENT",
	    params:{ent_name:`%${ent_name}%`},
	    like:"LIKE"
	}
	const EquipmentSnInfoSql = queryMyspl(params) // 编译转换为SQL指令
    mysqlConnection({querySql:EquipmentSnInfoSql,res})
    .then(({result})=>{
        res.send(success(true, {
            msg: 'Ok',
            data:{
                data:result
            }
        }));
    })
});

// 排期下载 
route.post('/mealplan/download',(req,res)=>{
     res.send(success(true, {
            message: '下载成功，稍后请关注大象邮箱',
            data:[]
        }));
})

//=>批量更新数据
route.post('/equipment/batch_modify_biz_info', (req, res) => {
    const checkParams = []
    const arySql =(req.body.equipment_biz_info_list||[]).reduce((all,next)=>{
        console.log(next,'ary')
        const {code,address_id,heating,manager_mis_id,manager_mis_desc} = next
        const params ={
    	    name:"EQUIPMENT",
    	    params:{code,address_id,heating,manager_mis_id,manager_mis_desc},
    	    primaryKey:{key:'sid', value:next.sid,isString:false}
    	}
        all.push(updateMyspl(params))
        checkParams.push(queryMyspl({name:"EQUIPMENT",params:{sid:next.sid}}))
        return all
    },[])
    mysqlConnection({querySql:arySql,res,checkParams})
    .then((result)=>{
        console.log(result,'res')
        res.send(success(true, {
            msg: 'Ok',
            data:[]
        }));
    })
});
module.exports = route;