# CG图档操作工具 Node.js<br>

## 功能:
#### 1. 拆分图档为独立文件 √
#### 2. 合并图档为新文件  √
#### 3. 合并图档到现有文件  √
#### 4. 删除现有文件中指定的动画图档  √
#### 5. 图档解压  √
#### 6. 图档压缩   √
#### 7. 图档生成bmp  √
#### 8. 由bmp(8位)创建graphic对象  √
待测试
#### 9. 修复调色板(自带调色板模式)  √
待测试
#### 10. 修复调色板(全局调色板模式)
#### 11. bmp加入图档, bmpList加入动画档 
#### 12. 图形界面(Electron)
#### 13. 待补充<br><br><br>


## 方法:
#### splitAnimeById 通过动画编号拆分数据到独立数据文件
#### addAnimeById 将指定编号的独立数据文件合并到图档, 独立数据文件来源于 getAnimeById 方法
#### removeAnimeById 删除指定Id的动画档及图档
#### <br><br><br>


## 类:
#### G类, 图片类, 包含graphicInfo 和 graphic 数据
#### GraphicInfo类 图片信息类, 传入40位图片信息hex实例化
#### Graphic类 图片数据类, 传入图片数据hex实例化
#### A类, 动画类, 包含animeInfo 和 anime 数据
#### AnimeInfo类 动画信息类, 传入12位动画信息hex实例化
#### Anime类 动画数据类, 传入动画数据hex实例化
#### Action类 动作类, 传入动作数据hex实例化, 一般由Anime类实例化时处理
#### Frame类 帧类, 传入帧数据hex实例化, 一般由Anime类实例化时处理
#### Cgp类 调色板类, 传入调色板数据hex实例化
