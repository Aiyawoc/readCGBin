
const log4js = require('log4js');
const path = require('path');
const LOG_PATH = path.join('', 'logs');


log4js.configure({
    appenders: {  //输出源
        logFile: {
            type: 'dateFile', // 日志类型
            filename: path.join(LOG_PATH,'main'), // 日志输出位置
            pattern: 'yyyy-MM-dd.log', // 每天创建一个新的日志文件
            keepFileExt: true,
            encoding: "utf-8",
            alwaysIncludePattern: true, // 是否有后缀名
            // layout:{
            //     type:'pattern',
            //     pattern:'%m%n'
            // }
        },
        out:{
            type:'stdout'
        }
    },
    // ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
    categories:{
        default:{
            appenders:['out', 'logFile'],
            level:'INFO'
        },
        main:{
            appenders:['out', 'logFile'],
            level:'INFO'
        }
    }
});



let loger = log4js.getLogger('default');

module.exports = {main:loger};