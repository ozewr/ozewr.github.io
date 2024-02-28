# Rust无畏并发

为了解决两个问题：

+ 怎么安全的进行系统变成

+ 怎么让并发编程变得轻松

这个两个问题看似正交，实际上可以用相似的工具解决问题。



Rust能够处理这两个问题依赖Rust的所有权。

## 所有权和借用

 ... 

## MEssage Passing

并发编程有很多种，但是最常用的一种是传递消息。

> Do not communicate by sharing memory;instead,share memory by communicating .
> 
> ---Effective Go

Rust的所有权可以轻易的达到以上的效果。

来看一个channel API

```rust
fn send<T:Send>(chan: &Channel<T>,t:T);
fn recv<T:Send>(chan: &Channel<>T) -> T
```

Send 意味着数据必须是被认为在线程之间发送是安全的。



这个send方法会传递走数据的所有权。

像下面这样就会出错，因为所有权被传递走了。

```rust
let mut vec = Vec::new();
send(&chan, vec)
print_vec(&vec)
```

在其他的语言中，当数据被发送到其他线程后，其他线程使用数据。当我们在此线程中，再次使用数据时，可能会发生竞态条件。或者发生一系列的bug：比如use after free ，double free等等。

## Locks

另一种处理并发的方法是使用共享状态，比如锁。

但是这个方法也不是很好：人们总是容易忘记获取锁，或者在错误的时间改变错误的数据。

但是Rust提供了一些方法让他变得易于使用



由于Rust的所有权的原因，线程之间是自动独立的，因为要改变一个数据，必须拥有它的所有权，或者是可变借用。但是这两者都是唯一的。

这可以让锁API直接挂在所有权上。

```rust
//create a new mutex
fn mutex<T:Send>(t:T) -> Mutex<T>

// acquire the lock
fn lock<T: Send>(mutex: &Mutex<T>) -> MutexGuard<T>;

// access the data protected by the lock
fn access<T: Send>(guard: &mut MutexGuard<T>) -> &mut T;
```

这样锁就可以挂在MutexGuard的所有权上，除非拥有MutexGurad,就无法改变数据。

来看一个例子

```rust
fn use_lock(mutex: &Mutex<Vec<i32>>) {
    let vec = {
        // acquire the lock
        let mut guard = lock(mutex);

        // attempt to return a borrow of the data
        access(&mut guard)

        // guard is destroyed here, releasing the lock
    };

    // attempt to access the data outside of the lock.
    vec.push(3);
}
```

```shell
error: `guard` does not live long enough
access(&mut guard)
            ^~~~~
```

这样可以避免我们必须考虑合适的时候加锁，解锁的问题。

## Tread safety and "Send"

通常将一个数据区分为线程安全的，或者不是线程安全的，线程安全的通常用了足够的内部同步来保证它是安全的。

例如

+ `Rc<T>`线程安全的

+ `Arc<T>`线程不安全的

当然，线程安全的的开销会小一点。

在Rust中很多类型是Send的代表他们可以安全的在线程中发送，但是也有一部分是!Send的，如果我们想要使用它，我们可以使用Arc将其包裹，然后对编译器说：这个是可以发送的，因为Arc是Send的。

可以看到之前的Channel和Mutex的数据要求都是Send类型的。

所以编译器实际上保护了我们不会写出不安全的代码。

## Sharing the stack: "scope"

...

## Data races

rust no date races




