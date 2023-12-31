const fs = require('fs');


const BG_COLOR = 0x00; //默认背景色
const DEFAULT_CPG_LEN = 768; //默认调色板长度

// 游戏指定的调色板0-15 BGR
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

// 游戏指定的调色板240-255 BGR
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

//调色板 白天00（） 傍晚01（发橙色） 黑夜02（发蓝色） 凌晨03
const g_palet = [
    { name: '白天', value: 'palet_00.cgp' },
    { name: '傍晚', value: 'palet_01.cgp' },
    { name: '黑夜', value: 'palet_02.cgp' },
    { name: '凌晨', value: 'palet_03.cgp' },
    { name: '4号', value: 'palet_04.cgp' },
    { name: '5号', value: 'palet_05.cgp' },
    { name: '6号', value: 'palet_06.cgp' },
    { name: '7号', value: 'palet_07.cgp' },
    { name: '8号', value: 'palet_08.cgp' },
    { name: '9号', value: 'palet_09.cgp' },
    { name: '10号', value: 'palet_10.cgp' },
    { name: '11号', value: 'palet_11.cgp' },
    { name: '12号', value: 'palet_12.cgp' },
    { name: '13号', value: 'palet_13.cgp' },
    { name: '14号', value: 'palet_14.cgp' },
    { name: '15号', value: 'palet_15.cgp' },
];


const { Cgp } = require('./base');

const CGPMAP = new Map();
cgpInit();
function cgpInit() {
    let cgpList = fs.readdirSync('./pal');
    // console.log(cgpList);
    for (let i = 0; i < cgpList.length; i++) {
        CGPMAP.set(cgpList[i], new Cgp(fs.readFileSync(`./pal/${cgpList[i]}`)));
    }

    CGPMAP.length = cgpList.length;
}


module.exports = { BG_COLOR, DEFAULT_CPG_LEN, g_c0_15, g_c240_255, g_palet, CGPMAP };