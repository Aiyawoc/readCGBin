/**
 * cg图档工具,
 * 实现传入一个动画编号数组，将其中每个编号对应的g，ginfo,a,ainfo文件拆分到output文件中
 * 注意动画文件有两种拆分方式
 * 实现删除指定编号的动画图档
 * 实现合并动画图档
 */

const fs = require('fs');

const gInfoPath = './bin/GraphicInfo_PUK3_1.bin';
const gPath = './bin/Graphic_PUK3_1.bin';
const aInfoPath = './bin/AnimeInfo_PUK3_2.bin';
const aPath = './bin/Anime_PUK3_2.bin';

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
            console.log(`读取graphicInfo完成, 共有[${graphicInfoArr.length}]条图片数据`);
            GInfoList = graphicInfoArr;
            resolve(graphicInfoArr);
        });
    });

    let p1 = new Promise((resolve, reject) => {
        getAnimeInfo(pathList.animeInfoPath, animeInfoArr => {
            console.log(`读取animeInfo完成, 共有[${animeInfoArr.length}]条动画数据`);
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
            console.log('read err', err);
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



class GraphicInfo {
    /**
     * 创建图片信息对象
     * @param {Buffer} buffer 十六进制图片信息数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // 0-3字节[LONG]反转为编号
        // 4-7字节[DWORD]指明圖片在數據文件中的起始位置
        // 8-11字节[DWORD]圖片數據塊的大小
        // 12-15字节[LONG]偏移量X
        // 16-19字节[LONG]偏移量Y
        // 20-23字节[LONG]图片宽度
        // 24-27字节[LONG]图片高度
        // 28字节[BYTE]占地面积X
        // 29字节[BYTE]占地面积Y
        // 30字节[BYTE]用於地圖，0表示障礙物，1表示可以走上去
        // 31-35字节[BYTE]
        // 36-39字节[LONG]地图编号, 非地圖單位的此項均為0
    }

    /**
     * 获取图片编号
     */
    get imgNum() {
        return this.buffer.readIntLE(0, 4);
    }

    /**
     * 设置图片编号
     * @param {Number} num 图片编号 
     */
    set imgNum(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.readIntLE(0, 4);
    }

    get addr() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set addr(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get imgSize() {
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    set imgSize(num) {
        this.buffer.slice(8, 12).writeIntLE(num, 0, 4);
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    get offsetX() {
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    set offsetX(num) {
        this.buffer.slice(12, 16).writeIntLE(num, 0, 4);
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    get offsetY() {
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    set offsetY(num) {
        this.buffer.slice(16, 20).writeIntLE(num, 0, 4);
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    get imgWidth() {
        return this.buffer.slice(20, 24).readIntLE(0, 4);
    }

    set imgWidth(num) {
        this.buffer.slice(20, 24).writeIntLE(num, 0, 4);
        return this.buffer.slice(20, 24).readIntLE(0, 4);
    }

    get imgHeight() {
        return this.buffer.slice(24, 28).readIntLE(0, 4);
    }

    set imgHeight(num) {
        this.buffer.slice(24, 28).writeIntLE(num, 0, 4);
        return this.buffer.slice(24, 28).readIntLE(0, 4);
    }

    get areaX() {
        return this.buffer.slice(28, 29).readIntLE(0, 1);
    }

    set areaX(num) {
        this.buffer.slice(28, 29).writeIntLE(num, 0, 1);
        return this.buffer.slice(28, 29).readIntLE(0, 1);
    }

    get areaY() {
        return this.buffer.slice(29, 30).readIntLE(0, 1);
    }

    set areaY(num) {
        this.buffer.slice(29, 30).writeIntLE(num, 0, 1);
        return this.buffer.slice(29, 30).readIntLE(0, 1);
    }

    get canMove() {
        return this.buffer.slice(30, 31).readIntLE(0, 1);
    }

    set canMove(num) {
        this.buffer.slice(30, 31).writeIntLE(num, 0, 1);
        return this.buffer.slice(30, 31).readIntLE(0, 1);
    }

    get mapId() {
        return this.buffer.slice(36, 40).readIntLE(0, 4);
    }

    set mapId(num) {
        this.buffer.slice(36, 40).writeIntLE(num, 0, 4);
        return this.buffer.slice(36, 40).readIntLE(0, 4);
    }
}

class Graphic {
    /**
     * 创建图片数据对象
     * @param {Buffer} buffer 十六进制图片数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // 0-1字节固定为RD
        // 2字节为版本, 偶數表示未壓縮，按位圖存放；奇數則表示壓縮過
        // 3字节未知
        // 4-7字节图片宽度
        // 8-11字节图片高度
        // 12-15字节块大小
        // 16-19为调色板
        // 20-N为图片数据
    }

    get startBlock() {
        return this.buffer.slice(0, 2).toString();
    }

    set startBlock(str) {
        // TODO:
        return this.buffer.slice(0, 2).toString();
    }

    get version() {
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    set version(num) {
        this.buffer.slice(2, 3).writeIntLE(num, 0, 1);
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    get imgWidth() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set imgWidth(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get imgHeight() {
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    set imgHeight(num) {
        this.buffer.slice(8, 12).writeIntLE(num, 0, 4);
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    get imgSize() {
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    set imgSize(num) {
        this.buffer.slice(12, 16).writeIntLE(num, 0, 4);
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    get palette() {
        return this.buffer.slice(16, 20);
    }

    set palette(hex) {
        // TODO:
        return this.buffer.slice(16, 20);
    }

    get bmp() {
        return this.buffer.slice(20, this.imgSize);
    }

    set bmp(hex) {
        // TODO:
        return this.buffer.slice(20, this.imgSize);
    }
}

class AnimeInfo {
    /**
     * 创建动画信息对象
     * @param {Buffer} buffer 十六进制动画信息数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // 0-3字节[LONG]为动画编号
        // 4-7字节[DWORD]动画数据地址
        // 8-9字节[DWORD]动画数量
        // 10-11字节[LONG]未知
    }

    get animeId() {
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    set animeId(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    get addr() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set addr(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get animeCount() {
        return this.buffer.slice(8, 10).readIntLE(0, 2);
    }

    set animeCount(num) {
        this.buffer.slice(8, 10).writeIntLE(num, 0, 2);
        return this.buffer.slice(8, 10).readIntLE(0, 2);
    }

    get other() {
        return this.buffer.slice(10, 12).readIntLE(0, 2);
    }

    set other(num) {
        this.buffer.slice(10, 12).writeIntLE(num, 0, 2);
        return this.buffer.slice(10, 12).readIntLE(0, 2);
    }
}

class Anime {
    /**
     * 创建动画数据对象
     * @param {Buffer} buffer 十六进制动画数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        this.actions = [];
        this.imgList = [];
        this.getActions();
    }

    getActions() {
        let addr = 0;
        let endAddr = this.buffer.length;
        while (addr < endAddr) {
            let headHex = this.buffer.slice(addr, addr + 20);
            let frameCount = headHex.slice(8, 12).readIntLE(0, 4);
            let actionEndAddr = addr + 20 + (frameCount * 10);
            let actionHex = this.buffer.slice(addr, actionEndAddr);
            let action = new Action(actionHex);
            this.actions.push(action);
            addr = actionEndAddr;
        }
    }

    get imgList() {
        let imgArr = {};
        for (let i = 0; i < this.actions.length; i++) {
            let _action = this.actions[i];
            for (let j = 0; j < _action.frames.length; j++) {
                let _frame = _action.frames[j];
                imgArr[_frame.imgNum] = true;
            }
        }

        imgArr = Object.keys(imgArr);

        return imgArr;
    }

    set imgList(num) {
        return
    }
}

class Action {
    /**
     * 创建动作类
     * @param {Buffer} buffer 十六进制动作数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        this.frames = [];
        this.getFrames();
    }

    get direction() {
        return this.buffer.slice(0, 2).readIntLE(0, 2);
    }

    set direction(num) {
        this.buffer.slice(0, 2).writeIntLE(num, 0, 2);
        return this.buffer.slice(0, 2).readIntLE(0, 2);
    }

    get actionNum() {
        return this.buffer.slice(2, 4).readIntLE(0, 2);
    }

    set actionNum(num) {
        this.buffer.slice(2, 4).writeIntLE(num, 0, 2);
        return this.buffer.slice(2, 4).readIntLE(0, 2);
    }

    get aniTime() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set aniTime(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get frameCount() {
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    set frameCount(num) {
        this.buffer.slice(8, 12).writeIntLE(num, 0, 4);
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    getFrames() {
        let _addr = 20;
        for (let i = 0; i < this.frameCount; i++) {
            let frameHex = this.buffer.slice(i * 10 + _addr, i * 10 + _addr + 10);
            let frame = new Frame(frameHex);
            this.frames.push(frame);
        }
    }
}

class Frame {
    /**
     * 创建帧对象
     * @param {Buffer} buffer 十六进制帧数据
     */
    constructor(buffer) {
        this.buffer = buffer;
    }

    get imgNum() {
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    set imgNum(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }
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
                    // console.log(`[${_info.imgNum}]文件已存在, 跳过`);
                    getGraphicDataList(path, gList, nameSpace, passHave, callback);
                } else {
                    getGraphicData(path, _info, graphicData => {
                        if (graphicData) {
                            console.log(`读取[${_info.imgNum}]完成, 开始写入文件`);
                            let p0 = new Promise((resolve, reject) => {
                                saveGraphicInfo(_info, nameSpace, () => {
                                    console.log(`写入GraphicInfo[${_info.imgNum}]完成`);
                                    resolve();
                                });
                            });

                            let p1 = new Promise((resolve, reject) => {
                                saveGraphicData(_info.imgNum, graphicData, nameSpace, () => {
                                    console.log(`写入Graphic[${_info.imgNum}]完成`);
                                    resolve();
                                });
                            });

                            Promise.all([p0, p1]).then(() => {
                                getGraphicDataList(path, gList, nameSpace, passHave, callback);
                            });
                        } else {
                            console.log(`读取[${_info.imgNum}]失败, 继续下一条`);
                            getGraphicDataList(path, gList, nameSpace, passHave, callback);
                        }
                    });
                }
            });
        } else {
            getGraphicData(path, _info, graphicData => {
                if (graphicData) {
                    console.log(`读取[${_info.imgNum}]完成, 开始写入文件`);
                    let p0 = new Promise((resolve, reject) => {
                        saveGraphicInfo(_info, nameSpace, () => {
                            console.log(`写入GraphicInfo[${_info.imgNum}]完成`);
                            resolve();
                        });
                    });

                    let p1 = new Promise((resolve, reject) => {
                        saveGraphicData(_info.imgNum, graphicData, nameSpace, () => {
                            console.log(`写入Graphic[${_info.imgNum}]完成`);
                            resolve();
                        });
                    });

                    Promise.all([p0, p1]).then(() => {
                        getGraphicDataList(path, gList, nameSpace, passHave, callback);
                    });
                } else {
                    console.log(`读取[${_info.imgNum}]失败, 继续下一条`);
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
            console.log('read err', err);
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
            console.log(startBlock, version, imgWidth, imgHeight, imgSize);
            console.log(imgWidth == info.imgWidth, imgHeight == info.imgHeight, imgSize == info.imgSize);
            console.log(info.imgSize, imgSize);
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
            console.log(`open ${path} faild`, err);
            callback(false);
            return;
        }

        fs.write(fd, info.buffer, err => {
            if (err) {
                console.log(`${fileName} 写入失败`, err);
                callback(false);
                return;
            }

            fs.close(fd);
            console.log(`${fileName} 写入完成`);
            callback(true);
        });
    });
}

function saveGraphicData(imgNum, data, nameSpace, callback) {
    let fileName = `Graphic_${nameSpace}_${imgNum}.bin`;
    let path = `./output/${nameSpace}/graphic/${fileName}`;
    fs.open(path, 'w+', (err, fd) => {
        if (err) {
            console.log(`open ${path} faild`, err);
            callback(false);
            return;
        }

        fs.write(fd, data.buffer, err => {
            if (err) {
                console.log(`${fileName} 写入失败`, err);
                callback(false);
                return;
            }

            fs.close(fd);
            console.log(`${fileName} 写入完成`);
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
                console.log(`open ${path} faild`, err);
                callback(false);
                return;
            }

            fs.write(fd, fileDataHex, err => {
                if (err) {
                    console.log(`${fileName} 写入失败`, err);
                    callback(false);
                    return;
                }

                fs.close(fd);
                // console.log(`${filePath} 写入完成`);
                callback(true);
            });
        });
    });
}

function getAnimeInfo(path, callback) {
    fs.readFile(path, (err, data) => {
        if (err) {
            console.log('read err', err);
            return;
        }

        let infoArr = [];
        let len = data.length / 12;
        // console.log(len);
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
            console.log('read err', err);
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
            console.log(`open ${path} faild`, err);
            callback(false);
            return;
        }

        fs.write(fd, info.buffer, err => {
            if (err) {
                console.log(`${fileName} 写入失败`, err);
                callback(false);
                return;
            }

            fs.close(fd);
            console.log(`${fileName} 写入完成`);
            callback(true);
        });
    });
}

function saveAnimeData(animeNo, data, nameSpace, callback) {
    let fileName = `Anime_${nameSpace}_${animeNo}.bin`;
    let path = `./output/${fileName}`;
    fs.open(path, 'w+', (err, fd) => {
        if (err) {
            console.log(`open ${path} faild`, err);
            callback(false);
            return;
        }

        fs.write(fd, data.buffer, err => {
            if (err) {
                console.log(`${fileName} 写入失败`, err);
                callback(false);
                return;
            }

            fs.close(fd);
            console.log(`${fileName} 写入完成`);
            callback(true);
        });
    });
}

function getAnimeById(pathList, animeId, callback) {
    console.log('======= 任务开始 =======');
    readCGInfoFile(pathList, infoDataList => {
        let GInfoArr = infoDataList[0];
        let AInfoArr = infoDataList[1];

        console.log(`开始查找[${animeId}]的动画数据`);

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
                console.log(`读取Anime文件完成, 共需要[${animeData.imgList.length}]张图片, 开始查找图片信息文件`);

                // 从GInfoArr中找到需要的图片信息
                let needImgInfoArr = [];
                for (let i = 0; i < animeData.imgList.length; i++) {
                    let _imgNum = animeData.imgList[i];
                    needImgInfoArr.push(GInfoArr[_imgNum]);
                }

                let nameSpace = animeId;

                console.log(`读取graphicInfo完成, 共有[${needImgInfoArr.length}]条图片数据待处理, 开始分割图片数据`);
                GInfoList = Array.from(needImgInfoArr);
                mkDataDir(nameSpace, () => {

                    getGraphicDataList(pathList.graphicPath, needImgInfoArr, nameSpace, true, () => {
                        console.log('图片分割完成, 开始分割动画信息文件');

                        fs.open(`./output/${nameSpace}/animeInfo/animeInfo_${nameSpace}.bin`, 'w+', (err, fd) => {
                            fs.write(fd, targetAnimeInfo.buffer, err => {
                                console.log('动画信息文件分割完成, 开始分割动画文件');
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
                                                    console.log(`./output/${nameSpace}/anime/${fileName} 写入失败`);
                                                    reject();
                                                } else {
                                                    console.log(`./output/${nameSpace}/anime/${fileName} 写入完成`);
                                                    resolve();
                                                }
                                            });
                                        });
                                    });

                                    pArr.push(_p);
                                }

                                Promise.all(pArr).then(() => {
                                    console.log('======= 任务完成 =======');
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
        console.log(gInfoPath, gDataPath);

        getGraphicInfo(pathList.graphicInfoPath, graphicInfoArr => {
            console.log(`读取graphicInfo完成, 共有[${graphicInfoArr.length}]条图片数据, \n开始分割图片数据`);
            GInfoList = graphicInfoArr;

            getGraphicDataList(pathList.graphicPath, graphicInfoArr, nameSpace, true, () => {
                console.log('分割完成');
            });
        });
    });

}

function mkDataDir(nameSpace, cb) {
    fs.readdir('./output', (err, dirList) => {
        // console.log(dirList);
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
 * 将g文件添加到目标g文件末尾
 * @param {String} oriGPath 被添加的g文件地址
 * @param {String} tarGPath 目标g文件地址
 * @param {String} oriInfoPath 被添加的info文件地址
 * @param {String} tarInfoPath 目标info文件地址
 * @param {Function} callback 回调函数, 返回被添加的数据在目标文件中的地址
 */
function addToGraphic(oriGPath, tarGPath, oriInfoPath, tarInfoPath, callback) {
    // 读取tarPath文件, 获取当前size, 作为下一条的起始地址
    // 读取oriPath文件
    // 将oriPath文件追加到tarPath文件
    // 返回起始地址
    let p0 = new Promise((resolve, reject) => {
        fs.readFile(tarGPath, (err, data) => {
            if (err) {
                console.log(`读取[${tarGPath}]失败`, err);
                reject();
                return;
            }

            resolve(data);
        });
    });

    let p1 = new Promise((resolve, reject) => {
        getGInfoLastNum(tarInfoPath, lastNum => {
            resolve(lastNum + 1);
        });
    });

    Promise.all([p0, p1]).then(res => {
        let tarGraphicHex = res[0];
        let addr = tarGraphicHex.length;
        let startNum = res[1];

        console.log({ addr, startNum });

        // 将oriGPath追加到tarGPath
        let oriGraphic = new Graphic(fs.readFileSync(oriGPath));
        console.log(oriGraphic);
        let writeData = Buffer.concat(tarGraphicHex, oriGraphic.buffer);
        fs.open();

        // 读取并修改oriInfoPath文件

        // 将oriInfoPath追加到tarInfoPath

        // 返回info数据, 供添加anime方法调用


        // let oriFileHEX = fs.readFileSync(oriGPath);
        // let fd = fs.openSync(tarGPath, 'a+');
        // fs.writeFileSync(fd, oriFileHEX);
        // fs.close(fd);
        // callback(addr);
    });



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
    // console.log(fileList);
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

        // console.log({ aInfoFileArr, aFileArr, gInfoFileArr, gFileArr });
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
                    console.log(`读取[${tarGPath}]失败`, err);
                    reject();
                    return;
                }

                resolve(data);
            });
        });

        let pGetGInfoHex = new Promise((resolve, reject) => {
            fs.readFile(tarGInfoPath, (err, data) => {
                if (err) {
                    console.log(`读取[${tarGInfoPath}]失败`, err);
                    reject();
                    return;
                }

                resolve(data);
            });
        });

        Promise.all([pGetLastNum, pGetGHex, pGetGInfoHex]).then(dataList => {
            let startNum = dataList[0];
            let tarGHEX = dataList[1];
            let tarGInfoHEX = dataList[2];
            let startAddr = tarGHEX.length;
            let pArr = [];

            // 批量读取gInfo文件, g文件, 修改gInfo文件的起始编号, addr

            for (let i = 0; i < gInfoFileArr.length; i++) {
                let _p = new Promise((resolve, reject) => {
                    let _gInfoPath = gInfoFileArr[i];
                    let _gPath = gFileArr[i];
                    let _gInfo = new GraphicInfo(fs.readFileSync(_gInfoPath));
                    let _g = new Graphic(fs.readFileSync(_gPath));
                    let oriImgNum = _gInfo.imgNum;
                    _gInfo.imgNum = startNum + i;
                    _gInfo.addr = startAddr;
                    startAddr = startAddr + _g.imgSize;
                    // TODO: 用Promise无法保证顺序, 应该递归添加
                    let gFd = fs.openSync(tarGPath, 'a+');
                    fs.writeFileSync(gFd, _g.buffer);
                    fs.close(gFd);
                    console.log(`写入[${_gPath}]到graphic完成`);

                    let gInfoFd = fs.openSync(tarGInfoPath, 'a+');
                    fs.writeFileSync(gInfoFd, _gInfo.buffer);
                    fs.close(gInfoFd);
                    console.log(`写入[${_gInfoPath}]到graphicInfo完成`);

                    resolve({
                        oriImgNum: oriImgNum,
                        newImgNum: startNum + i
                    });
                });

                pArr.push(_p);
            }

            Promise.all(pArr).then(data => {
                for (let i = 0; i < data.length; i++) {
                    imgNumDictionary[data[i].oriImgNum] = data[i].newImgNum;
                }
                console.log('gInfo文件, g文件写入完成');
                console.log({ imgNumDictionary });
                // TODO: 开始写入动画文件

            });
        });
    });
}

// getAnimeById({
//     animeInfoPath: aInfoPath,
//     animePath: aPath,
//     graphicInfoPath: gInfoPath,
//     graphicPath: gPath
// }, 101780, data => {
//     console.log(data);
// });


addAnimeById(101780, {
    aInfoPath: aInfoPath,
    aPath: aPath,
    gInfoPath: gInfoPath,
    gPath: gPath
}, data => {
    console.log(data);
});
