# Error Handling in Rust

从[Error Handling in Rust]([Error Handling in Rust - Andrew Gallant&#39;s Blog](https://blog.burntsushi.net/rust-error-handling/))文章学习，这里记录我自己的一些心得。

## why

首先看一组代码

```rust
fn guess(n: i32) -> bool {
    if n<1 || n>10
        panic!()
    n == 5
}
```

当一个错误发生的时候（n<1 or n > 10）,程序就会直接panic,显然，这并不是我们想要的，一个好程序需要鲁棒性。特别是在大型程序中，当一个位置出错时，程序应该有自己纠错的能力。

## Unwarpping explained

### Option type

```rust
enum Option<T> {
    None,
    Some(T),
}
```

Option type是rust的一种表示存在或者不存在的方法。我们可以用Some<T>和None来分别表示。那么，我们就可以通过match或者if let 来处理。

```rust
fn<T> foo() -> Option<T>{
    ...
}
fn main(){
    match foo() {
        None => {...}
        Some(i) => {...}
    }
}
```

当然，我们也可以不处理出现None的情况。在我们一些小实验，或者快速编程的时候，写这么长多少有点麻烦，我们可以通过unwarp方法将Option展开。

```rust
impl<T> Option<T> {
    fn unwarp(self) -> T {
        match self {
            Option::None => {panic!("...")}
            Option::Some(val) => val     
        }
    }
}

fn main (){
    let my_var = foo().unwarp();
}
```

但是这种方法会在值为None的时候直接panic,那么和我们最开始没有处理是一样的了，所以只建议在需要快速编程的时候使用。

### Composeing Option<T>

重新看回我们处理错误的代码：

```rust
fn<T> foo() -> Option<T>{
    ...
}
fn main(){
    match foo() {
        None => {...}
        Some(i) => {...}
    }
}
```

这样的代码没问题，但是显示的错误处理并不是很优雅，因为我们每次都必须要处理为None的情况。所以我们可以使用一些方法来使我们的代码变得更优雅。例如使用map

```rust
impl<T> Option<T> {
    fn<U,F> map(self,f:F) -> Option<U>
    where
        F:FnOnce(T) -> U
    {
        match self{
            None => None 
            Some(x) => Some(fx)
        }
    }
}
```

所以我们的代码就可以改成这样

```rust
fn main(){
    foo().map(|x| ... )
}
```

再来看这样一个例子

```rust
fn extension(file_name: &str)-> Option<&str>{
       find(file_name,".").map(|i| &file_name[i+=1..])
}
```

可以看到我们比较优雅的处理了为None的情况。但是在有时候，这个方法也会有点问题。比如，当为None的时候我们需要返回一个默认情况，同样也会有相应的方法：unwarp_or 

```rust
fn unwrap_or<T>(option: Option<T>, default: T) -> T {
    match option {
        None => default,
        Some(value) => value,
    }
}
```

当然这个默认的值也必须是一个和T相同类型的值，来看一个使用

```rust
fn unwrap_or<T>(option: Option<T>, default: T) -> T {
    match option {
        None => default,
        Some(value) => value,
    }
}
```

还有一个值得注意的事情，map一般作用于改变自己内部的方法。那么假设现在我需得到一个值(这个值本身是Option类型的)，但是这个值不是本Option而是其他的Option,那么用map就会有一点类型上小问题。而且也不符合我们对map的设计。我们用了另一个方法and_then方法。它和map实现非常相似

```rust
fn and_then<F, T, A>(option: Option<T>, f: F) -> Option<A>
        where F: FnOnce(T) -> Option<A> {
    match option {
        None => None,
        Some(value) => f(value),
    }
}
```

接下来我们来看一个例子

```rust
//not good
fn file_path_ext_explicit(file_path:&str) -> Option<&str> {
    match file_name(file_path) {
        None => None,
        Some(name) => match extension（name）{
            None=>None,
            Some(ext) => Some(ext),
        }
    }
} 
fn file_name(file_path: &str) -> Option<&str>{
    ...
}
//oh yeah
fn file_path_ext(file_path: &str) -> Option<&str> {
    file_name(file_path).and_then(extension)
}
```

## The Result type

```rust
enum Result<T,E> {
    Ok(T),
    Err(E),
}
```

Resule相当于Option的一个扩展版，它能处理更广泛的错误。

当然Result也有unwarp方法，和Option的一样会panic。

同样我们也可以通过match来处理错误。

注意，虽然Result是需要两个类型`Result<T,E>`但是在一些情况下我们是可以省略第二个参数的，例如：

```rust
use std::num::ParseIntError;
use std::result;
type Result<T> = result::Result<T,ParseIntError>;
fn do_sth(number_str:&str) -> Result<i32>{
    todo!()
}
```

## Working with multiple error types

### Composing Option and Result

到目前为止，我们讨论的都是一个函数里面出现单个错误的情况，但是有很多情况下我们处理的错误都是比较复杂的，举个例子

```rust
use std::env;
fn double_arg(P:AsRef<Path>(file_path:P) -> Todo {
    let mut file = File::open(file_path).unwarp();//error 1
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwarp();//error 2
    let n:i32 = contents.trim().parse().unwarp();//error 3 
    2*n
}
fn main(){
    let doubled = file_double("foobar");
}
```

此时我们有三个错误

1.`Result<T,io::Error>`

2.`Result<T,io::Error>`

3.`Result<T,ParseIntError>`

我们要处理的话，一个合理的方法是将他们都转化为相同的类型，比如转化为String就是一个合理的选择。

```rust
use std::fs::File;
use std::io::Read;
use std::path::Path;
fn file_double<P:AsRef<Path>>(file_path:P) -> Result<i32,String> {
    File::open(file_path)
                .map_err(|err| err.to_string()
                .and_then(|mut file|{
                    let mut contents = String::new();
                    file.read_to_string(&mut contents)
                        .map_err(|err|err.to_string())
                        .map(|_|contents)
                })
                .and_then(|contents| {
                    contests.trim().parse::<i32>()
                        .map_err(|err|err.to_string)
                })
                .map(|n|2*n)
}

fn main(){
    match file_double("foobar") {
        Ok(n) => println("{}",n),
        Err(err) => println("Error: {}",err),
    }
}
```

我们做了三个map_err第一个在open(file_path),将`Result<T,io::Error>`转化成了`Result<T,String>`通过一个map_err();后面的逻辑都是一样的。但是看这个代码，当然可读性不是很高。而且写的时候也需要一定经验才能写出这种代码。

或者我们可以使用early_return的方式

```rust
use std::fs::File;
use std::io::Read;
use std::path::Path;

fn file_double<P: AsRef<Path>>(file_path: P) -> Result<i32, String> {
    let mut file = match File::open(file_path) {
        Ok(file) => file,
        Err(err) => return Err(err.to_string()),
    };
    let mut contents = String::new();
    if let Err(err) = file.read_to_string(&mut contents) {
        return Err(err.to_string());
    }
    let n: i32 = match contents.trim().parse() {
        Ok(n) => n,
        Err(err) => return Err(err.to_string()),
    };
    Ok(2 * n)
}

fn main() {
    match file_double("foobar") {
        Ok(n) => println!("{}", n),
        Err(err) => println!("Error: {}", err),
    }
}
```

这种代码就很容易写出来，而且也解决了问题。但是还是稍微有点臃肿。当然是可以再优化一下的，这种比较重复的代码我们是可以通过宏来解决的，标准库里面也有相应的宏`?`。

来看一个例子

```rust
use std::fs::File;
use std::io::Read;
use std::path::Path;

fn file_double<P: AsRef<Path>>(file_path: P) -> Result<i32, String> {
    let mut file = File::open(file_path).map_err(|e| e.to_string())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(|e| e.to_string())?;
    let n = contents.trim().parse::<i32>().map_err(|e| e.to_string())?;
    Ok(2 * n)
}

fn main() {
    match file_double("foobar") {
        Ok(n) => println!("{}", n),
        Err(err) => println!("Error: {}", err),
    }
}
```

这里还是个early return的方法。这样看起来就会简单多了。但是后面还是用了一个map_err()可不可以把这个map_err也消除掉呢。当然是可以的但是还需要一点前置的知识。

### Define your own error type

看我们上面的例子，我们为了消除返回不同的错误类型的影响，而把错误返回成`Result<String>` 但是string给我们带回的消息，对于程序来说是有限的，它只能打印出来，然后交给user去解决这个问题。如何让程序自己处理错误呢

我们可以定义一个自己的错误类型，然后用map_err（）转化成我们的类型

举个例子。

```rust
use std::io;
use std::num;
#[derive(Debug)]
enum CliErfn file_double<P: AsRef<Path>>(file_path: P) -> Result<i32, CliError> {
    let mut file = File::open(file_path).map_err(CliError::Io)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(CliError::Io)?;
    let n: i32 = contents.trim().parse().map_err(CliError::Parse)?;
    Ok(2 * n)
}

fn main() {
    match file_double("foobar") {
        Ok(n) => println!("{}", n),
        Err(err) => println!("Error: {:?}", err),
    }
}ror {
    Io(io::Error),
    Parse(num::ParseIntError),
}

use std::fs::File;
use std::io::Read;
use std::path::Path;
```

这样我们就可以让程序自己处理错误了。

## Standard libary traits used for error handling

std库里面主要有两个trait：

std::error::Error,

std::convert::From

Error trait 是专门为Error准备的，From有更一般的用途。

```rust
use std::fmt::{Debug,Display};
trait Error: Debug + Display {
    fn description(&self) -> &str
    cn cause(&self)->Option<&Error> {None}
}
```

这个特征实现之后至少可以做三件事：

- 获取错误的debug表示

- 得到一个user-facing的Display表示

- 检查错误的原因

举个例子

```rust
use std::error;
use std::fmt;

impl fmt::Display for CliError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            // Both underlying errors already impl `Display`, so we defer to
            // their implementations.
            CliError::Io(ref err) => write!(f, "IO error: {}", err),
            CliError::Parse(ref err) => write!(f, "Parse error: {}", err),
        }
    }
}

impl error::Error for CliError {
    fn description(&self) -> &str {
        // Both underlying errors already impl `Error`, so we defer to their
        // implementations.
        match *self {
            CliError::Io(ref err) => err.description(),
            // Normally we can just write `err.description()`, but the error
            // type has a concrete method called `description`, which conflicts
            // with the trait method. For now, we must explicitly call
            // `description` through the `Error` trait.
            CliError::Parse(ref err) => error::Error::description(err),
        }
    }

    fn cause(&self) -> Option<&error::Error> {
        match *self {
            // N.B. Both of these implicitly cast `err` from their concrete
            // types (either `&io::Error` or `&num::ParseIntError`)
            // to a trait object `&Error`. This works because both error types
            // implement `Error`.
            CliError::Io(ref err) => Some(err),
            CliError::Parse(ref err) => Some(err),
        }
    }
    impl error::Error for CliError {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match *self {
                CliError::Io(ref err) => err.source(),
                CliError::Parse(ref err) => err.source()
                }
            }
    }
    
}
```

在1.42以后的rust版本description和cause是被弃用了的。现在应该之用实现source（）函数就行（可以看看手册）

### The From trait

```rust
pub trait From<T>: Sized {
    // Required method
    fn from(value: T) -> Self;
}
```

非常简单的一段代码，但是非常好用的一段代码。

From是一个类型转换的工具。但是它对error有什么用呢？

来看一段代码：

```rust
impl<'a,E:Error+'a> From<E> for Box<Error+'a>
```

它将E转化成了一个`Box<Error>`类型,但是这个又有什么用呢？

我们先来介绍一下之前提到的`?` 这个操作符可以展开Result,它其实是一个过程宏

```rust
#[macro_export]
#[stable(feature = "rust1", since = "1.0.0")]
#[deprecated(since = "1.39.0", note = "use the `?` operator instead")]
#[doc(alias = "?")]
macro_rules! r#try {
    ($expr:expr $(,)?) => {
        match $expr {
            $crate::result::Result::Ok(val) => val,
            $crate::result::Result::Err(err) => {
                return $crate::result::Result::Err($crate::convert::From::from(err));
            }
        }
    };
}
```

所以之前我们的map_err也可以去掉变成

```rust
use std::error::Error;
use std::fs::File;
use std::io::Read;
use std::path::Path;

fn file_double<P: AsRef<Path>>(file_path: P) -> Result<i32, Box<Error>> {
    let mut file = File::open(file_path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let n = contents.trim().parse::<i32>()?;
    Ok(2 * n)
}
```

我们是去掉了map_err（）但是这个返回类型任然是对程序不透明的，我们该怎么做呢？

我们自己为我们的err_type实现一下就好了。

```rust
impl From<io::Error> for CliError {
    fn from(err: io::Error) -> CliError{
        CliError::Io(err)
    }
}
impl From<num::ParseIntError> for CliError{
    fn from(err: num::ParseIntError)->CliError {
        CliError::Parse(err)
    }
}
```

当我们为我们的CliError实现这个trait之后我们就可以直接返回啦

```rust
fn file_double<P: AsRef<Path>>(file_path: P) -> Result<i32, CliError> {
    let mut file = File::open(file_path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let n: i32 = contents.trim().parse()?;
    Ok(2 * n)
}
```

## Case study : A program to read population data
