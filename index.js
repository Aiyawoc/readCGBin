/**
 * cg图档工具
 */


const fs = require('fs');
const Path = require('path');
const loger = require('./modules/log');

function log(str, type='main'){
    str = JSON.stringify(str);
    if(type == 'main'){
        loger.main.info(str);
    }else if(type == 'out'){
        loger.main.info(str);
    }
}


const { GraphicInfo, Graphic, AnimeInfo, Anime, Action, Frame } = require('./modules/base');


let GInfoList = []; //存储图片信息的全局变量, 在读取Info文件时清空
let GDataList = []; //存储图片数据的全局变量, 在读取Info文件时清空
let AInfoList = []; //存储动画信息的全局变量, 在读取Info文件时清空
let ADataList = []; //存储动画数据的全局变量, 在读取Info文件时清空


/**
 * // DONE: 读取graphicInfo, animeInfo文件
 * @param {Object} pathList  .graphicInfoPath gInfo文件地址 .animeInfoPath aInfo文件地址
 * @param {Function} callback 回调函数, 返回[graphicInfoArray, animeInfoArray]
 */
function readCGInfoFile(pathList, callback) {
    GInfoList = [];
    GDataList = [];
    AInfoList = [];
    ADataList = [];

    let p0 = new Promise((resolve, reject) => {
        getGraphicInfo(pathList.graphicInfoPath, graphicInfoArr => {
            log(`读取graphicInfo完成, 共有[${graphicInfoArr.length}]条图片数据`);
            GInfoList = graphicInfoArr;
            resolve(graphicInfoArr);
        });
    });

    let p1 = new Promise((resolve, reject) => {
        getAnimeInfo(pathList.animeInfoPath, animeInfoArr => {
            log(`读取animeInfo完成, 共有[${animeInfoArr.length}]条动画数据`);
            AInfoList = animeInfoArr;
            resolve(animeInfoArr);
        });
    });

    Promise.all([p0, p1]).then(infoDataList => {
        callback(infoDataList);
    });
}


/**
 * // DONE: 读取graphicInfo文件
 * @param {String} path gInfo文件地址
 * @param {Function} callback 回调函数, 返回graphicInfoArray
 */
function getGraphicInfo(path, callback) {
    fs.readFile(path, (err, data) => {
        let infoArr = {};
        infoArr.length = 0;

        if (err) {
            log(`读取GraphicInfo文件[${path}]失败, ${JSON.stringify(err)}`);
            callback(infoArr);
            return;
        }

        let len = data.length / 40;
        console.log(data.length, len);
        for (let i = 0; i < len; i++) {
            let _buffer = data.slice(i * 40, i * 40 + 40);
            let gInfo = new GraphicInfo(_buffer, i);
            infoArr[gInfo.imgNum] = gInfo;
            infoArr.lastNode = gInfo;
        }

        infoArr.length = len;
        callback(infoArr);
    });
}


/**
 * // DONE: 递归方式批量将grahpic, graphicInfo逐条拆分到目录文件
 * @param {String} gPath graphic文件路径
 * @param {Array} gInfoList 要拆分的graphicInfo对象数组
 * @param {String} nameSpace 路径目录名
 * @param {Boolean} passHave 是否跳过已存在, 默认跳过
 * @param {Function} callback 回调函数, 返回GDataList(全局变量)
 */
function getGraphicDataList(gPath, gInfoList, nameSpace, passHave = true, callback) {
    let _info = gInfoList.shift();
    if (_info) {
        if (passHave) {
            let infoFilePath = `./output/${nameSpace}/graphicInfo`;
            let infoFileName = `GraphicInfo_${nameSpace}_${_info.imgNum}.bin`;
            let dataFilePath = `./output/${nameSpace}/graphic`;
            let dataFileName = `Graphic_${nameSpace}_${_info.imgNum}.bin`;

            fs.readdir(dataFilePath, (err, dirList) => {
                if (dirList.includes(dataFileName)) {
                    // log(`[${_info.imgNum}]文件已存在, 跳过`);
                    getGraphicDataList(gPath, gInfoList, nameSpace, passHave, callback);
                } else {
                    getGraphicData(gPath, _info, graphicData => {
                        if (graphicData) {
                            log(`读取[${_info.imgNum}]完成, 开始写入文件`);
                            let p0 = new Promise((resolve, reject) => {
                                saveGraphicInfo(_info, nameSpace, () => {
                                    log(`写入GraphicInfo[${_info.imgNum}]完成`);
                                    resolve();
                                });
                            });

                            let p1 = new Promise((resolve, reject) => {
                                saveGraphicData(_info.imgNum, graphicData, nameSpace, () => {
                                    log(`写入Graphic[${_info.imgNum}]完成`);
                                    resolve();
                                });
                            });

                            Promise.all([p0, p1]).then(() => {
                                getGraphicDataList(gPath, gInfoList, nameSpace, passHave, callback);
                            });
                        } else {
                            log(`读取[${_info.imgNum}]失败, 继续下一条`);
                            getGraphicDataList(gPath, gInfoList, nameSpace, passHave, callback);
                        }
                    });
                }
            });
        } else {
            getGraphicData(gPath, _info, graphicData => {
                if (graphicData) {
                    log(`读取[${_info.imgNum}]完成, 开始写入文件`);
                    let p0 = new Promise((resolve, reject) => {
                        saveGraphicInfo(_info, nameSpace, () => {
                            log(`写入GraphicInfo[${_info.imgNum}]完成`);
                            resolve();
                        });
                    });

                    let p1 = new Promise((resolve, reject) => {
                        saveGraphicData(_info.imgNum, graphicData, nameSpace, () => {
                            log(`写入Graphic[${_info.imgNum}]完成`);
                            resolve();
                        });
                    });

                    Promise.all([p0, p1]).then(() => {
                        getGraphicDataList(gPath, gInfoList, nameSpace, passHave, callback);
                    });
                } else {
                    log(`读取[${_info.imgNum}]失败, 继续下一条`);
                    getGraphicDataList(gPath, gInfoList, nameSpace, passHave, callback);
                }
            });
        }
    } else {
        callback(GDataList);
    }
}


/**
 * // DONE: 获取图片数据
 * @param {String} path graphic文件路径
 * @param {GraphicInfo} info 要提取的图片信息 
 * @param {Function} callback 回调函数, 返回目标Graphic对象
 */
function getGraphicData(path, info, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            log('read err', err);
            callback(null);
            return;
        }

        let buffer = data.slice(info.addr, info.addr + info.imgSize);
        let graphic = new Graphic(buffer);
        let startBlock = graphic.startBlock;
        let version = graphic.version;;
        let imgWidth = graphic.imgWidth;
        let imgHeight = graphic.imgHeight;
        let imgSize = graphic.imgSize;
        let palette = graphic.palette;
        let bmpData = graphic.bmp;

        if (startBlock == 'RD' && imgWidth == info.imgWidth && imgHeight == info.imgHeight) {
            //  && imgSize == info.imgSize
            callback(graphic);
        } else {
            log(startBlock, version, imgWidth, imgHeight, imgSize);
            log(imgWidth == info.imgWidth, imgHeight == info.imgHeight, imgSize == info.imgSize);
            log(info.imgSize, imgSize);
            callback(null);
        }
    });
}


/**
 * // DONE: 保存图片信息
 * @param {GraphicInfo} info 图片信息数据 
 * @param {String} nameSpace 路径名称
 * @param {Function} callback 回调函数
 */
function saveGraphicInfo(info, nameSpace, callback) {
    let fileName = `GraphicInfo_${nameSpace}_${info.imgNum}.bin`;
    let path = `./output/${nameSpace}/graphicInfo/${fileName}`;
    fs.open(path, 'w+', (err, fd) => {
        if (err) {
            log(`open ${path} faild`, err);
            callback(false);
            return;
        }

        fs.write(fd, info.buffer, err => {
            if (err) {
                log(`${fileName} 写入失败`, err);
                callback(false);
                return;
            }

            fs.close(fd);
            log(`${fileName} 写入完成`);
            callback(true);
        });
    });
}


/**
 * // DONE: 拆分保存单条graphic数据
 * @param {Number} imgNum 图片编号
 * @param {Graphic} data Graphic对象
 * @param {String} nameSpace output目录中的命名空间, 一般为动画编号
 * @param {Function} callback 回调函数
 */
function saveGraphicData(imgNum, data, nameSpace, callback) {
    let fileName = `Graphic_${nameSpace}_${imgNum}.bin`;
    let path = `./output/${nameSpace}/graphic/${fileName}`;
    fs.open(path, 'w+', (err, fd) => {
        if (err) {
            log(`open ${path} faild`, err);
            callback(false);
            return;
        }

        fs.write(fd, data.buffer, err => {
            if (err) {
                log(`${fileName} 写入失败`, err);
                callback(false);
                return;
            }

            fs.close(fd);
            log(`${fileName} 写入完成`);
            callback(true);
        });
    });
}


/**
 * // DONE: 读取AnimeInfo文件
 * @param {String} path AnimeInfo文件路径
 * @param {Function} callback 回调函数, 返回AnimeInfo对象数组
 */
function getAnimeInfo(path, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            log('read err', err);
            return;
        }

        let infoArr = [];
        if(data.length){
            let len = data.length / 12;
        
            for (let i = 0; i < len; i++) {
                let _buffer = data.slice(i * 12, i * 12 + 12);
                infoArr.push(new AnimeInfo(_buffer, i));
            }
        }

        callback(infoArr);
    });
}


/**
 * // DONE: 读取动画数据文件
 * @param {String} path 动画数据文件路径
 * @param {Object} info 动画信息
 * @param {Number} endAddr 动画结束地址, 不传则为文件结尾
 * @param {Function} callback 回调函数(animeDataHex: 整体动画数据, animeArr: 拆分的动画数据数组, frameImgArr: 需要的图片数组)
 */
function getAnimeData(path, info, endAddr, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            log('read err', err);
            return;
        }

        let addr = info.addr;
        endAddr = endAddr || data.length;
        // console.log({addr,endAddr});
        let animeDataHex = data.slice(addr, endAddr);
        // console.log(animeDataHex.length);
        let anime = new Anime(animeDataHex);
        callback(anime);
    });
}


/**
 * // DONE: 在output目录中创建目标数据的目录
 * @param {Sting} nameSpace 目标数据命名空间
 * @param {Function} cb 回调函数
 */
function mkDataDir(nameSpace, cb) {
    fs.readdir('./output', (err, dirList) => {
        // log(dirList);
        if (dirList.includes(nameSpace)) {
            fs.readdir(`./output/${nameSpace}`, (err, dirList2) => {
                let pArr = [];

                if (!dirList2.includes('graphicInfo')) {
                    let p0 = new Promise((resolve, reject) => {
                        fs.mkdir(`./output/${nameSpace}/graphicInfo`, err => {
                            resolve();
                        });
                    });
                    pArr.push(p0);
                }

                if (!dirList2.includes('graphic')) {
                    let p1 = new Promise((resolve, reject) => {
                        fs.mkdir(`./output/${nameSpace}/graphic`, err => {
                            resolve();
                        });
                    });
                    pArr.push(p1);
                }

                if (!dirList2.includes('animeInfo')) {
                    let p2 = new Promise((resolve, reject) => {
                        fs.mkdir(`./output/${nameSpace}/animeInfo`, err => {
                            resolve();
                        });
                    });
                    pArr.push(p2);
                }

                if (!dirList2.includes('anime')) {
                    let p3 = new Promise((resolve, reject) => {
                        fs.mkdir(`./output/${nameSpace}/anime`, err => {
                            resolve();
                        });
                    });
                    pArr.push(p3);
                }

                Promise.all(pArr).then(() => {
                    cb();
                });

            });
        } else {
            fs.mkdir(`./output/${nameSpace}`, err => {
                fs.mkdir(`./output/${nameSpace}/graphicInfo`, err => {
                    fs.mkdir(`./output/${nameSpace}/graphic`, err => {
                        fs.mkdir(`./output/${nameSpace}/animeInfo`, err => {
                            fs.mkdir(`./output/${nameSpace}/anime`, err => {
                                cb();
                            });
                        });
                    });
                });
            });
        }
    });
}


/**
 * // DONE: 获取指定路径的命名空间, 主要用于判断文件版本, 例如 PUK3, EX等
 * @param {Number} path 目标路径
 * @returns {String}
 */
function getNameSpace(path) {
    let nameSpace = path.split('.bin')[0].split('/');
    nameSpace = nameSpace[nameSpace.length - 1];
    nameSpace = nameSpace.split('_');
    nameSpace.shift();
    nameSpace = nameSpace.join('_');
    return nameSpace;
}


/**
 * // DONE: 获取graphicInfo文件中最后一条数据的图片编号
 * @param {String} path graphicInfo文件地址
 * @param {Function} callback 回调函数, 返回imgNum
 */
function getGInfoLastNum(path, callback) {
    getGraphicInfo(path, resArr => {
        if(resArr.length){
            let lastInfoData = resArr.lastNode;
            callback(lastInfoData.imgNum);
        }else{
            // 如果目标是空文件, 返回0
            callback(0);
        }
    });
}


/**
 * // DONE: 将gInfo文件列表和g文件列表合并到目标文件中
 * @param {Object} imgNumDictionary 用于存放图片原始编号与新编号的字典
 * @param {Array} gInfoPathArr 待合并的gInfo文件地址数组
 * @param {Array} gPathArr 待合并的g文件地址数组
 * @param {Number} startNum 起始编号
 * @param {Number} startAddr 起始地址
 * @param {String} tarGPath 目标G文件地址
 * @param {String} tarGInfoPath 目标GINFO文件地址
 * @param {Function} callback 回调函数
 * @returns 
*/
function addGraphicListToFile(imgNumDictionary, gInfoPathArr, gPathArr, startNum, startAddr, tarGPath, tarGInfoPath, callback){
    if(gInfoPathArr.length !== gPathArr.length){
        callback(false);
        log('gInfo文件数量与g文件数量不同, 退出');
        return;
    }

    let gInfoPath = gInfoPathArr.shift();
    let gPath = gPathArr.shift();
    if(gInfoPath && gPath){
        let _gInfo = new GraphicInfo(fs.readFileSync(gInfoPath), 0);
        let _g = new Graphic(fs.readFileSync(gPath));

        //NOTE: 有些图片资源imgSize值与buffer.length不同, 且多为0x30, 原因不明, 将其改为数据大小
        _g.imgSize = _g.buffer.length;
        
        let oriImgNum = _gInfo.imgNum;
        _gInfo.imgNum = startNum;
        _gInfo.addr = startAddr;
        startNum ++;
        startAddr = startAddr + _g.buffer.length;
        imgNumDictionary[oriImgNum] = _gInfo.imgNum;

        let tarGFD = fs.openSync(tarGPath, 'a+');
        fs.writeFileSync(tarGFD, _g.buffer);
        fs.close(tarGFD);
        log(`写入[${gPath}]到graphic完成`);

        let tarGInfoFD = fs.openSync(tarGInfoPath, 'a+');
        fs.writeFileSync(tarGInfoFD, _gInfo.buffer);
        fs.close(tarGInfoFD);
        log(`写入[${gInfoPath}]到graphicInfo完成`);

        addGraphicListToFile(imgNumDictionary, gInfoPathArr, gPathArr, startNum, startAddr, tarGPath, tarGInfoPath, callback);
    }else{
        callback();
    }
}


/**
 * // DONE: 将anime文件列表合并到目标文件中
 * @param {Object} imgNumDictionary 存放图片原始编号与新编号的字典, 用于更新frame的图片编号
 * @param {Array} aPathArr 待写入的anime文件地址数组
 * @param {String} tarAPath 目标Anime文件地址
 * @param {Function} callback 回调函数
 */
function addAnimeListToFile(imgNumDictionary, aPathArr, tarAPath,callback){
    let aPath = aPathArr.shift();
    if(aPath){
        let _anime = new Anime(fs.readFileSync(aPath));
        let frames = _anime.actions[0].frames;
        // 修改frames中的图片编号为imgNumDictionary中的新编号
        for(let i=0;i<frames.length;i++){
            let _frame = frames[i];
            _frame.imgNum = imgNumDictionary[`${_frame.imgNum}`];
        }

        // 将待写入a文件追加到目标a文件中
        let tarAFD = fs.openSync(tarAPath, 'a+');
        fs.writeFileSync(tarAFD, _anime.buffer);
        fs.closeSync(tarAFD);
        log(`写入[${aPath}]到anime完成`);
        addAnimeListToFile(imgNumDictionary, aPathArr, tarAPath,callback);
    }else{
        callback();
    }
}


/**
 * // DONE: 读取目录中的文件
 * @param {String} path 目录路径,注意结尾需带/
 * @param {Number} start 起始编号, 默认值为null, 即获取全部
 * @param {Number} end 结束编号, 默认值为null, 即获取全部
 * @param {Function} callback 回调函数, 返回目录中的文件路径数组
 */
function getFileList(path, start = null, end = null, callback) {
    let fileList = fs.readdirSync(path);
    // log(fileList);
    if (start && end) {
        fileList = fileList.filter(fileName => {
            let fileNameArr = fileName.split('_');
            let fileIdx = Number(fileNameArr[fileNameArr.length - 1].split('.')[0]);
            return fileIdx >= start && fileIdx <= end;
        });
    }

    for (let i = 0; i < fileList.length; i++) {
        fileList[i] = path + fileList[i];
    }

    fileList.sort(function (a, b) {
        let aNameArr = a.split('_');
        let aIdx = Number(aNameArr[aNameArr.length - 1].split('.')[0]);
        let bNameArr = b.split('_');
        let bIdx = Number(bNameArr[bNameArr.length - 1].split('.')[0]);
        return aIdx - bIdx;
    });

    callback(fileList);
}


/**
 * // DONE: 拆分指定动画编号的数据
 * @param {Object} pathList 文件地址对象, {animeInfoPath, animePath, graphicInfoPath, graphicPath}
 * @param {Number} animeId 指定动画ID
 * @param {Function} callback 回调函数
 */
function getAnimeById(pathList, animeId, callback) {
    log('======= 任务开始 =======');
    readCGInfoFile(pathList, infoDataList => {
        let GInfoArr = infoDataList[0];
        let AInfoArr = infoDataList[1];

        log(`开始查找[${animeId}]的动画数据`);

        let targetAnimeInfo, targetIdx;
        
        for (let i = 0; i < AInfoArr.length; i++) {
            if (AInfoArr[i].animeId == animeId) {
                targetAnimeInfo = AInfoArr[i];
                targetIdx = i;
                break;
            }
        }

        if (targetAnimeInfo) {

            let endAddr = null;
            if (targetIdx < AInfoArr.length - 1) {
                endAddr = AInfoArr[targetIdx + 1].addr;
            }

            getAnimeData(pathList.animePath, targetAnimeInfo, endAddr, animeData => {
                log(`读取Anime文件完成, 共需要[${animeData.imgList.length}]张图片, 开始查找图片信息文件`);

                // 从GInfoArr中找到需要的图片信息
                let needImgInfoArr = [];
                for (let i = 0; i < animeData.imgList.length; i++) {
                    let _imgNum = animeData.imgList[i];
                    needImgInfoArr.push(GInfoArr[_imgNum]);
                }

                let nameSpace = animeId;

                log(`读取graphicInfo完成, 共有[${needImgInfoArr.length}]条图片数据待处理, 开始分割图片数据`);
                GInfoList = Array.from(needImgInfoArr);
                mkDataDir(nameSpace, () => {

                    getGraphicDataList(pathList.graphicPath, needImgInfoArr, nameSpace, true, () => {
                        log('图片分割完成, 开始分割动画信息文件');

                        fs.open(`./output/${nameSpace}/animeInfo/animeInfo_${nameSpace}.bin`, 'w+', (err, fd) => {
                            fs.write(fd, targetAnimeInfo.buffer, err => {
                                log('动画信息文件分割完成, 开始分割动画文件');
                                fs.close(fd);

                                let pArr = [];
                                for (let i = 0; i < animeData.actions.length; i++) {
                                    let _p = new Promise((resolve, reject) => {
                                        let _action = animeData.actions[i];
                                        let fileName = `anime_${nameSpace}_${i}.bin`;
                                        fs.open(`./output/${nameSpace}/anime/${fileName}`, 'w+', (err, fd) => {
                                            fs.write(fd, _action.buffer, err => {
                                                fs.close(fd);
                                                if (err) {
                                                    log(`./output/${nameSpace}/anime/${fileName} 写入失败`);
                                                    reject();
                                                } else {
                                                    log(`./output/${nameSpace}/anime/${fileName} 写入完成`);
                                                    resolve();
                                                }
                                            });
                                        });
                                    });

                                    pArr.push(_p);
                                }

                                Promise.all(pArr).then(() => {
                                    log('======= 任务完成 =======');
                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        } else {
            log(`未找到[${animeId}]的动画数据`);
            callback(-1);
            return;
        }
    });
}


/**
 * // DONE: 将指定id动画合并到目标文件
 * @param {Number} animeId 动画ID, 为当前工程output中存在的编号, 一般由getAnimeById创建
 * @param {Object} tarPath 目标文件地址, {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Function} callback 回调函数
 */
function addAnimeById(animeId, tarPath, callback) {
    let basePath = `./output/${animeId}`;
    let oriAInfoPath = `${basePath}/animeInfo/`;
    let oriAPath = `${basePath}/anime/`;
    let oriGInfoPath = `${basePath}/graphicInfo/`;
    let oriGPath = `${basePath}/graphic/`;
    let tarAInfoPath = tarPath.aInfoPath;
    let tarAPath = tarPath.aPath;
    let tarGInfoPath = tarPath.gInfoPath;
    let tarGPath = tarPath.gPath;

    let imgNumDictionary = {}; //图片编号字典, 用于记录图片的新编号, key:原编号, value:新编号

    let aInfoFileArr = [];
    let aFileArr = [];
    let gInfoFileArr = [];
    let gFileArr = [];

    let p0 = new Promise((resolve, reject) => {
        getFileList(oriAInfoPath, null, null, list => {
            resolve(list);
        });
    });

    let p1 = new Promise((resolve, reject) => {
        getFileList(oriAPath, null, null, list => {
            resolve(list);
        });
    });

    let p2 = new Promise((resolve, reject) => {
        getFileList(oriGInfoPath, null, null, list => {
            resolve(list);
        });
    });

    let p3 = new Promise((resolve, reject) => {
        getFileList(oriGPath, null, null, list => {
            resolve(list);
        });
    });

    Promise.all([p0, p1, p2, p3]).then(dataList => {
        aInfoFileArr = dataList[0];
        aFileArr = dataList[1];
        gInfoFileArr = dataList[2];
        gFileArr = dataList[3];

        // 获取tarGInfo文件中最后一条数据的编号
        let pGetLastNum = new Promise((resolve, reject) => {
            getGInfoLastNum(tarGInfoPath, lastNum => {
                if(lastNum){
                    resolve(lastNum + 1);
                }else{
                    resolve(0);
                }
            });
        });

        // 获取g文件的长度作为起始addr,
        let pGetGHex = new Promise((resolve, reject) => {
            fs.readFile(tarGPath, (err, data) => {
                if (err) {
                    log(`读取[${tarGPath}]失败`, err);
                    reject();
                    return;
                }

                resolve(data.length);
            });
        });

        Promise.all([pGetLastNum, pGetGHex]).then(dataList => {
            let startNum = dataList[0];
            let startAddr = dataList[1];

            // 批量读取gInfo文件, g文件, 修改gInfo文件的起始编号, addr
            addGraphicListToFile(imgNumDictionary, gInfoFileArr, gFileArr, startNum, startAddr, tarGPath, tarGInfoPath, ()=>{
                log('graphicInfo文件, graphic文件写入完成, 开始写入动画文件');

                // 读取目标tarAInfoPath文件, 获取下一个动画编号
                let pGetTarAInfo = new Promise((resolve, reject)=>{
                    getAnimeInfo(tarAInfoPath, aInfoArr=>{
                        if(aInfoArr.length){
                            let last = aInfoArr[aInfoArr.length - 1];
                            resolve(last.animeId+1);
                        }else{
                            resolve(0);
                        }
                    });
                });

                // 读取目标tarAPath文件, 获取下一个动画起始地址
                let pGetTarAPath = new Promise((resolve, reject)=>{
                    let tarAHex = fs.readFileSync(tarAPath);
                    resolve(tarAHex.length);
                });

                Promise.all([pGetTarAInfo, pGetTarAPath]).then(aDataList =>{
                    // 读取待写入aInfo文件, 修改动画编号, 修改起始地址
                    let startNum = aDataList[0];
                    let startAddr = aDataList[1];

                    let aInfo = new AnimeInfo(fs.readFileSync(aInfoFileArr[0]), 0);
                    aInfo.animeId = startNum;
                    aInfo.addr = startAddr;

                    // 将待写入aInfo文件, 追加到目标aInfo文件中
                    let tarAInfoFD = fs.openSync(tarAInfoPath, 'a+');
                    fs.writeFileSync(tarAInfoFD, aInfo.buffer);
                    fs.closeSync(tarAInfoFD);
                    log(`写入[${aInfoFileArr[0]}]到animeInfo文件完成`);

                    // 批量(递归)将待写入a文件写入目标a文件
                    addAnimeListToFile(imgNumDictionary, aFileArr, tarAPath, ()=>{
                        log(`anime文件写入完成完成`);
                        callback();
                    });
                });
                
            });
        });
    });
}


/**
 * // DONE: 检查目标文件是否存在, 如果不存在, 则创建, 并返回相应需要的值
 * @param {Object} tarPath {tarAInfoPath, tarAPath, tarGInfoPath, tarGPath}
 * @param {Function} callback 回调函数
 */
function checkTarPath(tarPath, callback){
    let {aInfoPath, aPath, gInfoPath, gPath} = tarPath;
    let dirName = Path.dirname(aInfoPath);
    let aInfoName = Path.basename(aInfoPath);
    let aName = Path.basename(aPath);
    let gInfoName = Path.basename(gInfoPath);
    let gName = Path.basename(gPath);

    fileList = fs.readdirSync(dirName);

    let emptyBuf = Buffer.alloc(0);
    let pArr = [];
    if(!fileList.includes(aInfoName)){
        log(`[${aInfoName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject)=>{
            fs.writeFileSync(aInfoPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }
    
    if(!fileList.includes(aName)){
        log(`[${aName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject)=>{
            fs.writeFileSync(aPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    if(!fileList.includes(gInfoName)){
        log(`[${gInfoName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject)=>{
            fs.writeFileSync(gInfoPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    if(!fileList.includes(gName)){
        log(`[${gName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject)=>{
            fs.writeFileSync(gPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    Promise.all(pArr).then(()=>{
        callback(tarPath);
    });
}

/**
 * // DONE: 删除目标文件中指定的动画数据
 * @param {Number} animeId 要删除的动画ID
 * @param {Object} tarPath 目标文件路径 {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Boolean} delGraphic 是否删除对应的图片数据
 * @param {Function} callback 回调函数
 */
function removeAnimeById(animeId, tarPath, delGraphic=true, callback){
    // 删除流程
    // 1. 读取ainfo, 获取目标动画在a文件中的addr
    let {aInfoPath, aPath} = tarPath;
    getAnimeInfo(aInfoPath, aInfoArr=>{
        let curIdx = 0, curAInfo;
        for(let i=0;i<aInfoArr.length;i++){
            let _aInfo = aInfoArr[i];
            if(_aInfo.animeId == animeId){
                curIdx = i;
                curAInfo = _aInfo;
                break;
            }
        }
        // BUG: 现象目前删除非最后一位动画编号时, 下一位动画数据错乱, 最后一位动画报错, 检查gInfo文件的addr

        // 目标动画在a文件中的addr
        let startAddr = curAInfo.addr;
        
        // 2. 获取目标动画的下一条动画在a文件中的addr, 作为截止addr, 如果该动画是最后一条, 则截止addr设为null, 即为文件尾
        let endAddr = null;
        if(curIdx+1 < aInfoArr.length){
            endAddr = aInfoArr[curIdx+1].addr;
        }
        console.log({startAddr, endAddr});
        
        // 3. 读取a文件, 获取目标动画数据中的图片信息
        getAnimeData(aPath, curAInfo, endAddr, tarAData=>{
            let imgList = tarAData.imgList;
            // console.log(tarAData.buffer.length==endAddr-curAInfo.addr);
            let tarADataLen = tarAData.buffer.length;
            // 4. 删除a文件中的目标动画
            let aFileHex = fs.readFileSync(aPath);
            // let secondHarfHex_afile = aFileHex.slice(endAddr, aFileHex.length);
            // console.log(secondHarfHex_afile.length, secondHarfHex_afile);
            // let secondHarfHex_afile_body = secondHarfHex_afile.slice(20, secondHarfHex_afile.length);
            // console.log(secondHarfHex_afile_body.length,secondHarfHex_afile_body);

            let writeBuffer = bufferSplice(aFileHex, startAddr, tarADataLen);
            // console.log(writeBuffer.length + tarAData.buffer.length == aFileHex.length);

            let aPathFD = fs.openSync(aPath, 'w+');
            fs.writeFileSync(aPathFD, writeBuffer);
            fs.closeSync(aPathFD);
            log(`从[${aPath}]中删除[${animeId}]动画完成`);

            
            // 5. 删除ainfo文件中的目标动画信息, 并更新之后所有的动画信息的addr
            let aInfoHex = fs.readFileSync(aInfoPath);
            // console.log({curAInfo}, curAInfo.addr,aInfoHex.length, aInfoHex.length/12);
            let secondHarfHex = aInfoHex.slice(curAInfo.selfAddr+12, aInfoHex.length);
            let len = secondHarfHex.length / 12;
            let allLen = aInfoHex.length / 12;
            // console.log({len});
            
            for(let i=0; i<len; i++){
                let _hex = secondHarfHex.slice(i*12, (i+1)*12);
                let _aInfo = new AnimeInfo(_hex, i+(allLen-len-1));
                console.log(`原始地址: ${curAInfo.addr}`);
                console.log(tarAData.buffer.length);
                console.log({i, _hex}, _aInfo.addr, tarADataLen);
                _aInfo.addr = _aInfo.addr - tarADataLen;
                console.log({_aInfo});
            }

            let writeAinfoBuffer = bufferSplice(aInfoHex, 12*curIdx, 12);
            let aInfoPathFD = fs.openSync(aInfoPath, 'w+');
            fs.writeFileSync(aInfoPathFD, writeAinfoBuffer);
            fs.closeSync(aInfoPathFD);
            log(`从[${aInfoPath}]中删除[${animeId}]动画信息完成`);

            // 6. 如果需要删除图片数据, 则调用removeGraphics, 删除图片数据
            if(delGraphic){
                removeGraphics(imgList, tarPath, res=>{
                    callback();
                });
            }else{
                callback();
            }
        });
    });
}


/**
 * // DONE: 删除目标文件中指定的图片数据
 * @param {Array} imgList 要删除的图片编号数组
 * @param {Object} tarPath 目标文件路径 {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Function} callback 回调函数
 */
function removeGraphics(imgList, tarPath, callback){
    let {gInfoPath, gPath} = tarPath;

    // 删除流程
    // 1. 读取ginfo文件, 获取图片列表在info文件中的起止addr
    // 2. 获取图片数据在g文件中的起止addr, 及总size
    let infoStartAddr = 0, infoEndAddr = 0;
    let infoDelSize = 0;
    let gStartAddr = 0, gEndAddr = 0;
    let gDelSize = 0;

    getGraphicInfo(gInfoPath, gInfoArr=>{
        let startGInfo = gInfoArr[imgList[0]];
        let endGInfo = gInfoArr[imgList[imgList.length-1]];

        infoStartAddr = startGInfo.selfAddr;
        infoEndAddr = endGInfo.selfAddr + endGInfo.buffer.length;
        infoDelSize = imgList.length*40;

        gStartAddr = startGInfo.addr;
        gEndAddr = endGInfo.addr + endGInfo.imgSize;
        gDelSize = gEndAddr - gStartAddr;
        
        // 3. 批量更新被删除图片后面的数据中的addr
        let gInfoFileHex = fs.readFileSync(gInfoPath);
        let secondHarfHex = gInfoFileHex.slice(infoEndAddr, gInfoFileHex.length);
        let len = secondHarfHex.length / 40;
        for (let i = 0; i < len; i++) {
            let _buffer = secondHarfHex.slice(i * 40, i * 40 + 40);
            let _gInfo = new GraphicInfo(_buffer, i);
            _gInfo.addr = _gInfo.addr - gDelSize;
        }

        // 4. 删除待删除的ginfo数据
        let gInfoWriteHex = bufferSplice(gInfoFileHex, infoStartAddr, infoDelSize);
        let gInfoFD = fs.openSync(gInfoPath, 'w+');
        fs.writeFileSync(gInfoFD, gInfoWriteHex);
        fs.closeSync(gInfoFD);
        log(`从[${gInfoPath}]中删除图片信息完成`);

        // 5. 删除待删除的g数据
        let gFileHex = fs.readFileSync(gPath);
        let gWriteHex = bufferSplice(gFileHex, gStartAddr, gDelSize);
        let gFD = fs.openSync(gPath, 'w+');
        fs.writeFileSync(gFD, gWriteHex);
        fs.closeSync(gFD);
        log(`从[${gPath}]中删除图片数据完成`);

        callback();
    });
}


/**
 * // DONE: buffer分割方法, 删除从start起指定长度的数据, 包含start
 * @param {Number} start 起始位置
 * @param {Number} size 删除的位数
 * @returns {Buffer} 删除后新的buffer
 */
function bufferSplice(buffer, start, size){
    start = start || 0;
    end = start + size;
    let part0 = Buffer.alloc(start);
    let part2 = Buffer.alloc(buffer.length - start - size);
    for(let i=0;i<buffer.length;i++){
        if(i<start){
            part0[i] = buffer[i];
        }
        
        if(i>=end){
            part2[i-end] = buffer[i];
        }
    }

    return Buffer.concat([part0, part2]);
}


/**
 * // TODO: 获取可用id
 * @param {Function} callback 回调函数
 */
function getUsableId(callback){

}




// 以下为测试数据

// let start = 4, size = 4;
// let tBuf = Buffer.from([0,1,2,3,4,5,6,7,8,9,10]);
// console.log(tBuf);
// tBuf = bufferSplice(tBuf, start, size);
// console.log(tBuf);



const gInfoPath = './bin/GraphicInfo_PUK3_1.bin';
const gPath = './bin/Graphic_PUK3_1.bin';
const aInfoPath = './bin/AnimeInfo_PUK3_2.bin';
const aPath = './bin/Anime_PUK3_2.bin';

const gInfoPathBL = './bin/biliML/GraphicInfo_PUK3_1.bin';
const gPathBL = './bin/biliML/Graphic_PUK3_1.bin';
const aInfoPathBL = './bin/biliML/AnimeInfo_PUK3_2.bin';
const aPathBL = './bin/biliML/Anime_PUK3_2.bin';

const gInfoPathKY = './bin/KYML/GraphicInfo_PUK3_1.bin';
const gPathKY = './bin/KYML/Graphic_PUK3_1.bin';
const aInfoPathKY = './bin/KYML/AnimeInfo_PUK3_2.bin';
const aPathKY = './bin/KYML/Anime_PUK3_2.bin';

const gInfoPathV3 = './bin/V3/GraphicInfoV3_19.bin';
const gPathV3 = './bin/V3/GraphicV3_19.bin';

const gInfoPathEX = './bin/GraphicInfo_Joy_EX_86.bin';
const gPathEX = './bin/Graphic_Joy_EX_86.bin';
const aInfoPathEX = './bin/AnimeInfo_Joy_EX_70.bin';
const aPathEX = './bin/Anime_Joy_EX_70.bin';

const tfGInfoPath = './bin/TF/bin/Puk3/GraphicInfo_PUK3_2.bin';
const tfGPath = './bin/TF/bin/Puk3/Graphic_PUK3_2.bin';
const tfAInfoPath = './bin/TF/bin/Puk3/AnimeInfo_PUK3_2.bin';
const tfAPath = './bin/TF/bin/Puk3/Anime_PUK3_2.bin';


// graphic文件解密
// const tarGPath = './output/108299/graphic/Graphic_108299_230505.bin';
// let graphic = new Graphic(fs.readFileSync(tarGPath));
// console.log({graphic}, graphic.imgWidth, graphic.imgHeight);
// let decodeGraphic = decode(graphic);
// console.log(decodeGraphic);
// let fd = fs.openSync('./tmp.bin', 'w+');
// fs.writeFileSync(fd, decodeGraphic.buffer);
// fs.closeSync(fd);



const tarGPath = './output/108303/graphic/Graphic_108303_0.bin';
let graphic = new Graphic(fs.readFileSync(tarGPath));

// let cgp = graphic.cgp;
let decodeImgData = graphic.decode();
fs.writeFileSync('./decodeImgData.bin', decodeImgData);
// console.log('cgp.bgrBuffer.length',cgp.bgrBuffer.length);
// fs.writeFileSync('./color.act', cgp.bgrBuffer);
// // console.log(cgp.bgrBuffer);
// // console.log(cgp.bgra);
// // console.log(cgp.bgraBuffer);

graphic.createBMP('./test2.bmp', [0,0,0,0], null, ()=>{
    console.log('./test2.bmp');
});



// let decodeGraphic = decode(graphic);
// console.log(decodeGraphic);
// console.log(CGPMAP.get('palet_00.cgp'));
// let tmpHex = fs.readFileSync('./tmp.bin');
// console.log(tmpHex);

// const bmpData = {
//     data: decodeGraphic,
//     width: graphic.imgWidth,
//     height: graphic.imgHeight
// };

// let rowData = BMP.encode(bmpData);
// fs.writeFileSync('./tmp.bmp', rowData.data);
// const bmpData = new BMP(graphic.imgWidth, graphic.imgHeight);
// for(let y=0;y<bmpData.height;y++){
//     for(let x=0;x<bmpData.width;x++){
//         let offset = graphic.imgWidth * y + x;
//         console.log(decodeGraphic[offset]);
        
//     }
// }

// 读取bmp
// var bmpBuffer = fs.readFileSync('./testImg.bmp');
// var bmpData = BMP.decode(bmpBuffer);
// console.log(bmpData);



// 从目标文件中删除id为120201的动画数据, 并删除图片数据
// fs.copyFileSync('D:/CrossGate/bin/Puk3/Anime_PUK3_2.bin', './bin/Anime_PUK3_2.bin');
// fs.copyFileSync('D:/CrossGate/bin/Puk3/AnimeInfo_PUK3_2.bin', './bin/AnimeInfo_PUK3_2.bin');
// fs.copyFileSync('D:/CrossGate/bin/Puk3/Graphic_PUK3_1.bin', './bin/Graphic_PUK3_1.bin');
// fs.copyFileSync('D:/CrossGate/bin/Puk3/GraphicInfo_PUK3_1.bin', './bin/GraphicInfo_PUK3_1.bin');


// fs.copyFileSync('D:/MLTools/图档/台服更新图档20230703/Anime_All_GP.bin',tfAPath);
// fs.copyFileSync('D:/MLTools/图档/台服更新图档20230703/AnimeInfo_All_GP.bin', tfAInfoPath);
// fs.copyFileSync('D:/MLTools/图档/台服更新图档20230703/Graphic_All_GP.bin', tfGPath);
// fs.copyFileSync('D:/MLTools/图档/台服更新图档20230703/GraphicInfo_All_GP.bin', tfGInfoPath);


// 方向错位2个, 剩余2个方向没有删除

// removeAnimeById(108139, {
//     aInfoPath: './bin/TF/bin/Puk3/AnimeInfo_PUK3_2.bin',
//     aPath: './bin/TF/bin/Puk3/Anime_PUK3_2.bin',
//     gInfoPath: './bin/TF/bin/Puk3/GraphicInfo_PUK3_2.bin',
//     gPath: './bin/TF/bin/Puk3/Graphic_PUK3_2.bin'
// }, true, res => {
//     log(`==== 删除[108139] 任务完成 ====`);

//     // let hex = fs.readFileSync('./bin/AnimeInfo_PUK3_2.bin');
//     // console.log(hex.length, hex);
//     getAnimeInfo('./bin/TF/bin/Puk3/AnimeInfo_PUK3_2.bin', infoArr=>{
//         console.log(infoArr.length);
//     });

//     // TODO: 读取4个文件, 分别检查,info文件是否为40/12整除
//     // removeAnimeById(120200, {aInfoPath, aPath, gInfoPath, gPath}, true, res => {
//     //     log(`==== 删除[120200]任务完成 ====`);
//     // });

// });


// // 从目标文件中拆分id为108303的数据
// getAnimeById({
//     animeInfoPath: './bin/108303_3/AnimeInfo_PUK2_4.bin',
//     animePath: './bin/108303_3/Anime_PUK2_4.bin',
//     graphicInfoPath: './bin/108303_3/GraphicInfo_PUK2_2.bin',
//     graphicPath: './bin/108303_3/Graphic_PUK2_2.bin'
// }, 108303, data => {
//     log('==== 读取任务完成 ====');
// });





// let _path = './bin/108303/GraphicInfo_PUK2_2.bin';
// getGraphicInfo(_path, (dataList)=>{
//     let res = [];
//     for( k in dataList){
//         let _v = dataList[k];
//         if(_v.mapId == 108303){
//             res.push(_v);
//         }
//     }
//     console.log(`共[${dataList.length}]条Info信息, 其中有[${res.length}]条mapId等于动画id`);
//     for(let i=0;i<res.length;i++){
//         console.log(res[i].imgNum, res[i].addr, res[i].imgSize, res[i].imgWidth, res[i].imgHeight, res[i].mapId);
//     }
//     // 找到2张mapId等于动画编号的图片
// });






// let _path = './bin/108303_2/GraphicInfo_PUK2_2.bin';
// getGraphicInfo(_path, (dataList)=>{
//     let res = [];
//     for( k in dataList){
//         let _v = dataList[k];
//         if(_v.mapId == 108303){
//             res.push(_v);
//         }
//     }
//     console.log(`共[${dataList.length}]条Info信息, 其中有[${res.length}]条mapId等于动画id`);
//     for(let i=0;i<res.length;i++){
//         console.log(res[i].imgNum, res[i].addr, res[i].imgSize, res[i].imgWidth, res[i].imgHeight, res[i].mapId);
//     }
//     // 找到2张mapId等于动画编号的图片
// });






// let _path = './bin/108303_3/GraphicInfo_108303_GP.bin';
// getGraphicInfo(_path, (dataList)=>{
//     let res = [];
//     for( k in dataList){
//         let _v = dataList[k];
//         if(_v.mapId == 108303){
//             res.push(_v);
//         }
//     }
//     console.log(`共[${dataList.length}]条Info信息, 其中有[${res.length}]条mapId等于动画id`);
//     if(res.length){
//         for(let i=0;i<res.length;i++){
//             console.log(res[i].imgNum, res[i].addr, res[i].imgSize, res[i].imgWidth, res[i].imgHeight, res[i].mapId);
//         }
//         // 找到2张mapId等于动画编号的图片
//     }else{
//         let lastNode = dataList.lastNode;
//         console.log(lastNode.imgNum, lastNode.addr, lastNode.imgSize, lastNode.imgWidth, lastNode.imgHeight, lastNode.mapId);
//     }
    
// });





// 从目标文件中拆分id为120099的数据
// getAnimeById({
//     animeInfoPath: aInfoPathKY,
//     animePath: aPathKY,
//     graphicInfoPath: gInfoPathKY,
//     graphicPath: gPathKY
// }, 120099, data => {
//     log('==== 读取任务完成 ====');
// });






// 将120099的数据写入目标文件中
// 108299
// addAnimeById(120099, {
//     aInfoPath: aInfoPath,
//     aPath: aPath,
//     gInfoPath: gInfoPath,
//     gPath: gPath
// }, () => {
//     log('==== 写入任务完成 ====');
// });








// 检查目标文件是否存在, 若不存在, 则创建空文件, 并将120099的数据写入
// checkTarPath({
//     aInfoPath: './bin/animeInfo.bin',
//     aPath: './bin/anime.bin',
//     gInfoPath: './bin/graphicInfo.bin',
//     gPath: './bin/graphic.bin'
// }, checkedPath=>{
//     addAnimeById(120099, checkedPath, () => {
//         log('==== 写入任务完成 ====');
//     });
// });







/* NOTE: 闹闹关于图档变色的解释
其实图档变色很简单，懂得图档结构后，就可以自己制作客户端图档了。
说的简单点，魔力图档就是，图片转换成8位BMP格式，宽度是4的倍数，高度不限，其内容为数据+调色板，
通常调色板中黑色（RGB 0 0 0）为底色，作为游戏中透明用，
所以魔力图档就是，一个数据+一个调色板，一个数据+一个调色板，
魔力宝贝1.0的时候，为了节约硬盘容量，想出了一个方法，多个数据用同一个调色板，这种方法称为全局，
每个数据内容都是用的同一个调色板，这种方法优点，省容量，颜色有损失，

随着时代迁移，4.0时期，需要更鲜艳的图档质量，就慢慢还原了，一个数据+一个调色板，这种称之为局部。
也许随着日后CG的更新，会用上PNG或者其他高质量图片格式，但是占用容量太大了。现在一个魔力宝贝客户端基本上7-8G，可谓很大了。

图档变色方法有2种：一种为简单的，一种为复杂的。
先说说简单的，简单就是全局转换为局部，数据内容不变，只是变调色板。
就好比露比头发是绿色的，那就拿它调色板中的绿色色块，改成黑色或者其他颜色，再将数据内容和调色板重新组合下，变成局部图档。
4.0图档的修复都是如此，官方的4.0图档数据内容都是没有调色板的，调色板都是单独一个放的，所以用查看器查看都是花屏，就一个是正常颜色的图档，
所以通过小男生工具提取组合，可以修复图档，此工具原理也是如此，将每个数据内容+单独的调色板，一一重新组合，就是我们所看到的修复图档。
如果想要将1.0图档变色，其实将一个图档动画提取，在重新打入一个单独含有调色板的图档，在进行重新分解组合。
4.0图档也是如此，将数据提取，将单独的调色板提取，改下色，重新打入，再重新分解组合下就OK了。此方法流程简单，见效快，缺点颜色有缺失。
*/

// NOTE: 头饰骑宠文件解析  http://bbs.mocwww.com/viewthread.php?tid=31111&extra=&page=1

// NOTE: 用gp的图档工具拆台服的EX图档出来, 打入puk3会花屏(调色板不正常), 猜测是需要根据动画编号反查GraphicInfoV3_*.bin文件中, 地图编号为该动画编号的图档,将该图档一并打入

// NOTE: 猜测:拆出来不自带调色板且版本号显示是压缩的, 需要打入官方调色板


// XXX: 对比修复前后的graphic文件, 第一张图片的长度减少4684长度数据, 是调色板长度的6倍, 猜测是6组调色板数据, 但未在.cgp文件中找到类似的数据?
// XXX: 对比修复前后的graphic文件, RD开头的数量, 减少了19个 X, 有非图片头的数据也是RD

// NOTE: 修复前版本, 压缩版本01 82, 采用全局调色板, 花屏, 内置496号图为隐藏调色板, 调色板长度750, 文件大小:8A7602
// NOTE: _2版本, 压缩版本01 82, 采用全局调色板, 内置496号图为隐藏调色板, 调色板长度750, 文件大小:69FB71, 猜测是根据隐藏调色板的数据对比官方调色板, 修改了原始数据
// NOTE: _3版本, 压缩版本03 00, 删除了496号隐藏调色板, 改为每张图内置调色板, 调色板长度750, 文件大小:8FDF12
// NOTE: _2版本, _3版本打入后均正常显示

// NOTE: 从图片解出来的调色板颜色不对, 尝试不解压调色板部分  


/*
// TODO: 调色板修复(全局调色板)方法:
    1. 获取调色板数据
    2. 遍历graphic解压后的图片数据, 获取每个字节在自带调色板中的色值, 在官方调色板中找到该色值的索引, 将索引值存入新的buffer中
    3. 更新图片数据, 有2种方式:
        a. 将新的buffer直接替换graphic中的图片数据, 并修改graphic中的imgSize, palSize, 修改ver为02(未压缩)
        b. 将新的buffer重新压缩后, 再替换graphic中的图片数据, 并修改graphic中的imgSize, palSize
*/

/* 
// TODO: 调色板修复(独立调色板)方法:
    1. 读取anime文件, 获取所有图片列表
    2. 遍历图片列表, 找到mapId == animeId的图片
    3. 从图片中获取ver/pad/调色板数据
    4. 将调色板数据插入graphic结尾, 并修改giaphic中的imgSize, palSize等信息
    5. 更新graphicInfo文件中图片的地址和长度
    6. 
*/


// NOTE: 修复前gInfo中图片信息数为497, _2版本gInfo中图片信息数为497, _3版本gInfo中图片信息数为496(删除了隐藏调色板的图片)
// NOTE: 修复前, 与_2版本修复中, 都有一张图片MapId==AnimieID, 为隐藏调色板文件
// NOTE: _2版本修复为把隐藏调色板去掉, 使用全局调色板, 因此图档文件变小 ??? 
// NOTE: _3版本修复为把动画的隐藏调色板加到了每张图片中, 因此图档文件变大
// NOTE: 群友[無憂無慮]提示转全局后颜色变少，压缩后就更小了, RD版本02或03的才带独立调色板，00或01没有，使用全局调色板，就是那些cgp文件; 但RD01的也可能是使用隐藏调色板，由anime里的调色板号决定，或者用动画ID查找; puk后的图档大部分都是隐藏调色板; 提取为全局或独立调色就不需要; 调色板和图片索引数据一起压缩了; 一般是768字节，有些调色板长度不足768; 
// NOTE: 群友[fantastic]: 文件头有数据长度和调色板长度, 解壓後到字節數滿足為止, 就是調色板數據; 不用管解壓到哪裡 反正解壓到字節滿足為止