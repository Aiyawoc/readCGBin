/**
 * 类
 * GraphicInfo 图片信息类
 * Graphic 图片数据类
 * AnimeInfo 动画信息类
 * Anime 动画数据类
 * Action 动作数据类
 * Frame 帧类
 * 其中, 一个Anime是由若干个Action组成, 每个Action中包含一个头和若干个Frame
 */

/** TODO: APP流程
 * 0. app启动时, 设置bin目录 
 * 1. 读取所有info文件作为索引
 * 2. 用户选择版本文件时, 读取对应文件进入缓存
 * 
 */

const { info } = require('console');
const fs = require('fs');
const Path = require('path');


Buffer.prototype.insert = function (addr, hex) {
    let oriHex = this;
    let part0 = oriHex.slice(0, addr);
    let part1 = oriHex.slice(addr, oriHex.length);
    Buffer.concat([part0, hex, part1]);
}


// 图片文件类
class GFile {
    /**
     * 实例化
     * @param {String} graphicPath graphic文件路径
     * @param {String} graphicInfoPath  graphicInfo文件路径
     */
    constructor(graphicPath, graphicInfoPath) {
        this.graphicPath = graphicPath;
        this.graphicInfoPath = graphicInfoPath;
        this.graphicBuffer = fs.readFileSync(graphicPath);
        this.graphicInfoBuffer = fs.readFileSync(graphicInfoPath);
        this.data = new Map();
        this.mapIds = {};

        this.updateMap();

        return this;
    }

    /**
     * 更新map
     */
    updateMap() {
        this.data.clear();

        if (this.graphicInfoBuffer.length % 40 !== 0) {
            throw new Error('graphicInfo文件长度异常');
        }

        this.length = this.graphicInfoBuffer.length / 40;
        for (let i = 0; i < this.length; i++) {
            let graphicInfo = new GraphicInfo(this.graphicInfoBuffer.slice(i * 40, (i + 1) * 40), i);
            let graphic = new Graphic(this.graphicBuffer.slice(graphicInfo.addr, graphicInfo.addr + graphicInfo.imgSize));
            let data = { graphicInfo, graphic };
            this.data.set(graphicInfo.imgNum, data);
            this.lastNode = data;
            if (graphicInfo.mapId > 0) {
                this.mapIds[graphicInfo.mapId] = this.mapIds[graphicInfo.mapId] ? this.mapIds[graphicInfo.mapId] + `|${graphicInfo.imgNum}` : `${graphicInfo.imgNum}`;
            }
        }
    }

    // 释放
    release() {
        this.graphicInfoBuffer = null;
        this.graphicBuffer = null;
        this.data = null;
    }

    /**
     * 通过下标编号获取图片数据(类似数组)
     * @param {Number} idx 下标编号
     * @returns {Object} 图片数据 {graphicInfo, graphic}
     */
    getDataByIndex(idx) {
        let keys = Array.from(this.data.keys());
        return this.data.get(keys[idx]);
    }

    /**
     * 通过图片编号获取图片数据
     * @param {Number} imgNum 图片编号
     * @returns {Object} 图片数据 {graphicInfo, graphic}
     */
    getDataByImgNum(imgNum) {
        imgNum = Number(imgNum);
        return this.data.get(imgNum);
    }

    /**
     * 更新图片信息文件中的图片编号
     * @param {Number} num 起始图片编号
     * @returns {G}
     */
    setStartNum(num) {
        let tmpMap = new Map();
        this.data.forEach((data, key) => {
            data.graphicInfo.imgNum = num + key;
            tmpMap.set(num + key, data);
        });

        // 将map中的key全部更新为新的图片编号
        this.data.clear();
        this.data = tmpMap;

        return this;
    }

    /**
     * 更新图片信息文件中的图片数据起始地址
     * @param {Number} offset 地址偏移量
     * @returns {G}
     */
    setOffsetAddr(offset) {
        this.data.forEach((data, key) => {
            data.graphicInfo.addr += offset;
        });

        return this;
    }

    /**
     * 导出图片
     * @param {Number} imgNum 图片编号
     * @param {String} path 保存路径
     * @param {String} name 自定义文件中间名, 默认使用图片编号
     */
    exportGraphic(imgNum, path, name = null) {
        let data = this.getDataByImgNum(imgNum);
        if (!data) {
            throw `not found [${imgNumList[i]}]`
        }
        // 深拷贝graphicInfo
        let writeGraphicInfoBuffer = Buffer.alloc(data.graphicInfo.buffer.length);
        data.graphicInfo.buffer.copy(writeGraphicInfoBuffer);
        let writeGraphicInfo = new GraphicInfo(writeGraphicInfoBuffer);
        // 修改graphicInfo中的addr为0
        writeGraphicInfo.addr = 0;
        // 修改graphicInfo中的imgNum为0
        writeGraphicInfo.imgNum = 0;
        // 将graphicInfo写入文件
        name = name || imgNum;
        let infoPath = Path.join(path, `GraphicInfo_${name}.bin`);
        fs.writeFileSync(infoPath, writeGraphicInfo.buffer);
        // 将graphic写入文件
        let gPath = Path.join(path, `Graphic_${name}.bin`);
        fs.writeFileSync(gPath, data.graphic.buffer);

        return this;
    }

    /**
     * 导出多张图片
     * @param {Array} imgNumList 图片编号数组
     * @param {String} path 保存路径
     * @param {String} name 自定义文件中间名, 默认使用图片编号
     */
    exportMultGraphic(imgNumList, path, name = null) {
        // 查找目标图片数据
        // 深拷贝graphicInfo, 修改addr, 修改imgNum, 加入待写入数组
        let writeGraphicInfoList = [];
        let writeGraphicList = [];
        let offsetAddr = 0;
        let startImgNum = imgNumList[0];
        let endImgNum = imgNumList[imgNumList.length - 1];
        for (let i = 0; i < imgNumList.length; i++) {
            let data = this.getDataByImgNum(imgNumList[i]);
            if (!data) {
                throw `not found [${imgNumList[i]}]`
            }

            let tmpBuffer = Buffer.alloc(data.graphicInfo.buffer.length);
            data.graphicInfo.buffer.copy(tmpBuffer);
            let tmpGraphicInfo = new GraphicInfo(tmpBuffer);
            tmpGraphicInfo.imgNum = i;
            tmpGraphicInfo.addr = offsetAddr;
            offsetAddr += data.graphic.buffer.length;
            writeGraphicInfoList.push(tmpGraphicInfo.buffer);
            writeGraphicList.push(data.graphic.buffer);
        }

        name = name || `${startImgNum}-${endImgNum}`;
        // 将graphicInfo写入文件
        let infoPath = Path.join(path, `GraphicInfo_${name}.bin`);
        fs.writeFileSync(infoPath, Buffer.concat(writeGraphicInfoList));

        // 将graphic写入文件
        let gPath = Path.join(path, `Graphic_${name}.bin`);
        fs.writeFileSync(gPath, Buffer.concat(writeGraphicList));

        return this;
    }

    /**
     * 追加图片, 支持多张
     * @param {Buffer} graphicInfoBuffer 待添加的graphicInfo buffer
     * @param {Buffer} graphicBuffer 待添加的graphic buffer
     * @param {Number} startNum 起始编号, 默认为最后一张图片的编号+1
     * @returns 
     */
    addGraphicByBuffer(graphicInfoBuffer, graphicBuffer, startNum = null) {
        // 如果未传入startNum, 则获取起始Num
        startNum = startNum || this.lastNode.graphicInfo.imgNum + 1;
        // 获取起始addr
        let startAddr = this.graphicBuffer.length;

        // 分割待追加数据
        let gInfoBufferList = [];
        let gBufferList = [];
        if (graphicInfoBuffer.length % 40 !== 0) {
            throw `graphicInfo文件长度异常:: % 40 = [graphicInfoBuffer.length % 40]`;
        }
        let len = graphicInfoBuffer.length / 40;
        let offsetAddr = 0;
        let imgNumDictionary = {};
        for (let i = 0; i < len; i++) {
            let _gInfo = new GraphicInfo(graphicInfoBuffer.slice(i * 40, i * 40 + 40));
            let _g = new Graphic(graphicBuffer.slice(_gInfo.addr, _gInfo.addr + _gInfo.imgSize));

            let newImgNum = startNum + i;
            // 检测startNum是否冲突
            if (this.getDataByImgNum(newImgNum)) {
                throw `imgNum [${newImgNum}] 已存在`
            }
            // 修改info中的imgNum
            imgNumDictionary[_gInfo.imgNum] = newImgNum;
            _gInfo.imgNum = newImgNum;
            // 修改info中的addr
            _gInfo.addr = startAddr + offsetAddr;
            offsetAddr += _gInfo.imgSize;
            // 加入到map中
            this.data.set(newImgNum, { graphicInfo: _gInfo, graphic: _g });
            // 写入到buffer中
            gInfoBufferList.push(_gInfo.buffer);
            gBufferList.push(_g.buffer);
        }

        this.graphicBuffer = Buffer.concat([this.graphicBuffer, ...gBufferList]);
        this.graphicInfoBuffer = Buffer.concat([this.graphicInfoBuffer, ...gInfoBufferList]);

        // 更新map
        this.updateMap();

        // 临时增加的图片编号字典
        this.imgNumDictionary = imgNumDictionary;
        return this;
    }

    /**
     * 追加图片, 支持多张
     * @param {GFile} gFile 待追加的图片文件 
     * @param {Number} startNum 起始编号, 默认为最后一张图片的编号+1
     */
    addGraphic(gFile, startNum = null) {
        // 如果未传入startNum, 则获取起始Num
        startNum = startNum || this.lastNode.graphicInfo.imgNum + 1;
        // 获取起始addr
        let startAddr = this.graphicBuffer.length;
        let offsetAddr = 0;
        let imgNumDictionary = {};
        let gInfoBufferList = [];
        let gBufferList = [];

        let keys = Array.from(gFile.data.keys());
        for (let i = 0; i < keys.length; i++) {
            let newImgNum = startNum + i;
            // 检测startNum是否冲突
            if (this.getDataByImgNum(newImgNum)) {
                throw `imgNum [${newImgNum}] 已存在`
            }

            let _data = gFile.data.get(keys[i]);
            let _gInfo = _data.graphicInfo;
            let _g = _data.graphic;

            // 修改_gInfo的imgNum
            imgNumDictionary[_gInfo.imgNum] = newImgNum;
            _gInfo.imgNum = newImgNum;
            // 修改_gInfo中的addr
            _gInfo.addr = startAddr + offsetAddr;
            offsetAddr += _gInfo.imgSize;

            // 将_gInfo, _g的buffer保存到数组中
            gInfoBufferList.push(_gInfo.buffer);
            gBufferList.push(_g.buffer);
        }

        // 将 gBufferList, gInfoBufferList 追加到this.graphicBuffer, this.graphicInfoBuffer中
        this.graphicBuffer = Buffer.concat([this.graphicBuffer, ...gBufferList]);
        this.graphicInfoBuffer = Buffer.concat([this.graphicInfoBuffer, ...gInfoBufferList]);

        // 更新map
        this.updateMap();

        // 临时增加的图片编号字典
        this.imgNumDictionary = imgNumDictionary;

        return this;
    }

    /**
     * 删除图片
     * @param {Number} imgNum 图片编号
     * @returns 
     */
    deleteGraphic(imgNum) {
        let _data = this.getDataByImgNum(imgNum);
        if (!_data) {
            console.log(`imgNum [${imgNum}] 不存在`);
            return this;
        }
        // 查找该图片的addr, size
        let offsetAddr = _data.graphicInfo.imgSize;
        let startAddr = _data.graphicInfo.addr;
        let endAddr = _data.graphicInfo.addr + offsetAddr;
        // 从graphicBuffer中删除数据
        let part0 = this.graphicBuffer.slice(0, startAddr);
        let part1 = this.graphicBuffer.slice(endAddr, this.graphicBuffer.length);
        this.graphicBuffer = Buffer.concat([part0, part1]);
        part0 = null;
        part1 = null;

        // 从graphicInfoBuffer中删除数据
        let infoPart0 = this.graphicInfoBuffer.slice(0, _data.graphicInfo.selfAddr);
        let infoPart1 = this.graphicInfoBuffer.slice(_data.graphicInfo.selfAddr + 40, this.graphicInfoBuffer.length);
        let restLen = infoPart1.length / 40;
        // 更新之后info中的addr
        for (let i = 0; i < restLen; i++) {
            let tmpGInfo = new GraphicInfo(infoPart1.slice(i * 40, i * 40 + 40));
            tmpGInfo.addr -= offsetAddr;
        }
        this.graphicInfoBuffer = Buffer.concat([infoPart0, infoPart1]);
        infoPart0 = null;
        infoPart1 = null;

        // 更新map
        this.updateMap();

        return this;
    }

    /** 
     * 删除多张图片, 如果图片非连续, 则速度较慢
     * @param {Array} imgList 图片编号数组
     */
    deleteMultGraphic(imgList) {
        // 判断图片编号是否连续
        let diff = 0;
        for(let i=1;i<imgList.length;i++){
            let val = imgList[i] - imgList[i-1];
            if(val > diff){
                diff = val;
            }
        }

        if(diff == 1){
            // 连续图片, 计算图片起始结束地址, 集中删除
            let startData = this.getDataByImgNum(imgList[0]);
            let endData = this.getDataByImgNum(imgList[imgList.length-1]);
            let startAddr = startData.graphicInfo.addr;
            let endAddr = endData.graphicInfo.addr + endData.graphicInfo.imgSize;
            let offsetAddr = endAddr - startAddr;
            // 从graphicBuffer中删除数据
            let part0 = this.graphicBuffer.slice(0, startAddr);
            let part1 = this.graphicBuffer.slice(endAddr, this.graphicBuffer.length);
            this.graphicBuffer = Buffer.concat([part0, part1]);
            part0 = null;
            part1 = null;
            // 从graphicInfoBuffer中删除数据
            let infoPart0 = this.graphicInfoBuffer.slice(0, startData.graphicInfo.selfAddr);
            let infoPart1 = this.graphicInfoBuffer.slice(endData.graphicInfo.selfAddr + 40, this.graphicInfoBuffer.length);
            let restLen = infoPart1.length / 40;
            // 更新之后info中的addr
            for (let i = 0; i < restLen; i++) {
                let tmpGInfo = new GraphicInfo(infoPart1.slice(i * 40, i * 40 + 40));
                tmpGInfo.addr -= offsetAddr;
            }
            this.graphicInfoBuffer = Buffer.concat([infoPart0, infoPart1]);
            infoPart0 = null;
            infoPart1 = null;

            // 更新map
            this.updateMap();

        }else{
            // 非连续图片, 批量单条删除
            console.log(`图片非连续, 速度较慢, 共需要删除[${imgList.length}]张图片`);
            for (let i = 0; i < imgList.length; i++) {
                console.log(`开始删除图片: [${imgList[i]}], ${i+1}/${imgList.length}`);
                this.deleteGraphic(imgList[i]);
            }

        }

        return this;
    }

    /**
     * 修改图片
     * @param {Number} imgNum 图片编号
     * @param {Object} options {imgNum, offsetX, offsetY, areaX, areaY, canMove, mapId}
     * @returns 
     */
    setGraphicInfo(imgNum, options) {
        let _data = this.getDataByImgNum(imgNum);
        if (!_data) {
            console.log(`imgNum [${imgNum}] 不存在`);
            return this;
        }

        let _info = _data.graphicInfo;

        // 不能简单的用1元运算符判断, 因为有可能传入0
        if (options.imgNum >= 0) {
            // 检查是否有编号冲突
            let has = this.getDataByImgNum(options.imgNum);
            if (has) {
                console.log(`编号冲突: [${options.imgNum}]已存在`);
            } else {
                _info.imgNum = options.imgNum;
            }
        }

        _info.offsetX = typeof options?.offsetX == 'number' ? options.offsetX : _info.offsetX;
        _info.offsetY = typeof options?.offsetY == 'number' ? options.offsetY : _info.offsetY;
        _info.areaX = typeof options?.areaX == 'number' ? options.areaX : _info.areaX;
        _info.areaY = typeof options?.areaY == 'number' ? options.areaY : _info.areaY;
        _info.canMove = typeof options?.canMove == 'number' ? options.canMove : _info.canMove;
        _info.mapId = typeof options?.mapId == 'number' ? options.mapId : _info.mapId;

        return this;
    }

    /**
     * 保存文件
     * @param {String} gPath graphic文件地址, 默认原地址
     * @param {String} gInfoPath graphicInfo文件地址, 默认原地址
     * @returns 
     */
    save(gPath = null, gInfoPath = null) {
        gPath = gPath || this.graphicPath;
        gInfoPath = gInfoPath || this.graphicInfoPath;
        fs.writeFileSync(gPath, this.graphicBuffer);
        fs.writeFileSync(gInfoPath, this.graphicInfoBuffer);
        return this;
    }
}


/**
 * 图片信息类
 */
class GraphicInfo {
    /**
     * 创建图片信息对象
     * @param {Buffer} buffer 十六进制图片信息数据
     * @param {Number} idx 该段数据在文件中的编号, 用于获取本条数据在文件中的地址selfAddr
     */
    constructor(buffer, idx = 0) {
        this.buffer = buffer;
        this.selfAddr = idx * 40;
        // 0-3字节[LONG]为编号 imgNum
        // 4-7字节[DWORD]指明圖片在數據文件中的起始位置 addr
        // 8-11字节[DWORD]圖片數據塊的大小 imgSize
        // 12-15字节[LONG]偏移量X offsetX
        // 16-19字节[LONG]偏移量Y offsetY
        // 20-23字节[LONG]图片宽度 imgWidth
        // 24-27字节[LONG]图片高度 imgHeight
        // 28字节[BYTE]占地面积X areaX
        // 29字节[BYTE]占地面积Y areaY
        // 30字节[BYTE]用於地圖，0表示障礙物，1表示可以走上去 canMove
        // 31-35字节[BYTE]
        // 36-39字节[LONG]地图编号, 非地圖單位的此項均為0 mapId
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

    get unKnow() {
        return this.buffer.slice(31, 36);
    }

    set unKnow(num) {
        return this.buffer.slice(31, 36);
    }

    get mapId() {
        return this.buffer.slice(36, 40).readIntLE(0, 4);
    }

    set mapId(num) {
        this.buffer.slice(36, 40).writeIntLE(num, 0, 4);
        return this.buffer.slice(36, 40).readIntLE(0, 4);
    }

    /**
     * // 从数据创建图片信息对象
     * @param {Object} data 
     * @returns {GraphicInfo} 图片信息对象
     */
    initFromData(data) {
        let buffer = Buffer.alloc(40);

        // 0-3字节[LONG]为编号
        buffer.writeIntLE(data.imgNum, 0, 4);
        // 4-7字节[DWORD]指明圖片在數據文件中的起始位置
        buffer.writeIntLE(data.addr, 4, 4);
        // 8-11字节[DWORD]圖片數據塊的大小
        buffer.writeIntLE(data.imgSize, 8, 4);
        // 12-15字节[LONG]偏移量X, 1个格子为64*47, 偏移量-32,-24, 默认偏移量0-(图片宽度-64)/2
        buffer.writeIntLE(data.offsetX || 0 - Math.floor((data.imgWidth - 64) / 2), 12, 4);
        // 16-19字节[LONG]偏移量Y, 1个格子为64*47, 偏移量-32,-24, 默认偏移量0-(图片高度-47)/2
        buffer.writeIntLE(data.offsetY || 0 - Math.floor((data.imgHeight - 47) / 2), 16, 4);
        // 20-23字节[LONG]图片宽度
        buffer.writeIntLE(data.imgWidth, 20, 4);
        // 24-27字节[LONG]图片高度
        buffer.writeIntLE(data.imgHeight, 24, 4);
        // 28字节[BYTE]占地面积X, 默认1
        buffer.writeIntLE(data.areaX || 1, 28, 1);
        // 29字节[BYTE]占地面积Y, 默认1
        buffer.writeIntLE(data.areaY || 1, 29, 1);
        // 30字节[BYTE]用於地圖，0表示障礙物，1表示可以走上去, 默认1
        buffer.writeIntLE(data.canMove || 1, 30, 1);
        // 31-35字节[BYTE]Unknown
        buffer.writeIntLE(0, 31, 5);
        // 36-39字节[LONG]地图编号, 非地圖單位的此項均為0, 默认0
        buffer.writeIntLE(data.mapId || 0, 36, 4);

        this.buffer = buffer;

        return this;
    }
}


/**
 * 图片数据类
 */
class Graphic {
    /**
     * 创建图片数据对象
     * @param {Buffer} buffer 十六进制图片数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // 0-1字节固定为RD
        // 2字节为版本, 0及2表示未壓縮，按位圖存放；奇數則表示壓縮過, 1为神獸傳奇+魔弓傳奇+龍之沙漏, 3为乐园之卵
        // 3字节未知
        // 4-7字节图片宽度
        // 8-11字节图片高度
        // 12-15字节块大小
        // NOTE: 新版本16-19位为调色板, 20-N位为图片数据, 旧版本 16-N位为图片数据
        this.decodeBuffer = null;
    }

    get startBlock() {
        return this.buffer.slice(0, 2).toString();
    }

    set startBlock(str) {
        this.buffer.slice(0, 2).write(str, 0, 2);
        return this.buffer.slice(0, 2).toString();
    }

    get version() {
        return this.buffer.slice(2, 3).readUInt8(0);
    }

    set version(num) {
        this.buffer.slice(2, 3).writeUInt8(num, 0);
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    get pad() {
        return this.buffer.slice(3, 4).readUInt8(0);
    }

    set pad(num) {
        this.buffer.slice(3, 4).writeUInt8(num, 0);
        return this.buffer.slice(3, 4).readUInt8(0);
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

    get palSize() {
        // TODO: 目前验证版本是否携带调色板是用的version & 2, 计算出来2跟3都是true, 但是3的图片是有调色板的, 2的图片有没有调色板需进一步验证
        if (this.version == 3) {
            return this.buffer.slice(16, 20).readIntLE(0, 4);
        }
        return 0;
    }

    set palSize(num) {
        // 如果原本有调色板, 则修改调色板长度, 如果原本没有调色板, 则需要插入调色板长度数据
        if (this.version == 3) {
            this.buffer.slice(16, 20).writeIntLE(num, 0, 4);
            return this.buffer.slice(16, 20).readIntLE(0, 4);
        }

        //将原本的buffer分为两部分, 0-16位, 16位之后
        let part0 = this.buffer.slice(0, 16);
        let part1 = this.buffer.slice(16, this.buffer.length);
        let paletteHex = Buffer.alloc(4);
        paletteHex.writeIntLE(num, 0, 4);
        this.buffer = Buffer.concat([part0, paletteHex, part1]);
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    get cgp() {
        // 获取图片自带调色板
        if (this.palSize) {
            let cgpHex = this.buffer.slice(this.buffer.length - this.palSize, this.buffer.length);
            // console.log('cgpHex: ', cgpHex.length, cgpHex.length / 3);
            let cgp = new Cgp(cgpHex);
            return cgp;
        }
        return null;
    }

    set cgp(cgp) {
        // TODO: 设置图片自带调色板, 如果未自带调色板, 则添加到末尾, 如果已自带调色板, 则覆盖
        // 将cgp.bgrBuffer添加到this.buffer结尾
        this.buffer = Buffer.concat([this.buffer, cgp.bgrBuffer]);
        // 将this.palSize设置为cgp.bgrBuffer.length
        this.palSize = cgp.bgrBuffer.length;
        // 将this.version设置为3(3乐园之卵后开始自带调色板)
        // this.version = 3;
        // 将this.imgSize设置为this.imgSize+this.palSize
        this.imgSize = this.imgSize + this.palSize;
    }

    get pOffset() {
        if (this.version & 2) {
            return 4;
        }
        return 0;
    }

    get imgData() {
        if (this.version == 3) {
            // 当有调色板数据时, 截取从20位开始, 到buffer.lenght-调色板大小
            return this.buffer.slice(20, this.buffer.length - this.palSize);
        }
        // 当没有调色板数据时, 截取从16位开始, 到buffer.lenght
        return this.buffer.slice(16, this.buffer.length);
    }

    set imgData(hex) {
        // 替换Graphic的bmp数据
        if (this.version & 2) {
            let part0 = this.buffer.slice(0, 20);
            let part1 = this.buffer.slice(this.buffer.length - this.palSize, this.buffer.length);
            this.buffer = Buffer.concat([part0, hex, part1]);
            return this;
        } else {
            let part0 = this.buffer.slice(0, 16);
            this.buffer = Buffer.concat([part0, hex]);
        }

        this.imgSize = this.buffer.length;

        return this;
    }

    /**
     * 图档解密
     * @returns {Buffer} 解密后的图片数据
     */
    decode() {
        let graphic = this;
        if (graphic.startBlock !== 'RD') {
            throw new Error('错误的头文件');
        }

        let ver = graphic.version;
        let w = graphic.imgWidth;
        let h = graphic.imgHeight;
        let size = graphic.imgSize;
        let BG_COLOR = 0x00;

        // NOTE: 将img数据连调色板一起解压, 直到decodeBuf.length >= w*h为止
        // NOTE: version 0 1 2 3, 版本号为0|2时为未压缩数据,官方调色板; 为1时为压缩数据,官方调色板; 为3时为压缩数据,自带调色板;
        // 当ver为偶数时, 即没有压缩, 直接返回数据
        if (ver % 2 == 0) {
            return {
                decodeBuffer: this.imgData,
                decodePal: null
            };
        }

        let buf;
        let i = 0;
        let decodeBuf = new BufferExt();
        let decodeLen = w * h;

        if (this.version == 3) {
            // 当有调色板数据时, 截取从20位开始
            buf = this.buffer.slice(20, this.buffer.length);
            decodeLen += this.palSize;
        } else {
            buf = this.buffer.slice(16, this.buffer.length);
        }

        while (decodeBuf.length < decodeLen) {
            let pixel = buf[i];
            let condistion = pixel & 0xf0;
            let count = 0;
            let val = null;
            let n, m, y, a;
            switch (condistion) {
                // 字符串部分, 基本为处理调色板数据
                case 0x00:
                    //0n 长度为n的字符串(val, 从i+1 ~ i+1+count)
                    n = pixel & 0x0f;
                    count = n;
                    val = buf.slice(i + 1, i + 1 + count);
                    if (val.length == count) {
                        decodeBuf.write(val);
                        i = i + 1 + count;
                    } else {
                        // throw {condistion, count, val};
                        throw new Error(['0x00', val.length, count]);
                    }
                    break;
                case 0x10:
                    //1n 长度为n*0x100+m的字符串
                    n = pixel & 0x0f;
                    m = buf[i + 1];
                    count = n * 0x100 + m;
                    val = buf.slice(i + 2, i + 2 + count);

                    if (val.length == count) {
                        decodeBuf.write(val);
                        i = i + 2 + count;
                    } else if (val.length == this.palSize) {
                        // NOTE: 某些修复后为自带调色板的图片, 最后一个解密key的长度(即调色板长度)默认写为了768(256色), 实际可能不是这个长度, 需要根据palSize长度来判断
                        console.log(this.palSize, val.length, count);
                        decodeBuf.write(val);
                        i = i + 2 + count;
                    } else {
                        console.log(val);
                        throw new Error(['0x10', n, m, val.length, count]);
                    }
                    break;
                case 0x20:
                    // 2n 第二个字节m，第三个字节y，代表n*0x10000+x*0x100+y个字符
                    n = pixel & 0x0f;
                    m = buf[i + 1];
                    y = buf[i + 2];
                    count = n * 0x10000 + (m * 0x100) + y;
                    val = buf.slice(i + 3, i + 3 + count);
                    if (val.length == count) {
                        decodeBuf.write(val);
                        i = i + 3 + count;
                    } else {
                        throw new Error(['0x20', n, m, val.length, count]);
                    }
                    break;
                // 非透明色部分
                case 0x80:
                    n = pixel & 0x0f;
                    count = n;
                    a = buf[i + 1];
                    if (a >= 0) {
                        val = Buffer.alloc(count, a);
                        decodeBuf.write(val);
                        i = i + 2;
                    } else {
                        throw new Error(['0x80', a]);
                    }
                    break;
                case 0x90:
                    n = pixel & 0x0f;
                    a = buf[i + 1];
                    m = buf[i + 2];
                    if (a >= 0 && m >= 0) {
                        count = n * 0x100 + m;
                        val = Buffer.alloc(count, a);
                        decodeBuf.write(val);
                        i = i + 3;
                    } else {
                        throw new Error(['0x90', a, m]);
                    }
                    break;
                case 0xa0:
                    n = pixel & 0x0f;
                    a = buf[i + 1];
                    m = buf[i + 2];
                    y = buf[i + 3];
                    if (a >= 0 && m >= 0 && y >= 0) {
                        count = (n * 0x10000) + (m * 0x100) + y;
                        val = Buffer.alloc(count, a);
                        decodeBuf.write(val);
                        i = i + 4;
                    } else {
                        throw new Error(['0xa0', a, m, y]);
                    }
                    break;
                // 背景色部分(透明色?)
                case 0xc0:
                    n = pixel & 0x0f;
                    count = n;
                    val = Buffer.alloc(count, BG_COLOR);
                    decodeBuf.write(val);
                    i = i + 1;
                    break;
                case 0xd0:
                    n = pixel & 0x0f;
                    m = buf[i + 1];
                    if (m >= 0) {
                        count = n * 0x100 + m;
                        val = Buffer.alloc(count, BG_COLOR);
                        decodeBuf.write(val);
                        i = i + 2;
                    } else {
                        throw new Error(['0xd0', m]);
                    }
                    break;
                case 0xe0:
                    n = pixel & 0x0f;
                    m = buf[i + 1];
                    y = buf[i + 2];
                    if (m >= 0 && y >= 0) {
                        count = (n * 0x10000) + (m * 0x100) + y;
                        val = Buffer.alloc(count, BG_COLOR);
                        decodeBuf.write(val);
                        i = i + 3;
                    } else {
                        throw new Error(['0xe0', m, y]);
                    }
                    break;
            }
        }


        // NOTE: 如果是v3版本, 解压后的数据末尾是调色板数据, 需要将调色板数据截取出来
        if (this.version == 3) {
            return {
                decodeBuffer: decodeBuf.buffer.slice(0, decodeBuf.buffer.length - this.palSize),
                decodePal: decodeBuf.buffer.slice(decodeBuf.buffer.length - this.palSize, decodeBuf.buffer.length)
            };
        } else {
            return {
                decodeBuffer: decodeBuf.buffer,
                decodePal: null
            };
        }
    }

    /**
     * // TODO:  图片压缩方法, 需将调色板数据压入
     * @param {Buffer} imgData 待压缩的图片数据
     * @returns {Buffer} 压缩后的图片数据
     */
    encode(imgData) {
        // 采用游程编码方式, 将imgData压缩
        // 0n	xx	　	　	填充 n 个 xx
        // 1n	m	xx	　	填充 n * 0x100 + m 个xx
        // 2n	m	l   xx	填充 n * 0x10000 + (m * 0x100) + l 个xx
        // 8n   xx          填充 n 个 xx
        // 9n   m   xx      填充 n * 0x100 + m 个xx
        // An   xx  m   l   填充 xx * 0x10000 + (m * 0x100) + l 个xx
        // Cn               填充 n 个背景色
        // Dn   m           填充 n * 0x100 + m 个背景色
        // En   m   l       填充 n * 0x10000 + (m * 0x100) + l 个背景色

        // 分解imgData, 获取连续的值, 生成值数组
        let valueArr = [];
        let lastValue = imgData[0];
        let lastValueCount = 1;
        for (let i = 1; i < imgData.length; i++) {
            let value = imgData[i];
            if (value === lastValue) {
                lastValueCount++;
            } else {
                valueArr.push({ value: lastValue, count: lastValueCount });
                lastValue = value;
                lastValueCount = 1;
            }
        }

        // 将值数组转换为游程编码后的数组
        let runArr = [];
        for (let i = 0; i < valueArr.length; i++) {
            let value = valueArr[i].value;
            let count = valueArr[i].count;

            let buf;
            if (value === 0) {
                // 透明色
                if (count < 0x10) {
                    let n = 0xC0 + count;
                    buf = Buffer.from([n]);
                } else if (count < 0x100) {
                    let n = 0xD0 + Math.floor(count / 0x100);
                    let m = count % 0x100;
                    buf = Buffer.from([n, m]);
                } else if (count < 0x10000) {
                    let n = 0xE0 + Math.floor(count / 0x10000);
                    let m = Math.floor(count / 0x100) % 0x100;
                    let c = count % 0x100;
                    buf = Buffer.from([n, m, c]);
                }
            } else if (typeof (value) == 'string') {
                // 字符串 ??? bmp图片数据中会有字符串嘛?
                if (count < 0x10) {
                    buf = Buffer.from([count, value]);
                } else if (count < 0x100) {
                    let n = Math.floor(count / 0x100);
                    let m = count % 0x100;
                    buf = Buffer.from([0x10 + n, m, value]);
                } else if (count < 0x10000) {
                    let n = Math.floor(count / 0x10000);
                    let m = Math.floor(count / 0x100) % 0x100;
                    let l = count % 0x100;
                    buf = Buffer.from([0x20 + n, m, l, value]);
                }
            } else {
                // 非透明色
                if (count < 0x10) {
                    let n = 0x80 + count;
                    buf = Buffer.from([n, value]);
                } else if (count < 0x100) {
                    let n = 0x90 + Math.floor(count / 0x100);
                    let m = count % 0x100;
                    buf = Buffer.from([n, value, m]);
                } else if (count < 0x10000) {
                    let n = 0xA0 + Math.floor(count / 0x10000);
                    let m = Math.floor(count / 0x100) % 0x100;
                    let l = count % 0x100;
                    buf = Buffer.from([n, value, m, l]);
                }
            }

            runArr.push(buf);
        }

        return Buffer.concat(runArr);
    }

    /**
     * 生成bmp图片
     * 参考链接: https://blog.csdn.net/u013066730/article/details/82625158
     * @param {String} filePath 生成图片的目录+文件名
     * @param {Object} options 生成图片的参数 
     *  |- {Array} alphaColor 指定图片的背景色, BGRA
     *  |- {Array} changeColor 将背景色替换为该颜色, BGRA
     *  |- {Boolean} autoAlpha 是否自动查找背景色, 优先级比alphaColor低
     *  |- {Cgp} cgp 调色板, 传入cgp>图片自带cgp>默认官方cgp
     * @param {Function} callback 回调函数
     */
    createBMP(filePath, options, callback) {
        let alphaColor = options.alphaColor || null;
        let autoAlpha = options.autoAlpha || false;
        let changeColor = options.changeColor || [0x00, 0x00, 0x00, 0x00];
        let cgp = options.cgp || null;

        // 调用encode将this.buffer解密
        let { decodeBuffer, decodePal } = this.decode();
        let imgData = decodeBuffer;

        // 调色板数据(BGRA), 256*4位=1024位, 传入cgp>图片自带cgp>默认cgp
        // cgp = cgp || this.cgp || CGPMAP.get('palet_00.cgp');
        // console.log('cgp.length::', cgp.buffer.length);

        if (cgp) {

        } else {
            if (decodePal) {
                cgp = new Cgp(decodePal);

            } else {
                cgp = CGPMAP.get('palet_00.cgp');
            }
        }

        let colorIdx = -1;
        if (alphaColor) {
            // 在cgp.bgColor中查找alphaColor的色值
            // colorIdx = cgp.bgra.indexOf(alphaColor);
            for (let i = 0; i < cgp.bgra.length; i++) {
                let cgpColor = cgp.bgra[i];
                if (cgpColor[0] == alphaColor[0] && cgpColor[1] == alphaColor[1] && cgpColor[2] == alphaColor[2] && cgpColor[3] == alphaColor[3]) {
                    colorIdx = i;
                    break;
                }
            }
        } else if (autoAlpha) {
            // 找到imgData中,四个角的像素, 用于自动设置背景色, bmp像素顺序为从下到上, 从左到右
            let leftBottom = imgData.slice(0, 1)[0];
            let rightBottom = imgData.slice(this.imgWidth - 1, this.imgWidth)[0];
            let leftTop = imgData.slice(this.imgWidth * (this.imgHeight - 1), this.imgWidth * (this.imgHeight - 1) + 1)[0];
            let rightTop = imgData.slice(imgData.length - 1, imgData.length)[0];

            if (leftBottom == rightBottom && rightBottom == leftTop && leftTop == rightTop) {
                // 如果四个角的像素值相等, 则将调色板中这组色值改为alphaColor的色值
                colorIdx = leftBottom;
                console.log('autoAlpha');
            }
        }

        let bgraBuffer = cgp.bgraBuffer;

        if (colorIdx >= 0) {
            // 如果找到了色值, 则将调色板中这组色值改为alphaColor的色值
            for (let i = 0; i < 4; i++) {
                bgraBuffer[colorIdx * 4 + i] = changeColor[i];
            }
        }

        // 如果调色板长度小于1024(256色), win某些软件无法正常显示, 需补齐1024(256色)
        if (bgraBuffer.length < 1024) {
            let diff = 1024 - bgraBuffer.length;
            let addBuffer = Buffer.alloc(diff, 0x00);
            bgraBuffer = Buffer.concat([bgraBuffer, addBuffer]);
        }

        // 获得像素数据, 生成bmp文件
        let imgWidth = this.imgWidth;
        let imgHeight = this.imgHeight;
        let fileSize = 14 + 40 + bgraBuffer.length + imgData.length;

        let offset = 0;

        // bmp文件头 14位
        let bmpHead = Buffer.alloc(14);
        // 0-1字节固定为BM
        bmpHead.write('BM', 0, 2); offset += 2;
        // 2-5字节为文件大小, 文件头14+信息头40+调色盘1024+位图数据
        bmpHead.writeIntLE(fileSize, offset, 4); offset += 4;
        // 6-7字节保留, 为0
        bmpHead.writeIntLE(0, offset, 2); offset += 2;
        // 8-9字节保留, 为0
        bmpHead.writeIntLE(0, offset, 2); offset += 2;
        // 10-13字节为数据偏移量, 从文件头开始到实际图像数据的偏移量, 为bmp头14位+位图信息头40位+调色盘位
        bmpHead.writeIntLE(14 + 40 + bgraBuffer.length, offset, 4); offset += 4;

        // 位图信息头 40位
        let imgHead = Buffer.alloc(40); offset = 0;
        // 0-3字节为位图信息头大小, 固定为40
        imgHead.writeIntLE(40, offset, 4); offset += 4;
        // 4-7字节为图像宽度
        imgHead.writeIntLE(imgWidth, offset, 4); offset += 4;
        // 8-11字节为图像高度
        imgHead.writeIntLE(imgHeight, offset, 4); offset += 4;
        // 12-13字节为位图平面数, 固定为1
        imgHead.writeIntLE(1, offset, 2); offset += 2;
        // 14-15字节为每个像素的位数, 其值为1, 4, 8, 16, 24, 32, cg采用8位
        imgHead.writeIntLE(8, offset, 2); offset += 2;
        // 16-19位图像压缩方式, 0:BI_RGB不压缩(最常用), 1:BI_RLE8 8比特游程编码,只用于8位位图, 2:BI_RLE4 4比特游程编码, 只用于4位位图, 3:BI_bitfields 比特域, 用于16/32位位图, 4: JPEG, 5为PNG
        imgHead.writeIntLE(0, offset, 4); offset += 4;
        // 20-23位图数据大小
        // imgHead.writeIntLE(0, offset, 4); offset += 4;
        // imgHead.writeIntLE(fileSize, offset, 4); offset += 4;
        imgHead.writeIntLE(imgData.length, offset, 4); offset += 4;
        // 24-27水平分辨率, 像素/米
        imgHead.writeIntLE(0, offset, 4); offset += 4;
        // 28-31垂直分辨率, 像素/米
        imgHead.writeIntLE(0, offset, 4); offset += 4;
        // 32-35位图实际使用的调色板中的颜色数, 设置为0时表示使用全部调色板项, cg采用256色
        imgHead.writeIntLE(256, offset, 4); offset += 4;
        // 36-39位图显示过程中重要的颜色数, 设置为0时表示所有颜色都重要
        imgHead.writeIntLE(0, offset, 4); offset += 4;

        // 位图数据, 每个像素1个字节, 以该字节为索引, 在调色板中取颜色
        let bmpData = Buffer.concat([bmpHead, imgHead, bgraBuffer, imgData]);

        // 回调图片地址
        fs.writeFileSync(filePath, bmpData);
        callback(filePath);
    }

    /**
     * // TODO: 待验证从bmp文件初始化
     * @param {String} filePath BMP文件路径
     * @param {Function} callback 回调函数
     */
    initFromBMP(filePath, callback) {
        let bmpHex = fs.readFileSync(filePath);

        // 验证bmp文件头
        let bmpHead = bmpHex.slice(0, 2).toString();
        if (bmpHead !== 'BM') {
            throw new Error('错误的bmp文件头');
        }

        // 验证bmp位数
        let bitCount = bmpHex.slice(28, 30).readIntLE(0, 2);
        if (bitCount !== 8) {
            throw new Error('错误的bmp位数, 请使用8位bmp文件');
        }

        // 获取图片宽度
        let imgWidth = bmpHex.slice(18, 22).readIntLE(0, 4);
        // 获取图片高度
        let imgHeight = bmpHex.slice(22, 26).readIntLE(0, 4);
        // 获取调色板长度
        let palSize = bmpHex.slice(46, 50).readIntLE(0, 4);
        // 获取调色板数据
        let bgraBuffer = bmpHex.slice(54, 54 + palSize);
        // 将bgra调色板转换为bgr调色板
        let cgp = new Cgp().initFromBgra(bgraBuffer);
        console.log('cgp: ', cgp.bgra, cgp.bgr);
        let bgrBuffer = cgp.bgrBuffer;

        // 获取图片数据
        let imgData = bmpHex.slice(54 + palSize, bmpHex.length);
        // 压缩图片数据(可大幅度减少图片数据大小)
        let encodeImgData = this.encode(imgData);

        // 创建graphic数据头
        let graphicBuffer = Buffer.alloc(20);
        // 0-1字节固定为RD
        graphicBuffer.write('RD', 0, 2);
        // 2字节为版本, 自带调色板为3, 图片数据需加密
        graphicBuffer.writeIntLE(3, 2, 1);
        // 3字节未知, 写入0
        graphicBuffer.writeIntLE(0, 3, 1);
        // 4-7字节图片宽度
        graphicBuffer.writeIntLE(imgWidth, 4, 4);
        // 8-11字节图片高度
        graphicBuffer.writeIntLE(imgHeight, 8, 4);
        // 12-15字节块大小
        graphicBuffer.writeIntLE(20 + encodeImgData.length + bgrBuffer.length, 12, 4);
        // 16-19字节调色板长度
        graphicBuffer.writeIntLE(bgrBuffer.length, 16, 4);

        // 拼接 graphic数据头 + 图片数据 + 调色板数据
        let finalBuffer = Buffer.concat([graphicBuffer, encodeImgData, bgrBuffer]);

        this.buffer = finalBuffer;

        return this;
    }


    /** TODO: 生成png8格式图片
     * @param {String} filePath 生成图片的目录+文件名
     * @param {Array} alphaColor 设置背景色BGRA[0, 0, 0, 0]
     * @param {Cgp} cgp 调色板, 传入cgp>图片自带cgp>默认官方cgp
     * @param {Function} callback 回调函数
     */
    cratePNG(filePath, alphaColor, cgp, callback) {

    }
}


/** TODO: 动画文件类
 * 本类接收两个参数, 一个是动画信息文件, 一个是动画数据文件, 均为通过fs.readFileSync读取的十六进制数据
 */
class AFile {
    /**
     * 实例化
     * @param {String} graphicPath 
     * @param {String} graphicInfoPath 
     * @param {String} animePath 
     * @param {String} animeInfoPath 
     */
    constructor(graphicPath, graphicInfoPath, animePath, animeInfoPath) {
        this.graphicPath = graphicPath;
        this.graphicInfoPath = graphicInfoPath;
        this.animePath = animePath;
        this.animeInfoPath = animeInfoPath;

        this.animeBuffer = fs.readFileSync(animePath);
        this.animeInfoBuffer = fs.readFileSync(animeInfoPath);

        this.gFile = new GFile(graphicPath, graphicInfoPath);
        // console.log(this.gFile);

        this.data = new Map();

        this.updateMap();
    }

    updateMap() {
        this.data.clear();

        if (this.animeInfoBuffer.length % 12 !== 0) {
            throw new Error('animeInfoBuffer文件长度异常');
        }

        this.length = this.animeInfoBuffer.length / 12;

        for (let i = 0; i < this.length; i++) {
            let animeInfo = new AnimeInfo(this.animeInfoBuffer.slice(i * 12, i * 12 + 12), i);
            let startAddr = animeInfo.addr;
            let endAddr = null;
            if (i <= this.length - 2) {
                endAddr = new AnimeInfo(this.animeInfoBuffer.slice((i + 1) * 12, (i + 1) * 12 + 12), i + 1).addr;
            }

            endAddr = endAddr || this.animeBuffer.length;

            let anime = new Anime(this.animeBuffer.slice(startAddr, endAddr));

            let _data = { animeInfo, anime };
            this.data.set(animeInfo.animeId, _data);
            this.lastNode = _data;
        }
    }

    // 释放
    release() {
        this.animeBuffer = null;
        this.animeInfoBuffer = null;
        this.gFile.release();
        this.data = null;
    }

    /**
     * 通过下标编号获取动画数据(类似数组)
     * @param {Number} idx 下标编号
     * @returns {Object} 动画数据 {animeInfo, anime}
     */
    getDataByIndex(idx) {
        let keys = Array.from(this.data.keys());
        return this.data.get(keys[idx]);
    }

    /**
     * 通过动画编号获取动画数据
     * @param {Number} animeId 动画编号
     * @returns {Object} 动画数据 {animeInfo, anime}
     */
    getDataByAnimeId(animeId) {
        return this.data.get(animeId);
    }

    /** 导出动画
     * 
     * @param {Number} animeId 动画ID
     */
    exportAnime(animeId, path) {
        // 找到动画信息, 通过动画信息中的addr找到动画数据, 通过动画数据中的imgNum找到图片数据, 通过图片数据中的addr找到图片数据
        let aData = this.getDataByAnimeId(animeId);

        // 图片从0开始排, 动画帧中的图片编号也从0开始排
        // 动画编号不变, 动画addr重排, 动画帧图片重排, 图片重排

        // 1. 深拷贝动画信息, 修改addr, 并保存到新的动画信息文件
        let writeAinfoBuffer = Buffer.alloc(aData.animeInfo.buffer.length);
        aData.animeInfo.buffer.copy(writeAinfoBuffer);
        let writeAinfo = new AnimeInfo(writeAinfoBuffer, 0);
        writeAinfo.addr = 0;
        let aInfoPath = Path.join(path, `AnimeInfo_${animeId}.bin`);
        fs.writeFileSync(aInfoPath, writeAinfo.buffer);

        // TODO: 2. 获取要提取的图片, 查找调色板文件
        // NOTE: 有些图片调色板存在其它文件中, 需要遍历全部gInfo文件, 将调色板图片做好索引

        // 将所需图片数据保存到新的图片数据文件
        // console.log(aData.anime.imgList);
        this.gFile.exportMultGraphic(aData.anime.imgList, path, animeId);

        // TODO: 2.5 创建一个字典, 存储图片编号和图片数据的对应关系, 用于修改动画帧中的图片编号
        let imgNumDictionary = {};
        for (let i = 0; i < aData.anime.imgList.length; i++) {
            imgNumDictionary[aData.anime.imgList[i]] = i;
        }

        // 3. 深拷贝动画数据, 修改帧中的图片编号, 并保存到新的动画数据文件
        let writeABuffer = Buffer.alloc(aData.anime.buffer.length);
        aData.anime.buffer.copy(writeABuffer);
        let writeA = new Anime(writeABuffer);
        // console.log(writeA);
        for (let i = 0; i < writeA.actions.length; i++) {
            let action = writeA.actions[i];
            for (let j = 0; j < action.frames.length; j++) {
                let frame = action.frames[j];
                frame.imgNum = imgNumDictionary[frame.imgNum];
            }
        }

        let aPath = Path.join(path, `Anime_${animeId}.bin`);
        fs.writeFileSync(aPath, writeA.buffer);

        return this;
    }

    /** TODO: 批量导出动画
     * 
     * @param {Array} animeIdList 动画ID数组
     * @param {String} path 保存路径
     */
    exportMultAnime(animeIdList, path) {

        return this;
    }

    /** 添加动画
     * @param {AFile} aFile 被添加的动画文件
     * @param {Number} startNum 动画起始编号, 暂时需手动查询最大编号
     * @returns 
     */
    addAnime(aFile, startNum) {
        startNum = startNum || this.lastNode.animeInfo.animeId + 1;

        // 1. 将图片数据合并到this.gFile中, 并获取图片编号对应字典
        this.gFile.addGraphic(aFile.gFile);

        let imgNumDictionary = this.gFile.imgNumDictionary;

        // 2. 遍历aFile中的anime, 修改其frame中的图片编号
        // 3. 遍历aFile中的animeInfo, 修改其中的animeId, addr
        // 4. 将aFile中的animeBuffer, animeInfoBuffer 追加到this中
        // 5. 更新map      updateMap()
        let keys = Array.from(aFile.data.keys());
        let aInfoBufferList = [];
        let aBufferList = [];
        let offsetAddr = 0;
        let startAddr = this.animeBuffer.length;
        for (let i = 0; i < keys.length; i++) {
            let newAnimeId = startNum + i;
            // 检测newAnimeId是否已存在
            if (this.getDataByAnimeId(newAnimeId)) {
                throw new Error(`动画编号${newAnimeId}已存在`);
            }

            let _aData = aFile.getDataByAnimeId(keys[i]);
            let _animeInfo = _aData.animeInfo;
            let _anime = _aData.anime;

            // 修改animeInfo中的animeId, addr
            _animeInfo.animeId = newAnimeId;
            _animeInfo.addr = startAddr + offsetAddr;
            offsetAddr += _anime.buffer.length;

            // 修改anime中的frame中的图片编号
            for (let j = 0; j < _anime.actions.length; j++) {
                let _action = _anime.actions[j];
                for (let k = 0; k < _action.frames.length; k++) {
                    let _frame = _action.frames[k];
                    _frame.imgNum = imgNumDictionary[_frame.imgNum];
                }
            }

            // 将_animeInfo, _anime的buffer保存到数组中
            aInfoBufferList.push(_animeInfo.buffer);
            aBufferList.push(_anime.buffer);
        }

        // 将aInfoBufferList, aBufferList追加到this.animeInfoBuffer, this.animeBuffer中
        this.animeInfoBuffer = Buffer.concat([this.animeInfoBuffer, ...aInfoBufferList]);
        this.animeBuffer = Buffer.concat([this.animeBuffer, ...aBufferList]);

        // 更新map
        this.updateMap();

        return this;
    }

    /**
     * 删除动画
     * @param {Number} animeId 动画ID
     * @param {Boolean} delGraphic 是否删除对应图片, 默认是, 注意:删除对应图片后, 使用[魔力全图档查看器]会导致目标动画之后的动画显示错乱, 但进游戏中是正常的
     */
    deleteAnime(animeId, delGraphic=true) {
        let _aData = this.getDataByAnimeId(animeId);

        if (!_aData) {
            console.log(`animeID: [${animeId}] 不存在`);
            return this;
        }

        // NOTE: 魔力全图档查看器中读取动画时, 没有按真实的图片编号读取, 而是按照从0开始的顺序, 待测试游戏中是否如此, 如果真是如此, 则删除动画档时, 要么不删除图档, 要么把图档改为空图档, 以减小体积
        // 删除图片
        if(delGraphic){
            this.gFile.deleteMultGraphic(_aData.anime.imgList);
        }

        // 删除动画buffer
        let offsetAddr = _aData.anime.buffer.length;
        let animeStartAddr = _aData.animeInfo.addr;
        let animeEndAddr = _aData.animeInfo.addr + offsetAddr;
        let part0 = this.animeBuffer.slice(0, animeStartAddr);
        let part1 = this.animeBuffer.slice(animeEndAddr, this.animeBuffer.length);
        this.animeBuffer = Buffer.concat([part0, part1]);
        part0 = null;
        part1 = null;

        // 删除infoBuffer, 并更新之后的info中的addr
        let infoPart0 = this.animeInfoBuffer.slice(0, _aData.animeInfo.selfAddr);
        let infoPart1 = this.animeInfoBuffer.slice(_aData.animeInfo.selfAddr + 12, this.animeInfoBuffer.length);
        let restLen = infoPart1.length / 12;
        for (let i = 0; i < restLen; i++) {
            let tmpAInfo = new AnimeInfo(infoPart1.slice(i*12, i*12+12));
            tmpAInfo.addr -= offsetAddr;
        }
        this.animeInfoBuffer = Buffer.concat([infoPart0, infoPart1]);
        infoPart0 = null;
        infoPart1 = null;

        // 更新map
        this.updateMap();

        return this;
    }

    /** TODO: 批量删除动画
     * 
     * @param {Array} animeIdList 动画ID数组
     */
    deleteMultAnime(animeIdList) {

        return this;
    }

    /** TODO: 修改动画信息
     * 
     * @param {Number} animeId 动画ID
     * @param {Object} options {}
     */
    setAnimeInfo(animeId, options) { }

    /**
     * 保存文件
     * @param {String} gPath graphic文件地址, 默认原地址
     * @param {String} gInfoPath graphicInfo文件地址, 默认原地址
     * @param {String} aPath anime文件地址, 默认原地址
     * @param {String} aInfoPath animeInfo文件地址, 默认原地址
     * @returns 
     */
    save(gPath = null, gInfoPath = null, aPath = null, aInfoPath = null) {
        this.gFile.save(gPath, gInfoPath);
        aPath = aPath || this.animePath;
        aInfoPath = aInfoPath || this.animeInfoPath;
        fs.writeFileSync(aPath, this.animeBuffer);
        fs.writeFileSync(aInfoPath, this.animeInfoBuffer);
        return this;
    }
}


/**
 * 动画信息类
 */
class AnimeInfo {
    /**
     * 创建动画信息对象
     * @param {Buffer} buffer 十六进制动画信息数据
     * @param {Number} idx 该段数据在文件中的编号, 用于获取本条数据在文件中的地址selfAddr
     */
    constructor(buffer, idx) {
        this.buffer = buffer;
        this.selfAddr = idx * 12;
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


/**
 * 动画数据类
 */
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


/**
 * 动作类
 */
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

    createGIF(callback) {
        // TODO: 将本动作生成GIF, 使用gifencoder: https://github.com/eugeneware/gifencoder

    }
}


/**
 * 帧类
 */
class Frame {
    /**
     * 创建帧对象
     * @param {Buffer} buffer 十六进制帧数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // this.img = null; //是否直接获取图片数据?
    }

    get imgNum() {
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    set imgNum(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }
}


/**
 * Buffer扩展类
 */
class BufferExt {
    constructor(size) {
        this.buffer = Buffer.alloc(0);
    }

    /**
     * 追加写入hex
     * @param {Buffer} buffer 被写入的buffer 
     */
    write(buffer) {
        this.buffer = Buffer.concat([this.buffer, buffer]);
    }

    get length() {
        return this.buffer.length;
    }
}


// 游戏指定的调色板0-15 BGRA
const g_c0_15 = [
    [0x00, 0x00, 0x00],
    [0x80, 0x00, 0x00],
    [0x00, 0x80, 0x00],
    [0x80, 0x80, 0x00],
    [0x00, 0x00, 0x80],
    [0x80, 0x00, 0x80],
    [0x00, 0x80, 0x80],
    [0xc0, 0xc0, 0xc0],
    [0xc0, 0xdc, 0xc0],
    [0xa6, 0xca, 0xf0],
    [0xde, 0x00, 0x00],
    [0xff, 0x5f, 0x00],
    [0xff, 0xff, 0xa0],
    [0x00, 0x5f, 0xd2],
    [0x50, 0xd2, 0xff],
    [0x28, 0xe1, 0x28]
];


// 游戏指定的调色板240-255 BGRA
const g_c240_255 = [
    [0xf5, 0xc3, 0x96],
    [0x1e, 0xa0, 0x5f],
    [0xc3, 0x7d, 0x46],
    [0x9b, 0x55, 0x1e],
    [0x46, 0x41, 0x37],
    [0x28, 0x23, 0x1e],
    [0xff, 0xfb, 0xf0],
    [0x3a, 0x6e, 0x5a],
    [0x80, 0x80, 0x80],
    [0xff, 0x00, 0x00],
    [0x00, 0xff, 0x00],
    [0xff, 0xff, 0x00],
    [0x00, 0x00, 0xff],
    [0xff, 0x80, 0xff],
    [0x00, 0xff, 0xff],
    [0xff, 0xff, 0xff]
];


/**
 * 调色板类
 */
class Cgp {
    /**
     * 调色板类
     * @param {Buffer} buffer 调色板数据buffer
     * @param {Boolean} isDefault 是否为官方调色板, 默认否
     */
    constructor(buffer, isDefault = false) {
        this.buffer = buffer;
        this.isDefault = isDefault;
    }

    get bgr() {
        let colorList = [];
        let len = this.buffer.length / 3;
        for (let i = 0; i < len; i++) {
            let B = this.buffer[i * 3];
            let G = this.buffer[i * 3 + 1];
            let R = this.buffer[i * 3 + 2];

            colorList.push([B, G, R]);
        }

        if (this.isDefault) {
            // 官方调色板, 需增加前16色并从240开始覆盖后16色
            colorList = [...g_c0_15, ...colorList];
            colorList.length = 240;
            for (let i = 0; i < g_c240_255.length; i++) {
                colorList.push(g_c240_255[i]);
            }
        }

        return colorList;
    }

    setBGR(index, colorArray) {
        if (colorArray.length !== 3) {
            throw `wrong colorArray length: ${colorArray.length}`;
        }

        let bgr = this.bgr;
        for (let i = 0; i < 3; i++) {
            let colorValue = colorArray[i];
            if (colorValue < 0 || colorValue > 255) {
                throw `wrong colorValue: ${colorValue}`;
            }
            bgr[index][i] = colorValue;
        }

        this.buffer = Buffer.from(bgr);
    }

    setBGRA(index, colorArray) {
        console.log({ index, colorArray });
        if (colorArray.length !== 4) {
            throw `wrong colorArray length: ${colorArray.length}`;
        }
        for (let i = 0; i < colorArray.length; i++) {
            let colorValue = colorArray[i];
            if (colorValue < 0 || colorValue > 255) {
                throw `wrong colorValue: ${colorValue}`;
            }
            this.buffer[index * 4 + i] = colorValue;
        }
    }

    get bgrBuffer() {
        let colorList = this.bgr;
        let buffer = Buffer.alloc(0);
        for (let i = 0; i < colorList.length; i++) {
            let BGR = Buffer.from(colorList[i]);
            buffer = Buffer.concat([buffer, BGR]);
        }
        return buffer;
    }

    get bgra() {
        let colorList = [];
        let alpha = 0;

        if (this.isDefault) {
            for (let i = 0; i < g_c0_15.length; i++) {
                colorList.push([...g_c0_15[i], alpha]);
            }
        }

        let len = this.buffer.length / 3;
        for (let i = 0; i < len; i++) {
            let B = this.buffer[i * 3];
            let G = this.buffer[i * 3 + 1];
            let R = this.buffer[i * 3 + 2];
            // RGB RBG GBR GRB BRG BGR
            colorList.push([B, G, R, alpha]);
        }

        if (this.isDefault) {
            // 官方调色板, 从240开始覆盖后16色
            colorList.length = 240;
            for (let i = 0; i < g_c240_255.length; i++) {
                colorList.push([...g_c240_255[i], alpha]);
            }
        }

        return colorList;
    }

    get bgraBuffer() {
        let colorList = this.bgra;
        let buffer = Buffer.alloc(0);
        for (let i = 0; i < colorList.length; i++) {
            let BGRA = Buffer.from(colorList[i]);
            buffer = Buffer.concat([buffer, BGRA]);
        }
        return buffer;
    }

    /**
     * 从bgraBuffer初始化
     * @param {Buffer} bgraBuffer 
     */
    initFromBgra(bgraBuffer) {
        if (bgraBuffer.length % 4 !== 0) {
            throw new Error('错误的bgraBuffer');
        }

        let len = bgraBuffer.length / 4;
        let buffer = Buffer.alloc(0);
        for (let i = 0; i < len; i++) {
            let B = bgraBuffer[i * 4];
            let G = bgraBuffer[i * 4 + 1];
            let R = bgraBuffer[i * 4 + 2];
            buffer = Buffer.concat([buffer, Buffer.from([B, G, R])]);
        }

        this.buffer = buffer;
        this.isDefault = false;

        return this;
    }
}


const CGPMAP = new Map();
cgpInit();
function cgpInit() {
    let cgpList = fs.readdirSync(`${__dirname}/pal`);
    // console.log(cgpList);
    for (let i = 0; i < cgpList.length; i++) {
        CGPMAP.set(cgpList[i], new Cgp(fs.readFileSync(`${__dirname}/pal/${cgpList[i]}`), true));
    }

    CGPMAP.length = cgpList.length;
}



module.exports = { GFile, GraphicInfo, Graphic, AFile, AnimeInfo, Anime, Action, Frame, DecodeBuffer: BufferExt, Cgp }


