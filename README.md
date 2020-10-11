# DuDiskMenExport

### 百度云盘分享 文件库列表目录导出 Tampermonkey(油猴)脚本



导出文件库目录为HTML格式，以树形结构展示，可以用浏览器直接打开 也可以搜索节点名称。


![](https://github.com/Lusttime/DuDiskMenExport/blob/main/ztree.png "zTree树")

#### 目前存在的问题 ：

1. 目录层级如果过多导出时间会很慢造成页面假死，建议选中单个目录导出。
2. 只能在最顶级目录导出，不支持任意目录。


#### 如何使用：
使用 谷歌浏览器 或者 Microsoft Edge 去应用商店安装Tampermonkey插件并启用。
点击添加新脚本 ==> 跳转到编辑器页面 ==> 清空里面代码 ==> 复制DuDiskMenExport.js里面的代码到编辑器 ==> 保存。

打开百度云盘分享的文件库页面，此时会多出一个按钮。
![](https://github.com/Lusttime/DuDiskMenExport/blob/main/exp.png "导出页面")
