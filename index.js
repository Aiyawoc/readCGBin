/**
 * cg图档工具,
 * 实现传入一个动画编号数组，将其中每个编号对应的g，ginfo,a,ainfo文件拆分到output文件中
 * 注意动画文件有两种拆分方式
 * 实现删除指定编号的动画图档
 * 实现合并动画图档
 * 
 * 
 * 
 */

//TODO: 将方法移入fn.js, 为后续使用Electron创建app做好准备


const fs = require('fs');
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

const gInfoPath = './bin/GraphicInfo_PUK3_1.bin';
const gPath = './bin/Graphic_PUK3_1.bin';
const aInfoPath = './bin/AnimeInfo_PUK3_2.bin';
const aPath = './bin/Anime_PUK3_2.bin';
const gInfoPathV3 = './bin/GraphicInfoV3_19.bin';
const gPathV3 = './bin/GraphicV3_19.bin';

const gInfoPath2 = './bin/GraphicInfo_Joy_EX_86.bin';
const gPath2 = './bin/Graphic_Joy_EX_86.bin';
const aInfoPath2 = './bin/AnimeInfo_Joy_EX_70.bin';
const aPath2 = './bin/Anime_Joy_EX_70.bin';

const gInfoPath3 = './bin/Ginfo.bin';
const gPath3 = './bin/G.bin';
const aInfoPath3 = './bin/Ainfo.bin';
const aPath3 = './bin/A.bin';

let GInfoList = []; //存储图片信息的全局变量, 在读取Info文件时清空
let GDataList = []; //存储图片数据的全局变量, 在读取Info文件时清空
let AInfoList = []; //存储动画信息的全局变量, 在读取Info文件时清空
let ADataList = []; //存储动画数据的全局变量, 在读取Info文件时清空

/**
 * 读取graphicInfo, animeInfo文件
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
 * 读取graphicInfo文件
 * @param {String} path gInfo文件地址
 * @param {Function} callback 回调函数, 返回graphicInfoArray
 */
function getGraphicInfo(path, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            log('read err', err);
            return;
        }

        let infoArr = {};
        let len = data.length / 40;
        for (let i = 0; i < len; i++) {
            let _buffer = data.slice(i * 40, i * 40 + 40);
            let gInfo = new GraphicInfo(_buffer);
            infoArr[gInfo.imgNum] = gInfo;
            infoArr.lastNode = gInfo;
        }

        callback(infoArr);
    });
}


function getGraphicDataList(path, gList, nameSpace, passHave = true, callback) {
    let _info = gList.shift();
    if (_info) {
        if (passHave) {
            let infoFilePath = `./output/${nameSpace}/graphicInfo`;
            let infoFileName = `GraphicInfo_${nameSpace}_${_info.imgNum}.bin`;
            let dataFilePath = `./output/${nameSpace}/graphic`;
            let dataFileName = `Graphic_${nameSpace}_${_info.imgNum}.bin`;

            fs.readdir(dataFilePath, (err, dirList) => {
                if (dirList.includes(dataFileName)) {
                    // log(`[${_info.imgNum}]文件已存在, 跳过`);
                    getGraphicDataList(path, gList, nameSpace, passHave, callback);
                } else {
                    getGraphicData(path, _info, graphicData => {
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
                                getGraphicDataList(path, gList, nameSpace, passHave, callback);
                            });
                        } else {
                            log(`读取[${_info.imgNum}]失败, 继续下一条`);
                            getGraphicDataList(path, gList, nameSpace, passHave, callback);
                        }
                    });
                }
            });
        } else {
            getGraphicData(path, _info, graphicData => {
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
                        getGraphicDataList(path, gList, nameSpace, passHave, callback);
                    });
                } else {
                    log(`读取[${_info.imgNum}]失败, 继续下一条`);
                    getGraphicDataList(path, gList, nameSpace, passHave, callback);
                }
            });
        }
    } else {
        callback(GDataList);
    }
}


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


function num2Hex(num, len) {
    let numHex = num.toString(16);
    if (numHex.length % 2 == 1) {
        numHex = '0' + numHex;
    }

    let hexArr = [];
    for (i = 0; i < numHex.length / 2; i++) {
        hexArr[i] = '0x' + numHex[i * 2] + numHex[i * 2 + 1];
    }

    if (len && hexArr.length < len) {
        let diff = len - hexArr.length;
        for (let i = 0; i < diff; i++) {
            hexArr.unshift('0x00');
        }
    }

    let buffer = Buffer.from(hexArr);
    return buffer;
}


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


function addGraphicData(filePath, nameSpace, callback) {
    fs.readFile(filePath, (err, fileDataHex) => {
        let fileName = `graphic_${nameSpace}.bin`;
        let path = `./output/${nameSpace}/${fileName}`;
        fs.open(path, 'a+', (err, fd) => {
            if (err) {
                log(`open ${path} faild`, err);
                callback(false);
                return;
            }

            fs.write(fd, fileDataHex, err => {
                if (err) {
                    log(`${fileName} 写入失败`, err);
                    callback(false);
                    return;
                }

                fs.close(fd);
                // log(`${filePath} 写入完成`);
                callback(true);
            });
        });
    });
}

/**
 * 读取AnimeInfo文件
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
        let len = data.length / 12;
        // log(len);
        for (let i = 0; i < len; i++) {
            let _buffer = data.slice(i * 12, i * 12 + 12);
            infoArr.push(new AnimeInfo(_buffer));
        }

        callback(infoArr);
    });
}


/**
 * 读取动画数据文件
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
        let animeDataHex = data.slice(addr, endAddr);
        let anime = new Anime(animeDataHex);
        callback(anime);
    });
}

function saveAnimeInfo(info, nameSpace, callback) {
    let fileName = `AnimeInfo_${nameSpace}_${info.imgNum}.bin`;
    let path = `./output/${fileName}`;
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

function saveAnimeData(animeNo, data, nameSpace, callback) {
    let fileName = `Anime_${nameSpace}_${animeNo}.bin`;
    let path = `./output/${fileName}`;
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
            callback(-1);
            return;
        }
    });
}

function splitGraphicFile(pathList) {
    let nameSpace = getNameSpace(pathList.graphicInfoPath);
    mkDataDir(nameSpace, (gInfoPath, gDataPath) => {
        log(gInfoPath, gDataPath);

        getGraphicInfo(pathList.graphicInfoPath, graphicInfoArr => {
            log(`读取graphicInfo完成, 共有[${graphicInfoArr.length}]条图片数据, \n开始分割图片数据`);
            GInfoList = graphicInfoArr;

            getGraphicDataList(pathList.graphicPath, graphicInfoArr, nameSpace, true, () => {
                log('分割完成');
            });
        });
    });

}

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

function getNameSpace(path) {
    let nameSpace = path.split('.bin')[0].split('/');
    nameSpace = nameSpace[nameSpace.length - 1];
    nameSpace = nameSpace.split('_');
    nameSpace.shift();
    nameSpace = nameSpace.join('_');
    return nameSpace;
}



/**
 * 合并流程
 * 
 * 1. 合并图档, 生成图档原编号与现编号对应关系列表
 * 2. 读取并修改动画文件, 追加到目标动画文件
 * 3. 合并
 */



function getGInfoLastNum(path, callback) {
    getGraphicInfo(path, resArr => {
        let lastInfoData = resArr.lastNode;
        callback(lastInfoData.imgNum);
    });
}

/**
 * 将gInfo文件列表和g文件列表合并到目标文件中
 * @param {Object} imgNumDictionary 用于存放图片原始编号与新编号的字典
 * @param {Array} gInfoPathArr 待合并的gInfo文件地址数组
 * @param {Array} gPathArr 待合并的g文件地址数组
 * @param {Number} startNum 起始编号
 * @param {Number} startAddr 起始地址
 * @param {String} tarGPath 目标G文件地址
 * @param {String} tarGInfoPath 目标GINFO文件地址
 * @param {Function} callback 回调函数
 * @returns 
 * //BUG: 除第一条g数据外, 从第二条起拼接均不正常, 检查起始addr等
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
        let _gInfo = new GraphicInfo(fs.readFileSync(gInfoPath));
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
 * 读取目录中的文件
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

        // log({ aInfoFileArr, aFileArr, gInfoFileArr, gFileArr });
        // 获取tarGInfo文件中最后一条数据的编号,
        let pGetLastNum = new Promise((resolve, reject) => {
            getGInfoLastNum(tarGInfoPath, lastNum => {
                resolve(lastNum + 1);
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

                resolve(data);
            });
        });


        Promise.all([pGetLastNum, pGetGHex]).then(dataList => {
            let startNum = dataList[0];
            let tarGHEX = dataList[1];
            let startAddr = tarGHEX.length;

            // 批量读取gInfo文件, g文件, 修改gInfo文件的起始编号, addr
            addGraphicListToFile(imgNumDictionary, gInfoFileArr, gFileArr, startNum, startAddr, tarGPath, tarGInfoPath, ()=>{
                log('graphicInfo文件, graphic文件写入完成, 开始写入动画文件');

                // 读取目标tarAInfoPath文件, 获取下一个动画编号
                let pGetTarAInfo = new Promise((resolve, reject)=>{
                    getAnimeInfo(tarAInfoPath, aInfoArr=>{
                        let last = aInfoArr[aInfoArr.length - 1];
                        resolve(last.animeId+1);
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

                    let aInfo = new AnimeInfo(fs.readFileSync(aInfoFileArr[0]));
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

// getAnimeById({
//     animeInfoPath: aInfoPath,
//     animePath: aPath,
//     graphicInfoPath: gInfoPath,
//     graphicPath: gPath
// }, 105604, data => {
//     log('==== 读取任务完成 ====');
// });

// NOTE: 初心的g数据中, 头为16位而非20位, 因此, 如果要将初心的数据合到其它版本中, 可以尝试增加头文件中的16-20位为调色板, 或者将初心文件合并到其它目录
// 108299
addAnimeById(106798, {
    aInfoPath: aInfoPath,
    aPath: aPath,
    gInfoPath: gInfoPath,
    gPath: gPath
}, () => {
    log('==== 写入任务完成 ====');
});
