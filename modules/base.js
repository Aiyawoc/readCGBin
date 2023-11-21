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


Buffer.prototype.insert = function(addr, hex){
    let oriHex = this;
    let part0 = oriHex.slice(0, addr);
    let part1 = oriHex.slice(addr, oriHex.length);
    Buffer.concat([part0, hex, part1]);
}


class GraphicInfo {
    /**
     * 创建图片信息对象
     * @param {Buffer} buffer 十六进制图片信息数据
     */
    constructor(buffer, isTF = false) {
        this.buffer = buffer;
        this.isTF = isTF;
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

    get unKnow(){
        return this.buffer.slice(31, 36);
    }

    set unKnow(num){
        return this.buffer.slice(31, 36);
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
    constructor(buffer, isTF=false) {
        this.buffer = buffer;
        this.isTF = isTF;
        // 0-1字节固定为RD
        // 2字节为版本, 偶數表示未壓縮，按位圖存放；奇數則表示壓縮過
        // 3字节未知
        // 4-7字节图片宽度
        // 8-11字节图片高度
        // 12-15字节块大小
        // NOTE: 新版本16-19位为调色板, 20-N位为图片数据
        // NOTE: 旧版本 16-N位为图片数据
    }

    get startBlock() {
        return this.buffer.slice(0, 2).toString();
    }

    set startBlock(str) {
        // TODO: 待验证修改Graphic
        this.buffer.slice(0, 2).write(str, 0, 2);
        return this.buffer.slice(0, 2).toString();
    }

    get version() {
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    set version(num) {
        this.buffer.slice(2, 3).writeIntLE(num, 0, 1);
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    get pad(){
        return this.buffer.slice(3, 4).readIntLE(0, 1);
    }

    set pad(num){
        this.buffer.slice(3, 4).writeIntLE(num, 0, 1);
        return this.buffer.slice(3, 4).readIntLE(0, 1);
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

    insertpalSize(num=768){
        if(this.version & 2){
            return this.buffer.slice(16, 20).readIntLE(0, 4);
        }
        
        let part0 = this.buffer.slice(0, 16);
        let paletteHex = Buffer.alloc(4);
        paletteHex.writeIntLE(num, 0, 4);
        let part1 = this.buffer.slice(16, this.buffer.length);
        this.buffer = Buffer.concat([part0, paletteHex, part1]);
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    get palSize() {
        if(this.version & 2){
            return this.buffer.slice(16, 20);
        }
        return 0;
    }

    set palSize(num) {
        if(this.version & 2){
            return this.buffer.slice(16, 20).writeIntLE(num, 0, 4);
        }
        return 0;
    }

    get pOffset(){
        if(this.version & 2){
            return 4;
        }
        return 0;
    }

    get imgData() {
        if(this.version & 2){
            return this.buffer.slice(20, this.imgSize);
        }
        return this.buffer.slice(16, this.imgSize);
    }

    set imgData(hex) {
        // TODO:替换Graphic的bmp数据
        if(this.version & 2){
            return this.buffer.slice(20, this.imgSize);
        }
        return this.buffer.slice(16, this.imgSize);
    }

    createBMP(callback){
        // TODO: 将本图像文件转为bmp
        // 调用encode将this.buffer解密
        // 获得像素数据, 生成bmp文件
        // 回调图片地址
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

    createGIF(callback){
        // TODO: 将本动作生成GIF

    }
}

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

module.exports = { GraphicInfo, Graphic, AnimeInfo, Anime, Action, Frame }