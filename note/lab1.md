# Lab1: user utils

## 启动系统

```shell
$ git clone https://github.com/MEssap/xxos.git
$ cd xxos
$ git checkout show
$ make qemu
```

若看到以下输出则启动成功:

![success.png](https://s2.loli.net/2024/05/26/hwEUAa9IsrRC2OG.png)

## hello world

### 实验目的

通过本次实验，你将学习如何在poos下编写和运行一个简单的"Hello World"程序。这将帮助你理解基本的程序结构和编译过程，并为后续的深入学习打下基础。

### 实验内容

1. 编写一个简单的"Hello World"程序。
2. 使用合适的编译器将程序编译为可执行文件。
3. 在本系统上运行该程序，并观察输出结果。

### 实验结果

若看到以下输出则成功:

![hello_world.png](https://s2.loli.net/2024/05/26/JeBba3qVDKpIOZn.png)

## Ping-Pong

### 实验目的

通过本次实验，你将学习如何使用UNIX系统调用在两个进程之间进行“ping-pong”通信。你将使用两个管道，每个方向一个，父进程和子进程之间传递一个字节。这将帮助你理解进程间通信（IPC）的基本机制，并为后续的系统编程打下基础。

### 实验内容

1. 使用UNIX系统调用创建两个管道。
2. 父进程向子进程发送一个字节。
3. 子进程接收到字节后，打印消息，并向父进程发送一个字节。
4. 父进程接收到字节后，打印消息，然后退出。

### 实验结果

若看到以下输出则成功:

```shell
>> pingpong
4: received ping
3: received pong
>>
```