/**
 * cg图档工具
 */


const fs = require('fs');
const Path = require('path');
const loger = require('./modules/log');

function log(str, type = 'main') {
    str = JSON.stringify(str);
    if (type == 'main') {
        loger.main.info(str);
    } else if (type == 'out') {
        loger.main.info(str);
    }
}


const { GraphicInfo, Graphic, AnimeInfo, Anime, Action, Frame, GFile, AFile } = require('./modules/base');
const { resourceLimits } = require('worker_threads');


let GInfoList = []; //存储图片信息的全局变量, 在读取Info文件时清空
let GDataList = []; //存储图片数据的全局变量, 在读取Info文件时清空
let AInfoList = []; //存储动画信息的全局变量, 在读取Info文件时清空
let ADataList = []; //存储动画数据的全局变量, 在读取Info文件时清空


/** DONE: 读取graphicInfo, animeInfo文件
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


/** DONE: 读取graphicInfo文件
 * @param {String} path gInfo文件地址
 * @param {Function} callback 回调函数, 返回graphicInfoArray
 * @returns {Object} {length: 长度, 0: 第一条数据, lastNode: 最后一条数据, [imgNum]: GraphicInfo对象}
 */
function getGraphicInfo(path, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            log(`读取GraphicInfo文件[${path}]失败, ${JSON.stringify(err)}`);
            callback(infoArr);
            return;
        }

        if (data.length % 40 != 0) {
            log(`读取GraphicInfo文件[${path}]失败, 数据长度异常:${data.length}`);
            callback(infoArr);
            return;
        }

        let len = data.length / 40;
        let infoArr = {};
        infoArr.length = 0;

        for (let i = 0; i < len; i++) {
            let _buffer = data.slice(i * 40, i * 40 + 40);
            let gInfo = new GraphicInfo(_buffer, i);
            if (i === 0) {
                infoArr[0] = gInfo;
            }

            infoArr[gInfo.imgNum] = gInfo;
            infoArr.lastNode = gInfo;
        }

        infoArr.length = len;
        callback(infoArr);
    });
}


/** DONE: 递归方式批量将grahpic, graphicInfo逐条拆分到目录文件
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


/** DONE: 获取图片数据
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


/** DONE: 保存图片信息
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


/** DONE: 拆分保存单条graphic数据
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


/** DONE: 读取AnimeInfo文件
 * @param {String} path AnimeInfo文件路径
 * @param {Function} callback 回调函数, 返回AnimeInfoList对象
 * @returns {Object} {length: 长度, 0: 第一条数据, lastNode: 最后一条数据, [animeId]: AnimeInfo对象}
 */
function getAnimeInfo(path, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            log('read err' + JSON.stringify(err));
            callback([]);
            return;
        }

        if (data.length) {
            if (data.length % 12 != 0) {
                log(`读取AnimeInfo文件[${path}]失败, 数据长度异常:${data.length}`);
                callback([]);
                return;
            }

            let infoArr = {};
            infoArr.length = 0;
            let len = data.length / 12;

            for (let i = 0; i < len; i++) {
                let _buffer = data.slice(i * 12, i * 12 + 12);
                let animeInfo = new AnimeInfo(_buffer, i);
                if (i === 0) {
                    infoArr[0] = animeInfo;
                }

                infoArr[animeInfo.animeId] = animeInfo;
                infoArr.lastNode = animeInfo;
            }

            infoArr.length = len;

            callback(infoArr);
        } else {
            callback([]);
        }
    });
}


/** DONE: 读取动画数据文件
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


/** DONE: 在output中创建目标数据的目录
 * @param {Sting} nameSpace 目标数据命名空间
 * @param {Function} cb 回调函数
 */
function mkDataDir(nameSpace, cb) {
    nameSpace = `${nameSpace}`;
    let dirList = fs.readdirSync('./output');
    let has = dirList.includes(nameSpace);
    if (has) {
        cb();
    } else {
        fs.mkdirSync(`./output/${nameSpace}`);
        cb();
    }
}


/** DONE: 获取指定路径的命名空间, 主要用于判断文件版本, 例如 PUK3, EX等
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


/** DONE: 获取graphicInfo文件中最后一条数据的图片编号
 * @param {String} path graphicInfo文件地址
 * @param {Function} callback 回调函数, 返回imgNum
 */
function getGInfoLastNum(path, callback) {
    getGraphicInfo(path, resArr => {
        if (resArr.length) {
            let lastInfoData = resArr.lastNode;
            callback(lastInfoData.imgNum);
        } else {
            // 如果目标是空文件, 返回0
            callback(0);
        }
    });
}


/** DONE: 将gInfo文件列表和g文件列表合并到目标文件中
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
function addGraphicListToFile(imgNumDictionary, gInfoPathArr, gPathArr, startNum, startAddr, tarGPath, tarGInfoPath, callback) {
    if (gInfoPathArr.length !== gPathArr.length) {
        callback(false);
        log('gInfo文件数量与g文件数量不同, 退出');
        return;
    }

    let gInfoPath = gInfoPathArr.shift();
    let gPath = gPathArr.shift();
    if (gInfoPath && gPath) {
        let _gInfo = new GraphicInfo(fs.readFileSync(gInfoPath), 0);
        let _g = new Graphic(fs.readFileSync(gPath));

        //NOTE: 有些图片资源imgSize值与buffer.length不同, 且多为0x30, 原因不明, 将其改为数据大小
        _g.imgSize = _g.buffer.length;

        let oriImgNum = _gInfo.imgNum;
        _gInfo.imgNum = startNum;
        _gInfo.addr = startAddr;
        startNum++;
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
    } else {
        callback();
    }
}


/** DONE: 将anime文件列表合并到目标文件中
 * @param {Object} imgNumDictionary 存放图片原始编号与新编号的字典, 用于更新frame的图片编号
 * @param {Array} aPathArr 待写入的anime文件地址数组
 * @param {String} tarAPath 目标Anime文件地址
 * @param {Function} callback 回调函数
 */
function addAnimeListToFile(imgNumDictionary, aPathArr, tarAPath, callback) {
    let aPath = aPathArr.shift();
    if (aPath) {
        let _anime = new Anime(fs.readFileSync(aPath));
        let frames = _anime.actions[0].frames;
        // 修改frames中的图片编号为imgNumDictionary中的新编号
        for (let i = 0; i < frames.length; i++) {
            let _frame = frames[i];
            _frame.imgNum = imgNumDictionary[`${_frame.imgNum}`];
        }

        // 将待写入a文件追加到目标a文件中
        let tarAFD = fs.openSync(tarAPath, 'a+');
        fs.writeFileSync(tarAFD, _anime.buffer);
        fs.closeSync(tarAFD);
        log(`写入[${aPath}]到anime完成`);
        addAnimeListToFile(imgNumDictionary, aPathArr, tarAPath, callback);
    } else {
        callback();
    }
}


/** DONE: 读取目录中的文件
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


/** DONE: 拆分指定动画编号的数据
 * @param {Object} pathList 文件地址对象, {animeInfoPath, animePath, graphicInfoPath, graphicPath}
 * @param {Number} animeId 指定动画ID
 * @param {Function} callback 回调函数
 */
function splitAnimeById(pathList, animeId, callback) {
    log('======= 分割任务开始 =======');
    readCGInfoFile(pathList, infoDataList => {
        let GInfoArr = infoDataList[0];
        let AInfoArr = infoDataList[1];

        log(`开始查找[${animeId}]的动画数据`);

        let targetAnimeInfo = AInfoArr[animeId];

        if (targetAnimeInfo) {
            // 获取下一条动画数据的addr作为endAddr, 如果没有, 则设为null(即文件尾)
            let endAddr = null;
            if (AInfoArr[animeId + 1]) {
                endAddr = AInfoArr[animeId + 1].addr;
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
                    let writeGInfoArr = [];
                    let writeGArr = [];

                    let gFileBuffer = fs.readFileSync(pathList.graphicPath);
                    let imgNumDictionary = {}; //图片编号字典, 用于记录图片的新编号, key:原编号, value:新编号
                    let offsetAddr = 0; //记录图片数据的偏移地址
                    for (let i = 0; i < needImgInfoArr.length; i++) {
                        let _gInfo = needImgInfoArr[i];

                        imgNumDictionary[_gInfo.imgNum] = i;
                        let _g = new Graphic(gFileBuffer.slice(_gInfo.addr, _gInfo.addr + _gInfo.imgSize));

                        // 更新图片信息中的图片编号
                        _gInfo.imgNum = i;
                        // 更新图片信息中的addr
                        _gInfo.addr = offsetAddr;
                        offsetAddr += _g.buffer.length;
                        writeGInfoArr.push(_gInfo.buffer);
                        writeGArr.push(_g.buffer);
                    }

                    // 更新动画数据中的图片编号
                    for (let i = 0; i < animeData.actions.length; i++) {
                        for (let j = 0; j < animeData.actions[i].frames.length; j++) {
                            let _frame = animeData.actions[i].frames[j];
                            _frame.imgNum = imgNumDictionary[_frame.imgNum];
                        }
                    }

                    fs.writeFileSync(`./output/${nameSpace}/GraphicInfo_${nameSpace}.bin`, Buffer.concat(writeGInfoArr));
                    fs.writeFileSync(`./output/${nameSpace}/Graphic_${nameSpace}.bin`, Buffer.concat(writeGArr));
                    fs.writeFileSync(`./output/${nameSpace}/AnimeInfo_${nameSpace}.bin`, targetAnimeInfo.buffer);
                    fs.writeFileSync(`./output/${nameSpace}/Anime_${nameSpace}.bin`, animeData.buffer);
                    log('======= 分割任务完成 =======');
                    callback(`./output/${nameSpace}/`);
                });
            });
        } else {
            log(`未找到[${animeId}]的动画数据`);
            callback(-1);
            return;
        }
    });
}


/** DONE: 将指定id动画合并到目标文件
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
                if (lastNum) {
                    resolve(lastNum + 1);
                } else {
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
            addGraphicListToFile(imgNumDictionary, gInfoFileArr, gFileArr, startNum, startAddr, tarGPath, tarGInfoPath, () => {
                log('graphicInfo文件, graphic文件写入完成, 开始写入动画文件');

                // 读取目标tarAInfoPath文件, 获取下一个动画编号
                let pGetTarAInfo = new Promise((resolve, reject) => {
                    getAnimeInfo(tarAInfoPath, aInfoArr => {
                        if (aInfoArr.length) {
                            let last = aInfoArr.lastNode;
                            resolve(last.animeId + 1);
                        } else {
                            resolve(0);
                        }
                    });
                });

                // 读取目标tarAPath文件, 获取下一个动画起始地址
                let pGetTarAPath = new Promise((resolve, reject) => {
                    let tarAHex = fs.readFileSync(tarAPath);
                    resolve(tarAHex.length);
                });

                Promise.all([pGetTarAInfo, pGetTarAPath]).then(aDataList => {
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
                    addAnimeListToFile(imgNumDictionary, aFileArr, tarAPath, () => {
                        log(`anime文件写入完成完成`);
                        callback();
                    });
                });

            });
        });
    });
}


/** TODO: 将图档文件合并到目标文件中
 * @param {Object} fromPath 待合并的图档文件路径 {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Object} tarPath 合并到的目标文件路径 {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Number} animeId 起始动画编号, 默认自动获取
 * @param {Boolean} repairPal 是否修复pal文件, 默认不修复
 * @param {Function} callback 回调函数
 */
function addAnimeToFile(fromPath, tarPath, animeId, repairPal = false, callback) {
    // 1. 读取目标文件中的aInfo, 获取最后一条动画的编号, 作为起始编号
    // 2. 读取目标文件中的a文件, 获取最后一条动画的结束地址(文件长度), 作为起始地址
    // 3. 读取目标文件中的gInfo, 获取最后一条图片的编号, 作为起始编号
    // 4. 读取目标文件中的g文件, 获取最后一条图片的结束地址(文件长度), 作为起始地址
    // 5. 将待合并的g文件, 追加到目标g文件中
    // 6. 读取待合并的gInfo文件, 修改图片编号, 修改起始地址
    // 7. 将待合并的gInfo文件, 追加到目标gInfo文件中
    // 8. 读取待合并的aInfo文件, 修改动画编号, 修改起始地址
    // 9. 将待合并的aInfo文件, 追加到目标aInfo文件中
    // 10. 读取待合并的a文件, 修改图片编号
    // 11. 将待合并的a文件, 追加到目标a文件中
}


/** DONE: 检查目标文件是否存在, 如果不存在, 则创建, 并返回相应需要的值
 * @param {Object} tarPath {tarAInfoPath, tarAPath, tarGInfoPath, tarGPath}
 * @param {Function} callback 回调函数
 */
function checkTarPath(tarPath, callback) {
    let { aInfoPath, aPath, gInfoPath, gPath } = tarPath;
    let dirName = Path.dirname(aInfoPath);
    let aInfoName = Path.basename(aInfoPath);
    let aName = Path.basename(aPath);
    let gInfoName = Path.basename(gInfoPath);
    let gName = Path.basename(gPath);

    fileList = fs.readdirSync(dirName);

    let emptyBuf = Buffer.alloc(0);
    let pArr = [];
    if (!fileList.includes(aInfoName)) {
        log(`[${aInfoName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject) => {
            fs.writeFileSync(aInfoPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    if (!fileList.includes(aName)) {
        log(`[${aName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject) => {
            fs.writeFileSync(aPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    if (!fileList.includes(gInfoName)) {
        log(`[${gInfoName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject) => {
            fs.writeFileSync(gInfoPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    if (!fileList.includes(gName)) {
        log(`[${gName}]文件不存在, 创建空文件`);
        let p = new Promise((resolve, reject) => {
            fs.writeFileSync(gPath, emptyBuf);
            resolve();
        });
        pArr.push(p);
    }

    Promise.all(pArr).then(() => {
        callback(tarPath);
    });
}

/** DONE: 删除目标文件中指定的动画数据
 * @param {Number} animeId 要删除的动画ID
 * @param {Object} tarPath 目标文件路径 {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Boolean} delGraphic 是否删除对应的图片数据
 * @param {Function} callback 回调函数
 */
function removeAnimeById(animeId, tarPath, delGraphic = true, callback) {
    // 删除流程
    // 1. 读取ainfo, 获取目标动画在a文件中的addr
    let { aInfoPath, aPath } = tarPath;
    getAnimeInfo(aInfoPath, aInfoArr => {
        let curIdx = 0, curAInfo = null;
        if (aInfoArr[animeId]) {
            curAInfo = aInfoArr[animeId];
            curIdx = animeId;
        } else {
            log(`[${aInfoPath}]中不存在[${animeId}]动画信息, 退出`);
            callback();
            return;
        }

        // BUG: 现象目前删除非最后一位动画编号时, 下一位动画数据错乱, 最后一位动画报错, 检查gInfo文件的addr

        // 目标动画在a文件中的addr
        let startAddr = curAInfo.addr;

        // 2. 获取目标动画的下一条动画在a文件中的addr, 作为截止addr, 如果该动画是最后一条, 则截止addr设为null, 即为文件尾
        let endAddr = null;
        if (aInfoArr[curIdx + 1]) {
            endAddr = aInfoArr[curIdx + 1].addr;
        }

        console.log({ startAddr, endAddr });

        // 3. 读取a文件, 获取目标动画数据中的图片信息
        getAnimeData(aPath, curAInfo, endAddr, tarAData => {
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
            let secondHarfHex = aInfoHex.slice(curAInfo.selfAddr + 12, aInfoHex.length);
            let len = secondHarfHex.length / 12;
            let allLen = aInfoHex.length / 12;
            // console.log({len});

            for (let i = 0; i < len; i++) {
                let _hex = secondHarfHex.slice(i * 12, (i + 1) * 12);
                let _aInfo = new AnimeInfo(_hex, i + (allLen - len - 1));
                console.log(`原始地址: ${curAInfo.addr}`);
                console.log(tarAData.buffer.length);
                console.log({ i, _hex }, _aInfo.addr, tarADataLen);
                _aInfo.addr = _aInfo.addr - tarADataLen;
                console.log({ _aInfo });
            }

            let writeAinfoBuffer = bufferSplice(aInfoHex, 12 * curIdx, 12);
            let aInfoPathFD = fs.openSync(aInfoPath, 'w+');
            fs.writeFileSync(aInfoPathFD, writeAinfoBuffer);
            fs.closeSync(aInfoPathFD);
            log(`从[${aInfoPath}]中删除[${animeId}]动画信息完成`);

            // 6. 如果需要删除图片数据, 则调用removeGraphics, 删除图片数据
            if (delGraphic) {
                removeGraphics(imgList, tarPath, res => {
                    callback();
                });
            } else {
                callback();
            }
        });
    });
}



/** DONE: 删除目标文件中指定的图片数据
 * @param {Array} imgList 要删除的图片编号数组
 * @param {Object} tarPath 目标文件路径 {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Function} callback 回调函数
 */
function removeGraphics(imgList, tarPath, callback) {
    let { gInfoPath, gPath } = tarPath;

    // 删除流程
    // 1. 读取ginfo文件, 获取图片列表在info文件中的起止addr
    // 2. 获取图片数据在g文件中的起止addr, 及总size
    let infoStartAddr = 0, infoEndAddr = 0;
    let infoDelSize = 0;
    let gStartAddr = 0, gEndAddr = 0;
    let gDelSize = 0;

    getGraphicInfo(gInfoPath, gInfoArr => {
        let startGInfo = gInfoArr[imgList[0]];
        // BUG: 目前传过来的图片列表最后一个值是166879, 但是gInfoArr中最后一条数据的imgNum是166878, 导致endGInfo为undefined; 检查gInfo文件, g文件均没有这张图片, 但是a文件中有, 且是最后一张图片
        let endGInfo = null;
        // TODO: 增加容错, 获取gInfoArr中存在的, imgList里面最大的值, 避免一些错误动画图档缺失图片的情况, 或者尝试删除imgList的每一张图片?
        for (let i = imgList[imgList.length - 1]; i >= imgList[0]; i--) {
            if (gInfoArr[i]) {
                endGInfo = gInfoArr[i];
                break;
            }
        }

        infoStartAddr = startGInfo.selfAddr;
        infoEndAddr = endGInfo.selfAddr + endGInfo.buffer.length;
        infoDelSize = imgList.length * 40;

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


/** DONE: buffer分割方法, 删除从start起指定长度的数据, 包含start
 * @param {Number} start 起始位置
 * @param {Number} size 删除的位数
 * @returns {Buffer} 删除后新的buffer
 */
function bufferSplice(buffer, start, size) {
    start = start || 0;
    end = start + size;
    let part0 = Buffer.alloc(start);
    let part2 = Buffer.alloc(buffer.length - start - size);
    for (let i = 0; i < buffer.length; i++) {
        if (i < start) {
            part0[i] = buffer[i];
        }

        if (i >= end) {
            part2[i - end] = buffer[i];
        }
    }

    return Buffer.concat([part0, part2]);
}


/** TODO: 获取可用id
 * @param {Function} callback 回调函数
 */
function getUsableId(callback) {

}


/** DONE: 修复调色板
 * @param {Object} pathList 文件路径对象, {aInfoPath, aPath, gInfoPath, gPath}
 * @param {Number} type 修复方法, 0:修复为自带调色板 1:修复为全局调色板, 默认0
 * @param {Function} callback 回调函数 
 */
function repairPalette(pathList, type = 0, callback) {
    let { aInfoPath, aPath, gInfoPath, gPath } = pathList;

    // 0. 读取animeInfo文件, 获取动画id
    let p0 = new Promise((resolve, reject) => {
        getAnimeInfo(aInfoPath, aInfoArr => {
            let animeId = aInfoArr[0].animeId;
            resolve(animeId);
        });
    });

    // 1. 读取gInfo文件, 获取图片列表, 检索是否存在mapId == animeId的图片
    let p1 = new Promise((resolve, reject) => {
        getGraphicInfo(gInfoPath, gInfoArr => {
            resolve(gInfoArr);
        });
    });

    Promise.all([p0, p1]).then(dataList => {
        let animeId = dataList[0];
        let gInfoArr = dataList[1];
        let paletteGraphicInfo = null;

        // 先判断gInfoArr.lastNode 是否为隐藏调色板文件, 如果不是, 再遍历gInfoArr, 找到mapId == animeId的图片
        if (gInfoArr.lastNode.mapId == animeId) {
            paletteGraphicInfo = gInfoArr.lastNode;
        } else {
            for (let key in gInfoArr) {
                let _gInfo = gInfoArr[key];
                if (_gInfo.mapId == animeId) {
                    paletteGraphicInfo = _gInfo;
                    break;
                }
            }
        }

        if (!paletteGraphicInfo) {
            log(`未找到[${animeId}]动画的隐藏调色板`);
            callback(false);
            return;
        }

        // 2. 读取g文件, 获取调色板数据
        let gBuffer = fs.readFileSync(gPath);
        let paletteGBuffer = gBuffer.slice(paletteGraphicInfo.addr, paletteGraphicInfo.addr + paletteGraphicInfo.imgSize);
        let paletteGraphic = new Graphic(paletteGBuffer);
        let cgp = paletteGraphic.cgp;
        let ver = paletteGraphic.version;
        let pad = paletteGraphic.pad;

        if (type == 0) {
            // 修复为自带调色板模式
            // 3. 批量更新graphic中的version, pad, 插入palSize, 插入cgp.buffer, 同时更新gInfo文件中的addr, imgSize, 最后删除gInfo文件中的调色板图片信息和g文件中的调色板图片
            let gInfoBuffer = fs.readFileSync(gInfoPath);
            let finalGInfoArr = [];
            let finalGArr = [];
            let nextAddr = 0;
            let len = Math.floor(gInfoBuffer.length / 40);
            for (let i = 0; i < len; i++) {
                let _gInfoBuffer = gInfoBuffer.slice(i * 40, i * 40 + 40);
                let _gInfo = new GraphicInfo(_gInfoBuffer, i);
                let startAddr = _gInfo.addr;
                let endAddr = _gInfo.addr + _gInfo.imgSize;
                let _gBuffer = gBuffer.slice(startAddr, endAddr);
                let _graphic = new Graphic(Buffer.from(_gBuffer));
                if (_gInfo.mapId !== animeId) {
                    // NOTE: 这里用slice截取的buffer, 在第一次修改后, 因为修改了数据长度, 所以后面截取的数据地址会发生偏移, 导致数据错误, 因此需要用from方法创建一个新的buffer
                    _graphic.version = ver;
                    _graphic.pad = pad;
                    _graphic.cgp = cgp;
                    finalGArr.push(_graphic.buffer);
                    _gInfo.addr = nextAddr;
                    _gInfo.imgSize = _graphic.buffer.length;
                    nextAddr += _graphic.buffer.length;
                    finalGInfoArr.push(_gInfo.buffer);
                } else {
                    // NOTE: 隐藏调色板图片信息, 读修复过的文件发现, 动画关键帧中仍有该帧, 仅将该图mapId改为0, addr改为修改后的addr
                    finalGArr.push(_graphic.buffer);
                    _gInfo.addr = nextAddr;
                    _gInfo.imgSize = _graphic.buffer.length;
                    nextAddr += _graphic.buffer.length;
                    _gInfo.mapId = 0;
                    finalGInfoArr.push(_gInfo.buffer);
                }
            }

            let dirName = Path.dirname(gInfoPath);
            // 判断selfPal文件夹是否存在, 不存在则创建
            let newPath = Path.join(dirName, 'selfPal');
            if (!fs.existsSync(newPath)) {
                fs.mkdirSync(newPath);
            }

            let gInfoFileName = Path.join(newPath, Path.basename(gInfoPath));
            let gFileName = Path.join(newPath, Path.basename(gPath));
            let aInfoFileName = Path.join(newPath, Path.basename(aInfoPath));
            let aFileName = Path.join(newPath, Path.basename(aPath));

            // 写入gInfo文件
            let finalGInfoBuffer = Buffer.concat(finalGInfoArr);
            fs.writeFileSync(gInfoFileName, finalGInfoBuffer);

            // 写入g文件
            let finalGBuffer = Buffer.concat(finalGArr);
            fs.writeFileSync(gFileName, finalGBuffer);

            // 复制animeInfo文件
            fs.copyFileSync(aInfoPath, aInfoFileName);
            // 复制anime文件
            fs.copyFileSync(aPath, aFileName);

            callback(true);
        } else {
            // TODO: 修复为全局调色板模式
            /*
                1. 获取调色板数据
                2. 遍历graphic解压后的图片数据, 获取每个字节在自带调色板中的色值, 在官方调色板中找到该色值的索引, 将索引值存入新的buffer中
                3. 更新图片数据, 有2种方式:
                    a. 将新的buffer直接替换graphic中的图片数据, 并修改graphic中的imgSize, palSize, 修改ver为02(未压缩)
                    b. 将新的buffer重新压缩后, 再替换graphic中的图片数据, 并修改graphic中的imgSize, palSize
            */

            throw new Error('暂不支持全局调色板模式');
        }
    });
}


module.exports = {
    readCGInfoFile,
    getGraphicInfo,
    getGraphicDataList,
    getGraphicData,
    saveGraphicInfo,
    saveGraphicData,
    getAnimeInfo,
    getAnimeData,
    mkDataDir,
    getNameSpace,
    getGInfoLastNum,
    addGraphicListToFile,
    addAnimeListToFile,
    getFileList,
    splitAnimeById,
    addAnimeById,
    addAnimeToFile,
    checkTarPath,
    removeAnimeById,
    removeGraphics,
    bufferSplice,
    getUsableId,
    repairPalette
};


// EXP: 以下为测试数据


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

const gInfoPathEX = './bin/EX/GraphicInfo_Joy_EX_86.bin';
const gPathEX = './bin/EX/Graphic_Joy_EX_86.bin';
const aInfoPathEX = './bin/EX/AnimeInfo_Joy_EX_70.bin';
const aPathEX = './bin/EX/Anime_Joy_EX_70.bin';

const tfGInfoPath = './bin/TF/bin/Puk3/GraphicInfo_PUK3_2.bin';
const tfGPath = './bin/TF/bin/Puk3/Graphic_PUK3_2.bin';
const tfAInfoPath = './bin/TF/bin/Puk3/AnimeInfo_PUK3_2.bin';
const tfAPath = './bin/TF/bin/Puk3/Anime_PUK3_2.bin';

const RootPath = 'D:/MLTools/图档';


// EXP: 批量导出bmp 
// getGraphicInfo(gInfoPath, gInfoArr => {
//     // console.log(gInfoArr);
//     let gBuffer = fs.readFileSync(gPath);

//     let pArr = [];
//     let tArr = [];
//     for (let i = 392; i < 591; i++) {
//         tArr.push(i);
//     }

//     for (let i = 0; i < tArr.length; i++) {
//         let _gInfo = gInfoArr[tArr[i]];
//         if (_gInfo) {
//             // console.log(_gInfo.imgNum, _gInfo.addr, _gInfo.addr + _gInfo.imgSize);
//             let _p = new Promise((resolve, reject) => {
//                 let g = new Graphic(gBuffer.slice(_gInfo.addr, _gInfo.addr + _gInfo.imgSize));
//                 g.createBMP(`./output/tmp/${tArr[i]}.bmp`, {
//                     alphaColor: [155, 43, 0, 0],
//                     changeColor: [255, 255, 255, 0],
//                     autoAlpha: true,
//                     cgp: null
//                 }, () => {
//                     log(`./output/tmp/${tArr[i]}.bmp`);
//                     resolve();
//                 });

//             });

//             pArr.push(_p);
//         }
//     }


//     Promise.all(pArr).then(() => {
//         console.log('批量导出完成');
//     });
// });




// EXP: 批量修复调色板(自带调色板模式)
// let pathList = [104905, 108163, 108205, 108249, 108250, 108251, 108253, 108299, 108302, 108303];
// batchRepairPalette(()=>{
//     log('==== 批量修复调色板完成 ====');
// });

// function batchRepairPalette(callback) {
//     let pathNum = pathList.shift();
//     if(pathNum){
//         let basePath = `${RootPath}/${pathNum}`;
//         let aInfoPath = `${basePath}/AnimeInfo_${pathNum}_GP.bin`;
//         let aPath = `${basePath}/Anime_${pathNum}_GP.bin`;
//         let gInfoPath = `${basePath}/GraphicInfo_${pathNum}_GP.bin`;
//         let gPath = `${basePath}/Graphic_${pathNum}_GP.bin`;

//         repairPalette({
//             aInfoPath,
//             aPath,
//             gInfoPath,
//             gPath
//         }, 0, res => {
//             if(res){
//                 log(`[${pathNum}]修复完成`);
//             }else{
//                 log(`[${pathNum}]修复失败`);
//             }
//             batchRepairPalette(callback);
//         });
//     }else{
//         callback();
//         return;
//     }
// }



// EXP: graphic文件解密
// const tarGPath = './output/108299/graphic/Graphic_108299_230505.bin';
// let graphic = new Graphic(fs.readFileSync(tarGPath));
// console.log({graphic}, graphic.imgWidth, graphic.imgHeight);
// let decodeGraphic = decode(graphic);
// console.log(decodeGraphic);
// let fd = fs.openSync('./tmp.bin', 'w+');
// fs.writeFileSync(fd, decodeGraphic.buffer);
// fs.closeSync(fd);



// EXP: graphic文件生成bmp
// const tarGPath = './output/108303/graphic/Graphic_108303_0.bin';
// let graphic = new Graphic(fs.readFileSync(tarGPath));
// graphic.createBMP('./test2.bmp', [0,0,0,0], null, ()=>{
//     log('./test2.bmp');
// });



// EXP: 从目标文件中删除id为160094的动画数据, 并删除图片数据
// TODO: 制作一个3个动画数据的文档作为测试文件
// fs.copyFileSync('D:/CrossGate/bin/Puk3/Anime_PUK3_2.bin', './bin/Anime_PUK3_2.bin');
// fs.copyFileSync('D:/CrossGate/bin/Puk3/AnimeInfo_PUK3_2.bin', './bin/AnimeInfo_PUK3_2.bin');
// fs.copyFileSync('D:/CrossGate/bin/Puk3/Graphic_PUK3_1.bin', './bin/Graphic_PUK3_1.bin');
// fs.copyFileSync('D:/CrossGate/bin/Puk3/GraphicInfo_PUK3_1.bin', './bin/GraphicInfo_PUK3_1.bin');
// removeAnimeById(160094, {
//     aInfoPath: './bin/AnimeInfo_PUK3_2.bin',
//     aPath: './bin/Anime_PUK3_2.bin',
//     gInfoPath: './bin/GraphicInfo_PUK3_1.bin',
//     gPath: './bin/Graphic_PUK3_1.bin'
// }, true, res => {
//     log(`==== 删除[160094] 任务完成 ====`);

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



// EXP: 从目标文件中拆分id为108301的数据
// splitAnimeById({
//     animeInfoPath: aInfoPathEX,
//     animePath: aPathEX,
//     graphicInfoPath: gInfoPathEX,
//     graphicPath: gPathEX
// }, 108301, data => {
//     log('==== 读取任务完成 ====');
// });



// // EXP: 测试G类
// let g = new GFile(gPath, gInfoPath);

// // 将0-9号图片写入文件1
// let imgList = [];
// for(let i=0;i<10;i++){
//     imgList.push(i);
// }
// g.exportMultGraphic(imgList, './output/tmp2');

// // 将0号图片写入文件2
// g.exportGraphic(0, './output/tmp2');

// // 释放g
// g.release();

// // 读取文件1
// g = new GFile('./output/tmp2/Graphic_0-9.bin', './output/tmp2/GraphicInfo_0-9.bin');

// // 将文件2追加到文件1
// let g2 = new GFile('./output/tmp2/Graphic_0.bin', './output/tmp2/GraphicInfo_0.bin');
// g.addGraphic(g2).save();
// console.log(g.imgNumDictionary);

// // 删除文件2
// fs.unlinkSync('./output/tmp2/Graphic_0.bin');
// fs.unlinkSync('./output/tmp2/GraphicInfo_0.bin');

// // 删除文件1中的第一张图片0
// g.deleteGraphic(0).save();

// // 删除文件1中的7,8,9三张图片
// g.deleteMultGraphic([7,8,9]).save();

// // 修改文件1中的图片10的信息, imgNum, offsetX|offsetY, canMove, areaX|areaY
// g.setGraphicInfo(10, {
//     imgNum: 0,
//     offsetX: 0,
//     offsetY: 0,
//     areaX: 2,
//     areaY: 2,
//     canMove: 1,
//     mapId: 10086
// }).save();




// // EXP: 测试AFile类
// let a = new AFile(gPath, gInfoPath, aPath, aInfoPath);

// // 1. 导出多个动画文件
// a.exportAnime(110505, './output/tmp3');

// a.exportAnime(110520, './output/tmp3');

// a.exportAnime(110526, './output/tmp3');

// a.exportAnime(110532, './output/tmp3');

// a.exportAnime(110544, './output/tmp3');

// a.exportAnime(110550, './output/tmp3');

// // 3. 释放a
// a.release();

// // 4. 实例化文件1, 2-6
// let f1GPath = './output/tmp3/Graphic_110505.bin';
// let f1GInfoPath = './output/tmp3/GraphicInfo_110505.bin';
// let f1APath = './output/tmp3/Anime_110505.bin';
// let f1AInfoPath = './output/tmp3/AnimeInfo_110505.bin';
// let a1 = new AFile(f1GPath, f1GInfoPath, f1APath, f1AInfoPath);

// // 5. 将文件2-5追加到文件1, 并删除文件2-5
// let list = [110520, 110526, 110532, 110544];
// for(let i=0;i<list.length;i++){
//     let f2GPath = `./output/tmp3/Graphic_${list[i]}.bin`;
//     let f2GInfoPath = `./output/tmp3/GraphicInfo_${list[i]}.bin`;
//     let f2APath = `./output/tmp3/Anime_${list[i]}.bin`;
//     let f2AInfoPath = `./output/tmp3/AnimeInfo_${list[i]}.bin`;
//     let _a = new AFile(f2GPath, f2GInfoPath, f2APath, f2AInfoPath);
//     a1.addAnime(_a);

//     _a.release();

//     fs.unlinkSync(f2GPath);
//     fs.unlinkSync(f2GInfoPath);
//     fs.unlinkSync(f2APath);
//     fs.unlinkSync(f2AInfoPath);
// }

// a1.save();

// // 6. 将文件1追加到文件6, 并删除文件1
// let f6GPath = './output/tmp3/Graphic_110550.bin';
// let f6GInfoPath = './output/tmp3/GraphicInfo_110550.bin';
// let f6APath = './output/tmp3/Anime_110550.bin';
// let f6AInfoPath = './output/tmp3/AnimeInfo_110550.bin';
// let a6 = new AFile(f6GPath, f6GInfoPath, f6APath, f6AInfoPath);
// a6.addAnime(a1).save();

// fs.unlinkSync(f1GPath);
// fs.unlinkSync(f1GInfoPath);
// fs.unlinkSync(f1APath);
// fs.unlinkSync(f1AInfoPath);

// a1.release();


// // 7. 删除文件6中的第一个动画
// a6.deleteAnime(110550, false).save();

// // 8. 删除文件6中的动画[110553, 110554, 110552]
// let delList = [110553, 110554, 110552];
// a6.deleteMultAnime(delList, false).save();


// // 9. 修改文件6中的动画 110555 的信息   
// a6.setAnimeInfo(110555, {animeId:110552}).save();


// EXP: 将120099的数据写入目标文件中
// addAnimeById(120099, {
//     aInfoPath: aInfoPath,
//     aPath: aPath,
//     gInfoPath: gInfoPath,
//     gPath: gPath
// }, () => {
//     log('==== 写入任务完成 ====');
// });



// EXP: 检查目标文件是否存在, 若不存在, 则创建空文件, 并将120099的数据写入
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

// NOTE: 修复前版本, 压缩版本01 82, 采用全局调色板, 花屏, 内置496号图为隐藏调色板, 调色板长度750, 文件大小:8A7602

// NOTE: _2版本, 压缩版本01 82, 采用全局调色板, 内置496号图为隐藏调色板, 调色板长度750, 文件大小:69FB71, 猜测是根据隐藏调色板的数据对比官方调色板, 修改了原始数据

// NOTE: _3版本, 压缩版本03 00, 删除了496号隐藏调色板, 改为每张图内置调色板, 调色板长度750, 文件大小:8FDF12

// NOTE: _2版本, _3版本打入后均正常显示

// NOTE: 从图片解出来的调色板颜色不对, 尝试不解压调色板部分

// NOTE: 修复前gInfo中图片信息数为497, _2版本gInfo中图片信息数为497, _3版本gInfo中图片信息数为496(删除了隐藏调色板的图片)

// NOTE: 修复前, 与_2版本修复中, 都有一张图片MapId==AnimieID, 为隐藏调色板文件

// NOTE: _2版本修复为把隐藏调色板去掉, 使用全局调色板, 因此图档文件变小 ???

// NOTE: _3版本修复为把动画的隐藏调色板加到了每张图片中, 因此图档文件变大

// NOTE: 群友[無憂無慮]提示转全局后颜色变少，压缩后就更小了, RD版本02或03的才带独立调色板，00或01没有，使用全局调色板，就是那些cgp文件; 但RD01的也可能是使用隐藏调色板，由anime里的调色板号决定，或者用动画ID查找; puk后的图档大部分都是隐藏调色板; 提取为全局或独立调色就不需要; 调色板和图片索引数据一起压缩了; 一般是768字节，有些调色板长度不足768;

// NOTE: 群友[fantastic]: 文件头有数据长度和调色板长度, 解壓後到字節數滿足為止, 就是調色板數據; 不用管解壓到哪裡 反正解壓到字節滿足為止     