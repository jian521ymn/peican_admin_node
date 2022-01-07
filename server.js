const CONFIG = require('./config'),
	session = require('express-session'),
	cookieParser=require("cookie-parser"),
	bodyParser = require('body-parser')
/*-CREATE SERVER-*/
const express = require('express'),
	app = express();
app.listen(CONFIG.PORT, () => {
	console.log(`当前服务 起于${CONFIG.PORT}端口`);
});

/*-MIDDLE WARE-*/
app.all('*', (req, res, next) => {
	const {
		ALLOW_ORIGIN,
		CREDENTIALS,
		HEADERS,
		ALLOW_METHODS
	} = CONFIG.CROS;
	let ol = ALLOW_ORIGIN.split(',');
    if (ol.indexOf(req.headers.origin) >= 0) {
        res.header("Access-Control-Allow-Origin", req.headers.origin);
    	res.header("Access-Control-Allow-Credentials", CREDENTIALS);
    	res.header("Access-Control-Allow-Headers", HEADERS);
    	res.header("Access-Control-Allow-Methods", ALLOW_METHODS);
    }
	req.method === 'OPTIONS' ? res.send('CURRENT SERVICES SUPPORT CROSS DOMAIN REQUESTS!') : next();
});
app.use(cookieParser('jianymn'))
app.use(session(CONFIG.SESSION));
app.use(bodyParser.json());//数据JSON类型
app.use(bodyParser.urlencoded({
	extended: false
}));

/*-QUERY DATA-*/
const {
	readFile
} = require('./utils/promiseFS');

const {
	filterInvalid
} = require('./utils/tools');

// app.use(async (req, res, next) => {
// 	req.$customerDATA = filterInvalid(JSON.parse(await readFile('./json/customer.json')));
// 	next();
// });

/*-ROUTE-*/
app.use('/peican/api/address_service', require('./routes/peican_adderss')); // 配餐地址配置相关
app.use('/peican/api/poi_blacklist', require('./routes/peican_backlist')); // 排餐商家黑名单配置相关
app.use('/peican/api/mealrule', require('./routes/peican_mealrule')); // 配餐规则相关配置
app.use('/peican/api', require('./routes/peican'));
app.use('/tc/peican', require('./routes/peicanTc'));
app.use((req, res) => {
	res.status(404);
	res.send('NOT FOUND!');
});
