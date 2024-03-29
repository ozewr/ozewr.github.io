# RV32I

## RV32I指令格式

### 有六种基本指令格式：

*R类型* ：用于寄存器—寄存器类型



*I类型*  ：用于短立即数和访存load操作



*S类型* ：用于访存store


*B*类型 ：用于条件跳转



*U类型* ：用于长立即数


*J类型*   ：用于无条件跳转


### 指令格式设计的简洁点：

1.所有指令长都是32位长度（RV32I下）

2.指令提供三个寄存器操作数

3.对所有指令要求寄存器的标识符在同一位置（解码前就可以访问寄存器）



### RV32I指令

<img title="" src="file:///C:/Users/86158/AppData/Roaming/marktext/images/2022-10-10-19-55-26-image.png" alt="" data-align="center">



每种格式指令的规则

<img src="file:///C:/Users/86158/AppData/Roaming/marktext/images/2022-10-10-19-57-20-image.png" title="" alt="" data-align="center">

所有为0的地址为非法指令，跳转到这里会触发异常，可以用于调试

所有为1的地址为非法指令，用于捕获其他的错误，（硬件设备的错误）



为了给扩展留出空间，最基础的RV32I编码只占了1/8

使用共同数据通路的指令大部分操作码也是一样的



### 不同之处

ARM-32的12位立即数不仅是一个常量，还是一个函数输入（？）

总之这样设计，会增加乱序执行的复杂性。（debug）



*乱序执行处理器：告诉的，流水化的处理器。一有机会就会执行指令，不一定按照程序内部的顺序*



## RV32I寄存器

一共有32个寄存器，31个通用寄存器，一个0寄存器。

<img src="file:///C:/Users/86158/AppData/Roaming/marktext/images/2022-10-10-20-28-33-image.png" title="" alt="" data-align="center">

给一个0值寄存器的原因是可以简化指令，比如伪指令

## RV32I 整数计算

简单的算数指令，逻辑指令，位移指令都是从寄存器读取两个32位的值，并将32位结果写入目标寄存器。

立即数总是会进行符号扩展（可以不需要一个立即数版本的sub）



有对比较结果的优化：程序根据比较结果生成布尔值，RV32I提供一个小于时的置位指令。如果第一个操作数小于第二个操作数，它将目标寄存器设置位1，否则为0。（有有符号版本和无符号版本，也有立即数版本）



lui和auipc常常用于构造大的常数值和链接。

lui：加载立即数到高的20位

接着就可以用标准的立即指令来创建32位常量（立即数是12位）



auipc：向pc高位加上立即数（20位的立即数）便可以基于当前pc以任意偏移量转移控制流或者访问数据。

将auipc的20位立即数与jalr种的12位立即数组合就可以跳转到32位pc 的任何位置

而jar换成加载指令（立即数版本），那么我们可以访问任何32位pc相对地址的数据



不同：RV32I没有半字这类的整数计算。操作始终以完整的数据宽度计算。因为低宽度的数据访问能量消耗少，但是低宽度的运算不会。



RV32I没有乘除法，但是依旧可以完整的运行软件栈。



## RV32I中的load和store

RV32I支持加载有符号，无符号，半字。存储也支持半字

有符号和半字符号扩展为32位再加载寄存器。

低位宽度也会被扩展为32位之后才写入寄存器。



加载和存储的唯一寻址模式是，符号扩展12位立即数到基地址寄存器。（偏移寻址模式）



不同：

寻址方式只有一种

不支持延迟加载

没有特殊的堆栈指令

内存中存的数据可以步对齐（大概是在加载的时候会被扩展为32位猜的...debug）

## RV32I 条件分支

beq: 相等

bne：不相等

bge：大于等于（有无符号版本）

blt  ：小于（有无符号版本）

后两个可以更换操作数的位置得到相反的结果



分支指令的寻址方式是 12 位的立即数乘以 2， 符号扩展它，然后将得到值加到  

PC 上作为分支的跳转地址。

pc寻址可以用于位置无关代码，简化了连接器和加载器的工作



## RV32I无条件跳转

jal具有双重功能。 如果将吓一跳指令PC+4保存到ra中，便可以实现过程调用。

如果用x0寄存器替换ra，就可以无条件跳转。



跳转和链接（jalr）同样是多用途的。它可以使动态计算的函数地址，也可以实现调用返回（ra源寄存器，x0是0寄存器）switch语句可以使用。



## RV32I杂项

控制状态寄存器可以访问一些程序性能计数器。对于这些64位RV32I可以一次性读取32位。



ecall用于向运行环境发出请求

ebreak可以将指令控制权转移到调试环境

fence指令对外部可见的访存请求。如设备I/O访问等进行串行化。

fence.i 指令同步指令和数据流。

在执行 fence.i 指令之前，对于同一个硬件线程， RISC-V 不保证用存储指令写到内存 
指令区的数据可以被取指令取到。



## 系统指令




























