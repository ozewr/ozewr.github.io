# Lab2: system calls

## 实验目的

通过本次实验，你将向系统内核添加一个新的系统调用跟踪功能。该功能将帮助你了解系统调用的工作原理，并使你熟悉内核的一些内部结构。在以后的实验中，你将添加更多的系统调用。本次实验将为后续的调试实验提供有力支持。

## 实验内容

1. 添加一个新的trace系统调用，用于控制系统调用跟踪。
2. trace系统调用接收一个整数“掩码”（mask）作为参数，指定要跟踪的系统调用。
3. 修改内核，在每个被跟踪的系统调用即将返回时打印相关信息，包括进程ID、系统调用名称和返回值。

## 实验结果

若看到以下输出则成功:

```shell
>> trace 32 grep hello README
3: syscall read -> 1023
3: syscall read -> 966
3: syscall read -> 70
3: syscall read -> 0
>> trace 2147483647 grep hello README
4: syscall trace -> 0
4: syscall exec -> 3
4: syscall open -> 3
4: syscall read -> 1023
4: syscall read -> 966
4: syscall read -> 70
4: syscall read -> 0
4: syscall close -> 0
>> grep hello README
>> trace 2 usertests forkforkfork
usertests starting
test forkforkfork: 407: syscall fork -> 408
408: syscall fork -> 409
409: syscall fork -> 410
410: syscall fork -> 411
409: syscall fork -> 412
410: syscall fork -> 413
409: syscall fork -> 414
411: syscall fork -> 415
...
>>
```

# 可选的挑战

- 打印所跟踪的系统调用的参数。
- 实现sysinfo系统调用。